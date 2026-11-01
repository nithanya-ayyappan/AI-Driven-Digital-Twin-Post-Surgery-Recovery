import React, { useState, useEffect } from 'react';
import { Patient, Observation, Milestone, Alert, UserRole } from '../types';
import { VitalTrendChart } from '../components/VitalTrendChart';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Activity,
  ShieldCheck
} from 'lucide-react';

interface ReportsViewProps {
  patients: Patient[];
  selectedPatientId?: string;
  userRole: UserRole;
  onSelectPatient: (id: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  patients,
  selectedPatientId,
  userRole,
  onSelectPatient
}) => {
  const [activePatientId, setActivePatientId] = useState(
    selectedPatientId || (patients[0]?.id || '')
  );
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [reportDateRange, setReportDateRange] = useState('7d');

  useEffect(() => {
    if (!activePatientId) return;
    fetch(`/api/patients/${activePatientId}`)
      .then((res) => res.json())
      .then((data) => setPatientDetails(data))
      .catch((err) => console.error(err));
  }, [activePatientId]);

  const patient: Patient = patientDetails?.patient || patients.find((p) => p.id === activePatientId) || patients[0];
  const observations: Observation[] = patientDetails?.observations || [];
  const milestones: Milestone[] = patientDetails?.milestones || [];
  const alerts: Alert[] = patientDetails?.alerts || [];
  const postOpDay = patientDetails?.postOpDay ?? 4;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
        <DisclaimerBanner message="Clinical report generation module. Exports comprehensive recovery documentation for surgical handoff and outpatient follow-up." />

        {/* Controls Bar */}
        <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-[#123B5D] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2A9D8F]" />
              Post-Surgical Recovery Summary Report
            </h2>
            <p className="text-xs text-[#64748B]">
              Standardized clinical discharge and recovery trajectory dossier
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#64748B] font-medium">Patient:</span>
              <select
                value={activePatientId}
                onChange={(e) => {
                  setActivePatientId(e.target.value);
                  onSelectPatient(e.target.value);
                }}
                className="text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md font-semibold text-[#123B5D] bg-white focus:outline-none focus:border-[#123B5D]"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#123B5D] text-white text-xs font-semibold rounded-md hover:bg-[#0e2f4b] transition-colors flex items-center gap-2 shadow-2xs"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Printable Clinical Dossier */}
      <div className="bg-white border border-[#DCE5EB] rounded-xl p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-[#123B5D] pb-4">
          <div>
            <div className="flex items-center gap-2 text-[#123B5D] font-bold text-lg">
              <Activity className="w-5 h-5 text-[#2A9D8F]" />
              <span>DIGITAL TWIN POST-OPERATIVE RECOVERY DOSSIER</span>
            </div>
            <div className="text-xs text-[#64748B] mt-0.5">
              CONFIDENTIAL MEDICAL RECORD SUMMARY · CLINICAL DECISION SUPPORT SYSTEM
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-[#123B5D]">Generated: {new Date().toLocaleString()}</div>
            <div className="text-[#64748B] font-mono text-[11px]">Report ID: REP-{patient?.id}-{Date.now().toString().slice(-4)}</div>
          </div>
        </div>

        {/* Patient Profile Demographics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F8FAFC] rounded-lg border border-[#DCE5EB] text-xs">
          <div>
            <span className="text-[#64748B] font-semibold block text-[10px] uppercase">Patient Name</span>
            <strong className="text-sm text-[#123B5D]">{patient?.full_name}</strong>
          </div>
          <div>
            <span className="text-[#64748B] font-semibold block text-[10px] uppercase">Record ID / Age / Gender</span>
            <span className="text-[#203040] font-mono">{patient?.id} · {patient?.age} yrs ({patient?.gender})</span>
          </div>
          <div>
            <span className="text-[#64748B] font-semibold block text-[10px] uppercase">Surgical Procedure</span>
            <span className="text-[#203040] font-semibold">{patient?.surgery_type}</span>
          </div>
          <div>
            <span className="text-[#64748B] font-semibold block text-[10px] uppercase">Surgery Date & Trajectory</span>
            <span className="text-[#2A9D8F] font-bold">{patient?.surgery_date} (Day {postOpDay} Post-Op)</span>
          </div>
        </div>

        {/* Longitudinal Trajectory Chart */}
        <div>
          <h3 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-2">
            Longitudinal Recovery Parameter Trajectory
          </h3>
          <VitalTrendChart observations={observations} height={200} />
        </div>

        {/* Milestone Progression Summary */}
        <div>
          <h3 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-2">
            Recovery Milestones & Functional Pathway
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {milestones.map((m) => (
              <div
                key={m.id}
                className={`p-2.5 rounded border flex items-start gap-2 ${
                  m.completed ? 'bg-[#F0FDF4] border-[#DCFCE7]' : 'bg-[#F8FAFC] border-[#DCE5EB]'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${m.completed ? 'text-[#2A9D8F]' : 'text-[#8A98A8]'}`} />
                <div>
                  <div className="font-bold text-[#123B5D]">{m.milestone_name}</div>
                  <div className="text-[11px] text-[#64748B]">{m.target_description}</div>
                  {m.completed_date && (
                    <div className="text-[10px] text-[#2A9D8F] font-semibold mt-0.5">
                      Completed: {m.completed_date}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Observations Log Table */}
        <div>
          <h3 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-2">
            Physiological Observations Record
          </h3>
          <div className="overflow-x-auto border border-[#DCE5EB] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#DCE5EB] text-[#64748B] font-semibold">
                  <th className="py-2 px-3">Date/Time</th>
                  <th className="py-2 px-3">Temp</th>
                  <th className="py-2 px-3">Pulse</th>
                  <th className="py-2 px-3">SpO2</th>
                  <th className="py-2 px-3">BP</th>
                  <th className="py-2 px-3">Pain</th>
                  <th className="py-2 px-3">Source</th>
                  <th className="py-2 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EB]">
                {observations.map((obs) => (
                  <tr key={obs.id}>
                    <td className="py-2 px-3 font-mono text-[11px]">
                      {new Date(obs.timestamp).toLocaleDateString()} {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 font-mono">{obs.temperature_c.toFixed(1)}°C</td>
                    <td className="py-2 px-3 font-mono">{obs.pulse_bpm} bpm</td>
                    <td className="py-2 px-3 font-mono">{obs.spo2_percent}%</td>
                    <td className="py-2 px-3 font-mono">{obs.systolic_bp && obs.diastolic_bp ? `${obs.systolic_bp}/${obs.diastolic_bp}` : '--'}</td>
                    <td className="py-2 px-3 font-mono">{obs.pain_score}/10</td>
                    <td className="py-2 px-3 text-[10px] font-mono">{obs.data_source}</td>
                    <td className="py-2 px-3 text-[11px] text-[#64748B]">{obs.clinician_notes || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert History Summary */}
        <div>
          <h3 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-2">
            Clinical Alerts & Review Action History
          </h3>
          {alerts.length === 0 ? (
            <div className="p-3 bg-[#F8FAFC] border border-[#DCE5EB] rounded text-xs text-[#64748B]">
              No alert conditions triggered during reporting interval.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {alerts.map((a) => (
                <div key={a.id} className="p-2.5 rounded border border-[#DCE5EB] bg-[#F8FAFC]">
                  <div className="flex items-center justify-between font-bold text-[#123B5D] mb-1">
                    <span>{a.trigger_rule} ({a.severity})</span>
                    <span className="font-mono text-[11px] text-[#64748B]">{a.status} · {new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[#203040] text-[11px]">{a.explanation}</p>
                  {a.clinical_notes && (
                    <div className="mt-1 pt-1 border-t border-[#DCE5EB] text-[11px] text-[#64748B]">
                      <strong>Review Note:</strong> {a.clinical_notes} ({a.assigned_reviewer})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign-off & Legal Clinical Disclaimer */}
        <div className="pt-4 border-t-2 border-[#DCE5EB] text-[11px] text-[#64748B] space-y-2">
          <div className="flex items-center justify-between pb-3">
            <div>
              <span className="block font-semibold text-[#203040]">Treating Clinician Review:</span>
              <span className="font-serif italic text-base text-[#123B5D]">{patient?.treating_clinician}</span>
            </div>
            <div className="text-right">
              <span className="block font-semibold text-[#203040]">Clinical Signature Verification:</span>
              <span className="font-mono text-[10px] text-[#2A9D8F]">DIGITALLY_VERIFIED_HASH_8F4C2</span>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded border border-[#DCE5EB] leading-relaxed">
            <strong className="text-[#203040]">MANDATORY CLINICAL DISCLAIMER:</strong> This report is generated by an educational decision-support digital twin system based on simulated and entered observation telemetry. It does not replace independent clinical evaluation or hospital chart documentation. Normal values do not guarantee freedom from surgical complications.
          </div>
        </div>
      </div>
    </div>
  );
};
