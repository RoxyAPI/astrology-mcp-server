#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { connectUpstreams, createProxyServer, parseDomains } from './proxy';

const domains = parseDomains(process.env.ROXY_MCP_DOMAINS);
const apiKey = process.env.ROXY_API_KEY?.trim() || undefined;

await createProxyServer(() => connectUpstreams(domains, apiKey)).connect(
	new StdioServerTransport(),
);
