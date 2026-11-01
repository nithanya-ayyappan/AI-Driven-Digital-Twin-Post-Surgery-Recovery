import React, { useState } from 'react';
import { Patient } from '../types';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patientId: string) => void;
  onSubmitPatient: (data: Partial<Patient>) => Promise<{ patientId: string }>;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSubmitPatient
}) => {
  const [fullName, setFullName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [age, setAge] = useState(48);
  const [gender, setGender] = useState('Female');
  const [contactEmail, setContactEmail] = useState('');
  const [surgeryType, setSurgeryType] = useState('Laparoscopic Cholecystectomy');
  const [surgeryDate, setSurgeryDate] = useState(
    new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]
  );
  const [treatingClinician, setTreatingClinician] = useState('Dr. Rachel Vance, MD');
  const [surgicalSite, setSurgicalSite] = useState('Right Upper Abdominal Quadrant');
  const [recoveryPlan, setRecoveryPlan] = useState('Standard Laparoscopic Enhanced Recovery (ERAS)');
  const [consentStatus, setConsentStatus] = useState<'Consented' | 'Pending'>('Consented');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !surgeryType.trim() || !surgeryDate || !treatingClinician.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmitPatient({
        id: patientId.trim() || undefined,
        full_name: fullName.trim(),
        age: Number(age),
        gender,
        contact_email: contactEmail.trim() || null,
        surgery_type: surgeryType.trim(),
        surgery_date: surgeryDate,
        treating_clinician: treatingClinician.trim(),
        surgical_site: surgicalSite.trim(),
        recovery_plan: recoveryPlan.trim(),
        consent_status: consentStatus
      });
      onSuccess(res.patientId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register patient.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-[#DCE5EB] overflow-hidden my-8">
        <div className="px-6 py-4 bg-[#123B5D] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#2A9D8F]" />
            <h3 className="font-bold text-base text-white">Enroll New Post-Surgery Patient</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-[#1a4a70]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] text-[#C94C4C] text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Full Name or Pseudonym *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maria Gonzalez"
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Custom Patient ID (Optional)
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Leave blank for auto ID"
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md font-mono focus:outline-none focus:border-[#123B5D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">Age *</label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other / Undisclosed</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Contact Email (Minimum Necessary)
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="maria.g@demo-healthcare.org"
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Surgical Procedure *
              </label>
              <input
                type="text"
                required
                value={surgeryType}
                onChange={(e) => setSurgeryType(e.target.value)}
                placeholder="e.g. Total Hip Arthroplasty, Appendectomy"
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Surgery Date *
              </label>
              <input
                type="date"
                required
                value={surgeryDate}
                onChange={(e) => setSurgeryDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Treating Clinician *
              </label>
              <input
                type="text"
                required
                value={treatingClinician}
                onChange={(e) => setTreatingClinician(e.target.value)}
                placeholder="Dr. Full Name, MD"
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Surgical Site / Focus Region
              </label>
              <input
                type="text"
                value={surgicalSite}
                onChange={(e) => setSurgicalSite(e.target.value)}
                placeholder="e.g. Right Knee Joint, Abdominal Quadrant"
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Recovery Protocol Plan
              </label>
              <input
                type="text"
                value={recoveryPlan}
                onChange={(e) => setRecoveryPlan(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203040] mb-1">
                Consent & Data Sharing
              </label>
              <select
                value={consentStatus}
                onChange={(e) => setConsentStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
              >
                <option value="Consented">Consented (Clinical Monitoring & Twin)</option>
                <option value="Pending">Pending Signed Form</option>
              </select>
            </div>
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
              {loading ? 'Creating...' : 'Enroll Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
