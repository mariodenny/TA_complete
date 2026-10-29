#include <WiFi.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

// Use the computer's LAN IPv4 address here (not 127.0.0.1).
// The broker must have a listener accessible from the ESP32.
const char *WIFI_SSID = "Ternak Lele";
const char *WIFI_PASSWORD = "11221122";
const char *MQTT_HOST = "192.168.1.10"; // TODO: replace with vps ip
const uint16_t MQTT_PORT = 1883;
const char *MQTT_USERNAME = ""; // Fill these if Mosquitto authentication is configured.
const char *MQTT_PASSWORD = "";
const char *DEVICE_ID = "42"; // TODO: replace with this device's ID from the database

const int soilMoisturePin = 4;
const int dryValue = 3170;
const int wetValue = 1250;
const unsigned long publishIntervalMs = 10000;
const unsigned long reconnectIntervalMs = 5000;

WiFiClient networkClient;
PubSubClient mqttClient(networkClient);
String telemetryTopic;
String mqttClientId;
unsigned long lastPublishMs = 0;
unsigned long lastMqttReconnectAttemptMs = 0;
unsigned long lastWifiReconnectAttemptMs = 0;

int readSoilMoisture() {
  const int raw = analogRead(soilMoisturePin);
  return constrain(map(raw, dryValue, wetValue, 0, 100), 0, 100);
}

void connectToWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Connected to WiFi. ESP32 IP address: ");
  Serial.println(WiFi.localIP());
}

bool connectToMqtt() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  Serial.print("Connecting to MQTT broker at ");
  Serial.print(MQTT_HOST);
  Serial.print(":");
  Serial.println(MQTT_PORT);

  bool connected;
  if (MQTT_USERNAME[0] != '\0') {
    connected = mqttClient.connect(
      mqttClientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD
    );
  } else {
    connected = mqttClient.connect(mqttClientId.c_str());
  }

  if (connected) {
    Serial.println("Connected to MQTT broker.");
  } else {
    Serial.print("MQTT connection failed, state=");
    Serial.println(mqttClient.state());
  }
  return connected;
}

void publishSoilMoisture(int percentage) {
  JsonDocument doc;
  doc["moisture_percent"] = percentage;

  String payload;
  serializeJson(doc, payload);

  if (mqttClient.publish(telemetryTopic.c_str(), payload.c_str())) {
    Serial.print("Published to ");
    Serial.print(telemetryTopic);
    Serial.print(": ");
    Serial.println(payload);
  } else {
    Serial.println("MQTT publish failed.");
  }
}

void setup() {
  Serial.begin(115200);

  telemetryTopic = String("soil/v1/devices/") + DEVICE_ID + "/telemetry";
  mqttClientId = String("soil-esp32-") + DEVICE_ID;

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  connectToWifi();
  connectToMqtt();
}

void loop() {
  const unsigned long now = millis();

  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastWifiReconnectAttemptMs >= reconnectIntervalMs) {
      lastWifiReconnectAttemptMs = now;
      Serial.println("WiFi disconnected; reconnecting...");
      WiFi.reconnect();
    }
    delay(10);
    return;
  }

  if (!mqttClient.connected()) {
    if (now - lastMqttReconnectAttemptMs >= reconnectIntervalMs) {
      lastMqttReconnectAttemptMs = now;
      connectToMqtt();
    }
  } else {
    mqttClient.loop();
  }

  if (now - lastPublishMs >= publishIntervalMs) {
    lastPublishMs = now;
    const int percentage = readSoilMoisture();

    Serial.print("Moisture: ");
    Serial.print(percentage);
    Serial.println("%");

    if (mqttClient.connected()) {
      publishSoilMoisture(percentage);
    } else {
      Serial.println("Skipping publish because MQTT is disconnected.");
    }
  }

  delay(10);
}
