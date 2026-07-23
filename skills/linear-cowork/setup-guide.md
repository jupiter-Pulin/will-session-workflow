# Linear MCP Setup Guide

Linear's MCP server is a **remote MCP server** — centrally hosted and managed by Linear. It uses OAuth 2.1 for authentication.

**Endpoints:**
- HTTP (recommended): `https://mcp.linear.app/mcp`
- SSE: `https://mcp.linear.app/sse`

---

## Claude Code

### Install

```bash
claude mcp add --transport http linear-server https://mcp.linear.app/mcp
```

### Authenticate

Run `/mcp` in Claude Code. You will see `linear-server` listed as needing authentication — click it to open the browser OAuth flow and grant access.

---

## OpenAI Codex

### Install via CLI (Recommended)

```bash
codex mcp add linear --url https://mcp.linear.app/mcp
```

This will automatically prompt you to log in with your Linear account.

### Or configure manually in config.toml

Add the following to `~/.codex/config.toml`:

```toml
[features]
experimental_use_rmcp_client = true

[mcp_servers.linear]
url = "https://mcp.linear.app/mcp"
```

Then authenticate:

```bash
codex mcp login linear
```

### Verify

In a Codex session, try listing your Linear issues to confirm the connection works.

---

## Cursor

Click [here](https://cursor.com/mcp?install=linear) to install directly, or search for Linear from Cursor's MCP tools page.

### Manual setup

Add to your project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"]
    }
  }
}
```

### Verify

In Cursor's AI chat, ask it to list your Linear issues. If it returns results, the connection is working.

---

## VS Code

1. `Ctrl/Cmd+P` and search for **MCP: Add Server**
2. Select **Command (stdio)**
3. Enter: `npx mcp-remote https://mcp.linear.app/mcp`
4. Name it `Linear` and hit enter
5. Activate via **MCP: List Servers** > Linear > Start Server

---

## Windsurf

1. `Ctrl/Cmd+,` to open Windsurf settings
2. Scroll to **Cascade > MCP servers**
3. Select **Add Server > Add custom server**
4. Add the following:

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"]
    }
  }
}
```

---

## Zed

`Cmd+,` to open Zed settings, then add:

```json
{
  "context_servers": {
    "linear": {
      "source": "custom",
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"],
      "env": {}
    }
  }
}
```

---

## Other Clients

For any MCP-compatible client:

- **Command**: `npx`
- **Arguments**: `-y mcp-remote https://mcp.linear.app/mcp`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| MCP server not found | Ensure Node.js >= 18 is installed and `npx` is available |
| OAuth flow doesn't open | Try restarting the MCP server; check firewall or browser popup blockers |
| Authentication expired | Remove and re-add the MCP server, then re-authenticate |
| Connection timeout | Check your network; Linear API requires internet access |
