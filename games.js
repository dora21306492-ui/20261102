// ============================================================
//  三種玩法（拖曳配對、點選闖關、答題解鎖拼圖）、生態圖鑑、成績面板、解說卡、彩帶
//  版面分兩種：電腦（橫向）左右分欄，手機（直向）上下排列；尺寸都用 F() 依螢幕放大
// ============================================================

// ============================================================
//  拖曳配對
// ============================================================
function startDrag() {
  const order = pickSpecies(GRID_N);                // 上方圖片的順序
  dg = {
    order,
    chips: shuffle([...order]).map((sp, i) => ({ sp, home: i, slot: -1, first: null, firstSp: null, x: -999, y: -999, w: 10, h: 10 })),
    t0: millis(), held: null, prev: -1, offX: 0, offY: 0, submitted: false, L: null, panel: null
  };
  view = 'drag'; panel = null; modal = null; confetti = []; confettiFrames = 0;
  dragLayout(); for (const c of dg.chips) { const t = chipTarget(c); c.x = t.x; c.y = t.y; }
}

// 計算拖曳畫面的版面：依螢幕大小挑出最合適的欄數，讓每張圖都接近 4:3
function dragLayout() {
  const W = width, H = height, gap = F(8), chipH = F(wide ? 44 : 40);
  let chipCols = 2, chipW = F(90);
  for (const [cols, minW] of [[8, F(110)], [4, F(110)], [3, F(90)], [2, F(80)]]) {   // 下方選項一列放幾個
    const w = min(F(150), (W - gap * (cols + 1)) / cols);
    if (w >= minW || cols === 2) { chipCols = cols; chipW = w; break; }
  }
  const chipRows = ceil(GRID_N / chipCols), chipAreaH = chipRows * (chipH + gap) + gap;
  const btnH = F(wide ? 58 : 50), btnW = constrain(W * 0.45, F(170), F(290)), footerH = btnH + gap * 2 + (dg.submitted ? F(24) : 0);
  const gTop = BAR + gap, gBot = H - footerH - chipAreaH, areaH = gBot - gTop;
  let best = null;
  for (const cols of [2, 3, 4, 8]) {                                              // 上方圖片一列放幾張
    const rows = ceil(GRID_N / cols), cw = W / cols, rowH = areaH / rows, imgH = rowH - chipH - gap * 1.5;
    if (imgH < F(46) || cw < chipW + gap) continue;
    const sc = Math.abs(Math.log((cw / imgH) / 1.33));
    if (!best || sc < best.sc) best = { cols, rows, cw, rowH, sc };
  }
  if (!best) best = { cols: 2, rows: 4, cw: W / 2, rowH: areaH / 4 };
  const slotW = min(chipW, best.cw - 12), cells = [];
  for (let i = 0; i < GRID_N; i++) {
    const x = (i % best.cols) * best.cw, y = gTop + floor(i / best.cols) * best.rowH;
    cells.push({
      x, y, w: best.cw, h: best.rowH,
      img: { x: x + 6, y: y + 2, w: best.cw - 12, h: best.rowH - chipH - gap * 1.5 },
      slot: { x: x + (best.cw - slotW) / 2, y: y + best.rowH - chipH - gap * 0.5, w: slotW, h: chipH }
    });
  }
  dg.L = { cols: chipCols, chipH, slotW, cells, chipTop: H - footerH - chipAreaH + gap, gap, btn: { x: W / 2 - btnW / 2, y: H - btnH - gap, w: btnW, h: btnH } };
  for (const c of dg.chips) { c.w = slotW; c.h = chipH; }
}
// 選項應該停靠的位置（在格子內，或回到下方待選區）
function chipTarget(c) {
  const L = dg.L;
  if (c.slot >= 0) return { x: L.cells[c.slot].slot.x, y: L.cells[c.slot].slot.y };
  const col = c.home % L.cols, row = floor(c.home / L.cols), n = min(L.cols, GRID_N - row * L.cols);
  const rowW = n * (c.w + L.gap) - L.gap;                                          // 最後一列置中
  return { x: (width - rowW) / 2 + (col) * (c.w + L.gap), y: L.chipTop + row * (L.chipH + L.gap) };
}

