const state = {
  search: "",
  year: "all",
  author: "all",
  issue: "all",
  type: "all",
  category: "all",
  eliteOnly: false,
  noteOnly: false,
  sort: "date-desc",
};

const data = Array.isArray(window.CONTENT_DATA) ? window.CONTENT_DATA : [];

const elements = {
  total: document.querySelector("#stat-total"),
  elite: document.querySelector("#stat-elite"),
  categories: document.querySelector("#stat-categories"),
  authors: document.querySelector("#stat-authors"),
  search: document.querySelector("#search-input"),
  sort: document.querySelector("#sort-select"),
  year: document.querySelector("#year-select"),
  author: document.querySelector("#author-select"),
  issue: document.querySelector("#issue-select"),
  type: document.querySelector("#type-select"),
  categoryChips: document.querySelector("#category-chips"),
  eliteOnly: document.querySelector("#elite-only"),
  noteOnly: document.querySelector("#has-note"),
  reset: document.querySelector("#reset-filters"),
  summary: document.querySelector("#results-summary"),
  activeFilters: document.querySelector("#active-filters"),
  grid: document.querySelector("#cards-grid"),
  empty: document.querySelector("#empty-state"),
  dialog: document.querySelector("#detail-dialog"),
  dialogBody: document.querySelector("#dialog-body"),
  dialogClose: document.querySelector("#dialog-close"),
};

function optionMarkup(value, label) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))];
}

function sortValues(values, key) {
  if (key === "year") {
    return values.sort((left, right) => Number(right) - Number(left));
  }

  return values.sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));
}

function populateSelect(select, placeholder, values) {
  select.innerHTML = optionMarkup("all", placeholder) + values.map((value) => optionMarkup(value, value)).join("");
}

function categoryClass(category) {
  let total = 0;
  for (const char of category || "") {
    total += char.codePointAt(0) || 0;
  }

  return `category-${total % 8}`;
}

function initStats() {
  const categories = uniqueValues(data, "category");
  const authors = uniqueValues(data, "author");
  const eliteCount = data.filter((item) => item.elite).length;

  elements.total.textContent = data.length.toLocaleString("zh-CN");
  elements.elite.textContent = eliteCount.toLocaleString("zh-CN");
  elements.categories.textContent = categories.length.toLocaleString("zh-CN");
  elements.authors.textContent = authors.length.toLocaleString("zh-CN");
}

function initFilters() {
  populateSelect(elements.year, "全部年份", sortValues(uniqueValues(data, "year"), "year"));
  populateSelect(elements.author, "全部作者", sortValues(uniqueValues(data, "author")));
  populateSelect(elements.issue, "全部期数", sortValues(uniqueValues(data, "issue")));
  populateSelect(elements.type, "全部类型", sortValues(uniqueValues(data, "planetType")));

  const categories = sortValues(uniqueValues(data, "category"));
  elements.categoryChips.innerHTML = [
    `<button class="chip active" data-category="all" type="button">全部</button>`,
    ...categories.map(
      (value) => `<button class="chip" data-category="${escapeHtml(value)}" type="button">${escapeHtml(value)}</button>`
    ),
  ].join("");
}

function bindEvents() {
  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });

  for (const [key, element] of [
    ["sort", elements.sort],
    ["year", elements.year],
    ["author", elements.author],
    ["issue", elements.issue],
    ["type", elements.type],
  ]) {
    element.addEventListener("change", (event) => {
      state[key] = event.target.value;
      render();
    });
  }

  elements.eliteOnly.addEventListener("change", (event) => {
    state.eliteOnly = event.target.checked;
    render();
  });

  elements.noteOnly.addEventListener("change", (event) => {
    state.noteOnly = event.target.checked;
    render();
  });

  elements.categoryChips.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) {
      return;
    }

    state.category = button.dataset.category;
    renderCategoryChips();
    render();
  });

  elements.reset.addEventListener("click", () => {
    state.search = "";
    state.year = "all";
    state.author = "all";
    state.issue = "all";
    state.type = "all";
    state.category = "all";
    state.eliteOnly = false;
    state.noteOnly = false;
    state.sort = "date-desc";

    elements.search.value = "";
    elements.sort.value = state.sort;
    elements.year.value = state.year;
    elements.author.value = state.author;
    elements.issue.value = state.issue;
    elements.type.value = state.type;
    elements.eliteOnly.checked = false;
    elements.noteOnly.checked = false;

    renderCategoryChips();
    render();
  });

  elements.grid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-id]");
    if (!trigger) {
      return;
    }

    const item = data.find((entry) => entry.id === trigger.dataset.id);
    if (item) {
      openDialog(item);
    }
  });

  elements.dialogClose.addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) {
      elements.dialog.close();
    }
  });
}

function renderCategoryChips() {
  for (const chip of elements.categoryChips.querySelectorAll(".chip")) {
    chip.classList.toggle("active", chip.dataset.category === state.category);
  }
}

