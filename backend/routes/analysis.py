from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from schemas.analysis import AnalysisCreateInput
from services.analysis_service import AnalysisService

from utils.serializers import serialize_run, serialize_component, serialize_relation 

router = APIRouter(
    prefix="/api/analysis",
    tags=["analysis"]
)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_analysis(payload: AnalysisCreateInput):
    result = await AnalysisService.create_new_analysis(payload)
    return result


@router.get("/")
async def list_runs():
    runs = await AnalysisService.get_all_runs()
    return JSONResponse(content=[serialize_run(r) for r in runs])


@router.get("/{run_id}")
async def get_run_analysis(run_id: str):
    data = await AnalysisService.get_analysis_by_id(run_id)
    
    return JSONResponse(content={
        "run": serialize_run(data["run"]),
        "components": [serialize_component(c) for c in data["components"]],
        "relations": [serialize_relation(r) for r in data["relations"]],
    })
