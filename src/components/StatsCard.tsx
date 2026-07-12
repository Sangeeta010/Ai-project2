import React from "react";
import { CheckCircle2, XCircle, Clock, Users, ArrowUpRight, BarChart3 } from "lucide-react";

interface StatsCardProps {
  total: number;
  present: number;
  absent: number;
}

export default function StatsCard({ total, present, absent }: StatsCardProps) {
  const pending = total - (present + absent);
  const completionPercentage = Math.round(((present + absent) / total) * 100) || 0;

  return (
    <div id="attendance-stats-panel" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Students Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Students</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1 font-mono">{total}</h3>
        </div>
        <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Present Students Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Present</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{present}</h3>
            <span className="text-xs text-emerald-500/80 font-mono font-medium">
              ({total > 0 ? Math.round((present / total) * 100) : 0}%)
            </span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      {/* Absent Students Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Absent</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-rose-400 mt-1 font-mono">{absent}</h3>
            <span className="text-xs text-rose-500/80 font-mono font-medium">
              ({total > 0 ? Math.round((absent / total) * 100) : 0}%)
            </span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400">
          <XCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Progress / Completion Rate */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Completion Rate</p>
            <h3 className="text-2xl font-bold text-cyan-400 mt-1 font-mono">{completionPercentage}%</h3>
          </div>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-mono px-2 py-0.5 rounded-full border border-cyan-500/20">
            {present + absent} / {total}
          </span>
        </div>
        
        {/* Sleek Progress bar */}
        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
