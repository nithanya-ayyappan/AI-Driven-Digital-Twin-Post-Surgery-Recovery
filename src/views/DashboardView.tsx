import React, { useState } from 'react';
import { Patient, Observation, Alert, Device, UserRole } from '../types';
import { VitalTrendChart } from '../components/VitalTrendChart';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  Users,
  HeartPulse,
  AlertTriangle,
  Cpu,
  Plus,
  Activity,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

interface DashboardViewProps {
  patients: Patient[];
  observations: Observation[];
  alerts: Alert[];
  devices: Device[];
  userRole: UserRole;
  onSelectPatient: (patientId: string) => void;
  onOpenAddPatient: () => void;
  onOpenAddObservation: (patientId?: string) => void;
  onNavigate: (view: any) => void;
  onReviewAlert: (alert: Alert) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patients,
  observations,
  alerts,
  devices,
  userRole,
  onSelectPatient,
  onOpenAddPatient,
  onOpenAddObservation,
  onNavigate,
  onReviewAlert
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patients[0]?.id || ''
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const patientObservations = observations.filter((o) => o.patient_id === selectedPatient?.id);
  const unreadAlerts = alerts.filter((a) => a.status === 'New' || a.status === 'Under Review');
  const connectedDevices = devices.filter((d) => d.status === 'Connected');

