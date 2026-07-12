from typing import List
from beanie import Document, Link
from models.AnalysisRun import AnalysisRun


class ComponentRelation(Document):
    run: Link[AnalysisRun]
    parent_name: str
    child_name: str
    props_passed: List[dict] = []  # Each dict: {"name": str, "type": str, "is_callback": bool}

    class Settings:
        name = "component_relations"
