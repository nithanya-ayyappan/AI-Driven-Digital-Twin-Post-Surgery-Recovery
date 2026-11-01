import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(process.cwd(), 'recovery_twin.db');

export function getDatabase(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

export function initDatabase(): void {
  const db = getDatabase();

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Administrator', 'Clinician', 'Patient')),
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
      consent_status TEXT NOT NULL CHECK(consent_status IN ('Consented', 'Pending', 'Withdrawn')),
      status TEXT NOT NULL CHECK(status IN ('In Recovery', 'Discharged', 'Needs Review', 'Archived')),
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
      data_source TEXT NOT NULL CHECK(data_source IN ('MANUAL_CLINICIAN', 'PATIENT_REPORTED', 'HARDWARE_ESP32', 'SIMULATED')),
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
      severity TEXT NOT NULL CHECK(severity IN ('INFO', 'REVIEW_RECOMMENDED', 'URGENT_ATTENTION')),
      trigger_rule TEXT NOT NULL,
      explanation TEXT NOT NULL,
      metric_snapshot_json TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('New', 'Under Review', 'Escalated', 'Resolved', 'Dismissed')),
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
      status TEXT NOT NULL CHECK(status IN ('Connected', 'Offline', 'Not Configured', 'Error')),
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
      temp_fever_c REAL NOT NULL DEFAULT 38.0,
      pulse_high_bpm INTEGER NOT NULL DEFAULT 100,
      pulse_low_bpm INTEGER NOT NULL DEFAULT 50,
      spo2_floor_pct INTEGER NOT NULL DEFAULT 94,
      pain_spike_delta INTEGER NOT NULL DEFAULT 3,
      updated_by TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Check if users already seeded
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedDatabase(db);
  }
}

