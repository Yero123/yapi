import uuid
from collections.abc import Iterator
from datetime import date

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from sqlalchemy.orm import Session

from app.chat.tools import build_tools
from app.config import get_settings

SYSTEM_PROMPT = """You are Yapi's assistant inside a personal finance app. Today is {today}.
You help the user record expenses and incomes, manage categories and budgets, and understand their money.

Rules:
- Amounts are US dollars.
- Use the tools for every figure you state. Never invent or estimate numbers; if nothing is recorded, say so.
- To record a transaction you need an amount. If it is missing, ask for it and create nothing.
- Pick the category from the user's existing categories; call list_categories when unsure. If none fits, ask.
- A budget is an expense category with a monthly limit. If the user names a category that does not exist, say so and offer to create it.
- You can only see and change this user's own data.
- Reply briefly in plain text, in the language the user writes in. No markdown tables."""


def get_chat_model() -> BaseChatModel:
    settings = get_settings()
    return ChatOpenAI(model=settings.llm_model, base_url=settings.llm_base_url, api_key=settings.llm_api_key or "missing", temperature=0)


class ThinkFilter:
    """Drops <think>...</think> spans that some models put inline in their reply, across chunk boundaries."""

    OPEN, CLOSE = "<think>", "</think>"

    def __init__(self) -> None:
        self.buffer = ""
        self.thinking = False

    def feed(self, text: str) -> str:
        self.buffer += text
        out = []
        while self.buffer:
            marker = self.CLOSE if self.thinking else self.OPEN
            index = self.buffer.find(marker)
            if index >= 0:
                if not self.thinking:
                    out.append(self.buffer[:index])
                self.buffer = self.buffer[index + len(marker):]
                self.thinking = not self.thinking
                continue
            # keep a tail that could be the start of a marker split across chunks
            keep = next((n for n in range(len(marker) - 1, 0, -1) if self.buffer.endswith(marker[:n])), 0)
            if not self.thinking:
                out.append(self.buffer[: len(self.buffer) - keep])
            self.buffer = self.buffer[len(self.buffer) - keep:] if keep else ""
            break
        return "".join(out)


def _text(message: BaseMessage) -> str:
    content = message.content
    if isinstance(content, str):
        return content
    return "".join(block.get("text", "") for block in content if isinstance(block, dict) and block.get("type") == "text")


def run_agent(model: BaseChatModel, db: Session, guest_id: uuid.UUID, history: list[BaseMessage], message: str, today: date | None = None) -> Iterator[dict]:
    """Yields {"type": "token", "text"} and {"type": "tool_result", "result"} events."""
    today = today or date.today()
    results: list[dict] = []
    agent = create_react_agent(model, build_tools(db, guest_id, results, today), prompt=SYSTEM_PROMPT.format(today=today.isoformat()))
    think = ThinkFilter()
    sent = 0
    for mode, payload in agent.stream({"messages": [*history, HumanMessage(message)]}, stream_mode=["messages", "updates"]):
        if mode == "messages":
            chunk = payload[0]
            if isinstance(chunk, AIMessage) and not isinstance(chunk, ToolMessage):
                text = think.feed(_text(chunk))
                if text:
                    yield {"type": "token", "text": text}
        while sent < len(results):
            yield {"type": "tool_result", "result": results[sent]}
            sent += 1
    if think.buffer and not think.thinking:
        yield {"type": "token", "text": think.buffer}
