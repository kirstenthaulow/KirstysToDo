import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkspaceCreated: () => void;
}

export const CreateWorkspaceDialog = ({ open, onOpenChange, onWorkspaceCreated }: CreateWorkspaceDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6366F1");

  const colors = [
    { id: "#6366F1", name: "Indigo", class: "#6366F1" },
    { id: "#F59E0B", name: "Amber", class: "#F59E0B" },
    { id: "#EF4444", name: "Red", class: "#EF4444" },
    { id: "#10B981", name: "Green", class: "#10B981" },
    { id: "#3B82F6", name: "Blue", class: "#3B82F6" },
    { id: "#8B5CF6", name: "Purple", class: "#8B5CF6" },
    { id: "#EC4899", name: "Pink", class: "#EC4899" },
    { id: "#F97316", name: "Orange", class: "#F97316" },
  ];

  const handleCreate = async () => {
    if (!name.trim() || !user) {
      toast({
        title: "Error",
        description: "Please enter a workspace name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('workspaces')
        .insert({
          user_id: user.id,
          name: name.trim(),
          color: selectedColor,
        });

      if (error) throw error;

      toast({
        title: "Workspace created!",
        description: `"${name}" workspace has been created successfully.`,
      });

      // Reset form and close dialog
      setName("");
      setSelectedColor("#6366F1");
      onOpenChange(false);
      onWorkspaceCreated();
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to create workspace. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="e.g., Work, Personal, School"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Color Theme</Label>
            <div className="grid grid-cols-4 gap-3">
              {colors.map((color) => (
                <div
                  key={color.id}
                  className={`relative rounded-lg p-3 cursor-pointer border-2 transition-all ${
                    selectedColor === color.id 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-muted-foreground"
                  }`}
                  onClick={() => setSelectedColor(color.id)}
                >
                  <div className="w-full h-8 rounded" style={{ backgroundColor: color.class }} />
                  <p className="text-xs text-center mt-1 text-muted-foreground">
                    {color.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {name && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedColor }} />
                <span className="font-medium">{name}</span>
                <Badge variant="secondary">0</Badge>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button onClick={handleCreate} disabled={!name.trim()} className="flex-1">
              Create Workspace
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};