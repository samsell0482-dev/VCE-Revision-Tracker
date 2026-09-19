export async function openSubjectSetup(page){
 await page.goto('/');
 await page.getByRole('button',{name:'Self assess'}).click();
}
