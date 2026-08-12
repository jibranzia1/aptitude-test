# Aptitude & Reasoning Test

A self-contained, timed cognitive assessment. 20 multiple-choice questions, each with its own countdown. Scores, section breakdown and full worked solutions appear the moment a person finishes.

No build step, no dependencies, no server. One HTML file.

**Live:** https://jibranzia1.github.io/aptitude-test/

---

## Collecting everyone's results in one place

Out of the box, each person sees their own result and it is stored in their own browser. The **See all results** table therefore only shows tests taken on that same device.

To gather every result into one spreadsheet you own, set up a free Google Apps Script endpoint:

1. Create a new Google Sheet. Name the first tab `Results`.
2. In the Sheet, go to **Extensions -> Apps Script**.
3. Delete whatever is there and paste this:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Results');
  var d = JSON.parse(e.postData.contents);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Name', 'Score', 'Out of', 'Time (sec)', 'Answers']);
  }
  sheet.appendRow([
    new Date(d.when),
    d.name,
    d.score,
    d.total,
    d.time,
    JSON.stringify(d.answers)
  ]);
  return ContentService.createTextOutput('ok');
}
```

4. Click **Deploy -> New deployment**. Choose type **Web app**. Set *Execute as* to **Me**, and *Who has access* to **Anyone**. Click **Deploy** and authorise it.
5. Copy the **Web app URL** it gives you.
6. Open `index.html`, find this line near the bottom, and paste the URL between the quotes:

```javascript
const RESULTS_ENDPOINT = "";
```

7. Commit the change. Every completed test now writes a row into your Sheet automatically.

The Sheet is private to you. Candidates never see it.

---

## Adjusting the test

Everything lives in the `Q` array in `index.html`. Each entry looks like this:

```javascript
{ s:"Section name", t:100, q:"Question text", o:["A","B","C","D"], a:2, w:"Why the answer is what it is" }
```

- `t` is the time limit for that question, in seconds
- `a` is the index of the correct option, counting from 0 (so `2` means the third option)
- `w` is the explanation shown in the review at the end

Scoring bands sit in the `BANDS` array just below the questions.

---

## Notes

- A question left unanswered when its timer expires scores zero and the test moves on.
- There is no going back to a previous question.
- Answers are not shuffled, so if you run the test repeatedly with the same group, change the option order or the questions themselves.
