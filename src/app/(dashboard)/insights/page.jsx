"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/hooks/useGroups";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { Sparkles, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#64748b",
];

export default function InsightsPage() {
  const { groups } = useGroups();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [insights, setInsights] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trend, setTrend] = useState(null);
  const [source, setSource] = useState("ai");
  const [loading, setLoading] = useState(false);

  const activeGroupId = useMemo(
    () => selectedGroup || groups[0]?._id || "",
    [selectedGroup, groups],
  );

  const fetchInsights = useCallback(
    async (groupId, { silent = false } = {}) => {
      if (!groupId) return;
      if (!silent) setLoading(true);
      try {
        const res = await axios.get(`/api/ai/insights?groupId=${groupId}`);
        setInsights(res.data.insights || []);
        setSource(res.data.source || "ai");
        setTrend(res.data.trend);
        const cats = Object.entries(res.data.categoryBreakdown || {}).map(
          ([name, data]) => ({
            name,
            value: Math.round(data.total),
            count: data.count,
          }),
        );
        setCategoryData(cats);
      } catch {
        toast.error("Failed to load insights");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!activeGroupId) return undefined;

    fetchInsights(activeGroupId);

    const intervalId = window.setInterval(() => {
      fetchInsights(activeGroupId, { silent: true });
    }, 30000);

    const handleFocus = () => {
      fetchInsights(activeGroupId, { silent: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [activeGroupId, fetchInsights]);

  const insightColors = {
    info: "border-l-blue-400 bg-blue-50",
    warning: "border-l-yellow-400 bg-yellow-50",
    success: "border-l-green-400 bg-green-50",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Sparkles className="h-8 w-8 text-yellow-500" /> AI Insights
          </h1>
          <p className="mt-1 text-muted-foreground">
            Smart spending analysis powered by Gemini
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchInsights(activeGroupId)}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{" "}
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <Button
            key={g._id}
            variant={activeGroupId === g._id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedGroup(g._id)}
          >
            {g.name}
          </Button>
        ))}
      </div>

      {!groups.length && !loading ? (
        <Card className="py-12 text-center">
          <CardContent>
            <Sparkles className="mx-auto mb-3 h-12 w-12 text-yellow-500" />
            <h2 className="text-xl font-semibold">No insights yet</h2>
            <p className="mt-2 text-muted-foreground">
              Create a group and add a few expenses to unlock category
              breakdowns and AI spending insights.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <LoadingSpinner size="lg" label="Analyzing spending patterns" />
      ) : (
        <>
          {source !== "ai" && (
            <Card className="border-l-4 border-l-amber-400 bg-amber-50/80">
              <CardContent className="pt-4">
                <p className="font-semibold text-amber-900">AI fallback mode</p>
                <p className="mt-1 text-sm text-amber-800">
                  Gemini is not configured or returned an invalid response, so
                  these insights are generated locally from your spending data.
                </p>
              </CardContent>
            </Card>
          )}

          {trend && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Last 7 Days</p>
                  <p className="text-2xl font-bold">
                    ₹{Math.round(trend.recentTotal)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-gray-400">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Previous 7 Days
                  </p>
                  <p className="text-2xl font-bold">
                    ₹{Math.round(trend.previousTotal)}
                  </p>
                </CardContent>
              </Card>
              <Card
                className={`border-l-4 ${trend.percentChange > 0 ? "border-l-red-500" : "border-l-green-500"}`}
              >
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Change</p>
                  <p
                    className={`flex items-center gap-1 text-2xl font-bold ${
                      trend.percentChange > 0
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {trend.percentChange > 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    {Math.abs(trend.percentChange)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {insights.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">AI Recommendations</h2>
              {insights.map((insight, i) => (
                <Card
                  key={i}
                  className={`border-l-4 ${insightColors[insight.type] || insightColors.info}`}
                >
                  <CardContent className="pt-4">
                    <p className="font-semibold">{insight.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {insight.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {categoryData.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `₹${v}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Amount per Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => `₹${v}`} />
                      <Bar
                        dataKey="value"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
