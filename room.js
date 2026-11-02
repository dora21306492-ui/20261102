// ============================================================
//  頁面A：探險家工作站（房間）＋桌面第一視角＋新手教學＋知識翻頁卡
//  房間：角色可以走動（點地板／方向鍵／WASD），走到桌子前進入桌面；
//        牆上有公告板（每日挑戰）、獎狀櫃（成就）、鏡子（換造型）
//  桌面：圖鑑冊、考卷（點選闖關）、拼圖盒、配對卡片（拖曳）、相機（明信片）
// ============================================================

// 開發人員頁固定顯示的角色造型（中長髮、戴眼鏡的女生）
const DEV_AVATAR = { g: 'girl', hair: 'mid', hc: 0, skin: 1, glasses: true, beard: false, hat: false, outfit: 0 };
// 字型要預先載入的新介面文字
const EXTRA_CHARS = '探險家工作站桌面房間每日挑戰成就獎狀櫃鏡子公告板新手教學下一步略過開始探險明信片拍照下載圖鑑冊考卷拼圖盒配對卡片相機小知識重看教學點地板方向鍵走動走到桌子前連續天數已完成今日尚未解鎖初次滿分達人全能挑戰者圖鑑新手生態大師每日打卡連續三天野外攝影師來自台灣的問候';

let retView = 'hub';                  // 遊戲、圖鑑按「返回」要回到哪一頁（房間或桌面）
let rm = { x: -1, y: -1, tx: -1, ty: -1, act: null, rect: null, hello: 0 };   // 房間裡角色的位置、目標與到達後要做的事
let roomLay = null;                   // 這一個影格的房間版面（教學要用）
let tut = null;                       // 新手教學進度 { i }

// ============================================================
//  共用：探險家證（等級卡）、知識翻頁卡
// ============================================================
function levelCard() {
  const n = dexCount(), lv = levelInfo(n), s = F(44), cw = min(W_ok() - F(104) - F(80) - F(16) - F(50), F(250));
  const chx = width - F(10) - s - F(10) - cw, chy = F(10), chh = F(44);
  noStroke(); fill(0, 0, 0, 30); rect(chx + 2, chy + 3, cw, chh, F(14));
  fill(255, 255, 255, 238); stroke('#8fb996'); strokeWeight(2); rect(chx, chy, cw, chh, F(14)); noStroke();
  const lt = 'Lv.' + lv.lv + ' ' + lv.name;
  txt(lt, chx + F(10), chy + chh * 0.32, fitText(lt, cw - F(20), F(15)), '#2e6b3a', LEFT, true);
  fill('#d5e5d6'); rect(chx + F(10), chy + chh * 0.62, cw - F(70), F(8), F(4));
  fill('#38b25c'); rect(chx + F(10), chy + chh * 0.62, (cw - F(70)) * n / SPECIES.length, F(8), F(4));
  txt(n + '/' + SPECIES.length, chx + cw - F(10), chy + chh * 0.67, F(14), '#2f4a36', RIGHT);
  return { x: chx, y: chy, w: cw, h: chh };
}
function W_ok() { return width; }

// 固定高度的知識翻頁卡：外框不動，按左右箭頭（或每 7 秒自動）時，裡面的文字整段左右滑動換頁；點卡片中間看完整介紹
let tipSt = { idx: -1, from: 0, dir: 1, a0: -9, last: 0 };
function tipLines(idx, maxW) {
  const sp = SPECIES[idx], full = sp.name + '（' + sp.kind + '）：' + sp.info.split('。').filter(s => s).slice(0, 2).join('。') + '。';
  let ts = F(wide ? 18 : 16), lines = wrapLines('💡 ' + full, maxW, ts);
  while (lines.length > 2 && ts > F(11)) { ts -= 1; lines = wrapLines('💡 ' + full, maxW, ts); }
  if (lines.length > 2) { let l2 = lines[1]; while (l2.length > 1 && textWidth(l2 + '…') > maxW) l2 = l2.slice(0, -1); lines = [lines[0], l2 + '…']; }
  return { lines, ts };
}
function tipCard(x, y, w, h, t) {
  const per = 7, L = SPECIES.length, arw = F(34), pad = F(12), maxW = w - arw * 2 - pad, SLIDE = 0.38;
  if (tipSt.idx < 0) { tipSt.idx = floor(random(L)); tipSt.last = t; }
  const go = d => { tipSt.from = tipSt.idx; tipSt.idx = ((tipSt.idx + d) % L + L) % L; tipSt.dir = d; tipSt.a0 = t; tipSt.last = t; };
  if (t - tipSt.a0 > SLIDE && t - tipSt.last >= per) go(1);                    // 自動換頁
  const sp = SPECIES[tipSt.idx], hov = inRect(mouseX, mouseY, { x: x + arw, y, w: w - arw * 2, h });
  noStroke(); fill(0, 0, 0, 24); rect(x + 2, y + 4, w, h, F(14));
  fill(hov ? '#fffdf2' : 'rgba(255,255,255,0.92)'); stroke(hov ? '#e0b84a' : '#b9d6bd'); strokeWeight(2); rect(x, y, w, h, F(14)); noStroke();
  // 內容區：只在左右箭頭之間，滑動的文字被切在這個範圍裡
  const ctx = drawingContext, cx0 = x + arw, cw0 = w - arw * 2, p = constrain((t - tipSt.a0) / SLIDE, 0, 1), e = 1 - pow(1 - p, 3);
  ctx.save(); ctx.beginPath(); ctx.rect(cx0, y + 2, cw0, h - 4); ctx.clip();
  const drawOne = (idx, off) => {
    const o = tipLines(idx, maxW), lh = o.ts * 1.45, top = y + (h - lh * o.lines.length) / 2;
    paraText(o.lines, cx0 + off, top, o.ts, '#2f4a36', lh, LEFT);
  };
  if (p < 1) { drawOne(tipSt.from, -tipSt.dir * e * cw0); drawOne(tipSt.idx, tipSt.dir * (1 - e) * cw0); }
  else drawOne(tipSt.idx, 0);
  ctx.restore();
  for (let i = 0; i < L; i++) { fill(i === tipSt.idx ? '#38b25c' : '#cfe0d2'); circle(x + w - arw - F(4) - (L - 1 - i) * F(5), y + h - F(7), F(3.4)); }
  [['◀', x, -1], ['▶', x + w - arw, 1]].forEach(([s, bx, d]) => {
    const over = inRect(mouseX, mouseY, { x: bx, y, w: arw, h });
    noStroke(); fill(over ? '#38b25c' : '#a9d3a4'); circle(bx + arw / 2, y + h / 2, F(26)); txt(s, bx + arw / 2 + (d < 0 ? -1 : 1), y + h / 2 + 1, F(12), '#fff', CENTER, true);
    btns.push({ x: bx, y, w: arw, h, fn: () => go(d) });
  });
  btns.push({ x: x + arw, y, w: w - arw * 2, h, fn: () => { modal = sp; } });
  return { x, y, w, h };
}

