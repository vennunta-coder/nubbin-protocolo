# Nubbin™ Protocolo Militar Cognitivo — 100 Níveis (Repo Completo)

<p align="center">
  <a href="https://SEU-USUARIO.github.io/nubbin-protocolo/" target="_blank">
    <img src="https://img.shields.io/badge/▶️%20Play%20Demo-Nubbin™-orange?style=for-the-badge" alt="Play Demo" />
  </a>
</p>


<p align="center"><img src="assets/banner.svg" alt="Nubbin Banner"/></p>


<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/<OWNER>/<REPO>/ci.yml?branch=main" alt="CI" />
  <img src="https://img.shields.io/github/license/<OWNER>/<REPO>" alt="License" />
  <img src="https://img.shields.io/badge/docker-GHCR-blue" alt="GHCR" />
</p>

> Substitui `<OWNER>/<REPO>` acima pelo teu namespace do GitHub.


**Estrutura numerada para GitHub**:
- `01-frontend/` – UI completa com Tailwind, HUD, IA de voz, níveis 1–100 (protótipos funcionais).
- `02-backend/` – API REST (Node.js + Express + PostgreSQL + JWT) para autenticação, progresso e ranking.
- `03-devops/` – Docker e compose para subir o backend + PostgreSQL.

## 🚀 Como iniciar

### Requisitos
- Node.js 18+
- Docker (opcional, recomendado para DB)
- npm

### 1) Back-end (API)
```bash
cd 02-backend
cp .env.example .env       # configure variáveis
npm install
npm run dev                # inicia em http://localhost:4000
```

Crie a base de dados e rode as migrações:
```bash
# com o Docker Compose (recomendado)
cd ../03-devops
docker-compose up -d

# depois aplique o schema:
cd ../02-backend
npm run db:migrate
```

### 2) Front-end
Abra `01-frontend/index.html` no navegador (ou sirva com um servidor estático).

> O front chama o backend em `http://localhost:4000`. Se alterar, ajuste `API_BASE` em `01-frontend/js/app.js`.

## 🔒 Endpoints da API
- `POST /auth/register` – { name, age, location, password } → cria utilizador.
- `POST /auth/login` – { name, password } → devolve JWT.
- `POST /progress/save` – { level } (JWT) → guarda progresso.
- `GET  /progress/load` – (JWT) → devolve progresso.
- `GET  /ranking` – top 50 por maior nível.

## 🧠 Fases & Níveis
- Nível 1 (Memória), Nível 2 (Lógica), Nível 3 (Reflexos) implementados.
- Níveis 4–100 gerados com desafio de código Nubbin™ crescente.
- Checkpoints por fase (1/11/21/…/91).
- HUD de progresso (Fase/Nível).
- IA por voz + beeps + animações.

## ⚠️ Notas
- Se o backend não estiver online, o front funciona em **modo offline** (localStorage).
- Assim que o backend subir, login/registo e ranking passam a funcionar.


## 🛳️ Deploy com Docker (full stack)
```bash
cd 03-devops
docker-compose -f docker-compose.full.yml up -d --build
# Frontend: http://localhost:8080
# Backend:  http://localhost:4000
# DB:       localhost:5432
```

➡️ Em produção com Nginx: o front e a API ficam **no mesmo domínio**. O front já usa `window.location.origin` por padrão, então não precisas mudar nada. Se quiseres apontar para outra API, usa **Config** (ícone de engrenagem) e define `API Base URL`.


## 🌐 Publicar no GitHub Pages
O repositório já inclui a pasta `gh-pages/` com o build do frontend.

1. Vai a **Settings > Pages** no GitHub.
2. Seleciona a branch `main` e a pasta `/gh-pages`.
3. O site ficará disponível em `https://<OWNER>.github.io/<REPO>/`.

> ⚠️ Atenção: o backend não corre no Pages. Tens de apontar para um servidor externo (usa o modal **Config** no site).


## 🌐 GitHub Pages (demo do Front-end)
Este repositório inclui uma pasta **gh-pages/** com o front pronto para publicar no GitHub Pages.
A Action **Deploy GitHub Pages** publica automaticamente a pasta em cada push na `main`.

> **Importante:** O front, quando hospedado no Pages, não consegue aceder ao backend local por `window.location.origin`. Define a API em **Config** (ícone de engrenagem), por exemplo `https://api.seudominio.com` ou `http://SEU-IP:4000`.

### Se quiseres domínio customizado
- Renomeia `gh-pages/CNAME.example` para `CNAME` e coloca o teu domínio (ex.: `nubbin.seudominio.com`).
- Configura o DNS (CNAME para `<owner>.github.io`).
