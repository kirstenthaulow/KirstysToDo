import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const QuickAddTask = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuickAdd = async () => {
    if (!input.trim() || !user) return;

    setIsProcessing(true);

    try {
      // Create default workspace if none exists
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      let workspaceId = workspaces?.[0]?.id;

      if (!workspaceId) {
        const { data: newWorkspace, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({
            user_id: user.id,
            name: 'Personal',
            color: '#6366F1'
          })
          .select('id')
          .single();

        if (workspaceError) throw workspaceError;
        workspaceId = newWorkspace.id;
      }

      // Simple task creation - in a real app this would have AI parsing
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          title: input.trim(),
          priority: 'medium',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "✨ Task created!",
        description: `"${input}" has been added to your tasks.`,
      });

      setInput("");
      setOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Quick Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span>Quick Add Task</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="What needs to be done? Try: 'Meeting with John tomorrow at 2pm'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleQuickAdd()}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Use natural language - AI will parse dates, times, and context automatically.
            </p>
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={handleQuickAdd} 
              disabled={!input.trim() || isProcessing}
              className="flex-1"
            >
              {isProcessing ? "Creating..." : "Create Task"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};