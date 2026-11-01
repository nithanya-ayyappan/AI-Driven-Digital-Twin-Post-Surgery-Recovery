"""Device Telemetry Ingestion and Message Validation Service."""

from typing import Dict, Any, Tuple
from datetime import datetime

def validate_device_payload(payload: Dict[str, Any]) -> Tuple[bool, str]:
    if not isinstance(payload, dict):
        return False, "Payload must be a JSON object"

    device_id = payload.get("device_id")
    if not device_id:
        return False, "Missing 'device_id'"

    measurements = payload.get("measurements")
    if not isinstance(measurements, dict):
        return False, "Missing or invalid 'measurements' object"

    temp = measurements.get("temperature_c") or measurements.get("temp_c")
    pulse = measurements.get("pulse_bpm") or measurements.get("heart_rate")
    spo2 = measurements.get("spo2_percent") or measurements.get("spo2")

    if temp is None:
        return False, "Missing 'temperature_c' in measurements"
    if pulse is None:
        return False, "Missing 'pulse_bpm' in measurements"
    if spo2 is None:
        return False, "Missing 'spo2_percent' in measurements"

    return True, ""

def generate_simulated_payload(device_id: str, patient_id: str, condition: str = "normal") -> Dict[str, Any]:
    temp = 36.8
    pulse = 74
    spo2 = 98

    if condition == "fever_spike":
        temp = 38.4
        pulse = 98
    elif condition == "hypoxia":
        spo2 = 91
        pulse = 92

    return {
        "device_id": device_id,
        "patient_id": patient_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "measurements": {
            "temperature_c": temp,
            "pulse_bpm": pulse,
            "spo2_percent": spo2,
            "systolic_bp": 120,
            "diastolic_bp": 78
        },
        "battery_pct": 92
    }
