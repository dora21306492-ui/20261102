// ============================================================
//  學習功能：特有種小教室、每日學習（小知識＋冷笑話）、展示動物設定
//  （根據測試者回饋新增：不懂「特有種／特有亞種」容易挫折 → 先教一點；
//    每天一則有趣的小知識；房間相框裡的動物可以自己選）
// ============================================================

const KIND_NOTE = {
  '特有種': '特有種：只生活在台灣，世界上其他地方的自然環境找不到。',
  '特有亞種': '特有亞種：同一種動物在別處也有，但台灣的族群自成一支、有自己的特徵。',
  '原生種': '原生種：本來就在台灣自然生活，但不是只有台灣才有。'
};

// ---------- 特有種小教室 ----------
const LESSON = [
  { t: '先認識「特有種」', sp: 'magpie', kind: '特有種',
    d: '有些動物，全世界只有台灣才找得到，牠們就叫「特有種」。例如台灣藍鵲：到別的國家的森林裡，是看不到牠的。' },
  { t: '再來是「特有亞種」', sp: 'bear', kind: '特有亞種',
    d: '有些動物在別的地方也有，但台灣的族群住在島上很久，長出自己的特徵，就叫「特有亞種」。例如台灣黑熊：胸前有白色 V 字，是黑熊的台灣亞種。' },
  { t: '還有「原生種」', sp: 'pangolin', kind: '原生種',
    d: '本來就住在台灣，但不是只有台灣才有，叫做「原生種」，例如台灣穿山甲。和人類帶進來的「外來種」不一樣。' },
  { t: '怎麼分？三句口訣', rows: [
    { kind: '特有種', line: '全世界只有台灣有。（台灣藍鵲、帝雉）' },
    { kind: '特有亞種', line: '別處也有同一種，但台灣這一群特別。（台灣黑熊、石虎）' },
    { kind: '原生種', line: '本來就在台灣，別處也有。（台灣穿山甲）' }],
    d: '遊戲裡的圖鑑和解說卡，都會幫每種動物貼上標籤，玩的時候可以對照看看！' }
];
let lsn = { i: 0, from: 'hub' };
function openLesson(from) { lsn = { i: 0, from: from || 'hub' }; view = 'lesson'; if (!store.lesson) { store.lesson = true; saveStore(); } }

// 共用版面：大卡片＋圖片區＋文字區＋底下按鈕列（電腦＝左圖右字，手機＝上圖下字）
function pageCard(noImg) {
  const W = width, H = height, pad = F(16), cw = min(W - F(24), F(wide ? 980 : 560)), ch = H - BAR - F(24), cx = (W - cw) / 2, cy = BAR + F(12);
  card(cx, cy, cw, ch, '#ffffff');
  let img, tx, ty, tw;
  if (noImg) { img = null; tx = cx + pad * 1.5; ty = cy + pad; tw = cw - pad * 3; }
  else if (wide) { const iw = cw * 0.42, ih = min(ch - pad * 2 - F(70), iw * 0.8); img = { x: cx + pad, y: cy + pad, w: iw, h: ih }; tx = cx + pad * 2 + iw; ty = cy + pad; tw = cw - iw - pad * 3; }
  else { const ih = min((cw - pad * 2) * 0.58, ch * 0.27); img = { x: cx + pad, y: cy + pad, w: cw - pad * 2, h: ih }; tx = cx + pad; ty = cy + pad + ih + F(34); tw = cw - pad * 2; }
  return { cx, cy, cw, ch, pad, img, tx, ty, tw, by: cy + ch - F(52) - pad * 0.5 };
}
function fitPara(s, w, size, avail) {            // 文字太長就縮小字級，確保放得進去
  let ts = size, lines = wrapLines(s, w, ts);
  while (lines.length * ts * 1.5 > avail && ts > F(11)) { ts -= 1; lines = wrapLines(s, w, ts); }
  return { lines, ts };
}
function drawSpScene(sp, r) { drawPlate(r.x, r.y, r.w, r.h, (x, y, w, h) => drawScene(sp, x, y, w, h)); }
function navButtons(L, leftLabel, rightLabel, leftFn, rightFn, rightCol) {
  const bw = F(wide ? 150 : 124), bh = F(46);
  if (leftFn) button(L.cx + L.pad, L.by, bw, bh, leftLabel, '#6a8f72', leftFn, { size: F(19) });
  button(L.cx + L.cw - L.pad - bw - (rightLabel.length > 5 ? F(20) : 0), L.by, bw + (rightLabel.length > 5 ? F(20) : 0), bh, rightLabel, rightCol || '#38b25c', rightFn, { size: F(19) });
}

