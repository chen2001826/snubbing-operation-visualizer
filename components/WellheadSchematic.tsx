import React from 'react';
import { PressureState } from '../types';

interface WellheadSchematicProps {
  pressures: PressureState;
  activeValves: {
    annular: boolean;
    upperRam: boolean;
    lowerRam: boolean;
  };
}

const ValveIcon = ({ isOpen, color = "red", label, x, y, width = 60 }: any) => (
  <g transform={`translate(${x}, ${y})`}>
    {/* Valve Body */}
    <rect x={0} y={0} width={width} height={30} fill={isOpen ? "#4ade80" : "#ef4444"} rx={4} stroke="#1e293b" strokeWidth={2} />
    {/* Stem */}
    <line x1={width} y1={15} x2={width + 20} y2={15} stroke="#1e293b" strokeWidth={3} />
    {/* Handle */}
    <circle cx={width + 25} cy={15} r={8} fill="#cbd5e1" stroke="#1e293b" strokeWidth={2} />
    <text x={width / 2} y={20} textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">
      {label} {isOpen ? '(开)' : '(关)'}
    </text>
  </g>
);

const Chamber = ({ pressure, label, height = 80, y, color = "#e2e8f0" }: any) => (
  <g transform={`translate(100, ${y})`}>
    <rect x={0} y={0} width={100} height={height} fill={color} stroke="#475569" strokeWidth={2} />
    <text x={50} y={height / 2} textAnchor="middle" className="text-xs fill-slate-700 font-mono">
      {label}: {pressure} MPa
    </text>
  </g>
);

export const WellheadSchematic: React.FC<WellheadSchematicProps> = ({ pressures, activeValves }) => {
  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 mb-4">井口状态示意图</h3>
      <svg width="300" height="420" viewBox="0 0 300 420" className="overflow-visible">
        {/* Tubing String (Running through center) */}
        <rect x={145} y={10} width={10} height={400} fill="#64748b" />
        
        {/* P0 Area (Atmosphere/Above) */}
        <text x={220} y={30} className="fill-blue-600 font-bold text-sm">P0: {pressures.p0}</text>

        {/* Annular BOP */}
        <g transform="translate(50, 50)">
            <path d="M50 0 L150 0 L140 60 L60 60 Z" fill={activeValves.annular ? "#86efac" : "#fca5a5"} stroke="#334155" strokeWidth="2" />
            <text x={100} y={35} textAnchor="middle" className="text-xs font-bold fill-slate-800">
                环形 BOP {activeValves.annular ? 'OPEN' : 'CLOSED'}
            </text>
        </g>

        {/* P1 Chamber (Between Annular and Upper Ram) */}
        <Chamber y={110} height={60} pressure={pressures.p1} label="P1" color="#f1f5f9" />

        {/* Upper Rams */}
        <ValveIcon x={30} y={170} isOpen={activeValves.upperRam} label="上闸板" />
        <ValveIcon x={210} y={170} isOpen={activeValves.upperRam} label="上闸板" />

        {/* P2 Chamber (Between Rams - Spool) */}
        <Chamber y={200} height={80} pressure={pressures.p2} label="P2" color="#e2e8f0" />
        
        {/* Spool Valves (Bleed off / Equalization) */}
        <line x1={200} y1={240} x2={230} y2={240} stroke="#94a3b8" strokeWidth={2} strokeDasharray="4"/>
        <text x={240} y={244} fontSize="10" fill="#64748b">四通</text>

        {/* Lower Rams */}
        <ValveIcon x={30} y={280} isOpen={activeValves.lowerRam} label="下闸板" />
        <ValveIcon x={210} y={280} isOpen={activeValves.lowerRam} label="下闸板" />

        {/* P3 Casing Pressure */}
        <rect x={90} y={310} width={120} height={100} fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
        <text x={150} y={360} textAnchor="middle" className="text-sm font-bold fill-red-700">
            P3 (套压): {pressures.p3} MPa
        </text>
      </svg>
    </div>
  );
};
