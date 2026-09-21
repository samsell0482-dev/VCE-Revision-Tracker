import {test,expect} from '@playwright/test';
import {subjects} from '../subjects.js';
import {openSubjectSetup} from './onboarding.js';
const added=['biology-34','chemistry-34','psychology-34','specialist-maths-34','business-management-34','legal-studies-34','economics-34'].map(id=>subjects.find(s=>s.id===id));
test('every added subject is offered at setup and opens with all of its content',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await openSubjectSetup(page);
 for(const s of added)await page.getByRole('checkbox',{name:s.name,exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await expect(page.locator('#subject-list > button')).toHaveCount(added.length);
 for(const s of added){
  await page.locator('#subject-list > button').filter({hasText:s.name}).click();
  await expect(page.getByRole('heading',{name:s.name,exact:true})).toBeVisible();
  await expect(page.locator('#list .area')).toHaveCount(s.areas.length);
  await expect(page.locator('#list .point')).toHaveCount(s.points.length);
  await page.getByRole('button',{name:'All subjects'}).click();
 }
 expect(errors).toEqual([]);
});
test('a new subject rates, builds a cue card and saves a practice answer',async({page})=>{
 const bio=subjects.find(s=>s.id==='biology-34'),first=bio.points[0],second=bio.points[1];
 await openSubjectSetup(page);
 await page.getByRole('checkbox',{name:'Biology',exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await page.locator('#subject-list > button').click();
 await page.getByRole('button',{name:'Mark '+first.id+" as couldn't explain it",exact:true}).click();
 await page.getByRole('button',{name:'Mark '+second.id+" as couldn't explain it",exact:true}).click();
 await page.getByRole('button',{name:'Cue cards',exact:true}).click();
 await expect(page.locator('.deck .qcard')).toHaveCount(2);
 await expect(page.locator('.deck .qcard').first()).toContainText(first.title);
 await page.getByRole('button',{name:'Focus on cue card: '+first.title}).click();
 await expect(page.getByRole('dialog',{name:first.title})).toBeVisible();
 await expect(page.locator('html')).toHaveCSS('overflow','hidden');
 await page.getByRole('button',{name:'Next'}).click();
 await expect(page.getByRole('dialog',{name:second.title})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'Practice',exact:true}).click();
 await page.locator('textarea').first().fill('Biology practice answer');
 await page.reload();
 await expect(page.getByRole('button',{name:'Mark '+first.id+" as couldn't explain it",exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Practice',exact:true}).click();
 await expect(page.locator('textarea').first()).toHaveValue('Biology practice answer');
 await expect(page.getByRole('link',{name:bio.sourceLabel})).toHaveAttribute('href',bio.sourceUrl);
});
test('added subjects do not disturb an existing subject saved earlier',async({page})=>{
 await openSubjectSetup(page);
 await page.getByRole('checkbox',{name:'English Language',exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await page.locator('#subject-list > button').click();
 await page.getByRole('button',{name:"Mark 3.1.1 as couldn't explain it",exact:true}).click();
 await page.getByRole('button',{name:'All subjects'}).click();
 await page.getByRole('button',{name:'Change subjects'}).click();
 await page.getByRole('checkbox',{name:'Economics',exact:true}).check();
 await page.getByRole('button',{name:'Save subjects'}).click();
 await expect(page.locator('#subject-list > button')).toHaveCount(2);
 await page.locator('#subject-list > button').filter({hasText:'English Language'}).click();
 await expect(page.getByRole('button',{name:"Mark 3.1.1 as couldn't explain it",exact:true})).toHaveAttribute('aria-pressed','true');
});
