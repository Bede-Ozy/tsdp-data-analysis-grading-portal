import axios from 'axios';

const PROXY_URL = '/api/proxy';

const API_URL = import.meta.env.PROD 
  ? PROXY_URL 
  : (import.meta.env.VITE_API_URL || PROXY_URL);

// Remove hardcoded fallback - key MUST come from .env
const API_KEY = import.meta.env.VITE_API_KEY;

export async function callApi(functionName, parameters = []) {
  try {
    if (!API_KEY) {
      console.error('VITE_API_KEY is missing from .env file');
      return { 
        success: false, 
        message: 'API key not configured. Check .env file.' 
      };
    }

    const payload = {
      apiKey: API_KEY.trim(),
      function: functionName,
      parameters: parameters
    };

    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    let data = response.data;
    
    // Handle if response is string
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        console.error('Invalid response from backend:', data);
        return { success: false, message: 'Invalid response from backend' };
      }
    }

    return data;
  } catch (error) {
    console.error(`API Error calling '${functionName}':`, error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      if (error.response.status === 401) {
        const rawData = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data || '');
        if (rawData.includes('<!DOCTYPE') || rawData.includes('<html') || rawData.includes('ServiceLogin') || rawData.includes('unable to open')) {
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
    
    return { success: false, message: error.message };
  }
}


// Authentication
export const studentLogin = (studentNumber, email) => 
  callApi('studentLogin', [studentNumber, email]);

export const coachLogin = (coachNumber, email) => 
  callApi('coachLogin', [coachNumber, email]);

// Student Data
export const getStudentPerformance = (studentID) => 
  callApi('getStudentPerformance', [studentID]);

export const getAllStudentsPerformance = async () => {
  const res = await callApi('getAllStudentsPerformance', []);
  if (Array.isArray(res)) {
    return { success: true, data: res };
  }
  return res || { success: false, data: [] };
};

export const getAllStudents = async () => {
  const res = await callApi('getAllStudents', []);
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
  callApi('getAllCoaches', []);
