from flask import Blueprint, g, request

from handler.ImgHandler import delete_image, save_image
from handler.JsonHandler import json_response
from middlewares.Jwt import verify_jwt
from .repository import *


plant_bp = Blueprint("plants", __name__, url_prefix="/api/plants")


@plant_bp.before_request
def protect_plant_routes():
    return verify_jwt()


@plant_bp.route("/", methods=["GET"])
def list_plants():
    plants = get_user_plants(int(g.current_user_id))
    return json_response(data=plants, message="Plants retrieved successfully")


@plant_bp.route("/", methods=["POST"])
def add_plant():
    name = request.form.get("name", "").strip()
    location = request.form.get("location", "").strip()
    device_id_value = request.form.get("device_id")
    image_file = request.files.get("image")

    if not name or not location or image_file is None:
        return json_response(
            message="Name, location, and image are required",
            status_code=400,
        )

    try:
        device_id = int(device_id_value) if device_id_value else None
        image_url = save_image(image_file)
    except ValueError as error:
        return json_response(message=str(error), status_code=400)

    try:
        plant_id = create_plant(
            user_id=int(g.current_user_id),
            device_id=device_id,
            name=name,
            location=location,
            image_url=image_url,
        )
    except Exception:
        delete_image(image_url)
        raise

    return json_response(
        data={"plant_id": plant_id, "image_url": image_url},
        message="Plant created successfully",
        status_code=201,
    )


# method get plant by id
@plant_bp.route("/<int:plant_id>", methods=["GET"])
def get_plant(plant_id):

    plant = get_plant_by_id(plant_id)
    if not plant:
        return json_response(message="Plant not found", status_code=404)

    return json_response(data=plant, message="Plant retrieved successfully")

# method to get plant by user id
@plant_bp.route("/<int:user_id>/user", methods=["GET"])
def get_plants_by_user(user_id):
    plants = get_user_plants(user_id)
    if not plants:
        return json_response(message="No plants found for this user", status_code=404)

    return json_response(data=plants, message="Plants retrieved successfully")

# method to update plant by id
@plant_bp.route("/<int:plant_id>", methods=["PUT"])
def update_plant_route(plant_id):
    name = request.form.get("name")
    location = request.form.get("location")
    image_file = request.files.get("image")

    image_url = None
    if image_file:
        try:
            image_url = save_image(image_file)
        except ValueError as error:
            return json_response(message=str(error), status_code=400)

    success = update_plant(
        plant_id=plant_id,
        name=name,
        location=location,
        image_url=image_url,
    )

    if not success:
        if image_url:
            delete_image(image_url)
        return json_response(message="Plant not found or no fields to update", status_code=404)

    return json_response(message="Plant updated successfully")

@plant_bp.route("/<int:plant_id>", methods=["DELETE"])
def delete_plant_route(plant_id):
    plant = get_plant_by_id(plant_id)
    if not plant:
        return json_response(message="Plant not found", status_code=404)

    # Delete the image associated with the plant
    if plant.get("image_url"):
        delete_image(plant["image_url"])

    success = delete_plant(plant_id)
    if not success:
        return json_response(message="Failed to delete plant", status_code=500)

    return json_response(message="Plant deleted successfully")

# setting plant treshold
@plant_bp.route("/<int:plant_id>/treshold", methods=["POST"])
def create_plant_treshold_route(plant_id):
    data = request.get_json(silent=True) or {}
    soil_percentage = data.get("soil_percentage")
    humidity_percentage = data.get("humidity_percentage")
    temp_c = data.get("temp_c")
    lux = data.get("lux")

    treshold_id = create_plant_treshold(
        plant_id=plant_id,
        soil_percentage=soil_percentage,
        humidity_percentage=humidity_percentage,
        temp_c=temp_c,
        lux=lux
    )

    return json_response(
        data={"treshold_id": treshold_id},
        message="Plant treshold created successfully",
        status_code=201,
    )

# get plant treshold by plant id
@plant_bp.route("/treshold/<int:plant_id>")
def get_treshold_by_plant_id(plant_id):
    treshold = get_plant_treshold_by_plant_id(plant_id)
    if not treshold:
        return json_response(message="treshold for this plant not found", status_code=404)

    return json_response(
        data = treshold,
        message="success",
        status_code=200
    )
    