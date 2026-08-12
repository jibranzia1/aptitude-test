# Aptitude & Reasoning Test

A timed cognitive assessment that generates a **fresh 20-question paper for every attempt**. No two candidates get the same test, and nobody gets the same test twice.

**Live:** https://jibranzia1.github.io/aptitude-test/

One HTML file. No build step, no dependencies, no server required.

---

## What it does

- **Unique paper every time.** 26 question generators across 4 sections build the paper at run time from random parameters. Numbers, names, letters, rules and answer positions all change. The worked solution is generated alongside each question, so the explanations always match.
- **Per-question countdown.** 80 to 130 seconds depending on difficulty, roughly 34 minutes total. Timers run on wall-clock time, so a background tab does not slow them down.
- **Tab-switch penalty.** Leaving the tab or window costs 1 point each time. The candidate sees a running warning; the count is recorded with the result.
- **Instant marking.** Score, band, section breakdown, and a full worked solution for all 20 questions.
- **Optional email verification.** Ties each attempt to a verified company mailbox and can limit each address to one attempt.

---

## Turning on email verification and central results

Without this, the test runs with a plain name field and results stay in each person's own browser. With it, candidates must verify a company email address before starting, and every result lands in a spreadsheet you own.

### 1. Create the sheet

Make a new Google Sheet. The script creates the tabs it needs on first use.

### 2. Add the script

In the Sheet, go to **Extensions -> Apps Script**, delete everything, and paste this:

```javascript
const ALLOWED_DOMAIN   = 'firstmfg.com';
const ONE_ATTEMPT_ONLY = true;   // set false to allow retakes
const CODE_MINUTES     = 15;

function doGet(e) {
  const cb = e.parameter.callback || 'callback';
  let out;
  try { out = handle(e.parameter); }
  catch (err) { out = { ok: false, error: String(err) }; }
  return ContentService
    .createTextOutput(cb + '(' + JSON.stringify(out) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function tab(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); }
  return sh;
}
function codesTab()   { return tab('Codes',   ['Email','Code','Token','Expires','Used']); }
function resultsTab() { return tab('Results', ['Timestamp','Email','Score','Out of','Correct','Penalty','Tab switches','Time (sec)']); }

function hasCompleted(email) {
  const rows = resultsTab().getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).toLowerCase() === email) return true;
  }
  return false;
}

function handle(p) {
  const email = String(p.email || '').toLowerCase().trim();

  if (p.action === 'send') {
    if (email.indexOf('@' + ALLOWED_DOMAIN) !== email.length - ALLOWED_DOMAIN.length - 1 || email.length < 5) {
      return { ok: false, error: 'Use your @' + ALLOWED_DOMAIN + ' address.' };
    }
    if (ONE_ATTEMPT_ONLY && hasCompleted(email)) {
      return { ok: false, error: 'This address has already completed the test.' };
    }
    const code  = String(Math.floor(100000 + Math.random() * 900000));
    const token = Utilities.getUuid();
    codesTab().appendRow([email, code, token, new Date(Date.now() + CODE_MINUTES * 60000), 'no']);
    MailApp.sendEmail(email, 'Your aptitude test code',
      'Your one-time code is ' + code + '\n\n' +
      'It expires in ' + CODE_MINUTES + ' minutes. If you did not request this, ignore this email.');
    return { ok: true };
  }

  if (p.action === 'verify') {
    const sh = codesTab(), rows = sh.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]).toLowerCase() === email &&
          String(rows[i][1]) === String(p.code).trim() &&
          String(rows[i][4]) === 'no' &&
          new Date(rows[i][3]) > new Date()) {
        sh.getRange(i + 1, 5).setValue('yes');
        return { ok: true, token: rows[i][2], name: email.split('@')[0] };
      }
    }
    return { ok: false, error: 'That code is wrong or has expired.' };
  }

  if (p.action === 'submit') {
    const rows = codesTab().getDataRange().getValues();
    let valid = false;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase() === email && String(rows[i][2]) === String(p.token)) valid = true;
    }
    if (!valid) return { ok: false, error: 'Session not recognised.' };
    resultsTab().appendRow([
      new Date(), email,
      Number(p.score), Number(p.total), Number(p.raw),
      Number(p.penalty), Number(p.switches), Number(p.time)
    ]);
    return { ok: true };
  }

  return { ok: false, error: 'Unknown action.' };
}
```

### 3. Deploy it

**Deploy -> New deployment -> Web app.** Set *Execute as* to **Me** and *Who has access* to **Anyone**. Deploy, authorise it, and copy the **Web app URL**.

### 4. Point the test at it

Open `index.html` and edit these lines near the top of the script block:

```javascript
const VERIFY_ENDPOINT = "";              // paste the Web app URL here
const ALLOWED_DOMAIN  = "firstmfg.com";
const SWITCH_PENALTY  = 1;               // points lost per tab switch
```

Commit. Verification is now live and every result writes a row to the `Results` tab.

**Note on limits:** a free Google account sends 100 emails a day through Apps Script, which is plenty for a team but not for mass recruiting.

---

## What the tab-switch detection can and cannot do

It fires on `visibilitychange` and `blur`, so it catches switching tabs, switching windows, minimising, and alt-tabbing to another app. It **cannot** see a second device, a phone beside the keyboard, or a second monitor. Treat the switch count as a signal worth asking about, not proof of anything.

False positives are possible: a system notification stealing focus counts as a switch. Setting `SWITCH_PENALTY = 0` keeps the count visible in the results while removing the score penalty.

---

## Adjusting the test

**Section mix** is set by `PLAN` near the middle of the script:

```javascript
const PLAN = [["Numerical & pattern",NUM,5],["Logical deduction",LOG,6],
              ["Probability & quantitative",QUANT,4],["Lateral & verbal",LAT,5]];
```

Change the counts to reweight the paper. The totals must add up to the number of questions you want.

**Adding a generator:** write a function that returns `mk(section, seconds, questionHtml, correctAnswer, [wrongAnswers], explanation)` and push it into the relevant array. `mk` shuffles the options, removes duplicate or empty distractors, and returns `null` if it cannot build four distinct choices, so returning bad parameters is safe.

**Scoring bands** sit in the `BANDS` array.

---

## Notes

- A question left unanswered when its timer expires scores zero and the test moves on.
- There is no going back to a previous question.
- The final score is `correct answers minus tab-switch penalty`, floored at zero. The raw count is shown separately.
