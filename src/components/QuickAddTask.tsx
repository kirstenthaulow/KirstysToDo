import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickAddTask = () => {
  const navigate = useNavigate();

  return (
    <Button 
      onClick={() => navigate("/create")}
      className="flex items-center space-x-2"
    >
      <Plus className="h-4 w-4" />
      <span>Create</span>
    </Button>
  );
};