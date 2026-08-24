#!/usr/bin/env node
/**
 * Gera o calendário editorial mensal do @videl_br.
 *
 * Uso:
 *   node gerar-calendario.mjs                        # próximas 4 semanas a partir da próxima segunda
 *   node gerar-calendario.mjs --inicio 2026-08-31    # data de início (segunda-feira)
 *   node gerar-calendario.mjs --semanas 4            # quantidade de semanas
 *   node gerar-calendario.mjs --saida ../calendario  # pasta de saída
 *
 * Saída: calendario-<inicio>.md (para a equipe) e calendario-<inicio>.json (para automações
 * — ex.: agendador de posts, Zapier, ou o painel do Moita Rev1).
 *
 * Cadência: feed seg/qua/sex + stories ter/qui. Os temas rodam em ciclo sobre o banco
 * de conteúdo abaixo, deslocados pela semana do ano — meses seguidos não repetem posts.
 */

const BANCO = {
  // Pilar: institucional / cobertura / rota (segunda-feira)
  segunda: [
    { formato: "FEED", titulo: "Cobertura MA ⇄ SP: o corredor que a Videl domina", legenda: "Do Maranhão a São Paulo com frequência regular — e cobertura nacional com parceiros estratégicos. Sua carga tem rota certa. Cotação em até 24h úteis: link na bio." },
    { formato: "FEED", titulo: "Rota da semana: São Paulo → São Luís em imagens", legenda: "[FOTOS DA VIAGEM] Estrada, equipe e carga chegando inteira. É assim que a gente conecta o Sudeste ao Nordeste. #naestrada" },
    { formato: "FEED", titulo: "Agro: a safra não espera — sua logística também não", legenda: "Escoamento com prazo firme, seguro dimensionado e comunicação em cada etapa. Fale com a Videl antes do pico da safra." },
    { formato: "FEED", titulo: "Energia solar: do porto ao parque, a carga chega inteira", legenda: "Painéis, inversores e estruturas com paletização correta, seguro e rastreamento 24/7. O setor que mais cresce no Brasil já conta com a Videl." },
    { formato: "FEED", titulo: "Duas bases, uma operação: MA + SP", legenda: "Base no Maranhão para o Norte/Nordeste, base em São Paulo para o Sudeste/Sul — e uma torre de controle só. Previsibilidade de ponta a ponta." },
  ],
  // Pilar: autoridade / educativo / prova social (quarta-feira)
  quarta: [
    { formato: "CARROSSEL", titulo: "O que torna uma carga 'de alto valor'?", legenda: "Não é só o preço na nota: risco, seguro, gerenciamento e quem responde quando algo foge do plano. Arrasta pro lado e entenda como avaliamos cada embarque." },
    { formato: "FEED", titulo: "+350 mil entregas: o que aprendemos", legenda: "Cada entrega ensinou alguma coisa sobre prazo, comunicação e risco. O resultado: 98,5% de foco em SLA e clientes que dormem tranquilos." },
    { formato: "CARROSSEL", titulo: "Seguro de carga: RCTR-C explicado sem juridiquês", legenda: "O que cobre, o que não cobre e por que a cobertura deve ser dimensionada pelo valor da nota — não pelo peso. Salva este post antes do próximo embarque." },
    { formato: "FEED", titulo: "Rastreamento 24/7: o que o seu cliente enxerga", legenda: "Posição em tempo real, ocorrências e canhoto digital na entrega. Visibilidade não é luxo — é o mínimo para carga de alto valor." },
    { formato: "CARROSSEL", titulo: "Checklist: como escolher transportadora para carga de alto valor", legenda: "5 critérios objetivos: seguro, rastreamento, comunicação, SLA e comprovação de entrega. Quantos a sua transportadora atual cumpre?" },
  ],
  // Pilar: equipe / bastidores / CTA (sexta-feira)
  sexta: [
    { formato: "REELS", titulo: "Bastidores: um dia na operação Videl", legenda: "[FILMAR] Coleta, conferência, amarração e saída — a rotina real de quem cuida da sua carga. #bastidores" },
    { formato: "REELS", titulo: "Um dia com [NOME] — destaque da equipe", legenda: "[FILMAR] 45 segundos com quem faz a operação acontecer. Pessoas cuidando de cargas — é disso que a logística é feita." },
    { formato: "FEED", titulo: "Feche o próximo mês com frete garantido", legenda: "Agenda aberta para novas operações. Cotação em até 24h úteis pelo WhatsApp (98) 8507-0197 ou link na bio. #cotacao" },
    { formato: "FEED", titulo: "Quem move a Videl — nossa gente", legenda: "[FOTOS DA EQUIPE] Atendimento consultivo 24/7 não é um sistema: são pessoas. Conheça quem acompanha sua operação." },
    { formato: "REELS", titulo: "Da cotação à entrega comprovada em 4 passos", legenda: "[FILMAR/ANIMAR] Cotação → coleta → transporte monitorado → entrega comprovada. Simples de acompanhar, difícil de igualar." },
  ],
  storyTer: [
    "Enquete: 'Qual seu maior medo ao embarcar carga de alto valor?'",
    "Caixa de perguntas: 'Pergunte sobre frete e logística'",
    "Rota do dia no mapa + km rodados da semana",
    "Quiz: verdadeiro ou falso sobre frete e seguro",
    "Bastidor rápido: [VÍDEO] do pátio ou carregamento",
  ],
  storyQui: [
    "Bastidor do dia: carregamento em andamento [VÍDEO]",
    "Responder as perguntas da caixinha de terça",
    "Repost de cliente/parceiro marcando a Videl",
    "Contagem: 'Últimos dias para fechar frete do mês'",
    "Antes/depois: carga embalada vs. carga entregue",
  ],
};

