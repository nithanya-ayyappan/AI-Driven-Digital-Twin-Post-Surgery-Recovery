"""Observation recording service and deterministic clinical rule evaluator."""

import json
from datetime import datetime
from typing import Dict, Any, List, Tuple
from database.db import get_connection

def validate_observation(data: Dict[str, Any]) -> Tuple[bool, str]:
    temp = float(data.get("temperature_c", 0))
    pulse = int(data.get("pulse_bpm", 0))
    spo2 = int(data.get("spo2_percent", 0))
    pain = int(data.get("pain_score", 0))

    if temp < 32.0 or temp > 43.0:
        return False, f"Temperature {temp}°C is outside plausible human range (32.0 - 43.0°C)."
    if pulse < 30 or pulse > 240:
        return False, f"Pulse {pulse} bpm is outside plausible human range (30 - 240 bpm)."
    if spo2 < 60 or spo2 > 100:
        return False, f"SpO2 {spo2}% is outside plausible range (60% - 100%)."
    if pain < 0 or pain > 10:
        return False, f"Pain score {pain} must be between 0 and 10."
    return True, ""

def evaluate_clinical_rules(conn, patient_id: str, temp_c: float, pulse_bpm: int, spo2_pct: int, pain_score: int) -> List[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alert_thresholds WHERE id = 'default'")
    thresh = cursor.fetchone() or {
        "temp_fever_c": 38.0,
        "pulse_high_bpm": 100,
        "spo2_floor_pct": 94,
        "pain_spike_delta": 3
    }

    alerts_triggered = []
    now = datetime.utcnow().isoformat() + "Z"

    # 1. Fever rule
    if temp_c >= thresh["temp_fever_c"]:
        is_tachy = pulse_bpm >= 90
        severity = "URGENT_ATTENTION" if (temp_c >= 38.5 or (temp_c >= 38.0 and is_tachy)) else "REVIEW_RECOMMENDED"
        alert_id = f"ALT-PY-{int(datetime.utcnow().timestamp())}"
        rule_name = "RULE_POSTOP_FEVER_SURVEILLANCE"
        expl = f"Body temperature {temp_c}°C (>= {thresh['temp_fever_c']}°C){' with concurrent tachycardia (' + str(pulse_bpm) + ' bpm)' if is_tachy else ''}. Clinical wound inspection urged."

        cursor.execute("""
            INSERT INTO alerts VALUES (?, ?, ?, ?, ?, ?, 'New', NULL, NULL, ?, NULL)
        """, (alert_id, patient_id, severity, rule_name, expl, json.dumps({"temperature_c": temp_c, "pulse_bpm": pulse_bpm}), now))
        alerts_triggered.append({"id": alert_id, "rule": rule_name, "severity": severity, "explanation": expl})

    # 2. Desaturation rule
    if spo2_pct < thresh["spo2_floor_pct"]:
        alert_id = f"ALT-PY-{int(datetime.utcnow().timestamp()) + 1}"
        rule_name = "RULE_OXYGEN_DESATURATION"
        severity = "URGENT_ATTENTION" if spo2_pct < 90 else "REVIEW_RECOMMENDED"
        expl = f"SpO2 recorded at {spo2_pct}% (below threshold {thresh['spo2_floor_pct']}%). Evaluate airway and incentive spirometry."

        cursor.execute("""
            INSERT INTO alerts VALUES (?, ?, ?, ?, ?, ?, 'New', NULL, NULL, ?, NULL)
        """, (alert_id, patient_id, severity, rule_name, expl, json.dumps({"spo2_percent": spo2_pct}), now))
        alerts_triggered.append({"id": alert_id, "rule": rule_name, "severity": severity, "explanation": expl})

    return alerts_triggered

def record_observation(obs_data: Dict[str, Any], db_path: str = None) -> Tuple[bool, str, List[Dict[str, Any]]]:
    valid, err = validate_observation(obs_data)
    if not valid:
        return False, err, []

    conn = get_connection(db_path) if db_path else get_connection()
    cursor = conn.cursor()
    obs_id = f"obs-py-{int(datetime.utcnow().timestamp())}"
    now = datetime.utcnow().isoformat() + "Z"

    cursor.execute("""
        INSERT INTO observations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        obs_id,
        obs_data["patient_id"],
        obs_data.get("timestamp", now),
        float(obs_data["temperature_c"]),
        int(obs_data["pulse_bpm"]),
        int(obs_data["spo2_percent"]),
        obs_data.get("systolic_bp"),
        obs_data.get("diastolic_bp"),
        int(obs_data["pain_score"]),
        obs_data.get("weight_kg"),
        int(obs_data.get("mobility_meters", 0)),
        obs_data.get("appetite_level", "Normal"),
        obs_data.get("fatigue_level", "Low"),
        obs_data.get("fluid_ml"),
        json.dumps(obs_data.get("symptoms", [])),
        json.dumps(obs_data.get("wound_observation", {})),
        obs_data.get("clinician_notes", ""),
        obs_data.get("data_source", "MANUAL_CLINICIAN"),
        obs_data.get("recorded_by", "Staff Clinician"),
        now
    ))

    alerts = evaluate_clinical_rules(
        conn,
        obs_data["patient_id"],
        float(obs_data["temperature_c"]),
        int(obs_data["pulse_bpm"]),
        int(obs_data["spo2_percent"]),
        int(obs_data["pain_score"])
    )

    conn.commit()
    conn.close()
    return True, obs_id, alerts
