# Astrology MCP Server

The RoxyAPI Astrology MCP server gives any AI agent natal charts, horoscopes, synastry, transits, Vedic kundli, panchang, tarot, numerology and 18+ insight domains on one key, as hosted Remote MCP with nothing to install. RoxyAPI is the data layer for insight apps.

```text
https://roxyapi.com/mcp/astrology
```

[![npm](https://img.shields.io/npm/v/@roxyapi/astrology-mcp-server)](https://www.npmjs.com/package/@roxyapi/astrology-mcp-server)
[![CI](https://github.com/RoxyAPI/astrology-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/RoxyAPI/astrology-mcp-server/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Point an MCP client at that URL, send your key in the `X-API-Key` header, and the agent can call 258+ tools across every RoxyAPI domain. Calculations read the NASA JPL DE440 ephemeris directly and are verified against NASA JPL Horizons. Get a key at [roxyapi.com/pricing](https://roxyapi.com/pricing).

## How do I connect an AI agent to the astrology MCP server?

Use the hosted Remote MCP URL over Streamable HTTP. Every domain has its own server at `https://roxyapi.com/mcp/{domain}`, so an agent loads only the tools it needs. Add `location` beside any chart domain so the agent can turn a city name into coordinates and a timezone by itself.

```bash
export ROXY_API_KEY="your-key-from-roxyapi.com/account?tab=keys"
```

### Claude Code

```bash
claude mcp add --transport http --scope user roxy-astrology \
  https://roxyapi.com/mcp/astrology --header "X-API-Key: $ROXY_API_KEY"
```

Writing integration code rather than calling tools at run time? Point Claude Code at the documentation server instead: `claude mcp add --transport http roxy-docs https://roxyapi.com/mcp/docs`.

### Claude Desktop

Claude Desktop starts local servers from `claude_desktop_config.json`, so use the [stdio package](#local-stdio-server) below, or install the `.mcpb` file from the [latest release](https://github.com/RoxyAPI/astrology-mcp-server/releases/latest) in one click and paste your key when asked.

```json
{
  "mcpServers": {
    "roxy-astrology": {
      "command": "npx",
      "args": ["-y", "@roxyapi/astrology-mcp-server"],
      "env": { "ROXY_API_KEY": "your-key" }
    }
  }
}
```

### ChatGPT (Responses API)

```ts
import OpenAI from 'openai';

const openai = new OpenAI();
const response = await openai.responses.create({
  model: 'gpt-4o',
  tools: [
    {
      type: 'mcp',
      server_label: 'roxy_astrology',
      server_url: 'https://roxyapi.com/mcp/astrology',
      authorization: process.env.ROXY_API_KEY,
      require_approval: 'never',
    },
  ],
  input: 'What is the Sun sign for someone born 1990-05-12 at 14:30 in New York?',
});
```

### Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "roxy-astrology": {
      "url": "https://roxyapi.com/mcp/astrology",
      "headers": { "X-API-Key": "${env:ROXY_API_KEY}" }
    }
  }
}
```

### Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.roxy-astrology]
url = "https://roxyapi.com/mcp/astrology"
env_http_headers = { "X-API-Key" = "ROXY_API_KEY" }
```

### n8n

1. Add an **AI Agent** node and connect an **MCP Client Tool** node to its **Tools** input.
2. **Endpoint** `https://roxyapi.com/mcp/astrology`, **Server Transport** HTTP Streamable.
3. **Authentication** Header Auth, name `X-API-Key`, value your key.

Add one MCP Client Tool node per domain. Use a secret key: publishable `pk_` keys are refused on the MCP servers.

## Local stdio server

For clients that only start local servers over stdio. The package relays to the same hosted servers, so the tools, the answers and the billing are identical to Remote MCP.

```bash
ROXY_API_KEY=your-key npx -y @roxyapi/astrology-mcp-server
```

| Variable | Default | Meaning |
|---|---|---|
| `ROXY_API_KEY` | none | Your RoxyAPI key |
| `ROXY_MCP_DOMAINS` | `astrology` | Comma separated domains to load, for example `astrology,vedic-astrology,location` |

A container image builds from the `Dockerfile` in this repository: `docker build -t astrology-mcp-server .` then `docker run -i --rm -e ROXY_API_KEY astrology-mcp-server`.

## Which domains does it cover?

One key reaches every domain. Each slug is a Remote MCP server at `https://roxyapi.com/mcp/{slug}` and a valid `ROXY_MCP_DOMAINS` value.

| Domain | Slug |
|---|---|
| Western astrology | `astrology` |
| Vedic astrology | `vedic-astrology` |
| Forecast | `forecast` |
| Human design | `human-design` |
| Chinese astrology | `chinese-astrology` |
| Feng shui | `feng-shui` |
| Mesoamerican astrology | `mesoamerican-astrology` |
| Vastu | `vastu` |
| Numerology | `numerology` |
| Kabbalah | `kabbalah` |
| Tarot | `tarot` |
| Biorhythm | `biorhythm` |
| Ayurveda | `ayurveda` |
| I Ching | `iching` |
| Crystals | `crystals` |
| Dreams | `dreams` |
| Angel numbers | `angel-numbers` |
| Location and timezone | `location` |

## What can the astrology tools do?

The Western astrology server covers natal charts, daily, weekly, monthly and yearly horoscopes, synastry, composite charts and compatibility scores, transits, progressions, solar arc, profections, solar, lunar and planetary returns, astrocartography, aspects, houses, fixed stars, asteroids and moon phases. The Vedic server adds the kundli birth chart, divisional charts, panchang, Vimshottari dasha from mahadasha down to sookshma, doshas, yogas, shadbala, ashtakavarga, KP astrology and kundli matching. Every tool carries a typed input schema, so the agent fills arguments correctly on the first call.

## How accurate are the calculations?

Planetary positions read the NASA JPL DE440 ephemeris directly and are verified against NASA JPL Horizons. The method and the test suite are published at [roxyapi.com/methodology](https://roxyapi.com/methodology).

## Do I need to install anything?

No. Remote MCP is the default: paste the URL and your key into any client that speaks Streamable HTTP. The npm package exists only for clients that start local stdio servers.

## How much does it cost?

One subscription covers every domain, every endpoint and every MCP server, with flat monthly pricing and no per-domain add-ons. Plans are at [roxyapi.com/pricing](https://roxyapi.com/pricing).

## Which languages are supported?

Responses are available in 10+ languages, including English, Hindi, Spanish, German, French, Portuguese, Russian, Turkish and Chinese.

## Related RoxyAPI repositories

- [sdk-typescript](https://github.com/RoxyAPI/sdk-typescript), [sdk-python](https://github.com/RoxyAPI/sdk-python), [sdk-php](https://github.com/RoxyAPI/sdk-php), [sdk-go](https://github.com/RoxyAPI/sdk-go), [sdk-dotnet](https://github.com/RoxyAPI/sdk-dotnet): typed SDKs for the same API
- [ui](https://github.com/RoxyAPI/ui): drop-in chart and reading components
- [claude-plugin](https://github.com/RoxyAPI/claude-plugin): RoxyAPI skill and docs server for Claude Code
- [astrology-ai-chatbot](https://github.com/RoxyAPI/astrology-ai-chatbot): an open source astrology chatbot built on these MCP servers
- [astrology-api-openapi](https://github.com/RoxyAPI/astrology-api-openapi): the OpenAPI specification
- [astrology-api-benchmark](https://github.com/RoxyAPI/astrology-api-benchmark): the published accuracy benchmark

Full MCP guide: [roxyapi.com/docs/mcp](https://roxyapi.com/docs/mcp).

## License

MIT
