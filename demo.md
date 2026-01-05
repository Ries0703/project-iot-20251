

Contents
1. INTRODUCTION	3
1.1. Context and Problem Statement	3
1.1.1 Context	3
1.1.2 Problem Statement	4
1.2. Proposed Solution	5
2. TEAMWORK	5
3. SYSTEM DESIGN AND ANALYSIS	6
3.1. System Architecture Diagram	6
3.2. Components of the System	7
3.3. Technologies for the System	8
3.3.1 Hardware and Edge Devices	8
3.3.2 Communication Protocols and Data Formats	11
3.3.3 Server Backend and Infrastructure	12
3.3.4 Security and Operational Measures	13
4. IMPLEMENTATION AND RESULT	14
4.1. Implementation	14
4.1.1. Hardware Interface & Wiring	14
4.1.2. Firmware Logic (ESP32)	14
4.1.3. Backend Services & Integration	15
4.1.4. Database Schema (Firestore)	15
4.1.5. Frontend Application	16
4.1.6. Deployment & Configuration	16
4.2. Results	16
5. CONCLUSION	20








1. INTRODUCTION
1.1. Context and Problem Statement
1.1.1 Context
     In the era of the Internet of Things (IoT), sensors and actuators (lights, alarms, door or servo controllers, smoke sensors, temperature sensors, humidity sensors, etc.) are increasingly common in homes, apartment rental, and commercial spaces. Users now desire a centralized management platform that allows real-time device status monitoring, remote control, safety alerts, and automated behavior settings, while remaining simple, reliable, and secure. The solution needs to support integration with existing data acquisition/control systems to transfer data and commands between physical devices and web interfaces, while also ensuring clear access control mechanisms (homeowner, member, guest, administrator), handling device errors, and preventing duplicate or disruptive operations due to unintentional commands (e.g., voice commands).
     Technically and operationally, the system must meet the specific requirements of IoT: continuous telemetry data flow, low latency for real-time control operations, retry and response mechanisms when devices are unavailable, and the ability to run background tasks to evaluate automatic rules and generate alerts. Simultaneously, the user experience must be intuitive, with all main functions (creating homes, adding rooms, linking devices, turning devices on/off, receiving alerts) presented in easily understandable language so that even non-experts can use it effectively. The system aims to balance advanced IoT features with a simplified experience, giving homeowners control, easy interaction for family members, and management tools for administrators when needed.

1.1.2 Problem Statement
     Personalized Multi-Home Management: Our platform offers a secure and personalized environment for your smart living needs. Once you create your account, you can establish your own digital "Homes" and organize them into specific "Rooms" mirroring your real-world layout. Whether you want to set up a living room or a bedroom, you can easily link your smart devices to these specific locations, giving you a clear and organized view of your entire house. If you decide to leave the platform, you have full control to delete your profile, which automatically cleans up your associated homes and data.
     Real-Time Control and Voice Interaction: You have complete control over your environment, right at your fingertips. You can view real-time status updates from your environmental sensors and instantly control devices, such as turning on lights, sounding buzzers, or adjusting servos. For a truly modern experience, the dashboard features built-in Voice Controls. You can simply speak commands to toggle lights hands-free. The system is designed to be smart and safe, automatically filtering out accidental repetitions to ensure your door or lights only respond when you intend them to.
     Intelligent Automation: Your smart home works for you even when you aren't looking at the screen. The system runs intelligent background tasks that continuously monitor your home's conditions against automation rules. If specific criteria are met such as a sensor reaching a certain threshold the system triggers alerts and actions automatically. For example, if your house is on fire or there is toxic smoke, you need to receive an immediate alert without having to access the website. This ensures your home remains responsive and safe without you needing to constantly check the website.
     Collaboration and Sharing: We understand that a home is often shared. As the Owner (the person who created the home), you have full administrative power: you can add or remove rooms, manage devices, and perform sensitive actions like unlocking doors. However, you can also have Members in your home. Members assigned by administrators can access the home to view status and control shared devices (like lights), allowing family members or roommates to interact with the smart home without worrying about them accidentally deleting rooms or changing critical settings.
     Administration and Support: to keep the platform running smoothly, there are Global Administrators. These are super-users who manage the overall community. They can help organize user accounts and manage who belongs to which home, ensuring that everyone has the correct access level and that the system remains secure and organized for all users.
