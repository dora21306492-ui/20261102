// ============================================================
//  聲音：Web Audio 合成音效＋背景音樂＋物種聲音檔播放
//  全部聲音都經過 MASTER（總音量），所以滑桿一拉，整個網頁的聲音一起變大變小
// ============================================================
let AC = null;          // 音訊環境（第一次點擊後才建立，瀏覽器規定）
let MASTER = null;      // 總音量
let BGM_GAIN = null;    // 背景音樂音量（可以暫時壓低）
let bgmOn = false, bgmStep = 0;

// 第一次使用者操作時呼叫，啟動音訊
function audioInit() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      MASTER = AC.createGain(); MASTER.connect(AC.destination);
      BGM_GAIN = AC.createGain(); BGM_GAIN.gain.value = 1; BGM_GAIN.connect(MASTER);
      applyVolume();
      startBgm();
    } catch (e) { AC = null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
}

// 目前實際音量（靜音時為 0）
function effectiveVolume() {
  if (typeof store === 'undefined' || !store) return 0.7;
  return store.muted ? 0 : store.vol;
}
// 把音量套用到所有聲音
function applyVolume() {
  const v = effectiveVolume();
  if (MASTER) MASTER.gain.setTargetAtTime(v, AC.currentTime, 0.03);
  for (const sp of SPECIES) if (sp.audio) sp.audio.volume = Math.min(1, Math.max(0, v));
}

// 播放一個音：頻率、長度、波形、音量、延遲、滑音目標頻率、輸出到哪裡
function tone(f, d, type, vol, delay, f2, dest) {
  if (!AC) return;
  const t0 = AC.currentTime + (delay || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g); g.connect(dest || MASTER);
  o.start(t0); o.stop(t0 + d + 0.05);
}

// 音效：click 點擊、right 答對、wrong 答錯、win 通過、lose 未通過
function sfx(name) {
  if (!AC || effectiveVolume() === 0) return;
  if (name === 'click') tone(660, 0.06, 'triangle', 0.1);
  else if (name === 'right') { tone(660, 0.12, 'sine', 0.22); tone(880, 0.2, 'sine', 0.22, 0.1); }
  else if (name === 'wrong') tone(220, 0.28, 'sawtooth', 0.12, 0, 140);
  else if (name === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.22, i * 0.12));
  else if (name === 'lose') [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'sine', 0.16, i * 0.16));
}

// ---------- 背景音樂：輕柔的五聲音階＋偶爾的鳥鳴（自動生成，不用音檔） ----------
const BGM_SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];            // C D E G A C D
const BGM_CHORDS = [[130.81, 196.0, 261.63], [110.0, 164.81, 220.0], [174.61, 261.63, 349.23], [98.0, 196.0, 293.66]];
function startBgm() {
  if (bgmOn || !AC) return;
  bgmOn = true;
  const beat = 0.55;                                       // 每一拍的秒數
  const step = () => {
    if (!AC) return;
    const bar = Math.floor(bgmStep / 8) % 4, inBar = bgmStep % 8;
    if (inBar === 0) BGM_CHORDS[bar].forEach(f => tone(f, beat * 8, 'sine', 0.035, 0, 0, BGM_GAIN));   // 和弦墊底
    if (Math.random() < 0.7) tone(BGM_SCALE[Math.floor(Math.random() * BGM_SCALE.length)], beat * 1.6, 'triangle', 0.05, 0, 0, BGM_GAIN);   // 隨機旋律
    if (Math.random() < 0.06) {                            // 鳥鳴
      tone(2600, 0.09, 'sine', 0.03, 0, 3400, BGM_GAIN);
      tone(3000, 0.09, 'sine', 0.03, 0.13, 3700, BGM_GAIN);
    }
    bgmStep++;
    setTimeout(step, beat * 1000);
  };
  step();
}
// 播放物種聲音時，暫時把背景音樂壓低
function duckBgm(sec) {
  if (!BGM_GAIN) return;
  BGM_GAIN.gain.setTargetAtTime(0.12, AC.currentTime, 0.1);
  setTimeout(() => { if (BGM_GAIN) BGM_GAIN.gain.setTargetAtTime(1, AC.currentTime, 0.4); }, sec * 1000);
}

// ---------- 物種聲音檔（選用） ----------
function initAudioFiles() {
  for (const sp of SPECIES) {
    sp.audioOk = false;
    if (!sp.sound) continue;
    const a = new Audio();
    a.preload = 'auto';
    a.addEventListener('canplaythrough', () => { sp.audioOk = true; }, { once: true });
    a.addEventListener('error', () => { sp.audioOk = false; });
    a.src = sp.sound;
    sp.audio = a;
  }
}
function stopSpeciesSounds() { for (const sp of SPECIES) if (sp.audio) { try { sp.audio.pause(); sp.audio.currentTime = 0; } catch (e) {} } }
function playSpeciesSound(sp) {
  if (!sp || !sp.audio || !sp.audioOk || effectiveVolume() === 0) return;
  try {
    sp.audio.volume = Math.min(1, effectiveVolume());
    stopSpeciesSounds();                                   // 一次只播一段，避免聲音疊在一起
    const p = sp.audio.play(); if (p && p.catch) p.catch(() => {});
    duckBgm(4);
  } catch (e) {}
}
