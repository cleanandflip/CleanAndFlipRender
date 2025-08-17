#!/usr/bin/env node
import fetch from 'node-fetch';

const base = process.env.BASE_URL || 'http://localhost:3000';

async function check(path, expect = 200) {
	const res = await fetch(base + path, { method: 'GET' });
	const ok = res.status === expect;
	let body;
	try { body = await res.json(); } catch { body = await res.text(); }
	console.log(`${ok ? 'OK' : 'FAIL'} ${res.status} GET ${path}`);
	if (!ok) {
		console.log('Body:', body);
		process.exitCode = 1;
	}
	return body;
}

(async () => {
	await check('/health', 200);
	await check('/api/products', 200);
	await check('/api/categories', 200);
	await check('/api/admin/system/health', 401); // protected
	console.log('Smoke tests completed');
})();