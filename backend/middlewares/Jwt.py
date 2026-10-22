from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app, g, jsonify, request
from jwt.exceptions import InvalidTokenError


def _secret_key():
    secret = current_app.config.get("SECRET_KEY")
    if not secret:
        raise RuntimeError("Flask SECRET_KEY must be configured to use JWT authentication")
    return secret


def create_access_token(user_id, expires_in=timedelta(hours=1)):
    """Create a signed JWT for an authenticated user."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + expires_in,
    }
    return jwt.encode(payload, _secret_key(), algorithm="HS256")


def verify_jwt():
    """Flask before_request hook: reject requests without a valid Bearer token."""
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token.strip():
        response = jsonify({"success": False, "message": "Bearer token required"})
        response.status_code = 401
        response.headers["WWW-Authenticate"] = "Bearer"
        return response

    try:
        payload = jwt.decode(
            token.strip(),
            _secret_key(),
            algorithms=["HS256"],
            options={"require": ["sub", "exp", "iat"]},
        )
    except InvalidTokenError:
        response = jsonify({"success": False, "message": "Invalid or expired token"})
        response.status_code = 401
        response.headers["WWW-Authenticate"] = 'Bearer error="invalid_token"'
        return response

    g.current_user_id = payload["sub"]
    return None
