"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function FocusTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false);
            return;
          }
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const reset = () => { setMinutes(25); setSeconds(0); setIsActive(false); };

  return (
    <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-full">
      <span className="text-white font-mono text-sm">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      <Button variant="ghost" size="icon-xs" onClick={() => setIsActive(!isActive)} className="text-white/70 hover:text-white">
        {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={reset} className="text-white/50 hover:text-white">
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}