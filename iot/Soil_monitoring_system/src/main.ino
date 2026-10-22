#include<WiFi.h>
#include<HTTPClient.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>


// WIFI credentials note : use 2.4Ghz wifi only
#define WIFI_SSID "Ternak Lele"
#define WIFI_PASSWORD "11221122"


const int soilMoisturePin = 4;
const int dryValue = 3170;
const int wetValue = 1250;

int readSoilMoisture() {
  int raw = analogRead(soilMoisturePin);
  return constrain(map(raw, dryValue, wetValue, 0, 100), 0, 100);
}

bool sendMoistureDataToServer(int percentage) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;
  http.begin("http://your-server.com/api/soil-moisture");
  http.addHeader("Content-Type", "application/json");

  DynamicJsonDocument doc(1024);
  doc["moisture"] = percentage;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);
  http.end();

  return httpResponseCode == HTTP_CODE_OK;
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  if(WiFi.status() != WL_CONNECTED){
    Serial.println("Connecting to WiFi...");
    while(WiFi.status() != WL_CONNECTED){
      delay(1000);
      Serial.print(".");
    }
  }
  Serial.print("Connected to WiFi. IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  int percentage = readSoilMoisture();

  Serial.print("Moisture: ");
  Serial.print(percentage);
  Serial.println("%");

  if (percentage < 30) {
    Serial.println("Status: Needs water");
  } else if (percentage < 70) {
    Serial.println("Status: Moisture OK");
  } else {
    Serial.println("Status: Too wet");
  }

  delay(1000);
}