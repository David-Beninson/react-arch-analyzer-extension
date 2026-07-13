from datetime import datetime
from typing import Optional
from beanie import Document, Link
from pydantic import Field
from models.User import User

class AnalysisRun(Document):
    project_name: str
    root_path: Optional[str] = None
    git_commit: Optional[str] = None
    owner: Optional[Link[User]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "analysis_runs"