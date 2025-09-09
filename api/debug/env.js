module.exports = (req, res) => {
  res.status(200).json({
    has_SUPABASE_URL: !!process.env.SUPABASE_URL,
    has_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_BOT_TOKEN: !!process.env.BOT_TOKEN
  });
};
