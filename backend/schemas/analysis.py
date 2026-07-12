from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PropInfoInput(BaseModel):
    name: str
    type: str
    is_callback: bool = False

class ComponentInput(BaseModel):
    name: str
    file_path: str
    is_exported: bool = False
    hooks: List[str] = Field(default_factory=list)
    state_variables: List[str] = Field(default_factory=list)

class RelationInput(BaseModel):
    parent_name: str
    child_name: str
    props_passed: List[PropInfoInput] = Field(default_factory=list)

class AnalysisCreateInput(BaseModel):
    project_name: str
    root_path: Optional[str] = None
    git_commit: Optional[str] = None
    components: List[ComponentInput]
    relations: List[RelationInput]

class RunResponse(BaseModel):
    id: str = Field(alias="_id")
    project_name: str
    root_path: Optional[str]
    git_commit: Optional[str]
    created_at: Optional[str]

    class Config:
        populate_by_name = True
