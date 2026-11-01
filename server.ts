import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase, initDatabase, seedDatabase } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Initialize SQLite database
initDatabase();

// --- Clinical Decision Support Rule Engine ---
function evaluateClinicalRules(patientId: string, observation: any, recorderEmail: string) {
  const db = getDatabase();
  const thresholds = (db.prepare('SELECT * FROM alert_thresholds WHERE id = ?').get('default') as any) || {
    temp_fever_c: 38.0,
    pulse_high_bpm: 100,
    pulse_low_bpm: 50,
    spo2_floor_pct: 94,
    pain_spike_delta: 3
  };

  const newAlerts: any[] = [];
  const now = new Date().toISOString();

  // 1. Fever & Tachycardia (Potential Surgical Site Infection / Systemic response)
  if (observation.temperature_c >= thresholds.temp_fever_c) {
    const isTachycardic = observation.pulse_bpm >= 90;
    const severity = observation.temperature_c >= 38.5 || (observation.temperature_c >= 38.0 && isTachycardic)
      ? 'URGENT_ATTENTION'
      : 'REVIEW_RECOMMENDED';

    const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
    const triggerRule = 'RULE_POSTOP_FEVER_SURVEILLANCE';
    const explanation = `Body temperature recorded at ${observation.temperature_c}°C (>= ${thresholds.temp_fever_c}°C threshold)${
      isTachycardic ? ` with concurrent elevated heart rate (${observation.pulse_bpm} bpm).` : '.'
    } Clinical dressing and surgical site inspection recommended to assess for post-operative inflammatory or infectious complications.`;

    db.prepare(`
      INSERT INTO alerts (id, patient_id, severity, trigger_rule, explanation, metric_snapshot_json, status, assigned_reviewer, clinical_notes, created_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, 'New', NULL, NULL, ?, NULL)
    `).run(alertId, patientId, severity, triggerRule, explanation, JSON.stringify({
      temperature_c: observation.temperature_c,
      pulse_bpm: observation.pulse_bpm,
      spo2_percent: observation.spo2_percent,
      pain_score: observation.pain_score
    }), now);

    newAlerts.push({ id: alertId, severity, triggerRule, explanation });
  }

  // 2. Hypoxemia (SpO2 desaturation)
  if (observation.spo2_percent < thresholds.spo2_floor_pct) {
    const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
    const severity = observation.spo2_percent < 90 ? 'URGENT_ATTENTION' : 'REVIEW_RECOMMENDED';
    const triggerRule = 'RULE_OXYGEN_DESATURATION';
    const explanation = `SpO2 recorded at ${observation.spo2_percent}% (below protocol threshold of ${thresholds.spo2_floor_pct}%). Evaluate patient airway, incentive spirometry adherence, and respiratory effort.`;

    db.prepare(`
      INSERT INTO alerts (id, patient_id, severity, trigger_rule, explanation, metric_snapshot_json, status, assigned_reviewer, clinical_notes, created_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, 'New', NULL, NULL, ?, NULL)
    `).run(alertId, patientId, severity, triggerRule, explanation, JSON.stringify({
      spo2_percent: observation.spo2_percent,
      pulse_bpm: observation.pulse_bpm
    }), now);

    newAlerts.push({ id: alertId, severity, triggerRule, explanation });
  }

  // 3. Acute Pain Spike
  const recentObs = db.prepare(`
    SELECT pain_score FROM observations
    WHERE patient_id = ? AND id != ?
    ORDER BY timestamp DESC LIMIT 1
  `).get(patientId, observation.id || '') as { pain_score: number } | undefined;

  if (recentObs && (observation.pain_score - recentObs.pain_score) >= thresholds.pain_spike_delta) {
    const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
    const triggerRule = 'RULE_PAIN_SCORE_SPIKE';
    const explanation = `Pain score escalated rapidly by +${observation.pain_score - recentObs.pain_score} points (from ${recentObs.pain_score}/10 to ${observation.pain_score}/10). Review analgesic regimen, nerve block dissipation, or localized swelling.`;

    db.prepare(`
      INSERT INTO alerts (id, patient_id, severity, trigger_rule, explanation, metric_snapshot_json, status, assigned_reviewer, clinical_notes, created_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, 'New', NULL, NULL, ?, NULL)
    `).run(alertId, patientId, 'REVIEW_RECOMMENDED', triggerRule, explanation, JSON.stringify({
      previous_pain: recentObs.pain_score,
      current_pain: observation.pain_score,
      delta: observation.pain_score - recentObs.pain_score
    }), now);

    newAlerts.push({ id: alertId, severity: 'REVIEW_RECOMMENDED', triggerRule, explanation });
  }

  return newAlerts;
}

