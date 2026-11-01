import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Activity, ShieldCheck, Lock, UserCheck, Stethoscope, Users, User as UserIcon } from 'lucide-react';

interface WelcomeViewProps {
  onLoginSuccess: (user: User) => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('clinician@hospital.org');
  const [password, setPassword] = useState('clinician123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoSelect = (role: UserRole) => {
    if (role === 'Administrator') {
      setEmail('admin@recovery.org');
      setPassword('admin123');
    } else if (role === 'Clinician') {
      setEmail('clinician@hospital.org');
      setPassword('clinician123');
    } else {
      setEmail('patient.sarah@recovery.org');
      setPassword('patient123');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Sign in failed' }));
        throw new Error(err.error || 'Invalid credentials');
      }
      const data = await res.json();
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please select a demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F7FA] flex flex-col justify-between p-6">
      <div className="max-w-4xl mx-auto w-full pt-6">
        {/* Top Header Lockup */}
        <div className="flex items-center justify-between pb-6 border-b border-[#DCE5EB] mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#123B5D] flex items-center justify-center text-white shadow-sm">
              <Activity className="w-6 h-6 text-[#2A9D8F]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#123B5D] leading-tight">
                AI-Driven Digital Twin for Post-Surgery Recovery
              </h1>
              <p className="text-xs text-[#64748B]">
                Clinical recovery trajectory monitoring, vital observations & explainable decision support
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono font-medium text-[#2A9D8F] bg-[#2A9D8F]/10 px-2.5 py-1 rounded border border-[#2A9D8F]/20">
            v2.4 Prototype · Local SQLite Storage
          </span>
        </div>

        {/* Main Content Split: Description on left, Sign-in on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Project Purpose & Clinical Framework */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#DCE5EB] rounded-xl p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#123B5D] mb-2">
                Purpose & Clinical Governance
              </h2>
              <p className="text-xs text-[#203040] leading-relaxed mb-4">
                This platform maintains a longitudinal software representation (Digital Twin) of an individual patient's post-operative recovery journey. By recording vital signs, monitoring recovery milestones, and flagging concerning deviations, it provides authorized healthcare providers and patients with transparent recovery oversight.
              </p>

              <div className="space-y-3 pt-3 border-t border-[#DCE5EB]">
                <div className="flex items-start gap-2.5 text-xs text-[#203040]">
                  <ShieldCheck className="w-4 h-4 text-[#2A9D8F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#123B5D] font-semibold">Strict Decision Support Boundary:</strong>{' '}
                    Does not diagnose complications, predict mortality, or replace clinical examination.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-[#203040]">
                  <ShieldCheck className="w-4 h-4 text-[#2A9D8F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#123B5D] font-semibold">Hardware-Ready Architecture:</strong>{' '}
                    Built with an active ESP32 ingestion interface (`/api/devices/ingest`) for future bedside sensor streaming.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-[#203040]">
                  <ShieldCheck className="w-4 h-4 text-[#2A9D8F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#123B5D] font-semibold">Explainable AI & Rule Transparency:</strong>{' '}
                    Alerts state exact physiological triggers, deltas, time windows, and missing-data caveats.
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Quick-Select Profiles */}
            <div className="bg-[#EBF3F8] border border-[#CBDDE9] rounded-xl p-5">
              <h3 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-2">
                Quick-Select Safe Demo Role
              </h3>
              <p className="text-xs text-[#64748B] mb-3">
                Select a preset role to populate credentials and test role-based access:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDemoSelect('Clinician')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    email === 'clinician@hospital.org'
                      ? 'bg-white border-[#123B5D] shadow-xs'
                      : 'bg-white/70 border-[#DCE5EB] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#123B5D] mb-1">
                    <Stethoscope className="w-4 h-4 text-[#2A9D8F]" /> Clinician
                  </div>
                  <div className="text-[11px] text-[#64748B]">Dr. Rachel Vance, MD</div>
                  <div className="text-[10px] font-mono text-[#3978B8] mt-1">Full clinical suite</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSelect('Administrator')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    email === 'admin@recovery.org'
                      ? 'bg-white border-[#123B5D] shadow-xs'
                      : 'bg-white/70 border-[#DCE5EB] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#123B5D] mb-1">
                    <Users className="w-4 h-4 text-[#3978B8]" /> Admin
                  </div>
                  <div className="text-[11px] text-[#64748B]">Dr. Aris Thorne</div>
                  <div className="text-[10px] font-mono text-[#3978B8] mt-1">Governance & Audit</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSelect('Patient')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    email === 'patient.sarah@recovery.org'
                      ? 'bg-white border-[#123B5D] shadow-xs'
                      : 'bg-white/70 border-[#DCE5EB] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#123B5D] mb-1">
                    <UserIcon className="w-4 h-4 text-[#E9A23B]" /> Patient
                  </div>
                  <div className="text-[11px] text-[#64748B]">Sarah Jenkins</div>
                  <div className="text-[10px] font-mono text-[#3978B8] mt-1">Personal recovery log</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Sign-In Form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#DCE5EB] rounded-xl p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-bold text-[#123B5D]">Sign In to Portal</h3>
                <p className="text-xs text-[#64748B]">
                  Enter verified credentials or use a demo account above
                </p>
              </div>

              {error && (
                <div className="mb-4 p-2.5 bg-[#FDF2F2] border border-[#F5C2C2] text-[#C94C4C] text-xs rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#203040] mb-1">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#203040] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-[#DCE5EB] rounded-md focus:outline-none focus:border-[#123B5D]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#123B5D] text-white text-xs font-bold rounded-md hover:bg-[#0e2f4b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-[#DCE5EB] text-[11px] text-[#64748B] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#203040] font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-[#2A9D8F]" />
                  <span>Role-Based Access Enforcement</span>
                </div>
                <p className="leading-normal">
                  All authentication attempts and patient record accesses are tracked in tamper-resistant audit logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Legal & Safety Notice */}
      <footer className="max-w-4xl mx-auto w-full pt-8 text-center text-xs text-[#64748B] border-t border-[#DCE5EB] mt-8">
        <p>
          AI-Driven Digital Twin for Post-Surgery Recovery · Educational Clinical Demonstration Prototype · Fictional Synthetic Data
        </p>
      </footer>
    </div>
  );
};
