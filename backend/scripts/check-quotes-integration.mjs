import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
const {prisma}=await import('../src/config/database.js');
const {getQuote,updateQuote,listQuotes}=await import('../src/modules/quotes/quotes.service.js');
const submissionId=randomUUID();
const payload={submissionId,name:'Entegrasyon Testi',email:'quote-test@example.invalid',game:'Quote integration '+submissionId,type:'VEHICLE',description:'Bu yalnızca otomatik entegrasyon testidir; kayıt test sonunda silinir.'};
try {
const send=()=>fetch('http://127.0.0.1:4000/api/quotes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
const first=await send();assert.equal(first.status,201);const receipt=(await first.json()).data;
const retry=await send();assert.equal(retry.status,201);assert.equal((await retry.json()).data.id,receipt.id);
assert.equal(await prisma.quoteRequest.count({where:{submissionId}}),1);
const stored=await getQuote(receipt.id);assert.equal(stored.email,payload.email);assert.equal(stored.status,'NEW');assert.equal(stored.adminNotes,'');
await updateQuote(receipt.id,{status:'REVIEWING',adminNotes:'Private test note'});
const reloaded=await getQuote(receipt.id);assert.equal(reloaded.status,'REVIEWING');assert.equal(reloaded.adminNotes,'Private test note');
const list=await listQuotes({status:'REVIEWING',search:submissionId,page:1,limit:20});assert.equal(list.pagination.total,1);
assert.equal((await fetch('http://127.0.0.1:4000/api/admin/quotes')).status,401);
console.log('PASS: real public API submission, deduplicated retry, PostgreSQL persistence, status/note updates, filtered listing, unauthorized access rejection.');
} finally {await prisma.quoteRequest.deleteMany({where:{submissionId}});await prisma.$disconnect();console.log('Synthetic test record removed.');}
