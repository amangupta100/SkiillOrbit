const DailyActivity = require("../../models/DailyActivity");
const { toDayKey } = require("../../utils/dayKey");

async function logActivity(userId, ts = new Date(), tz = "Asia/Kolkata") {
  const day = toDayKey(ts, tz);

  // Only insert if doesn't exist (avoids unnecessary writes)
  await DailyActivity.updateOne(
    { userId, day, count: { $ne: 1 } }, // only update if count != 1
    { $set: { count: 1 } },
    { upsert: true }
  );
}

async function getRawActivity(userId, sinceDayKey) {
  return DailyActivity.find(
    { userId, day: { $gte: sinceDayKey } },
    { day: 1, count: 1, _id: 0 } // projection faster than .select()
  ).lean();
}

function fillSeries(
  daysAhead = 365,
  tz = "Asia/Kolkata",
  raw = [],
  startDate = new Date()
) {
  const map = new Map(raw.map((r) => [r.day, r.count]));
  const series = [];

  let current = new Date(startDate);

  for (let i = 0; i < daysAhead; i++) {
    const key = toDayKey(current, tz);
    series.push({ date: key, count: map.get(key) || 0 });

    // Move to next day via timestamp (FAST)
    current = new Date(current.getTime() + 86400000);
  }

  return series;
}

function computeStreaks(series) {
  let max = 0;
  let run = 0;
  let current = 0;

  for (let i = 0; i < series.length; i++) {
    if (series[i].count > 0) {
      run++;
      max = Math.max(max, run);
    } else {
      run = 0;
    }
  }

  // Compute current streak in same pass
  current = run;

  return { currentStreak: current, maxStreak: max };
}

module.exports = { logActivity, getRawActivity, fillSeries, computeStreaks };
