# AI-Driven Digital Twin for Post-Surgery Recovery

A production-grade, clinical recovery monitoring platform providing longitudinal digital twins, physiological observation logging, recovery milestone tracking, explainable AI trend heuristics, and software-ready ESP32 sensor integration.

> **MANDATORY CLINICAL SAFETY DISCLAIMER**: This application is an educational prototype providing non-diagnostic clinical decision support. It does not diagnose surgical complications, predict mortality, or replace clinical examination. If a patient experiences chest pain, severe dyspnea, heavy bleeding, or altered mental status, emergency medical services must be contacted immediately.

---

## 1. Project Architecture & Dual-Stack Delivery

To provide an immediate, fully functional interactive web experience in the AI Studio environment while simultaneously delivering the Python 3.10+ / Streamlit codebase requested by healthcare software engineering courses, this repository is delivered in two complementary implementations:

1. **Full-Stack Live Web Application (React 19 + TypeScript + Express + SQLite)**:
   - Runs directly on the development server at port 3000.
   - Built-in SQLite database engine (`recovery_twin.db`) via `node:sqlite`.
   - Complete 10-view clinical portal, real-time ESP32 ingestion endpoint (`POST /api/devices/ingest`), and interactive telemetry simulator.
2. **Modular Python 3.10+ Package (`/python_digital_twin/`)**:
   - Streamlit multi-page web application (`app.py`).
   - SQLite persistent storage (`digital_twin.db`).
   - Automated unit tests passing via `python3 -m unittest python_digital_twin/tests/test_core.py`.
   - Requirements, models, database seeders, and modular services.

---

## 2. Folder Tree

```
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── server.ts                       # Express backend + REST API + SQLite integration
├── recovery_twin.db                # SQLite database (auto-generated)
├── src/
│   ├── main.tsx
│   ├── index.css                   # Clinical design system & print styles
│   ├── App.tsx                     # Primary SPA shell & state controller
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces (Patient, Observation, Alert, etc.)
│   ├── services/
│   │   └── api.ts                  # Fetch API client for all REST endpoints
│   ├── components/
│   │   ├── TopBar.tsx              # Top bar contract & role switcher
│   │   ├── Sidebar.tsx             # 10-page role-aware navigation
│   │   ├── DisclaimerBanner.tsx    # Safety and prototype notices
│   │   ├── VitalTrendChart.tsx     # Longitudinal SVG recovery corridors
│   │   ├── BodyMap.tsx             # Anatomical surgical site focus map
│   │   ├── AddPatientModal.tsx     # Patient registration modal with validation
│   │   ├── AddObservationModal.tsx # Observation input form with plausible checking
│   │   └── AlertDetailModal.tsx    # Alert review workflow & clinical notes
│   ├── server/
│   │   └── db.ts                   # SQLite schema, tables, and synthetic seed data
│   └── views/
│       ├── WelcomeView.tsx         # Sign-in & demo profile quick-selector
│       ├── DashboardView.tsx       # KPI overview & patient trend graphs
│       ├── PatientsView.tsx        # Cohort registry, search, & status filters
│       ├── DigitalTwinView.tsx     # Flagship digital twin recovery profile
│       ├── TimelineView.tsx        # Chronological timeline & monitoring gap detector
│       ├── HealthMonitoringView.tsx# Observations feed & vitals history
│       ├── AiInsightsView.tsx      # Explainable AI rules & threshold editor
│       ├── AlertsView.tsx          # Alert management with severity filtering
│       ├── ReportsView.tsx         # Standardized printable recovery summary
│       ├── DeviceIntegrationView.tsx# ESP32 gateway, live simulator, & C++ code
│       └── SettingsView.tsx        # Roles, units, audit log, & database reset
└── python_digital_twin/            # Modular Python 3.10+ / Streamlit codebase
    ├── app.py                      # Streamlit application entrypoint
    ├── requirements.txt            # Python dependencies (Streamlit, Plotly, Pandas)
    ├── database/
    │   └── db.py                   # SQLite schema and sample data generator
    ├── models/
    │   └── schemas.py              # Data models and dataclasses
    ├── services/
    │   ├── observation_service.py  # Vitals validation & rule triggers
    │   ├── trend_service.py        # Explainable trend deltas & heuristics
    │   └── device_service.py       # ESP32 packet validation & simulator
    └── tests/
        └── test_core.py            # Automated unit test suite (5 passing tests)
```