function drawDrag() {
  dragLayout();
  const L = dg.L;
  topBar('🧩 拖曳配對');
  for (let i = 0; i < GRID_N; i++) {
    const cell = L.cells[i], im = cell.img, s = cell.slot, sp = dg.order[i];
    noStroke(); fill(255); rect(im.x, im.y, im.w, im.h, F(12));
    drawScene(sp, im.x, im.y, im.w, im.h);
    noFill(); stroke('#b9d6bd'); strokeWeight(2); rect(im.x, im.y, im.w, im.h, F(12));
    noStroke(); fill('#2e6b3a'); circle(im.x + F(16), im.y + F(16), F(26));
    txt(i + 1, im.x + F(16), im.y + F(16), F(15), '#fff', CENTER, true);

    // 放置格：放進去就立刻顯示對錯（綠框 ✓ ／紅框 ✗），不只靠顏色，也有符號
    const chip = dg.chips.find(c => c.slot === i);
    let border = '#8fb996', bg = 'rgba(255,255,255,0.7)';
    if (chip) { const ok = chip.sp === sp; border = ok ? '#2e9e4f' : '#d64545'; bg = ok ? 'rgba(46,158,79,0.16)' : 'rgba(214,69,69,0.16)'; }
    else if (dg.held && cellAt(dg.held) === i) { border = '#f0a020'; bg = 'rgba(240,160,32,0.18)'; }
    fill(bg); stroke(border); strokeWeight(2.5); drawingContext.setLineDash(chip ? [] : [8, 6]);
    rect(s.x, s.y, s.w, s.h, F(10)); drawingContext.setLineDash([]);
    if (!chip) txt('拖到這裡', s.x + s.w / 2, s.y + s.h / 2, fitText('拖到這裡', s.w - F(8), F(16)), '#8aa890');
    else { const ok = chip.sp === sp; noStroke(); fill(ok ? '#2e9e4f' : '#d64545'); circle(s.x + s.w - F(2), s.y + F(2), F(24)); txt(ok ? '✓' : '✗', s.x + s.w - F(2), s.y + F(3), F(15), '#fff', CENTER, true); }
  }
  for (const c of dg.chips) { if (c === dg.held) continue; const t = chipTarget(c); c.x = lerp(c.x, t.x, 0.25); c.y = lerp(c.y, t.y, 0.25); drawChip(c, false); }
  if (dg.held) drawChip(dg.held, true);

  if (!dg.submitted) button(L.btn.x, L.btn.y, L.btn.w, L.btn.h, '📝 交卷看成績', '#38b25c', dragSubmit);
  else {
    button(L.btn.x - L.btn.w / 2 - F(6), L.btn.y, L.btn.w, L.btn.h, '🔄 再玩一次', '#4a96e8', startDrag);
    button(L.btn.x + L.btn.w / 2 + F(6), L.btn.y, L.btn.w, L.btn.h, '📊 看成績', '#f0a020', () => { panel = dg.panel; });
    txt('點任一張圖，可以看詳細解說', width / 2, L.btn.y - F(13), fitText('點任一張圖，可以看詳細解說', width - F(20), F(16)), '#557a5c');
  }
}
function drawChip(c, lifted) {
  if (lifted) { drawingContext.shadowColor = 'rgba(0,0,0,0.3)'; drawingContext.shadowBlur = 14; drawingContext.shadowOffsetY = 6; }
  fill(lifted ? '#ffd66b' : '#fff3c4'); stroke(lifted ? '#e0a100' : '#e6c34a'); strokeWeight(2); rect(c.x, c.y, c.w, c.h, F(10));
  drawingContext.shadowColor = 'rgba(0,0,0,0)'; drawingContext.shadowBlur = 0; drawingContext.shadowOffsetY = 0;
  noStroke(); fill('#4a3b00'); textAlign(CENTER, CENTER); textStyle(NORMAL);
  textSize(fitText(c.sp.name, c.w - F(10), max(13, c.h * 0.46)));
  text(c.sp.name, c.x + c.w / 2, c.y + c.h / 2 + 1);
}
function cellAt(c) {                    // 選項中心點落在哪一題的格子（沒有則 -1）
  const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  for (let i = 0; i < GRID_N; i++) if (inRect(cx, cy, dg.L.cells[i])) return i;
  return -1;
}
function dragPress() {
  if (dg.submitted) {                   // 交卷後：點圖片看解說卡
    for (let i = 0; i < GRID_N; i++) if (inRect(mouseX, mouseY, dg.L.cells[i].img)) { modal = dg.order[i]; sfx('click'); return; }
    return;
  }
  for (let i = dg.chips.length - 1; i >= 0; i--) {
    const c = dg.chips[i];
    if (inRect(mouseX, mouseY, c)) {
      dg.held = c; dg.prev = c.slot; c.slot = -1;               // 拿起來就離開原本的格子
      dg.offX = mouseX - c.x; dg.offY = mouseY - c.y;
      dg.chips.splice(i, 1); dg.chips.push(c);
      return;
    }
  }
}
function dragDrop() {
  const c = dg.held; dg.held = null;
  const t = cellAt(c);
  if (t < 0) { c.slot = -1; return; }                           // 沒放進格子：回到待選區
  const other = dg.chips.find(o => o !== c && o.slot === t);
  if (other) other.slot = dg.prev;                              // 格子已有選項：兩者交換
  c.slot = t;
  const ok = dg.order[t] === c.sp;
  if (c.first === null) { c.first = ok; c.firstSp = dg.order[t]; if (ok) unlockDex(c.sp); }   // 成績以「第一次放的位置」為準
  sfx(ok ? 'right' : 'wrong');                                  // 立即回饋：音效＋提示＋格子顏色
  say(ok ? '✓ 答對了！' : '✗ 這個名稱不是這張圖喔，再想想看');
}
function dragSubmit() {
  if (dg.chips.some(c => c.slot < 0)) { say('還有選項沒放進格子，請全部拖到圖片下方'); return; }
  dg.submitted = true;
  const score = dg.chips.filter(c => c.first).length;
  const lines = dg.chips.filter(c => !c.first).map(c =>
    '「' + c.sp.name + '」正確是第 ' + (dg.order.indexOf(c.sp) + 1) + ' 張圖（你先放在第 ' + (dg.order.indexOf(c.firstSp) + 1) + ' 張）');
  const ms = millis() - dg.t0;
  const rec = dg.chips.map((c, i) => ({ 題號: dg.order.indexOf(c.sp) + 1, 題型: 'drag', 學習目標: 2, 動物: c.sp.name, 選擇: '第 ' + (dg.order.indexOf(c.firstSp) + 1) + ' 張', 正確: c.first ? '✓' : '✗', 作答秒數: '-', ok: !!c.first }));
  printTestLog('拖曳配對 作答紀錄（共用時 ' + mmss(ms) + '）', rec.map(r => ({ ...r, ok: undefined })));
  dg.panel = buildPanel('drag', score, GRID_N, lines, '❌ 第一次放錯的選項與正確位置：', true, startDrag, { goals: goalStats(rec), ms });
  panel = dg.panel;
}

