# API documentation

`openapi.yaml` is the shared API contract for this Flask backend. Update it whenever a registered route, request, response, or authentication rule changes.

## View all endpoints

Open `openapi.yaml` in Swagger Editor (`https://editor.swagger.io/`) to browse the endpoints and try requests. Use **Authorize** with the access token returned by `POST /api/auth/login` for routes marked with the bearer lock.

You can also import this OpenAPI file into Postman or use an OpenAPI client generator to create a typed client for React Native.

## React Native base URL

- Android emulator: use `http://10.0.2.2:5700` instead of `localhost`.
- Physical phone: use the development computer's LAN IP, for example `http://192.168.1.10:5700`, and make sure both devices can reach each other.
- iOS simulator: `http://localhost:5700` usually reaches the host machine.

The `servers` URL in the OpenAPI file is the backend's local development URL. Change it for another environment, or configure the client base URL per build environment.

## Current implementation notes

- The `sensors` blueprint is not registered in `backend/app.py`, so its routes are not part of the running API yet.
- `GET /api/devices/{device_id}` returns the device joined to its sensor rows. The `data` value is an array, and device fields repeat when it has multiple sensors.
- Plant image upload uses multipart form data; fetching the returned `image_url` returns raw image bytes, not the standard JSON envelope.
- JWT protected endpoints require `Authorization: Bearer <access_token>`.