---

## 3. Installation & Run Instructions

### A. Launching the Interactive Web Application (Node.js & Express)
The live application is running on port 3000 in this container. To run locally:
```bash
# 1. Install dependencies
npm install

# 2. Launch full-stack server (runs Express API + Vite client on port 3000)
npm run dev
```
Open your browser to `http://localhost:3000`.

### B. Python 3.10+ Virtual Environment & Streamlit Setup (Windows & Linux)

#### On Windows (PowerShell / Command Prompt):
```powershell
# 1. Open terminal in project root
cd python_digital_twin

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
.\venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Launch Streamlit app
streamlit run app.py
```

#### On Linux / macOS:
```bash
cd python_digital_twin
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

---

## 4. Demo Login Credentials

The application implements a safe demo authentication workflow. Plaintext passwords are not used in production:

| Role | Email | Demo Password | Intended Workflow |
| :--- | :--- | :--- | :--- |
| **Clinician** | `clinician@hospital.org` | `clinician123` | Full clinical oversight, enter observations, review alerts, update milestones |
| **Administrator** | `admin@recovery.org` | `admin123` | System governance, inspect audit logs, re-seed database |
| **Patient** | `patient.sarah@recovery.org` | `patient123` | Personal digital twin, view recovery timeline, log self-reported symptoms |

---

## 5. Synthetic Sample Data

All patient cohorts are strictly fictional:
1. **Sarah Jenkins (PT-2026-081)**:
   - 42-year-old female, Laparoscopic Cholecystectomy (Day 4 Post-Op).
   - Recovery trajectory: Expected corridor maintained, pain decreasing (6/10 to 1/10), 3 of 5 recovery milestones achieved.
2. **Robert Chen (PT-2026-082)**:
   - 64-year-old male, Total Knee Arthroplasty (Day 3 Post-Op).
   - Recovery trajectory: Low-grade fever spike (38.3°C) and resting tachycardia (96 bpm) triggering `URGENT_ATTENTION` alert for surgical site wound inspection.
3. **Marcus Vance (PT-2026-083)**:
   - 57-year-old male, Inguinal Hernia Repair (Day 6 Post-Op).
   - Recovery trajectory: Ambulating independently, completed stair navigation milestone.

---

## 6. Page-by-Page Workflow Guide

1. **Welcome / Sign-In**:
   - Role-aware authentication with one-click demo role selector.
   - Comprehensive safety notices and educational prototype disclosures.
2. **Main Dashboard**:
   - Key metrics (Enrolled patients, Total observations, Alerts for review, Active hardware gateways).
   - Recovery trajectory chart with clinical normal corridor.
   - Recent observations stream and unaddressed alerts.
3. **Patient Management**:
   - Registry table with search across names, IDs, procedures, and clinicians.
   - Status filters (`In Recovery`, `Needs Review`, `Discharged`).
   - "Enroll New Patient" modal with physiological validation.
4. **Patient Detail & Digital Twin**:
   - Individual recovery profile, calculated post-op day counter (`Day 4 Post-Op`).
   - Data freshness indicator ("Recorded within last hour" / "Stale").
   - Longitudinal interactive charts for Temperature, Heart Rate, SpO2, and Pain.
   - BodyMap anatomical focus diagram showing wound location and dressing integrity.
   - Recovery milestones with interactive clinical completion toggles.
   - Clinician-verified medication list.
5. **Recovery Timeline**:
   - Unified chronological feed of surgical procedures, vital logs, milestone completions, and clinical review flags.
   - Automated detection of monitoring intervals/gaps (&gt;20 hours) without fabricating data.
6. **Health Monitoring**:
   - Observation entry form supporting temperature (°C/°F), pulse, SpO2, blood pressure, visual pain scale (0-10), wound redness/swelling/discharge, and mobility.
   - Validates physical plausibility (32°C - 43°C, 30 - 240 bpm) before saving.
7. **AI Insights & Trend Analysis**:
   - Transparent analysis comparing baselines to current measurements.
   - Deterministic rule audit (`RULE-101: Fever Surveillance`, `RULE-102: Hypoxemia`, `RULE-103: Pain Spike`).
   - Configurable alert threshold setpoint editor.
8. **Alert Management**:
   - Filter by severity (`URGENT_ATTENTION`, `REVIEW_RECOMMENDED`, `INFO`) and status (`New`, `Under Review`, `Escalated`, `Resolved`, `Dismissed`).
   - Alert examination modal to record review notes and update status.
   - Prominent Emergency Warning banner.
9. **Reports**:
   - Standardized clinical summary dossier with patient demographics, trajectory chart, milestones progress, and observations table.
   - "Print / Save as PDF" button with dedicated `@media print` clean layout.
10. **Device Integration (ESP32 Ready)**:
    - Registered sensor gateway list with connection state and battery percentage.
    - Live Telemetry Simulator: Inject normal, fever spike, or hypoxia packets directly into the database.
    - Arduino ESP32 C++ firmware code sample ready for physical microcontrollers.
11. **Settings & Governance**:
    - Active profile info, role switcher, unit configuration (°C/°F, kg/lbs).
    - Immutable system audit trail log.
    - Database reset button to restore standard synthetic baseline cohort.

---

## 7. Hardware Integration Architecture (ESP32)

Physical microcontrollers stream physiological packets to the server via authenticated HTTPS POST.

### REST Ingestion Endpoint:
- **URL**: `POST /api/devices/ingest`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <DEVICE_API_KEY>
  ```
