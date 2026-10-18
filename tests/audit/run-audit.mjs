// Read-only product audit: all edits occur in isolated browser contexts.
// Run against npm run dev with: node tests/audit/run-audit.mjs
import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const baseURL = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
const out = path.resolve(process.env.AUDIT_OUTPUT || 'docs/audit/verification');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
const bootstrap = await browser.newPage();
await bootstrap.goto(baseURL);
const seed = await bootstrap.evaluate(async () => (await import('/src/data/seed.js')).makeSeed());
await bootstrap.close();
const results = [];
const copy = () => structuredClone(seed);
const empty = () => ({ people: [], locations: [], events: [], migrations: [], documents: [], branches: [] });
const nav = (p, name) => p.locator('nav button').filter({ hasText: new RegExp(`^${name}$`) }).click();
const tab = (p, name) => p.locator('.fa-content').getByRole('button', { name: new RegExp(`^${name}\\s*(\\(|$)`) }).first().click();
const manage = async (p, name = 'People') => { await nav(p, 'Manage Data'); await tab(p, name); };
const modal = p => p.locator('.fa-modal');
const label = (p, name) => modal(p).locator('.fa-field').filter({ has: p.locator('xpath=./div[1][starts-with(normalize-space(.), '+JSON.stringify(name)+')]') }).first();
const field = (p, name) => label(p, name).locator('input,textarea,select').first();
const row = (p, name) => p.locator('.fa-content .fa-card').filter({ hasText: name }).first();
const data = p => p.evaluate(() => JSON.parse(localStorage.getItem('familyAtlas.v2')));
const save = async p => { const button=modal(p).getByRole('button', { name: 'Save', exact: true }); await button.focus(); await p.keyboard.press('Enter'); await expect(modal(p)).toHaveCount(0); };
const add = async (p, kind) => p.getByRole('button', { name: `Add ${kind}`, exact: true }).click();
const edit = async (p, name) => row(p, name).getByRole('button', { name: 'Edit', exact: true }).click();
const multiselect = async (p, name, text) => {
 const box = label(p, name);
 await box.locator('button[aria-haspopup=listbox]').click();
 await box.getByPlaceholder('Search…').fill(text);
 await box.getByRole('option').filter({ hasText: text }).last().click();
 // Keep popup open and use keyboard Save to isolate the separately tested label/overlay bug.

};
const remove = async (p, name, confirm = true) => {
 await row(p, name).getByTitle('Delete', { exact: true }).click();
 await modal(p).getByRole('button', { name: confirm ? 'Delete' : 'Cancel', exact: true }).click();await expect(modal(p)).toHaveCount(0);
};
const upload = async (p, raw) => {
 await p.locator('input[type=file]').setInputFiles({ name: 'archive.json', mimeType: 'application/json', buffer: Buffer.from(typeof raw === 'string' ? raw : JSON.stringify(raw)) });
};
async function run(id, name, fn, options = {}) {
 if (process.env.AUDIT_FILTER && !process.env.AUDIT_FILTER.split(',').includes(id)) return;
 if (process.env.AUDIT_IDS && !process.env.AUDIT_IDS.split(',').includes(id)) return;
 const context = await browser.newContext({ viewport: options.viewport || { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
 const page = await context.newPage();
 const errors = [];
 page.on('pageerror', e => errors.push(e.message));
 page.setDefaultTimeout(4500);
 await context.route(/^https:\/\//, async route => {
  if (options.land && route.request().url().includes('land-110m.json')) {
   await route.fulfill({ contentType: 'application/json', body: await fs.readFile(process.env.AUDIT_LAND_PATH || '/tmp/atlas-audit-land.json') });
  } else await route.abort();
 });
 await context.addInitScript(({ initial, storageFailure }) => {
  if (initial !== null && !localStorage.getItem('familyAtlas.v2')) localStorage.setItem('familyAtlas.v2', JSON.stringify(initial));
  if (storageFailure) Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
 }, { initial: options.initial === undefined ? copy() : options.initial, storageFailure: options.storageFailure || false });
 let status = 'passed', detail = '';
 const started = Date.now();
 try { await page.goto(baseURL); await fn(page, errors); if (!options.allowErrors) assert.deepEqual(errors, [], 'Uncaught browser errors'); }
 catch (e) { status = 'failed'; detail = e.message; }
 const record = { id, name, status, durationMs: Date.now()-started, detail, pageErrors: errors };
 results.push(record);
 console.log(`${status.toUpperCase()} ${id}: ${name}${detail ? '\n  '+detail.split('\n')[0] : ''}`);
 await context.close();
 await fs.writeFile(path.join(out, 'results.json'), JSON.stringify({ commit: process.env.AUDIT_REVISION || `working tree based on ${execFileSync('git',['rev-parse','--short','HEAD'],{encoding:'utf8'}).trim()}`, environment: 'Linux Chromium; isolated local browser storage', results }, null, 2)+'\n');
}

// Normal navigation and historical views.
await run('N01','Overview statistics and all dashboard navigation cards', async p => {
 for (const name of ['Family Tree','Timeline','Map','Manage Data']) {
  await nav(p,'Overview');
  await p.locator('.fa-content').getByRole('button', { name: new RegExp(name) }).last().click();
  assert.notEqual(await p.locator('.fa-content h1').count(), 1);
 }
 await nav(p,'Overview');
 await p.getByRole('button',{name:'Open the migration map'}).click();
 await expect(p.getByRole('heading',{name:'Migration Map'})).toBeVisible();
});
await run('N02','All seven sidebar views and historical person states', async p => {
 for (const [name, heading] of [['Overview','one story.'],['Family Tree','Family Tree'],['Timeline','Timeline'],['Map','Migration Map'],['People','People'],['Documents','Documents & Media'],['Manage Data','Manage Family Data']]) {
  await nav(p,name); await expect(p.locator('h1,h2').filter({hasText:heading})).toBeVisible();
 }
 await nav(p,'People');
 await p.locator('input[type=range]').fill('1896');
 await expect(p.getByRole('button').filter({hasText:'Yosef Kaminski'}).first()).toContainText('Living');
 await expect(p.getByRole('button').filter({hasText:'Noah Kaminski'}).first()).toContainText('Not yet born');
 await p.locator('input[type=range]').fill('2026');
 await expect(p.getByRole('button').filter({hasText:'Yosef Kaminski'}).first()).toContainText('Deceased');
});
await run('N03','Global search, mouse selection, profile relatives and dismiss', async p => {
 await p.getByPlaceholder('Search the family…').fill('yOsEf');
 await p.locator('header').getByRole('option').filter({hasText:'Yosef Kaminski'}).click();
 await expect(p.locator('aside')).toContainText('Yosef Kaminski');
 await p.locator('aside').getByRole('button',{name:'Rivka Kaminski'}).click();
 await expect(p.locator('aside')).toContainText('Rivka Kaminski');
 await p.locator('.fa-backdrop').click({position:{x:2,y:2}});
 await expect(p.locator('aside')).toHaveCount(0);
});
await run('N04','Branch filter toggles, People filtering and tree dimming', async p => {
 await nav(p,'People'); await p.locator('header').getByRole('button',{name:'Roth',exact:true}).click();
 assert.equal(await p.locator('.fa-content button.fa-card').count(),3);
 await p.locator('header').getByRole('button',{name:'Kaminski',exact:true}).click();
 assert.equal(await p.locator('.fa-content button.fa-card').count(),13);
 await p.locator('header').getByRole('button',{name:'All branches',exact:true}).click();
 await nav(p,'Family Tree'); await p.locator('header').getByRole('button',{name:'Roth',exact:true}).click();
 assert.equal(await p.locator('button.fa-card[style*="opacity: 0.32"]').count(),10);
});
await run('N05','All timeline type filters, historical context and empty matches', async p => {
 await nav(p,'Timeline');
 for (const [type,name] of [['birth','Birth'],['death','Death'],['marriage','Marriage'],['migration','Migration'],['military','Military'],['education','Education'],['career','Career'],['residence','Residence'],['milestone','Milestone'],['document','Document'],['historical','Historical']]) {
  await p.locator('.fa-content').getByRole('button',{name,exact:true}).click();
  assert.equal(await p.locator('.fa-content .fa-card').count(),seed.events.filter(e=>e.type===type).length);
 }
 await p.locator('.fa-content').getByRole('button',{name:'All events',exact:true}).click();
 assert.equal(await p.locator('.fa-content .fa-card').count(),seed.events.length);
});
await run('N06','Playback starts, pauses, reaches final year and stops', async p => {
 await nav(p,'People'); const range=p.locator('input[type=range]');
 await range.fill('2024'); await p.locator('.fa-slider button').click();
 await expect(range).toHaveValue('2026');
 await expect(p.locator('.fa-slider button svg')).toHaveClass(/lucide-play/);
 await range.fill('1900'); await p.locator('.fa-slider button').click();
 await expect.poll(async()=>Number(await range.inputValue())).toBeGreaterThan(1900);
 await p.locator('.fa-slider button').click(); const value=await range.inputValue();
 await p.waitForTimeout(250); assert.equal(await range.inputValue(),value);
});
await run('N07','Map fallback, historical pins, route highlights and person buttons', async p => {
 await nav(p,'Map'); await p.locator('input[type=range]').fill('1896');
 assert.equal(await p.locator('.fa-content svg[viewBox="0 0 1000 560"] circle').count(),2);
 assert.equal(await p.locator('.fa-content svg[viewBox="0 0 1000 560"] path[fill=none]').count(),0);
 await p.locator('input[type=range]').fill('1950');
 await p.locator('.fa-content').getByRole('button',{name:'Yosef K.',exact:true}).click();
 await p.locator('.fa-backdrop').click({position:{x:2,y:2}});
 assert.ok(await p.locator('path.fa-flow').count()>0);
 await p.locator('header').getByRole('button',{name:'Roth',exact:true}).click();
 assert.ok(await p.locator('.fa-content svg text').count()>0);
});
await run('N08','Accurate world map and inverse-coordinate location picker', async p => {
 await nav(p,'Map');
 await expect.poll(async()=>(await p.locator('.fa-content svg[viewBox="0 0 1000 560"] > path').first().getAttribute('d'))?.length || 0).toBeGreaterThan(10000);
 await manage(p,'Locations'); await add(p,'location');
 await field(p,'Location name').fill('Picker Town');
 await modal(p).locator('svg[viewBox="0 0 1000 560"]').click({position:{x:240,y:140}});
 assert.notEqual(await field(p,'Latitude (optional)').inputValue(),'');
 assert.notEqual(await field(p,'Longitude (optional)').inputValue(),'');
 await save(p); assert.ok((await data(p)).locations.find(l=>l.name==='Picker Town').lat!==null);
},{land:true});
await run('N09','Profile map/focus/edit actions and focused timeline clear', async p => {
 await nav(p,'People'); await p.getByText('Yosef Kaminski',{exact:true}).click();
 await p.getByRole('button',{name:'View on map',exact:true}).click();
 await expect(p.getByRole('heading',{name:'Migration Map'})).toBeAttached();
 await p.getByRole('button',{name:'Focus timeline',exact:true}).click();
 await p.locator('.fa-backdrop').click({position:{x:2,y:2}});
 await expect(p.getByText('Focused on Yosef Kaminski')).toBeVisible();
 assert.equal(await p.locator('.fa-content .fa-card').count(),seed.events.filter(e=>e.people.includes('yosef')).length);
 await p.getByText('Focused on Yosef Kaminski').locator('..').locator('button').click();
 assert.equal(await p.locator('.fa-content .fa-card').count(),seed.events.length);
 await p.locator('.fa-content').getByRole('button',{name:'Yosef Kaminski',exact:true}).first().click();
 await p.getByRole('button',{name:'Edit this person'}).click();
 await field(p,'Biography').fill('Audit biography'); await save(p);
 assert.equal((await data(p)).people.find(x=>x.id==='yosef').bio,'Audit biography');
});
await run('N10','Documents sorted by year and linked people open profiles',async p=>{
 await nav(p,'Documents'); assert.equal(await p.locator('.fa-content .fa-card').count(),8);
 await p.locator('.fa-content .fa-card').first().getByRole('button').first().click();
 await expect(p.locator('aside')).toBeVisible();
});

// Entity CRUD, validation, controls, and search. Every entity gets a full lifecycle.
const entityCases = [
 ['People','person','people','Audit Person',{'First name':'Audit','Last name':'Person','Birth year':'1980','Biography':'Biography text','Avatar / photo placeholder':'https://example.com/avatar.jpg'},'First name'],
 ['Locations','location','locations','Audit Place',{'Location name':'Audit Place','Country / region':'Test region','Latitude (optional)':'12.5','Longitude (optional)':'30.5','Description':'Place notes'},'Location name'],
 ['Events','event','events','Audit Event',{'Event title':'Audit Event','Year':'2000','Description':'Event notes'},'Event title'],
 ['Migrations','migration','migrations','Minsk → Warsaw',{'Start year':'2000','End year (optional)':'2001','Description':'Migration notes'},'Start year'],
 ['Documents','document','documents','Audit Document',{'Title':'Audit Document','Year':'2000','Description':'Document notes'},'Title'],
 ['Branches','branch','branches','Audit Branch',{'Branch name':'Audit Branch'},'Branch name'],
];
for (const [i,[tabName,kind,key,title,values,required]] of entityCases.entries()) {
 await run(`C0${i+1}`,`${tabName}: required validation, create, reload, edit, search, delete cancel/confirm`, async p=>{
  await manage(p,tabName); const initial=(await data(p))[key].length;
  await add(p,kind); await modal(p).getByRole('button',{name:'Save',exact:true}).click();
  await expect(modal(p)).toBeVisible();
  for(const [name,value] of Object.entries(values)) await field(p,name).fill(value);
  if(kind==='person') { await field(p,'Gender (optional)').selectOption('x'); await field(p,'Birthplace').selectOption('sf'); }
  if(kind==='location') await modal(p).locator('svg[viewBox="0 0 1000 560"]').click({position:{x:200,y:120}});
  if(kind==='migration') await field(p,'Person').selectOption('hannah');
  if(kind==='event') { await field(p,'Type').selectOption('education'); await modal(p).getByText('Show as background historical context',{exact:true}).click(); }
  if(kind==='branch') await label(p,'Color').locator('button').nth(2).click();
  await save(p); assert.equal((await data(p))[key].length,initial+1);
  const added=(await data(p))[key].at(-1);
  await p.reload(); await manage(p,tabName);
  await p.getByPlaceholder(`Search ${key}…`).fill(kind==='migration'?'Minsk':title);
  await p.locator('.fa-content .fa-card').filter({hasText:title}).last().getByRole('button',{name:'Edit',exact:true}).click();
  const changeField=kind==='migration'?'Description':Object.keys(values)[0];
  const change=kind==='person'?'Audited':kind==='migration'?'Edited migration':title+' edited';
  await field(p,changeField).fill(change); await save(p);
  const updated=(await data(p))[key].find(x=>x.id===added.id);assert.ok(updated);const property=kind==='person'?'first':kind==='migration'?'description':kind==='location'||kind==='branch'?'name':'title';assert.equal(updated[property],change);
  await p.getByPlaceholder(`Search ${key}…`).fill('');
  const name=kind==='person'?'Audited Person':kind==='migration'?title:change;
  // Migration fixtures have duplicate routes; use the last matching row (the new record).
  const target=p.locator('.fa-content .fa-card').filter({hasText:name}).last();
  await target.getByTitle('Delete',{exact:true}).click(); await modal(p).getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal((await data(p))[key].length,initial+1);
  await target.getByTitle('Delete',{exact:true}).click();
  await modal(p).getByRole('button',{name:kind==='branch'?'Delete branch':'Delete',exact:true}).click();
  await expect(modal(p)).toHaveCount(0);
  assert.equal((await data(p))[key].length,initial);
  await p.getByPlaceholder(`Search ${key}…`).fill('impossible-match-abc');
  await expect(p.getByText(new RegExp(`No ${key} match`))).toBeVisible();
 });
}
await run('C07','Person death-before-birth validation',async p=>{
 await manage(p); await add(p,'person'); await field(p,'First name').fill('A');await field(p,'Last name').fill('B');
 await field(p,'Birth year').fill('2000');await field(p,'Death year').fill('1900');
 await modal(p).getByRole('button',{name:'Save',exact:true}).click();
 await expect(p.getByText('Death precedes birth')).toBeVisible();
});
await run('C08','Residence rows: add, change location/year, remove and save',async p=>{
 await manage(p); await edit(p,'Yosef Kaminski');
 const before=(await data(p)).people[0].residences.length;
 await p.getByRole('button',{name:'Add residence',exact:true}).click();
 const residence=label(p,'Residences');
 await residence.locator('select').last().selectOption('sf');await residence.locator('input').last().fill('1960');
 await residence.locator('button').filter({hasNotText:'Add residence'}).last().click();
 await save(p);assert.equal((await data(p)).people[0].residences.length,before);
 assert.deepEqual((await data(p)).people[0].branches,['kaminski']);
});
await run('C09','All event/document type choices persist and render',async p=>{
 await manage(p,'Events');
 for(const type of ['birth','death','marriage','migration','military','education','career','residence','milestone','document','historical']) {
  await edit(p,'Yosef Kaminski born');await field(p,'Type').selectOption(type);await save(p);
  assert.equal((await data(p)).events.find(e=>e.id==='e1').type,type);
 }
 await tab(p,'Documents');
 for(const type of ['certificate','record','passport','clipping','photo','letter','audio','video']) {
  await edit(p,'Marriage certificate');await field(p,'Type').selectOption(type);await save(p);
  assert.equal((await data(p)).documents.find(d=>d.id==='d1').type,type);
 }
});
await run('C10','Branch-wide migration and required-empty selectors',async p=>{
 await manage(p,'Migrations');await add(p,'migration');
 await field(p,'Applies to').selectOption('branch');await field(p,'Branch').selectOption('roth');
 await field(p,'From').selectOption('la');await field(p,'To').selectOption('sf');await field(p,'Start year').fill('2000');
 await save(p);const mg=(await data(p)).migrations.at(-1);assert.equal(mg.mode,'branch');assert.equal(mg.branch,'roth');
});
await run('C11','Modal cancel, close icon, and backdrop discard drafts',async p=>{
 await manage(p);
 for(const mode of ['Cancel','icon','backdrop']){
  await add(p,'person');await field(p,'First name').fill('Discarded');
  if(mode==='Cancel')await modal(p).getByRole('button',{name:'Cancel',exact:true}).click();
  else if(mode==='icon')await modal(p).locator('button').first().click();
  else await p.locator('.fa-modal-wrap').click({position:{x:2,y:2}});
  assert.equal((await data(p)).people.length,13);
 }
});

await run('C12','Empty multiselect search/no-match, select and keyboard-remove chip',async p=>{
 await manage(p);await add(p,'person');await field(p,'First name').fill('Multi');await field(p,'Last name').fill('Select');await field(p,'Birth year').fill('2000');
 const box=label(p,'Spouses');await box.locator('button[aria-haspopup=listbox]').click();await box.getByPlaceholder('Search…').fill('zzzz-no-match');await expect(box.getByText('No matches.',{exact:true})).toBeVisible();
 await box.getByPlaceholder('Search…').fill('Miriam');await box.getByRole('option').filter({hasText:'Miriam Roth'}).click();
 const chip=box.locator('span').filter({hasText:'Miriam Roth'}).filter({has:p.locator('button')}).first().getByRole('button');await chip.focus();await p.keyboard.press('Enter');await save(p);assert.deepEqual((await data(p)).people.at(-1).spouses,[]);
});

// Relationships and cleanup.
await run('R01','Dedicated parent, child and spouse add/remove updates both people',async p=>{
 await manage(p,'Relationships');
 for(const kind of ['parent','child','spouse']) {
  const aId=kind==='child'?'sam':'hannah',bId=kind==='parent'?'sam':kind==='child'?'hannah':'miriam';
  const bName=kind==='parent'?'Sam Kaminski':kind==='child'?'Hannah Kaminski':'Miriam Roth';
  const selects=p.locator('.fa-content select');await selects.nth(0).selectOption(aId);await selects.nth(1).selectOption(kind);await selects.nth(2).selectOption(bId);
  await p.getByRole('button',{name:'Add connection',exact:true}).click();
  const ak=kind==='parent'?'children':kind==='child'?'parents':'spouses',bk=kind==='parent'?'parents':kind==='child'?'children':'spouses';
  await expect.poll(async()=>(await data(p)).people.find(x=>x.id===aId)[ak].includes(bId)).toBe(true);
  assert.ok((await data(p)).people.find(x=>x.id===bId)[bk].includes(aId));
  await p.locator('.fa-rel-grid > div').first().locator('span').filter({hasText:bName}).filter({has:p.getByTitle('Remove',{exact:true})}).last().getByTitle('Remove',{exact:true}).click();
  await expect.poll(async()=>(await data(p)).people.find(x=>x.id===aId)[ak].includes(bId)).toBe(false);
  assert.ok(!(await data(p)).people.find(x=>x.id===bId)[bk].includes(aId));
 }
});
await run('R02','Deleting people removes relationships, document/event links and personal routes',async p=>{
 await manage(p);await remove(p,'Yosef Kaminski');const d=await data(p);
 assert.ok(!d.people.some(x=>x.id==='yosef'));
 assert.ok(d.people.every(x=>!JSON.stringify([x.parents,x.children,x.spouses]).includes('yosef')));
 assert.ok(d.events.every(x=>!x.people.includes('yosef')));assert.ok(d.documents.every(x=>!x.people.includes('yosef')));
 assert.ok(d.migrations.every(x=>x.personId!=='yosef'));
});
await run('R03','Deleting events and documents cleans reciprocal links',async p=>{
 await manage(p,'Events');await remove(p,'Yosef & Rivka marry');assert.ok((await data(p)).documents.every(x=>!x.events.includes('e3')));
 await tab(p,'Documents');await remove(p,'Ship manifest');assert.ok((await data(p)).events.every(x=>!x.docs.includes('d2')));
});
for(const mode of ['remove','move']) await run(`R0${mode==='remove'?4:5}`,`Delete populated branch: ${mode} members, preserve people and routes`,async p=>{
 await manage(p,'Branches');await row(p,'Kaminski').getByTitle('Delete',{exact:true}).click();
 if(mode==='move') await modal(p).getByRole('button',{name:/Move them to another branch/}).click();
 await modal(p).getByRole('button',{name:'Delete branch',exact:true}).click();await expect(modal(p)).toHaveCount(0);const d=await data(p);
 assert.equal(d.people.length,13);assert.ok(d.people.every(x=>!x.branches.includes('kaminski')));
 if(mode==='move')assert.ok(d.people.every(x=>x.branches.includes('roth')));
 assert.ok(d.migrations.every(x=>x.branch!=='kaminski'));
});

// Imports, resets, persistence, empty archive.
await run('D01','JSON export/import round-trip retains all collections',async p=>{
 await manage(p);const before=await data(p);const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'Export JSON'}).click();
 const download=await downloadPromise;assert.equal(download.suggestedFilename(),'family-atlas-data.json');
 const exported=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.deepEqual(exported,before);
 exported.people[0].bio='Round trip';await upload(p,exported);await modal(p).getByRole('button',{name:'Replace archive',exact:true}).click();await expect.poll(async()=>(await data(p)).people[0].bio).toBe('Round trip');
});
await run('D02','Invalid JSON rejected without replacing archive',async p=>{
 await manage(p);const before=await data(p);await upload(p,'{ bad json');await expect(p.getByRole('alert').filter({hasText:'Could not read'})).toBeVisible();assert.deepEqual(await data(p),before);
});
await run('D03','Reset cancellation preserves data; confirmation restores sample',async p=>{
 await manage(p);await remove(p,'Yosef Kaminski');
 await p.getByRole('button',{name:'Reset to sample'}).click();await modal(p).getByRole('button',{name:'Cancel',exact:true}).click();assert.equal((await data(p)).people.length,12);
 await p.getByRole('button',{name:'Reset to sample'}).click();await modal(p).getByRole('button',{name:'Reset everything',exact:true}).click();await expect(modal(p)).toHaveCount(0);assert.equal((await data(p)).people.length,13);
});
await run('D04','Empty archive: all screens, management tabs, and first-person setup',async p=>{
 await expect(p.getByText('Your archive is empty')).toBeVisible();await p.getByRole('button',{name:'Open Manage Data',exact:true}).click();
 for(const name of ['People','Locations','Events','Documents','Migrations','Branches','Relationships'])await tab(p,name);
 for(const [name,text] of [['Family Tree','No people yet'],['People','No people yet'],['Timeline','No events match'],['Map','No locations yet'],['Documents','No documents yet']]) {
  await nav(p,name);await expect(p.getByText(text,{exact:true})).toBeVisible();
 }
 await manage(p);await add(p,'person');await field(p,'First name').fill('First');await field(p,'Last name').fill('Person');await field(p,'Birth year').fill('1980');await save(p);assert.equal((await data(p)).people.length,1);
},{initial:empty()});
await run('D05','HTML-like user text is displayed as text, not executed',async p=>{
 await manage(p,'Branches');await add(p,'branch');await field(p,'Branch name').fill('<img src=x onerror="window.auditXss=true">');await save(p);
 assert.equal(await p.evaluate(()=>window.auditXss),undefined);assert.equal(await p.locator('.fa-content img').count(),0);
});

