---
name: agent-browser
description: Browser automation CLI for local dev and debugging. Use when the user needs to inspect, interact with, or debug the running local app — navigating pages, clicking, filling forms, taking screenshots, diffing UI changes, or inspecting network requests. Triggers on "open the app", "check the UI", "screenshot this page", "debug the browser", "inspect the network", "what does X look like".
allowed-tools: Bash(agent-browser:*)
---

# agent-browser — Local Dev & Debug

The app runs at `http://localhost:3000` (`bun dev`). Always target that unless told otherwise.

## Security defaults (always apply)

```bash
# Wrap page content in tamper-evident markers (mitigates prompt injection)
export AGENT_BROWSER_CONTENT_BOUNDARIES=1

# Restrict navigation to localhost only
export AGENT_BROWSER_ALLOWED_DOMAINS="localhost,127.0.0.1"

# Cap output to prevent context flooding
export AGENT_BROWSER_MAX_OUTPUT=30000
```

Set these at the start of every browser session. Never store credentials in state files — use env vars or the auth vault only.

## Core workflow

Every interaction follows this pattern:

1. **Open** the URL
2. **Snapshot** to get element refs (`@e1`, `@e2`, …)
3. **Interact** using those refs
4. **Re-snapshot** after any navigation or DOM change

```bash
export AGENT_BROWSER_CONTENT_BOUNDARIES=1 AGENT_BROWSER_ALLOWED_DOMAINS="localhost,127.0.0.1"

agent-browser open http://localhost:3000
agent-browser wait --load networkidle
agent-browser snapshot -i
# @e1 [link] "Home", @e2 [button] "Login", …

agent-browser click @e2
agent-browser wait --load networkidle
agent-browser snapshot -i   # re-snapshot — refs are now stale
```

## Headed mode (visual debugging)

Use `--headed` whenever you need to see what's happening:

```bash
agent-browser --headed open http://localhost:3000
agent-browser highlight @e1        # highlight an element
agent-browser inspect              # open Chrome DevTools
agent-browser record start debug.webm  # record the session
```

Or set `AGENT_BROWSER_HEADED=1` to make all commands headed.

## Essential commands

```bash
# Navigation
agent-browser open <url>              # navigate (aliases: goto, navigate)
agent-browser close                   # close session

# Snapshot
agent-browser snapshot -i             # interactive elements with refs
agent-browser snapshot -s "#selector" # scope to CSS selector

# Interaction
agent-browser click @e1
agent-browser fill @e1 "text"         # clear then type
agent-browser type @e1 "text"         # type without clearing
agent-browser select @e1 "option"
agent-browser check @e1
agent-browser press Enter
agent-browser scroll down 500

# Wait
agent-browser wait --load networkidle
agent-browser wait @e1
agent-browser wait --url "**/dashboard"
agent-browser wait --text "Welcome"
agent-browser wait "#spinner" --state hidden

# Get info
agent-browser get text @e1
agent-browser get url
agent-browser get title

# Capture
agent-browser screenshot              # to temp dir
agent-browser screenshot --full       # full page
agent-browser screenshot --annotate   # numbered labels overlaid (vision mode)

# Network inspection
agent-browser network requests
agent-browser network requests --type xhr,fetch
agent-browser network requests --method POST --status 2xx

# JavaScript
agent-browser eval 'document.title'
agent-browser eval --stdin <<'EOF'
JSON.stringify(Array.from(document.querySelectorAll('h1')).map(h => h.textContent))
EOF
```

## Diffing UI changes

Use `diff` to verify a change had the intended effect:

```bash
agent-browser snapshot -i              # baseline
agent-browser click @e2                # action
agent-browser diff snapshot            # what changed in the accessibility tree

# Visual regression
agent-browser screenshot before.png
# … make a code change, reload …
agent-browser open http://localhost:3000 && agent-browser wait --load networkidle
agent-browser diff screenshot --baseline before.png
```

## Responsive / viewport testing

```bash
agent-browser set viewport 1440 900    # desktop
agent-browser set viewport 390 844     # mobile (iPhone 14)
agent-browser set device "iPhone 14"   # sets viewport + user agent
agent-browser screenshot mobile.png
```

## Annotated screenshots (vision mode)

When elements are visually-only or unlabeled:

```bash
agent-browser screenshot --annotate
# Legend: [1] @e1 button "Submit", [2] @e2 link "Home", …
agent-browser click @e2   # use ref from legend
```

## Dashboard (live viewport)

```bash
agent-browser dashboard install   # once
agent-browser dashboard start     # runs on :4848
# open http://localhost:4848 in a real browser to watch sessions live
agent-browser dashboard stop
```

## Ref lifecycle — important

Refs are invalidated after navigation, form submission, or dynamic DOM changes. Always re-snapshot:

```bash
agent-browser click @e5        # navigates
agent-browser snapshot -i      # MUST re-snapshot before using any ref
agent-browser click @e1
```

## Chaining

Chain commands with `&&` when intermediate output isn't needed:

```bash
agent-browser open http://localhost:3000 && agent-browser wait --load networkidle && agent-browser snapshot -i
```

Use separate calls when you need to read refs from snapshot output before proceeding.

## Timeouts

Default is 25 s. Override with `AGENT_BROWSER_DEFAULT_TIMEOUT` (ms). For slow pages, always prefer explicit waits over relying on the timeout.
