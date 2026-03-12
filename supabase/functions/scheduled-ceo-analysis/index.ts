// Edge function: scheduled CEO analysis (called by pg_cron at 12:00 and 18:00 Berlin time)
// Updated: uses Haiku model for cost efficiency, caches result to ceo_analysis_cache
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
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

    const [taskLogs, igPosts, tiktokVideos, ytVideos] = await Promise.all([
      supabase.from("ai_tasks_log").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("instagram_posts").select("caption, like_count, media_type").order("like_count", { ascending: false }).limit(10),
      supabase.from("tiktok_videos").select("description, views, likes").order("likes", { ascending: false }).limit(10),
      supabase.from("youtube_videos").select("title, views, likes").order("views", { ascending: false }).limit(10),
    ]);

    const igContext = (igPosts.data || [])
      .map((p: Record<string, unknown>, i: number) => `IG #${i + 1}: "${((p.caption as string) || "").slice(0, 80)}" — ${p.like_count} Likes (${p.media_type})`)
      .join("\n");

    const ttContext = (tiktokVideos.data || [])
      .map((v: Record<string, unknown>, i: number) => `TT #${i + 1}: "${((v.description as string) || "").slice(0, 80)}" — ${v.views} Views, ${v.likes} Likes`)
      .join("\n");

    const ytContext = (ytVideos.data || [])
      .map((v: Record<string, unknown>, i: number) => `YT #${i + 1}: "${((v.title as string) || "").slice(0, 80)}" — ${v.views} Views, ${v.likes} Likes`)
      .join("\n");

    const taskContext = (taskLogs.data || [])
      .slice(0, 20)
      .map((t: Record<string, unknown>) => `[${t.agent_name}] ${t.task_type}: "${t.output_summary}"`)
      .join("\n");

    const systemPrompt = `Du bist der CEO Agent fuer Joshua Tischer (@joshmanky). Nische: H.I.S.-Methode, Anti-Guru Blockadenloesung fuer 20-30-Jaehrige, Network Marketing + Trading. Analysiere Performance-Daten und setze Content-Prioritaeten. Antworte NUR als JSON: {"performanceSummary":"...","agentOptimizations":[{"agentName":"...","reason":"...","suggestedPromptUpdate":"..."}],"contentPriorities":["...","...","..."]}`;

    const userMessage = `TOP INSTAGRAM POSTS:\n${igContext || "Keine Daten"}\n\nTOP TIKTOK VIDEOS:\n${ttContext || "Keine Daten"}\n\nTOP YOUTUBE VIDEOS:\n${ytContext || "Keine Daten"}\n\nREZENTE AI TASKS:\n${taskContext || "Keine Logs"}`;

    const usedModel = "claude-haiku-4-5-20251001";
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": keyRow.key_value,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: usedModel,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
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

    const inputCostPer1M = 0.25;
    const outputCostPer1M = 1.25;
    const estimatedCost =
      (inputTokens / 1_000_000) * inputCostPer1M +
      (outputTokens / 1_000_000) * outputCostPer1M;

    await supabase.from("token_usage_log").insert({
      agent_name: "CEO Agent",
      model: usedModel,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost: estimatedCost,
      task_type: "scheduled_ceo_analysis",
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await supabase.from("ceo_analysis_cache").insert({
        performance_summary: "Scheduled: Analyse konnte nicht geparst werden.",
        agent_optimizations: [],
        content_priorities: [],
        source: "scheduled",
        model_used: usedModel,
      });

      return new Response(
        JSON.stringify({ status: "completed", parsed: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    await Promise.all([
      supabase.from("ceo_analysis_cache").insert({
        performance_summary: parsed.performanceSummary || "",
        agent_optimizations: parsed.agentOptimizations || [],
        content_priorities: parsed.contentPriorities || [],
        source: "scheduled",
        model_used: usedModel,
      }),
      supabase.from("ai_tasks_log").insert({
        agent_name: "CEO Agent",
        task_type: "scheduled_ceo_analysis",
        output_summary: (parsed.performanceSummary || "").slice(0, 200),
        status: "completed",
      }),
    ]);

    return new Response(
      JSON.stringify({
        status: "completed",
        parsed: true,
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
