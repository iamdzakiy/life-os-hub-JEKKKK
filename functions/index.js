// Firebase Functions - Archive to Google Sheets
const functions = require("firebase-functions"); // eslint-disable-line @typescript-eslint/no-var-requires
const { google } = require("googleapis"); // eslint-disable-line @typescript-eslint/no-var-requires

const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json", // Upload as Firebase Secret
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar"
  ],
});

// Sheet ID from environment
const SHEET_ID = functions.config().sheet_id || process.env.SHEET_ID;

// Transaction archiving to Google Sheets
exports.archiveTransactionToSheets = functions.firestore
  .document("users/{userId}/transactions/{txId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });
    
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "Transactions!A:E",
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[data.date, data.description, data.amount, data.type, data.category]],
        },
      });
      console.log("Transaction archived to Sheets:", data.description);
    } catch (error) {
      console.error("Failed to archive transaction to Sheets:", error);
    }
  });

// Task archiving to Google Sheets
exports.archiveTaskToSheets = functions.firestore
  .document("users/{userId}/tasks_archive/{taskId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });
    
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "Tasks!A:F",
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[data.title, data.status, data.priority, data.dueDate, data.description, data.completedAt]],
        },
      });
      console.log("Task archived to Sheets:", data.title);
    } catch (error) {
      console.error("Failed to archive task to Sheets:", error);
    }
  });

// Daily habit backup
exports.backupHabits = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Jakarta")
  .onRun(async () => {
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });
    // This would iterate through all users and backup their habits
    console.log("Habit backup triggered");
  });

// Net worth backup
exports.backupNetWorth = functions.firestore
  .document("users/{userId}/net_worth/{entryId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });
    
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "NetWorth!A:C",
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[data.date, data.assets, data.liabilities]],
        },
      });
      console.log("Net worth archived to Sheets for date:", data.date);
    } catch (error) {
      console.error("Failed to archive net worth to Sheets:", error);
    }
  });

// Daily archive trigger (morning reset)
exports.dailyReset = functions.pubsub
  .schedule("0 5 * * *")
  .timeZone("Asia/Jakarta")
  .onRun(async () => {
    console.log("Daily reset triggered - new day initialized");
  });