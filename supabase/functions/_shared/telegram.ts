const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

export const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const shortAddr = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

export type SendResult =
  | { ok: true }
  | { ok: false; blocked: boolean; retryAfter?: number; error: string };

export async function sendMessage(chatId: number, html: string): Promise<SendResult> {
  if (!TOKEN) return { ok: false, blocked: false, error: "TELEGRAM_BOT_TOKEN not set" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    // 403 = user blocked the bot / left; 400 "chat not found" = chat is gone.
    const blocked = res.status === 403 || (res.status === 400 && /chat not found/i.test(data?.description ?? ""));
    return {
      ok: false,
      blocked,
      retryAfter: res.status === 429 ? Number(data?.parameters?.retry_after ?? 5) : undefined,
      error: `${res.status} ${data?.description ?? ""}`.trim(),
    };
  } catch (err) {
    return { ok: false, blocked: false, error: String(err) };
  }
}
