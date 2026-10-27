import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitEndOfProgrammeFeedback, getEndOfProgrammeFeedbackList, getAllStudents } from '../services/api';
import CustomSelect from '../components/CustomSelect';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
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
  UserCheck,
  Share2,
  Printer,
  ChevronDown,
  Eye,
  Sliders,
  HelpCircle,
  TrendingUp,
  Award,
  ShieldCheck,
  ThumbsUp,
  RotateCcw,
  MessageSquare,
  BarChart3,
  Copy,
  ChevronRight,
  CheckSquare,
  X
} from 'lucide-react';

// ============================================================================
// FORM CONSTANTS & QUESTION DEFINITIONS
// ============================================================================

const LIKERT_5_SCALE = [
  { val: 1, label: 'Strongly disagree', short: 'SD', color: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' },
  { val: 2, label: 'Disagree', short: 'D', color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
  { val: 3, label: 'Neither agree nor disagree', short: 'N', color: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' },
  { val: 4, label: 'Agree', short: 'A', color: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100' },
  { val: 5, label: 'Strongly agree', short: 'SA', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
];

const OVERALL_RATING_OPTIONS = [
  { val: 'Excellent', desc: 'Outstanding quality, exceeded all benchmarks', icon: '🌟' },
  { val: 'Very good', desc: 'High standard, delivered exceptional value', icon: '✨' },
  { val: 'Good', desc: 'Satisfactory and solid learning experience', icon: '👍' },
  { val: 'Fair', desc: 'Adequate but notable areas need improvement', icon: '⚖️' },
  { val: 'Poor', desc: 'Did not meet core expectations or standards', icon: '⚠️' },
];

const EXPECTATION_OPTIONS = [
  { val: 'Exceeded my expectations', desc: 'Delivered significantly more than anticipated', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { val: 'Met my expectations', desc: 'Covered what was promised and intended', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  { val: 'Partially met my expectations', desc: 'Met some requirements, fell short in others', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { val: 'Fell below my expectations', desc: 'Significantly missed key expectations', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const SKILL_GRID_ROWS = [
  { id: 'excel', label: 'Excel for data analysis', desc: 'Formulas, pivot tables, data modeling & reporting' },
  { id: 'sql', label: 'SQL for data querying and analysis', desc: 'Joins, aggregations, window functions & CTEs' },
  { id: 'powerBi', label: 'Power BI for data modelling and visualisation', desc: 'Data modeling, DAX measures, interactive dashboards' },
  { id: 'breakdown', label: 'Breaking down business problems into analytical steps', desc: 'Structuring problems, metrics selection, project roadmaps' },
  { id: 'communication', label: 'Interpreting findings and communicating insights', desc: 'Executive storytelling, presentations & stakeholder comms' },
  { id: 'independent', label: 'Working independently on practical data tasks', desc: 'Self-driven debugging, workflow execution & deliverables' },
];

const SKILL_GRID_COLUMNS = [
  { val: 'Much lower', short: 'Much Lower', color: 'text-rose-600' },
  { val: 'Slightly lower', short: 'Slightly Lower', color: 'text-orange-600' },
  { val: 'About the same', short: 'About Same', color: 'text-slate-600' },
  { val: 'Slightly higher', short: 'Slightly Higher', color: 'text-teal-600' },
  { val: 'Much higher', short: 'Much Higher', color: 'text-emerald-600' },
];

const PREPAREDNESS_OPTIONS = [
  { val: 'Very prepared', label: 'Very prepared', desc: 'Confident to tackle end-to-end industry briefs independently' },
  { val: 'Somewhat prepared', label: 'Somewhat prepared', desc: 'Can handle tasks with standard documentation and mentorship' },
  { val: 'Neither prepared nor unprepared', label: 'Neither prepared nor unprepared', desc: 'Neutral, requires structured environment' },
  { val: 'Slightly unprepared', label: 'Slightly unprepared', desc: 'Feel hesitation on complex business projects' },
  { val: 'Not prepared at all', label: 'Not prepared at all', desc: 'Require comprehensive additional training' },
];

const SUPPORT_NEED_AREAS = [
  'Excel',
  'SQL',
  'Power BI',
  'Analytical thinking and problem-solving',
  'Data visualisation and storytelling',
  'Presenting and communicating findings',
  'Portfolio development and real-world projects',
  'Job readiness and professional development',
  'Other',
];

const FALLBACK_CLASS_GROUPS = [
  'Insight Makers',
  'StratIQ',
  'Team Royal',
  'Tech Elite',
  'General Resident Cohort'
];

export default function EndOfProgrammeFeedback({ inPortal: propInPortal }) {
  const { user, role, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inPortal = Boolean(propInPortal || location.pathname.startsWith('/student'));

  // Logo fallback state
  const [logoErrors, setLogoErrors] = useState({});
  const handleLogoError = (key) => setLogoErrors(prev => ({ ...prev, [key]: true }));

  // Review & Evaluation Management Mode state
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [cohortStudentsList, setCohortStudentsList] = useState([]);
  const [toastMessage, setToastToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastToastMessage(msg);
    setTimeout(() => setToastToastMessage(''), 3500);
  };

  // --------------------------------------------------------------------------
  // Form State
  // --------------------------------------------------------------------------
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentID, setStudentID] = useState('');
  const [classGroup, setClassGroup] = useState('Insight Makers');

  // Section 1: Overall Experience
  const [q1_overallRating, setQ1OverallRating] = useState('');
  const [q2_expectationsMet, setQ2ExpectationsMet] = useState('');
  const [q3_organizationRating, setQ3OrganizationRating] = useState('');
  const [q4_mostValuableAspect, setQ4MostValuableAspect] = useState('');

  // Section 2: Feedback on the programme team and training delivery (1-5)
  const [q5_conceptsExplainedClearly, setQ5ConceptsExplainedClearly] = useState(0);
  const [q6_exercisesHelpedApply, setQ6ExercisesHelpedApply] = useState(0);
  const [q7_receivedAdequateGuidance, setQ7ReceivedAdequateGuidance] = useState(0);
  const [q8_feedbackHelpedImprove, setQ8FeedbackHelpedImprove] = useState(0);
  const [q9_structurePaceSupported, setQ9StructurePaceSupported] = useState(0);
  const [q10_teamImprovementSuggestions, setQ10TeamImprovementSuggestions] = useState('');

  // Section 3: Student self-assessment and commitment (1-5)
  const [q11_attendedConsistently, setQ11AttendedConsistently] = useState(0);
  const [q12_dedicatedSufficientTime, setQ12DedicatedSufficientTime] = useState(0);
  const [q13_tookResponsibilityDifficulties, setQ13TookResponsibilityDifficulties] = useState(0);
  const [q14_collaboratedEffectively, setQ14CollaboratedEffectively] = useState(0);
  const [q15_oneThingDoneDifferently, setQ15OneThingDoneDifferently] = useState('');

  // Section 4: Skills gained and readiness
  const [q16_skillsGrid, setQ16SkillsGrid] = useState({
    excel: '',
    sql: '',
    powerBi: '',
    breakdown: '',
    communication: '',
    independent: '',
  });
  const [q17_realWorldPreparedness, setQ17RealWorldPreparedness] = useState('');
  const [q18_areaNeedingMostSupport, setQ18AreaNeedingMostSupport] = useState('');
  const [q18_areaNeedingMostSupportOther, setQ18AreaNeedingMostSupportOther] = useState('');

  // Section 5: Final reflections and class peer nominations
  const [q19_biggestChallengeFaced, setQ19BiggestChallengeFaced] = useState('');
  const [q20_oneChangeForFutureStudents, setQ20OneChangeForFutureStudents] = useState('');
  const [q21_greatestStrengthsAndImprovements, setQ21GreatestStrengthsAndImprovements] = useState('');
  const [q22_bestStudent, setQ22BestStudent] = useState('');
  const [q23_bestBehavedStudent, setQ23BestBehavedStudent] = useState('');

  // Submission & UI States
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [activeSectionTab, setActiveSectionTab] = useState('s1');

  // Section References for Smooth Scrolling
  const s0Ref = useRef(null);
  const s1Ref = useRef(null);
  const s2Ref = useRef(null);
  const s3Ref = useRef(null);
  const s4Ref = useRef(null);
  const s5Ref = useRef(null);

  // Auto-fill logged in user info if available
  useEffect(() => {
    if (isAuthenticated && user) {
      const cleanNum = user.studentNumber ? String(user.studentNumber).padStart(3, '0') : '';
      const fallbackId = cleanNum ? `TSDP2026-RES-${cleanNum}` : '';
      const realId = user.studentID || user.id || fallbackId;

      if (user.fullName || user.name) setStudentName(user.fullName || user.name);
      if (user.email) setStudentEmail(user.email);
      if (realId) setStudentID(realId);
      if (user.classGroup || user.group) setClassGroup(user.classGroup || user.group);
    }
  }, [isAuthenticated, user]);

  const handleSelectSelf = (selectedId) => {
    if (!selectedId) return;
    const found = cohortStudentsList.find(s => (s.studentID || s.id) === selectedId);
    if (found) {
      const cleanNum = found.studentNumber ? String(found.studentNumber).padStart(3, '0') : '';
      const fallbackId = cleanNum ? `TSDP2026-RES-${cleanNum}` : '';
      setStudentID(found.studentID || fallbackId || selectedId);
      const name = found.studentName || found.name || `${found.firstName || ''} ${found.lastName || ''}`.trim();
      if (name) setStudentName(name);
      if (found.email) setStudentEmail(found.email);
      const group = found.classGroup || found.group || found.capstoneGroup || '';
      if (group) setClassGroup(group);
    }
  };

  // Load submissions list for Management review modal
  const loadSubmissions = async () => {
    const res = await getEndOfProgrammeFeedbackList();
    if (res && res.data) {
      setSubmissionsList(res.data);
    }
  };

  useEffect(() => {
    loadSubmissions();
    // Load student cohort list for dropdown options
    async function fetchCohort() {
      try {
        const res = await getAllStudents();
        const list = Array.isArray(res) ? res : (res?.data || res?.students || []);
        if (list && list.length > 0) {
          setCohortStudentsList(list);
        }
      } catch (err) {
        // Non-blocking fallback
      }
    }
    fetchCohort();
  }, []);

  // Format student options for Q22 & Q23 dropdowns: {firstName} {lastName}
  const studentOptions = useMemo(() => {
    const currentId = (user?.studentID || user?.id || '').trim().toLowerCase();
    const currentNum = user?.studentNumber ? String(user.studentNumber).trim() : '';

    return cohortStudentsList.map((st) => {
      const sId = st.studentID || st.id || '';
      let fullName = '';
      if (st.firstName || st.lastName) {
        fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim();
      } else {
        fullName = (st.studentName || st.name || st.fullName || 'Resident').trim();
      }

      const label = fullName;

      const isCurrentStudent =
        Boolean(currentId && sId.toLowerCase() === currentId) ||
        Boolean(currentNum && st.studentNumber && String(st.studentNumber).trim() === currentNum);

      return {
        value: sId,
        label,
        sublabel: null,
        disabled: isCurrentStudent
      };
    });
  }, [cohortStudentsList, user]);

  const getStudentLabel = (id) => {
    if (!id) return 'N/A';
    const found = studentOptions.find(o => o.value === id);
    return found ? found.label : id;
  };

  // --------------------------------------------------------------------------
  // Progress Calculation
  // --------------------------------------------------------------------------
  const answeredCount = useMemo(() => {
    let count = 0;
    // Section 1 (4 questions)
    if (q1_overallRating) count++;
    if (q2_expectationsMet) count++;
    if (q3_organizationRating) count++;
    if (q4_mostValuableAspect.trim()) count++;

    // Section 2 (Q5-Q9 required, Q10 optional)
    if (q5_conceptsExplainedClearly > 0) count++;
    if (q6_exercisesHelpedApply > 0) count++;
    if (q7_receivedAdequateGuidance > 0) count++;
    if (q8_feedbackHelpedImprove > 0) count++;
    if (q9_structurePaceSupported > 0) count++;
    if (q10_teamImprovementSuggestions.trim()) count++; // counted towards completion if answered

    // Section 3 (Q11-Q15 required)
    if (q11_attendedConsistently > 0) count++;
    if (q12_dedicatedSufficientTime > 0) count++;
    if (q13_tookResponsibilityDifficulties > 0) count++;
    if (q14_collaboratedEffectively > 0) count++;
    if (q15_oneThingDoneDifferently.trim()) count++;

    // Section 4 (Q16 grid has 6 sub-skills, Q17, Q18)
    const skillsAnswered = Object.values(q16_skillsGrid).filter(Boolean).length;
    if (skillsAnswered === 6) count++; // count whole Q16 as 1
    if (q17_realWorldPreparedness) count++;
    if (q18_areaNeedingMostSupport) count++;

    // Section 5 (Q19-Q23)
    if (q19_biggestChallengeFaced.trim()) count++;
    if (q20_oneChangeForFutureStudents.trim()) count++;
    if (q21_greatestStrengthsAndImprovements.trim()) count++;
    if (q22_bestStudent.trim()) count++;
    if (q23_bestBehavedStudent.trim()) count++;

    return count;
  }, [
    q1_overallRating, q2_expectationsMet, q3_organizationRating, q4_mostValuableAspect,
    q5_conceptsExplainedClearly, q6_exercisesHelpedApply, q7_receivedAdequateGuidance, q8_feedbackHelpedImprove, q9_structurePaceSupported, q10_teamImprovementSuggestions,
    q11_attendedConsistently, q12_dedicatedSufficientTime, q13_tookResponsibilityDifficulties, q14_collaboratedEffectively, q15_oneThingDoneDifferently,
    q16_skillsGrid, q17_realWorldPreparedness, q18_areaNeedingMostSupport,
    q19_biggestChallengeFaced, q20_oneChangeForFutureStudents, q21_greatestStrengthsAndImprovements, q22_bestStudent, q23_bestBehavedStudent
  ]);

  const totalCoreQuestions = 23;
  const progressPercentage = Math.min(100, Math.round((answeredCount / totalCoreQuestions) * 100));

  // --------------------------------------------------------------------------
  // Auto-Fill Sample Answers for Management Review
  // --------------------------------------------------------------------------
  const handleAutoFillSample = () => {
    setIsAnonymous(false);
    setStudentName('Adedamola Adeleke');
    setStudentEmail('adedamola.adeleke@tsdp2026.example.com');
    setStudentID('TSDP2026-RES-018');
    setClassGroup('Insight Makers');

    // Section 1
    setQ1OverallRating('Excellent');
    setQ2ExpectationsMet('Exceeded my expectations');
    setQ3OrganizationRating('Very good');
    setQ4MostValuableAspect('The immersive capstone projects and continuous code reviews by coaches. Building end-to-end dashboards with live business datasets gave me the real workplace confidence I lacked previously.');

    // Section 2
    setQ5ConceptsExplainedClearly(5);
    setQ6ExercisesHelpedApply(5);
    setQ7ReceivedAdequateGuidance(4);
    setQ8FeedbackHelpedImprove(5);
    setQ9StructurePaceSupported(4);
    setQ10TeamImprovementSuggestions('Consider adding more dedicated office hours for DAX troubleshooting during the Power BI sprints. The curriculum coverage was outstanding overall.');

    // Section 3
    setQ11AttendedConsistently(5);
    setQ12DedicatedSufficientTime(4);
    setQ13TookResponsibilityDifficulties(5);
    setQ14CollaboratedEffectively(5);
    setQ15OneThingDoneDifferently('I would have started practicing SQL window functions and subqueries earlier in the first month to master advanced aggregations before the capstone phase.');

    // Section 4
    setQ16SkillsGrid({
      excel: 'Much higher',
      sql: 'Much higher',
      powerBi: 'Much higher',
      breakdown: 'Slightly higher',
      communication: 'Much higher',
      independent: 'Much higher'
    });
    setQ17RealWorldPreparedness('Very prepared');
    setQ18AreaNeedingMostSupport('Portfolio development and real-world projects');
    setQ18AreaNeedingMostSupportOther('');

    // Section 5
    setQ19BiggestChallengeFaced('Balancing rigorous daily project sprints with personal commitments, but structured coach milestones kept me focused and disciplined.');
    setQ20OneChangeForFutureStudents('Introduce mock employer interviews and resume reviews earlier in the third month so students can align their portfolio projects directly with hiring managers.');
    setQ21GreatestStrengthsAndImprovements('Strengths: Patient and highly knowledgeable facilitators, structured curriculum, real project briefs, and strong peer collaboration. Improvements: Provide cloud workspace sandbox instances for remote residents.');
    const validOpts = studentOptions.filter(o => !o.disabled);
    const sampleBest = validOpts[0]?.value || 'TSDP2026-RES-001';
    const sampleBestBehaved = validOpts[1]?.value || validOpts[0]?.value || 'TSDP2026-RES-002';
    setQ22BestStudent(sampleBest);
    setQ23BestBehavedStudent(sampleBestBehaved);

    setMissingFields([]);
    triggerToast('⚡ Sample responses populated! Review the questions and test submission.');
  };

  const handleResetForm = () => {
    if (window.confirm('Reset all fields in this feedback form?')) {
      setIsAnonymous(false);
      setStudentName('');
      setStudentEmail('');
      setStudentID('');
      setClassGroup('Insight Makers');
      setQ1OverallRating('');
      setQ2ExpectationsMet('');
      setQ3OrganizationRating('');
      setQ4MostValuableAspect('');
      setQ5ConceptsExplainedClearly(0);
      setQ6ExercisesHelpedApply(0);
      setQ7ReceivedAdequateGuidance(0);
      setQ8FeedbackHelpedImprove(0);
      setQ9StructurePaceSupported(0);
      setQ10TeamImprovementSuggestions('');
      setQ11AttendedConsistently(0);
      setQ12DedicatedSufficientTime(0);
      setQ13TookResponsibilityDifficulties(0);
      setQ14CollaboratedEffectively(0);
      setQ15OneThingDoneDifferently('');
      setQ16SkillsGrid({
        excel: '',
        sql: '',
        powerBi: '',
        breakdown: '',
        communication: '',
        independent: '',
      });
      setQ17RealWorldPreparedness('');
      setQ18AreaNeedingMostSupport('');
      setQ18AreaNeedingMostSupportOther('');
      setQ19BiggestChallengeFaced('');
      setQ20OneChangeForFutureStudents('');
      setQ21GreatestStrengthsAndImprovements('');
      setQ22BestStudent('');
      setQ23BestBehavedStudent('');
      setMissingFields([]);
      triggerToast('Form cleared successfully.');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + '/final-feedback';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      triggerToast('📋 Public link copied to clipboard! Share with management.');
    } else {
      triggerToast(url);
    }
  };

  // --------------------------------------------------------------------------
  // Form Submission & Validation
  // --------------------------------------------------------------------------
  const validateForm = () => {
    const errors = [];

    // Identification (required if not anonymous)
    if (!isAnonymous && !studentName.trim()) errors.push({ id: 'studentName', label: 'Full Name' });
    if (!isAnonymous && !studentEmail.trim()) errors.push({ id: 'studentEmail', label: 'Email Address' });

    // Section 1
    if (!q1_overallRating) errors.push({ id: 'q1', label: 'Question 1: Overall experience rating' });
    if (!q2_expectationsMet) errors.push({ id: 'q2', label: 'Question 2: Expectations met' });
    if (!q3_organizationRating) errors.push({ id: 'q3', label: 'Question 3: Overall organization' });
    if (!q4_mostValuableAspect.trim()) errors.push({ id: 'q4', label: 'Question 4: Most valuable aspect' });

    // Section 2
    if (!q5_conceptsExplainedClearly) errors.push({ id: 'q5', label: 'Question 5: Concepts explained clearly' });
    if (!q6_exercisesHelpedApply) errors.push({ id: 'q6', label: 'Question 6: Practical exercises helped' });
    if (!q7_receivedAdequateGuidance) errors.push({ id: 'q7', label: 'Question 7: Adequate guidance received' });
    if (!q8_feedbackHelpedImprove) errors.push({ id: 'q8', label: 'Question 8: Feedback helped improve' });
    if (!q9_structurePaceSupported) errors.push({ id: 'q9', label: 'Question 9: Structure and pace supported' });
    // Q10 is optional

    // Section 3
    if (!q11_attendedConsistently) errors.push({ id: 'q11', label: 'Question 11: Attended consistently' });
    if (!q12_dedicatedSufficientTime) errors.push({ id: 'q12', label: 'Question 12: Dedicated sufficient time' });
    if (!q13_tookResponsibilityDifficulties) errors.push({ id: 'q13', label: 'Question 13: Took responsibility' });
    if (!q14_collaboratedEffectively) errors.push({ id: 'q14', label: 'Question 14: Collaborated with peers' });
    if (!q15_oneThingDoneDifferently.trim()) errors.push({ id: 'q15', label: 'Question 15: One thing done differently' });

    // Section 4
    const missingSkills = SKILL_GRID_ROWS.filter(r => !q16_skillsGrid[r.id]);
    if (missingSkills.length > 0) {
      errors.push({ id: 'q16', label: `Question 16: Skills ability grid (${missingSkills.length} unrated)` });
    }
    if (!q17_realWorldPreparedness) errors.push({ id: 'q17', label: 'Question 17: Preparedness for real-world problems' });
    if (!q18_areaNeedingMostSupport) errors.push({ id: 'q18', label: 'Question 18: Area needing most support' });
    if (q18_areaNeedingMostSupport === 'Other' && !q18_areaNeedingMostSupportOther.trim()) {
      errors.push({ id: 'q18_other', label: 'Question 18: Please specify the "Other" area' });
    }

    // Section 5
    if (!q19_biggestChallengeFaced.trim()) errors.push({ id: 'q19', label: 'Question 19: Biggest challenge faced' });
    if (!q20_oneChangeForFutureStudents.trim()) errors.push({ id: 'q20', label: 'Question 20: One change for future students' });
    if (!q21_greatestStrengthsAndImprovements.trim()) errors.push({ id: 'q21', label: 'Question 21: Greatest strengths & improvements' });
    if (!q22_bestStudent.trim()) errors.push({ id: 'q22', label: 'Question 22: Best student nomination' });
    if (!q23_bestBehavedStudent.trim()) errors.push({ id: 'q23', label: 'Question 23: Best-behaved student nomination' });

    return errors;
  };

  const scrollToFirstMissing = (errors) => {
    if (!errors.length) return;
    const firstId = errors[0].id;
    const el = document.getElementById(firstId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus?.();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const errors = validateForm();
    if (errors.length > 0) {
      setMissingFields(errors);
      scrollToFirstMissing(errors);
      triggerToast(`⚠️ Please complete ${errors.length} required field${errors.length > 1 ? 's' : ''}.`);
      return;
    }

    setSubmitting(true);
    setMissingFields([]);

    const payload = {
      id: `EOP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      submittedAt: new Date().toLocaleString(),
      isAnonymous,
      studentID: isAnonymous ? 'ANONYMOUS' : (studentID.trim() || 'RESIDENT'),
      studentNumber: isAnonymous ? 'ANON' : studentID.replace(/[^0-9]/g, ''),
      studentName: isAnonymous ? 'Anonymous Resident' : studentName.trim(),
      email: isAnonymous ? '' : studentEmail.trim(),
      classGroup,

      q1_overallRating,
      q2_expectationsMet,
      q3_organizationRating,
      q4_mostValuableAspect: (q4_mostValuableAspect || '').trim(),

      q5_conceptsExplainedClearly: Number(q5_conceptsExplainedClearly || 0),
      q6_exercisesHelpedApply: Number(q6_exercisesHelpedApply || 0),
      q7_receivedAdequateGuidance: Number(q7_receivedAdequateGuidance || 0),
      q8_feedbackHelpedImprove: Number(q8_feedbackHelpedImprove || 0),
      q9_structurePaceSupported: Number(q9_structurePaceSupported || 0),
      q10_teamImprovementSuggestions: (q10_teamImprovementSuggestions || '').trim(),

      q11_attendedConsistently: Number(q11_attendedConsistently || 0),
      q12_dedicatedSufficientTime: Number(q12_dedicatedSufficientTime || 0),
      q13_tookResponsibilityDifficulties: Number(q13_tookResponsibilityDifficulties || 0),
      q14_collaboratedEffectively: Number(q14_collaboratedEffectively || 0),
      q15_oneThingDoneDifferently: (q15_oneThingDoneDifferently || '').trim(),

      q16_skillsGrid: {
        excel: q16_skillsGrid.excel || '',
        sql: q16_skillsGrid.sql || '',
        powerBi: q16_skillsGrid.powerBi || '',
        breakdown: q16_skillsGrid.breakdown || '',
        communication: q16_skillsGrid.communication || '',
        independent: q16_skillsGrid.independent || '',
      },
      q17_realWorldPreparedness,
      q18_areaNeedingMostSupport,
      q18_areaNeedingMostSupportOther: (q18_areaNeedingMostSupportOther || '').trim(),

      q19_biggestChallengeFaced: (q19_biggestChallengeFaced || '').trim(),
      q20_oneChangeForFutureStudents: (q20_oneChangeForFutureStudents || '').trim(),
      q21_greatestStrengthsAndImprovements: (q21_greatestStrengthsAndImprovements || '').trim(),
      q22_bestStudent,
      q23_bestBehavedStudent,
    };

    try {
      const result = await submitEndOfProgrammeFeedback(payload);
      setSubmitting(false);

      if (result && result.success !== false) {
        // Persist to Local Storage for immediate banner update on dashboard
        try {
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('tsdp_end_of_programme_feedback');
            let list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) list = [];
            if (!payload.isAnonymous && payload.studentID) {
              const existingIdx = list.findIndex(item => item.studentID === payload.studentID);
              if (existingIdx >= 0) {
                list[existingIdx] = { ...list[existingIdx], ...payload };
              } else {
                list.unshift(payload);
              }
            } else {
              list.unshift(payload);
            }
            localStorage.setItem('tsdp_end_of_programme_feedback', JSON.stringify(list));
          }
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }

        setSubmittedData(result.data || payload);
        setSubmitSuccess(true);
        loadSubmissions();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const errorMsg = result?.message || 'Failed to submit feedback. Please check your network and try again.';
        setSubmitError(errorMsg);
        triggerToast(`❌ ${errorMsg}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setSubmitting(false);
      console.error('Submission error:', err);
      const errorMsg = err?.message || 'An error occurred during submission. Please try again.';
      setSubmitError(errorMsg);
      triggerToast(`❌ ${errorMsg}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Scroll to section helper
  const scrollToSection = (ref, tabId) => {
    setActiveSectionTab(tabId);
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 selection:bg-brand-primary selection:text-white flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION                                                */}
      {/* ========================================================================= */}
      {inPortal ? (
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-2 pb-2 space-y-4">
          {/* Breadcrumb & Welcome Card */}
          <div className="bg-gradient-to-r from-[#003E7E] via-[#0054A6] to-amber-600 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-blue-200">
                  <Link to="/student/dashboard" className="hover:text-white transition-colors">
                    Resident Dashboard
                  </Link>
                  <span>/</span>
                  <span className="text-white">End-of-Programme Feedback</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-7 h-7 text-amber-300" />
                  End-of-Programme Final Feedback & Nominations
                </h1>
                <p className="text-xs text-blue-100 max-w-xl mt-1 leading-relaxed">
                  Reflect on your Data Analytics Residency, evaluate your skills development, and vote for the best student and best-behaved student in your class.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to="/student/dashboard"
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs border border-white/20 transition-all flex items-center gap-1"
                >
                  <span>← Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-white text-[#003E7E] font-semibold text-xs shadow-xs hover:bg-blue-50 transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Progress & Section Navigation Bar for Portal Mode */}
          <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 px-4 py-2.5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              {/* Section Pills */}
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
                <button
                  type="button"
                  onClick={() => scrollToSection(s0Ref, 's0')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeSectionTab === 's0'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Resident Info
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(s1Ref, 's1')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeSectionTab === 's1'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  S1: Experience
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(s2Ref, 's2')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeSectionTab === 's2'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  S2: Delivery
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(s3Ref, 's3')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeSectionTab === 's3'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  S3: Self-Audit
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(s4Ref, 's4')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeSectionTab === 's4'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  S4: Skills Delta
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(s5Ref, 's5')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeSectionTab === 's5'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  S5: Reflections & Nominations
                </button>
              </div>

              {/* Completion Meter */}
              <div className="flex items-center gap-3 w-full sm:w-56 justify-end">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
                  {answeredCount}/{totalCoreQuestions} ({progressPercentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        {/* Top Management Review Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-neutral-dark to-slate-900 text-white text-xs py-2 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-orange text-[11px] font-semibold border border-brand-primary/30">
                <Sparkles className="w-3 h-3 text-brand-primary" /> Management Review Mode
              </span>
              <span className="hidden sm:inline text-slate-300">
                Data Analytics Residency: End-of-Programme Feedback Form Preview
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFillSample}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 text-[11px] font-medium border border-amber-500/30 transition-colors"
                title="Populate all 22 questions with realistic student test answers"
              >
                <span>⚡ Fill Sample Answers</span>
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                title="Reset form fields"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden md:inline">Reset</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-primary hover:bg-brand-primary-dark text-white text-[11px] font-medium transition-colors"
                title="Copy direct shareable link for leadership review"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Shareable Link</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManagementModal(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 transition-colors"
                title="View questionnaire design rationale and metrics"
              >
                <Info className="w-3 h-3 text-cyan-400" />
                <span className="hidden lg:inline">Design Rationale</span>
              </button>
              {submissionsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSubmissionsModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] border border-emerald-700/50 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>({submissionsList.length}) Submissions</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Branding Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center gap-2">
              {/* ITF Logo */}
              {!logoErrors['itf'] ? (
                <img
                  src="/logos/itf-logo.png"
                  alt="ITF Logo"
                  className="h-8 sm:h-9 object-contain"
                  onError={() => handleLogoError('itf')}
                />
              ) : (
                <div className="h-8 px-2.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center">
                  ITF
                </div>
              )}

              {/* NECA Logo */}
              {!logoErrors['neca'] ? (
                <img
                  src="/logos/neca-logo.png"
                  alt="NECA Logo"
                  className="h-8 sm:h-9 object-contain"
                  onError={() => handleLogoError('neca')}
                />
              ) : (
                <div className="h-8 px-2.5 rounded-lg bg-[#0054A6] text-white font-bold text-xs flex items-center">
                  NECA
                </div>
              )}

              {/* ShamzBridge Logo */}
              {!logoErrors['shamzbridge'] ? (
                <img
                  src="/logos/shamzbridge-logo.png"
                  alt="ShamzBridge Logo"
                  className="h-8 sm:h-9 object-contain"
                  onError={() => handleLogoError('shamzbridge')}
                />
              ) : (
                <div className="h-8 px-2.5 rounded-lg bg-brand-primary text-white font-bold text-xs flex items-center">
                  SHAMZBRIDGE
                </div>
              )}
            </div>

            <div className="hidden sm:block pl-3 border-l border-slate-200 text-left">
              <span className="block text-xs font-bold uppercase tracking-wider text-brand-primary leading-tight">
                Shamzbridge Consult
              </span>
              <span className="block text-[11px] font-medium text-slate-500 leading-tight">
                Data Analytics Residency Programme · End-of-Programme Feedback
              </span>
            </div>
          </Link>

          {/* Right Action Shortcuts */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-brand-primary text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Suggested completion: 7–10 mins</span>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5"
              title="Print questionnaire"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Form</span>
            </button>

            <Link
              to="/"
              className="text-xs font-semibold text-slate-600 hover:text-brand-primary py-2 px-3 rounded-lg hover:bg-orange-50/60 transition-colors"
            >
              Portal Home
            </Link>
          </div>
        </div>

        {/* Sticky Progress & Section Navigation Bar */}
        <div className="bg-slate-50/90 border-t border-slate-200/70 px-4 py-2">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            {/* Section Pills */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
              <button
                type="button"
                onClick={() => scrollToSection(s0Ref, 's0')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeSectionTab === 's0'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Resident Info
              </button>
              <button
                type="button"
                onClick={() => scrollToSection(s1Ref, 's1')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeSectionTab === 's1'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                S1: Experience
              </button>
              <button
                type="button"
                onClick={() => scrollToSection(s2Ref, 's2')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeSectionTab === 's2'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                S2: Delivery
              </button>
              <button
                type="button"
                onClick={() => scrollToSection(s3Ref, 's3')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeSectionTab === 's3'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                S3: Self-Audit
              </button>
              <button
                type="button"
                onClick={() => scrollToSection(s4Ref, 's4')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeSectionTab === 's4'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                S4: Skills Delta
              </button>
              <button
                type="button"
                onClick={() => scrollToSection(s5Ref, 's5')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeSectionTab === 's5'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                S5: Reflections
              </button>
            </div>

            {/* Completion Meter */}
            <div className="flex items-center gap-3 w-full sm:w-64 justify-end">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
                {answeredCount}/{totalCoreQuestions} ({progressPercentage}%)
              </span>
            </div>
          </div>
        </div>
      </header>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN FORM CONTAINER                                                    */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* SUCCESS CONFIRMATION MODAL / VIEW */}
        {submitSuccess && submittedData ? (
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-6 sm:p-10 text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-6 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              Feedback Successfully Recorded
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Thank You for Your Valuable Feedback!
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Your comprehensive reflections on the Shamzbridge Data Analytics Residency Programme will directly guide curriculum refinement, coaching delivery, and future cohort design.
            </p>

            {/* Quick Summary Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-left max-w-2xl mx-auto mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" /> Submission Receipt Summary
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Resident:</span>
                  <span className="font-semibold text-slate-800">
                    {submittedData.isAnonymous ? 'Confidential (Anonymous)' : submittedData.studentName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Student ID / Cohort:</span>
                  <span className="font-semibold text-slate-800">
                    {submittedData.studentID || 'TSDP 2026 Residency'} ({submittedData.classGroup})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Overall Experience Rating:</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    {submittedData.q1_overallRating}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Real-World Preparedness:</span>
                  <span className="font-semibold text-brand-primary bg-orange-50 px-2 py-0.5 rounded border border-orange-200 inline-block">
                    {submittedData.q17_realWorldPreparedness}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Best Student Nomination:</span>
                  <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                    🏆 {getStudentLabel(submittedData.q22_bestStudent)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Best-Behaved Nomination:</span>
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    ⭐ {getStudentLabel(submittedData.q23_bestBehavedStudent)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/80 text-xs">
                <span className="text-slate-500 block mb-1">Most Valuable Aspect:</span>
                <p className="text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200">
                  "{submittedData.q4_mostValuableAspect}"
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-outline flex items-center gap-2 py-2.5 px-5 text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Response Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-outline flex items-center gap-2 py-2.5 px-5 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Submit Another Review / Test</span>
              </button>
              {inPortal ? (
                <Link
                  to="/student/dashboard"
                  className="btn-primary flex items-center gap-2 py-2.5 px-5 text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Return to Student Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/"
                  className="btn-primary flex items-center gap-2 py-2.5 px-5 text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Return to Home</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* =================================================================== */}
            {/* HERO / WELCOME CARD & OFFICIAL INSTRUCTIONS                        */}
            {/* =================================================================== */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 relative overflow-hidden">
              {/* Brand Decorative Header Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-orange-glow to-[#0054A6]" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-brand-primary text-xs font-semibold mb-2">
                    <Award className="w-3.5 h-3.5" />
                    <span>ITF-NECA Technical Skills Development Project (TSDP)</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Shamzbridge Consult
                  </h1>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-700 mt-1">
                    Data Analytics Residency Programme: End-of-Programme Feedback
                  </h2>
                </div>

                <div className="self-start md:self-auto bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center sm:min-w-[170px]">
                  <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                    <Clock className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Estimated Time</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    7–10 minutes
                  </span>
                </div>
              </div>

              {/* Form Description Box */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 sm:p-6 text-sm text-slate-700 leading-relaxed space-y-3">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5 text-brand-primary">
                  <Info className="w-4 h-4" /> Form Description & Objectives
                </h3>
                <p>
                  Thank you for being part of the <strong>Shamzbridge Data Analytics Residency Programme</strong>.
                </p>
                <p>
                  As we conclude this phase of the programme, we want to reflect on the experience, evaluate the effectiveness of our training approach, understand the progress you have made, and identify areas for improvement.
                </p>
                <p>
                  This feedback covers both the programme team's performance and your personal commitment to learning. We encourage you to be honest, specific, and constructive. Your responses will help us understand what worked, what needs improvement, and how we can deliver a better learning experience in future cohorts.
                </p>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
                  <span className="text-brand-primary font-bold text-sm">💡</span>
                  <span>
                    <strong>There are no right or wrong answers.</strong> Please respond based on your actual experience throughout the programme.
                  </span>
                </div>
              </div>
            </div>

            {/* Submission Error Banner */}
            {submitError && (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-xs text-rose-800 flex items-start gap-3 animate-fade-in shadow-xs">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-0.5">Submission Error:</h4>
                  <p className="leading-relaxed">{submitError}</p>
                </div>
              </div>
            )}

            {/* Validation Alert Banner if Missing Fields */}
            {missingFields.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-start justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1">
                      Please complete all {missingFields.length} required question{missingFields.length > 1 ? 's' : ''}:
                    </h4>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {missingFields.slice(0, 5).map((err, idx) => (
                        <li key={idx}>{err.label}</li>
                      ))}
                      {missingFields.length > 5 && (
                        <li>...and {missingFields.length - 5} other fields</li>
                      )}
                    </ul>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToFirstMissing(missingFields)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shrink-0 text-xs"
                >
                  Jump to Missing
                </button>
              </div>
            )}

            {/* =================================================================== */}
            {/* SECTION 0: RESIDENT IDENTIFICATION                                  */}
            {/* =================================================================== */}
            <div ref={s0Ref} id="section0" className="portal-card bg-white">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                    00
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Resident Identification & Cohort Details
                    </h3>
                    <p className="text-xs text-slate-500">
                      Provide your details or toggle confidential anonymous submission
                    </p>
                  </div>
                </div>

                {/* Anonymous Toggle */}
                <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary/20"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Submit Anonymously
                  </span>
                </label>
              </div>

              {isAnonymous ? (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <p>
                    <strong>Anonymous Mode Active:</strong> Your name and email address will be completely withheld. Your feedback will be recorded under a generic anonymous respondent token for genuine transparency.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!isAuthenticated && cohortStudentsList.length > 0 && (
                    <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                      <label className="form-label flex items-center justify-between text-slate-700">
                        <span>Quick Select Resident Profile:</span>
                        <span className="text-[11px] text-slate-400 font-normal">Auto-fills your details from roster</span>
                      </label>
                      <CustomSelect
                        value={studentID}
                        onChange={handleSelectSelf}
                        placeholder="Choose your resident profile..."
                        searchable={true}
                        emptyMessage="No residents found"
                        options={cohortStudentsList.map(s => {
                          const sId = s.studentID || s.id || '';
                          const name = s.studentName || s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Resident';
                          return {
                            value: sId,
                            label: `${name} (${sId})`,
                            sublabel: s.classGroup || null
                          };
                        })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="form-label" htmlFor="studentName">
                      Full Name <span className="text-brand-error">*</span>
                    </label>
                    <input
                      id="studentName"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Adedamola Adeleke"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="studentEmail">
                      Email Address <span className="text-brand-error">*</span>
                    </label>
                    <input
                      id="studentEmail"
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="e.g. adedamola@example.com"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="studentID">
                      Student Reg Number / ID <span className="text-slate-400 font-normal">(e.g. TSDP2026-RES-029)</span>
                    </label>
                    <input
                      id="studentID"
                      type="text"
                      value={studentID}
                      onChange={(e) => setStudentID(e.target.value)}
                      placeholder="e.g. TSDP2026-RES-001"
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="classGroup">
                      Resident Project Group
                    </label>
                    <select
                      id="classGroup"
                      value={classGroup}
                      onChange={(e) => setClassGroup(e.target.value)}
                      className="form-select"
                    >
                      {FALLBACK_CLASS_GROUPS.map((grp) => (
                        <option key={grp} value={grp}>{grp}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================================== */}
            {/* SECTION 1: OVERALL PROGRAMME EXPERIENCE                             */}
            {/* =================================================================== */}
            <div ref={s1Ref} id="section1" className="portal-card bg-white space-y-8">
              <div className="pb-4 border-b border-slate-200/80">
                <span className="badge-primary mb-2 inline-block">Section 1 of 5</span>
                <h3 className="text-lg font-bold text-slate-900">
                  Section 1: Overall programme experience
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  These questions measure students' overall satisfaction and how well the programme met their expectations.
                </p>
              </div>

              {/* Question 1 */}
              <div id="q1" className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <label className="text-sm font-bold text-slate-800">
                    1. Overall, how would you rate your experience with the programme? <span className="text-brand-error">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Multiple Choice
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {OVERALL_RATING_OPTIONS.map((opt) => {
                    const isSelected = q1_overallRating === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setQ1OverallRating(opt.val)}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                          isSelected
                            ? 'bg-orange-50/80 border-brand-primary ring-2 ring-brand-primary/25 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl">{opt.icon}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </span>
                        </div>
                        <div>
                          <span className={`block text-xs font-bold ${isSelected ? 'text-brand-primary-dark' : 'text-slate-800'}`}>
                            {opt.val}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">
                            {opt.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 2 */}
              <div id="q2" className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label className="text-sm font-bold text-slate-800">
                    2. To what extent did the programme meet your expectations? <span className="text-brand-error">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Multiple Choice
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXPECTATION_OPTIONS.map((opt) => {
                    const isSelected = q2_expectationsMet === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setQ2ExpectationsMet(opt.val)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all duration-200 ${
                          isSelected
                            ? 'bg-orange-50/80 border-brand-primary ring-2 ring-brand-primary/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <span className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <div>
                          <span className={`block text-xs font-bold ${isSelected ? 'text-brand-primary-dark' : 'text-slate-800'}`}>
                            {opt.val}
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            {opt.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 3 */}
              <div id="q3" className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label className="text-sm font-bold text-slate-800">
                    3. How would you rate the overall organization and coordination of the programme? <span className="text-brand-error">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Multiple Choice
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {['Excellent', 'Very good', 'Good', 'Fair', 'Poor'].map((opt) => {
                    const isSelected = q3_organizationRating === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setQ3OrganizationRating(opt)}
                        className={`py-3 px-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-brand-primary text-white font-bold border-brand-primary shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 font-semibold hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 4 */}
              <div id="q4" className="space-y-2 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label htmlFor="q4_input" className="text-sm font-bold text-slate-800">
                    4. What was the most valuable aspect of the programme for you, and why? <span className="text-brand-error">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Paragraph
                  </span>
                </div>
                <textarea
                  id="q4_input"
                  rows={4}
                  value={q4_mostValuableAspect}
                  onChange={(e) => setQ4MostValuableAspect(e.target.value)}
                  placeholder="Share the most impactful module, project, facilitator mentorship, or milestone that benefited your growth..."
                  className="form-input text-xs leading-relaxed"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Be specific and descriptive</span>
                  <span>{q4_mostValuableAspect.length} characters</span>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* SECTION 2: FEEDBACK ON PROGRAMME TEAM & TRAINING DELIVERY           */}
            {/* =================================================================== */}
            <div ref={s2Ref} id="section2" className="portal-card bg-white space-y-8">
              <div className="pb-4 border-b border-slate-200/80">
                <span className="badge-primary mb-2 inline-block">Section 2 of 5</span>
                <h3 className="text-lg font-bold text-slate-900">
                  Section 2: Feedback on the programme team and training delivery
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This section evaluates the programme from the students' perspective of the coaches, learning structure, support, and learning environment.
                </p>

                {/* Scale Guide Banner */}
                <div className="mt-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 text-xs text-orange-950">
                  <span className="font-bold block mb-1.5 text-brand-primary-dark">
                    Use the following scale for Questions 5–9:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
                    <span className="p-1.5 rounded-lg bg-white/80 border border-orange-200/60 font-medium"><strong>1</strong> = Strongly disagree</span>
                    <span className="p-1.5 rounded-lg bg-white/80 border border-orange-200/60 font-medium"><strong>2</strong> = Disagree</span>
                    <span className="p-1.5 rounded-lg bg-white/80 border border-orange-200/60 font-medium"><strong>3</strong> = Neither agree nor disagree</span>
                    <span className="p-1.5 rounded-lg bg-white/80 border border-orange-200/60 font-medium"><strong>4</strong> = Agree</span>
                    <span className="p-1.5 rounded-lg bg-white/80 border border-orange-200/60 font-medium"><strong>5</strong> = Strongly agree</span>
                  </div>
                </div>
              </div>

              {/* Questions 5 to 9 using Likert Scale component */}
              {[
                { id: 'q5', num: 5, text: 'Concepts were explained clearly and in a way I could understand.', val: q5_conceptsExplainedClearly, setVal: setQ5ConceptsExplainedClearly },
                { id: 'q6', num: 6, text: 'The practical exercises and assignments helped me apply what I learned.', val: q6_exercisesHelpedApply, setVal: setQ6ExercisesHelpedApply },
                { id: 'q7', num: 7, text: 'I received adequate guidance and support when I encountered difficulties.', val: q7_receivedAdequateGuidance, setVal: setQ7ReceivedAdequateGuidance },
                { id: 'q8', num: 8, text: 'The feedback I received on my work helped me identify areas for improvement.', val: q8_feedbackHelpedImprove, setVal: setQ8FeedbackHelpedImprove },
                { id: 'q9', num: 9, text: "The programme's structure, pace and schedule supported my learning.", val: q9_structurePaceSupported, setVal: setQ9StructurePaceSupported },
              ].map((item) => (
                <div key={item.id} id={item.id} className="space-y-3 pt-4 border-t first:border-t-0 border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <label className="text-sm font-semibold text-slate-800">
                      {item.num}. {item.text} <span className="text-brand-error">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                      Scale 1–5
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {LIKERT_5_SCALE.map((s) => {
                      const isSelected = item.val === s.val;
                      return (
                        <button
                          key={s.val}
                          type="button"
                          onClick={() => item.setVal(s.val)}
                          className={`py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-brand-primary text-white font-bold border-brand-primary shadow-xs ring-2 ring-brand-primary/25'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-white text-brand-primary' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {s.val}
                          </span>
                          <span className="text-[10px] hidden sm:inline leading-tight font-medium text-center">
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Question 10 (Optional) */}
              <div id="q10" className="space-y-2 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label htmlFor="q10_input" className="text-sm font-bold text-slate-800">
                    10. What should the programme team improve in its teaching, support, communication, scheduling, or general coordination?
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Optional Paragraph
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Make this optional so students feel comfortable being completely honest and candid.
                </p>
                <textarea
                  id="q10_input"
                  rows={4}
                  value={q10_teamImprovementSuggestions}
                  onChange={(e) => setQ10TeamImprovementSuggestions(e.target.value)}
                  placeholder="Share constructive observations on facilitator delivery, schedule pacing, communication channels, or technical assistance..."
                  className="form-input text-xs leading-relaxed"
                />
              </div>
            </div>

            {/* =================================================================== */}
            {/* SECTION 3: STUDENT SELF-ASSESSMENT & COMMITMENT                     */}
            {/* =================================================================== */}
            <div ref={s3Ref} id="section3" className="portal-card bg-white space-y-8">
              <div className="pb-4 border-b border-slate-200/80">
                <span className="badge-primary mb-2 inline-block">Section 3 of 5</span>
                <h3 className="text-lg font-bold text-slate-900">
                  Section 3: Student self-assessment and commitment
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This is the other side of the evaluation. Students should reflect on their own actions, not only on what the programme provided.
                </p>

                <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Rating Scale (1 to 5):</span> 1 = Strongly disagree · 2 = Disagree · 3 = Neither agree nor disagree · 4 = Agree · 5 = Strongly agree
                </div>
              </div>

              {/* Questions 11 to 14 */}
              {[
                { id: 'q11', num: 11, text: 'I attended classes consistently and participated actively in learning activities.', val: q11_attendedConsistently, setVal: setQ11AttendedConsistently },
                { id: 'q12', num: 12, text: 'I dedicated sufficient time outside class to practise, revise and complete assignments.', val: q12_dedicatedSufficientTime, setVal: setQ12DedicatedSufficientTime },
                { id: 'q13', num: 13, text: 'I took responsibility for resolving my learning difficulties by asking questions, researching or seeking help.', val: q13_tookResponsibilityDifficulties, setVal: setQ13TookResponsibilityDifficulties },
                { id: 'q14', num: 14, text: 'I collaborated effectively with my peers and contributed fairly to group activities and projects.', val: q14_collaboratedEffectively, setVal: setQ14CollaboratedEffectively },
              ].map((item) => (
                <div key={item.id} id={item.id} className="space-y-3 pt-4 border-t first:border-t-0 border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <label className="text-sm font-semibold text-slate-800">
                      {item.num}. {item.text} <span className="text-brand-error">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                      Scale 1–5
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {LIKERT_5_SCALE.map((s) => {
                      const isSelected = item.val === s.val;
                      return (
                        <button
                          key={s.val}
                          type="button"
                          onClick={() => item.setVal(s.val)}
                          className={`py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-slate-900 text-white font-bold border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {s.val}
                          </span>
                          <span className="text-[10px] hidden sm:inline leading-tight font-medium text-center">
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Question 15 */}
              <div id="q15" className="space-y-2 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label htmlFor="q15_input" className="text-sm font-bold text-slate-800">
                    15. What is one thing you could have done differently to get more value from this programme? <span className="text-brand-error">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Paragraph
                  </span>
                </div>
                <p className="text-xs text-slate-500 italic">
                  💡 This question encourages accountability without blaming students for every learning difficulty.
                </p>
                <textarea
                  id="q15_input"
                  rows={4}
                  value={q15_oneThingDoneDifferently}
                  onChange={(e) => setQ15OneThingDoneDifferently(e.target.value)}
                  placeholder="e.g. Practicing syntax earlier, asking more questions during live sessions, revising assignments sooner..."
                  className="form-input text-xs leading-relaxed"
                />
              </div>
            </div>

            {/* =================================================================== */}
            {/* SECTION 4: SKILLS GAINED AND READINESS                              */}
            {/* =================================================================== */}
            <div ref={s4Ref} id="section4" className="portal-card bg-white space-y-8">
              <div className="pb-4 border-b border-slate-200/80">
                <span className="badge-primary mb-2 inline-block">Section 4 of 5</span>
                <h3 className="text-lg font-bold text-slate-900">
                  Section 4: Skills gained and readiness
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  The programme should be evaluated by what students can now do, not just how much they enjoyed it.
                </p>
              </div>

              {/* Question 16: Multiple-choice Grid */}
              <div id="q16" className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className="text-sm font-bold text-slate-800">
                      16. How would you rate your current ability in each area compared with when you started the programme? <span className="text-brand-error">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Multiple-choice grid · Select one rating for each core skill area
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                    Matrix Grid
                  </span>
                </div>

                {/* Desktop Matrix Table */}
                <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="py-3 px-4 font-bold w-1/3">Skill Area</th>
                        {SKILL_GRID_COLUMNS.map((col) => (
                          <th key={col.val} className="py-3 px-2 text-center font-bold">
                            <span className={col.color}>{col.short}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {SKILL_GRID_ROWS.map((row) => (
                        <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block">{row.label}</span>
                            <span className="text-[10px] text-slate-500 block">{row.desc}</span>
                          </td>
                          {SKILL_GRID_COLUMNS.map((col) => {
                            const isChecked = q16_skillsGrid[row.id] === col.val;
                            return (
                              <td
                                key={col.val}
                                onClick={() => setQ16SkillsGrid(prev => ({ ...prev, [row.id]: col.val }))}
                                className="py-3.5 px-2 text-center cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`grid_${row.id}`}
                                  checked={isChecked}
                                  onChange={() => setQ16SkillsGrid(prev => ({ ...prev, [row.id]: col.val }))}
                                  className="w-4 h-4 text-brand-primary focus:ring-brand-primary/20 cursor-pointer"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards for Q16 */}
                <div className="md:hidden space-y-4">
                  {SKILL_GRID_ROWS.map((row) => (
                    <div key={row.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <span className="font-bold text-slate-800 text-xs block">{row.label}</span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {SKILL_GRID_COLUMNS.map((col) => {
                          const isChecked = q16_skillsGrid[row.id] === col.val;
                          return (
                            <button
                              key={col.val}
                              type="button"
                              onClick={() => setQ16SkillsGrid(prev => ({ ...prev, [row.id]: col.val }))}
                              className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between ${
                                isChecked
                                  ? 'bg-brand-primary text-white font-semibold border-brand-primary'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{col.val}</span>
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 17 */}
              <div id="q17" className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label className="text-sm font-bold text-slate-800">
                    17. How prepared do you feel to use your data analytics skills to solve a real-world business problem independently? <span className="text-brand-error">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Multiple Choice
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PREPAREDNESS_OPTIONS.map((opt) => {
                    const isSelected = q17_realWorldPreparedness === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setQ17RealWorldPreparedness(opt.val)}
                        className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                          isSelected
                            ? 'bg-orange-50/90 border-brand-primary ring-2 ring-brand-primary/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <span className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <div>
                          <span className={`block text-xs font-bold ${isSelected ? 'text-brand-primary-dark' : 'text-slate-800'}`}>
                            {opt.label}
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            {opt.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 18 */}
              <div id="q18" className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label className="text-sm font-bold text-slate-800">
                    18. Which area do you still need the most support or practice in? <span className="text-brand-error">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Single Choice
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUPPORT_NEED_AREAS.map((area) => {
                    const isSelected = q18_areaNeedingMostSupport === area;
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setQ18AreaNeedingMostSupport(area)}
                        className={`p-3 rounded-xl border text-left text-xs flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-brand-primary text-white font-semibold border-brand-primary shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{area}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>

                {/* If Other selected, show custom text input */}
                {q18_areaNeedingMostSupport === 'Other' && (
                  <div className="mt-3 p-4 bg-orange-50/60 rounded-2xl border border-orange-200 animate-fade-in">
                    <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="q18_other">
                      Please specify the area you need support or practice in: <span className="text-brand-error">*</span>
                    </label>
                    <input
                      id="q18_other"
                      type="text"
                      value={q18_areaNeedingMostSupportOther}
                      onChange={(e) => setQ18AreaNeedingMostSupportOther(e.target.value)}
                      placeholder="e.g. Python for automation, cloud data warehouses, Tableau..."
                      className="form-input text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* =================================================================== */}
            {/* SECTION 5: FINAL REFLECTIONS AND RECOMMENDATIONS                    */}
            {/* =================================================================== */}
            <div ref={s5Ref} id="section5" className="portal-card bg-white space-y-8">
              <div className="pb-4 border-b border-slate-200/80">
                <span className="badge-primary mb-2 inline-block">Section 5 of 5</span>
                <h3 className="text-lg font-bold text-slate-900">
                  Section 5: Final reflections and recommendations
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Qualitative perspectives to identify what worked, uncover roadblocks, and elevate upcoming cohorts.
                </p>
              </div>

              {/* Question 19 */}
              <div id="q19" className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <label htmlFor="q19_input" className="text-sm font-bold text-slate-800">
                    19. What was the biggest challenge you faced during the programme, and how did it affect your learning? <span className="text-brand-error">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Paragraph
                  </span>
                </div>
                <textarea
                  id="q19_input"
                  rows={4}
                  value={q19_biggestChallengeFaced}
                  onChange={(e) => setQ19BiggestChallengeFaced(e.target.value)}
                  placeholder="Describe technical hurdles, time constraints, equipment challenges, or project complexities..."
                  className="form-input text-xs leading-relaxed"
                />
              </div>

              {/* Question 20 */}
              <div id="q20" className="space-y-2 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label htmlFor="q20_input" className="text-sm font-bold text-slate-800">
                    20. If you could change one thing about the programme to make it more effective for future students, what would it be? <span className="text-brand-error">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Paragraph
                  </span>
                </div>
                <textarea
                  id="q20_input"
                  rows={4}
                  value={q20_oneChangeForFutureStudents}
                  onChange={(e) => setQ20OneChangeForFutureStudents(e.target.value)}
                  placeholder="Share a specific practical recommendation for curriculum, timeline, practical lab sessions, or coaching..."
                  className="form-input text-xs leading-relaxed"
                />
              </div>

              {/* Question 21 */}
              <div id="q21" className="space-y-2 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label htmlFor="q21_input" className="text-sm font-bold text-slate-800">
                    21. What would you say are the programme's greatest strengths, and what are its most important areas for improvement? <span className="text-brand-error">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Paragraph
                  </span>
                </div>
                <textarea
                  id="q21_input"
                  rows={4}
                  value={q21_greatestStrengthsAndImprovements}
                  onChange={(e) => setQ21GreatestStrengthsAndImprovements(e.target.value)}
                  placeholder="Highlight key strengths (e.g. coaches, projects, peers) and top areas to refine for next cohort..."
                  className="form-input text-xs leading-relaxed"
                />
              </div>

              {/* Question 22: Best Student Dropdown */}
              <div id="q22" className="space-y-2 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <Award className="w-3.5 h-3.5" />
                    </span>
                    <span>22. If you were to select the best student from your class, who would you pick? <span className="text-brand-error">*</span></span>
                  </label>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Class Nomination
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Select the resident from your class whom you consider the best student overall (academics, analytical skills, consistency, problem solving).
                </p>
                <div className="relative">
                  <CustomSelect
                    value={q22_bestStudent}
                    onChange={(val) => setQ22BestStudent(val)}
                    placeholder="Select best student nomination..."
                    searchable={true}
                    emptyMessage="No resident students found"
                    options={studentOptions}
                  />
                </div>
                {missingFields.some(f => f.id === 'q22') && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Please select the best student nomination.
                  </p>
                )}
              </div>

              {/* Question 23: Best-Behaved Student Dropdown */}
              <div id="q23" className="space-y-2 pt-6 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                    </span>
                    <span>23. And who would you pick as the best-behaved student? <span className="text-brand-error">*</span></span>
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Conduct Nomination
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Select the resident from your class who demonstrated the highest standard of conduct, respect, discipline, punctuality, and peer collaboration.
                </p>
                <div className="relative">
                  <CustomSelect
                    value={q23_bestBehavedStudent}
                    onChange={(val) => setQ23BestBehavedStudent(val)}
                    placeholder="Select best-behaved student nomination..."
                    searchable={true}
                    emptyMessage="No resident students found"
                    options={studentOptions}
                  />
                </div>
                {missingFields.some(f => f.id === 'q23') && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Please select the best-behaved student nomination.
                  </p>
                )}
              </div>
            </div>

            {/* =================================================================== */}
            {/* SUBMIT BUTTON BAR                                                   */}
            {/* =================================================================== */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  End-of-Programme Feedback Form Ready
                </span>
                <span className="text-[11px] text-slate-500">
                  {answeredCount} of {totalCoreQuestions} questions answered · Responses are securely recorded
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleAutoFillSample}
                  className="btn-outline py-2.5 px-4 text-xs font-semibold w-full sm:w-auto"
                >
                  ⚡ Sample Answers
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-3 px-8 text-sm font-bold shadow-orange-glow w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Recording Feedback...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Programme Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. MANAGEMENT REVIEW RATIONALE MODAL                                      */}
      {/* ========================================================================= */}
      {showManagementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              type="button"
              onClick={() => setShowManagementModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-brand-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Management Questionnaire Blueprint
                </h3>
                <p className="text-xs text-slate-500">
                  Pedagogical & Evaluative Rationale for Leadership Review
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-600 max-h-[70vh] overflow-y-auto pr-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Section 1: Overall Programme Experience</h4>
                <p>Measures macro student satisfaction, alignment with pre-programme expectations, and organizational coordination.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Section 2: Team & Delivery (Scale 1–5)</h4>
                <p>Standardized 5-point Likert ratings covering clarity of instruction, application exercises, mentorship support, feedback utility, and pace. Includes an optional open field for frank critique.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Section 3: Student Self-Assessment & Commitment (Scale 1–5)</h4>
                <p>Balances institutional evaluation with personal accountability. Students rate attendance, self-study time outside class, proactive problem solving, and group collaboration.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Section 4: Skills Gained & Readiness</h4>
                <p>Features a 6-row Google Forms-style Matrix Grid tracking tangible delta (Much Lower → Much Higher) in Excel, SQL, Power BI, problem decomposition, communication, and independence, alongside industry preparedness.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Section 5: Final Reflections & Recommendations</h4>
                <p>Structured qualitative feedback on greatest challenges, key changes for next cohort, strengths, and open advice for sponsors.</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="font-bold block mb-1">Integration Status:</span>
                <p>Once management approves this format, it can be deployed directly into the student portal dashboard under a single navigation tab with one click.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManagementModal(false)}
                className="btn-primary py-2 px-5 text-xs font-semibold"
              >
                Done Reviewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUBMISSIONS DRAWER / MODAL FOR MANAGEMENT                             */}
      {/* ========================================================================= */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              type="button"
              onClick={() => setShowSubmissionsModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Recorded End-of-Programme Responses ({submissionsList.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Live data stored in browser LocalStorage / Google Apps Script
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 text-xs">
              {submissionsList.length === 0 ? (
                <p className="text-slate-400 py-6 text-center italic">No submissions recorded yet.</p>
              ) : (
                submissionsList.map((item, idx) => (
                  <div key={item.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/80">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{item.isAnonymous ? 'Confidential (Anonymous)' : item.studentName}</span>
                        <span className="text-[11px] font-normal text-slate-400">({item.classGroup || 'Cohort'})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge-primary">{item.q1_overallRating || 'Rated'}</span>
                        <span className="text-[10px] text-slate-400">{item.submittedAt}</span>
                      </div>
                    </div>
                    <p className="text-slate-600 italic mb-2">"{item.q4_mostValuableAspect}"</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                      <span><strong>Real-world readiness:</strong> {item.q17_realWorldPreparedness}</span>
                      <span>·</span>
                      <span><strong>Best Student pick:</strong> {item.q22_bestStudent || 'N/A'}</span>
                      <span>·</span>
                      <span><strong>Best-Behaved pick:</strong> {item.q23_bestBehavedStudent || 'N/A'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Data persists in <code>tsdp_end_of_programme_feedback</code>
              </span>
              <button
                type="button"
                onClick={() => setShowSubmissionsModal(false)}
                className="btn-primary py-2 px-5 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FOOTER (Hidden when viewed inside the student portal dashboard)        */}
      {/* ========================================================================= */}
      {!inPortal && (
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              © {new Date().getFullYear()} ITF-NECA Technical Skills Development Project (TSDP) · Powered by{' '}
              <strong className="text-brand-neutral">ShamzBridge Consult</strong>
            </p>
            <div className="flex items-center gap-3">
              <Link to="/final-feedback" className="text-brand-primary font-semibold hover:underline">
                Final Feedback Form
              </Link>
              <span className="text-slate-300">·</span>
              <Link to="/guide" className="hover:text-brand-primary transition-colors">
                Platform Guide
              </Link>
              <span className="text-slate-300">·</span>
              <Link to="/student/login" className="hover:text-brand-primary transition-colors">
                Resident Login
              </Link>
              <span className="text-slate-300">·</span>
              <Link to="/admin/login" className="hover:text-slate-900 transition-colors">
                Admin Login
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
