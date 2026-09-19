import {test,expect} from '@playwright/test';
import {subjects} from '../subjects.js';
import {openSubjectSetup} from './onboarding.js';
// Which subject content files the browser actually asked for. The dev server
// serves them from /src/subjects/<id>.json; a built site serves hashed chunks
// named after the id, so matching on the id covers both.
const watch=page=>{
 const fetched=new Set();
 page.on('request',r=>{const m=/\/subjects\/([a-z0-9-]+?)(-[A-Za-z0-9_]{8})?\.(json|js)/.exec(r.url());if(m)fetched.add(m[1]);});
 return fetched;
};
const card=(page,name)=>page.locator('#subject-list > button').filter({has:page.getByRole('heading',{name,exact:true})});
test('the setup screen lists every subject without downloading any of their content',async({page})=>{
 const fetched=watch(page);
 await openSubjectSetup(page);
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.getByRole('checkbox')).toHaveCount(subjects.length);
 await page.waitForTimeout(1500);
 expect([...fetched]).toEqual([]);
});
test('only the selected subjects are downloaded, never the rest',async({page})=>{
 const fetched=watch(page);
 await openSubjectSetup(page);
 await page.getByRole('checkbox',{name:'Biology',exact:true}).check();
 await page.getByRole('checkbox',{name:'Media',exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await expect(page.locator('#subject-list > button')).toHaveCount(2);
 // The dashboard's totals and per-subject bars come from the index alone.
 await expect(page.locator('.readout')).toContainText('2 subjects');
 await page.waitForTimeout(2000);
 const unselected=subjects.map(s=>s.id).filter(id=>id!=='biology-34'&&id!=='media-34');
 for(const id of unselected)expect(fetched.has(id),id+' should not have been downloaded').toBe(false);
});
test('opening a subject downloads it and shows its full content',async({page})=>{
 const bio=subjects.find(s=>s.id==='biology-34');
 const fetched=watch(page);
 await openSubjectSetup(page);
 await page.getByRole('checkbox',{name:'Biology',exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await expect(page.locator('#subject-list > button')).toHaveCount(1);
 await card(page,'Biology').click();
 await expect(page.locator('#list .point')).toHaveCount(bio.points.length);
 // Content that lives only in the per-subject file, not in the index.
 await expect(page.locator('#list .point-detail').first()).not.toBeEmpty();
 await expect(page.getByText(bio.points[0].title,{exact:true}).first()).toBeVisible();
 expect(fetched.has('biology-34')).toBe(true);
});
test('a subject already downloaded is not fetched again when reopened',async({page})=>{
 await openSubjectSetup(page);
 await page.getByRole('checkbox',{name:'Media',exact:true}).check();
 await page.getByRole('button',{name:'Start revising'}).click();
 await card(page,'Media').click();
 await expect(page.locator('#list .point').first()).toBeVisible();
 const refetched=watch(page);
 await page.getByRole('button',{name:'All subjects'}).click();
 await card(page,'Media').click();
 await expect(page.locator('#list .point').first()).toBeVisible();
 expect(refetched.has('media-34'),'the loader should serve the second visit from cache').toBe(false);
});
