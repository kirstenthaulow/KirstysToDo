import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, MapPin, Tag, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: "low" | "medium" | "high";
  tags: string[];
  workspace: string;
  location?: string;
  completed: boolean;
}

interface TaskListProps {
  filter: string;
  searchQuery: string;
}

export const TaskList = ({ filter, searchQuery }: TaskListProps) => {
  const { toast } = useToast();
  
  // Mock data - in real app this would come from a database
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Finish project proposal",
      description: "Complete the Q4 project proposal for client review",
      dueDate: new Date(2024, 0, 25, 14, 0),
      priority: "high",
      tags: ["work", "urgent"],
      workspace: "work",
      completed: false,
    },
    {
      id: "2",
      title: "Grocery shopping",
      dueDate: new Date(2024, 0, 24, 18, 0),
      priority: "low",
      tags: ["personal", "errands"],
      workspace: "personal",
      location: "Local supermarket",
      completed: false,
    },
    {
      id: "3",
      title: "Study for exam",
      description: "Review chapters 8-12 for chemistry exam",
      dueDate: new Date(2024, 0, 26, 9, 0),
      priority: "high",
      tags: ["school", "exam"],
      workspace: "school",
      completed: false,
    },
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const formatDate = (date: Date) => {
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
        return task.dueDate && new Date(task.dueDate.getFullYear(), task.dueDate.getMonth(), task.dueDate.getDate()).getTime() === today.getTime();
      case "upcoming":
        return task.dueDate && task.dueDate > today;
      case "overdue":
        return task.dueDate && task.dueDate < now && !task.completed;
      default:
        return true;
    }
  });

  const handleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    toast({
      title: task?.completed ? "Task reopened" : "Task completed! 🎉",
      description: `"${task?.title}" ${task?.completed ? "has been reopened" : "has been marked as complete"}`,
    });
  };

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
          <Card key={task.id} className={`transition-all hover:shadow-md ${task.completed ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleTaskComplete(task.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className={`font-medium ${task.completed ? 'line-through' : ''}`}>
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
                    {task.dueDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                    )}
                    
                    {task.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{task.location}</span>
                      </div>
                    )}
                    
                    <Badge variant="outline" className="text-xs">
                      {task.workspace}
                    </Badge>
                  </div>

                  {task.tags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
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