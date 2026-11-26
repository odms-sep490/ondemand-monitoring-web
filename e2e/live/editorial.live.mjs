import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
const out='../on-demand-monitoring-system/.ai-runtime/editorial'
const api=async(path,method='GET',body)=>{const r=await fetch('http://localhost:8086'+path,{method,headers:{'X-QA-Actor':'qa-manager','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!r.ok)throw Error(JSON.stringify(j));return j.data}
const reports=await api('/api/missions/qa-mission/inspection-reports'); let report=reports.find(r=>r.status==='AI_DRAFT'); if(!report)throw Error('Seed an isolated AI_DRAFT first')
report=await api(`/api/inspection-reports/${report.id}`,'PATCH',{revision:report.revision,document:{...report.document,executiveSummary:'Chúng tôi đã tiến hành kiểm tra hồ sơ bằng chứng của nhiệm vụ.'}})
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}})
await page.context().grantPermissions(['clipboard-read','clipboard-write']);
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)})
await page.route('**/api/missions/qa-mission/inspection-reports',async route=>{const response=await route.fetch();const payload=await response.json();payload.data=payload.data.filter(r=>r.id===report.id);await route.fulfill({response,json:payload})});
await page.goto('http://localhost:5175/e2e/harness/inspection-report.html');await page.waitForLoadState('networkidle')
if (!(await page.getByRole('combobox',{name:'Yêu cầu biên tập'}).count())) {
 await page.getByRole('combobox').first().locator('..').locator('..').click()
 await page.getByText(`Bản nháp AI · Cần rà soát · Phiên bản ${report.revision}`,{exact:true}).last().click()
}
const checks=[]
for(const label of ['Chuyên nghiệp hơn','Rút gọn','Dễ hiểu hơn','Tóm tắt nguồn','Đề xuất chú thích']){
 await page.getByRole('combobox',{name:'Yêu cầu biên tập'}).locator('..').locator('..').click();await page.getByText(label,{exact:true}).last().click()
 await page.getByRole('button',{name:'Xem đề xuất AI',exact:true}).click()
 const dialog=page.getByRole('dialog',{name:'Đề xuất AI · Chưa áp dụng'})
 await dialog.waitFor({timeout:150000})
 await dialog.getByRole('button',{name:'Sao chép đề xuất'}).waitFor()
 await dialog.getByRole('button',{name:'Tạo lại',exact:true}).waitFor()
 if(label==='Chuyên nghiệp hơn') {
   await dialog.getByRole('button',{name:'Sao chép đề xuất'}).click()
   if(!(await page.evaluate(()=>navigator.clipboard.readText())).includes('Tóm tắt'))throw Error('Copy failed')
   const regenerated=page.waitForResponse(r=>r.url().includes('/rewrite') && r.status()===200)
   await dialog.getByRole('button',{name:'Tạo lại',exact:true}).click();await regenerated
 }
 const stored=await api(`/api/inspection-reports/${report.id}`)
 if(stored.document.executiveSummary!==report.document.executiveSummary)throw Error('Preview overwrote report')
 console.log('Opened',label); checks.push({skill:label,dialog:true,text:(await dialog.innerText()).slice(0,2500)})
 await page.screenshot({path:`${out}/ui-${checks.length}.png`,fullPage:true})
 if(label==='Chuyên nghiệp hơn') {
   await dialog.getByRole('button',{name:'Áp dụng vào bản nháp'}).click()
   await page.getByRole('button',{name:'Hoàn tác biên tập AI'}).click()
   await page.getByRole('button',{name:/Lưu bản nháp/}).click()
   await page.getByRole('button',{name:'Xem đề xuất AI',exact:true}).waitFor({state:'visible'})
   const saved=await api(`/api/inspection-reports/${report.id}`)
   if(saved.document.executiveSummary!==report.document.executiveSummary)throw Error('Undo did not restore summary')
 } else await dialog.getByRole('button',{name:'Bỏ đề xuất'}).click()
}
await fs.writeFile(`${out}/ui-results.json`,JSON.stringify({checks,errors},null,2));await browser.close();if(errors.length)throw Error(errors.join('\n'))
console.log('Five real Ollama editorial dialogs verified')
