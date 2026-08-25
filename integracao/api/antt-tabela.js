/**
 * Tabela de piso minimo ANTT — dados. Editar aqui e o unico lugar a mexer
 * quando sair resolucao nova ou quando os coeficientes derivados forem
 * confirmados na calculadora oficial (troque "derivado" por "publicado").
 *
 * Modulo JS (e nao .json) de proposito: o bundler do Wrangler nao garante
 * suporte a import attributes, e este arquivo roda tanto no Node quanto no
 * Cloudflare Worker.
 */

export default {
  "resolucao": "6.084/2026",
  "publicada_em": "2026-07-17",
  "vigencia": "2026-07-17",
  "fonte_oficial": "https://calculadorafrete.antt.gov.br",
  "_ATENCAO": "Somente as linhas de 2 e 9 eixos foram lidas de fonte publicada. As linhas de 3 a 8 eixos sao DERIVADAS pela razao historica da Tabela A e precisam ser conferidas na calculadora oficial da ANTT antes de virar preco firme. Cada linha traz o campo 'fonte' indicando isso.",
  "tabelas": {
    "A_carga_lotacao": {
      "descricao": "Tabela A - transporte rodoviario de carga lotacao",
      "carga_geral": {
        "2": {
          "ccd": 3.9826,
          "cc": 451.84,
          "fonte": "publicado"
        },
        "3": {
          "ccd": 5.0306,
          "cc": 570.74,
          "fonte": "derivado"
        },
        "4": {
          "ccd": 5.8632,
          "cc": 665.19,
          "fonte": "derivado"
        },
        "5": {
          "ccd": 6.6963,
          "cc": 759.69,
          "fonte": "derivado"
        },
        "6": {
          "ccd": 7.6423,
          "cc": 866.99,
          "fonte": "derivado"
        },
        "7": {
          "ccd": 8.9184,
          "cc": 899.99,
          "fonte": "derivado"
        },
        "8": {
          "ccd": 9.0729,
          "cc": 901.66,
          "fonte": "derivado"
        },
        "9": {
          "ccd": 9.2027,
          "cc": 903.32,
          "fonte": "publicado"
        }
      }
    }
  },
  "metodo_derivacao": {
    "ccd": "razao historica da Tabela A carga geral (Res. 5.867/2020) reescalada pelo fator 3.9826/2.4693 = 1.61285; a razao 9eixos/2eixos historica (2.3196) confere com a publicada 2026 (2.3107), desvio 0,4%",
    "cc": "mesma razao aplicada ao CC de 2 eixos, limitado ao teto publicado de 903.32"
  },
  "formula": "piso = (km * ccd) + cc",
  "base_legal": "Lei 13.703/2018 - Politica Nacional de Pisos Minimos do Transporte Rodoviario de Cargas"
};
