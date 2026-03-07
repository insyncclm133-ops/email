import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, org_id } = body;

    if (!org_id) {
      return new Response(JSON.stringify({ error: "org_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is admin of this org
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GENERATE EXOTEL ISV ONBOARDING LINK ──
    if (action === "generate_link") {
      const apiKey = Deno.env.get("EXOTEL_API_KEY")!;
      const apiToken = Deno.env.get("EXOTEL_API_TOKEN")!;
      const subdomain = Deno.env.get("EXOTEL_SUBDOMAIN")!;
      const accountSid = Deno.env.get("EXOTEL_ACCOUNT_SID")!;

      const isvUrl = `https://${subdomain}/v2/accounts/${accountSid}/isv`;
      const auth = `Basic ${btoa(`${apiKey}:${apiToken}`)}`;

      // Get org info for context
      const { data: org } = await supabase
        .from("organizations")
        .select("name, website")
        .eq("id", org_id)
        .single();

      const isvRes = await fetch(isvUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify({
          whatsapp: {
            isv: {
              Url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-onboarding`,
            },
          },
        }),
      });

      const isvText = await isvRes.text();
      console.log("Exotel ISV response:", isvRes.status, isvText);

      let isvData: any;
      try { isvData = JSON.parse(isvText); } catch { isvData = { raw: isvText }; }

      if (!isvRes.ok) {
        return new Response(JSON.stringify({ error: "Failed to generate onboarding link", details: isvData }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, data: isvData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SAVE DEFAULT SETUP (phone numbers) ──
    if (action === "save_numbers") {
      const { phone_numbers } = body;

      if (!phone_numbers || !Array.isArray(phone_numbers) || phone_numbers.length === 0) {
        return new Response(JSON.stringify({ error: "At least one phone number is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (phone_numbers.length > 4) {
        return new Response(JSON.stringify({ error: "Maximum 4 phone numbers allowed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save phone numbers and mark setup type as default
      const { error: credError } = await supabase
        .from("org_credentials")
        .upsert({
          org_id,
          phone_numbers,
          setup_type: "default",
          exotel_sender_number: phone_numbers[0],
          updated_at: new Date().toISOString(),
        }, { onConflict: "org_id" });

      if (credError) {
        return new Response(JSON.stringify({ error: "Failed to save numbers", details: credError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SAVE FACEBOOK SETUP ──
    if (action === "save_facebook") {
      const { error: credError } = await supabase
        .from("org_credentials")
        .upsert({
          org_id,
          setup_type: "facebook",
          updated_at: new Date().toISOString(),
        }, { onConflict: "org_id" });

      if (credError) {
        return new Response(JSON.stringify({ error: "Failed to save setup", details: credError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: generate_link, save_numbers, save_facebook" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
