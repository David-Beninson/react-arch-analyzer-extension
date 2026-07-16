from typing import List
from beanie import Document, Link
from models.AnalysisRun import AnalysisRun


class CodeComponent(Document):
    run: Link[AnalysisRun]
    name: str
    file_path: str
    is_exported: bool = False
    hooks: List[str] = []
    state_variables: List[str] = []
    contexts_defined: List[str] = []
    contexts_provided: List[str] = []
    contexts_consumed: List[str] = []

    class Settings:
        name = "code_components"