function drawLesson(t) {
  const pg = LESSON[lsn.i], last = lsn.i === LESSON.length - 1, L = pageCard(!pg.sp);
  topBar('📘 特有種小教室', lsn.from);
  let y = L.ty;
  if (pg.sp) {
    const sp = SPECIES.find(s => s.id === pg.sp);
    drawSpScene(sp, L.img);
    txt(sp.name, L.img.x + L.img.w / 2, L.img.y + L.img.h + F(14), fitText(sp.name, L.img.w, F(wide ? 20 : 16)), '#2e6b3a', CENTER, true);
  }
  txt(pg.t, L.tx, y + F(24), fitText(pg.t, L.tw, F(wide ? 36 : 26)), '#1f5a34', LEFT, true); y += F(wide ? 52 : 42);
  if (pg.kind) { pill(L.tx, y, pg.kind, kindColor(pg.kind), F(wide ? 18 : 15)); y += F(wide ? 46 : 38); }
  if (pg.rows) {
    const ts = F(wide ? 20 : 15);
    pg.rows.forEach(r => {
      const pw = pill(L.tx, y, r.kind, kindColor(r.kind), F(wide ? 18 : 15));
      const lines = wrapLines(r.line, L.tw - pw - F(12), ts);
      paraText(lines, L.tx + pw + F(12), y + F(wide ? 4 : 2), ts, '#2f4a36', ts * 1.4, LEFT);
      y += max(F(wide ? 46 : 38), lines.length * ts * 1.4 + F(14));
    });
    y += F(6);
  }
  const f = fitPara(pg.d, L.tw, F(wide ? 22 : 17), L.by - y - F(10));
  paraText(f.lines, L.tx, y, f.ts, '#333', f.ts * 1.5, LEFT);
  for (let i = 0; i < LESSON.length; i++) { fill(i === lsn.i ? '#38b25c' : '#cfe0d2'); noStroke(); circle(L.cx + L.cw / 2 + (i - (LESSON.length - 1) / 2) * F(16), L.by + F(23), F(9)); }
  navButtons(L, '◀ 上一頁', last ? '開始探險！' : '下一頁 ▶',
    lsn.i > 0 ? () => { lsn.i--; } : null,
    () => { if (last) view = lsn.from; else lsn.i++; });
}

