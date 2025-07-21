import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface CalendarViewProps {
  workspaces: any[];
}

interface TaskCount {
  date: string;
  workspaceColor: string;
}

export const CalendarView = ({ workspaces }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskDates, setTaskDates] = useState<TaskCount[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchTaskDates = async () => {
    if (!user || workspaces.length === 0) return;

    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('due_date, workspace_id')
        .eq('user_id', user.id)
        .not('due_date', 'is', null);

      if (error) throw error;

      const taskCounts: TaskCount[] = [];
      tasks?.forEach(task => {
        if (task.due_date) {
          const workspace = workspaces.find(w => w.id === task.workspace_id);
          if (workspace) {
            taskCounts.push({
              date: new Date(task.due_date).toDateString(),
              workspaceColor: workspace.color
            });
          }
        }
      });

      setTaskDates(taskCounts);
    } catch (error) {
      console.error('Error fetching task dates:', error);
    }
  };

  useEffect(() => {
    fetchTaskDates();
  }, [user, workspaces]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDate; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    return taskDates.filter(task => task.date === date.toDateString());
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentDate);

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate('/calendar')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={(e) => {
                e.stopPropagation();
                goToPreviousMonth();
              }}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={(e) => {
                e.stopPropagation();
                goToNextMonth();
              }}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-6"></div>;
            }
            
            const tasksForDay = getTasksForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`h-6 flex items-center justify-center text-xs relative ${
                  isToday ? 'bg-primary text-primary-foreground rounded' : 'hover:bg-accent rounded'
                }`}
              >
                <span>{day.getDate()}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};