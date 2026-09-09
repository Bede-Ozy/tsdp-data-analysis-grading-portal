import React, { useState, useEffect } from 'react';
import { getAllStudents, getStudentPerformance } from '../../services/api';
import { getGradeLetter } from '../../utils/constants';
import ScoreTable from '../../components/ScoreTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomSelect from '../../components/CustomSelect';
import { Users, Search, Filter, Eye, X, Award, Clock } from 'lucide-react';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPerf, setStudentPerf] = useState(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAllStudents();
        const list = Array.isArray(res) ? res : (res?.data || res?.students || []);
        if (list.length > 0) {
          setStudents(list);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    setLoadingPerf(true);
    try {
      const res = await getStudentPerformance(student.studentID);
      if (res && res.success) {
        setStudentPerf(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPerf(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading resident roster..." />;
  }

  const uniqueClassGroups = Array.from(new Set(students.map(s => s.classGroup).filter(Boolean)));
  const uniqueCapstoneGroups = Array.from(new Set(students.map(s => s.capstoneGroup).filter(Boolean)));

  const filtered = students.filter(s => {
    const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentID || '';
    const matchSearch = sName.toLowerCase().includes(search.toLowerCase()) ||
      (s.studentID && s.studentID.toLowerCase().includes(search.toLowerCase())) ||
      (s.studentNumber && String(s.studentNumber).includes(search));
    const matchGroup = groupFilter === 'All' || s.classGroup === groupFilter || s.capstoneGroup === groupFilter;
    return matchSearch && matchGroup;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Manage Residents (Students)</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Official roster of enrolled residents in the ITF-NECA-TSDP Data Analytics Cohort.
          </p>
        </div>
        <span className="badge-primary self-start sm:self-auto py-1 px-3">
          {filtered.length} Residents Found
        </span>
      </div>

      {/* Search and Filters */}
      <div className="portal-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, resident number (e.g. 001) or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          <div>
            <CustomSelect
              value={groupFilter}
              onChange={(val) => setGroupFilter(val)}
              placeholder="Filter by group..."
              options={[
                { value: 'All', label: 'All Groups' },
                ...uniqueClassGroups.map(g => ({ value: g, label: g, sublabel: 'Class Group' })),
                ...uniqueCapstoneGroups.map(g => ({ value: g, label: g, sublabel: 'Capstone Group' }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-brand-neutral-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-100/80 border-b border-brand-neutral-border text-xs uppercase text-brand-neutral-muted font-bold">
                <th className="py-3 px-4 w-16">#</th>
                <th className="py-3 px-4">Resident Student</th>
                <th className="py-3 px-4">Class Group</th>
                <th className="py-3 px-4">Capstone</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Attendance</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-brand-neutral-muted text-sm">
                    {students.length === 0 ? 'No resident records found in database.' : 'No residents match your search criteria.'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentID;
                  const hasScore = s.overallScore !== undefined && s.overallScore !== null;
                  const grade = hasScore ? getGradeLetter(s.overallScore) : { letter: "-", color: "text-gray-500 bg-gray-50 border-gray-200" };
                  return (
                    <tr key={s.studentID} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-brand-primary">
                        {s.studentNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-brand-neutral block">{sName}</span>
                        <span className="text-[11px] text-gray-400 font-mono">{s.studentID}{s.email ? ` · ${s.email}` : ''}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-brand-neutral">
                        {s.classGroup || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-brand-secondary">
                        {s.capstoneGroup || '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-brand-primary text-base">
                        {hasScore ? `${s.overallScore}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${grade.color}`}>
                          {grade.letter}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-normal text-xs text-slate-600">
                        {s.attendanceRate !== undefined && s.attendanceRate !== null ? `${s.attendanceRate}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleViewStudent(s)}
                          className="btn-outline py-1.5 px-3 text-xs font-medium hover:bg-brand-primary-light hover:text-brand-primary hover:border-brand-primary/30"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-brand-neutral-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge-primary">Resident Performance Profile</span>
                  <span className="text-xs text-brand-neutral-muted">TSDP 2026</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mt-1">{selectedStudent.name}</h2>
                <p className="text-xs font-mono text-brand-primary">
                  {selectedStudent.studentID} · {selectedStudent.email} · {selectedStudent.classGroup} · {selectedStudent.capstoneGroup}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-brand-neutral hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingPerf ? (
              <LoadingSpinner size="md" text="Loading performance records..." />
            ) : (
              <div className="space-y-5">
                <ScoreTable
                  breakdown={studentPerf?.breakdown}
                  totalScore={studentPerf?.overallScore || selectedStudent.overallScore}
                />

                {studentPerf?.attendanceHistory && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-brand-neutral">Recent Attendance Logs</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {studentPerf.attendanceHistory.map((att, i) => (
                        <div key={i} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="block font-bold">W{att.week} D{att.day} ({att.sessionType})</span>
                          <span className={`text-[10px] font-bold ${att.status === 'Present' ? 'text-brand-success' : 'text-amber-600'}`}>
                            {att.status} · {att.arrivalTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-brand-neutral-border pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="btn-primary py-2 px-5 text-xs font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
