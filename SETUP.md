# Marketing Manager Skill — Local Setup Guide

Connect your Claude Code to the Marketing Manager MCP Server.

## Prerequisites

- **Marketing Manager Server** live at `https://mcp.10x.in`
- **Claude Code** installed
- **Node.js 18+**

## Step 1: Clone

```bash
git clone https://github.com/Anit-1to10x/Marketing-Manager-Skill.git
cd Marketing-Manager-Skill
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Server connection (MCP URL is derived from handle: https://{handle}.mcp.10x.in)
USER_PAT=your_personal_access_token

# Link Platform
LINK_PLATFORM_PAT=your_link_platform_token
LINK_PLATFORM_HANDLE=yourhandle

# AI Provider — pick ONE:
# OpenAnalyst (recommended):
ANTHROPIC_BASE_URL=https://api.openanalyst.com/api
ANTHROPIC_AUTH_TOKEN=your-key-here

# Or OpenRouter:
# OPENROUTER_API_KEY=your-key-here
# DEFAULT_AI_PROVIDER=openrouter
# DEFAULT_AI_MODEL=anthropic/claude-sonnet-4-20250514
```

## Step 3: Verify Server Connection

```bash
curl https://mcp.10x.in/health
```

Expected:
```json
{"status":"ok","version":"3.0.0","transport":"http","tools":80}
```

## Step 4: Install as Claude Code Skill

```bash
# From the Marketing-Manager-Skill directory:
claude skills add .
```

Or add to your Claude Code settings manually — the `.mcp.json` configures the MCP connection automatically.

## Step 5: Test

In Claude Code, try:
```
/health
```

This runs the health check command which verifies all service connections.

## What You Get

### 5 Slash Commands
| Command | Purpose |
|---------|---------|
| `/setup` | Auto-configure environment |
| `/health` | Check all service health |
| `/deploy` | Publish strategy to live |
| `/feedback` | Visual page annotation |
| `/test` | Run test suite |

### 6 Agent Roles
Agency Director, Creative Director, Technical Lead, Growth Strategist, Campaign Manager, QA Director

### 25 Skills
Landing page builder, SEO, copy, design, analytics, A/B testing, funnels, lead capture, speed optimization, and more.

### 80 MCP Tools
All tools route through the Marketing Manager MCP Server at `https://mcp.10x.in`.

## Architecture

```
Your Claude Code
  ├── Skills (25) — local content generation
  ├── Agents (6) — orchestrate skills
  └── MCP (mcp.10x.in) → Marketing Manager Server
        ├── DynamoDB (AWS managed) — strategies, branches
        ├── Temporal Cloud — workflows, scheduling
        └── Link Platform API (api.10x.in) → 10x.in
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| MCP connection refused | Start the server: `cd ../Marketing-Manager-Server && npx tsx src/mcp-server/index.ts` |
| "Run /setup first" | Create `.env` file with required values |
| Tool calls hang | Ensure server is running and DynamoDB is bootstrapped |
| Wrong tool params | See `.claude/knowledge/mcp-tools-reference.md` for correct params |
