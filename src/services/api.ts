import {
  Patient,
  Observation,
  Milestone,
  Alert,
  Device,
  DeviceMessage,
  AuditLog,
  AlertThresholds,
  User
} from '../types';

export const api = {
  // Auth
  async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Failed to authenticate');
    }
    return res.json();
  },

  // Patients
  async getPatients(search?: string, status?: string): Promise<Patient[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'All') params.append('status', status);
    const res = await fetch(`/api/patients?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  async getPatientDetail(id: string): Promise<{
    patient: Patient;
    postOpDay: number;
    observations: Observation[];
    milestones: Milestone[];
    alerts: Alert[];
    devices: Device[];
    trajectory: any;
  }> {
    const res = await fetch(`/api/patients/${id}`);
    if (!res.ok) throw new Error(`Failed to load patient profile ${id}`);
    return res.json();
  },

  async createPatient(patientData: Partial<Patient>): Promise<{ message: string; patientId: string }> {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create patient' }));
      throw new Error(err.error || 'Failed to create patient');
    }
    return res.json();
  },

  async updatePatient(id: string, updates: Partial<Patient>): Promise<{ message: string }> {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update patient');
    return res.json();
  },

  // Observations
  async getObservations(patientId?: string, limit?: number): Promise<Observation[]> {
    const params = new URLSearchParams();
    if (patientId) params.append('patient_id', patientId);
    if (limit) params.append('limit', limit.toString());
    const res = await fetch(`/api/observations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch observations');
    return res.json();
  },

  async recordObservation(data: Partial<Observation>): Promise<{
    message: string;
    observationId: string;
    alertsTriggered: any[];
  }> {
    const res = await fetch('/api/observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to record observation' }));
      throw new Error(err.error || 'Failed to record observation');
    }
    return res.json();
  },

  // Milestones
  async updateMilestone(id: string, completed: boolean, notes?: string): Promise<{ message: string }> {
    const res = await fetch(`/api/milestones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed, clinician_notes: notes })
    });
    if (!res.ok) throw new Error('Failed to update recovery milestone');
    return res.json();
  },

  // Alerts
  async getAlerts(status?: string, severity?: string, patientId?: string): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (severity && severity !== 'All') params.append('severity', severity);
    if (patientId) params.append('patient_id', patientId);
    const res = await fetch(`/api/alerts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async updateAlert(id: string, status: string, notes?: string, reviewer?: string): Promise<{ message: string }> {
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, clinical_notes: notes, assigned_reviewer: reviewer })
    });
    if (!res.ok) throw new Error('Failed to update alert');
    return res.json();
  },

  // Devices & Hardware Integration
  async getDevices(): Promise<Device[]> {
    const res = await fetch('/api/devices');
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json();
  },

  async updateDevice(id: string, updates: Partial<Device>): Promise<{ message: string }> {
    const res = await fetch(`/api/devices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update device configuration');
    return res.json();
  },

  async getDeviceMessages(): Promise<DeviceMessage[]> {
    const res = await fetch('/api/devices/messages');
    if (!res.ok) throw new Error('Failed to fetch device messages');
    return res.json();
  },

  async simulateDeviceTelemetry(deviceId?: string, patientId?: string, condition?: string): Promise<any> {
    const res = await fetch('/api/devices/simulate-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, patient_id: patientId, condition })
    });
    if (!res.ok) throw new Error('Failed to simulate device telemetry');
    return res.json();
  },

  // Settings & Thresholds
  async getThresholds(): Promise<AlertThresholds> {
    const res = await fetch('/api/thresholds');
    if (!res.ok) throw new Error('Failed to fetch thresholds');
    return res.json();
  },

  async updateThresholds(thresholds: Partial<AlertThresholds>, updatedBy: string): Promise<{ message: string }> {
    const res = await fetch('/api/thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...thresholds, updated_by: updatedBy })
    });
    if (!res.ok) throw new Error('Failed to update alert thresholds');
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // System Reset
  async resetDemoDatabase(): Promise<{ message: string }> {
    const res = await fetch('/api/system/reset-demo', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo database');
    return res.json();
  }
};
