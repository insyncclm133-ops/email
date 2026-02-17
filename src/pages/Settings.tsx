import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings as SettingsIcon, MessageSquare, Trash2, CheckCircle2, Clock, XCircle, RefreshCw, Loader2 } from "lucide-react";

interface TemplateRow {
  id: string;
  name: string;
  content: string;
  category: string | null;
  language: string | null;
  status: string | null;
  exotel_template_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: string;
  text?: string;
  buttons?: { type: string; text: string; url?: string; phone_number?: string }[];
  example?: { body_text?: string[][] };
}

const statusColors: Record<string, string> = {
  approved: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const defaultForm = {
  name: "",
  category: "MARKETING",
  language: "en",
  headerType: "none" as "none" | "text",
  headerText: "",
  body: "",
  footer: "",
  buttonType: "none" as "none" | "url" | "phone" | "quick_reply",
  buttonText: "",
  buttonValue: "",
  exampleValues: "",
};

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Error fetching templates", description: error.message });
    } else {
      setTemplates((data as unknown as TemplateRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const buildComponents = (): TemplateComponent[] => {
    const components: TemplateComponent[] = [];

    if (form.headerType === "text" && form.headerText.trim()) {
      components.push({ type: "HEADER", format: "TEXT", text: form.headerText });
    }

    const bodyComp: TemplateComponent = { type: "BODY", text: form.body };
    // Parse example values for placeholders
    const placeholders = form.body.match(/\{\{\d+\}\}/g);
    if (placeholders && form.exampleValues.trim()) {
      const examples = form.exampleValues.split(",").map(v => v.trim());
      bodyComp.example = { body_text: [examples] };
    }
    components.push(bodyComp);

    if (form.footer.trim()) {
      components.push({ type: "FOOTER", text: form.footer });
    }

    if (form.buttonType !== "none" && form.buttonText.trim()) {
      const btn: any = { type: form.buttonType === "url" ? "URL" : form.buttonType === "phone" ? "PHONE_NUMBER" : "QUICK_REPLY", text: form.buttonText };
      if (form.buttonType === "url") btn.url = form.buttonValue;
      if (form.buttonType === "phone") btn.phone_number = form.buttonValue;
      components.push({ type: "BUTTONS", buttons: [btn] });
    }

    return components;
  };

  const handleSubmitTemplate = async () => {
    if (!user) return;
    if (!form.name || !form.body) {
      toast({ variant: "destructive", title: "Validation Error", description: "Template name and body are required." });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-templates", {
        body: {
          action: "submit",
          name: form.name,
          category: form.category,
          language: form.language,
          components: buildComponents(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error + (data.details ? `: ${JSON.stringify(data.details)}` : ""));

      toast({ title: "Template submitted", description: "Your template has been sent to WhatsApp for approval. Status: pending." });
      setIsDialogOpen(false);
      setForm({ ...defaultForm });
      fetchTemplates();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Submission failed", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncStatus = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-templates", {
        body: { action: "sync" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Sync complete", description: `Updated ${data.synced} template(s) from Exotel.` });
      fetchTemplates();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync failed", description: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const deleteTemplate = async (id: string, name: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-templates", {
        body: { action: "delete", template_id: id, template_name: name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Template deleted" });
      fetchTemplates();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete failed", description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings & Templates</h1>
        <p className="mt-1 text-muted-foreground">Manage your WhatsApp message templates and API configuration</p>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" /> API Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">WhatsApp Templates</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleSyncStatus} disabled={syncing}>
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Sync Status
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Submit New Template</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit WhatsApp Template</DialogTitle>
                    <DialogDescription>
                      This will submit your template to WhatsApp via Exotel for approval. It starts as "pending".
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Name */}
                    <div className="grid gap-2">
                      <Label htmlFor="tpl-name">Template Name *</Label>
                      <Input id="tpl-name" placeholder="e.g., summer_promotion_01 (lowercase, underscores)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                      <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores only.</p>
                    </div>

                    {/* Category + Language */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Category *</Label>
                        <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MARKETING">Marketing</SelectItem>
                            <SelectItem value="UTILITY">Utility</SelectItem>
                            <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Language *</Label>
                        <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English (en)</SelectItem>
                            <SelectItem value="en_US">English US (en_US)</SelectItem>
                            <SelectItem value="hi">Hindi (hi)</SelectItem>
                            <SelectItem value="es">Spanish (es)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Header */}
                    <div className="grid gap-2">
                      <Label>Header (optional)</Label>
                      <Select value={form.headerType} onValueChange={(v: any) => setForm({ ...form, headerType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Header</SelectItem>
                          <SelectItem value="text">Text Header</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.headerType === "text" && (
                        <Input placeholder="Header text" value={form.headerText} onChange={e => setForm({ ...form, headerText: e.target.value })} />
                      )}
                    </div>

                    {/* Body */}
                    <div className="grid gap-2">
                      <Label>Body *</Label>
                      <Textarea
                        placeholder={"Hello {{1}}, your order {{2}} has been shipped!"}
                        rows={4}
                        value={form.body}
                        onChange={e => setForm({ ...form, body: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {"{{1}}"}, {"{{2}}"}, etc. for placeholders.
                      </p>
                    </div>

                    {/* Example values */}
                    {form.body.match(/\{\{\d+\}\}/) && (
                      <div className="grid gap-2">
                        <Label>Example Values (required for approval)</Label>
                        <Input
                          placeholder="John, ORD-12345 (comma-separated)"
                          value={form.exampleValues}
                          onChange={e => setForm({ ...form, exampleValues: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Provide one example per placeholder, comma-separated.
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="grid gap-2">
                      <Label>Footer (optional)</Label>
                      <Input placeholder="e.g., Reply STOP to unsubscribe" value={form.footer} onChange={e => setForm({ ...form, footer: e.target.value })} />
                    </div>

                    {/* Buttons */}
                    <div className="grid gap-2">
                      <Label>Button (optional)</Label>
                      <Select value={form.buttonType} onValueChange={(v: any) => setForm({ ...form, buttonType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Button</SelectItem>
                          <SelectItem value="url">URL Button</SelectItem>
                          <SelectItem value="phone">Phone Number Button</SelectItem>
                          <SelectItem value="quick_reply">Quick Reply Button</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.buttonType !== "none" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Button label" value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} />
                          {form.buttonType !== "quick_reply" && (
                            <Input
                              placeholder={form.buttonType === "url" ? "https://..." : "+91XXXXXXXXXX"}
                              value={form.buttonValue}
                              onChange={e => setForm({ ...form, buttonValue: e.target.value })}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmitTemplate} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit for Approval
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse border-border bg-card/50">
                  <CardHeader className="h-24 bg-muted/20" />
                  <CardContent className="h-20" />
                </Card>
              ))
            ) : templates.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No templates yet. Submit your first template for WhatsApp approval.</p>
                </CardContent>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="group relative overflow-hidden border-border transition-all hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className={statusColors[template.status || "pending"]}>
                        {template.status === "approved" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {template.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                        {template.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                        {template.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={() => deleteTemplate(template.id, template.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="mt-2 text-base font-bold">{template.name}</CardTitle>
                    <CardDescription className="flex gap-2">
                      <span className="text-xs uppercase">{template.category}</span>
                      <span className="text-xs uppercase">• {template.language}</span>
                      {template.exotel_template_id && (
                        <span className="text-xs text-muted-foreground">• ID: {template.exotel_template_id.slice(0, 8)}…</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                      {template.content}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="config">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                These settings are used to connect to your Exotel WhatsApp Business account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Exotel Subdomain</Label>
                  <Input disabled value="api.exotel.com" className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">Managed in environment secrets.</p>
                </div>
                <div className="space-y-2">
                  <Label>Sender Number (WhatsApp)</Label>
                  <Input disabled value="+91 XXXXX XXXXX" className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">Your verified WhatsApp Business number.</p>
                </div>
              </div>

              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <h4 className="flex items-center gap-2 font-medium text-warning">
                  <SettingsIcon className="h-4 w-4" /> Secure Storage
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your Exotel API Key, Token, and WABA ID are stored securely in Lovable Cloud secrets and are only accessed by backend functions.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button disabled variant="outline">Update Credentials</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
