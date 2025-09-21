const router = require("express").Router();
const authMiddleware = require("../../helpers/common/authMiddleware");
const {
  logActivity,
  getRawActivity,
  fillSeries,
} = require("../../controllers/user/streakController");
const { toDayKey } = require("../../utils/dayKey");

router.post("/activity/ping", authMiddleware, async (req, res) => {
  try {
    const tz = req.user.timezone || "Asia/Kolkata";
    await logActivity(req.user.id, new Date(), tz);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// heatmap data
// heatmap data
router.get("/activity/heatmap", authMiddleware, async (req, res) => {
  try {
    const tz = req.user.timezone || "Asia/Kolkata";
    const days = Number(req.query.days || 365);
    const mode = req.query.mode || "past";

    let series;
    if (mode === "future") {
      const raw = await getRawActivity(req.user.id, "2025-08-20");
      // Create start date and pass it to fillSeries
      const startDate = new Date("2025-08-20");
      series = fillSeries(days, tz, raw, startDate);
    } else {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1));
      const sinceKey = toDayKey(d, tz);
      const raw = await getRawActivity(req.user.id, sinceKey);
      series = fillSeries(days, tz, raw);
    }

    res.json({ success: true, data: series });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
