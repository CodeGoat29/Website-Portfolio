(function (root) {
    'use strict';
    const answered = value => Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim() !== '';
    function correct(question, value) {
        if (!answered(value)) return false;
        if (question.type === 'number') {
            const raw = value.trim();
            return /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw) && Math.abs(Number(raw) - question.answer) < 1e-9;
        }
        return Array.isArray(value) && [...new Set(value)].sort().join(',') === [...question.answer].sort().join(',');
    }
    function grade(exam, attempt) {
        const rows = exam.questions.map(q => ({ id: q.id, correct: correct(q, attempt.answers[q.id]), answered: answered(attempt.answers[q.id]) }));
        const score = rows.filter(r => r.correct).length;
        return { score, total: rows.length, percent: Math.round(score / rows.length * 100), passed: score >= exam.passingScore, unanswered: rows.filter(r => !r.answered).length, rows };
    }
    function create(exam, now = Date.now()) {
        return { examId: exam.id, startedAt: now, index: 0, answers: {}, work: {}, submittedAt: null, reason: null };
    }
    const api = { answered, correct, grade, create };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.NursingExam = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
