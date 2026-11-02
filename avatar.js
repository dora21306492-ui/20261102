// ============================================================
//  探險家角色：男生／女生，長髮／中髮／短髮，眼鏡、鬍子、帽子
//  服裝是「戶外觀察野生動物」的打扮：背心、背包、望遠鏡、遮陽帽
//  全部用 p5.js 圖形畫出，和動物插圖是同一種扁平可愛的風格
// ============================================================
const HAIR_COLS = ['#3b2a20', '#1f1f24', '#8a5a2b', '#d9a441', '#c2563f'];   // 深棕、黑、棕、金、赤紅
const SKINS = ['#fde3cf', '#f3c7a0', '#d49a6e', '#9a6542'];
const OUTFITS = [
  { n: '森林綠', jacket: '#5f9a5f', vest: '#d9b45a', hat: '#e2c98e', pants: '#8a7a5a' },
  { n: '晨霧藍', jacket: '#5b8fd0', vest: '#e9dfc0', hat: '#f1e7c8', pants: '#7a8190' },
  { n: '夕陽橘', jacket: '#e8803a', vest: '#7a6a45', hat: '#7a6a45', pants: '#6b5d45' },
  { n: '莓果紅', jacket: '#c9505a', vest: '#d8d0b0', hat: '#d8d0b0', pants: '#6a5a4a' }
];
const HAIR_LENS = [['short', '短髮'], ['mid', '中髮'], ['long', '長髮']];

// 預設造型
function defaultAvatar(g) {
  return { g: g || 'boy', hair: g === 'girl' ? 'long' : 'short', hc: 0, skin: 1, glasses: false, beard: false, hat: true, outfit: 0 };
}
// 隨機造型
function randomAvatar() {
  const g = random(['boy', 'girl']);
  return { g, hair: random(['short', 'mid', 'long']), hc: floor(random(HAIR_COLS.length)), skin: floor(random(SKINS.length)),
           glasses: random() < 0.4, beard: random() < 0.2, hat: random() < 0.7, outfit: floor(random(OUTFITS.length)) };
}

