import React, { useState } from 'react';
import { Alert, UserRole } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  Clock,
  CheckCircle2,
  Filter,
  UserCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface AlertsViewProps {
  alerts: Alert[];
  userRole: UserRole;
  onReviewAlert: (alert: Alert) => void;
  onSelectPatient: (patientId: string) => void;
  onNavigate: (view: any) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  userRole,
  onReviewAlert,
  onSelectPatient,
  onNavigate
}) => {
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = alerts.filter((a) => {
    const matchesSev = severityFilter === 'All' || a.severity === severityFilter;
    const matchesStat = statusFilter === 'All' || a.status === statusFilter;
    return matchesSev && matchesStat;
  });

  return (
    <div className="space-y-6">
      <DisclaimerBanner
        type="emergency"
        message="CRITICAL SAFETY NOTICE: This prototype does not guarantee continuous monitoring, emergency dispatch, or real-time alert delivery. Severe symptoms (acute chest pain, dyspnea, heavy bleeding) mandate calling emergency medical services immediately."
      />

      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-[#123B5D] flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#C94C4C]" />
            Clinical Alert Management
          </h2>
          <p className="text-xs text-[#64748B]">
            Automated physiological deviations, threshold violations, and clinical review workflows
          </p>
        </div>

        <div className="text-xs font-mono text-[#64748B]">
          {alerts.filter((a) => a.status === 'New' || a.status === 'Under Review').length} unaddressed alerts
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#DCE5EB] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#64748B] font-medium">Severity:</span>
            <div className="flex items-center gap-1 bg-[#F3F7FA] p-1 rounded-md border border-[#DCE5EB]">
              {['All', 'URGENT_ATTENTION', 'REVIEW_RECOMMENDED', 'INFO'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    severityFilter === s
                      ? 'bg-[#123B5D] text-white shadow-2xs'
                      : 'text-[#64748B] hover:text-[#123B5D]'
                  }`}
                >
                  {s === 'All' ? 'All' : s === 'URGENT_ATTENTION' ? 'Urgent' : s === 'REVIEW_RECOMMENDED' ? 'Review' : 'Info'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#64748B] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md font-medium text-[#203040] bg-white focus:outline-none focus:border-[#123B5D]"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-[#64748B] font-mono">
          Showing {filtered.length} alerts
        </span>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-8 text-center text-xs text-[#64748B]">
            No clinical alerts match the selected filters.
          </div>
        ) : (
          filtered.map((alert) => {
            const isUrgent = alert.severity === 'URGENT_ATTENTION';
            const isReview = alert.severity === 'REVIEW_RECOMMENDED';

            return (
              <div
                key={alert.id}
                className={`bg-white border rounded-lg p-4 shadow-xs transition-colors ${
                  isUrgent
                    ? 'border-[#F5C2C2] hover:border-[#C94C4C]'
                    : isReview
                    ? 'border-[#FDE68A] hover:border-[#E9A23B]'
                    : 'border-[#DCE5EB] hover:border-[#CBDDE9]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#DCE5EB] mb-3">
                  <div className="flex items-center gap-2">
                    {isUrgent ? (
                      <ShieldAlert className="w-4 h-4 text-[#C94C4C]" />
                    ) : isReview ? (
                      <AlertTriangle className="w-4 h-4 text-[#E9A23B]" />
                    ) : (
                      <Info className="w-4 h-4 text-[#3978B8]" />
                    )}

                    <span className="font-bold text-xs text-[#123B5D]">
                      {alert.patient_name || alert.patient_id} ({alert.surgery_type || 'Post-Op'})
                    </span>

                    <span className="text-[10px] font-mono text-[#64748B]">
                      {alert.id} · {alert.trigger_rule}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      alert.status === 'New'
                        ? 'bg-[#C94C4C] text-white'
                        : alert.status === 'Under Review'
                        ? 'bg-[#E9A23B] text-white'
                        : alert.status === 'Escalated'
                        ? 'bg-[#123B5D] text-white'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      {alert.status}
                    </span>

                    <span className="text-[11px] font-mono text-[#64748B]">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#203040] leading-relaxed mb-3">
                  {alert.explanation}
                </p>

                {alert.clinical_notes && (
                  <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#DCE5EB] text-xs mb-3">
                    <strong className="text-[#123B5D]">Clinical Review Note: </strong>
                    <span className="text-[#203040]">{alert.clinical_notes}</span>
                    {alert.assigned_reviewer && (
                      <span className="block text-[10px] text-[#64748B] mt-0.5 font-mono">
                        Reviewed by: {alert.assigned_reviewer}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#DCE5EB]">
                  <button
                    onClick={() => {
                      onSelectPatient(alert.patient_id);
                      onNavigate('digital-twin');
                    }}
                    className="text-xs text-[#2A9D8F] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Patient Twin</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onReviewAlert(alert)}
                    className="px-3 py-1.5 bg-[#123B5D] text-white font-semibold rounded hover:bg-[#0e2f4b] transition-colors shadow-2xs"
                  >
                    Examine & Update Alert
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
