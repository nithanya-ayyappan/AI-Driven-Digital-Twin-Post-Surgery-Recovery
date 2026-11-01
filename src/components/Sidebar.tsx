import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  Activity,
  History,
  HeartPulse,
  BrainCircuit,
  AlertTriangle,
  FileText,
  Cpu,
  Settings,
  ShieldCheck
} from 'lucide-react';

export type ViewType =
  | 'dashboard'
  | 'patients'
  | 'digital-twin'
  | 'timeline'
  | 'health-monitoring'
  | 'ai-insights'
  | 'alerts'
  | 'reports'
  | 'device-integration'
  | 'settings';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  userRole: UserRole;
  unreadAlertCount: number;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badgeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  userRole,
  unreadAlertCount
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Clinician', 'Patient'] },
    { id: 'patients', label: 'Patients', icon: Users, roles: ['Administrator', 'Clinician'] },
    { id: 'digital-twin', label: 'Digital Twin', icon: Activity, roles: ['Administrator', 'Clinician', 'Patient'] },
    { id: 'timeline', label: 'Recovery Timeline', icon: History, roles: ['Administrator', 'Clinician', 'Patient'] },
    { id: 'health-monitoring', label: 'Health Monitoring', icon: HeartPulse, roles: ['Administrator', 'Clinician', 'Patient'] },
    { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit, roles: ['Administrator', 'Clinician'] },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, roles: ['Administrator', 'Clinician', 'Patient'], badgeCount: unreadAlertCount },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['Administrator', 'Clinician'] },
    { id: 'device-integration', label: 'Device Integration', icon: Cpu, roles: ['Administrator', 'Clinician'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Administrator', 'Clinician', 'Patient'] }
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-white border-r border-[#DCE5EB] flex flex-col shrink-0 select-none">
      {/* Role Context Bar */}
      <div className="px-5 py-4 border-b border-[#DCE5EB] bg-[#F8FAFC]">
        <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
          Workspace Access
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-sm font-bold text-[#123B5D]">
          <ShieldCheck className="w-4 h-4 text-[#2A9D8F]" />
          <span>{userRole} Portal</span>
        </div>
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#123B5D] text-white shadow-sm font-semibold'
                  : 'text-[#203040] hover:bg-[#F3F7FA] hover:text-[#123B5D]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
              {item.badgeCount && item.badgeCount > 0 ? (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-[#C94C4C] text-white' : 'bg-[#C94C4C]/15 text-[#C94C4C]'
                }`}>
                  {item.badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Safety Notice Footer */}
      <div className="p-4 border-t border-[#DCE5EB] bg-[#F8FAFC]">
        <div className="text-[11px] leading-tight text-[#64748B]">
          <strong className="text-[#203040] font-semibold block mb-1">Clinical Safety Disclaimer:</strong>
          This system provides decision support and does not replace professional clinical judgment. Emergency symptoms require immediate hospital evaluation.
        </div>
      </div>
    </aside>
  );
};
