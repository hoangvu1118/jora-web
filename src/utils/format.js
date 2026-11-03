// Small text helpers shared by several screens.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HOUR = 60 * 60 * 1000;

// Jora crawls job boards at 06:00 and 18:00 in Vietnam (UTC+7, no daylight saving).
const CRAWL_HOURS_IN_VIETNAM = [6, 18];
const VIETNAM_OFFSET_HOURS = 7;

// "2021-03" -> "Mar 2021". Empty -> "now".
export function formatYearMonth(value) {
  if (!value) {
    return "now";
  }
  const parts = String(value).split("-");
  const year = parts[0];
  const month = Number(parts[1]);
  if (!month) {
    return year;
  }
  return MONTHS[month - 1] + " " + year;
}

// "2026-11-02T10:15:00" -> "2 Nov"
export function formatDay(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return date.getDate() + " " + MONTHS[date.getMonth()];
}

// Joins the parts that have a value: ["Singapore", "", "Hybrid"] -> "Singapore · Hybrid"
// Pass ", " as the separator for "Software Engineer, Lazada".
export function joinParts(parts, separator = " · ") {
  const filled = [];
  for (const part of parts) {
    if (part) {
      filled.push(part);
    }
  }
  return filled.join(separator);
}

// The crawl times in the user's own time zone, for example ["07:00", "19:00"] in Singapore.
export function getCrawlTimesLocal() {
  const times = [];
  for (const hour of CRAWL_HOURS_IN_VIETNAM) {
    const crawl = new Date(Date.UTC(2026, 0, 15, hour - VIETNAM_OFFSET_HOURS));
    times.push(formatClock(crawl));
  }
  times.sort();
  return times;
}

// The date and time of the next crawl after `now`.
export function getNextCrawl(now) {
  const vietnamNow = new Date(now.getTime() + VIETNAM_OFFSET_HOURS * HOUR);
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    for (const hour of CRAWL_HOURS_IN_VIETNAM) {
      const crawlTime = Date.UTC(
        vietnamNow.getUTCFullYear(),
        vietnamNow.getUTCMonth(),
        vietnamNow.getUTCDate() + dayOffset,
        hour - VIETNAM_OFFSET_HOURS
      );
      if (crawlTime > now.getTime()) {
        return new Date(crawlTime);
      }
    }
  }
  return now;
}

// 19:00 style, in the user's time zone.
export function formatClock(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Whole hours and minutes until `date`: { hours: 7, minutes: 42 }
export function timeUntil(date, now) {
  const totalMinutes = Math.max(0, Math.round((date.getTime() - now.getTime()) / 60000));
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}
