import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  due_date: string;
  priority: string;
  status: string;
  workspace_id: string;
  workspace?: { name: string; color: string } | null;
}

interface CalendarTask extends Task {
  workspace: { name: string; color: string };
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setWorkspaces(data || []);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const fetchTasks = async () => {
    if (!user || workspaces.length === 0) return;

    try {
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select(`
          *,
          workspace:workspaces(name, color)
        `)
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .not('due_date', 'is', null);

      if (error) throw error;

      // Filter out tasks without workspace data and map properly
      const tasksWithWorkspace = tasksData?.filter(task => task.workspace) || [];
      setTasks(tasksWithWorkspace as CalendarTask[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  useEffect(() => {
    fetchTasks();
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
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-medium min-w-[180px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        <Card>
          <CardContent className="p-6">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-4 mb-4">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="text-center font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-4 auto-rows-[120px]">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="border border-border/50 rounded-lg"></div>;
                }
                
                const tasksForDay = getTasksForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`border border-border/50 rounded-lg p-2 ${
                      isToday ? 'bg-accent/20 border-primary' : 'hover:bg-accent/10'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isToday ? 'text-primary' : 'text-foreground'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    <div className="space-y-0.5 overflow-hidden h-[88px]">
                      {tasksForDay.slice(0, 4).map((task) => (
                        <div
                          key={task.id}
                          className="text-[10px] px-1 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                          style={{ 
                            backgroundColor: task.workspace.color,
                            color: 'white'
                          }}
                          title={`${task.title} - ${task.workspace.name} at ${formatTime(task.due_date)}`}
                        >
                          <div className="font-medium truncate leading-none">{task.title}</div>
                          <div className="opacity-90 text-[9px] leading-none mt-0.5">{formatTime(task.due_date)}</div>
                        </div>
                      ))}
                      
                      {tasksForDay.length > 4 && (
                        <div className="text-[9px] text-muted-foreground px-1 leading-none">
                          +{tasksForDay.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Calendar;