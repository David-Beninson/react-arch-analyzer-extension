from bson import ObjectId
from fastapi import HTTPException
from models import AnalysisRun, CodeComponent, ComponentRelation
from schemas.analysis import AnalysisCreateInput

class AnalysisService:
    @staticmethod
    async def create_new_analysis(payload: AnalysisCreateInput) -> dict:
        run = AnalysisRun(
            project_name=payload.project_name,
            root_path=payload.root_path,
            git_commit=payload.git_commit
        )
        await run.insert()

        components_to_insert = [
            CodeComponent(
                run=run, name=c.name, file_path=c.file_path,
                is_exported=c.is_exported, hooks=c.hooks, state_variables=c.state_variables
            ) for c in payload.components
        ]
        if components_to_insert:
            await CodeComponent.insert_many(components_to_insert)

        relations_to_insert = [
            ComponentRelation(
                run=run, parent_name=r.parent_name, child_name=r.child_name,
                props_passed=[p.model_dump() for p in r.props_passed]
            ) for r in payload.relations
        ]
        if relations_to_insert:
            await ComponentRelation.insert_many(relations_to_insert)

        return {"message": "Analysis run stored successfully", "run_id": str(run.id)}

    @staticmethod
    async def get_all_runs() -> list:
        return await AnalysisRun.find_all().to_list()

    @staticmethod
    async def get_analysis_by_id(run_id: str) -> dict:
        if not ObjectId.is_valid(run_id):
            raise HTTPException(status_code=400, detail="Invalid run_id format")

        obj_id = ObjectId(run_id)
        run = await AnalysisRun.get(obj_id)
        if not run:
            raise HTTPException(status_code=404, detail="Analysis run not found")

        components = await CodeComponent.find({"run.$id": obj_id}).to_list()
        relations = await ComponentRelation.find({"run.$id": obj_id}).to_list()

        return {
            "run": run,
            "components": components,
            "relations": relations
        }
