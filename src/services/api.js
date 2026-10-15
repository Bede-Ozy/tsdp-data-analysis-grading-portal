import axios from 'axios';

const PROXY_URL = '/api/proxy';

const API_URL = import.meta.env.PROD 
  ? PROXY_URL 
  : (import.meta.env.VITE_API_URL || PROXY_URL);

// Direct Google Apps Script URL (bypasses Vercel proxy for large payloads up to 50 MB)
const GAS_URL = import.meta.env.VITE_GAS_URL || 
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.includes('script.google.com') ? import.meta.env.VITE_API_URL : null) ||
  'https://script.google.com/macros/s/AKfycbyY9VbWzeoe0UR_riMeP6-8h6j01EIR3MVbUrKQJ4ZXAg14tZej574rNEmz6mUa0pfI/exec';

// Remove hardcoded fallback - key MUST come from .env
const API_KEY = import.meta.env.VITE_API_KEY;

// In-memory cache for slow-changing reference data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function clearApiCache() {
  cache.clear();
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(COHORT_ATTENDANCE_CACHE_KEY);
    }
  } catch (e) {
    // Ignore storage errors
  }
}

export async function callApiCached(functionName, parameters = [], ttl = CACHE_TTL, forceRefresh = false) {
  const cacheKey = `${functionName}:${JSON.stringify(parameters)}`;
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
  }

  const data = await callApi(functionName, parameters);

  if (data && data.success !== false) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  return data;
}

