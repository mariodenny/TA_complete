"""Background MQTT worker that stores soil moisture telemetry in MySQL."""

import json
import logging
import os

import mysql.connector
import paho.mqtt.client as mqtt
from dotenv import load_dotenv


load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("mqtt-worker")

TOPIC_FILTER = "soil/v1/devices/+/telemetry"


def database_connection():
    """Open a fresh MySQL connection for this message."""
    required = ("DB_HOST", "DB_USER", "DB_NAME")
    missing = [key for key in required if not os.getenv(key)]
    if missing:
        raise RuntimeError(f"Missing database environment variables: {', '.join(missing)}")

    return mysql.connector.connect(
        host=os.environ["DB_HOST"],
        user=os.environ["DB_USER"],
        password=os.getenv("DB_PASSWORD", ""),
        database=os.environ["DB_NAME"],
    )


def parse_telemetry(topic, payload):
    """Return (device_id, moisture_percent), or raise ValueError."""
    parts = topic.split("/")
    if len(parts) != 5 or parts[:3] != ["soil", "v1", "devices"] or parts[4] != "telemetry":
        raise ValueError("unexpected telemetry topic")

    try:
        device_id = int(parts[3])
    except ValueError as exc:
        raise ValueError("device ID in topic must be an integer") from exc
    if device_id <= 0:
        raise ValueError("device ID must be positive")

    try:
        data = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("payload must be valid UTF-8 JSON") from exc
    if not isinstance(data, dict):
        raise ValueError("payload must be a JSON object")

    moisture = data.get("moisture_percent")
    # bool is a subclass of int in Python, so reject it explicitly.
    if isinstance(moisture, bool) or not isinstance(moisture, int):
        raise ValueError("moisture_percent must be an integer")
    if not 0 <= moisture <= 100:
        raise ValueError("moisture_percent must be between 0 and 100")

    return device_id, moisture


def save_soil_moisture(device_id, moisture):
    """Insert a reading for the device's soil_moisture sensor."""
    connection = database_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            SELECT s.id
            FROM sensors AS s
            INNER JOIN devices AS d ON d.id = s.device_id
            WHERE d.id = %s AND s.type = 'soil_moisture'
            ORDER BY s.id
            LIMIT 1
            """,
            (device_id,),
        )
        sensor = cursor.fetchone()
        if sensor is None:
            raise ValueError(f"device {device_id} has no soil_moisture sensor registered")

        cursor.execute(
            "INSERT INTO soil_moisture_data (sensor_id, value) VALUES (%s, %s)",
            (sensor[0], moisture),
        )
        cursor.execute("UPDATE devices SET is_online = 1 WHERE id = %s", (device_id,))
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code.is_failure:
        logger.error("MQTT connection failed: %s", reason_code)
        return

    logger.info("Connected to MQTT broker; subscribing to %s", TOPIC_FILTER)
    result, _ = client.subscribe(TOPIC_FILTER, qos=1)
    if result != mqtt.MQTT_ERR_SUCCESS:
        logger.error("Could not subscribe to %s (error %s)", TOPIC_FILTER, result)


def on_message(client, userdata, message):
    try:
        device_id, moisture = parse_telemetry(message.topic, message.payload)
        save_soil_moisture(device_id, moisture)
        logger.info("Saved soil moisture %s%% for device %s", moisture, device_id)
    except ValueError as exc:
        logger.warning("Ignoring MQTT message on %s: %s", message.topic, exc)
    except mysql.connector.Error:
        logger.exception("Database error saving MQTT message on %s", message.topic)
    except Exception:
        logger.exception("Unexpected error handling MQTT message on %s", message.topic)


def create_client():
    host = os.getenv("MQTT_HOST")
    if not host:
        raise RuntimeError("MQTT_HOST is required")

    try:
        port = int(os.getenv("MQTT_PORT", "1883"))
    except ValueError as exc:
        raise RuntimeError("MQTT_PORT must be an integer") from exc

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id=os.getenv("MQTT_CLIENT_ID", "soil-monitoring-backend"),
    )
    client.on_connect = on_connect
    client.on_message = on_message

    username = os.getenv("MQTT_USERNAME")
    password = os.getenv("MQTT_PASSWORD")
    if username:
        client.username_pw_set(username, password)

    if os.getenv("MQTT_USE_TLS", "false").strip().lower() in {"1", "true", "yes"}:
        client.tls_set()

    return client, host, port


def main():
    client, host, port = create_client()
    logger.info("Connecting to MQTT broker at %s:%s", host, port)
    try:
        client.connect(host, port, keepalive=60)
        client.loop_forever()
    except KeyboardInterrupt:
        logger.info("Stopping MQTT worker")
    finally:
        client.disconnect()


if __name__ == "__main__":
    main()
