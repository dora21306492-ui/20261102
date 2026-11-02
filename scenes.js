// ============================================================
//  動態情境插圖：棲地背景 ＋ 大主體動物 ＋ 簡單活動
//  （全部由程式繪製，屬於自製素材；畫布座標為 200 x 150 的虛擬畫面）
//  若 media/ 裡有「物種代號.gif」（例如 media/bear.gif），會優先顯示 GIF
// ============================================================

// 畫出某物種的動態插圖到指定矩形內
function drawScene(sp, x, y, w, h) {
  const t = millis() / 1000;                    // 時間（秒），用來產生動畫
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 12); else ctx.rect(x, y, w, h);
  ctx.clip();                                   // 只允許畫在框內
  push();
  if (sp.img && sp.img.width > 0) {             // 有 GIF 檔：維持比例置中顯示
    noStroke(); fill(255); rect(x, y, w, h);
    const sc = min(w / sp.img.width, h / sp.img.height);
    image(sp.img, x + (w - sp.img.width * sc) / 2, y + (h - sp.img.height * sc) / 2, sp.img.width * sc, sp.img.height * sc);
  } else {                                      // 沒有 GIF：用程式畫的情境動畫
    translate(x + w / 2, y + h / 2);
    scale(min(w / 200, h / 150));               // 等比例縮放，確保動物完整可見
    translate(-100, -75);
    noStroke();
    SCENE_FN[sp.id](t);
  }
  pop();
  ctx.restore();
}

// 畫一個上下漸層的矩形（用來畫天空、水、地面）
function gradRect(x, y, w, h, c1, c2) {
  const g = drawingContext.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  drawingContext.fillStyle = g;
  drawingContext.fillRect(x, y, w, h);
}

// 畫一棵松樹（三層三角形＋樹幹）
function pine(px, py, s, col) {
  fill('#4a3828'); rect(px - 2 * s, py, 4 * s, 8 * s);
  fill(col);
  for (let k = 0; k < 3; k++) triangle(px - (17 - k * 2) * s, py - k * 13 * s, px + (17 - k * 2) * s, py - k * 13 * s, px, py - k * 13 * s - 26 * s);
}

// ---------- 1. 台灣黑熊：中海拔山林，四足緩步行走 ----------
function sceneBear(t) {
  gradRect(-300, -300, 800, 420, '#bfe3d0', '#eaf5de');      // 天空
  fill('#8fb8a0'); triangle(-60, 105, 50, 20, 160, 105); triangle(70, 105, 160, 12, 300, 105); // 遠山
  fill('#5f9a72'); ellipse(30, 108, 210, 60); ellipse(175, 110, 230, 70);                     // 丘陵
  gradRect(-300, 108, 800, 300, '#4c7f3f', '#335a2c');      // 草地
  pine(14, 116, 1.2, '#2d5a3a'); pine(182, 118, 1.3, '#2d5a3a'); pine(-12, 122, 1, '#244a30'); pine(210, 122, 1, '#244a30');

  const dir = cos(t * 0.6) >= 0 ? 1 : -1;                    // 左右來回走
  const bx = 100 + 26 * sin(t * 0.6);
  const step = t * 5;                                        // 步伐節奏
  push(); translate(bx, sin(step * 2) * 1.2); scale(dir, 1);
  fill('rgba(0,0,0,0.25)'); ellipse(0, 130, 96, 10);         // 影子
  const leg = (hx, ph, col) => { push(); translate(hx, 108); rotate(sin(step + ph) * 0.45); fill(col); rect(-5, 0, 10, 22, 5); pop(); };
  leg(-24, PI, '#141414'); leg(22, 0, '#141414');            // 遠側腿
  fill('#222'); ellipse(0, 96, 78, 44);                      // 身體
  fill('#f2f2f2'); triangle(18, 90, 34, 90, 26, 105);        // 胸前白色 V 字（台灣黑熊特徵）
  leg(-24, 0, '#222'); leg(22, PI, '#222');                  // 近側腿
  const hy = 88 + sin(step) * 1.2;
  fill('#222'); circle(34, hy - 14, 17); circle(48, hy - 15, 17); // 耳朵
  fill('#6b5a4a'); circle(34, hy - 14, 8); circle(48, hy - 15, 8);
  fill('#222'); ellipse(44, hy, 32, 28);                     // 頭
  fill('#9a7b5a'); ellipse(57, hy + 5, 15, 12);              // 口鼻
  fill('#111'); ellipse(63, hy + 3, 6, 5);                   // 鼻頭
  fill(255); circle(49, hy - 4, 5); fill(0); circle(50, hy - 4, 2.5); // 眼睛
  pop();
}

