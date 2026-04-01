window.StorageManager = (() => {
  async function getItems() {
    const { data, error } = await window.supabaseClient
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("讀取 cars 失敗:", error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      brand: row.brand,
      series: row.series,
      price: row.price,
      purchaseDate: row.purchase_date,
      purchasePlace: row.purchase_place,
      status: row.status,
      notes: row.notes,
      image: row.image_url,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    }));
  }

  async function saveItem(item) {
    const payload = {
      id: item.id,
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
    const { error } = await window.supabaseClient
      .from("cars")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("刪除 car 失敗:", error);
      throw error;
    }
  }

  async function uploadImage(file, fileName) {
    const path = `covers/${fileName}`;

    const { error: uploadError } = await window.supabaseClient
      .storage
      .from(window.SUPABASE_CONFIG.bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error("上傳圖片失敗:", uploadError);
      throw uploadError;
    }

    const { data } = window.supabaseClient
      .storage
      .from(window.SUPABASE_CONFIG.bucket)
      .getPublicUrl(path);

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
    localStorage.setItem("car-wallet-theme-v2", JSON.stringify(themeObject));
  }

  function getTheme() {
    try {
      return JSON.parse(localStorage.getItem("car-wallet-theme-v2") || "null");
    } catch {
      return null;
    }
  }

  return {
    getItems,
    saveItem,
    deleteItem,
    uploadImage,
    exportItems,
    saveTheme,
    getTheme
  };
})();