1.2. Proposed Solution
This project implements a full-stack Smart Home system, integrating a web frontend, backend, and IoT hardware using ESP32 microcontrollers. The goal is to provide secure account and home management while connecting physical ESP32 devices through ThingsBoard for real-time telemetry. The system enables remote control of actuators (lights, buzzers, servo-controlled doors), supports voice-driven commands, and executes automation rules. Technically, the backend utilizes Firebase Firestore for persistence and interacts with ThingsBoard for device RPC and data synchronization. See the server entry and routers in Webserver/smart-home-be for implementation details.
2. TEAMWORK
Member Name
Student ID
Responsibilities
Nguy?n H?u Ho ng H?i Anh
20226010
- 25% Contribution
Environment Monitoring & Infrastructure: Implement DHT22 sensor logic to read Temperature and Humidity. (BE, FE, Hardware)
- Set up the initial FastAPI project structure and database connection.
- Data Modeling: Conceptual, Logical, Document
- Implement Charts/Graphs (using Recharts) to visualize temperature and humidity trends.
- Final Report, House DIY
Ho ng B  B?o
20226015
- 25% Contribution
Safety & Alert System: Implement MQ-2 (Smoke/Gas) and KY-026 (Flame) sensor logic. Program the Buzzer to trigger immediately upon detecting danger (BE, FE, Hardware).
- Develop the Alert Service: Monitor incoming telemetry; if smoke/fire thresholds are exceeded, generate an Alert record in the database.
- Develop the Notifications UI: A list displaying recent safety alerts.
- Create visual safety indicators (Safe/Danger status badges) on the Dashboard.
- Develop the base Wi-Fi and MQTT connection handler for the group to reuse.
Nguy?n H?u Ho ng
20225972
- 25% Contribution
AI Interaction & Servo: Implement Servo Motor control for the Door mechanism
- Develop the voice_command API endpoint to parse audio.
- Implement the Door Control widget
- Develop the Voice Control Interface
 inh Ng?c C?m
20226016
- 25% Contribution
Implement Relay/LED control for Lighting systems.
- Implement Backend & Frontend for managing Home, Room, User, Device and Authentication service
- Architecture Design
3. SYSTEM DESIGN AND ANALYSIS
3.1. System Architecture Diagram
The Smart Home system is designed using a Multi-layered Distributed Architecture, seamlessly integrating traditional web services with a specialized IoT platform. The architecture ensures that data flows efficiently from Edge Devices to the End-user Dashboard while maintaining security and scalability.
The system is composed of four primary layers:
1. Device Layer: Collects environmental data and executes physical commands.
2. Connectivity & Gateway Layer: Manages traffic routing and load balancing.
3. IoT Platform Layer: Handles core device management and telemetry processing (ThingsBoard).
4. Application & Business Layer: Manages user identity, business logic, and the user interface (Web Service & UI).


3.2. Components of the System
A. Device Layer (Source & ESP32)
* Sensor Node: Utilizes ESP32 microcontrollers connected to physical sensors (Temperature, Motion, Humidity).
* Function: The ESP32 acts as an edge gateway, responsible for reading sensor data, packaging telemetry messages for transmission, and listening for remote control commands (RPC) from the server.
* Protocol: Communication relies on the MQTT protocol, selected for its lightweight and reliable nature in IoT environments.
B. Connectivity Layer (HAProxy)
* HAProxy: Positioned as an intermediary between the devices/clients and the backend system.
* Role: Acts as a Load Balancer and Reverse Proxy. It ingests MQTT connections from ESP32s and REST API/WebSocket requests from the Web UI, routing them to the appropriate destination services (ThingsBoard or Web Service). This setup enhances system security and distributes the processing load.
C. IoT Platform Layer (ThingsBoard Cluster)
This layer acts as the core engine for IoT data processing, comprising several sub-modules:
* Transports (MQTT/HTTP/CoAP): Gateways that receive device data via HAProxy.
* Rule Engine: The logic processor where telemetry data is filtered, analyzed, and routed. It can forward data to message queues (Kafka) for asynchronous processing.
* Core Service: Manages device identity, credentials, and active states.
* PostgreSQL: A relational database used for ThingsBoard's internal storage (telemetry history, device attributes).
D. Application Layer (Web Service & Web UI)
* Web Service (Backend API): Built using FastAPI.
o Connects to Firebase Firestore to manage user profiles, home structures (Homes/Rooms), and access permissions.
o Integrates with ThingsBoard via REST API to send control commands (RPC) and retrieve telemetry data for the dashboard.
* Web UI (Frontend): A ReactJS Single Page Application (SPA). Users interact directly with this interface. The app calls REST APIs to the Web Service for profile/home information and establishes WebSocket connections (via HAProxy) for real-time status updates.
* Firebase: A NoSQL cloud database ensuring flexibility for user data and system configurations.
3.3. Technologies for the System
This section outlines the specific hardware components, software frameworks, communication protocols, and security measures utilized to build the Smart Home system.
3.3.1 Hardware and Edge Devices
The system interacts with the physical world through a dedicated hardware layer powered by ESP32 microcontrollers.
* Microcontroller Unit (MCU): ESP32 Development Board (esp32dev).

