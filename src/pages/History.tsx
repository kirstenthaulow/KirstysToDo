import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, RotateCcw, Trash2, Search, Calendar } from "lucide-react";
import { CompletedTaskList } from "@/components/CompletedTaskList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [periods, setPeriods] = useState([
    { id: "today", label: "Today", count: 0 },
    { id: "week", label: "This Week", count: 0 },
    { id: "month", label: "This Month", count: 0 },
    { id: "all", label: "All Time", count: 0 },
  ]);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    thisWeek: 0,
    avgPerDay: 0,
    streak: 0,
  });
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayCount = tasks?.filter(t => {
        const taskDate = new Date(t.completed_at);
        return new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()).getTime() === today.getTime();
      }).length || 0;

      const weekCount = tasks?.filter(t => new Date(t.completed_at) >= weekAgo).length || 0;
      const monthCount = tasks?.filter(t => new Date(t.completed_at) >= monthAgo).length || 0;
      const totalCount = tasks?.length || 0;

      setPeriods([
        { id: "today", label: "Today", count: todayCount },
        { id: "week", label: "This Week", count: weekCount },
        { id: "month", label: "This Month", count: monthCount },
        { id: "all", label: "All Time", count: totalCount },
      ]);

      setStats({
        totalCompleted: totalCount,
        thisWeek: weekCount,
        avgPerDay: weekCount > 0 ? Math.round((weekCount / 7) * 10) / 10 : 0,
        streak: todayCount > 0 ? 1 : 0, // Simplified streak calculation
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">KirstysToDos - History</h1>
              <p className="text-sm text-muted-foreground">View and manage completed tasks</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats.totalCompleted}</div>
                  <div className="text-sm text-muted-foreground">Total Completed</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-semibold text-accent">{stats.thisWeek}</div>
                    <div className="text-xs text-muted-foreground">This Week</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-green-600">{stats.streak}</div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground">
                    Average: {stats.avgPerDay} tasks/day
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Period Filter */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Time Period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {periods.map((period) => (
                  <Button
                    key={period.id}
                    variant={selectedPeriod === period.id ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setSelectedPeriod(period.id)}
                  >
                    <span>{period.label}</span>
                    <Badge variant="secondary" className="ml-2">
                      {period.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Task History */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6 flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search completed tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Achievement Banner */}
            {stats.streak >= 7 && (
              <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">7-Day Streak! 🎉</h3>
                      <p className="text-sm text-muted-foreground">
                        You've completed tasks for 7 days in a row. Keep it up!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Tasks List */}
            <CompletedTaskList 
              period={selectedPeriod}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default History;