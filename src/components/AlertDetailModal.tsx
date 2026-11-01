import React, { useState } from 'react';
import { Alert } from '../types';
import { X, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface AlertDetailModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAlert: (alertId: string, status: string, notes?: string, reviewer?: string) => Promise<any>;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  isOpen,
  onClose,
  onUpdateAlert
}) => {
  if (!isOpen || !alert) return null;

  const [status, setStatus] = useState<string>(alert.status);
  const [clinicalNotes, setClinicalNotes] = useState(alert.clinical_notes || '');
  const [reviewer, setReviewer] = useState(alert.assigned_reviewer || 'Dr. Rachel Vance, MD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onUpdateAlert(alert.id, status, clinicalNotes, reviewer);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update alert');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = () => {
    switch (alert.severity) {
      case 'URGENT_ATTENTION':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#C94C4C] bg-[#FDF2F2] border border-[#F5C2C2] px-2.5 py-1 rounded">
            <ShieldAlert className="w-4 h-4" /> Urgent Clinical Review Required
          </span>
        );
      case 'REVIEW_RECOMMENDED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#E9A23B] bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-1 rounded">
            <AlertTriangle className="w-4 h-4" /> Review Recommended
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#3978B8] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded">
            <Info className="w-4 h-4" /> Informational Milestone
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-[#DCE5EB] overflow-hidden my-6">
        <div className="px-6 py-4 bg-[#123B5D] text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-[#2A9D8F] uppercase tracking-wider block">
              {alert.id} · {alert.trigger_rule}
            </span>
            <h3 className="font-bold text-base text-white">Clinical Alert Review</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded hover:bg-[#1a4a70]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] text-[#C94C4C] text-xs rounded">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            {getSeverityBadge()}
            <span className="text-xs text-[#64748B] font-mono">
              {new Date(alert.created_at).toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#DCE5EB] space-y-2">
            <div className="text-xs font-bold text-[#123B5D]">
              Patient: {alert.patient_name || alert.patient_id} ({alert.surgery_type || 'Post-Op'})
            </div>
            <p className="text-xs text-[#203040] leading-relaxed">
              {alert.explanation}
            </p>

            {alert.metric_snapshot && Object.keys(alert.metric_snapshot).length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#DCE5EB]">
                <div className="text-[10px] font-semibold text-[#64748B] uppercase mb-1">
                  Supporting Snapshot Data
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {Object.entries(alert.metric_snapshot).map(([key, val]) => (
                    <span key={key} className="bg-white px-2 py-0.5 rounded border border-[#DCE5EB] text-[#203040]">
                      {key}: <strong>{String(val)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Workflow Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              >
                <option value="New">New (Unaddressed)</option>
                <option value="Under Review">Under Review (Bedside/Chart Examined)</option>
                <option value="Escalated">Escalated (Surgical Consult Requested)</option>
                <option value="Resolved">Resolved (Protocol Completed / Normalized)</option>
                <option value="Dismissed">Dismissed (Artifact / Verified Safe)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Reviewing Clinician
              </label>
              <input
                type="text"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203040] mb-1">
              Clinical Review Notes & Actions Taken *
            </label>
            <textarea
              rows={3}
              required
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Examined wound dressing at bedside. Ordered repeat temperature check in 2 hours. Sent CBC and wound culture."
              className="w-full text-xs p-2.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
            />
          </div>

          <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2A9D8F] shrink-0" />
            <span>Updates are committed to permanent clinical audit logs.</span>
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
              {loading ? 'Saving...' : 'Save Review Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