const HASHTAGS = "#logistica #transportadora #cargasdealtovalor #freteseguro #energiasolar #agro #maranhao #saopaulo #supplychain #transporterodoviario";

// ---------- utilidades de data ----------
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
  }
  return args;
}
function proximaSegunda(d) {
  const r = new Date(d);
  r.setDate(r.getDate() + ((8 - r.getDay()) % 7 || 7));
  return r;
}
function fmt(d) { return d.toISOString().slice(0, 10); }
function fmtBR(d) { return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`; }
function addDias(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function semanaDoAno(d) {
  const inicio = new Date(Date.UTC(d.getFullYear(), 0, 1));
  return Math.floor((d - inicio) / (7 * 24 * 3600 * 1000));
}

// ---------- geração ----------
const args = parseArgs(process.argv);
const inicio = args.inicio ? new Date(`${args.inicio}T12:00:00Z`) : proximaSegunda(new Date());
if (inicio.getDay() !== 1) {
  console.error(`Aviso: ${fmt(inicio)} não é segunda-feira; o calendário assume semanas de seg a sex.`);
}
const semanas = Number(args.semanas || 4);
const offset = semanaDoAno(inicio); // desloca o ciclo: meses seguidos não repetem

const plano = [];
for (let s = 0; s < semanas; s++) {
  const seg = addDias(inicio, s * 7);
  const idx = (offset + s) % 5;
  plano.push({
    semana: s + 1,
    dias: [
      { data: fmt(seg), dataBR: fmtBR(seg), dia: "segunda", tipo: "feed", ...BANCO.segunda[idx] },
      { data: fmt(addDias(seg, 1)), dataBR: fmtBR(addDias(seg, 1)), dia: "terça", tipo: "story", formato: "STORY", titulo: BANCO.storyTer[idx] },
      { data: fmt(addDias(seg, 2)), dataBR: fmtBR(addDias(seg, 2)), dia: "quarta", tipo: "feed", ...BANCO.quarta[idx] },
      { data: fmt(addDias(seg, 3)), dataBR: fmtBR(addDias(seg, 3)), dia: "quinta", tipo: "story", formato: "STORY", titulo: BANCO.storyQui[idx] },
      { data: fmt(addDias(seg, 4)), dataBR: fmtBR(addDias(seg, 4)), dia: "sexta", tipo: "feed", ...BANCO.sexta[idx] },
    ],
  });
}

// ---------- saída ----------
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const saida = args.saida || new URL("../calendario/", import.meta.url).pathname;
mkdirSync(saida, { recursive: true });

let md = `# Calendário editorial @videl_br — ${semanas} semanas a partir de ${fmt(inicio)}\n\n`;
md += `Cadência: feed seg/qua/sex + stories ter/qui. Melhor horário: 11h30 ou 18h.\n\n`;
md += `Hashtags base (usar 5–8 por post): ${HASHTAGS}\n\n`;
for (const sem of plano) {
  md += `## Semana ${sem.semana} (${sem.dias[0].dataBR} – ${sem.dias[4].dataBR})\n\n`;
  for (const d of sem.dias) {
    md += `- **${d.dataBR} (${d.dia}) · ${d.formato}** — ${d.titulo}\n`;
    if (d.legenda) md += `  - Legenda-rascunho: ${d.legenda}\n`;
  }
  md += `\n`;
}
md += `> Itens entre [COLCHETES] precisam de material real (foto, vídeo, nome) antes de publicar.\n`;

const base = `calendario-${fmt(inicio)}`;
writeFileSync(join(saida, `${base}.md`), md);
writeFileSync(join(saida, `${base}.json`), JSON.stringify({ inicio: fmt(inicio), semanas, hashtags: HASHTAGS, plano }, null, 2));
console.log(`Gerado: ${join(saida, base)}.md e .json (${semanas} semanas, ${plano.length * 5} itens)`);
