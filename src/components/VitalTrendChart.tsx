import React, { useState } from 'react';
import { Observation } from '../types';

interface VitalTrendChartProps {
  observations: Observation[];
  selectedMetric?: 'temperature' | 'pulse' | 'spo2' | 'pain';
  height?: number;
}

export const VitalTrendChart: React.FC<VitalTrendChartProps> = ({
  observations,
  selectedMetric = 'temperature',
  height = 240
}) => {
  const [activeMetric, setActiveMetric] = useState<'temperature' | 'pulse' | 'spo2' | 'pain'>(selectedMetric);
  const [hoveredPoint, setHoveredPoint] = useState<Observation | null>(null);

  if (!observations || observations.length === 0) {
    return (
      <div className="h-48 border border-dashed border-[#DCE5EB] rounded-lg flex items-center justify-center text-xs text-[#64748B]">
        No longitudinal observations recorded for this patient yet.
      </div>
    );
  }

  // Sort chronological
  const sorted = [...observations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Metric configurations
  const config = {
    temperature: {
      label: 'Body Temperature',
      unit: '°C',
      getValue: (o: Observation) => o.temperature_c,
      min: 36.0,
      max: 39.5,
      normalMin: 36.4,
      normalMax: 37.5,
      color: '#3978B8',
      warningColor: '#C94C4C'
    },
    pulse: {
      label: 'Pulse Rate',
      unit: 'bpm',
      getValue: (o: Observation) => o.pulse_bpm,
      min: 50,
      max: 120,
      normalMin: 60,
      normalMax: 88,
      color: '#2A9D8F',
      warningColor: '#E9A23B'
    },
    spo2: {
      label: 'SpO2 Oxygen Saturation',
      unit: '%',
      getValue: (o: Observation) => o.spo2_percent,
      min: 88,
      max: 100,
      normalMin: 95,
      normalMax: 100,
      color: '#123B5D',
      warningColor: '#C94C4C'
    },
    pain: {
      label: 'Visual Numeric Pain Score',
      unit: '/10',
      getValue: (o: Observation) => o.pain_score,
      min: 0,
      max: 10,
      normalMin: 0,
      normalMax: 3,
      color: '#E9A23B',
      warningColor: '#C94C4C'
    }
  }[activeMetric];

  // SVG dimensions
  const width = 640;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const yRange = config.max - config.min;

  const points = sorted.map((obs, idx) => {
    const val = config.getValue(obs);
    const x =
      sorted.length === 1
        ? padding.left + innerWidth / 2
        : padding.left + (idx / (sorted.length - 1)) * innerWidth;
    const clampedVal = Math.max(config.min, Math.min(config.max, val));
    const y = padding.top + innerHeight - ((clampedVal - config.min) / yRange) * innerHeight;
    return { x, y, val, obs };
  });

  // Polyline points
  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Normal range corridor
  const normalYTop =
    padding.top + innerHeight - ((config.normalMax - config.min) / yRange) * innerHeight;
  const normalYBottom =
    padding.top + innerHeight - ((config.normalMin - config.min) / yRange) * innerHeight;
  const normalBandHeight = Math.max(2, normalYBottom - normalYTop);

  return (
    <div className="bg-white border border-[#DCE5EB] rounded-lg p-4">
      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#DCE5EB]">
        <div>
          <h4 className="text-sm font-bold text-[#123B5D]">{config.label} Trend</h4>
          <p className="text-xs text-[#64748B]">
            Target recovery corridor:{' '}
            <span className="font-semibold text-[#203040]">
              {config.normalMin} - {config.normalMax} {config.unit}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#F3F7FA] p-1 rounded-md border border-[#DCE5EB]">
          {(['temperature', 'pulse', 'spo2', 'pain'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setActiveMetric(m);
                setHoveredPoint(null);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                activeMetric === m
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#123B5D]'
              }`}
            >
              {m === 'temperature' ? 'Temp' : m === 'pulse' ? 'Pulse' : m === 'spo2' ? 'SpO2' : 'Pain'}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '400px' }}
        >
          {/* Normal corridor shaded band */}
          <rect
            x={padding.left}
            y={normalYTop}
            width={innerWidth}
            height={normalBandHeight}
            fill="#2A9D8F"
            fillOpacity="0.08"
            stroke="#2A9D8F"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />

          {/* Grid lines and Y axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const val = (config.min + yRange * ratio).toFixed(
              activeMetric === 'temperature' ? 1 : 0
            );
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748B"
                  className="tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Data connecting line */}
          <polyline
            fill="none"
            stroke={config.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePoints}
          />

          {/* Data points */}
          {points.map((p, idx) => {
            const isWarn = p.val > config.normalMax || p.val < config.normalMin;
            const isHovered = hoveredPoint?.id === p.obs.id;
            return (
              <g key={idx} className="cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={isWarn ? config.warningColor : config.color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredPoint(p.obs)}
                />
                {/* Time label on X-axis */}
                <text
                  x={p.x}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748B"
                  className="tabular-nums"
                >
                  {new Date(p.obs.timestamp).toLocaleDateString(undefined, {
                    month: 'numeric',
                    day: 'numeric'
                  })}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-[#123B5D] text-white p-2.5 rounded shadow-lg text-xs z-10 max-w-xs border border-[#235882]">
            <div className="flex items-center justify-between gap-4 font-semibold text-slate-200 text-[11px] pb-1 border-b border-slate-600 mb-1.5">
              <span>{new Date(hoveredPoint.timestamp).toLocaleString()}</span>
              <span className="font-mono text-[10px] text-[#2A9D8F] bg-[#1a4a70] px-1.5 rounded">
                {hoveredPoint.data_source}
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-white">
                {config.label}: {config.getValue(hoveredPoint)} {config.unit}
              </div>
              <div className="text-[11px] text-slate-300">
                Pulse: {hoveredPoint.pulse_bpm} bpm · SpO2: {hoveredPoint.spo2_percent}% · Pain: {hoveredPoint.pain_score}/10
              </div>
              <div className="text-[10px] text-slate-400">
                Recorded by: {hoveredPoint.recorded_by}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Data Integrity Note */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#DCE5EB]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#2A9D8F]/20 border border-[#2A9D8F]" />
            <span>Target Clinical Recovery Corridor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C94C4C]" />
            <span>Deviation / Threshold Exceeded</span>
          </div>
        </div>
        <div className="font-mono text-[10px]">
          {sorted.length} observations recorded
        </div>
      </div>
    </div>
  );
};
