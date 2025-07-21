import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Tag, Mail, Trash2, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: string;
  status: string;
  workspace?: { name: string; color: string } | null;
  task_tags?: { tags: { name: string; color: string } }[];
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  reminder_minutes?: number | null;
}

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

export const TaskDetailsDialog = ({ task, open, onOpenChange, onTaskUpdated, onTaskDeleted }: TaskDetailsDialogProps) => {
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      setReminderMinutes(task.reminder_minutes);
    }
  }, [task]);

  const handleTaskComplete = async () => {
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: newStatus === 'completed' ? "Task completed! 🎉" : "Task reopened",
        description: `"${task.title}" ${newStatus === 'completed' ? "has been marked as complete" : "has been reopened"}`,
      });

      onTaskUpdated();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleReminderUpdate = async (minutes: string) => {
    if (!task) return;

    const reminderValue = minutes === "none" ? null : parseInt(minutes);
    setReminderMinutes(reminderValue);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ reminder_minutes: reminderValue })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: "Reminder updated",
        description: reminderValue ? `Reminder set for ${reminderValue} minutes before due date` : "Reminder removed",
      });

      onTaskUpdated();
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive",
      });
    }
  };

  const sendReminderEmail = async () => {
    if (!task || !user?.email) return;

    try {
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
        description: "Failed to send reminder email",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async () => {
    if (!task) return;

    try {
      // First delete task_tags
      await supabase
        .from('task_tags')
        .delete()
        .eq('task_id', task.id);

      // Then delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });

      onTaskDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

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
    return date.toLocaleString();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={handleTaskComplete}
            />
            <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
              {task.title}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Priority and Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
              <span className="text-sm font-medium capitalize">{task.priority} Priority</span>
            </div>
            {task.workspace && (
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: task.workspace.color }}
                />
                <span className="text-sm">{task.workspace.name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{task.description}</p>
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Due Date
              </h4>
              <p className="text-muted-foreground">{formatDate(task.due_date)}</p>
            </div>
          )}

          {/* Reminder Settings */}
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Email Reminder
            </h4>
            <div className="space-y-3">
              <Select
                value={reminderMinutes?.toString() || "none"}
                onValueChange={handleReminderUpdate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Set reminder time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No reminder</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="120">2 hours before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                  <SelectItem value="10080">1 week before</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={sendReminderEmail}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Reminder Now
              </Button>
            </div>
          </div>

          {/* Tags */}
          {task.task_tags && task.task_tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {task.task_tags.map((taskTag, index) => (
                  <Badge key={index} variant="secondary">
                    {taskTag.tags.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Created: {formatDate(task.created_at)}</p>
            <p>Updated: {formatDate(task.updated_at)}</p>
            {task.completed_at && (
              <p>Completed: {formatDate(task.completed_at)}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Task
                </Button>
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
                  <AlertDialogAction onClick={deleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};