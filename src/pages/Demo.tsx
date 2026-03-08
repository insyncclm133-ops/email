import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  LayoutDashboard,
  Users,
  Megaphone,
  FileText,
  MessageSquare,
  Zap,
  Settings,
  Wallet,
  Send,
  CheckCheck,
  Check,
  Eye,
  TrendingUp,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Bot,
  Rocket,
  Upload,
  Sparkles,
  CreditCard,
  IndianRupee,
  Receipt,
  UserPlus,
  Building2,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";

/* ── Timing ───────────────────────────────────────────── */

const SCENES = [
  { id: "intro", label: "Intro", duration: 6000 },
  { id: "dashboard", label: "AI Analytics", duration: 13000 },
  { id: "campaigns", label: "Campaigns", duration: 13000 },
  { id: "communications", label: "AI Replies", duration: 14000 },
  { id: "billing", label: "Billing", duration: 11000 },
  { id: "outro", label: "Summary", duration: 6000 },
] as const;

const TOTAL = SCENES.reduce((s, sc) => s + sc.duration, 0);

type SceneId = (typeof SCENES)[number]["id"];

/* ── Helpers ──────────────────────────────────────────── */

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.6 },
};

const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay } },
});

const slideLeft = (delay = 0) => ({
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, delay } },
});

const slideRight = (delay = 0) => ({
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, delay } },
});

/* ── Simulated sidebar ────────────────────────────────── */

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Users, label: "Contacts" },
  { icon: Megaphone, label: "Campaigns" },
  { icon: FileText, label: "Templates" },
  { icon: MessageSquare, label: "Communications" },
  { icon: Zap, label: "Automations" },
  { icon: Settings, label: "Settings" },
  { icon: Wallet, label: "Billing" },
];

