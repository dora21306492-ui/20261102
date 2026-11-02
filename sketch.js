// ============================================================
//  認識台灣原生種 ─ 多媒體測驗系統（p5.js）
//  這個檔案：全站共用的設定、版面計算、輸入處理、首頁、造型編輯、頁面A、開發人員頁
//  相關檔案：
//    species.js 物種題庫　scenes.js 動物插圖　avatar.js 探險家角色　backdrop.js 背景動畫
//    audio.js 音效與背景音樂　games.js 三種玩法、圖鑑、成績、彩帶
// ============================================================

// ---------- 可以自己修改的設定 ----------
const DEV_NAME = '胡馨云';                       // ← 請改成你的姓名（會顯示在「其他」頁面）
const DEV_ROLE = '發想題材・設計流程與畫面・審定題目・測試與整合';
const FONT = STYLE.font;   // 主要字型（設定在 config.js）
// p5 會把「含空白的字型清單」整串加上引號，導致字型與字級都失效（文字變成預設的小字）。
// 所以這裡改寫 p5 套用文字屬性的方式，直接把字型清單與字級交給瀏覽器。
if (typeof p5 !== 'undefined' && p5.Renderer2D) {
  const applyText = p5.Renderer2D.prototype._applyTextProperties;
  p5.Renderer2D.prototype._applyTextProperties = function () {
    const r = applyText.call(this);
    this.drawingContext.font = (this._textStyle || 'normal') + ' ' + (this._textSize || 12) + 'px ' + FONT;
    return r;
  };
}
const GRID_N = 8;        // 每回合抽幾種物種（八題）
const PASS_LINE = 60;    // 成績高於這個百分比才放彩帶

// ---------- 全域狀態 ----------
let lastView = 'home';
let view = 'home';       // 目前畫面：home 首頁｜credits 開發人員｜create 造型｜hub 頁面A｜drag 拖曳｜quiz 點選｜puzzle 拼圖｜dex 圖鑑
let btns = [];           // 這一個影格中所有可點擊的按鈕（每個影格重新登記）
let modal = null;        // 正在顯示解說卡的物種
let panel = null;        // 成績面板資料
let toastMsg = '', toastUntil = 0;
let store;               // 本機存檔：最高分、圖鑑、音量、角色造型
let dg = null, mc = null;            // 拖曳配對、點選闖關／拼圖的狀態
let confetti = [], confettiFrames = 0;
let cr = null;           // 造型編輯的暫存資料
let UI = 1, wide = false, BAR = 56;  // 介面縮放倍率、是否為「電腦橫向」版面、上方工具列高度
let usingTouch = false;              // 是否正在用觸控（手機沒有「滑過」）
let soundExp = false, soundOpenUntil = 0, sliderDrag = false, sliderGeom = null;   // 音量按鈕的狀態
let scrollY = 0, scrollMax = 0;      // 開發人員頁的捲動

// ============================================================
//  存檔（localStorage）
// ============================================================
function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem('tw_native_quiz') || '{}');
    return { best: s.best || {}, dex: s.dex || {}, muted: !!s.muted, vol: typeof s.vol === 'number' ? s.vol : 0.7, avatar: s.avatar ? fixAvatar(s.avatar) : null,
             tut: !!s.tut, plays: s.plays || {}, ach: s.ach || {}, perfect: !!s.perfect, streak: s.streak || 0, maxStreak: s.maxStreak || 0, lastDaily: s.lastDaily || '', photos: s.photos || 0, beat: !!s.beat, fast: !!s.fast, runs: Array.isArray(s.runs) ? s.runs : [], lesson: !!s.lesson, kindOk: s.kindOk || 0, lastLearn: s.lastLearn || '', show: fixShow(s.show) };
  } catch (e) { return { best: {}, dex: {}, muted: false, vol: 0.7, avatar: null, tut: false, plays: {}, ach: {}, perfect: false, streak: 0, maxStreak: 0, lastDaily: '', photos: 0, beat: false, fast: false, runs: [], lesson: false, kindOk: 0, lastLearn: '', show: fixShow(null) }; }
}
function fixShow(o) { o = o || {}; return { mode: ['rot', 'rand', 'fix'].includes(o.mode) ? o.mode : 'rot', favs: Array.isArray(o.favs) ? o.favs.filter(x => typeof x === 'string') : [], fix: typeof o.fix === 'string' ? o.fix : 'magpie' }; }
function saveStore() { try { localStorage.setItem('tw_native_quiz', JSON.stringify(store)); } catch (e) {} }
function unlockDex(sp) {          // 答對某物種就解鎖圖鑑
  if (!store.dex[sp.id]) { store.dex[sp.id] = 1; saveStore(); say('📖 圖鑑解鎖：' + sp.name); }
}
function dexCount() { return SPECIES.filter(s => store.dex[s.id]).length; }
function levelInfo(n) {           // 依圖鑑收集數量決定探險家等級
  const L = [[0, '見習觀察員'], [3, '自然觀察員'], [6, '生態探險家'], [10, '生態達人'], [15, '台灣生態大師']];
  let i = 0; for (let k = 0; k < L.length; k++) if (n >= L[k][0]) i = k;
  return { lv: i + 1, name: L[i][1] };
}

