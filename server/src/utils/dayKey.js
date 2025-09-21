function toDayKey(ts = new Date(), tz = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ts); // "2025-08-19"
}
module.exports = { toDayKey };
