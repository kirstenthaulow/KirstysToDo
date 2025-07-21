import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Folder, ChevronRight, MoreHorizontal } from "lucide-react";
import { WorkspaceTree } from "@/components/WorkspaceTree";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";

const Workspaces = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>("work");

  const workspaces = [
    {
      id: "work",
      name: "Work",
      color: "bg-primary",
      taskCount: 12,
      folders: [
        { id: "projects", name: "Projects", taskCount: 8 },
        { id: "meetings", name: "Meetings", taskCount: 4 },
      ],
    },
    {
      id: "personal",
      name: "Personal",
      color: "bg-accent",
      taskCount: 6,
      folders: [
        { id: "health", name: "Health", taskCount: 3 },
        { id: "hobbies", name: "Hobbies", taskCount: 3 },
      ],
    },
    {
      id: "school",
      name: "School",
      color: "bg-secondary",
      taskCount: 15,
      folders: [
        { id: "assignments", name: "Assignments", taskCount: 10 },
        { id: "study", name: "Study", taskCount: 5 },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Workspaces</h1>
              <p className="text-sm text-muted-foreground">Organize your tasks by context</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Button>
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
                {workspaces.map((workspace) => (
                  <Button
                    key={workspace.id}
                    variant={selectedWorkspace === workspace.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedWorkspace(workspace.id)}
                  >
                    <div className={`mr-3 h-3 w-3 rounded-full ${workspace.color}`} />
                    <span className="flex-1 text-left">{workspace.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {workspace.taskCount}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Workspace Content */}
          <div className="lg:col-span-3">
            {selectedWorkspace && (
              <div className="space-y-6">
                {/* Workspace Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-4 w-4 rounded-full ${workspaces.find(w => w.id === selectedWorkspace)?.color}`} />
                        <CardTitle className="text-xl">
                          {workspaces.find(w => w.id === selectedWorkspace)?.name}
                        </CardTitle>
                      </div>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Folder Structure */}
                <WorkspaceTree 
                  workspace={workspaces.find(w => w.id === selectedWorkspace)!} 
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateWorkspaceDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
};

export default Workspaces;