// ============================================================
//  點選闖關 ／ 答題解鎖拼圖（共用題目引擎）
// ============================================================
function startMC(mode, fixedList, daily, retry) {
  const list = fixedList || pickSpecies(GRID_N);                 // 每日挑戰會指定固定的物種清單
  mc = { mode, daily: !!daily, retry: !!retry, rec: [], t0: millis(), qStart: millis(), list, qs: makeQuestions(list, mode), idx: 0, picked: -1, score: 0, wrong: [], done: false,
         tiles: list.map(sp => ({ sp, state: 'locked', reveal: 0 })) };
  view = mode; panel = null; modal = null; confetti = []; confettiFrames = 0;
  enterQuestion();
}
// 題型對應的學習目標（見 config.js 的 PROJECT.goals）：特有種判斷→1、看圖／聽聲音／看影片→2、知識題→3
const GOAL_OF = { kind: 1, img: 2, sound: 2, snd2pic: 2, pic2snd: 2, video: 2, fact: 3 };
// 依物種產生題目；闖關有看圖、聽聲音（有音檔才出）、特有種判斷、知識題；拼圖只出知識題與特有種判斷
const hasPhoto = s => !!(s.photo && s.photo.width > 0), hasAudio = s => !!(s.sound && s.audioOk);
function audioCreditLine(sp) { return AUDIO_CREDITS[sp.id] ? '（叫聲：' + AUDIO_CREDITS[sp.id] + '）' : ''; }
function makeQuestions(list, mode) {
  const qs = [];
  for (const sp of list) {
    const types = mode === 'puzzle' ? ['fact'] : ['img', 'fact'];
    if (sp.kindQ) types.push('kind');
    if (mode === 'quiz' && hasPhoto(sp)) types.push('img');                       // 有真實照片的多出一次「看照片」題
    if (mode === 'quiz' && hasAudio(sp)) {                                         // 有叫聲檔：聽聲音選名字／聽聲音選照片／看照片選聲音
      types.push('sound', 'snd2pic');
      if (SPECIES.filter(hasAudio).length >= 2) types.push('pic2snd');
    }
    if (mode === 'quiz' && sp.vidOk) types.push('video', 'video');
    const type = random(types);
    let q;
    if (type === 'img' || type === 'sound' || type === 'video') {
      const names = shuffle(SPECIES.filter(s => s !== sp)).slice(0, 3).map(s => s.name).concat(sp.name);
      const opts = shuffle(names);
      q = { type, q: type === 'img' ? '這是哪一種台灣原生動物？' : type === 'video' ? '這段影片裡是哪一種動物？' : '這是哪一種動物的叫聲？', opts, a: opts.indexOf(sp.name),
            explain: sp.name + '（' + sp.kind + '）：' + sp.info + (type === 'sound' ? audioCreditLine(sp) : '') };
    } else if (type === 'snd2pic') {                                    // 聽力題 A：播叫聲，選項是 4 張圖
      const pool = SPECIES.filter(s => s !== sp), usePhoto = hasPhoto(sp) && pool.filter(hasPhoto).length >= 3;
      const optSp = shuffle(shuffle(usePhoto ? pool.filter(hasPhoto) : pool).slice(0, 3).concat(sp));
      q = { type, optType: 'pic', optPhoto: usePhoto, optSp, opts: optSp.map(s => s.name), a: optSp.indexOf(sp),
            q: '聽聽看，這是哪一種動物的叫聲？請選出牠的' + (usePhoto ? '照片' : '圖片') + '。',
            explain: sp.name + '（' + sp.kind + '）：' + sp.info + audioCreditLine(sp) };
    } else if (type === 'pic2snd') {                                    // 聽力題 B：給照片，選項是聲音（按 ▶ 試聽）
      const optSp = shuffle(shuffle(SPECIES.filter(s => s !== sp && hasAudio(s))).slice(0, 2).concat(sp));
      q = { type, optType: 'snd', optSp, opts: optSp.map(s => s.name), a: optSp.indexOf(sp),
            q: '看這張圖：哪一個聲音是牠的叫聲？（按 ▶ 試聽，再選答案）',
            explain: sp.name + '（' + sp.kind + '）：' + sp.info + audioCreditLine(sp) };
    } else if (type === 'kind') {
      const opts = ['特有種', '特有亞種', '原生種（不是特有）'];
      q = { type, q: '「' + sp.name + '」是哪一種？', opts, a: opts.findIndex(o => o.startsWith(sp.kind)),
            explain: sp.name + '是' + sp.kind + '。特有種＝整個物種只分布在台灣；特有亞種＝這個物種在別處也有，但台灣的族群是獨有的一支。' };
    } else {
      const idx = shuffle([0, 1, 2, 3]), opts = idx.map(i => sp.q.opts[i]);
      q = { type: 'fact', q: sp.q.q, opts, a: idx.indexOf(sp.q.a), explain: sp.name + '：' + sp.info };
    }
    q.sp = sp; q.type = q.type || type; q.goal = GOAL_OF[q.type]; qs.push(q);
  }
  shuffle(qs, true);
  qs.forEach((q, i) => { q.no = i + 1; });
  return qs;
}
function enterQuestion() {
  mc.picked = -1; mc.qStart = millis(); stopVideos(); stopSpeciesSounds();
  const q = mc.qs[mc.idx];
  if (q && (q.type === 'sound' || q.type === 'snd2pic') && FEATURES.F3_autoPlaySound) playSpeciesSound(q.sp);       // 聽聲音題：一進題目就播放
  if (q && q.type === 'video') toggleVideo(q.sp);                                         // 影片題：自動開始播放
}
function mcAnswer(i) {
  if (mc.picked >= 0) return;
  const q = mc.qs[mc.idx], tile = mc.tiles.find(t => t.sp === q.sp);
  mc.picked = i;
  mc.rec.push({ 題號: q.no, 題型: q.type, 學習目標: q.goal, 動物: q.sp.name, 選擇: q.opts[i], 正確: i === q.a ? '✓' : '✗', 作答秒數: ((millis() - mc.qStart) / 1000).toFixed(1), ok: i === q.a });
  if (i === q.a) { mc.score++; unlockDex(q.sp); sfx('right'); tile.state = 'open'; if (q.type === 'kind') { store.kindOk = (store.kindOk || 0) + 1; saveStore(); } }
  else { mc.wrong.push(q); sfx('wrong'); tile.state = 'fail'; }
}
function mcNext() { stopVideos(); stopSpeciesSounds(); mc.idx++; if (mc.idx >= mc.qs.length) finishMC(); else enterQuestion(); }
function goalStats(rec) {                         // 每個學習目標答對幾題（對應 PBL 1-2）
  return PROJECT.goals.map(go => { const rs = rec.filter(r => r.學習目標 === go.id); return { id: go.id, text: go.text, ok: rs.filter(r => r.ok).length, n: rs.length }; });
}
function finishMC() {
  mc.done = true; mc.ms = millis() - mc.t0; stopVideos(); stopSpeciesSounds();
  printTestLog((mc.daily ? '每日挑戰' : mc.mode === 'quiz' ? '點選闖關' : '答題解鎖拼圖') + (mc.retry ? '（錯題再練）' : '') + ' 作答紀錄', mc.rec.map(r => ({ ...r, ok: undefined })));
  const lines = mc.wrong.map(q => '第 ' + q.no + ' 題【' + q.sp.name + '】正確：' + q.opts[q.a]);
  const wrongSp = [...new Set(mc.wrong.map(q => q.sp))], mode0 = mc.mode, daily0 = mc.daily;
  mc.panel = buildPanel(mc.daily ? 'daily' : mc.mode, mc.score, mc.qs.length, lines, '❌ 答錯的題目與正確選項：', mc.mode === 'puzzle', () => mc.daily ? startDaily() : startMC(mc.mode), {
    goals: goalStats(mc.rec), ms: mc.ms, retry: mc.retry,
    onRetryWrong: FEATURES.F6_retryWrong && wrongSp.length && !daily0 ? () => startMC(mode0, wrongSp, false, true) : null });
  if (mc.daily) completeDaily();
  panel = mc.panel;
}

