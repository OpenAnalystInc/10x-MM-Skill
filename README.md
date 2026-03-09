# 10x Marketing Manager

Claude Code plugin that turns any AI coding agent into a full marketing team. 25+ skills, 7 AI agents, 6 slash commands, and 37 MCP tools — all wired to the Marketing Manager server and [10x.in](https://10x.in) link platform.

## Quick Start

```bash
# Install globally
npm i -g 10x-marketing-manager

# Scaffold into your project
cd your-project
10x-mm init

# Open Claude Code and configure
claude
/setup

# Verify connection
/health

# Start building
"Build me a landing page for my SaaS product"
```

## Requirements

- **Node.js 18+**
- **Claude Code** (or compatible AI coding agent)
- **10x.in account** — Sign up at [10x.in](https://10x.in) and manage your profile at [profile.10x.in](https://profile.10x.in)

## Access Tiers

| Tier | What You Need | What Works |
|------|---------------|------------|
| **Full** | Valid PAT from 10x.in | Everything — all 37 MCP tools + all local skills |
| **Local** | Your own AI key (BYOK) | Local skills only — content generation, design, build, local audits |
| **None** | Nothing configured | Nothing. Run `/setup` first |

- **PAT** (Personal Access Token): Get this from [profile.10x.in](https://profile.10x.in)
- **BYOK** (Bring Your Own Key): Anthropic, OpenRouter, or OpenAI API key for local-only mode

Check your current tier anytime:

```bash
10x-mm auth
```

## What You Get

### 37 MCP Tools (server-side, requires valid PAT)

| Category | Tools |
|----------|-------|
| Agent (9) | `agent_create_proposal`, `agent_generate_strategy`, `agent_list_proposals`, `agent_approve_proposal`, `agent_reject_proposal`, `agent_start_run`, `agent_get_run_status`, `agent_rollback_run`, `agent_discover` |
| Analytics (3) | `analytics_get`, `analytics_campaign_health`, `analytics_export` |
| Forms (2) | `forms_feedback_record`, `forms_schema_get` |
| Links (5) | `links_upsert`, `links_list`, `links_form_submit`, `links_health_check`, `links_route_preview` |
| Routing (4) | `routing_list_context_origins`, `routing_update_context_origins`, `routing_prefetch_decisions`, `routing_read_chain_session` |
| System (3) | `system_health`, `system_audit_events`, `system_usage_meters` |
| Tracking (7) | `tracking_list_templates`, `tracking_upsert_template`, `tracking_list_personalization_rules`, `tracking_upsert_personalization_rule`, `tracking_resolve_chain`, `tracking_resolve_context`, `tracking_write_signal` |
| Webhooks (4) | `webhooks_create`, `webhooks_list`, `webhooks_delete`, `webhooks_test` |

### 25+ Skills

**Content Generation**
- `landing-page` — Full landing page: discovery, copy, design, build, QA, launch
- `lp-copy` — Headlines, CTA, body copy optimization
- `lp-design` — Visual design system, colors, typography, layout
- `lp-content` — Content strategy, testimonial frameworks, social proof
- `lp-seo` — SEO metadata, schema markup, Open Graph
- `lp-speed` — Core Web Vitals, performance optimization

**Analytics & Testing**
- `lp-analytics` — GA4, Meta Pixel, event tracking, UTM strategy
- `lp-abtest` — A/B test design, variants, hypothesis tracking
- `lp-optimize` — CRO analysis, friction reduction, conversion improvements
- `lp-funnel` — Multi-step funnels, email sequences, upsell flows
- `lp-audit` — 7-point page audit (copy, design, SEO, a11y, perf, CRO, mobile)

**Marketing Operations**
- `lp-leads` — Lead capture forms, popups, exit-intent, sticky bars
- `lp-inject` — JavaScript injection (chat widgets, heatmaps, tracking pixels)
- `lp-competitor` — Competitor page teardown and counter-positioning
- `marketer-dashboard` — Live metrics, strategies, links overview
- `marketer-github` — GitHub-based publishing workflow
- `marketer-sync` — Sync live platform data locally

**Build Blocks**
- `build/create_landing_page` — Scaffold a new landing page
- `build/add_form_block` — Add lead capture form
- `build/add_section_block` — Add content sections
- `build/add_tracking_events` — Add analytics events
- `build/create_funnel_spec` — Define funnel structure
- `build/scaffold_funnel_routes` — Create funnel page routes

**Audit Checks**
- `audit/audit_build` — Build validation
- `audit/audit_links` — Link integrity check
- `audit/audit_lint` — Code linting
- `audit/audit_typescript` — TypeScript check
- `audit/audit_env_dns` — Env/DNS validation
- `audit/audit_identifier_lock` — ID stability check
- `audit/audit_runtime_smoke` — Runtime smoke test

**Release**
- `release/create_strategy_branch` — Create isolated strategy branch
- `release/generate_preview` — Generate preview URL
- `release/open_pr_review` — Open PR for review
- `release/publish_release` — Publish to live
- `release/rollback_release` — Rollback a release

### 7 AI Agents

| Agent | Role |
|-------|------|
| Agency Director | Orchestrates multi-agent campaigns |
| Campaign Manager | Campaign lifecycle and scheduling |
| Creative Director | Design, copy, and brand direction |
| Growth Strategist | CRO, funnel optimization, analytics |
| Technical Lead | Build, deploy, infrastructure |
| Testing Agent | QA, audits, validation |
| QA Director | Final approval and release sign-off |

### 6 Slash Commands

| Command | Purpose |
|---------|---------|
| `/setup` | Configure environment and credentials |
| `/deploy` | Deploy to your live `{handle}.10x.in` page |
| `/test` | Run server-side quality tests |
| `/health` | Check all service connections |
| `/history` | Browse past sessions and summaries |
| `/feedback` | Visual annotation mode for precise edits |

## Deployment Modes

The 10x.in platform supports three ways to deploy content. Page hosting uses the **direct API** (not MCP).

| Mode | When to Use | How | Auth |
|------|-------------|-----|------|
| **Site Deployment (inline)** | Simple pages with inline CSS/JS | `POST /v2/handles/{handle}/site-deployments` with `inlineHtml` → returns `201` | JWT |
| **Site Deployment (multi-file)** | Pages with separate CSS + JS, build output | `POST /v2/handles/{handle}/site-deployments` with `files` array → S3 upload → returns `201` | JWT |
| **Redirect Link** | Campaign tracking URLs, short links | `links_upsert` via MCP (creates 302 redirect, NOT page hosting) | PAT |

**Important**:
- Site deployment returns **`201 Created`** with a `deploymentId`. Verify via `GET /v2/handles/{handle}/site-deployments/{deploymentId}/preview` (returns signed `previewUrl`).
- Multi-file deployments **must include a root `index.html`** — without it, activation fails with `missing_entrypoint`.
- Use `PUT /v2/handles/{handle}/site-mode` to change site display mode (requires owner JWT).
- Never use raw S3 bucket URLs for previews — the bucket is origin-private behind CloudFront.
- `links_upsert` creates redirect links only — it does not host HTML pages.

## Architecture

```
Your Machine                           10x.in Platform
────────────                           ──────────────────

Claude Code CLI
  + 10x-marketing-manager
  + .mcp.json → server

  ┌─── MCP (Bearer USER_PAT) ────────► {handle}.mcp.10x.in
  │    Links, tracking, analytics,       MCP endpoint (37 tools)
  │    webhooks, agent workflow           Alt: api.10x.in/mcp/{handle}/mcp
  │
  ├─── Direct API (JWT) ─────────────► api.10x.in
  │    Site deployments (HTML hosting),  /v2/handles/{handle}/...
  │    pages, profile, campaigns, QA
  │
  └─── Live site ────────────────────► {handle}.10x.in
       Deployed pages served here
```

Your local Claude Code generates content. Two paths to the platform:
- **MCP (PAT auth)**: Links (redirects), tracking, analytics, webhooks, agent workflow. Has ~1KB payload limit. PAT scope families: `tracking.templates.*`, `analytics.*`, `webhooks.*`, `system.*`.
- **Direct API (JWT auth)**: Site deployments (HTML page hosting), pages, profile, campaigns, QA. No payload limit.

Nothing goes live without passing the server quality gate.

## MCP Client Configuration

Connect any MCP-compatible client to your 37 Link Platform tools:

```json
{
  "mcpServers": {
    "marketing-manager-mcp": {
      "type": "http",
      "url": "https://{handle}.mcp.10x.in/mcp",
      "headers": {
        "Authorization": "Bearer {YOUR_PAT}",
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

Works with: **Claude Code** (`.mcp.json`), **Cursor** (`.cursor/mcp.json`), **Windsurf** (`.windsurf/mcp.json`), **Claude Desktop** (`claude_desktop_config.json`).

Alternative URL via resource host: `https://api.10x.in/mcp/{handle}/mcp`

## CLI Commands

```bash
10x-mm init       # Scaffold plugin into current directory
10x-mm update     # Update skill files (preserves .env and .mcp.json)
10x-mm doctor     # Check environment, auth, and connectivity
10x-mm auth       # Show current access tier and PAT status
10x-mm history    # Show past session summaries
10x-mm clear      # Delete session logs (keeps context.json)
10x-mm version    # Show version
10x-mm help       # Show usage
```

## Session Tracking

Every MCP tool call is logged locally in `.mm/` for cross-session continuity. When you start a new conversation, Claude automatically loads context from your last session so it knows what you were working on.

## Environment Variables

After running `/setup`, your `.env` will contain:

```
USER_PAT=patv1_your_pat_here        # PAT (long-lived) for MCP auth
LINK_PLATFORM_PAT=your_jwt_here     # JWT (1h expiry) for direct API auth
LINK_PLATFORM_HANDLE=your_handle    # Your 10x.in handle
```

- **USER_PAT**: Personal Access Token (`patv1_*`). Long-lived. For MCP server auth (links, tracking, analytics). Get from [profile.10x.in](https://profile.10x.in).
- **LINK_PLATFORM_PAT**: JWT from Cognito. Expires every 1 hour. For direct API (site-deployments, pages). Get from [profile.10x.in](https://profile.10x.in).
- **LINK_PLATFORM_HANDLE**: Your 10x.in handle (e.g., `acme` deploys to `acme.10x.in`)

## Domain Categories

The landing page skill supports 12 domain categories with tailored section templates:

1. SaaS / Software Product
2. Ecommerce / Product Page
3. Portfolio / Personal Brand
4. IT Support / Tech Services
5. Event / Webinar / Conference
6. Demo / Product Demo
7. Lead Magnet / Resource Download
8. Agency / Professional Services
9. App Download / Mobile App
10. Coming Soon / Waitlist
11. Nonprofit / Cause
12. Real Estate / Property

Each category auto-invokes the right specialist skills (SEO, analytics, lead capture, etc.) based on domain best practices.

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| `401 token_expired` | JWT expired (1h lifetime) | Refresh from profile.10x.in |
| `401 invalid_token` | Bad PAT/JWT format | Check token in `.env` |
| `403 insufficient_scope` | PAT missing required scope | Check PAT permissions |
| `400 missing_entrypoint` | No `index.html` in deployment | Add root `index.html` |
| `413 payload_too_large` | Content too large for MCP | Use Direct API instead |
| `429 rate_limited` | Too many requests | Retry with backoff |

## Links

- **Platform**: [10x.in](https://10x.in)
- **Profile & Tokens**: [profile.10x.in](https://profile.10x.in)
- **Issues**: [GitHub Issues](https://github.com/Anit-1to10x/Marketing-Manager-Skill/issues)

## License

MIT
