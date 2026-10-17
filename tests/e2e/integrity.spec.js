import { test, expect } from "@playwright/test";
const stored = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("familyAtlas.v2")));
const nav = (page, name) =>
  page.locator("nav").getByRole("button", { name, exact: true }).click();
async function manage(page, tab = "People") {
  await nav(page, "Manage Data");
  await page
    .locator(".fa-content")
    .getByRole("button", { name: new RegExp(`^${tab}\\s*\\(`) })
    .first()
    .click();
}
const upload = (page, d) =>
  page
    .locator("input[type=file]")
    .setInputFiles({
      name: "archive.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(d)),
    });
const save = async (page) => {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
};

test("import validation, preview/cancel, backup and restore preserve the original archive", async ({
  page,
}) => {
  await page.goto("/");
  await manage(page);
  const original = await stored(page);
  await upload(page, { arbitrary: true });
  await expect(
    page.getByRole("alert").filter({ hasText: "complete Family Atlas" }),
  ).toBeVisible();
  expect(await stored(page)).toEqual(original);
  const replacement = structuredClone(original);
  replacement.people[0].bio = "Imported biography";
  await upload(page, replacement);
  await expect(page.getByRole("dialog")).toContainText("people: 13");
  expect(await stored(page)).toEqual(original);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  expect(await stored(page)).toEqual(original);
  await upload(page, replacement);
  await page
    .getByRole("button", { name: "Replace archive", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await stored(page)).people[0].bio).toBe("Imported biography");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("familyAtlas.backup")),
    ),
  ).toEqual(original);
  await page
    .getByRole("button", { name: "Restore previous archive", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore archive", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await stored(page)).people[0].bio).toBe(original.people[0].bio);
});

test("corrupt saved JSON remains available for recovery and can be safely replaced", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("installed-corruption")) {
      localStorage.setItem("familyAtlas.v2", "{broken");
      sessionStorage.setItem("installed-corruption", "yes");
    }
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "original has not been overwritten",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("familyAtlas.v2")),
  ).toBe("{broken");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export original", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "family-atlas-recovery.json",
  );
  await manage(page);
  const seed = await page.evaluate(async () =>
    (await import("/src/data/seed.js")).makeSeed(),
  );
  await upload(page, seed);
  await page
    .getByRole("button", { name: "Replace archive", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("familyAtlas.backup")),
  ).toBe("{broken");
  await page.reload();
  await expect(page.getByRole("heading", { name: /one story/ })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("simultaneous tabs retain different edits and detect stale edits to the same record", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await manage(page);
  const other = await context.newPage();
  await other.goto("/");
  await manage(other);
  const open = async (p) =>
    p
      .locator(".fa-card")
      .filter({ hasText: "Yosef Kaminski" })
      .first()
      .getByRole("button", { name: "Edit", exact: true })
      .click();
  await open(page);
  await open(other);
  await page
    .getByRole("textbox", { name: "Biography", exact: true })
    .fill("First writer");
  await save(page);
  await other
    .getByRole("textbox", { name: "Biography", exact: true })
    .fill("Stale writer");
  await other
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  await expect(other.getByRole("dialog").getByRole("alert")).toContainText(
    "changed in another tab",
  );
  expect((await stored(other)).people[0].bio).toBe("First writer");
  await other
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await manage(other, "Branches");
  await other.getByRole("button", { name: "Add branch", exact: true }).click();
  await other
    .getByRole("textbox", { name: "Branch name", exact: true })
    .fill("Second writer branch");
  await save(other);
  await expect
    .poll(async () =>
      (await stored(page)).branches.some(
        (b) => b.name === "Second writer branch",
      ),
    )
    .toBe(true);
  expect((await stored(page)).people[0].bio).toBe("First writer");
});

test("failed persistence warns and a retry saves the pending changes", async ({
  page,
}) => {
  await page.goto("/");
  await manage(page, "Branches");
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Add branch", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Branch name", exact: true })
    .fill("Pending branch");
  await save(page);
  await expect(page.getByRole("alert")).toContainText("not saved");
  expect(
    (await stored(page)).branches.some((b) => b.name === "Pending branch"),
  ).toBe(false);
  await page.evaluate(() => {
    Storage.prototype.setItem = window.originalSetItem;
  });
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(
    (await stored(page)).branches.some((b) => b.name === "Pending branch"),
  ).toBe(true);
});

test("keyboard multi-select and search activation work and dialog focus returns to its opener", async ({
  page,
}) => {
  await page.goto("/");
  await manage(page);
  await page.getByRole("button", { name: "Add person", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const opener = dialog.getByRole("button", { name: "Parents", exact: true });
  await opener.focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("combobox", { name: "Search choices", exact: true })
    .fill("Yosef");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(
    dialog.getByRole("button", { name: "Remove Yosef Kaminski", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(opener).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add person", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("combobox", { name: "Search the family", exact: true })
    .fill("Yosef");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Yosef Kaminski");
});

test('explicit siblings can be removed and generated-route edits update residences', async ({page}) => {
  await page.goto('/');
  await nav(page,'Manage Data');
  await page.locator('.fa-content').getByRole('button',{name:'Relationships',exact:true}).click();
  const selects=page.locator('.fa-content select');
  await selects.nth(0).selectOption('yosef');await selects.nth(1).selectOption('sibling');await selects.nth(2).selectOption('daniel');
  await page.getByRole('button',{name:'Add connection',exact:true}).click();
  await expect.poll(async()=>(await stored(page)).people.find(p=>p.id==='daniel').siblings.includes('yosef')).toBe(true);
  await page.locator('.fa-rel-grid > div').first().locator('span').filter({hasText:'Daniel Roth'}).filter({has:page.getByTitle('Remove',{exact:true})}).first().getByTitle('Remove',{exact:true}).click();
  await expect.poll(async()=>(await stored(page)).people.find(p=>p.id==='daniel').siblings.includes('yosef')).toBe(false);
  await manage(page,'Migrations');
  const route=page.locator('.fa-card').filter({hasText:'Minsk → Warsaw'}).filter({hasText:'Yosef Kaminski'}).first();
  await route.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByRole('spinbutton',{name:'Start year',exact:true}).fill('1922');
  await page.getByRole('textbox',{name:'Description',exact:true}).fill('Verified route description');await save(page);
  expect((await stored(page)).people.find(p=>p.id==='yosef').residences.some(r=>r.at==='warsaw'&&r.from===1922)).toBe(true);
  expect((await stored(page)).migrations.find(m=>m.personId==='yosef'&&m.to==='warsaw').description).toBe('Verified route description');
});
