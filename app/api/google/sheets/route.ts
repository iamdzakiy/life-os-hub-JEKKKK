import { google } from "googleapis";
import { NextResponse } from "next/server";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL + "/api/google/callback"
);

oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const sheets = google.sheets({ version: "v4", auth: oauth2Client });
const SHEET_ID = process.env.SHEET_ID;

export async function POST(req: Request) {
  try {
    const { action, data, range } = await req.json();

    if (!SHEET_ID) {
      return NextResponse.json({ success: false, error: "Sheet ID not configured" }, { status: 400 });
    }

    switch (action) {
      case "append": {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: range || "Sheet1!A:Z",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [data] },
        });
        return NextResponse.json({ success: true });
      }
      case "read": {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: range || "Sheet1!A:Z",
        });
        return NextResponse.json({ success: true, data: response.data.values });
      }
      case "update": {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [data] },
        });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Sheets API error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync with Google Sheets" }, { status: 500 });
  }
}