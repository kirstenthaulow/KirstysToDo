import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, MapPin, Tag, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: string;
  status: string;
  workspace_id?: string | null;
  workspace?: { name: string; color: string } | null;
  task_tags?: { tags: { name: string; color: string } }[];
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  folder_id?: string | null;
  reminder_minutes?: number | null;
}

interface TaskListProps {
  filter: string;
  searchQuery: string;
  workspaceFilter?: string | null;
  showWorkspaceDots?: boolean;
  compact?: boolean;
}

export const TaskList = ({ filter, searchQuery, workspaceFilter, showWorkspaceDots = false, compact = false }: TaskListProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          workspace:workspaces(name, color),
          task_tags(
            tags(name, color)
          )
        `)
        .eq('user_id', user.id);

      // Filter by workspace if specified
      if (workspaceFilter) {
        query = query.eq('workspace_id', workspaceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user, workspaceFilter]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('task-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, workspaceFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (taskDate.getTime() === today.getTime()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (taskDate.getTime() === today.getTime() + 86400000) {
      return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case "today":
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        return new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()).getTime() === today.getTime();
      case "week":
        if (!task.due_date) return false;
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const taskDateTime = new Date(task.due_date);
        return taskDateTime >= today && taskDateTime <= weekFromNow;
      case "overdue":
        if (!task.due_date) return false;
        return new Date(task.due_date) < now && task.status !== 'completed';
      case "upcoming":
        if (!task.due_date) return false;
        return new Date(task.due_date) > today;
      case "completed":
        return task.status === 'completed';
      default:
        return true;
    }
  });

  const handleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: newStatus === 'completed' ? "Task completed! 🎉" : "Task reopened",
        description: `"${task.title}" ${newStatus === 'completed' ? "has been marked as complete" : "has been reopened"}`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No tasks found for the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        filteredTasks.map((task) => (
          <Card key={task.id} className={`transition-all hover:shadow-md ${task.status === 'completed' ? 'opacity-60' : ''} ${compact ? 'mb-2' : ''}`}>
            <CardContent className={compact ? "p-3" : "p-4"}>
              <div className="flex items-start space-x-3">
                {showWorkspaceDots && task.workspace && (
                  <div 
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0" 
                    style={{ backgroundColor: task.workspace.color }}
                  />
                )}
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => handleTaskComplete(task.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className={`font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground">
                    {task.due_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(task.due_date)}</span>
                      </div>
                    )}
                    
                    {task.workspace && !showWorkspaceDots && (
                      <Badge variant="outline" className="text-xs">
                        {task.workspace.name}
                      </Badge>
                    )}
                  </div>

                  {task.task_tags && task.task_tags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {task.task_tags.map((taskTag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {taskTag.tags.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};