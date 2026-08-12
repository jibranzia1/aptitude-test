/* Aptitude test - complete Apps Script backend.
   Paste this whole file into the Apps Script editor, replacing everything.
   Change ADMIN_KEY below, then Deploy > Manage deployments > pencil > New version.
   The question engine lives here so the browser never sees the answers.
   Paper mix: 30% easy, 40% medium, 30% hard, no question family more than twice. */

/* Shared question engine. Loaded by both index.html (the test) and
   admin.html (the dashboard). A paper is a pure function of its seed, so
   storing the seed is enough to rebuild exactly what a candidate saw. */

function mulberry(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let RND = Math.random;
const ri = (a,b) => a + Math.floor(RND()*(b-a+1));
const pick = arr => arr[Math.floor(RND()*arr.length)];
function shuffle(a){ const x=a.slice(); for(let i=x.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[x[i],x[j]]=[x[j],x[i]];} return x; }
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function mk(section, time, stem, correct, wrongs, why){
  const uniq = [];
  for (const w of wrongs){
    const s = String(w);
    if (s === "undefined" || s === "null" || s === "NaN" || s === "") continue;
    if (s !== String(correct) && !uniq.includes(s)) uniq.push(s);
    if (uniq.length === 3) break;
  }
  if (uniq.length < 3) return null;
  const opts = shuffle([String(correct), ...uniq]);
  return { s:section, t:time, q:stem, o:opts, a:opts.indexOf(String(correct)), w:why };
}

/* ============ NUMERICAL & PATTERN ============ */
const NUM = [
function polySeries(){
  const k = ri(1,3), form = ri(0,2);
  const f = n => form===0 ? n*n*n + k*n*n : form===1 ? n*n*n + k*n : n*n*n - k*n*n;
  const desc = form===0 ? `n\u00B3 + ${k}n\u00B2` : form===1 ? `n\u00B3 + ${k}n` : `n\u00B3 \u2212 ${k}n\u00B2`;
  const t = [1,2,3,4,5].map(f), ans = f(6);
  return mk("Numerical & pattern", 100,
    `What comes next? &nbsp;<span class="seq">${t.join(", ")}, ___</span>`,
    ans, [ans+ri(6,20), ans-ri(6,20), t[4]+(t[4]-t[3]), ans+ri(21,40)],
    `Each term is ${desc}. The sixth term is ${ans}.`);
},
function lookSay(){
  const start = String(ri(1,3));
  let seq = [start];
  const next = s => { let o="",i=0; while(i<s.length){let j=i; while(j<s.length&&s[j]===s[i])j++; o+=(j-i)+s[i]; i=j;} return o; };
  for (let i=0;i<4;i++) seq.push(next(seq[seq.length-1]));
  const ans = next(seq[seq.length-1]);
  const scramble = s => s.split("").sort(()=>RND()-0.5).join("");
  return mk("Numerical & pattern", 120,
    `What comes next? &nbsp;<span class="seq">${seq.join(", ")}, ___</span>`,
    ans, [scramble(ans), scramble(ans), next(ans), seq[seq.length-1]+start],
    `Look-and-say: each term reads the previous one aloud, digit group by digit group. Reading ${seq[seq.length-1]} gives ${ans}.`);
},
function letterSeries(){
  const start = ri(0,4), g0 = ri(1,3);
  const pos = [start]; let g = g0;
  for (let i=0;i<5;i++){ pos.push(pos[pos.length-1]+g); g++; }
  if (pos[5] > 23) return null;
  const shown = pos.slice(0,5).map(p=>LETTERS[p]), ans = LETTERS[pos[5]];
  return mk("Numerical & pattern", 90,
    `Which letter continues the series? &nbsp;<span class="seq">${shown.join(", ")}, ___</span>`,
    ans, [LETTERS[pos[5]-1], LETTERS[pos[5]+1], LETTERS[pos[5]-2], LETTERS[pos[5]+2]],
    `The gaps grow by one each step: +${g0}, +${g0+1}, +${g0+2}, +${g0+3}, +${g0+4}. Alphabet positions ${pos.map(p=>p+1).join(", ")} give ${ans}.`);
},
function pctRecover(){
  const d = pick([20,25,30,40,50,60,75,80]);
  const rise = Math.round((d/(100-d))*1000)/10;
  const fmt = v => (Math.round(v*10)/10) + "%";
  return mk("Numerical & pattern", 90,
    `Revenue fell by ${d}% in Year 1. By what percentage must it rise in Year 2 to get back to the original level?`,
    fmt(rise), [fmt(d), fmt(d+10), fmt(100-d), fmt(Math.round(rise/2*10)/10)],
    `100 falls to ${100-d}. Rising from ${100-d} back to 100 is a gain of ${d} on a base of ${100-d}, which is ${fmt(rise)}.`);
},
function machineRate(){
  const per = pick([0.25,0.5,1,1.5,2]);
  const m1 = ri(3,6), t1 = ri(4,10), u1 = per*m1*t1;
  if (u1 % 1 !== 0) return null;
  const m2 = ri(2,10), t2 = ri(3,12), u2 = per*m2*t2;
  if (u2 % 1 !== 0 || m2 === m1) return null;
  return mk("Numerical & pattern", 100,
    `If ${m1} machines produce ${u1} units in ${t1} minutes, how long will ${m2} machines take to produce ${u2} units?`,
    `${t2} minutes`,
    [`${t1} minutes`, `${t2+ri(2,5)} minutes`, `${Math.max(1,t2-ri(2,5))} minutes`, `${t2*2} minutes`],
    `One machine makes ${per} units per minute, so ${m2} machines make ${per*m2} per minute. ${u2} \u00F7 ${per*m2} = ${t2} minutes.`);
},
function altSeries(){
  const a = ri(2,4), b = ri(1,9), start = ri(1,6);
  const t = [start];
  for (let i=0;i<4;i++) t.push(t[t.length-1]*a + b);
  const ans = t[4]*a + b;
  return mk("Numerical & pattern", 100,
    `What comes next? &nbsp;<span class="seq">${t.join(", ")}, ___</span>`,
    ans, [t[4]*a, ans+b, ans-b, t[4]+(t[4]-t[3])],
    `Each term is the previous one multiplied by ${a}, then ${b} added. ${t[4]} \u00D7 ${a} + ${b} = ${ans}.`);
}];

/* ============ LOGICAL DEDUCTION ============ */
const NONSENSE = ["Bloops","Razzies","Lazzies","Grints","Fenns","Morvs","Tuvers","Plinks","Quorls","Snells"];
const LOG = [
function setOverlap(){
  const N = pick([80,100,120,150,200]);
  const a = Math.round(N*pick([0.6,0.65,0.7,0.75])), b = Math.round(N*pick([0.7,0.8,0.85,0.9]));
  const ans = a + b - N;
  if (ans <= 0 || a > N || b > N) return null;
  const c = shuffle(["tea","coffee"]);
  return mk("Logical deduction", 100,
    `In a group of ${N} people, ${a} drink ${c[0]} and ${b} drink ${c[1]}. Everyone drinks at least one. What is the smallest possible number who drink both?`,
    ans, [N-a, N-b, Math.min(a,b), ans+ri(5,20)],
    `${a} + ${b} = ${a+b} preferences spread over ${N} people, so at least ${a+b} \u2212 ${N} = ${ans} people must have been counted twice.`);
},
function liars(){
  const p = shuffle(["X","Y","P","Q","M","N"]), X = p[0], Y = p[1];
  if (ri(0,1) === 0){
    return mk("Logical deduction", 120,
      `You meet two people, ${X} and ${Y}. Each one either always tells the truth or always lies. ${X} says: \u201CAt least one of us is a liar.\u201D What must be true?`,
      `${X} tells the truth and ${Y} lies`,
      [`Both are liars`, `${X} lies and ${Y} tells the truth`, `Both tell the truth`, `It cannot be determined`],
      `If ${X} were a liar, the statement would be true, and liars cannot say true things. So ${X} is truthful, the statement holds, and the liar must be ${Y}.`);
  }
  return mk("Logical deduction", 120,
    `You meet two people, ${X} and ${Y}. Each one either always tells the truth or always lies. ${X} says: \u201CWe are both liars.\u201D What must be true?`,
    `${X} lies and ${Y} tells the truth`,
    [`Both are liars`, `${X} tells the truth and ${Y} lies`, `Both tell the truth`, `It cannot be determined`],
    `A truth-teller could never call himself a liar, so ${X} lies. His statement is therefore false, meaning they are not both liars, so ${Y} tells the truth.`);
},
function wason(){
  const vowelRule = RND() < 0.5;
  const vowel = pick(["A","E","I","O","U"]), cons = pick(["K","M","T","B","R"]);
  const even = pick([2,4,6,8]), odd = pick([3,5,7,9]);
  const cards = shuffle([vowel, cons, String(even), String(odd)]);
  const rule = vowelRule
    ? `if a card has a vowel on one side, it has an even number on the other`
    : `if a card has a consonant on one side, it has an odd number on the other`;
  const need = vowelRule ? [vowel, odd] : [cons, even];
  const other = vowelRule ? [cons, even] : [vowel, odd];
  return mk("Logical deduction", 130,
    `Four cards lie on a table showing <span class="seq">${cards.join(", ")}</span>. Every card has a letter on one side and a number on the other. The rule: <em>${rule}</em>. Which cards must you turn over to test it?`,
    `${need[0]} and ${need[1]}`,
    [`${need[0]} and ${other[1]}`, `${need[0]}, ${other[0]} and ${other[1]}`, `${other[1]} and ${need[1]}`, `${other[0]} and ${need[1]}`],
    `Turn ${need[0]} to check the rule holds for it. Turn ${need[1]} because a rule-breaking letter could be hiding behind it. Turning ${other[1]} proves nothing, since the rule never says what must be on the back of ${other[1]}.`);
},
function syllogism(){
  const n = shuffle(NONSENSE), A = n[0], B = n[1], C = n[2];
  const adj = pick(["quick","green","noisy","hollow","brittle"]);
  return mk("Logical deduction", 100,
    `All ${A} are ${B}. All ${B} are ${C}. Some ${C} are ${adj}. Which statement must be true?`,
    `All ${A} are ${C}`,
    [`Some ${A} are ${adj}`, `All ${C} are ${A}`, `No ${B} are ${adj}`, `Some ${B} are not ${C}`],
    `${A} \u2192 ${B} \u2192 ${C} holds by transitivity. Nothing links \u201C${adj}\u201D back down to ${A}, so that cannot be concluded.`);
},
function queue(){
  const f = ri(5,12), b = ri(6,15), leave = ri(1,4), join = ri(1,5);
  const total = f + b - 1, ans = total - leave + join;
  const who = pick(["Zia","Amir","Sara","Bilal","Hina","Omar"]);
  return mk("Logical deduction", 100,
    `${who} is ${f}th from the front of a queue and ${b}th from the back. ${leave} people ahead leave, and ${join} new people join at the back. How many are in the queue now?`,
    ans, [total, total+join, ans+1, ans-1, f+b],
    `The queue starts at ${f} + ${b} \u2212 1 = ${total}, since ${who} is counted from both ends. Then ${total} \u2212 ${leave} + ${join} = ${ans}.`);
},
function falsify(){
  const sets = [
    ["missed the deadline","was on the night shift","met the deadline","was on the day shift"],
    ["returned an order","paid by card","kept the order","paid in cash"],
    ["failed inspection","came off line B","passed inspection","came off line A"],
    ["cancelled the plan","joined this year","kept the plan","joined earlier"]
  ];
  const s = pick(sets), bad = s[0], cond = s[1], good = s[2], notCond = s[3];
  return mk("Logical deduction", 110,
    `Someone claims: \u201CEvery person who ${bad} ${cond}.\u201D Which single piece of evidence would disprove it?`,
    `Someone who ${bad} and ${notCond}`,
    [`Someone who ${good} and ${cond}`, `Someone who ${good} and ${notCond}`, `Someone who ${bad} and ${cond}`, `No single case can disprove it`],
    `The claim forbids exactly one combination: ${bad} while it is not true that they ${cond}. Every other case sits comfortably with the claim, so only that one breaks it.`);
},
function ordering(){
  const names = shuffle(["Amir","Bilal","Chand","Dawood","Erum"]).slice(0,4);
  const p1=names[0], p2=names[1], p3=names[2], p4=names[3];
  const askIdx = ri(1,2), ans = names[askIdx];
  const ord = ["tallest","second tallest","third tallest","shortest"][askIdx];
  const clues = shuffle([
    `${p1} is taller than ${p2}`,
    `${p3} is shorter than ${p2}`,
    `${p4} is shorter than ${p3}`
  ]);
  return mk("Logical deduction", 110,
    `${clues.join(". ")}. Who is the ${ord}?`,
    ans, names.filter(n=>n!==ans),
    `The clues chain into ${p1} > ${p2} > ${p3} > ${p4}, so the ${ord} is ${ans}.`);
}];

/* ============ PROBABILITY & QUANTITATIVE ============ */
function gcd(a,b){ return b ? gcd(b,a%b) : a; }
function frac(n,d){ const g = gcd(n,d); return `${n/g}/${d/g}`; }
const QUANT = [
function sameColour(){
  const r = ri(2,6), b = ri(3,7);
  const n = r+b, tot = n*(n-1)/2, same = r*(r-1)/2 + b*(b-1)/2;
  const c = shuffle(["red","blue","green","black"]);
  return mk("Probability & quantitative", 110,
    `A bag holds ${r} ${c[0]} and ${b} ${c[1]} marbles. Two are drawn without replacement. What is the probability that both are the same colour?`,
    frac(same,tot),
    [frac(tot-same,tot), frac(r*(r-1)/2,tot), frac(b*(b-1)/2,tot), frac(same,tot+ri(1,4))],
    `Same colour = (${r}C2 + ${b}C2) \u00F7 ${n}C2 = (${r*(r-1)/2} + ${b*(b-1)/2}) \u00F7 ${tot} = ${frac(same,tot)}.`);
},
function paintedCube(){
  const n = ri(3,6), kind = ri(0,3);
  const vals = [12*(n-2), 6*(n-2)*(n-2), 8, (n-2)*(n-2)*(n-2)];
  const labels = ["exactly two painted faces","exactly one painted face","exactly three painted faces","no painted faces at all"];
  const reason = ["edge cubes excluding the corners: 12 edges \u00D7 (n \u2212 2)",
                  "face-centre cubes: 6 faces \u00D7 (n \u2212 2)\u00B2",
                  "the 8 corner cubes, whatever the size of the cube",
                  "the fully hidden inner block: (n \u2212 2)\u00B3"][kind];
  const ans = vals[kind];
  const wrong = vals.filter((_,i)=>i!==kind).concat([ans+ri(2,8), Math.max(1,ans-ri(2,8))]);
  return mk("Probability & quantitative", 120,
    `A ${n}\u00D7${n}\u00D7${n} cube is painted on all six outer faces, then cut into ${n*n*n} unit cubes. How many unit cubes have ${labels[kind]}?`,
    ans, wrong,
    `${labels[kind].charAt(0).toUpperCase()+labels[kind].slice(1)} means ${reason}. With n = ${n} that gives ${ans}.`);
},
function clockAngle(){
  const h = ri(1,12), m = pick([5,10,15,20,25,35,40,45,50,55]);
  let ang = Math.abs(30*(h%12) - 5.5*m);
  if (ang > 180) ang = 360 - ang;
  if (ang % 1 !== 0) return null;
  return mk("Probability & quantitative", 110,
    `What is the angle between the hour and minute hands at exactly ${h}:${String(m).padStart(2,"0")}?`,
    `${ang} degrees`,
    [`${ang+5} degrees`, `${Math.max(0,ang-5)} degrees`, `${ang+10} degrees`, `${Math.max(0,ang-10)} degrees`, `${(ang+30)%360} degrees`],
    `Hour hand: (${h%12} \u00D7 30) + (${m} \u00D7 0.5) = ${30*(h%12)+0.5*m} degrees from twelve. Minute hand: ${m} \u00D7 6 = ${6*m} degrees. The gap between them is ${ang} degrees.`);
},
function diceSum(){
  const target = ri(4,10);
  let c = 0; for(let i=1;i<=6;i++) for(let j=1;j<=6;j++) if (i+j===target) c++;
  return mk("Probability & quantitative", 100,
    `Two fair six-sided dice are rolled. What is the probability that the total is exactly ${target}?`,
    frac(c,36),
    [frac(c+1,36), frac(Math.max(1,c-1),36), frac(c,30), frac(6,36)],
    `There are ${c} ways to make ${target} out of 36 equally likely outcomes, which is ${frac(c,36)}.`);
},
function workRate(){
  const p1 = ri(2,5), h1 = ri(3,8), w1 = ri(2,6);
  const p2 = ri(2,8), w2 = ri(3,12);
  const h2 = (w2 * p1 * h1) / (w1 * p2);
  if (h2 % 1 !== 0 || h2 < 1 || h2 > 60 || (p2===p1 && w2===w1)) return null;
  return mk("Probability & quantitative", 110,
    `If ${p1} painters take ${h1} hours to paint ${w1} walls, how long will ${p2} painters take to paint ${w2} walls?`,
    `${h2} hours`,
    [`${h2+ri(1,4)} hours`, `${Math.max(1,h2-ri(1,4))} hours`, `${h1} hours`, `${h2*2} hours`],
    `Total effort scales with painters \u00D7 hours. ${p1} \u00D7 ${h1} painter-hours give ${w1} walls, so ${w2} walls need ${w2*p1*h1/w1} painter-hours. Split across ${p2} painters that is ${h2} hours.`);
},
function pctChain(){
  const a = pick([10,20,25,30,40,50]), b = pick([10,20,25,30,40,50]);
  const net = Math.round(((1+a/100)*(1-b/100) - 1)*1000)/10;
  if (net === 0) return null;
  const f = v => (v>0?"+":"") + (Math.round(v*10)/10) + "%";
  return mk("Probability & quantitative", 100,
    `A price rises by ${a}%, then falls by ${b}%. What is the net change from the starting price?`,
    f(net), [f(a-b), f(0), f(-net), f(net+5), f(net-5)],
    `Multiply, do not add: ${(1+a/100).toFixed(2)} \u00D7 ${(1-b/100).toFixed(2)} = ${((1+a/100)*(1-b/100)).toFixed(4)}, a net change of ${f(net)}.`);
}];

/* ============ LATERAL & VERBAL ============ */
const ANALOGIES = [
  ["EPHEMERAL","PERMANENCE","OPAQUE","Transparency",["Density","Darkness","Thickness"]],
  ["ARID","MOISTURE","STERILE","Fertility",["Cleanliness","Silence","Purity"]],
  ["MUTE","SPEECH","BLIND","Sight",["Darkness","Hearing","Ignorance"]],
  ["VACUUM","MATTER","SILENCE","Sound",["Peace","Emptiness","Stillness"]],
  ["NOVICE","EXPERTISE","PAUPER","Wealth",["Poverty","Charity","Humility"]],
  ["ANARCHY","ORDER","APATHY","Concern",["Chaos","Laziness","Calm"]],
  ["TRANSPARENT","CONCEAL","POROUS","Retain",["Absorb","Leak","Filter"]],
  ["DROUGHT","RAIN","FAMINE","Food",["Hunger","Poverty","Disease"]]
];
const LAT = [
function ropes(){
  const target = pick([45,75]);
  const right = {
    45: "Light rope 1 at both ends and rope 2 at one end; when rope 1 finishes, light rope 2's other end",
    75: "Burn rope 1 from one end; the moment it finishes, light rope 2 at both ends"
  };
  const why = {
    45: "Rope 1 lit at both ends is gone in 30 minutes. At that moment rope 2 has 30 minutes of burn left, and lighting its second end halves that to 15. 30 + 15 = 45.",
    75: "Rope 1 burnt end to end takes the full 60 minutes. Rope 2 then lit at both ends takes 30 \u00F7 2 = 15 more. 60 + 15 = 75."
  };
  return mk("Lateral & verbal", 130,
    `Two ropes each burn for exactly 60 minutes, but unevenly along their length, so half a rope is not half an hour. With only these ropes and a lighter, how do you measure exactly ${target} minutes?`,
    right[target],
    ["Cut one rope in half and burn both halves",
     "Light both ropes at one end at the same time",
     "Light both ropes at both ends at the same time",
     "It cannot be done with only two ropes"],
    why[target]);
},
function oddOneOut(){
  const kind = ri(0,2);
  if (kind === 0){
    const cubes = shuffle([8,27,64,125,216,343]).slice(0,4);
    const sq = pick([100,144,196,225]);
    const set = shuffle(cubes.concat([sq]));
    return mk("Lateral & verbal", 80,
      `Which is the odd one out? &nbsp;<span class="seq">${set.join(", ")}</span>`,
      sq, cubes,
      `Every other number is a perfect cube. ${sq} is a perfect square but not a cube.`);
  }
  if (kind === 1){
    const primes = shuffle([11,13,17,19,23,29,31,37]).slice(0,4);
    const comp = pick([21,27,33,39,49,51]);
    const set = shuffle(primes.concat([comp]));
    return mk("Lateral & verbal", 80,
      `Which is the odd one out? &nbsp;<span class="seq">${set.join(", ")}</span>`,
      comp, primes,
      `Every other number is prime. ${comp} is composite.`);
  }
  const pows = shuffle([16,32,64,128,256]).slice(0,4);
  const odd = pick([48,96,144,192]);
  const set = shuffle(pows.concat([odd]));
  return mk("Lateral & verbal", 80,
    `Which is the odd one out? &nbsp;<span class="seq">${set.join(", ")}</span>`,
    odd, pows,
    `Every other number is a power of 2. ${odd} is not.`);
},
function analogy(){
  const A = pick(ANALOGIES);
  return mk("Lateral & verbal", 80,
    `${A[0]} is to ${A[1]} as ${A[2]} is to:`,
    A[3], A[4],
    `The pairing is a quality and the thing it lacks: ${A[0].toLowerCase()} lacks ${A[1].toLowerCase()}, and ${A[2].toLowerCase()} lacks ${A[3].toLowerCase()}.`);
},
function doubling(){
  const day = ri(20,60), back = ri(1,3);
  const part = ["half","a quarter","an eighth"][back-1];
  const ans = day - back;
  return mk("Lateral & verbal", 80,
    `A patch of lily pads doubles in size every day. It covers the whole lake on day ${day}. On which day did it cover ${part} of the lake?`,
    `Day ${ans}`,
    [`Day ${Math.round(day/2)}`, `Day ${day-back-1}`, `Day ${day-back+1}`, `Day ${Math.round(day/(back+1))}`],
    `Run the doubling backwards ${back} step${back>1?"s":""}: the patch halves each day you go back, so ${part} of the lake was covered on day ${ans}.`);
},
function costTrap(){
  const diff = pick([100,200,500,1000]);
  const small = ri(3,40), total = 2*small + diff;
  const pair = pick([["jacket","belt"],["laptop","case"],["camera","strap"],["bike","helmet"]]);
  return mk("Lateral & verbal", 90,
    `A ${pair[0]} and a ${pair[1]} cost ${total} dollars together. The ${pair[0]} costs ${diff} dollars more than the ${pair[1]}. What does the ${pair[1]} cost?`,
    `${small} dollars`,
    [`${total-diff} dollars`, `${Math.round(total/2)} dollars`, `${small+diff} dollars`, `${small*2} dollars`],
    `Let the ${pair[1]} be x. Then x + (x + ${diff}) = ${total}, so 2x = ${total-diff} and x = ${small}. The instinctive answer of ${total-diff} would make the pair cost ${(total-diff)*2+diff}, not ${total}.`);
},
function socks(){
  const colours = ri(3,6), need = ri(2,3);
  const ans = colours*(need-1) + 1;
  const names = shuffle(["black","white","grey","navy","brown","green"]).slice(0,colours);
  return mk("Lateral & verbal", 90,
    `A drawer holds plenty of socks in ${colours} colours (${names.join(", ")}), all jumbled together. In complete darkness, how many socks must you take out to be certain of ${need===2?"a matching pair":"three socks of the same colour"}?`,
    ans, [colours, colours+need, ans+1, ans-1, colours*need],
    `In the worst case you draw ${need-1} of every colour first, which is ${colours*(need-1)} socks, and the very next one must complete the set. ${colours*(need-1)} + 1 = ${ans}.`);
},
function handshakes(){
  const n = ri(6,15), ans = n*(n-1)/2;
  return mk("Lateral & verbal", 90,
    `${n} people attend a meeting and every person shakes hands with every other person exactly once. How many handshakes take place?`,
    ans, [n*n, n*(n-1), ans+n, ans-n, n*2],
    `Each of the ${n} people shakes ${n-1} hands, but that counts every handshake twice. ${n} \u00D7 ${n-1} \u00F7 2 = ${ans}.`);
}];


/* ============ EASY TIER ============ */
const EASY_ANALOGIES = [
  ["DOCTOR","HOSPITAL","TEACHER","School",["Student","Book","Lesson"]],
  ["BIRD","NEST","BEE","Hive",["Honey","Flower","Wing"]],
  ["PEN","WRITE","KNIFE","Cut",["Sharp","Kitchen","Metal"]],
  ["SHOE","FOOT","GLOVE","Hand",["Wool","Winter","Finger"]],
  ["THIRSTY","DRINK","TIRED","Sleep",["Rest","Yawn","Bed"]],
  ["PUPPY","DOG","KITTEN","Cat",["Pet","Fur","Milk"]],
  ["CHAPTER","BOOK","SCENE","Play",["Actor","Stage","Story"]],
  ["CLOCK","TIME","THERMOMETER","Temperature",["Heat","Mercury","Weather"]]
];
const EASYGEN = [

function simpleProgression(){
  const geo = RND() < 0.4;
  const start = ri(2,9);
  if (geo){
    const r = ri(2,3), t = [start];
    for (let i=0;i<4;i++) t.push(t[t.length-1]*r);
    const ans = t[4]*r;
    return mk("Numerical & pattern", 70,
      `What comes next? &nbsp;<span class="seq">${t.join(", ")}, ___</span>`,
      ans, [ans+r, ans-r, t[4]+r, ans*2],
      `Each term is the one before it multiplied by ${r}. ${t[4]} \u00D7 ${r} = ${ans}.`);
  }
  const d = ri(3,12), t = [start];
  for (let i=0;i<4;i++) t.push(t[t.length-1]+d);
  const ans = t[4]+d;
  return mk("Numerical & pattern", 60,
    `What comes next? &nbsp;<span class="seq">${t.join(", ")}, ___</span>`,
    ans, [ans+d, ans-1, ans+1, ans+d+1],
    `Each term rises by ${d}. ${t[4]} + ${d} = ${ans}.`);
},

function percentOf(){
  const p = pick([5,10,15,20,25,40,60,75]), base = pick([120,240,300,360,480,600,800]);
  const ans = base*p/100;
  if (ans % 1 !== 0) return null;
  return mk("Numerical & pattern", 60,
    `What is ${p}% of ${base}?`,
    ans, [base*(p+5)/100, base*(p-5)/100, ans+10, ans/2],
    `${p}% of ${base} is ${base} \u00D7 ${p/100} = ${ans}.`);
},

function discountPrice(){
  const price = pick([1200,1500,2400,3000,4500,6000]), off = pick([10,20,25,30,40]);
  const ans = price*(100-off)/100;
  return mk("Numerical & pattern", 70,
    `An item priced at ${price} is reduced by ${off}%. What does it cost now?`,
    ans, [price*off/100, ans - price*0.05, ans + price*0.05, price - off],
    `${off}% off leaves ${100-off}% of the price: ${price} \u00D7 ${(100-off)/100} = ${ans}.`);
},

function averageMissing(){
  const n = ri(4,5), avg = pick([20,25,30,40,50]);
  const parts = [];
  for (let i=0;i<n-1;i++) parts.push(avg + ri(-8,8));
  const ans = avg*n - parts.reduce((a,b)=>a+b,0);
  if (ans < 1) return null;
  return mk("Numerical & pattern", 75,
    `The average of ${n} numbers is ${avg}. ${n-1} of them are ${parts.join(", ")}. What is the last number?`,
    ans, [ans+ri(3,9), ans-ri(3,9), avg, ans+avg],
    `The ${n} numbers must total ${avg} \u00D7 ${n} = ${avg*n}. The known ones add to ${parts.reduce((a,b)=>a+b,0)}, so the last is ${ans}.`);
},

function ratioSplit(){
  const a = ri(2,5), b = ri(2,7), unit = pick([100,200,300,500]);
  if (a === b) return null;
  const total = (a+b)*unit, big = Math.max(a,b)*unit;
  return mk("Numerical & pattern", 75,
    `${total} is split between two people in the ratio ${a}:${b}. How much does the larger share come to?`,
    big, [Math.min(a,b)*unit, total/2, big+unit, big-unit],
    `The ratio has ${a+b} parts, so one part is ${total} \u00F7 ${a+b} = ${unit}. The larger share is ${Math.max(a,b)} parts, or ${big}.`);
},

function speedTime(){
  const speed = pick([40,50,60,70,80,90]), hours = ri(2,6);
  const dist = speed*hours;
  return mk("Numerical & pattern", 70,
    `A van covers ${dist} km in ${hours} hours. What is its average speed?`,
    `${speed} km/h`, [`${speed+10} km/h`, `${speed-10} km/h`, `${Math.round(dist/(hours+1))} km/h`, `${dist} km/h`],
    `Speed is distance divided by time: ${dist} \u00F7 ${hours} = ${speed} km/h.`);
},

function dayAhead(){
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const start = ri(0,6), ahead = pick([10,16,23,30,45,52,60,100]);
  const ans = days[(start + ahead) % 7];
  const wrong = [days[(start+ahead+1)%7], days[(start+ahead-1)%7], days[(start+ahead+2)%7], days[start]];
  return mk("Logical deduction", 75,
    `If today is ${days[start]}, what day of the week will it be in ${ahead} days?`,
    ans, wrong,
    `${ahead} \u00F7 7 leaves a remainder of ${ahead % 7}, so count ${ahead % 7} day${ahead%7===1?"":"s"} on from ${days[start]} to reach ${ans}.`);
},

function multipleOdd(){
  const base = pick([3,4,6,7,8,9]);
  const good = [];
  while (good.length < 4){
    const v = base * ri(3,15);
    if (good.indexOf(v) < 0) good.push(v);
  }
  let bad = base * ri(3,15) + ri(1, base-1);
  if (good.indexOf(bad) > -1) return null;
  const set = shuffle(good.concat([bad]));
  return mk("Lateral & verbal", 60,
    `Which of these is <em>not</em> a multiple of ${base}? &nbsp;<span class="seq">${set.join(", ")}</span>`,
    bad, good,
    `${bad} \u00F7 ${base} leaves a remainder of ${bad % base}. Every other number divides exactly.`);
},

function easyAnalogy(){
  const A = pick(EASY_ANALOGIES);
  return mk("Lateral & verbal", 60,
    `${A[0]} is to ${A[1]} as ${A[2]} is to:`,
    A[3], A[4],
    `${A[0].charAt(0)+A[0].slice(1).toLowerCase()} belongs with ${A[1].toLowerCase()} in the same way that ${A[2].toLowerCase()} belongs with ${A[3].toLowerCase()}.`);
},

function simpleOdds(){
  const r = ri(2,6), b = ri(3,8);
  const tot = r+b;
  const c = shuffle(["red","blue","green","yellow"]);
  return mk("Probability & quantitative", 70,
    `A box holds ${r} ${c[0]} balls and ${b} ${c[1]} balls. One is taken at random. What is the probability it is ${c[0]}?`,
    frac(r,tot), [frac(b,tot), frac(r,b), frac(1,tot), frac(r,tot+2)],
    `${r} of the ${tot} balls are ${c[0]}, so the probability is ${frac(r,tot)}.`);
},

function evenSteps(){
  const start = ri(2,8), step = ri(2,6), miss = ri(1,3);
  const t = [start];
  for (let i=0;i<4;i++) t.push(t[t.length-1]+step);
  const ans = t[miss];
  const shown = t.map(function(v,idx){ return idx === miss ? "__" : v; });
  return mk("Numerical & pattern", 60,
    `Which number is missing? &nbsp;<span class="seq">${shown.join(", ")}</span>`,
    ans, [ans+step, ans-step, ans+1, ans-1],
    `The series climbs by ${step} each time, so the gap must be ${ans}.`);
}
];

/* ============ PAPER ASSEMBLY ============ */
/* Rules: every question comes from a different generator, no question
   FAMILY appears more than twice in one paper, and the mix is graded
   30% easy / 40% medium / 30% hard. Hard is allocated first so it keeps
   its variety, then medium, then easy; the paper is shown easiest first. */

const HARDGEN = [NUM[0], NUM[1], LOG[1], LOG[2], LOG[5], LOG[6], QUANT[1], LAT[0]];
const HARDFAM = ["series","series","liars","wason","falsify","ordering","cube","ropes"];

const MEDGEN  = [NUM[2], NUM[3], NUM[4], NUM[5], LOG[0], LOG[3], LOG[4],
                 QUANT[0], QUANT[2], QUANT[3], QUANT[4], QUANT[5],
                 LAT[1], LAT[2], LAT[3], LAT[4], LAT[5], LAT[6]];
const MEDFAM  = ["series","percent","rate","series","sets","syllogism","queue",
                 "prob","clock","prob","rate","percent",
                 "oddoneout","analogy","doubling","costtrap","socks","handshakes"];

const EASYFAM = ["series","percent","percent","average","ratio","speed",
                 "calendar","multiple","analogy","prob","series"];

const FAMILY_CAP = 2;

function buildPaper(){
  const picked = { Easy: [], Medium: [], Hard: [] };
  const famUsed = {};
  /* seconds allowed per question, by difficulty */
  const CLOCK = { Easy: 30, Medium: 45, Hard: 60 };
  const tiers = [["Hard", HARDGEN, HARDFAM, 6],
                 ["Medium", MEDGEN, MEDFAM, 8],
                 ["Easy", EASYGEN, EASYFAM, 6]];

  for (const tier of tiers){
    const label = tier[0], pool = tier[1], fams = tier[2], count = tier[3];
    const order = shuffle(pool.map(function(_, i){ return i; }));
    let taken = 0;
    for (let k = 0; k < order.length && taken < count; k++){
      const gi = order[k], fam = fams[gi];
      if ((famUsed[fam] || 0) >= FAMILY_CAP) continue;
      let q = null, attempt = 0;
      while (!q && attempt++ < 25) q = pool[gi]();
      if (!q) continue;
      q.d = label;
      q.t = CLOCK[label];
      famUsed[fam] = (famUsed[fam] || 0) + 1;
      picked[label].push(q);
      taken++;
    }
    if (taken < count) return null;
  }
  return picked.Easy.concat(picked.Medium, picked.Hard);
}

/* Rebuild the exact paper a candidate sat, from its seed. */
function paperFromSeed(seed){
  RND = mulberry(seed | 0);
  let paper = null, tries = 0;
  while (!paper && tries++ < 30) paper = buildPaper();
  return paper;
}

const BANDS = [
  [17,"Exceptional","strong abstract reasoning under pressure","var(--verd)"],
  [13,"Strong","well above average problem solving","var(--verd)"],
  [9, "Average","typical for a professional cohort","var(--brass)"],
  [5, "Below bar","under the line for analytical roles","var(--signal)"],
  [-99,"Weak","reconsider fit for independent reasoning work","var(--signal)"]
];
function bandFor(score){ return BANDS.find(b => score >= b[0]); }


/* =====================================================================
   SERVER LOGIC  —  everything below runs only inside Apps Script.
   The browser never receives the answer key or the explanations
   until after it has submitted its answers.
   ===================================================================== */

const ALLOWED_DOMAIN   = 'firstmfg.com';
const ADMIN_KEY        = 'change-this-to-something-long';   // <-- CHANGE THIS
const ONE_ATTEMPT_ONLY = true;    // false to allow retakes
/* These addresses can sit the test as often as they like. Everyone else gets
   exactly one run: the attempt is spent the moment a paper is handed out, so
   abandoning halfway does not buy a second go. */
const UNLIMITED_EMAILS = ['jibran@firstmfg.com'];
const CODE_MINUTES     = 15;
const PENALTY_PER_FLAG = 1;       // cost of a tab switch or a copy attempt

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
function codesTab()    { return tab('Codes',    ['Email','Code','Token','Expires','Used']); }
function sessionsTab() { return tab('Sessions', ['Session','Email','Seed','Started','Submitted']); }
function resultsTab()  { return tab('Results',  ['Timestamp','Email','Score','Out of','Correct','Penalty',
                                                 'Tab switches','Copy attempts','Time (sec)','Seed',
                                                 'Answers','Times','Session']); }

function hasCompleted(email) {
  const rows = resultsTab().getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).toLowerCase() === email) return true;
  }
  return false;
}

