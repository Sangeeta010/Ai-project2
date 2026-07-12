import React, { useState } from "react";
import { Student } from "../data/students";
import { Search, RotateCcw, Download, Check, X, Circle, Filter } from "lucide-react";

interface AttendanceTableProps {
  students: Student[];
  attendance: Record<number, "present" | "absent" | "pending">;
  currentRollNo: number | null;
  onOverrideStatus: (rollNo: number, status: "present" | "absent" | "pending") => void;
  onReset: () => void;
  onExport: () => void;
}

export default function AttendanceTable({
  students,
  attendance,
  currentRollNo,
  onOverrideStatus,
  onReset,
  onExport,
}: AttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "pending">("all");

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toString() === searchTerm.trim();
    
    const status = attendance[student.rollNo] || "pending";
    const matchesFilter = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div id="attendance-list-section" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[600px]">
      {/* Controls Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200">Student Directory & Records</h3>
        </div>
        
        {/* Actions Row */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export to Sheet (CSV)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/60 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Name or Roll No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-500 transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg overflow-x-auto">
          {(["all", "present", "absent", "pending"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex-1 text-center py-1 px-3 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === filter
                  ? "bg-slate-800 text-cyan-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Students List Scrollable Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
        {filteredStudents.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-[10px] text-slate-400 font-semibold tracking-wider uppercase border-b border-slate-800">
                <th className="py-2.5 px-4 w-16 text-center">Roll No</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4 w-44">Attendance Status</th>
                <th className="py-2.5 px-4 w-40 text-right">Actions Override</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const status = attendance[student.rollNo] || "pending";
                const isActive = currentRollNo === student.rollNo;

                return (
                  <tr
                    key={student.rollNo}
                    className={`transition-colors duration-150 ${
                      isActive
                        ? "bg-cyan-500/10 border-l-2 border-l-cyan-400"
                        : "hover:bg-slate-800/30"
                    }`}
                  >
                    {/* Roll No */}
                    <td className="py-3 px-4 font-mono text-xs text-center font-semibold text-slate-300">
                      {student.rollNo}
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-200">{student.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-medium">
                          {student.department}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {status === "present" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3" />
                          Present
                        </span>
                      )}
                      {status === "absent" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <X className="w-3 h-3" />
                          Absent
                        </span>
                      )}
                      {status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          <Circle className="w-2.5 h-2.5 fill-current" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Manual override buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                          onClick={() => onOverrideStatus(student.rollNo, "present")}
                          title="Mark Present"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            status === "present"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "text-slate-500 hover:text-emerald-400"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOverrideStatus(student.rollNo, "absent")}
                          title="Mark Absent"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            status === "absent"
                              ? "bg-rose-500/20 text-rose-400"
                              : "text-slate-500 hover:text-rose-400"
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOverrideStatus(student.rollNo, "pending")}
                          title="Clear Status"
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            status === "pending"
                              ? "bg-slate-800 text-slate-300"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-500">
            <Search className="w-10 h-10 text-slate-700 mb-2" />
            <p className="text-sm font-semibold">No students found matching your criteria.</p>
            <p className="text-xs text-slate-600 mt-1">Try refining your search term or filtering options.</p>
          </div>
        )}
      </div>

      {/* Table summary count */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400 font-medium">
        <span>Showing {filteredStudents.length} of {students.length} students</span>
        <span>Click actions to manually override</span>
      </div>
    </div>
  );
}
