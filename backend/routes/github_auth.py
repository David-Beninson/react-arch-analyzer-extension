"""
GitHub OAuth endpoint.

Flow:
  1. Extension calls vscode.authentication.getSession('github', [...])
  2. Extension sends the resulting accessToken here: POST /api/auth/github
  3. We validate the token against the real GitHub API (GET /user)
  4. We upsert the User by github_id (stable across token refreshes)
  5. We return our own short-lived JWT — identical format to the existing flow
"""

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from models.User import User
from utils.auth import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


class GitHubTokenInput(BaseModel):
    access_token: str


@router.post("/github", status_code=status.HTTP_200_OK)
async def github_sign_in(payload: GitHubTokenInput):
    """
    Validate a GitHub access token and return our own JWT.
    Creates the user on first sign-in; updates display info on subsequent ones.
    """
    headers = {
        "Authorization": f"Bearer {payload.access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Fetch GitHub user profile
        gh_resp = await client.get(GITHUB_USER_URL, headers=headers)
        if gh_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid GitHub access token",
            )
        gh_user = gh_resp.json()

        # 2. Try to get a verified primary email (the /user endpoint may omit it
        #    for users who keep their email private)
        primary_email: str | None = gh_user.get("email")
        if not primary_email:
            emails_resp = await client.get(GITHUB_EMAILS_URL, headers=headers)
            if emails_resp.status_code == 200:
                for entry in emails_resp.json():
                    if entry.get("primary") and entry.get("verified"):
                        primary_email = entry["email"]
                        break

    github_id = str(gh_user["id"])
    display_name: str = gh_user.get("name") or gh_user.get("login") or "GitHub User"
    avatar_url: str | None = gh_user.get("avatar_url")

    # 3. Upsert by github_id
    user = await User.find_one(User.github_id == github_id)
    if user:
        user.display_name = display_name
        user.avatar_url = avatar_url
        if primary_email:
            user.email = primary_email
        await user.save()
    else:
        user = User(
            github_id=github_id,
            display_name=display_name,
            avatar_url=avatar_url,
            email=primary_email,
        )
        await user.insert()

    # 4. Issue our own JWT (sub = MongoDB ObjectId as string)
    jwt_token = create_access_token(str(user.id))
    return {"access_token": jwt_token, "token_type": "bearer"}
