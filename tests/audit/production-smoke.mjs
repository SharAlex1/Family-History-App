import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/^https:\/\//,r=>r.abort());await page.goto(process.env.AUDIT_PRODUCTION_URL||'http://127.0.0.1:5175');
const results=[];
for(const name of ['Overview','Family Tree','Timeline','Map','People','Documents','Manage Data']){
 await page.locator('nav button').filter({hasText:new RegExp(`^${name}$`)}).click();await expect(page.locator('.fa-content h1,.fa-content h2')).toBeVisible();results.push(name);
}
await fs.writeFile('docs/audit/verification/production-smoke.json',JSON.stringify({views:results,pageErrors:errors},null,2)+'\n');
await browser.close();if(errors.length)throw new Error(errors.join('\n'));console.log('Production bundle: all seven views rendered without uncaught errors.');
