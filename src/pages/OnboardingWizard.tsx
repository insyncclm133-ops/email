import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Building2,
  MessageCircle,
  Users,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Check,
  SkipForward,
  Upload,
  Plus,
  X,
  Smartphone,
  Facebook,
  Image,
} from "lucide-react";

const INDUSTRIES = [
  "Technology", "Healthcare", "Education", "Retail", "Finance",
  "Real Estate", "Food & Beverage", "Travel", "Manufacturing", "Other",
];

type SetupPath = null | "default" | "facebook";

const getSteps = (setupPath: SetupPath) => {
  const base = [
    { title: "Business Profile", icon: Building2, description: "Tell us about your business" },
    { title: "Connect WhatsApp", icon: MessageCircle, description: "Choose how to set up WhatsApp" },
  ];

  if (setupPath === "default") {
    base.push({ title: "Add Numbers", icon: Smartphone, description: "Add your WhatsApp numbers" });
  } else if (setupPath === "facebook") {
    base.push({ title: "Facebook Setup", icon: Facebook, description: "Connect your Meta account" });
  } else {
    base.push({ title: "Setup", icon: Smartphone, description: "Configure WhatsApp" });
  }

  base.push(
    { title: "Invite Team", icon: Users, description: "Add team members" },
    { title: "Launch", icon: Rocket, description: "You're all set!" },
  );

  return base;
};