// Desired-behavior assertions: failures below are candidate defects to investigate.
await run('B01','Person form relationship changes must update the other person',async p=>{
 await manage(p);await edit(p,'Hannah Kaminski');await multiselect(p,'Spouses','Miriam Roth');await save(p);
 const d=await data(p);assert.ok(d.people.find(x=>x.id==='hannah').spouses.includes('miriam'),'Setup: spouse selection was not saved');assert.ok(d.people.find(x=>x.id==='miriam').spouses.includes('hannah'),'Miriam has no reciprocal spouse link');
});
await run('B02','Adding a residence must keep the migration route collection synchronized',async p=>{
 await manage(p);await edit(p,'Hannah Kaminski');await p.getByRole('button',{name:'Add residence'}).click();
 const box=label(p,'Residences');await box.locator('select').last().selectOption('sf');await box.locator('input').last().fill('2000');await save(p);
 assert.ok((await data(p)).migrations.some(x=>x.personId==='hannah'&&x.to==='sf'),'New residence has no migration route');
});
await run('B03','Event document selector must update the document event links',async p=>{
 await manage(p,'Events');await edit(p,'Yosef Kaminski born');await multiselect(p,'Related documents','Letter from Minsk');await save(p);
 assert.ok((await data(p)).events.find(x=>x.id==='e1').docs.includes('d8'),'Setup: document selection was not saved');assert.ok((await data(p)).documents.find(x=>x.id==='d8').events.includes('e1'),'Document does not reference newly linked event');
});
await run('B04','Document event selector must update event document links',async p=>{
 await manage(p,'Documents');await edit(p,'Letter from Minsk');await multiselect(p,'Linked events','Yosef Kaminski born');await save(p);
 assert.ok((await data(p)).documents.find(x=>x.id==='d8').events.includes('e1'),'Setup: event selection was not saved');assert.ok((await data(p)).events.find(x=>x.id==='e1').docs.includes('d8'),'Event does not reference newly linked document');
});
await run('B05','Deleting a location must clean event location references',async p=>{
 await manage(p,'Locations');await remove(p,'Minsk');assert.ok((await data(p)).events.every(x=>x.at!=='minsk'),'Events retain deleted location IDs');
});
await run('B06','Reject ancestor cycles',async p=>{
 await manage(p,'Relationships');const selects=p.locator('.fa-content select');await selects.nth(0).selectOption('noah');await selects.nth(1).selectOption('parent');await selects.nth(2).selectOption('yosef');await p.getByRole('button',{name:'Add connection',exact:true}).click();
 await expect(p.getByRole('alert')).toContainText(/parent|cycle/);
 assert.ok(!(await data(p)).people.find(x=>x.id==='yosef').parents.includes('noah'),'Noah became the parent of his ancestor Yosef');
});
await run('B07','Changing relationship person must clear the target and reject self-links',async p=>{
 await manage(p,'Relationships');const selects=p.locator('.fa-content select');await selects.nth(2).selectOption('rivka');await selects.nth(0).selectOption('rivka');
 await expect(p.getByRole('button',{name:'Add connection',exact:true})).toBeDisabled();
 const d=await data(p);assert.ok(!d.people.find(x=>x.id==='rivka').parents.includes('rivka'),'Rivka became her own parent');
});
await run('B08','Adding siblings without parents must not silently do nothing',async p=>{
 await manage(p,'Relationships');const selects=p.locator('.fa-content select');await selects.nth(0).selectOption('yosef');await selects.nth(1).selectOption('sibling');await selects.nth(2).selectOption('rivka');
 await p.getByRole('button',{name:'Add connection',exact:true}).click();
 await expect.poll(async()=>(await data(p)).people.find(x=>x.id==='yosef').siblings?.includes('rivka')).toBe(true);
});
await run('B09','Reject latitude and longitude outside geographic bounds',async p=>{
 await manage(p,'Locations');await add(p,'location');await field(p,'Location name').fill('Invalid coordinates');await field(p,'Latitude (optional)').fill('999');await field(p,'Longitude (optional)').fill('999');
 await modal(p).getByRole('button',{name:'Save',exact:true}).click();assert.equal(await modal(p).count(),1,'Invalid coordinates saved');
});
await run('B10','Reject a migration ending before it starts or going to its origin',async p=>{
 await manage(p,'Migrations');await add(p,'migration');await field(p,'To').selectOption('minsk');await field(p,'Start year').fill('2000');await field(p,'End year (optional)').fill('1900');
 await modal(p).getByRole('button',{name:'Save',exact:true}).click();assert.equal(await modal(p).count(),1,'Impossible route and reversed dates saved');
});
await run('B11','Reject fractional years',async p=>{
 await manage(p,'Events');await add(p,'event');await field(p,'Event title').fill('Fractional year');await field(p,'Year').fill('2000.5');
 await modal(p).getByRole('button',{name:'Save',exact:true}).click();assert.equal(await modal(p).count(),1,'Fractional year saved');
});
await run('B12','Residence year must not precede birth',async p=>{
 await manage(p);await edit(p,'Noah Kaminski');await p.getByRole('button',{name:'Add residence'}).click();const box=label(p,'Residences');await box.locator('select').last().selectOption('minsk');await box.locator('input').last().fill('1896');
 await modal(p).getByRole('button',{name:'Save',exact:true}).click();assert.equal(await modal(p).count(),1,'Residence 120 years before birth saved');
});
await run('B13','A person outside fixed year bounds must be explorable in time',async p=>{
 await manage(p);await add(p,'person');await field(p,'First name').fill('Old');await field(p,'Last name').fill('Ancestor');await field(p,'Birth year').fill('1750');await save(p);await nav(p,'People');
 assert.ok(Number(await p.locator('input[type=range]').getAttribute('min'))<=1750,'Slider remains fixed to 1896');
});
await run('B14','Structurally invalid JSON must be rejected without changing the archive',async p=>{
 await manage(p);const before=await data(p);await upload(p,{hello:'not an archive'});await p.waitForTimeout(100);assert.deepEqual(await data(p),before,'Unrelated JSON replaced the archive');
});
await run('B15','Malformed person records must not crash the application',async(p,errors)=>{
 await manage(p);await upload(p,{...copy(),people:[{...copy().people[0],residences:[null]}]});await nav(p,'Overview');await p.waitForTimeout(150);assert.deepEqual(errors,[],'Malformed import caused browser error');await expect(p.locator('#fa-root')).toBeVisible();
},{allowErrors:true});
await run('B16','Valid import replacing existing data must require confirmation',async p=>{
 await manage(p);const before=await data(p);await upload(p,empty());await p.waitForTimeout(100);assert.deepEqual(await data(p),before,'Archive immediately overwritten without confirmation');
});
await run('B17','Storage failures must produce a visible persistence warning',async p=>{
 await manage(p,'Branches');await add(p,'branch');await field(p,'Branch name').fill('Cannot persist');await save(p);
 assert.match(await p.locator('#fa-root').innerText(),/could not save|storage full|failed to save|not saved/i,'No warning despite failed storage writes');
},{storageFailure:true});
await run('B18','Two tabs must synchronize rather than overwrite each other',async p=>{
 const second=await p.context().newPage();await second.goto(baseURL);await manage(p,'Branches');await add(p,'branch');await field(p,'Branch name').fill('First tab branch');await save(p);
 await manage(second,'Branches');await add(second,'branch');await field(second,'Branch name').fill('Second tab branch');await save(second);assert.ok((await data(second)).branches.some(b=>b.name==='First tab branch'),'Second tab overwrote the first tab change');assert.match(await second.locator('.fa-content').innerText(),/First tab branch/,'Second tab remains stale');
});
await run('B19','Deleting the selected branch must reset its global filter',async p=>{
 await p.locator('header').getByRole('button',{name:'Kaminski',exact:true}).click();await manage(p,'Branches');await row(p,'Kaminski').getByTitle('Delete',{exact:true}).click();await modal(p).getByRole('button',{name:'Move them to another branch'}).click();await modal(p).getByRole('button',{name:'Delete branch',exact:true}).click();await nav(p,'People');assert.equal(await p.locator('button.fa-card').count(),13,'Removed filter hides all remaining people');
});
await run('B20','People with unknown residences must not inflate place totals',async p=>{
 await nav(p,'People');assert.match(await p.locator('.fa-slider').innerText(),/0 places/,'Unknown location counted as a place');
},{initial:{...empty(),people:[{...copy().people[0],branches:[],parents:[],children:[],spouses:[],born:'',residences:[]}]}});
await run('B21','Keyboard activation of global search results must open profile',async p=>{
 await p.getByPlaceholder('Search the family…').fill('Yosef');const result=p.locator('header [role=option]').filter({hasText:'Yosef Kaminski'});await result.focus();await p.keyboard.press('Enter');assert.equal(await p.locator('aside').count(),1,'Enter does not activate search result');
});
await run('B22','Modal Escape closes and modal has accessible dialog semantics',async p=>{
 await manage(p);await add(p,'person');assert.equal(await p.getByRole('dialog').count(),1,'No dialog role');await p.keyboard.press('Escape');assert.equal(await modal(p).count(),0,'Escape does not close modal');
});
await run('B23','Tab focus stays inside open modal',async p=>{
 await manage(p);await add(p,'person');await modal(p).locator('button').first().focus();await p.keyboard.press('Shift+Tab');
 assert.ok(await p.evaluate(()=>!!document.activeElement.closest('.fa-modal')),'Focus escaped behind modal');
});
await run('B24','Interactive controls must have accessible names',async p=>{
 await nav(p,'People');const unnamed=await p.locator('button,input').evaluateAll(els=>els.filter(e=>!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.getAttribute('title')&&!e.textContent.trim()&&!e.labels?.length).map(e=>e.outerHTML.slice(0,160)));
 assert.deepEqual(unnamed,[],'Unnamed controls');
});
await run('B25','Empty multiselect can be reached and opened with the keyboard',async p=>{
 await manage(p);await add(p,'person');const box=label(p,'Parents');assert.ok(await box.locator('[tabindex],input,[role=combobox],button').count()>0,'Empty multiselect has no focusable control');
});
for(const width of [390,768]) await run(`B26-${width}`,`Responsive ${width}px: all sidebar destinations remain named and layout fits`,async p=>{
 const unnamed=await p.locator('nav button').evaluateAll(buttons=>buttons.filter(b=>!b.getAttribute('aria-label')&&getComputedStyle(b.querySelector('.fa-label')).display==='none').length);
 assert.equal(unnamed,0,'Icon-only navigation has no accessible names');
 const overflow=await p.locator('#fa-root').evaluate(e=>e.scrollWidth>e.clientWidth);assert.equal(overflow,false,'Root overflows viewport');
},{viewport:{width,height:844}});