function isUnlimited(email) {
  return UNLIMITED_EMAILS.indexOf(String(email).toLowerCase().trim()) > -1;
}

/* True once a paper has ever been handed to this address, submitted or not. */
function hasStarted(email) {
  const rows = sessionsTab().getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).toLowerCase() === email) return true;
  }
  return false;
}

/* One run each. Spent at start, not at submit. */
function attemptSpent(email) {
  if (!ONE_ATTEMPT_ONLY || isUnlimited(email)) return null;
  if (hasCompleted(email)) return 'You have already completed this test.';
  if (hasStarted(email))   return 'A paper was already issued to this address. Only one run each.';
  return null;
}

function tokenValid(email, token) {
  const rows = codesTab().getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase() === email && String(rows[i][2]) === String(token)) return true;
  }
  return false;
}

/* Mark a paper server-side. Returns the full review. */
function markPaper(seed, ansStr, timesStr) {
  const paper = paperFromSeed(Number(seed));
  if (!paper) return null;
  const ans   = String(ansStr || '').split('');
  const times = String(timesStr || '').split(',').map(Number);
  let raw = 0;
  const review = paper.map(function (q, i) {
    const given = (ans[i] === '-' || ans[i] === undefined) ? null : Number(ans[i]);
    const ok = given === q.a;
    if (ok) raw++;
    return { s:q.s, d:q.d, q:q.q, o:q.o, a:q.a, w:q.w, t:q.t, given:given, ok:ok, spent:(times[i] || 0) };
  });
  return { raw: raw, review: review, total: paper.length };
}


