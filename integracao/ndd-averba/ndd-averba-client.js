/**
 * Moita Rev1 — Cliente da API NDD Averba (averbação eletrônica de seguro de carga)
 * --------------------------------------------------------------------------------
 * Averba os CT-e da Videl junto à Sompo Seguros via NDD Averba, conforme exigido
 * pelas apólices RCTR-C / RC-DC / RC-V (averbação ANTES da saída do veículo).
 *
 * Fluxo (documentação oficial: https://helpcenter.nddaverba.com.br/pt/apis/current):
 *   1. Autenticação com e-mail e senha (mesmo acesso do portal NDD Averba, ou um
 *      usuário de integração criado no portal) → retorna token_acesso (Bearer).
 *      O token expira em 60 minutos; este cliente renova automaticamente.
 *   2. Envio do XML do CT-e JÁ AUTORIZADO pela SEFAZ para averbação.
 *      XML sem protocolo de autorização é rejeitado pela NDD.
 *   3. A resposta traz o protocolo/número de averbação — guardar junto à operação.
 *
 * Configuração via variáveis de ambiente (ver .env.example):
 *   NDD_AVERBA_BASE_URL    — URL base da API (confirmar com a NDD — ver README)
 *   NDD_AVERBA_EMAIL       — e-mail do usuário de integração
 *   NDD_AVERBA_SENHA       — senha do usuário de integração
 *   NDD_AVERBA_PATH_AUTH   — (opcional) caminho do endpoint de autenticação
 *   NDD_AVERBA_PATH_AVERBAR— (opcional) caminho do endpoint de averbação de CT-e
 *
 * Requer Node 18+ (fetch nativo). Sem dependências externas.
 */

'use strict';

const CONFIG = {
  baseUrl: process.env.NDD_AVERBA_BASE_URL || 'https://reader.nddaverba.com.br',
  email: process.env.NDD_AVERBA_EMAIL || '',
  senha: process.env.NDD_AVERBA_SENHA || '',
  // Endpoint de autenticação conforme manual "Obtendo o token de autenticação"
  // da NDD Averba: POST https://reader.nddaverba.com.br/api/auth/login
  // O caminho de averbação deve ser confirmado no Swagger do helpcenter;
  // ambos podem ser sobrescritos via env sem alterar o código.
  pathAuth: process.env.NDD_AVERBA_PATH_AUTH || '/api/auth/login',
  pathAverbar: process.env.NDD_AVERBA_PATH_AVERBAR || '/api/averbacao/cte',
  // margem de segurança: renova o token 5 min antes de expirar (validade 60 min)
  tokenTtlMs: 55 * 60 * 1000,
};

let _token = null;
let _tokenExpiraEm = 0;

function _exigirConfig() {
  const faltando = [];
  if (!CONFIG.baseUrl) faltando.push('NDD_AVERBA_BASE_URL');
  if (!CONFIG.email) faltando.push('NDD_AVERBA_EMAIL');
  if (!CONFIG.senha) faltando.push('NDD_AVERBA_SENHA');
  if (faltando.length) {
    throw new Error(
      `Configuração incompleta da NDD Averba. Defina: ${faltando.join(', ')}. ` +
      'Ver integracao/ndd-averba/README.md.'
    );
  }
}

/**
 * Autentica na NDD Averba e devolve o token Bearer (com cache de 55 min).
 */
async function autenticar() {
  _exigirConfig();
  if (_token && Date.now() < _tokenExpiraEm) return _token;

  const resp = await fetch(CONFIG.baseUrl + CONFIG.pathAuth, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CONFIG.email, senha: CONFIG.senha }),
  });

  const corpo = await resp.json().catch(() => ({}));
  if (!resp.ok || !corpo.token_acesso) {
    throw new Error(
      `Falha na autenticação NDD Averba (HTTP ${resp.status}): ` +
      (corpo.message || JSON.stringify(corpo))
    );
  }

  _token = corpo.token_acesso;
  _tokenExpiraEm = Date.now() + CONFIG.tokenTtlMs;
  return _token;
}

/**
 * Averba um CT-e autorizado.
 * @param {string} xmlAutorizado — XML completo do CT-e com protocolo da SEFAZ
 *                                 (cteProc). XML sem protocolo é rejeitado.
 * @returns {Promise<object>} resposta da NDD com o protocolo/nº de averbação
 */
async function averbarCTe(xmlAutorizado) {
  if (!xmlAutorizado || !xmlAutorizado.includes('<')) {
    throw new Error('averbarCTe: informe o conteúdo XML do CT-e autorizado.');
  }
  if (!/protCTe|infProt/.test(xmlAutorizado)) {
    throw new Error(
      'averbarCTe: o XML não contém protocolo de autorização da SEFAZ ' +
      '(esperado cteProc/protCTe). A NDD só averba documento já autorizado.'
    );
  }

  const token = await autenticar();
  const resp = await fetch(CONFIG.baseUrl + CONFIG.pathAverbar, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ xml: Buffer.from(xmlAutorizado, 'utf8').toString('base64') }),
  });

  const corpo = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      `Falha ao averbar CT-e (HTTP ${resp.status}): ` +
      (corpo.message || JSON.stringify(corpo))
    );
  }
  return corpo;
}

module.exports = { autenticar, averbarCTe, CONFIG };