// 拼圖格（8 格）：已解鎖＝動態插圖，答錯＝紅色 ✗，未作答＝鎖頭。box 是整個拼圖可用的範圍
function drawTiles(box, activeSp) {
  const g = F(8), cols = 4;
  let tw = (box.w - g * (cols - 1)) / cols, th = tw * 0.75;
  if (th * 2 + g > box.h) { th = (box.h - g) / 2; tw = th / 0.75; }
  const x0 = box.x + (box.w - (tw * cols + g * (cols - 1))) / 2, y0 = box.y + (box.h - (th * 2 + g)) / 2;
  for (let i = 0; i < mc.tiles.length; i++) {
    const t = mc.tiles[i], tx = x0 + (i % cols) * (tw + g), ty = y0 + floor(i / cols) * (th + g);
    t.reveal = lerp(t.reveal, t.state === 'open' ? 1 : 0, 0.12);
    noStroke(); fill('#fff'); rect(tx - 2, ty - 2, tw + 4, th + 4, F(12));
    if (t.reveal > 0.02) drawScene(t.sp, tx, ty, tw, th);
    if (t.reveal < 0.98) {
      noStroke(); fill(t.state === 'fail' ? 'rgba(160,70,70,' + (1 - t.reveal) + ')' : 'rgba(90,122,100,' + (1 - t.reveal) + ')'); rect(tx, ty, tw, th, F(10));
      txt(t.state === 'fail' ? '✗' : '🔒', tx + tw / 2, ty + th / 2, min(tw, th) * 0.4, '#fff', CENTER, true);
    }
    if (t.sp === activeSp && t.state === 'locked') { noFill(); stroke('#f0a020'); strokeWeight(3 + sin(millis() / 200)); rect(tx - 2, ty - 2, tw + 4, th + 4, F(12)); }
    if (t.state === 'open') { noStroke(); fill('#2e9e4f'); circle(tx + tw - F(10), ty + F(10), F(20)); txt('✓', tx + tw - F(10), ty + F(10), F(13), '#fff', CENTER, true); }
  }
}

