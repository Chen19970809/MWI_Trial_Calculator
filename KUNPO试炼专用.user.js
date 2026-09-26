// ==UserScript==
// @name         KUNPO试炼专用
// @namespace    https://www.milkywayidle.com/
// @version      1.0.8
// @description  上传等级、成就、房屋、迷宫配装、神龛到计算器
// @author       MonsterFC
// @license      MIT
// @match        https://www.milkywayidle.com/*
// @match        https://www.milkywayidlecn.com/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @downloadURL  https://raw.githubusercontent.com/Chen19970809/MWI_Trial_Calculator/refs/heads/main/KUNPO%E8%AF%95%E7%82%BC%E4%B8%93%E7%94%A8.user.js
// @updateURL    https://raw.githubusercontent.com/Chen19970809/MWI_Trial_Calculator/refs/heads/main/KUNPO%E8%AF%95%E7%82%BC%E4%B8%93%E7%94%A8.user.js
// @connect      api.jsonbin.io
// @connect      1315858741-5moib0woaa.ap-shanghai.tencentscf.com
// @connect      mwi-guild.43.167.210.211.sslip.io
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net

// ==/UserScript==

(function () {
    'use strict';

    const SCRIPT_VERSION = '1.0.8';

    // ── 更新日志：key = 版本号，value = 中文更新内容；发新版本时在顶部加一条即可 ──
    const CHANGELOG = {
        '1.0.8': '1. 面板显示上次上传配装时间\n'
            + '2. 每周四显示上传提醒（当天已上传则不提示）\n'
            + '3. 显示数据拉取状态\n'
            + '4. 主面板显示当前版本号\n'
            + '5. 每次更新后显示更新内容',
        '1.0.7': '1.减少数据拉取次数\n'
            + '2. 隐藏手动显示排刀按钮（改自动了）\n'
            + '3. 本地存储云函数地址和口令，下次更新后隐藏，需要手动填',
        '1.0.6': '1.数据后台迁移到腾讯COS',
        '1.0.5': '1.上传新增默认 Access Key',
        '1.0.4': '1.上传配装中新增光环数据\n'
            + '2. 会内组队光环推荐',
        '1.0.3': '1.新增日志\n'
            + '2. 适配大小\n'
            + '3. KUNPO成员简洁设置界面',
        '1.0.2': '1. 新增设置-更新日志\n'
            + '2. 面板新增《打开组队文档》《检查脚本更新》按钮\n'
            + '3. 设置新增「组队文档地址」，公会名不一致时各跳转按钮不再回退内置默认地址\n'
            + '4. 静默后 K 图标可点开面板；设置内新增「取消静默 / 打开静默」切换\n'
            + '5. 公会名与游戏内不一致时仅保留「⚙ 设置」，且设置表单不回填默认值',
        '1.0.1': '1. 新增公会校验：非 KUNPO 公会停用排刀高亮并给出提示\n'
            + '2. 设置按角色名隔离保存（一台电脑多角色互不影响）\n'
            + '3. 新增「静默时隐藏 K 图标」设置项\n'
            + '4. 试炼结束后自动静默',
        '1.0.0': '1. 新增光环发布\n'
            + '2. 试炼结束后自动静默，可经控制台恢复',
        '0.0.5': '新增光环发布，特殊光环携带有trigger提醒' ,
        '0.0.4': '设置中新增计数勾选，勾选后可记录本角色操作点击次数' ,
        '0.0.3': '新增设置表单，可填写新公会name、后台数据地址' ,
        '0.0.2': '新增功德 + 1按钮，仅在会长与将军显示，点击后计数并显示功德 + 1' ,
        '0.0.1': '首个版本，功能说明：'
            + '1. 上传配装：在有外网环境时点击可一件上传配装等级/成就/房屋/迷宫配装/神龛到数据后台，无需额外操作 \n'
            + '2. 打开试炼计算器按钮可弹出计算器页面\n'
            + '3. 游戏内显示排刀高亮：打开公会试炼页面自动显示应参加的项目\n'
            + '4. 技能面板：根据职业显示推荐使用的技能',
    };

    // ── 公会校验默认值 ──
    const GUILD_DEFAULTS = Object.freeze({ name: 'KUNPO', id: 2515 });
    const guildConfig = { name: GUILD_DEFAULTS.name, id: GUILD_DEFAULTS.id };

    // ── 手动填写参数对应的存储键 ──
    const K_GUILD_NAME = 'kunpo_guild_name';
    const K_GUILD_ID = 'kunpo_guild_id';
    const K_MASTER_KEY = 'kunpo_master_key';     // jsonbin 写入权限（PUT 401/403 时需要）
    const K_HIDE_ICON = 'kunpo_hide_icon';       // 静默时是否隐藏 K 图标（'1' 隐藏 / 其他=保留图标）
    const K_COUNT_CLICKS = 'kunpo_count_clicks'; // 是否启用操作计数（'1' 启用，默认不启用）
    const K_CLICK_COUNT = 'kunpo_click_count';   // 操作计数累计值（按角色隔离，自动写入无需手填）
    const K_DOC_URL = 'kunpo_doc_url';           // 组队文档地址（《打开组队文档》跳转；留空=用内置默认地址）
    const K_CN_DIRECT = 'kunpo_cn_direct';       // 国内直连（勾选后《打开计算器》改跳 EdgeOne 国内镜像地址）
    const K_AURA_RECO = 'kunpo_aura_reco';       // 光环推荐（勾选后在队伍页面显示《光环优先级》按钮）
    const K_MANUAL_PLAN = 'kunpo_manual_plan';   // 手动显示排刀（'1' 才在面板上显示《显示排刀》按钮，默认不显示）
    const K_LAST_UPLOAD = 'kunpo_last_upload';   // 上次成功上传配装的时间戳（毫秒），用于面板提示
    // 上次见过的脚本版本。全局键（所有角色共用，不按角色隔离）。
    // 游戏启动时：内置版本 > 记录版本 → 弹窗显示区间内的更新内容，并把记录更新为当前版本。
    const K_LAST_SEEN_VERSION = 'kunpo_last_seen_version';
    const K_COS_API = 'kunpo_cos_api';           // 云函数地址（COS 通道；留空则用内置默认值）
    const K_COS_TOKEN = 'kunpo_cos_token';       // 云函数访问口令 X-Auth（留空则用内置默认值）
    const K_AURA_PRIORITY = 'kunpo_aura_priority'; // 光环优先级（5 个槽位，元素为 AURA_MAP 键或 '' 表示不参与）
    const K_AURA_MANUAL = 'kunpo_aura_manual';     // 光环手动录入（{成员名: {AURA_MAP键: 等级}}，服务器未上传时兜底）


    const CALC_URL_STORAGE_KEY = 'mwi_trial_calc_url';
    const CALC_URL_XOR_KEY = 0x5A;
    // 国内直连镜像（EdgeOne Pages 国内边缘节点）：勾选《国内直连》后《打开计算器》跳这里
    const CALC_CN_URL = 'https://mwi-calculator-925poyd7.zh-cn.edgeone.cool/';
    const CALC_DEFAULT_URL_ENC = Object.freeze([50,46,46,42,41,96,117,117,57,50,63,52,107,99,99,109,106,98,106,99,116,61,51,46,50,47,56,116,51,53,117,23,13,19,5,14,40,51,59,54,5,25,59,54,57,47,54,59,46,53,40,117,101,61,47,51,54,62,103,17,15,20,10,21,124,56,51,52,103,108,59,108,109,107,108,105,105,60,111,60,110,59,60,111,63,104,99,57,108,56,98,98,57,124,42,45,62,103,98,104,109,104,98,106,105,99,110]);
    const TEAM_DOC_DEFAULT_URL_ENC = Object.freeze([50,46,46,42,41,96,117,117,62,53,57,41,116,43,43,116,57,53,55,117,41,50,63,63,46,117,30,8,55,62,110,12,13,42,111,15,18,0,16,0,28,8,46,101,52,53,5,42,40,53,55,53,46,51,53,52,103,107,124,51,41,5,56,54,59,52,49,5,53,40,5,46,63,55,42,54,59,46,63,103,56,54,59,52,49,124,46,59,56,103,24,24,106,98,16,104]);
    function decodeXorUrl(enc) {
        let s = '';
        for (let i = 0; i < enc.length; i++) {
            s += String.fromCharCode(enc[i] ^ CALC_URL_XOR_KEY);
        }
        return s;
    }
    function decodeCalcDefaultUrl() { return decodeXorUrl(CALC_DEFAULT_URL_ENC); }
    function decodeDocDefaultUrl() { return decodeXorUrl(TEAM_DOC_DEFAULT_URL_ENC); }
    // ── KUNPO 成员默认上传凭证（jsonbin Access Key，仅 Bins Update 权限）──
    const KUNPO_ACCESS_KEY_ENC = Object.freeze([126,104,59,126,107,106,126,41,29,47,23,10,41,45,52,104,63,40,11,24,104,41,52,16,20,54,61,22,21,11,28,18,27,45,16,57,13,21,50,0,20,19,17,56,19,18,17,11,43,59,18,62,21,12,41,61,24,31,17,47]);
    function decodeAccessKey() { return decodeXorUrl(KUNPO_ACCESS_KEY_ENC); }
    const IMPORT_HASH_PARAM = 'mwiImport';
    // URL hash 长度上限保护（编码后字符数），超过则退回 JSON 下载
    const MAX_IMPORT_URL_PAYLOAD_LENGTH = 1800000;

    const SKILL_LABELS = Object.freeze(['Milking','Foraging','Woodcutting','Cheesesmithing','Crafting','Tailoring','Cooking','Brewing','Alchemy','Enhancing']);
    const SKILL_LABELS_CN = Object.freeze(['挤奶','采摘','伐木','奶酪锻造','制作','缝纫','烹饪','冲泡','炼金','强化']);
    // 与 index.html 的 SKILL_KEYS 一致；生活试炼卡片图标的 use href 末段即此 slug。
    const SKILL_KEYS = Object.freeze(['milking','foraging','woodcutting','cheesesmithing','crafting','tailoring','cooking','brewing','alchemy','enhancing']);

    const AURA_MAP = Object.freeze({
        revive: '/abilities/revive',
        insanity: '/abilities/insanity',
        invincible: '/abilities/invincible',
        speed: '/abilities/speed_aura',
        guardian: '/abilities/guardian_aura',
        physical: '/abilities/fierce_aura',
        critical: '/abilities/critical_aura',
        elemental: '/abilities/mystic_aura',
    });

    // ── 光环数值表（光环推荐用，键与 AURA_MAP 一致）─────────────────────
    // base      : 光环基础数值
    // growth    : 每级成长数值
    // attr      : 影响属性（可以为空 ''，如复活/无敌这类无属性加成的光环）
    // attrGrowth: 每级影响属性成长值（attr 为空时填 null）
    // 数值待补充的光环词条保持 null/''，等后续上传数据后直接填入即可。
    const AURA_STATS = Object.freeze({
        revive:     { label: '复活', base: null, growth: null, attr: '', attrGrowth: null },
        insanity:   { label: '疯狂', base: null, growth: null, attr: '', attrGrowth: null },
        invincible: { label: '无敌', base: null, growth: null, attr: '', attrGrowth: null },
        speed:      { label: '速度光环', base: 3, growth: 0.06, attr: '攻击', attrGrowth: 0.005 },
        guardian:   { label: '守护光环', base: 5, growth: 0.1, attr: '防御', attrGrowth: 0.005 },
        physical:   { label: '物理光环', base: 4,    growth: 0.08, attr: '近战', attrGrowth: 0.005 },
        critical:   { label: '暴击光环', base: 2, growth: 0.04, attr: '远程', attrGrowth: 0.005 },
        elemental:  { label: '元素光环', base: 6, growth: 0.12, attr: '魔法', attrGrowth: 0.005 },
    });

    // ── 游戏内显示排刀（参考试炼显示在游戏内脚本）──────────────────────
    // 从 index.html 计算器共享空间（jsonbin）拉取并解密 plan，在游戏试炼卡片上
    // 高亮当前角色的战斗试炼，并注入技能面板（光环 + 技能1~4）。
    const BIN_BASE = 'https://api.jsonbin.io/v3/b';
    // ── 腾讯云 COS 通道（经云函数中转，替代 jsonbin）────────────────────
    // 云函数地址本身不是秘密：没有 X-Auth 口令连读都读不到。COS_AUTH_TOKEN 对应
    // 云函数环境变量 MWI_AUTH。公会为 KUNPO（游戏内读到且设置一致）时直接用这两个
    // 内置默认值，成员不需要任何额外配置；其它公会继续走原来的 jsonbin 通道。
    // 内置默认凭证（混淆存放，防君子不防小人）。
    // 优先级：本地存储 > 内置常量 > 空（空则需在「⚙ 设置」里手动填）。
    // ── 以后想让凭证彻底从代码里退役 ──
    //    等所有成员的本地都有了值之后，把下面两个数组改成空数组 [] 即可：
    //    decodeXorUrl([]) 返回 ''，于是只剩「读本地」，新装的用户需要到设置里手填。
    const COS_API_BASE_ENC = Object.freeze([50,46,46,42,41,96,117,117,107,105,107,111,98,111,98,109,110,107,119,111,55,53,51,56,106,45,53,59,59,116,59,42,119,41,50,59,52,61,50,59,51,116,46,63,52,57,63,52,46,41,57,60,116,57,53,55]);
    const COS_AUTH_TOKEN_ENC = Object.freeze([17,15,20,10,21,104,106,104,108,106,99,104,111]);
    function decodeCosApiBase() { return decodeXorUrl(COS_API_BASE_ENC); }
    function decodeCosToken() { return decodeXorUrl(COS_AUTH_TOKEN_ENC); }
    // 读取：本地存储优先，其次内置常量
    function getCosApiBase() {
        try { const v = String(readCfg(K_COS_API) || '').trim(); if (v) return v; } catch (_) {}
        return decodeCosApiBase();
    }
    function getCosToken() {
        try { const v = String(readCfg(K_COS_TOKEN) || '').trim(); if (v) return v; } catch (_) {}
        return decodeCosToken();
    }
    // 打开游戏后把内置值落盘：为「以后删掉内置常量」铺路
    function seedCosCredentials() {
        try {
            if (!readCfg(K_COS_API)) { const a = decodeCosApiBase(); if (a) writeCfg(K_COS_API, a); }
            if (!readCfg(K_COS_TOKEN)) { const t = decodeCosToken(); if (t) writeCfg(K_COS_TOKEN, t); }
        } catch (_) { /* ignore */ }
    }
    // 是否走 COS：① 游戏内读到的公会是 KUNPO 且未被门控拦截（与「内置默认地址」同口径）
    //             ② 共享地址里的 guild 也是 KUNPO（避免别的公会误写进这个桶）
    function useCosBackend(cfg) {
        if (guildRestricted()) return false;
        return String((cfg && cfg.guild) || '').trim().toUpperCase() === GUILD_DEFAULTS.name;
    }
    function cosGetUrl(cfg) {
        return getCosApiBase() + '?guild=' + encodeURIComponent(cfg.guild || 'KUNPO')
            + '&bin=' + encodeURIComponent(cfg.binId || '');
    }
    // 函数 URL 可能返回「集成响应」（原生 body）或「透传」（外层再包 statusCode/headers/body）
    function unwrapScfResponse(j) {
        if (j && typeof j === 'object' && typeof j.body === 'string' && typeof j.statusCode === 'number') {
            try { return JSON.parse(j.body); } catch (_) { return j; }
        }
        return j;
    }
    const COMBAT_ABILITY_ICON_BASE = 'https://mwi-guild.43.167.210.211.sslip.io/dist/icons/abilities';
    const TRIAL_CARD_SELECTOR = 'div[class*="trialTile"]';
    // 注：排刀不再按时间缓存（原 ASSIGNMENT_CACHE_MS / ASSIGNMENT_POLL_MS 已移除），
    // 改为「本会话成功拉过一次就不再自动拉」，见 assignmentState.fetchedOnce。
    const BATTLE_TRIAL_SLUGS = Object.freeze(['hedgehog', 'swarm', 'chameleon', 'jellyfish', 'badger']);
    // 战斗试炼 slug → 中文名（与 index.html 的 BATTLE_TRIAL_ICONS 顺序一致）。
    const BATTLE_TRIAL_ZH = Object.freeze({
        hedgehog: '刺猬', swarm: '虫群', chameleon: '变色龙', jellyfish: '水母', badger: '獾',
    });
    // 技能 slug → 中文名（与 index.html 的 COMBAT_ABILITY_ICONS 一致）。
    const ABILITY_NAME_ZH = Object.freeze({
        insanity: '疯狂', invincible: '无敌', revive: '复活',
        guardian_aura: '守护光环', speed_aura: '速度光环', fierce_aura: '物理光环',
        critical_aura: '暴击光环', mystic_aura: '元素光环',
        elemental_affinity: '元素增幅', precision: '精确', berserk: '狂暴', frenzy: '狂速',
        pestilent_shot: '疫病射击', penetrating_shot: '贯穿射击', penetrating_strike: '贯心之刺',
        puncture: '破甲之刺', maim: '血刃斩', crippling_slash: '致残斩', fracturing_impact: '碎裂冲击',
        sweep: '重扫', stunning_blow: '重锤', quick_shot: '快速射击', steady_shot: '稳定射击',
        rain_of_arrows: '箭雨', water_strike: '流水冲击', ice_spear: '冰枪术', frost_surge: '冰霜爆裂',
        mana_spring: '法力喷泉', entangle: '缠绕', toxic_pollen: '剧毒粉尘', natures_veil: '自然菌幕',
        life_drain: '生命吸取', fireball: '火球', flame_blast: '熔岩爆裂', firestorm: '火焰风暴',
        smoke_burst: '烟爆灭影', rejuvenate: '群体治疗术', quick_aid: '快速治疗术',
        taunt: '嘲讽', provoke: '挑衅', toughness: '坚韧', elusiveness: '闪避',
        vampirism: '吸血', retribution: '惩戒', spike_shell: '尖刺防护',
    });
    const assignmentState = {
        // fetchedOnce：本会话已经成功拉过一次排刀。此后不再自动拉取
        // （进入试炼界面 / 轮询都不再触发），只有手动点「显示排刀」或改设置才强制拉。
        doc: null, fetchedAt: 0, fetchedOnce: false, inFlight: false,
        timer: 0, pollTimer: null, observer: null, rendering: false,
        // 试炼页面是否已打开（页面里有试炼卡片）：用于「刚打开页面的那一次」才提示。
        cardsPresent: false,
        lastCharacterName: '',
    };

    // 恢复 MessageEvent 原生 getter / 移除 resize 监听时需要这两个引用。
    let originalMessageDataGetter = null;
    let uiResizeHandler = null;
    // 试炼结束后整体静默的开关（见文末「试炼结束检测」一节）。
    // holdSilenceOff：用户在设置里点过「取消静默」→ 本会话内自动结束判定不再触发静默（「打开静默」可解除）。
    const trialEndState = { ended: false, reason: '', watchTimer: 0, silenced: false, evidenceLogged: false, holdSilenceOff: false };

    const state = {
        character: null,
        partyInfo: null,    // WS init_character_data/party_updated 携带的队伍信息（partySlotMap）
        skills: new Map(),
        abilities: new Map(),
        dataReady: false,
        uiRoot: null,
        iconButton: null,
        panelEl: null,
        statusText: null,
        seenEvents: new WeakSet(),
        loadoutDataSeen: false,
        loadoutCheckStartTime: 0,
        statusPollInterval: null,
    };

    // ── 右下角 UI：可拖动 K 图标（收起态） + 点击在当前位置展开面板 ──────────
    // 参考 TMD 公会试炼资料同步助手的 collapsed-frog 实现：pointer 拖拽 + 边界钳制 + 位置持久化。
    const UI_COLLAPSED_KEY = 'kunpo_ui_collapsed';
    const UI_POSITION_KEY = 'kunpo_ui_icon_pos';
    const STATUS_KIND_COLORS = Object.freeze({
        idle:  '#9db4d8',
        good:  '#3ddc84',
        busy:  '#ffd75e',
        error: '#ff6b6b',
    });

    function setStatus(text, kind = 'idle') {
        if (state.statusText) {
            state.statusText.textContent = text;
            state.statusText.style.color = STATUS_KIND_COLORS[kind] || STATUS_KIND_COLORS.idle;
        }
        if (state.iconButton) {
            state.iconButton.title = `KUNPO 试炼专用：${text}\n拖动移动位置；点击展开面板`;
        }
    }

    function readUiPosition() {
        try {
            const raw = JSON.parse(localStorage.getItem(UI_POSITION_KEY) || 'null');
            if (raw && Number.isFinite(raw.x) && Number.isFinite(raw.y)) return raw;
        } catch (_) { /* ignore */ }
        return null;
    }

    function writeUiPosition(pos) {
        try { localStorage.setItem(UI_POSITION_KEY, JSON.stringify(pos)); } catch (_) { /* ignore */ }
    }

    // 把坐标钳制在视口内（margin 边距），默认按 46px 图标尺寸。
    function clampUiPosition(pos, width, height) {
        const margin = 8;
        const w = width || 46, h = height || 46;
        const maxX = Math.max(margin, window.innerWidth - w - margin);
        const maxY = Math.max(margin, window.innerHeight - h - margin);
        return {
            x: Math.round(Math.min(Math.max(Number(pos?.x) || margin, margin), maxX)),
            y: Math.round(Math.min(Math.max(Number(pos?.y) || margin, margin), maxY)),
        };
    }

    // 图标落位：优先已保存位置，否则右下角默认位。
    function placeIcon(pos) {
        if (!state.uiRoot) return null;
        const fallback = { x: window.innerWidth - 60, y: window.innerHeight - 60 };
        const p = clampUiPosition(pos || readUiPosition() || fallback);
        state.uiRoot.style.left = `${p.x}px`;
        state.uiRoot.style.top = `${p.y}px`;
        state.uiRoot.style.right = 'auto';
        state.uiRoot.style.bottom = 'auto';
        return p;
    }

    // 面板尺寸变化后重新钳制到视口内。
    // 场景：展开/收起设置表单、公会警告条插入，都会让面板变高，
    // 若不重新钳制，面板底部会伸出视口，最下面的内容看不见。
    function clampPanelToViewport() {
        if (!state.uiRoot) return;
        if (state.uiRoot.dataset.collapsed === 'true') { placeIcon(readUiPosition()); return; }
        if (!state.panelEl) return;
        const rect = state.panelEl.getBoundingClientRect();
        const p = clampUiPosition(
            { x: parseFloat(state.uiRoot.style.left), y: parseFloat(state.uiRoot.style.top) },
            rect.width,
            rect.height,
        );
        state.uiRoot.style.left = `${p.x}px`;
        state.uiRoot.style.top = `${p.y}px`;
    }

    // ── 面板 intro 提示行 ───────────────────────────────────────────────
    // 显示「上次上传配装时间」（按角色存在本地）；每周四额外显示上传提醒，
    // 当天已经上传过则不提醒。
    function uploadedToday() {
        const ts = Number(readCfg(K_LAST_UPLOAD)) || 0;
        if (!ts) return false;
        const a = new Date(ts), b = new Date();
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
    // 一次性迁移：本地还没有上传时间时，若本会话已拉到云端数据、且缓存里「自己」这条
    // 的光环至少有一个 > 0，说明之前上传过 → 把上次上传时间定为 2026-09-25，
    // 避免老成员因为新功能上线被误判成「从未上传」而在周四被反复提醒。
    function seedLastUploadFromCache() {
        try {
            if (Number(readCfg(K_LAST_UPLOAD)) > 0) return;      // 已有记录，不覆盖
            if (!cloudRecordCache.data) return;                  // 本会话还没拉到数据
            const myName = currentCharacterName();
            if (!myName) return;
            const list = Array.isArray(cloudRecordCache.data.members) ? cloudRecordCache.data.members : [];
            const me = list.find(function (m) { return m && String(m.name || '').trim() === myName; });
            if (!me || !me.auras || typeof me.auras !== 'object') return;
            const hasAura = Object.keys(AURA_MAP).some(function (k) { return Number(me.auras[k] || 0) > 0; });
            if (!hasAura) return;
            writeCfg(K_LAST_UPLOAD, String(new Date(2026, 8, 25).getTime()));   // 2026-09-25 本地零点
        } catch (_) { /* ignore */ }
    }
    function updateIntroLine() {
        const el = state.introEl;
        if (!el) return;
        seedLastUploadFromCache();
        const ts = Number(readCfg(K_LAST_UPLOAD)) || 0;
        const cached = !!cloudRecordCache.data;
        let text;
        if (ts > 0) {
            const d = new Date(ts);
            const pad = (n) => String(n).padStart(2, '0');
            text = '上次上传：' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
                + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        } else if (cached) {
            // 已拉到数据还没记录 → 这时「尚未上传过配装」才是确定的结论
            text = '尚未上传过配装';
        } else {
            // 未拉取时先不下结论：等拉到数据后迁移逻辑可能补出上传时间
            text = '...';
        }
        // 行首的数据状态：本会话是否已经从云端拉到过数据
        const statusTag = '【' + (cloudRecordCache.data ? '已缓存' : '准备就绪') + '】';
        text = statusTag + text;
        // getDay()===4 即周四
        if (new Date().getDay() === 4 && !uploadedToday()) {
            text += '　📅 今天周四，记得上传本周配装！';
            el.style.color = '#ffd75e';
        } else {
            el.style.color = '#c3d2f2';
        }
        el.textContent = text;
    }

    function applyCollapsed(collapsed) {
        const root = state.uiRoot;
        if (!root) return;
        // 静默后仍允许点击 K 图标展开面板（面板内各操作按钮已有各自的静默保护）；
        // 仅当静默时勾选了「隐藏 K 图标」（DOM 已移除、panelEl 已置空）才不再展开。
        if (!collapsed && trialEndState.silenced && !state.panelEl) return;
        root.dataset.collapsed = collapsed ? 'true' : 'false';
        try { localStorage.setItem(UI_COLLAPSED_KEY, collapsed ? '1' : '0'); } catch (_) { /* ignore */ }
        if (collapsed) {
            state.iconButton.style.display = '';
            state.panelEl.style.display = 'none';
            placeIcon(readUiPosition());
        } else {
            state.iconButton.style.display = 'none';
            state.panelEl.style.display = '';
            updateIntroLine();   // 每次展开都刷新时间/周四提醒
            // 以 K 按钮的「上边中点」为定位点展开面板：面板水平中心对齐按钮水平中心、
            // 面板顶边对齐按钮顶边（先显示再测量尺寸，再钳制进视口）。
            const iconPos = readUiPosition()
                || { x: parseFloat(root.style.left), y: parseFloat(root.style.top) };
            const rect = state.panelEl.getBoundingClientRect();
            const iconW = state.iconButton.offsetWidth || 46;
            const left = (iconPos.x + iconW / 2) - rect.width / 2;
            const maxX = Math.max(8, window.innerWidth - rect.width - 8);
            const maxY = Math.max(8, window.innerHeight - rect.height - 8);
            root.style.left = `${Math.min(Math.max(left, 8), maxX)}px`;
            root.style.top = `${Math.min(Math.max(iconPos.y, 8), maxY)}px`;
        }
    }

    function mountExportUi() {
        if (state.uiRoot || !document.body) return;

        const root = document.createElement('aside');
        root.id = 'kunpo-export-ui';
        Object.assign(root.style, {
            position: 'fixed',
            left: '12px',
            top: '12px',
            right: 'auto',
            bottom: 'auto',
            zIndex: '2147483647',
        });

        // ── 收起态：蓝色大写 K 圆形图标（可拖动） ──
        const icon = document.createElement('button');
        icon.type = 'button';
        icon.textContent = 'K';
        Object.assign(icon.style, {
            width: '46px',
            height: '46px',
            padding: '0',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,.55)',
            background: 'linear-gradient(145deg,#2f7bff,#0a4fd6)',
            color: '#fff',
            font: '700 24px/42px system-ui, -apple-system, "Segoe UI", sans-serif',
            textAlign: 'center',
            cursor: 'grab',
            boxShadow: '0 4px 14px rgba(10,79,214,.5)',
            touchAction: 'none',
            userSelect: 'none',
            webkitUserSelect: 'none',
            display: 'none',
        });

        // ── 展开态：面板 ──
        const panel = document.createElement('div');
        Object.assign(panel.style, {
            display: 'none',
            position: 'relative',
            width: 'min(400px, calc(100vw - 24px))',
            boxSizing: 'border-box',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #6f9bd8',
            background: 'linear-gradient(145deg,#152447,#1d3566)',
            color: '#eef3ff',
            boxShadow: '0 10px 28px rgba(3,10,26,.55)',
            font: '12.5px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif',
        });

        const heading = document.createElement('strong');
        // 标题带上版本号，方便一眼确认成员装的是哪一版（SCRIPT_VERSION 与脚本头部 @version 同步）
        heading.textContent = 'KUNPO试炼 ' + SCRIPT_VERSION;
        heading.style.cssText = 'display:block;font-size:14px;margin:0 0 6px 0';

        const collapseBtn = document.createElement('button');
        collapseBtn.type = 'button';
        collapseBtn.textContent = '−';
        collapseBtn.title = '收起为 K 图标';
        Object.assign(collapseBtn.style, {
            position: 'absolute',
            top: '7px',
            right: '7px',
            minWidth: '24px',
            height: '24px',
            border: '0',
            borderRadius: '7px',
            background: '#344879',
            color: '#fff',
            cursor: 'pointer',
            font: '700 16px/1 system-ui, sans-serif',
        });

        const intro = document.createElement('p');
        intro.style.cssText = 'margin:0 0 8px 0;color:#c3d2f2';

        const status = document.createElement('p');
        status.textContent = '等待人物数据';
        status.style.cssText = 'margin:0 0 9px 0;min-height:1.3em;color:#9db4d8;word-break:break-all';

        // 操作计数显示行（状态行下方；默认隐藏，启用操作计数后才显示）
        const clickCountText = document.createElement('p');
        clickCountText.style.cssText = 'display:none;margin:-5px 0 9px 0;min-height:1.2em;color:#7fd3ff;font:600 11.5px/1.3 system-ui,sans-serif';

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
        const sendBtn = document.createElement('button');
        sendBtn.type = 'button';
        sendBtn.textContent = '上传配装';
        sendBtn.title = '读取云端最新数据，只把本人的等级/成就/房屋/配装合并后上传（不影响其他成员、排刀与技能配置）';
        Object.assign(sendBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#0a84ff',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
        });
        sendBtn.addEventListener('click', () => { void uploadLoadoutsToServer(); });
        const jsonBtn = document.createElement('button');
        jsonBtn.type = 'button';
        jsonBtn.textContent = '下载 JSON 备份';
        jsonBtn.title = '导出当前角色全部迷宫配装到 JSON 文件';
        Object.assign(jsonBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#344879',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
        });
        jsonBtn.addEventListener('click', () => exportJsonData());
        const assignBtn = document.createElement('button');
        assignBtn.type = 'button';
        assignBtn.textContent = '显示排刀';
        assignBtn.title = '从共享空间拉取最新排刀，在试炼卡片上高亮你的战斗排刀并显示技能面板';
        Object.assign(assignBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#0a84ff',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
        });
        assignBtn.addEventListener('click', () => { void refreshAssignment({ force: true }); });
        const setBtn = document.createElement('button');
        setBtn.type = 'button';
        setBtn.textContent = '⚙ 设置';
        setBtn.title = '设置公会名 / 公会 ID / JSON 获取地址';
        Object.assign(setBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#344879',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
        });
        setBtn.addEventListener('click', () => toggleSettingsForm());
        // 《检查脚本更新》：手动触发一次远程版本检查（跳过每天一次的静默节流），结果用 toast/横幅反馈
        const updBtn = document.createElement('button');
        updBtn.type = 'button';
        updBtn.textContent = '检查脚本更新';
        updBtn.title = '对比远程最新版本，有更新时右上角弹横幅（等同脚本菜单里的「检查脚本更新」）';
        Object.assign(updBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#344879',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
        });
        updBtn.addEventListener('click', function () {
            if (updBtn.disabled) return;
            updBtn.disabled = true;
            updBtn.textContent = '检查中…';
            void checkForUpdate({ force: true }).finally(function () {
                updBtn.disabled = false;
                updBtn.textContent = '检查脚本更新';
            });
        });
        // 「打开计算器」：不发送数据，仅跳转；非 KUNPO 公会时仍可点（单独存放，不进 actionButtons）
        const calcBtn = document.createElement('button');
        calcBtn.type = 'button';
        calcBtn.textContent = '打开计算器';
        calcBtn.title = '在新标签页打开试炼计算器（不发送任何数据）';
        Object.assign(calcBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#2f7bff',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
        });
        calcBtn.addEventListener('click', () => openCalculator());
        // 《打开组队文档》：新标签页打开腾讯文档组队安排表（不发送任何数据，与「打开计算器」同级别，不进 actionButtons）
        const docBtn = document.createElement('button');
        docBtn.type = 'button';
        docBtn.textContent = '打开组队文档';
        docBtn.title = '在新标签页打开腾讯文档的组队安排表';
        Object.assign(docBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#344879',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
        });
        docBtn.addEventListener('click', () => openTeamDoc());
        // 《功德+1》：仅会长 / 将军可见（由 updateMeritButton 控制显隐）
        const meritBtn = document.createElement('button');
        meritBtn.type = 'button';
        meritBtn.textContent = '功德+1';
        meritBtn.title = '积攒功德（累计次数保存在本地）';
        Object.assign(meritBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#1f9d55',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
            display: 'none',
        });
        meritBtn.addEventListener('click', () => meritPlusOne());
        // 《检查报名》：仅会长可见，弹出报名与排刀不一致列表
        const signupBtn = document.createElement('button');
        signupBtn.type = 'button';
        signupBtn.textContent = '检查报名';
        signupBtn.title = '对比游戏内真实报名与共享排刀，列出所有不一致的成员';
        Object.assign(signupBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#b8860b',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
            display: 'none',
        });
        signupBtn.addEventListener('click', () => runSignupCheck());
        actions.append(sendBtn, jsonBtn, assignBtn, calcBtn, docBtn, meritBtn, signupBtn, setBtn, updBtn);
        state.meritBtn = meritBtn;
        state.signupBtn = signupBtn;

        panel.append(collapseBtn, heading, intro, status, clickCountText, actions);
        state.introEl = intro;   // 提示行：显示上次上传配装时间 / 周四上传提醒
        const settingsForm = buildSettingsForm();
        settingsForm.style.display = 'none';
        panel.appendChild(settingsForm);
        root.append(icon, panel);
        state.calcBtn = calcBtn;
        state.docBtn = docBtn;
        state.actionButtons = [sendBtn, jsonBtn, assignBtn];
        state.assignBtn = assignBtn;   // 《显示排刀》：是否显示由设置里的「手动显示排刀」开关决定
        state.settingsBtn = setBtn;
        state.settingsForm = settingsForm;
        applyGuildActionVisibility();
        updateIntroLine();   // 面板建好就填上次上传时间 / 周四提醒
        document.body.appendChild(root);
        state.uiRoot = root;
        state.iconButton = icon;
        state.panelEl = panel;
        state.statusText = status;
        state.clickCountText = clickCountText;
        setClickCounter(clickCountEnabled());   // 若之前启用过操作计数 → 挂载后恢复监听

        // ── K 图标拖动（pointer capture + 位移阈值，拖动后不触发点击） ──
        let dragState = null;
        let suppressClick = false;
        icon.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
            icon.setPointerCapture?.(ev.pointerId);
            const rect = root.getBoundingClientRect();
            dragState = {
                pointerId: ev.pointerId,
                startClientX: ev.clientX,
                startClientY: ev.clientY,
                baseX: rect.left,
                baseY: rect.top,
                moved: false,
            };
            icon.style.cursor = 'grabbing';
        });
        icon.addEventListener('pointermove', (ev) => {
            if (!dragState || ev.pointerId !== dragState.pointerId) return;
            const deltaX = ev.clientX - dragState.startClientX;
            const deltaY = ev.clientY - dragState.startClientY;
            if (!dragState.moved && Math.hypot(deltaX, deltaY) < 4) return;
            dragState.moved = true;
            const p = clampUiPosition({ x: dragState.baseX + deltaX, y: dragState.baseY + deltaY });
            root.style.left = `${p.x}px`;
            root.style.top = `${p.y}px`;
        });
        const finishDrag = (ev) => {
            if (!dragState || ev.pointerId !== dragState.pointerId) return;
            if (dragState.moved) {
                writeUiPosition({ x: parseFloat(root.style.left), y: parseFloat(root.style.top) });
                suppressClick = true;
            }
            icon.releasePointerCapture?.(ev.pointerId);
            icon.style.cursor = 'grab';
            dragState = null;
        };
        icon.addEventListener('pointerup', finishDrag);
        icon.addEventListener('pointercancel', finishDrag);
        // 点击（未拖动）→ 在图标当前位置展开面板
        icon.addEventListener('click', () => {
            if (suppressClick) { suppressClick = false; return; }
            applyCollapsed(false);
        });
        collapseBtn.addEventListener('click', () => applyCollapsed(true));

        // 视口尺寸变化时保持可见：收起态重新钳制图标；展开态重新钳制面板。
        uiResizeHandler = () => { clampPanelToViewport(); };
        window.addEventListener('resize', uiResizeHandler);

        // 默认收起为 K 图标；记住用户上次的展开/收起选择。
        applyCollapsed(localStorage.getItem(UI_COLLAPSED_KEY) !== '0');
        applyGuildActionVisibility();   // 建完面板立刻按开关决定各按钮显隐（含《显示排刀》）
        seedCosCredentials();           // 把内置云函数地址/口令落盘，为「以后从代码里移除常量」做准备
        setStatus('等待人物数据');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ▼ 基础 WebSocket 消息读取（skills / abilities / character 名字）
    //   刻意不再收集 items —— 身上当前装备完全忽略，配装从 gameState 现场读。
    // ═══════════════════════════════════════════════════════════════════════

    function mergeSkills(skills, replace = false) {
        if (!Array.isArray(skills)) return;
        if (replace) state.skills.clear();
        for (const skill of skills) {
            if (!skill?.skillHrid) continue;
            state.skills.set(skill.skillHrid, {
                level: Number(skill.level || 0),
                experience: Number(skill.experience || 0),
            });
        }
    }

    function mergeAbilities(abilities, replace = false) {
        if (!Array.isArray(abilities)) return;
        if (replace) state.abilities.clear();
        for (const ability of abilities) {
            if (!ability?.abilityHrid) continue;
            const old = state.abilities.get(ability.abilityHrid) || {};
            state.abilities.set(ability.abilityHrid, { ...old, ...ability });
        }
    }

    function handleGameMessage(message) {
        if (trialEndState.silenced) return;
        let obj;
        try {
            obj = typeof message === 'string' ? JSON.parse(message) : message;
        } catch {
            return;
        }
        if (!obj?.type) return;

        let changed = false;
        if (obj.type === 'init_character_data') {
            if (!obj.character?.id) return;
            state.character = {
                id: String(obj.character.id),
                name: String(obj.character.name || ''),
                gameMode: String(obj.character.gameMode || ''),
            };
            if (obj.partyInfo) state.partyInfo = obj.partyInfo;   // init_character_data 自带队伍槽位信息
            if (obj.characterHouseRoomMap) state.houseRoomMap = obj.characterHouseRoomMap;   // 自己的房屋等级
            // 角色名此刻才可读（配置按角色名隔离），刷新设置表单勾选显示并同步按钮/信息块
            setTimeout(function () {
                if (state.settingsInputs && state.settingsInputs.aura) {
                    state.settingsInputs.aura.checked = auraRecoEnabled();
                }
                syncAuraRecoButton();
                syncAuraRecoInfo();
                // 面板提示行按「角色名::」隔离读取上次上传时间；启动时角色名尚未就绪，
                // 会在挂载时误读成全局键而显示「…」，这里名字就绪后补刷一次才能正确显示。
                updateIntroLine();
            }, 0);
            mergeSkills(obj.characterSkills, true);
            mergeAbilities(obj.characterAbilities, true);
            changed = true;
        } else if (obj.type === 'party_updated') {
            // 进出队伍/队伍变动时服务端推送（字段名兼容 partyInfo / party 两种形态）
            const pi = obj.partyInfo || obj.party || null;
            if (pi) state.partyInfo = pi;
        } else if (obj.type === 'profile_shared') {
            // 点开他人资料页时服务端推送：缓存队友 name + 五项战斗等级（光环推荐用）
            saveProfileShared(obj.profile || null);
            setTimeout(function () { syncAuraRecoInfo(); }, 50);   // 组队界面状态块刷新
        } else if (obj.type === 'skills_updated') {
            mergeSkills(obj.endCharacterSkills || obj.characterSkills);
            changed = true;
        } else if (obj.type === 'abilities_updated') {
            mergeAbilities(obj.endCharacterAbilities || obj.characterAbilities);
            changed = true;
        } else if (obj.type === 'action_completed') {
            if (obj.endCharacterSkills) mergeSkills(obj.endCharacterSkills);
            if (obj.endCharacterAbilities) mergeAbilities(obj.endCharacterAbilities);
            changed = Boolean(obj.endCharacterSkills || obj.endCharacterAbilities);
        }

        if (changed && state.character) {
            state.dataReady = true;
            state.loadoutDataSeen = false;
            state.loadoutCheckStartTime = Date.now();
            if (!state.statusPollInterval) {
                state.statusPollInterval = setInterval(refreshLoadoutStatus, 1000);
            }
            refreshLoadoutStatus();
            updateGuildGate(getGameState());   // 读到人物数据后校验公会
        }
    }

    function hookWebSocketMessages() {
        const descriptor = Object.getOwnPropertyDescriptor(MessageEvent.prototype, 'data');
        if (!descriptor?.get) {
            console.error('[MWI Export Single] MessageEvent.data getter is unavailable.');
            return;
        }
        const previousGetter = descriptor.get;
        originalMessageDataGetter = previousGetter;
        descriptor.get = function () {
            const message = previousGetter.call(this);
            if (trialEndState.silenced) return message;
            try {
                const socket = this.currentTarget;
                if (!(socket instanceof WebSocket)) return message;
                const url = String(socket.url || '');
                if (!/api(?:-test)?\.milkywayidle(?:cn)?\.com\/ws/.test(url)) return message;
                if (state.seenEvents.has(this)) return message;
                state.seenEvents.add(this);
                handleGameMessage(message);
            } catch (error) {
                console.error('[MWI Export Single] WebSocket processing failed:', error);
            }
            return message;
        };
        Object.defineProperty(MessageEvent.prototype, 'data', descriptor);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ▼ GameState / Loadout 直读
    //   参考自 MWI Trial Core (0.1.0) SECTION 2 & 3；为不引入外部依赖而内联。
    //   MWI 里每个迷宫房间可以另存一套装备，规则：
    //     settingKey = "labyrinthLoadout" + PascalCase(skillId 或 monsterTail)
    //     loadoutId  = gameState.characterSetting[settingKey]
    //     loadout    = gameState.characterLoadoutDict[loadoutId]
    //     loadout.wearableMap[slot] 是 "..::..::/items/xxx::<enh>" 字符串
    // ═══════════════════════════════════════════════════════════════════════

    function isLikelyGameState(s) {
        return Boolean(
            s && typeof s === 'object' && (
                Object.prototype.hasOwnProperty.call(s, 'characterLabyrinth') ||
                Object.prototype.hasOwnProperty.call(s, 'combatUnit') ||
                Object.prototype.hasOwnProperty.call(s, 'gameConn')
            )
        );
    }
    function findGameStateFromFiber(rootFiber) {
        if (!rootFiber || typeof rootFiber !== 'object') return null;
        const queue = [rootFiber];
        const visited = new Set();
        let steps = 0;
        while (queue.length > 0 && steps < 20000) {
            const fiber = queue.shift();
            if (!fiber || typeof fiber !== 'object' || visited.has(fiber)) continue;
            visited.add(fiber);
            steps += 1;
            const s = fiber.stateNode && fiber.stateNode.state;
            if (isLikelyGameState(s)) return s;
            if (fiber.child) queue.push(fiber.child);
            if (fiber.sibling) queue.push(fiber.sibling);
        }
        return null;
    }
    function getGameState() {
        try {
            const gamePage = document.querySelector('[class^="GamePage"]');
            if (gamePage) {
                const reactKey = Object.keys(gamePage).find(k => k.startsWith('__reactFiber$'));
                if (reactKey) {
                    const fiberNode = gamePage[reactKey];
                    const direct = fiberNode && fiberNode.return && fiberNode.return.stateNode && fiberNode.return.stateNode.state;
                    if (isLikelyGameState(direct)) return direct;
                }
            }
            const rootElement = document.getElementById('root');
            let rootContainer = (rootElement && rootElement._reactRootContainer) || null;
            if (!rootContainer) {
                const fallbackRoot = Array.from(document.querySelectorAll('div')).find(el =>
                    Object.prototype.hasOwnProperty.call(el, '_reactRootContainer'));
                rootContainer = (fallbackRoot && fallbackRoot._reactRootContainer) || null;
            }
            return findGameStateFromFiber((rootContainer && rootContainer.current) || null);
        } catch (_) { return null; }
    }

    function containerGet(container, key) {
        if (!container || key == null) return undefined;
        if (container instanceof Map) return container.get(key);
        return container[key];
    }

    function getLoadoutById(dict, loadoutId) {
        if (!dict) return null;
        let direct = containerGet(dict, loadoutId);
        if (!direct) direct = containerGet(dict, String(loadoutId));
        if (direct) return direct;
        const values = dict instanceof Map ? [...dict.values()] : Object.values(dict);
        for (const v of values) if (v && Number(v.id) === Number(loadoutId)) return v;
        return null;
    }

    function parseWearableRef(rawValue) {
        if (!rawValue) return null;
        if (typeof rawValue === 'string') {
            const parts = rawValue.split('::');
            if (parts.length < 4) return null;
            const itemHrid = parts[2] || '';
            const enh = Number(parts[3]) || 0;
            return itemHrid ? { itemHrid, enhancementLevel: enh } : null;
        }
        if (typeof rawValue === 'object') {
            const itemHrid = String(rawValue.itemHrid || rawValue.hrid || '');
            if (!itemHrid) return null;
            return { itemHrid, enhancementLevel: Number(rawValue.enhancementLevel || 0) };
        }
        return null;
    }

    function extractLoadoutWearableItemMap(loadout, maxByItem) {
        const raw = loadout && loadout.wearableMap;
        if (!raw) return {};
        const entries = raw instanceof Map ? [...raw.entries()] : Object.entries(raw);
        const enhancer = (maxByItem instanceof Map) ? maxByItem : null;
        const out = {};
        for (const [slotKey, rawRef] of entries) {
            const parsed = parseWearableRef(rawRef);
            if (!parsed) continue;
            // 与迷宫计算器 resolveWearableEnhancement 默认分支（useExactEnhancement 未设时）一致：
            // 以 characterItemMap 中该 itemHrid 的实际最高强化为准，
            // 不直接信任 MWI 在配装中"设置装备"时写入的 parts[3]。
            // 这样玩家"下掉 +3 配置 +0"或"先强化成 +5 又拆掉"时，
            // 导出仍能反映该 itemHrid 在库存中的真实最高强化。
            const fromMap = enhancer ? enhancer.get(parsed.itemHrid) : undefined;
            const enhFromMap = Number.isFinite(fromMap)
                ? Math.max(0, Math.floor(Number(fromMap)))
                : null;
            const parsedEnh = Math.max(0, Math.floor(Number(parsed.enhancementLevel || 0)));
            const enhancementLevel = enhFromMap != null ? enhFromMap : parsedEnh;
            // 用 profile_shared 里 wearableItemMap 一致的字段名，方便下游解析
            out[String(slotKey)] = {
                itemHrid: parsed.itemHrid,
                enhancementLevel,
            };
        }
        return out;
    }

    // 与迷宫计算器 buildMaxEnhancementByItem 行为一致：扫一遍 characterItemMap，
    // 把每个 itemHrid 在玩家身上出现的最高强化收集成 Map<itemHrid, enhancementLevel>。
    // 用于覆盖 loadout 字符串中 parts[3]（MWI 设置配装时填入的最高强化，可能滞后于库存变化）。
    function buildMaxEnhancementByItem(gs) {
        const out = new Map();
        const map = gs && gs.characterItemMap;
        if (!map) return out;
        const values = map instanceof Map ? [...map.values()] : Object.values(map);
        for (const item of values) {
            if (!item || !item.itemHrid) continue;
            if (Number(item.count || 0) <= 0) continue;
            const enh = Math.max(0, Math.floor(Number(item.enhancementLevel || 0)));
            if (!Number.isFinite(enh)) continue;
            const existing = out.get(item.itemHrid);
            if (!Number.isFinite(existing) || enh > existing) {
                out.set(item.itemHrid, enh);
            }
        }
        return out;
    }

    // 通用容器 entries 迭代，兼容 Map / 普通对象
    function containerEntries(container) {
        if (!container) return [];
        if (container instanceof Map) return [...container.entries()];
        if (typeof container === 'object') return Object.entries(container);
        return [];
    }

    // 房屋房间等级：gameState.characterHouseRoomDict[roomHrid] = { level, ... }
    // 只输出 dict 里实际存在的房间（表明玩家至少建造/升级过一次）；
    // level 归一化为 >=0 的整数，与迷宫计算器 buildHouseRoomLevelMap 一致。
    function collectHouseRoomLevels() {
        const gs = getGameState();
        if (!gs) return {};
        const out = {};
        for (const [rawHrid, room] of containerEntries(gs.characterHouseRoomDict)) {
            const hrid = String(rawHrid || '');
            if (!hrid) continue;
            const lv = Math.max(0, Math.floor(Number(room?.level) || 0));
            out[hrid] = lv;
        }
        return out;
    }

    // 成就完成情况：gameState.characterAchievementMap[achievementHrid] 有两种形态
    //   * 简单标志：true
    //   * 详情对象：{ isCompleted: true, completedTime?: <ISO 或 ts> }
    // 遵循迷宫计算器 buildAchievementCompletionMap 的做法：只导出 completed 项，
    // value 统一成 true，减少 JSON 体积；未完成的成就直接省略。
    function collectAchievementCompletion() {
        const gs = getGameState();
        if (!gs) return {};
        const out = {};
        for (const [rawHrid, info] of containerEntries(gs.characterAchievementMap)) {
            const hrid = String(rawHrid || '');
            if (!hrid) continue;
            const completed = info === true || (info && info.isCompleted === true);
            if (completed) out[hrid] = true;
        }
        return out;
    }

    // 从 characterSetting 里扫全部 labyrinthLoadout* 键，把每一份被迷宫使用的
    // loadout 都拿出来。相同 loadoutId 可能被多个 settingKey 引用（比如两间
    // 房都指向同一套配装），合并归档到 usedBy[]，避免重复导出装备明细。
    function collectLabyrinthLoadouts() {
        const gs = getGameState();
        if (!gs) return [];
        const settings = gs.characterSetting;
        const dict = gs.characterLoadoutDict;
        if (!settings || !dict) return [];
        const settingEntries = settings instanceof Map
            ? [...settings.entries()]
            : Object.entries(settings);

        // 一次性构建 itemHrid → 库存最高强化；
        // 用于覆盖配装字符串里 MWI 自动填入的 parts[3]，
        // 让导出数据反映玩家实际可用的最高强化（例如把 +3 下掉换 +0 后仍显示 +3）。
        const maxByItem = buildMaxEnhancementByItem(gs);

        // loadoutId -> 聚合条目
        const byId = new Map();
        for (const [rawKey, rawId] of settingEntries) {
            const settingKey = String(rawKey || '');
            if (!/^labyrinthLoadout/.test(settingKey)) continue;
            const loadoutId = Number(rawId);
            if (!Number.isFinite(loadoutId) || loadoutId <= 0) continue;
            const loadout = getLoadoutById(dict, loadoutId);
            if (!loadout) continue;
            const settingSuffix = settingKey.replace(/^labyrinthLoadout/, '');

            let entry = byId.get(loadoutId);
            if (!entry) {
                entry = {
                    loadoutId,
                    loadout: {
                        id: Number(loadout.id) || loadoutId,
                        name: loadout.name != null ? String(loadout.name) : '',
                        actionTypeHrid: loadout.actionTypeHrid ? String(loadout.actionTypeHrid) : '',
                        wearableItemMap: extractLoadoutWearableItemMap(loadout, maxByItem),
                    },
                    usedBy: [],
                };
                byId.set(loadoutId, entry);
            }
            entry.usedBy.push({ settingKey, settingSuffix });
        }

        // 稳定输出顺序：按 loadoutId 升序
        return [...byId.values()].sort((a, b) => a.loadoutId - b.loadoutId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ▼ Payload / Export
    // ═══════════════════════════════════════════════════════════════════════

    function buildPayload() {
        if (!state.character) return null;

        const skills = {};
        for (const [hrid, value] of state.skills.entries()) {
            skills[hrid.replace('/skills/', '')] = Number(value.level || 0);
        }

        const abilities = {};
        for (const [hrid, ability] of state.abilities.entries()) {
            abilities[hrid.replace('/abilities/', '')] = {
                level: Number(ability.level || 0),
                slotNumber: Number(ability.slotNumber || 0),
            };
        }

        const auras = {};
        for (const [label, hrid] of Object.entries(AURA_MAP)) {
            auras[label] = Number(state.abilities.get(hrid)?.level || 0);
        }

        const labyrinthLoadouts = collectLabyrinthLoadouts();
        const houseRoomLevels = collectHouseRoomLevels();
        const achievements = collectAchievementCompletion();

        return {
            schemaVersion: 3,
            scriptVersion: SCRIPT_VERSION,
            character: { ...state.character },
            skills,
            abilities,
            auras,
            labyrinthLoadouts,
            houseRoomLevels,
            achievements,
            capturedAt: new Date().toISOString(),
            source: location.hostname,
        };
    }

    function downloadJSON(filename, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
    }

    // 输出格式：仍是数组（一个成员一项），字段命名与公会版对齐；
    // 但用 labyrinthLoadouts 取代 wearableItemMap —— 后者是"身上当前装备"，
    // 需求明确要求忽略；前者才是迷宫真正会用的所有配装。
    // 与 buildMembersPayloadForBridge 共用同一份 profile 构造（JSON 下载 / 直送计算器只是出口不同）。
    function exportJsonData() {
        if (trialEndState.silenced) { alert('本周试炼已结束，脚本已静默（如需恢复请在控制台执行 __KUNPO.resume()）。'); return; }
        refreshLoadoutStatus();
        const members = buildMembersPayloadForBridge();
        if (!members) {
            setStatus('尚未读取人物', 'error');
            alert('请先进入游戏，等待人物数据加载完成后再导出。');
            return;
        }
        const payload = buildPayload();
        const loadouts = Array.isArray(payload.labyrinthLoadouts) ? payload.labyrinthLoadouts : [];
        const houseCount = Object.keys(payload.houseRoomLevels || {}).length;
        const achievementCount = Object.keys(payload.achievements || {}).length;
        const safeName = (payload.character.name || 'self').replace(/[\\/:*?"<>|]/g, '_');
        const dateStr = new Date().toISOString().slice(0, 10);
        const filename = `MWI_迷宫配装_${safeName}_${dateStr}.json`;
        downloadJSON(filename, members);
        setStatus(`已导出 ${safeName}（${loadouts.length} 套配装 / ${houseCount} 房间 / ${achievementCount} 成就）`, 'good');
    }

    // ── 直送试炼计算器 ────────────────────────────────────────────────────
    // 与迷宫胜率计算器的 simulator bridge 同款思路：
    //   members JSON → base64url 编码 → 拼成 计算器URL#mwiImport=<encoded> → window.open。
    // index.html 端在 init() 里解析 hash、走与"导入 JSON"相同的合并逻辑，并清掉 hash。
    // base64url：把 base64 的 +/ 换成 -_、去掉结尾 =，保证放进 URL 无需再转义。
    function encodeImportPayload(members) {
        const json = JSON.stringify(members);
        const bytes = new TextEncoder().encode(json);
        let binary = '';
        const CHUNK = 0x8000;
        for (let i = 0; i < bytes.length; i += CHUNK) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function getCalculatorUrl() {
        try {
            const saved = readCfg(CALC_URL_STORAGE_KEY);
            if (saved && /^https?:\/\//.test(saved)) return saved;
        } catch (_) { /* ignore */ }
        return decodeCalcDefaultUrl();
    }

    function setCalculatorUrl() {
        const current = getCalculatorUrl();
        const input = prompt(
            '试炼计算器页面地址（http(s)://，留空恢复默认 GitHub Pages 地址）：',
            current
        );
        if (input === null) return;
        const trimmed = String(input).trim();
        try {
            if (!trimmed) {
                clearCfg(CALC_URL_STORAGE_KEY);
                setStatus('已恢复默认计算器地址', 'good');
                return;
            }
            if (!/^https?:\/\//.test(trimmed)) {
                setStatus('地址必须是 http(s):// 开头', 'error');
                return;
            }
            writeCfg(CALC_URL_STORAGE_KEY, trimmed);
            setStatus('计算器地址已保存', 'good');
        } catch (_) {
            setStatus('保存失败', 'error');
        }
    }

    // 检查 SKILL_LABELS 中的每个技能是否都已配置了迷宫配装
    function findMissingSkillLoadouts(labyrinthLoadouts) {
        if (!Array.isArray(labyrinthLoadouts) || labyrinthLoadouts.length === 0) {
            return [...SKILL_LABELS_CN];
        }
        const usedSuffixes = new Set();
        for (const entry of labyrinthLoadouts) {
            if (!entry || !Array.isArray(entry.usedBy)) continue;
            for (const u of entry.usedBy) {
                if (u && u.settingSuffix) usedSuffixes.add(String(u.settingSuffix));
            }
        }
        const missing = [];
        for (let i = 0; i < SKILL_LABELS.length; i++) {
            if (!usedSuffixes.has(SKILL_LABELS[i])) missing.push(SKILL_LABELS_CN[i]);
        }
        return missing;
    }

    function formatMissingStatus(missing) {
        if (!missing || missing.length === 0) return '';
        if (missing.length === 1) return missing[0] + '配装为空';
        if (missing.length <= 4) return missing.join('、') + '配装为空';
        return missing.slice(0, 4).join('、') + '等' + missing.length + '项配装为空';
    }

    function hasEntries(value) {
        if (!value) return false;
        if (value instanceof Map) return value.size > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return false;
    }

    // 检查当前 labyrinthLoadouts 并把缺失情况反映到右下角状态按钮
    function refreshLoadoutStatus() {
        if (trialEndState.silenced) return [];
        if (!state.dataReady || !state.character) {
            setStatus('等待人物数据', 'idle');
            return [];
        }
        // React 游戏状态尚未挂载完成时，不要误报所有配装为空
        const gs = getGameState();
        if (gs == null) {
            setStatus('等待游戏状态', 'idle');
            return [];
        }
        const loadouts = collectLabyrinthLoadouts();
        if (loadouts.length > 0) {
            state.loadoutDataSeen = true;
        }
        const allMissing = loadouts.length === 0;
        const withinGrace = !state.loadoutDataSeen && (Date.now() - state.loadoutCheckStartTime < 8000);
        if (allMissing && withinGrace) {
            setStatus('等待配装数据', 'idle');
            return SKILL_LABELS_CN.slice();
        }
        const missing = findMissingSkillLoadouts(loadouts);
        if (missing.length > 0) {
            setStatus(formatMissingStatus(missing), 'error');
        } else {
            const roleInfo = guildRoleInfo(gs);
            const roleText = roleInfo.known ? (roleInfo.name || roleInfo.role) : '—';
            setStatus(`${state.character.name} 数据就绪，当前职位：${roleText}`, 'good');
        }
        updateMeritButton();   // 状态行每秒刷新，顺带修正《功德+1》显隐（WS 可能早于 UI 挂载）
        updateClickCountLine(); // 顺带刷新操作计数行
        return missing;
    }

    function buildMembersPayloadForBridge() {
        const payload = buildPayload();
        if (!payload) return null;
        const loadouts = Array.isArray(payload.labyrinthLoadouts) ? payload.labyrinthLoadouts : [];
        if (loadouts.length === 0) {
            console.warn('[MWI Export Single] 未在 characterSetting 里读到任何 labyrinthLoadout*，请确认已在迷宫界面为至少一间房配好过装备。');
        }
        return [{
            sharableCharacter: {
                name: payload.character.name,
                gameMode: payload.character.gameMode,
            },
            characterSkills: Object.entries(payload.skills).map(([k, v]) => ({
                skillHrid: '/skills/' + k,
                level: v,
            })),
            // 光环等级（AURA_MAP label → 等级）：与「试炼显示在游戏内」同源方法，
            // 从游戏 WebSocket 的 characterAbilities 中按 AURA_MAP hrid 提取等级。
            auras: payload.auras || {},
            // 刻意不导出 wearableItemMap（当前身上装备）
            labyrinthLoadouts: loadouts,
            houseRoomLevels: payload.houseRoomLevels || {},
            achievements: payload.achievements || {},
            _source: 'self',
            _capturedAt: payload.capturedAt,
        }];
    }

    function sendToCalculator() {
        if (trialEndState.silenced) { alert('本周试炼已结束，脚本已静默（如需恢复请在控制台执行 __KUNPO.resume()）。'); return; }
        const missing = refreshLoadoutStatus();
        const members = buildMembersPayloadForBridge();
        if (!members) {
            setStatus('尚未读取人物', 'error');
            alert('请先进入游戏，等待人物数据加载完成后再导出。');
            return;
        }
        let encoded;
        try {
            encoded = encodeImportPayload(members);
        } catch (error) {
            console.error('[MWI Export Single] 编码失败，退回 JSON 下载：', error);
            exportJsonData();
            return;
        }
        if (encoded.length > MAX_IMPORT_URL_PAYLOAD_LENGTH) {
            console.warn(`[MWI Export Single] 编码后 ${encoded.length} 字符超过 URL 上限，退回 JSON 下载。`);
            exportJsonData();
            return;
        }
        const base = getCalculatorUrl();
        const sep = base.includes('#') ? '&' : '#';
        const url = base + sep + IMPORT_HASH_PARAM + '=' + encoded;
        window.open(url, '_blank', 'noopener,noreferrer');
        setStatus('已发送到试炼计算器', 'good');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ▼ 上传配装：直接把本人最新数据合并进共享空间 JSON 并 PUT 回去
    //   与 index.html 的「上传」同口径，只是跳过计算器页面：
    //     1) GET latest → 解密得 { guild, members, trials, plan, ... }
    //     2) 用当前游戏数据构造本人这条 member（结构对齐 index.html 的 member）
    //     3) 按 name 合并：已存在 → 沿用原 id，只覆盖本人可提供的字段；不存在 → 追加 max(id)+1
    //     4) 其它成员 / trials / plan / guild / 其它顶层字段原样保留
    //     5) gzip + AES-GCM 加密 → PUT 回同一个 bin
    // ═══════════════════════════════════════════════════════════════════════
    function masterKey() {
        try { return String(readCfg(K_MASTER_KEY) || '').trim(); } catch (_) { return ''; }
    }
    function profileToMember(profile) {
        const name = (profile && profile.sharableCharacter && profile.sharableCharacter.name) || '';
        if (!name) return null;
        const skillMap = {};
        for (const s of (profile.characterSkills || [])) {
            if (s && s.skillHrid) skillMap[String(s.skillHrid).replace('/skills/', '')] = Number(s.level || 0);
        }
        return {
            name: name,
            levels: SKILL_KEYS.map(k => skillMap[k] || 0),
            equipment: {},
            loadouts: Array.isArray(profile.labyrinthLoadouts) ? profile.labyrinthLoadouts : [],
            houseRoomLevels: profile.houseRoomLevels || {},
            achievements: profile.achievements || {},
            // 光环等级（AURA_MAP label → 等级）：随上传一并写入云端共享空间
            auras: (profile.auras && typeof profile.auras === 'object') ? profile.auras : {},
        };
    }
    async function uploadLoadoutsToServer() {
        // 上传配装不受试炼结束静默限制：静默只停“读取/提示”类逻辑，
        // 上传走的是已缓存数据 + 云端读写，与本周排刀是否结束无关。
        refreshLoadoutStatus();
        const members = buildMembersPayloadForBridge();
        if (!members || !members[0]) {
            setStatus('尚未读取人物', 'error');
            alert('请先进入游戏，等待人物数据加载完成后再上传。');
            return;
        }
        const cfg = assignmentConfig();
        if (!cfg) {
            setStatus('地址缺少 bin/pwd', 'error');
            alert('请先在「⚙ 设置」里填写正确的 JSON 获取地址（需含 bin 与 pwd）。');
            return;
        }
        setStatus('正在读取云端数据…', 'idle');
        try {
            const key = await deriveKey(cfg.password, cfg.guild);
            const remote = await cloudFetchRecord(cfg, key);
            const me = profileToMember(members[0]);
            if (!me) throw new Error('无法解析本人数据');
            const list = Array.isArray(remote.members) ? remote.members.slice() : [];
            const myName = String(me.name).trim();
            const idx = list.findIndex(p => p && String(p.name || '').trim() === myName);
            const maxId = list.reduce((mx, p) => Math.max(mx, Number(p && p.id) || 0), -1);
            const prev = idx >= 0 ? list[idx] : {};
            // 只覆盖本人可提供的字段；id / actionTypeBuffs / 各类 buff dict 沿用远端原值
            const next = Object.assign({}, prev, me, { _ts: Date.now() });
            next.id = (prev && prev.id != null) ? prev.id : (maxId + 1);
            delete next.achievementsValue;              // 用本次抓取的原始成就表重新现算
            delete next.achievementActionTypeBuffsDict;
            if (idx >= 0) list[idx] = next; else list.push(next);
            const merged = Object.assign({}, remote, { members: list }); // guild / trials / plan 原样保留
            const rec = await encryptRecord(JSON.stringify(merged), key);
            setStatus('正在上传…', 'idle');
            await cloudPutRecord(cfg, rec);
            // 上传成功后：本次「GET + 合并本人数据」得到的 merged 即云端当前值。
            // 写回记录缓存，使提示行数据状态从「未拉取」变为「已缓存」；
            // 否则 cloudPutRecord 内部的 invalidate 会让缓存为空、状态栏一直显示未拉取。
            cloudRecordCache.data = merged;
            cloudRecordCache.fetchedAt = Date.now();
            cloudRecordCache.sig = cloudRecordSig(cfg);
            resetAuraServerCache();   // 云端已更新 → 光环那份缓存作废，下次进队伍页面重新拉
            setStatus('已上传：' + myName + '（' + (me.loadouts || []).length + ' 套配装）', 'good');
            showAssignmentToast('配装已上传到共享空间');
            // 记录上传时间并刷新面板上的提示行（周四当天上传后提醒自动消失）
            try { writeCfg(K_LAST_UPLOAD, String(Date.now())); } catch (_) {}
            updateIntroLine();
        } catch (e) {
            const msg = (e && e.message) ? e.message : String(e);
            setStatus('上传失败：' + msg, 'error');
            console.error('[KUNPO] 上传失败：', e);
            alert('上传失败：' + msg);
        }
    }

    // GM_registerMenuCommand('设置试炼计算器页面地址（必须！！！）', setCalculatorUrl);
    // GM_registerMenuCommand('显示排刀（读取共享空间排刀）', () => { void refreshAssignment({ force: true }); });
    // GM_registerMenuCommand('检查脚本更新', () => { void checkForUpdate({ force: true }); });
    //GM_registerMenuCommand('发送到试炼计算器', sendToCalculator);
    //GM_registerMenuCommand('导出当前角色全部迷宫配装到 JSON', exportJsonData);

    hookWebSocketMessages();

    function cleanupStatusPolling() {
        if (state.statusPollInterval) {
            clearInterval(state.statusPollInterval);
            state.statusPollInterval = null;
        }
        clearTimeout(assignmentState.timer);
        if (assignmentState.pollTimer) { clearInterval(assignmentState.pollTimer); assignmentState.pollTimer = null; }
        if (assignmentState.observer) { assignmentState.observer.disconnect(); assignmentState.observer = null; }
    }

    // ── 排刀：加密/解密（与 index.html 完全一致）──────────────────────
    async function deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    }
    function bytesToBase64(bytes) {
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        return btoa(bin);
    }
    function base64ToBytes(b64) {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
    }
    async function decryptBytes(b64, key) {
        const combined = base64ToBytes(b64);
        const iv = combined.slice(0, 12);
        const ct = combined.slice(12);
        return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
    }
    async function gunzipBytes(bytes) {
        if (typeof DecompressionStream === 'undefined') return bytes;
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(bytes); writer.close();
        const ab = await new Response(ds.readable).arrayBuffer();
        return new Uint8Array(ab);
    }
    async function decryptRecord(rec, key) {
        const bytes = await decryptBytes(rec.d, key);
        const gz = await gunzipBytes(bytes);
        return new TextDecoder().decode(gz);
    }
    // ── 加密上传（与 index.html 的 gzip + AES-GCM 完全一致）──────────────
    async function gzipBytes(bytes) {
        if (typeof CompressionStream === 'undefined') return bytes;
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(bytes); writer.close();
        const ab = await new Response(cs.readable).arrayBuffer();
        return new Uint8Array(ab);
    }
    async function encryptBytes(bytes, key) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
        const combined = new Uint8Array(iv.length + ct.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ct), iv.length);
        return bytesToBase64(combined);
    }
    async function encryptRecord(text, key) {
        const bytes = new TextEncoder().encode(text);
        const gz = await gzipBytes(bytes);
        const d = await encryptBytes(gz, key);
        return { d };
    }
    // 状态码 0 = 请求在网络层就失败（没有 HTTP 响应）。这里细分原因并打
    // console 日志，避免“静默拦截”无处排查；reason 供上层生成可读提示。
    //   'timeout'：超时（网络慢 / jsonbin 不可达）
    //   'network'：连接失败（断网 / 被墙 / 拦截扩展）
    //   'fetch'  ：未走 GM_xmlhttpRequest 而回退 fetch，被浏览器跨域策略拦截
    function httpLog(method, url, res) {
        if (res.status !== 0) return res;
        console.warn('[KUNPO] ' + method + ' ' + url + ' 失败：'
            + (res.reason === 'timeout' ? '请求超时'
                : res.reason === 'fetch' ? 'fetch 回退被跨域拦截（GM_xmlhttpRequest 不可用，请确认脚本经 Tampermonkey/Violentmonkey 安装且未被禁用）'
                : '网络错误（断网 / 无法连接 / 被拦截）')
            + (res.detail ? '；detail: ' + res.detail : ''));
        return res;
    }
    // 跨域 PUT：优先 GM_xmlhttpRequest，回退 fetch。
    function httpPut(url, body, headers) {
        return new Promise((resolve) => {
            const finish = (res) => resolve(httpLog('PUT', url, res));
            const gm = typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest : (typeof GM !== 'undefined' && GM.xmlHttpRequest ? GM.xmlHttpRequest : null);
            if (gm) {
                gm({
                    method: 'PUT',
                    url,
                    headers: headers || {},
                    data: body,
                    timeout: 35000,
                    onload: (r) => finish({ status: r.status, responseText: r.responseText }),
                    onerror: (e) => finish({ status: 0, responseText: '', reason: 'network', detail: (e && e.error) || '' }),
                    ontimeout: () => finish({ status: 0, responseText: '', reason: 'timeout' }),
                });
            } else {
                fetch(url, { method: 'PUT', headers: headers || {}, body })
                    .then(r => r.text().then(t => finish({ status: r.status, responseText: t })))
                    .catch((e) => finish({ status: 0, responseText: '', reason: 'fetch', detail: (e && e.message) || '' }));
            }
        });
    }
    // 跨域 GET：优先 GM_xmlhttpRequest，回退 fetch。headers 可选（COS 通道需要 X-Auth）。
    function httpGet(url, headers) {
        return new Promise((resolve) => {
            const finish = (res) => resolve(httpLog('GET', url, res));
            const gm = typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest : (typeof GM !== 'undefined' && GM.xmlHttpRequest ? GM.xmlHttpRequest : null);
            if (gm) {
                gm({
                    method: 'GET',
                    url,
                    headers: headers || {},
                    timeout: 35000,
                    onload: (r) => finish({ status: r.status, responseText: r.responseText }),
                    onerror: (e) => finish({ status: 0, responseText: '', reason: 'network', detail: (e && e.error) || '' }),
                    ontimeout: () => finish({ status: 0, responseText: '', reason: 'timeout' }),
                });
            } else {
                fetch(url, { headers: headers || {} }).then(r => r.text().then(t => finish({ status: r.status, responseText: t })))
                    .catch((e) => finish({ status: 0, responseText: '', reason: 'fetch', detail: (e && e.message) || '' }));
            }
        });
    }
    // 跨域 POST：优先 GM_xmlhttpRequest，回退 fetch（COS 通道用 POST 写对象）。
    function httpPost(url, body, headers) {
        return new Promise((resolve) => {
            const finish = (res) => resolve(httpLog('POST', url, res));
            const gm = typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest : (typeof GM !== 'undefined' && GM.xmlHttpRequest ? GM.xmlHttpRequest : null);
            if (gm) {
                gm({
                    method: 'POST',
                    url,
                    headers: headers || {},
                    data: body,
                    timeout: 35000,
                    onload: (r) => finish({ status: r.status, responseText: r.responseText }),
                    onerror: (e) => finish({ status: 0, responseText: '', reason: 'network', detail: (e && e.error) || '' }),
                    ontimeout: () => finish({ status: 0, responseText: '', reason: 'timeout' }),
                });
            } else {
                fetch(url, { method: 'POST', headers: headers || {}, body })
                    .then(r => r.text().then(t => finish({ status: r.status, responseText: t })))
                    .catch((e) => finish({ status: 0, responseText: '', reason: 'fetch', detail: (e && e.message) || '' }));
            }
        });
    }
    // 从计算器地址解析 guild/bin/pwd（与 index.html 共享空间一致）。
    function assignmentConfig() {
        let url;
        try { url = new URL(getCalculatorUrl()); } catch { return null; }
        const guild = url.searchParams.get('guild') || 'KUNPO';
        const binId = url.searchParams.get('bin');
        const pwd = url.searchParams.get('pwd');
        if (!binId || !pwd) return null;
        return { guild, binId, password: pwd };
    }

    // ── 统一的云端读写 ─────────────────────────────────────────────────
    // 上层（上传配装 / 拉取排刀）只调 cloudFetchRecord / cloudPutRecord，
    // 不关心当前走的是 COS 还是 jsonbin。
    function cloudNetError(op, resp, cfg) {
        const host = useCosBackend(cfg) ? getCosApiBase() : 'api.jsonbin.io';
        return op + '失败：网络层无响应（'
            + (resp.reason === 'timeout' ? '请求超时，' + host + ' 暂不可达'
                : resp.reason === 'fetch' ? 'fetch 被跨域拦截，请确认脚本经 Tampermonkey/Violentmonkey 安装且未被禁用'
                : '无法连接 ' + host + '，请检查网络/代理/拦截扩展')
            + '，详情见控制台）';
    }
    // ── 云端记录缓存（排刀 / 光环 / 上传共用同一份）──────────────────────
    // 「拉取排刀」拿到的其实是整份记录（含 members），缓存下来后光环那路直接复用，
    // 不必再发一次请求。上传成功后立即作废，避免读到自己写入前的旧数据。
    const cloudRecordCache = { data: null, fetchedAt: 0, sig: '', inFlight: null, inFlightSig: '' };
    function cloudRecordSig(cfg) {
        return String(cfg.guild || '') + '/' + String(cfg.binId || '');
    }
    function invalidateCloudRecordCache() {
        cloudRecordCache.data = null;
        cloudRecordCache.fetchedAt = 0;
        cloudRecordCache.sig = '';
    }
    // 读取云端 → 解密 → 返回 JSON.parse 后的对象。
    // opts.cacheTtl > 0：优先复用缓存（毫秒内）；不传则每次真拉（上传前的读取必须拿最新）。
    async function cloudFetchRecord(cfg, key, opts) {
        const ttl = (opts && opts.cacheTtl) || 0;
        const sig = cloudRecordSig(cfg);
        if (ttl > 0 && cloudRecordCache.data && cloudRecordCache.sig === sig
            && Date.now() - cloudRecordCache.fetchedAt < ttl) {
            return cloudRecordCache.data;
        }
        // 同一地址并发时复用同一个请求：启动瞬间排刀与光环同时要数据时只发一次
        if (cloudRecordCache.inFlight && cloudRecordCache.inFlightSig === sig) {
            return cloudRecordCache.inFlight;
        }
        const p = (async function () {
            const data = await cloudFetchRecordRaw(cfg, key);
            cloudRecordCache.data = data;
            cloudRecordCache.fetchedAt = Date.now();
            cloudRecordCache.sig = sig;
            // 拉到数据后：尝试补齐「上次上传时间」的一次性迁移，并刷新面板提示行
            // （面板可能一直开着，不主动刷的话「未拉取」会一直挂着）
            try { seedLastUploadFromCache(); updateIntroLine(); } catch (_) {}
            return data;
        })().finally(function () { cloudRecordCache.inFlight = null; });
        cloudRecordCache.inFlight = p;
        cloudRecordCache.inFlightSig = sig;
        return p;
    }
    // 真正的网络读取（不带缓存）
    async function cloudFetchRecordRaw(cfg, key) {
        if (useCosBackend(cfg)) {
            if (!getCosApiBase()) throw new Error('未配置云函数地址：请点「⚙ 设置」填写「云函数地址」');
            const resp = await httpGet(cosGetUrl(cfg), { 'X-Auth': getCosToken() });
            if (resp.status === 404) throw new Error('云端无数据（对象不存在）');
            if (resp.status !== 200 || !resp.responseText) {
                if (resp.status === 0) throw new Error(cloudNetError('读取云端', resp, cfg));
                throw new Error('读取云端失败 HTTP ' + resp.status
                    + (resp.responseText ? '：' + String(resp.responseText).slice(0, 120) : ''));
            }
            let j;
            try { j = JSON.parse(resp.responseText); } catch (_) { throw new Error('解析失败'); }
            j = unwrapScfResponse(j);
            if (!j || !j.record || !j.record.d) throw new Error('云端无数据');
            return JSON.parse(await decryptRecord(j.record, key));
        }
        const resp = await httpGet(BIN_BASE + '/' + cfg.binId + '/latest');
        if (resp.status !== 200 || !resp.responseText) {
            if (resp.status === 0) throw new Error(cloudNetError('读取云端', resp, cfg));
            throw new Error('读取云端失败 HTTP ' + resp.status);
        }
        const json = JSON.parse(resp.responseText);
        if (!json.record || !json.record.d) throw new Error('云端无数据');
        return JSON.parse(await decryptRecord(json.record, key));
    }
    // 写入云端（rec = { d } 密文）
    async function cloudPutRecord(cfg, rec) {
        const cos = useCosBackend(cfg);
        // 出错时先让控制台说清楚走的哪条通道、公会判定如何，便于一眼定位 403
        console.log('[KUNPO] 上传通道=' + (cos ? 'COS' : 'jsonbin')
            + ' guild=' + cfg.guild + ' bin=' + cfg.binId
            + ' guildRestricted=' + guildRestricted());
        try {
            await cloudPutRecordRaw(cfg, rec);
        } catch (e) {
            if (cos) {
                throw new Error('上传失败（COS 通道）：' + (e && e.message ? e.message : e)
                    + '\n\n若提示 HTTP 403：云函数拒绝了请求，通常是环境变量 MWI_AUTH 与脚本内置口令不一致，'
                    + '或函数 URL 的「授权类型」不是「开放」。');
            }
            throw new Error('上传失败（jsonbin 旧通道）：' + (e && e.message ? e.message : e)
                + '\n\n说明公会判定未通过（guildRestricted=' + guildRestricted()
                + '）才回退到 jsonbin，而 jsonbin 的 Access Key 无权限/额度已用尽。'
                + '请点「⚙ 设置」确认公会名与游戏内一致。');
        }
        invalidateCloudRecordCache();   // 已写入新版本，旧缓存作废
    }
    // 真正的网络写入（不带缓存处理）
    async function cloudPutRecordRaw(cfg, rec) {
        if (useCosBackend(cfg)) {
            if (!getCosApiBase()) throw new Error('未配置云函数地址：请点「⚙ 设置」填写「云函数地址」');
            const body = JSON.stringify({ action: 'put', guild: cfg.guild, bin: cfg.binId, d: rec.d });
            const put = await httpPost(getCosApiBase(), body, { 'Content-Type': 'application/json', 'X-Auth': getCosToken() });
            if (put.status < 200 || put.status >= 300) {
                if (put.status === 0) throw new Error(cloudNetError('上传', put, cfg));
                throw new Error('上传失败 HTTP ' + put.status
                    + (put.responseText ? '：' + String(put.responseText).slice(0, 120) : ''));
            }
            return;
        }
        const headers = { 'Content-Type': 'application/json' };
        // 上传凭证：优先用设置里填的 Master Key；
        // KUNPO 成员（共享地址 guild 为默认公会）未填时回退内置混淆 Access Key（仅 Bins Update 权限）。
        const mk = masterKey()
            || (cfg.guild === GUILD_DEFAULTS.name ? decodeAccessKey() : '');
        if (mk) headers['X-Master-Key'] = mk;
        const put = await httpPut(BIN_BASE + '/' + cfg.binId, JSON.stringify(rec), headers);
        if (put.status < 200 || put.status >= 300) {
            if (put.status === 0) throw new Error(cloudNetError('上传', put, cfg));
            throw new Error('上传失败 HTTP ' + put.status
                + (put.responseText ? '：' + String(put.responseText).slice(0, 120) : '')
                + (mk ? '' : '（若提示无权限，请在「⚙ 设置」里填写 Master Key）'));
        }
    }
    // noCache = true 时强制重新拉取（手动点「显示排刀」/ 改设置）；
    // 否则优先复用共享缓存——进入组队页面时光环那路已经拉过整份记录，这里就不必再请求一次。
    async function fetchPlan(noCache) {
        const cfg = assignmentConfig();
        if (!cfg) throw new Error('计算器地址缺少 bin/pwd');
        const key = await deriveKey(cfg.password, cfg.guild);
        const data = await cloudFetchRecord(cfg, key, noCache ? null : { cacheTtl: Infinity });
        if (!data || !data.plan) throw new Error('云端无排刀');
        return data.plan;
    }
    function memberEntry() {
        const plan = assignmentState.doc;
        const name = String((state.character && state.character.name) || '').trim();
        if (!plan || !plan.m || !name) return null;
        return { name, entry: plan.m[name] || null };
    }
    function maskToSlugs(mask) {
        const m = Number(mask) || 0;
        const out = [];
        for (let i = 0; i < BATTLE_TRIAL_SLUGS.length; i++) if (m & (1 << i)) out.push(BATTLE_TRIAL_SLUGS[i]);
        return out;
    }
    function combatAbilityIconUrl(slug) { return `${COMBAT_ABILITY_ICON_BASE}/${slug}.png`; }
    function combatAbilityName(slug) { return ABILITY_NAME_ZH[slug] || slug; }
    function battleTrialName(slug) { return BATTLE_TRIAL_ZH[String(slug)] || String(slug); }
    // 生活试炼：plan.k[试炼下标] = 技能下标（index.html 发布排刀时附带的 k 数组），转成中文技能名；
    // 旧排刀没有 k 时退回「生活试炼 #N」。
    function lifeTrialName(lifeIdx) {
        if (!Number.isInteger(lifeIdx) || lifeIdx < 0) return '生活未分配';
        const k = assignmentState.doc && assignmentState.doc.k;
        const skillIdx = Array.isArray(k) ? Number(k[lifeIdx]) : NaN;
        const name = (Number.isInteger(skillIdx) && skillIdx >= 0 && skillIdx < SKILL_LABELS_CN.length) ? SKILL_LABELS_CN[skillIdx] : '';
        return name || ('生活试炼 #' + (lifeIdx + 1));
    }
    // 卡片是否对应某试炼图标（游戏 SVG use 的 href/xlink:href 含 #trial_<slug>）。
    function cardMatchesSlug(card, slug) {
        if (!card) return false;
        const uses = card.querySelectorAll('use');
        for (const u of uses) {
            const href = u.getAttribute('href') || u.getAttribute('xlink:href') || u.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
            if (href.indexOf('trial_' + slug) >= 0) return true;
        }
        return false;
    }
    // 取本人生活试炼对应的技能 slug（如 'enhancing'）；无 plan.k 或未分配时返回 ''。
    function lifeSkillSlugOf(lifeIdx) {
        if (!Number.isInteger(lifeIdx) || lifeIdx < 0) return '';
        const k = assignmentState.doc && assignmentState.doc.k;
        const skillIdx = Array.isArray(k) ? Number(k[lifeIdx]) : NaN;
        if (!Number.isInteger(skillIdx) || skillIdx < 0 || skillIdx >= SKILL_KEYS.length) return '';
        return SKILL_KEYS[skillIdx];
    }
    // 生活试炼卡片：图标 use 的 href 末段（# 后）=== 技能 slug，或显式 data-trial-hrid 含该 slug；
    // 兜底用卡片文字包含中文技能名（如「强化」）。
    function cardMatchesSkill(card, skillSlug) {
        if (!card || !skillSlug) return false;
        const explicit = card.getAttribute('data-trial-hrid') || (card.dataset && card.dataset.trialHrid) || '';
        if (explicit && explicit.indexOf(skillSlug) >= 0) return true;
        const uses = card.querySelectorAll('use');
        for (const u of uses) {
            const href = u.getAttribute('href') || u.getAttribute('xlink:href') || u.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
            if (!href) continue;
            const iconKey = String(href.split('#').pop() || '').toLowerCase();
            if (iconKey === skillSlug) return true;
            if (href.toLowerCase().indexOf('/guild_skilling/' + skillSlug) >= 0) return true;
        }
        const zh = SKILL_LABELS_CN[SKILL_KEYS.indexOf(skillSlug)];
        if (zh && zh.length >= 2) {
            const text = String(card.textContent || '').toLowerCase();
            if (text.indexOf(zh.toLowerCase()) >= 0) return true;
        }
        return false;
    }
    function injectAssignmentStyle() {
        if (document.getElementById('kunpo-assignment-style')) return;
        const style = document.createElement('style');
        style.id = 'kunpo-assignment-style';
        style.textContent =
            '[data-kunpo-assignment="combat"]{position:relative;z-index:2;outline:3px solid #ffd60a!important;outline-offset:-3px;box-shadow:0 0 0 2px #ffd60a,0 0 22px #ffd60a88!important}' +
            '[data-kunpo-assignment="life"]{position:relative;z-index:2;outline:3px solid #30d158!important;outline-offset:-3px;box-shadow:0 0 0 2px #30d158,0 0 22px #30d15888!important}' +
            '.kunpo-assignment-badge{position:absolute;z-index:4;right:6px;top:6px;padding:3px 7px;border-radius:999px;background:#0a84ff;color:#fff;font:700 11px/1.2 system-ui,sans-serif;box-shadow:0 2px 8px #0008;pointer-events:none;white-space:nowrap}' +
            '.kunpo-assignment-badge.life{background:#30d158}' +
            '.kunpo-skill-panel{width:100%;box-sizing:border-box;margin:14px 0 4px;padding:12px 14px;border:1px solid #ff5a6499;border-left:4px solid #ff453a;border-radius:10px;background:linear-gradient(105deg,#25181dd9,#171a24e8);color:#f5f7ff;box-shadow:0 8px 20px #0005;font:600 12px/1.3 system-ui,sans-serif}' +
            '.kunpo-skill-panel-heading{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:9px}' +
            '.kunpo-skill-panel-heading strong{color:#ff737b;font-size:16px}' +
            '.kunpo-skill-panel-heading span{color:#c9cedd;font-size:11px}' +
            '.kunpo-skill-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}' +
            '.kunpo-skill-chip{display:flex;min-width:0;flex-direction:column;align-items:center;gap:2px;padding:7px 3px;border:1px solid #59647d;border-radius:7px;background:#252b3a;color:#f5f7ff;text-align:center}' +
            '.kunpo-skill-icon{width:34px;height:34px;object-fit:contain;display:block;flex:0 0 34px}' +
            '.kunpo-skill-chip small{color:#c9d4ff;font-size:10px}' +
            '.kunpo-skill-chip[data-slot="aura"]{border:2px solid #30d158;background:#16331f;box-shadow:0 0 9px #30d15899}' +
            '.kunpo-aura-holder-note{margin:9px 0 2px;padding:8px 10px;border:1px solid #ffd60a99;border-left:4px solid #ffd60a;border-radius:7px;background:#33290dd9;color:#ffe14d;font:700 12px/1.45 system-ui,sans-serif}' +
            '.kunpo-aura-insanity-note{margin:9px 0 2px;padding:8px 10px;border:1px solid #ffb34099;border-left:4px solid #ffb340;border-radius:7px;background:#33280fdd;color:#ffb340;font:700 12px/1.45 system-ui,sans-serif}' +
            '.kunpo-aura-holder-note + .kunpo-aura-insanity-note{margin-top:6px}' +
            '@media(max-width:760px){.kunpo-skill-grid{gap:3px}.kunpo-skill-chip{padding:5px 2px;font-size:10px}.kunpo-skill-icon{width:28px;height:28px;flex-basis:28px}}';
        document.head.appendChild(style);
    }
    function clearAssignmentUi() {
        document.querySelectorAll('[data-kunpo-assignment="combat"],[data-kunpo-assignment="life"]').forEach(n => delete n.dataset.kunpoAssignment);
        document.querySelectorAll('.kunpo-assignment-badge,.kunpo-skill-panel').forEach(n => n.remove());
    }
    function buildSkillChip(slug, slot, label) {
        const chip = document.createElement('span');
        chip.className = 'kunpo-skill-chip';
        if (slot === 'aura') chip.dataset.slot = 'aura';
        const icon = document.createElement('img');
        icon.className = 'kunpo-skill-icon';
        icon.src = combatAbilityIconUrl(slug);
        icon.alt = combatAbilityName(slug);
        icon.loading = 'eager';
        icon.decoding = 'async';
        icon.addEventListener('error', () => { icon.hidden = true; });
        chip.appendChild(icon);
        const lbl = document.createElement('span');
        lbl.textContent = label + '·' + combatAbilityName(slug);
        chip.appendChild(lbl);
        const lv = document.createElement('small');
        lv.textContent = '';
        chip.appendChild(lv);
        return chip;
    }
    function renderSkillPanel(anchorCard, prof, skills, fixedAuraSlug) {
        const anchor = anchorCard && anchorCard.parentElement;
        const host = anchor && anchor.parentElement;
        if (!host || !anchor) return false;
        const panel = document.createElement('section');
        panel.className = 'kunpo-skill-panel';
        panel.setAttribute('aria-label', '本周战斗技能');
        const heading = document.createElement('div');
        heading.className = 'kunpo-skill-panel-heading';
        const title = document.createElement('strong');
        title.textContent = '本周战斗技能';
        const sub = document.createElement('span');
        sub.textContent = prof ? ('职业：' + prof + ' · 按从左到右顺序携带') : '按从左到右顺序携带';
        heading.append(title, sub);
        // 光环持有者提示（fixedAuraSlug 非空 = 光环来自光环设置，单独固定）
        const holderNote = document.createElement('div');
        holderNote.className = 'kunpo-aura-holder-note';
        holderNote.textContent = '你是光环持有者！请将trigger删除！保证光环在冷却结束后立即使用！';
        // 疯狂提示：面板光环为疯狂时显示（来自职业技能配置或光环设置均可）
        const insanityNote = document.createElement('div');
        insanityNote.className = 'kunpo-aura-insanity-note';
        insanityNote.textContent = '疯狂trigger设置为我的当前HP>500';
        const grid = document.createElement('div');
        grid.className = 'kunpo-skill-grid';
        if (skills.a) grid.appendChild(buildSkillChip(skills.a, 'aura', '光环'));
        ['s1', 's2', 's3', 's4'].forEach(function (k) {
            if (skills[k]) grid.appendChild(buildSkillChip(skills[k], k, k.toUpperCase().replace('S', '技能')));
        });
        panel.append(heading);
        if (fixedAuraSlug) panel.appendChild(holderNote);
        if (skills.a === 'insanity') panel.appendChild(insanityNote);
        panel.appendChild(grid);
        host.insertAdjacentElement('afterend', panel);
        return true;
    }
    // opts.announce：true = 用户手动触发（必定提示）；false/缺省 = 自动重渲染（按节流规则静默）
    function renderAssignmentUi(opts) {
        if (!document.body) return;
        const announce = !!(opts && opts.announce);
        if (trialEndState.silenced) return;
        assignmentState.rendering = true;
        try {
            injectAssignmentStyle();
            clearAssignmentUi();
            const me = memberEntry();
            const cards = [...document.querySelectorAll(TRIAL_CARD_SELECTOR)];
            if (!me || !me.entry) {
                if (cards.length) announceAssignment('本周排刀里没有找到你的战斗试炼', announce);
                return;
            }
            const [lifeIdx, battleMask, prof] = me.entry;
            const slugs = maskToSlugs(battleMask);
            const lifeSlug = lifeSkillSlugOf(lifeIdx); // '' = 未分配或无 plan.k
            const lifeName = lifeTrialName(lifeIdx);
            let firstCard = null;
            let lifeMatched = false;
            cards.forEach(function (card) {
                const hit = slugs.filter(function (s) { return cardMatchesSlug(card, s); });
                if (hit.length) {
                    card.dataset.kunpoAssignment = 'combat';
                    card.querySelectorAll('.kunpo-assignment-badge').forEach(n => n.remove());
                    const badge = document.createElement('span');
                    badge.className = 'kunpo-assignment-badge';
                    badge.textContent = '请参加·' + hit.map(battleTrialName).join('/');
                    card.appendChild(badge);
                    if (!firstCard) firstCard = card;
                    return;
                }
                // 战斗卡片已命中就不再误判为生活；只有未命中战斗且 plan 给了生活技能时才高亮生活试炼。
                if (lifeSlug && cardMatchesSkill(card, lifeSlug)) {
                    card.dataset.kunpoAssignment = 'life';
                    card.querySelectorAll('.kunpo-assignment-badge').forEach(n => n.remove());
                    const badge = document.createElement('span');
                    badge.className = 'kunpo-assignment-badge life';
                    badge.textContent = '请参加·' + lifeName;
                    card.appendChild(badge);
                    lifeMatched = true;
                }
            });
            // 技能面板
            let skills = (assignmentState.doc && assignmentState.doc.s && prof) ? assignmentState.doc.s[prof] : null;
            // 光环设置：检测到当前 name 有单独的光环设置 → 光环技能固定为光环设置中的光环（覆盖职业技能配置）
            const myAura = (assignmentState.doc && assignmentState.doc.au) ? assignmentState.doc.au[me.name] : null;
            if (myAura) {
                skills = Object.assign({}, skills || {});
                skills.a = myAura;
            }
            if (firstCard && skills && (skills.a || skills.s1 || skills.s2 || skills.s3 || skills.s4)) {
                renderSkillPanel(firstCard, prof, skills, myAura);
            }
            announceAssignment('已高亮排刀：' + (slugs.length ? slugs.map(battleTrialName).join('、') : '无战斗') + ' / ' + lifeName + (lifeMatched ? '' : '（未匹配到生活卡片）'), announce);
        } finally {
            assignmentState.rendering = false;
        }
    }
    // 本会话是否已经成功拉过一次排刀。拉过就不再自动拉（不再有 5 分钟 / 2 分钟 TTL 轮询），
    // 只有手动点「显示排刀」或改设置（force: true）才会再发请求。
    function assignmentFresh() { return !!assignmentState.fetchedOnce; }
    async function refreshAssignment({ force = false } = {}) {
        if (trialEndState.silenced) return;
        if (guildBlocked()) { announceAssignment('当前公会不是 KUNPO，排刀高亮已停用', force); return; }
        const name = String((state.character && state.character.name) || '').trim();
        if (!name) { announceAssignment('等待读取游戏角色名', force); return; }
        if (!force && assignmentFresh()) {
            // 已拉过（命中缓存）：照常按缓存渲染并提示一次。
            // announceAssignment 内部会判断「是否在试炼界面」，所以其它场景不会乱弹。
            if (assignmentState.doc && document.querySelector(TRIAL_CARD_SELECTOR)) {
                renderAssignmentUi({ announce: true });
            } else if (!assignmentState.doc) {
                announceAssignment('排刀未发布', false);
            }
            return;
        }
        if (assignmentState.inFlight) return;
        assignmentState.inFlight = true;
        assignmentState.lastCharacterName = name;
        try {
            // force（手动点「显示排刀」/ 改设置）才绕过缓存重新拉；
            // 平时若光环那路已经拉过整份记录，这里直接读缓存，不再发请求。
            const plan = await fetchPlan(force);
            // 拉取成功即记「已拉过一次」；失败不记，下次进入试炼界面还能重试。
            assignmentState.fetchedOnce = true;
            // 过期判断（与 index.html 一致）
            const dl = plan && plan.t ? Date.parse(plan.t) : NaN;
            if (!Number.isFinite(dl) || Date.now() > dl) {
                assignmentState.doc = null;
                assignmentState.fetchedAt = Date.now();
                clearAssignmentUi();
                announceAssignment('排刀未发布', force);
                return;
            }
            assignmentState.doc = plan;
            assignmentState.fetchedAt = Date.now();
            renderAssignmentUi({ announce: force });
        } catch (e) {
            const msg = (e && e.message) ? e.message : String(e);
            // 「云端无排刀」= 数据确实拉到了，只是会长还没发布 → 记为已拉取，
            // 命中缓存时不会重复发请求，也不必每次进试炼界面都重复提示。
            const noPlan = /无排刀/.test(msg);
            if (noPlan) assignmentState.fetchedOnce = true;
            assignmentState.doc = null;
            assignmentState.fetchedAt = Date.now();
            clearAssignmentUi();
            announceAssignment(noPlan ? '排刀未发布' : ('读取排刀失败：' + msg), force);
        } finally {
            assignmentState.inFlight = false;
        }
    }
    function scheduleAssignmentRefresh(delay) {
        clearTimeout(assignmentState.timer);
        assignmentState.timer = setTimeout(() => { void refreshAssignment(); }, delay || 0);
    }
    function installAssignmentObserver() {
        if (assignmentState.observer || !document.body) return;
        assignmentState.observer = new MutationObserver(function () {
            if (assignmentState.rendering) return;
            // 「进入试炼界面」的检测必须放在 doc 判定之前：
            // 否则首次进入时还没有排刀数据（doc 为空）会被直接忽略，永远不触发拉取。
            const present = trialCardsPresent();
            const opened = present && !assignmentState.cardsPresent; // 刚进入试炼界面
            assignmentState.cardsPresent = present;
            if (!present) { lastAnnouncedText = ''; return; }        // 离开界面 → 下次进入再提示一次
            if (opened) {
                onEnterTrialPage();                                  // 进入即判定：结束→静默；否则拉取排刀
                if (trialEndState.silenced) return;
            }
            if (!assignmentState.doc) return;                        // 还没有排刀数据 → 只做进入检测，不做渲染
            clearTimeout(assignmentState.timer);
            // 只有「刚进入界面」那一次会提示；界面内的持续刷新一律静默重渲染。
            assignmentState.timer = setTimeout(function () { renderAssignmentUi({ announce: opened }); }, 250);
        });
        assignmentState.observer.observe(document.body, { childList: true, subtree: true });
    }
    function initAssignment() {
        installAssignmentObserver();
        // 启动/刷新网页不再拉取，只有用户真正到对应界面才拉：
        //   ① 首次进入试炼界面（MutationObserver → onEnterTrialPage → refreshAssignment）
        //   ② 「光环推荐」开启时进入组队页面（syncAuraRecoInfo → refreshAuraServerData）
        // 两条路都在真正需要时才发请求，且共用 cloudRecordCache：
        // 谁先拉到，另一个就只读缓存，本会话最多一次网络请求（手动点「显示排刀」除外）。
    }
    // 轻量 toast：不依赖面板，3 秒自动消失。
    let assignmentToastTimer = null;
    function showAssignmentToast(text, duration) {
        let el = document.getElementById('kunpo-assignment-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'kunpo-assignment-toast';
            el.style.cssText = 'position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:2147483647;padding:8px 14px;border-radius:8px;background:rgba(20,26,44,.95);color:#eef3ff;border:1px solid #6f9bd8;font:600 12px/1.4 system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.4);pointer-events:none;max-width:90vw;white-space:pre-wrap;text-align:center';
            document.body.appendChild(el);
        }
        el.textContent = text;
        clearTimeout(assignmentToastTimer);
        assignmentToastTimer = setTimeout(() => { if (el) el.remove(); }, duration || 3500);
    }
    // 提示节流：
    //   force=true（用户手动点按钮/菜单）→ 必定提示；
    //   否则只在「试炼页面已打开」且「文案与上次不同」时提示一次。
    //   lastAnnouncedText 在离开试炼页面时清空，下次打开页面会再提示一次。
    let lastAnnouncedText = '';
    function trialCardsPresent() { return !!document.querySelector(TRIAL_CARD_SELECTOR); }
    function announceAssignment(text, force) {
        if (force) {
            lastAnnouncedText = String(text || '');
            showAssignmentToast(text);
            return;
        }
        if (!trialCardsPresent()) return;      // 没打开试炼页面 → 不打扰
        if (String(text || '') === lastAnnouncedText) return; // 同一条内容只提示一次
        lastAnnouncedText = String(text || '');
        showAssignmentToast(text);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ══ 公会校验：非 KUNPO 公会 → K 面板顶部显示提醒，并停用排刀高亮 ══════
    // 数据来源：GameState 的 guild.name / guild.id，或 guildCharacterDict 里的 guildID
    // （实测 KUNPO 的 guildID = 2515，可用 __KUNPO.guildInfo() 核对）。
    // ═══════════════════════════════════════════════════════════════════════
    // （GUILD_DEFAULTS / guildConfig / 各存储键 / TEAM_DOC_DEFAULT_URL_ENC 已集中到
    //   文件顶部「用户可配置区」，此处只保留读写逻辑。）
    // ── 按角色名隔离配置：同一台电脑上 角色1→公会1、角色2→公会2、角色3→公会3 ──
    //   存储键 = 原键 + '::角色名'；没读到角色专属值时回退到旧的全局值，再回退默认值。
    function currentCharacterName() {
        return String((state.character && state.character.name) || '').trim();
    }
    function cfgKey(base) {
        const n = currentCharacterName();
        return n ? (base + '::' + n) : base;
    }
    function readCfg(base) {
        try {
            const per = localStorage.getItem(cfgKey(base));
            if (per !== null) return per;
            return localStorage.getItem(base);          // 兼容升级前的全局配置
        } catch (_) { return null; }
    }
    function writeCfg(base, value) {
        try { localStorage.setItem(cfgKey(base), String(value)); } catch (_) {}
    }
    function clearCfg(base) {
        try {
            localStorage.removeItem(cfgKey(base));
            localStorage.removeItem(base);
        } catch (_) {}
    }
    // 公会 ID 允许为空（此时只用公会名匹配）
    function loadGuildConfig() {
        try {
            const n = readCfg(K_GUILD_NAME);
            guildConfig.name = (n && String(n).trim()) ? String(n).trim() : GUILD_DEFAULTS.name;
            const raw = readCfg(K_GUILD_ID);
            const v = Number(String(raw == null ? '' : raw).trim());
            guildConfig.id = (raw !== null && String(raw).trim() !== '' && Number.isInteger(v) && v >= 0) ? v : 0;
        } catch (_) {
            guildConfig.name = GUILD_DEFAULTS.name;
            guildConfig.id = 0;
        }
    }
    loadGuildConfig();
    const guildGate = { known: false, ok: true, name: '', id: 0, warned: false };
    function detectedGameGuild(gs) {
        let name = '', id = 0;
        try {
            const g = gs && gs.guild;
            if (g && typeof g === 'object') {
                name = String(g.name ?? g.guildName ?? '');
                id = Number(g.id ?? g.guildID ?? g.guildId ?? 0);
            }
            if (!name) name = String((gs && gs.guildName) || '');
            if (!Number.isFinite(id) || id <= 0) {
                const chars = gs && (gs.guildCharacterDict || gs.guildCharacterMap);
                const rows = chars instanceof Map ? [...chars.values()] : Object.values(chars || {});
                for (const r of rows) {
                    const gid = Number(r && (r.guildID ?? r.guildId));
                    if (Number.isInteger(gid) && gid > 0) { id = gid; break; }
                }
            }
        } catch (_) {}
        return { name: name, id: Number.isFinite(id) ? id : 0 };
    }
    function isKunpoGuild(g) {
        if (!g) return false;
        const wantName = String(guildConfig.name || '').trim().toUpperCase();
        if (wantName && String(g.name || '').trim().toUpperCase() === wantName) return true;
        const wantId = Number(guildConfig.id) || 0;
        return wantId > 0 && Number(g.id) === wantId;
    }
    function showGuildWarning(text) {
        const panel = state.panelEl;
        if (!panel) return;
        let box = document.getElementById('kunpo-guild-warning');
        if (!box) {
            box = document.createElement('div');
            box.id = 'kunpo-guild-warning';
            box.style.cssText = 'margin:0 0 9px 0;padding:7px 9px;border:1px solid #ff5a6499;border-left:4px solid #ff453a;'
                + 'border-radius:8px;background:rgba(255,69,58,.14);color:#ffd7d9;font:600 11.5px/1.4 system-ui,sans-serif';
            panel.insertBefore(box, panel.firstChild);
        }
        box.textContent = text;
        clampPanelToViewport();     // 警告条插入会让面板变高，重新钳制避免底部被截断
    }
    function clearGuildWarning() {
        const box = document.getElementById('kunpo-guild-warning');
        if (box && box.parentNode) box.parentNode.removeChild(box);
    }
    function updateGuildGate(gs) {
        loadGuildConfig();               // 角色名此时才确定 → 重新按角色读取配置
        setClickCounter(clickCountEnabled()); // 角色名此时才确定 → 按角色恢复/刷新操作计数（修复刷新后失效）
        updateMeritButton();             // 会长/将军 → 显示《功德+1》（放在所有提前 return 之前）
        const g = detectedGameGuild(gs);
        if (!g.name && !g.id) return;          // 还没读到公会信息 → 保持放行
        guildGate.known = true;
        guildGate.name = g.name;
        guildGate.id = g.id;
        guildGate.ok = isKunpoGuild(g);
        if (guildGate.ok && !guildNameMismatch()) {
            clearGuildWarning(); guildGate.warned = false;
            applyGuildActionVisibility(); updateMeritButton();   // 名字一致（或刚修正）→ 恢复按钮显示
            return;
        }
        showGuildWarning('当前公会不是 ' + guildConfig.name + '（' + (g.name || ('ID ' + g.id)) + '），排刀高亮已停用。可点「⚙ 设置」修改公会信息。');
        if (!guildGate.warned) guildGate.warned = true;
        applyGuildActionVisibility();
        updateMeritButton();
    }
    function guildBlocked() { return guildGate.known && !guildGate.ok; }
    // 设置的公会名与游戏内读到的公会名是否不一致（游戏还没读到公会信息时不算不一致）
    function guildNameMismatch() {
        if (!guildGate.known) return false;
        const want = String(guildConfig.name || '').trim().toUpperCase();
        const got = String(guildGate.name || '').trim().toUpperCase();
        return !!want && !!got && want !== got;
    }
    // ── 公会职位：guildCharacterDict[我的characterID].role ──────────────
    // 实测值示例：'officer'（官员）。枚举按通用命名映射，未识别的原样返回，便于确认。
    const GUILD_ROLE_ZH = Object.freeze({
        owner: '会长', leader: '会长',
        general: '将军',
        officer: '官员',
        member: '成员',
    });
    function myGuildCharacterRow(gs) {
        try {
            const chars = gs && (gs.guildCharacterDict || gs.guildCharacterMap);
            const rows = chars instanceof Map ? [...chars.values()] : Object.values(chars || {});
            const myId = Number(state.character && state.character.id);
            for (const r of rows) {
                if (!r || typeof r !== 'object') continue;
                if (Number.isFinite(myId) && myId > 0 && Number(r.characterID ?? r.characterId) === myId) return r;
            }
            // 兜底：通过 guildSharableCharacterMap 把角色名对到 characterID
            const myName = String((state.character && state.character.name) || '').trim();
            if (myName) {
                const sharable = gs && (gs.guildSharableCharacterMap || gs.guildSharableCharacterDict);
                const pairs = sharable instanceof Map ? [...sharable.entries()] : Object.entries(sharable || {});
                for (const r of rows) {
                    if (!r || typeof r !== 'object') continue;
                    const key = String(r.characterID ?? r.characterId ?? '');
                    for (const [mapKey, mapVal] of pairs) {
                        const nm = String((mapVal && (mapVal.name ?? mapVal.characterName)) || '').trim();
                        if (nm === myName && key && String(mapKey) === key) return r;
                    }
                }
            }
        } catch (_) {}
        return null;
    }
    function guildRoleInfo(gs) {
        gs = gs || getGameState();
        if (!gs) return { known: false, reason: '未拿到 GameState' };
        const row = myGuildCharacterRow(gs);
        if (!row) return { known: false, reason: 'guildCharacterDict 里没有本人的行（公会数据未加载？）' };
        const raw = String(row.role ?? '').trim();
        const lower = raw.toLowerCase();
        return {
            known: !!raw,
            role: raw,
            name: GUILD_ROLE_ZH[lower] || raw,
            isOwner: lower === 'owner' || lower === 'leader',
            isStaff: ['owner', 'leader', 'general', 'officer'].indexOf(lower) >= 0,
            status: String(row.status ?? ''),
        };
    }
    // 非 KUNPO 公会，或设置的公会名与游戏内公会名不一致：只保留「⚙ 设置」，其余按钮全部隐藏
    function applyGuildActionVisibility() {
        const blocked = guildBlocked() || guildNameMismatch();
        (state.actionButtons || []).forEach(function (b) { if (b) b.style.display = blocked ? 'none' : ''; });
        syncManualPlanButton();   // 《显示排刀》额外受「手动显示排刀」开关控制
        if (state.calcBtn) state.calcBtn.style.display = blocked ? 'none' : '';
        if (state.docBtn) state.docBtn.style.display = blocked ? 'none' : '';
        const showStaff = isOwnerOrGeneral();
        if (state.meritBtn) state.meritBtn.style.display = blocked ? 'none' : (showStaff ? '' : 'none');
        if (state.signupBtn) state.signupBtn.style.display = blocked ? 'none' : (showStaff ? '' : 'none');
        if (state.settingsBtn) state.settingsBtn.style.display = '';
    }
    // （CHANGELOG 已集中到文件顶部「用户可配置区」）
    // 弹出更新日志（按版本号从新到旧排列，当前版本有标注）
    // 更新日志弹窗。fromVersion 传入时只显示「比它新的版本」的条目（用于版本升级提示）。
    // 弹窗贴着 K 图标自适应摆放：默认以图标为中心、顶边对齐；
    // 面板展开中（占着同一位置）则改放面板左侧，左边放不下换右边；最后钳制进视口。
    function anchorChangelogBox(box) {
        const margin = 8;
        let ax = window.innerWidth - 60, ay = window.innerHeight - 60;   // 无 UI 时退到右下角
        if (state.uiRoot) {
            const x = parseFloat(state.uiRoot.style.left), y = parseFloat(state.uiRoot.style.top);
            if (Number.isFinite(x)) ax = x;
            if (Number.isFinite(y)) ay = y;
        }
        const iconW = (state.iconButton && state.iconButton.offsetWidth) || 46;
        const rect = box.getBoundingClientRect();
        let left = ax + iconW / 2 - rect.width / 2;
        let top = ay;
        const panelOpen = state.uiRoot && state.uiRoot.dataset && state.uiRoot.dataset.collapsed !== 'true'
            && state.panelEl && state.panelEl.style.display !== 'none';
        if (panelOpen && state.panelEl) {
            const pr = state.panelEl.getBoundingClientRect();
            left = pr.left - rect.width - margin;
            if (left < margin) left = pr.right + margin;
        }
        const p = clampUiPosition({ x: left, y: top }, rect.width, rect.height);
        box.style.left = `${p.x}px`;
        box.style.top = `${p.y}px`;
        box.style.right = 'auto';
        box.style.bottom = 'auto';
    }
    function showChangelog(fromVersion) {
        document.getElementById('kunpo-changelog-box')?.remove();
        const box = document.createElement('div');
        box.id = 'kunpo-changelog-box';
        box.style.cssText = 'position:fixed;z-index:2147483647;width:min(420px,calc(100vw - 32px));max-height:70vh;overflow-y:auto;padding:14px;'
            + 'border-radius:12px;border:1px solid #6f9bd8;background:linear-gradient(145deg,#152447,#1d3566);color:#eef3ff;'
            + 'font:12.5px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 10px 28px rgba(3,10,26,.55)';
        const title = document.createElement('strong');
        title.textContent = fromVersion ? ('脚本已更新：v' + fromVersion + ' → v' + SCRIPT_VERSION) : '更新日志';
        title.style.cssText = 'display:block;font-size:14px;margin:0 0 8px 0';
        box.appendChild(title);
        const close = document.createElement('button');
        close.type = 'button'; close.textContent = '×'; close.title = '关闭';
        close.style.cssText = 'position:absolute;top:7px;right:7px;min-width:24px;height:24px;border:0;border-radius:7px;'
            + 'background:#344879;color:#fff;cursor:pointer;font:700 16px/1 system-ui,sans-serif';
        close.addEventListener('click', () => box.remove());
        box.appendChild(close);
        let shown = 0;
        Object.keys(CHANGELOG).sort(compareVersions).reverse().forEach(function (v) {
            if (fromVersion && compareVersions(v, fromVersion) <= 0) return;   // 只要比 fromVersion 新的
            shown++;
            const item = document.createElement('div');
            item.style.cssText = 'margin:0 0 10px 0;padding:8px 9px;border:1px solid #45598c;border-radius:8px;'
                + 'background:rgba(10,20,44,.5)';
            const ver = document.createElement('div');
            ver.textContent = 'v' + v + (v === SCRIPT_VERSION ? '（当前版本）' : '');
            ver.style.cssText = 'font-weight:700;color:#8fc3ff;margin-bottom:4px';
            const body = document.createElement('div');
            body.textContent = CHANGELOG[v];
            body.style.cssText = 'white-space:pre-wrap;color:#c3d2f2';
            item.append(ver, body);
            box.appendChild(item);
        });
        if (!shown) return;   // 没有要显示的条目就不弹
        document.body.appendChild(box);
        anchorChangelogBox(box);
    }

    // ── 版本升级提示 ───────────────────────────────────────────────────
    // 游戏启动时比较「上次见过的版本」（全局键，所有角色共用）与当前版本：
    //   内置版本更高 → 弹窗显示区间内的全部更新内容（右上角 × 关闭），并把记录更新为当前版本。
    //   首次安装（没有记录）不弹窗，直接写入当前版本。
    function checkLastSeenVersion() {
        try {
            const stored = String(localStorage.getItem(K_LAST_SEEN_VERSION) || '').trim();
            if (!stored) {
                localStorage.setItem(K_LAST_SEEN_VERSION, SCRIPT_VERSION);
                return;                                  // 首次安装：不打扰
            }
            if (compareVersions(SCRIPT_VERSION, stored) <= 0) return;   // 已是最新或降级，不弹
            const hasNew = Object.keys(CHANGELOG).some(function (v) {
                return compareVersions(v, stored) > 0 && compareVersions(v, SCRIPT_VERSION) <= 0;
            });
            if (hasNew) showChangelog(stored);           // 右上角 × 关闭（showChangelog 自带）
            localStorage.setItem(K_LAST_SEEN_VERSION, SCRIPT_VERSION);
        } catch (e) { console.warn('[KUNPO] 版本提示失败：', e); }
    }

    function buildSettingsForm() {
        const form = document.createElement('div');
        form.id = 'kunpo-guild-settings';
        form.style.cssText = 'margin-top:9px;padding:9px;border:1px solid #6f9bd8;border-radius:8px;background:rgba(10,20,44,.45);'
            + 'max-height:min(800px, calc(100vh - 160px));overflow-y:auto;box-sizing:border-box';
        // 当前配置归属的角色（设置按角色名隔离保存）
        const who = document.createElement('div');
        who.id = 'kunpo-settings-owner';
        who.style.cssText = 'margin:0 0 7px 0;color:#9db4d8;font:600 11px/1.4 system-ui,sans-serif';
        who.textContent = '配置归属角色：' + (currentCharacterName() || '（未读取到角色名，将按全局保存）');
        form.appendChild(who);
        const hint = document.createElement('div');
        hint.id = 'kunpo-settings-hint';
        hint.style.cssText = 'margin:0 0 8px 0;color:#7f93bb;font:400 10.5px/1.4 system-ui,sans-serif';
        form.appendChild(hint);
        const mk = function (labelText, placeholder) {
            const row = document.createElement('label');
            row.style.cssText = 'display:block;margin:0 0 6px 0;color:#c3d2f2;font:600 11px/1.4 system-ui,sans-serif';
            row.appendChild(document.createTextNode(labelText));
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = placeholder || '';
            input.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin-top:3px;padding:4px 6px;'
                + 'border:1px solid #45598c;border-radius:5px;background:#0e1830;color:#eef3ff;font:12px/1.4 system-ui,sans-serif';
            row.appendChild(input);
            form.appendChild(row);
            return input;
        };
        const nameInput = mk('公会名', 'KUNPO');
        const idInput = mk('公会 ID（可留空，留空则只按名称匹配）', '2515');
        const urlInput = mk('JSON 获取地址（计算器共享空间 URL，含 bin/pwd；留空=用脚本默认地址）',
            'https://…/?guild=公会名&bin=…&pwd=…');
        const mkInput = mk('Master Key（仅上传时提示无权限才填）', '');
        const docInput = mk('组队文档地址（《打开组队文档》按钮跳转）', 'https://…');
        // COS 通道凭证：本地存过就填上；没存过且内置常量也已移除时需要手填
        const cosApiInput = mk('云函数地址（COS 通道；留空=用内置默认值）', 'https://…tencentscf.com');
        const cosTokenInput = mk('访问口令 X-Auth（COS 通道；留空=用内置默认值）', '');
        // 填写即生效并立即持久化（不依赖「保存」按钮）
        cosApiInput.addEventListener('change', function () {
            writeCfg(K_COS_API, String(cosApiInput.value || '').trim());
        });
        cosTokenInput.addEventListener('change', function () {
            writeCfg(K_COS_TOKEN, String(cosTokenInput.value || '').trim());
        });
        // 各输入行（label）引用：简洁界面按「是否自定义过」动态显隐
        state.settingsRows = {
            name: nameInput.parentNode,
            id: idInput.parentNode,
            url: urlInput.parentNode,
            mk: mkInput.parentNode,
            doc: docInput.parentNode,
        };
        // 静默时是否隐藏 K 图标
        const hideRow = document.createElement('label');
        hideRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin:0 0 6px 0;color:#c3d2f2;font:600 11px/1.4 system-ui,sans-serif;cursor:pointer';
        const hideInput = document.createElement('input');
        hideInput.type = 'checkbox';
        hideInput.checked = hideIconOnSilence();
        hideRow.appendChild(hideInput);
        hideRow.appendChild(document.createTextNode('静默时隐藏 K 图标（不勾选：静默后仍显示图标）'));
        form.appendChild(hideRow);
        // 操作计数开关（默认不勾选）
        const countRow = document.createElement('label');
        countRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin:0 0 6px 0;color:#c3d2f2;font:600 11px/1.4 system-ui,sans-serif;cursor:pointer';
        const countInput = document.createElement('input');
        countInput.type = 'checkbox';
        countInput.checked = clickCountEnabled();
        countRow.appendChild(countInput);
        countRow.appendChild(document.createTextNode('操作计数（监听本页鼠标点击并本地累计，显示在状态行下方）'));
        form.appendChild(countRow);
        // 国内直连开关（默认不勾选）：勾选后《打开计算器》跳转 EdgeOne 国内镜像地址
        const cnRow = document.createElement('label');
        cnRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin:0 0 6px 0;color:#c3d2f2;font:600 11px/1.4 system-ui,sans-serif;cursor:pointer';
        const cnInput = document.createElement('input');
        cnInput.type = 'checkbox';
        cnInput.checked = cnDirectEnabled();
        cnRow.appendChild(cnInput);
        cnRow.appendChild(document.createTextNode('国内直连（勾选后《打开计算器》打开国内镜像地址）'));
        // 暂时隐藏：EdgeOne 免费版默认域名仅 3 小时有效期（长期使用需绑定备案域名），
        // 功能逻辑保留，等有正式域名后删除下面这行即可重新显示。
        cnRow.style.display = 'none';
        form.appendChild(cnRow);
        // 光环推荐开关（默认不勾选）：勾选后在队伍页面注入《推荐光环》按钮
        const auraRow = document.createElement('label');
        auraRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin:0 0 6px 0;color:#c3d2f2;font:600 11px/1.4 system-ui,sans-serif;cursor:pointer';
        const auraInput = document.createElement('input');
        auraInput.type = 'checkbox';
        auraInput.checked = auraRecoEnabled();
        // 勾选即时生效并立即持久化（不依赖「保存」按钮，避免刷新后被还原）
        auraInput.addEventListener('change', function () {
            writeAuraRecoFlag(auraInput.checked);
            syncAuraRecoButton();
            syncAuraRecoInfo();
            showAssignmentToast(auraInput.checked ? '光环推荐已启用' : '光环推荐已关闭', 3000);
        });
        auraRow.appendChild(auraInput);
        auraRow.appendChild(document.createTextNode('启用光环推荐（在队伍页面显示《推荐光环》按钮）'));
        form.appendChild(auraRow);
        // 手动显示排刀（默认不勾选）：勾选后 K 面板上才出现《显示排刀》按钮
        const manualPlanRow = document.createElement('label');
        manualPlanRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin:0 0 6px 0;color:#c3d2f2;font:600 11px/1.4 system-ui,sans-serif;cursor:pointer';
        const manualPlanInput = document.createElement('input');
        manualPlanInput.type = 'checkbox';
        manualPlanInput.checked = manualPlanEnabled();
        manualPlanInput.addEventListener('change', function () {
            writeManualPlanFlag(manualPlanInput.checked);
            syncManualPlanButton();
            showAssignmentToast(manualPlanInput.checked ? '已显示《显示排刀》按钮' : '已隐藏《显示排刀》按钮', 3000);
        });
        manualPlanRow.appendChild(manualPlanInput);
        manualPlanRow.appendChild(document.createTextNode('手动显示排刀（勾选后在面板显示《显示排刀》按钮，用于手动重新拉取排刀）'));
        form.appendChild(manualPlanRow);
        const btns = document.createElement('div');
        btns.style.cssText = 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap';
        const save = document.createElement('button');
        save.type = 'button'; save.textContent = '保存';
        const cancel = document.createElement('button');
        cancel.type = 'button'; cancel.textContent = '取消';
        // 「取消静默」：仅脚本处于试炼结束静默状态时显示
        const resume = document.createElement('button');
        resume.type = 'button'; resume.textContent = '取消静默';
        resume.id = 'kunpo-resume-btn';
        resume.title = '试炼已结束判定后脚本整体静默；点击恢复脚本全部功能（等同控制台 __KUNPO.resume()）';
        resume.style.display = 'none';
        // 「更新日志」：弹出各版本更新内容
        const logBtn = document.createElement('button');
        logBtn.type = 'button'; logBtn.textContent = '更新日志';
        logBtn.title = '查看各版本的更新内容';
        [save, cancel, resume, logBtn].forEach(function (b) {
            Object.assign(b.style, {
                border: '0', borderRadius: '6px', padding: '5px 9px', background: '#0a84ff',
                color: '#fff', cursor: 'pointer', font: '600 12px/1 system-ui, sans-serif',
            });
        });
        cancel.style.background = '#344879';
        resume.style.background = '#1f9d55';
        logBtn.style.background = '#344879';
        logBtn.addEventListener('click', () => showChangelog());
        resume.addEventListener('click', function () {
            if (trialEndState.silenced) {
                // 取消静默：恢复全部功能，且本会话内不再被自动结束判定重新静默
                resumeFromSilence();
                trialEndState.holdSilenceOff = true;
                showAssignmentToast('已取消静默，脚本功能已恢复（本次会话不再自动静默）');
            } else if (trialEndState.holdSilenceOff) {
                // 打开静默：解除「不再自动静默」标记并立即重新静默
                trialEndState.holdSilenceOff = false;
                silenceAll('手动打开静默');
            } else {
                return;
            }
            form.style.display = 'none';
            updateResumeButton();
        });
        save.addEventListener('click', function () {
            saveGuildSettings(nameInput.value, idInput.value, urlInput.value, mkInput.value, docInput.value, hideInput.checked, countInput.checked, cnInput.checked, auraInput.checked);
        });
        cancel.addEventListener('click', function () { form.style.display = 'none'; });
        btns.append(save, cancel, resume, logBtn);
        form.appendChild(btns);
        state.settingsInputs = { name: nameInput, id: idInput, url: urlInput, mk: mkInput, doc: docInput, cosApi: cosApiInput, cosToken: cosTokenInput, hide: hideInput, count: countInput, cn: cnInput, aura: auraInput };
        return form;
    }
    // 只返回「用户自己存过的」地址；没存过就是空字符串（不回填脚本默认地址）。
    function savedCalcUrl() {
        try { return String(readCfg(CALC_URL_STORAGE_KEY) || '').trim(); } catch (_) { return ''; }
    }
    // 组队文档地址：只返回用户自己存过的；没存过为空（openTeamDoc 再回退内置默认）。
    function savedDocUrl() {
        try { return String(readCfg(K_DOC_URL) || '').trim(); } catch (_) { return ''; }
    }
    // 公会受限（非 KUNPO，或设置的公会名与游戏内公会名不一致）→ 与 applyGuildActionVisibility 同口径
    function guildRestricted() { return guildBlocked() || guildNameMismatch(); }
    // 单纯打开计算器页面（不发送任何数据）。
    // 公会受限时不回退内置默认地址：只用设置里填的，没填则提示去设置里填。
    function openCalculator() {
        // 勾选《国内直连》→ 直接跳 EdgeOne 国内镜像地址（与公会门控无关，仅是打开页面）
        if (cnDirectEnabled()) {
            window.open(CALC_CN_URL, '_blank', 'noopener,noreferrer');
            setStatus('已打开计算器（国内直连）', 'good');
            return;
        }
        const url = guildRestricted() ? savedCalcUrl() : getCalculatorUrl();
        if (!url) {
            setStatus('计算器地址为空，请先在「⚙ 设置」里填写', 'error');
            alert('当前公会与设置不一致，已停用内置默认地址。\n请点「⚙ 设置」在「JSON 获取地址」里填入你的计算器地址。');
            return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
        setStatus('已打开计算器', 'good');
    }
    // 打开组队文档（不发送任何数据）：优先用设置里填的地址；公会受限时不回退内置默认腾讯文档地址。
    function openTeamDoc() {
        const u = guildRestricted() ? savedDocUrl() : (savedDocUrl() || decodeDocDefaultUrl());
        if (!u) {
            setStatus('组队文档地址为空，请先在「⚙ 设置」里填写', 'error');
            alert('当前公会与设置不一致，已停用内置默认地址。\n请点「⚙ 设置」在「组队文档地址」里填入你的文档地址。');
            return;
        }
        window.open(u, '_blank', 'noopener,noreferrer');
    }
    // 「取消静默 / 打开静默」按钮的显隐与文案随状态切换：
    //   静默中 →「取消静默」；手动取消过（holdSilenceOff）→「打开静默」；其余 → 隐藏
    function updateResumeButton() {
        const btn = document.getElementById('kunpo-resume-btn');
        if (!btn) return;
        if (trialEndState.silenced) {
            btn.style.display = '';
            btn.textContent = '取消静默';
            btn.title = '试炼已结束判定后脚本整体静默；点击恢复脚本全部功能（本次会话内不再自动静默）';
        } else if (trialEndState.holdSilenceOff) {
            btn.style.display = '';
            btn.textContent = '打开静默';
            btn.title = '已手动取消静默；点击重新进入静默，自动结束判定同时恢复生效';
        } else {
            btn.style.display = 'none';
        }
    }
    function toggleSettingsForm() {
        const form = state.settingsForm;
        if (!form) return;
        const willOpen = form.style.display === 'none';
        if (!willOpen) {
            form.style.display = 'none';
            clampPanelToViewport();     // 收起后面板变矮，重新钳制
            return;
        }
        const ins = state.settingsInputs || {};
        const rows = state.settingsRows || {};
        // 打开设置前先刷新一次公会门控：确保「公会名不一致」判定用的是最新游戏内数据
        updateGuildGate(getGameState());
        const mismatch = guildNameMismatch();
        // 还没读到游戏内公会 → 无法判断是否匹配，按「需要填写」处理：全部显示并留空
        const needAll = mismatch || !guildGate.known;
        // 简洁界面：各项「自定义过（存过非空值）」才显示，仍用默认值的行隐藏。
        // 公会名不一致时无视此规则全部显示，方便逐项填入。
        const cfgCustom = function (base) {
            try { const v = readCfg(base); return !!(v && String(v).trim()); } catch (_) { return false; }
        };
        const nameCustom = cfgCustom(K_GUILD_NAME);
        const idCustom = cfgCustom(K_GUILD_ID);
        const urlCustom = !!savedCalcUrl();
        const mkCustom = !!masterKey();
        const docCustom = !!savedDocUrl();
        const showRow = function (row, customized) {
            if (row) row.style.display = (needAll || customized) ? '' : 'none';
        };
        // KUNPO 成员判定：游戏内公会名就是默认公会（KUNPO）才算。
        // 仅「配置与游戏内匹配」不算——其他公会的老数据角色同样会匹配，但不能隐藏他们的配置项。
        const kunpoMember = guildGate.known && !mismatch
            && String(guildGate.name || '').trim().toUpperCase() === String(GUILD_DEFAULTS.name).trim().toUpperCase();
        showRow(rows.name, !kunpoMember);
        showRow(rows.id, !kunpoMember);
        showRow(rows.url, !kunpoMember || urlCustom);
        showRow(rows.mk, !kunpoMember || mkCustom);
        showRow(rows.doc, !kunpoMember || docCustom);
        // 回填：正常状态下显示行填当前值；需全部填写（不一致/未读到公会）或隐藏行一律置空
        //（置空可避免把全局键里别的角色存的值回填进来）
        const fill = function (input, customized, val) {
            if (input) input.value = (!needAll && customized) ? val : '';
        };
        fill(ins.name, !kunpoMember && nameCustom, guildConfig.name || '');
        fill(ins.id, !kunpoMember && idCustom, guildConfig.id ? String(guildConfig.id) : '');
        // JSON 获取地址：存的值若与内置默认相同，视为「未自定义」，输入框留空（占位符已说明留空=用默认）
        const urlStored = savedCalcUrl();
        fill(ins.url, urlCustom && urlStored !== decodeCalcDefaultUrl(), urlStored);
        fill(ins.mk, mkCustom, masterKey());
        fill(ins.doc, docCustom, savedDocUrl());
        // COS 凭证：只有「本地存的值与内置默认不同」才回填；用默认值时留空，避免把内置值亮在输入框里
        const cosApiStored = String(readCfg(K_COS_API) || '').trim();
        const cosTokenStored = String(readCfg(K_COS_TOKEN) || '').trim();
        if (ins.cosApi) ins.cosApi.value = (cosApiStored && cosApiStored !== decodeCosApiBase()) ? cosApiStored : '';
        if (ins.cosToken) ins.cosToken.value = (cosTokenStored && cosTokenStored !== decodeCosToken()) ? cosTokenStored : '';
        if (ins.hide) ins.hide.checked = needAll ? false : hideIconOnSilence();
        if (ins.count) ins.count.checked = needAll ? false : clickCountEnabled();
        if (ins.cn) ins.cn.checked = needAll ? false : cnDirectEnabled();
        const owner = document.getElementById('kunpo-settings-owner');
        if (owner) owner.textContent = '配置归属角色：' + (currentCharacterName() || '（未读取到角色名，将按全局保存）');
        const hintEl = document.getElementById('kunpo-settings-hint');
        if (hintEl) hintEl.textContent = needAll
            ? (mismatch
                ? '公会名与游戏内不一致：请逐项填入你的公会与地址，保存后生效。设置按角色名分别保存。'
                : '尚未读取到游戏内公会信息：如非 KUNPO 成员，请逐项填入公会与地址。')
            : (!kunpoMember
                ? '当前公会不是 KUNPO：全部配置项已显示，按需填写（留空项继续使用已保存的值）。'
                : '');
        // 「取消静默 / 打开静默」按钮按当前状态切换显隐与文案
        updateResumeButton();
        form.style.display = '';
        // 展开后面板会变高（尤其第一次打开、所有配置行都显示时）：
        // 下一帧再量一次真实高度并把面板拉回视口内，同时把表单滚到可见区域。
        clampPanelToViewport();
        requestAnimationFrame(function () {
            clampPanelToViewport();
            try { form.scrollIntoView({ block: 'nearest' }); } catch (_) { /* 老浏览器忽略 */ }
        });
    }
    function saveGuildSettings(name, idRaw, url, mkRaw, docRaw, hideRaw, countRaw, cnRaw, auraRaw) {
        try {
            writeCfg(K_GUILD_NAME, String(name || '').trim());
            writeCfg(K_GUILD_ID, String(idRaw || '').trim());
            const mk = String(mkRaw || '').trim();
            if (mk) writeCfg(K_MASTER_KEY, mk); else clearCfg(K_MASTER_KEY);
            try { localStorage.setItem(K_HIDE_ICON, hideRaw ? '1' : '0'); } catch (_) {}
            try { localStorage.setItem(K_CN_DIRECT, cnRaw ? '1' : '0'); } catch (_) {}
            writeCfg(K_COUNT_CLICKS, countRaw ? '1' : '0');
            writeAuraRecoFlag(!!auraRaw);
            const u = String(url || '').trim();
            if (u === '') clearCfg(CALC_URL_STORAGE_KEY);
            else if (/^https?:\/\//.test(u)) writeCfg(CALC_URL_STORAGE_KEY, u);
            const du = String(docRaw || '').trim();
            if (du === '') clearCfg(K_DOC_URL);
            else if (/^https?:\/\//.test(du)) writeCfg(K_DOC_URL, du);
        } catch (_) {}
        loadGuildConfig();
        setClickCounter(clickCountEnabled());   // 立刻生效：开/关点击监听并刷新显示行
        syncAuraRecoButton();                   // 立刻生效：开/关队伍页面的《推荐光环》按钮
        // 换公会/换地址后必须重新拉取，旧缓存作废
        assignmentState.doc = null;
        assignmentState.fetchedAt = 0;
        lastAnnouncedText = '';
        updateGuildGate(getGameState());
        applyGuildActionVisibility();
        if (state.settingsForm) state.settingsForm.style.display = 'none';
        if (!guildBlocked()) void refreshAssignment({ force: true });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ══ 试炼结束检测（数据路线） + 结束后整体静默 ═════════════════════════
    // 触发时机：**每次进入公会试炼界面时判定一次**（不做周期轮询）。
    //   已完成 → 立即静默；未完成 → 拉取排刀并高亮。
    // 判定依据（按顺序）：
    //   ① 周期跨周：now ≥ 游戏下发的 weekStartAt + 7 天；
    //   ② DOM（实测可用）：试炼页卡片文本含「已完成」（'all' = 全部卡片都完成才算）；
    //   ③ 字段兜底：GameState 里出现「已完成/已结束/已领取」语义的真值字段。
    // 静默内容：停定时器、断开 MutationObserver、还原 MessageEvent 原生 getter
    //   （不再 hook 游戏 WS）、移除注入的 DOM 与监听。
    //
    // MilkywayIdle 的确切字段名尚未确认，这里先用「字段名模糊匹配」兜底，
    // 并在首次发现候选字段时 console 打印证据，方便后续把判定收紧到唯一字段。
    // 手动控制：localStorage.setItem('kunpo_trial_end_override','1'|'0') 或 __KUNPO.setOverride(true/false/null)
    // ═══════════════════════════════════════════════════════════════════════
    const TRIAL_END_OVERRIDE_KEY = 'kunpo_trial_end_override';
    const TRIAL_END_CHECK_MS = 30 * 1000;        // 检测间隔
    const TRIAL_END_START_DELAY_MS = 8 * 1000;   // 启动后延迟，等 GameState 就绪
    // 命中即代表"已结束"的字段名（真值才算，false/0 不算）
    const TRIAL_END_TRUE_FIELDS = Object.freeze([
        'isComplete', 'isCompleted', 'completed', 'complete', 'finished', 'isFinished', 'hasFinished',
        'ended', 'isEnded', 'hasEnded', 'resolved', 'isResolved', 'claimed', 'rewardClaimed',
        'trialComplete', 'trialCompleted', 'trialEnded', 'isTrialComplete', 'guildTrialComplete',
    ]);
    // status / state / phase 字段里代表"结束"的取值
    const TRIAL_END_STATUS_VALUES = Object.freeze([
        'complete', 'completed', 'finished', 'ended', 'resolved', 'claimed', 'done', 'closed',
    ]);
    // 试炼相关容器（含已知别名）
    const TRIAL_CONTAINER_KEYS = Object.freeze([
        'guildTrialDetailMap', 'guildTrialDetailDict', 'guildTrialMap', 'guildTrialDict',
        'guildTrialSignupLevelMap', 'guildTrialSignupLevelDict',
        'guildWeeklyTrialSet', 'weeklyGuildTrialSet',
        'guildTrialResultMap', 'guildTrialResultDict',
        'guildTrialRewardMap', 'guildTrialContributionMap',
    ]);
    // 仅记录、不用于判定的候选字段名片段
    const TRIAL_EVIDENCE_HINTS = Object.freeze(['complet', 'finish', 'ended', 'result', 'reward', 'claim']);
    // DOM 路线（已实测确认）：试炼卡片文本含「已完成」即该试炼已完成。
    // 规则：'any' = 任意 1 张卡已完成即判定结束（默认）；'all' = 页面上全部卡片都已完成才算。
    const TRIAL_END_DOM_MARKER = '已完成';
    const TRIAL_END_DOM_RULE = 'all';
    function detectTrialEndDom() {
        const cards = [...document.querySelectorAll(TRIAL_CARD_SELECTOR)];
        if (!cards.length) return { ended: false, done: 0, total: 0 };
        let done = 0;
        for (const c of cards) {
            if (String(c.textContent || '').indexOf(TRIAL_END_DOM_MARKER) >= 0) done++;
        }
        const need = (TRIAL_END_DOM_RULE === 'all') ? cards.length : 1;
        return { ended: done >= need, done: done, total: cards.length };
    }

    function shortJson(value) {
        try {
            const s = typeof value === 'string' ? value : JSON.stringify(value);
            return String(s == null ? '' : s).slice(0, 80);
        } catch (_) { return String(value).slice(0, 80); }
    }
    // 收集 GameState 里所有试炼相关对象：容器本身 + 容器中每一项
    function collectTrialObjects(gs) {
        const out = [];
        const pushContainer = (label, container) => {
            if (!container || typeof container !== 'object') return;
            if (container instanceof Map) {
                for (const [k, v] of container.entries()) if (v && typeof v === 'object') out.push([label + '[' + String(k) + ']', v]);
            } else {
                for (const [k, v] of Object.entries(container)) if (v && typeof v === 'object') out.push([label + '.' + k, v]);
                out.push([label, container]);
            }
        };
        if (!gs) return out;
        for (const key of Object.keys(gs)) {
            if (/trial/i.test(key)) pushContainer(key, gs[key]);
        }
        for (const key of TRIAL_CONTAINER_KEYS) pushContainer(key, gs[key]);
        return out;
    }
    function detectTrialEnd(gs) {
        const evidence = [];
        for (const [label, obj] of collectTrialObjects(gs)) {
            let entries;
            try { entries = Object.entries(obj); } catch (_) { continue; }
            for (const [key, raw] of entries) {
                const lower = String(key).toLowerCase();
                if (TRIAL_END_TRUE_FIELDS.indexOf(key) >= 0 || TRIAL_END_TRUE_FIELDS.some(f => f.toLowerCase() === lower)) {
                    if (raw === true || raw === 1 || raw === '1' || raw === 'true') {
                        return { ended: true, reason: label + '.' + key + ' = ' + shortJson(raw) };
                    }
                    continue;
                }
                if (/^(status|state|phase|stage)$/.test(lower) && typeof raw === 'string'
                    && TRIAL_END_STATUS_VALUES.indexOf(raw.toLowerCase()) >= 0) {
                    return { ended: true, reason: label + '.' + key + ' = ' + raw };
                }
                if (TRIAL_EVIDENCE_HINTS.some(h => lower.indexOf(h) >= 0)) {
                    evidence.push(label + '.' + key + ' = ' + shortJson(raw));
                }
            }
        }
        return { ended: false, reason: '', evidence: evidence.slice(0, 40) };
    }
    // 试炼周窗口：用游戏下发的周起点（weeklyGuildExperienceWeekStartAt / signupWeekStartAt）
    // 算出本周试炼周期 [start, start+7天(+guildTrialScheduleHourOffset)]。
    // 这是已确认存在的数据（不靠本地猜周五），跨周即代表本周试炼结束。
    function trialWeekWindow(gs) {
        try {
            const chars = gs && (gs.guildCharacterDict || gs.guildCharacterMap);
            const rows = chars instanceof Map ? [...chars.values()] : Object.values(chars || {});
            let start = NaN;
            for (const r of rows) {
                if (!r || typeof r !== 'object') continue;
                const raw = r.weeklyGuildExperienceWeekStartAt || r.signupWeekStartAt;
                if (!raw) continue;
                const t = Date.parse(raw);
                if (Number.isFinite(t)) start = Number.isFinite(start) ? Math.max(start, t) : t;
            }
            if (!Number.isFinite(start)) return null;
            const offsetHours = Number(gs && gs.guildTrialScheduleHourOffset);
            const shift = (Number.isFinite(offsetHours) && offsetHours >= -12 && offsetHours <= 12) ? offsetHours * 3600e3 : 0;
            return { start: start, end: start + 7 * 24 * 3600e3 + shift };
        } catch (_) { return null; }
    }
    function checkTrialEnd() {
        if (trialEndState.silenced || trialEndState.holdSilenceOff) return;   // 手动取消过静默 → 本会话不再自动静默
        let result = { ended: false, reason: '' };
        try {
            let override = null;
            try { override = localStorage.getItem(TRIAL_END_OVERRIDE_KEY); } catch (_) {}
            if (override === '1') result = { ended: true, reason: '手动 override=1' };
            else if (override === '0') result = { ended: false, reason: '' };
            else {
                const gs = getGameState();
                if (gs) {
                    const w = trialWeekWindow(gs);
                    if (w && Date.now() >= w.end) {
                        result = {
                            ended: true,
                            reason: '试炼周期已结束（weekStart=' + new Date(w.start).toISOString()
                                + ' → end=' + new Date(w.end).toISOString() + '）',
                        };
                    } else {
                        result = detectTrialEnd(gs);
                    }
                }
                // DOM 路线（实测可用）：试炼页卡片文本含「已完成」。
                const dom = detectTrialEndDom();
                if (!result.ended && dom.ended) {
                    result = { ended: true, reason: '试炼页显示 ' + dom.done + '/' + dom.total + ' 张卡片已完成' };
                }
            }
        } catch (e) {
            return;
        }
        if (!result.ended) return;
        trialEndState.ended = true;
        trialEndState.reason = result.reason;
        silenceAll(result.reason);
    }
    // 每次「进入公会试炼界面」时执行一次（不做周期轮询）：
    //   已完成 → 立即静默；未完成 → 拉排刀并高亮（缓存新鲜则直接用），进入只提示一次。
    function onEnterTrialPage() {
        if (trialEndState.silenced) return;
        // 每次进入都清空去重标记 → 这一趟允许提示一次。
        // 以前只在「离开界面」时清空，一旦离开没被 DOM 观察器捕获，后面再进就永远不提示了。
        lastAnnouncedText = '';
        updateGuildGate(getGameState());
        if (guildBlocked()) { announceAssignment('当前公会不是 ' + guildConfig.name + '，排刀高亮已停用', true); return; }
        checkTrialEnd();
        if (trialEndState.silenced) return;
        void refreshAssignment({ force: false }).then(function () {
            if (trialEndState.silenced || !assignmentState.doc) return;
            renderAssignmentUi({ announce: true });
        });
    }
    function stopTrialEndWatch() {
        clearInterval(trialEndState.watchTimer);
        trialEndState.watchTimer = 0;
    }
    function hideIconOnSilence() {
        try { return localStorage.getItem(K_HIDE_ICON) === '1'; } catch (_) { return false; }
    }
    // 国内直连开关：默认不勾选（false）。
    function cnDirectEnabled() {
        try { return localStorage.getItem(K_CN_DIRECT) === '1'; } catch (_) { return false; }
    }
    function removeInjectedDom() {
        ['#kunpo-export-ui', '#kunpo-assignment-style', '#kunpo-assignment-toast', '#kunpo-update-banner'].forEach(function (sel) {
            const node = document.querySelector(sel);
            if (node && node.parentNode) node.parentNode.removeChild(node);
        });
    }
    // 试炼已结束 → 停掉本脚本的一切行为并从页面彻底退出
    function silenceAll(reason) {
        if (trialEndState.silenced) return;
        trialEndState.silenced = true;
        trialEndState.ended = true;
        trialEndState.reason = reason || '';
        try {
            stopTrialEndWatch();
            cleanupStatusPolling();                       // 1 秒一次的行业/配装轮询
            if (assignmentState.pollTimer) { clearInterval(assignmentState.pollTimer); assignmentState.pollTimer = null; }
            clearTimeout(assignmentState.timer); assignmentState.timer = 0;
            if (assignmentState.observer) { assignmentState.observer.disconnect(); assignmentState.observer = null; }
            // 光环推荐的 Observer 保持运行：静默后该功能仍然可用
            // 还原 MessageEvent 原生 getter → 不再 hook 游戏 WebSocket
            if (originalMessageDataGetter) {
                const d = Object.getOwnPropertyDescriptor(MessageEvent.prototype, 'data');
                if (d && d.get && d.get !== originalMessageDataGetter) {
                    Object.defineProperty(MessageEvent.prototype, 'data', Object.assign({}, d, { get: originalMessageDataGetter }));
                }
            }
            if (uiResizeHandler) { window.removeEventListener('resize', uiResizeHandler); uiResizeHandler = null; }
            setClickCounter(false);                       // 静默 → 卸载操作计数监听（累计值保留在本地）
            clearAssignmentUi();                          // 移除卡片高亮/角标/技能面板
            if (hideIconOnSilence()) {
                removeInjectedDom();                      // 勾选「静默时隐藏」→ 面板+图标+样式全部移除
                state.statusText = null; state.panelEl = null; state.iconButton = null; state.uiRoot = null;
            } else {
                // 未勾选 → 保留 K 图标：只移除排刀样式与 toast，面板收起并锁定
                ['#kunpo-assignment-style', '#kunpo-assignment-toast'].forEach(function (sel) {
                    const n = document.querySelector(sel);
                    if (n && n.parentNode) n.parentNode.removeChild(n);
                });
                if (state.uiRoot) state.uiRoot.dataset.collapsed = 'true';
                if (state.panelEl) state.panelEl.style.display = 'none';
                if (state.iconButton) {
                    state.iconButton.style.display = '';
                    state.iconButton.title = '试炼已完成，脚本已静默\n拖动移动位置；点击展开面板';
                }
                if (state.statusText) state.statusText.textContent = '试炼已完成，脚本已静默';
            }
            clearTimeout(assignmentToastTimer);
            // 静默前给一次明确反馈（放在清理之后，避免被 removeInjectedDom 一起删掉）
            showAssignmentToast('试炼已完成，关闭排刀高亮');
        } catch (e) {
            console.warn('[KUNPO] 静默过程异常：', e);
        }
    }
    function resumeFromSilence() {
        if (!trialEndState.silenced) return;
        trialEndState.silenced = false;
        trialEndState.ended = false;
        trialEndState.reason = '';
        trialEndState.evidenceLogged = false;
        assignmentState.doc = null;
        assignmentState.fetchedAt = 0;
        assignmentState.cardsPresent = false;
        lastAnnouncedText = '';
        // 图标保留场景下 boot()→mountExportUi() 会因已挂载而跳过，这里手动还原静默时改掉的 UI 状态
        if (state.iconButton) state.iconButton.title = 'KUNPO 试炼专用：等待人物数据\n拖动移动位置；点击展开面板';
        if (state.statusText) state.statusText.textContent = '等待人物数据';
        if (state.uiRoot && !uiResizeHandler) {
            uiResizeHandler = () => {
                if (!state.uiRoot) return;
                if (state.uiRoot.dataset.collapsed === 'true') {
                    placeIcon(readUiPosition());
                } else {
                    const rect = state.panelEl.getBoundingClientRect();
                    const p = clampUiPosition(
                        { x: parseFloat(state.uiRoot.style.left), y: parseFloat(state.uiRoot.style.top) },
                        rect.width,
                        rect.height,
                    );
                    state.uiRoot.style.left = `${p.x}px`;
                    state.uiRoot.style.top = `${p.y}px`;
                }
            };
            window.addEventListener('resize', uiResizeHandler);
        }
        setClickCounter(clickCountEnabled());   // 静默时被关掉的点击计数监听按设置恢复
        hookWebSocketMessages();
        boot();
    }
    // ═══════════════════════════════════════════════════════════════════════
    // ▼ 功德：仅会长 / 将军可见的《功德+1》按钮，点击累计并本地保存
    // ═══════════════════════════════════════════════════════════════════════
    const K_GONGDE = 'kunpo_gongde';
    function meritCount() {
        try { return Number(localStorage.getItem(K_GONGDE)) || 0; } catch (_) { return 0; }
    }
    function meritPlusOne() {
        const n = meritCount() + 1;
        try { localStorage.setItem(K_GONGDE, String(n)); } catch (_) {}
        showAssignmentToast('功德 +1 · 当前功德：' + n);
    }
    function isOwnerOrGeneral() {
        const info = guildRoleInfo();
        if (!info.known) return false;
        return info.isOwner || String(info.role).toLowerCase() === 'general';
    }
    function updateMeritButton() {
        const show = isOwnerOrGeneral();
        if (state.meritBtn) state.meritBtn.style.display = show ? '' : 'none';
        if (state.signupBtn) state.signupBtn.style.display = show ? '' : 'none';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ▼ 光环推荐：设置勾选《启用光环推荐》后，在队伍页面（Party）注入
    //   《推荐光环》按钮；点击后临时弹窗输出队伍成员 name + 五项战斗等级
    //   （攻/防/近战/远程/魔法；队友等级需先点开其资料页，WS profile_shared 会推送并缓存）。
    //   成员数据来自 WS init_character_data / party_updated 的 partyInfo.partySlotMap；
    //   名字解析优先级：成员自带 name 字段 → 自己用当前角色名 → 其余成员查
    //   角色名片插件的 profile_export_list 存档（同源 localStorage 共享）→ 兜底「成员(id尾号)」。
    // ═══════════════════════════════════════════════════════════════════════
    const AURA_RECO_BTN_CLASS = 'kunpo-aura-reco-wrap';
    let auraRecoObserver = null;
    // 光环推荐开关（按角色隔离，默认不勾选）
    function auraRecoEnabled() {
        try { return readCfg(K_AURA_RECO) === '1'; } catch (_) { return false; }
    }
    // 写开关：同时写全局键与角色隔离键。角色名要等 WS 数据才可读，双写保证
    // 「写入时与读取时角色名可读性不一致」的任何时序下都能读到正确状态。
    function writeAuraRecoFlag(on) {
        try { localStorage.setItem(K_AURA_RECO, on ? '1' : '0'); } catch (_) {}
        writeCfg(K_AURA_RECO, on ? '1' : '0');
    }
    // ── 「手动显示排刀」开关：默认关闭，关闭时面板上不显示《显示排刀》按钮 ──
    // 排刀现在只在进入试炼界面时自动拉一次，手动按钮平时用不到，留作按需开启的调试/补拉入口。
    function manualPlanEnabled() {
        try { return readCfg(K_MANUAL_PLAN) === '1'; } catch (_) { return false; }
    }
    function writeManualPlanFlag(on) {
        try { localStorage.setItem(K_MANUAL_PLAN, on ? '1' : '0'); } catch (_) {}
        writeCfg(K_MANUAL_PLAN, on ? '1' : '0');
    }
    function syncManualPlanButton() {
        const blocked = guildBlocked() || guildNameMismatch();
        if (state.assignBtn) state.assignBtn.style.display = (blocked || !manualPlanEnabled()) ? 'none' : '';
    }
    // 开关打开后启动注入（boot 时调用；Observer 只挂一次，靠 sync 按需增删按钮）
    function addAuraRecoButton() {
        if (auraRecoObserver || !document.body) return;
        // 观察的是整页 document.body（subtree），游戏页面动画/聊天/计数器等任何变动都会触发回调。
        // 若每次都同步执行 syncAuraRecoInfo（含大量 querySelectorAll 与 getBoundingClientRect 强制重排），
        // 主线程会被拖垮导致 CN 站打开组队页面时卡死。这里做 200ms 节流，把一簇变动合并成一次同步。
        let auraRecoTimer = null;
        const scheduleAuraReco = function () {
            if (auraRecoTimer) return;
            auraRecoTimer = setTimeout(function () {
                auraRecoTimer = null;
                try { syncAuraRecoButton(); syncAuraRecoInfo(); } catch (_) {}
            }, 200);
        };
        auraRecoObserver = new MutationObserver(scheduleAuraReco);
        auraRecoObserver.observe(document.body, { childList: true, subtree: true });
        syncAuraRecoButton();
        syncAuraRecoInfo();
    }
    // CN 站（milkywayidlecn.com）构建的 CSS Modules hash 与列内嵌套和 .com 不同，
    // 部分选择器与插入策略按站点分支处理；.com 路径保持原样不动
    const IS_CN_SITE = /milkywayidlecn/i.test(location.hostname);
    // 按当前设置与页面状态同步《推荐光环》按钮的注入/移除
    // （静默不影响光环推荐：试炼结束后该功能仍可用）
    function syncAuraRecoButton() {
        const optionsEl = document.querySelector(IS_CN_SITE
            ? '[class*="Party_partyOptions"]'   // CN 站无 .Party_partyOptions__3HGXK（hash 不同），用前缀匹配
            : '.Party_partyOptions__3HGXK');
        const existing = document.querySelector('.' + AURA_RECO_BTN_CLASS);
        if (!auraRecoEnabled() || !optionsEl) {
            if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
            return;
        }
        if (optionsEl.querySelector('.' + AURA_RECO_BTN_CLASS)) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = '光环优先级';
        btn.title = '配置光环优先级（队伍人数为 X 时，按前 X 个光环为每名成员推荐最优解）';
        btn.style.cssText = 'border-radius:2px;background-color:#8b5cf6;color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);'
            + 'border:0;margin-left:8px;display:inline-block;padding:0 8px;cursor:pointer;vertical-align:middle;transition:background-color .2s ease';
        btn.addEventListener('mouseenter', function () { btn.style.backgroundColor = '#7c3aed'; });
        btn.addEventListener('mouseleave', function () { btn.style.backgroundColor = '#8b5cf6'; });
        btn.addEventListener('click', function () { openAuraPriorityModal(); return false; });
        // 与队伍页面其他操作按钮同级：包一层 inline-block div
        const wrap = document.createElement('div');
        wrap.className = AURA_RECO_BTN_CLASS;
        wrap.style.display = 'inline-block';
        wrap.appendChild(btn);
        optionsEl.appendChild(wrap);
    }
    // 从缓存的 partyInfo 收集队伍成员 name 列表
    function collectPartyMemberNames() {
        const myId0 = state.character ? String(state.character.id) : '';
        if (IS_CN_SITE) {
            // CN 站：WS partyInfo 可能滞后于页面（进队后不刷新则数量对不上），以页面显示为准
            const nameCache = readPartyNameCache();
            const domNames = scrapePartyMemberNamesFromDom();
            const wsList = [];
            const slotMap = (state.partyInfo && state.partyInfo.partySlotMap) || {};
            for (const member of Object.values(slotMap)) {
                if (!member || !member.characterID) continue;
                wsList.push({ id: String(member.characterID), name: String(member.name || member.characterName || '').trim() });
            }
            const cnList = domNames.length ? domNames.map(function (name, i) {
                const ws = (wsList.length === domNames.length) ? wsList[i] : null;
                let id = ws ? ws.id : '';
                if (!id && myId0 && name === currentCharacterName()) id = myId0;
                if (!id) {
                    for (const k in nameCache) {
                        if (nameCache[k] === name) { id = k; break; }
                    }
                }
                return { id: id, name: name };
            }) : wsList.map(function (w) {
                return { id: w.id, name: w.name || String(nameCache[w.id] || '').trim() };
            });
            let dirty = false;
            cnList.forEach(function (m) {
                if (m.id && m.name && nameCache[m.id] !== m.name) { nameCache[m.id] = m.name; dirty = true; }
            });
            if (dirty) writePartyNameCache(nameCache);
            cnList.forEach(function (m) { if (!m.name) m.name = '成员(' + (m.id ? m.id.slice(-4) : '?') + ')'; });
            return cnList;
        }
        const list = [];
        const slotMap = (state.partyInfo && state.partyInfo.partySlotMap) || {};
        const myId = state.character ? String(state.character.id) : '';
        let profiles = [];
        try { profiles = JSON.parse(localStorage.getItem('profile_export_list') || '[]') || []; } catch (_) {}
        const nameCache = readPartyNameCache();
        const ids = [];
        for (const member of Object.values(slotMap)) {
            if (!member || !member.characterID) continue;
            const id = String(member.characterID);
            ids.push(id);
            let name = String(member.name || member.characterName || '').trim();
            if (!name && id === myId) name = currentCharacterName();
            if (!name) {
                const p = profiles.find(function (it) { return it && String(it.characterID) === id; });
                if (p) name = String(p.characterName || (p.profile && p.profile.sharableCharacter && p.profile.sharableCharacter.name) || '').trim();
            }
            if (!name) name = String(nameCache[id] || '').trim();
            list.push({ id: id, name: name || '' });
        }
        // 队伍页面 DOM 上每个成员的名字都显示着：按显示顺序与 slotMap 顺序一一对应补齐
        if (list.some(function (m) { return !m.name; })) {
            const domNames = scrapePartyMemberNamesFromDom();
            if (domNames.length === list.length) {
                list.forEach(function (m, i) { if (!m.name) m.name = domNames[i]; });
            } else if (!list.length && domNames.length) {
                domNames.forEach(function (n) { list.push({ id: '', name: n }); });
            }
        }
        // 抓到新名字就写缓存，之后不在队伍页面也能显示
        let dirty = false;
        list.forEach(function (m) {
            if (m.id && m.name && nameCache[m.id] !== m.name) { nameCache[m.id] = m.name; dirty = true; }
        });
        if (dirty) writePartyNameCache(nameCache);
        list.forEach(function (m) { if (!m.name) m.name = '成员(' + (m.id ? m.id.slice(-4) : '?') + ')'; });
        return list;
    }
    // 队伍页面 DOM 抓成员名：游戏角色名组件类名为 CharacterName_characterName__xxx（hash 可能变，用前缀匹配）
    // 名字组件是嵌套结构（外层容器与内层文本都命中 characterName），且外层可能把徽章数字
    // （如奖杯数 75）一起算进 textContent，产生 'Se77enAlpha75' 这类幽灵名。
    // characterNameLeafEls：只保留「叶子」匹配（不含其它匹配元素的，即最内层文本节点）。
    function characterNameLeafEls(container) {
        const els = Array.from(container.querySelectorAll('[class*="characterName" i]'));
        return els.filter(function (el) {
            return !els.some(function (other) { return other !== el && el.contains(other); });
        });
    }
    function scrapePartyMemberNamesFromDom() {
        try {
            const container = document.querySelector('[class*="Party_page"]') || document.querySelector('[class^="Party_"]');
            if (!container) return [];
            const els = characterNameLeafEls(container);
            const names = [];
            els.forEach(function (el) {
                // 文本名字元素（排除只含头像/空节点的），并做相邻去重
                const t = String(el.textContent || '').trim();
                if (!t || t.length > 20) return;
                if (names.length && names[names.length - 1] === t) return;
                names.push(t);
            });
            return names;
        } catch (_) { return []; }
    }
    // 成员 id → name 本地缓存（全局共享，队伍页面抓到一次后永久可用）
    const PARTY_NAME_CACHE_KEY = 'kunpo_party_name_map';
    function readPartyNameCache() {
        try { return JSON.parse(localStorage.getItem(PARTY_NAME_CACHE_KEY) || '{}') || {}; } catch (_) { return {}; }
    }
    function writePartyNameCache(map) {
        try { localStorage.setItem(PARTY_NAME_CACHE_KEY, JSON.stringify(map)); } catch (_) {}
    }
    // ── 队友资料缓存：点开其资料页时 WS 推送 profile_shared，存五项战斗等级 ──
    const PARTY_PROFILE_KEY = 'kunpo_profile_map';
    function readPartyProfileMap() {
        try { return JSON.parse(localStorage.getItem(PARTY_PROFILE_KEY) || '{}') || {}; } catch (_) { return {}; }
    }
    function writePartyProfileMap(map) {
        try { localStorage.setItem(PARTY_PROFILE_KEY, JSON.stringify(map)); } catch (_) {}
    }
    function saveProfileShared(profile) {
        try {
            if (!profile) return;
            const id = String((profile.characterSkills && profile.characterSkills[0] && profile.characterSkills[0].characterID) || '');
            if (!id) return;
            const map = readPartyProfileMap();
            map[id] = {
                name: String((profile.sharableCharacter && profile.sharableCharacter.name) || '').trim(),
                lv: combatLevelsFromSkillList(profile.characterSkills || []),
                au: auraLevelsFromAbilityList(profile.characterAbilities || profile.equippedAbilities || []),
                hr: normalizeHouseRoomMap(profile.characterHouseRoomMap || null),
                ts: Date.now(),
            };
            // 上限 50 份：超出按时间淘汰最旧的
            const keys = Object.keys(map);
            if (keys.length > 50) {
                keys.sort(function (a, b) { return (map[a].ts || 0) - (map[b].ts || 0); })
                    .slice(0, keys.length - 50)
                    .forEach(function (k) { delete map[k]; });
            }
            writePartyProfileMap(map);
        } catch (_) {}
    }
    // 从 characterSkills 数组取五项战斗等级（近战兼容 power 技能，与角色名片插件口径一致）
    function combatLevelsFromSkillList(skillList) {
        const get = function (tail) {
            const hit = (skillList || []).find(function (s) {
                return s && String(s.skillHrid || '').indexOf('/skills/' + tail) >= 0;
            });
            return hit ? Number(hit.level || 0) : null;
        };
        return { atk: get('attack'), mel: get('melee') != null ? get('melee') : get('power'), def: get('defense'), rng: get('ranged'), mag: get('magic') };
    }
    // 自己的五项战斗等级：直接读 WS 缓存的技能 Map（键 = skillHrid）
    function selfCombatLevels() {
        const get = function (tail) {
            const hit = state.skills.get('/skills/' + tail);
            return hit ? Number(hit.level || 0) : null;
        };
        return { atk: get('attack'), mel: get('melee') != null ? get('melee') : get('power'), def: get('defense'), rng: get('ranged'), mag: get('magic') };
    }
    function formatCombatLevels(lv) {
        if (!lv) return '资料未获取（请先点开该队友资料页）';
        const f = function (v) { return (v === null || v === undefined) ? '-' : String(v); };
        return '攻' + f(lv.atk) + ' 防' + f(lv.def) + ' 近战' + f(lv.mel) + ' 远程' + f(lv.rng) + ' 魔法' + f(lv.mag);
    }
    // ── 光环等级与最终值 ──
    // 从能力列表（characterAbilities / equippedAbilities）提取八个光环等级（键同 AURA_MAP）
    function auraLevelsFromAbilityList(list) {
        const res = {};
        Object.keys(AURA_MAP).forEach(function (key) {
            const hrid = AURA_MAP[key];
            const hit = (list || []).find(function (a) { return a && String(a.abilityHrid || '') === hrid; });
            res[key] = hit ? Number(hit.level || 0) : 0;
        });
        return res;
    }
    // ── 房屋加成：影响属性等级 = 技能等级 + 对应房屋等级 ──
    // 对应关系与角色名片插件 houseRoomsMapping 一致
    const HOUSE_ROOM_FOR_ATTR = Object.freeze({
        '攻击': '/house_rooms/dojo',            // 道场
        '防御': '/house_rooms/armory',          // 军械库
        '近战': '/house_rooms/gym',             // 健身房
        '远程': '/house_rooms/archery_range',   // 射箭场
        '魔法': '/house_rooms/mystical_study',  // 神秘研究室
    });
    // 房屋数据归一化：兼容 {hrid: level}、{hrid: {houseRoomHrid, level}}、数组三种形态
    function normalizeHouseRoomMap(raw) {
        const res = {};
        try {
            if (Array.isArray(raw)) {
                raw.forEach(function (h) { if (h && h.houseRoomHrid) res[String(h.houseRoomHrid)] = Number(h.level || 0); });
            } else if (raw && typeof raw === 'object') {
                Object.keys(raw).forEach(function (k) {
                    const v = raw[k];
                    if (v && typeof v === 'object' && v.houseRoomHrid) res[String(v.houseRoomHrid)] = Number(v.level || 0);
                    else res[String(k)] = Number((v && typeof v === 'object' ? v.level : v) || 0);
                });
            }
        } catch (_) {}
        return res;
    }
    // 影响属性名 → 五项等级字段（与 AURA_STATS.attr 中的叫法对应），并叠加对应房屋等级
    // 返回 { skill: 技能等级, house: 房屋等级, total: 两者之和 }；属性不识别返回 null
    function attrToLevelValue(lv, attr, houseRooms) {
        if (!lv) return null;
        const map = { '攻击': lv.atk, '防御': lv.def, '近战': lv.mel, '远程': lv.rng, '魔法': lv.mag };
        if (!Object.prototype.hasOwnProperty.call(map, attr)) return null;
        const skill = map[attr];
        const house = houseRooms ? Number(houseRooms[HOUSE_ROOM_FOR_ATTR[attr]] || 0) : 0;
        return { skill: skill === null || skill === undefined ? null : skill, house: house, total: (skill || 0) + house };
    }
    // 光环最终值 =（基础值 + 每级成长×（光环等级-1））×（1 + 影响属性等级 × attrGrowth）
    // attrGrowth 取自 AURA_STATS 词条（每级影响属性成长）；光环等级 <1（未装备）返回 null
    function auraFinalValue(stats, auraLevel, attrLevel) {
        if (!stats || auraLevel < 1) return null;
        const g = (stats.attrGrowth === null || stats.attrGrowth === undefined) ? 0 : stats.attrGrowth;
        return (stats.base + stats.growth * (auraLevel - 1)) * (1 + (attrLevel || 0) * g);
    }
    // ── 光环优先级：5 个槽位可配置，队伍人数为 X 时按前 X 个光环推荐最优解 ──
    const AURA_PRIORITY_DEFAULT = ['speed', 'critical', 'physical', '', ''];
    function auraPriorityList() {
        let arr = null;
        try { arr = JSON.parse(localStorage.getItem(K_AURA_PRIORITY) || 'null'); } catch (_) {}
        if (!Array.isArray(arr)) arr = AURA_PRIORITY_DEFAULT;
        return auraPriorityListFromArray(arr);
    }
    function setAuraPriority(arr) {
        try { localStorage.setItem(K_AURA_PRIORITY, JSON.stringify(auraPriorityListFromArray(arr))); } catch (_) {}
    }
    // 校验 + 去重（每种光环只允许携带一个，重复取先出现的，其余置空）
    function auraPriorityListFromArray(arr) {
        const valid = Object.keys(AURA_MAP);
        const out = [];
        const seen = {};
        for (let i = 0; i < 5; i++) {
            const v = Array.isArray(arr) && typeof arr[i] === 'string' && valid.indexOf(arr[i]) >= 0 && !seen[arr[i]] ? arr[i] : '';
            if (v) seen[v] = true;
            out.push(v);
        }
        return out;
    }
    // 队伍人数为 count 时参与推荐的光环键：取优先级列表前 count 槽位（跳过空槽）
    function auraPriorityKeys(count) {
        const list = auraPriorityList();
        const keys = [];
        for (let i = 0; i < Math.min(count || 0, list.length); i++) {
            if (list[i]) keys.push(list[i]);
        }
        return keys;
    }
    // ── 全队唯一性分配：每种光环全队只推荐给一个人，按总值最优 ──
    // membersInfo: [{ au, lv, hr }]（与 infos 一致）；keys: 参与分配的光环键
    // 枚举「每人分配一个互不相同的光环（可不分配）」的所有组合（≤5人×6选=7776，精确解），
    // 取总值最大的组合。返回 { assign: [每人的光环键或 null], options: [每人的 {键: 最终值}] }
    function assignAurasUnique(membersInfo, keys) {
        const options = membersInfo.map(function (x) {
            const vals = {};
            (keys || []).forEach(function (key) {
                const st = AURA_STATS[key];
                if (!st || st.base === null || st.base === undefined) return;   // 数值待补不参与
                const auraLv = x.au && x.au[key] ? Number(x.au[key]) : 0;
                if (auraLv < 1) return;                                        // 未装备不参与
                const attr = attrToLevelValue(x.lv, st.attr, x.hr);
                const val = auraFinalValue(st, auraLv, attr ? attr.total : null);
                if (val !== null) vals[key] = val;
            });
            return vals;
        });
        const used = {};
        let best = null;
        let bestSum = -Infinity;
        const assign = [];
        (function dfs(i, sum) {
            if (i === options.length) {
                if (sum > bestSum) { bestSum = sum; best = assign.slice(); }
                return;
            }
            for (const k in options[i]) {
                if (used[k]) continue;
                used[k] = true; assign.push(k);
                dfs(i + 1, sum + options[i][k]);
                assign.pop(); used[k] = false;
            }
            assign.push(null);          // 该成员不分配，保证任何情况都有解
            dfs(i + 1, sum);
            assign.pop();
        })(0, 0);
        return { assign: best || [], options: options };
    }
    // ── 计算器共享空间（jsonbin）上传状态：就绪/未上传以此为准 ──
    // 解密后的记录形如 { members: [{ name, auras: {revive:…, physical:…,…} }], plan, … }
    const auraServer = { byName: null, fetchedAt: 0, inFlight: false };
    // 拉取共享空间 members 并按 name 建索引。本会话只拉一次（优先复用「拉取排刀」那次
    // 已经拿到的整份记录），不再按时间反复刷新；上传成功后 resetAuraServerCache() 会让它重拉一次。
    async function refreshAuraServerData() {
        if (auraServer.inFlight) return;
        if (auraServer.byName) return;              // 已拉过 → 不再周期性刷新
        const cfg = assignmentConfig();
        if (!cfg) return;
        auraServer.inFlight = true;
        try {
            const key = await deriveKey(cfg.password, cfg.guild);
            // cacheTtl: Infinity → 只要共享缓存里有就直接复用，不发请求
            const data = await cloudFetchRecord(cfg, key, { cacheTtl: Infinity });
            const list = data && Array.isArray(data.members) ? data.members : [];
            const byName = {};
            list.forEach(function (m) {
                if (m && m.name) byName[String(m.name).trim()] = m;
            });
            auraServer.byName = byName;
            auraServer.fetchedAt = Date.now();
        } catch (_) {
            // 失败不设 byName，下次进入队伍页面会自动重试一次
        } finally {
            auraServer.inFlight = false;
            setTimeout(function () { syncAuraRecoInfo(); }, 0);
        }
    }
    // 上传成功后调用：让光环数据下次重新拉一次，避免显示上传前的旧值。
    // 函数声明会提升，uploadLoadoutsToServer 里可以直接调。
    function resetAuraServerCache() {
        auraServer.byName = null;
        auraServer.fetchedAt = 0;
    }
    // 服务器上该 name 的光环等级（找不到或全 0 → null，视为未上传）
    function serverAuraLevels(name) {
        if (!auraServer.byName) return null;
        const m = auraServer.byName[String(name || '').trim()];
        if (!m) return null;
        const au = {};
        let any = false;
        Object.keys(AURA_MAP).forEach(function (k) {
            const v = m.auras ? Number(m.auras[k] || 0) : 0;
            au[k] = v;
            if (v > 0) any = true;
        });
        return any ? au : null;
    }
    // ── 手动录入兜底：服务器找不到或全 0 时，在信息块里直接填八个光环等级 ──
    function readAuraManual() {
        try { return JSON.parse(localStorage.getItem(K_AURA_MANUAL) || '{}') || {}; } catch (_) { return {}; }
    }
    function writeAuraManual(map) {
        try { localStorage.setItem(K_AURA_MANUAL, JSON.stringify(map)); } catch (_) {}
    }
    // 该成员的手动光环（有任一非 0 才算有效，否则 null）
    function manualAuraLevels(map, name) {
        const entry = map[String(name || '').trim()];
        if (!entry || typeof entry !== 'object') return null;
        const au = {};
        let any = false;
        Object.keys(AURA_MAP).forEach(function (k) {
            const v = Number(entry[k] || 0);
            au[k] = v;
            if (v > 0) any = true;
        });
        return any ? au : null;
    }
    // 八个光环输入框（数字，0-99），data-aura-key 供事件委托写回
    function auraInputsHtml(name) {
        const manual = readAuraManual()[String(name || '').trim()] || {};
        let cells = '';
        Object.keys(AURA_MAP).forEach(function (k) {
            const label = ((AURA_STATS[k] && AURA_STATS[k].label) || k).replace(/光环$/, '');
            const v = manual[k] != null ? manual[k] : '';
            cells += '<label style="display:inline-flex;align-items:center;gap:2px;margin:1px 3px;">'
                + '<span style="font-weight:400;opacity:.85">' + label + '</span>'
                + '<input data-aura-key="' + k + '" type="number" min="0" max="99" value="' + v + '"'
                + ' style="width:34px;padding:0 2px;border:1px solid #45598c;border-radius:3px;background:#0e1830;color:#eef3ff;'
                + 'font:11px system-ui,sans-serif;text-align:center"/>'
                + '</label>';
        });
        return '<div style="display:flex;flex-wrap:wrap;justify-content:center;margin-top:3px">' + cells + '</div>';
    }

    // ── 组队界面成员位置下方的状态/推荐信息块 ──
    // 第一行：等级资料（等待资料/资料已采集）；第二行：光环数据（光环未上传/光环数据就绪）；
    // 全员就绪时显示：推荐携带 + 最终值 + 计算过程。
    const AURA_INFO_CLASS = 'kunpo-aura-member-info';
    // 队伍页面内成员名字元素（与抓名逻辑一致，连续重复去重）
    function auraNameElements(container) {
        const els = characterNameLeafEls(container);   // 只取叶子，剔除外层嵌套与徽章数字污染
        const out = [];
        els.forEach(function (el) {
            const t = String(el.textContent || '').trim();
            if (!t || t.length > 20) return;
            if (out.length) {
                const prevT = String(out[out.length - 1].textContent || '').trim();
                if (prevT === t) return;
            }
            out.push(el);
        });
        return out;
    }
    function removeAuraInfoBlocks() {
        document.querySelectorAll('.' + AURA_INFO_CLASS).forEach(function (el) {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
    }
    // 找成员卡根节点：从名字元素向上爬，直到某个祖先同时包含多个成员名字元素为止，
    // 最后一个「只含本人名字元素」的祖先即成员槽根 → 信息块插到它后面（整张卡片下方）。
    // 注意：必须按已收集的名字元素身份计数（node.contains），不能用类名子串重新查询——
    // 角色名组件是嵌套结构，内层元素类名同样含 "characterName" 子串，会误判成多个成员。
    function auraSlotRootFor(nameEl, container, nameEls) {
        if (IS_CN_SITE) {
            // CN 站：卡片是绝对定位（不在文档流），列高只到名字行，宽度估算也不可靠——
            // 直接按「X 与名字中心对齐 + 位于名字下方 + 含精灵图」找到本成员的卡片元素，
            // 列根 = 名字元素与卡片的最近公共祖先（必然同时包含名字行与卡片）
            const nRect = nameEl.getBoundingClientRect();
            const cx = nRect.left + nRect.width / 2;
            let sprite = null;
            const sprites = container.querySelectorAll('img, svg, canvas');
            for (const s of sprites) {
                const r = s.getBoundingClientRect();
                if (r.width < 30 || r.height < 30) continue;          // 跳过小图标/装饰
                if (cx < r.left || cx > r.right) continue;            // X 与名字中心对齐
                if (r.top < nRect.bottom - 4) continue;               // 位于名字下方
                if (!sprite || r.top < sprite.getBoundingClientRect().top) sprite = s;   // 取最靠上的
            }
            if (!sprite) return nameEl.parentNode;
            // 卡片框：从精灵图向上爬到宽度不再明显增长的祖先（带边框的卡片容器）
            let cardEl = sprite;
            let w = sprite.getBoundingClientRect().width;
            let p = sprite.parentElement;
            while (p && p !== container.parentNode && !p.contains(nameEl)) {
                const pw = p.getBoundingClientRect().width;
                if (pw <= w * 1.05) break;
                cardEl = p; w = pw;
                p = p.parentElement;
            }
            nameEl.__cnCard = cardEl;
            const lca = auraCommonAncestor([nameEl, cardEl]);
            return lca || nameEl.parentNode;
        }
        let root = nameEl;
        let node = nameEl.parentNode;
        while (node && node !== container && node.nodeType === 1) {
            let count = 0;
            for (let i = 0; i < nameEls.length; i++) {
                if (node.contains(nameEls[i])) count++;
                if (count > 1) break;
            }
            if (count > 1) break;
            root = node;
            node = node.parentNode;
        }
        return root;
    }
    // 最近公共祖先：候选按「离 els[0] 由近到远」排列，过滤包含其余名字元素的节点，取最近一个
    function auraCommonAncestor(els) {
        if (!els.length) return null;
        let candidates = [];
        let node = els[0].parentNode;
        while (node && node.nodeType === 1) { candidates.push(node); node = node.parentNode; }
        for (let i = 1; i < els.length; i++) {
            candidates = candidates.filter(function (c) { return c.contains(els[i]); });
            if (!candidates.length) return null;
        }
        return candidates.length ? candidates[0] : null;
    }
    // CN 站诊断日志（节流：同一原因只打一次）
    let lastCnAuraLog = '';
    function cnAuraLog(msg) {
        if (lastCnAuraLog === msg) return;
        lastCnAuraLog = msg;
        try { console.info('[KUNPO][CN] ' + msg); } catch (_) {}
    }
    // CN 站列内可见元素的最大底边：卡片是绝对定位不占列高，列自身高度只到名字行，
    // 直接用列根 bottom 会让块盖在卡片上；取列内所有可见元素（含绝对定位的卡片）的最大底边
    function cnColumnBottom(root) {
        let bottom = root.getBoundingClientRect().bottom;
        try {
            const all = root.querySelectorAll('*');
            for (let i = 0; i < all.length; i++) {
                const c = all[i];
                // 排除信息块及其所有后代：块是 fixed 且随本函数移动，
                // 若把块内元素的底边算进来，下一帧块会被自己推着无限下移
                if (c.closest && c.closest('.' + AURA_INFO_CLASS)) continue;
                const r = c.getBoundingClientRect();
                if (r.height > 1 && r.width > 1 && r.bottom > bottom) bottom = r.bottom;
            }
        } catch (_) {}
        return bottom;
    }
    // CN 站「修改队伍」编辑模式检测：编辑面板的槽位配置行含「最低等级/最高等级」字样
    function cnPartyEditMode() {
        try {
            const container = document.querySelector('[class*="Party_page"]') || document.querySelector('[class^="Party_"]');
            if (!container) return false;
            const text = container.textContent || '';
            return text.indexOf('最低等级') >= 0 && text.indexOf('最高等级') >= 0;
        } catch (_) { return false; }
    }
    // CN 站信息块重定位：左/宽取列根（整列）矩形，顶部取「列内最大底边」（fixed 不受 overflow 裁剪影响）
    function repositionCnAuraBlocks() {
        if (cnPartyEditMode()) {   // 编辑模式：块会挡住槽位操作区 → 隐藏
            document.querySelectorAll('.' + AURA_INFO_CLASS).forEach(function (b) { b.style.display = 'none'; });
            return;
        }
        document.querySelectorAll('.' + AURA_INFO_CLASS).forEach(function (block) {
            const root = block.__cnSlotRoot;
            if (!root || !root.isConnected) {
                if (block.parentNode) block.parentNode.removeChild(block);
                return;
            }
            const r = root.getBoundingClientRect();
            if (r.width < 10) { if (block.style.display !== 'none') block.style.display = 'none'; return; }
            if (block.style.display !== '') block.style.display = '';
            // 仅在实际变化时才写样式：避免重复 mutation 反复触发 Observer，也减少无谓重排
            const left = Math.round(r.left) + 'px';
            const width = Math.round(r.width) + 'px';
            const top = Math.round(cnColumnBottom(root) + 4) + 'px';
            if (block.style.left !== left) block.style.left = left;
            if (block.style.width !== width) block.style.width = width;
            if (block.style.top !== top) block.style.top = top;
        });
    }
    let cnAuraPosInstalled = false;
    function ensureCnAuraPosListeners() {
        if (cnAuraPosInstalled) return;
        cnAuraPosInstalled = true;
        window.addEventListener('scroll', repositionCnAuraBlocks, true);   // capture：捕获内部滚动容器
        window.addEventListener('resize', repositionCnAuraBlocks);
    }
    // 按当前数据同步每个成员名字下方的信息块（内容无变化时不重写，避免触发 Observer 死循环）
    function syncAuraRecoInfo() {
        // 两站通用：scoped 容器（全文档查询会混入聊天/公会等面板的 100+ 隐藏名字组件，不可用）
        const container = document.querySelector('[class*="Party_page"]') || document.querySelector('[class^="Party_"]');
        if (!auraRecoEnabled() || !container) {
            if (IS_CN_SITE) cnAuraLog('跳过: enabled=' + auraRecoEnabled()
                + ' container=' + (container ? 'ok' : 'null'));
            removeAuraInfoBlocks(); return;
        }
        void refreshAuraServerData();   // 缓存过期时后台拉取共享空间数据，完成后会再触发一次同步
        if (IS_CN_SITE && cnPartyEditMode()) {
            // CN 站「修改队伍」编辑模式：信息块会挡住槽位操作区 → 移除，退出编辑后自动恢复
            cnAuraLog('编辑模式，隐藏信息块');
            removeAuraInfoBlocks(); return;
        }
        const members = collectPartyMemberNames();
        const nameEls = auraNameElements(container);
        if (!members.length || members.length !== nameEls.length) {
            if (IS_CN_SITE) cnAuraLog('跳过: members=' + members.length + ' nameEls=' + nameEls.length);
            removeAuraInfoBlocks(); return;
        }
        const profileMap = readPartyProfileMap();
        const myId = state.character ? String(state.character.id) : '';
        const selfHr = normalizeHouseRoomMap(state.houseRoomMap || null);
        const manualMap = readAuraManual();
        const infos = members.map(function (m) {
            const isSelf = m.id && m.id === myId;
            const info = profileMap[m.id] || {};
            const lv = isSelf ? selfCombatLevels() : (info.lv || null);
            const hr = isSelf ? selfHr : (info.hr || null);
            // 光环数据源：服务器（计算器共享空间上传）→ 手动录入；都不存在 → 未上传
            const serverAu = serverAuraLevels(m.name);
            const manualAu = manualAuraLevels(manualMap, m.name);
            const au = serverAu || manualAu || null;
            return {
                name: m.name, lv: lv, au: au, hr: hr,
                ready: !!lv,
                auraSource: serverAu ? 'server' : (manualAu ? 'manual' : null),
                auraReady: !!(serverAu || manualAu),
            };
        });
        // 只对「资料+光环都就绪」的成员做唯一性分配（每种光环只给一人，总值最优）。
        // 以前要求全员就绪才开始推荐：只要一个人没采到资料/没上传光环，全队都看不到推荐。
        // 现在未就绪成员继续显示等待提示，不再拖累其他人；其数据补齐后会自动重算分配。
        const readyPos = [];
        infos.forEach(function (x, i) { if (x.ready && x.auraReady) readyPos.push(i); });
        const recoKeys = auraPriorityKeys(members.length);
        const allocation = (readyPos.length && recoKeys.length)
            ? assignAurasUnique(readyPos.map(function (i) { return infos[i]; }), recoKeys)
            : null;
        nameEls.forEach(function (el, i) {
            try {
            const x = infos[i];
            const rp = readyPos.indexOf(i);   // 该成员在「就绪成员分配结果」里的下标（未就绪为 -1）
            let html;
            const showInputs = !x.auraReady || x.auraSource === 'manual';
            const status1 = x.ready ? '资料已采集' : '点击玩家角色查看面板';
            const status2 = x.auraReady
                ? ('光环数据就绪' + (x.auraSource === 'manual' ? '（手动）' : ''))
                : '光环未上传或非本公会';
            if (allocation && rp >= 0 && allocation.assign[rp]) {
                const recKey = allocation.assign[rp];
                const st = AURA_STATS[recKey];
                const auraLv = Number(x.au[recKey] || 0);
                const a = attrToLevelValue(x.lv, st.attr, x.hr);
                const val = Math.round(allocation.options[rp][recKey] * 100) / 100;
                // 三行格式：推荐XX光环：最终值% / 光环等级：XX / 属性 等级+房屋等级
                const skillText = (a && a.skill !== null && a.skill !== undefined) ? a.skill : '-';
                const houseText = (a && a.house) ? '+' + a.house : '+0';
                // 计算过程保留在悬停提示
                const calc = '(' + st.base + '+' + st.growth + '×' + (auraLv - 1) + ')×(1+' + (a ? a.total : 0) + '×' + st.attrGrowth + ')=' + val;
                html = '<div title="' + calc + '">推荐：' + st.label + '：' + val + '%</div>'
                    + '<div>光环等级：' + auraLv + '</div>'
                    + '<div>' + (st.attr || '') + ' ' + skillText + houseText + '</div>';
            } else if (rp >= 0) {
                // 就绪但没分到光环（未装备优先级里的任一光环）
                html = '<div>资料已采集</div><div>无可推荐光环</div>';
            } else {
                html = '<div>' + status1 + '</div><div>' + status2 + '</div>';
            }
            if (showInputs) html += auraInputsHtml(x.name);
            // 信息块放进成员列根节点内部末尾：撑高根节点，显示在整张卡片下方（不新增网格列）
            const slotRoot = auraSlotRootFor(el, container, nameEls);
            if (!slotRoot || !slotRoot.parentNode) return;
            let block = null;
            for (let i = 0; i < slotRoot.children.length; i++) {
                const c = slotRoot.children[slotRoot.children.length - 1 - i];
                if (c.classList && c.classList.contains(AURA_INFO_CLASS)) { block = c; break; }
            }
            if (!block) {
                block = document.createElement('div');
                block.className = AURA_INFO_CLASS;
                block.style.cssText = IS_CN_SITE
                    ? // CN 站：fixed 视口定位（列根可能带 overflow:hidden，absolute 会被裁剪），坐标由 reposition 计算
                      'position:fixed;z-index:60;padding:2px 8px;border-radius:4px;background:#0e1b3a;color:#fff;'
                    + 'font:700 11px/1.5 system-ui,sans-serif;text-align:center;min-height:56px;box-sizing:border-box;'
                    + 'display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;'
                    : 'margin-top:4px;padding:2px 8px;border-radius:4px;background:#0e1b3a;color:#fff;'
                    + 'font:700 11px/1.5 system-ui,sans-serif;text-align:center;width:100%;min-height:56px;box-sizing:border-box;'
                    + 'display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;pointer-events:none';
                // 手动录入写回：input 实时保存，change（失焦）后刷新推荐
                block.addEventListener('input', function (e) {
                    const t = e.target;
                    if (!t || !t.dataset || !t.dataset.auraKey) return;
                    const name = block.dataset.memberName || '';
                    if (!name) return;
                    const map = readAuraManual();
                    const entry = Object.assign({}, map[name] || {});
                    const v = Math.max(0, Math.min(99, Number(t.value) || 0));
                    if (v > 0) entry[t.dataset.auraKey] = v; else delete entry[t.dataset.auraKey];
                    map[name] = entry;
                    writeAuraManual(map);
                    syncAuraRecoInfo();
                });
                block.addEventListener('change', function () { syncAuraRecoInfo(); });
                // 阻止点击冒泡到游戏的事件委托（否则点击信息块会触发打开角色资料）
                ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup'].forEach(function (evt) {
                    block.addEventListener(evt, function (e) { e.stopPropagation(); });
                });
                if (IS_CN_SITE) {
                    block.__cnSlotRoot = slotRoot;        // 供列内最大底边扫描
                    block.__cnCard = el.__cnCard || null; // 供左/宽定位（卡片矩形）
                    ensureCnAuraPosListeners();
                }
                slotRoot.appendChild(block);
            }
            block.dataset.memberName = x.name;
            // 有输入框时展开高度并开放鼠标交互；否则固定 56px 且不响应指针
            const wantPE = showInputs ? 'auto' : 'none';
            const wantH = showInputs ? 'auto' : '56px';
            if (block.style.pointerEvents !== wantPE) block.style.pointerEvents = wantPE;
            if (block.style.height !== wantH) block.style.height = wantH;
            // 正在输入时不重写 innerHTML，避免输入框失焦
            const active = document.activeElement;
            if (!(active && block.contains(active) && showInputs) && block.dataset.sig !== html) {
                block.innerHTML = html;
                block.dataset.sig = html;
            }
            } catch (e) { if (IS_CN_SITE) try { console.warn('[KUNPO][CN] 渲染异常:', e); } catch (_) {} }
        });
        if (IS_CN_SITE) {
            repositionCnAuraBlocks();
            cnAuraLog('信息块已渲染: ' + members.length + ' 个');
        }
    }

    // ── 光环优先级弹窗：5 个槽位，每个左侧「光环N」、右侧从八个光环中单选 ──
    // 保存后，队伍人数为 X 时按前 X 个光环为每名成员推荐最终值最高的最优解
    function openAuraPriorityModal() {
        const old = document.getElementById('kunpo-aura-priority-modal');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        const list = auraPriorityList();
        const overlay = document.createElement('div');
        overlay.id = 'kunpo-aura-priority-modal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center';
        const box = document.createElement('div');
        box.style.cssText = 'min-width:300px;max-width:90vw;padding:16px 18px;border-radius:10px;background:rgba(15,24,48,.97);'
            + 'border:1px solid #6f9bd8;color:#eef3ff;font:600 12px/1.6 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)';
        const title = document.createElement('div');
        title.textContent = '光环优先级';
        title.style.cssText = 'font-size:14px;margin-bottom:6px';
        const hint = document.createElement('div');
        hint.textContent = '队伍人数为 X 时，按前 X 个光环为每名成员推荐最终值最高的最优解；选「（不参与）」跳过该槽位';
        hint.style.cssText = 'color:#7f93bb;font-weight:400;font-size:11px;margin-bottom:10px';
        box.appendChild(title);
        box.appendChild(hint);
        const selects = [];
        for (let i = 0; i < 5; i++) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px';
            const lab = document.createElement('span');
            lab.textContent = '光环' + (i + 1);
            lab.style.cssText = 'width:44px;color:#c3d2f2;flex-shrink:0';
            const sel = document.createElement('select');
            sel.style.cssText = 'flex:1;padding:4px 6px;border:1px solid #45598c;border-radius:5px;background:#0e1830;color:#eef3ff;font:12px system-ui,sans-serif';
            sel.appendChild(new Option('（不参与）', ''));
            Object.keys(AURA_MAP).forEach(function (k) {
                sel.appendChild(new Option((AURA_STATS[k] && AURA_STATS[k].label) || k, k));
            });
            sel.value = list[i] || '';
            row.appendChild(lab);
            row.appendChild(sel);
            box.appendChild(row);
            selects.push(sel);
        }
        // 唯一性约束：每种光环只携带一个 → 其他槽位中已选的光环禁用（灰色不可选）
        function refreshAuraAvailability() {
            const chosen = selects.map(function (s) { return s.value; }).filter(Boolean);
            selects.forEach(function (s) {
                Array.from(s.options).forEach(function (opt) {
                    if (!opt.value) { opt.disabled = false; return; }
                    opt.disabled = chosen.indexOf(opt.value) >= 0 && s.value !== opt.value;
                });
            });
        }
        selects.forEach(function (sel) { sel.addEventListener('change', refreshAuraAvailability); });
        refreshAuraAvailability();
        const btns = document.createElement('div');
        btns.style.cssText = 'display:flex;gap:8px;margin-top:12px';
        const mkBtn = function (text, bg) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = text;
            b.style.cssText = 'border:0;border-radius:6px;padding:5px 10px;background:' + bg + ';color:#fff;cursor:pointer;font:600 12px/1 system-ui,sans-serif';
            return b;
        };
        const save = mkBtn('保存', '#0a84ff');
        save.addEventListener('click', function () {
            setAuraPriority(selects.map(function (s) { return s.value; }));
            overlay.parentNode.removeChild(overlay);
            syncAuraRecoInfo();   // 立即按新优先级刷新组队界面信息块
            showAssignmentToast('光环优先级已保存', 3000);
        });
        // 清除缓存：删掉本功能生成的成员信息缓存（队友资料 + 成员名映射），信息块回到「等待资料」
        const clearCache = mkBtn('清除缓存', '#b45309');
        clearCache.addEventListener('click', function () {
            [PARTY_PROFILE_KEY, PARTY_NAME_CACHE_KEY].forEach(function (k) {
                try { localStorage.removeItem(k); } catch (_) {}
            });
            syncAuraRecoInfo();
            showAssignmentToast('已清除光环推荐的成员信息缓存', 3000);
        });
        const close = mkBtn('关闭', '#344879');
        close.addEventListener('click', function () { overlay.parentNode.removeChild(overlay); });
        btns.appendChild(save);
        btns.appendChild(clearCache);
        btns.appendChild(close);
        box.appendChild(btns);
        overlay.appendChild(box);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.parentNode.removeChild(overlay); });
        document.body.appendChild(overlay);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ▼ 操作计数：设置里勾选后监听本页鼠标点击次数，本地累计（按角色隔离），
    //   显示在「数据就绪，当前职位」状态行的下一行。默认不勾选。
    // ═══════════════════════════════════════════════════════════════════════
    const clickCounter = { installed: false, session: 0, handler: null };
    // 严格按角色隔离：只读「键::角色名」，不回退全局键，杜绝角色间混计。
    function clickCountEnabled() {
        try {
            const n = currentCharacterName();
            return localStorage.getItem(n ? (K_COUNT_CLICKS + '::' + n) : K_COUNT_CLICKS) === '1';
        } catch (_) { return false; }
    }
    function clickCountTotal() {
        try {
            const n = currentCharacterName();
            return Number(localStorage.getItem(n ? (K_CLICK_COUNT + '::' + n) : K_CLICK_COUNT)) || 0;
        } catch (_) { return 0; }
    }
    function updateClickCountLine() {
        if (!state.clickCountText) return;
        if (!clickCountEnabled()) { state.clickCountText.style.display = 'none'; return; }
        state.clickCountText.style.display = '';
        state.clickCountText.textContent = '操作计数：累计 ' + clickCountTotal()
            + '（本页 +' + clickCounter.session + '）';
    }
    function onCountedClick() {
        if (!currentCharacterName()) return;   // 角色名未读到 → 不计数，避免写进全局键混入其他角色
        clickCounter.session++;
        writeCfg(K_CLICK_COUNT, String(clickCountTotal() + 1));
        updateClickCountLine();
    }
    function setClickCounter(on) {
        if (on && !clickCounter.installed) {
            clickCounter.handler = onCountedClick;
            document.addEventListener('click', clickCounter.handler, true); // 捕获阶段：页面所有点击都算
            clickCounter.installed = true;
        } else if (!on && clickCounter.installed) {
            if (clickCounter.handler) document.removeEventListener('click', clickCounter.handler, true);
            clickCounter.handler = null;
            clickCounter.installed = false;
        }
        updateClickCountLine();
    }

    // ── 报名与排刀一致性检查（仅会长可见按钮）────────────────────────────
    // 数据源：游戏 GameState 的 guildCharacterDict（真实报名：signedUpSkilling/CombatTrialHrid）
    //        + 共享排刀 assignmentState.doc（m: 名字→[生活试炼idx, 战斗位掩码, 职业]；k: 试炼idx→技能idx）
    function signupNameMap(gs) {
        const out = {};
        try {
            const sharable = gs && (gs.guildSharableCharacterMap || gs.guildSharableCharacterDict);
            if (sharable instanceof Map) {
                for (const [k, v] of sharable.entries()) {
                    const nm = String((v && (v.name ?? v.characterName)) || '').trim();
                    if (nm) out[String(k)] = nm;
                }
            } else if (sharable && typeof sharable === 'object') {
                for (const [k, v] of Object.entries(sharable)) {
                    const nm = String((v && (v.name ?? v.characterName)) || '').trim();
                    if (nm) out[k] = nm;
                }
            }
        } catch (_) {}
        return out;
    }
    function collectSignupMismatches(gs) {
        const plan = assignmentState.doc;
        if (!plan || !plan.m) return { error: '尚未获取排刀，请先进入公会试炼界面或点「显示排刀」' };
        const nameById = signupNameMap(gs);
        // characterID → 游戏内真实报名
        const signups = {};
        try {
            const chars = gs && (gs.guildCharacterDict || gs.guildCharacterMap);
            const rows = chars instanceof Map ? [...chars.entries()] : Object.entries(chars || {});
            for (const [key, row] of rows) {
                if (!row || typeof row !== 'object') continue;
                const cid = String(row.characterID ?? row.characterId ?? key);
                const nm = nameById[cid] || '';
                if (!nm) continue;
                signups[nm] = {
                    skilling: String(row.signedUpSkillingTrialHrid || '').trim(),
                    combat: String(row.signedUpCombatTrialHrid || '').trim(),
                };
            }
        } catch (_) {}
        const lines = [];
        const seen = new Set();
        const lifeSkillName = idx => {
            const k = Array.isArray(plan.k) ? Number(plan.k[idx]) : NaN;
            return (Number.isInteger(k) && k >= 0 && k < SKILL_LABELS_CN.length) ? SKILL_LABELS_CN[k] : '';
        };
        Object.keys(plan.m).forEach(function (name) {
            const entry = plan.m[name];
            if (!Array.isArray(entry) || entry.length < 2) return;
            seen.add(name);
            const lifeIdx = Number(entry[0]);
            const mask = Number(entry[1]) || 0;
            const su = signups[name];
            if (!su) return; // 公会数据里没有这个人 → 跳过
            // 生活
            if (Number.isInteger(lifeIdx) && lifeIdx >= 0) {
                const want = lifeSkillName(lifeIdx);
                const wantHrid = (function () {
                    const k = Array.isArray(plan.k) ? Number(plan.k[lifeIdx]) : NaN;
                    return (Number.isInteger(k) && k >= 0 && k < SKILL_KEYS.length) ? ('/guild_skilling/' + SKILL_KEYS[k]) : '';
                })();
                if (!su.skilling) lines.push(name + ' · 生活：未报名（应为 ' + want + '）');
                else if (wantHrid && su.skilling.toLowerCase() !== wantHrid.toLowerCase()) {
                    const got = String(su.skilling).split('/').pop();
                    const gotZh = SKILL_LABELS_CN[SKILL_KEYS.indexOf(got)] || got;
                    lines.push(name + ' · 生活：报了 ' + gotZh + '，应为 ' + want);
                }
            }
            // 战斗
            const wantSlugs = [];
            for (let i = 0; i < BATTLE_TRIAL_SLUGS.length; i++) if (mask & (1 << i)) wantSlugs.push(BATTLE_TRIAL_SLUGS[i]);
            if (wantSlugs.length) {
                const wantZh = wantSlugs.map(s => (BATTLE_TRIAL_ZH[s] || s)).join('/');
                if (!su.combat) lines.push(name + ' · 战斗：未报名（应为 ' + wantZh + '）');
                else {
                    const gotSlug = String(su.combat).split('/').pop().toLowerCase();
                    if (wantSlugs.indexOf(gotSlug) < 0) {
                        const gotZh = BATTLE_TRIAL_ZH[gotSlug] || gotSlug;
                        lines.push(name + ' · 战斗：报了 ' + gotZh + '，应为 ' + wantZh);
                    }
                }
            } else if (su.combat) {
                const gotZh = BATTLE_TRIAL_ZH[String(su.combat).split('/').pop()] || String(su.combat).split('/').pop();
                lines.push(name + ' · 战斗：排刀无战斗但报了 ' + gotZh);
            }
        });
        // 排刀里没有、但游戏里报了名的人
        Object.keys(signups).forEach(function (name) {
            if (seen.has(name)) return;
            const su = signups[name];
            const parts = [];
            if (su.skilling) { const s = String(su.skilling).split('/').pop(); parts.push('生活 ' + (SKILL_LABELS_CN[SKILL_KEYS.indexOf(s)] || s)); }
            if (su.combat) { const s = String(su.combat).split('/').pop(); parts.push('战斗 ' + (BATTLE_TRIAL_ZH[s] || s)); }
            if (parts.length) lines.push(name + ' · 不在排刀中（已报 ' + parts.join('，') + '）');
        });
        return { lines: lines };
    }
    function showSignupModal(lines) {
        const old = document.getElementById('kunpo-signup-modal');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        const overlay = document.createElement('div');
        overlay.id = 'kunpo-signup-modal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center';
        const box = document.createElement('div');
        box.style.cssText = 'width:min(560px,92vw);max-height:80vh;display:flex;flex-direction:column;padding:16px;border-radius:12px;'
            + 'background:linear-gradient(145deg,#152447,#1d3566);color:#eef3ff;border:1px solid #6f9bd8;box-shadow:0 10px 28px rgba(3,10,26,.55);font:12.5px/1.5 system-ui,sans-serif';
        const title = document.createElement('div');
        title.style.cssText = 'font-weight:700;font-size:15px;margin-bottom:10px;color:#ff737b';
        title.textContent = lines.length ? ('报名与排刀不一致：' + lines.length + ' 处') : '报名与排刀全部一致';
        const close = document.createElement('button');
        close.type = 'button'; close.textContent = '×';
        close.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:0;color:#c3d2f2;font:700 20px/1 system-ui;cursor:pointer';
        close.addEventListener('click', function () { overlay.remove(); });
        const list = document.createElement('div');
        list.style.cssText = 'overflow:auto;white-space:pre-wrap;padding-right:6px';
        list.textContent = lines.length ? lines.join('\n') : '所有成员的生活/战斗报名均与排刀一致。';
        box.style.position = 'relative';
        box.appendChild(close);
        box.appendChild(title);
        box.appendChild(list);
        overlay.appendChild(box);
        overlay.addEventListener('click', function (ev) { if (ev.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
    }
    function runSignupCheck() {
        const gs = getGameState();
        if (!gs) { showAssignmentToast('尚未读取到游戏数据'); return; }
        const res = collectSignupMismatches(gs);
        if (res.error) { showAssignmentToast(res.error); return; }
        showSignupModal(res.lines || []);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ══ 版本检查：拉取远程脚本头部的 @version，落后时页面内横幅提醒 ═════════
    // 脚本管理器（Tampermonkey 等）的自动更新是静默后台完成的，用户可能长期
    // 停留在旧版；这里主动对比远程版本并弹出可点击横幅，引导用户前往更新。
    // 主源 raw.githubusercontent.com 失败时回退 jsDelivr 镜像（部分地区直连
    // GitHub raw 不稳定）。自动检查每天最多一次；用户关闭横幅后，同一版本
    // 不再重复打扰，直到更新的版本发布。
    // ═══════════════════════════════════════════════════════════════════════
    const UPDATE_CHECK_KEY = 'kunpo_update_last_check';
    const UPDATE_DISMISS_KEY = 'kunpo_update_dismissed';
    const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
    const UPDATE_PRIMARY_URL = 'https://raw.githubusercontent.com/Chen19970809/MWI_Trial_Calculator/refs/heads/main/KUNPO%E8%AF%95%E7%82%BC%E4%B8%93%E7%94%A8.user.js';
    const UPDATE_FALLBACK_URL = 'https://cdn.jsdelivr.net/gh/Chen19970809/MWI_Trial_Calculator@main/KUNPO%E8%AF%95%E7%82%BC%E4%B8%93%E7%94%A8.user.js';
    // 语义化版本比较：'1.2.10' > '1.2.9'，缺段按 0 补齐，忽略非数字后缀。
    function compareVersions(a, b) {
        const pa = String(a).split('.').map(s => parseInt(s, 10) || 0);
        const pb = String(b).split('.').map(s => parseInt(s, 10) || 0);
        const len = Math.max(pa.length, pb.length);
        for (let i = 0; i < len; i++) {
            const d = (pa[i] || 0) - (pb[i] || 0);
            if (d !== 0) return d > 0 ? 1 : -1;
        }
        return 0;
    }
    // 只解析 ==UserScript== 元数据块里的 @version，避免误匹配正文。
    function remoteVersionFromMeta(text) {
        const head = String(text || '').split('// ==/UserScript==')[0] || '';
        const m = head.match(/@version\s+([^\s\r\n]+)/);
        return m ? m[1] : null;
    }
    function showUpdateBanner(remoteVersion, installUrl) {
        if (document.getElementById('kunpo-update-banner')) return;
        const el = document.createElement('div');
        el.id = 'kunpo-update-banner';
        el.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:rgba(20,26,44,.97);color:#eef3ff;border:1px solid #d8a44f;font:600 12px/1.4 system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.45)';
        const info = document.createElement('span');
        info.textContent = 'KUNPO 脚本有新版本：' + remoteVersion + '（当前 ' + SCRIPT_VERSION + '）';
        const go = document.createElement('a');
        go.textContent = '前往更新';
        go.href = installUrl;
        go.target = '_blank';
        go.rel = 'noopener';
        go.style.cssText = 'color:#8fc3ff;font-weight:700;text-decoration:underline;cursor:pointer;white-space:nowrap';
        const close = document.createElement('span');
        close.textContent = '×';
        close.title = '本次忽略该版本';
        close.style.cssText = 'cursor:pointer;font:700 16px/1 system-ui;color:#c3d2f2;padding:0 2px';
        close.addEventListener('click', function () {
            try { localStorage.setItem(UPDATE_DISMISS_KEY, remoteVersion); } catch (_) {}
            el.remove();
        });
        el.appendChild(info);
        el.appendChild(go);
        el.appendChild(close);
        document.body.appendChild(el);
    }
    async function checkForUpdate(opts) {
        const force = !!(opts && opts.force);
        if (!force) {
            let last = 0;
            try { last = Number(localStorage.getItem(UPDATE_CHECK_KEY)) || 0; } catch (_) {}
            if (Date.now() - last < UPDATE_CHECK_INTERVAL_MS) return;
        }
        try { localStorage.setItem(UPDATE_CHECK_KEY, String(Date.now())); } catch (_) {}
        let remoteVersion = null;
        let installUrl = UPDATE_PRIMARY_URL;
        const r1 = await httpGet(UPDATE_PRIMARY_URL);
        if (r1.status >= 200 && r1.status < 300) {
            remoteVersion = remoteVersionFromMeta(r1.responseText || '');
        } else {
            const r2 = await httpGet(UPDATE_FALLBACK_URL);
            if (r2.status >= 200 && r2.status < 300) {
                remoteVersion = remoteVersionFromMeta(r2.responseText || '');
                installUrl = UPDATE_FALLBACK_URL;
            }
        }
        if (!remoteVersion) {
            if (force) showAssignmentToast('检查更新失败：无法获取远程版本');
            return;
        }
        if (compareVersions(remoteVersion, SCRIPT_VERSION) > 0) {
            let dismissed = '';
            try { dismissed = localStorage.getItem(UPDATE_DISMISS_KEY) || ''; } catch (_) {}
            if (!force && dismissed === remoteVersion) return;
            showUpdateBanner(remoteVersion, installUrl);
            if (force) showAssignmentToast('发现新版本：' + remoteVersion);
        } else if (force) {
            showAssignmentToast('已是最新版本：' + SCRIPT_VERSION);
        }
    }

    function boot() {
        checkLastSeenVersion();   // 版本升级弹窗（全局，所有角色共用一条记录）
        mountExportUi();
        initAssignment();
        addAuraRecoButton();
        void checkForUpdate();
    }

    if (window.__mwiSingleCleanup) window.__mwiSingleCleanup();
    window.__mwiSingleCleanup = cleanupStatusPolling;
    window.addEventListener('beforeunload', cleanupStatusPolling);

    function safeBoot() {
        try { boot(); } catch (e) { console.error('[KUNPO] 初始化失败：', e); }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeBoot, { once: true });
    } else {
        safeBoot();
    }
})();
