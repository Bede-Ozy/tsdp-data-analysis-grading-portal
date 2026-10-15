/**
 * ============================================================================
 * TSDP DATA ANALYSIS GRADING PORTAL - CHALLENGE FEEDBACK APPS SCRIPT EXTENSION
 * ============================================================================
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Apps Script project (https://script.google.com) connected
 *    to your TSDP Google Sheet (or go to Extensions > Apps Script in Google Sheets).
 * 2. In your existing `doPost(e)` function, add the following cases to your switch/router:
 * 
 *      case 'submitChallengeFeedback':
 *        result = submitChallengeFeedback(params[0], params[1]);
 *        break;
 * 
 *      case 'getChallengeFeedbackList':
 *        result = getChallengeFeedbackList(params[0]);
 *        break;
 * 
 *      case 'updateFeedbackReviewStatus':
 *        result = updateFeedbackReviewStatus(params[0], params[1], params[2], params[3]);
 *        break;
 * 
 * 3. Paste the three handler functions below into Code.gs (or a new script file e.g. ChallengeFeedback.gs).
 * 4. Click Deploy > Manage Deployments > Edit (pencil icon) > Version: "New version" > Deploy.
 * ============================================================================
 */

function submitChallengeFeedback(record, targetSheetId) {
  try {
    var ss;
    if (targetSheetId && targetSheetId.toString().trim() !== "") {
      ss = SpreadsheetApp.openById(targetSheetId.toString().trim());
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    var sheetName = "Challenge_Feedback";
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        "Response ID",
        "Submitted At",
        "Student ID",
        "Student Name",
        "Email",
        "Resident Group",
        "Q1: Modules Needing Support",
        "Q2: Difficult Topics & Concepts",
        "Q3: Theory vs Practical Struggles",
        "Q4: Topics to Revisit in Revision",
        "Q5: Practical Challenges",
        "Q6: Excel Confidence (1-5)",
        "Q6: SQL Confidence (1-5)",
        "Q6: Power BI Confidence (1-5)",
        "Q6: Overall Avg Confidence",
        "Q7: Step-by-Step Demonstration Requests",
        "Q8: Preferred Learning Approach",
        "Q9: Additional Notes & Experience",
        "Status",
        "Coach Notes"
      ]);
      sheet.getRange(1, 1, 1, 20).setBackground("#0054A6").setFontColor("#FFFFFF").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var row = [
      record.id || ("FB-" + new Date().getTime()),
      record.submittedAt || new Date().toLocaleString(),
      record.studentID || "",
      record.studentName || "",
      record.email || "",
      record.classGroup || "",
      Array.isArray(record.modulesNeeded) ? record.modulesNeeded.join("; ") : (record.modulesNeeded || record.primaryModule || ""),
      record.difficultTopics || record.detailedChallenges || "",
      record.theoryVsPractical || "",
      record.revisitTopics || "",
      Array.isArray(record.practicalChallenges) ? record.practicalChallenges.join("; ") : (record.practicalChallenges || ""),
      record.confidenceExcel || record.confidenceScore || 3,
      record.confidenceSql || record.confidenceScore || 3,
      record.confidencePowerBi || record.confidenceScore || 3,
      record.confidenceScore || 3,
      record.demonstrationAreas || record.specificQuestions || "",
      record.preferredLearningApproach || "",
      record.additionalFeedback || record.suggestions || "",
      record.status || "Pending Review",
      record.coachNotes || ""
    ];

    sheet.appendRow(row);
    return { success: true, message: "Feedback saved to sheet successfully", id: record.id };
  } catch (err) {
    return { success: false, message: "Error writing to sheet: " + err.toString() };
  }
}

function getChallengeFeedbackList(targetSheetId) {
  try {
    var ss;
    if (targetSheetId && targetSheetId.toString().trim() !== "") {
      ss = SpreadsheetApp.openById(targetSheetId.toString().trim());
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    var sheet = ss.getSheetByName("Challenge_Feedback");
    if (!sheet) return { success: true, data: [] };

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { success: true, data: [] };

    var results = [];
    for (var i = 1; i < values.length; i++) {
      var r = values[i];
      results.push({
        id: r[0],
        submittedAt: r[1],
        studentID: r[2],
        studentName: r[3],
        email: r[4],
        classGroup: r[5],
        modulesNeeded: r[6] ? r[6].toString().split("; ") : [],
        difficultTopics: r[7] || "",
        theoryVsPractical: r[8] || "",
        revisitTopics: r[9] || "",
        practicalChallenges: r[10] ? r[10].toString().split("; ") : [],
        confidenceExcel: Number(r[11]) || 3,
        confidenceSql: Number(r[12]) || 3,
        confidencePowerBi: Number(r[13]) || 3,
        confidenceScore: Number(r[14]) || 3,
        demonstrationAreas: r[15] || "",
        preferredLearningApproach: r[16] || "",
        additionalFeedback: r[17] || "",
        status: r[18] || "Pending Review",
        coachNotes: r[19] || ""
      });
    }

    return { success: true, data: results };
  } catch (err) {
    return { success: false, message: err.toString(), data: [] };
  }
}

function updateFeedbackReviewStatus(feedbackId, newStatus, coachNotes, targetSheetId) {
  try {
    var ss;
    if (targetSheetId && targetSheetId.toString().trim() !== "") {
      ss = SpreadsheetApp.openById(targetSheetId.toString().trim());
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    var sheet = ss.getSheetByName("Challenge_Feedback");
    if (!sheet) return { success: false, message: "Sheet not found" };

    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] && values[i][0].toString() === feedbackId.toString()) {
        var rowNum = i + 1; // 1-indexed in Google Sheets
        sheet.getRange(rowNum, 19).setValue(newStatus); // Column 19 = Status
        if (coachNotes !== undefined && coachNotes !== null) {
          sheet.getRange(rowNum, 20).setValue(coachNotes); // Column 20 = Coach Notes
        }
        return { success: true, message: "Status updated successfully" };
      }
    }
    return { success: false, message: "Feedback ID not found: " + feedbackId };
  } catch (err) {
    return { success: false, message: "Error updating status: " + err.toString() };
  }
}
