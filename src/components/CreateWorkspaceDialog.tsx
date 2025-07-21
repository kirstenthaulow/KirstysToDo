import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateWorkspaceDialog = ({ open, onOpenChange }: CreateWorkspaceDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-primary");

  const colors = [
    { id: "bg-primary", name: "Indigo", class: "bg-primary" },
    { id: "bg-accent", name: "Amber", class: "bg-accent" },
    { id: "bg-red-500", name: "Red", class: "bg-red-500" },
    { id: "bg-green-500", name: "Green", class: "bg-green-500" },
    { id: "bg-blue-500", name: "Blue", class: "bg-blue-500" },
    { id: "bg-purple-500", name: "Purple", class: "bg-purple-500" },
    { id: "bg-pink-500", name: "Pink", class: "bg-pink-500" },
    { id: "bg-orange-500", name: "Orange", class: "bg-orange-500" },
  ];

  const handleCreate = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workspace name.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would create the workspace in the database
    toast({
      title: "Workspace created!",
      description: `"${name}" workspace has been created successfully.`,
    });

    // Reset form and close dialog
    setName("");
    setSelectedColor("bg-primary");
    onOpenChange(false);
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
                  <div className={`w-full h-8 rounded ${color.class}`} />
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
                <div className={`w-3 h-3 rounded-full ${selectedColor}`} />
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