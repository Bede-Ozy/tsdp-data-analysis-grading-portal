/**
 * ============================================================================
 * TSDP DATA ANALYSIS GRADING PORTAL - HISTORICAL SCORES APPS SCRIPT EXTENSION
 * ============================================================================
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Apps Script project connected to your TSDP Google Sheet
 *    (in Google Sheets, click Extensions > Apps Script).
 * 2. In your existing `doPost(e)` function, add the following cases to your switch/router:
 * 
 *      case 'getHistoricalScores':
 *        result = getHistoricalScores();
 *        break;
 * 
 *      case 'saveHistoricalScores':
 *        result = saveHistoricalScores(params[0], params[1]);
 *        break;
 * 
 * 3. Paste the functions below into Code.gs (or a new script file e.g. HistoricalScores.gs).
 * 4. Click Deploy > Manage Deployments > Edit (pencil icon) > Version: "New version" > Deploy.
 * ============================================================================
 */

function getHistoricalScores() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Historical_Scores";
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return { success: true, data: [] };
    }

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return { success: true, data: [] };
    }

    var headers = values[0].map(function(h) { return (h || "").toString().toLowerCase().trim(); });
    
    // Check if sheet has monthly columns
    var hasMonth1 = headers.indexOf("month 1 total") >= 0;

    var results = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var sId = row[0] ? row[0].toString().trim() : "";
      if (!sId) continue;

      if (hasMonth1) {
        results.push({
          studentID: sId,
          studentName: row[1] || "",
          month1Total: Number(row[2]) || 0,
          month2Total: Number(row[3]) || 0,
          month1Max: Number(row[4]) || 100,
          month2Max: Number(row[5]) || 100,
          historicalPercent: Number(row[6]) || 0,
          histAttendance: Number(row[7]) || 0,
          histTechnical: Number(row[8]) || 0,
          histProfessional: Number(row[9]) || 0,
          histClassActivities: Number(row[10]) || 0,
          histSocialMedia: Number(row[11]) || 0,
          totalHistorical: Number(row[12]) || 0,
          updatedBy: row[13] || "",
          updatedAt: row[14] || ""
        });
      } else {
        // Fallback for legacy format
        results.push({
          studentID: sId,
          studentName: row[1] || "",
          histAttendance: Number(row[2]) || 0,
          histTechnical: Number(row[3]) || 0,
          histProfessional: Number(row[4]) || 0,
          histClassActivities: Number(row[5]) || 0,
          histSocialMedia: Number(row[6]) || 0,
          totalHistorical: Number(row[7]) || 0,
          updatedBy: row[8] || "",
          updatedAt: row[9] || ""
        });
      }
    }

    return { success: true, data: results };
  } catch (err) {
    return { success: false, message: "Error reading historical scores: " + err.toString(), data: [] };
  }
}

function saveHistoricalScores(scoresArray, coachID) {
  try {
    if (!Array.isArray(scoresArray) || scoresArray.length === 0) {
      return { success: false, message: "No scores data provided to save." };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Historical_Scores";
    var sheet = ss.getSheetByName(sheetName);

    // Create and format sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        "Student ID",
        "Student Name",
        "Month 1 Total",
        "Month 2 Total",
        "Month 1 Max",
        "Month 2 Max",
        "Historical Combined %",
        "Attendance Pts (10)",
        "Technical Pts (10)",
        "Professional Pts (5)",
        "Class Activities Pts (5)",
        "Social Media Pts (5)",
        "Total Historical Pts (35)",
        "Last Updated By",
        "Last Updated At",
        "Notes"
      ]);
      sheet.getRange(1, 1, 1, 16).setBackground("#0054A6").setFontColor("#FFFFFF").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var existingData = sheet.getDataRange().getValues();
    var idToRowMap = {};
    for (var i = 1; i < existingData.length; i++) {
      var id = existingData[i][0] ? existingData[i][0].toString().trim().toLowerCase() : "";
      if (id) {
        idToRowMap[id] = i + 1; // 1-indexed sheet row
      }
    }

    var timestamp = new Date().toLocaleString();
    var updatedCount = 0;
    var newRows = [];

    for (var k = 0; k < scoresArray.length; k++) {
      var item = scoresArray[k];
      var sId = item.studentID ? item.studentID.toString().trim() : "";
      if (!sId) continue;

      var fullName = ((item.firstName || "") + " " + (item.lastName || "")).trim() || item.studentName || sId;
      var m1 = Number(item.month1Total) || 0;
      var m2 = Number(item.month2Total) || 0;
      var m1Max = item.month1Max !== undefined && item.month1Max !== "" ? Number(item.month1Max) : 100;
      var m2Max = item.month2Max !== undefined && item.month2Max !== "" ? Number(item.month2Max) : 100;
      
      var totalScore = m1 + m2;
      var totalMax = m1Max + m2Max;
      var percent = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
      percent = Math.round(percent * 100) / 100;

      var att = Math.round(((percent / 100) * 10) * 100) / 100;
      var tech = Math.round(((percent / 100) * 10) * 100) / 100;
      var prof = Math.round(((percent / 100) * 5) * 100) / 100;
      var classAct = Math.round(((percent / 100) * 5) * 100) / 100;
      var social = Math.round(((percent / 100) * 5) * 100) / 100;
      var totalPts = Math.round((att + tech + prof + classAct + social) * 100) / 100;

      var rowData = [
        sId,
        fullName,
        m1,
        m2,
        m1Max,
        m2Max,
        percent,
        att,
        tech,
        prof,
        classAct,
        social,
        totalPts,
        coachID || "ADMIN",
        timestamp,
        item.notes || ""
      ];

      var lookupKey = sId.toLowerCase();
      if (idToRowMap[lookupKey]) {
        var targetRowNum = idToRowMap[lookupKey];
        sheet.getRange(targetRowNum, 1, 1, rowData.length).setValues([rowData]);
      } else {
        newRows.push(rowData);
      }
      updatedCount++;
    }

    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }

    return {
      success: true,
      message: "Updated " + updatedCount + " students",
      count: updatedCount
    };
  } catch (err) {
    return {
      success: false,
      message: "Error saving historical scores: " + err.toString()
    };
  }
}
