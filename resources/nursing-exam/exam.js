(async function () {
    'use strict';
    const app = document.getElementById('exam-app');
    const notice = document.getElementById('exam-notice');
    const E = window.NursingExam;
    const make = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
    function button(text, action, cls = '') { const b = make('button', text, cls); b.type = 'button'; b.addEventListener('click', action); return b; }
    let exam, attempt, timer, warning = false, confirmBox;
    const key = 'dipiazza-nursing-exam-2-v1';
    function save() {
        try { localStorage.setItem(key, JSON.stringify(attempt)); }
        catch { notice.textContent = 'Browser saving is unavailable. Keep this tab open to preserve your answers and timer.'; }
    }
    function focusTitle() { const h = document.getElementById('exam-focus'); if (h) h.focus(); }
    function countAnswered() { return exam.questions.filter(q => E.answered(attempt.answers[q.id])).length; }
    function checkTime() {
        if (!attempt || attempt.submittedAt !== null) return false;
        const seconds = E.remaining(attempt);
        if (!seconds) { submit('timeout'); return true; }
        const clock = document.getElementById('exam-clock');
        if (clock) { clock.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; clock.classList.toggle('time-low', seconds <= 300); }
        if (seconds <= 300 && !warning) { notice.textContent = 'Five minutes or less remaining. Your exam will submit automatically when time runs out.'; warning = true; }
        return false;
    }
    function submit(reason) {
        if (attempt.submittedAt !== null) return;
        attempt.submittedAt = Date.now(); attempt.reason = reason;
        clearInterval(timer); save(); renderResults(); focusTitle();
    }
    function start() {
        attempt = E.create(exam); warning = false; notice.textContent = ''; save();
        renderQuestion(); clearInterval(timer); timer = setInterval(checkTime, 250); focusTitle();
    }
    function move(index) {
        if (checkTime()) return;
        attempt.index = Math.max(0, Math.min(exam.questions.length - 1, index)); save(); renderQuestion(); focusTitle();
    }
    function renderIntro() {
        app.replaceChildren(); const panel = make('div', '', 'exam-panel');
        panel.append(make('h3', '50 questions · 60 minutes'), make('p', 'Work through one question at a time. Use Previous and Next to review or skip questions. Your timer starts only when you begin.'));
        const list = make('ul');
        ['Multiple choice: select one answer. SATA: select all that apply.', 'Three dosage questions: enter the rounded number in the unit shown. Optional scratch work is saved but not graded.', 'One point per question. SATA is all-or-nothing; unanswered questions earn zero. Passing target: 40/50 (80%).', 'At 60 minutes the test submits automatically, even if questions are unfinished. Refreshing or leaving does not pause the timer; an expired attempt is graded when you return.', 'Answers and progress are saved in this browser only. Results and the supplied answer key appear after submission.'].forEach(t => list.append(make('li', t)));
        panel.append(list, button('Start 60-minute exam', start)); app.append(panel);
    }
    function requestSubmit() {
        if (checkTime()) return;
        confirmBox.hidden = false; confirmBox.replaceChildren();
        confirmBox.append(make('p', `Submit your exam now? ${exam.questions.length - countAnswered()} unanswered question(s) will receive zero points.`), button('Submit and see grade', () => { if (!checkTime()) submit('manual'); }), button('Keep working', () => { confirmBox.hidden = true; }, 'secondary'));
        confirmBox.querySelector('button').focus();
    }
    function renderQuestion() {
        app.replaceChildren(); const q = exam.questions[attempt.index];
        const bar = make('div', '', 'exam-toolbar'); const counter = make('strong', `Question ${attempt.index + 1} of ${exam.questions.length}`);
        const clockLabel = make('span', 'Time remaining: '); const clock = make('strong'); clock.id = 'exam-clock'; clock.setAttribute('role', 'timer'); clock.setAttribute('aria-live','off'); clockLabel.append(clock);bar.append(counter,clockLabel);
        const progress = make('progress'); progress.max = exam.questions.length; progress.value = countAnswered(); progress.setAttribute('aria-label','Questions answered');
        const answeredText = make('p', `${countAnswered()} of ${exam.questions.length} answered`, 'exam-muted'); answeredText.id='answered-count';
        const panel=make('div','','exam-panel');panel.append(make('p',q.section,'exam-eyebrow'));
        const heading=make('h3',q.prompt,'question-prompt');heading.id='exam-focus';heading.tabIndex=-1;panel.append(heading);
        const hint=make('p', q.type==='multiple' ? 'Select all that apply.' : q.type==='number' ? `Enter a number in ${q.unit}. Round to ${q.decimals===0?'the nearest whole number':q.decimals===1?'the nearest tenth':'the nearest hundredth'}.` : 'Choose one answer.', 'exam-muted');panel.append(hint);
        function update(value) {
            if (checkTime()) return;
            attempt.answers[q.id]=value;save();progress.value=countAnswered();answeredText.textContent=`${countAnswered()} of ${exam.questions.length} answered`;
            const currentOption = document.querySelector('#question-jump option:checked');
            if (currentOption) currentOption.textContent = `${attempt.index+1} · ${E.answered(value)?'Answered':'Unanswered'}`;
        }
        if(q.type==='number') {
            const label=make('label',`Answer (${q.unit})`);label.htmlFor='numeric-answer';
            const input=make('input');input.id='numeric-answer';input.type='text';input.inputMode='decimal';input.autocomplete='off';input.value=attempt.answers[q.id]||'';input.addEventListener('input',()=>update(input.value));
            const workLabel=make('label','Scratch work (optional, not graded)');workLabel.htmlFor='scratch-work';
            const work=make('textarea');work.id='scratch-work';work.rows=4;work.value=attempt.work[q.id]||'';work.addEventListener('input',()=>{if(checkTime())return;attempt.work[q.id]=work.value;save();});panel.append(label,input,workLabel,work);
        } else {
            const field=make('fieldset');const legend=make('legend','Answer choices','visually-hidden');field.append(legend);
            q.options.forEach(option=>{
                const label=make('label','','exam-option');const input=make('input');input.type=q.type==='multiple'?'checkbox':'radio';input.name='answer';input.value=option.id;input.checked=(attempt.answers[q.id]||[]).includes(option.id);
                input.addEventListener('change',()=>update([...field.querySelectorAll('input:checked')].map(i=>i.value)));
                label.append(input,make('span',`${option.id}. ${option.text}`));field.append(label);
            });panel.append(field);
        }
        const nav=make('div','','exam-actions');const prev=button('Previous',()=>move(attempt.index-1),'secondary');prev.disabled=attempt.index===0;
        nav.append(prev,button('Clear answer',()=>{if(checkTime())return;delete attempt.answers[q.id];save();renderQuestion();focusTitle();},'secondary'));
        nav.append(attempt.index===exam.questions.length-1?button('Finish exam',requestSubmit):button('Next',()=>move(attempt.index+1)));
        const jumpLabel=make('label','Go to question');jumpLabel.htmlFor='question-jump';const jump=make('select');jump.id='question-jump';
        exam.questions.forEach((item,i)=>{const option=make('option',`${i+1}${E.answered(attempt.answers[item.id])?' · Answered':' · Unanswered'}`);option.value=i;option.selected=i===attempt.index;jump.append(option);});jump.addEventListener('change',()=>move(Number(jump.value)));
        confirmBox=make('div','','exam-confirm');confirmBox.hidden=true;
        app.append(bar,progress,answeredText,panel,nav,jumpLabel,jump,button('Submit exam early',requestSubmit,'secondary submit-early'),confirmBox);
        checkTime();
    }
    function answerText(q,value) {
        if (!E.answered(value)) return 'Unanswered';
        if(q.type==='number')return `${value} ${q.unit}`;
        return q.options.filter(o=>value.includes(o.id)).map(o=>`${o.id}. ${o.text}`).join('\n');
    }
    function renderResults() {
        app.replaceChildren();notice.textContent='';const result=E.grade(exam,attempt);const panel=make('div','','exam-panel');
        const title=make('h3','Your results');title.id='exam-focus';title.tabIndex=-1;
        panel.append(title,make('p',`${result.percent}% — ${result.score}/${result.total} correct`,'exam-score'),make('p',result.passed?'Practice target met (80%).':'Below the practice target (80%).'),make('p',attempt.reason==='timeout'?'Time expired. Your saved answers were submitted automatically.':'You submitted this attempt.'),make('p',`${result.unanswered} unanswered · SATA graded all-or-nothing · 1 point per question`));
        const retryBox=make('div');retryBox.hidden=true;
        panel.append(button('Retake exam',()=>{retryBox.hidden=false;retryBox.replaceChildren(make('p','Clear this saved result and return to the start screen? The next timer starts when you begin.'),button('Return to start',()=>{ attempt=null; try { localStorage.removeItem(key); } catch {} renderIntro(); }),button('Cancel',()=>{retryBox.hidden=true;},'secondary'));},'secondary'),retryBox);
        app.append(panel,make('h3','Answer review','review-heading'));
        exam.questions.forEach((q,i)=>{
            const detail=make('details','','exam-review');detail.append(make('summary',`${q.id}. ${result.rows[i].correct?'Correct':result.rows[i].answered?'Incorrect':'Unanswered'}`),make('p',q.prompt,'question-prompt'),make('p','Your answer:\n'+answerText(q,attempt.answers[q.id]),'answer-review'),make('p','Answer key:\n'+answerText(q,q.type==='number'?String(q.answer):q.answer),'answer-review'));
            if(attempt.work[q.id])detail.append(make('p','Your scratch work:\n'+attempt.work[q.id],'answer-review'));app.append(detail);
        });
    }
    try {
        const response=await fetch('/resources/nursing-exam/exam.json');if(!response.ok)throw Error('Unable to load exam');exam=await response.json();
        try {
            const saved=JSON.parse(localStorage.getItem(key));
            if(saved && saved.examId===exam.id && Number.isFinite(saved.startedAt) && saved.deadline===saved.startedAt+exam.durationMinutes*60000 && Number.isInteger(saved.index) && saved.index>=0 && saved.index<exam.questions.length && saved.answers && saved.work && (saved.submittedAt===null || Number.isFinite(saved.submittedAt)))attempt=saved;
        } catch { notice.textContent='A saved attempt could not be loaded. You can start a new exam.'; }
        if(attempt) {
            if(attempt.submittedAt!==null)renderResults();
            else if(!checkTime()){renderQuestion();timer=setInterval(checkTime,250);}
        }else renderIntro();
        document.addEventListener('visibilitychange',checkTime);window.addEventListener('focus',checkTime);window.addEventListener('pageshow',checkTime);
        window.addEventListener('storage',event=>{
            if(event.key===key){clearInterval(timer);location.reload();}
        });
    } catch { app.replaceChildren(make('p','The exam could not be loaded. Please refresh to try again.')); }
})();
