window.UI = (() => {
  function formatCurrency(value) {
    const amount = Number(value || 0);
    return `$${amount.toLocaleString("en-US")}`;
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getCurrentMonthText() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  function renderTopbar({ userName, appName, isPro }) {
    const subtitleEl = document.getElementById("topbarSubtitle");
    const titleEl = document.getElementById("topbarTitle");
    const proBadge = document.getElementById("proBadge");

    if (subtitleEl) {
      subtitleEl.textContent = `${userName || "使用者"}的模型帳本`;
    }

    if (titleEl) {
      titleEl.textContent = appName || "Car Wallet";
    }

    if (proBadge) {
      proBadge.classList.toggle("hidden", !isPro);
    }

    document.title = appName || "Car Wallet";
  }

  function renderSummary(items) {
    const totalCount = items.length;
    const totalSpent = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const currentMonth = getCurrentMonthText();
    const monthCount = items.filter(item => (item.purchaseDate || "").startsWith(currentMonth)).length;

    const totalCountEl = document.getElementById("totalCount");
    const totalSpentEl = document.getElementById("totalSpent");
    const monthCountEl = document.getElementById("monthCount");

    if (totalCountEl) totalCountEl.textContent = totalCount;
    if (totalSpentEl) totalSpentEl.textContent = formatCurrency(totalSpent);
    if (monthCountEl) monthCountEl.textContent = monthCount;
  }

  function renderItemList(items, keyword = "", status = "", isEditMode = false) {
    const itemList = document.getElementById("itemList");
    if (!itemList) return;

    const filtered = items.filter(item => {
      const haystack = [
        item.name,
        item.brand,
        item.series,
        item.purchasePlace,
        item.notes
      ].join(" ").toLowerCase();

      const matchKeyword = !keyword || haystack.includes(keyword.toLowerCase());
      const matchStatus = !status || item.status === status;
      return matchKeyword && matchStatus;
    });

    if (!filtered.length) {
      itemList.innerHTML = `
        <div class="empty-card">
          <p>目前還沒有模型紀錄</p>
        </div>
      `;
      return;
    }

    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.purchaseDate || "";
      const dateB = b.purchaseDate || "";
      if (dateA === dateB) return (b.createdAt || 0) - (a.createdAt || 0);
      return dateB.localeCompare(dateA);
    });

    itemList.innerHTML = sorted.map(item => {
      const cover = item.image || "";
      const actionHtml = isEditMode
        ? `
          <div class="item-action-row">
            <button class="secondary-btn" type="button" data-action="edit" data-id="${item.id}">編輯</button>
            <button class="danger-btn" type="button" data-action="delete" data-id="${item.id}">刪除</button>
          </div>
        `
        : "";

      return `
        <article class="item-card">
          <div class="item-cover" data-action="detail" data-id="${item.id}">
            ${
              cover
                ? `<img src="${cover}" alt="${escapeHtml(item.name)}">`
                : `<div class="item-cover-placeholder">無照片</div>`
            }
          </div>

          <div class="item-body">
            <div class="item-row-top">
              <h4 class="item-name">${escapeHtml(item.name)}</h4>
              <p class="item-price">${formatCurrency(item.price)}</p>
            </div>

            <p class="item-meta">
              ${escapeHtml(item.brand || "未填品牌")}
              ${item.series ? `・ ${escapeHtml(item.series)}` : ""}
            </p>

            <div class="item-info-row">
              <span>${escapeHtml(item.purchaseDate || "未填日期")}</span>
              <span>${escapeHtml(item.status || "未填狀態")}</span>
            </div>

            <p class="item-note">${escapeHtml(item.purchasePlace || "未填購買地點")}</p>

            ${actionHtml}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderImagePreview(imageDataUrl) {
    const imagePreview = document.getElementById("imagePreview");
    if (!imagePreview) return;

    if (!imageDataUrl) {
      imagePreview.innerHTML = "";
      return;
    }

    imagePreview.innerHTML = `
      <div class="preview-card">
        <img src="${imageDataUrl}" alt="preview">
      </div>
    `;
  }

  function renderDetail(item) {
    const detailContent = document.getElementById("detailContent");
    if (!detailContent) return;

    detailContent.innerHTML = `
      <h2 class="detail-title">${escapeHtml(item.name)}</h2>
      <p class="detail-price">${formatCurrency(item.price)}</p>

      ${
        item.image
          ? `<div class="detail-image-grid">
              <div class="detail-image-card">
                <img src="${item.image}" alt="${escapeHtml(item.name)}">
              </div>
            </div>`
          : `<div class="empty-card"><p>尚未上傳照片</p></div>`
      }

      <div class="detail-info-list">
        <div class="detail-row"><span class="detail-label">品牌</span><span class="detail-value">${escapeHtml(item.brand || "未填寫")}</span></div>
        <div class="detail-row"><span class="detail-label">系列</span><span class="detail-value">${escapeHtml(item.series || "未填寫")}</span></div>
        <div class="detail-row"><span class="detail-label">購入日期</span><span class="detail-value">${escapeHtml(item.purchaseDate || "未填寫")}</span></div>
        <div class="detail-row"><span class="detail-label">購買地點</span><span class="detail-value">${escapeHtml(item.purchasePlace || "未填寫")}</span></div>
        <div class="detail-row"><span class="detail-label">狀態</span><span class="detail-value">${escapeHtml(item.status || "未填寫")}</span></div>
      </div>

      <div class="notes-card">
        <h4>備註</h4>
        <p>${escapeHtml(item.notes || "目前沒有備註")}</p>
      </div>
    `;
  }

  function setEditorMode(isEdit) {
    const editorTitle = document.getElementById("editorTitle");
    if (editorTitle) {
      editorTitle.textContent = isEdit ? "編輯模型" : "新增模型";
    }
  }

  function fillForm(item) {
    const safeItem = item || {};

    const itemId = document.getElementById("itemId");
    const nameInput = document.getElementById("nameInput");
    const brandInput = document.getElementById("brandInput");
    const seriesInput = document.getElementById("seriesInput");
    const priceInput = document.getElementById("priceInput");
    const dateInput = document.getElementById("dateInput");
    const placeInput = document.getElementById("placeInput");
    const statusInput = document.getElementById("statusInput");
    const notesInput = document.getElementById("notesInput");
    const imageInput = document.getElementById("imageInput");

    if (itemId) itemId.value = safeItem.id || "";
    if (nameInput) nameInput.value = safeItem.name || "";
    if (brandInput) brandInput.value = safeItem.brand || "";
    if (seriesInput) seriesInput.value = safeItem.series || "";
    if (priceInput) priceInput.value = safeItem.price || 0;
    if (dateInput) dateInput.value = safeItem.purchaseDate || "";
    if (placeInput) placeInput.value = safeItem.purchasePlace || "";
    if (statusInput) statusInput.value = safeItem.status || "";
    if (notesInput) notesInput.value = safeItem.notes || "";
    if (imageInput) imageInput.value = "";

    renderImagePreview(safeItem.image || "");
  }

  function resetForm() {
    fillForm(null);
  }

  function applyTheme(theme) {
    const root = document.documentElement;

    const finalTheme = {
      bg: theme?.bg || "#F1EFEF",
      panel: theme?.panel || "#CCC8AA",
      panel2: theme?.panel2 || "#7D7C7C",
      text: theme?.text || "#111111",
      muted: theme?.muted || "#666666",
      accent: theme?.accent || "#191717",
      accentText: theme?.accentText || "#FFFFFF",
      danger: theme?.danger || "#C84B4B"
    };

    root.style.setProperty("--bg", finalTheme.bg);
    root.style.setProperty("--panel", finalTheme.panel);
    root.style.setProperty("--panel-2", finalTheme.panel2);
    root.style.setProperty("--text", finalTheme.text);
    root.style.setProperty("--muted", finalTheme.muted);
    root.style.setProperty("--accent", finalTheme.accent);
    root.style.setProperty("--accent-text", finalTheme.accentText);
    root.style.setProperty("--danger", finalTheme.danger);
  }

  return {
    formatCurrency,
    renderTopbar,
    renderSummary,
    renderItemList,
    renderImagePreview,
    renderDetail,
    setEditorMode,
    fillForm,
    resetForm,
    applyTheme
  };
})();