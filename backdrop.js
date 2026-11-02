// ============================================================
//  背景動畫：首頁（臺灣島＋原生種縮圖＋海＋飛鳥）與頁面A（森林步道，會慢慢從黃昏變白天）
// ============================================================

// 把兩個顏色混在一起，回傳 CSS 顏色字串（k = 0 全是 a，k = 1 全是 b）
function mix(a, b, k) { return lerpColor(color(a), color(b), constrain(k, 0, 1)).toString(); }

// ---------- 飄落的葉子與山櫻花瓣 ----------
let LEAVES = [];
function updateLeaves(t) {
  const W = width, H = height;
  if (LEAVES.length < 26) {
    while (LEAVES.length < 26) LEAVES.push({ x: random(W), y: random(-H, H), vy: random(0.5, 1.4), vx: random(-0.4, 0.6), r: random(5, 10), rot: random(TWO_PI), vr: random(-0.04, 0.04), col: random(['#8fd18f', '#a6dc7a', '#ffb7c5', '#ffd0dc']) });
  }
  noStroke();
  for (const l of LEAVES) {
    l.y += l.vy; l.x += l.vx + sin(t * 1.3 + l.rot * 3) * 0.5; l.rot += l.vr;
    if (l.y > H + 20) { l.y = -20; l.x = random(W); }
    if (l.x > W + 20) l.x = -20;
    push(); translate(l.x, l.y); rotate(l.rot); fill(l.col); ellipse(0, 0, l.r * (UI > 1.3 ? 1.5 : 1.1), l.r * 0.55); pop();
  }
}

// ---------- 雲、鳥 ----------
function cloud(x, y, s, a) {
  noStroke(); fill(255, 255, 255, a);
  ellipse(x, y, 90 * s, 34 * s); ellipse(x - 26 * s, y + 6 * s, 60 * s, 26 * s); ellipse(x + 28 * s, y + 6 * s, 64 * s, 28 * s); ellipse(x + 4 * s, y - 14 * s, 54 * s, 30 * s);
}
function flyingBird(x, y, s, t, col) {
  push(); translate(x, y); scale(s); noStroke();
  const fl = sin(t * 9) * 0.7;
  fill(col); ellipse(0, 0, 22, 11); circle(11, -2, 9);                                // 身體、頭
  fill('#e65a3a'); triangle(15, -3, 15, 0, 21, -1.5);                                 // 嘴
  push(); translate(-2, -2); rotate(-0.5 - fl); fill(mix(col, '#0a1a60', 0.35)); triangle(0, 0, -16, -3, -6, -16); pop();   // 翅膀
  fill(col); triangle(-10, 0, -34, -3, -34, 3); fill('#fff'); triangle(-28, -2.5, -38, -3.5, -38, 3.5);               // 長尾巴
  pop();
}

// ============================================================
//  首頁背景
// ============================================================
function drawHomeBackdrop(t) {
  const W = width, H = height;
  gradRect(0, 0, W, H * 0.78, '#8fd3f4', '#eaf8ea');                                   // 天空
  const sx = W * 0.86, sy = H * 0.16, sr = min(W, H) * 0.06;                           // 太陽
  noStroke(); fill(255, 244, 180, 40); circle(sx, sy, sr * 3.6); fill(255, 244, 180, 90); circle(sx, sy, sr * 2.4); fill('#fff3b0'); circle(sx, sy, sr * 1.5);
  cloud(((t * 9) % (W + 300)) - 150, H * 0.12, min(W, H) / 520, 190);
  cloud(((t * 6 + 400) % (W + 300)) - 150, H * 0.26, min(W, H) / 650, 150);
  cloud(((t * 12 + 700) % (W + 300)) - 150, H * 0.06, min(W, H) / 700, 160);
  fill('#b6dde0');                                                                       // 遠方的山
  beginShape(); vertex(0, H * 0.78);
  for (let x = 0; x <= W + 10; x += 10) vertex(x, H * 0.73 - (sin(x * 0.006) + 0.5 * sin(x * 0.017 + 2)) * H * 0.03);
  vertex(W, H * 0.78); endShape(CLOSE);
  gradRect(0, H * 0.74, W, H * 0.3, '#5cc0d6', '#2b86ad');                              // 海
  noFill();                                                                             // 波浪
  for (let r = 0; r < 5; r++) {
    stroke(255, 255, 255, 80 - r * 11); strokeWeight(2);
    beginShape();
    for (let x = 0; x <= W + 12; x += 12) vertex(x, H * (0.77 + r * 0.05) + sin(x * 0.02 + t * 1.2 + r * 1.7) * 4);
    endShape();
  }
  noStroke();
  for (let k = 0; k < 3; k++) {                                                          // 飛過的藍鵲
    const bx = ((t * (46 + k * 9) + k * 260) % (W + 240)) - 120;
    flyingBird(bx, H * (0.2 + k * 0.07) + sin(t * 1.7 + k) * 10, min(W, H) / 560 * (1 - k * 0.12), t + k, '#2f66d6');
  }
}

