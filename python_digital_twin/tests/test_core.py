"""Automated tests for AI-Driven Digital Twin core modules."""

import unittest
import sqlite3
import os
import sys

# Ensure python_digital_twin is on path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from database.db import init_db, get_connection
from services.observation_service import validate_observation, record_observation
from services.trend_service import compute_recovery_trend
from services.device_service import validate_device_payload, generate_simulated_payload

class TestDigitalTwinCore(unittest.TestCase):
    def setUp(self):
        self.test_db = os.path.join(current_dir, "test_twin.db")
        if os.path.exists(self.test_db):
            os.remove(self.test_db)
        init_db(self.test_db)

    def tearDown(self):
        if os.path.exists(self.test_db):
            os.remove(self.test_db)

    def test_database_initialization(self):
        conn = get_connection(self.test_db)
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) as count FROM patients")
        count = cursor.fetchone()["count"]
        self.assertGreaterEqual(count, 3)
        conn.close()

    def test_observation_validation(self):
        # Valid vitals
        valid_data = {
            "temperature_c": 36.8,
            "pulse_bpm": 74,
            "spo2_percent": 98,
            "pain_score": 3
        }
        valid, msg = validate_observation(valid_data)
        self.assertTrue(valid)

        # Implausible temperature (e.g. 52°C)
        invalid_temp = {
            "temperature_c": 52.0,
            "pulse_bpm": 74,
            "spo2_percent": 98,
            "pain_score": 3
        }
        valid, msg = validate_observation(invalid_temp)
        self.assertFalse(valid)
        self.assertIn("plausible", msg)

    def test_fever_alert_generation(self):
        fever_obs = {
            "patient_id": "PT-2026-081",
            "temperature_c": 38.6,
            "pulse_bpm": 102,
            "spo2_percent": 97,
            "pain_score": 5,
            "data_source": "MANUAL_CLINICIAN",
            "recorded_by": "Test Clinician"
        }
        success, obs_id, alerts = record_observation(fever_obs, self.test_db)
        self.assertTrue(success)
        self.assertGreaterEqual(len(alerts), 1)
        self.assertEqual(alerts[0]["severity"], "URGENT_ATTENTION")

    def test_device_payload_validation(self):
        valid_payload = {
            "device_id": "ESP32-VITAL-01",
            "patient_id": "PT-2026-081",
            "measurements": {
                "temperature_c": 36.9,
                "pulse_bpm": 76,
                "spo2_percent": 98
            }
        }
        valid, err = validate_device_payload(valid_payload)
        self.assertTrue(valid)

        invalid_payload = {
            "device_id": "ESP32-VITAL-01"
            # Missing measurements
        }
        valid, err = validate_device_payload(invalid_payload)
        self.assertFalse(valid)

    def test_trend_computation(self):
        obs_sequence = [
            {"temperature_c": 36.8, "pulse_bpm": 72, "pain_score": 6},
            {"temperature_c": 36.9, "pulse_bpm": 74, "pain_score": 4},
            {"temperature_c": 36.7, "pulse_bpm": 70, "pain_score": 2}
        ]
        trend = compute_recovery_trend(obs_sequence)
        self.assertEqual(trend["status"], "EXPECTED_CORRIDOR")
        self.assertEqual(trend["pain"]["delta"], -4)

if __name__ == "__main__":
    unittest.main()
