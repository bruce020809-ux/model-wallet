window.SUPABASE_CONFIG = {
  url: "https://mvczovsjhqjqmrgufnvx.supabase.co",
  key: "sb_publishable_5vIVx6XfrZnTgCtQwZHhOQ__H7Yq-T3",
  bucket: "car-images"
};

window.supabaseClient = supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.key
);