function MockSidebar({ active }: { active: string }) {
  return (
    <motion.div
      {...slideRight()}
      className="flex w-56 shrink-0 flex-col border-r border-border/60 bg-[hsl(var(--sidebar-background))]"
    >
      <div className="flex h-14 items-center gap-2 border-b border-border/40 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <MessageCircle className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground">In-Sync</span>
      </div>
      <div className="border-b border-border/40 px-4 py-2">
        <div className="rounded-md bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          Acme Corp
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navItems.map((item) => {
          const isActive = item.label === active;
          return (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-border/40 px-4 py-3">
        <p className="truncate text-[10px] text-muted-foreground">admin@acmecorp.com</p>
      </div>
    </motion.div>
  );
}

/* ── KPI Card ─────────────────────────────────────────── */

function KpiCard({
  label, value, change, color, icon: Icon, delay,
}: {
  label: string; value: string; change: string; color: string; icon: any; delay: number;
}) {
  return (
    <motion.div {...slideUp(delay)} className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-4">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <AnimatedValue value={value} delay={delay + 0.3} />
        </div>
        <div className="rounded-lg bg-muted/50 p-1.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: delay + 0.8 } }}
        className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600"
      >
        <TrendingUp className="h-3 w-3" /> {change}
      </motion.div>
    </motion.div>
  );
}

function AnimatedValue({ value, delay }: { value: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);
  return <p className="mt-1 text-2xl font-bold text-foreground">{show ? value : "—"}</p>;
}

/* ── Animated bar chart ───────────────────────────────── */

function MiniBarChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = [
    { sent: 85, delivered: 78, read: 52 },
    { sent: 70, delivered: 65, read: 40 },
    { sent: 95, delivered: 90, read: 68 },
    { sent: 60, delivered: 55, read: 35 },
    { sent: 110, delivered: 100, read: 80 },
    { sent: 45, delivered: 42, read: 28 },
    { sent: 80, delivered: 75, read: 55 },
  ];
  const max = 110;
  return (
    <motion.div {...slideUp(0.6)} className="overflow-hidden rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Campaign Performance</p>
        <div className="flex gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> Sent</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Delivered</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /> Read</span>
        </div>
      </div>
      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-px">
            <div className="flex w-full items-end gap-px" style={{ height: 80 }}>
              {[
                { val: d.sent, color: "bg-sky-500" },
                { val: d.delivered, color: "bg-emerald-500" },
                { val: d.read, color: "bg-violet-500" },
              ].map((bar, j) => (
                <motion.div
                  key={j}
                  className={`flex-1 rounded-t ${bar.color}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${(bar.val / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: 1.0 + i * 0.1 + j * 0.05, ease: "easeOut" }}
                />
              ))}
            </div>
            <span className="mt-1 text-[9px] text-muted-foreground">{days[i]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── AI Insights widget (prominent) ───────────────────── */

function AiInsights() {
  const [text, setText] = useState("");
  const full =
    "📊 Campaign delivery up 12% this week — weekend sends outperform weekdays by 3x\n\n🎯 340 contacts dormant 30+ days — I recommend a re-engagement drip sequence\n\n⏰ Read rates peak 10 AM–12 PM IST — schedule your next campaign in this window for maximum impact";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= full.length) { setText(full.slice(0, i)); i++; }
      else clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div {...slideUp(1.0)} className="overflow-hidden rounded-xl border-2 border-primary/30 bg-primary/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-xs font-bold text-primary">AI-Powered Insights</span>
            <p className="text-[9px] text-muted-foreground">Automatically generated from your campaign data</p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-semibold text-primary">
          Live
        </span>
      </div>
      <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/80">
        {text}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-1 h-3 bg-primary ml-0.5 align-middle"
        />
      </p>
    </motion.div>
  );
}

/* ── Scene: Dashboard (AI Analytics focus) ────────────── */

function SceneDashboard() {
  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Dashboard" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
            <p className="text-xs text-muted-foreground">Your WhatsApp campaign command centre</p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary"
          >
            <Sparkles className="h-3 w-3" /> AI-Enhanced Analytics
          </motion.div>
        </motion.div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          <KpiCard label="Messages Sent MTD" value="2,847" change="+18% vs last month" color="from-sky-500 to-blue-600" icon={Send} delay={0.15} />
          <KpiCard label="Delivery Rate" value="96.3%" change="+2.1% vs last month" color="from-emerald-500 to-green-600" icon={CheckCheck} delay={0.25} />
          <KpiCard label="Read Rate" value="72.8%" change="+5.4% vs last month" color="from-violet-500 to-purple-600" icon={Eye} delay={0.35} />
          <KpiCard label="Total Contacts" value="1,204" change="+86 this month" color="from-amber-500 to-orange-600" icon={Users} delay={0.45} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <MiniBarChart />
          </div>
          {/* AI Insights takes the right column */}
          <AiInsights />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Campaigns (billing clarity) ───────────────── */

function SceneCampaigns() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3500),
      setTimeout(() => setStep(3), 5500),
      setTimeout(() => setStep(4), 8000),
      setTimeout(() => setStep(5), 10000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Campaigns" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)}>
          <h2 className="text-xl font-bold text-foreground">New Campaign</h2>
          <p className="text-xs text-muted-foreground">Create and launch — completely self-serve</p>
        </motion.div>

        <div className="mt-4 flex gap-4">
          <div className="flex-1 space-y-3">
            {/* Campaign name */}
            <motion.div {...slideUp(0.2)} className="rounded-xl border border-border/60 bg-card p-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Campaign Name</p>
              <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                <TypewriterText text="March Promo — 20% Off" delay={0.4} speed={40} />
              </div>
            </motion.div>

            {/* Template */}
            <motion.div {...slideUp(0.3)} className="rounded-xl border border-border/60 bg-card p-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Template</p>
              <AnimatePresence>
                {step >= 1 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">promo_offer_march</span>
                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium text-emerald-700">Marketing · ₹1.00/msg</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* CSV */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contact List</p>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">contacts_march.csv</span>
                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium text-emerald-700">✓ 847 valid</span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-medium text-red-700">⚠ 3 skipped</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Variables */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Map Variables</p>
                  <div className="space-y-2">
                    {[{ var: "{{1}}", col: "name" }, { var: "{{2}}", col: "discount_code" }].map((m) => (
                      <div key={m.var} className="flex items-center gap-2 text-sm">
                        <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">{m.var}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="rounded-lg border border-border bg-background px-3 py-1 text-xs">{m.col}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Launch bar — with transparent billing */}
            <AnimatePresence>
              {step >= 4 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground"><strong className="text-foreground">847</strong> recipients</span>
                        <span className="text-muted-foreground">Rate: <strong className="text-foreground">₹1.00</strong>/msg</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <IndianRupee className="h-3 w-3" /> Est. cost: ₹847.00
                        </span>
                        <span className="text-muted-foreground">Wallet: <strong className="text-emerald-600">₹2,340</strong></span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium text-emerald-700">✓ Sufficient balance</span>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
                    >
                      <Rocket className="h-3.5 w-3.5" /> Launch Campaign
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress */}
            <AnimatePresence>
              {step >= 5 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sending...</span>
                    <span className="font-medium text-foreground">423 / 847 · ₹423 spent</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div className="h-full rounded-full bg-primary" initial={{ width: "0%" }}
                      animate={{ width: "50%" }} transition={{ duration: 2.5, ease: "easeOut" }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: WhatsApp preview */}
          <motion.div {...slideLeft(0.4)} className="w-52 shrink-0">
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Message Preview</p>
              <div className="rounded-lg bg-[#e5ddd5] p-2.5">
                <div className="rounded-lg rounded-tl-none bg-white p-2 shadow-sm">
                  <div className="mb-1.5 aspect-video overflow-hidden rounded bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
                    <span className="text-[8px] text-primary font-medium">Promo Banner</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-gray-900">
                    Hi <strong>Amit</strong>! 🎉{"\n\n"}
                    Get <strong>20% OFF</strong> this March!{"\n\n"}
                    Code: <strong>MARCH20</strong>{"\n"}
                    Valid till 31st March.
                  </p>
                  <p className="mt-1 text-right text-[8px] text-gray-400">10:30 AM</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Communications (AI Auto-Reply focus) ──────── */

const chatMessages: { dir: string; text: string; time: string; status?: string; isAi?: boolean }[] = [
  { dir: "out", text: "Hi Amit! 🎉\n\nGet 20% OFF on all services this March!\n\nUse code: MARCH20", time: "10:30 AM", status: "read" },
  { dir: "in", text: "Hey! That sounds great. What services does this cover?", time: "10:32 AM" },
  { dir: "out", text: "It covers all our premium plans — Marketing, Analytics, and Enterprise tiers. The discount applies to upgrades too! Want me to send the brochure?", time: "10:32 AM", status: "delivered", isAi: true },
  { dir: "in", text: "Yes please! Can I also get a custom quote for my team of 15?", time: "10:35 AM" },
  { dir: "out", text: "Of course! I'll prepare a custom quote for 15 users and share it within the hour. Anything else I can help with? 🚀", time: "10:35 AM", status: "sent", isAi: true },
];

function SceneCommunications() {
  const [visibleMsgs, setVisibleMsgs] = useState(0);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Msg 1 (campaign outbound)
    timers.push(setTimeout(() => setVisibleMsgs(1), 1000));
    // Msg 2 (customer replies)
    timers.push(setTimeout(() => setVisibleMsgs(2), 3000));
    // AI typing indicator
    timers.push(setTimeout(() => setShowTyping(true), 4500));
    // Msg 3 (AI auto-reply)
    timers.push(setTimeout(() => { setShowTyping(false); setVisibleMsgs(3); }, 6000));
    // Msg 4 (customer)
    timers.push(setTimeout(() => setVisibleMsgs(4), 8500));
    // AI typing
    timers.push(setTimeout(() => setShowTyping(true), 10000));
    // Msg 5 (AI auto-reply)
    timers.push(setTimeout(() => { setShowTyping(false); setVisibleMsgs(5); }, 11500));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Communications" />
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <motion.div {...slideRight(0.1)} className="w-48 shrink-0 border-r border-border/60 bg-card">
          <div className="border-b border-border/40 p-2.5">
            <div className="rounded-lg border border-border bg-background px-3 py-1.5 text-[10px] text-muted-foreground">
              Search conversations...
            </div>
          </div>
          <div className="space-y-0.5 p-2">
            {[
              { name: "Amit Sharma", msg: "Yes please! Can I also...", unread: 0, active: true, ai: true },
              { name: "Priya Patel", msg: "Thanks for the update!", unread: 2, active: false, ai: true },
              { name: "Raj Kumar", msg: "When is the next campaign?", unread: 1, active: false, ai: false },
              { name: "Sneha Iyer", msg: "Got it, will check.", unread: 0, active: false, ai: true },
            ].map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.2 + i * 0.1 } }}
                className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${c.active ? "bg-accent" : ""}`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-3 w-3 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-[10px] font-medium text-foreground">{c.name}</p>
                    {c.unread > 0 && (
                      <span className="flex h-4 min-w-[14px] items-center justify-center rounded-full bg-primary px-1 text-[7px] font-bold text-primary-foreground">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="truncate text-[8px] text-muted-foreground">{c.msg}</p>
                    {c.ai && <Bot className="h-2.5 w-2.5 shrink-0 text-primary" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <motion.div {...slideUp(0.15)} className="flex items-center justify-between border-b border-border/60 px-4 py-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Amit Sharma</p>
                <p className="text-[10px] text-muted-foreground">+91 97XX XXX 680</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                <Clock className="h-3 w-3" /> 22h 15m left
              </span>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
                <Bot className="h-3.5 w-3.5 text-primary" />
                <div className="h-4 w-7 rounded-full bg-primary relative">
                  <div className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-primary-foreground" />
                </div>
                <span className="text-[10px] font-semibold text-primary">AI ON</span>
              </div>
            </div>
          </motion.div>

          {/* Messages */}
          <div className="flex-1 space-y-2 overflow-hidden bg-muted/30 p-3">
            <AnimatePresence>
              {chatMessages.slice(0, visibleMsgs).map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.dir === "out" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[65%]">
                    {/* AI badge for auto-replies */}
                    {msg.isAi && (
                      <div className="mb-0.5 flex items-center justify-end gap-1 text-[8px] font-semibold text-primary">
                        <Bot className="h-2.5 w-2.5" /> AI Auto-Reply
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-3 py-2 shadow-sm ${
                        msg.dir === "out"
                          ? msg.isAi
                            ? "rounded-tr-none bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ring-1 ring-primary/30"
                            : "rounded-tr-none bg-primary text-primary-foreground"
                          : "rounded-tl-none border border-border bg-background text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-[11px] leading-relaxed">{msg.text}</p>
                      <div className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                        msg.dir === "out" ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}>
                        {msg.time}
                        {msg.dir === "out" && msg.status === "read" && <CheckCheck className="h-3 w-3 text-sky-300" />}
                        {msg.dir === "out" && msg.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                        {msg.dir === "out" && msg.status === "sent" && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* AI typing indicator */}
            <AnimatePresence>
              {showTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-end"
                >
                  <div className="flex items-center gap-2 rounded-lg rounded-tr-none bg-primary/10 px-3 py-2">
                    <Bot className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-medium text-primary">AI is composing</span>
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-primary"
                    >
                      ···
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Composer */}
          <motion.div {...slideUp(0.3)} className="flex items-center gap-2 border-t border-border/60 bg-card px-4 py-2.5">
            <div className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[10px] text-muted-foreground">
              AI is handling this conversation...
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
              <Send className="h-3 w-3 text-primary" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Billing (transparent self-serve) ──────────── */

function SceneBilling() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3500),
      setTimeout(() => setStep(3), 6000),
      setTimeout(() => setStep(4), 8500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Billing" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Billing</h2>
            <p className="text-xs text-muted-foreground">Transparent pricing, self-serve top-ups — no surprises</p>
          </div>
        </motion.div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {/* Wallet balance */}
          <motion.div {...slideUp(0.2)} className="col-span-1 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">Wallet Balance</span>
            </div>
            <AnimatedValue value="₹2,340.00" delay={0.5} />
            <div className="mt-3 space-y-1 text-[10px] text-muted-foreground">
              <div className="flex justify-between"><span>Total credited</span><span className="text-foreground font-medium">₹5,100.00</span></div>
              <div className="flex justify-between"><span>Total spent</span><span className="text-foreground font-medium">₹2,760.00</span></div>
            </div>
            <AnimatePresence>
              {step >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                >
                  <CreditCard className="h-3.5 w-3.5" /> Add Funds via Razorpay
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Pricing table */}
          <motion.div {...slideUp(0.35)} className="col-span-2 rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Transparent Per-Message Pricing</span>
              </div>
              <span className="text-[9px] text-muted-foreground">+ 18% GST</span>
            </div>
            <div className="space-y-2">
              {[
                { type: "Marketing", rate: "₹1.00", color: "bg-emerald-500", desc: "Promotions, offers, announcements" },
                { type: "Utility", rate: "₹0.20", color: "bg-sky-500", desc: "Order updates, reminders, alerts" },
                { type: "Authentication", rate: "₹0.20", color: "bg-violet-500", desc: "OTPs, verification codes" },
              ].map((p, i) => (
                <motion.div
                  key={p.type}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.5 + i * 0.15 } }}
                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-background p-3"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{p.type}</p>
                    <p className="text-[9px] text-muted-foreground">{p.desc}</p>
                  </div>
                  <span className="text-lg font-bold text-foreground">{p.rate}<span className="text-[10px] font-normal text-muted-foreground">/msg</span></span>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.95 } }}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-background p-3"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Platform Fee</p>
                  <p className="text-[9px] text-muted-foreground">Monthly access, analytics, AI features</p>
                </div>
                <span className="text-lg font-bold text-foreground">₹1,500<span className="text-[10px] font-normal text-muted-foreground">/mo</span></span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Recent transactions */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-border/60 bg-card p-4"
            >
              <p className="mb-3 text-xs font-semibold text-foreground">Recent Transactions</p>
              <div className="space-y-1.5">
                {[
                  { desc: "Wallet top-up via Razorpay", amount: "+₹2,000.00", type: "credit", time: "2 hours ago" },
                  { desc: "Campaign: March Promo — 847 msgs", amount: "-₹847.00", type: "debit", time: "3 hours ago" },
                  { desc: "Welcome bonus — free test balance", amount: "+₹100.00", type: "credit", time: "2 days ago" },
                  { desc: "Campaign: Feb Newsletter — 523 msgs", amount: "-₹523.00", type: "debit", time: "5 days ago" },
                ].map((tx, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: i * 0.2 } }}
                    className="flex items-center justify-between rounded-lg bg-background px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${tx.type === "credit" ? "bg-emerald-500" : "bg-red-400"}`} />
                      <span className="text-[11px] text-foreground">{tx.desc}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground">{tx.time}</span>
                      <span className={`text-xs font-semibold ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>{tx.amount}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Typewriter ───────────────────────────────────────── */

function TypewriterText({ text, delay = 0, speed = 30 }: { text: string; delay?: number; speed?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) { setShown(text.slice(0, i)); i++; } else clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [text, delay, speed]);
  return <>{shown}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle" /></>;
}

/* ── Scene: Intro ─────────────────────────────────────── */

function SceneIntro() {
  return (
    <motion.div {...fade} className="flex h-full flex-col items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-emerald-500/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-2xl shadow-primary/30"
      >
        <MessageCircle className="h-12 w-12 text-primary-foreground" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative text-5xl font-extrabold tracking-tight text-foreground"
      >
        In-Sync
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative mt-3 text-lg text-muted-foreground"
      >
        AI-Powered, Self-Serve WhatsApp Platform
      </motion.p>

      {/* Three pillars */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="relative mt-8 flex items-center gap-6"
      >
        {[
          { icon: Sparkles, label: "AI-Powered" },
          { icon: IndianRupee, label: "Transparent Billing" },
          { icon: Rocket, label: "100% Self-Serve" },
        ].map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 + i * 0.2 }}
            className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
          >
            <p.icon className="h-3 w-3" /> {p.label}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ── Scene: Outro ─────────────────────────────────────── */

function SceneOutro() {
  return (
    <motion.div {...fade} className="flex h-full flex-col items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative text-4xl font-extrabold tracking-tight text-foreground"
      >
        Everything you need. Zero friction.
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative mt-8 grid grid-cols-3 gap-6"
      >
        {[
          { icon: Sparkles, title: "AI-Powered", desc: "Auto-replies to customers, AI-generated campaign insights & analytics" },
          { icon: IndianRupee, title: "Transparent Billing", desc: "Per-message pricing, real-time wallet, self-serve top-ups via Razorpay" },
          { icon: UserPlus, title: "100% Self-Serve", desc: "Create org, onboard, import contacts, launch campaigns — no human needed" },
        ].map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.2 }}
            className="relative rounded-xl border border-border/60 bg-card p-5 text-center"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <p.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">{p.title}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{p.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className="relative mt-8"
      >
        <Button size="lg" className="text-base px-8 shadow-xl shadow-primary/25" asChild>
          <Link to="/login?signup=true">
            Start Free — ₹100 Balance <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Demo Page ───────────────────────────────────── */

export default function Demo() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const currentScene = SCENES[sceneIndex];

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (sceneIndex < SCENES.length - 1) {
        setSceneIndex((i) => i + 1);
      } else {
        setPlaying(false);
      }
    }, currentScene.duration);
    return () => clearTimeout(timer);
  }, [sceneIndex, playing, currentScene.duration]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => { setElapsed((e) => e + 100); }, 100);
    return () => clearInterval(interval);
  }, [playing]);

  useEffect(() => { setElapsed(0); }, [sceneIndex]);

  const totalElapsed = SCENES.slice(0, sceneIndex).reduce((s, sc) => s + sc.duration, 0) + elapsed;
  const progress = Math.min((totalElapsed / TOTAL) * 100, 100);

  const restart = useCallback(() => {
    setSceneIndex(0);
    setElapsed(0);
    setPlaying(true);
  }, []);

  const renderScene = () => {
    switch (currentScene.id) {
      case "intro": return <SceneIntro />;
      case "dashboard": return <SceneDashboard />;
      case "campaigns": return <SceneCampaigns />;
      case "communications": return <SceneCommunications />;
      case "billing": return <SceneBilling />;
      case "outro": return <SceneOutro />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black px-4 py-2">
        <Link to="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80">
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium">In-Sync Demo</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="mr-4 hidden items-center gap-1 sm:flex">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setSceneIndex(i); setElapsed(0); setPlaying(true); }}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  i === sceneIndex
                    ? "bg-primary text-primary-foreground"
                    : i < sceneIndex
                    ? "bg-white/20 text-white/60"
                    : "bg-white/5 text-white/30"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPlaying(!playing)}
            className="rounded-lg bg-white/10 p-1.5 text-white/60 hover:bg-white/20 hover:text-white"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={restart} className="rounded-lg bg-white/10 p-1.5 text-white/60 hover:bg-white/20 hover:text-white">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
      </div>

      {/* Scene viewport */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div key={currentScene.id} className="h-full">
              {renderScene()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
