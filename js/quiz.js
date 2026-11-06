
const QUESTIONS = [
  {
    text: "Если человека назвали мордофиля, то это...",
    answers: ["Значит, что он тщеславный.", "Значит, что у него лицо как у хряка.", "Значит, что чумазый.",
    ],
    correct: [0],
    explain:
      " Ну зачем же вы так... В Этимологическом словаре русского языка Макса Фасмера поясняется, что мордофилей называют чванливого человека. Ну а «чванливый» — это высокомерный, тщеславный.",
  },
  {
    text: "«Да этот Ярополк — фуфлыга!» Что не так с Ярополком?",
    answers: ["Он маленький и невзрачный.", "Он тот ещё алкоголик.", "Он не держит своё слово."],
    correct: [0],
    explain:
      "Точно! Словарь Даля говорит, что фуфлыгой называют невзрачного малорослого человека. А еще так называют прыщи.",
  },
  {
    text: "Если человека прозвали пятигузом, значит, он…",
    answers: ["Не держит слово.", "Может сесть сразу на пять стульев.", "Изменяет жене.", "Без гроша в кармане." ],
    correct: [0],
    explain:
      "Может сесть сразу на пять стульев. Согласно Этимологическому словарю русского языка Макса Фасмера, пятигуз — это ненадежный, непостоянный человек.",
  },
  {
    text: "Кто такой шлындра?",
    answers: ["Обманщик.", "Нытик.", "Бродяга."],
    correct: [2],
    explain: "Да! В Словаре русского арго «шлындрать» означает бездельничать, шляться.",
  },
  {
    text: "В каком случае про человека можно сказать, что он охренел (в смысле «обнаглел / перешёл границы»), а не просто удивился?",
    answers: ["Он без спроса берёт твои вещи и делает вид, что так и надо.",
      "Он в наглую лезет без очереди и ещё возмущается, что его не пропускают.",
      "Он съел много хрена и искренне удивился: «Какой жгучий, вот это да!»",
      "В осеннем лесу наблюдается завихрение листьев."],
    correct: [0, 1],
    explain: "Правильно. Слово «охренел» многозначно, оно означает «обнаглел, потерял совесть».",
  },
];


const area = document.getElementById("quiz-area");
const endNote = document.getElementById("quiz-end");
const stats = document.getElementById("quiz-stats");
const hint = document.getElementById("quiz-hint");
const restartBtn = document.getElementById("quiz-restart");

const TIMING = { 
  wrongWait: 2000, 
  correctWait: 3600, 
  fallStep: 200, 
  fall: 700 
};
let order = [],
  pos = 0,
  score = 0,
  locked = false,
  finished = false;

function mix(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function start() {
  area.innerHTML = "";
  endNote.hidden = true;
  stats.hidden = true;
  hint.hidden = true;
  restartBtn.hidden = true;
  order = mix(QUESTIONS.map((_, i) => i));
  pos = 0;
  score = 0;
  locked = false;
  finished = false;
  addQuestion();
}

function addQuestion() {
  const q = QUESTIONS[order[pos]];
  const card = document.createElement("article");
  card.className = "qcard";
  card.innerHTML =
    '<header class="qcard_head"><span class="qcard_num">' + (pos + 1) + "</span>" +
    '<h3 class="qcard_text"></h3><span class="mark" aria-hidden="true"></span></header>' +
    '<div class="answers-wrap"><div class="answers"></div></div>' +
    '<div class="reveal" hidden></div>';
  card.querySelector(".qcard_text").textContent = q.text;
  card.dataset.q = order[pos];

  const box = card.querySelector(".answers");
  mix(q.answers.map((t, i) => ({ t, ok: q.correct.includes(i) }))).forEach((a) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "answer";
    b.dataset.ok = a.ok ? "1" : "0";
    b.innerHTML = '<span class="answer_text"></span><span class="answer_explain"></span>';
    b.querySelector(".answer_text").textContent = a.t;
    b.addEventListener("click", () => choose(card, b, q));
    box.appendChild(b);
  });
  card.querySelector(".qcard_head").addEventListener("click", () => toggleReveal(card));
  area.appendChild(card);
  requestAnimationFrame(() => card.classList.add("in"));
  if (pos > 0) card.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

async function choose(card, btn, q) {
  if (locked || finished) return;
  
  const need = q.correct.length;
  let chosen, ok;

  if (need > 1) {
    btn.classList.toggle("picked");
    if (btn.classList.contains("picked")) btn.classList.add("shake");
    
    chosen = [...card.querySelectorAll(".answer.picked")];
    if (chosen.length < need) return;
    
    locked = true;
    card.classList.add("busy");
    ok = chosen.every((a) => a.dataset.ok === "1");
  } 
  else {
    locked = true;
    card.classList.add("busy");
    btn.classList.add("picked", "shake");
    chosen = [btn];
    ok = btn.dataset.ok === "1";
  }

  const answers = [...card.querySelectorAll(".answer")];

  if (ok) {
    score++;
    chosen.forEach((a) => {
      a.querySelector(".answer_explain").textContent = q.explain;
      a.classList.add("big");
    });
  }
  await wait(ok ? TIMING.correctWait : TIMING.wrongWait);

  const mark = card.querySelector(".mark");
  mark.classList.add(ok ? "ok" : "bad");
  mark.textContent = ok ? "✔" : "❌";

  const falling = answers.filter((a) => !ok || !chosen.includes(a));
  
  falling.forEach((a, i) => {
    a.style.transitionDelay = i * TIMING.fallStep + "ms";
    a.classList.add("fall");
  });
  await wait(falling.length * TIMING.fallStep + TIMING.fall);

  if (ok) {
    chosen.forEach(a => a.classList.add("vanish"));
    await wait(500);
  } 
  card.classList.add("done");
  card.classList.remove("busy");
  await wait(600);

  pos++;
  if (pos < order.length) {
    locked = false;
    addQuestion();
  } else {
    finish();
  }
}

function finish() {
  finished = true;
  endNote.hidden = false;
  stats.hidden = false;
  stats.textContent = "Правильных ответов: " + score + " из " + order.length;
  hint.hidden = false;
  console.log(QUESTIONS);
  restartBtn.hidden = false;
  area.querySelectorAll(".qcard").forEach((c) => c.classList.add("reviewable"));
  endNote.scrollIntoView({ behavior: "smooth", block: "center" });
}

function toggleReveal(card) {
  if (!finished) return;
  const open = !card.querySelector(".reveal").hidden;
  area.querySelectorAll(".reveal").forEach((r) => {
    r.hidden = true;
    r.parentNode.classList.remove("open");
  });
  if (open) return;
  const q = QUESTIONS[card.dataset.q];
  const r = card.querySelector(".reveal");
  r.innerHTML =
    '<div class="answer answer-static"><span class="answer_text"></span><span class="answer_explain"></span></div>';
  r.querySelector(".answer_text").textContent = q.correct.map((i) => q.answers[i]).join(" / ");
  r.querySelector(".answer_explain").textContent = q.explain;
  r.hidden = false;
  card.classList.add("open");
}

restartBtn.addEventListener("click", start);
start();
