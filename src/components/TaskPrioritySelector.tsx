import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Circle, Minus } from "lucide-react";

interface TaskPrioritySelectorProps {
  priority: "low" | "medium" | "high";
  onPriorityChange: (priority: "low" | "medium" | "high") => void;
}

export const TaskPrioritySelector = ({ priority, onPriorityChange }: TaskPrioritySelectorProps) => {
  const priorities = [
    {
      value: "low" as const,
      label: "Low",
      icon: Minus,
      color: "bg-green-500",
      variant: "outline" as const,
    },
    {
      value: "medium" as const,
      label: "Medium",
      icon: Circle,
      color: "bg-yellow-500",
      variant: "outline" as const,
    },
    {
      value: "high" as const,
      label: "High",
      icon: AlertCircle,
      color: "bg-red-500",
      variant: "outline" as const,
    },
  ];

  return (
    <div className="flex space-x-2">
      {priorities.map((p) => {
        const Icon = p.icon;
        const isSelected = priority === p.value;
        
        return (
          <Button
            key={p.value}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onPriorityChange(p.value)}
            className="flex items-center space-x-2"
          >
            <div className={`w-2 h-2 rounded-full ${p.color}`} />
            <span>{p.label}</span>
          </Button>
        );
      })}
    </div>
  );
};