import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Building2, MessageCircle, CreditCard, Loader2, Bot, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OrgSettings() {
  const { currentOrg, refreshOrgs } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const ALLOWED_DELETE_EMAILS = ["amina@in-sync.co.in", "a@in-sync.co.in"];
  const canDeleteOrg = user?.email ? ALLOWED_DELETE_EMAILS.includes(user.email.toLowerCase()) : false;

  // Delete org
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  // Profile
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Credentials
  const [creds, setCreds] = useState({
    exotel_api_key: "",
    exotel_api_token: "",
    exotel_subdomain: "",
    exotel_waba_id: "",
    exotel_account_sid: "",
    exotel_sender_number: "",
  });
  const [credsLoading, setCredsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // AI Config
  const [aiConfig, setAiConfig] = useState({
    system_prompt: "You are a helpful customer support agent. Be concise and friendly.",
    knowledge_base: "",
    enabled: true,
  });
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;
    let cancelled = false;
    setName(currentOrg.name);
    setWebsite(currentOrg.website ?? "");
    setIndustry(currentOrg.industry ?? "");

    // Fetch credentials
    supabase.functions
      .invoke("manage-org", { body: { action: "get_credentials", org_id: currentOrg.id } })
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.credentials) {
          const c = data.credentials;
          setCreds({
            exotel_api_key: c.exotel_api_key ?? "",
            exotel_api_token: c.exotel_api_token ?? "",
            exotel_subdomain: c.exotel_subdomain ?? "",
            exotel_waba_id: c.exotel_waba_id ?? "",
            exotel_account_sid: c.exotel_account_sid ?? "",
            exotel_sender_number: c.exotel_sender_number ?? "",
          });
          setIsConfigured(c.is_configured);
        }
      });

    // Fetch AI config
    supabase
      .from("ai_config")
      .select("system_prompt, knowledge_base, enabled")
      .eq("org_id", currentOrg.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setAiConfig({
          system_prompt: data.system_prompt ?? "",
          knowledge_base: data.knowledge_base ?? "",
          enabled: data.enabled ?? true,
        });
      });

    return () => { cancelled = true; };
  }, [currentOrg]);

  const saveProfile = async () => {
    if (!currentOrg) return;
    setProfileLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-org", {
        body: { action: "update", org_id: currentOrg.id, name, website, industry },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await refreshOrgs();
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setProfileLoading(false);
  };

  const saveAiConfig = async () => {
    if (!currentOrg) return;
    setAiLoading(true);
    try {
      const { error } = await supabase
        .from("ai_config")
        .upsert({
          org_id: currentOrg.id,
          system_prompt: aiConfig.system_prompt,
          knowledge_base: aiConfig.knowledge_base,
          enabled: aiConfig.enabled,
          updated_at: new Date().toISOString(),
        }, { onConflict: "org_id" });
      if (error) throw error;
      toast({ title: "AI configuration saved" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setAiLoading(false);
  };

  const saveCreds = async () => {
    if (!currentOrg) return;
    setCredsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-org", {
        body: { action: "update_credentials", org_id: currentOrg.id, ...creds },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setIsConfigured(data.is_configured);
      toast({ title: "Credentials updated" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setCredsLoading(false);
  };

  const deleteOrg = async () => {
    if (!currentOrg || confirmName !== currentOrg.name) return;
    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-org", {
        body: { action: "delete", org_id: currentOrg.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Organization deleted" });
      await refreshOrgs();
      navigate("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setDeleteLoading(false);
    setConfirmName("");
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Organization Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your organization profile and integrations</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> WhatsApp Integration
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" /> AI Auto-Reply
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Billing
          </TabsTrigger>
          {canDeleteOrg && (
            <TabsTrigger value="danger" className="flex items-center gap-2 text-destructive data-[state=active]:text-destructive">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Update your organization's public information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={saveProfile} disabled={profileLoading}>
                  {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Integration (Exotel)</CardTitle>
              <CardDescription>
                {isConfigured
                  ? "Your organization is using custom Exotel credentials."
                  : "Using platform default credentials. Configure your own below."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input value={creds.exotel_api_key} onChange={(e) => setCreds({ ...creds, exotel_api_key: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>API Token</Label>
                  <Input type="password" value={creds.exotel_api_token} onChange={(e) => setCreds({ ...creds, exotel_api_token: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Subdomain</Label>
                  <Input value={creds.exotel_subdomain} onChange={(e) => setCreds({ ...creds, exotel_subdomain: e.target.value })} placeholder="api.exotel.com" />
                </div>
                <div className="space-y-2">
                  <Label>WABA ID</Label>
                  <Input value={creds.exotel_waba_id} onChange={(e) => setCreds({ ...creds, exotel_waba_id: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Account SID</Label>
                  <Input value={creds.exotel_account_sid} onChange={(e) => setCreds({ ...creds, exotel_account_sid: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sender Number</Label>
                  <Input value={creds.exotel_sender_number} onChange={(e) => setCreds({ ...creds, exotel_sender_number: e.target.value })} placeholder="+91..." />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={saveCreds} disabled={credsLoading}>
                  {credsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Credentials
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Auto-Reply</CardTitle>
              <CardDescription>
                Configure AI-powered automatic responses to incoming WhatsApp messages.
                Replies within the 24-hour window are free.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Enable AI Auto-Reply</p>
                  <p className="text-xs text-muted-foreground">
                    When enabled, AI will automatically respond to incoming messages
                  </p>
                </div>
                <Switch
                  checked={aiConfig.enabled}
                  onCheckedChange={(v) => setAiConfig({ ...aiConfig, enabled: v })}
                />
              </div>

              <div className="space-y-2">
                <Label>System Prompt</Label>
                <Textarea
                  value={aiConfig.system_prompt}
                  onChange={(e) => setAiConfig({ ...aiConfig, system_prompt: e.target.value })}
                  placeholder="You are a helpful customer support agent for [Your Business]..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Tell the AI who it is, how to behave, and what tone to use
                </p>
              </div>

              <div className="space-y-2">
                <Label>Knowledge Base</Label>
                <Textarea
                  value={aiConfig.knowledge_base}
                  onChange={(e) => setAiConfig({ ...aiConfig, knowledge_base: e.target.value })}
                  placeholder="Paste your FAQs, product details, pricing, policies, business hours, etc..."
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  The AI will use this information to answer customer questions accurately
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={saveAiConfig} disabled={aiLoading}>
                  {aiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save AI Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Manage your subscription and payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-muted-foreground">
                Billing features coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        {canDeleteOrg && (
          <TabsContent value="danger">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions for this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
                  <div>
                    <p className="text-sm font-medium">Delete this organization</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete <strong>{currentOrg?.name}</strong> and all its data including contacts, campaigns, templates, and messages. This action cannot be undone.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Organization
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <span className="block">
                            This will permanently delete <strong>{currentOrg?.name}</strong> and all associated data including contacts, campaigns, templates, messages, and credentials.
                          </span>
                          <span className="block font-medium text-destructive">This action cannot be undone.</span>
                          <span className="block">
                            Type <strong>{currentOrg?.name}</strong> below to confirm:
                          </span>
                          <Input
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder="Organization name"
                            className="mt-2"
                          />
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConfirmName("")}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteOrg}
                          disabled={confirmName !== currentOrg?.name || deleteLoading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Delete permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
}
