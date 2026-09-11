import axios from 'axios';

const PROXY_URL = '/api/proxy';

const API_URL = import.meta.env.PROD 
  ? PROXY_URL 
  : (import.meta.env.VITE_API_URL || PROXY_URL);

// Remove hardcoded fallback - key MUST come from .env
const API_KEY = import.meta.env.VITE_API_KEY;

// In-memory cache for slow-changing reference data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function callApiCached(functionName, parameters = [], ttl = CACHE_TTL) {
  const cacheKey = `${functionName}:${JSON.stringify(parameters)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await callApi(functionName, parameters);

  if (data && data.success !== false) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  return data;
}

export async function callApi(functionName, parameters = [], retries = 3) {
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

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
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
      
      const isColdStart = status === 404 || status === 500 || status === 502 || status === 503 || error.code === 'ECONNABORTED' || isHtmlError || error.message.includes('Google Apps Script temporary HTML error');

      if (isColdStart && attempt < retries) {
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        console.warn(`[Retry ${attempt}/${retries}] ${functionName} failed (status: ${status || 'Network/Parse'}). Retrying in ${waitTime}ms...`);
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

  return { 
    success: false, 
    message: lastError?.response?.status === 404 
      ? 'Backend temporarily unavailable (cold start). Please try again.' 
      : lastError?.message || 'Request failed'
  };
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
export const generateAttendanceCode = (weekNumber, dayNumber, sessionType) => 
  callApi('generateAttendanceCode', [weekNumber, dayNumber, sessionType]);

export const markAttendance = (studentNumber, sessionType, codeEntered) => 
  callApi('markAttendance', [studentNumber, sessionType, codeEntered]);

// Submissions
export const handleTechnicalFileUpload = (studentNumber, assignmentID, weekNumber, dayNumber, tool, assignmentTitle, fileContentBase64, fileName) => 
  callApi('handleTechnicalFileUpload', [studentNumber, assignmentID, weekNumber, dayNumber, tool, assignmentTitle, fileContentBase64, fileName]);

export const handleProfessionalFileUpload = (studentNumber, assignmentID, weekNumber, dayNumber, topic, assignmentTitle, fileContentBase64, fileName) => 
  callApi('handleProfessionalFileUpload', [studentNumber, assignmentID, weekNumber, dayNumber, topic, assignmentTitle, fileContentBase64, fileName]);

export const handleModuleProjectUpload = (studentNumber, monthNumber, tool, projectTitle, filesArray) => 
  callApi('handleModuleProjectUpload', [studentNumber, monthNumber, tool, projectTitle, filesArray]);

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

export const recordIndividualPresentation = (presentationID, studentID, questionAsked, responseScore, comments, coachID) => 
  callApi('recordIndividualPresentation', [presentationID, studentID, questionAsked, responseScore, comments, coachID]);

export const recordSoftSkillsEvaluation = (studentID, weekNumber, communicationScore, teamworkScore, leadershipScore, professionalismScore, problemSolvingScore, emotionalIntelligenceScore, comments, coachID) => 
  callApi('recordSoftSkillsEvaluation', [studentID, weekNumber, communicationScore, teamworkScore, leadershipScore, professionalismScore, problemSolvingScore, emotionalIntelligenceScore, comments, coachID]);

export const approveSocialMediaPost = (postID, score, feedback, coachID) => 
  callApi('approveSocialMediaPost', [postID, score, feedback, coachID]);

// Supplementary helpers
export const submitSocialMediaPost = (studentNumber, platform, postUrl, topic) =>
  callApi('submitSocialMediaPost', [studentNumber, platform, postUrl, topic]);

export const getPendingSubmissions = () => 
  callApi('getPendingSubmissions', []);

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