// ---------- 2. 台灣藍鵲：樹枝上跳躍、擺動長尾 ----------
function sceneMagpie(t) {
  gradRect(-300, -300, 800, 450, '#8fd0f5', '#dcf2fb');      // 藍天
  fill('rgba(255,255,255,0.85)');                            // 飄動的雲
  for (let k = 0; k < 2; k++) { const cx = ((t * 6 + k * 130) % 300) - 50; ellipse(cx, 30 + k * 22, 50, 16); ellipse(cx + 14, 24 + k * 22, 30, 14); }
  fill('#3f9a4a'); ellipse(5, 8, 100, 56); ellipse(195, 2, 110, 56);   // 樹葉
  fill('#58b560'); ellipse(40, 24, 56, 28); ellipse(160, 20, 60, 30);
  stroke('#6b4a2f'); strokeWeight(7); line(-60, 114, 260, 104); noStroke();  // 樹枝
  fill('#58b560'); ellipse(30, 108, 18, 8); ellipse(165, 98, 18, 8);

  const hop = pow(max(0, sin(t * 2.2)), 6) * 14;             // 偶爾跳一下
  const tailA = 0.12 * sin(t * 4) + hop * 0.015;             // 長尾上下擺動
  push(); translate(100, 108 - hop);
  stroke('#e63a2e'); strokeWeight(2.5); line(-5, -9, -5, 0); line(6, -9, 6, 0); noStroke(); // 紅腳
  push(); translate(-14, -18); rotate(PI - 0.35 + tailA);    // 長尾（尾端白色）
  fill('#2a5fcf'); quad(0, -6, 0, 6, 74, 4, 74, -4);
  fill('#1b2f7a'); quad(44, -4.5, 44, 4.5, 52, 4, 52, -4);
  fill('#fff'); quad(56, -4, 56, 4, 76, 3.5, 76, -3.5);
  pop();
  fill('#2f66d6'); ellipse(0, -22, 44, 30);                  // 身體
  fill('#6f9bf2'); ellipse(3, -16, 30, 18);
  fill('#1d44a8'); ellipse(-6, -23, 28, 15);                 // 翅膀
  const hy = -38 + sin(t * 3) * 1.5;                         // 頭部微微擺動
  fill('#1b1b1b'); circle(16, hy, 23);                       // 黑色頭部
  fill('#e63a2e'); triangle(25, hy - 4, 25, hy + 4, 41, hy + 1); // 紅嘴
  fill(255); circle(19, hy - 2, 6); fill(0); circle(20, hy - 2, 3);
  pop();
}

// ---------- 3. 台灣獼猴：森林岩石上坐著吃果子 ----------
function sceneMacaque(t) {
  gradRect(-300, -300, 800, 450, '#86c196', '#3f7a52');      // 森林
  fill('#5b4332'); rect(8, -60, 18, 200); rect(170, -60, 22, 200);   // 樹幹
  fill('#2f7a45'); ellipse(20, 6, 90, 60); ellipse(180, 0, 100, 64);  // 樹冠
  gradRect(-300, 120, 800, 200, '#6a8f4a', '#4a6f35');       // 地面
  fill('#8d8d8d'); ellipse(100, 128, 116, 42); fill('#a8a8a8'); ellipse(90, 121, 70, 20); // 岩石

  const ph = (sin(t * 2.2) + 1) / 2;                         // 0＝手放下　1＝果子送到嘴邊
  const bob = sin(t * 2.2) * 0.8;
  noFill(); stroke('#7a6a58'); strokeWeight(6); bezier(82, 112, 50, 124, 40, 92, 58, 76); noStroke(); // 尾巴
  fill('#8a7a68'); ellipse(100, 94, 46, 52);                 // 身體
  fill('#ad9f8b'); ellipse(104, 98, 26, 32);                 // 肚子
  fill('#7a6a58'); ellipse(86, 114, 24, 14); ellipse(114, 114, 24, 14); // 腳
  push(); translate(0, bob);
  fill('#8a7a68'); circle(104, 58, 36);                      // 頭
  fill('#d98a7a'); circle(88, 58, 11); circle(120, 58, 11);  // 耳朵
  fill('#d98a7a'); ellipse(106, 62, 26, 24);                 // 紅臉
  fill('#222'); circle(100, 58, 3.5); circle(112, 58, 3.5);  // 眼睛
  fill(ph > 0.8 ? '#7a2b2b' : '#a35a4e'); ellipse(106, 70, 8, ph > 0.8 ? 6 : 2);   // 嘴巴（吃的時候張開）
  pop();
  const hx = lerp(90, 106, ph), hy = lerp(104, 70, ph);      // 手與果子的位置
  stroke('#7a6a58'); strokeWeight(8); line(92, 80, hx, hy); noStroke();
  fill('#8a7a68'); circle(hx, hy, 10);
  if (ph < 0.95) { fill('#f28c28'); circle(hx + 2, hy - 5, 12); fill('#3f9a4a'); ellipse(hx + 5, hy - 12, 6, 3); } // 果子
}

