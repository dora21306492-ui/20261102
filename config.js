// ============================================================
//  設定區（對應 PBL 文件的章節；改這裡就能換成別的主題）
//    PBL 1-1、1-2  需求分析  →  PROJECT（使用者、學習目標）
//    PBL 2-2       功能規格  →  FEATURES（功能開關）
//    PBL 2-4       視覺風格  →  STYLE（字型與主要顏色）
//    PBL 2-6       素材清單  →  MEDIA_CREDITS（來源與授權）
//    PBL 3-5       測試紀錄  →  作答結束時會在 Console（F12）印出每題結果表
//  題目資料在 species.js（每種動物一筆，含解說）；題型與學習目標的對應在 games.js 的 GOAL_OF
// ============================================================

// ▍PBL 1-1、1-2：需求分析
const PROJECT = {
  title: '認識台灣原生種',
  subtitle: '看圖・聽聲音・拖一拖，認識島上的野生動物',
  users: '國中七、八年級學生（也適合對台灣生態有興趣的一般民眾），在手機、平板或電腦上用，一次約 5～8 分鐘；聽過黑熊、藍鵲，但分不清「特有種」「特有亞種」和「原生種」',
  goals: [
    { id: 1, text: '能分辨特有種、特有亞種與原生種的差別' },
    { id: 2, text: '能看圖或聽叫聲，認出常見的台灣原生動物' },
    { id: 3, text: '能說出這些動物的棲地、習性與保育重點' }
  ]
};

// ▍PBL 2-2：功能規格（true 開啟、false 關閉）
const FEATURES = {
  F1_startScreen: true,       // 開始畫面：學習目標與使用對象（首頁的「學習目標」）
  F2_shuffle: true,           // 題目、選項每次重新打亂
  F3_autoPlaySound: true,     // 聽聲音題一進題目就自動播放一次
  F4_explain: true,           // 作答後立刻顯示對錯與解說
  F5_timer: true,             // 顯示作答時間
  F6_retryWrong: true,        // 成績面板可以「錯題再練」
  F7_keyboard: true,          // 鍵盤 1～4 作答、Enter 下一題
  F8_daily: true              // 每日挑戰與成就
};

// ▍PBL 2-4：視覺風格
const STYLE = {
  font: '"Chocolate Classical Sans","Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif',   // Google Fonts
  primary: '#38b25c',         // 主色：森林綠
  accent: '#f0a020',          // 輔色：夕陽橘
  ok: '#2e9e4f', okSoft: '#e4f6e8',
  bad: '#d64545', badSoft: '#fdeaea',
  ink: '#2f4a36'
};

// ▍PBL 2-6：素材清單（沒有放真實照片、真實叫聲時，全部是程式自製；放了之後請同步寫進 media/出處.txt）
const MEDIA_CREDITS = [
  { item: '15 種動物的情境動畫插圖、臺灣島與角色', source: 'p5.js 程式繪製', license: '自製' },
  { item: '背景音樂、按鈕與答題音效', source: 'Web Audio API 程式合成', license: '自製' },
  { item: '字型「Chocolate Classical Sans」', source: 'Google Fonts', license: 'SIL OFL 1.1' },
  { item: '程式庫 p5.js 1.10.0', source: 'p5js.org', license: 'LGPL 2.1' }
];

