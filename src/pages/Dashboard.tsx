import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, Clock, Search, Filter } from "lucide-react";
import { TaskList } from "@/components/TaskList";
import { QuickAddTask } from "@/components/QuickAddTask";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("today");

  const filters = [
    { id: "today", label: "Today", count: 3 },
    { id: "upcoming", label: "Upcoming", count: 8 },
    { id: "overdue", label: "Overdue", count: 1 },
    { id: "all", label: "All", count: 24 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">TaskNest</h1>
              <p className="text-sm text-muted-foreground">Your smart task organizer</p>
            </div>
            <QuickAddTask />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={activeFilter === filter.id ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    <span>{filter.label}</span>
                    <Badge variant="secondary" className="ml-2">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Today's Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm">Due Today</span>
                  </div>
                  <Badge variant="default">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="text-sm">Upcoming</span>
                  </div>
                  <Badge variant="secondary">8</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task List */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6 flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Tasks */}
            <TaskList filter={activeFilter} searchQuery={searchQuery} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;