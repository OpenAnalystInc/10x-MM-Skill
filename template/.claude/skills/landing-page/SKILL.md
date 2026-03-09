---
name: landing-page
description: Create high-converting landing pages using 10x Team's multi-agent methodology. Supports 12 domain categories (SaaS, ecommerce, portfolio, IT support, events, etc.) with intelligent skill orchestration that auto-invokes SEO, analytics, speed, and other specialist skills only when needed.
version: 3.0.0
author: 10x Team
license: 10x Team Proprietary
triggers:
  - /landing-page
  - /lp
allowed-tools:
  - read
  - write
  - edit
  - glob
  - grep
  - bash
  - task
  - ask-user
metadata:
  category: web-development
  tags: landing-page, marketing, conversion, multi-agent
  compatibility: claude-code, opencode, cursor, vscode
  min-context: 32000
---

# 10x Team Landing Page Skill

## IMPORTANT: BRANDING

This is **10x Team's proprietary landing page methodology**.
- NEVER mention any external courses, methodologies, or instructors
- All techniques are "10x Team's proven framework"
- All references should be to "our methodology" or "10x Team's approach"

---

## SKILL DIRECTORY

This skill's files are located relative to this SKILL.md file:

```
.claude/skills/landing-page/             ← YOU ARE HERE
├── SKILL.md                             ← This file
├── agents/                              ← 7 specialist agent prompts
│   ├── project-manager.md
│   ├── discovery-agent.md
│   ├── copywriting-agent.md
│   ├── design-agent.md
│   ├── build-agent.md
│   ├── qa-agent.md
│   └── launch-agent.md
├── knowledge/                           ← 18 reference knowledge files
│   ├── headline-formulas.md
│   ├── copy-principles.md
│   ├── color-psychology.md
│   ├── typography-pairings.md
│   ├── layout-patterns.md
│   ├── visual-interest.md
│   ├── accessibility-checklist.md
│   ├── seo-checklist.md
│   ├── testing-scripts.md
│   ├── domain-templates.md              ← NEW: 12 domain categories
│   ├── cro-principles.md                ← NEW: CRO frameworks
│   ├── analytics-setup.md               ← NEW: GA4, pixels, events
│   ├── funnel-patterns.md               ← NEW: Funnel types
│   ├── lead-capture.md                  ← NEW: Forms, popups
│   ├── competitor-analysis.md           ← NEW: Teardown framework
│   ├── speed-optimization.md            ← NEW: Core Web Vitals
│   ├── abtest-framework.md              ← NEW: A/B testing
│   └── js-injection.md                  ← NEW: Script injection
└── scripts/                             ← 8 generator scripts (Node.js)
    ├── init-project.js
    ├── generate-project.js
    ├── generate-html.js
    ├── generate-react.js
    ├── generate-nextjs.js
    ├── generate-astro.js
    ├── generate-vue.js
    └── list-projects.js
```

**Path Resolution**: When loading agent or knowledge files, resolve paths relative to this SKILL.md. For example:
- Agent files: `agents/project-manager.md` (relative to this directory)
- Knowledge files: `knowledge/headline-formulas.md` (relative to this directory)
- If your runtime uses absolute paths, prepend `.claude/skills/landing-page/`

---

## MODEL ADAPTATION

Before starting, self-assess your capability tier and adapt the workflow accordingly.

### Tier 1: High-Capability Models (Opus 4.6, GPT-5.3, Sonnet 4.5)
- Run full 6-phase multi-agent pipeline
- Load all relevant knowledge files per agent
- Rich intermediate outputs with detailed analysis
- Full review cycle with PM agent (max 2 revisions per agent)

### Tier 2: Medium-Capability Models (Big Pickle, Gemini 2.5, Sonnet 4.0)
- Run all 6 phases sequentially, one at a time
- Load knowledge files ON DEMAND only when needed for current phase
- Keep intermediate outputs concise (bullet points over prose)
- Single review pass per agent (1 revision max)
- Skip the PM agent layer — execute phases directly and self-review

### Tier 3: Smaller Models (Haiku, small open-weight models)
- Combine phases: Discovery+Copy → Design+Build → QA+Launch (3 mega-phases)
- Load only the single most relevant knowledge file per mega-phase
- Minimal intermediate files — focus on final deliverable
- No revision cycle — get it right in one pass
- Use the simplified question flow (Q1-Q5 only, skip Q6-Q12 and use defaults)

