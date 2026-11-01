import React, { useState, useEffect } from 'react';
import { User, UserRole, AuditLog } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  Settings,
  UserCheck,
  ShieldCheck,
  Database,
  RotateCcw,
  History,
  Lock,
  FileCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: User | null;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  onResetDatabase: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onSwitchRole,
  onLogout,
  onResetDatabase
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Preference units
  const [tempUnit, setTempUnit] = useState('Celsius (°C)');
  const [weightUnit, setWeightUnit] = useState('Kilograms (kg)');

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((res) => res.json())
      .then((data) => setAuditLogs(data))
      .catch((err) => console.error(err));
  }, []);

  const handleReset = async () => {
    setResetting(true);
    setResetMessage(null);
    try {
      await onResetDatabase();
      setResetMessage('Demo database successfully re-seeded with pristine synthetic records.');
      setResetConfirmOpen(false);
      // Refresh logs
      fetch('/api/audit-logs')
        .then((res) => res.json())
        .then((data) => setAuditLogs(data));
    } catch (err: any) {
      setResetMessage('Reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner message="System governance, audit tracking, clinical units, and security parameters." />

      {/* Header */}
      <div className="pb-2">
        <h2 className="text-xl font-bold text-[#123B5D] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#2A9D8F]" />
          Platform Settings & Audit Governance
        </h2>
        <p className="text-xs text-[#64748B]">
          User roles, local SQLite database storage, clinical unit configurations, and audit trails
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: User Profile & Preferences */}
        <div className="lg:col-span-6 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5EB]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#123B5D]" />
                <h3 className="text-sm font-bold text-[#123B5D]">Active Session & Credentials</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#2A9D8F]/15 text-[#2A9D8F]">
                {currentUser?.role}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-[#203040]">
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Full Name:</span>
                <span className="font-bold text-[#123B5D]">{currentUser?.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Work Email:</span>
                <span className="font-mono text-[#203040]">{currentUser?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#64748B]">Session ID:</span>
                <span className="font-mono text-[11px] text-[#64748B]">SESSION_TOKEN_HASH_SECURE</span>
              </div>
            </div>

            {/* Quick Role Switcher */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[#203040] mb-1.5">
                Switch Role for Evaluation:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Administrator', 'Clinician', 'Patient'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => onSwitchRole(r)}
                    className={`py-1.5 text-xs font-semibold rounded border transition-colors ${
                      currentUser?.role === r
                        ? 'bg-[#123B5D] text-white border-[#123B5D]'
                        : 'bg-[#F8FAFC] text-[#203040] border-[#DCE5EB] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Unit Preferences */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#DCE5EB]">
              <FileCheck className="w-4 h-4 text-[#123B5D]" />
              <h3 className="text-sm font-bold text-[#123B5D]">Clinical Display Units</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#203040] mb-1">Temperature Unit</label>
                <select
                  value={tempUnit}
                  onChange={(e) => setTempUnit(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
                >
                  <option value="Celsius (°C)">Celsius (°C)</option>
                  <option value="Fahrenheit (°F)">Fahrenheit (°F)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#203040] mb-1">Weight Unit</label>
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
                >
                  <option value="Kilograms (kg)">Kilograms (kg)</option>
                  <option value="Pounds (lbs)">Pounds (lbs)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Database & Data Management */}
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#DCE5EB]">
              <Database className="w-4 h-4 text-[#123B5D]" />
              <h3 className="text-sm font-bold text-[#123B5D]">Local Storage & Demo Seed Data</h3>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Storage Engine: <strong className="text-[#203040]">SQLite (`recovery_twin.db`)</strong>. Data is persisted locally on the host container. You can reset records to initial synthetic baseline state below:
            </p>

            {resetMessage && (
              <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] text-[#14532D] text-xs rounded">
                {resetMessage}
              </div>
            )}

            {resetConfirmOpen ? (
              <div className="p-3.5 bg-[#FDF2F2] border border-[#F5C2C2] rounded text-xs space-y-2">
                <div className="font-bold text-[#C94C4C] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Demo Database Reset?</span>
                </div>
                <p className="text-[#203040]">
                  This will wipe all newly logged observations and re-seed the standard fictional cohort (Sarah Jenkins, Robert Chen, Marcus Vance).
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="px-3 py-1 bg-[#C94C4C] text-white font-bold rounded hover:bg-[#a83232] text-xs disabled:opacity-50"
                  >
                    {resetting ? 'Resetting...' : 'Yes, Reset Database'}
                  </button>
                  <button
                    onClick={() => setResetConfirmOpen(false)}
                    className="px-3 py-1 bg-white border border-[#DCE5EB] text-[#203040] rounded text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="px-3 py-2 bg-white border border-[#DCE5EB] text-[#C94C4C] font-semibold text-xs rounded hover:bg-[#FDF2F2] transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Database to Synthetic Default
              </button>
            )}
          </div>
        </div>

        {/* Right: System Audit Log */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-[#DCE5EB] rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5EB]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#123B5D]" />
                <h3 className="text-sm font-bold text-[#123B5D]">Clinical System Audit Trail</h3>
              </div>
              <span className="text-[10px] font-mono text-[#64748B]">{auditLogs.length} events logged</span>
            </div>

            <p className="text-xs text-[#64748B]">
              Immutable audit log tracking patient registrations, observation inputs, alert status updates, and session logins:
            </p>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <div className="text-xs text-[#64748B] text-center py-6">
                  No audit log entries recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded bg-[#F8FAFC] border border-[#DCE5EB] text-xs space-y-1 hover:border-[#CBDDE9] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#123B5D] text-[11px]">{log.action}</span>
                      <span className="text-[10px] font-mono text-[#64748B]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[#203040] text-[11px] leading-relaxed">
                      {log.details}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1 border-t border-[#DCE5EB]/60">
                      <span>User: <strong className="text-[#203040]">{log.user_email}</strong> ({log.user_role})</span>
                      <span className="font-mono">ID: {log.target_id || log.target_type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
