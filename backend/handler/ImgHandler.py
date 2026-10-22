from pathlib import Path
from uuid import uuid4

from flask import Blueprint, abort, current_app, send_from_directory, url_for


MAX_IMAGE_BYTES = 5 * 1024 * 1024

_IMAGE_FORMATS = {
    "jpeg": (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
    "png": (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
    "gif": (".gif", lambda data: data.startswith((b"GIF87a", b"GIF89a"))),
    "webp": (
        ".webp",
        lambda data: len(data) >= 12 and data.startswith(b"RIFF") and data[8:12] == b"WEBP",
    ),
}
_IMAGE_MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
}

plant_image_bp = Blueprint("plant_images", __name__)


@plant_image_bp.route("/media/plants/<filename>", methods=["GET"])
def serve_plant_image(filename):
    """Serve uploaded plant images with an inline image content type."""
    extension = Path(filename).suffix.lower()
    mimetype = _IMAGE_MIME_TYPES.get(extension)
    if mimetype is None:
        abort(404)

    upload_dir = Path(current_app.static_folder) / "uploads" / "plants"
    response = send_from_directory(
        upload_dir,
        filename,
        mimetype=mimetype,
        as_attachment=False,
        download_name=filename,
    )
    response.headers["Content-Disposition"] = "inline"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


def save_image(uploaded_file):
    """Save an uploaded image under static/uploads/plants and return its URL path."""
    if uploaded_file is None or not uploaded_file.filename:
        raise ValueError("An image file is required")

    content = uploaded_file.stream.read(MAX_IMAGE_BYTES + 1)
    if not content:
        raise ValueError("The uploaded image is empty")
    if len(content) > MAX_IMAGE_BYTES:
        raise ValueError("Image must be 5 MB or smaller")

    image_format = next(
        (name for name, (_, matches) in _IMAGE_FORMATS.items() if matches(content)),
        None,
    )
    if image_format is None:
        raise ValueError("Only JPEG, PNG, GIF, and WebP images are supported")

    extension = _IMAGE_FORMATS[image_format][0]
    filename = f"{uuid4().hex}{extension}"
    upload_dir = Path(current_app.static_folder) / "uploads" / "plants"
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(content)

    return url_for("plant_images.serve_plant_image", filename=filename, _external=True)


def delete_image(image_url):
    """Remove an image previously saved by save_image (used after DB failures)."""
    if not image_url:
        return

    filename = Path(image_url).name
    if not filename:
        return

    image_path = Path(current_app.static_folder) / "uploads" / "plants" / filename
    image_path.unlink(missing_ok=True)