const STICKER_LOW = { macaque: true };
function drawMC() {
  const W = width, H = height, m = F(18);
  topBar(mc.daily ? '📅 每日挑戰' : mc.mode === 'quiz' ? '🎯 點選闖關' : '🔓 答題解鎖拼圖');
  if (mc.done) return drawMCDone();
  const q = mc.qs[mc.idx];

  // ---- 版面：電腦＝左邊畫面、右邊題目；手機＝上面畫面、下面題目 ----
  let media, tx, tw, ty;
  if (wide) {
    const lw = W * (mc.mode === 'puzzle' ? 0.5 : 0.46), aw = lw - m * 1.5, ah = H - BAR - m * 2;
    if (mc.mode === 'puzzle') media = { x: m, y: BAR + m, w: aw, h: ah };
    else { const w = min(aw, ah * 4 / 3), h = w * 0.75; media = { x: m + (aw - w) / 2, y: BAR + m + (ah - h) / 2, w, h }; }
    tx = lw + m * 0.5; tw = W - tx - m * 1.5; ty = BAR + m;
  } else {
    const aw = W - m * 2, hh = min(H * 0.3, aw * 0.75);
    if (mc.mode === 'puzzle') media = { x: m, y: BAR + F(72), w: aw, h: min(hh, aw * 0.4) };
    else { const w = min(aw, hh * 4 / 3); media = { x: (W - w) / 2, y: BAR + F(72), w, h: w * 0.75 }; }
    tx = m; tw = aw; ty = media.y + media.h + F(14);
  }

  // 進度（手機放最上面，電腦放右欄最上面）
  const px = wide ? tx : m, pw = wide ? tw : W - m * 2, py = wide ? ty : BAR + F(10);
  { const n = mc.qs.length, dr = min(F(8), (pw - F(4)) / n / 2.3), step = min(dr * 2.6, pw / n);         // 進度：一排圓點，答對綠、答錯紅、目前這題藍色放大
    noStroke();
    for (let i = 0; i < n; i++) {
      const r = mc.rec[i], cur = i === mc.idx, cx = px + dr + i * step, cy = py + F(6);
      fill(cur ? ART.blue : r ? (r.ok ? '#2e9e4f' : '#d64545') : 'rgba(95,130,100,0.28)'); circle(cx, cy, cur ? dr * 2.5 : dr * 1.7);
    } }
  txt('第 ' + (mc.idx + 1) + ' / ' + mc.qs.length + ' 題　得分 ' + mc.score, px, py + F(30), F(17), '#557a5c', LEFT);
  if (FEATURES.F5_timer) txt('⏱ ' + mmss(millis() - mc.t0), px + pw, py + F(30), F(17), '#557a5c', RIGHT);
  if (wide) ty += F(56);

  // ---- 畫面區 ----
  if (mc.mode === 'puzzle') drawTiles(media, q.sp);
  else if (q.type === 'video') {                              // 影片題：點畫面可以播放／暫停
    noStroke(); fill('#1f2a24'); rect(media.x, media.y, media.w, media.h, F(16));
    const sp = q.sp;
    if (sp.vid && sp.vidOk && sp.vid.elt.videoWidth) {
      const vw = sp.vid.elt.videoWidth, vh = sp.vid.elt.videoHeight, sc = min(media.w / vw, media.h / vh);
      image(sp.vid, media.x + (media.w - vw * sc) / 2, media.y + (media.h - vh * sc) / 2, vw * sc, vh * sc);
      if (sp.vid.elt.paused) { fill(0, 0, 0, 110); rect(media.x, media.y, media.w, media.h, F(16)); fill(255); const r = min(media.w, media.h) * 0.14; triangle(media.x + media.w / 2 - r * 0.6, media.y + media.h / 2 - r, media.x + media.w / 2 - r * 0.6, media.y + media.h / 2 + r, media.x + media.w / 2 + r, media.y + media.h / 2); }
    } else txt('影片載入中…', media.x + media.w / 2, media.y + media.h / 2, F(20), '#fff');
    btns.push({ x: media.x, y: media.y, w: media.w, h: media.h, fn: () => toggleVideo(sp) });
  }
  else if ((q.type === 'sound' && mc.picked < 0) || q.type === 'snd2pic') {              // 聽聲音題：先不顯示動物，只有跳動的聲波
    noStroke(); fill('#2f5a7a'); rect(media.x, media.y, media.w, media.h, F(16));
    for (let k = 0; k < 9; k++) { const bh = F(10) + abs(sin(millis() / 180 + k)) * media.h * 0.35; fill('#8fd0f5'); rect(media.x + media.w / 2 - media.w * 0.3 + k * media.w * 0.075, media.y + media.h * 0.4 - bh / 2, media.w * 0.04, bh, F(5)); }
    button(media.x + media.w / 2 - F(90), media.y + media.h - F(60), F(180), F(46), '▶ 播放／重聽', '#f0a020', () => playSpeciesSound(q.sp), { size: F(19) });
  } else {
    drawPlate(media.x, media.y, media.w, media.h, (x, y, w, h) => drawQMedia(q.sp, x, y, w, h));
    if (hasPhoto(q.sp) && (q.type === 'img' || mc.picked >= 0)) {                      // 照片旁邊貼上原本的可愛動畫動物
      const sw = min(media.w, media.h * 1.33) * 0.3, sh = sw * 0.75;
      const low = STICKER_LOW[q.sp.id];                                              // 有些照片的主角在右上角（例如獼猴的臉），貼紙改貼右下角
      drawSticker(q.sp, media.x + media.w - sw - F(10), low ? media.y + media.h - sh - F(10) : media.y + F(10), sw, sh);
    }
  }

  // ---- 題目 ----
  const qs = F(wide ? 30 : 22), qLines = wrapLines(q.q, tw, qs);
  let y = paraText(qLines, tx, ty, qs, '#1f5a34', qs * 1.4, LEFT) + F(10);

  if (q.optType) {                                             // 聽力題：選項是圖片或聲音
    const ts0 = F(wide ? 20 : 16), reserve = F(48) + ts0 * 1.5 * 3 + F(wide ? 56 : 48) + F(36);
    const avail = H - y - F(10) - (mc.picked >= 0 ? reserve : 0);
    y = q.optType === 'pic' ? drawPicOptions(q, tx, y, tw, avail) : drawSndOptions(q, tx, y, tw);
  }
  if (q.optType && mc.picked < 0) { /* 等玩家選擇 */ }
  else if (mc.picked < 0) {
    const two = !wide && W >= 720, gap = F(10), oh = F(wide ? 62 : 50), ow = two ? (tw - gap) / 2 : tw;
    for (let i = 0; i < q.opts.length; i++) {
      const ox = tx + (two ? (i % 2) * (ow + gap) : 0), oy = y + (two ? floor(i / 2) : i) * (oh + gap);
      optButton(ox, oy, ow, oh, i, q.opts[i], () => mcAnswer(i));
    }
  } else {
    // 立即回饋：對或錯＋正確答案＋解說＋下一題
    const ok = mc.picked === q.a, bh = F(wide ? 56 : 48), ts = F(wide ? 20 : 16), pad = F(14);
    const head = ok ? '✅ 答對了！' : '❌ 答錯了　正確答案：' + q.opts[q.a];
    const lines = wrapLines(q.explain, tw - pad * 2, ts);
    const room = H - y - F(12) - bh - F(60), maxL = max(1, floor(room / (ts * 1.5))), shown = lines.slice(0, maxL);
    const chH = F(48) + shown.length * ts * 1.5 + bh + F(24);
    fill(ok ? '#e4f6e8' : '#fdeaea'); stroke(ok ? '#2e9e4f' : '#d64545'); strokeWeight(2.5); rect(tx, y, tw, chH, F(16)); noStroke();
    txt(head, tx + pad, y + F(24), fitText(head, tw - pad * 2, F(wide ? 26 : 20)), ok ? '#1f7a3a' : '#b53333', LEFT, true);
    paraText(shown, tx + pad, y + F(46), ts, '#333', ts * 1.5, LEFT);
    button(tx + tw - F(170) - pad, y + chH - bh - F(12), F(170), bh, mc.idx + 1 >= mc.qs.length ? '看成績 →' : '下一題 →', '#38b25c', mcNext, { size: F(20) });
  }
  // 鍵盤提示：電腦（非觸控）才顯示，讓玩家知道可以用鍵盤作答
  if (FEATURES.F7_keyboard && (wide || !usingTouch)) {
    const kt = mc.picked < 0 ? '⌨ 鍵盤：按 1～4 選答案' : '⌨ 鍵盤：按 Enter（或空白鍵）進入下一題';
    const ks = F(wide ? 17 : 14); textSize(ks); const kw = textWidth(kt) + ks * 1.6, kh = ks * 1.9;
    noStroke(); fill(255, 255, 255, 215); rect(W / 2 - kw / 2, H - kh - F(8), kw, kh, kh / 2);
    txt(kt, W / 2, H - kh / 2 - F(8) + 1, ks, '#2f5f9e', CENTER, true);
  }
}

