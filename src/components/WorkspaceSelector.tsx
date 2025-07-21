import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WorkspaceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const WorkspaceSelector = ({ value, onValueChange }: WorkspaceSelectorProps) => {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('workspaces')
          .select('id, name, color')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setWorkspaces(data || []);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [user]);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading workspaces..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select workspace" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: workspace.color }}
              />
              <span>{workspace.name}</span>
            </div>
          </SelectItem>
        ))}
        {workspaces.length === 0 && (
          <SelectItem value="" disabled>
            No workspaces found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};