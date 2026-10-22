// Throwaway mockup controls. Loaded synchronously in <head> so the theme,
// layout variants, and motion CSS are in place before first paint; state lives
// in localStorage so a choice survives the navigation between the two pages.
(() => {
  const root = document.documentElement;
  const KEY = "mock72:";
  const defaults = {
    rocky: "3",
    intro: "b",
    meta: "line",
    headings: "mono",
    recent: "end",
    driver: "scroll",
    range: "50",
    distance: "8",
    revealMs: "250",
    vtMs: "300",
    motion: "full",
    gap: "20",
    dot: "1.5",
    strength: "medium",
    fade: "240",
    footer: "both",
    cursor: "on",
    expand: "off",
  };
  const get = (k) => {
    try {
      return localStorage.getItem(KEY + k) ?? defaults[k];
    } catch {
      return defaults[k];
    }
  };
  const set = (k, v) => {
    try {
      localStorage.setItem(KEY + k, v);
    } catch {}
  };

  // Theme: follows the OS until the toggle is clicked, as on the live site.
  let theme = null;
  try {
    theme = localStorage.getItem("theme");
  } catch {}
  if (theme !== "light" && theme !== "dark") {
    theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  root.dataset.theme = theme;
  root.dataset.meta = get("meta");
  root.dataset.headings = get("headings");
  const applyFlair = () => {
    const alpha = { subtle: "9%", medium: "14%", strong: "22%" }[get("strength")];
    root.style.setProperty("--grid-gap", `${get("gap")}px`);
    root.style.setProperty("--grid-dot", `${get("dot")}px`);
    root.style.setProperty("--grid-alpha", alpha);
    root.style.setProperty("--grid-fade", `${get("fade")}px`);
    root.dataset.footer = get("footer");
    root.dataset.cursor = get("cursor");
  };
  applyFlair();

  const motionStyle = document.createElement("style");
  motionStyle.id = "mock-motion";
  document.head.append(motionStyle);

  function motionCss() {
    const d = get("distance");
    const keyframes = `@keyframes mock-reveal { from { opacity: 0; transform: translateY(${d}px); } }`;
    if (get("motion") === "reduce") return keyframes;
    const vt = get("vtMs");
    const ms = get("revealMs");
    const reveal =
      get("driver") === "scroll"
        ? `@supports (animation-timeline: view()) {
            .reveal { animation: mock-reveal linear both; animation-timeline: view();
                      animation-range: entry 0% entry ${get("range")}%; }
          }`
        : `:root.js-reveal .reveal { transition: opacity ${ms}ms ease-out, transform ${ms}ms ease-out; }
           :root.js-reveal .reveal:not(.in) { opacity: 0; transform: translateY(${d}px); }`;
    return `${keyframes}
      @media (prefers-reduced-motion: no-preference) {
        @view-transition { navigation: auto; }
        ::view-transition-group(*),
        ::view-transition-old(*),
        ::view-transition-new(*) { animation-duration: ${vt}ms; }
        ${get("expand") === "on" ? ".card:has(a[href='turox.html']), .page-top { view-transition-name: card-turox; }" : ""}
        html { scroll-behavior: smooth; }
        ${reveal}
        #to-top {
          transition: opacity 200ms ease-out, transform 200ms ease-out, display 200ms allow-discrete;
        }
        #to-top[hidden] { opacity: 0; transform: translateY(8px); }
        @starting-style { #to-top { opacity: 0; transform: translateY(8px); } }
      }`;
  }
  const applyMotion = () => {
    motionStyle.textContent = motionCss();
    root.classList.toggle("js-reveal", get("driver") === "time" && get("motion") !== "reduce");
  };
  applyMotion();

  const INTRO_BASE =
    "I build the systems around machine-learning models: the training, evaluation, and developer tooling that get them out of notebooks and into production. On my own time, that means self-hosted AI tools that only ship once they pass their tests";
  const intros = {
    a: `${INTRO_BASE}. Off the clock, I'm usually out with my dog, Rocky.`,
    b: `${INTRO_BASE}. Away from the keyboard, I'm usually out with my dog, Rocky.`,
    c: `${INTRO_BASE}, and the rest of the time I'm out with my dog, Rocky.`,
    d: `${INTRO_BASE}. Most evenings I'm out with my dog, Rocky.`,
  };

  function applyDom() {
    root.dataset.meta = get("meta");
    root.dataset.headings = get("headings");

    const rocky = document.querySelector(".rocky");
    if (rocky) {
      const r = get("rocky");
      rocky.hidden = r === "none";
      if (r !== "none") rocky.src = `img/rocky-${r}.webp`;
    }
    const intro = document.querySelector(".intro");
    if (intro) intro.textContent = intros[get("intro")];

    const recent = document.getElementById("recent");
    if (recent) {
      if (get("recent") === "early") document.getElementById("why").after(recent);
      else recent.parentElement.append(recent);
    }
  }

  function observeReveals() {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  const options = [
    ["Grid", [
      ["gap", "Dot spacing", [["16", "16px"], ["20", "20px"], ["24", "24px"]]],
      ["dot", "Dot size", [["1", "1px"], ["1.5", "1.5px"]]],
      ["strength", "Strength", [["subtle", "subtle"], ["medium", "medium"], ["strong", "strong"]]],
      ["fade", "Top fade length", [["240", "240px"], ["360", "360px"]]],
      ["footer", "Footer edge", [["both", "grid + hairline"], ["hairline", "hairline only"], ["grid", "grid only"]]],
    ]],
    ["Flair", [
      ["cursor", "Wordmark cursor", [["on", "static ▌"], ["off", "none"]]],
      ["expand", "Card expands into page", [["off", "off (title only)"], ["on", "on"]]],
      ["motion", "Motion", [["full", "full"], ["reduce", "reduced (instant)"]]],
    ]],
  ];

  function buildPanel() {
    const panel = document.createElement("details");
    panel.id = "mock";
    panel.innerHTML = "<summary>Mockup controls (#72)</summary><div class='body'></div>";
    const body = panel.querySelector(".body");
    for (const [group, rows] of options) {
      const fs = document.createElement("fieldset");
      fs.innerHTML = `<legend>${group}</legend>`;
      for (const [key, label, choices] of rows) {
        const lab = document.createElement("label");
        lab.textContent = label;
        const sel = document.createElement("select");
        for (const [v, t] of choices) sel.add(new Option(t, v, false, get(key) === v));
        sel.addEventListener("change", () => {
          set(key, sel.value);
          applyFlair();
          applyMotion();
          applyDom();
          if (key === "driver" && sel.value === "time") observeReveals();
        });
        lab.append(sel);
        fs.append(lab);
      }
      body.append(fs);
    }
    const note = document.createElement("p");
    note.className = "note";
    note.textContent =
      "Card expand plays on navigation: click the turox card, then “← projects”. Try /nope for the 404. The OS reduced-motion setting also disables all motion.";
    body.append(note);
    try {
      panel.open = localStorage.getItem(KEY + "panel") === "open";
    } catch {}
    panel.addEventListener("toggle", () => set("panel", panel.open ? "open" : "closed"));
    document.body.append(panel);
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyDom();
    buildPanel();
    if (get("driver") === "time") observeReveals();

    document.querySelector(".toggle")?.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
    });

    const link = document.getElementById("to-top");
    const update = () => {
      link.hidden = window.scrollY <= 240;
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  });
})();
