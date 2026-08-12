# Aptitude & Reasoning Test

A timed cognitive assessment that generates a **fresh 20-question paper for every attempt**, plus a private dashboard showing every candidate's answers.

- **Test:** https://jibranzia1.github.io/aptitude-test/
- **Dashboard:** https://jibranzia1.github.io/aptitude-test/admin.html

---

## Files

| File | What it is |
|---|---|
| `index.html` | The test candidates sit |
| `admin.html` | Your private results dashboard |
| `engine.js` | The question generators, shared by both |

---

## How it works

- **A unique paper every time.** 26 generators across 4 sections build each question from random parameters and compute the answer, the distractors and the worked explanation together, so the solution always matches what was asked.
- **Papers rebuild from a seed.** Each paper is a pure function of one random number. Storing that number lets the dashboard reconstruct exactly what a candidate saw, without shipping 20 questions of text to the server.
- **Per-question countdown** of 80 to 130 seconds, about 34 minutes total, on wall-clock time so background tabs gain nothing.
- **Tab-switch penalty.** Leaving the tab or window costs 1 point each time, warned live and recorded with the result.
- **Email verification** ties each attempt to a verified company mailbox and can limit one attempt per address.

---

## Setup: verification, results and the dashboard

All three run off one free Google Apps Script that you own. About five minutes.

### 1. Create a Google Sheet

A blank one is fine. The script creates the tabs it needs.

### 2. Add the script

**Extensions -> Apps Script**, delete everything, paste this, and change `ADMIN_KEY` to a password only you know:

```javascript
const ALLOWED_DOMAIN   = 'firstmfg.com';
const ADMIN_KEY        = 'change-this-to-something-long';
const ONE_ATTEMPT_ONLY = true;   // false to allow retakes
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
function resultsTab() { return tab('Results', ['Timestamp','Email','Score','Out of','Correct',
                                               'Penalty','Tab switches','Time (sec)','Seed','Answers','Times']); }

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
    if (email.slice(-(ALLOWED_DOMAIN.length + 1)) !== '@' + ALLOWED_DOMAIN) {
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
      Number(p.score), Number(p.total), Number(p.raw), Number(p.penalty),
      Number(p.switches), Number(p.time),
      String(p.seed), String(p.ans), String(p.times)
    ]);
    return { ok: true };
  }

  if (p.action === 'admin') {
    if (String(p.key) !== ADMIN_KEY) return { ok: false, error: 'Wrong key.' };
    const data = resultsTab().getDataRange().getValues();
    const out = [];
    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      out.push({
        id: i, when: new Date(r[0]).toISOString(), email: r[1],
        score: r[2], total: r[3], raw: r[4], penalty: r[5],
        switches: r[6], time: r[7], seed: r[8], ans: r[9], times: r[10]
      });
    }
    return { ok: true, rows: out };
  }

  return { ok: false, error: 'Unknown action.' };
}
```

### 3. Deploy

**Deploy -> New deployment -> Web app.** *Execute as* **Me**, *Who has access* **Anyone**. Deploy, authorise, copy the **Web app URL**.

"Anyone" sounds alarming but is required for a browser to call it. Reading results still needs your admin key, and sending a code only ever emails the address that asked for it.

### 4. Paste the URL into both files

In `index.html`:

```javascript
const VERIFY_ENDPOINT = "";   // <- the Web app URL
```

In `admin.html`:

```javascript
const ENDPOINT = "";          // <- the same URL
```

Commit both. Done.

**Do not put the admin key in either file.** You type it into the dashboard each time. The files are public; the key is not.

---

## The dashboard

Open `admin.html`, enter your admin key, and you get:

- **Summary:** how many have sat it, average score, highest, and how many left the tab.
- **Sortable table** of every candidate with score, raw correct, rating band and tab-switch count. Click any column header to sort.
- **Click a row** to rebuild that candidate's exact paper and see, for all 20 questions: the question as they saw it, all four options with their answer and the correct one marked, whether they got it right, how long they took against the limit, and the worked solution. Plus a section breakdown with percentages.
- **Download CSV** for anything you want to keep or share.

The URL is not linked from the test and carries a `noindex` tag, but it is still a public URL: security comes from the admin key, not obscurity. Pick a long one.

---

## Rating bands

| Score | Rating |
|---|---|
| 17-20 | Exceptional |
| 13-16 | Strong |
| 9-12 | Average |
| 5-8 | Below bar |
| 0-4 | Weak |

Edit `BANDS` in `engine.js` to change them.

---

## What the tab-switch detection can and cannot do

It fires on `visibilitychange` and `blur`, catching tab switches, window switches, minimising and alt-tabbing. It **cannot** see a second device, a phone beside the keyboard, or a second monitor. Treat the count as a signal worth asking about, not proof.

A system notification stealing focus also counts. Set `SWITCH_PENALTY = 0` in `index.html` to keep the count visible without penalising the score.

---

## Adjusting the test

**Section mix** is `PLAN` in `engine.js`:

```javascript
const PLAN = [["Numerical & pattern",NUM,5],["Logical deduction",LOG,6],
              ["Probability & quantitative",QUANT,4],["Lateral & verbal",LAT,5]];
```

**Adding a generator:** write a function returning `mk(section, seconds, questionHtml, correctAnswer, [wrongAnswers], explanation)` and push it into the relevant array. `mk` shuffles the options, drops duplicate or empty distractors, and returns `null` if it cannot make four distinct choices, so bad parameters fail safely.

**Careful:** changing `engine.js` changes what old seeds rebuild into. Past results stay valid as scores, but the dashboard would then show the wrong paper for tests taken before the change. Export a CSV before editing the engine if you have results worth keeping.

---

## Notes

- Unanswered when the timer expires scores zero and moves on.
- No going back to a previous question.
- Final score is correct answers minus tab-switch penalty, floored at zero. The raw count is kept separately.
- Apps Script on a free Google account sends 100 emails a day.
