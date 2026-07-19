import { google } from "googleapis";
import { NextResponse } from "next/server";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL + "/api/google/callback"
);

oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// GET - List events
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const timeMin = searchParams.get("timeMin") || new Date().toISOString();
    const timeMax = searchParams.get("timeMax") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });
    
    return NextResponse.json({ success: true, events: response.data.items || [] });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch calendar events" }, { status: 500 });
  }
}

// POST - Create event
export async function POST(req: Request) {
  try {
    const { summary, start, end, description } = await req.json();
    const event = {
      summary,
      description,
      start: { dateTime: start, timeZone: "Asia/Jakarta" },
      end: { dateTime: end, timeZone: "Asia/Jakarta" },
    };
    const response = await calendar.events.insert({ calendarId: "primary", requestBody: event });
    return NextResponse.json({ success: true, event: response.data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create event" }, { status: 500 });
  }
}

// PUT - Update event
export async function PUT(req: Request) {
  try {
    const { eventId, summary, start, end, description } = await req.json();
    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: {
        summary,
        description,
        start: start ? { dateTime: start, timeZone: "Asia/Jakarta" } : undefined,
        end: end ? { dateTime: end, timeZone: "Asia/Jakarta" } : undefined,
      },
    });
    return NextResponse.json({ success: true, event: response.data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE - Delete event
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    
    if (!eventId) {
      return NextResponse.json({ success: false, error: "Event ID required" }, { status: 400 });
    }
    
    await calendar.events.delete({ calendarId: "primary", eventId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 });
  }
}