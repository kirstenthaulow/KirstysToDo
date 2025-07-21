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
    const saved = localStorage.getItem("time-format");
    return (saved as TimeFormat) || "12";
  });

  useEffect(() => {
    localStorage.setItem("time-format", timeFormat);
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
  const context = useContext(TimeFormatContext);
  if (!context) {
    throw new Error("useTimeFormat must be used within TimeFormatProvider");
  }
  return context;
}