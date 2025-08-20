import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Clock, MapPin, Tag, MoreHorizontal, Trash2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TaskDetailsDialog } from "@/components/TaskDetailsDialog";
import { useTimeFormat } from "../hooks/useTimeFormat";

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
  folderFilter?: string | null;
  showWorkspaceDots?: boolean;
  compact?: boolean;
}

export const TaskList = ({ filter, searchQuery, workspaceFilter, folderFilter, showWorkspaceDots = false, compact = false }: TaskListProps) => {
  console.log("TaskList component rendering");
  const { toast } = useToast();
  const { user } = useAuth();
  console.log("About to call useTimeFormat");
  const { formatTime } = useTimeFormat();
  console.log("useTimeFormat called successfully");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);

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

      // Filter by folder if specified
      if (folderFilter === "none") {
        query = query.is('folder_id', null);
      } else if (folderFilter) {
        query = query.eq('folder_id', folderFilter);
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
  }, [user, workspaceFilter, folderFilter]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-task-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, workspaceFilter, folderFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-600";
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
      return `Today ${formatTime(date)}`;
    } else if (taskDate.getTime() === today.getTime() + 86400000) {
      return `Tomorrow ${formatTime(date)}`;
    } else {
      return date.toLocaleDateString() + " " + formatTime(date);
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
        if (!task.due_date || task.status === 'completed') return false;
        const taskDate = new Date(task.due_date);
        return new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()).getTime() === today.getTime();
      case "week":
        if (!task.due_date || task.status === 'completed') return false;
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const taskDateTime = new Date(task.due_date);
        return taskDateTime >= today && taskDateTime <= weekFromNow;
      case "overdue":
        if (!task.due_date) return false;
        return new Date(task.due_date) < now && task.status !== 'completed';
      case "upcoming":
        if (!task.due_date || task.status === 'completed') return false;
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
    
    // Optimistic update - update UI immediately
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
          : t
      )
    );
    
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
      
      // Rollback optimistic update on error
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId 
            ? { ...t, status: task.status, completed_at: task.completed_at }
            : t
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      // First delete task_tags
      await supabase
        .from('task_tags')
        .delete()
        .eq('task_id', taskId);

      // Then delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });

      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const sendReminderEmail = async (task: any) => {
    try {
      if (!user?.email) {
        toast({
          title: "Error",
          description: "No email address found",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('send-reminder-email', {
        body: {
          to: user.email,
          taskTitle: task.title,
          taskDescription: task.description,
          dueDate: task.due_date,
          userEmail: user.email,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Reminder sent",
        description: "Email reminder sent successfully",
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder email. Make sure your email provider is configured.",
        variant: "destructive",
      });
    }
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
  };

  const handleTaskUpdated = () => {
    fetchTasks();
  };

  const handleTaskDeleted = () => {
    fetchTasks();
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
          <Card 
            key={task.id} 
            className={`transition-all hover:shadow-md cursor-pointer ${task.status === 'completed' ? 'opacity-60' : ''} ${compact ? 'mb-2' : ''}`}
            onClick={() => openTaskDetails(task)}
          >
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
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-[hsl(var(--task-foreground))]'}`}>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => sendReminderEmail(task)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email Reminder
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Task
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the task "{task.title}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTask(task.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <TaskDetailsDialog
        task={selectedTask}
        open={taskDetailsOpen}
        onOpenChange={setTaskDetailsOpen}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
};