import {
	Client,
	StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { Server, type Tool } from '@modelcontextprotocol/server';
import pkg from '../package.json' with { type: 'json' };

/** Base of the hosted RoxyAPI Remote MCP servers, one per domain at `{base}/{domain}`. */
export const REMOTE_MCP_BASE = 'https://roxyapi.com/mcp';

/** The slice of a connected MCP client the proxy relays to. */
export type Upstream = Pick<Client, 'listTools' | 'callTool'>;

/** Comma separated domain slugs, trimmed and de-duplicated. Defaults to `astrology`. */
export function parseDomains(raw: string | undefined): string[] {
	const domains = (raw ?? '')
		.split(',')
		.map((d) => d.trim().toLowerCase())
		.filter(Boolean);
	return domains.length ? [...new Set(domains)] : ['astrology'];
}

/** Opens one Streamable HTTP client per domain, in parallel. */
export function connectUpstreams(
	domains: string[],
	apiKey: string | undefined,
): Promise<Upstream[]> {
	const headers: Record<string, string> = apiKey ? { 'X-API-Key': apiKey } : {};
	return Promise.all(
		domains.map(async (domain) => {
			const client = new Client({ name: pkg.name, version: pkg.version });
			await client.connect(
				new StreamableHTTPClientTransport(
					new URL(`${REMOTE_MCP_BASE}/${domain}`),
					{ requestInit: { headers } },
				),
			);
			return client;
		}),
	);
}

/**
 * A stdio-facing MCP server that lists the tools of every upstream as one
 * catalog and forwards each call to the upstream that owns the tool. Tool
 * names carry their domain, so the first upstream to list a name owns it.
 */
export function createProxyServer(load: () => Promise<Upstream[]>): Server {
	let catalog:
		| Promise<{ tools: Tool[]; owners: Map<string, Upstream> }>
		| undefined;

	const resolve = () => {
		catalog ??= (async () => {
			const upstreams = await load();
			const owners = new Map<string, Upstream>();
			const tools: Tool[] = [];
			for (const upstream of upstreams) {
				for (const tool of (await upstream.listTools()).tools) {
					if (owners.has(tool.name)) continue;
					owners.set(tool.name, upstream);
					tools.push(tool);
				}
			}
			return { tools, owners };
		})().catch((error) => {
			catalog = undefined;
			throw error;
		});
		return catalog;
	};

	const server = new Server(
		{ name: pkg.name, version: pkg.version },
		{ capabilities: { tools: {} } },
	);

	server.setRequestHandler('tools/list', async () => ({
		tools: (await resolve()).tools,
	}));

	server.setRequestHandler('tools/call', async (request) => {
		const owner = (await resolve()).owners.get(request.params.name);
		if (!owner) {
			return {
				isError: true,
				content: [
					{ type: 'text', text: `Unknown tool: ${request.params.name}` },
				],
			};
		}
		return owner.callTool(request.params);
	});

	return server;
}
