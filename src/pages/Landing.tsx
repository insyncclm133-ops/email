import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Users,
  Megaphone,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Megaphone,
    title: "Campaign Builder",
    description:
      "Create targeted WhatsApp campaigns with personalized templates, media attachments, and scheduled delivery.",
  },
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Import contacts via CSV, organize with tags, and build segmented audiences for precision messaging.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Track delivery, read receipts, and failures with live dashboards and exportable reports.",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    description:
      "Powered by Exotel's WhatsApp Business API for reliable, high-throughput message delivery.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Role-based access, encrypted credentials, and row-level data isolation keep your data safe.",
  },
  {
    icon: MessageCircle,
    title: "Communications Hub",
    description:
      "Monitor every message in real-time with status tracking from sent to delivered to read.",
  },
];

const stats = [
  { value: "99.5%", label: "Delivery Rate" },
  { value: "10K+", label: "Messages / min" },
  { value: "< 1s", label: "Avg. Latency" },
];

const clientLogos = [
  { src: "/logos/quess.png", alt: "Quess Corp" },
  { src: "/logos/motherson.jpg", alt: "Motherson" },
  { src: "/logos/hiranandani.png", alt: "Hiranandani" },
  { src: "/logos/audi.png", alt: "Audi" },
  { src: "/logos/college-dekho.jpg", alt: "College Dekho" },
  { src: "/logos/zolve.webp", alt: "Zolve" },
  { src: "/logos/capital-india.webp", alt: "Capital India" },
  { src: "/logos/ecofy.png", alt: "Ecofy" },
  { src: "/logos/zopper.png", alt: "Zopper" },
  { src: "/logos/alice-blue.png", alt: "Alice Blue" },
  { src: "/logos/ezeepay.png", alt: "Ezeepay" },
  { src: "/logos/incred.png", alt: "InCred" },
  { src: "/logos/seeds.png", alt: "Seeds" },
  { src: "/logos/growthvine.png", alt: "GrowthVine" },
  { src: "/logos/uhc.png", alt: "UHC" },
  { src: "/logos/car-trends.webp", alt: "Car Trends" },
  { src: "/logos/legitquest.png", alt: "LegitQuest" },
  { src: "/logos/evco.jpg", alt: "EV Co" },
  { src: "/logos/bluspring.png", alt: "BluSpring" },
  { src: "/logos/cubit.jpeg", alt: "Cubit" },
  { src: "/logos/smb-connect.jpg", alt: "SMB Connect" },
  { src: "/logos/rb.jpg", alt: "RB" },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              In-Sync
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/login?signup=true">
                Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient orb */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Powered by Exotel WhatsApp Business API
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Launch WhatsApp Campaigns{" "}
              <span className="text-primary">That Convert</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Create your organization, invite your team, and reach
              thousands instantly — all from one powerful multi-tenant dashboard.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="text-base px-8" asChild>
                <Link to="/login?signup=true">
                  Start Sending <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" asChild>
                <a href="#features">See Features</a>
              </Button>
            </div>
          </div>

          {/* Stats ribbon */}
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6 sm:mt-20">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-primary sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by — logo marquee */}
      <section className="border-t border-border bg-card/50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Trusted by 100+ businesses across India
          </p>

          {/* Scrolling marquee — two rows, opposite directions */}
          <div className="space-y-6 overflow-hidden">
            {[0, 1].map((row) => {
              const rowLogos = row === 0
                ? clientLogos.slice(0, Math.ceil(clientLogos.length / 2))
                : clientLogos.slice(Math.ceil(clientLogos.length / 2));
              // Double for seamless loop
              const doubled = [...rowLogos, ...rowLogos];
              return (
                <div key={row} className="relative flex overflow-hidden">
                  <div
                    className={`flex shrink-0 items-center gap-10 ${
                      row === 0 ? "animate-marquee" : "animate-marquee-reverse"
                    }`}
                  >
                    {doubled.map((logo, i) => (
                      <div
                        key={`${row}-${i}`}
                        className="flex h-14 w-28 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background px-3 py-2 grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
                      >
                        <img
                          src={logo.src}
                          alt={logo.alt}
                          className="max-h-full max-w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to run campaigns
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete toolkit for WhatsApp marketing — from contact import to
              delivery analytics.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                  <f.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof numbers */}
      <section className="border-t border-border bg-primary/[0.03]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Powering WhatsApp marketing at scale
            </h2>
            <p className="mt-3 text-muted-foreground">
              Businesses across industries trust In-Sync for their customer communication
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "100+", label: "Active Businesses" },
              { value: "5M+", label: "Messages Delivered" },
              { value: "98%", label: "Avg. Open Rate" },
              { value: "12+", label: "Industries Served" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-primary sm:text-4xl">{value}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Featured logos grid (static, larger) */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {clientLogos.slice(0, 12).map((logo) => (
              <div
                key={logo.alt}
                className="flex h-12 w-24 items-center justify-center grayscale opacity-50 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center sm:px-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(142_70%_55%/0.3),transparent_60%)]" />
            <h2 className="relative text-3xl font-bold text-primary-foreground sm:text-4xl">
              Ready to reach your audience?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Register your organization in seconds and launch your first
              WhatsApp campaign today.
            </p>
            <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-base px-8"
                asChild
              >
                <Link to="/login?signup=true">
                  Register Your Organization <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> Multi-tenant isolation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> Enterprise-grade security
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 text-primary" />
              In-Sync
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} In-Sync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
