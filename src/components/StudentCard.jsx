import React from 'react';
import { Award, User, Calendar, BookOpen, ChevronRight, Mail } from 'lucide-react';
import { getGradeLetter } from '../utils/constants';

export default function StudentCard({ student, onViewDetails }) {
  if (!student) return null;

  const sName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentID || 'Resident';
  const hasScore = student.overallScore !== undefined && student.overallScore !== null;
  const gradeInfo = hasScore ? getGradeLetter(student.overallScore) : { letter: "-", color: "text-gray-500 bg-gray-50 border-gray-200" };

  return (
    <div className="portal-card hover:border-brand-primary/50 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Top Header with Avatar & Rank */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-base">
              {sName.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-neutral leading-snug">{sName}</h3>
              <p className="text-xs font-mono font-medium text-brand-primary">{student.studentID}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-semibold text-brand-neutral-muted uppercase tracking-wider">Rank</span>
            <span className="inline-flex items-center gap-1 font-bold text-sm text-brand-secondary">
              <Award className="w-3.5 h-3.5" /> {student.rank ? `#${student.rank}` : '—'}
            </span>
          </div>
        </div>

        {/* Groups and Track Info */}
        <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Class Group</span>
            <span className="font-semibold text-brand-neutral">{student.classGroup || '—'}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Capstone Group</span>
            <span className="font-semibold text-brand-neutral">{student.capstoneGroup || '—'}</span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-2 mt-3 pt-3 border-t border-brand-neutral-border/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-brand-neutral-muted">Cumulative Score</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-brand-neutral">
                {hasScore ? `${student.overallScore}%` : '—'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${gradeInfo.color}`}>
                {gradeInfo.letter}
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-brand-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, Number(student.overallScore) || 0))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-brand-neutral-muted pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" /> Attendance:
            </span>
            <span className="font-semibold text-brand-neutral">
              {student.attendanceRate !== undefined && student.attendanceRate !== null ? `${student.attendanceRate}%` : '—'}
            </span>
          </div>
        </div>
      </div>


      {/* Action footer */}
      {onViewDetails && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onViewDetails(student)}
            className="w-full btn-outline text-xs py-2 justify-center hover:bg-brand-primary-light hover:text-brand-primary hover:border-brand-primary/30"
          >
            <span>View Full Performance</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
