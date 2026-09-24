import { jsPDF } from 'jspdf';

/**
 * Generates an executive, non-technical PDF breakdown report
 * styled with the brand Orange (#F58220) and clean typography.
 */
export function generatePlatformPdfReport() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();   // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  const maxY = pageHeight - 16; // 16mm bottom margin

  let currentY = 16;
  let currentPage = 1;

  // Colors
  const ORANGE = [245, 130, 32];        // #F58220 Brand Primary Orange
  const DARK_ORANGE = [217, 110, 20];   // #D96E14
  const LIGHT_ORANGE = [254, 243, 233]; // #FEF3E9 Background tint
  const BLUE = [0, 84, 166];            // #0054A6 NECA Brand Blue
  const SLATE_DARK = [15, 23, 42];      // #0F172A Main Text
  const SLATE_MUTED = [71, 85, 105];    // #475569 Secondary Text
  const BORDER_COLOR = [226, 232, 240]; // #E2E8F0

  // Helper: Top Header
  const drawPageHeader = () => {
    // Top orange accent band
    doc.setFillColor(...ORANGE);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Running top banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK_ORANGE);
    doc.text('ITF-NECA TSDP 2026 DATA ANALYTICS PORTAL', marginX, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_MUTED);
    doc.text('Non-Technical Platform Operations Guide', pageWidth - marginX, 10, { align: 'right' });

    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(marginX, 12, pageWidth - marginX, 12);
  };

  // Helper: Bottom Footer
  const drawPageFooter = (pageNum) => {
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_MUTED);
    doc.text('ShamzBridge Consult · Technical Skills Development Project', marginX, pageHeight - 7);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_ORANGE);
    doc.text(`Page ${pageNum}`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
  };

  // Helper: Page Break Check
  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > maxY) {
      drawPageFooter(currentPage);
      doc.addPage();
      currentPage++;
      drawPageHeader();
      currentY = 18;
    }
  };

  // ----------------------------------------------------
  // INITIAL PAGE SETUP
  // ----------------------------------------------------
  drawPageHeader();

  // ----------------------------------------------------
  // COVER / TITLE BANNER (Page 1)
  // ----------------------------------------------------
  doc.setFillColor(...LIGHT_ORANGE);
  doc.roundedRect(marginX, currentY, contentWidth, 36, 3, 3, 'F');

  // Left vertical brand bar
  doc.setFillColor(...ORANGE);
  doc.roundedRect(marginX, currentY, 3, 36, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK_ORANGE);
  doc.text('Platform Operations & Workflow Breakdown', marginX + 7, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_DARK);
  doc.text('A Clear, Simple Guide for Trainees, Coaches & Stakeholders', marginX + 7, currentY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.text('Organized by Industrial Training Fund (ITF) & NECA · Managed by ShamzBridge Consult', marginX + 7, currentY + 26);
  doc.text(`Published: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · Version 2.0`, marginX + 7, currentY + 32);

  currentY += 42;

  // ----------------------------------------------------
  // SECTION 1: EXECUTIVE OVERVIEW (Plain English)
  // ----------------------------------------------------
  checkPageBreak(35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_ORANGE);
  doc.text('1. What is the Data Analytics Grading Portal?', marginX, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_DARK);
  const overviewText = 
    'The TSDP Grading Portal is a secure, easy-to-use web application built for the 2026 Data Analytics Cohort. ' +
    'It replaces manual paperwork and spreadsheets by bringing attendance check-in, assignment grading, project uploads, ' +
    'and student report cards into one central place.\n\n' +
    'The platform serves three distinct user roles:\n' +
    '• Residents (Students): Submit weekly assignments, check in for morning & afternoon classes, and track their scores.\n' +
    '• Coaches (Instructors): Generate attendance codes, review student projects, record lab activities, and grade presentations.\n' +
    '• Administrators (Leadership): Oversee cohort attendance, organize capstone teams, and generate official graduation reports.';
  
  const splitOverview = doc.splitTextToSize(overviewText, contentWidth);
  doc.text(splitOverview, marginX, currentY);
  currentY += splitOverview.length * 4.2 + 6;

  // ----------------------------------------------------
  // SECTION 2: HOW FINAL GRADES ARE CALCULATED
  // ----------------------------------------------------
  checkPageBreak(50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_ORANGE);
  doc.text('2. How Trainee Grades Are Calculated (100% Total)', marginX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.text('Scores are weighted across 7 balanced categories to reflect both technical mastery and workplace readiness:', marginX, currentY);
  currentY += 6;

  const weights = [
    { title: 'Technical Tasks', pct: '30%', desc: 'Weekly hands-on exercises in Excel, SQL, and Power BI.' },
    { title: 'Capstone Project', pct: '20%', desc: 'End-of-cohort group project defended before industry judges.' },
    { title: 'Class Activities', pct: '15%', desc: 'Daily lab drills, class participation, and practical pop-quizzes.' },
    { title: 'Module Projects', pct: '15%', desc: 'Comprehensive monthly portfolio deliverables for each tool.' },
    { title: 'Soft Skills', pct: '10%', desc: 'Bi-weekly evaluation of communication, teamwork, and leadership.' },
    { title: 'Social Media', pct: '5%', desc: 'Public LinkedIn posts sharing tech learnings and building portfolios.' },
    { title: 'Attendance', pct: '5%', desc: 'Daily presence in both Morning and Afternoon class sessions.' },
  ];

  // Draw 2-column cards for the weights
  const colWidth = (contentWidth - 4) / 2;
  weights.forEach((item, idx) => {
    checkPageBreak(16);
    const col = idx % 2;
    const x = marginX + col * (colWidth + 4);
    const y = currentY;

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(x, y, colWidth, 14, 2, 2, 'FD');

    // Left orange pill for percentage
    doc.setFillColor(...ORANGE);
    doc.roundedRect(x + 2, y + 2, 14, 10, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(item.pct, x + 9, y + 8, { align: 'center' });

    // Title & description
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE_DARK);
    doc.text(item.title, x + 19, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_MUTED);
    const splitDesc = doc.splitTextToSize(item.desc, colWidth - 21);
    doc.text(splitDesc, x + 19, y + 10.5);

    if (col === 1 || idx === weights.length - 1) {
      currentY += 16;
    }
  });

  currentY += 4;

  // ----------------------------------------------------
  // SECTION 3: THE RESIDENT (STUDENT) EXPERIENCE
  // ----------------------------------------------------
  checkPageBreak(55);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_ORANGE);
  doc.text('3. Step-by-Step Guide for Residents (Students)', marginX, currentY);
  currentY += 5;

  const residentSteps = [
    {
      step: 'Step 1: Logging In',
      desc: 'Residents enter their unique ID (e.g. TSDP2026-RES-001). No complex passwords are required; each resident is automatically directed to their personal dashboard.'
    },
    {
      step: 'Step 2: Marking Daily Attendance',
      desc: 'Each day has two sessions: Morning and Afternoon. The coach displays a 4-letter code on the projector. Trainees select the session on their screen and type the code within 15 minutes.'
    },
    {
      step: 'Step 3: Submitting Class Assignments',
      desc: 'Under "Assignments Due", trainees see all pending work. They attach their Excel (.xlsx), Power BI (.pbix), or SQL files. Files are automatically backed up to Google Drive.'
    },
    {
      step: 'Step 4: Monthly Module Projects',
      desc: 'At the end of each topic, trainees bundle their dataset, analysis report, and dashboard into a single project submission for deep-dive coach grading.'
    },
    {
      step: 'Step 5: Sharing Social Media Posts',
      desc: 'Trainees publish a post on LinkedIn or Twitter summarizing what they learned. They paste the post link into the portal and can see how many posts the coach has approved (e.g., 2/3 approved).'
    },
    {
      step: 'Step 6: Checking Grades & Leaderboards',
      desc: 'The resident dashboard updates in real time, showing cumulative percentage, attendance rate, assignment completion rate, and their team standing on the group leaderboard.'
    }
  ];

  residentSteps.forEach((s) => {
    checkPageBreak(18);
    // Left mini badge
    doc.setFillColor(...LIGHT_ORANGE);
    doc.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, 'F');
    doc.setFillColor(...ORANGE);
    doc.circle(marginX + 6, currentY + 7, 3.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('✓', marginX + 6, currentY + 8.2, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK_ORANGE);
    doc.text(s.step, marginX + 13, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_DARK);
    const descLines = doc.splitTextToSize(s.desc, contentWidth - 17);
    doc.text(descLines, marginX + 13, currentY + 9.5);

    currentY += 16;
  });

  currentY += 4;

  // ----------------------------------------------------
  // SECTION 4: THE COACH (INSTRUCTOR) EXPERIENCE
  // ----------------------------------------------------
  checkPageBreak(55);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_ORANGE);
  doc.text('4. Step-by-Step Guide for Coaches (Instructors)', marginX, currentY);
  currentY += 5;

  const coachSteps = [
    {
      step: 'Step 1: Starting Class & Generating Attendance',
      desc: 'Coaches open the "Attendance Code" page, select Morning or Afternoon, and click Generate. A large 4-character code appears on screen. Coaches can also click "Mark All Present" if roll-call was done verbally.'
    },
    {
      step: 'Step 2: Grading Student Assignments',
      desc: 'Coaches open "Grade Assignments" to view student files with one click. They enter a score from 0 to 100 and write constructive advice to help the trainee improve.'
    },
    {
      step: 'Step 3: Logging In-Class Activities',
      desc: 'When trainees complete a live classroom drill or pop-quiz, the coach records the score on the spot, ensuring instant feedback and automated grade calculation.'
    },
    {
      step: 'Step 4: Evaluating Group Presentations & Sprints',
      desc: 'During Capstone sprint defenses, coaches evaluate slide deck quality, presentation poise, and technical responses. Present team members are marked for attendance credit.'
    },
    {
      step: 'Step 5: Soft Skills Reviews',
      desc: 'Every two weeks, coaches rate students across 6 key workplace skills: Communication, Teamwork, Leadership, Professionalism, Problem Solving, and Emotional Intelligence.'
    },
    {
      step: 'Step 6: Approving Public Learning Posts',
      desc: 'Coaches review students’ LinkedIn posts to ensure high quality and professional standards, awarding up to 5 points per approved post.'
    }
  ];

  coachSteps.forEach((s) => {
    checkPageBreak(18);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, 'FD');

    doc.setFillColor(...DARK_ORANGE);
    doc.rect(marginX, currentY, 2.5, 14, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK_ORANGE);
    doc.text(s.step, marginX + 6, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_DARK);
    const descLines = doc.splitTextToSize(s.desc, contentWidth - 10);
    doc.text(descLines, marginX + 6, currentY + 9.5);

    currentY += 16;
  });

  currentY += 4;

  // ----------------------------------------------------
  // SECTION 5: THE ADMINISTRATOR (MANAGEMENT) EXPERIENCE
  // ----------------------------------------------------
  checkPageBreak(45);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_ORANGE);
  doc.text('5. Step-by-Step Guide for Program Administrators', marginX, currentY);
  currentY += 5;

  const adminSteps = [
    {
      step: 'Managing Trainee & Coach Rosters',
      desc: 'Admins add new students, update contact information, assign student numbers, and activate or suspend accounts with a single toggle.'
    },
    {
      step: 'Organizing Capstone Teams',
      desc: 'Admins assemble balanced student squads for final industry capstones, assigning domains like Healthcare, Finance, or Logistics, plus a designated mentor.'
    },
    {
      step: 'Monitoring Class Health & At-Risk Flags',
      desc: 'The admin dashboard flags trainees whose attendance drops below 75% or who have multiple missing assignments, allowing early intervention before exams.'
    },
    {
      step: 'Generating Sponsor & Executive Reports',
      desc: 'Admins download complete gradebook spreadsheets, attendance audit trails, and graduation clearance sheets for ITF and NECA executive leadership.'
    }
  ];

  adminSteps.forEach((s) => {
    checkPageBreak(16);
    doc.setFillColor(...LIGHT_ORANGE);
    doc.roundedRect(marginX, currentY, contentWidth, 13, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK_ORANGE);
    doc.text(s.step, marginX + 6, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_DARK);
    const descLines = doc.splitTextToSize(s.desc, contentWidth - 12);
    doc.text(descLines, marginX + 6, currentY + 9);

    currentY += 15;
  });

  currentY += 4;

  // ----------------------------------------------------
  // SECTION 6: COMMON QUESTIONS (FAQ)
  // ----------------------------------------------------
  checkPageBreak(40);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_ORANGE);
  doc.text('6. Frequently Asked Questions for Leadership', marginX, currentY);
  currentY += 5;

  const faqs = [
    {
      q: 'What if a student misses the 15-minute attendance window?',
      a: 'The coach can generate a fresh code at any time or manually mark the student present if they were physically in class.'
    },
    {
      q: 'Can students turn in late assignments?',
      a: 'Yes. The portal accepts late submissions and clearly flags them as "Submitted Late" so coaches can grade them according to program policy.'
    },
    {
      q: 'What happens if the internet connection is unstable?',
      a: 'The system has built-in offline protection. Submissions and approvals are saved locally on the device and automatically sync once connection resumes.'
    },
    {
      q: 'Where are uploaded files stored?',
      a: 'All student deliverables are securely archived directly into the program’s Google Drive, organized neatly by week and student number.'
    }
  ];

  faqs.forEach((faq) => {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_DARK);
    doc.text(`Q: ${faq.q}`, marginX, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_MUTED);
    const aLines = doc.splitTextToSize(`A: ${faq.a}`, contentWidth - 4);
    doc.text(aLines, marginX + 2, currentY + 4);

    currentY += aLines.length * 3.8 + 4;
  });

  // Final document footer on the last page
  drawPageFooter(currentPage);

  // Save the PDF
  doc.save('TSDP_2026_Platform_Workflow_Report.pdf');
}