await run('B27','Mobile year slider must remain within its visible container',async p=>{
 await nav(p,'People');const r=await p.locator('input[type=range]').boundingBox();assert.ok(r.x+r.width<=390,'The right end of the year slider is clipped off-screen');
},{viewport:{width:390,height:844}});
await run('B28','Mobile family search must have enough room to enter and read a name',async p=>{
 const r=await p.locator('header input').boundingBox();assert.ok(r.width>=120,`Search is only ${r.width}px wide`);
},{viewport:{width:390,height:844}});
await run('B29','Escape must close an edit modal',async p=>{
 await manage(p);await add(p,'person');await p.keyboard.press('Escape');assert.equal(await modal(p).count(),0,'Escape ignored');
});
await run('B30','Empty People search must provide a no-results message',async p=>{
 await nav(p,'People');await p.getByPlaceholder('Search the family…').fill('zzzz-impossible');assert.match(await p.locator('.fa-content').innerText(),/no .*match|no results/i,'Blank area instead of no-results guidance');
});
await run('B31','Spouse generation alignment must also keep children below parents',async p=>{
 const rows=await p.evaluate(async()=>{
  const {computeGenerations}=await import('/src/features/tree/FamilyTreeView.jsx');
  const records=[
   {id:'a',parents:[],children:['b'],spouses:[]},
   {id:'b',parents:['a'],children:['c'],spouses:[]},
   {id:'c',parents:['b'],children:[],spouses:['x']},
   {id:'x',parents:[],children:['y'],spouses:['c']},
   {id:'y',parents:['x'],children:[],spouses:[]},
  ];return computeGenerations(records).map(row=>row.map(p=>p.id));
 });const parent=rows.findIndex(row=>row.includes('x')),child=rows.findIndex(row=>row.includes('y'));assert.ok(child>parent,`Child is in generation ${child+1}, parent in ${parent+1}`);
});
await run('B32','Saving a person biography must not remove existing branch assignments',async p=>{
 await manage(p);await edit(p,'Yosef Kaminski');await field(p,'Biography').fill('Changed biography');await save(p);assert.deepEqual((await data(p)).people[0].branches,['kaminski']);
});
await run('B33','Clicking branch selector and cancelling must preserve draft tags',async p=>{
 await manage(p);await edit(p,'Yosef Kaminski');const box=label(p,'Branches / family lines');await box.locator('button[aria-haspopup=listbox]').click();
 await p.locator('div[style*="position: fixed"][style*="z-index: 40"]').click({position:{x:2,y:2}});await save(p);assert.deepEqual((await data(p)).people[0].branches,['kaminski'],'Opening the selector removed an existing branch');
});

