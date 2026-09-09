# TSDP Data Analysis Grading Portal — React Frontend

Automated Grading, Attendance, and Performance Portal for the 4-month Data Analytics Training Program sponsored by **ITF-NECA-TSDP** (Technical Skills Development Project) and implemented by **ShamzBridge Consult**.

The system tracks 27 resident students across 9 grading components (Technical, Professional, Class Activities, Social Media, Monthly Module Projects, Capstone Projects, Group Presentations, Attendance, and Soft Skills) and connects via API to a Google Apps Script & Google Sheets backend.

---

## 🎨 Official Brand Color Scheme

- **Primary:** Blue (`#0054A6`) — NECA brand, primary action buttons, main headers
- **Secondary:** Orange (`#F58220`) — ShamzBridge brand, accents, highlight badges
- **Neutral:** Dark Grey (`#333333`) — Text, dark borders
- **Background:** Light Grey (`#F5F5F5`) — Page background
- **Success:** Deep Blue (`#003366`) — Success status, verification badges
- **Error:** Red (`#DC2626`) — Validation and error alerts

---

## 🖼️ Where to Place Partner Logos

Place your image files in the [`public/logos/`](file:///public/logos/) folder:

1. **`neca-logo.png`** — Nigeria Employers' Consultative Association (NECA)
2. **`itf-logo.png`** — Industrial Training Fund (ITF)
3. **`shamzbridge-logo.png`** — ShamzBridge Consult
4. **`tsdp-logo.png`** — (Optional) Technical Skills Development Project

> **Note:** The application includes intelligent SVG fallback badges with the exact brand colors, so navigation and reports render cleanly even before image files are copied into the folder.

---

## ⚙️ Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (Custom brand tokens)
- **Routing:** React Router DOM (v6) with Role-Based Route Guards
- **HTTP Client:** Axios (POST payload contract matching Apps Script)
- **State Management:** React Context API (`AuthContext.jsx`)
- **Icons:** Lucide React
- **Deployment:** Vercel (Production ready)

---

## 📁 Project Architecture

```
tsdp-data-analysis-grading-portal/
├── public/
│   ├── logos/                     <-- Put NECA, ITF & ShamzBridge PNG logos here
│   │   └── README.txt
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Navbar.jsx             # Partner logos, role badge, tutorial link, logout
│   │   ├── Sidebar.jsx            # Role-based navigation menu (Student, Coach, Admin)
│   │   ├── StudentCard.jsx        # Resident score card, badges, and quick links
│   │   ├── ScoreTable.jsx         # 9-component weighted aggregate breakdown table
│   │   ├── AttendanceCodeDisplay.jsx # 6-character code with 10-min countdown timer
│   │   ├── FileUploader.jsx       # Drag & drop file upload with Base64 converter
│   │   ├── LoadingSpinner.jsx     # Loading feedback spinner
│   │   └── ProtectedRoute.jsx     # Route guarding by role (student/coach/admin)
│   ├── pages/
│   │   ├── student/
│   │   │   ├── StudentLogin.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── MarkAttendance.jsx
│   │   │   ├── SubmitAssignment.jsx
│   │   │   ├── SubmitModuleProject.jsx
│   │   │   ├── SubmitSocialMedia.jsx
│   │   │   └── ViewPerformance.jsx
│   │   ├── coach/
│   │   │   ├── CoachLogin.jsx
│   │   │   ├── CoachDashboard.jsx
│   │   │   ├── GenerateAttendanceCode.jsx
│   │   │   ├── GradeSubmissions.jsx
│   │   │   ├── RecordClassActivity.jsx
│   │   │   ├── GradeModuleProjects.jsx
│   │   │   ├── GradeCapstoneSprints.jsx
│   │   │   ├── GradeGroupPresentations.jsx
│   │   │   ├── SoftSkillsEvaluation.jsx
│   │   │   └── ApproveSocialMedia.jsx
│   │   ├── admin/
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageStudents.jsx
│   │   │   ├── ManageCoaches.jsx
│   │   │   └── ViewReports.jsx
│   │   └── Tutorial.jsx           # Technical documentation & guide
│   ├── context/
│   │   └── AuthContext.jsx        # Authentication and session persistence
│   ├── services/
│   │   └── api.js                 # Apps Script API client with offline demo fallback
│   ├── utils/
│   │   └── constants.js           # 9 component weights, modules, roster
│   ├── App.jsx                    # Central routing definition
│   ├── main.jsx                   # React DOM entry
│   └── index.css                  # Custom Tailwind components and design tokens
├── .env.example
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🔑 Environment Variables & Setup

### 1. Create `.env` file
Copy the provided `.env.example` template:
```bash
cp .env.example .env
```

Set the values in `.env`:
```ini
# Google Apps Script Web App Deployment URL
VITE_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Secret API Key configured in the SETTINGS sheet of Google Sheets
VITE_API_KEY=YOUR_SECRET_API_KEY_HERE
```

- **Where to get `VITE_API_URL`:** In Google Apps Script, click **Deploy > Manage Deployments** and copy the Web App URL (ending in `/exec`).
- **Where to get `VITE_API_KEY`:** Check cell B2 in the **SETTINGS** sheet of your Google Sheets database.

*(Note: During local development or if `VITE_API_URL` contains placeholder text, the portal automatically operates in offline demo mode with mock data, so all pages can be tested immediately.)*

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. Test build:
   ```bash
   npm run build
   ```

---

## 🧪 Demo Test Credentials

Quick-fill buttons are provided on all login screens for one-click testing:

| Role | Identifier / Number | Email / Key | Destination |
|------|--------------------|-------------|-------------|
| **Resident Student 1** | `001` | `student1@shamzbridge.com` | Resident Dashboard |
| **Resident Student 2** | `002` | `student2@shamzbridge.com` | Resident Dashboard |
| **Lead Coach (Tech)** | `001` | `coach1@shamzbridge.com` | Coach Console |
| **Professional Coach** | `002` | `coach2@shamzbridge.com` | Coach Console |
| **Administrator** | `ADMIN-2026` | `admin@shamzbridge.com` | Admin Dashboard |

---

## 🚢 Deploying to Vercel

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: TSDP Grading Portal Frontend"
   git remote add origin https://github.com/YOUR_USERNAME/tsdp-data-analysis-grading-portal.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Framework Preset will automatically detect **Vite**.
5. In **Environment Variables**, add:
   - `VITE_API_URL` = Your live Google Apps Script Web App URL
   - `VITE_API_KEY` = Your secret API key
6. Click **Deploy**.