// ---------- 4. 櫻花鉤吻鮭：山區溪流水中游動 ----------
function sceneSalmon(t) {
  gradRect(-300, -300, 800, 500, '#4aa3c7', '#1f5f86');      // 水
  fill('rgba(255,255,255,0.09)');                            // 水面透下來的光
  for (let k = 0; k < 4; k++) { const sx = 10 + k * 55 + sin(t * 0.5 + k) * 8; quad(sx, -10, sx + 28, -10, sx + 62, 160, sx + 14, 160); }
  fill('#6f6a5a'); ellipse(30, 150, 100, 40); ellipse(115, 153, 120, 44); ellipse(185, 148, 90, 38);  // 河床
  fill('#8a8573'); ellipse(62, 138, 32, 16); ellipse(152, 141, 38, 18);                               // 石頭
  noFill(); stroke('#3f9a5a'); strokeWeight(3);              // 水草
  for (const px of [18, 42, 166, 186]) line(px, 140, px + sin(t * 1.5 + px) * 7, 102);
  stroke('rgba(255,255,255,0.65)'); strokeWeight(1.2);       // 氣泡
  for (let k = 0; k < 6; k++) circle(30 + k * 30 + sin(t + k) * 3, 150 - ((t * 20 + k * 37) % 150), 4 + (k % 3) * 2);
  noStroke();

  const dir = cos(t * 0.6) >= 0 ? 1 : -1;                    // 左右來回游
  const wag = sin(t * 8);                                    // 尾巴擺動
  push(); translate(100 + 44 * sin(t * 0.6), 72 + 6 * sin(t * 1.1)); scale(dir * 1.05, 1.05);
  push(); translate(-40, 0); rotate(wag * 0.35); fill('#7f9a8f'); quad(0, 0, -26, -19, -19, 0, -26, 19); pop(); // 尾鰭
  rotate(wag * 0.04);
  fill('#a9bdb0'); ellipse(0, 0, 88, 36);                    // 身體
  fill('#7d9486'); arc(0, 0, 88, 36, PI, TWO_PI);            // 深色背部
  fill('#e8f0e8'); arc(0, 0, 82, 32, 0, PI);                 // 淺色腹部
  fill('rgba(235,110,120,0.75)'); ellipse(0, 2, 70, 8);      // 粉紅色側線
  fill('rgba(40,60,60,0.5)'); for (let px = -22; px <= 24; px += 11) ellipse(px, -1, 6, 20); // 橢圓形斑紋（幼魚斑）
  fill('#8fa89a'); triangle(-8, -17, 8, -17, -2, -29);       // 背鰭
  fill('#c7d6cc'); triangle(10, 8, -8, 20 + wag * 2, -2, 6); // 胸鰭
  fill(255); circle(30, -4, 8); fill(0); circle(31, -4, 4);  // 眼睛
  stroke('#5d7468'); strokeWeight(1.5); noFill(); arc(22, 0, 12, 24, -1, 1); // 鰓蓋
  noStroke(); pop();
}

// ---------- 5. 帝雉：高海拔霧林，低頭覓食行走 ----------
function scenePheasant(t) {
  gradRect(-300, -300, 800, 440, '#aebfcc', '#e1e9ee');      // 霧濛濛的天空
  for (const px of [10, 60, 130, 190]) pine(px, 100, 1.1, '#7f97a3');     // 遠處針葉林
  fill('rgba(255,255,255,0.4)'); ellipse(((t * 5) % 300) - 50, 96, 170, 22); ellipse(260 - ((t * 4) % 300), 80, 150, 18); // 流動的霧
  for (const px of [-5, 95, 205]) pine(px, 124, 1.5, '#4f6f68');          // 近處針葉林
  gradRect(-300, 118, 800, 300, '#6b7a52', '#4b5a3a');       // 林地

  // 帝雉：圓胖、深藍黑、尾巴橫著拖在地上，低頭啄食（和停在樹枝上的藍鵲明顯不同）
  const dir = cos(t * 0.4) >= 0 ? 1 : -1;
  const step = t * 4, peck = pow(max(0, sin(t * 1.6)), 3);       // 走幾步就低頭啄地
  push(); translate(125 + 16 * sin(t * 0.4), sin(step * 2) * 0.6); scale(dir * 1.1, 1.1); translate(0, -22);
  fill('rgba(0,0,0,0.25)'); ellipse(0, 132, 84, 9);
  stroke('#d63a3a'); strokeWeight(3.5);                       // 紅腳
  for (const ph of [0, PI]) line(ph ? 6 : -6, 112, (ph ? 6 : -6) + sin(step + ph) * 8, 131 - max(0, cos(step + ph)) * 4);
  noStroke();
  push(); translate(-24, 112); rotate(0.03 + 0.03 * sin(step));  // 尾巴：貼近地面、橫向，白色橫斑
  fill('#232845'); quad(0, -9, 0, 9, -62, 5, -62, -3);
  fill('#fff'); for (let k = 1; k <= 3; k++) rect(-k * 17, -3 - (k > 1 ? 0 : 1), 5, 12);
  pop();
  fill('#262b4b'); ellipse(0, 100, 62, 44);                   // 胖胖的身體
  fill('#4a3f86'); ellipse(8, 104, 34, 26);                   // 胸前紫藍色金屬光澤
  fill('#171b34'); ellipse(-6, 98, 38, 26);                   // 翅膀
  fill('#fff'); ellipse(-4, 91, 26, 5);                       // 翅膀上的白色橫帶
  const nx = 22 + peck * 6, ny = 80 + peck * 18;
  fill('#262b4b'); ellipse((nx + 14) / 2, (ny + 98) / 2, 17, 36);   // 脖子（啄地時往前低下）
  fill('#262b4b'); circle(nx + 4, ny - 6, 19);               // 頭
  fill('#fff'); rect(nx - 4, ny - 12, 12, 2.5, 1);            // 白色眉紋
  fill('#d63a3a'); ellipse(nx + 6, ny - 5, 11, 9);           // 眼周紅色裸皮
  fill('#bdbda8'); triangle(nx + 11, ny - 6, nx + 11, ny - 1, nx + 20, ny - 3);   // 嘴
  fill(0); circle(nx + 6, ny - 6, 3);
  pop();
}

