import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllStudents,
  getAllSoftSkillsEvaluations,
  saveSoftSkillsEvaluations,
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Smile,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Search,
  Sparkles,
} from 'lucide-react';

const CRITERIA = [
  { key: 'communicationScore', label: 'Communication' },
  { key: 'teamworkScore', label: 'Teamwork' },
  { key: 'leadershipScore', label: 'Leadership' },
  { key: 'professionalismScore', label: 'Professionalism' },
  { key: 'problemSolvingScore', label: 'Problem Solving' },
  { key: 'emotionalIntelligenceScore', label: 'Emotional Intelligence' },
];

export default function SoftSkillsEvaluation() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [evalMap, setEvalMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [searchTerm, setSearchTerm] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, evalsRes] = await Promise.all([
        getAllStudents().catch(() => ({ data: [] })),
        getAllSoftSkillsEvaluations().catch(() => []),
      ]);

      const stuList = Array.isArray(studentsRes)
        ? studentsRes
        : (studentsRes?.data || studentsRes?.students || []);
      setStudents(stuList);

      const rawEvals = Array.isArray(evalsRes)
        ? evalsRes
        : (evalsRes?.data || evalsRes?.evaluations || []);

      const map = {};
      rawEvals.forEach((item) => {
        const id = item.studentID || item.studentNumber;
        if (!id) return;

        const parseScore = (val) => {
          if (val === '' || val === null || val === undefined) return '';
          const num = Number(val);
          return isNaN(num) ? '' : num;
        };

        map[String(id).trim()] = {
          communicationScore: parseScore(item.communicationScore ?? item.communication),
          teamworkScore: parseScore(item.teamworkScore ?? item.teamwork),
          leadershipScore: parseScore(item.leadershipScore ?? item.leadership),
          professionalismScore: parseScore(item.professionalismScore ?? item.professionalism),
          problemSolvingScore: parseScore(item.problemSolvingScore ?? item.problemSolving),
          emotionalIntelligenceScore: parseScore(item.emotionalIntelligenceScore ?? item.emotionalIntelligence),
          comments: item.comments || item.notes || '',
        };
      });

      setEvalMap(map);
    } catch (err) {
      console.error('Failed to load soft skills evaluations:', err);
      setError('Failed to load students and evaluation records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScoreChange = (studentID, field, val) => {
    let cleanVal = '';
    if (val !== '') {
      const num = Number(val);
      if (!isNaN(num)) {
        if (num < 1) cleanVal = 1;
        else if (num > 5) cleanVal = 5;
        else cleanVal = num;
      }
    }

    setEvalMap((prev) => {
      const current = prev[studentID] || {
        communicationScore: '',
        teamworkScore: '',
        leadershipScore: '',
        professionalismScore: '',
        problemSolvingScore: '',
        emotionalIntelligenceScore: '',
        comments: '',
      };
      return {
        ...prev,
        [studentID]: {
          ...current,
          [field]: cleanVal,
        },
      };
    });
  };

  const handleCommentsChange = (studentID, val) => {
    setEvalMap((prev) => {
      const current = prev[studentID] || {
        communicationScore: '',
        teamworkScore: '',
        leadershipScore: '',
        professionalismScore: '',
        problemSolvingScore: '',
        emotionalIntelligenceScore: '',
        comments: '',
      };
      return {
        ...prev,
        [studentID]: {
          ...current,
          comments: val,
        },
      };
    });
  };

  const getRowStatus = (entry) => {
    if (!entry) return 'Unstarted';
    const filledCount = CRITERIA.filter((c) => {
      const val = entry[c.key];
      return val !== '' && val !== null && val !== undefined && !isNaN(Number(val));
    }).length;

    if (filledCount === 6) return 'Complete';
    if (filledCount > 0 || (entry.comments && entry.comments.trim())) return 'Incomplete';
    return 'Unstarted';
  };

  const evaluatedCount = useMemo(() => {
    return students.filter((stu) => {
      const id = String(stu.studentID || stu.id || stu.studentNumber).trim();
      const entry = evalMap[id];
      return getRowStatus(entry) === 'Complete';
    }).length;
  }, [students, evalMap]);

  const handleSaveAll = async () => {
    setError(null);
    setSaving(true);

    try {
      const coachID = user?.coachID || user?.id || user?.coachNumber || '';
      const payloadArray = [];

      students.forEach((stu) => {
        const id = String(stu.studentID || stu.id || stu.studentNumber).trim();
        const entry = evalMap[id];
        if (!entry) return;

        const hasAnyScore = CRITERIA.some((c) => {
          const val = entry[c.key];
          return val !== '' && val !== null && val !== undefined && !isNaN(Number(val));
        });
        const hasComment = entry.comments && entry.comments.trim().length > 0;

        if (hasAnyScore || hasComment) {
          payloadArray.push({
            studentID: id,
            communicationScore: entry.communicationScore !== '' ? Number(entry.communicationScore) : 0,
            teamworkScore: entry.teamworkScore !== '' ? Number(entry.teamworkScore) : 0,
            leadershipScore: entry.leadershipScore !== '' ? Number(entry.leadershipScore) : 0,
            professionalismScore: entry.professionalismScore !== '' ? Number(entry.professionalismScore) : 0,
            problemSolvingScore: entry.problemSolvingScore !== '' ? Number(entry.problemSolvingScore) : 0,
            emotionalIntelligenceScore: entry.emotionalIntelligenceScore !== '' ? Number(entry.emotionalIntelligenceScore) : 0,
            comments: entry.comments || '',
          });
        }
      });

      if (payloadArray.length === 0) {
        showToast('No scores or comments entered to save.');
        setSaving(false);
        return;
      }

      const res = await saveSoftSkillsEvaluations(payloadArray, coachID);
      if (res && res.success !== false) {
        showToast(`✓ ${payloadArray.length} evaluation${payloadArray.length > 1 ? 's' : ''} saved successfully!`);
        await loadData();
      } else {
        setError(res?.message || 'Failed to save soft skills evaluations.');
      }
    } catch (err) {
      console.error('Error saving soft skills evaluations:', err);
      setError('Connection error occurred while saving evaluations.');
    } finally {
      setSaving(false);
    }
  };

  const processedStudents = useMemo(() => {
    let list = [...students];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((s) => {
        const name = (s.name || s.studentName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
        const id = String(s.studentID || s.studentNumber || '').toLowerCase();
        return name.includes(term) || id.includes(term);
      });
    }

    list.sort((a, b) => {
      const nameA = (a.name || a.studentName || `${a.firstName || ''} ${a.lastName || ''}`).trim();
      const nameB = (b.name || b.studentName || `${b.firstName || ''} ${b.lastName || ''}`).trim();
      return sortOrder === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

    return list;
  }, [students, sortOrder, searchTerm]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading resident roster and evaluation records..." />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white font-medium text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="portal-card bg-gradient-to-r from-brand-primary via-brand-primary-dark to-[#002B54] text-white p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-200 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <Smile className="w-3.5 h-3.5 text-brand-secondary" />
              <span>Cohort Soft Skills & Professional Competency</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Soft Skills Evaluation — Final Assessment
            </h1>
            <p className="text-sm text-blue-100 font-normal leading-relaxed">
              Enter each resident's overall soft skills scores. Each criterion is 1-5. You can update these at any time before final submission.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Progress Badge */}
            <div className="px-4 py-2.5 rounded-xl bg-white/15 border border-white/20 backdrop-blur-xs text-white text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-secondary" />
              <span>
                <strong className="text-brand-secondary text-sm font-bold">{evaluatedCount}</strong> of{' '}
                <strong className="text-sm font-bold">{students.length}</strong> evaluated
              </span>
            </div>

            {/* Save All Button */}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="btn-secondary py-2.5 px-5 font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Saving...' : 'Save All Evaluations'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Table & Controls Container */}
      <div className="portal-card space-y-4">
        {/* Table Top Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resident..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-52 sm:w-64"
              />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
              title="Toggle sort direction by resident name"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Name: {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] bg-slate-50/70">
                <th className="py-3 px-3 min-w-[180px]">Student</th>
                <th className="py-3 px-2 text-center w-24">Communication</th>
                <th className="py-3 px-2 text-center w-24">Teamwork</th>
                <th className="py-3 px-2 text-center w-24">Leadership</th>
                <th className="py-3 px-2 text-center w-24">Professionalism</th>
                <th className="py-3 px-2 text-center w-24">Problem Solving</th>
                <th className="py-3 px-2 text-center w-24">Emotional Int.</th>
                <th className="py-3 px-3 min-w-[200px]">Comments</th>
                <th className="py-3 px-3 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No residents matching search.
                  </td>
                </tr>
              ) : (
                processedStudents.map((stu) => {
                  const id = String(stu.studentID || stu.id || stu.studentNumber).trim();
                  const name = stu.name || stu.studentName || `${stu.firstName || ''} ${stu.lastName || ''}`.trim() || id;
                  const entry = evalMap[id] || {};
                  const status = getRowStatus(entry);

                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student Info */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 text-xs">{name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{id}</div>
                      </td>

                      {/* 6 Criteria Number Inputs */}
                      {CRITERIA.map((crit) => {
                        const val = entry[crit.key] ?? '';
                        return (
                          <td key={crit.key} className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.5"
                              value={val}
                              onChange={(e) => handleScoreChange(id, crit.key, e.target.value)}
                              placeholder="1-5"
                              className="w-16 px-1.5 py-1 text-center font-bold text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
                            />
                          </td>
                        );
                      })}

                      {/* Comments Input */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={entry.comments || ''}
                          onChange={(e) => handleCommentsChange(id, e.target.value)}
                          placeholder="Optional observations..."
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white text-slate-700"
                        />
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-3 text-center">
                        {status === 'Complete' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Complete</span>
                          </span>
                        )}
                        {status === 'Incomplete' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Incomplete</span>
                          </span>
                        )}
                        {status === 'Unstarted' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Unstarted
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet Stacked Cards View */}
        <div className="lg:hidden space-y-4">
          {processedStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No residents matching search.
            </div>
          ) : (
            processedStudents.map((stu) => {
              const id = String(stu.studentID || stu.id || stu.studentNumber).trim();
              const name = stu.name || stu.studentName || `${stu.firstName || ''} ${stu.lastName || ''}`.trim() || id;
              const entry = evalMap[id] || {};
              const status = getRowStatus(entry);

              return (
                <div key={id} className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">{name}</h3>
                      <p className="text-[11px] font-mono text-slate-400">{id}</p>
                    </div>
                    <div>
                      {status === 'Complete' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Complete</span>
                        </span>
                      )}
                      {status === 'Incomplete' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Incomplete</span>
                        </span>
                      )}
                      {status === 'Unstarted' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                          Unstarted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {CRITERIA.map((crit) => {
                      const val = entry[crit.key] ?? '';
                      return (
                        <div key={crit.key} className="bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                          <label className="text-[10px] font-semibold text-slate-500 block truncate mb-1">
                            {crit.label}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.5"
                            value={val}
                            onChange={(e) => handleScoreChange(id, crit.key, e.target.value)}
                            placeholder="1-5"
                            className="w-full px-2 py-1 text-center font-bold text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Comments</label>
                    <input
                      type="text"
                      value={entry.comments || ''}
                      onChange={(e) => handleCommentsChange(id, e.target.value)}
                      placeholder="Optional observations..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white text-slate-700"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Scoring scale: <strong>1.0 (Developing)</strong> to <strong>5.0 (Role Model)</strong>. Half points (e.g. 3.5, 4.5) accepted.
          </span>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-primary py-2 px-5 font-bold flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving...' : 'Save All Evaluations'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
