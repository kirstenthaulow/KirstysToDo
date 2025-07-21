import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, MoreHorizontal, Trash2, CheckCircle2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TaskList } from "@/components/TaskList";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";

interface WorkspaceTreeProps {
  workspaceId: string;
  workspaceName?: string;
  workspaceColor?: string;
  onRefresh: () => void;
}

export const WorkspaceTree = ({ workspaceId, workspaceName, workspaceColor, onRefresh }: WorkspaceTreeProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFolders = async () => {
    if (!user || !workspaceId) return;

    try {
      const { data: foldersData, error } = await supabase
        .from('folders')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get task counts for each folder
      const foldersWithCounts = await Promise.all(
        (foldersData || []).map(async (folder) => {
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('folder_id', folder.id)
            .eq('user_id', user.id);

          return {
            ...folder,
            taskCount: count || 0,
          };
        })
      );

      setFolders(foldersWithCounts);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      // First delete all tasks in the folder
      await supabase
        .from('tasks')
        .delete()
        .eq('folder_id', folderId)
        .eq('user_id', user?.id);

      // Then delete the folder
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Folder deleted",
        description: "Folder and all its tasks have been deleted",
      });

      fetchFolders();
      onRefresh();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [workspaceId, user]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const FolderItem = ({ 
    folder, 
    level = 0 
  }: { 
    folder: any; 
    level?: number;
  }) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;
    const paddingLeft = `${level * 1.5 + 1}rem`;

    return (
      <div>
        <div 
          className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
          style={{ paddingLeft }}
        >
          <div 
            className="flex items-center space-x-2 flex-1"
            onClick={() => hasSubfolders && toggleFolder(folder.id)}
          >
            {hasSubfolders ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <div className="w-4" />
            )}
            
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-primary" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
            
            <span className="font-medium">{folder.name}</span>
            <Badge variant="secondary" className="ml-2">
              {folder.taskCount}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Folder
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the folder "{folder.name}" and all tasks within it. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteFolder(folder.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasSubfolders && isExpanded && (
          <div className="space-y-1">
            {folder.subfolders.map((subfolder: any) => (
              <FolderItem 
                key={subfolder.id} 
                folder={subfolder} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Folder Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {workspaceColor && (
              <div 
                className="h-4 w-4 rounded-full" 
                style={{ backgroundColor: workspaceColor }}
              />
            )}
            <CardTitle className="text-lg">
              {workspaceName || 'Folder Structure'}
            </CardTitle>
          </div>
          <CreateFolderDialog
            workspaceId={workspaceId}
            onFolderCreated={() => {
              fetchFolders();
              onRefresh();
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {folders.map((folder) => (
            <FolderItem key={folder.id} folder={folder} />
          ))}
        </div>
        
        {/* Show workspace tasks directly if no folders */}
        {folders.length === 0 && (
          <div className="space-y-4">
            <TaskList
              filter="all"
              searchQuery=""
              workspaceFilter={workspaceId}
              showWorkspaceDots={false}
              compact={false}
            />
            <div className="text-center py-4">
              <CreateFolderDialog
                workspaceId={workspaceId}
                onFolderCreated={() => {
                  fetchFolders();
                  onRefresh();
                }}
                trigger={
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first folder
                  </Button>
                }
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};