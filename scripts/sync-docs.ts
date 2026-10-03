#!/usr/bin/env bun
/**
 * Regenerates the live-derived regions of README.md:
 *   - `<!-- BEGIN:DOMAINS -->` the domain table, one row per hosted MCP server, in spec tag order.
 *   - `<!-- BEGIN:TOOLS -->` the total tool count across those servers, rendered as `N+`.
 *
 * Inputs are the live OpenAPI spec and a `tools/list` on each hosted server, so a new domain or
 * tool reaches the README with no edit here. A tag whose server answers 404 has no MCP server
 * and is left out. Fails loudly when a tag spans two path segments, a server answers anything
 * but 200 or 404, or a marker is missing.
 *
 * Run with: bun run docs:sync
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { REMOTE_MCP_BASE } from '../src/proxy';

const SPEC_URL = 'https://roxyapi.com/api/v2/openapi.json';
const README_PATH = 'README.md';

type Spec = {
	tags?: { name: string }[];
	paths?: Record<string, Record<string, { tags?: string[] }>>;
};

function fail(message: string): never {
	console.error(`sync-docs: ${message}`);
	process.exit(1);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, init);
	if (!res.ok) fail(`${url} answered ${res.status}`);
	return (await res.json()) as T;
}

/** Tool count of the hosted server for a slug, or undefined when no server is mounted there. */
async function toolCount(slug: string): Promise<number | undefined> {
	const url = `${REMOTE_MCP_BASE}/${slug}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json, text/event-stream',
		},
		body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
	});
	if (res.status === 404) return undefined;
	if (!res.ok) fail(`${url} answered ${res.status}`);
	const body = (await res.json()) as { result?: { tools?: unknown[] } };
	const count = body.result?.tools?.length;
	if (!count) fail(`${url} listed no tools`);
	return count;
}

const spec = await fetchJson<Spec>(SPEC_URL);

const segmentsByTag = new Map<string, Set<string>>();
for (const [path, methods] of Object.entries(spec.paths ?? {})) {
	for (const op of Object.values(methods)) {
		const tag = op.tags?.[0];
		const segment = path.split('/')[1];
		if (!tag || !segment) continue;
		if (!segmentsByTag.has(tag)) segmentsByTag.set(tag, new Set());
		segmentsByTag.get(tag)?.add(segment);
	}
}

const tags = (spec.tags ?? []).map((t) => t.name);
if (!tags.length) fail(`${SPEC_URL} has no tags`);

const rows = await Promise.all(
	tags.map(async (name) => {
		const segments = [...(segmentsByTag.get(name) ?? [])];
		if (segments.length !== 1)
			fail(
				`tag "${name}" spans ${segments.length} path segments, expected one`,
			);
		const slug = segments[0] as string;
		return { name, slug, tools: await toolCount(slug) };
	}),
);
const servers = rows.filter((r) => r.tools !== undefined);
const total = servers.reduce((sum, r) => sum + (r.tools ?? 0), 0);

const table = [
	'| Domain | Slug | Tools |',
	'|---|---|---|',
	...servers.map((r) => `| ${r.name} | \`${r.slug}\` | ${r.tools} |`),
].join('\n');

function replaceRegion(
	text: string,
	marker: string,
	content: string,
	block: boolean,
): string {
	const begin = `<!-- BEGIN:${marker} -->`;
	const end = `<!-- END:${marker} -->`;
	const from = text.indexOf(begin);
	const to = text.indexOf(end);
	if (from === -1 || to < from)
		fail(`${README_PATH} is missing ${begin} or ${end}`);
	const inner = block ? `\n${content}\n` : content;
	return text.slice(0, from + begin.length) + inner + text.slice(to);
}

let readme = readFileSync(README_PATH, 'utf-8');
readme = replaceRegion(readme, 'DOMAINS', table, true);
readme = replaceRegion(readme, 'TOOLS', `${total}+`, false);
writeFileSync(README_PATH, readme);

console.log(`sync-docs: ${servers.length} servers, ${total} tools`);