o Firmware: Developed using the Arduino framework via PlatformIO (reference: platformio.ini, main.cpp).
o Connectivity: Wi-Fi (802.11 b/g/n) connects the device to the local network and the Internet.
* Sensors (Input):
o DHT22: Digital sensor for real-time Temperature and Humidity readings.

o PIR: Passive Infrared sensor for Motion detection.

o MQ-2: Gas sensor for Smoke and Combustible Gas detection.

o KY-026: Digital Flame sensor for fire detection.

* Actuators (Output):
o Servo SG-90 Motor: Controls physical mechanisms (e.g., door lock simulation).

o Buzzer: Provides audible alarms.


o Relay/LED: Controls lighting systems.
3.3.2 Communication Protocols and Data Formats
Data exchange relies on standard IoT and web protocols to ensure interoperability between the Edge, the IoT Platform, and the User Interface.
* MQTT (Message Queuing Telemetry Transport):
o Used for Device to ThingsBoard communication on port 1883.
o Telemetry: The ESP32 publishes sensor data to specific topics (e.g., v1/devices/me/telemetry).
o RPC (Remote Procedure Calls): The device subscribes to RPC topics to receive commands (e.g., toggling a light) instantly.
* HTTP/HTTPS (REST API):
o Server to ThingsBoard: The backend uses httpx to invoke ThingsBoard APIs (e.g., /api/plugins/rpc/oneway/{deviceId}, /api/auth/login).
o Client to Server: The React Frontend communicates with the FastAPI Backend via secure HTTPS REST endpoints.
* Data Serialization (JSON):
o JSON is the standard format for all payloads, including telemetry data, RPC parameters, and API responses.
o Telemetry Schema: temperature, humidity, smoke_level, smoke_status, flame_status, motion_status, light_status, buzzer_status, servo_angle.
o Timestamps: All historical data and telemetry rely on Epoch timestamps (milliseconds).
3.3.3 Server Backend and Infrastructure
The application logic is centralized in a robust backend service designed for scalability and asynchronous processing.
* Core Stack:
o Framework: FastAPI (Python) serves as the primary REST API.
o Server: Uvicorn acts as the ASGI web server implementation.
o Database: Firebase Firestore (NoSQL) is used for storing Users, Homes, Rooms, and Membership structures (e.g., homes/{homeId}/members/{userId}).
* Key Libraries:
o fastapi, uvicorn, pydantic (Data validation), httpx (Async HTTP client).
o firebase-admin (Database interaction), python-jose & passlib (Auth & Hashing).
o loguru (Structured logging).
* Background Services:
o Automation Service: Runs continuous background loops (automation_service) to evaluate rules against real-time data.
o ThingsBoard Integration: The thingsboard_service.py module manages device authentication, telemetry queries, and RPC command translation.
o AI Integration: Placeholder support for LLM-based voice processing exists via gemini_client.py.
3.3.4 Security and Operational Measures
Security is implemented at multiple layers, from user authentication to device transport.
* Authentication & Authorization:
o Users: JWT-based authentication. The backend verifies the CurrentUser identity and enforces Role-Based Access Control (RBAC) via verify_home_access (checking ownership or membership).
o Devices: Devices authenticate with ThingsBoard using unique Access Tokens (MQTT Username). The backend authenticates with ThingsBoard using Admin credentials to obtain JWTs for REST calls.
* Secrets Management:
o Sensitive credentials (API keys, database tokens, passwords) are managed via Environment Variables (.env file support using python-dotenv in development).
* Operational Safety:
o Rate Limiting & Anti-Spam: De-duplication logic is implemented for voice and control commands to prevent accidental repeated actions.
o Error Handling: The backend captures upstream errors from ThingsBoard (e.g., Device Offline) and returns meaningful HTTP status codes (e.g., 503 Service Unavailable) to the client.
* Production Recommendations:
o Enforce HTTPS for all backend endpoints.
o Upgrade MQTT to MQTTS (TLS/SSL) on port 8883 for encrypted device communication.
o Implement centralized metrics (Prometheus/Grafana) and audit logging for sensitive administrative actions.
4. IMPLEMENTATION AND RESULT
4.1. Implementation
4.1.1. Hardware Interface & Wiring
The physical layer is built around the ESP32 microcontroller (esp32dev board), chosen for its integrated Wi-Fi and robust I/O capabilities. The firmware environment is configured via platformio.ini.
The wiring schema connecting sensors and actuators to the ESP32 GPIO pins is defined in src/main.cpp as follows:
Table. Pin Mapping Configuration
Component
Type
GPIO Pin
Notes
DHT22
Sensor
GPIO 4
Temperature & Humidity (3.3V)
PIR
Sensor
GPIO 13
Motion Detection
MQ-2
Sensor
GPIO 34
Analog Smoke/Gas Level (ADC pin)
KY-026
Sensor
GPIO 35
Digital Flame Detection
Light
Actuator
GPIO 2
Relay or LED control
Buzzer
Actuator
GPIO 32
Audible Alarm
Servo
Actuator
GPIO 22
Door Control Mechanism
4.1.2. Firmware Logic (ESP32)
The firmware, located in src/main.cpp, manages network connectivity and device behavior.
* Connectivity: Upon startup, the device connects to Wi-Fi and establishes an MQTT session with the ThingsBoard server.
* Telemetry Loop: The device publishes a JSON payload every 10 seconds to v1/devices/me/telemetry. Data points include temperature, humidity, smoke_level, motion_status, and actuator states (light_status, servo_angle, etc.).
* RPC Handling: The firmware subscribes to v1/devices/me/rpc/request/+. It parses incoming JSON commands (e.g., setLight, setServo) to control actuators and publishes the execution result back to the response topic.
* Safety Logic: The code implements software debouncing for the PIR sensor and local automation triggers (e.g., auto-buzzer on smoke detection) to ensure safety even if the network is down.
4.1.3. Backend Services & Integration
The backend is a FastAPI application (Webserver/smart-home-be/app/main.py) designed with a modular architecture:
* Architecture: The codebase is organized into Routers (endpoints), Services (business logic), and Repositories (database access).
* ThingsBoard Integration: The thingsboard_service module acts as the bridge to the IoT platform. It handles Admin Authentication (JWT exchange), queries telemetry history via REST API, and dispatches one-way RPC commands (/api/plugins/rpc/oneway/{deviceId}) for real-time device control.
* Error Handling: The system acts as a proxy for device state. If ThingsBoard returns a 409 error (Device Offline), the backend gracefully catches this and returns a 503 status to the client with a user-friendly message.
* Background Tasks: Asynchronous loops run continuously to process automation rules and alerts, ensuring the system remains reactive.
4.1.4. Database Schema (Firestore)
Data persistence is handled by Firebase Firestore using the firebase-admin SDK. The NoSQL structure allows for flexible document storage:
* users: Stores user profiles and global permissions (e.g., is_admin).
* homes & rooms: Hierarchical collections defining the logical structure of the user's environment.
* devices: Maps physical ThingsBoard UUIDs to logical rooms.
* homes/{homeId}/members: A sub-collection managing access control, storing role assignments (owner, member) for each user within a specific home.
4.1.5. Frontend Application
The user interface is a Single Page Application (SPA) built with React and Vite (Webserver/smart-home-fe).
* Key Dependencies: axios for API communication, @mui/material for UI components, and recharts for visualizing telemetry data.
* Functionality: The frontend manages authentication (storing JWTs), displays real-time dashboards, and captures voice input. Voice transcripts are sent to backend endpoints for parsing and execution.
4.1.6. Deployment & Configuration
* Environment Management: Sensitive credentials (ThingsBoard tokens, Firestore keys, LLM API keys) are injected via environment variables, strictly avoiding hardcoded secrets in the source code.
* Execution: The backend is served using Uvicorn (ASGI), while the frontend is built as static assets.
* Validation: Implementation is verified through unit tests (pytest) and end-to-end manual validation, ensuring that RPC commands triggered from the UI successfully actuate the physical hardware.

4.2. Results
Demonstration Video: 
https://drive.google.com/file/d/1ljaUwi56-RaARnqhdPAI634sY6cZw9D_/view?usp=sharing
User Interface:










5. CONCLUSION
     This project successfully designed and implemented a comprehensive, end-to-end Smart Home solution that bridges the gap between low-level hardware control and high-level user interaction. By leveraging a distributed architecture comprising ESP32 edge devices, the ThingsBoard IoT platform, and a modern FastAPI/React web stack, the system achieves the following key objectives:

     Seamlanm,./ xzess Integration: The system effectively synchronizes physical state changes with the digital dashboard in near real-time, providing users with immediate feedback via telemetry and remote control capabilities.

     User-Centric Design: The abstraction of physical devices into logical "Homes" and "Rooms," combined with intuitive voice controls, significantly lowers the technical barrier for everyday users.

     Robust Architecture: The separation of concerns between the Device Layer (hardware), the Connectivity Layer (MQTT/ThingsBoard), and the Application Layer (Business Logic) ensures that the system is modular, maintainable, and scalable.

     Safety & Reliability: Implementation of hardware-level safety mechanisms (e.g., local fire alarms) and software-level safeguards (e.g., anti-spam, permission checks) ensures reliable operation even in unstable network conditions.
