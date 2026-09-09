import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Server,
  Layers,
  FileCode,
  Key,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function Tutorial() {
  const [activeTab, setActiveTab] = useState('architecture');
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (codeKey, text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(codeKey);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const tabs = [
    { id: 'architecture', label: '1. Architecture & Flow', icon: Layers },
    { id: 'api', label: '2. API Integration', icon: Server },
    { id: 'auth', label: '3. Authentication & Roles', icon: Key },
    { id: 'files', label: '4. Base64 File Pipeline', icon: Upload },
    { id: 'extend', label: '5. Adding Pages & Endpoints', icon: FileCode },
    { id: 'troubleshoot', label: '6. Troubleshooting', icon: AlertTriangle },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-brand-neutral-border p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-brand-primary uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>System Documentation & Developer Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
          TSDP Grading Portal Technical Tutorial
        </h1>
        <p className="text-sm text-brand-neutral-muted mt-2 max-w-3xl">
          Everything you need to understand, maintain, customize, and extend the React frontend connected to the Google Apps Script & Google Sheets backend.
        </p>

        {/* Tab navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-gray-50 text-brand-neutral hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Architecture & Flow */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="portal-card space-y-4">
            <h2 className="text-xl font-bold text-brand-neutral flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-primary" />
              <span>System Architecture & High-Level Flow</span>
            </h2>
            <p className="text-sm text-brand-neutral-muted">
              The portal is decoupled into a fast, static-hosted React Single Page Application (SPA) on Vercel and a serverless Google Apps Script Web App backed by 18 interconnected Google Sheets and Google Drive folders.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 font-mono text-xs space-y-2">
              <div className="text-brand-primary font-bold">[React + Vite Frontend (Vercel)]</div>
              <div className="pl-4 text-brand-neutral-muted">
                │── User Interface (Tailwind CSS, React Router, Lucide Icons)<br />
                │── AuthContext (User session in LocalStorage: Student / Coach / Admin)<br />
                │── Axios Service Layer (`src/services/api.js`)<br />
                │── Base64 File Uploader (Converts binary files for Google Drive)
              </div>
              <div className="text-emerald-700 font-bold">│&nbsp;&nbsp;▼ (HTTPS POST JSON with apiKey)</div>
              <div className="text-brand-secondary font-bold">[Google Apps Script Web App Deployment]</div>
              <div className="pl-4 text-brand-neutral-muted">
                │── `doPost(e)` Router & Security Handlers<br />
                │── Google Sheets Database (18 Interconnected Sheets)<br />
                └── Google Drive Storage (Organized by Week & Resident ID)
              </div>
            </div>
          </div>

          <div className="portal-card space-y-3">
            <h3 className="text-base font-bold text-brand-neutral">Directory Organization</h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
{`tsdp-data-analysis-grading-portal/
├── public/
│   └── logos/               # NECA, ITF, ShamzBridge partner logos
├── src/
│   ├── components/          # Navbar, Sidebar, ScoreTable, FileUploader, etc.
│   ├── pages/
│   │   ├── student/         # 7 Resident student portal pages
│   │   ├── coach/           # 10 Instructor & tutor grading pages
│   │   ├── admin/           # 4 Cohort administration pages
│   │   └── Tutorial.jsx     # Comprehensive developer guide
│   ├── context/             # AuthContext (state & session restore)
│   ├── services/            # api.js (callApi Google Apps Script client)
│   ├── utils/               # constants.js (weights, rubrics, cohort data)
│   ├── App.jsx              # Central router configuration
│   ├── main.jsx             # React DOM entry point
│   └── index.css            # Tailwind & custom brand styling
├── .env.example             # Template for API URL and API Key
└── README.md                # Deployment & setup documentation`}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: API Integration */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="portal-card space-y-4">
            <h2 className="text-xl font-bold text-brand-neutral flex items-center gap-2">
              <Server className="w-5 h-5 text-brand-primary" />
              <span>How API Calls Work</span>
            </h2>
            <p className="text-sm text-brand-neutral-muted">
              All interactions with the Google Apps Script backend use a single POST endpoint sending a JSON payload containing the <code>apiKey</code>, the target <code>function</code> name, and an ordered <code>parameters</code> array.
            </p>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-xl font-mono text-xs overflow-x-auto relative">
              <button
                onClick={() => handleCopy('apiCode', `import axios from 'axios';\n\nconst API_URL = import.meta.env.VITE_API_URL;\nconst API_KEY = import.meta.env.VITE_API_KEY;\n\nexport async function callApi(functionName, parameters = []) {\n  const response = await axios.post(API_URL, {\n    apiKey: API_KEY,\n    function: functionName,\n    parameters: parameters\n  });\n  return response.data;\n}`)}
                className="absolute top-3 right-3 p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs flex items-center gap-1"
              >
                {copiedCode === 'apiCode' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'apiCode' ? 'Copied' : 'Copy'}</span>
              </button>
{`import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export async function callApi(functionName, parameters = []) {
  try {
    const response = await axios.post(API_URL, {
      apiKey: API_KEY,
      function: functionName,
      parameters: parameters
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Example wrapper for student login:
export const studentLogin = (studentNumber, email) => 
  callApi('studentLogin', [studentNumber, email]);`}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-neutral text-xs space-y-1">
              <span className="font-bold text-brand-primary">Graceful Offline / Mock Resilience:</span>
              <p className="text-brand-neutral-muted">
                If <code>VITE_API_URL</code> is not configured or in local development mode, <code>api.js</code> seamlessly executes a built-in mock dispatcher simulating student login (001), coach login (001), grading, and attendance!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Authentication & Roles */}
      {activeTab === 'auth' && (
        <div className="space-y-6">
          <div className="portal-card space-y-4">
            <h2 className="text-xl font-bold text-brand-neutral flex items-center gap-2">
              <Key className="w-5 h-5 text-brand-primary" />
              <span>Authentication & Role-Based Route Protection</span>
            </h2>
            <p className="text-sm text-brand-neutral-muted">
              Authentication is managed globally by <code>AuthContext.jsx</code> and persisted across browser reloads via <code>localStorage</code>. Protected routes ensure students, coaches, and administrators cannot access each other's consoles.
            </p>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
{`// src/components/ProtectedRoute.jsx
<Route
  path="/student/dashboard"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/coach/dashboard"
  element={
    <ProtectedRoute allowedRoles={['coach']}>
      <CoachDashboard />
    </ProtectedRoute>
  }
/>`}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-bold text-brand-primary block">Resident Student</span>
                <p className="text-brand-neutral-muted mt-1">Student Number (e.g., 001) + Registered Email.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-bold text-brand-secondary block">Coach / Instructor</span>
                <p className="text-brand-neutral-muted mt-1">Coach Number (e.g., 001) + Registered Email.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-bold text-brand-success block">System Administrator</span>
                <p className="text-brand-neutral-muted mt-1">Access Key (Demo: ADMIN-2026) + Email.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Base64 File Pipeline */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          <div className="portal-card space-y-4">
            <h2 className="text-xl font-bold text-brand-neutral flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-primary" />
              <span>Base64 File Upload Pipeline</span>
            </h2>
            <p className="text-sm text-brand-neutral-muted">
              Because Google Apps Script Web Apps do not accept raw multipart/form-data directly, all client files are encoded to clean Base64 strings in browser memory using FileReader before transmission.
            </p>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
{`// Converting a single file:
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Converting multiple files (up to 5 for Module Projects):
export async function filesToBase64Array(files) {
  const base64Array = [];
  for (const file of files) {
    const base64 = await fileToBase64(file);
    base64Array.push({
      name: file.name,
      content: base64
    });
  }
  return base64Array;
}`}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Adding Pages & Endpoints */}
      {activeTab === 'extend' && (
        <div className="space-y-6">
          <div className="portal-card space-y-4">
            <h2 className="text-xl font-bold text-brand-neutral flex items-center gap-2">
              <FileCode className="w-5 h-5 text-brand-primary" />
              <span>How to Add New Pages & Endpoints</span>
            </h2>
            <ol className="list-decimal list-inside space-y-3 text-sm text-brand-neutral">
              <li>
                <strong>Define API Wrapper in <code>src/services/api.js</code>:</strong>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs mt-1">
                  {`export const getCustomAnalytics = (param1, param2) =>\n  callApi('getCustomAnalytics', [param1, param2]);`}
                </pre>
              </li>
              <li>
                <strong>Create the Page Component:</strong>
                <p className="text-xs text-brand-neutral-muted mt-1">
                  Create a new file in <code>src/pages/student/</code>, <code>src/pages/coach/</code>, or <code>src/pages/admin/</code>.
                </p>
              </li>
              <li>
                <strong>Register Route in <code>src/App.jsx</code>:</strong>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs mt-1">
                  {`<Route path="/student/new-feature" element={<ProtectedRoute allowedRoles={['student']}><NewFeature /></ProtectedRoute>} />`}
                </pre>
              </li>
              <li>
                <strong>Add Link in <code>src/components/Sidebar.jsx</code>:</strong>
                <p className="text-xs text-brand-neutral-muted mt-1">
                  Add the route to <code>studentLinks</code>, <code>coachLinks</code>, or <code>adminLinks</code>.
                </p>
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab 6: Troubleshooting */}
      {activeTab === 'troubleshoot' && (
        <div className="space-y-6">
          <div className="portal-card space-y-4">
            <h2 className="text-xl font-bold text-brand-neutral flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-error" />
              <span>Common Issues & Troubleshooting</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-brand-neutral block">1. CORS Errors from Google Apps Script</span>
                <p className="text-brand-neutral-muted">
                  Ensure the Web App is deployed with <strong>Execute as: "Me"</strong> and <strong>Who has access: "Anyone"</strong>. Do not use restrictive Google Workspace domain restrictions for the execution endpoint.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-brand-neutral block">2. "Invalid API Key" Error</span>
                <p className="text-brand-neutral-muted">
                  Check that the <code>VITE_API_KEY</code> set in your <code>.env</code> file matches the secret key entered in the <code>SETTINGS</code> sheet of your Google Sheets database.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-brand-neutral block">3. Partner Logos Not Showing</span>
                <p className="text-brand-neutral-muted">
                  Place your logo image files into <code>public/logos/</code> with filenames: <code>neca-logo.png</code>, <code>itf-logo.png</code>, and <code>shamzbridge-logo.png</code>. The portal will automatically display them with smooth SVG fallbacks in place until added.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
