import * as React from "react";
import { createContext, useContext, useState, useEffect } from "react";

type TimeFormat = "12" | "24";

interface TimeFormatContextType {
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  formatTime: (date: Date) => string;
}

const TimeFormatContext = createContext<TimeFormatContextType | null>(null);

export function TimeFormatProvider({ children }: { children: React.ReactNode }) {
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    try {
      const saved = localStorage.getItem("time-format");
      return (saved as TimeFormat) || "12";
    } catch {
      return "12";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("time-format", timeFormat);
    } catch {}
  }, [timeFormat]);

  const formatTime = (date: Date) => {
    if (timeFormat === "24") {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  return (
    <TimeFormatContext.Provider value={{ timeFormat, setTimeFormat, formatTime }}>
      {children}
    </TimeFormatContext.Provider>
  );
}

export function useTimeFormat() {
  console.log("useTimeFormat hook called");
  const context = useContext(TimeFormatContext);
  console.log("TimeFormatContext value:", context);
  if (!context) {
    console.error("useTimeFormat called outside of TimeFormatProvider - using fallback");
    // Provide fallback instead of throwing error
    return {
      timeFormat: "12" as TimeFormat,
      setTimeFormat: () => {},
      formatTime: (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  }
  return context;
}