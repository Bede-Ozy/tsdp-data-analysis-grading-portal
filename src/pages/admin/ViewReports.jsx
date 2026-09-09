import React, { useState, useEffect } from 'react';
import { getAllStudents } from '../../services/api';
import { GRADING_WEIGHTS, getGradeLetter, PROGRAM_INFO } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FileBarChart, Download, Printer, Award, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function ViewReports() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAllStudents();
        const list = Array.isArray(res) ? res : (res?.data || res?.students || []);
        if (list.length > 0) {
          setStudents(list);
        }
      } catch (err) {
        console.error('Failed to load students for reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Generating comprehensive cohort reports..." />;
  }

  // Calculate grade distribution counts
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  students.forEach(s => {
    const letter = getGradeLetter(s.overallScore).letter;
    if (distribution[letter] !== undefined) {
      distribution[letter] += 1;
    }
  });

  const exportCSV = () => {
    const headers = ['StudentID', 'StudentNumber', 'Name', 'Email', 'ClassGroup', 'CapstoneGroup', 'AttendanceRate', 'OverallScore', 'GradeLetter'];
    const rows = students.map(s => {
      const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentID;
      const att = s.attendanceRate !== undefined && s.attendanceRate !== null ? `${s.attendanceRate}%` : 'N/A';
      const score = s.overallScore !== undefined && s.overallScore !== null ? `${s.overallScore}%` : 'N/A';
      const letter = s.overallScore !== undefined && s.overallScore !== null ? getGradeLetter(s.overallScore).letter : 'Pending';
      return [
        s.studentID,
        s.studentNumber,
        `"${sName}"`,
        s.email || '',
        s.classGroup || '',
        s.capstoneGroup || '',
        att,
        score,
        letter
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TSDP2026_Cohort_Grading_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Cohort Performance Reports</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Program evaluation analytics, grade distribution, and CSV export for ITF-NECA stakeholders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-outline py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Grade Distribution Bar */}
      <div className="portal-card">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Grade Distribution ({students.length} Enrolled Residents)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-center">
            <span className="text-[10px] font-medium uppercase text-emerald-700 block">Distinction (A: ≥ 70%)</span>
            <span className="text-2xl font-semibold text-emerald-700">{distribution.A}</span>
            <span className="text-[11px] text-emerald-600 block font-normal">Residents</span>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-center">
            <span className="text-[10px] font-medium uppercase text-brand-primary block">Merit (B: 60-69%)</span>
            <span className="text-2xl font-semibold text-brand-primary">{distribution.B}</span>
            <span className="text-[11px] text-blue-600 block font-normal">Residents</span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100 text-center">
            <span className="text-[10px] font-medium uppercase text-amber-700 block">Credit (C: 50-59%)</span>
            <span className="text-2xl font-semibold text-amber-700">{distribution.C}</span>
            <span className="text-[11px] text-amber-600 block font-normal">Residents</span>
          </div>

          <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-100 text-center">
            <span className="text-[10px] font-medium uppercase text-orange-700 block">Pass (D: 45-49%)</span>
            <span className="text-2xl font-semibold text-orange-700">{distribution.D}</span>
            <span className="text-[11px] text-orange-600 block font-normal">Residents</span>
          </div>

          <div className="p-3 bg-red-50/70 rounded-xl border border-red-100 text-center">
            <span className="text-[10px] font-medium uppercase text-brand-error block">Fail / Pending (&lt; 45%)</span>
            <span className="text-2xl font-semibold text-brand-error">{distribution.F}</span>
            <span className="text-[11px] text-red-600 block font-normal">Residents</span>
          </div>
        </div>
      </div>

      {/* Component Weighting Table */}
      <div className="portal-card space-y-3">
        <h3 className="text-base font-semibold text-slate-800">Evaluation Components & Weight Allocation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {GRADING_WEIGHTS.map(w => (
            <div key={w.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-brand-neutral">{w.name}</span>
              <span className="badge-primary font-bold">{w.weight}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
