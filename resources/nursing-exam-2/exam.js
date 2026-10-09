(async function () {
    'use strict';
    const app = document.getElementById('exam-app');
    const notice = document.getElementById('exam-notice');
    const E = window.NursingExam;
    const make = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
    function button(text, action, cls = '') { const b = make('button', text, cls); b.type = 'button'; b.addEventListener('click', action); return b; }
    let exam, attempt, confirmBox;
    const key = 'dipiazza-nursing-exam-2-practice-2-v1';
    function save() {
        try { localStorage.setItem(key, JSON.stringify(attempt)); }
        catch { notice.textContent = 'Browser saving is unavailable. Keep this tab open to preserve your answers.'; }
    }
    function focusTitle() { const h = document.getElementById('exam-focus'); if (h) h.focus(); }
    function countAnswered() { return exam.questions.filter(q => E.answered(attempt.answers[q.id])).length; }
    function submit(reason) {
        if (attempt.submittedAt !== null) return;
        attempt.submittedAt = Date.now(); attempt.reason = reason;
        save(); renderResults(); focusTitle();
    }
    function start() {
        attempt = E.create(exam); notice.textContent = ''; save();
        renderQuestion(); focusTitle();
    }
    function move(index) {
        attempt.index = Math.max(0, Math.min(exam.questions.length - 1, index)); save(); renderQuestion(); focusTitle();
    }
    function renderIntro() {
        app.replaceChildren(); const panel = make('div', '', 'exam-panel');
        panel.append(make('h3', '50 questions · Untimed'), make('p', 'Work through one question at a time. Use Previous and Next to review or skip questions. Take as much time as you need.'));
        const list = make('ul');
        ['Multiple choice: select one answer. SATA: select all that apply.', 'Three dosage questions: enter the rounded number in the unit shown. Optional scratch work is saved but not graded.', 'One point per question. SATA is all-or-nothing; unanswered questions earn zero. Passing target: 40/50 (80%).', 'There is no time limit or automatic submission. Submit when you are ready to see your grade.', 'Answers and progress are saved in this browser only. Results and the supplied answer key appear after submission.'].forEach(t => list.append(make('li', t)));
        panel.append(list, button('Start exam', start)); app.append(panel);
    }
    function requestSubmit() {
        confirmBox.hidden = false; confirmBox.replaceChildren();
        confirmBox.append(make('p', `Submit your exam now? ${exam.questions.length - countAnswered()} unanswered question(s) will receive zero points.`), button('Submit and see grade', () => submit('manual')), button('Keep working', () => { confirmBox.hidden = true; }, 'secondary'));
        confirmBox.querySelector('button').focus();
    }
    function renderQuestion() {
        document.body.classList.add('exam-active');
        app.replaceChildren(); const q = exam.questions[attempt.index];
        const bar = make('div', '', 'exam-toolbar'); const counter = make('span', `Question ${attempt.index + 1} of ${exam.questions.length}`);
        bar.append(counter);
        const progress = make('progress'); progress.max = exam.questions.length; progress.value = countAnswered(); progress.setAttribute('aria-label','Questions answered');
        const answeredText = make('p', `${countAnswered()} of ${exam.questions.length} answered`, 'exam-muted'); answeredText.id='answered-count';
        const panel=make('div','','exam-panel');panel.append(make('p',q.section,'exam-eyebrow'));
        const heading=make('h3',q.prompt,'question-prompt');heading.id='exam-focus';heading.tabIndex=-1;panel.append(heading);
        const hint=make('p', q.type==='multiple' ? 'Select all that apply.' : q.type==='number' ? `Enter a number in ${q.unit}. Round to ${q.decimals===0?'the nearest whole number':q.decimals===1?'the nearest tenth':'the nearest hundredth'}.` : 'Choose one answer.', 'exam-muted');panel.append(hint);
        function update(value) {
                attempt.answers[q.id]=value;save();progress.value=countAnswered();answeredText.textContent=`${countAnswered()} of ${exam.questions.length} answered`;
            const currentOption = document.querySelector('#question-jump option:checked');
            if (currentOption) currentOption.textContent = `${attempt.index+1} · ${E.answered(value)?'Answered':'Unanswered'}`;
        }
        if(q.type==='number') {
            const label=make('label',`Answer (${q.unit})`);label.htmlFor='numeric-answer';
            const input=make('input');input.id='numeric-answer';input.type='text';input.inputMode='decimal';input.autocomplete='off';input.value=attempt.answers[q.id]||'';input.addEventListener('input',()=>update(input.value));
            const workLabel=make('label','Scratch work (optional, not graded)');workLabel.htmlFor='scratch-work';
            const work=make('textarea');work.id='scratch-work';work.rows=2;work.value=attempt.work[q.id]||'';work.addEventListener('input',()=>{attempt.work[q.id]=work.value;save();});panel.append(label,input,workLabel,work);
        } else {
            const field=make('fieldset');const legend=make('legend','Answer choices','visually-hidden');field.append(legend);
            q.options.forEach(option=>{
                const label=make('label','','exam-option');const input=make('input');input.type=q.type==='multiple'?'checkbox':'radio';input.name='answer';input.value=option.id;input.checked=(attempt.answers[q.id]||[]).includes(option.id);
                if(q.type==='single') input.addEventListener('click',()=>{
                    const selected=(attempt.answers[q.id]||[]).includes(option.id);
                    input.checked=!selected;update(selected?[]:[option.id]);
                });
                input.addEventListener('change',()=>update([...field.querySelectorAll('input:checked')].map(i=>i.value)));
                label.append(input,make('span',`${option.id}. ${option.text}`));field.append(label);
            });panel.append(field);
        }
        const nav=make('div','','exam-actions');const prev=button('Previous',()=>move(attempt.index-1),'secondary');prev.disabled=attempt.index===0;
        nav.append(prev,button('Submit exam',requestSubmit,'secondary submit-early'));
        nav.append(attempt.index===exam.questions.length-1?button('Finish exam',()=>submit('manual')):button('Next',()=>move(attempt.index+1)));
        const jumpLabel=make('label','Go to question','visually-hidden');jumpLabel.htmlFor='question-jump';const jump=make('select');jump.id='question-jump';
        exam.questions.forEach((item,i)=>{const option=make('option',`${i+1}${E.answered(attempt.answers[item.id])?' · Answered':' · Unanswered'}`);option.value=i;option.selected=i===attempt.index;jump.append(option);});jump.addEventListener('change',()=>move(Number(jump.value)));
        confirmBox=make('div','','exam-confirm');confirmBox.hidden=true;
        const picker=make('div','','question-picker');picker.append(jumpLabel,jump);bar.append(picker);
        app.append(bar,progress,answeredText,panel,nav,confirmBox);
    }
    function answerText(q,value) {
        if (!E.answered(value)) return 'Unanswered';
        if(q.type==='number')return `${value} ${q.unit}`;
        return q.options.filter(o=>value.includes(o.id)).map(o=>`${o.id}. ${o.text}`).join('\n');
    }
    function renderResults() {
        document.body.classList.remove('exam-active');
        app.replaceChildren();notice.textContent='';const result=E.grade(exam,attempt);const panel=make('div','','exam-panel');
        const title=make('h3','Your results');title.id='exam-focus';title.tabIndex=-1;
        panel.append(title,make('p',`${result.percent}% — ${result.score}/${result.total} correct`,'exam-score'),make('p',result.passed?'Practice target met (80%).':'Below the practice target (80%).'),make('p','This attempt was submitted.'),make('p',`${result.unanswered} unanswered · SATA graded all-or-nothing · 1 point per question`));
        panel.append(button('Retake exam',start,'secondary'));
        const reviewHeading=make('h3','Answer review','review-heading');
        const filterLabel=make('label','Show','review-filter-label');filterLabel.htmlFor='review-filter';
        const filter=make('select');filter.id='review-filter';
        [['all','All answers'],['wrong','Wrong answers only']].forEach(([value,text])=>{const option=make('option',text);option.value=value;filter.append(option);});
        const filterWrap=make('div','','review-filter');filterWrap.append(filterLabel,filter);
        app.append(panel,reviewHeading,filterWrap);
        const reviews=[];
        exam.questions.forEach((q,i)=>{
            const detail=make('details','',`exam-review ${result.rows[i].correct?'is-correct':'is-wrong'}`);detail.append(make('summary',`${q.id}. ${result.rows[i].correct?'Correct':result.rows[i].answered?'Incorrect':'Unanswered'}`),make('p',q.prompt,'question-prompt'),make('p','Your answer:\n'+answerText(q,attempt.answers[q.id]),'answer-review'),make('p','Answer key:\n'+answerText(q,q.type==='number'?String(q.answer):q.answer),'answer-review'));
            if(attempt.work[q.id])detail.append(make('p','Your scratch work:\n'+attempt.work[q.id],'answer-review'));app.append(detail);
            reviews.push(detail);
        });
        filter.addEventListener('change',()=>reviews.forEach(detail=>{detail.hidden=filter.value==='wrong'&&!detail.className.includes('is-wrong');}));
    }
    try {
        const response=await fetch('/resources/nursing-exam-2/exam.json');if(!response.ok)throw Error('Unable to load exam');exam=await response.json();
        try {
            const saved=JSON.parse(localStorage.getItem(key));
            if(saved && saved.examId===exam.id && Number.isFinite(saved.startedAt) && Number.isInteger(saved.index) && saved.index>=0 && saved.index<exam.questions.length && saved.answers && saved.work && (saved.submittedAt===null || Number.isFinite(saved.submittedAt))){ attempt=saved; if (Object.hasOwn(attempt, 'deadline')) { delete attempt.deadline; save(); } }
        } catch { notice.textContent='A saved attempt could not be loaded. You can start a new exam.'; }
        if(attempt) {
            if(attempt.submittedAt!==null)renderResults();
            else renderQuestion();
        }else renderIntro();
        window.addEventListener('storage',event=>{
            if(event.key===key){location.reload();}
        });
    } catch { app.replaceChildren(make('p','The exam could not be loaded. Please refresh to try again.')); }
})();
