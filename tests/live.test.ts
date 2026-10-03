import { expect, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const { ROXY_API_KEY: _, ...env } = process.env as Record<string, string>;

test('the built server lists the hosted astrology and vedic astrology tools', async () => {
	const client = new Client({ name: 'live-test', version: '0.0.0' });
	await client.connect(
		new StdioClientTransport({
			command: 'node',
			args: ['dist/index.js'],
			env: { ...env, ROXY_MCP_DOMAINS: 'astrology,vedic-astrology' },
		}),
	);
	try {
		const names = (await client.listTools()).tools.map((t) => t.name);
		expect(names.some((n) => n.startsWith('get_astrology_'))).toBe(true);
		expect(names.some((n) => n.includes('_vedic_astrology_'))).toBe(true);
		expect(new Set(names).size).toBe(names.length);
	} finally {
		await client.close();
	}
}, 30_000);
