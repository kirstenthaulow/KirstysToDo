import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, RotateCcw, Trash2, Calendar, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompletedTask {
  id: string;
  title: string;
  description?: string;
  completedAt: Date;
  priority: "low" | "medium" | "high";
  tags: string[];
  workspace: string;
}

interface CompletedTaskListProps {
  period: string;
  searchQuery: string;
}

export const CompletedTaskList = ({ period, searchQuery }: CompletedTaskListProps) => {
  const { toast } = useToast();
  
  // Mock completed tasks data
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([
    {
      id: "1",
      title: "Submitted quarterly report",
      description: "Completed and submitted the Q4 quarterly business report",
      completedAt: new Date(2024, 0, 23, 16, 30),
      priority: "high",
      tags: ["work", "report"],
      workspace: "work",
    },
    {
      id: "2",
      title: "Dentist appointment",
      completedAt: new Date(2024, 0, 23, 14, 0),
      priority: "medium",
      tags: ["health", "appointment"],
      workspace: "personal",
    },
    {
      id: "3",
      title: "Morning workout",
      completedAt: new Date(2024, 0, 23, 7, 0),
      priority: "low",
      tags: ["health", "exercise"],
      workspace: "personal",
    },
    {
      id: "4",
      title: "Chemistry lab assignment",
      description: "Completed lab report for organic chemistry course",
      completedAt: new Date(2024, 0, 22, 20, 15),
      priority: "high",
      tags: ["school", "assignment"],
      workspace: "school",
    },
    {
      id: "5",
      title: "Team standup meeting",
      completedAt: new Date(2024, 0, 22, 9, 0),
      priority: "medium",
      tags: ["work", "meeting"],
      workspace: "work",
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

  const formatCompletedDate = (date: Date) => {
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
    
    switch (period) {
      case "today":
        return new Date(task.completedAt.getFullYear(), task.completedAt.getMonth(), task.completedAt.getDate()).getTime() === today.getTime();
      case "week":
        return task.completedAt >= weekAgo;
      case "month":
        return task.completedAt >= monthAgo;
      default:
        return true;
    }
  });

  const handleRestoreTask = (taskId: string) => {
    const task = completedTasks.find(t => t.id === taskId);
    setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
    
    toast({
      title: "Task restored",
      description: `"${task?.title}" has been moved back to your active tasks.`,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const task = completedTasks.find(t => t.id === taskId);
    setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
    
    toast({
      title: "Task deleted",
      description: `"${task?.title}" has been permanently deleted.`,
      variant: "destructive",
    });
  };

  const groupTasksByDate = (tasks: CompletedTask[]) => {
    const groups: { [key: string]: CompletedTask[] } = {};
    
    tasks.forEach(task => {
      const dateKey = task.completedAt.toDateString();
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
                          <span>Completed {formatCompletedDate(task.completedAt)}</span>
                          
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
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};