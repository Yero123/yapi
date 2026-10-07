import json
import logging
import time
import uuid
from collections import defaultdict, deque
from collections.abc import Iterator
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.chat.agent import get_chat_model, run_agent
from app.config import get_settings
from app.db import get_session_factory
from app.deps import CurrentGuest, Db
from app.errors import DomainError, RateLimited
from app.models import ChatMessage
from app.schemas import ChatIn, ChatMessageOut

router = APIRouter(prefix="/chat", tags=["chat"])
log = logging.getLogger(__name__)

_recent: dict[uuid.UUID, deque[float]] = defaultdict(deque)


def check_rate_limit(guest_id: uuid.UUID) -> None:
    limit = get_settings().chat_rate_limit_per_minute
    now = time.monotonic()
    stamps = _recent[guest_id]
    while stamps and now - stamps[0] > 60:
        stamps.popleft()
    if len(stamps) >= limit:
        raise RateLimited("You are sending messages too fast. Wait a moment and try again.")
    stamps.append(now)


def _event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@router.get("/history", response_model=list[ChatMessageOut])
def history(db: Db, guest: CurrentGuest):
    return list(db.scalars(select(ChatMessage).where(ChatMessage.guest_id == guest.id).order_by(ChatMessage.created_at)))


@router.post("")
def chat(
    body: ChatIn,
    guest: CurrentGuest,
    model: Annotated[BaseChatModel, Depends(get_chat_model)],
    session_factory: Annotated[sessionmaker[Session], Depends(get_session_factory)],
):
    settings = get_settings()
    message = body.message.strip()
    if not message:
        raise DomainError("Write a message first.")
    if len(message) > settings.chat_max_message_chars:
        raise DomainError(f"Messages can be up to {settings.chat_max_message_chars} characters.")
    check_rate_limit(guest.id)
    guest_id = guest.id

    def stream() -> Iterator[str]:
        # The request-scoped session is closed by the time the body streams, so this owns its own.
        with session_factory() as db:
            past = list(db.scalars(select(ChatMessage).where(ChatMessage.guest_id == guest_id).order_by(ChatMessage.created_at.desc()).limit(settings.chat_history_window)))
            history_messages = [HumanMessage(m.content) if m.role == "user" else AIMessage(m.content) for m in reversed(past)]
            db.add(ChatMessage(guest_id=guest_id, role="user", content=message))
            db.commit()

            text, results = "", []
            try:
                for event in run_agent(model, db, guest_id, history_messages, message):
                    if event["type"] == "token":
                        text += event["text"]
                    else:
                        results.append(event["result"])
                    yield _event(event)
            except Exception:
                log.exception("assistant failed")
                db.rollback()
                yield _event({"type": "error", "message": "The assistant is unavailable right now. Try again in a moment."})
                return

            reply = ChatMessage(guest_id=guest_id, role="assistant", content=text.strip(), tool_results=results or None)
            db.add(reply)
            db.commit()
            yield _event({"type": "done", "id": str(reply.id)})

    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
