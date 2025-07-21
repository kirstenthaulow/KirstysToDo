import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagSelector = ({ selectedTags, onTagsChange }: TagSelectorProps) => {
  const [inputValue, setInputValue] = useState("");
  const [userTags, setUserTags] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
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
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (error) throw error;
        setUserTags(data || []);
      } catch (error) {
        console.error('Error fetching user tags:', error);
      }
    };

    fetchUserTags();
  }, [user]);

  const userTagNames = userTags.map(tag => tag.name);
  const allAvailableTags = [...new Set([...commonTags, ...userTagNames])];
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

  const deleteTag = async (tagId: string, tagName: string) => {
    try {
      // Delete the tag from database
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Remove from selected tags if it was selected
      if (selectedTags.includes(tagName)) {
        onTagsChange(selectedTags.filter(tag => tag !== tagName));
      }

      // Refresh user tags
      const { data, error: fetchError } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user?.id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setUserTags(data || []);

      toast({
        title: "Tag deleted",
        description: `Tag "${tagName}" has been removed from your tags.`,
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag. Please try again.",
        variant: "destructive",
      });
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
          {availableTags.map((tag) => {
            const userTag = userTags.find(ut => ut.name === tag);
            return (
              <div key={tag} className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTag(tag)}
                  className="text-xs"
                >
                  {tag}
                </Button>
                {userTag && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the tag "{tag}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteTag(userTag.id, userTag.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })}
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