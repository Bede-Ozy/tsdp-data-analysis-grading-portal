import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getEndOfProgrammeFeedbackList } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Award,
  Users,
  Shield,
  UserCheck,
  BarChart3,
  MessageSquare,
  Trophy,
  Medal,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

// Question Titles for Quantitative Charts
const QUANTITATIVE_QUESTIONS = [
  { key: 'q1_overallRating', title: 'Q1. Overall Experience Rating', isNumeric: false },
  { key: 'q2_expectationsMet', title: 'Q2. Expectations Met', isNumeric: false },
  { key: 'q3_organizationRating', title: 'Q3. Programme Structure & Organization', isNumeric: false },
  { key: 'q5_conceptsExplainedClearly', title: 'Q5. Concepts Explained Clearly & Step-by-Step (1-5)', isNumeric: true },
  { key: 'q6_exercisesHelpedApply', title: 'Q6. Practical Exercises Helped Apply Concepts (1-5)', isNumeric: true },
  { key: 'q7_receivedAdequateGuidance', title: 'Q7. Received Adequate Guidance When Stuck (1-5)', isNumeric: true },
  { key: 'q8_feedbackHelpedImprove', title: 'Q8. Feedback Helped Me Learn & Improve (1-5)', isNumeric: true },
  { key: 'q9_structurePaceSupported', title: 'Q9. Structure & Pace Supported Progress (1-5)', isNumeric: true },
  { key: 'q11_attendedConsistently', title: 'Q11. Attended Classes Consistently & On Time (1-5)', isNumeric: true },
  { key: 'q12_dedicatedSufficientTime', title: 'Q12. Dedicated Sufficient Time Outside Class (1-5)', isNumeric: true },
  { key: 'q13_tookResponsibilityDifficulties', title: 'Q13. Took Responsibility for Learning Difficulties (1-5)', isNumeric: true },
  { key: 'q14_collaboratedEffectively', title: 'Q14. Collaborated Effectively With Peers (1-5)', isNumeric: true },
  { key: 'q17_realWorldPreparedness', title: 'Q17. Preparedness for Real-World Tasks', isNumeric: false },
  { key: 'q18_areaNeedingMostSupport', title: 'Q18. Area Needing Most Support Going Forward', isNumeric: false },
];

const SKILL_GRID_KEYS = [
  { id: 'excel', label: 'Excel for Data Analysis' },
  { id: 'sql', label: 'SQL Querying & Analysis' },
  { id: 'powerBi', label: 'Power BI Modeling & Viz' },
  { id: 'breakdown', label: 'Business Problem Breakdown' },
  { id: 'communication', label: 'Insight Communication' },
  { id: 'independent', label: 'Independent Practical Work' },
];

const TEXT_QUESTIONS = [
  { key: 'q4_mostValuableAspect', title: 'Most Valuable Aspect & Why' },
  { key: 'q10_teamImprovementSuggestions', title: 'Team Improvement Suggestions' },
  { key: 'q15_oneThingDoneDifferently', title: 'One Thing Done Differently' },
  { key: 'q19_biggestChallengeFaced', title: 'Biggest Challenge Faced & Impact' },
  { key: 'q20_oneChangeForFutureStudents', title: 'One Change to Make More Effective' },
  { key: 'q21_greatestStrengthsAndImprovements', title: 'Greatest Strengths & Areas to Improve' },
  { key: 'q18_areaNeedingMostSupportOther', title: 'Other Area Needing Support', checkHasValue: true },
];

const LIKERT_ORDER = ['1', '2', '3', '4', '5'];
const DELTA_ORDER = ['Much lower', 'Slightly lower', 'About the same', 'Slightly higher', 'Much higher'];

export default function EndOfProgrammeFeedbackDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState([]);
  const [error, setError] = useState(null);

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEndOfProgrammeFeedbackList();
      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.data)) {
        list = res.data;
      }
      setFeedbackList(list);
    } catch (err) {
      console.error('Failed to load feedback list:', err);
      setError('Unable to load feedback data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    const total = feedbackList.length;
    const anon = feedbackList.filter(f => f.isAnonymous === true).length;
    const nonAnon = total - anon;
    return { total, anon, nonAnon };
  }, [feedbackList]);

  // Compute Distribution for Quantitative Questions
  const computeDistribution = (key, isNumeric = false) => {
    const counts = {};
    let totalValid = 0;

    feedbackList.forEach(item => {
      let val = item[key];
      if (val === undefined || val === null || val === '') return;
      val = String(val).trim();
      counts[val] = (counts[val] || 0) + 1;
      totalValid++;
    });

    let entries = Object.entries(counts);

    if (isNumeric) {
      entries.sort(([a], [b]) => Number(a) - Number(b));
    } else {
      // Check if it follows known Likert scale
      const allLikert = entries.every(([k]) => LIKERT_ORDER.includes(k));
      if (allLikert) {
        entries.sort(([a], [b]) => Number(a) - Number(b));
      } else {
        // Sort descending by count
        entries.sort((a, b) => b[1] - a[1]);
      }
    }

    return { entries, totalValid };
  };

  // Compute Distribution for Skill Grid
  const computeSkillDistribution = (skillId) => {
    const counts = {};
    let totalValid = 0;

    feedbackList.forEach(item => {
      const grid = item.q16_skillsGrid;
      if (!grid) return;
      let val = grid[skillId];
      if (val === undefined || val === null || val === '') return;
      val = String(val).trim();
      counts[val] = (counts[val] || 0) + 1;
      totalValid++;
    });

    let entries = Object.entries(counts);
    // Sort according to DELTA_ORDER if present, else by count
    entries.sort((a, b) => {
      const idxA = DELTA_ORDER.indexOf(a[0]);
      const idxB = DELTA_ORDER.indexOf(b[0]);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return b[1] - a[1];
    });

    return { entries, totalValid };
  };

  // Compute Nominations Tallies
  const nominations = useMemo(() => {
    const tally = (key) => {
      const map = {};
      feedbackList.forEach(item => {
        let name = item[key];
        if (!name || typeof name !== 'string') return;
        name = name.trim();
        if (name && name !== 'N/A' && name !== 'None' && name !== '-') {
          map[name] = (map[name] || 0) + 1;
        }
      });
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };

    return {
      bestStudent: tally('q22_bestStudent'),
      bestBehaved: tally('q23_bestBehavedStudent'),
    };
  }, [feedbackList]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading end-of-programme feedback data..." />;
  }

  if (feedbackList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-brand-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">End-of-Programme Feedback</h2>
        <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
          No responses yet. Feedback will appear here once students submit.
        </p>
        <button
          onClick={fetchFeedback}
          className="btn-secondary py-2 px-4 text-xs font-semibold inline-flex items-center gap-2 mt-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="portal-card bg-gradient-to-r from-brand-primary via-brand-primary-dark to-[#002B54] text-white p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-200 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <Award className="w-3.5 h-3.5 text-brand-secondary" />
              <span>Programme Evaluation & Cohort Nominations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              End-of-Programme Feedback Dashboard
            </h1>
            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
              Consolidated evaluation analytics, rating distributions, detailed student text responses, and class award nominations.
            </p>
          </div>

          <button
            onClick={fetchFeedback}
            className="btn-secondary py-2 px-4 text-xs font-bold inline-flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* SECTION A: Response Summary (Top KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="portal-card flex items-center gap-4 border-l-4 border-l-brand-primary">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Responses</p>
            <h3 className="text-2xl font-bold text-slate-800">{summary.total}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Submitted evaluations</p>
          </div>
        </div>

        <div className="portal-card flex items-center gap-4 border-l-4 border-l-slate-400">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Anonymous Responses</p>
            <h3 className="text-2xl font-bold text-slate-800">{summary.anon}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {summary.total > 0 ? `${Math.round((summary.anon / summary.total) * 100)}% of responses` : '—'}
            </p>
          </div>
        </div>

        <div className="portal-card flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Non-Anonymous</p>
            <h3 className="text-2xl font-bold text-slate-800">{summary.nonAnon}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {summary.total > 0 ? `${Math.round((summary.nonAnon / summary.total) * 100)}% with student ID` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION B: Quantitative Results (Horizontal Bar Charts) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <BarChart3 className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-bold text-slate-800">Quantitative Results & Rating Distributions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUANTITATIVE_QUESTIONS.map(q => {
            const { entries, totalValid } = computeDistribution(q.key, q.isNumeric);
            const maxVal = entries.length > 0 ? Math.max(...entries.map(e => e[1])) : 1;

            return (
              <div key={q.key} className="portal-card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-800 leading-snug">{q.title}</h3>
                  <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-full">
                    {totalValid} responses
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {entries.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No answered values</p>
                  ) : (
                    entries.map(([label, count]) => {
                      const pct = totalValid > 0 ? Math.round((count / totalValid) * 100) : 0;
                      const barWidth = maxVal > 0 ? Math.max(6, Math.round((count / maxVal) * 100)) : 0;

                      return (
                        <div key={label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700 truncate max-w-[70%]" title={label}>
                              {label}
                            </span>
                            <span className="text-slate-500 font-semibold font-mono text-[11px]">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-primary rounded-full transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Special: q16_skillsGrid (2x3 Mini Grid) */}
        <div className="portal-card space-y-4 mt-6">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Q16. Practical Skills Gained vs. Expectations (Skills Grid)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution of comparative skill growth across core competencies
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILL_GRID_KEYS.map(skill => {
              const { entries, totalValid } = computeSkillDistribution(skill.id);
              const maxVal = entries.length > 0 ? Math.max(...entries.map(e => e[1])) : 1;

              return (
                <div key={skill.id} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-800 truncate" title={skill.label}>
                      {skill.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{totalValid}</span>
                  </div>

                  <div className="space-y-1.5">
                    {entries.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No responses recorded</p>
                    ) : (
                      entries.map(([label, count]) => {
                        const pct = totalValid > 0 ? Math.round((count / totalValid) * 100) : 0;
                        const barWidth = maxVal > 0 ? Math.max(6, Math.round((count / maxVal) * 100)) : 0;

                        return (
                          <div key={label} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-600 truncate max-w-[65%]" title={label}>{label}</span>
                              <span className="font-mono text-slate-700 font-semibold">{count}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-secondary rounded-full transition-all duration-300"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION C: Text Responses (Cards) */}
      <div className="space-y-8">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <MessageSquare className="w-5 h-5 text-brand-primary" />
          <h2 className="text-lg font-bold text-slate-800">Student Qualitative Feedback & Text Reflections</h2>
        </div>

        {TEXT_QUESTIONS.map(tq => {
          const matchingResponses = feedbackList.filter(item => {
            const val = item[tq.key];
            return val !== undefined && val !== null && String(val).trim().length > 0;
          });

          if (tq.checkHasValue && matchingResponses.length === 0) {
            return null; // Don't render section if empty
          }

          return (
            <div key={tq.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-secondary" />
                  <span>{tq.title}</span>
                </h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {matchingResponses.length} response{matchingResponses.length === 1 ? '' : 's'}
                </span>
              </div>

              {matchingResponses.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic bg-white">
                  No text feedback submitted for this question.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {matchingResponses.map((item, idx) => {
                    const isAnon = item.isAnonymous === true;
                    const displayName = isAnon ? 'Anonymous' : (item.studentName || 'Resident Student');
                    const displayID = !isAnon && (item.studentID || item.studentNumber);
                    const classGroup = item.classGroup || 'Insight Makers';
                    const answerText = String(item[tq.key]).trim();

                    return (
                      <div
                        key={item.id || idx}
                        className="portal-card p-4 flex flex-col justify-between space-y-3 bg-white hover:border-brand-primary/40 transition-colors shadow-2xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className={`text-xs font-bold truncate ${isAnon ? 'italic text-slate-400' : 'text-slate-800'}`}>
                                {displayName}
                              </h4>
                              {displayID && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{displayID}</p>
                              )}
                            </div>
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-brand-primary border border-blue-100 flex-shrink-0">
                              {classGroup}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            "{answerText}"
                          </p>
                        </div>

                        {item.submittedAt && (
                          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-right">
                            {new Date(item.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SECTION D: Student Nominations (Tally) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-800">Resident Class Peer Nominations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Student Card */}
          <div className="portal-card space-y-4 bg-gradient-to-br from-white to-amber-50/20 border-amber-200/80">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg shadow-xs">
                  🏆
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Best Student</h3>
                  <p className="text-xs text-slate-500">Peer votes for overall outstanding technical & analytical performance</p>
                </div>
              </div>
              <span className="badge-secondary text-xs font-bold">
                {nominations.bestStudent.reduce((sum, n) => sum + n[1], 0)} Votes
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {nominations.bestStudent.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No nominations recorded yet</p>
              ) : (
                nominations.bestStudent.map(([name, votes], idx) => {
                  const isTop = idx === 0;
                  return (
                    <div
                      key={name}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isTop
                          ? 'bg-amber-50/80 border-amber-200 font-bold text-amber-950'
                          : 'bg-white border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isTop ? 'bg-amber-400 text-white shadow-2xs' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs truncate">{name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold flex-shrink-0 ${
                        isTop ? 'bg-amber-200/80 text-amber-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {votes} {votes === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Best-Behaved Student Card */}
          <div className="portal-card space-y-4 bg-gradient-to-br from-white to-blue-50/20 border-blue-200/80">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-primary flex items-center justify-center text-lg shadow-xs">
                  🎖️
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Best-Behaved Student</h3>
                  <p className="text-xs text-slate-500">Peer votes for professionalism, punctuality & positive collaboration</p>
                </div>
              </div>
              <span className="badge-primary text-xs font-bold">
                {nominations.bestBehaved.reduce((sum, n) => sum + n[1], 0)} Votes
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {nominations.bestBehaved.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No nominations recorded yet</p>
              ) : (
                nominations.bestBehaved.map(([name, votes], idx) => {
                  const isTop = idx === 0;
                  return (
                    <div
                      key={name}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isTop
                          ? 'bg-blue-50/80 border-blue-200 font-bold text-blue-950'
                          : 'bg-white border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isTop ? 'bg-brand-primary text-white shadow-2xs' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs truncate">{name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold flex-shrink-0 ${
                        isTop ? 'bg-blue-200/80 text-blue-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {votes} {votes === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

