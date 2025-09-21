#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "config.h"

// prototype functions
void connectToWiFi();
void reconnectToWiFi();

WiFiClient wifiClient;
HTTPClient httpClient;
DHT dht(DHTPIN, DHTTYPE);



void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnectToWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Reconnecting to WiFi...");
    WiFi.disconnect();
    WiFi.reconnect();
    unsigned long startAttemptTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
      delay(500);
      Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println(" reconnected");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println(" failed to reconnect");
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000); // Give time for Serial to initialize
  connectToWiFi();
  dht.begin();
}
void loop() {
  reconnectToWiFi();
  
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int RSSI = WiFi.RSSI();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print(" °C, Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");
  Serial.print("Intensidad de señal WiFi (RSSI): ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");

  if (WiFi.status() == WL_CONNECTED) {
    const char* serverUrl = SERVER_URL;
    httpClient.begin(serverUrl); // HTTPS soportado por ESP32
    httpClient.addHeader("Content-Type", "application/json");
    httpClient.addHeader("X-API-Key", String(X_API_Key));
    httpClient.addHeader("X-API-Secret", String(X_API_Secret));

    StaticJsonDocument<200> jsonDoc;
    jsonDoc["temperature"] = temperature;
    jsonDoc["humidity"] = humidity;
    jsonDoc["RSSI"] = RSSI;
    jsonDoc["device_id"] = String(DEVICE_ID);

    String requestBody;
    serializeJson(jsonDoc, requestBody);

    int httpResponseCode = httpClient.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = httpClient.getString();
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      Serial.print("Response: ");
      Serial.println(response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }

    httpClient.end();
  } else {
    Serial.println("WiFi not connected");
  }

  delay(120000); // Wait for 120 seconds before next reading
}


