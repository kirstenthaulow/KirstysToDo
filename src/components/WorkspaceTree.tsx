import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {folders.map((folder) => (
            <FolderItem key={folder.id} folder={folder} />
          ))}
        </div>
        
        {folders.length === 0 && (
          <div className="text-center py-8">
            <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No folders yet</p>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create your first folder
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};