/* Rebuild a result that was already recorded, for a retried submit. */
function replayResult(email, session, seed) {
  const data = resultsTab().getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][12]) === String(session)) {
      const marked = markPaper(data[i][9], data[i][10], data[i][11]);
      if (!marked) return { ok: false, error: 'Could not rebuild the paper.' };
      const b = bandFor(Number(data[i][2]));
      return { ok: true, raw: data[i][4], penalty: data[i][5], score: data[i][2],
               total: data[i][3], band: [b[1], b[2]], review: marked.review };
    }
  }
  return { ok: false, error: 'This paper was already submitted.' };
}

function handle(p) {
  const email = String(p.email || '').toLowerCase().trim();

  /* ---------- 1. request a one-time code ---------- */
  if (p.action === 'send') {
    if (email.slice(-(ALLOWED_DOMAIN.length + 1)) !== '@' + ALLOWED_DOMAIN) {
      return { ok: false, error: 'Use your @' + ALLOWED_DOMAIN + ' address.' };
    }
    const spent = attemptSpent(email);
    if (spent) return { ok: false, error: spent };
    const code  = String(Math.floor(100000 + Math.random() * 900000));
    const token = Utilities.getUuid();
    codesTab().appendRow([email, code, token, new Date(Date.now() + CODE_MINUTES * 60000), 'no']);
    MailApp.sendEmail(email, 'Your aptitude test code',
      'Your one-time code is ' + code + '\n\n' +
      'It expires in ' + CODE_MINUTES + ' minutes. If you did not request this, ignore this email.');
    return { ok: true };
  }

  /* ---------- 2. verify the code ---------- */
  if (p.action === 'verify') {
    const spentV = attemptSpent(email);
    if (spentV) return { ok: false, error: spentV };
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

  /* ---------- 3. hand out a paper, WITHOUT the answers ---------- */
  if (p.action === 'start') {
    if (!tokenValid(email, p.token)) return { ok: false, error: 'Session not recognised.' };
    const spentS = attemptSpent(email);
    if (spentS) return { ok: false, error: spentS };
    const seed    = Math.floor(Math.random() * 2000000000) - 1000000000;
    const session = Utilities.getUuid();
    const paper   = paperFromSeed(seed);
    if (!paper) return { ok: false, error: 'Could not build a paper. Try again.' };
    sessionsTab().appendRow([session, email, String(seed), new Date(), 'no']);
    return {
      ok: true,
      session: session,
      qs: paper.map(function (q) { return { s: q.s, t: q.t, q: q.q, o: q.o }; })
    };
  }

  /* ---------- 4. mark it here, not in the browser ---------- */
  if (p.action === 'submit') {
    if (!tokenValid(email, p.token)) return { ok: false, error: 'Session not recognised.' };
    const sh = sessionsTab(), rows = sh.getDataRange().getValues();
    let row = -1, seed = null;
    for (let i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]) === String(p.session) && String(rows[i][1]).toLowerCase() === email) {
        row = i + 1; seed = rows[i][2];
        /* Already submitted: the reply was probably lost in transit. Hand back
           the stored result instead of an error so a retry is harmless. */
        if (String(rows[i][4]) === 'yes') return replayResult(email, p.session, seed);
        break;
      }
    }
    if (row < 0) return { ok: false, error: 'Paper not found.' };

    const marked = markPaper(seed, p.ans, p.times);
    if (!marked) return { ok: false, error: 'Could not rebuild the paper.' };

    const switches = Number(p.switches || 0);
    const copies   = Number(p.copies || 0);
    const penalty  = (switches + copies) * PENALTY_PER_FLAG;
    const score    = Math.max(0, marked.raw - penalty);
    const band     = bandFor(score);

    sh.getRange(row, 5).setValue('yes');
    resultsTab().appendRow([
      new Date(), email, score, marked.total, marked.raw, penalty,
      switches, copies, Number(p.time || 0), String(seed),
      String(p.ans), String(p.times), String(p.session)
    ]);

    return { ok: true, raw: marked.raw, penalty: penalty, score: score,
             total: marked.total, band: [band[1], band[2]], review: marked.review };
  }

  /* ---------- 5. dashboard: list every result ---------- */
  if (p.action === 'admin') {
    if (String(p.key) !== ADMIN_KEY) return { ok: false, error: 'Wrong key.' };
    const data = resultsTab().getDataRange().getValues();
    const out = [];
    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      const b = bandFor(Number(r[2]));
      out.push({ id: i, when: new Date(r[0]).toISOString(), email: r[1],
                 score: r[2], total: r[3], raw: r[4], penalty: r[5],
                 switches: r[6], copies: r[7], time: r[8], seed: r[9],
                 band: b[1] });
    }
    return { ok: true, rows: out };
  }

  /* ---------- 6. dashboard: one candidate's marked paper ---------- */
  if (p.action === 'review') {
    if (String(p.key) !== ADMIN_KEY) return { ok: false, error: 'Wrong key.' };
    const data = resultsTab().getDataRange().getValues();
    const i = Number(p.id);
    if (!(i >= 1 && i < data.length)) return { ok: false, error: 'Row not found.' };
    const r = data[i];
    const marked = markPaper(r[9], r[10], r[11]);
    if (!marked) return { ok: false, error: 'Could not rebuild the paper.' };
    const b = bandFor(Number(r[2]));
    return { ok: true, email: r[1], when: new Date(r[0]).toISOString(),
             score: r[2], total: r[3], raw: r[4], penalty: r[5],
             switches: r[6], copies: r[7], time: r[8], seed: r[9],
             band: [b[1], b[2]], review: marked.review };
  }

  return { ok: false, error: 'Unknown action.' };
}
