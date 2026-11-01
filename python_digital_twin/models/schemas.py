"""Data models and schemas for AI-Driven Digital Twin for Post-Surgery Recovery."""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime

@dataclass
class PatientRecord:
    id: str
    full_name: str
    age: int
    gender: str
    contact_email: Optional[str]
    surgery_type: str
    surgery_date: str
    treating_clinician: str
    recovery_plan: str
    consent_status: str
    status: str
    surgical_site: str
    created_at: str

@dataclass
class ObservationRecord:
    id: str
    patient_id: str
    timestamp: str
    temperature_c: float
    pulse_bpm: int
    spo2_percent: int
    systolic_bp: Optional[int]
    diastolic_bp: Optional[int]
    pain_score: int
    weight_kg: Optional[float]
    mobility_meters: int
    appetite_level: str
    fatigue_level: str
    fluid_ml: Optional[int]
    symptoms: List[str] = field(default_factory=list)
    wound_observation: Dict[str, Any] = field(default_factory=dict)
    clinician_notes: Optional[str] = None
    data_source: str = "MANUAL_CLINICIAN"
    recorded_by: str = "Staff Clinician"

@dataclass
class AlertRecord:
    id: str
    patient_id: str
    severity: str
    trigger_rule: str
    explanation: str
    metric_snapshot: Dict[str, Any]
    status: str
    assigned_reviewer: Optional[str]
    clinical_notes: Optional[str]
    created_at: str
    resolved_at: Optional[str] = None
