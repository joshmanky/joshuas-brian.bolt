// Edge function: Canva OAuth token exchange — proxies code-for-token swap to keep client_secret server-side
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CLIENT_ID = 'OC-AZzVO3qqx7Fz';
const CLIENT_SECRET = Deno.env.get('CANVA_CLIENT_SECRET') || '';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { code, code_verifier, redirect_uri } = await req.json();

    if (!code || !code_verifier || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: "code, code_verifier, and redirect_uri are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "CANVA_CLIENT_SECRET nicht konfiguriert" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenRes = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        code_verifier,
        redirect_uri,
      }),
    });

    const tokenData = await tokenRes.json();

    return new Response(JSON.stringify(tokenData), {
      status: tokenRes.ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
