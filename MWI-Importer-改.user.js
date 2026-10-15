// ==UserScript==
// @name         MWI-Importer-改配装导出
// @namespace    http://tampermonkey.net/
// @version      2.4.0
// @description  脚本基于Mooneycalc-Importer v5.3，增加了组队模拟功能，使用时请手动查看队友装备以获取数据。https://amvoidguy.github.io/MWICombatSimulatorTest/dist/index.html.
// @match        https://www.milkywayidle.com/*
// @match        https://www.milkywayidlecn.com/*
// @match        https://shykai.github.io/MWICombatSimulatorTest/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      api.textdb.online
// @require      https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js
// @downloadURL https://raw.githubusercontent.com/Chen19970809/MWI_Trial_Calculator/refs/heads/main/MWI-Importer-%E6%94%B9.user.js
// @updateURL https://raw.githubusercontent.com/Chen19970809/MWI_Trial_Calculator/refs/heads/main/MWI-Importer-%E6%94%B9.user.js
// @homepageURL https://github.com/Chen19970809/MWI_Trial_Calculator
// ==/UserScript==


(function () {
    "use strict";
    const userLanguage = navigator.language || navigator.userLanguage;
    const isZH = userLanguage.startsWith("zh");
    let profile_arr = new Array();
    const SCRIPT_SIMULATE_TIME = "24";//模拟时长
    //启动前先把所有队友的装备手动看一遍!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    if (document.URL.includes("milkywayidle.com") || document.URL.includes("milkywayidlecn.com")) {
        hookWS();
        startLoadoutCopyButtonSync();
        hookWSSendCapture();
    } else if (document.URL.includes("mooneycalc")) {
        addImportButton1();
    } else if( document.URL.includes("MWICombatSimulatorTest") || document.URL.includes("localhost")){
        addImportButton4();
        waitSimulationResultsLoading();
    }
    function waitSimulationResultsLoading(){
        const waitForNavi = () => {
            if(document.querySelector(`div.row`)?.querySelectorAll(`div.col-md-5`)?.[2]?.querySelector(`div.row > div.col-md-5`))observeResults();
            else setTimeout(waitSimulationResultsLoading, 200);
        };
        waitForNavi();
    }



    function hookWS() {
        const dataProperty = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data");
        const oriGet = dataProperty.get;

        dataProperty.get = hookedGet;
        Object.defineProperty(MessageEvent.prototype, "data", dataProperty);

        function hookedGet() {
            const socket = this.currentTarget;
            if (!(socket instanceof WebSocket)) {
                return oriGet.call(this);
            }
            if (socket.url.indexOf("api.milkywayidle.com/ws") <= -1 && socket.url.indexOf("api.milkywayidlecn.com/ws") <= -1  && socket.url.indexOf("api-test.milkywayidle.com/ws") <= -1) {

                return oriGet.call(this);
            }

            const message = oriGet.call(this);
            Object.defineProperty(this, "data", { value: message }); // Anti-loop

            return handleMessage(message);
        }
    }

    // 捕获游戏 WebSocket 连接，供《导入模拟器数据》主动发送配装槽位更新使用
    let gameSocket = null;
    function hookWSSendCapture() {
        const origSend = WebSocket.prototype.send;
        WebSocket.prototype.send = function (data) {
            try {
                if (!gameSocket && this && this.url
                    && (this.url.indexOf("api.milkywayidle.com/ws") > -1
                        || this.url.indexOf("api.milkywayidlecn.com/ws") > -1
                        || this.url.indexOf("api-test.milkywayidle.com/ws") > -1)) {
                    gameSocket = this;
                }
            } catch (e) {}
            return origSend.call(this, data);
        };
    }

    let current_team_battle = "";
    function handleMessage(message) {
        let obj = JSON.parse(message);
        //const keys = GM_listValues();
        //console.log('keys',keys);
        // keys.forEach(key => { GM_deleteValue(key); });
        if (obj && obj.type === "init_character_data") {

            if(GM_getValue("profile_arr"))
            {
                profile_arr = GM_getValue("profile_arr");
            }

            if(!profile_arr.includes(obj.character.name)){
                profile_arr.push(obj.character.name);
            }

            // profile_arr.reverse();
            // console.log("profileArr",profile_arr);
            GM_setValue("profile_arr", profile_arr);
            GM_setValue("profile_" + obj.character.name, message);
            GM_setValue("init_character_data",message);

            // 不进战斗也预写一份 team_battle_ 最小快照：
            // constructImportJsonObj_team 只读 players 名单，装备/等级等实际数据仍取自 profile_xxx；
            // 真实进入战斗后会被 new_battle 的完整消息覆盖
            let tb_players = [];
            if (obj.partyInfo && obj.partyInfo.partySlotMap) {
                Object.values(obj.partyInfo.partySlotMap).forEach((slot) => {
                    if (slot && slot.characterID && obj.partyInfo.sharableCharacterMap && obj.partyInfo.sharableCharacterMap[slot.characterID]) {
                        tb_players.push({ character: { name: obj.partyInfo.sharableCharacterMap[slot.characterID].name } });
                    }
                });
            }
            if (tb_players.length === 0) {
                tb_players = [{ character: { name: obj.character.name } }];
            }
            let tb_snapshot = JSON.stringify({ type: "new_battle", combatStartTime: Date.now(), players: tb_players });
            GM_setValue("team_battle_" + obj.character.name, tb_snapshot);
            if (tb_players[0].character.name !== obj.character.name) {
                GM_setValue("team_battle_" + tb_players[0].character.name, tb_snapshot);
            }
            const init_client_data = JSON.parse(LZString.decompressFromUTF16(localStorage.getItem('initClientData')));
            if(init_client_data) {
                GM_setValue("initData_levelExperienceTable", init_client_data.levelExperienceTable);
                GM_setValue("initData_abilityDetailMap", init_client_data.abilityDetailMap);
            }

        }else if (obj && obj.type === "new_battle"){
            let newBattleHandler = [];
            obj.players.forEach((player) => {
                newBattleHandler.push(player.name);
            });

            // console.log("new_battle",newBattleHandler);

            //以防万一 留一个旧的team battle
            current_team_battle = message;

            GM_setValue("team_battle_" + newBattleHandler[0], message);
        }else if (obj && obj.type === "profile_shared"){
            GM_setValue(obj.profile.sharableCharacter.name, message);
            // 若之前点开过配装，把缓存的 loadout 战斗字段合并回存档
            let cachedLo = GM_getValue("loadout_cache_" + obj.profile.sharableCharacter.name);
            if (cachedLo) {
                mergeLoadoutIntoProfile(obj.profile.sharableCharacter.name, JSON.parse(cachedLo));
            }
            get_sim_json(obj);
        }else if (obj && obj.type === "loadout_shared"){
            // 点开队友配装面板时收到：只处理战斗配装（避免其它动作类型的空配装覆盖战斗数据），
            // 缓存原始 loadout，并把战斗字段覆盖进队友存档
            let lo = obj.loadout;
            if (lo && lo.actionTypeHrid === "/action_types/combat" && lo.sharableCharacter && lo.sharableCharacter.name) {
                GM_setValue("loadout_cache_" + lo.sharableCharacter.name, JSON.stringify(lo));
                mergeLoadoutIntoProfile(lo.sharableCharacter.name, lo);
            }
        }
        return message;
    }

    // 把 loadout_shared 的战斗相关字段（装备/技能书/食物咖啡/trigger）覆盖进队友存档
    // 存档底子是 profile_shared（含技能等级/房屋/成就等）；还没收到 profile_shared 时补默认骨架
    function mergeLoadoutIntoProfile(name, lo) {
        let baseProfile = null;
        let existing = GM_getValue(name);
        if (existing) {
            try { baseProfile = JSON.parse(existing).profile || null; } catch (e) { baseProfile = null; }
        }
        if (!baseProfile) {
            baseProfile = {};
        }
        // 装备槽：loadout_shared 可能用对象或序列化字符串两种格式，统一转成导入函数需要的对象格式
        let normalizedWearable = {};
        if (lo.wearableItemMap && Object.keys(lo.wearableItemMap).length > 0) {
            for (const k of Object.keys(lo.wearableItemMap)) {
                let v = lo.wearableItemMap[k];
                if (typeof v === "string") {
                    // "id::/item_locations/xxx::/items/yyy::强化等级"
                    let parts = v.split("::");
                    normalizedWearable[k] = { itemLocationHrid: k, itemHrid: parts[2], enhancementLevel: Number(parts[3]) || 0 };
                } else if (v && v.itemHrid) {
                    normalizedWearable[k] = v;
                }
            }
        }
        // 技能书槽：loadout_shared 字段名为 equipmentAbilities，导入函数读 equippedAbilities；
        // 过滤空槽位（abilityHrid 为空会让导入时 initData_abilityDetailMap 查表抛错）
        let loAbilities = (lo.equippedAbilities ?? lo.equipmentAbilities) || [];
        loAbilities = loAbilities.filter(a => a && a.abilityHrid);
        let merged = Object.assign({}, baseProfile, {
            // loadout_shared 优先覆盖的战斗字段（字段为空/空对象时不回退覆盖底档）
            wearableItemMap: Object.keys(normalizedWearable).length > 0 ? normalizedWearable : (baseProfile.wearableItemMap ?? {}),
            combatConsumables: Array.isArray(lo.combatConsumables) ? lo.combatConsumables : (baseProfile.combatConsumables ?? []),
            equippedAbilities: loAbilities.length > 0 ? loAbilities : (baseProfile.equippedAbilities ?? []),
            abilityCombatTriggersMap: (lo.abilityCombatTriggersMap && Object.keys(lo.abilityCombatTriggersMap).length > 0) ? lo.abilityCombatTriggersMap : (baseProfile.abilityCombatTriggersMap ?? {}),
            consumableCombatTriggersMap: (lo.consumableCombatTriggersMap && Object.keys(lo.consumableCombatTriggersMap).length > 0) ? lo.consumableCombatTriggersMap : (baseProfile.consumableCombatTriggersMap ?? {}),
            // loadout_shared 不含这些字段，缺失时补空，避免 constructPlayerExportObjFromProfile 抛错
            characterSkills: baseProfile.characterSkills ?? [],
            characterHouseRoomMap: baseProfile.characterHouseRoomMap ?? {},
            characterAchievements: baseProfile.characterAchievements ?? [],
            guildBuffLevelMap: baseProfile.guildBuffLevelMap ?? {},
        });
        GM_setValue(name, JSON.stringify({ type: "profile_shared", profile: merged }));
    }


    function constructLoadoutDatasFromPlayerInfo(playerInfo) {
        let initData_abilityDetailMap = GM_getValue("initData_abilityDetailMap");

        let loadoutDatas = {};
        for (const loadout of Object.values(playerInfo.characterLoadoutMap)) {
            if (loadout.actionTypeHrid != "/action_types/combat") {
                continue;
            }

            const playerObj = {};
            playerObj.player = {};

            // Levels
            for (const skill of playerInfo.characterSkills) {
                if (skill.skillHrid.includes("stamina")) {
                    playerObj.player.staminaLevel = skill.level;
                } else if (skill.skillHrid.includes("intelligence")) {
                    playerObj.player.intelligenceLevel = skill.level;
                } else if (skill.skillHrid.includes("attack")) {
                    playerObj.player.attackLevel = skill.level;
                } else if (skill.skillHrid.includes("melee")) {
                    playerObj.player.meleeLevel = skill.level;
                } else if (skill.skillHrid.includes("defense")) {
                    playerObj.player.defenseLevel = skill.level;
                } else if (skill.skillHrid.includes("ranged")) {
                    playerObj.player.rangedLevel = skill.level;
                } else if (skill.skillHrid.includes("magic")) {
                    playerObj.player.magicLevel = skill.level;
                }
            }

            // Items
            playerObj.player.equipment = [];
            for (const key in loadout.wearableMap) {
                const itemData = loadout.wearableMap[key]; // "92842::/item_locations/inventory::/items/chimerical_quiver_refined::5"
                if (itemData == "") {
                    continue;
                }
                const itemHrid = itemData.split("::")[2];

                let enhancementLevel = 0;
                for (const item of playerInfo.characterItems) {
                    if (item.itemHrid == itemHrid && item.enhancementLevel > enhancementLevel) {
                        enhancementLevel = item.enhancementLevel;
                    }
                }
                playerObj.player.equipment.push({
                    itemLocationHrid: key,
                    itemHrid: itemHrid,
                    enhancementLevel: enhancementLevel,
                });
            }

            // Food
            playerObj.food = {};
            playerObj.food["/action_types/combat"] = loadout.foodItemHrids;

            // Drinks
            playerObj.drinks = {};
            playerObj.drinks["/action_types/combat"] = loadout.drinkItemHrids;

            // Abilities
            playerObj.abilities = [
                {
                    abilityHrid: "",
                    level: "1",
                },
                {
                    abilityHrid: "",
                    level: "1",
                },
                {
                    abilityHrid: "",
                    level: "1",
                },
                {
                    abilityHrid: "",
                    level: "1",
                },
                {
                    abilityHrid: "",
                    level: "1",
                },
            ];
            let normalAbillityIndex = 1;
            for (const abilityHrid of Object.values(loadout.abilityMap)) {
                let abilityLevel = 0;
                for (const ability of playerInfo.characterAbilities) {
                    if (ability.abilityHrid === abilityHrid) {
                        abilityLevel = ability.level;
                        break;
                    }
                }

                if (initData_abilityDetailMap[abilityHrid].isSpecialAbility) {
                    playerObj.abilities[0] = {
                        abilityHrid: abilityHrid,
                        level: abilityLevel,
                    };
                } else {
                    playerObj.abilities[normalAbillityIndex++] = {
                        abilityHrid: abilityHrid,
                        level: abilityLevel,
                    };
                }
            }

            // TriggerMap
            playerObj.triggerMap = { ...loadout.abilityCombatTriggersMap, ...loadout.consumableCombatTriggersMap };

            // HouseRooms
            playerObj.houseRooms = {};
            for (const house of Object.values(playerInfo.characterHouseRoomMap)) {
                playerObj.houseRooms[house.houseRoomHrid] = house.level;
            }

            // Achievements
            playerObj.achievements = {};
            for (const achievement of Object.values(playerInfo.characterAchievements)) {
                playerObj.achievements[achievement.achievementHrid] = achievement.isCompleted;
            }

            // GuildBuffs
            playerObj.guildBuffs = {};
            for (const guildBuff of Object.values(playerInfo.characterGuildBuffMap)) {
                playerObj.guildBuffs[guildBuff.guildBuffHrid] = guildBuff.level;
            }

            // Labyrinth
            playerObj.labyrinth = {};
            const labyrinthUpgradeKeys = ["labyrinthCombatDamageLevel", "labyrinthAttackSpeedLevel", "labyrinthCastSpeedLevel", "labyrinthCriticalRateLevel", "labyrinthExperienceLevel"];
            for (const labyrinthUpgrade of labyrinthUpgradeKeys) {
                let level = playerInfo.characterInfo[labyrinthUpgrade] ?? 0;
                playerObj.labyrinth[labyrinthUpgrade] = level;
            }

            const loadName = playerInfo.character.name +"-loadout-"+ loadout.name;
            loadoutDatas[loadName] = playerObj;
            console.log(loadName, playerObj);
        }
        return loadoutDatas;
    }

    function convertDataToEquipmentSetsFormat(loadoutData) {
        let equipmentSet = {
            levels: {},
            equipment: {},
            food: {},
            drinks: {},
            abilities: {},
            triggerMap: {},
            houseRooms: {},
            achievements: {},
            labyrinth: {},
            guildBuffs:{},
        };

        for (const key of Object.keys(loadoutData.player)) {
            if (!key.includes("Level")) {
                continue;
            }
            equipmentSet.levels[key.replace("Level", "")] = loadoutData.player[key];
        }

        for (const item of loadoutData.player.equipment) {
            let type = item.itemLocationHrid.replace("/item_locations/", "");
            if (type == "two_hand" || type == "main_hand") {
                type = "weapon";
            }

            equipmentSet.equipment[type] = {
                equipment: item.itemHrid,
                enhancementLevel: item.enhancementLevel,
            };
        }

        equipmentSet.food = loadoutData.food['/action_types/combat'];
        equipmentSet.drinks = loadoutData.drinks['/action_types/combat'];

        for (let i = 0; i < 5; i++) {
            equipmentSet.abilities[i] = {
                ability: loadoutData.abilities[i].abilityHrid,
                level: Number(loadoutData.abilities[i].level),
            };
        }

        equipmentSet.triggerMap = loadoutData.triggerMap;

        equipmentSet.houseRooms = loadoutData.houseRooms;
        equipmentSet.achievements = loadoutData.achievements;
        equipmentSet.labyrinth = loadoutData.labyrinth;
        equipmentSet.guildBuffs = loadoutData.guildBuffs;

        return equipmentSet;
    }

    function saveLoadoutDatasIntoEquipmentSets(loadoutDatas) {
        let equipmentSets = JSON.parse(localStorage.getItem("equipmentSets")) ?? {};

        for (const loadName of Object.keys(loadoutDatas)) {
            equipmentSets[loadName] = convertDataToEquipmentSetsFormat(loadoutDatas[loadName]);
        }

        localStorage.setItem("equipmentSets", JSON.stringify(equipmentSets));
    }

    function constructSelfPlayerExportObjFromInitCharacterData(initObj) {
        let obj = initObj || JSON.parse(GM_getValue("init_character_data"));

        let initData_abilityDetailMap = GM_getValue("initData_abilityDetailMap");

        const playerObj = {};
        playerObj.player = {};

        // Levels
        for (const skill of obj.characterSkills) {
            if (skill.skillHrid.includes("stamina")) {
                playerObj.player.staminaLevel = skill.level;
            } else if (skill.skillHrid.includes("intelligence")) {
                playerObj.player.intelligenceLevel = skill.level;
            } else if (skill.skillHrid.includes("attack")) {
                playerObj.player.attackLevel = skill.level;
            } else if (skill.skillHrid.includes("melee")) {
                playerObj.player.meleeLevel = skill.level;
            } else if (skill.skillHrid.includes("defense")) {
                playerObj.player.defenseLevel = skill.level;
            } else if (skill.skillHrid.includes("ranged")) {
                playerObj.player.rangedLevel = skill.level;
            } else if (skill.skillHrid.includes("magic")) {
                playerObj.player.magicLevel = skill.level;
            }
        }

        // Items
        playerObj.player.equipment = [];
        for (const item of obj.characterItems) {
            if (!item.itemLocationHrid.includes("/item_locations/inventory")) {
                playerObj.player.equipment.push({
                    itemLocationHrid: item.itemLocationHrid,
                    itemHrid: item.itemHrid,
                    enhancementLevel: item.enhancementLevel,
                });
            }
        }

        // Food
        playerObj.food = {};
        playerObj.food["/action_types/combat"] = [];
        for (const food of obj.actionTypeFoodSlotsMap["/action_types/combat"]) {
            if (food) {
                playerObj.food["/action_types/combat"].push({
                    itemHrid: food.itemHrid,
                });
            } else {
                playerObj.food["/action_types/combat"].push({
                    itemHrid: "",
                });
            }
        }

        // Drinks
        playerObj.drinks = {};
        playerObj.drinks["/action_types/combat"] = [];
        for (const drink of obj.actionTypeDrinkSlotsMap["/action_types/combat"]) {
            if (drink) {
                playerObj.drinks["/action_types/combat"].push({
                    itemHrid: drink.itemHrid,
                });
            } else {
                playerObj.drinks["/action_types/combat"].push({
                    itemHrid: "",
                });
            }
        }

        // Abilities
        playerObj.abilities = [
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
        ];
        let normalAbillityIndex = 1;
        for (const ability of obj.combatUnit.combatAbilities) {
            if (ability && initData_abilityDetailMap[ability.abilityHrid].isSpecialAbility) {
                playerObj.abilities[0] = {
                    abilityHrid: ability.abilityHrid,
                    level: ability.level,
                };
            } else if (ability) {
                playerObj.abilities[normalAbillityIndex++] = {
                    abilityHrid: ability.abilityHrid,
                    level: ability.level,
                };
            }
        }



        // TriggerMap
        playerObj.triggerMap = { ...obj.abilityCombatTriggersMap, ...obj.consumableCombatTriggersMap };

        // HouseRooms
        playerObj.houseRooms = {};
        for (const house of Object.values(obj.characterHouseRoomMap)) {
            playerObj.houseRooms[house.houseRoomHrid] = house.level;
        }

        // Achievements
        playerObj.achievements = {};
        for (const achievement of Object.values(obj.characterAchievements)) {
            playerObj.achievements[achievement.achievementHrid] = achievement.isCompleted;
        }

        // GuildBuffs
        playerObj.guildBuffs = {};
        for (const guildBuff of Object.values(obj.characterGuildBuffMap)) {
            playerObj.guildBuffs[guildBuff.guildBuffHrid] = guildBuff.level;
        }

        // Labyrinth
        playerObj.labyrinth = {};
        const labyrinthUpgradeKeys = ["labyrinthCombatDamageLevel", "labyrinthAttackSpeedLevel", "labyrinthCastSpeedLevel", "labyrinthCriticalRateLevel", "labyrinthExperienceLevel"];
        for (const labyrinthUpgrade of labyrinthUpgradeKeys) {
            let level = obj.characterInfo[labyrinthUpgrade] ?? 0;
            playerObj.labyrinth[labyrinthUpgrade] = level;
        }

        return playerObj;
    }

    function setupDefaultCombatConsumablesByWeapon(playerObj, weapon) {
        if (!weapon) {
            return;
        }

        if (weapon.includes("shooter") || weapon.includes("bow")) {
            // 远程
            // xp,超远,暴击
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/wisdom_coffee",
            });
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/super_ranged_coffee",
            });
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/critical_coffee",
            });
            // 2红1蓝
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/spaceberry_donut",
            });
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/spaceberry_cake",
            });
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/star_fruit_yogurt",
            });
        } else if (weapon.includes("boomstick") || weapon.includes("staff") || weapon.includes("trident")) {
            // 法师
            // xp,超魔,吟唱
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/wisdom_coffee",
            });
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/super_magic_coffee",
            });
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/channeling_coffee",
            });
            // 1红2蓝
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/spaceberry_cake",
            });
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/star_fruit_gummy",
            });
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/star_fruit_yogurt",
            });
        } else if (weapon.includes("bulwark")) {
            // 双手盾 精暮光
            // xp,超防,超耐
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/wisdom_coffee",
            });
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/super_defense_coffee",
            });
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/super_stamina_coffee",
            });
            // 2红1蓝
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/spaceberry_donut",
            });
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/spaceberry_cake",
            });
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/star_fruit_yogurt",
            });
        } else {
            // 战士
            // xp,超力,迅捷
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/wisdom_coffee",
            });
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/super_melee_coffee",
            });
            playerObj.drinks["/action_types/combat"].push({
                itemHrid: "/items/swiftness_coffee",
            });
            // 2红1蓝
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/spaceberry_donut",
            });
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/spaceberry_cake",
            });
            playerObj.food["/action_types/combat"].push({
                itemHrid: "/items/star_fruit_yogurt",
            });
        }
    }

    function constructPlayerExportObjFromProfile(profile) {
        let initData_abilityDetailMap = GM_getValue("initData_abilityDetailMap");

        const playerObj = {};
        playerObj.player = {};

        // Levels
        for (const skill of profile.profile.characterSkills) {
            if (skill.skillHrid.includes("stamina")) {
                playerObj.player.staminaLevel = skill.level;
            } else if (skill.skillHrid.includes("intelligence")) {
                playerObj.player.intelligenceLevel = skill.level;
            } else if (skill.skillHrid.includes("attack")) {
                playerObj.player.attackLevel = skill.level;
            } else if (skill.skillHrid.includes("melee")) {
                playerObj.player.meleeLevel = skill.level;
            } else if (skill.skillHrid.includes("defense")) {
                playerObj.player.defenseLevel = skill.level;
            } else if (skill.skillHrid.includes("ranged")) {
                playerObj.player.rangedLevel = skill.level;
            } else if (skill.skillHrid.includes("magic")) {
                playerObj.player.magicLevel = skill.level;
            }
        }

        // Items
        playerObj.player.equipment = [];
        if (profile.profile.wearableItemMap) {
            for (const key in profile.profile.wearableItemMap) {
                const item = profile.profile.wearableItemMap[key];
                playerObj.player.equipment.push({
                    itemLocationHrid: item.itemLocationHrid,
                    itemHrid: item.itemHrid,
                    enhancementLevel: item.enhancementLevel,
                });
            }
        }

        // Food and drinks
        playerObj.food = {};
        playerObj.food["/action_types/combat"] = [];
        playerObj.drinks = {};
        playerObj.drinks["/action_types/combat"] = [];

        if (profile.profile?.combatConsumables) {
            for (const foodOrDrink of profile.profile.combatConsumables) {
                if (foodOrDrink.itemHrid.includes("coffee")) {
                    playerObj.drinks["/action_types/combat"].push({
                        itemHrid: foodOrDrink.itemHrid,
                    });
                } else {
                    playerObj.food["/action_types/combat"].push({
                        itemHrid: foodOrDrink.itemHrid,
                    });
                }
            }
        } else {
            // Assume food and drinks based on equipted weapon
            const weapon =
                profile.profile.wearableItemMap &&
                (profile.profile.wearableItemMap["/item_locations/main_hand"]?.itemHrid ||
                    profile.profile.wearableItemMap["/item_locations/two_hand"]?.itemHrid);
            setupDefaultCombatConsumablesByWeapon(playerObj, weapon);
        }

        // Abilities
        playerObj.abilities = [
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
            {
                abilityHrid: "",
                level: "1",
            },
        ];
        if (profile.profile.equippedAbilities) {
            let normalAbillityIndex = 1;
            for (const ability of profile.profile.equippedAbilities) {
                if (ability && initData_abilityDetailMap[ability.abilityHrid].isSpecialAbility) {
                    playerObj.abilities[0] = {
                        abilityHrid: ability.abilityHrid,
                        level: ability.level,
                    };
                } else if (ability) {
                    playerObj.abilities[normalAbillityIndex++] = {
                        abilityHrid: ability.abilityHrid,
                        level: ability.level,
                    };
                }
            }
        }

        // TriggerMap
        if (profile.profile.abilityCombatTriggersMap && profile.profile.consumableCombatTriggersMap) {
            playerObj.triggerMap = { ...profile.profile.abilityCombatTriggersMap, ...profile.profile.consumableCombatTriggersMap };
        }

        // HouseRooms
        playerObj.houseRooms = {};
        for (const house of Object.values(profile.profile.characterHouseRoomMap)) {
            playerObj.houseRooms[house.houseRoomHrid] = house.level;
        }

        // Achievements
        playerObj.achievements = {};
        for (const achievement of Object.values(profile.profile.characterAchievements)) {
            playerObj.achievements[achievement.achievementHrid] = achievement.isCompleted;
        }

        // GuildBuffs
        playerObj.guildBuffs = profile.profile.guildBuffLevelMap ?? {};

        return playerObj;
    }

    function get_sim_json(obj) {
        const checkElem = () => {
            const selectedElement = document.querySelector(`div.SharableProfile_overviewTab__W4dCV`);
            if (selectedElement) {
                clearInterval(timer);
                //获取模拟数据
                let exportObj = constructPlayerExportObjFromProfile(obj);

                let sim_json_value=JSON.stringify(exportObj);
                //按钮粘贴
                let button = document.createElement("button");
                selectedElement.appendChild(button);
                button.textContent = "获取模拟器导入数据";
                button.style.borderRadius = '5px';
                button.style.height = '30px';
                button.style.backgroundColor = '#4357AF';
                button.style.color = 'white';
                button.style.boxShadow = 'none';
                button.style.border = '0px';
                button.onclick = function () {
                    navigator.clipboard.writeText(sim_json_value);
                    button.textContent = "导入数据已粘贴到剪切板";
                    return false;
                };
                return false;
            };
        };
        let timer = setInterval(checkElem, 200);
    }

    function addImportButton1() {
        const checkElem = () => {
            const selectedElement = document.querySelector(`div[role="tablist"]`);
            if (selectedElement) {
                clearInterval(timer);
                console.log("Mooneycalc-Importer: Found elem");
                let button = document.createElement("button");
                selectedElement.parentNode.insertBefore(button, selectedElement.nextSibling);
                button.textContent = isZH
                    ? "导入人物数据 (左边的市场里可以改价差,设置里可启用茶)"
                : "Import character settings (Refresh game page to update character settings)";
                button.style.backgroundColor = "green";
                button.style.padding = "5px";
                button.onclick = function () {
                    console.log("Mooneycalc-Importer: Button onclick");
                    importData1(button);
                    return false;
                };
            }
        };
        let timer = setInterval(checkElem, 200);
    }

    async function importData1(button) {
        let data = GM_getValue("init_character_data");
        let obj = null;
        try { obj = JSON.parse(data); } catch (e) {
            // 数据缺失或损坏时按无数据处理，走下方按钮错误提示
        }

        if (!obj || !obj.characterSkills || !obj.currentTimestamp) {
            button.textContent = isZH ? "错误：没有人物数据" : "Error: no character settings found";
            button.textContent += "init_character_data";
            return;
        }

        let ls = constructMooneycalcLocalStorage(obj);
        localStorage.setItem("settings", ls);

        let timestamp = new Date(obj.currentTimestamp).getTime();
        let now = new Date().getTime();
        button.textContent = isZH
            ? "已导入，人物数据更新时间：" + timeReadable(now - timestamp) + " 前"
        : "Imported, updated " + timeReadable(now - timestamp) + " ago";

        await new Promise((r) => setTimeout(r, 500));
        location.reload();
    }

    function constructMooneycalcLocalStorage(obj) {
        const ls = localStorage.getItem("settings");
        let lsObj = JSON.parse(ls);

        if (!lsObj) {
            lsObj = {};
        }

        // 人物技能等级
        lsObj.state.settings.levels = {};
        for (const skill of obj.characterSkills) {
            lsObj.state.settings.levels[skill.skillHrid] = skill.level;
        }

        // 社区全局buff
        lsObj.state.settings.communityBuffs = {};
        for (const buff of obj.communityBuffs) {
            lsObj.state.settings.communityBuffs[buff.hrid] = buff.level;
        }

        // 装备 & 装备强化等级
        lsObj.state.settings.equipment = {};
        lsObj.state.settings.equipmentLevels = {};
        for (const item of obj.characterItems) {
            lsObj.state.settings.equipment[item.itemLocationHrid.replace("item_locations", "equipment_types")] = item.itemHrid;
            lsObj.state.settings.equipmentLevels[item.itemLocationHrid.replace("item_locations", "equipment_types")] = item.enhancementLevel;
        }

        // 房子
        lsObj.state.settings.houseRooms = {};
        for (const house of Object.values(obj.characterHouseRoomMap)) {
            lsObj.state.settings.houseRooms[house.houseRoomHrid] = house.level;
        }

        return JSON.stringify(lsObj);
    }

    function timeReadable(ms) {
        const d = new Date(1000 * Math.round(ms / 1000));
        function pad(i) {
            return ("0" + i).slice(-2);
        }
        let str = d.getUTCHours() + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds());
        console.log("Mooneycalc-Importer: " + str);
        return str;
    }

    function addImportButton4() {
        const checkElem = () => {
            const selectedElement = document.querySelector(`button#buttonImportExport`);
            if (selectedElement) {
                clearInterval(timer);
                console.log("Mooneycalc-Importer: Found elem");
                let profileArr = GM_getValue("profile_arr");

                generateComboList(profileArr);

                let button = document.createElement("button");
                selectedElement.parentNode.parentElement.parentElement.insertBefore(button, selectedElement.parentElement.parentElement.nextSibling);
                button.textContent = isZH
                    ? "导入人物数据(刷新游戏网页更新人物数据)"
                : "Import character settings (Refresh game page to update character settings)";
                button.style.backgroundColor = "green";
                button.style.padding = "5px";
                button.onclick = function () {
                    const getPriceButton = document.querySelector(`button#buttonGetPrices`);
                    if (getPriceButton) {
                        console.log("Click getPriceButton");
                        getPriceButton.click();
                    }

                    let checkedProfile = getSelectedValue()

                    importCombatSimData(button,checkedProfile);
                    return false;
                };

                let button2 = document.createElement("button");
                selectedElement.parentNode.parentElement.parentElement.insertBefore(button2, selectedElement.parentElement.parentElement.nextSibling);
                button2.textContent = isZH
                    ? "导入配装数据至装备方案(刷新游戏网页更新配装数据)"
                : "Import loadout settings (Refresh game page to update loadout settings)";
                button2.style.backgroundColor = "green";
                button2.style.padding = "5px";
                button2.onclick = function () {
                    const getPriceButton = document.querySelector(`button#buttonGetPrices`);
                    if (getPriceButton) {
                        console.log("Click getPriceButton");
                        getPriceButton.click();
                    }

                    let checkedProfile = getSelectedValue()

                    importLoadoutsData(button2,checkedProfile);
                    return false;
                };

                let button3 = document.createElement("button");
                button3.textContent = isZH ? "导出队伍中单人数据" : "Export a member's data";
                button3.style.backgroundColor = "green";
                button3.style.padding = "5px";
                button3.onclick = function () {
                    exportSingleTeamMemberData();
                    return false;
                };
                button.after(button3);
            }
        };
        let timer = setInterval(checkElem, 200);
    }

    function getSelectedValue() {
        let select = document.getElementById("profile-combo-container");
        let selectedValue = select.value;
        return selectedValue;
    }

    async function importCombatSimData(button,checkedProfile) {
        let profileRaw = GM_getValue("profile_"+ checkedProfile);
        let playerInfo = null;
        try { playerInfo = JSON.parse(profileRaw); } catch (e) {
            // 存档缺失或损坏时按无数据处理，走下方按钮错误提示
        }
        if (!playerInfo) {
            button.textContent = isZH ? "错误：没有人物数据" : "Error: no character settings found";
            button.textContent += " profile_" + checkedProfile;
            return;
        }

        let playerArr = [];
        if ( playerInfo.partyInfo ) {
            Object.values(playerInfo.partyInfo.partySlotMap).forEach((value,key) => { if (value.characterID) playerArr.push(playerInfo.partyInfo.sharableCharacterMap[value.characterID].name); });
        }else{
            playerArr.push(playerInfo.character.name)
        }

        let data = GM_getValue("team_battle_" + playerArr[0], "");

        let obj
        if (!data) {
            button.textContent = isZH ? "错误：没有人物数据" : "Error: no character settings found";
            button.textContent += " team_battle_" + playerArr[0];
            return;
        }else{
            obj = JSON.parse(data);
        }

        const jsonObj = constructImportJsonObj_team(obj,checkedProfile);

        for(let i=1;i<=jsonObj.player_number;i++){
            const importInputElem = document.querySelector(`input#inputSetGroupCombatplayer`+i);
            importInputElem.value = JSON.stringify(jsonObj.players[i-1]);

            document.querySelector(`a#player${i}-tab`).textContent = playerArr[i-1];
        }
        document.querySelector(`button#buttonImportSet`).click();

        let timestamp = new Date(obj.combatStartTime).getTime();
        let now = new Date().getTime();
        button.textContent = isZH
            ? "已导入，人物数据更新时间：" + timeReadable(now - timestamp) + " 前"
        : "Character Imported, updated " + timeReadable(now - timestamp) + " ago";
    }

    async function importLoadoutsData(button,checkedProfile) {
        let playerInfo = JSON.parse(GM_getValue("profile_"+ checkedProfile));

        let loadoutDatas = constructLoadoutDatasFromPlayerInfo(playerInfo);

        saveLoadoutDatasIntoEquipmentSets(loadoutDatas);

        if (!loadoutDatas) {
            button.textContent = isZH ? "错误：没有配装数据" : "Error: no loadout settings found";
            button.textContent += " loadout_" + playerArr[0];
            return;
        }else{
            let timestamp = new Date(playerInfo.currentTimestamp).getTime();
            let now = new Date().getTime();
            button.textContent = isZH
                ? "已导入，配装数据更新时间：" + timeReadable(now - timestamp) + " 前"
            : "Loadout Imported, updated " + timeReadable(now - timestamp) + " ago";
        }
    }

    function generateComboList(profileArr) {
        const container = document.getElementById("profile-combo-container");
        if (!container) return;

        if (profileArr.length <= 0) return;
        profileArr.forEach(item => {

            let option = document.createElement("option");
            option.value = item;
            let labelText = item;
            let profile = GM_getValue("profile_"+ item);
            if (!profile) return;
            let playerInfo = JSON.parse(profile);
            let partyMember = [];

            if ( playerInfo?.partyInfo?.partySlotMap ){
                labelText += " Party:";
                Object.values(playerInfo.partyInfo.partySlotMap).forEach((value,key) => { if (value.characterID) partyMember.push(playerInfo.partyInfo.sharableCharacterMap[value.characterID].name); });
                labelText += partyMember.join(", ");
            }

            option.textContent = labelText;
            container.appendChild(option);
        })
    }


    function constructImportJsonObj_team(obj,checkedProfile) {
        let init_character_obj = JSON.parse(GM_getValue("profile_"+ checkedProfile));
        // 当前登录角色的名字（无合并存档时回退登录快照用）
        let loggedInName = "";
        try {
            let initRaw = GM_getValue("init_character_data");
            if (initRaw) loggedInName = JSON.parse(initRaw).character.name;
        } catch (e) {}
        let exportObj = {};

        exportObj.player_number=obj.players.length;
        exportObj.players = {};

        //看一圈所有人配置
        for(let player_num=0;player_num<obj.players.length;player_num++ ){
            // Levels
            exportObj.players[player_num]={};
            exportObj.players[player_num].player={};
            // Items
            // HouseRooms
            exportObj.players[player_num].player.equipment = [];
            exportObj.players[player_num].houseRooms = {};
            let mateName = obj.players[player_num].character.name;
            let team_mate_str = GM_getValue(mateName, "")
            let team_mate_obj = null;
            if (team_mate_str) {
                try { team_mate_obj = JSON.parse(team_mate_str); } catch (e) { team_mate_obj = null; }
            }
            let mateWearable = team_mate_obj?.profile?.wearableItemMap;
            let hasEquip = mateWearable && Object.keys(mateWearable).length > 0;
            if (team_mate_obj && hasEquip) {
                // 统一数据源：点开配装合并出的存档
                // 存档缺技能/房屋等底档字段且该角色有登录快照时，用快照补齐
                if (!(team_mate_obj.profile.characterSkills || []).length) {
                    let snap = null;
                    if (mateName == loggedInName) {
                        try { snap = JSON.parse(GM_getValue("init_character_data")); } catch (e) {}
                    } else if (mateName == init_character_obj.character.name) {
                        snap = init_character_obj;
                    }
                    if (snap) {
                        team_mate_obj.profile.characterSkills = snap.characterSkills || [];
                        if (!Object.keys(team_mate_obj.profile.characterHouseRoomMap || {}).length) team_mate_obj.profile.characterHouseRoomMap = snap.characterHouseRoomMap || {};
                        if (!(team_mate_obj.profile.characterAchievements || []).length) team_mate_obj.profile.characterAchievements = snap.characterAchievements || [];
                        if (!Object.keys(team_mate_obj.profile.guildBuffLevelMap || {}).length) team_mate_obj.profile.guildBuffLevelMap = snap.guildBuffLevelMap || {};
                    }
                }
                exportObj.players[player_num] = constructPlayerExportObjFromProfile(team_mate_obj);
            } else if (mateName == loggedInName) {
                // 还没点开过自己的配装 → 回退登录快照
                exportObj.players[player_num] = constructSelfPlayerExportObjFromInitCharacterData();
            } else if (mateName == init_character_obj.character.name) {
                // 下拉选中的角色（自己的小号）无存档 → 回退它的登录快照
                exportObj.players[player_num] = constructSelfPlayerExportObjFromInitCharacterData(init_character_obj);
            } else if (!team_mate_obj) {
                alert("请手动查看一下队友装备信息，当前缺失装备信息队友：" + mateName);
                return;
            } else {
                exportObj.players[player_num] = constructPlayerExportObjFromProfile(team_mate_obj);
            }
        }
        // Zone
        let hasMap = false;
        for (const action of init_character_obj.characterActions) {
            if (
                action &&
                action.actionHrid.includes("/actions/combat/")
            ) {
                hasMap = true;
                exportObj.zone = action.actionHrid;
                break;
            }
        }
        if (!hasMap) {
            exportObj.zone = "/actions/combat/fly";
        }
        // SimulationTime
        exportObj.simulationTime = SCRIPT_SIMULATE_TIME;
        return exportObj;
    }

    // ── 模拟器页《导出队伍中单人数据》：弹窗选人 → 该角色的模拟器导入 JSON 复制到剪贴板 ──
    let exportMemberDialog = null;
    // 判空：七项战斗等级都存在且都不大于 1 视为空角色；等级字段完全缺失时不算空（避免格式差异误杀）
    function isBlankSimPlayer(p) {
        if (!p) return true;
        const fields = ["staminaLevel", "intelligenceLevel", "attackLevel", "meleeLevel", "defenseLevel", "rangedLevel", "magicLevel"];
        let hasAny = false, maxLevel = 0;
        for (const f of fields) {
            if (p[f] !== undefined) hasAny = true;
            const v = Number(p[f]) || 0;
            if (v > maxLevel) maxLevel = v;
        }
        if (!hasAny) return false;
        return maxLevel <= 1;
    }
    // textdb 模式支持：《战斗模拟器导入》插件生成 ?textdb=<key> 分享链接，数据存于 api.textdb.online
    function getTextdbKey() {
        try { return new URLSearchParams(window.location.search).get("textdb") || ""; } catch (e) { return ""; }
    }
    function fetchTextdbGroup(key) {
        return new Promise((resolve, reject) => {
            const finish = (text) => {
                try { resolve(JSON.parse(text)); } catch (e) { reject(new Error("textdb 数据不是合法 JSON")); }
            };
            if (typeof GM_xmlhttpRequest === "function") {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: "https://api.textdb.online/" + encodeURIComponent(key),
                    onload: (r) => (r.status === 200 && r.responseText) ? finish(r.responseText) : reject(new Error("textdb 加载失败 HTTP " + r.status)),
                    onerror: () => reject(new Error("textdb 请求失败")),
                });
            } else {
                fetch("https://api.textdb.online/" + encodeURIComponent(key))
                    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
                    .then(finish)
                    .catch(reject);
            }
        });
    }
    // 解析整队 JSON，兼容多种结构（players 映射 / playerDataMap / 顶层数字键映射 / 数组），返回 [{label, data}]
    function collectGroupEntries(group) {
        const list = [];
        if (!group || typeof group !== "object") return list;
        const pushEntry = (v) => {
            if (typeof v === "string") { try { v = JSON.parse(v); } catch (e) { return; } }
            if (v && typeof v === "object") list.push(v);
        };
        const pushAll = (map) => {
            Object.keys(map)
                .sort((a, b) => (Number(a) || 0) - (Number(b) || 0))
                .forEach(k => pushEntry(map[k]));
        };
        if (Array.isArray(group)) {
            group.forEach(pushEntry);
        } else if (group.players) {
            pushAll(group.players);
        } else if (group.playerDataMap) {
            pushAll(group.playerDataMap);
        } else {
            const numericKeys = Object.keys(group).filter(k => /^\d+$/.test(k));
            if (numericKeys.length > 0) pushAll(group);
        }
        // 判空过滤；若全部被判空但确实有数据，则原样保留（避免结构差异误杀）
        const nonBlank = list.filter(data => !isBlankSimPlayer(data.player || data));
        const picked = nonBlank.length ? nonBlank : list;
        return picked.map((data, idx) => ({ label: "player" + (idx + 1), data: data }));
    }
    async function exportSingleTeamMemberData() {
        // 1) 首选：模拟器自带导出（buttonExportSet）——拿到的是当前 UI 的实时状态（包含修改后的 trigger 等编辑）
        const groupTab = document.querySelector(`a#group-combat-tab`);
        const exportBtn = document.getElementById('buttonExportSet');
        if (groupTab && exportBtn) {
            let text = "";
            try {
                groupTab.click();
                exportBtn.click();
                await sleep(150);
                text = await navigator.clipboard.readText();
            } catch (e) {
                showLoadoutToast("读取剪贴板失败（需允许剪贴板权限）: " + (e?.message || e), "error");
                return;
            }
            if (text) {
                let entries = [];
                try { entries = collectGroupEntries(JSON.parse(text)); } catch (e) { entries = []; }
                // 用模拟器页签上的名字作为标签（有真实名字时更友好）
                entries.forEach((entry, idx) => {
                    const tabName = document.querySelector(`a#player` + (idx + 1) + `-tab`)?.textContent?.trim() || "";
                    if (tabName) entry.label = tabName;
                });
                if (entries.length) {
                    showExportMemberDialog(entries);
                    return;
                }
            }
        }
        // 2) 次选：player1~player5 输入框（导入时的快照，不含导入后的 UI 编辑）
        const entries = [];
        for (let i = 1; i <= 5; i++) {
            const input = document.querySelector(`input#inputSetGroupCombatplayer` + i);
            if (!input || !input.value) continue;
            let data = null;
            try { data = JSON.parse(input.value); } catch (e) { data = null; }
            if (!data || !data.player || isBlankSimPlayer(data.player)) continue;
            const tabName = document.querySelector(`a#player` + i + `-tab`)?.textContent?.trim() || "";
            entries.push({ label: tabName || ("player" + i), data: data });
        }
        if (entries.length) {
            showExportMemberDialog(entries);
            return;
        }
        // 2) textdb 模式：?textdb=<key> 分享链接时，直接拉取整队 JSON 并按玩家拆分
        const textdbKey = getTextdbKey();
        if (textdbKey) {
            try {
                const group = await fetchTextdbGroup(textdbKey);
                const textdbEntries = collectGroupEntries(group);
                if (textdbEntries.length) {
                    showExportMemberDialog(textdbEntries);
                    return;
                }
                showLoadoutToast("textdb 队伍数据里没有可导出的角色", "error");
                return;
            } catch (e) {
                showLoadoutToast("textdb 加载失败: " + (e?.message || e), "error");
                return;
            }
        }
        // 回退：模拟器还没加载数据时，按 GM 存档构建
        let checkedProfile, playerInfo;
        try {
            checkedProfile = getSelectedValue();
            playerInfo = JSON.parse(GM_getValue("profile_" + checkedProfile));
        } catch (e) {
            showLoadoutToast("没有可导出的队伍数据", "error");
            return;
        }
        let playerArr = [];
        if (playerInfo?.partyInfo?.partySlotMap) {
            Object.values(playerInfo.partyInfo.partySlotMap).forEach((value) => {
                if (value.characterID) playerArr.push(playerInfo.partyInfo.sharableCharacterMap[value.characterID].name);
            });
        } else if (playerInfo?.character?.name) {
            playerArr.push(playerInfo.character.name);
        }
        let battleObj = null;
        const teamData = GM_getValue("team_battle_" + playerArr[0], "");
        if (teamData) {
            try { battleObj = JSON.parse(teamData); } catch (e) { battleObj = null; }
        }
        const roster = (battleObj?.players || []).map(p => p?.character?.name).filter(Boolean);
        const gmEntries = [];
        for (const n of (roster.length ? roster : playerArr)) {
            try { gmEntries.push({ label: n, data: buildSingleMemberExport(battleObj, checkedProfile, n) }); }
            catch (e) { /* 缺存档的角色跳过 */ }
        }
        if (!gmEntries.length) { showLoadoutToast("没有可导出的队伍数据", "error"); return; }
        showExportMemberDialog(gmEntries);
    }
    function showExportMemberDialog(entries) {
        if (exportMemberDialog) exportMemberDialog.remove();
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;';
        const box = document.createElement('div');
        box.style.cssText = 'background:#fff;border-radius:10px;padding:16px 18px;min-width:280px;box-shadow:0 8px 30px rgba(0,0,0,.3);font-size:14px;color:#333;';
        const title = document.createElement('div');
        title.textContent = isZH ? '导出队伍中单人数据' : 'Export a member\'s data';
        title.style.cssText = 'font-weight:bold;margin-bottom:10px;';
        const select = document.createElement('select');
        select.style.cssText = 'width:100%;padding:6px;margin-bottom:12px;';
        entries.forEach((entry, idx) => {
            const opt = document.createElement('option');
            opt.value = String(idx);
            opt.textContent = entry.label;
            select.appendChild(opt);
        });
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:8px;';
        const okBtn = document.createElement('button');
        okBtn.textContent = isZH ? '导出' : 'Export';
        okBtn.style.cssText = 'flex:1;padding:6px;border:none;border-radius:6px;background:#4357AF;color:#fff;cursor:pointer;';
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = isZH ? '取消' : 'Cancel';
        cancelBtn.style.cssText = 'flex:1;padding:6px;border:none;border-radius:6px;background:#9e9e9e;color:#fff;cursor:pointer;';
        okBtn.addEventListener('click', async () => {
            const entry = entries[Number(select.value)] || entries[0];
            try {
                await writeClipboard(JSON.stringify(entry.data));
                showLoadoutToast('已复制「' + entry.label + '」的数据到剪贴板');
                overlay.remove();
                exportMemberDialog = null;
            } catch (e) {
                showLoadoutToast('导出失败: ' + (e?.message || e), 'error');
            }
        });
        cancelBtn.addEventListener('click', () => { overlay.remove(); exportMemberDialog = null; });
        btnRow.appendChild(okBtn);
        btnRow.appendChild(cancelBtn);
        box.appendChild(title);
        box.appendChild(select);
        box.appendChild(btnRow);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        exportMemberDialog = overlay;
    }
    // 组装单个角色的模拟器导入 JSON（数据来源优先级与《导入人物数据》完全一致）
    function buildSingleMemberExport(battleObj, checkedProfile, memberName) {
        let init_character_obj = JSON.parse(GM_getValue("profile_" + checkedProfile));
        let loggedInName = "";
        try {
            let initRaw = GM_getValue("init_character_data");
            if (initRaw) loggedInName = JSON.parse(initRaw).character.name;
        } catch (e) {}
        const member = (battleObj?.players || []).find(p => p?.character?.name === memberName);
        if (!member) throw new Error("队伍数据里没有该角色: " + memberName);
        let playerObj = null;
        let team_mate_str = GM_getValue(memberName, "");
        let team_mate_obj = null;
        if (team_mate_str) {
            try { team_mate_obj = JSON.parse(team_mate_str); } catch (e) { team_mate_obj = null; }
        }
        const mateWearable = team_mate_obj?.profile?.wearableItemMap;
        const hasEquip = mateWearable && Object.keys(mateWearable).length > 0;
        if (team_mate_obj && hasEquip) {
            // 存档缺技能/房屋等底档字段且有登录快照时补齐（与导入逻辑一致）
            if (!(team_mate_obj.profile.characterSkills || []).length) {
                let snap = null;
                if (memberName == loggedInName) {
                    try { snap = JSON.parse(GM_getValue("init_character_data")); } catch (e) {}
                } else if (memberName == init_character_obj.character.name) {
                    snap = init_character_obj;
                }
                if (snap) {
                    team_mate_obj.profile.characterSkills = snap.characterSkills || [];
                    if (!Object.keys(team_mate_obj.profile.characterHouseRoomMap || {}).length) team_mate_obj.profile.characterHouseRoomMap = snap.characterHouseRoomMap || {};
                    if (!(team_mate_obj.profile.characterAchievements || []).length) team_mate_obj.profile.characterAchievements = snap.characterAchievements || [];
                    if (!Object.keys(team_mate_obj.profile.guildBuffLevelMap || {}).length) team_mate_obj.profile.guildBuffLevelMap = snap.guildBuffLevelMap || {};
                }
            }
            playerObj = constructPlayerExportObjFromProfile(team_mate_obj);
        } else if (memberName == loggedInName) {
            playerObj = constructSelfPlayerExportObjFromInitCharacterData();
        } else if (memberName == init_character_obj.character.name) {
            playerObj = constructSelfPlayerExportObjFromInitCharacterData(init_character_obj);
        } else {
            throw new Error("缺少「" + memberName + "」的存档，请先在游戏里点开该角色的配装");
        }
        // 兜底字段，保证游戏侧《导入模拟器数据》可直接消费
        playerObj.triggerMap = playerObj.triggerMap || {};
        playerObj.houseRooms = playerObj.houseRooms || {};
        playerObj.achievements = playerObj.achievements || {};
        playerObj.guildBuffs = playerObj.guildBuffs || {};
        return playerObj;
    }

    async function observeResults() {
        let resultDiv = document.querySelector(`div.row`)?.querySelectorAll(`div.col-md-5`)?.[2]?.querySelector(`div.row > div.col-md-5`);
        if(document.URL.includes("mwisim.github.io")||document.URL.includes("simTest")){
            resultDiv = document.querySelectorAll(`div.row`)?.[1]?.querySelectorAll(`div.col-md-5`)?.[2]?.querySelector(`div.row > div.col-md-5`);
        }
        const deathDiv = document.querySelector(`div#simulationResultPlayerDeaths`);
        const expDiv = document.querySelector(`div#simulationResultExperienceGain`);
        const consumeDiv = document.querySelector(`div#simulationResultConsumablesUsed`);
        deathDiv.style.backgroundColor = "#FFEAE9";
        deathDiv.style.color = "black";
        expDiv.style.backgroundColor = "#CDFFDD";
        expDiv.style.color = "black";
        consumeDiv.style.backgroundColor = "#F0F8FF";
        consumeDiv.style.color = "black";

        let div = document.createElement("div");
        div.id = "tillLevel";
        div.style.backgroundColor = "#FFFFE0";
        div.style.color = "black";
        div.textContent = "";
        resultDiv.append(div);

        new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (mutation.addedNodes.length >= 2) {
                    handleResult(mutation.addedNodes, div);
                }
            });
        }).observe(expDiv, { childList: true, subtree: true });
    }

    function handleResult(expNodes, parentDiv) {
        let perHourGainExp = {
            stamina: 0,
            intelligence: 0,
            attack: 0,
            power: 0,
            defense: 0,
            ranged: 0,
            magic: 0,
            melee: 0,
        };
        expNodes.forEach((expNodes) => {
            if (expNodes.textContent.includes("Stamina")||expNodes.textContent.includes("耐力")) {
                perHourGainExp.stamina = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Intelligence")||expNodes.textContent.includes("智力")) {
                perHourGainExp.intelligence = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Attack")||expNodes.textContent.includes("攻击")) {
                perHourGainExp.attack = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Power")||expNodes.textContent.includes("力量")) {
                perHourGainExp.power = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Defense")||expNodes.textContent.includes("防御")) {
                perHourGainExp.defense = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Ranged")||expNodes.textContent.includes("远程")) {
                perHourGainExp.ranged = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Magic")||expNodes.textContent.includes("魔法")) {
                perHourGainExp.magic = Number(expNodes.children[1].textContent);
            } else if (expNodes.textContent.includes("Melee")||expNodes.textContent.includes("近战")) {
                perHourGainExp.melee = Number(expNodes.children[1].textContent);
            }
        });

        let data = GM_getValue("init_character_data");

        let obj = JSON.parse(data);
        if (!obj || !obj.characterSkills || !obj.currentTimestamp) {
            console.error("handleResult no character localstorage");
            return;
        }

        let skillLevels = {};
        for (const skill of obj.characterSkills) {
            if (skill.skillHrid.includes("stamina")) {
                skillLevels.stamina = {};
                skillLevels.stamina.skillName = "Stamina";
                skillLevels.stamina.currentLevel = skill.level;
                skillLevels.stamina.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("intelligence")) {
                skillLevels.intelligence = {};
                skillLevels.intelligence.skillName = "Intelligence";
                skillLevels.intelligence.currentLevel = skill.level;
                skillLevels.intelligence.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("attack")) {
                skillLevels.attack = {};
                skillLevels.attack.skillName = "Attack";
                skillLevels.attack.currentLevel = skill.level;
                skillLevels.attack.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("power")) {
                skillLevels.power = {};
                skillLevels.power.skillName = "Power";
                skillLevels.power.currentLevel = skill.level;
                skillLevels.power.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("defense")) {
                skillLevels.defense = {};
                skillLevels.defense.skillName = "Defense";
                skillLevels.defense.currentLevel = skill.level;
                skillLevels.defense.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("ranged")) {
                skillLevels.ranged = {};
                skillLevels.ranged.skillName = "Ranged";
                skillLevels.ranged.currentLevel = skill.level;
                skillLevels.ranged.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("magic")) {
                skillLevels.magic = {};
                skillLevels.magic.skillName = "Magic";
                skillLevels.magic.currentLevel = skill.level;
                skillLevels.magic.currentExp = skill.experience;
            } else if (skill.skillHrid.includes("melee")) {
                skillLevels.melee = {};
                skillLevels.melee.skillName = "Melee";
                skillLevels.melee.currentLevel = skill.level;
                skillLevels.melee.currentExp = skill.experience;
            }
        }

        const skillNamesInOrder = ["stamina", "intelligence", "attack", "power", "melee", "defense", "ranged", "magic"];
        let hTMLStr = "";
        for (const skill of skillNamesInOrder) {
            if (!skillLevels[skill]) continue;
            hTMLStr += `<div id="${"inputDiv_" + skill}" style="display: flex; justify-content: flex-end">${skillLevels[skill].skillName}${
                isZH ? "到" : " to level "
        }<input id="${"input_" + skill}" type="number" value="${skillLevels[skill].currentLevel + 1}" min="${
                skillLevels[skill].currentLevel + 1
        }" max="200">${isZH ? "级" : ""}</div>`;
        }

        hTMLStr += `<div id="script_afterDays" style="display: flex; justify-content: flex-end"><input id="script_afterDays_input" type="number" value="1" min="0" max="200">${
            isZH ? "天后" : "days after"
    }</div>`;

        hTMLStr += `<div id="needDiv"></div>`;
        hTMLStr += `<div id="needListDiv"></div>`;
        parentDiv.innerHTML = hTMLStr;

        for (const skill of skillNamesInOrder) {
            if (!skillLevels[skill]) continue;
            const skillDiv = parentDiv.querySelector(`div#${"inputDiv_" + skill}`);
            const skillInput = parentDiv.querySelector(`input#${"input_" + skill}`);
            skillInput.onchange = () => {
                calculateTill(skill, skillInput, skillLevels, parentDiv, perHourGainExp);
            };
            skillInput.addEventListener("keyup", function (evt) {
                calculateTill(skill, skillInput, skillLevels, parentDiv, perHourGainExp);
            });
            skillDiv.onclick = () => {
                calculateTill(skill, skillInput, skillLevels, parentDiv, perHourGainExp);
            };
        }

        const daysAfterDiv = parentDiv.querySelector(`div#script_afterDays`);
        const daysAfterInput = parentDiv.querySelector(`input#script_afterDays_input`);
        daysAfterInput.onchange = () => {
            calculateAfterDays(daysAfterInput, skillLevels, parentDiv, perHourGainExp, skillNamesInOrder);
        };
        daysAfterInput.addEventListener("keyup", function (evt) {
            calculateAfterDays(daysAfterInput, skillLevels, parentDiv, perHourGainExp, skillNamesInOrder);
        });
        daysAfterDiv.onclick = () => {
            calculateAfterDays(daysAfterInput, skillLevels, parentDiv, perHourGainExp, skillNamesInOrder);
        };

        // 提取成本和收益
        const expensesSpan = document.querySelector(`span#expensesSpan`);
        const revenueSpan = document.querySelector(`span#revenueSpan`);
        const profitSpan = document.querySelector(`span#profitPreview`);
        const expenseDiv = document.querySelector(`div#script_expense`);
        const revenueDiv = document.querySelector(`div#script_revenue`);
        if (expenseDiv && expenseDiv) {
            expenseDiv.textContent = expensesSpan.parentNode.textContent;
            revenueDiv.textContent = revenueSpan.parentNode.textContent;
        } else {
            profitSpan.parentNode.insertAdjacentHTML(
                "beforeend",
                `<div id="script_expense" style="background-color: #DCDCDC; color: black;">${expensesSpan.parentNode.textContent}</div><div id="script_revenue" style="background-color: #DCDCDC; color: black;">${revenueSpan.parentNode.textContent}</div>`
            );
        }
    }

    function calculateAfterDays(daysAfterInput, skillLevels, parentDiv, perHourGainExp, skillNamesInOrder) {
        const initData_levelExperienceTable = GM_getValue("initData_levelExperienceTable");
        const days = Number(daysAfterInput.value);
        parentDiv.querySelector(`div#needDiv`).textContent = `${isZH ? "" : "After"} ${days} ${isZH ? "天后：" : "days: "}`;
        const listDiv = parentDiv.querySelector(`div#needListDiv`);

        let html = "";
        let resultLevels = {};
        for (const skillName of skillNamesInOrder) {
            for (const skill of Object.values(skillLevels)) {
                if (skill.skillName.toLowerCase() === skillName.toLowerCase()) {
                    const exp = skill.currentExp + perHourGainExp[skill.skillName.toLowerCase()] * days * 24;
                    let level = 1;
                    while (initData_levelExperienceTable[level] < exp) {
                        level++;
                    }
                    level--;
                    const minExpAtLevel = initData_levelExperienceTable[level];
                    const maxExpAtLevel = initData_levelExperienceTable[level + 1] - 1;
                    const expSpanInLevel = maxExpAtLevel - minExpAtLevel;
                    const levelPercentage = Number(((exp - minExpAtLevel) / expSpanInLevel) * 100).toFixed(1);
                    resultLevels[skillName.toLowerCase()] = level;
                    html += `<div>${skill.skillName} ${isZH ? "" : "level"} ${level} ${isZH ? "级" : ""} ${levelPercentage}%</div>`;
                    break;
                }
            }
        }
        const combatLevel =
              0.1 * (resultLevels.stamina + resultLevels.intelligence + resultLevels.defense + resultLevels.attack + Math.max(resultLevels.melee, resultLevels.ranged, resultLevels.magic)) +
              0.5 * Math.max(resultLevels.attack, resultLevels.defense, resultLevels.melee, resultLevels.ranged, resultLevels.magic);
        html += `<div>${isZH ? "战斗等级：" : "Combat level: "} ${combatLevel.toFixed(1)}</div>`;
        listDiv.innerHTML = html;
    }

    function calculateTill(skillName, skillInputElem, skillLevels, parentDiv, perHourGainExp) {
        const initData_levelExperienceTable = GM_getValue("initData_levelExperienceTable");
        const targetLevel = Number(skillInputElem.value);
        parentDiv.querySelector(`div#needDiv`).textContent = `${skillLevels[skillName].skillName} ${isZH ? "到" : "to level"} ${targetLevel} ${
            isZH ? "级 还需：" : " takes: "
    }`;
        const listDiv = parentDiv.querySelector(`div#needListDiv`);

        const currentLevel = Number(skillLevels[skillName].currentLevel);
        const currentExp = Number(skillLevels[skillName].currentExp);
        if (targetLevel > currentLevel && targetLevel <= 200) {
            if (perHourGainExp[skillName] === 0) {
                listDiv.innerHTML = isZH ? "永远" : "Forever";
            } else {
                let needExp = initData_levelExperienceTable[targetLevel] - currentExp;
                let needHours = needExp / perHourGainExp[skillName];
                let html = "";
                html += `<div>[${hoursToReadableString(needHours)}]</div>`;

                const consumeDivs = document.querySelectorAll(`div#simulationResultConsumablesUsed div.row`);
                for (const elem of consumeDivs) {
                    const conName = elem.children[0].textContent;
                    const conPerHour = Number(elem.children[1].textContent);
                    html += `<div>${conName} ${Number(conPerHour * needHours).toFixed(0)}</div>`;
                }

                listDiv.innerHTML = html;
            }
        } else {
            listDiv.innerHTML = isZH ? "输入错误" : "Input error";
        }
    }

    function hoursToReadableString(hours) {
        const sec = hours * 60 * 60;
        if (sec >= 86400) {
            return Number(sec / 86400).toFixed(1) + (isZH ? " 天" : " days");
        }
        const d = new Date(Math.round(sec * 1000));
        function pad(i) {
            return ("0" + i).slice(-2);
        }
        let str = d.getUTCHours() + "h " + pad(d.getUTCMinutes()) + "m " + pad(d.getUTCSeconds()) + "s";
        return str;
    }

    // ── 配装页《复制战斗模拟器数据》（自 mwi-calculator.user.js 移植）─────────
    const LOADOUT_COPY_SELECTORS = {
        selectedLoadout: '[class*="LoadoutsPanel_selectedLoadout__"]',
        loadoutDetails: '[class*="LoadoutsPanel_details__"], [class*="details"]',
        buttonsContainer: '[class*="buttonsContainer"]'
    };
    function getCollectionValues(collection) {
        if (Array.isArray(collection)) return collection;
        if (collection instanceof Map) return [...collection.values()];
        if (collection && typeof collection === 'object') return Object.values(collection);
        return [];
    }
    // 配装物品 hash 结构："x::y::itemHrid::enhancementLevel"
    function getItemByHash(hash) {
        const parts = String(hash || '').split('::');
        if (parts.length !== 4) return null;
        return { itemHrid: parts[2], enhancementLevel: Number(parts[3]) || 0 };
    }
    // 从配装面板的 React props 挖取 memoizedProps（游戏把配装状态挂在组件 props 上）
    function getLoadoutReactData(el) {
        try {
            const key = Reflect.ownKeys(el || {}).find(k => String(k).startsWith('__reactProps'));
            const props = key ? el[key] : null;
            return props?.children?.[0]?._owner?.memoizedProps || props?._owner?.memoizedProps || props || {};
        }
        catch (_) { return {}; }
    }
    // 读取配装标题（metadata 中 svg 图标与更新按钮之间的文本节点）
    function getLoadoutName(detailsEl) {
        const titleEl = detailsEl?.querySelector('[class*="LoadoutsPanel_metadata__"], [class*="metadata"]');
        const svgEl = titleEl?.querySelector('svg');
        const updateBtn = titleEl?.querySelector('button');
        let text = '';
        let current = svgEl?.nextSibling;
        while (current && current !== updateBtn) {
            if (current.nodeType === Node.TEXT_NODE) text += current.textContent || '';
            current = current.nextSibling;
        }
        return text.trim();
    }
    function getGameHost() {
        try {
            if (window.mwiHelper?.game) return window.mwiHelper.game;
            if (window.mwi?.game) return window.mwi.game;
            const selectors = ['[class^="GamePage"]', '[class*="GamePage_gamePage__"]', '#root'];
            for (const selector of selectors) {
                for (const el of document.querySelectorAll(selector)) {
                    const fiberKey = Reflect.ownKeys(el).find(k => String(k).startsWith('__reactFiber$'));
                    let fiber = fiberKey ? el[fiberKey] : null;
                    while (fiber) {
                        const host = fiber.stateNode;
                        if (host && typeof host === 'object'
                            && (typeof host.handleSwitchCharacter === 'function' || typeof host.handleGoToMarketplace === 'function')) {
                            return host;
                        }
                        fiber = fiber.return;
                    }
                }
            }
        }
        catch (_) { /* 忽略 */ }
        return null;
    }
    function convertCombatSimulatorData(loadout, snapshot, state) {
        snapshot = snapshot || {};
        state = state || {};
        const player = {};
        // 战斗等级（与导入器一致：skillHrid 包含匹配）
        const levelProps = { stamina: 'staminaLevel', intelligence: 'intelligenceLevel', attack: 'attackLevel', melee: 'meleeLevel', defense: 'defenseLevel', ranged: 'rangedLevel', magic: 'magicLevel' };
        for (const skill of snapshot.characterSkills || state.characterSkills || []) {
            for (const [key, prop] of Object.entries(levelProps)) {
                if (String(skill.skillHrid || '').includes(key)) player[prop] = skill.level;
            }
        }
        // 装备：配装穿戴位，强化等级取配装 hash 中的值
        player.equipment = [];
        Object.entries(loadout.wearableMap || {}).forEach(([itemLocationHrid, hash]) => {
            const item = getItemByHash(hash);
            if (!item?.itemHrid) return;
            player.equipment.push({ itemLocationHrid, itemHrid: item.itemHrid, enhancementLevel: item.enhancementLevel });
        });
        // 食物/饮料：槽位数组，空槽输出 { itemHrid: "" }（与导入器一致）
        const food = {};
        food['/action_types/combat'] = (loadout.foodItemHrids || []).map(itemHrid => ({ itemHrid: itemHrid || '' }));
        const drinks = {};
        drinks['/action_types/combat'] = (loadout.drinkItemHrids || []).map(itemHrid => ({ itemHrid: itemHrid || '' }));
        // 技能书：5 槽，特殊技能固定第 0 位（isSpecialAbility 来自 initData_abilityDetailMap）
        const abilities = [
            { abilityHrid: '', level: 1 },
            { abilityHrid: '', level: 1 },
            { abilityHrid: '', level: 1 },
            { abilityHrid: '', level: 1 },
            { abilityHrid: '', level: 1 },
        ];
        let normalIndex = 1;
        const characterAbilities = snapshot.characterAbilities || state.characterAbilities || [];
        const abilityDetailMap = GM_getValue("initData_abilityDetailMap") || {};
        for (const abilityHrid of Object.values(loadout.abilityMap || {})) {
            if (!abilityHrid) continue;
            const level = characterAbilities.find(item => item.abilityHrid === abilityHrid)?.level ?? 0;
            if (abilityDetailMap[abilityHrid]?.isSpecialAbility) {
                abilities[0] = { abilityHrid, level };
            }
            else if (normalIndex <= 4) {
                abilities[normalIndex++] = { abilityHrid, level };
            }
        }
        // 房屋（houseRoomHrid → 等级）
        const houseRooms = {};
        for (const house of Object.values(snapshot.characterHouseRoomMap || state.characterHouseRoomMap || {})) {
            if (house?.houseRoomHrid) houseRooms[house.houseRoomHrid] = house.level;
        }
        // 成就（achievementHrid → 是否完成）
        const achievements = {};
        for (const achievement of Object.values(snapshot.characterAchievements || state.characterAchievements || [])) {
            achievements[achievement.achievementHrid] = achievement.isCompleted;
        }
        // 公会增益（guildBuffHrid → 等级）
        const guildBuffs = {};
        for (const guildBuff of Object.values(snapshot.characterGuildBuffMap || state.characterGuildBuffMap || {})) {
            guildBuffs[guildBuff.guildBuffHrid] = guildBuff.level;
        }
        // 迷宫（characterInfo 中的 5 项等级）
        const labyrinth = {};
        for (const key of ['labyrinthCombatDamageLevel', 'labyrinthAttackSpeedLevel', 'labyrinthCastSpeedLevel', 'labyrinthCriticalRateLevel', 'labyrinthExperienceLevel']) {
            labyrinth[key] = snapshot.characterInfo?.[key] ?? 0;
        }
        return {
            player,
            food,
            drinks,
            abilities,
            triggerMap: { ...(loadout.abilityCombatTriggersMap || {}), ...(loadout.consumableCombatTriggersMap || {}) },
            houseRooms,
            achievements,
            guildBuffs,
            labyrinth,
        };
    }
    async function writeClipboard(text) {
        if (typeof GM_setClipboard === 'function') { GM_setClipboard(text, 'text'); return; }
        if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    }
    function showLoadoutToast(message, type = 'success') {
        const el = document.createElement('div');
        el.textContent = message;
        el.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483646;padding:10px 16px;border-radius:8px;'
            + 'color:#fff;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.25);background:'
            + (type === 'error' ? '#d9534f' : '#28a745');
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2500);
    }
    // ── 配装页《导入模拟器数据》：把剪贴板里的模拟器 JSON 逐槽位写进当前选中的配装 ──
    function sendLoadoutSlotUpdate(loadoutId, slotType, slotKey, itemIdentifier, combatTriggers) {
        if (!gameSocket) throw new Error("尚未捕获游戏 WebSocket，请刷新游戏页后重试");
        const slotUpdate = {
            id: loadoutId,
            slotType: slotType,
            slotKey: slotKey,
            itemIdentifier: itemIdentifier,
        };
        if (combatTriggers) slotUpdate.combatTriggers = combatTriggers;
        gameSocket.send(JSON.stringify({
            type: "update_loadout_slot",
            updateLoadoutSlotData: {
                characterLoadoutSlotUpdate: slotUpdate,
            },
            ts: Date.now(),
        }));
    }
    // 在角色所有配装的 wearableMap 里找「同 hrid 同强化」的现成 itemIdentifier（本身就是合法引用）
    function findIdentifierFromLoadouts(allLoadouts, itemHrid, enhancementLevel) {
        for (const lo of allLoadouts) {
            for (const hash of Object.values(lo.wearableMap || {})) {
                const parts = String(hash || "").split("::");
                if (parts.length === 4 && parts[2] === itemHrid && (Number(parts[3]) || 0) === (enhancementLevel || 0)) {
                    return hash;
                }
            }
        }
        return null;
    }
    // 从 init_character_data.characterItems 里找道具实例（同 hrid 优先同强化，其次最高强化）
    function findIdentifierFromItems(snapshot, itemHrid, enhancementLevel) {
        const items = (snapshot.characterItems || []).filter(it => it.itemHrid === itemHrid);
        if (!items.length) return null;
        const exact = items.find(it => (it.enhancementLevel || 0) === (enhancementLevel || 0));
        const pick = exact || items.reduce((a, b) => ((b.enhancementLevel || 0) > (a.enhancementLevel || 0) ? b : a), items[0]);
        const iid = pick.id != null ? pick.id : pick.itemId;
        if (iid == null) return null;
        return `${iid}::${pick.itemLocationHrid || "/item_locations/inventory"}::${itemHrid}::${pick.enhancementLevel || 0}`;
    }
    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    let importSimInFlight = false;
    // 《导入模拟器数据》忽略的饰品槽位（仅指 Trinket；保持游戏配装现状，不导入也不清空）
    const IGNORED_EQUIPMENT_KEYWORDS = ["trinket"];
    function isIgnoredEquipmentSlot(slotKey) {
        const k = String(slotKey || "").toLowerCase();
        return IGNORED_EQUIPMENT_KEYWORDS.some(w => k.includes(w));
    }
    async function importSimulatorDataToLoadout() {
        if (importSimInFlight) { showLoadoutToast("正在导入中，请稍候", "error"); return; }
        importSimInFlight = true;
        try {
            await importSimulatorDataToLoadoutInner();
        } finally {
            importSimInFlight = false;
        }
    }
    async function importSimulatorDataToLoadoutInner() {
        // 1) 定位当前选中的配装（与复制按钮同一套定位逻辑）
        const panel = document.querySelector(LOADOUT_COPY_SELECTORS.selectedLoadout);
        const detailsEl = panel ? panel.querySelector(LOADOUT_COPY_SELECTORS.loadoutDetails) : null;
        const reactData = getLoadoutReactData(detailsEl);
        const name = getLoadoutName(detailsEl);
        const reactLoadouts = getCollectionValues(reactData?.characterLoadoutDict);
        const loadouts = reactLoadouts.length ? reactLoadouts : getCollectionValues(getGameHost()?.state?.characterLoadoutMap);
        const target = loadouts.find(item => item?.name === name);
        if (!target || (target.id == null && target.characterLoadoutId == null)) {
            showLoadoutToast("未找到当前选中的配装", "error");
            return;
        }
        const targetId = target.id != null ? target.id : target.characterLoadoutId;
        // 2) 读剪贴板
        let payload;
        try {
            const text = await navigator.clipboard.readText();
            payload = JSON.parse(text);
        } catch (error) {
            showLoadoutToast("读取剪贴板失败: " + (error?.message || error), "error");
            return;
        }
        if (!payload || !Array.isArray(payload.player?.equipment)) {
            showLoadoutToast("剪贴板内容不是模拟器导入数据", "error");
            return;
        }
        // 3) 组装槽位更新
        let snapshot = {};
        let allLoadouts = loadouts;
        try {
            snapshot = JSON.parse(GM_getValue("init_character_data", "null")) || {};
            if (!allLoadouts.length) allLoadouts = getCollectionValues(snapshot.characterLoadoutMap || {});
        } catch (_) { snapshot = {}; }
        const updates = [];
        const warnings = [];
        // 3a. 装备：先清空剪贴板里没有的槽位，再写入
        const payloadSlots = {};
        for (const eq of payload.player.equipment) {
            if (eq?.itemLocationHrid && eq.itemHrid) payloadSlots[eq.itemLocationHrid] = eq;
        }
        for (const loc of Object.keys(target.wearableMap || {})) {
            if (!payloadSlots[loc] && target.wearableMap[loc] && !isIgnoredEquipmentSlot(loc)) {
                updates.push({ slotType: "equipment", slotKey: loc, itemIdentifier: "" });
            }
        }
        for (const [loc, eq] of Object.entries(payloadSlots)) {
            if (isIgnoredEquipmentSlot(loc)) continue; // 饰品槽位忽略改动
            const curItem = getItemByHash(target.wearableMap?.[loc] || "");
            if (curItem && curItem.itemHrid === eq.itemHrid && (curItem.enhancementLevel || 0) === (eq.enhancementLevel || 0)) {
                continue; // 与当前配装一致，可忽略
            }
            const identifier = findIdentifierFromLoadouts(allLoadouts, eq.itemHrid, eq.enhancementLevel)
                || findIdentifierFromItems(snapshot, eq.itemHrid, eq.enhancementLevel);
            if (identifier) updates.push({ slotType: "equipment", slotKey: loc, itemIdentifier: identifier });
            else warnings.push(loc + " 缺少 " + eq.itemHrid);
        }
        // 3b. 技能书：payload 第 0 位=特殊技能，其余普通；写入当前配装对应键位
        const abilityDetailMap = GM_getValue("initData_abilityDetailMap") || {};
        const abilityKeys = Object.keys(target.abilityMap || {}).sort((a, b) => Number(a) - Number(b));
        let specialKey = null;
        for (const k of abilityKeys) {
            const cur = target.abilityMap[k];
            if (cur && abilityDetailMap[cur]?.isSpecialAbility) { specialKey = k; break; }
        }
        if (specialKey == null && abilityKeys.length) specialKey = abilityKeys[0];
        const normalKeys = abilityKeys.filter(k => k !== specialKey);
        const payloadAbilities = payload.abilities || [];
        const abilityUpdates = [];
        if (specialKey != null) {
            abilityUpdates.push({ key: specialKey, identifier: payloadAbilities[0]?.abilityHrid || "" });
        }
        normalKeys.forEach((k, idx) => {
            abilityUpdates.push({ key: k, identifier: payloadAbilities[idx + 1]?.abilityHrid || "" });
        });
        for (const au of abilityUpdates) {
            if ((target.abilityMap?.[au.key] || "") === au.identifier) continue; // 与当前配装一致，可忽略
            updates.push({ slotType: "ability", slotKey: au.key, itemIdentifier: au.identifier });
        }
        // 3c. 食物/饮料：按目标配装的槽位数写入，多出的槽清空
        const payloadFood = payload.food?.["/action_types/combat"] || [];
        const foodSlots = Math.max((target.foodItemHrids || []).length, payloadFood.length);
        for (let i = 0; i < foodSlots; i++) {
            const desired = payloadFood[i]?.itemHrid || "";
            if (((target.foodItemHrids || [])[i] || "") === desired) continue; // 与当前配装一致，可忽略
            updates.push({ slotType: "food", slotKey: String(i), itemIdentifier: desired });
        }
        const payloadDrinks = payload.drinks?.["/action_types/combat"] || [];
        const drinkSlots = Math.max((target.drinkItemHrids || []).length, payloadDrinks.length);
        for (let i = 0; i < drinkSlots; i++) {
            const desired = payloadDrinks[i]?.itemHrid || "";
            if (((target.drinkItemHrids || [])[i] || "") === desired) continue; // 与当前配装一致，可忽略
            updates.push({ slotType: "drink", slotKey: String(i), itemIdentifier: desired });
        }
        // 3d. 触发器：技能触发器 + 消耗品(食物/饮料)触发器，逐键比对内容
        const currentTriggers = Object.assign({}, target.abilityCombatTriggersMap || {}, target.consumableCombatTriggersMap || {});
        const desiredTriggers = payload.triggerMap || {};
        const payloadFoodHrids = new Set(payloadFood.map(f => f?.itemHrid).filter(Boolean));
        const targetFoodHrids = new Set((target.foodItemHrids || []).filter(Boolean));
        const payloadDrinkHrids = new Set(payloadDrinks.map(f => f?.itemHrid).filter(Boolean));
        const targetDrinkHrids = new Set((target.drinkItemHrids || []).filter(Boolean));
        const classifyTriggerKey = (key) => {
            if (String(key).startsWith("/abilities/")) return "ability_trigger";
            if (payloadFoodHrids.has(key) || targetFoodHrids.has(key)) return "food_trigger";
            if (payloadDrinkHrids.has(key) || targetDrinkHrids.has(key) || key.includes("coffee")) return "drink_trigger";
            return "food_trigger";
        };
        // 兼容两种取值形态：直接是数组，或 { combatTriggers: [...] }
        const normalizeTriggers = (value) => {
            const arr = Array.isArray(value) ? value : (value && Array.isArray(value.combatTriggers) ? value.combatTriggers : null);
            if (!arr) return [];
            return arr.filter(t => t && (t.conditionHrid || t.dependencyHrid)).map(t => ({
                dependencyHrid: t.dependencyHrid || "",
                conditionHrid: t.conditionHrid || "",
                comparatorHrid: t.comparatorHrid || "",
                value: t.value,
            }));
        };
        const triggerSignature = (list) => list
            .map(t => [t.dependencyHrid, t.conditionHrid, t.comparatorHrid, String(t.value)].join("|"))
            .sort().join(";");
        const allTriggerKeys = new Set([...Object.keys(currentTriggers), ...Object.keys(desiredTriggers)]);
        for (const key of allTriggerKeys) {
            const desired = normalizeTriggers(desiredTriggers[key]);
            const current = normalizeTriggers(currentTriggers[key]);
            if (triggerSignature(desired) === triggerSignature(current)) continue; // 与当前配装一致，可忽略
            updates.push({
                slotType: classifyTriggerKey(key),
                slotKey: key,
                itemIdentifier: "",
                combatTriggers: desired,
            });
        }
        // 4) 无实际改动则不发送
        if (!updates.length) {
            showLoadoutToast("配装与剪贴板一致，无需改动");
            return;
        }
        // 5) 依次发送，每次改动间隔 0.5~1.5 秒随机
        try {
            for (let i = 0; i < updates.length; i++) {
                const u = updates[i];
                if (i > 0) await sleep(500 + Math.floor(Math.random() * 1000));
                sendLoadoutSlotUpdate(targetId, u.slotType, u.slotKey, u.itemIdentifier, u.combatTriggers);
            }
        } catch (error) {
            showLoadoutToast("发送失败: " + (error?.message || error), "error");
            return;
        }
        showLoadoutToast("已写入 " + updates.length + " 个槽位到配装「" + (target.name || name) + "」"
            + (warnings.length ? "（缺失: " + warnings.join("、") + "）" : ""));
    }
    async function copyCombatSimulatorData() {
        const panel = document.querySelector(LOADOUT_COPY_SELECTORS.selectedLoadout);
        const detailsEl = panel ? panel.querySelector(LOADOUT_COPY_SELECTORS.loadoutDetails) : null;
        const reactData = getLoadoutReactData(detailsEl);
        const name = getLoadoutName(detailsEl);
        const reactLoadouts = getCollectionValues(reactData?.characterLoadoutDict);
        const loadouts = reactLoadouts.length ? reactLoadouts : getCollectionValues(getGameHost()?.state?.characterLoadoutMap);
        const loadout = loadouts.find(item => item?.name === name);
        if (!loadout) { showLoadoutToast('未找到当前配装', 'error'); return; }
        // 数据源：init_character_data 全量快照（房屋/成就/公会增益/迷宫/技能书等级）
        let snapshot = {};
        try { snapshot = JSON.parse(GM_getValue("init_character_data", "null")) || {}; }
        catch (_) { snapshot = {}; }
        const payload = JSON.stringify(convertCombatSimulatorData(loadout, snapshot, getGameHost()?.state || {}));
        try {
            await writeClipboard(payload);
            showLoadoutToast('已复制战斗模拟器数据');
        }
        catch (error) {
            console.error('[MWI-Importer] 复制失败:', error);
            showLoadoutToast('复制失败: ' + (error?.message || error), 'error');
        }
    }
    // 战斗配装页注入按钮；非战斗配装或离开页面时移除（每秒轮询同步）
    function syncLoadoutCopyButton() {
        const panel = document.querySelector(LOADOUT_COPY_SELECTORS.selectedLoadout);
        const detailsEl = panel ? panel.querySelector(LOADOUT_COPY_SELECTORS.loadoutDetails) : null;
        const combatIcon = detailsEl?.querySelector('[class*="metadata"] svg use')?.getAttribute('href')?.split('#').pop();
        let row = document.querySelector('.mwi-copy-combat-row');
        if (!panel || combatIcon !== 'combat') {
            if (row) row.remove();
            return;
        }
        if (panel.querySelector('.mwi-copy-combat-btn')) return;
        const container = panel.querySelector(LOADOUT_COPY_SELECTORS.buttonsContainer) || panel;
        const reference = container.querySelector('button:last-child');
        const button = reference ? reference.cloneNode(true) : document.createElement('button');
        if (!reference) {
            button.style.cssText = 'margin:4px;padding:4px 8px;border:none;border-radius:4px;background:#1976D2;color:#fff;cursor:pointer';
        }
        button.type = 'button';
        button.classList.add('mwi-copy-combat-btn');
        button.textContent = isZH ? '复制战斗模拟器数据' : 'Copy combat sim data';
        button.addEventListener('click', () => copyCombatSimulatorData());
        const importBtn = reference ? reference.cloneNode(true) : document.createElement('button');
        if (!reference) {
            importBtn.style.cssText = 'margin:4px;padding:4px 8px;border:none;border-radius:4px;background:#1976D2;color:#fff;cursor:pointer';
        }
        importBtn.type = 'button';
        importBtn.classList.add('mwi-import-sim-btn');
        importBtn.textContent = isZH ? '导入模拟器数据' : 'Import sim data';
        importBtn.addEventListener('click', () => importSimulatorDataToLoadout());
        row = document.createElement('div');
        row.className = 'mwi-copy-combat-row';
        row.style.cssText = 'display:flex;gap:8px;align-items:stretch;margin:4px 0;';
        button.style.flex = '1 1 0';
        button.style.minWidth = '0';
        importBtn.style.flex = '1 1 0';
        importBtn.style.minWidth = '0';
        container.insertAdjacentElement('afterend', row);
        row.appendChild(button);
        row.appendChild(importBtn);
    }
    function startLoadoutCopyButtonSync() {
        setInterval(() => {
            try { syncLoadoutCopyButton(); }
            catch (error) { console.error('[MWI-Importer] 配装复制按钮同步失败', error); }
        }, 1000);
    }
})();
