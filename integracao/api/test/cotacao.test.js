import { test } from 'node:test';
import assert from 'node:assert/strict';

import { pisoANTT, eixosDe } from '../lib/antt.js';
import { cotar, aliquotaICMS, estrategiaLeilao, avaliarPreco, tetoMotorista } from '../lib/cotacao.js';
import { normalizar, QualpError } from '../lib/qualp.js';
import { montarRascunhoCTe, GUARDA_EMISSAO, BsoftError } from '../lib/bsoft.js';

const perto = (a, b, tol = 0.02) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b} (tol ${tol})`);

// ---------- ANTT ----------

test('eixosDe reconhece a descricao solta do formulario', () => {
  assert.equal(eixosDe('truck sider ou aberto 9 metros'), 3);
  assert.equal(eixosDe('carreta'), 5);
  assert.equal(eixosDe('rodotrem'), 9);
  assert.equal(eixosDe(3), 3);
  assert.equal(eixosDe('nave espacial'), null);
});

test('piso ANTT bate com a formula km*ccd + cc', () => {
  const r = pisoANTT({ km: 1450, tipoVeiculo: 'truck' });
  assert.equal(r.eixos, 3);
  perto(r.piso, 1450 * 5.0306 + 570.74);
  assert.equal(r.conferir, true, '3 eixos e derivado, tem de pedir conferencia');
});

test('linhas publicadas nao pedem conferencia', () => {
  assert.equal(pisoANTT({ km: 100, eixos: 2 }).conferir, false);
  assert.equal(pisoANTT({ km: 100, eixos: 9 }).conferir, false);
});

test('piso rejeita km invalido e veiculo desconhecido', () => {
  assert.throws(() => pisoANTT({ km: 0, eixos: 3 }), /km deve ser > 0/);
  assert.throws(() => pisoANTT({ km: 100, tipoVeiculo: 'zeppelin' }), /nao consegui deduzir eixos/);
});

// ---------- ICMS ----------

test('ICMS interestadual segue a Res. Senado 22/89', () => {
  assert.equal(aliquotaICMS('SP', 'MA'), 0.07);  // Sudeste -> Nordeste
  assert.equal(aliquotaICMS('MS', 'MT'), 0.12);  // Centro-Oeste -> Centro-Oeste
  assert.equal(aliquotaICMS('ES', 'BA'), 0.12);  // ES nao goza da 7%
  assert.equal(aliquotaICMS('SP', 'RJ'), 0.12);  // Sudeste -> Sudeste
});

// ---------- Motor de cotacao ----------

const CASO = {
  km: 1450, valorNF: 212424.33, tipoVeiculo: 'truck',
  ufOrigem: 'MS', ufDestino: 'MT', pedagio: 450, entregas: 2, margemLiquida: 0.12,
};

test('cotacao do caso Tres Lagoas -> Sorriso fecha ~R$ 13.650', () => {
  const c = cotar(CASO);
  perto(c.preco, 13650, 60);
  perto(c.pisoLegalANTT, 7865.15, 1);
  perto(c.custos.seguroRCDC, 38.24, 0.05);
  perto(c.custos.entregasExtras, 200, 0.01);
});

test('a margem liquida pedida e a que sai', () => {
  for (const m of [0.08, 0.12, 0.2]) {
    const c = cotar({ ...CASO, margemLiquida: m });
    const liquido = c.preco - c.custos.custoTotal - c.impostos.valor - c.comissoes.valor;
    perto(liquido / c.preco, m, 0.0005);
  }
});

test('ICMS cheio encarece o preco', () => {
  const base = cotar(CASO);
  const cheio = cotar({ ...CASO, opts: { icmsCreditoOutorgado: false } });
  assert.ok(cheio.preco > base.preco);
  perto(cheio.impostos.aliquotaICMS, 0.12);
  perto(base.impostos.aliquotaICMS, 0.096);
});

test('break-even zera o lucro mas cobre imposto e comissao', () => {
  const c = cotar(CASO);
  const carga = c.impostos.cargaTributaria + c.comissoes.percentual;
  perto(c.breakEven * (1 - carga), c.custos.custoTotal, 0.05);
  assert.ok(c.breakEven < c.preco);
});

test('motorista abaixo do piso ANTT vira BLOQUEIO', () => {
  const c = cotar({ ...CASO, custoMotorista: 6000 });
  assert.ok(c.alertas.some(a => a.nivel === 'BLOQUEIO' && /ABAIXO do piso/.test(a.msg)));
});

test('preco derivado mantem a razao motorista/preco quase fixa', () => {
  // propriedade estrutural: subir o custo do motorista sobe o preco junto.
  // por isso a meta 60-62% so morde quando o preco e DADO (ver avaliarPreco).
  const a = cotar({ ...CASO, custoMotorista: 7900 }).resultado.custoMotoristaSobrePreco;
  const b = cotar({ ...CASO, custoMotorista: 11000 }).resultado.custoMotoristaSobrePreco;
  assert.ok(Math.abs(a - b) < 0.03, `razao variou demais: ${a} vs ${b}`);
});

// ---------- avaliarPreco: o angulo do leilao ----------

test('avaliarPreco reconstroi a margem quando o preco e o derivado', () => {
  const c = cotar(CASO);
  const v = avaliarPreco(c, c.preco);
  perto(v.margemLiquida, 0.12, 0.0005);
  assert.equal(v.viavel, true);
});

test('descer o lance corroi a margem ate o prejuizo', () => {
  const c = cotar(CASO);
  const meio = avaliarPreco(c, 12500);
  assert.ok(meio.margemLiquida > 0 && meio.margemLiquida < 0.12);

  const abaixo = avaliarPreco(c, c.breakEven - 500);
  assert.ok(abaixo.lucroLiquido < 0);
  assert.ok(abaixo.alertas.some(a => a.nivel === 'CRITICO'));
  assert.equal(abaixo.viavel, false);
});

test('lance abaixo do piso ANTT e BLOQUEIO', () => {
  const v = avaliarPreco(cotar(CASO), 7000);
  assert.ok(v.alertas.some(a => a.nivel === 'BLOQUEIO' && /piso ANTT/.test(a.msg)));
  assert.equal(v.viavel, false);
});

test('meta 60-62% morde num preco dado', () => {
  const c = cotar(CASO);                       // motorista = piso 7865.15
  const apertado = avaliarPreco(c, 11500);     // 68,4% -> critico
  assert.ok(apertado.custoMotoristaSobrePreco > 0.65);
  assert.ok(apertado.alertas.some(a => a.nivel === 'CRITICO'));
  assert.equal(apertado.dentroDaMeta, false);

  const naMeta = avaliarPreco(c, 12850);       // ~61,2%
  assert.equal(naMeta.dentroDaMeta, true);
});

test('tetoMotorista devolve o limite pra negociacao do G8', () => {
  const c = cotar(CASO);
  const t = tetoMotorista(c, c.preco, 0.12);
  perto(t.teto, c.custos.motorista, 1);        // no preco alvo, o teto e o proprio piso
  assert.equal(t.respeitaPiso, true);

  const apertado = tetoMotorista(c, 11000, 0.12);
  assert.ok(apertado.teto < c.pisoLegalANTT);
  assert.equal(apertado.respeitaPiso, false, 'a R$ 11.000 nao da pra pagar o piso e ter 12%');
});

test('margem impossivel e recusada', () => {
  assert.throws(() => cotar({ ...CASO, margemLiquida: 0.95 }), /precificacao impossivel/);
});

test('estrategia de leilao nunca desce abaixo do piso legal', () => {
  const l = estrategiaLeilao(cotar(CASO));
  assert.ok(l.abertura > l.alvo);
  assert.ok(l.alvo > l.breakEven);
  assert.ok(l.breakEven > l.pisoLegal);
  assert.equal(l.naoOfertarAbaixoDe, l.pisoLegal);
});

// ---------- Qualp (parser, sem rede) ----------

test('normalizar aceita os formatos conhecidos do Qualp', () => {
  perto(normalizar({ rota: { distancia: { valor: 1452.3 }, pedagio: { valor_total: 487.5 } } }).km, 1452.3);
  perto(normalizar({ data: { distancia_km: 1452, pedagios: { total: 487.5 } } }).pedagio, 487.5);
  perto(normalizar({ distancia: '1.452,3 km' }).km, 1452.3);
  perto(normalizar({ distance: { value: '1452.3' } }).km, 1452.3);
});

test('normalizar sinaliza quando o pedagio nao veio', () => {
  const r = normalizar({ distancia_km: 1452 });
  assert.equal(r.pedagio, null);
  assert.equal(r.pedagioConfirmado, false);
});

test('normalizar explode se nao achar distancia', () => {
  assert.throws(() => normalizar({ foo: 'bar' }), QualpError);
});

// ---------- Bsoft (rascunho, sem rede) ----------

test('rascunho de CT-e sai marcado e com CFOP interestadual', () => {
  const d = montarRascunhoCTe({ cotacao: cotar(CASO), operacao: { tomadorTipo: 'comercio' } });
  assert.equal(d.rascunho, true);
  assert.match(d.status, /AGUARDANDO REVISAO HUMANA/);
  assert.equal(d.identificacao.cfop, '6353');
  assert.equal(d.emitente.cnpj, '63.147.064/0001-30');
  perto(d.icms.aliquota_percentual, 12);
});

test('CFOP muda para industria e para operacao interna', () => {
  const c = cotar(CASO);
  assert.equal(montarRascunhoCTe({ cotacao: c, operacao: { tomadorTipo: 'industria' } }).identificacao.cfop, '6352');
  const interno = cotar({ ...CASO, ufDestino: 'MS' });
  assert.equal(montarRascunhoCTe({ cotacao: interno, operacao: {} }).identificacao.cfop, '5353');
});

test('a trava de emissao barra payload sem rascunho', () => {
  assert.throws(() => GUARDA_EMISSAO({ foo: 1 }), BsoftError);
  assert.throws(() => GUARDA_EMISSAO({ rascunho: false }), /nao emite documento fiscal/);
});

test('a trava de emissao barra campos de transmissao', () => {
  for (const k of ['emitir', 'transmitir', 'autorizar', 'enviar_sefaz']) {
    assert.throws(() => GUARDA_EMISSAO({ rascunho: true, [k]: true }), new RegExp(k));
  }
  assert.doesNotThrow(() => GUARDA_EMISSAO({ rascunho: true }));
});