// 標本標籤式選項：左邊藍色編號章，文字靠左，滑過去外框變橘色
function optButton(x, y, w, h, i, label, fn) {
  const over = inRect(mouseX, mouseY, { x, y, w, h }), r = h * 0.5;
  noStroke(); fill(0, 0, 0, over ? 30 : 18); rect(x + 1, y + 3, w, h, F(14));
  fill(over ? '#fff8e8' : ART.paper); stroke(over ? '#f0a020' : '#c4d6c0'); strokeWeight(over ? 3 : 2); rect(x, y + (over ? -1 : 0), w, h, F(14)); noStroke();
  fill(ART.blue); circle(x + h * 0.5, y + h / 2 + (over ? -1 : 0), h * 0.62);
  txt(String(i + 1), x + h * 0.5, y + h / 2 + (over ? -1 : 0), h * 0.34, '#fff', CENTER, true);
  txt(label, x + h * 0.95, y + h / 2 + (over ? -1 : 0), fitText(label, w - h * 1.1, F(wide ? 24 : 19)), ART.ink, LEFT);
  btns.push({ x, y, w, h, fn });
}
// 題目畫面：有真實照片就顯示照片（直式、橫式都完整顯示並標出處），沒有就用程式畫的插圖
function drawQMedia(sp, x, y, w, h) {
  if (hasPhoto(sp)) {
    drawPhotoFit(sp.photo, x, y, w, h);
    const cr = PHOTO_CREDITS[sp.id]; if (cr) photoCreditBar(cr, x, y + h, w, min(F(12), w * 0.03));
  } else drawScene(sp, x, y, w, h);
}
function optImg(q, sp, x, y, w, h) { if (q.optPhoto && hasPhoto(sp)) drawPhotoFit(sp.photo, x, y, w, h); else drawScene(sp, x, y, w, h); }
// 聽力題選項＝2×2 圖片；答完後正確的框綠色、選錯的框紅色，並顯示名字
function drawPicOptions(q, x, y, w, avail) {
  const g = F(10), tw = (w - g) / 2, th = max(F(46), min(tw * 0.72, (avail - g) / 2)), done = mc.picked >= 0;
  for (let i = 0; i < q.optSp.length; i++) {
    const ox = x + (i % 2) * (tw + g), oy = y + floor(i / 2) * (th + g), sp = q.optSp[i], over = !done && inRect(mouseX, mouseY, { x: ox, y: oy, w: tw, h: th });
    const col = done ? (i === q.a ? '#2e9e4f' : i === mc.picked ? '#d64545' : '#b9d6bd') : over ? '#f0a020' : '#b9d6bd';
    noStroke(); fill(255); stroke(col); strokeWeight(done && (i === q.a || i === mc.picked) ? 5 : over ? 4 : 2.5); rect(ox - 2, oy - 2, tw + 4, th + 4, F(12)); noStroke();
    optImg(q, sp, ox, oy, tw, th);
    fill(0, 0, 0, 140); circle(ox + F(16), oy + F(16), F(26)); txt(String(i + 1), ox + F(16), oy + F(16), F(16), '#fff', CENTER, true);
    if (done) { fill(0, 0, 0, 150); rect(ox, oy + th - F(26), tw, F(26)); txt(sp.name, ox + tw / 2, oy + th - F(13), fitText(sp.name, tw - F(10), F(16)), '#fff', CENTER, true); }
    else btns.push({ x: ox, y: oy, w: tw, h: th, fn: () => mcAnswer(i) });
  }
  return y + th * 2 + g * 2;
}
// 聽力題選項＝聲音：左邊 ▶ 試聽，右邊按下去就是作答
function drawSndOptions(q, x, y, w) {
  const g = F(10), oh = F(wide ? 66 : 54), done = mc.picked >= 0;
  for (let i = 0; i < q.optSp.length; i++) {
    const oy = y + i * (oh + g), sp = q.optSp[i];
    button(x, oy, oh, oh, '▶', '#2f7ab0', () => playSpeciesSound(sp), { size: F(26) });
    const lab = (i + 1) + '． 聲音 ' + 'ABC'[i] + (done ? '　＝ ' + sp.name : '');
    if (done) {
      const c = i === q.a ? '#2e9e4f' : i === mc.picked ? '#d64545' : '#e9efe9';
      noStroke(); fill(c); rect(x + oh + g, oy, w - oh - g, oh, F(14));
      txt(lab, x + oh + g + F(14), oy + oh / 2, fitText(lab, w - oh - g - F(24), F(wide ? 22 : 18)), i === q.a || i === mc.picked ? '#fff' : '#557a5c', LEFT, true);
    } else optButton(x + oh + g, oy, w - oh - g, oh, i, '聲音 ' + 'ABC'[i], () => mcAnswer(i));
  }
  return y + q.optSp.length * (oh + g);
}

// 全部答完後：拼圖顯示完整拼貼，闖關顯示完成畫面
function drawMCDone() {
  const W = width, H = height;
  if (mc.mode === 'puzzle') {
    const full = mc.score === mc.qs.length, msg = full ? '🧩 拼圖完成！你解鎖了全部 ' + mc.qs.length + ' 種生態畫面' : '解鎖 ' + mc.score + ' / ' + mc.qs.length + ' 格（可以再挑戰一次）';
    txt(msg, W / 2, BAR + F(34), fitText(msg, W - F(24), F(wide ? 28 : 20)), '#2e6b3a', CENTER, true);
    drawTiles({ x: F(18), y: BAR + F(60), w: W - F(36), h: H - BAR - F(60) - F(110) }, null);
  } else {
    txt('🎉 闖關完成', W / 2, H * 0.3, F(44), '#2e6b3a', CENTER, true);
    txt('得分 ' + mc.score + ' / ' + mc.qs.length, W / 2, H * 0.42, F(34), '#557a5c');
  }
  const bw = min((W - F(40)) / 3, F(210)), bh = F(52), by = H - bh - F(24), g = F(10);
  button(W / 2 - bw * 1.5 - g, by, bw, bh, '📊 看成績', '#f0a020', () => { panel = mc.panel; });
  button(W / 2 - bw / 2, by, bw, bh, '🔄 再玩一次', '#4a96e8', () => mc.daily ? startDaily() : startMC(mc.mode));
  button(W / 2 + bw / 2 + g, by, bw, bh, '🏠 回主頁', '#6a8f72', () => { view = retView; confetti = []; confettiFrames = 0; });
}