// ============================================================
//  房間
// ============================================================
function drawRoom(t) {
  const W = width, H = height, dt = min(0.05, deltaTime / 1000);
  if (!store.lesson) openLesson('hub');                     // 第一次進來，先上一點「特有種」小教室
  if (!store.tut && !tut) tut = { i: 0 };
  const fy = round(H * (wide ? 0.5 : 0.42));                   // 牆與地板的交界
  const lay = { fy };
  // ---- 牆與地板 ----
  gradRect(0, 0, W, fy, '#eef5df', '#d9e8cc');
  noStroke(); fill(255, 255, 255, 60); for (let x = 0; x < W; x += F(54)) rect(x, 0, F(26), fy);   // 淡淡的直條壁紙
  fill('#c99a64'); rect(0, fy - F(8), W, F(14));                // 踢腳板
  gradRect(0, fy + F(6), W, H - fy, '#e3bd88', '#c99a64');
  stroke(120, 80, 40, 38); strokeWeight(1.5);                   // 地板木紋（越近越寬）
  for (let i = 1; i < 9; i++) { const yy = fy + (H - fy) * pow(i / 9, 1.5); line(0, yy, W, yy); }
  for (let i = -8; i <= 8; i++) line(W / 2 + i * F(28), fy + F(8), W / 2 + i * F(130), H);
  noStroke();

  // ---- 牆上的物件 ----
  const itemH = constrain(fy - BAR - F(40), F(90), F(200)), iy = BAR + (fy - BAR - itemH - F(26)) * 0.35 + F(2);
  const hang = (k, fx, w, h, draw, label, sub, fn) => {
    const x = W * fx - w / 2, y = iy + (itemH - h) / 2, hit = { x, y, w, h: h + F(34) }, hov = inRect(mouseX, mouseY, hit) && !tut;
    push(); translate(x + w / 2, y + h / 2); scale(hov && fn ? 1.05 : 1); draw(-w / 2, -h / 2, w, h); pop();
    if (label) { const ls = F(wide ? 17 : 15); textSize(ls); const lw = textWidth(label) + ls * 1.1; pill(x + w / 2 - lw / 2, y + h + F(6), label, sub, ls); }
    if (fn) btns.push({ x: hit.x, y: hit.y, w: hit.w, h: hit.h, fn });
    lay[k] = { x: x - F(6), y: y - F(6), w: w + F(12), h: h + F(40) };
  };
  const walkWall = (nx, act) => () => walkTo(W * nx, fy + (H - fy) * 0.34, act);
  const bw = wide ? min(W * 0.15, itemH * 1.0) : min(W * 0.2, itemH * 0.9);
  hang('board', wide ? 0.14 : 0.13, bw, itemH, (x, y, w, h) => drawBoard(x, y, w, h, t), '每日挑戰', '#e8803a', walkWall(wide ? 0.14 : 0.13, () => openDailyIntro('hub')));
  hang('mirror', wide ? 0.31 : 0.63, itemH * 0.52, itemH, (x, y, w, h) => drawMirror(x, y, w, h, t), '換造型', '#8a6bc8', walkWall(wide ? 0.31 : 0.63, () => startCreate('hub')));
  hang('kb', wide ? 0.69 : 0.37, bw * (wide ? 0.85 : 1), itemH * (wide ? 0.9 : 1), (x, y, w, h) => drawKBNote(x, y, w, h, t), '知識庫', '#2e9e8f', walkWall(wide ? 0.69 : 0.37, () => openKB('hub')));
  if (wide) {
    hang('frame', 0.5, itemH * 1.05, itemH * 0.78, (x, y, w, h) => drawFrame(x, y, w, h, t), '更換展示動物', '#8a6bc8', walkWall(0.5, () => openShowcase('hub')));
  }
  hang('shelf', wide ? 0.86 : 0.87, bw, itemH, (x, y, w, h) => drawShelf(x, y, w, h, t), '成就 ' + achCount() + '/' + ACHS.length, '#d9a21f', walkWall(wide ? 0.86 : 0.87, () => { retView = 'hub'; view = 'achv'; }));

  // ---- 桌子 ----
  const tw = wide ? min(W * 0.3, F(340)) : min(W * 0.66, F(260)), tx = W / 2, y0 = fy + (H - fy) * 0.16, slab = tw * 0.07, legs = tw * 0.26, base = y0 + slab + legs;
  lay.table = { x: tx - tw / 2, y: y0 - tw * 0.16, w: tw, h: base - y0 + tw * 0.16 + F(40) };
  lay.base = base;
  // 地毯
  noStroke(); fill('#8fbf8f'); ellipse(tx, base - legs * 0.1, tw * 1.5, tw * 0.5); fill('#a9d3a4'); ellipse(tx, base - legs * 0.1, tw * 1.3, tw * 0.4);

  // ---- 角色：位置更新 ----
  const yMin = fy + (H - fy) * 0.3, yMax = H - (H < 520 ? F(14) : F(78)), xMin = F(46), xMax = W - F(46);
  if (rm.x < 0) { rm.x = W * (wide ? 0.3 : 0.2); rm.y = min(yMax, base + F(48)); rm.hello = millis() + 2500; }
  rm.x = constrain(rm.x, xMin, xMax); rm.y = constrain(rm.y, yMin, yMax);
  const spd = max(W, H) * 0.42 * dt;
  let moving = false;
  const kx = (keyIsDown(RIGHT_ARROW) || keyIsDown(68) ? 1 : 0) - (keyIsDown(LEFT_ARROW) || keyIsDown(65) ? 1 : 0);
  const ky = (keyIsDown(DOWN_ARROW) || keyIsDown(83) ? 1 : 0) - (keyIsDown(UP_ARROW) || keyIsDown(87) ? 1 : 0);
  if ((kx || ky) && !tut) { rm.x += kx * spd; rm.y += ky * spd * 0.8; rm.tx = -1; rm.act = null; moving = true; }
  else if (rm.tx >= 0) {
    const dx = rm.tx - rm.x, dy = rm.ty - rm.y, d = sqrt(dx * dx + dy * dy);
    if (d <= spd + 1) { rm.x = rm.tx; rm.y = rm.ty; rm.tx = -1; const a = rm.act; rm.act = null; if (a) a(); }
    else { rm.x += dx / d * spd; rm.y += dy / d * spd; moving = true; }
  }
  rm.x = constrain(rm.x, xMin, xMax); rm.y = constrain(rm.y, yMin, yMax);

  // 繪製順序：腳在桌子後面（y 比較小）→ 先畫角色再畫桌子；否則先畫桌子
  const baseH = wide ? min(H * 0.34, W * 0.2) : min(H * 0.27, W * 0.55), depth = (rm.y - fy) / (H - fy);
  const ah = baseH * lerp(0.84, 1.1, constrain(depth, 0, 1));
  const body = { x: rm.x - ah * 0.3, y: rm.y - ah, w: ah * 0.6, h: ah };
  rm.rect = { x: body.x - F(10), y: body.y - F(10), w: body.w + F(20), h: body.h + F(20) };
  const anim = moving ? 'walk' : (millis() < rm.hello || inRect(mouseX, mouseY, body) ? 'wave' : 'idle');
  const drawMe = () => { noStroke(); fill(0, 0, 0, 36); ellipse(rm.x, rm.y + 2, ah * 0.6, ah * 0.1); drawAvatar(rm.x, rm.y, ah, store.avatar, t, anim); };
  const drawTable = () => drawRoomTable(tx, y0, tw, slab, legs, t);
  const pl = { x: wide ? W * 0.05 : W * 0.9, y: fy + (H - fy) * 0.52, s: F(wide ? 60 : 46) };     // 盆栽：玩家在它後面（y 較小）就畫在玩家上面，在前面就畫在玩家下面
  const behindPlant = rm.y < pl.y + pl.s * 0.55;
  if (!behindPlant) drawPlant(pl.x, pl.y, pl.s, t);
  if (rm.y < base) { drawMe(); drawTable(); } else { drawTable(); drawMe(); }
  if (behindPlant) drawPlant(pl.x, pl.y, pl.s, t);
  // 桌子的點擊範圍
  const hovT = inRect(mouseX, mouseY, lay.table) && !tut;
  const tl = '桌面・開始玩', tls = F(wide ? 18 : 16); textSize(tls);
  const tlw = textWidth(tl) + tls * 1.1;
  pill(tx - tlw / 2, base + F(8) + sin(t * 3) * F(2) + (hovT ? F(2) : 0), tl, '#38b25c', tls);          // 放在桌子底下的地毯上，不遮到桌面
  btns.push({ x: lay.table.x, y: lay.table.y - F(30), w: lay.table.w, h: lay.table.h + F(30), fn: () => walkTo(tx, min(yMax, base + F(34)), () => { view = 'desk'; }) });

  // 空氣中的小灰塵（陽光感）
  noStroke(); fill(255, 255, 220, 90);
  for (let i = 0; i < 14; i++) circle((i * 137 + t * 8 * (1 + i % 3)) % W, (i * 71 + sin(t * 0.6 + i) * 30 + 40) % (H * 0.9), F(2 + i % 3));

  // ---- 上方按鈕與固定的知識卡 ----
  noStroke(); fill(255, 255, 255, 60); rect(0, 0, W, BAR);
  backButton('← 主畫面', () => { view = 'home'; });
  const lc = levelCard(); lay.level = lc;
  const hs = F(40); lay.help = { x: lc.x - hs - F(8), y: F(12), w: hs, h: hs };
  button(lay.help.x, lay.help.y, hs, hs, '?', '#4a96e8', () => { tut = { i: 0 }; }, { size: F(24) });
  if (H >= 520) { const th = F(wide ? 66 : 62), tw2 = min(W * 0.94, F(820)); lay.tip = tipCard(W / 2 - tw2 / 2, H - th - F(12), tw2, th, t); }
  roomLay = lay;
}

