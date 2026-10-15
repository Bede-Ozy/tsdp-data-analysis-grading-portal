import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitChallengeFeedback, getAllStudents, getAllClassGroups, getFeedbackSheetId } from '../../services/api';
import {
  HelpCircle,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Send,
  Star,
  Check,
  RefreshCw,
  ExternalLink,
  Info,
  Layers,
  FileText,
  UserCheck
} from 'lucide-react';

const MODULE_OPTIONS = [
  "Excel",
  "SQL",
  "Power BI",
  "Data Analysis and Storytelling",
  "Data Visualization",
  "Other"
];

const CHALLENGE_OPTIONS = [
  "Understanding the task requirements",
  "Remembering the syntax or formulas",
  "Writing queries or code independently",
  "Choosing the right functions or tools",
  "Debugging errors and solving problems",
  "Interpreting results and drawing insights",
  "Creating effective visualizations",
  "Explaining my findings or presenting my work",
  "Other"
];

const CONFIDENCE_LEVELS = [
  { val: 1, label: "Not confident at all", desc: "Need significant guidance and recap" },
  { val: 2, label: "Slightly confident", desc: "Understand basic concepts but get stuck often" },
  { val: 3, label: "Moderately confident", desc: "Can solve problems with references and help" },
  { val: 4, label: "Very confident", desc: "Able to work independently on most exercises" },
  { val: 5, label: "Highly confident", desc: "Strong practical mastery and ready for industry" }
];

const LEARNING_APPROACH_OPTIONS = [
  "A recap of concepts and theory",
  "Step-by-step practical demonstrations",
  "Guided hands-on exercises",
  "Working through errors and troubleshooting",
  "Real-world case studies and projects",
  "A combination of these approaches"
];

const FALLBACK_CLASS_GROUPS = [
  'Insight Makers',
  'StratIQ',
  'Team Royal',
  'Tech Elite'
];

