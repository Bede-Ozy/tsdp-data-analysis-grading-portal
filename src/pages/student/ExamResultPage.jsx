import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getExamResult, getAllExamResults } from '../../services/api';
import { CheckCircle2, XCircle, Trophy, AlertTriangle, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-react';

export default function ExamResultPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const autoSubmitted = location.state?.autoSubmitted || false;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let aID = location.state?.attemptID;
        // Try direct result from state first
        if (location.state?.result?.success) {
          setResult(location.state.result);
          setLoading(false);
          return;
        }
        // Fetch by attemptID
        if (!aID) {
          // Find from all results
          const all = await getAllExamResults();
          const studentID = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${String(user.studentNumber).padStart(3,'0')}` : '');
          const row = Array.isArray(all)
            ? all.find(r => r.studentID === studentID || r.studentNumber === user?.studentNumber)
            : null;
          if (row) aID = row.attemptID;
        }
        if (!aID) {
          setError('No exam result found. You may not have taken the exam yet.');
          setLoading(false);
          return;
        }
        const res = await getExamResult(aID);
        if (!cancelled) {
          if (res?.success === false) {
            setError(res.message || 'Failed to load result.');
          } else {
            setResult(res);
          }
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) { setError('Failed to load result.'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [location.state, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-brand-neutral-muted">Loading your results…</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="portal-card text-center space-y-4 max-w-md">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto" />
          <p className="font-semibold text-slate-800">{error || 'No result available.'}</p>
          <button onClick={() => navigate('/student/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const score = result.scorePercent ?? result.scoreRaw ?? 0;
  const correct = result.questionsCorrect ?? 0;
  const total = result.questionsTotal ?? 70;
  const passed = score >= 70;
  const breakdown = Array.isArray(result.breakdown) ? result.breakdown : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Score hero */}
      <div className={`rounded-2xl p-8 text-white text-center shadow-md ${
        passed
          ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
          : 'bg-gradient-to-br from-red-600 to-rose-700'
      }`}>
        {autoSubmitted && (
          <div className="inline-flex items-center gap-1.5 text-xs bg-white/20 border border-white/30 rounded-full px-3 py-1 mb-4">
            <AlertTriangle className="w-3.5 h-3.5" />
            Auto-submitted at time limit
          </div>
        )}
        <div className="text-6xl font-extrabold mb-2">{Math.round(score)}%</div>
        <p className="text-lg font-semibold opacity-90">{correct} / {total} correct</p>
        <div className={`mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm border-2 ${
          passed ? 'bg-white/20 border-white/40 text-white' : 'bg-white/20 border-white/40 text-white'
        }`}>
          {passed ? <><Trophy className="w-4 h-4 text-yellow-300" /> PASSED</> : <><XCircle className="w-4 h-4" /> NOT PASSED</>}
        </div>
        <p className="mt-3 text-sm opacity-75">Pass mark: 70% · Final Technical Exam</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => navigate('/student/dashboard')} className="btn-primary flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      {/* Breakdown table */}
      {breakdown.length > 0 && (
        <div className="portal-card">
          <h2 className="text-base font-bold text-slate-800 mb-4">Question Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-2 px-3 text-left">#</th>
                  <th className="py-2 px-3 text-center">Your Answer</th>
                  <th className="py-2 px-3 text-center">Correct</th>
                  <th className="py-2 px-3 text-center">Result</th>
                  <th className="py-2 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item, idx) => {
                  const isCorrect = item.isCorrect ?? (item.yourAnswer === item.correctAnswer);
                  const expanded = expandedRow === idx;
                  return (
                    <React.Fragment key={idx}>
                      <tr
                        className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                          isCorrect ? 'bg-emerald-50/30' : 'bg-red-50/30'
                        }`}
                        onClick={() => setExpandedRow(expanded ? null : idx)}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-xs">{item.questionNumber ?? idx + 1}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-slate-700">{item.yourAnswer || '—'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-emerald-700">{item.correctAnswer || '—'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isCorrect
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            : <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                          }
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 ml-auto" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />}
                        </td>
                      </tr>
                      {expanded && (
                        <tr className={isCorrect ? 'bg-emerald-50/60' : 'bg-red-50/60'}>
                          <td colSpan={5} className="px-4 pb-4 pt-2">
                            <p className="text-sm font-medium text-slate-800 mb-2">{item.questionText || `Question ${item.questionNumber}`}</p>
                            {['A','B','C','D'].map(letter => {
                              const optKey = `option${letter}`;
                              const optText = item[optKey];
                              if (!optText) return null;
                              const isYours = item.yourAnswer === letter;
                              const isRight = item.correctAnswer === letter;
                              return (
                                <div key={letter} className={`flex items-start gap-2 text-xs mb-1 px-2 py-1.5 rounded-lg ${
                                  isRight ? 'bg-emerald-100 text-emerald-800 font-semibold' :
                                  isYours && !isRight ? 'bg-red-100 text-red-800 font-semibold' :
                                  'text-slate-600'
                                }`}>
                                  <span className="font-bold w-5 flex-shrink-0">{letter})</span>
                                  <span>{optText}</span>
                                  {isRight && <span className="ml-auto text-emerald-700 font-bold">✓ Correct</span>}
                                  {isYours && !isRight && <span className="ml-auto text-red-600 font-bold">✗ Your answer</span>}
                                </div>
                              );
                            })}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {breakdown.length === 0 && (
        <div className="portal-card text-center text-sm text-slate-500 py-8">
          Detailed breakdown not available from backend.
        </div>
      )}
    </div>
  );
}

