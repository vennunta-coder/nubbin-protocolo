# Changelog
Todas as alterações relevantes neste projeto serão documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
e este projeto adere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-30
### Adicionado
- Front-end completo com HUD, IA por voz, efeitos sonoros, animações e 100 níveis.
- Fases especiais:
  - Fase 4: Sensorial (cores tipo Simon).
  - Fase 5: Lealdade (perguntas neutras).
  - Fase 6: Resistência (aguardar sem cliques).
  - Fase 7: Rutura (responder o oposto).
  - Fase 8: Domínio (labirintos com colisão).
  - Fase 9: Entropia (ruído dinâmico + penalidades).
  - Fase 10: Núcleo IA (final cinematográfico ramificado).
- Backend Node.js (Express + PostgreSQL + JWT): registo, login, progresso, ranking.
- DevOps: Docker Compose (db, backend, nginx), Nginx como proxy/servidor estático.
- CI/CD (GitHub Actions): pipeline de CI e workflow de publicação Docker.
- Documentação: README com badges, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.
- Qualidade: ESLint (backend), Prettier, EditorConfig.
- Licença MIT.

### Alterado
- API Base no front agora usa `window.location.origin` por padrão (mesmo domínio).

### Removido
- —

### Correções
- Ajustes de tolerância em colisões do labirinto; sincronizações de áudio no final.
