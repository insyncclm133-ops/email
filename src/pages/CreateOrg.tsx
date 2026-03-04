import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, ArrowRight } from "lucide-react";

const INDUSTRIES = [
  "E-Commerce",
  "Education",
  "Healthcare",
  "Finance",
  "Real Estate",
  "Travel & Hospitality",
  "Food & Beverage",
  "Retail",
  "Technology",
  "Other",
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CreateOrg() {
  const { user } = useAuth();
  const { refreshOrgs } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-org", {
        body: { action: "create", name: name.trim(), slug: slug.trim(), industry: industry || null },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error + (data.details ? `: ${data.details}` : ""));

      await refreshOrgs();
      toast({ title: "Organization created!" });
      navigate("/onboarding");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Organization</CardTitle>
          <CardDescription>Set up your workspace to start sending campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name *</Label>
              <Input
                id="org-name"
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">hub/</span>
                <Input
                  id="org-slug"
                  placeholder="acme-corp"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? "Creating..." : <>Create & Continue <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
