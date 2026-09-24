import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Download,
  Printer,
  GraduationCap,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Upload,
  FolderArchive,
  Share2,
  TrendingUp,
  FileText,
  Users,
  Smile,
  QrCode,
  Layers,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  FileCheck,
  CheckSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { generatePlatformPdfReport } from '../utils/generatePdfReport';

export default function PlatformGuide() {
  const { user, role, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'student' | 'coach' | 'admin'
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const reportRef = useRef(null);

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    setPdfError(null);

    try {
      // Generate clean, native, non-technical PDF styled with brand orange
      generatePlatformPdfReport();
    } catch (err) {
      console.error('PDF export error:', err);
      setPdfError('Could not generate PDF. Please use "Print / Save as PDF" instead.');
    } finally {
      setTimeout(() => {
        setIsGeneratingPdf(false);
      }, 500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Action & Navigation Banner (No-Print) */}
      <div className="no-print bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-brand-primary border border-blue-200">
              Official Documentation
            </span>
            <span className="text-xs text-slate-400">· Version 2.0</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Platform Operations & Workflow Breakdown Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            End-to-end user manual, process infographics, and evaluation models for Residents, Coaches, and Administrators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2 shadow-xs hover:shadow-sm"
            title="Download report as PDF document"
          >
            {isGeneratingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn-outline py-2 px-3.5 text-xs font-medium flex items-center gap-1.5"
            title="Print or Save as PDF using browser"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {pdfError && (
        <div className="no-print p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{pdfError}</span>
          </div>
          <button
            onClick={() => setPdfError(null)}
            className="text-amber-700 hover:text-amber-900 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Role Filter Tabs (No-Print) */}
      <div className="no-print flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🌐 Full Platform Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('student')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'student'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-slate-600 hover:text-brand-primary'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Resident (Student) Workflow</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('coach')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'coach'
              ? 'bg-brand-secondary text-white shadow-xs'
              : 'text-slate-600 hover:text-brand-secondary'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Coach Workflow</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'admin'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Administrator Workflow</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE REPORT CONTAINER (Targeted by html2pdf and @media print) */}
      {/* ========================================================================= */}
      <div
        ref={reportRef}
        id="report-printable-area"
        className="print-container bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/90 shadow-xs space-y-12"
      >
        {/* Formal Document Header */}
        <div className="border-b border-slate-200 pb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 px-3 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center tracking-wider shadow-xs">
                ITF
              </div>
              <div className="h-10 px-3 rounded-lg bg-brand-primary text-white font-bold text-sm flex items-center justify-center tracking-wider shadow-xs">
                NECA
              </div>
              <div className="h-10 px-3 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center justify-center tracking-wider shadow-xs">
                ShamzBridge
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-800">ITF-NECA Technical Skills Development Project (TSDP)</p>
              <p>2026 Data Analytics Cohort 1 · Operations Manual</p>
              <p className="text-[11px] text-slate-400">Published: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="pt-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Platform Workflow & Governance Breakdown Report
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              A comprehensive guide detailing operational procedures, deliverable pipelines, multi-period attendance tracking, evaluation rubrics, and administrative governance for the ITF-NECA Data Analytics Grading Portal.
            </p>
          </div>
        </div>

        {/* SECTION 1: EXECUTIVE OVERVIEW & GRADING WEIGHTS */}
        {(activeTab === 'all' || activeTab === 'summary') && (
          <section className="space-y-6 avoid-break">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-lg">📊</span>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                1. Executive Architecture & Assessment Framework
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The portal is engineered as a unified digital ecosystem serving three core stakeholder groups:
              <strong> Residents (Students)</strong> who participate, submit work, and monitor their trajectory;
              <strong> Coaches (Faculty)</strong> who generate attendance sessions, evaluate deliverables, and mentor cohorts; and
              <strong> Administrators</strong> who oversee program integrity, manage rosters, and generate institutional compliance reports.
            </p>

            {/* Assessment Weights Grid (Infographic) */}
            <div className="infographic-box bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-primary" />
                  Cohort Grading Architecture (100% Total Program Weight)
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Total: 100%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-brand-primary">Technical</span>
                  <p className="text-xl font-extrabold text-slate-800">30%</p>
                  <p className="text-[10px] text-slate-500">Weekly Tasks</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-purple-600">Capstone</span>
                  <p className="text-xl font-extrabold text-slate-800">20%</p>
                  <p className="text-[10px] text-slate-500">Sprint Defenses</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-blue-600">Activities</span>
                  <p className="text-xl font-extrabold text-slate-800">15%</p>
                  <p className="text-[10px] text-slate-500">In-Class Labs</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-indigo-600">Modules</span>
                  <p className="text-xl font-extrabold text-slate-800">15%</p>
                  <p className="text-[10px] text-slate-500">Monthly Projects</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-amber-600">Soft Skills</span>
                  <p className="text-xl font-extrabold text-slate-800">10%</p>
                  <p className="text-[10px] text-slate-500">6 Competencies</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-pink-600">Social Media</span>
                  <p className="text-xl font-extrabold text-slate-800">5%</p>
                  <p className="text-[10px] text-slate-500">Public Learning</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-emerald-600">Attendance</span>
                  <p className="text-xl font-extrabold text-slate-800">5%</p>
                  <p className="text-[10px] text-slate-500">Morning & Aft.</p>
                </div>
              </div>
            </div>

            {/* Platform Role Comparison Cards (Infographic) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-800">Resident Portal</h3>
                    <span className="text-[10px] text-brand-primary font-semibold">Student Trainees</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Daily code check-in, weekly syllabus submissions, module zip uploads, social post logging, and real-time GPA / compliance tracking.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-secondary text-white flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-800">Coach Portal</h3>
                    <span className="text-[10px] text-brand-secondary-dark font-semibold">Faculty & Instructors</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate Morning/Afternoon attendance codes, grade deliverables with rubrics, record lab activities, evaluate soft skills, and approve social posts.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-300 bg-slate-100/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-800">Admin Portal</h3>
                    <span className="text-[10px] text-slate-700 font-semibold">System & Program Leads</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Roster management, capstone team creation, cohort health diagnostics, at-risk alerts, and executive ITF-NECA compliance reporting.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: RESIDENT (STUDENT) WORKFLOW */}
        {(activeTab === 'all' || activeTab === 'student') && (
          <section className="space-y-6 print-page-break">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎓</span>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  2. Resident (Student) Workflow Breakdown
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-brand-primary">
                Portal Route: /student/dashboard
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Residents log in securely using their assigned Resident Number (e.g. <code>TSDP2026-RES-001</code>). Once authenticated, they follow a continuous learning and submission cycle:
            </p>

            {/* Resident Linear Visual Pipeline (Infographic) */}
            <div className="infographic-box p-5 bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border border-blue-200/80 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Resident Daily & Weekly Journey (Process Infographic)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center">1</div>
                  <p className="font-bold text-slate-800">Login</p>
                  <p className="text-[11px] text-slate-500">Enter Resident # to access personalized dashboard</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center">2</div>
                  <p className="font-bold text-slate-800">Attendance</p>
                  <p className="text-[11px] text-slate-500">Enter Morning & Afternoon 4-digit coach codes</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center">3</div>
                  <p className="font-bold text-slate-800">Assignments</p>
                  <p className="text-[11px] text-slate-500">Upload Excel, Power BI, SQL files directly</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center">4</div>
                  <p className="font-bold text-slate-800">Module Project</p>
                  <p className="text-[11px] text-slate-500">Submit end-of-month bundled project deliverables</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center">5</div>
                  <p className="font-bold text-slate-800">Social Post</p>
                  <p className="text-[11px] text-slate-500">Share learning online, track approved posts (X/Y)</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">6</div>
                  <p className="font-bold text-slate-800">Performance</p>
                  <p className="text-[11px] text-slate-500">Monitor grade, attendance %, and team rank</p>
                </div>
              </div>
            </div>

            {/* Detailed Resident Steps */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center">A</span>
                  <h3 className="font-bold text-sm text-slate-800">Marking Daily Attendance (Morning & Afternoon)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  Navigate to <strong>Mark Attendance</strong> (<code>/student/attendance</code>). Select the active <strong>Session Period</strong> (<em>Morning</em> or <em>Afternoon</em>) and session type (Lecture vs Lab). Input the dynamic 4-character code displayed on the coach's screen. Codes expire in 15 minutes. Successful entry immediately records presence in the live database.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center">B</span>
                  <h3 className="font-bold text-sm text-slate-800">Submitting Technical & Professional Assignments</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  Under <strong>Assignments Due</strong> on the dashboard, click <strong>"Submit Now"</strong> or open <code>/student/submit-assignment</code>. The form pre-fills the assignment ID, syllabus title, and week. Residents attach their deliverables (e.g. <code>.xlsx</code>, <code>.pbix</code>, <code>.sql</code>, <code>.pdf</code>) up to 25MB. Files are securely transferred to the cohort's Google Drive archive.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center">C</span>
                  <h3 className="font-bold text-sm text-slate-800">Monthly Module Projects & Capstone Deliverables</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  At the conclusion of each syllabus module (Excel, Power BI, SQL, Python), residents submit comprehensive projects via <code>/student/submit-module-project</code>. Multi-file uploads (documentation, data cleaning scripts, dashboards) are archived as a bundle for coach evaluation.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center">D</span>
                  <h3 className="font-bold text-sm text-slate-800">Social Media Learning Posts & Progress Tracking</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  Residents submit links to public posts sharing their data analysis journey on LinkedIn, Twitter/X, Medium, or Facebook via <code>/student/submit-social-media</code>. The system displays real-time progress (e.g. <code>0/3 posts approved</code>). Assignments remain pending on the dashboard until the required number of coach approvals is achieved.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: COACH WORKFLOW */}
        {(activeTab === 'all' || activeTab === 'coach') && (
          <section className="space-y-6 print-page-break">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  3. Coach (Faculty) Workflow Breakdown
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-brand-secondary-dark">
                Portal Route: /coach/dashboard
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Coaches oversee classroom learning, attendance generation, assignment creation, and multi-dimensional grading. The coach workflow operates across 8 specialized modules:
            </p>

            {/* Coach Lifecycle Diagram (Infographic) */}
            <div className="infographic-box p-5 bg-gradient-to-r from-orange-50 via-amber-50/50 to-slate-50 border border-orange-200/80 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-secondary-dark flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Coach Classroom & Grading Lifecycle (Infographic)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-brand-secondary-dark font-bold">
                    <QrCode className="w-4 h-4" />
                    <span>1. Attendance Session</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Generate Morning / Afternoon codes (15m validity). Use <strong>Mark All Present</strong> for confirmed roll-call.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-brand-primary font-bold">
                    <CheckSquare className="w-4 h-4" />
                    <span>2. Deliverable Grading</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Grade Technical (30%) & Module Projects (15%) with rubric 0-100 and qualitative feedback.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-purple-600 font-bold">
                    <Users className="w-4 h-4" />
                    <span>3. Presentations & Soft Skills</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Evaluate Capstone sprints (20%), group presentations, and 6-factor bi-weekly soft skills.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <Share2 className="w-4 h-4" />
                    <span>4. Social & Content Creation</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Approve social posts (+5 pts). Create new syllabus assignments with tools and deadlines.
                  </p>
                </div>
              </div>
            </div>

            {/* Coach Detailed Operations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-secondary" />
                  Generating Attendance Codes
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Navigate to <code>/coach/attendance-code</code>. Select Week, Day, Session Type (Lecture / Lab), and <strong>Session Period</strong> (<em>Morning</em> or <em>Afternoon</em>). Click <strong>"Generate Attendance Code"</strong>. Display the high-contrast code on the classroom projector. Coaches can also click <strong>"Mark All Present"</strong> for manual overrides.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-brand-primary" />
                  Grading Technical Assignments
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Open <code>/coach/grade-assignments</code>. Submissions display resident info, file download link from Google Drive, and submission timestamps. Coaches score between 0 and 100 based on standard rubrics and provide constructive notes.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  Presentations & Capstone Sprints
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  During weekly group presentation days (<code>/coach/grade-presentations</code>) and Capstone sprints (<code>/coach/grade-capstone</code>), coaches score readiness, slide quality, presentation clarity, and Q&A defense. Individual present members are recorded.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-amber-600" />
                  Soft Skills & Social Media Review
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conduct bi-weekly evaluations (<code>/coach/soft-skills</code>) across 6 attributes. Review public social posts under <code>/coach/approve-social-media</code> or directly from the Coach Overview dashboard, awarding up to 5 points per post.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: ADMINISTRATOR WORKFLOW */}
        {(activeTab === 'all' || activeTab === 'admin') && (
          <section className="space-y-6 print-page-break">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  4. Administrator Workflow Breakdown
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                Portal Route: /admin/dashboard
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Administrators maintain overall program health, manage user rosters, audit grading compliance, organize capstone teams, and generate institutional reports for ITF-NECA and partner stakeholders.
            </p>

            {/* Admin Architecture (Infographic) */}
            <div className="infographic-box p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                Administrative Governance & Compliance System
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Users className="w-4 h-4" />
                    <span>Resident Management</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Enroll new students, assign cohort IDs, track status (Active/Suspended), and update profile info.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Award className="w-4 h-4" />
                    <span>Coach Management</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Register faculty coaches, assign specialized modules, and monitor grading turnaround speed.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Layers className="w-4 h-4" />
                    <span>Capstone Groups</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Create cross-functional teams, assign projects (e.g. Fintech, Healthcare), and appoint team leads.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <BarChart3 className="w-4 h-4" />
                    <span>Institutional Reports</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Export cohort gradebooks, attendance percentage audits, and official graduation clearance sheets.
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Key Operational Tasks */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <h3 className="font-bold text-sm text-slate-800">Managing Trainees & Faculty Rosters</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  Administrators access <code>/admin/students</code> to view the full roster of 40+ trainees. Each profile displays attendance rate, total assignments submitted, and overall score. Administrators can toggle student status or edit contact details. The Coach Directory (<code>/admin/coaches</code>) enables adding new instructors and tracking grading progress.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <h3 className="font-bold text-sm text-slate-800">Capstone Group Formation & Team Dynamics</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  Via <code>/admin/create-capstone-group</code>, administrators assemble balanced project squads. Groups are assigned specific industry themes (Fintech, Health Analytics, Logistics) and mentors to guide their capstone sprint defenses.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 avoid-break">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">3</span>
                  <h3 className="font-bold text-sm text-slate-800">Compliance Audits & Performance Reporting</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  Under <code>/admin/reports</code>, administrators view cohort-wide summary statistics: Mean Score, Highest Score, Attendance Consistency, and At-Risk Flags (residents with attendance &lt; 75% or 3+ overdue deliverables). These reports can be downloaded or shared directly with ITF and NECA executive directors.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: ROLE PERMISSION & FEATURE MATRIX */}
        {(activeTab === 'all' || activeTab === 'matrix') && (
          <section className="space-y-4 avoid-break">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-lg">📋</span>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                5. Feature & Access Control Matrix
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="p-3 font-bold">Portal Feature / Workflow</th>
                    <th className="p-3 font-bold text-center">Resident (Student)</th>
                    <th className="p-3 font-bold text-center">Coach (Faculty)</th>
                    <th className="p-3 font-bold text-center">Administrator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Mark Daily Attendance (Morning & Afternoon)</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ (Enter Code)</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Generate Attendance Codes & Roll-Call</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    <td className="p-3 text-center text-brand-secondary-dark font-bold">✓ (Generate / Override)</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Submit Technical, Module & Social Tasks</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ (Drive Upload / URL)</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Grade Assignments & Record Feedback</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    <td className="p-3 text-center text-brand-secondary-dark font-bold">✓ (Rubrics 0-100)</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Evaluate Soft Skills & Capstone Sprints</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    <td className="p-3 text-center text-brand-secondary-dark font-bold">✓ (6 Dimensions)</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Approve / Reject Social Media Posts</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    <td className="p-3 text-center text-brand-secondary-dark font-bold">✓ (0 to 5 pts)</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Manage Student & Coach Accounts</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    <td className="p-3 text-center text-slate-900 font-bold">✓ (Full Admin Control)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Export Formal Cohort Audit Reports</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    <td className="p-3 text-center text-slate-900 font-bold">✓ (ITF-NECA Audits)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECTION 6: FREQUENTLY ASKED QUESTIONS & SUPPORT */}
        <section className="space-y-4 avoid-break">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-lg">❓</span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              6. Troubleshooting & Operational FAQs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
              <p className="font-bold text-slate-800">What happens if an attendance code expires?</p>
              <p className="text-slate-600 leading-relaxed">
                Attendance codes are dynamic and expire after 15 minutes. The coach can easily generate a new code or click <strong>"Mark All Present"</strong> for students physically in class.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
              <p className="font-bold text-slate-800">Can students submit assignments after the due date?</p>
              <p className="text-slate-600 leading-relaxed">
                Yes. Overdue assignments display a red warning badge but provide a <strong>"Submit Late"</strong> button so trainees can still deliver their work for partial credit or evaluation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
              <p className="font-bold text-slate-800">How do social media posts count toward final grades?</p>
              <p className="text-slate-600 leading-relaxed">
                Public social posts represent 5% of the overall score. Each approved post awards up to 5 points. Assignments track progress (e.g. 0/3 posts) and remain pending until all posts are approved.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
              <p className="font-bold text-slate-800">Is offline work preserved if internet drops?</p>
              <p className="text-slate-600 leading-relaxed">
                Yes. The portal incorporates localStorage failovers for module submissions and social posts. When connection restores, local caches sync with the central Apps Script backend.
              </p>
            </div>
          </div>
        </section>

        {/* Formal Document Sign-off Footer */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="font-bold text-slate-700">Industrial Training Fund (ITF) & Nigeria Employers' Consultative Association (NECA)</p>
            <p>Managed and Executed by ShamzBridge Consult · Technical Skills Development Project (TSDP) 2026</p>
          </div>
          <div className="text-center sm:text-right shrink-0">
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
              DOC-ID: TSDP-OPS-2026-V2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
