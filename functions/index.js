// functions/index.js (Firebase Functions)
const functions = require("firebase-functions");
const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFilename: "service-account.json", // Upload sebagai Firebase Secret
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

exports.archiveTransactionToSheets = functions.firestore
  .document("users/{userId}/transactions/{txId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const sheets = google.sheets({ version: "v4", auth });
    
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: "Transactions!A:E",
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[data.date, data.description, data.amount, data.type, data.category]],
        },
      });
      console.log("Berhasil sinkron ke Google Sheets");
    } catch (error) {
      console.error("Gagal sinkron ke Sheets:", error);
    }
  });