// ============================================================
//  臺灣島（用經緯度座標畫出輪廓，中間有中央山脈）
// ============================================================
const TW_LL = [[121.54, 25.30], [121.75, 25.13], [122.0, 25.0], [121.9, 24.85], [121.85, 24.6], [121.62, 24.0], [121.38, 23.1], [121.15, 22.75],
  [120.9, 22.35], [120.85, 21.9], [120.7, 22.0], [120.6, 22.3], [120.28, 22.6], [120.15, 23.0], [120.1, 23.5], [120.15, 23.75], [120.3, 24.0],
  [120.55, 24.3], [120.75, 24.6], [120.92, 24.85], [121.1, 25.05], [121.4, 25.18]];
const TW_MT = [[121.45, 24.85, 1], [121.32, 24.6, 1], [121.22, 24.3, 1.2], [121.1, 24.0, 1.3], [121.0, 23.7, 1.5], [120.96, 23.47, 1.9],
  [120.95, 23.2, 1.4], [120.9, 22.95, 1.3], [120.85, 22.6, 1.1], [120.8, 22.35, 0.9]];

// 臺灣島佔的方塊：中心 (cx, cy)、高度 h（寬度依真實比例）
function twBox(cx, cy, h) { const w = h * 0.56; return { x: cx - w / 2, y: cy - h / 2, w, h }; }
// 經緯度 → 畫面座標
function twXY(b, lon, lat) { return [b.x + (lon - 119.9) / 2.2 * b.w, b.y + (25.4 - lat) / 3.6 * b.h]; }
function twShape(P) {
  const n = P.length;
  beginShape();
  curveVertex(P[n - 1][0], P[n - 1][1]);
  for (const p of P) curveVertex(p[0], p[1]);
  curveVertex(P[0][0], P[0][1]); curveVertex(P[1][0], P[1][1]);
  endShape();
}
function drawTaiwanIsland(b, t) {
  const P = TW_LL.map(p => twXY(b, p[0], p[1]));
  push(); translate(0, sin(t * 1.1) * b.h * 0.006); strokeJoin(ROUND);
  noFill();
  for (let k = 4; k >= 1; k--) { stroke(190, 240, 250, 30); strokeWeight(k * b.h * 0.02); twShape(P); }     // 海面上的光暈
  noStroke(); fill(0, 60, 90, 45); push(); translate(b.w * 0.05, b.h * 0.035); twShape(P); pop();            // 倒影
  fill('#7cc47f'); stroke('#f6fff2'); strokeWeight(max(2, b.h * 0.008)); twShape(P);                         // 島
  noStroke();
  for (const m of TW_MT) {                                                                                   // 中央山脈
    const [x, y] = twXY(b, m[0], m[1]), bw = b.h * 0.075 * m[2], bh = b.h * 0.06 * m[2];
    fill('#3f8a55'); triangle(x - bw / 2, y + bh * 0.3, x + bw / 2, y + bh * 0.3, x, y - bh * 0.7);
    fill('#59ab6c'); triangle(x, y - bh * 0.7, x + bw / 2, y + bh * 0.3, x + bw * 0.05, y + bh * 0.3);
    if (m[2] > 1.6) { fill(255); triangle(x - bw * 0.12, y - bh * 0.35, x + bw * 0.12, y - bh * 0.35, x, y - bh * 0.7); }
  }
  pop();
}

// 原生種縮圖：用線連到牠們住的地方
const TW_PINS = [
  { id: 'treefrog', lon: 121.2, lat: 24.95, side: -1, row: 0.1 }, { id: 'leopardcat', lon: 120.78, lat: 24.5, side: -1, row: 0.4 },
  { id: 'pangolin', lon: 120.4, lat: 23.2, side: -1, row: 0.72 },
  { id: 'salmon', lon: 121.3, lat: 24.4, side: 1, row: 0.25 }, { id: 'bear', lon: 121.0, lat: 23.6, side: 1, row: 0.54 },
  { id: 'macaque', lon: 120.8, lat: 22.55, side: 1, row: 0.84 }
];
function drawIslandPins(b, t, tw, gap) {
  const th = tw * 0.75;
  push(); translate(0, sin(t * 1.1) * b.h * 0.006);
  TW_PINS.forEach((p, i) => {
    const sp = SPECIES.find(s => s.id === p.id); if (!sp) return;
    const [px, py] = twXY(b, p.lon, p.lat);
    const bobY = sin(t * 1.4 + i * 1.3) * 4;
    const tx = p.side < 0 ? b.x - tw * gap - tw : b.x + b.w + tw * gap;
    const ty = b.y + b.h * p.row - th / 2 + bobY;
    stroke(255, 255, 255, 200); strokeWeight(2); drawingContext.setLineDash([5, 5]);
    line(p.side < 0 ? tx + tw : tx, ty + th / 2, px, py);
    drawingContext.setLineDash([]);
    noStroke(); fill('#ff7a59'); circle(px, py, 8 + sin(t * 3 + i) * 1.5); fill(255); circle(px, py, 4);        // 棲地小點
    fill(255); rect(tx - 4, ty - 4, tw + 8, th + 8 + F(20), 12);                                                  // 縮圖外框
    drawScene(sp, tx, ty, tw, th);
    noStroke(); fill('#2e6b3a'); textAlign(CENTER, CENTER); textSize(F(14)); text(sp.name, tx + tw / 2, ty + th + F(11));
  });
  pop();
}