await run('C13','Person linked-event and linked-document fields update the related people arrays',async p=>{
 await manage(p);await edit(p,'Hannah Kaminski');await multiselect(p,'Linked events','Yosef Kaminski born');await save(p);
 assert.ok((await data(p)).events.find(e=>e.id==='e1').people.includes('hannah'));
 await edit(p,'Hannah Kaminski');await multiselect(p,'Linked documents','Letter from Minsk');await save(p);assert.ok((await data(p)).documents.find(d=>d.id==='d8').people.includes('hannah'));
});
await run('R06','Last populated branch cannot move members to a nonexistent branch',async p=>{
 await manage(p,'Branches');await row(p,'Kaminski').getByTitle('Delete',{exact:true}).click();await modal(p).getByRole('button',{name:'Move them to another branch'}).click();await modal(p).getByRole('button',{name:'Delete branch',exact:true}).click();
 await row(p,'Roth').getByTitle('Delete',{exact:true}).click();await expect(modal(p).getByRole('button',{name:/Move them to another branch/})).toBeDisabled();await modal(p).getByRole('button',{name:'Delete branch',exact:true}).click();await expect(modal(p)).toHaveCount(0);assert.equal((await data(p)).branches.length,0);assert.equal((await data(p)).people.length,13);
});
await run('R07','Relationship Add is disabled without a target person',async p=>{
 await manage(p,'Relationships');await expect(p.getByRole('button',{name:'Add connection',exact:true})).toBeDisabled();
});
await run('D06','Export failure shows an error without changing archive data',async p=>{
 await manage(p);const before=await data(p);await p.evaluate(()=>{URL.createObjectURL=()=>{throw new Error('Simulated export failure');};});await p.getByRole('button',{name:'Export JSON'}).click();await expect(p.getByRole('alert').filter({hasText:'Could not export'})).toBeVisible();assert.deepEqual(await data(p),before);
});
await run('N11','Profile parent and child navigation and close icon',async p=>{
 await nav(p,'People');await p.getByText('Avram Kaminski',{exact:true}).click();await p.locator('aside').getByRole('button',{name:'Yosef Kaminski'}).click();await p.locator('aside').getByRole('button',{name:'Lena Roth'}).click();await p.locator('aside > div').first().locator('button').last().click();await expect(p.locator('aside')).toHaveCount(0);
});

await browser.close();
const passed=results.filter(r=>r.status==='passed').length;
console.log(`\nTOTAL ${results.length}: ${passed} passed, ${results.length-passed} failed`);
process.exitCode=results.some(r=>r.status==='failed')?1:0;
