window.StorageManager = (() => {
  function withTimeout(promise, ms = 20000, message = "操作逾時") {
    let timerId;

    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error(message));
      }, ms);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timerId);
    });
  }

  async function getCurrentUser() {
    const {
      data: { user },
      error
    } = await window.supabaseClient.auth.getUser();

    if (error) throw error;
    return user;
  }

  async function getSessionUser() {
    const {
      data: { session },
      error
    } = await window.supabaseClient.auth.getSession();

    if (error) throw error;
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

    if (error) throw error;

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

    const { data, error } = await window.supabaseClient
      .from("cars")
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      brand: data.brand || "",
      series: data.series || "",
      price: data.price || 0,
      purchaseDate: data.purchase_date || "",
      purchasePlace: data.purchase_place || "",
      status: data.status || "",
      notes: data.notes || "",
      image: data.image_url || "",
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now()
    };
  }

  async function deleteItem(id) {
    const user = await getCurrentUser();
    if (!user) throw new Error("尚未登入");

    const { error } = await window.supabaseClient
      .from("cars")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);

    if (error) throw error;
  }

  async function deleteAllMyItems() {
    const user = await getCurrentUser();
    if (!user) throw new Error("尚未登入");

    const { error } = await window.supabaseClient
      .from("cars")
      .delete()
      .eq("owner_id", user.id);

    if (error) throw error;
  }

  async function updateProfile({ name, gender, email }) {
    const { data, error } = await window.supabaseClient.auth.updateUser({
      email,
      data: {
        display_name: name,
        gender
      }
    });

    if (error) throw error;
    return data;
  }

  async function updatePassword(password) {
    const { data, error } = await window.supabaseClient.auth.updateUser({
      password
    });

    if (error) throw error;
    return data;
  }

  async function uploadImage(file) {
    if (!file) throw new Error("沒有可上傳的圖片檔案");
    if (!file.type?.startsWith("image/")) throw new Error("只能上傳圖片檔案");
    if (file.size > 10 * 1024 * 1024) throw new Error("圖片請控制在 10MB 以內");

    const user = await getCurrentUser();
    if (!user) throw new Error("尚未登入");

    const originalName = file.name || "image.jpg";
    const ext = originalName.includes(".")
      ? originalName.split(".").pop().toLowerCase()
      : "jpg";

    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || "jpg"}`;

    const { error: uploadError } = await withTimeout(
      window.supabaseClient
        .storage
        .from(window.SUPABASE_CONFIG.bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || "image/jpeg"
        }),
      20000,
      "圖片上傳逾時，請確認 bucket 權限或網路狀態"
    );

    if (uploadError) throw uploadError;

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
    localStorage.setItem("car-wallet-theme-v5", JSON.stringify(themeObject));
  }

  function getTheme() {
    try {
      return JSON.parse(localStorage.getItem("car-wallet-theme-v5") || "null");
    } catch {
      return null;
    }
  }

  function saveAppName(name) {
  localStorage.setItem("car-wallet-app-name", name || "Car Wallet");
}

function getAppName() {
  return localStorage.getItem("car-wallet-app-name") || "Car Wallet";
}
return {
  getCurrentUser,
  getSessionUser,
  getItems,
  saveItem,
  deleteItem,
  deleteAllMyItems,
  updateProfile,
  updatePassword,
  uploadImage,
  exportItems,
  saveTheme,
  getTheme,
  saveAppName,
  getAppName
};
})();