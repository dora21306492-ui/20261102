// ============================================================
//  延伸功能：成就、每日挑戰、明信片拍照
// ============================================================

// ---------- 小工具：日期 ----------
function dateStr(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function todayStr() { return dateStr(new Date()); }
function yesterdayStr() { return dateStr(new Date(Date.now() - 86400000)); }
function dailyDone() { return store.lastDaily === todayStr(); }

// ============================================================
//  成就（共 10 個，條件達成就自動點亮）
// ============================================================
const ACHS = [
  { id: 'first', e: '🌱', n: '初次探險', d: '完成任何一個遊戲', ok: () => totalPlays() > 0 },
  { id: 'perfect', e: '💯', n: '滿分達人', d: '任一遊戲拿到全部答對', ok: () => !!store.perfect },
  { id: 'three', e: '🧭', n: '全能挑戰者', d: '拖曳、闖關、拼圖都玩過', ok: () => (store.plays.drag || 0) > 0 && (store.plays.quiz || 0) > 0 && (store.plays.puzzle || 0) > 0 },
  { id: 'dex5', e: '📖', n: '圖鑑新手', d: '圖鑑收集 5 種', ok: () => dexCount() >= 5 },
  { id: 'dexall', e: '🏆', n: '生態大師', d: '圖鑑集滿全部物種', ok: () => dexCount() >= SPECIES.length },
  { id: 'daily', e: '📅', n: '每日打卡', d: '完成一次每日挑戰', ok: () => (store.plays.daily || 0) > 0 },
  { id: 'kind3', e: '🧐', n: '分得清楚', d: '「特有種還是特有亞種」答對 3 題', ok: () => (store.kindOk || 0) >= 3 },
  { id: 'photo', e: '📷', n: '野外攝影師', d: '下載一張明信片', ok: () => (store.photos || 0) > 0 },
  { id: 'beat', e: '🚀', n: '打敗自己', d: '正確率比上一次更高', ok: () => !!store.beat },
  { id: 'fast', e: '⚡', n: '刷新速度', d: '刷新自己的最快時間', ok: () => !!store.fast }
];
function totalPlays() { return Object.values(store.plays).reduce((a, b) => a + b, 0); }
function achCount() { return ACHS.filter(a => store.ach[a.id]).length; }
function checkAch() {                      // 每次可能達成條件的時候呼叫一次
  for (const a of ACHS) {
    if (!store.ach[a.id] && a.ok()) { store.ach[a.id] = 1; saveStore(); say('🏅 成就解鎖：' + a.n); sfx('win'); }
  }
}
// 每次玩完遊戲都登記一次（buildPanel 會呼叫）
function recordPlay(mode, score, total) {
  store.plays[mode] = (store.plays[mode] || 0) + 1;
  if (score === total) store.perfect = true;
  saveStore(); checkAch();
}

// ============================================================
//  每日挑戰：每天固定抽同一組 5 種（日期當亂數種子），答完登記連續天數
// ============================================================
function seededPick(n) {
  let seed = 0; for (const ch of todayStr()) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = [...SPECIES];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
function startDaily() { startMC('quiz', seededPick(5), true); }
function completeDaily() {                 // 完成每日挑戰：只有當天第一次算連續天數
  const today = todayStr();
  if (store.lastDaily !== today) {
    store.streak = store.lastDaily === yesterdayStr() ? (store.streak || 0) + 1 : 1;
    store.maxStreak = max(store.maxStreak || 0, store.streak);
    store.lastDaily = today;
  }
  saveStore();
}

// ============================================================
//  成就頁
// ============================================================
function drawAchv(t) {
  const W = width, H = height;
  topBar('🏅 成就');
  const head = '已點亮 ' + achCount() + ' / ' + ACHS.length + '　連續每日挑戰 ' + (store.streak || 0) + ' 天（最長 ' + (store.maxStreak || 0) + ' 天）';
  txt(head, W / 2, BAR + F(24), fitText(head, W - F(20), F(18)), '#557a5c');
  const cols = wide ? 4 : 2, rows = ceil(ACHS.length / cols), top = BAR + F(50), g = F(12);
  const cw = (W - g * (cols + 1)) / cols, ch = min((H - top - g * (rows + 1)) / rows, F(190));
  ACHS.forEach((a, i) => {
    const x = g + (i % cols) * (cw + g), y = top + g + floor(i / cols) * (ch + g), on = !!store.ach[a.id];
    card(x, y, cw, ch, on ? '#fff8dc' : 'rgba(225,232,226,0.9)');
    const r = min(cw * 0.2, ch * 0.24);
    noStroke(); fill(on ? '#f2c14e' : '#b7c1ba'); circle(x + cw / 2, y + ch * 0.3, r * 2.1);
    txt(on ? a.e : '🔒', x + cw / 2, y + ch * 0.3 + 2, r * 1.15, '#000');
    txt(a.n, x + cw / 2, y + ch * 0.58, fitText(a.n, cw - F(14), F(wide ? 20 : 18)), on ? '#7a5a10' : '#6b756e', CENTER, true);
    const ls = wrapLines(a.d, cw - F(18), F(wide ? 15 : 14));
    paraText(ls.slice(0, 2), x + cw / 2 - (cw - F(18)) / 2, y + ch * 0.7, F(wide ? 15 : 14), on ? '#5a4a20' : '#707a73', F(wide ? 15 : 14) * 1.4, LEFT);
  });
}

// ============================================================
//  明信片拍照模式：真實照片（media/物種代號.jpg）為主圖，遊戲插圖與玩家角色在下方，可下載成圖片
// ============================================================
let pc = { i: 0, save: false };
function photoList() { return SPECIES.filter(s => s.photo && s.photo.width > 0); }     // 只有放了真實照片的物種才能拍明信片
// 照片完整顯示（直式、橫式都不裁切）：背後用同一張照片放大模糊鋪滿，前面再放完整照片
function drawPhotoFit(img, x, y, w, h) {
  if (!img._bg) {                                               // 縮成小圖當模糊背景（放大時自然變模糊，也比每幀做 blur 省效能）
    const k = 110 / max(img.width, img.height), g = createGraphics(max(2, floor(img.width * k)), max(2, floor(img.height * k)));
    g.image(img, 0, 0, g.width, g.height); img._bg = g;
  }
  const ctx = drawingContext; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const cv = max(w / img._bg.width, h / img._bg.height);
  image(img._bg, x + (w - img._bg.width * cv) / 2, y + (h - img._bg.height * cv) / 2, img._bg.width * cv, img._bg.height * cv);
  noStroke(); fill(0, 0, 0, 95); rect(x, y, w, h);
  const sc = min(w / img.width, h / img.height);
  image(img, x + (w - img.width * sc) / 2, y + (h - img.height * sc) / 2, img.width * sc, img.height * sc);
  ctx.restore();
}
// 照片右下角的出處條（x,yBottom 為照片區右下角位置）
function photoCreditBar(cr, x, yBottom, w, size) {
  const cs = fitText(cr, w - size * 1.6, size); textSize(cs);
  const cbw = min(w, textWidth(cr) + cs * 1.6);
  noStroke(); fill(0, 0, 0, 120); rect(x + w - cbw, yBottom - cs * 1.9, cbw, cs * 1.9);
  txt(cr, x + w - cbw + cs * 0.8, yBottom - cs * 0.95, cs, '#fff', LEFT);
}

function drawPostcard(x, y, w, h, sp, t) {
  const pad = w * 0.035, port = h > w * 0.9;                 // 直式卡片（手機或直式照片）或橫式卡片（電腦）
  const phPort = sp.photo && sp.photo.height > sp.photo.width, side = !port && phPort;   // 橫式卡片＋直式照片＝照片靠左、文字靠右
  noStroke(); fill(0, 0, 0, 45); rect(x + 4, y + 7, w, h, w * 0.02);
  fill('#fbf5e6'); stroke('#dccfae'); strokeWeight(2); rect(x, y, w, h, w * 0.02); noStroke();
  const cr = PHOTO_CREDITS[sp.id] || '照片來源請見 media/出處.txt';
  const px = x + pad, py = y + pad, pw = side ? w * 0.4 : w - pad * 2, ph = side ? h - pad * 2 : h * (port ? 0.52 : 0.6);
  drawPhotoFit(sp.photo, px, py, pw, ph);
  noFill(); stroke(255); strokeWeight(3); rect(px, py, pw, ph); noStroke();
  photoCreditBar(cr, px, py + ph, pw, min(w * 0.026, F(13)));
  if (side) {
    const rx = px + pw + pad * 1.5, rw = x + w - pad - rx, stamp = w * 0.13;
    noStroke(); txt(sp.name, rx, y + pad + h * 0.1, fitText(sp.name, rw - stamp * 1.5, h * 0.13), '#1f5a34', LEFT, true);
    pill(rx, y + pad + h * 0.2, sp.kind, kindColor(sp.kind), h * 0.05);
    const tw = rw * 0.52, thh = tw * 0.75, ty = y + h * 0.42;
    fill(255); rect(rx - 3, ty - 3, tw + 6, thh + 6, 6); drawScene(sp, rx, ty, tw, thh);
    txt('來自台灣的問候', rx, ty + thh + h * 0.08, fitText('來自台灣的問候', rw, h * 0.05), '#6a7a6e', LEFT);
    if (store.avatar) drawAvatar(rx + tw + (rw - tw) / 2, y + h - pad * 0.7, h * 0.46, store.avatar, t, 'wave');
    drawStamp(x + w - pad - stamp * 0.7, y + pad + stamp * 0.7, stamp);
    return;
  }
  // ---- 下方：玩家角色＋遊戲插圖＋文字；郵票 ----
  const sy = py + ph + pad * 0.6, sh = y + h - pad - sy, ps = min(sh * 0.17, w * 0.034);
  const stamp = port ? w * 0.17 : sh * 0.62;
  if (port) {
    const aw = sh * 1.3, tx = px + sh * 0.78, tw = px + pw - tx, thh = min(tw * 0.55, sh * 0.62);
    if (store.avatar) drawAvatar(px + sh * 0.4, y + h - pad * 0.7, aw, store.avatar, t, 'wave');
    noStroke(); fill(255); rect(tx - 3, sy + pad * 0.3 - 3, tw + 6, thh + 6, 6); drawScene(sp, tx, sy + pad * 0.3, tw, thh);
    const ny = sy + pad * 0.3 + thh + sh * 0.14;
    const pz = sh * 0.1; textSize(pz); const pwid = textWidth(sp.kind) + pz * 1.1;
    txt(sp.name, tx, ny, fitText(sp.name, tw - pwid - sh * 0.06, sh * 0.19), '#1f5a34', LEFT, true);
    pill(tx + tw - pwid, ny - pz * 0.85, sp.kind, kindColor(sp.kind), pz);
    txt('來自台灣的問候', tx, ny + sh * 0.2, sh * 0.1, '#6a7a6e', LEFT);
    drawStamp(x + w - pad - stamp * 0.7, py + stamp * 0.7, stamp);
  } else {
    const tw = sh * 1.15, thh = sh * 0.8, tx = px + sh * 0.95;
    if (store.avatar) drawAvatar(px + sh * 0.5, y + h - pad * 0.7, sh * 1.55, store.avatar, t, 'wave');
    noStroke(); fill(255); rect(tx - 3, sy + sh * 0.1 - 3, tw + 6, thh + 6, 6); drawScene(sp, tx, sy + sh * 0.1, tw, thh);
    const textX = tx + tw + pad * 1.2, textW = x + w - pad - stamp - pad * 1.2 - textX;
    if (textW > 40) {
      txt(sp.name, textX, sy + sh * 0.2, fitText(sp.name, textW, min(sh * 0.3, w * 0.07)), '#1f5a34', LEFT, true);
      pill(textX, sy + sh * 0.38, sp.kind, kindColor(sp.kind), ps);
      const cap = textW > ps * 19 ? '來自台灣的問候　Greetings from Taiwan' : '來自台灣的問候';
      txt(cap, textX, sy + sh * 0.78, fitText(cap, textW, ps), '#6a7a6e', LEFT);
    }
    drawStamp(x + w - pad - stamp / 2, sy + sh * 0.5, stamp);
  }
}
function drawStamp(cx, cy, stamp) {                           // 郵票與郵戳
  push(); translate(cx, cy); rotate(0.05);
  fill('#fff'); stroke('#cbbf9d'); strokeWeight(2); rect(-stamp / 2, -stamp / 2, stamp, stamp, 4);
  noStroke(); fill('#d9efe0'); rect(-stamp * 0.4, -stamp * 0.4, stamp * 0.8, stamp * 0.8, 3);
  txt('🌿', 0, -stamp * 0.08, stamp * 0.42, '#000'); txt('TAIWAN', 0, stamp * 0.28, stamp * 0.15, '#2e6b3a', CENTER, true);
  noFill(); stroke(200, 70, 70, 150); strokeWeight(2); circle(-stamp * 0.55, stamp * 0.1, stamp * 0.8); noStroke();
  pop();
}
let AUDIO_CREDITS = {};                                      // 物種代號 → 叫聲的「作者｜授權」（media/出處.txt 裡用 audio:代號 開頭）
let PHOTO_CREDITS = {};                                      // 物種代號 → 「作者｜授權」，由 media/出處.txt 讀入

function drawPhoto(t) {
  const W = width, H = height;
  background('#d9c8a6');
  noStroke(); fill(0, 0, 0, 10); for (let i = 0; i < 14; i++) rect(0, i * H / 7, W, H / 14);
  topBar('📷 明信片拍照');
  const list = photoList();
  if (!list.length) {
    card(W / 2 - min(W * 0.44, F(300)), H * 0.3, min(W * 0.88, F(600)), F(150));
    const s = '還沒有放入任何動物照片喔！\n把照片放進 media 資料夾（檔名＝動物代號.jpg），有照片的動物才能拍明信片。';
    paraText(wrapLines(s, min(W * 0.8, F(540)), F(20)), W / 2 - min(W * 0.4, F(270)), H * 0.3 + F(26), F(20), '#2f4a36', F(30), LEFT);
    return;
  }
  pc.i = (pc.i + list.length) % list.length;
  const sp = list[pc.i], ctlH = F(130), ar = sp.photo.height > sp.photo.width ? (wide ? 1.4 : 0.72) : (wide ? 1.5 : 0.8);   // 依照片直式／橫式決定明信片比例
  const aw = W - F(24), ah = H - BAR - F(14) - ctlH;
  let cw = min(aw, ah * ar), ch = cw / ar; if (ch > ah) { ch = ah; cw = ch * ar; }
  const cx = (W - cw) / 2, cy = BAR + F(10) + (ah - ch) / 2;
  drawPostcard(cx, cy, cw, ch, sp, t);
  if (pc.save) {                                              // 在畫出明信片的這一刻把那塊畫面存成圖片
    pc.save = false;
    try { const im = get(floor(cx), floor(cy), ceil(cw), ceil(ch)); im.save('明信片_' + sp.name, 'png'); store.photos = (store.photos || 0) + 1; saveStore(); say('📥 已下載「' + sp.name + '」明信片'); checkAch(); }
    catch (e) { say('下載失敗，請換個瀏覽器試試'); }
  }
  const by = H - ctlH + F(10), bh = F(54), sw = F(64), gx = min(F(150), W / 2 - sw - F(8));
  button(W / 2 - gx - sw, by, sw, bh, '◀', '#6a8f72', () => { pc.i--; }, { size: F(26) });
  button(W / 2 + gx, by, sw, bh, '▶', '#6a8f72', () => { pc.i++; }, { size: F(26) });
  button(W / 2 - gx + F(10), by, 2 * gx - F(20), bh, '💾 下載明信片', '#e8803a', () => { pc.save = true; }, { size: F(23) });
  txt((pc.i + 1) + ' / ' + list.length + '　' + sp.name, W / 2, by + bh + F(26), F(19), '#4a3f28');
}

// ============================================================
//  共用小工具：計時、測試紀錄、影片
// ============================================================
function mmss(ms) { const s = floor(ms / 1000); return String(floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
// PBL 3-5 測試紀錄：作答完在 Console（F12）印出每一題的結果
function printTestLog(title, rows) {
  try { console.log('【' + PROJECT.title + '】' + title); console.table(rows); } catch (err) {}
}
// 影片題：media/物種代號.mp4（選用）。載入成功才會出「看影片」題
function loadVideos() {
  for (const sp of SPECIES) {
    sp.vid = null; sp.vidOk = false;
    try {
      const v = createVideo(['media/' + sp.id + '.mp4']); v.hide(); v.elt.preload = 'metadata'; v.elt.playsInline = true;
      v.elt.addEventListener('loadeddata', () => { sp.vidOk = true; });
      v.elt.addEventListener('error', () => { sp.vidOk = false; });
      sp.vid = v;
    } catch (err) {}
  }
}
function stopVideos() { for (const sp of SPECIES) if (sp.vid && sp.vidOk) { try { sp.vid.pause(); } catch (err) {} } }
function toggleVideo(sp) {
  if (!sp.vid || !sp.vidOk) return;
  if (sp.vid.elt.paused) { sp.vid.volume(effectiveVolume()); sp.vid.loop(); sp.vid.play(); } else sp.vid.pause();
}

// ============================================================
//  畫面質感：野外手冊風格（等高線背景、貼膠帶的圖版、貼紙、標本標籤式選項）
//  主色：藍鵲藍（編號與進度）、森林綠（答對）、喙紅（答錯）；背景是淡淡的山區等高線
// ============================================================
const ART = { blue: '#2f5f9e', blueSoft: '#dbe7f6', ink: '#1f3a2a', paper: '#fffdf6', tape: 'rgba(240,196,84,0.78)' };
function drawFieldBg() {
  background('#e6efdc');
  noFill(); strokeWeight(1.6);
  const cx = width * 0.82, cy = height * 0.18;
  for (let k = 1; k <= 11; k++) {                               // 一圈圈的山形等高線（固定亂數種子，每幀形狀相同）
    stroke(150, 185, 140, 70 - k * 3); beginShape();
    for (let a = 0; a <= TWO_PI + 0.2; a += 0.2) {
      const r = k * max(width, height) * 0.075 * (1 + 0.16 * sin(a * 3 + k * 0.7) + 0.08 * cos(a * 5 - k));
      curveVertex(cx + cos(a) * r * 1.25, cy + sin(a) * r);
    }
    endShape();
  }
  noStroke();
}
// 圖版：白色相紙＋兩條膠帶，裡面放照片或插圖（fn 負責畫內容）
function drawPlate(x, y, w, h, fn) {
  const m = F(7);
  noStroke(); fill(0, 0, 0, 28); rect(x - m + 2, y - m + 5, w + m * 2, h + m * 2, F(6));
  fill(ART.paper); rect(x - m, y - m, w + m * 2, h + m * 2, F(6));
  fn(x, y, w, h);
  noFill(); stroke(0, 0, 0, 38); strokeWeight(1); rect(x, y, w, h); noStroke();
  for (const sx of [-1, 1]) {                                   // 膠帶
    push(); translate(x + (sx < 0 ? w * 0.08 : w * 0.92), y - m); rotate(sx * 0.35);
    fill(ART.tape); rect(-F(22), -F(8), F(44), F(16)); pop();
  }
}
// 貼紙：原本的可愛動畫動物，貼在照片的角落
function drawSticker(sp, x, y, w, h) {
  push(); translate(x + w / 2, y + h / 2); rotate(0.06);
  noStroke(); fill(0, 0, 0, 40); rect(-w / 2 + 2, -h / 2 + 4, w, h, F(10));
  fill('#fff'); rect(-w / 2 - F(4), -h / 2 - F(4), w + F(8), h + F(8), F(12));
  drawScene(sp, -w / 2, -h / 2, w, h);
  pop();
}
