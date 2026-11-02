// ============================================================
//  我的進步：和「自己前幾次的成績」比，不需要網路，也不會上傳任何資料
//  - 每次交卷都存一筆（玩法、答對、時間、三個學習目標各答對幾題），存在這台裝置的 localStorage
//  - 成績面板會立刻顯示「比上次進步多少」；「我的進步」頁有折線圖與學習目標變化
// ============================================================
const PROG_MODES = [
  { id: 'quiz', name: '闖關', full: '點選闖關' }, { id: 'puzzle', name: '拼圖', full: '解鎖拼圖' },
  { id: 'drag', name: '拖曳', full: '拖曳配對' }, { id: 'daily', name: '每日', full: '每日挑戰' }
];
const FAST_MIN_ACC = 80;                       // 「最快時間」只算正確率 80% 以上的紀錄，避免亂按交卷
let pg = { mode: 'quiz', metric: 'acc' };

function modeRuns(mode) { return (store.runs || []).filter(r => r.mode === mode); }
function bestAcc(rs) { return rs.length ? max(...rs.map(r => r.acc)) : null; }
function bestMs(rs) { const f = rs.filter(r => r.acc >= FAST_MIN_ACC); return f.length ? min(...f.map(r => r.ms)) : null; }
function fmtMs(ms) { const s = ms / 1000; return s >= 60 ? floor(s / 60) + ' 分 ' + floor(s % 60) + ' 秒' : s.toFixed(1) + ' 秒'; }
let progBack = 'home';                           // 「我的進步」返回的頁面（和遊戲的 retView 分開，避免返回卡住）
function openProgress(from, mode) { if (from && from !== 'progress') progBack = from; retView = progBack; if (mode) pg.mode = mode; view = 'progress'; }

// 記錄這一次，並和同玩法的上一次、歷史最佳比較。回傳 { run, cmp: [要顯示的文字行] }
function recordRun(mode, score, total, ms, goals) {
  const old = modeRuns(mode), prev = old[old.length - 1] || null;
  const run = { mode, score, total, ms: round(ms || 0), acc: round(score * 1000 / total) / 10, t: Date.now(), g: (goals || []).map(g => [g.ok, g.n]) };
  const lines = [];
  if (!prev) lines.push({ txt: '🌟 這是你的第一筆紀錄，下次就能和自己比！', col: '#557a5c' });
  else {
    const dA = round((run.acc - prev.acc) * 10) / 10, dT = round((run.ms - prev.ms) / 100) / 10;
    const a = dA > 0 ? '▲ 比上次多 ' + dA + '%' : dA < 0 ? '▼ 比上次少 ' + (-dA) + '%' : '＝ 和上次一樣';
    const t = dT < 0 ? '快了 ' + (-dT) + ' 秒' : dT > 0 ? '慢了 ' + dT + ' 秒' : '時間一樣';
    lines.push({ txt: a + '（' + prev.acc + '% → ' + run.acc + '%）・' + t, col: dA > 0 ? '#2e9e4f' : dA < 0 ? '#d64545' : '#557a5c' });
    if (dA > 0) store.beat = true;
  }
  const ba = bestAcc(old), bm = bestMs(old), tags = [];
  if (old.length && ba !== null && run.acc > ba) tags.push('最高正確率');
  if (run.acc >= FAST_MIN_ACC && bm !== null && run.ms < bm) { tags.push('最快時間'); store.fast = true; }
  if (tags.length) lines.push({ txt: '🏅 刷新個人紀錄：' + tags.join('、'), col: '#d9702a' });
  store.runs = (store.runs || []).concat(run).slice(-120); saveStore();
  return { run, cmp: lines };
}

