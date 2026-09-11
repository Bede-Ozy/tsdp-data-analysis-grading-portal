import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentPerformance, getStudentAttendance } from '../../services/api';
import { getGradeLetter, PROGRAM_INFO } from '../../utils/constants';
import ScoreTable from '../../components/ScoreTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Award, Clock, Calendar, CheckCircle2, TrendingUp, AlertCircle, FileText } from 'lucide-react';

export default function ViewPerformance() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerformance() {
      try {
        const studentID = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${String(user.studentNumber).padStart(3, '0')}` : '');
        if (!studentID) {
          setLoading(false);
          return;
        }
        const [perfRes, attRes] = await Promise.all([
          getStudentPerformance(studentID).catch(err => null),
          getStudentAttendance(studentID).catch(err => null)
        ]);

        if (perfRes) {
          const pData = perfRes.data || (perfRes.studentID || perfRes.finalScore !== undefined || perfRes.overallScore !== undefined ? perfRes : null);
          setData(pData);
        }

        if (attRes) {
          const aData = attRes.data || (attRes.records || attRes.attendanceRate !== undefined ? attRes : null);
          setAttendanceData(aData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPerformance();
  }, [user]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading comprehensive performance records..." />;
  }

  const overallScore = data?.finalScore !== undefined && data?.finalScore !== null
    ? data.finalScore
    : (data?.overallScore !== undefined && data?.overallScore !== null
      ? data.overallScore
      : (user?.overallScore !== undefined && user?.overallScore !== null ? user.overallScore : null));

  const gradeLetter = data?.grade || (overallScore !== null ? getGradeLetter(overallScore).letter : '—');
  const gradeInfo = overallScore !== null
    ? getGradeLetter(overallScore)
    : { letter: gradeLetter, label: gradeLetter !== '—' ? 'Recorded' : 'Pending', color: 'text-gray-500 bg-gray-50 border-gray-200' };

  const rank = data?.rank || user?.rank || null;

  // Attendance Records & Counts
  const attendanceRecords = Array.isArray(attendanceData?.records)
    ? attendanceData.records
    : (Array.isArray(attendanceData)
      ? attendanceData
      : (Array.isArray(data?.attendanceHistory) ? data.attendanceHistory : []));

  const presentCount = attendanceData?.presentCount !== undefined && attendanceData?.presentCount !== null
    ? attendanceData.presentCount
    : attendanceRecords.filter(r => String(r.status || '').toLowerCase() === 'present').length;

  const lateCount = attendanceData?.lateCount !== undefined && attendanceData?.lateCount !== null
    ? attendanceData.lateCount
    : attendanceRecords.filter(r => String(r.status || '').toLowerCase() === 'late').length;

  const attendedCount = presentCount + lateCount;
  const totalDays = attendanceData?.totalDays !== undefined && attendanceData?.totalDays !== null
    ? attendanceData.totalDays
    : Math.max(attendanceRecords.length, attendedCount);
  const effectiveTotalDays = Math.max(totalDays, attendedCount);

  const overallAttendanceRate = effectiveTotalDays > 0
    ? Math.round((attendedCount / effectiveTotalDays) * 100)
    : (data?.attendanceRate !== undefined && data?.attendanceRate !== null ? data.attendanceRate : null);

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || data?.studentName || 'Resident Student';
  const studentID = data?.studentID || user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${user.studentNumber}` : '');
  const classGroup = user?.classGroup || data?.classGroup || '';
  const capstoneGroup = user?.capstoneGroup || data?.capstoneGroup || '';

  const formatAttendanceDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(val);
    }
  };

  const formatAttendanceTime = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="portal-card bg-gradient-to-br from-white to-brand-primary-light/40 border-brand-primary/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-primary">Official Academic Standing</span>
              <span className="text-xs text-brand-neutral-muted">TSDP Cohort 2026</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 mt-1">{displayName}</h1>
            <p className="text-xs font-mono font-medium text-brand-primary mt-0.5">
              {studentID || 'Student'}{classGroup ? ` · ${classGroup}` : ''}{capstoneGroup ? ` · ${capstoneGroup}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs min-w-[90px]">
              <span className="text-[10px] uppercase font-medium text-slate-400 block">Grade</span>
              <span className="text-2xl font-semibold text-brand-primary">{gradeInfo.letter}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs min-w-[90px]">
              <span className="text-[10px] uppercase font-medium text-slate-400 block">Rank</span>
              <span className="text-2xl font-semibold text-brand-secondary">{rank ? `#${rank}` : '—'}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs min-w-[100px]">
              <span className="text-[10px] uppercase font-medium text-slate-400 block">Aggregate</span>
              <span className="text-2xl font-semibold text-brand-success">{overallScore !== null ? `${overallScore}%` : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 9 Component Score Breakdown Table */}
      <ScoreTable performance={data} totalScore={overallScore} />

      {/* Attendance & Coach Feedback Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Records */}
        <div className="portal-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-primary" />
              <span>Attendance History</span>
            </h3>
            <span className="text-xs font-medium text-slate-500">
              Cumulative: <strong className="text-slate-800 font-semibold">{overallAttendanceRate !== null ? `${overallAttendanceRate}%` : '—'}</strong>
            </span>
          </div>

          <div className="space-y-2">
            {attendanceRecords.length > 0 ? (
              attendanceRecords.map((att, idx) => {
                const isPresent = String(att.status || '').toLowerCase() === 'present';
                const isLate = String(att.status || '').toLowerCase() === 'late';
                const dateFormatted = formatAttendanceDate(att.date || att.timestamp);
                const timeFormatted = formatAttendanceTime(att.date || att.timestamp);

                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/60 text-xs">
                    <div>
                      <div className="font-medium text-slate-800">
                        Week {att.weekNumber ?? att.week ?? '—'} · Day {att.dayNumber ?? att.day ?? '—'} ({att.sessionType || 'Physical'})
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {dateFormatted} {timeFormatted ? `at ${timeFormatted}` : ''}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-xs font-medium border ${
                      isPresent
                        ? 'bg-blue-50 text-brand-success border-blue-200'
                        : (isLate ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200')
                    }`}>
                      {att.status || 'Present'}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-brand-neutral-muted py-6 text-center">No attendance records found.</p>
            )}
          </div>
        </div>

        {/* Coach Evaluation Feedback */}
        <div className="portal-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-secondary" />
              <span>Coach Evaluation Feedback</span>
            </h3>
            <span className="badge-secondary text-[10px]">Verified</span>
          </div>

          <div className="space-y-3">
            {data?.recentFeedback && data.recentFeedback.length > 0 ? (
              data.recentFeedback.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-slate-800">{item.item}</span>
                    <span className="badge-primary font-mono text-xs">{item.score}</span>
                  </div>
                  <p className="text-xs text-brand-neutral-muted italic">"{item.note}"</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <span>Evaluator: {item.from}</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-brand-neutral-muted py-6 text-center">No coach feedback evaluations recorded yet.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
