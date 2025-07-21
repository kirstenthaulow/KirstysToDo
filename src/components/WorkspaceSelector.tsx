import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkspaceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const WorkspaceSelector = ({ value, onValueChange }: WorkspaceSelectorProps) => {
  const workspaces = [
    { id: "work", name: "Work", color: "bg-primary" },
    { id: "personal", name: "Personal", color: "bg-accent" },
    { id: "school", name: "School", color: "bg-secondary" },
  ];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select workspace" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${workspace.color}`} />
              <span>{workspace.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};