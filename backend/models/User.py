from typing import Optional

from beanie import Document
from pydantic import EmailStr


class User(Document):
    # GitHub-based identity (primary identifier after OAuth migration)
    github_id: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

    # Kept for backward-compatibility with any existing email/password users
    email: Optional[str] = None
    hashed_password: Optional[str] = None

    class Settings:
        name = "users"