- **Standard Payload Schema**:
  ```json
  {
    "device_id": "ESP32-VITAL-01",
    "patient_id": "PT-2026-081",
    "timestamp": "2026-11-01T14:30:00Z",
    "measurements": {
      "temperature_c": 36.8,
      "pulse_bpm": 74,
      "spo2_percent": 98,
      "systolic_bp": 120,
      "diastolic_bp": 80
    },
    "battery_pct": 92
  }
  ```

### MQTT Future Gateway Architecture:
- Topic: `hospital/wards/postop/telemetry/{device_id}`
- QoS: 1 (At least once delivery)
- Payload: Encrypted JSON schema matching the REST schema above.

---

## 8. Automated Tests

The automated test suite verifies database initialization, observation plausibility checks, alert rule triggering, device message validation, and trend calculation:

```bash
python3 -m unittest python_digital_twin/tests/test_core.py
```
**Output**:
```
.....
----------------------------------------------------------------------
Ran 5 tests in 0.039s

OK
```

---

## 9. Troubleshooting Guide

1. **Port 3000 In Use**:
   - Stop any existing process on port 3000 (`kill -9 <PID>`) or set `PORT=3001 npm run dev`.
2. **Missing Python Modules**:
   - Run `pip install -r python_digital_twin/requirements.txt` inside your virtual environment.
3. **Database Lock or Corrupt State**:
   - Click "Reset Database to Synthetic Default" in **Settings**, or delete `recovery_twin.db` and restart `server.ts`.
4. **Physiological Input Error**:
   - Verify temperatures are between 32.0°C and 43.0°C. If entering Fahrenheit, use the toggle in the form.

---

## 10. Completed Features & Hardware Roadmap

### Completed Features:
- [x] Full SQLite schema with foreign keys, transactions, and audit logs.
- [x] Role-aware access control for Clinician, Administrator, and Patient.
- [x] Longitudinal Digital Twin recovery profile with expected recovery corridors.
- [x] Anatomical BodyMap surgical focus visualizer.
- [x] Recovery milestones tracking with completion dates and clinical notes.
- [x] Explainable AI rule engine with configurable threshold setpoints.
- [x] Severity-classified alert management workflow (`New`, `Under Review`, `Resolved`).
- [x] Standardized clinical summary dossier with `@media print` PDF formatting.
- [x] ESP32 REST ingestion API (`POST /api/devices/ingest`) and live simulation console.
- [x] Automated test suite with 100% pass rate.

### Intentionally Deferred to Physical Hardware Deployment:
- **Physical Wi-Fi Provisioning**: BLE / SoftAP provisioning wizard on ESP32 hardware.
- **Mutual TLS (mTLS)**: X.509 client certificates embedded in ESP32 secure flash.
- **Hardware Battery Watchdog**: Hardware interrupt pin for low-voltage sleep modes.
