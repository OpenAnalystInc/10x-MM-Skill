# Agent Roster

## Team Leaders

| Agent | Role | Key MCP Tools | Receives | Delivers |
|-------|------|---------------|----------|----------|
| **Agency Director** | Top-level orchestrator, routes requests, quality gate | `agent_start_run`, `agent_get_run_status`, `system_health`, `system_usage_meters` | User intent | Polished final results |
| **Growth Strategist** | Strategy, analytics, A/B testing, funnel design, CRO | `agent_create_proposal`, `analytics_get`, `analytics_campaign_health`, `agent_list_proposals` | Objectives + metrics | Strategy plans, test configs, analytics reports |
| **Creative Director** | Copy, design, content strategy, competitor analysis | `analytics_get`, `analytics_campaign_health`, `agent_get_run_status` | Brief + requirements | Copy, design specs, content plans |
| **Technical Lead** | Builds pages, injects scripts, speed optimization, deployment | `agent_start_run`, `links_upsert` | Creative specs + strategy | Built pages (HTML/CSS/JS), PRs, performance reports |
| **Campaign Manager** | Links, campaigns, SEO, lead capture, data sync | `links_upsert`, `links_list`, `analytics_get` | Launch plans + tracking specs | Live links, tracking configs, SEO setup |
| **QA Director** | Audits, testing, release management, quality gate | `system_audit_events`, `links_list`, `agent_get_run_status` | Built artifacts | Audit reports, go/no-go decisions |
| **Testing Agent** | Step-by-step audit trails, broken code detection, integration mapping | `system_audit_events`, `agent_start_run`, `agent_get_run_status` | Built pages/features | Detailed test reports with severity-rated fixes |

## Inter-Agent Handoff Quick Reference

```
Agency Director → delegates to any team leader
Growth Strategist → Creative Director (strategy → creative execution)
Creative Director → Technical Lead (specs → build)
Technical Lead → Testing Agent (built code → testing)
Testing Agent → Technical Lead (bugs → fixes)
Testing Agent → QA Director (results → release decision)
Campaign Manager → QA Director (campaign setup → verification)
QA Director → Agency Director (go/no-go → delivery)
```

## Skill Sub-Agents (Landing Page Pipeline)

| Sub-Agent | Sequence | Purpose |
|-----------|----------|---------|
| Project Manager | Orchestrator | Creates strategy, coordinates all phases |
| Discovery Agent | Phase 1 | Requirements analysis, strategic brief |
| Copywriting Agent | Phase 2 | Headlines, body copy, CTAs |
| Design Agent | Phase 3 | Colors, typography, layout |
| Build Agent | Phase 4 | HTML/CSS/JS generation, WebMCP integration |
| QA Agent | Phase 5 | Testing materials, validation |
| Launch Agent | Phase 6 | SEO, analytics, publishing |