// ======================== API ROUTES ========================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Digital Twin Recovery Backend', timestamp: new Date().toISOString() });
});

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const db = getDatabase();
  const user = db.prepare('SELECT id, email, full_name, role, assigned_patient_id FROM users WHERE email = ?').get(email) as any;

  if (!user) {
    return res.status(401).json({ error: 'Invalid user credentials. Please use demo accounts or sign up.' });
  }

  // Audit log
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO audit_logs (id, user_email, user_role, action, target_type, target_id, details, timestamp)
    VALUES (?, ?, ?, 'USER_LOGIN', 'AUTH', ?, 'Successful authentication to clinical session.', ?)
  `).run('aud-' + Date.now(), user.email, user.role, user.id, now);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      assignedPatientId: user.assigned_patient_id
    },
    token: 'session_' + Buffer.from(user.email).toString('base64') + '_' + Date.now()
  });
});

// Get all patients
app.get('/api/patients', (req, res) => {
  try {
    const db = getDatabase();
    const { status, search } = req.query;

    let query = 'SELECT * FROM patients WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (full_name LIKE ? OR id LIKE ? OR surgery_type LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const patients = db.prepare(query).all(...params) as any[];

    // Annotate latest observation and active alerts count
    const enriched = patients.map((p) => {
      const latestObs = db.prepare('SELECT * FROM observations WHERE patient_id = ? ORDER BY timestamp DESC LIMIT 1').get(p.id) as any;
      const activeAlerts = db.prepare("SELECT count(*) as count FROM alerts WHERE patient_id = ? AND status IN ('New', 'Under Review', 'Escalated')").get(p.id) as any;
      const completedMilestones = db.prepare('SELECT count(*) as count FROM milestones WHERE patient_id = ? AND completed = 1').get(p.id) as any;
      const totalMilestones = db.prepare('SELECT count(*) as count FROM milestones WHERE patient_id = ?').get(p.id) as any;

      return {
        ...p,
        latestObservation: latestObs || null,
        activeAlertsCount: activeAlerts?.count || 0,
        milestoneProgress: {
          completed: completedMilestones?.count || 0,
          total: totalMilestones?.count || 0
        }
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new patient
app.post('/api/patients', (req, res) => {
  try {
    const db = getDatabase();
    const {
      id,
      full_name,
      age,
      gender,
      contact_email,
      surgery_type,
      surgery_date,
      treating_clinician,
      recovery_plan,
      consent_status,
      surgical_site
    } = req.body;

    if (!full_name || !surgery_type || !surgery_date || !treating_clinician) {
      return res.status(400).json({ error: 'Missing required patient fields: full_name, surgery_type, surgery_date, treating_clinician' });
    }

    const patientId = id?.trim() || `PT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    // Check duplicate
    const existing = db.prepare('SELECT id FROM patients WHERE id = ?').get(patientId);
    if (existing) {
      return res.status(409).json({ error: `Patient ID ${patientId} already exists in registry.` });
    }

    db.prepare(`
      INSERT INTO patients (
        id, full_name, age, gender, contact_email, surgery_type,
        surgery_date, treating_clinician, recovery_plan, consent_status,
        status, surgical_site, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'In Recovery', ?, ?)
    `).run(
      patientId,
      full_name.trim(),
      parseInt(age) || 45,
      gender || 'Other',
      contact_email || null,
      surgery_type.trim(),
      surgery_date,
      treating_clinician.trim(),
      recovery_plan || 'Standard Enhanced Recovery Protocol (ERAS)',
      consent_status || 'Consented',
      surgical_site || 'Abdominal / General',
      now
    );

    // Seed default post-op milestones for this patient
    const defaultMilestones = [
      { name: 'Initial Assisted Ambulation', day: 1, desc: 'Ambulate 30m with clinical assistance' },
      { name: 'Gastrointestinal Tolerance', day: 2, desc: 'Tolerate oral clear fluids without nausea' },
      { name: 'Adequate Pain Control', day: 3, desc: 'Maintain resting pain rating < 4/10 on oral analgesics' },
      { name: 'Wound Margin Stability', day: 5, desc: 'Surgical incision clean, margins apposed, zero exudate' },
      { name: 'Independent Stair Ascent', day: 7, desc: 'Ascend 1 flight of stairs safely without dizziness' }
    ];

    const insertMilestone = db.prepare(`
      INSERT INTO milestones (id, patient_id, milestone_name, target_day, target_description, completed, completed_date, clinician_notes)
      VALUES (?, ?, ?, ?, ?, 0, NULL, NULL)
    `);

    defaultMilestones.forEach((dm, idx) => {
      insertMilestone.run(`ms-${patientId}-${idx + 1}`, patientId, dm.name, dm.day, dm.desc);
    });

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_email, user_role, action, target_type, target_id, details, timestamp)
      VALUES (?, 'system@recovery.org', 'Administrator', 'CREATE_PATIENT', 'PATIENT', ?, ?, ?)
    `).run('aud-' + Date.now(), patientId, `Created patient profile for ${full_name}.`, now);

    res.status(201).json({ message: 'Patient registered successfully', patientId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single patient detail with full Digital Twin recovery package
app.get('/api/patients/:id', (req, res) => {
  try {
    const db = getDatabase();
    const patientId = req.params.id;

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId) as any;
    if (!patient) {
      return res.status(404).json({ error: `Patient ${patientId} not found.` });
    }

    const observations = db.prepare('SELECT * FROM observations WHERE patient_id = ? ORDER BY timestamp ASC').all(patientId) as any[];
    const milestones = db.prepare('SELECT * FROM milestones WHERE patient_id = ? ORDER BY target_day ASC').all(patientId) as any[];
    const alerts = db.prepare('SELECT * FROM alerts WHERE patient_id = ? ORDER BY created_at DESC').all(patientId) as any[];
    const devices = db.prepare('SELECT * FROM devices WHERE assigned_patient_id = ?').all(patientId) as any[];

    // Parse JSON fields
    const parsedObservations = observations.map((o) => ({
      ...o,
      symptoms: o.symptoms_json ? JSON.parse(o.symptoms_json) : [],
      wound_observation: o.wound_observation_json ? JSON.parse(o.wound_observation_json) : null
    }));

    // Calculate days post-op
    const surgeryDate = new Date(patient.surgery_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - surgeryDate.getTime());
    const postOpDay = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Recovery Trajectory Engine (Digital Twin model)
    // Generates expected clinical recovery corridor vs actual longitudinal readings
    const trajectory = {
      surgeryType: patient.surgery_type,
      currentDay: postOpDay,
      expectedCorridors: {
        temperature_c: { min: 36.4, target: 36.8, max: 37.5 },
        pulse_bpm: { min: 60, target: 72, max: 88 },
        spo2_percent: { min: 95, target: 98, max: 100 },
        pain_score_target_by_day: [
          { day: 0, expected: 6.5 },
          { day: 1, expected: 5.0 },
          { day: 2, expected: 4.0 },
          { day: 3, expected: 3.0 },
          { day: 5, expected: 2.0 },
          { day: 7, expected: 1.0 },
          { day: 14, expected: 0.5 }
        ]
      }
    };

    res.json({
      patient,
      postOpDay,
      observations: parsedObservations,
      milestones,
      alerts,
      devices,
      trajectory
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update patient status or details
app.put('/api/patients/:id', (req, res) => {
  try {
    const db = getDatabase();
    const patientId = req.params.id;
    const { status, recovery_plan, treating_clinician, consent_status } = req.body;

    db.prepare(`
      UPDATE patients
      SET status = COALESCE(?, status),
          recovery_plan = COALESCE(?, recovery_plan),
          treating_clinician = COALESCE(?, treating_clinician),
          consent_status = COALESCE(?, consent_status)
      WHERE id = ?
    `).run(status, recovery_plan, treating_clinician, consent_status, patientId);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_email, user_role, action, target_type, target_id, details, timestamp)
      VALUES (?, 'clinician@hospital.org', 'Clinician', 'UPDATE_PATIENT', 'PATIENT', ?, ?, ?)
    `).run('aud-' + Date.now(), patientId, `Updated patient record fields. Status: ${status}`, new Date().toISOString());

    res.json({ message: 'Patient updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get observations with optional filtering
app.get('/api/observations', (req, res) => {
  try {
    const db = getDatabase();
    const { patient_id, limit } = req.query;

    let query = 'SELECT o.*, p.full_name as patient_name, p.surgery_type FROM observations o JOIN patients p ON o.patient_id = p.id';
    const params: any[] = [];

    if (patient_id) {
      query += ' WHERE o.patient_id = ?';
      params.push(patient_id);
    }

    query += ' ORDER BY o.timestamp DESC';
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit as string));
    }

    const obs = db.prepare(query).all(...params) as any[];
    const parsed = obs.map((o) => ({
      ...o,
      symptoms: o.symptoms_json ? JSON.parse(o.symptoms_json) : [],
      wound_observation: o.wound_observation_json ? JSON.parse(o.wound_observation_json) : null
    }));

    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Record new clinical observation
app.post('/api/observations', (req, res) => {
  try {
    const db = getDatabase();
    const {
      patient_id,
      timestamp,
      temperature_c,
      pulse_bpm,
      spo2_percent,
      systolic_bp,
      diastolic_bp,
      pain_score,
      weight_kg,
      mobility_meters,
      appetite_level,
      fatigue_level,
      fluid_ml,
      symptoms,
      wound_observation,
      clinician_notes,
      data_source,
      recorded_by
    } = req.body;

    if (!patient_id || temperature_c == null || pulse_bpm == null || spo2_percent == null || pain_score == null) {
      return res.status(400).json({ error: 'Missing core vital parameters: patient_id, temperature_c, pulse_bpm, spo2_percent, pain_score' });
    }

    // Physiological plausibility validation
    const tempNum = parseFloat(temperature_c);
    const pulseNum = parseInt(pulse_bpm);
    const spo2Num = parseInt(spo2_percent);
    const painNum = parseInt(pain_score);

    if (tempNum < 32.0 || tempNum > 43.0) {
      return res.status(422).json({ error: `Physiologically implausible temperature: ${tempNum}°C. Expected between 32.0°C and 43.0°C.` });
    }
    if (pulseNum < 30 || pulseNum > 240) {
      return res.status(422).json({ error: `Physiologically implausible pulse: ${pulseNum} bpm. Expected between 30 and 240 bpm.` });
    }
    if (spo2Num < 60 || spo2Num > 100) {
      return res.status(422).json({ error: `Physiologically implausible SpO2: ${spo2Num}%. Expected between 60% and 100%.` });
    }
    if (painNum < 0 || painNum > 10) {
      return res.status(422).json({ error: `Pain score must be on a 0-10 scale. Received: ${painNum}` });
    }

    const obsId = 'obs-' + Date.now();
    const now = new Date().toISOString();
    const obsTime = timestamp || now;

    db.prepare(`
      INSERT INTO observations (
        id, patient_id, timestamp, temperature_c, pulse_bpm, spo2_percent,
        systolic_bp, diastolic_bp, pain_score, weight_kg, mobility_meters,
        appetite_level, fatigue_level, fluid_ml, symptoms_json, wound_observation_json,
        clinician_notes, data_source, recorded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      obsId,
      patient_id,
      obsTime,
      tempNum,
      pulseNum,
      spo2Num,
      systolic_bp ? parseInt(systolic_bp) : null,
      diastolic_bp ? parseInt(diastolic_bp) : null,
      painNum,
      weight_kg ? parseFloat(weight_kg) : null,
      mobility_meters ? parseInt(mobility_meters) : 0,
      appetite_level || 'Normal',
      fatigue_level || 'Low',
      fluid_ml ? parseInt(fluid_ml) : null,
      JSON.stringify(symptoms || []),
      JSON.stringify(wound_observation || {}),
      clinician_notes || '',
      data_source || 'MANUAL_CLINICIAN',
      recorded_by || 'Staff Clinician',
      now
    );

    // Run clinical decision rules
    const generatedAlerts = evaluateClinicalRules(patient_id, {
      id: obsId,
      temperature_c: tempNum,
      pulse_bpm: pulseNum,
      spo2_percent: spo2Num,
      pain_score: painNum
    }, recorded_by || 'Staff Clinician');

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_email, user_role, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, 'Clinician', 'RECORD_OBSERVATION', 'OBSERVATION', ?, ?, ?)
    `).run('aud-' + Date.now(), recorded_by || 'clinician@hospital.org', obsId, `Recorded vitals: ${tempNum}°C, ${pulseNum} bpm, ${spo2Num}%, pain ${painNum}/10. Alerts triggered: ${generatedAlerts.length}`, now);

    res.status(201).json({
      message: 'Observation saved successfully',
      observationId: obsId,
      alertsTriggered: generatedAlerts
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Milestone completion status
app.put('/api/milestones/:id', (req, res) => {
  try {
    const db = getDatabase();
    const milestoneId = req.params.id;
    const { completed, clinician_notes } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE milestones
      SET completed = ?,
          completed_date = CASE WHEN ? = 1 THEN ? ELSE NULL END,
          clinician_notes = COALESCE(?, clinician_notes)
      WHERE id = ?
    `).run(completed ? 1 : 0, completed ? 1 : 0, now.split('T')[0], clinician_notes, milestoneId);

    res.json({ message: 'Milestone updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Alerts API
app.get('/api/alerts', (req, res) => {
  try {
    const db = getDatabase();
    const { status, severity, patient_id } = req.query;

    let query = 'SELECT a.*, p.full_name as patient_name, p.surgery_type FROM alerts a JOIN patients p ON a.patient_id = p.id WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'All') {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (severity && severity !== 'All') {
      query += ' AND a.severity = ?';
      params.push(severity);
    }
    if (patient_id) {
      query += ' AND a.patient_id = ?';
      params.push(patient_id);
    }

    query += ' ORDER BY a.created_at DESC';
    const alerts = db.prepare(query).all(...params) as any[];

    const parsed = alerts.map((a) => ({
      ...a,
      metric_snapshot: a.metric_snapshot_json ? JSON.parse(a.metric_snapshot_json) : {}
    }));

    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update alert status & add review notes
app.put('/api/alerts/:id', (req, res) => {
  try {
    const db = getDatabase();
    const alertId = req.params.id;
    const { status, assigned_reviewer, clinical_notes } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE alerts
      SET status = ?,
          assigned_reviewer = COALESCE(?, assigned_reviewer),
          clinical_notes = COALESCE(?, clinical_notes),
          resolved_at = CASE WHEN ? IN ('Resolved', 'Dismissed') THEN ? ELSE resolved_at END
      WHERE id = ?
    `).run(status, assigned_reviewer, clinical_notes, status, now, alertId);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_email, user_role, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, 'Clinician', 'ALERT_REVIEW_UPDATE', 'ALERT', ?, ?, ?)
    `).run('aud-' + Date.now(), assigned_reviewer || 'clinician@hospital.org', alertId, `Updated alert to ${status}. Notes: ${clinical_notes || 'None'}`, now);

    res.json({ message: 'Alert updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Devices API
app.get('/api/devices', (req, res) => {
  try {
    const db = getDatabase();
    const devices = db.prepare(`
      SELECT d.*, p.full_name as assigned_patient_name
      FROM devices d
      LEFT JOIN patients p ON d.assigned_patient_id = p.id
      ORDER BY d.created_at ASC
    `).all() as any[];

    res.json(devices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Assign / Update Device
app.put('/api/devices/:id', (req, res) => {
  try {
    const db = getDatabase();
    const deviceId = req.params.id;
    const { assigned_patient_id, status } = req.body;

    db.prepare(`
      UPDATE devices
      SET assigned_patient_id = ?,
          status = COALESCE(?, status)
      WHERE id = ?
    `).run(assigned_patient_id || null, status, deviceId);

    res.json({ message: 'Device configuration saved' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ESP32 Hardware Ingestion Endpoint (REST API for physical or simulated ESP32 microcontrollers)
app.post('/api/devices/ingest', (req, res) => {
  const db = getDatabase();
  const rawBody = req.body;
  const now = new Date().toISOString();
  const msgId = 'msg-' + Date.now();

  try {
    const { device_id, patient_id, timestamp, measurements, battery_pct } = rawBody;

    if (!device_id || !measurements) {
      db.prepare(`
        INSERT INTO device_messages (id, device_id, patient_id, raw_payload_json, parsed_valid, error_reason, received_at)
        VALUES (?, ?, ?, ?, 0, 'Malformed payload: missing device_id or measurements', ?)
      `).run(msgId, device_id || 'UNKNOWN', patient_id || null, JSON.stringify(rawBody), now);
      return res.status(400).json({ error: 'Payload missing required device_id or measurements block' });
    }

    // Verify registered device
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(device_id) as any;
    if (!device) {
      db.prepare(`
        INSERT INTO device_messages (id, device_id, patient_id, raw_payload_json, parsed_valid, error_reason, received_at)
        VALUES (?, ?, ?, ?, 0, 'Unregistered hardware device ID', ?)
      `).run(msgId, device_id, patient_id || null, JSON.stringify(rawBody), now);
      return res.status(403).json({ error: `Hardware device ${device_id} is not registered in clinical registry` });
    }

    const assignedTargetPatient = patient_id || device.assigned_patient_id;
    if (!assignedTargetPatient) {
      db.prepare(`
        INSERT INTO device_messages (id, device_id, patient_id, raw_payload_json, parsed_valid, error_reason, received_at)
        VALUES (?, ?, NULL, ?, 0, 'No patient assigned to this device', ?)
      `).run(msgId, device_id, JSON.stringify(rawBody), now);
      return res.status(422).json({ error: 'Device is not assigned to any active patient' });
    }

    // Extract measurements
    const tempC = measurements.temperature_c ?? measurements.temp_c;
    const pulseBpm = measurements.pulse_bpm ?? measurements.heart_rate;
    const spo2 = measurements.spo2_percent ?? measurements.spo2;
    const sysBp = measurements.systolic_bp;
    const diaBp = measurements.diastolic_bp;

    if (tempC == null || pulseBpm == null || spo2 == null) {
      db.prepare(`
        INSERT INTO device_messages (id, device_id, patient_id, raw_payload_json, parsed_valid, error_reason, received_at)
        VALUES (?, ?, ?, ?, 0, 'Missing critical measurements: temperature_c, pulse_bpm, or spo2_percent', ?)
      `).run(msgId, device_id, assignedTargetPatient, JSON.stringify(rawBody), now);
      return res.status(422).json({ error: 'Telemetry missing vital fields (temperature_c, pulse_bpm, spo2_percent)' });
    }

    // Record observation in database
    const obsId = 'obs-esp32-' + Date.now();
    db.prepare(`
      INSERT INTO observations (
        id, patient_id, timestamp, temperature_c, pulse_bpm, spo2_percent,
        systolic_bp, diastolic_bp, pain_score, weight_kg, mobility_meters,
        appetite_level, fatigue_level, fluid_ml, symptoms_json, wound_observation_json,
        clinician_notes, data_source, recorded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, 'Normal', 'Low', NULL, '[]', '{}', 'Automated telemetry ingestion via ESP32 interface', 'HARDWARE_ESP32', ?, ?)
    `).run(
      obsId,
      assignedTargetPatient,
      timestamp || now,
      tempC,
      pulseBpm,
      spo2,
      sysBp || null,
      diaBp || null,
      3, // baseline sensor pain placeholder or non-pain vital stream
      `Sensor:${device_id}`,
      now
    );

    // Update device status and battery
    db.prepare(`
      UPDATE devices
      SET last_seen = ?,
          status = 'Connected',
          battery_pct = COALESCE(?, battery_pct)
      WHERE id = ?
    `).run(now, battery_pct != null ? parseInt(battery_pct) : null, device_id);

    // Record valid device message
    db.prepare(`
      INSERT INTO device_messages (id, device_id, patient_id, raw_payload_json, parsed_valid, error_reason, received_at)
      VALUES (?, ?, ?, ?, 1, NULL, ?)
    `).run(msgId, device_id, assignedTargetPatient, JSON.stringify(rawBody), now);

    // Evaluate rules
    const triggered = evaluateClinicalRules(assignedTargetPatient, {
      id: obsId,
      temperature_c: tempC,
      pulse_bpm: pulseBpm,
      spo2_percent: spo2,
      pain_score: 3
    }, `Device:${device_id}`);

    res.status(200).json({
      status: 'ingested',
      messageId: msgId,
      observationId: obsId,
      patientId: assignedTargetPatient,
      alertsTriggered: triggered.length
    });
  } catch (err: any) {
    db.prepare(`
      INSERT INTO device_messages (id, device_id, patient_id, raw_payload_json, parsed_valid, error_reason, received_at)
      VALUES (?, 'ERROR', NULL, ?, 0, ?, ?)
    `).run(msgId, JSON.stringify(rawBody), err.message, now);
    res.status(500).json({ error: err.message });
  }
});

// Device Messages Log
app.get('/api/devices/messages', (req, res) => {
  try {
    const db = getDatabase();
    const messages = db.prepare('SELECT * FROM device_messages ORDER BY received_at DESC LIMIT 50').all() as any[];
    const parsed = messages.map((m) => ({
      ...m,
      payload: JSON.parse(m.raw_payload_json)
    }));
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger ESP32 simulated telemetry burst
app.post('/api/devices/simulate-telemetry', (req, res) => {
  try {
    const db = getDatabase();
    const { device_id, patient_id, condition } = req.body;

    const targetDeviceId = device_id || 'ESP32-VITAL-01';
    const targetPatientId = patient_id || 'PT-2026-081';

    let tempC = 36.8 + (Math.random() * 0.4 - 0.2);
    let pulseBpm = Math.floor(70 + Math.random() * 8);
    let spo2 = Math.floor(98 + Math.random() * 2);
    let systolic = 118;
    let diastolic = 76;

    if (condition === 'fever_spike') {
      tempC = 38.4 + (Math.random() * 0.3);
      pulseBpm = Math.floor(98 + Math.random() * 12);
    } else if (condition === 'hypoxia') {
      spo2 = 91;
      pulseBpm = Math.floor(92 + Math.random() * 8);
    }

    tempC = Math.round(tempC * 10) / 10;

    const payload = {
      device_id: targetDeviceId,
      patient_id: targetPatientId,
      timestamp: new Date().toISOString(),
      measurements: {
        temperature_c: tempC,
        pulse_bpm: pulseBpm,
        spo2_percent: spo2,
        systolic_bp: systolic,
        diastolic_bp: diastolic
      },
      battery_pct: Math.floor(85 + Math.random() * 10)
    };

    // Post to ingestion internally
    const now = new Date().toISOString();
    const obsId = 'obs-sim-' + Date.now();
    db.prepare(`
      INSERT INTO observations (
        id, patient_id, timestamp, temperature_c, pulse_bpm, spo2_percent,
        systolic_bp, diastolic_bp, pain_score, weight_kg, mobility_meters,
        appetite_level, fatigue_level, fluid_ml, symptoms_json, wound_observation_json,
        clinician_notes, data_source, recorded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, 'Moderate', 'Moderate', NULL, '[]', '{}', 'Simulated ESP32 live streaming sample', 'SIMULATED', 'ESP32 Simulator', ?)
    `).run(
      obsId,
      targetPatientId,
      payload.timestamp,
      tempC,
      pulseBpm,
      spo2,
      systolic,
      diastolic,
      3,
      now
    );

    db.prepare(`
      INSERT INTO device_messages (id, device_id, patient_id, raw_payload_json, parsed_valid, error_reason, received_at)
      VALUES (?, ?, ?, ?, 1, NULL, ?)
    `).run('msg-sim-' + Date.now(), targetDeviceId, targetPatientId, JSON.stringify(payload), now);

    db.prepare(`
      UPDATE devices SET last_seen = ?, status = 'Connected' WHERE id = ?
    `).run(now, targetDeviceId);

    const alerts = evaluateClinicalRules(targetPatientId, {
      id: obsId,
      temperature_c: tempC,
      pulse_bpm: pulseBpm,
      spo2_percent: spo2,
      pain_score: 3
    }, 'ESP32 Simulator');

    res.json({
      success: true,
      simulatedPayload: payload,
      alertsTriggered: alerts
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Configurable alert thresholds
app.get('/api/thresholds', (req, res) => {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM alert_thresholds WHERE id = ?').get('default');
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/thresholds', (req, res) => {
  try {
    const db = getDatabase();
    const { temp_fever_c, pulse_high_bpm, pulse_low_bpm, spo2_floor_pct, pain_spike_delta, updated_by } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE alert_thresholds
      SET temp_fever_c = ?,
          pulse_high_bpm = ?,
          pulse_low_bpm = ?,
          spo2_floor_pct = ?,
          pain_spike_delta = ?,
          updated_by = ?,
          updated_at = ?
      WHERE id = 'default'
    `).run(
      parseFloat(temp_fever_c),
      parseInt(pulse_high_bpm),
      parseInt(pulse_low_bpm),
      parseInt(spo2_floor_pct),
      parseInt(pain_spike_delta),
      updated_by || 'clinician@hospital.org',
      now
    );

    res.json({ message: 'Thresholds updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Audit Logs
app.get('/api/audit-logs', (req, res) => {
  try {
    const db = getDatabase();
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset demo database
app.post('/api/system/reset-demo', (req, res) => {
  try {
    const db = getDatabase();
    // Drop all data safely
    db.exec(`
      DELETE FROM device_messages;
      DELETE FROM alerts;
      DELETE FROM milestones;
      DELETE FROM observations;
      DELETE FROM devices;
      DELETE FROM patients;
      DELETE FROM users;
      DELETE FROM alert_thresholds;
      DELETE FROM audit_logs;
    `);

    seedDatabase(db);

    res.json({ message: 'Demo database has been successfully re-seeded with pristine synthetic records.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ======================== VITE MIDDLEWARE / STATIC SERVE ========================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI-Driven Digital Twin Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