**How to self-assess**: If you can comfortably hold 100k+ tokens of context and reason about complex multi-step plans, use Tier 1. If you have 32k-100k context, use Tier 2. Below 32k, use Tier 3.

---

## KNOWLEDGE LOADING STRATEGY

Do NOT load all knowledge files at once. Load them progressively per phase:

| Phase | Files to Load | ~Tokens |
|-------|--------------|---------|
| Discovery | `domain-templates.md` (load domain section only) | ~1k |
| Copywriting | `headline-formulas.md`, `copy-principles.md` | ~2k |
| Design | `color-psychology.md`, `typography-pairings.md`, `layout-patterns.md`, `visual-interest.md` | ~6k |
| Build | `accessibility-checklist.md`, `layout-patterns.md`, `visual-interest.md` | ~5k |
| QA | `testing-scripts.md` | ~2k |
| Launch | `seo-checklist.md` | ~2k |
| *Conditional* | Additional knowledge loaded only if skill auto-invoked (see Intelligent Routing) | varies |

**For Tier 2/3 models**: Each knowledge file has a TL;DR at the top. Read the TL;DR first — only load the full file if you need detailed reference.

---

## ARCHITECTURE OVERVIEW

This skill operates as a **coordinated team of specialist agents**:

```
USER
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│                    MAIN SKILL                           │
│            (User Input Collection)                      │
│                                                         │
│  Collects ALL requirements from user FIRST              │
│  Saves to: user-preferences/{project}.json              │
└─────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│              PROJECT MANAGER AGENT                      │
│                    (Judge)                              │
│                                                         │
│  - Coordinates all specialist agents                    │
│  - Reviews output against user requirements             │
│  - Approves or requests revisions                       │
│  - Ensures quality before showing to user               │
└─────────────────────────────────────────────────────────┘
  │
  ├──► Discovery Agent      → Requirements analysis
  ├──► Copywriting Agent    → Headlines, copy, CTAs
  ├──► Design Agent         → Visual strategy
  ├──► Build Agent          → HTML/CSS/JS generation
  ├──► QA Agent             → Testing preparation
  └──► Launch Agent         → Deployment prep
```

---

## PHASE 1: USER INPUT COLLECTION

When user triggers the skill, collect ALL information FIRST before any agent work begins.

### Greeting
```
Welcome to 10x Team Landing Page Builder!

I'll help you create a high-converting landing page. First, I need to understand your project.

This will take about 5-10 minutes. Your answers will guide everything we create.

Let's begin!
```

### Optional: Worksheets Integration
```
Q0: Do you have a completed Landing Page Worksheets document?
    (This helps us understand your requirements better)

    If yes, please provide the file path.
    If no, we'll gather all information through our questions.
```

If user provides a worksheets file:
1. Read the document
2. Extract relevant information:
   - Business description
   - Target audience details
   - Value propositions
   - Objections and counters
   - Brand personality notes
3. Pre-populate answers from the document
4. Ask user to confirm/edit extracted information

### Required Inputs (Ask One at a Time)

**1. Project Basics**
```
Q1: What should we call this project?
    (This will be your project folder name)

Q2: In one sentence, what does your business/product do?
    Example: "We help remote teams track time and bill clients automatically"
```

**2. Page Category**
```
Q2.5: What type of landing page is this?

     1.  SaaS / Software Product (free trial, demo, signup)
     2.  Ecommerce / Product Page (purchase, add to cart)
     3.  Portfolio / Personal Brand (showcase work, hire me)
     4.  IT Support / Tech Services (consultation, quote)
     5.  Event / Webinar / Conference (registration)
     6.  Demo / Product Demo (book a demo)
     7.  Lead Magnet / Resource Download (email for free resource)
     8.  Agency / Professional Services (get a quote)
     9.  App Download / Mobile App (install app)
     10. Coming Soon / Waitlist (join waitlist)
     11. Nonprofit / Cause (donate, volunteer)
     12. Real Estate / Property (schedule viewing)
     13. Other (describe your use case)

     Your choice (1-13):
```

**CRITICAL**: After the user selects a domain, load ONLY that domain's section from `knowledge/domain-templates.md`. This determines:
- Which page sections to include (each domain has different required sections)
- Which data points to collect
- Which skills to auto-invoke vs skip
- The appropriate CTA type

