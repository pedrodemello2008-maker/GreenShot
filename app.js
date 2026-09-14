/*
 * GreenShot — App (PWA)
 * Lógica da interface: navegação entre telas, gamificação (XP/tokens/nível),
 * ecossistema 3D, fluxo de registrar ação, mercado de impacto e tema.
 */
(() => {
  "use strict";
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  const STORAGE_KEY = "greenshot-progress";
  const THEME_KEY = "greenshot-theme";
  const DEFAULT_STATE = {
    xp: 680,
    xpMax: 1000,
    tokens: 860,
    level: 7,
    ecosystemProgress: 30,
  };

  const state = {
    ...DEFAULT_STATE,
    screen: "splash",
  };

  /* GreenShotFirebase vem de firebase.js. Se firebase-config.js ainda não
     tiver chaves reais, isConfigured é false e tudo aqui vira no-op —
     o app funciona só com localStorage, como sempre funcionou. */
  const cloud = window.GreenShotFirebase || {
    isConfigured: false,
    onAuthChange: (cb) => {
      cb(null);
      return () => {};
    },
    currentUser: () => null,
    loadUserData: async () => null,
    saveUserData: async () => {},
    logout: async () => {},
  };
  let authUser = null;
  let cloudSaveTimer = null;

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      ["xp", "tokens", "level", "ecosystemProgress"].forEach((k) => {
        if (typeof saved[k] === "number") state[k] = saved[k];
      });
    } catch (e) {}
  }
  function saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          xp: state.xp,
          tokens: state.tokens,
          level: state.level,
          ecosystemProgress: state.ecosystemProgress,
        }),
      );
    } catch (e) {}
    // Também envia para o Firestore (com um pequeno atraso, para não
    // disparar uma escrita a cada clique quando várias ações acontecem
    // em sequência) quando há uma conta logada.
    if (authUser) {
      clearTimeout(cloudSaveTimer);
      cloudSaveTimer = setTimeout(() => {
        cloud.saveUserData(authUser.uid, {
          xp: state.xp,
          tokens: state.tokens,
          level: state.level,
          ecosystemProgress: state.ecosystemProgress,
        });
      }, 600);
    }
  }
  loadProgress();

  /* ---------- clock ---------- */
  function tickClock() {
    const d = new Date();
    const label = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    $$("#clock").forEach((el) => (el.textContent = label));
  }
  tickClock();
  setInterval(tickClock, 30000);

  /* ---------- theme ---------- */
  function setTheme(t) {
    document.body.setAttribute("data-theme", t);
    const on = t === "dark";
    $("#profileThemeSwitch") &&
      $("#profileThemeSwitch").classList.toggle("is-on", on);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch (e) {}
  }
  (function initTheme() {
    let saved = "dark";
    try {
      saved = localStorage.getItem(THEME_KEY) || "dark";
    } catch (e) {}
    setTheme(saved);
  })();
  $("#themeBtn").addEventListener("click", () => {
    const next =
      document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(next);
  });
  $("#profileThemeSwitch").addEventListener("click", function () {
    const next =
      document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(next);
  });
  $$(".switch").forEach((sw) => {
    if (sw.id === "profileThemeSwitch") return;
    sw.addEventListener("click", () => sw.classList.toggle("is-on"));
  });

  /* ---------- navigation ---------- */
  function goTo(name) {
    $$(".screen").forEach((s) => s.classList.remove("is-active"));
    const target = $("#screen-" + name);
    if (!target) return;
    target.classList.add("is-active");
    $("#appBody") && ($("#appBody").scrollTop = 0);
    $("#appViewport").scrollTop = 0;
    state.screen = name;
    const navKey = target.dataset.nav;
    document.body.classList.toggle(
      "nav-active",
      !!(navKey && navKey !== "none"),
    );
    $$(".tab").forEach((t) =>
      t.classList.toggle("is-active", t.dataset.go === navKey),
    );
    if (name === "dashboard") animateXp();
    if (name === "ecosystem") ensureEcoEngine();
    closeNotif();
  }
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-go]");
    if (trigger) goTo(trigger.dataset.go);
  });

  /* ---------- splash -> onboarding / dashboard ---------- */
  // Espera o Firebase confirmar se já existe uma sessão salva (login
  // anterior) antes de decidir a próxima tela. Isso costuma resolver em
  // poucos milissegundos; o "race" com 4s evita travar o splash caso o
  // dispositivo esteja offline na primeira visita.
  let resolveAuthReady;
  const authReadyPromise = new Promise((resolve) => {
    resolveAuthReady = resolve;
  });
  let splashLeft = false;
  async function leaveSplash() {
    if (splashLeft) return;
    splashLeft = true;
    const timeout = new Promise((resolve) =>
      setTimeout(() => resolve(authUser), 4000),
    );
    const user = await Promise.race([authReadyPromise, timeout]);
    if (user) {
      goTo("dashboard");
    } else {
      goTo("onboarding");
    }
  }
  setTimeout(leaveSplash, 2600);
  $("#screen-splash").addEventListener("click", leaveSplash);

  /* splash particles */
  (function () {
    const c = $("#splashParticles");
    const ctx = c.getContext("2d");
    function size() {
      c.width = c.clientWidth;
      c.height = c.clientHeight;
    }
    size();
    const pts = Array.from({ length: 34 }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      r: Math.random() * 1.6 + 0.6,
      s: Math.random() * 0.4 + 0.1,
      a: Math.random() * 0.5 + 0.3,
    }));
    function loop() {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach((p) => {
        p.y -= p.s;
        if (p.y < -5) {
          p.y = c.height + 5;
          p.x = Math.random() * c.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52,211,153,${p.a})`;
        ctx.fill();
      });
      requestAnimationFrame(loop);
    }
    loop();
    window.addEventListener("resize", size);
  })();

  /* ---------- onboarding ---------- */
  let obIndex = 0;
  const slides = $$(".ob-slide");
  const dots = $$(".ob-dot");
  function renderOb() {
    slides.forEach((s, i) => s.classList.toggle("is-active", i === obIndex));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === obIndex));
    $("#obNextBtn").textContent =
      obIndex === slides.length - 1 ? "Começar Jornada" : "Próximo";
  }
  $("#obNextBtn").addEventListener("click", () => {
    if (obIndex < slides.length - 1) {
      obIndex++;
      renderOb();
    } else goTo("login");
  });
  renderOb();

  /* ---------- autenticação (Firebase) ---------- */
  let authMode = "login"; // "login" | "register"

  function setAuthError(msg) {
    const el = $("#authError");
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function setAuthMode(mode) {
    authMode = mode;
    setAuthError(null);
    const isRegister = mode === "register";
    $("#registerNameField").hidden = !isRegister;
    $("#authTitle").textContent = isRegister
      ? "Crie sua conta"
      : "Bem-vinda de volta";
    $("#authSubtitle").textContent = isRegister
      ? "Comece sua jornada sustentável agora."
      : "Entre para continuar sua jornada sustentável.";
    $("#authSubmitBtn").textContent = isRegister ? "Criar conta" : "Entrar";
    $("#authToggleText").textContent = isRegister
      ? "Já tem conta?"
      : "Não tem conta?";
    $("#authToggleLink").textContent = isRegister ? "Entrar" : "Cadastre-se";
    $("#forgotPassBtn").style.display =
      !isRegister && cloud.isConfigured ? "block" : "none";
  }

  $("#authToggleLink").addEventListener("click", (e) => {
    e.preventDefault();
    setAuthMode(authMode === "login" ? "register" : "login");
  });

  function setAuthBusy(busy) {
    $("#authSubmitBtn").disabled = busy;
    $("#googleLoginBtn").disabled = busy;
  }

  // Sem chaves reais em firebase-config.js: some com o que depende de
  // backend e mantém o formulário como demonstração local (qualquer
  // e-mail/senha entra direto no dashboard, como sempre funcionou aqui).
  if (!cloud.isConfigured) {
    $("#localModeHint").hidden = false;
    $("#googleLoginBtn").style.display = "none";
    $("#googleDivider").style.display = "none";
    $("#forgotPassBtn").style.display = "none";
  }

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!cloud.isConfigured) {
      goTo("dashboard");
      return;
    }

    const email = $("#loginEmail").value.trim();
    const pass = $("#loginPass").value;
    const name = $("#registerName").value.trim();

    setAuthBusy(true);
    try {
      if (authMode === "register") {
        await cloud.registerWithEmail(name, email, pass);
      } else {
        await cloud.loginWithEmail(email, pass);
      }
      $("#loginForm").reset();
      goTo("dashboard");
    } catch (err) {
      setAuthError(cloud.friendlyAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  });

  $("#googleLoginBtn").addEventListener("click", async () => {
    if (!cloud.isConfigured) return;
    setAuthError(null);
    setAuthBusy(true);
    try {
      await cloud.loginWithGoogle();
      goTo("dashboard");
    } catch (err) {
      setAuthError(cloud.friendlyAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  });

  $("#forgotPassBtn").addEventListener("click", async () => {
    if (!cloud.isConfigured) return;
    const email = $("#loginEmail").value.trim();
    if (!email) {
      setAuthError(
        'Digite seu e-mail acima primeiro, depois toque em "Esqueci minha senha".',
      );
      return;
    }
    try {
      await cloud.resetPassword(email);
      setAuthError(null);
      showToast("Enviamos um e-mail para redefinir sua senha 📩");
    } catch (err) {
      setAuthError(cloud.friendlyAuthError(err));
    }
  });

  $("#logoutBtn").addEventListener("click", async () => {
    await cloud.logout();
    state.xp = DEFAULT_STATE.xp;
    state.tokens = DEFAULT_STATE.tokens;
    state.level = DEFAULT_STATE.level;
    state.ecosystemProgress = DEFAULT_STATE.ecosystemProgress;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    setAuthMode("login");
    $("#loginForm").reset();
    goTo("login");
    showToast("Você saiu da sua conta");
  });

  /* ---------- reflete a conta logada na interface ---------- */
  function updateAuthUI(user) {
    if (!cloud.isConfigured) return; // mantém os textos de demonstração
    if (user) {
      const displayName =
        user.displayName ||
        (user.email ? user.email.split("@")[0] : "Guardiã(o)");
      const firstName = displayName.split(" ")[0];
      const initial = displayName.trim().charAt(0).toUpperCase() || "G";
      $("#dashHello").textContent = `Olá, ${firstName} 👋`;
      $("#profileName").textContent = displayName;
      $("#profileEmail").textContent = user.email || "";
      $("#profileAvatar").textContent = initial;
      $("#logoutBtn").hidden = false;
    } else {
      $("#dashHello").textContent = "Olá 👋";
      $("#profileName").textContent = "Visitante";
      $("#profileEmail").textContent = "";
      $("#profileAvatar").textContent = "?";
      $("#logoutBtn").hidden = true;
    }
  }

  async function handleAuthChange(user) {
    authUser = user;
    updateAuthUI(user);
    if (!user) return;
    const cloudData = await cloud.loadUserData(user.uid);
    if (cloudData) {
      ["xp", "tokens", "level", "ecosystemProgress"].forEach((k) => {
        if (typeof cloudData[k] === "number") state[k] = cloudData[k];
      });
    }
    if (ecoEngine) ecoEngine.setProgress(state.ecosystemProgress);
    if (state.screen === "dashboard") animateXp();
    if (state.screen === "ecosystem") updateEcoUI();
  }

  let firstAuthResolved = false;
  cloud.onAuthChange((user) => {
    handleAuthChange(user);
    if (!firstAuthResolved) {
      firstAuthResolved = true;
      resolveAuthReady(user);
    }
  });

  /* ---------- dashboard xp bar ---------- */
  function animateXp() {
    const pct = Math.min(100, (state.xp / state.xpMax) * 100);
    requestAnimationFrame(() => {
      $("#xpFill").style.width = pct + "%";
    });
    $("#statXp").textContent = (state.xp / 1000).toFixed(1) + "k";
    $("#statTokens").textContent = state.tokens;
    $("#marketTokens").textContent = state.tokens;
    $("#dashLevel").textContent = state.level;
    $("#profileLevel") && ($("#profileLevel").textContent = state.level);
    saveProgress();
  }

  /* ---------- notifications ---------- */
  function closeNotif() {
    $("#notifPanel").classList.remove("is-open");
  }
  $("#notifBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    $("#notifPanel").classList.toggle("is-open");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#notifPanel") && !e.target.closest("#notifBtn"))
      closeNotif();
  });

  /* ---------- toast ---------- */
  let toastT;
  function showToast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-shown");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("is-shown"), 2200);
  }

  /* ---------- ecossistema 3D (Three.js) ---------- */
  let ecoEngine = null;
  const ecoStageIcons = ["🏜️", "🌱", "🏛️", "🌳", "⛰️"];
  const ecoAnimalCounts = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 };

  function ensureEcoEngine() {
    if (!ecoEngine) {
      ecoEngine = new GreenShotEcosystem3D($("#ecoCanvas"), {
        initialProgress: state.ecosystemProgress,
      });
      requestAnimationFrame(() => $("#ecoLoading").classList.add("is-hidden"));
    } else {
      ecoEngine._onResize();
    }
    updateEcoUI();
  }

  function bumpEcosystemProgress(amount) {
    state.ecosystemProgress = Math.max(
      0,
      Math.min(100, state.ecosystemProgress + amount),
    );
    if (ecoEngine) ecoEngine.setProgress(state.ecosystemProgress);
    updateEcoUI();
    saveProgress();
  }

  function updateEcoUI() {
    const stage = ecoEngine ? ecoEngine.getStage() : GREENSHOT_ECO_STAGES[0];
    $("#ecoStageChip").textContent = `${ecoStageIcons[stage.id]} ${stage.name}`;
    $("#ecoStageName").textContent = stage.name;
    $("#ecoTrees").textContent = stage.treeCount;
    $("#ecoAnimals").textContent = ecoAnimalCounts[stage.id];
    $("#ecoSpeciesChip").textContent =
      `🐦 ${ecoAnimalCounts[stage.id]} espécies`;
    $("#ecoProgressFill").style.width = state.ecosystemProgress + "%";
    $("#ecoProgressSlider").value = state.ecosystemProgress;
    $("#ecoProgressLabel") &&
      ($("#ecoProgressLabel").textContent =
        Math.round(state.ecosystemProgress) + "%");
    $("#forestStage").setAttribute("data-stage", stage.id);
    $$("#ecoStageBadges .badge-cell").forEach((cell) => {
      cell.classList.toggle("unlocked", Number(cell.dataset.stage) <= stage.id);
    });
  }

  $("#ecoProgressSlider").addEventListener("input", (e) => {
    state.ecosystemProgress = Number(e.target.value);
    if (ecoEngine) ecoEngine.setProgress(state.ecosystemProgress);
    updateEcoUI();
    saveProgress();
  });

  /* ---------- academy subtabs ---------- */
  $$(".subtab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".subtab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const sub = tab.dataset.sub;
      $("#subTrilhas").classList.toggle("is-active", sub === "trilhas");
      $("#subDesafios").classList.toggle("is-active", sub === "desafios");
    });
  });
  /* ---------- quiz ---------- */
  const QUIZ_QUESTIONS = [
    {
      q: "Qual é o destino correto para pilhas e baterias usadas?",
      options: [
        "Lixo comum",
        "Pontos de coleta especializados",
        "Lixo reciclável azul",
        "Compostagem",
      ],
      correct: 1,
      explain:
        "Pilhas e baterias contêm metais pesados e devem ir a pontos de coleta especializados (lojas, supermercados ou ecopontos), nunca ao lixo comum.",
    },
    {
      q: "De que cor é a lixeira destinada ao descarte de vidro na coleta seletiva?",
      options: ["Verde", "Azul", "Vermelha", "Amarela"],
      correct: 0,
      explain:
        "Pelo padrão de cores da coleta seletiva no Brasil, o verde é reservado para o vidro.",
    },
    {
      q: "Óleo de cozinha usado deve ser descartado como?",
      options: [
        "Direto na pia",
        "No lixo orgânico",
        "Em garrafa PET fechada, para coleta ou pontos de reciclagem",
        "No vaso sanitário",
      ],
      correct: 2,
      explain:
        "Óleo despejado na pia contamina a água. O ideal é guardá-lo em uma garrafa PET fechada e levar a um ponto de coleta.",
    },
    {
      q: "Papel engordurado (como caixa de pizza suja) deve ser descartado como:",
      options: [
        "Reciclável (papel)",
        "Lixo comum / orgânico",
        "Compostagem industrial",
        "Ponto de coleta eletrônico",
      ],
      correct: 1,
      explain:
        "Papel com gordura contamina o restante do material reciclável, por isso deve ir para o lixo comum, não para a reciclagem.",
    },
    {
      q: "Qual desses é considerado lixo eletrônico (e-lixo)?",
      options: [
        "Garrafa de vidro",
        "Pilha de celular antigo",
        "Casca de fruta",
        "Saco plástico",
      ],
      correct: 1,
      explain:
        "Celulares, carregadores e baterias são e-lixo e precisam de pontos de coleta próprios, por conter metais e componentes tóxicos.",
    },
  ];
  const quizState = { index: 0, score: 0, answered: false };

  function openQuiz() {
    quizState.index = 0;
    quizState.score = 0;
    quizState.answered = false;
    $("#quizOverlay").classList.add("is-open");
    renderQuizQuestion();
  }
  function closeQuiz() {
    $("#quizOverlay").classList.remove("is-open");
  }

  function renderQuizQuestion() {
    const total = QUIZ_QUESTIONS.length;
    const item = QUIZ_QUESTIONS[quizState.index];
    quizState.answered = false;

    $("#quizPlay").style.display = "block";
    $("#quizResults").style.display = "none";
    $("#quizProgressLabel").textContent =
      `Pergunta ${quizState.index + 1} de ${total}`;
    $("#quizProgressFill").style.width =
      `${((quizState.index + 1) / total) * 100}%`;
    $("#quizQuestion").textContent = item.q;
    $("#quizExplain").style.display = "none";
    $("#quizExplain").textContent = "";

    const box = $("#quizOptions");
    box.innerHTML = "";
    item.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.type = "button";
      btn.textContent = opt;
      btn.dataset.i = i;
      btn.addEventListener("click", () => selectQuizOption(i));
      box.appendChild(btn);
    });

    const nextBtn = $("#quizNextBtn");
    nextBtn.disabled = true;
    nextBtn.textContent =
      quizState.index === total - 1 ? "Ver resultado" : "Confirmar";
  }

  function selectQuizOption(i) {
    if (quizState.answered) return;
    quizState.answered = true;
    const item = QUIZ_QUESTIONS[quizState.index];
    const opts = $$(".quiz-option");
    opts.forEach((btn) => {
      btn.disabled = true;
      const bi = Number(btn.dataset.i);
      if (bi === item.correct) btn.classList.add("is-correct");
      else if (bi === i) btn.classList.add("is-wrong");
    });
    if (i === item.correct) quizState.score++;

    $("#quizExplain").textContent = item.explain;
    $("#quizExplain").style.display = "block";

    const nextBtn = $("#quizNextBtn");
    nextBtn.disabled = false;
    nextBtn.textContent =
      quizState.index === QUIZ_QUESTIONS.length - 1
        ? "Ver resultado"
        : "Próxima pergunta";
  }

  $("#quizNextBtn").addEventListener("click", () => {
    if (!quizState.answered) return;
    if (quizState.index < QUIZ_QUESTIONS.length - 1) {
      quizState.index++;
      renderQuizQuestion();
    } else {
      showQuizResults();
    }
  });

  function showQuizResults() {
    const total = QUIZ_QUESTIONS.length;
    const score = quizState.score;
    const pct = score / total;
    const xpEarned = Math.round(40 * pct) + 10;
    const tokensEarned = Math.round(40 * pct) + 5;

    $("#quizPlay").style.display = "none";
    $("#quizResults").style.display = "block";
    $("#quizResultIcon").textContent =
      pct === 1 ? "🏆" : pct >= 0.6 ? "🎉" : "🌱";
    $("#quizResultTitle").textContent =
      pct === 1 ? "Gabaritou!" : pct >= 0.6 ? "Mandou bem!" : "Quase lá!";
    $("#quizResultText").textContent =
      `Você acertou ${score} de ${total} perguntas sobre descarte correto.`;
    $("#quizRewardXp").textContent = `+${xpEarned} XP`;
    $("#quizRewardTokens").textContent = `+${tokensEarned} GRST`;

    state.xp += xpEarned;
    state.tokens += tokensEarned;
    animateXp();
    bumpEcosystemProgress(2);
  }

  $("#closeQuiz").addEventListener("click", closeQuiz);
  $("#quizOverlay").addEventListener("click", (e) => {
    if (e.target.id === "quizOverlay") closeQuiz();
  });
  $("#closeQuizResults").addEventListener("click", () => {
    closeQuiz();
    showToast("Quiz concluído — recompensa creditada 🎓");
  });

  $("#startQuizBtn").addEventListener("click", openQuiz);

  /* ---------- market invest ---------- */
  $$(".invest-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cost = parseInt(btn.dataset.cost, 10);
      if (state.tokens < cost) {
        showToast("Tokens insuficientes");
        return;
      }
      state.tokens -= cost;
      $("#marketTokens").textContent = state.tokens;
      $("#statTokens").textContent = state.tokens;
      bumpEcosystemProgress(3);
      showToast(`Investimento de ${cost} tokens confirmado 🌍`);
    });
  });

  /* ---------- register action sheet ---------- */
  let chosenAct = null,
    chosenProof = null;
  function openSheet() {
    $("#sheetOverlay").classList.add("is-open");
    $("#sheetStep1").style.display = "flex";
    $("#sheetStep2").style.display = "none";
    $("#sheetStep3").style.display = "none";
    chosenAct = null;
    chosenProof = null;
    $$(".act-item").forEach((a) => a.classList.remove("is-selected"));
    $$(".proof-opt").forEach((a) => a.classList.remove("is-selected"));
    $("#toStep2").disabled = true;
    $("#submitAction").disabled = true;
  }
  $$(".js-open-register").forEach((btn) =>
    btn.addEventListener("click", openSheet),
  );
  $("#closeSheet").addEventListener("click", () =>
    $("#sheetOverlay").classList.remove("is-open"),
  );
  $("#sheetOverlay").addEventListener("click", (e) => {
    if (e.target.id === "sheetOverlay")
      $("#sheetOverlay").classList.remove("is-open");
  });

  $$(".act-item").forEach((item) =>
    item.addEventListener("click", () => {
      $$(".act-item").forEach((a) => a.classList.remove("is-selected"));
      item.classList.add("is-selected");
      chosenAct = item.dataset.act;
      $("#toStep2").disabled = false;
    }),
  );
  $("#toStep2").addEventListener("click", () => {
    $("#sheetStep1").style.display = "none";
    $("#sheetStep2").style.display = "flex";
  });
  $("#backStep1").addEventListener("click", () => {
    $("#sheetStep2").style.display = "none";
    $("#sheetStep1").style.display = "flex";
  });

  $$(".proof-opt").forEach((item) =>
    item.addEventListener("click", () => {
      $$(".proof-opt").forEach((a) => a.classList.remove("is-selected"));
      item.classList.add("is-selected");
      chosenProof = item.dataset.proof;
      $("#submitAction").disabled = false;
    }),
  );
  $("#submitAction").addEventListener("click", () => {
    $("#sheetStep2").style.display = "none";
    $("#sheetStep3").style.display = "block";
    state.xp += 35;
    state.tokens += 20;
  });
  $("#finishAction").addEventListener("click", () => {
    $("#sheetOverlay").classList.remove("is-open");
    animateXp();
    bumpEcosystemProgress(6);
    showToast("Ação registrada com sucesso 🎉");
  });

  /* ---------- restart demo ---------- */
  $("#restartBtn").addEventListener("click", () => {
    state.xp = DEFAULT_STATE.xp;
    state.tokens = DEFAULT_STATE.tokens;
    state.level = DEFAULT_STATE.level;
    state.ecosystemProgress = DEFAULT_STATE.ecosystemProgress;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    if (authUser) {
      // Também zera o progresso salvo na nuvem desta conta.
      cloud.saveUserData(authUser.uid, {
        xp: state.xp,
        tokens: state.tokens,
        level: state.level,
        ecosystemProgress: state.ecosystemProgress,
      });
    }
    if (ecoEngine) ecoEngine.setProgress(state.ecosystemProgress);
    updateEcoUI();
    obIndex = 0;
    renderOb();
    goTo("splash");
    splashLeft = false; // permite que o splash decida a próxima tela de novo
    setTimeout(leaveSplash, 2600);
  });
})();

/* =========================================================
   PWA — service worker, instalação e status offline
   ========================================================= */
(() => {
  "use strict";

  /* ---------- registra o service worker ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((err) => {
        console.warn("Falha ao registrar o service worker:", err);
      });
    });
  }

  /* ---------- banner de instalação (Add to Home Screen) ---------- */
  let deferredPrompt = null;
  const installBanner = document.getElementById("installBanner");
  const installBtn = document.getElementById("installBtn");
  const closeInstallBtn = document.getElementById("closeInstallBtn");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const dismissed = localStorage.getItem("greenshot-install-dismissed");
    if (!dismissed && installBanner) installBanner.classList.add("is-shown");
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBanner.classList.remove("is-shown");
    });
  }

  if (closeInstallBtn) {
    closeInstallBtn.addEventListener("click", () => {
      installBanner.classList.remove("is-shown");
      localStorage.setItem("greenshot-install-dismissed", "1");
    });
  }

  window.addEventListener("appinstalled", () => {
    if (installBanner) installBanner.classList.remove("is-shown");
    deferredPrompt = null;
  });

  /* ---------- indicador de conexão offline ---------- */
  const offlineBanner = document.getElementById("offlineBanner");
  function updateOnlineStatus() {
    if (!offlineBanner) return;
    offlineBanner.classList.toggle("is-shown", !navigator.onLine);
  }
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();
})();
