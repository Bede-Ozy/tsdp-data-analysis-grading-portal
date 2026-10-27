/**
 * ============================================================================
 * TSDP DATA ANALYSIS GRADING PORTAL - END-OF-PROGRAMME FEEDBACK EXTENSION
 * ============================================================================
 * Shamzbridge Consult · ITF-NECA Technical Skills Development Project (TSDP)
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Apps Script project (https://script.google.com) connected
 *    to your TSDP Google Sheet (or go to Extensions > Apps Script in Google Sheets).
 * 2. In your existing `doPost(e)` function, add the following cases:
 * 
 *      case 'submitEndOfProgrammeFeedback':
 *        result = submitEndOfProgrammeFeedback(params[0], params[1]);
 *        break;
 * 
 *      case 'getEndOfProgrammeFeedbackList':
 *        result = getEndOfProgrammeFeedbackList(params[0]);
 *        break;
 * 
 * 3. Paste the functions below into Code.gs (or EndOfProgrammeFeedback.gs).
 * 4. Click Deploy > Manage Deployments > Edit (pencil) > New version > Deploy.
 * ============================================================================
 */

function submitEndOfProgrammeFeedback(record, targetSheetId) {
  try {
    var ss;
    if (targetSheetId && targetSheetId.toString().trim() !== "") {
      try {
        ss = SpreadsheetApp.openById(targetSheetId.toString().trim());
      } catch (openErr) {
        // Fall back to the active spreadsheet (main portal sheet)
        ss = SpreadsheetApp.getActiveSpreadsheet();
      }
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!ss) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    if (!ss) {
      throw new Error("Unable to access the portal Google Sheet. Ensure Apps Script is bound to your TSDP Google Sheet.");
    }

    var sheetName = "EndOfProgramme_Feedback";
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        "Response ID",
        "Timestamp",
        "Submitted At",
        "Anonymous",
        "Student ID",
        "Student Number",
        "Student Name",
        "Email",
        "Class Group",
        // Section 1: Overall Experience
        "Q1: Overall Experience Rating",
        "Q2: Met Expectations",
        "Q3: Overall Organization & Coordination",
        "Q4: Most Valuable Aspect & Why",
        // Section 2: Team & Training Delivery (1-5)
        "Q5: Concepts Explained Clearly (1-5)",
        "Q6: Practical Exercises Helped Apply (1-5)",
        "Q7: Guidance & Support on Difficulties (1-5)",
        "Q8: Feedback Helped Improve (1-5)",
        "Q9: Structure, Pace & Schedule (1-5)",
        "Q10: Team Improvement Suggestions (Optional)",
        // Section 3: Student Self-Assessment (1-5)
        "Q11: Consistent Attendance & Participation (1-5)",
        "Q12: Sufficient Time Outside Class (1-5)",
        "Q13: Took Responsibility for Learning (1-5)",
        "Q14: Collaborated Effectively With Peers (1-5)",
        "Q15: One Thing Done Differently",
        // Section 4: Skills Gained & Readiness
        "Q16: Excel Ability Delta",
        "Q16: SQL Ability Delta",
        "Q16: Power BI Ability Delta",
        "Q16: Problem Breakdown Delta",
        "Q16: Interpreting & Communicating Delta",
        "Q16: Independent Data Tasks Delta",
        "Q17: Real-World Business Problem Preparedness",
        "Q18: Area Needing Most Support",
        "Q18: Other Area Description",
        // Section 5: Final Reflections & Class Nominations
        "Q19: Biggest Challenge Faced & Impact",
        "Q20: One Change to Make More Effective",
        "Q21: Greatest Strengths & Areas to Improve",
        "Q22: Best Student (Class Pick)",
        "Q23: Best-Behaved Student (Class Pick)"
      ]);

      // Style header row (38 columns)
      var headerRange = sheet.getRange(1, 1, 1, 38);
      headerRange.setBackground("#F58220");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setFontSize(10);
      sheet.setFrozenRows(1);
    } else {
      // Auto-upgrade header if sheet was previously created with 37 columns
      var lastCol = sheet.getLastColumn();
      if (lastCol === 37) {
        sheet.getRange(1, 37).setValue("Q22: Best Student (Class Pick)");
        sheet.getRange(1, 38).setValue("Q23: Best-Behaved Student (Class Pick)");
        sheet.getRange(1, 37, 1, 2).setBackground("#F58220").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(10);
      }
    }

    var skills = record.q16_skillsGrid || {};

    var newRow = [
      record.id || ("EOP-" + new Date().getTime()),
      record.timestamp || new Date().toISOString(),
      record.submittedAt || new Date().toLocaleString(),
      record.isAnonymous ? "YES" : "NO",
      record.studentID || "",
      record.studentNumber || "",
      record.studentName || "",
      record.email || "",
      record.classGroup || "",

      // Section 1
      record.q1_overallRating || "",
      record.q2_expectationsMet || "",
      record.q3_organizationRating || "",
      record.q4_mostValuableAspect || "",

      // Section 2
      record.q5_conceptsExplainedClearly || "",
      record.q6_exercisesHelpedApply || "",
      record.q7_receivedAdequateGuidance || "",
      record.q8_feedbackHelpedImprove || "",
      record.q9_structurePaceSupported || "",
      record.q10_teamImprovementSuggestions || "",

      // Section 3
      record.q11_attendedConsistently || "",
      record.q12_dedicatedSufficientTime || "",
      record.q13_tookResponsibilityDifficulties || "",
      record.q14_collaboratedEffectively || "",
      record.q15_oneThingDoneDifferently || "",

      // Section 4
      skills["excel"] || "",
      skills["sql"] || "",
      skills["powerBi"] || "",
      skills["breakdown"] || "",
      skills["communication"] || "",
      skills["independent"] || "",
      record.q17_realWorldPreparedness || "",
      record.q18_areaNeedingMostSupport || "",
      record.q18_areaNeedingMostSupportOther || "",

      // Section 5
      record.q19_biggestChallengeFaced || "",
      record.q20_oneChangeForFutureStudents || "",
      record.q21_greatestStrengthsAndImprovements || "",
      record.q22_bestStudent || "",
      record.q23_bestBehavedStudent || ""
    ];

    sheet.appendRow(newRow);

    return {
      success: true,
      message: "End-of-Programme feedback recorded successfully in Google Sheets!",
      data: record
    };
  } catch (error) {
    return {
      success: false,
      message: "Error recording End-of-Programme feedback: " + error.toString()
    };
  }
}

