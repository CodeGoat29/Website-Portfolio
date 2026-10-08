# Nursing practice exam

Open `/resources/nursing-exam/` through a local web server. Resources → Fun Projects links here.

`exam.json` contains the supplied 50 questions and answer key, transcribed without clinical rewriting. Questions 48–50 accept numeric answers in the displayed units. The supplied key awards 1 point per item, no partial SATA credit, with 40/50 as the practice passing target. Numeric responses must match the rounded key (14.8, 0.64, 31); extra decimal places are not silently rounded. Scratch work is optional and ungraded.

There is no timer or automatic submission. Answers, scratch work, current question, and submitted result persist in localStorage under `dipiazza-nursing-exam-2-v1`. Existing unfinished timed attempts retain their answers and resume without a deadline. Previously submitted results remain available. No answers or results are transmitted.

This is a static practice tool, not a secure/proctored assessment: the answer key is in the public JSON and browser state is editable. Change the exam ID and storage key for a materially revised exam so old attempts are not reused.

Previous, Next, and the question selector permit reviewing/skipping. Early submission asks for confirmation and states the unanswered count; Finish exam on the last question submits immediately. A complete answer review and numeric grade appear only after submission. Retake immediately replaces the saved result with a fresh untimed attempt at question one.

Validation: `node --test resources/nursing-exam/engine.test.cjs`.
