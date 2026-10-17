import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const output=process.env.AUDIT_OUTPUT||'docs/features/verification';
await fs.mkdir(path.join(output,'screenshots'),{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
const views=['Overview','Family Tree','Timeline','Map','People','Documents','Follow a Journey','Oral History','Stories & Books','Relationship Finder','Research & Evidence','Family Memories','On This Day','Import & Merge','Manage Data'];
const results=[],errors=[];
try {
 for(const width of [1440,768,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await context.route(/^https:\/\//,route=>route.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push({width,message:e.message}));await page.goto(process.env.AUDIT_URL||'http://127.0.0.1:5173');
  for(const view of views){
   await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('button',{name:view,exact:true}).click();
   await expect(page.locator('.fa-content h1,.fa-content h2')).toBeVisible();
   if(view==='Family Tree')await page.getByRole('button',{name:'Explore connected tree',exact:true}).click();
   const metrics=await page.evaluate(()=>{const c=document.querySelector('.fa-content');return {viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,contentWidth:c.clientWidth,contentScrollWidth:c.scrollWidth};});
   results.push({width,view,...metrics});
   expect(metrics.pageWidth,`${view} at ${width}px: page overflow`).toBeLessThanOrEqual(width+1);
   expect(metrics.contentScrollWidth,`${view} at ${width}px: content overflow`).toBeLessThanOrEqual(metrics.contentWidth+1);
   if([1440,390].includes(width)&&['Family Tree','Follow a Journey','Stories & Books'].includes(view))await page.screenshot({path:path.join(output,`screenshots/${width}-${view.replaceAll(' ','-')}.png`)});
  }
  await context.close();
 }
 expect(errors).toEqual([]);
}finally{await browser.close();await fs.writeFile(path.join(output,'responsive.json'),JSON.stringify({results,pageErrors:errors},null,2)+'\n');}
console.log(`Passed ${results.length} responsive view checks with no runtime errors.`);