export function seedDatabase(db: DatabaseSync): void {
  const now = new Date().toISOString();

  // 1. Thresholds
  db.prepare(`
    INSERT INTO alert_thresholds (id, temp_fever_c, pulse_high_bpm, pulse_low_bpm, spo2_floor_pct, pain_spike_delta, updated_by, updated_at)
    VALUES ('default', 38.0, 100, 50, 94, 3, 'system@recovery.org', ?)
  `).run(now);

  // 2. Demo Users (securely identified, role-aware)
  const users = [
    {
      id: 'usr-admin',
      email: 'admin@recovery.org',
      password_hash: 'admin123', // In prototype demo, simple hashed/checked
      full_name: 'Dr. Aris Thorne (Chief Medical Officer)',
      role: 'Administrator',
      assigned_patient_id: null,
      created_at: now
    },
    {
      id: 'usr-clinician-1',
      email: 'clinician@hospital.org',
      password_hash: 'clinician123',
      full_name: 'Dr. Rachel Vance, MD (Post-Op Surgical Lead)',
      role: 'Clinician',
      assigned_patient_id: null,
      created_at: now
    },
    {
      id: 'usr-patient-1',
      email: 'patient.sarah@recovery.org',
      password_hash: 'patient123',
      full_name: 'Sarah Jenkins',
      role: 'Patient',
      assigned_patient_id: 'PT-2026-081',
      created_at: now
    }
  ];

  for (const u of users) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, assigned_patient_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(u.id, u.email, u.password_hash, u.full_name, u.role, u.assigned_patient_id, u.created_at);
  }

  // 3. Fictional Patients (labeled synthetic)
  const patients = [
    {
      id: 'PT-2026-081',
      full_name: 'Sarah Jenkins',
      age: 42,
      gender: 'Female',
      contact_email: 'patient.sarah@recovery.org',
      surgery_type: 'Laparoscopic Cholecystectomy',
      surgery_date: '2026-10-28', // Day 4 post-op
      treating_clinician: 'Dr. Rachel Vance, MD',
      recovery_plan: 'Standard Laparoscopic Protocol - 14 Days Recovery',
      consent_status: 'Consented',
      status: 'In Recovery',
      surgical_site: 'Right Upper Abdominal Quadrant',
      created_at: now
    },
    {
      id: 'PT-2026-082',
      full_name: 'Robert Chen',
      age: 64,
      gender: 'Male',
      contact_email: 'robert.chen.demo@hospital.org',
      surgery_type: 'Total Knee Arthroplasty (Right)',
      surgery_date: '2026-10-29', // Day 3 post-op
      treating_clinician: 'Dr. Rachel Vance, MD',
      recovery_plan: 'Orthopedic Major Joint Mobilization Protocol',
      consent_status: 'Consented',
      status: 'Needs Review',
      surgical_site: 'Right Knee Joint & Patellar Region',
      created_at: now
    },
    {
      id: 'PT-2026-083',
      full_name: 'Marcus Vance',
      age: 57,
      gender: 'Male',
      contact_email: 'marcus.vance.demo@hospital.org',
      surgery_type: 'Inguinal Hernia Repair (Open)',
      surgery_date: '2026-10-26', // Day 6 post-op
      treating_clinician: 'Dr. Kenneth Cole, MD',
      recovery_plan: 'Abdominal Wall Reinforcement Protocol',
      consent_status: 'Consented',
      status: 'In Recovery',
      surgical_site: 'Right Inguinal Canal',
      created_at: now
    },
    {
      id: 'PT-2026-084',
      full_name: 'Elena Rostova',
      age: 38,
      gender: 'Female',
      contact_email: 'elena.rostova.demo@hospital.org',
      surgery_type: 'Emergency Appendectomy',
      surgery_date: '2026-10-31', // Day 1 post-op
      treating_clinician: 'Dr. Rachel Vance, MD',
      recovery_plan: 'Acute Appendicitis Post-Op Surveillance',
      consent_status: 'Consented',
      status: 'In Recovery',
      surgical_site: 'Right Lower Abdominal Quadrant (McBurney point)',
      created_at: now
    }
  ];

  for (const p of patients) {
    db.prepare(`
      INSERT INTO patients (id, full_name, age, gender, contact_email, surgery_type, surgery_date, treating_clinician, recovery_plan, consent_status, status, surgical_site, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.id, p.full_name, p.age, p.gender, p.contact_email, p.surgery_type, p.surgery_date, p.treating_clinician, p.recovery_plan, p.consent_status, p.status, p.surgical_site, p.created_at);
  }

  // 4. Longitudinal Observations for Sarah Jenkins (PT-2026-081)
  const sarahObservations = [
    {
      id: 'obs-081-01',
      patient_id: 'PT-2026-081',
      timestamp: '2026-10-28T16:00:00Z',
      temperature_c: 37.1,
      pulse_bpm: 82,
      spo2_percent: 98,
      systolic_bp: 124,
      diastolic_bp: 78,
      pain_score: 6,
      weight_kg: 68.2,
      mobility_meters: 20,
      appetite_level: 'Low',
      fatigue_level: 'High',
      fluid_ml: 600,
      symptoms_json: JSON.stringify(['Mild surgical site discomfort', 'Mild grogginess']),
      wound_observation_json: JSON.stringify({ redness: 'Mild edge erythema', swelling: 'Minimal', discharge: 'None', dressing: 'Clean & intact' }),
      clinician_notes: 'PACU recovery stable. Patient alert and oriented x3.',
      data_source: 'MANUAL_CLINICIAN',
      recorded_by: 'Nurse Practitioner Hayes',
      created_at: now
    },
    {
      id: 'obs-081-02',
      patient_id: 'PT-2026-081',
      timestamp: '2026-10-29T09:30:00Z',
      temperature_c: 36.9,
      pulse_bpm: 76,
      spo2_percent: 99,
      systolic_bp: 118,
      diastolic_bp: 76,
      pain_score: 4,
      weight_kg: 68.0,
      mobility_meters: 80,
      appetite_level: 'Moderate',
      fatigue_level: 'Moderate',
      fluid_ml: 1200,
      symptoms_json: JSON.stringify(['Abdominal tightness']),
      wound_observation_json: JSON.stringify({ redness: 'None', swelling: 'None', discharge: 'None', dressing: 'Dry & dry' }),
      clinician_notes: 'Post-op Day 1 morning check. Tolerating clear liquids well.',
      data_source: 'MANUAL_CLINICIAN',
      recorded_by: 'Dr. Rachel Vance, MD',
      created_at: now
    },
    {
      id: 'obs-081-03',
      patient_id: 'PT-2026-081',
      timestamp: '2026-10-29T20:00:00Z',
      temperature_c: 37.0,
      pulse_bpm: 74,
      spo2_percent: 98,
      systolic_bp: 120,
      diastolic_bp: 75,
      pain_score: 3,
      weight_kg: 68.1,
      mobility_meters: 150,
      appetite_level: 'Moderate',
      fatigue_level: 'Moderate',
      fluid_ml: 1800,
      symptoms_json: JSON.stringify([]),
      wound_observation_json: JSON.stringify({ redness: 'None', swelling: 'None', discharge: 'None', dressing: 'Intact' }),
      clinician_notes: 'Evening self-check completed. Pain managed well with non-opioid analgesics.',
      data_source: 'PATIENT_REPORTED',
      recorded_by: 'Sarah Jenkins',
      created_at: now
    },
    {
      id: 'obs-081-04',
      patient_id: 'PT-2026-081',
      timestamp: '2026-10-30T10:15:00Z',
      temperature_c: 36.8,
      pulse_bpm: 72,
      spo2_percent: 98,
      systolic_bp: 116,
      diastolic_bp: 74,
      pain_score: 2,
      weight_kg: 67.9,
      mobility_meters: 300,
      appetite_level: 'Good',
      fatigue_level: 'Mild',
      fluid_ml: 2000,
      symptoms_json: JSON.stringify([]),
      wound_observation_json: JSON.stringify({ redness: 'None', swelling: 'None', discharge: 'None', dressing: 'Clean' }),
      clinician_notes: 'Transitioned to regular diet. Ambulated around ward without assistance.',
      data_source: 'HARDWARE_ESP32',
      recorded_by: 'Device ESP32-VITAL-01',
      created_at: now
    },
    {
      id: 'obs-081-05',
      patient_id: 'PT-2026-081',
      timestamp: '2026-10-31T14:45:00Z',
      temperature_c: 36.7,
      pulse_bpm: 70,
      spo2_percent: 99,
      systolic_bp: 118,
      diastolic_bp: 75,
      pain_score: 2,
      weight_kg: 67.8,
      mobility_meters: 500,
      appetite_level: 'Good',
      fatigue_level: 'Minimal',
      fluid_ml: 2200,
      symptoms_json: JSON.stringify([]),
      wound_observation_json: JSON.stringify({ redness: 'None', swelling: 'None', discharge: 'None', dressing: 'Skin glue intact' }),
      clinician_notes: 'Discharge prep check. Incisions healing well, zero purulent exudate.',
      data_source: 'MANUAL_CLINICIAN',
      recorded_by: 'Dr. Rachel Vance, MD',
      created_at: now
    },
    {
      id: 'obs-081-06',
      patient_id: 'PT-2026-081',
      timestamp: '2026-11-01T08:00:00Z',
      temperature_c: 36.8,
      pulse_bpm: 68,
      spo2_percent: 98,
      systolic_bp: 115,
      diastolic_bp: 72,
      pain_score: 1,
      weight_kg: 67.9,
      mobility_meters: 650,
      appetite_level: 'Normal',
      fatigue_level: 'Minimal',
      fluid_ml: 2100,
      symptoms_json: JSON.stringify([]),
      wound_observation_json: JSON.stringify({ redness: 'None', swelling: 'None', discharge: 'None', dressing: 'Dry' }),
      clinician_notes: 'Home recovery morning log. Patient reports feeling active and comfortable.',
      data_source: 'HARDWARE_ESP32',
      recorded_by: 'Device ESP32-VITAL-01',
      created_at: now
    }
  ];

  // Longitudinal Observations for Robert Chen (PT-2026-082) - Has concerning temperature trend for review
  const robertObservations = [
    {
      id: 'obs-082-01',
      patient_id: 'PT-2026-082',
      timestamp: '2026-10-29T18:00:00Z',
      temperature_c: 37.2,
      pulse_bpm: 78,
      spo2_percent: 97,
      systolic_bp: 132,
      diastolic_bp: 84,
      pain_score: 7,
      weight_kg: 84.5,
      mobility_meters: 10,
      appetite_level: 'Low',
      fatigue_level: 'High',
      fluid_ml: 900,
      symptoms_json: JSON.stringify(['Significant joint stiffness', 'Nausea post-anesthesia']),
      wound_observation_json: JSON.stringify({ redness: 'Moderate expected edge redness', swelling: 'Moderate joint effusion', discharge: 'Minimal serosanguinous', dressing: 'Compression wrap intact' }),
      clinician_notes: 'Day 0 post-op knee arthroplasty. Cryo-cuff applied.',
      data_source: 'MANUAL_CLINICIAN',
      recorded_by: 'Nurse Anderson',
      created_at: now
    },
    {
      id: 'obs-082-02',
      patient_id: 'PT-2026-082',
      timestamp: '2026-10-30T11:00:00Z',
      temperature_c: 37.4,
      pulse_bpm: 82,
      spo2_percent: 96,
      systolic_bp: 130,
      diastolic_bp: 82,
      pain_score: 5,
      weight_kg: 84.3,
      mobility_meters: 35,
      appetite_level: 'Moderate',
      fatigue_level: 'Moderate',
      fluid_ml: 1400,
      symptoms_json: JSON.stringify(['Local knee heat']),
      wound_observation_json: JSON.stringify({ redness: 'Slight spreading erythema', swelling: 'Moderate swelling', discharge: 'Minimal serous', dressing: 'Changed' }),
      clinician_notes: 'Physical therapy initiated. Quad sets and heel slides.',
      data_source: 'MANUAL_CLINICIAN',
      recorded_by: 'PT Miller',
      created_at: now
    },
    {
      id: 'obs-082-03',
      patient_id: 'PT-2026-082',
      timestamp: '2026-10-31T17:30:00Z',
      temperature_c: 37.9,
      pulse_bpm: 91,
      spo2_percent: 95,
      systolic_bp: 138,
      diastolic_bp: 88,
      pain_score: 6,
      weight_kg: 84.6,
      mobility_meters: 45,
      appetite_level: 'Reduced',
      fatigue_level: 'High',
      fluid_ml: 1200,
      symptoms_json: JSON.stringify(['Chills', 'Localized knee throbbing', 'Fatigue']),
      wound_observation_json: JSON.stringify({ redness: 'Increased peri-incisional erythema >2cm', swelling: 'Marked knee edema', discharge: 'Cloudy seropurulent exudate noted', dressing: 'Moist dressing' }),
      clinician_notes: 'Temperature rising. Patient feels feverish. Dressing inspected.',
      data_source: 'MANUAL_CLINICIAN',
      recorded_by: 'Nurse Anderson',
      created_at: now
    },
    {
      id: 'obs-082-04',
      patient_id: 'PT-2026-082',
      timestamp: '2026-11-01T07:15:00Z',
      temperature_c: 38.3,
      pulse_bpm: 96,
      spo2_percent: 94,
      systolic_bp: 142,
      diastolic_bp: 90,
      pain_score: 7,
      weight_kg: 84.7,
      mobility_meters: 15,
      appetite_level: 'Poor',
      fatigue_level: 'Severe',
      fluid_ml: 800,
      symptoms_json: JSON.stringify(['Fever', 'Chills', 'Severe localized warmth', 'Reduced mobility']),
      wound_observation_json: JSON.stringify({ redness: 'Erythema extending 3.5cm from suture line', swelling: 'Significant swelling', discharge: 'Purulent discharge detected', dressing: 'Saturated edge' }),
      clinician_notes: 'Low-grade fever confirmed 38.3°C. Heart rate elevated 96 bpm. Surgical team notified for urgent review.',
      data_source: 'HARDWARE_ESP32',
      recorded_by: 'Device ESP32-VITAL-02',
      created_at: now
    }
  ];

  // Observations for Marcus Vance (PT-2026-083)
  const marcusObservations = [
    {
      id: 'obs-083-01',
      patient_id: 'PT-2026-083',
      timestamp: '2026-10-27T10:00:00Z',
      temperature_c: 36.9,
      pulse_bpm: 75,
      spo2_percent: 98,
      systolic_bp: 122,
      diastolic_bp: 78,
      pain_score: 5,
      weight_kg: 79.0,
      mobility_meters: 50,
      appetite_level: 'Moderate',
      fatigue_level: 'Moderate',
      fluid_ml: 1500,
      symptoms_json: JSON.stringify(['Groin pulling sensation on standing']),
      wound_observation_json: JSON.stringify({ redness: 'Minimal', swelling: 'Slight ridge', discharge: 'None', dressing: 'Dry' }),
      clinician_notes: 'Day 1 hernia post-op. Instructed on avoiding Valsalva maneuver.',
      data_source: 'MANUAL_CLINICIAN',
      recorded_by: 'Dr. Kenneth Cole, MD',
      created_at: now
    },
    {
      id: 'obs-083-02',
      patient_id: 'PT-2026-083',
      timestamp: '2026-10-31T15:00:00Z',
      temperature_c: 36.7,
      pulse_bpm: 69,
      spo2_percent: 99,
      systolic_bp: 120,
      diastolic_bp: 76,
      pain_score: 2,
      weight_kg: 78.8,
      mobility_meters: 600,
      appetite_level: 'Good',
      fatigue_level: 'Low',
      fluid_ml: 2300,
      symptoms_json: JSON.stringify([]),
      wound_observation_json: JSON.stringify({ redness: 'None', swelling: 'Resolving', discharge: 'None', dressing: 'Steri-strips clean' }),
      clinician_notes: 'Follow up exam. Healing well. Cleared for light walking.',
      data_source: 'MANUAL_CLINICIAN',
      recorded_by: 'Dr. Kenneth Cole, MD',
      created_at: now
    }
  ];

  const allObservations = [...sarahObservations, ...robertObservations, ...marcusObservations];
  const insertObs = db.prepare(`
    INSERT INTO observations (
      id, patient_id, timestamp, temperature_c, pulse_bpm, spo2_percent,
      systolic_bp, diastolic_bp, pain_score, weight_kg, mobility_meters,
      appetite_level, fatigue_level, fluid_ml, symptoms_json, wound_observation_json,
      clinician_notes, data_source, recorded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const o of allObservations) {
    insertObs.run(
      o.id, o.patient_id, o.timestamp, o.temperature_c, o.pulse_bpm, o.spo2_percent,
      o.systolic_bp, o.diastolic_bp, o.pain_score, o.weight_kg, o.mobility_meters,
      o.appetite_level, o.fatigue_level, o.fluid_ml, o.symptoms_json, o.wound_observation_json,
      o.clinician_notes, o.data_source, o.recorded_by, o.created_at
    );
  }

  // 5. Recovery Milestones
  const milestones = [
    // Sarah Jenkins
    { id: 'ms-081-01', patient_id: 'PT-2026-081', milestone_name: 'Post-Op Mobilization (Day 1)', target_day: 1, target_description: 'Ambulate at least 50m with nursing assistance', completed: 1, completed_date: '2026-10-29', clinician_notes: 'Achieved 80m comfortably.' },
    { id: 'ms-081-02', patient_id: 'PT-2026-081', milestone_name: 'Dietary Progression (Day 2)', target_day: 2, target_description: 'Advance from clear liquids to regular soft diet with zero emesis', completed: 1, completed_date: '2026-10-30', clinician_notes: 'Tolerating normal diet without nausea.' },
    { id: 'ms-081-03', patient_id: 'PT-2026-081', milestone_name: 'Pain Management Stabilization (Day 3)', target_day: 3, target_description: 'Resting pain <= 3/10 maintained on oral non-opioid medications', completed: 1, completed_date: '2026-10-31', clinician_notes: 'Pain rating 2/10 on acetaminophen.' },
    { id: 'ms-081-04', patient_id: 'PT-2026-081', milestone_name: 'Wound Dressing & Skin Integrity (Day 5)', target_day: 5, target_description: 'Incisions dry, margins well-apposed, no discharge', completed: 0, completed_date: null, clinician_notes: 'Scheduled for Day 5 inspection.' },
    { id: 'ms-081-05', patient_id: 'PT-2026-081', milestone_name: 'Independent Functional Mobility (Day 7)', target_day: 7, target_description: 'Walk 1000m daily, ascend/descend 1 flight of stairs safely', completed: 0, completed_date: null, clinician_notes: 'Target Day 7.' },

    // Robert Chen
    { id: 'ms-082-01', patient_id: 'PT-2026-082', milestone_name: 'Knee Flexion >= 45 Degrees (Day 1)', target_day: 1, target_description: 'Active-assisted knee bend to 45 deg with physiotherapist', completed: 1, completed_date: '2026-10-30', clinician_notes: 'Reached 50 degrees.' },
    { id: 'ms-082-02', patient_id: 'PT-2026-082', milestone_name: 'Transfer & Walker Ambulation (Day 2)', target_day: 2, target_description: 'Bed-to-chair transfer and 30m walk using front-wheeled walker', completed: 1, completed_date: '2026-10-30', clinician_notes: 'Completed 35m with contact guard.' },
    { id: 'ms-082-03', patient_id: 'PT-2026-082', milestone_name: 'Knee Flexion >= 70 Degrees (Day 3)', target_day: 3, target_description: 'Active knee bend to 70 deg with reduced assistance', completed: 0, completed_date: null, clinician_notes: 'Delayed due to increased swelling and pain spike.' },
    { id: 'ms-082-04', patient_id: 'PT-2026-082', milestone_name: 'Stair Ascent/Descent with Cane (Day 5)', target_day: 5, target_description: 'Independent 4 steps with handrail', completed: 0, completed_date: null, clinician_notes: 'Pending resolution of knee edema.' },

    // Marcus Vance
    { id: 'ms-083-01', patient_id: 'PT-2026-083', milestone_name: 'Bladder Voiding & Early Ambulation (Day 1)', target_day: 1, target_description: 'Spontaneous voiding and 100m walk', completed: 1, completed_date: '2026-10-27', clinician_notes: 'Success within 4 hours.' },
    { id: 'ms-083-02', patient_id: 'PT-2026-083', milestone_name: 'Cough & Core Stability (Day 3)', target_day: 3, target_description: 'Splinted cough without sharp groin pain', completed: 1, completed_date: '2026-10-29', clinician_notes: 'Technique confirmed.' },
    { id: 'ms-083-03', patient_id: 'PT-2026-083', milestone_name: 'Unassisted Stair Navigation (Day 5)', target_day: 5, target_description: 'Climb 12 steps unassisted without abdominal guarding', completed: 1, completed_date: '2026-10-31', clinician_notes: 'Smooth ambulation recorded.' }
  ];

  const insertMilestone = db.prepare(`
    INSERT INTO milestones (id, patient_id, milestone_name, target_day, target_description, completed, completed_date, clinician_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const m of milestones) {
    insertMilestone.run(m.id, m.patient_id, m.milestone_name, m.target_day, m.target_description, m.completed, m.completed_date, m.clinician_notes);
  }

  // 6. Clinical Alerts
  const alerts = [
    {
      id: 'ALT-1092',
      patient_id: 'PT-2026-082',
      severity: 'URGENT_ATTENTION',
      trigger_rule: 'RULE_SURGICAL_INFECTION_SURVEILLANCE',
      explanation: 'Body temperature reached 38.3°C (+1.1°C above baseline) accompanied by resting tachycardia (96 bpm) on Post-Op Day 3. Suture erythema >3cm with purulent exudate reported.',
      metric_snapshot_json: JSON.stringify({
        temperature_c: 38.3,
        pulse_bpm: 96,
        spo2_percent: 94,
        pain_score: 7,
        site: 'Right Knee Joint'
      }),
      status: 'Under Review',
      assigned_reviewer: 'Dr. Rachel Vance, MD',
      clinical_notes: 'Urgent bedside surgical inspection ordered. CBC, CRP, and wound swab sent to pathology. Knee ultrasound requested to rule out joint effusion/hematoma.',
      created_at: '2026-11-01T07:20:00Z',
      resolved_at: null
    },
    {
      id: 'ALT-1088',
      patient_id: 'PT-2026-082',
      severity: 'REVIEW_RECOMMENDED',
      trigger_rule: 'RULE_PAIN_SCORE_SPIKE',
      explanation: 'Patient pain score escalated from 5/10 to 7/10 within 14 hours despite scheduled oral analgesia.',
      metric_snapshot_json: JSON.stringify({
        previous_pain: 5,
        current_pain: 7,
        delta: 2
      }),
      status: 'Escalated',
      assigned_reviewer: 'Dr. Rachel Vance, MD',
      clinical_notes: 'Reviewed in conjunction with temperature elevation. Suspect acute inflammatory response.',
      created_at: '2026-10-31T17:35:00Z',
      resolved_at: null
    },
    {
      id: 'ALT-1075',
      patient_id: 'PT-2026-081',
      severity: 'INFO',
      trigger_rule: 'RULE_MILESTONE_PROGRESS',
      explanation: 'Patient Sarah Jenkins has completed 3 out of 5 recovery milestones ahead of projected schedule on Post-Op Day 4.',
      metric_snapshot_json: JSON.stringify({
        milestones_completed: 3,
        total_milestones: 5,
        trend: 'Positive'
      }),
      status: 'Resolved',
      assigned_reviewer: 'Dr. Rachel Vance, MD',
      clinical_notes: 'Confirmed excellent trajectory. Approved for discharge preparation.',
      created_at: '2026-10-31T15:00:00Z',
      resolved_at: '2026-10-31T16:00:00Z'
    }
  ];

  const insertAlert = db.prepare(`
    INSERT INTO alerts (id, patient_id, severity, trigger_rule, explanation, metric_snapshot_json, status, assigned_reviewer, clinical_notes, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of alerts) {
    insertAlert.run(a.id, a.patient_id, a.severity, a.trigger_rule, a.explanation, a.metric_snapshot_json, a.status, a.assigned_reviewer, a.clinical_notes, a.created_at, a.resolved_at);
  }

  // 7. Registered Devices (ESP32 Integration)
  const devices = [
    {
      id: 'ESP32-VITAL-01',
      device_name: 'Bedside ESP32 Vitals Hub #01',
      device_type: 'Multi-Sensor Post-Op Hub (Temp, SpO2, Pulse)',
      assigned_patient_id: 'PT-2026-081',
      status: 'Connected',
      last_seen: '2026-11-01T08:00:00Z',
      battery_pct: 94,
      api_key: 'esp32_key_vitals01_secure',
      created_at: now
    },
    {
      id: 'ESP32-VITAL-02',
      device_name: 'Ward ESP32 Telemetry Monitor #02',
      device_type: 'Wearable Continuous Telemetry Sensor',
      assigned_patient_id: 'PT-2026-082',
      status: 'Connected',
      last_seen: '2026-11-01T07:15:00Z',
      battery_pct: 78,
      api_key: 'esp32_key_vitals02_secure',
      created_at: now
    },
    {
      id: 'ESP32-VITAL-03',
      device_name: 'Backup ESP32 Pulse-Ox Rig #03',
      device_type: 'Optical PPG Pulse Oximeter Module',
      assigned_patient_id: null,
      status: 'Offline',
      last_seen: '2026-10-30T12:00:00Z',
      battery_pct: 45,
      api_key: 'esp32_key_vitals03_secure',
      created_at: now
    }
  ];

  const insertDevice = db.prepare(`
    INSERT INTO devices (id, device_name, device_type, assigned_patient_id, status, last_seen, battery_pct, api_key, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const d of devices) {
    insertDevice.run(d.id, d.device_name, d.device_type, d.assigned_patient_id, d.status, d.last_seen, d.battery_pct, d.api_key, d.created_at);
  }

  // 8. Device Messages Log
  const sampleDeviceMsg = {
    device_id: 'ESP32-VITAL-01',
    patient_id: 'PT-2026-081',
    timestamp: '2026-11-01T08:00:00Z',
    measurements: {
      temperature_c: 36.8,
      pulse_bpm: 68,
      spo2_percent: 98,
      systolic_bp: 115,
      diastolic_bp: 72
    },
    battery_pct: 94
  };

  db.prepare(`
    INSERT INTO device_messages (id, device_id, patient_id, raw_payload_json, parsed_valid, error_reason, received_at)
    VALUES ('msg-init-01', 'ESP32-VITAL-01', 'PT-2026-081', ?, 1, NULL, ?)
  `).run(JSON.stringify(sampleDeviceMsg), '2026-11-01T08:00:00Z');

  // 9. Initial Audit Logs
  const auditLogs = [
    {
      id: 'aud-01',
      user_email: 'system@recovery.org',
      user_role: 'Administrator',
      action: 'SYSTEM_BOOTSTRAP',
      target_type: 'SYSTEM',
      target_id: '05ce4c05',
      details: 'Initialized SQLite clinical database with synthetic demo dataset.',
      timestamp: now
    },
    {
      id: 'aud-02',
      user_email: 'clinician@hospital.org',
      user_role: 'Clinician',
      action: 'OBSERVATION_RECORDED',
      target_type: 'PATIENT',
      target_id: 'PT-2026-082',
      details: 'Recorded post-op day 3 observation with temperature 38.3°C and pulse 96 bpm.',
      timestamp: '2026-11-01T07:16:00Z'
    },
    {
      id: 'aud-03',
      user_email: 'clinician@hospital.org',
      user_role: 'Clinician',
      action: 'ALERT_STATUS_UPDATE',
      target_type: 'ALERT',
      target_id: 'ALT-1092',
      details: 'Updated status to Under Review. Ordered urgent wound swab and CBC.',
      timestamp: '2026-11-01T07:25:00Z'
    }
  ];

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_email, user_role, action, target_type, target_id, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const al of auditLogs) {
    insertAudit.run(al.id, al.user_email, al.user_role, al.action, al.target_type, al.target_id, al.details, al.timestamp);
  }
}
