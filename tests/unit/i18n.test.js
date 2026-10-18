import { afterEach, describe, it, expect } from "vitest";
import fs from "node:fs";
import i18n, { tr, countText, formatDate } from "../../src/i18n/index.js";
import { kinshipLabel } from "../../src/i18n/kinship.js";
import { parseArchive } from "../../src/lib/storage.js";
import { makeSeed } from "../../src/data/seed.js";
import { biography, bookHtml } from "../../src/lib/stories.js";
import ru from "../../src/i18n/ru.json";
import en from "../../src/i18n/en.json";
afterEach(() => i18n.changeLanguage("en"));
describe("English and Russian presentation", () => {
  it("has Russian messages for every literal UI translation key", () => {
    const sourceFiles = fs
      .readdirSync(new URL("../../src/", import.meta.url), { recursive: true })
      .filter((f) => /\.(js|jsx)$/.test(f));
    const absent = [];
    for (const file of sourceFiles) {
      const text = fs.readFileSync(
        new URL("../../src/" + file, import.meta.url),
        "utf8",
      );
      for (const match of text.matchAll(/\btr\(\s*("(?:[^"\\]|\\.)*")/g)) {
        const key = JSON.parse(match[1]).trim();
        if (
          !(key in ru) &&
          !Object.keys(ru).some((k) => k.startsWith(key + "_"))
        )
          absent.push({ file, key });
      }
    }
    expect(absent).toEqual([]);
  });
  it("preserves interpolation tokens in Russian catalog entries", () => {
    const tokens = (text) =>
      [...new Set([...text.matchAll(/{{(\w+)}}/g)].map((m) => m[1]))].sort();
    for (const [key, value] of Object.entries(ru)) {
      const original =
        en[key] ?? en[key.replace(/_(few|many)$/, "_other")] ?? key;
      expect(tokens(value), key).toEqual(tokens(original));
    }
  });
  it.each([
    [1, "1 человек"],
    [2, "2 человека"],
    [5, "5 человек"],
    [21, "21 человек"],
    [22, "22 человека"],
    [25, "25 человек"],
  ])("uses Russian plural forms for %i", async (count, expected) => {
    await i18n.changeLanguage("ru");
    expect(countText("personCount", count)).toBe(expected);
  });
  it("switches existing feedback back to English and preserves user interpolation", async () => {
    await i18n.changeLanguage("ru");
    const message = tr("Required");
    expect(message).toBe("Обязательное поле");
    expect(tr("Open {{v0}}", { v0: "Save" })).toBe("Открыть Save");
    await i18n.changeLanguage("en");
    expect(tr(message)).toBe("Required");
    expect(tr(" Open {{v0}} ", { v0: "Иван" })).toBe(" Open Иван ");
  });
  it("formats Russian dates and deep kinship without modifying source records", async () => {
    const data = parseArchive(makeSeed()),
      before = JSON.stringify(data);
    await i18n.changeLanguage("ru");
    expect(formatDate("2026-10-17T12:00:00Z", { month: "long" })).toBe(
      "октябрь",
    );
    expect(kinshipLabel("great-great-grandfather")).toBe("прапрадедушка");
    expect(kinshipLabel("first cousin once removed")).toContain(
      "разница поколений: 1",
    );
    expect(JSON.stringify(data)).toBe(before);
  });
  it("generates Russian book labels and factual drafts while preserving archive prose", async () => {
    const data = parseArchive(makeSeed()),
      before = JSON.stringify(data);
    await i18n.changeLanguage("ru");
    const draft = biography(data, "yosef");
    expect(draft).toContain("рождение");
    expect(draft).toContain(data.people[0].bio);
    const html = await bookHtml(
      data,
      ["yosef"],
      "Книга",
      "My unchanged narrative",
    );
    expect(html).toContain('lang="ru"');
    expect(html).toContain("Источники и свидетельства");
    expect(html).toContain("My unchanged narrative");
    expect(JSON.stringify(data)).toBe(before);
  });
});
