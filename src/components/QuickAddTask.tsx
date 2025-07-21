import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickAddTask = () => {
  const navigate = useNavigate();

  return (
    <Button onClick={() => navigate("/create")}>
      <Plus className="mr-2 h-4 w-4" />
      Create
    </Button>
  );
};