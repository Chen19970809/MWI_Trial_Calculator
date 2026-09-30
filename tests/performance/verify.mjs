import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { JSDOM, VirtualConsole } from 'jsdom';
import { execFileSync } from 'node:child_process';

const [file, mode] = process.argv.slice(2);
assert(file && ['baseline', 'modified'].includes(mode), 'usage: node verify.mjs FILE baseline|modified');
const modified = mode === 'modified';
const baselineSource = fs.existsSync('BASELINE.original.user.js')
    ? fs.readFileSync('BASELINE.original.user.js', 'utf8')
    : execFileSync('git', ['show', '75ec60c7fb3a9fff06db414810c583411883115e:KUNPO试炼专用.user.js'], { encoding: 'utf8' });
const source = file === '--baseline' ? baselineSource : fs.readFileSync(file, 'utf8');
new vm.Script(source);
const results = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
const normalize = value => JSON.parse(JSON.stringify(value));
let networkCalls = 0;

function fixture(html = '', cn = false) {
    const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', {
        url: cn ? 'https://www.milkywayidlecn.com/' : 'https://www.milkywayidle.com/',
        runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: new VirtualConsole()
    });
    const w = dom.window;
    w.localStorage.setItem('kunpo_last_seen_version', source.match(/@version\s+(\S+)/)[1]);
    w.localStorage.setItem('kunpo_update_last_check', String(Date.now()));
    w.GM_xmlhttpRequest = () => { networkCalls++; throw Error('Unexpected live network request'); };
    w.alert = () => {};
    Object.defineProperty(w.crypto, 'subtle', { value: webcrypto.subtle });
    for (const n of ['TextEncoder', 'TextDecoder', 'Response', 'CompressionStream', 'DecompressionStream']) w[n] = globalThis[n];
    const exportCode = `
        window.__test = {
            state, assignmentState, trialEndState, auraServer,
            renderStock: (...a) => renderActionStockOverlays(...a), startStock: startActionStockObserver, stopStock: stopActionStockObserver,
            mergeStockItems, rebuildStockCounts, stockItemKey,
            renderAssignment: (...a) => renderAssignmentUi(...a), clearAssignmentUi, installAssignmentObserver,
            refreshAuraServerData, resetAuraServerCache, deriveKey, encryptRecord, decryptRecord,
            collectLabyrinthLoadouts, collectShrines, collectHouseRoomLevels, collectAchievementCompletion, buildPayload,
            uploadLoadoutsToServer,
            stubUpload: (remote, put) => { assignmentConfig = () => ({ guild: 'fixture-guild', binId: 'fixture-bin', password: 'fixture-only-password' }); cloudFetchRecord = async () => remote; cloudPutRecord = put; },
            mergeSkills, mergeAbilities, handleGameMessage, readAuraManual, writeAuraManual,
            startUpgrade: startUpgradeTimeObserver, stopUpgrade: stopUpgradeTimeObserver,
            setBattleGameState: gs => { getBattleGameState = () => gs; },
            assignAurasUnique, normalizeHouseRoomMap, getGameState, handleUpgradeTooltip,
            getTooltipSet: () => processedUpgradeTooltips,
            setGameState: gs => { getGameState = () => gs; },
            setStockNames: names => { stockItemNameByHrid = names; },
            stopAssignment: () => { assignmentState.observer?.disconnect(); assignmentState.observer = null; clearTimeout(assignmentState.timer); },
            enableAura: () => { auraRecoEnabled = () => true; },
            stubNetwork: (fetcher, config) => { cloudFetchRecord = fetcher; deriveKey = async () => 'fixture-key'; assignmentConfig = config; },
            stubAuraSync: fn => { syncAuraRecoInfo = fn; },
            watchAggregation: fn => { const old = rebuildStockCounts; rebuildStockCounts = (...a) => { fn(); return old(...a); }; },
            watchMaxEnhancement: fn => { const old = buildMaxEnhancementByItem; buildMaxEnhancementByItem = (...a) => { fn(); return old(...a); }; },
            watchAssignmentRender: fn => { const old = renderAssignmentUi; renderAssignmentUi = (...a) => { fn(); return old(...a); }; },
            scheduleCn: typeof scheduleCnAuraPosition === 'function' ? scheduleCnAuraPosition : null,
            replaceCnPosition: fn => { repositionCnAuraBlocks = fn; },
            readJsonCached: typeof readJsonCached === 'function' ? readJsonCached : null,
            readGeometry: (...a) => auraHoverMemberAt(...a),
            geometryCache: () => typeof auraGeometryCache === 'undefined' ? null : auraGeometryCache,
            resetGeometry: () => { if (typeof auraGeometryCache !== 'undefined') auraGeometryCache = new WeakMap(); },
            auraHover,
            getStockCounts: () => stockCountByHridEnh
        };
    `;
    const at = source.lastIndexOf('})();');
    w.eval(source.slice(0, at) + exportCode + source.slice(at));
    // boot is normally scheduled via DOMContentLoaded. Tests explicitly own observers.
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    return { dom, w, t: w.__test, close() { dom.window.close(); } };
}