**3. Conversion Goal**
```
Q3: What is the ONE action you want visitors to take?

    Options:
    1. Sign up for free account
    2. Start a free trial
    3. Purchase/Subscribe
    4. Schedule a demo/call
    5. Download a resource
    6. Subscribe to newsletter
    7. Other (please specify)
```

**3. Target Audience**
```
Q4: Describe your ideal customer:
    - Who are they? (role, demographics)
    - What situation are they in?
    - What problem are they trying to solve?
    - What have they tried before?
```

**4. Objections**
```
Q5: What are the TOP 3 reasons someone might NOT take action?

    Common reasons include:
    • "I don't understand what it does"
    • "I don't believe it will work"
    • "It won't work for my situation"
    • "It's too expensive"
    • "It takes too much time/effort"
    • "I'll do it later"
    • "My current solution is fine"

    Your top 3:
```

**5. Brand Personality**
```
Q6: Select 3-5 words that describe how your brand should FEEL:

    Professional: Trustworthy, Authoritative, Confident, Formal
    Modern: Sleek, Cutting-edge, Innovative, Bold
    Friendly: Warm, Approachable, Human, Supportive
    Premium: Elegant, Sophisticated, Luxury, Refined
    Simple: Clean, Minimal, Essential, Clear
    Creative: Playful, Quirky, Artistic, Unique
    Technical: Precise, Data-driven, Expert, Smart

    Your 3-5 words:
```

**6. Differentiation**
```
Q7: Complete this sentence:
    "Unlike [competitors], we _____________"

    What makes you genuinely different?
```

**7. Social Proof**
```
Q8: What proof do you have that your product works?

    Check all that apply:
    [ ] Customer testimonials (how many?)
    [ ] Number of customers/users
    [ ] Well-known company logos
    [ ] Press mentions
    [ ] Awards or certifications
    [ ] Case studies with results
    [ ] Star ratings/reviews
    [ ] Years in business
```

**8. Available Assets**
```
Q9: What assets do you already have?

    [ ] Product screenshots
    [ ] Demo video
    [ ] Logo (high resolution)
    [ ] Brand colors defined
    [ ] Professional photos
    [ ] Illustrations/graphics
```

**9. Technical Preferences**
```
Q10: What tech stack do you want for your landing page?

     Options:
     1. Static HTML/CSS/JS (Recommended for simplicity)
        - Single file deployment
        - Works anywhere
        - Best for: Simple landing pages, quick deployment

     2. React (Vite)
        - Component-based
        - Modern development experience
        - Best for: If you plan to extend with more pages/features

     3. Next.js
        - React + SSR/SSG
        - Built-in routing
        - Best for: SEO-focused sites, larger projects

     4. Astro
        - Zero JS by default
        - Great performance
        - Best for: Content-focused sites, maximum speed

     5. Vue (Vite)
        - Component-based
        - Simple and approachable
        - Best for: Vue ecosystem preference

     Your choice (1-5):
```

**10. Integrations & Hosting**
```
Q11: Any specific integrations needed?

     [ ] Email capture (Mailchimp, ConvertKit, etc.)
     [ ] Analytics (Google Analytics, Plausible, etc.)
     [ ] CRM (HubSpot, Salesforce, etc.)
     [ ] Payment (Stripe, PayPal, etc.)
     [ ] Chat widget (Intercom, Crisp, etc.)
     [ ] Form backend (Formspree, Netlify Forms, etc.)

     Specify which ones:

Q12: Preferred hosting platform?

     1. Netlify (Recommended - free tier, easy deployment)
     2. Vercel
     3. GitHub Pages
     4. Cloudflare Pages
     5. Self-hosted / Other

     Your choice:
```

### Save User Inputs

After collecting all inputs, save to:
```
user-preferences/{project-name}.json
```

