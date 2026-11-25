// ==UserScript==
// @name         KUNPO试炼专用
// @namespace    https://www.milkywayidle.com/
// @version      1.1.4
// @description  上传等级、成就、房屋、迷宫配装、神龛到计算器
// @author       MonsterFC、MusoAlpha、KUNPO成员测试
// @license      MIT
// @match        https://www.milkywayidle.com/*
// @match        https://www.milkywayidlecn.com/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @downloadURL  https://raw.githubusercontent.com/Chen19970809/MWI_Trial_Calculator/refs/heads/main/KUNPO%E8%AF%95%E7%82%BC%E4%B8%93%E7%94%A8.user.js
// @updateURL    https://raw.githubusercontent.com/Chen19970809/MWI_Trial_Calculator/refs/heads/main/KUNPO%E8%AF%95%E7%82%BC%E4%B8%93%E7%94%A8.user.js
// @homepageURL https://github.com/Chen19970809/MWI_Trial_Calculator

// @connect      api.jsonbin.io
// @connect      1315858741-5moib0woaa.ap-shanghai.tencentscf.com
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// ==/UserScript==

(function () {
    'use strict';

    const SCRIPT_VERSION = '1.1.4';
    // Performance revision for the 1.1.1 release.
    const PERFORMANCE_REVISION = '2026-09-30.1';

    // ── 更新日志：key = 版本号，value = 中文更新内容；发新版本时在顶部加一条即可 ──
    const CHANGELOG = {
        '1.1.4': '1. 修复周四上传提醒偶发不展开：补充数据就绪、跨日及返回页面检查；按角色核对上传记录；自动静默不再挡住上传提醒\n'
            + '2.内嵌全部45个技能与光环图标，移除外部图标服务器依赖；图标异常时保留提示',
        '1.1.3': '1. 周四强制打开窗口提醒成员更新配装\n'
            + '2. 重新排列按钮图标\n'
            + '3. 职业管理',
        '1.1.2': '1. DIY插件新增极简版，不喜欢过多功能或者游戏卡顿的伙伴可以前往下载\n'
            + '2. fix bug 过期排刀仍然高亮\n'
            + '3. 计算器预设\n'
            + '4. TODO 职业\n',
        '1.1.1': '1. 新增DIY插件分享，可以方便的下载群友DIY升级的插件\n'
            + '2. 上传神龛，后续模拟试炼使用真实神龛数据\n'
            + '3. 地牢光环推荐支持固定无敌、复活，鼠标悬停可查看角色所有光环等级\n'
            + '4. 新增显示升级时间，技能提示框显示升级所需/具体时间，默认不启用\n'
            + '5. 新增显示动作页面库存，默认不启用\n'
            + '6. 性能优化：失败请求退避、避免库存与排刀重复刷新、缓存配装与光环定位、降低监听和内存开销',
        '1.1.0': '1. 实现战斗试炼同职业不同怪物分别配置技能\n'
            + '2. 新增未参加战斗试炼的提示\n'
            + '3. fix bug 技能配置不显示 ',
        '1.0.9': '1. 修复CN网站因排行榜徽章导致的卡死\n'
            + '2. 折叠老版本更新日志\n'
            + '3. 作者栏新增成员\n'
            + '4. 删除打开计算器按钮（数据安全问题无法开放使用）',
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

    // ═══════════════════════════════════════════════════════════════════════
    // ══ DIY插件分享：条目全部在下面 DIY_SHARE_ITEMS 中配置 ══════════════════
    // 每个条目三个变量：
    //   name    第一行名称（大字体显示，点击名称跳转到 url）
    //   url     下载链接（新标签页打开）
    //   content 第二行 DIY 内容（标准字体，支持 \n 换行）
    // 示例里是三个占位条目，直接改 name / url / content 或增删条目即可。
    // ═══════════════════════════════════════════════════════════════════════
    const DIY_SHARE_ITEMS = Object.freeze([
        {
            name: 'KUNPO试炼专用极简版',
            url: 'https://github.com/Chen19970809/MWI_Trial_Calculator/raw/refs/heads/main/KUNPO%E8%AF%95%E7%82%BC%E4%B8%93%E7%94%A8%E6%9E%81%E7%AE%80%E7%89%88.user.js',
            content: '-2026年9月30号17点34，梦想在QQ群说我把K写的太屎了，所以搞了个极简版\n'
                + '-除了必须功能外没有多余功能',
        },
        {
            name: '铁牛计算器',
            url: 'https://raw.githubusercontent.com/RERoger/mwi-calculator/main/dist/mwi-calculator.user.js',
            content: '-支持点击计算器缺口面板中的物品自动跳转至动作面板，并自动输入数量\n'
                + '-支持输入本地其他角色UID一键复制物品列表\n'
                + '-支持输入多个关键词以空格隔开搜索（如超级 咖啡）\n'
                + '-取消勾选物品颜色区分显示\n'
                + '-支持整个大类添加物品',
        },
        {
            name: '铁牛计算器-预设版',
            url: 'https://raw.githubusercontent.com/Chen19970809/MWI_Trial_Calculator/refs/heads/main/mwi-calculator.user.js',
            content: '-在上面版本中额外做了预设\n'
                + '-预设\n'
                + '-配装页面生成配装预设(吃喝)\n'
                + '-可以按比例监测预设，低与比例提醒\n'
                + '-配合剪切板云存储数据一键导入导出计算器缓存\n'
                + '-新增代币计算所需箱子\n'
                + '-新增“开箱关键字”\n',
        },
        {
            name: 'shykai战斗模拟器导入_改',
            url: 'https://raw.githubusercontent.com/Chen19970809/MWI_Trial_Calculator/refs/heads/main/MWI-Importer-%E6%94%B9.user.js',
            content: '-原插件功能：支持导入神龛、迷宫升级\n'
                + '-不用进战斗即可导入\n'
                + '-支持导入选了配装的配装（即使他穿着生活装）\n'
                + '-配装页面支持导出模拟数据\n'
                + '-配装页面支持导入模拟数据\n',
        },
    ]);

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
    const K_SHOW_UPGRADE_TIME = 'kunpo_show_upgrade_time'; // 显示升级时间（'1' 启用：技能提示框显示升级所需/具体时间，默认不启用）
    const K_SHOW_ACTION_STOCK = 'kunpo_show_action_stock'; // 动作页面显示库存（'1' 启用：动作按钮右下角显示对应物品库存，默认不启用）
    const K_LAST_UPLOAD = 'kunpo_last_upload';   // 上次成功上传配装的时间戳（毫秒），用于面板提示
    // 上次见过的脚本版本。全局键（所有角色共用，不按角色隔离）。
    // 游戏启动时：内置版本 > 记录版本 → 弹窗显示区间内的更新内容，并把记录更新为当前版本。
    const K_LAST_SEEN_VERSION = 'kunpo_last_seen_version';
    const K_COS_API = 'kunpo_cos_api';           // 云函数地址（COS 通道；留空则用内置默认值）
    const K_COS_TOKEN = 'kunpo_cos_token';       // 云函数访问口令 X-Auth（留空则用内置默认值）
    const K_AURA_PRIORITY = 'kunpo_aura_priority'; // 光环优先级（5 个槽位，元素为 AURA_MAP 键或 '' 表示不参与）
    const K_AURA_MANUAL = 'kunpo_aura_manual';     // 光环手动录入（{成员名: {AURA_MAP键: 等级}}，服务器未上传时兜底）
    const K_AURA_FIXED = 'kunpo_aura_fixed';       // 复活/无敌固定勾选（{成员名: 'revive'|'invincible'}，每人最多一个）


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
    // 图标随脚本内嵌，技能面板不再访问外部图标服务器。
    const COMBAT_ABILITY_ICON_DATA = Object.freeze({
        "insanity": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAACXBIWXMAACxLAAAsSwGlPZapAAAgAElEQVR42u1dCVhc5bme2+1622tvb9tozUKqjbtWq7Wt0WuMZlFrqra12ta2an2sbWprNQsJKlmMJswQQsiGWVjMUrMZTYxsgQAJAQIhJpgdZgYYYJh9BsLO3O8bmORwOMt/1tnO/zz/o48C55z/vOf7/+/73u/9dDptaEMb2tCGNrShDW1oQxva0Ib0kVjk/4q2CqEfT2/3fzk+z/mL+bnWOxP9/i/FzIOnltp/llLpuVGDQGjGvBzvTYuK7OsWFzk3xudYJ8SkBdx6wrtFg4J64+Uq/1ffzLe/mHzYWZVa5j71Rq7toZhekIPGDlNirf9rGjSUHXNyHBPfLXHu3ljt6Vhd4W6aV2B7TlsVGHkXOmo31fgWaish/5i9x3bl24WOualHXGc3H/f611d5vAsK7Xo882mrMzS2nWjfVt7YadVWQr4Rn+98fGmp87NNxzydWz73+bNqPD1Lip1bEZDa6tDGukr3TF93vz+13D1NWw3xY35x2zVo3dZUuJsRdDg/qPH2J5U6C2PSwSAdK0qdcQjAfWd9Vdpq6ASHT+blOp5FkIGV6w0CDyduu7MLbJO1VSIY9c6enrb23oG0attobTV0ROETDJ28f9TjooIOp+ZgiBiHzZ3N7T0D/q2fezdrq6HjDZ+AQ9FPB57mYEgYH59uL0EAnrZ1X4ypSLzA8AkddCF3MPBwOSfHOjHSFznrmHs5AhBnepXnH1r4ZHj4hAl4YeNgYCR7aYnrU7xhML8RGdBddcTxWBCAEJg2a+GTwfAJ2ww7BwOBFzyUojl+PccxLpIWHjMh9o6+AQSgp6vfn3bI/eNYDp+wzbB3MNAa4k3CuaBPf8h1eHae6+FIeRGft3T5glZwz+n2g7EaPmGaEeVgBK1h9nFvH978qgq3MRK25/wLF08HAdjk6e1LLbd/M5bCJ2HnYMhlDYMPs6HK4wvn7Xn7Cd/OIABxfnDcmxYL4ZOwdjDktoZDX1VYbs/rj3r+RQVgTXOXO7LDJ1bO8EnEOBhKWMPgDKftObnIPYEKQJzrKj3PRVv4JGIdDNmsYY1nxDYQLtuz2dXTSwUgngujKXzCNDdUez0xlcFgs4bhsD2XNXS2UgHovNg3EK6UfQyfLC5yrF5b6W4VCjqcGcc8XYsOOjfEJEWKyxqGcnv++IzvMH0b3l7r+yQc1zDxE8vXFxS5FpJ6tBpFimHMyrVOW1PJHQDFBcZqKTXuBz1fOgDrHN094UzZfyO35RuLCp0puJWSAHBxoXOtThvCrOH8AtddatzL6irvk3QA4owEyr4Qi7iq3G2en2//o4Y+wrPhq/ubR6lUJXcFnvvoAIwkyr4QIKK3jA6Mhj4Oa4j/ruY91Fq72+kAjETKPikQMVyDQepoYDXJNpaVunIpIZp2Na9dcKHjLNM2HKmUfQFAHEAgqnXcCeuxosxVG1wYcFJa1bz29pO+j5kAGOmUfVIg4o6DXvLsvW3XxywA04+67cEFWVnuOq/mtTccdc9lAmC0UPZJgYhEBEzlYbxRF2u1B9QzIG4Lal4/rcx5OxsAo4myTwpEzK7gufzV/dHHDmIc8YXuu6kLsKzUma/2PTS4e/rYQBhtlH1SIGK6FDMv+PNRDcC38h0vUx8ctoEP1b6HIw2dbWwAjFbKPikQgZzqxtwx7lRRCcCFRY4V1AdeVGhfo/Y97D3TXs4GwGin7JMCERQlrJgqjboFwAIn6oO+XehMVPseNh/3rGMDYCxQ9oUAMeqyKtQQDM6EAttfdOrrxTzDBcBopexLAWLUZFWoIRicc3NtM9S+BwSXu7PfzwXCaKHsywnEy1kVx8SoCMGoSUSgj1Nt3Re5LGB6hfevuhgchECMzKwKPQSjJhGBPgrrL15gAt9Ja1f7qiPO+3UxPubltU3iY2CjowJ0sasiNgSjNhEhOLJqvHqLp6efDr7C+o56Q5H3u7EMPAzEYxgGMyVc4AtYwEjLotBDMBj8VFsrsKCu4zwdeF4Iveys9e2NdauHWyqmRrmAl3nM240AjYoQjJpEBMwBm2hFSTibvb398CHM1qwev9VDPuec/a0/i9gHTSlznaQ+UFq564JOQe4hFj8tLnYbdp/yedq7R3q9tdaujpQK5wOa1eO2euj9YlVexKfp6CEYuYgI6F1jsTV6b7hQWPCEX3Nmjdd/xtbDnHKrv2hcUuIdpVk9bqsHhe8XEw44/xp1LBixRAQ2sA1fOK9/1xftgbMdE/sZq+OUYL08nm75+pRNlt9Nz27e8kh2c82jWc2Nj2Y3m6dnW45Mz7BkPZzV9Az+TCRYvQBVrsx1bvZnthujkgWDE4rVt/OBDWtJFhTYFi8rceaklbtNfGpPaPWOt3QzWj2rr3dAiQKkSdCRaUqmZe4jWc22xz5o9nPNR7MtvqlZTSseWt96dbhaPdSYQSGBqCpmp4dg6EQEMsvGsWgw/33S53eyZDjO2Lq74G8+IvdzTc1uuRasXRUf8EYAMcvSPiWz5YVws3rIhpmbb/+VLtpZMDj1h5yHSS0bV1hgZbnHBJVtXWyZDRQph/TbWNnBl9F0J4CvRSj4qBOtYThYvYiN7YkNwYidWMSE3jSyeFGEMbvGtx7rOZiAd+m8p0Db1smZ5h+AFbNKAV9wTstsmhVKq4cfcShYSbpQsmBIJ+YkUU8Gv2KqrFjKEfvNpabOJjarh6CEVNI7SjzLpAzjFWD5TssBvqFzYTdu5aGwehjbi8+1/1QXS4VIHIUyvXj2wzMgkiHnFDFvmxnHPUubGFJpwXne3t21utzzc6WeZVpWU7pc4LtkBbMsH6hp9aImtic2BDMUY+qgbqeog8L1d7BsMud8x0kuGhWc91ow5aYY+DIsNwFgeuQGIIRr3Heni6fBC7F6sDN0vFXgeCVmgp7BEAx9OxUSi9tQ7XndCC232ICn5HlvGACzLfvkBl9wTslqmKSk1bukkBotsT3SMTPf85039jnHi/ndVUXW/wbVgmpfNzuB1Nah3HmPOqZkWe5/LNsyoBQAH9rU+BelrB7KtkVdbE+tsbHatwBl1LisH4IUwarkfUzPsmxTCnyBkEyGZYESVi/9qNcen+d4TEOShIE8vY9OeQ8wqVsFJ/QC8aaW+xQR4MYUGnirXkUBmNn8ppxWbzDW6jqMO5CGIJ1c9Ry+yYfNF1u5wi9K1HNAHvdFJcE3GJRufl0uq5d5zNOdWOh8W0NMiLZlIJ6e0x/3y0YXfySz6SOlAQge9pNyWD2I7TXGRGwv3LdlzP9Cj7Sn5bgWhEmMigMwu2GCFKsXU7G9SNmWEZwgybZDCv0KshRXKen9DpETGFValxa79pKmKN8scD2voSFMt2VM22GzGlHeb2brL5S2frDF72G7/sKDrpVcbbjQy4Ug/rUaAsJ8W8ZANpQSzhRsAcE5UBqAkzMa/8B1DwkF9j9j7w9W8ihs05HUvTRmt2VkSSNAhbRmmJrZlKIoALObPZNW8ccwsSAovdJt4yKSovpppPVzjslt+aily5FW1n4XYQB6h7LOh4W4twcSNJAqzy866VgdtRJr0bItI6MGAcoPwOY8xZyPbEsfcgt1Aiv+kMjL55hABMAyL8/xGw0BYTCwJxzQtLrplhD7x/ECMLu5VEHrt0/sM2FsEHO8JG0awEm5LXrfLiS4RxvqbgjX20uqsH4P0nQ+OvhQqhc1o3mD0FnNFQoBsGfaxsY7pDwbn3NC747OR3mLuHGNwfLdcXpTzphkY1gmu5GgAJK8ViYCA1K8CM+AhYpYv0zLajmekc85GR6y8Tiios4XR1yS6b5xemMTzL7xKcZvhdv9ITcQNJ9NTHHBnV+05+lCmIbDwDNQ+2Vbs4BzUs7tnFAnEoGRpxm54DOYXx5rMHWPM5j8Yw3G6nC8x/1nO6qZwFfZ1OkQFoaxGGQOu/ROzWx8VKeAHAmJc0JVJ8PUXagk8kSNCannvgmg24XAC86xeuOKcLvPj0+1FzOBrxHEJ1eWOwWduwCAT8lLu7LMU/LZSZwTukoZ1mOHfY+UMUl1PxxnMJ6jgg/nGL3xl+F0n1tPeLewEVfFKGFN3GC7EhUNpFs+y8DUzBZVWsOSOifDxaI8ddjjOWwBCGCroYMPzn8DV+svhI1KZvZx7wo2+v6eL9qLxP5dsFobpYJvWkZzgpprkZDvvB+dDmEd1z0DSw46M8IOfGP1DfeMAF9g+zWdCpd7BOs2i42addTS6ZTSGX3iBvPo6ZnirCDW/YJ2zEuhWBOhzgmqYYWlCDk4GuksAAyLr2Vthet5G4tCAoqOk6bduMYdqxv2PioQfA9nWvofzG4JKTl0UZErlVDmpGtWjvWRsAPfKEiUA9i8jAA0mGaG+v5WV3pmoNIp27mPJN1GeAQpv3llgx9UEfitHsx71jX6xxtMWaFcm7cKnH/nonJd8oiPe3vn5dt+F5ZnP7B+LzKBb9ABqR/2dUM88Gb0ktW6N2yrVc9RLwxdjw7JcZ3xicYrwNp34TP/IMXsf2BjEyv47lvf5J+wwjx0RjaHLBc7N9/2BFnJpmfgzQLHG+HsfJQxAhAD0PBi6Fs1WEW3GvdlKPHcALT7TjbwHW/p8qRXyUNPH2cw309/frSGP3u/yX8vTPznD1c3+K9dPvxn4pabQqI2hTUhqIBAQuN/+4BjiVL3MXuP7Ups9YU6j6JqksH5uI3N+kEKrkE3vHrmSwC+FpiduhDld4OzBbbkdRWee+VzwkxLWNeBdX2M50MBPmRHk3q/i4rs65RQwsBYZHKZqxLKQg/OybFOlLDwxhVsCwz/r5TRSoBl1IUgvzvs3FflWSzrLqA3HRcKQPgQ96gNPsxqIA2LBHzvFDu3yXHNf37k+tab+fYXsQP72gq3DYPgWI8sCXi6wazHf0Lg2c4BwLzhL8k4L/j/dH7/f+hUzu8GJ7ZjlRV8y8yjMd4pwgIu06ma+zZeATJ4p0nAJ7VROFo5JL2i1gw4MH1B+Y8A8ORq5QDnud9yL7CpTUfZ1+HnPxlaeMUa0Hx2jlsdS85z32XLbowXDL7BdRiWcpMShyRRTEg65ColAd/yQ64KoecxpPmjZB5S/kHG10vXnZEVeBRA5RNsM7+nbFNtg//d2KhTMb8bnK2+3n65+7yNWdo4Fp7RKgaAP1nXuFs32J1zLLYBW1vu/q1SAHy32LmDSB2rzH2KpG4Y6fzYnhWl89DKMYVyFAMe5fxXwP+Vm85ek2j5emCburw11+pUyu9SJ0Tx35XreqOX1d8IH+BStOairB/M+zY09a6u9P6tztnTLff96WjkAxLwQfPpBi6dmPgc6wS0cggqrjxyEHiKqy+AJVtMdtjGLIl5KptzolMwvxucqI4l5RpX61u+MdZQPx1Bh/QysaALTgzHLCt1DetVggXyoQo0Y2dLuuIshkiCzgNK9WJIhk/iTRXgXdp+gOVMft4Z5iXukq+qzZ3A11za6OzuFdThHBykuOXm68Yl1T+BHxkA7hCEWXqkgi44MSYISq0j7nNTtacVQU6PnSodaEZhULoo5ZsF9n+SdiZA3iDwDA/Mz7XeqapLH/ee+X9FeX8GY5rS+V162GVlmf0n1N+9bmnd/wSOBcvNPw4ATW/8F8z18KFUSNlW+eZLe9qgAWIf431i96ah9emAf+6Hs+WrY5MbJigZaMafYQqH4LmNRNQyYPH22+4JZRbkjAgAzpfDq+NSvxr5cr05gyUCpsJgykzNeWOqGZrleDnv8UhjJ9vvn8GQDd6/jsA7JQ00I7kgPt/BSi4Ay+gMW+BRMgAZQl8GEFRloZt/WOvbRQrAc7buvjiDsV9t4OFEcsIXbd2892h09ZIcZTCSsAm3aswsiQ00I7kgIc/B6XXDGTV3RIimzF0jZwknZtIk134ItH6VcgWhIeh8Ra21u50UhE9ta1EVeHEwEwocfhfPGZV6VEAig5BU3jh9/Z+EBprRgpFUvgFh9VX67yaVuoplziAdZPqQyBGc3HC7wJciq0DOuqPuV/g84ODELVAt8N2xutG//1yHn/TjCM6JwJQRcb1t2BCRJNCMnmxikYNIsP1fOe5vB7MY1PphuSR9A/VD6EPozTOkHMaQYOAmXKhiJY4BoHZ6nuTl2jv6/DelmhUH33M7rVjcxHgPDe5ebPjHeo9P/7tV1DWnZDSeJSIXUBpAkgwmtrRc0r6jk4z3DoXlChTPiODECypCPqhw3IpZDhIQvrbfphjwcPtcccTtZ7PIVZauQAjm9lUNjL2Kcf7jU/H399YBByf4lhx0bRa6tosOOjeMyJaUu0/L5D/8+ZJfkFx/h4R93LiINxitN36spDO0/YRvJwkAQYhSEfBN2mgJAIztujtqff4bKNb3EEMcEOd7JS7R93BrWgNU9TEHiyFOlydmXefk2KcybOMDcz5z3CpDBMVA8Q02KBiQNvaD9btTYZUDYocEwSIn+F4Fq4XbO5tjgRmPONrvLCpyMv48NtSWci/PbG9laLPqKpfSgGZDtdczYisHyygDAPdTaoe6rl1Rd7VYR+TbnAFpvWmrGiGhNeXOmSQOSUqZWxbgIeN5O1g29pYQff4/7bYy/u7kTRbG38k93yHpnsYnDx4DgkDBLqToHUtZV/R8GVJ3bTJswUYacWWWFHe6gcX6DYxZduF6dWpTTMu3nvDxAtAE8TY6NV7onLG5xX/W3sN6DYz7PbiJ29Keto38/ZOt3ZI/DFDsD5ILzOjJSt5dDrjjmbb1ubm2GZI94OFhpQVSHJFsFgD23pJY+zWlwRenN/0cH+jONY3+Fl8fLwjRU5WLRECfGH65Bc5jfH9r3VEPo6cuR/wxsdBhn51nGy3H2uLfwcIkhnNljgDjgGnFb1NIvP834t6TjK9JYcYksDogyXU/URJ8ow3nx1GZ2VDBxQvA3afaRZEISkydnIFk3P7GJ5Of15j+DhYvSfbIl5v2yxppAGvKJPVLwh38zrLTVwbKdpMuK72CwfgHg6P6ggRHxPQrDg9YsZK+u9OrvkqvykMrxeWR4sTsxB0CXjQXiQCn42K//+/7bAKtqRlIsiP/JqbupJ9Rjf1yHn3eKXZtYdqGkTXDa5ySzX/EexpFEVpnSuFK0hACRN/CAcC9ipEhIEnPdM0nt7b4+RwStJR8LxID15uOcZMILjh6AoXmYoCyCywx/e89v9sqi5MEx6JUudZ5bq79KWYdQfcxAuJyHr0UF+7tixFHB73pIUkyvEM0IqacpU+JcyCSGri8bz6HpKalSzKJAOOKeO4UCxIMPNP/ZgLBh0EEQL3Jg9ufTh5twS+jLgwTF5Cr1/P4JOP3sAoS7uXYZXLvhauY3hvwCu6WLE3BwYB5UFaPN7lhDDyEjesFkDgkTNsdKYkALeN1KdJSe0xZkbRyt2wxSjz8y7XmWKzEZAUXFjlW8Kpm6E0bL+9a5t8w+wriuI9UT2ctx9f4nowlXpB/Nh4geQF8Dsn7kJcVSiLwAGDm5ztkAwk9K3KZmCrHNJ6TxDahjAUFtsVs3Tc5tt/tdI0gZMAwpmrfbZJGchiXXP8XjoU4qXYtCs7vJ3M7JOgEXD+k0/IseKUYI+QCHyhp+X8tkjDANulZEWgNIevfH5tslEXRavbetuvZ6kJQa5DBUHwFDIVzaFeZOHRs+iXbfaJDKQ0YSG/nIiNAJZl04XPzlHECiaV8Dgmew9ZWenidliCZQO488kMZFuHEVEFnQXny8EjdZ6sxgbLPXax6OXAGxKKu8QbjTezMKWOHTCERFkdEBio+HmhhK28V8xKgbLOfK37HFzf88KTvkqVUYlKzKoKJqfzbcK9UESQscGJyQrjIDvCu3gmKlIJxuhU+hGYOj90iV41IEcc58JgkcLOcHQjmlnvTG3eTZEhIyQRyT3pWRCQxlT07ojfP1UnQk4b6kW6Oks421H9hcECqhsBVjx45j5WulatG5B3OZLnB+COR5740cfIXpsKAho3euIokQzKCTLDLqgqDmp4VkfuciQIBYkohUB2fS1EftuQ+JuHy76WeGyXoqCQlDTciNsd9sdUisizPiVz4z7H8Msg9wwxJdXMXEfiQFIAik2pR+DGcQ6V0SSGmslpBrKoTMFBciK8Y/e1C53vMBqP+GSG1LbLFibEjEhfy0RSPIuh9S3VsUE9QxMG7Ds+MdM/5iS38GRJSMoGcE50b6n1xElNZmUe8cxNpyevSEscnfPR+w2HnUfYMVf2fiN9VkvEpmdNjUNzNfSgm6sGGBEUxi41iQfSgJpUsgYsnB5lAzmk45CIipuJhHQWfRKpx+fg+fmxWiMKRJD3l4GevEq2cdtlQHJZdqg9e9kKeHKWTSs1h44uJ02AxdjDVniDZkStDIoZMINdEwJ939JARU/XGnYG0J5ZkivOIn2db8/nFbddAM5oLBDXFffF5jsfEklOoPWSwvYf89Kihaieei+t13Kr7xSIsX3egYJs5Iv836s8mUByScxACgabTIQFfMABOt8aHWYPRg7sHrN8rIq/HWJmI2jBrKt3NZJV1zhT+XdA8g4Aska1Tqj8wl3JqMDY1Nrl+EiO9nyOnzAHoPi7F+bhk89NMGZISiWQCOeYOBlr/K5+0sWQ1Gm6/rMrPHlfjtDpDxxO0eKh+hZ2PoFTUQwI+aG5dTZaWrZ/Ocx8Xr1laF6dTUDNmG4HFclPTRJjloNcJkC4qKjTwyOiOYOBirA05eaEEH1ay4fZPz7gwnUMRcNTzEqzVbDHXfHxzcyPG7rC6TUibLgQpXcKNxYv5Ctzr+zwGaLFOp6hmjPFZAQA6If5ME3iYeN5QDpAzQwk0tjk3zz7C+v2BpVwAALeOzjQO5loFMXCAcLH5ODnwgnIec/PtvyJs2VbDY3j6rl97doyiAERVVL7ot0yctyUCujmFHQArGrtGKGTFCaC0xYlpDwFzQaFTEAAXFzrXEjiNqYGjEPe1e8er1T1VjHKWQMbvUoHsaV84ge/hjJGlmawZEOg8j7QqbOiCjWMw94o0KEjh9U0QkTeeAfFQUvBBaOoEV69g3O0wPETwvtq/L0UBQQRN/yHFXiCHF80BwPPhBMA1lcPzv6Dwz/XzBnwGPajQ0wHywkdtwjMvcPbdWO3l1Q9MK3ddQAV85mKwuhtIZVlg7VtHURID6gz4YiVE7bnOECkiz6V54QI+TL1RBYwwCP4YR11J3DLTXcF2CFiNNrw6zRcokhdcDgA6OYNA83SjBjSKTqLqPcqyYZ8PNqsHXvR/YQ0vsdCn3nRGMtlUQtHQApnPfO+IjZxjHjpcAPhnqLITwIL+nPocqHBFt1Z/2ys8iH7DCrOJC2gsPfF+gewWAcaiDM+HulCNACsCYj5ylBlKbf0a0IEOEwB+SqH9Y00Il4oCPPdLtAKhr6Gq/XBWihfqS4THM+ndTFmPU2CBkVkkkImdh86oLtQDXvxKiVavCwPJks+kBtPj4QC+H0Hg20MpRMriFCQy2nHLoz8LUMteGiGVkeeQnS091IgnUygLHWtBkAanC4cRKMNjaWhNcHi1yVVRh5TwcAAgtQYEK++4aP5cnj7U5H5OB+EDQpW/BjMjtzOGrQKye1wMd44zukyFUHISFF4X8XWW4hco1z0g50zOfh9iJ3INgwBcU+HhTFdypavw/IaEUCoAwZHALuxCyaqfBs/VQ3S6+eLaj6GVJGM6qT8GSylLiL9K/PIhpaNAbPJUKMGHfMQg+GxAQOXJQ2/he54lJc6ddCv4622tYnaanbDmO8TuVAGPOITd3wVsxcZzfHWs0DhmmoLn0Z2hBCCe94IABN09zo+QRLYWazHoRIL3QSX1ppXqEWqxUCxYdhn2Y6hpYRHDWecCKiYpLeXGx1VUcqJEr7V9kIeIQkecrGu96TPSZwJafOJIh8Su1nPVKMpqUWTAeQPZKXDOmIOgC4QCVDq0CqpVkHlSdWBAv487PJJsnCyka1TaEXc9HYTyqGxxb9tY76vTBvkYk1T3w1AB8KDxYgB89c7eYYLlDLtBldDnwpZbdHoVlnreoEhbCnA2UM1Uoa73UT0CvYtD0LKLWnT0Ro6dr0jnd2KeDTzgg3QrOCfXLvt5D1vvakiSVjTVoDYAQak+AD5UQOBU1ALWi1iNlNf2tV7H1Ej62Q9lqzEuwjO8hiDJYuaEDA4Fio7YqPaUIO4cMc80v8B1F4qJI6lgpIaf13//hiZJ0h5wX4k6Ca0etBFCUsJvdwwWHR1r7uIu+YScOQaCecEWrOUodm5NKXOdJOkLjOJLt4gIzWBlomThSG2MCMXEh6LoiECZf0TgGRsDzst1PIsqBUiXGqrlEMRmvtRq9bA70LeY0MO9iI6GZMk0bUir2pc6b1s1WHTERbW/rI9yOQAPDQGT1la4bUILh3hBCE16wBL2cafTTNsgPHathhSlAAgvWi0AQgE3mdgQUu6HzlgoCCQ38OiZkvvWNzVS6zcCxU0g4IRi8xpCoigWWNnUxUe1HyZh/HahYy5TUxi5JoqK4za+/JDz2OMfNN+DpbC4HpqDoeIIaM6oVHSEsT+SjAQ2c0SOH71BtNiJ4RgqzR6BPbvANhnJrBoCQjwGKUfqFB0RCY5DXDIhz/4CnVpFUqv7/lGPCz3hd0ucuxcU2vXoHcfnWCdobzmMR6BRngpFRyh4ztewcKhVQx6b9jJOkMbtwOo0KMU8sKjIvu6tAscr8ftt97xc5dc81EgcahSpY2uvLMLev6/tb+thUx/F7fNp7Xymi8J8sLIA/AhacP00nSz7AGc1Rt3lWTnWR7S3FYUjUNeqcNHRSsJuRyhORAUeBpmToPicSfRbG9HihGD/MoVjf6SSbw9nNFPbn3YkFNhmam8o+r3gm5UEIB/hgDp/v8M6qL9S5jqNnYi0txMLW7C+/gGlwDcJyiKFyGTM3GftX1hkN2hvJYZGsIGyUrlfQYDdZJmnvZGY4wOaZgWE0kM44wxGH6TfXCDoeJv2RrShDW1oQxva0IY2tKENbWhDG9rQxuD4fymtuCe+ChgAAAABSURBVGhrUZSCAAAAAElFTkSuQmCC",
        "invincible": "data:image/png;base64,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",
        "revive": "data:image/png;base64,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",
        "guardian_aura": "data:image/png;base64,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",
        "speed_aura": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAACXBIWXMAACxLAAAsSwGlPZapAAAbDElEQVR42u1dC3hV1ZU+7XTqtH61Tj/HKk8t1ke1Vmsp46jVaQF1nJl+OmJRCgjh/RIVZNrqpA4dISQBBURAXkErGsn7JhAqAgkhJLzk/Qq5SchNcs+53FdevO/s/5Ibbi733PPa+95z4l7ft7/SmJyz91r/2Y+11/qXIHDhwoULl24uszd7+y2p9CxdXulfk7Ld/ZjZ+oc+Ldvtz0Af0VdusW4kqaXeF3bVt1880HQugLa3of3yop2eOWbp36IK7zz0KdS/ytPtF9FnbrluIn872eoNGbfTyPXtF1K2Sz0SP/NJPdCXyP5tqmr1cMt1A5m709Ur0rihlrbDPSzhs3OJe7hc/+ZVOG/hFrS4jNsd+HssaZHG3d94NpBa4hpg5Nmjs87cNybvzL3GAOgagL5Em6GTtwS+xS3YDWTlbl9WpIE/O+g/ZOSZQzIDf/dKoXRwWpF45HGDQMk81HIosn8rdns/55brRvJBpe+DDSdbpeKTrWdW7vHlkr3X94w8b3y+uGTWJlcAbXxe02Ijz0ouct2wcq8/D33bcKJVIn1dwi3GRVZezmro/0ax62IIgOTfF0bmNDzENcMlLjK1UNoZAl+oTbGJ5VwzXJhLUrY4JBJ8oTYmT3yRa4gLM8HB49UNUo0cAF8tkuz4Ha4pLkxkXK5zshz4Qi0pq2k81xQXJjK9yHVcCYDTC8VjXFNcqMuobPFxJfCF2sufOx7jGuuGMr7A+V6i3B0TbdI6tQCcWCD+NRF9hG6gI44URjJjo+SbVSxdnmqTSjEjxfPdr210NaoF4GsbXI54z87QCXQzY6PLy5HC5gT6bSi409Dk35MKxE3D8x19WL97+DrxTrXg61yG14s/Zj7jZTpvmWgTM4kuLoXp5dLj/A6ZAQgI0KIZeuZGV8vYHOdslu6PpJyml7QCcHSWOJSlOwhjxtijvXtEgasnRwxlGZPZeHssg5PAgP2YqZi8O9c5UysA8TdMZr31jrsx1ljvHlZ0uhdHTJxmwPBG9j/No3Kdz6t95vwy77jcoy21CASIDUBpgmYA5jSNi/VM8s58vDt9+5mxWm5h5Ga9LrNvbuIDbQWzxOIh3HztPt/Wpbu8K5PLmm/W+ywsK2oMjyCBpNzG/1bzzM2n2vydwZ+lrmflfg9uFa0ATFrvfESQTRHwPBd67+bqNp+avo7Nc/4hPAAiVsPeUK+eYSPYKmOvb8uicm+KZWMSAb68o8114TFuW6pbW2ZvdvfVu+FWDQByQBmbJ72h9MzcIy129Gu3o/3i3K3un8Y8BRe5GtSfgqX6WM+aU+r+Gd6Jd+ccaalWnPnIB9XlAKbQRmU2/JMeHc8u9ty+tbqtJdxmmKUtCULMfNHCzPFl6XkeTnZdTnuKM6F0aWRW4zNKX/v7O71pc0tdgxQ/qDxxutp3k9lqitLz8E68W2lVGJ3tHKx25guNW++BjKxU26LZzEwJXKoFQIs2GNvxFod+P6DLq2UZJDNR08jV9n+gNaZJNmmj0jsn26QiagcO0neMQcuYZxRLbr3vg21oThoJFewjog3mkwP+PQLDu1iWp9GpRSeum2KTCuXeNaVAKoC/ktrpO8c5S+t4kSKg933rDjbviWazpbt8yy0HQCwt2POFDwS5uSkl+m8wYGCtBplqE3dQd8sQYODEHX76ZuF2mVIolWsd7ySbmKf3fXNKpSfC86fRvqxua07e4r9JsCYbgbsvpm9M7Zj5jIDvSjiUmKzVILhCYzG232c13jwxX1qDpnfTryQkvtCpfcYX3zTyTtgItoLNMvb5N88tdfcRuHTMPCQFUjMAyR7KquN9fYPk0jre4esa7uFIERIbk9d1TyQdsOpYXykUD2sZK49FjMcsmOOcqsUoEwukD6061gl54iotY1Xj/uFiVAKBb0yzSbvVOaRdl5FCadWhJhW4fokxqJrpbeIu6IYDJA6Cy3aSHFSlYvndbvWx4hSvuPQWSSd5BIwQ7/hA9/dJPOBH5JbgvMyd8PmROc4HBMsnwTt+LjfGmcWuc5MLxLXDPnLdwBGRIIE7ZGyu+OqEfOkT4jfbRpbnvVMKnNvgshG6TTaemIwxBcdGxoiQf1wNsnL/fO0lvdQ95f0K94L0HXXf4dowJqnFjdcvqfC+C51ybaiQ+Tu8UzvvIIkjlGtEoHYnD91yjSjIkkp/Oi0KNS5dqd+gW64RFUsGZj4oLnWr1J9rxKA+iQ6hS+gUuuUa4cKFS+KkT0rNz3unVo/snVLL2RNoCiKW4QxF6Hx44zmqV6V3qn1x77SaQKj1SrXn3Zrs+K6ZbRppT9jYVDYFFUQwUlnuyqgjWx9BBIjnG5cvJhsl9rbkzJdeOyQcfFebfblZIo1gG9hoeqF04opNZfJQiK3x301BAwI+Ei0JM1cjN6QTCCz4utxf9kqtOSIDwEs9UqrvEhJ0r44ABthCq/2Qn4NbGsEc95WEl0TrADov0aXd3T2Ruue8U/dHB19HS68en4j79GmF0h69dsONjGAq6jINGWtR4tiqust9Zu/5tb/onVpT2CvNnt8rrWayQDLUes+rHhwTgKn2CfjbHvPsD5P/n0X+rpi0YSzv0Ukwxym99grOfmajoJtU4MrRPSDkMpDAAquDr+8C+20EON5wcPVNsz+oBoA4jJD/betySEmrmcGin7g3N2ir9aZTPugg1NBGxGA0OI/AAtb9BA2HXGksrY3c1ByM2OetjgSXWgDe8d6JGyJ/Tp53vkfaqTtpM2rJRdeoSvskCVjDssRbTTkDgLHJyJeFqBaW/ZtT5nkwxEhgtJXWtLWHJ+yQ2e9GcqBopQnAjkPKCrpES+JrRmw0Ls/5tmBmFnkl5qZYDUsDy/6tP9R8jAb4viK13SJJhcieb3Q0ABkHYI2/bzK95PoJBdKnug+MheJXpq8CAIq08JxZs5ysFpR7J9Jaelft8dqudTLXfMIIgGQvWP1koj0WxKb+eJBu0jkVE4o0LXwmYUnklUzcREWB66LVDNbTSC03V7Q4RQKielYAJMvwbFq6QO6Ijv35xZfznM9Z6kSoldHpyhQvlbHoy7Ld/gwa4OtkdkgOfLPPnNp/jABgMzMAktmVGgCJjjW6XFQxjZnzUEI6/oZK/yBOZizC6N8p8d1ZcfraiuR6GuLpeqXW3UcAUdcBjMJb0xw3MQdgWs02muH9ak/BmPlwaLG0b2xEtvh0TIYncq+I7DVWCUSgmaABPnKAOR50KqfZD0aA53/Zz4D2kwLlRKfgTBgj5TPILJblfCohoCG1dHuAYJImzRjIe5BiCKJHcJ6AsQBJ4yzzdlNLPM9/FaUauWaXS21bO3hueqfV/mcUcMQDgGeYrFD5Un/ieViBwtuwCcpLwEZj850zaNLaAUvAlLLBSr0vhDbr2O+g0rhVZ97kQOCbG463ijRcLvN3nJlwxdVSsyYhACQBC9h3WtEOK/Z4s0OMW5uqWj3AmBCdycrbL5KaCw2Vxq04cGSC0Vh6V+/1bbzq66upSQwAawKRhx7BIlXqI/VZebr9IrB27S9XeJdFdTuQWcSK3ITba9vOUnC5nAnlUfRMqfqxDHjiA8D5tT+ymh2I/qTohznPUtWuiuKTrWesNnCw8hsFH67sUrZ6/jXspuPFRAIQUTZWswPBjjuabpdX+tdEOXi4H9vb0H458pdX7vHlWmnQIP+ONg7NLpedvoVdr9pq3kooAMkzrAbAaIEfsM28En/0EhZgQ6+sv+Iz208238jLJaeX71lp0KSsQI1R8GUdaTkhXBPRbM9IKADTqn9nNQACO0gJ3d/hiYA/dmG55x1FF0xqiXt4aolrgN4XowIRisCgDoeR4jRaZWG59y0qLhdSLyMKAMsSC0D7xETspWFDFNOZv/3MGP3uMNeAtB3uYapcMTQk/2hLZ4Ea1AuJi7K2eG7cZm9rNexyKfNOFqLndNgTDMA/xhuAiyu8qSHdoOiQddZ+sm/srECkoggMpf1GvtHZL2Of7wu550eL9YsnAMkHEHdajXnbvYND8ZPw51lq/Uc9NKXyV4KJAk1x2pejrvhhauP1McATHwASJ3gi7IiyYrClwEVgFmhKHPCXUko8vxFi5HokHoB2G7e0CYVGoKnSbU/P9OqfJRqAJPKmnFvbZEIj0DTrcHOV0ns60iUTDEC6ETFcKMjyXd61RsBXVtt2LmW7T5GVoM+82oEmWILd3OImEqOBpnCOzt/pUZV3SwD0WxPMgJdJRAwnejKLGA00BQDX7PP9TU0xZnliIWUAIoaQuFCSFFws/0fueu+N7QesCfwwtepmbnlBPhsuKafpJYThJ2U1jWdJ3UAr0LQj0vlY8kbvD4SYxEL2oTHA85cOP2GLDEAvIp5PCVxIQo/82e3zyQyaHvY76XV3CAkhHRB/NSZXmhC0LbGxabLjwAkz0SatIzwjjVHDukn0M8oJmDHQNLxtqmpzw5coC0DC0xIDPMfI/myuEsD0tEdX1AeezGgI3Le4rnM5j6d9QRQgZ1v8HHncceeIQWJyUp40UQulFyqNo9gzrfvJDSejx5kZvQPGzBp1D5heO4IFwJTaYAK+f/voSvuXD+sDdy88/Ux8vAsnriP8L8WqyaWKpOOYIZknrSdli0NI7oBdF6ENASG9e1//TblHm2tog3CP4+ylReXelChL8KhEAHDQGkcnANHIbOgetKr+P1gDEEWv9diYJDLVj8pyjhBYlItCpR4jnCLBYsqk0jhNH6BciXmjhxPCfFCApT4sECEpEQDEEhwOwGBb67g8OKM+e+CHbOoCj80X/2TUziThbN/o7KaHBRocweMLxMV6WA7kmJVoMmABJAggoA1CtMxDzUcRYXOFYLJmbCIAeP/7ddcC8Gq79FSGo2LwGukhgSJzlhGGs4ic4gvj88WFuvmkSR2yn5Dc0UM0OtOlfi8pcS8wYD6gdSqOzIeZu9V1T5+02nGJACBOwOH7wGht8Or6/6GlRxQ+pG1v7A915XwDgMgXpQ9AcY3AKHaNRih+tMPJS5mNyxIBQBWzINknNnxMS4eYHEwDwM4lOK8JS/AFSkuwn2WFRxTki5ZaarSRNIVLL3zWFEgUCJ9Y5ZAF4FMZDRUCxcqjVJdgwqJPpaRD8BBiE8sNH0IIOwLrE1xq2ZmhO+razlM/nJCGMSQCgLfPr5Vdip9a2+CiTipl9BBCaD+YUK2Adk2vG2ZygbRBiGNmXIm9rY3F4WTRTm/gRwtq4w5C+AFl94Ef1v3ALG6Y0TnO4ewd0eSqjTDbH1MNPptURP7u2/F0mCMaG1QQLED42cHmwE87bicS6pLpaAMzpF9QtvG3MWGote8rReLRMTlN4+LOnjoq2/koqneD1EbuiwgWoxESlSPs7lN4vKWJBQi/rG4L7s3MsA8cuKb+BYFNpfZp8rZ1OciB8uOk9c5HTHEvPGKds9/oLHFoKBjBLB1Dbur6wy3HWYCw4vTZwPOfxudwMnCNPAAHZdQz3VvDlrApbAsbw9Y8/EYjPdhf9/t3sQDhV43nyMU8+8MJOWzEAGDDIm5lwfx0bbhiYwFCtLTtnuBpldUpOF6+QC6MZeku72oWtyYffeVnBsC734sNQHIll8ctayF5r9zzZ0S+0AJf/rGWIEhoAe6Od2sDDy45HXh4eX3gEeJ+eXylIyYAn8xwfMmtKlgvnRNkiTROww8QsNAAXj/iX/zVyvqYYJOZASu4RS0o6Tu8Q8rq2s7pBV/56fbAY8Q/RwN89yysi3nQiD0DNmzi1oyStwFaB7P3EySU+xrOXtZOYHk2CBga4LuLLN96wXflFOxYxUo/f9nieUAuUlwwOzFhPMmJ9AoIyPW4XoZm0vH/3ZZ+beSz1jY4o+lPAiNyItCWdBCV5lgGgF3o2aKEuJtJPjvUsl8rAKcWStQOHP2XnjYEPrRff3j6fha6AbVe3OnZ5u509SJhTSPmbnH9s+69Fakk+cWpVl/24ebqeBJUav7CK5y3hL5wte3tLW6qAadGll60p9c22FkSVOYcaakmtvQuKPON1o0pgqUgpgi2FBEffjIEvWpykeuG7rpPBVu7Jt7oCl+XPF2jDQENRmc/EhH9jmmd/wQ7wFB4iQbZFVGWpJzs57orAOXKCETNETnoP0s7DCtWiJW62c/hpx2KRVOi3TwBY8Ca0J3LNKg9/aoFHziSf7n89HTaNxy/WW3w8LGmPqXblGmQW46sWKhGjWTs829WAz4UvAHJNqHF+A5Jz/SwzPvVOPvZ/32Z47tWXGGi8jGifFK0mwGrluoSFHKKy+raz6qpDzyv1PWscDU/eClNAP5a5wxIwHfxyZVNAwUrluoiZUCiVSHoLFYYiiLGL67Y7cvsjrPfwnL3m0rgw15lwQ7P9K4MCXX9aQJwwDJ9e8BBqx1/toxPeLdvfWhiI0uyB7dPqtwTNDsRLNdKWBGmFooVJEpaRGlQkvJ5GCmaY7L0u3v0CnEtVCmxI3xQ6X0v2t8StqsDtACIu1+tbhiwIgiBwDdo6AG6n1AgrYItguVaN7oapxRK5Ugeo1mulQWm1IMvq/EZDC5WwWpk3CHzLj4R0r67lPKHY5UnI3x/r9CcBeGKeVp10EHjtiGZhwzn1ozMaXgIQFMqWI1i45Ze6pDi90axdEllHul5lJMXmNP6+j6NBT4QX8b6e8KYfyOZBdtoghCBCAMVDiQk/7dk0NroZSQEbXkeydC1OptIl+KRSstExuY5/zCrWLqsNZ+Udb9wQyMHPjBu4YCi9AwCwI9pu2T6kPaTRXVB32A4GJ8OLrsNNlonXuhYU7olsSFNUqn4zHyExk0PoREpF18pMI3QcQ+PVRtY7bUhWYYHxYMX5rbgrYu9laYOptmk3TpYDi6SfN//sgT4Rq533K2X3gEUcCz7JpeYhBpzICFS+xxCKH6dLCUv5UbYWRupuqBsUqleZjPQMJsafEhMJieq/bqJi0iOscCwmGE0Vn0SVHo+vDC1WiGklbusCMCJBc7PDFBuHIp78rmmfV+Oc7YRThHafNJdb3r86dEYUeeXukfqeR6ZASutCMAxueJrxmzkfNuU4BudK/Uwwqw0s9h1jiVzlu14iyOyNCuSk/Q+z6oABAOW2lOw3FI8LEu81XQAnFTgyjHyZU3IFzNY9Q3xaPsjUjERfGHkmVYF4BUeQPFjI7aalC9mmQp8KNcwS6W/T4bE8OSwj9jFHa7e4y/qWhfY/4XRZ1oZgNA1IZeq0g1CYuu4l2eIebQvkrbr3tjaxF0jClw92R0+At8Kp2oj3M9HkimQJloZgBDoHLrXazdyk7LNFODDtY5Wh3Nw1iP0bsRZPYXWvaYgm//reS0EPtvx1gaQFdF4rtUBGBSie9hAC9Vel1kwTtenMQU0rGRj6pUFIenojGLJPa1IPALiQ3IKexO+wnj1D2z3AB9uQEDXRuu53QKAEf7bpBzxLdgIfH+wmew1Kvn56xskL2xvKh8gaP4jWyL9RrM3u/vC1VKKoNKtUn+az+5uAJSbIc1mU8FqREQIKp2zzf1b2s/uNc/+LMo3sG4902t+zy1pUUFNufll7le4JrioltTixusz9vq2fH645TByMXT7/ra5n3m/wr2AU6S4BkCX0Cl0yxGmIABN6NQKxQkGAk+5NgUBOgzpk3+QgrpiM50OY/LVco0YE+gwpE/olmtEJQjxtfIlg86WZkmF910OPkYCtwAiPBBmhFg3lAolYUMl8Qjvj5dgLBgTxoYxkkSiTzFmmpVHuQha/Y7u7yN+UC6yAz83haeewk3TzI3SBbkxIrAAuuCIiKMMKzrd69UN0ikz5JiwlmD2mvK1ZhXL+3QuQlfvvOq8BpJ2ODaf7g1IPAVVx2OlTkYGdbC+V+dCBKW/tMUZSiusOlYk7msZazC4gwtbmV4ondBiFBTdtupYEcChtTg0RwjL2S/vzL06Sog2WXW8r29wubSOd/i6hns4UjoELEhr9/m2IR9j3QH/3jml0hOG3BH5YrJmABK+E1buH6QRoLFyh4BHR+t4EVIlGORNhK1gM2K7rYgosiT4kOS9tbqtJZLuzAgISQ1bm45k9x30Z2Lxj+EJWPg3aEhov4eQoe/UnK9B4vmMgA+VDcJttqW6tSV5i/8mwYKhUCv1cK/E3P8VuY5rNcjYfOcMeryCJ66LVch5ik0qxO8I1OhNpDc0pziQfaPe92Hmi2azpZXeFZa+gwxvmNr1PnPGRsmndf9Hk2ZsUoFYrFgdngCUJq0dxqAtbVLyCJRSVy19Jw829KiDIdS4ep73OEkk0pJ7gnByUMMpbROQsI6CLIqzUa74qurkbVJpXFBRBOb9nd40JT6a0dnOwZp4dsi4H9eZdIU9XzSbLSz3vGM5ACLzLPdoS21EYb9mvZtabPo1MTqRu1KlZ+YeabF37E0vKZUVIzcvjepnXpdDqfxVqD4J6nAosxk4Z2r5+PQeimAb2CiSMYxGFmHCQLhop2cOpvClu3zLjWxmcdWkksnpAvZOap65+VSbP6TocC7oSEEOrObTKClzL/e81FLPc6H3IllKpQN+ltqZ0AhzAWyEPR9shpnPsuCjLcPzHX1U0Eb4X85zPidoqOiEL1ypDlpSnjRRMwCzmsbHeiZYWPFuLRWIQJEGagyld/N7YRZO6MzG2xVuPPazog8LLoEaAciKWRR6UEoox8fKEROnGRAzAhibWKYKEr/fizocwr8TGKbAYsxysyGfARnINadg8m/iFtmE0Czm4Cczq1YAjljn7CfEIRh3ok3M7JJAbuAUzEWNH5AAD7wko7Kdj8bz3bjSo3UKpi04JEEn0A1YKjhSBHY0IImKciZhXZ+oZnolUcqJ6CN0Yyq6DC70BG4VtQCM9+zM5WsiiLdTjD8kxD5cU1zYnIZzpQnK7pemsVxTXJi5P0jZMbsc+PDfOHMUF6YyKtf5vBwAR2eJQ7mGuDAXFFe8Ng5P2s41w0WIV7I4gh7CAyBG5jgf4JrhIsSq3g2+QFI02b1yrz8vucgYK//4vKbFIQCOzzPme0NfSJ/y0Tf0sTtWqf9ay4o93uzIIMvMQy2HjB5IyLJ7ACHwRq++0Jdrahbv9mVxy3UDQflVJENFq4puhABT6EgTRRMoF9FBQ5l7HovXDWTuTlcvuRKtaTvcw4SEM5jKl5BNWJl7LnRlU1WrJ9K4qJxpBgOTuiU9KuuvreKJPnPLdRNJLfW+gCXtapXM9stmSrRB2sLehvbLncsvAWT6Du8QbrluJLM3e/vhdLm80r9mXon/EbP1D31C39BHMEpwi3HhwoVLd5f/B4UWtXbXt3blAAAAAElFTkSuQmCC",
        "fierce_aura": "data:image/png;base64,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",
        "critical_aura": "data:image/png;base64,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",
        "mystic_aura": "data:image/png;base64,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",
        "elemental_affinity": "data:image/png;base64,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",
        "precision": "data:image/png;base64,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",
        "berserk": "data:image/png;base64,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",
        "frenzy": "data:image/png;base64,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",
        "pestilent_shot": "data:image/png;base64,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",
        "penetrating_shot": "data:image/png;base64,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",
        "penetrating_strike": "data:image/png;base64,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",
        "puncture": "data:image/png;base64,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",
        "maim": "data:image/png;base64,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",
        "crippling_slash": "data:image/png;base64,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",
        "fracturing_impact": "data:image/png;base64,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",
        "sweep": "data:image/png;base64,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",
        "stunning_blow": "data:image/png;base64,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",
        "quick_shot": "data:image/png;base64,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",
        "steady_shot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAACXBIWXMAACxLAAAsSwGlPZapAAAXPklEQVR42u1dC4wdVRkeia/4IIJGxfAIsPfRJRQDakSILYIYAREJStCgSHgIiCJBCI+woNx53N22lEe0ZO9rL1ugPMSmICACUQQKCAJCKKClpSAIlLaCtFio/3fuXdm085+ZOXNm7sy95yQ3Tbp7Z2Znvjnn/N///d9vWWZEGsVGdZ9izd7k+6GfmTtkhgGgGQaAZphhAGiGAaAZZhgAmpHPMbzo4h2HJ5yvFK/0jiw33R8XGs4FxZZ7HQtA+hl+B7+L7+C7wy13R3MnzWDHrJGR95bb3p7FpndcoeleVqjbdxZqleWFcXuDH8gIYJs4AHI/w7EKNfsfhYZ9R7HhXYpz4Zw4t3kCAzaGbp7/gaGWd0ix6Y4R2P5UGK+8zs5omgDI/j7O3XD+SKAcLbS8g3Bt5gn16VJKs9sZhbpzO81ub0QBSZIA3PIjAHkbvRhnmKU756O00PtMseGeSQ90aXHcfjseMNIC4LQPrrluL8WLM9yofto80TyMTSNblZpjhxabzk00072lDQy9AOD049Lfgv1jaaJ6jNk3ZnDs1Jj3sUKrei7NGM8lAYBpe7Y3i3XnVf53nNUElvVJXgN9VhZa7rlD7flbmyff64Ci7W5PS9Tl9NDXaZpp1tM+8bFCw72aAgOb/j0eVEqhNneX4UWXfSQsD4jfxXeKbW//ctM7ga7RodlxEb0gf9MI0LWI2rHVMEhIeey8sPKpLvD+Ew9w9jMAm+D4Jpw9wixvcYlonGP4yupnS63qqTj30Hjl7zFfmjdA7ewyMfpJg4yEx8yJ0Q+Xmo4nokXFKLNUd39Xano/nXHdZTtZGcmEFCdGdyYS+7Riw75FNUqn7cG/MWtvt2DkQwYp2oOLTe8ptb1jiZ54XmVZJc5vSbE1ejQAbGU8FYdrLLTdH3QDKZXlehW+b0CjadCGewZt7u+NDLy6/SRlHM4aXjRnWyunueByy/44bTXOppl7WfS/37m72KiUDYIUx14LFryPaIcLI80C4M6wjLWqB1h9JkYYmnC/CpI6CqcpovamO2Kom8gPuVIeqjkPh7/R9n+JdF443B4d7nc1zIymuxtF1NcQuDaG5y7tv8yYvLhgkBVm2ZlwTgkbZFAU+zYtUdeludRkRY6Fl41euhvCzogIUkrN6okGYcxA9Cb4t7DLbd25b3hyzhcGXQ8ISkcIGsLeNwKtjmCsr0Zp3CsRSftEyFnvhVLD+54RpG4WrCFyrjkvhgxQHtutOX9Xgzwau06OfY0CjTWhAoym20DazSii/cfuk842pbozEWZZphf5tSSDtXzs95CmqlU2hOG2EAUaSX6ElzoEZwqhbGnC/eGg1lZUiuOVd8LsWfBmWz1WTXdyu6OfH6IsCnet4mf0O/jdXlMf4D/p3i0OXlkq76CMYLDAV3cvCZXBaHkn92RTT+fFNSJtR9fy1PRZOqwcq/MdZ1mp4dws/t6mexLyzanvr+ml4MoLpn8oxTnPGoSUGhHFtTBLbnmyundaamno7AggkwhwktYDFmrOK0izlVvV01EXkta2IVQas+5cgWfUx8tuMPgoQnsAapckrwMRoJBIUaFQrwWpQg0D6Rct24m+aKSqJhA+FAqEg7rsYmZIiqOCgFOUSxJ/GEein5giWlyTcy+IeKKlPmolItxtfJCu8beBy3HDmdNnM59nB4PPXZDE9I8Aplj3LgpF9WREko9rBQgS0fiF3Ab1TWCCMD8o2oW4NImiJFHnO66qHdySshCS/7rzLL982SvwO2E2/eHLNr1Lk1A946UMio5zn7obalcPDOT5aHa0NKf0RM0vlCBKSyFelsoyELqoMym0nW+JRD4VPIXmAVEcRdkdfBfHEOQwJFVhaCdO1UK1w7rFpqWW6wa+dFRWkEvw4aEFLXulhj1XK+Cb7hF0zhUqhT7EmbWQzgoqgYxDRItAgM7RASSdM/rSvAKg1joTNp35Aedcnbu0HQIJ2mc8nla0JUhi0gFGlOevAehQdNSrTAhml1LDbaPAKMq1C26RZPxpsRMk53oUAUxuACgkUvLsxmJdAQeECVEeINE8D0Ker3pDk0jFieh0wvk+dHtRXqBC0ztKVz01GAh5kOhdZeUjv0tURwDPp+NtgmIawUvYfZV4uORYlfVcMHLewsQo7H617tR1eMoIOVwAT4jcfeaVzAFi0lU6SGaxwadlIaRu8J7h1ti+eRMj0DI7G9YcIetfHtGheC63524nywZB1JpZZTVmJJmMHrndctv9YnxJuvNlbIxDPJSXRS5ZM7eIQEKk0Xw+SXi4YNYOp/OjPa2GiBUvq4xGwkqSyRoTFBBJb5AGYQFVyB0eVIwOmT6WpV4raLQrW0gLKf62gCJ1HVFySaL46SYNRjKnaJYCo+Fcr0U7iOIjOfheLU54h1lWv5aoegfRPfhXAGe4Ea4Lsc8lSdmBl0S5rJUZhYu8bndV3NkI9b2B2RQymxwEnxThh9Ow/xxcnuqeGbsmWaKgwf3OxuxHjgWyGxFX9o10kBR8dA4w+lOZCmtAbOiQGQm6L3GjViirpcINorN6TjhLdWYNrx4PfGOHynz+dC03eR14OWXbEvwM2aF40bggytnVradeNB2jIL56LU4BUblVmSUz6sGeM+7N7Q8QkiGnhPoSeeQY0TECIDrGSxLqqdKbyIwoB9kfHqd0shvUrAmQK822zJiKWvcrSu+X/Voc/k4oxmWuXJNjn+hFuu1yiVPovepv3Mj7pXxizDe6X0fgikHEfZyMifDa5oXE89OPxBjaRXBVVBmWRGJcx56m35djqTc2RL+qAKcaHS4gAfCRRcnE7AchgjL4WsT6c5Ed/T/k6gZmwXwpG7lCZBpja0Sz6I18ytO9xErNEJzxZMYMpUpQCkmVRNUiqBYzwpZAjMpSdqrusDBEkrhyrU3FOL004Z0nkVktjLHHuFW2pzQed9F4QmFQKSn+ipEhWcSvfs45yROgxP1wxKeqPx/yl7I62l3rYzsYVEWviRmqkSCDdXFQ20sXm9WZEnJ6ZaJ1xTKgQJFsqdZwMPJ04f9H+U8DJ8VgsT76DTZwqNvLlUW5def3LLDpnMm9VZCCczOVYsoN5YcSUNcMjOLuB92WxI7DUy02k1QGLklsSudCfBiCx6BzfD2gsXz0k6Sqd/wgiQpgB8Jkk1TpE/jeMMfckIizhVCk8PUCZ2mnc6hLkYGPpmcHsyXNJDLahbHSfRLnJjCV+zPhyEzgLYt8PErf8EXj6pkUM/wlczQL3s+l0lSeH1wbWOU0lUFovX70rmXVuKhw08xVQXZvUKN9/z5bN8fKlcICK9he6cx8nKFTEwbCkhUbkOG2gUtSBlHOPZxYQcUQSdiusLhwT9MHQOo0zvVeU3GzgoaPDeMpwjJQSYiWaXmH6KzZ6XQF9dcEwNxTz0WTgoKTXYGWUXwT7/OPfJ2Hs/4QT33qvq1PfvyO/f0++FnWr58rfofMXycniP09lE2JvjWonrIUzCFZJr3XEu8QA0D7xTP3b/L74GeZB6Bo58DUkSjYfRAFx27PIOnXsXmdwykrVJLavCNTZU0e/EfyDkCsaOz+myzbLDURSXICElQ/cdayaqoXf1tcOEblYR+VdwB2OF33SoY+eVoRI8uZgPIuK3Z7Ao6rU1C+dFqvssv5fgaAKc2C6LzJUWAK0n1OIQPsxFIxwcWdn16jV6OJruCM711eIsl+AGCnlttf1aTyXGVOCmh7ESNico9nU2UKPS/YantKmBsAZmQZpsZAWieqOJ2Y4LHMGQ2pTK2crQS88QwArUwYCuAZWSpWeVxaruVeHCcAuZPrtqjUgYiJppNwlTIADFY3cfU3RCLvHp0PZLqdEk8Yw/q2spyx8F+kS5GhKuUyANSwDFMbMv99oPcjBd3hDUya7xl1BQU3rSo423ONavJCv/QlALl9oMKyyYlLoJZSkumjh5pOrR6rnCBdmQFgr9TSzvm6ipbQjJENRFRcyzp2D0xoHdFZvpszfNoXgJrbDhgARlGzON9mslLLonO81QN4gWpllqI1rP8BI/eNQJkgs5xn1nN4AADIJQbAckS1u8NzZJU2bfc7lk7JVFQJlhAgaPpDDQAtzY24mU5WEYUJ0HhqtWfmPJ/FpjJ6yP85poLqOStno58A2GU6fP0dy5NjeynwvBsie0qLtgM+H3JAuAbdHzf/UL3Gau473Aet7H2PheZ+Ib6vs1WUTM8X5nP6E3efzgEQP4tzbJ16QrHqhHo+zkq/Z1PAChjxOUNZ7Xcsasl2DfcdS0dXx8Q/MSw/osxgvf7onEFxz/LwbA0ADQANAA0ADQANAA0ADQANAA0ADQANAFMGoKFhDA3TSxpGIka9kM1eGCLaENH+x2LUU875ls7G06iIN6k4k4qzNvMOl7jzn2TECAaAORMjGDmWkWNpKvVUkmPBkk2nIBVmNUaQauVEkOou6bkgVSbJpwDF0SbJp26MBoA9k+RPJi7JJ/csZed8zkZDZ1GSynRvAJifoiRVu48pK6870ijLTLXPmAFgumWZDee2GI6a/sum9sJ0sgwzAEx7+fWO01qYztA5RELP1X6Rqp4fxpojB/u/hnO9lRVrDumBG+5PNJrYJNviyQDQxzXfPwOi03QqtjlRh0Cmjtj+VMzV0TeqlbJObtEA0MqGPRu16GW2autiZ7o4g0pEyEp/PBlb5pmO6RODykkGgE8pYuRZ/2DVvTPR3rMqKhVwiMait3cDzSG5fs+0F/9l1ONJU3AKFi4++ULvIJ29IISnMNfBMQc2bXkHIJXbHsOZlKt4fst6yGCpT7ZNg2IvCLTiMm0arGy1aaAG1zp7yGhr0yDtBUFpFpUOOzKplxZrfzP4/sEaJVN49myjGsUeMpF7QaiQyN0LX6PzTTRDfeWhZ7E6qsYziCdW6SHDjl3rYzuwzQoVrLy6kVg175RMnoZMXqciLumqaW7jmhWqKWDkub6lXFpOpd2naKTMcIxo5ZUXYtrKC/Fcdx7guLrhRXO2jXpINKVm1VKKbb+CouGfS96gsxUpnkv5Kbx6okGOnlGecE7h77MzTy2a9s5LpVPmu2m5udvR2/KWTkmVOCa5bTHe0S+rvJlm+DQGr9mvMrPfG5jJdEq5IEpAM+uEGHTnJt2cj2wvSDNk3UAo5t6PPLj5+1utKMUExFRIargXJ/c2tarf5E+spvvqNs9bznZwpHMaGKlyfqMHc8Ej0meqmSdOJ9rZ/40enOBmdmQr1PKyTHrT3U03sAs15xXUpxg4Re1K724/VLNfZu9ryz1c5bhCWMwIWUXLtaSDRxQRSYqVrraUlwr/oqWpqDhW07uBi3pJxUSRKH8/7SWWeiHT9TyZ7Z2V/J5CRiJjum9WZyr9YVQIXeT62Hb2g6MGWWF7PNtz+RWlsgYtOFSOixWOgsaNnJhEJStm6aZPVJrd/f+4VMDMTe/4fxWx5OARztUTA+7hd2MYHi2WUC8Xp/ZHorcbJ1AQgYPMdCY4vXMF+/aO2/9FMbWBGf8C8zOUSHP+Sl1FM/YlVsVEdE7qhWWyWRCKC9XNKBQUFKE9JFlC1qMpioGbtVlmqTKLEwZ0wfcIGAfdmZQ4ZHasAbKRTaXFrHSDyBFWX7yvHO03ctJhPZUViXLnsv0ziOg4Fncy0QF91qqkYnXNgjZ/Yc6Lu0862yjf1NbYvpja+eW48qZZjrHnGzuU3Q5171MccQfAJaNz0E+md1xTh0ReIQlIYpVbDrW8Q1j7sM7N3ahSndc34CMHA+yLZXvmuOZPAU6rK3teRoGllr1A2rTGFZiWm94J3OZ3KrITFE3OfAatmL5+gmrhot2pYJCWzriZFNk54kTUekFIIlJ+82s/H1dUQG/hmVIQdiVAYP+T/ls71rc0K/h8dFoJS13LiJiXei/TvYJ6Ka6IgY71T/65aqh407cJnjMk26/pkGdjJpQtN1PK3qT9BoW3MZ/c3yfp3K5sP9a9B2+p2OdF4fy6pRilrNWajshujA6JNsAlA/q7PKTbSioy6wUAMRsJVUvQKoB7o0G8Iat06+SRq+dm02+Yqbjqbog36HhA3eh4dZD9P1JO5Vb1dN3J8VQBSNcOWztOz7c5NaWjlIFWq9nSwK/m3J/ZvLzg72TcIPaDlEXRsuTX7UfC9RhxlurkDNMCYLHt7U976wfD/I0oZ9Wx/8QeGvSZ5KVel8Y+NzY1IJ2ZiJFXqcCyfCzB6G2dE7QsTc/OwHg96wCEsFemt9uCAag7deUMx7SBJuQAsvwext9bpuU9d5X0xqGSThNtUmh6R0lVNFvOwg+BOlLlr5IAIOwy4FgQBIDNtxi0PB9p6dJ5NuxbpHt42oPmhqcS/iPkoipfGu2atqWfLCVk5QJcCokCpytFXjnCPlEbAOmcwqWKjIJYrxaJnk9VUsVEvK2A8/1Vxyyb6sBeITBYaDrztc68E95hNMMtV+hZtgpgLLW9Y4PqWeMAEHssnKMLuuejXidKF5B600rtNN3L5Od0XonatMbKTiOU6gFc7ei7bLrr6jwnllZSZ3gyZUjgvgoVXwRItDEYarpHwNdwKvILA0DBCFATGPFd0FM4Fo4py1wE0CsoHtc9C8mcz6aUR4iKc502Em5MQfxV0708Ec0izbCyqDwiCDaImZLynxIBBn62SkZjRDznOgg9dTAHUVTT7xaEjR5tWX1RneVcEEyX0J4wgYIW9DADcYo6Yy2gEB1Do/8sGvDs10SETwS0lURhWdCeL6tkczzZkDMvBAhvAR2QVC2LIHVRrBOSukkVgMjfIqdOLlU6aCouOEQAE/wc+rT+hjirK8LQJEnLu0UBVN27iOtflzIAn4IzqYo5ZNS+IKHI+4bza8vqY5OcUCCs2S8g5ZbGJUFdIvapiEwpU5M0AEVUSZQR0oRpJfQRSMiULdM8AhcMhClU4Aa4mzvW6jEXmkSvzhTZHApgOtxiZdn0SD4sAPEdAvST4hgUSIhqNcWS1bjejqGCoqY7ZlkDZRtBgUmYvRjJgnpuUoSNOy3b6CIuWtnzG/dT8TuCN+uxQFbo+cKQ80I72GcBRxSKJognnBIxZMW6t5d6wEhK5hBLLni+vqFaYqk+QsirRFE15SPjFDr1OwChgRTq7BCEN/aiuSeZtb2x1LqB6JFHQ0Wh45WXMHMaAG4W3FH9R5BaenpuN7fptaQGUmiBKprNhJHlyeregw5AIdCVCIH9VC25ExakuoyI2o+Q6TNsoBv2jaq2cHkGICJqUbcRnlRfG6tz5SANoawOqQaeqg9GF/c0aI5eA5C6Se2B5oBs1wJmtci8ktnKYI0J1CiRVC2ddNbtQ+3qgf0GQOLpvk6z/R+ipBGFigYUywDVTCeRwy1xHTuDUlzCTFNzQj9NAAr/HQKQUsqQ6nZRO2MQpM2fevRo1h44IKMCkYMQm2owUEwagEI0ATOghnNrGI7UzyY3M44FfRkpk7O7qsZPtIQgM3Wkp1RnhyQAKPa8VIuL7QPXtiJckFG90ES4VjrWcMW6e0lgkXpwhmU5BS/XIudcbnt7otIuaQDiHDgXmrmIYIJp9hz+U3kdUreeWaQNNGVDsi0AMUpVXKDquWE/Loy4qX+JcJ+isgLMllPLdxgADrXnb43vdIuOToK+jma339AW4gmNauk1AJ5qoxkzdBunN51z5HJ5DQ8dCpeas1pCd6xW2bdF3ePBjT4p0aoZVryU1LRSx/WJACAFSb7vzEzKFlERZ5o45mNgaYLokyiMe6KQtlkBIK4Z5QPlCe9nifVeM8NKrWsQNv2gY9BKPqsARHQPKzsERdr77ZqRjQEXfmgLUTtMwcZdUSkdnQBE2SUIY9RGY+sQJgo3ow/bWqH/GRL1QoaPLuCUeWDbyCoAUBwL2Qwil4U8H0JcyumaFJkZgUs3+m+IDk5U0oncdLHlXMs7xruLOr9Dv0vfwXfTsA02Y4BGHiT5ZhgAmmGGAaAZBoBmmGEAaIYBoBnM+B8tbktbgNBCXgAAAABJRU5ErkJggg==",
        "rain_of_arrows": "data:image/png;base64,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",
        "water_strike": "data:image/png;base64,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",
        "ice_spear": "data:image/png;base64,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",
        "frost_surge": "data:image/png;base64,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",
        "mana_spring": "data:image/png;base64,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",
        "entangle": "data:image/png;base64,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",
        "toxic_pollen": "data:image/png;base64,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",
        "natures_veil": "data:image/png;base64,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",
        "life_drain": "data:image/png;base64,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",
        "fireball": "data:image/png;base64,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",
        "flame_blast": "data:image/png;base64,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",
        "firestorm": "data:image/png;base64,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",
        "smoke_burst": "data:image/png;base64,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",
        "rejuvenate": "data:image/png;base64,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",
        "quick_aid": "data:image/png;base64,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",
        "taunt": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAACXBIWXMAACxLAAAsSwGlPZapAAATo0lEQVR42u1dDXQU1RXettrW2nrUqlXY2UXU2mr/sVWPVaySH8Cf/vhbW0/taa2WWj22ttbaplUrSRCoUdAokOwuIIIiSRZFEAUVDBjyC4QAgogif0UBgd2d2Uzvnd1gTHaz8968mX2zc+8573DgJMvOe9/cd3++e6/PR0JCQkJCQpJv0TbMate2vPi/fmtz3Tt6S/nZtEPmRW8ff3XGvcy2Nke36S1lx7rpGZPtj/yH6RlxAcayAxB+oHt3u55pJbctPZBoqbyAoGXyZe6seT7bXmZaWue0qJueT22fNDG5q6Wb5RmN5wSMcQHQAOH7y2JqS/logpcJAObYy0/s6/Y3EvrqypNdo/nWVIe6d7fprOCzDMDUZjUmtObKnxPEBrh+37jvjO5draYPRV3z5EzXvFhrp8zmAZ4wABog3PGmprVOvJWgls02mlRpWvttez3mBttP18s+ra0Lv2oFfMIAmAJhU1Jrn3gnwS3DPnZNX2Z6H9dWR6QH3/rbPqdteKrVKviEAtDYvJ2ruvX2hwmEfTXglgW7TNt+rWUnSQ2+ppuPTG6cs0YE+IQD8GNNOOFmgl36wFrHHQ0vZtLUYayZMtdL4LMFgGkQalrL+JsIfhCeaB53lamD2L5S0xvL/TKDT9v49GqR4LMNgCkQrlQx+Or567dj8nhTBwEGvdTg2/B0h2jw2QpA48PfX55Qm8tHetoBWVuzIPdetelqS8WP5AXfrHY7wGc7AHuC1YnmiuGe1YAbn1mXc482PbdJ2lCLIG83bwDsSdvprQ991ZMA3Lrog1z7I2vkINkVeslO8DkGQAOEEIrQl5cd7zkAQpB+4Bvi9UN4zcmXXnv8CdvBt7nhPbXtoSscAaCx2RvndOqvlB3hmRAM5HNzkw5qF8lHLKh6gCV1yAy8d1/5KNnxyH1CE+im/3Mwyj0TgllVcWnOvK9kThqEz35rNm7JHhmBlG3ntAa9sewY4QwOpi+y5rFqT3jArRNu4bZ/8vHCALMJw2fiz7xN17pmNjH7AbYBcGdzN2RLbit4DdhR9eCA+9A59Vl5wi3lgeS7Sz4SftbwmVrbhDG2c9jYY4SNaqKp/LyCdkBWP/ZYjuu3SArwgV2ubZq3WSjwgJyK9q3p69ZpABogfOfFD9xGO2fSgMDry64ZXt7vVra2iXPdgylIR1m83G/K+pnLC5eGP60h63N3hRZL8R3bq+4W5fEiGyq5dsosYWElJwBofPH2yeMKEoDrwkuyagkJuJOYoUpuX6GKSjaAXX+D4Kq42Z2OABDccwxZFBwA1894M5t9BDStk/JOE9u6cI+QK3fDrBbbeIyoohHdtoNw60sfFlqmJBt3Lrnl+R351861Cy0DDyhkjtxe6CigPWNXgLL3m1RQGvCtuZsyU69qF+b1ezWPvzG5q7XbmsJY9IHeXnm+szZDU8WFyc31W+0EIcbOCgaAkOvM9IyJ9qqy/MX7yk5AD9ySooCQTd7KRpGig/GtXEl27jcLyjwLpetCckt0W6ZnjK8c+928facNM1dYAl9X5DUp8vkYREZbxh6WBLT+AKC7XgO+PX97/xdseTx/IZeJd/IWkKP5pbY/WuGTreBG6wTOmA3MCXX15Enu74bQ/wVNbp73dl7OCux4XmcSSMVxbdW46yROuk+8FXltYkMzK9V489hvS33FQg0vppsSqx4allkDvrAzQ+3HkjwFxaO8jHa1qbxE+rddb7r/NKCWbxTNH5T6mdsqzsQyVPQoNXDOkOPWOwuQqR4Y7WfnO3NVns8TwTCY7E57upZrCLBXiMArWeuoukfubEfolb4M5x6tCADc3T8D4nzNdPKtuW9xxGX3xtvKv+lzKw0puUNMzFDb9tohDB3IrgUzUc4yaR08VP31ii9hSMswXVZP/i/GWDEGmlz9xFThL0jbxDvY6zQW7NYb7z/V1Qa42lT5EwSPEBB21r7gJi2Yy6bK5IlC9VyXvnz8UUJfDgA60t+ZNN/b89+X+YVnEnzbhZR2AstC5tLObFrQvK0rHnzpvn3TmelxQEz1FZIYkXcBzgl+RqFoQSfAh+QADJ+YZy6/vB9fJF8hitHOS0BfEa15wu2FpAXtAl8qRDStznyV2pIDrnU4mGjfXTNXWU6AS1zWyWQL2gg+vEax5MGcTQp1yW4KteS7q6bM5FWzWtBO8KWCzuY6GmA/QlnqUlxTg5B8b+lB9O7cqgXtBh8SOUy9BFiZCGWjPh+NLWAH4donwm7UglbAZxYswFZZbmoPoW2cz+syUM3EwCWdy+Iys6czaUGrmg/o/StzvXgp8OdOAMgeV3W4/deslkLXgiKuXQOAmHOGzEb2W6V2kQn7c52X+vPkPiw4GA0oSjwsDZlrinu0oCibDwF4mLCbwWtFhnKuCjfMTXuxQ5kJEJYdr3GQW9WO6hqZtSB2FhXlcPQAMAWkhf/r+/LlGhiT3PbqwYINNAujc727eB8zUcFGj1KyEs+Vn3h2COz3zvmmcswDeLxQiEQo8+Wi+Y87F/tKs8UFJ1V6EYC97WDsNpbD432c0MXCrmaYumhkRwqgfoQLgOiUtD7854Gq3LC7PaHKJ66pT8ZNbhn/By8CsIcp5NXmT/ZuOAN5QctDoc+hF4tOTdQV3xyvL6lKREumJ+pHzknUF1fDKlOfLbpEbxp2pBMAzJ5mW6HSPGer3RhMcwlhzsabYy92RDs3lFwRbyhdloiO7lbnj9azrUR01D4A5yP6vBGDnAcgdCRtr/oHoUiAU4JxL1NvvIl2Z1ZYH/rs4V9ELTcQ6LIA8cN4dMT1TgIQ8+XY00fmnLl7QAhtLExPmhygGycSNLFVBhf4oqOPU6Olq1jB9zEIR3cn6ovudPIKPjw4EvrTYN6XAtCW2sSZGxWVLcFutBOBEk/wFvexpwt9n0pESxfxgq+XJkxqdSOucRKAmcEIpaOkGRlB0FkxCCP5uau5Mrc9wzGovG3RUHNZBV/PikdH7tLrh5+QDwD2dVCS62rqkalO6DI/v+ImMy3F+ja6RBp/z++hBmAC/nNXHpuYP3qPKAAaIKwrnpQvAGKZKN4EGLbyQuzUl4/ZZb2pRn1b0GrrZ7Uxab+Gkr+JBJ9xFTeM+khfUHy8kwDEInPMFbu+1jfvVzHmPHP0tjPyw0A3MpwO2HgrM3nVhtK1ogFogLC+aIwTcUD8HazPJuQIbTE24TYzmRG8avrnTqfOMx1ojl46NFesj18Lli62BYDQEiXVowa8XsqA5G8GbzZmCEvri8S8EbfYAb6eILVe5vu0KACi1jf60UDclNDhgMRXPPAdng6tLO1/wVl43C4AppyRH51tBYDkUOT7Ks5BwLRa2K5FSxfYCUCtruhqLkY0ORRyiNpceSVrJwKtZZzpQLCVzIdJR4QpM6J3VN2F0yzp5PPpBWOjxTXVIQgob+cJR7AMR1SjIzts1YDR4r/TiXoAdL0XZlQYANhmJwDV+uIH6XQlHnWPqaK+cTxr40Nbu1mMdQhCv2SrE9JQPIFOWmYbD/h9xnQmoBaJyX+yjUcA3l/ETgAm60r+Tafslq5a6cAyVnfxT+5ezMSEUetKK212QsbQ6bqudBPGykOXeax1YO97zMaE0RqKb7TVBpxXdBWdqKvDMOOuMtpVmAxIMzNh6kcE7ErF4YrNHfF1OsVC0IrAgkaSpWYMUcw+hoqVCZOyA0eusccBGfUhEl3p9ArVcclAXgUmzFKOAqQHbCIjLKTT8pjjwsKEOfw5z154SmL+qLhwAEI5J52SV8AIDXmg0P2pRFvVvTy/rzWU1AsmpMaQaU0nQ2JKEtHiYUDLT4oLv4ycQ7tKwqoFnxfHBSy6iHaUhEli80rOBBLpQeveb2kj7SYJnxasL7rXmubD4vQRw2knSTj7WUOB+tyL3uMGYUNpmHaRxJpDEhkyRX1uODv46i6NYW8Z2kESSxIPBf6TCAd19dnzWMCnq9NPe4N2j8S6BgwF/5QIB3RjzfyabmjD6KjMwMN/B6CC1sSfn0e7R2JdA4b9Nx0GYM+KDNUTT39LT8wZpqvPnAt/npP6e+TU3j9XS7tHYh2AEf/1/QBoZoUC1bR7JAIAqFzDA8B4OPAY7R5J3jQgAZBEjBNSq/yOE4CTaPdIBIRhlH9x2YBhhYLQJAI0IIRTODXgCto9EksSCw36KmjAOBcAQ4HuRG1gGO0iCbPokcApAKJ7AUQf8V2/h0G4H1Z5LBI4i3aVZEA5FPafDqAZA4B5AZZmBXhZ4oId8bBynxoOXKLP9h9FO+51LRf+ytFqKDACNVQipKwRDriBNaMKfzYZ2jGsXK5HTj+GTqTgi5Z8RyRqAhegVwtrWRoEugwL7UzjO4WVylhIuVIPDz2JTqwA5MBMZRBeq3D91cHh7pMFcCZXF+aT4UX5bSwUpIJ2N0nqalUWQygk6TLQDWRDboU1TY0ERuuzfZ+hU/bJyl4JjC8Y0GUH41tgt55Dp10ozBUXLnjRDgBX8Xw6dVmcjNknfhGu3R1eAWDam951oNY/mE7fJwNzWbnbS+DrpQkXUNMjGbRfOLDTiwBMgdB/HaEgv4SBv3oVfGnmzRbKruRN+/k+Awew2dsARM/Y/3tCgy8fjBXlSs+DzwCgsgmzPYQI5+N+CwiAhx2SGwgRDsqhWuW0gsp2CGDckEfsqPZT7iPgfXKpYaWIkOFU4yCwewh0/TxiaobphEBS/lICW2auIbKACCG2x/6UMAEuqxb8GyHE1pqN048xkvEEtuwhmTIfTVS3j/US+A3H1aSBl9juIhCtsuSMACeSkGJfsfgyjkOZhQa6WwAYCwd+xlsSSoXxttfqQs0t84EMPhe0ynTXaMBa/0XwnJOt8AX1KWd+iRAjvmPpgxzX76tpytYU18TzkHpfEzzZSm1yPBT8NSFGpPMBhjVs7Dvs15lyeRq8k10DwFDgMqvBdtCCSwg1ImN/YX8pT3VZj0cIBzLRTRrQKtMbTRVMVxJyxPH+ZrHbUsrvehEXxrpHAwZH9WJ732Gh5vhfhBwR1++T/uPhOjrEeAXt7E3UdBVxFZyQjzmPZ33WqITj84Y3E0FBjPYbw3EAZTkbjsuaUqsJfqeP8/VLEWAm4SYeBDoY7Z+D+tSTT+xTsH6ZWwB4qCY4pJ8DFlJaObXgVEKRw8QDuH4f799u1/8DlxAKuiEE8/l++1AbHMnnDSv70JkhJHGXXAbqWQ8wUz8V1CruAKCyY4As0GLOz6WJ7TxyaEZgKAfrOeOUIr36lC+4hFr/ZnZbePC5XJkgyC0Tmvjyvo8wb3ZEuXCAGpLdLqDW1+Qown+G0xn5ASGKQQ6GhgbAfokxXr8rc6TyVrqACXNHznx4WElwfO4UQhVbuw3m3C1ONsphTz4lf11H4BITdnE1F0GBml+ak9iMwWewdzGFoGuO2lg4hAdkB6A+45QTzDRS5yEqYFtgQlfO/s1DT4KNauQ4vD9yTb+UrBGlrcwgDMmEBn2ZUJZtU2uVs3mq3eAw9piJdcFn/1ByAD5t+kWtCR7L41Qhw4aQltG4Dv4UvN69nKGLsaYPjYvQ6tj6A/dAbfNxxr1I0sgU7PZsB3u0TXiBgdR1llJE7CYlbQywdvC3mPYOQMT7PBjwRraMPiNwnHe1Xk3wa5z2num4WYbYYlTSFNwenmo2uFJ/ZTHzshdWBTo23mI3R5TbkTRgNW8an+7/pt20fofsv3ruFnWMZI0stmEMwzsYgTD7f2OLYPi9f6ebRDUZcdZUqOsvUL34PTnTa5CThTfuFUF50yi7xvBfJycAg3/ivkmg7EBgKhBTn7NzDVvEmGsujiZODUXHUpzmAiM+EfF/HxdPV06s6RUxNMbQfGGliuc7YCZB0gzIORYLtl61IS+9KFONMYLKbNkoEoMtNVM/OH1IEMdIgbHb3JsYgEAyQGDCm0LjGotkBB3U22rIX2Ll+uf1tm1kwOy1OoAmEQmeZ2PHiCb47KsP19cwFnih2cP3UMZ8tcD+HAhfirTxjIcNHhYSCkTMZkvNVAs8iKwWAY0tl8rFgFHmi5n6GTgVPqvBRjt1PY4PQ0Ay/t5zvGq90aSaHd/XMMYvirMsBB1QA3rMAuuLJ0jmgPzTJ3ZcGbC/lRaJGiZN5W0CGTNruOKkIqzGT6e7ugSFJhrtqGmI1wZ+IVUrjohyhR2lDEYPbYt9ZoScI2CDl4+3jcODEmHntcZqgz+xq6ILGdMyARCpZ3bW1BhlDXAN2jKM29QYicwmmpmswVSHv2xzLOz/sd2lhGkTYb8kDOjdDofAKmBtd6q+pafInk9TRAJncZEfedx9KLpxsoYVnut1STzgxflIfxqxQ2BXs5J+rZTGcrr3yj02eX4xYyhzeMi380T3f1gSB6Q670X/0MgIg/qiwJjO65eJq8sNK08IDLiuw6i/GeKlvQAM/loSG/BeaVKk6ESGlGuxvyCr/d9Lo2/raa4kuiv93bxNEzHRnpr4HbxYllYRRs9AOYYN3uSTmZ8JRN90frdrQCczFNgA6y49/JWjbbSb/N+At2OuGW/XMHRDgVBqzDynF2T7255/biDyIF1DIoE9w4xLekTazQahBHLrsciQM31OV6wheRIBBkB7I52qec3oXg9VXchQcUNTHBm4gRgi8ZH4vDpt6fm8X8MD1DGTFH7h+6MEQJJ89p25S4JZv8PpJLyrAa+VpR80iRc1IHh0ElCxbqST8Hm3CD7NbcvbwjAGnQQJCQkJCQmJw/J/6tMMSI/ZS+IAAAAASUVORK5CYII=",
        "provoke": "data:image/png;base64,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",
        "toughness": "data:image/png;base64,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",
        "elusiveness": "data:image/png;base64,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",
        "vampirism": "data:image/png;base64,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",
        "retribution": "data:image/png;base64,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",
        "spike_shell": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAACXBIWXMAACxLAAAsSwGlPZapAAAV9klEQVR42u1dCZRU5ZWu2c7kZCYZTzwR+72qbhfcNU40LlnGSFxGo5JkgvskauKSGNGJS+IZNaiJxFGBrnrV3TYCjQhEUCaCC24RUBEScYVBYhLorurN3mjoToN0y5v7/dVNd1fXe/WW/6+u9+rec/4jNk0t/3/f/e/97r3fjURYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYxkdaHpzwT021ZZ/mnWAZF2k0tDsajNiPeCdYCi4fJT//z/UJvb0hrn/Au8FScEnFtV80JHQTq7FSO4N3hKVg0j5n/8+Q9esYUsBUQl/Ou8JSMEkb+r1DyidWXB9oiMcO5Z1hUS7b6yr2a0ho20cpIJahP8S7w1KIyPe+MconlrYdsAzvEIta6xfXunMrIK1k7Me8SyzqIt+kdr+l8mV8QYZkWBQp34zo51IJG+vHkAyLSkGQkU/5GJJhUSLN8QM/T0FGjxMFZEiGRYXvN8uR8g1ZwaQ+g3eNRYq0VE84gJSq140CMiRTTNYjodVuTR5YEWDfz3CnfMGFZEwz8jdhdN4Xk0XYQdfYbea0yN8G6bO3GzGtPqH1eVJAgmSCcqDmqsjfk6G4i0D2L4dPAZP6dSOupnVkGY4JjvXWqz0pX4AgmXSNfljK0Nbj8/6pSouF0IGPThxtGbRd9LRN/zA+8R+L+XN31ER1fFY/CljMkAyscyoRvYEs9V8HjcPHQbuhnFvBhJYecziG/n+yTb5MpSblm+1H+WRCMrIf1rba8jL6fM9nncefIyEGcRdbHFA/WYkaVBfL6M8gRV8l47C2zZpwECyCbwWUAMngWmw0os/IMwaxi8mv7RxbzaO9El4FHOUH5lTE+nRCP9fPe9TH9SmDrzXH/yHpc2Uo36DL0e0VkumIT/wsKcZG+k57/fpnXbWH/EsqrtfZuAvzQwzkZvmBuZVwL10DjyPr4K1EfnhzU/HoVK9Rb2Oy/AzyUdfRA/EmvdZb9Jk20OFsSBllb9OfN9PPGsiC/DltaFvp5ylSkEb6eQOV6DfVJ6Jp/Jl+BpfjoyZRNa3t9ALJmEsjf0efYeUwrKNf53n/Z0VPo8+11W7/04mye0KNB+byAy3WRykjerVbh5oOq2mE1dnTWl1+ptXvt1YeMIH8z/PTRtndVN28gqLAD+nz7ZZm9XJYQVJQKPQi9JI0GvqF+Swa/e4jWRbqKY/wynThi+ZzFYzoVWFP5i92eXDPOwWwKZo7OcehdwFiGPLpyCr+BFEpKVqjMkVzvch6xqPL6AG4FQGZWXviPwyC99Ny/O6Oob93tCfV0WPp37zn9LOkZ+mnh1sB8/mBuQ/IEYCdjuu/tLA8nQ3CuhWLwuVdvXRVvg13xCuuOASvuAXQ/1JZVh4Jd0LfgR9orYi2ADZ8NOurJTDKh2vW9vPmi6jhw9JrvOjBRdgTWgzQox+Ya5NyAtgdVRVH0d/vtfdvAqCA4jNqefw0vdUqSCMf7jK4HR4V/y+RSGkUdS72bSUGAWw48eTQx8l/2u3Uurh6n6oKs2n2MWbz3BPM1gWnmq2LTjPblpxtdiw732xfeo7489DC3+F3mud8gf7dwZ6+V9qIOvq9+gx2uqK+Uv8urFY+eMXhDbMqUiL9tNf6txRRUiayhnRtuLFuqX1WZvRrNc893mx/4hyze+UVZs+qn5p9639pfvx+lfnJhwtpLfK0Bj6Yb378niFea+fLN5pdKy422x4/gxT0eHrPWDb85MpCp0Y/jAQFaaucRLm2rxnXHo2URmGnDz/QGDyoEQ56yr31NNsWn27ueOEas2/dPebA5nmelcyPckIxd7xwNSnlmWY6WeH6O+SCeRDxpjwqYugxQD9+YGpY0fbK8O1aF36NFGFBwRUv1+pacYmnQAVW0+Iq3U1/v8WtIoYeA/TqB6bzWLmUR2va+dSUcVe+nS9P9eMH5/Ppemnv3mmodKaIoccAXeOBcWfKlU5EPR/izpdvGDfl63v9DvoM5X6CBqfVOO1IK9KfB0oaA3TlByLIMJwFI/6CmZjwAwutfLvfeogi5UN844Uu/802ywxQqWCATvxAK18vN2xR4Rt7Sz98uIhWC6V8iK6bZh8tBTdsWfhV+q+rh/AT8g3rU1n/pmQwQFs/0HATUETN9ie/aTY/eqqcg6z7EkXDdeqjX4q4W+pOlAZc73zxR+but2cQLnmBwCxdFMl2pRJl/SWHAVr5gXgiUw6f5Jb5J5u7/nAfHeZcSkuVSzvMtiVn+cL98q4/Pma2/eYbUjMnrYsnjbCsSbPjyQvGYozWPmQ/WcOeksIAc/mB9RkIYMBJVgK42ZCS9K65VXoqrHvlD5QpYO+aW+TnjasOEphitn/Zuuh0N9F0e3MyOj0SKU2O5WYnZe/Nc//V3LXhgVEb3f7kedIPtGn2UeqiXgp2VOSPEU1bvR9cC4evsxkNWCWlfKjzI5yqJd/mdPzvd+gpz/LP/riQgofDpB8m8rkqr2AEPLI/c+fyKbbviVvDYW66gfLrh5eE8okiAoq87DeknHC6n+SOJN9LKLEmSM8pzXo8fbmCh2ZS/sj7vTj5zqc4qkSvn1l2QiTsLFOpPAWiwMj6Xr/TckN3bfgf6QeZrjlUBDaqo+D0w0dI/dztT5zn2AKjICIfbAPm//qa8qNDqXzbplV8ir7kG7aKUHsEQQsP2m5m/8Ya6Qq486UfFygDcqeLSDX/6ll9s+tgCMFLvjYBtDCESvlEmXhcX5oPFAau5WQjUacnzYos/feCZkJ2vHiNlM+N2sPsKNjJ2vWHX4sH3T461j5E41bJcCsL5SMIwbE/9YwcfwqA9nhUxsC/9ZMLRmABPNRzRob86OY5x+VJ92mbQEsceOWjCt7vWTXZZPyviXmv3bE1dfPICh7r4wAPEZkEpeBzPku0blqmQNVD+rBv/a+kpAVhRe19Qu01N514xef3VR14lGjMtmyyKRcH4e0pTgqM0F2wMVGUYsGPLIZ6QFyhO57/YV5FGPrsXU9fKjVYQgYlb26a+BEjQZ0mSV9gi11Ot+eV//J5gPPM7ueutD5AcviRf+1YNlk47F58poJZRPLN8F0Q2SJt1770XPGw4GeooEYkq6Q6551ZeTFKylxdHsCKF/03tqmv566QupH9Gx8WV1Pf2rvMXW/cLXxKKGixKlxRKf+b0/MB1r2p2uhxAaLljV5vH3meywdfZKvvjV/YQkQo9ceU0EgAZqkdbkfqDb9t4IO5fOhFuJANsu+e05fKpAWuT5QfLBfvo8paO7AZZt4p1sdrfBagqTwNTJe4MEb7U7/JKWiaBwe16F82tNWg4wM3JMbeUq9u2c8JeJxJ69f4JfqFm8EtAsezMR67CLx9aFrBC22rLTsSjJ944Vycd2Pm6GYj9z6DDl6FiMznms3zvmibrhsCqcFSAQIo6IjQGegRsXiRDr3rYKzZWlDQRZD7czIDzabC9q8Z+jG9hT4EOP72cZxgpQf/v63AGQdePiJjuqWyg5J9Z5qBZtoGrZinPmQo8Sh6OtLg82ASVXKf9Ky6iQ+3mIMQylMjTdj51HcFDNRYe6Tnttd8RKSNRmzymPuauuNvV6mAXSsu44Mu4qWiXtEixVdpNxdjvqo3blvCV3BRKyBlWgpAP/eWbWoPJVPEffx7FW/eMv8kPugiXnaBhyQ22B3oBYo4mSGRGsm3LGnhCwb9kPo31ooK4wx7VrgUEERJahUwdqXzTEZl9KThCTqSyseJPy+YsEQddcyNzTejL6Xt8bNEaVUYgHUVLQMjAOw69+k0wbjpjKVAavl4UcERMx2VfaG8q3P5hWb/pkcCHQUrUsAtnkfXApyWV/Z+feCwMLeOeRNBF32v/3dALf18z+yuNvWEfekq/Qs+B9rpK2R8GPhOgTkMaiByUqNnVWYWtIdtOA13vuSoN3q97/xuU23ZpxvANVdC/l/n8ot80wgHMe2IukNZykfz7ZbJK6unqgVKn7SXQhYEldYyeGfgFwYxWm5d8GUZ2Y767XUV+0mm0oh+nVDsPV4oL4q5EnmM9RP9s7I67s4NZl2gP7xvQNnkddLsre6ZSG8M0AEslMbfN+QP7n6nMoCY4Fl+3I9euG0KCk1jk92yc4ISAlwugXn618qHImS3HhTGDTEEW4R33M/btNKI/YyP4RSdEzJJ+EBoeAnSxoMMSTp/i2DlD15E3LvmNte81akR09el0v6i4DArvM5jCaPiCwTOAV/0dfm8M8QHE1RwGqVZbiYajPL9q6Lfluj7aa/nnlhkUXpFaZ0gbniGd1l2JiCqrKVS+QKzK014cjbnboxFXCMn+qVp23bIfzbFRMeTk8eVccCfBZykJB0V6FwxKSGieUvLZ0d2NDP2JRmE4i9ZR7hTBQniMKHktwOrfJnJRZfJT8QTphjkPRlCB8DgkE2GjlRlN/3cpvh0gT/rR83IVgUJAt/b8mjGeSfmAfgLQd/o3tduV0D9e2RoSrZAaiSsoZjREhX7BYzXkveQKqowzdMH+Gw9BnTHS9eNos0NR0fYfF/wg9UYiLDVDgKm6X11OMgE1GQ9z0W/yTObqdXYd9TCjeFuDsnqWPYtuSymggIu3NXU/e/X2LAqaO97pNfQplk2GD1zeWg3E9ilvzlupdkNaFdRnY7rp7qmTUhblOXDqS4WejN1VvACSdzTEwsyhak4ClrvsClO0Ga7q36hcfBhqmz2wrQlo01RNfN+ccE1C62pk+NaF1gU3JTjP2e1qeCxK4UNhZPd4GMcLJq7wxKcOadO/k/r6mgyao6UD1NzrFgSMKuNN9RZGVaQStCkRcfvVlo+tI4LVIkh4Z5iGPKMFkiA3CgNannsK2IGWsdv/2OQ6bRwmYXu577vuEAV1HPjmQMf2DxHVGIj8m5d9G+iEr39iXOEK4BC28IUtJ5qdQ3vcoQJopLBqrpF9TCXIdRdHLpNigfNM93Pfq9gDKiAGYB7wv9FiRl6nNEth83GpE1YSj+s9f7XAuJ1uda+iYrAY4ykAJisdAIAzVzx3BtMVS4nW85tEzle9Y6sXd4xV6UJ6HhLm06tztUoWDy8fa+p69zr31RriQmiwS0f9ldpOZkRRNnKm6Mv9ZRrLVXeQUA8Xno4sGe9r/1MYVHHaZZtmpY9wmjBpF9K5c5nHq08z4vo2vsYq2hg+3H9uCogfPJeOh9T5q9mBvFYXsMX526/TMa+ZjkWlBp1ir0UCjlc5ChLRQFRieQbLCclVHF7AEe1uYaXWI1VeNAS+3vzfrXhO7Uv+sHc9mFvFDGXxtU7Rx6dGpRw1c3yDcpjX7W6hjsFNW+OjrfNOa/fR44rgO8nqQ7PiAauD8UrNCS1bEwo4U0FY9zHbTta+arLD7Geyn2h8hqz/CNEnS80FoVdAf3MybN7eGW20GaKOiwLVadnwy83WF6/imEORz0HLseYhjrbQH6uOg6/qNTZybg9Ld7r7ezC06VW4LPKhhoMKlSxkWEkkPTeLuleCQFqS+mqo8yVxft8gnrTkW2XOUuvWhdPUoreN889Qckm9q2/N8T+35UFIBOXo4R2nIONhn7hYPARO9S6nOhqs9gnh+dUQPrioVXAlVcVhM1esDoQM6zfoTeW2O7QGFhoojX8Ml1dvZ3k3ouRC80yn4R2ntvVBVNAYYSo681XrzXlzm39QEQkVumaoa43+RXHk5VumtsJ7Eylm8cSPvt9+VyLVPLXEZ/4WcwGWZ67m+tERbNp7/eRcnOyykNdi9e/abYU0L5QSmjX6ooJXeCBXp+7qPIcJflLKQSIJT6PBPWRhVQ+BIu4+r082HYPTCqp3Y/6v61W6Di632Rak55VP1W+WTJxrGJdPavV7yNK3XB97trwgA/K33ttDQ7dvi9QDljbad/Zf4wg3fariIiIwBKgdNNqjxB50vA3AD1GLpJ8CAvUG21Lzs4EcT7wX6F4VMHugFGrKa8CjiQiypjheUXDuzKGEu7Vn5dMNUyGULxcSgoOV/rO3031V/FOCouiBrhAbt4/gqZhVCi4KXsCD4ybSBPNKtnENtKT6a/cWDLKtw+SoTYB737d8aKVwO/4DLQrAC90e7tB5zAMaZiEiCbauHf4TxZ1aU6ahDB7AykyJKmBL/atvUu0PkJxgLp3r7yCrOQlgmELjTQoM8eTiScKyXf06WYrMcrLESxholGpluSjisVpMQeMB6hHMpmihb6sHW6bTCuAJyv8fLsR00blg9E4TOzm91H30h73vsPBQml6X/2Zcs4YKLsYGIjmmqASPypoh0THYLrmsJy3Q0vdSSI484vr7n7rIVEd5aNpf1uDoV1h35ZJo5VyMqK6UEY4sj2rbwnFEL/gcdtUCguHGwaYq98zwMgydCD6GedKbl4LBRw32s4KzsEL/Q3S1t/5i6oOEtEQ8r6lfE0Gb0ijf6UbsniUabvF19gGDB0hZ/FZlND4J2s8SrR39q65VQCUfNjFw4uIERXA/RCcSBhOva4xHrtIKlM+pl1TBcMDMKeyIlek+1DBDIBadcM0r7F+I/xCNINJqUjHfGlDX+yais31BE1qKAHRDF3RK604ZPyg72gsAt4InKswTAwlonAUuCFiRhTsfRJoLgZU7feYiumLiter/KlKi+GOpw/yhowrOhe4jEwMyvbRuISrW/iSHP3mhUkQgADeQu9wZpqB1LNppTzurIZk7JhIsUhbbXkZ+IAxH4Is44DarEe56DdAgIOyb2w0CBIzc9kWlJz/hqZ+4LFIELQSdip78PTg+ghEk40J7Uypvp0KaamecEBDUr+OZoYtc5NlkeVbNs85ToDYYInqWnGpyBggv4mDAnIfxBIsYHCoBUReHlgcpjqJph+lpW16a2CUztJnpA8OxzRtlN0trmoPQLeKpDuuJQRBmI6EawpALqp/ABmBLQAWtW/dPUJpd78zU3Sj9W96xGdRxgLxGngtQB14bZERoocDgRh8387lU0R2B1UkUDClKcyxgcRegt42ppL6DMBwgVU6WwJMqoJtMqLfwZeEQlox8Rf7QloLGQGkCaHM4v9tlowh2GqUTusmxfstbiyQk0ZKTYCON8a1r5BTexs2wqpDj5e01Qs/Ha0Y6Vn66TlpMkpdCPzen67tSWiYp6LFGroWVtcn9A5WHk+rDcl/Uri7sKeuyMJZstj7E+UHYwwoWclfgWWJFPNd2thuVrJ9lBfYi7W0N9W0R9dsrdaOYK0pkF+ZqoyeRBbzUjzptGoF0z8pqIAPQqZomdtAW5eKa4/SbXFHfVyfgv5u1oQilW3TKj6VrtEPQ2RHinkVEbHfDjo6shTz00n96UEgfcsg1rVnHAMCem8tncku6MvhfhAEcic9WD9sMmJnpaqjx7bP2f8zfKIhl+11FftBYVGoS476KU1VsbMbjdhkVPAS2H4t4ZtTBy2t82VotyJlhdfAawFbw2vjmhQZpRnRz/HOs7CwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwFLP8Pyztu1TVn4K8AAAAAElFTkSuQmCC"
    });
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

    function isKunpoNode(node) {
        const el = node && (node.nodeType === 1 ? node : node.parentElement);
        return !!(el && el.closest && el.closest('[id^="kunpo-"], [class*="kunpo-"]'));
    }
    function hasGameMutation(records) {
        return records.some(function (r) {
            if (isKunpoNode(r.target)) return false;
            if (r.type !== 'childList') return true;
            return [...r.addedNodes, ...r.removedNodes].some(n => !isKunpoNode(n));
        });
    }
    function createScopedUiObserver(selector, callback, options) {
        let roots = [];
        let stopped = false;
        const content = new MutationObserver(function (records) {
            if (!stopped && hasGameMutation(records)) callback(records);
        });
        const relevantNode = function (n) {
            return n.nodeType === 1 && !isKunpoNode(n) &&
                (n.matches(selector) || !!n.querySelector(selector));
        };
        const bind = function () {
            content.disconnect();
            roots = Array.from(document.querySelectorAll(selector));
            roots.forEach(r => content.observe(r, options || { childList: true, subtree: true }));
        };
        const lifecycle = new MutationObserver(function (records) {
            if (stopped) return;
            const changed = records.some(r => !isKunpoNode(r.target) &&
                [...r.addedNodes, ...r.removedNodes].some(relevantNode));
            if (!changed) return;
            bind();
            callback(records);
        });
        bind();
        lifecycle.observe(document.body, { childList: true, subtree: true });
        return { disconnect() { stopped = true; content.disconnect(); lifecycle.disconnect(); roots = []; } };
    }
    const jsonReadCache = new Map();
    function readJsonCached(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            const hit = jsonReadCache.get(key);
            if (hit && hit.raw === raw) return hit.value;
            const value = raw ? JSON.parse(raw) : fallback;
            if (jsonReadCache.size >= 12 && !jsonReadCache.has(key)) jsonReadCache.delete(jsonReadCache.keys().next().value);
            jsonReadCache.set(key, { raw, value });
            return value;
        } catch (_) { return fallback; }
    }
    const loadoutCache = { gs: null, settings: null, dict: null, items: null, revision: -1, at: 0, data: null };
    let inventoryRevision = 0;
    let loadoutStatusTimer = 0;
    function scheduleLoadoutStatus() {
        if (loadoutStatusTimer) return;
        loadoutStatusTimer = setTimeout(function () { loadoutStatusTimer = 0; refreshLoadoutStatus(); }, 100);
    }
    const assignmentRenderCache = { sig: '', cards: [], nodes: [], message: '' };
    function trialGameText(card) {
        const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
        let node, text = '';
        while ((node = walker.nextNode())) if (!isKunpoNode(node)) text += node.textContent;
        return text;
    }
    function assignmentInputsUnchanged(cards, opts) {
        const sig = JSON.stringify([assignmentState.doc, currentCharacterName(), !!(opts && opts.expired),
            cards.map(c => [c.getAttribute('data-trial-hrid'), trialGameText(c),
                Array.from(c.querySelectorAll('use')).map(u => u.getAttribute('href') || u.getAttribute('xlink:href'))])]);
        const unchanged = sig === assignmentRenderCache.sig && cards.length === assignmentRenderCache.cards.length &&
            cards.every((c, i) => c === assignmentRenderCache.cards[i]) &&
            assignmentRenderCache.nodes.every(n => n.isConnected) && !!document.getElementById('kunpo-assignment-style');
        return { sig, unchanged };
    }

    const assignmentState = {
        // fetchedOnce：本会话已经成功拉过一次排刀。此后不再自动拉取
        // （进入试炼界面 / 轮询都不再触发），只有手动点「显示排刀」或改设置才强制拉。
        doc: null, fetchedAt: 0, fetchedOnce: false, inFlight: false,
        timer: 0, pollTimer: null, observer: null, rendering: false,
        forceShowExpired: false,  // 用户手动「显示排刀」强制展示过期排刀时置 true；重新进入界面/拉到新排刀时复位
        // 试炼页面是否已打开（页面里有试炼卡片）：用于「刚打开页面的那一次」才提示。
        cardsPresent: false,
        lastCharacterName: '',
    };

    // 调试桥：控制台可排查「排刀拉不到 / 过期」等问题。state 在下方声明，仅在调用时读取，安全。
    // 注意：脚本 @grant 了 GM_*，运行在隔离世界，脚本内 window 与页面主世界 window 不同；
    // 必须把桥挂到 unsafeWindow 才能在页面控制台（主世界）访问到。
    try {
        const bridge = {
            get doc() { return assignmentState.doc; },
            charName() { return String((state.character && state.character.name) || '').trim(); },
            assignmentConfig() { return assignmentConfig(); },
            guildRestricted() { return guildRestricted(); },
            useCosBackend() { return useCosBackend(assignmentConfig()); },
            async fetchPlan(force) { return fetchPlan(!!force); },
            async diag() {
                const cfg = assignmentConfig();
                console.log('【calculator URL 解析 cfg】', cfg);
                if (!cfg) { console.log('⚠ cfg 为空：设置里「计算器地址」缺少 bin/pwd 参数（guild 默认 KUNPO）'); return; }
                console.log('【guildRestricted】', guildRestricted(), '（true=不进 COS，回退 jsonbin → 读不到就无排刀）');
                console.log('【useCosBackend】', useCosBackend(cfg), '（true=走 COS 读取；false=走 jsonbin）');
                console.log('【当前角色】', String((state.character && state.character.name) || '').trim() || '(未识别)');
                try {
                    const plan = await fetchPlan(true);
                    console.log('【拉取成功，plan 存在，顶层字段】', plan && Object.keys(plan));
                } catch (e) {
                    console.log('【拉取失败 / 无 plan】', e && e.message ? e.message : e);
                }
            },
            // 光环推荐诊断：在组队页面执行 __KUNPO.auraDiag()，打印 syncAuraRecoInfo 的每个判定条件，
            // 定位信息块被哪个静默分支拦住（开关/容器/编辑模式误判/名字数不齐/槽位根解析失败/服务器数据缺失）。
            auraDiag() {
                const c = document.querySelector('[class*="Party_page"]') || document.querySelector('[class^="Party_"]');
                console.log('【① 容器】', c ? c.className : 'NULL（找不到 Party 容器 → 必然无信息块）');
                console.log('【② 开关 auraRecoEnabled】', auraRecoEnabled());
                console.log('【③ partyEditMode()】', partyEditMode(), '（true=判定成编辑/创建页 → 信息块被移除）');
                try {
                    const ctrls = c ? Array.from(c.querySelectorAll('input,select,textarea')) : [];
                    console.log('【④ 容器内表单控件】', ctrls.length, ctrls.slice(0, 6).map(function (e) {
                        return e.tagName + (e.type ? '[' + e.type + ']' : '') + '.' + String(e.className || '').slice(0, 40);
                    }));
                } catch (_) {}
                try {
                    const names = collectPartyMemberNames();
                    const nameEls = c ? auraNameElements(c) : [];
                    console.log('【⑤ members】', names.length, names);
                    console.log('【⑥ nameEls】', nameEls.length, '（⑤⑥ 不相等或为 0 → 直接移除信息块）');
                    if (c && nameEls.length) {
                        const roots = nameEls.map(function (el) { return auraSlotRootFor(el, c, nameEls); });
                        console.log('【⑦ slotRoot 解析】', roots.map(function (r) { return r ? 'ok' : 'FAIL'; }),
                            '（有 FAIL → 对应成员不插信息块）');
                    }
                } catch (e) {
                    console.log('【⑤~⑦ 异常】', e && e.message ? e.message : e);
                }
                console.log('【⑧ 服务器光环数据 auraServer.byName】',
                    auraServer.byName ? (Object.keys(auraServer.byName).length + ' 人') : 'null（本会话还没拉到共享空间数据）');
            }
        };
        if (typeof unsafeWindow !== 'undefined') unsafeWindow.__KUNPO = bridge;
        window.__KUNPO = bridge;
    } catch (_) { /* ignore */ }

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
            if (state.statusText.textContent !== text) state.statusText.textContent = text;
            const color = STATUS_KIND_COLORS[kind] || STATUS_KIND_COLORS.idle;
            if (state.statusText.dataset.kind !== kind) { state.statusText.style.color = color; state.statusText.dataset.kind = kind; }
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
    // 提醒统一按北京时间判断周四和当天，避免设备时区不同导致漏提醒。
    function uploadDayKey(ts) {
        const value = Number(ts);
        if (!Number.isFinite(value) || value <= 0) return '';
        const shifted = new Date(value + 8 * 3600e3);
        return Number.isFinite(shifted.getTime()) ? shifted.toISOString().slice(0, 10) : '';
    }
    function lastUploadTimestamp() {
        const name = currentCharacterName();
        if (!name) return 0;
        // 历史全局值无法确定属于哪个角色，不能用作「当前角色今天已上传」的依据。
        try { return Number(localStorage.getItem(K_LAST_UPLOAD + '::' + name)) || 0; } catch (_) { return 0; }
    }
    function uploadedToday() {
        const ts = lastUploadTimestamp();
        return ts > 0 && uploadDayKey(ts) === uploadDayKey(Date.now());
    }
    function thursdayUploadPending() {
        return !!currentCharacterName() && new Date(Date.now() + 8 * 3600e3).getUTCDay() === 4 && !uploadedToday() && isKunpoMember();
    }
    function recordSuccessfulUpload(name) {
        // 网络请求期间可能切换角色；成功记录必须属于这次实际上传的角色。
        const keyName = String(name || '').trim();
        if (!keyName) return;
        try { localStorage.setItem(K_LAST_UPLOAD + '::' + keyName, String(Date.now())); } catch (_) {}
    }
    const thursdayReminderState = { timer: 0, syncing: false, listening: false };
    function manualTrialSilenceRequested() {
        try { if (localStorage.getItem(TRIAL_END_OVERRIDE_KEY) === '1') return true; } catch (_) {}
        return trialEndState.silenced && String(trialEndState.reason || '').indexOf('手动') >= 0;
    }
    function syncThursdayUploadReminder() {
        if (thursdayReminderState.syncing) return;
        thursdayReminderState.syncing = true;
        try {
            // 面板通常先于角色、公会数据创建，不能只在首次挂载时判断一次。
            const gs = getGameState();
            if (gs) updateGuildGate(gs);
            if (document.visibilityState === 'hidden' || manualTrialSilenceRequested()) return;
            if (!thursdayUploadPending()) { updateIntroLine(); return; }
            // 上周自动静默可能收起甚至移除了窗口；只解除自动静默，保留手动静默。
            if (trialEndState.silenced) resumeFromSilence();
            if (!state.uiRoot || !state.panelEl || !state.iconButton) mountExportUi();
            if (!state.uiRoot || !state.panelEl || !state.iconButton) return;
            updateIntroLine();
            if (state.uiRoot.dataset.collapsed !== 'false' || state.panelEl.style.display === 'none') applyCollapsed(false);
        } catch (e) {
            console.warn('[KUNPO] 周四上传提醒检查失败，将稍后重试：', e);
        } finally { thursdayReminderState.syncing = false; }
    }
    function startThursdayUploadReminder() {
        if (!thursdayReminderState.listening) {
            window.addEventListener('focus', syncThursdayUploadReminder);
            window.addEventListener('pageshow', syncThursdayUploadReminder);
            document.addEventListener('visibilitychange', syncThursdayUploadReminder);
            thursdayReminderState.listening = true;
        }
        if (!thursdayReminderState.timer) thursdayReminderState.timer = setInterval(syncThursdayUploadReminder, 30000);
        syncThursdayUploadReminder();
    }
    function stopThursdayUploadReminder() {
        clearInterval(thursdayReminderState.timer);
        thursdayReminderState.timer = 0;
        if (thursdayReminderState.listening) {
            window.removeEventListener('focus', syncThursdayUploadReminder);
            window.removeEventListener('pageshow', syncThursdayUploadReminder);
            document.removeEventListener('visibilitychange', syncThursdayUploadReminder);
            thursdayReminderState.listening = false;
        }
    }
    function cleanupScriptTimers() {
        stopThursdayUploadReminder();
        cleanupStatusPolling();
    }
    // 一次性迁移：本地还没有上传时间时，若本会话已拉到云端数据、且缓存里「自己」这条
    // 的光环至少有一个 > 0，说明之前上传过 → 把上次上传时间定为 2026-09-25，
    // 避免老成员因为新功能上线被误判成「从未上传」而在周四被反复提醒。
    function seedLastUploadFromCache() {
        try {
            if (lastUploadTimestamp() > 0) return;      // 已有记录，不覆盖
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
        const ts = lastUploadTimestamp();
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
        // 与强制展开使用相同的角色、公会和北京时间条件
        if (thursdayUploadPending()) {
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
            width: 'min(320px, calc(100vw - 24px))',
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

        // 按钮容器改为纵向堆叠，内部按「固定行」分组（行定义见 actions.append 处）
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;flex-direction:column;gap:6px';
        const sendBtn = document.createElement('button');
        sendBtn.type = 'button';
        sendBtn.textContent = '上传配装';
        sendBtn.title = '打开上传确认窗口：读取云端最新数据，只把本人的等级/成就/房屋/配装合并后上传，并附带本地职业数据（不影响其他成员、排刀与技能配置）';
        Object.assign(sendBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#0a84ff',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
        });
        sendBtn.addEventListener('click', () => showUploadConfirmModal());
        const jsonBtn = document.createElement('button');
        jsonBtn.type = 'button';
        // 呼吸光圈动画（只注入一次）：绿色高亮引导成员注意下载入口
        if (!document.getElementById('kunpo-jsonbtn-style')) {
            const glowStyle = document.createElement('style');
            glowStyle.id = 'kunpo-jsonbtn-style';
            glowStyle.textContent = '@keyframes kunpo-export-glow{0%,100%{box-shadow:0 0 0 0 rgba(31,157,85,.55)}50%{box-shadow:0 0 0 6px rgba(31,157,85,0)}}';
            document.head.appendChild(glowStyle);
        }
        jsonBtn.textContent = '↓';
        jsonBtn.title = '下载 JSON 备份：导出当前角色全部迷宫配装到 JSON 文件';
        Object.assign(jsonBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 11px',
            background: '#1f9d55',
            color: '#fff',
            cursor: 'pointer',
            font: '600 15px/1 system-ui, sans-serif',
            animation: 'kunpo-export-glow 2.4s ease-in-out infinite',
        });
        jsonBtn.addEventListener('click', () => exportJsonData());
        // 《职业管理》：查看/编辑云端共享空间里本人的职业（出战切换、增删），详见 openProfManager
        const profBtn = document.createElement('button');
        profBtn.type = 'button';
        profBtn.textContent = '职业管理';
        profBtn.title = '查看云端共享空间里本人的所有职业：双击切换出战职业、可增删职业';
        Object.assign(profBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#344879',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
        });
        profBtn.addEventListener('click', () => { void openProfManager(); });
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
        assignBtn.addEventListener('click', () => { void refreshAssignment({ manual: true }); });
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
        // 《DIY插件分享》：与「⚙ 设置」同级的按钮，点击弹出分享窗口。
        // 分享条目统一在 showDiyShareModal 上方的 DIY_SHARE_ITEMS 数组中配置。
        const diyBtn = document.createElement('button');
        diyBtn.type = 'button';
        diyBtn.textContent = 'DIY插件分享';
        diyBtn.title = '查看 DIY 插件下载地址与说明';
        Object.assign(diyBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '6px 9px',
            background: '#344879',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12px/1 system-ui, sans-serif',
        });
        diyBtn.addEventListener('click', () => showDiyShareModal());
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
        // ── 按钮固定分三行排布 ──
        //   第一行（常驻）：上传配装 / 下载 JSON 备份 / 打开组队文档
        //   第二行（常驻）：DIY插件分享 / 检查脚本更新 / 设置
        //   第三行（满足条件自动显示）：显示排刀（设置勾选「手动显示排刀」后显示）/
        //     检查报名（职位满足会长/将军自动显示）/ 打开计算器（职位满足会长自动显示）
        const rowCss = 'display:flex;gap:6px;flex-wrap:wrap';
        const actionRow1 = document.createElement('div');
        actionRow1.style.cssText = rowCss;
        const actionRow2 = document.createElement('div');
        actionRow2.style.cssText = rowCss;
        const actionRow3 = document.createElement('div');
        actionRow3.style.cssText = rowCss;
        actionRow1.append(sendBtn, jsonBtn, profBtn, docBtn);
        actionRow2.append(diyBtn, updBtn, setBtn);
        actionRow3.append(assignBtn, signupBtn, calcBtn);
        actions.append(actionRow1, actionRow2, actionRow3);
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
        // 周四且当天还没上传配装：点「−」先正常收起，提醒后 0.5 秒自动弹回
        // （上传成功后本拦截自动解除）。重复点击只保留一个待执行的弹回定时器。
        let reopenTimer = 0;
        collapseBtn.addEventListener('click', () => {
            if (!thursdayUploadPending()) { applyCollapsed(true); return; }
            applyCollapsed(true);
            showAssignmentToast('上传配装后可关闭窗口~');
            clearTimeout(reopenTimer);
            reopenTimer = setTimeout(() => {
                reopenTimer = 0;
                if (!trialEndState.silenced && thursdayUploadPending()) applyCollapsed(false);
            }, 500);
        });

        // 视口尺寸变化时保持可见：收起态重新钳制图标；展开态重新钳制面板。
        uiResizeHandler = () => { clampPanelToViewport(); };
        window.addEventListener('resize', uiResizeHandler);

        // 默认收起为 K 图标；记住用户上次的展开/收起选择。
        // 例外：周四且当前角色当天还没上传配装 → 无视记忆状态强制展开面板提醒上传。
        applyCollapsed(thursdayUploadPending() ? false : localStorage.getItem(UI_COLLAPSED_KEY) !== '0');
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
            mergeStockItems(obj.characterItems, true);   // 模块①库存显示：全量背包快照
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
        } else if (obj.type === 'items_updated') {
            mergeStockItems(obj.endCharacterItems || obj.characterItems);   // 模块①库存显示：物品变动
        } else if (obj.type === 'action_completed') {
            if (obj.endCharacterSkills) mergeSkills(obj.endCharacterSkills);
            if (obj.endCharacterAbilities) mergeAbilities(obj.endCharacterAbilities);
            if (obj.endCharacterItems) mergeStockItems(obj.endCharacterItems);   // 模块①库存显示
            changed = Boolean(obj.endCharacterSkills || obj.endCharacterAbilities);
        }

        if (changed && state.character) {
            state.dataReady = true;
            if (obj.type === 'init_character_data') {
                state.loadoutDataSeen = false;
                state.loadoutCheckStartTime = Date.now();
            }
            if (!state.statusPollInterval) {
                state.statusPollInterval = setInterval(refreshLoadoutStatus, 5000);
            }
            scheduleLoadoutStatus();
            updateGuildGate(getGameState());   // 读到人物数据后校验公会
            syncThursdayUploadReminder();
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
        let steps = 0, cursor = 0;
        while (cursor < queue.length && steps < 20000) {
            const fiber = queue[cursor++];
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

    // 神龛（仅生活部分）：gameState.characterGuildBuffDict 里每个神龛分
    // 战斗（/guild_buffs/{type}_combat）与生活（/guild_buffs/{type}_skilling）
    // 两条，这里只取生活部分的「实际生效等级」；
    // guildBuildingLevelDict 里的是公会建筑等级（决定上限），不是实际 buff 等级。
    // 键统一归一化为 /shrines/{force|scholar|spirit|tempo}，等级 0~20。
    function collectShrines() {
        const gs = getGameState();
        if (!gs) return {};
        const out = {};
        for (const [rawHrid, buff] of containerEntries(gs.characterGuildBuffDict)) {
            const m = /^\/guild_buffs\/(force|scholar|spirit|tempo)_skilling$/.test(String(rawHrid || ''))
                ? String(rawHrid).match(/^\/guild_buffs\/(force|scholar|spirit|tempo)_skilling$/)
                : null;
            if (!m) continue;
            const lv = Math.max(0, Math.floor(Number(buff && buff.level) || 0));
            out['/shrines/' + m[1]] = Math.min(lv, 20);
        }
        return out;
    }

    // 从 characterSetting 里扫全部 labyrinthLoadout* 键，把每一份被迷宫使用的
    // loadout 都拿出来。相同 loadoutId 可能被多个 settingKey 引用（比如两间
    // 房都指向同一套配装），合并归档到 usedBy[]，避免重复导出装备明细。
    function collectLabyrinthLoadouts(force = false, gameState) {
        const gs = gameState || getGameState();
        if (!gs) return [];
        const settings = gs.characterSetting;
        const dict = gs.characterLoadoutDict;
        if (!settings || !dict) return [];
        const now = Date.now();
        if (!force && loadoutCache.data && loadoutCache.gs === gs && loadoutCache.settings === settings &&
            loadoutCache.dict === dict && loadoutCache.items === gs.characterItemMap &&
            loadoutCache.revision === inventoryRevision && now - loadoutCache.at < 5000) return loadoutCache.data;
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
        const data = [...byId.values()].sort((a, b) => a.loadoutId - b.loadoutId);
        Object.assign(loadoutCache, { gs, settings, dict, items: gs.characterItemMap, revision: inventoryRevision, at: now, data });
        return data;
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

        const labyrinthLoadouts = collectLabyrinthLoadouts(true); // export/upload always takes a fresh snapshot
        const houseRoomLevels = collectHouseRoomLevels();
        const achievements = collectAchievementCompletion();
        const shrines = collectShrines();

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
            shrines,
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
        const loadouts = collectLabyrinthLoadouts(false, gs);
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
        updateStaffButtons();   // 状态行每秒刷新，顺带修正《检查报名》/《打开计算器》显隐（WS 可能早于 UI 挂载）
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
            // 神龛（仅生活部分实际生效等级，键 = /shrines/{type}）
            shrines: payload.shrines || {},
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
            // 神龛（仅生活部分实际生效等级，键 = /shrines/{type}）：随上传一并写入云端共享空间
            shrines: (profile.shrines && typeof profile.shrines === 'object') ? profile.shrines : {},
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
        // 非 KUNPO 成员禁止把数据传进 KUNPO 共享空间：上传目标（地址里的 guild）是 KUNPO、
        // 而游戏内公会已读到且不是 KUNPO 时阻止，提示改填自己公会的地址；
        // 填了自己公会的地址（guild=自己公会）则不受影响。公会信息未读到时不拦截（与门控同口径）。
        const targetGuild = String((cfg && cfg.guild) || '').trim().toUpperCase();
        if (targetGuild === String(GUILD_DEFAULTS.name).trim().toUpperCase()
            && guildGate.known && !isKunpoMember()) {
            setStatus('非 KUNPO 公会，已阻止上传', 'error');
            alert('当前游戏内公会不是 KUNPO，已阻止上传到 KUNPO 共享空间。\n'
                + '如需上传到你所在公会的共享空间，请在「⚙ 设置」里填写你公会的 JSON 获取地址（含 guild/bin/pwd）后再试。');
            return;
        }
        setStatus('正在读取云端数据…', 'idle');
        try {
            const key = await deriveKey(cfg.password, cfg.guild);
            // skipProfsHydrate：本次读取不把云端职业覆盖到本地（防止本地职业改动被冲掉）
            const remote = await cloudFetchRecord(cfg, key, { skipProfsHydrate: true });
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
            // 附带本地职业数据：本人字段（byName[me]/sel[me]）以本地为准，
            // 职业合集 list 只增不删、不碰他人数据；本地没有任何职业缓存时不改动云端职业字段。
            const localProfs = readLocalProfs();
            const myLocalList = Array.isArray(localProfs.byName[myName]) ? localProfs.byName[myName] : null;
            const myLocalSel = (typeof localProfs.sel[myName] === 'string' && localProfs.sel[myName]) ? localProfs.sel[myName] : '';
            if (myLocalList || myLocalSel) {
                const p = normalizeProfs(merged.profs);
                if (myLocalList) {
                    p.byName[myName] = myLocalList.slice();
                    myLocalList.forEach(function (s) { if (p.list.indexOf(s) < 0) p.list.push(s); });
                }
                if (myLocalSel) p.sel[myName] = myLocalSel;
                p._ts = Date.now();
                merged.profs = p;
            }
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
            recordSuccessfulUpload(myName);
            updateIntroLine();
        } catch (e) {
            const msg = (e && e.message) ? e.message : String(e);
            setStatus('上传失败：' + msg, 'error');
            console.error('[KUNPO] 上传失败：', e);
            alert('上传失败：' + msg);
        }
    }

    // ── 上传确认弹窗：与《DIY插件分享》/《职业管理》同款全屏遮罩+居中 ──
    // 点「确认上传」才真正执行上传流程（GET 不补水本地职业，并把本地职业数据附带写上）；
    // 「职业管理」叠加打开职业管理弹窗（不关闭本窗口，关闭职业管理后可继续上传）；
    // 「×」/点遮罩空白 = 取消上传并关闭。
    function showUploadConfirmModal() {
        document.getElementById('kunpo-upload-modal')?.remove();
        const overlay = document.createElement('div');
        overlay.id = 'kunpo-upload-modal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center';
        const box = document.createElement('div');
        box.style.cssText = 'position:relative;width:min(400px,92vw);max-height:80vh;overflow-y:auto;padding:16px;border-radius:12px;'
            + 'background:linear-gradient(145deg,#152447,#1d3566);color:#eef3ff;border:1px solid #6f9bd8;box-shadow:0 10px 28px rgba(3,10,26,.55);font:12.5px/1.5 system-ui,sans-serif';
        const title = document.createElement('div');
        title.style.cssText = 'font-weight:700;font-size:15px;margin-bottom:10px;color:#8fc3ff';
        title.textContent = '确认上传';
        const close = document.createElement('button');
        close.type = 'button'; close.textContent = '×';
        close.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:0;color:#c3d2f2;font:700 20px/1 system-ui;cursor:pointer';
        close.addEventListener('click', function () { overlay.remove(); });
        const msg = document.createElement('div');
        msg.style.cssText = 'margin-bottom:12px;white-space:pre-wrap;word-break:break-word;color:#dbe6fb';
        msg.textContent = '将读取云端最新数据，只把本人的等级/成就/房屋/迷宫配装/神龛/光环合并后上传到共享空间，'
            + '并把本地保存的职业数据一并附带上传。\n不影响其他成员、排刀与技能配置。';
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
        const okBtn = document.createElement('button');
        okBtn.type = 'button';
        okBtn.textContent = '确认上传';
        okBtn.title = '读取云端数据并上传（附带本地职业数据）';
        Object.assign(okBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '7px 12px',
            flex: '1',
            background: '#0a84ff',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12.5px/1 system-ui, sans-serif',
        });
        okBtn.addEventListener('click', function () {
            overlay.remove();
            void uploadLoadoutsToServer();
        });
        const profBtn = document.createElement('button');
        profBtn.type = 'button';
        profBtn.textContent = '职业管理';
        profBtn.title = '打开职业管理（本窗口保留，关闭职业管理后可继续上传）';
        Object.assign(profBtn.style, {
            border: '0',
            borderRadius: '7px',
            padding: '7px 12px',
            flex: '1',
            background: '#344879',
            color: '#fff',
            cursor: 'pointer',
            font: '600 12.5px/1 system-ui, sans-serif',
        });
        profBtn.addEventListener('click', function () { void openProfManager(); });   // 不关闭本弹窗 → 叠加
        btnRow.append(okBtn, profBtn);
        box.appendChild(close);
        box.appendChild(title);
        box.appendChild(msg);
        box.appendChild(btnRow);
        overlay.appendChild(box);
        overlay.addEventListener('click', function (ev) { if (ev.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ▼ 职业管理：查看/编辑云端共享空间里本人的职业（本地编辑，不上传云端）
    //   云端字段（与 index.html 计算器网页端共用同一份记录）：
    //     record.profs = { _ts, list(职业合集), byName{角色名:[职业…]}, sel{角色名:出战职业} }
    //   本地缓存 localStorage['kunpo_profs_cache']：仅当本地缺少全职业数据或本人数据时
    //   才拉取一次云端（GET），之后不再主动与云端交互；改动只写本地缓存。
    //   其余任意云端读取（上传配装/拉排刀/光环等）会顺带把云端 profs 全量写入本地缓存：
    //   全覆盖，一切数据以云端为主；仅当云端记录里没有 profs 字段（老记录）时不动本地。
    //   交互：第一行=出战职业；其余行双击切换出战、「−」删除；底部下拉+「+」新增。
    // ═══════════════════════════════════════════════════════════════════════
    const K_PROFS_CACHE = 'kunpo_profs_cache';
    function normalizeProfs(raw) {
        const p = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
        return {
            _ts: Number(p._ts) || 0,
            list: Array.isArray(p.list) ? p.list.filter(s => typeof s === 'string') : [],
            byName: (p.byName && typeof p.byName === 'object' && !Array.isArray(p.byName)) ? p.byName : {},
            sel: (p.sel && typeof p.sel === 'object' && !Array.isArray(p.sel)) ? p.sel : {},
        };
    }
    function readLocalProfs() {
        try { return normalizeProfs(JSON.parse(localStorage.getItem(K_PROFS_CACHE) || 'null')); }
        catch (_) { return normalizeProfs(null); }
    }
    function saveLocalProfs(p) {
        try { localStorage.setItem(K_PROFS_CACHE, JSON.stringify(p)); } catch (_) {}
    }
    // 本地是否已具备「全职业数据 + 本人数据」：二者都齐才不再与云端交互
    // （云端暂时为空/还没有本人条目时，每次打开都会重拉，直到数据出现为止）
    function profsHasLocalData(p, me) {
        return !!(p && Array.isArray(p.list) && p.list.length > 0
            && p.byName && Array.isArray(p.byName[me]));
    }
    // 其余任意云端读取（上传配装/拉排刀/光环等都经过 cloudFetchRecord）顺带补水：
    // 每次都把云端 profs 全量写入本地缓存——全覆盖，一切数据以云端为主；
    // 弹窗里的本地改动会在下一次云端读取时被云端数据覆盖。
    // 仅当云端记录里没有 profs 字段（老版本记录）时不动本地，避免把本地清空。
    function hydrateLocalProfsFromRecord(record) {
        try {
            const raw = record && record.profs;
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
            saveLocalProfs(normalizeProfs(raw));
        } catch (_) { /* 补水失败不影响主流程 */ }
    }
    async function openProfManager() {
        const me = String(currentCharacterName() || '').trim();
        if (!me) { showAssignmentToast('尚未读取到角色名，请稍后再试'); return; }
        let profs = readLocalProfs();
        if (profsHasLocalData(profs, me)) { showProfManagerModal(me, profs); return; }   // 本地已有 → 不再拉取
        const cfg = assignmentConfig();
        if (!cfg) { alert('请先在「⚙ 设置」里填写正确的 JSON 获取地址（需含 bin 与 pwd）。'); return; }
        try {
            setStatus('正在读取云端职业数据…', 'idle');
            const key = await deriveKey(cfg.password, cfg.guild);
            // 会话里已拉过整份记录（上传配装/排刀）就直接复用，否则真拉一次
            const remote = await cloudFetchRecord(cfg, key, cloudRecordCache.data ? { cacheTtl: Infinity } : null);
            profs = normalizeProfs(remote && remote.profs);
            saveLocalProfs(profs);
            setStatus('职业数据已就绪', 'good');
        } catch (e) {
            setStatus('职业数据读取失败', 'error');
            alert('读取云端职业数据失败：' + (e && e.message ? e.message : String(e)));
            return;
        }
        showProfManagerModal(me, profs);
    }
    function showProfManagerModal(me, profs) {
        document.getElementById('kunpo-prof-modal')?.remove();
        let myList = (Array.isArray(profs.byName[me]) ? profs.byName[me] : [])
            .filter(s => typeof s === 'string').slice();
        let mySel = (typeof profs.sel[me] === 'string') ? profs.sel[me] : '';
        let profsPool = profs.list.slice();          // 职业合集快照（下拉可选项来源）

        // 外层遮罩 + 居中弹窗：与正式版《DIY插件分享》弹窗同一位置/形态
        const overlay = document.createElement('div');
        overlay.id = 'kunpo-prof-modal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center';
        const box = document.createElement('div');
        box.id = 'kunpo-prof-box';
        box.style.cssText = 'position:relative;width:min(340px,92vw);max-height:80vh;overflow-y:auto;padding:14px;'
            + 'border-radius:12px;border:1px solid #6f9bd8;background:linear-gradient(145deg,#152447,#1d3566);color:#eef3ff;'
            + 'font:12.5px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 10px 28px rgba(3,10,26,.55)';
        const title = document.createElement('strong');
        title.textContent = '职业管理 · ' + me;
        title.style.cssText = 'display:block;font-size:14px;margin:0 0 8px 0';
        box.appendChild(title);
        const close = document.createElement('button');
        close.type = 'button'; close.textContent = '×'; close.title = '关闭';
        close.style.cssText = 'position:absolute;top:7px;right:7px;min-width:24px;height:24px;border:0;border-radius:7px;'
            + 'background:#344879;color:#fff;cursor:pointer;font:700 16px/1 system-ui,sans-serif';
        close.addEventListener('click', () => overlay.remove());
        box.appendChild(close);
        const listBox = document.createElement('div');
        box.appendChild(listBox);
        const hint = document.createElement('div');
        hint.style.cssText = 'margin-top:6px;color:#7f93bb;font-size:10.5px;line-height:1.6';
        hint.textContent = '双击职业行 = 设为出战职业；「−」= 删除该职业（出战职业不显示删除按钮）；底部下拉选择后点「+」新增。';
        box.appendChild(hint);
        overlay.appendChild(box);
        overlay.addEventListener('click', function (ev) { if (ev.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);

        function renderRows() {
            listBox.textContent = '';
            // 第一行：出战职业（金色高亮，不可删除）
            const selRow = document.createElement('div');
            selRow.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 8px;margin:0 0 6px 0;'
                + 'border:1px solid #ffd60a;border-radius:7px;background:rgba(255,214,10,.08);user-select:none';
            const badge = document.createElement('span');
            badge.textContent = '出战';
            badge.style.cssText = 'flex:0 0 auto;color:#ffd60a;font:700 10.5px/1.4 system-ui,sans-serif;'
                + 'border:1px solid #ffd60a;border-radius:4px;padding:1px 4px';
            const selName = document.createElement('span');
            selName.style.cssText = 'flex:1;word-break:break-all;font-weight:600';
            selName.textContent = mySel || '（未设置出战职业）';
            selRow.append(badge, selName);
            listBox.appendChild(selRow);
            // 其余职业行：双击切换出战，「−」删除
            const rest = myList.filter(function (s) { return s !== mySel; });
            rest.forEach(function (prof) {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 8px;margin:0 0 6px 0;'
                    + 'border:1px solid #45598c;border-radius:7px;background:rgba(10,20,44,.5);user-select:none;cursor:pointer';
                row.title = '双击切换为出战职业';
                const name = document.createElement('span');
                name.style.cssText = 'flex:1;word-break:break-all';
                name.textContent = prof;
                const del = document.createElement('button');
                del.type = 'button'; del.textContent = '−'; del.title = '删除该职业';
                del.style.cssText = 'flex:0 0 auto;min-width:22px;height:22px;border:0;border-radius:6px;'
                    + 'background:#6e2f3a;color:#fff;cursor:pointer;font:700 13px/1 system-ui,sans-serif';
                del.addEventListener('click', function (ev) { ev.stopPropagation(); delProf(prof); });
                row.addEventListener('dblclick', function () { switchProf(prof); });
                row.append(name, del);
                listBox.appendChild(row);
            });
            if (!rest.length) {
                const empty = document.createElement('div');
                empty.style.cssText = 'margin:0 0 6px 0;color:#7f93bb;font-size:11px';
                empty.textContent = '没有其余职业，可在下方下拉框新增。';
                listBox.appendChild(empty);
            }
            // 最后一行的下一行：下拉框 + 「+」新增
            const addRow = document.createElement('div');
            addRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:2px';
            const select = document.createElement('select');
            select.style.cssText = 'flex:1;min-width:0;padding:4px 6px;border:1px solid #45598c;border-radius:5px;'
                + 'background:#0e1830;color:#eef3ff;font:12px/1.4 system-ui,sans-serif';
            const options = profsPool.filter(function (s) { return myList.indexOf(s) < 0; });
            if (options.length) {
                const placeholder = document.createElement('option');
                placeholder.value = ''; placeholder.textContent = '选择要新增的职业…';
                select.appendChild(placeholder);
                options.forEach(function (s) {
                    const opt = document.createElement('option');
                    opt.value = s; opt.textContent = s;
                    select.appendChild(opt);
                });
            } else {
                const opt = document.createElement('option');
                opt.value = ''; opt.textContent = '（云端职业合集为空，请会长在网页端维护）';
                select.appendChild(opt);
                select.disabled = true;
            }
            const addBtn = document.createElement('button');
            addBtn.type = 'button'; addBtn.textContent = '+'; addBtn.title = '新增该职业';
            addBtn.style.cssText = 'flex:0 0 auto;min-width:26px;height:26px;border:0;border-radius:6px;'
                + 'background:#1f9d55;color:#fff;cursor:pointer;font:700 14px/1 system-ui,sans-serif';
            addBtn.disabled = !options.length;
            addBtn.addEventListener('click', function () { addProf(select.value); });
            addRow.append(select, addBtn);
            listBox.appendChild(addRow);
        }
        // 改动只写本地缓存（profs._ts 仅本地更新），不上传云端
        function saveLocal() {
            profs.byName[me] = myList.slice();
            profs.sel[me] = mySel;
            myList.forEach(function (s) { if (profs.list.indexOf(s) < 0) profs.list.push(s); });
            profs._ts = Date.now();
            saveLocalProfs(profs);
            profsPool = profs.list.slice();
        }
        function switchProf(prof) {
            mySel = prof;
            saveLocal();
            renderRows();
        }
        function delProf(prof) {
            myList = myList.filter(function (s) { return s !== prof; });
            saveLocal();
            renderRows();
        }
        function addProf(prof) {
            if (!prof || myList.indexOf(prof) >= 0) return;
            myList = myList.concat([prof]);
            saveLocal();
            renderRows();
        }
        renderRows();
    }

    // GM_registerMenuCommand('设置试炼计算器页面地址（必须！！！）', setCalculatorUrl);
    // GM_registerMenuCommand('显示排刀（读取共享空间排刀）', () => { void refreshAssignment({ force: true }); });
    // GM_registerMenuCommand('检查脚本更新', () => { void checkForUpdate({ force: true }); });
    //GM_registerMenuCommand('发送到试炼计算器', sendToCalculator);
    //GM_registerMenuCommand('导出当前角色全部迷宫配装到 JSON', exportJsonData);

    hookWebSocketMessages();

    function cleanupStatusPolling() {
        clearTimeout(loadoutStatusTimer); loadoutStatusTimer = 0;
        if (state.statusPollInterval) {
            clearInterval(state.statusPollInterval);
            state.statusPollInterval = null;
        }
        clearTimeout(assignmentState.timer);
        if (assignmentState.pollTimer) { clearInterval(assignmentState.pollTimer); assignmentState.pollTimer = null; }
        if (assignmentState.observer) { assignmentState.observer.disconnect(); assignmentState.observer = null; }
    }

    // ── 排刀：加密/解密（与 index.html 完全一致）──────────────────────
    const derivedKeyCache = { sig: null, promise: null };
    async function deriveKeyUncached(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    }
    function deriveKey(password, salt) {
        const sig = JSON.stringify([password, salt]);
        if (derivedKeyCache.sig === sig && derivedKeyCache.promise) return derivedKeyCache.promise;
        const promise = deriveKeyUncached(password, salt);
        derivedKeyCache.sig = sig; derivedKeyCache.promise = promise;
        promise.catch(function () { if (derivedKeyCache.promise === promise) { derivedKeyCache.sig = null; derivedKeyCache.promise = null; } });
        return promise;
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
            // skipProfsHydrate：上传确认流程的读取不补水（防止本地职业改动被云端冲掉，
            // 上传时会反过来以本地为准附带职业数据）
            if (!(opts && opts.skipProfsHydrate)) { try { hydrateLocalProfsFromRecord(cloudRecordCache.data); } catch (_) {} }
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
            if (!(opts && opts.skipProfsHydrate)) { try { hydrateLocalProfsFromRecord(data); } catch (_) {} }   // 顺带补水本地职业缓存
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
    function combatAbilityIconUrl(slug) { return Object.prototype.hasOwnProperty.call(COMBAT_ABILITY_ICON_DATA, String(slug || '')) ? COMBAT_ABILITY_ICON_DATA[String(slug)] : ''; }
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
            '.kunpo-skill-panel.kunpo-nobattle-notice{border-color:#ffd60a99;border-left-color:#ffd60a;background:linear-gradient(105deg,#33290dd9,#171a24e8)}' +
            '.kunpo-skill-panel.kunpo-nobattle-notice strong{color:#ffd60a}' +
            '.kunpo-nobattle-msg{margin-top:6px;color:#ffe14d;font-size:12.5px;line-height:1.7}' +
            '@media(max-width:760px){.kunpo-skill-grid{gap:3px}.kunpo-skill-chip{padding:5px 2px;font-size:10px}.kunpo-skill-icon{width:28px;height:28px;flex-basis:28px}}';
        document.head.appendChild(style);
    }
    function clearAssignmentUi() {
        assignmentRenderCache.sig = ''; assignmentRenderCache.cards = []; assignmentRenderCache.nodes = [];
        document.querySelectorAll('[data-kunpo-assignment="combat"],[data-kunpo-assignment="life"]').forEach(n => delete n.dataset.kunpoAssignment);
        document.querySelectorAll('.kunpo-assignment-badge,.kunpo-skill-panel').forEach(n => n.remove());
    }
    function buildSkillChip(slug, slot, label) {
        const chip = document.createElement('span');
        chip.className = 'kunpo-skill-chip';
        if (slot === 'aura') chip.dataset.slot = 'aura';
        const icon = document.createElement('img');
        icon.className = 'kunpo-skill-icon';
        const iconUrl = combatAbilityIconUrl(slug);
        icon.alt = combatAbilityName(slug);
        icon.loading = 'eager';
        icon.decoding = 'async';
        const showFallback = () => {
            const fallback = document.createElement('span');
            fallback.className = 'kunpo-skill-icon';
            fallback.textContent = '?';
            fallback.title = '技能图标暂不可用：' + combatAbilityName(slug);
            fallback.setAttribute('role', 'img');
            fallback.setAttribute('aria-label', fallback.title);
            Object.assign(fallback.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#ffb340' });
            if (icon.parentNode) icon.replaceWith(fallback);
            else chip.appendChild(fallback);
        };
        icon.addEventListener('error', showFallback, { once: true });
        if (iconUrl) {
            chip.appendChild(icon);
            icon.src = iconUrl;
        } else showFallback();
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
    // 生活试炼已分配、但战斗试炼未分派时，在技能配置位置显示联系会长的提示（替代战斗技能面板）。
    function renderNoBattleNotice(anchorCard, prof) {
        const anchor = anchorCard && anchorCard.parentElement;
        const host = anchor && anchor.parentElement;
        if (!host || !anchor) return false;
        const panel = document.createElement('section');
        panel.className = 'kunpo-skill-panel kunpo-nobattle-notice';
        panel.setAttribute('aria-label', '排刀提示');
        const heading = document.createElement('div');
        heading.className = 'kunpo-skill-panel-heading';
        const title = document.createElement('strong');
        title.textContent = '排刀提示';
        heading.appendChild(title);
        const msg = document.createElement('div');
        msg.className = 'kunpo-nobattle-msg';
        msg.textContent = '您当前统计到的职业为：' + (prof || '未知') + '（排刀中读取到的职业），未被分派战斗试炼，若有误或有副职业请联系会长！';
        panel.append(heading, msg);
        host.insertAdjacentElement('afterend', panel);
        return true;
    }
    // opts.announce：true = 用户手动触发（必定提示）；false/缺省 = 自动重渲染（按节流规则静默）
    function renderAssignmentUi(opts) {
        if (!document.body) return;
        const announce = !!(opts && opts.announce);
        const expired = !!(opts && opts.expired);
        if (trialEndState.silenced) return;
        // 统一过期闸门：排刀已过期且非「手动强制展示」→ 一律不渲染高亮。
        // 之前 onEnterTrialPage 的 .then 回调在 refreshAssignment 的过期判定之后
        // 无条件调用本函数，绕过判定把过期排刀的高亮重新画上（残留"上周高亮"）。
        const dl = assignmentState.doc && assignmentState.doc.t ? Date.parse(assignmentState.doc.t) : NaN;
        if (!expired && !assignmentState.forceShowExpired && Number.isFinite(dl) && Date.now() > dl) {
            clearAssignmentUi();
            announceAssignment('排刀信息已过期，尚未发布新排刀', announce);
            return;
        }
        const currentCards = [...document.querySelectorAll(TRIAL_CARD_SELECTOR)];
        const inputs = assignmentInputsUnchanged(currentCards, opts);
        if (inputs.unchanged) {
            if (announce) announceAssignment(assignmentRenderCache.message, true);
            return;
        }
        assignmentState.rendering = true;
        try {
            injectAssignmentStyle();
            clearAssignmentUi();
            const me = memberEntry();
            const cards = currentCards;
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
            let lifeCard = null;
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
                    if (!lifeCard) lifeCard = card;
                }
            });
            // 技能面板：按「战斗掩码 slug + 职业」联合查询技能配置（s[战斗试炼slug][职业]），
            // 与网页端按战斗1/战斗2 分别配置一致；兼容旧格式（s[职业] 未按战斗拆分）。
            let skills = null;
            if (assignmentState.doc && assignmentState.doc.s && prof) {
                for (let si = 0; si < slugs.length; si++) {
                    const byProf = assignmentState.doc.s[slugs[si]];
                    if (byProf && byProf[prof]) { skills = byProf[prof]; break; }
                }
                if (!skills && assignmentState.doc.s[prof]) skills = assignmentState.doc.s[prof];
            }
            // 光环设置：检测到当前 name 有单独的光环设置 → 光环技能固定为光环设置中的光环（覆盖职业技能配置）
            const myAura = (assignmentState.doc && assignmentState.doc.au) ? assignmentState.doc.au[me.name] : null;
            if (myAura) {
                skills = Object.assign({}, skills || {});
                skills.a = myAura;
            }
            // 生活试炼已分配、但战斗试炼未分派 → 在技能配置位置显示提示，不渲染战斗技能面板。
            const lifeAssigned = Number.isInteger(lifeIdx) && lifeIdx >= 0;
            if (slugs.length === 0 && lifeAssigned) {
                const anchorCard = firstCard || lifeCard || cards[0];
                renderNoBattleNotice(anchorCard, prof);
            } else if (firstCard && skills && (skills.a || skills.s1 || skills.s2 || skills.s3 || skills.s4)) {
                renderSkillPanel(firstCard, prof, skills, myAura);
            }
            const message = '已高亮排刀：' + (slugs.length ? slugs.map(battleTrialName).join('、') : '无战斗') + ' / ' + lifeName + (lifeMatched ? '' : '（未匹配到生活卡片）') + (expired ? '（排刀已过期，仍按最近一次排刀显示）' : '');
            Object.assign(assignmentRenderCache, { sig: inputs.sig, cards: cards.slice(),
                nodes: Array.from(document.querySelectorAll('.kunpo-assignment-badge,.kunpo-skill-panel')), message });
            announceAssignment(message, announce);
        } finally {
            assignmentState.rendering = false;
        }
    }
    // 拉取策略：本会话已缓存过排刀（assignmentState.doc 非空）且非强制重拉时，
    // 手动点「显示排刀」/ 进入试炼界面都直接读缓存渲染，不再发请求；
    // 只有本会话还没缓存、或改设置（force: true）时才走网络重新拉取。
    async function refreshAssignment({ force = false, manual = false } = {}) {
        if (trialEndState.silenced) return;
        if (guildBlocked()) { announceAssignment('当前公会不是 KUNPO，排刀高亮已停用', force || manual); return; }
        const name = String((state.character && state.character.name) || '').trim();
        if (!name) { announceAssignment('等待读取游戏角色名', force || manual); return; }
        // 已有缓存数据且非强制重拉 → 直接读缓存渲染，不再发请求。
        // （手动点「显示排刀」也走这里：本会话已拉过就别重复请求；只有还没缓存/改了设置才往下发网络请求）
        if (assignmentState.doc && !force) {
            if (document.querySelector(TRIAL_CARD_SELECTOR)) {
                const dl = assignmentState.doc.t ? Date.parse(assignmentState.doc.t) : NaN;
                const expired = Number.isFinite(dl) && Date.now() > dl;
                if (expired) {
                    if (manual) {
                        // 手动点「显示排刀」：过期排刀仍渲染，并置位让 observer 不清除高亮
                        assignmentState.forceShowExpired = true;
                        renderAssignmentUi({ announce: true, expired: true });
                    } else {
                        // 自动进入试炼界面：过期排刀不渲染，仅提醒（并清除手动渲染残留的高亮）
                        assignmentState.forceShowExpired = false;
                        clearAssignmentUi();
                        announceAssignment('排刀信息已过期，尚未发布新排刀', false);
                    }
                } else {
                    assignmentState.forceShowExpired = false;
                    renderAssignmentUi({ announce: true, expired: false });
                }
            } else {
                // 不在试炼界面：仅提示已就绪，不渲染
                announceAssignment('排刀数据已就绪，进入试炼页面查看高亮', manual);
            }
            return;
        }
        if (assignmentState.inFlight) return;
        assignmentState.inFlight = true;
        assignmentState.lastCharacterName = name;
        try {
            // 走到这里说明「还没缓存」或「强制重拉（force，如改设置）」：发网络请求。
            // force=true 时 fetchPlan 绕过缓存；force=false 且光环那路已拉过整份记录则读缓存。
            const plan = await fetchPlan(force);
            // 拉取成功即记「已拉过一次」；失败不记，下次进入试炼界面还能重试。
            assignmentState.fetchedOnce = true;
            const dl = plan && plan.t ? Date.parse(plan.t) : NaN;
            const expired = Number.isFinite(dl) && Date.now() > dl;
            assignmentState.doc = plan;
            assignmentState.fetchedAt = Date.now();
            if (expired && !force && !manual) {
                // 自动（进入试炼界面）遇到过期排刀：不渲染，仅提醒；手动点《显示排刀》仍渲染。
                assignmentState.forceShowExpired = false;
                clearAssignmentUi();
                announceAssignment('排刀信息已过期，尚未发布新排刀', force);
            } else {
                // 未过期；或「手动点显示排刀（含过期）」；或强制重拉 → 渲染。
                // 手动展示过期排刀时置位 forceShowExpired，让 observer 不再清空高亮。
                assignmentState.forceShowExpired = expired;
                renderAssignmentUi({ announce: force || manual, expired: expired });
            }
        } catch (e) {
            const msg = (e && e.message) ? e.message : String(e);
            // 「云端无排刀」= 数据确实拉到了，只是会长还没发布 → 记为已拉取，
            // 命中缓存时不会重复发请求，也不必每次进试炼界面都重复提示。
            const noPlan = /无排刀/.test(msg);
            if (noPlan) assignmentState.fetchedOnce = true;
            assignmentState.doc = null;
            assignmentState.fetchedAt = Date.now();
            clearAssignmentUi();
            announceAssignment(noPlan ? '排刀未发布' : ('读取排刀失败：' + msg), force || manual);
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
        assignmentState.observer = createScopedUiObserver(TRIAL_CARD_SELECTOR, function () {
            if (assignmentState.rendering) return;
            // 「进入试炼界面」的检测必须放在 doc 判定之前：
            // 否则首次进入时还没有排刀数据（doc 为空）会被直接忽略，永远不触发拉取。
            const present = trialCardsPresent();
            const opened = present && !assignmentState.cardsPresent; // 刚进入试炼界面
            assignmentState.cardsPresent = present;
            if (!present) { lastAnnouncedText = ''; return; }        // 离开界面 → 下次进入再提示一次
            if (opened) {
                assignmentState.forceShowExpired = false;            // 重新进入：取消上次「手动强制显示过期排刀」
                onEnterTrialPage();                                  // 进入即判定：结束→静默；否则拉取排刀
                if (trialEndState.silenced) return;
            }
            if (!assignmentState.doc) return;                        // 还没有排刀数据 → 只做进入检测，不做渲染
            // 过期排刀：界面内持续刷新/DOM 变动不再重绘高亮，仅提示一次「等待新排刀」；
            // 除非用户手动点「显示排刀」(forceShowExpired=true) 强制展示。
            const _dl = assignmentState.doc.t ? Date.parse(assignmentState.doc.t) : NaN;
            const _expired = Number.isFinite(_dl) && Date.now() > _dl;
            clearTimeout(assignmentState.timer);
            if (_expired && !assignmentState.forceShowExpired) {
                clearAssignmentUi();
                announceAssignment('排刀信息已过期，尚未发布新排刀', opened);
                return;
            }
            // 只有「刚进入界面」那一次会提示；界面内的持续刷新一律静默重渲染。
            assignmentState.timer = setTimeout(function () { renderAssignmentUi({ announce: opened }); }, 250);
        }, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'xlink:href', 'data-trial-hrid'] });
        // Content observation is confined to trial cards; lifecycle watches mounts only.
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
        updateStaffButtons();            // 会长/将军 → 显示《检查报名》（放在所有提前 return 之前）
        const g = detectedGameGuild(gs);
        if (!g.name && !g.id) return;          // 还没读到公会信息 → 保持放行
        guildGate.known = true;
        guildGate.name = g.name;
        guildGate.id = g.id;
        guildGate.ok = isKunpoGuild(g);
        if (guildGate.ok && !guildNameMismatch()) {
            clearGuildWarning(); guildGate.warned = false;
            applyGuildActionVisibility(); updateStaffButtons();   // 名字一致（或刚修正）→ 恢复按钮显示
            return;
        }
        showGuildWarning('当前公会不是 ' + guildConfig.name + '（' + (g.name || ('ID ' + g.id)) + '），排刀高亮已停用。可点「⚙ 设置」修改公会信息。');
        if (!guildGate.warned) guildGate.warned = true;
        applyGuildActionVisibility();
        updateStaffButtons();
    }
    function guildBlocked() { return guildGate.known && !guildGate.ok; }
    // 设置的公会名与游戏内读到的公会名是否不一致（游戏还没读到公会信息时不算不一致）
    function guildNameMismatch() {
        if (!guildGate.known) return false;
        const want = String(guildConfig.name || '').trim().toUpperCase();
        const got = String(guildGate.name || '').trim().toUpperCase();
        return !!want && !!got && want !== got;
    }
    // 是否 KUNPO 成员：以游戏内读到的公会名/ID 为准（与设置里填什么无关）。
    // 其他公会成员即便在设置里填了自己的公会名，也不算 KUNPO 成员——
    // 周四强制提醒、向默认 KUNPO 共享空间上传等 KUNPO 专属行为都以本判定为准。
    // 公会信息未读到时返回 false（提醒类行为宁可不触发）。
    function isKunpoMember() {
        if (!guildGate.known) return false;
        const name = String(guildGate.name || '').trim().toUpperCase();
        if (name === String(GUILD_DEFAULTS.name).trim().toUpperCase()) return true;
        const kunpoId = Number(GUILD_DEFAULTS.id) || 0;
        return kunpoId > 0 && Number(guildGate.id) === kunpoId;
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
        // 《打开计算器》：仅会长可见（含非 KUNPO 公会 / 公会名不符的 blocked 场景一并隐藏）
        if (state.calcBtn) state.calcBtn.style.display = (blocked || !isGuildLeader()) ? 'none' : '';
        if (state.docBtn) state.docBtn.style.display = blocked ? 'none' : '';
        const showStaff = isOwnerOrGeneral();
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
        const versions = Object.keys(CHANGELOG).sort(compareVersions).reverse();
        let shown = 0;
        const older = [];   // 第 4 个及更旧的版本：先收起，只显示第一条作为展开入口
        versions.forEach(function (v) {
            if (fromVersion && compareVersions(v, fromVersion) <= 0) return;   // 只要比 fromVersion 新的
            shown++;
            const item = document.createElement('div');
            item.className = 'kunpo-cl-item';
            item.style.cssText = 'margin:0 0 10px 0;padding:8px 9px;border:1px solid #45598c;border-radius:8px;'
                + 'background:rgba(10,20,44,.5)';
            const ver = document.createElement('div');
            ver.textContent = 'v' + v + (v === SCRIPT_VERSION ? '（当前版本）' : '');
            ver.style.cssText = 'font-weight:700;color:#8fc3ff;margin-bottom:4px';
            const body = document.createElement('div');
            body.className = 'kunpo-cl-body';
            body.textContent = CHANGELOG[v];
            body.style.cssText = 'white-space:pre-wrap;color:#c3d2f2';
            item.append(ver, body);
            if (shown <= 3) box.appendChild(item);   // 最近 3 个版本：完整展开
            else older.push(item);                   // 其余：收起，稍后只显示第一条
        });
        // 折叠旧版本：只显示最靠前的一条（第一条），点击展开/收起全部更早版本
        if (older.length) {
            const entry = older.shift();
            const body = entry.querySelector('.kunpo-cl-body');
            if (body) body.style.display = 'none';   // 折叠入口默认隐藏自身内容，仅留版本号
            entry.style.cursor = 'pointer';
            const hint = document.createElement('div');
            hint.style.cssText = 'color:#8fc3ff;font-size:11.5px;margin-top:4px';
            const label = function () { return '点击展开 ' + (older.length + 1) + ' 个更早版本 ▸'; };
            hint.textContent = label();
            entry.appendChild(hint);
            entry.addEventListener('click', function () {
                if (entry.dataset.open === '1') {
                    older.forEach(function (it) { if (it.parentNode) it.parentNode.removeChild(it); });
                    if (body) body.style.display = 'none';   // 收起时连入口自身内容一并隐藏
                    hint.textContent = label();
                    entry.dataset.open = '0';
                } else {
                    if (body) body.style.display = '';   // 展开入口自身（第 4 个版本）的内容
                    const frag = document.createDocumentFragment();
                    older.forEach(function (it) { frag.appendChild(it); });
                    entry.parentNode.insertBefore(frag, entry.nextSibling);   // 一次性顺序插入，保持从新到旧
                    hint.textContent = '点击收起更早版本 ▾';
                    entry.dataset.open = '1';
                }
            });
            box.appendChild(entry);
        }
        if (!shown) { box.remove(); return; }   // 没有要显示的条目就不弹
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

    // ═══════════════════════════════════════════════════════════════════════
    // ▼ 可选功能模块（设置里勾选启用，默认全关；静默期间自动不生效）
    //   模块①：动作页面显示库存 —— 并入自「[银河奶牛]动作界面显示库存-1.3」
    //   模块②：显示升级时间   —— 并入自「[银河奶牛]显示战斗升级所需时间-1.4」
    // ═══════════════════════════════════════════════════════════════════════

    // ── 开关读写（按角色隔离，'1' = 启用）──
    function showActionStockEnabled() {
        try { return readCfg(K_SHOW_ACTION_STOCK) === '1'; } catch (_) { return false; }
    }
    function writeShowActionStockFlag(on) {
        try { localStorage.setItem(K_SHOW_ACTION_STOCK, on ? '1' : '0'); } catch (_) {}
        writeCfg(K_SHOW_ACTION_STOCK, on ? '1' : '0');
    }
    function showUpgradeTimeEnabled() {
        try { return readCfg(K_SHOW_UPGRADE_TIME) === '1'; } catch (_) { return false; }
    }
    function writeShowUpgradeTimeFlag(on) {
        try { localStorage.setItem(K_SHOW_UPGRADE_TIME, on ? '1' : '0'); } catch (_) {}
        writeCfg(K_SHOW_UPGRADE_TIME, on ? '1' : '0');
    }

    // ═══ 模块①：动作页面显示库存 ═══
    // 在动作面板每个动作按钮右下角叠加显示背包里对应物品的数量。
    const ACTION_STOCK_OVERLAY_CLASS = 'kunpo-stock-overlay';
    // 动作名与物品中文名映射（仅在动作名 ≠ 物品名时手动补充）
    const STOCK_NAME_MAP = Object.freeze({
        '奶牛': '牛奶', '翠绿奶牛': '翠绿牛奶', '蔚蓝奶牛': '蔚蓝牛奶', '深紫奶牛': '深紫牛奶',
        '绛红奶牛': '绛红牛奶', '彩虹奶牛': '彩虹牛奶', '神圣奶牛': '神圣牛奶',
        '树': '原木', '桦树': '白桦原木', '雪松树': '雪松原木', '紫心树': '紫心原木',
        '银杏树': '银杏原木', '红杉树': '红杉原木', '奥秘树': '神秘原木',
    });
    // 物品中文名 → hrid 静态表（插件环境取不到 i18n 时的兜底；i18n 命中时优先用 i18n）。
    // 若某项 hrid 猜错，该动作只是不显示角标（需背包里确有对应物品才显示）。
    const STOCK_ITEM_HRID_ZH = Object.freeze({
        '牛奶': '/items/milk', '翠绿牛奶': '/items/green_milk', '蔚蓝牛奶': '/items/blue_milk',
        '深紫牛奶': '/items/purple_milk', '绛红牛奶': '/items/crimson_milk',
        '彩虹牛奶': '/items/rainbow_milk', '神圣牛奶': '/items/holy_milk',
        '原木': '/items/log', '白桦原木': '/items/birch_log', '雪松原木': '/items/cedar_log',
        '紫心原木': '/items/purpleheart_log', '银杏原木': '/items/ginkgo_log',
        '红杉原木': '/items/redwood_log', '神秘原木': '/items/arcane_log',
    });
    let stockItemCountByHrid = {};      // hrid → 强化0数量
    let stockCountByHridEnh = {};       // hrid → { 强化等级: 数量 }（装备多强化档显示用）
    let stockItemNameByHrid = {};
    let stockDirty = true;
    let stockRefreshTimer = 0;
    let stockInitialTimer = 0;
    let stockNameRetryAt = 0;
    let stockReverseNames = { source: null, map: {} };
    function scheduleStockRefresh() {
        if (!stockObserver || stockRefreshTimer) return;
        stockRefreshTimer = setTimeout(function () {
            stockRefreshTimer = 0;
            if (!stockObserver || trialEndState.silenced) return;
            tryLoadStockNames(); renderActionStockOverlays();
        }, 150);
    }
    let stockObserver = null;   // 库存显示的 MutationObserver（未声明会导致 strict 模式下 ReferenceError）
    // 取 GamePage 的 React fiber stateNode（.state = gameState，.props 可能挂 i18n）
    function getGameRootNode() {
        const gamePageEl = document.querySelector('[class^="GamePage"]');
        if (!gamePageEl) return null;
        const key = Object.keys(gamePageEl).find(k => k.startsWith('__reactFiber$'));
        if (!key) return null;
        const fiber = gamePageEl[key];
        return (fiber && fiber.return && fiber.return.stateNode) || null;
    }
    // ── 数据来源：WebSocket 消息里的背包（不依赖 React —— 诊断证实 GamePage 上
    //    取不到 fiber 键，原「读 gameState.characterItemMap」路线在该环境不可用）。
    //    handleGameMessage 在 init_character_data / items_updated / action_completed
    //    时调用 mergeStockItems；按物品唯一键（id/hash/位置）保存原始条目，
    //    汇总时只统计强化等级 0 的物品。
    const stockRawByItem = {};   // 唯一键 → { itemHrid, count, enhancementLevel, ... }
    function stockItemKey(it) {
        if (it.id !== undefined && it.id !== null) return 'id:' + it.id;
        if (it.hash) return 'hash:' + it.hash;
        return 'loc:' + (it.itemLocationHrid || '') + ':' + it.itemHrid + ':' + Number(it.enhancementLevel || 0);
    }
    function mergeStockItems(items, replace = false) {
        if (!Array.isArray(items)) return;
        if (replace) Object.keys(stockRawByItem).forEach(k => delete stockRawByItem[k]);
        for (const it of items) {
            if (!it || !it.itemHrid) continue;
            const key = stockItemKey(it);
            if (Number(it.count || 0) > 0) stockRawByItem[key] = it; else delete stockRawByItem[key];
        }
        inventoryRevision++;
        stockDirty = true;
        scheduleStockRefresh();
    }
    function rebuildStockCounts() {
        const result = {};          // hrid → 强化0数量（兼容旧逻辑/图标兜底判断）
        const byEnh = {};           // hrid → { 强化等级: 数量 }（装备分强化显示用）
        for (const key in stockRawByItem) {
            const it = stockRawByItem[key];
            const enh = Number(it.enhancementLevel || 0);
            const hrid = it.itemHrid;
            byEnh[hrid] = byEnh[hrid] || {};
            byEnh[hrid][enh] = (byEnh[hrid][enh] || 0) + Number(it.count || 0);
            if (enh === 0) result[hrid] = (result[hrid] || 0) + Number(it.count || 0);
        }
        stockItemCountByHrid = result;
        stockCountByHridEnh = byEnh;
        stockDirty = false;
    }
    // 物品中文名表（hrid → 中文名）：从 React fiber 根做全树 BFS，找挂载 i18n 实例的
    // 组件（I18nextProvider 的 memoizedProps.i18n）。找到后 itemNames 全量可用，
    // 动作名=物品名的动作（生产类）无需任何映射即可匹配。
    // i18next 的 options.resources / services.resourceStore 两种形态都试。
    function findI18nItemNames() {
        const pick = function (i18n) {
            if (!i18n) return null;
            const a = i18n.options && i18n.options.resources && i18n.options.resources.zh
                && i18n.options.resources.zh.translation && i18n.options.resources.zh.translation.itemNames;
            if (a) return a;
            const b = i18n.services && i18n.services.resourceStore && i18n.services.resourceStore.data
                && i18n.services.resourceStore.data.zh && i18n.services.resourceStore.data.zh.translation
                && i18n.services.resourceStore.data.zh.translation.itemNames;
            return b || null;
        };
        // 收集候选 fiber 根：#root 容器键 / 任意元素的 fiber 沿 .return 爬到顶
        const roots = [];
        const rootEl = document.getElementById('root');
        if (rootEl) {
            const ck = Object.keys(rootEl).find(function (k) { return k.indexOf('__reactContainer$') === 0; });
            if (ck && rootEl[ck]) roots.push(rootEl[ck]);
            if (rootEl._reactRootContainer && rootEl._reactRootContainer.current) roots.push(rootEl._reactRootContainer.current);
        }
        const els = document.querySelectorAll('div');
        for (let i = 0; i < els.length && i < 300 && roots.length < 3; i++) {
            const k = Object.keys(els[i]).find(function (k2) { return k2.indexOf('__reactFiber$') === 0; });
            if (!k) continue;
            let f = els[i][k], guard = 0;
            while (f && f.return && guard++ < 500) f = f.return;
            if (f && roots.indexOf(f) < 0) roots.push(f);
        }
        // 全树 BFS 找 memoizedProps.i18n
        for (const root of roots) {
            const q = [root], seen = new Set();
            let n = 0, cursor = 0;
            while (cursor < q.length && n++ < 60000) {
                const f = q[cursor++];
                if (!f || typeof f !== 'object' || seen.has(f)) continue;
                seen.add(f);
                const mp = f.memoizedProps;
                const found = pick(mp && mp.i18n);
                if (found) return found;
                if (f.child) q.push(f.child);
                if (f.sibling) q.push(f.sibling);
            }
        }
        return null;
    }
    function tryLoadStockNames() {
        if (Object.keys(stockItemNameByHrid).length > 0) return true;
        if (Date.now() < stockNameRetryAt) return false;
        stockNameRetryAt = Date.now() + 5000;
        const names = findI18nItemNames();
        if (names && typeof names === 'object') {
            stockItemNameByHrid = Object.assign({}, names);
            return true;
        }
        return false;
    }
    // 格式化数量：5 字符内原样；超长缩写 K/M/B/T
    function formatStockCount(n) {
        n = Math.floor(Number(n) || 0);
        const s = String(n);
        if (s.length <= 5) return s;
        const units = [{ v: 1e3, s: 'K' }, { v: 1e6, s: 'M' }, { v: 1e9, s: 'B' }, { v: 1e12, s: 'T' }];
        for (let i = 0; i < units.length; i++) {
            const cand = String(Math.floor(n / units[i].v)) + units[i].s;
            if (cand.length <= 5) return cand;
        }
        return String(Math.floor(n / 1e12)) + 'T';
    }
    function removeAllStockOverlays() {
        document.querySelectorAll('.' + ACTION_STOCK_OVERLAY_CLASS).forEach(function (n) { n.remove(); });
    }
    // 选择器用前缀匹配（css-modules 的 hash 后缀会随版本变化）
    const SEL_ACTION_GRID = '[class^="SkillActionGrid_skillActionGrid"]';
    const SEL_ACTION_ITEM = '[class^="SkillAction_skillAction"]';
    const SEL_ACTION_NAME = '[class^="SkillAction_name"]';
    function renderActionStockOverlays() {
        if (trialEndState.silenced) return;
        if (stockDirty) rebuildStockCounts();
        const actions = document.querySelectorAll(SEL_ACTION_GRID + ' ' + SEL_ACTION_ITEM);
        if (!actions || actions.length === 0) { removeAllStockOverlays(); return; }
        const hridByName = stockReverseNames.source === stockItemNameByHrid ? stockReverseNames.map : {};
        if (stockReverseNames.source !== stockItemNameByHrid) for (const hrid in stockItemNameByHrid) {
            if (Object.prototype.hasOwnProperty.call(stockItemNameByHrid, hrid)) {
                hridByName[stockItemNameByHrid[hrid]] = hrid;
            }
        }
        stockReverseNames = { source: stockItemNameByHrid, map: hridByName };
        actions.forEach(function (skill) {
            const existing = skill.querySelector('.' + ACTION_STOCK_OVERLAY_CLASS);
            const nameElem = skill.querySelector(SEL_ACTION_NAME);
            if (!nameElem) return;
            const actionName = nameElem.textContent.trim();
            if (!actionName) return;
            let matchedHrid = hridByName[actionName] || null;
            if (!matchedHrid && STOCK_NAME_MAP[actionName]) matchedHrid = hridByName[STOCK_NAME_MAP[actionName]] || null;
            // 静态表兜底：i18n 取不到时按内置「物品中文名 → hrid」表匹配
            if (!matchedHrid && STOCK_NAME_MAP[actionName]) matchedHrid = STOCK_ITEM_HRID_ZH[STOCK_NAME_MAP[actionName]] || null;
            if (!matchedHrid) matchedHrid = STOCK_ITEM_HRID_ZH[actionName] || null;
            if (!matchedHrid) {
                // 图标兜底：动作按钮 svg use 的 href 形如 …/items/xxx（或 #items_xxx）
                // → /items/xxx，且背包里确有该物品才采用
                const use = skill.querySelector('use');
                const href = (use && (use.getAttribute('href') || use.getAttribute('xlink:href'))) || '';
                if (/items/.test(href)) {
                    const tail = String(href).split('/').pop().replace(/^#/, '');
                    const guess = '/items/' + tail;
                    if (stockItemCountByHrid[guess]) matchedHrid = guess;
                }
            }
            if (!matchedHrid) { if (existing) existing.remove(); return; }
            const enhMap = stockCountByHridEnh[matchedHrid] || null;
            if (!enhMap) { if (existing) existing.remove(); return; }
            // 强化等级从高到低；只有强化0时保持单行纯数字（消耗品原样），
            // 装备存在多个强化档时逐行显示「+N 数量」
            const levels = Object.keys(enhMap).map(Number).sort(function (a, b) { return b - a; });
            if (levels.length === 0) { if (existing) existing.remove(); return; }
            let text;
            if (levels.length === 1 && levels[0] === 0) {
                text = formatStockCount(enhMap[0]);
            } else {
                // 强化数值黄色高亮（+N 用 span 包裹），数量保持白色
                text = levels.map(function (e) {
                    const cnt = formatStockCount(enhMap[e]);
                    return e > 0 ? '<span style="color:#ffd700">+' + e + '</span> ' + cnt : cnt;
                }).join('\n');
            }
            if (existing) {
                if (existing.dataset.sig !== text) {
                    existing.innerHTML = '<span style="display:block;white-space:pre;text-align:right">' + text + '</span>';
                    existing.dataset.sig = text;
                }
                return;
            }
            skill.style.position = skill.style.position || 'relative';
            skill.style.overflow = 'visible';
            const div = document.createElement('div');
            div.className = ACTION_STOCK_OVERLAY_CLASS;
            div.dataset.sig = text;
            // 关键：外层是 display:flex，直接放多个节点会被当成多个 flex 子项横向排开；
            // 必须包一层块级元素，让多行文本作为单一子项整体渲染（\n 由 white-space:pre 保留）
            div.innerHTML = '<span style="display:block;white-space:pre;text-align:right">' + text + '</span>';
            Object.assign(div.style, {
                gridArea: '1/1', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
                margin: '0 2px -1px 0', color: '#fff', fontWeight: 'bold', position: 'relative',
                zIndex: '10', pointerEvents: 'none', whiteSpace: 'pre', textAlign: 'right',
                lineHeight: '1.15',
                textShadow: '-1px 0 var(--color-background-game),0 1px var(--color-background-game),1px 0 var(--color-background-game),0 -1px var(--color-background-game)',
            });
            skill.appendChild(div);
        });
    }
    function startActionStockObserver() {
        if (stockObserver) return;
        stockObserver = createScopedUiObserver(SEL_ACTION_GRID, scheduleStockRefresh);
        scheduleStockRefresh();
        stockInitialTimer = setTimeout(function () {
            stockInitialTimer = 0; scheduleStockRefresh();
        }, 1000);
    }
    function stopActionStockObserver() {
        clearTimeout(stockRefreshTimer); stockRefreshTimer = 0;
        clearTimeout(stockInitialTimer); stockInitialTimer = 0;
        if (stockObserver) { stockObserver.disconnect(); stockObserver = null; }
        removeAllStockOverlays();
    }
    function applyActionStockFeature(on) {
        if (on) startActionStockObserver(); else stopActionStockObserver();
    }

    // ═══ 模块②：显示升级时间 ═══
    // 在技能提示框（导航栏技能悬浮）里显示「升级所需时间 / 升级具体时间」，仅战斗中有效。
    const UPGRADE_TIME_CLASS = 'kunpo-upgrade-time-display';
    // 选择器用前缀匹配（css-modules 的 hash 后缀会随版本变化）
    const UPGRADE_TIP_SEL = '[class^="NavigationBar_navigationSkillTooltip"]';
    const UPGRADE_NAME_SEL = '[class^="NavigationBar_name"]';
    const UPGRADE_INFO_SEL = '[class^="NavigationBar_info"]';
    const UPGRADE_SKILL_MAP = Object.freeze({
        '/skills/stamina': '耐力', '/skills/intelligence': '智力', '/skills/attack': '攻击',
        '/skills/defense': '防御', '/skills/melee': '近战', '/skills/ranged': '远程', '/skills/magic': '魔法',
    });
    const UPGRADE_SKILL_REVERSE = Object.freeze(Object.fromEntries(
        Object.entries(UPGRADE_SKILL_MAP).map(function (e) { return [e[1], e[0]]; })
    ));
    let processedUpgradeTooltips = new WeakSet();
    let upgradeTimeObserver = null;   // 升级时间的 MutationObserver（未声明会导致 strict 模式下 ReferenceError）
    // 专用 gameState 获取（与原升级时间脚本同款直查逻辑，不走 KUNPO 共用的
    // getGameState —— 后者直查失败会走 #root BFS 兜底，可能返回缺
    // battlePlayers/combatStartTime 的另一份 state，导致这里静默失效）
    function getBattleGameState() {
        try {
            const gamePageEl = document.querySelector('[class^="GamePage"]');
            if (!gamePageEl) return null;
            const fiberKeys = Reflect.ownKeys(gamePageEl).filter(function (k) {
                return typeof k === 'string' && k.indexOf('__reactFiber$') === 0;
            });
            for (const fiberKey of fiberKeys) {
                const stateNode = gamePageEl[fiberKey] && gamePageEl[fiberKey].return && gamePageEl[fiberKey].return.stateNode;
                if (stateNode && stateNode.state) return stateNode.state;
            }
            return null;
        } catch (error) {
            console.log('[KUNPO][升级时间] 获取游戏状态出错:', error);
            return null;
        }
    }
    function calcBattleDurationSec(combatStartTime) {
        if (!combatStartTime) return 0;
        const start = new Date(combatStartTime).getTime();
        return Math.max(1, Math.floor((Date.now() - start) / 1000));
    }
    function formatUpgradeDuration(seconds) {
        const years = Math.floor(seconds / 31536000);
        seconds %= 31536000;
        const days = Math.floor(seconds / 86400);
        seconds %= 86400;
        const hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        const parts = [];
        if (years > 0) parts.push(years.toLocaleString() + ' y');
        if (days > 0) parts.push(days + ' d');
        if (hours > 0) parts.push(hours + ' h');
        if (minutes > 0 || parts.length === 0) parts.push(minutes + ' m');
        return parts.join(' ');
    }
    function formatUpgradeDateTime(seconds) {
        const now = new Date();
        const d = new Date(now.getTime() + seconds * 1000);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        if (Math.floor(seconds / 86400) >= 30 && d.getFullYear() > now.getFullYear()) {
            return d.getFullYear() + '/' + month + '/' + day + ' ' + hm;
        }
        return month + '/' + day + ' ' + hm;
    }
    function handleUpgradeTooltip(tooltipEl) {
        if (trialEndState.silenced) return;
        try {
            if (processedUpgradeTooltips.has(tooltipEl)) return;
            processedUpgradeTooltips.add(tooltipEl);
            const gs = getBattleGameState();
            const playerId = gs && gs.character && gs.character.id;
            const battlePlayers = gs && gs.battlePlayers;
            const combatStartTime = gs && gs.combatStartTime;
            if (!gs || !playerId || !battlePlayers || !combatStartTime) return;   // 未在战斗中
            const playerIndex = battlePlayers.findIndex(function (p) { return p.character && p.character.id === playerId; });
            if (playerIndex < 0) return;
            const skillNameEl = tooltipEl.querySelector(UPGRADE_NAME_SEL);
            const skillName = skillNameEl ? skillNameEl.textContent.trim() : '';
            const skillKey = skillName ? UPGRADE_SKILL_REVERSE[skillName] : null;
            if (!skillKey) return;
            const playerData = battlePlayers[playerIndex];
            const totalExp = (playerData.totalSkillExperienceMap && playerData.totalSkillExperienceMap[skillKey]) || 0;
            const needExpEl = tooltipEl.querySelector('div:nth-child(4)');
            const needExp = needExpEl ? parseFloat(needExpEl.textContent.replace(/[^0-9.-]/g, '')) : 0;
            if (totalExp <= 0 || needExp <= 0) return;
            const expPerHour = (totalExp / calcBattleDurationSec(combatStartTime)) * 3600;
            if (expPerHour <= 0) return;
            const remainingSec = Math.ceil(needExp / expPerHour * 3600);
            let timeEl = tooltipEl.querySelector('.' + UPGRADE_TIME_CLASS);
            if (!timeEl) {
                timeEl = document.createElement('div');
                timeEl.className = UPGRADE_TIME_CLASS;
                timeEl.style.cssText = 'line-height: 1.4;';
                const infoEl = tooltipEl.querySelector(UPGRADE_INFO_SEL);
                tooltipEl.insertBefore(timeEl, infoEl);   // 插在升级所需经验之后、说明信息之前
            }
            timeEl.innerHTML = '升级所需时间:  ' + formatUpgradeDuration(remainingSec)
                + '<br>升级具体时间: ' + formatUpgradeDateTime(remainingSec);
        } catch (error) {
            console.log('[KUNPO][升级时间] 处理技能提示框出错:', error);
        }
    }
    function startUpgradeTimeObserver() {
        if (upgradeTimeObserver) return;
        if (!document.body) return;   // body 未就绪时由 initOptionalFeatures 的 DOMContentLoaded 分支重试
        const tipMatch = function (el) {
            return el instanceof Element && /^NavigationBar_navigationSkillTooltip/.test(String(el.className || ''));
        };
        const scanTree = function (root) {
            if (tipMatch(root)) handleUpgradeTooltip(root);
            if (root.querySelectorAll) root.querySelectorAll(UPGRADE_TIP_SEL).forEach(handleUpgradeTooltip);
        };
        upgradeTimeObserver = createScopedUiObserver(UPGRADE_TIP_SEL, function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1 && !isKunpoNode(node)) scanTree(node);
                });
                if (mutation.type === 'attributes' && mutation.target.nodeType === 1 && !isKunpoNode(mutation.target)) scanTree(mutation.target);
            });
        }, {
            childList: true, subtree: true,
            attributes: true, attributeFilter: ['class', 'style', 'data-popper-placement'],
        });
        document.querySelectorAll(UPGRADE_TIP_SEL).forEach(handleUpgradeTooltip);
    }
    function stopUpgradeTimeObserver() {
        if (upgradeTimeObserver) { upgradeTimeObserver.disconnect(); upgradeTimeObserver = null; }
        processedUpgradeTooltips = new WeakSet();
        document.querySelectorAll('.' + UPGRADE_TIME_CLASS).forEach(function (n) { n.remove(); });
    }
    function applyUpgradeTimeFeature(on) {
        if (on) startUpgradeTimeObserver(); else stopUpgradeTimeObserver();
    }

    // ── 启动入口：按当前设置启用两个可选模块 ──
    function initOptionalFeatures() {
        applyActionStockFeature(showActionStockEnabled());
        applyUpgradeTimeFeature(showUpgradeTimeEnabled());
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
        // 动作页面显示库存（默认不勾选）：并入自「[银河奶牛]动作界面显示库存」插件
        const stockRow = document.createElement('label');
        stockRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin:0 0 6px 0;color:#c3d2f2;font:600 11px/1.4 system-ui,sans-serif;cursor:pointer';
        const stockInput = document.createElement('input');
        stockInput.type = 'checkbox';
        stockInput.checked = showActionStockEnabled();
        stockInput.addEventListener('change', function () {
            writeShowActionStockFlag(stockInput.checked);
            applyActionStockFeature(stockInput.checked);
            if (stockInput.checked) {
                showAssignmentToast('库存显示已启用：请卸载「动作界面显示库存」插件并刷新网页，避免角标重复叠加', 5000);
            } else {
                showAssignmentToast('动作页库存显示已关闭', 3000);
            }
        });
        stockRow.appendChild(stockInput);
        stockRow.appendChild(document.createTextNode('动作页面显示库存（在动作按钮右下角显示对应物品库存）'));
        form.appendChild(stockRow);
        // 显示升级时间（默认不勾选）：并入自「[银河奶牛]显示战斗升级所需时间」插件
        const upgRow = document.createElement('label');
        upgRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin:0 0 6px 0;color:#c3d2f2;font:600 11px/1.4 system-ui,sans-serif;cursor:pointer';
        const upgInput = document.createElement('input');
        upgInput.type = 'checkbox';
        upgInput.checked = showUpgradeTimeEnabled();
        upgInput.addEventListener('change', function () {
            writeShowUpgradeTimeFlag(upgInput.checked);
            applyUpgradeTimeFeature(upgInput.checked);
            if (upgInput.checked) {
                showAssignmentToast('升级时间显示已启用：请卸载「显示战斗升级所需时间」插件并刷新网页，避免重复注入', 5000);
            } else {
                showAssignmentToast('升级时间显示已关闭', 3000);
            }
        });
        upgRow.appendChild(upgInput);
        upgRow.appendChild(document.createTextNode('显示升级时间（战斗中，技能提示框显示升级所需/具体时间）'));
        form.appendChild(upgRow);
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
            saveGuildSettings(nameInput.value, idInput.value, urlInput.value, mkInput.value, docInput.value, hideInput.checked, countInput.checked, cnInput.checked, auraInput.checked, upgInput.checked, stockInput.checked);
        });
        cancel.addEventListener('click', function () { form.style.display = 'none'; });
        btns.append(save, cancel, resume, logBtn);
        form.appendChild(btns);
        state.settingsInputs = { name: nameInput, id: idInput, url: urlInput, mk: mkInput, doc: docInput, cosApi: cosApiInput, cosToken: cosTokenInput, hide: hideInput, count: countInput, cn: cnInput, aura: auraInput, upg: upgInput, stock: stockInput };
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
    function saveGuildSettings(name, idRaw, url, mkRaw, docRaw, hideRaw, countRaw, cnRaw, auraRaw, upgRaw, stockRaw) {
        try {
            writeCfg(K_GUILD_NAME, String(name || '').trim());
            writeCfg(K_GUILD_ID, String(idRaw || '').trim());
            const mk = String(mkRaw || '').trim();
            if (mk) writeCfg(K_MASTER_KEY, mk); else clearCfg(K_MASTER_KEY);
            try { localStorage.setItem(K_HIDE_ICON, hideRaw ? '1' : '0'); } catch (_) {}
            try { localStorage.setItem(K_CN_DIRECT, cnRaw ? '1' : '0'); } catch (_) {}
            writeCfg(K_COUNT_CLICKS, countRaw ? '1' : '0');
            writeAuraRecoFlag(!!auraRaw);
            writeShowUpgradeTimeFlag(!!upgRaw);
            writeShowActionStockFlag(!!stockRaw);
            applyUpgradeTimeFeature(!!upgRaw);      // 立刻生效：开/关技能提示框升级时间
            applyActionStockFeature(!!stockRaw);    // 立刻生效：开/关动作页库存叠加
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
            // 角色/公会未识别前不自动静默，避免提前卸载消息监听而永远等不到身份。
            if (override !== '1' && (!currentCharacterName() || !guildGate.known)) return;
            // 周四还没上传时保留可上传窗口；手动指定静默仍优先。
            if (override !== '1' && thursdayUploadPending()) return;
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
            stopActionStockObserver(); stopUpgradeTimeObserver();
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
    function isOwnerOrGeneral() {
        const info = guildRoleInfo();
        if (!info.known) return false;
        return info.isOwner || String(info.role).toLowerCase() === 'general';
    }
    // 仅会长（owner/leader）为 true；职位未知或不是会长（将军/官员/成员）均视为 false
    function isGuildLeader() {
        const info = guildRoleInfo();
        return !!(info && info.known && info.isOwner);
    }
    // 会长/将军专属按钮显隐修正：《检查报名》仅会长/将军，《打开计算器》仅会长。
    // 原与本函数合一的《功德+1》按钮已整体删除，函数由 updateMeritButton 更名而来，
    // 保留原有调用时机（每秒状态刷新、公会门控各分支）不变。
    function updateStaffButtons() {
        const blocked = guildBlocked();
        const show = isOwnerOrGeneral();
        if (state.signupBtn) state.signupBtn.style.display = (blocked || !show) ? 'none' : '';
        // 《打开计算器》：仅会长可见；职位未知或不是会长（将军/官员/成员）时隐藏
        if (state.calcBtn) state.calcBtn.style.display = (blocked || !isGuildLeader()) ? 'none' : '';
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
        auraRecoObserver = createScopedUiObserver('[class*="Party_page"], [class^="Party_"]', function () {
            auraGeometryCache = new WeakMap(); auraHover.layout = null;
            scheduleAuraReco();
        });
        syncAuraRecoButton();
        syncAuraRecoInfo();
    }
    // CN 站（milkywayidlecn.com）构建的 CSS Modules hash 与列内嵌套和 .com 不同，
    // 部分选择器与插入策略按站点分支处理；.com 路径保持原样不动
    const IS_CN_SITE = /milkywayidlecn/i.test(location.hostname);
    // 按当前设置与页面状态同步《推荐光环》按钮的注入/移除
    // （静默不影响光环推荐：试炼结束后该功能仍可用）
    function syncAuraRecoButton() {
        // 两站统一用前缀匹配：游戏重部署后 CSS Modules 的 hash 后缀会变化，
        // 写死 .Party_partyOptions__3HGXK 会在 .com 站随游戏更新失灵（CN 站此前已改前缀匹配）。
        const optionsEl = document.querySelector('[class*="Party_partyOptions"]');
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
        try { profiles = readJsonCached('profile_export_list', []) || []; } catch (_) {}
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
        try { return readJsonCached(PARTY_NAME_CACHE_KEY, {}) || {}; } catch (_) { return {}; }
    }
    function writePartyNameCache(map) {
        try { localStorage.setItem(PARTY_NAME_CACHE_KEY, JSON.stringify(map)); } catch (_) {}
    }
    // ── 队友资料缓存：点开其资料页时 WS 推送 profile_shared，存五项战斗等级 ──
    const PARTY_PROFILE_KEY = 'kunpo_profile_map';
    function readPartyProfileMap() {
        try { return readJsonCached(PARTY_PROFILE_KEY, {}) || {}; } catch (_) { return {}; }
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
    const AURA_PRIORITY_DEFAULT = ['physical', 'speed', 'critical', 'invincible', 'guardian'];
    function auraPriorityList() {
        let arr = null;
        try { arr = readJsonCached(K_AURA_PRIORITY, null); } catch (_) {}
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
    const auraServer = { byName: null, fetchedAt: 0, inFlight: false, failures: 0,
        nextRetryAt: 0, retryTimer: 0, generation: 0 };
    // 拉取共享空间 members 并按 name 建索引。本会话只拉一次（优先复用「拉取排刀」那次
    // 已经拿到的整份记录），不再按时间反复刷新；上传成功后 resetAuraServerCache() 会让它重拉一次。
    async function refreshAuraServerData() {
        if (auraServer.inFlight) return;
        if (auraServer.byName) return;              // 已拉过 → 不再周期性刷新
        const cfg = assignmentConfig();
        if (!cfg) return;
        if (auraServer.failures >= 5 || Date.now() < auraServer.nextRetryAt) return;
        const generation = auraServer.generation;
        let succeeded = false;
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
            if (generation !== auraServer.generation) return;
            auraServer.byName = byName;
            auraServer.failures = 0; auraServer.nextRetryAt = 0;
            clearTimeout(auraServer.retryTimer); auraServer.retryTimer = 0;
            succeeded = true;
            auraServer.fetchedAt = Date.now();
        } catch (_) {
            if (generation !== auraServer.generation) return;
            auraServer.failures++;
            const delay = Math.min(30000, 1000 * Math.pow(2, auraServer.failures - 1));
            auraServer.nextRetryAt = auraServer.failures >= 5 ? Infinity : Date.now() + delay;
            if (auraServer.failures < 5) {
                clearTimeout(auraServer.retryTimer);
                auraServer.retryTimer = setTimeout(function () {
                    auraServer.retryTimer = 0;
                    if (auraRecoEnabled() && document.querySelector('[class*="Party_page"], [class^="Party_"]')) void refreshAuraServerData();
                }, delay);
            }
        } finally {
            auraServer.inFlight = false;
            if (succeeded) setTimeout(function () { syncAuraRecoInfo(); }, 0);
        }
    }
    // 上传成功后调用：让光环数据下次重新拉一次，避免显示上传前的旧值。
    // 函数声明会提升，uploadLoadoutsToServer 里可以直接调。
    function resetAuraServerCache() {
        clearTimeout(auraServer.retryTimer); auraServer.retryTimer = 0;
        auraServer.failures = 0; auraServer.nextRetryAt = 0; auraServer.generation++;
        auraGeometryCache = new WeakMap();
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
        try { return readJsonCached(K_AURA_MANUAL, {}) || {}; } catch (_) { return {}; }
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
    // ── 复活/无敌固定勾选：{成员名: 'revive'|'invincible'} ────────────────
    // 复活/无敌是主动能力且无数值（AURA_STATS.base 为 null），不参与自动分配；
    // 由信息块里的勾选框手动指定携带者：每人最多勾一个（存储值是单值，天然互斥），
    // 每种能力全队最多一人（写入时清理其他成员的同键勾选）。
    function readAuraFixed() {
        try { return readJsonCached(K_AURA_FIXED, {}) || {}; } catch (_) { return {}; }
    }
    function writeAuraFixed(map) {
        try { localStorage.setItem(K_AURA_FIXED, JSON.stringify(map)); } catch (_) {}
    }
    function setAuraFixed(name, key) {
        const map = readAuraFixed();
        const n = String(name || '').trim();
        Object.keys(map).forEach(function (other) { if (other !== n && map[other] === key) delete map[other]; });
        map[n] = key;
        writeAuraFixed(map);
    }
    function clearAuraFixed(name) {
        const map = readAuraFixed();
        delete map[String(name || '').trim()];
        writeAuraFixed(map);
    }
    // 固定勾选框行：specialKeys 里每个能力一个框（勾选互斥由存储层保证）
    function auraFixedChecksHtml(fixedKey, specialKeys) {
        if (!specialKeys.length) return '';
        let cells = '';
        specialKeys.forEach(function (k) {
            const label = (AURA_STATS[k] && AURA_STATS[k].label) || k;
            cells += '<label style="display:inline-flex;align-items:center;gap:3px;margin:0 5px;cursor:pointer;font-weight:400">'
                + '<input data-fixed-key="' + k + '" type="checkbox"' + (fixedKey === k ? ' checked' : '') + ' style="margin:0;vertical-align:middle"/>'
                + '<span>' + label + '</span>'
                + '</label>';
        });
        return '<div style="display:flex;justify-content:center;margin-top:2px">' + cells + '</div>';
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
    let auraGeometryCache = new WeakMap();
    function auraSlotRootFor(nameEl, container, nameEls) {
        const cached = auraGeometryCache.get(nameEl);
        if (cached && cached.container === container && cached.root.isConnected && (!cached.card || cached.card.isConnected)) {
            if (cached.card) nameEl.__cnCard = cached.card;
            return cached.root;
        }
        const root = findAuraSlotRoot(nameEl, container, nameEls);
        if (root) auraGeometryCache.set(nameEl, { container, root, card: nameEl.__cnCard || null });
        return root;
    }
    function findAuraSlotRoot(nameEl, container, nameEls) {
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
    // CN 站「修改队伍/创建队伍」编辑模式检测：编辑面板的槽位配置行含「最低等级/最高等级」字样。
    // 配置行可能经 React Portal 渲染在 Party_page 容器之外，容器内查不到时用全文档兜底
    // （这两个词高度专属槽位配置，误判代价只是信息块暂时隐藏，可接受）。
    function cnPartyEditMode() {
        try {
            const container = document.querySelector('[class*="Party_page"]') || document.querySelector('[class^="Party_"]');
            const has = function (t) { return t.indexOf('最低等级') >= 0 && t.indexOf('最高等级') >= 0; };
            if (container && has(container.textContent || '')) return true;
            return has(document.body ? (document.body.textContent || '') : '');
        } catch (_) { return false; }
    }
    // 跨站点「编辑/创建队伍」模式检测：CN 走文字判断；非 CN 无对应文字，改为结构判断——
    // 编辑/创建页含槽位配置表单（等级/职业等 <input>/<select>），而成员浏览页通常是只读的。
    // 扫描时排除本脚本注入的信息块（块内带录入框），避免把自己误判为编辑模式。
    // 还要排除 aria-hidden="true" 的隐藏控件：MUI 下拉框（MuiSelect-nativeInput）会在浏览页
    // 渲染一个仅供无障碍访问的隐藏 <input type="text">，游戏更新加了这个组件后，
    // 旧逻辑会把它当成表单控件 → 浏览页被误判成编辑页 → 信息块永久消失（2026-09 实测踩坑）。
    function partyEditMode() {
        if (IS_CN_SITE && cnPartyEditMode()) return true;
        try {
            const container = document.querySelector('[class*="Party_page"]') || document.querySelector('[class^="Party_"]');
            if (!container) return false;
            const ctrls = container.querySelectorAll('input,select,textarea');
            for (let i = 0; i < ctrls.length; i++) {
                const c = ctrls[i];
                if (c.closest && c.closest('.' + AURA_INFO_CLASS)) continue;   // 排除本脚本录入框
                if (c.getAttribute && c.getAttribute('aria-hidden') === 'true') continue;   // MUI 等组件库的无障碍隐藏 input
                if (!c.offsetWidth && !c.offsetHeight && !c.clientHeight) continue;         // 完全无布局的隐藏控件
                return true;
            }
        } catch (_) {}
        return false;
    }
    // CN 站信息块重定位：左/宽取列根（整列）矩形，顶部取「列内最大底边」（fixed 不受 overflow 裁剪影响）
    function repositionCnAuraBlocks() {
        const blocks = Array.from(document.querySelectorAll('.' + AURA_INFO_CLASS));
        if (cnPartyEditMode()) { blocks.forEach(b => { if (b.style.display !== 'none') b.style.display = 'none'; }); return; }
        // Read every layout before writing any position.
        const positions = blocks.map(function (block) {
            const root = block.__cnSlotRoot;
            if (!root || !root.isConnected) return { block, remove: true };
            const r = root.getBoundingClientRect();
            return { block, hidden: r.width < 10, left: Math.round(r.left) + 'px', width: Math.round(r.width) + 'px',
                top: Math.round(cnColumnBottom(root) + 4) + 'px' };
        });
        positions.forEach(function (p) {
            const b = p.block;
            if (p.remove) { b.remove(); return; }
            const display = p.hidden ? 'none' : '';
            if (b.style.display !== display) b.style.display = display;
            if (p.hidden) return;
            ['left', 'width', 'top'].forEach(k => { if (b.style[k] !== p[k]) b.style[k] = p[k]; });
        });
    }
    let cnAuraPosInstalled = false;
    let cnAuraPositionFrame = 0;
    function scheduleCnAuraPosition() {
        auraHover.layout = null;
        if (cnAuraPositionFrame) return;
        cnAuraPositionFrame = requestAnimationFrame(function () { cnAuraPositionFrame = 0; repositionCnAuraBlocks(); });
    }
    function ensureCnAuraPosListeners() {
        if (cnAuraPosInstalled) return;
        cnAuraPosInstalled = true;
        window.addEventListener('scroll', scheduleCnAuraPosition, true);   // capture：捕获内部滚动容器
        window.addEventListener('resize', function () { auraGeometryCache = new WeakMap(); scheduleCnAuraPosition(); });
    }
    // ── 成员卡片悬停提示：显示该成员全部光环等级（仅启用光环推荐时生效）──
    // 用自定义浮动 div 跟随鼠标，而不是原生 title —— title 是悬停期间动态
    // 设置时浏览器不会弹出，必须移开再悬停才有。
    const auraHover = { installed: false, el: null, raf: 0, layout: null, x: 0, y: 0 };
    // 光标所在成员：遍历成员名字元素，定位各自卡片区域，命中光标的即目标
    function auraHoverMemberAt(container, mx, my) {
        const now = Date.now();
        let layout = auraHover.layout;
        if (!layout || layout.container !== container || now - layout.at > 100 || layout.entries.some(x => !x.el.isConnected)) {
            const nameEls = auraNameElements(container);
            const entries = [];
            nameEls.forEach(function (el, index) {
                try {
                    const root = auraSlotRootFor(el, container, nameEls);
                    const rectEl = (IS_CN_SITE && el.__cnCard) ? el.__cnCard : root;
                    if (!rectEl) return;
                    entries.push({ el: rectEl, rect: rectEl.getBoundingClientRect(), index, name: String(el.textContent || '').trim() });
                } catch (_) {}
            });
            layout = auraHover.layout = { container, at: now, entries };
        }
        for (const entry of layout.entries) {
            const r = entry.rect;
            if (r.width >= 10 && r.height >= 10 && mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom)
                return { index: entry.index, name: entry.name };
        }
        return null;
    }
    // 提示文本：成员名 + 数据来源 + 八个光环等级（服务器上传 → 手动录入，与推荐同源）
    function auraHoverTipText(index, fallbackName) {
        let name = fallbackName;
        try {
            const members = collectPartyMemberNames();
            if (members[index] && members[index].name) name = members[index].name;
        } catch (_) {}
        if (!name) return '';
        const serverAu = serverAuraLevels(name);
        const au = serverAu || manualAuraLevels(readAuraManual(), name);
        const lines = [name];
        if (!au) return lines.join('\n') + '\n光环数据未上传或非本公会';
        lines.push(serverAu ? '── 服务器上传 ──' : '── 手动录入 ──');
        Object.keys(AURA_MAP).forEach(function (k) {
            const label = (AURA_STATS[k] && AURA_STATS[k].label) || k;
            lines.push(label + '：' + Number(au[k] || 0));
        });
        return lines.join('\n');
    }
    // 全局安装一次：mousemove 经 rAF 节流，仅组队页存在时检测
    function ensureAuraHoverTooltip() {
        if (auraHover.installed) return;
        auraHover.installed = true;
        const tip = document.createElement('div');
        tip.id = 'kunpo-aura-hover-tip';
        tip.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483000;display:none;pointer-events:none;'
            + 'padding:6px 10px;border-radius:6px;background:rgba(10,16,34,.95);border:1px solid #45598c;'
            + 'color:#eef3ff;font:600 11px/1.7 system-ui,sans-serif;white-space:pre;box-shadow:0 6px 18px rgba(0,0,0,.45)';
        const hide = function () { if (tip.style.display !== 'none') tip.style.display = 'none'; };
        document.addEventListener('mousemove', function (e) {
            auraHover.x = e.clientX; auraHover.y = e.clientY;
            if (auraHover.raf) return;
            auraHover.raf = requestAnimationFrame(function () {
                auraHover.raf = 0;
                const mx = auraHover.x, my = auraHover.y;
                try {
                    if (!auraRecoEnabled()) { hide(); return; }   // 仅启用光环推荐时显示
                    const container = document.querySelector('[class*="Party_page"]') || document.querySelector('[class^="Party_"]');
                    if (!container) { hide(); return; }
                    void refreshAuraServerData();   // 推荐开关关闭时也补拉共享空间光环数据（有缓存直接复用）
                    const hit = auraHoverMemberAt(container, mx, my);
                    if (!hit) { hide(); return; }
                    const text = auraHoverTipText(hit.index, hit.name);
                    if (!text) { hide(); return; }
                    if (tip.textContent !== text) tip.textContent = text;
                    if (tip.style.display !== 'block') tip.style.display = 'block';
                    const r = tip.getBoundingClientRect();
                    let x = mx + 14, y = my + 14;
                    if (x + r.width > window.innerWidth - 8) x = mx - r.width - 10;
                    if (y + r.height > window.innerHeight - 8) y = my - r.height - 10;
                    tip.style.left = Math.max(4, Math.round(x)) + 'px';
                    tip.style.top = Math.max(4, Math.round(y)) + 'px';
                } catch (_) { hide(); }
            });
        }, true);
        window.addEventListener('scroll', function () { auraHover.layout = null; }, true);
        window.addEventListener('resize', function () { auraHover.layout = null; auraGeometryCache = new WeakMap(); });
        document.body.appendChild(tip);
        auraHover.el = tip;
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
        if (partyEditMode()) {
            // 编辑/创建队伍模式：信息块会挡住槽位操作区 → 移除，退出编辑后自动恢复
            if (IS_CN_SITE) cnAuraLog('编辑模式，隐藏信息块');
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
        const recoKeys = auraPriorityKeys(members.length);
        // 复活/无敌参与推荐（优先级槽位序号 < 队伍人数）时，信息块出现对应勾选框，
        // 勾选后该成员固定携带该能力，并不再参与光环自动推荐（勾/取消都会整体重算）
        const specialKeys = ['revive', 'invincible'].filter(function (k) { return recoKeys.indexOf(k) >= 0; });
        const fixedMap = readAuraFixed();
        // 只对「资料+光环都就绪」的成员做唯一性分配（每种光环只给一人，总值最优）。
        // 以前要求全员就绪才开始推荐：只要一个人没采到资料/没上传光环，全队都看不到推荐。
        // 现在未就绪成员继续显示等待提示，不再拖累其他人；其数据补齐后会自动重算分配。
        // 已勾选固定携带复活/无敌的成员被排除在推荐之外：该成员不占推荐名额，
        // 其余成员在其勾选/取消后立即按新阵容重新分配。
        const readyPos = [];
        infos.forEach(function (x, i) {
            if (!x.ready || !x.auraReady) return;
            const fx = fixedMap[String(x.name || '').trim()] || '';
            if (fx && specialKeys.indexOf(fx) >= 0) return;   // 固定携带复活/无敌 → 不参与光环推荐
            readyPos.push(i);
        });
        const allocation = (readyPos.length && recoKeys.length)
            ? assignAurasUnique(readyPos.map(function (i) { return infos[i]; }), recoKeys)
            : null;
        const usedRoots = [];
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
            // 复活/无敌固定勾选：勾选的成员在块首显示「固定携带」，勾选框追加在块尾
            const fixedKey = (fixedMap[String(x.name || '').trim()] || '');
            const fixedValid = fixedKey && specialKeys.indexOf(fixedKey) >= 0 ? fixedKey : '';
            if (fixedValid) {
                html = '<div style="color:#ffd60a">固定携带：' + ((AURA_STATS[fixedValid] && AURA_STATS[fixedValid].label) || fixedValid) + '</div>' + html;
            }
            html += auraFixedChecksHtml(fixedValid, specialKeys);
            // 信息块放进成员列根节点内部末尾：撑高根节点，显示在整张卡片下方（不新增网格列）
            const slotRoot = auraSlotRootFor(el, container, nameEls);
            if (!slotRoot || !slotRoot.parentNode) return;
            if (usedRoots.indexOf(slotRoot) < 0) usedRoots.push(slotRoot);
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
                block.addEventListener('change', function (e) {
                    const t = e.target;
                    if (t && t.dataset && t.dataset.fixedKey) {
                        const name = block.dataset.memberName || '';
                        if (name) {
                            if (t.checked) setAuraFixed(name, t.dataset.fixedKey);
                            else clearAuraFixed(name);
                        }
                        if (t.blur) t.blur();   // 让出焦点，下一行重渲染不会被「正在输入」跳过
                    }
                    syncAuraRecoInfo();
                });
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
            // 有输入框或勾选框时展开高度并开放鼠标交互；否则固定 56px 且不响应指针
            const hasCtrls = showInputs || specialKeys.length > 0;
            const wantPE = hasCtrls ? 'auto' : 'none';
            const wantH = hasCtrls ? 'auto' : '56px';
            if (block.style.pointerEvents !== wantPE) block.style.pointerEvents = wantPE;
            if (block.style.height !== wantH) block.style.height = wantH;
            // 正在输入时不重写 innerHTML，避免输入框失焦
            const active = document.activeElement;
            if (!(active && block.contains(active) && hasCtrls) && block.dataset.sig !== html) {
                block.innerHTML = html;
                block.dataset.sig = html;
            }
            } catch (e) { if (IS_CN_SITE) try { console.warn('[KUNPO][CN] 渲染异常:', e); } catch (_) {} }
        });
        // 清理「孤儿块」：根节点不在本次成员列里的旧块（创建队伍页残留、离开队伍后
        // 根节点被复用/卸载的块）。两站都会出现（CN 的 fixed 块悬空在中央，非 CN 的块
        // 卡在错位的列里），必须显式移除；否则要退出队伍页重进才会消失。
        document.querySelectorAll('.' + AURA_INFO_CLASS).forEach(function (block) {
            const root = block.__cnSlotRoot || block.parentNode;
            if (!root) return;
            if (usedRoots.indexOf(root) < 0 && block.parentNode) block.parentNode.removeChild(block);
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
            resetAuraServerCache();
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

    // DIY插件分享弹窗：Title「DIY插件分享」+ N 个条目
    // 第一行大字体：序号 + 名称（可点击跳下载链接）；第二行标准字体：DIY内容
    function showDiyShareModal() {
        const old = document.getElementById('kunpo-diy-share-modal');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        const overlay = document.createElement('div');
        overlay.id = 'kunpo-diy-share-modal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center';
        const box = document.createElement('div');
        box.style.cssText = 'position:relative;width:min(560px,92vw);max-height:80vh;display:flex;flex-direction:column;padding:16px;border-radius:12px;'
            + 'background:linear-gradient(145deg,#152447,#1d3566);color:#eef3ff;border:1px solid #6f9bd8;box-shadow:0 10px 28px rgba(3,10,26,.55);font:12.5px/1.5 system-ui,sans-serif';
        const title = document.createElement('div');
        title.style.cssText = 'font-weight:700;font-size:15px;margin-bottom:10px;color:#8fc3ff';
        title.textContent = 'DIY插件分享';
        const close = document.createElement('button');
        close.type = 'button'; close.textContent = '×';
        close.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:0;color:#c3d2f2;font:700 20px/1 system-ui;cursor:pointer';
        close.addEventListener('click', function () { overlay.remove(); });
        const list = document.createElement('div');
        list.style.cssText = 'overflow:auto;padding-right:6px';
        DIY_SHARE_ITEMS.forEach(function (item, i) {
            const card = document.createElement('div');
            card.style.cssText = 'margin:0 0 10px 0;padding:10px 12px;border-radius:10px;'
                + 'background:rgba(255,255,255,.06);border:1px solid rgba(111,155,216,.35)';
            // 第一行：大字体 序号 + 名称（点击名称跳下载链接）
            const head = document.createElement('div');
            head.style.cssText = 'font-size:16px;font-weight:700;line-height:1.4';
            const idx = document.createElement('span');
            idx.textContent = (i + 1) + '. ';
            const link = document.createElement('a');
            link.textContent = item.name;
            link.href = item.url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.title = '点击下载：' + item.url;
            link.style.cssText = 'color:#8fc3ff;text-decoration:underline;cursor:pointer';
            head.appendChild(idx);
            head.appendChild(link);
            // 第二行：标准字体 DIY内容
            const body = document.createElement('div');
            body.style.cssText = 'margin-top:4px;white-space:pre-wrap;word-break:break-word;color:#dbe6fb';
            body.textContent = item.content;
            card.appendChild(head);
            card.appendChild(body);
            list.appendChild(card);
        });
        if (!DIY_SHARE_ITEMS.length) {
            list.textContent = '暂无分享内容（在代码中 DIY_SHARE_ITEMS 数组里配置条目）。';
        }
        box.appendChild(close);
        box.appendChild(title);
        box.appendChild(list);
        overlay.appendChild(box);
        overlay.addEventListener('click', function (ev) { if (ev.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
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
        startThursdayUploadReminder();
        initAssignment();
        addAuraRecoButton();
        ensureAuraHoverTooltip();   // 成员卡片悬停显示全部光环等级（仅启用光环推荐时生效）
        initOptionalFeatures();   // 可选功能模块（动作页库存 / 升级时间）：按设置勾选启动
        void checkForUpdate();
    }

    if (window.__mwiSingleCleanup) window.__mwiSingleCleanup();
    window.__mwiSingleCleanup = cleanupScriptTimers;
    window.addEventListener('beforeunload', cleanupScriptTimers);

    function safeBoot() {
        try { boot(); } catch (e) { console.error('[KUNPO] 初始化失败：', e); }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', safeBoot, { once: true });
    } else {
        safeBoot();
    }
})();