// ============================================================
//  p5 基本流程
// ============================================================
function preload() {
  // 若 media/ 裡有「物種代號.gif」就載入（沒有也沒關係，會改用程式畫的插圖）
  for (const sp of SPECIES) { sp.img = null; loadImage('media/' + sp.id + '.gif', (im) => { sp.img = im; }, () => { sp.img = null; }); }
  // 真實動物照片（選用）：放進 media/物種代號.jpg 或 .png，明信片就會改用照片
  for (const sp of SPECIES) { sp.photo = null; loadImage('media/' + sp.id + '.jpg', (im) => { sp.photo = im; }, () => { loadImage('media/' + sp.id + '.png', (im) => { sp.photo = im; }, () => {}); }); }
  // 照片出處檔（選用，每行：物種代號|作者|授權）。用 fetch 讀取，檔案不存在也不會卡住載入
  fetch('media/出處.txt').then(r => r.ok ? r.text() : '').then(s => { for (const l of s.split(/\r?\n/)) { const p = l.split('|'); if (p.length >= 3) { const id = p[0].trim(); if (id.startsWith('audio:')) AUDIO_CREDITS[id.slice(6)] = p[1].trim() + '｜' + p[2].trim(); else PHOTO_CREDITS[id] = '照片：' + p[1].trim() + '｜' + p[2].trim(); } } }).catch(() => {});
  initAudioFiles();
}
function setup() {
  createCanvas(windowWidth, windowHeight);   // 畫布全螢幕
  pixelDensity(min(2, window.devicePixelRatio || 1));
  textFont(FONT);
  store = loadStore();
  loadVideos();
  window.addEventListener('touchstart', () => { usingTouch = true; }, { passive: true });
  // 先把網頁字型載入（Chocolate Classical Sans 是依字元分段下載的，這裡把會用到的字先抓好）
  try {
    const all = JSON.stringify(SPECIES) + JSON.stringify(LESSON) + JSON.stringify(DAILY_TIPS) + JSON.stringify(KIND_NOTE) + JSON.stringify(ACHS.map(a => a.n + a.d)) + '知識庫分類差別動物題庫看圖解小教室開始挑戰再玩一次今日挑戰全部綠藍灰例每日今日小知識特有種小教室上一頁下一頁前一則下一則選擇展示的動物輪播隨機固定全部取消更換展示動物月日第則本來就在台灣分清楚特有亞種原生種外來種口訣' + '認識台灣原生種開始其他我的進步最高正確率最快時間已玩次數折線圖學習目標最近之前比上次進步退步刷新個人紀錄第一筆紀錄再挑戰去玩一場還沒有闖關拼圖拖曳每日' + EXTRA_CHARS + '返回主畫面換造型探險家拖曳配對點選闖關解鎖拼圖生態圖鑑開發人員男生女生髮型髮色膚色服裝配件眼鏡鬍子帽子完成隨機成績測驗結果';
    document.fonts.load('20px "Chocolate Classical Sans"', all);
  } catch (e) {}
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// 依視窗大小決定版面：電腦（橫向）左右分欄、手機（直向）上下排列，字體也隨螢幕放大
function calcUI() {
  const W = width, H = height;
  wide = W / H > 1.15 && W >= 560;
  UI = wide ? constrain(min(W / 1000, H / 640), 0.75, 2.0) : constrain(min(W / 380, H / 700), 0.85, 1.7);
  BAR = F(56);
}
function F(n) { return n * UI; }       // 依倍率換算尺寸

function draw() {
  calcUI();
  btns = [];
  if (view !== lastView) { stopSpeciesSounds(); stopVideos(); lastView = view; }      // 換畫面（返回、離開）就把叫聲停掉
  const t = millis() / 1000;
  if (view === 'home') drawHome(t);
  else if (view === 'credits') drawCredits(t);
  else if (view === 'about') drawAbout(t);
  else if (view === 'create') drawCreate(t);
  else if (view === 'hub') drawRoom(t);
  else if (view === 'desk') drawDesk(t);
  else if (view === 'achv') { background('#eaf4ea'); drawAchv(t); }
  else if (view === 'photo') drawPhoto(t);
  else {
    drawFieldBg();
    if (view === 'drag') drawDrag();
    else if (view === 'quiz' || view === 'puzzle') drawMC();
    else if (view === 'dex') drawDex();
    else if (view === 'progress') drawProgress(t);
    else if (view === 'lesson') drawLesson(t);
    else if (view === 'daily') drawDailyIntro(t);
    else if (view === 'kb') drawKB(t);
    else if (view === 'showcase') drawShowcase(t);
  }
  if (tut && view === 'hub') drawTutorial();
  else if (modal) drawModal();
  else if (panel) drawPanel();
  else soundWidget();            // 音量按鈕永遠在最上層（面板開啟時除外）
  updateConfetti();
  drawToast();
  cursor(sliderDrag ? 'ew-resize' : btns.some(b => inRect(mouseX, mouseY, b)) ? 'pointer' : 'default');
}

// ============================================================
//  滑鼠／觸控（p5 會把觸控當成滑鼠事件）
// ============================================================
function mousePressed() {
  audioInit();                                // 瀏覽器規定要使用者操作後才能出聲
  for (let i = btns.length - 1; i >= 0; i--) {
    if (inRect(mouseX, mouseY, btns[i])) { sfx('click'); btns[i].fn(); return false; }
  }
  if (modal || panel) return false;
  if (view === 'hub' && !tut) roomClick();
  if (view === 'drag' && dg) dragPress();
  return false;
}
// 手機觸控：p5 預設只會在「點一下」時補發滑鼠事件，拖曳不會，所以明確把觸控接到同一套處理函式
function touchStarted() { return mousePressed(); }
function touchMoved() { return mouseDragged(); }
function touchEnded() { return mouseReleased(); }
function keyPressed() {
  if (view === 'hub' && [LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW].includes(keyCode)) return false;   // 方向鍵不要捲動網頁
  // 鍵盤作答：1～4（或 A～D）選答案，Enter／空白鍵到下一題（PBL 示範的 F7）
  if (FEATURES.F7_keyboard && (view === 'quiz' || view === 'puzzle') && mc && !mc.done && !panel && !modal) {
    const q = mc.qs[mc.idx], i = '1234'.indexOf(key) >= 0 && key.length === 1 ? '1234'.indexOf(key) : 'abcd'.indexOf(String(key).toLowerCase());
    if (mc.picked < 0 && i >= 0 && i < q.opts.length && String(key).length === 1) { sfx('click'); mcAnswer(i); return false; }
    if (mc.picked >= 0 && (keyCode === ENTER || key === ' ')) { sfx('click'); mcNext(); return false; }
  }
}
function mouseDragged() {
  if (sliderDrag) { setVolFromMouse(); return false; }
  if (dg && dg.held) { dg.held.x = mouseX - dg.offX; dg.held.y = mouseY - dg.offY; }
  else if (view === 'credits' || view === 'about') scrollY = constrain(scrollY - (mouseY - pmouseY), 0, scrollMax);
  return false;
}
function mouseReleased() {
  if (sliderDrag) { sliderDrag = false; saveStore(); soundOpenUntil = millis() + 2500; sfx('click'); return false; }
  if (view === 'drag' && dg && dg.held) dragDrop();
  return false;
}
function mouseWheel(e) {
  if (view === 'credits' || view === 'about') { scrollY = constrain(scrollY + e.delta, 0, scrollMax); return false; }
}

// ============================================================
//  共用小工具
// ============================================================
function inRect(px, py, r) { return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }
function say(msg) { toastMsg = msg; toastUntil = millis() + 1700; }          // 顯示提示訊息
function pickSpecies(n) { return shuffle([...SPECIES]).slice(0, n); }        // 隨機抽 n 種

// 畫文字（bold 用同色細描邊來加粗，因為這個字型只有一種粗細）
function txt(s, x, y, size, col, al, bold) {
  noStroke(); fill(col); textAlign(al || CENTER, CENTER); textSize(size); textStyle(NORMAL);
  if (bold) { stroke(col); strokeWeight(max(0.8, size * 0.03)); strokeJoin(ROUND); }
  text(s, x, y); noStroke();
}
// 有白色外框的大標題
function titleText(s, x, y, size, col) {
  textAlign(CENTER, CENTER); textSize(size); textStyle(NORMAL); strokeJoin(ROUND);
  fill(255); stroke(255); strokeWeight(size * 0.2); text(s, x, y);
  fill(col); stroke(col); strokeWeight(size * 0.025); text(s, x, y); noStroke();
}
// 把文字縮小到放得進指定寬度，回傳字級
function fitText(s, maxW, size) { textSize(size); while (textWidth(s) > maxW && size > 9) { size -= 1; textSize(size); } return size; }
// 依寬度把中文字串切成多行
function wrapLines(s, maxW, size) {
  textSize(size); const lines = []; let cur = '';
  for (const ch of String(s)) {
    if (ch === '\n') { lines.push(cur); cur = ''; continue; }
    if (textWidth(cur + ch) > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}
// 畫多行文字，回傳結束的 y
function paraText(lines, x, y, size, col, lh, al) {
  noStroke(); fill(col); textAlign(al || LEFT, TOP); textSize(size); textStyle(NORMAL);
  for (const l of lines) { text(l, x, y); y += lh; }
  return y;
}
function shade(c) { const k = color(c); return color(red(k) * 0.88, green(k) * 0.88, blue(k) * 0.88); }

// 按鈕：畫出來並登記成可點擊（o.size 字級、o.txt 字色、o.line 外框色）
function button(x, y, w, h, label, col, fn, o) {
  o = o || {};
  const over = inRect(mouseX, mouseY, { x, y, w, h });
  if (o.line) { stroke(o.line); strokeWeight(2); } else noStroke();
  fill(over ? shade(col) : col); rect(x, y + (over ? 1 : 0), w, h, min(h * 0.32, F(16)));
  noStroke(); fill(o.txt || 255); textAlign(CENTER, CENTER); textStyle(NORMAL);
  textSize(fitText(label, w - F(14), o.size || max(13, h * 0.44)));
  text(label, x + w / 2, y + h / 2 + (over ? 1 : 0));
  btns.push({ x, y, w, h, fn });
}
function pill(x, y, label, col, size) {            // 小標籤，回傳寬度
  textSize(size); textStyle(NORMAL); const w = textWidth(label) + size * 1.1, h = size * 1.7;
  noStroke(); fill(col); rect(x, y, w, h, h / 2);
  fill(255); textAlign(CENTER, CENTER); text(label, x + w / 2, y + h / 2 + 1);
  return w;
}
function kindColor(k) { return k === '特有種' ? '#2e9e4f' : k === '特有亞種' ? '#3b86d6' : '#8a8a8a'; }
function card(x, y, w, h, col) { noStroke(); fill(0, 0, 0, 22); rect(x + 2, y + 4, w, h, F(18)); fill(col || 'rgba(255,255,255,0.92)'); stroke('#b9d6bd'); strokeWeight(2); rect(x, y, w, h, F(18)); noStroke(); }

function backButton(label, fn) { button(F(10), F(8), F(104), F(40), label, '#6a8f72', fn, { size: F(17) }); }
// 遊戲頁上方工具列：返回、標題
function topBar(title, backTo) {
  noStroke(); fill('#d8ecd9'); rect(0, 0, width, BAR);
  txt(title, width / 2, BAR / 2 + 1, fitText(title, width - F(250), F(24)), '#2e6b3a', CENTER, true);
  backButton('← 返回', () => { view = backTo || retView; panel = null; modal = null; confetti = []; confettiFrames = 0; });
}
function drawToast() {
  if (millis() > toastUntil) return;
  const w = min(width * 0.9, F(420)), h = F(42);
  noStroke(); fill('rgba(40,40,40,0.92)'); rect(width / 2 - w / 2, BAR + F(12), w, h, h / 2);
  txt(toastMsg, width / 2, BAR + F(12) + h / 2, fitText(toastMsg, w - F(24), F(17)), '#fff');
}

// ============================================================
//  音量按鈕：平常是小喇叭，滑鼠移上去（手機是點一下）會展開成滑桿，調整整個網頁的音量
// ============================================================
function setVolFromMouse() {
  if (!sliderGeom) return;
  store.vol = constrain((mouseX - sliderGeom.x1) / sliderGeom.trackW, 0, 1);
  store.muted = store.vol === 0;
  applyVolume();
}
function soundWidget() {
  const s = F(44), m = F(10), trackW = F(150), pad = F(14);
  const ix = width - m - s, iy = m, fullW = s + trackW + pad * 2, fx = width - m - fullW;
  const overIcon = inRect(mouseX, mouseY, { x: ix, y: iy, w: s, h: s });
  const overFull = inRect(mouseX, mouseY, { x: fx, y: iy, w: fullW, h: s });
  if (!usingTouch) soundExp = sliderDrag || (soundExp ? overFull : overIcon);
  else soundExp = sliderDrag || millis() < soundOpenUntil;
  const x = soundExp ? fx : ix, w = soundExp ? fullW : s;
  noStroke(); fill(0, 0, 0, 30); rect(x + 2, iy + 3, w, s, s / 2);
  fill(255, 255, 255, 238); stroke('#8fb996'); strokeWeight(2); rect(x, iy, w, s, s / 2); noStroke();
  const v = store.muted ? 0 : store.vol;
  txt(v === 0 ? '🔇' : v < 0.34 ? '🔈' : v < 0.67 ? '🔉' : '🔊', ix + s / 2, iy + s / 2 + 1, s * 0.48, '#000');
  btns.push({ x: ix, y: iy, w: s, h: s, fn: () => {
    if (usingTouch && !soundExp) soundOpenUntil = millis() + 3500;                   // 手機：第一下展開
    else { store.muted = !store.muted; if (!store.muted && store.vol === 0) store.vol = 0.5; saveStore(); applyVolume(); soundOpenUntil = millis() + 3500; }
  } });
  if (soundExp) {
    const x1 = fx + pad, cy = iy + s / 2;
    sliderGeom = { x1, trackW };
    noStroke(); fill('#cfe3d2'); rect(x1, cy - F(3), trackW, F(6), F(3));
    fill('#38b25c'); rect(x1, cy - F(3), trackW * v, F(6), F(3));
    fill(255); stroke('#38b25c'); strokeWeight(2.5); circle(x1 + trackW * v, cy, F(20)); noStroke();
    btns.push({ x: x1 - F(10), y: iy, w: trackW + F(20), h: s, fn: () => { sliderDrag = true; setVolFromMouse(); } });
  }
}

// ============================================================
//  首頁：臺灣島＋原生種，開始、其他
// ============================================================
function drawHome(t) {
  const W = width, H = height;
  drawHomeBackdrop(t);
  let ih, cx, cy, tw, gap;
  if (wide) { ih = H * 0.74; tw = min(W * 0.105, ih * 0.24); gap = 0.35; cx = max(W * 0.29, tw * 1.35 + F(12) + ih * 0.28); cy = H * 0.5; }
  else { ih = min(H * 0.34, W * 0.9); tw = min(W * 0.27, ih * 0.36); gap = -0.25; cx = W / 2; cy = H * 0.3; }
  const box = twBox(cx, cy, ih);
  drawTaiwanIsland(box, t);
  drawIslandPins(box, t, tw, gap);

  // 標題與按鈕
  let tcx, tcy, bw, areaW;
  if (wide) { const rx0 = box.x + box.w + tw * (gap + 1.1), rx1 = W - F(24); areaW = rx1 - rx0; tcx = (rx0 + rx1) / 2; tcy = H * 0.3; bw = min(areaW * 0.85, F(380)); }
  else { areaW = W * 0.94; tcx = W / 2; tcy = H * 0.6; bw = min(W * 0.8, F(380)); }
  const ts = fitText('認識台灣原生種', areaW, F(wide ? 66 : 46));
  titleText('認識台灣原生種', tcx, tcy + sin(t * 1.6) * F(3), ts, '#1f5a34');
  txt('看圖・聽聲音・拖一拖，認識島上的野生動物', tcx, tcy + ts * 0.85, fitText('看圖・聽聲音・拖一拖，認識島上的野生動物', areaW, F(wide ? 22 : 16)), '#2f5f47');
  const bh = F(wide ? 78 : 62), by = wide ? H * 0.52 : H * 0.7, pulse = sin(t * 3) * F(4);
  button(tcx - bw / 2 - pulse, by, bw + pulse * 2, bh, '▶  開始', '#38b25c', goStart, { size: F(wide ? 34 : 28) });
  const sh = F(wide ? 58 : 50), sw = (bw - F(10)) / 2;
  if (FEATURES.F1_startScreen) button(tcx - bw / 2, by + bh + F(16), sw, sh, '📘 學習目標', '#f0a020', () => { view = 'about'; scrollY = 0; }, { size: F(wide ? 22 : 18) });
  button(tcx - bw / 2 + sw + F(10), by + bh + F(16), sw, sh, '✦ 其他', '#4a96e8', () => { view = 'credits'; scrollY = 0; }, { size: F(wide ? 22 : 18) });
  button(tcx - bw / 2, by + bh + F(16) + sh + F(10), bw, sh, '📈 我的進步', '#d9702a', () => openProgress('home'), { size: F(wide ? 22 : 18) });
}
function goStart() { if (store.avatar) view = 'hub'; else startCreate('home'); }

// ============================================================
//  造型編輯：男生／女生、髮型、髮色、膚色、服裝、眼鏡鬍子帽子
// ============================================================
function startCreate(from) {
  cr = { cfg: JSON.parse(JSON.stringify(store.avatar || defaultAvatar('boy'))), from, wave: 0 };
  view = 'create';
}
function chipRow(x, y, w, h, labels, sel, onPick, colors) {           // 一排選項（sel 是被選到的編號，-1 代表都不選）
  const n = labels.length, gap = F(8), cw = (w - gap * (n - 1)) / n;
  labels.forEach((lb, i) => {
    const on = Array.isArray(sel) ? sel[i] : i === sel, cx = x + i * (cw + gap);
    const base = colors ? colors[i] : '#ffffff';
    noStroke(); fill(on ? (colors ? base : '#38b25c') : (colors ? mix(base, '#ffffff', 0.45) : '#ffffff'));
    stroke(on ? '#1f5a34' : '#b9d6bd'); strokeWeight(on ? 3 : 2); rect(cx, y, cw, h, h * 0.32); noStroke();
    textSize(fitText(lb, cw - F(8), max(12, h * 0.46))); textAlign(CENTER, CENTER);
    fill(on ? '#ffffff' : (colors ? '#ffffff' : '#2f4a36')); text(lb, cx + cw / 2, y + h / 2 + 1);
    btns.push({ x: cx, y, w: cw, h, fn: () => onPick(i) });
  });
}
function swatchRow(x, y, w, h, cols, sel, onPick, split) {            // 一排顏色圓點
  const n = cols.length, d = min(h * 0.82, w / n - F(6)), step = (w - d) / max(1, n - 1);
  cols.forEach((c, i) => {
    const cx = x + d / 2 + i * min(step, d + F(14)), cy = y + h / 2;
    noStroke(); fill(0, 0, 0, 25); circle(cx + 1, cy + 2, d);
    if (split) { fill(c); arc(cx, cy, d, d, HALF_PI, PI + HALF_PI); fill(split[i]); arc(cx, cy, d, d, -HALF_PI, HALF_PI); }
    else { fill(c); circle(cx, cy, d); }
    noFill(); stroke(i === sel ? '#1f5a34' : '#ffffff'); strokeWeight(i === sel ? 4 : 2.5); circle(cx, cy, d + (i === sel ? 4 : 0)); noStroke();
    btns.push({ x: cx - d / 2 - 3, y: cy - d / 2 - 3, w: d + 6, h: d + 6, fn: () => onPick(i) });
  });
}
function drawCreate(t) {
  const W = width, H = height, c = cr.cfg;
  drawHubBackdrop(t);
  noStroke(); fill(255, 255, 255, 60); rect(0, 0, W, BAR);
  txt('設計你的探險家', W / 2, BAR / 2 + 1, fitText('設計你的探險家', W - F(250), F(26)), '#1f5a34', CENTER, true);
  backButton(cr.from === 'hub' ? '← 取消' : '← 返回', () => { view = cr.from === 'hub' ? 'hub' : 'home'; });

  // 角色預覽與版面
  let ah, ax, feet, px0, px1, py0, py1;
  if (wide) { ah = min((H - BAR) * 0.7, W * 0.4); ax = W * 0.26; feet = BAR + (H - BAR) * 0.5 + ah / 2; px0 = W * 0.5; px1 = W - F(28); py0 = BAR + F(14); py1 = H - F(20); }
  else { ah = min(H * 0.3, W * 0.55); ax = W / 2; feet = BAR + F(10) + ah; px0 = F(10); px1 = W - F(10); py0 = feet + F(26); py1 = H - F(10); }
  noStroke(); fill(0, 0, 0, 40); ellipse(ax, feet + 2, ah * 0.95, ah * 0.16); fill('#e9d7ae'); ellipse(ax, feet, ah * 0.9, ah * 0.14);
  drawAvatar(ax, feet, ah, c, t, millis() < cr.wave ? 'wave' : 'idle');

  // 選項面板
  const pw = px1 - px0, ph = py1 - py0, bh = F(50), rowH = min(F(60), (ph - bh - F(30)) / 6);
  card(px0, py0, pw, ph, 'rgba(255,255,255,0.88)');
  const labW = F(66), cx0 = px0 + F(16) + labW, cw = pw - F(32) - labW;
  const change = (fn) => (k) => { fn(k); cr.cfg = c; cr.wave = millis() + 1500; };   // 把被點到的編號 k 傳給 fn
  const labels = ['性別', '髮型', '髮色', '膚色', '服裝', '配件'];
  let y = py0 + F(12);
  labels.forEach((lb, i) => {
    txt(lb, px0 + F(16), y + rowH / 2, F(17), '#2e6b3a', LEFT, true);
    const ry = y + rowH * 0.1, rh = rowH * 0.8;
    if (i === 0) chipRow(cx0, ry, cw, rh, ['男生', '女生'], c.g === 'boy' ? 0 : 1, change((k) => { c.g = k === 0 ? 'boy' : 'girl'; c.hair = k === 0 ? 'short' : 'long'; }));
    if (i === 1) chipRow(cx0, ry, cw, rh, HAIR_LENS.map(h => h[1]), HAIR_LENS.findIndex(h => h[0] === c.hair), change((k) => { c.hair = HAIR_LENS[k][0]; }));
    if (i === 2) swatchRow(cx0, ry, cw, rh, HAIR_COLS, c.hc, change((k) => { c.hc = k; }));
    if (i === 3) swatchRow(cx0, ry, cw, rh, SKINS, c.skin, change((k) => { c.skin = k; }));
    if (i === 4) chipRow(cx0, ry, cw, rh, OUTFITS.map(o => o.n), c.outfit, change((k) => { c.outfit = k; }), OUTFITS.map(o => o.jacket));
    if (i === 5) chipRow(cx0, ry, cw, rh, ['眼鏡', '鬍子', '帽子'], [c.glasses, c.beard, c.hat], change((k) => { if (k === 0) c.glasses = !c.glasses; if (k === 1) c.beard = !c.beard; if (k === 2) c.hat = !c.hat; }));
    y += rowH;
  });
  const by = py1 - bh - F(12), bw = (pw - F(48)) / 2;
  button(px0 + F(16), by, bw, bh, '🎲 隨機造型', '#8a6bc8', () => { cr.cfg = randomAvatar(); cr.wave = millis() + 1500; });
  button(px0 + F(32) + bw, by, bw, bh, '✓ 完成', '#38b25c', () => { store.avatar = cr.cfg; saveStore(); view = 'hub'; say('歡迎你，探險家！'); }, { size: F(24) });
}

// ============================================================
//  學習目標：使用對象與學習目標、題型與多媒體（對應 PBL 1-1、1-2）
// ============================================================
function drawAbout(t) {
  const W = width, H = height;
  drawHubBackdrop(t);
  const cw = min(W * 0.92, F(860)), x0 = (W - cw) / 2, ts = F(wide ? 19 : 16), lh = ts * 1.55;
  push(); translate(0, -scrollY);
  let y = BAR + F(24);
  titleText('學習目標', W / 2, y + F(16), F(38), '#1f5a34'); y += F(62);
  const sec = (title, lines, col) => {
    const h = F(46) + lines.length * lh + F(14);
    card(x0, y, cw, h);
    txt(title, x0 + F(18), y + F(24), F(20), col || '#2e6b3a', LEFT, true);
    paraText(lines, x0 + F(18), y + F(42), ts, '#333', lh, LEFT);
    y += h + F(14);
  };
  sec('給誰用', wrapLines(PROJECT.users, cw - F(36), ts));
  sec('玩完之後，你能夠……', PROJECT.goals.flatMap(g => wrapLines(g.id + '. ' + g.text, cw - F(36), ts)), '#e8803a');
  sec('怎麼玩', wrapLines('三種遊戲：拖曳配對、點選闖關（看圖、聽叫聲）、答題解鎖拼圖。每次從 ' + SPECIES.length + ' 種動物抽 ' + GRID_N + ' 種，答對的動物會收進圖鑑；每題作答後馬上看到對錯與解說，成績頁會依學習目標告訴你哪裡還要加強。', cw - F(36), ts));
  pop();
  scrollMax = max(0, y - H + F(10));
  noStroke(); fill(255, 255, 255, 235); rect(0, 0, W, BAR);
  txt('學習目標', W / 2, BAR / 2 + 1, F(24), '#2e6b3a', CENTER, true);
  backButton('← 返回', () => { view = 'home'; });
}
function mediaCreditLines() {                  // 素材清單：設定區的固定項目＋使用者放進 media/ 的照片與聲音
  const L = MEDIA_CREDITS.map(m => '・' + m.item + '：' + m.source + '（' + m.license + '）');
  for (const id in PHOTO_CREDITS) L.push('・照片 ' + id + '：' + PHOTO_CREDITS[id].replace(/^照片：/, ''));
  for (const id in AUDIO_CREDITS) L.push('・叫聲 ' + id + '：' + AUDIO_CREDITS[id]);
  return L;
}

// ============================================================
//  其他：開發人員與資料來源
// ============================================================
function drawCredits(t) {
  const W = width, H = height;
  drawHubBackdrop(t);
  const cw = min(W * 0.92, F(860)), x0 = (W - cw) / 2, gap = F(16);
  push(); translate(0, -scrollY);
  let y = BAR + F(24);
  titleText('開發人員', W / 2, y + F(16), F(38), '#1f5a34'); y += F(64);

  // 兩張人物卡
  const two = wide && cw > F(620), pw = two ? (cw - gap) / 2 : cw, ph = F(170);
  const people = [
    { name: DEV_NAME, role: '開發者', desc: DEV_ROLE, who: 'me' },
    { name: 'Claude（Anthropic AI）', role: 'AI 協作夥伴', desc: '程式撰寫協助・資料查證與整理・介面與流程建議（內容由開發者檢查、修改後採用）', who: 'ai' }
  ];
  people.forEach((p, i) => {
    const px = two ? x0 + i * (pw + gap) : x0, py = two ? y : y + i * (ph + gap);
    card(px, py, pw, ph);
    const ix = px + F(14) + F(54);
    if (p.who === 'me') { drawAvatar(ix, py + ph - F(12), ph - F(34), DEV_AVATAR, t, 'idle'); }
    else {                                               // AI 的小圖示：橘色圓形＋四角星
      const r = F(46), ay = py + ph / 2 - F(8) + sin(t * 2) * F(3);
      noStroke(); fill('#e8803a'); circle(ix, ay, r * 2); fill(255);
      for (let k = 0; k < 4; k++) { push(); translate(ix, ay); rotate(k * HALF_PI + t * 0.4); triangle(-r * 0.14, 0, r * 0.14, 0, 0, -r * 0.7); pop(); }
      circle(ix, ay, r * 0.28);
    }
    const tx = px + F(14) + F(120), tw = pw - F(134) - F(10);
    pill(tx, py + F(16), p.role, p.who === 'me' ? '#38b25c' : '#e8803a', F(15));
    txt(p.name, tx, py + F(62), fitText(p.name, tw, F(26)), '#1f3a28', LEFT, true);
    paraText(wrapLines(p.desc, tw, F(15)), tx, py + F(86), F(15), '#4a5a4e', F(15) * 1.45, LEFT);
  });
  y += two ? ph + gap : (ph + gap) * 2;

  // 作品與資料來源
  const info = [
    ['作品', '認識台灣原生種・多媒體測驗系統（PBL 專題：設計我的多媒體測驗系統）'],
    ['技術', 'p5.js 1.10.0・Web Audio API（音效與背景音樂皆為程式合成）・Google Fonts「Chocolate Classical Sans」（SIL OFL 1.1）'],
    ['素材清單', mediaCreditLines().join('\n')],
    ['資料來源', '農業部林業及自然保育署、特有生物研究保育中心、雪霸國家公園管理處、公視新聞、中央社等公開資料整理。解說為教學用整理，保育等級可能隨公告調整。']
  ];
  const ts = F(16), lw = F(78);
  const rows = info.map(r => wrapLines(r[1], cw - lw - F(36), ts));
  const ih = rows.reduce((s, l) => s + l.length * ts * 1.5 + F(14), F(24));
  card(x0, y, cw, ih);
  let iy = y + F(18);
  info.forEach((r, i) => { txt(r[0], x0 + F(18), iy + ts * 0.75, ts, '#2e6b3a', LEFT, true); paraText(rows[i], x0 + F(18) + lw, iy, ts, '#333', ts * 1.5, LEFT); iy += rows[i].length * ts * 1.5 + F(14); });
  y += ih + F(30);
  pop();
  scrollMax = max(0, y - H + F(10));

  noStroke(); fill(255, 255, 255, 235); rect(0, 0, W, BAR);                      // 固定在上方的返回鈕
  txt('其他', W / 2, BAR / 2 + 1, F(24), '#2e6b3a', CENTER, true);
  backButton('← 返回', () => { view = 'home'; });
}
