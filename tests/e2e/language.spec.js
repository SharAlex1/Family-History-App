import { test, expect } from "@playwright/test";
const chooser = (page) =>
  page.getByRole("combobox", { name: "Language / Язык", exact: true });
const nav = (page, name) =>
  page.locator("nav").getByRole("button", { name, exact: true }).click();
const archive = (page) =>
  page.evaluate(() => localStorage.getItem("familyAtlas.v2"));

test("English/Russian choice persists without changing archive bytes, names or typed drafts", async ({
  page,
}) => {
  await page.goto("/");
  await expect.poll(() => archive(page)).not.toBeNull();
  const original = await archive(page);
  await chooser(page).selectOption("ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page).toHaveTitle("Семейный атлас");
  await expect(
    page
      .locator("nav")
      .getByRole("button", { name: "Семейное дерево", exact: true }),
  ).toBeVisible();
  expect(await archive(page)).toBe(original);
  await nav(page, "Семейные воспоминания");
  await page
    .getByRole("textbox", { name: "Имя автора", exact: true })
    .fill("Алексей");
  await page
    .getByRole("textbox", { name: "Ваше воспоминание", exact: true })
    .fill("English and русский текст — Save");
  await chooser(page).selectOption("en");
  await expect(
    page.getByRole("textbox", { name: "Contributor name", exact: true }),
  ).toHaveValue("Алексей");
  await expect(
    page.getByRole("textbox", { name: "Your memory", exact: true }),
  ).toHaveValue("English and русский текст — Save");
  expect(await archive(page)).toBe(original);
  await chooser(page).selectOption("ru");
  await page.reload();
  await expect(chooser(page)).toHaveValue("ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await nav(page, "Люди");
  await expect(page.getByText("Yosef Kaminski", { exact: true })).toBeVisible();
  expect(await archive(page)).toBe(original);
  await chooser(page).selectOption("en");
  await page.reload();
  await expect(chooser(page)).toHaveValue("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(await archive(page)).toBe(original);
});

test("Russian forms validate and save canonical enum values and Cyrillic records", async ({
  page,
}) => {
  await page.goto("/");
  await chooser(page).selectOption("ru");
  await nav(page, "Управление данными");
  await page
    .getByRole("button", { name: "Добавить человека", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(dialog.getByRole("alert").first()).toHaveText(
    "Обязательное поле",
  );
  await dialog.getByRole("textbox", { name: "Имя", exact: true }).fill("Иван");
  await dialog
    .getByRole("textbox", { name: "Фамилия", exact: true })
    .fill("Петров");
  await dialog
    .getByRole("spinbutton", { name: "Год рождения", exact: true })
    .fill("1980");
  await dialog
    .getByRole("combobox", { name: "Пол (необязательно)", exact: true })
    .selectOption("m");
  await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const data = JSON.parse(await archive(page));
  expect(data.people.find((p) => p.first === "Иван")).toMatchObject({
    first: "Иван",
    last: "Петров",
    gender: "m",
    birth: 1980,
  });
  await nav(page, "Документы");
  await page
    .getByRole("button", { name: "Загрузить записи", exact: true })
    .click();
  await dialog
    .getByRole("textbox", { name: "Название записи", exact: true })
    .fill("Семейное письмо");
  await dialog
    .getByRole("combobox", { name: "Тип записи", exact: true })
    .selectOption("letter");
  await dialog
    .getByRole("button", { name: "Сохранить запись", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(
    JSON.parse(await archive(page)).documents.find(
      (d) => d.title === "Семейное письмо",
    ).type,
  ).toBe("letter");
});

test("all Russian workspaces and language control fit desktop and phone layouts", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await chooser(page).selectOption("ru");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(chooser(page)).toBeVisible();
    for (const name of [
      "Обзор",
      "Семейное дерево",
      "Хронология",
      "Карта",
      "Люди",
      "Документы",
      "Жизненный путь",
      "Устная история",
      "Истории и книги",
      "Поиск родства",
      "Исследования и свидетельства",
      "Семейные воспоминания",
      "В этот день",
      "Импорт и объединение",
      "Управление данными",
    ]) {
      await nav(page, name);
      await expect(page.locator(".fa-content h1,.fa-content h2")).toBeVisible();
      const metrics = await page
        .locator(".fa-content")
        .evaluate((c) => ({ width: c.clientWidth, scroll: c.scrollWidth }));
      if (name !== "Семейное дерево")
        expect(metrics.scroll, `${name} at ${width}`).toBeLessThanOrEqual(
          metrics.width + 1,
        );
    }
  }
  expect(errors).toEqual([]);
});

test("unavailable preference storage does not prevent switching languages or alter the archive", async ({
  page,
}) => {
  await page.goto("/");
  await expect.poll(() => archive(page)).not.toBeNull();
  const original = await archive(page);
  await page.evaluate(() => {
    const save = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "familyAtlas.language")
        throw new DOMException("Blocked", "SecurityError");
      return save.call(this, key, value);
    };
  });
  await chooser(page).selectOption("ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("status")).toContainText(
    "Браузер не смог сохранить выбор",
  );
  expect(await archive(page)).toBe(original);
});

test("unsupported saved language falls back to English", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("familyAtlas.language", "unsupported"),
  );
  await page.goto("/");
  await expect(chooser(page)).toHaveValue("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.locator("nav").getByRole("button", { name: "Overview", exact: true }),
  ).toBeVisible();
});