// ---------- 每日學習 ----------
const DAILY_TIPS = [
  { sp: 'pheasant', h: '千元鈔票上的鳥', d: '帝雉是台灣現存最大的特有種鳥類，也是千元鈔票上的鳥。下次摸到千元鈔，記得跟牠打聲招呼。' },
  { sp: 'barbet', h: '森林裡的木魚大師', d: '五色鳥的叫聲像敲木魚的「嘓嘓嘓」。如果公園裡有人在敲木魚，先別急著找廟，抬頭看看樹上。' },
  { sp: 'emperor', h: '蝴蝶寶寶的指定便當', d: '大紫蛺蝶的幼蟲以朴樹為食，所以保護朴樹，就是在保護牠。蝴蝶也會挑食，而且只挑一種。' },
  { sp: 'bear', h: '胸前的 V 字', d: '台灣黑熊胸前有白色 V 字。冷笑話時間：為什麼黑熊總是很有自信？因為牠胸前寫著 Victory。' },
  { sp: 'pangolin', h: '全身都是「甲」', d: '穿山甲全身覆蓋鱗片，用長舌頭舔食螞蟻和白蟻。冷笑話：穿山甲怎麼保護自己？很簡單，有「甲」就好。' },
  { sp: 'salmon', h: '全台灣最怕熱的居民', d: '櫻花鉤吻鮭是冰河時期留下的孑遺生物，水溫要終年不超過 17°C。夏天對牠來說是個大挑戰。' },
  { sp: 'muntjac', h: '換角 vs 不換角', d: '山羌的角是實心、會脫落的；長鬃山羊的角是中空、終身不脫落。一個會換角，一個一輩子都戴同一副。' },
  { sp: 'magpie', h: '走路有風的長尾巴', d: '台灣藍鵲全身藍色，尾羽很長，末端有白色斑點，常成群活動。出門都是團體行動，超有氣勢。' },
  { sp: 'macaque', h: '台灣唯一的猴子', d: '台灣獼猴是台灣唯一的原生猴類。牠曾列為保育類，後來降為一般類，但仍然不能任意獵捕。' },
  { sp: 'leopardcat', h: '夜裡才出門的貓', d: '石虎是台灣少數的中型野生貓，夜行性、行蹤隱密。路殺是牠的大威脅，山區夜晚開車請慢一點。' },
  { sp: 'bear', h: '特有種 vs 特有亞種', d: '特有種：全世界只有台灣有。特有亞種：別處也有同一種，但台灣這一群自成一支。口訣：「只有我有」是種，「我家這支特別」是亞種。' },
  { sp: 'treefrog', h: '會鼓氣球的歌手', d: '雄性莫氏樹蛙會鼓起喉部的鳴囊來鳴叫。成體約 4–5 公分，眼睛的虹彩是橘紅色。' },
  { sp: 'sambar', h: '最大的草食動物', d: '台灣水鹿是台灣原生最大型的草食動物。冷笑話：水鹿為什麼不擔心？因為「鹿」到橋頭自然直。' },
  { sp: 'salamander', h: '冰河時期的老朋友', d: '台灣山椒魚是冰河時期留下的孑遺生物，台灣目前記錄有 5 種，主要分布在海拔 1500 公尺以上的高山。' },
  { sp: 'swinhoe', h: '雙國寶鳥', d: '藍腹鷴和帝雉並稱台灣的兩大國寶鳥。雄鳥腹部是藍黑色，臉上有紅色肉垂，頭上有白色冠羽。' },
  { sp: 'pheasant', h: '帝雉和藍鵲怎麼分？', d: '兩種都是長尾巴的特有種鳥類。藍鵲愛成群停在樹枝上，有紅色的嘴；帝雉多半在林道上慢慢走、低頭覓食，是台灣現存最大的特有種鳥。' }
];
function tipToday() { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) % DAILY_TIPS.length; }
function learnSeen() { return store.lastLearn === todayStr(); }
// ---------- 每日挑戰：先看今日小知識，再開始挑戰 ----------
let di = { from: 'hub' };
function openDailyIntro(from) { di = { from: from || 'hub' }; view = 'daily'; if (!learnSeen()) { store.lastLearn = todayStr(); saveStore(); } }
function drawDailyIntro(t) {
  const L = pageCard(), tip = DAILY_TIPS[tipToday()], sp = SPECIES.find(s => s.id === tip.sp);
  topBar('📅 每日挑戰', di.from);
  drawSpScene(sp, L.img);
  txt(sp.name, L.img.x + L.img.w / 2, L.img.y + L.img.h + F(14), fitText(sp.name, L.img.w, F(wide ? 20 : 16)), '#2e6b3a', CENTER, true);
  let y = L.ty;
  const d = new Date();
  pill(L.tx, y, '💡 ' + (d.getMonth() + 1) + '/' + d.getDate() + '　今日小知識', '#e8803a', F(wide ? 17 : 14)); y += F(wide ? 50 : 40);
  txt(tip.h, L.tx, y + F(14), fitText(tip.h, L.tw, F(wide ? 34 : 25)), '#1f5a34', LEFT, true); y += F(wide ? 52 : 42);
  pill(L.tx, y, sp.kind, kindColor(sp.kind), F(wide ? 16 : 13)); y += F(wide ? 42 : 34);
  const f = fitPara(tip.d, L.tw, F(wide ? 22 : 17), L.by - y - F(86));
  paraText(f.lines, L.tx, y, f.ts, '#333', f.ts * 1.5, LEFT);
  const info = dailyDone() ? '✅ 今天的挑戰已完成，想再玩一次也可以' : '今日挑戰：5 題，完成後會記錄連續天數（目前連續 ' + (store.streak || 0) + ' 天）';
  txt(info, L.tx, L.by - F(30), fitText(info, L.tw, F(wide ? 17 : 14)), '#557a5c', LEFT);
  navButtons(L, '📚 知識庫', dailyDone() ? '再玩一次 ▶' : '開始挑戰 ▶',
    () => openKB('daily'),
    () => { retView = 'hub'; startDaily(); }, '#e8803a');
}

