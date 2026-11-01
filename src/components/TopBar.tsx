import React from 'react';
import { User, UserRole } from '../types';
import { Activity, ShieldAlert, LogOut, UserCheck } from 'lucide-react';

interface TopBarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  selectedPatientName?: string;
  activeViewTitle: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  onLogout,
  onSwitchRole,
  selectedPatientName,
  activeViewTitle
}) => {
  return (
    <header className="h-16 bg-[#123B5D] text-white flex items-center justify-between px-6 border-b border-[#0E2F4B] shrink-0 sticky top-0 z-30">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#2A9D8F] flex items-center justify-center text-white font-bold shadow-sm">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight leading-none text-white whitespace-nowrap">
            Digital Twin Recovery
          </span>
          <span className="text-[10px] text-slate-300 font-medium tracking-wide uppercase mt-0.5">
            Post-Surgery Clinical Monitoring
          </span>
        </div>
      </div>

      {/* Zone 2: Contextual Breadcrumb & Status */}
      <div className="hidden md:flex items-center gap-3 text-xs text-slate-200">
        <span className="font-medium text-white">{activeViewTitle}</span>
        {selectedPatientName && (
          <>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">Active Patient: <strong className="text-white font-semibold">{selectedPatientName}</strong></span>
          </>
        )}
        <span className="text-slate-400">·</span>
        <span className="text-[#2A9D8F] font-mono text-[11px] bg-[#1a4a70] px-2 py-0.5 rounded border border-[#2A9D8F]/30">
          Synthetic Demo Mode
        </span>
      </div>

      {/* Zone 3: Role Switcher & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {currentUser && (
          <div className="flex items-center gap-2 bg-[#1A4A70] rounded-md px-2.5 py-1 border border-[#235882]">
            <UserCheck className="w-3.5 h-3.5 text-[#2A9D8F]" />
            <span className="text-xs text-slate-200 font-medium hidden sm:inline">Role:</span>
            <select
              value={currentUser.role}
              onChange={(e) => onSwitchRole(e.target.value as UserRole)}
              className="bg-transparent text-xs text-white font-semibold outline-none cursor-pointer pr-1"
              title="Switch demo evaluation role"
            >
              <option value="Clinician" className="bg-[#123B5D] text-white">Clinician (Full Clinical)</option>
              <option value="Administrator" className="bg-[#123B5D] text-white">Administrator (System Admin)</option>
              <option value="Patient" className="bg-[#123B5D] text-white">Patient (Patient Portal)</option>
            </select>
          </div>
        )}

        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#235882]">
            <div className="text-right hidden lg:block">
              <div className="text-xs font-semibold text-white leading-tight">{currentUser.fullName}</div>
              <div className="text-[10px] text-slate-300">{currentUser.email}</div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded hover:bg-[#1A4A70] text-slate-300 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