function filterData() {
  const filtered = data.filter((item) => {
    const matchesSearch =
      state.search === "" ||
      [item.title, item.author, item.category, item.note, item.issue, item.planetType]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(state.search));

    return (
      matchesSearch &&
      (state.year === "all" || item.year === state.year) &&
      (state.author === "all" || item.author === state.author) &&
      (state.issue === "all" || item.issue === state.issue) &&
      (state.type === "all" || item.planetType === state.type) &&
      (state.category === "all" || item.category === state.category) &&
      (!state.eliteOnly || item.elite) &&
      (!state.noteOnly || item.note)
    );
  });

  const sorters = {
    "date-desc": (left, right) => right.sortDate.localeCompare(left.sortDate) || left.title.localeCompare(right.title, "zh-Hans-CN"),
    "date-asc": (left, right) => left.sortDate.localeCompare(right.sortDate) || left.title.localeCompare(right.title, "zh-Hans-CN"),
    "title-asc": (left, right) => left.title.localeCompare(right.title, "zh-Hans-CN"),
  };

  return filtered.sort(sorters[state.sort]);
}

function activeFilterEntries() {
  return [
    state.year !== "all" ? `年份：${state.year}` : "",
    state.author !== "all" ? `作者：${state.author}` : "",
    state.issue !== "all" ? `期数：${state.issue}` : "",
    state.type !== "all" ? `类型：${state.type}` : "",
    state.category !== "all" ? `分类：${state.category}` : "",
    state.eliteOnly ? "只看精华" : "",
    state.noteOnly ? "只看有备注" : "",
    state.search ? `搜索：${state.search}` : "",
  ].filter(Boolean);
}

function renderBadges() {
  const filters = activeFilterEntries();
  elements.activeFilters.innerHTML = filters.length
    ? filters.map((item) => `<span class="filter-badge">${escapeHtml(item)}</span>`).join("")
    : `<span class="filter-badge">当前显示全部内容</span>`;
}

function renderCards(items) {
  elements.grid.innerHTML = items
    .map(
      (item) => `
        <article class="content-card">
          <div class="card-top">
            ${item.elite ? `<span class="status-badge">精华</span>` : ""}
            ${item.planetType ? `<span class="meta-badge">${escapeHtml(item.planetType)}</span>` : ""}
          </div>
          <h3 class="content-title">
            <button type="button" data-id="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button>
          </h3>
          <div class="card-meta">
            <span class="meta-badge">${escapeHtml(item.publishedAtLabel)}</span>
            <span class="meta-badge">${escapeHtml(item.author || "未知作者")}</span>
            <span class="meta-badge">${escapeHtml(item.issue || "未标注期数")}</span>
            <span class="category-badge ${categoryClass(item.category || "未分类")}">${escapeHtml(item.category || "未分类")}</span>
          </div>
          ${
            item.note
              ? `<p class="card-note">${escapeHtml(item.note.length > 84 ? `${item.note.slice(0, 84)}...` : item.note)}</p>`
              : ""
          }
          <div class="card-actions">
            <a href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">查看原文</a>
            <button type="button" data-id="${escapeHtml(item.id)}">查看详情</button>
          </div>
        </article>
      `
    )
    .join("");

  elements.empty.classList.toggle("hidden", items.length > 0);
}

function renderSummary(items) {
  const total = items.length.toLocaleString("zh-CN");
  const label = state.search || activeFilterEntries().length ? "匹配结果" : "全部内容";
  elements.summary.textContent = `${label} ${total} 条`;
}

function openDialog(item) {
  elements.dialogBody.innerHTML = `
    <div class="dialog-tags">
      <span class="meta-badge">${escapeHtml(item.category || "未分类")}</span>
      ${item.elite ? `<span class="status-badge">精华内容</span>` : ""}
      ${item.planetType ? `<span class="meta-badge">${escapeHtml(item.planetType)}</span>` : ""}
    </div>
    <h3 class="dialog-title">${escapeHtml(item.title)}</h3>
    <p class="dialog-text">${escapeHtml(item.note || "这条内容暂无补充备注，可以直接点击下方按钮查看原文。")}</p>
    <dl class="detail-list">
      <div class="detail-item"><dt>发布时间</dt><dd>${escapeHtml(item.publishedAtLabel)}</dd></div>
      <div class="detail-item"><dt>作者</dt><dd>${escapeHtml(item.author || "未知作者")}</dd></div>
      <div class="detail-item"><dt>期数</dt><dd>${escapeHtml(item.issue || "未标注")}</dd></div>
      <div class="detail-item"><dt>年份</dt><dd>${escapeHtml(item.year || "未标注")}</dd></div>
      <div class="detail-item"><dt>星球类型</dt><dd>${escapeHtml(item.planetType || "普通内容")}</dd></div>
      <div class="detail-item"><dt>链接</dt><dd>${escapeHtml(item.link)}</dd></div>
    </dl>
    <a class="dialog-link" href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">打开原文</a>
  `;

  elements.dialog.showModal();
}

function render() {
  const items = filterData();
  renderSummary(items);
  renderBadges();
  renderCards(items);
}

initStats();
initFilters();
bindEvents();
renderCategoryChips();
render();
