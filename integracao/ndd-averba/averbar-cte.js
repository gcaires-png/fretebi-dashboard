#!/usr/bin/env node
/**
 * Moita Rev1 — CLI de averbação de CT-e via NDD Averba
 * -----------------------------------------------------
 * Uso:
 *   node integracao/ndd-averba/averbar-cte.js caminho/do/cte-autorizado.xml
 *
 * Lê o XML do CT-e autorizado, envia para averbação na NDD e imprime o
 * protocolo/nº de averbação. Regra de ouro da apólice Sompo: averbar ANTES
 * de o veículo sair — só liberar o embarque depois deste comando dar certo.
 */

'use strict';

const fs = require('fs');
const { averbarCTe } = require('./ndd-averba-client');

async function main() {
  const arquivo = process.argv[2];
  if (!arquivo) {
    console.error('Uso: node averbar-cte.js <cte-autorizado.xml>');
    process.exit(2);
  }
  const xml = fs.readFileSync(arquivo, 'utf8');

  console.log(`Averbando ${arquivo} na NDD Averba...`);
  const resultado = await averbarCTe(xml);
  console.log('✅ Averbação realizada:');
  console.log(JSON.stringify(resultado, null, 2));
}

main().catch((erro) => {
  console.error(`❌ ${erro.message}`);
  console.error(
    'Embarque NÃO está coberto até averbar. Fallback: enviar o XML para ' +
    'faturamentotransp@sompo.com.br antes de liberar o veículo.'
  );
  process.exit(1);
});
