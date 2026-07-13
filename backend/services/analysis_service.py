from bson import ObjectId
from fastapi import HTTPException

from models import AnalysisRun, CodeComponent, ComponentRelation
from models.User import User
from schemas.analysis import AnalysisCreateInput


class AnalysisService:

    @staticmethod
    async def create_new_analysis(payload: AnalysisCreateInput, owner: User) -> dict:
        """Persist a full analysis run and link it to the authenticated owner."""
        run = AnalysisRun(
            project_name=payload.project_name,
            root_path=payload.root_path,
            git_commit=payload.git_commit,
            owner=owner,
        )
        await run.insert()

        if payload.components:
            await CodeComponent.insert_many([
                CodeComponent(
                    run=run, name=c.name, file_path=c.file_path,
                    is_exported=c.is_exported, hooks=c.hooks,
                    state_variables=c.state_variables,
                ) for c in payload.components
            ])

        if payload.relations:
            await ComponentRelation.insert_many([
                ComponentRelation(
                    run=run, parent_name=r.parent_name, child_name=r.child_name,
                    props_passed=[p.model_dump() for p in r.props_passed],
                ) for r in payload.relations
            ])

        return {"message": "Analysis run stored successfully", "run_id": str(run.id)}

    @staticmethod
    async def get_all_runs(owner: User) -> list:
        """Return only the runs that belong to *owner*."""
        return await AnalysisRun.find(AnalysisRun.owner.id == owner.id).to_list()

    @staticmethod
    async def get_analysis_by_id(run_id: str, owner: User) -> dict:
        """Return full run data, enforcing ownership."""
        if not ObjectId.is_valid(run_id):
            raise HTTPException(status_code=400, detail="Invalid run_id format")

        obj_id = ObjectId(run_id)
        run = await AnalysisRun.get(obj_id)

        if not run:
            raise HTTPException(status_code=404, detail="Analysis run not found")

        # Reject if the run belongs to a different user
        if str(run.owner.ref.id) != str(owner.id):
            raise HTTPException(status_code=403, detail="Access denied")

        components = await CodeComponent.find({"run.$id": obj_id}).to_list()
        relations = await ComponentRelation.find({"run.$id": obj_id}).to_list()

        return {"run": run, "components": components, "relations": relations}
