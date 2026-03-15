// Edge function: proxy Claude API calls with token usage tracking + Vision support
// Updated: accepts optional `images` array (base64 JPEG) for Claude Vision analysis
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  systemPrompt?: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  agentName?: string;
  images?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { systemPrompt, userMessage, model, maxTokens, agentName, images }: RequestBody = await req.json();
    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "userMessage is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("key_value")
      .eq("platform", "claude")
      .maybeSingle();

    if (!keyRow?.key_value) {
      return new Response(
        JSON.stringify({ error: "Claude API Key nicht konfiguriert." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let content: unknown;
    if (images && images.length > 0) {
      const contentBlocks: unknown[] = [];
      for (const imgBase64 of images) {
        contentBlocks.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: imgBase64 },
        });
      }
      contentBlocks.push({ type: "text", text: userMessage });
      content = contentBlocks;
    } else {
      content = userMessage;
    }

    const usedModel = model || "claude-sonnet-4-20250514";
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": keyRow.key_value,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: usedModel,
        max_tokens: maxTokens || 2048,
        system: systemPrompt || "Du bist ein hilfreicher Assistent.",
        messages: [{ role: "user", content }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return new Response(
        JSON.stringify({ error: `Claude API Fehler: ${claudeRes.status} - ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claudeJson = await claudeRes.json();
    const text = claudeJson.content?.[0]?.text || "";
    const inputTokens = claudeJson.usage?.input_tokens || 0;
    const outputTokens = claudeJson.usage?.output_tokens || 0;

    const isHaiku = usedModel.includes("haiku");
    const inputCostPer1M = isHaiku ? 0.25 : 3.0;
    const outputCostPer1M = isHaiku ? 1.25 : 15.0;
    const estimatedCost =
      (inputTokens / 1_000_000) * inputCostPer1M +
      (outputTokens / 1_000_000) * outputCostPer1M;

    const inputSummary = images && images.length > 0
      ? `[${images.length} image(s)] ${userMessage.slice(0, 150)}`
      : userMessage.slice(0, 200);

    await Promise.all([
      supabase.from("ai_tasks_log").insert({
        task_type: "claude_call",
        agent_name: agentName || "System",
        input_summary: inputSummary,
        output_summary: text.slice(0, 200),
      }),
      supabase.from("token_usage_log").insert({
        agent_name: agentName || "System",
        model: usedModel,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost: estimatedCost,
        task_type: "claude_call",
      }),
    ]);

    return new Response(
      JSON.stringify({
        text,
        usage: { input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost: estimatedCost },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