Format:
```json
{
  "projectName": "",
  "businessDescription": "",
  "domainCategory": "saas|ecommerce|portfolio|it-support|event|demo|lead-magnet|agency|app|coming-soon|nonprofit|real-estate|other",
  "primaryConversion": "",
  "targetAudience": {
    "who": "",
    "situation": "",
    "problem": "",
    "previousAttempts": ""
  },
  "topObjections": [],
  "brandPersonality": [],
  "differentiator": "",
  "socialProof": {
    "testimonials": 0,
    "customerCount": "",
    "logos": false,
    "press": false,
    "awards": false,
    "caseStudies": false,
    "ratings": false,
    "yearsInBusiness": 0
  },
  "availableAssets": [],
  "technicalPreferences": {
    "techStack": "html|react|nextjs|astro|vue",
    "integrations": {
      "email": "",
      "analytics": "",
      "crm": "",
      "payment": "",
      "chat": "",
      "forms": ""
    },
    "hosting": "netlify|vercel|github-pages|cloudflare|other"
  },
  "collectedAt": "",
  "status": "input_complete"
}
```

### Confirm Understanding
```
Perfect! Here's what I understand:

PROJECT: {projectName}
BUSINESS: {businessDescription}
GOAL: Get visitors to {primaryConversion}

TARGET: {targetAudience summary}

MUST ADDRESS:
1. {objection1}
2. {objection2}
3. {objection3}

BRAND FEEL: {brandPersonality}
DIFFERENTIATOR: {differentiator}

Does this accurately capture your needs? (yes/edit)
```

---

## INTELLIGENT SKILL ROUTING

**CRITICAL**: After collecting user input, determine which specialist skills to invoke. This saves tokens and gives domain-appropriate output.

### Step 1: Load the domain template
Read `knowledge/domain-templates.md` and find the matching domain section. This tells you:
- Required page sections (each domain is different — a product page ≠ a portfolio ≠ an IT support page)
- Which skills to "Always invoke", "Auto-invoke", and "Skip"

### Step 2: Parse user's original prompt for explicit skill signals
Scan the user's initial message for keywords that trigger additional skills:

| Keywords in user prompt | Auto-invoke skill |
|---|---|
| "SEO", "search engine", "Google ranking", "meta tags" | `/lp-seo` |
| "analytics", "tracking", "GA4", "pixel", "conversion tracking" | `/lp-analytics` |
| "fast", "speed", "performance", "Core Web Vitals", "lightweight" | `/lp-speed` |
| "A/B test", "split test", "variants", "test different" | `/lp-abtest` |
| "lead capture", "email capture", "popup", "exit intent", "form optimization" | `/lp-leads` |
| "funnel", "upsell", "email sequence", "drip", "multi-step" | `/lp-funnel` |
| "competitor", "vs", "compared to", "differentiate from" | `/lp-competitor` |
| "inject", "chat widget", "Hotjar", "Intercom", "heatmap", "pixel code" | `/lp-inject` |
| "content strategy", "blog", "testimonials", "case study", "social proof" | `/lp-content` |
| "audit", "review my page", "score", "check quality" | `/lp-audit` |
| "optimize", "CRO", "improve conversions", "reduce bounce" | `/lp-optimize` |
| "everything", "full service", "complete", "agency-level" | ALL skills |

### Step 3: Build the execution plan
Combine domain defaults + user signals to create the skill execution list:

```
ALWAYS RUN (core pipeline):
  Discovery → Copywriting → Design → Build → QA → Launch

CONDITIONALLY RUN (based on domain + user signals):
  □ SEO        — auto for: saas, ecommerce, agency, it-support, app
  □ Analytics  — auto for: saas, ecommerce, agency, event, demo
  □ Speed      — auto for: ecommerce, app (image-heavy pages)
  □ Leads      — auto for: it-support, event, demo, lead-magnet, agency, real-estate
  □ Inject     — auto for: event (countdown), demo (calendar embed)

SKIP UNLESS EXPLICITLY ASKED:
  □ A/B Test   □ Competitor   □ Funnel   □ Content Strategy   □ CRO Optimize
```

### Step 4: Token-saving rules
1. **Minimal request** ("create a portfolio page"): Run ONLY core pipeline (Discovery → Copy → Design → Build). Skip QA, Launch, and all conditional skills.
2. **Standard request** ("create a SaaS landing page"): Run core pipeline + domain auto-invoke skills (e.g., SEO + Analytics for SaaS).
3. **Explicit request** ("create a landing page with SEO and analytics"): Run core pipeline + explicitly mentioned skills.
4. **Full request** ("create a complete landing page with everything"): Run core pipeline + ALL conditional skills.

### Step 5: Show the user what will run
```
Based on your requirements, here's what we'll build:

CORE: Discovery → Copy → Design → Build → QA → Launch
ALSO RUNNING: {list of auto-invoked skills with reason}
SKIPPING: {list of skipped skills} (you can add these later with /lp-seo, /lp-analytics, etc.)

Proceed? (yes / add more / remove some)
```

