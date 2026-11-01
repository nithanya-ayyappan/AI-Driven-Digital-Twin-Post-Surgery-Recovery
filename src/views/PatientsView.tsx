import React, { useState } from 'react';
import { Patient, UserRole } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  HeartPulse,
  Activity,
  Calendar,
  UserCheck,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface PatientsViewProps {
  patients: Patient[];
  userRole: UserRole;
  onSelectPatient: (patientId: string) => void;
  onOpenAddPatient: () => void;
  onOpenAddObservation: (patientId: string) => void;
  onNavigate: (view: any) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  userRole,
  onSelectPatient,
  onOpenAddPatient,
  onOpenAddObservation,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.surgery_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.treating_clinician.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <DisclaimerBanner message="Fictional patient registry for clinical recovery workflow testing." />

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-[#123B5D]">Patient Recovery Registry</h2>
          <p className="text-xs text-[#64748B]">
            Enrolled post-surgical cohorts, clinical pathways, and assigned treating teams
          </p>
        </div>

        {userRole !== 'Patient' && (
          <button
            onClick={onOpenAddPatient}
            className="px-3.5 py-2 bg-[#123B5D] text-white text-xs font-semibold rounded-md hover:bg-[#0e2f4b] transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Enroll New Patient
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#DCE5EB] rounded-lg p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, ID, procedure, clinician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="text-xs text-[#64748B] font-medium">Status:</span>
          <div className="flex items-center gap-1 bg-[#F3F7FA] p-1 rounded-md border border-[#DCE5EB]">
            {['All', 'In Recovery', 'Needs Review', 'Discharged'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  statusFilter === s
                    ? 'bg-[#123B5D] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#123B5D]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white border border-[#DCE5EB] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE5EB] text-[#64748B] font-semibold bg-[#F8FAFC]">
                <th className="py-3 px-4">Patient Profile</th>
                <th className="py-3 px-4">Procedure & Date</th>
                <th className="py-3 px-4">Treating Clinician</th>
                <th className="py-3 px-4">Milestones</th>
                <th className="py-3 px-4">Status & Alerts</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5EB]">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#64748B]">
                    No patient records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const surgeryDate = new Date(patient.surgery_date);
                  const daysPostOp = Math.floor(
                    Math.abs(Date.now() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr key={patient.id} className="hover:bg-[#F3F7FA] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#123B5D]">{patient.full_name}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">
                          ID: {patient.id} · Age: {patient.age} ({patient.gender})
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#203040]">{patient.surgery_type}</div>
                        <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{patient.surgery_date} (Day {daysPostOp} Post-Op)</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[#203040] font-medium">{patient.treating_clinician}</div>
                        <div className="text-[11px] text-[#64748B]">{patient.recovery_plan}</div>
                      </td>

                      <td className="py-3 px-4">
                        {patient.milestoneProgress ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-[#203040]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#2A9D8F]" />
                              <span>
                                {patient.milestoneProgress.completed} / {patient.milestoneProgress.total} achieved
                              </span>
                            </div>
                            <div className="w-24 bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-[#2A9D8F] h-full"
                                style={{
                                  width: `${(patient.milestoneProgress.completed / Math.max(1, patient.milestoneProgress.total)) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#64748B]">None registered</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            patient.status === 'Needs Review'
                              ? 'bg-[#FDF2F2] text-[#C94C4C] border border-[#F5C2C2]'
                              : patient.status === 'In Recovery'
                              ? 'bg-[#EFF6FF] text-[#123B5D] border border-[#BFDBFE]'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}>
                            {patient.status}
                          </span>

                          {(patient.activeAlertsCount || 0) > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#C94C4C] bg-[#FDF2F2] px-1.5 py-0.5 rounded border border-[#F5C2C2]">
                              <AlertTriangle className="w-3 h-3" /> {patient.activeAlertsCount}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenAddObservation(patient.id)}
                            className="p-1.5 rounded hover:bg-[#E2E8F0] text-[#2A9D8F]"
                            title="Log Observation"
                          >
                            <HeartPulse className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectPatient(patient.id);
                              onNavigate('digital-twin');
                            }}
                            className="px-2.5 py-1 bg-[#123B5D] text-white font-semibold rounded hover:bg-[#0e2f4b] transition-colors flex items-center gap-1"
                          >
                            <span>Digital Twin</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
