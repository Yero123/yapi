"""Fixed sets the UI knows how to draw: icon keys, color keys and a new guest's categories."""

ICONS = ("home", "food", "bus", "music", "bag", "heart", "briefcase", "laptop", "zap")
COLORS = ("blue", "peach", "mint", "yellow", "pink", "green", "lavender", "coral")
KINDS = ("expense", "income")

# name, kind, icon, color, monthly limit in cents
DEFAULT_CATEGORIES = (
    ("Housing", "expense", "home", "blue", None),
    ("Food & Dining", "expense", "food", "peach", None),
    ("Transport", "expense", "bus", "mint", None),
    ("Entertainment", "expense", "music", "yellow", None),
    ("Shopping", "expense", "bag", "pink", None),
    ("Health", "expense", "heart", "coral", None),
    ("Salary", "income", "briefcase", "green", None),
    ("Freelance", "income", "laptop", "lavender", None),
)
