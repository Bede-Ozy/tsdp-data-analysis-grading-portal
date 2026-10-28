import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getExamConfig,
  startExamAttempt,
  saveExamAnswer,
  submitExamAttempt,
} from '../../services/api';
import { seededShuffle } from '../../utils/seededShuffle';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Send, CheckCircle2 } from 'lucide-react';

const MODULE_COLORS = {
  Excel: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  SQL: 'bg-blue-100 text-blue-800 border-blue-200',
  PowerBI: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

function formatTime(seconds) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export default function ExamPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attemptID, setAttemptID] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);
  const submitted = useRef(false);

  const doSubmit = useCallback(async (auto = false) => {
    if (submitted.current) return;
    submitted.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await submitExamAttempt(attemptID);
      navigate('/student/exam/result', {
        state: { attemptID, autoSubmitted: auto, result: res },
        replace: true,
      });
    } catch {
      navigate('/student/exam/result', {
        state: { attemptID, autoSubmitted: auto },
        replace: true,
      });
    }
  }, [attemptID, navigate]);

  // Navigation guard
  useEffect(() => {
    const handler = (e) => {
      if (submitted.current) return;
      e.preventDefault();
      e.returnValue = 'Your answers are auto-saved, but you must return to complete the exam. Leave anyway?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await getExamConfig();
        if (!cfg || cfg.isActive !== true) {
          navigate('/student/dashboard', { replace: true });
          return;
        }
        const studentNumber = user?.studentNumber || user?.studentID || '';
        const res = await startExamAttempt(studentNumber);
        if (cancelled) return;
        if (!res || res.success === false) {
          if (res?.message?.toLowerCase().includes('already submitted') || res?.status === 'Submitted') {
            navigate('/student/exam/result', { state: { attemptID: res?.attemptID }, replace: true });
            return;
          }
          setError(res?.message || 'Failed to start exam.');
          setLoading(false);
          return;
        }
        setAttemptID(res.attemptID);
        const allQuestions = Array.isArray(res.questions) ? res.questions : [];
        const selected70 = seededShuffle(allQuestions, res.attemptID).slice(0, 70);
        setQuestions(selected70);
        const initialAnswers = {};
        if (res.resumed && Array.isArray(res.answers)) {
          res.answers.forEach(a => {
            if (a.questionNumber && a.answer) {
              initialAnswers[a.questionNumber] = a.answer;
            }
          });
        }
        setAnswers(initialAnswers);
        const remaining = res.remainingSeconds ?? (45 * 60);
        setTimeLeft(remaining);
        setLoading(false);
      } catch (e) {
        if (!cancelled) { setError('Failed to load exam. Please refresh.'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [user, navigate]);

  // Timer
  useEffect(() => {
    if (loading || !attemptID || submitted.current) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          doSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, attemptID, doSubmit]);

  const handleSelect = (questionNumber, option) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: option }));
    // Fire and forget
    if (attemptID) saveExamAnswer(attemptID, questionNumber, option).catch(() => {});
  };

  const totalCount = Math.min(questions.length, 70);
  const activeQuestionNumberSet = new Set(questions.map(q => q.questionNumber));
  const answeredCount = Object.keys(answers).filter(qNum => activeQuestionNumberSet.has(Number(qNum))).length;
  const currentQ = questions[currentIndex];
  const isRed = timeLeft < 5 * 60;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-brand-neutral-muted font-medium">Loading exam…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="portal-card text-center space-y-4 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="font-semibold text-slate-800">{error}</p>
          <button onClick={() => navigate('/student/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky top bar */}
      <div className="sticky top-16 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-slate-700">
            Question {currentIndex + 1} of {totalCount}
          </span>
          <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-1.5 rounded-lg border ${
            isRed ? 'text-red-600 bg-red-50 border-red-200 animate-pulse' : 'text-slate-800 bg-slate-100 border-slate-200'
          }`}>
            <Clock className={`w-4 h-4 ${isRed ? 'text-red-500' : 'text-slate-500'}`} />
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="btn-primary py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            Submit Exam
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 pb-2">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Answered: <strong className="text-brand-primary">{answeredCount}</strong> / {totalCount}</span>
            <span>{Math.round((answeredCount / Math.max(totalCount, 1)) * 100)}% complete</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / Math.max(totalCount, 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {currentQ && (
          <div className="portal-card space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Q{currentIndex + 1}
                  </span>
                  {currentQ.module && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${MODULE_COLORS[currentQ.module] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {currentQ.module}
                    </span>
                  )}
                </div>
              </div>
              {answers[currentQ.questionNumber] && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                </span>
              )}
            </div>

            <p className="text-base font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
              {currentQ.questionText}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map(letter => {
                const optKey = `option${letter}`;
                const optText = currentQ[optKey];
                if (!optText) return null;
                const selected = answers[currentQ.questionNumber] === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => handleSelect(currentQ.questionNumber, letter)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-start gap-3 group ${
                      selected
                        ? 'border-brand-primary bg-brand-primary-light/40 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-brand-primary/50 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                      selected ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-brand-primary/10 group-hover:text-brand-primary'
                    }`}>
                      {letter}
                    </span>
                    <span className={`text-sm leading-relaxed ${selected ? 'text-brand-primary font-medium' : 'text-slate-700'}`}>
                      {optText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {/* Mini question grid */}
              <div className="hidden sm:flex items-center gap-1 flex-wrap max-w-xs justify-center">
                {questions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    title={`Q${idx + 1}${answers[q.questionNumber] ? ' ✓' : ''}`}
                    className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                      idx === currentIndex
                        ? 'bg-brand-primary text-white'
                        : answers[q.questionNumber]
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submit confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Submit Exam?</h3>
            </div>
            <p className="text-sm text-slate-600">
              You have answered <strong>{answeredCount}</strong> of <strong>{totalCount}</strong> questions.
              <br /><br />
              <strong>You cannot change answers after submitting.</strong> This action is final.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Continue Exam
              </button>
              <button
                onClick={() => { setShowConfirm(false); doSubmit(false); }}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary-dark transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