// ---------- 知識庫：特有種／特有亞種／原生種的差別＋15 種動物題庫 ----------
let kb = { from: 'hub', tab: 'kind', filter: '全部' };
function openKB(from) { kb.from = from || 'hub'; view = 'kb'; }
const KB_KINDS = [{ kind: '特有種', sp: 'magpie' }, { kind: '特有亞種', sp: 'bear' }, { kind: '原生種', sp: 'pangolin' }];
function drawKB(t) {
  const W = width, H = height, cw = min(W - F(16), F(980)), x0 = (W - cw) / 2, g = F(8);
  topBar('📚 知識庫', kb.from);
  let y = BAR + F(10);
  const mh = F(wide ? 42 : 38), mw = min(F(190), (cw - g) / 2), sx = W / 2 - (mw * 2 + g) / 2;
  chip(sx, y, mw, mh, '📘 分類差別', kb.tab === 'kind', () => { kb.tab = 'kind'; }, '#2e9e8f');
  chip(sx + mw + g, y, mw, mh, '🐾 動物題庫', kb.tab === 'bank', () => { kb.tab = 'bank'; }, '#2e9e8f');
  y += mh + F(10);
  if (kb.tab === 'kind') drawKBKinds(y, x0, cw); else drawKBBank(y, x0, cw);
}
function drawKBKinds(y0, x0, cw) {
  const W = width, H = height, g = F(10), bh = F(44), areaH = H - y0 - bh - F(22);
  const n = KB_KINDS.length;
  KB_KINDS.forEach((k, i) => {
    const sp = SPECIES.find(s => s.id === k.sp), names = SPECIES.filter(s => s.kind === k.kind).map(s => s.name.replace('台灣', ''));
    let x, y, w, h;
    if (wide) { w = (cw - g * (n - 1)) / n; h = areaH; x = x0 + i * (w + g); y = y0; }
    else { w = cw; h = (areaH - g * (n - 1)) / n; x = x0; y = y0 + i * (h + g); }
    card(x, y, w, h, '#ffffff');
    const pad = F(10), kc = kindColor(k.kind);
    let img, tx, ty, tw;
    if (wide) { const ih = min(h * 0.34, w * 0.6); img = { x: x + pad, y: y + pad, w: w - pad * 2, h: ih }; tx = x + pad; ty = y + pad + ih + F(12); tw = w - pad * 2; }
    else { const iw = min(w * 0.36, h * 1.35); img = { x: x + pad, y: y + pad, w: iw, h: h - pad * 2 }; tx = x + pad * 2 + iw; ty = y + pad; tw = w - iw - pad * 3; }
    drawScene(sp, img.x, img.y, img.w, img.h);
    pill(tx, ty, k.kind + '（' + names.length + ' 種）', kc, F(wide ? 18 : 14)); ty += F(wide ? 44 : 32);
    const ex = '例：' + names.join('、');
    const avail = y + h - ty - pad;
    const note = KIND_NOTE[k.kind].split('：')[1];
    const f = fitPara(note + ' ' + ex, tw, F(wide ? 24 : 16), avail);
    paraText(f.lines, tx, ty, f.ts, '#333', f.ts * 1.5, LEFT);
  });
  button(W / 2 - F(130), H - bh - F(10), F(260), bh, '📘 看圖解小教室', '#4a96e8', () => openLesson('kb'), { size: F(19) });
}
function drawKBBank(y0, x0, cw) {
  const W = width, H = height, g = F(6), fl = ['全部', '特有種', '特有亞種', '原生種'];
  const fw = (cw - g * 3) / 4;
  fl.forEach((f, i) => chip(x0 + i * (fw + g), y0, fw, F(wide ? 36 : 34), f, kb.filter === f, () => { kb.filter = f; }, f === '全部' ? ART.blue : kindColor(f)));
  const y = y0 + F(wide ? 36 : 34) + F(8);
  const list = SPECIES.filter(s => kb.filter === '全部' || s.kind === kb.filter);
  const cols = wide ? 5 : 3, rows = ceil(list.length / cols), tw = cw / cols, ch = min((H - y - F(8)) / max(1, rows), F(wide ? 200 : 150));
  list.forEach((sp, i) => {
    const x = x0 + (i % cols) * tw + F(4), yy = y + floor(i / cols) * ch, w = tw - F(8), h = ch - F(6), ih = h - F(26);
    noStroke(); fill(0, 0, 0, 20); rect(x + 1, yy + 3, w, h, F(12));
    fill('#fff'); stroke('#c4d6c0'); strokeWeight(1.5); rect(x, yy, w, h, F(12)); noStroke();
    drawScene(sp, x + 4, yy + 4, w - 8, ih - 4);
    fill(kindColor(sp.kind)); circle(x + w - F(12), yy + F(12), F(14));
    txt(sp.name, x + w / 2, yy + h - F(13), fitText(sp.name, w - F(8), F(wide ? 16 : 14)), '#2e6b3a', CENTER, true);
    btns.push({ x, y: yy, w, h, fn: () => { modal = sp; } });
  });
  txt('● 綠＝特有種　藍＝特有亞種　灰＝原生種　（點動物看完整介紹）', W / 2, H - F(10), fitText('● 綠＝特有種　藍＝特有亞種　灰＝原生種　（點動物看完整介紹）', W - F(16), F(13)), '#6a7a6e');
}

