import assert from "node:assert/strict";
import fs from "node:fs";

const FORMAT = "jewcal-supporter-yahrzeits-3";
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^(\d{1,2})\s+(.+?)\s+(\d{4,})$/;

export function validateSupporterYahrzeits(content) {
  let root;
  try {
    root = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
  requireValue(root && typeof root === "object" && !Array.isArray(root), "Root must be an object");
  requireValue(root.format === FORMAT, `format must be ${FORMAT}`);
  requireValue(Array.isArray(root.entries), "entries must be an array");

  const identifiers = new Set();
  root.entries.forEach((entry, index) => {
    const label = `entries[${index}]`;
    requireValue(entry && typeof entry === "object" && !Array.isArray(entry), `${label} must be an object`);
    for (const field of ["id", "name", "from", "message", "hebrewDate"]) {
      requireValue(typeof entry[field] === "string" && entry[field].trim(), `${label}.${field} must be a nonblank string`);
    }
    const id = entry.id.trim();
    requireValue(ID_PATTERN.test(id), `${label}.id must be a lowercase slug`);
    requireValue(!identifiers.has(id), `${label}.id duplicates ${id}`);
    identifiers.add(id);
    validateHebrewDate(entry.hebrewDate, `${label}.hebrewDate`);
  });
  return root;
}

function validateHebrewDate(value, label) {
  const match = DATE_PATTERN.exec(value.trim());
  requireValue(match, `${label} must look like 15 Av 5786`);
  const day = Number(match[1]);
  const year = Number(match[3]);
  const monthName = match[2].trim().replace(/\s+/g, " ").toLowerCase();
  requireValue(Number.isSafeInteger(year) && year > 0, `${label} has an invalid year`);
  const leap = isLeapYear(year);
  const months = {
    nisan: 1,
    iyar: 2,
    sivan: 3,
    tammuz: 4,
    av: 5,
    elul: 6,
    tishrei: 7,
    cheshvan: 8,
    kislev: 9,
    tevet: 10,
    shevat: 11,
    adar: leap ? null : 12,
    "adar i": leap ? 12 : null,
    "adar ii": leap ? 13 : null,
  };
  const month = months[monthName];
  requireValue(month, `${label} has an invalid month for ${year}`);
  requireValue(day >= 1 && day <= daysInMonth(month, year), `${label} is not a real Hebrew date`);
}

function isLeapYear(year) {
  return (year * 7 + 1) % 19 < 7;
}

function daysInMonth(month, year) {
  if ([2, 4, 6, 10, 13].includes(month)) return 29;
  if (month === 8) return daysInYear(year) % 10 === 5 ? 30 : 29;
  if (month === 9) return daysInYear(year) % 10 === 3 ? 29 : 30;
  if (month === 12) return isLeapYear(year) ? 30 : 29;
  return 30;
}

function daysInYear(year) {
  return roshHashanahDay(year + 1) - roshHashanahDay(year);
}

function roshHashanahDay(year) {
  return moladDelay(year) + yearLengthDelay(year) + 347998;
}

function moladDelay(year) {
  const months = Math.floor((235 * year - 234) / 19);
  const parts = 12084 + 13753 * months;
  let day = months * 29 + Math.floor(parts / 25920);
  if ((3 * (day + 1)) % 7 < 3) day += 1;
  return day;
}

function yearLengthDelay(year) {
  const last = moladDelay(year - 1);
  const present = moladDelay(year);
  const next = moladDelay(year + 1);
  if (next - present === 356) return 2;
  if (present - last === 382) return 1;
  return 0;
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function selfTest() {
  const file = (entries) => JSON.stringify({ format: FORMAT, entries });
  const valid = {
    id: "cohen-rivka",
    name: "רבקה",
    from: "Cohen family",
    message: "May her memory be a blessing.",
    hebrewDate: "15 Av 5786",
  };
  assert.equal(validateSupporterYahrzeits(file([])).entries.length, 0);
  assert.equal(validateSupporterYahrzeits(file([valid])).entries[0].name, "רבקה");
  assert.throws(() => validateSupporterYahrzeits("{"));
  assert.throws(() => validateSupporterYahrzeits(file([valid, valid])));
  assert.throws(() => validateSupporterYahrzeits(file([{ ...valid, message: " " }])));
  assert.throws(() => validateSupporterYahrzeits(file([{ ...valid, hebrewDate: "30 Iyar 5786" }])));
  assert.throws(() => validateSupporterYahrzeits(file([{ ...valid, hebrewDate: "14 Adar 5784" }])));
  assert.doesNotThrow(() => validateSupporterYahrzeits(file([{ ...valid, hebrewDate: "14 Adar II 5784" }])));
}

if (process.argv[2] === "--self-test") {
  selfTest();
  console.log("Supporter yahrzeit validator tests passed");
} else {
  const path = process.argv[2] ?? "data/sy-8c41f7a2.json";
  validateSupporterYahrzeits(fs.readFileSync(path, "utf8"));
  console.log(`${path} is valid`);
}
