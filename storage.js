window.StorageManager = (() => {
  const STORAGE_KEY = "car-wallet-items-v3";
  const THEME_KEY = "car-wallet-theme-v1";

  function getItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (error) {
      console.error("讀取資料失敗:", error);
      return [];
    }
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function exportItems(items) {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: "application/json"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "car-wallet-backup.json";
    link.click();

    URL.revokeObjectURL(link.href);
  }

  function saveTheme(color) {
    localStorage.setItem(THEME_KEY, color);
  }

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || "#8b5cf6";
  }

  return {
    getItems,
    saveItems,
    exportItems,
    saveTheme,
    getTheme
  };
})();