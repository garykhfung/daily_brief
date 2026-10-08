(() => {
  const LATEST_URL = "data/data.json";
  const ARCHIVE_INDEX_URL = "data/archive/index.json";
  const TZ = "Asia/Hong_Kong";
  const VALID_TABS = new Set(["ai", "gaming"]);

  const statusEl = document.getElementById("load-status");
  const updatedEl = document.getElementById("updated-at");
  const footerUpdatedEl = document.getElementById("footer-updated");
  const archiveRow = document.getElementById("archive-row");
  const archiveSelect = document.getElementById("archive-select");
  const tabButtons = [...document.querySelectorAll(".tab-btn")];

  const panels = {
    ai: document.getElementById("panel-ai"),
    gaming: document.getElementById("panel-gaming"),
  };
  const filterBars = {
    ai: document.getElementById("filter-ai"),
    gaming: document.getElementById("filter-gaming"),
  };
  const sectionRoots = {
    ai: document.getElementById("sections-ai"),
    gaming: document.getElementById("sections-gaming"),
  };
  const emptyEls = {
    ai: document.getElementById("empty-ai"),
    gaming: document.getElementById("empty-gaming"),
  };

  let activeTab = "ai";
  const sectionFilters = { ai: "all", gaming: "all" };
  let briefData = null;

  function escapeText(value) {
    return value == null ? "" : String(value);
  }

  function tabFromHash() {
    const raw = (location.hash || "").replace(/^#/, "").toLowerCase();
    return VALID_TABS.has(raw) ? raw : "ai";
  }

  function setHash(tab, replace) {
    const next = `#${tab}`;
    if (location.hash === next) return;
    if (replace) {
      history.replaceState(null, "", next);
    } else {
      location.hash = next;
    }
  }

  function isMidnightHkt(iso) {
    // Match ...T00:00:00+08:00 (optional fractional seconds)
    return /T00:00:00(?:\.0+)?\+08:00$/.test(String(iso || ""));
  }

  function noteSaysTimeUnknown(note) {
    if (!note) return false;
    return /time not stated|date only|time unknown|時間未|時間不明|時間不詳/i.test(note);
  }

  function formatPublished(iso, note) {
    if (!iso) return "";
    try {
      const dt = new Date(iso);
      if (Number.isNaN(dt.getTime())) return iso;
      const dateOnly = isMidnightHkt(iso) && noteSaysTimeUnknown(note);
      const opts = dateOnly
        ? { timeZone: TZ, year: "numeric", month: "short", day: "numeric" }
        : {
            timeZone: TZ,
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          };
      return new Intl.DateTimeFormat("zh-HK", opts).format(dt);
    } catch {
      return iso;
    }
  }

  function formatUpdated(iso) {
    if (!iso) return "";
    try {
      const dt = new Date(iso);
      if (Number.isNaN(dt.getTime())) return iso;
      return new Intl.DateTimeFormat("zh-HK", {
        timeZone: TZ,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(dt);
    } catch {
      return iso;
    }
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = escapeText(text);
    return node;
  }

  function buildItemCard(item) {
    const article = el("article", "item-card");
    if (item.uncertain) article.classList.add("is-uncertain");

    if (item.image) {
      const media = el("figure", "item-media");
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = escapeText(item.imageAlt || "");
      img.loading = "lazy";
      img.decoding = "async";
      media.appendChild(img);
      article.appendChild(media);
    }

    const top = el("div", "item-top");
    top.appendChild(el("h3", "item-title", item.title || "(untitled)"));
    if (item.uncertain) {
      top.appendChild(el("span", "pill pill-uncertain", "未確認"));
    }
    article.appendChild(top);

    if (item.summary) {
      article.appendChild(el("p", "item-summary", item.summary));
    }

    const platforms = Array.isArray(item.platforms) ? item.platforms.filter(Boolean) : [];
    if (platforms.length || item.releaseDate) {
      const extras = el("div", "item-extras");
      for (const p of platforms) {
        extras.appendChild(el("span", "pill pill-platform", p));
      }
      if (item.releaseDate) {
        extras.appendChild(el("span", "release-date", `Release: ${item.releaseDate}`));
      }
      article.appendChild(extras);
    }

    const meta = el("div", "item-meta");
    if (item.source && item.sourceUrl) {
      const a = document.createElement("a");
      a.href = item.sourceUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = escapeText(item.source);
      meta.appendChild(a);
    } else if (item.source) {
      meta.appendChild(el("span", null, item.source));
    }
    const when = formatPublished(item.publishedAt, item.note);
    if (when) meta.appendChild(el("time", null, when));
    article.appendChild(meta);

    if (item.note) {
      article.appendChild(el("p", "item-note", item.note));
    }

    return article;
  }

  function renderFilterBar(tabId, sections) {
    const bar = filterBars[tabId];
    clear(bar);
    const allBtn = el("button", "filter-pill", "All");
    allBtn.type = "button";
    allBtn.dataset.filter = "all";
    allBtn.setAttribute("aria-pressed", sectionFilters[tabId] === "all" ? "true" : "false");
    if (sectionFilters[tabId] === "all") allBtn.classList.add("is-active");
    bar.appendChild(allBtn);

    for (const section of sections) {
      if (!section.items || !section.items.length) continue;
      const btn = el("button", "filter-pill", section.label || section.id);
      btn.type = "button";
      btn.dataset.filter = section.id;
      const active = sectionFilters[tabId] === section.id;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      if (active) btn.classList.add("is-active");
      bar.appendChild(btn);
    }

    bar.onclick = (event) => {
      const btn = event.target.closest(".filter-pill");
      if (!btn || !bar.contains(btn)) return;
      sectionFilters[tabId] = btn.dataset.filter || "all";
      for (const child of bar.querySelectorAll(".filter-pill")) {
        const on = child === btn;
        child.classList.toggle("is-active", on);
        child.setAttribute("aria-pressed", on ? "true" : "false");
      }
      applySectionFilter(tabId);
    };
  }

  function renderTabSections(tabId, tab) {
    const root = sectionRoots[tabId];
    clear(root);
    const sections = Array.isArray(tab?.sections) ? tab.sections : [];

    for (const section of sections) {
      const items = Array.isArray(section.items) ? section.items : [];
      if (!items.length) continue;

      const block = el("section", "section-block");
      block.dataset.sectionId = section.id;
      block.setAttribute("aria-labelledby", `sec-${tabId}-${section.id}`);

      const h2 = el("h2", "section-title", section.label || section.id);
      h2.id = `sec-${tabId}-${section.id}`;
      block.appendChild(h2);

      const list = el("div", "item-list");
      for (const item of items) {
        list.appendChild(buildItemCard(item));
      }
      block.appendChild(list);
      root.appendChild(block);
    }

    renderFilterBar(tabId, sections);
    applySectionFilter(tabId);
  }

  function applySectionFilter(tabId) {
    const filter = sectionFilters[tabId];
    const root = sectionRoots[tabId];
    const blocks = [...root.querySelectorAll(".section-block")];
    let visible = 0;
    for (const block of blocks) {
      const show = filter === "all" || block.dataset.sectionId === filter;
      block.hidden = !show;
      if (show) visible += 1;
    }
    emptyEls[tabId].hidden = visible > 0;
  }

  function showTab(tabId, { updateHash = true, replaceHash = false } = {}) {
    activeTab = VALID_TABS.has(tabId) ? tabId : "ai";

    for (const btn of tabButtons) {
      const on = btn.dataset.tab === activeTab;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    }

    for (const id of VALID_TABS) {
      panels[id].hidden = id !== activeTab;
    }

    if (updateHash) setHash(activeTab, replaceHash);
  }

  function renderBrief(data) {
    briefData = data;
    const tabs = Array.isArray(data.tabs) ? data.tabs : [];
    const byId = Object.fromEntries(tabs.map((t) => [t.id, t]));

    renderTabSections("ai", byId.ai || { sections: [] });
    renderTabSections("gaming", byId.gaming || { sections: [] });

    const updated = formatUpdated(data.updatedAt);
    if (updated) {
      updatedEl.hidden = false;
      updatedEl.textContent = `Updated ${updated} (HKT)`;
      footerUpdatedEl.textContent = `Updated ${updated} (HKT)`;
    } else {
      updatedEl.hidden = true;
      footerUpdatedEl.textContent = "";
    }

    statusEl.hidden = true;
    showTab(activeTab, { updateHash: true, replaceHash: true });
  }

  async function loadJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  async function loadBrief(url) {
    statusEl.hidden = false;
    statusEl.classList.remove("error");
    statusEl.textContent = "載入中…";
    try {
      const data = await loadJson(url);
      renderBrief(data);
    } catch (err) {
      statusEl.hidden = false;
      statusEl.classList.add("error");
      statusEl.textContent = `載入失敗：${err.message || err}`;
      panels.ai.hidden = true;
      panels.gaming.hidden = true;
    }
  }

  async function initArchive() {
    try {
      const dates = await loadJson(ARCHIVE_INDEX_URL);
      if (!Array.isArray(dates) || !dates.length) return;

      // Newest first
      const sorted = [...dates].sort((a, b) => String(b).localeCompare(String(a)));
      for (const date of sorted) {
        const opt = document.createElement("option");
        opt.value = date;
        opt.textContent = date;
        archiveSelect.appendChild(opt);
      }
      archiveRow.hidden = false;

      archiveSelect.addEventListener("change", () => {
        const date = archiveSelect.value;
        if (!date) {
          loadBrief(LATEST_URL);
        } else {
          loadBrief(`data/archive/${encodeURIComponent(date)}.json`);
        }
      });
    } catch {
      // Optional feature — ignore missing archive index
    }
  }

  for (const btn of tabButtons) {
    btn.addEventListener("click", () => {
      showTab(btn.dataset.tab, { updateHash: true });
    });
  }

  window.addEventListener("hashchange", () => {
    showTab(tabFromHash(), { updateHash: false });
  });

  activeTab = tabFromHash();
  if (!location.hash) setHash(activeTab, true);

  initArchive();
  loadBrief(LATEST_URL);
})();
