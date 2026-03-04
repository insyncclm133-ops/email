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

    // Check admin
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch campaign
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (!campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get assigned contacts
    const { data: assignments } = await supabase
      .from("campaign_contacts")
      .select("contact_id, contacts(id, phone_number, name)")
      .eq("campaign_id", campaign_id);

    const contacts = (assignments ?? [])
      .map((a: any) => a.contacts)
      .filter(Boolean);

    if (contacts.length === 0) {
      await supabase.from("campaigns").update({ status: "failed" }).eq("id", campaign_id);
      return new Response(JSON.stringify({ error: "No contacts assigned" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exotel credentials
    const apiKey = Deno.env.get("EXOTEL_API_KEY")!;
    const apiToken = Deno.env.get("EXOTEL_API_TOKEN")!;
    const subdomain = Deno.env.get("EXOTEL_SUBDOMAIN")!;
    const senderNumber = Deno.env.get("EXOTEL_SENDER_NUMBER")!;
    const accountSid = Deno.env.get("EXOTEL_ACCOUNT_SID")!;

    const exotelUrl = `https://${apiKey}:${apiToken}@${subdomain}/v2/accounts/${accountSid}/messages`;

    let successCount = 0;
    let failCount = 0;

    for (const contact of contacts) {
      // Personalize message
      const message = (campaign.template_message || "")
        .replace(/\{\{name\}\}/g, contact.name || "Customer");

      // Create message record
      const { data: msgRecord } = await supabase
        .from("messages")
        .insert({
          campaign_id,
          contact_id: contact.id,
          content: message,
          media_url: campaign.media_url,
          status: "pending",
        })
        .select("id")
        .single();

      try {
        // Build Exotel WhatsApp API payload
        const content: Record<string, unknown> = campaign.media_url
          ? {
              recipient_type: "individual",
              type: "image",
              image: { link: campaign.media_url, caption: message },
            }
          : {
              recipient_type: "individual",
              type: "text",
              text: { preview_url: false, body: message },
            };

        const payload = {
          whatsapp: {
            messages: [
              {
                from: senderNumber,
                to: contact.phone_number,
                content,
              },
            ],
          },
        };

        const exotelResponse = await fetch(exotelUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await exotelResponse.json();
        const msgData = result?.response?.whatsapp?.messages?.[0];

        if (exotelResponse.ok && msgData?.status === "success") {
          await supabase
            .from("messages")
            .update({
              status: "sent",
              exotel_message_id: msgData?.data?.sid || null,
              sent_at: new Date().toISOString(),
            })
            .eq("id", msgRecord!.id);
          successCount++;
        } else {
          await supabase
            .from("messages")
            .update({
              status: "failed",
              error_message: JSON.stringify(result).slice(0, 500),
            })
            .eq("id", msgRecord!.id);
          failCount++;
        }
      } catch (err) {
        await supabase
          .from("messages")
          .update({
            status: "failed",
            error_message: (err as Error).message,
          })
          .eq("id", msgRecord!.id);
        failCount++;
      }
    }

    // Update campaign status
    const finalStatus = failCount === contacts.length ? "failed" : "completed";
    await supabase.from("campaigns").update({ status: finalStatus }).eq("id", campaign_id);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, failed: failCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
