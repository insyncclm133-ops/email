import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Building2,
  Users,
  MessageCircle,
  Megaphone,
  ArrowRight,
  ArrowLeft,
  Check,
  SkipForward,
  Rocket,
} from "lucide-react";

const STEPS = [
  { title: "Org Profile", icon: Building2, description: "Tell us about your organization" },
  { title: "Invite Team", icon: Users, description: "Add team members" },
  { title: "Connect WhatsApp", icon: MessageCircle, description: "Set up your Exotel credentials" },
  { title: "First Campaign", icon: Megaphone, description: "Ready to send!" },
];

export default function OnboardingWizard() {
  const { user } = useAuth();
  const { currentOrg, refreshOrgs } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Org profile
  const [orgName, setOrgName] = useState(currentOrg?.name ?? "");
  const [website, setWebsite] = useState(currentOrg?.website ?? "");

  // Step 2: Invite team
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  // Step 3: Exotel creds
  const [exotelKey, setExotelKey] = useState("");
  const [exotelToken, setExotelToken] = useState("");
  const [exotelSubdomain, setExotelSubdomain] = useState("");
  const [exotelAccountSid, setExotelAccountSid] = useState("");
  const [exotelSender, setExotelSender] = useState("");

  if (!user || !currentOrg) {
    navigate("/login");
    return null;
  }

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await supabase.functions.invoke("manage-org", {
        body: { action: "update", org_id: currentOrg.id, name: orgName, website },
      });
      toast({ title: "Profile saved" });
      handleNext();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      handleNext();
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "create",
          org_id: currentOrg.id,
          email: inviteEmail,
          password: Math.random().toString(36).slice(-10) + "A1!",
          role: inviteRole,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Team member invited" });
      setInviteEmail("");
      handleNext();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoading(false);
  };

  const handleSaveCreds = async () => {
    if (!exotelKey || !exotelToken) {
      handleNext();
      return;
    }
    setLoading(true);
    try {
      await supabase.functions.invoke("manage-org", {
        body: {
          action: "update_credentials",
          org_id: currentOrg.id,
          exotel_api_key: exotelKey,
          exotel_api_token: exotelToken,
          exotel_subdomain: exotelSubdomain,
          exotel_account_sid: exotelAccountSid,
          exotel_sender_number: exotelSender,
        },
      });
      toast({ title: "Credentials saved" });
      handleNext();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoading(false);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await supabase.functions.invoke("manage-org", {
        body: { action: "complete_onboarding", org_id: currentOrg.id },
      });
      await refreshOrgs();

      // Confetti celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } }), 300);

      toast({ title: "Welcome aboard! Your organization is ready." });
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoading(false);
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Progress stepper */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
              animate={{ scale: i === step ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </motion.div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-lg border-border shadow-xl overflow-hidden">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{STEPS[step].title}</CardTitle>
          <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait" custom={1}>
            <motion.div
              key={step}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Step 1: Org Profile */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://acme.com" />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button onClick={handleSaveProfile} disabled={loading} className="gap-2">
                      {loading ? "Saving..." : <>Save & Continue <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Invite Team */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" type="email" />
                  </div>
                  <p className="text-xs text-muted-foreground">They'll be added as a member. You can change roles later.</p>
                  <div className="flex justify-between gap-2 pt-4">
                    <Button variant="outline" onClick={handleBack} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={handleNext} className="gap-2">
                        <SkipForward className="h-4 w-4" /> Skip
                      </Button>
                      <Button onClick={handleInvite} disabled={loading} className="gap-2">
                        {loading ? "Inviting..." : <>Invite & Continue <ArrowRight className="h-4 w-4" /></>}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Connect WhatsApp */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your Exotel credentials or skip to use platform defaults.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">API Key</Label>
                      <Input value={exotelKey} onChange={(e) => setExotelKey(e.target.value)} placeholder="API key" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">API Token</Label>
                      <Input value={exotelToken} onChange={(e) => setExotelToken(e.target.value)} placeholder="API token" type="password" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Subdomain</Label>
                      <Input value={exotelSubdomain} onChange={(e) => setExotelSubdomain(e.target.value)} placeholder="api.exotel.com" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Account SID</Label>
                      <Input value={exotelAccountSid} onChange={(e) => setExotelAccountSid(e.target.value)} placeholder="Account SID" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Sender Number</Label>
                      <Input value={exotelSender} onChange={(e) => setExotelSender(e.target.value)} placeholder="+91..." />
                    </div>
                  </div>
                  <div className="flex justify-between gap-2 pt-4">
                    <Button variant="outline" onClick={handleBack} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={handleNext} className="gap-2">
                        <SkipForward className="h-4 w-4" /> Skip
                      </Button>
                      <Button onClick={handleSaveCreds} disabled={loading} className="gap-2">
                        {loading ? "Saving..." : <>Save & Continue <ArrowRight className="h-4 w-4" /></>}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Launch */}
              {step === 3 && (
                <div className="space-y-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Rocket className="h-10 w-10 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold">You're all set!</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your organization is ready. Head to the dashboard to create your first campaign, or explore your settings.
                    </p>
                  </div>
                  <div className="flex justify-between gap-2 pt-4">
                    <Button variant="outline" onClick={handleBack} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button onClick={handleComplete} disabled={loading} className="gap-2" size="lg">
                      {loading ? "Completing..." : <>Launch Dashboard <Rocket className="h-4 w-4" /></>}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