// ============================================================
//  頁面A背景：森林步道，日夜慢慢變化
// ============================================================
function ridge(base, amp, seed, col) {
  fill(col); noStroke();
  beginShape(); vertex(0, height);
  for (let x = 0; x <= width + 10; x += 8) vertex(x, base - amp * (sin(x * 0.004 + seed) + 0.6 * sin(x * 0.011 + seed * 2) + 0.3 * sin(x * 0.027 + seed * 3)));
  vertex(width, height); endShape(CLOSE);
}
function drawHubBackdrop(t) {
  const W = width, H = height;
  const day = (sin(t * 0.07) + 1) / 2;                                                   // 0 黃昏 → 1 白天
  gradRect(0, 0, W, H * 0.72, mix('#f4a068', '#79cbf0', day), mix('#ffe0a6', '#e6f7e6', day));
  const ang = 0.15 + (1 - day) * 0.55; noStroke();                                      // 太陽／夕陽
  fill(255, 240, 180, 60); circle(W * (0.2 + ang * 0.5), H * (0.16 + (1 - day) * 0.22), min(W, H) * 0.2);
  fill(mix('#ffb25a', '#fff3b0', day)); circle(W * (0.2 + ang * 0.5), H * (0.16 + (1 - day) * 0.22), min(W, H) * 0.09);
  cloud(((t * 7) % (W + 300)) - 150, H * 0.14, min(W, H) / 560, 170);
  cloud(((t * 5 + 500) % (W + 300)) - 150, H * 0.27, min(W, H) / 700, 140);
  ridge(H * 0.55, H * 0.07, 1.2, mix('#a9879a', '#a6cbd0', day));                         // 遠山
  ridge(H * 0.62, H * 0.06, 3.5, mix('#7d7e95', '#86b7a6', day));
  noStroke();
  for (let k = 0; k < 9; k++) pine(W * (k + 0.5) / 9 + sin(k * 3.1) * 14, H * 0.69, min(W, H) / 520 * (1 + (k % 3) * 0.12), mix('#3e5a58', '#3f7a5a', day));   // 一排松樹
  gradRect(0, H * 0.68, W, H * 0.34, mix('#5d8f48', '#7db35a', day), mix('#3f6a35', '#5d9448', day));    // 草地
  stroke(mix('#4e7a3c', '#5c9a45', day)); strokeWeight(max(2, W * 0.003));              // 搖擺的草
  for (let x = 6; x < W; x += max(14, W * 0.02)) { const gy = H * (0.72 + 0.26 * ((x * 7) % 13) / 13); line(x, gy, x + sin(t * 2 + x) * 3, gy - H * 0.018); }
  noStroke();
  for (let k = 0; k < 14; k++) {                                                          // 野花
    const fx = (k * 197) % W, fy = H * (0.76 + ((k * 53) % 20) / 100);
    fill(['#ffd54a', '#ffffff', '#ff9ab0', '#c9a0ff'][k % 4]); circle(fx, fy, F(6)); fill('#ffb300'); circle(fx, fy, F(2.4));
  }
  for (let k = 0; k < 2; k++) flyingBird(((t * (38 + k * 12) + k * 300) % (W + 240)) - 120, H * (0.18 + k * 0.1) + sin(t * 1.5 + k) * 8, min(W, H) / 700, t + k, '#3a74dc');
  if (day < 0.5) {                                                                        // 黃昏出現螢火蟲
    for (let k = 0; k < 18; k++) {
      const fx = W * (0.5 + 0.46 * sin(k * 7.1 + t * 0.2)), fy = H * (0.58 + 0.3 * sin(k * 3.7 + t * 0.31));
      fill(255, 240, 140, (0.5 - day) * 2 * (110 + 100 * sin(t * 3 + k))); circle(fx, fy, F(5)); fill(255, 240, 140, (0.5 - day) * 40); circle(fx, fy, F(15));
    }
  }
  updateLeaves(t);
}