// 房間牆上的「知識庫」小書櫃
function drawKBNote(x, y, w, h, t) {
  noStroke(); fill(0, 0, 0, 30); rect(x + 3, y + 5, w, h, F(8));
  fill('#8a5a2b'); rect(x, y, w, h, F(8)); fill('#f7ecd2'); rect(x + F(6), y + F(6), w - F(12), h - F(12), F(4));
  const cols = ['#2e9e4f', '#3b86d6', '#e8803a', '#8a6bc8', '#d64545', '#d9a21f'];
  for (let r = 0; r < 3; r++) {
    const sy = y + F(8) + r * (h - F(16)) / 3, sh = (h - F(16)) / 3 - F(6);
    fill('#b07a40'); rect(x + F(6), sy + sh, w - F(12), F(5));
    let bx = x + F(10);
    for (let i = 0; i < 5 && bx < x + w - F(16); i++) { const bw = F(8) + ((i * 7 + r * 3) % 5) * F(1.5), bh2 = sh * (0.7 + ((i + r) % 3) * 0.1); fill(cols[(i + r * 2) % 6]); rect(bx, sy + sh - bh2, bw, bh2, 2); bx += bw + F(2); }
  }
  txt('📚', x + w / 2, y + h * 0.5, fitText('📚', w * 0.5, F(34)), '#000');
}

