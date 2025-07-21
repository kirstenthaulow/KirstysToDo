import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Clock, Search, Filter, LogOut, User, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { TaskList } from "@/components/TaskList";
import { QuickAddTask } from "@/components/QuickAddTask";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface WorkspaceCardProps {
  workspace: any;
  onNavigate: () => void;
}

const WorkspaceCard = ({ workspace, onNavigate }: WorkspaceCardProps) => {
  const [workspaceTasks, setWorkspaceTasks] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkspaceTasks = async () => {
      if (!user) return;

      try {
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', workspace.id);

        if (error) throw error;

        const activeTasks = tasks?.filter(t => t.status !== 'completed') || [];
        const completed = tasks?.filter(t => t.status === 'completed') || [];
        
        setWorkspaceTasks(activeTasks);
        setCompletedCount(completed.length);
      } catch (error) {
        console.error('Error fetching workspace tasks:', error);
      }
    };

    fetchWorkspaceTasks();
  }, [workspace.id, user]);

  const noDateTasks = workspaceTasks.filter(task => !task.due_date);
  const allCompleted = workspaceTasks.length === 0 && completedCount > 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{workspace.name}</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <span className="text-lg">⋯</span>
          </Button>
        </div>

        {/* Add task link */}
        <Button 
          variant="ghost" 
          className="w-full justify-start p-0 h-auto text-primary hover:text-primary"
          onClick={() => navigate('/create')}
        >
          <div 
            className="w-4 h-4 rounded-full mr-2 flex-shrink-0" 
            style={{ backgroundColor: workspace.color }}
          />
          Add a task
        </Button>

        {/* No date section */}
        {noDateTasks.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">No date</p>
            {noDateTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 rounded border border-muted-foreground flex-shrink-0" />
                <span className="truncate">{task.title}</span>
              </div>
            ))}
            {noDateTasks.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{noDateTasks.length - 3} more tasks
              </p>
            )}
          </div>
        )}

        {/* Illustration and completion message */}
        <div className="flex flex-col items-center space-y-3 py-6">
          {allCompleted ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">All tasks completed</p>
                <p className="text-xs text-muted-foreground">Great job!</p>
              </div>
            </>
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Completed section */}
        {completedCount > 0 && (
          <Button 
            variant="ghost" 
            className="w-full justify-between p-0 h-auto text-muted-foreground hover:text-foreground"
            onClick={onNavigate}
          >
            <span className="text-sm">Completed ({completedCount})</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};

const Dashboard = () => {
  const [upcomingView, setUpcomingView] = useState<"today" | "week" | "overdue">("today");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [taskCounts, setTaskCounts] = useState({
    today: 0,
    upcoming: 0,
    overdue: 0,
    all: 0,
  });
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setWorkspaces(data || []);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const fetchTaskCounts = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('tasks')
        .select('due_date, status')
        .eq('user_id', user.id);

      // Filter by workspace if selected
      if (selectedWorkspace) {
        query = query.eq('workspace_id', selectedWorkspace);
      }

      const { data: tasks, error } = await query;

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const counts = {
        today: 0,
        upcoming: 0,
        overdue: 0,
        all: tasks?.length || 0,
      };

      tasks?.forEach(task => {
        if (!task.due_date) return;
        
        const taskDate = new Date(task.due_date);
        const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        
        if (taskDateOnly.getTime() === today.getTime()) {
          counts.today++;
        } else if (taskDate > today) {
          counts.upcoming++;
        } else if (taskDate < now && task.status !== 'completed') {
          counts.overdue++;
        }
      });

      setTaskCounts(counts);
    } catch (error) {
      console.error('Error fetching task counts:', error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  useEffect(() => {
    fetchTaskCounts();
  }, [user, selectedWorkspace]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('task-count-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        () => {
          fetchTaskCounts();
          fetchWorkspaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedWorkspace]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const currentWorkspace = selectedWorkspace ? workspaces.find(w => w.id === selectedWorkspace) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">TaskNest</h1>
              <p className="text-sm text-muted-foreground">Your smart task organizer</p>
            </div>
            <div className="flex items-center space-x-4">
              <QuickAddTask />
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {user?.email}
                </span>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Tasks Section */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tasks</CardTitle>
                <Tabs value={upcomingView} onValueChange={(value: "today" | "week" | "overdue") => setUpcomingView(value)}>
                  <TabsList>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">7 Days</TabsTrigger>
                    <TabsTrigger value="overdue">Overdue</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <TaskList 
                filter={upcomingView} 
                searchQuery="" 
                workspaceFilter={selectedWorkspace}
                showWorkspaceDots={true}
                compact={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Workspace Navigation */}
        {workspaces.length > 0 && (
          <div className="mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium">Workspace:</span>
                    <div className="flex items-center space-x-2">
                      {currentWorkspace ? (
                        <>
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: currentWorkspace.color }}
                          />
                          <span className="font-medium">{currentWorkspace.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">All Workspaces</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedWorkspace(null)}
                      className={!selectedWorkspace ? "bg-muted" : ""}
                    >
                      All
                    </Button>
                    {workspaces.map((workspace) => (
                      <Button
                        key={workspace.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWorkspace(workspace.id)}
                        className={`flex items-center space-x-2 ${selectedWorkspace === workspace.id ? "bg-muted" : ""}`}
                      >
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: workspace.color }}
                        />
                        <span>{workspace.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Workspace Grid */}
        {workspaces.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {workspaces.map((workspace) => (
              <WorkspaceCard 
                key={workspace.id} 
                workspace={workspace} 
                onNavigate={() => navigate('/workspaces')}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;