export default function OnboardingWizard() {
  const { user } = useAuth();
  const { currentOrg, refreshOrgs } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Business profile
  const [orgName, setOrgName] = useState(currentOrg?.name ?? "");
  const [website, setWebsite] = useState(currentOrg?.website ?? "");
  const [industry, setIndustry] = useState(currentOrg?.industry ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentOrg?.logo_url ?? null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Step 2: Setup path
  const [setupPath, setSetupPath] = useState<SetupPath>(null);

  // Step 3A: Phone numbers (default setup)
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([""]);

  // Step 3B: Facebook setup
  const [fbConnecting, setFbConnecting] = useState(false);
  const [fbConnected, setFbConnected] = useState(false);

  // Step 4: Invite team
  const [inviteEmail, setInviteEmail] = useState("");

  if (!user || !currentOrg) {
    navigate("/login");
    return null;
  }

  const STEPS = getSteps(setupPath);

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  // ── Logo handling ──
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Logo must be under 2MB." });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoPreview;
    setUploadingLogo(true);
    const ext = logoFile.name.split(".").pop();
    const path = `${currentOrg.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("org-logos").upload(path, logoFile, { upsert: true });
    setUploadingLogo(false);
    if (error) {
      toast({ variant: "destructive", title: "Logo upload failed", description: error.message });
      return null;
    }
    const { data: urlData } = supabase.storage.from("org-logos").getPublicUrl(path);
    return urlData.publicUrl;
  };

  // ── Step 1: Save business profile ──
  const handleSaveProfile = async () => {
    if (!orgName.trim()) {
      toast({ variant: "destructive", title: "Validation", description: "Organization name is required." });
      return;
    }
    setLoading(true);
    try {
      let logoUrl = currentOrg.logo_url;
      if (logoFile) {
        logoUrl = await uploadLogo();
        if (!logoUrl) { setLoading(false); return; }
      }
      await supabase.functions.invoke("manage-org", {
        body: { action: "update", org_id: currentOrg.id, name: orgName, website, industry, logo_url: logoUrl },
      });
      toast({ title: "Profile saved" });
      handleNext();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoading(false);
  };

  // ── Step 2: Choose setup path ──
  const handleChooseSetup = (path: SetupPath) => {
    setSetupPath(path);
    handleNext();
  };

  // ── Step 3A: Save phone numbers (default) ──
  const addPhoneField = () => {
    if (phoneNumbers.length < 4) {
      setPhoneNumbers([...phoneNumbers, ""]);
    }
  };

  const removePhoneField = (index: number) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
    }
  };

  const updatePhone = (index: number, value: string) => {
    const updated = [...phoneNumbers];
    updated[index] = value;
    setPhoneNumbers(updated);
  };

  const handleSaveNumbers = async () => {
    const validNumbers = phoneNumbers.map((n) => n.trim()).filter(Boolean);
    if (validNumbers.length === 0) {
      toast({ variant: "destructive", title: "Validation", description: "Add at least one phone number." });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-onboarding", {
        body: { action: "save_numbers", org_id: currentOrg.id, phone_numbers: validNumbers },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Phone numbers saved" });
      handleNext();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoading(false);
  };

  // ── Step 3B: Facebook connect ──
  const handleFacebookConnect = async () => {
    setFbConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-onboarding", {
        body: { action: "generate_link", org_id: currentOrg.id },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ variant: "destructive", title: "Error", description: data.error });
        setFbConnecting(false);
        return;
      }

      // Extract the onboarding URL from Exotel's response
      const onboardingUrl = data?.data?.response?.whatsapp?.isv?.data?.url || data?.data?.url;
      if (onboardingUrl) {
        // Open in a new window
        const popup = window.open(onboardingUrl, "whatsapp_onboarding", "width=800,height=700,scrollbars=yes");

        // Poll for popup close
        const pollTimer = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(pollTimer);
            // Save facebook setup type
            await supabase.functions.invoke("whatsapp-onboarding", {
              body: { action: "save_facebook", org_id: currentOrg.id },
            });
            setFbConnected(true);
            setFbConnecting(false);
            toast({ title: "Facebook setup initiated", description: "Your WhatsApp number will be activated shortly." });
          }
        }, 1000);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not generate onboarding link. Please try again." });
        setFbConnecting(false);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
      setFbConnecting(false);
    }
  };

  // ── Step 4: Invite team ──
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
          role: "member",
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

  // ── Step 5: Complete ──
  const handleComplete = async () => {
    setLoading(true);
    try {
      await supabase.functions.invoke("manage-org", {
        body: { action: "complete_onboarding", org_id: currentOrg.id },
      });
      await refreshOrgs();
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
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

  const inviteStepIndex = STEPS.length - 2;
  const launchStepIndex = STEPS.length - 1;

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
              {/* ══════ Step 1: Business Profile ══════ */}
              {step === 0 && (
                <div className="space-y-4">
                  {/* Logo upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted overflow-hidden"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <Image className="h-6 w-6" />
                          <span className="text-[10px]">Add Logo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleLogoSelect}
                    />
                    <p className="text-xs text-muted-foreground">PNG, JPG or WebP, max 2MB</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Organization Name *</Label>
                    <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://acme.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button onClick={handleSaveProfile} disabled={loading || uploadingLogo} className="gap-2">
                      {loading ? "Saving..." : <>Save & Continue <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  </div>
                </div>
              )}

              {/* ══════ Step 2: Choose Setup Path ══════ */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    How would you like to set up WhatsApp for your business?
                  </p>
                  <div className="grid gap-3">
                    <button
                      onClick={() => handleChooseSetup("default")}
                      className="group flex items-start gap-4 rounded-lg border-2 border-muted p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Default Setup</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Quickest way to get started. Add your WhatsApp phone numbers and start sending messages right away.
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleChooseSetup("facebook")}
                      className="group flex items-start gap-4 rounded-lg border-2 border-muted p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-500/5"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                        <Facebook className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Connect with Facebook</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Already have a Meta Business account? Connect it to use your own WhatsApp Business API with full control.
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-start pt-2">
                    <Button variant="outline" onClick={handleBack} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                  </div>
                </div>
              )}

              {/* ══════ Step 3A: Add Phone Numbers (Default) ══════ */}
              {step === 2 && setupPath === "default" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add up to 4 WhatsApp phone numbers for your business. Include the country code.
                  </p>

                  <div className="space-y-3">
                    {phoneNumbers.map((num, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {i + 1}
                        </div>
                        <Input
                          value={num}
                          onChange={(e) => updatePhone(i, e.target.value)}
                          placeholder="+91 98765 43210"
                          className="flex-1"
                        />
                        {phoneNumbers.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removePhoneField(i)} className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {phoneNumbers.length < 4 && (
                    <Button variant="outline" size="sm" onClick={addPhoneField} className="gap-2">
                      <Plus className="h-3 w-3" /> Add another number
                    </Button>
                  )}

                  <div className="flex justify-between gap-2 pt-4">
                    <Button variant="outline" onClick={handleBack} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button onClick={handleSaveNumbers} disabled={loading} className="gap-2">
                      {loading ? "Saving..." : <>Save & Continue <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  </div>
                </div>
              )}

              {/* ══════ Step 3B: Facebook Setup ══════ */}
              {step === 2 && setupPath === "facebook" && (
                <div className="space-y-5">
                  {!fbConnected ? (
                    <>
                      <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4">
                        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400">What happens next?</h4>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <li>1. A new window will open for Meta Business signup</li>
                          <li>2. Log in with your Facebook account</li>
                          <li>3. Create or select your WhatsApp Business Account</li>
                          <li>4. Register your phone number</li>
                        </ul>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          onClick={handleFacebookConnect}
                          disabled={fbConnecting}
                          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6"
                          size="lg"
                        >
                          <Facebook className="h-5 w-5" />
                          {fbConnecting ? "Connecting..." : "Connect with Facebook"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                        <Check className="h-8 w-8 text-green-500" />
                      </div>
                      <h4 className="font-semibold text-green-700 dark:text-green-400">Facebook Connected</h4>
                      <p className="text-sm text-muted-foreground text-center">
                        Your Meta Business account has been linked. Your WhatsApp number will be activated shortly.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between gap-2 pt-2">
                    <Button variant="outline" onClick={handleBack} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                      {!fbConnected && (
                        <Button variant="ghost" onClick={handleNext} className="gap-2">
                          <SkipForward className="h-4 w-4" /> Skip for now
                        </Button>
                      )}
                      {fbConnected && (
                        <Button onClick={handleNext} className="gap-2">
                          Continue <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════ Step 4: Invite Team ══════ */}
              {step === inviteStepIndex && (
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

              {/* ══════ Step 5: Launch ══════ */}
              {step === launchStepIndex && (
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
                      Your organization is ready. Head to the dashboard to create your first campaign.
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
