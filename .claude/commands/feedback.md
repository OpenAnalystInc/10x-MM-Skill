---
description: Start visual feedback mode — inject Agentation into your local page so you can annotate, click, and highlight what you want changed. Claude reads your annotations for precise edits.
---

# Visual Feedback

You are starting a visual feedback session so the user can annotate their
local page and give you precise visual instructions.

## Step 1: Check Prerequisites

Verify `agentation` is installed in the user's project:

```bash
node -e "require('agentation'); console.log('OK')" 2>/dev/null || echo "MISSING"
```

If MISSING, install it:

```bash
npm install agentation -D
```

## Step 2: Detect Local Dev Server

Check which port has a running dev server:

```bash
curl -s -o /dev/null -w "%{http_code}" https://${LINK_PLATFORM_HANDLE}.10x.in 2>/dev/null
```

If no server is running, tell the user:
"No local dev server detected. Start your page first (e.g. `npm run dev`)
or run `/landing-page` to build one."

If a server is detected, note the port.

## Step 3: Detect Framework

Look for framework indicators in the user's project:

- `next.config.*` → Next.js
- `vite.config.*` → Vite
- `src/App.tsx` or `src/App.jsx` → React (CRA or Vite)
- `index.html` only → Plain HTML

## Step 4: Inject Agentation Component

Based on the detected framework, inject the Agentation component.

### For React / Next.js / Vite:

Find the root component file (`App.tsx`, `App.jsx`, `layout.tsx`, or `page.tsx`).

Add the import at the top:
```tsx
import { Agentation } from "agentation";
```

Add the component before the closing tag of the root element:
```tsx
{process.env.NODE_ENV === "development" && <Agentation />}
```

### For Plain HTML:

Find the main `index.html` file. Add before `</body>`:
```html
<script type="module">
  import('agentation/browser').then(m => m.init());
</script>
```

**IMPORTANT**: Only inject in development mode. Never include in production builds.

## Step 5: Print Instructions

```
Visual Feedback Ready!

  Page: https://{handle}.10x.in

  How to use:
  1. Open (or refresh) the page in your browser
  2. Click on any element to select it
  3. Highlight areas you want changed
  4. Add text comments on specific sections
  5. Come back here and tell me what to fix

  I can see the annotations you make — just describe
  the changes you want and I'll edit the exact elements.

  To stop: run /feedback stop
```

## Arguments

- No args: Start feedback session (auto-detect and inject)
- `stop`: Remove the injected component from the source code
- `status`: Check if Agentation component is currently injected

### `/feedback stop`

1. Remove the injected `<Agentation />` component and import from the source
2. Print "Feedback session ended. Component removed."

### `/feedback status`

1. Search for `agentation` import in the project source files
2. If found: "Feedback mode is ACTIVE — Agentation is injected in {file}"
3. If not found: "No active feedback session"

$ARGUMENTS