// ---------- 6. 台灣山羌：草地邊緣低頭吃草、甩動耳朵與尾巴 ----------
function sceneMuntjac(t) {
  gradRect(-300, -300, 800, 440, '#cfe6c4', '#ebf6da');      // 天空
  fill('#6b4f35'); rect(16, 60, 9, 70); rect(176, 56, 9, 74);        // 樹幹
  fill('#5f9a5f'); ellipse(20, 62, 72, 92); ellipse(180, 56, 82, 104); // 樹冠
  fill('#3f7a43'); ellipse(58, 120, 64, 32); ellipse(150, 122, 74, 36); // 灌木
  gradRect(-300, 120, 800, 300, '#79a64a', '#58853a');       // 草地
  stroke('#4d7a30'); strokeWeight(2);                        // 隨風搖擺的草
  for (let gx = -10; gx < 220; gx += 12) line(gx, 140, gx + sin(t * 2 + gx) * 3, 129);
  noStroke();

  const g = pow((sin(t * 1.0) + 1) / 2, 1.4);                // 0＝抬頭張望　1＝低頭吃草
  const body = '#a8693b';
  fill('rgba(0,0,0,0.2)'); ellipse(96, 134, 90, 8);
  stroke('#8b5530'); strokeWeight(5);                        // 四條細腿
  line(72, 108, 72, 132); line(82, 110, 82, 132); line(110, 110, 110, 132); line(120, 106, 120, 132);
  noStroke();
  push(); translate(66, 92); rotate(-0.5 + sin(t * 6) * 0.3 * max(0, sin(t * 0.9 + 1))); // 尾巴偶爾甩動
  fill(body); ellipse(0, 0, 16, 8); fill('#fff'); ellipse(-6, 2, 7, 5); pop();
  fill(body); ellipse(95, 98, 62, 34);                       // 身體（背部微微拱起）
  fill('#e0c29c'); ellipse(98, 108, 46, 14);                 // 腹部
  const hx = 140 + g * 6, hy = 72 + g * 46;                  // 頭的位置（隨低頭而下移）
  stroke(body); strokeWeight(14); line(118, 94, hx - 4, hy); noStroke();   // 脖子
  push(); translate(hx, hy); rotate(lerp(-0.1, 1.05, g));
  fill('#b0733f'); ellipse(6, 0, 30, 16);                    // 頭
  fill('#222'); circle(20, 1, 4.5); circle(4, -3, 3.2);      // 鼻頭與眼睛
  stroke('#5a3b22'); strokeWeight(2); line(0, -8, -2, -19); noStroke();   // 短角
  push(); translate(-5, -7); rotate(-0.8 + sin(t * 6) * 0.3 * max(0, sin(t * 0.9)));   // 大耳朵（偶爾抖動）
  fill('#8b5530'); ellipse(0, -5, 9, 18); fill('#e8b9a0'); ellipse(0, -5, 4, 11); pop();
  pop();
}

// ---------- 7. 石虎：黃昏的淺山，夜行貓科漫步 ----------
function sceneLeopardCat(t) {
  gradRect(-300, -300, 800, 430, '#2d3a6b', '#7a6a8a');      // 黃昏夜空
  fill('rgba(255,246,200,0.18)'); circle(155, 28, 42); fill('#fff6c8'); circle(155, 28, 22);   // 月亮
  fill('#3b4a5e'); ellipse(30, 114, 220, 60); ellipse(180, 118, 240, 64);                       // 淺山丘陵剪影
  gradRect(-300, 112, 800, 300, '#3d5a3a', '#2a4228');       // 草地
  stroke('#5b8a4a'); strokeWeight(3);                        // 竹子
  for (const bx of [12, 26, 176, 190]) line(bx, 140, bx + sin(t + bx) * 2, 40);
  noStroke();
  const dir = cos(t * 0.5) >= 0 ? 1 : -1, step = t * 5;
  push(); translate(100 + 34 * sin(t * 0.5), 0); scale(dir, 1);
  fill('rgba(0,0,0,0.25)'); ellipse(0, 130, 70, 8);
  const leg = (hx, ph, col) => { push(); translate(hx, 108); rotate(sin(step + ph) * 0.5); fill(col); rect(-3.5, 0, 7, 22, 3); pop(); };
  leg(-20, PI, '#a8855a'); leg(18, 0, '#a8855a');            // 遠側腿
  noFill(); stroke('#c9a46a'); strokeWeight(7); bezier(-30, 98, -52, 98, -56, 82 + sin(t * 3) * 4, -46, 68); noStroke();  // 尾巴
  fill('#c9a46a'); ellipse(0, 100, 64, 26);                  // 身體
  fill('#5a4020'); for (const s of [[-18, 96], [-6, 92], [6, 98], [-10, 106], [14, 92], [22, 102], [-24, 104]]) circle(s[0], s[1], 4.5);  // 斑點
  leg(-20, 0, '#c9a46a'); leg(18, PI, '#c9a46a');            // 近側腿
  const hy = 92 + sin(step) * 1;
  fill('#c9a46a'); triangle(30, hy - 9, 34, hy - 24, 42, hy - 10); triangle(44, hy - 10, 52, hy - 24, 54, hy - 8);  // 耳朵
  ellipse(44, hy, 28, 23);                                   // 頭
  fill('#f4ead8'); ellipse(52, hy + 4, 13, 10);              // 口鼻
  fill('#4a3418'); rect(36, hy - 11, 2.5, 8, 1); rect(42, hy - 12, 2.5, 9, 1);   // 額頭條紋
  fill('#ffd84a'); ellipse(47, hy - 2, 6, 5); fill('#111'); rect(46.4, hy - 4, 1.5, 4);   // 眼睛
  fill('#e8a0a0'); triangle(57, hy + 1, 61, hy + 1, 59, hy + 4);
  pop();
}

