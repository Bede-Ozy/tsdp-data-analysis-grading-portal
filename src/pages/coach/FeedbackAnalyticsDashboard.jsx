import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getChallengeFeedbackList,
  getFeedbackSheetId,
  setFeedbackSheetId,
  updateFeedbackReviewStatus,
  clearFeedbackResponses
} from '../../services/api';
import {
  BarChart3,
  Users,
  Flame,
  Star,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Search,
  Filter,
  Download,
  ExternalLink,
  Layers,
  Settings,
  RefreshCw,
  Eye,
  X,
  Code,
  Copy,
  Check,
  GraduationCap,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  CheckSquare,
  FileText
} from 'lucide-react';

const STANDARD_MODULES = [
  "Excel",
  "SQL",
  "Power BI",
  "Data Analysis and Storytelling",
  "Data Visualization",
  "Other"
];

const STANDARD_CHALLENGES = [
  "Understanding the task requirements",
  "Remembering the syntax or formulas",
  "Writing queries or code independently",
  "Choosing the right functions or tools",
  "Debugging errors and solving problems",
  "Interpreting results and drawing insights",
  "Creating effective visualizations",
  "Explaining my findings or presenting my work"
];

const STANDARD_APPROACHES = [
  "A recap of concepts and theory",
  "Step-by-step practical demonstrations",
  "Guided hands-on exercises",
  "Working through errors and troubleshooting",
  "Real-world case studies and projects",
  "A combination of these approaches"
];

