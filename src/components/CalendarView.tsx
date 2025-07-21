import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-8"></div>;
            }
            
            const tasksForDay = getTasksForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`h-8 flex items-center justify-center text-sm relative ${
                  isToday ? 'bg-primary text-primary-foreground rounded' : 'hover:bg-accent rounded'
                }`}
              >
                <span>{day.getDate()}</span>
                {tasksForDay.length > 0 && (
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                    {tasksForDay.slice(0, 3).map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: task.workspaceColor }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};