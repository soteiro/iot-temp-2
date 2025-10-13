# Proyecto de Firmware para Dispositivo IoT de Temperatura y Humedad

Este proyecto contiene el firmware para un dispositivo IoT basado en el microcontrolador ESP32. El dispositivo mide la temperatura y la humedad utilizando un sensor DHT22 y envía los datos a un servidor remoto a través de WiFi.

## Características

* Medición de temperatura y humedad.
* Conexión a una red WiFi.
* Envío de datos a un servidor remoto a través de HTTP POST.
* Autenticación basada en API Key y API Secret.
* Manejo de reconexión a la red WiFi.

## Hardware Requerido

* Placa de desarrollo ESP32.
* Sensor de temperatura y humedad DHT22.
* Cables de conexión.

## Software y Librerías

Este proyecto está desarrollado utilizando PlatformIO con el framework de Arduino. Las siguientes librerías son necesarias:

* `adafruit/DHT sensor library` - para interactuar con el sensor DHT.
* `adafruit/Adafruit Unified Sensor` - dependencia de la librería DHT.
* `bblanchon/ArduinoJson` - para la creación de payloads en formato JSON.

Estas dependencias se gestionan automáticamente por PlatformIO a través del archivo `platformio.ini`.

## Configuración

Toda la configuración del dispositivo se encuentra en el archivo `include/config.h`. A continuación se describen las variables de configuración:

* `WIFI_SSID`: El nombre (SSID) de la red WiFi a la que se conectará el dispositivo.
* `WIFI_PASSWORD`: La contraseña de la red WiFi.
* `DHTTYPE`: El tipo de sensor DHT utilizado (en este caso, `DHT22`).
* `DHTPIN`: El pin del ESP32 al que está conectado el sensor DHT.
* `X_API_Key`: La clave de API para la autenticación con el servidor.
* `X_API_Secret`: El secreto de la API para la autenticación con el servidor.
* `DEVICE_ID`: Un identificador único para el dispositivo.
* `SERVER_URL`: La URL del servidor al que se enviarán los datos.

## Instalación y Uso

1. Clona este repositorio en tu máquina local.
2. Abre el proyecto con Visual Studio Code y la extensión PlatformIO.
3. Modifica el archivo `include/config.h` con tus propias credenciales y configuración.
4. Conecta la placa ESP32 a tu ordenador.
5. Construye y sube el firmware a la placa utilizando los comandos de PlatformIO.
6. Abre el monitor serie para ver los registros del dispositivo, incluyendo la conexión WiFi, las lecturas del sensor y las respuestas del servidor.

## Lógica del Programa

El programa se inicializa configurando la comunicación serie, conectándose a la red WiFi e inicializando el sensor DHT.

En el bucle principal (`loop`):

1. Verifica el estado de la conexión WiFi y se reconecta si es necesario.
2. Lee la temperatura y la humedad del sensor DHT.
3. Obtiene la intensidad de la señal WiFi (RSSI).
4. Si las lecturas del sensor son válidas y el dispositivo está conectado a WiFi, crea un objeto JSON con los datos.
5. Envía los datos al servidor a través de una solicitud HTTP POST, incluyendo las cabeceras de autenticación.
6. Imprime la respuesta del servidor en el monitor serie.
7. Espera 120 segundos antes de repetir el proceso.