function walkTo(x, y, act) { rm.tx = x; rm.ty = y; rm.act = act || null; }
// 點房間的空地：走過去
function roomClick() {
  if (!roomLay || mouseY <= roomLay.fy) return;
  rm.tx = mouseX; rm.ty = mouseY; rm.act = null;
}

// ---------- 房間裡的家具 ----------
function drawRoomTable(tx, y0, tw, slab, legs, t) {
  noStroke(); fill(0, 0, 0, 30); ellipse(tx, y0 + slab + legs, tw * 1.05, tw * 0.12);
  fill('#8a5a2b'); rect(tx - tw * 0.44, y0 + slab - 2, tw * 0.07, legs + 2, 3); rect(tx + tw * 0.37, y0 + slab - 2, tw * 0.07, legs + 2, 3);
  fill('#b87a3e'); rect(tx - tw / 2, y0, tw, slab, tw * 0.03);                 // 桌板前緣
  fill('#d9a066'); rect(tx - tw / 2, y0 - tw * 0.1, tw, tw * 0.12, tw * 0.03);  // 桌面（斜視）
  fill(255, 255, 255, 40); rect(tx - tw * 0.46, y0 - tw * 0.09, tw * 0.92, tw * 0.025, 3);
  // 桌上小物：書、紙、相機
  const s = tw * 0.16, by = y0 - tw * 0.1;
  fill('#2e7d4a'); rect(tx - tw * 0.3, by - s * 0.75, s * 0.9, s * 0.8, 3); fill('#f2d27a'); rect(tx - tw * 0.3 + s * 0.15, by - s * 0.55, s * 0.5, s * 0.3, 2);
  fill('#fffdf5'); push(); translate(tx + tw * 0.02, by - s * 0.2); rotate(-0.12); rect(-s * 0.5, -s * 0.3, s, s * 0.6, 2); fill('#d64545'); rect(-s * 0.3, -s * 0.12, s * 0.6, s * 0.07); pop();
  fill('#3a3f4a'); rect(tx + tw * 0.22, by - s * 0.65, s * 0.9, s * 0.62, s * 0.12); fill('#9fd0f0'); circle(tx + tw * 0.22 + s * 0.45, by - s * 0.34, s * 0.4);
}
function drawPlant(x, y, s, t) {
  noStroke(); fill(0, 0, 0, 28); ellipse(x, y + s * 0.55, s * 0.9, s * 0.16);
  fill('#c4673f'); rect(x - s * 0.28, y + s * 0.1, s * 0.56, s * 0.45, s * 0.08); fill('#a9532f'); rect(x - s * 0.32, y + s * 0.05, s * 0.64, s * 0.14, s * 0.05);
  for (let i = 0; i < 5; i++) { push(); translate(x, y + s * 0.08); rotate(-1 + i * 0.5 + sin(t * 1.4 + i) * 0.04); fill(i % 2 ? '#4e9a52' : '#68b46a'); ellipse(0, -s * 0.42, s * 0.28, s * 0.85); pop(); }
}
function drawBoard(x, y, w, h, t) {
  noStroke(); fill(0, 0, 0, 30); rect(x + 3, y + 5, w, h, F(8));
  fill('#8a5a2b'); rect(x, y, w, h, F(8)); fill('#c98f55'); rect(x + F(6), y + F(6), w - F(12), h - F(12), F(5));
  const note = (nx, ny, nw, nh, col, a) => { push(); translate(nx, ny); rotate(a); fill(0, 0, 0, 25); rect(-nw / 2 + 2, -nh / 2 + 3, nw, nh, 2); fill(col); rect(-nw / 2, -nh / 2, nw, nh, 2); fill('#d64545'); circle(0, -nh / 2 + F(5), F(7)); pop(); };
  note(x + w * 0.38, y + h * 0.3, w * 0.52, h * 0.34, '#fff6c8', -0.07); note(x + w * 0.64, y + h * 0.66, w * 0.46, h * 0.34, '#cfe9ff', 0.08); note(x + w * 0.27, y + h * 0.72, w * 0.34, h * 0.26, '#ffd9e0', -0.1);
  txt('每日', x + w * 0.38, y + h * 0.26, fitText('每日', w * 0.4, F(18)), '#7a3a10', CENTER, true); txt('挑戰', x + w * 0.38, y + h * 0.38, fitText('挑戰', w * 0.4, F(18)), '#7a3a10', CENTER, true);
  const done = dailyDone(), bx = x + w - F(6), by = y + F(6), r = F(11) + (done ? 0 : sin(t * 5) * F(1.5));
  noStroke(); fill(done ? '#2e9e4f' : '#d64545'); circle(bx, by, r * 2); txt(done ? '✓' : '!', bx, by + 1, F(15), '#fff', CENTER, true);
}
function drawShelf(x, y, w, h, t) {
  noStroke(); fill(0, 0, 0, 30); rect(x + 3, y + 5, w, h, F(8));
  fill('#8a5a2b'); rect(x, y, w, h, F(8)); fill('#f7ecd2'); rect(x + F(6), y + F(6), w - F(12), h - F(12), F(4));
  fill('#b07a40'); rect(x + F(6), y + h * 0.5 - F(3), w - F(12), F(6)); rect(x + F(6), y + h - F(14), w - F(12), F(8));
  const slot = min((w - F(16)) / 4, (h - F(24)) / 2.3);
  ACHS.forEach((a, i) => {
    const cx = x + w / 2 + (i % 4 - 1.5) * slot, cy = y + (i < 4 ? h * 0.27 : h * 0.72) - (i < 4 ? 0 : F(6)), on = !!store.ach[a.id];
    noStroke(); fill(on ? '#f2c14e' : '#cfd6d0'); circle(cx, cy, slot * 0.78); fill(on ? '#fff3c4' : '#e6ebe7'); circle(cx, cy, slot * 0.58);
    txt(on ? a.e : '?', cx, cy + 1, slot * 0.42, on ? '#000' : '#9aa59d');
  });
}
function drawMirror(x, y, w, h, t) {
  noStroke(); fill(0, 0, 0, 30); rect(x + 3, y + 5, w, h, w / 2, w / 2, F(8), F(8));
  fill('#b07a40'); rect(x, y, w, h, w / 2, w / 2, F(8), F(8)); fill('#dff0f8'); rect(x + F(6), y + F(6), w - F(12), h - F(12), w / 2, w / 2, F(4), F(4));
  if (store.avatar) drawAvatar(x + w / 2, y + h - F(10), (h - F(26)) * 0.78, store.avatar, t, 'idle');
  fill(255, 255, 255, 70); push(); translate(x + w * 0.3, y + h * 0.3); rotate(0.5); rect(-w * 0.04, -h * 0.2, w * 0.08, h * 0.4, 4); rect(w * 0.1, -h * 0.12, w * 0.04, h * 0.24, 4); pop();
}
function drawFrame(x, y, w, h, t) {
  const sp = showcaseSp(t);
  noStroke(); fill(0, 0, 0, 30); rect(x + 3, y + 5, w, h, F(6)); fill('#8a5a2b'); rect(x, y, w, h, F(6)); fill('#fff'); rect(x + F(6), y + F(6), w - F(12), h - F(12), F(3));
  drawScene(sp, x + F(10), y + F(10), w - F(20), h - F(20));
  const ps = F(15); textSize(ps); const pw = textWidth(sp.name) + ps * 1.1;
  pill(x + F(16), y + h - F(16) - ps * 1.7, sp.name, 'rgba(46,107,58,0.9)', ps);       // 動物名字（標在相框裡）
}
function drawWindow(x, y, w, h, t) {
  noStroke(); fill(0, 0, 0, 30); rect(x + 3, y + 5, w, h, F(6)); fill('#fff'); rect(x, y, w, h, F(6));
  gradRect(x + F(6), y + F(6), w - F(12), h - F(12), '#8fd0f5', '#e6f6ff');
  fill('#9fc79a'); triangle(x + w * 0.1, y + h - F(6), x + w * 0.4, y + h * 0.45, x + w * 0.7, y + h - F(6)); fill('#7fb383'); triangle(x + w * 0.4, y + h - F(6), x + w * 0.72, y + h * 0.35, x + w - F(6), y + h - F(6));
  fill('#ffe27a'); circle(x + w * 0.78, y + h * 0.25, w * 0.16);
  cloud(x + ((t * 6) % (w + 80)) - 30, y + h * 0.22, w / 260, 220);
  noFill(); stroke('#fff'); strokeWeight(F(4)); line(x + w / 2, y + F(6), x + w / 2, y + h - F(6)); line(x + F(6), y + h * 0.55, x + w - F(6), y + h * 0.55); noStroke();
}

