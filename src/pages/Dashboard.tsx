import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Clock, Search, Filter, LogOut, User, ChevronLeft, ChevronRight } from "lucide-react";
import { TaskList } from "@/components/TaskList";
import { QuickAddTask } from "@/components/QuickAddTask";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("today");
  const [upcomingView, setUpcomingView] = useState<"today" | "week">("today");
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

  const filters = [
    { id: "today", label: "Today", count: taskCounts.today },
    { id: "upcoming", label: "Upcoming", count: taskCounts.upcoming },
    { id: "overdue", label: "Overdue", count: taskCounts.overdue },
    { id: "all", label: "All", count: taskCounts.all },
  ];

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
        {/* Upcoming Tasks Section */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {upcomingView === "today" ? "Today's Tasks" : "This Week's Tasks"}
                </CardTitle>
                <Tabs value={upcomingView} onValueChange={(value: "today" | "week") => setUpcomingView(value)}>
                  <TabsList>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">7 Days</TabsTrigger>
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

        <div className="grid gap-6 lg:grid-cols-4">{/* rest continues the same */}
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={activeFilter === filter.id ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    <span>{filter.label}</span>
                    <Badge variant="secondary" className="ml-2">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Today's Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm">Due Today</span>
                  </div>
                  <Badge variant="default">{taskCounts.today}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="text-sm">Upcoming</span>
                  </div>
                  <Badge variant="secondary">{taskCounts.upcoming}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task List */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6 flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Tasks */}
            <TaskList 
              filter={activeFilter} 
              searchQuery={searchQuery} 
              workspaceFilter={selectedWorkspace}
              showWorkspaceDots={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;