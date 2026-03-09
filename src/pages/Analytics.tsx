import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiInsights } from "@/components/AiInsights";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Users,
  Clock,
  Target,
  BarChart3,
  Activity,
} from "lucide-react";

const COLORS = ["#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444"];

interface DailyData {
  date: string;
  messages_sent: number;
  messages_delivered: number;
  messages_read: number;
  messages_failed: number;
  messages_inbound: number;
  conversations_created: number;
  contacts_created: number;
}

export default function Analytics() {
  const { currentOrg } = useOrg();
  const [period, setPeriod] = useState("30");
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  // Live metrics (computed from daily data)
  const [metrics, setMetrics] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalInbound: 0,
    totalFailed: 0,
    deliveryRate: 0,
    readRate: 0,
    responseRate: 0,
    newContacts: 0,
    newConversations: 0,
    avgDaily: 0,
  });

  // Conversation metrics
  const [convMetrics, setConvMetrics] = useState({
    openCount: 0,
    resolvedCount: 0,
    avgResolutionHrs: 0,
    unassignedCount: 0,
  });

  // Source breakdown
  const [sourceData, setSourceData] = useState<{ name: string; value: number }[]>([]);

  const fetchData = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);

    const days = parseInt(period);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromStr = fromDate.toISOString().split("T")[0];

    // Fetch daily analytics
    const { data: daily } = await supabase
      .from("daily_analytics")
      .select("*")
      .eq("org_id", currentOrg.id)
      .gte("date", fromStr)
      .order("date", { ascending: true });

    const data = (daily as DailyData[]) || [];
    setDailyData(data);

    // Compute metrics
    const totalSent = data.reduce((s, d) => s + d.messages_sent, 0);
    const totalDelivered = data.reduce((s, d) => s + d.messages_delivered, 0);
    const totalRead = data.reduce((s, d) => s + d.messages_read, 0);
    const totalInbound = data.reduce((s, d) => s + d.messages_inbound, 0);
    const totalFailed = data.reduce((s, d) => s + d.messages_failed, 0);
    const newContacts = data.reduce((s, d) => s + d.contacts_created, 0);
    const newConversations = data.reduce((s, d) => s + d.conversations_created, 0);

    setMetrics({
      totalSent,
      totalDelivered,
      totalRead,
      totalInbound,
      totalFailed,
      deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
      readRate: totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0,
      responseRate: totalSent > 0 ? Math.round((totalInbound / totalSent) * 100) : 0,
      newContacts,
      newConversations,
      avgDaily: data.length > 0 ? Math.round(totalSent / data.length) : 0,
    });

    // Fetch conversation metrics
    const [
      { count: openCount },
      { count: resolvedCount },
      { count: unassignedCount },
    ] = await Promise.all([
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("org_id", currentOrg.id).eq("status", "open"),
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("org_id", currentOrg.id).not("resolved_at", "is", null),
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("org_id", currentOrg.id).eq("status", "open").is("assigned_to", null),
    ]);

    setConvMetrics({
      openCount: openCount ?? 0,
      resolvedCount: resolvedCount ?? 0,
      avgResolutionHrs: 0, // Would need time-based query
      unassignedCount: unassignedCount ?? 0,
    });

    // Fetch contact source breakdown
    const { data: contacts } = await supabase
      .from("contacts")
      .select("source")
      .eq("org_id", currentOrg.id);

    const sourceCounts: Record<string, number> = {};
    (contacts || []).forEach((c: any) => {
      const src = c.source || "unknown";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    setSourceData(Object.entries(sourceCounts).map(([name, value]) => ({ name, value })));

    setLoading(false);
  }, [currentOrg, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = dailyData.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    sent: d.messages_sent,
    delivered: d.messages_delivered,
    read: d.messages_read,
    failed: d.messages_failed,
    inbound: d.messages_inbound,
  }));

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive messaging and conversation analytics</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* AI Insights */}
      <div className="mb-6">
        <AiInsights type="dashboard" />
      </div>

      {loading ? (
        <p className="py-8 text-center text-muted-foreground">Loading analytics...</p>
      ) : (
        <Tabs defaultValue="messaging">
          <TabsList>
            <TabsTrigger value="messaging">
              <MessageSquare className="mr-1.5 h-4 w-4" /> Messaging
            </TabsTrigger>
            <TabsTrigger value="conversations">
              <Activity className="mr-1.5 h-4 w-4" /> Conversations
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Users className="mr-1.5 h-4 w-4" /> Contacts
            </TabsTrigger>
          </TabsList>

          {/* ── Messaging Tab ── */}
          <TabsContent value="messaging" className="mt-4 space-y-6">
            {/* KPI Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Sent", value: metrics.totalSent, icon: MessageSquare, color: "text-blue-600" },
                { label: "Delivered", value: `${metrics.deliveryRate}%`, icon: Target, color: "text-green-600" },
                { label: "Read", value: `${metrics.readRate}%`, icon: TrendingUp, color: "text-purple-600" },
                { label: "Response Rate", value: `${metrics.responseRate}%`, icon: Activity, color: "text-amber-600" },
                { label: "Failed", value: metrics.totalFailed, icon: TrendingDown, color: "text-red-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className={`rounded-lg bg-muted p-2 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Message Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Message Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="sent" name="Sent" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="read" name="Read" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="inbound" name="Inbound" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Delivery Funnel */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { stage: "Sent", count: metrics.totalSent },
                        { stage: "Delivered", count: metrics.totalDelivered },
                        { stage: "Read", count: metrics.totalRead },
                        { stage: "Replied", count: metrics.totalInbound },
                      ]}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="stage" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b"].map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Average</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-4xl font-bold">{metrics.avgDaily}</p>
                  <p className="text-sm text-muted-foreground">messages/day</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
                    <div>
                      <p className="text-2xl font-semibold text-green-600">{metrics.totalInbound.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Inbound</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-blue-600">{metrics.totalSent.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Outbound</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Conversations Tab ── */}
          <TabsContent value="conversations" className="mt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Open Conversations", value: convMetrics.openCount, color: "text-blue-600" },
                { label: "Resolved", value: convMetrics.resolvedCount, color: "text-green-600" },
                { label: "Unassigned", value: convMetrics.unassignedCount, color: "text-amber-600" },
                { label: "New Conversations", value: metrics.newConversations, color: "text-purple-600" },
              ].map(({ label, value, color }) => (
                <Card key={label}>
                  <CardContent className="py-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Conversation Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="inbound" name="Inbound Messages" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sent" name="Outbound Messages" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Contacts Tab ── */}
          <TabsContent value="contacts" className="mt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground">New Contacts ({period}d)</p>
                  <p className="text-3xl font-bold text-green-600">{metrics.newContacts.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground">From Ads (CTWA)</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {sourceData.find((s) => s.name === "ctwa_ad")?.value || 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground">From Inbound</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {sourceData.find((s) => s.name === "inbound")?.value || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Contact Sources</CardTitle>
              </CardHeader>
              <CardContent>
                {sourceData.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No contact data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {sourceData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}
