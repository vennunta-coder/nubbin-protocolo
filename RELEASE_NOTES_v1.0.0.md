# Nubbin™ v1.0.0 — Notas de Lançamento

## Destaques
- 100 níveis com fases temáticas, IA narradora e final cinematográfico.
- Modo offline com `localStorage` + sincronização quando o backend está ativo.
- Ranking global, autenticação JWT e API REST consolidada.
- Deploy fácil com Docker Compose + Nginx (mesmo domínio).

## Instalação Rápida
```bash
cd 03-devops
docker-compose -f docker-compose.full.yml up -d --build
# Front: http://localhost:8080 | API: http://localhost:4000
```

## Atualizações Técnicas
- Frontend usa `window.location.origin` para autodetectar a API quando está por trás do Nginx.
- CI garante migrações do Postgres e smoke test do Express.
- Imagens Docker publicáveis no GHCR via workflow manual.

## Próximos Passos
- Métricas de sessão e anti-cheat leve.
- Mais puzzles procedurais nas fases 7–9.
- Localização multi-idioma (pt-PT, pt-BR, en-US).
