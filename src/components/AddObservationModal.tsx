import React, { useState } from 'react';
import { Observation, Patient } from '../types';
import { X, HeartPulse, AlertCircle, CheckCircle } from 'lucide-react';

interface AddObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  selectedPatientId?: string;
  onSuccess: (res: { observationId: string; alertsTriggered: any[] }) => void;
  onSubmitObservation: (data: Partial<Observation>) => Promise<any>;
}

export const AddObservationModal: React.FC<AddObservationModalProps> = ({
  isOpen,
  onClose,
  patients,
  selectedPatientId,
  onSuccess,
  onSubmitObservation
}) => {
  const [patientId, setPatientId] = useState(selectedPatientId || (patients[0]?.id || ''));
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [temperatureVal, setTemperatureVal] = useState('36.8');
  const [pulseBpm, setPulseBpm] = useState(74);
  const [spo2Percent, setSpo2Percent] = useState(98);
  const [systolicBp, setSystolicBp] = useState('120');
  const [diastolicBp, setDiastolicBp] = useState('78');
  const [painScore, setPainScore] = useState(3);
  const [weightKg, setWeightKg] = useState('68.0');
  const [mobilityMeters, setMobilityMeters] = useState(150);
  const [appetiteLevel, setAppetiteLevel] = useState('Moderate');
  const [fatigueLevel, setFatigueLevel] = useState('Moderate');
  const [fluidMl, setFluidMl] = useState('1500');

  // Symptoms checklist
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const symptomOptions = [
    'Mild surgical site tenderness',
    'Nausea',
    'Dizziness on standing',
    'Chills / Shivering',
    'Localized throbbing',
    'Fatigue / Lethargy',
    'Shortness of breath'
  ];

  // Wound observations
  const [woundRedness, setWoundRedness] = useState('None');
  const [woundSwelling, setWoundSwelling] = useState('Minimal');
  const [woundDischarge, setWoundDischarge] = useState('None');
  const [woundDressing, setWoundDressing] = useState('Clean & Dry');

  const [clinicianNotes, setClinicianNotes] = useState('');
  const [dataSource, setDataSource] = useState<'MANUAL_CLINICIAN' | 'PATIENT_REPORTED' | 'HARDWARE_ESP32'>('MANUAL_CLINICIAN');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeWarning, setRangeWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRangeWarning(null);

    // Convert temp to Celsius if entered in Fahrenheit
    let tempC = parseFloat(temperatureVal);
    if (temperatureUnit === 'F') {
      tempC = (tempC - 32) * (5 / 9);
      tempC = Math.round(tempC * 10) / 10;
    }

    // Physiological plausible checks
    if (isNaN(tempC) || tempC < 33.0 || tempC > 42.5) {
      setError(`Temperature value ${tempC}°C is outside plausible human range (33°C - 42.5°C).`);
      return;
    }
    if (pulseBpm < 35 || pulseBpm > 220) {
      setError(`Pulse rate ${pulseBpm} bpm is outside plausible human range (35 - 220 bpm).`);
      return;
    }
    if (spo2Percent < 60 || spo2Percent > 100) {
      setError(`SpO2 ${spo2Percent}% is outside plausible range (60% - 100%).`);
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmitObservation({
        patient_id: patientId,
        timestamp: new Date().toISOString(),
        temperature_c: tempC,
        pulse_bpm: pulseBpm,
        spo2_percent: spo2Percent,
        systolic_bp: systolicBp ? parseInt(systolicBp) : null,
        diastolic_bp: diastolicBp ? parseInt(diastolicBp) : null,
        pain_score: painScore,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        mobility_meters: mobilityMeters,
        appetite_level: appetiteLevel,
        fatigue_level: fatigueLevel,
        fluid_ml: fluidMl ? parseInt(fluidMl) : null,
        symptoms,
        wound_observation: {
          redness: woundRedness,
          swelling: woundSwelling,
          discharge: woundDischarge,
          dressing: woundDressing
        },
        clinician_notes: clinicianNotes,
        data_source: dataSource,
        recorded_by: dataSource === 'PATIENT_REPORTED' ? 'Patient Self-Entry' : 'Authorized Clinician'
      });

      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit observation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-[#DCE5EB] overflow-hidden my-6">
        <div className="px-6 py-4 bg-[#123B5D] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#2A9D8F]" />
            <h3 className="font-bold text-base text-white">Record Clinical Observation</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded hover:bg-[#1a4a70]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] text-[#C94C4C] text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient and Data Source selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-[#DCE5EB]">
            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">Select Patient *</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md font-medium focus:outline-none focus:border-[#123B5D]"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.id}) · {p.surgery_type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">Data Source</label>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              >
                <option value="MANUAL_CLINICIAN">Manual Entry by Clinician / Nurse</option>
                <option value="PATIENT_REPORTED">Patient Self-Reported</option>
                <option value="HARDWARE_ESP32">Hardware Sensor (ESP32 Gateway)</option>
              </select>
            </div>
          </div>

          {/* Core Vital Signs */}
          <div>
            <h4 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-2">
              Vital Signs & Physiology
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#203040]">Temp *</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (temperatureUnit === 'C') {
                        const f = (parseFloat(temperatureVal) * 9) / 5 + 32;
                        setTemperatureVal(f.toFixed(1));
                        setTemperatureUnit('F');
                      } else {
                        const c = ((parseFloat(temperatureVal) - 32) * 5) / 9;
                        setTemperatureVal(c.toFixed(1));
                        setTemperatureUnit('C');
                      }
                    }}
                    className="text-[10px] text-[#2A9D8F] font-bold"
                  >
                    Switch to °{temperatureUnit === 'C' ? 'F' : 'C'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={temperatureVal}
                    onChange={(e) => setTemperatureVal(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md font-mono focus:outline-none focus:border-[#123B5D]"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-[#64748B]">°{temperatureUnit}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#203040] mb-1">Pulse Rate *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={pulseBpm}
                    onChange={(e) => setPulseBpm(parseInt(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md font-mono focus:outline-none focus:border-[#123B5D]"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-[#64748B]">bpm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#203040] mb-1">SpO2 *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={spo2Percent}
                    onChange={(e) => setSpo2Percent(parseInt(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md font-mono focus:outline-none focus:border-[#123B5D]"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-[#64748B]">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#203040] mb-1">Blood Pressure</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="Sys"
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(e.target.value)}
                    className="w-full text-xs px-2 py-2 border border-[#DCE5EB] rounded-md font-mono focus:outline-none focus:border-[#123B5D]"
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    type="number"
                    placeholder="Dia"
                    value={diastolicBp}
                    onChange={(e) => setDiastolicBp(e.target.value)}
                    className="w-full text-xs px-2 py-2 border border-[#DCE5EB] rounded-md font-mono focus:outline-none focus:border-[#123B5D]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pain Score (0-10 Visual Numeric) */}
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#DCE5EB]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#123B5D]">
                Pain Score: <span className="text-base text-[#203040] font-mono">{painScore}/10</span>
              </label>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                painScore <= 3
                  ? 'bg-[#2A9D8F]/15 text-[#2A9D8F]'
                  : painScore <= 6
                  ? 'bg-[#E9A23B]/15 text-[#E9A23B]'
                  : 'bg-[#C94C4C]/15 text-[#C94C4C]'
              }`}>
                {painScore === 0 ? 'No Pain' : painScore <= 3 ? 'Mild Discomfort' : painScore <= 6 ? 'Moderate Pain' : 'Severe Distress'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={painScore}
              onChange={(e) => setPainScore(parseInt(e.target.value))}
              className="w-full accent-[#123B5D] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#64748B] mt-1 font-mono">
              <span>0 (None)</span>
              <span>3 (Mild)</span>
              <span>6 (Moderate)</span>
              <span>10 (Worst Possible)</span>
            </div>
          </div>

          {/* Wound Inspection */}
          <div>
            <h4 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-2">
              Surgical Site & Wound Inspection
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#203040] mb-1">Erythema / Redness</label>
                <select
                  value={woundRedness}
                  onChange={(e) => setWoundRedness(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
                >
                  <option value="None">None</option>
                  <option value="Mild expected border">Mild expected border</option>
                  <option value="Slight spreading">Slight spreading</option>
                  <option value="Marked spreading erythema >3cm">Marked spreading &gt;3cm</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#203040] mb-1">Swelling / Edema</label>
                <select
                  value={woundSwelling}
                  onChange={(e) => setWoundSwelling(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
                >
                  <option value="None">None</option>
                  <option value="Minimal">Minimal</option>
                  <option value="Moderate effusion">Moderate effusion</option>
                  <option value="Severe tense swelling">Severe tense swelling</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#203040] mb-1">Drainage / Exudate</label>
                <select
                  value={woundDischarge}
                  onChange={(e) => setWoundDischarge(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
                >
                  <option value="None">None (Dry)</option>
                  <option value="Minimal serous">Minimal serous (clear)</option>
                  <option value="Serosanguinous">Serosanguinous (light blood)</option>
                  <option value="Purulent cloudy exudate">Purulent cloudy (warning)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#203040] mb-1">Dressing State</label>
                <select
                  value={woundDressing}
                  onChange={(e) => setWoundDressing(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
                >
                  <option value="Clean & Dry">Clean & Dry</option>
                  <option value="Changed Cleanly">Changed Cleanly</option>
                  <option value="Moist / Stained">Moist / Stained</option>
                  <option value="Intact Skin Glue">Intact Skin Glue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Functional & Mobility Metrics */}
          <div>
            <h4 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-2">
              Functional Recovery
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#203040] mb-1">Mobility (m)</label>
                <input
                  type="number"
                  value={mobilityMeters}
                  onChange={(e) => setMobilityMeters(parseInt(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-1.5 border border-[#DCE5EB] rounded-md font-mono focus:outline-none focus:border-[#123B5D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#203040] mb-1">Appetite</label>
                <select
                  value={appetiteLevel}
                  onChange={(e) => setAppetiteLevel(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
                >
                  <option value="Normal">Normal</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Reduced">Reduced</option>
                  <option value="Poor">Poor / Anorexic</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#203040] mb-1">Fluid Intake (mL)</label>
                <input
                  type="number"
                  value={fluidMl}
                  onChange={(e) => setFluidMl(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-[#DCE5EB] rounded-md font-mono focus:outline-none focus:border-[#123B5D]"
                />
              </div>
            </div>
          </div>

          {/* Symptoms Checklist */}
          <div>
            <label className="block text-xs font-semibold text-[#203040] mb-1.5">
              Associated Symptoms (Select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {symptomOptions.map((sym) => (
                <label
                  key={sym}
                  className="flex items-center gap-2 p-2 rounded border border-[#DCE5EB] hover:bg-[#F3F7FA] cursor-pointer text-xs text-[#203040]"
                >
                  <input
                    type="checkbox"
                    checked={symptoms.includes(sym)}
                    onChange={() => toggleSymptom(sym)}
                    className="accent-[#123B5D]"
                  />
                  <span>{sym}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clinician Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#203040] mb-1">
              Clinician / Observer Notes
            </label>
            <textarea
              rows={2}
              value={clinicianNotes}
              onChange={(e) => setClinicianNotes(e.target.value)}
              placeholder="e.g. Incision margins dry, patient ambulated 150m with physical therapist, incentive spirometry completed."
              className="w-full text-xs p-2.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
            />
          </div>

          <div className="pt-4 border-t border-[#DCE5EB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#64748B] hover:text-[#203040]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#123B5D] text-white text-xs font-semibold rounded-md hover:bg-[#0e2f4b] transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting & Evaluating...' : 'Commit Observation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
