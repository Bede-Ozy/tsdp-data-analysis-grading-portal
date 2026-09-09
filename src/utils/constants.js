/**
 * TSDP Data Analysis Grading Portal Constants
 * ITF-NECA Technical Skills Development Project & ShamzBridge Consult
 */

export const PROGRAM_INFO = {
  name: "ITF-NECA Technical Skills Development Project (TSDP)",
  subTitle: "Data Analytics Training Program 2026",
  partner: "ShamzBridge Consult",
  totalStudents: 27,
  durationMonths: 4,
  currentWeek: 6,
  totalWeeks: 16,
};

// Official Grading Weights (100% Total)
export const GRADING_WEIGHTS = [
  { id: "technicalAssignments", name: "Technical Assignments", weight: 10, maxScore: 100, color: "bg-blue-500" },
  { id: "professionalAssignments", name: "Professional Assignments", weight: 5, maxScore: 100, color: "bg-orange-500" },
  { id: "classActivities", name: "Class Activities", weight: 5, maxScore: 100, color: "bg-indigo-500" },
  { id: "socialMedia", name: "Social Media Posts", weight: 5, maxScore: 100, color: "bg-purple-500" },
  { id: "moduleProjects", name: "Module Projects", weight: 20, maxScore: 100, color: "bg-emerald-500" },
  { id: "capstoneProjects", name: "Capstone Projects", weight: 25, maxScore: 100, color: "bg-amber-500" },
  { id: "groupPresentations", name: "Group Presentations", weight: 10, maxScore: 100, color: "bg-cyan-500" },
  { id: "attendance", name: "Attendance & Punctuality", weight: 10, maxScore: 100, color: "bg-teal-500" },
  { id: "softSkills", name: "Soft Skills Assessment", weight: 10, maxScore: 100, color: "bg-pink-500" },
];

export const MODULES = [
  { month: 1, tool: "Excel", title: "Spreadsheet Modeling & Advanced Analytics", active: true },
  { month: 2, tool: "SQL", title: "Relational Database Design & Querying", active: true },
  { month: 3, tool: "PowerBI", title: "Business Intelligence, DAX & Dashboards", active: true },
  { month: 4, tool: "Python", title: "Data Science, Pandas, NumPy & Visualization", active: true },
];

export const TOOLS_LIST = ["Excel", "SQL", "PowerBI", "Python"];

export const SESSION_TYPES = ["Physical", "Online"];

export const SOCIAL_PLATFORMS = ["LinkedIn", "Twitter / X", "Facebook", "Instagram"];

export const SOFT_SKILLS_CRITERIA = [
  { key: "communication", label: "Communication & Clarity", max: 5 },
  { key: "teamwork", label: "Teamwork & Collaboration", max: 5 },
  { key: "leadership", label: "Leadership & Initiative", max: 5 },
  { key: "professionalism", label: "Professionalism & Work Ethic", max: 5 },
  { key: "problemSolving", label: "Analytical Problem Solving", max: 5 },
  { key: "emotionalIntelligence", label: "Emotional Intelligence & Feedback", max: 5 },
];

export const CAPSTONE_GROUPS = [
  { id: "CAP-01", name: "Capstone Group 1: Healthcare & Logistics Analytics" },
  { id: "CAP-02", name: "Capstone Group 2: Fintech & Consumer Intelligence" },
];

export const PRESENTATION_RUBRICS = [
  { key: "readiness", label: "Group Readiness & Coordination", max: 5 },
  { key: "slideQuality", label: "Slide Quality & Data Visualization", max: 5 },
  { key: "presentationQuality", label: "Delivery & Presentation Quality", max: 5 },
  { key: "answersScore", label: "Handling Q&A & Technical Defense", max: 5 },
];

// Helper to calculate final grade letter
export function getGradeLetter(score) {
  if (score === null || score === undefined || isNaN(score)) return { letter: "-", label: "N/A", color: "text-gray-500 bg-gray-50 border-gray-200" };
  const num = Number(score);
  if (num >= 70) return { letter: "A", label: "Distinction", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (num >= 60) return { letter: "B", label: "Merit", color: "text-blue-600 bg-blue-50 border-blue-200" };
  if (num >= 50) return { letter: "C", label: "Credit", color: "text-amber-600 bg-amber-50 border-amber-200" };
  if (num >= 45) return { letter: "D", label: "Pass", color: "text-orange-600 bg-orange-50 border-orange-200" };
  return { letter: "F", label: "Fail / Incomplete", color: "text-red-600 bg-red-50 border-red-200" };
}

