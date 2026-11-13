# chbdev

Charles Hudson Baker's personal portfolio, served at https://chbdev.com. Static files in `public/`, plus one small Worker route for the contact form.

Deployed by Cloudflare Workers Builds connected to this repo: every push to `main` redeploys.
`wrangler.jsonc` points at `public/`, attaches the custom domains, and sends only `/api/*` to the Worker (`src/worker.js`); everything else is served straight from the static files.
Build settings in the dashboard: build command empty, deploy command `npx wrangler deploy`, root directory `/`. The Worker name must be `chbdev`.

## Contact form

The page posts to `/api/contact`. `src/contact.js` checks the message and emails it to Hudson through Resend, with Reply-To set to the visitor. Bots are dropped by a hidden field and a minimum fill time, and posts from other sites are refused.

- Needs one secret on the Worker: `RESEND_API_KEY`, a Resend key with Sending access only. Set it yourself, never in a file:
  `npx wrangler secret put RESEND_API_KEY` (run in this folder; it prompts for the value). That command deploys immediately.
- Optional settings, in the dashboard under the Worker's Variables: `CONTACT_TO` (default charlesprobaker@gmail.com) and `CONTACT_FROM` (default `Portfolio contact <hello@longbow.fit>`, a sender verified in Resend).
- Until the key is set, the endpoint answers 503 "Messages are not switched on yet", and the form shows that plus a direct email address.
- Local test: `npx wrangler dev`, then post to `http://localhost:8787/api/contact`. Put a test key in `.dev.vars` (git-ignored) only if you want a real send.

## Where the page comes from

`public/index.html` is generated from the private career-hq repo (`portfolio/build-public.mjs`, which reads `portfolio/site/index.html`). Edit it there and rebuild, not here. The resume, favicon, share image, robots, and sitemap in `public/` are maintained by hand or by the resume tooling.

Contact details, claims and wording trace to the facts ledger in career-hq (`profile/facts.md`).