  return (
    <div className="space-y-6">
      <DisclaimerBanner message="Displaying synthetic patient and sensor records for post-operative recovery monitoring." />

      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-[#123B5D]">Clinical Recovery Overview</h2>
          <p className="text-xs text-[#64748B]">
            Real-time digital twin trajectories, physiological observations & active review flags
          </p>
        </div>

        {userRole !== 'Patient' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddPatient}
              className="px-3 py-1.5 bg-[#123B5D] text-white text-xs font-semibold rounded-md hover:bg-[#0e2f4b] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Enroll Patient
            </button>
            <button
              onClick={() => onOpenAddObservation(selectedPatient?.id)}
              className="px-3 py-1.5 bg-[#2A9D8F] text-white text-xs font-semibold rounded-md hover:bg-[#238276] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <HeartPulse className="w-3.5 h-3.5" /> Record Observation
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-3 py-1.5 bg-white border border-[#DCE5EB] text-[#203040] text-xs font-semibold rounded-md hover:bg-[#F3F7FA] transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#64748B]" /> Export Report
            </button>
          </div>
        )}
      </div>

      {/* Small Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Enrolled Patients</span>
            <Users className="w-4 h-4 text-[#123B5D]" />
          </div>
          <div className="text-2xl font-bold text-[#123B5D] mt-2 font-mono tabular-nums">
            {patients.length}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <span>Synthetic Registry</span>
          </div>
        </div>

        <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Total Observations</span>
            <HeartPulse className="w-4 h-4 text-[#2A9D8F]" />
          </div>
          <div className="text-2xl font-bold text-[#123B5D] mt-2 font-mono tabular-nums">
            {observations.length}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            Manual & Hardware Telemetry
          </div>
        </div>

        <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Alerts for Review</span>
            <AlertTriangle className={`w-4 h-4 ${unreadAlerts.length > 0 ? 'text-[#C94C4C]' : 'text-[#64748B]'}`} />
          </div>
          <div className={`text-2xl font-bold mt-2 font-mono tabular-nums ${unreadAlerts.length > 0 ? 'text-[#C94C4C]' : 'text-[#123B5D]'}`}>
            {unreadAlerts.length}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            {unreadAlerts.length > 0 ? 'Requires clinician assessment' : 'All alerts resolved'}
          </div>
        </div>

        <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Connected Devices</span>
            <Cpu className="w-4 h-4 text-[#3978B8]" />
          </div>
          <div className="text-2xl font-bold text-[#123B5D] mt-2 font-mono tabular-nums">
            {connectedDevices.length} / {devices.length}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            ESP32 Vitals Streaming
          </div>
        </div>
      </div>

      {/* Main Focus Split: Selected Patient Trajectory on Left, Quick Alert & Device stream on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Patient Recovery Trend Chart */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#123B5D]">
                  Recovery Trajectory: {selectedPatient?.full_name}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {selectedPatient?.surgery_type} · Surgery: {selectedPatient?.surgery_date}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[#64748B] font-medium hidden sm:inline">Select Patient:</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md bg-white text-[#203040] font-medium focus:outline-none focus:border-[#123B5D]"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.id})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    onSelectPatient(selectedPatient?.id);
                    onNavigate('digital-twin');
                  }}
                  className="px-2.5 py-1 text-xs text-[#123B5D] hover:bg-[#F3F7FA] font-semibold rounded border border-[#DCE5EB] flex items-center gap-1"
                >
                  <span>Open Twin</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <VitalTrendChart observations={patientObservations} selectedMetric="temperature" height={220} />
          </div>

          {/* Recent Observations Table */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DCE5EB]">
              <div>
                <h3 className="text-sm font-bold text-[#123B5D]">Recent Clinical Observations</h3>
                <p className="text-xs text-[#64748B]">Latest physiological telemetry across active patients</p>
              </div>
              <button
                onClick={() => onNavigate('health-monitoring')}
                className="text-xs text-[#2A9D8F] font-semibold hover:underline flex items-center gap-1"
              >
                <span>Record New</span>
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCE5EB] text-[#64748B] font-semibold bg-[#F8FAFC]">
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Temp</th>
                    <th className="py-2.5 px-3">Pulse</th>
                    <th className="py-2.5 px-3">SpO2</th>
                    <th className="py-2.5 px-3">Pain</th>
                    <th className="py-2.5 px-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5EB]">
                  {observations.slice(0, 5).map((obs) => (
                    <tr
                      key={obs.id}
                      onClick={() => {
                        onSelectPatient(obs.patient_id);
                        onNavigate('digital-twin');
                      }}
                      className="hover:bg-[#F3F7FA] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-semibold text-[#123B5D]">
                        {obs.patient_name || obs.patient_id}
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B] font-mono tabular-nums">
                        {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">
                        <span className={obs.temperature_c >= 38.0 ? 'text-[#C94C4C] font-bold' : 'text-[#203040]'}>
                          {obs.temperature_c.toFixed(1)}°C
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">
                        <span className={obs.pulse_bpm >= 95 ? 'text-[#E9A23B] font-bold' : 'text-[#203040]'}>
                          {obs.pulse_bpm} bpm
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">
                        <span className={obs.spo2_percent < 95 ? 'text-[#C94C4C] font-bold' : 'text-[#203040]'}>
                          {obs.spo2_percent}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">
                        <span className={obs.pain_score >= 6 ? 'text-[#C94C4C] font-bold' : 'text-[#203040]'}>
                          {obs.pain_score}/10
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                          {obs.data_source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Active Alerts & Device Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Alerts Box */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DCE5EB]">
              <div>
                <h3 className="text-sm font-bold text-[#123B5D]">Alerts Requiring Review</h3>
                <p className="text-xs text-[#64748B]">Physiological rule threshold flags</p>
              </div>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-[#123B5D] font-semibold hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {alerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onReviewAlert(alert)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    alert.severity === 'URGENT_ATTENTION'
                      ? 'bg-[#FDF2F2] border-[#F5C2C2] hover:bg-[#FBE8E8]'
                      : alert.severity === 'REVIEW_RECOMMENDED'
                      ? 'bg-[#FFFBEB] border-[#FDE68A] hover:bg-[#FEF3C7]'
                      : 'bg-[#F8FAFC] border-[#DCE5EB] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#123B5D]">
                      {alert.patient_name || alert.patient_id}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#203040] line-clamp-2 leading-relaxed">
                    {alert.explanation}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-black/5">
                    <span className="font-semibold text-[#64748B]">Status: {alert.status}</span>
                    <span className="text-[#123B5D] font-bold hover:underline flex items-center gap-0.5">
                      Review <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Device Status Panel */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DCE5EB]">
              <div>
                <h3 className="text-sm font-bold text-[#123B5D]">Hardware Gateways</h3>
                <p className="text-xs text-[#64748B]">ESP32 telemetry connections</p>
              </div>
              <button
                onClick={() => onNavigate('device-integration')}
                className="text-xs text-[#2A9D8F] font-semibold hover:underline"
              >
                Configure
              </button>
            </div>

            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="p-2.5 bg-[#F8FAFC] rounded border border-[#DCE5EB] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#123B5D]">{device.device_name}</div>
                    <div className="text-[11px] text-[#64748B]">
                      Assigned: {device.assigned_patient_name || 'Unassigned'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                      device.status === 'Connected'
                        ? 'bg-[#2A9D8F]/15 text-[#2A9D8F]'
                        : 'bg-slate-200 text-[#64748B]'
                    }`}>
                      {device.status}
                    </span>
                    {device.battery_pct != null && (
                      <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                        Bat: {device.battery_pct}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
