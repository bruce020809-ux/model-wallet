(() => {
  const state = {
    items: StorageManager.getItems(),
    editingId: null,
    searchKeyword: "",
    statusFilter: "",
    tempImage: "",
    isEditMode: false
  };

  function generateId() {
    return crypto.randomUUID();
  }

  function getModalPanel(id) {
    const modal = document.getElementById(id);
    if (!modal) return null;
    return modal.querySelector(".modal-panel");
  }

  function scrollModalToTop(id) {
    const panel = getModalPanel(id);
    if (panel) {
      panel.scrollTop = 0;
    }
  }

  function resetEditorState() {
    state.editingId = null;
    state.tempImage = "";
    UI.setEditorMode(false);
    UI.resetForm();
    scrollModalToTop("editorModal");
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      scrollModalToTop(id);
    });
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.add("hidden");
    document.body.style.overflow = "";

    if (id === "editorModal") {
      resetEditorState();
    } else {
      scrollModalToTop(id);
    }
  }

  function refreshList() {
    UI.renderSummary(state.items);
    UI.renderItemList(
      state.items,
      state.searchKeyword,
      state.statusFilter,
      state.isEditMode
    );

    const toggleBtn = document.getElementById("toggleEditBtn");
    if (toggleBtn) {
      toggleBtn.textContent = state.isEditMode ? "完成" : "編輯";
    }
  }

  function findItem(id) {
    return state.items.find(item => item.id === id);
  }

  function saveState() {
    StorageManager.saveItems(state.items);
    refreshList();
  }

  function startCreate() {
    resetEditorState();
    openModal("editorModal");
  }

  function startEdit(id) {
    const item = findItem(id);
    if (!item) return;

    state.editingId = id;
    state.tempImage = item.image || "";
    UI.setEditorMode(true);
    UI.fillForm(item);
    openModal("editorModal");
  }

  function showDetail(id) {
    const item = findItem(id);
    if (!item) return;

    UI.renderDetail(item);
    openModal("detailModal");
  }

  function removeItem(id) {
    const ok = confirm("確定要刪除這筆模型資料嗎？");
    if (!ok) return;

    state.items = state.items.filter(item => item.id !== id);
    saveState();
  }

  function submitForm(event) {
    event.preventDefault();

    const name = document.getElementById("nameInput").value.trim();
    if (!name) {
      alert("模型名稱不能空白");
      return;
    }

    const existing = state.items.find(item => item.id === state.editingId);

    const payload = {
      id: state.editingId || generateId(),
      name,
      brand: document.getElementById("brandInput").value.trim(),
      series: document.getElementById("seriesInput").value.trim(),
      price: Number(document.getElementById("priceInput").value || 0),
      purchaseDate: document.getElementById("dateInput").value,
      purchasePlace: document.getElementById("placeInput").value.trim(),
      status: document.getElementById("statusInput").value,
      notes: document.getElementById("notesInput").value.trim(),
      image: state.tempImage,
      createdAt: state.editingId ? (existing?.createdAt || Date.now()) : Date.now()
    };

    if (state.editingId) {
      state.items = state.items.map(item => item.id === state.editingId ? payload : item);
    } else {
      state.items.unshift(payload);
    }

    saveState();
    closeModal("editorModal");
  }

  function handleImageChange(event) {
    const file = event.target.files[0];
    if (!file) {
      state.tempImage = "";
      UI.renderImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = e => {
      state.tempImage = e.target.result;
      UI.renderImagePreview(state.tempImage);
    };
    reader.readAsDataURL(file);
  }

  function resetStatsSectionsIfNeeded() {
    const modalBody = document.getElementById("statsModalPanel");

    if (!document.getElementById("brandChart")) {
      modalBody.innerHTML = `
        <div class="modal-header">
          <h3>統計分析</h3>
          <button class="close-button" data-close="stats" type="button">✕</button>
        </div>

        <div class="stats-section">
          <h4 class="stats-title">各品牌佔比</h4>
          <canvas id="brandChart"></canvas>
        </div>

        <div class="stats-section">
          <h4 class="stats-title">每月花費</h4>
          <canvas id="monthChart"></canvas>
        </div>

        <div class="stats-section">
          <h4 class="stats-title">各品牌花費</h4>
          <div id="brandSpendList" class="stats-list"></div>
        </div>
      `;
    }
  }

  function openStats() {
    resetStatsSectionsIfNeeded();
    openModal("statsModal");
    Stats.render(state.items);
  }

  function bindCloseButtons() {
    document.addEventListener("click", event => {
      const closeType = event.target.dataset.close;
      if (!closeType) return;

      if (closeType === "editor") closeModal("editorModal");
      if (closeType === "detail") closeModal("detailModal");
      if (closeType === "stats") closeModal("statsModal");
      if (closeType === "settings") closeModal("settingsModal");
    });
  }

  function bindThemeInputs() {
    [
      "themeBgInput",
      "themePanelInput",
      "themePanel2Input",
      "themeTextInput",
      "themeMutedInput",
      "themeAccentInput",
      "themeAccentTextInput",
      "themeDangerInput"
    ].forEach(id => {
      const input = document.getElementById(id);
      if (!input) return;

      input.addEventListener("input", () => {
        const theme = {
          bg: document.getElementById("themeBgInput").value,
          panel: document.getElementById("themePanelInput").value,
          panel2: document.getElementById("themePanel2Input").value,
          text: document.getElementById("themeTextInput").value,
          muted: document.getElementById("themeMutedInput").value,
          accent: document.getElementById("themeAccentInput").value,
          accentText: document.getElementById("themeAccentTextInput").value,
          danger: document.getElementById("themeDangerInput").value
        };

        UI.applyTheme(theme);
        StorageManager.saveTheme(theme);
      });
    });
  }

  function toggleEditMode() {
    state.isEditMode = !state.isEditMode;
    refreshList();
  }

  function bindEvents() {
    document.getElementById("addBtn").addEventListener("click", startCreate);
    document.getElementById("itemForm").addEventListener("submit", submitForm);
    document.getElementById("imageInput").addEventListener("change", handleImageChange);

    document.getElementById("searchInput").addEventListener("input", e => {
      state.searchKeyword = e.target.value.trim();
      refreshList();
    });

    document.getElementById("statusFilter").addEventListener("change", e => {
      state.statusFilter = e.target.value;
      refreshList();
    });

    document.getElementById("toggleEditBtn").addEventListener("click", toggleEditMode);

    document.getElementById("itemList").addEventListener("click", event => {
      const target = event.target.closest("[data-action]");
      if (!target) return;

      const action = target.dataset.action;
      const id = target.dataset.id;

      if (action === "detail") showDetail(id);
      if (action === "edit") startEdit(id);
      if (action === "delete") removeItem(id);
    });

    document.getElementById("summaryCard").addEventListener("click", openStats);

    document.getElementById("settingsBtn").addEventListener("click", () => {
      openModal("settingsModal");
    });

    document.getElementById("settingsExportBtn").addEventListener("click", () => {
      StorageManager.exportItems(state.items);
    });

    bindThemeInputs();
    bindCloseButtons();
  }

  function applySavedTheme() {
    const savedTheme = StorageManager.getTheme();

    UI.applyTheme(savedTheme || {
      bg: "#0b1020",
      panel: "#121a2b",
      panel2: "#1a2438",
      text: "#f3f4f6",
      muted: "#94a3b8",
      accent: "#8b5cf6",
      accentText: "#ffffff",
      danger: "#ef4444"
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", async () => {
      try {
        await navigator.serviceWorker.register("./sw.js");
      } catch (error) {
        console.error("SW 註冊失敗:", error);
      }
    });
  }

  function init() {
    applySavedTheme();
    bindEvents();
    refreshList();
    registerServiceWorker();
  }

  init();
})();