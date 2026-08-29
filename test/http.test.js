'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

test('เว็บแสดง dashboard, API และรับ action ผ่าน Controller', async (t) => {
  const { server } = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const dashboard = await fetch(`${base}/`);
  assert.equal(dashboard.status, 200);
  assert.match(await dashboard.text(), /Ladkrabang's Got Talent/);

  const action = await fetch(`${base}/contestants/P01/decisions`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ judgeId: 'J02', result: 'PASS' })
  });
  assert.equal(action.status, 303);

  const stateResponse = await fetch(`${base}/api/state`);
  const state = await stateResponse.json();
  assert.equal(state.contestants.find((item) => item.id === 'P01').decisionCount, 2);
});
