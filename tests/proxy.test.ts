import { describe, expect, test } from 'bun:test';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import type { Tool } from '@modelcontextprotocol/server';
import { createProxyServer, parseDomains, type Upstream } from '../src/proxy';

const tool = (name: string): Tool => ({
	name,
	inputSchema: { type: 'object' },
});

/** An upstream that lists the given tools and records every call it receives. */
function fakeUpstream(names: string[]) {
	const calls: unknown[] = [];
	const upstream = {
		listTools: async () => ({ tools: names.map(tool) }),
		callTool: async (params: unknown) => {
			calls.push(params);
			return { content: [{ type: 'text', text: names[0] }] };
		},
	} as unknown as Upstream;
	return { upstream, calls };
}

async function connect(upstreams: Upstream[]) {
	const [clientEnd, serverEnd] = InMemoryTransport.createLinkedPair();
	await createProxyServer(async () => upstreams).connect(serverEnd);
	const client = new Client({ name: 'test', version: '0.0.0' });
	await client.connect(clientEnd);
	return client;
}

describe('createProxyServer', () => {
	test('merges every upstream catalog and routes each call to its owner', async () => {
		const western = fakeUpstream(['get_astrology_signs', 'shared_name']);
		const vedic = fakeUpstream(['get_vedic_astrology_rashis', 'shared_name']);
		const client = await connect([western.upstream, vedic.upstream]);

		const { tools } = await client.listTools();
		expect(tools.map((t) => t.name)).toEqual([
			'get_astrology_signs',
			'shared_name',
			'get_vedic_astrology_rashis',
		]);

		const args = { sign: 'aries' };
		await client.callTool({
			name: 'get_vedic_astrology_rashis',
			arguments: args,
		});
		await client.callTool({ name: 'shared_name', arguments: {} });
		expect(vedic.calls).toEqual([
			expect.objectContaining({
				name: 'get_vedic_astrology_rashis',
				arguments: args,
			}),
		]);
		expect(western.calls).toEqual([
			expect.objectContaining({ name: 'shared_name' }),
		]);
	});

	test('answers an unknown tool as a tool error', async () => {
		const client = await connect([
			fakeUpstream(['get_astrology_signs']).upstream,
		]);
		const result = await client.callTool({ name: 'nope', arguments: {} });
		expect(result.isError).toBe(true);
	});
});

describe('parseDomains', () => {
	test('defaults to astrology and normalises a comma list', () => {
		expect(parseDomains(undefined)).toEqual(['astrology']);
		expect(parseDomains(' ')).toEqual(['astrology']);
		expect(parseDomains('Astrology, vedic-astrology,astrology')).toEqual([
			'astrology',
			'vedic-astrology',
		]);
	});
});
