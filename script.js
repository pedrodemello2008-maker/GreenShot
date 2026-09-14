(() => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ============ THEME TOGGLE ============ */
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;
  let savedTheme = "dark";
  try {
    savedTheme = localStorage.getItem("greenshot-theme") || "dark";
  } catch (e) {}
  body.setAttribute("data-theme", savedTheme);
  themeToggle.setAttribute("aria-pressed", savedTheme === "light");
  themeToggle.setAttribute(
    "aria-label",
    savedTheme === "light"
      ? "Alternar para modo escuro"
      : "Alternar para modo claro",
  );

  themeToggle.addEventListener("click", () => {
    const next = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", next);
    themeToggle.setAttribute("aria-pressed", next === "light");
    themeToggle.setAttribute(
      "aria-label",
      next === "light"
        ? "Alternar para modo escuro"
        : "Alternar para modo claro",
    );
    try {
      localStorage.setItem("greenshot-theme", next);
    } catch (e) {}
  });

  /* ============ NAV SCROLL STATE ============ */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ============ MOBILE MENU ============ */
  const burger = document.getElementById("navBurger");
  const mobileMenu = document.getElementById("mobileMenu");
  burger.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  mobileMenu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }),
  );

  /* ============ CURSOR GLOW (desktop) ============ */
  const cursorGlow = document.querySelector(".cursor-glow");
  if (window.matchMedia("(hover: hover)").matches) {
    window.addEventListener(
      "mousemove",
      (e) => {
        cursorGlow.style.left = e.clientX + "px";
        cursorGlow.style.top = e.clientY + "px";
      },
      { passive: true },
    );
  }

  /* ============ SCROLL REVEAL ============ */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay =
              Array.from(el.parentElement?.children || []).indexOf(el) * 60;
            setTimeout(
              () => el.classList.add("is-visible"),
              Math.min(delay, 240),
            );
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ============ STAT COUNTERS ============ */
  const statEls = document.querySelectorAll(".stat__value");
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) {
      el.textContent = prefix + target.toLocaleString("pt-BR") + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(target * eased);
      el.textContent = prefix + value.toLocaleString("pt-BR") + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const statIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statIo.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 },
  );
  statEls.forEach((el) => statIo.observe(el));

  /* ============ PHONE SHOWCASE TABS ============ */
  const tabs = document.querySelectorAll(".phone-tab");
  const screens = document.querySelectorAll(".phone-screen");
  const descTitle = document.getElementById("phoneDescTitle");
  const descText = document.getElementById("phoneDescText");
  const descriptions = {
    "tab-dashboard": [
      "Dashboard Inteligente",
      "Perfil, nível do usuário, saldo de tokens e barra de progresso — sua jornada sustentável em um só lugar.",
    ],
    "tab-ra": [
      "Meu Ecossistema (RA)",
      "A câmera projeta sua floresta ou oceano em Realidade Aumentada, com visualização 3D do seu impacto.",
    ],
    "tab-registros": [
      "Central de Registros",
      "Upload de evidências, scanner de QR Code e geolocalização para validar cada ação sustentável.",
    ],
    "tab-academia": [
      "Academia GreenShot",
      "Quizzes, trilhas educativas e desafios semanais que transformam aprendizado em tokens.",
    ],
    "tab-mercado": [
      "Mercado de Impacto",
      "ONGs parceiras, projetos ambientais e transferência de tokens direto da sua carteira digital.",
    ],
  };
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;
      tabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      screens.forEach((s) => s.classList.toggle("is-active", s.id === target));
      if (descriptions[target]) {
        descTitle.textContent = descriptions[target][0];
        descText.textContent = descriptions[target][1];
      }
    });
  });

  /* ============ ACCORDION (FAQ) ============ */
  document.querySelectorAll(".accordion__trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const panel = trigger.nextElementSibling;
      const isOpen = trigger.getAttribute("aria-expanded") === "true";

      document.querySelectorAll(".accordion__trigger").forEach((t) => {
        t.setAttribute("aria-expanded", "false");
        t.nextElementSibling.style.maxHeight = null;
      });

      if (!isOpen) {
        trigger.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });

  /* ============ GROWING FOREST (hero scroll signature) ============ */
  const forestGroup = document.getElementById("forestGroup");
  const heroSection = document.querySelector(".hero");

  function makeTree(x, w, h, base) {
    // simple stylized fir silhouette built from stacked triangles + trunk
    const tiers = 3;
    let d = "";
    const tierH = (h * 0.68) / tiers;
    for (let i = 0; i < tiers; i++) {
      const tw = w * (1 - i * 0.22);
      const ty = base - h * 0.32 - i * tierH * 0.72;
      d += `M${x - tw / 2} ${ty} L${x} ${ty - tierH} L${x + tw / 2} ${ty} Z `;
    }
    // trunk
    d += `M${x - w * 0.06} ${base} L${x - w * 0.06} ${base - h * 0.3} L${x + w * 0.06} ${base - h * 0.3} L${x + w * 0.06} ${base} Z`;
    return d;
  }

  function buildForest() {
    if (!forestGroup) return;
    forestGroup.innerHTML = "";
    const count = window.innerWidth < 640 ? 9 : 16;
    const baseline = 300;
    for (let i = 0; i < count; i++) {
      const x = (1440 / (count - 1)) * i + Math.sin(i * 12.9) * 20;
      const h = 90 + Math.abs(Math.sin(i * 2.1)) * 130;
      const w = 60 + Math.abs(Math.cos(i * 1.7)) * 40;
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute("d", makeTree(x, w, h, baseline));
      path.style.opacity = (0.55 + (i % 4) * 0.12).toString();
      forestGroup.appendChild(path);
    }
  }
  buildForest();
  window.addEventListener("resize", () => {
    clearTimeout(window.__fResize);
    window.__fResize = setTimeout(buildForest, 200);
  });

  function updateForestGrowth() {
    if (!heroSection) return;
    const rect = heroSection.getBoundingClientRect();
    const vh = window.innerHeight;
    // progress 0 -> 1 as hero scrolls from fully in view to scrolled past
    const progress = Math.min(
      Math.max((0 - rect.top) / (rect.height * 0.55), 0),
      1,
    );
    const scale = 0.35 + progress * 0.65;
    const wrap = document.getElementById("forestWrap");
    if (wrap) {
      wrap.style.transform = `scaleY(${scale})`;
      wrap.style.transformOrigin = "bottom";
      wrap.style.opacity = String(0.5 + progress * 0.5);
    }
  }
  if (!reduceMotion) {
    updateForestGrowth();
    window.addEventListener(
      "scroll",
      () => requestAnimationFrame(updateForestGrowth),
      { passive: true },
    );
  } else {
    const wrap = document.getElementById("forestWrap");
    if (wrap) {
      wrap.style.transform = "scaleY(1)";
      wrap.style.opacity = "1";
    }
  }

  /* ============ PARTICLE CANVAS (tokens / fireflies) ============ */
  function initParticles(canvasId, opts) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, particles;
    const colors = ["#34D399", "#14B8A6", "#D7FF5B"];
    const count = opts.count;

    function resize() {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    }
    function makeParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h + h * 0.2,
        r: (Math.random() * 1.6 + 0.6) * devicePixelRatio,
        speed: (Math.random() * 0.35 + 0.08) * devicePixelRatio,
        drift: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
      };
    }
    function init() {
      resize();
      particles = Array.from({ length: count }, makeParticle);
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(p.twinkle) * p.drift;
        p.twinkle += 0.01;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkle * 2));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 8 * devicePixelRatio;
        ctx.shadowColor = p.color;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (!reduceMotion) requestAnimationFrame(tick);
    }

    init();
    if (reduceMotion) {
      tick();
    } else {
      tick();
    }
    window.addEventListener("resize", () => {
      clearTimeout(canvas.__resizeT);
      canvas.__resizeT = setTimeout(init, 200);
    });
  }

  initParticles("particleCanvas", { count: window.innerWidth < 640 ? 26 : 55 });
  initParticles("ctaCanvas", { count: window.innerWidth < 640 ? 18 : 36 });
})();
