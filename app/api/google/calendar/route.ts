import { google } from "googleapis";
import { NextResponse } from "next/server";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL + "/api/google/callback"
);

oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export async function POST(req: Request) {
  try {
    const { summary, start, end, description } = await req.json();
    const event = {
      summary, description,
      start: { dateTime: start, timeZone: "Asia/Jakarta" },
      end: { dateTime: end, timeZone: "Asia/Jakarta" },
    };
    const response = await calendar.events.insert({ calendarId: "primary", requestBody: event });
    return NextResponse.json({ success: true, event: response.data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal membuat event" }, { status: 500 });
  }
}