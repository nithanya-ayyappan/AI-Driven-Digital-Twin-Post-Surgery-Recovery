import React, { useState } from 'react';
import { Patient, Observation, UserRole } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  HeartPulse,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  ShieldCheck,
  Activity
} from 'lucide-react';

interface HealthMonitoringViewProps {
  patients: Patient[];
  observations: Observation[];
  userRole: UserRole;
  onOpenAddObservation: (patientId?: string) => void;
  onSelectPatient: (patientId: string) => void;
  onNavigate: (view: any) => void;
}

export const HealthMonitoringView: React.FC<HealthMonitoringViewProps> = ({
  patients,
  observations,
  userRole,
  onOpenAddObservation,
  onSelectPatient,
  onNavigate
}) => {
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('All');

  const filtered = observations.filter((obs) => {
    if (selectedPatientFilter === 'All') return true;
    return obs.patient_id === selectedPatientFilter;
  });

  return (
    <div className="space-y-6">
      <DisclaimerBanner message="Clinical observation registry. Physiological inputs are validated against human plausible ranges; deviations trigger configured clinical alerts." />

      {/* Header and Log Observation Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-[#123B5D] flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-[#2A9D8F]" />
            Physiological Health Monitoring
          </h2>
          <p className="text-xs text-[#64748B]">
            Longitudinal vital measurements, wound observations, pain scoring, and functional recovery logs
          </p>
        </div>

        <button
          onClick={() => onOpenAddObservation(selectedPatientFilter !== 'All' ? selectedPatientFilter : undefined)}
          className="px-4 py-2 bg-[#2A9D8F] text-white text-xs font-semibold rounded-md hover:bg-[#238276] transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Record New Observation
        </button>
      </div>

      {/* Filter and Patient Selector */}
      <div className="bg-white border border-[#DCE5EB] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <span className="text-xs font-medium text-[#203040]">Filter by Patient:</span>
          <select
            value={selectedPatientFilter}
            onChange={(e) => setSelectedPatientFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md font-semibold text-[#123B5D] bg-white focus:outline-none focus:border-[#123B5D]"
          >
            <option value="All">All Patients ({observations.length} records)</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#64748B]">
          <span className="font-mono">{filtered.length} observations listed</span>
        </div>
      </div>

      {/* Observation Cards / Table */}
      <div className="space-y-3">
        {filtered.map((obs) => {
          const hasFever = obs.temperature_c >= 38.0;
          const hasTachycardia = obs.pulse_bpm >= 95;
          const hasHypoxia = obs.spo2_percent < 95;
          const hasHighPain = obs.pain_score >= 6;

          return (
            <div
              key={obs.id}
              className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs hover:border-[#CBDDE9] transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2.5 border-b border-[#DCE5EB] mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-[#123B5D]">
                    {obs.patient_name || obs.patient_id}
                  </span>
                  <span className="text-xs font-mono text-[#64748B]">
                    ID: {obs.patient_id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] border border-[#DCE5EB]">
                    {obs.data_source}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">
                    {new Date(obs.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Vitals Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#DCE5EB]">
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Temperature</div>
                  <div className={`text-base font-bold font-mono tabular-nums mt-0.5 ${hasFever ? 'text-[#C94C4C]' : 'text-[#203040]'}`}>
                    {obs.temperature_c.toFixed(1)}°C
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    {hasFever ? 'Fever threshold >=38.0°C' : 'Normal range'}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#DCE5EB]">
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Heart Rate</div>
                  <div className={`text-base font-bold font-mono tabular-nums mt-0.5 ${hasTachycardia ? 'text-[#E9A23B]' : 'text-[#203040]'}`}>
                    {obs.pulse_bpm} <span className="text-xs font-normal">bpm</span>
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    {hasTachycardia ? 'Elevated rate' : 'Baseline normal'}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#DCE5EB]">
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">SpO2 Saturation</div>
                  <div className={`text-base font-bold font-mono tabular-nums mt-0.5 ${hasHypoxia ? 'text-[#C94C4C]' : 'text-[#203040]'}`}>
                    {obs.spo2_percent}%
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    {hasHypoxia ? 'Desaturation alert' : 'Adequate oxygenation'}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#DCE5EB]">
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Blood Pressure</div>
                  <div className="text-base font-bold font-mono tabular-nums text-[#203040] mt-0.5">
                    {obs.systolic_bp && obs.diastolic_bp ? `${obs.systolic_bp}/${obs.diastolic_bp}` : 'N/A'}{' '}
                    <span className="text-xs font-normal">mmHg</span>
                  </div>
                  <div className="text-[10px] text-[#64748B]">Resting cuff reading</div>
                </div>

                <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#DCE5EB]">
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase">Pain Score</div>
                  <div className={`text-base font-bold font-mono tabular-nums mt-0.5 ${hasHighPain ? 'text-[#C94C4C]' : 'text-[#203040]'}`}>
                    {obs.pain_score}/10
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    {obs.pain_score <= 3 ? 'Mild' : obs.pain_score <= 6 ? 'Moderate' : 'Severe'}
                  </div>
                </div>
              </div>

              {/* Wound inspection & Symptoms info */}
              {(obs.wound_observation || (obs.symptoms && obs.symptoms.length > 0) || obs.clinician_notes) && (
                <div className="p-3 bg-[#F8FAFC] rounded border border-[#DCE5EB] text-xs space-y-1.5">
                  {obs.wound_observation && (
                    <div>
                      <strong className="text-[#123B5D]">Wound Inspection: </strong>
                      <span className="text-[#203040]">
                        Redness: {obs.wound_observation.redness || 'None'} · Swelling: {obs.wound_observation.swelling || 'None'} · Drainage: {obs.wound_observation.discharge || 'None'} · Dressing: {obs.wound_observation.dressing || 'Clean'}
                      </span>
                    </div>
                  )}

                  {obs.symptoms && obs.symptoms.length > 0 && (
                    <div>
                      <strong className="text-[#123B5D]">Reported Symptoms: </strong>
                      <span className="text-[#203040]">{obs.symptoms.join(', ')}</span>
                    </div>
                  )}

                  {obs.clinician_notes && (
                    <div>
                      <strong className="text-[#123B5D]">Clinical Note: </strong>
                      <span className="text-[#203040]">{obs.clinician_notes}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Recorded by: <strong className="text-[#203040]">{obs.recorded_by}</strong></span>
                <button
                  onClick={() => {
                    onSelectPatient(obs.patient_id);
                    onNavigate('digital-twin');
                  }}
                  className="text-[#123B5D] font-semibold hover:underline"
                >
                  View Digital Twin →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
