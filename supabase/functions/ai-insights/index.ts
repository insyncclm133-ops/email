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

    // Auth
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

    const { type, org_id, context } = await req.json();
    if (!type || !org_id) {
      return new Response(JSON.stringify({ error: "type and org_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let dataContext = "";
    let systemPrompt = "";

    // ── DASHBOARD INSIGHTS ──
    if (type === "dashboard") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

      const [messagesRes, messagesPrevRes, contactsRes, campaignsRes, walletRes, convosRes] =
        await Promise.all([
          supabase.from("messages").select("status, created_at, campaign_id, direction")
            .eq("org_id", org_id).gte("created_at", monthStart),
          supabase.from("messages").select("status")
            .eq("org_id", org_id).gte("created_at", prevMonthStart).lt("created_at", monthStart),
          supabase.from("contacts").select("id", { count: "exact" }).eq("org_id", org_id),
          supabase.from("campaigns").select("id, name, status, created_at")
            .eq("org_id", org_id).order("created_at", { ascending: false }).limit(10),
          supabase.from("org_wallets").select("balance").eq("org_id", org_id).maybeSingle(),
          supabase.from("conversations").select("id, unread_count, ai_enabled, last_inbound_at")
            .eq("org_id", org_id).eq("status", "open"),
        ]);

      const msgs = messagesRes.data ?? [];
      const prevMsgs = messagesPrevRes.data ?? [];
      const totalContacts = contactsRes.count ?? 0;
      const campaigns = campaignsRes.data ?? [];
      const balance = walletRes.data?.balance ?? 0;
      const convos = convosRes.data ?? [];

      const outbound = msgs.filter((m: any) => m.direction !== "inbound");
      const inbound = msgs.filter((m: any) => m.direction === "inbound");
      const sent = outbound.length;
      const delivered = outbound.filter((m: any) => m.status === "delivered" || m.status === "read").length;
      const read = outbound.filter((m: any) => m.status === "read").length;
      const failed = outbound.filter((m: any) => m.status === "failed").length;
      const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
      const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
      const failRate = sent > 0 ? Math.round((failed / sent) * 100) : 0;

      const prevSent = prevMsgs.length;
      const prevDelivered = prevMsgs.filter((m: any) => m.status === "delivered" || m.status === "read").length;
      const prevDeliveryRate = prevSent > 0 ? Math.round((prevDelivered / prevSent) * 100) : 0;

      // Daily breakdown for last 7 days
      const dailyCounts: Record<string, { sent: number; delivered: number; failed: number }> = {};
      for (const m of outbound) {
        const day = m.created_at.slice(0, 10);
        if (day >= sevenDaysAgo.slice(0, 10)) {
          if (!dailyCounts[day]) dailyCounts[day] = { sent: 0, delivered: 0, failed: 0 };
          dailyCounts[day].sent++;
          if (m.status === "delivered" || m.status === "read") dailyCounts[day].delivered++;
          if (m.status === "failed") dailyCounts[day].failed++;
        }
      }

      const unreadConvos = convos.filter((c: any) => c.unread_count > 0).length;
      const totalUnread = convos.reduce((s: number, c: any) => s + (c.unread_count || 0), 0);
      const aiEnabledCount = convos.filter((c: any) => c.ai_enabled).length;

      // Estimate days of balance remaining
      const avgDailyCost = sent > 0 ? (sent / new Date().getDate()) * 1.18 : 0; // assuming Re 1 avg + GST
      const daysRemaining = avgDailyCost > 0 ? Math.round(balance / avgDailyCost) : null;

      dataContext = `
DASHBOARD DATA (current month):
- Messages sent this month: ${sent} (last month: ${prevSent})
- Delivery rate: ${deliveryRate}% (last month: ${prevDeliveryRate}%)
- Read rate: ${readRate}%
- Failure rate: ${failRate}% (${failed} failed)
- Inbound messages: ${inbound.length}
- Total contacts: ${totalContacts}
- Active campaigns: ${campaigns.filter((c: any) => c.status === "running").length}
- Completed campaigns: ${campaigns.filter((c: any) => c.status === "completed").length}
- Draft campaigns: ${campaigns.filter((c: any) => c.status === "draft").length}
- Wallet balance: ₹${balance}
${daysRemaining !== null ? `- Estimated days of balance remaining: ~${daysRemaining} days` : ""}
- Open conversations: ${convos.length} (${unreadConvos} with unread messages, ${totalUnread} total unread)
- AI auto-reply enabled on: ${aiEnabledCount}/${convos.length} conversations
- Daily breakdown (last 7 days): ${JSON.stringify(dailyCounts)}
`;

      systemPrompt = `You are a WhatsApp marketing analytics assistant. Analyze the dashboard data and provide 3-5 concise, actionable insights. Focus on:
1. Trends (improving/declining metrics vs last month)
2. Anomalies (unusual failure rates, delivery drops)
3. Opportunities (unread conversations, balance warnings, AI adoption)
4. Recommendations (specific, actionable steps)

Be direct and specific with numbers. Use bullet points. Keep total response under 200 words. Do not use emojis.`;
    }

    // ── CAMPAIGN INSIGHTS ──
    else if (type === "campaign") {
      const campaignId = context?.campaign_id;
      if (!campaignId) {
        return new Response(JSON.stringify({ error: "campaign_id required in context" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [campaignRes, messagesRes] = await Promise.all([
        supabase.from("campaigns").select("*").eq("id", campaignId).single(),
        supabase.from("messages").select("status, sent_at, created_at, error_message")
          .eq("campaign_id", campaignId).eq("org_id", org_id),
      ]);

      const campaign = campaignRes.data;
      const msgs = messagesRes.data ?? [];
      if (!campaign) {
        return new Response(JSON.stringify({ error: "Campaign not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const total = msgs.length;
      const sent = msgs.filter((m: any) => m.status !== "pending").length;
      const delivered = msgs.filter((m: any) => m.status === "delivered" || m.status === "read").length;
      const read = msgs.filter((m: any) => m.status === "read").length;
      const failed = msgs.filter((m: any) => m.status === "failed").length;
      const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
      const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;

      // Send time distribution
      const hourCounts: Record<number, number> = {};
      for (const m of msgs) {
        if (m.sent_at) {
          const hr = new Date(m.sent_at).getHours();
          hourCounts[hr] = (hourCounts[hr] || 0) + 1;
        }
      }

      // Common error messages
      const errorCounts: Record<string, number> = {};
      for (const m of msgs) {
        if (m.error_message) {
          const key = m.error_message.slice(0, 80);
          errorCounts[key] = (errorCounts[key] || 0) + 1;
        }
      }
      const topErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

      dataContext = `
CAMPAIGN: "${campaign.name}"
Status: ${campaign.status}
Category: ${campaign.message_category || "marketing"}
Created: ${campaign.created_at}
- Total recipients: ${total}
- Sent: ${sent}
- Delivered: ${delivered} (${deliveryRate}%)
- Read: ${read} (${readRate}%)
- Failed: ${failed} (${sent > 0 ? Math.round((failed / sent) * 100) : 0}%)
- Send time distribution (hour: count): ${JSON.stringify(hourCounts)}
${topErrors.length > 0 ? `- Top error messages: ${topErrors.map(([e, c]) => `"${e}" (${c}x)`).join(", ")}` : "- No errors"}
`;

      systemPrompt = `You are a WhatsApp campaign analyst. Analyze this campaign's performance and provide:
1. Overall assessment (good/average/poor performance)
2. Key metrics analysis (delivery rate, read rate vs industry benchmarks of ~95% delivery, ~50% read)
3. If there are failures, diagnose likely causes
4. Timing analysis (were messages sent at optimal times?)
5. One specific recommendation for the next campaign

Be concise, specific with numbers. Under 150 words. No emojis.`;
    }

    // ── INBOX INSIGHTS ──
    else if (type === "inbox") {
      const [convosRes, recentMsgsRes] = await Promise.all([
        supabase.from("conversations").select("id, unread_count, ai_enabled, status, last_inbound_at")
          .eq("org_id", org_id),
        supabase.from("messages").select("content, direction, conversation_id, created_at")
          .eq("org_id", org_id).eq("direction", "inbound")
          .order("created_at", { ascending: false }).limit(50),
      ]);

      const convos = convosRes.data ?? [];
      const recentInbound = recentMsgsRes.data ?? [];

      const openConvos = convos.filter((c: any) => c.status === "open").length;
      const closedConvos = convos.filter((c: any) => c.status === "closed").length;
      const unreadCount = convos.reduce((s: number, c: any) => s + (c.unread_count || 0), 0);
      const aiEnabled = convos.filter((c: any) => c.ai_enabled).length;

      // Expired windows
      const now = Date.now();
      const expiredWindows = convos.filter((c: any) => {
        if (!c.last_inbound_at) return true;
        return now - new Date(c.last_inbound_at).getTime() > 24 * 60 * 60 * 1000;
      }).length;

      // Sample recent messages for topic analysis
      const sampleMessages = recentInbound
        .filter((m: any) => m.content)
        .slice(0, 30)
        .map((m: any) => m.content.slice(0, 100));

      dataContext = `
INBOX DATA:
- Total conversations: ${convos.length} (${openConvos} open, ${closedConvos} closed)
- Unread messages: ${unreadCount}
- AI auto-reply enabled: ${aiEnabled}/${convos.length}
- Conversations with expired 24hr window: ${expiredWindows}
- Recent inbound messages (last 30, for topic analysis):
${sampleMessages.map((m: string, i: number) => `  ${i + 1}. "${m}"`).join("\n")}
`;

      systemPrompt = `You are a customer communication analyst for a WhatsApp Business account. Analyze the inbox data and provide:
1. Inbox health summary (workload, response gaps)
2. Top 3-5 topics/themes customers are asking about (based on the sample messages)
3. Sentiment overview (are messages generally positive, neutral, or complaints?)
4. Recommendations (enable AI on more conversations? update knowledge base with common questions?)

Be concise and actionable. Under 150 words. No emojis.`;
    }

    else {
      return new Response(JSON.stringify({ error: "Invalid type. Use: dashboard, campaign, inbox" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Call Claude ──
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: dataContext }],
      }),
    });

    const result = await anthropicResponse.json();
    if (!anthropicResponse.ok) {
      console.error("Claude API error:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const insight = result.content[0].text;

    return new Response(JSON.stringify({ success: true, insight, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
