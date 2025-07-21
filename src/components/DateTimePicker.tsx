import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export const DateTimePicker = ({ date, onDateChange }: DateTimePickerProps) => {
  const [timeValue, setTimeValue] = useState(() => {
    if (date) {
      return format(date, "HH:mm");
    }
    return "";
  });

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onDateChange(undefined);
      return;
    }

    if (timeValue) {
      const [hours, minutes] = timeValue.split(":").map(Number);
      selectedDate.setHours(hours, minutes);
    }

    onDateChange(selectedDate);
  };

  const handleTimeChange = (time: string) => {
    setTimeValue(time);
    
    if (date && time) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      onDateChange(newDate);
    }
  };

  return (
    <div className="flex space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      
      <div className="relative">
        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="time"
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="pl-10 w-32"
        />
      </div>
    </div>
  );
};