export default function FeedbackAnalyticsDashboard() {
  const { role } = useAuth();

  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sheet ID Configuration Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [sheetIdInput, setSheetIdInput] = useState('');
  const [activeSheetId, setActiveSheetId] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Response Details Modal
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [coachNoteInput, setCoachNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [confidenceFilter, setConfidenceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Load Feedback Data
  const loadData = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const currentSheetId = getFeedbackSheetId();
      setActiveSheetId(currentSheetId);
      setSheetIdInput(currentSheetId);

      const res = await getChallengeFeedbackList(currentSheetId, force);
      if (res && res.success) {
        setFeedbackList(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load challenge feedback:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Purge any stale dummy mock items from localStorage on mount
    try {
      const raw = localStorage.getItem('tsdp_challenge_feedback_responses');
      if (raw && (raw.includes('FB-2026-00') || raw.includes('Emmanuel Okafor') || raw.includes('Fatima Abubakar'))) {
        localStorage.removeItem('tsdp_challenge_feedback_responses');
      }
    } catch (e) {}

    loadData();
  }, []);

  // Save new Sheet ID
  const handleSaveSheetId = (e) => {
    e.preventDefault();
    const cleanId = sheetIdInput.trim();
    setFeedbackSheetId(cleanId);
    setActiveSheetId(cleanId);
    setSaveSuccessMsg('Target Google Sheet ID saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
    loadData(true);
  };

  // KPI Calculations across the 9 questions
  const metrics = useMemo(() => {
    const totalResponses = feedbackList.length;
    const totalCohort = 27;
    const responseRate = totalCohort > 0 ? Math.round((totalResponses / totalCohort) * 100) : 0;

    // Average confidence (Q6)
    const sumConfidence = feedbackList.reduce((acc, curr) => acc + (Number(curr.confidenceScore) || 3), 0);
    const avgConfidence = totalResponses > 0 ? (sumConfidence / totalResponses).toFixed(1) : '0.0';

    // Q1 Modules Needing Support counts
    const moduleCounts = {};
    STANDARD_MODULES.forEach(m => { moduleCounts[m] = 0; });

    // Q5 Challenges counts
    const challengeCounts = {};
    STANDARD_CHALLENGES.forEach(c => { challengeCounts[c] = 0; });

    // Q8 Learning Approach counts
    const approachCounts = {};
    STANDARD_APPROACHES.forEach(a => { approachCounts[a] = 0; });

    // Confidence Tiers (Q6)
    const confidenceTiers = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    let pendingCount = 0;
    let urgentCount = 0;

    feedbackList.forEach(item => {
      if (item.status === 'Pending Review') pendingCount++;
      if (Number(item.confidenceScore) <= 2 || item.urgency === 'Urgent') urgentCount++;

      // Q1 Modules
      const mods = Array.isArray(item.modulesNeeded)
        ? item.modulesNeeded
        : (item.primaryModule ? [item.primaryModule] : []);

      mods.forEach(m => {
        const clean = (m || '').trim();
        if (clean.startsWith('Other:')) {
          moduleCounts['Other'] = (moduleCounts['Other'] || 0) + 1;
        } else if (clean) {
          moduleCounts[clean] = (moduleCounts[clean] || 0) + 1;
        }
      });

      // Q5 Practical Challenges
      const chs = Array.isArray(item.practicalChallenges)
        ? item.practicalChallenges
        : (Array.isArray(item.challengeTypes) ? item.challengeTypes : []);

      chs.forEach(c => {
        const clean = (c || '').trim();
        if (clean.startsWith('Other:')) {
          challengeCounts['Other'] = (challengeCounts['Other'] || 0) + 1;
        } else if (clean) {
          challengeCounts[clean] = (challengeCounts[clean] || 0) + 1;
        }
      });

      // Q6 Confidence
      const score = Math.round(Number(item.confidenceScore) || 3);
      if (confidenceTiers[score] !== undefined) {
        confidenceTiers[score]++;
      }

      // Q8 Learning Approach
      const app = (item.preferredLearningApproach || '').trim();
      if (app) {
        approachCounts[app] = (approachCounts[app] || 0) + 1;
      }
    });

    // Top module needing support
    let topModule = '—';
    let topModuleCount = 0;
    Object.entries(moduleCounts).forEach(([mod, count]) => {
      if (count > topModuleCount) {
        topModuleCount = count;
        topModule = mod;
      }
    });

    // Top practical challenge
    let topChallenge = '—';
    let topChallengeCount = 0;
    Object.entries(challengeCounts).forEach(([ch, count]) => {
      if (count > topChallengeCount) {
        topChallengeCount = count;
        topChallenge = ch;
      }
    });

    // Top preferred approach
    let topApproach = '—';
    let topApproachCount = 0;
    Object.entries(approachCounts).forEach(([app, count]) => {
      if (count > topApproachCount) {
        topApproachCount = count;
        topApproach = app;
      }
    });

    // Tool-specific confidence averages (Excel, SQL, Power BI)
    let sumExcel = 0, countExcel = 0;
    let sumSql = 0, countSql = 0;
    let sumPowerBi = 0, countPowerBi = 0;

    feedbackList.forEach(item => {
      if (item.confidenceExcel) {
        sumExcel += Number(item.confidenceExcel);
        countExcel++;
      }
      if (item.confidenceSql) {
        sumSql += Number(item.confidenceSql);
        countSql++;
      }
      if (item.confidencePowerBi) {
        sumPowerBi += Number(item.confidencePowerBi);
        countPowerBi++;
      }
    });

    const avgExcel = countExcel > 0 ? (sumExcel / countExcel).toFixed(1) : null;
    const avgSql = countSql > 0 ? (sumSql / countSql).toFixed(1) : null;
    const avgPowerBi = countPowerBi > 0 ? (sumPowerBi / countPowerBi).toFixed(1) : null;

    // Sorted challenges for visual breakdown
    const sortedChallenges = Object.entries(challengeCounts)
      .map(([challenge, count]) => ({ challenge, count }))
      .sort((a, b) => b.count - a.count);

    // Sorted approaches for visual breakdown
    const sortedApproaches = Object.entries(approachCounts)
      .map(([approach, count]) => ({ approach, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalResponses,
      totalCohort,
      responseRate,
      avgConfidence,
      avgExcel,
      avgSql,
      avgPowerBi,
      urgentCount,
      pendingCount,
      topModule,
      topModuleCount,
      topChallenge,
      topChallengeCount,
      topApproach,
      topApproachCount,
      moduleCounts,
      sortedChallenges,
      sortedApproaches,
      confidenceTiers
    };
  }, [feedbackList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return feedbackList.filter(item => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = !search ||
        (item.studentName || '').toLowerCase().includes(search) ||
        (item.studentID || '').toLowerCase().includes(search) ||
        (item.classGroup || '').toLowerCase().includes(search) ||
        (item.difficultTopics || '').toLowerCase().includes(search) ||
        (item.theoryVsPractical || '').toLowerCase().includes(search) ||
        (item.revisitTopics || '').toLowerCase().includes(search) ||
        (Array.isArray(item.modulesNeeded) && item.modulesNeeded.some(m => m.toLowerCase().includes(search)));

      // Module Filter
      const matchesModule = moduleFilter === 'All' ||
        (Array.isArray(item.modulesNeeded) && item.modulesNeeded.some(m => m.includes(moduleFilter))) ||
        item.primaryModule === moduleFilter;

      // Confidence Filter
      const matchesConfidence = confidenceFilter === 'All' || String(item.confidenceScore) === String(confidenceFilter);

      // Status Filter
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesModule && matchesConfidence && matchesStatus;
    });
  }, [feedbackList, searchQuery, moduleFilter, confidenceFilter, statusFilter]);

  // Toggle Response Status (Pending vs Reviewed)
  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'Reviewed' ? 'Pending Review' : 'Reviewed';
    await updateFeedbackReviewStatus(item.id, newStatus, item.coachNotes || '');
    setFeedbackList(prev => prev.map(f => f.id === item.id ? { ...f, status: newStatus } : f));
    if (selectedResponse && selectedResponse.id === item.id) {
      setSelectedResponse(prev => ({ ...prev, status: newStatus }));
    }
  };

  // Save Coach Note on Modal
  const handleSaveCoachNote = async () => {
    if (!selectedResponse) return;
    setSavingNote(true);
    try {
      await updateFeedbackReviewStatus(selectedResponse.id, selectedResponse.status, coachNoteInput);
      setFeedbackList(prev => prev.map(f => f.id === selectedResponse.id ? { ...f, coachNotes: coachNoteInput } : f));
      setSelectedResponse(prev => ({ ...prev, coachNotes: coachNoteInput }));
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  // Open detail modal
  const openDetailModal = (item) => {
    setSelectedResponse(item);
    setCoachNoteInput(item.coachNotes || '');
  };

  // Export to CSV matching the 9 questions
  const handleExportCSV = () => {
    if (feedbackList.length === 0) return;

    const headers = [
      "Response ID",
      "Submitted At",
      "Student ID",
      "Student Name",
      "Email",
      "Resident Group",
      "Q1: Modules Needing Support",
      "Q2: Difficult Topics & Concepts",
      "Q3: Theory vs Practical Struggles",
      "Q4: Topics to Revisit in Revision",
      "Q5: Practical Challenges",
      "Q6: Excel Confidence (1-5)",
      "Q6: SQL Confidence (1-5)",
      "Q6: Power BI Confidence (1-5)",
      "Q6: Overall Avg Confidence",
      "Q7: Step-by-Step Demonstration Requests",
      "Q8: Preferred Learning Approach",
      "Q9: Additional Notes & Experience",
      "Status",
      "Coach Notes"
    ];

    const rows = feedbackList.map(item => [
      item.id || '',
      item.submittedAt || item.timestamp || '',
      item.studentID || '',
      item.studentName || '',
      item.email || '',
      item.classGroup || '',
      Array.isArray(item.modulesNeeded) ? item.modulesNeeded.join('; ') : (item.primaryModule || ''),
      (item.difficultTopics || item.detailedChallenges || '').replace(/"/g, '""'),
      (item.theoryVsPractical || '').replace(/"/g, '""'),
      (item.revisitTopics || (Array.isArray(item.topicsToReview) ? item.topicsToReview.join('; ') : '') || '').replace(/"/g, '""'),
      Array.isArray(item.practicalChallenges) ? item.practicalChallenges.join('; ') : (Array.isArray(item.challengeTypes) ? item.challengeTypes.join('; ') : ''),
      item.confidenceExcel || item.confidenceScore || 3,
      item.confidenceSql || item.confidenceScore || 3,
      item.confidencePowerBi || item.confidenceScore || 3,
      item.confidenceScore || 3,
      (item.demonstrationAreas || item.specificQuestions || '').replace(/"/g, '""'),
      (item.preferredLearningApproach || (Array.isArray(item.preferredReviewFormats) ? item.preferredReviewFormats.join('; ') : '') || '').replace(/"/g, '""'),
      (item.additionalFeedback || item.suggestions || '').replace(/"/g, '""'),
      item.status || 'Pending Review',
      (item.coachNotes || '').replace(/"/g, '""')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TSDP_2026_Student_Revision_Needs_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Google Apps Script Snippet tailored exactly to the 9 questions & backend router
  const appsScriptSnippet = `
/**
 * 1. ADD THESE CASES TO YOUR EXISTING doPost(e) SWITCH ROUTER:
 * -------------------------------------------------------------
 *   case 'submitChallengeFeedback':
 *     result = submitChallengeFeedback(params[0], params[1]);
 *     break;
 * 
 *   case 'getChallengeFeedbackList':
 *     result = getChallengeFeedbackList(params[0]);
 *     break;
 * 
 *   case 'updateFeedbackReviewStatus':
 *     result = updateFeedbackReviewStatus(params[0], params[1], params[2], params[3]);
 *     break;
 * 
 * 2. PASTE THESE THREE FUNCTIONS AT THE BOTTOM OF Code.gs:
 * -------------------------------------------------------------
 */
function submitChallengeFeedback(record, targetSheetId) {
  try {
    var ss;
    if (targetSheetId && targetSheetId.toString().trim() !== "") {
      ss = SpreadsheetApp.openById(targetSheetId.toString().trim());
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    var sheetName = "Challenge_Feedback";
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        "Response ID",
        "Submitted At",
        "Student ID",
        "Student Name",
        "Email",
        "Resident Group",
        "Q1: Modules Needing Support",
        "Q2: Difficult Topics & Concepts",
        "Q3: Theory vs Practical Struggles",
        "Q4: Topics to Revisit in Revision",
        "Q5: Practical Challenges",
        "Q6: Excel Confidence (1-5)",
        "Q6: SQL Confidence (1-5)",
        "Q6: Power BI Confidence (1-5)",
        "Q6: Overall Avg Confidence",
        "Q7: Step-by-Step Demonstration Requests",
        "Q8: Preferred Learning Approach",
        "Q9: Additional Notes & Experience",
        "Status",
        "Coach Notes"
      ]);
      sheet.getRange(1, 1, 1, 20).setBackground("#0054A6").setFontColor("#FFFFFF").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var row = [
      record.id || ("FB-" + new Date().getTime()),
      record.submittedAt || new Date().toLocaleString(),
      record.studentID || "",
      record.studentName || "",
      record.email || "",
      record.classGroup || "",
      Array.isArray(record.modulesNeeded) ? record.modulesNeeded.join("; ") : (record.modulesNeeded || record.primaryModule || ""),
      record.difficultTopics || record.detailedChallenges || "",
      record.theoryVsPractical || "",
      record.revisitTopics || "",
      Array.isArray(record.practicalChallenges) ? record.practicalChallenges.join("; ") : (record.practicalChallenges || ""),
      record.confidenceExcel || record.confidenceScore || 3,
      record.confidenceSql || record.confidenceScore || 3,
      record.confidencePowerBi || record.confidenceScore || 3,
      record.confidenceScore || 3,
      record.demonstrationAreas || record.specificQuestions || "",
      record.preferredLearningApproach || "",
      record.additionalFeedback || record.suggestions || "",
      record.status || "Pending Review",
      record.coachNotes || ""
    ];

    sheet.appendRow(row);
    return { success: true, message: "Feedback saved to sheet successfully", id: record.id };
  } catch (err) {
    return { success: false, message: "Error writing to sheet: " + err.toString() };
  }
}

function getChallengeFeedbackList(targetSheetId) {
  try {
    var ss;
    if (targetSheetId && targetSheetId.toString().trim() !== "") {
      ss = SpreadsheetApp.openById(targetSheetId.toString().trim());
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    var sheet = ss.getSheetByName("Challenge_Feedback");
    if (!sheet) return { success: true, data: [] };

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { success: true, data: [] };

    var results = [];
    for (var i = 1; i < values.length; i++) {
      var r = values[i];
      results.push({
        id: r[0],
        submittedAt: r[1],
        studentID: r[2],
        studentName: r[3],
        email: r[4],
        classGroup: r[5],
        modulesNeeded: r[6] ? r[6].toString().split("; ") : [],
        difficultTopics: r[7] || "",
        theoryVsPractical: r[8] || "",
        revisitTopics: r[9] || "",
        practicalChallenges: r[10] ? r[10].toString().split("; ") : [],
        confidenceExcel: Number(r[11]) || 3,
        confidenceSql: Number(r[12]) || 3,
        confidencePowerBi: Number(r[13]) || 3,
        confidenceScore: Number(r[14]) || 3,
        demonstrationAreas: r[15] || "",
        preferredLearningApproach: r[16] || "",
        additionalFeedback: r[17] || "",
        status: r[18] || "Pending Review",
        coachNotes: r[19] || ""
      });
    }

    return { success: true, data: results };
  } catch (err) {
    return { success: false, message: err.toString(), data: [] };
  }
}

function updateFeedbackReviewStatus(feedbackId, newStatus, coachNotes, targetSheetId) {
  try {
    var ss;
    if (targetSheetId && targetSheetId.toString().trim() !== "") {
      ss = SpreadsheetApp.openById(targetSheetId.toString().trim());
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    var sheet = ss.getSheetByName("Challenge_Feedback");
    if (!sheet) return { success: false, message: "Sheet not found" };

    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] && values[i][0].toString() === feedbackId.toString()) {
        var rowNum = i + 1;
        sheet.getRange(rowNum, 19).setValue(newStatus);
        if (coachNotes !== undefined && coachNotes !== null) {
          sheet.getRange(rowNum, 20).setValue(coachNotes);
        }
        return { success: true, message: "Status updated successfully" };
      }
    }
    return { success: false, message: "Feedback ID not found: " + feedbackId };
  } catch (err) {
    return { success: false, message: "Error updating status: " + err.toString() };
  }
}
`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Top Banner & Command Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-secondary-dark to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-slate-700/60">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-brand-primary/20 text-orange-300 border border-brand-primary/40 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-brand-primary" /> ITF-NECA TSDP Revision Intelligence
              </span>
              <span className="bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                Cohort 1 · 27 Residents
              </span>
              {activeSheetId ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 font-mono">
                  <Check className="w-3 h-3 text-emerald-400" /> Connected: {activeSheetId.slice(0, 8)}...
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> Local Storage Sync
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Student Learning Needs & Revision Analytics
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed font-normal">
              Real-time breakdown of module support requests, practical challenges, and preferred revision approaches from the Student Learning Needs & Revision Feedback Form.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-white/20 flex items-center gap-2 transition-all shadow-xs"
            >
              <Settings className="w-4 h-4 text-orange-300" /> Configure Sheet ID
            </button>

            <Link
              to="/feedback"
              target="_blank"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-white/20 flex items-center gap-2 transition-all shadow-xs"
            >
              <ExternalLink className="w-4 h-4 text-blue-300" /> View Form
            </Link>

            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-white/20 flex items-center gap-2 transition-all shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-300" /> Export CSV
            </button>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1: Total Responses */}
        <div className="portal-card p-4 space-y-1.5 border-l-4 border-l-brand-primary">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Responses</span>
            <Users className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {metrics.totalResponses}
            <span className="text-xs text-slate-400 font-normal"> / {metrics.totalCohort}</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Participation:</span>
            <span className="font-bold text-brand-primary">{metrics.responseRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.responseRate, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Overall Confidence Score */}
        <div className="portal-card p-4 space-y-1.5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Confidence</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {metrics.avgConfidence}
            <span className="text-xs text-slate-400 font-normal"> / 5.0</span>
          </div>
          <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
            {Number(metrics.avgConfidence) >= 4 ? 'High Mastery' :
             Number(metrics.avgConfidence) >= 3 ? 'Moderately Confident' :
             metrics.totalResponses === 0 ? 'Awaiting Data' : 'Needs Recap'}
          </div>
        </div>

        {/* KPI 3: Top Module Needing Support */}
        <div className="portal-card p-4 space-y-1.5 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Module Need</span>
            <Flame className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-800 truncate" title={metrics.topModule}>
            {metrics.totalResponses === 0 ? '—' : metrics.topModule}
          </div>
          <div className="text-[11px] text-slate-500">
            {metrics.totalResponses === 0 ? 'Awaiting submissions' : `Flagged by ${metrics.topModuleCount} residents`}
          </div>
        </div>

        {/* KPI 4: Top Practical Challenge */}
        <div className="portal-card p-4 space-y-1.5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Challenge</span>
            <AlertTriangle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-sm font-bold text-slate-800 truncate" title={metrics.topChallenge}>
            {metrics.totalResponses === 0 ? '—' : metrics.topChallenge}
          </div>
          <div className="text-[11px] text-slate-500">
            {metrics.totalResponses === 0 ? 'Awaiting data' : `${metrics.topChallengeCount} students flagged`}
          </div>
        </div>

        {/* KPI 5: Top Preferred Approach */}
        <div className="portal-card p-4 space-y-1.5 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Approach</span>
            <BookOpen className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xs font-bold text-slate-800 truncate" title={metrics.topApproach}>
            {metrics.totalResponses === 0 ? '—' : metrics.topApproach}
          </div>
          <div className="text-[11px] text-slate-500">
            {metrics.totalResponses === 0 ? 'Awaiting data' : `${metrics.topApproachCount} votes`}
          </div>
        </div>

        {/* KPI 6: Review Action Status */}
        <div className="portal-card p-4 space-y-1.5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Review Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {feedbackList.length - metrics.pendingCount}
            <span className="text-xs text-slate-400 font-normal"> / {feedbackList.length}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-700">{feedbackList.length - metrics.pendingCount} Actioned</span> · {metrics.pendingCount} Pending
          </div>
        </div>
      </div>

      {/* Visual Charts & Breakdowns (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Q1 Module Support Breakdown */}
        <div className="portal-card space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-primary" />
                Q1. Modules Needing More Support
              </h2>
              <p className="text-xs text-brand-neutral-muted">
                Frequency of modules flagged by residents for extra revision
              </p>
            </div>
            <span className="badge-primary">{metrics.totalResponses} responses</span>
          </div>

          {metrics.totalResponses === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-600">Awaiting student submissions</p>
              <p>As students submit the form, module support frequencies will display here in real time.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {STANDARD_MODULES.map(mod => {
                const count = metrics.moduleCounts[mod] || 0;
                const pct = metrics.totalResponses > 0 ? Math.round((count / metrics.totalResponses) * 100) : 0;
                return (
                  <div key={mod} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{mod}</span>
                      <span className="font-bold text-slate-800">
                        {count} <span className="font-normal text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-primary transition-all duration-500"
                        style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Q5 Practical Challenges Encountered */}
        <div className="portal-card space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-600" />
                Q5. Practical Challenges Encountered
              </h2>
              <p className="text-xs text-brand-neutral-muted">
                Obstacles students face during exercises and projects
              </p>
            </div>
            <span className="badge-secondary">{metrics.sortedChallenges.length} categories</span>
          </div>

          {metrics.totalResponses === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-600">Awaiting student submissions</p>
              <p>Ranked breakdown of practical hurdles will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {metrics.sortedChallenges.map((item, idx) => {
                const maxCount = metrics.sortedChallenges[0]?.count || 1;
                const barWidth = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate pr-2" title={item.challenge}>
                        {item.challenge}
                      </span>
                      <span className="font-bold text-purple-700 flex-shrink-0">
                        {item.count} {item.count === 1 ? 'student' : 'students'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Secondary Row: Q6 Confidence Scale & Q8 Preferred Learning Approaches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Q6 Confidence Scale Distribution & Tool Breakdown */}
        <div className="portal-card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Q6. Application Confidence & Tool Breakdown (1 to 5)
            </h2>
            <p className="text-xs text-brand-neutral-muted">
              Self-reported practical confidence for Excel, SQL, and Power BI
            </p>
          </div>

          {/* Tool-specific confidence badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>Excel</span>
                <span>{metrics.avgExcel ? `${metrics.avgExcel} / 5` : '—'}</span>
              </div>
              <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics.avgExcel ? (Number(metrics.avgExcel) / 5) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                <span>SQL</span>
                <span>{metrics.avgSql ? `${metrics.avgSql} / 5` : '—'}</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics.avgSql ? (Number(metrics.avgSql) / 5) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span>Power BI</span>
                <span>{metrics.avgPowerBi ? `${metrics.avgPowerBi} / 5` : '—'}</span>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics.avgPowerBi ? (Number(metrics.avgPowerBi) / 5) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Overall Confidence Scale (1-5 Tiers):
            </span>
            {[
              { val: 5, label: "5 – Highly confident", color: "bg-emerald-500", text: "text-emerald-700" },
              { val: 4, label: "4 – Very confident", color: "bg-blue-500", text: "text-blue-700" },
              { val: 3, label: "3 – Moderately confident", color: "bg-amber-500", text: "text-amber-700" },
              { val: 2, label: "2 – Slightly confident", color: "bg-orange-500", text: "text-orange-700" },
              { val: 1, label: "1 – Not confident at all", color: "bg-red-500", text: "text-red-700" }
            ].map(tier => {
              const count = metrics.confidenceTiers[tier.val] || 0;
              const pct = metrics.totalResponses > 0 ? Math.round((count / metrics.totalResponses) * 100) : 0;
              return (
                <div key={tier.val} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${tier.text}`}>{tier.label}</span>
                    <span className="font-bold text-slate-800">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tier.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Q8 Preferred Learning Approaches */}
        <div className="portal-card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-secondary" />
              Q8. Preferred Revision Learning Approach
            </h2>
            <p className="text-xs text-brand-neutral-muted">
              What delivery method will help students most during round-up
            </p>
          </div>

          {metrics.totalResponses === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600">Awaiting student submissions</p>
              <p>Learning approach votes will be summarized here.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {metrics.sortedApproaches.map((item, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/70 flex items-center justify-between text-xs">
                  <span className="text-slate-800 font-semibold truncate pr-2">{item.approach}</span>
                  <span className="bg-white border border-blue-200 text-brand-secondary px-2.5 py-0.5 rounded-md font-bold flex-shrink-0">
                    {item.count} votes
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Response Explorer Table */}
      <div className="portal-card space-y-4">
        <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-primary" />
              Resident Revision Needs Explorer
            </h2>
            <p className="text-xs text-brand-neutral-muted">
              Browse submitted questionnaires, examine qualitative explanations, and track coach actions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Showing <strong className="text-slate-900">{filteredList.length}</strong> of {feedbackList.length}
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, group, topic..."
              className="form-input pl-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="All">All Modules</option>
              {STANDARD_MODULES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="All">All Confidence Levels</option>
              <option value="1">1 – Not confident at all</option>
              <option value="2">2 – Slightly confident</option>
              <option value="3">3 – Moderately confident</option>
              <option value="4">4 – Very confident</option>
              <option value="5">5 – Highly confident</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Reviewed">Reviewed / Actioned</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto pt-2">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-brand-primary flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  {feedbackList.length === 0 ? 'No Student Submissions Yet' : 'No matching feedback found'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {feedbackList.length === 0 ? (
                    <>
                      Target Google Sheet (<code className="bg-white px-1.5 py-0.5 rounded border font-mono text-slate-700">{activeSheetId ? `${activeSheetId.slice(0, 12)}...` : 'Connected'}</code>) is active and ready.
                      Share the <Link to="/feedback" target="_blank" className="text-brand-primary font-semibold underline">/feedback</Link> form link with students to start collecting live responses.
                    </>
                  ) : (
                    'Try adjusting your search query or filters above.'
                  )}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Resident</th>
                  <th className="py-3 px-3">Group</th>
                  <th className="py-3 px-3">Modules Flagged (Q1)</th>
                  <th className="py-3 px-3">Confidence (Q6)</th>
                  <th className="py-3 px-3">Preferred Approach (Q8)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                    {/* Resident */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{item.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.studentID}</div>
                    </td>

                    {/* Group */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-brand-secondary">
                        {item.classGroup || '—'}
                      </span>
                    </td>

                    {/* Modules Flagged */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(item.modulesNeeded) && item.modulesNeeded.slice(0, 3).map((m, idx) => (
                          <span key={idx} className="bg-orange-50 border border-orange-200 text-brand-primary px-2 py-0.5 rounded text-[10px] font-semibold">
                            {m}
                          </span>
                        ))}
                        {item.modulesNeeded?.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-semibold self-center">
                            +{item.modulesNeeded.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-bold">
                        <span className={item.confidenceScore <= 2 ? 'text-red-600' : 'text-slate-800'}>
                          {item.confidenceScore} / 5
                        </span>
                        <span className="text-amber-400 text-xs">★</span>
                      </div>
                    </td>

                    {/* Preferred Approach */}
                    <td className="py-3 px-3 max-w-xs truncate text-slate-600 font-medium" title={item.preferredLearningApproach}>
                      {item.preferredLearningApproach || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 transition-all ${
                          item.status === 'Reviewed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-orange-50 text-brand-primary border border-orange-200 hover:bg-orange-100'
                        }`}
                      >
                        {item.status === 'Reviewed' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Actioned
                          </>
                        ) : (
                          <>
                            <HelpCircle className="w-3 h-3 text-brand-primary" /> Pending
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetailModal(item)}
                        className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Full Response
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Target Google Sheet Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-primary flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Target Google Sheet Configuration</h3>
                  <p className="text-xs text-slate-500">Connect Challenge Feedback submissions directly to your designated spreadsheet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> {saveSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveSheetId} className="space-y-4">
              <div>
                <label className="form-label">Target Google Sheet ID:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sheetIdInput}
                    onChange={(e) => setSheetIdInput(e.target.value)}
                    placeholder="e.g. 1JW0wI8zsuxeDiDzx-HvFmJhjOzIXP5_YzfepIbqdvq0"
                    className="form-input text-xs font-mono"
                  />
                  <button type="submit" className="btn-primary text-xs px-4 py-2.5 flex-shrink-0">
                    Save Sheet ID
                  </button>
                </div>
              </div>

              {activeSheetId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-slate-500 block">Active Target Sheet:</span>
                    <span className="font-mono font-bold text-brand-secondary">{activeSheetId}</span>
                  </div>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${activeSheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0"
                  >
                    Open Sheet <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </form>

            {/* Apps Script Function Snippet */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-brand-primary" /> Google Apps Script Backend Code
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Paste this snippet into your Google Apps Script editor (<code className="bg-slate-100 px-1">Code.gs</code>) to write these 9 questions directly to your Google Sheet.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyAppsScript}
                  className="btn-outline text-xs px-3 py-1 flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-[11px] font-mono max-h-48 overflow-y-auto border border-slate-800">
                <pre>{appsScriptSnippet}</pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  clearFeedbackResponses();
                  loadData(true);
                  setSaveSuccessMsg('Local feedback cache cleared!');
                  setTimeout(() => setSaveSuccessMsg(''), 3000);
                }}
                className="text-xs text-red-600 hover:text-red-700 underline font-medium"
              >
                Clear Local Cache & Force Sync
              </button>

              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="btn-outline text-xs px-5 py-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full 9-Question Response Details Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-primary">
                    Confidence: {selectedResponse.confidenceScore || 3} / 5
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedResponse.submittedAt || selectedResponse.timestamp}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{selectedResponse.studentName}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedResponse.studentID} · <strong className="text-brand-secondary">{selectedResponse.classGroup || 'Cohort 1'}</strong> · {selectedResponse.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Q1: Modules Needing Support */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">
                1. Modules Needing More Support:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(selectedResponse.modulesNeeded) && selectedResponse.modulesNeeded.length > 0 ? (
                  selectedResponse.modulesNeeded.map((m, idx) => (
                    <span key={idx} className="bg-orange-50 border border-orange-200 text-brand-primary font-semibold text-xs px-2.5 py-1 rounded-lg">
                      {m}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None specified</span>
                )}
              </div>
            </div>

            {/* Q2: Difficult Topics */}
            {selectedResponse.difficultTopics && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  2. Specific Difficult Topics / Concepts:
                </span>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed">
                  {selectedResponse.difficultTopics}
                </div>
              </div>
            )}

            {/* Q3: Theory vs Practical Struggles */}
            {selectedResponse.theoryVsPractical && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  3. Topics Understood in Theory but Struggle to Apply:
                </span>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed">
                  {selectedResponse.theoryVsPractical}
                </div>
              </div>
            )}

            {/* Q4: Topics to Revisit in Revision */}
            {selectedResponse.revisitTopics && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  4. Topics to Revisit During Revision Classes:
                </span>
                <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80 text-xs text-blue-950 font-medium leading-relaxed">
                  {selectedResponse.revisitTopics}
                </div>
              </div>
            )}

            {/* Q5: Practical Challenges */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                5. Practical Exercise & Project Challenges:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(selectedResponse.practicalChallenges) && selectedResponse.practicalChallenges.length > 0 ? (
                  selectedResponse.practicalChallenges.map((c, idx) => (
                    <span key={idx} className="bg-purple-50 border border-purple-200 text-purple-800 text-xs px-2.5 py-1 rounded-lg font-medium">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None specified</span>
                )}
              </div>
            </div>

            {/* Q6: Confidence Rating with Tool Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                6. Practical Confidence per Core Tool:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">Excel:</span>
                  <span className="font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {selectedResponse.confidenceExcel || selectedResponse.confidenceScore || 3} / 5
                  </span>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900">SQL:</span>
                  <span className="font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {selectedResponse.confidenceSql || selectedResponse.confidenceScore || 3} / 5
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-950">Power BI:</span>
                  <span className="font-black text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                    {selectedResponse.confidencePowerBi || selectedResponse.confidenceScore || 3} / 5
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Overall Avg: <strong>{selectedResponse.confidenceScore || 3} / 5</strong></span>
                <span>•</span>
                <span>Tier: <strong>{selectedResponse.confidenceLabel || 'Logged'}</strong></span>
              </div>
            </div>

            {/* Q7: Step-by-Step Demonstration Requests */}
            {selectedResponse.demonstrationAreas && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  7. Step-by-Step Demonstration Requests:
                </span>
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 text-xs text-amber-950 font-medium">
                  {selectedResponse.demonstrationAreas}
                </div>
              </div>
            )}

            {/* Q8: Preferred Learning Approach */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                8. Preferred Revision Learning Approach:
              </span>
              <div className="bg-teal-50 text-teal-900 border border-teal-200 p-2.5 rounded-xl text-xs font-semibold">
                {selectedResponse.preferredLearningApproach || 'Step-by-step practical demonstrations'}
              </div>
            </div>

            {/* Q9: Additional Feedback / Experience */}
            {selectedResponse.additionalFeedback && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  9. Additional Notes & Learning Experience Feedback:
                </span>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 italic">
                  "{selectedResponse.additionalFeedback}"
                </div>
              </div>
            )}

            {/* Coach Actions & Notes */}
            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                  Instructor Revision Notes:
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedResponse)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                    selectedResponse.status === 'Reviewed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:border-brand-primary'
                  }`}
                >
                  {selectedResponse.status === 'Reviewed' ? '✓ Mark as Pending' : 'Mark as Actioned / Reviewed'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={coachNoteInput}
                  onChange={(e) => setCoachNoteInput(e.target.value)}
                  placeholder="e.g. Schedule DAX time intelligence walkthrough for Friday clinic..."
                  className="form-input text-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveCoachNote}
                  disabled={savingNote}
                  className="btn-primary text-xs px-3.5 py-2.5 flex-shrink-0"
                >
                  {savingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="btn-outline text-xs px-5 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