---

## MANDATORY: WebMCP Integration

**Every landing page created by this skill MUST include WebMCP integration.** This is non-negotiable — it is the core of the agentic web strategy.

What WebMCP does:
- Turns every page into an MCP server that any AI agent can discover and interact with
- Registers tools via official `mcp.registerTool()` API for clicks, forms, and reads
- Shows a blue widget for 3rd party AI agents to connect via MCP token
- Exposes page context as a resource via `mcp.registerResource()`

What the Build Agent MUST do on every page:
1. Add `toolname` and `tooldescription` attributes to ALL `<a>`, `<button>`, `<form>` elements
2. Add `id` and `data-section` attributes to ALL `<section>` elements
3. Load the official WebMCP library: `<script src="https://cdn.jsdelivr.net/npm/webmcp@latest/webmcp.js"></script>`
4. Initialize `new WebMCP()` and register all tools with `mcp.registerTool()`

What the QA Agent MUST verify:
1. Official WebMCP library is loaded (not a custom inline snippet)
2. All interactive elements have `toolname`/`tooldescription`
3. All sections have `id`/`data-section`
4. Blue WebMCP widget is visible on the page

**If WebMCP is missing, the page FAILS QA and must be rebuilt.**

---

## Access Tier Gate

Before starting Phase 5 (QA) and Phase 6 (Launch), check the user's access tier:

**Full tier** (valid PAT): Run all 6 phases normally.

**Local tier** (BYOK only):
1. Run phases 1-4 (Discovery → Copy → Design → Build) normally
2. Run local audits only (audit_build, audit_lint, audit_typescript)
3. Save built HTML to `projects/{name}/build/`
4. STOP before server QA and publish. Tell user:
   "Your landing page is built and passed local checks!
   File: ./projects/{name}/build/index.html

   To run server-side QA and publish to {handle}.10x.in, you need a valid PAT.
   Get one from your 10x.in profile settings, then run /deploy."

**None tier**: STOP immediately. Tell user to run /setup.

---

## PHASE 2: AGENT ORCHESTRATION

Once user confirms, hand off to Project Manager Agent:

```
Great! I'm now handing this to our specialist team.

Our team will work through these phases:

PHASE 1: Discovery
- [ ] Deep analysis of requirements
- [ ] Audience profiling
- [ ] Objection mapping

PHASE 2: Copywriting
- [ ] Headline creation
- [ ] Body copy writing
- [ ] CTA optimization

PHASE 3: Visual Design
- [ ] Typography selection
- [ ] Color palette creation
- [ ] Layout strategy

PHASE 4: Build
- [ ] HTML structure
- [ ] CSS styling
- [ ] JavaScript interactions

PHASE 5: QA & Testing
- [ ] Testing script creation
- [ ] Success criteria definition

PHASE 6: Launch Prep
- [ ] SEO configuration
- [ ] Analytics setup
- [ ] Deployment checklist

I'll show you the final result when everything is ready.

Working on your landing page...
```

### Phase-wise Progress Tracking

Each agent MUST track their progress. Use the best available method:
- **If TodoWrite is available**: Use it to create and update todo lists
- **If TaskCreate/TaskUpdate is available**: Use task management tools
- **Otherwise**: Track progress inline with status markers in output files

Example agent progress structure:
```json
{
  "phase": "copywriting",
  "agent": "Copywriting Agent",
  "todos": [
    {"content": "Generate 10 headline options", "status": "completed"},
    {"content": "Validate headlines against rules", "status": "completed"},
    {"content": "Write hero section copy", "status": "in_progress"},
    {"content": "Write feature descriptions", "status": "pending"},
    {"content": "Create CTA variations", "status": "pending"}
  ]
}
```

### Invoke Project Manager Agent

**Agent File**: `agents/project-manager.md`

**Invocation Context**:
```json
{
  "userPreferencesPath": "user-preferences/{project-name}.json",
  "projectPath": "projects/{project-name}/",
  "skillDir": ".claude/skills/landing-page",
  "agents": {
    "discovery": "agents/discovery-agent.md",
    "copywriting": "agents/copywriting-agent.md",
    "design": "agents/design-agent.md",
    "build": "agents/build-agent.md",
    "qa": "agents/qa-agent.md",
    "launch": "agents/launch-agent.md"
  }
}
```

