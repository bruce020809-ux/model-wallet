(() => {
  const state = {
    items: [],
    editingId: null,
    searchKeyword: "",
    statusFilter: "",
    tempImage: "",
    tempFile: null,
    isEditMode: false,
    isSubmitting: false,
    currentUser: null,
    isProfileSubmitting: false,
    isPasswordSubmitting: false,
    isAppNameSubmitting: false
  };

  const THEMES = {
    sage: {
      name: "Sage",
      bg: "#D0E7D2",
      panel: "#B0D9B1",
      panel2: "#79AC78",
      text: "#1F2A1F",
      muted: "#5A6F5A",
      accent: "#618263",
      accentText: "#FFFFFF",
      danger: "#C84B4B"
    },
    lemonSea: {
      name: "Lemon Sea",
      bg: "#FBF2D3",
      panel: "#F4E869",
      panel2: "#5CD1E6",
      text: "#1E2A35",
      muted: "#5C6870",
      accent: "#3185C3",
      accentText: "#FFFFFF",
      danger: "#C84B4B"
    },
    violet: {
      name: "Violet",
      bg: "#E4CEF6",
      panel: "#9D76C1",
      panel2: "#713ABE",
      text: "#240A34",
      muted: "#6E4D8E",
      accent: "#5B0788",
      accentText: "#FFFFFF",
      danger: "#C84B4B"
    },
    berry: {
      name: "Berry",
      bg: "#FADEC9",
      panel: "#F88CA3",
      panel2: "#D80132",
      text: "#2B0A10",
      muted: "#7A3A48",
      accent: "#3D0C11",
      accentText: "#FFFFFF",
      danger: "#B91C1C"
    },
    stone: {
      name: "Stone",
      bg: "#F1EFEF",
      panel: "#CCC8AA",
      panel2: "#7D7C7C",
      text: "#111111",
      muted: "#666666",
      accent: "#191717",
      accentText: "#FFFFFF",
      danger: "#C84B4B"
    },
    sandBlue: {
      name: "Sand Blue",
      bg: "#EBE4D1",
      panel: "#B4B4B3",
      panel2: "#26577C",
      text: "#1B1B1B",
      muted: "#6C6C6C",
      accent: "#E55704",
      accentText: "#FFFFFF",
      danger: "#C62828"
    }
  };

  let deferredInstallPrompt = null;

  function $(id) {
    return document.getElementById(id);
  }

  function on(id, eventName, handler) {
    const el = $(id);
    if (el) el.addEventListener(eventName, handler);
  }

  function generateId() {
    return crypto.randomUUID();
  }

  function isStandaloneMode() {
    return window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function isSafari() {
    const ua = window.navigator.userAgent;
    return /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua);
  }

  function showInstallGate() {
    const installGate = $("installGate");
    const loginPage = $("loginPage");
    const appRoot = $("appRoot");
    const installBtn = $("installAppBtn");
    const iosHint = $("iosInstallHint");
    const installMessage = $("installMessage");

    if (installGate) installGate.classList.remove("hidden");
    if (loginPage) loginPage.classList.add("hidden");
    if (appRoot) appRoot.classList.add("hidden");

    if (installBtn) installBtn.classList.add("hidden");
    if (iosHint) iosHint.classList.add("hidden");

    if (deferredInstallPrompt) {
      if (installBtn) installBtn.classList.remove("hidden");
      if (installMessage) {
        installMessage.textContent = "這個 App 只能從主畫面啟動使用，請先加入主畫面。";
      }
      return;
    }

    if (isIOS() && isSafari()) {
      if (iosHint) iosHint.classList.remove("hidden");
      if (installMessage) {
        installMessage.textContent = "iPhone / iPad 請先手動加入主畫面後再使用。";
      }
      return;
    }

    if (installMessage) {
      installMessage.textContent = "請使用瀏覽器的安裝功能或選單中的「加入主畫面」。";
    }
  }

  function hideInstallGate() {
    const installGate = $("installGate");
    if (installGate) installGate.classList.add("hidden");
  }

  async function handleInstallClick() {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;

    const installBtn = $("installAppBtn");
    if (installBtn) installBtn.classList.add("hidden");
  }

  function getModalPanel(id) {
    const modal = $(id);
    if (!modal) return null;
    return modal.querySelector(".modal-panel");
  }

  function scrollModalToTop(id) {
    const panel = getModalPanel(id);
    if (panel) panel.scrollTop = 0;
  }

  function showAuthMessage(message, isError = false) {
    const el = $("authMessage");
    if (!el) return;
    el.textContent = message || "";
    el.style.color = isError ? "#b91c1c" : "var(--muted)";
  }

  function showLoginPage() {
    const loginPage = $("loginPage");
    const appRoot = $("appRoot");
    if (loginPage) loginPage.classList.remove("hidden");
    if (appRoot) appRoot.classList.add("hidden");
  }

  function showAppPage() {
    const loginPage = $("loginPage");
    const appRoot = $("appRoot");
    if (loginPage) loginPage.classList.add("hidden");
    if (appRoot) appRoot.classList.remove("hidden");
  }

  function showLoginView() {
    const loginView = $("loginView");
    const signupView = $("signupView");
    if (loginView) loginView.classList.remove("hidden");
    if (signupView) signupView.classList.add("hidden");
    showAuthMessage("");
  }

  function showSignupView() {
    const loginView = $("loginView");
    const signupView = $("signupView");
    if (loginView) loginView.classList.add("hidden");
    if (signupView) signupView.classList.remove("hidden");
    showAuthMessage("");
  }

  function isAnyModalOpen() {
    return [
      "editorModal",
      "detailModal",
      "statsModal",
      "settingsModal",
      "profileModal",
      "passwordModal",
      "themeModal",
      "appNameModal"
    ].some(id => {
      const modal = $(id);
      return modal && !modal.classList.contains("hidden");
    });
  }

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => scrollModalToTop(id));
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add("hidden");

    if (id === "editorModal") {
      resetEditorState();
    } else {
      scrollModalToTop(id);
    }

    if (!isAnyModalOpen()) {
      document.body.style.overflow = "";
    }
  }

  function closeModalSilently(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add("hidden");
  }

  function closeAllModals() {
    [
      "editorModal",
      "detailModal",
      "statsModal",
      "settingsModal",
      "profileModal",
      "passwordModal",
      "themeModal",
      "appNameModal"
    ].forEach(closeModalSilently);

    document.body.style.overflow = "";
  }

  function switchToChildModal(childId) {
    closeModalSilently("settingsModal");
    openModal(childId);
  }

  function returnToSettings(fromId) {
    closeModal(fromId);
    openModal("settingsModal");
  }

  function setItemSubmitButtonLoading(isLoading) {
    const submitBtn = document.querySelector("#itemForm button[type='submit']");
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "儲存中..." : "儲存模型";
    submitBtn.style.opacity = isLoading ? "0.7" : "1";
    submitBtn.style.pointerEvents = isLoading ? "none" : "auto";
  }

  function setProfileSubmitButtonLoading(isLoading) {
    const submitBtn = document.querySelector("#profileForm button[type='submit']");
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "儲存中..." : "儲存個人資料";
  }

  function setPasswordSubmitButtonLoading(isLoading) {
    const submitBtn = document.querySelector("#passwordForm button[type='submit']");
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "儲存中..." : "儲存新密碼";
  }

  function setAppNameSubmitButtonLoading(isLoading) {
    const submitBtn = document.querySelector("#appNameForm button[type='submit']");
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "儲存中..." : "儲存名稱";
  }

  function getDisplayName() {
    const meta = state.currentUser?.user_metadata || {};
    return meta.display_name || "使用者";
  }

  function refreshTopbar() {
    const appName = window.StorageManager?.getAppName
      ? StorageManager.getAppName()
      : "Car Wallet";

    if (window.UI?.renderTopbar) {
      UI.renderTopbar({
        userName: getDisplayName(),
        appName
      });
      return;
    }

    const subtitleEl = $("topbarSubtitle");
    const titleEl = $("topbarTitle");
    if (subtitleEl) subtitleEl.textContent = `${getDisplayName()}的模型帳本`;
    if (titleEl) titleEl.textContent = appName;
    document.title = appName;
  }

  function refreshList() {
    if (window.UI?.renderSummary) {
      UI.renderSummary(state.items);
    }
    if (window.UI?.renderItemList) {
      UI.renderItemList(
        state.items,
        state.searchKeyword,
        state.statusFilter,
        state.isEditMode
      );
    }

    const toggleBtn = $("toggleEditBtn");
    if (toggleBtn) {
      toggleBtn.textContent = state.isEditMode ? "完成" : "編輯";
    }
  }

  function findItem(id) {
    return state.items.find(item => item.id === id);
  }

  async function reloadItems() {
    if (!window.StorageManager?.getItems) return;
    state.items = await StorageManager.getItems();
    refreshList();
  }

  function resetEditorState() {
    state.editingId = null;
    state.tempImage = "";
    state.tempFile = null;
    state.isSubmitting = false;
    if (window.UI?.setEditorMode) UI.setEditorMode(false);
    if (window.UI?.resetForm) UI.resetForm();
    setItemSubmitButtonLoading(false);
    scrollModalToTop("editorModal");
  }

  function resetPasswordForm() {
    if ($("profilePassword")) $("profilePassword").value = "";
    if ($("profilePassword2")) $("profilePassword2").value = "";
  }

  function fillAppNameForm() {
    if ($("appNameInput") && window.StorageManager?.getAppName) {
      $("appNameInput").value = StorageManager.getAppName();
    }
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

    if (window.UI?.setEditorMode) UI.setEditorMode(true);
    if (window.UI?.fillForm) UI.fillForm(item);

    setItemSubmitButtonLoading(false);
    openModal("editorModal");
  }

  function showDetail(id) {
    const item = findItem(id);
    if (!item) return;

    if (window.UI?.renderDetail) UI.renderDetail(item);
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

    if (state.isSubmitting) return;

    const name = $("nameInput")?.value.trim();
    if (!name) {
      alert("模型名稱不能空白");
      return;
    }

    state.isSubmitting = true;
    setItemSubmitButtonLoading(true);

    const existing = state.items.find(item => item.id === state.editingId);
    let imageUrl = state.tempImage || "";

    try {
      if (state.tempFile) {
        imageUrl = await StorageManager.uploadImage(state.tempFile);
      }

      const payload = {
        id: state.editingId || generateId(),
        name,
        brand: $("brandInput")?.value.trim() || "",
        series: $("seriesInput")?.value.trim() || "",
        price: Number($("priceInput")?.value || 0),
        purchaseDate: $("dateInput")?.value || "",
        purchasePlace: $("placeInput")?.value.trim() || "",
        status: $("statusInput")?.value || "",
        notes: $("notesInput")?.value.trim() || "",
        image: imageUrl,
        createdAt: state.editingId ? (existing?.createdAt || Date.now()) : Date.now()
      };

      await StorageManager.saveItem(payload);
      await reloadItems();
      closeModal("editorModal");
    } catch (error) {
      console.error(error);
      alert(`儲存失敗：${error?.message || error}`);
    } finally {
      state.isSubmitting = false;
      setItemSubmitButtonLoading(false);
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      state.tempFile = null;
      state.tempImage = "";
      if (window.UI?.renderImagePreview) UI.renderImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("請選擇圖片檔案");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("圖片請控制在 10MB 以內");
      event.target.value = "";
      return;
    }

    state.tempFile = file;

    const reader = new FileReader();
    reader.onload = e => {
      state.tempImage = e.target.result;
      if (window.UI?.renderImagePreview) UI.renderImagePreview(state.tempImage);
    };
    reader.readAsDataURL(file);
  }

  function resetStatsSectionsIfNeeded() {
    const modalBody = $("statsModalPanel");
    if (!modalBody) return;

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
    if (window.Stats?.render) Stats.render(state.items);
  }

  async function fillProfileForm() {
    const user = await StorageManager.getCurrentUser();
    if (!user) throw new Error("目前沒有登入使用者");

    state.currentUser = user;

    const meta = user.user_metadata || {};
    if ($("profileName")) $("profileName").value = meta.display_name || "";
    if ($("profileGender")) $("profileGender").value = meta.gender || "";
    if ($("profileEmail")) $("profileEmail").value = user.email || "";
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (state.isProfileSubmitting) return;

    const name = $("profileName")?.value.trim();
    const gender = $("profileGender")?.value;
    const email = $("profileEmail")?.value.trim();

    if (!name || !gender || !email) {
      alert("姓名、性別、Email 不能空白");
      return;
    }

    state.isProfileSubmitting = true;
    setProfileSubmitButtonLoading(true);

    try {
      await StorageManager.updateProfile({ name, gender, email });
      state.currentUser = await StorageManager.getCurrentUser();
      refreshTopbar();
      await fillProfileForm();
      alert("個人資料已更新");
      returnToSettings("profileModal");
    } catch (error) {
      console.error(error);
      alert(`更新失敗：${error?.message || error}`);
    } finally {
      state.isProfileSubmitting = false;
      setProfileSubmitButtonLoading(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (state.isPasswordSubmitting) return;

    const password = $("profilePassword")?.value;
    const password2 = $("profilePassword2")?.value;

    if (!password || !password2) {
      alert("請輸入新密碼並再次確認");
      return;
    }

    if (password !== password2) {
      alert("兩次新密碼不一致");
      return;
    }

    if (password.length < 6) {
      alert("新密碼至少 6 碼");
      return;
    }

    state.isPasswordSubmitting = true;
    setPasswordSubmitButtonLoading(true);

    try {
      await StorageManager.updatePassword(password);
      resetPasswordForm();
      alert("密碼已更新");
      returnToSettings("passwordModal");
    } catch (error) {
      console.error(error);
      alert(`更新失敗：${error?.message || error}`);
    } finally {
      state.isPasswordSubmitting = false;
      setPasswordSubmitButtonLoading(false);
    }
  }

  function saveAppName(event) {
    event.preventDefault();
    if (state.isAppNameSubmitting) return;

    const appName = $("appNameInput")?.value.trim();

    if (!appName) {
      alert("名稱不能空白");
      return;
    }

    if (appName.length > 30) {
      alert("名稱請控制在 30 字內");
      return;
    }

    state.isAppNameSubmitting = true;
    setAppNameSubmitButtonLoading(true);

    try {
      StorageManager.saveAppName(appName);
      refreshTopbar();
      alert("名稱已更新");
      returnToSettings("appNameModal");
    } catch (error) {
      console.error(error);
      alert(`更新失敗：${error?.message || error}`);
    } finally {
      state.isAppNameSubmitting = false;
      setAppNameSubmitButtonLoading(false);
    }
  }

  async function login() {
    try {
      const email = $("loginEmail")?.value.trim();
      const password = $("loginPassword")?.value;

      if (!email || !password) {
        showAuthMessage("請輸入 Email 與密碼", true);
        return;
      }

      if (!window.supabaseClient?.auth) {
        showAuthMessage("Supabase 未正確載入", true);
        return;
      }

      showAuthMessage("登入中...", false);

      const { error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showAuthMessage(error.message, true);
        return;
      }

      showAuthMessage("");
      await bootstrapAuthedApp();
    } catch (error) {
      console.error("login error:", error);
      showAuthMessage(error?.message || "登入失敗", true);
    }
  }

  async function signup() {
    try {
      const name = $("signupName")?.value.trim();
      const gender = $("signupGender")?.value;
      const email = $("signupEmail")?.value.trim();
      const password = $("signupPassword")?.value;
      const password2 = $("signupPassword2")?.value;

      if (!name || !gender || !email || !password || !password2) {
        showAuthMessage("請填完整資料", true);
        return;
      }

      if (password !== password2) {
        showAuthMessage("兩次密碼不一致", true);
        return;
      }

      if (password.length < 6) {
        showAuthMessage("密碼至少 6 碼", true);
        return;
      }

      const { error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            gender: gender
          }
        }
      });

      if (error) {
        showAuthMessage(error.message, true);
        return;
      }

      showAuthMessage("註冊成功，請登入", false);
      showLoginView();

      if ($("signupName")) $("signupName").value = "";
      if ($("signupGender")) $("signupGender").value = "";
      if ($("signupEmail")) $("signupEmail").value = "";
      if ($("signupPassword")) $("signupPassword").value = "";
      if ($("signupPassword2")) $("signupPassword2").value = "";
    } catch (error) {
      console.error("signup error:", error);
      showAuthMessage(error?.message || "註冊失敗", true);
    }
  }

  async function logout() {
    const logoutBtn = $("logoutBtn");
    if (logoutBtn) {
      logoutBtn.disabled = true;
      logoutBtn.textContent = "登出中...";
    }

    try {
      if (window.supabaseClient?.auth) {
        await window.supabaseClient.auth.signOut();
      }

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("sb-")) {
          localStorage.removeItem(key);
        }
      });

      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith("sb-")) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("logout error:", error);
    } finally {
      state.currentUser = null;
      state.items = [];
      state.editingId = null;
      state.searchKeyword = "";
      state.statusFilter = "";
      state.tempImage = "";
      state.tempFile = null;
      state.isEditMode = false;
      state.isSubmitting = false;
      state.isProfileSubmitting = false;
      state.isPasswordSubmitting = false;
      state.isAppNameSubmitting = false;

      refreshList();
      closeAllModals();
      showLoginPage();
      showLoginView();

      if ($("loginEmail")) $("loginEmail").value = "";
      if ($("loginPassword")) $("loginPassword").value = "";

      if (logoutBtn) {
        logoutBtn.disabled = false;
        logoutBtn.textContent = "登出帳號";
      }
    }
  }

  function applyThemeByKey(themeKey) {
    const theme = THEMES[themeKey];
    if (!theme) return;

    if (window.UI?.applyTheme) UI.applyTheme(theme);
    if (window.StorageManager?.saveTheme) StorageManager.saveTheme(theme);
    updateThemeSelection(themeKey);
  }

  function isSameTheme(savedTheme, targetTheme) {
    if (!savedTheme || !targetTheme) return false;

    return (
      savedTheme.bg === targetTheme.bg &&
      savedTheme.panel === targetTheme.panel &&
      savedTheme.panel2 === targetTheme.panel2 &&
      savedTheme.text === targetTheme.text &&
      savedTheme.muted === targetTheme.muted &&
      savedTheme.accent === targetTheme.accent &&
      savedTheme.accentText === targetTheme.accentText &&
      savedTheme.danger === targetTheme.danger
    );
  }

  function getCurrentThemeKey() {
    const savedTheme = window.StorageManager?.getTheme ? StorageManager.getTheme() : null;

    for (const [key, theme] of Object.entries(THEMES)) {
      if (isSameTheme(savedTheme, theme)) {
        return key;
      }
    }

    return "sage";
  }

  function updateThemeSelection(selectedKey) {
    document.querySelectorAll(".theme-option").forEach(btn => {
      const isActive = btn.dataset.theme === selectedKey;
      btn.classList.toggle("active", isActive);

      const badge = btn.querySelector(".theme-selected-badge");
      if (badge) {
        badge.textContent = isActive ? "使用中" : "";
      }
    });
  }

  function bindThemePresetEvents() {
    document.querySelectorAll(".theme-option").forEach(btn => {
      btn.addEventListener("click", () => {
        const themeKey = btn.dataset.theme;
        applyThemeByKey(themeKey);
      });
    });
  }

  function bindCloseButtons() {
    document.addEventListener("click", event => {
      const closeType = event.target.dataset.close;
      if (!closeType) return;

      if (state.isSubmitting && closeType === "editor") return;
      if (state.isProfileSubmitting && closeType === "profile") return;
      if (state.isPasswordSubmitting && closeType === "password") return;
      if (state.isAppNameSubmitting && closeType === "appname") return;

      if (closeType === "editor") closeModal("editorModal");
      if (closeType === "detail") closeModal("detailModal");
      if (closeType === "stats") closeModal("statsModal");
      if (closeType === "settings") closeModal("settingsModal");

      if (closeType === "profile") returnToSettings("profileModal");
      if (closeType === "password") returnToSettings("passwordModal");
      if (closeType === "theme") returnToSettings("themeModal");
      if (closeType === "appname") returnToSettings("appNameModal");
    });
  }

  function toggleEditMode() {
    state.isEditMode = !state.isEditMode;
    refreshList();
  }

  function bindAppEvents() {
    on("addBtn", "click", startCreate);
    on("itemForm", "submit", submitForm);
    on("imageInput", "change", handleImageChange);

    on("searchInput", "input", e => {
      state.searchKeyword = e.target.value.trim();
      refreshList();
    });

    on("statusFilter", "change", e => {
      state.statusFilter = e.target.value;
      refreshList();
    });

    on("toggleEditBtn", "click", toggleEditMode);

    const itemList = $("itemList");
    if (itemList) {
      itemList.addEventListener("click", event => {
        const target = event.target.closest("[data-action]");
        if (!target) return;

        const action = target.dataset.action;
        const id = target.dataset.id;

        if (action === "detail") showDetail(id);
        if (action === "edit") startEdit(id);
        if (action === "delete") removeItem(id);
      });
    }

    on("summaryCard", "click", openStats);

    on("settingsBtn", "click", () => {
      openModal("settingsModal");
    });

    on("openProfileBtn", "click", async () => {
      try {
        await fillProfileForm();
        switchToChildModal("profileModal");
      } catch (error) {
        console.error(error);
        alert(`讀取個人資料失敗：${error?.message || error}`);
      }
    });

    on("openPasswordBtn", "click", () => {
      resetPasswordForm();
      switchToChildModal("passwordModal");
    });

    on("openThemeBtn", "click", () => {
      updateThemeSelection(getCurrentThemeKey());
      switchToChildModal("themeModal");
    });

    on("openAppNameBtn", "click", () => {
      fillAppNameForm();
      switchToChildModal("appNameModal");
    });

    on("profileForm", "submit", saveProfile);
    on("passwordForm", "submit", savePassword);
    on("appNameForm", "submit", saveAppName);

    on("settingsExportBtn", "click", () => {
      if (window.StorageManager?.exportItems) {
        StorageManager.exportItems(state.items);
      }
    });

    on("logoutBtn", "click", logout);

    bindThemePresetEvents();
    bindCloseButtons();
  }

  function bindAuthEvents() {
    on("loginBtn", "click", login);
    on("signupBtn", "click", signup);
    on("goSignup", "click", showSignupView);
    on("goLogin", "click", showLoginView);
  }

  function applySavedTheme() {
    const savedTheme = window.StorageManager?.getTheme ? StorageManager.getTheme() : null;
    const fallbackTheme = THEMES.sage;

    if (window.UI?.applyTheme) {
      UI.applyTheme(savedTheme || fallbackTheme);
    }
    updateThemeSelection(getCurrentThemeKey());
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

  async function bootstrapAuthedApp() {
    if (!window.StorageManager?.getCurrentUser) {
      throw new Error("storage.js 未正確載入");
    }

    state.currentUser = await StorageManager.getCurrentUser();

    if (!state.currentUser) {
      showLoginPage();
      showLoginView();
      return;
    }

    showAppPage();
    applySavedTheme();
    refreshTopbar();
    await reloadItems();
  }

  async function init() {
    on("installAppBtn", "click", handleInstallClick);

    if (!isStandaloneMode()) {
      showInstallGate();
      return;
    }

    hideInstallGate();
    showLoginPage();
    showLoginView();

    bindAuthEvents();
    bindAppEvents();
    applySavedTheme();

    if (!window.StorageManager?.getSessionUser) return;

    try {
      const sessionUser = await StorageManager.getSessionUser();
      if (sessionUser) {
        await bootstrapAuthedApp();
      }
    } catch (error) {
      console.error("init session error:", error);
      showLoginPage();
      showLoginView();
    }

    if (window.supabaseClient?.auth?.onAuthStateChange) {
      window.supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          state.currentUser = session.user;
          refreshTopbar();
        } else {
          state.currentUser = null;
        }
      });
    }

    registerServiceWorker();
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;

    if (!isStandaloneMode()) {
      const installBtn = $("installAppBtn");
      const installMessage = $("installMessage");
      if (installBtn) installBtn.classList.remove("hidden");
      if (installMessage) {
        installMessage.textContent = "這個 App 只能從主畫面啟動使用，請先加入主畫面。";
      }
    }
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    const installBtn = $("installAppBtn");
    if (installBtn) installBtn.classList.add("hidden");
  });

  init();
})();