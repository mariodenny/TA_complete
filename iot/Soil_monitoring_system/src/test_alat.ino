#include <DHT.h>

// DHT22
constexpr uint8_t DHT_PIN = 19;
constexpr uint8_t DHT_TYPE = DHT22;
DHT dht(DHT_PIN, DHT_TYPE);

// Relay aktif low
constexpr uint8_t RELAY_PIN = 26;

// Sensor kelembapan tanah (ADC1 pada ESP32)
constexpr uint8_t SOIL_PIN = 34;

// Nilai kalibrasi sensor: sesuaikan dengan hasil pengukuran perangkat.
constexpr int DRY_VALUE = 2900;
constexpr int WET_VALUE = 1400;
constexpr int WATER_THRESHOLD = 30;

int readSoilMoisturePercent() {
  const int rawValue = analogRead(SOIL_PIN);
  int moisturePercent = map(rawValue, DRY_VALUE, WET_VALUE, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);
  return moisturePercent;
}

void setup() {
  Serial.begin(115200);

  // Atur output relay ke kondisi OFF sebelum mengaktifkan pin output.
  digitalWrite(RELAY_PIN, HIGH);
  pinMode(RELAY_PIN, OUTPUT);

  analogReadResolution(12);
  analogSetPinAttenuation(SOIL_PIN, ADC_11db);
  dht.begin();

  Serial.println("SmartFarm - MODE OFFLINE");
}

void loop() {
  const float temperatureC = dht.readTemperature();
  const float humidityPercent = dht.readHumidity();
  const int soilMoisturePercent = readSoilMoisturePercent();

  // Pompa dikendalikan oleh sensor tanah; kegagalan DHT tidak mengubahnya.
  const bool pumpOn = soilMoisturePercent < WATER_THRESHOLD;
  digitalWrite(RELAY_PIN, pumpOn ? LOW : HIGH);

  Serial.print("Suhu: ");
  if (isnan(temperatureC)) {
    Serial.print("gagal");
  } else {
    Serial.print(temperatureC, 1);
    Serial.print(" C");
  }

  Serial.print("  Kelembaban udara: ");
  if (isnan(humidityPercent)) {
    Serial.print("gagal");
  } else {
    Serial.print(humidityPercent, 1);
    Serial.print("%");
  }

  Serial.print("  Tanah: ");
  Serial.print(soilMoisturePercent);
  Serial.print("%  Pompa: ");
  Serial.println(pumpOn ? "ON" : "OFF");

  delay(5000);  // DHT22 dibaca dengan jeda lebih dari 2 detik.
}
