# Nubbin™ GitHub Pages Build

Esta pasta (`gh-pages/`) contém os ficheiros estáticos do frontend para publicação no GitHub Pages.

## Publicar
1. No GitHub, vai a **Settings > Pages**.
2. Define a branch `main` e a pasta `/gh-pages`.
3. O site ficará disponível em `https://<OWNER>.github.io/<REPO>/`.

## Nota
- A API não pode correr no Pages (apenas frontend). Tens de apontar para um backend externo.
- Usa o **Config (ícone de engrenagem)** no site e define `API Base URL` para o domínio onde o backend está.
- Se fores usar um domínio customizado, edita o ficheiro `CNAME`.
