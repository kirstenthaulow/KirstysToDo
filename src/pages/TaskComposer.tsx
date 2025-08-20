import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Tag, Save, Sparkles, LogOut, ArrowLeft, AlertCircle, Folder } from "lucide-react";
import { TaskPrioritySelector } from "@/components/TaskPrioritySelector";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { DateTimePicker } from "@/components/DateTimePicker";
import { TagSelector } from "@/components/TagSelector";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const TaskComposer = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [workspace, setWorkspace] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("none");
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch folders when workspace changes
  useEffect(() => {
    const fetchFolders = async () => {
      if (!workspace || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('folders')
          .select('*')
          .eq('workspace_id', workspace)
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (error) throw error;
        setFolders(data || []);
      } catch (error) {
        console.error('Error fetching folders:', error);
      }
    };

    fetchFolders();
    setSelectedFolder("none"); // Reset folder selection when workspace changes
  }, [workspace, user]);

  const handleAiParse = async () => {
    if (!naturalLanguageInput.trim()) return;
    
    setIsAiParsing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('parse-task-with-ai', {
        body: { input: naturalLanguageInput }
      });

      if (error) throw error;

      console.log('Received parsed data:', data);

      // Validate and apply parsed results
      if (data.title && typeof data.title === 'string' && data.title.trim()) {
        const cleanTitle = data.title.trim();
        if (cleanTitle.length <= 200) { // Reasonable title length
          setTitle(cleanTitle);
        } else {
          setTitle(cleanTitle.slice(0, 200) + '...');
        }
      }
      
      if (data.description && typeof data.description === 'string') {
        setDescription(data.description.trim());
      }
      
      if (data.priority && ['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
        setPriority(data.priority === 'urgent' ? 'high' : data.priority);
      }
      
      if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
        // Filter out invalid tags and limit to reasonable number
        const validTags = data.tags
          .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
          .map(tag => tag.trim())
          .slice(0, 10); // Limit to 10 tags
        
        if (validTags.length > 0) {
          setSelectedTags(validTags);
        }
      }
      
      if (data.dueDate && typeof data.dueDate === 'string') {
        try {
          const parsedDate = new Date(data.dueDate);
          if (!isNaN(parsedDate.getTime()) && parsedDate > new Date()) {
            setDueDate(parsedDate);
          }
        } catch (dateError) {
          console.warn('Invalid date format:', data.dueDate);
        }
      }
      
      if (data.reminderMinutes && typeof data.reminderMinutes === 'number' && data.reminderMinutes > 0) {
        setReminderMinutes(data.reminderMinutes);
      }
      
      setNaturalLanguageInput("");
      
      toast({
        title: "✨ Task parsed successfully!",
        description: `Created: "${data.title}"`,
      });
    } catch (error) {
      console.error('Error parsing task:', error);
      
      // Fallback: create a basic task from the input
      const fallbackTitle = naturalLanguageInput.trim().slice(0, 100);
      setTitle(fallbackTitle);
      if (naturalLanguageInput.length > 100) {
        setDescription(naturalLanguageInput);
      }
      setNaturalLanguageInput("");
      
      toast({
        title: "Parsing failed - created basic task",
        description: "AI parsing failed, but created a basic task from your input.",
        variant: "default",
      });
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSaveTask = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create tasks.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Get or create workspace
      let workspaceId = workspace;

      if (!workspaceId) {
        // Create default workspace if none selected
        const { data: workspaces } = await supabase
          .from('workspaces')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (workspaces && workspaces.length > 0) {
          workspaceId = workspaces[0].id;
        } else {
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
      }

      // Create the task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          folder_id: selectedFolder === "none" ? null : selectedFolder || null,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate ? dueDate.toISOString() : null,
          priority: priority,
          status: 'pending',
          reminder_minutes: reminderMinutes
        })
        .select('id')
        .single();

      if (taskError) throw taskError;

      // Handle tags if any selected
      if (selectedTags.length > 0 && task) {
        for (const tagName of selectedTags) {
          // Get or create tag
          let { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', tagName)
            .single();

          let tagId;
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert({
                user_id: user.id,
                name: tagName,
                color: '#F59E0B'
              })
              .select('id')
              .single();

            if (tagError) throw tagError;
            tagId = newTag.id;
          }

          // Link tag to task
          await supabase
            .from('task_tags')
            .insert({
              task_id: task.id,
              tag_id: tagId
            });
        }
      }

      toast({
        title: "Task created successfully!",
        description: `"${title}" has been added to your tasks.`,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setDueDate(undefined);
      setSelectedTags([]);
      setPriority("medium");
      setWorkspace("");
      setSelectedFolder("none");
      setReminderMinutes(null);

      // Navigate back to dashboard
      navigate("/");
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Create New Task</h1>
                <p className="text-sm text-muted-foreground">Add a new task with AI-powered assistance</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/workspaces')}
                className="flex items-center space-x-2"
              >
                <Folder className="h-4 w-4" />
                <span>Workspaces</span>
              </Button>
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-6">
        <div className="space-y-6">
          {/* AI Natural Language Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <span>Quick Add with AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Try: 'Dentist appointment Friday at 3pm' or 'Finish essay by Monday'"
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAiParse()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAiParse} 
                  disabled={!naturalLanguageInput.trim() || isAiParsing}
                >
                  {isAiParsing ? "Parsing..." : "Parse"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use natural language to quickly create tasks. AI will parse dates, times, and context.
              </p>
            </CardContent>
          </Card>

          {/* Manual Task Form */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Due Date & Time */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Due Date & Time</span>
                  </Label>
                  <DateTimePicker
                    date={dueDate}
                    onDateChange={setDueDate}
                  />
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <Label>Priority</Label>
                  <TaskPrioritySelector
                    priority={priority}
                    onPriorityChange={setPriority}
                  />
                </div>
              </div>

              {/* Workspace & Folder */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Workspace</Label>
                  <WorkspaceSelector
                    value={workspace}
                    onValueChange={setWorkspace}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Folder className="h-4 w-4" />
                    <span>Folder (Optional)</span>
                  </Label>
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No folder</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reminder */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Email Reminder</span>
                </Label>
                <Select
                  value={reminderMinutes?.toString() || "none"}
                  onValueChange={(value) => setReminderMinutes(value === "none" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Set reminder time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No reminder</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="120">2 hours before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                    <SelectItem value="10080">1 week before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span>Tags</span>
                </Label>
                <TagSelector
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                />
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={handleSaveTask} 
                  className="flex-1"
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Task"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/")}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TaskComposer;