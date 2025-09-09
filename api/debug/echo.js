module.exports = (req, res) => {
  const raw = req.headers["x-init-data"] || req.headers["x-initdata"] || "";
  res.status(200).json({ hasInitHeader: !!raw, initDataLength: (raw || "").length });
};
