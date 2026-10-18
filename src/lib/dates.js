import {tr} from "../i18n/index.js";
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
export function parseFamilyDate(input = "") {
  const text = String(input).trim();
  if (!text)
    return {
      text: "",
      year: null,
      month: null,
      day: null,
      qualifier: "unknown",
    };
  let value = text.toUpperCase(),
    qualifier = "exact";
  const prefix = value.match(/^(ABT|ABOUT|CIRCA|BEF|AFT|EST|CAL)\s+/);
  if (prefix) {
    qualifier = {
      ABT: "about",
      ABOUT: "about",
      CIRCA: "about",
      BEF: "before",
      AFT: "after",
      EST: "estimated",
      CAL: "calculated",
    }[prefix[1]];
    value = value.slice(prefix[0].length);
  }
  if (/^(BET|FROM) /.test(value)) {
    const range = value.match(
      /^(?:BET (-?\d{1,4}) AND (-?\d{1,4})|FROM (-?\d{1,4}) TO (-?\d{1,4}))$/,
    );
    if (!range) throw new Error(tr("Use a year range such as BET 1900 AND 1905."));
    const start = Number(range[1] ?? range[3]),
      end = Number(range[2] ?? range[4]);
    if (start > end) throw new Error(tr("Date range ends before it starts."));
    return { text, year: start, month: null, day: null, qualifier: "range" };
  }
  let year,
    month = null,
    day = null;
  const iso = value.match(/^(-?\d{1,4})(?:-(\d{2})(?:-(\d{2}))?)?$/),
    ged = value.match(/^(?:(\d{1,2}) )?([A-Z]{3}) (-?\d{1,4})$/);
  if (iso) {
    year = Number(iso[1]);
    month = iso[2] ? Number(iso[2]) : null;
    day = iso[3] ? Number(iso[3]) : null;
  } else if (ged && MONTHS.includes(ged[2])) {
    year = Number(ged[3]);
    month = MONTHS.indexOf(ged[2]) + 1;
    day = ged[1] ? Number(ged[1]) : null;
  } else
    throw new Error(
      tr("Use YYYY, YYYY-MM-DD, a GEDCOM date such as 12 MAY 1900, or ABT/BEF/AFT YYYY."),
    );
  if (
    Math.abs(year) > 9999 ||
    (month !== null && (month < 1 || month > 12)) ||
    (day !== null &&
      (day < 1 ||
        day >
          (month === 2
            ? year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
              ? 29
              : 28
            : [4, 6, 9, 11].includes(month)
              ? 30
              : 31)))
  )
    throw new Error(tr("This date is not valid."));
  return { text, year, month, day, qualifier };
}
export function exactAnniversary(text) {
  try {
    const d = parseFamilyDate(text);
    return d.qualifier === "exact" && d.month && d.day ? d : null;
  } catch {
    return null;
  }
}
export function dateLabel(p, kind = "birth") {
  return p[`${kind}Date`] || (p[kind] ?? tr("Unknown"));
}
