import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Folder, ChevronRight, MoreHorizontal, LogOut } from "lucide-react";
import { WorkspaceTree } from "@/components/WorkspaceTree";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Workspace {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const Workspaces = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    if (!user) return;

    try {
      // Fetch workspaces with task counts
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (workspacesError) throw workspacesError;

      // Get task counts for each workspace
      const workspacesWithCounts = await Promise.all(
        (workspacesData || []).map(async (workspace) => {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id)
            .eq('user_id', user.id);

          return {
            ...workspace,
            taskCount: count || 0,
          };
        })
      );

      setWorkspaces(workspacesWithCounts);
      
      // Select first workspace if none selected
      if (!selectedWorkspace && workspacesWithCounts.length > 0) {
        setSelectedWorkspace(workspacesWithCounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast({
        title: "Error",
        description: "Failed to load workspaces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('workspace-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'workspaces', filter: `user_id=eq.${user.id}` },
        () => fetchWorkspaces()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        () => fetchWorkspaces()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card px-6 py-4">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-semibold text-foreground">Workspaces</h1>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">KirstysToDos - Workspaces</h1>
              <p className="text-sm text-muted-foreground">Organize your tasks by context</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Workspace
              </Button>
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
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Workspace List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Workspaces</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {workspaces.length === 0 ? (
                  <div className="text-center py-8">
                    <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No workspaces yet</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create your first workspace
                    </Button>
                  </div>
                ) : (
                  workspaces.map((workspace) => (
                    <Button
                      key={workspace.id}
                      variant={selectedWorkspace === workspace.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedWorkspace(workspace.id)}
                    >
                      <div className={`mr-3 h-3 w-3 rounded-full`} style={{ backgroundColor: workspace.color }} />
                      <span className="flex-1 text-left">{workspace.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {workspace.taskCount}
                      </Badge>
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Workspace Content */}
          <div className="lg:col-span-3">
            {selectedWorkspace && (
              <div className="space-y-6">
                {/* Folder Structure with integrated workspace title */}
                <WorkspaceTree 
                  workspaceId={selectedWorkspace}
                  workspaceName={workspaces.find(w => w.id === selectedWorkspace)?.name}
                  workspaceColor={workspaces.find(w => w.id === selectedWorkspace)?.color}
                  onRefresh={fetchWorkspaces}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateWorkspaceDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onWorkspaceCreated={fetchWorkspaces}
      />
    </div>
  );
};

export default Workspaces;