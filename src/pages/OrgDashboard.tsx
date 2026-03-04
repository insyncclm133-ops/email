import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, TrendingUp, TrendingDown, Send, Eye, Users, CheckCheck, Database, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
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
import { useOrgDashboard } from "@/hooks/useOrgDashboard";
import type { OrgKpis, RecentCampaign } from "@/hooks/useOrgDashboard";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { seedDashboardData, unseedDashboardData } from "@/lib/seedDashboard";
import { useState } from "react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// --- Sparkline SVG (decorative) ---
function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 32" className="h-8 w-20 opacity-20" fill="none">
      <polyline
        points="0,28 12,20 24,24 36,12 48,16 60,6 72,10 80,4"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

// --- KPI Card ---
const KPI_CONFIG: {
  key: keyof Pick<OrgKpis, "messagesSentMTD" | "deliveryRate" | "readRate" | "totalContacts">;
  prevKey: keyof Pick<OrgKpis, "messagesPrevMonth" | "deliveryRatePrev" | "readRatePrev" | "totalContactsPrev">;
  label: string;
  gradient: string;
  sparkColor: string;
  icon: typeof Send;
  suffix?: string;
}[] = [
  {
    key: "messagesSentMTD",
    prevKey: "messagesPrevMonth",
    label: "MESSAGES SENT MTD",
    gradient: "from-sky-500 to-blue-600",
    sparkColor: "#0ea5e9",
    icon: Send,
  },
  {
    key: "deliveryRate",
    prevKey: "deliveryRatePrev",
    label: "DELIVERY RATE",
    gradient: "from-emerald-500 to-green-600",
    sparkColor: "#10b981",
    icon: CheckCheck,
    suffix: "%",
  },
  {
    key: "readRate",
    prevKey: "readRatePrev",
    label: "READ RATE",
    gradient: "from-violet-500 to-purple-600",
    sparkColor: "#8b5cf6",
    icon: Eye,
    suffix: "%",
  },
  {
    key: "totalContacts",
    prevKey: "totalContactsPrev",
    label: "TOTAL CONTACTS",
    gradient: "from-amber-500 to-orange-600",
    sparkColor: "#f59e0b",
    icon: Users,
  },
];