function getEndOfProgrammeFeedbackList(targetSheetId) {
  try {
    var ss;
    if (targetSheetId && targetSheetId.toString().trim() !== "") {
      try {
        ss = SpreadsheetApp.openById(targetSheetId.toString().trim());
      } catch (openErr) {
        ss = SpreadsheetApp.getActiveSpreadsheet();
      }
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!ss) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    var sheet = ss.getSheetByName("EndOfProgramme_Feedback");
    if (!sheet) {
      return { success: true, data: [] };
    }

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return { success: true, data: [] };
    }

    var results = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      results.push({
        id: row[0],
        timestamp: row[1],
        submittedAt: row[2],
        isAnonymous: row[3] === "YES",
        studentID: row[4],
        studentNumber: row[5],
        studentName: row[6],
        email: row[7],
        classGroup: row[8],
        q1_overallRating: row[9],
        q2_expectationsMet: row[10],
        q3_organizationRating: row[11],
        q4_mostValuableAspect: row[12],
        q5_conceptsExplainedClearly: row[13],
        q6_exercisesHelpedApply: row[14],
        q7_receivedAdequateGuidance: row[15],
        q8_feedbackHelpedImprove: row[16],
        q9_structurePaceSupported: row[17],
        q10_teamImprovementSuggestions: row[18],
        q11_attendedConsistently: row[19],
        q12_dedicatedSufficientTime: row[20],
        q13_tookResponsibilityDifficulties: row[21],
        q14_collaboratedEffectively: row[22],
        q15_oneThingDoneDifferently: row[23],
        q16_skillsGrid: {
          excel: row[24],
          sql: row[25],
          powerBi: row[26],
          breakdown: row[27],
          communication: row[28],
          independent: row[29]
        },
        q17_realWorldPreparedness: row[30],
        q18_areaNeedingMostSupport: row[31],
        q18_areaNeedingMostSupportOther: row[32],
        q19_biggestChallengeFaced: row[33],
        q20_oneChangeForFutureStudents: row[34],
        q21_greatestStrengthsAndImprovements: row[35],
        q22_bestStudent: row[36] || "",
        q23_bestBehavedStudent: row[37] || ""
      });
    }

    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching End-of-Programme feedback: " + error.toString()
    };
  }
}
