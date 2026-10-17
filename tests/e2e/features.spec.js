import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
const nav = (page, name) =>
  page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name, exact: true })
    .click();
const stored = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("familyAtlas.v2")));
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCDoAAAAASUVORK5CYII=",
  "base64",
);
const upload = async (page) => {
  await nav(page, "Documents");
  await page
    .getByRole("button", { name: "Upload records", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Record title", { exact: true })
    .fill("Family photograph");
  await dialog.getByLabel("Record year", { exact: true }).fill("1947");
  await dialog
    .getByLabel("Caption", { exact: true })
    .fill("A photograph to preserve");
  await dialog
    .getByLabel("People tagged", { exact: false })
    .selectOption(["yosef"]);
  await dialog
    .getByLabel("Attachments", { exact: true })
    .setInputFiles({ name: "family.png", mimeType: "image/png", buffer: png });
  await dialog
    .getByRole("button", { name: "Save record", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
};

test("media upload, viewer, reload and ZIP restore to a different browser context retain actual bytes", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await upload(page);
  const card = page
    .locator(".archive-card")
    .filter({ hasText: "Family photograph" });
  await expect(card.locator("img")).toBeVisible();
  expect(
    await card
      .locator("img")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
  ).toBe(true);
  await card.getByRole("button", { name: "Open record", exact: true }).click();
  await expect(page.getByRole("dialog").locator("img")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await nav(page, "Documents");
  await expect(
    page
      .locator(".archive-card")
      .filter({ hasText: "Family photograph" })
      .locator("img"),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export archive with media", exact: true })
    .click();
  const download = await downloadPromise,
    path = await download.path();
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto("/");
  await nav(other, "Documents");
  await other
    .getByLabel("Import media ZIP", { exact: true })
    .setInputFiles(path);
  await expect(other.getByRole("dialog")).toContainText("1 files");
  await other
    .getByRole("button", { name: "Import complete archive", exact: true })
    .click();
  await expect(other.getByRole("dialog")).toHaveCount(0);
  const restored = other
    .locator(".archive-card")
    .filter({ hasText: "Family photograph" });
  await expect(restored.locator("img")).toBeVisible();
  await expect
    .poll(() => restored.locator("img").evaluate((img) => img.naturalWidth))
    .toBe(1);
  expect(
    (await stored(other)).documents.find((d) => d.title === "Family photograph")
      .files[0].size,
  ).toBe(png.length);
  await context.close();
});

test("unsupported active files fail without adding a document", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Documents");
  const before = await stored(page);
  await page
    .getByRole("button", { name: "Upload records", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Record title", { exact: true }).fill("Unsafe file");
  await dialog
    .getByLabel("Attachments", { exact: true })
    .setInputFiles({
      name: "active.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg/>"),
    });
  await dialog
    .getByRole("button", { name: "Save record", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("SVG");
  expect((await stored(page)).documents.length).toBe(before.documents.length);
});

test("connected tree supports ancestor exploration, collapse, zoom, keyboard pan and profiles", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Family Tree");
  await page
    .getByRole("button", { name: "Explore connected tree", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Focus person", exact: true })
    .selectOption("noah");
  await page
    .getByRole("combobox", { name: "Explore", exact: true })
    .selectOption("ancestors");
  const canvas = page.getByRole("group", { name: "Interactive family tree" });
  await expect(
    canvas.getByRole("button", { name: "Open Yosef Kaminski", exact: true }),
  ).toBeVisible();
  await canvas
    .getByRole("button", { name: "Collapse Noah Kaminski", exact: true })
    .click();
  await expect(
    canvas.getByRole("button", { name: "Open Yosef Kaminski", exact: true }),
  ).toHaveCount(0);
  await canvas
    .getByRole("button", { name: "Expand Noah Kaminski", exact: true })
    .click();
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await canvas.focus();
  await page.keyboard.press("ArrowRight");
  await expect(canvas.locator(":scope > g")).toHaveAttribute(
    "transform",
    /translate\(-10,30\) scale\(0.8\)/,
  );
  await canvas
    .getByRole("button", { name: "Open Noah Kaminski", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Noah Kaminski");
});

test("journey advances through recorded stops and relationship finder shows a linked path", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Follow a Journey");
  await expect(page.getByText("Stop 1 of", { exact: false })).toBeVisible();
  const map = page.locator(".journey-map svg");
  const before = await map.getAttribute("aria-label");
  await page.getByRole("button", { name: "Next stop", exact: true }).click();
  await expect(map).not.toHaveAttribute("aria-label", before);
  await expect(page.getByText("Stop 2 of", { exact: false })).toBeVisible();
  await nav(page, "Relationship Finder");
  await page
    .getByRole("combobox", { name: "From person", exact: true })
    .selectOption("noah");
  await page
    .getByRole("combobox", { name: "To person", exact: true })
    .selectOption("yosef");
  await expect(
    page.getByRole("heading", { name: "great-great-grandfather", exact: true }),
  ).toContainText("great-great-grandfather");
  await expect(page.locator(".relationship-path")).toContainText(
    "Yosef Kaminski",
  );
});

test("evidence conflict detection, source citations and research notes survive reload", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Research & Evidence");
  await page.getByLabel("Claimed value", { exact: true }).fill("1888");
  await page
    .getByRole("combobox", { name: "Source document", exact: true })
    .selectOption("d1");
  await page
    .getByLabel("Page / record locator", { exact: true })
    .fill("Page 12");
  await page
    .getByLabel("Quoted evidence", { exact: true })
    .fill("Birth registered");
  await page
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await page.getByLabel("Claimed value", { exact: true }).fill("1889");
  await page
    .getByRole("button", { name: "Save evidence", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Conflicting evidence", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("New research question", { exact: true })
    .fill("Find the original register");
  await page.getByRole("button", { name: "Add question", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Question status", exact: true })
    .selectOption("in-progress");
  await page
    .getByRole("textbox", { name: "Question notes", exact: true })
    .fill("Archive contacted");
  await page.getByLabel("New research question", { exact: true }).focus();
  await expect
    .poll(async () => (await stored(page)).researchTasks[0]?.notes)
    .toBe("Archive contacted");
  await page.reload();
  await nav(page, "Research & Evidence");
  await expect(
    page.getByText("1888 versus 1889", { exact: false }),
  ).toBeVisible();
  expect((await stored(page)).people[0].birth).toBe(1896);
  await expect(
    page.getByRole("textbox", { name: "Question notes", exact: true }),
  ).toHaveValue("Archive contacted");
});

test("credited memories, replies and portable invitations/contributions are reviewed and deduplicated", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await nav(page, "Family Memories");
  await page.getByLabel("Contributor name", { exact: true }).fill("Alex");
  await page
    .getByLabel("Your memory", { exact: true })
    .fill("Grandpa loved this place.");
  await page
    .getByRole("button", { name: "Save contribution", exact: true })
    .click();
  await page.getByRole("button", { name: "Reply", exact: true }).click();
  await page
    .getByLabel("Your memory", { exact: true })
    .fill("Adding a detail.");
  await page
    .getByRole("button", { name: "Save contribution", exact: true })
    .click();
  await expect(page.getByText("Reply to Alex", { exact: true })).toBeVisible();
  const inviteDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Create invitation file", exact: true })
    .click();
  const invitationPath = await (await inviteDownload).path();
  const context = await browser.newContext();
  const relative = await context.newPage();
  await relative.goto("/");
  await nav(relative, "Family Memories");
  await relative
    .getByLabel("Open invitation / contribution", { exact: true })
    .setInputFiles(invitationPath);
  await relative
    .getByLabel("Contributor name", { exact: true })
    .fill("Aunt Lee");
  await relative
    .getByLabel("Your memory", { exact: true })
    .fill("My recollection from abroad.");
  const replyDownload = relative.waitForEvent("download");
  await relative
    .getByRole("button", {
      name: "Export contribution for sender",
      exact: true,
    })
    .click();
  const replyPath = await (await replyDownload).path();
  await page
    .getByLabel("Open invitation / contribution", { exact: true })
    .setInputFiles(replyPath);
  await expect(page.getByRole("dialog")).toContainText("Aunt Lee");
  expect((await stored(page)).memories).toHaveLength(2);
  await page
    .getByRole("button", { name: "Import new contributions", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("My recollection from abroad.", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Open invitation / contribution", { exact: true })
    .setInputFiles(replyPath);
  await page
    .getByRole("button", { name: "Import new contributions", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await stored(page)).memories).toHaveLength(3);
  await context.close();
});

test("malformed contribution preview is rejected without a render crash or mutation", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await nav(page, "Family Memories");
  await page
    .getByLabel("Open invitation / contribution", { exact: true })
    .setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "family-atlas-contributions",
          version: 1,
          subject: { kind: "people", id: "yosef", title: "Yosef" },
          memories: [null],
        }),
      ),
    });
  await expect(page.getByRole("alert")).toContainText(
    "Invalid contribution entry",
  );
  expect((await stored(page)).memories).toEqual([]);
  expect(errors).toEqual([]);
});

test("interviews save written testimony, retain edits, and export transcripts", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Oral History");
  await page
    .getByLabel("Interview title", { exact: true })
    .fill("Childhood memories");
  await page
    .getByRole("textbox", { name: "Transcript", exact: true })
    .fill("We lived near the river.");
  await page
    .getByRole("button", { name: "Save interview", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Childhood memories", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Edit transcript", exact: true })
    .fill("We lived near the river in 1940.");
  await page.getByLabel("Interview title", { exact: true }).focus();
  await expect
    .poll(async () => (await stored(page)).interviews[0]?.transcript)
    .toContain("1940");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export transcript", exact: true })
    .click();
  const d = await downloadPromise;
  expect(
    JSON.parse(await fs.readFile(await d.path(), "utf8")).transcript,
  ).toContain("1940");
});

test("books retain edited drafts and include uploaded photographs in a self-contained download", async ({
  page,
}) => {
  await page.goto("/");
  await upload(page);
  await nav(page, "Stories & Books");
  await page
    .getByLabel("Book title", { exact: true })
    .fill("The Example Family");
  await page
    .getByRole("textbox", { name: "Editable narrative", exact: true })
    .fill("A verified account. <script>alert(1)</script>");
  await page
    .getByRole("button", { name: "Save book draft", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The Example Family", exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download illustrated book", exact: true })
    .click();
  const html = await fs.readFile(await (await downloadPromise).path(), "utf8");
  expect(html).toContain("data:image/png;base64,");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("Sources and evidence");
  await page.reload();
  await nav(page, "Stories & Books");
  await page.getByRole("button", { name: "Open draft", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Editable narrative", exact: true }),
  ).toHaveValue("A verified account. <script>alert(1)</script>");
});

test("anniversary reminders validate calendar dates and survive reload", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "On This Day");
  await page
    .getByLabel("Reminder title", { exact: true })
    .fill("Annual reunion");
  await page.getByLabel("Month", { exact: true }).fill("2");
  await page.getByLabel("Day", { exact: true }).fill("30");
  await page.getByRole("button", { name: "Add reminder", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Invalid reminder date");
  expect((await stored(page)).reminders).toHaveLength(0);
  await page.getByLabel("Day", { exact: true }).fill("28");
  await page.getByRole("button", { name: "Add reminder", exact: true }).click();
  await expect(
    page.getByText("2/28 · Annual reunion", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await nav(page, "On This Day");
  await expect(
    page.getByText("2/28 · Annual reunion", { exact: true }),
  ).toBeVisible();
});

test("GEDCOM preview and reviewed duplicate import preserve adoption, unknown dates and local edits", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Import & Merge");
  const initial = await stored(page);
  await page
    .getByLabel("Choose GEDCOM file", { exact: true })
    .setInputFiles("tests/fixtures/family.ged");
  await expect(
    page.getByRole("heading", { name: "GEDCOM preview", exact: true }),
  ).toBeVisible();
  expect((await stored(page)).people.length).toBe(initial.people.length);
  await page
    .getByRole("button", { name: "Confirm GEDCOM merge", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "GEDCOM preview", exact: true }),
  ).toHaveCount(0);
  let data = await stored(page);
  expect(data.people.length).toBe(initial.people.length + 4);
  const casey = data.people.find((p) => p.first === "Casey");
  expect(Object.values(casey.parentTypes)).toEqual(["adoptive", "adoptive"]);
  expect(data.people.find((p) => p.first === "Dana").birth).toBeNull();
  await page
    .getByLabel("Choose GEDCOM file", { exact: true })
    .setInputFiles("tests/fixtures/family.ged");
  for (const name of ["Ada", "Ben", "Casey", "Dana"])
    await page
      .getByRole("combobox", {
        name: `Match for ${name} ${name === "Dana" ? "Unknown" : "Example"}`,
        exact: true,
      })
      .selectOption(data.people.find((p) => p.first === name).id);
  await page
    .getByRole("button", { name: "Confirm GEDCOM merge", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "GEDCOM preview", exact: true }),
  ).toHaveCount(0);
  data = await stored(page);
  expect(data.people.length).toBe(initial.people.length + 4);
  await nav(page, "People");
  await expect(page.getByText("Dana Unknown", { exact: true })).toBeVisible();
});

test("every new workspace renders on a narrow screen without page overflow or runtime errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const name of [
    "Documents",
    "Follow a Journey",
    "Oral History",
    "Stories & Books",
    "Relationship Finder",
    "Research & Evidence",
    "Family Memories",
    "On This Day",
    "Import & Merge",
  ]) {
    await nav(page, name);
    await expect(page.locator(".feature-page h2")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      name,
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("microphone capture creates a playable local audio record", async ({
  playwright,
}) => {
  const browser = await playwright.chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
  });
  const context = await browser.newContext({ permissions: ["microphone"] });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:5173");
    await nav(page, "Oral History");
    await page
      .getByLabel("Interview title", { exact: true })
      .fill("Recorded oral history");
    await page
      .getByRole("button", { name: "Start recording", exact: true })
      .click();
    await expect(
      page.getByText("Recording microphone…", { exact: true }),
    ).toBeVisible();
    await page.waitForTimeout(1300);
    await page
      .getByRole("button", { name: "Stop recording", exact: true })
      .click();
    await expect(
      page.getByText("Recording ready:", { exact: false }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Save interview", exact: true })
      .click();
    const audio = page.locator(".evidence-card audio");
    await expect(audio).toBeVisible();
    await expect
      .poll(() => audio.evaluate((a) => a.readyState))
      .toBeGreaterThanOrEqual(1);
    expect(
      (await stored(page)).documents.find(
        (d) => d.title === "Recorded oral history",
      ).files[0].size,
    ).toBeGreaterThan(0);
  } finally {
    await context.close();
    await browser.close();
  }
});

test("print action opens a complete printable book and can produce a PDF", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Stories & Books");
  await page.evaluate(() => {
    const open = window.open.bind(window);
    window.open = (...args) => {
      const popup = open(...args);
      popup.print = () => {
        popup.document.body.dataset.printRequested = "yes";
      };
      return popup;
    };
  });
  const popupPromise = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Print / Save as PDF", exact: true })
    .click();
  const popup = await popupPromise;
  await expect(popup.locator("body")).toHaveAttribute(
    "data-print-requested",
    "yes",
  );
  await expect(
    popup.getByRole("heading", { name: "Sources and evidence", exact: true }),
  ).toBeVisible();
  const pdf = await popup.pdf();
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  await popup.close();
});
