const DailyActivity = require("../../models/DailyActivity");
const { toDayKey } = require("../../utils/dayKey");

async function logActivity(userId, ts = new Date(), tz = "Asia/Kolkata") {
  const day = toDayKey(ts, tz);
  // dashboard mount par bas "at least 1" chahiye:
  await DailyActivity.updateOne(
    { userId, day },
    { $set: { count: 1 } },
    { upsert: true }
  );
}

async function getRawActivity(userId, sinceDayKey) {
  return DailyActivity.find({ userId, day: { $gte: sinceDayKey } })
    .select("day count -_id")
    .lean();
}

function fillSeries(
  daysAhead = 365,
  tz = "Asia/Kolkata",
  raw = [],
  startDate = new Date()
) {
  const map = new Map(raw.map((r) => [r.day, r.count]));
  const series = [];

  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = toDayKey(d, tz);
    series.push({ date: key, count: map.get(key) || 0 });
  }
  return series;
}

function computeStreaks(series) {
  let max = 0,
    run = 0,
    current = 0;
  for (const day of series) {
    if (day.count > 0) {
      run++;
      max = Math.max(max, run);
    } else {
      run = 0;
    }
  }
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].count > 0) current++;
    else break;
  }
  return { currentStreak: current, maxStreak: max };
}

module.exports = { logActivity, getRawActivity, fillSeries, computeStreaks };
