"""Explainable AI Trend and Trajectory Analysis Service."""

from typing import List, Dict, Any

def compute_recovery_trend(observations: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not observations:
        return {
            "status": "INSUFFICIENT_DATA",
            "message": "No observation records available for longitudinal trend analysis.",
            "limitations": "No data points."
        }

    temps = [float(o["temperature_c"]) for o in observations]
    pulses = [int(o["pulse_bpm"]) for o in observations]
    pains = [int(o["pain_score"]) for o in observations]

    first_temp = temps[0]
    last_temp = temps[-1]
    temp_delta = round(last_temp - first_temp, 2)

    first_pulse = pulses[0]
    last_pulse = pulses[-1]
    pulse_delta = last_pulse - first_pulse

    first_pain = pains[0]
    last_pain = pains[-1]
    pain_delta = last_pain - first_pain

    is_deviated = (last_temp >= 38.0) or (temp_delta >= 1.0 and last_pulse >= 90) or (last_pain >= 7)

    return {
        "status": "DEVIATION_DETECTED" if is_deviated else "EXPECTED_CORRIDOR",
        "data_points_analyzed": len(observations),
        "temperature": {
            "latest": last_temp,
            "baseline": first_temp,
            "delta": temp_delta,
            "is_elevated": last_temp >= 38.0
        },
        "pulse": {
            "latest": last_pulse,
            "baseline": first_pulse,
            "delta": pulse_delta,
            "is_tachycardic": last_pulse >= 95
        },
        "pain": {
            "latest": last_pain,
            "baseline": first_pain,
            "delta": pain_delta
        },
        "suggested_action": (
            "Bedside surgical wound evaluation recommended for pyrexia/tachycardia."
            if is_deviated
            else "Continue mobilization and standard recovery protocol."
        ),
        "limitations": f"Analyzed {len(observations)} observation records. Sampling intervals are discrete rather than continuous telemetry."
    }
