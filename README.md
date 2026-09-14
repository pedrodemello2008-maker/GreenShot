# GreenShot — Projeto Unificado (Site + App, HTML/CSS/JS puros)

Este projeto reúne, em um único lugar, o **site institucional** (landing page)
e o **aplicativo** GreenShot, sem nenhum framework, build ou dependência —
apenas HTML, CSS e JavaScript puros. Funciona abrindo direto num navegador e
também é **instalável como PWA** (ícone na tela inicial, tela cheia, uso
offline).

## Estrutura de arquivos

```
index.html          Site institucional (landing page): hero, como funciona,
                     funcionalidades, showcase do app, benefícios, para
                     empresas, comparativo, depoimentos, FAQ, CTA final
app.html             O aplicativo em si: splash, onboarding, login,
                     dashboard, ecossistema 3D, academia, mercado de
                     impacto e perfil — navegação por abas, dados
                     mockados, tudo funcional em uma única página
styles.css           Design system compartilhado (cores da marca, tipografia,
                     dark/light mode, botões, cards) — usado pelas duas páginas
app.css              Estilos exclusivos das telas do app (sidebar de
                     desktop, tabbar de celular, folha de registrar ação,
                     grids responsivos de cada tela, etc.)
script.js            Interações do site (scroll reveal, contadores, showcase
                     do app, acordeão do FAQ, partículas, floresta do hero)
app.js               Lógica do app (navegação entre telas, gamificação,
                     ecossistema 3D, registro de service worker, banner de
                     instalação, status offline)
ecosystem-3d.js       Motor 3D do ecossistema (Three.js) — 5 estágios, do
                     deserto ao Monte Parnaso, conforme o progresso do usuário
manifest.json        Metadados do PWA (ícone, nome, cor do tema, modo
                     standalone) — abre em app.html ao instalar
service-worker.js     Cache offline (estratégia cache-first) para todos os
                     arquivos do projeto
firebase-config.js    ⚠️ Único arquivo que você precisa editar para ligar
                     o app ao Firebase — cole aqui as chaves do seu
                     projeto (veja "Integração com Firebase" abaixo)
firebase.js           Camada de integração com Firebase Auth + Firestore
                     (login, cadastro, Google, recuperar senha, logout,
                     salvar/carregar progresso na nuvem) — não precisa mexer
firestore.rules       Regras de segurança do Firestore — cole no console
                     do Firebase para cada usuário só acessar os próprios
                     dados
firebase.json         Configuração opcional para publicar o site pelo
                     Firebase Hosting (`firebase deploy`)
assets/              Logo, favicon e ícones em vários tamanhos
```

## Integração com Firebase

O app já vem com login, cadastro e persistência de progresso (XP, tokens,
nível, estágio do ecossistema) prontos para usar o **Firebase**
(Authentication + Firestore). Você só precisa colar as chaves do seu
projeto — nenhum outro arquivo precisa ser editado.

**Enquanto você não configurar nada, o app continua funcionando exatamente
como antes**, em "modo local": o formulário de login é só uma demonstração
(qualquer e-mail/senha entra) e o progresso fica salvo apenas no
`localStorage` do navegador.

