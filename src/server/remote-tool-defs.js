// Static definitions of the 37 remote Link Platform MCP tools.
// Hardcoded to avoid runtime discovery on each serverless invocation.
// These match the tools returned by {handle}.mcp.10x.in/mcp tools/list.

module.exports = [
  // System (3)
  { name: 'system_health', description: 'Server + monolith connectivity check (PAT-first). Uses a cheap handle-scoped call: GET /v2/public/handles/{handle}/links.' },
  { name: 'system_usage_meters', description: 'Get usage/rate limit data (PAT-first).' },
  { name: 'system_audit_events', description: 'List audit events (PAT-first).' },

  // Links (5)
  { name: 'links_list', description: 'List all links for a handle (PAT-first via /v2/public/handles/{handle}/links).' },
  { name: 'links_upsert', description: 'Create/update a link (PAT-first via /v2/public/handles/{handle}/links/{slug}). The payload is forwarded to the monolith as-is.' },
  { name: 'links_health_check', description: 'Run destination health checks for links (PAT-first).' },
  { name: 'links_route_preview', description: 'Preview routing decision for a link under conditions (PAT-first).' },
  { name: 'links_form_submit', description: 'Submit link form values using learned schema validation and create/update link via public PAT endpoints.' },

  // Forms (2)
  { name: 'forms_schema_get', description: 'Get learned form schema for a handle/form (PAT-first).' },
  { name: 'forms_feedback_record', description: 'Record form submission feedback for learning reinforcement (PAT-first).' },

  // Tracking (7)
  { name: 'tracking_list_templates', description: 'List tracking templates for a handle (PAT-first).' },
  { name: 'tracking_upsert_template', description: 'Upsert a tracking template (PAT-first). Body forwarded to the monolith; templateKey must be one of: meta_pixel, gtm_event, ga4_event, custom_webhook.' },
  { name: 'tracking_list_personalization_rules', description: 'List A/B personalization rules for a handle (PAT-first).' },
  { name: 'tracking_upsert_personalization_rule', description: 'Upsert a personalization rule by ruleId (PAT-first). Payload forwarded to the monolith.' },
  { name: 'tracking_resolve_context', description: 'Resolve a CTX token into attribution + vars (public endpoint, no PAT required).' },
  { name: 'tracking_write_signal', description: 'Write a chain signal (handle-scoped chain endpoint; PAT allowed).' },
  { name: 'tracking_resolve_chain', description: 'Resolve a chain trigger decision (handle-scoped chain endpoint; PAT allowed).' },

  // Routing (4)
  { name: 'routing_list_context_origins', description: 'List allowlisted browser origins for /v2/public/context (PAT-first).' },
  { name: 'routing_update_context_origins', description: 'Replace allowlisted browser origins for /v2/public/context (PAT-first). Payload forwarded.' },
  { name: 'routing_read_chain_session', description: 'Read a chain session (signals + state).' },
  { name: 'routing_prefetch_decisions', description: 'Prefetch multiple chain trigger decisions (handle-scoped chain endpoint; PAT allowed).' },

  // Analytics (3)
  { name: 'analytics_get', description: 'Get click/conversion rollups (PAT-first).' },
  { name: 'analytics_export', description: 'Export analytics data (PAT-first).' },
  { name: 'analytics_campaign_health', description: 'Campaign health via agent discovery (handle-scoped agent endpoint; PAT allowed).' },

  // Webhooks (4)
  { name: 'webhooks_list', description: 'List webhook subscriptions (PAT-first).' },
  { name: 'webhooks_create', description: 'Create webhook subscription (PAT-first). Payload forwarded to the monolith.' },
  { name: 'webhooks_delete', description: 'Delete webhook subscription (PAT-first).' },
  { name: 'webhooks_test', description: 'Send a test event to a webhook subscription (PAT-first).' },

  // Agent (9)
  { name: 'agent_discover', description: 'Run agent discovery for marketing signals (handle-scoped agent endpoint; PAT allowed).' },
  { name: 'agent_generate_strategy', description: 'Generate strategy recommendations (handle-scoped agent endpoint; PAT allowed).' },
  { name: 'agent_list_proposals', description: 'List proposals with an optional status filter (handle-scoped agent endpoint; PAT allowed).' },
  { name: 'agent_create_proposal', description: 'Create an execution proposal (handle-scoped agent endpoint; PAT allowed).' },
  { name: 'agent_approve_proposal', description: 'Approve a pending proposal (handle-scoped agent endpoint; PAT allowed).' },
  { name: 'agent_reject_proposal', description: 'Reject a pending proposal (handle-scoped agent endpoint; PAT allowed).' },
  { name: 'agent_start_run', description: 'Start an execution run (handle-scoped agent endpoint; PAT allowed).' },
  { name: 'agent_get_run_status', description: 'Get run status with step details (handle-scoped agent endpoint; PAT allowed).' },
  { name: 'agent_rollback_run', description: 'Rollback a completed run (handle-scoped agent endpoint; PAT allowed).' },
];