**Workflow Execution**:

1. **Read Project Manager Instructions**
   - Load `agents/project-manager.md`
   - Follow its coordination protocol

2. **Execute Agent Pipeline**
   ```
   Discovery Agent → requirements/brief.json
        ↓
   [PM Review & Approve]
        ↓
   Copywriting Agent → copy/headlines.md, copy/page-copy.md
        ↓
   [PM Review & Approve]
        ↓
   Design Agent → design/strategy.md, design/colors.json, design/typography.json
        ↓
   [PM Review & Approve]
        ↓
   Build Agent → build/index.html, build/css/styles.css, build/js/main.js
        ↓
   [PM Review & Approve]
        ↓
   QA Agent → testing/test-kit.md
        ↓
   [PM Review & Approve]
        ↓
   Launch Agent → launch/checklist.md, launch/maintenance.md
        ↓
   [PM Final Review]
        ↓
   Return to Main Skill
   ```

3. **Revision Protocol**
   - If agent output doesn't match user requirements
   - PM provides specific feedback
   - Agent revises (max 2 attempts for Tier 1, max 1 for Tier 2, none for Tier 3)
   - PM approves or escalates

4. **Completion**
   - PM updates `projects/{name}/status.json`
   - PM returns summary to main skill
   - Main skill presents results to user

---

## PHASE 3: PRESENT RESULTS

When Project Manager returns with completed work:

```
Your landing page is ready!

Project Location: ./projects/{projectName}/

WHAT WE CREATED:

- Headlines & Copy
   - {headline preview}
   - {subhead preview}

- Visual Design
   - Colors: {primary color}
   - Style: {brand personality}

- Complete Landing Page
   - File: ./projects/{projectName}/build/index.html

- Testing Kit
   - User testing script included
   - 10-second test ready

- Launch Checklist
   - SEO configured
   - Analytics ready

Would you like to:
1. View the landing page
2. See the copy details
3. Review the design decisions
4. Make changes to any section
5. Get deployment instructions
```

---

## COMMANDS

### Main Commands
- `/landing-page new` - Start new project (asks domain category)
- `/landing-page resume {name}` - Continue project
- `/landing-page list` - Show all projects
- `/landing-page edit {name}` - Modify existing project

### Companion Skills (invoke directly or auto-invoked by domain)

| Command | What it does | When to use directly |
|---------|-------------|---------------------|
| `/lp-copy` | Optimize headlines, body copy, CTAs | Rewrite copy on an existing page |
| `/lp-seo` | SEO audit + meta tags + schema | Add/fix SEO on any page |
| `/lp-design` | Color palette, typography, layout system | Create/refine design tokens |
| `/lp-analytics` | GA4, pixels, event tracking | Add tracking to any page |
| `/lp-inject` | JavaScript injection (chat, heatmaps, popups) | Add third-party scripts safely |
| `/lp-audit` | 7-point page audit with scores | Audit any existing page |
| `/lp-optimize` | CRO analysis + friction reduction | Improve conversion rates |
| `/lp-funnel` | Multi-page funnel + email sequences | Build complete sales funnels |
| `/lp-leads` | Forms, popups, exit-intent | Add/improve lead capture |
| `/lp-abtest` | A/B test setup with variants + tracking | Test specific page elements |
| `/lp-competitor` | Competitor page teardown | Analyze competitor positioning |
| `/lp-content` | Content strategy + testimonial templates | Plan content assets |
| `/lp-speed` | Core Web Vitals + performance optimization | Speed up any page |

---

## ERROR HANDLING

If user input is unclear:
```
I want to make sure I understand correctly.
You mentioned: "{input}"

Could you clarify: {specific question}?
```

If user wants to skip:
```
This information helps us create a more effective landing page.

Options:
A) Provide the information now
B) Skip for now (we'll use reasonable defaults)
C) Come back to this later

What would you prefer?
```

---

## INTERNAL NOTES

- User ONLY interacts with this main skill
- User NEVER sees agent coordination
- User NEVER sees revision requests between agents
- User ONLY sees polished final output
- All methodology references are "10x Team's approach"
- Each agent MUST track progress using the best available tool (TodoWrite, TaskCreate, or inline tracking)
- Progress tracking provides visibility into overall project status
