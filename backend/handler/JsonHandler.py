from flask import jsonify, make_response
from typing import Any, Optional, Union

def json_response(
    data: Optional[Union[dict, list, str]] = None,
    message: Optional[str] = None,
    error: Optional[Union[dict, list, str, Exception]] = None,
    status_code: int = 200
):
    """
    Self-detecting JSON response handler.
    Automatically flags success/error based on status_code or presence of 'error'.
    Handles dicts (objects) and lists (arrays) naturally.
    """
    # Auto-detect failure if status_code is 4xx/5xx OR if an error was passed
    is_error = status_code >= 400 or error is not None

    # If an error was provided but user forgot to set a 4xx/5xx code, default to 400
    if is_error and status_code < 400:
        status_code = 400

    # Auto-assign standard fallback messages if none provided
    if not message:
        message = "Operation failed" if is_error else "Operation successful"

    payload = {
        "success": not is_error,
        "message": message,
    }

    if is_error:
        # If an Exception object was passed, extract its text
        error_detail = str(error) if isinstance(error, Exception) else error
        payload["error"] = error_detail if error_detail is not None else message
        payload["data"] = None
    else:
        # Preserves dict (JSON object) or list (JSON array)
        payload["data"] = data

    return make_response(jsonify(payload), status_code)