"""SQLite Database Manager for Post-Surgery Digital Twin."""

import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "digital_twin.db")

def get_connection(db_path: str = DB_FILE) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_path: str = DB_FILE) -> None:
    conn = get_connection(db_path)
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        assigned_patient_id TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        contact_email TEXT,
        surgery_type TEXT NOT NULL,
        surgery_date TEXT NOT NULL,
        treating_clinician TEXT NOT NULL,
        recovery_plan TEXT NOT NULL,
        consent_status TEXT NOT NULL,
        status TEXT NOT NULL,
        surgical_site TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        temperature_c REAL NOT NULL,
        pulse_bpm INTEGER NOT NULL,
        spo2_percent INTEGER NOT NULL,
        systolic_bp INTEGER,
        diastolic_bp INTEGER,
        pain_score INTEGER NOT NULL,
        weight_kg REAL,
        mobility_meters INTEGER,
        appetite_level TEXT,
        fatigue_level TEXT,
        fluid_ml INTEGER,
        symptoms_json TEXT,
        wound_observation_json TEXT,
        clinician_notes TEXT,
        data_source TEXT NOT NULL,
        recorded_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS milestones (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        milestone_name TEXT NOT NULL,
        target_day INTEGER NOT NULL,
        target_description TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        completed_date TEXT,
        clinician_notes TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        severity TEXT NOT NULL,
        trigger_rule TEXT NOT NULL,
        explanation TEXT NOT NULL,
        metric_snapshot_json TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_reviewer TEXT,
        clinical_notes TEXT,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        device_name TEXT NOT NULL,
        device_type TEXT NOT NULL,
        assigned_patient_id TEXT,
        status TEXT NOT NULL,
        last_seen TEXT,
        battery_pct INTEGER,
        api_key TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (assigned_patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS device_messages (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        patient_id TEXT,
        raw_payload_json TEXT NOT NULL,
        parsed_valid INTEGER NOT NULL,
        error_reason TEXT,
        received_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        user_role TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_thresholds (
        id TEXT PRIMARY KEY,
        temp_fever_c REAL NOT NULL,
        pulse_high_bpm INTEGER NOT NULL,
        pulse_low_bpm INTEGER NOT NULL,
        spo2_floor_pct INTEGER NOT NULL,
        pain_spike_delta INTEGER NOT NULL,
        updated_by TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # Seed if users empty
    cursor.execute("SELECT count(*) as count FROM users")
    if cursor.fetchone()["count"] == 0:
        seed_sample_data(conn)

    conn.commit()
    conn.close()

def seed_sample_data(conn: sqlite3.Connection) -> None:
    now = datetime.utcnow().isoformat() + "Z"
    cursor = conn.cursor()

    # Thresholds
    cursor.execute("""
        INSERT INTO alert_thresholds VALUES ('default', 38.0, 100, 50, 94, 3, 'system@recovery.org', ?)
    """, (now,))

    # Demo users
    users = [
        ('usr-admin', 'admin@recovery.org', 'admin123', 'Dr. Aris Thorne', 'Administrator', None, now),
        ('usr-clinician-1', 'clinician@hospital.org', 'clinician123', 'Dr. Rachel Vance, MD', 'Clinician', None, now),
        ('usr-patient-1', 'patient.sarah@recovery.org', 'patient123', 'Sarah Jenkins', 'Patient', 'PT-2026-081', now),
    ]
    cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", users)

    # Patients
    patients = [
        ('PT-2026-081', 'Sarah Jenkins', 42, 'Female', 'sarah.demo@hospital.org', 'Laparoscopic Cholecystectomy', '2026-10-28', 'Dr. Rachel Vance, MD', 'ERAS Laparoscopic Pathway', 'Consented', 'In Recovery', 'Right Upper Abdominal Quadrant', now),
        ('PT-2026-082', 'Robert Chen', 64, 'Male', 'robert.demo@hospital.org', 'Total Knee Arthroplasty (Right)', '2026-10-29', 'Dr. Rachel Vance, MD', 'Orthopedic Joint Pathway', 'Consented', 'Needs Review', 'Right Knee Joint & Patellar Region', now),
        ('PT-2026-083', 'Marcus Vance', 57, 'Male', 'marcus.demo@hospital.org', 'Inguinal Hernia Repair', '2026-10-26', 'Dr. Kenneth Cole, MD', 'Hernia Mobilization Pathway', 'Consented', 'In Recovery', 'Right Inguinal Canal', now)
    ]
    cursor.executemany("INSERT INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", patients)

    # Seed observations for Sarah Jenkins
    obs_sarah = [
        ('obs-py-01', 'PT-2026-081', '2026-10-28T16:00:00Z', 37.1, 82, 98, 124, 78, 6, 68.2, 20, 'Low', 'High', 600, json.dumps(['Surgical site tightness']), json.dumps({'dressing': 'Clean & Intact'}), 'PACU recovery stable.', 'MANUAL_CLINICIAN', 'Nurse Hayes', now),
        ('obs-py-02', 'PT-2026-081', '2026-10-29T10:00:00Z', 36.9, 76, 99, 118, 76, 4, 68.0, 80, 'Moderate', 'Moderate', 1200, json.dumps([]), json.dumps({'dressing': 'Dry'}), 'Post-op Day 1 morning check.', 'MANUAL_CLINICIAN', 'Dr. Rachel Vance, MD', now),
        ('obs-py-03', 'PT-2026-081', '2026-10-30T10:15:00Z', 36.8, 72, 98, 116, 74, 2, 67.9, 300, 'Good', 'Mild', 2000, json.dumps([]), json.dumps({'dressing': 'Clean'}), 'Transitioned to regular diet.', 'HARDWARE_ESP32', 'Sensor:ESP32-VITAL-01', now),
        ('obs-py-04', 'PT-2026-081', '2026-11-01T08:00:00Z', 36.8, 68, 98, 115, 72, 1, 67.9, 650, 'Normal', 'Minimal', 2100, json.dumps([]), json.dumps({'dressing': 'Dry'}), 'Home recovery morning log.', 'HARDWARE_ESP32', 'Sensor:ESP32-VITAL-01', now)
    ]
    cursor.executemany("INSERT INTO observations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", obs_sarah)

    # Seed observations for Robert Chen (Concerning fever elevation)
    obs_robert = [
        ('obs-py-05', 'PT-2026-082', '2026-10-29T18:00:00Z', 37.2, 78, 97, 132, 84, 7, 84.5, 10, 'Low', 'High', 900, json.dumps(['Joint pain']), json.dumps({'redness': 'Mild expected edge'}), 'Day 0 knee arthroplasty.', 'MANUAL_CLINICIAN', 'Nurse Anderson', now),
        ('obs-py-06', 'PT-2026-082', '2026-10-31T17:30:00Z', 37.9, 91, 95, 138, 88, 6, 84.6, 45, 'Reduced', 'High', 1200, json.dumps(['Chills', 'Localized warmth']), json.dumps({'redness': 'Slight spreading erythema'}), 'Temp rising. Patient feels feverish.', 'MANUAL_CLINICIAN', 'Nurse Anderson', now),
        ('obs-py-07', 'PT-2026-082', '2026-11-01T07:15:00Z', 38.3, 96, 94, 142, 90, 7, 84.7, 15, 'Poor', 'Severe', 800, json.dumps(['Fever', 'Throbbing pain']), json.dumps({'redness': 'Erythema >3cm', 'discharge': 'Purulent cloudy'}), 'Low-grade fever confirmed 38.3°C. Heart rate 96 bpm.', 'HARDWARE_ESP32', 'Sensor:ESP32-VITAL-02', now)
    ]
    cursor.executemany("INSERT INTO observations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", obs_robert)

    # Alerts
    alerts = [
        ('ALT-PY-101', 'PT-2026-082', 'URGENT_ATTENTION', 'RULE_POSTOP_FEVER_SURVEILLANCE', 'Body temperature reached 38.3°C with concurrent tachycardia (96 bpm) on Post-Op Day 3. Erythema >3cm with purulent exudate noted.', json.dumps({'temperature_c': 38.3, 'pulse_bpm': 96}), 'Under Review', 'Dr. Rachel Vance, MD', 'Urgent bedside wound inspection ordered. Wound swab and CBC sent.', '2026-11-01T07:20:00Z', None),
        ('ALT-PY-102', 'PT-2026-081', 'INFO', 'RULE_MILESTONE_PROGRESS', 'Patient completed 3 out of 5 milestones ahead of schedule.', json.dumps({'completed': 3}), 'Resolved', 'Dr. Rachel Vance, MD', 'Confirmed steady progress.', '2026-10-31T15:00:00Z', '2026-10-31T16:00:00Z')
    ]
    cursor.executemany("INSERT INTO alerts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", alerts)

    # Devices
    devices = [
        ('ESP32-VITAL-01', 'Bedside ESP32 Vitals Hub #01', 'Multi-Sensor Post-Op Hub', 'PT-2026-081', 'Connected', '2026-11-01T08:00:00Z', 94, 'esp32_key_vitals01', now),
        ('ESP32-VITAL-02', 'Ward ESP32 Telemetry Monitor #02', 'Continuous Wearable Sensor', 'PT-2026-082', 'Connected', '2026-11-01T07:15:00Z', 78, 'esp32_key_vitals02', now),
        ('ESP32-VITAL-03', 'Backup ESP32 Pulse-Ox Rig #03', 'Optical PPG Sensor', None, 'Offline', None, 45, 'esp32_key_vitals03', now)
    ]
    cursor.executemany("INSERT INTO devices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", devices)
