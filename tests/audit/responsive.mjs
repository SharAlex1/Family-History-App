import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const output=process.env.AUDIT_OUTPUT||'docs/audit/verification';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
const base=process.env.AUDIT_URL||'http://127.0.0.1:5173';
await fs.mkdir(path.join(output,'screenshots'),{recursive:true});
const results=[];
for(const width of [1440,768,390,320]){
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
 await context.route(/^https:\/\//,r=>r.abort());
 const page=await context.newPage();await page.goto(base);
 for(const view of ['Overview','Family Tree','Timeline','Map','People','Documents','Manage Data']){
  await page.locator('nav button').filter({hasText:new RegExp(`^${view}$`)}).click();
  const measures=await page.evaluate(()=>{
   const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth};};
   return {viewport:innerWidth,root:rect(document.querySelector('#fa-root')),content:rect(document.querySelector('.fa-content')),slider:rect(document.querySelector('.fa-slider')),range:rect(document.querySelector('input[type=range]')),search:rect(document.querySelector('header input')),unnamedNav:[...document.querySelectorAll('nav button')].filter(b=>getComputedStyle(b.querySelector('.fa-label')).display==='none'&&!b.getAttribute('aria-label')).length};
  });
  results.push({width,view,...measures});
  if(width===390||width===1440)await page.screenshot({path:`${output}/screenshots/${width}-${view.replaceAll(' ','-')}.png`});
 }
 await page.getByRole('button',{name:'Add person',exact:true}).click();
 await page.waitForTimeout(350);
 if(width===390)await page.screenshot({path:path.join(output,'screenshots/390-person-form.png')});
 const required=await page.locator('.fa-modal').evaluate(e=>({scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,rectWidth:e.getBoundingClientRect().width}));
 results.push({width,view:'Add person',...required});
 await context.close();
}
await browser.close();await fs.writeFile(path.join(output,'responsive.json'),JSON.stringify(results,null,2)+'\n');
console.log('Captured responsive measurements and 15 screenshots.');
