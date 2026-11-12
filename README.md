# chbdev

Hudson Baker's personal portfolio, served at https://chbdev.com. Plain static files, no build step.

Deployed by Cloudflare Workers Builds (static assets) connected to this repo: every push to `main` redeploys.
The site files live in `public/`; `wrangler.jsonc` points at them and attaches the custom domains.
Build settings in the dashboard: build command empty, deploy command `npx wrangler deploy`, root directory `/`. The Worker name must be `chbdev`.

Contact details, claims and wording trace to the facts ledger in the private career-hq repo (`profile/facts.md`).
