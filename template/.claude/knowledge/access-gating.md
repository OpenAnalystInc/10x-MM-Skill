# Access Gating — User Tier Rules

The user's authentication tokens are the source of truth for their access level. Check BEFORE calling any Link Platform MCP tool.

## Authentication — Dual Token Model

The platform uses two different token types for different purposes:

| Token | Format | Scope | Lifetime | Used For |
|-------|--------|-------|----------|----------|
| **JWT (Cognito ID token)** | `eyJ...` | `/v2/handles/*` control plane | 1 hour | Site-deployments, profile, pages, agent proposals/runs |
| **PAT (Personal Access Token)** | `patv1_*` | `/v2/public/handles/*` automation | Long-lived | Links, tracking, analytics, webhooks |

**PAT scope families**: `tracking.templates.*`, `tracking.personalization.*`, `routing.context_origins.*`, `analytics.*`, `webhooks.*`, `system.*`

**IMPORTANT distinctions**:
- `USER_PAT` in `.env` may be either a JWT or a PAT (`patv1_*`). Check the format.
- `LINK_PLATFORM_PAT` (if present) specifically refers to the JWT Cognito token needed for control-plane operations (site-deployments, agent).
- MCP server accepts PAT for auth (`Bearer USER_PAT`).
- **Site-deployments (page hosting) requires JWT** — PAT alone will NOT work for deploying pages.

## Three Tiers

### Full Tier (valid PAT)
- Access: All 37 Link Platform MCP tools + all local skills
- PAT: Valid JWT from 10x.in profile (expires every 1 hour)
- Server: Uses server's own AI setup — no BYOK needed
- The server's Claude Code leader handles testing, validation, and deployment

### Local Tier (no valid PAT, has BYOK key)
- Access: Local skills ONLY — content generation, design, build, local audits
- BYOK: One of ANTHROPIC_AUTH_TOKEN, OPENROUTER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY
- Server: BLOCKED — no Link Platform tools, no publishing, no server testing, no analytics
- User message: "Server features require a valid PAT. Your BYOK key powers local AI features. Get a PAT from your 10x.in profile for publishing, testing, and analytics."

### None Tier (nothing configured)
- Access: NOTHING works
- User message: "No authentication configured. Run /setup to either get a PAT from 10x.in or provide your own AI API key."

## How to Check Tier

### In Code (CLI)
```bash
10x-mm auth    # Quick tier check
10x-mm doctor  # Full diagnostics including tier
```

### Inline (for skills/agents)
```javascript
// Decode JWT payload — no crypto library needed
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
const expired = payload.exp < Date.now() / 1000;
```

## Local-Only Skills (work at ALL tiers, including local)

### Content Generation
lp-copy, lp-design, lp-content, lp-seo, lp-speed, lp-competitor, lp-optimize, lp-abtest, lp-funnel, lp-inject, lp-leads, lp-analytics

### Build
build/create_landing_page, build/add_form_block, build/add_section_block, build/add_tracking_events, build/create_funnel_spec, build/scaffold_funnel_routes

### Local Audits
audit/audit_build, audit/audit_lint, audit/audit_typescript, audit/audit_env_dns, audit/audit_identifier_lock

### Other Local
marketer-github (git operations), agent-api-integration, visual-feedback

## Server-Required Skills (FULL tier only)

### Release
release/create_strategy_branch, release/generate_preview, release/open_pr_review, release/publish_release, release/rollback_release

### Server Audits
audit/audit_runtime_smoke, audit/audit_links

### Data & Dashboard
marketer-sync, marketer-dashboard

### Landing Page Skill (partial)
The landing-page skill phases 1-4 (discovery, copy, design, build) are local. Phases 5-6 (QA submission + publish) require full tier.

## All 37 Link Platform Tools (all require FULL tier)

| Tool | Purpose |
|------|---------|
| agent_start_run | Submit HTML for server testing + optional publish |
| agent_get_run_status | Check strategy or account status |
| system_health | Server health check |
| system_usage_meters | List server capabilities and usage |
| agent_create_proposal | Create marketing strategy |
| agent_list_proposals | List strategies |
| analytics_get | Get performance analytics |
| analytics_campaign_health | Compare strategies |
| links_upsert | Create/update links, pages, or publish content |
| links_list | List links and pages |
| agent_rollback_run | Rollback deployment |
| system_audit_events | Server-side quality audit |
| webhooks_create | Create scheduled task |
| webhooks_list | List schedules |
| tracking_list_templates | Get WebMCP embed code |
| routing_list_context_origins | List custom domains |
| agent_discover | Discovery for marketing signals (POST method, JWT_CREATOR role) |

### Direct API (not MCP — requires JWT)
| Operation | Endpoint | Auth |
|-----------|----------|------|
| Deploy page (inline HTML) | `POST /v2/handles/{handle}/site-deployments` with `inlineHtml` | JWT |
| Deploy page (multi-file) | `POST /v2/handles/{handle}/site-deployments` with `files` array | JWT |
| Deployment preview (signed URL) | `GET /v2/handles/{handle}/site-deployments/{deploymentId}/preview` | JWT |
| Site mode update | `PUT /v2/handles/{handle}/site-mode` | JWT (owner) |
| Campaign management | `POST /v2/handles/{handle}/campaigns` | JWT |
| QA automation | `POST /v2/handles/{handle}/qa/*` | JWT |

**WARNING**: `links_upsert` does NOT host pages. It creates redirect links (302) only. The `html` parameter is accepted but IGNORED. Use site-deployments for page hosting.

## Error Messages by Scenario

| Scenario | Message |
|----------|---------|
| No .env file | "Run /setup to configure your environment." |
| PAT expired | "Your PAT has expired (JWT tokens last 1 hour). Get a fresh one from your 10x.in profile settings and update .env." |
| PAT expiring soon (<10min) | "Your PAT expires in {N} minutes. Consider refreshing it from 10x.in profile." |
| No PAT, has BYOK | "Server features require a valid PAT. Local skills work with your {provider} key. Get a PAT from 10x.in for publishing and testing." |
| No PAT, no BYOK | "No authentication configured. Run /setup to either get a PAT from 10x.in or provide your own AI API key." |
| 401 from server | "Authentication failed — your PAT may have expired. Refresh from 10x.in profile settings." |
| 403 on site-deployments | "Site-deployments requires a JWT (Cognito ID token), not a PAT. Check your token format." |
| 400 missing_entrypoint on deploy | "Deployment files must include a root index.html. Add index.html and retry." |

## Agent Routing by Tier

| Agent | Full Tier | Local Tier |
|-------|-----------|------------|
| agency-director | Full routing | Route to local-capable agents only |
| creative-director | Full | Full (all local work) |
| technical-lead | Full | Build only, no release/* |
| growth-strategist | Full | Local analysis only, no analytics_get |
| campaign-manager | Full | Limited — no Link Platform data tools |
| qa-director | Full | Local audits only, no system_audit_events |
| testing-agent | Full | Local audit skills only |
