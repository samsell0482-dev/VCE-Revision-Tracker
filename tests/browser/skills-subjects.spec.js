import {test,expect} from '@playwright/test';
import {subjects} from '../subjects.js';
import {openSubjectSetup} from './onboarding.js';
const ids=['english-34','history-revolutions-34','geography-34','physical-education-34','accounting-34','data-analytics-34','visual-communication-design-34','media-34','product-design-34'];
const added=ids.map(id=>subjects.find(s=>s.id===id));
const card=(page,name)=>page.locator('#subject-list > button').filter({has:page.getByRole('heading',{name,exact:true})});
test('every skills-based subject is offered at setup and opens with all of its content',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await openSubjectSetup(page);
 for(const s of added)await page.getByRole('checkbox',{name:s.name,exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await expect(page.locator('#subject-list > button')).toHaveCount(added.length);
 for(const s of added){
  await card(page,s.name).click();
  await expect(page.getByRole('heading',{name:s.name,exact:true})).toBeVisible();
  await expect(page.locator('#list .area')).toHaveCount(s.areas.length);
  await expect(page.locator('#list .point')).toHaveCount(s.points.length);
  await page.getByRole('button',{name:'All subjects'}).click();
 }
 expect(errors).toEqual([]);
});
test('English and English Language appear as separate, independently rated subjects',async({page})=>{
 const english=subjects.find(s=>s.id==='english-34'),el=subjects.find(s=>s.id==='english-language-34');
 await openSubjectSetup(page);
 await page.getByRole('checkbox',{name:'English',exact:true}).check();
 await page.getByRole('checkbox',{name:'English Language',exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await expect(page.locator('#subject-list > button')).toHaveCount(2);
 await card(page,'English').click();
 await expect(page.locator('#list .point')).toHaveCount(english.points.length);
 await page.getByRole('button',{name:'Mark '+english.points[0].id+" as couldn't explain it",exact:true}).click();
 await page.getByRole('button',{name:'All subjects'}).click();
 await card(page,'English Language').click();
 await expect(page.locator('#list .point')).toHaveCount(el.points.length);
 await expect(page.getByRole('button',{name:"Mark 3.1.1 as couldn't explain it",exact:true})).toHaveAttribute('aria-pressed','false');
 await page.reload();
 await expect(page.getByRole('heading',{name:'English Language',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'All subjects'}).click();
 await card(page,'English').click();
 await expect(page.getByRole('button',{name:'Mark '+english.points[0].id+" as couldn't explain it",exact:true})).toHaveAttribute('aria-pressed','true');
});
test('a skills-based subject saves a practice answer and links to VCAA',async({page})=>{
 const pe=subjects.find(s=>s.id==='physical-education-34');
 await openSubjectSetup(page);
 await page.getByRole('checkbox',{name:'Physical Education',exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await page.locator('#subject-list > button').click();
 await page.getByRole('button',{name:'Practice',exact:true}).click();
 await page.getByRole('button',{name:'All questions',exact:true}).click();
 await page.locator('textarea').first().fill('PE practice answer');
 await page.reload();
 await page.getByRole('button',{name:'Practice',exact:true}).click();
 await page.getByRole('button',{name:'All questions',exact:true}).click();
 await expect(page.locator('textarea').first()).toHaveValue('PE practice answer');
 await expect(page.getByRole('link',{name:pe.sourceLabel})).toHaveAttribute('href',pe.sourceUrl);
});
