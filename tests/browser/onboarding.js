export async function openSubjectSetup(page){
 await page.goto('/');
 await page.getByRole('button',{name:'Choose my subjects'}).click();
}