// ---------- 8. 五色鳥：樹枝上啄紅色果實 ----------
function sceneBarbet(t) {
  gradRect(-300, -300, 800, 450, '#a8dcee', '#e3f5d6');
  fill('#3f9a4a'); ellipse(0, 0, 120, 70); ellipse(200, 6, 120, 64);
  fill('#5cba66'); ellipse(36, 20, 56, 28); ellipse(165, 22, 60, 30);
  stroke('#6b4a2f'); strokeWeight(8); line(-60, 108, 260, 100); noStroke();      // 樹枝
  fill('#e0453a'); for (const bx of [140, 152, 164]) circle(bx, 101 + (bx % 3), 7);   // 紅色果實
  fill('#58b560'); ellipse(150, 92, 14, 6);
  const g = pow(max(0, sin(t * 2.4)), 2);                    // 低頭啄果實
  push(); translate(92, 103);
  stroke('#d08a4a'); strokeWeight(2.5); line(-4, -8, -4, 0); line(6, -8, 6, 0); noStroke();
  fill('#3d9a45'); ellipse(0, -22, 46, 32);                  // 身體（綠）
  fill('#2f7f3a'); ellipse(-8, -22, 26, 15); triangle(-18, -18, -36, -10, -18, -8);   // 翅膀與尾
  const hx = 20 + g * 12, hy = -36 + g * 10;
  fill('#3d9a45'); circle(hx, hy, 24);                       // 頭
  fill('#e8402e'); ellipse(hx + 3, hy - 9, 10, 6);           // 紅
  fill('#f2c81d'); ellipse(hx + 4, hy + 5, 12, 7);           // 黃
  fill('#3a78d8'); ellipse(hx - 3, hy + 1, 8, 7);            // 藍
  fill('#f0e6b0'); triangle(hx + 9, hy - 4, hx + 9, hy + 4, hx + 24, hy + 1);   // 嘴
  fill(0); circle(hx + 4, hy - 3, 3);                        // 眼睛與黑色
  pop();
}

// ---------- 9. 莫氏樹蛙：雨夜的葉片上鳴叫 ----------
function sceneTreeFrog(t) {
  gradRect(-300, -300, 800, 450, '#2a4658', '#47725c');
  fill('#3f8a55'); ellipse(30, 20, 120, 80); ellipse(180, 10, 120, 80);       // 背景葉叢
  stroke('rgba(200,230,255,0.45)'); strokeWeight(1.2);                         // 雨絲
  for (let k = 0; k < 24; k++) { const rx = (k * 37) % 220 - 10, ry = ((t * 120 + k * 53) % 190) - 20; line(rx, ry, rx - 3, ry + 12); }
  noStroke();
  push(); translate(100, 116);
  fill('#2f7a43'); ellipse(0, 10, 176, 30); fill('#3f9a55'); ellipse(0, 6, 166, 24);   // 大葉片
  const pulse = (sin(t * 6) + 1) / 2, call = sin(t * 0.9) > 0.1 ? pulse : 0;          // 鳴叫時鳴囊鼓起
  fill('#4cb05c'); ellipse(0, -12, 56, 34);                                            // 身體
  fill('#3d9a4e'); ellipse(-16, -2, 24, 12); ellipse(10, -1, 22, 10);                  // 腿
  fill('rgba(20,50,20,0.6)'); for (const s of [[-12, -16], [-2, -8], [-18, -10]]) circle(s[0], s[1], 3);  // 體側黑斑
  fill('#4cb05c'); ellipse(24, -18, 30, 22);                                           // 頭
  fill('#e8e0a0'); circle(36, -10, 6 + call * 14);                                     // 鳴囊
  fill('#4cb05c'); circle(26, -29, 11);                                                // 眼突
  fill('#f08a24'); circle(27, -29, 8); fill('#111'); circle(28, -29, 4);               // 橘紅色虹彩
  fill('#c8f0b0'); circle(-20, 4, 3.5); circle(-14, 4, 3.5); circle(16, 5, 3.5); circle(22, 5, 3.5);   // 趾端吸盤
  pop();
}

