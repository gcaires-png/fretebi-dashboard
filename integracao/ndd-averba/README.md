# Integração NDD Averba — Averbação Eletrônica de Seguro de Carga

Cliente da API da NDD Averba para averbar os CT-e da Videl junto à **Sompo Seguros S/A**
(apólices RCTR-C, RC-DC e RC-V intermediadas pela PAIVA SP Corretora).

**Regra de ouro das apólices**: todo embarque deve ser averbado **antes da saída do
veículo**. Embarque não averbado = sem cobertura, e a omissão de embarques isenta a
seguradora mesmo nos embarques averbados.

## Arquivos

| Arquivo | Função |
|---|---|
| `ndd-averba-client.js` | Cliente da API: autenticação (token Bearer, renovação automática) e averbação de CT-e |
| `averbar-cte.js` | CLI: `node averbar-cte.js <cte-autorizado.xml>` |
| `.env.example` | Modelo de configuração (copiar para `.env`, nunca commitar credenciais) |

## Como a API funciona (doc oficial)

Documentação: <https://helpcenter.nddaverba.com.br/pt/apis/current>

1. **Autenticação**: chamada `auth` dos serviços de usuário com **e-mail e senha**
   (mesmo acesso do portal NDD Averba, ou um usuário criado só para integração).
   Resposta de sucesso traz `token_acesso` (Bearer). **O token expira em 60 minutos** —
   o cliente renova sozinho com margem de 5 min.
2. **Averbação**: com o token, enviar o **XML do CT-e já autorizado pela SEFAZ**
   (`cteProc` com protocolo). XML sem protocolo é rejeitado. A API também aceita
   NF-e/NFS-e e transmissão de MDF-e.
3. A resposta traz o protocolo/número de averbação — registrar na operação
   (painel Moita Rev1 / plataforma Videl).

## Pendências para ativar (bloqueiam o uso em produção)

- [ ] **URL base da API** e caminhos exatos dos endpoints: confirmar no Swagger do
      helpcenter (link acima) ou com a NDD — suporte 24h **0800-461-0000**.
      Preencher em `NDD_AVERBA_BASE_URL` (e, se necessário, `NDD_AVERBA_PATH_*`).
- [ ] **Usuário de integração**: criar no portal NDD Averba (ou usar o login do portal).
- [ ] **Vínculo apólice ↔ CNPJ Videl na NDD**: confirmar com a PAIVA SP que o CNPJ
      63.147.064/0001-30 está cadastrado e vinculado à apólice Sompo.
- [ ] **Número da apólice RCTR-C emitida + vigência**: os PDFs recebidos são a
      especificação da cotação (nº 202500682528) — pedir a apólice definitiva.

## Fallback enquanto a API não está ativa

A própria apólice prevê: enviar o XML/PDF do CT-e para
**faturamentotransp@sompo.com.br** antes de liberar o veículo
(e, em sinistro na coleta, também sinistromercadoria@sompo.com.br em até 24h).

## Relação com o Bsoft

O emissor Bsoft só tem averbação automática nativa com **AT&M e Porto Seguro** — a NDD
não está na lista. Por isso a averbação roda por fora (esta integração), e no Bsoft o
seguro fica só no cadastro do CT-e: responsável **Empresa**, tomador CNPJ
63.147.064/0001-30, seguradora **SOMPO SEGUROS S/A** + nº da apólice.
Alternativa a avaliar com a PAIVA SP: migrar a averbação para AT&M, que integraria
nativamente no Bsoft.