// 畫出角色：cx 腳底中心 x、footY 腳底 y、h 角色高度（像素）、a 造型、t 時間（秒）
// anim：'idle' 站著呼吸　'wave' 揮手　'cheer' 歡呼
function fixAvatar(a) {                       // 把造型資料補成合法值（避免存檔壞掉或點選錯誤時畫面出錯）
  a = a || {};
  const ok = (v, n) => Number.isInteger(v) && v >= 0 && v < n;
  return { g: a.g === 'girl' ? 'girl' : 'boy', hair: ['short', 'mid', 'long'].includes(a.hair) ? a.hair : 'short',
           hc: ok(a.hc, HAIR_COLS.length) ? a.hc : 0, skin: ok(a.skin, SKINS.length) ? a.skin : 1, glasses: !!a.glasses, beard: !!a.beard,
           hat: a.hat !== false, outfit: ok(a.outfit, OUTFITS.length) ? a.outfit : 0 };
}
function drawAvatar(cx, footY, h, a, t, anim) {
  a = fixAvatar(a);
  const s = h / 172;
  const skin = SKINS[a.skin], hairC = HAIR_COLS[a.hc], of = OUTFITS[a.outfit];
  const hairL = lerpColor(color(hairC), color('#ffffff'), 0.22);
  const bob = sin(t * 2.4) * 1.3 + (anim === 'cheer' ? -abs(sin(t * 7)) * 6 : 0) + (anim === 'walk' ? -abs(sin(t * 10)) * 3 : 0);   // 呼吸／跳躍／走路
  const lk = anim === 'walk' ? sin(t * 10) * 4 : 0;                    // 走路時兩隻腳前後交替
  const girl = a.g === 'girl';

  push();
  translate(cx, footY); scale(s); noStroke();
  fill(0, 0, 0, 38); ellipse(0, 1, 64, 9);                   // 地上的影子

  // ---- 後面的頭髮（中髮、長髮在頭和身體的後面） ----
  push(); translate(0, bob);
  if (a.hair === 'long') { fill(hairC); rect(-41, -142, 82, 96, 30); }
  if (a.hair === 'mid') { fill(hairC); rect(-41, -142, 82, 54, 28); }
  pop();

  // ---- 腿與靴子 ----
  push(); translate(-lk, -max(0, lk) * 0.5);                   // 左腳
  if (girl) { fill(skin); rect(-16, -24, 12, 18, 4); fill('#f3f0e6'); rect(-16, -13, 12, 8, 2); fill(of.pants); rect(-18, -36, 16, 15, 5); }
  else { fill(of.pants); rect(-17, -36, 14, 30, 5); }
  fill('#6b4a33'); rect(-19, -8, 17, 8, 4); pop();
  push(); translate(lk, -max(0, -lk) * 0.5);                   // 右腳
  if (girl) { fill(skin); rect(4, -24, 12, 18, 4); fill('#f3f0e6'); rect(4, -13, 12, 8, 2); fill(of.pants); rect(2, -36, 16, 15, 5); }
  else { fill(of.pants); rect(3, -36, 14, 30, 5); }
  fill('#6b4a33'); rect(2, -8, 17, 8, 4); pop();

  // ---- 上半身（隨呼吸輕輕上下） ----
  push(); translate(0, bob);
  fill('#8a6a45'); rect(-28, -82, 56, 42, 11);               // 背包（露出兩側）
  fill(of.jacket); rect(-24, -84, 48, 54, 14);               // 外套
  fill(of.vest);                                            // 背心（左右兩片）
  rect(-24, -82, 19, 46, 12, 2, 2, 10); rect(5, -82, 19, 46, 2, 12, 10, 2);
  fill(0, 0, 0, 30); rect(-21, -58, 13, 10, 3); rect(8, -58, 13, 10, 3);   // 口袋
  fill(0, 0, 0, 40); rect(-1, -82, 2, 46);                   // 拉鍊
  fill('#7a5a3a'); rect(-16, -84, 5, 40, 2); rect(11, -84, 5, 40, 2);       // 背包肩帶
  stroke('#3a3f4a'); strokeWeight(2); line(-9, -86, -6, -62); line(9, -86, 6, -62); noStroke();   // 望遠鏡掛繩
  fill('#3a3f4a'); rect(-13, -62, 11, 15, 4); rect(2, -62, 11, 15, 4); rect(-3, -58, 6, 5);        // 望遠鏡
  fill('#8fbfe0'); ellipse(-7.5, -47, 9, 6); ellipse(7.5, -47, 9, 6);
  fill(255, 255, 255, 120); circle(-9, -48, 2.5); circle(6, -48, 2.5);

  // ---- 手臂（右手可以揮手） ----
  const sway = sin(t * 2.4) * 0.04;
  const arm = (side, rot) => {
    push(); translate(side * 24, -78); rotate(rot);
    fill(of.jacket); rect(-6, -5, 12, 35, 6);
    fill(skin); circle(0, 32, 13);
    pop();
  };
  let lr = 0.12 + sway, rr = -0.12 - sway;
  if (anim === 'wave') rr = -2.55 + sin(t * 9) * 0.35;
  if (anim === 'cheer') { lr = 2.5 + sin(t * 7) * 0.2; rr = -2.5 - sin(t * 7) * 0.2; }
  const raised = anim === 'wave' || anim === 'cheer';
  if (!raised) { arm(-1, lr); arm(1, rr); } else if (anim === 'wave') arm(-1, lr);   // 揮手時左手先畫

  // ---- 脖子、頭 ----
  fill(skin); rect(-6, -90, 12, 12, 3);
  circle(-36, -116, 13); circle(36, -116, 13);               // 耳朵
  ellipse(0, -118, 74, 68);                                  // 頭
  fill(255, 130, 130, 75); ellipse(-23, -104, 13, 8); ellipse(23, -104, 13, 8);   // 腮紅

  // ---- 鬍子 ----
  if (a.beard) {
    fill(hairC);
    arc(0, -110, 70, 62, 0.12 * PI, 0.88 * PI, CHORD);       // 下巴的鬍子
    push(); translate(-6, -102); rotate(0.18); ellipse(0, 0, 14, 6.5); pop();
    push(); translate(6, -102); rotate(-0.18); ellipse(0, 0, 14, 6.5); pop();
  }
  // ---- 鼻子、嘴巴 ----
  fill(0, 0, 0, 30); ellipse(0, -107, 3.5, 2.8);
  if (anim === 'cheer') { fill('#b33a3a'); arc(0, -99, 15, 13, 0, PI, CHORD); fill('#f08a8a'); ellipse(0, -95, 7, 4); }
  else { noFill(); stroke(a.beard ? '#f6c4b8' : '#a8514b'); strokeWeight(2.3); arc(0, -101, 12, 8, 0.15 * PI, 0.85 * PI); noStroke(); }
  // ---- 眼睛（會眨眼）、眉毛 ----
  if ((t % 4.2) < 0.12) {
    stroke('#3a2a2a'); strokeWeight(2.4); noFill(); line(-19, -113, -9, -113); line(9, -113, 19, -113); noStroke();
  } else {
    fill('#2b2230'); ellipse(-14, -113, 10, 13); ellipse(14, -113, 10, 13);
    fill(255); circle(-12.3, -116.5, 4); circle(15.7, -116.5, 4); circle(-15.3, -110, 2); circle(12.7, -110, 2);
  }
  if (girl) { stroke('#2b2230'); strokeWeight(1.8); line(-19, -117, -23, -120); line(19, -117, 23, -120); noStroke(); }
  stroke(hairC); strokeWeight(2.4); line(-20, -123, -9, -124); line(9, -124, 20, -123); noStroke();

  // ---- 前面的頭髮 ----
  fill(hairC);
  arc(0, -130, 80, 56, PI, TWO_PI, CHORD);                    // 頭頂
  if (a.hair === 'short') { rect(-39, -132, 9, 24, 4); rect(30, -132, 9, 24, 4); }
  else if (a.hair === 'mid') { rect(-41, -132, 11, 44, 5); rect(30, -132, 11, 44, 5); }
  else { rect(-41, -132, 11, 40, 5); rect(30, -132, 11, 40, 5); }
  if (girl) {                                                // 女生：圓弧瀏海
    ellipse(-13, -132, 38, 14); ellipse(15, -133, 36, 14);
  } else {                                                   // 男生：尖尖的瀏海
    for (let i = -3; i <= 3; i++) triangle(i * 9 - 6, -133, i * 9 + 6, -133, i * 0.8 * 9 / 4 + i * 1.2, -127 + abs(i) * 1.0);
  }
  noFill(); stroke(hairL); strokeWeight(3); arc(0, -131, 58, 38, PI + 0.5, PI + 1.35); noStroke();
  if (a.hair === 'long') { fill(hairC); rect(-48, -128, 14, 62, 7); rect(34, -128, 14, 62, 7); }       // 垂到肩膀的髮束
  if (a.hair === 'mid') { fill(hairC); rect(-46, -128, 12, 30, 6); rect(34, -128, 12, 30, 6); }
  if (girl && !a.hat) { fill('#ffd54a'); circle(27, -137, 7); fill('#ff7a8a'); circle(27, -137, 3.4); }   // 髮夾

  // ---- 眼鏡 ----
  if (a.glasses) {
    fill(180, 220, 255, 55); circle(-14, -113, 23); circle(14, -113, 23);
    noFill(); stroke('#2f3b4a'); strokeWeight(2.6);
    circle(-14, -113, 23); circle(14, -113, 23); line(-2.5, -114, 2.5, -114); line(-25.5, -114, -34, -116); line(25.5, -114, 34, -116);
    stroke(255, 255, 255, 170); strokeWeight(1.6); arc(-14, -113, 15, 15, PI + 0.5, PI + 1.2); arc(14, -113, 15, 15, PI + 0.5, PI + 1.2);
    noStroke();
  }

  // ---- 遮陽帽 ----
  if (a.hat) {
    fill(of.hat); rect(-30, -170, 60, 30, 16, 16, 4, 4);       // 帽身
    fill(of.jacket); rect(-30, -153, 60, 9, 3);                // 帽帶
    fill(0, 0, 0, 28); ellipse(0, -139, 104, 12);              // 帽簷的影子
    fill(of.hat); ellipse(0, -143, 108, 18);                   // 帽簷
    fill(255, 255, 255, 60); ellipse(-10, -160, 14, 6);
  }
  if (raised) { if (anim === 'cheer') arm(-1, lr); arm(1, rr); }   // 舉起的手畫在頭髮和帽子的前面，才不會被擋住
  pop();
  pop();
}
