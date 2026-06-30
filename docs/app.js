/* eslint-disable */
(function () {
  "use strict";

  const DOCS = window.OPENCV_DOCS;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) =>
    Array.from((root || document).querySelectorAll(sel));

  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const GUIDE_LINKS = [
    { id: "getting-started", label: "Getting started" },
    { id: "usage", label: "Usage patterns" },
    { id: "recipes", label: "Recipes & presets" },
    { id: "batch", label: "Batch processing" },
    { id: "io-model", label: "Input & output" },
    { id: "errors", label: "Error handling" },
    { id: "operations", label: "Operations" },
  ];

  /* ---------- meta / static fills ---------- */
  // Pull the actual latest published version from the npm registry so the
  // header never has to be hand-edited on release. The value baked into
  // data.js is only a fallback (shown instantly and if the fetch fails).
  function refreshVersion(m) {
    if (!m.name || typeof fetch !== "function") return;
    const url =
      "https://registry.npmjs.org/" + encodeURIComponent(m.name) + "/latest";
    fetch(url, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.version) {
          $("#brandVersion").textContent = "v" + data.version;
        }
      })
      .catch(() => {
        /* offline or rate-limited: keep the fallback version */
      });
  }

  function fillMeta() {
    const m = DOCS.meta;
    $("#brandVersion").textContent = "v" + m.version;
    $("#repoLink").href = m.repoUrl;
    $("#footerRepo").href = m.repoUrl;
    refreshVersion(m);

    // Derive all counts from the ops array so they can never drift from the
    // actual content. The only thing to maintain is the ops list itself.
    const ops = DOCS.ops;
    const imageOpCount = ops.filter((o) => o.kind === "image").length;
    const dataOpCount = ops.filter((o) => o.kind === "data").length;
    const opCount = ops.length;
    const catCount = groupedOps().length;

    $("#heroStats").innerHTML = [
      ["num", opCount, "operations"],
      ["num", imageOpCount, "image transforms"],
      ["num", dataOpCount, "analysis ops"],
      ["num", catCount, "categories"],
    ]
      .map(
        (s) =>
          `<div class="stat"><div class="num">${s[1]}</div><div class="label">${s[2]}</div></div>`,
      )
      .join("");

    $("#formatList").innerHTML = DOCS.imageFormats
      .map((f) => `<code>${f}</code>`)
      .join(", ");

    $("#opsCountLine").textContent =
      `${opCount} operations across ${catCount} categories — type in the search box above to filter.`;

    $("#errorRows").innerHTML = DOCS.errorCodes
      .map(
        (e) =>
          `<tr><td><code>${esc(e.code)}</code></td><td>${esc(e.meaning)}</td></tr>`,
      )
      .join("");
  }

  /* ---------- group ops by category ---------- */
  function groupedOps() {
    const byCat = {};
    DOCS.ops.forEach((op) => {
      (byCat[op.category] = byCat[op.category] || []).push(op);
    });
    return DOCS.categories
      .map((cat) => ({ cat, ops: byCat[cat.id] || [] }))
      .filter((g) => g.ops.length);
  }

  /* ---------- sidebar ---------- */
  function buildSidebar(groups) {
    const guide = `
      <div class="nav-group nav-guide">
        <button class="nav-title" data-toggle>Guide ${chevron()}</button>
        <ul class="nav-list">
          ${GUIDE_LINKS.map(
            (g) =>
              `<li><a href="#${g.id}" data-link="${g.id}">${g.label}</a></li>`,
          ).join("")}
        </ul>
      </div>`;

    const cats = groups
      .map(
        (g) => `
      <div class="nav-group" data-cat-group="${g.cat.id}">
        <button class="nav-title" data-toggle>${esc(g.cat.name)} ${chevron()}</button>
        <ul class="nav-list">
          ${g.ops
            .map(
              (op) =>
                `<li data-nav-op="${op.id}"><a href="#op-${op.id}" data-link="op-${op.id}">${esc(op.name)}</a></li>`,
            )
            .join("")}
        </ul>
      </div>`,
      )
      .join("");

    $("#sidebarInner").innerHTML = guide + cats;
  }

  function chevron() {
    return `<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>`;
  }

  /* ---------- op cards ---------- */
  function paramsTable(op) {
    if (!op.params || !op.params.length) {
      return `<p class="muted" style="font-size:.88rem;margin:6px 0 0">No parameters.</p>`;
    }
    const rows = op.params
      .map((p) => {
        const req = p.req
          ? `<span class="req-dot" title="required">●</span> required`
          : `<span class="opt-tag">optional</span>`;
        const def =
          p.def != null
            ? `<span class="def-val"><code>${esc(p.def)}</code></span>`
            : `<span class="muted">—</span>`;
        return `<tr>
          <td><span class="pname">${esc(p.name)}</span></td>
          <td class="ptype"><code>${esc(p.type)}</code></td>
          <td>${req}</td>
          <td class="def-val">${def}</td>
          <td>${esc(p.desc)}</td>
        </tr>`;
      })
      .join("");
    return `<div class="table-wrap"><table class="params-table">
      <thead><tr><th>Param</th><th>Type</th><th>Required</th><th>Default</th><th>Description</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }

  function returnsBlock(op) {
    if (op.kind === "data" && op.returns) {
      return `<div class="op-section-label">Returns <code style="text-transform:none">Promise&lt;…&gt;</code></div>
        <div class="returns-block"><code>${esc(op.returns)}</code></div>`;
    }
    return `<div class="op-section-label">Returns</div>
      <p class="returns-img">An image — resolves to the output path, or a base64 string when <code>outputBase64()</code> is used.</p>`;
  }

  function noteBlock(op) {
    if (!op.notes) return "";
    return `<div class="note">
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>
      <span>${esc(op.notes)}</span></div>`;
  }

  function standaloneBlock(op) {
    if (!op.standalone) return "";
    return `<p class="standalone-line"><strong>Standalone:</strong> <code>${esc(op.standalone)}</code></p>`;
  }

  function opCard(op) {
    const badge =
      op.kind === "data"
        ? `<span class="badge badge-data">data</span>`
        : `<span class="badge badge-image">image</span>`;
    return `<article class="op-card" id="op-${op.id}" data-op="${op.id}"
        data-search="${esc((op.id + " " + op.name + " " + op.desc + " " + (op.notes || "")).toLowerCase())}">
      <div class="op-head">
        <h3>${esc(op.name)} <a class="op-anchor" href="#op-${op.id}" aria-label="Link to ${esc(op.name)}">#</a></h3>
        ${badge}
        <span class="op-id">${esc(op.id)}</span>
      </div>
      <p class="op-desc">${esc(op.desc)}</p>
      <code class="sig">${esc(op.method)}</code>
      <div class="op-section-label">Parameters</div>
      ${paramsTable(op)}
      ${returnsBlock(op)}
      ${standaloneBlock(op)}
      ${noteBlock(op)}
    </article>`;
  }

  function buildOps(groups) {
    $("#opsContainer").innerHTML = groups
      .map(
        (g) => `
      <section class="cat-block" id="cat-${g.cat.id}" data-cat-block="${g.cat.id}">
        <div class="cat-head">
          <h2>${esc(g.cat.name)}</h2>
          <p class="cat-desc">${esc(g.cat.desc)}</p>
        </div>
        ${g.ops.map(opCard).join("")}
      </section>`,
      )
      .join("");
  }

  /* ---------- syntax highlighting (self-contained TS/JS) ---------- */
  const HL_FLOW = new Set(
    "import export from await return if else for while of in do switch case break continue default try catch finally throw yield".split(
      " ",
    ),
  );
  const HL_KW = new Set(
    "const let var function class interface type enum extends implements new typeof instanceof as async this keyof readonly".split(
      " ",
    ),
  );
  const HL_TYPE = new Set(
    "number string boolean void any unknown never object symbol bigint Promise".split(
      " ",
    ),
  );
  const HL_LIT = new Set("true false null undefined".split(" "));

  function highlightTS(src) {
    const n = src.length;
    let i = 0;
    let out = "";
    const push = (cls, t) => {
      out += `<span class="tok-${cls}">${esc(t)}</span>`;
    };
    while (i < n) {
      const ch = src[i];
      // line / block comments
      if (ch === "/" && src[i + 1] === "/") {
        let j = src.indexOf("\n", i);
        if (j < 0) j = n;
        push("com", src.slice(i, j));
        i = j;
        continue;
      }
      if (ch === "/" && src[i + 1] === "*") {
        let j = src.indexOf("*/", i + 2);
        j = j < 0 ? n : j + 2;
        push("com", src.slice(i, j));
        i = j;
        continue;
      }
      // strings (double, single, template)
      if (ch === '"' || ch === "'" || ch === "`") {
        let j = i + 1;
        while (j < n) {
          if (src[j] === "\\") {
            j += 2;
            continue;
          }
          if (src[j] === ch) {
            j++;
            break;
          }
          j++;
        }
        push("str", src.slice(i, j));
        i = j;
        continue;
      }
      // numbers
      if (ch >= "0" && ch <= "9") {
        const m = /^[0-9][\w]*(?:\.\d+)?/.exec(src.slice(i));
        push("num", m[0]);
        i += m[0].length;
        continue;
      }
      // identifiers / keywords
      if (/[A-Za-z_$]/.test(ch)) {
        const w = /^[A-Za-z_$][\w$]*/.exec(src.slice(i))[0];
        let k = i + w.length;
        while (k < n && /\s/.test(src[k])) k++;
        let cls = null;
        if (HL_FLOW.has(w)) cls = "flow";
        else if (HL_KW.has(w)) cls = "kw";
        else if (HL_TYPE.has(w)) cls = "type";
        else if (HL_LIT.has(w)) cls = "bool";
        else if (src[k] === "(") cls = "fn";
        else if (/^[A-Z]/.test(w)) cls = "type";
        if (cls) push(cls, w);
        else out += esc(w);
        i += w.length;
        continue;
      }
      // punctuation / operators
      if (/[{}()[\].,;:?=<>!&|+\-*/%]/.test(ch)) {
        const m = /^[{}()[\].,;:?=<>!&|+\-*/%]+/.exec(src.slice(i));
        push("punc", m[0]);
        i += m[0].length;
        continue;
      }
      out += esc(ch);
      i++;
    }
    return out;
  }

  function highlightShell(src) {
    return src
      .split("\n")
      .map((line) => {
        if (/^\s*#/.test(line))
          return `<span class="tok-com">${esc(line)}</span>`;
        const m = /^(\s*)([\w.-]+)(.*)$/.exec(line);
        return m
          ? esc(m[1]) + `<span class="tok-flow">${esc(m[2])}</span>` + esc(m[3])
          : esc(line);
      })
      .join("\n");
  }

  function highlightAll() {
    $$("pre.code > code").forEach((code) => {
      const lang = code.parentElement.getAttribute("data-lang") || "ts";
      code.classList.add("hl");
      code.innerHTML =
        lang === "bash"
          ? highlightShell(code.textContent)
          : highlightTS(code.textContent);
    });
    $$("code.sig").forEach((el) => {
      el.classList.add("hl");
      el.innerHTML = highlightTS(el.textContent);
    });
  }

  /* ---------- copy buttons ---------- */
  function addCopyButtons() {
    $$("pre.code").forEach((pre) => {
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.textContent = "Copy";
      btn.addEventListener("click", () => {
        const text = pre.querySelector("code").textContent;
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = "Copied";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("copied");
          }, 1400);
        });
      });
      pre.appendChild(btn);
    });
  }

  /* ---------- search ---------- */
  function setupSearch() {
    const input = $("#search");
    const noResults = $("#noResults");
    const guideSections = $$("[data-guide]");

    function apply(q) {
      q = q.trim().toLowerCase();
      const searching = q.length > 0;
      const terms = q.split(/\s+/).filter(Boolean);

      // guide sections hidden while searching (except the operations heading)
      guideSections.forEach((s) => {
        if (s.id === "operations") return;
        s.hidden = searching;
      });

      let visibleTotal = 0;
      $$("[data-cat-block]").forEach((block) => {
        let visibleInCat = 0;
        $$(".op-card", block).forEach((card) => {
          const hay = card.getAttribute("data-search");
          const match = !searching || terms.every((t) => hay.indexOf(t) !== -1);
          card.hidden = !match;
          const navItem = $(`[data-nav-op="${card.getAttribute("data-op")}"]`);
          if (navItem) navItem.hidden = !match;
          if (match) visibleInCat++;
        });
        block.hidden = visibleInCat === 0;
        const grp = $(
          `[data-cat-group="${block.getAttribute("data-cat-block")}"]`,
        );
        if (grp) grp.hidden = visibleInCat === 0;
        visibleTotal += visibleInCat;
      });

      noResults.hidden = !(searching && visibleTotal === 0);
    }

    let raf;
    input.addEventListener("input", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => apply(input.value));
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        apply("");
        input.blur();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        document.activeElement !== input &&
        !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)
      ) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  /* ---------- collapsible groups ---------- */
  function setupCollapse() {
    $("#sidebarInner").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-toggle]");
      if (!btn) return;
      btn.parentElement.classList.toggle("collapsed");
    });
  }

  /* ---------- mobile nav ---------- */
  function setupMobileNav() {
    const sidebar = $("#sidebar");
    const scrim = $("#sidebarScrim");
    const toggle = $("#navToggle");
    function close() {
      sidebar.classList.remove("open");
      scrim.classList.remove("show");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", () => {
      const open = sidebar.classList.toggle("open");
      scrim.classList.toggle("show", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    scrim.addEventListener("click", close);
    sidebar.addEventListener("click", (e) => {
      if (e.target.closest("a") && window.innerWidth <= 920) close();
    });
  }

  /* ---------- scrollspy ---------- */
  // Keep the active nav link visible by scrolling ONLY the sidebar container.
  // Using element.scrollIntoView() here walks up every scroll ancestor —
  // including the window, whose `scroll-behavior: smooth` then animates and
  // fights fast manual scrolling (the "stuck on scroll up" bug).
  function ensureNavVisible(link) {
    const container = link.closest(".sidebar");
    if (!container) return;
    const pad = 8;
    const cRect = container.getBoundingClientRect();
    const lRect = link.getBoundingClientRect();
    if (lRect.top < cRect.top + pad) {
      container.scrollTop -= cRect.top + pad - lRect.top;
    } else if (lRect.bottom > cRect.bottom - pad) {
      container.scrollTop += lRect.bottom - (cRect.bottom - pad);
    }
  }

  function setupScrollSpy() {
    const links = new Map();
    $$("[data-link]").forEach((a) => links.set(a.getAttribute("data-link"), a));
    const targets = $$(".op-card, [data-guide]").filter((el) => el.id);

    let current = null;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          const link = links.get(id) || links.get(id.replace(/^op-/, ""));
          if (!link || link === current) return;
          if (current) current.classList.remove("active");
          link.classList.add("active");
          current = link;
          ensureNavVisible(link);
        });
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    targets.forEach((t) => obs.observe(t));
  }

  /* ---------- theme ---------- */
  function setupTheme() {
    const root = document.documentElement;
    const saved = localStorage.getItem("ocv-docs-theme");
    if (saved) root.setAttribute("data-theme", saved);
    else if (window.matchMedia("(prefers-color-scheme: light)").matches)
      root.setAttribute("data-theme", "light");

    $("#themeToggle").addEventListener("click", () => {
      const next =
        root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("ocv-docs-theme", next);
    });
  }

  /* ---------- init ---------- */
  function init() {
    if (!DOCS) return;
    const groups = groupedOps();
    fillMeta();
    buildSidebar(groups);
    buildOps(groups);
    highlightAll();
    addCopyButtons();
    setupSearch();
    setupCollapse();
    setupMobileNav();
    setupScrollSpy();
    setupTheme();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
