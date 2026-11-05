import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/model/globe.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { GLOBE_EVENT_SPAN, GLOBE_PERIOD, GLOBE_ROUTES, GLOBE_TOTAL, NATIONS, globeState } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('inventory is conserved across departures and arrivals', () => {
  for (let step = 0; step <= 2400; step++) {
    const state = globeState(step / 4);
    assert.equal(state.stocks.length, NATIONS.length);
    assert.equal(state.stored + state.transit, GLOBE_TOTAL, `t=${state.t}`);
    assert.equal(state.shipments.reduce((sum, shipment) => sum + shipment.amount, 0), state.transit);
    assert.ok(state.stocks.every((stock) => Number.isFinite(stock) && stock >= 0), `t=${state.t}`);
  }
});

test('shipment and transition indicators use the same route clock', () => {
  for (const [routeIndex, route] of GLOBE_ROUTES.entries()) {
    const departAt = route.offset + GLOBE_PERIOD * 3;
    const before = globeState(departAt - 0.001);
    const departed = globeState(departAt);
    const departure = departed.events.find((event) => event.route === routeIndex && event.kind === 'depart');
    assert.ok(departure, `route ${routeIndex} departure`);
    assert.ok(Math.abs(departure.age) < 1e-8);
    assert.equal(departure.amount, route.amount);
    assert.equal(departed.stocks[route.from], before.stocks[route.from] - route.amount);
    assert.equal(departed.shipments.find((shipment) => shipment.route === routeIndex)?.progress, 0);

    const mid = globeState(departAt + route.duration / 2);
    const shipment = mid.shipments.find((item) => item.route === routeIndex);
    assert.ok(shipment, `route ${routeIndex} in transit`);
    assert.ok(Math.abs(shipment.progress - 0.5) < 1e-8);

    const arriveAt = departAt + route.duration;
    const beforeArrival = globeState(arriveAt - 0.001);
    const arrived = globeState(arriveAt);
    const arrival = arrived.events.find((event) => event.route === routeIndex && event.kind === 'arrive');
    assert.ok(arrival, `route ${routeIndex} arrival`);
    assert.ok(Math.abs(arrival.age) < 1e-8);
    assert.equal(arrived.stocks[route.to], beforeArrival.stocks[route.to] + route.amount);
    assert.equal(arrived.shipments.some((item) => item.route === routeIndex), false);

    const ended = globeState(arriveAt + GLOBE_EVENT_SPAN);
    assert.equal(ended.events.some((event) => event.route === routeIndex && event.kind === 'arrive'), false);
  }
});

test('invalid times normalize to zero and the state is deterministic', () => {
  assert.deepEqual(globeState(Number.NaN), globeState(0));
  assert.deepEqual(globeState(-10), globeState(0));
  assert.deepEqual(globeState(91.25), globeState(91.25));
});