async function test(name, body) {
    await body();
    results.push(name);
    console.log('PASS ' + name);
}

const stockHTML = '<div class="SkillActionGrid_skillActionGrid"><div class="SkillAction_skillAction"><span class="SkillAction_name">牛奶</span></div></div>';
const stockItem = count => ({ id: 1, itemHrid: '/items/milk', enhancementLevel: 0, count });
const trialHTML = '<main><div><div><div class="Trials_trialTile"><svg><use href="#trial_hedgehog"></use></svg>刺猬</div><div class="Trials_trialTile" data-trial-hrid="/guild_skilling/milking"><svg><use href="#milking"></use></svg>挤奶</div></div></div></main>';
function configurePlan(f) {
    f.t.state.character = { id: '1', name: 'Tester', gameMode: 'standard' };
    f.t.assignmentState.doc = { t: '2099-01-01T00:00:00Z', k: [0], m: { Tester: [0, 1, 'mage'] }, s: { hedgehog: { mage: { a: 'speed', s1: 'fireball' } } } };
    f.t.assignmentState.cardsPresent = true;
}

try {
    await test('syntax_and_initialization', async () => {
        const version = source.match(/@version\s+(\S+)/)[1];
        assert.equal(version, modified ? '1.1.1' : '1.1.0');
        assert(source.includes("const SCRIPT_VERSION = '" + version + "';"));
        const f = fixture(); try { assert(f.t); assert(f.w.document.getElementById('kunpo-export-ui')); } finally { f.close(); }
    });

    await test('failed_fetch_no_immediate_loop', async () => {
        const f = fixture('<div class="Party_page"></div>');
        try {
            let reads = 0;
            f.t.enableAura();
            f.t.stubNetwork(async () => { reads++; throw Error('fixture failure'); }, () => reads < 5 ? { password: 'p', guild: 'g' } : null);
            f.t.stubAuraSync(() => { void f.t.refreshAuraServerData(); });
            await f.t.refreshAuraServerData();
            await wait(200);
            assert.equal(reads, modified ? 1 : 5);
            console.log('METRIC failed_fetch_attempts_200ms=' + reads);
        } finally { f.close(); }
    });

    await test('retry_backoff_cap_and_reset', async () => {
        if (!modified) { assert(!source.includes('auraServer.failures >= 5')); return; }
        const f = fixture('<div class="Party_page"></div>');
        try {
            let reads = 0, now = 100000;
            const queue = [];
            f.w.Date.now = () => now;
            f.w.setTimeout = (fn, delay) => { queue.push({ fn, delay }); return queue.length; };
            f.w.clearTimeout = () => {};
            f.t.enableAura();
            f.t.stubNetwork(async () => { reads++; throw Error('fixture failure'); }, () => ({ password: 'p', guild: 'g' }));
            await f.t.refreshAuraServerData();
            const delays = [];
            for (let i = 0; i < 4; i++) {
                const timer = queue.shift(); assert(timer); delays.push(timer.delay); now += timer.delay;
                timer.fn(); await wait(0);
            }
            assert.deepEqual(delays, [1000, 2000, 4000, 8000]);
            assert.equal(reads, 5); assert.equal(queue.length, 0);
            await f.t.refreshAuraServerData(); assert.equal(reads, 5);
            f.t.resetAuraServerCache(); await f.t.refreshAuraServerData(); assert.equal(reads, 6);
        } finally { f.close(); }
    });

    await test('successful_fetch_cached_once', async () => {
        const f = fixture(); try {
            let reads = 0, syncs = 0;
            f.t.stubNetwork(async () => { reads++; return { members: [{ name: 'Tester', auras: { speed: 3 } }] }; }, () => ({ password: 'p', guild: 'g' }));
            f.t.stubAuraSync(() => { syncs++; });
            await f.t.refreshAuraServerData(); await wait(10); await f.t.refreshAuraServerData();
            assert.equal(reads, 1); assert.equal(syncs, 1); assert.equal(f.t.auraServer.byName.Tester.auras.speed, 3);
        } finally { f.close(); }
    });

    await test('stock_self_mutation_stops', async () => {
        const f = fixture(stockHTML); try {
            let added = 0;
            const o = new f.w.MutationObserver(records => { for (const r of records) for (const n of r.addedNodes) if (n.classList?.contains('kunpo-stock-overlay')) added++; });
            o.observe(f.w.document.body, { childList: true, subtree: true });
            f.t.setStockNames({ '/items/milk': '牛奶' });
            f.t.mergeStockItems([stockItem(10)]); f.t.startStock(); f.t.renderStock();
            await wait(550); o.disconnect();
            assert(modified ? added === 1 : added >= 3, 'overlay creation count=' + added);
            console.log('METRIC stock_nodes_created_550ms=' + added);
        } finally { f.close(); }
    });

    await test('stock_quantity_change_zero_and_node_reuse', async () => {
        const f = fixture(stockHTML); try {
            f.t.setStockNames({ '/items/milk': '牛奶' }); f.t.mergeStockItems([stockItem(10)]); f.t.renderStock();
            const first = f.w.document.querySelector('.kunpo-stock-overlay'); assert.equal(first.textContent, '10');
            f.t.renderStock(); const second = f.w.document.querySelector('.kunpo-stock-overlay');
            assert.equal(first === second, modified);
            f.t.mergeStockItems([stockItem(25)]); f.t.renderStock(); assert.equal(f.w.document.querySelector('.kunpo-stock-overlay').textContent, '25');
            f.t.mergeStockItems([stockItem(0)]); f.t.renderStock(); assert.equal(f.w.document.querySelector('.kunpo-stock-overlay'), null);
        } finally { f.close(); }
    });

    await test('stock_disabled_aggregation_is_lazy', async () => {
        const f = fixture(stockHTML); try {
            let rebuilds = 0; f.t.watchAggregation(() => rebuilds++);
            f.t.mergeStockItems([stockItem(10)]); f.t.mergeStockItems([stockItem(20)]); f.t.mergeStockItems([stockItem(30)]);
            assert.equal(rebuilds, modified ? 0 : 3);
            console.log('METRIC disabled_stock_aggregations=' + rebuilds);
            f.t.renderStock(); assert.equal(f.t.getStockCounts()['/items/milk'][0], 30);
        } finally { f.close(); }
    });

    await test('stock_feature_stop_cancels_pending_render', async () => {
        const f = fixture(stockHTML); try {
            f.t.setStockNames({ '/items/milk': '牛奶' }); f.t.mergeStockItems([stockItem(10)]);
            f.t.startStock(); f.t.stopStock(); await wait(1200);
            assert.equal(!!f.w.document.querySelector('.kunpo-stock-overlay'), !modified);
        } finally { f.close(); }
    });

    await test('assignment_render_idempotence_and_skill_output', async () => {
        const f = fixture(trialHTML); try {
            configurePlan(f); f.t.stopAssignment();
            f.t.renderAssignment();
            const first = f.w.document.querySelector('.kunpo-assignment-badge');
            const snapshot = f.w.document.querySelector('main').innerHTML;
            f.t.renderAssignment();
            assert.equal(f.w.document.querySelector('main').innerHTML, snapshot);
            assert.equal(first === f.w.document.querySelector('.kunpo-assignment-badge'), modified);
            assert.equal(f.w.document.querySelectorAll('.kunpo-skill-chip').length, 2);
            f.t.assignmentState.doc.s.hedgehog.mage.s1 = 'ice_spear'; f.t.renderAssignment();
            assert(f.w.document.querySelector('.kunpo-skill-panel').innerHTML.includes('ice_spear'));
        } finally { f.close(); }
    });

    await test('assignment_observer_ignores_own_and_chat_changes', async () => {
        const f = fixture(trialHTML + '<aside id="chat"></aside>'); try {
            configurePlan(f); let renders = 0; f.t.watchAssignmentRender(() => renders++);
            f.t.renderAssignment(); await wait(50); renders = 0;
            f.w.document.getElementById('chat').appendChild(f.w.document.createElement('span'));
            await wait(600);
            assert(modified ? renders === 0 : renders >= 1, 'unexpected renders=' + renders);
            console.log('METRIC unrelated_or_self_assignment_renders_600ms=' + renders);
        } finally { f.close(); }
    });

    await test('assignment_mount_and_card_replacement', async () => {
        const f = fixture(); try {
            configurePlan(f); f.t.assignmentState.cardsPresent = false;
            const mount = f.w.document.createElement('div'); mount.innerHTML = trialHTML; f.w.document.body.appendChild(mount);
            await wait(650);
            assert.equal(f.w.document.querySelectorAll('.kunpo-assignment-badge').length, 2);
            const card = f.w.document.querySelector('[class*="trialTile"]');
            const replacement = card.cloneNode(true); replacement.querySelectorAll('.kunpo-assignment-badge').forEach(n => n.remove());
            card.replaceWith(replacement); await wait(400);
            assert(replacement.querySelector('.kunpo-assignment-badge'));
        } finally { f.close(); }
    });

    await test('loadout_cache_invalidation_and_fresh_export', async () => {
        const f = fixture(); try {
            const gs = f.w.JSON.parse(JSON.stringify({ characterSetting: { labyrinthLoadoutMilking: 1 }, characterLoadoutDict: { 1: { id: 1, name: 'Milk', wearableMap: { tool: 'x::x::/items/tool::0' } } }, characterItemMap: { a: { itemHrid: '/items/tool', count: 1, enhancementLevel: 5 } } }));
            f.t.setGameState(gs); let scans = 0; f.t.watchMaxEnhancement(() => scans++);
            f.t.collectLabyrinthLoadouts(); f.t.collectLabyrinthLoadouts(); assert.equal(scans, modified ? 1 : 2);
            console.log('METRIC repeated_loadout_inventory_scans=' + scans);
            gs.characterItemMap.a.enhancementLevel = 7;
            f.t.mergeStockItems([stockItem(10)]);
            assert.equal(f.t.collectLabyrinthLoadouts()[0].loadout.wearableItemMap.tool.enhancementLevel, 7);
            gs.characterItemMap.a.enhancementLevel = 9;
            f.t.state.character = { id: '1', name: 'Tester' };
            assert.equal(f.t.buildPayload().labyrinthLoadouts[0].loadout.wearableItemMap.tool.enhancementLevel, 9);
        } finally { f.close(); }
    });

    await test('export_house_achievement_shrine_parity', async () => {
        const f = fixture(); try {
            f.t.setGameState({ characterHouseRoomDict: { room: { level: 4 } }, characterAchievementMap: { a: true, b: { isCompleted: true }, c: false }, characterGuildBuffDict: { '/guild_buffs/force_skilling': { level: 25 }, '/guild_buffs/force_combat': { level: 10 } } });
            assert.deepEqual(normalize(f.t.collectHouseRoomLevels()), { room: 4 });
            assert.deepEqual(normalize(f.t.collectAchievementCompletion()), { a: true, b: true });
            assert.deepEqual(normalize(f.t.collectShrines()), { '/shrines/force': 20 });
        } finally { f.close(); }
    });

    await test('derived_key_cache_and_crypto_roundtrip', async () => {
        const f = fixture(); try {
            const a = await f.t.deriveKey('fixture-only-password', 'fixture-guild');
            const b = await f.t.deriveKey('fixture-only-password', 'fixture-guild');
            assert.equal(a === b, modified);
            const c = await f.t.deriveKey('other-fixture-password', 'fixture-guild'); assert.notEqual(a, c);
            const input = JSON.stringify({ members: [{ name: '测试', levels: [1, 2] }], plan: { m: {} } });
            const encrypted = await f.t.encryptRecord(input, b); assert.equal(await f.t.decryptRecord(encrypted, b), input);
        } finally { f.close(); }
    });

    await test('upload_merge_preserves_other_members_and_plan', async () => {
        const f = fixture(); try {
            const remote = { guild: 'fixture-guild', plan: { m: { Tester: [0, 1, 'mage'] } }, trials: ['fixture-trial'], members: [
                { id: 0, name: 'Other', levels: [8], custom: 'keep' },
                { id: 7, name: 'Tester', levels: [1], actionTypeBuffs: { fixture: 4 }, achievementsValue: 999 }
            ] };
            const originalRemote = normalize(remote);
            let saved;
            f.t.state.character = { id: '1', name: 'Tester', gameMode: 'standard' };
            f.t.mergeSkills([{ skillHrid: '/skills/milking', level: 90 }]);
            f.t.state.dataReady = true;
            f.t.setGameState({ characterSetting: {}, characterLoadoutDict: {}, characterItemMap: {}, characterHouseRoomDict: { room: { level: 3 } }, characterAchievementMap: { fixture: true }, characterGuildBuffDict: {} });
            f.t.stubUpload(remote, async (_cfg, rec) => { saved = rec; });
            const key = await f.t.deriveKey('fixture-only-password', 'fixture-guild');
            await f.t.uploadLoadoutsToServer(); assert(saved, 'upload should produce encrypted record');
            const result = JSON.parse(await f.t.decryptRecord(saved, key));
            assert.deepEqual(result.members[0], originalRemote.members[0]);
            assert.deepEqual(result.plan, originalRemote.plan); assert.deepEqual(result.trials, originalRemote.trials);
            assert.equal(result.members[1].id, 7); assert.equal(result.members[1].levels[0], 90);
            assert.deepEqual(result.members[1].actionTypeBuffs, { fixture: 4 });
            assert.equal(result.members[1].achievementsValue, undefined);
        } finally { f.close(); }
    });

    await test('json_cache_cross_tab_changes', async () => {
        const f = fixture(); try {
            f.t.writeAuraManual({ Tester: { speed: 3 } });
            let parses = 0; const old = f.w.JSON.parse;
            f.w.JSON.parse = (...a) => { parses++; return old(...a); };
            assert.equal(f.t.readAuraManual().Tester.speed, 3); assert.equal(f.t.readAuraManual().Tester.speed, 3);
            assert.equal(parses, modified ? 1 : 2);
            f.w.localStorage.setItem('kunpo_aura_manual', JSON.stringify({ Tester: { speed: 8 } }));
            assert.equal(f.t.readAuraManual().Tester.speed, 8);
        } finally { f.close(); }
    });

    await test('tooltip_nodes_are_weakly_held', async () => {
        const f = fixture(); try {
            assert.equal(f.t.getTooltipSet().constructor.name, modified ? 'WeakSet' : 'Set');
            const el = f.w.document.createElement('div'); f.t.handleUpgradeTooltip(el); assert(f.t.getTooltipSet().has(el));
        } finally { f.close(); }
    });

    await test('upgrade_tooltip_portal_and_reenable', async () => {
        const f = fixture('<nav class="NavigationBar_navigationBar"></nav>'); try {
            f.t.setBattleGameState({ character: { id: '1' }, battlePlayers: [{ character: { id: '1' }, totalSkillExperienceMap: { '/skills/attack': 1000 } }], combatStartTime: new Date(Date.now() - 3600000).toISOString() });
            f.t.startUpgrade();
            const tip = f.w.document.createElement('div'); tip.className = 'NavigationBar_navigationSkillTooltip';
            tip.innerHTML = '<div class="NavigationBar_name">攻击</div><div></div><div></div><div>3000</div><div class="NavigationBar_info">说明</div>';
            f.w.document.body.appendChild(tip); await wait(50);
            assert(tip.querySelector('.kunpo-upgrade-time-display'));
            assert(tip.textContent.includes('升级所需时间'));
            f.t.stopUpgrade(); assert.equal(tip.querySelector('.kunpo-upgrade-time-display'), null);
            f.t.startUpgrade();
            // Baseline scans only future mutation; optimized also handles an existing tooltip.
            if (!modified) tip.style.color = 'red';
            await wait(50);
            assert(tip.querySelector('.kunpo-upgrade-time-display'));
        } finally { f.close(); }
    });

    await test('inflight_reset_discards_stale_cloud_result', async () => {
        const f = fixture(); try {
            let resolveFetch;
            f.t.stubNetwork(() => new Promise(r => { resolveFetch = r; }), () => ({ password: 'p', guild: 'g' }));
            f.t.stubAuraSync(() => {});
            const pending = f.t.refreshAuraServerData(); await wait(0); f.t.resetAuraServerCache();
            resolveFetch({ members: [{ name: 'stale' }] }); await pending;
            assert.equal(!!f.t.auraServer.byName, !modified);
        } finally { f.close(); }
    });

    await test('stock_container_late_mount_is_observed', async () => {
        const f = fixture(); try {
            f.t.setStockNames({ '/items/milk': '牛奶' }); f.t.mergeStockItems([stockItem(10)]); f.t.startStock();
            const grid = f.w.document.createElement('div'); grid.innerHTML = stockHTML; f.w.document.body.appendChild(grid);
            await wait(350); assert.equal(f.w.document.querySelector('.kunpo-stock-overlay').textContent, '10');
        } finally { f.close(); }
    });

    await test('text_only_life_trial_change_invalidates_render', async () => {
        const f = fixture(trialHTML); try {
            configurePlan(f); f.t.stopAssignment();
            const life = f.w.document.querySelectorAll('[class*="trialTile"]')[1];
            life.removeAttribute('data-trial-hrid'); life.querySelector('svg').remove();
            f.t.renderAssignment(); assert.equal(life.dataset.kunpoAssignment, 'life');
            const text = [...life.childNodes].find(n => n.nodeType === 3); text.textContent = '伐木';
            f.t.renderAssignment(); assert.equal(life.dataset.kunpoAssignment, undefined);
        } finally { f.close(); }
    });

    await test('cn_scroll_events_coalesce_to_one_frame', async () => {
        const f = fixture('', true); try {
            if (!modified) { assert.equal(f.t.scheduleCn, null); return; }
            let calls = 0; f.t.replaceCnPosition(() => calls++);
            for (let i = 0; i < 20; i++) f.t.scheduleCn();
            await wait(40); assert.equal(calls, 1);
        } finally { f.close(); }
    });

    await test('aura_assignment_output_unchanged', async () => {
        const f = fixture(); try {
            const members = [
                { au: { speed: 3, critical: 1 }, lv: { atk: 80, def: 70, mel: 60, rng: 50, mag: 40 }, hr: {} },
                { au: { speed: 1, critical: 5 }, lv: { atk: 90, def: 80, mel: 70, rng: 60, mag: 50 }, hr: {} }
            ];
            const result = normalize(f.t.assignAurasUnique(members, ['speed', 'critical']));
            assert.equal(result.assign.length, 2);
            assert.equal(new Set(result.assign.filter(Boolean)).size, result.assign.filter(Boolean).length);
            // Compare exactly with the unmodified solver in a separate fixture.
            const base = baselineSource;
            const start = base.indexOf('    function assignAurasUnique('), end = base.indexOf('\n    }', start) + 6;
            const ctx = { AURA_STATS: f.w.eval('({})') };
            // Solver itself must remain byte-for-byte unchanged.
            const ownStart = source.indexOf('    function assignAurasUnique('), ownEnd = source.indexOf('\n    }', ownStart) + 6;
            assert.equal(source.slice(ownStart, ownEnd).replace(/\r\n/g, '\n'), base.slice(start, end).replace(/\r\n/g, '\n'));
        } finally { f.close(); }
    });
    assert.equal(networkCalls, 0);
    console.log('LIVE_NETWORK_CALLS=' + networkCalls);
    console.log('SUMMARY mode=' + mode + ' passed=' + results.length + '/' + results.length);
} catch (e) {
    console.error('FAIL ' + e.stack);
    process.exitCode = 1;
}