### Passo a passo

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. No projeto: ⚙️ **Configurações do projeto** → aba **Geral** → em
   "Seus apps", clique no ícone Web `</>` → dê um nome (ex.: "GreenShot
   Web") → **Registrar app**. O Firebase mostra um objeto
   `firebaseConfig` — copie os valores dele.
3. Abra **`firebase-config.js`** e cole cada valor no lugar dos textos
   `SUA_..._AQUI`. Salve o arquivo.
4. No menu **Build** do console:
   - **Authentication** → aba "Sign-in method" → ative **E-mail/senha**
     (e, se quiser o botão de login rápido, ative **Google** também).
   - **Firestore Database** → "Criar banco de dados" → escolha uma região
     próxima → inicie em modo produção. Depois, na aba **Regras**, cole o
     conteúdo de **`firestore.rules`** (deste projeto) e publique — isso
     garante que cada pessoa só leia/escreva o próprio progresso.
5. Pronto. Abra `app.html`, crie uma conta pela tela de cadastro e o
   progresso passa a ser salvo automaticamente na nuvem, por usuário —
   incluindo entre dispositivos diferentes.

### Publicar com Firebase Hosting (opcional)

Se quiser hospedar o site no próprio Firebase em vez de outro serviço:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # aponte para a pasta deste projeto e use firebase.json já incluído
firebase deploy
```

## Como navegar

- **`index.html`** é a porta de entrada pública — o site que apresenta o
  projeto, com um botão **"Abrir App"** no menu e **"Começar Agora"** no CTA
  final, ambos levando a `app.html`.
- **`app.html`** é o aplicativo completo, e se adapta de verdade ao
  dispositivo — sem moldura decorativa em nenhum tamanho de tela:
  - **Celular (< 900px):** ocupa a tela inteira, com barra de abas fixa
    embaixo (Início · Floresta · Academia · Mercado · Perfil), como um app
    nativo.
  - **Desktop (≥ 900px):** layout próprio de desktop — menu de navegação
    lateral fixo (com atalho de volta ao site institucional), dashboard em
    colunas, ecossistema 3D com um canvas maior e painel de estatísticas ao
    lado, e Academia/Mercado em grade de cards.
  - **Tablet (640–899px):** mantém a navegação por abas do celular, mas
    centraliza o conteúdo numa largura confortável em vez de esticar os
    cards de ponta a ponta.

## Como testar localmente

PWAs precisam ser servidos por HTTP (o service worker não funciona abrindo o
arquivo direto com duplo clique):

```bash
cd greenshot
python3 -m http.server 8080
```

Depois abra `http://localhost:8080` (site) ou
`http://localhost:8080/app.html` (app direto) no navegador.

## Como publicar e instalar de verdade

Qualquer serviço gratuito de hospedagem estática publica os arquivos como
estão (GitHub Pages, Netlify, Vercel, Firebase Hosting). Depois de publicado,
em HTTPS:

- **Android (Chrome):** visitar `app.html` mostra o banner "Instale o
  GreenShot" automaticamente, ou use o menu ⋮ → "Instalar app".
- **iPhone (Safari):** abra `app.html` → Compartilhar (□↑) → "Adicionar à
  Tela de Início" (o Safari não dispara o banner automático).

## O que foi unido nesta versão

Você enviou, em momentos diferentes, três variações do projeto: o site
institucional completo (`script.js`), uma versão do app com ecossistema 3D em
Three.js (`app.js` + `ecosystem-3d.js`) e uma versão anterior mais simples do
app (floresta em SVG, sem instalação como PWA). Como o HTML e o CSS de cada
uma foram enviados com nomes repetidos, apenas a versão mais recente de cada
arquivo permaneceu acessível — por isso, as telas do app (`app.html` e as
partes de `app.css`) foram **reconstruídas do zero**, usando `app.js`,
`ecosystem-3d.js` e as descrições dos READMEs anteriores como referência, e
seguindo a mesma identidade visual do site (cores, tipografia Clash
Display/Satoshi/IBM Plex Mono, glassmorphism).

## Limitações desta versão

- Os dados do app (XP, tokens, progresso do ecossistema, investimentos) só
  são salvos na nuvem (Firestore) **se você configurar o Firebase**
  (veja "Integração com Firebase" acima). Sem configurar, eles continuam
  só no `localStorage` do navegador, e voltam ao estado inicial se você
  limpar os dados do site ou trocar de dispositivo.
- O login/cadastro por e-mail e senha e o login com Google cobrem o
  essencial. Outros provedores (Apple, Facebook etc.), verificação de
  e-mail obrigatória e exclusão de conta pelo próprio app não foram
  incluídos — dá para ativar depois no mesmo padrão de `firebase.js`.
- Notificações push de verdade exigem um servidor de push e permissão do
  usuário — não incluídas aqui (o painel de notificações do app é só uma
  lista estática de demonstração).
- Como o Three.js do ecossistema 3D e o SDK do Firebase vêm de CDNs
  externos, é necessário estar online no primeiro carregamento; depois
  disso o service worker guarda esses arquivos em cache (as chamadas de
  login/salvamento em si, porém, sempre precisam de internet).
