import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Tag, Save, Sparkles } from "lucide-react";
import { TaskPrioritySelector } from "@/components/TaskPrioritySelector";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { DateTimePicker } from "@/components/DateTimePicker";
import { TagSelector } from "@/components/TagSelector";
import { useToast } from "@/hooks/use-toast";

const TaskComposer = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [workspace, setWorkspace] = useState("");
  const [location, setLocation] = useState("");
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);

  const handleAiParse = async () => {
    if (!naturalLanguageInput.trim()) return;
    
    setIsAiParsing(true);
    
    // Simulate AI parsing (in real app, this would call an AI service)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock parsing results
    if (naturalLanguageInput.toLowerCase().includes("dentist")) {
      setTitle("Dentist Appointment");
      setDescription("Regular checkup and cleaning");
      setLocation("Downtown Dental Clinic");
      setSelectedTags(["health", "appointment"]);
      setPriority("medium");
      
      // Parse date if mentioned
      if (naturalLanguageInput.toLowerCase().includes("friday")) {
        const nextFriday = new Date();
        nextFriday.setDate(nextFriday.getDate() + (5 - nextFriday.getDay()));
        if (naturalLanguageInput.toLowerCase().includes("3pm")) {
          nextFriday.setHours(15, 0, 0, 0);
        }
        setDueDate(nextFriday);
      }
    } else if (naturalLanguageInput.toLowerCase().includes("essay")) {
      setTitle("Finish Essay");
      setDescription("Complete the final draft and proofread");
      setSelectedTags(["school", "assignment"]);
      setPriority("high");
      setWorkspace("school");
    }
    
    setIsAiParsing(false);
    setNaturalLanguageInput("");
    
    toast({
      title: "✨ Task parsed successfully!",
      description: "AI has filled in the task details based on your input.",
    });
  };

  const handleSaveTask = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would save to the database
    toast({
      title: "Task created!",
      description: `"${title}" has been added to your tasks.`,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setSelectedTags([]);
    setPriority("medium");
    setWorkspace("");
    setLocation("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Create New Task</h1>
              <p className="text-sm text-muted-foreground">Add a new task with AI-powered assistance</p>
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

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <TaskPrioritySelector
                    priority={priority}
                    onPriorityChange={setPriority}
                  />
                </div>
              </div>

              {/* Workspace & Location */}
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
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </Label>
                  <Input
                    placeholder="Where will this happen?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
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
                <Button onClick={handleSaveTask} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save Task
                </Button>
                <Button variant="outline">Save & Add Another</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TaskComposer;