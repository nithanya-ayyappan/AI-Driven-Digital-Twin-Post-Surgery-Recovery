export type UserRole = 'Administrator' | 'Clinician' | 'Patient';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  assignedPatientId?: string | null;
}

export type PatientStatus = 'In Recovery' | 'Discharged' | 'Needs Review' | 'Archived';
export type ConsentStatus = 'Consented' | 'Pending' | 'Withdrawn';

export interface Patient {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  contact_email?: string | null;
  surgery_type: string;
  surgery_date: string;
  treating_clinician: string;
  recovery_plan: string;
  consent_status: ConsentStatus;
  status: PatientStatus;
  surgical_site: string;
  created_at: string;
  latestObservation?: Observation | null;
  activeAlertsCount?: number;
  milestoneProgress?: {
    completed: number;
    total: number;
  };
}

export type DataSource = 'MANUAL_CLINICIAN' | 'PATIENT_REPORTED' | 'HARDWARE_ESP32' | 'SIMULATED';

export interface WoundObservation {
  redness?: string;
  swelling?: string;
  discharge?: string;
  dressing?: string;
  warmth?: string;
  tenderness?: string;
}

export interface Observation {
  id: string;
  patient_id: string;
  patient_name?: string;
  surgery_type?: string;
  timestamp: string;
  temperature_c: number;
  pulse_bpm: number;
  spo2_percent: number;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  pain_score: number;
  weight_kg?: number | null;
  mobility_meters?: number;
  appetite_level?: string;
  fatigue_level?: string;
  fluid_ml?: number | null;
  symptoms?: string[];
  symptoms_json?: string;
  wound_observation?: WoundObservation | null;
  wound_observation_json?: string;
  clinician_notes?: string;
  data_source: DataSource;
  recorded_by: string;
  created_at?: string;
}

export interface Milestone {
  id: string;
  patient_id: string;
  milestone_name: string;
  target_day: number;
  target_description: string;
  completed: number | boolean;
  completed_date?: string | null;
  clinician_notes?: string | null;
}

export type AlertSeverity = 'INFO' | 'REVIEW_RECOMMENDED' | 'URGENT_ATTENTION';
export type AlertStatus = 'New' | 'Under Review' | 'Escalated' | 'Resolved' | 'Dismissed';

export interface Alert {
  id: string;
  patient_id: string;
  patient_name?: string;
  surgery_type?: string;
  severity: AlertSeverity;
  trigger_rule: string;
  explanation: string;
  metric_snapshot?: any;
  metric_snapshot_json?: string;
  status: AlertStatus;
  assigned_reviewer?: string | null;
  clinical_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export type DeviceStatus = 'Connected' | 'Offline' | 'Not Configured' | 'Error';

export interface Device {
  id: string;
  device_name: string;
  device_type: string;
  assigned_patient_id?: string | null;
  assigned_patient_name?: string | null;
  status: DeviceStatus;
  last_seen?: string | null;
  battery_pct?: number | null;
  api_key: string;
  created_at: string;
}

export interface DeviceMessage {
  id: string;
  device_id: string;
  patient_id?: string | null;
  raw_payload_json: string;
  payload?: any;
  parsed_valid: number;
  error_reason?: string | null;
  received_at: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  user_role: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details: string;
  timestamp: string;
}

export interface AlertThresholds {
  id: string;
  temp_fever_c: number;
  pulse_high_bpm: number;
  pulse_low_bpm: number;
  spo2_floor_pct: number;
  pain_spike_delta: number;
  updated_by: string;
  updated_at: string;
}
