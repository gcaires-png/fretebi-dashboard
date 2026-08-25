/**
 * Testes do Cloudflare Worker sem deploy: Node 22 ja tem Request/Response
 * globais, entao da pra chamar `worker.fetch()` direto e checar as rotas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../../proxy/worker.js';

const ORIGIN = 'https://gcaires-png.github.io';
const ENV = { ALLOWED_ORIGINS: ORIGIN };

const req = (path, { method = 'GET', body, origin = ORIGIN } = {}) =>
  new Request(`https://proxy.workers.dev${path}`, {
    method,
    headers: { Origin: origin, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

const chamar = async (path, opts, env = ENV) => {
  const r = await worker.fetch(req(path, opts), env);
  return { status: r.status, corpo: await r.json() };
};

const OPERACAO = {
  origem: 'Tres Lagoas, MS', destino: 'Sorriso, MT',
  valorNF: 212424.33, tipoVeiculo: 'truck',
  km: 1450, pedagio: 450, entregas: 2, margemLiquida: 0.12,
};

test('/health mostra o estado das integracoes', async () => {
  const { status, corpo } = await chamar('/health');
  assert.equal(status, 200);
  assert.equal(corpo.ok, true);
  assert.equal(corpo.integracoes.qualp, false);
  assert.equal(corpo.integracoes.bsoft_gravacao, false);
});

test('preflight CORS libera POST', async () => {
  const r = await worker.fetch(req('/cotacao', { method: 'OPTIONS' }), ENV);
  assert.equal(r.status, 204);
  assert.match(r.headers.get('Access-Control-Allow-Methods'), /POST/);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
});

test('POST /cotacao devolve preco, leilao e alertas', async () => {
  const { status, corpo } = await chamar('/cotacao', { method: 'POST', body: OPERACAO });
  assert.equal(status, 200);
  assert.ok(Math.abs(corpo.preco - 13623) < 60, `preco fora do esperado: ${corpo.preco}`);
  assert.ok(corpo.pisoLegalANTT > 7800 && corpo.pisoLegalANTT < 7900);
  assert.equal(corpo.leilao.naoOfertarAbaixoDe, corpo.pisoLegalANTT);
  assert.equal(corpo.impostos.icmsNominal, 0.12, 'MS->MT = 12%');
  assert.ok(corpo.alertas.some(a => /DERIVADO/.test(a.msg)));
});

test('POST /cotacao com precoOfertado avalia o lance e o teto do motorista', async () => {
  const { corpo } = await chamar('/cotacao', {
    method: 'POST', body: { ...OPERACAO, precoOfertado: 11000 },
  });
  assert.ok(corpo.avaliacaoDoLance.lucroLiquido < 0, 'R$ 11.000 da prejuizo');
  assert.equal(corpo.avaliacaoDoLance.viavel, false);
  assert.equal(corpo.tetoMotorista.respeitaPiso, false);
});

test('POST /cotacao sem km e sem QUALP_TOKEN falha explicando', async () => {
  const { status, corpo } = await chamar('/cotacao', {
    method: 'POST', body: { ...OPERACAO, km: undefined },
  });
  assert.equal(status, 400);
  assert.match(corpo.error, /sem km/);
});

test('/qualp sem token avisa em vez de estourar', async () => {
  const { status, corpo } = await chamar('/qualp/rota?origem=A,MS&destino=B,MT');
  assert.equal(status, 503);
  assert.match(corpo.error, /QUALP_TOKEN/);
});

test('/bsoft fica em simulacao enquanto BSOFT_HABILITADO nao for true', async () => {
  const cot = (await chamar('/cotacao', { method: 'POST', body: OPERACAO })).corpo;
  const { status, corpo } = await chamar('/bsoft/cte-rascunho', {
    method: 'POST', body: { cotacao: cot, operacao: { tomadorTipo: 'comercio' } },
  });
  assert.equal(status, 200);
  assert.equal(corpo.modo, 'simulacao');
  assert.equal(corpo.rascunho.rascunho, true);
  assert.equal(corpo.rascunho.identificacao.cfop, '6353');
  assert.match(corpo.rascunho.status, /REVISAO HUMANA/);
});

test('rotas da Videl continuam somente-leitura', async () => {
  const { status, corpo } = await chamar('/shipments', { method: 'POST', body: { x: 1 } });
  assert.equal(status, 405);
  assert.equal(corpo.error, 'method_not_allowed');
});

test('origem nao autorizada e barrada', async () => {
  const { status, corpo } = await chamar('/cotacao', {
    method: 'POST', body: OPERACAO, origin: 'https://site-aleatorio.com',
  });
  assert.equal(status, 403);
  assert.equal(corpo.error, 'origin_not_allowed');
});

test('rota desconhecida e negada', async () => {
  const { status } = await chamar('/bsoft/emitir', { method: 'POST', body: {} });
  assert.equal(status, 403);
});
