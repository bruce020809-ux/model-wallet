window.StorageManager = (() => {
  async function getCurrentUser() {
    const {
      data: { user },
      error
    } = await window.supabaseClient.auth.getUser();

    if (error) {
      console.error("取得使用者失敗:", error);
      throw error;
    }

    return user;
  }

  async function getSessionUser() {
    const {
      data: { session },
      error
    } = await window.supabaseClient.auth.getSession();

    if (error) {
      console.error("取得 session 失敗:", error);
      throw error;
    }

    return session?.user || null;
  }

  async function getItems() {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await window.supabaseClient
      .from("cars")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("讀取 cars 失敗:", error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      brand: row.brand || "",
      series: row.series || "",
      price: row.price || 0,
      purchaseDate: row.purchase_date || "",
      purchasePlace: row.purchase_place || "",
      status: row.status || "",
      notes: row.notes || "",
      image: row.image_url || "",
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    }));
  }

  async function saveItem(item) {
    const user = await getCurrentUser();
    if (!user) throw new Error("尚未登入");

    const payload = {
      id: item.id,
      owner_id: user.id,
      name: item.name,
      brand: item.brand,
      series: item.series,
      price: item.price,
      purchase_date: item.purchaseDate || null,
      purchase_place: item.purchasePlace,
      status: item.status,
      notes: item.notes,
      image_url: item.image || null
    };

    const { error } = await window.supabaseClient
      .from("cars")
      .upsert(payload);

    if (error) {
      console.error("儲存 car 失敗:", error);
      throw error;
    }
  }

  async function deleteItem(id) {
    const user = await getCurrentUser();
    if (!user) throw new Error("尚未登入");

    const { error } = await window.supabaseClient
      .from("cars")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);

    if (error) {
      console.error("刪除 car 失敗:", error);
      throw error;
    }
  }

  async function uploadImage(file) {
    if (!file) {
      throw new Error("沒有可上傳的圖片檔案");
    }

    const user = await getCurrentUser();
    if (!user) throw new Error("尚未登入");

    const originalName = file.name || "image.jpg";
    const ext = originalName.includes(".")
      ? originalName.split(".").pop().toLowerCase()
      : "jpg";

    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || "jpg"}`;

    const { error: uploadError } = await window.supabaseClient
      .storage
      .from(window.SUPABASE_CONFIG.bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg"
      });

    if (uploadError) {
      console.error("上傳圖片失敗:", uploadError);
      throw uploadError;
    }

    const { data } = window.supabaseClient
      .storage
      .from(window.SUPABASE_CONFIG.bucket)
      .getPublicUrl(fileName);

    if (!data?.publicUrl) {
      throw new Error("取得圖片公開網址失敗");
    }

    return data.publicUrl;
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

  function saveTheme(themeObject) {
    localStorage.setItem("car-wallet-theme-v4", JSON.stringify(themeObject));
  }

  function getTheme() {
    try {
      return JSON.parse(localStorage.getItem("car-wallet-theme-v4") || "null");
    } catch (error) {
      console.error("讀取 theme 失敗:", error);
      return null;
    }
  }

  return {
    getCurrentUser,
    getSessionUser,
    getItems,
    saveItem,
    deleteItem,
    uploadImage,
    exportItems,
    saveTheme,
    getTheme
  };
})();