export default function ChallengeFeedback() {
  const { user, role, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Cohort Students & Groups list for auto-fill
  const [allCohortStudents, setAllCohortStudents] = useState([]);
  const [availableGroups, setAvailableGroups] = useState(FALLBACK_CLASS_GROUPS);
  const [loadingCohort, setLoadingCohort] = useState(false);

  // Resident Identity (Required)
  const [studentID, setStudentID] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [classGroup, setClassGroup] = useState('');

  // Question 1: Modules needing support (Checkboxes - Required)
  const [selectedModules, setSelectedModules] = useState([]);
  const [otherModuleText, setOtherModuleText] = useState('');

  // Question 2: Specific topics/concepts difficult to understand (Paragraph - Required)
  const [difficultTopics, setDifficultTopics] = useState('');

  // Question 3: Topics understood in theory but struggle to apply practically (Paragraph - Required)
  const [theoryVsPractical, setTheoryVsPractical] = useState('');

  // Question 4: Topics to revisit during revision classes (Paragraph - Required)
  const [revisitTopics, setRevisitTopics] = useState('');

  // Question 5: Challenges encountered on practical exercises/projects (Checkboxes - Required)
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [otherChallengeText, setOtherChallengeText] = useState('');

  // Question 6: Confidence per module (Excel, SQL, Power BI - Linear scale 1-5 - Required)
  const [confidenceExcel, setConfidenceExcel] = useState(null);
  const [confidenceSql, setConfidenceSql] = useState(null);
  const [confidencePowerBi, setConfidencePowerBi] = useState(null);

  // Question 7: Areas you would most like coaches to demonstrate step by step (Paragraph - Required)
  const [demonstrationAreas, setDemonstrationAreas] = useState('');

  // Question 8: Learning approach that would help most (Multiple Choice - Required)
  const [learningApproach, setLearningApproach] = useState('');

  // Question 9: Anything else for coaches / learning experience (Paragraph - Required)
  const [additionalFeedback, setAdditionalFeedback] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [syncWarning, setSyncWarning] = useState('');
  const [isNotAllowed, setIsNotAllowed] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  // Connected Sheet ID
  const targetSheetId = getFeedbackSheetId();

  // Load available class groups
  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await getAllClassGroups();
        const list = Array.isArray(res) ? res : (res?.data || res?.groups || []);
        if (list && list.length > 0) {
          setAvailableGroups(list);
        }
      } catch (e) {
        // use fallback groups
      }
    }
    fetchGroups();
  }, []);

  // Pre-populate if logged in as student
  useEffect(() => {
    if (user && role === 'student') {
      const cleanNum = String(user.studentNumber || '').padStart(3, '0');
      setStudentNumber(cleanNum);
      setStudentID(user.studentID || `TSDP2026-RES-${cleanNum}`);
      setStudentName(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || `Resident ${cleanNum}`);
      setEmail(user.email || '');
      
      const realGroup = user.classGroup || user.group || user.capstoneGroup || '';
      if (realGroup) setClassGroup(realGroup);
    }
  }, [user, role]);

  // Load cohort students roster for quick fill if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      async function loadRoster() {
        setLoadingCohort(true);
        try {
          const res = await getAllStudents();
          const list = Array.isArray(res) ? res : (res?.data || res?.students || []);
          if (list && list.length > 0) {
            setAllCohortStudents(list);
            // Collect any unique groups present in the roster
            const uniqueGroups = Array.from(new Set(list.map(s => s.classGroup || s.capstoneGroup).filter(Boolean)));
            if (uniqueGroups.length > 0) {
              setAvailableGroups(uniqueGroups);
            }
          }
        } catch (err) {
          console.warn('Could not load student roster:', err);
        } finally {
          setLoadingCohort(false);
        }
      }
      loadRoster();
    }
  }, [isAuthenticated]);

  // Handle selecting a student from the cohort dropdown
  const handleSelectCohortStudent = (e) => {
    const sId = e.target.value;
    if (!sId) return;
    const found = allCohortStudents.find(s => s.studentID === sId || s.studentNumber === sId);
    if (found) {
      const cleanNum = String(found.studentNumber || '').padStart(3, '0');
      setStudentID(found.studentID || `TSDP2026-RES-${cleanNum}`);
      setStudentNumber(cleanNum);
      setStudentName(found.name || `${found.firstName || ''} ${found.lastName || ''}`.trim() || `Resident ${cleanNum}`);
      setEmail(found.email || `student${Number(cleanNum)}@shamzbridge.com`);
      
      // Map their actual group directly from the database record!
      const actualGroup = found.classGroup || found.capstoneGroup || found.group || '';
      setClassGroup(actualGroup);
    }
  };

  // Toggle Module Checkbox (Q1)
  const toggleModule = (mod) => {
    setSelectedModules(prev =>
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  // Toggle Challenge Checkbox (Q5)
  const toggleChallenge = (ch) => {
    setSelectedChallenges(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Required Resident Info
    if (!studentID.trim()) {
      setErrorMessage('Please provide your Student ID / Resident Number.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!studentName.trim()) {
      setErrorMessage('Please enter your full name or select your resident ID.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!classGroup.trim()) {
      setErrorMessage('Please select or specify your Student Group.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Question 1: Checkboxes (Required)
    if (selectedModules.length === 0) {
      setErrorMessage('Question 1 is required: Please select at least one module you need support with.');
      return;
    }
    if (selectedModules.includes('Other') && !otherModuleText.trim()) {
      setErrorMessage('Question 1: Please specify your "Other" module in the text field.');
      return;
    }

    // Question 2: Paragraph (Required)
    if (!difficultTopics.trim()) {
      setErrorMessage('Question 2 is required: Please mention specific topics or concepts you find difficult to understand.');
      return;
    }

    // Question 3: Paragraph (Required)
    if (!theoryVsPractical.trim()) {
      setErrorMessage('Question 3 is required: Please mention topics you understand in theory but struggle to apply practically.');
      return;
    }

    // Question 4: Paragraph (Required)
    if (!revisitTopics.trim()) {
      setErrorMessage('Question 4 is required: Please list the topics you would like us to revisit during revision classes.');
      return;
    }

    // Question 5: Checkboxes (Required)
    if (selectedChallenges.length === 0) {
      setErrorMessage('Question 5 is required: Please select at least one challenge you encounter on practical exercises.');
      return;
    }
    if (selectedChallenges.includes('Other') && !otherChallengeText.trim()) {
      setErrorMessage('Question 5: Please specify your "Other" practical challenge in the text field.');
      return;
    }

    // Question 6: Sections for Excel, SQL, and Power BI (Required)
    if (!confidenceExcel) {
      setErrorMessage('Question 6 is required: Please rate your practical confidence for Microsoft Excel (1–5).');
      return;
    }
    if (!confidenceSql) {
      setErrorMessage('Question 6 is required: Please rate your practical confidence for SQL (1–5).');
      return;
    }
    if (!confidencePowerBi) {
      setErrorMessage('Question 6 is required: Please rate your practical confidence for Power BI (1–5).');
      return;
    }

    // Question 7: Paragraph (Required)
    if (!demonstrationAreas.trim()) {
      setErrorMessage('Question 7 is required: Please state which areas you would most like coaches to demonstrate step by step.');
      return;
    }

    // Question 8: Multiple Choice (Required)
    if (!learningApproach.trim()) {
      setErrorMessage('Question 8 is required: Please choose what learning approach would help you most.');
      return;
    }

    // Question 9: Paragraph (Required)
    if (!additionalFeedback.trim()) {
      setErrorMessage('Question 9 is required: Please share any additional notes for the coaches (or write "None" if you have no further comments).');
      return;
    }

    setSubmitting(true);

    // Format modules with custom 'Other' if provided
    let finalModules = [...selectedModules];
    if (selectedModules.includes('Other') && otherModuleText.trim()) {
      finalModules = finalModules.map(m => m === 'Other' ? `Other: ${otherModuleText.trim()}` : m);
    }

    // Format challenges with custom 'Other' if provided
    let finalChallenges = [...selectedChallenges];
    if (selectedChallenges.includes('Other') && otherChallengeText.trim()) {
      finalChallenges = finalChallenges.map(c => c === 'Other' ? `Other: ${otherChallengeText.trim()}` : c);
    }

    const avgConfidence = Number(
      (((Number(confidenceExcel) || 3) + (Number(confidenceSql) || 3) + (Number(confidencePowerBi) || 3)) / 3).toFixed(1)
    );

    const payload = {
      studentID: studentID || `TSDP2026-RES-${studentNumber ? studentNumber.padStart(3, '0') : '001'}`,
      studentNumber: studentNumber || (studentID.replace(/\D/g, '').slice(-3) || '001'),
      studentName: studentName.trim(),
      email: email.trim(),
      classGroup: classGroup.trim(),
      modulesNeeded: finalModules,
      difficultTopics: difficultTopics.trim(),
      theoryVsPractical: theoryVsPractical.trim(),
      revisitTopics: revisitTopics.trim(),
      practicalChallenges: finalChallenges,
      confidenceExcel: Number(confidenceExcel),
      confidenceSql: Number(confidenceSql),
      confidencePowerBi: Number(confidencePowerBi),
      confidenceScore: avgConfidence,
      confidenceLabel: avgConfidence >= 4 ? 'High Confidence' : (avgConfidence >= 3 ? 'Moderate Confidence' : 'Needs Support'),
      demonstrationAreas: demonstrationAreas.trim(),
      preferredLearningApproach: learningApproach.trim(),
      additionalFeedback: additionalFeedback.trim(),
      urgency: (Number(confidenceExcel) <= 2 || Number(confidenceSql) <= 2 || Number(confidencePowerBi) <= 2 || avgConfidence <= 2.5) ? 'Urgent' : (avgConfidence <= 3.5 ? 'Important' : 'Normal')
    };

    try {
      const res = await submitChallengeFeedback(payload);
      if (res && res.success && res.savedToSheet) {
        setSubmittedData(payload);
        setSubmitSuccess(true);
        setSyncWarning('');
        setIsNotAllowed(false);
        setPendingPayload(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (res && res.savedLocally && !res.savedToSheet) {
        setPendingPayload(payload);
        setIsNotAllowed(Boolean(res.isNotAllowed));
        setSyncWarning(
          res.isNotAllowed
            ? 'Saved locally on this device, but NOT recorded in Google Sheet: The backend Google Apps Script returned "Function not allowed: submitChallengeFeedback". The Apps Script project needs to be updated with the backend handler.'
            : (res.message || 'Saved locally on this device, but could not connect to Google Sheet.')
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(res?.message || 'Failed to submit feedback. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while saving your feedback.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetrySync = async () => {
    if (!pendingPayload) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await submitChallengeFeedback(pendingPayload);
      if (res && res.success && res.savedToSheet) {
        setSubmittedData(pendingPayload);
        setSubmitSuccess(true);
        setSyncWarning('');
        setIsNotAllowed(false);
        setPendingPayload(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSyncWarning(
          res?.isNotAllowed
            ? 'Google Apps Script still returned "Function not allowed: submitChallengeFeedback". Please ensure you have added the function to Code.gs and deployed as a "New version".'
            : (res?.message || 'Sync failed. Please try again.')
        );
      }
    } catch (err) {
      setSyncWarning(err.message || 'Error retrying sync.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmitSuccess(false);
    setSubmittedData(null);
    setSelectedModules([]);
    setOtherModuleText('');
    setDifficultTopics('');
    setTheoryVsPractical('');
    setRevisitTopics('');
    setSelectedChallenges([]);
    setOtherChallengeText('');
    setConfidenceExcel(null);
    setConfidenceSql(null);
    setConfidencePowerBi(null);
    setDemonstrationAreas('');
    setLearningApproach('');
    setAdditionalFeedback('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-fade-in font-sans">
      {/* Official Form Header */}
      <div className="bg-gradient-to-r from-[#003E7E] via-brand-secondary to-[#0054A6] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-blue-400/20 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-white/15 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" /> ITF-NECA TSDP Data Analytics Program
            </span>
            {targetSheetId && (
              <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 font-mono">
                <Check className="w-3 h-3 text-emerald-300" /> Live Sheet Connected
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Student Learning Needs & Revision Feedback Form
          </h1>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs sm:text-sm text-blue-50 leading-relaxed space-y-2">
            <p>
              As we approach the final phase of our training, we want to understand the topics and concepts you need more support with.
              Your responses will help us structure our revision sessions around your learning needs, clarify difficult concepts, and strengthen your practical skills.
            </p>
            <p className="font-semibold text-orange-200">
              Please be honest and specific. This is not an assessment; it is an opportunity to tell us how we can better support your learning.
            </p>
          </div>

          {(role === 'coach' || role === 'admin') && (
            <div className="pt-1 flex justify-end">
              <Link
                to={role === 'coach' ? '/coach/feedback-analytics' : '/admin/feedback-analytics'}
                className="bg-white/20 hover:bg-white/30 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                Go to Feedback Analytics Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Success Confirmation Modal */}
      {submitSuccess && submittedData && (
        <div className="portal-card bg-emerald-50 border-emerald-300 p-6 sm:p-8 space-y-4 shadow-lg animate-scale-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-xl font-bold text-emerald-950">
                Thank you, {submittedData.studentName}! Your responses have been submitted.
              </h2>
              <p className="text-sm text-emerald-800 leading-relaxed">
                Your feedback has been logged to the coaching team database. The instructors are tailoring the upcoming revision classes and practical walkthroughs to address your specific requests.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block font-medium">Resident ID:</span>
                <span className="font-bold text-slate-800">{submittedData.studentID}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Group:</span>
                <span className="font-bold text-brand-secondary">{submittedData.classGroup || 'Cohort 1'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Overall Avg Confidence:</span>
                <span className="font-bold text-slate-800">{submittedData.confidenceScore} / 5</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Modules Flagged:</span>
                <span className="font-bold text-brand-primary">{submittedData.modulesNeeded?.length || 0}</span>
              </div>
            </div>

            {/* Individual tool breakdown */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span className="font-medium text-[11px]">Excel Confidence:</span>
                <span className="font-bold">{submittedData.confidenceExcel} / 5</span>
              </div>
              <div className="bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span className="font-medium text-[11px]">SQL Confidence:</span>
                <span className="font-bold">{submittedData.confidenceSql} / 5</span>
              </div>
              <div className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span className="font-medium text-[11px]">Power BI Confidence:</span>
                <span className="font-bold">{submittedData.confidencePowerBi} / 5</span>
              </div>
            </div>

            {submittedData.modulesNeeded?.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                {submittedData.modulesNeeded.map((m, i) => (
                  <span key={i} className="bg-orange-50 text-brand-primary border border-orange-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="btn-outline text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Submit Another Response / Edit
            </button>

            {role === 'student' ? (
              <Link to="/student/dashboard" className="btn-primary text-xs px-4 py-2">
                Return to Resident Dashboard
              </Link>
            ) : (
              <Link to="/coach/feedback-analytics" className="btn-primary text-xs px-4 py-2">
                View Feedback Analytics Dashboard
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Questionnaire Form */}
      {!submitSuccess && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {syncWarning && (
            <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 p-5 rounded-2xl space-y-3 shadow-sm animate-scale-up">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <h4 className="font-bold text-amber-950">
                    Response Saved Locally — Google Sheet Sync Pending
                  </h4>
                  <p className="leading-relaxed text-amber-900 text-xs sm:text-sm">
                    {syncWarning}
                  </p>
                </div>
              </div>

              {isNotAllowed && (
                <div className="bg-white/90 border border-amber-200 p-3.5 rounded-xl text-xs space-y-2 text-slate-700">
                  <p className="font-semibold text-slate-900">
                    Why did this happen?
                  </p>
                  <p className="leading-relaxed">
                    The portal tried to post to your Google Sheet Web App, but your deployed Google Apps Script does not have the <code className="bg-slate-100 text-amber-800 font-mono px-1 py-0.5 rounded font-bold">submitChallengeFeedback</code> function in its router switch statement yet.
                  </p>
                  <p className="leading-relaxed">
                    A ready-to-use Google Apps Script extension file is available in <code className="bg-slate-100 text-brand-primary font-mono px-1 py-0.5 rounded font-bold">google-apps-script/ChallengeFeedback_GAS.gs</code>. Once added to Apps Script and deployed as a New Version, click the button below to sync immediately without having to re-enter anything:
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleRetrySync}
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
                  {submitting ? 'Retrying Sheet Sync...' : 'Retry Syncing to Google Sheet Now'}
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Student Identity Information Card */}
          <div className="portal-card space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-brand-primary" />
                  Resident Information
                </h2>
                <p className="text-xs text-brand-neutral-muted">
                  Confirm your identity and group so coaches know who is submitting
                </p>
              </div>

              {isAuthenticated && role === 'student' && (
                <span className="badge-primary flex items-center gap-1">
                  <Check className="w-3 h-3" /> Logged In
                </span>
              )}
            </div>

            {/* If not logged in, provide 1-click select from cohort roster */}
            {!isAuthenticated && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                <label className="form-label flex items-center justify-between">
                  <span>Quick Select from Resident Roster:</span>
                  <span className="text-[11px] text-slate-400 font-normal">Auto-fills your ID and Group</span>
                </label>
                <select
                  onChange={handleSelectCohortStudent}
                  className="form-select bg-white text-xs font-medium text-slate-700"
                  defaultValue=""
                >
                  <option value="" disabled>-- Select your name or Student ID --</option>
                  {allCohortStudents.map((s) => (
                    <option key={s.studentID} value={s.studentID}>
                      {s.studentID} · {s.name || `Resident ${s.studentNumber}`} {s.classGroup ? `(${s.classGroup})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="form-label">Student ID / Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={studentID}
                  onChange={(e) => {
                    setStudentID(e.target.value);
                    const digits = e.target.value.replace(/\D/g, '');
                    if (digits) setStudentNumber(digits.slice(-3));
                  }}
                  placeholder="TSDP2026-RES-001"
                  required
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@shamzbridge.com"
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="form-label">
                  Student Group <span className="text-red-500">*</span>
                </label>
                {/* Dynamically populate actual class groups or allow typing */}
                <input
                  type="text"
                  value={classGroup}
                  onChange={(e) => setClassGroup(e.target.value)}
                  placeholder="e.g. Insight Makers, StratIQ..."
                  list="group-options-list"
                  required
                  className="form-input text-xs font-semibold text-brand-secondary"
                />
                <datalist id="group-options-list">
                  {availableGroups.map((grp, i) => (
                    <option key={i} value={grp} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Question 1: Checkboxes */}
          <div className="portal-card space-y-3">
            <div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Question 1 <span className="text-red-500">*</span></span>
              <h2 className="text-base font-bold text-slate-800">
                Which module(s) do you need more support with? <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">Check all that apply</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {MODULE_OPTIONS.map((mod, idx) => {
                const isChecked = selectedModules.includes(mod);
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-brand-primary bg-orange-50/50 text-slate-900 font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleModule(mod)}
                      className="rounded text-brand-primary focus:ring-brand-primary h-4 w-4"
                    />
                    <span className="text-xs">{mod}</span>
                  </label>
                );
              })}
            </div>

            {selectedModules.includes('Other') && (
              <div className="pt-2 animate-fade-in">
                <input
                  type="text"
                  value={otherModuleText}
                  onChange={(e) => setOtherModuleText(e.target.value)}
                  placeholder="Please specify other module or tool..."
                  required
                  className="form-input text-xs"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Question 2: Paragraph */}
          <div className="portal-card space-y-2">
            <div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Question 2 <span className="text-red-500">*</span></span>
              <h2 className="text-base font-bold text-slate-800">
                Which specific topics or concepts do you find difficult to understand? <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">
                Please mention the particular topics you would like us to explain again.
              </p>
            </div>

            <textarea
              rows={3}
              required
              value={difficultTopics}
              onChange={(e) => setDifficultTopics(e.target.value)}
              placeholder="e.g. SQL Window Functions, DAX CALCULATE filter context, Excel XLOOKUP/INDEX-MATCH and nested logic..."
              className="form-input text-xs resize-y"
            />
          </div>

          {/* Question 3: Paragraph */}
          <div className="portal-card space-y-2">
            <div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Question 3 <span className="text-red-500">*</span></span>
              <h2 className="text-base font-bold text-slate-800">
                Are there any topics you understand in theory but struggle to apply practically? <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">
                If yes, mention the topic and briefly describe where you get stuck.
              </p>
            </div>

            <textarea
              rows={3}
              required
              value={theoryVsPractical}
              onChange={(e) => setTheoryVsPractical(e.target.value)}
              placeholder="e.g. I understand star schema conceptually, but when building relationships in Power BI I struggle with many-to-many relationships and inactive joins..."
              className="form-input text-xs resize-y"
            />
          </div>

          {/* Question 4: Paragraph */}
          <div className="portal-card space-y-2">
            <div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Question 4 <span className="text-red-500">*</span></span>
              <h2 className="text-base font-bold text-slate-800">
                Which topics would you like us to revisit during the revision classes? <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">
                List any lessons, concepts, or practical exercises you would like us to go through again.
              </p>
            </div>

            <textarea
              rows={3}
              required
              value={revisitTopics}
              onChange={(e) => setRevisitTopics(e.target.value)}
              placeholder="e.g. Week 4 complex SQL joins lab, Week 7 DAX time intelligence exercises, Excel financial/statistical modeling..."
              className="form-input text-xs resize-y"
            />
          </div>

          {/* Question 5: Checkboxes */}
          <div className="portal-card space-y-3">
            <div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Question 5 <span className="text-red-500">*</span></span>
              <h2 className="text-base font-bold text-slate-800">
                What challenges do you encounter when working on practical exercises or projects? <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">Check all that apply</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {CHALLENGE_OPTIONS.map((ch, idx) => {
                const isChecked = selectedChallenges.includes(ch);
                return (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-brand-primary bg-orange-50/50 text-slate-900 font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleChallenge(ch)}
                      className="mt-0.5 rounded text-brand-primary focus:ring-brand-primary h-4 w-4"
                    />
                    <span className="text-xs leading-relaxed">{ch}</span>
                  </label>
                );
              })}
            </div>

            {selectedChallenges.includes('Other') && (
              <div className="pt-2 animate-fade-in">
                <input
                  type="text"
                  value={otherChallengeText}
                  onChange={(e) => setOtherChallengeText(e.target.value)}
                  placeholder="Please specify other practical challenges..."
                  required
                  className="form-input text-xs"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Question 6: Sections for Excel, SQL, and Power BI */}
          <div className="portal-card space-y-5">
            <div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Question 6 <span className="text-red-500">*</span></span>
              <h2 className="text-base font-bold text-slate-800">
                How confident are you in applying what you have learned so far? <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">
                Linear scale (1 = Not confident at all, 5 = Highly confident). Please rate your practical confidence for each core tool:
              </p>
            </div>

            <div className="space-y-4">
              {/* Section 1: Microsoft Excel */}
              <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      X
                    </span>
                    <span className="text-sm font-bold text-slate-800">1. Microsoft Excel</span>
                    <span className="text-red-500 font-bold text-xs">*</span>
                  </div>
                  {confidenceExcel ? (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      Score: {confidenceExcel} / 5 — {CONFIDENCE_LEVELS.find(c => c.val === confidenceExcel)?.label}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                  {CONFIDENCE_LEVELS.map((tier) => (
                    <button
                      key={tier.val}
                      type="button"
                      onClick={() => setConfidenceExcel(tier.val)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        confidenceExcel === tier.val
                          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30 font-bold'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        confidenceExcel === tier.val ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {tier.val}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">{tier.label}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{tier.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: SQL (Database Querying) */}
              <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-200/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      S
                    </span>
                    <span className="text-sm font-bold text-slate-800">2. SQL (Database Querying)</span>
                    <span className="text-red-500 font-bold text-xs">*</span>
                  </div>
                  {confidenceSql ? (
                    <span className="text-xs font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-full">
                      Score: {confidenceSql} / 5 — {CONFIDENCE_LEVELS.find(c => c.val === confidenceSql)?.label}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                  {CONFIDENCE_LEVELS.map((tier) => (
                    <button
                      key={tier.val}
                      type="button"
                      onClick={() => setConfidenceSql(tier.val)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        confidenceSql === tier.val
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/30 font-bold'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        confidenceSql === tier.val ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {tier.val}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">{tier.label}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{tier.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: Power BI */}
              <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      P
                    </span>
                    <span className="text-sm font-bold text-slate-800">3. Power BI (Data Modeling & Dashboards)</span>
                    <span className="text-red-500 font-bold text-xs">*</span>
                  </div>
                  {confidencePowerBi ? (
                    <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      Score: {confidencePowerBi} / 5 — {CONFIDENCE_LEVELS.find(c => c.val === confidencePowerBi)?.label}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                  {CONFIDENCE_LEVELS.map((tier) => (
                    <button
                      key={tier.val}
                      type="button"
                      onClick={() => setConfidencePowerBi(tier.val)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        confidencePowerBi === tier.val
                          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/30 font-bold'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        confidencePowerBi === tier.val ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {tier.val}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">{tier.label}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{tier.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Question 7: Paragraph */}
          <div className="portal-card space-y-2">
            <div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Question 7 <span className="text-red-500">*</span></span>
              <h2 className="text-base font-bold text-slate-800">
                Which areas would you most like the coaches to demonstrate step by step during revision? <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">
                You may include a formula, query, function, visualization, or practical task you want us to demonstrate.
              </p>
            </div>

            <textarea
              rows={3}
              required
              value={demonstrationAreas}
              onChange={(e) => setDemonstrationAreas(e.target.value)}
              placeholder="e.g. Can the coach walk us through building a dynamic Pareto chart in Power BI, or solving a live interview-style SQL window query?"
              className="form-input text-xs resize-y"
            />
          </div>

          {/* Question 8: Multiple Choice */}
          <div className="portal-card space-y-3">
            <div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Question 8 <span className="text-red-500">*</span></span>
              <h2 className="text-base font-bold text-slate-800">
                What learning approach would help you most during the revision sessions? <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">Select your primary preferred approach</p>
            </div>

            <div className="space-y-2 pt-1">
              {LEARNING_APPROACH_OPTIONS.map((approach, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    learningApproach === approach
                      ? 'border-brand-secondary bg-blue-50/60 text-slate-900 font-semibold ring-1 ring-brand-secondary/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <input
                    type="radio"
                    name="learningApproachRadio"
                    required
                    checked={learningApproach === approach}
                    onChange={() => setLearningApproach(approach)}
                    className="text-brand-secondary focus:ring-brand-secondary h-4 w-4"
                  />
                  <span className="text-xs">{approach}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question 9: Paragraph */}
          <div className="portal-card space-y-2">
            <div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Question 9 <span className="text-red-500">*</span></span>
              <h2 className="text-base font-bold text-slate-800">
                Is there anything else you would like the coaches to know about your learning experience or an area where you need additional support? <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">
                Share any additional thoughts, feedback, or personal learning needs (or enter "None" if you have no further comments).
              </p>
            </div>

            <textarea
              rows={3}
              required
              value={additionalFeedback}
              onChange={(e) => setAdditionalFeedback(e.target.value)}
              placeholder="Share any additional thoughts or personal notes for the coaches (or type 'None')..."
              className="form-input text-xs resize-y"
            />
          </div>

          {/* Submit Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <span>Your responses will directly shape the revision clinic timetable.</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full sm:w-auto px-8 py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-orange-glow transition-all"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Responses...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Feedback Form
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