// ============================================================
//  成績面板（交卷後才顯示：總成績、錯誤題、正確選項）
// ============================================================
function buildPanel(mode, score, total, lines, header, canClose, onRetry, extra) {
  extra = extra || {};
  if (!extra.retry) recordPlay(mode, score, total);        // 登記遊玩次數、檢查成就（錯題再練不計）
  const best = store.best[mode] || 0;
  if (!extra.retry && score > best) { store.best[mode] = score; saveStore(); }
  const pass = score / total * 100 > PASS_LINE;
  if (pass) { startConfetti(); sfx('win'); } else sfx('lose');    // 高於 60% 才放彩帶
  const rec = !extra.retry && extra.ms ? recordRun(mode, score, total, extra.ms, extra.goals) : null;     // 存這次成績，並和上一次比較
  if (rec) checkAch();
  return { run: rec && rec.run, cmp: rec ? rec.cmp : null, score, total, lines, header, pass, canClose, onRetry, newBest: !extra.retry && score > best,
           goals: extra.goals || null, ms: extra.ms || 0, retry: !!extra.retry, onRetryWrong: extra.onRetryWrong || null };
}
function drawPanel() {
  btns = [];                                    // 面板開啟時，只允許點面板上的按鈕
  const W = width, H = height, p = panel;
  noStroke(); fill(0, 0, 0, 130); rect(0, 0, W, H);
  const pw = min(W * 0.94, F(660)), ts = F(wide ? 19 : 16), lh = ts * 1.65, bh = F(48);
  // 按鈕：再玩一次、錯題再練、回主頁、查看（超過 3 顆就排兩列）
  const bl = [[p.cmp && p.cmp.length > 1 || (p.run && modeRuns(p.run.mode).length > 1) ? '🔄 再挑戰' : '🔄 再玩一次', '#4a96e8', () => { panel = null; p.onRetry(); }]];
  if (p.onRetryWrong) bl.push(['✏️ 錯題再練', '#e8803a', () => { panel = null; confetti = []; confettiFrames = 0; p.onRetryWrong(); }]);
  if (p.run) bl.push(['📈 我的進步', '#d9702a', () => { panel = null; confetti = []; confettiFrames = 0; openProgress(retView, p.run.mode); }]);
  bl.push(['🏠 回主頁', '#6a8f72', () => { panel = null; view = retView; confetti = []; confettiFrames = 0; }]);
  if (p.canClose) bl.push(['👀 查看', '#38b25c', () => { panel = null; }]);
  const perRow = bl.length > 3 ? 2 : bl.length, rows = ceil(bl.length / perRow);
  const goalH = p.goals ? lh * 1.05 * p.goals.length + lh * 0.9 : 0;
  const cmpH = p.cmp ? lh * 1.15 * p.cmp.length : 0;
  const fixedH = F(30) + lh * 1.7 + lh * 2.6 + lh * 1.4 + cmpH + goalH + lh * 1.4 + F(30) + rows * (bh + F(10)) + F(8);
  const maxLines = max(1, floor((H * 0.96 - fixedH) / lh));
  let lines = [];
  for (const l of p.lines) for (const s of wrapLines(l, pw - F(56), ts)) lines.push(s);
  let more = 0;
  if (lines.length > maxLines) { more = lines.length - maxLines + 1; lines = lines.slice(0, maxLines - 1); }
  const ph = fixedH + lh * (lines.length + (more ? 1 : 0)), px = W / 2 - pw / 2, py = max(6, H / 2 - ph / 2);
  if (wide && px > F(200) && store.avatar) drawAvatar(px - F(100), py + ph, min(F(260), ph * 0.85), store.avatar, millis() / 1000, p.pass ? 'cheer' : 'idle');   // 角色在旁邊反應
  card(px, py, pw, ph, '#ffffff');
  let y = py + F(32);
  txt(p.retry ? '錯題再練結果' : '測驗結果', W / 2, y, ts * 1.5, '#2e6b3a', CENTER, true); y += lh * 1.7;
  txt(p.score + ' / ' + p.total + '（' + round(p.score / p.total * 100) + '%）', W / 2, y, ts * 2.3, p.pass ? '#2e9e4f' : '#d64545', CENTER, true); y += lh * 1.6;
  let msg = p.pass ? '🎉 成績超過 60%，恭喜通過！' + (p.newBest ? ' 新紀錄！' : '') : '💪 成績要高於 60% 才算通過，再試一次！';
  if (FEATURES.F5_timer && p.ms) msg += '　⏱ ' + mmss(p.ms);
  txt(msg, W / 2, y, fitText(msg, pw - F(30), ts * 1.05), '#555'); y += lh * 1.3;
  if (p.cmp) for (const c of p.cmp) { txt(c.txt, W / 2, y, fitText(c.txt, pw - F(30), ts * 0.95), c.col, CENTER, true); y += lh * 1.15; }     // 和上一次比
  // 學習目標達成情形（對應 PBL 1-2）
  if (p.goals) {
    txt('學習目標達成情形', px + F(28), y, ts * 0.9, '#2e6b3a', LEFT, true); y += lh * 0.9;
    for (const go of p.goals) {
      const ratio = go.n ? go.ok / go.n : 0, bx = px + pw * 0.58, bw = pw * 0.42 - F(80);
      txt(go.id + '. ' + go.text, px + F(28), y, fitText(go.id + '. ' + go.text, pw * 0.58 - F(36), ts * 0.78), '#333', LEFT);
      noStroke(); fill('#dde6df'); rect(bx, y - F(4), bw, F(8), F(4));
      fill(ratio >= 0.8 ? STYLE.ok : ratio >= 0.5 ? STYLE.accent : STYLE.bad); rect(bx, y - F(4), bw * ratio, F(8), F(4));
      txt(go.n ? go.ok + '/' + go.n : '—', px + pw - F(28), y, ts * 0.8, '#557a5c', RIGHT);
      y += lh * 1.05;
    }
    y += lh * 0.15;
  }
  txt(p.lines.length ? p.header : '✅ 全部答對，沒有錯誤題！', px + F(28), y, fitText(p.header, pw - F(56), ts), '#2e6b3a', LEFT, true); y += lh * 0.95;
  y = paraText(lines, px + F(28), y, ts, '#333', lh, LEFT);
  if (more) paraText(['…還有 ' + more + ' 行，請按「查看」逐題檢查'], px + F(28), y, ts, '#888', lh, LEFT);
  const bw = (pw - F(56) - (perRow - 1) * F(10)) / perRow;
  bl.forEach((b, i) => {
    const r = floor(i / perRow), c = i % perRow, by = py + ph - (rows - r) * (bh + F(10)) - F(2);
    button(px + F(28) + c * (bw + F(10)), by, bw, bh, b[0], b[1], b[2], { size: F(17) });
  });
}

