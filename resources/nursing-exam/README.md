# Nursing practice exam

Open `/resources/nursing-exam/` through a local web server. Resources → Fun Projects links here.

`exam.json` contains the supplied 50 questions and answer key, transcribed without clinical rewriting. Questions 48–50 accept numeric answers in the displayed units. The supplied key awards 1 point per item, no partial SATA credit, with 40/50 as the practice passing target. Numeric responses must match the rounded key (14.8, 0.64, 31); extra decimal places are not silently rounded. Scratch work is optional and ungraded.

The timer starts on Start, lasts 60 minutes, and uses a fixed deadline. Answers, scratch work, current question, deadline, and submitted result persist in localStorage under `dipiazza-nursing-exam-2-v1`. Reloading or backgrounding does not pause time. If the browser is closed or suspended at expiry, the stored answers are graded upon returning; there is no server running in the background. No answers or results are transmitted.

This is a static practice tool, not a secure/proctored assessment: the answer key is in the public JSON and browser state is editable. Change the exam ID and storage key for a materially revised exam so old attempts are not reused.

Previous, Next, and the question selector permit reviewing/skipping. Manual submission asks for confirmation and states the unanswered count; expiry submits immediately. A complete answer review and numeric grade appear only after submission. Retake requires confirmation, clears the saved result, and returns to the start screen.

Validation: `node --test resources/nursing-exam/engine.test.cjs`.
