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

  function renderTopbar({ userName, appName }) {
    const subtitleEl = document.getElementById("topbarSubtitle");
    const titleEl = document.getElementById("topbarTitle");

    if (subtitleEl) {
      subtitleEl.textContent = `${userName || "使用者"}的模型帳本`;
    }

    if (titleEl) {
      titleEl.textContent = appName || "Car Wallet";
    }

    document.title = appName || "Car Wallet";
  }

  function renderSummary(items) {
    const totalCount = items.length;
    const totalSpent = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const currentMonth = getCurrentMonthText();
    const monthCount = items.filter(item => (item.purchaseDate || "").startsWith(currentMonth)).length;

    document.getElementById("totalCount").textContent = totalCount;
    document.getElementById("totalSpent").textContent = formatCurrency(totalSpent);
    document.getElementById("monthCount").textContent = monthCount;
  }

  function renderItemList(items, keyword = "", status = "", isEditMode = false) {
    const itemList = document.getElementById("itemList");

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
    document.getElementById("editorTitle").textContent = isEdit ? "編輯模型" : "新增模型";
  }

  function fillForm(item) {
    document.getElementById("itemId").value = item?.id || "";
    document.getElementById("nameInput").value = item?.name || "";
    document.getElementById("brandInput").value = item?.brand || "";
    document.getElementById("seriesInput").value = item?.series || "";
    document.getElementById("priceInput").value = item?.price || 0;
    document.getElementById("dateInput").value = item?.purchaseDate || "";
    document.getElementById("placeInput").value = item?.purchasePlace || "";
    document.getElementById("statusInput").value = item?.status || "";
    document.getElementById("notesInput").value = item?.notes || "";
    document.getElementById("imageInput").value = "";
    renderImagePreview(item?.image || "");
  }

  function resetForm() {
    fillForm(null);
  }

  function applyTheme(theme) {
    const root = document.documentElement;

    const finalTheme = {
      bg: theme?.bg || "#0b1020",
      panel: theme?.panel || "#121a2b",
      panel2: theme?.panel2 || "#1a2438",
      text: theme?.text || "#f3f4f6",
      muted: theme?.muted || "#94a3b8",
      accent: theme?.accent || "#8b5cf6",
      accentText: theme?.accentText || "#ffffff",
      danger: theme?.danger || "#ef4444"
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