// ============================================================
//  解說卡（物種詳細資料）：電腦＝圖在左、文字在右；手機＝圖在上、文字在下
// ============================================================
function drawModal() {
  btns = []; const sp = modal, W = width, H = height;
  noStroke(); fill(0, 0, 0, 150); rect(0, 0, W, H);
  const pad = F(18), ts = F(wide ? 20 : 16);
  let cw, imgW, imgH, tw, textX, chH, cx, cy;
  if (wide) {
    cw = min(W * 0.88, F(1000)); imgW = cw * 0.48; imgH = imgW * 0.75; tw = cw - imgW - pad * 3;
  } else {
    cw = min(W * 0.94, F(560)); imgW = cw - pad * 2; imgH = min(imgW * 0.62, H * 0.3); tw = cw - pad * 2;
  }
  const habLines = wrapLines('棲地：' + sp.habitat, tw, ts), infoLines = wrapLines(sp.info, tw, ts), noteLines = wrapLines('📌 ' + KIND_NOTE[sp.kind], tw, ts * 0.9);
  const textH = F(42) + F(40) + (habLines.length + infoLines.length + noteLines.length * 0.9) * ts * 1.5 + F(20);
  if (wide) { chH = max(imgH + pad * 2, textH + F(70) + pad * 2); cx = (W - cw) / 2; cy = max(6, (H - chH) / 2); textX = cx + pad * 2 + imgW; }
  else { chH = pad + imgH + F(12) + textH + F(70) + pad; cx = (W - cw) / 2; cy = max(6, (H - chH) / 2); textX = cx + pad; }
  card(cx, cy, cw, chH, '#ffffff');
  let y;
  if (wide) { drawScene(sp, cx + pad, cy + pad, imgW, imgH); y = cy + pad; }
  else { drawScene(sp, cx + pad, cy + pad, imgW, imgH); y = cy + pad + imgH + F(12); }
  txt(sp.name, textX, y + F(22), fitText(sp.name, tw, F(wide ? 38 : 28)), '#2e6b3a', LEFT, true); y += F(46);
  let px = textX;
  px += pill(px, y, sp.kind, kindColor(sp.kind), F(15)) + F(6);
  px += pill(px, y, sp.cls, '#8a6bc8', F(15)) + F(6);
  if (sp.status) pill(px, y, sp.status, '#e08a20', F(15));
  y += F(40);
  y = paraText(habLines, textX, y, ts, '#2f4a36', ts * 1.5, LEFT);
  y = paraText(infoLines, textX, y + F(6), ts, '#333', ts * 1.5, LEFT);
  paraText(noteLines, textX, y + F(8), ts * 0.9, '#6a5a8a', ts * 1.35, LEFT);
  button(cx + cw - F(150) - pad, cy + chH - F(52) - pad * 0.6, F(150), F(48), '關閉', '#6a8f72', () => { modal = null; }, { size: F(19) });
}

// ============================================================
//  生態圖鑑：答對的物種會解鎖，點卡片看解說
// ============================================================
function drawDex() {
  const W = width, H = height;
  topBar('📖 生態圖鑑');
  const head = '已收集 ' + dexCount() + ' / ' + SPECIES.length + '　在任何玩法答對，就能解鎖該物種';
  txt(head, W / 2, BAR + F(22), fitText(head, W - F(20), F(17)), '#557a5c');
  const cols = wide ? 5 : 3, rows = ceil(SPECIES.length / cols);
  const top = BAR + F(44), cw = W / cols, ch = (H - top - F(8)) / rows;
  for (let i = 0; i < SPECIES.length; i++) {
    const sp = SPECIES[i], got = !!store.dex[sp.id], x = (i % cols) * cw + F(6), y = top + floor(i / cols) * ch, w = cw - F(12), h = ch - F(8), ih = h - F(34);
    noStroke(); fill(got ? '#fff' : '#cfdccf'); rect(x, y, w, h, F(12));
    if (got) {
      drawScene(sp, x + 4, y + 4, w - 8, ih - 4);
      txt(sp.name, x + w / 2, y + h - F(16), fitText(sp.name, w - F(8), F(17)), '#2e6b3a', CENTER, true);
      btns.push({ x, y, w, h, fn: () => { modal = sp; } });
    } else { txt('?', x + w / 2, y + ih / 2, min(w, ih) * 0.5, '#9db8a2', CENTER, true); txt('尚未發現', x + w / 2, y + h - F(16), F(15), '#7d907f'); }
  }
}

// ============================================================
//  彩帶（成績高於 60% 才會從左右下角噴出）
// ============================================================
function startConfetti() {
  confetti = []; confettiFrames = 90;
  for (let i = 0; i < 60; i++) { spawnConfetti(true); spawnConfetti(false); }
}
function spawnConfetti(left) {
  const sc = height / 800, ang = random(PI * 0.2, PI * 0.45), sp = random(14, 30) * sc;
  confetti.push({
    x: left ? 0 : width, y: height,
    vx: (left ? 1 : -1) * cos(ang) * sp, vy: -sin(ang) * sp,
    w: random(6, 12), h: random(10, 18), rot: random(TWO_PI), vr: random(-0.3, 0.3),
    col: random(['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c']), g: 0.45 * sc + 0.1
  });
}
function updateConfetti() {
  if (confettiFrames > 0) { confettiFrames--; for (let i = 0; i < 2; i++) { spawnConfetti(true); spawnConfetti(false); } }
  for (let i = confetti.length - 1; i >= 0; i--) {
    const p = confetti[i];
    p.vy += p.g; p.vx *= 0.985; p.vy *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    push(); translate(p.x, p.y); rotate(p.rot); noStroke(); fill(p.col); rect(-p.w / 2, -p.h / 2, p.w, p.h); pop();
    if (p.y > height + 40) confetti.splice(i, 1);
  }
}
