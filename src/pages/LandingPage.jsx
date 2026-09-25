import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PROGRAM_INFO, GRADING_WEIGHTS, MODULES } from '../utils/constants';
import {
  GraduationCap,
  Award,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Database,
  FileSpreadsheet,
  BarChart3,
  Terminal,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  Layers,
  TrendingUp,
  Briefcase,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function LandingPage() {
  const { user, role, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [logoErrors, setLogoErrors] = useState({});

  const handleLogoError = (key) => {
    setLogoErrors(prev => ({ ...prev, [key]: true }));
  };

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'coach') return '/coach/dashboard';
    return '/student/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 selection:bg-brand-primary selection:text-white flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* 1. PUBLIC TOP NAVIGATION BAR                                              */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Left: Partner Logos & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center gap-2">
              {/* ITF Logo */}
              {!logoErrors['itf'] ? (
                <img
                  src="/logos/itf-logo.png"
                  alt="ITF"
                  className="h-8 sm:h-9 object-contain"
                  onError={() => handleLogoError('itf')}
                />
              ) : (
                <div className="h-8 px-2.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center shadow-xs">
                  ITF
                </div>
              )}

              {/* NECA Logo */}
              {!logoErrors['neca'] ? (
                <img
                  src="/logos/neca-logo.png"
                  alt="NECA"
                  className="h-8 sm:h-9 object-contain"
                  onError={() => handleLogoError('neca')}
                />
              ) : (
                <div className="h-8 px-2.5 rounded-lg bg-[#0054A6] text-white font-bold text-xs flex items-center shadow-xs">
                  NECA
                </div>
              )}

              {/* ShamzBridge Logo */}
              {!logoErrors['shamzbridge'] ? (
                <img
                  src="/logos/shamzbridge-logo.png"
                  alt="ShamzBridge"
                  className="h-8 sm:h-9 object-contain"
                  onError={() => handleLogoError('shamzbridge')}
                />
              ) : (
                <div className="h-8 px-2.5 rounded-lg bg-brand-primary text-white font-bold text-xs flex items-center shadow-xs">
                  SHAMZBRIDGE
                </div>
              )}
            </div>

            <div className="hidden md:block pl-3 border-l border-slate-200 text-left">
              <span className="block text-xs font-bold uppercase tracking-wider text-brand-primary leading-tight">
                TSDP 2026
              </span>
              <span className="block text-[11px] font-medium text-slate-500 leading-tight">
                Data Analytics Grading Portal
              </span>
            </div>
          </Link>

          {/* Right Navigation & Direct Login Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/guide"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-primary py-2 px-3 rounded-lg hover:bg-orange-50/60 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Platform Guide</span>
            </Link>

            {isAuthenticated && user ? (
              <Link
                to={getDashboardPath()}
                className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-orange-xs"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <a
                href="#portals"
                className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-orange-xs"
              >
                <span>Portal Login</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#141210] via-[#1C1814] to-[#251A10] text-white pt-12 pb-20 sm:pt-16 sm:pb-28">
        {/* Subtle Ambient Sunset Glow Lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-primary/25 via-amber-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-0 w-80 h-80 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 z-10">
          {/* Institutional Partner Ribbon */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-orange-200 text-xs font-medium backdrop-blur-md shadow-xs animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span>ITF-NECA Technical Skills Development Project · Implemented by ShamzBridge Consult</span>
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Next-Generation Data Analytics Residency &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                Evaluation Portal
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              A 4-month professional immersion transforming talented scholars into industry-ready analysts
              through rigorous spreadsheet modeling, SQL database engineering, Power BI business intelligence, and Python data science.
            </p>
          </div>

          {/* Cohort-Agnostic Telemetry Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-orange-100/90 font-medium">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              16 Weeks Intensive
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              4 Analytics Mastery Modules
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-orange-400" />
              9 Evaluation Pillars
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              Industry Capstone Sprints
            </span>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#portals"
              className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold px-6 py-3.5 rounded-xl text-sm flex items-center gap-2 shadow-orange-glow transition-all active:scale-[0.98]"
            >
              <span>Access Role Portals</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#curriculum"
              className="bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3.5 rounded-xl text-sm border border-white/20 backdrop-blur-xs transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-orange-300" />
              <span>Explore Curriculum</span>
            </a>
          </div>

          {/* Logged in prompt */}
          {isAuthenticated && user && (
            <div className="pt-2">
              <div className="inline-flex items-center gap-3 p-3 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-white text-xs max-w-md mx-auto backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Signed in as <strong>{user.name}</strong> ({role.toUpperCase()})
                </span>
                <Link
                  to={getDashboardPath()}
                  className="font-bold underline text-amber-300 hover:text-white shrink-0"
                >
                  Enter Console ➔
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE ROLE ACCESS HUB (3 PORTAL CARDS)                           */}
      {/* ========================================================================= */}
      <section id="portals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 relative z-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Resident Scholar Portal */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-card-hover hover:border-brand-primary transition-all group flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors shadow-orange-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="badge-primary font-semibold text-[11px]">Resident Portal</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                  Resident Scholar
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Dedicated workspace for enrolled data analytics scholars.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span>Mark daily physical & virtual attendance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span>Submit technical & professional coursework</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span>Upload monthly module projects (up to 40 MB)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span>View live weighted GPA & class rank</span>
                </li>
              </ul>
            </div>

            <Link
              to="/student/login"
              className="w-full py-2.5 px-4 bg-orange-50 hover:bg-brand-primary text-brand-primary hover:text-white rounded-xl text-xs font-bold border border-orange-200 hover:border-brand-primary flex items-center justify-center gap-2 transition-all shadow-xs group-hover:shadow-orange-xs"
            >
              <span>Resident Scholar Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Faculty & Coach Console */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-card-hover hover:border-[#0054A6] transition-all group flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0054A6] flex items-center justify-center group-hover:bg-[#0054A6] group-hover:text-white transition-colors shadow-xs">
                  <Award className="w-6 h-6" />
                </div>
                <span className="badge-secondary font-semibold text-[11px]">Faculty & Mentorship</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0054A6] transition-colors">
                  Coach & Faculty
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluation engine for technical mentors and soft-skills faculty.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0054A6] shrink-0" />
                  <span>Generate time-expiring attendance session codes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0054A6] shrink-0" />
                  <span>Grade technical assignments & class activities</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0054A6] shrink-0" />
                  <span>Score group presentations & capstone sprints</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0054A6] shrink-0" />
                  <span>Evaluate soft skills & approve social media posts</span>
                </li>
              </ul>
            </div>

            <Link
              to="/coach/login"
              className="w-full py-2.5 px-4 bg-blue-50 hover:bg-[#0054A6] text-[#0054A6] hover:text-white rounded-xl text-xs font-bold border border-blue-200 hover:border-[#0054A6] flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Faculty & Coach Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Executive Governance Portal */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-card-hover hover:border-slate-800 transition-all group flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="badge-neutral font-semibold text-[11px]">System Admin</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-900 transition-colors">
                  Program Administrator
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Executive oversight for ShamzBridge and ITF-NECA sponsors.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                  <span>Live cohort vitals & grade distribution radar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                  <span>Early intervention risk triggers (&lt;50% score)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                  <span>Manage residents, faculty roster & capstone groups</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                  <span>1-click official ITF-NECA CSV & PDF transcripts</span>
                </li>
              </ul>
            </div>

            <Link
              to="/admin/login"
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white rounded-xl text-xs font-bold border border-slate-300 hover:border-slate-900 flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>System Administrator Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CURRICULUM ARCHITECTURE (THE 4 MODULES)                                */}
      {/* ========================================================================= */}
      <section id="curriculum" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-brand-primary text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pedagogical Structure</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            4-Month Analytics Mastery Curriculum
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Engineered around four cornerstone technologies to take scholars from spreadsheet fundamentals to production machine learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Module 1: Excel */}
          <div className="portal-card p-6 border-t-4 border-t-emerald-500 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Month 1</span>
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Advanced Excel</h3>
              <p className="text-xs font-medium text-slate-500">Spreadsheet Modeling & Analytics</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dynamic arrays, XLOOKUP, INDEX/MATCH, Pivot modeling, financial analysis, and decision dashboards.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Tool: Microsoft Excel</span>
              <span className="text-emerald-700 font-bold">Weeks 1–4</span>
            </div>
          </div>

          {/* Module 2: SQL */}
          <div className="portal-card p-6 border-t-4 border-t-brand-primary space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-brand-primary bg-orange-50 px-2 py-0.5 rounded-md">Month 2</span>
              <Database className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Relational SQL</h3>
              <p className="text-xs font-medium text-slate-500">Database Design & Querying</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Schema normalization, CTEs, Window functions, complex multi-table joins, subqueries, and database indexing.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Tool: PostgreSQL / MySQL</span>
              <span className="text-brand-primary font-bold">Weeks 5–8</span>
            </div>
          </div>

          {/* Module 3: Power BI */}
          <div className="portal-card p-6 border-t-4 border-t-amber-500 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Month 3</span>
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Power BI & DAX</h3>
              <p className="text-xs font-medium text-slate-500">Business Intelligence & DAX</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Star schemas, Power Query ETL, DAX calculated measures, row-level security, and interactive executive reporting.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Tool: Power BI Desktop</span>
              <span className="text-amber-700 font-bold">Weeks 9–12</span>
            </div>
          </div>

          {/* Module 4: Python */}
          <div className="portal-card p-6 border-t-4 border-t-blue-600 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Month 4</span>
              <Terminal className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Python Analytics</h3>
              <p className="text-xs font-medium text-slate-500">Data Science & Capstone</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pandas data wrangling, NumPy numerical computing, Seaborn/Matplotlib visualization, and end-to-end Capstone defense.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Tool: Python 3 & Jupyter</span>
              <span className="text-blue-700 font-bold">Weeks 13–16</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. THE 9 EVALUATION PILLARS (SYLLABUS WEIGHTING)                          */}
      {/* ========================================================================= */}
      <section className="bg-white py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-brand-primary" />
              <span>Academic Integrity</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              100% Transparent Grading Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Resident progress is assessed holistically across 9 rigorous pillars to develop both technical mastery and workplace leadership.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {GRADING_WEIGHTS.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-xl border border-slate-100 bg-[#FAF8F5] hover:border-orange-200 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold text-brand-primary">{w.weight}%</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${w.color}`} />
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-snug">{w.name}</h4>
                <p className="text-[11px] text-slate-500">Max Score: {w.maxScore} pts</p>
              </div>
            ))}

            {/* Total Badge */}
            <div className="p-4 rounded-xl border border-brand-primary/30 bg-orange-50/70 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-brand-primary">100%</span>
                <Sparkles className="w-4 h-4 text-brand-primary" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Total Program Weight</h4>
                <p className="text-[11px] text-brand-primary font-semibold">ITF-NECA Standard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. INSTITUTIONAL SPONSORS & GOVERNANCE                                    */}
      {/* ========================================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Institutional Governance</span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            A Collaborative National Workforce Initiative
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">Sponsor</span>
            <h3 className="text-sm font-bold text-slate-900">Industrial Training Fund (ITF)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mandated to promote and encourage the acquisition of technical skills in industry and commerce with a view to generating a pool of trained indigenous manpower.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-extrabold text-[#0054A6] bg-blue-50 px-2 py-0.5 rounded-md inline-block">Co-Sponsor</span>
            <h3 className="text-sm font-bold text-slate-900">Nigeria Employers' Consultative Association (NECA)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The umbrella organization of employers in the Organized Private Sector of Nigeria, championing employer-led human capital development.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-brand-primary/40 shadow-orange-xs space-y-2">
            <span className="text-xs font-extrabold text-brand-primary bg-orange-50 px-2 py-0.5 rounded-md inline-block">Implementing Partner</span>
            <h3 className="text-sm font-bold text-slate-900">ShamzBridge Consult</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Premier data analytics, advisory, and human capital transformation firm executing curriculum delivery, live grading portal governance, and residency operations.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. EXECUTIVE FOOTER                                                       */}
      {/* ========================================================================= */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} <strong>ITF-NECA Technical Skills Development Project (TSDP)</strong> · Powered by{' '}
            <strong className="text-brand-primary font-semibold">ShamzBridge Consult</strong>
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/guide" className="hover:text-brand-primary font-medium transition-colors">
              Platform Guide
            </Link>
            <span className="text-slate-300">·</span>
            <Link to="/student/login" className="hover:text-brand-primary transition-colors">
              Resident Scholar
            </Link>
            <span className="text-slate-300">·</span>
            <Link to="/coach/login" className="hover:text-brand-primary transition-colors">
              Faculty Coach
            </Link>
            <span className="text-slate-300">·</span>
            <Link to="/admin/login" className="hover:text-brand-primary transition-colors">
              System Admin
            </Link>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 font-mono">v1.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
