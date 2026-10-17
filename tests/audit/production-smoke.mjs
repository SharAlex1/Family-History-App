import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const output=process.env.AUDIT_OUTPUT||'docs/audit/verification';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/^https:\/\//,r=>r.abort());await page.goto(process.env.AUDIT_PRODUCTION_URL||'http://127.0.0.1:5175');
const results=[];
for(const name of ['Overview','Family Tree','Timeline','Map','People','Documents','Follow a Journey','Oral History','Stories & Books','Relationship Finder','Research & Evidence','Family Memories','On This Day','Import & Merge','Manage Data']){
 await page.locator('nav button').filter({hasText:new RegExp(`^${name}$`)}).click();await expect(page.locator('.fa-content h1,.fa-content h2')).toBeVisible();results.push(name);
}
await fs.writeFile(path.join(output,'production-smoke.json'),JSON.stringify({views:results,pageErrors:errors},null,2)+'\n');
await browser.close();if(errors.length)throw new Error(errors.join('\n'));console.log('Production bundle: all fifteen views rendered without uncaught errors.');
