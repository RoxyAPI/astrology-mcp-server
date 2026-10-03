# AGENTS.md

Astrology MCP server by RoxyAPI. A stdio MCP server that relays `tools/list` and `tools/call` to the hosted RoxyAPI Remote MCP servers at `https://roxyapi.com/mcp/{domain}`.

## Layout

| Path | Purpose |
|---|---|
| `src/proxy.ts` | Connects one client per domain, merges the tool catalogs, routes each call to the domain that owns the tool |
| `src/index.ts` | Entry: reads `ROXY_API_KEY` and `ROXY_MCP_DOMAINS`, serves over stdio |
| `tests/proxy.test.ts` | Catalog merge and call routing against in-memory upstreams |
| `tests/live.test.ts` | Spawns the built server and lists the hosted tools |
| `manifest.json` | Desktop extension manifest, packed by `bun run pack:mcpb` |
| `server.json` | MCP Registry entry for the remote and the npm package |
| `Dockerfile` | Container image that serves over stdio |

## Commands

```bash
bun install
bun run check      # biome
bun typecheck
bun run test       # builds dist/index.js, then runs both test files
bun run pack:mcpb  # builds astrology-mcp-server.mcpb
```

## Rules

- Tools come from the hosted servers. Never define, rename or rewrite a tool here.
- Domain slugs come from the hosted servers. Never hardcode a list in code.
- `package.json`, `manifest.json` and `server.json` carry one version; the release workflow bumps all three.
