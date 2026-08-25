#!/usr/bin/env node
/**
 * CLI de cotacao — Moita Rev1
 *
 *   node cotar.js --origem "Tres Lagoas, MS" --destino "Sorriso, MT" \
 *                 --nf 212424.33 --veiculo truck --entregas 2 --margem 0.12
 *
 * Com QUALP_TOKEN no ambiente, busca km + pedagio reais. Sem token, exige
 * --km e --pedagio na mao (e avisa que sao estimativas).
 *
 * Flags uteis:
 *   --motorista <R$>   custo negociado com o motorista (default: piso ANTT)
 *   --icms-cheio       desliga o credito outorgado de 20%
 *   --json             saida crua, pra encadear com outro processo
 */

import { consultarRota } from './lib/qualp.js';
import { cotar, estrategiaLeilao } from './lib/cotacao.js';

const args = parseArgs(process.argv.slice(2));
const brl = (v) => v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v) => v == null ? '—' : `${(v * 100).toFixed(2)}%`;

const uf = (local) => (String(local).match(/[,\s-]\s*([A-Z]{2})\s*$/i)?.[1] || '').toUpperCase();

try {
  const origem = req('origem'), destino = req('destino');
  let km = num('km'), pedagio = num('pedagio'), fonte = 'informado na linha de comando';

  if (process.env.QUALP_TOKEN && !args.km) {
    const rota = await consultarRota({
      origem, destino, eixos: num('eixos') || undefined,
      paradas: args.parada ? [].concat(args.parada) : [],
    });
    km = rota.km;
    if (pedagio == null) pedagio = rota.pedagio;
    fonte = `Qualp${rota.pedagioConfirmado ? '' : ' (sem pedagio na resposta)'}`;
  }

  if (!km) throw new Error('sem km: configure QUALP_TOKEN ou passe --km');

  const c = cotar({
    km, valorNF: num('nf') ?? 0,
    tipoVeiculo: args.veiculo || 'truck', eixos: num('eixos'),
    ufOrigem: args['uf-origem'] || uf(origem), ufDestino: args['uf-destino'] || uf(destino),
    pedagio: pedagio ?? 0,
    custoMotorista: num('motorista'),
    entregas: num('entregas') ?? 1,
    margemLiquida: num('margem'),
    opts: args['icms-cheio'] ? { icmsCreditoOutorgado: false } : {},
  });

  if (args.json) { console.log(JSON.stringify({ ...c, fonteDistancia: fonte }, null, 2)); process.exit(0); }

  const l = estrategiaLeilao(c);
  console.log(`\n  ${origem}  ->  ${destino}`);
  console.log(`  ${km} km (${fonte}) · ${c.antt.eixos} eixos · NF ${brl(c.entrada.valorNF)}\n`);
  console.log(`  PISO ANTT (Res. ${c.antt.resolucao})   ${brl(c.pisoLegalANTT)}   ${brl(c.antt.porKm)}/km`);
  console.log('  ' + '-'.repeat(52));
  for (const [k, v] of Object.entries(c.custos)) console.log(`  ${k.padEnd(22)} ${brl(v).padStart(14)}`);
  console.log('  ' + '-'.repeat(52));
  console.log(`  Impostos (${pct(c.impostos.cargaTributaria)})     ${brl(c.impostos.valor).padStart(14)}`);
  console.log(`  Comissoes (${pct(c.comissoes.percentual)})       ${brl(c.comissoes.valor).padStart(14)}`);
  console.log(`  Lucro liquido (${pct(c.resultado.margemLiquida)})   ${brl(c.resultado.lucroLiquido).padStart(14)}`);
  console.log('  ' + '='.repeat(52));
  console.log(`  PRECO                  ${brl(c.preco).padStart(14)}`);
  console.log(`  ${pct(c.resultado.percentualSobreNF)} da NF · ${brl(c.resultado.reaisPorKm)}/km · motorista ${pct(c.resultado.custoMotoristaSobrePreco)} do preco\n`);
  console.log(`  LEILAO   abertura ${brl(l.abertura)} · alvo ${brl(l.alvo)} · break-even ${brl(l.breakEven)}`);
  console.log(`           nunca abaixo de ${brl(l.pisoLegal)} (piso ANTT)\n`);
  for (const a of c.alertas) console.log(`  [${a.nivel}] ${a.msg}`);
  console.log('');
} catch (e) {
  console.error(`\n  erro: ${e.message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    o[k] = k in o ? [].concat(o[k], v) : v;
  }
  return o;
}
function num(k) { const v = args[k]; return v == null || v === true ? undefined : Number(v); }
function req(k) { const v = args[k]; if (!v || v === true) throw new Error(`--${k} e obrigatorio`); return v; }