// ---- 畫面 ----
function chip(x, y, w, h, label, on, fn, col) {
  const over = inRect(mouseX, mouseY, { x, y, w, h });
  noStroke(); fill(on ? (col || ART.blue) : over ? '#fff8e8' : ART.paper); stroke(on ? (col || ART.blue) : '#c4d6c0'); strokeWeight(2); rect(x, y, w, h, h / 2); noStroke();
  txt(label, x + w / 2, y + h / 2 + 1, fitText(label, w - F(10), F(wide ? 19 : 16)), on ? '#fff' : ART.ink, CENTER, on);
  btns.push({ x, y, w, h, fn });
}
function drawProgress(t) {
  const W = width, H = height, cw = min(W - F(24), F(760)), x0 = (W - cw) / 2, g = F(8);
  topBar('📈 我的進步', progBack);
  let y = BAR + F(10);
  const mh = F(wide ? 40 : 38), mw = (cw - g * 3) / 4;
  PROG_MODES.forEach((m, i) => chip(x0 + i * (mw + g), y, mw, mh, m.name, pg.mode === m.id, () => { pg.mode = m.id; }));
  y += mh + g * 1.5;
  const rs = modeRuns(pg.mode), full = PROG_MODES.find(m => m.id === pg.mode).full;
  if (!rs.length) {
    txt('還沒有「' + full + '」的紀錄', W / 2, y + F(70), F(22), ART.ink, CENTER, true);
    txt('玩一場就會開始記錄，之後可以和自己比', W / 2, y + F(104), fitText('玩一場就會開始記錄，之後可以和自己比', cw, F(17)), '#557a5c');
    button(W / 2 - F(90), y + F(130), F(180), F(50), '去玩一場', '#38b25c', () => { retView = 'progress'; if (pg.mode === 'drag') startDrag(); else if (pg.mode === 'daily') startDaily(); else startMC(pg.mode); }, { size: F(20) });
    return;
  }
  // ---- 三張摘要卡：最高正確率、最快時間、遊玩次數 ----
  const ba = bestAcc(rs), bm = bestMs(rs), ch = F(wide ? 70 : 64), cwid = (cw - g * 2) / 3;
  [['最高正確率', ba + '%', '#2e9e4f'], ['最快時間', bm === null ? '—' : fmtMs(bm), '#d9702a'], ['已玩次數', rs.length + ' 次', ART.blue]].forEach((c, i) => {
    const cx = x0 + i * (cwid + g);
    noStroke(); fill(0, 0, 0, 16); rect(cx + 1, y + 3, cwid, ch, F(12)); fill(ART.paper); stroke('#d3e0cf'); strokeWeight(1.5); rect(cx, y, cwid, ch, F(12)); noStroke();
    txt(c[0], cx + cwid / 2, y + ch * 0.28, fitText(c[0], cwid - F(8), F(14)), '#6a7a6e');
    txt(c[1], cx + cwid / 2, y + ch * 0.66, fitText(c[1], cwid - F(10), F(wide ? 28 : 24)), c[2], CENTER, true);
  });
  y += ch + g;
  if (bm === null) txt('最快時間只計算正確率 ' + FAST_MIN_ACC + '% 以上的紀錄', x0, y + F(6), fitText('最快時間只計算正確率 ' + FAST_MIN_ACC + '% 以上的紀錄', cw, F(13)), '#8a9a8e', LEFT);
  y += F(18);
  // ---- 折線圖：最近 10 次 ----
  const w2 = (cw - g) / 2;
  chip(x0, y, w2, F(34), '🎯 正確率', pg.metric === 'acc', () => { pg.metric = 'acc'; }, '#2e9e4f');
  chip(x0 + w2 + g, y, w2, F(34), '⏱ 時間', pg.metric === 'ms', () => { pg.metric = 'ms'; }, '#d9702a');
  y += F(34) + g;
  const goalH = F(wide ? 28 : 30) * 3 + F(34), chartH = max(F(110), min(F(wide ? 200 : 190), H - y - goalH - F(16)));
  drawRunChart(x0, y, cw, chartH, rs.slice(-10));
  y += chartH + F(10);
  // ---- 三個學習目標：最近 5 次 vs 之前 ----
  txt('學習目標：最近 5 次的答對率（和之前比）', x0, y + F(8), fitText('學習目標：最近 5 次的答對率（和之前比）', cw, F(15)), ART.ink, LEFT, true);
  y += F(26);
  const all = (store.runs || []).filter(r => r.g && r.g.length), recent = all.slice(-5), before = all.slice(0, -5);
  const rate = (list, i) => { let o = 0, n = 0; for (const r of list) if (r.g[i]) { o += r.g[i][0]; n += r.g[i][1]; } return n ? o / n : null; };
  PROJECT.goals.forEach((go, i) => {
    const a = rate(recent, i), b = rate(before, i), rowH = F(wide ? 28 : 30), ry = y + i * rowH;
    const label = go.id + '. ' + go.text, lw = cw * 0.5;
    txt(label, x0, ry + rowH * 0.4, fitText(label, lw, F(wide ? 15 : 13)), '#333', LEFT);
    const bx = x0 + lw + F(10), bw = cw - lw - F(10) - F(92);
    noStroke(); fill('#dde6df'); rect(bx, ry + rowH * 0.4 - F(4), bw, F(8), F(4));
    if (a !== null) { fill(a >= 0.8 ? STYLE.ok : a >= 0.5 ? STYLE.accent : STYLE.bad); rect(bx, ry + rowH * 0.4 - F(4), bw * a, F(8), F(4)); }
    const d = a !== null && b !== null ? round((a - b) * 100) : null;
    txt(a === null ? '—' : round(a * 100) + '%', bx + bw + F(8), ry + rowH * 0.4, F(14), '#557a5c', LEFT, true);
    if (d !== null) txt(d > 0 ? '▲' + d : d < 0 ? '▼' + (-d) : '＝', x0 + cw, ry + rowH * 0.4, F(14), d > 0 ? '#2e9e4f' : d < 0 ? '#d64545' : '#8a9a8e', RIGHT, true);
  });
}
function drawRunChart(x, y, w, h, rs) {
  const acc = pg.metric === 'acc', vals = rs.map(r => acc ? r.acc : r.ms / 1000), top = acc ? 100 : max(10, ceil(max(...vals) * 1.15 / 10) * 10);
  noStroke(); fill(0, 0, 0, 14); rect(x + 1, y + 3, w, h, F(12)); fill(ART.paper); stroke('#d3e0cf'); strokeWeight(1.5); rect(x, y, w, h, F(12)); noStroke();
  const pl = F(46), pr = F(22), pt = F(20), pb = F(26), cx0 = x + pl, cx1 = x + w - pr, cy0 = y + pt, cy1 = y + h - pb;
  stroke(0, 0, 0, 18); strokeWeight(1);
  for (let k = 0; k <= 2; k++) { const gy = lerp(cy1, cy0, k / 2); line(cx0, gy, cx1, gy); noStroke(); txt(acc ? round(top * k / 2) + '%' : round(top * k / 2) + ' 秒', x + pl - F(6), gy, F(12), '#8a9a8e', RIGHT); stroke(0, 0, 0, 18); }
  noStroke();
  const px = i => rs.length === 1 ? (cx0 + cx1) / 2 : lerp(cx0 + F(8), cx1 - F(8), i / (rs.length - 1)), py = v => lerp(cy1, cy0, constrain(v / top, 0, 1));
  const col = acc ? '#2e9e4f' : '#d9702a', bestI = vals.indexOf(acc ? max(...vals) : min(...vals));
  noFill(); stroke(col); strokeWeight(F(3)); beginShape(); vals.forEach((v, i) => vertex(px(i), py(v))); endShape(); noStroke();
  vals.forEach((v, i) => {
    const last = i === vals.length - 1;
    fill('#fff'); stroke(col); strokeWeight(2.5); circle(px(i), py(v), last ? F(14) : F(9)); noStroke();
    if (i === bestI) txt('★', px(i), py(v) - F(14), F(15), '#e8b83a', CENTER, true);
    if (last) txt(acc ? v + '%' : v.toFixed(1) + ' 秒', px(i), py(v) + F(17), F(13), col, CENTER, true);
  });
  txt('最近 ' + rs.length + ' 次（★＝最好）', x + w - pr, y + F(11), F(12), '#8a9a8e', RIGHT);
  if (rs.length === 1) txt('再玩一次，就會連成線', (cx0 + cx1) / 2, cy0 + F(8), F(13), '#8a9a8e');
}
