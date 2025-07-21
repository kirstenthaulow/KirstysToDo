import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, MoreHorizontal } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  folders: Array<{
    id: string;
    name: string;
    taskCount: number;
    subfolders?: Array<{
      id: string;
      name: string;
      taskCount: number;
    }>;
  }>;
}

interface WorkspaceTreeProps {
  workspace: Workspace;
}

export const WorkspaceTree = ({ workspace }: WorkspaceTreeProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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

  // Add some mock subfolders for demonstration
  const enhancedWorkspace = {
    ...workspace,
    folders: workspace.folders.map(folder => ({
      ...folder,
      subfolders: folder.id === "projects" ? [
        { id: "web-proj", name: "Web Projects", taskCount: 4 },
        { id: "mobile-proj", name: "Mobile Projects", taskCount: 4 },
      ] : folder.id === "assignments" ? [
        { id: "math", name: "Mathematics", taskCount: 5 },
        { id: "science", name: "Science", taskCount: 5 },
      ] : undefined
    }))
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Folder Structure</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {enhancedWorkspace.folders.map((folder) => (
            <FolderItem key={folder.id} folder={folder} />
          ))}
        </div>
        
        {enhancedWorkspace.folders.length === 0 && (
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