function KpiCards({ kpis }: { kpis: OrgKpis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_CONFIG.map((cfg) => {
        const value = kpis[cfg.key];
        const prev = kpis[cfg.prevKey];
        const delta = prev > 0 ? Math.round(((value - prev) / prev) * 100) : value > 0 ? 100 : 0;
        const isUp = delta >= 0;
        const Icon = cfg.icon;

        return (
          <Card key={cfg.key} className="relative overflow-hidden border-border shadow-sm">
            <div className={`h-1 bg-gradient-to-r ${cfg.gradient}`} />
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium tracking-wider text-muted-foreground">
                    {cfg.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-foreground">
                    {value.toLocaleString()}
                    {cfg.suffix ?? ""}
                  </p>
                  {prev > 0 || value > 0 ? (
                    <div
                      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isUp
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isUp ? "+" : ""}
                      {delta}% vs last month
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Sparkline color={cfg.sparkColor} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// --- Campaign Performance Bar Chart ---
function CampaignPerformanceChart({ data }: { data: { day: string; sent: number; delivered: number; read: number }[] }) {
  const hasData = data.some((d) => d.sent > 0);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Campaign Performance</CardTitle>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[280px] items-center justify-center text-muted-foreground">
            No message data in the last 7 days
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(220,13%,91%)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="sent" name="Sent" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
              <Bar dataKey="delivered" name="Delivered" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="read" name="Read" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// --- Quick Stats sidebar ---
function QuickStats({ kpis }: { kpis: OrgKpis }) {
  const stats = [
    { label: "Total Delivered", value: kpis.deliveryRate + "%", sub: "All-time rate" },
    { label: "Read Rate", value: kpis.readRate + "%", sub: "All-time rate" },
    { label: "This Month", value: kpis.messagesSentMTD.toLocaleString(), sub: "Messages sent" },
  ];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// --- Status badge helper ---
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "live" || s === "sending") {
    return (
      <Badge className="border-0 bg-emerald-500/10 text-emerald-600">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Live
      </Badge>
    );
  }
  if (s === "scheduled") {
    return <Badge className="border-0 bg-sky-500/10 text-sky-600">Scheduled</Badge>;
  }
  if (s === "done" || s === "sent" || s === "completed") {
    return <Badge className="border-0 bg-gray-500/10 text-gray-500">Done</Badge>;
  }
  if (s === "draft") {
    return <Badge className="border-0 bg-amber-500/10 text-amber-600">Draft</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

// --- Recent Broadcasts Table ---
function RecentBroadcastsTable({ campaigns }: { campaigns: RecentCampaign[] }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Recent Broadcasts</CardTitle>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No campaigns yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead>Read Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const categoryColor =
                  c.category?.toLowerCase() === "marketing"
                    ? "text-emerald-600"
                    : c.category?.toLowerCase() === "utility"
                    ? "text-sky-600"
                    : c.category?.toLowerCase() === "authentication"
                    ? "text-violet-600"
                    : "text-muted-foreground";

                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium capitalize ${categoryColor}`}>
                        {c.category ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{c.sent.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {c.delivered.toLocaleString()}
                      {c.sent > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({Math.round((c.delivered / c.sent) * 100)}%)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${c.readRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{c.readRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// --- Message Mix Donut ---
const MIX_COLORS: Record<string, string> = {
  Marketing: "#10b981",
  Utility: "#0ea5e9",
  Authentication: "#8b5cf6",
  Uncategorized: "#94a3b8",
};

function getColor(name: string) {
  return MIX_COLORS[name] ?? "#94a3b8";
}

function MessageMixDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Message Mix</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No message data</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={getColor(d.name)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), "Messages"]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                {/* Center label */}
                <text
                  x="50%"
                  y="48%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-2xl font-bold"
                >
                  {total.toLocaleString()}
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-xs"
                >
                  total
                </text>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-2">
              {data.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: getColor(d.name) }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium">
                    {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// --- Skeleton loader ---
function SectionSkeleton({ height = "h-48" }: { height?: string }) {
  return <Skeleton className={`w-full rounded-lg ${height}`} />;
}

// --- Main Page ---
export default function OrgDashboard() {
  const { data, loading, refresh } = useOrgDashboard();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!currentOrg || !user) return;
    setSeeding(true);
    try {
      const counts = await seedDashboardData(currentOrg.id, user.id);
      toast({
        title: "Demo data seeded",
        description: `${counts.templates} templates, ${counts.contacts} contacts, ${counts.campaigns} campaigns, ${counts.messages} messages`,
      });
      refresh();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Seed failed", description: e.message });
    } finally {
      setSeeding(false);
    }
  };

  const handleUnseed = async () => {
    if (!currentOrg) return;
    setSeeding(true);
    try {
      await unseedDashboardData(currentOrg.id);
      toast({ title: "Demo data removed" });
      refresh();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Unseed failed", description: e.message });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Your WhatsApp campaign command centre</p>
        </div>
        <div className="flex items-center gap-2">
          {/* TODO: Remove seed buttons before production */}
          <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding || loading}>
            <Database className="mr-2 h-4 w-4" />
            Seed Demo
          </Button>
          <Button variant="outline" size="sm" onClick={handleUnseed} disabled={seeding || loading} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Unseed
          </Button>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Row 1: KPI Cards */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0 }}>
          {loading ? <SectionSkeleton height="h-32" /> : <KpiCards kpis={data.kpis} />}
        </motion.div>

        {/* Row 2: Chart + Quick Stats */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          <div className="lg:col-span-2">
            {loading ? (
              <SectionSkeleton height="h-[380px]" />
            ) : (
              <CampaignPerformanceChart data={data.weeklyChart} />
            )}
          </div>
          <div>
            {loading ? (
              <SectionSkeleton height="h-[380px]" />
            ) : (
              <QuickStats kpis={data.kpis} />
            )}
          </div>
        </motion.div>

        {/* Row 3: Broadcasts Table + Message Mix */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          <div className="lg:col-span-2">
            {loading ? (
              <SectionSkeleton height="h-[320px]" />
            ) : (
              <RecentBroadcastsTable campaigns={data.recentCampaigns} />
            )}
          </div>
          <div>
            {loading ? (
              <SectionSkeleton height="h-[320px]" />
            ) : (
              <MessageMixDonut data={data.messageMix} />
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
