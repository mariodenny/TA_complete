from flask import Blueprint, request
from middlewares.Jwt import create_access_token
from handler.JsonHandler import json_response
from .repository import check_user_exists, login_user, register_user, get_user_by_id, update_password

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")
    username = data.get("username")

    if not all(isinstance(value, str) and value.strip() for value in (email, password, username)):
        return json_response(
            message="Email, password, and username are required",
            status_code=400,
        )
    if len(password.encode("utf-8")) > 72:
        return json_response(message="Password must be 72 bytes or fewer", status_code=400)
    if check_user_exists(email):
        return json_response(message="Email is already registered", status_code=409)

    user_id = register_user(email.strip(), password, username.strip())
    if user_id is None:
        return json_response(message="Email is already registered", status_code=409)

    return json_response(
        data={"user_id": user_id},
        message="User registered successfully",
        status_code=201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    # Validate input
    if not isinstance(email, str) or not email.strip() or not isinstance(password, str) or not password:
        return json_response(message="Email and password are required", status_code=400)

    # Authenticate user
    user_id = login_user(email.strip(), password)
    if not user_id:
        return json_response(message="Invalid email or password", status_code=401)

    # Generate JWT token
    access_token = create_access_token(user_id)

    return json_response(
        data={"user_id": user_id, "access_token": access_token, "token_type": "Bearer"},
        message="Login successful",
        status_code=200,
    )

# routes for user profile
@auth_bp.route("/<int:user_id>/user", methods=["GET"])
def user_profile(user_id):
    # Fetch user profile from the database
    user = get_user_by_id(user_id)
    if not user:
        return json_response(message="User not found", status_code=404)

    # Return user profile data
    return json_response(
        data={"user": user},
        message="User profile retrieved successfully",
        status_code=200,
    )
    
# routes reset password
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    new_password = data.get("new_password")

    # Validate input
    if not isinstance(email, str) or not email.strip() or not isinstance(new_password, str) or not new_password:
        return json_response(message="Email and new password are required", status_code=400)

    # Check if user exists
    if not check_user_exists(email.strip()):
        return json_response(message="User not found", status_code=404)

    # Update password in the database
    success = update_password(email.strip(), new_password)
    if not success:
        return json_response(message="Failed to reset password", status_code=500)

    return json_response(
        message="Password reset successfully",
        status_code=200,
    )
    