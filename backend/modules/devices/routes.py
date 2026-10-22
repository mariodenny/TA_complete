from flask import Blueprint, g, request
from handler.JsonHandler import json_response
from middlewares.Jwt import verify_jwt
from .repository import *


device_bp = Blueprint('devices', __name__, url_prefix='/api/devices')


@device_bp.before_request
def protect_device_routes():
    return verify_jwt()

# get all devices routes

# create device route
@device_bp.route("/", methods=["POST"])
def get_devices():
    data = request.get_json(silent=True) or {}
    result = create_device(
        name=data.get("name"),
        location=data.get("location"),
        mac_address=data.get("mac_address"),
        user_id=int(g.current_user_id)
    )
    return json_response(data={"device_id": result}, message="Device created successfully", status_code=201)

@device_bp.route("/<int:device_id>", methods=["GET"])
def get_device(device_id):
    device = get_device_by_id_with_sensors(device_id)
    if not device:
        return json_response(data=None, message="Device not found", status_code=404)
    return json_response(data=device, message="Device retrieved successfully")


@device_bp.route("/test", methods=["GET"])
def test():
    return json_response(data={"message": "Test successful"}, message="Test successful", status_code=200)