// ---------- 10. 大紫蛺蝶：森林裡拍翅飛行，下方是朴樹 ----------
function sceneEmperor(t) {
  gradRect(-300, -300, 800, 450, '#9fd6a8', '#e8f5c8');
  fill('rgba(255,255,200,0.25)'); for (let k = 0; k < 3; k++) quad(30 + k * 60, -10, 52 + k * 60, -10, 90 + k * 60, 160, 50 + k * 60, 160);   // 陽光
  fill('#2f7a45'); ellipse(0, 132, 170, 60); ellipse(200, 130, 180, 64);
  stroke('#5b4332'); strokeWeight(7); line(-20, 152, 100, 128); noStroke();   // 朴樹枝
  fill('#4aa05a'); for (const l of [[10, 142], [40, 136], [70, 131], [100, 127]]) ellipse(l[0], l[1], 26, 13);   // 朴樹葉
  const bx = 100 + 30 * sin(t * 0.7), by = 60 + 10 * sin(t * 1.5);
  push(); translate(bx, by); rotate(0.12 * cos(t * 0.7));
  const flap = 0.25 + 0.75 * abs(sin(t * 6));                // 拍翅
  for (const s of [-1, 1]) {
    push(); scale(s * flap, 1);
    fill('#5a49c2'); ellipse(24, -12, 48, 32);               // 前翅（青紫色）
    fill('#fff'); circle(32, -20, 4); circle(24, -22, 3.5); circle(38, -10, 3.5); circle(18, -16, 3);   // 白斑
    fill('#4a3ba8'); ellipse(20, 14, 38, 28);                // 後翅
    fill('#e0453a'); circle(30, 20, 6);                      // 後翅紅斑
    pop();
  }
  fill('#1e1e2a'); ellipse(0, 0, 7, 42); circle(0, -23, 8);
  stroke('#1e1e2a'); strokeWeight(1.2); line(-1, -26, -9, -38); line(1, -26, 9, -38); noStroke();
  pop();
}

// ---------- 11. 台灣穿山甲：夜晚的森林，低頭嗅聞並伸舌舔食白蟻 ----------
function scenePangolin(t) {
  gradRect(-300, -300, 800, 430, '#1f3326', '#3a5a3c');
  fill('#fff6c8'); circle(26, 26, 14);
  stroke('#2c4a32'); strokeWeight(10); line(172, -20, 172, 120); line(30, -20, 28, 120); noStroke();   // 樹幹
  gradRect(-300, 118, 800, 300, '#4a3b2a', '#33281c');
  fill('#9a7a5a'); ellipse(168, 124, 54, 38); fill('#7a5e44'); ellipse(168, 120, 36, 28);              // 白蟻丘
  fill('#eeeeee'); for (let k = 0; k < 4; k++) circle(152 + k * 6, 110 + ((t * 8 + k * 7) % 10) * 0.2, 1.6);
  const sw = sin(t * 3);
  push(); translate(70 + 8 * sin(t * 0.5), 0);
  fill('rgba(0,0,0,0.3)'); ellipse(0, 131, 84, 8);
  fill('#6d5233'); rect(-20 + sw * 3, 112, 9, 18, 4); rect(10 - sw * 3, 112, 9, 18, 4);   // 腿
  fill('#8a6a45'); push(); translate(-30, 104); rotate(0.15 + sin(t * 2) * 0.05); ellipse(-20, 2, 62, 16); pop();   // 尾
  fill('#8a6a45'); ellipse(0, 102, 78, 40);                  // 身體
  stroke('#6d5233'); strokeWeight(1); fill('#a98558');        // 鱗片
  for (let r = 0; r < 3; r++) for (let c = -3; c <= 3; c++) arc(c * 10 + (r % 2) * 5, 92 + r * 10, 12, 12, 0, PI);
  noStroke();
  const hy = 108 + sin(t * 2) * 2;
  fill('#8a6a45'); ellipse(44, hy, 28, 20);                  // 頭
  fill('#b89a6e'); ellipse(58, hy + 4, 24, 10);              // 吻部
  fill('#222'); circle(46, hy - 3, 3);
  const tg = max(0, sin(t * 4));                             // 舌頭伸縮
  stroke('#e06a6a'); strokeWeight(2); line(68, hy + 6, 68 + tg * 28, hy + 6 - tg * 6); noStroke();
  pop();
}

