# Cookie Blocker

Unpacked Chrome / Edge extension that blocks every cookie the browser will let an extension touch.

## Load it

1. Open `chrome://extensions` (Edge: `edge://extensions`).
2. Turn on **Developer mode**.
3. If `icons/` is missing, run `python3 generate_icons.py`.
4. Click **Load unpacked** and choose this folder.
5. Pin the extension. The badge says ON while blocking is active.

## What it blocks

- `Cookie` request headers, so stored cookies are not sent.
- `Set-Cookie` response headers, so servers cannot store new ones.
- `document.cookie` and the Cookie Store API, via a page script at document start.
- Cookies already on disk: deleted on install, whenever one is set, and about once a minute.

Allowlist a domain only if you need that site to stay logged in. With blocking on, almost every site will treat you as logged out.

Local storage, session storage, and IndexedDB are not cookies. This extension does not touch them.
