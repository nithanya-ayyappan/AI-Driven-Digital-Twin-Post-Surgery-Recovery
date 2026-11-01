import React from 'react';
import { WoundObservation } from '../types';
import { Crosshair, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface BodyMapProps {
  surgicalSite: string;
  surgeryType: string;
  woundObservation?: WoundObservation | null;
  painScore: number;
}

export const BodyMap: React.FC<BodyMapProps> = ({
  surgicalSite,
  surgeryType,
  woundObservation,
  painScore
}) => {
  // Determine site category
  const isKnee = surgicalSite.toLowerCase().includes('knee');
  const isHernia = surgicalSite.toLowerCase().includes('inguinal') || surgicalSite.toLowerCase().includes('groin');
  const isAppendectomy = surgicalSite.toLowerCase().includes('lower abdominal') || surgeryType.toLowerCase().includes('append');
  const isCholecystectomy = surgicalSite.toLowerCase().includes('upper abdominal') || surgeryType.toLowerCase().includes('cholecyst');

  // Focal coordinates on SVG body silhouette (viewBox 0 0 200 360)
  let focusX = 100;
  let focusY = 170;

  if (isCholecystectomy) {
    focusX = 85;
    focusY = 150;
  } else if (isAppendectomy) {
    focusX = 85;
    focusY = 180;
  } else if (isHernia) {
    focusX = 90;
    focusY = 195;
  } else if (isKnee) {
    focusX = 80;
    focusY = 265;
  }

  const hasWoundWarning =
    woundObservation?.redness?.toLowerCase().includes('spreading') ||
    woundObservation?.redness?.toLowerCase().includes('erythema >') ||
    woundObservation?.discharge?.toLowerCase().includes('purulent') ||
    painScore >= 6;

  return (
    <div className="bg-white border border-[#DCE5EB] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DCE5EB]">
        <div>
          <h4 className="text-sm font-bold text-[#123B5D]">Surgical Site Digital Focus</h4>
          <p className="text-xs text-[#64748B]">Anatomical localization & wound state representation</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded bg-[#F3F7FA] text-[#123B5D] border border-[#DCE5EB]">
          <Crosshair className="w-3.5 h-3.5 text-[#2A9D8F]" />
          <span>{surgicalSite}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Anatomical Schematic Silhouette */}
        <div className="relative flex justify-center bg-[#F8FAFC] rounded-lg p-3 border border-[#DCE5EB]">
          <svg viewBox="0 0 200 360" className="h-64 w-auto drop-shadow-xs">
            {/* Head */}
            <circle cx="100" cy="35" r="22" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
            {/* Neck */}
            <rect x="94" y="57" width="12" height="14" fill="#E2E8F0" />
            {/* Torso */}
            <path
              d="M 65 72 L 135 72 L 128 190 L 72 190 Z"
              fill="#E2E8F0"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            {/* Arms */}
            <path
              d="M 64 72 L 40 160 L 52 162 L 70 82 Z"
              fill="#E2E8F0"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            <path
              d="M 136 72 L 160 160 L 148 162 L 130 82 Z"
              fill="#E2E8F0"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            {/* Pelvis & Legs */}
            <path
              d="M 72 190 L 80 270 L 75 345 L 90 345 L 96 270 L 100 205 L 104 270 L 110 345 L 125 345 L 120 270 L 128 190 Z"
              fill="#E2E8F0"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />

            {/* Surgical Target Marker */}
            <circle
              cx={focusX}
              cy={focusY}
              r="14"
              fill={hasWoundWarning ? '#C94C4C' : '#2A9D8F'}
              fillOpacity="0.25"
              stroke={hasWoundWarning ? '#C94C4C' : '#2A9D8F'}
              strokeWidth="2"
              strokeDasharray={hasWoundWarning ? '3,2' : undefined}
            />
            <circle
              cx={focusX}
              cy={focusY}
              r="4"
              fill={hasWoundWarning ? '#C94C4C' : '#2A9D8F'}
            />

            {/* Pointer Callout */}
            <line
              x1={focusX}
              y1={focusY}
              x2={focusX + 35}
              y2={focusY - 20}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            <circle cx={focusX + 35} cy={focusY - 20} r="2.5" fill="#64748B" />
          </svg>

          {/* Focal Badge */}
          <div className="absolute bottom-2 left-2 text-[10px] font-mono text-[#64748B] bg-white/90 px-1.5 py-0.5 rounded border border-[#DCE5EB]">
            Focus: {focusX},{focusY}
          </div>
        </div>

        {/* Wound & Tissue Health Details */}
        <div className="space-y-3">
          <div className={`p-3 rounded-lg border ${
            hasWoundWarning ? 'bg-[#FDF2F2] border-[#F5C2C2]' : 'bg-[#F8FAFC] border-[#DCE5EB]'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {hasWoundWarning ? (
                <AlertCircle className="w-4 h-4 text-[#C94C4C]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#2A9D8F]" />
              )}
              <span className={`text-xs font-bold ${
                hasWoundWarning ? 'text-[#C94C4C]' : 'text-[#123B5D]'
              }`}>
                {hasWoundWarning ? 'Tissue Inspection Urged' : 'Incision Margins Stable'}
              </span>
            </div>
            <p className="text-xs text-[#203040]">
              {woundObservation
                ? `Redness: ${woundObservation.redness || 'None'} · Swelling: ${woundObservation.swelling || 'None'} · Discharge: ${woundObservation.discharge || 'None'}`
                : 'No acute wound abnormalities recorded in latest physical observation.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#DCE5EB]">
              <div className="text-[10px] font-semibold text-[#64748B] uppercase">Dressing Status</div>
              <div className="font-semibold text-[#203040] mt-0.5">
                {woundObservation?.dressing || 'Clean, dry & intact'}
              </div>
            </div>

            <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#DCE5EB]">
              <div className="text-[10px] font-semibold text-[#64748B] uppercase">Localized Pain</div>
              <div className="font-semibold text-[#203040] mt-0.5">
                {painScore}/10 ({painScore <= 3 ? 'Controlled' : painScore <= 6 ? 'Moderate' : 'Severe'})
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#64748B] leading-relaxed flex items-start gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2A9D8F] shrink-0 mt-0.5" />
            <span>Digital twin represents anatomical recovery progression without autonomous diagnosis.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
