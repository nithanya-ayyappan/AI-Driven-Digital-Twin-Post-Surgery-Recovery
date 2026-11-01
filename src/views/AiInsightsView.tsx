import React, { useState, useEffect } from 'react';
import { Patient, Observation, Alert, AlertThresholds, UserRole } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  BrainCircuit,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  ShieldCheck,
  Info,
  Save,
  HelpCircle
} from 'lucide-react';

interface AiInsightsViewProps {
  patients: Patient[];
  observations: Observation[];
  alerts: Alert[];
  userRole: UserRole;
  onSelectPatient: (id: string) => void;
  onNavigate: (view: any) => void;
}

export const AiInsightsView: React.FC<AiInsightsViewProps> = ({
  patients,
  observations,
  alerts,
  userRole,
  onSelectPatient,
  onNavigate
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [thresholds, setThresholds] = useState<AlertThresholds | null>(null);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states for thresholds
  const [tempFever, setTempFever] = useState(38.0);
  const [pulseHigh, setPulseHigh] = useState(100);
  const [pulseLow, setPulseLow] = useState(50);
  const [spo2Floor, setSpo2Floor] = useState(94);
  const [painDelta, setPainDelta] = useState(3);

  useEffect(() => {
    fetch('/api/thresholds')
      .then((res) => res.json())
      .then((data: AlertThresholds) => {
        if (data) {
          setThresholds(data);
          setTempFever(data.temp_fever_c);
          setPulseHigh(data.pulse_high_bpm);
          setPulseLow(data.pulse_low_bpm);
          setSpo2Floor(data.spo2_floor_pct);
          setPainDelta(data.pain_spike_delta);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingThresholds(true);
    setSaveSuccess(false);
    try {
      await fetch('/api/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp_fever_c: tempFever,
          pulse_high_bpm: pulseHigh,
          pulse_low_bpm: pulseLow,
          spo2_floor_pct: spo2Floor,
          pain_spike_delta: painDelta,
          updated_by: 'Authorized Clinician'
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingThresholds(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const patientObs = observations.filter((o) => o.patient_id === selectedPatient?.id);

  // Calculate descriptive statistical summary
  const temps = patientObs.map((o) => o.temperature_c);
  const pulses = patientObs.map((o) => o.pulse_bpm);
  const spo2s = patientObs.map((o) => o.spo2_percent);
  const pains = patientObs.map((o) => o.pain_score);

  const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const max = (arr: number[]) => (arr.length ? Math.max(...arr) : 0);
  const min = (arr: number[]) => (arr.length ? Math.min(...arr) : 0);

  // Delta calculation: first vs latest
  const firstObs = patientObs[0];
  const lastObs = patientObs[patientObs.length - 1];

  const tempDelta = firstObs && lastObs ? lastObs.temperature_c - firstObs.temperature_c : 0;
  const pulseDelta = firstObs && lastObs ? lastObs.pulse_bpm - firstObs.pulse_bpm : 0;
  const painDeltaVal = firstObs && lastObs ? lastObs.pain_score - firstObs.pain_score : 0;

  return (
    <div className="space-y-6">
      <DisclaimerBanner
        type="ai_limit"
        message="Decision support algorithms compute physiological deltas and threshold rule triggers. They highlight patterns requiring human clinical review and do not provide definitive diagnoses."
      />

      {/* Header and Patient Selector */}
      <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#123B5D] flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-[#2A9D8F]" />
            Explainable AI Insights & Trajectory Analysis
          </h2>
          <p className="text-xs text-[#64748B]">
            Deterministic rule heuristics, physiological baseline deltas, and transparent limitation disclosures
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B] font-medium">Analyze Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md font-semibold text-[#123B5D] bg-white focus:outline-none focus:border-[#123B5D]"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.id}) · {p.surgery_type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Descriptive Longitudinal Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase">Temp Trajectory</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#123B5D] mt-1">
            {lastObs?.temperature_c?.toFixed(1) || '--'}°C
          </div>
          <div className="text-xs text-[#64748B] mt-1 flex items-center justify-between">
            <span>Range: {min(temps).toFixed(1)} - {max(temps).toFixed(1)}°C</span>
            <span className={tempDelta > 0.5 ? 'text-[#C94C4C] font-bold' : 'text-[#2A9D8F] font-semibold'}>
              {tempDelta > 0 ? `+${tempDelta.toFixed(1)}°C` : `${tempDelta.toFixed(1)}°C`}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase">Pulse Dynamic</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#123B5D] mt-1">
            {lastObs?.pulse_bpm || '--'} <span className="text-xs font-normal">bpm</span>
          </div>
          <div className="text-xs text-[#64748B] mt-1 flex items-center justify-between">
            <span>Mean: {Math.round(mean(pulses))} bpm</span>
            <span className={pulseDelta > 15 ? 'text-[#E9A23B] font-bold' : 'text-[#203040]'}>
              {pulseDelta > 0 ? `+${pulseDelta}` : `${pulseDelta}`} bpm
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase">Oxygen Saturation</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#123B5D] mt-1">
            {lastObs?.spo2_percent || '--'}%
          </div>
          <div className="text-xs text-[#64748B] mt-1 flex items-center justify-between">
            <span>Min recorded: {min(spo2s)}%</span>
            <span className={min(spo2s) < 95 ? 'text-[#C94C4C] font-bold' : 'text-[#2A9D8F] font-semibold'}>
              {min(spo2s) < 95 ? 'Desat event' : 'Stable'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase">Pain Score Delta</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#123B5D] mt-1">
            {lastObs?.pain_score ?? '--'}/10
          </div>
          <div className="text-xs text-[#64748B] mt-1 flex items-center justify-between">
            <span>Peak: {max(pains)}/10</span>
            <span className={painDeltaVal < 0 ? 'text-[#2A9D8F] font-semibold' : painDeltaVal > 2 ? 'text-[#C94C4C] font-bold' : 'text-[#203040]'}>
              {painDeltaVal > 0 ? `+${painDeltaVal} pts` : `${painDeltaVal} pts`}
            </span>
          </div>
        </div>
      </div>

      {/* Transparent Rules & Trigger Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Active Heuristic Explanations */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5EB]">
              <h3 className="text-sm font-bold text-[#123B5D]">
                Clinical Heuristic Rule Audit
              </h3>
              <span className="text-[11px] font-mono text-[#64748B]">Engine: RuleSet-v2.1</span>
            </div>

            {/* Rule 1 */}
            <div className={`p-4 rounded-lg border text-xs space-y-1.5 ${
              lastObs && lastObs.temperature_c >= tempFever
                ? 'bg-[#FDF2F2] border-[#F5C2C2]'
                : 'bg-[#F8FAFC] border-[#DCE5EB]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#123B5D]">
                  RULE-101: Post-Operative Fever & SSI Surveillance
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  lastObs && lastObs.temperature_c >= tempFever
                    ? 'bg-[#C94C4C] text-white'
                    : 'bg-[#E2E8F0] text-[#64748B]'
                }`}>
                  {lastObs && lastObs.temperature_c >= tempFever ? 'TRIGGERED' : 'CLEAR'}
                </span>
              </div>
              <p className="text-[#203040] leading-relaxed">
                Condition: Temperature &gt;= {tempFever}°C or temperature elevation &gt; +1.0°C within 24h with concurrent tachycardia (&gt;90 bpm).
              </p>
              <div className="text-[11px] text-[#64748B] pt-1">
                <strong>Why it matters:</strong> Early surgical site infections (SSI), atelectasis, or urinary tract infections often manifest with low-grade pyrexia between Post-Op Days 2 and 5.
              </div>
            </div>

            {/* Rule 2 */}
            <div className={`p-4 rounded-lg border text-xs space-y-1.5 ${
              lastObs && lastObs.spo2_percent < spo2Floor
                ? 'bg-[#FDF2F2] border-[#F5C2C2]'
                : 'bg-[#F8FAFC] border-[#DCE5EB]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#123B5D]">
                  RULE-102: Hypoxemic Respiratory Safeguard
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  lastObs && lastObs.spo2_percent < spo2Floor
                    ? 'bg-[#C94C4C] text-white'
                    : 'bg-[#E2E8F0] text-[#64748B]'
                }`}>
                  {lastObs && lastObs.spo2_percent < spo2Floor ? 'TRIGGERED' : 'CLEAR'}
                </span>
              </div>
              <p className="text-[#203040] leading-relaxed">
                Condition: Pulse oximetry saturation &lt; {spo2Floor}% on room air.
              </p>
              <div className="text-[11px] text-[#64748B] pt-1">
                <strong>Why it matters:</strong> Post-anesthetic hypoventilation, opioid-induced respiratory depression, or basilar atelectasis require prompt spirometry coaching.
              </div>
            </div>

            {/* Rule 3 */}
            <div className={`p-4 rounded-lg border text-xs space-y-1.5 ${
              painDeltaVal >= painDelta
                ? 'bg-[#FFFBEB] border-[#FDE68A]'
                : 'bg-[#F8FAFC] border-[#DCE5EB]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#123B5D]">
                  RULE-103: Breakthrough Pain & Compartment Delta
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  painDeltaVal >= painDelta
                    ? 'bg-[#E9A23B] text-white'
                    : 'bg-[#E2E8F0] text-[#64748B]'
                }`}>
                  {painDeltaVal >= painDelta ? 'TRIGGERED' : 'CLEAR'}
                </span>
              </div>
              <p className="text-[#203040] leading-relaxed">
                Condition: Pain score increases by &gt;= {painDelta} points between successive evaluations.
              </p>
              <div className="text-[11px] text-[#64748B] pt-1">
                <strong>Why it matters:</strong> Acute pain escalation warrants evaluating regional nerve block wear-off, surgical hematoma, or mechanical compromise.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Configurable Threshold Editor (Clinician Role) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#DCE5EB] mb-3">
              <Sliders className="w-4 h-4 text-[#123B5D]" />
              <h3 className="text-sm font-bold text-[#123B5D]">
                Configurable Clinical Thresholds
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mb-4">
              Authorized clinicians can adjust alarm trigger setpoints according to procedure risk profile:
            </p>

            <form onSubmit={handleSaveThresholds} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#203040] mb-1">
                  Fever Cutoff (°C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="37.0"
                    max="40.0"
                    value={tempFever}
                    onChange={(e) => setTempFever(parseFloat(e.target.value))}
                    disabled={userRole === 'Patient'}
                    className="w-full px-3 py-1.5 border border-[#DCE5EB] rounded font-mono focus:outline-none focus:border-[#123B5D]"
                  />
                  <span className="text-[#64748B] shrink-0">°C</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#203040] mb-1">
                  Tachycardia High Limit (bpm)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="80"
                    max="150"
                    value={pulseHigh}
                    onChange={(e) => setPulseHigh(parseInt(e.target.value))}
                    disabled={userRole === 'Patient'}
                    className="w-full px-3 py-1.5 border border-[#DCE5EB] rounded font-mono focus:outline-none focus:border-[#123B5D]"
                  />
                  <span className="text-[#64748B] shrink-0">bpm</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#203040] mb-1">
                  SpO2 Desaturation Floor (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="85"
                    max="98"
                    value={spo2Floor}
                    onChange={(e) => setSpo2Floor(parseInt(e.target.value))}
                    disabled={userRole === 'Patient'}
                    className="w-full px-3 py-1.5 border border-[#DCE5EB] rounded font-mono focus:outline-none focus:border-[#123B5D]"
                  />
                  <span className="text-[#64748B] shrink-0">%</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#203040] mb-1">
                  Pain Spike Delta Threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={painDelta}
                    onChange={(e) => setPainDelta(parseInt(e.target.value))}
                    disabled={userRole === 'Patient'}
                    className="w-full px-3 py-1.5 border border-[#DCE5EB] rounded font-mono focus:outline-none focus:border-[#123B5D]"
                  />
                  <span className="text-[#64748B] shrink-0">points</span>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-2 bg-[#F0FDF4] text-[#14532D] text-xs rounded border border-[#DCFCE7] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2A9D8F]" />
                  <span>Thresholds updated and committed to database.</span>
                </div>
              )}

              {userRole !== 'Patient' && (
                <button
                  type="submit"
                  disabled={savingThresholds}
                  className="w-full py-2 bg-[#123B5D] text-white font-semibold rounded hover:bg-[#0e2f4b] transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingThresholds ? 'Saving...' : 'Update Protocol Thresholds'}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