// ---------- 12. 台灣水鹿：山嵐中的草地，低頭到水池喝水 ----------
function sceneSambar(t) {
  gradRect(-300, -300, 800, 420, '#c6d3da', '#e8eef0');
  fill('#9db0b4'); triangle(-40, 112, 50, 30, 140, 112); triangle(80, 112, 170, 20, 280, 112);
  pine(176, 118, 1.4, '#486a5a'); pine(10, 120, 1.2, '#486a5a');
  fill('rgba(255,255,255,0.45)'); ellipse(((t * 4) % 300) - 40, 70, 160, 20);        // 山嵐
  gradRect(-300, 116, 800, 300, '#7e9a5a', '#5c7a40');
  fill('#7ab8d4'); ellipse(140, 134, 84, 14);                                         // 水池
  const g = pow((sin(t * 0.8) + 1) / 2, 1.3);                                         // 低頭喝水
  if (g > 0.6) { noFill(); stroke('rgba(255,255,255,0.6)'); strokeWeight(1); const rp = (t * 1.5) % 1; ellipse(146, 134, 16 + rp * 30, 4 + rp * 6); noStroke(); }
  fill('rgba(0,0,0,0.2)'); ellipse(88, 135, 92, 8);
  stroke('#5a3f28'); strokeWeight(6); line(62, 110, 62, 134); line(72, 112, 72, 134); line(106, 112, 106, 134); line(116, 108, 116, 134); noStroke();
  fill('#7a5a3a'); ellipse(90, 100, 76, 38); fill('#a8845a'); ellipse(92, 110, 56, 14);   // 身體
  push(); translate(54, 96); rotate(-0.3 + sin(t * 3) * 0.1); fill('#6a4a2e'); ellipse(-6, 0, 22, 8); pop();   // 尾
  const hx = 130 + g * 12, hy = 64 + g * 58;
  stroke('#7a5a3a'); strokeWeight(18); line(118, 90, hx - 6, hy + 2); noStroke();     // 脖子
  push(); translate(hx, hy); rotate(lerp(-0.2, 1.15, g));
  fill('#7a5a3a'); ellipse(8, 0, 36, 17); fill('#222'); circle(25, 2, 5); circle(6, -3, 3.4);     // 頭
  stroke('#d8c8a0'); strokeWeight(3); line(0, -8, -4, -26); line(-4, -26, -14, -34); line(-4, -26, 2, -38); noStroke();   // 鹿角
  push(); translate(-6, -8); rotate(-0.7 + sin(t * 5) * 0.25 * max(0, sin(t * 0.7))); fill('#6a4a2e'); ellipse(0, -6, 12, 20); fill('#e8b9a0'); ellipse(0, -6, 5, 12); pop();   // 耳朵
  pop();
}

// ---------- 13. 台灣長鬃山羊：碎石崖坡上，在岩台間跳躍 ----------
function sceneSerow(t) {
  gradRect(-300, -300, 800, 420, '#cdd9e2', '#eef2f5');
  fill('#9aa0a8'); triangle(-70, 150, 40, 10, 150, 150); triangle(60, 150, 170, 0, 300, 150);
  fill('#b4b8be'); triangle(0, 150, 70, 50, 140, 150);
  fill('#868b92'); ellipse(50, 130, 96, 60); ellipse(150, 124, 96, 60);               // 碎石坡
  fill('#7a7f86'); ellipse(50, 110, 58, 22); ellipse(150, 102, 58, 22);               // 岩台
  const p = t % 6; let x, y, dir;
  if (p < 2) { x = 50; y = 102; dir = -1; }
  else if (p < 3) { const u = p - 2; x = lerp(50, 150, u); y = lerp(102, 94, u) - sin(u * PI) * 30; dir = 1; }
  else if (p < 5) { x = 150; y = 94; dir = 1; }
  else { const u = p - 5; x = lerp(150, 50, u); y = lerp(94, 102, u) - sin(u * PI) * 30; dir = -1; }
  push(); translate(x, y); scale(dir, 1);
  const chew = sin(t * 10) * 1.2;
  stroke('#2f2a26'); strokeWeight(5); line(-16, -14, -16, 0); line(-8, -14, -8, 0); line(10, -14, 10, 0); line(18, -16, 18, 0); noStroke();
  fill('#4a423b'); ellipse(0, -26, 50, 28);                  // 身體
  fill('#5a5048'); ellipse(-6, -35, 40, 14);                 // 背上的鬃毛
  stroke('#4a423b'); strokeWeight(12); line(18, -32, 26, -44); noStroke();   // 脖子
  fill('#4a423b'); ellipse(30, -46 + chew * 0.3, 22, 16);    // 頭
  fill('#f2f2f2'); ellipse(32, -40, 10, 6);                  // 白色喉斑
  fill('#111'); ellipse(37, -46 + chew * 0.5, 5, 4); circle(28, -49, 3);
  stroke('#2a2420'); strokeWeight(3); line(24, -53, 19, -64); noStroke();    // 角（中空、不脫落）
  push(); translate(22, -54); rotate(-0.8 + sin(t * 6) * 0.2); fill('#4a423b'); ellipse(0, 0, 6, 12); pop();
  pop();
}

