// Shared module: resolves per-org Exotel credentials, falls back to platform env vars

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ExotelCreds {
  apiKey: string;
  apiToken: string;
  subdomain: string;
  wabaId: string;
  accountSid: string;
  senderNumber: string;
}

export async function getExotelCreds(
  supabase: SupabaseClient,
  orgId: string
): Promise<ExotelCreds> {
  // Try org-specific credentials first
  const { data: orgCreds } = await supabase
    .from("org_credentials")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_configured", true)
    .maybeSingle();

  if (orgCreds?.exotel_api_key && orgCreds?.exotel_api_token) {
    return {
      apiKey: orgCreds.exotel_api_key,
      apiToken: orgCreds.exotel_api_token,
      subdomain: orgCreds.exotel_subdomain || Deno.env.get("EXOTEL_SUBDOMAIN")!,
      wabaId: orgCreds.exotel_waba_id || Deno.env.get("EXOTEL_WABA_ID")!,
      accountSid: orgCreds.exotel_account_sid || Deno.env.get("EXOTEL_ACCOUNT_SID")!,
      senderNumber: orgCreds.exotel_sender_number || Deno.env.get("EXOTEL_SENDER_NUMBER")!,
    };
  }

  // Fall back to platform env vars
  return {
    apiKey: Deno.env.get("EXOTEL_API_KEY")!,
    apiToken: Deno.env.get("EXOTEL_API_TOKEN")!,
    subdomain: Deno.env.get("EXOTEL_SUBDOMAIN")!,
    wabaId: Deno.env.get("EXOTEL_WABA_ID")!,
    accountSid: Deno.env.get("EXOTEL_ACCOUNT_SID")!,
    senderNumber: Deno.env.get("EXOTEL_SENDER_NUMBER")!,
  };
}
