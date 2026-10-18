// Vercel Function: принимает заявку с лендинга и пересылает её в Telegram.
// Переменные окружения: TELEGRAM_BOT_TOKEN, TELEGRAM_ID.

const field = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const name = field(body.name, 120);
  const contact = field(body.contact, 180);
  const idea = field(body.idea, 2000);

  if (name.length < 2 || contact.length < 5) {
    return res.status(400).json({ ok: false });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false });
  }

  const utm = ["utm_source", "utm_campaign", "utm_content"]
    .map((key) => [key, field(body[key], 80)])
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`);

  const text = [
    "Новая заявка на мастер-класс «Приложение за вечер»",
    "",
    `Имя: ${name}`,
    `Контакт: ${contact}`,
    ...(idea ? ["", "Что хочет создать:", idea] : []),
    ...(utm.length ? ["", ...utm] : []),
  ].join("\n");

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const data = await tg.json();
    if (!data.ok) return res.status(502).json({ ok: false });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false });
  }
};

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
