import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagSelector = ({ selectedTags, onTagsChange }: TagSelectorProps) => {
  const [inputValue, setInputValue] = useState("");
  const [userTags, setUserTags] = useState<string[]>([]);
  const { user } = useAuth();
  
  const commonTags = [
    "work", "personal", "urgent", "meeting", "project", 
    "health", "exercise", "study", "assignment", "shopping",
    "appointment", "call", "email", "review", "planning"
  ];

  useEffect(() => {
    const fetchUserTags = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('tags')
          .select('name')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (error) throw error;
        setUserTags(data?.map(tag => tag.name) || []);
      } catch (error) {
        console.error('Error fetching user tags:', error);
      }
    };

    fetchUserTags();
  }, [user]);

  const allAvailableTags = [...new Set([...commonTags, ...userTags])];
  const availableTags = allAvailableTags.filter(tag => !selectedTags.includes(tag));

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      if (!selectedTags.includes(newTag)) {
        handleAddTag(newTag);
        setInputValue("");
      }
    }
  };

  const handleAddCustomTag = () => {
    if (inputValue.trim()) {
      const newTag = inputValue.trim().toLowerCase();
      if (!selectedTags.includes(newTag)) {
        handleAddTag(newTag);
        setInputValue("");
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Custom tag input */}
      <div className="flex space-x-2">
        <Input
          placeholder="Add custom tag..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleInputKeyPress}
          className="flex-1"
        />
        <Button 
          type="button"
          variant="outline" 
          size="icon"
          onClick={handleAddCustomTag}
          disabled={!inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Common tags */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Available tags:</p>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddTag(tag)}
              className="text-xs"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected tags:</p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};