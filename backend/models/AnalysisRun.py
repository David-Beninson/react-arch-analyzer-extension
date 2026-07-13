from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class AnalysisRun(Document):
    project_name: str
    root_path: Optional[str] = None
    git_commit: Optional[str] = None
    username: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "analysis_runs"