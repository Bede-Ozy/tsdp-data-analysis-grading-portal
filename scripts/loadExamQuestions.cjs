/**
 * loadExamQuestions.cjs
 * Run: node scripts/loadExamQuestions.cjs
 * Reads .env for API key, reads exam_questions_final.json, POSTs to backend.
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    const env = {};
    lines.forEach(l => {
      const m = l.match(/^\s*([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
    return env;
  } catch (e) {
    return {};
  }
}

const env = loadEnv();
const API_KEY = env.VITE_API_KEY || '';
const GAS_URL = env.VITE_GAS_URL || env.VITE_API_URL || '';

if (!API_KEY) {
  console.error('❌ VITE_API_KEY not found in .env');
  process.exit(1);
}

// Load questions
const questionsPath = path.join('C:\\Users\\USER\\.gemini\\antigravity\\brain\\e081d0ea-cde2-406b-83ff-53e4c1037030\\scratch\\exam_questions_final.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
console.log(`✅ Loaded ${questions.length} questions from JSON`);
console.log('Module distribution:', questions.reduce((acc, q) => {
  acc[q.module] = (acc[q.module] || 0) + 1; return acc;
}, {}));

const payload = JSON.stringify({
  apiKey: API_KEY,
  function: 'loadExamQuestions',
  parameters: [questions]
});

// Use fetch if available (Node 18+), else fallback
async function postToGAS() {
  // Always use direct GAS URL (VITE_API_URL is a relative proxy path, not usable in Node)
  const targetUrl = 'https://script.google.com/macros/s/AKfycbyY9VbWzeoe0UR_riMeP6-8h6j01EIR3MVbUrKQJ4ZXAg14tZej574rNEmz6mUa0pfI/exec';
  console.log(`\n📡 Posting to: ${targetUrl.substring(0, 60)}...`);
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
      redirect: 'follow'
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    console.log('\n📬 Response:', JSON.stringify(data, null, 2));
    if (data.success) {
      console.log(`\n✅ SUCCESS: ${data.loadedCount ?? questions.length} questions loaded.`);
      if (data.loadedCount !== undefined && data.loadedCount !== questions.length) {
        console.warn(`⚠️  DISCREPANCY: Sent ${questions.length}, backend confirmed ${data.loadedCount}`);
      }
    } else {
      console.error(`\n❌ FAILED: ${data.message || 'Unknown error'}`);
    }
  } catch (e) {
    console.error('❌ Fetch error:', e.message);
  }
}

postToGAS();
