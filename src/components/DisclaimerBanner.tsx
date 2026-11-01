import React from 'react';
import { AlertCircle, Info, ShieldAlert } from 'lucide-react';

interface DisclaimerBannerProps {
  type?: 'demo' | 'emergency' | 'ai_limit';
  message?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  type = 'demo',
  message
}) => {
  if (type === 'emergency') {
    return (
      <div className="bg-[#FDF2F2] border border-[#F5C2C2] rounded-lg p-3.5 mb-5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#C94C4C] shrink-0 mt-0.5" />
        <div className="text-xs text-[#203040]">
          <strong className="text-[#C94C4C] font-bold block mb-0.5">CRITICAL SAFETY PROTOCOL:</strong>
          {message ||
            'This application provides non-diagnostic decision support. If the patient develops chest pain, dyspnea, uncontrolled surgical bleeding, or acute neurological changes, direct them to emergency medical services immediately.'}
        </div>
      </div>
    );
  }

  if (type === 'ai_limit') {
    return (
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3.5 mb-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#3978B8] shrink-0 mt-0.5" />
        <div className="text-xs text-[#203040]">
          <strong className="text-[#3978B8] font-semibold block mb-0.5">EXPLAINABLE AI & CLINICAL RECOVERY MODEL:</strong>
          {message ||
            'Trends are calculated using deterministic clinical post-operative rule corridors and baseline delta analysis. Normal parameter values do not guarantee freedom from complications, and the absence of an alert must not be interpreted as medical safety.'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] border border-[#DCE5EB] rounded-lg px-3.5 py-2 mb-5 flex items-center justify-between text-xs text-[#64748B]">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-[#E9A23B] shrink-0" />
        <span>
          <strong className="text-[#203040] font-semibold">Educational Prototype Notice:</strong>{' '}
          {message || 'All patient records, surgical events, and device telemetries shown are synthetic demonstrations.'}
        </span>
      </div>
      <span className="text-[11px] font-mono font-medium text-[#2A9D8F] bg-[#2A9D8F]/10 px-2 py-0.5 rounded">
        LOCAL SIMULATION ACTIVE
      </span>
    </div>
  );
};