// ---------- 展示動物設定（房間相框） ----------
// store.show = { mode: 'rot' 輪播 | 'rand' 隨機 | 'fix' 固定, favs: [喜愛的物種代號], fix: 固定要顯示的物種代號 }
function showPool() { const p = store.show.favs.map(id => SPECIES.find(s => s.id === id)).filter(Boolean); return p.length ? p : SPECIES; }
function showcaseSp(t) {
  const sh = store.show;
  if (sh.mode === 'fix') return SPECIES.find(s => s.id === sh.fix) || SPECIES[0];
  const list = showPool(), k = Math.floor(t / 9);
  return sh.mode === 'rand' ? list[((k * 2654435761) >>> 0) % list.length] : list[k % list.length];
}
let shFrom = 'hub';
function openShowcase(from) { shFrom = from || 'hub'; view = 'showcase'; }
const SHOW_MODES = [{ id: 'rot', n: '🔁 輪播' }, { id: 'rand', n: '🎲 隨機' }, { id: 'fix', n: '📌 固定' }];
function drawShowcase(t) {
  const W = width, H = height, sh = store.show, cw = min(W - F(16), F(980)), x0 = (W - cw) / 2, g = F(8);
  topBar('🖼 選擇展示的動物', shFrom);
  let y = BAR + F(10);
  const mh = F(wide ? 42 : 38), mw = min(F(150), (cw - g * 2) / 3);
  SHOW_MODES.forEach((m, i) => chip(W / 2 - (mw * 3 + g * 2) / 2 + i * (mw + g), y, mw, mh, m.n, sh.mode === m.id, () => { sh.mode = m.id; saveStore(); }, '#8a6bc8'));
  y += mh + F(8);
  const hint = sh.mode === 'fix' ? '固定：點一隻動物，相框就一直顯示牠' : sh.mode === 'rand' ? '隨機：從你勾選的動物裡隨機換（沒勾選＝全部）' : '輪播：依序播放你勾選的動物（沒勾選＝全部）';
  txt(hint, W / 2, y + F(10), fitText(hint, cw - F(100), F(wide ? 17 : 14)), '#557a5c');
  if (sh.mode !== 'fix' && sh.favs.length) button(W - F(88), y - F(4), F(78), F(28), '全部取消', '#9aa59d', () => { sh.favs = []; saveStore(); }, { size: F(13) });
  y += F(26);
  const cols = wide ? 5 : 3, rows = ceil(SPECIES.length / cols), ch = (H - y - F(8)) / rows, tw = cw / cols;
  const cur = showcaseSp(t);
  SPECIES.forEach((sp, i) => {
    const x = x0 + (i % cols) * tw + F(4), yy = y + floor(i / cols) * ch, w = tw - F(8), h = ch - F(6), ih = h - F(26);
    const on = sh.mode === 'fix' ? sh.fix === sp.id : sh.favs.includes(sp.id);
    noStroke(); fill(0, 0, 0, 20); rect(x + 1, yy + 3, w, h, F(12));
    fill(on ? '#fff3c4' : '#fff'); stroke(on ? '#f0a020' : '#c4d6c0'); strokeWeight(on ? 3 : 1.5); rect(x, yy, w, h, F(12)); noStroke();
    drawScene(sp, x + 4, yy + 4, w - 8, ih - 4);
    txt(sp.name, x + w / 2, yy + h - F(13), fitText(sp.name, w - F(8), F(wide ? 16 : 14)), '#2e6b3a', CENTER, true);
    if (on) { fill('#f0a020'); circle(x + w - F(14), yy + F(14), F(22)); txt(sh.mode === 'fix' ? '📌' : '★', x + w - F(14), yy + F(15), F(13), '#fff', CENTER, true); }
    else if (cur === sp) { fill('#8a6bc8'); circle(x + w - F(14), yy + F(14), F(22)); txt('▶', x + w - F(14), yy + F(15), F(11), '#fff', CENTER, true); }
    btns.push({ x, y: yy, w, h, fn: () => {
      if (sh.mode === 'fix') sh.fix = sp.id;
      else { const k = sh.favs.indexOf(sp.id); if (k >= 0) sh.favs.splice(k, 1); else sh.favs.push(sp.id); }
      saveStore();
    } });
  });
}