// ============================================================
//  桌面（第一視角）：圖鑑冊、考卷、拼圖盒、配對卡片、相機
// ============================================================
function drawDesk(t) {
  const W = width, H = height;
  noStroke(); fill('#b88455'); rect(0, 0, W, H);
  for (let i = 0; i < 9; i++) { fill(i % 2 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'); rect(0, i * H / 9, W, H / 9); }
  stroke(90, 55, 25, 30); strokeWeight(1.5); noFill();
  for (let i = 0; i < 26; i++) { const yy = i * H / 25 + 6; beginShape(); for (let x = 0; x <= W; x += W / 8) vertex(x, yy + sin(x * 0.01 + i) * 5); endShape(); }
  noStroke();
  const g = drawingContext.createRadialGradient(W * 0.2, H * 0.1, 10, W * 0.2, H * 0.1, max(W, H) * 0.8);   // 檯燈的暖光與四周暗角
  g.addColorStop(0, 'rgba(255,235,170,0.35)'); g.addColorStop(1, 'rgba(40,20,0,0.35)');
  drawingContext.save(); drawingContext.fillStyle = g; drawingContext.fillRect(0, 0, W, H); drawingContext.restore();

  noStroke(); fill(255, 255, 255, 50); rect(0, 0, W, BAR);
  backButton('← 房間', () => { view = 'hub'; });
  if (wide) txt('📋 我的桌面', W / 2, BAR / 2 + 1, F(24), '#3a2a12', CENTER, true);
  levelCard();

  const b = store.best, items = [
    { label: '生態圖鑑', sub: '已收集 ' + dexCount() + '/' + SPECIES.length, col: '#2e7d4a', draw: drawBook, fn: () => { retView = 'desk'; view = 'dex'; } },
    { label: '點選闖關', sub: '最高 ' + (b.quiz || 0) + '/' + GRID_N, col: '#4a96e8', draw: drawPaper, fn: () => { retView = 'desk'; startMC('quiz'); } },
    { label: '解鎖拼圖', sub: '最高 ' + (b.puzzle || 0) + '/' + GRID_N, col: '#f0a020', draw: drawPuzzleBox, fn: () => { retView = 'desk'; startMC('puzzle'); } },
    { label: '拖曳配對', sub: '最高 ' + (b.drag || 0) + '/' + GRID_N, col: '#38b25c', draw: drawCards, fn: () => { retView = 'desk'; startDrag(); } },
    { label: '明信片拍照', sub: '已下載 ' + (store.photos || 0) + ' 張', col: '#e8803a', draw: drawCamera, fn: () => { retView = 'desk'; view = 'photo'; } },
    { label: '我的進步', sub: '已玩 ' + (store.runs || []).length + ' 次', col: '#d9702a', draw: drawTrophy, fn: () => openProgress('desk') }
  ];
  const tipH = (H >= 560) ? F(66) + F(24) : 0, area = { x: 0, y: BAR, w: W, h: H - BAR - tipH };
  const rot = [-0.05, 0.04, -0.03, 0.05, -0.04, 0.03];
  items.forEach((it, i) => {
    let cx, cy, s;
    if (wide) { s = min(W / 6.8, area.h * 0.5); cx = W * (i + 0.5) / 6; cy = area.y + area.h * 0.46 + [0.02, -0.04, 0.03, -0.03, 0.02, -0.02][i] * H; }
    else { const cw = W / 2, ch = area.h / 3; s = min(cw * 0.62, ch * 0.6); cx = cw * (i % 2 + 0.5); cy = area.y + ch * (floor(i / 2) + 0.44); }
    const hit = { x: cx - s * 0.6, y: cy - s * 0.55, w: s * 1.2, h: s * 1.3 }, hov = inRect(mouseX, mouseY, hit);
    push(); translate(cx, cy + sin(t * 1.6 + i) * F(2)); rotate(rot[i] + (hov ? 0.02 : 0)); scale(hov ? 1.08 : 1); it.draw(s, t); pop();
    const ls = F(wide ? 19 : 16); textSize(ls); const lw = textWidth(it.label) + ls * 1.1;
    pill(cx - lw / 2, cy + s * 0.56, it.label, it.col, ls);
    txt(it.sub, cx, cy + s * 0.56 + ls * 2.3, F(wide ? 15 : 14), '#fff4dc', CENTER, true);
    btns.push({ x: hit.x, y: hit.y, w: hit.w, h: hit.h + F(26), fn: it.fn });
  });
  if (tipH) { const tw2 = min(W * 0.94, F(820)); tipCard(W / 2 - tw2 / 2, H - F(66) - F(12), tw2, F(66), t); }
}
function drawTrophy(s) {
  noStroke(); fill(0, 0, 0, 40); ellipse(0, s * 0.5, s * 0.7, s * 0.12);
  fill('#8a5a2b'); rect(-s * 0.26, s * 0.34, s * 0.52, s * 0.14, s * 0.03); fill('#a8702f'); rect(-s * 0.18, s * 0.26, s * 0.36, s * 0.1, s * 0.02);
  fill('#e8b83a'); rect(-s * 0.05, s * 0.05, s * 0.1, s * 0.24);                       // 杯柄
  noFill(); stroke('#e8b83a'); strokeWeight(s * 0.05); arc(-s * 0.3, -s * 0.12, s * 0.26, s * 0.26, HALF_PI, PI + HALF_PI); arc(s * 0.3, -s * 0.12, s * 0.26, s * 0.26, -HALF_PI, HALF_PI); noStroke();
  fill('#f2c84b'); rect(-s * 0.3, -s * 0.42, s * 0.6, s * 0.5, s * 0.04, s * 0.04, s * 0.3, s * 0.3);   // 杯身
  fill(255, 255, 255, 90); rect(-s * 0.2, -s * 0.38, s * 0.07, s * 0.36, s * 0.03);
  txt('1', 0, -s * 0.16, s * 0.24, '#8a5a2b', CENTER, true);
}
function drawBook(s) {
  noStroke(); fill(0, 0, 0, 45); rect(-s * 0.4 + 5, -s * 0.46 + 8, s * 0.8, s * 0.92, s * 0.06);
  fill('#f4ecd0'); rect(-s * 0.37, -s * 0.43, s * 0.8, s * 0.92, s * 0.05);
  fill('#2e7d4a'); rect(-s * 0.4, -s * 0.46, s * 0.8, s * 0.92, s * 0.06);
  fill('#256a3e'); rect(-s * 0.4, -s * 0.46, s * 0.12, s * 0.92, s * 0.06, 0, 0, s * 0.06);
  fill('#f2d27a'); rect(-s * 0.2, -s * 0.34, s * 0.54, s * 0.26, s * 0.04); txt('圖鑑', s * 0.07, -s * 0.21, s * 0.17, '#5a4210', CENTER, true);
  fill('#f2d27a'); circle(s * 0.07, s * 0.14, s * 0.3); fill('#2e7d4a'); push(); translate(s * 0.07, s * 0.14); rotate(0.6); ellipse(0, 0, s * 0.1, s * 0.2); pop();
  fill('#d64545'); rect(s * 0.2, s * 0.44, s * 0.07, s * 0.16); triangle(s * 0.2, s * 0.6, s * 0.27, s * 0.6, s * 0.235, s * 0.55);
}
function drawPaper(s) {
  noStroke(); fill(0, 0, 0, 40); rect(-s * 0.34 + 4, -s * 0.46 + 7, s * 0.68, s * 0.92, 3);
  fill('#fffdf5'); rect(-s * 0.34, -s * 0.46, s * 0.68, s * 0.92, 3);
  txt('點選闖關', 0, -s * 0.36, fitText('點選闖關', s * 0.6, s * 0.13), '#2f4a36', CENTER, true);
  stroke('#c9d6cc'); strokeWeight(1.6); for (let i = 0; i < 5; i++) line(-s * 0.18, -s * 0.2 + i * s * 0.11, s * 0.26, -s * 0.2 + i * s * 0.11);
  noFill(); stroke('#8fb996'); for (let i = 0; i < 5; i++) circle(-s * 0.25, -s * 0.2 + i * s * 0.11, s * 0.06);
  push(); translate(s * 0.14, s * 0.33); rotate(-0.2); txt('A+', 0, 0, s * 0.3, '#d64545', CENTER, true); pop();
  noStroke(); push(); translate(s * 0.38, s * 0.1); rotate(0.45); fill('#f0b020'); rect(-s * 0.025, -s * 0.3, s * 0.05, s * 0.5); fill('#f3d7b0'); triangle(-s * 0.025, s * 0.2, s * 0.025, s * 0.2, 0, s * 0.27); fill('#f08a9a'); rect(-s * 0.025, -s * 0.34, s * 0.05, s * 0.05); pop();
}
function drawPuzzleBox(s, t) {
  noStroke(); fill(0, 0, 0, 40); rect(-s * 0.44 + 4, -s * 0.34 + 7, s * 0.88, s * 0.68, s * 0.06);
  fill('#4a96e8'); rect(-s * 0.44, -s * 0.34, s * 0.88, s * 0.68, s * 0.06);
  fill('#fff'); rect(-s * 0.39, -s * 0.29, s * 0.78, s * 0.58, s * 0.03);
  drawScene(SPECIES[1 % SPECIES.length], -s * 0.37, -s * 0.27, s * 0.74, s * 0.54);
  stroke(255, 255, 255, 200); strokeWeight(2); for (let i = 1; i < 4; i++) line(-s * 0.37 + s * 0.74 * i / 4, -s * 0.27, -s * 0.37 + s * 0.74 * i / 4, s * 0.27); line(-s * 0.37, 0, s * 0.37, 0); noStroke();
  push(); translate(s * 0.32, s * 0.36); rotate(0.3); fill('#f0a020'); rect(-s * 0.1, -s * 0.1, s * 0.2, s * 0.2, 3); circle(s * 0.1, 0, s * 0.09); circle(0, -s * 0.1, s * 0.09); pop();
}
function drawCards(s) {
  for (let k = 0; k < 3; k++) {
    push(); rotate((k - 1) * 0.24); translate((k - 1) * s * 0.1, -s * 0.02);
    noStroke(); fill(0, 0, 0, 35); rect(-s * 0.26 + 3, -s * 0.38 + 5, s * 0.52, s * 0.74, s * 0.04);
    fill('#fffdf5'); rect(-s * 0.26, -s * 0.38, s * 0.52, s * 0.74, s * 0.04);
    drawScene(SPECIES[(k * 5 + 2) % SPECIES.length], -s * 0.22, -s * 0.34, s * 0.44, s * 0.36);
    fill('#e7dcc0'); rect(-s * 0.22, s * 0.08, s * 0.44, s * 0.08, 3); rect(-s * 0.22, s * 0.2, s * 0.3, s * 0.07, 3);
    pop();
  }
}
function drawCamera(s) {
  noStroke(); fill(0, 0, 0, 40); rect(-s * 0.44 + 4, -s * 0.22 + 7, s * 0.88, s * 0.56, s * 0.1);
  fill('#3a3f4a'); rect(-s * 0.34, -s * 0.34, s * 0.26, s * 0.16, s * 0.04); rect(-s * 0.44, -s * 0.22, s * 0.88, s * 0.56, s * 0.1);
  fill('#d64545'); rect(-s * 0.44, -s * 0.1, s * 0.88, s * 0.07); fill('#fff4c0'); rect(s * 0.18, -s * 0.3, s * 0.16, s * 0.08, 2);
  fill('#222'); circle(0, s * 0.08, s * 0.5); fill('#4a6a8a'); circle(0, s * 0.08, s * 0.38); fill('#9fd0f0'); circle(0, s * 0.08, s * 0.22); fill(255, 255, 255, 200); circle(-s * 0.05, s * 0.03, s * 0.07);
}
function drawMug(s) {
  noStroke(); fill(0, 0, 0, 35); ellipse(0, s * 0.3, s * 0.5, s * 0.1);
  fill('#e8803a'); rect(-s * 0.18, -s * 0.12, s * 0.36, s * 0.42, s * 0.05); noFill(); stroke('#e8803a'); strokeWeight(s * 0.05); arc(s * 0.2, s * 0.08, s * 0.2, s * 0.2, -HALF_PI, HALF_PI); noStroke();
  const cols = ['#f0b020', '#4a96e8', '#d64545']; cols.forEach((c, i) => { push(); rotate(-0.3 + i * 0.3); fill(c); rect(-s * 0.02, -s * 0.38, s * 0.04, s * 0.3); pop(); });
}

// ============================================================
//  新手教學：變暗畫面、只留一個亮框，旁邊用對話框說明
// ============================================================
const TUT_STEPS = [
  { t: '歡迎來到探險家工作站！', d: '點地板，或用方向鍵／WASD，就能讓你的角色在房間裡走動。', r: () => roomLay.fy ? rm.rect : null },
  { t: '桌子是遊戲入口', d: '走到桌子前點一下，就會進入桌面：圖鑑冊、考卷、拼圖盒、配對卡片，還有相機（明信片拍照）。', r: () => roomLay.table },
  { t: '公告板：每日挑戰', d: '每天先看一則「今日小知識」（有時還有冷笑話），再挑戰 5 題。完成後會記錄連續天數，紅色驚嘆號代表今天還沒挑戰。', r: () => roomLay.board },
  { t: '知識庫：不懂就來查', d: '特有種、特有亞種、原生種有什麼不一樣？15 種動物的資料都整理在這裡。玩的時候看不懂，隨時可以回來看。', r: () => roomLay.kb },
  { t: '相框：自己選展示動物', d: '點相框可以選要展示哪些動物，可以選輪播、隨機，或固定只放你最愛的那隻。', r: () => roomLay.frame, only: () => !!roomLay.frame },
  { t: '獎狀櫃：成就', d: '完成目標就會點亮徽章，例如滿分、集滿圖鑑、分清楚特有種和特有亞種。', r: () => roomLay.shelf },
  { t: '鏡子：換造型', d: '隨時可以回來調整你的探險家外型。', r: () => roomLay.mirror },
  { t: '底下的知識卡', d: '知識卡會自動翻頁。點左右的箭頭可以自己選上一個、下一個，點中間可以看完整介紹。', r: () => roomLay.tip, only: () => !!roomLay.tip },
  { t: '需要時再看一次', d: '右上角的「？」可以重看教學。祝你探險愉快！', r: () => roomLay.help }
];
function tutSteps() { return TUT_STEPS.filter(s => !s.only || s.only()); }
function endTutorial() { tut = null; store.tut = true; saveStore(); }
function drawTutorial() {
  btns = [];
  const W = width, H = height, steps = tutSteps(), st = steps[min(tut.i, steps.length - 1)], last = tut.i >= steps.length - 1;
  let r = st.r(); if (!r) r = { x: W / 2 - 10, y: H / 2 - 10, w: 20, h: 20 };
  const p = F(8), hx = r.x - p, hy = r.y - p, hw = r.w + p * 2, hh = r.h + p * 2;
  noStroke(); fill(0, 0, 0, 165);
  rect(0, 0, W, max(0, hy)); rect(0, hy + hh, W, max(0, H - hy - hh)); rect(0, hy, max(0, hx), hh); rect(hx + hw, hy, max(0, W - hx - hw), hh);
  noFill(); stroke('#ffd54a'); strokeWeight(F(4) + sin(millis() / 200) * 1.5); rect(hx, hy, hw, hh, F(14)); noStroke();
  const bw = min(W * 0.92, F(440)), pad = F(16), ts = F(wide ? 19 : 17), lines = wrapLines(st.d, bw - pad * 2, ts), bh = F(46) + lines.length * ts * 1.5 + F(70);
  let bx = constrain(hx + hw / 2 - bw / 2, F(10), W - bw - F(10)), by = hy + hh + F(16);
  if (by + bh > H - F(10)) by = hy - bh - F(16);
  if (by < F(10)) by = constrain(H / 2 - bh / 2, F(10), H - bh - F(10));
  card(bx, by, bw, bh, '#ffffff');
  txt(st.t, bx + pad, by + F(26), fitText(st.t, bw - pad * 2, F(wide ? 24 : 21)), '#1f5a34', LEFT, true);
  paraText(lines, bx + pad, by + F(46), ts, '#333', ts * 1.5, LEFT);
  const bby = by + bh - F(56);
  for (let i = 0; i < steps.length; i++) { fill(i === tut.i ? '#38b25c' : '#cfe0d2'); circle(bx + pad + F(6) + i * F(14), bby - F(8), F(8)); }
  if (!last) button(bx + pad, bby, F(90), F(42), '略過', '#9aa59d', endTutorial, { size: F(17) });
  button(bx + bw - pad - F(150), bby, F(150), F(42), last ? '開始探險！' : '下一步 →', '#38b25c', () => { if (last) endTutorial(); else tut.i++; }, { size: F(19) });
}