export async function callApi(functionName, parameters = [], maxRetries = 3) {
  const apiKey = (API_KEY || '').trim();
  if (!apiKey) {
    console.error('VITE_API_KEY is missing from .env file');
    return { 
      success: false, 
      message: 'API key not configured. Check .env file.' 
    };
  }

  const payload = {
    apiKey,
    function: functionName,
    parameters: parameters
  };

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        timeout: 15000
      });

      let data = response.data;
      
      // Handle if response is string
      if (typeof data === 'string') {
        // Detect Google Drive / Apps Script HTML error page returned as 200
        if (data.includes('<!DOCTYPE') || data.includes('<html') || data.includes('unable to open')) {
          throw new Error('Google Apps Script temporary HTML error response');
        }
        try {
          data = JSON.parse(data);
        } catch {
          console.error('Invalid JSON response from backend:', data);
          throw new Error('Invalid JSON response from backend');
        }
      }

      return data;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const rawData = typeof error.response?.data === 'string' ? error.response.data : '';
      const isHtmlError = rawData.includes('<!DOCTYPE') || rawData.includes('<html') || rawData.includes('unable to open');
      
      const isTimeout = error.code === 'ECONNABORTED' ||
                        error.code === 'ETIMEDOUT' ||
                        Boolean(error.message && error.message.toLowerCase().includes('timeout'));
      const isNetworkError = error.code === 'ERR_NETWORK' || (!error.response && Boolean(error.request));

      const isRetryable = isTimeout ||
                          isNetworkError ||
                          isHtmlError ||
                          Boolean(error.message && error.message.includes('Google Apps Script temporary HTML error')) ||
                          Boolean(error.message && error.message.includes('Invalid JSON response')) ||
                          [404, 408, 429, 500, 502, 503, 504].includes(status);

      if (isRetryable && attempt <= maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        const reason = isTimeout ? 'Timeout (15s)' : (status ? `status: ${status}` : (isNetworkError ? 'Network' : 'Parse/HTML'));
        console.warn(`[Retry ${attempt}/${maxRetries}] ${functionName} failed (${reason}). Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      console.error(`API Error calling '${functionName}':`, error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          const respStr = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data || '');
          if (respStr.includes('<!DOCTYPE') || respStr.includes('<html') || respStr.includes('ServiceLogin') || respStr.includes('unable to open')) {
            return { 
              success: false, 
              message: 'Google Apps Script Access Denied (401): Web App deployment permissions issue. Ensure "Execute as: Me" and "Who has access: Anyone" in Apps Script Deploy settings.' 
            };
          }
          return { 
            success: false, 
            message: 'Unauthorized: API key mismatch. Check SETTINGS sheet and .env file.' 
          };
        }
      }
      
      break;
    }
  }

  const finalStatus = lastError?.response?.status;
  const isFinalTimeout = lastError?.code === 'ECONNABORTED' ||
                         lastError?.code === 'ETIMEDOUT' ||
                         Boolean(lastError?.message && lastError?.message.toLowerCase().includes('timeout'));

  let fallbackMessage = 'Request failed';
  if (finalStatus === 404) {
    fallbackMessage = 'Backend temporarily unavailable (cold start). Please try again.';
  } else if (isFinalTimeout) {
    fallbackMessage = 'Request timed out after 15 seconds. Backend may be cold-starting; please try again.';
  } else if (lastError?.message) {
    fallbackMessage = lastError.message;
  }

  return { 
    success: false, 
    message: fallbackMessage
  };
}

/**
 * Direct API Call for Large Payloads (File Uploads)
 * Routes directly to Google Apps Script Web App, bypassing Vercel serverless proxy
 * to avoid the 4.5 MB request body limit (status 413 Payload Too Large).
 * Uses text/plain to avoid CORS preflight (OPTIONS).
 */
export async function callApiDirect(functionName, parameters = []) {
  const rawKey = import.meta.env.VITE_API_KEY || API_KEY || '';
  const apiKey = rawKey.trim();
  if (!apiKey) {
    console.error('VITE_API_KEY is missing from .env file');
    return {
      success: false,
      message: 'API key not configured. Check .env file.'
    };
  }

  const payload = {
    apiKey,
    function: functionName,
    parameters: parameters
  };

  try {
    // Apps Script requires text/plain to avoid CORS preflight
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      redirect: 'follow'
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('unable to open')) {
        return {
          success: false,
          message: 'Google Apps Script temporary service error. Please try again.'
        };
      }
      return {
        success: false,
        message: text || 'Invalid response from backend'
      };
    }
    return data;
  } catch (error) {
    console.error(`Direct API Error calling '${functionName}':`, error);
    return {
      success: false,
      message: error?.message || 'Direct upload request failed. Please check connection and file size.'
    };
  }
}

// Combined Dashboard Endpoints (Fast 1-Trip Loaders)
export const getStudentDashboard = (studentID) => 
  callApi('getStudentDashboard', [studentID]);

export const getCoachDashboard = () => 
  callApi('getCoachDashboard', []);

export const getAdminDashboard = () => 
  callApi('getAdminDashboard', []);

// Authentication
export const studentLogin = (studentNumber, email) => 
  callApi('studentLogin', [studentNumber, email]);

export const coachLogin = (coachNumber, email) => 
  callApi('coachLogin', [coachNumber, email]);

// Student Data
export const getStudentPerformance = (studentID) => 
  callApi('getStudentPerformance', [studentID]);

export const getAllStudentsPerformance = async () => {
  const res = await callApiCached('getAllStudentsPerformance', []);
  if (Array.isArray(res)) {
    return { success: true, data: res };
  }
  return res || { success: false, data: [] };
};

export const getAllStudents = async () => {
  const res = await callApiCached('getAllStudents', []);
  const list = Array.isArray(res) ? res : (res?.data || res?.students || []);
  return {
    success: true,
    data: list
  };
};

export const getStudentInfo = (studentID) => 
  callApi('getStudentInfo', [studentID]);

// Attendance
export const generateAttendanceCode = (weekNumber, dayNumber, sessionType, sessionPeriod = 'Morning') => 
  callApi('generateAttendanceCode', [weekNumber, dayNumber, sessionType, sessionPeriod]);

export const markAttendance = (studentNumber, sessionType, codeEntered, sessionPeriod = 'Morning') => 
  callApi('markAttendance', [studentNumber, sessionType, codeEntered, sessionPeriod]);

export const markAllPresent = (weekNumber, dayNumber, sessionType, sessionPeriod, coachID) => 
  callApi('markAllPresent', [weekNumber, dayNumber, sessionType, sessionPeriod, coachID]);

// Submissions (routed through callApiDirect to bypass Vercel 4.5MB limit for up to 40MB uploads)
export const handleTechnicalFileUpload = (studentNumber, assignmentID, weekNumber, dayNumber, tool, assignmentTitle, fileContentBase64, fileName) => 
  callApiDirect('handleTechnicalFileUpload', [studentNumber, assignmentID, weekNumber, dayNumber, tool, assignmentTitle, fileContentBase64, fileName]);

export const handleProfessionalFileUpload = (studentNumber, assignmentID, weekNumber, dayNumber, topic, assignmentTitle, fileContentBase64, fileName) => 
  callApiDirect('handleProfessionalFileUpload', [studentNumber, assignmentID, weekNumber, dayNumber, topic, assignmentTitle, fileContentBase64, fileName]);

export const handleModuleProjectUpload = (studentNumber, monthNumber, tool, projectTitle, filesArray) => 
  callApiDirect('handleModuleProjectUpload', [studentNumber, monthNumber, tool, projectTitle, filesArray]);

// Grading
export const gradeTechnicalSubmission = (submissionID, score, feedback, coachID) => 
  callApi('gradeTechnicalSubmission', [submissionID, score, feedback, coachID]);

export const gradeProfessionalSubmission = (submissionID, score, feedback, coachID) => 
  callApi('gradeProfessionalSubmission', [submissionID, score, feedback, coachID]);

export const recordClassActivity = (weekNumber, dayNumber, classType, tool, activityTitle, activityType, studentID, score, maxScore, notes, coachID) => 
  callApi('recordClassActivity', [weekNumber, dayNumber, classType, tool, activityTitle, activityType, studentID, score, maxScore, notes, coachID]);

export const bulkGradeModuleProjects = (monthNumber, tool, scoresArray, coachID) => 
  callApi('bulkGradeModuleProjects', [monthNumber, tool, scoresArray, coachID]);

export const gradeCapstoneSprint = (capstoneGroupID, sprintNumber, presentationScore, technicalScore, progressScore, feedback, evaluatedBy) => 
  callApi('gradeCapstoneSprint', [capstoneGroupID, sprintNumber, presentationScore, technicalScore, progressScore, feedback, evaluatedBy]);

export const gradeGroupPresentation = (weekNumber, dayNumber, group, topic, readinessScore, slideQualityScore, presentationQualityScore, answersScore, feedback, coachID) => 
  callApi('gradeGroupPresentation', [weekNumber, dayNumber, group, topic, readinessScore, slideQualityScore, presentationQualityScore, answersScore, feedback, coachID]);

export const gradeGroupPresentationV2 = (weekNumber, dayNumber, group, topic, readinessScore, slideQualityScore, presentationQualityScore, answersScore, presentMembers, feedback, coachID) => 
  callApi('gradeGroupPresentationV2', [weekNumber, dayNumber, group, topic, readinessScore, slideQualityScore, presentationQualityScore, answersScore, presentMembers, feedback, coachID]);

export const getGroupMembers = (groupName) => 
  callApi('getGroupMembers', [groupName]);

export const getGroupLeaderboard = () => 
  callApi('getGroupLeaderboard', []);

export const getStudentGroupRank = (studentID) => 
  callApi('getStudentGroupRank', [studentID]);

export const recordIndividualPresentation = (presentationID, studentID, questionAsked, responseScore, comments, coachID) => 
  callApi('recordIndividualPresentation', [presentationID, studentID, questionAsked, responseScore, comments, coachID]);

export const recordSoftSkillsEvaluation = (studentID, weekNumber, communicationScore, teamworkScore, leadershipScore, professionalismScore, problemSolvingScore, emotionalIntelligenceScore, comments, coachID) => 
  callApi('recordSoftSkillsEvaluation', [studentID, weekNumber, communicationScore, teamworkScore, leadershipScore, professionalismScore, problemSolvingScore, emotionalIntelligenceScore, comments, coachID]);

export const approveSocialMediaPost = (postID, score, feedback, coachID) => 
  callApi('approveSocialMediaPost', [postID, score, feedback, coachID]);

export const rejectSocialMediaPost = (postID, reason, coachID) =>
  callApi('rejectSocialMediaPost', [postID, reason, coachID]);

// Supplementary helpers
export const submitSocialMediaPost = (studentNumber, platform, postUrl, topic, caption = '', assignmentID = '') =>
  callApi('submitSocialMediaPost', [studentNumber, platform, postUrl, topic, caption, assignmentID]);

export const getPendingSubmissions = () => 
  callApi('getPendingSubmissions', []);

export const getPendingModuleProjects = () => 
  callApi('getPendingModuleProjects', []);

export const getPendingSocialPosts = () => 
  callApi('getPendingSocialPosts', []);

export const getAllCoaches = () => 
  callApiCached('getAllCoaches', []);

export const updateCoachStatus = (coachID, newStatus) => 
  callApi('updateCoachStatus', [coachID, newStatus]);

export const updateStudentStatus = (studentID, newStatus) => 
  callApi('updateStudentStatus', [studentID, newStatus]);

export const getStudentAttendance = (studentID) => 
  callApi('getStudentAttendance', [studentID]);

export const getStudentClassActivities = (studentID) => 
  callApi('getStudentClassActivities', [studentID]);

// Assignment Management
export const createAssignment = (type, category, title, description, deliverables, tool, weekNumber, dayNumber, monthNumber, maxScore, allowedFileTypes, maxFilesAllowed, dueDate, notes, materialsArray, coachID) => 
  callApi('createAssignment', [type, category, title, description, deliverables, tool, weekNumber, dayNumber, monthNumber, maxScore, allowedFileTypes, maxFilesAllowed, dueDate, notes, materialsArray, coachID]);

export const getActiveAssignments = () => 
  callApi('getActiveAssignments', []);

export const getAllAssignments = () => 
  callApi('getAllAssignments', []);

export const getAssignmentByID = (assignmentID) => 
  callApi('getAssignmentByID', [assignmentID]);

export const getStudentPendingAssignments = (studentID) => 
  callApi('getStudentPendingAssignments', [studentID]);

export const notifyStudentsOfAssignment = (assignmentID) => 
  callApi('notifyStudentsOfAssignment', [assignmentID]);

export const closeAssignment = (assignmentID) => 
  callApi('closeAssignment', [assignmentID]);

export const updateAssignment = (assignmentID, updates, coachID) => 
  callApi('updateAssignment', [assignmentID, updates, coachID]);

export const deleteAssignment = (assignmentID, coachID) => 
  callApi('deleteAssignment', [assignmentID, coachID]);

export const restoreAssignment = (assignmentID) => 
  callApi('restoreAssignment', [assignmentID]);

export const getAssignmentSubmissionCount = (assignmentID) => 
  callApi('getAssignmentSubmissionCount', [assignmentID]);

// Compliance
export const getStudentCompliance = (studentID) => 
  callApi('getStudentCompliance', [studentID]);

export const updateComplianceSummary = () => 
  callApi('updateComplianceSummary', []);

// Capstone Groups
export const createCapstoneGroup = (capstoneGroupName, classGroupsArray, projectTitle, problemStatement, notes, coachID) => 
  callApi('createCapstoneGroup', [capstoneGroupName, classGroupsArray, projectTitle, problemStatement, notes, coachID]);

export const getAllCapstoneGroups = () => 
  callApi('getAllCapstoneGroups', []);

export const getAllClassGroups = () => 
  callApi('getAllClassGroups', []);

// =========================================================================
// Cohort Attendance Cache & Concurrent Batch Loader
// =========================================================================
const COHORT_ATTENDANCE_CACHE_KEY = 'tsdp_cohort_attendance_cache';
const ATTENDANCE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache validity

/**
 * Returns cached attendance map synchronously from sessionStorage if valid.
 */
export function getCachedCohortAttendance() {
  try {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(COHORT_ATTENDANCE_CACHE_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < ATTENDANCE_CACHE_TTL)) {
      return parsed.data || null;
    }
  } catch (e) {
    // Graceful fallback on storage access error
  }
  return null;
}

/**
 * Concurrently fetches attendance records across all cohort students with batching,
 * caching results in sessionStorage to keep page interactions instant.
 */
export async function getCohortAttendanceMap(studentIDs = [], forceRefresh = false, onProgress = null) {
  if (!forceRefresh) {
    const cached = getCachedCohortAttendance();
    if (cached && Object.keys(cached).length > 0) {
      return cached;
    }
  }

  // Use provided student IDs or generate full cohort range (001 - 028)
  const ids = Array.isArray(studentIDs) && studentIDs.length > 0
    ? studentIDs
    : Array.from({ length: 28 }, (_, i) => `TSDP2026-RES-${String(i + 1).padStart(3, '0')}`);

  const attendanceMap = {};
  const batchSize = 6;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await Promise.all(batch.map(async id => {
      try {
        const res = await callApi('getStudentAttendance', [id]);
        if (res && res.attendanceRate !== undefined) {
          attendanceMap[id] = {
            attendanceRate: Number(res.attendanceRate),
            presentCount: Number(res.presentCount || 0),
            lateCount: Number(res.lateCount || 0),
            totalDays: Number(res.totalDays || 0)
          };
        }
      } catch (err) {
        // Tolerates individual failure
      }
    }));
    if (onProgress) {
      onProgress(Math.min(ids.length, i + batchSize), ids.length);
    }
  }

  try {
    if (typeof window !== 'undefined' && Object.keys(attendanceMap).length > 0) {
      sessionStorage.setItem(COHORT_ATTENDANCE_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: attendanceMap
      }));
    }
  } catch (e) {
    // Quota safety
  }

  return attendanceMap;
}

// =========================================================================
// Challenge Feedback & Program Round-Up Review API Endpoints
// =========================================================================
const FEEDBACK_STORAGE_KEY = 'tsdp_challenge_feedback_responses';
const FEEDBACK_SHEET_KEY = 'tsdp_feedback_sheet_id';

/**
 * Returns the configured target Google Sheet ID for Challenge Feedback.
 * Priority: localStorage override > import.meta.env.VITE_FEEDBACK_SHEET_ID > Sheet_ID > fallback
 */
export function getFeedbackSheetId() {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(FEEDBACK_SHEET_KEY);
      if (stored && stored.trim()) return stored.trim();
    }
  } catch (e) {}

  const envId = import.meta.env.VITE_FEEDBACK_SHEET_ID ||
                import.meta.env.Sheet_ID ||
                import.meta.env.SHEET_ID ||
                import.meta.env.VITE_SHEET_ID;
  if (envId && envId.trim()) return envId.trim();

  return '';
}

/**
 * Persists a target Google Sheet ID in local storage for quick configuration
 */
export function setFeedbackSheetId(sheetId) {
  try {
    if (typeof window !== 'undefined') {
      if (sheetId && sheetId.trim()) {
        localStorage.setItem(FEEDBACK_SHEET_KEY, sheetId.trim());
      } else {
        localStorage.removeItem(FEEDBACK_SHEET_KEY);
      }
    }
  } catch (e) {}
}

/**
 * Empty default feedback list (all dummy data removed so only live responses appear)
 */
export const DEFAULT_MOCK_FEEDBACK = [];

/**
 * Clears locally cached feedback responses
 */
export function clearFeedbackResponses() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FEEDBACK_STORAGE_KEY);
    }
  } catch (e) {}
}

/**
 * Submits student challenge feedback to the target Google Sheet.
 * Also persists locally to ensure submissions are immediately visible in dashboard.
 */
export async function submitChallengeFeedback(feedbackData, customSheetId = '') {
  const targetSheetId = (customSheetId || getFeedbackSheetId() || '').trim();
  
  const record = {
    id: feedbackData.id || `FB-${Date.now()}`,
    timestamp: new Date().toISOString(),
    submittedAt: new Date().toLocaleString(),
    studentID: feedbackData.studentID || '',
    studentNumber: feedbackData.studentNumber || '',
    studentName: feedbackData.studentName || '',
    email: feedbackData.email || '',
    classGroup: feedbackData.classGroup || '',
    
    // 9 Exact Learning Needs & Revision Questions
    modulesNeeded: Array.isArray(feedbackData.modulesNeeded) 
      ? feedbackData.modulesNeeded 
      : (feedbackData.primaryModule ? [feedbackData.primaryModule] : []),
    difficultTopics: (feedbackData.difficultTopics || feedbackData.detailedChallenges || '').trim(),
    theoryVsPractical: (feedbackData.theoryVsPractical || '').trim(),
    revisitTopics: (feedbackData.revisitTopics || (Array.isArray(feedbackData.topicsToReview) ? feedbackData.topicsToReview.join(', ') : '') || '').trim(),
    practicalChallenges: Array.isArray(feedbackData.practicalChallenges) 
      ? feedbackData.practicalChallenges 
      : (feedbackData.challengeTypes || []),
    confidenceExcel: Number(feedbackData.confidenceExcel || feedbackData.confidenceScore || 3),
    confidenceSql: Number(feedbackData.confidenceSql || feedbackData.confidenceScore || 3),
    confidencePowerBi: Number(feedbackData.confidencePowerBi || feedbackData.confidenceScore || 3),
    confidenceScore: Number(feedbackData.confidenceScore || 3),
    confidenceLabel: feedbackData.confidenceLabel || '',
    demonstrationAreas: (feedbackData.demonstrationAreas || feedbackData.specificQuestions || '').trim(),
    preferredLearningApproach: feedbackData.preferredLearningApproach || (Array.isArray(feedbackData.preferredReviewFormats) ? feedbackData.preferredReviewFormats[0] : '') || '',
    additionalFeedback: (feedbackData.additionalFeedback || feedbackData.suggestions || '').trim(),

    // Backward compatibility aliases for older 17-column Apps Script schemas
    primaryModule: Array.isArray(feedbackData.modulesNeeded) ? feedbackData.modulesNeeded.join(', ') : '',
    topicsToReview: (feedbackData.revisitTopics || feedbackData.theoryVsPractical) ? [(feedbackData.revisitTopics || ''), (feedbackData.theoryVsPractical || '')].filter(Boolean) : [],
    challengeTypes: Array.isArray(feedbackData.practicalChallenges) ? feedbackData.practicalChallenges : [],
    detailedChallenges: (feedbackData.difficultTopics || '').trim(),
    preferredReviewFormats: feedbackData.preferredLearningApproach ? [feedbackData.preferredLearningApproach] : [],
    specificQuestions: (feedbackData.demonstrationAreas || '').trim(),
    suggestions: (feedbackData.additionalFeedback || '').trim(),

    urgency: feedbackData.urgency || (Number(feedbackData.confidenceScore || 3) <= 2 ? 'Urgent' : (Number(feedbackData.confidenceScore || 3) === 3 ? 'Important' : 'Normal')),
    status: feedbackData.status || 'Pending Review',
    coachNotes: feedbackData.coachNotes || '',
    targetSheetId: targetSheetId
  };

  // 1. Save to local storage for instant dashboard updates
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      let list = raw ? JSON.parse(raw) : [];
      // Filter out any legacy dummy mock records
      list = Array.isArray(list) ? list.filter(item => !item.id?.startsWith('FB-2026-00')) : [];
      
      // If student already submitted, replace or prepend
      const existingIdx = list.findIndex(item => 
        (item.studentID && item.studentID === record.studentID) || 
        (item.studentNumber && item.studentNumber === record.studentNumber)
      );

      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...record };
      } else {
        list.unshift(record);
      }

      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('LocalStorage error while saving feedback:', e);
  }

  // 2. Transmit to Google Apps Script backend if configured
  try {
    const res = await callApi('submitChallengeFeedback', [record, targetSheetId]);
    if (res && res.success) {
      return {
        success: true,
        savedToSheet: true,
        message: 'Your challenge feedback was submitted successfully to the database!',
        data: res.data || record
      };
    } else if (res && res.success === false) {
      console.warn('Backend rejected submitChallengeFeedback:', res.message);
      return {
        success: false,
        savedToSheet: false,
        savedLocally: true,
        isNotAllowed: Boolean(res.message && res.message.includes('Function not allowed')),
        message: res.message || 'Google Sheet backend rejected the submission.',
        data: record
      };
    }
  } catch (err) {
    console.warn('Backend submitChallengeFeedback call failed, saved locally:', err);
    return {
      success: false,
      savedToSheet: false,
      savedLocally: true,
      message: err?.message || 'Network error while submitting to Google Sheet.',
      data: record
    };
  }

  // Local-only save fallback when no targetSheetId configured
  return {
    success: true,
    savedToSheet: false,
    savedLocally: true,
    message: 'Your challenge feedback has been recorded locally in this browser!',
    data: record,
    isLocalOnly: true
  };
}

/**
 * Retrieves the full list of Challenge Feedback responses.
 * Reads from Google Apps Script if available, merging with any locally recorded submissions.
 * Returns only genuine live submissions (dummy data strictly removed).
 */
export async function getChallengeFeedbackList(customSheetId = '', forceRefresh = false) {
  const targetSheetId = (customSheetId || getFeedbackSheetId() || '').trim();

  // 1. Try to read from backend
  let remoteList = null;
  if (targetSheetId) {
    try {
      const res = await callApi('getChallengeFeedbackList', [targetSheetId]);
      if (res && res.success && Array.isArray(res.data)) {
        remoteList = res.data.filter(item => !item.id?.startsWith('FB-2026-00'));
      }
    } catch (err) {
      console.warn('Error fetching remote challenge feedback:', err);
    }
  }

  // 2. Read from LocalStorage (purging legacy dummy records)
  let localList = [];
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Automatically purge any dummy mock data from previous sessions
        localList = Array.isArray(parsed)
          ? parsed.filter(item => !item.id?.startsWith('FB-2026-00'))
          : [];
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(localList));
      } else {
        localList = [];
      }
    }
  } catch (e) {
    localList = [];
  }

  // 3. Merge remote and local without duplicate IDs
  const combinedMap = new Map();

  if (Array.isArray(remoteList)) {
    remoteList.forEach(item => {
      const key = item.id || `${item.studentID}_${item.timestamp}`;
      combinedMap.set(key, item);
    });
  }

  localList.forEach(item => {
    const key = item.id || `${item.studentID}_${item.timestamp}`;
    if (!combinedMap.has(key)) {
      combinedMap.set(key, item);
    }
  });

  const finalResults = Array.from(combinedMap.values()).sort((a, b) => {
    return new Date(b.timestamp || b.submittedAt) - new Date(a.timestamp || a.submittedAt);
  });

  return {
    success: true,
    data: finalResults,
    sheetId: targetSheetId,
    totalResponses: finalResults.length
  };
}

/**
 * Updates review status or coach notes on a feedback item
 */
export async function updateFeedbackReviewStatus(feedbackId, newStatus, coachNotes = '') {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      let list = raw ? JSON.parse(raw) : [];
      list = list.filter(item => !item.id?.startsWith('FB-2026-00'));
      const idx = list.findIndex(item => item.id === feedbackId);
      if (idx >= 0) {
        list[idx].status = newStatus;
        if (coachNotes !== undefined) list[idx].coachNotes = coachNotes;
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {}

  const targetSheetId = getFeedbackSheetId();
  if (targetSheetId) {
    try {
      await callApi('updateFeedbackReviewStatus', [feedbackId, newStatus, coachNotes, targetSheetId]);
    } catch (e) {}
  }

  return { success: true };
}

