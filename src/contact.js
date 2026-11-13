// POST /api/contact
// Receives the contact form from chbdev.com and emails it to Hudson through Resend.
//
// Secrets and settings (set on the Worker, never in this file):
//   RESEND_API_KEY  required  a Resend key with "Sending access" only
//   CONTACT_TO      optional  where messages go (default below)
//   CONTACT_FROM    optional  a sender on a domain verified in Resend (default below)

const DEFAULT_TO = "charlesprobaker@gmail.com";
const DEFAULT_FROM = "Portfolio contact <hello@longbow.fit>";
const MIN_FILL_MS = 2500; // a human takes longer than this to fill the form

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

// Strip control characters and cap the length. Header-bound fields also lose newlines.
function clean(value, max, singleLine) {
  let s = String(value == null ? "" : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  if (singleLine) s = s.replace(/[\r\n]+/g, " ");
  return s.trim().slice(0, max);
}

function looksLikeEmail(email) {
  const at = email.indexOf("@");
  return at > 0 && email.indexOf(" ") < 0 && email.lastIndexOf(".") > at + 1 && email.lastIndexOf(".") < email.length - 1;
}

export async function handleContact(request, env) {
  if (request.method !== "POST") return reply({ error: "Use POST." }, 405);

  // Only accept posts from this site's own pages.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return reply({ error: "Not allowed." }, 403);
  }

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return reply({ error: "That request was not readable." }, 400);
  }

  // Bots: a filled hidden field, or a form submitted faster than a person could. Pretend it worked.
  if (clean(data.website, 200, true) !== "" || !(Date.now() - Number(data.t) > MIN_FILL_MS)) {
    return reply({ ok: true });
  }

  const name = clean(data.name, 100, true);
  const email = clean(data.email, 200, true);
  const message = clean(data.message, 5000, false);

  if (!name || !looksLikeEmail(email) || message.length < 10) {
    return reply({ error: "Please add your name, a valid email, and a message." }, 400);
  }

  if (!env.RESEND_API_KEY) {
    console.error("contact: RESEND_API_KEY is not set");
    return reply({ error: "Messages are not switched on yet." }, 503);
  }

  const text = [
    "New message from the portfolio contact form.",
    "",
    "Name:  " + name,
    "Email: " + email,
    "",
    message,
  ].join("\n");

  let res;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || DEFAULT_FROM,
        to: [env.CONTACT_TO || DEFAULT_TO],
        reply_to: email,
        subject: "Portfolio message from " + name,
        text,
      }),
    });
  } catch (e) {
    console.error("contact: could not reach Resend");
    return reply({ error: "That did not go through." }, 502);
  }

  if (!res.ok) {
    console.error("contact: Resend answered " + res.status);
    return reply({ error: "That did not go through." }, 502);
  }
  return reply({ ok: true });
}
