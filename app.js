(() => {
  const state = {
    items: [],
    editingId: null,
    searchKeyword: "",
    statusFilter: "",
    tempImage: "",
    tempFile: null,
    isEditMode: false,
    isSubmitting: false
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
    if (panel) panel.scrollTop = 0;
  }

  function setSubmitButtonLoading(isLoading) {
    const submitBtn = document.querySelector("#itemForm button[type='submit']");
    if (!submitBtn) return;

    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "儲存中..." : "儲存模型";
    submitBtn.style.opacity = isLoading ? "0.7" : "1";
    submitBtn.style.pointerEvents = isLoading ? "none" : "auto";
  }

  function resetEditorState() {
    state.editingId = null;
    state.tempImage = "";
    state.tempFile = null;
    state.isSubmitting = false;
    UI.setEditorMode(false);
    UI.resetForm();
    setSubmitButtonLoading(false);
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

  async function reloadItems() {
    state.items = await StorageManager.getItems();
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
    state.tempFile = null;
    state.isSubmitting = false;
    UI.setEditorMode(true);
    UI.fillForm(item);
    setSubmitButtonLoading(false);
    openModal("editorModal");
  }

  function showDetail(id) {
    const item = findItem(id);
    if (!item) return;

    UI.renderDetail(item);
    openModal("detailModal");
  }

  async function removeItem(id) {
    const ok = confirm("確定要刪除這筆模型資料嗎？");
    if (!ok) return;

    try {
      await StorageManager.deleteItem(id);
      await reloadItems();
    } catch (error) {
      console.error(error);
      alert(`刪除失敗：${error?.message || error}`);
    }
  }

  async function submitForm(event) {
    event.preventDefault();

    if (state.isSubmitting) {
      return;
    }

    const name = document.getElementById("nameInput").value.trim();
    if (!name) {
      alert("模型名稱不能空白");
      return;
    }

    state.isSubmitting = true;
    setSubmitButtonLoading(true);

    const existing = state.items.find(item => item.id === state.editingId);
    let imageUrl = state.tempImage || "";

    try {
      if (state.tempFile) {
        imageUrl = await StorageManager.uploadImage(state.tempFile);
      }

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
        image: imageUrl,
        createdAt: state.editingId ? (existing?.createdAt || Date.now()) : Date.now()
      };

      await StorageManager.saveItem(payload);
      await reloadItems();
      closeModal("editorModal");
    } catch (error) {
      console.error(error);
      alert(`儲存失敗：${error?.message || error}`);
      state.isSubmitting = false;
      setSubmitButtonLoading(false);
    }
  }

  function handleImageChange(event) {
    const file = event.target.files[0];
    if (!file) {
      state.tempFile = null;
      state.tempImage = "";
      UI.renderImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) return;

    state.tempFile = file;

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

      if (state.isSubmitting && closeType === "editor") {
        return;
      }

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

  async function init() {
    applySavedTheme();
    bindEvents();
    await reloadItems();
    registerServiceWorker();
  }

  init();
})();