"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export default function AgendaTracker() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch events on mount
    const loadEvents = async () => {
      try {
        const response = await fetch("/api/google/calendar");
        const data = await response.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    loadEvents();
  }, []);

  const createEvent = async () => {
    if (!newEventTitle || !newEventDate) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/google/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: newEventTitle,
          start: newEventDate,
          end: newEventDate,
        }),
      });
      
      if (response.ok) {
        setNewEventTitle("");
        setNewEventDate("");
        // Refresh events
        const refresh = await fetch("/api/google/calendar");
        const data = await refresh.json();
        if (data.success) setEvents(data.events);
      }
    } catch (error) {
      console.error("Failed to create event:", error);
    }
    setLoading(false);
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await fetch(`/api/google/calendar?eventId=${eventId}`, { method: "DELETE" });
      // Refresh events
      const refresh = await fetch("/api/google/calendar");
      const data = await refresh.json();
      if (data.success) setEvents(data.events);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Add Event Form */}
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Add New Event
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Event title..."
              className="bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-400 focus:border-cyan-500/50"
            />
            <Input
              type="datetime-local"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="bg-white/5 border-white/10 text-zinc-100"
            />
            <Button 
              onClick={createEvent} 
              disabled={loading || !newEventTitle}
              className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-cyan-500" />
                    <div>
                      <p className="font-medium text-zinc-100">{event.summary}</p>
                      {event.start?.dateTime && (
                        <p className="text-xs text-zinc-400">
                          {format(parseISO(event.start.dateTime), "dd MMM yyyy, HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEvent(event.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            {events.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-4">No upcoming events</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}