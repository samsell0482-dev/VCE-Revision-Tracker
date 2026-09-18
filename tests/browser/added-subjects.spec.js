import {test,expect} from '@playwright/test';
import subjects from '../../src/subjects.json' with {type:'json'};
const added=['biology-34','chemistry-34','psychology-34','specialist-maths-34','business-management-34','legal-studies-34','economics-34'].map(id=>subjects.find(s=>s.id===id));
test('every added subject is offered at setup and opens with all of its content',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
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
 const bio=subjects.find(s=>s.id==='biology-34'),first=bio.points[0];
 await page.goto('/');
 await page.getByRole('checkbox',{name:'Biology',exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await page.locator('#subject-list > button').click();
 await page.getByRole('button',{name:'Pass 1, '+first.id+': not rated',exact:true}).click();
 await page.getByRole('button',{name:'Cue cards',exact:true}).click();
 await expect(page.locator('.qcard')).toHaveCount(1);
 await expect(page.locator('.qcard')).toContainText(first.title);
 await page.getByRole('button',{name:'Practice',exact:true}).click();
 await page.locator('textarea').first().fill('Biology practice answer');
 await page.reload();
 await expect(page.getByRole('button',{name:"Pass 1, "+first.id+": couldn't explain it",exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Practice',exact:true}).click();
 await expect(page.locator('textarea').first()).toHaveValue('Biology practice answer');
 await expect(page.getByRole('link',{name:bio.sourceLabel})).toHaveAttribute('href',bio.sourceUrl);
});
test('added subjects do not disturb an existing subject saved earlier',async({page})=>{
 await page.goto('/');
 await page.getByRole('checkbox',{name:'English Language',exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await page.locator('#subject-list > button').click();
 await page.getByRole('button',{name:'Pass 1, 3.1.1: not rated',exact:true}).click();
 await page.getByRole('button',{name:'All subjects'}).click();
 await page.getByRole('button',{name:'Change subjects'}).click();
 await page.getByRole('checkbox',{name:'Economics',exact:true}).check();
 await page.getByRole('button',{name:'Save subjects'}).click();
 await expect(page.locator('#subject-list > button')).toHaveCount(2);
 await page.locator('#subject-list > button').filter({hasText:'English Language'}).click();
 await expect(page.getByRole('button',{name:"Pass 1, 3.1.1: couldn't explain it",exact:true})).toBeVisible();
});