// ---------- 14. 台灣山椒魚：雲霧森林的溪邊，在苔石間爬行 ----------
function sceneSalamander(t) {
  gradRect(-300, -300, 800, 260, '#d3e3e6', '#a9c2c8');
  fill('#7a9a86'); triangle(-40, 100, 40, 40, 120, 100); triangle(90, 100, 170, 30, 260, 100);
  stroke('#4f8a5a'); strokeWeight(3);                                          // 蕨葉
  for (const fx of [10, 24, 176, 190]) for (let k = 0; k < 5; k++) line(fx, 100, fx + (k - 2) * 8 + sin(t + fx) * 2, 70 + k * 2);
  noStroke();
  gradRect(-300, 96, 800, 300, '#4f7f8a', '#2d5360');                          // 溪水
  fill('#6a8a52'); ellipse(60, 120, 120, 40); ellipse(160, 126, 130, 44);      // 苔蘚石頭
  fill('#7fa066'); ellipse(52, 110, 70, 18); ellipse(150, 114, 80, 20);
  const ox = sin(t * 0.4) * 18, pts = [];
  for (let k = 0; k < 22; k++) pts.push([40 + ox + k * 5.6, 113 + sin(k * 0.55 - t * 3) * 3.5]);
  stroke('#5e4231'); strokeWeight(3.5);                                        // 四肢
  line(pts[15][0], pts[15][1], pts[15][0] + 6, pts[15][1] + 10 + sin(t * 3) * 2);
  line(pts[6][0], pts[6][1], pts[6][0] - 5, pts[6][1] + 10 - sin(t * 3) * 2);
  noStroke();
  for (let k = 0; k < 22; k++) { const r = k < 8 ? 2 + k * 0.55 : 6.5; fill(k % 5 === 0 ? '#76503c' : '#5e4231'); circle(pts[k][0], pts[k][1], r * 2); }
  const hp = pts[21];
  fill('#4e3626'); ellipse(hp[0] + 4, hp[1], 16, 12);                          // 頭
  fill('#f5e6a0'); circle(hp[0] + 6, hp[1] - 3, 3.4); fill('#000'); circle(hp[0] + 6.5, hp[1] - 3, 1.6);
  noFill(); stroke('rgba(255,255,255,0.6)'); strokeWeight(1.1);               // 氣泡
  for (let k = 0; k < 4; k++) circle(30 + k * 45, 140 - ((t * 16 + k * 30) % 44), 3 + (k % 2) * 2);
  noStroke();
}

// ---------- 15. 藍腹鷴：霧林林道上漫步（雄鳥：藍腹、白背、紅臉） ----------
function sceneSwinhoe(t) {
  gradRect(-300, -300, 800, 440, '#b8d4c0', '#e6f0dc');
  for (const px of [8, 70, 140, 196]) pine(px, 100, 1.2, '#7fa08a');
  fill('rgba(255,255,255,0.35)'); ellipse(((t * 5) % 300) - 50, 92, 170, 22);
  for (const px of [-8, 100, 208]) pine(px, 124, 1.5, '#3e6a50');
  gradRect(-300, 118, 800, 300, '#6b8a4a', '#4a6a38');
  const dir = cos(t * 0.5) >= 0 ? 1 : -1, step = t * 5;
  push(); translate(100 + 30 * sin(t * 0.5), sin(step * 2) * 0.8); scale(dir, 1);
  fill('rgba(0,0,0,0.22)'); ellipse(0, 130, 70, 8);
  stroke('#e04a3a'); strokeWeight(3);
  for (const ph of [0, PI]) line(ph ? 4 : -4, 106, (ph ? 4 : -4) + sin(step + ph) * 9, 130 - max(0, cos(step + ph)) * 5);
  noStroke();
  push(); translate(-22, 98); rotate(PI - 0.1); fill('#f4f4f4'); quad(0, -7, 0, 7, 80, 3, 80, -3); pop();   // 白色長尾
  fill('#1d2f70'); ellipse(0, 92, 54, 34);                   // 身體（藍黑）
  fill('#2a4fb8'); ellipse(8, 96, 36, 22);                   // 藍色腹部
  fill('#f4f4f4'); ellipse(-6, 84, 38, 14);                  // 白色背部
  fill('#1d2f70'); ellipse(21, 76, 16, 28);                  // 脖子
  const hx = 29 + sin(step) * 2, hy = 62;
  fill('#1d2f70'); circle(hx, hy, 17);
  fill('#d63a3a'); ellipse(hx + 3, hy + 1, 12, 10);          // 臉上的紅色肉垂
  fill('#f4f4f4'); triangle(hx - 4, hy - 8, hx - 22, hy - 14 + sin(t * 3) * 2, hx - 8, hy - 2);   // 白色冠羽
  fill('#d9d9c2'); triangle(hx + 8, hy - 1, hx + 8, hy + 3, hx + 17, hy + 1);
  fill(0); circle(hx + 3, hy - 0.5, 3);
  pop();
}

// 物種代號 → 繪圖函式
const SCENE_FN = {
  bear: sceneBear, magpie: sceneMagpie, macaque: sceneMacaque, salmon: sceneSalmon,
  pheasant: scenePheasant, muntjac: sceneMuntjac, leopardcat: sceneLeopardCat, barbet: sceneBarbet,
  treefrog: sceneTreeFrog, emperor: sceneEmperor, pangolin: scenePangolin, sambar: sceneSambar,
  serow: sceneSerow, salamander: sceneSalamander, swinhoe: sceneSwinhoe
};
