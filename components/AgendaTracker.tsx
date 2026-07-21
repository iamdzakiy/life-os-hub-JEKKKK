"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar, Plus, Trash2, Clock, MapPin, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  completed: boolean;
  createdAt: Date;
}

const CATEGORIES = [
  { value: "personal", label: "Personal", color: "bg-cyan-500/20 text-cyan-400" },
  { value: "work", label: "Work", color: "bg-blue-500/20 text-blue-400" },
  { value: "health", label: "Health", color: "bg-emerald-500/20 text-emerald-400" },
  { value: "social", label: "Social", color: "bg-purple-500/20 text-purple-400" },
  { value: "other", label: "Other", color: "bg-zinc-500/20 text-zinc-400" },
];

export default function AgendaTracker({ userId }: { userId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "", time: "", location: "", category: "personal" });
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "users", userId, "events"), orderBy("date", "asc")), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    });
    return () => unsub();
  }, [userId]);

  const todayEvents = useMemo(() => 
    events.filter(e => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [events, selectedDate]
  );

  const upcomingEvents = useMemo(() => 
    events.filter(e => e.date > format(new Date(), "yyyy-MM-dd") && !e.completed).slice(0, 5),
    [events]
  );

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) return;
    await addDoc(collection(db, "users", userId, "events"), {
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time || "00:00",
      location: newEvent.location,
      category: newEvent.category,
      completed: false,
      createdAt: new Date(),
    });
    setNewEvent({ title: "", description: "", date: "", time: "", location: "", category: "personal" });
    setShowForm(false);
  };

  const toggleComplete = async (event: Event) => {
    await updateDoc(doc(db, "users", userId, "events", event.id), { completed: !event.completed });
  };

  const deleteEvent = async (id: string) => {
    await deleteDoc(doc(db, "users", userId, "events", id));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  return (
    <div className="space-y-6">
      {/* Mini Calendar */}
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-zinc-100 text-sm">
              {format(new Date(viewYear, viewMonth), "MMMM yyyy")}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); }}
                className="h-7 w-7 text-zinc-400 hover:text-white">‹</Button>
              <Button variant="ghost" size="sm" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); }}
                className="h-7 w-7 text-zinc-400 hover:text-white">›</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <span key={d} className="text-zinc-500 py-1">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasEvent = events.some(e => e.date === dateStr);
              const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
              const isSelected = dateStr === selectedDate;
              return (
                <button key={day} onClick={() => setSelectedDate(dateStr)}
                  className={`py-1.5 rounded-lg transition-all ${
                    isSelected ? "bg-cyan-500 text-white font-bold" :
                    isToday ? "ring-1 ring-cyan-500/50 text-cyan-400" :
                    hasEvent ? "bg-white/10 text-zinc-200" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}>
                  {day}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      <Card className="glass-panel">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-zinc-100 text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            {format(new Date(selectedDate), "EEEE, dd MMM yyyy")}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => { setNewEvent({ ...newEvent, date: selectedDate }); setShowForm(true); }}
            className="glass-button text-zinc-300 hover:text-white">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <AnimatePresence>
              {todayEvents.map((event) => {
                const catMeta = CATEGORIES.find(c => c.value === event.category);
                return (
                  <motion.div key={event.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group ${event.completed ? "opacity-50" : ""}`}>
                    <button onClick={() => toggleComplete(event)}
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        event.completed ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-white/40"
                      }`}>
                      {event.completed && <CheckCircle className="h-3 w-3 text-white" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-medium ${event.completed ? "text-zinc-500 line-through" : "text-zinc-100"}`}>
                          {event.title}
                        </h3>
                        {catMeta && <span className={`text-xs px-1.5 py-0.5 rounded ${catMeta.color}`}>{catMeta.label}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        {event.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.time}</span>}
                        {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteEvent(event.id)} className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {todayEvents.length === 0 && (
              <p className="text-center py-6 text-zinc-500 text-sm">No events for this day</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card className="glass-panel">
          <CardHeader><CardTitle className="text-zinc-100 text-sm">Upcoming</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center gap-3 text-sm">
                  <div className="w-12 text-xs text-zinc-500">{format(new Date(event.date), "dd MMM")}</div>
                  <div className={`w-1.5 h-1.5 rounded-full ${event.completed ? "bg-emerald-500" : "bg-cyan-500"}`} />
                  <span className="text-zinc-300">{event.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Event Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowForm(false)}>
            <div className="glass-panel rounded-2xl p-6 w-full max-w-md border-white/10" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">New Event</h2>
              <div className="space-y-3">
                <Input placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="bg-white/5 border-white/10 text-zinc-100" autoFocus />
                <Textarea placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="bg-white/5 border-white/10 text-zinc-100 min-h-[60px]" />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={newEvent.date || selectedDate} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="bg-white/5 border-white/10 text-zinc-100" />
                  <Input type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="bg-white/5 border-white/10 text-zinc-100" />
                </div>
                <Input placeholder="Location" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="bg-white/5 border-white/10 text-zinc-100" />
                <Select value={newEvent.category} onValueChange={v => v && setNewEvent({ ...newEvent, category: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-zinc-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-panel border-white/20 bg-zinc-950/90">
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 pt-2">
                  <Button onClick={addEvent} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">Save</Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/10 text-zinc-400">Cancel</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}