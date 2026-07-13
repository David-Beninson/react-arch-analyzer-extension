def _get_run_id(doc) -> str | None:
    if not doc or not hasattr(doc, "run") or not doc.run:
        return None
    run = doc.run
    if hasattr(run, "id") and run.id:
        return str(run.id)
    if hasattr(run, "ref") and hasattr(run.ref, "id"):
        return str(run.ref.id)
    return str(run)

def serialize_run(run) -> dict:
    if not run:
        return {}
    return {
        "_id": str(run.id),
        "project_name": run.project_name,
        "root_path": run.root_path,
        "git_commit": run.git_commit,
        "username": getattr(run, "username", None),
        "created_at": run.created_at.isoformat() if hasattr(run, "created_at") and run.created_at else None
    }

def serialize_component(comp) -> dict:
    if not comp:
        return {}
    return {
        "_id": str(comp.id),
        "run_id": _get_run_id(comp),
        "name": comp.name,
        "file_path": comp.file_path,
        "is_exported": comp.is_exported,
        "hooks": comp.hooks,
        "state_variables": comp.state_variables
    }

def serialize_relation(rel) -> dict:
    if not rel:
        return {}
    return {
        "_id": str(rel.id),
        "run_id": _get_run_id(rel),
        "parent_name": rel.parent_name,
        "child_name": rel.child_name,
        "props_passed": rel.props_passed
    }
