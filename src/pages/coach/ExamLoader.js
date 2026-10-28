/**
 * One-time script to load exam questions via the loadExamQuestions API.
 * Run via: node scripts/loadExamQuestions.js
 * 
 * This reads exam_questions_final.json and POSTs to the backend.
 * Keep this file for audit/record purposes.
 */

import questions from '../brain/e081d0ea-cde2-406b-83ff-53e4c1037030/scratch/exam_questions_final.json' assert { type: 'json' };

// This script is intended to be adapted for direct API call if needed.
// The actual loading is done via the admin UI or the loadExamQuestions API call
// in the app. See ExamAdminLoader below.
console.log(`Prepared ${questions.length} exam questions for loading.`);
console.log('Module distribution:', questions.reduce((acc, q) => {
  acc[q.module] = (acc[q.module] || 0) + 1;
  return acc;
}, {}));

