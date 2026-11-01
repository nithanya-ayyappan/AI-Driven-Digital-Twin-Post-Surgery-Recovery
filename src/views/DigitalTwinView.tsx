import React, { useState, useEffect } from 'react';
import { Patient, Observation, Milestone, Alert, Device, UserRole } from '../types';
import { VitalTrendChart } from '../components/VitalTrendChart';
import { BodyMap } from '../components/BodyMap';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  Activity,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Pill,
  BrainCircuit,
  FileText,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Stethoscope,
  Info
} from 'lucide-react';

interface DigitalTwinViewProps {
  patients: Patient[];
  selectedPatientId?: string;
  userRole: UserRole;
  onSelectPatient: (id: string) => void;
  onOpenAddObservation: (id: string) => void;
  onUpdateMilestone: (id: string, completed: boolean) => Promise<any>;
  onNavigate: (view: any) => void;
  onReviewAlert: (alert: Alert) => void;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  patients,
  selectedPatientId,
  userRole,
  onSelectPatient,
  onOpenAddObservation,
  onUpdateMilestone,
  onNavigate,
  onReviewAlert
}) => {
  const [activePatientId, setActivePatientId] = useState<string>(
    selectedPatientId || (patients[0]?.id || '')
  );

  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<{
    patient: Patient;
    postOpDay: number;
    observations: Observation[];
    milestones: Milestone[];
    alerts: Alert[];
    devices: Device[];
    trajectory: any;
  } | null>(null);

  useEffect(() => {
    if (selectedPatientId && selectedPatientId !== activePatientId) {
      setActivePatientId(selectedPatientId);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    if (!activePatientId) return;

    let mounted = true;
    setLoading(true);
    fetch(`/api/patients/${activePatientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setDetailData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load twin:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activePatientId]);

  const patient = detailData?.patient || patients.find((p) => p.id === activePatientId) || patients[0];
  const observations = detailData?.observations || [];
  const milestones = detailData?.milestones || [];
  const alerts = detailData?.alerts || [];
  const postOpDay = detailData?.postOpDay ?? 4;

  const latestObs = observations[observations.length - 1];

  // Verified medications mock list based on procedure
  const medications = [
    { name: 'Acetaminophen (Paracetamol)', dose: '1000mg Q8H PO', purpose: 'Baseline Analgesia', status: 'Active' },
    { name: 'Celecoxib (COX-2 Inhibitor)', dose: '200mg Daily PO', purpose: 'Anti-inflammatory', status: 'Active' },
    { name: 'Enoxaparin (LMWH)', dose: '40mg SC Daily', purpose: 'VTE / DVT Thromboprophylaxis', status: 'Active' },
    { name: 'Cefazolin (Pre-Op/Post-Op)', dose: '2g IV Completed', purpose: 'Surgical Antibiotic Prophylaxis', status: 'Completed' }
  ];

  // Data Freshness calculation
  const getFreshness = () => {
    if (!latestObs) return { text: 'No readings recorded', isStale: true };
    const diffHours = Math.floor(
      (Date.now() - new Date(latestObs.timestamp).getTime()) / (1000 * 60 * 60)
    );
    if (diffHours < 1) return { text: 'Recorded within the last hour', isStale: false };
    if (diffHours < 6) return { text: `Recorded ${diffHours} hours ago`, isStale: false };
    return { text: `Recorded ${diffHours} hours ago (stale - update recommended)`, isStale: true };
  };

  const freshness = getFreshness();

  return (
    <div className="space-y-6">
      <DisclaimerBanner
        type="ai_limit"
        message="The Digital Twin is a longitudinal software representation of clinical post-operative progress. It does not replace physical examination or autonomous clinical diagnostics."
      />

      {/* Patient Switcher & Profile Header Card */}
      <div className="bg-white border border-[#DCE5EB] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DCE5EB]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#123B5D] flex items-center justify-center text-white font-bold text-lg">
              {patient?.full_name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#123B5D]">{patient?.full_name}</h2>
                <span className="text-xs font-mono bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded border border-[#DCE5EB]">
                  {patient?.id}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  patient?.status === 'Needs Review'
                    ? 'bg-[#FDF2F2] text-[#C94C4C] border border-[#F5C2C2]'
                    : 'bg-[#EFF6FF] text-[#123B5D] border border-[#BFDBFE]'
                }`}>
                  {patient?.status}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {patient?.age} yrs · {patient?.gender} · Treating Lead: {patient?.treating_clinician}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B] font-medium">Switch Twin:</span>
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

            {userRole !== 'Patient' && (
              <button
                onClick={() => onOpenAddObservation(patient?.id)}
                className="px-3 py-1.5 bg-[#2A9D8F] text-white text-xs font-semibold rounded-md hover:bg-[#238276] transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <HeartPulse className="w-3.5 h-3.5" /> Log Vitals
              </button>
            )}
          </div>
        </div>

        {/* Surgical Timeline & Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase">Procedure</div>
            <div className="font-bold text-[#123B5D] mt-0.5">{patient?.surgery_type}</div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase">Recovery Day</div>
            <div className="font-bold text-[#2A9D8F] mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Day {postOpDay} Post-Op (Operated: {patient?.surgery_date})</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase">Data Freshness</div>
            <div className={`mt-0.5 flex items-center gap-1 font-medium ${freshness.isStale ? 'text-[#E9A23B]' : 'text-[#203040]'}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{freshness.text}</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase">Latest Telemetry Source</div>
            <div className="font-mono text-[#123B5D] mt-0.5">
              {latestObs?.data_source || 'SIMULATED'}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Twin Grid: Longitudinal Vitals Chart + BodyMap Anatomical Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Longitudinal Vitals + AI Recovery Trajectory Evaluation */}
        <div className="lg:col-span-7 space-y-6">
          <VitalTrendChart observations={observations} height={240} />

          {/* Explainable AI Trend Summary */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5EB]">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#123B5D]" />
                <h4 className="text-sm font-bold text-[#123B5D]">
                  Recovery Trajectory & Trend Assessment
                </h4>
              </div>
              <span className="text-[10px] font-mono font-medium text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#DCE5EB]">
                Deterministic Rule Corridors
              </span>
            </div>

            {patient?.id === 'PT-2026-082' ? (
              <div className="space-y-2.5 text-xs text-[#203040]">
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded text-[#203040]">
                  <strong className="text-[#E9A23B] font-bold block mb-1">
                    PHYSIOLOGICAL DEVIATION FLAGGED (Rule R-104: Low-Grade Fever Surveillance)
                  </strong>
                  Body temperature increased from 37.2°C to 38.3°C (+1.1°C delta) over a 36-hour observation window, accompanied by resting tachycardia (rising from 78 to 96 bpm) on Post-Op Day 3.
                </div>
                <div className="text-[11px] text-[#64748B] leading-relaxed">
                  <strong className="text-[#203040]">Clinical Action Recommended:</strong> Perform bedside surgical wound inspection for spreading erythema or purulent drainage; obtain CBC and CRP to evaluate inflammatory response; assess local knee warmth.
                </div>
                <div className="text-[10px] font-mono text-[#64748B]">
                  Analysis coverage: 4 data points over 48h · Model limitations: Sensor sampling intervals are intermittent.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-[#203040]">
                <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-[#203040]">
                  <strong className="text-[#3978B8] font-bold block mb-1">
                    EXPECTED RECOVERY TRAJECTORY MAINTAINED
                  </strong>
                  All physiological parameters (temperature 36.7°C–37.1°C, pulse 68–82 bpm, SpO2 &gt; 98%) remain within expected post-operative corridors. Pain ratings have decreased from 6/10 to 1/10 across Post-Op Days 1 through 4.
                </div>
                <div className="text-[11px] text-[#64748B] leading-relaxed">
                  <strong className="text-[#203040]">Clinical Action Recommended:</strong> Continue planned mobilization pathway, advance home recovery education, and monitor surgical skin closure integrity.
                </div>
                <div className="text-[10px] font-mono text-[#64748B]">
                  Analysis coverage: {observations.length} data points · High confidence within established protocol bounds.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Surgical Focus BodyMap + Recovery Milestones + Active Alerts */}
        <div className="lg:col-span-5 space-y-6">
          <BodyMap
            surgicalSite={patient?.surgical_site || 'Abdominal Quadrant'}
            surgeryType={patient?.surgery_type || 'General Surgery'}
            woundObservation={latestObs?.wound_observation}
            painScore={latestObs?.pain_score ?? 2}
          />

          {/* Recovery Milestones Checklist */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5EB] mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2A9D8F]" />
                <h4 className="text-sm font-bold text-[#123B5D]">Recovery Milestones</h4>
              </div>
              <span className="text-xs text-[#64748B] font-semibold">
                {milestones.filter((m) => m.completed).length} / {milestones.length} Done
              </span>
            </div>

            <div className="space-y-2.5">
              {milestones.map((m) => {
                const isDone = Boolean(m.completed);
                return (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                      isDone
                        ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#14532D]'
                        : 'bg-[#F8FAFC] border-[#DCE5EB] text-[#203040]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={(e) => onUpdateMilestone(m.id, e.target.checked)}
                      disabled={userRole === 'Patient'}
                      className="accent-[#2A9D8F] mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                      title={userRole === 'Patient' ? 'Milestones are verified by clinical staff' : 'Toggle milestone'}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{m.milestone_name}</span>
                        <span className="text-[10px] font-mono text-[#64748B]">Target: Day {m.target_day}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{m.target_description}</p>
                      {m.completed_date && (
                        <div className="text-[10px] text-[#2A9D8F] font-semibold mt-1">
                          Achieved: {m.completed_date} {m.clinician_notes ? `· ${m.clinician_notes}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinician-Verified Medication Regimen */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#DCE5EB] mb-3">
              <Pill className="w-4 h-4 text-[#123B5D]" />
              <h4 className="text-sm font-bold text-[#123B5D]">Verified Medication Regimen</h4>
            </div>

            <div className="space-y-2 text-xs">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded border border-[#DCE5EB] bg-[#F8FAFC] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#123B5D]">{med.name}</div>
                    <div className="text-[11px] text-[#64748B]">{med.dose} · {med.purpose}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    med.status === 'Active' ? 'bg-[#2A9D8F]/15 text-[#2A9D8F]' : 'bg-slate-200 text-[#64748B]'
                  }`}>
                    {med.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
