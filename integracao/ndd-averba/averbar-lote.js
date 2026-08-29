#!/usr/bin/env node
/**
 * Moita Rev1 — Averbação em LOTE via NDD Averba
 * ----------------------------------------------
 * Uso:
 *   node integracao/ndd-averba/averbar-lote.js pasta/com/xmls/
 *   node integracao/ndd-averba/averbar-lote.js a.xml b.xml c.xml d.xml
 *
 * Averba todos os XMLs de CT-e autorizados (cteProc) informados, um a um,
 * e imprime o resumo final: quantos averbados, quantos recusados e por quê.
 *
 * IMPORTANTE: só funciona com o XML AUTORIZADO baixado do Bsoft
 * (CTes → ações do documento → Baixar XML). PDF de DACTE ou planilha NÃO
 * viram XML fiscal — o XML autorizado já existe no Bsoft, é só baixar.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { averbarCTe } = require('./ndd-averba-client');

function coletarXmls(args) {
  const arquivos = [];
  for (const arg of args) {
    const st = fs.statSync(arg);
    if (st.isDirectory()) {
      for (const f of fs.readdirSync(arg)) {
        if (f.toLowerCase().endsWith('.xml')) arquivos.push(path.join(arg, f));
      }
    } else {
      arquivos.push(arg);
    }
  }
  return arquivos;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Uso: node averbar-lote.js <pasta-ou-arquivos.xml...>');
    process.exit(2);
  }

  const arquivos = coletarXmls(args);
  if (!arquivos.length) {
    console.error('Nenhum .xml encontrado nos caminhos informados.');
    process.exit(2);
  }

  console.log(`Averbando ${arquivos.length} documento(s) na NDD Averba...\n`);
  const ok = [];
  const falhas = [];

  for (const arquivo of arquivos) {
    const nome = path.basename(arquivo);
    try {
      const xml = fs.readFileSync(arquivo, 'utf8');
      const resultado = await averbarCTe(xml);
      ok.push(nome);
      console.log(`✅ ${nome} averbado`, JSON.stringify(resultado));
    } catch (erro) {
      falhas.push({ nome, erro: erro.message });
      console.error(`❌ ${nome}: ${erro.message}`);
    }
  }

  console.log('\n===== RESUMO =====');
  console.log(`Averbados: ${ok.length}/${arquivos.length}`);
  if (falhas.length) {
    console.log('Falhas (veículo NÃO liberado para estes embarques):');
    for (const f of falhas) console.log(`  - ${f.nome}: ${f.erro}`);
    console.log(
      'Fallback da apólice: enviar o XML para faturamentotransp@sompo.com.br ' +
      'antes de liberar o veículo.'
    );
    process.exit(1);
  }
}

main().catch((erro) => {
  console.error(`Erro fatal: ${erro.message}`);
  process.exit(1);
});
