def _get_ref_id(link) -> str | None:
    """Safely extract the string ID from a Beanie Link or plain document."""
    if not link:
        return None
    if hasattr(link, "ref"):
        return str(link.ref.id)
    if hasattr(link, "id"):
        return str(link.id)
    return None


def _get_run_id(doc) -> str | None:
    """Return the string run ID stored on a component/relation document."""
    if not doc or not hasattr(doc, "run") or not doc.run:
        return None
    return _get_ref_id(doc.run) or str(doc.run)


def serialize_run(run) -> dict:
    if not run:
        return {}
    return {
        "_id": str(run.id),
        "project_name": run.project_name,
        "root_path": run.root_path,
        "git_commit": run.git_commit,
        # owner is exposed only as an ID — never leak credentials
        "owner_id": _get_ref_id(run.owner),
        "created_at": run.created_at.isoformat() if getattr(run, "created_at", None) else None,
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
        "state_variables": comp.state_variables,
        "contexts_defined": getattr(comp, "contexts_defined", []),
        "contexts_provided": getattr(comp, "contexts_provided", []),
        "contexts_consumed": getattr(comp, "contexts_consumed", []),
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
