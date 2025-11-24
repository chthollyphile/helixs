export const resources = {
  en: {
    // Loading / App
    system_init: "SYSTEM INITIALIZATION...",
    loading_protocols: "LOADING PROTOCOLS...",
    protocol_engaged: "PROTOCOL ENGAGED",
    
    // HUD
    subtitle: "Helix Nav System v2.0",
    view_grid: "GRID VIEW",
    view_genome: "GENOME VIEW",
    view_expand: "EXPAND VIEW",
    
    // Navigation / Help
    search_help: "PRESS ENTER TO JUMP • ESC TO CANCEL",
    nav_overview: "Tap to Search • Swipe Down to Focus",
    nav_focus: "Tap to Search • Swipe Up for Overview",
    
    // Search UI
    system_query_protocol: "System Query Protocol",
    detected: "DETECTED",
    no_matching_signature: "NO_MATCHING_SIGNATURE",
    
    // Genome View
    genome_map_title: "GENOME_SEQUENCE_MAP // V.2.0",
    active_sequences: "ACTIVE SEQUENCES",
    genome_action_help: "CLICK SEQUENCE TO DECODE // CLICK VOID TO ABORT",
    
    // Card
    unknown_host: "UNKNOWN_HOST",
    no_telemetry: "NO TELEMETRY DATA",
    open_sys: "OPEN_SYS"
  },
  zh: {
    system_init: "系统初始化...",
    loading_protocols: "加载协议中...",
    protocol_engaged: "协议已接管",
    subtitle: "HelixS导航系统 v2.0",
    view_grid: "网格视图",
    view_genome: "基因视图",
    view_expand: "展开视图",
    search_help: "回车跳转 • ESC 取消",
    nav_overview: "点击搜索 • 下滑聚焦",
    nav_focus: "点击搜索 • 上滑总览",
    system_query_protocol: "系统查询协议",
    detected: "已检测",
    no_matching_signature: "无匹配签名",
    genome_map_title: "基因序列图谱 // V.2.0",
    active_sequences: "活跃序列",
    genome_action_help: "点击序列解码 // 点击空白中止",
    unknown_host: "未知主机",
    no_telemetry: "无遥测数据",
    open_sys: "进入"
  },
  ja: {
    system_init: "システム初期化中...",
    loading_protocols: "プロトコル読み込み中...",
    protocol_engaged: "プロトコル係合",
    subtitle: "HelixSナビシステム v2.0",
    view_grid: "グリッド表示",
    view_genome: "ゲノム表示",
    view_expand: "展開表示",
    search_help: "Enter ジャンプ • ESC キャンセル",
    nav_overview: "タップして検索 • 下にスワイプしてフォーカス",
    nav_focus: "タップして検索 • 上にスワイプして概要",
    system_query_protocol: "システム照会プロトコル",
    detected: "検出",
    no_matching_signature: "一致する署名なし",
    genome_map_title: "ゲノム配列マップ // V.2.0",
    active_sequences: "アクティブ配列",
    genome_action_help: "配列をクリックしてデコード // 空白をクリックして中止",
    unknown_host: "不明なホスト",
    no_telemetry: "テレメトリデータなし",
    open_sys: "システムを開く"
  }
};

export type Language = keyof typeof resources;
export type TranslationKey = keyof typeof resources.en;