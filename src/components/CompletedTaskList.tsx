import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, RotateCcw, Trash2, Calendar, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CompletedTask {
  id: string;
  title: string;
  description?: string;
  completed_at: string;
  priority: "low" | "medium" | "high" | "urgent";
  workspace: { name: string; color: string };
}

interface CompletedTaskListProps {
  period: string;
  searchQuery: string;
}

export const CompletedTaskList = ({ period, searchQuery }: CompletedTaskListProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedTasks = async () => {
    if (!user) return;

    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          workspaces:workspace_id (
            name,
            color
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const formattedTasks = (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed_at: task.completed_at,
        priority: task.priority as "low" | "medium" | "high" | "urgent",
        workspace: {
          name: task.workspaces?.name || 'Unknown',
          color: task.workspaces?.color || '#588157'
        }
      }));

      setCompletedTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load completed tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, [user]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-600";
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const formatCompletedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (taskDate.getTime() === today.getTime()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (taskDate.getTime() === today.getTime() - 86400000) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const filteredTasks = completedTasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const taskDate = new Date(task.completed_at);
    
    switch (period) {
      case "today":
        return new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()).getTime() === today.getTime();
      case "week":
        return taskDate >= weekAgo;
      case "month":
        return taskDate >= monthAgo;
      default:
        return true;
    }
  });

  const handleRestoreTask = async (taskId: string) => {
    const task = completedTasks.find(t => t.id === taskId);
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'pending',
          completed_at: null 
        })
        .eq('id', taskId);

      if (error) throw error;

      setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
      
      toast({
        title: "Task restored",
        description: `"${task?.title}" has been moved back to your active tasks.`,
      });
    } catch (error) {
      console.error('Error restoring task:', error);
      toast({
        title: "Error",
        description: "Failed to restore task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = completedTasks.find(t => t.id === taskId);
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
      
      toast({
        title: "Task deleted",
        description: `"${task?.title}" has been permanently deleted.`,
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const groupTasksByDate = (tasks: CompletedTask[]) => {
    const groups: { [key: string]: CompletedTask[] } = {};
    
    tasks.forEach(task => {
      const dateKey = new Date(task.completed_at).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
    });
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const groupedTasks = groupTasksByDate(filteredTasks);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedTasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No completed tasks found for the selected period.</p>
          </CardContent>
        </Card>
      ) : (
        groupedTasks.map(([dateString, tasks]) => (
          <div key={dateString} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-foreground">
                {new Date(dateString).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <Badge variant="secondary">{tasks.length}</Badge>
            </div>
            
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium text-foreground">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleRestoreTask(task.id)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground">
                          <span>Completed {formatCompletedDate(task.completed_at)}</span>
                          
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: task.workspace.color }}
                            />
                            <Badge variant="outline" className="text-xs">
                              {task.workspace.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};