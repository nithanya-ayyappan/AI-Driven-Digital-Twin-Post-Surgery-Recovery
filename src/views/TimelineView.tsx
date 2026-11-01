import React, { useState } from 'react';
import { Patient, Observation, Milestone, Alert, UserRole } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  History,
  Calendar,
  Filter,
  Plus,
  Clock,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
  AlertCircle
} from 'lucide-react';

interface TimelineViewProps {
  patients: Patient[];
  selectedPatientId?: string;
  userRole: UserRole;
  onSelectPatient: (id: string) => void;
  onOpenAddObservation: (id: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  patients,
  selectedPatientId,
  userRole,
  onSelectPatient,
  onOpenAddObservation
}) => {
  const [activePatientId, setActivePatientId] = useState<string>(
    selectedPatientId || (patients[0]?.id || '')
  );
  const [filterType, setFilterType] = useState<string>('All');
  const [patientDetails, setPatientDetails] = useState<any>(null);

  React.useEffect(() => {
    if (!activePatientId) return;
    fetch(`/api/patients/${activePatientId}`)
      .then((res) => res.json())
      .then((data) => setPatientDetails(data))
      .catch((err) => console.error(err));
  }, [activePatientId]);

  const patient = patientDetails?.patient || patients.find((p) => p.id === activePatientId) || patients[0];
  const observations: Observation[] = patientDetails?.observations || [];
  const milestones: Milestone[] = patientDetails?.milestones || [];
  const alerts: Alert[] = patientDetails?.alerts || [];

  // Build unified chronological event timeline
  type TimelineEvent = {
    id: string;
    type: 'SURGERY' | 'OBSERVATION' | 'MILESTONE' | 'ALERT';
    timestamp: string;
    title: string;
    description: string;
    badge: string;
    severity?: string;
    author: string;
  };

  const events: TimelineEvent[] = [];

  // 1. Surgery Event
  if (patient?.surgery_date) {
    events.push({
      id: `surg-${patient.id}`,
      type: 'SURGERY',
      timestamp: `${patient.surgery_date}T08:00:00Z`,
      title: `Surgical Procedure: ${patient.surgery_type}`,
      description: `Performed by ${patient.treating_clinician}. Site: ${patient.surgical_site}. Initial recovery protocol activated.`,
      badge: 'SURGERY',
      author: patient.treating_clinician
    });
  }

  // 2. Observations
  observations.forEach((obs) => {
    const symCount = obs.symptoms?.length || 0;
    events.push({
      id: obs.id,
      type: 'OBSERVATION',
      timestamp: obs.timestamp,
      title: `Vitals Recorded: ${obs.temperature_c}°C · ${obs.pulse_bpm} bpm · ${obs.spo2_percent}% SpO2`,
      description: `Pain: ${obs.pain_score}/10. ${obs.clinician_notes || 'Routine recovery entry.'}${
        symCount > 0 ? ` Reported symptoms: ${obs.symptoms?.join(', ')}.` : ''
      }`,
      badge: obs.data_source,
      author: obs.recorded_by
    });
  });

  // 3. Milestones
  milestones
    .filter((m) => m.completed && m.completed_date)
    .forEach((m) => {
      events.push({
        id: m.id,
        type: 'MILESTONE',
        timestamp: `${m.completed_date}T12:00:00Z`,
        title: `Milestone Achieved: ${m.milestone_name}`,
        description: `${m.target_description}. ${m.clinician_notes || 'Verified by surgical team.'}`,
        badge: 'MILESTONE',
        author: 'Clinical Team'
      });
    });

  // 4. Alerts
  alerts.forEach((alt) => {
    events.push({
      id: alt.id,
      type: 'ALERT',
      timestamp: alt.created_at,
      title: `Clinical Alert: ${alt.trigger_rule} (${alt.severity})`,
      description: `${alt.explanation} Review Status: ${alt.status}. ${alt.clinical_notes || ''}`,
      badge: alt.status,
      severity: alt.severity,
      author: alt.assigned_reviewer || 'Automated Decision Support'
    });
  });

  // Sort chronological descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter
  const filteredEvents = events.filter((ev) => {
    if (filterType === 'All') return true;
    return ev.type === filterType;
  });

  // Check for monitoring gaps (>20 hours between observations)
  const sortedObsChronological = [...observations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const gaps: { start: string; end: string; hours: number }[] = [];
  for (let i = 1; i < sortedObsChronological.length; i++) {
    const prevTime = new Date(sortedObsChronological[i - 1].timestamp).getTime();
    const currTime = new Date(sortedObsChronological[i].timestamp).getTime();
    const diffHours = (currTime - prevTime) / (1000 * 60 * 60);
    if (diffHours >= 20) {
      gaps.push({
        start: sortedObsChronological[i - 1].timestamp,
        end: sortedObsChronological[i].timestamp,
        hours: Math.round(diffHours)
      });
    }
  }

  return (
    <div className="space-y-6">
      <DisclaimerBanner message="Chronological post-operative trajectory. Reflects actual stored events; gaps in monitoring are explicitly highlighted." />

      {/* Header and Filter Controls */}
      <div className="bg-white border border-[#DCE5EB] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#123B5D] flex items-center gap-2">
            <History className="w-5 h-5 text-[#2A9D8F]" />
            Recovery Timeline: {patient?.full_name}
          </h2>
          <p className="text-xs text-[#64748B]">
            Procedure: {patient?.surgery_type} · Operative Date: {patient?.surgery_date}
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

          <div className="flex items-center gap-1 bg-[#F3F7FA] p-1 rounded-md border border-[#DCE5EB]">
            {['All', 'OBSERVATION', 'ALERT', 'MILESTONE'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  filterType === t
                    ? 'bg-[#123B5D] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#123B5D]'
                }`}
              >
                {t === 'All' ? 'All Events' : t === 'OBSERVATION' ? 'Vitals' : t === 'ALERT' ? 'Alerts' : 'Milestones'}
              </button>
            ))}
          </div>

          {userRole !== 'Patient' && (
            <button
              onClick={() => onOpenAddObservation(activePatientId)}
              className="px-3 py-1.5 bg-[#2A9D8F] text-white text-xs font-semibold rounded-md hover:bg-[#238276] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Log Event
            </button>
          )}
        </div>
      </div>

      {/* Monitoring Gap Notice (if any) */}
      {gaps.length > 0 && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-3.5 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#E9A23B] shrink-0 mt-0.5" />
          <div className="text-xs text-[#203040]">
            <strong className="text-[#E9A23B] font-bold block mb-0.5">
              MONITORING INTERVAL DISCLOSURE:
            </strong>
            {gaps.map((g, i) => (
              <span key={i} className="block">
                A monitoring interval of {g.hours} hours occurred between{' '}
                {new Date(g.start).toLocaleDateString()} {new Date(g.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} and{' '}
                {new Date(g.end).toLocaleDateString()} {new Date(g.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                Missing data is preserved rather than interpolated.
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Event Feed */}
      <div className="bg-white border border-[#DCE5EB] rounded-lg p-6 shadow-xs">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#DCE5EB]">
          {filteredEvents.map((ev) => {
            let icon = <HeartPulse className="w-4 h-4 text-white" />;
            let dotBg = 'bg-[#123B5D]';

            if (ev.type === 'ALERT') {
              icon = <AlertTriangle className="w-4 h-4 text-white" />;
              dotBg = ev.severity === 'URGENT_ATTENTION' ? 'bg-[#C94C4C]' : 'bg-[#E9A23B]';
            } else if (ev.type === 'MILESTONE') {
              icon = <CheckCircle2 className="w-4 h-4 text-white" />;
              dotBg = 'bg-[#2A9D8F]';
            } else if (ev.type === 'SURGERY') {
              icon = <Activity className="w-4 h-4 text-white" />;
              dotBg = 'bg-[#123B5D]';
            }

            return (
              <div key={ev.id} className="relative flex items-start gap-4">
                {/* Timeline node */}
                <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full ${dotBg} flex items-center justify-center ring-4 ring-white shadow-2xs`}>
                  {icon}
                </div>

                {/* Event Card */}
                <div className="flex-1 bg-[#F8FAFC] border border-[#DCE5EB] rounded-lg p-3.5 hover:border-[#CBDDE9] transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-[#123B5D]">{ev.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white border border-[#DCE5EB] text-[#64748B]">
                        {ev.badge}
                      </span>
                      <span className="text-[11px] font-mono text-[#64748B]">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#203040] leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="mt-2 pt-2 border-t border-[#DCE5EB] text-[10px] text-[#64748B] flex items-center justify-between">
                    <span>Logged by: <strong className="text-[#203040]">{ev.author}</strong></span>
                    <span className="font-mono">Event ID: {ev.id}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
