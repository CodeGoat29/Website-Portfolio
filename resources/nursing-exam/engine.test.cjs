const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const E = require('./engine.js');
const exam = JSON.parse(fs.readFileSync(__dirname + '/exam.json','utf8'));
test('source exam contains all 50 questions and valid answer sets',()=>{
 assert.equal(exam.questions.length,50);
 assert.deepEqual(exam.questions.map(q=>q.id),Array.from({length:50},(_,i)=>i+1));
 for(const q of exam.questions.filter(q=>q.type!=='number')) assert.ok(q.answer.every(a=>q.options.some(o=>o.id===a)));
 assert.equal(exam.questions.filter(q=>q.type==='number').length,3);
});
test('SATA requires the full correct set with no extras, independent of order',()=>{
 const q=exam.questions[1];assert.ok(E.correct(q,['E','D','B','A']));assert.ok(!E.correct(q,['A','B','D']));assert.ok(!E.correct(q,['A','B','C','D','E']));assert.ok(!E.correct(q,[]));
});
test('numeric scoring rejects blanks, units, unrounded values, and invalid strings',()=>{
 assert.ok(E.correct(exam.questions[47],'14.80'));assert.ok(!E.correct(exam.questions[47],'14.76'));
 for(const v of ['',' ','14.8 mL/hr','abc','Infinity'])assert.ok(!E.correct(exam.questions[47],v));
 assert.ok(E.correct(exam.questions[48],'0.64'));assert.ok(E.correct(exam.questions[49],'31'));
});
test('60-minute deadline survives serialization and expires at the exact boundary',()=>{
 const a=E.create(exam,1000);assert.equal(E.remaining(a,1000),3600);assert.equal(E.remaining(a,3600999),1);
 const loaded=JSON.parse(JSON.stringify(a));assert.equal(E.remaining(loaded,3601000),0);assert.equal(E.remaining(loaded,5000000),0);
});
test('grading counts unanswered, correct, and the 80% passing threshold',()=>{
 const a=E.create(exam,1000);assert.equal(E.grade(exam,a).score,0);assert.equal(E.grade(exam,a).unanswered,50);
 for(const q of exam.questions)a.answers[q.id]=q.type==='number'?String(q.answer):q.answer;
 assert.equal(E.grade(exam,a).percent,100);
 for(let i=41;i<=50;i++)delete a.answers[i];assert.equal(E.grade(exam,a).score,40);assert.equal(E.grade(exam,a).passed,true);
 delete a.answers[40];assert.equal(E.grade(exam,a).passed,false);
});
const vm = require('node:vm');
class FakeNode {
 constructor(tag){this.tag=tag;this.children=[];this.text='';this.events={};this.classList={toggle(){}};}
 set textContent(v){this.text=String(v);this.children=[];} get textContent(){return this.text+this.children.map(n=>n.textContent).join(' ');}
 append(...items){this.children.push(...items);} replaceChildren(...items){this.text='';this.children=items;}
 setAttribute(){} addEventListener(name,fn){this.events[name]=fn;} focus(){}
}
async function controller(attempt, initialNow) {
 let now=initialNow,interval,stored=JSON.stringify(attempt);
 const app=new FakeNode('div'),notice=new FakeNode('p');app.id='exam-app';notice.id='exam-notice';
 function find(node,id){if(node.id===id)return node;for(const c of node.children){const f=find(c,id);if(f)return f;}return null;}
 const document={createElement:t=>new FakeNode(t),getElementById:id=>find(app,id)||find(notice,id),addEventListener(){}};
 const context={document,window:{NursingExam:E,addEventListener(){}},Date:{now:()=>now},localStorage:{getItem:()=>stored,setItem:(key,v)=>{stored=v;}},fetch:async()=>({ok:true,json:async()=>exam}),setInterval:fn=>{interval=fn;return 1;},clearInterval(){interval=null;},console};
 // Engine uses the same fake wall clock as the controller.
 context.window.NursingExam={...E,remaining:a=>E.remaining(a,now)};
 await vm.runInNewContext(fs.readFileSync(__dirname+'/exam.js','utf8'),context);
 return {app, saved:()=>JSON.parse(stored), expire:()=>{now=attempt.deadline;interval();}};
}
test('controller auto-submits saved answers at expiry and renders final grade',async()=>{
 const attempt=E.create(exam,1000);attempt.answers[1]=['C'];
 const c=await controller(attempt,2000);assert.match(c.app.textContent,/Question 1 of 50/);c.expire();
 assert.equal(c.saved().reason,'timeout');assert.equal(c.saved().submittedAt,attempt.deadline);assert.match(c.app.textContent,/2% — 1\/50 correct/);assert.match(c.app.textContent,/49 unanswered/);
});
test('reopening after deadline submits immediately without allowing another answer',async()=>{
 const attempt=E.create(exam,1000);attempt.answers[49]='0.64';
 const c=await controller(attempt,attempt.deadline+30000);assert.equal(c.saved().reason,'timeout');assert.match(c.app.textContent,/Your results/);assert.doesNotMatch(c.app.textContent,/Submit exam early/);
});
