export default {
  "modules/achievement": {
    name: "achievement",
    tickspeed: 1,
    unlockNeeded: "achievementFeature",
    tick() {
      store.dispatch("achievement/check");
    },
    unlock: ["achievementFeature"],
    relic: {
      excavator: {
        icon: "mdi-excavator",
        feature: ["achievement", "mining"],
        color: "orange",
        effect: [
          { name: "currencyMiningScrapGain", type: "mult", value: 2 },
          { name: "currencyMiningScrapCap", type: "mult", value: 2 },
        ],
      },
      redCard: {
        icon: "mdi-cards",
        feature: ["achievement", "horde"],
        color: "red",
        effect: [
          { name: "currencyHordeMonsterPartCap", type: "bonus", value: buildNum(10, "K") },
          { name: "hordeCardCap", type: "base", value: 1 },
        ],
      },
      briefcase: {
        icon: "mdi-briefcase",
        feature: ["achievement", "treasure"],
        color: "pale-blue",
        effect: [{ name: "treasureSlots", type: "base", value: 8 }],
      },
      strangePlant: {
        icon: "mdi-sprout",
        feature: ["achievement", "village", "farm"],
        color: "pale-purple",
        effect: [
          { name: "villageMaterialGain", type: "mult", value: 2 },
          { name: "farmCropGain", type: "mult", value: 2 },
        ],
      },
      beneficialVirus: {
        icon: "mdi-virus",
        feature: ["achievement", "mining", "horde"],
        color: "pale-green",
        effect: [
          { name: "miningToughness", type: "mult", value: 0.5 },
          { name: "hordeCorruption", type: "bonus", value: -0.5 },
        ],
      },
    },
    note: buildArray(1).map(() => "g"),
    saveGame() {
      let obj = {};
      for (const [key, elem] of Object.entries(store.state.achievement)) {
        if (elem.level > 0) {
          obj[key] = elem.level;
        }
      }
      return obj;
    },
    loadGame(data) {
      for (const [key, elem] of Object.entries(data)) {
        if (store.state.achievement[key] !== undefined) {
          store.commit("achievement/updateKey", { name: key, key: "cacheHideNotification", value: elem });
        }
      }
      store.dispatch("achievement/check");
    },
  },
  "modules/card": {
    name: "card",
    unlockNeeded: "cardFeature",
    unlock: ["cardFeature", "cardShiny"],
    mult: { cardShinyChance: { display: "percent", baseValue: 0.1 } },
    currency: { shinyDust: { color: "pale-light-blue", icon: "mdi-shimmer" } },
    note: buildArray(2).map(() => "g"),
    init() {
      for (const [name, feature] of Object.entries({
        mining: miningCard,
        village: villageCard,
        horde: hordeCard,
        farm: farmCard,
        gallery: galleryCard,
        gem: gemCard,
        event: eventCard,
      })) {
        if (feature.feature) {
          store.dispatch("card/initFeature", { name, ...feature.feature });
        }
        for (const [key, elem] of Object.entries(feature.collection)) {
          store.commit("card/initCollection", { name: key, ...elem });
        }
        for (const [key, elem] of Object.entries(feature.pack)) {
          store.commit("card/initPack", { name: key, feature: name, ...elem });
        }
        if (feature.card) {
          feature.card.forEach((elem) => {
            store.commit("card/initCard", { feature: name, ...elem });
          });
        }
      }
    },
    saveGame() {
      let obj = { card: {}, feature: {} };
      for (const [key, elem] of Object.entries(store.state.card.card)) {
        if (elem.amount > 0) {
          obj.card[key] = elem.amount;
        }
        if (elem.foundShiny) {
          if (obj.shiny === undefined) {
            obj.shiny = [];
          }
          obj.shiny.push(key);
        }
      }
      for (const [key, elem] of Object.entries(store.state.card.feature)) {
        if (elem.cardSelected.length > 0 || elem.cardEquipped.length > 0) {
          obj.feature[key] = { cardSelected: elem.cardSelected, cardEquipped: elem.cardEquipped };
        }
      }
      return obj;
    },
    loadGame(data) {
      if (data.card) {
        for (const [key, elem] of Object.entries(data.card)) {
          if (store.state.card.card[key]) {
            store.commit("card/updateKey", { type: "card", name: key, key: "amount", value: elem });
          }
        }
      }
      if (data.feature) {
        for (const [key, elem] of Object.entries(data.feature)) {
          if (store.state.card.feature[key]) {
            store.commit("card/updateKey", {
              type: "feature",
              name: key,
              key: "cardSelected",
              value: elem.cardSelected,
            });
            store.commit("card/updateKey", {
              type: "feature",
              name: key,
              key: "cardEquipped",
              value: elem.cardEquipped,
            });
          }
        }
      }
      if (data.shiny) {
        data.shiny.forEach((elem) => {
          store.commit("card/updateKey", { type: "card", name: elem, key: "foundShiny", value: true });
        });
      }
      store.dispatch("card/calculateCaches");
    },
  },
  "modules/cryolab": {
    name: "cryolab",
    tickspeed: 1,
    unlockNeeded: "cryolabFeature",
    tick(seconds) {
      for (const [key, elem] of Object.entries(store.state.cryolab)) {
        if (elem.active) {
          const expGain = store.getters["cryolab/expGain"](key);
          if (expGain > 0) {
            store.dispatch("cryolab/gainExp", { feature: key, amount: (expGain * seconds) / SECONDS_PER_DAY });
          }
        }
        const prestigeGain = store.getters["cryolab/prestigeGain"](key);
        for (const [currency, amount] of Object.entries(prestigeGain)) {
          if (currency === "farm_exp") {
            // Special handler for farm experience
            for (const [key, elem] of Object.entries(store.state.farm.crop)) {
              if (elem.found) {
                let amountLeft = (amount * elem.baseExpMult * seconds) / SECONDS_PER_DAY;
                while (amountLeft > 0) {
                  const levelDiff = elem.levelMax - elem.level;
                  if (levelDiff <= 0) {
                    amountLeft = 0;
                    break;
                  }
                  const expToNext = store.getters["farm/expNeeded"](key) - elem.exp;
                  const amountGiven = Math.min(expToNext, amountLeft * levelDiff);
                  store.dispatch("farm/getCropExp", { crop: key, value: amountGiven });
                  amountLeft -= amountGiven / levelDiff;
                }
              }
            }
          } else {
            const split = currency.split("_");
            store.dispatch("currency/gain", {
              feature: split[0],
              name: split[1],
              amount: (amount * seconds) / SECONDS_PER_DAY,
            });
          }
        }
      }
    },
    unlock: ["cryolabFeature"],
    mult: { cryolabMaxFeatures: { round: true, baseValue: 1 } },
    note: buildArray(2).map(() => "g"),
    init() {
      for (const [key, elem] of Object.entries(store.state.system.features)) {
        let obj = { name: key, unlock: elem.unlock };
        if (data[key] !== undefined) {
          obj.data = data[key];
        }
        if (effect[key] !== undefined) {
          obj.effect = effect[key];
        }
        if (elem.main) {
          store.dispatch("cryolab/init", obj);
        }
      }
    },
    saveGame() {
      let obj = {};
      for (const [key, elem] of Object.entries(store.state.cryolab)) {
        if (elem.active || elem.exp.find((elem) => elem > 0) || elem.level.find((elem) => elem > 0)) {
          obj[key] = { active: elem.active, exp: elem.exp, level: elem.level };
        }
      }
      return obj;
    },
    loadGame(data) {
      for (const [key, elem] of Object.entries(data)) {
        if (store.state.cryolab[key] !== undefined) {
          store.commit("cryolab/updateKey", { name: key, key: "active", value: elem.active });
          elem.exp.forEach((value, index) => {
            store.commit("cryolab/updateSubfeatureKey", { name: key, subfeature: index, key: "exp", value });
          });
          elem.level.forEach((value, index) => {
            store.commit("cryolab/updateSubfeatureKey", { name: key, subfeature: index, key: "level", value });
            store.dispatch("cryolab/applyLevelEffects", { feature: key, subfeature: index });
          });
        }
      }
    },
  },
  "modules/event/bank/project": {
    expandVault: {
      price: (lvl) => getSequence(2, lvl) * 500 + 2000,
      effect: [{ name: "currencyGemTopazCap", type: "base", value: (lvl) => lvl * 300 }],
    },
    persuadeInvestors: {
      price: (lvl) => getSequence(2, lvl) * 500 + 2000,
      effect: [{ name: "currencySchoolGoldenDustCap", type: "base", value: (lvl) => lvl * 4000 }],
    },
    improveCreditScore: {
      price: (lvl) => getSequence(2, lvl) * 500 + 2000,
      effect: [
        { name: "bankInvestmentSize", type: "base", value: (lvl) => lvl * 200 },
        { name: "bankLoanSize", type: "base", value: (lvl) => lvl * 200 },
      ],
    },
    businessMarketing: {
      price: (lvl) => getSequence(2, lvl) * 500 + 2000,
      effect: [{ name: "merchantOffers", type: "base", value: (lvl) => lvl }],
    },
    cardTournament: {
      price: (lvl) => getSequence(2, lvl) * 500 + 2000,
      effect: [{ name: "bankCardPackChance", type: "base", value: (lvl) => 0.5 - Math.pow(0.8, lvl) * 0.5 }],
    },
  },
  "modules/event/big": {
    cinders: {
      // 20 days
      start: "01-15",
      end: "02-03",
      color: "amber",
      currency: "wax",
      token: "cindersToken",
    },
    bloom: {
      // 23 days
      start: "03-09",
      end: "03-31",
      color: "light-green",
      currency: "humus",
      token: "bloomToken",
    },
    weatherChaos: {
      // 18 days
      start: "05-22",
      end: "06-08",
      color: "grey",
      currency: "cloud",
      token: "weatherChaosToken",
    },
    summerFestival: {
      // 28 days
      start: "07-26",
      end: "08-22",
      color: "orange-red",
      currency: "cocktail",
      token: "summerFestivalToken",
    },
    nightHunt: {
      // 16 days
      start: "10-04",
      end: "10-19",
      color: "deep-purple",
      currency: "magic",
      token: "nightHuntToken",
    },
    snowdown: {
      // 21 days
      start: "11-25",
      end: "12-15",
      color: "skyblue",
      currency: "snowball",
      token: "snowdownToken",
    },
  },
  "modules/event/bloom/prize": {
    theme_colorful: { type: "theme", item: "colorful", pool: { bloom: { price: { event_bloomToken: 180 } } } },
    relic_colorfulFlower: {
      type: "relic",
      item: "colorfulFlower",
      requirement() {
        return store.state.unlock.farmFeature.see;
      },
      pool: { bloom: { price: { event_bloomToken: 170 } } },
    },
    relic_heatingBulb: {
      type: "relic",
      item: "heatingBulb",
      requirement() {
        return store.state.unlock.galleryInspiration.see;
      },
      pool: { bloom: { price: { event_bloomToken: 200 } } },
    },
    cardPack_greenThumb: { type: "cardPack", item: "greenThumb", pool: { bloom: { price: { event_bloomToken: 30 } } } },
    farm_superFlower: {
      type: "consumable",
      item: "farm_superFlower",
      amount: 20,
      requirement() {
        return store.state.unlock.farmFertilizer.see;
      },
      pool: { bloom: { price: { event_bloomToken: 1 } } },
    },
  },
  "modules/event/bloom/upgrade": {
    colorfulSeedBag: {
      type: "bloom",
      cap: 5,
      hideCap: true,
      price(lvl) {
        return {
          event_blossom: [buildNum(1, "M"), buildNum(1, "Qa"), buildNum(1, "O"), buildNum(1, "TD"), buildNum(1, "ND")][
            lvl
          ],
        };
      },
      effect: [
        { name: "bloomPoppyFlower", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "bloomIrisFlower", type: "unlock", value: (lvl) => lvl >= 2 },
        { name: "bloomLilyFlower", type: "unlock", value: (lvl) => lvl >= 3 },
        { name: "bloomOrchidFlower", type: "unlock", value: (lvl) => lvl >= 4 },
        { name: "bloomCornflowerFlower", type: "unlock", value: (lvl) => lvl >= 5 },
      ],
    },
    flowerPot: {
      type: "bloom",
      price(lvl) {
        return { event_blossom: Math.pow(10, lvl) * 100 };
      },
      effect: [{ name: "bloomInventorySize", type: "base", value: (lvl) => lvl }],
    },
    daisyProtection: {
      type: "bloom",
      price(lvl) {
        return { event_blossom: Math.pow(lvl * 0.05 + 1.3, lvl) * 2500 };
      },
      effect: [{ name: "bloomDaisyChance", type: "base", value: (lvl) => lvl * 0.05 }],
    },
    poppyProtection: {
      type: "bloom",
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 1;
      },
      price(lvl) {
        return { event_blossom: Math.pow(lvl * 0.05 + 1.3, lvl) * buildNum(12, "M") };
      },
      effect: [{ name: "bloomPoppyChance", type: "base", value: (lvl) => lvl * 0.05 }],
    },
    poppyFertilizer: {
      type: "bloom",
      cap: 15,
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 1;
      },
      price(lvl) {
        return { event_blossom: Math.pow(2, lvl) * buildNum(60, "M") };
      },
      effect: [{ name: "bloomPoppyBreedTime", type: "base", value: (lvl) => lvl * -20 }],
    },
    irisProtection: {
      type: "bloom",
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 2;
      },
      price(lvl) {
        return { event_blossom: Math.pow(lvl * 0.05 + 1.3, lvl) * buildNum(18, "T") };
      },
      effect: [{ name: "bloomIrisChance", type: "base", value: (lvl) => lvl * 0.05 }],
    },
    irisFertilizer: {
      type: "bloom",
      cap: 20,
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 2;
      },
      price(lvl) {
        return { event_blossom: Math.pow(2.3, lvl) * buildNum(80, "T") };
      },
      effect: [{ name: "bloomIrisBreedTime", type: "base", value: (lvl) => lvl * -60 }],
    },
    lilyProtection: {
      type: "bloom",
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 3;
      },
      price(lvl) {
        return { event_blossom: Math.pow(lvl * 0.05 + 1.3, lvl) * buildNum(25, "Sx") };
      },
      effect: [{ name: "bloomLilyChance", type: "base", value: (lvl) => lvl * 0.05 }],
    },
    lilyFertilizer: {
      type: "bloom",
      cap: 30,
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 3;
      },
      price(lvl) {
        return { event_blossom: Math.pow(2.2, lvl) * buildNum(130, "Sx") };
      },
      effect: [{ name: "bloomLilyBreedTime", type: "base", value: (lvl) => lvl * -120 }],
    },
    orchidProtection: {
      type: "bloom",
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 4;
      },
      price(lvl) {
        return { event_blossom: Math.pow(lvl * 0.05 + 1.3, lvl) * buildNum(35, "D") };
      },
      effect: [{ name: "bloomOrchidChance", type: "base", value: (lvl) => lvl * 0.05 }],
    },
    orchidFertilizer: {
      type: "bloom",
      cap: 40,
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 4;
      },
      price(lvl) {
        return { event_blossom: Math.pow(2.15, lvl) * buildNum(175, "D") };
      },
      effect: [{ name: "bloomOrchidBreedTime", type: "base", value: (lvl) => lvl * -240 }],
    },
    cornflowerProtection: {
      type: "bloom",
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 5;
      },
      price(lvl) {
        return { event_blossom: Math.pow(lvl * 0.05 + 1.3, lvl) * buildNum(50, "QiD") };
      },
      effect: [{ name: "bloomCornflowerChance", type: "base", value: (lvl) => lvl * 0.05 }],
    },
    cornflowerFertilizer: {
      type: "bloom",
      cap: 40,
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 5;
      },
      price(lvl) {
        return { event_blossom: Math.pow(2.6, lvl) * buildNum(260, "QiD") };
      },
      effect: [{ name: "bloomCornflowerBreedTime", type: "base", value: (lvl) => lvl * -480 }],
    }, // topaz upgrades
    greenhouse: {
      type: "bloom",
      cap: 3,
      price(lvl) {
        return { gem_topaz: lvl * 500 + 500 };
      },
      effect: [{ name: "bloomBreederSize", type: "base", value: (lvl) => lvl }],
    },
    hugeVase: {
      type: "bloom",
      cap: 1,
      price() {
        return { gem_topaz: 1000 };
      },
      effect: [{ name: "bloomInventorySize", type: "mult", value: (lvl) => lvl + 1 }],
    },
    framedDaisy: {
      type: "bloom",
      cap: 1,
      price() {
        return { gem_topaz: 500 };
      },
      effect: [
        { name: "bloomDaisyChance", type: "base", value: (lvl) => lvl * 0.35 },
        { name: "bloomDaisyChance", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
      ],
    },
    framedPoppy: {
      type: "bloom",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 1;
      },
      price() {
        return { gem_topaz: 600 };
      },
      effect: [
        { name: "bloomInventorySize", type: "base", value: (lvl) => lvl * 8 },
        { name: "bloomPoppyChance", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
      ],
    },
    framedIris: {
      type: "bloom",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 2;
      },
      price() {
        return { gem_topaz: 700 };
      },
      effect: [
        { name: "currencyEventBlossomGain", type: "mult", value: (lvl) => lvl * 2 + 1 },
        { name: "bloomIrisChance", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
      ],
    },
    framedLily: {
      type: "bloom",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_colorfulSeedBag.level >= 3;
      },
      price() {
        return { gem_topaz: 800 };
      },
      effect: [
        { name: "bloomDaisyChance", type: "base", value: (lvl) => lvl * 2 },
        { name: "bloomPoppyChance", type: "base", value: (lvl) => lvl * 1.5 },
        { name: "bloomIrisChance", type: "base", value: (lvl) => lvl },
        { name: "bloomLilyChance", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
      ],
    },
  },
  "modules/event/card": {
    feature: {
      prefix: "EV",
      reward: [{ name: "currencyGemTopazCap", type: "base", value: (lvl) => lvl * 5 }],
      shinyReward: [{ name: "currencyGemTopazCap", type: "base", value: (lvl) => lvl * 5 }],
      unlock: "eventFeature",
    },
    collection: {
      weekendTrip: { reward: [{ name: "currencyGemTopazCap", type: "base", value: 50 }] },
      tropicalParadise: { reward: [{ name: "currencyGemTopazCap", type: "base", value: 50 }] },
      coldTimes: { reward: [{ name: "currencyGemTopazCap", type: "base", value: 50 }] },
    },
    pack: {
      goodDeal: {
        unlock: "merchantEvent",
        amount: 1,
        content: { ...gemTable, ...smallTable, "EV-0005": 2, "EV-0006": 2, "EV-0007": 2 },
      },
      connectedLine: { unlock: "bingoCasinoEvent", amount: 1, content: { ...gemTable, ...smallTable, "EV-0008": 6 } },
      feelingLucky: {
        unlock: "wheelOfFortuneCasinoEvent",
        amount: 1,
        content: { ...gemTable, ...smallTable, "EV-0009": 6 },
      },
      investorsDream: {
        unlock: "bankEvent",
        amount: 3,
        content: { ...gemTable, ...smallTable, "EV-0011": 2, "EV-0012": 2, "EV-0013": 2 },
      },
      greenThumb: {
        unlock: "bloomEvent",
        amount: 1,
        content: { ...gemTable, ...summerTable, "EV-0018": 3, "EV-0019": 3 },
      },
      fishingForFun: {
        unlock: "weatherChaosEvent",
        amount: 1,
        content: { ...gemTable, ...summerTable, "EV-0020": 3, "EV-0021": 3 },
      },
      charmingShip: {
        unlock: "summerFestivalEvent",
        amount: 1,
        content: { ...gemTable, ...summerTable, "EV-0022": 3, "EV-0023": 3 },
      },
      midnightAnomaly: {
        unlock: "nightHuntEvent",
        amount: 1,
        content: { ...gemTable, ...winterTable, "EV-0028": 3, "EV-0029": 3 },
      },
      icyWonderland: {
        unlock: "snowdownEvent",
        amount: 1,
        content: { ...gemTable, ...winterTable, "EV-0030": 3, "EV-0031": 3 },
      },
      sparksOfJoy: {
        unlock: "cindersEvent",
        amount: 1,
        content: { ...gemTable, ...winterTable, "EV-0032": 3, "EV-0033": 3 },
      },
    },
    card: cardList,
  },
  "modules/event/cinders/prize": {
    theme_candlelight: {
      type: "theme",
      item: "candlelight",
      pool: { cinders: { price: { event_cindersToken: 170 } } },
    },
    relic_geode: { type: "relic", item: "geode", pool: { cinders: { price: { event_cindersToken: 140 } } } },
    relic_birthdayCake: {
      type: "relic",
      item: "birthdayCake",
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: { cinders: { price: { event_cindersToken: 180 } } },
    },
    cardPack_sparksOfJoy: {
      type: "cardPack",
      item: "sparksOfJoy",
      pool: { cinders: { price: { event_cindersToken: 30 } } },
    },
    farm_sunshine: {
      type: "consumable",
      item: "farm_sunshine",
      amount: 20,
      requirement() {
        return store.state.unlock.farmFertilizer.see;
      },
      pool: { cinders: { price: { event_cindersToken: 1 } } },
    },
  },
  "modules/event/cinders/producer": {
    firefly: {
      type: "cindersProducer",
      icon: "mdi-bee",
      price(lvl) {
        return lvl > 0
          ? { event_light: store.getters["mult/get"]("cindersNonFirstProducerCost", 1000 * Math.pow(1.15, lvl)) }
          : {};
      },
    },
    glowshroom: {
      type: "cindersProducer",
      icon: "mdi-mushroom",
      requirement() {
        return store.state.upgrade.item.event_firefly.level > 0;
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            lvl > 0 ? "cindersNonFirstProducerCost" : "cindersFirstProducerCost",
            buildNum(50, "M") * Math.pow(1.16, lvl),
          ),
        };
      },
    },
    glowfish: {
      type: "cindersProducer",
      icon: "mdi-fish",
      requirement() {
        return store.state.upgrade.item.event_glowshroom.level > 0;
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            lvl > 0 ? "cindersNonFirstProducerCost" : "cindersFirstProducerCost",
            buildNum(3, "T") * Math.pow(1.17, lvl),
          ),
        };
      },
    },
    lantern: {
      type: "cindersProducer",
      icon: "mdi-lamp",
      requirement() {
        return store.state.upgrade.item.event_glowfish.level > 0;
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            lvl > 0 ? "cindersNonFirstProducerCost" : "cindersFirstProducerCost",
            buildNum(240, "Qa") * Math.pow(1.18, lvl),
          ),
        };
      },
    },
    campfire: {
      type: "cindersProducer",
      icon: "mdi-campfire",
      requirement() {
        return store.state.upgrade.item.event_lantern.level > 0;
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            lvl > 0 ? "cindersNonFirstProducerCost" : "cindersFirstProducerCost",
            buildNum(24, "Sx") * Math.pow(1.19, lvl),
          ),
        };
      },
    },
    coral: {
      type: "cindersProducer",
      icon: "mdi-spa",
      requirement() {
        return store.state.upgrade.item.event_campfire.level > 0;
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            lvl > 0 ? "cindersNonFirstProducerCost" : "cindersFirstProducerCost",
            buildNum(3.6, "O") * Math.pow(1.2, lvl),
          ),
        };
      },
    },
    jellyfish: {
      type: "cindersProducer",
      icon: "mdi-jellyfish",
      requirement() {
        return store.state.upgrade.item.event_coral.level > 0;
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            lvl > 0 ? "cindersNonFirstProducerCost" : "cindersFirstProducerCost",
            buildNum(720, "N") * Math.pow(1.25, lvl),
          ),
        };
      },
    },
    nightbloom: {
      type: "cindersProducer",
      icon: "mdi-flower",
      requirement() {
        return store.state.upgrade.item.event_jellyfish.level > 0;
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            lvl > 0 ? "cindersNonFirstProducerCost" : "cindersFirstProducerCost",
            buildNum(180, "UD") * Math.pow(1.3, lvl),
          ),
        };
      },
    },
    neonlight: {
      type: "cindersProducer",
      icon: "mdi-ruler",
      requirement() {
        return store.state.upgrade.item.event_nightbloom.level > 0;
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            lvl > 0 ? "cindersNonFirstProducerCost" : "cindersFirstProducerCost",
            buildNum(54, "TD") * Math.pow(1.35, lvl),
          ),
        };
      },
    },
    sun: {
      type: "cindersProducer",
      icon: "mdi-white-balance-sunny",
      requirement() {
        return store.state.upgrade.item.event_neonlight.level > 0;
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            lvl > 0 ? "cindersNonFirstProducerCost" : "cindersFirstProducerCost",
            buildNum(27, "QiD") * Math.pow(1.5, lvl),
          ),
        };
      },
    },
  },
  "modules/event/cinders/upgrade": {
    moonglow: {
      type: "cinders",
      price(lvl) {
        return {
          event_light: store.getters["mult/get"]("cindersUpgradeLightCost", Math.pow(1000, lvl) * buildNum(1, "M")),
        };
      },
      effect: [{ name: "currencyEventLightGain", type: "mult", value: (lvl) => Math.pow(3, lvl) }],
    }, // 25 + 50x milestones
    burningFly: {
      type: "cinders",
      requirement(lvl) {
        return (
          store.state.upgrade.item.event_firefly.level >=
          store.getters["mult/get"]("cindersUpgradeProducerRequirement", lvl >= 1 ? lvl * 50 : 25)
        );
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            "cindersUpgradeLightCost",
            Math.pow(1.15, lvl >= 1 ? lvl * 50 : 25) * 5000,
          ),
        };
      },
      effect: [
        { name: "cindersProductionFirefly", type: "base", value: (lvl) => (lvl < 2 ? [0, 1][lvl] : 4) },
        { name: "cindersProductionFirefly", type: "mult", value: (lvl) => (lvl > 2 ? Math.pow(5, lvl - 2) : null) },
      ],
    },
    moreSpores: {
      type: "cinders",
      requirement(lvl) {
        return (
          store.state.upgrade.item.event_glowshroom.level >=
          store.getters["mult/get"]("cindersUpgradeProducerRequirement", lvl >= 1 ? lvl * 50 : 25)
        );
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            "cindersUpgradeLightCost",
            Math.pow(1.16, lvl >= 1 ? lvl * 50 : 25) * buildNum(250, "M"),
          ),
        };
      },
      effect: [
        { name: "cindersProductionGlowshroom", type: "base", value: (lvl) => (lvl < 2 ? [0, 60][lvl] : 225) },
        { name: "cindersProductionGlowshroom", type: "mult", value: (lvl) => (lvl > 2 ? Math.pow(5, lvl - 2) : null) },
      ],
    },
    fins: {
      type: "cinders",
      requirement(lvl) {
        return (
          store.state.upgrade.item.event_glowfish.level >=
          store.getters["mult/get"]("cindersUpgradeProducerRequirement", lvl >= 1 ? lvl * 50 : 25)
        );
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            "cindersUpgradeLightCost",
            Math.pow(1.17, lvl >= 1 ? lvl * 50 : 25) * buildNum(15, "T"),
          ),
        };
      },
      effect: [
        {
          name: "cindersProductionGlowfish",
          type: "base",
          value: (lvl) => (lvl < 2 ? [0, 3500][lvl] : buildNum(14, "K")),
        },
        { name: "cindersProductionGlowfish", type: "mult", value: (lvl) => (lvl > 2 ? Math.pow(5, lvl - 2) : null) },
      ],
    },
    lamppost: {
      type: "cinders",
      requirement(lvl) {
        return (
          store.state.upgrade.item.event_lantern.level >=
          store.getters["mult/get"]("cindersUpgradeProducerRequirement", lvl >= 1 ? lvl * 50 : 25)
        );
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            "cindersUpgradeLightCost",
            Math.pow(1.18, lvl >= 1 ? lvl * 50 : 25) * buildNum(1.2, "Qi"),
          ),
        };
      },
      effect: [
        {
          name: "cindersProductionLantern",
          type: "base",
          value: (lvl) => (lvl < 2 ? [0, buildNum(150, "K")][lvl] : buildNum(600, "K")),
        },
        { name: "cindersProductionLantern", type: "mult", value: (lvl) => (lvl > 2 ? Math.pow(5, lvl - 2) : null) },
      ],
    },
    campfireStories: {
      type: "cinders",
      requirement(lvl) {
        return (
          store.state.upgrade.item.event_campfire.level >=
          store.getters["mult/get"]("cindersUpgradeProducerRequirement", lvl >= 1 ? lvl * 50 : 25)
        );
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            "cindersUpgradeLightCost",
            Math.pow(1.19, lvl >= 1 ? lvl * 50 : 25) * buildNum(120, "Sx"),
          ),
        };
      },
      effect: [
        {
          name: "cindersProductionCampfire",
          type: "base",
          value: (lvl) => (lvl < 2 ? [0, buildNum(10, "M")][lvl] : buildNum(40, "M")),
        },
        { name: "cindersProductionCampfire", type: "mult", value: (lvl) => (lvl > 2 ? Math.pow(5, lvl - 2) : null) },
      ],
    },
    sponge: {
      type: "cinders",
      requirement(lvl) {
        return (
          store.state.upgrade.item.event_coral.level >=
          store.getters["mult/get"]("cindersUpgradeProducerRequirement", lvl >= 1 ? lvl * 50 : 25)
        );
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            "cindersUpgradeLightCost",
            Math.pow(1.2, lvl >= 1 ? lvl * 50 : 25) * buildNum(18, "O"),
          ),
        };
      },
      effect: [
        {
          name: "cindersProductionCoral",
          type: "base",
          value: (lvl) => (lvl < 2 ? [0, buildNum(700, "M")][lvl] : buildNum(2.2, "B")),
        },
        { name: "cindersProductionCoral", type: "mult", value: (lvl) => (lvl > 2 ? Math.pow(5, lvl - 2) : null) },
      ],
    },
    longerTentacles: {
      type: "cinders",
      requirement(lvl) {
        return (
          store.state.upgrade.item.event_jellyfish.level >=
          store.getters["mult/get"]("cindersUpgradeProducerRequirement", lvl >= 1 ? lvl * 50 : 25)
        );
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            "cindersUpgradeLightCost",
            Math.pow(1.25, lvl >= 1 ? lvl * 50 : 25) * buildNum(3.6, "D"),
          ),
        };
      },
      effect: [
        {
          name: "cindersProductionJellyfish",
          type: "base",
          value: (lvl) => (lvl < 2 ? [0, buildNum(30, "B")][lvl] : buildNum(120, "B")),
        },
        { name: "cindersProductionJellyfish", type: "mult", value: (lvl) => (lvl > 2 ? Math.pow(5, lvl - 2) : null) },
      ],
    },
    nightTime: {
      type: "cinders",
      requirement(lvl) {
        return (
          store.state.upgrade.item.event_nightbloom.level >=
          store.getters["mult/get"]("cindersUpgradeProducerRequirement", lvl >= 1 ? lvl * 50 : 25)
        );
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            "cindersUpgradeLightCost",
            Math.pow(1.3, lvl >= 1 ? lvl * 50 : 25) * buildNum(900, "UD"),
          ),
        };
      },
      effect: [
        {
          name: "cindersProductionNightbloom",
          type: "base",
          value: (lvl) => (lvl < 2 ? [0, buildNum(1.1, "T")][lvl] : buildNum(4.5, "T")),
        },
        { name: "cindersProductionNightbloom", type: "mult", value: (lvl) => (lvl > 2 ? Math.pow(5, lvl - 2) : null) },
      ],
    },
    city: {
      type: "cinders",
      requirement(lvl) {
        return (
          store.state.upgrade.item.event_neonlight.level >=
          store.getters["mult/get"]("cindersUpgradeProducerRequirement", lvl >= 1 ? lvl * 50 : 25)
        );
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            "cindersUpgradeLightCost",
            Math.pow(1.35, lvl >= 1 ? lvl * 50 : 25) * buildNum(270, "TD"),
          ),
        };
      },
      effect: [
        {
          name: "cindersProductionNeonlight",
          type: "base",
          value: (lvl) => (lvl < 2 ? [0, buildNum(30, "T")][lvl] : buildNum(110, "T")),
        },
        { name: "cindersProductionNeonlight", type: "mult", value: (lvl) => (lvl > 2 ? Math.pow(5, lvl - 2) : null) },
      ],
    },
    moreHelium: {
      type: "cinders",
      requirement(lvl) {
        return (
          store.state.upgrade.item.event_sun.level >=
          store.getters["mult/get"]("cindersUpgradeProducerRequirement", lvl >= 1 ? lvl * 50 : 25)
        );
      },
      price(lvl) {
        return {
          event_light: store.getters["mult/get"](
            "cindersUpgradeLightCost",
            Math.pow(1.5, lvl >= 1 ? lvl * 50 : 25) * buildNum(135, "QiD"),
          ),
        };
      },
      effect: [
        {
          name: "cindersProductionSun",
          type: "base",
          value: (lvl) => (lvl < 2 ? [0, buildNum(1, "Qa")][lvl] : buildNum(4, "Qa")),
        },
        { name: "cindersProductionSun", type: "mult", value: (lvl) => (lvl > 2 ? Math.pow(5, lvl - 2) : null) },
      ],
    }, // soot upgrades
    furiousFly: {
      type: "cinders",
      cap: 6,
      requirement() {
        return store.state.upgrade.item.event_firefly.level > 0;
      },
      price(lvl) {
        return { event_soot: lvl * 4 + 20 };
      },
      effect: [{ name: "cindersProductionFirefly", type: "base", value: (lvl) => lvl * 2 }],
    },
    mycelium: {
      type: "cinders",
      cap: 6,
      requirement() {
        return store.state.upgrade.item.event_glowshroom.level > 0;
      },
      price(lvl) {
        return { event_soot: lvl * 5 + 25 };
      },
      effect: [{ name: "cindersProductionGlowshroom", type: "base", value: (lvl) => lvl * 60 }],
    },
    gills: {
      type: "cinders",
      cap: 6,
      requirement() {
        return store.state.upgrade.item.event_glowfish.level > 0;
      },
      price(lvl) {
        return { event_soot: lvl * 6 + 30 };
      },
      effect: [{ name: "cindersProductionGlowfish", type: "base", value: (lvl) => lvl * 4300 }],
    },
    dimmer: {
      type: "cinders",
      cap: 6,
      requirement() {
        return store.state.upgrade.item.event_lantern.level > 0;
      },
      price(lvl) {
        return { event_soot: lvl * 7 + 35 };
      },
      effect: [{ name: "cindersProductionLantern", type: "base", value: (lvl) => lvl * buildNum(160, "K") }],
    },
    marshmallows: {
      type: "cinders",
      cap: 6,
      requirement() {
        return store.state.upgrade.item.event_campfire.level > 0;
      },
      price(lvl) {
        return { event_soot: lvl * 8 + 40 };
      },
      effect: [{ name: "cindersProductionCampfire", type: "base", value: (lvl) => lvl * buildNum(10.4, "M") }],
    },
    anemone: {
      type: "cinders",
      cap: 6,
      requirement() {
        return store.state.upgrade.item.event_coral.level > 0;
      },
      price(lvl) {
        return { event_soot: lvl * 9 + 45 };
      },
      effect: [{ name: "cindersProductionCoral", type: "base", value: (lvl) => lvl * buildNum(600, "M") }],
    },
    toxin: {
      type: "citem.event_jellyfish.level      },
      effect: [{ name: "cindersProductionJellyfish", type: "base", value: (lvl) => lvl * buildNum(31, "B") }],
    },
    fullMoon: {
      type: "cinders",
      cap: 6,
      requirement() {
        return store.state.upgrade.item.event_nightbloom.level > 0;
      },
      price(lvl) {
        return { event_soot: lvl * 11 + 55 };
      },
      effect: [{ name: "cindersProductionNightbloom", type: "base", value: (lvl) => lvl * buildNum(1.2, "T") }],
    },
    ads: {
      type: "cinders",
      cap: 6,
      requirement() {
        return store.state.upgrade.item.event_neonlight.level > 0;
      },
      price(lvl) {
        return { event_soot: lvl * 12 + 60 };
      },
      effect: [{ name: "cindersProductionNeonlight", type: "base", value: (lvl) => lvl * buildNum(30, "T") }],
    },
    lessDistance: {
      type: "cinders",
      cap: 6,
      requirement() {
        return store.state.upgrade.item.event_sun.level > 0;
      },
      price(lvl) {
        return { event_soot: lvl * 13 + 65 };
      },
      effect: [{ name: "cindersProductionSun", type: "base", value: (lvl) => lvl * buildNum(1, "Qa") }],
    }, // enlightenments
    fireflyEnlightened: {
      type: "cinders",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_firefly.level > 0;
      },
      price() {
        return { gem_topaz: 400 };
      },
      effect: [{ name: "cindersProductionFirefly", type: "mult", value: (lvl) => (lvl >= 1 ? 10 : null) }],
    },
    glowshroomEnlightened: {
      type: "cinders",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_glowshroom.level > 0;
      },
      price() {
        return { gem_topaz: 500 };
      },
      effect: [{ name: "currencyEventLightGain", type: "mult", value: (lvl) => (lvl >= 1 ? 1.5 : null) }],
    },
    glowfishEnlightened: {
      type: "cinders",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_glowfish.level > 0;
      },
      price() {
        return { gem_topaz: 600 };
      },
      effect: [
        { name: "cindersFirstProducerCost", type: "mult", value: (lvl) => (lvl >= 1 ? 0.25 : null) },
        { name: "currencyEventLightGain", type: "mult", value: (lvl) => (lvl >= 1 ? 1.5 : null) },
      ],
    },
    lanternEnlightened: {
      type: "cinders",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_lantern.level > 0;
      },
      price() {
        return { gem_topaz: 700 };
      },
      effect: [
        { name: "currencyEventSootGain", type: "mult", value: (lvl) => (lvl >= 1 ? 2 : null) },
        { name: "currencyEventLightGain", type: "mult", value: (lvl) => (lvl >= 1 ? 1.5 : null) },
      ],
    },
    campfireEnlightened: {
      type: "cinders",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_campfire.level > 0;
      },
      price() {
        return { gem_topaz: 800 };
      },
      effect: [
        { name: "currencyEventCindersTokenGain", type: "mult", value: (lvl) => (lvl >= 1 ? 1.05 : null) },
        { name: "currencyEventLightGain", type: "mult", value: (lvl) => (lvl >= 1 ? 1.5 : null) },
      ],
    },
    coralEnlightened: {
      type: "cinders",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_coral.level > 0;
      },
      price() {
        return { gem_topaz: 900 };
      },
      effect: [
        { name: "cindersUpgradeProducerRequirement", type: "base", value: (lvl) => (lvl >= 1 ? -10 : null) },
        { name: "currencyEventLightGain", type: "mult", value: (lvl) => (lvl >= 1 ? 1.5 : null) },
      ],
    },
    jellyfishEnlightened: {
      type: "cinders",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_jellyfish.level > 0;
      },
      price() {
        return { gem_topaz: 1000 };
      },
      effect: [
        { name: "cindersCandlePower", type: "mult", value: (lvl) => (lvl >= 1 ? 2 : null) },
        { name: "currencyEventLightGain", type: "mult", value: (lvl) => (lvl >= 1 ? 1.5 : null) },
      ],
    },
    nightbloomEnlightened: {
      type: "cinders",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_nightbloom.level > 0;
      },
      price() {
        return { gem_topaz: 1100 };
      },
      effect: [
        { name: "cindersNonFirstProducerCost", type: "mult", value: (lvl) => (lvl >= 1 ? 0.5 : null) },
        { name: "currencyEventLightGain", type: "mult", value: (lvl) => (lvl >= 1 ? 1.5 : null) },
      ],
    },
    neonlightEnlightened: {
      type: "cinders",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_neonlight.level > 0;
      },
      price() {
        return { gem_topaz: 1200 };
      },
      effect: [
        { name: "cindersUpgradeLightCost", type: "mult", value: (lvl) => (lvl >= 1 ? 0.5 : null) },
        { name: "currencyEventLightGain", type: "mult", value: (lvl) => (lvl >= 1 ? 1.5 : null) },
      ],
    },
    sunEnlightened: {
      type: "cinders",
      cap: 1,
      requirement() {
        return store.state.upgrade.item.event_sun.level > 0;
      },
      price() {
        return { gem_topaz: 1300 };
      },
      effect: [
        { name: "cindersProductionFirefly", type: "mult", value: (lvl) => (lvl >= 1 ? 2 : null) },
        { name: "cindersProductionGlowshroom", type: "mult", value: (lvl) => (lvl >= 1 ? 1.9 : null(lvl >= 1 ? 1.8 : null) },
    ? 1.7 : null) },
        { name: "cindersProductionCampfire", type: "mult", value: (lvl) => (lvl >= 1 ? 1.6 : null) },
        { name: "cindersProductionCoral", type: "mult", value: (lvl) => (lvl >= 1 ? 1.5 : null) },
        { name: "cindersProductionJellyfish", type: "mult", value: (lvl) => (lvl >= 1 ? 1.4 : null) },
        { name: "cindersProductionNightbloom", type: "mult", value: (lvl) => (lvl >= 1 ? 1.3 : null) },
        { name: "cindersProductionNeonlight", type: "mult", value: (lvl) => (lvl >= 1 ? 1.2 : null) },
        { name: "cindersProductionSun", type: "mult", value: (lvl) => (lvl >= 1 ? 1.1 : null) },
        { name: "currencyEventLightGain", type: "mult", value: (lvl) => (lvl >= 1 ? 1.5 : null) },
      ],
    },
  },
  "modules/event/nightHunt/ingredientStat": {
    lavender: [{ name: "nightHuntRitualFamiliarity", type: "base", value: 0.03 }],
    mapleLeaf: [{ name: "nightHuntRitualHintChance", type: "base", value: 0.1 }],
    fourLeafClover: [{ name: "nightHuntRitualSuccessChance", type: "base", value: 0.08 }],
    charredSkull: [{ name: "nightHuntRitualStability", type: "base", value: 0.12 }],
    mysticalWater: [
      { name: "nightHuntRitualSuccessChance", type: "base", value: 0.06 },
      { name: "nightHuntRitualStability", type: "base", value: 0.05 },
    ],
    cheese: [
      { name: "nightHuntRitualFamiliarity", type: "base", value: 0.05 },
      { name: "nightHuntRitualSuccessChance", type: "base", value: -0.18 },
      { name: "nightHuntRitualStability", type: "base", value: -0.05 },
    ],
    spiderWeb: [
      { name: "nightHuntRitualFamiliarity", type: "base", value: 0.01 },
      { name: "nightHuntRitualStability", type: "base", value: 0.1 },
    ],
    strangeEgg: [
      { name: "nightHuntRitualHintChance", type: "base", value: 0.075 },
      { name: "nightHuntRitualSuccessChance", type: "base", value: 0.05 },
    ],
    puzzlePiece: [
      { name: "nightHuntRitualHintChance", type: "base", value: 0.14 },
      { name: "nightHuntRitualStability", type: "base", value: -0.03 },
    ],
    wizardHat: [
      { name: "nightHuntRitualStability", type: "base", value: 0.04 },
      { name: "nightHuntRitualSuccessChance", type: "base", value: 0.04 },
      { name: "nightHuntRitualHintChance", type: "base", value: 0.04 },
      { name: "nightHuntRitualFamiliarity", type: "base", value: 0.01 },
    ],
    cactus: [
      { name: "nightHuntRitualStability", type: "base", value: -0.05 },
      { name: "nightHuntRitualSuccessChance", type: "base", value: 0.15 },
    ],
    feather: [
      { name: "nightHuntRitualFamiliarity", type: "base", value: 0.02 },
      { name: "nightHuntRitualHintChance", type: "base", value: 0.05 },
    ],
  },
  "modules/event/nightHunt/potion": {
    // Tier 1 potions
    power: {
      color: "red",
      recipe: [{ max: 3 }],
      effect: [{ name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 2 }],
    },
    insight: {
      color: "cyan",
      recipe: [{ min: 5, max: 6 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl },
        { name: "nightHuntRitualHintChance", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    }, // Tier 2 potions
    rage: {
      color: "orange-red",
      recipe: [{ max: 3 }, { max: 3 }],
      effect: [{ name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 6 }],
    },
    calming: {
      color: "lime",
      recipe: [{ max: 3 }, { max: 3 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 3 },
        { name: "nightHuntRitualStability", type: "base", value: (lvl) => lvl * 0.025 },
      ],
    },
    sorrow: {
      color: "skyblue",
      recipe: [{ max: 4 }, { max: 4 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 3 },
        { name: "nightHuntRitualSuccessChance", type: "base", value: (lvl) => lvl * 0.02 },
      ],
    },
    energy: {
      color: "amber",
      recipe: [{ max: 4 }, { max: 4 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 3 },
        { name: "currencyEventEssenceGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    nature: {
      color: "light-green",
      recipe: [{ min: 5, max: 6 }, { max: 6 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 3 },
        { name: "nightHuntRitualHintChance", type: "base", value: (lvl) => lvl * 0.02 },
      ],
    },
    intensity: {
      color: "pink",
      recipe: [{ min: 7, max: 8 }, { max: 8 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 3 },
        { name: "nightHuntRitualFamiliarity", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    }, // Tier 3 potions
    hysteria: {
      color: "red-pink",
      recipe: [{ max: 5 }, { max: 5 }, { max: 5 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 8 },
        { name: "nightHuntRitualStability", type: "base", value: (lvl) => lvl * 0.04 },
      ],
    },
    insanity: {
      color: "orange",
      recipe: [{ max: 5 }, { max: 5 }, { max: 5 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 8 },
        { name: "nightHuntRitualSuccessChance", type: "base", value: (lvl) => lvl * 0.04 },
      ],
    },
    patience: {
      color: "teal",
      recipe: [{ max: 6 }, { max: 6 }, { max: 6 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 8 },
        { name: "nightHuntRitualFamiliarity", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    },
    transformation: {
      color: "deep-purple",
      recipe: [{ max: 7 }, { max: 7 }, { max: 7 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 8 },
        { name: "currencyEventEssenceGain", type: "mult", value: (lvl) => lvl * 0.075 + 1 },
      ],
    },
    silence: {
      color: "blue",
      recipe: [{ min: 7, max: 8 }, { max: 8 }, { max: 8 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 8 },
        { name: "nightHuntRitualHintChance", type: "base", value: (lvl) => lvl * 0.02 },
      ],
    },
    photosynthesis: {
      color: "green",
      recipe: [{ min: 8, max: 9 }, { max: 9 }, { max: 9 }],
      effect: [{ name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 20 }],
    },
    sun: {
      color: "yellow",
      recipe: [{ min: 9, max: 10 }, { max: 10 }, { max: 10 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 8 },
        { name: "nightHuntRitualStability", type: "base", value: (lvl) => lvl * 0.02 },
        { name: "nightHuntRitualSuccessChance", type: "base", value: (lvl) => lvl * 0.02 },
      ],
    }, // Tier 4 potions
    growth: {
      color: "lime",
      recipe: [{ max: 7 }, { max: 7 }, { max: 7 }, { max: 7 }],
      effect: [{ name: "currencyEventEssenceGain", type: "mult", value: (lvl) => lvl * 0.12 + 1 }],
    },
    solidification: {
      color: "grey",
      recipe: [{ max: 7 }, { max: 7 }, { max: 7 }, { max: 7 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "nightHuntRitualSuccessChance", type: "base", value: (lvl) => lvl * 0.05 },
      ],
    },
    liquification: {
      color: "dark-blue",
      recipe: [{ max: 8 }, { max: 8 }, { max: 8 }, { max: 8 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 22 },
        { name: "currencyEventEssenceGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    glowing: {
      color: "yellow",
      recipe: [{ max: 8 }, { max: 8 }, { max: 8 }, { max: 8 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "nightHuntRitualStability", type: "mult", value: (lvl) => lvl * 0.01 + 1 },
      ],
    },
    stasis: {
      color: "light-blue",
      recipe: [{ min: 7, max: 8 }, { max: 8 }, { max: 8 }, { max: 8 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "nightHuntRitualSuccessChance", type: "mult", value: (lvl) => lvl * 0.01 + 1 },
      ],
    },
    creativity: {
      color: "pink",
      recipe: [{ min: 8, max: 9 }, { max: 9 }, { max: 9 }, { max: 9 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "base", value: (lvl) => lvl * 22 },
        { name: "nightHuntRitualHintChance", type: "base", value: (lvl) => lvl * 0.02 },
      ],
    },
    poison: {
      color: "green",
      recipe: [{ min: 9, max: 10 }, { max: 10 }, { max: 10 }, { max: 10 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "nightHuntRitualStability", type: "base", value: (lvl) => lvl * 0.05 },
      ],
    },
    warmth: {
      color: "orange",
      recipe: [{ min: 10, max: 11 }, { max: 11 }, { max: 11 }, { max: 11 }],
      effect: [
        { name: "currencyEventEssenceGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "nightHuntRitualFamiliarity", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    },
  },
  "modules/event/nightHunt/prize": {
    theme_autumnForest: {
      type: "theme",
      item: "autumnForest",
      pool: { nightHunt: { price: { event_nightHuntToken: 200 } } },
    },
    relic_massiveGrain: {
      type: "relic",
      item: "massiveGrain",
      requirement() {
        return store.state.unlock.farmFeature.see;
      },
      pool: { nightHunt: { price: { event_nightHuntToken: 170 } } },
    },
    relic_enchantedBottle: {
      type: "relic",
      item: "enchantedBottle",
      requirement() {
        return store.state.unlock.miningResin.see;
      },
      pool: { nightHunt: { price: { event_nightHuntToken: 175 } } },
    },
    cardPack_midnightAnomaly: {
      type: "cardPack",
      item: "midnightAnomaly",
      pool: { nightHunt: { price: { event_nightHuntToken: 30 } } },
    },
    farm_fieldBlessing: {
      type: "consumable",
      item: "farm_fieldBlessing",
      amount: 20,
      requirement() {
        return store.state.unlock.farmFertilizer.see;
      },
      pool: { nightHunt: { price: { event_nightHuntToken: 1 } } },
    },
  },
  "modules/event/nightHunt/upgrade": {
    essenceCondenser: {
      type: "nightHunt",
      price(lvl) {
        return { event_essence: Math.pow(8 + 0.25 * lvl, lvl) * 200 };
      },
      effect: [{ name: "currencyEventEssenceGain", type: "mult", value: (lvl) => Math.pow(1.25, lvl) }],
    },
    luckyCharm: {
      type: "nightHunt",
      price(lvl) {
        return { event_essence: Math.pow(1.5 + 0.02 * lvl, lvl) * 1000 };
      },
      effect: [{ name: "nightHuntRitualSuccessChance", type: "base", value: (lvl) => lvl * 0.03 }],
    },
    biggerCauldron: {
      type: "nightHunt",
      cap: 5,
      price(lvl) {
        return { event_essence: Math.pow(buildNum(100, "M"), getSequence(1, lvl)) * buildNum(10, "K") };
      },
      effect: [{ name: "nightHuntMaxIngredients", type: "base", value: (lvl) => lvl }],
    },
    potionShelf: {
      type: "nightHunt",
      cap: 8,
      requirement() {
        return store.state.upgrade.item.event_biggerCauldron.level > 0;
      },
      price(lvl) {
        return { event_essence: Math.pow(1000 * Math.pow(10, lvl), lvl) * buildNum(100, "K") };
      },
      effect: [
        { name: "nightHuntFindableIngredients", type: "base", value: (lvl) => lvl },
        { name: "nightHuntFavouriteIngredientSize", type: "base", value: (lvl) => lvl },
      ],
    },
    ritualChalk: {
      type: "nightHunt",
      cap: 3,
      requirement() {
        return store.state.upgrade.item.event_biggerCauldron.level > 0;
      },
      price(lvl) {
        return { event_essence: Math.pow(buildNum(10, "M"), Math.pow(lvl, 2)) * buildNum(50, "M") };
      },
      effect: [{ name: "nightHuntBonusIngredientCount", type: "base", value: (lvl) => lvl }],
    },
    stabilizer: {
      type: "nightHunt",
      requirement() {
        return store.state.upgrade.item.event_ritualChalk.level > 0;
      },
      price(lvl) {
        return { event_essence: Math.pow(1.75 + 0.03 * lvl, lvl) * buildNum(300, "M") };
      },
      effect: [{ name: "nightHuntRitualStability", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    pedestals: {
      type: "nightHunt",
      requirement() {
        return store.state.upgrade.item.event_ritualChalk.level > 0;
      },
      price(lvl) {
        return { event_essence: Math.pow(120, lvl) * buildNum(7.5, "B") };
      },
      effect: [{ name: "nightHuntBonusIngredientAmount", type: "base", value: (lvl) => lvl }],
    }, // topaz upgrades
    mystifier: {
      type: "nightHunt",
      price(lvl) {
        return { gem_topaz: lvl * 125 + 100 };
      },
      effect: [{ name: "currencyEventEssenceGain", type: "mult", value: (lvl) => Math.pow(3, lvl) }],
    },
    bundle: {
      type: "nightHunt",
      price(lvl) {
        return { gem_topaz: lvl * 250 + 350 };
      },
      effect: [
        { name: "nightHuntIngredientSize", type: "base", value: (lvl) => lvl * 3 },
        { name: "nightHuntFavouriteIngredientSize", type: "base", value: (lvl) => lvl },
      ],
    },
    bagOfCandy: {
      type: "nightHunt",
      requirement() {
        return store.state.upgrade.item.event_ritualChalk.level > 0;
      },
      price(lvl) {
        return { gem_topaz: lvl * 200 + 200 };
      },
      effect: [{ name: "nightHuntBonusIngredientAmount", type: "base", value: (lvl) => lvl }],
    },
  },
  "modules/event/prize": {
    // Card packs
    cardPack_goodDeal: {
      type: "cardPack",
      item: "goodDeal",
      weight: 5,
      cap: 10,
      pool: { merchant: { price: { gem_topaz: 75 } } },
    },
    cardPack_connectedLine: {
      type: "cardPack",
      item: "connectedLine",
      weight: 2,
      pool: { bingo2: { amount: 2 }, bingo3: { amount: 6 }, bingo4: { amount: 15, weight: 0.75 } },
    },
    cardPack_feelingLucky: {
      type: "cardPack",
      item: "feelingLucky",
      weight: 2,
      pool: {
        wheelOfFortune2: { amount: 2 },
        wheelOfFortune3: { amount: 6 },
        wheelOfFortune4: { amount: 15, weight: 0.75 },
      },
    }, // Treasure
    treasure_empoweredN5: {
      type: "treasure",
      item: "empowered",
      bonusTier: -10,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: {
        merchant: { weight: 0.45, price: { gem_topaz: 160 } },
        bingo1: { weight: 0.4 },
        wheelOfFortune1: { weight: 0.4 },
      },
    },
    treasure_empoweredN4: {
      type: "treasure",
      item: "empowered",
      bonusTier: -9,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: {
        merchant: { weight: 0.4, price: { gem_topaz: 195 } },
        bingo1: { weight: 0.8 },
        wheelOfFortune1: { weight: 0.8 },
      },
    },
    treasure_empoweredN3: {
      type: "treasure",
      item: "empowered",
      bonusTier: -8,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: {
        merchant: { weight: 0.35, price: { gem_topaz: 230 } },
        bingo1: { weight: 0.4 },
        bingo2: { weight: 0.4 },
        wheelOfFortune1: { weight: 0.4 },
        wheelOfFortune2: { weight: 0.4 },
      },
    },
    treasure_empoweredN2: {
      type: "treasure",
      item: "empowered",
      bonusTier: -7,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: {
        merchant: { weight: 0.3, price: { gem_topaz: 270 } },
        bingo2: { weight: 0.8 },
        wheelOfFortune2: { weight: 0.8 },
      },
    },
    treasure_empoweredN1: {
      type: "treasure",
      item: "empowered",
      bonusTier: -6,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: {
        merchant: { weight: 0.25, price: { gem_topaz: 310 } },
        bingo2: { weight: 0.4 },
        bingo3: { weight: 0.4 },
        wheelOfFortune2: { weight: 0.4 },
        wheelOfFortune3: { weight: 0.4 },
        ...bigEvents({ weight: 0.2 }, 80),
      },
    },
    treasure_empowered: {
      type: "treasure",
      item: "empowered",
      bonusTier: -5,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: {
        merchant: { weight: 0.2, price: { gem_topaz: 355 } },
        bingo3: { weight: 0.8 },
        wheelOfFortune3: { weight: 0.8 },
        ...bigEvents({ weight: 0.3 }, 95),
      },
    },
    treasure_empoweredP1: {
      type: "treasure",
      item: "empowered",
      bonusTier: -4,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: {
        merchant: { weight: 0.15, price: { gem_topaz: 400 } },
        bingo3: { weight: 0.4 },
        bingo4: { weight: 0.4 },
        wheelOfFortune3: { weight: 0.4 },
        wheelOfFortune4: { weight: 0.4 },
        ...bigEvents({ weight: 0.4 }, 110),
      },
    },
    treasure_empoweredP2: {
      type: "treasure",
      item: "empowered",
      bonusTier: -3,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: {
        merchant: { weight: 0.1, price: { gem_topaz: 450 } },
        bingo4: { weight: 0.8 },
        wheelOfFortune4: { weight: 0.8 },
        ...bigEvents({ weight: 0.5 }, 130),
      },
    },
    treasure_empoweredP3: {
      type: "treasure",
      item: "empowered",
      bonusTier: -2,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: {
        merchant: { weight: 0.05, price: { gem_topaz: 500 } },
        bingo4: { weight: 0.4 },
        wheelOfFortune4: { weight: 0.4 },
        ...bigEvents({ weight: 0.4 }, 150),
      },
    },
    treasure_empoweredP4: {
      type: "treasure",
      item: "empowered",
      bonusTier: -1,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: { ...bigEvents({ weight: 0.3 }, 175) },
    },
    treasure_empoweredP5: {
      type: "treasure",
      item: "empowered",
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      pool: { ...bigEvents({ weight: 0.2 }, 200) },
    }, // Relics
    relic_hundredDollarBill: {
      type: "relic",
      item: "hundredDollarBill",
      weight: 1,
      requirement() {
        return store.state.unlock.villageFeature.see;
      },
      pool: { merchant: { price: { gem_topaz: 800 } } },
    },
    relic_hotAirBalloon: {
      type: "relic",
      item: "hotAirBalloon",
      weight: 1,
      requirement() {
        return store.state.unlock.miningSmeltery.see;
      },
      pool: { merchant: { price: { gem_topaz: 800 } } },
    },
    relic_largeClover: {
      type: "relic",
      item: "largeClover",
      weight: 1,
      requirement() {
        return store.state.unlock.hordeItems.see;
      },
      pool: { bingo4: {} },
    },
    relic_eightBall: { type: "relic", item: "eightBall", weight: 1, pool: { bingo4: {} } },
    relic_youngPig: {
      type: "relic",
      item: "youngPig",
      weight: 1,
      requirement() {
        return store.state.unlock.hordeHeirlooms.see;
      },
      pool: { wheelOfFortune4: {} },
    },
    relic_silverHorseshoe: {
      type: "relic",
      item: "silverHorseshoe",
      weight: 1,
      requirement() {
        return store.state.unlock.farmCropExp.see;
      },
      pool: { wheelOfFortune4: {} },
    }, // Shared relics
    relic_tinfoilHat: {
      type: "relic",
      item: "tinfoilHat",
      weight: 0.5,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= store.state.mining.ingredient.oreAluminium.minDepth;
      },
      pool: { merchant: { price: { gem_topaz: 600 } }, bingo4: {}, wheelOfFortune4: {} },
    },
    relic_cupOfWater: {
      type: "relic",
      item: "cupOfWater",
      weight: 0.5,
      requirement() {
        return store.state.upgrade.item.village_glassBlowery.highestLevel >= 1;
      },
      pool: { merchant: { price: { gem_topaz: 600 } }, bi"relic",
      item: "comb.unlock.hordeItemMastery.see;
      },
      pool: { merchant: { price: { gem_topaz: 600 } }, bingo4: {}, wheelOfFortune4: {} },
    },
    relic_bronzeTools: {
      type: "relic",
      item: "bronzeTools",
      weight: 0.5,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= store.state.mining.ingredient.oreTin.minDepth;
      },
      pool: { ...bigEvents({}, 70) },
    },
    relic_minersHat: {
      type: "relic",
      item: "minersHat",
      weight: 0.5,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= store.state.mining.ingredient.oreTitanium.minDepth;
      },
      pool: { ...bigEvents({}, 100) },
    },
    relic_dictionary: {
      type: "relic",
      item: "dictionary",
      weight: 0.5,
      requirement() {
        return store.state.upgrade.item.village_library.highestLevel >= 1;
      },
      pool: { ...bigEvents({}, 75) },
    },
    relic_expertTools: {
      type: "relic",
      item: "expertTools",
      weight: 0.5,
      requirement() {
        return store.state.upgrade.item.village_deepMine.highestLevel >= 1;
      },
      pool: { ...bigEvents({}, 90) },
    },
    relic_bloodBag: {
      type: "relic",
      item: "bloodBag",
      weight: 0.5,
      requirement() {
        return store.state.stat.gallery_red.total > 0;
      },
      pool: { ...bigEvents({}, 115) },
    }, // Basic currencies
    mining_scrap: {
      type: "currency",
      item: "mining_scrap",
      weight: 1,
      amountMult: () =>
        store.getters["mining/depthScrap"](
          store.state.stat[`mining_maxDepth${store.state.system.features.mining.currentSubfeature}`].value,
        ),
      pool: { bingo0: { amount: 500 }, wheelOfFortune0: { amount: 500 } },
    },
    mining_ember: {
      type: "currency",
      item: "mining_ember",
      weight: 1,
      requirement() {
        return store.state.stat.mining_ember.total > 0;
      },
      roundAmount: true,
      amountMult: () => store.getters["mult/get"]("currencyMiningEmberCap"),
      pool: {
        bingo0: { amount: 0.01 },
        bingo1: { amount: 0.04 },
        bingo2: { amount: 0.15 },
        wheelOfFortune0: { amount: 0.01 },
        wheelOfFortune1: { amount: 0.04 },
        wheelOfFortune2: { amount: 0.15 },
      },
    },
    mining_resin: {
      type: "currency",
      item: "mining_resin",
      weight: 1,
      requirement() {
        return store.state.stat.mining_resin.total > 0;
      },
      pool: {
        bingo0: { amount: 2 },
        bingo1: { amount: 10 },
        wheelOfFortune0: { amount: 2 },
        wheelOfFortune1: { amount: 10 },
      },
    },
    village_offering: {
      type: "currency",
      item: "village_offering",
      weight: 1,
      requirement() {
        return store.state.unlock.villageOffering1.see;
      },
      roundAmount: true,
      amountMult: () => store.getters["village/offeringScore"],
      pool: {
        bingo0: { amount: 0.15 },
        bingo1: { amount: 0.5 },
        bingo2: { amount: 1.75 },
        wheelOfFortune0: { amount: 0.15 },
        wheelOfFortune1: { amount: 0.5 },
        wheelOfFortune2: { amount: 1.75 },
      },
    },
    horde_bone: {
      type: "currency",
      item: "horde_bone",
      weight: 1,
      requirement() {
        return store.state.unlock.hordeFeature.see;
      },
      amountMult: () =>
        store.getters["mult/get"](
          "currencyHordeBoneGain",
          store.getters["horde/enemyBone"](store.state.stat.horde_maxZone.value),
        ),
      pool: { bingo0: { amount: 500 }, wheelOfFortune0: { amount: 500 } },
    },
    gallery_beauty: {
      type: "currency",
      item: "gallery_beauty",
      weight: 1,
      requirement() {
        return store.state.unlock.galleryFeature.see;
      },
      amountMult: () => store.getters["mult/get"]("currencyGalleryBeautyGain"),
      pool: { bingo0: { amount: 500 }, wheelOfFortune0: { amount: 500 } },
    }, // Premium currencies
    gem_ruby: {
      type: "currency",
      item: "gem_ruby",
      weight: 0.5,
      requirement() {
        return store.state.unlock.gemFeature.see;
      },
      pool: gemPool,
    },
    gem_emerald: {
      type: "currency",
      item: "gem_emerald",
      weight: 0.5,
      requirement() {
        return store.state.unlock.gemFeature.see;
      },
      pool: gemPool,
    },
    gem.5,
      requirement() {

    gem_amethyst: {
      type: "currency",
      item: "gem_amethyst",
      weight: 0.5,
      requirement() {
        return store.state.unlock.gemFeature.see;
      },
      pool: gemPool,
    },
    school_examPass: {
      type: "currency",
      item: "school_examPass",
      weight: 1,
      requirement() {
        return store.state.unlerchant: { cap: 5, price: { gem_to   wheelOfFortune1: { amount: 2 },
        wheelOfFortune2: { amount: 8 },
      },
    },
    treasure_fragment: {
      type: "currency",
      item: "treasure_fragment",
      weight: 1,
      requirement() {
        return store.state.unlock.treasureFeature.see;
      },
      roundAmount: true,
      amountMult: () => store.getters["treasure/averageFragments"],
      pool: { bingo0: {}, bingo1: { amount: 4 }, wheelOfFortune0: {}, wheelOfFortune1: { amount: 4 } },
    },
    horde_towerKey: {
      type: "currency",
      item: "horde_towerKey",
      requirement() {
        return store.state.unlock.hordeBrickTower.see;
      },
      roundAmount: true,
      pool: {
        merchant: { cap: 3, price: { gem_topaz: 450 } },
        bingo2: { amount: 1 },
        bingo3: { amount: 4 },
        bingo4: { amount: 20 },
        wheelOfFortune2: { amount: 1 },
        wheelOfFortune3: { amount: 4 },
        wheelOfFortune4: { amount: 20 },
      },
    }, // Consumables
    mining_goldenHammer: {
      type: "consumable",
      item: "mining_goldenHammer",
      weight: 1,
      requirement() {
        return store.state.unlock.miningPickaxeCrafting.see;
      },
      pool: {
        merchant: { price: { gem_topaz: 60 } },
        bingo1: {},
        bingo2: { amount: 4 },
        wheelOfFortune1: {},
        wheelOfFortune2: { amount: 4 },
      },
    },
    gem_prestigeStone: {
      type: "consumable",
      item: "gem_prestigeStone",
      weight: 0.25,
      pool: {
        merchant: { price: { gem_topaz: 1000 } },
        bingo2: {},
        bingo3: { weight: 0.5, amount: 3 },
        bingo4: { weight: 1, amount: 10 },
        wheelOfFortune2: {},
        wheelOfFortune3: { weight: 0.5, amount: 3 },
        wheelOfFortune4: { weight: 1, amount: 10 },
      },
    },
    farm_speedGrow: {
      type: "consumable",
      item: "farm_speedGrow",
      weight: 1,
      requirement() {
        return store.state.consumable.farm_speedGrow.found;
      },
      pool: {
        merchant: { amount: 25, price: { gem_topaz: 50 } },
        bingo1: { amount: 25 },
        bingo2: { amount: 100 },
        wheelOfFortune1: { amount: 25 },
        wheelOfFortune2: { amount: 100 },
      },
    },
    farm_richSoil: {
      type: "consumable",
      item: "farm_richSoil",
      weight: 1,
      requirement() {
        return store.state.consumable.farm_richSoil.found;
      },
      pool: {
        merchant: { amount: 25, price: { gem_topaz: 50 } },
        bingo1: { amount: 25 },
        bingo2: { amount: 100 },
        wheelOfFortune1: { amount: 25 },
        wheelOfFortune2: { amount: 100 },
      },
    },
    farm_shiny: {
      type: "consumable",
      item: "farm_shiny",
      weight: 1,
      requirement() {
        return store.state.consumable.farm_shiny.found;
      },
      pool: {
        merchant: { amount: 25, price: { gem_topaz: 50 } },
        bingo1: { amount: 25 },
        bingo2: { amount: 100 },
        wheelOfFortune1: { amount: 25 },
        wheelOfFortune2: { amount: 100 },
      },
    },
    farm_turboGrow: {
      tent() {
        return store.statount: 25, price: { gem_topaz: 50 } },
        bingo1: { amount: 25 },
        bingo2: { amount: 100 },
        wheelOfFortune1: { amount: 25 },
        wheelOfFortune2: { amount: 100 },
      },
    },
    farm_premium: {
      type: "consumable",
      item: "farm_premium",
      weight: 1,
      requirement() {
        return store.state.consumable.farm_premium.found;
      },
      pool: {
        merchant: { amount: 20, price: { gem_topaz: 80 } },
        bingo2: { amount: 50 },
        wheelOfFortune2: { amount: 50 },
      },
    }, // Prestiges
    mining_prestige: {
      type: "currency",
      item: "mining_crystalGreen",
      weight: 1,
      requirement() {
        return store.state.stat.mining_prestigeCount.total >= 1;
      },
      amountMult: () => store.state.stat.mining_bestPrestige0.total,
      pool: {
        bingo1: { amount: 0.1 },
        bingo2: { amount: 0.4 },
        bingo3: { amount: 2.5 },
        wheelOfFortune1: { amount: 0.1 },
        wheelOfFortune2: { amount: 0.4 },
        wheelOfFortune3: { amount: 2.5 },
      },
    },
    village_prestige: {
      type: "currency",
      item: "village_blessing",
      weight: 1,
      requirement() {
        return store.state.stat.village_prestigeCount.total >= 1;
      },
      amountMult: () => store.state.stat.village_bestPrestige0.tot },
        bingo3: { amount: 2.5 0.4 },
        wheelOfFortune3: { amount: 2.5 },
      },
    },
    horde_prestige: {
      type: "currency",
      item: "horde_soulEmpowered",
      weight: 1,
      requirement() {
        return store.state.stat.horde_prestigeCount.total >= 1;
      },
      amountMult: () => store.state.stat.horde_bestPrestige0.total,
      pool: {
        bingo1: { amount: 0.1 },
        bingo2: { amount: 0.4 },
        bingo3: { amount: 2.5 },
        wheelOfFortune1: { amount: 0.1 },
        wheelOfFortune2: { amount: 0.4 },
        wheelOfFortune3: { amount: 2.5 },
      },
    },
    gallery_prestige: {
      type: "currency",
      item: "gallery_cash",
      weight: 1,
      requirement() {
        return store.state.stat.gallery_prestigeCount.total >= 1;
      },
      amountMult: () => store.state.stat.gallery_bestPrestige.total,
      pool: {
        bingo1: { amount: 0.1 },
        bingo2: { amount: 0.4 },
        bingo3: { amount: 2.5 },
        wheelOfFortune1: { amount: 0.1 },
        wheelOfFortune2: { amount: 0.4 },
        wheelOfFortune3: { amount: 2.5 },
      },
    },
    ...cindersPrize,
    ...bloomPrize,
    ...weatherChaosPrize,
    .les/event/relic": {
    // Generevent", "mining"],
      color: "blue-grey",
      effect: [{ name: "currencyMiningOreAluminiumGain", type: "mult", value: 1.12 }],
    },
    cupOfWater: {
      icon: "mdi-cup-water",
      feature: ["event", "village"],
      color: "blue",
      effect: [
        { name: "currencyVillageWaterGain", type: "mult", value: 1.12 },
        { name: "currencyVillageGlassGain", type: "mult", value: 1.05 },
      ],
    },
    combatStrategy: {
      icon: "mdi-clipboard-list",
      feature: ["event", "horde"],
      color: "pale-green",
      effect: [{ name: "hordeItemMasteryGain", type: "mult", value: 1.18 }],
    }, // Merchant
    hundredDollarBill: {
      icon: "mdi-cash-100",
      feature: ["event", "village"],
      color: "green",
      effect: [{ name: "currencyVillageCoinGain", type: "mult", value: 1.1 }],
    },
    hotAirBalloon: {
      icon: "mdi-airballoon",
      feature: ["event", "mining"],
      color: "orange-red",
      effect: [{ name: "miningSmelterySpeed", type: "mult", value: 1.1 }],
    }, // Bingo
    largeClover: {
      icon: "mdi-clover",
      feature: ["event", "horde"],
      color: "light-green",
      effect: [{ name: "hordeItemChance", type: "mult", value: 1.15 }],
    },
    eightBall: {
      icon: "mdi-billiards",
      feature: ["event", "mining"],
      color: "darker-grey",
heel of fortune
    youngPig: {
  le-pink",
      effect: [{ name: "hordeNostalgia", type: "base", value: 5 }],
    },
    silverHorseshoe: {
      icon: "mdi-horseshoe",
      feature: ["event", "farm"],
      color: "lighter-grey",
      effect: [{ name: "farmRareDropChance", type: "mult", value: 1.05 }],
    }, // Generic big event
    bronzeTools: {
      icon: "mdi-tools",
      feature: ["event", "mining"],
      color: "amber",
      effect: [
        { name: "currencyMiningOreCopperGain", type: "mult", value: 1.12 },
        { name: "currencyMiningOreTinGain", type: "mult", value: 1.12 },
      ],
    },
    minersHat: {
      icon: "mdi-hard-hat",
      feature: ["event", "mining"],
      color: "yellow",
      effect: [
        { name: "currencyMiningOreIronGain", type: "mult", value: 1.12 },
        { name: "currencyMiningOreTitaniumGain", type: "mult", value: 1.12 },
      ],
    },
    dictionary: {
      icon: "mdi-book-alphabet",
      feature: ["event", "village"],
      color: "brown",
      effect: [{ name: "currencyVillageKnowledgeGain", type: "mult", value: 1.1 }],
    },
    expertTools: {
      icon: "mdi-toolbox",
      feature: ["event", "village"],
      color: "cherry",
      effect: [
        { name: "currencyVillageHardwoodGain", type: "mult", value: 1.07 },
        { name: "currencyVillageGemGain", type: "mult", value: 1.07 },
      ],
    },
    bloodBag: {
      icon: "mdi-blood-bag",
      feature: ["event", "gallery"],
      color: "red",
      effect: [{ name: "currencyGalleryRedGain", type: "mult", value: 1.15 }],
    }, // Cinders
    geode: {
      icon: "mdi-circle-double",
      feature: ["event", "mining"],
      color: "indigo",
      effect: [{ name: "miningOreGain", type: "mult", value: 1.06 }],
    },
    birthdayCake: {
      icon: "mdi-cake",
      feature: ["event", "treasure"],
      color: "red",
      effect: [{ name: "treasureSlots", type: "base", value: 2 }],
    }, // Bloom
    colorfulFlower: {
      icon: "mdi-flower",
      feature: ["event", "farm"],
      color: "red-pink",
      effect: [{ name: "currencyFarmFlowerGain", type: "mult", value: 1.15 }],
    },
    heatingBulb: {
      icon: "mdi-lightbulb-on",
      feature: ["event", "gallery"],
      color: "orange",
      effect: [{ name: "galleryInspirationStart", type: "base", value: 1 }],
    }, // Weather chaos
    trashCan: {
      icon: "mdi-trash-can",
      feature: ["event", "mining"],
      color: "dark-grey",
      effect: [{ name: "currencyMiningScrapGain", type: "mult", value: 1.1 }],
    },
    suitcase: {
      icon: "mdi-bag-carry-on",
      feature: ["event", "horde"],
      color: "dark-blue",
      effect: [{ name: "currencyHordeBoneCap", type: "mult", value: 1.1 }],
    }, // Summer festival
    tropicalTent: {
      icon: "mdi-tent",
      feature: ["event", "village"],
      color: "green",
      effect: [{ name: "villageWorker", type: "base", value: 3 }],
    },
    fruitBasket: {
      icon: "mdi-basket",
      feature: ["event", "farm"],
      color: "red",
      effect: [{ name: "currencyFarmBerryGain", type: "mult", value: 1.15 }],
    }, // Night hunt
    massiveGrain: {
      icon: "mdi-barley",
      feature: ["event", "farm"],
      color: "pale-yellow",
      effect: [{ name: "currencyFarmGrainGain", type: "mult", value: 1.15 }],
    },
    enchantedBottle: {
      icon: "mdi-flask-round-bottom",
      feature: ["event", "mining"],
      color: "purple",
      effect: [{ name: "currencyMiningResinCap", type: "base", value: 1 }],
    }, // Snowdown
    moneyGift: {
      icon: "mdi-gift",
      feature: ["event", "village"],
      color: "green",
      effect: [{ name: "currencyVillageCoinGain", type: "mult", value: 1.1 }],
    },
    frozenCarrot: {
      icon: "mdi-carrot",
      feature: ["event", "farm"],
      color: "light-blue",
      effect: [{ name: "currencyFarmVegetableGain", type: "mult", value: 1.15 }],
    },
  },
  "modules/event/snowdown/item": {
    // Producers
    forest: {
      type: "producer",
      icon: "mdi-forest",
      effect: [
        {
          name: "currencyEventSaplingGain",
          type: "base",
          value: (lvl) => Math.pow(2, lvl) * Math.pow(lvl + 1, 2) * 0.01,
        },
      ],
    },
    shepherd: {
      type: "producer",
      icon: "mdi-sheep",
      effect: [
        { name: "currencyEventYarnGain", type: "base", value: (lvl) => Math.pow(2, lvl) * Math.pow(lvl + 1, 2) * 0.01 },
      ],
    },
    rollingPin: {
      type: "producer",
      icon: "mdi-arrow-top-right-bottom-left-bold",
      effect: [
        {
          name: "currencyEventDoughGain",
          type: "base",
          value: (lvl) => Math.pow(2, lvl) * Math.pow(lvl + 1, 2) * 0.01,
        },
      ],
    },
    snowCannon: {
      type: "producer",
      icon: "mdi-snowflake-alert",
      effect: [
        { name: "currencyEventSnowGain", type: "base", value: (lvl) => Math.pow(2, lvl) * Math.pow(lvl + 1, 2) * 0.01 },
      ],
    }, // Pets
    snowOwl: { type: "pet", icon: "mdi-owl", max: 1 },
    dog: { type: "pet", icon: "mdi-dog", max: 1 },
    cat: { type: "pet", icon: "mdi-cat", max: 1 },
    penguin: { type: "pet", icon: "mdi-penguin", max: 1 },
    rabbit: { type: "pet", icon: "mdi-rabbit", max: 1 },
    turtle: { type: "pet", icon: "mdi-tortoise", max: 1 }, // Pet boosts
    animalTooth: {
      type: "petBoost",
      icon: "mdi-tooth",
      effect: [
        { name: "snowdownPetAttack", type: "base", value: (lvl) => lvl * 0.5 },
        { name: "snowdownPetAttack", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    collar: {
      type: "petBoost",
      icon: "mdi-dog-service",
      effect: [
        { name: "snowdownPetHealth", type: "base", value: (lvl) => lvl * 5 },
        { name: "snowdownPetHealth", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    chili: {
      type: "petBoost",
      icon: "mdi-chili-mild",
      effect: [
        { name: "snowdownCritRating", type: "base", value: (lvl) => lvl * 8 },
        { name: "snowdownPetCritRating", type: "base", value: (lvl) => lvl * 10 },
      ],
    },
    drumstick: {
      type: "petBoost",
      icon: "mdi-food-drumstick",
      effect: [
        { name: "snowdownPetAttack", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "snowdownPetHealth", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "snowdownPetBlockRating", type: "base", value: (lvl) => lvl * 5 },
      ],
    },
    mouse: {
      type: "petBoost",
      icon: "mdi-rodent",
      max: 5, // Heal the player 1 on pet attack
    },
    bone: {
      type: "petBoost",
      icon: "mdi-bone",
      max: 5, // Pets heal 1 on attack
    },
    gravestone: {
      type: "petBoost",
      icon: "mdi-grave-stone",
      max: 3, // Pet deaths heal the player and other pets 15
    },
    spikedCollar: {
      type: "petBoost",
      icon: "mdi-decagram-outline",
      max: 1, // 30 crit and block rating on random pet, transfers to another random pet on death
    },
    heartCollar: {
      type: "petBoost",
      icon: "mdi-heart-outline",
      max: 3, // Random pet gets 1 revive with full health
    },
    treatBag: {
      type: "petBoost",
      icon: "mdi-sack", // Heal the pet for 50% max health. Consumes pet action. Limit of 3
    },
    tennisBall: {
      type: "petBoost",
      icon: "mdi-tennis-ball",
      max: 1, // All pets get revived when the player dies
    }, // Tank build items
    appleJuice: {
      type: "tank",
      icon: "mdi-cup",
    hotWater: {
      type: "tamax health
    },
    dumbbell: {
      type: "tank",
      icon: "mdi-dumbbell",
      max: 5, // 0.5 attack on attack
    },
    target: {
      type: "tank",
      icon: "mdi-bullseye",
      max: 5, // 4 crit on attack
    },
    gloves: {
      type: "tank",
      icon: "mdi-hand-back-left",
      max: 5, // 0.2 attack and 1 crit when attacked
    }, // Crit build items
    snowboard: {
      type: "crit",
      icon: "mdi-snowboard",
      max: 1, // First 5 attacks crit
    },
    tea: {
      type: "crit",
      icon: "mdi-tea",
      max: 3, // On enemy death, heal 25 and the next attack crits
    },
    starShield: {
      type: "crit",
      icon: "mdi-shield-star",
      max: 1, // 5 armor in the first 3 turns
    },
    coffee: {
      type: "crit",
      icon: "mdi-coffee",
      max: 3, // Crits heal 8
   : 1, // Crits stun the target for[{ name: "snowdownDefense", type: "base", value: (lvl) => lvl * 2 }] },
    moonShield: {
      icon: "mdi-shield-moon",
      effect: [
        { name: "snowdownDefense", type: "base", value: (lvl) => lvl },
        { name: "snowdownBlockRating", type: "base", value: (lvl) => lvl * 5 },
      ],
    },
    fireplace: {
      icon: "mdi-fireplace",
      effect: [
        { name: "snowdownHealth", type: "base", value: (lvl) => lvl * 10 },
        { name: "snowdownHealth", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    specialSnowflake: {
      icon: "mdi-snowflake-variant",
      effect: [
        { name: "snowdownAttack", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "snowdownCritRating", type: "base", value: (lvl) => lvl * 5 },
      ],
    },
    candyCane: {
      icon: "mdi-candycane",
      effect: [
        { name: "snowdownHealth", type: "base", value: (lvl) => lvl * 15 },
        { name: "snowdownBlockRating", type: "base", value: (lvl) => lvl * 5 },
      ],
    },
    shovel: {
      icon: "mdi-shovel",
      effect: [
        { name: "snowdownAttack", type: "base", value: (lvl) => lvl },
        { name: "snowdownAttack", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    turkey: {
      icon: "mdi-food-turkey",
      effect: [
        { name: "snowdownAttack", type: "base", value: (lvl) => lvl },
        { name: "snowdownHealth", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
  },
  "modules/event/snowdown/prize": {
    theme_frozen: { type: "theme", item: "frozen", pool: { snowdown: { price: { event_snowdownToken: 225 } } } },
    relic_moneyGift: {
      type: "relic",
      item: "moneyGift",
      requirement() {
        return store.state.unlock.villageFeature.see;
      },
      pool: { snowdown: { price: { event_snowdownToken: 155 } } },
    },
    relic_frozenCarrot: {
      type: "relic",
      item: "frozenCarrot",
      requirement() {
        return store.state.unlock.farmFeature.see;
      },
      pool: { snowdown: { price: { event_snowdownToken: 170 } } },
    },
    cardPack_icyWonderland: {
      type: "cardPack",
      item: "icyWonderland",
      pool: { snowdown: { price: { event_snowdownToken: 30 } } },
    },
    farm_cinnamonBag: {
      type: "consumable",
      item: "farm_cinnamonBag",
      amount: 20,
      requirement() {
        return store.state.unlock.farmFertilizer.see;
      },
      pool: { snowdown: { price: { event_snowdownToken: 1 } } },
    },
  },
  "modules/event/snowdown/upgrade": {
    pineTrees: {
      type: "snowdown",
      price(lvl) {
        return { event_sapling: 250 * Math.pow(lvl * 0.5 + 1, 2) * Math.pow(2, lvl) };
      },
      effect: [{ name: "snowdownAllAttack", type: "mult", value: (lvl) => Math.pow(1.02, lvl) * (lvl * 0.05 + 1) }],
    },
    woolHat: {
      type: "snowdown",
      price(lvl) {
        return { event_yarn: 250 * Math.pow(lvl * 0.5 + 1, 2) * Math.pow(2, lvl) };
      },
      effect: [
        { name: "snowdownAllHealth", type: "mult", value: (lvl) => Math.pow(1.02, lvl) * (lvl * 0.05 + 1) },
        { name: "snowdownAllDefense", type: "mult", value: (lvl) => Math.pow(1.02, lvl) * (lvl * 0.05 + 1) },
      ],
    },
    cookies: {
      type: "snowdown",
      price(lvl) {
        return { event_dough: 250 * Math.pow(lvl * 0.5 + 1, 2) * Math.pow(2, lvl) };
      },
      effect: [
        { name: "snowdownRevengeStats", type: "base", value: (lvl) => lvl * 0.0005 },
        { name: "snowdownRevengeCrit", type: "base", value: (lvl) => lvl * 0.06 },
        { name: "snowdownRevengeBlock", type: "base", value: (lvl) => lvl * 0.04 },
      ],
    }, // topaz upgrades
    attackBoost: {
      type: "snowdown",
      price(lvl) {
        return { gem_topaz: lvl * 50 + 150 };
      },
      effect: [{ name: "snowdownAllAttack", type: "mult", value: (lvl) => lvl * 0.5 + 1 }],
    },
    healthBoost: {
      type: "snowdown",
      price(lvl) {
        return { gem_topaz: lvl * 40 + 100 };
      },
      effect: [
        { name: "snowdownAllHealth", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
        { name: "snowdownAllDefense", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
      ],
    },
  },
  "modules/event/summerFestival/building": {
    // Default buildings
    collector: {
      icon: "mdi-warehouse",
      price(lvl) {
        return { event_log: Math.pow(6, lvl) * 750 };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.35, lvl) * 180),
      effect: [
        {
          name: "autocollectMult",
          type: "summerFestivalBuildingMult",
          value: (lvl) => getSequence(0, lvl + 2) * 0.3 + 1,
        },
      ],
    },
    mainStage: {
      icon: "mdi-boombox",
      shape: { 0: "land", 1: "land", 2: "land", 3: "land", 4: "land" },
      maxAmount: 1,
      price(lvl) {
        return fallbackArray(
          [
            { event_log: 4500, event_coconut: 3000 },
            { event_log: buildNum(500, "K"), event_shell: buildNum(200, "K"), event_solidPlate: 750 },
            { event_log: buildNum(200, "M"), event_solidPlate: buildNum(10, "K"), event_sandstone: buildNum(30, "K") },
            { event_log: buildNum(80, "B"), event_solidPlate: buildNum(150, "K"), event_hardSteel: 500 },
          ],
          { event_log: Math.pow(600, lvl) * buildNum(50, "T"), event_compositePlate: Math.pow(12, lvl) * 100 },
          lvl,
        );
      },
      timeNeeded: (lvl) => Math.pow(3, lvl) * 900,
      effect: [{ name: "currencyEventMusicGain", type: "base", value: (lvl) => Math.pow(2, lvl) }],
    }, // Level 1 buildings
    speaker: {
      icon: "mdi-speaker",
      stageLevel: 1,
      price(lvl) {
        return { event_log: Math.pow(25, lvl) * buildNum(10, "K"), event_coconut: Math.pow(25, lvl) * 3000 };
      },
      timeNeeded: (lvl) => Math.pow(2, lvl) * 600,
      effect: [{ name: "currencyEventMusicGain", type: "base", value: (lvl) => Math.pow(2, lvl) * 0.5 }],
    },
    vegetablePatch: {
      icon: "mdi-sprout",
      stageLevel: 1,
      shape: { 0: "land", 1: "land", 4: "land" },
      price(lvl) {
        return { event_log: Math.pow(12, lvl) * buildNum(37.5, "K") };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 1500),
      effect: [{ name: "currencyEventVegetableGain", type: "base", value: (lvl) => Math.pow(1.75, lvl) * 0.05 }],
    },
    sawmill: {
      icon: "mdi-saw-blade",
      stageLevel: 1,
      shape: { 0: "land", 1: "land" },
      price(lvl) {
        return { event_stoneBlock: Math.pow(16, lvl) * buildNum(440, "K") };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 1800),
      action: {
        cutPlates: {
          icon: "mdi-layers",
          input: { event_log: 1000, event_stoneBlock: 800 },
          output: { event_solidPlate: 1 },
          minLevel: 1,
          speed: (lvl) => Math.pow(2, lvl) * 0.005,
        },
        cutSandstone: {
          icon: "mdi-wall",
          input: { event_sand: 400, event_stoneBlock: 600 },
          output: { event_sandstone: 1 },
          minLevel: 3,
          speed: (lvl) => Math.pow(2, lvl) * 0.01,
        },
        smeltSteel: {
          icon: "mdi-gold",
          input: { event_metalPart: 20, event_freshWater: 500 },
          output: { event_hardSteel: 1 },
          minLevel: 5,
          speed: (lvl) => Math.pow(2, lvl) * 0.008,
        },
        combineMaterial: {
          icon: "mdi-pillar",
          input: { event_solidPlate: 10, event_sandstone: 10, event_hardSteel: 10 },
          output: { event_compositePlate: 1 },
          minLevel: 7,
          speed: (lvl) => Math.pow(2, lvl) * 0.001,
        },
      },
    },
    kitchen: {
      icon: "mdi-countertop",
      stageLevel: 1,
      shape: { 0: "land", 1: "land", 3: "land", 5: "land" },
      price(lvl) {
        return { event_solidPlate: Math.pow(10, lvl) * 80, event_coconut: Math.pow(30, lvl) * buildNum(1.2, "M") };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 2700),
      action: {
        coconutSalad: {
          icon: "mdi-bowl-mix",
          input: { event_coconut: 4000, event_vegetable: 50 },
          output: { event_coconutSalad: 1 },
          minLevel: 1,
          speed: (lvl) => Math.pow(2, lvl) * 0.002,
        },
        saltyShell: {
          icon: "mdi-set-all",
          input: { event_shell: buildNum(60, "K"), event_salt: 75 },
          output: { event_saltyShell: 1 },
          minLevel: 3,
          speed: (lvl) => Math.pow(2, lvl) * 0.0015,
        },
        lemonCandy: {
          icon: "mdi-candy",
          input: { event_citrusFruit: 30, event_honey: 20 },
          output: { event_lemonCandy: 1 },
          minLevel: 5,
          speed: (lvl) => Math.pow(2, lvl) * 0.008,
        },
        steak: {
          icon: "mdi-food-steak",
          input: { event_cookedMeat: 10, event_salt: 250, event_pepper: 250 },
          output: { event_steak: 1 },
          minLevel: 7,
          speed: (lvl) => Math.pow(2, lvl) * 0.001,
        },
        fishSticks: {
          icon: "mdi-tally-mark-4",
          input: { event_cookedFish: 5, event_citrusFruit: 250, event_vegetable: 300 },
          output: { event_fishSticks: 1 },
          minLevel: 9,
          speed: (lvl) => Math.pow(2, lvl) * 0.003,
        },
      },
    }, // Level 2 buildings
    huntingArea: {
      icon: "mdi-bow-arrow",
      stageLice(lvl) {
        return {
    Math.pow(25, lvl) * buildNum(2.4, "M"),
        };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 5400),
      effect: [{ name: "currencyEventRawMeatGain", type: "base", value: (lvl) => Math.pow(1.75, lvl) * 0.004 }],
    },
  beach" },
      price(lvl) {
          timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 9600),
      effect: [{ name: "currencyEventSandGain", type: "base", value: (lvl) => Math.pow(1.75, lvl) * 2 }],
    },
    mine: {
      icon: "mdi-tunnel",
      stageLevel: 2,
      shape: { 0: "mountain" },
      pri "M"),
          event_solidPlate:lvl) * 3300,
        };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 10800),
      effect: [
        { name: "currencyEventSaltGain", type: "base", value: (lvl) => Math.pow(1.75, lvl) * 0.06 },
        { name: "currencyEventCoalGain", type: "base", valuen: "mdi-grill",
      stageLevel: 2,
 buildNum(100, "M"),
          event_stoneBlock: Math.pow(25, lvl) * buildNum(60, "M"),
        };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 7200),
       { event_rawMeat: 1, event_coal: 1 peed: (lvl) => Math.pow(2, lvl) * 0.01,
        },
        cookFish: {
          icon: "mdi-fish",
          input: { event_rawFish: 1, event_coal: 1 },
          output: { event_cookedFish: 1 },
          minLevel: 2,
          speed: (lvl) => Math.pow(2, lvl) * 0.01,
        },
      },
    },
    excavator: {
      icon: "mdi-excavator",
      stageLevel: 2,
      maxLevel: 1,
      maxAmount: 1,
      price() {
        return { event_solidPlate: buildNum(120, "K"), event_sandstone: buildNum(10, "K"), event_cocktail: 25 };
      },
      timeNeeded: () => 3600,
      effect: [{ name: "summerFestivalTerraform", type: "unlock", value: () => true }],
tageLevel: 3,
      shape: { 0: "lt_coconut: Math.pow(40, lvl) * buildNum(8.5, "B"),
          event_sandstone: Math.pow(12, lvl) * buildNum(50, "K"),
        };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 14400),
      action: {
        openShell: {
             output: { event_metalPart: 3      },
      },
      effect: [{ name: "pearlChance", type: "summerFestivalBuildingBase", value: (lvl) => 0.0002 * lvl + 0.001 }],
    },
    waterPurifier: {
      icon: "mdi-air-filter",
      stageLevel: 3,
      shape: { 0: "land", 1: "water" },
      price(lvl) {
        r  timeNeeded: (lvl) => Math.roueshWaterGain", type: "base", value: (lvl) => Math.pow(1.75, lvl) * 0.08 },
        { name: "currencyEventSaltGain", type: "base", value: (lvl) => Math.pow(1.75, lvl) * 0.01 },
      ],
    },
    fishingNet: {
      icon: "mdi-spider-web",
      stageLevel: 3,
      shape: { 0: "water", 1: "water" },
      price(lvl) {
        return {
          event_solidPlatelvl) * buildNum(405, "K"),
             effect: [{ name: "currencyEventRawFishGain", type: "base", value: (lvl) => Math.pow(1.75, lvl) * 0.03 }],
    },
    lighthouse: {
      icon: "mdi-lighthouse",
      stageLevel: 3,
      maxLevel: 1,
      shape: { 0: "mountain" },
      price() {
        return { event_pe: "summerFestivalBuildQueueSpeed"type: "mult", value: () => 1.5 },
        { name: "summerFestivalMaterialStackCap", type: "mult", value: () => 5 },
      ],
    }, // Level 4 buildings
    pepperField: {
      icon: "mdi-flower-outline",
      stageLevel: 4,
      shape: { 0: "palm", 1: "land" },
      price(lvl) {
        return {
          event_coconut: Math.pow(25, lvl) * buildNum(975, "B"),
          event_sandstone: Math.pow(8, lvl) * buildNum(2.75, "M"),
        };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 57600),
      effect: [{ name: "currencyEventPepperGain", type: "base", value: (lvl) => Math.pow(1.75, lvl) * 0.6 }],
    },
    beehive: {
      icon: "mdi-beehive-outline",
      stageLevel: 4,
      shape: { 0: "forest" },
      price(lvl) {
        return { event_log: Math.pow(25, lvl) * buildNum(7.1, "T"), event_hardSteel: Math.pow(6, lvl) * 75 };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 72000),
      effect: [{ name: "currencyEventHoneyGain", type: "base", value: (lvl) => Math.pow(1.75, lvl) * 0.04 }],
    },
    citrusPlantation: {
      icon: "mdi-tree",
      stageLevel: 4,
      shape: { 0: "palm", 1: "land", 2: "land" },
      price(lvl) {
        return {
          event_stoneBlock: Math.pow(25, lvl) * buildNum(63, "T"),
          event_solidPlate: Math.pow(8, lvl) * buildNum(5, "M"),
        };
      },
      timeNeeded: (lvl) => Math.round(Math.pow(1.5, lvl) * 86400),
      effect: [{ name: "currencyEventCitrusFruitGain", type: "base", value: (lvl) => Math.pow(1.75, lvl) * 0.12 }],
    },
  },
  "modules/event/summerFestival/prize": {
    tival: { price: { event_summerFes   item: "tropicalTent",
      requirement() {
        return store.state.unlock.villageFeature.see;
      },
      pool: { summerFestival: { price: { event_summerFestivalToken: 150 } } },
    },
    relic_fruitBasket: {
      type: "relic",
      item: "fruitBasket",
      requirement() {
        return store.state.unlock.farmFeature.see;
      },
      pool: { summerFestival: { price: { event_summerFestivalToken: 170 } } },
    },
    cardPack_charmingShip: {
      type: "cardPack",
      item: "charmingShip",
      pool: { summeralWater: {
      type: "consumable     return store.state.unlock.farmFertilizer.see;
      },
      pool: { summerFestival: { price: { event_summerFestivalToken: 1 } } },
    },
  },
  "modules/event/summerFestival/upgrade": {
    extraBuildingSlot: {
      type: "summerFestival",
      cap: 3,
      price(lvl) {
        return { gem_topaz: Math.pow(2, lvl) * 250 };
      },
      effect: [{ name: "summerFestivalBuildQueueSlots", type: "base", value: (lvl) => lvl * 2 }],
    },
    doubleTime: {
      type: "summerFestival",
      cap: 5,
      price(lvl) {
        return { ldQueueSpeed", type: "mult", valuel",
      cap: 8,
      price(lvl) {
        return { gem_topaz: lvl * 50 + 100 };
      },
      effect: [
        { name: "summerFestivalMaterialGain", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
        { name: "summerFestivalMaterialStackCap", type: "base", value: (lvl) => lvl * 5 },
      ],
    },
  },
  "modules/event/weatherChaos/bait": {
    juicyBait: {
      icon: "mdi-fruit-grapes",
      stackSize: 10,
      effect: [
        { name: "weatherChaosFishingTime", type: "mult", value: 0.1 },
        { name: "weatherChaosFishChance", type: "base", value: 1 },
        { name: "weatherChaosFishDoubleChance", type: "base", value: 0.35 },
        { name: "weatherChaosTreasureChance", type: "mult", value: 0.1 },
      ],
    },
    rainbowBait: {
      icon: "mdi-looks",
      stackSize: 3,
      effect: [
        { name: "weatherChaosFishChance", type: "base", value: 1 },
        { name: "weatherChaosIgnoreWeather", type: "base", value: 0.25 },
        { name: "weatherChaosFishSizeMax", type: "mult", value: 1 / 1.1 },
        { name: "weatherChaosFishSizeAverage", type: "mult", value: 0.8 },
      ],
    },
    trashNet: {
      icon: "mdi-spider-web",
      stackSize: 10,
      effect: [
        { name: "weatherChaosFishingTime", type: "mult", value: 0.1 },
        { name: "weatherChaosFishChance", type: "base", value: -1 },
        { name: "weatherChaosTrashGain", type: "mult", value: 3 },
        { name: "weatherChaosTreasureChance", type: "mult", value: 0.1 },
      ],
    },
    magnet: { icon: "mdi-magnet", effect: [{ name: "weatherChaosTreasureChance", type: "base", value: 1 }] },
  },
  "modules/event/weatherChaos/fish": {
    // Pond fish
    bronzefish: { iconSize: 1.1, color: "pale-red", location: "pond", size: 4.5, weight: 1.25 },
    snail: { icon: "mdi-snail", iconSize: 0.6, color: "green", location: "pond", size: 2.7, weight: 3.7, rain: true },
    cablebiter: { iconSize: 0.75, color: "dark-grey", location: "pond", size: 6, minPower: 5, weight: 2.8, sun: true },
    blueshimmer: { iconSize: 1, color: "pale-blue", location: "pond", size: 7.8, minPower: 8, weight: 2.2, snow: true },
    introvero: {
      iconSize: 0.6,
      color: "skyblue",
      location: "pond",
      size: 6.2,
      minPower: 14,
      weight: 0.1,
      sun: false,
      rain: true,
    },
    zapling: { iconSize: 0.7, color: "yellow", location: "pond", size: 4.1, minPower: 17, weight: 1.6, thunder: true },
    starcone: {
      icon: "mdi-snail",
      iconSize: 0.7,
      color: "brown",
      location: "pond",
      size: 2.4,
      minPower: 26,
      weight: 3.1,
      snow: true,
    },
    phelaria: {
      iconSize: 1.7,
      color: "orange",
      location: "pond",
      size: 6.4,
      minPower: 38,
      weight: 0.55,
      rain: false,
      snow: false,
      thunder: false,
    },
    coldgil: { iconSize: 0.9, color: "teal", location: "pond", size: 3.7, minPower: 50, weight: 0.8, rain: true }, // Lake fish
    silverbrass: { iconSize: 1.15, color: "light-grey", location: "lake", size: 7.1, weight: 1.35 },
    circlejelly: {
      icon: "mdi-jellyfish",
      iconSize: 0.85,
      color: "light-blue",
      location: "lake",
      size: 5.5,
      minPower: 42,
      weight: 1.1,
      sun: true,
    },
    woodcrawler: {
      icon: "mdi-bug",
      iconSize: 0.7,
      color: "wooden",
      location: "lake",
      size: 2.8,
      minPower: 55,
      weight: 2.3,
      sun: false,
    },
    longdano: { iconSize: 1.1, color: "light-green", location: "lake", size: 4, minPower: 61, weight: 1.9, wind: true },
    legabara: { iconSize: 1.8, color: "dark-blue", location: "lake", size: 9.2, minPower: 78, weight: 0.05 },
    biggiesnail: {
      icon: "mdi-snail",
      iconSize: 1.25,
      color: "pale-purple",
      location: "lake",
      size: 4.7,
      minPower: 90,
      weight: 0.9,
      rain: true,
    },
    sunshine: {
      iconSize: 1,
      color: "orange",
      location: "lake",
      size: 5.1,
      minPower: 115,
      weight: 0.2,
      sun: true,
      thunder: true,
    }, // River fish
    platiglob: { iconSize: 1.2, color: "blue-grey", location: "river", size: 10.3, weight: 1.45 },
    stormdazer: {
      iconSize: 0.9,
      color: "yellow",
      location: "river",
      size: 9.3,
      minPower: 104,
      weight: 2.2,
      rain: true,
      thunder: true,
    },
    riverTurtle: {
      icon: "mdi-turtle",
      iconSize: 1.15,
      color: "pale-green",
      location: "river",
      size: 12,
      minPower: 128,
      weight: 1.1,
      snow: false,
      thunder: false,
      wind: false,
    },
    streamsnail: {
      icon: "mdi-snail",
      iconSize: 0.8,
      color: "lime",
      location: "river",
      size: 7.2,
      minPower: 145,
      weight: 1.1,
      wind: true,
    },
    ralmon: { iconSize: 1.5, color: "red", location: "river", size: 11.6, minPower: 170, weight: 2.15 },
    wonelle: {
      iconSize: 1.3,
      color: "light-grey",
      location: "river",
      size: 10.8,
      minPower: 202,
      weight: 1.4,
      snow: true,
    },
    grillgil: {
      iconSize: 0.95,
      color: "darker-grey",
      location: "river",
      size: 10,
      minPower: 217,
      weight: 1.6,
      thunder: true,
    },
    sleepysoo: { iconSize: 0.7, color: "cherry", location: "river", size: 8.5, minPower: 244, weight: 0.8, rain: true },
    oozior: { iconSize: 1.8, color: "purple", location: "river", size: 14, minPower: 290, weight: 0.1 }, // Ocean fish
    paleblob: { iconSize: 1.25, color: "lighter-grey", location: "ocean", size: 14.6, weight: 1.55 }, // Mountain fish
    crystakin: { iconSize: 1.3, color: "light-blue", location: "mountain", size: 18.1, weight: 1.65 }, // Cave fish
    shadowbiter: { iconSize: 1.35, color: "darker-grey", location: "cave", size: 24.5, weight: 1.75 }, // mdi-bug mdi-dolphin mdi-jellyfish mdi-shark mdi-snail mdi-turtle
  },
  "modules/event/weatherChaos/fishingRod": {
    basic: { owned: true },
    fast: {
      icon: "mdi-run-fast",
      effect: [
        { name: "weatherChaosFishingTime", type: "mult", value: 1 / 1.4 },
        { name: "weatherChaosFishSizeAverage", type: "mult", value: 1 / 1.6 },
        { name: "weatherChaosTrashGain", type: "mult", value: 1 / 1.5 },
      ],
    },
    leafy: {
      icon: "mdi-leaf",
      effect: [
        { name: "weatherChaosFishChance", type: "base", value: -0.1 },
        { name: "currencyEventAlgaeGain", type: "mult", value: 1.75 },
      ],
    },
    heavy: {
      icon: "mdi-weight",
      effect: [
        { name: "weatherChaosFishingTime", type: "mult", value: 1.1 },
        { name: "weatherChaosFishSizeMax", type: "base", value: 1 },
        { name: "weatherChaosFishSizeAverage", type: "mult", value: 1 / 1.1 },
      ],
    },
    hardwood: {
      icon: "mdi-palm-tree",
      effect: [
        { name: "weatherntDriftwoodGain", type: "mult",    effect: [
        { name: "weatherChaosFishingPower", type: "base", value: 12 },
        { name: "weatherChaosFishingTime", type: "mult", value: 1.15 },
      ],
    },
    smelly: {
      icon: "mdi-scent",
      effect: [
        { name: "curhingTime", type: "mult", value: 1.5 },
   { name: "weatherChaosFishingTime", type: "mult", v },
        { name: "weatherChaoshGain", type: "mult", value: 1 / 1.75 },
      ],
    },
    golden: {
      icon: "mdi-gold",
      effect: [
        { name: "weatherChaosFishChance", type: "base", value: 0.05 },
        { name: "weatherChaosTreasureChance", type: "base", value: },
      ],
    },
    dull: {
reasureChance", type: "base", value: -0.025 },
        { name: "currencyEventPlasticGain", type: "mult", value: 1.75 },
      ],
    },
    mystical: {
      icon: "mdi-auto-fix",
      effect: [
        { name: "weatherChaosIgnoreWeather", type: "lue: 1 / 1.2 },
        { name: "weather: {
      icon: "mdi-call-split",
      effect: [
        { name: "weatherChaosFishingTime", type: "mult", value: 1.1 },
        { name: "weatherChaosFishDoubleChance", type: "base", value: 0.2 },
        { name: "weatherChaosTrashGain", type: "mult", value: 1 / 1.6 },
      ],
    },
  },
  "modules/event/weatherChaos/location": {
    pond: { owned: true, next: { minPower: 40, name: "lake" } },
    lake: {
      next: { minPower: 100, name: "river" },
      effect: [
        { name: "weatherChaosFishSizeAverage", type: "mult", v,
        { name: "currencyEventAlgaPower: 250, name: "ocean" },
      effect: [
        { name: "weatherChaosFishSizeAverage", type: "mult", value: 1.4 },
        { name: "weatherChaosDriftwoodWeight", type: "mult", value: 3 },
        { name: "currencyEventDriftwoodGain", type: "mult", value: 2 },
      ],
    },
    ocean: {
      next: { minPower: 500, name: "mountain" },
      effect: [
        { name: "weatherChaosFishSizeAverage", type: "mult", value: 1.6 },
        { name: "weatherChaosPlasticWeight", type: "mult", value: 3 },
        { name: "currencyEventPlasticGain", type: "mult", value: 2 },
      ],
    },
    mountain: {
      next: { minPower: 1000, name: "cave" },
      effect: [
        { name: "weatherChaosFishSizeAverage", type: "mult", value: 1.8 },
        { name: "currencyEventAlgaeGain", type: "mult", value: 1.5 },
        { name: "currencyEventDriftwoodGain", type: "mult", value: 1.5 },
        { name: "currencyEventPlasticGain", type: "mult", value: 1.5 },
      ],
    },
    cave: {
      effect: [
        { name: "weatherChaosFishSizeAverage", type, value: 1.5 },
      ],
    },
  : "rain", pool: { weatherChaos: { price: { event_weatherChaosToken: 260 } } } },
    relic_trashCan: {
      type: "relic",
      item: "trashCan",
      pool: { weatherChaos: { price: { event_weatherChaosToken: 130 } } },
    },
    relic_suitcase: {
      type: "relic",
      item: "suitcase",
      requirement() {
        return store.state.unlock.hordeHeirlooms.see;
      },
      pool: { weatherChaos: { price: { event_weatherChaosToken: 155 } } },
    },
    cardPack_fishingForFun: {
      type: "cardPack",
      item: "fishingForFun",
      pool: { weatherChaos: { price: { event_weatherChaosToken: 30 } } },
    },
    farm_smellyMud: {
      type: "consumable",
      item: "farm_smellyMud",
      amount: 20,
      requirement() {
        return store.state.unlock.farmFertilizer.see;
      },
      pool: { weatherChaos: { price: { event_weatherChaosToken: 1 } } },
    },
  },
  "modules/event/weatherChaos/upgrade": {
    juicyBait: {
      type: "weatherChaos",
      price(lvl) {
        return { event_algae:me: "weatherChaosFishSizeMax", tyx", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    incubator: {
      type: "weatherChaos",
      price(lvl) {
        return { event_driftwood: Math.pow(1.25 + 0.065 * lvl, lvl) * 250 };
      },
      effect: [
        { name: "weatherChaosFishSizeAverage", type: "base", value: (lvl) => lvl * 0.2 },
        { name: "weatherChaosFishSizeAverage", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    fishWhistle: {
      type: "weatherChaos",
      price(lvl) {
        return { event_plastic: Math.pow(1.15 + 0.015 * lvl, lvl) * 100 };
      },
      effect: [{ name: "weatherChaosFishingPower", type: "base", value: (lvl) => getSequence(1, lvl) * 0.1 + lvl }],
    },
    pollution: {
      type: "weatherChaos",
      price(lvl) {
        return { event_slime: Math.pow(1.35, lvl) * 100 };
      },
      effect: [{ name: "weatherChaosTrashGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    goldenHook: {
      type: "weatherChaos",
      cap: 4,
      price(lvl) {
        return { gem_topaz: lvl * 250 + 500 };
      },
      effect: [{ name: "weatherChaosFishingTime", type: "mult", value: (lvl) => 1 / (lvl * 0.25 + 1) }],
    },
  },
  "modules/event/weatherChaos/weather": {
    sunny: {
      icon: "mdi-weather-sunny",
      next: ["hazy", "partlyCloudy", "partlyLightning", "partlyRainy", "partlyS      next: [
        "fog",
     lyRainy",
        "partlySnowy",
        "rainy",
        "snowy",
        "partlyWindy",
      ],
    },
    fog: { icon: "mdi-weather-fog", next: ["cloudy", "hazy", "rainy", "partlyWindy"] },
    hail: { icon: "mdi-weather-hail", next: ["pouring"di-weather-hazy", next: ["sunny"ning", next: ["cloudy", "thunderstorm", "partlyLightning"], thunder: true },
    thunderstorm: {
      icon: "mdi-weather-lightning-rainy",
      next: ["lightning", "pouring", "rainy"],
      rain: true,
      thunder: true,
    },
    partlyCloudazy", "partlyLightning", "partlyR: "mdi-weather-partly-lightning",
      next: ["sunny", "cloudy", "lightning", "partlyCloudy"],
      sun: true,
      thunder: true,
    },
    partlyRainy: {
      icon: "mdi-weather-partly-rainy",
      next: ["sunny", "cloudy", "partlyCloudy", n: "mdi-weather-partly-snowy",
   ow: true,
    },
    pouring: { icon: "mdi-weather-pouring", next: ["hail", "thunderstorm", "rainy"], rain: true },
    rainy: {
      icon: "mdi-weather-rainy",
      next: ["cloudy", "fog", "hail", "thunderstorm", "partlyRainy", "pouring", "snowy      next: ["cloudy", "hail", "p { icon: "mdi-weather-snowy-heavy", next: ["hail", "s"rainy", "snowy"], rain: true },
 e },
    partlyWindy: { icon: "mdi-weather-windy-variant", next: ["cloudy", "fog", "windy"], wind: true },
    storm: { icon: "mdi-weather-tornado", next: ["windy"], wind: true },
  },
  "modules/event": {
    name: "event",
    tickspeed: 1,
    unlockNeeded: "eventFeature",
    tick(seconds, oldTime, newTime) {
      const currentEvent = store.getters["event/currentEvent"];
      if (oldTime === 0 || store.state.event.force_event !== null) {
        if (currentEvent && store.getters["event/eventIsBig"](currentEvent)) {
          eventTicks[currentEvent](seconds, oldTime, newTime);
        }
      } else {
        const oldDate = new Date(oldTime * 1000);
        const newDate = new Date(newTime * 1000);
        const oldDay = getDay(oldDate);
        const newDay = getDay(newDate);
        const stats = store.getters["event/dayStats"](oldDay, newDay); // Tick old event
        if (
          !stats.isSameEvent &&
          !stats.startedBigEvent &&
          stats.startEvent !== null &&
          store.getters["event/eventIsBig"](stats.startEvent)
        ) {
          const newTicks = Math.floor(
            Math.min(
              new Date(`${oldDate.getFullYear()}-${store.state.event.big[stats.startEvent].end}T23:59:59`).getTime(),
              newDate.getTime(),
            ) / 1000,
          );
          eventTicks[stats.startEvent](newTicks - oldTime, oldTime, newTicks);
        }
        if (oldDay !== newDay) {
          store.dispatch("event/dayChange", { start: oldDay, end: newDay });
        } // Tick new event
        if (stats.isBigEvent) {
          const oldTicks = Math.floor(
            Math.max(
              new Date(`${newDate.getFullYear()}-${store.state.event.big[currentEvent].start}T00:00:00`).getTime(),
              oldDate.getTime(),
            ) / 1000,
          );
          eventTicks[currentEvent](newTime - oldTicks, oldTicks, newTime);
        }
      }
    },
    unlock: [
      "eventFeature",
      "bloomPoppyFlower",
      "bloomIrisFlower",
      "bloomLilyFlower",
      "bloomOrchidFlower",
      "bloomCornflowerFlower",
      "summerFestivalTerraform",
      "cindersEvent",
      "bloomEvent",
      "weatherChaosEvent",
      "summerFestivalEvent",
      "nightHuntEvent",
      "snowdownEvent",
      "merchantEvent",
      "bingoCasinoEvent",
      "wheelOfFortuneCasinoEvent",
      "bankEvent",
    ],
    stat: {
      bloomMaxDaisy: { type: "bloom" },
      bloomMaxPoppy: { type: "bloom" },
      bloomMaxIris: { type: "bloom" },
      bloomMaxLily: { type: "bloom" },
      summerFestivalMaxStage: { type: "summerFestival" },
      cindersHighscore: { type: "cinders" },
      bloomHighscore: { type: "bloom" },
      weatherChaosHighscore: { type: "weatherChaos" },
      summerFestivalHighscore: { type: "summerFestival" },
      nightHuntHighscore: { type: "nightHunt" },
      snowdownHighscore: { type: "snowdown" },
    },
    mult: {
      // shop mults
      merchantOffers: { baseValue: 6, round: true }, // bank mults
      bankInvestmentSize: { baseValue: 500, round: true },
      bankLoanSize: { baseValue: 500, round: true },
      bankCardPackChance: { display: "percent" }, // cinders mults
      cindersProductionFirefly: { baseValue: 1 },
      cindersProductionGlowshroom: { baseValue: 75 },
      cindersProductionGlowfish: { baseValue: 4000 },
      cindersProductionLantern: { baseValue: buildNum(200, "K") },
      cindersProductionCampfire: { baseValue: buildNum(12, "M") },
      cindersProductionCoral: { baseValue: buildNum(800, "M") },
      cindersProductionJellyfish: { baseValue: buildNum(35, "B") },
      cindersProductionNightbloom: { baseValue: buildNum(1.5, "T") },
      cindersProductionNeonlight: { baseValue: buildNum(40, "T") },
      cindersProductionSun: { baseValue: buildNum(1, "Qa") },
      cindersFirstProducerCost: {},
      cindersNonFirstProducerCost: {},
      cindersUpgradeLightCost: {},
      cindersUpgradeProducerRequirement: {},
      cindersCandlePower: {}, // bloom mults
      bloomInventorySize: { baseValue: 5, round: true },
      bloomBreederSize: { baseValue: 1, round: true },
      bloomDaisyChance: { baseValue: 0.3, display: "percent" },
      bloomPoppyChance: { baseValue: 0.25, display: "percent" },
      bloomIrisChance: { baseValue: 0.2, display: "percent" },
      bloomLilyChance: { baseValue: 0.15, display: "percent" },
      bloomOrchidChance: { baseValue: 0.1, display: "percent" },
      bloomCornflowerChance: { baseValue: 0.05, display: "percent" },
      bloomDaisyBreedTime: { baseValue: 300, display: "time", min: 1, round: true }, // 5m
      bloomPoppyBreedTime: { baseValue: 900, display: "time", min: 1, round: true }, // 15m -> 10m
      bloomIrisBreedTime: { baseValue: 2400, display: "time", min: 1, round: true }, // 40m -> 20m
      bloomLilyBreedTime: { baseValue: 6000, display: "time", min: 1, round: true }, // 1h40m -> 40m
      bloomOrchidBreedTime: { baseValue: 14400, display: "time", min: 1, round: true }, // 4h -> 1h20m
      bloomCornflowerBreedTime: { baseValue: 28800, display: "time", min: 1, round: true }, // 8h -> 2h40m
      // weather chaos mults
      weatherChaosFishingPower: {},
      weatherChaosFishSizeMax: { min: 1 },
      weatherChaosFishSizeAverage: { baseValue: 1 },
      weatherChaosFishingTiFishDoubleChance: { display: "percin: 0, max: 1 },
      weatherChaosFishChance: { baseValue: 0.25, display: "percent", min: 0, max: 1 },
      weatherChaosTreasureChance: { baseValue: 0.05, display: "percent", min: 0, max: 1 },
      weatherChaosAlgaeWeight: { baseValue: 1 },
      weatherChaosDriftwoodWeight: { baseValue: 1 },
      weatherChaosPlasticWeight: { baseValue: 1 },
      weatherChaosTrashGain: {
        group: ["currencyEventAlgaeGain", "currencyEventDriftwoodGain", "currencyEventPlasticGain"],
      }, // summer festival mults
      summerFestivalBuildQueueSlots: { baseValue: 3, round: true },
      summerFestivalBuildQueueSpeed: { baseValue: 1 },
      summerFestivalMaterialGain: { baseValue: 100 },
      summerFestivalMaterialStackCap: { baseValue: 10 }, // night hunt mults
      nightHuntFindableIngredients: { baseValue: 4, round: true },
      nightHuntIngredientSize: { baseValue: 8, round: true },
      nightHuntFavouriteIngredientSize: { round: true },
      nightHuntMaxIngredients: { baseValue: 1, round: true },
      nightHuntBonusIngredientCount: { round: true },
      nightHuntBonusIngredientAmount: { baseValue: 1, round: true },
      nightHuntRitualStability: { display: "percent", min: -1, max: 2 },
      nightHuntRitualSuccessChance: { display: "percent", min: 0, max: 1 },
      nightHuntRitualHintChance: { display: "percent", min: 0, max: 1 },
      nightHuntRitualFamiliarity: { display: "percent", min: 0 }, // snowdown mults
      snowdownAttack: { baseValue: 4 },
      snowdownHealth: { baseValue: 40, round: true },
      snowdownDefense: { round: true },
      snowdownCritRating: {},
      snowdownBlockRating: {},
      snowdownPetAttack: {},
      snowdownPetHealth: { round: true },
      snowdownPetDefense: { round: true },
      snowdownPetCritRating: {},
      snowdownPetBlockRating: {},
      snowdownAllAttack: { group: ["snowdownAttack", "snowdownPetAttack"] },
      snowdownAllHealth: { group: ["snowdownHealth", "snowdownPetHealth"] },
      snowdownAllDefense: { group: ["snowdownDefense", "snowdownPetDefense"] },
      snowdownRevengeStats: { display: "percent" },
      snowdownRevengeCrit: {},
      snowdownRevengeBlock: {},
      snowdownResourceGain: {},
    },
    multGroup: [{ mult: "snowdownResourceGain", name: "currencyGain", subtype: "snowdownResource" }],
    currency: {
      // cinders currencies
      light: { type: "cinders", color: "yellow", icon: "mdi-lightbulb-on", gainMult: {} },
      soot: { type: "cinders", color: "darker-grey", icon: "mdi-liquid-spot", gainMult: {} }, // bloom currencies
      blossom: { type: "bloom", color: "pale-pink", icon: "mdi-flower-poppy", gainMult: {} }, // weather chaos currencies
      algae: { type: "weatherChaos", color: "green", icon: "mdi-grass", gainMult: {} },
      driftwood: { type: "weatherChaos", color: "wooden", icon: "mdi-tree", gainMult: {} },
      plastic: { type: "weatherChaos", color: "pale-pink", icon: "mdi-delete-variant", gainMult: {} },
      slime: { type: "weatherChaos", color: "lime", icon: "mdi-liquid-spot", gainMult: {} }, // summer festival currencies
      log: { type: "summerFestival", color: "wooden", icon: "mdi-tray-full" },
      stoneBlock: { type: "summerFestival", color: "grey", icon: "mdi-cube" },
      coconut: { type: "summerFestival", color: "brown", icon: "mdi-bowling" },
      shell: { type: "summerFestival", color: "pale-pink", icon: "mdi-set-all" },
      music: { type: "summerF      sand: { type: "summerFestival",      freshWater: { type: "summerFestival", color: "light-blue", icon: "mdi-water", gainMult: {}, showGainMult: true },
      coal: {
        type: "summerFestival",
        color: "darker-grey",
        icon: "mdi-chart-bubble",
        gainMult: {},
        showGainMult: true,
      },
      metalPart: {
        type: "summerFestival",
        color: "blue-grey",
        icon: "mdi-scatter-plot",
        gainMult: {},
        showGainMult: true,
      },
      pearl: { type: "summerFestival", color: "skyblue", icon: "mdi-circle-opacity", gainMult: {}, showGainMult: true },
      salt: { type: "summerFestival", color: "lighter-grey", icon: "mdi-shaker", gainMult: {}, showGainMult: true },
      pepper: { type: "summerFestival", color: "dark-grey", icon: "mdi-shaker", gainMult: {}, showGainMult: true },
      honey: { type: "summerFestival", color: "amber", icon: "mdi-beehive-outline", gainMult: {}, showGainMult: true },
      vegetable: { type: "summerFestival", color: "green", icon: "mdi-leek", gainMult: {}, showGainMult: true },
      citrusFruit: {
        type: "summerFestival",
        color: "yellow",
        icon: "mdi-fruit-citrus",
        gainMult: {},
        showGainMult: true,
      },
      rawFish: { type: "summerFestival", color: "teal", icon: "mdi-fish", gainMult: {}, showGainMult: true },
      cookedFish: { type: "summerFestival", color: "pale-orange", icon: "mdi-fish" },
      rawMeat: { type: "summerFestival", color: "red", icon: "mdi-food-steak", gainMult: {}, showGainMult: true },
      cookedMeat: { type: "summerFestival", color: "brown", icon: "mdi-food-steak" }, // Crafted items
      solidPlate: { type: "summerFestival", color: "light-grey", icon: "mdi-layers" },
      sandstone: { type: "summerFestival", color: "pale-yellow", icon: "mdi-wall" },
      hardSteel: { type: "summerFestival", color: "dark-grey", icon: "mdi-gold" },
      compositePlate: { type: "summerFestival", color: "pale-orange", icon: "mdi-pillar" }, // Cooked meals
      coconutSalad: { type: "summerFestival", color: "pale-green", icon: "mdi-bowl-mix" },
      saltyShell: { type: "summerFestival", color: "pale-red", icon: "mdi-set-all" },
      lemonCandy: { type: "summerFestival", color: "yellow", icon: "mdi-candy" },
      steak: { type: "summerFestival", color: "wooden", icon: "mdi-food-steak" },
      fishSticks: { type: "summerFestival", color: "pale-orange", icon: "mdi-tally-mark-4" }, // night hunt currencies
      essence: {
        type: "nightHunt",
        color: "pink",
        icon: "mdi-flask-round-bottom",
        gainMult: { display: "perSecond" },
        showGainMult: true,
      },
      lavender: { type: "nightHunt", color: "pale-purple", icon: "mdi-grass" },
      mapleLeaf: { type: "nightHunt", color: "orange", icon: "mdi-leaf-maple" },
      fourLeafClover: { type: "nightHunt", color: "pale-green", icon: "mdi-clover" },
      charredSkull: { type: "nightHunt", color: "dark-grey", icon: "mdi-skull" },
      mysticalWater: { type: "nightHunt", color: "cyan", icon: "mdi-flask-round-bottom-outline" },
      cheese: { type: "nightHunt", color: "yellow", icon: "mdi-cheese" },
      spiderWeb: { type: "nightHunt", color: "light-grey", icon: "mdi-spider-web" },
      strangeEgg: { type: "nightHunt", color: "orange-red", icon: "mdi-egg-easter" },
      puzzlePiece: { type: "nightHunt", color: "red-pink", icon: "mdi-puzzle" },
      wizardHat: { type: "nightHunt", color: "indigo", icon: "mdi-wizard-hat" },
      cactus: { type: "nightHunt", color: "green", icon: "mdi-cactus" },
      feather: { type: "nightHunt", color: "skyblue", icon: "mdi-feather" }, // snowdown currencies
      sapling: {
        type: "snowdown",
        subtype: "snowdownResource",
        color: "green",
        icon: "mdi-sprout",
        gainMultrue,
      },
      yarn: {
             icon: "mdi-link",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
      },
      dough: {
        type: "snowdown",
        subtype: "snowdownResource",
        color: "beige",
        icon: "mdi-liquid-spot",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
      },
      snow: {
        type: "snowdown",
        subtype: "snowdownResource",
        color: "light-blue",
        icon: "mdi-snowflake",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
      }, // topaz drop replacement currencies
      wax: { type: "cinders", color: "pale-yellow", icon: "mdi-beehive-outline" },
      humus: { type: "bloom", color: "brown", icon: "mdi-gradient-vertical" },
      cloud: { type: "weatherChaos", color: "skyblue", icon: "mdi-cloud" },
      cocktail: { type: "summerFestival", color: "amber", icon: "mdi-glass-cocktail" },
      magic: { type: "nightHunt", color: "pink-purple", icon: "mdi-auto-fix" },
      snowball: { type: "snowdown", color: "skyblue", icon: "mdi-circle" }, // reward tokens
      cindersToken: { type: "token", color: "amber", icon: "mdi-poker-chip", gainMult: {} },
      bloomToken: { type: "token", color: "light-green", icon: "mdi-poker-chip" },
      weatherChaosToken: { type: "token", color: "grey", icon: "mdi-poker-chip" },
      summerFestivalToken: { type: "token", color: "red", icon: "mdi-poker-chip" },
      nightHuntToken: { type: "token", color: "purple", icon: "mdi-poker-chip" },
      snowdownToken: { type: "token", color: "blue", icon: "mdi-poker-chip" },
    },
    upgrade: {
      ...cindersUpgrade,
      ...cindersProducer,
      ...bloomUpgrade,
      ...weatherChaosUpgrade,
      ...summerFestivalUpgrade,
      ...nightHuntUpgrade,
      ...snowdownUpgrade,
    },
    relic,
    note: buildArray(34).map(() => "g"),
    init() {
      for (const [key, elem] of Object.entries(weather)) {
        store.commit("weatherChaos/initWeather", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(fishingRod)) {
        store.commit("weatherChaos/initFishingRod", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(location)) {
        store.commit("weatherChaos/initLocation", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(fish)) {
        store.commit("weatherChaos/initFish", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(bait)) {
        store.commit("weatherChaos/initBait", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(building)) {
        store.commit("summerFestival/initBuilding", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(ingredientStat)) {
        store.commit("nightHunt/initIngredientStat", { name: key, effect: elem });
      }
      for (const [key, elem] of Object.entries(potion)) {
        store.commit("nightHunt/initPotion", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(item)) {
        store.commit("snowdown/initItem", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(prize)) {
        store.commit("event/initPrize", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(project)) {
        store.commit("event/initBankProject", { name: key, ...elem });
      }
    },
    saveGame() {
      let obj = {};
      if (store.state.event.force_event !== null) {
        obj.force_event = store.state.event.force_event;
      }
      if (store.state.event.shop_merchant.length > 0) {
        obj.shop_merchant = store.state.event.shop_merchant;
      }
      if (store.state.event.shop_big.length > 0) {
        obj.shop_big = store.state.event.shop_big;
      }
      if (store.state.event.casino_type !== null) {
        obj.casino_type = store.state.event.casino_type;
      }
      if (store.state.event.casino_bingo_bought) {
        obj.casino_bingo_bought = true;
      }
      if (store.state.event.casino_bingo_card !== null) {
        obj.casino_bingo_card = store.state.event.casino_bingo_card;
      }
      if (store.state.event.casino_bingo_draws.length > 0) {
        obj.casino_bingo_draws = store.state.event.casino_bingo_draws;
      }
      if (store.state.event.casino_bingo_boosts.length > 0) {
        obj.casino_bingo_boosts = store.state.event.casino_bingo_boosts;
      }
      if (store.state.event.casino_bingo_prize_1 !== null) {
        obj.casino_bingo_prize_1 = store.state.event.casino_bingo_prize_1;
      }
      if (store.state.event.casino_bingo_prize_2 !== null) {
        obj.casino_bingo_prize_2 = store.state.event.casino_bingo_prize_2;
      }
      if (store.state.event.casino_bingo_prize_3 !== null) {
        obj.casino_bingo_prize_3 = store.state.event.casino_bingo_prize_3;
      }
      if (store.state.event.casino_wheel_segments.length > 0) {
        obj.casino_wheel_segments = store.state.event.casino_wheel_segments;
      }
      if (store.state.event.casino_wheel_rotation > 0) {
        obj.casino_wheel_rotation = store.state.event.casino_wheel_rotation;
      }
      let bankProjects = {};
      let hasBankProject = false;
      for (const [key, elem] of Object.entries(store.state.event.bank_project)) {
        if (elem.level > 0 || elem.spent > 0) {
          bankProjects[key] = { level: elem.level, spent: elem.spent };
          hasBankProject = true;
        }
      }
      if (hasBankProject) {
        obj.bank_project = bankProjects;
      }
      if (store.state.event.bank_project_current !== null) {
        obj.bank_project_current = store.state.event.bank_project_current;
      }
      if (store.state.event.bank_investment > 0) {
        obj.bank_investment = store.state.event.bank_investment;
      }
      if (store.state.event.bank_loan > 0) {
        obj.bank_loan = store.state.event.bank_loan;
      }
      if (store.state.event.bank_action) {
        obj.bank_action = true;
      } // cinders stuff
      if (store.state.cinders.activeCandle !== null) {
        obj.cinders_candle = store.state.cinders.activeCandle;
      } // bloom stuff
      if (store.state.bloom.inventory.length > 0) {
        obj.bloom_inventory = store.state.bloom.inventory;
      }
      if (store.state.bloom.breeder.length > 0) {
        obj.bloom_breeder = store.state.bloom.breeder;
      } // weather chaos stuff
      if (store.state.weatherChaos.currentLocation !== "pond") {
        obj.weatherChaos_currentLocation = store.state.weatherChaos.currentLocation;
      }
      if (store.state.weatherChaos.currentFishingRod !== "basic") {
        obj.weatherChaos_currentFishingRod = store.state.weatherChaos.currentFishingRod;
      }
      if (store.state.weatherChaos.currentBait !== null) {
        obj.weatherChaos_currentBait = store.state.weatherChaos.curren    obj.weatherChaos_nextWeather = sfishingProgress > 0) {
        obj.weatherChaos_fishingProgress = store.state.weatherChaos.fishingProgress;
      }
      if (store.state.weatherChaos.treasureRods > 0) {
        obj.weatherChaos_treasureRods = store.state.weatherChaos.treasureRods;
      }
      if (store.state.weatherChaos.boughtRods > 0) {
        obj.weatherChaos_boughtRods = store.state.weatherChaos.boughtRods;
      }
      let weatherChaosFishingRod = [];
      for (const [key, elem] of Object.entries(store.state.weatherChaos.fishingRod)) {
        if (elem.owned && !elem.ownedDefault) {
          weatherChaosFishingRod.push(key);
        }
      }
      if (weatherChaosFishingRod.length > 0) {
        obj.weatherChaos_fishingRod = weatherChaosFishingRod;
      }
      let weatherChaosLocation = [];
      for (const [key, elem] of Object.entries(store.state.weatherChaos.location)) {
        if (elem.owned && !elem.ownedDefault) {
          weatherChaosLocation.push(key);
        }
      }
      if (weatherChaosLocation.length > 0) {
        obj.weatherChaos_location = weatherChaosLocation;
      }
      let weatherChaosBait = {};
      for (const [key, elem] of Object.entries(store.state.weatherChaos.bait)) {
        if (elem.owned > 0) {
          weatherChaosBait[key] = elem.owned;
        }
      }
      if (Object.keys(weatherChaosBait).length > 0) {
        obj.weatherChaos_bait = weatherChaosBait;
      }
      let weatherChaosFish = {};
      for (const [key, elem] of Object.entries(store.state.weatherChaos.fish)) {
        if (elem.catchRecord !== null) {
          weatherChaosFish[key] = elem.catchRecord;
        }
      }
      if (Object.keys(weatherChaosFish).length > 0) {
        obj.weatherChaos_fish = weatherChaosFish;
      } // summer festival stuff
      if (Object.keys(store.state.summerFestival.placedBuilding).length > 0) {
        obj.summerFestival_placedBuilding = store.state.summerFestival.placedBuilding;
      }
      if (store.state.summerFestival.buildQueue.length > 0) {
        obj.summerFestival_buildQueue = store.state.summerFestival.buildQueue;
      }
      if (store.state.summerFestival.nextBuildingId > 1) {
        obj.summerFestival_nextBuildingId = store.state.summerFestival.nextBuildingId;
      }
      if (store.state.summerFestival.island !== null) {
        obj.summerFestival_island = store.state.summerFestival.island.map((row) =>
          row.map((cell) => {
            return { tile: cell.tile, drop: cell.drop, building: cell.building, unlocked: cell.unlocked };
          }),
        );
      }
      if (store.state.summerFestival.freeExpansion > 0) {
        obj.summerFestival_freeExpansion = store.state.summerFestival.freeExpansion;
      }
      if (store.state.summerFestival.topazExpansion > 0) {
        obj.summerFestival_topazExpansion = store.state.summerFestival.topazExpansion;
      }
      if (store.state.summerFestival.questsCompleted > 0) {
        obj.summerFestival_questsCompleted = store.state.summerFestival.questsCompleted;
      } // night hunt stuff
      if (Object.keys(store.state.nightHunt.changedCurrency).length > 0) {
        obj.nightHunt_changedCurrency = store.state.nightHunt.changedCurrency;
      }
      if (store.state.nightHunt.ritualIngredients.length > 0) {
        obj.nightHunt_ritualIngredients = store.state.nightHunt.ritualIngredients;
      }
      if (store.state.nightHunt.bonusIngredients.length > 0) {
        obj.nightHunt_bonusIngredients = store.state.nightHunt.bonusIngredients;
      }
      if (store.state.nightHunt.performedRituals.length > 0) {
        obj.nightHunt_performedRituals = store.state.nightHunt.performedRituals;
      }
      if (Object.keys(store.state.nightHunt.ritualFamiliarity).length > 0) {
        obj.nightHunt_ritualFamiliarity = store.state.nightHunt.ritualFamiliarity;
      }
      if (Object.keys(store.state.nightHunt.ritualHint).length > 0) {
        obj.nightHunt_ritualHint = store.state.nightHunt.ritualHint;
      }
      if (store.state.nightHunt.favouriteIngredient !== "copy") {
        obj.nightHunt_favouriteIngredient = store.state.nightHunt.favouriteIngredient;
      }
      let potions = {};
      let hasPotions = false;
      for (const [key, elem] of Object.entries(store.state.nightHunt.potion)) {
        if (elem.recipe !== null || elem.level > 0) {
          potions[key] = { recipe: elem.recipe, level: elem.level };
          hasPotions = true;
        }
      }
      if (hasPotions) {
        obj.nightHunt_potion = potions;
      } // snowdown stuff
      if (store.state.snowdown.fight > 0) {
        obj.snowdown_fight = store.state.snowdown.fight;
      }
      if (store.state.snowdown.rewardProducer) {
        obj.snowdown_rewardProducer = true;
      }
      if (store.state.snowdown.rewardItem !== null) {
        obj.snowdown_rewardItem = store.state.snowdown.rewardItem;
      }
      if (store.state.snowdown.itemsBought > 0) {
        obj.snowdown_itemsBought = store.state.snowdown.itemsBought;
      }
      if (store.state.snowdown.itemsBoughtTopaz > 0) {
        obj.snowdown_itemsBoughtTopaz = store.state.snowdown.itemsBoughtTopaz;
      }
      if (store.state.snowdown.revenge > 0) {
        obj.snowdown_revenge = store.state.snowdown.revenge;
      }
      let items = {};
      let hasItems = false;
      for (const [key, elem] of Object.entries(store.state.snowdown.item)) {
        if (elem.amount > 0) {
          items[key] = elem.amount;
          hasItems = true;
        }
      }
      if (hasItems) {
        obj.snowdown_item = items;
      }
      return obj;
    },
    loadGame(data) {
      if (data.force_event !== undefined) {
        store.commit("event/updateKey", { key: "force_event", value: data.force_event });
      }
      if (data.shop_merchant !== undefined) {
        store.commit("event/updateKey", { key: "shop_merchant", value: data.shop_merchant });
      }
      if (data.shop_big !== undefined) {
        store.commit("event/updateKey", { key: "shop_big", value: data.shop_big });
      }
      if (data.casino_type !== undefined) {
        store.commit("event/updateKey", { key: "casino_type", value: data.casino_type });
      }
      if (data.casino_bingo_bought !== undefined) {
        store.commit("event/updateKey", { key: "casino_bingo_bought", value: data.casino_bingo_bought });
      }
      if (data.casino_bingo_card !== undefined) {
        store.commit("event/updateKey", { key: "casino_bingo_card", value: data.casino_bingo_card });
      }
      if (data.casino_bingo_draws !== undefined) {
        store.commit("event/updateKey", { key: "casino_bingo_draws", value: data.casino_bingo_draws });
      }
      if (data.casino_bingo_boosts !== undefined) {
        store.commit("event/updateKey", { key: "casino_bingo_boosts", value: data.casino_bingo_boosts });
      }
      if (data.casino_bingo_prize_1 !== undefined) {
        store.commit("event/updateKey", { key: "casino_bingo_prize_1", value: data.casino_bingo_prize_1 });
      }
      if (data.casino_bingo_prize_2 !== undefined) {
        store.commit("event/updateKey", { key: "casino_bingo_prize_2", value: data.casino_bingo_prize_2 });
      }
      if (data.casino_bingo_prize_3 !== undefined) {
        store.commit("event/updateKey", { key: "casino_bingo_prize_3", value: data.casino_bingo_prize_3 });
      }
      if (data.casino_wheel_segments !== undefined) {
        store.commit("event/updateKey", { key: "casino_wheel_segments", value: data.casino_wheel_segments });
      }
      if (data.casino_wheel_rotation !== undefined) {
        store.commit("event/updateKey", { key: "casino_wheel_rotation", value: data.casino_wheel_rotation });
      }
      if (data.bank_project_current !== undefined) {
        store.commit("event/updateKey", { key: "bank_project_current", value: data.bank_project_current });
      }
      if (data.bank_project !== undefined) {
        for (const [key, elem] of Object.entries(data.bank_project)) {
          store.commit("event/updateBankProjectKey", { name: key, key: "spent", value: elem.spent });
          if (elem.level > 0) {
            store.commit("event/updateBankProjectKey", { name: key, key: "level", value: elem.level });
            store.dispatch("event/bankProjectApply", { name: key, onBuy: false });
          }
        }
      }
      if (data.bank_investment !== undefined) {
        store.commit("event/updateKey", { key: "bank_investment", value: data.bank_investment });
      }
      if (data.bank_loan !== undefined) {
        store.commit("event/updateKey", { key: "bank_loan", value: data.bank_loan });
      }
      if (data.bank_action !== undefined) {
        store.commit("event/updateKey", { key: "bank_action", value: data.bank_action });
      }
      if (data.cinders_candle !== undefined) {
        store.commit("cinders/updateKey", { key: "activeCandle", value: data.cinders_candle });
      }
      if (data.bloom_inventory !== undefined) {
        store.commit("bloom/updateKey", { key: "inventory", value: data.bloom_inventory });
      }
      if (data.bloom_breeder !== undefined) {
        store.commit("bloom/updateKey", { key: "breeder", value: data.bloom_breeder });
      }
      if (data.weatherChaos_currentLocation !== undefined) {
        store.commit("weatherChaos/updateKey", { key: "currentLocation", value: data.weatherChaos_currentLocation });
        store.dispatch("weatherChaos/applyLocationEffects", data.weatherChaos_currentLocation);
      }
      if (data.weatherChaos_currentFishingRod !== undefined) {
        store.commit("weatherChaos/updateKey", {
          key: "currentFishingRod",
          value: data.weatherChaos_currentFishingRod,
        });
        store.dispatch("weatherChaos/applyFishingRodEffects", data.weatherChaos_currentFishingRod);
      }
      if (data.weatherChaos_currentBait !== undefined) {
        store.commit("weatherChaos/updateKey", { key: "currentBait", value: data.weatherChaos_currentBait });
        store.dispatch("weatherChaos/applyBaitEffects", data.weatherChaos_currentBait);
      }
      if (data.weatherChaos_nextWeather !== undefined) {
        store.commit("weatherChaos/updateKey", { key: "nextWeather", value: data.weatherChaos_nextWeather });
      }
      if (data.weatherChaos_fishingProgress !== undefined) {
        store.commit("weatherChaos/updateKey", { key: "fishingProgress", value: data.weatherChaos_fishingProgress });
      }
      if (data.weatherChaos_treasureRods !== undefined) {
        store.commit("weatherChaos/updateKey", { key: "treasureRods", value: data.weatherChaos_treasureRods });
      }
      if (data.weatherChaos_boughtRods !== undefined) {
        store.commit("weatherChaos/updateKey", { key: "boughtRods", value: data.weatherChaos_boughtRods });
      }
      if (data.weatherChaos_fishingRod !== undefined) {
        data.weatherChaos_fishingRod.forEach((key) => {
          store.commit("weatherChaos/updateSubkey", { name: "fishingRod", key, subkey: "owned", value: true });
        });
      }
      if (data.weatherChaos_location !== undefined) {
        data.weatherChaos_location.forEach((key) => {
          store.commit("weatherChaos/updateSubkey", { name: "location", key, subkey: "owned", value: true });
        });
      }
      if (data.weatherChaos_bait !== undefined) {
        for (const [key, elem] of Object.entries(data.weatherChaos_bait)) {
          store.commit("weatherChaos/updateSubkey", { name: "bait", key, subkey: "owned", value: elem });
        }
      }
      if (data.weatherChaos_fish !== undefined) {
        for (const [key, elem] of Object.entries(data.weatherChaos_fish)) {
          store.commit("weatherChaos/updateSubkey", { name: "fish", key, subkey: "catchRecord", value: elem });
        }
      }
      if (data.summerFestival_buildQueue !== undefined) {
        store.commit("summerFestival/updateKey", { key: "buildQueue", value: data.summerFestival_buildQueue });
      }
      if (data.summerFestival_nextBuildingId !== undefined) {
        store.commit("summerFestival/updateKey", { key: "nextBuildingId", value: data.summerFestival_nextBuildingId });
      }
      if (data.summerFestival_island !== undefined) {
        store.commit("summerFestival/updateKey", {
          key: "island",
          value: data.summerFestival_island.map((row) =>
            row.map((cell) => {
              return { ...cell, cacheAutocollect: null };
            }),
          ),
        });
      }
      if (data.summerFestival_freeExpansion !== undefined) {
        store.commit("summerFestival/updateKey", { key: "freeExpansion", value: data.summerFestival_freeExpansion });
      }
      if (data.summerFestival_topazExpansion !== undefined) {
        store.commit("summerFestival/updateKey", { key: "topazExpansion", value: data.summerFestival_topazExpansion });
      }
      if (data.summerFestival_questsCompleted !== undefined) {
        store.commit("summerFestival/updateKey", {
          key: "questsCompleted",
          value: data.summerFestival_questsCompleted,
        });
      }
      if (data.summerFestival_placedBuilding !== undefined) {
        store.commit("summerFestival/updateKey", { key: "placedBuilding", value: data.summerFestival_placedBuilding });
        for (const [key, elem] of Object.entries(data.summerFestival_placedBuilding)) {
          if (elem.level > 0) {
            store.dispatch("summerFestival/applyBuildingEffects", parseInt(key));
          }
        }
        store.dispatch("summerFestival/calculateConnectCaches");
      }
      if (data.nightHunt_changedCurrency !== undefined) {
        store.commit("nightHunt/updateKey", { key: "changedCurrency", value: data.nightHunt_changedCurrency });
      }
      if (data.nightHunt_ritualIngredients !== undefined) {
        store.commit("nightHunt/updateKey", { key: "ritualIngredients", value: data.nightHunt_ritualIngredients });
      }
      if (data.nightHunt_bonusIngredients !== undefined) {
        store.commit("nightHunt/updateKey", { key: "bonusIngredients", value: data.nightHunt_bonusIngredients });
      }
      if (data.nightHunt_performedRituals !== undefined) {
        store.commit("nightHunt/updateKey", { key: "performedRituals", value: data.nightHunt_performedRituals });
      }
      if (data.nightHunt_ritualFamiliarity !== undefined) {
        store.commit("nightHunt/updateKey", { key: "ritualFamiliarity", value: data.nightHunt_ritualFamiliarity });
      }
      if (data.nightHunt_ritualHint !== undefined) {
        store.commit("nightHunt/updateKey", { key: "ritualHint", value: data.nightHunt_ritualHint });
      }
      if (data.nightHunt_favouriteIngredient !== undefined) {
        store.commit("nightHunt/updateKey", { key: "favouriteIngredient", value: data.nightHunt_favouriteIngredient });
      }
      if (data.nightHunt_potion !== undefined) {
        for (const [key, elem] of Object.entries(data.nightHunt_potion)) {
          store.commit("nightHunt/updatePotionKey", { name: key, key: "recipe", value: elem.recipe });
          if (elem.level > 0) {
            store.commit("nightHunt/updatePotionKey", { name: key, key: "level", value: elem.level });
            store.dispatch("nightHunt/applyPotionEffects", key);
          }
        }
      }
      if (data.snowdown_fight !== undefined) {
        store.commit("snowdown/updateKey", { key: "fight", value: data.snowdown_fight });
      }
      if (data.snowdown_rewardProducer !== undefined) {
        store.commit("snowdown/updateKey", { key: "rewardProducer", value: data.snowdown_rewardProducer });
      }
      if (data.snowdown_rewardItem !== undefined) {
        store.commit("snowdown/updateKey", { key: "rewardItem", value: data.snowdown_rewardItem });
      }
      if (data.snowdown_itemsBought !== undefined) {
        store.commit("snowdown/updateKey", { key: "itemsBought", value: data.snowdown_itemsBought });
      }
      if (data.snowdown_itemsBoughtTopaz !== undefined) {
        store.commit("snowdown/updateKey", { key: "itemsBoughtTopaz", value: data.snowdown_itemsBoughtTopaz });
      }
      if (data.snowdown_revenge !== undefined) {
        store.commit("snowdown/updateKey", { key: "revenge", value: data.snowdown_revenge });
        store.dispatch("snowdown/applyRevengeEffect");
      }
      if (data.snowdown_item !== undefined) {
        for (const [key, elem] of Object.entries(data.snowdown_item)) {
          store.commit("snowdown/updateItemKey", { name: key, key: "amount", value: elem });
          store.dispatch("snowdown/applyItemEffects", key);
        }
      }
    },
  },
  "modules/farm/achievement": {
    harvests: {
      value: () => store.state.stat.farm_harvests.total,
      milestones: (lvl) => Math.round(Math.pow(lvl + 1, 2) * Math.pow(1.5, lvl) * 10),
    },
    maxOvergrow: {
      value: () => store.state.stat.farm_maxOvergrow.total,
      display: "percent",
      milestones: (lvl) => getSequence(1, lvl + 1),
      relic: { 2: "trellis", 4: "brickWall" },
    },
    bestPrestige: { value: () => store.state.stat.farm_bestPrestige.total, milestones: (lvl) => lvl * 2 + 4 },
    vegetable: {
      value: () => store.state.stat.farm_vegetable.total,
      milestones: (lvl) => Math.pow(81, lvl) * 250,
      relic: { 2: "goldenCarrot" },
    },
    berry: {
      value: () => store.state.stat.farm_berry.total,
      milestones: (lvl) => Math.pow(81, lvl) * 750,
      relic: { 3: "goldenApple" },
    },
    grain: {
      value: () => store.state.stat.farm_grain.total,
      milestones: (lvl) => Math.pow(81, lvl) * 2250,
      relic: { 4: "popcorn" },
    },
    flower: {
      value: () => store.state.stat.farm_flower.total,
      milestones: (lvl) => Math.pow(81, lvl) * 6750,
      relic: { 5: "roseQuartz" },
    },
    gold: {
      value: () => store.state.stat.farm_gold.total,
      milestones: (lvl) => Math.round(Math.pow(lvl + 2, 2) * Math.pow(2.25, lvl) * 2.5),
      relic: { 6: "goldenSeed" },
    },
  },
  "modules/farm/building": {
    gardenGnome: { icon: "mdi-human-child" },
    sprinkler: { icon: "mdi-sprinkler-variant" },
    lectern: { icon: "mdi-book-open-page-variant" },
    pinwheel: { icon: "mdi-pinwheel" },
    flag: { icon: "mdi-flag" },
  },
  "modules/farm/card": {
    feature: {
      prefix: "FA",
      reward: [{ name: "farmCropGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
      shinyReward: [{ name: "farmExperience", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
      powerReward: [
        { name: "farmCropGain", type: "mult", value: (lvl) => Math.pow(1.08, lvl) },
        { name: "farmExperience", type: "base", value: (lvl) => lvl * 0.08 },
      ],
      unlock: "farmFeature",
    },
    collection: {
      feedingTheWorld: {
        reward: [
          { name: "currencyFarmGrainGain", type: "mult", value: 1.25 },
          { name: "currencyFarmFlowerGain", type: "mult", value: 1.25 },
        ],
      },
      organicDyes: {
        reward: [
          { name: "galleryCardCap", type: "base", value: 1 },
          { name: "currencyFarmBerryGain", type: "mult", value: 1.25 },
        ],
      },
    },
    pack: {
      bountifulHarvest: {
        unlock: "farmCropExp",
        amount: 3,
        price: 30,
        content: {
          "FA-0001": 1.5,
          "FA-0002": 1.5,
          "FA-0003": 0.9,
          "FA-0004": 1.5,
          "FA-0005": 1.5,
          "FA-0006": 0.6,
          "FA-0007": 0.6,
          "FA-0008": 0.6,
          "FA-0009": 0.6,
          "FA-0010": 0.5,
          "FA-0011": 0.2,
        },
      },
      juicyYields: {
        unlock: "farmFertilizer",
        amount: 4,
        price: 80,
        content: {
          "FA-0006": 1.2,
          "FA-0007": 1.2,
          "FA-0008": 1.2,
          "FA-0009": 1.2,
          "FA-0010": 1.5,
          "FA-0011": 1,
          "FA-0012": 0.9,
          "FA-0013": 0.6,
          "FA-0014": 0.4,
          "FA-0015": 0.4,
          "FA-0016": 0.4,
        },
      },
      insectWorld: {
        unlock: "farmAdvancedCardPack",
        amount: 2,
        price: 90,
        content: {
          "FA-0010": 2,
          "FA-0011": 1.8,
          "FA-0017": 1.4,
          "FA-0019": 1.4,
          "FA-0020": 1.4,
          "FA-0021": 1.2,
          "FA-0025": 0.8,
        },
      },
      beesAndFlowers: {
        unlock: "farmLuxuryCardPack",
        amount: 3,
        price: 200,
        content: {
          "FA-0012": 0.7,
          "FA-0013": 0.6,
          "FA-0014": 0.4,
          "FA-0015": 0.4,
          "FA-0016": 0.4,
          "FA-0017": 1,
          "FA-0018": 0.1,
          "FA-0019": 1,
          "FA-0020": 1,
          "FA-0021": 0.9,
          "FA-0022": 0.8,
          "FA-0023": 0.8,
          "FA-0024": 0.5,
          "FA-0025": 0.6,
          "FA-0026": 0.4,
          "FA-0027": 0.4,
        },
      },
    },
    card: cardList,
  },
  "modules/farm/crop": {
    carrot: {
      found: true,
      icon: "mdi-carrot",
      color: "orange",
      grow: MINUTES_PER_HOUR,
      yield: 40,
      tier: 0,
      type: "vegetable",
    },
    blueberry: {
      icon: "mdi-fruit-grapes",
      color: "blue",
      grow: 2 * MINUTES_PER_HOUR,
      yield: 70,
      tier: 1,
      type: "berry",
    },
    wheat: { icon: "mdi-barley", color: "yellow", grow: 4 * MINUTES_PER_HOUR, yield: 120, tier: 2, type: "grain" },
    tulip: { icon: "mdi-flower-tulip", color: "red", grow: 8 * MINUTES_PER_HOUR, yield: 200, tier: 3, type: "flower" },
    potato: {
      icon: "mdi-circle",
      color: "brown",
      cost: { farm_gold: 1 },
      grow: 20 * MINUTES_PER_HOUR,
      yield: 640,
      rareDrop: [{ name: "farm_potatoWater", type: "consumable", chance: 0.15, value: 3 }],
      tier: 4,
      type: "vegetable",
    },
    raspberry: {
      icon: "mdi-fruit-grapes",
      color: "pink",
      cost: { farm_gold: 1 },
      grow: 6 * MINUTES_PER_HOUR,
      yield: 300,
      rareDrop: [{ name: "farm_seedHull", type: "currency", chance: 0.2, value: 6 }],
      tier: 5,
      type: "berry",
    },
    barley: {
      icon: "mdi-barley",
      color: "amber",
      grow: 10 * MINUTES_PER_HOUR,
      yield: 230,
      rareDrop: [{ name: "farm_seedHull", type: "currency", chance: 0.06, value: 1 }],
      tier: 6,
      type: "grain",
    },
    dandelion: {
      icon: "mdi-flower",
      color: "pale-yellow",
      cost: { farm_gold: 1 },
      grow: 1 * MINUTES_PER_HOUR + 30,
      yield: 160,
      rareDrop: [{ name: "farm_petal", type: "currency", chance: 0.15, value: 2 }],
      tier: 7,
      type: "flower",
    },
    corn: {
      icon: "mdi-corn",
      color: "amber",
      cost: { farm_grass: 10 },
      grow: 30 * MINUTES_PER_HOUR,
      yield: 550,
      rareDrop: [{ name: "farm_bug", type: "currency", chance: 0.02, value: 2 }],
      tier: 8,
      type: "vegetable",
    },
    watermelon: {
      icon: "mdi-fruit-watermelon",
      color: "red",
      cost: { farm_gold: 4 },
      grow: 12 * MINUTES_PER_HOUR,
      yield: 1100,
      rareDrop: [
        { name: "farm_bug", type: "currency", chance: 0.1, value: 10 },
        { name: "farm_butterfly", type: "currency", chance: -0.02, value: 2 },
      ],
      tier: 9,
      type: "berry",
    },
    rice: {
      icon: "mdi-rice",
      color: "light-grey",
      cost: { farm_gold: 2 },
      grow: 24 * MINUTES_PER_HOUR,
      yield: 1200,
      rareDrop: [
        { name: "farm_seedHull", type: "currency", chance: 0.05, value: 12 },
        { name: "farm_ladybug", type: "currency", chance: -0.05, value: 4 },
      ],
      tier: 10,
      type: "grain",
    },
    rose: {
      icon: "mdi-flower",
      color: "red",
      cost: { farm_gold: 10 },
      grow: 48 * MINUTES_PER_HOUR,
      yield: 4500,
      rareDrop: [
        { name: "farm_petal", type: "currency", chance: 0, value: 12 },
        { name: "farm_ladybug", type: "currency", chance: -0.08, value: 10 },
        { name: "farm_roseWater", type: "consumable", chance: -0.12, value: 8 },
      ],
      tier: 11,
      type: "flower",
    },
    leek: {
      icon: "mdi-leek",
      color: "light-green",
      cost: { farm_gold: 5 },
      grow: 3 * MINUTES_PER_HOUR,
      yield: 780,
      rareDrop: [
        { name: "farm_bug", type: "currency", chance: -0.1, value: 3 },
        { name: "farm_ladybug", type: "currency", chance: -0.15, value: 3 },
      ],
      tier: 12,
      type: "vegetable",
    },
    honeymelon: {
      icon: "mdi-fruit-watermelon",
      color: "amber",
      grow: 42 * MINUTES_PER_HOUR,
      yield: 800,
      rareDrop: [
        { name: "farm_butterfly", type: "currency", chance: -0.12, value: 2 },
        { name: "farm_spider", type: "currency", chance: -0.3, value: 1, mult: 0.5 },
      ],
      tier: 13,
      type: "berry",
    },
    rye: {
      icon: "mdi-barley",
      color: "pale-orange",
      cost: { farm_gold: 3 },
      grow: 7 * MINUTES_PER_HOUR,
      yield: 875,
      rareDrop: [
        { name: "farm_seedHull", type: "currency", chance: -0.16, value: 20 },
        { name: "farm_spider", type: "currency", chance: -0.25, value: 1, mult: 0.5 },
      ],
      tier: 14,
      type: "grain",
    },
    daisy: {
      icon: "mdi-flower",
      color: "yellow",
      cost: { farm_gold: 8 },
      grow: 14 * MINUTES_PER_HOUR,
      yield: 2350,
      rareDrop: [
        { name: "farm_petal", type: "currency", chance: -0.18, value: 12 },
        { name: "farm_butterfly", type: "currency", chance: -0.21, value: 10 },
        { name: "farm_bee", type: "currency", chance: -0.25, value: 10 },
      ],
      tier: 15,
      type: "flower",
    },
    cucumber: {
      icon: "mdi-ruler",
      color: "pale-green",
      cost: { farm_gold: 6 },
      grow: 2 * MINUTES_PER_HOUR + 30,
      yield: 1000,
      rareDrop: [{ name: "farm_bug", type: "currency", chance: -0.24, value: 4 }],
      tier: 16,
      type: "vegetable",
    },
    grapes: {
      icon: "mdi-fruit-grapes",
      color: "purple",
      cost: { farm_gold: 9 },
      grow: 5 * MINUTES_PER_HOUR,
      yield: 1700,
      rareDrop: [
        { name: "farm_ladybug", type: "currency", chance: -0.23, value: 7 },
        { name: "farm_bee", type: "currency", chance: -0.28, value: 10 },
      ],
      tier: 17,
      type: "berry",
    },
    hops: {
      icon: "mdi-hops",
      color: "green",
      cost: { farm_gold: 5 },
      grow: 1 * MINUTES_PER_HOUR + 15,
      yield: 550,
      rareDrop: [{ name: "farm_spider", type: "currency", chance: -0.32, value: 1, mult: 0.5 }],
      tier: 18,
      type: "grain",
    },
    violet: {
      icon: "mdi-flower",
      color: "deep-purple",
      cost: { farm_petal: 5 },
      grow: 36 * MINUTES_PER_HOUR,
      yield: 970,
      rareDrop: [
        { name: "farm_petal", type: "currency", chance: -0.3, value: 3 },
        { name: "farm_bee", type: "currency", chance: -0.33, value: 3 },
      ],
      tier: 19,
      type: "flower",
    },
    goldenRose: {
      icon: "mdi-flower",
      color: "amber",
      cost: { farm_gold: 100 },
      grow: 168 * MINUTES_PER_HOUR,
      yield: buildNum(64, "K"),
      rareDrop: [
        { name: "farm_petal", type: "currency", chance: -0.1, value: 30 },
        { name: "farm_goldenPetal", type: "currency", chance: -0.4, value: 1, mult: 0.05 },
        { name: "farm_roseWater", type: "consumable", chance: -0.45, value: 100 },
      ],
      tier: 20,
      type: "flower",
    },
    sweetPotato: {
      icon: "mdi-circle",
      color: "beige",
      cost: { farm_gold: 8 },
      grow: 11 * MINUTES_PER_HOUR + 30,
      yield: 3300,
      rareDrop: [{ name: "farm_bug", type: "currency", chance: -0.36, value: 8 }],
      tier: 20,
      type: "vegetable",
    },
    strawberry: {
      icon: "mdi-fruit-grapes",
      color: "red",
      cost: { farm_butterfly: 1 },
      grow: 27 * MINUTES_PER_HOUR,
      yield: 875,
      rareDrop: [
        { name: "farm_ladybug", type: "currency", chance: -0.4, value: 8 },
        { name: "farm_bee", type: "currency", chance: -0.45, value: 5 },
      ],
      tier: 21,
      type: "berry",
    },
    sesame: {
      icon: "mdi-grain",
      color: "pale-orange",
      cost: { farm_gold: 5, farm_seedHull: 25 },
      grow: 4 * MINUTES_PER_HOUR + 30,
      yield: 1500,
      rareDrop: [
        { name: "farm_smallSeed", type: "currency", chance: -0.48, value: 3 },
        { name: "farm_spider", type: "currency", chance: -0.51, value: 1, mult: 0.5 },
      ],
      tier: 22,
      type: "grain",
    },
    sunflower: {
      icon: "mdi-flower-outline",
      color: "brown",
      cost: { farm_gold: 14 },
      grow: 28 * MINUTES_PER_HOUR,
      yield: 8300,
      rareDrop: [
        { name: "farm_smallSeed", type: "currency", chance: -0.5, value: 15 },
        { name: "farm_petal", type: "currency", chance: -0.53, value: 4 },
      ],
      tier: 23,
      type: "flower",
    },
    spinach: {
      icon: "mdi-flower-poppy",
      color: "green",
      cost: { farm_gold: 3, farm_grass: 100 },
      grow: 5 * MINUTES_PER_HOUR + 45,
      yield: 1425,
      rareDrop: [{ name: "farm_bug", type: "currency", chance: -0.55, value: 3 }],
      tier: 24,
      type: "vegetable",
    },
  },
  "modules/farm/fertilizer": {
    // Unlocked from the beginning
    basic: { found: true, type: "all", color: "brown", price: { farm_gold: 1 }, effect: { farmCropGain: 1.35 } },
    flower: {
      found: true,
      type: "flower",
      color: "pink",
      price: { farm_gold: 3 },
      effect: { farmCropGain: 1.5, farmGrow: 1 / 1.2 },
    },
    speedGrow: { found: true, type: "all", color: "blue", price: { gem_sapphire: 1 }, effect: { farmGrow: 1 / 1.5 } },
    richSoil: { found: true, type: "all", color: "green", price: { gem_sapphire: 1 }, effect: { farmCropGain: 2 } },
    shiny: {
      found: true,
      type: "all",
      color: "amber",
      price: { gem_sapphire: 1 },
      effect: { farmGoldChance: 1.4, farmRareDropChance: 1.6 },
    },
    juicy: {
      found: true,
      type: "all",
      color: "lime",
      price: { farm_grass: 16 },
      effect: { farmCropGain: 1.25, farmRareDropChance: 1.25 },
    },
    dissolving: {
      found: true,
      type: "all",
      icon: "mdi-test-tube",
      color: "cyan",
      price: { farm_grass: 22 },
      effect: { farmExperience: 1.4, farmCropGain: 0, farmRareDropChance: 0, farmGoldChance: 0 },
    }, // Crop-specific
    potatoWater: { type: "vegetable", color: "indigo", effect: { farmCropGain: 1.65 } },
    roseWater: { type: "flower", color: "red-pink", effect: { farmCropGain: 1.4, farmGoldChance: 1.3 } }, // Unlocked with upgrade
    weedKiller: {
      type: "grain",
      color: "beige",
      price: { farm_gold: 4 },
      effect: { farmCropGain: 1.8, farmGrow: 1 / 1.2, farmRareDropChance: 1 / 1.5 },
    },
    turboGrow: {
      type: "all",
      color: "red",
      price: { gem_sapphire: 1 },
      effect: {
        farmGrow: 1 / 2,
        farmCropGain: 1 / 1.15,
        farmGoldChance: 1 / 1.15,
        farmRareDropChance: 1 / 1.15,
        farmExperience: 1 / 1.75,
      },
    },
    premium: {
      type: "all",
      color: "purple",
      price: { gem_sapphire: 2 },
      effect: { farmCropGain: 1.75, farmGrow: 1 / 1.25, farmGoldChance: 1.4, farmRareDropChancelor: "blue", price: { gem_sapphire: 5     color: "orange-red",
      price: { gem_sapphire: 3 },
      effect: { farmCropGain: 2.5, farmRareDropChance: 1.6 },
    },
    pellets: {
      type: "vegetable",
      icon: "mdi-pill",
      color: "beige",
      price: { farm_smallSeed: 20 },
      effect: { farmGoldChance: 1.25, farmRareDropChance: 1.25, farmExperience: 1.15 },
    }, // Event-exclusive
    sunshine: {
      type: "all",
      color: "yellow",
      effect: { farmGrow: 1 / 1.5, farmGoldChance: 2, farmRareDropChance: 1.4 },
    },
    superFlower: {
      type: "flower",
      color: "orange-red",
      effect: { farmGrow: 1 / 1.75, farmCropGain: 2.25, farmGoldChance: 1.5 },
    },
    smellyMud: {
      type: "vegetable",
      color: "brown",
      effect: { farmGrow: 1 / 1.5, farmCropGain: 2.5, farmGoldChance: 1.5, farmRareDropChance: 1.25 },
    },
    tropicalWater: {
      type: "berry",
      icon: "mdi-flask-round-bottom",
      color: "cyan",
      effect: { farmGrow: 1 / 2, farmGoldChance: 2, farmRareDropChance: 1.25 },
    },
    fieldBlessing: {
      type: "grain",
      icon: "mdi-auto-fix",
      color: "pink-purple",
      effect: { farmGrow: 1 / 2, farmGoldChance: 2.25 },
    },
    cinnamonBag: {
      type: "all",
      color: "brown",
      effect: { farmGrow: 1 / 1.5, farmCropGain: 1.8, farmGoldChance: 1.75 },
    },
  },
  "modules/farm/gene": {
    // Basics gene upgrade
    basics: {
      icon: "mdi-sack",
      effect: [],
      upgrade: [{ name: "farmAllGain", type: "mult", value: (lvl) => lvl * 0.03 + 1 }],
    }, // Level 1 genes
    yield: {
      icon: "mdi-sack",
      effect: [{ name: "farmCropGain", type: "mult", value: 1.3 }],
      upgrade: [{ name: "farmCropGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    gold: {
      icon: "mdi-gold",
      effect: [{ name: "farmGoldChance", type: "mult", value: 1.4 }],
      upgrade: [{ name: "farmGoldChance", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
    },
    exp: {
      icon: "mdi-star",
      effect: [{ name: "farmExperience", type: "mult", value: 1.175 }],
      upgrade: [{ name: "farmExperience", type: "base", value: (lvl) => lvl * 0.15 }],
    },
    rareDrop: {
      icon: "mdi-dice-2",
      effect: [{ name: "farmRareDropChance", type: "mult", value: 1.25 }],
      upgrade: [{ name: "farmRareDropChance", type: "mult", value: (lvl) => lvl * 0.09 + 1 }],
    }, // Level 5 genes
    grow: {
      icon: "mdi-timer",
      effect: [{ name: "farmGrow", type: "mult", value: 0.8 }],
      upgrade: [
        { name: "farmGrow", type: "mult", value: (lvl) => 1 / (lvl * 0.01 + 1) },
        { name: "farmExperience", type: "base", value: (lvl) => lvl * 0.1 },
      ],
    },
    overgrow: {
      icon: "mdi-sprout",
      effect: [{ name: "farmOvergrow", type: "mult", value: 2.5 }],
      upgrade: [{ name: "farmOvergrow", type: "base", value: (lvl) => lvl * 0.15 }],
    },
    giant: {
      icon: "mdi-numeric-5-box-multiple",
      effect: [
        { name: "farmGrow", type: "mult", value: 5 },
        { name: "farmAllGain", type: "mult", value: 4 },
        { name: "farmCropCost", type: "mult", value: 4 },
        { name: "farmFertilizerCost", type: "mult", value: 4 },
      ],
      upgrade: [
        { name: "farmCropGain", type: "mult", value: (lvl) => lvl * 0.08 + 1 },
        { name: "farmRareDropChance", type: "mult", value: (lvl) => lvl * 0.04 + 1 },
      ],
      lockOnField: true,
    },
    grass: {
      icon: "mdi-grass",
      effect: [{ name: "farm_grass", type: "addRareDrop", value: 8, chance: 0.2 }],
      upgrade: [{ name: "farm_grass", type: "addRareDropAmount", value: (lvl) => lvl }],
    }, // Level 10 genes
    dna: { icon: "mdi-dna", effect: [{ name: "farmUnlockDna", type: "text" }], upgrade: [] },
    gnome: {
      icon: "mdi-human-child",
      effect: [{ name: "farmGnomeBoost", type: "text" }],
      upgrade: [
        { name: "farmCropGain", type: "mult", value: (lvl) => lvl * 0.06 + 1 },
        { name: "farmExperience", type: "base", value: (lvl) => lvl * 0.05 },
      ],
    },
    lonely: {
      icon: "mdi-circle-expand",
      effect: [{ name: "farmLonelyGrow", type: "text" }],
      upgrade: [
        { name: "farmGrow", type: "mult", value: (lvl) => 1 / (lvl * 0.01 + 1) },
        { name: "farmOvergrow", type: "base", value: (lvl) => lvl * 0.12 },
      ],
    },
    fertile: {
      icon: "mdi-sack-percent",
      effect: [{ name: "farmFertileBoost", type: "text" }],
      upgrade: [
        { name: "farmCropGain", type: "mult", value: (lvl) => lvl * 0.03 + 1 },
        { name: "farmOvergrow", type: "base", value: (lvl) => lvl * 0.1 },
      ],
    }, // Level 15 genes
    mystery: {
      icon: "mdi-eye-circle-outline",
      effect: [{ name: "farm_mysteryStone", type: "addRareDrop", value: 1, chance: -0.1, mult: 0.01 }],
      upgrade: [{ name: "farmMystery", type: "base", value: (lvl) => lvl }],
    },
    conversion: {
      icon: "mdi-swap-horizontal",
      effect: [{ name: "farmYieldConversion", type: "text" }],
      upgrade: [
        { name: "farmCropGain", type: "mult", value: (lvl) => lvl * 0.06 + 1 },
        { name: "farmExperience", type: "base", value: (lvl) => lvl * 0.05 },
      ],
    },
    prestige: {
      icon: "mdi-shimmer",
      effect: [{ name: "farmFastPrestige", type: "text" }],
      upgrade: [{ name: "farmDnaNext", type: "base", value: (lvl) => lvl * 10 }],
    },
    rareDropChance: {
      icon: "mdi-dice-multiple",
      ee: [{ name: "farmRareDropChance", t {
      icon: "mdi-horseshoe",
      effect: [{ name: "farmLuckyHarvest", type: "text" }],
      upgrade: [{ name: "farmLuckyHarvestMult", type: "base", value: (lvl) => lvl }],
    },
    finalize: {
      icon: "mdi-lock-alert",
      effect: [
        { name: "farmCropGain", type: "mult", value: 1.5 },
        { name: "farmGoldChance", type: "mult", value: 1.2 },
        { name: "farmRareDropChance", type: "mult", value: 1.upgrade: [{ name: "farmCropGain", typ "mdi-charity",
      effect: [{ name: "farmSelfless", type: "text" }],
      upgrade: [{ name: "farmCropGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
    },
    unyielding: {
      icon: "mdi-content-duplicate",
      effect: [{ name: "farmUnyielding", type: "text" }],
      upgrade: [
        { name: "farmGrow", type: "mult", value: (lvl) => 1 / (lvl * 0.01 + 1) },
        { name: "farmExperience", type: "base", value: (lvl) => lvl * 0.08 },
      ],
    }, // Level 25 genes
    teamwork: {
      icon: "mdi-handshake",
      effect: [{ name: "farmTeamwork", type: "text" }],
      upgrade: [{ name: "farmCropGain", type: "mult", value: (lvl) => lvl * 0.08 + 1 }],
    },
    hunter: {
      icon: "mdi-bow-arrow",
      effect: [{ name: "farmHunter", type: "text" }],
      upgrade: [{ name: "farmHuntChance", type: "mult", value: (lvl) => Math.pow(1.15, lvl) }],
    },
    patient: {
      icon: "mdi-sleep",
      effect: [{ name: "farmPatient", type: "text" }],
      upgrade: [
        { name: "farmGrow", type: "mult", value: (lvl) => 1 / (lvl * 0.01 + 1) },
        { name: "farmAllGain", type: "mult", value: (lvl) => lvl * 0.02 + 1 },
      ],
    },
  },
  "modules/farm/relic": {
    goldenCarrot: {
      icon: "mdi-carrot",
      color: "amber",
      effect: [{ name: "currencyFarmVegetableGain", type: "mult", value: 1.4 }],
    },
    goldenApple: {
      icon: "mdi-food-apple",
      color: "amber",
      effect: [{ name: "currencyFarmBerryGain", type: "mult", value: 1.4 }],
    },
    popcorn: {
      icon: "mdi-popcorn",
      color: "pale-yellow",
      effect: [{ name: "currencyFarmGrainGain", type: "mult", value: 1.4 }],
    },
    roseQuartz: {
      icon: "mdi-crystal-ball",
      color: "pale-pink",
      effect: [{ name: "currencyFarmFlowerGain", type: "mult", value: 1.4 }],
    },
    goldenSeed: { icon: "mdi-seed", color: "amber", effect: [{ name: "goldenRose", type: "farmSeed", value: true }] },
    trellis: { icon: "mdi-fence", color: "brown", effect: [{ name: "farmOvergrow", type: "base", value: 0.05 }] },
    brickWall: { icon: "mdi-wall", color: "cherry", effect: [{ name: "farmOvergrow", type: "base", value: 0.05 }] },
  },
  "modules/farm/upgrade": {
    seedBox: {
      cap: 24,
      hideCap: true,
      price(lvl) {
        return [
          { farm_vegetable: 70 },
          { farm_berry: 150 },
          { farm_grain: 260 },
          { farm_flower: 800, farm_gold: 1 },
          { farm_vegetable: 4600 },
          { farm_berry: buildNum(50, "K") },
          { farm_grain: buildNum(335, "K") },
          { farm_flower: buildNum(2, "M") },
          { farm_vegetable: buildNum(17.5, "M") },
          { farm_berry: buildNum(120, "M") },
          { farm_grain: buildNum(900, "M") },
          { farm_flower: buildNum(7.2, "B") },
          { farm_vegetable: buildNum(54, "B") },
          { farm_berry: buildNum(370, "B") },
          { farm_grain: buildNum(2.2, "T") },
          { farm_flower: buildNum(35, "T") },
          { farm_vegetable: buildNum(875, "T") },
          { farm_berry: buildNum(3.1, "Qa") },
          { farm_grain: buildNum(130, "Qa") },
          { farm_flower: buildNum(8.5, "Qi") },
          { farm_vegetable: buildNum(500, "Qi") },
          { farm_berry: buildNum(35, "Sx") },
          { farm_grain: buildNum(3, "Sp") },
          { farm_flower: buildNum(320, "Sp") },
        ][lvl];
      },
      effect: [
        { name: "blueberry", type: "farmSeed", value: (lvl) => lvl >= 1 },
        { name: "wheat", type: "farmSeed", value: (lvl) => lvl >= 2 },
        { name: "tulip", type: "farmSeed", value: (lvl) => lvl >= 3 },
        { name: "potato", type: "farmSeed", value: (lvl) => lvl >= 4 },
        { name: "raspberry", type: "farmSeed", value: (lvl) => lvl >= 5 },
        { name: "barley", type: "farmSeed", value: (lvl) => lvl >= 6 },
        { name: "dandelion", type: "farmSeed", value: (lvl) => lvl >= 7 },
        { name: "corn", type: "farmSeed", value: (lvl) => lvl >= 8 },
        { name: "watermelon", type: "farmSeed", value: (lvl) => lvl >= 9 },
        { name: "rice", type: "farmSeed", value: (lvl) => lvl >= 10 },
        { name: "rose", type: "farmSeed", value: (lvl) => lvl >= 11 },
        { name: "leek", type: "farmSeed", value: (lvl) => lvl >= 12 },
        { name: "honeymelon", type: "farmSeed", value: (lvl) => lvl >= 13 },
        { name: "rye", type: "farmSeed", value: (lvl) => lvl >= 14 },
        { name: "daisy", type: "farmSeed", value: (lvl) => lvl >= 15 },
        { name: "cucumber", type: "farmSeed", value: (lvl) => lvl >= 16 },
        { name: "grapes", type: "farmSeed", value: (lvl) => lvl >= 17 },
        { name: "hops", type: "farmSeed", value: (lvl) => lvl >= 18 },
        { name: "violet", type: "farmSeed", value: (lvl) => lvl >= 19 },
        { name: "sweetPotato", type: "farmSeed", value: (lvl) => lvl >= 20 },
        { name: "strawberry", type: "farmSeed", value: (lvl) => lvl >= 21 },
        { name: "sesame", type: "farmSeed", value: (lvl) => lvl >= 22 },
        { name: "sunflower", type: "farmSeed", value: (lvl) => lvl >= 23 },
        { name: "spinach", type: "farmSeed", value: (lvl) => lvl >= 24 },
      ],
    },
    fertility: {
      requirementBase,
      requirementStat,
      requirementValue: 1,
      price(lvl) {
        return {
          farm_vegetable: 50 * Math.pow(lvl * 0.005 + 1.3, lvl),
          farm_berry: 50 * Math.pow(lvl * 0.005 + 1.3, lvl),
        };
      },
      effect: [{ name: "farmCropGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) }],
    },
    overgrowth: {
      cap: 9,
      requirementBase,
      requirementStat,
      requirementValue: 1,
      price(lvl) {
        return fallbackArray(
          [{ farm_berry: 200 }, { farm_grain: 850, farm_flower: 1300 }],
          { farm_flower: 240 * Math.pow(5 + lvl, lvl) },
          lvl,
        );
      },
      effect: [{ name: "farmOvergrow", type: "base", value: (lvl) => (lvl >= 1 ? lvl * 0.05 + 0.05 : null) }],
      onBuy() {
        store.dispatch("farm/updateFieldCaches");
      },
    },
    expansion: {
      cap: 45,
      requirementBase,
      requirementStat,
      requirementValue: 2,
      price(lvl) {
        return { farm_grain: 300 * Math.pow(lvl * 0.05 + 2, lvl) };
      },
      effect: [{ name: "farmTiles", type: "farmTile", value: (lvl) => lvl }],
    },
    gardenGnome: {
      cap: 5,
      hasDescription: true,
      requirementBase,
      requirementStat,
      requirementValue: 3,
      price(lvl) {
        return {
          farm_vegetable: 500 * Math.pow(96, lvl),
          farm_berry: 500 * Math.pow(96, lvl),
          farm_flower: 1000 * Math.pow(128, lvl),
        };
      },
      effect: [
        { name: "gardenGnome", type: "farmBuilding", value: (lvl) => lvl },
        { name: "farmDisableEarlyGame", type: "unlock", value: (lvl) => lvl >= 1 },
      ],
      onBuy() {
        store.dispatch("farm/applyEarlyGameBuff");
      },
    },
    learning: {
      cap: 1,
      hasDescription: true,
      requirementBase,
      requirementStat,
      requirementValue: 4,
      price() {
        return { farm_gold: 1 };
      },
      effect: [{ name: "farmCropExp", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    manure: {
      cap: 1,
      requirement() {
        return store.state.upgrade.item.farm_learning.level >= 1;
      },
      price() {
        return { farm_gold: 5 };
      },
      effect: [{ name: "farmFertilizer", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    groundSeeds: {
      requirementBase,
      requirementStat,
      requirementValue: 5,
      price(lvl) {
        return {
          farm_flower: 6000 * Math.pow(1.75, lvl),
          farm_seedHull: Math.round(4 * lvl * Math.pow(1.1, Math.max(0, lvl - 10)) + 10),
        };
      },
      effect: [
        { name: "currencyFarmGrainGain", type: "mult", value: (lvl) => lvl * 0.15 + 1 },
        { name: "farmOvergrow", type: "base", value: (lvl) => lvl * 0.01 },
      ],
      onBuy() {
        store.dispatch("farm/updateFieldCaches");
      },
    },
    roastedSeeds: {
      cap: 5,
      requirementBase,
      requirementStat,
      requirementValue: 5,
      price(lvl) {
        return { farm_seedHull: Math.round(Math.pow(1.8, lvl) * 4) };
      },
      effect: [{ name: "farmExperience", type: "base", value: (lvl) => lvl * 0.1 }],
    },
    hayBales: {
      requirementBase,
      requirementStat,
      requirementValue: 5,
      price(lvl) {
        return { farm_grass: lvl * 125 + 75 };
      },
      effect: [{ name: "currencyFarmGrassCap", type: "base", value: (lvl) => lvl * 100 }],
    },
    smallCrate: {
      cap: 7,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 6,
      price(lvl) {
        return { farm_berry: buildNum(24.5, "K") * Math.pow(1.9, lvl) };
      },
      effect: [{ name: "currencyFarmSeedHullCap", type: "base", value: (lvl) => lvl * 10 }],
    },
    sprinkler: {
      cap: 2,
      hasDescription: true,
      note: "farm_8",
      requirementBase,
      requirementStat,
      requirementValue: 6,
      price(lvl) {
        return {
          farm_vegetable: buildNum(120, "K") * Math.pow(buildNum(4, "M"), lvl),
          farm_seedHull: 50 * Math.pow(10, lvl),
        };
      },
      effect: [{ name: "sprinkler", type: "farmBuilding", value: (lvl) => lvl }],
    },
    magnifyingGlass: {
      cap: 20,
      requirementBase,
      requirementStat,
      requirementValue: 7,
      price(lvl) {
        return {
          farm_grain: buildNum(54, "K") * Math.pow(lvl * 0.1 + 2, lvl),
          farm_flower: buildNum(33, "K") * Math.pow(lvl * 0.1 + 2, lvl),
        };
      },
      effect: [{ name: "farmExperience", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    scarecrow: {
      cap: 10,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 7,
      price(lvl) {
        return {
          farm_grain: buildNum(110, "K") * Math.pow(1.8, lvl),
          farm_petal: Math.round(Math.pow(1.4, lvl) * 3),
          farm_gold: 6 + lvl,
        };
      },
      effect: [
        { name: "farmCropGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyFarmPetalCap", type: "base", value: (lvl) => lvl * 3 },
      ],
    },
    anthill: {
      requirementBase,
      requirementStat,
      requirementValue: 7,
      price(lvl) {
        return { farm_grass: getSequence(3, lvl) * 50 + 200 };
      },
      effect: [{ name: "farmRareDropChance", type: "base", value: (lvl) => lvl * 0.015 }],
    },
    bugPowder: {
      requirementBase,
      requirementStat,
      requirementValue: 8,
      price(lvl) {
        return {
          farm_grain: buildNum(675, "K") * Math.pow(1.75, lvl),
          farm_bug: Math.round(5 * lvl * Math.pow(1.1, Math.max(0, lvl - 10)) + 10),
        };
      },
      effect: [{ name: "currencyFarmVegetableGain", type: "mult", value: (lvl) => lvl * 0.15 + 1 }],
    },
    shed: {
      cap: 10,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 8,
      price(lvl) {
        return {
          farm_seedHull: 5 * getSequence(3, lvl) + 35,
          farm_bug: 5 * getSequence(3, lvl) + 35,
          farm_petal: 4 * getSequence(1, lvl) + 10,
        };
      },
      effect: [
        { name: "currencyFarmSeedHullCap", type: "base", value: (lvl) => lvl * 20 },
        { name: "currencyFarmBugCap", type: "base", value: (lvl) => lvl * 20 },
        { name: "currencyFarmPetalCap", type: "base", value: (lvl) => lvl * 10 },
      ],
    },
    lectern: {
      cap: 2,
      hasDescription: true,
      note: "farm_12",
      requirementBase,
      requirementStat,
      requirementValue: 9,
      price(lvl) {
        return { farm_flower: buildNum(3.5, "M") * Math.pow(buildNum(3, "M"), lvl), farm_petal: 75 * Math.pow(5, lvl) };
      },
      effect: [{ name: "lectern", type: "farmBuilding", value: (lvl) => lvl }],
    },
    perfume: {
      cap: 25,
      note: "farm_13",
      requirementBase,
      requirementStat,
      requirementValue: 9,
      price(lvl) {
        return {
          farm_bug: Math.round(5 * lvl * Math.pow(1.1, Math.max(0, lvl - 10)) + 10),
          farm_butterfly: Math.round(lvl * Math.pow(1.1, Math.max(0, lvl - 10)) + 2),
        };
      },
      effect: [
        { name: "currencyFarmBerryGain", type: "mult", value: (lvl) => lvl * 0.15 + 1 },
        { name: "farmRareDropChance", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    },
    mediumCrate: {
      cap: 8,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 10,
      price(lvl) {
        return {
          farm_vegetable: buildNum(90, "M") * Math.pow(1.75, lvl),
          farm_grain: buildNum(54, "M") * Math.pow(2.1, lvl),
        };
      },
      effect: [
        { name: "currencyFarmSeedHullCap", type: "base", value: (lvl) => lvl * 25 },
        { name: "currencyFarmGrassCap", type: "base", value: (lvl) => lvl * 40 },
      ],
    },
    stompedSeeds: {
      requirementBase,
      requirementStat,
      requirementValue: 10,
      price(lvl) {
        return { farm_seedHull: Math.round(Math.pow(1.15, lvl) * 150) };
      },
      effect: [{ name: "farmCropGain", type: "mult", value: (lvl) => Math.pow(1.12, lvl) }],
    },
    insectParadise: {
      cap: 6,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 11,
      price(lvl) {
        return {
          farm_berry: buildNum(750, "M") * Math.pow(2.4, lvl),
          farm_petal: Math.round(Math.pow(1.75, lvl) * 11),
        };
      },
      effect: [
        { name: "currencyFarmBugCap", type: "base", value: (lvl) => lvl * 40 },
        { name: "currencyFarmButterflyCap", type: "base", value: (lvl) => lvl * 5 },
        { name: "currencyFarmLadybugCap", type: "base", value: (lvl) => lvl * 30 },
      ],
    },
    goldenTools: {
      requirementBase,
      requirementStat,
      requirementValuevl) * 350) };
      },
      effec},
    butterflyWings: {
      cap: 6,
      requirementBase,
      requirementStat,
      requirementValue: 12,
      price(lvl) {
        return { farm_butterfly: Math.round(Math.pow(1.35, lvl) * 14) };
      },
      effect: [{ name: "currencyFarmPetalCap", type: "base", value: (lvl) => lvl * 15 }],
    },
    fertileGround: {
      requirementBase,
      requirementStat,
      requirementValue: 12,
      price(lvl) {
        return {
          farm_berry: buildNum(4, "B") * Math.pow(2.25, lvl),
          farm_flower: buildNum(3.3, "B") * Math.pow(2.25, lvl),
        };
      },
      effect: [{ name: "currencyFarmVegetableGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    pinwheel: {
      cap: 1,
      hasDescription: true,
      note: "farm_17",
      requirementBase,
      requirementStat,
      requirementValue: 13,
      price() {
        return { farm_flower: buildNum(250, "B"), farm_petal: 150, farm_ladybug: 50 };
      },
      effect: [{ name: "pinwheel", type: "farmBuilding", value: (lvl) => lvl }],
    },
    mysticGround: {
      requirementBase,
      requirementStat,
      requirementValue: 13,
      price(lvl) {
        return {
          farm_vegetable: buildNum(37.5, "B") * Math.pow(2.25, lvl),
          farm_ladybug: Math.round(Math.pow(1.12, lvl) * 10),
        };
      },
      effect: [
        { name: "currencyFarmGrainGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyFarmLadybugCap", type: "base", value: (lvl) => lvl * 20 },
      ],
    },
    fertilizerBag: {
      cap: 1,
      requirementBase,
      requirementStat,
      requirementValue: 14,
      price() {
        return { farm_gold: 700 };
      },
      effect: [
        { name: "farm_weedKiller", type: "findConsumable", value: (lvl) => lvl >= 1 },
        { name: "farm_turboGrow", type: "findConsumable", value: (lvl) => lvl >= 1 },
        { name: "farm_premium", type: "findConsumable", value: (lvl) => lvl >= 1 },
      ],
    },
    bigCrate: {
      cap: 10,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 14,
      price(lvl) {
        return {
          farm_berry: buildNum(190, "B") * Math.pow(1.85, lvl),
          farm_grain: buildNum(240, "B") * Math.pow(1.85, lvl),
        };
      },
      effect: [
        { name: "currencyFarmSeedHullCap", type: "base", value: (lvl) => lvl * 60 },
        { name: "currencyFarmGrassCap", type: "base", value: (lvl) => lvl * 80 },
        { name: "currencyFarmPetalCap", type: "base", value: (lvl) => lvl * 25 },
      ],
    },
    artificialWebs: {
      cap: 3,
      requirementBase,
      requirementStat,
      requirementValue: 15,
      price(lvl) {
        return { farm_flower: buildNum(1, "T") * Math.pow(9, lvl), farm_ladybug: Math.round(Math.pow(1.5, lvl) * 100) };
      },
      effect: [{ name: "currencyFarmSpiderCap", type: "base", value: (lvl) => lvl * 4 }],
    },
    studyInsects: {
      cap: 10,
      requirementBase,
      requirementStat,
      requirementValue: 15,
      price(lvl) {
        return {
          farm_berry: buildNum(1.35, "T") * Math.pow(2.65, lvl),
          farm_butterfly: Math.round(Math.pow(1.25, lvl) * 28),
        };
      },
      effect: [{ name: "farmExperience", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    beehive: {
      cap: 20,
      requirementBase,
      requirementStat,
      requirementValue: 16,
      price(lvl) {
        return {
          farm_flower: buildNum(22.5, "T") * Math.pow(1.4, lvl),
          farm_seedHull: Math.round(Math.pow(1.14, lvl) * 280),
          farm_bug: Math.round(Math.pow(1.16, lvl) * 160),
        };
      },
      effect: [
        { name: "currencyFarmSpiderCap", type: "base", value: (lvl) => lvl },
        { name: "currencyFarmBeeCap", type: "base", value: (lvl) => lvl * 200 },
      ],
    },
    darkCorner: {
      cap: 10,
      requirementBase,
      requirementStat,
      requirementValue: 17,
      price(lvl) {
        return {
          farm_vegetable: buildNum(175, "T") * Math.pow(1.75, lvl),
          farm_grain: buildNum(300, "T") * Math.pow(1.6, lvl),
          farm_bug: Math.round(Math.pow(1.24, lvl) * 230),
        };
      },
      effect: [
        { name: "currencyFarmSpiderCap", type: "base", value: (lvl) => lvl * 2 },
        { name: "farmRareDropChance", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    },
    flag: {
      cap: 1,
      hasDescription: true,
      note: "farm_20",
      requirementBase,
      requirementStat,
      requirementValue: 18,
      price() {
        return { farm_spider: 50, farm_bee: 2500, farm_goldenPetal: 10 };
      },
      effect: [{ name: "flag", type: "farmBuilding", value: (lvl) => lvl }],
    },
    wormBait: {
      requirementBase,
      requirementStat,
      requirementValue: 19,
      price(lvl) {
        return {
          farm_grass: Math.round(Math.pow(1.22, lvl) * 1350),
          farm_petal: Math.round(Math.pow(1.16, lvl) * 175),
          farm_butterfly: Math.round(Math.pow(1.16, lvl) * 50),
        };
      },
      effect: [
        { name: "currencyFarmVegetableGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyFarmBugCap", type: "base", value: (lvl) => lvl * 20 },
        { name: "currencyFarmLadybugCap", type: "base", value: (lvl) => lvl * 35 },
      ],
    },
    shinySoil: {
      requirementBase,
      requirementStat,
      requirementValue: 20,
      price(lvl) {
        return { farm_bee: Math.round(Math.pow(1.16, lvl) * 4000), farm_goldenPetal: Math.round(lvl * 0.3 + 5) };
      },
      effect: [
        { name: "currencyFarmBerryGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyFarmButterflyCap", type: "base", value: (lvl) => lvl * 4 },
      ],
    },
    bigFertilizerBag: {
      cap: 1,
      requirementBase,
      requirementStat,
      requirementValue: 21,
      price() {
        return { farm_gold: 2000 };
      },
      effect: [
        { name: "farm_analyzing", type: "findConsumable", value: (lvl) => lvl >= 1 },
        { name: "farm_superJuicy", type: "findConsumable", value: (lvl) => lvl >= 1 },
        { name: "farm_pellets", type: "findConsumable", value: (lvl) => lvl >= 1 },
      ],
    },
    openSesame: {
      requirementBase,
      requirementStat,
      requirementValue: 22,
      price(lvl) {
        return {
          farm_flower: buildNum(870, "Sx") * Math.pow(1.6, lvl),
          farm_smallSeed: Math.round(Math.pow(1.28, lvl) * 225),
        };
      },
      effect: [
        { name: "currencyFarmGrainGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyFarmSeedHullCap", type: "base", value: (lvl) => lvl * 50 },
        { name: "currencyFarmSmallSeedCap", type: "base", value: (lvl) => lvl * 150 },
      ],
    },
    flowerPainting: {
      requirementBase,
      requirementStat,
      requirementValue: 23,
      price(lvl) {
        return {
          farm_berry: buildNum(92, "Sp") * Math.pow(1.6, lvl),
          farm_bee: Math.round(Math.pow(1.28, lvl) * 6000),
        };
      },
      effect: [
        { name: "currencyFarmFlowerGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyFarmBeeCap", type: "base", value: (lvl) => lvl * 150 },
      ],
    },
  },
  "modules/farm/upgradePremium": {
    biggerVegetables: {
      type: "premium",
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 80 };
      },
      effect: [{ name: "currencyFarmVegetableGain", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.5 + 1 }],
    },
    biggerBerries: {
      type: "premium",
      requirement() {
        return store.state.upgrade.item.farm_seedBox.level >= 1;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 80 };
      },
      effect: [{ name: "currencyFarmBerryGain", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.5 + 1 }],
    },
    biggerGrain: {
      type: "premium",
      requirement() {
        return store.state.upgrade.item.farm_seedBox.level >= 2;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 80 };
      },
      effect: [{ name: "currencyFarmGrainGain", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.5 + 1 }],
    },
    biggerFlowers: {
      type: "premium",
      requirement() {
        return store.state.upgrade.item.farm_seedBox.level >= 3;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 80 };
      },
      effect: [{ name: "currencyFarmFlowerGain", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.5 + 1 }],
    },
    moreExperience: {
      type: "premium",
      requirement() {
        return store.state.unlock.farmCropExp.see;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 120 };
      },
      effect: [{ name: "farmExperience", type: "base", value: (lvl) => lvl * 0.25 }],
    },
    premiumGardenGnome: {
      type: "premium",
      hasDescription: true,
      cap: 5,
      hideCap: true,
      requirement(lvl) {
        return store.state.upgrade.item.farm_gardenGnome.level >= lvl + 1;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 180 };
      },
      effect: [{ name: "gardenGnome", type: "farmBuildingPremium", value: (lvl) => lvl }],
    },
    premiumSprinkler: {
      type: "premium",
      hasDescription: true,
      cap: 2,
      hideCap: true,
      requirement(lvl) {
        return store.state.upgrade.item.farm_sprinkler.level >= lvl + 1;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 500 };
      },
      effect: [{ name: "sprinkler", type: "farmBuildingPremium", value: (lvl) => lvl }],
    },
    premiumLectern: {
      type: "premium",
      hasDescription: true,
      cap: 2,
      hideCap: true,
      requirement(lvl) {
        return store.state.upgrade.item.farm_lectern.level >= lvl + 1;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 675 };
      },
      effect: [{ name: "lectern", type: "farmBuildingPremium", value: (lvl) => lvl }],
    },
    premiumPinwheel: {
      type: "premium",
      hasDescription: true,
      cap: 1,
      hideCap: true,
      requirement(lvl) {
        return store.state.upgrade.item.farm_pinwheel.level >= lvl + 1;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(3, lvl) * 1200 };
      },
      effect: [{ name: "pinwheel", type: "farmBuildingPremium", value: (lvl) => lvl }],
    },
    premiumFlag: {
      type: "premium",
      hasDescription: true,
      cap: 1,
      hideCap: true,
      requirement(lvl) {
        return store.state.upgrade.item.farm_flag.level >= lvl + 1;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(4, lvl) * 2100 };
      },
      effect: [{ name: "flag", type: "farmBuildingPremium", value: (lvl) => lvl }],
    },
  },
  "modules/farm": {
    name: "farm",
    tickspeed: 5,
    unlockNeeded: "farmFeature",
    forceTick(ticks, oldTime, newTime) {
      const dayDiff = Math.floor(newTime / SECONDS_PER_DAY) - Math.floor(oldTime / SECONDS_PER_DAY);
      if (dayDiff > 0) {
        for (const [key, elem] of Object.entries(store.state.farm.crop)) {
          if (elem.genes.includes("patient") && elem.patientStacks < 60) {
            store.commit("farm/updateCropKey", {
              name: key,
              key: "patientStacks",
              value: Math.min(elem.patientStacks + dayDiff, 60),
            });
          }
        }
      }
    },
    tick(ticks) {
      const decoration =
        store.state.farm.building.gardenGnome.cacheAmount + store.state.farm.building.gardenGnome.cachePremium;
      let highestGrow = 0;
      store.state.farm.field.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell !== null && cell.type === "crop") {
            if (cell.cache.overgrow === null) {
              store.commit("farm/updateFieldKey", {
                x,
                y,
                key: "grow",
                value: Math.min(cell.grow + (cell.cache.grow * ticks) / 12, 1),
              });
            } else {
              let grow = cell.grow;
    .grow * ticks) / 12;
               const stageMult = stage > 0 ? Math.pow(cell.cache.overgrow, stage) : 1;
                const given = Math.min(left, amt / stageMult);
                grow += given;
                amt -= given * stageMult;
                stage++;
              }
              if (grow > highestGrow) {
                highestGrow = grow;
              }
              store.commit("farm/updateFieldKey", { x, y, key: "grow", value: grow });
            }
            store.commit("farm/updateFieldKey", { x, y, key: "time", value: cell.time + ticks });
            if (decoration > 0) {
              store.commit("farm/addFieldBuildingEffect", { x, y, key: "gardenGnome", value: decoration * ticks });
            }
            if (cell.cache.lectern > 0) {
              store.commit("farm/addFieldBuildingEffect", { x, y, key: "lectern", value: cell.cache.lectern * ticks });
            }
            if (cell.cache.pinwheel > 0) {
              store.commit("farm/addFieldBuildingEffect", {
                x,
                y,
                key: "pinwheel",
                value: cell.cache.pinwheel * ticks,
              });
            }
            if (cell.cache.flag > 0) {
              store.commit("farm/addFieldBuildingEffect", { x, y, key: "flag", value: cell.cache.flag * ticks });
            }
            if (cell.cache.gnome > 0) {
              store.commit("farm/addFieldBuildingEffect", { x, y, key: "gnomeBoost", value: cell.cache.gnome * ticks });
            }
          }
        });
      });
      if (highestGrow > 1) {
        store.commit("stat/increaseTo", { feature: "farm", name: "maxOvergrow", value: highestGrow });
      }
      store.dispatch("farm/updateGrownHint");
    },
    unlock: [
      "farmFeature",
      "farmDisableEarlyGame",
      "farmCropExp",
      "farmFertilizer",
      "farmAdvancedCardPack",
      "farmLuxuryCardPack",
    ],
    stat: {
      harvests: { showInStatistics: true },
      maxOvergrow: { showInStatistics: true },
      bestPrestige: { showInStatistics: true },
      totalMystery: { showInStatistics: true },
    },
    mult: {
      farmExperience: { baseValue: 1 },
      farmGoldChance: { display: "percent" },
      farmGrow: { display: "time" },
      farmOvergrow: { display: "percent" },
      farmHuntChance: { display: "percent" },
      farmRareDropChance: { display: "percent", group: ["farmHuntChance"] },
      farmMystery: {},
      farmCropGain: {
        group: [
          "currencyFarmVegetableGain",
          "currencyFarmBerryGain",
          "currencyFarmGrainGain",
          "currencyFarmFlowerGain",
        ],
      },
      farmAllGain: { group: ["farmCropGain", "farmExperience", "farmGoldChance", "farmRareDropChance"] },
      farmCropCost: {},
      farmFertilizerCost: {},
      farmLuckyHarvestMult: { display: "mult", baseValue: 8 },
    },
    currency: {
      vegetable: { color: "orange", icon: "mdi-carrot", gainMult: {} },
      berry: { color: "purple", icon: "mdi-fruit-grapes", gainMult: {} },
      grain: { color: "yellow", icon: "mdi-barley", gainMult: {} },
      flower: { color: "pink", icon: "mdi-flower", gainMult: {} },
      gold: { color: "amber", icon: "mdi-gold" },
      seedHull: { color: "beige", icon: "mdi-seed", overcapMult: 0, capMult: { baseValue: 50 } },
      grass: { color: "green", icon: "mdi-grass", overcapMult: 0, capMult: { baseValue: 200 } },
      petal: {
        color: "light-blue",
        icon: "mdi-leaf",
        overcapMult: 0,
        currencyMult: { currencyFarmFlowerGain: { type: "mult", value: (val) => val * 0.03 + 1 } },
        capMult: { baseValue: 50 },
      },
      bug: { color: "brown", icon: "mdi-bug", overcapMult: 0, capMult: { baseValue: 50 } },
      butterfly: { color: "babypink", icon: "mdi-butterfly", overcapMult: 0, capMult: { baseValue: 30 } },
      ladybug: {
        color: "pale-red",
        icon: "mdi-ladybug",
        overcapMult: 0,
        currencyMult: { farmRareDropChance: { type: "base", value: (val) => val * 0.0001 } },
        capMult: { baseValue: 150 },
      },
      spider: {
        color: "dark-grey",
        icon: "mdi-spider",
        overcapMult: 0,
        currencyMult: {
          currencyFarmBugCap: { type: "base", value: (val) => val * 20 },
          currencyFarmButterflyCap: { type: "base", value: (val) => val },
          currencyFarmLadybugCap: { type: "base", value: (val) => val * 5 },
        },
        capMult: { baseValue: 20 },
      },
      bee: {
        color: "yellow",
        icon: "mdi-bee",
        overcapMult: 0,
        currencyMult: { currencyFarmBerryGain: { type: "mult", value: (val) => val * 0.001 + 1 } },
        capMult: { baseValue: 1000 },
      },
      mysteryStone: {
        color: "pale-purple",
        icon: "mdi-eye-circle-outline",
        overcapMult: 0,
        capMult: { baseValue: 1337 },
      },
      goldenPetal: {
        color: "amber",
        icon: "mdi-leaf",
        overcapMult: 0,
        currencyMult: { currencyFarmPetalCap: { type: "base", value: (val) => val * 25 } },
        capMult: { baseValue: 10 },
      },
      smallSeed: { color: "brown", icon: "mdi-grain", overcapMult: 0, capMult: { baseValue: 800 } },
    },
    note: buildArray(22).map(() => "g"),
    upgrade: { ...upgrade, ...upgradePremium, ...bookFarm },
    relic,
    achievement,
    consumable: fertilizer,
    init() {
      for (const [key, elem] of Object.entries(crop)) {
        store.commit("farm/initCrop", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(building)) {
        store.commit("farm/initBuilding", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(gene)) {
        store.commit("farm/initGene", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(fertilizer)) {
        store.commit("farm/initFertilizer", { name: key, ...elem });
      }
      store.commit("farm/initField");
      store.dispatch("mult/setMult", { name: "farmHuntChance", key: "farmGene_hunter", value: 0.01 });
    },
    saveGame() {
      let obj = { field: {}, crop: {} };
      if (store.state.farm.showColors) {
        obj.showColors = true;
      }
      if (store.state.farm.selectedColor) {
        obj.selectedColor = store.state.farm.selectedColor;
      }
      store.state.farm.field.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell !== null && (cell.type !== null || cell.color !== null)) {
            // eslint-disable-next-line no-unused-vars
            const { cache: _, ...newObj } = cell;
            obj.field[y * 7 + x] = newObj;
          }
        });
      });
      for (const [key, elem] of Object.entries(store.state.farm.crop)) {
        if (elem.found) {
          let rareDrops = {};
          elem.rareDrop.forEach((drop, index) => {
            if (drop.found) {
              rareDrops[index] = drop.hunter;
            }
          });
          obj.crop[key] = {
            exp: elem.exp,
            level: elem.level,
            levelMax: elem.levelMax,
            dna: elem.dna,
            genes: elem.genes,
            genesBlocked: elem.genesBlocked,
            cardSelected: elem.cardSelected,
            cardEquipped: elem.cardEquipped,
            upgrades: elem.upgrades,
          };
          if (Object.keys(rareDrops).length > 0) {
            obj.crop[key].rareDrop = rareDrops;
          }
          if (elem.patientStacks > 0) {
            obj.patientStacks = elem.patientStacks;
          }
        }
      }
      return obj;
    },
    loadGame(data) {
      if (data.field) {
        for (const [key, elem] of Object.entries(data.field)) {
          const fieldId = parseInt(key);
          let cell = elem;
          if (cell.type === "crop") {
            cell.cache = {};
          }
          store.commit("farm/updateField", { x: fieldId % 7, y: Math.floor(fieldId / 7), value: elem });
        }
      }
      if (data.crop) {
        for (const [key, elem] of Object.entries(data.crop)) {
          store.commit("farm/updateCropKey", { name: key, key: "exp", value: elem.exp });
          store.commit("farm/updateCropKey", { name: key, key: "level", value: elem.level });
          store.commit("farm/updateCropKey", { name: key, key: "levelMax", value: elem.levelMax });
          if (elem.rareDrop) {
            for (const [index, value] of Object.entries(elem.rareDrop)) {
              if (store.state.farm.crop[key].rareDrop[index] !== undefined) {
                store.commit("farm/findCropRareDrop", { name: key, index });
                store.commit("farm/huntCropRareDrop", { name: key, index, value });
              }
            }
          }
          store.commit("farm/updateCropKey", { name: key, key: "dna", value: elem.dna });
          store.commit("farm/updateCropKey", { name: key, key: "genes", value: elem.genes });
          store.commit("farm/updateCropKey", { name: key, key: "genesBlocked", value: elem.genesBlocked });
          store.commit("farm/updateCropKey", { name: key, key: "cardSelected", value: elem.cardSelected });
          store.commit("farm/updateCropKey", { name: key, key: "cardEquipped", value: elem.cardEquipped });
          store.commit("farm/updateCropKey", { name: key, key: "upgrades", value: elem.upgrades });
          if (elem.patientStacks !== undefined) {
            store.commit("farm/updateCropKey", { name: key, key: "patientStacks", value: elem.patientStacks });
          } // Apply level ups
          store.dispatch("farm/getCropExp", { crop: key, value: 0 });
        }
      }
      if (data.showColors) {
        store.commit("farm/updateKey", { key: "showColors", value: true });
      }
      if (data.selectedColor) {
        store.commit("farm/updateKey", { key: "selectedColor", value: data.selectedColor });
      }
      store.commit("farm/calculateCropBuildingCaches");
      store.dispatch("farm/applyGeneEffects");
      store.dispatch("farm/applyCropPrestige");
      store.dispatch("farm/updateGrownHint");
    },
  },
  "modules/gallery/achievement": {
    beauty: {
      value: () => store.state.stat.gallery_beauty.total,
      milestones: (lvl) => Math.pow(buildNum(1, "M"), lvl) * buildNum(1, "T"),
      relic: { 2: "sackOfGold", 6: "imageAlbum" },
    },
    converter: {
      value: () => store.state.stat.gallery_converter.total,
      milestones: (lvl) => Math.pow(20, lvl) * buildNum(200, "K"),
      relic: { 0: "printer", 2: "shredder" },
    },
    colorVariety: {
      value: () =>
        [
          store.state.stat.gallery_red.total,
          store.state.stat.gallery_orange.total,
          store.state.stat.gallery_yellow.total,
          store.state.stat.gallery_green.total,
          store.state.stat.gallery_blue.total,
          store.state.stat.gallery_purple.total,
          store.state.stat["gallery_deep-orange"].total,
          store.state.stat.gallery_amber.total,
          store.state.stat["gallery_light-green"].total,
          store.state.stat.gallery_teal.total,
          store.state.stat["gallery_light-blue"].total,
          store.state.stat.gallery_pink.total,
        ].reduce((a, b) => a + (b > 0 ? 1 : 0), 0),
      milestones: (lvl) => lvl + 2,
      relic: {
        2: "redBalloon",
        3: "orangeBalloon",
        4: "yellowBalloon",
        5: "greenBalloon",
        6: "blueBalloon",
        7: "purpleBalloon",
      },
    },
    highestTierIdea: {
      value: () => store.state.stat.gallery_highestTierIdea.total,
      milestones: (lvl) => lvl + 2,
      relic: { 0: "lightbulb", 1: "simpleCalculator", 3: "strangeScroll" },
    },
    cash: {
      value: () => store.state.stat.gallery_cash.total,
      milestones: (lvl) => Math.pow(100, lvl) * 100,
      relic: { 1: "oldTV", 5: "printingPress" },
    },
    packageMax: {
      value: () => store.state.stat.gallery_packageMax.total,
      milestones: (lvl) => Math.pow(3, lvl) * 100,
      relic: { 0: "worryingMail", 1: "creditCard" },
    },
    redDrumMax: {
      value: () => store.state.stat.gallery_redDrumMax.total,
      milestones: (lvl) => (lvl > 0 ? Math.pow(2, lvl) * 25 : 20),
      relic: { 2: "redprint", 4: "orangeprint", 6: "yellowprint", 9: "greenprint", 12: "blueprint" },
    },
    shapeComboTotal: {
      value: () => store.state.stat.gallery_shapeComboTotal.total,
      milestones: (lvl) => Math.round(Math.pow(lvl + 2, 2) * Math.pow(1.2, lvl) * 25),
      relic: { 2: "fishbowl", 4: "smallBrush", 7: "strangePills" },
    },
    shapeComboHighest: {
      value: () => store.state.stat.gallery_shapeComboHighest.total,
      cap: 7,
      milestones: (lvl) => lvl * 5 + 10,
      relic: { 2: "pencil" },
    },
    canvasLevelTotal: {
      value: () => store.state.stat.gallery_canvasLevelTotal.total,
      milestones: (lvl) => getSequence(2, lvl + 1) * 10,
      relic: { 0: "woodenHanger", 2: "bedsheet" },
    },
    hourglassHighest: {
      value: () => store.state.stat.gallery_hourglassHighest.total,
      secret: true,
      display: "time",
      cap: 1,
      milestones: () => 86400,
    },
  },
  "modules/gallery/card": {
    feature: {
      prefix: "GA",
      reward: [{ name: "currencyGalleryBeautyGain", type: "mult", value: (lvl) => lvl * 0.075 + 1 }],
      shinyReward: [{ name: "currencyGalleryCashGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
      powerReward: [
        { name: "currencyGalleryBeautyGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyGalleryCashGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) },
      ],
      unlock: "galleryFeature",
    },
    collection: {
      artDisplay: {
        reward: [
          { name: "galleryCardCap", type: "base", value: 1 },
          { name: "currencyGalleryBeautyGain", type: "mult", value: 2 },
        ],
      },
      deliveryService: {
        reward: [
          { name: "currencyGalleryConverterGain", type: "mult", value: 1.25 },
          { name: "currencyGalleryPackageGain", type: "mult", value: 1.25 },
        ],
      },
    },
    pack: {
      newArtist: {
        unlock: "galleryAuction",
        amount: 3,
        price: 55,
        content: {
          "GA-0001": 1.2,
          "GA-0002": 1,
          "GA-0003": 0.8,
          "GA-0004": 0.6,
          "GA-0005": 3.2,
          "GA-0006": 1.45,
          "GA-0007": 2.5,
          "GA-0008": 1.55,
          "GA-0009": 1.8,
          "GA-0010": 0.8,
          "GA-0011": 0.66,
          "GA-0012": 1.24,
          "GA-0013": 1.5,
          "GA-0014": 1.18,
          "GA-0015": 1.4,
          "GA-0016": 1.32,
          "GA-0017": 1.12,
          "GA-0018": 1.03,
        },
      },
      inspiringCreations: {
        unlock: "galleryAuction",
        amount: 3,
        price: 120,
        content: {
          "GA-0012": 1.24,
          "GA-0013": 2.25,
          "GA-0014": 1.18,
          "GA-0015": 1.4,
          "GA-0016": 1.32,
          "GA-0017": 1.12,
          "GA-0018": 1.03,
          "GA-0019": 1.6,
          "GA-0020": 0.77,
          "GA-0021": 0.92,
          "GA-0022": 0.85,
          "GA-0023": 1.08,
        },
      },
    },
    card: cardList,
  },
  "modules/gallery/idea": {
    // Tier 1
    makeItPretty: {
      tier: 1,
      owned: true,
      icon: "mdi-image",
      color: "deep-purple",
      effect: [
        { name: "currencyGalleryBeautyGain", type: "mult", value: (lvl) => lvl * 0.4 + getSequence(1, lvl) * 0.1 + 1 },
      ],
    },
    stompBerries: {
      tier: 1,
      owned: true,
      icon: "mdi-fruit-grapes",
      color: "red",
      effect: [
        { name: "currencyGalleryRedGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryRedConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryBeautyGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    carvePumpkins: {
      tier: 1,
      icon: "mdi-halloween",
      color: "orange",
      effect: [
        { name: "currencyGalleryOrangeGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryOrangeConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryRedGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    sortWaste: {
      tier: 1,
      icon: "mdi-delete-variant",
      color: "pale-light-green",
      effect: [{ name: "currencyGalleryConverterGain", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.25 + 1 }],
    },
    advertise: {
      tier: 1,
      icon: "mdi-cash",
      color: "green",
      effect: [{ name: "currencyGalleryCashGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    beImpatient: {
      tier: 1,
      icon: "mdi-run-fast",
      color: "light-blue",
      effect: [
        { name: "currencyGalleryPackageGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyGalleryPackageCap", type: "mult", value: (lvl) => lvl + 1 },
      ],
    },
    beExcited: {
      tier: 1,
      icon: "mdi-emoticon-excited",
      color: "pink-purple",
      effect: [
        { name: "currencyGalleryMotivationGain", type: "base", value: (lvl) => lvl * 0.02 },
        { name: "currencyGalleryMotivationCap", type: "base", value: (lvl) => lvl * 35 },
      ],
    }, // Tier 2
    makeLemonade: {
      tier: 2,
      icon: "mdi-fruit-citrus",
      color: "yellow",
      effect: [
        { name: "currencyGalleryYellowGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryYellowConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryOrangeGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    growATree: {
      tier: 2,
      icon: "mdi-tree",
      color: "green",
      effect: [
        { name: "currencyGalleryGreenGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryGreenConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryYellowGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    buildComposter: {
      tier: 2,
      icon: "mdi-archive-sync",
      color: "brown",
      effect: [{ name: "currencyGalleryConverterCap", type: "mult", value: (lvl) => lvl * 0.5 + 1 }],
    },
    observeRainbow: {
      tier: 2,
      icon: "mdi-looks",
      color: "babypink",
      effect: [{ name: "galleryColorGain", type: "mult", value: (lvl) => lvl * 0.12 + 1 }],
    },
    buildRedReservoir: {
      tier: 2,
      icon: "mdi-hoop-house",
      color: "red",
      effect: [{ name: "currencyGalleryRedDrumCap", type: "mult", value: (lvl) => lvl * 0.4 + 1 }],
    },
    orderMassiveSafe: {
      tier: 2,
      icon: "mdi-safe-square",
      color: "dark-grey",
      effect: [
        { name: "galleryColorDrumCap", type: "base", value: (lvl) => lvl * 3 },
        { name: "galleryCanvasSpeed", type: "mult", value: (lvl) => 1 - lvl / (lvl + 10) },
      ],
    },
    buyPen: {
      tier: 2,
      icon: "mdi-pen",
      color: "indigo",
      effect: [{ name: "galleryShapeGain", type: "mult", value: (lvl) => lvl * 0.12 + 1 }],
    }, // Tier 3
    drawOcean: {
      tier: 3,
      icon: "mdi-waves",
      color: "blue",
      effect: [
        { name: "currencyGalleryBlueGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryBlueConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryGreenGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    makeWine: {
      tier: 3,
      icon: "mdi-bottle-wine",
      color: "purple",
      effect: [
        { name: "currencyGalleryPurpleGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryPurpleConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryBlueGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    calculateOdds: {
      tier: 3,
      icon: "mdi-strategy",
      color: "indigo",
      effect: [{ name: "galleryColorDrumChance", type: "mult", value: (lvl) => lvl * 0.4 + 1 }],
    },
    buildOrangeReservoir: {
      tier: 3,
      icon: "mdi-hoop-house",
      color: "orange",
      effect: [{ name: "currencyGalleryOrangeDrumCap", type: "mult", value: (lvl) => lvl * 0.4 + 1 }],
    },
    thinkHarder: {
      tier: 3,
      icon: "mdi-head-lightbulb",
      color: "amber",
      effect: [{ name: "galleryInspirationStart", type: "base", value: (lvl) => lvl * 2 }],
    },
    paintFaster: {
      tier: 3,
      icon: "mdi-brush",
      color: "orange-red",
      effect: [{ name: "galleryCanvasSpeed", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    buyBrush: {
      tier: 3,
      icon: "mdi-brush-variant",
      color: "beige",
      effect: [
        { name: "gallerySpecialShapeChance", type: "base", value: (lvl) => lvl * 0.002 },
        { name: "gallerySpecialShapeMult", type: "base", value: (lvl) => lvl * 1.5 },
      ],
    }, // Tier 4
    harvestOranges: {
      tier: 4,
      icon: "mdi-fruit-citrus",
      color: "deep-orange",
      effect: [
        { name: "currencyGalleryDeep-orangeGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryDeep-orangeConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryPurpleGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    pulverizeGold: {
      tier: 4,
      icon: "mdi-shimmer",
      color: "amber",
      effect: [
        { name: "currencyGalleryAmberGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryAmberConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryDeep-orangeGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    buildYellowReservoir: {
      tier: 4,
      icon: "mdi-hoop-house",
      color: "yellow",
      effect: [{ name: "currencyGalleryYellowDrumCap", type: "mult", value: (lvl) => lvl * 0.4 + 1 }],
    },
    paintForFun: {
      tier: 4,
      icon: "mdi-emoticon-happy",
      color: "pink",
      effect: [
        { name: "currencyGalleryBeautyGain", type: "mult", value: (lvl) => Math.pow(4, lvl) },
        { name: "currencyGalleryCashGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl) },
      ],
    },
    printNewspaper: {
      tier: 4,
      icon: "mdi-newspaper",
      color: "light-grey",
      effect: [{ name: "currencyGalleryCashGain", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.25 + 1 }],
    },
    expandCanvas: {
      tier: 4,
      icon: "mdi-artboard",
      color: "wooden",
      effect: [{ name: "galleryCanvasSize", type: "base", value: (lvl) => lvl * 3 }],
    },
    hyperfocus: {
      tier: 4,
      icon: "mdi-image-filter-center-focus-strong-outline",
      color: "red-pink",
      effect: [
        { name: "currencyGalleryMotivationGain", type: "base", value: (lvl) => lvl * 0.08 },
        { name: "currencyGalleryCircleGain", type: "mult", value: (lvl) => lvl * 0.24 + 1 },
      ],
    }, // Tier 5
    cutGrass: {
      tier: 5,
      icon: "mdi-grass",
      color: "light-green",
      effect: [
        { name: "currencyGalleryLight-greenGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryLight-greenConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryAmberGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    shapeClay: {
      tier: 5,
      icon: "mdi-pot",
      color: "teal",
      effect: [
        { name: "currencyGalleryTealGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryTealConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryLight-greenGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    buildGreenReservoir: {
      tier: 5,
      icon: "mdi-hoop-house",
      color: "green",
      effect: [{ name: "currencyGalleryGreenDrumCap", type: "mult", value: (lvl) => lvl * 0.4 + 1 }],
    },
    beMysterious: {
      tier: 5,
      icon: "mdi-wizard-hat",
      color: "pale-purple",
      effect: [{ name: "currencyGalleryMysteryShapeGain", type: "base", value: (lvl) => lvl }],
    }, // Tier 6
    lookAtTheSky: {
      tier: 6,
      icon: "mdi-clouds",
      color: "light-blue",
      effect: [
        { name: "currencyGalleryLight-blueGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryLight-blueConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryTealGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    chewBubblegum: {
      tier: 6,
      icon: "mdi-dots-circle",
      color: "pink",
      effect: [
        { name: "currencyGalleryPinkGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "galleryPinkConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryLight-blueGain", type: "mult", value: (lvl) => Math.pow(0.5, lvl / 2) },
      ],
    },
    buildBlueReservoir: {
      tier: 6,
      icon: "mdi-hoop-house",
      color: "blue",
      effect: [{ name: "currencyGalleryBlueDrumCap", type: "mult", value: (lvl) => lvl * 0.4 + 1 }],
    },
  },
  "modules/gallery/relic": {
    printer: {
      icon: "mdi-printer",
      color: "pale-light-blue",
      effect: [
        { name: "gallery_newStyle", type: "keepUpgrade", value: true },
        { name: "gallery_recycling", type: "keepUpgrade", value: true },
        { name: "sortWaste", type: "galleryIdea", value: true },
      ],
    },
    lightbulb: {
      icon: "mdi-lightbulb",
      color: "pale-yellow",
      effect: [
        { name: "gallery_epiphany", type: "keepUpgrade", value: true },
        { name: "galleryInspirationStart", type: "base", value: 1 },
      ],
    },
    oldTV: {
      icon: "mdi-television-classic",
      color: "brown",
      effect: [{ name: "advertise", type: "galleryIdea", value: true }],
    },
    worryingMail: {
      icon: "mdi-email-alert",
      color: "red",
      effect: [{ name: "beImpatient", type: "galleryIdea", value: true }],
    },
    redBalloon: {
      icon: "mdi-balloon",
      color: "red",
      effect: [
        { name: "gallery_redPower", type: "keepUpgrade", value: true },
        { name: "gallery_redConversion", type: "keepUpgrade", value: true },
      ],
    },
    sackOfGold: {
      icon: "mdi-sack",
      color: "amber",
      effect: [{ name: "observeRainbow", type: "galleryIdea", value: true }],
    },
    shredder: {
      icon: "mdi-shredder",
      color: "pale-purple",
      effect: [
        { name: "gallery_filters", type: "keepUpgrade", value: true },
        { name: "gallery_trashCan", type: "keepUpgrade", value: true },
        { name: "buildComposter", type: "galleryIdea", value: true },
      ],
    },
    redprint: {
      icon: "mdi-script-text",
      color: "red",
      effect: [
        { name: "gallery_redRage", type: "keepUpgrade", value: true },
        { name: "buildRedReservoir", type: "galleryIdea", value: true },
      ],
    },
    orangeBalloon: {
      icon: "mdi-balloon",
      color: "orange",
      effect: [
        { name: "gallery_orangePower", type: "keepUpgrade", value: true },
        { name: "gallery_orangeConversion", type: "keepUpgrade", value: true },
      ],
    },
    creditCard: {
      icon: "mdi-credit-card",
      color: "pale-green",
      effect: [{ name: "orderMassiveSafe", type: "galleryIdea", value: true }],
    },
    simpleCalculator: {
      icon: "mdi-calculator",
      color: "pale-orange",
      effect: [{ name: "calculateOdds", type: "galleryIdea", value: true }],
    },
    orangeprint: {
      icon: "mdi-script-text",
      color: "orange",
      effect: [
        { name: "gallery_redLuck", type: "keepUpgrade", value: true },
        { name: "buildOrangeReservoir", type: "galleryIdea", value: true },
      ],
    },
    yellowBalloon: {
      icon: "mdi-balloon",
      color: "yellow",
      effect: [
        { name: "gallery_yellowPower", type: "keepUpgrade", value: true },
        { name: "gallery_yellowConversion", type: "keepUpgrade", value: true },
      ],
    },
    fishbowl: {
      icon: "mdi-fishbowl",
      color: "pale-blue",
      effect: [
        { name: "galleryShapeGain", type: "mult", value: 1.5 },
        { name: "beExcited", type: "galleryIdea", value: true },
      ],
    },
    pencil: {
      icon: "mdi-lead-pencil",
      color: "pale-red",
      effect: [
        { name: "galleryShapeGain", type: "mult", value: 1.5 },
        { name: "buyPen", type: "galleryIdea", value: true },
      ],
    },
    smallBrush: {
      icon: "mdi-brush",
      color: "pale-pink",
      effect: [
        { name: "galleryShapeGain", type: "mult", value: 1.5 },
        { name: "buyBrush", type: "galleryIdea", value: true },
      ],
    },
    strangePills: {
      icon: "mdi-pill-multiple",
      color: "pale-red",
      effect: [
        { name: "galleryShapeGain", type: "mult", value: 1.5 },
        { name: "hyperfocus", type: "galleryIdea", value: true },
      ],
    },
    strangeScroll: {
      icon: "mdi-script-text",
      color: "dark-grey",
      effect: [{ name: "beMysterious", type: "galleryIdea", value: true }],
    },
    printingPress: {
      icon: "mdi-arrow-collapse-vertical",
      color: "brown",
      effect: [
        { name: "currencyGalleryCashGain", type: "mult", value: 1.5 },
        { name: "printNewspaper", type: "galleryIdea", value: true },
      ],
    },
    yellowprint: {
      icon: "mdi-script-text",
      color: "yellow",
      effect: [
        { name: "gallery_orangeLuck", type: "keepUpgrade", value: true },
        { name: "buildYellowReservoir", type: "galleryIdea", value: true },
      ],
    },
    greenBalloon: {
      icon: "mdi-balloon",
      color: "green",
      effect: [
        { name: "gallery_greenPower", type: "keepUpgrade", value: true },
        { name: "gallery_greenConversion", type: "keepUpgrade", value: true },
      ],
    },
    woodenHanger: {
      icon: "mdi-hanger",
      color: "wooden",
      effect: [{ name: "paintFaster", type: "galleryIdea", value: true }],
    },
    bedsheet: {
      icon: "mdi-bed-empty",
      color: "pale-red",
      effect: [{ name: "expandCanvas", type: "galleryIdea", value: true }],
    },
    imageAlbum: {
      icon: "mdi-image-album",
      color: "orange-red",
      effect: [
        { name: "gallery_paintDrumStorage", type: "keepUpgrade", value: true },
        { name: "paintForFun", type: "galleryIdea", value: true },
      ],
    },
    greenprint: {
      icon: "mdi-script-text",
      color: "green",
      effect: [
        { name: "gallery_yellowLuck", type: "keepUpgrade", value: true },
        { name: "buildGreenReservoir", type: "galleryIdea", value: true },
      ],
    },
    blueBalloon: {
      icon: "mdi-balloon",
      color: "blue",
      effect: [
        { name: "gallery_bluePower", type: "keepUpgrade", value: true },
        { name: "gallery_blueConversion", type: "keepUpgrade", value: true },
      ],
    },
    blueprint: {
      icon: "mdi-script-text",
      color: "blue",
      effect: [
        { name: "gallery_greenLuck", type: "keepUpgrade", value: true },
        { name: "buildBlueReservoir", type: "galleryIdea", value: true },
      ],
    },
    purpleBalloon: {
      icon: "mdi-balloon",
      color: "blue",
      effect: [
        { name: "gallery_purplePower", type: "keepUpgrade", value: true },
        { name: "gallery_purpleConversion", type: "keepUpgrade", value: true },
      ],
    },
  },
  "modules/gallery/shape": {
    // Shapes
    circle: { unlocked: true, icon: "mdi-circle", color: "orange" },
    rectangle: { icon: "mdi-rectangle", color: "indigo" },
    triangle: { icon: "mdi-triangle", color: "light-green" },
    star: { icon: "mdi-star", color: "amber" },
    ellipse: { icon: "mdi-ellipse", color: "purple" },
    heart: { icon: "mdi-heart", color: "red" },
    square: { icon: "mdi-square", color: "light-blue" },
    octagon: { icon: "mdi-octagon", color: "babypink" },
    pentagon: { icon: "mdi-pentagon", color: "aqua" },
    hexagon: { icon: "mdi-hexagon", color: "brown" }, // Special
    bomb: { isSpecial: true, icon: "mdi-bomb", color: "pale-red" },
    dice: { isSpecial: true, icon: "mdi-dice-multiple", color: "pale-pink" },
    accelerator: { isSpecial: true, icon: "mdi-rotate-orbit", color: "pale-purple" },
    sparkles: { isSpecial: true, icon: "mdi-shimmer", color: "pale-green" },
    hourglass: { isSpecial: true, icon: "mdi-timer-sand", color: "pale-yellow" },
    chest: { isSpecial: true, icon: "mdi-treasure-chest", color: "pale-blue" },
  },
  "modules/gallery/upgrade": {
    newStyle: {
      cap: 10,
      note: "gallery_1",
      price(lvl) {
        return { gallery_beauty: Math.pow(2.1 + 0.05 * lvl, lvl) * 15 };
      },
      effect: [{ name: "currencyGalleryBeautyGain", type: "base", value: (lvl) => Math.pow(2, lvl) - 1 }],
    },
    recycling: {
      cap: 1,
      hasDescription: true,
      note: "gallery_2",
      price() {
        return { gallery_beauty: 2000 };
      },
      effect: [{ name: "galleryConversion", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    redPower: {
      cap: 15,
      capMult: true,
      requirement() {
        return store.state.stat.gallery_red.total > 0;
      },
      price(lvl) {
        return { gallery_red: Math.pow(2.5, lvl) * 2 };
      },
      effect: [
        { name: "currencyGalleryBeautyGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) },
      ],
    },
    redConversion: {
      cap: 10,
      note: "gallery_3",
      requirement() {
        return store.state.stat.gallery_red.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(5, lvl) * buildNum(20, "K") };
      },
      effect: [{ name: "galleryRedConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    filters: {
      note: "gallery_4",
      requirement() {
        return store.state.stat.gallery_red.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(4.8, lvl) * buildNum(1, "M") };
      },
      effect: [{ name: "currencyGalleryConverterGain", type: "mult", value: (lvl) => Math.pow(1.2, lvl) }],
    },
    orangePower: {
      cap: 15,
      capMult: true,
      requirement() {
        return store.state.stat.gallery_orange.total > 0;
      },
      price(lvl) {
        return { gallery_orange: Math.pow(2.5, lvl) * 2 };
      },
      effect: [{ name: "currencyGalleryRedGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) }],
    },
    redLuck: {
      cap: 40,
      hasDescription: true,
      requirement() {
        return store.state.stat.gallery_orange.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_orange: Math.pow(3 + 0.1 * lvl, lvl) * buildNum(1, "M") };
      },
      effect: [{ name: "galleryRedDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    epiphany: {
      note: "gallery_5",
      cap: 1,
      hasDescription: true,
      requirement() {
        return store.state.stat.gallery_orange.total > 0;
      },
      price() {
        return { gallery_beauty: buildNum(17.5, "M") };
      },
      effect: [{ name: "galleryInspiration", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    trashCan: {
      note: "gallery_6",
      requirement() {
        return store.state.stat.gallery_orange.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(15, lvl) * buildNum(350, "M") };
      },
      effect: [{ name: "currencyGalleryConverterCap", type: "mult", value: (lvl) => Math.pow(1.9, lvl) }],
    },
    orangeConversion: {
      cap: 10,
      requirement() {
        return store.state.stat.gallery_orange.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(10, lvl) * buildNum(500, "M") };
      },
      effect: [{ name: "galleryOrangeConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    brush: {
      note: "gallery_7",
      requirement() {
        return store.state.stat.gallery_orange.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(8 + lvl * 0.5, lvl) * buildNum(7, "B") };
      },
      effect: [{ name: "galleryColorGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) }],
    },
    auctionHouse: {
      persistent: true,
      cap: 1,
      hasDescription: true,
      note: "gallery_8",
      requirement() {
        return store.state.stat.gallery_orange.total > 0;
      },
      price() {
        return { gallery_beauty: buildNum(1, "T") };
      },
      effect: [{ name: "galleryAuction", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    yellowPower: {
      cap: 15,
      capMult: true,
      requirement() {
        return store.state.stat.gallery_yellow.total > 0;
      },
      price(lvl) {
        return { gallery_yellow: Math.pow(2.5, lvl) * 2 };
      },
      effect: [
        { name: "currencyGalleryOrangeGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) },
      ],
    },
    orangeLuck: {
      cap: 40,
      requirement() {
        return store.state.stat.gallery_yellow.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_yellow: Math.pow(3 + 0.1 * lvl, lvl) * buildNum(1, "M") };
      },
      effect: [{ name: "galleryOrangeDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    yellowConversion: {
      cap: 10,
      requirement() {
        return store.state.stat.gallery_yellow.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(15, lvl) * buildNum(12, "T") };
      },
      effect: [{ name: "galleryYellowConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    paintDrumStorage: {
      note: "gallery_9",
      cap: 1,
      hasDescription: true,
      requirement() {
        return store.state.stat.gallery_yellow.total > 0;
      },
      price() {
        return { gallery_beauty: buildNum(250, "T") };
      },
      effect: [{ name: "galleryDrums", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    greenPower: {
      cap: 15,
      capMult: true,
      requirement() {
        return store.state.stat.gallery_green.total > 0;
      },
      price(lvl) {
        return { gallery_green: Math.pow(2.5, lvl) * 2 };
      },
      effect: [
        { name: "currencyGalleryYellowGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) },
      ],
    },
    yellowLuck: {
      cap: 40,
      requirement() {
        return store.state.stat.gallery_green.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_green: Math.pow(3 + 0.1 * lvl, lvl) * buildNum(1, "M") };
      },
      effect: [{ name: "galleryYellowDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    greenConversion: {
      cap: 10,
      requirement() {
        return store.state.stat.gaty: Math.pow(20, lvl) * buildNum(mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    redRage: {
      cap: 40,
      requirement() {
        return store.state.stat.gallery_green.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_red: Math.pow(2.75 + 0.1 * lvl, lvl) * buildNum(100, "T") };
      },
      effect: [
        { name: "currencyGalleryBeautyGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyGalleryRedDrumCap", type: "base", value: (lvl) => lvl * 2 },
      ],
    },
    bluePower: {
      cap: 15,
      capMult: true,
      requirement() {
        return store.state.stat.gallery_blue.total > 0;
      },
      price(lvl) {
        return { gallery_blue: Math.pow(2.5, lvl) * 2 };
      },
      effect: [
        { name: "currencyGalleryGreenGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) },
      ],
    },
    greenLuck: {
      cap: 40,
      requirement() {
        return store.state.stat.gallery_blue.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_blue: Math.pow(3 + 0.1 * lvl, lvl) * buildNum(1, "M") };
      },
      effect: [{ name: "galleryGreenDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    blueConversion: {
      cap: 10,
      requirement() {
        return store.state.stat.gallery_blue.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(25, lvl) * buildNum(35, "Sx") };
      },
      effect: [{ name: "galleryBlueConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    purplePower: {
      cap: 15,
      capMult: true,
      requirement() {
        return store.state.stat.gallery_purple.total > 0;
      },
      price(lvl) {
        return { gallery_purple: Math.pow(2.5, lvl) * 2 };
      },
      effect: [{ name: "currencyGalleryBlueGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) }],
    },
    blueLuck: {
      cap: 40,
      requirement() {
        return store.state.stat.gallery_purple.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_purple: Math.pow(3 + 0.1 * lvl, lvl) * buildNum(1, "M") };
      },
      effect: [{ name: "galleryBlueDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    purpleConversion: {
      cap: 10,
      requirement() {
        return store.state.stat.gallery_purple.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(30, lvl) * buildNum(9.4, "N") };
      },
      effect: [{ name: "galleryPurpleConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    deepOrangePower: {
      cap: 15,
      capMult: true,
      requirement() {
        return store.state.stat["gallery_deep-orange"].total > 0;
      },
      price(lvl) {
        return { "gallery_deep-orange": Math.pow(2.5, lvl) * 4 };
      },
      effect: [
        { name: "currencyGalleryPurpleGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) },
      ],
    },
    purpleLuck: {
      cap: 40,
      requirement() {
        return store.state.stat["gallery_deep-orange"].total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { "gallery_deep-orange": Math.pow(3 + 0.1 * lvl, lvl) * buildNum(3, "M") };
      },
      effect: [{ name: "galleryPurpleDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    deepOrangeConversion: {
      cap: 10,
      requirement() {
        return store.state.stat["gallery_deep-orange"].total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(35, lvl) * buildNum(11, "UD") };
      },
      effect: [{ name: "galleryDeep-orangeConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    emptyCanvas: {
      cap: 1,
      hasDescription: true,
      requirement() {
        return store.state.stat["gallery_deep-orange"].total > 0;
      },
      price() {
        return { gallery_beauty: buildNum(40, "UD"), "gallery_deep-orange": 10 };
      },
      effect: [{ name: "galleryCanvas", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    linen: {
      requirement() {
        return store.state.unlock.galleryCanvas.use;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(1000, lvl) * buildNum(1, "DD") };
      },
      effect: [{ name: "galleryCanvasSize", type: "base", value: (lvl) => lvl }],
    },
    amberPower: {
      cap: 15,
      capMult: true,
      requirement() {
        return store.state.stat.gallery_amber.total > 0;
      },
      price(lvl) {
        return { gallery_amber: Math.pow(2.5, lvl) * 8 };
      },
      effect: [
        { name: "currencyGalleryDeep-orangeGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) },
      ],
    },
    deepOrangeLuck: {
      cap: 40,
      requirement() {
        return store.state.stat.gallery_amber.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_amber: Math.pow(3 + 0.1 * lvl, lvl) * buildNum(9, "M") };
      },
      effect: [{ name: "galleryDeep-orangeDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    amberConversion: {
      cap: 10,
      requirement() {
        return store.state.stat.gallery_amber.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(50, lvl) * buildNum(555, "QiD") };
      },
      effect: [{ n,
    },
    lightGreenPower: {
      cap["gallery_light-green"].total > 0;
      },
      price(lvl) {
        return { "gallery_light-green": Math.pow(2.5, lvl) * 16 };
      },
      effect: [
        { name: "currencyGalleryAmberGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) },
      ],
    },
    amberLuck: {
      cap: 40,
      requirement() {
        return store.state.stat["gallery_light-green"].total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { "gallery_light-green": Math.pow(3 + 0.1 * lvl, lvl) * buildNum(27, "M") };
      },
      effect: [{ name: "galleryAmberDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    lightGreenConversion: {
      cap: 10,
      requirement() {
        return store.state.stat["gallery_light-green"].total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(60, lvl) * buildNum(90, "ND") };
      },
      effect: [{ name: "galleryLight-greenConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    tealPower: {
      cap: 15,
      capMult: true,
      requirement() {
        return store.state.stat.gallery_teal.total > 0;
      },
      price(lvl) {
        return { gallery_teal: Math.pow(2.5, lvl) * 32 };
      },
      effect: [
        { name: "currencyGalleryLight-greenGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) },
      ],
    },
    lightGreenLuck: {
      cap: 40,
      requirement() {
        return store.state.stat.gallery_teal.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_teal: Math.pow(3 + 0.1 * lvl, lvl) * buildNum(81, "M") };
      },
      effect: [{ name: "galleryLight-greenDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    tealConversion: {
      cap: 10,
      requirement() {
        return store.state.stat.gallery_teal.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(80, lvl) * buildNum(750, "DV") };
      },
      effect: [{ name: "galleryTealConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    lightBluePower: {
      cap: 15,
      capMult: truetal > 0;
      },
      price(lvl)    effect: [{ name: "currencyGalleryTealGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) }],
    },
    tealLuck: {
      cap: 40,
      requirement() {
        return store.state.stat["gallery_light-blue"].total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { "gallery_light-blue": Math.pow(3 + 0.1 * lvl, lvl) * buildNum(243, "M") };
      },
      effect: [{ name: "galleryTealDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    lightBlueConversion: {
      cap: 10,
      requirement() {
        return store.state.stat["gallery_light-blue"].total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(100, lvl) * buildNum(38, "SxV") };
      },
      effect: [{ name: "galleryLight-blueConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    pinkPower: {
      cap: 15,
      capMult: true,
      requirement() {
        return store.state.stat.gallery_pink.total > 0;
      },
      price(lvl) {
        return { gallery_pink: Math.pow(2.5, lvl) * 128 };
      },
      effect: [
        { name: "currencyGalleryLight-blueGain", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.1, 15, lvl) },
      ],
    },
    lightBlueLuck: {
      cap: 40,
      requirement() {
        return store.state.stat.gallery_pink.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_pink: Math.pow(3 + 0.1 * lvl, lvl) * buildNum(729, "M") };
      },
      effect: [{ name: "galleryLight-blueDrumChance", type: "base", value: (lvl) => lvl * 0.02 }],
    },
    pinkConversion: {
      cap: 10,
      requirement() {
        return store.state.stat.gallery_pink.total > 0;
      },
      price(lvl) {
        return { gallery_beauty: Math.pow(125, lvl) * buildNum(5, "Tg") };
      },
      effect: [{ name: "galleryPinkConversion", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
  },
  "modules/gallery/upgradePremium": {
    prettyColors: {
      type: "premium",
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 100 };
      },
      effect: [{ name: "currencyGalleryBeautyGain", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    prettyConverter: {
      type: "premium",
      requirement() {
        return store.state.unlock.galleryConversion.see;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 150 };
      },
      effect: [
        { name: "currencyGalleryConverterGain", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.25 + 1 },
        { name: "currencyGalleryConverterCap", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.25 + 1 },
      ],
    },
    prettyCash: {
      type: "premium",
      requirement() {
        return store.state.unlock.galleryAuction.see;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 180 };
      },
      effect: [{ name: "currencyGalleryCashGain", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    prettyShapes: {
      type: "premium",
      requirement() {
        return store.state.unlock.galleryShape.see;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 225 };
      },
      effect: [{ name: "galleryShapeGain", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.5 + 1 }],
    },
    prettyCanvas: {
      type: "premium",
      requirement() {
        return store.state.unlock.galleryCanvas.see;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 320 };
      },
      effect: [{ name: "galleryCanvasSpeed", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.1 + 1 }],
    },
    prettyRed: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.gallery_redDrum.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 750 };
      },
      effect: [
        { name: "currencyGalleryRedGain", type: "mult", value: (lvl) => Math.pow(4, lvl) },
        { name: "galleryRedDrumChance", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyGalleryRedDrumCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    prettyOrange: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.gallery_orangeDrum.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 1050 };
      },
      effect: [
        { name: "currencyGalleryOrangeGain", type: "mult", value: (lvl) => Math.pow(4, lvl) },
        { name: "galleryOrangeDrumChance", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyGalleryOrangeDrumCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    prettyYellow: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.gallery_yellowDrum.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 1400 };
      },
      effect: [
        { name: "currencyGalleryYellowGain", type: "mult", value: (lvl) => Math.pow(4, lvl) },
        { name: "galleryYellowDrumChance", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyGalleryYellowDrumCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    prettyGreen: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.gallery_greenDrum.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 2000 };
      },
      effect: [
        { name: "currencyGalleryGreenGain", type: "mult", value: (lvl) => Math.pow(4, lvl) },
        { name: "galleryGreenDrumChance", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyGalleryGreenDrumCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    prettyBlue: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.gallery_blueDrum.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 2875 };
      },
      effect: [
        { name: "currencyGalleryBlueGain", type: "mult", value: (lvl) => Math.pow(4, lvl) },
        { name: "galleryBlueDrumChance", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyGalleryBlueDrumCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    prettyPurple: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.gallery_purpleDrum.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 3900 };
      },
      effect: [
        { name: "currencyGalleryPurpleGain", type: "mult", value: (lvl) => Math.pow(4, lvl) },
        { name: "galleryPurpleDrumChance", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyGalleryPurpleDrumCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    "prettyDeep-orange": {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat["gallery_deep-orangeDrum"].total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 5200 };
      },
      effect: [
        { name: "currencyGalleryDeep-orangeGain", type: "mult", value: (lvl) => Math.pow(4, lvl) },
        { name: "galleryDeep-orangeDrumChance", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyGalleryDeep-orangeDrumCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    prettyAmber: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.gallery_amberDrum.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 6750 };
      },
      effect: [
        { name: "currencyGalleryAmberGain", type: "mult", value: (lvl) => Math.pow(4, lvl) },
        { name: "galleryAmberDrumChance", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyGalleryAmberDrumCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
  },
  "modules/gallery/upgradePrestige": {
    artAcademy: {
      type: "prestige",
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.01 + 1.65, lvl) * 2 };
      },
      effect: [{ name: "currencyGalleryBeautyGain", type: "mult", value: (lvl) => Math.pow(1.3, lvl) }],
    },
    redCrayon: {
      type: "prestige",
      cap: 15,
      requirement() {
        return store.state.stat.gallery_orange.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * 8 };
      },
      effect: [{ name: "currencyGalleryRedGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    rainbowJar: {
      type: "prestige",
      cap: 11,
      price(lvl) {
        return { gallery_cash: fallbackArray([10, 100], Math.pow(1000, lvl - 1) * 10, lvl) };
      },
      effect: [
        { name: "carvePumpkins", type: "galleryIdea", value: (lvl) => lvl >= 1 },
        { name: "makeLemonade", type: "galleryIdea", value: (lvl) => lvl >= 2 },
        { name: "growATree", type: "galleryIdea", value: (lvl) => lvl >= 3 },
        { name: "drawOcean", type: "galleryIdea", value: (lvl) => lvl >= 4 },
        { name: "makeWine", type: "galleryIdea", value: (lvl) => lvl >= 5 },
        { name: "harvestOranges", type: "galleryIdea", value: (lvl) => lvl >= 6 },
        { name: "pulverizeGold", type: "galleryIdea", value: (lvl) => lvl >= 7 },
        { name: "cutGrass", type: "galleryIdea", value: (lvl) => lvl >= 8 },
        { name: "shapeClay", type: "galleryIdea", value: (lvl) => lvl >= 9 },
        { name: "lookAtTheSky", type: "galleryIdea", value: (lvl) => lvl >= 10 },
        { name: "chewBubblegum", type: "galleryIdea", value: (lvl) => lvl >= 11 },
      ],
    },
    trashContainer: {
      type: "prestige",
      cap: 8,
      price(lvl) {
        return { gallery_cash: Math.pow(2, lvl) * 25 };
      },
      effect: [{ name: "currencyGalleryConverterCap", type: "base", value: (lvl) => lvl * 500 }],
    },
    orangeCrayon: {
      type: "prestige",
      cap: 20,
      requirement() {
        return store.state.stat.gallery_yellow.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * 30 };
      },
      effect: [{ name: "currencyGalleryOrangeGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    shapes: {
      type: "prestige",
      cap: 10,
      requirement() {
        return store.state.stat.gallery_yellow.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(3 + lvl, lvl) * 150 };
      },
      effect: [
        { name: "galleryShape", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "rectangle", type: "galleryShape", value: (lvl) => lvl >= 2 },
        { name: "triangle", type: "galleryShape", value: (lvl) => lvl >= 3 },
        { name: "star", type: "galleryShape", value: (lvl) => lvl >= 4 },
        { name: "ellipse", type: "galleryShape", value: (lvl) => lvl >= 5 },
        { name: "heart", type: "galleryShape", value: (lvl) => lvl >= 6 },
        { name: "square", type: "galleryShape", value: (lvl) => lvl >= 7 },
        { name: "octagon", type: "galleryShape", value: (lvl) => lvl >= 8 },
        { name: "pentagon", type: "galleryShape", value: (lvl) => lvl >= 9 },
        { name: "hexagon", type: "galleryShape", value: (lvl) => lvl >= 10 },
      ],
    },
    forklift: {
      type: "prestige",
      cap: 9,
      requirement() {
        return store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(3, lvl) * 150 };
      },
      effect: [{ name: "currencyGalleryPackageCap", type: "base", value: (lvl) => lvl * 10 }],
    },
    redCrate: {
      type: "prestige",
      cap: 9,
      requirement() {
        return store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(2.5 + 0.2 * lvl, lvl) * 360 };
      },
      effect: [{ name: "currencyGalleryRedDrumCap", type: "base", value: (lvl) => lvl * 10 }],
    },
    yellowCrayon: {
      type: "prestige",
      cap: 25,
      requirement() {
        return store.state.stat.gallery_green.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * 725 };
      },
      effect: [{ name: "currencyGalleryYellowGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    inspiringBooks: {
      type: "prestige",
      requirement() {
        return store.state.stat.gallery_green.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(2 + 0.25 * lvl, lvl) * 1400 };
      },
      effect: [
        { name: "galleryInspirationBase", type: "mult", value: (lvl) => Math.pow(0.8, lvl) },
        { name: "galleryInspirationIncrement", type: "mult", value: (lvl) => Math.pow(0.95, lvl) },
      ],
    },
    expressDelivery: {
      type: "prestige",
      cap: 20,
      requirement() {
        return store.state.stat.gallery_green.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(2.5 + 0.25 * lvl, lvl) * 3000 };
      },
      effect: [{ name: "currencyGalleryPackageGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 }],
    },
    orangeCrate: {
      type: "prestige",
      cap: 9,
      requirement() {
        return store.state.stat.gallery_green.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(2.5 + 0.2 * lvl, lvl) * buildNum(13.5, "K") };
      },
      effect: [{ name: "currencyGalleryOrangeDrumCap", type: "base", value: (lvl) => lvl * 10 }],
    },
    biggerShapes: {
      type: "prestige",
      requirement() {
        return store.state.stat.gallery_green.total > 0 && store.state.unlock.galleryShape.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.05 + 1.75, lvl) * buildNum(35.5, "K") };
      },
      effect: [{ name: "galleryShapeGain", type: "mult", value: (lvl) => Math.pow(1.45, lvl) }],
    },
    greenCrayon: {
      type: "prestige",
      cap: 30,
      requirement() {
        return store.state.stat.gallery_blue.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * buildNum(110, "K") };
      },
      effect: [{ name: "currencyGalleryGreenGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    sortingSystem: {
      type: "prestige",
      cap: 15,
      requirement() {
        return store.state.stat.gallery_blue.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(2.2, lvl) * buildNum(275, "K") };
      },
      effect: [
        { name: "currencyGalleryConverterCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyGalleryPackageCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
      ],
    },
    redTruck: {
      type: "prestige",
      cap: 5,
      requirement() {
        return store.state.stat.gallery_blue.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(4 + 2 * lvl, lvl) * buildNum(880, "K") };
      },
      effect: [{ name: "currencyGalleryRedDrumCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 }],
    },
    yellowCrate: {
      type: "prestige",
      cap: 9,
      requirement() {
        return store.state.stat.gallery_blue.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(2.5 + 0.2 * lvl, lvl) * buildNum(2.4, "M") };
      },
      effect: [{ name: "currencyGalleryYellowDrumCap", type: "base", value: (lvl) => lvl * 10 }],
    },
    blueCrayon: {
      type: "prestige",
      cap: 35,
      requirement() {
        return store.state.stat.gallery_purple.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * buildNum(130, "M") };
      },
      effect: [{ name: "currencyGalleryBlueGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    orangeTruck: {
      type: "prestige",
      cap: 5,
      requirement() {
        return store.state.stat.gallery_purple.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(4 + 2 * lvl, lvl) * buildNum(550, "M") };
      },
      effect: [{ name: "currencyGalleryOrangeDrumCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 }],
    },
    greenCrate: {
      type: "prestige",
      cap: 9,
      requirement() {
        return store.state.stat.gallery_purple.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(2.5 + 0.2 * lvl, lvl) * buildNum(2.3, "B") };
      },
      effect: [{ name: "currencyGalleryGreenDrumCap", type: "base", value: (lvl) => lvl * 10 }],
    },
    investment: {
      type: "prestige",
      requirement() {
        return store.state.stat.gallery_purple.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(1.75 + 0.08 * lvl, lvl) * buildNum(12, "B") };
      },
      effect: [{ name: "currencyGalleryCashGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) }],
    },
    purpleCrayon: {
      type: "prestige",
      cap: 40,
      requirement() {
        return store.state.stat["gallery_deep-orange"].total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * buildNum(140, "B") };
      },
      effect: [{ name: "currencyGalleryPurpleGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    yellowTruck: {
      type: "prestige",
      cap: 5,
      requirement() {
        return store.state.stat["gallery_deep-orange"].total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(4 + 2 * lvl, lvl) * buildNum(790, "B") };
      },
      effect: [{ name: "currencyGalleryYellowDrumCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 }],
    },
    blueCrate: {
      type: "prestige",
      cap: 9,
      requirement() {
        return store.state.stat["gallery_deep-orange"].total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(2.5 + 0.2 * lvl, lvl) * buildNum(3.75, "T") };
      },
      effect: [{ name: "currencyGalleryBlueDrumCap", type: "base", value: (lvl) => lvl * 10 }],
    },
    artClass: {
      type: "prestige",
      requirement() {
        return store.state.unlock.galleryCanvas.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(1.5 + 0.1 * lvl, lvl) * buildNum(40, "T") };
      },
      effect: [{ name: "galleryCanvasSpeed", type: "mult", value: (lvl) => Math.pow(1.15, lvl) }],
    },
    preparation: {
      type: "prestige",
      requirement() {
        return store.state.unlock.galleryCanvas.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(2.5, getSequence(1, lvl)) * buildNum(500, "T") };
      },
      effect: [
        { name: "galleryInspirationStart", type: "base", value: (lvl) => lvl },
        { name: "galleryCanvasSize", type: "base", value: (lvl) => lvl },
      ],
    },
    deepOrangeCrayon: {
      type: "prestige",
      cap: 45,
      requirement() {
        return store.state.stat.gallery_amber.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * buildNum(6.25, "Qa") };
      },
      effect: [{ name: "currencyGalleryDeep-orangeGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    greenTruck: {
      type: "prestige",
      cap: 5,
      requirement() {
        return store.state.stat.gallery_amber.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(4 + 2 * lvl, lvl) * buildNum(70, "Qa") };
      },
      effect: [{ name: "currencyGalleryGreenDrumCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    purpleCrate: {
      type: "prestige",
      cap: 9,
      requirement() {
        return store.state.stat.gallery_amber.total > 0 && store.state.unlock.galleryDrums.see;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(2.5 + 0.2 * lvl, lvl) * buildNum(420, "Qa") };
      },
      effect: [{ name: "currencyGalleryPurpleDrumCap", type: "base", value: (lvl) => lvl * 10 }],
    },
    amberCrayon: {
      type: "prestige",
      cap: 50,
      requirement() {
        return store.state.stat["gallery_light-green"].total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * buildNum(2, "Qi") };
      },
      effect: [{ name: "currencyGalleryAmberGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    truckConvoy: {
      type: "prestige",
      requirement() {
        return store.state.stat["gallery_light-green"].total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(1.2 + 0.1 * lvl, lvl) * buildNum(750, "Qa") };
      },
      effect: [
        { name: "currencyGalleryRedDrumCap", type: "mult", value: (lvl) => Math.min(lvl * 0.1 + 1, 3) },
        {
          name: "currencyGalleryOrangeDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 5 ? Math.min((lvl - 5) * 0.1 + 1, 3) : null),
        },
        {
          name: "currencyGalleryYellowDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 10 ? Math.min((lvl - 10) * 0.1 + 1, 3) : null),
        },
        {
          name: "currencyGalleryGreenDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 15 ? Math.min((lvl - 15) * 0.1 + 1, 3) : null),
        },
        {
          name: "currencyGalleryBlueDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 20 ? Math.min((lvl - 20) * 0.1 + 1, 3) : null),
        },
        {
          name: "currencyGalleryPurpleDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 25 ? Math.min((lvl - 25) * 0.1 + 1, 3) : null),
        },
        {
          name: "currencyGalleryDeep-orangeDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 30 ? Math.min((lvl - 30) * 0.1 + 1, 3) : null),
        },
        {
          name: "currencyGalleryAmberDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 35 ? Math.min((lvl - 35) * 0.1 + 1, 3) : null),
        },
        {
          name: "currencyGalleryLight-greenDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 40 ? Math.min((lvl - 40) * 0.1 + 1, 3) : null),
        },
        {
          name: "currencyGalleryTealDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 45 ? Math.min((lvl - 45) * 0.1 + 1, 3) : null),
        },
        {
          name: "currencyGalleryLight-blueDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 50 ? Math.min((lvl - 50) * 0.1 + 1, 3) : null),
        },
        {
          name: "currencyGalleryPinkDrumCap",
          type: "mult",
          value: (lvl) => (lvl > 55 ? Math.min((lvl - 55) * 0.1 + 1, 3) : null),
        },
      ],
    },
    lightGreenCrayon: {
      type: "prestige",
      cap: 55,
      requirement() {
        return store.state.stat.gallery_teal.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * buildNum(2, "Sx") };
      },
      effect: [{ name: "currencyGalleryLight-greenGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    tealCrayon: {
      type: "prestige",
      cap: 60,
      requirement() {
        return store.state.stat["gallery_light-blue"].total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * buildNum(2, "Sp") };
      },
      effect: [{ name: "currencyGalleryTealGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    lightBlueCrayon: {
      type: "prestige",
      cap: 65,
      requirement() {
        return store.state.stat.gallery_pink.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * buildNum(2, "O") };
      },
      effect: [{ name: "currencyGalleryLight-blueGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    pinkCrayon: {
      type: "prestige",
      cap: 70,
      requirement() {
        return store.state.stat.gallery_brown.total > 0;
      },
      price(lvl) {
        return { gallery_cash: Math.pow(lvl * 0.02 + 1.5, lvl) * buildNum(2, "N") };
      },
      effect: [{ name: "currencyGalleryPinkGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
  },
  "modules/gallery/upgradeShape": {
    bigCircle: {
      type: "shape",
      price(lvl) {
        return { gallery_circle: Math.pow(lvl * 0.01 + 1.35, lvl) * 100 };
      },
      effect: [{ name: "galleryShapeGain", type: "mult", value: (lvl) => Math.pow(1.25, lvl) }],
    },
    wellDrawnCircle: {
      type: "shape",
      price(lvl) {
        return { gallery_circle: Math.pow(lvl * 0.05 + 2.25, lvl) * 5000 };
      },
      effect: [{ name: "currencyGalleryRedGain", type: "mult", value: (lvl) => lvl * 0.02 + 1 }],
    },
    bigRectangle: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.rectangle.unlocked;
      },
      price(lvl) {
        return { gallery_rectangle: Math.pow(lvl * 0.1 + 1.75, lvl) * 1000 };
      },
      effect: [{ name: "currencyGalleryMotivationCap", type: "base", value: (lvl) => lvl }],
    },
    wellDrawnRectangle: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.rectangle.unlocked;
      },
      price(lvl) {
        return { gallery_rectangle: Math.pow(lvl * 0.05 + 2.25, lvl) * 6500 };
      },
      effect: [{ name: "currencyGalleryConverterCap", type: "base", value: (lvl) => lvl * 40 }],
    },
    creativity: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.triangle.unlocked;
      },
      price(lvl) {
        return fallbackArray(
          [
            { gallery_triangle: buildNum(10, "K"), gallery_circle: 4000 },
            { gallery_triangle: buildNum(100, "K"), gallery_rectangle: buildNum(40, "K") },
            { gallery_triangle: buildNum(10, "M"), gallery_star: buildNum(4, "M") },
            { gallery_triangle: buildNum(10, "B"), gallery_ellipse: buildNum(3, "B"), gallery_heart: buildNum(3, "B") },
            {
              gallery_triangle: buildNum(100, "T"),
              gallery_square: buildNum(30, "Sx"),
              gallery_octagon: buildNum(30, "T"),
            },
            {
              gallery_triangle: buildNum(10, "Qi"),
              gallery_pentagon: buildNum(300, "Qa"),
              gallery_hexagon: buildNum(300, "Qa"),
            },
          ],
          { gallery_triangle: Math.pow(10, getSequence(1, lvl)) * buildNum(10, "K") },
          lvl,
        );
      },
      effect: [
        { name: "bomb", type: "galleryShape", value: (lvl) => lvl >= 1 },
        { name: "dice", type: "galleryShape", value: (lvl) => lvl >= 2 },
        { name: "accelerator", type: "galleryShape", value: (lvl) => lvl >= 3 },
        { name: "sparkles", type: "galleryShape", value: (lvl) => lvl >= 4 },
        { name: "hourglass", type: "galleryShape", value: (lvl) => lvl >= 5 },
        { name: "chest", type: "galleryShape", value: (lvl) => lvl >= 6 },
        { name: "currencyGalleryMotivationGain", type: "base", value: (lvl) => (lvl >= 7 ? (lvl - 6) * 0.005 : null) },
      ],
    },
    wellDrawnTriangle: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.triangle.unlocked;
      },
      price(lvl) {
        return { gallery_triangle: Math.pow(lvl * 0.05 + 2.25, lvl) * 8500 };
      },
      effect: [{ name: "currencyGalleryCashGain", type: "mult", value: (lvl) => lvl * 0.01 + 1 }],
    },
    luckyStar: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.star.unlocked;
      },
      price(lvl) {
        return { gallery_star: Math.pow(lvl * 0.4 + 2.35, lvl) * buildNum(75, "K") };
      },
      effect: [{ name: "gallerySpecialShapeChance", type: "base", value: (lvl) => lvl * 0.0008 }],
    },
    wellDrawnStar: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.star.unlocked;
      },
      price(lvl) {
        return { gallery_star: Math.pow(lvl * 0.05 + 2.25, lvl) * buildNum(24, "K") };
      },
      effect: [{ name: "currencyGalleryRedDrumCap", type: "base", value: (lvl) => lvl * 3 }],
    },
    bigEllipse: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.ellipse.unlocked;
      },
      price(lvl) {
        return { gallery_ellipse: Math.pow(lvl * 0.4 + 2.35, lvl) * buildNum(400, "K") };
      },
      effect: [{ name: "gallerySpecialShapeMult", type: "base", value: (lvl) => lvl * 0.25 }],
    },
    wellDrawnEllipse: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.ellipse.unlocked;
      },
      price(lvl) {
        return { gallery_ellipse: Math.pow(lvl * 0.3 + 12.5, lvl) * buildNum(850, "K") };
      },
      effect: [{ name: "galleryColorDrumCap", type: "base", value: (lvl) => lvl }],
    },
    bigHeart: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.heart.unlocked;
      },
      price(lvl) {
        return { gallery_heart: Math.pow(lvl + 8, lvl) * buildNum(2, "M") };
      },
      effect: [
        { name: "galleryShapeGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyGalleryMotivationCap", type: "base", value: (lvl) => lvl * 2 },
      ],
    },
    wellDrawnHeart: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.heart.unlocked;
      },
      price(lvl) {
        return { gallery_heart: Math.pow(lvl * 0.05 + 2.25, lvl) * buildNum(600, "K") };
      },
      effect: [{ name: "galleryColorGain", type: "mult", value: (lvl) => lvl * 0.005 + 1 }],
    },
    bigSquare: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.square.unlocked;
      },
      price(lvl) {
        return { gallery_square: Math.pow(lvl * 0.002 + 1.35, lvl) * buildNum(15, "M") };
      },
      effect: [{ name: "currencyGallerySquareGain", type: "mult", value: (lvl) => Math.pow(1.3, lvl) }],
    },
    wellDrawnSquare: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.square.unlocked;
      },
      price(lvl) {
        return { gallery_square: Math.pow(lvl * 0.15 + 3.5, lvl) * buildNum(3.75, "M") };
      },
      effect: [
        { name: "currencyGalleryOrangeDrumCap", type: "base", value: (lvl) => lvl * 3 },
        { name: "currencyGalleryYellowDrumCap", type: "base", value: (lvl) => lvl * 2 },
        { name: "currencyGalleryGreenDrumCap", type: "base", value: (lvl) => lvl },
      ],
    },
    bigOctagon: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.octagon.unlocked;
      },
      price(lvl) {
        return { gallery_octagon: Math.pow(lvl * 0.01 + 1.45, lvl) * buildNum(1, "B") };
      },
      effect: [
        { name: "currencyGalleryCircleGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyGalleryRectangleGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyGalleryTriangleGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
      ],
    },
    wellDrawnOctagon: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.octagon.unlocked;
      },
      price(lvl) {
        return { gallery_octagon: Math.pow(lvl * 0.2 + 2.25, lvl) * buildNum(225, "M") };
      },
      effect: [{ name: "galleryInspirationBase", type: "mult", value: (lvl) => 1 / (0.01 * lvl + 1) }],
    },
    bigPentagon: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.pentagon.unlocked;
      },
      price(lvl) {
        return { gallery_pentagon: Math.pow(lvl * 0.01 + 1.45, lvl) * buildNum(75, "B") };
      },
      effect: [
        { name: "currencyGalleryStarGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyGalleryEllipseGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyGalleryHeartGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
      ],
    },
    wellDrawnPentagon: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.pentagon.unlocked;
      },
      price(lvl) {
        return { gallery_pentagon: Math.pow(lvl * 0.1 + 2.25, lvl) * buildNum(13.5, "B") };
      },
      effect: [{ name: "currencyGalleryPackageCap", type: "base", value: (lvl) => lvl * 2 }],
    },
    bigHexagon: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.hexagon.unlocked;
      },
      price(lvl) {
        return { gallery_hexagon: Math.pow(lvl * 0.01 + 1.45, lvl) * buildNum(11, "T") };
      },
      effect: [
        { name: "currencyGalleryOctagonGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyGalleryPentagonGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyGalleryHexagonGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
      ],
    },
    wellDrawnHexagon: {
      type: "shape",
      requirement() {
        return store.state.gallery.shape.hexagon.unlocked;
      },
      price(lvl) {
        return { gallery_hexagon: Math.pow(lvl * 0.1 + 2.25, lvl) * buildNum(2, "T") };
      },
      effect: [{ name: "galleryCanvasSpeed", type: "mult", value: (lvl) => lvl * 0.01 + 1 }],
    },
  },
  "modules/gallery": {
    name: "gallery",
    tickspeed: 1,
    unlockNeeded: "galleryFeature",
    tick(seconds) {
      store.commit("stat/add", { feature: "gallery", name: "timeSpent", value: seconds });
      const segments = Math.ceil(Math.pow(seconds, 0.5) / 8);
      let secondsSpent = 0;
      for (let i = 0; i < segments; i++) {
        const secondsSegment = Math.round((seconds * (i + 1)) / segments) - secondsSpent;
        secondsSpent += secondsSegment;
        const colors = ["beauty", ...store.state.gallery.color].reverse();
        const baseGain = colors.map((color) => store.getters["mult/get"](`currencyGallery${capitalize(color)}Gain`));
        colors.forEach((color, index) => {
          const gain = (baseGain[index] + store.getters["mult/get"](`currencyGallery${capitalize(color)}Gain`)) / 2;
          if (gain > 0) {
            store.dispatch("currency/gain", { feature: "gallery", name: color, amount: secondsSegment * gain });
          }
        });
      }
      const globalLevelGallery = Math.floor(logBase(store.state.stat.gallery_beauty.total, 4));
      if (globalLevelGallery > 0) {
        store.dispatch("meta/globalLevelPart", { key: "gallery_0", amount: globalLevelGallery });
      }
      store.dispatch("gallery/packageAndConverterTick", seconds);
      if (store.state.unlock.galleryShape.use) {
        store.dispatch("currency/gain", {
          feature: "gallery",
          name: "motivation",
          amount: seconds * store.getters["mult/get"]("currencyGalleryMotivationGain"),
        });
      }
      if (store.state.unlock.galleryInspiration.use) {
        let newTime = store.state.gallery.inspirationTime + seconds;
        let newAmount = store.state.gallery.inspirationAmount;
        while (newTime >= store.getters["gallery/inspirationTimeNeeded"](newAmount)) {
          newTime -= store.getters["gallery/inspirationTimeNeeded"](newAmount);
          newAmount++;
        }
        store.commit("gallery/updateKey", { key: "inspirationTime", value: newTime });
        if (newAmount > store.state.gallery.inspirationAmount) {
          store.dispatch("currency/gain", {
            feature: "gallery",
            name: "inspiration",
            amount: newAmount - store.state.gallery.inspirationAmount,
          });
          store.commit("gallery/updateKey", { key: "inspirationAmount", value: newAmount });
        }
      }
      if (store.state.unlock.galleryCanvas.use) {
        let totalLevel = 0;
        for (const [key, elem] of Object.entries(store.state.gallery.colorData)) {
          if (elem.cacheSpace > 0) {
            const speed = store.getters["mult/get"](
              "galleryCanvasSpeed",
              getSequence(10, elem.cacheSpace) * 0.1,
              1 + store.getters["currency/value"](`gallery_${key}Drum`) * 0.1,
            );
            const oldProgress = elem.progress;
            let progress = elem.progress;
            let secondsLeft = seconds;
            while (secondsLeft > 0) {
              const difficulty = store.getters["gallery/canvasDifficulty"](key, Math.floor(progress));
              const timeUsed = Math.min(((Math.floor(progress + 1) - progress) * difficulty) / speed, secondsLeft);
              progress += (timeUsed * speed) / difficulty;
              secondsLeft -= timeUsed;
            }
            store.commit("gallery/updateColorDataKey", { name: key, key: "progress", value: progress });
            if (Math.floor(progress) > Math.floor(oldProgress)) {
              store.dispatch("gallery/applyCanvasLevel", { name: key, onLevel: true });
            }
          }
          totalLevel += elem.progress;
        }
        store.commit("stat/increaseTo", { feature: "gallery", name: "canvasLevelTotal", value: totalLevel });
      }
    },
    unlock: [
      "galleryFeature",
      "galleryConversion",
      "galleryInspiration",
      "galleryAuction",
      "galleryDrums",
      "galleryShape",
      "galleryCanvas",
    ],
    stat: {
      timeSpent: { display: "time" },
      bestPrestige: { showInStatistics: true },
      highestTierIdea: {},
      shapeComboHighest: {},
      shapeComboTotal: { showInStatistics: true },
      canvasLevelTotal: { showInStatistics: true },
      hourglassHighest: {},
      prestigeCount: { showInStatistics: true },
    },
    mult: {
      galleryInspirationBase: { unlock: "galleryInspiration", baseValue: 300, display: "timeMs" },
      galleryInspirationIncrement: { unlock: "galleryInspiration", baseValue: 1, min: 0, display: "percent" },
      galleryInspirationStart: { unlock: "galleryInspiration" },
      galleryShapeGain: { unlock: "galleryShape" },
      gallerySpecialShapeChance: { unlock: "galleryShape", baseValue: 0.005, display: "percent" },
      gallerySpecialShapeMult: { unlock: "galleryShape", baseValue: 15, display: "mult" },
      galleryCanvasSize: { unlock: "galleryCanvas", baseValue: 1, round: true },
      galleryCanvasSpeed: { unlock: "galleryCanvas", display: "perSecond" },
    },
    currency: {
      beauty: {
        color: "deep-purple",
        icon: "mdi-image-filter-vintage",
        gainMult: { baseValue: 1, display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        timerIsEstimate: true,
      },
      converter: {
        multUnlock: "galleryConversion",
        color: "pale-green",
        icon: "mdi-recycle",
        overcapMult: 0.75,
        overcapScaling: 0.95,
        gainMult: { baseValue: 0.2, display: "perSecond" },
        showGainMult: true,
        capMult: { baseValue: 1000 },
      },
      inspiration: { multUnlock: "galleryInspiration", color: "yellow", icon: "mdi-lightbulb-on" },
      package: {
        multUnlock: "galleryDrums",
        color: "beige",
        icon: "mdi-package-variant",
        overcapMult: 0.8,
        overcapScaling: 0.8,
        gainMult: { baseValue: 0.0125, display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 10 },
      },
      motivation: {
        multUnlock: "galleryShape",
        type: "shape",
        color: "pink-purple",
        icon: "mdi-emoticon-excited",
        overcapMult: 0.5,
        gainMult: { baseValue: 0.2, display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 100 },
      },
      mysteryShape: {
        multUnlock: "galleryShape",
        type: "shape",
        color: "pale-purple",
        icon: "mdi-octahedron",
        overcapMult: 0,
        gainMult: { baseValue: 1 },
        capMult: { baseValue: 1337 },
      },
      cash: {
        multUnlock: "galleryAuction",
        type: "prestige",
        alwaysVisible: true,
        color: "green",
        icon: "mdi-cash",
        gainMult: {},
      },
    },
    note: buildArray(10).map(() => "g"),
    upgrade: { ...upgrade, ...upgradeShape, ...upgradePrestige, ...upgradePremium, ...bookGallery },
    multGroup: [
      {
        mult: "galleryShapeGain",
        name: "currencyGain",
        type: "shape",
        blacklist: ["gallery_motivation", "gallery_mysteryShape"],
      },
    ],
    relic,
    achievement,
    init() {
      // Add each color as a mult and currency
      store.state.gallery.color.forEach((elem, index) => {
        const colorMult = ["beauty", ...store.state.gallery.color][index];
        store.dispatch("currency/init", {
          feature: "gallery",
          multUnlock: "galleryFeature",
          name: elem,
          color: elem,
          icon: "mdi-liquid-spot",
          currencyMult: {
            [`currencyGallery${capitalize(colorMult)}Gain`]: {
              type: "base",
              value: (val) => (val > 100 ? Math.pow(val * 100, 0.5) : val),
            },
          },
          gainMult: { display: "perSecond" },
          showGainMult: true,
          showGainTimer: true,
          timerIsEstimate: true,
        });
        store.dispatch("currency/init", {
          feature: "gallery",
          multUnlock: "galleryDrums",
          name: elem + "Drum",
          color: elem,
          icon: "mdi-barrel",
          currencyMult:
            elem === "red"
              ? { currencyGalleryBeautyGain: { type: "mult", value: (val) => Math.pow(val * 0.1 + 1, 2) } }
              : {
                  currencyGalleryBeautyGain: { type: "mult", value: (val) => val * 0.1 + 1 },
                  [`currencyGallery${capitalize(colorMult)}Gain`]: { type: "mult", value: (val) => val * 0.1 + 1 },
                  [`currencyGallery${capitalize(colorMult)}DrumCap`]: { type: "bonus", value: (val) => val },
                },
          overcapMult: 0,
          capMult: { baseValue: 10, round: true },
        });
        store.commit("gallery/initColorData", { name: elem });
        store.commit(
          "mult/init",
          { feature: "gallery", name: `gallery${capitalize(elem)}Conversion`, unlock: "galleryFeature", baseValue: 1 },
          { root: true },
        );
        store.commit(
          "mult/init",
          {
            feature: "gallery",
            name: `gallery${capitalize(elem)}DrumChance`,
            unlock: "galleryDrums",
            display: "percent",
            min: 0,
            max: 1,
          },
          { root: true },
        );
      });
      store.commit(
        "mult/init",
        {
          feature: "gallery",
          name: "galleryColorGain",
          unlock: "galleryFeature",
          group: store.state.gallery.color.map((elem) => `currencyGallery${capitalize(elem)}Gain`),
        },
        { root: true },
      );
      store.commit(
        "mult/init",
        {
          feature: "gallery",
          name: "galleryColorDrumChance",
          unlock: "galleryDrums",
          group: store.state.gallery.color.map((elem) => `gallery${capitalize(elem)}DrumChance`),
        },
        { root: true },
      );
      store.commit(
        "mult/init",
        {
          feature: "gallery",
          name: "galleryColorDrumCap",
          unlock: "galleryDrums",
          group: store.state.gallery.color.map((elem) => `currencyGallery${capitalize(elem)}DrumCap`),
        },
        { root: true },
      );
      for (const [key, elem] of Object.entries(idea)) {
        store.commit("gallery/initIdea", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(shape)) {
        store.commit("gallery/initShape", { name: key, ...elem });
        if (!elem.isSpecial) {
          store.dispatch("currency/init", {
            feature: "gallery",
            type: "shape",
            multUnlock: "galleryFeature",
            name: key,
            color: elem.color,
            icon: elem.icon,
            gainMult: {},
            showGainMult: true,
          });
        }
      }
      store.commit("gallery/initShapeGrid");
    },
    saveGame() {
      let obj = { shapeGrid: store.state.gallery.shapeGrid };
      if (store.state.gallery.inspirationTime > 0) {
        obj.inspirationTime = store.state.gallery.inspirationTime;
      }
      if (store.state.gallery.inspirationAmount > 0) {
        obj.inspirationAmount = store.state.gallery.inspirationAmount;
      }
      if (store.state.gallery.hourglassCombo > 0) {
        obj.hourglassCombo = store.state.gallery.hourglassCombo;
      }
      if (store.state.gallery.canvasSpace.length > 0) {
        obj.canvasSpace = store.state.gallery.canvasSpace;
      }
      if (store.state.unlock.galleryInspiration.see) {
        let ideas = {};
        for (const [key, elem] of Object.entries(store.state.gallery.idea)) {
          if (elem.owned) {
            ideas[key] = elem.level;
          }
        }
        obj.idea = ideas;
      }
      if (store.state.unlock.galleryCanvas.see) {
        let colorData = {};
        for (const [key, elem] of Object.entries(store.state.gallery.colorData)) {
          if (elem.progress > 0) {
            colorData[key] = elem.progress;
          }
        }
        obj.colorData = colorData;
      }
      return obj;
    },
    loadGame(data) {
      if (data.shapeGrid) {
        store.commit("gallery/updateKey", { key: "shapeGrid", value: data.shapeGrid });
      }
      if (data.inspirationTime) {
        store.commit("gallery/updateKey", { key: "inspirationTime", value: data.inspirationTime });
      }
      if (data.inspirationAmount) {
        store.commit("gallery/updateKey", { key: "inspirationAmount", value: data.inspirationAmount });
      }
      if (data.hourglassCombo) {
        store.commit("gallery/updateKey", { key: "hourglassCombo", value: data.hourglassCombo });
      }
      if (data.canvasSpace) {
        store.commit("gallery/updateKey", { key: "canvasSpace", value: data.canvasSpace });
        let colors = {};
        data.canvasSpace.forEach((elem) => {
          if (colors[elem] === undefined) {
            colors[elem] = 0;
          }
          colors[elem]++;
        });
        for (const [key, elem] of Object.entries(colors)) {
          if (store.state.gallery.colorData[key] !== undefined) {
            store.commit("gallery/updateColorDataKey", { name: key, key: "cacheSpace", value: elem });
          }
        }
      }
      if (data.idea !== undefined) {
        for (const [key, elem] of Object.entries(data.idea)) {
          if (store.state.gallery.idea[key] !== undefined) {
            store.commit("gallery/updateIdeaKey", { name: key, key: "owned", value: true });
            if (elem > 0) {
              store.commit("gallery/updateIdeaKey", { name: key, key: "level", value: elem });
              store.dispatch("gallery/applyIdea", { name: key });
            }
          }
        }
      }
      if (data.colorData !== undefined) {
        for (const [key, elem] of Object.entries(data.colorData)) {
          if (store.state.gallery.colorData[key] !== undefined) {
            if (elem > 0) {
              store.commit("gallery/updateColorDataKey", { name: key, key: "progress", value: elem });
              if (elem >= 1) {
                store.dispatch("gallery/applyCanvasLevel", { name: key });
              }
            }
          }
        }
      }
    },
  },
  "modules/gem/card": {
    feature: {
      prefix: "GE",
      reward: [{ name: "currencyGemTopazCap", type: "base", value: (lvl) => lvl * 20 }],
      shinyReward: [{ name: "currencyGemTopazCap", type: "base", value: (lvl) => lvl * 20 }],
      unlock: "gemFeature",
    },
    collection: { preciousJewelry: { reward: [{ name: "currencyGemTopazCap", type: "base", value: 160 }] } },
    pack: {},
    card: cardList,
  },
  "modules/gem": {
    name: "gem",
    tickspeed: 1,
    unlockNeeded: "gemFeature",
    tick(seconds, oldTime, newTime) {
      let progress = store.state.gem.progress;
      const genSpeed = store.getters["gem/genSpeed"] / GEM_SPEED_BASE;
      if (store.state.unlock.eventFeature.see) {
        let currentTime = oldTime;
        let nextDay = Math.floor(new Date(oldTime * 1000).setHours(0, 0, 0, 0) / 1000) + SECONDS_PER_DAY;
        let topazProgress = 0;
        let eventProgress = 0;
        let totalProgress = 0;
        const isSimulation = oldTime === 0 || store.state.event.force_event !== null;
        const lastEvent = store.getters["event/eventOnDay"](
          getDay(new Date(isSimulation ? Date.now() : newTime * 1000)),
        );
        let lastEventTime = null;
        if (lastEvent !== null && store.getters["event/eventIsBig"](lastEvent)) {
          const year = new Date(newTime * 1000).getFullYear();
          const start = store.state.event.big[lastEvent].start;
          lastEventTime = isSimulation ? -1 : Math.floor(new Date(`${year}-${start}T00:00:00`).getTime() / 1000);
        }
        while (currentTime < newTime) {
          let timeDiff = Math.min(nextDay, newTime) - currentTime;
          progress += timeDiff * genSpeed * store.state.system.timeMult;
          if (progress >= 1) {
            if (lastEventTime !== null && currentTime > lastEventTime) {
              eventProgress += Math.floor(progress) - totalProgress;
            } else {
              const currentEvent = store.getters["event/eventOnDay"](
                getDay(new Date(isSimulation ? Date.now() : currentTime * 1000)),
              );
              if (currentEvent === null || !store.getters["event/eventIsBig"](currentEvent)) {
                topazProgress += Math.floor(progress) - totalProgress;
              }
            }
          }
          currentTime = nextDay;
          nextDay += SECONDS_PER_DAY;
          totalProgress = Math.floor(progress);
        }
        if (eventProgress > 0) {
          store.dispatch("currency/gain", {
            feature: "event",
            name: store.state.event.big[lastEvent].currency,
            amount: eventProgress,
          });
          store.dispatch("note/find", "event_2");
        }
        if (topazProgress > 0) {
          store.dispatch("currency/gain", { feature: "gem", name: "topaz", amount: topazProgress });
        }
      } else {
        progress += seconds * genSpeed;
      }
      if (progress >= 1) {
        const gems = Math.floor(progress);
        ["ruby", "emerald", "sapphire", "amethyst"].forEach((elem) => {
          store.dispatch("currency/gain", { feature: "gem", name: elem, amount: gems });
        });
        progress -= gems;
      }
      store.commit("gem/updateKey", { key: "progress", value: progress });
    },
    unlock: ["gemFeature"],
    currency: {
      // Permanent upgrades
      ruby: {
        color: "red",
        icon: "mdi-rhombus",
        gainTimerFunction() {
          return store.getters["gem/genSpeed"] / GEM_SPEED_BASE;
        },
        timerIsEstimate: true,
        hideGainTag: true,
      }, // Replacable items (semi-permanent)
      emerald: {
        color: "green",
        icon: "mdi-hexagon",
        gainTimerFunction() {
          return store.getters["gem/genSpeed"] / GEM_SPEED_BASE;
        },
        timerIsEstimate: true,
        hideGainTag: true,
      }, // Instant or temporary boosts
      sapphire: {
        color: "indigo",
        icon: "mdi-pentagon",
        gainTimerFunction() {
          return store.getters["gem/genSpeed"] / GEM_SPEED_BASE;
        },
        timerIsEstimate: true,
        hideGainTag: true,
      }, // Cosmetic items
      amethyst: {
        color: "purple",
        icon: "mdi-cards-diamond",
        gainTimerFunction() {
          return store.getters["gem/genSpeed"] / GEM_SPEED_BASE;
        },
        timerIsEstimate: true,
        hideGainTag: true,
      }, // Event currency
      topaz: {
        color: "amber",
        icon: "mdi-triangle",
        overcapMult: 0,
        capMult: { round: true, baseValue: 1000 },
        gainTimerFunction() {
          return store.getters["gem/genSpeed"] / GEM_SPEED_BASE;
        },
        timerIsEstimate: true,
        hideGainTag: true,
      }, // Rare currency
      diamond: { color: "cyan", icon: "mdi-diamond" }, // Extremely rare currency
      onyx: { color: "deep-purple", icon: "mdi-octagon" },
    },
    upgrade: {
      topazBag: {
        type: "premium",
        requirement() {
          return store.state.unlock.eventFeature.see;
        },
        price(lvl) {
          return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 100 };
        },
        effect: [{ name: "currencyGemTopazCap", type: "base", value: (lvl) => lvl * 200 }],
      },
    },
    note: buildArray(2).map(() => "g"),
    consumable: { prestigeStone: { icon: "mdi-circle-double", color: "deep-purple", price: { gem_sapphire: 400 } } },
    saveGame() {
      return { progress: store.state.gem.progress };
    },
    loadGame(data) {
      if (data.progress !== undefined) {
        store.commit("gem/updateKey", { key: "progress", value: data.progress });
      }
    },
  },
  "modules/general/grobodal": {
    quests: {
      diggingDeeper: {
        reward: "torch",
        stages: [
          {
            note: "general_1",
            tasks: [
              { type: "stat", subtype: "current", name: "mining_timeSpent", operator: "<=", value: 1800 },
              { type: "stat", subtype: "current", name: "mining_oreAluminium", operator: ">=", value: 25 },
            ],
          },
          {
            note: "general_2",
            tasks: [{ type: "stat", subtype: "current", name: "village_maxBuilding", operator: ">=", value: 200 }],
          },
          {
            note: "general_3",
            tasks: [{ type: "stat", subtype: "current", name: "mining_depthDwellerCap0", operator: ">=", value: 5 }],
          },
          {
            note: "general_4",
            tasks: [{ type: "upgrade", subtype: "current", name: "village_school", operator: ">=", value: 1 }],
          },
          {
            note: "general_5",
            tasks: [
              { type: "stat", subtype: "current", name: "mining_timeSpent", operator: "<=", value: 900 },
              { type: "stat", subtype: "current", name: "mining_scrap", operator: ">=", value: buildNum(10, "B") },
            ],
          },
        ],
      },
      combatTraining: {
        reward: "purpleHeart",
        stages: [
          {
            note: "general_6",
            tasks: [{ type: "stat", subtype: "current", name: "horde_maxZone", operator: ">=", value: 35 }],
          },
          {
            note: "general_7",
            tasks: [
              { type: "stat", subtype: "current", name: "horde_totalDamage", operator: ">=", value: buildNum(5, "B") },
              { type: "stat", subtype: "current", name: "horde_maxZone", operator: "<=", value: 1 },
            ],
          },
          {
            note: "general_8",
            tasks: [
              { type: "stat", subtype: "current", name: "mining_maxDepth0", operator: ">=", value: 40 },
              { type: "stat", subtype: "current", name: "mining_craftingCount", operator: "<=", value: 0 },
            ],
          },
          {
            note: "general_9",
            tasks: [{ type: "stat", subtype: "current", name: "horde_maxZone", operator: ">=", value: 48 }],
          },
          { note: "general_10", tasks: [{ type: "unlock", name: "villageBuildings4", feature: "village" }] },
          {
            note: "general_11",
            tasks: [
              {
                type: "stat",
                subtype: "current",
                name: "horde_soulCorrupted",
                operator: ">=",
                value: buildNum(10, "M"),
              },
            ],
          },
        ],
      },
      gardening: {
        reward: "rottenLeaf",
        unlock: "farmCropExp",
        stages: [
          {
            note: "general_12",
            tasks: [{ type: "cropLevel", subtype: "current", name: "potato", operator: ">=", value: 1 }],
          },
          {
            note: "general_13",
            tasks: [{ type: "upgrade", subtype: "current", name: "village_garden", operator: ">=", value: 20 }],
          },
          {
            note: "general_14",
            tasks: [{ type: "stat", subtype: "current", name: "farm_bestPrestige", operator: ">=", value: 7 }],
          },
          {
            note: "general_15",
            tasks: [{ type: "stat", subtype: "current", name: "farm_maxOvergrow", operator: ">=", value: 7 }],
          },
          {
            note: "general_16",
            tasks: [{ type: "upgrade", subtype: "current", name: "farm_seedBox", operator: ">=", value: 7 }],
          },
        ],
      },
      pitchBlack: {
        reward: "stonepiercer",
        unlock: "miningSmeltery",
        stages: [
          {
            note: "general_17",
            tasks: [{ type: "upgrade", subtype: "current", name: "mining_graniteHardening", operator: ">=", value: 6 }],
          },
          {
            note: "general_18",
            tasks: [
              { type: "stat", subtype: "current", name: "mining_maxDepth0", operator: ">=", value: 95 },
              { type: "stat", subtype: "current", name: "mining_craftingCount", operator: "<=", value: 5 },
            ],
          },
          {
            note: "general_19",
            tasks: [
              { type: "stat", subtype: "current", name: "village_timeSpent", operator: "<=", value: 900 },
              { type: "stat", subtype: "current", name: "village_stone", operator: ">=", value: buildNum(500, "K") },
            ],
          },
          {
            note: "general_20",
            tasks: [{ type: "stat", subtype: "current", name: "mining_coalMax", operator: ">=", value: 30 }],
          },
        ],
      },
      masterOfTheSystem: {
        reward: "consolationPrize",
        unlock: "hordeItemMastery",
        stages: [
          {
            note: "general_21",
            tasks: [
              { type: "stat", subtype: "total", name: "horde_maxMastery", operator: ">=", value: 2 },
              { type: "stat", subtype: "total", name: "horde_totalMastery", operator: ">=", value: 18 },
            ],
          },
          {
            note: "general_22",
            tasks: [{ type: "stat", subtype: "current", name: "farm_maxOvergrow", operator: ">=", value: 15 }],
          },
          {
            note: "general_23",
            tasks: [{ type: "stat", subtype: "current", name: "village_maxBuilding", operator: ">=", value: 575 }],
          },
          {
            note: "general_24",
            tasks: [
              { type: "equipmentMastery", name: "milkCup", operator: ">=", value: 3 },
              { type: "equipmentMastery", name: "corruptEye", operator: ">=", value: 2 },
              { type: "equipmentMastery", name: "luckyCharm", operator: ">=", value: 1 },
            ],
          },
          {
            note: "general_25",
            tasks: [{ type: "stat", subtype: "total", name: "village_offeringMax", operator: ">=", value: 4500 }],
          },
          {
            note: "general_26",
            tasks: [
              { type: "stat", subtype: "current", name: "horde_maxZone", operator: ">=", value: 110 },
              { type: "stat", subtype: "current", name: "horde_maxItems", operator: "<=", value: 1 },
            ],
          },
        ],
      },
      thinkPlayerThink: {
        reward: "prettyLamp",
        unlock: "galleryAuction",
        stages: [
          {
            note: "general_27",
            tasks: [{ type: "stat", subtype: "current", name: "gallery_inspirationMax", operator: ">=", value: 12 }],
          },
          {
            note: "general_28",
            tasks: [
              { type: "stat", subtype: "current", name: "gallery_greenMax", operator: ">=", value: buildNum(10, "K") },
            ],
          },
          {
            note: "general_29",
            tasks: [{ type: "stat", subtype: "current", name: "gallery_redDrumMax", operator: ">=", value: 250 }],
          },
          {
            note: "general_30",
            tasks: [{ type: "upgrade", subtype: "current", name: "village_theater", operator: ">=", value: 12 }],
          },
          {
            note: "general_31",
            tasks: [
              {
                type: "stat",
                subtype: "total",
                name: "gallery_bestPrestige",
                operator: ">=",
                value: buildNum(100, "K"),
              },
            ],
          },
        ],
      },
    },
  },
  "modules/general/orladee": {
    unlock: "generalOrladeeSubfeature",
    quests: {
      beautyOfThisWorld: {
        reward: "chessboard",
        stages: [
          {
            note: "general_32",
            tasks: [
              { type: "stat", subtype: "current", name: "farm_bugMax", operator: ">=", value: 250 },
              { type: "stat", subtype: "current", name: "farm_ladybugMax", operator: ">=", value: 250 },
              { type: "stat", subtype: "current", name: "farm_butterflyMax", operator: ">=", value: 50 },
            ],
          },
          {
            note: "general_33",
            tasks: [{ type: "stat", subtype: "current", name: "gallery_redDrumMax", operator: ">=", value: 1200 }],
          },
        ],
      },
    },
  },
  "modules/general": {
    name: "general",
    tickspeed: 1,
    unlockNeeded: "generalFeature",
    tick() {
      for (const [gkey, general] of Object.entries(store.state.general)) {
        if (general.unlock === null || store.state.unlock[general.unlock].see) {
          for (const [qkey, quest] of Object.entries(general.quests)) {
            if (quest.unlock === null || store.state.unlock[quest.unlock].see) {
              let complete = true;
              while (quest.stage < quest.stages.length && complete) {
                const tasks = quest.stages[quest.stage].tasks;
                tasks.forEach((task) => {
                  let current = 0;
                  switch (task.type) {
                    case "stat": {
                      current = store.state.stat[task.name][task.subtype === "current" ? "value" : "total"];
                      break;
                    }
                    case "unlock": {
                      current = store.state.unlock[task.name].see;
                      break;
                    }
                    case "upgrade": {
                      current =
                        store.state.upgrade.item[task.name][task.subtype === "current" ? "level" : "highestLevel"];
                      break;
                    }
                    case "cropLevel": {
                      current = store.state.farm.crop[task.name][task.subtype === "current" ? "level" : "levelMax"];
                      break;
                    }
                    case "equipmentMastery": {
                      current = store.state.horde.items[task.name].masteryLevel;
                      break;
                    }
                  }
                  if (
                    (task.operator === undefined && !current) ||
                    (task.operator === ">=" && current < task.value) ||
                    (task.operator === ">" && current <= task.value) ||
                    (task.operator === "<=" && current > task.value) ||
                    (task.operator === "<" && current >= task.value) ||
                    (task.operator === "==" && current !== task.value)
                  ) {
                    complete = false;
                  }
                });
                if (complete) {
                  store.dispatch("general/completeQuest", { general: gkey, quest: qkey });
                }
              }
            }
          }
        }
      }
    },
    unlock: [
      "generalFeature",
      "generalOrladeeSubfeature",
      "generalOppenschroeSubfeature",
      "generalBelluxSubfeature",
      "generalOnocluaSubfeature",
      "generalOmnisolixSubfeature",
    ],
    note: ["g", ...buildArray(31).map(() => "grobodal"), ...buildArray(9).map(() => "orladee")],
    relic: {
      torch: {
        icon: "mdi-torch",
        feature: ["general", "mining", "village"],
        color: "orange",
        effect: [
          { name: "miningCardCap", type: "base", value: 1 },
          { name: "villageCardCap", type: "base", value: 1 },
        ],
      },
      purpleHeart: {
        icon: "mdi-heart",
        feature: ["general", "horde"],
        color: "purple",
        effect: [
          { name: "hordeHealth", type: "mult", value: 1.5 },
          { name: "currencyHordeSoulCorruptedGain", type: "mult", value: 1.2 },
        ],
      },
      rottenLeaf: {
        icon: "mdi-leaf",
        feature: ["general", "farm"],
        color: "brown",
        effect: [
          { name: "farmCropGain", type: "mult", value: 1.75 },
          { name: "farmExperience", type: "mult", value: 1.2 },
          { name: "farmOvergrow", type: "base", value: 0.1 },
        ],
      },
      stonepiercer: {
        icon: "mdi-screwdriver",
        feature: ["general", "mining"],
        color: "cherry",
        effect: [{ name: "miningDamage", type: "mult", value: 2.25 }],
      },
      consolationPrize: {
        icon: "mdi-seal-variant",
        feature: ["general", "village", "horde", "farm"],
        color: "lighter-grey",
        effect: [
          { name: "villageResourceGain", type: "mult", value: 1.4 },
          { name: "hordeItemMasteryGain", type: "mult", value: 1.4 },
          { name: "farmExperience", type: "mult", value: 1.4 },
        ],
      },
      prettyLamp: {
        icon: "mdi-vanity-light",
        feature: ["general", "gallery"],
        color: "light-blue",
        effect: [
          { name: "galleryInspirationStart", type: "base", value: 3 },
          { name: "thinkHarder", type: "galleryIdea", value: true },
        ],
      },
      chessboard: {
        icon: "mdi-checkerboard",
        feature: ["general", "horde"],
        color: "grey",
        effect: [{ name: "hordeChessItems", type: "unlock", value: true }],
      },
      iridiscentFlower: {
        icon: "mdi-flower-pollen",
        feature: ["general", "cryolab"],
        color: "pink",
        effect: [{ name: "cryolabMaxFeatures", type: "base", value: 1 }],
      },
    },
    init() {
      for (const [key, elem] of Object.entries({
        grobodal,
        orladee,
        oppenschroe: { unlock: "generalOppenschroeSubfeature", quests: {} },
        bellux: { unlock: "generalBelluxSubfeature", quests: {} },
        onoclua: { unlock: "generalOnocluaSubfeature", quests: {} },
        omnisolix: { unlock: "generalOmnisolixSubfeature", quests: {} },
      })) {
        store.commit("general/init", { name: key, ...elem });
      }
    },
    saveGame() {
      let obj = {};
      for (const [gkey, general] of Object.entries(store.state.general)) {
        if (general.unlock === null || store.state.unlock[general.unlock].see) {
          obj[gkey] = {};
          for (const [qkey, quest] of Object.entries(general.quests)) {
            if (quest.stage > 0) {
              obj[gkey][qkey] = quest.stage;
            }
          }
        }
      }
      return obj;
    },
    loadGame(data) {
      if (data !== undefined) {
        for (const [gkey, general] of Object.entries(data)) {
          for (const [qkey, questStage] of Object.entries(general)) {
            store.commit("general/updateQuestKey", { general: gkey, quest: qkey, key: "stage", value: questStage });
            store.dispatch("general/giveReward", { general: gkey, quest: qkey });
          }
        }
      }
    },
  },
  "modules/horde/achievement": {
    maxZone: {
      value: () => store.state.stat.horde_maxZone.total,
      default: 1,
      cap: 30,
      milestones: (lvl) => lvl * 10 + 10,
      relic: { 7: "ultimateGuide", 11: "crackedSafe" },
    },
    maxZoneSpeedrun: {
      value: () => store.state.stat.horde_maxZoneSpeedrun.total,
      default: 1,
      cap: 10,
      milestones: (lvl) => lvl * 5 + 10,
      relic: { 8: "dumbbell" },
    },
    totalDamage: {
      value: () => store.state.stat.horde_totalDamage.total,
      milestones: (lvl) => Math.pow(lvl * 250 + 7500, lvl) * buildNum(10, "K"),
      relic: { 6: "newBackpack" },
    },
    maxDamage: {
      value: () => store.state.stat.horde_maxDamage.total,
      milestones: (lvl) => Math.pow(lvl * 250 + 7500, lvl) * 10,
      relic: { 3: "burningSkull" },
    },
    bone: {
      value: () => store.state.stat.horde_bone.total,
      milestones: (lvl) => Math.pow(2, getSequence(10, lvl) - 10) * buildNum(1, "M"),
      relic: { 2: "forgottenShield" },
    },
    monsterPart: {
      value: () => store.state.stat.horde_monsterPart.total,
      milestones: (lvl) => Math.pow(16, lvl) * 50,
      relic: { 3: "energyDrink", 5: "bandage" },
    },
    soulCorrupted: {
      value: () => store.state.stat.horde_soulCorrupted.total,
      milestones: (lvl) => Math.pow(7 + lvl, lvl) * 1000,
      relic: { 4: "luckyDice" },
    },
    maxCorruptionKill: {
      value: () => store.state.stat.horde_maxCorruptionKill.total,
      display: "percent",
      milestones: (lvl) => lvl + 1,
    },
    maxMastery: { value: () => store.state.stat.horde_maxMastery.total, milestones: (lvl) => lvl + 1 },
    totalMastery: {
      value: () => store.state.stat.horde_totalMastery.total,
      milestones: (lvl) => Math.round((lvl + 1) * 25 * (lvl * 0.2 + 1)),
    },
    unlucky: {
      value: () => store.state.stat.horde_unlucky.total,
      secret: true,
      display: "boolean",
      cap: 1,
      milestones: () => 1,
    },
  },
  "modules/horde/area/loveIsland": {
    unlock: "hordeAreaLoveIsland",
    icon: "mdi-heart-multiple",
    color: "babypink",
    zones: {
      sign_4: { x: -3.25, y: 5.5, unlockedBy: null, type: "sign" },
      1: { x: -0.7, y: 5, unlockedBy: null, type: "regular", difficulty: 78, enemyType: ["seal", "guineaPig"] },
      2: {
        x: -3.5,
        y: 2.5,
        unlockedBy: "1",
        type: "regular",
        difficulty: 81,
        enemyType: ["seal", "guineaPig", "puppy"],
      },
      3: { x: -6.25, y: -0.25, unlockedBy: "2", type: "regular", difficulty: 84, enemyType: ["guineaPig", "puppy"] },
      4: { x: -7, y: -3.5, unlockedBy: "3", type: "regular", difficulty: 87, enemyType: ["puppy", "rabbit"] },
      5: {
        x: -5.25,
        y: -5.5,
        unlockedBy: "4",
        type: "regular",
        difficulty: 90,
        enemyType: ["guineaPig", "puppy", "rabbit"],
      },
      6: { x: -3, y: -6, unlockedBy: "5", type: "regular", difficulty: 93, enemyType: ["rabbit", "kitten"] },
      7: {
        x: -1,
        y: -4.5,
        unlockedBy: "6",
        type: "regular",
        difficulty: 96,
        enemyType: ["seal", "rabbit", "puppy", "kitten"],
      },
      8: { x: 0, y: -2.5, unlockedBy: "7", type: "regular", difficulty: 99, enemyType: ["puppy", "kitten"] },
      9: {
        x: 1,
        y: -4.5,
        unlockedBy: "8",
        type: "regular",
        difficulty: 102,
        enemyType: ["seal", "guineaPig", "kitten"],
      },
      10: { x: 3, y: -6, unlockedBy: "9", type: "regular", difficulty: 105, enemyType: ["puppy", "rabbit", "kitten"] },
      11: { x: 5.25, y: -5.5, unlockedBy: "10", type: "regular", difficulty: 108, enemyType: ["kitten", "piglet"] },
      12: { x: 7, y: -3.5, unlockedBy: "11", type: "regular", difficulty: 111, enemyType: ["piglet", "guineaPig"] },
      13: { x: 6.25, y: -0.25, unlockedBy: "12", type: "regular", difficulty: 114, enemyType: ["seal", "panda"] },
      14: {
        x: 3.5,
        y: 2.5,
        unlockedBy: "13",
        type: "regular",
        difficulty: 117,
        enemyType: ["piglet", "panda", "koala"],
      },
      boss_1: {
        x: 0,
        y: 3.6,
        unlockedBy: "14",
        type: "boss",
        difficulty: 120,
        boss: ["mina"],
        reward: "hordeEndOfContent",
      },
      endless: {
        x: 0.7,
        y: 5,
        unlockedBy: "14",
        type: "endless",
        difficulty: 120,
        enemyType: ["seal", "guineaPig", "puppy", "rabbit", "kitten", "piglet", "panda", "koala"],
      },
    },
    decoration: [
      { x: 0, y: 3.75, rotate: 0, icon: "mdi-seat", size: 2 },
      { x: -8.5, y: 1.2, rotate: 0, icon: "mdi-home-variant", size: 3 },
      { x: -8.5, y: 1.9, rotate: -20, icon: "mdi-dog", size: 0.75 },
      { x: -6, y: 2.2, rotate: 0, icon: "mdi-dog-side", size: 1 },
      { x: -8, y: 3.2, rotate: -30, icon: "mdi-bone", size: 0.6 },
      { x: -7.6, y: 3.5, rotate: 20, icon: "mdi-bone", size: 0.5 },
      { x: -7.9, y: -1, rotate: 70, icon: "mdi-tennis-ball", size: 0.4 },
      { x: 0.4, y: -6.3, rotate: 0, icon: "mdi-inbox", size: 2 },
      { x: 0.4, y: -6.45, rotate: 0, icon: "mdi-cat", size: 1 },
      { x: -7.5, y: -5.7, rotate: 0, icon: "mdi-grass", size: 1.25 },
      { x: -7.4, y: -6.35, rotate: 15, icon: "mdi-rabbit-variant", size: 0.7 },
      { x: -8.7, y: -4, rotate: 0, icon: "mdi-rabbit", size: 0.8 },
      { x: -8, y: -3.83, rotate: 70, icon: "mdi-carrot", size: 0.6 },
      { x: 6.6, y: -6.1, rotate: 0, icon: "mdi-pig-variant", size: 0.6 },
      { x: 8.5, y: -6.4, rotate: 0, icon: "mdi-pig-variant", size: 0.65 },
      { x: 7.7, y: -5.5, rotate: 0, icon: "mdi-pig-variant", size: 0.8 },
      { x: 8.4, y: -5.33, rotate: 70, icon: "mdi-carrot", size: 0.6 },
      { x: 7, y: 3.1, rotate: 0, icon: "mdi-palm-tree", size: 2.5 },
      { x: 7.4, y: 2, rotate: 40, icon: "mdi-koala", size: 1 },
      { x: 8.1, y: -1, rotate: 0, icon: "mdi-panda", size: 1.2 },
      { x: 8.1, y: 0, rotate: 0, icon: "mdi-package", size: 1.5 },
    ],
  },
  "modules/horde/area/monkeyJungle": {
    unlock: "hordeAreaMonkeyJungle",
    icon: "mdi-temple-hindu",
    color: "teal",
    zones: {
      1: {
        x: 8,
        y: -2,
        unlockedBy: null,
        type: "regular",
        difficulty: 33,
        enemyType: ["strongMonkey", "monkeyWizard_1"],
      },
      2: {
        x: 5,
        y: -4,
        unlockedBy: "1",
        type: "regular",
        difficulty: 36,
        enemyType: ["strongMonkey", "monkeyWizard_1"],
      },
      3: {
        x: 3,
        y: -5.5,
        unlockedBy: "2",
        type: "regular",
        difficulty: 38,
        enemyType: ["monkeyWizard_1", "monkeyWizard_2", "monkeyWizard_3", "monkeyDefender"],
      },
      4: {
        x: 2,
        y: -3,
        unlockedBy: "2",
        type: "regular",
        difficulty: 39,
        enemyAmount: 150,
        enemyType: ["strongMonkey", "angryMonkey", "dartMonkey", "monkeyMonk"],
      },
      5: {
        x: 0,
        y: -5,
        unlockedBy: "3",
        type: "regular",
        difficulty: 40,
        enemyType: ["monkeyWizard_1", "monkeyWizard_2", "monkeyWizard_3", "monkeyDefender"],
      },
      6: {
        x: -2,
        y: -3.5,
        unlockedBy: ["4", "5"],
        type: "regular",
        difficulty: 43,
        enemyType: ["angryMonkey", "monkeyWizard_2"],
      },
      7: {
        x: -5,
        y: -4,
        unlockedBy: "6",
        type: "regular",
        difficulty: 46,
        enemyType: ["dartMonkey", "monkeyWizard_3"],
      },
      8: {
        x: -6,
        y: -0.5,
        unlockedBy: "7",
        type: "regular",
        difficulty: 49,
        enemyType: ["strongMonkey", "angryMonkey", "monkeyWizard_1", "monkeyWizard_2"],
      },
      9: {
        x: -8,
        y: 1,
        unlockedBy: "8",
        type: "regular",
        difficulty: 51,
        enemyAmount: 150,
        enemyType: ["strongMonkey", "angryMonkey", "dartMonkey", "monkeyMonk"],
      },
      10: {
        x: -4,
        y: -1.5,
        unlockedBy: "8",
        type: "regular",
        difficulty: 52,
        enemyType: ["monkeyWizard_1", "monkeyWizard_2", "monkeyWizard_3", "monkeyDefender"],
      },
      11: {
        x: -7.5,
        y: 4,
        unlockedBy: "9",
        type: "regular",
        difficulty: 56,
        enemyAmount: 50,
        enemyType: ["strongMonkey", "angryMonkey", "dartMonkey", "monkeyMonk"],
      },
e: "regular",
        difficulty: 55keyDefender"],
      },
      13: {
        x: -4,
        y: 3,
        unlockedBy: ["11", "12"],
        type: "regular",
        difficulty: 58,
        enemyAmount: 150,
        enemyType: ["angryMonkey", "dartMonkey", "monkeyWizard_2", "monkeyWizard_3"],
      },
      14: {
        x: -0.5,
        y: 4,
        unlockedBy: "13",
        type: "regular",
        difficulty: 62,
        enemyType: ["strongMonkey", "dartMonkey", "monkeyWizard_1", "monkeyWizard_3"],
      },
      15: {
        x: 2,
        y: 6,
        unlockedBy: "14",
        type: "regular",
        difficulty: 64,
        enemyType: ["strongMonkey", "angryMonkey", "dartMonkey", "monkeyMonk"],
      },
      16: {
        x: 3.5,
        y: 1.5,
        unlockedBy: "14",
        type: "regular",
        difficulty: 66,
        enemyType: ["monkeyWizard_1", "monkeyWizard_2", "monkeyWizard_3", "monkeyDefender"],
      },
      17: {
        x: 5,
        y: 5,
        unlockedBy: "15",
        type: "regular",
        difficulty: 67,
        enemyType: ["strongMonkey", "angryMonkey", "dartMonkey", "monkeyMonk"],
      },
      18: {
        x: 7.5,
        y: 2,
        unlockedBy: ["16", "17"],
        type: "regular",
        difficulty: 69,
        enemyType: ["angryMonkey", "dartMonkey", "monkeyWizard_2", "monkeyWizard_3"],
      },
      19: {
        x: 2.5,
        y: -0.5,
        unlockedBy: "18",
        type: "regular",
        difficulty: 72,
        enemyType: ["strongMonkey", "angryMonkey", "dartMonkey", "monkeyWizard_1", "monkeyWizard_2", "monkeyWizard_3"],
      },
      boss_1: {
        x: -1,
        y: -1.5,
        unlockedBy: "19",
        type: "boss",
        difficulty: 75,
        boss: ["chriz1", "chriz2"],
        reward: "hordeAreaLoveIsland",
      },
      endless: {
        x: 4,
        y: -2,
        unlockedBy: "19",
        type: "endless",
        difficulty: 75,
        enemyType: ["strongMonkey", "angryMonkey", "dartMonkey", "monkeyWizard_1", "monkeyWizard_2", "monkeyWizard_3"],
      },
    },
    decoration: [
      { x: 8.2, y: -3.4, rotate: 0, icon: "mdi-tent", size: 2 },
      { x: 9, y: -1.4, rotate: 0, icon: "mdi-campfire", size: 1 },
      { x: 4.8, y: -6, rotate: 0, icon: "mdi-palm-tree", size: 1.2 },
      { x: 5.6, y: -6.4, rotate: 0, icon: "mdi-tree", size: 1 },
      { x: 7, y: -5.5, rotate: 0, icon: "mdi-palm-tree", size: 1.8 },
      { x: 7.3, y: -6.25, rotate: 0, icon: "mdi-koala", size: 0.5 },
      { x: 8.1, y: -6.6, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: 9.3, y: -6.2, rotate: 0, icon: "mdi-palm-tree", size: 1.4 },
      { x: 8.9, y: -5.7, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: 5.8, y: -4.4, rotate: 0, icon: "mdi-grass", size: 0.6 },
      {otate: 0, icon: "mdi-palm-tree", size x: 2.6, y: -6.3, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: -5, y: -6.1, rotate: 0, icon: "mdi-palm-tree", size: 1.6 },
      { x: -3, y: -5.5, rotate: 0, icon: "mdi-palm-tree", size: 2.5 },
      { x: -3.85, y: -5.55, rotate: 0, icon: "mdi-spider-thread", size: 0.5 },
      { x: -1.25, y: -5.8, rotate: 0, icon: "mdi-tree", size: 1.1 },
      { x: -9.5, y: -6.5, rotate: 0, icon: "mdi-tree", size: 1 },
      { x: -7, y: -6, rotate: 0, icon: "mdi-tree", size: 1.45 },
      { x: -4, y: -4.2, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: -7.2, y: -4.6, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: -8.5, y: -5, rotate: 0, icon: "mdi-elephant", size: 1.1 },
      { x: -7.4, y: -3.5, rotate: 0, icon: "mdi-elephant", size: 1.25 },
      { x: -9, y: -4.2, rotate: 0, icon: "mdi-elephant", size: 0.8 },
      { x: -8.5, y: -3.2, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: -9.4, y: -2.4, rotate: 0, icon: "mdi-palm-tree", size: 1.3 },
      { x: -9.7, y: -0.7, rotate: 0, icon: "mdi-tree", size: 1.1 },
      { x: -7.8, y: -1.2, rotate: 0, icon: "mdi-tree", size: 1.3 },
      { x: -6.1, y: -2.7, rotate: 0, icon: "mdi-tree", size: 1.2 },
      { x: -6.35, y: -1, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: -8.9, y: 0.8, rotate: 0, icon: "mdi-palm-tree", size: 1.5 },
      { x: -9.5, y: 2, rotate: 0, icon: "mdi-palm-tree", size: 1 },
      { x: -8.7, y: 2.5, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: -8.3, y: 3.4, rotate: 0, icon: "mdi-palm-tree", size: 1.2 },
      { x: -9.7, y: 3.7, rotate: 0, icon: "mdi-tortoise", size: 0.5 },
      { x: -5.5, y: 1.5, rotate: 0, icon: "mdi-volcano", size: 2 },
      { x: -6.7, y: 1, rotate: 0, icon: "mdi-tree", size: 1 },
      { x: -6.6, y: 2.7, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: -4.4, y: -0.1, rotate: 0, icon: "mdi-palm-tree", size: 1.2 },
      { x: -3.7, y: 1.3, rotate: 0, icon: "mdi-palm-tree", size: 1 },
      { x: -4, y: -2.5, rotate: 0, icon: "mdi-palm-tree", size: 1.35 },
      { x: -2.8, y: -2.8, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: -0.5, y: -1.8, rotate: 0, icon: "mdi-palm-tree", size: 0.8 },
      { x: -1, y: -2.3, rotate: 0, icon: "mdi-tree", size: 0.8 },
      { x: -1.5, y: -1.9, rotate: 0, icon: "mdi-palm-tree", size: 0.8 },
      { x: -1.7, y: -1.2, rotate: 0, icon: "mdi-palm-tree", size: 0.8 },
      { x: -1.2, y: -0.7, rotate: 0, icon: "mdi-palm-tree", size: 0.8 },
      { x: -0.6, y: -0.9, rotate: 0, icon: "mdi-grass", size: 0.5 },
      { x: 1.4, y: -2.1, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: 3.8, y: -0.9, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: 1.7, y: 1, rotate: 0, icon: "mdi-palm-tree", size: 1.2 },
      { x: -1, y: 2.1, rotate: 0, icon: "mdi-palm-tree", size: 1 },
      { x: -0.5, y: 2.6, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: 4, y: 2.8, rotate: 0, icon: "mdi-palm-tree", size: 1.3 },
      { x: 1.2, y: 3.9, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: 2.75, y: 4.6, rotate: 0, icon: "mdi-kangaroo", size: 0.75 },
      { x: 6.6, y: 0.8, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: 4.7, y: 6, rotate: 0, icon: "mdi-palm-tree", size: 1.1 },
      { x: 8.6, y: 3.5, rotate: 0, icon: "mdi-palm-tree", size: 1.6 },
      { x: 7.3, y: 4.2, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: 8.1, y: 6.3, rotate: 0, icon: "mdi-snake", size: 0.5 },
      { x: 9.5, y: 5.6, rotate: 0, icon: "mdi-grass", size: 0.6 },
      { x: -9.9, y: 6.25, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -9.9, y: 7, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -9.05, y: 6.25, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -9.05, y: 7, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -8.2, y: 6, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -8.2, y: 6.9, rotate: 0, icon: "mdi-shark-fin", size: 1 },
      { x: -7.35, y: 6.25, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -7.35, y: 7, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -7.35, y: 5.75, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -6.5, y: 6.25, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -6.5, y: 7, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -6.5, y: 5.75, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -5.65, y: 6.25, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -5.65, y: 7, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -5.65, y: 5.75, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -5.65, y: 5.5, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -4.8, y: 6.25, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -4.8, y: 7, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -4.8, y: 5.75, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -4.8, y: 5.5, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -3.95, y: 6.25, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.95, y: 7, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.95, y: 5.75, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -3.95, y: 5.5, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -3.1, y: 6.25, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.1, y: 7, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.1, y: 5.75, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -2.25, y: 6.25, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -2.25, y: 7, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -1.4, y: 7, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -1.4, y: 6.5, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -0.55, y: 7.25, rotate: 0, icon: "mdi-wave", size: 1 },
      { x: -9.2, y: 5.45, rotate: 0, icon: "mdi-palm-tree", size: 1 },
      { x: -5, y: 4.85, rotate: 0, icon: "mdi-palm-tree", size: 1.2 },
      { x: -3.2, y: 5.2, rotate: 0, icon: "mdi-palm-tree", size: 1 },
      { x: -0.4, y: 6.6, rotate: 0, icon: "mdi-palm-tree", size: 1.1 },
    ],
  },
  "modules/horde/area/warzone": {
    unlock: null,
    icon: "mdi-sign-caution",
    color: "orange",
    zones: {
      1: { x: -9.5, y: 1.5, unlockedBy: null, type: "regular", difficulty: 0, enemyType: ["soldier_1", "officer_1"] },
      2: { x: -8, y: -1, unlockedBy: "1", type: "regular", difficulty: 3, enemyType: ["soldier_1", "officer_1"] },
      3: {
        x: -5,
        y: -2,
        unlockedBy: "2",
        type: "regular",
        difficulty: 6,
        enemyType: ["soldier_1", "soldier_2", "soldier_3", "officer_1", "officer_2", "officer_3"],
      },
      4: {
        x: -3,
        y: -4,
        unlockedBy: "3",
        type: "regular",
        difficulty: 9,
        enemyType: ["soldier_1", "soldier_2", "soldier_3", "officer_1", "officer_2", "officer_3"],
      },
      sign_1: { x: -4.25, y: -5.25, unlockedBy: "4", type: "sign" },
      5: {
        x: -1,
        y: -5,
        unlockedBy: "4",
        type: "regular",
        difficulty: 12,
        enemyType: ["soldier_1", "soldier_2", "soldier_3", "hunter"],
      },
      6: {
        x: 4,
        y: -4.5,
        unlockedBy: "5",
        type: "regular",
        difficulty: 15,
        enemyType: ["soldier_1", "soldier_2", "soldier_3", "officer_1"],
      },
      7: {
        x: 6,
        y: -2,
        unlockedBy: "6",
        type: "regular",
        difficulty: 18,
        enemyType: ["officer_1", "officer_2", "officer_3", "sniper"],
      },
      sign_2: { x: 7.5, y: -2.5, unlockedBy: "7", type: "sign" },
      8: {
        x: 7,
        y: 1.5,
        unlockedBy: "7",
        type: "regular",
        difficulty: 21,
        enemyType: ["officer_1", "officer_2", "officer_3", "soldier_1"],
      },
      9: {
        x: 5.5,
        y: 4,
        unlockedBy: "8",
        type: "regular",
        difficulty: 24,
        enemyType: ["soldier_1", "soldier_2", "soldier_3", "officer_1", "officer_2", "officer_3"],
      },
      10: {
        x: 2,
        y: 2,
        unlockedBy: "9",
        type: "regular",
        difficulty: 27,
        enemyType: ["soldier_1", "officer_1", "hunter", "sniper"],
      },
      sign_3: { x: 2.5, y: 0.5, unlockedBy: "10", type: "sign" },
      boss_1: {
        x: 0,
        y: 0,
        unlockedBy: "10",
        type: "boss",
        difficulty: 30,
        boss: ["ohilio_guard1", "ohilio_guard2", "ohilio"],
        reward: "hordeAreaMonkeyJungle",
      },
      endless: {
        x: -1,
        y: 5,
        unlockedBy: "10",
        type: "endless",
        difficulty: 30,
        enemyType: ["soldier_1", "soldier_2", "soldier_3", "officer_1", "officer_2", "officer_3", "hunter", "sniper"],
      },
    },
    decoration: [
      { x: 0, y: -0.5, rotate: 0, icon: "mdi-tent", size: 3 },
      { x: -8, y: 5, rotate: 0, icon: "mdi-forest", size: 3 },
      { x: -6.5, y: 3, rotate: 0, icon: "mdi-forest", size: 2.25 },
      { x: 4, y: -2, rotate: 0, icon: "mdi-pine-tree-variant", size: 1.9 },
      { x: -2, y: -5.5, rotate: 0, icon: "mdi-truck-cargo-container", size: 1.2 },
      { x: -8, y: 1, rotate: 0, icon: "mdi-flag-variant", size: 1.75 },
      { x: -6, y: -2.2, rotate: 160, icon: "mdi-pistol", size: 0.75 },
      { x: -5, y: -2.5, rotate: 110, icon: "mdi-magazine-pistol", size: 0.5 },
      { x: 1.5, y: -4.75, rotate: 0, icon: "mdi-bridge", size: 1.5 },
      { x: 6.5, y: -2.6, rotate: 80, icon: "mdi-magazine-rifle", size: 0.5 },
      { x: 6.5, y: 5, rotate: 0, icon: "mdi-truck", size: 1.3 },
      { x: 5.55, y: 5.25, rotate: 270, icon: "mdi-ammunition", size: 0.5 },
      { x: 5.6, y: 4.85, rotate: 0, icon: "mdi-ammunition", size: 0.45 },
      { x: 5.1, y: 5.1, rotate: 20, icon: "mdi-ammunition", size: 0.7 },
      { x: 1.9, y: -7.15, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: 1.65, y: -6.4, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: 1.5, y: -5.65, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: 1.5, y: -4, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: 1.3, y: -3.25, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: 0.9, y: -2.5, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: 0, y: -2.1, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -0.9, y: -2.3, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -1.8, y: -2.2, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -2.7, y: -1.8, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.2, y: -1.05, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.5, y: -0.4, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.6, y: 0.35, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.7, y: 1.1, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.4, y: 1.85, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.2, y: 2.6, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.5, y: 3.35, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -3.6, y: 4.1, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -4, y: 4.85, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -4.5, y: 5.6, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -4.8, y: 6.35, rotate: 0, icon: "mdi-waves", size: 1 },
      { x: -4.9, y: 7.1, rotate: 0, icon: "mdi-waves", size: 1 },
    ],
  },
  "modules/horde/battlePass": {
    1: newUpgrade,
    2: {
      icon: "mdi-bow-arrow",
      color: "light-green",
      effect: [{ name: "hordeClassArcher", type: "unlock", value: true }],
    },
    3: newUpgrade,
    5: {
      icon: "mdi-wizard-hat",
      color: "deep-purple",
      effect: [{ name: "hordeClassMage", type: "unlock", value: true }],
    },
    7: newPrestigeUpgrade,
    8: newUpgrade,
    10: newPrestigeUpgrade,
    12: newPrestigeUpgrade,
    14: newUpgrade,
    15: { icon: "mdi-shield", color: "blue-grey", effect: [{ name: "hordeClassKnight", type: "unlock", value: true }] },
    16: newPrestigeUpgrade,
    18: newUpgrade,
    20: newPrestigeUpgrade,
    24: newUpgrade,
    25: { icon: "mdi-cached", color: "pink", effect: [{ name: "hordeAutocast", type: "base", value: 1 }] },
    27: newPrestigeUpgrade,
    30: { icon: "mdi-necklace", color: "cyan", effect: [{ name: "hordeHeirloomAmount", type: "mult", value: 2 }] },
    31: newUpgrade,
    33: newPrestigeUpgrade,
    35: { icon: "mdi-pirate", color: "orange", effect: [{ name: "hordeClassPirate", type: "unlock", value: true }] },
    40: {
      icon: "mdi-star",
      color: "light-blue",
      effect: [{ name: "hordeSkillPointsPerLevel", type: "base", value: 1 }],
    },
    42: newUpgrade,
    45: newPrestigeUpgrade,
    50: { icon: "mdi-treasure-chest", color: "red", effect: [{ name: "hordeMaxTrinkets", type: "base", value: 1 }] },
    55: newUpgrade,
    60: { icon: "mdi-billiards-rack", color: "teal", effect: [{ name: "hordeShardChance", type: "mult", value: 3 }] },
    65: newPrestigeUpgrade,
    70: newUpgrade,
    75: { icon: "mdi-treasure-chest", color: "wooden", effect: [{ name: "hordeMaxItems", type: "base", value: 1 }] },
    80: {
      icon: "mdi-star",
      color: "light-blue",
      effect: [{ name: "hordeSkillPointsPerLevel", type: "base", value: 1 }],
    },
  },
  "modules/horde/boss": {
    ohilio_guard1: {
      attack: 0.15,
      health: 150,
      textShadow: "1px 1px 2px palevioletred, 0 0 25px lightpink, 0 0 5px pink",
      sigil: { shotgun_gun: 3, war_bandage: 3 },
      stats: {},
    },
    ohilio_guard2: {
      attack: 0.6125,
      health: 45,
      textShadow: "1px 1px 2px palevioletred, 0 0 25px lightpink, 0 0 5px pink",
      sigil: { rifle_gun: 3, war_grenade: 2 },
      stats: {},
    },
    ohilio: {
      attack: 0.01,
      health: 0.01,
      textShadow: "1px 1px 2px palevioletred, 0 0 25px lightpink, 0 0 5px pink",
      sigil: { ohilio_megagun: 1 },
      stats: {},
    },
    mina: {
      attack: 0.5,
      health: 87.5,
      textShadow: "1px 1px 2px palevioletred, 0 0 25px lightpink, 0 0 5px pink",
      sigil: { mina_charm: 1 },
      stats: { toxic_base: 0.03, execute_base: 0.2 },
    },
    chriz1: {
      attack: 0.375,
      health: 42.5,
      textShadow: "1px 1px 2px blue",
      sigil: { chriz_magicMissile: 1, chriz_fireball: 1, chriz_iceBlast: 1, chriz_lightningStrike: 1, chriz_heal: 1 },
      stats: { magicConversion_base: 4, physicTaken_mult: 0.01, magicTaken_mult: 1.75 },
    },
    chriz2: {
      attack: 0.5,
      health: 50,
      textShadow: "1px 1px 2px red",
      sigil: {},
      stats: { critChance_base: 0.35, critMult_base: 3, physicTaken_mult: 1.75, magicTaken_mult: 0.01 },
    },
  },
  "modules/horde/card": {
    feature: {
      prefix: "HO",
      reward: [
        { name: "hordeAttack", type: "mult", value: (lvl) => lvl * 0.03 + 1 },
        { name: "hordeHealth", type: "mult", value: (lvl) => lvl * 0.03 + 1 },
      ],
      shinyReward: [{ name: "hordePrestigeIncome", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
      powerReward: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.06, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.06, lvl) },
        { name: "hordePrestigeIncome", type: "mult", value: (lvl) => Math.pow(1.05, lvl) },
      ],
      unlock: "hordeFeature",
    },
    collection: {
      dangerousWeapons: { reward: [{ name: "hordeAttack", type: "mult", value: 1.35 }] },
      supplyAndSupport: {
        reward: [
          { name: "hordeHealth", type: "mult", value: 1.35 },
          { name: "currencyFarmVegetableGain", type: "mult", value: 1.25 },
        ],
      },
      againstTheCorruption: { reward: [{ name: "currencyHordeCorruptedFleshGain", type: "mult", value: 1.5 }] },
    },
    pack: {
      rookieOnTheBattlefield: {
        unlock: "hordeItems",
        amount: 3,
        price: 20,
        content: {
          "HO-0001": 2.6,
          "HO-0002": 0.45,
          "HO-0003": 1.25,
          "HO-0004": 0.92,
          "HO-0005": 1.55,
          "HO-0006": 1.36,
          "HO-0007": 0.6,
          "HO-0008": 0.8,
          "HO-0009": 0.88,
          "HO-0010": 0.4,
          "HO-0011": 0.48,
          "HO-0012": 2.1,
          "HO-0013": 1.6,
          "HO-0014": 0.77,
        },
      },
      spiritualSuccess: {
        unlock: "hordePrestige",
        amount: 4,
        price: 65,
        content: {
          "HO-0003": 1.25,
          "HO-0004": 0.92,
          "HO-0005": 1.55,
          "HO-0006": 1.36,
          "HO-0009": 0.88,
          "HO-0010": 0.8,
          "HO-0011": 0.96,
          "HO-0012": 2.1,
          "HO-0013": 1.6,
          "HO-0014": 0.77,
          "HO-0015": 1.2,
          "HO-0016": 1.3,
          "HO-0017": 1.8,
          "HO-0018": 1.6,
          "HO-0019": 0.75,
          "HO-0020": 0.84,
          "HO-0021": 1.05,
          "HO-0022": 1.5,
          "HO-0023": 0.43,
          "HO-0024": 0.7,
          "HO-0026": 0.9,
        },
      },
      oldMemories: {
        unlock: "hordeHeirlooms",
        amount: 2,
        price: 50,
        content: {
          "HO-0007": 1.2,
          "HO-0010": 0.8,
          "HO-0011": 0.96,
          "HO-0019": 1.5,
          "HO-0020": 1.68,
          "HO-0021": 2.1,
          "HO-0022": 3.75,
          "HO-0024": 1.4,
          "HO-0026": 1.8,
          "HO-0027": 1.15,
          "HO-0028": 2,
          "HO-0030": 2.3,
        },
      },
      taintedWorld: {
        unlock: "hordeItemMastery",
        amount: 6,
        price: 225,
        content: {
          "HO-0023": 0.72,
          "HO-0024": 1.2,
          "HO-0025": 1.3,
          "HO-0026": 1.55,
          "HO-0027": 1.15,
          "HO-0028": 2,
          "HO-0029": 1.1,
          "HO-0030": 2.3,
          "HO-0031": 3.5,
          "HO-0032": 2.1,
          "HO-0033": 0.9,
          "HO-0034": 1.22,
          "HO-0035": 1.58,
          "HO-0036": 1.18,
          "HO-0037": 1.4,
          "HO-0038": 0.5,
          "HO-0039": 0.77,
          "HO-0040": 1.36,
          "HO-0041": 0.22,
        },
      },
    },
    card: cardList,
  },
  "modules/horde/enemyType": {
    // warzone
    soldier_1: { attack: 1.75, health: 50, sigil: { rifle_gun: 1 } },
    soldier_2: { attack: 1.75, health: 45, sigil: { rifle_gun: 1, war_grenade: 1 } },
    soldier_3: { attack: 1.6, health: 50, sigil: { rifle_gun: 1, war_bandage: 1 } },
    officer_1: { attack: 1, health: 80, sigil: { pistol_gun: 1 } },
    officer_2: { attack: 1, health: 72.5, sigil: { pistol_gun: 1, war_grenade: 1 } },
    officer_3: { attack: 0.9, health: 80, sigil: { pistol_gun: 1, war_bandage: 1 } },
    hunter: { attack: 1.2, health: 55, sigil: { shotgun_gun: 1, war_grenade: 2, war_bandage: 2 } },
    sniper: { attack: 1.5, health: 40, stats: { critChance_base: 0.25, critMult_base: 0.5 }, sigil: { sniper_gun: 1 } }, // monkey jungle
    strongMonkey: { attack: 2.5, health: 40, stats: { physicTaken_mult: 1.25, magicTaken_mult: 0.75 }, sigil: {} },
    angryMonkey: {
      attack: 1.7,
      health: 35,
      stats: { physicTaken_mult: 1.25, magicTaken_mult: 0.75, critChance_base: 0.4, critMult_base: 1.25 },
      sigil: {},
    },
    dartMonkey: {
      attack: 1.8,
      health: 45,
      stats: { physicTaken_mult: 1.25, magicTaken_mult: 0.75 },
      sigil: { monkey_dart: 1 },
    },
    monkeyWizard_1: {
      attack: 1.75,
      health: 50,
      stats: { physicTaken_mult: 0.75, magicTaken_mult: 1.25 },
      sigil: { monkey_fire: 1 },
    },
    monkeyWizard_2: {
      attack: 1.75,
      health: 50,
      stats: { physicTaken_mult: 0.75, magicTaken_mult: 1.25 },
      sigil: { monkey_ice: 1 },
    },
    monkeyWizard_3: {
      attack: 1.75,
      health: 50,
      stats: { physicTaken_mult: 0.75, magicTaken_mult: 1.25 },
      sigil: { monkey_lightning: 1 },
    },
    monkeyDefender: { attack: 2, health: 50, stats: { physicTaken_mult: 0.1, magicTaken_mult: 1.5 }, sigil: {} },
    monkeyMonk: { attack: 2, health: 50, stats: { physicTaken_mult: 1.5, magicTaken_mult: 0.1 }, sigil: {} }, // love island
    puppy: { attack: 1.4, health: 60, sigil: { cute_bark: 1, cute_bite: 1 } },
    kitten: { attack: 2.8, health: 30, sigil: { cute_claws: 1 } },
    seal: { attack: 1.6, health: 60, sigil: { cute_ram: 1 } },
    piglet: { attack: 0.8, health: 90, sigil: { cute_ram: 1, cute_eatCarrot: 1 } },
    panda: { attack: 2.5, health: 35, sigil: { cute_ram: 2 } },
    koala: { attack: 2.2, health: 40, sigil: { cute_kick: 1, cute_bite: 1 } },
    rabbit: { attack: 1.1, health: 70, sigil: { cute_kick: 1, cute_eatCarrot: 1 } },
    guineaPig: { attack: 1.6, health: 70, sigil: {} },
  },
  "modules/horde/equipment": {
    dagger: {
      findZone: 0,
      found: true,
      price(lvl) {
        return Math.pow(2, lvl - 1) * 10;
      },
      stats(lvl) {
        return [{ isPositive: true, type: "base", name: "hordeAttack", value: lvl * 4 + 6 }];
      },
      active(lvl) {
        return [{ type: "buff", value: 40, effect: [{ type: "base", name: "hordeAttack", value: lvl * 5 + 30 }] }];
      },
      activeType: "combat",
      cooldown: () => 300,
      icon: "mdi-knife-military",
      activeIcon: "mdi-knife-military",
      activeColor: "red",
    },
    shirt: {
      findZone: 0,
      found: true,
      price(lvl) {
        return Math.pow(2, lvl - 1) * 10;
      },
      stats(lvl) {
        return [{ isPositive: true, type: "base", name: "hordeHealth", value: lvl * 800 + 1200 }];
      },
      active() {
        return [{ type: "heal", value: 0.225, int: 0.01 }];
      },
      activeType: "combat",
      cooldown: () => 80,
      icon: "mdi-tshirt-v",
      activeIcon: "mdi-medical-bag",
      activeColor: "green",
    },
    guardianAngel: {
      findZone: 5,
      findChance: 1 / buildNum(10, "K"),
      price(lvl) {
        return Math.pow(10, lvl - 1) * 100;
      },
      cap: 5,
      stats() {
        return [{ isPositive: true, type: "base", name: "hordeRevive", value: 1 }];
      },
      active() {
        return [{ type: "reviveAll", value: null }];
      },
      activeType: "combat",
      cooldown: (lvl) => SECONDS_PER_HOUR * 8 - lvl * 1800,
      icon: "mdi-cross",
      activeIcon: "mdi-flare",
      activeColor: "yellow",
    },
    milkCup: {
      findZone: 6,
      findChance: 1 / 2000,
      price(lvl) {
        return Math.pow(4, lvl - 1) * 20;
      },
      cap: 9,
      stats() {
        return [{ isPositive: true, type: "mult", name: "currencyHordeBoneGain", value: 1.2 }];
      },
      active(lvl) {
        return [{ type: "bone", value: 2.3 + lvl * 0.15 }];
      },
      activeType: "utility",
      cooldown: () => 90,
      icon: "mdi-cup",
      activeIcon: "mdi-bone",
      activeColor: "lighter-grey",
    },
    starShield: {
      findZone: 8,
      findChance: 1 / 4000,
      price(lvl) {
        return Math.pow(16, getSequence(1, lvl - 1)) * 80;
      },
      cap: 4,
      stats(lvl) {
        return [{ isPositive: true, type: "base", name: "hordeDivisionShield", value: lvl + 2 }];
      },
      active() {
        return [{ type: "stun", value: 8 }];
      },
      activeType: "combat",
      cooldown: () => 25,
      icon: "mdi-shield-star",
      activeIcon: "mdi-octagram-outline",
      activeColor: "blue",
    },
    longsword: {
      findZone: 10,
      findChance: 1 / 8000,
      price(lvl) {
        return Math.pow(4, lvl - 1) * 40;
      },
      cap: 5,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeCritChance", value: 0.3 },
          { isPositive: true, type: "base", name: "hordeCritMult", value: 0.25 },
        ];
      },
      active(lvl) {
        return [{ type: "damagePhysic", value: 7.5, str: 0.1, canCrit: 0.1 * lvl }];
      },
      activeType: "combat",
      cooldown: () => 35,
      icon: "mdi-sword",
      activeIcon: "mdi-sword",
      activeColor: "orange",
    },
    boots: {
      findZone: 12,
      findChance: 1 / buildNum(14, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * 75;
      },
      stats(lvl) {
        return [{ isPositive: true, type: "base", name: "hordeFirstStrike", value: lvl * 0.1 + 2.4 }];
      },
      active() {
        return [
          { type: "damageMagic", value: 4.5, int: 0.08 },
          { type: "heal", value: 0.03, int: 0.002 },
        ];
      },
      activeType: "combat",
      cooldown: () => 16,
      icon: "mdi-shoe-cleat",
      activeIcon: "mdi-shoe-cleat",
      activeColor: "light-blue",
    },
    clover: {
      findZone: 14,
      findChance: 1 / buildNum(20, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * 100;
      },
      stats(lvl) {
        return [{ isPositive: true, type: "mult", name: "hordeItemChance", value: lvl * 0.05 + 1.7 }];
      },
      active() {
        return [{ type: "permanentStat", stat: "hordeItemChance_mult", value: 0.25 }];
      },
      activeType: "utility",
      cooldown: () => 7200,
      icon: "mdi-clover",
      activeIcon: "mdi-clover",
      activeColor: "light-green",
    },
    liver: {
      findZone: 15,
      findChance: 1 / buildNum(100, "K"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * 120;
      },
      cap: 11,
      stats() {
        return [{ isPositive: true, type: "mult", name: "currencyHordeMonsterPartGain", value: 1.2 }];
      },
      active(lvl) {
        return [{ type: "monsterPart", value: 9.75 + lvl * 0.25 }];
      },
      activeType: "utility",
      cooldown: () => 45,
      icon: "mdi-stomach",
      activeIcon: "mdi-stomach",
      activeColor: "cherry",
    },
    fireOrb: {
      findZone: 16,
      findChance: 1 / buildNum(25, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * 150;
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeAttack", value: lvl * 2 + 8 },
          { isPositive: true, type: "base", name: "hordeCritMult", value: 0.4 },
          { isPositive: false, type: "base", name: "hordeMagicConversion", value: 0.5 },
        ];
      },
      active() {
        return [
          { type: "damageMagic", value: 13.5, int: 0.18 },
          { type: "buff", value: 20, effect: [{ type: "base", name: "hordeCritChance", value: 0.5 }] },
        ];
      },
      activeType: "combat",
      cooldown: () => 78,
      icon: "mdi-fire-circle",
      activeIcon: "mdi-fire",
      activeColor: "deep-orange",
    },
    campfire: {
      findZone: 18,
      findChance: 1 / buildNum(35, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * 200;
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeHealth", value: lvl * 500 + 1000 },
          { isPositive: true, type: "base", name: "hordeRecovery", value: 0.04 },
        ];
      },
      active() {
        return [
          { type: "heal", value: 0.65, int: 0.02 },
          { type: "buff", value: 210, effect: [{ type: "base", name: "hordeRecovery", value: 0.15 }] },
        ];
      },
      activeType: "combat",
      cooldown: () => 1800,
      icon: "mdi-campfire",
      activeIcon: "mdi-campfire",
      activeColor: "orange-red",
    },
    snowflake: {
      findZone: 20,
      findChance: 1 / buildNum(45, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * 300;
      },
      stats(lvl) {
        return [
          { isPositive: false, type: "mult", name: "hordeAttack", value: 1 / 1.6 },
          { isPositive: true, type: "mult", name:"hordeHealth", value: lvl * 800 + 6200 },
 type: "removeAttack", value: 0.4 }];
      },
      activeType: "combat",
      cooldown: () => 1200,
      icon: "mdi-snowflake",
      activeIcon: "mdi-snowflake",
      activeColor: "light-blue",
    },
    oppressor: {
      findZone: 22,
      findChance: 1 / buildNum(55, "K"),
      price(lvl) {
        return Math.pow(6, lvl - 1) * 360;
      },
      cap: 5,
      stats() {
        return [{ isPositive: true, type: "base", name: "hordeEnemyActiveStart", value: 0.5 }];
      },
      active() {
        return [{ type: "silence", value: 10 }];
      },
      activeType: "combat",
      cooldown: (lvl) => 80 - lvl * 5,
      icon: "mdi-robot-angry",
      activeIcon: "mdi-emoticon-devil",
      activeColor: "pale-purple",
    },
    meatShield: {
      findZone: 23,
      findChance: 1 / buildNum(60, "K"),
      price(lvl) {
        return Math.pow(3, lvl - 1) * 400;
      },
      cap: 6,
      stats(lvl) {
        return [
          { isPositive: true, type: "mult", name: "hordePhysicTaken", value: 1 / (lvl * 0.1 + 1.15) },
          { isPositive: false, type: "base", name: "hordeMagicTaken", value: 0.3 },
          { isPositive: false, type: "base", name: "hordeBioTaken", value: 0.3 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [{ type: "buff", value: 5, effect: [{ type: "mult", name: "hordePhysicTaken", value: 0 }] }];
      },
      activeType: "combat",
      cooldown: () => 54,
      icon: "mdi-food-steak",
      activeIcon: "mdi-octagram-outline",
      activeColor: "pale-red",
    },
    corruptEye: {
      findZone: 25,
      findChance: 1 / buildNum(300, "K"),
      price(lvl) {
        return Math.pow(10, lvl - 1) * 5000;
      },
      cap: 5,
      stats() {
        return [{ isPositive: true, type: "base", name: "hordeMinibossTime", value: -20 }];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          { type: "damageBio", value: 4.25 + lvl * 0.25, int: 0.1 },
          { type: "poison", value: 0.2, int: 0.01 },
        ];
      },
      activeType: "combat",
      cooldown: () => 30,
      icon: "mdi-eye",
      activeIcon: "mdi-laser-pointer",
      activeColor: "purple",
    },
    wizardHat: {
      findZone: 27,
      findChance: 1 / buildNum(80, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * 1500;
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeAttack", value: lvl * 3 + 29 },
          { isPositive: t      active() {
        return [{ type: "damageMagic() => 125,
      icon: "mdi-wizard-hat",
      activeIcon: "mdi-shimmer",
      activeColor: "deep-purple",
    },
    redStaff: {
      findZone: 30,
      findChance: 1 / buildNum(100, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * 2500;
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeAttack", value: lvl * 3 + 27 },
          { isPositive: true, type: "base", name: "hordeFirstStrike", value: lvl * 0.05 + 0.7 },
        ];
      },
      active() {
        return [{ type: "permanentStat", stat: "hordeAttack_mult", value: 0.1 }];
      },
      activeType: "utility",
      cooldown: () => 2700,
      icon: "mdi-magic-staff",
      activeIcon: "mdi-pentagram",
      activeColor: "red",
    },
    brokenStopwatch: {
      findZone: 31,
      findChance: 1 / buildNum(25, "K"),
      price(lvl) {
        return Math.pow(6, lvl - 1) * 3000;
      },
      cap: 5,
      stats() {
        return [{ isPositive: false, type: "mult", name: "hordeNostalgia", value: 0 }];
      },
      active(lvl) {
        return [{ type: "stun", value: 7 + lvl }];
      },
      activeType: "combat",
      cooldown: () => 60,
      icon: "mdi-timer",
      activeIcon: "mdi-timer",
      activeColor: "skyblue",
    },
    marblePillar: {
      findZone: 33,
      findChance: 1 / buildNum(125, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * 4000;
      },
      cap: 16,
      stats(lvl) {
        return [
          { isPositive: false, type: "mult", name: "hordeMagicAttack", value: 0.25 },
          { isPositive: true, type: "mult", name: "hordeMagicTaken", value: 1 / (lvl * 0.05 + 2.2) },
          { isPositive: true, type: "base", name: "hordeDivisionShield", value: 2 },
        ];
      },
      active() {
        return [
          { type: "maxdamagePhysic", value: 0.05, str: 0.0004 },
          { type: "divisionShield", value: 8 },
          { type: "stun", value: 3 },
        ];
      },
      activeType: "combat",
      cooldown: () => 44,
      icon: "mdi-pillar",
      activeIcon: "mdi-pillar",
      activeColor: "pale-yellow",
    },
    rainbowStaff: {
      findZone: 35,
      findChance: 1 / buildNum(450, "K"),
      price(lvl) {
        return Math.pow(3, lvl - 1) * 6000;
      },
      cap: 11,
      stats() {
        return [
          { isPositive: false, type: "mult", name: "hordeAttack", value: 1 / 1.15 },
          { isPositive: false, type: "base", name: "hordeMagicConversion", value: 1 },
          { isPositive: false, type: "base", name: "hordeBioConversion", value: 1 },
        ];
      },
      active(lvl) {
        return [
          { type: "damagePhysic", value: lvl * 0.05 + 1.75 },
          { type: "damageMagic", value: lvl * 0.05 + 1.75 },
          { type: "damageBio", value: lvl * 0.05 + 1.75 },
        ];
      },
      activeType: "combat",
      cooldown: () => 25,
      icon: "mdi-magic-staff",
      activeIcon: "mdi-looks",
      activeColor: "pink",
    },
    toxin: {
      findZone: 37,
      findChance: 1 / buildNum(160, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * 7000;
      },
      cap: 6,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeToxic", value: 0.02 },
          { isPositive: false, type: "base", name: "hordeBioConversion", value: 0.5 },
        ];
      },
      active(lvl) {
        return [{ type: "poison", value: lvl * 0.01 + 0.19, int: 0.01 }];
      },
      activeType: "combat",
      cooldown: () => 16,
      icon: "mdi-bottle-tonic-skull",
      activeIcon: "mdi-bottle-tonic-skull",
      activeColor: "light-green",
    },
    cleansingSpring: {
      findZone: 40,
      findChance: 1 / buildNum(200, "K"),
      price(lvl) {
        return Math.pow(5, lvl - 1) * buildNum(10, "K");
      },
      cap: 5,
      stats() {
        return [{ isPositive: true, type: "base", name: "hordeStunResist", value: 1 }];
      },
      active() {
        return [{ type: "removeStun", value: null }];
      },
      activeType: "combat",
      usableInStun: true,
      cooldown: (lvl) => 32 - lvl * 2,
      icon: "mdi-waterfall",
      activeIcon: "mdi-water-opacity",
      activeColor: "cyan",
    },
    toxicSword: {
      findZone: 43,
      findChance: 1 / buildNum(275, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(12, "K");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeAttack", value: lvl * 10 + 130 },
          { isPositive: false, type: "mult", name: "hordeCritMult", value: 0.8 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [
          { type: "damageBio", value: 2.6, int: 0.05 },
          { type: "poison", value: 0.1, int: 0.005 },
        ];
      },
      activeType: "combat",
      cooldown: () => 10,
      icon: "mdi-sword",
      activeIcon: "mdi-bottle-tonic-skull",
      activeColor: "green",
    },
    luckyCharm: {
      findZone: 45,
      findChance: 1 / buildNum(1.4, "M"),
      price(lvl) {
        return Math.pow(10, lvl - 1) * buildNum(15, "K");
      },
      stats(lvl) {
        return [
          { isPositive: false, type: "mult", name: "currencyHordeSoulCorruptedGain", value: 1 / 1.5 },
          { isPositive: true, type: "base", name: "hordeHeirloomChance", value: lvl * 0.001 + 0.004 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [
          { type: "heal", value: 1 },
          { type: "antidote", value: 1 },
          { type: "removeStun", value: null },
        ];
      },
      activeType: "combat",
      usableInStun: true,
      cooldown: () => 1200,
      icon: "mdi-necklace",
      activeIcon: "mdi-flare",
      activeColor: "lime",
    },
    mailbreaker: {
      findZone: 46,
      findChance: 1 / buildNum(375, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(18, "K");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeAttack", value: lvl * 2 + 18 },
          { isPositive: true, type: "base", name: "hordeShieldbreak", value: 1 },
        ];
      },
      active() {
        return [
          { type: "removeDivisionShield", value: 1 },
          { type: "stun", value: 15 },
        ];
      },
      activeType: "combat",
      cooldown: () => 750,
      icon: "mdi-sword",
      activeIcon: "mdi-circle-off-outline",
      activeColor: "pale-blue",
    },
    club: {
      findZone: 47,
      findChance: 1 / buildNum(400, "K"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(20, "K");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeAttack", value: lvl * 10 + 110 },
          { isPositive: true, type: "mult", name: "hordeAttack", value: lvl * 0.01 + 1.19 },
          { isPositive: false, type: "mult", name: "hordeCritChance", value: 0 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [{ type: "damagePhysic", value: 7.35, str: 0.12 }];
      },
      activeType: "combat",
      cooldown: () => 26,
      icon: "mdi-mace",
      activeIcon: "mdi-mace",
      activeColor: "cherry",
    },
    goldenStaff: {
      findZone: 49,
      findChance: 1 / buildNum(500, "K"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(24, "K");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeSpellblade", value: lvl * 0.05 + 0.55 },
          { isPositive: false, type: "base", name: "hordeMagicConversion", value: 0.5 },
        ];
      },
      active() {
        return [
          { type: "damagePhysic", value: 0.8, str: 0.04 },
          { type: "damageMagic", value: 3.4, int: 0.08 },
        ];
      },
      activeType: "combat",
      cooldown: () => 10,
      icon: "mdi-magic-staff",
      activeIcon: "mdi-sword",
      activeColor: "amber",
    },
    mace: {
      findZone: 51,
      findChance: 1 / buildNum(650, "K"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(28, "K");
      },
      cap: 5,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeCritChance", value: 0.2 },
          { isPositive: false, type: "base", name: "hordePhysicConversion", value: 2.5 },
          { isPositive: true, type: "base", name: "hordePhysicAttack", value: 0.15 },
        ];
      },
      active(lvl) {
        return [
          { type: "damagePhysic", value: lvl * 0.25 + 4.5, str: 0.1 },
          { type: "stun", value: 3 },
        ];
      },
      activeType: "combat",
      cooldown: () => 18,
      icon: "mdi-mace",
      activeIcon: "mdi-mace",
      activeColor: "red",
    },
    scissors: {
      findZone: 53,
      findChance: 1 / buildNum(850, "K"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(35, "K");
      },
      cap: 5,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeCutting", value: 0.02 },
          { isPositive: false, type: "base", name: "hordeBioConversion", value: 0.5 },
        ];
      },
      active(lvl) {
        return [
          { type: "damagePhysic", value: lvl * 0.2 + 2.3, str: 0.04 },
          { type: "maxdamageBio", value: 0.05, int: 0.0004 },
        ];
      },
      activeType: "combat",
      cooldown: () => 15,
      icon: "mdi-content-cut",
      activeIcon: "mdi-content-cut",
      activeColor: "blue-grey",
    },
    cat: {
      findZone: 55,
      findChance: 1 / buildNum(4.25, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(45, "K");
      },
      stats() {
        return [
          { isPositive: false, type: "mult", name: "hordeHealth", value: 1 / 3 },
          { isPositive: true, type: "base", name: "hordeRevive", value: 8 },
          { isPositive: true, type: "mult", name: "hordeRecovery", value: 4 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [{ type: "bone", value: 51 + lvl * 3 }];
      },
      activeType: "utility",
      cooldown: () => 6 * SECONDS_PER_HOUR,
      icon: "mdi-cat",
      activeIcon: "mdi-cat",
      activeColor: "lighter-grey",
    },
    healthyFruit: {
      findZone: 57,
      findChance: 1 / buildNum(1.1, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(55, "K");
      },
      stats() {
        return [
          { isPositive: false, type: "mult", name: "hordeCritChance", value: 0.5 },
          { isPositive: true, type: "mult", name: "hordeBioTaken", value: 1 / 2.5 },
          { isPositive: true, type: "base", name: "hordeRecovery", value: 0.03 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          { type: "heal", value: 0.01 * lvl + 0.44, int: 0.02 },
          { type: "removeStun", value: null },
          { type: "stun", value: 20 },
        ];
      },
      activeType: "combat",
      usableInStun: true,
      cooldown: () => 220,
      icon: "mdi-fruit-cherries",
      activeIcon: "mdi-fruit-cherries",
      activeColor: "cherry",
    },
    deadBird: {
      findZone: 60,
      findChance: 1 / buildNum(1.3, "M"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(85, "K");
      },
      cap: 8,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeToxic", value: 0.125 },
          { isPositive: false, type: "mult", name: "hordeAttack", value: 0.25 },
          { isPositive: true, type: "base", name: "hordeBioAttack", value: 0.15 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          { type: "heal", value: 0.14 + lvl * 0.0075, int: 0.008 },
          { type: "buff", value: 12, effect: [{ type: "mult", name: "hordeToxic", value: 2 }] },
        ];
      },
      activeType: "combat",
      cooldown: () => 130,
      icon: "mdi-bird",
      activeIcon: "mdi-feather",
      activeColor: "skyblue",
    },
    shieldDissolver: {
      findZone: 61,
      findChance: 1 / buildNum(1.4, "M"),
      price(lvl) {
        return Math.pow(7, lvl - 1) * buildNum(90, "K");
      },
      cap: 6,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeShieldbreak", value: 3 },
          { isPositive: false, type: "mult", name: "hordeHealth", value: 1 / 1.1 },
          { isPositive: false, type: "mult", name: "hordeDivisionShield", value: 0 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [{ type: "removeDivisionShield", value: 0.3 }];
      },
      activeType: "combat",
      cooldown: (lvl) => 17 - lvl,
      icon: "mdi-shield-off",
      activeIcon: "mdi-shield-remove",
      activeColor: "deep-orange",
    },
    calmingPill: {
      findZone: 63,
      findChance: 1 / buildNum(1.5, "M"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(100, "K");
      },
      cap: 11,
      stats(lvl) {
        return [
          { isPositive: true, type: "bonus", name: "hordeCorruption", value: -0.09 - lvl * 0.01 },
          { isPositive: true, type: "base", name: "hordeNostalgia", value: 10 },
        ];
      },
      active() {
        return [
          { type: "removeAttack", value: 0.25 },
          { type: "stun", value: 50 },
        ];
      },
      activeType: "combat",
      cooldown: () => 3 * SECONDS_PER_HOUR,
      icon: "mdi-pill",
      activeIcon: "mdi-pill",
      activeColor: "pale-red",
    },
    cleansingFluid: {
      findZone: 65,
      findChance: 1 / buildNum(7.5, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(120, "K");
      },
      cap: 16,
      stats(lvl) {
        return [{ isPositive: true, type: "bonus", name: "hordeCorruption", value: -0.23 - lvl * 0.02 }];
      },
      active() {
        return [
          { type: "removeAttack", value: 0.1 },
          { type: "heal", value: 0.15, int: 0.007 },
        ];
      },
      activeType: "combat",
      cooldown: () => 65,
      icon: "mdi-bottle-tonic",
      activeIcon: "mdi-bottle-tonic",
      activeColor: "cyan",
    },
    forbiddenSword: {
      findZone: 67,
      findChance: 1 / buildNum(1.8, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(200, "K");
      },
      stats(lvlack", value: lvl * 15 + 210 },
          { isPositive: true, type: "base", name: "hordeCritChance", value: 0.25 },
          { isPositive: true, type: "base", name: "hordeCritMult", value: 0.4 },
          { isPositive: false, type: "mult", name: "hordeCorruption", value: 1.15 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [{ type: "damagePhysic", value: 6.66, str: 0.0666, int: 0.0666 }];
      },
      activeType: "combat",
      cooldown: () => 15,
      icon: "mdi-sword",
      activeIcon: "mdi-sword",
      activeColor: "deep-purple",
    },
    antidote: {
      findZone: 70,
      findChance: 1 / buildNum(2, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(250, "K");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeHealth", value: lvl * 600 + 8400 },
          { isPositive: true, type: "mult", name: "hordeBioTaken", value: 1 / 1.25 },
        ];
      },
      active() {
        return [{ type: "antidote", value: 1 }];
      },
      activeType: "combat",
      cooldown: () => 25,
      icon: "mdi-bottle-tonic-plus",
      activeIcon: "mdi-bottle-tonic-plus",
      activeColor: "light-blue",
    },
    corruptedBone: {
      findZone: 73,
      findChance: 1 / buildNum(2.2, "M"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(300, "K");
      },
      cap: 7,
      stats() {
        return [
          { isPositive: true, type: "mult", name: "currency "currencyHordeMonsterPartGain", value: 1.2 },
             ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [{ type: "bone", value: 11.5 + lvl * 0.5 }];
      },
      activeType: "utility",
      cooldown: () => 270,
      icon: "mdi-bone",
      activeIcon: "mdi-bone",
      activeColor: "pink-purple",
    },
    plaguebringer: {
      findZone: 75,
      findChance: 1 / buildNum(11, "M"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(400, "K");
      },
      cap: 5,
      stats() {
        return [{ isPositive: true, type: "mult", name: "hordeCorruption", value: 2 }];
      },
      active() {
        return [
          { type: "removeAttack", value: 0.8 },
          { type: "silence", value: 90 },
          {
            type: "buff",
            value: 300,
            effect: [
              { type: "base", name: "hordeCritChance", value: 0.75 },
              { type: "base", name: "hordeCritMult", value: 3 },
              { type: "base", name: "hordeSpellblade", value: 6.5 },
              { type: "base", name: "hordeCutting", value: 0.2 },
              { type: "base", name: "hordeShieldbreak", value: 15 },
              { type: "base", name: "hordeStunResist", value: 15 },
              { type: "base", name: "hordeRecovery", value: 0.25 },
            ],
          },
        ];
      },
      activeType: "combat",
      cooldown: (lvl) => SECONDS_PER_DAY - (lvl - 1) * SECONDS_PER_HOUR,
      icon: "mdi-magic-staff",
      activeIcon: "mdi-flare",
      activeColor: "black",
    },
    forbiddenShield: {
      findZone: 77,
      findChance: 1 / buildNum(2.7, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(500, "K");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeHealth", value: lvl * 750 + 6750 },
          { isPositive: true, type: "mult", name: "hordeHealth", value: 1.35 },
          { isPositive: true, type: "base", name: "hordeRevive", value: 1 },
          { isPositive: false, type: "mult", name: "hordeCorruption", value: 1.15 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [
          { type: "heal", value: 0.75, int: 0.03 },
          { type: "revive", value: 1 },
        ];
      },
      activeType: "combat",
      cooldown: () => 320,
      icon: "mdi-shield",
      activeIcon: "mdi-shield",
      activeColor: "deep-purple",
    },
    dangerShield: {
      findZone: 80,
      findChance: 1 / buildNum(3.1, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(550, "K");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeHealth", value: lvl * 400 + 4600 },
          { isPositive: true, type: "mult", name: "hordePhysicTaken", value: 1 / 1.2 },
          { isPositive: true, type: "base", name: "hordeDivisionShield", value: 1 },
        ];
      },
      active() {
        return [
          { type: "heal", value: 0.04, int: 0.002 },
          { type: "removeAttack", value: 0.02 },
          { type: "stun", value: 2 },
        ];
      },
      activeType: "combat",
      cooldown: () => 22,
      icon: "mdi-shield-alert",
      activeIcon: "mdi-alert-octagram",
      activeColor: "wooden",
    },
    forbiddenToxin: {
      findZone: 83,
      findChance: 1 / buildNum(3.5, "M"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(600, "K");
      },
      cap: 6,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeToxic", value: 0.05 },
          { isPositive: false, type: "mult", name: "hordeCorruption", value: 1.15 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [{ type: "poison", value: lvl * 0.04 + 0.16, int: 0.01 }];
      },
      activeType: "combat",
      cooldown: () => 20,
      icon: "mdi-bottle-tonic-skull",
      activeIcon: "mdi-bottle-tonic-skull",
      activeColor: "deep-purple",
    },
    glowingEye: {
      findZone: 85,
      findChance: 1 / buildNum(17.5, "M"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(750, "K");
      },
      cap: 10,
      stats() {
        return [
          { isPositive: true, type: "mult", name: "currencyHordeSoulCorruptedGain", value: 1.05 },
          { isPositive: true, type: "mult", name: "hordeHeirloomChance", value: 1.05 },
          { isPositive: false, type: "mult", name: "hordeCorruption", value: 1.15 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          { type: "maxdamageBio", value: 0.12, int: 0.001 },
          { type: "damageBio", value: 5 + lvl * 0.3 },
        ];
      },
      activeType: "combat",
      cooldown: () => 70,
      icon: "mdi-eye",
      activeIcon: "mdi-laser-pointer",
      activeColor: "pink",
    },
    experimentalVaccine: {
      findZone: 87,
      findChance: 1 / buildNum(7, "M"),
      price(lvl) {
        return Math.pow(20, lvl - 1) * buildNum(1, "M");
      },
      cap: 3,
      stats() {
        return [
          { isPositive: false, type: "mult", name: "hordeAttack", value: 1 / 1.5 },
          { isPositive: false, type: "mult", name: "hordeHealth", value: 1 / 1.5 },
          { isPositive: true, type: "mult", name: "hordeCorruption", value: 1 / 1.2 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          {
            type: "buff",
            value: lvl * 2 + 14,
            effect: [
              { type: "mult", name: "hordeAttack", value: 1.5 },
              { type: "mult", name: "hordeHealth", value: 1.5 },
            ],
          },
        ];
      },
      activeType: "combat",
      cooldown: () => 110,
      icon: "mdi-needle",
      activeIcon: "mdi-needle",
      activeColor: "cyan",
    },
    glasses: {
      findZone: 90,
      findChance: 1 / buildNum(9, "M"),
      price(lvl) {
        return Math.pow(5, lvl - 1) * buildNum(1.25, "M");
      },
      cap: 6,
      stats() {
        return [
          { isPositive: true, type: "mult", name: "hordeMagicTakePhysicTaken", value: 0.3 },
          { isPos  },
      masteryBoost: 0.25,
      active() {
        return [{ type: "buff", value: 5, effect: [{ type: "mult", name: "hordeMagicTaken", value: 0 }] }];
      },
      activeType: "combat",
      cooldown: (lvl) => 90 - lvl * 6,
      icon: "mdi-glasses",
      activeIcon: "mdi-magnify",
      activeColor: "pale-blue",
    },
    microscope: {
      findZone: 93,
      findChance: 1 / buildNum(12, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(1.5, "M");
      },
      cap: 6,
      stats() {
        return [
          { isPositive: true, type: "mult", name: "hordeBioTaken", value: 1 / 1.75 },
          { isPositive: false, type: "base", name: "hordePhysicTaken", value: 0.3 },
          { isPositive: false, type: "base", name: "hordeMagicTaken", value: 0.3 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [{ type: "buff", value: 5, effect: [{ type: "mult", name: "hordeBioTaken", value: 0 }] }];
      },
      activeType: "combat",
      cooldown: (lvl) => 90 - lvl * 6,
      icon: "mdi-microscope",
      activeIcon: "mdi-microscope",
      activeColor: "teal",
    },
    moltenShield: {
      findZone: 95,
      findChance: 1 / buildNum(60, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(1.8, "M");
      },
      stats(lvl) {
        return [
          { isPositive: false, type: "mult", name: "hordeHealth", value: 1 / 1.3 },
          { isPositive: true, type: "base", name: "hordeDivisionShield", value: lvl + 14 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [{ type: "permanentStat", stat: "hordeHealth_mult", value: 0.15 }];
      },
      activeType: "utility",
      cooldown: () => 3300,
      icon: "mdi-shield-half-full",
      activeIcon: "mdi-sun-wireless",
      activeColor: "orange-red",
    },
    cutter: {
      findZone: 97,
      findChance: 1 / buildNum(16, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(2.2, "M");
      },
      stats() {
        return [
          { isPositive: false, type: "mult", name: "hordeAttack", value: 1 / 2.5 },
          { isPositive: true, type: "base", name: "hordeCutting", value: 0.05 },
          { isPositive: false, type: "mult", name: "hordeRecovery", value: 0.5 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          { type: "maxdamageBio", value: 0.08, str: 0.0007 },
          { type: "damageBio", value: 1.68 + lvl * 0.02, int: 0.03 },
        ];
      },
      activeType: "combat",
      cooldown: () => 30,
      icon: "mdi-box-cutter",
      activeIcon: "mdi-box-cutter",
      activeColor: "wooden",
    },
    book: {
      findZone: 100,
      findChance: 1 / buildNum(20, "M"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(2.75, "M");
      },
      stats() {
        return [
          { isPositive: false, type: "mult", name: "hordeAttack", value: 0.5 },
          { isPositive: true, type: "mult", name: "hordeItemMasteryGain", value: 1.4 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          { type: "damageMagic", value: 3.18 + lvl * 0.02 },
          { type: "stun", value: 1 },
        ];
      },
      activeType: "combat",
      cooldown: () => 10,
      icon: "mdi-book",
      activeIcon: "mdi-book-alert",
      activeColor: "indigo",
    },
    chocolateMilk: {
      findZone: 107,
      findChance: 1 / buildNum(40, "M"),
      price(lvl) {
        return Math.pow(5, lvl - 1) * buildNum(4, "M");
      },
      cap: 11,
      stats(lvl) {
        return [
          { isPositive: true, type: "mult", name: "currencyHordeBoneGain", value: lvl * 0.01 + 1.29 },
          { isPositive: false, type: "mult", name: "currencyHordeMonsterPartGain", value: 1 / 1.5 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [{ type: "permanentStat", stat: "currencyHordeBoneGain_mult", value: 0.18 }];
      },
      activeType: "utility",
      cooldown: () => 4200,
      icon: "mdi-beer",
      activeIcon: "mdi-beer",
      activeColor: "brown",
    },
    bigHammer: {
      findZone: 114,
      findChance: 1 / buildNum(80, "M"),
      price(lvl) {
        return Math.pow(7, lvl - 1) * buildNum(7, "M");
      },
      stats(lvl) {
        return [
          { isPositive: false, type: "mult", name: "hordeAttack", value: 1 / 1.25 },
          { isPositive: true, type: "base", name: "hordeCritChance", value: 0.15 },
          { isPositive: true, type: "base", name: "hordeCritMult", value: lvl * 0.02 + 1.08 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [
          { type: "damagePhysic", value: 18.5 },
          { type: "stun", value: 8 },
          { type: "silence", value: 25 },
        ];
      },
      activeType: "combat",
      cooldown: () => 260,
      icon: "mdi-hammer",
      activeIcon: "mdi-hammer",
      activeColor: "pale-blue",
    },
    spookyPumpkin: {
      findZone: 121,
      findChance: 1 / buildNum(160, "M"),
      price(lvl) {
        return Math.pow(9, lvl - 1) * buildNum(12, "M");
      },
      cap: 6,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeStunResist", value: 4 },
          { isPositive: false, type: "mult", name: "hordeHealth", value: 1 / 1.25 },
          { isPositive: false, type: "base", name: "hordeMagicTaken", value: 0.75 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [
          { type: "heal", value: 0.1, int: 0.005 },
          { type: "antidote", value: 1 },
          { type: "removeStun", value: null },
        ];
      },
      activeType: "combat",
      usableInStun: true,
      cooldown: (lvl) => 53 - 3 * lvl,
      icon: "mdi-halloween",
      activeIcon: "mdi-pumpkin",
      activeColor: "orange",
    },
    strangeChemical: {
      findZone: 128,
      findChance: 1 / buildNum(320, "M"),
      price(lvl) {
        return Math.pow(5, lvl - 1) * buildNum(20, "M");
      },
      cap: 11,
      stats(lvl) {
        return [
          { isPositive: true, type: "mult", name: "currencyHordeMonsterPartGain", value: lvl * 0.01 + 1.29 },
          { isPositive: false, type: "mult", name: "currencyHordeBoneGain", value: 1 / 4 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [{ type: "permanentStat", stat: "currencyHordeMonsterPartGain_mult", value: 0.225 }];
      },
      activeType: "utility",
      cooldown: () => 18 * SECONDS_PER_HOUR,
      icon: "mdi-test-tube",
      activeIcon: "mdi-test-tube",
      activeColor: "pink-purple",
    },
    forbiddenHeartShield: {
      findZone: 135,
      findChance: 1 / buildNum(640, "M"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(35, "M");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeDivisionShield", value: lvl * 2 + 34 },
          { isPositive: true, type: "base", name: "hordeStunResist", value: 12 },
          { isPositive: false, type: "mult", name: "hordeCorruption", value: 1.15 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          { type: "heal", value: 0.12, int: 0.006 },
          { type: "divisionShield", value: lvl + 11 },
        ];
      },
      activeType: "combat",
      cooldown: () => 140,
      icon: "mdi-heart-half-full",
      activeIcon: "mdi-heart-pulse",
      activeColor: "deep-purple",
    },
    cloudStaff: {
      findZone: 142,
      findChance: 1 / buildNum(1.2, "B"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(60, "M");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeFirstStrike", value: lvl * 0.04 + 1.76 },
          { isPositive: true, type: "base", name: "hordeSpellblade", value: lvl * 0.01 + 0.49 },
          { isPositive: true, type: "base", name: "hordeDivisionShield", value: 2 },
        ];
      },
      active() {
        return [
          { type: "damageMagic", value: 3.65, int: 0.11 },
          { type: "divisionShield", value: 2 },
        ];
      },
      activeType: "combat",
      cooldown: () => 12,
      icon: "mdi-magic-staff",
      activeIcon: "mdi-cloud",
      activeColor: "skyblue",
    },
    secretWeapon: {
      findZone: 149,
      findChance: 1 / buildNum(2.4, "B"),
      price(lvl) {
        return Math.pow(8, lvl - 1) * buildNum(110, "M");
      },
      cap: 21,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeToxic", value: 0.1 },
          { isPositive: true, type: "base", name: "hordeCutting", value: 0.06 },
          { isPositive: false, type: "mult", name: "hordeRecovery", value: 0 },
          { isPositive: false, type: "mult", name: "hordeDivisionShield", value: 0 },
          { isPositive: false, type: "mult", name: "hordeRevive", value: 0 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          { type: "poison", value: 24, str: 0.25, int: 0.25 },
          { type: "silence", value: lvl + 29 },
          { type: "buff", value: 35, effect: [{ type: "base", name: "hordeCutting", value: 0.1 }] },
        ];
      },
      activeType: "combat",
      cooldown: () => 720,
      icon: "mdi-eyedropper",
      activeIcon: "mdi-virus",
      activeColor: "lime",
    },
    bomb: {
      findZone: 156,
      findChance: 1 / buildNum(4.8, "B"),
      price(lvl) {
        return Math.pow(5, lvl - 1) * buildNum(175, "M");
      },
      cap: 11,
      stats() {
        return [
          { isPositive: true, type: "mult", name: "hordeAttack", value: 1.5 },
          { isPositive: true, type: "mult", name: "hordeHealth", value: 1.35 },
          { isPositive: false, type: "mult", name: "currencyHordeBoneGain", value: 0 },
          { isPositive: false, type: "mult", name: "currencyHordeMonsterPartGain", value: 0 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [{ type: "damageMagic", value: 38, int: 0.75 }];
      },
      activeType: "combat",
      cooldown: (lvl) => 3090 - 90 * lvl,
      icon: "mdi-bomb",
      activeIcon: "mdi-bomb",
      activeColor: "red",
    },
    leechingStaff: {
      findZone: 163,
      findChance: 1 / buildNum(10, "B"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(320, "M");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeAttack", value: lvl * 3 + 112 },
          { isPositive: true, type: "base", name: "hordeRecovery", value: 0.03 },
        ];
      },
      active() {
        return [
          { type: "maxdamageBio", value: 0.125 },
          { type: "heal", value: 0.125 },
        ];
      },
      activeType: "combat",
      cooldown: () => 52,
      icon: "mdi-magic-staff",
      activeIcon: "mdi-swap-horizontal",
      activeColor: "light-green",
    },
    shatteredGem: {
      findZone: 170,
      findChance: 1 / buildNum(20, "B"),
      price(lvl) {
        return Math.pow(10, lvl - 1) * buildNum(550, "M");
      },
      stats(lvl) {
        return [
          { isPositive: false, type: "mult", name: "hordeHealth", value: 0.5 },
          { isPositive: true, type: "base", name: "hordeHeirloomChance", value: lvl * 0.001 + 0.009 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [{ type: "permanentStat", stat: "currencyHordeSoulCorruptedGain_mult", value: 0.03 }];
      },
      activeType: "utility",
      cooldown: () => 36 * SECONDS_PER_HOUR,
      icon: "mdi-rhombus-split",
      activeIcon: "mdi-rhombus",
      activeColor: "light-blue",
    },
    hourglass: {
      findZone: 177,
      findChance: 1 / buildNum(40, "B"),
      price(lvl) {
        return Math.pow(4, lvl - 1) * buildNum(975, "M");
      },
      cap: 11,
      stats() {
        return [{ isPositive: true, type: "base", name: "hordeHaste", value: 15 }];
      },
      active(lvl) {
        return [
          {
            t"base", name: "hordeHaste", value: 50 },
},
            ],
          },
        ];
      },
      activeType: "combat",
      cooldown: () => 20 * SECONDS_PER_MINUTE,
      icon: "mdi-timer-sand",
      activeIcon: "mdi-timer-sand-complete",
      activeColor: "pale-yellow",
    },
    glue: {
      findZone: 184,
      findChance: 1 / buildNum(80, "B"),
      price(lvl) {
        return Math.pow(8, lvl - 1) * buildNum(1.75, "B");
      },
      cap: 6,
      stats() {
        return [
          { isPositive: true, type: "mult", name: "hordeAttack", value: 1.35 },
          { isPositive: false, type: "base", name: "hordeHaste", value: -30 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          { type: "maxdamageBio", value: 0.3, int: 0.0025 },
          { type: "damageMagic", value: lvl * 0.5 + 7, int: 0.1 },
        ];
      },
      activeType: "combat",
      cooldown: () => 40,
      icon: "mdi-bottle-tonic",
      activeIcon: "mdi-liquid-spot",
      activeColor: "pale-green",
    },
    firework: {
      findZone: 191,
      findChance: 1 / buildNum(160, "B"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(3, "B");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeAttack", value: lvl * 2 + 68 },
          { isPositive: true, type: "base", name: "hordeCritChance", value: 0.2 },
          { isPositive: true, type: "base", name: "hordeToxic", value: 0.01 },
        ];
      },
      active() {
        return [
          { type: "damageBio", value: 18, int: 0.35 },
          { type: "poison", value: 2.75, int: 0.13 },
          { type: "buff", value: 15, effect: [{ type: "base", name: "hordeCritMult", value: 5.75 }] },
        ];
      },
      activeType: "combat",
      cooldown: () => 290,
      icon: "mdi-firework",
      activeIcon: "mdi-firework",
      activeColor: "pink-purple",
    },
    bowTie: {
      findZone: 198,
      findChance: 1 / buildNum(320, "B"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(5, "B");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeHealth", value: lvl * 400 + 8600 },
          { isPositive: true, type: "base", name: "hordeDivisionShield", value: lvl + 10 },
          { isPositive: false, type: "mult", name: "hordeRecovery", value: 0 },
        ];
      },
      masteryBoost: 0.25,
      active() {
        return [
          { type: "heal", value: 0.07, int: 0.003 },
          { type: "divisionShield", value: 10 },
        ];
      },
      activeType: "combat",
      cooldown: () => 28,
      icon: "mdi-bow-tie",
      activeIcon: "mdi-bow-tie",
      activeColor: "beige",
    },
    forbiddenStopwatch: {
      findZone: 205,
      findChance: 1 / buildNum(640, "B"),
      price(lvl) {
        return Math.pow(6, lvl - 1) * buildNum(8, "B");
      },
      cap: 6,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeHaste", value: 70 },
          { isPositive: false, type: "mult", name: "hordeCorruption", value: 1.15 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [{ type: "stun", value: lvl + 34 }];
      },
      activeIcon: "mdi-timer",
      activeColhance: 1 / buildNum(1.25, "T"),
      price(lvl) {
        return Math.pow(14, lvl - 1) * buildNum(12.5, "B");
      },
      cap: 5,
      stats() {
        return [{ isPositive: true, type: "mult", name: "hordeShardChance", value: 1.5 }];
      },
      active() {
        return [{ type: "permanentStat", stat: "hordeShardChance_mult", value: 0.35 }];
      },
      activeType: "utility",
      cooldown: (lvl) => (19 - lvl) * SECONDS_PER_HOUR,
      icon: "mdi-rotate-orbit",
      activeIcon: "mdi-rotate-orbit",
      activeColor: "teal",
    },
    blazingStaff: {
      findZone: 219,
      findChance: 1 / buildNum(2.5, "T"),
      price(lvl) {
        return Math.pow(25, lvl - 1) * buildNum(18, "B");
      },
      cap: 4,
      stats() {
        return [
          { isPositive: true, type: "mult", name: "hordeAttack", value: 2.5 },
          { isPositive: false, type: "mult", name: "hordeHealth", value: 0.5 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          { type: "damageMagic", value: lvl * 3 + 25, str: 0.6 },
          { type: "buff", value: 12, effect: [{ type: "mult", name: "hordeAttack", value: 1.4 }] },
        ];
    on: "mdi-magic-staff",
      activeIcon: "mdi-26,
      findChance: 1 / buildNum(5, "T"),
      price(lvl) {
        return Math.pow(25, lvl - 1) * buildNum(25, "B");
      },
      cap: 4,
      stats() {
        return [{ isPositive: true, type: "base", name: "hordeDefense", value: 0.004 }];
      },
      active() {
        return [
          {
            type: "buff",
            value: 8,
            effect: [
              { type: "mult", name: "hordePhysicTaken", value: 0.25 },
              { type: "mult", name: "hordeMagicTaken", value: 0.25 },
              { type: "mult", name: "hordeBioTaken", value: 0.25 },
            ],
          },
        ];
      },
      activeType: "combat",
      cooldown: (lvl) => 90 - lvl * 5,
      icon: "mdi-shield",
      activeIcon: "mdi-shield-plus",
      activeColor: "pale-blue",
    },
    armor: {
      findZone: 233,
      findChance: 1 / buildNum(10, "T"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(35, "B");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeHealth", value: lvl * 400 + buildNum(10.8, "K") },
          { isPositive: true, type: "base", name: "hordeDefense", value: 0.0025 },
        ];
      },
      active() {
        return [{ type: "divisionShield", value: 20 }];
      },
      activeType: "combat",
      cooldown: () => 55,
      icon: "mdi-tshirt-crew",
      activeIcon: "mdi-shield-half-full",
      activeColor: "indigo",
    },
    natureStone: {
      findZone: 240,
      findChance: 1 / buildNum(20, "T"),
      price(lvl) {
        return Math.pow(20, lvl - 1) * buildNum(50, "B");
      },
      cap: 5,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeRecovery", value: 0.01 },
          { isPositive: true, type: "base", name: "hordeHealing", value: 0.3 },
        ];
      },
      active(lvl) {
        return [
          { type: "maxdamageBio", value: 0.15, int: 0.0012 },
          { type: "heal", value: lvl * 0.04 + 0.3, int: 0.025 },
        ];
      },
      activeType: "combat",
      cooldown: () => 130,
      icon: "mdi-alpha-x-circle",
      activeIcon: "mdi-heart-circle",
      activeColor: "light-green",
    },
    evergrowingVine: {
      findZone: 247,
      findChance: 1 / buildNum(40, "T"),
      price(lvl) {
        return Math.pow(100, lvl - 1) * buildNum(75, "B");
      },
      cap: 3,
      stats() {
        return [
          { isPositive: true, type: "mult", name: "hordeHealth", value: 1.5 },
          { isPositive: true, type: "base", name: "hordeRecovery", value: 0.2 },
          { isPositive: false, type: "mult", name: "hordeDefense", value: 0 },
          { isPositive: false, type: "mult", name: "hordeDivisionShield", value: 0 },
          { isPositive: true, type: "tag", name: "hordePassiveRecovery", value: [0.1] },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [{ type: "buff", value: lvl * 3 + 21, effect: [{ type: "base", name: "hordeHealing", value: 0.25 }] }];
      },
      activeType: "combat",
      cooldown: () => 150,
      icon: "mdi-lasso",
      activeIcon: "mdi-heart-multiple",
      activeColor: "green",
    },
    energyDrink: {
      findZone: 254,
      findChance: 1 / buildNum(80, "T"),
      price(lvl) {
        return Math.pow(100, lvl - 1) * buildNum(140, "B");
      },
      cap: 3,
      stats() {
        return [
          { isPositive: true, type: "mult", name: "hordeHaste", value: 1.5 },
          { isPositive: false, type: "mult", name: "hordeCritMult", value: 0.5 },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [
          {
            type: "buff",
            value: lvl + 7,
            effect: [
              { type: "base", name: "hordeCritChance", value: 0.35 },
              { type: "base", name: "hordeCritMult", value: 0.8 },
            ],
          },
        ];
      },
      activeType: "combat",
      cooldown: () => 48,
      icon: "mdi-beer",
      activeIcon: "mdi-lightning-bolt",
      activeColor: "amber",
    },
    dragonheart: {
      findZone: 261,
      findChance: 1 / buildNum(160, "T"),
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(225, "B");
      },
      cap: 21,
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeRecovery", value: lvl * 0.001 + 0.039 },
          { isPositive: true, type: "base", name: "hordeDefense", value: 0.002 },
        ];
      },
      active() {
        return [{ type: "buff", value: 14, effect: [{ type: "base", name: "hordeDefense", value: 0.05 }] }];
      },
      activeType: "combat",
      cooldown: () => 160,
      icon: "mdi-heart",
      activeIcon: "mdi-heart",
      activeColor: "pink-purple",
    },
    prism: {
      findZone: 268,
      findChance: 1 / buildNum(320, "T"),
      price(lvl) {
        return Math.pow(12, lvl - 1) * buildNum(400, "B");
      },
      cap: 8,
      stats(lvl) {
        return [{ isPositive: true, type: "base", name: "currencyHordeMysticalShardCap", value: lvl }];
      },
      active() {
        return [
          { type: "maxdamageBio", value: 0.3, str: 0.002 },
          { type: "damagePhysic", value: 15, str: 0.32 },
          { type: "poison", value: 1.25, int: 0.06 },
        ];
      },
      activeCost: () => {
        return { mysticalShard: 1 };
      },
      activeType: "combat",
      cooldown: () => 330,
      icon: "mdi-mirror-variant",
      activeIcon: "mdi-mirror-variant",
      activeColor: "teal",
    },
    deathsword: {
      findZone: 275,
      findChance: 1 / buildNum(640, "T"),
      price(lvl) {
        return Math.pow(25, lvl - 1) * buildNum(700, "B");
      },
      cap: 5,
      stats() {
        return [{ isPositive: true, type: "base", name: "hordeExecute", value: 0.06 }];
      },
      active() {
        return [{ type: "buff", value: 5, effect: [{ type: "base", name: "hordeCutting", value: 0.15 }] }];
      },
      activeType: "combat",
      cooldown: (lvl) => 170 - 10 * lvl,
      icon: "mdi-sword",
      activeIcon: "mdi-skull",
      activeColor: "darker-grey",
    },
    needle: {
      findZone: 282,
      findChance: 1 / buildNum(1.25, "Qa"),
      price(lvl) {
        return Math.pow(25, lvl - 1) * buildNum(1.2, "T");
      },
      cap: 5,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeExecute", value: 0.04 },
          { isPositive: true, type: "base", name: "hordeCutting", value: 0.01 },
        ];
      },
      active() {
        return [{ type: "maxdamageBio", value: 0.45, str: 0.003 }];
      },
      activeType: "combat",
      activeCost: () => {
        return { health: 0.1 };
      },
      cooldown: (lvl) => 275 - 15 * lvl,
      icon: "mdi-nail",
      activeIcon: "mdi-nail",
      activeColor: "pale-purple",
    },
    mine: {
      findZone: 289,
      findChance: 1 / buildNum(2.5, "Qa"),
      price(lvl) {
        return Math.pow(8, lvl - 1) * buildNum(2, "T");
      },
      cap: 9,
      stats() {
        return [
          { isPositive: false, type: "mult", name: "hordeAttack", value: 1 / 1.25 },
          { isPositive: true, type: "base", name: "hordeCritChance", value: 0.5 },
          { isPositive: true, type: "base", name: "hordeHaste", value: 20 },
          { isPositive: true, type: "tag", name: "hordeActiveDamageCrit", value: [0.3] },
        ];
      },
      masteryBoost: 0.25,
      active(lvl) {
        return [{ type: "damagePhysic", value: lvl * 0.25 + 4.25, str: 0.13, canCrit: 1 }];
      },
      activeType: "combat",
      cooldown: () => 42,
      icon: "mdi-mine",
      activeIcon: "mdi-mine",
      activeColor: "deep-orange",
    },
    maskOfJoy: {
      findZone: 296,
      findChance: 1 / buildNum(5, "Qa"),
      price(lvl) {
        return Math.pow(25, lvl - 1) * buildNum(3.3, "T");
      },
      cap: 5,
      stats() {
        return [
          { isPositive: true, type: "base", name: "hordeCritChance", value: 0.15 },
          { isPositive: true, type: "base", name: "hordeHealing", value: 0.1 },
          { isPositive: true, type: "tag", name: "hordeActiveHealCrit", value: [0.1] },
        ];
      },
      active() {
        return [{ type: "heal", value: 0.1, int: 0.005, canCrit: 0.4 }];
      },
      activeType: "combat",
      cooldown: (lvl) => 275 - 15 * lvl,
      icon: "mdi-drama-masks",
      activeIcon: "mdi-drama-masks",
      activeColor: "pale-green",
    },
    pawn: {
      findZone: 50,
      findChance: 1 / buildNum(10, "M"),
      unlock: "hordeChessItems",
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(1, "M");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeAttack", value: lvl * 10 + 90 },
          { isPositive: true, type: "base", name: "hordeFirstStrike", value: 1.25 },
        ];
      },
      active() {
        return [{ type: "damagePhysic", value: 2.7, str: 0.08 }];
      },
      activeType: "combat",
      cooldown: () => 5,
      icon: "mdi-chess-pawn",
      activeIcon: "mdi-chess-pawn",
      activeColor: "beige",
    },
    knight: {
      findZone: 80,
      findChance: 1 / buildNum(100, "M"),
      unlock: "hordeChessItems",
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(4, "M");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeSpellblade", value: lvl * 0.1 + 0.4 },
          { isPositive: true, type: "base", name: "hordeDivisionShield", value: 7 },
        ];
      },
      active() {
        return [
          { type: "damageMagic", value: 4.15, int: 0.1 },
          { type: "stun", value: 2 },
        ];
      },
      activeType: "combat",
      cooldown: () => 12,
      icon: "mdi-chess-knight",
      activeIcon: "mdi-chess-knight",
      activeColor: "orange",
    },
    bishop: {
      findZone: 110,
      findChance: 1 / buildNum(1, "B"),
      unlock: "hordeChessItems",
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(16, "M");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeHealth", value: lvl * 500 + 7000 },
          { isPositive: true, type: "base", name: "hordeToxic", value: 0.01 },
          { isPositive: true, type: "base", name: "hordeCutting", value: 0.01 },
        ];
      },
      active() {
        return [
          { type: "maxdamageBio", value: 0.15, str: 0.0012 },
          { type: "poison", value: 0.2, int: 0.01 },
        ];
      },
      activeType: "combat",
      cooldown: () => 39,
      icon: "mdi-chess-bishop",
      activeIcon: "mdi-chess-bishop",
      activeColor: "green",
    },
    rook: {
      findZone: 140,
      findChance: 1 / buildNum(10, "B"),
      unlock: "hordeChessItems",
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(64, "M");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeCritChance", value: 0.05 },
          { isPositive: true, type: "base", name: "hordeCritMult", value: lvl * 0.02 + 0.58 },
        ];
      },
      active() {
        return [
          { type: "removeAttack", value: 0.12 },
          { type: "stun", value: 10 },
        ];
      },
      activeType: "combat",
      cooldown: () => 64,
      icon: "mdi-chess-rook",
      activeIcon: "mdi-chess-rook",
      activeColor: "brown",
    },
    queen: {
      findZone: 170,
      findChance: 1 / buildNum(100, "B"),
      unlock: "hordeChessItems",
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(256, "M");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeAttack", value: lvl * 2 + 28 },
          { isPositive: true, type: "base", name: "hordeHealth", value: lvl * 200 + 2800 },
          { isPositive: true, type: "base", name: "hordeFirstStrike", value: 0.6 },
          { isPositive: true, type: "base", name: "hordeToxic", value: 0.005 },
          { isPositive: false, type: "base", name: "hordeMagicConversion", value: 0.4 },
          { isPositive: false, type: "base", name: "hordeBioConversion", value: 0.4 },
        ];
      },
      active() {
        return [
          { type: "damagePhysic", value: 3.4 },
          { type: "damageMagic", value: 3.4 },
          { type: "damageBio", value: 3.4 },
          { type: "poison", value: 0.25 },
          { type: "heal", value: 0.1 },
          { type: "stun", value: 4 },
        ];
      },
      activeType: "combat",
      cooldown: () => 70,
      icon: "mdi-chess-queen",
      activeIcon: "mdi-chess-queen",
      activeColor: "indigo",
    },
    king: {
      findZone: 200,
      findChance: 1 / buildNum(1, "T"),
      unlock: "hordeChessItems",
      price(lvl) {
        return Math.pow(2, lvl - 1) * buildNum(1.024, "B");
      },
      stats(lvl) {
        return [
          { isPositive: true, type: "base", name: "hordeHealth", value: lvl * 2000 + 4000 },
          { isPositive: true, type: "base", name: "hordeRevive", value: 1 },
        ];
      },
      active(lvl) {
        return [
          { type: "heal", value: 1 },
          { type: "antidote", value: 1 },
          { type: "revive", value: 1 },
          { type: "stun", value: lvl + 24 },
        ];
      },
      activeType: "combat",
      cooldown: () => 540,
      icon: "mdi-chess-king",
      activeIcon: "mdi-chess-king",
      activeColor: "red",
    },
  },
  "modules/horde/fighterClass/adventurer": {
    icon: "mdi-bag-personal",
    baseStats: { attack: 5, health: 500, energy: 200, energyRegen: 1, mana: 120, manaRegen: 0.01 },
    exp: { base: 600, increment: 1.2 },
    skills: {
      energyConvert: {
        type: "passive",
        color: "amber",
        icon: "mdi-lightning-bolt",
        max: 1,
        effect: [
          { name: "hordeEnergyToStr", type: "tag", value: (lvl) => [lvl * 0.02] },
          { name: "hordeEnergyToEnergyReg", type: "tag", value: (lvl) => [lvl * 0.005] },
        ],
      },
      stab: {
        type: "active",
        color: "red",
        icon: "mdi-knife",
        max: 1,
        cooldown: () => 8,
        activeCost: () => {
          return { energy: 30 };
        },
        active() {
          return [{ type: "damagePhysic", value: 2, str: 0.1, int: 0.05 }];
        },
        activeType: "combat",
      },
      health: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 70 }],
      },
      strength: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeStrength", type: "base", value: (lvl) => lvl * 1.3 }],
      },
      energy: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeEnergy", type: "base", value: (lvl) => lvl * 40 }],
      },
      brawl: {
        type: "active",
        color: "orange",
        icon: "mdi-arm-flex",
        max: 5,
        cost: 20,
        cooldown: () => 60,
        activeCost: () => {
          return { energy: 140 };
        },
        active(lvl) {
          return [
            {
              type: "buff",
              value: 18,
              effect: [
                { type: "base", name: "hordeStrength", value: 10 * lvl },
                { type: "mult", name: "hordeAttack", value: 1.3 },
              ],
            },
          ];
        },
        activeType: "combat",
      },
      strength_2: {
        type: "stat",
        max: 15,
        cost: 10,
        effect: [{ name: "hordeStrength", type: "base", value: (lvl) => lvl * 1.5 }],
      },
      spark: {
        type: "active",
        color: "light-blue",
        icon: "mdi-flare",
        max: 5,
        cost: 20,
        cooldown: () => 6,
        activeCost: () => {
          return { mana: 12 };
        },
        active() {
          return [{ type: "damageMagic", value: 2.5, int: 0.35 }];
        },
        activeType: "combat",
      },
      intelligence: {
        type: "stat",
        max: 15,
        cost: 10,
        effect: [{ name: "hordeIntelligence", type: "base", value: (lvl) => lvl * 1.8 }],
      },
      smash: {
        type: "active",
        color: "brown",
        icon: "mdi-anvil",
        max: 5,
        cost: 20,
        cooldown: () => 22,
        activeCost: () => {
          return { energy: 60 };
        },
        active(lvl) {
          return [
            { type: "damagePhysic", value: 2.75 },
            { type: "stun", value: lvl + 5 },
          ];
        },
        activeType: "combat",
      },
      haste: {
        type: "stat",
        max: 15,
        cost: 10,
        effect: [{ name: "hordeHaste", type: "base", value: (lvl) => lvl * 4 }],
      },
      lootSearch: {
        type: "active",
        color: "light-green",
        icon: "mdi-sack",
        max: 5,
        cost: 20,
        cooldown: () => 300,
        activeCost: () => {
          return {};
        },
        active(lvl) {
          return [{ type: "blood", value: 9 + lvl }];
        },
        activeType: "utility",
      },
      damage: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeAttack", type: "base", value: (lvl) => lvl * 0.15 }],
      },
      energy_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeEnergy", type: "base", value: (lvl) => lvl * 40 }],
      },
      damage_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeAttack", type: "base", value: (lvl) => lvl * 0.15 }],
      },
      health_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 70 }],
      },
      recovery: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [
          { name: "hordeHealth", type: "base", value: (lvl) => lvl * 25 },
          { name: "hordeRecovery", type: "base", value: (lvl) => lvl * 0.008 },
        ],
      },
      combatHeal: {
        type: "active",
        color: "green",
        icon: "mdi-medication",
        max: 5,
        cost: 20,
        cooldown: () => 45,
        activeCost: () => {
          return { mana: 55 };
        },
        active(lvl) {
          return [{ type: "heal", value: lvl * 0.05 + 0.125, int: 0.004 }];
        },
        activeType: "combat",
      },
      energy_3: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeEnergy", type: "base", value: (lvl) => lvl * 40 }],
      },
      mana: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeMana", type: "base", value: (lvl) => lvl * 20 }],
      },
      blood: {
        type: "stat",
        max: 20,
        cost: 15,
        effect: [
          { name: "currencyHordeBloodGain", type: "mult", value: (lvl) => getSequence(3, lvl) * 0.05 + 1 },
          { name: "currencyHordeBloodCap", type: "mult", value: (lvl) => getSequence(3, lvl) * 0.05 + 1 },
        ],
      },
      courage: {
        type: "stat",
        max: 20,
        cost: 15,
        effect: [{ name: "currencyHordeCourageGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
      },
      supercharge: {
        type: "active",
        color: "amber",
        icon: "mdi-lightning-bolt",
        max: 5,
        cost: 20,
        cooldown: () => 22 * SECONDS_PER_HOUR,
        activeCost: () => {
          return {};
        },
        active(lvl) {
          return [{ type: "permanentStat", stat: "hordeEnergy_base", value: lvl * 5 + 5 }];
        },
        activeType: "utility",
      },
    },
    skillTree: [
      { isInnate: true, level: 0, items: ["energyConvert", "stab"] },
      { level: 1, items: ["health", "strength", "energy"] },
      {
        isChoice: true,
        level: 10,
        items: [
          ["brawl", "strength_2"],
          ["spark", "intelligence"],
          ["smash", "haste"],
        ],
      },
      { level: 20, items: ["lootSearch", "damage", "energy_2"] },
      { level: 30, items: ["damage_2", "health_2", "recovery"] },
      { level: 40, items: ["combatHeal", "energy_3", "mana"] },
      { isChoice: true, level: 50, items: [["blood"], ["courage"], ["supercharge"]] },
    ],
    quests: {
      stat: [
        { stat: "hordeHealth", type: "base", value: 1000 },
        { stat: "hordeIntelligence", type: "total", value: 20 },
        { stat: "hordeStrength", type: "total", value: 90 },
      ],
      zone: [
        { area: "warzone", zone: "1" },
        { area: "warzone", zone: "3" },
        { area: "warzone", zone: "5" },
        { area: "warzone", zone: "10" },
        { area: "monkeyJungle", zone: "7" },
        { area: "monkeyJungle", zone: "14" },
        { area: "loveIsland", zone: "1" },
        { area: "loveIsland", zone: "8" },
      ],
      level: [7, 15, 25, 40, 60, 80, 100, 125, 150, 175, 200],
      boss: [
        { boss: "ohilio", difficulty: 3 },
        { boss: "chriz2", difficulty: 5 },
        { boss: "mina", difficulty: 15 },
      ],
    },
  },
  "modules/horde/fighterClass/archer": {
    unlock: "hordeClassArcher",
    icon: "mdi-bow-arrow",
    baseStats: { attack: 7, health: 325, energy: 150, energyRegen: 1.25 },
    exp: { base: 720, increment: 1.22 },
    courageMult: 2,
    skills: {
      critMult: { type: "stat", max: 1, effect: [{ name: "hordeCritMult", type: "base", value: (lvl) => lvl * 1.75 }] },
      energyOnCrit: {
        type: "passive",
        color: "amber",
        icon: "mdi-lightning-bolt",
        max: 1,
        effect: [{ name: "hordeEnergyOnCrit", type: "tag", value: (lvl) => [lvl * 10] }],
      },
      longshot: {
        type: "active",
        color: "skyblue",
        icon: "mdi-arrow-projectile",
        max: 1,
        cooldown: () => 30,
        activeCost: () => {
          return { energy: 70 };
        },
        active() {
          return [{ type: "damagePhysic", value: 4.25, str: 0.65, canCrit: 0.75 }];
        },
        activeType: "combat",
      },
      eagleEye: {
        type: "active",
        color: "light-green",
        icon: "mdi-eye",
        max: 5,
        cost: 20,
        cooldown: () => 45,
        activeCost: () => {
          return { energy: 50 };
        },
        active(lvl) {
          return [
            { type: "buff", value: 12, effect: [{ type: "base", name: "hordeCritChance", value: lvl * 0.05 + 0.05 }] },
          ];
        },
        activeType: "combat",
      },
      strength: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeStrength", type: "base", value: (lvl) => lvl * 1.3 }],
      },
      critMult_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeCritMult", type: "base", value: (lvl) => lvl * 0.1 }],
      },
      fireArrows: {
        type: "active",
        color: "orange-red",
        icon: "mdi-fire",
        max: 5,
        cost: 20,
        cooldown: () => 90,
        activeCost: () => {
          return { energy: 110 };
        },
        active(lvl) {
          return [
            {
              type: "buff",
              value: 30,
              effect: [
                { type: "mult", name: "hordeAttack", value: lvl * 0.05 + 1.25 },
                { type: "base", name: "hordeMagicConversion", value: 1.75 },
              ],
            },
          ];
        },
        activeType: "combat",
      },
      poisonArrow: {
        type: "active",
        color: "lime",
        icon: "mdi-bottle-tonic-skull",
        max: 5,
        cost: 20,
        cooldown: () => 16,
        activeCost: () => {
          return { energy: 50 };
        },
        active(lvl) {
          return [{ type: "poison", value: lvl * 0.05 + 0.25, int: 0.01 }];
        },
        activeType: "combat",
      },
      critChance: {
        type: "stat",
        max: 5,
        cost: 20,
        effect: [{ name: "hordeCritChance", type: "base", value: (lvl) => lvl * 0.03 }],
      },
      intelligence: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeIntelligence", type: "base", value: (lvl) => lvl * 1.75 }],
      },
      healOnCrit: {
        type: "passive",
        color: "light-green",
        icon: "mdi-heart-plus",
        max: 1,
        cost: 50,
        effect: [{ name: "hordeHealOnCrit", type: "tag", value: (lvl) => [lvl * 0.03] }],
      },
      health: {
        type: "stat",
        max: 15,
        cost: 10,
        effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 65 }],
      },
      reduceCooldownOnCrit: {
        type: "passive",
        color: "pale-o
        effect: [{ name: "hordeRestoreCool    type: "stat",
        max: 15,
        cost: 10,
        effect: [{ name: "hordeHaste", type: "base", value: (lvl) => lvl * 4 }],
      },
      bloodOnCrit: {
        type: "passive",
        color: "cherry",
        icon: "mdi-diabetes",
        max: 1,
        cost: 50,
        effect: [{ name: "hordeBloodOnCrit", type: "tag", value: (lvl) => [lvl * 0.15] }],
      },
      blood: {
        type: "stat",
        max: 15,
        cost: 10,
        effect: [{ name: "currencyHordeBloodCap", type: "mult", value: (lvl) => lvl * 0.13 + 1 }],
      },
      critChance_2: {
        type: "stat",
        max: 5,
        cost: 20,
        effect: [{ name: "hordeCritChance", type: "base", value: (lvl) => lvl * 0.03 }],
      },
      energy: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeEnergy", type: "base", value: (lvl) => lvl * 30 }],
      },
      health_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 60 }],
      },
      sharpArrow: {
        type: "active",
        color: "red",
        icon: "mdi-arrow-projectile-multiple",
        max: 5,
        cost: 20,
        cooldown: () => 7,
        activeCost: () => {
          return { energy: 25 };
        },
        active(lvl) {
          return [
            { type: "damagePhysic", value: lvl * 0.4 + 1.2, str: 0.2 },
            { type: "removeDivisionShield", value: 1 },
          ];
        },
        activeType: "combat",
      },
      strength_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeStrength", type: "base", value: (lvl) => lvl * 1.3 }],
      },
      sharpMind: {
        type: "active",
        color: "orange-red",
        icon: "mdi-motion",
        max: 5,
        cost: 20,
        cooldown: () => 22 * SECONDS_PER_HOUR,
        activeCost: () => {
          return {};
        },
        active(lvl) {
          return [{ type: "permanentStat", stat: "hordeCritMult_base", value: lvl * 0.02 + {
        type: "stat",
        max: 5,
     vl) => lvl * 0.03 }],
      },
      courage: {
        type: "stat",
        max: 10,
        cost: 15,
        effect: [{ name: "currencyHordeCourageGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
      },
    },
    skillTree: [
      { isInnate: true, level: 0, items: ["critMult", "energyOnCrit", "longshot"] },
      { level: 1, items: ["eagleEye", "strength", "critMult_2"] },
      { level: 10, items: ["fireArrows", "poisonArrow", "critChance", "intelligence"] },
      {
        isChoice: true,
        level: 20,
        items: [
          ["healOnCrit", "health"],
          ["reduceCooldownOnCrit", "haste"],
          ["bloodOnCrit", "blood"],
        ],
      },
      { level: 30, items: ["critChance_2", "energy", "health_2"] },
      { level: 40, items: ["sharpArrow", "sharpMind", "strength_2"] },
      { level: 50, items: ["critChance_3", "courage"] },
    ],
    quests: {
      stat: [
        { stat: "hordeIntelligence", type: "total", value: 10 },
        { stat: "hordeHaste", type: "total", value: 80 },
        { stat: "hordeCritChance", type: "total", value: 0.5 },
      ],
      zone: [
        { area: "warzone", zone: "4" },
        { area: "warzone", zone: "8" },
        { area: "monkeyJungle", zone: "5" },
        { area: "monkeyJungle", zone: "12" },
        { area: "monkeyJungle", zone: "16" },
        { area: "loveIsland", zone: "3" },
        { area: "loveIsland", zone: "11" },
      ],
      level: [10, 20, 35, 50, 70, 95, 120, 145, 170, 195],
      boss: [
        { boss: "ohilio", difficulty: 7 },
        { boss: "chriz2", difficulty: 10 },
        { boss: "mina", difficulty: 10 },
      ],
    },
  },
  "modules/horde/fighterClass/assassin": {
    unlock: "hordeClassAssassin",
    icon: "mdi-robber",
    baseStats: { attack: 8.5, health: 220, mana: 90 },
    exp: { base: 2700, increment: 1.5 },
    skills: {},
    skillTree: [{ isInnate: true, level: 0, items: [] }],
    quests: { stat: [], zone: [], level: [], boss: [] },
  },
  "modules/horde/fighterClass/cultist": {
    unlock: "hordeClassCultist",
    icon: "mdi-pentagram",
    baseStats: { attack: 3.3, health: 700 },
    exp: { base: 12600, increment: 1.875 },
    skills: {},
    skillTree: [{ isInnate: true, level: 0, items: [] }],
    quests: { stat: [], zone: [], level: [], boss: [] },
  },
  "modules/horde/fighterClass/knight": {
    unlock: "hordeClassKnight",
    icon: "mdi-shield",
    baseStats: { attack: 2.5, health: 900, energy: 160, energyRegen: 1.5 },
    exp: { base: 1200, increment: 1.3 },
    courageMult: 12,
    skills: {
      damageRamp: {
        type: "passive",
        color: "red",
        icon: "mdi-chart-line",
        max: 1,
        effect: [{ name: "hordeAttackAfterTime", type: "tag", value: (lvl) => [lvl * 0.75] }],
      },
      revive: {
        type: "passive",
        color: "yellow",
        icon: "mdi-cross",
        max: 1,
        effect: [{ name: "hordeRevive", type: "base", value: (lvl) => lvl }],
      },
      heavyHit: {
        type: "active",
        color: "orange-red",
        icon: "mdi-sword",
        max: 1,
        cooldown: () => 70,
        activeCost: () => {
          return { energy: 140 };
        },
        active() {
          return [
            { type: "damagePhysic", value: 8, str: 0.6 },
            { type: "damageMagic", value: 8, int: 0.75 },
          ];
        },
        activeType: "combat",
      },
      shieldBash: {
        type: "active",
        color: "brown",
        icon: "mdi-shield",
        max: 5,
        cost: 20,
        cooldown: () => 16,
        activeCost: () => {
          return { energy: 100 };
        },
        active(lvl) {
          return [
            { type: "damagePhysic", value: lvl * 0.25 + 2.25, str: 0.2 },
            { type: "stun", value: lvl + 2 },
          ];
        },
        activeType: "combat",
      },
      health: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 120 }],
      },
      defense: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeDefense", type: "base", value: (lvl) => lvl * 0.001 }],
      },
      haste: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHaste", type: "base", value: (lvl) => lvl * 3 }],
      },
      statRamp: {
        type: "passive",
        color: "pink-purple",
        icon: "mdi-chart-line",
        max: 5,
        cost: 40,
        effect: [{ name: "hordeStrIntAfterTime", type: "tag", value: (lvl) => [lvl * 8] }],
      },
      defense_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeDefense", type: "base", value: (lvl) => lvl * 0.0012 }],
      },
      toxic: {
        type: "stat",
        max: 20,
        cost: 10,
        effect: [{ name: "hordeToxic", type: "base", value: (lvl) => lvl * 0.005 }],
      },
      magicTaken: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeMagicTaken", type: "mult", value: (lvl) => Math.pow(1 / 1.09, lvl) }],
      },
      cutting: {
        type: "stat",
        max: 20,
        cost: 10,
        effect: [{ name: "hordeCutting", type: "base", value: (lvl) => lvl * 0.002 }],
      },
      physicTaken: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordePhysicTaken", type: "mult", value: (lvl) => Math.pow(1 / 1.09, lvl) }],
      },
      refuge: {
        type: "active",
        color: "green",
        icon: "mdi-medical-cotton-swab",
        max: 5,
        cost: 20,
        cooldown: () => 50,
        activeCost: () => {
          return { energy: 120 };
        },
        active(lvl) {
          return [
            { type: "heal", value: lvl * 0.05 + 0.25, int: 0.006 },
            {
              type: "buff",
              value: lvl * 2 + 8,
              effect: [
                { type: "mult", name: "hordePhysicTaken", value: 1 / 1.4 },
                { type: "mult", name: "hordeMagicTaken", value: 1 / 1.4 },
                { type: "mult", name: "hordeBioTaken", value: 1 / 1.4 },
              ],
            },
          ];
        },
        activeType: "combat",
      },
      health_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 120 }],
      },
      recovery: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [
          { name: "hordeHealth", type: "base", value: (lvl) => lvl * 35 },
          { name: "hordeRecovery", type: "base", value: (lvl) => lvl * 0.01 },
        ],
      },
      physicTaken_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordePhysicTaken", type: "mult", value: (lvl) => Math.pow(1 / 1.08, lvl) }],
      },
      strength: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeStrength", type: "base", value: (lvl) => lvl * 0.8 }],
      },
      consecrate: {
        type: "active",
        color: "amber",
        icon: "mdi-shimmer",
        max: 5,
        cost: 20,
        cooldown: () => 28,
        activeCost: () => {
          return { energy: 50 };
        },
        active(lvl) {
          return [
            { type: "removeAttack", value: lvl * 0.02 + 0.06 },
            { type: "stun", value: lvl + 4 },
          ];
        },
        activeType: "combat",
      },
      energy: {
        type: "stat",
        max: 15,
        cost: 10,
        effect: [{ name: "hordeEnergy", type: "base", value: (lvl) => lvl * 35 }],
      },
      blessing: {
        type: "active",
        color: "yellow",
        icon: "mdi-cross-outline",
        max: 5,
        cost: 20,
        cooldown: (lvl) => 2700 - lvl * 300,
        activeCost: () => {
          return { energy: 80 };
        },
        active(lvl) {
          return [
            { type: "heal", value: lvl * 0.3 + 0.9, int: 0.02 },
            { type: "revive", value: 1 },
          ];
        },
        activeType: "combat",
      },
      revive_2: {
        type: "passive",
        color: "yellow",
        icon: "mdi-cross",
        max: 3,
        cost: 100,
        effect: [{ name: "hordeRevive", type: "base", value: (lvl) => lvl }],
      },
      fortify: {
        type: "active",
        color: "pale-green",
        icon: "mdi-heart",
        max: 5,
        cost: 20,
        cooldown: () => 22 * SECONDS_PER_HOUR,
        activeCost: () => {
          return {};
        },
        active(lvl) {
          return [{ type: "permanentStat", stat: "hordeHealth_base", value: lvl * 30 + 30 }];
        },
        activeType: "utility",
      },
      bioTaken: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeBioTaken", type: "mult", value: (lvl) => Math.pow(1 / 1.09, lvl) }],
      },
      health_3: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 120 }],
      },
      magicTaken_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeMagicTaken", type: "mult", value: (lvl) => Math.pow(1 / 1.08, lvl) }],
      },
      divisionShield: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeDivisionShield", type: "base", value: (lvl) => lvl }],
      },
      intelligence: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeIntelligence", type: "base", value: (lvl) => lvl * 0.9 }],
      },
      recovery_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [
          { name: "hordeHealth", type: "base", value: (lvl) => lvl * 35 },
          { name: "hordeRecovery", type: "base", value: (lvl) => lvl * 0.01 },
        ],
      },
      defense_3: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeDefense", type: "base", value: (lvl) => lvl * 0.001 }],
      },
      courage: {
        type: "stat",
        max: 10,
        cost: 15,
        effect: [{ name: "currencyHordeCourageGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
      },
    },
    skillTree: [
      { isInnate: true, level: 0, items: ["damageRamp", "revive", "heavyHit"] },
      { level: 1, items: ["shieldBash", "health", "defense", "haste"] },
      {
        isChoice: true,
        level: 10,
        items: [
          ["statRamp", "defense_2"],
          ["toxic", "physicTaken"],
          ["cutting", "magicTaken"],
        ],
      },
      { level: 20, items: ["refuge", "health_2", "recovery", "physicTaken_2", "strength"] },
      {
        isChoice: true,
        level: 30,
        items: [
          ["consecrate", "energy"],
          ["blessing", "revive_2"],
          ["fortify", "bioTaken"],
        ],
      },
      { level: 40, items: ["health_3", "magicTaken_2", "divisionShield", "intelligence"] },
      { level: 50, items: ["recovery_2", "defense_3", "courage"] },
    ],
    quests: {
      stat: [
        { stat: "hordeHealth", type: "base", value: 3000 },
        { stat: "hordeCutting", type: "total", value: 0.04 },
        { stat: "hordeHealth", type: "base", value: buildNum(10, "K") },
      ],
      zone: [
        { area: "warzone", zone: "9" },
        { area: "monkeyJungle", zone: "6" },
        { area: "monkeyJungle", zone: "13" },
        { area: "monkeyJungle", zone: "19" },
        { area: "loveIsland", zone: "6" },
        { area: "loveIsland", zone: "14" },
      ],
      level: [20, 35, 50, 70, 90, 115, 140, 165, 190],
      boss: [
        { boss: "ohilio", difficulty: 20 },
        { boss: "chriz2", difficulty: 15 },
        { boss: "mina", difficulty: 2 },
      ],
    },
  },
  "modules/horde/fighterClass/mage": {
    unlock: "hordeClassMage",
    icon: "mdi-wizard-hat",
    baseStats: { attack: 4, health: 575, mana: 400, manaRegen: 0.1 },
    exp: { base: 840, increment: 1.24 },
    courageMult: 4,
    skills: {
      manaRest: {
        type: "passive",
        color: "blue",
        icon: "mdi-sleep",
        max: 1,
        effect: [{ name: "hordeManaRest", type: "tag", value: (lvl) => [15, lvl * 1.2] }],
      },
      autocast: {
        type: "passive",
        color: "pink",
        icon: "mdi-cached",
        max: 3,
        cost: 75,
        effect: [{ name: "hordeAutocast", type: "base", value: (lvl) => lvl }],
      },
      magicMissile: {
        type: "active",
        color: "indigo",
        icon: "mdi-motion",
        max: 1,
        cooldown: () => 6,
        activeCost: () => {
          return { mana: 10 };
        },
        active() {
          return [{ type: "damageMagic", value: 2.2, int: 0.16 }];
        },
        activeType: "combat",
      },
      fireball: {
        type: "active",
        color: "orange",
        icon: "mdi-fire-circle",
        max: 5,
        cost: 14,
        cooldown: () => 13,
        activeCost: () => {
          return { mana: 22 };
        },
        active(lvl) {
          return [{ type: "damageMagic", value: lvl * 0.1 + 3.3, int: 0.24, canCrit: lvl * 0.1 + 0.5 }];
        },
        activeType: "combat",
      },
      shockBlast: {
        type: "active",
        color: "yellow",
        icon: "mdi-flash",
        max: 5,
        cost: 14,
        cooldown: () => 28,
        activeCost: () => {
          return { mana: 30 };
        },
        active(lvl) {
          return [
            { type: "damageMagic", value: lvl * 0.3 + 4.5, int: 0.3 },
            { type: "silence", value: lvl * 2 + 4 },
          ];
        },
        activeType: "combat",
      },
      heal: {
        type: "active",
        color: "green",
        icon: "mdi-medical-bag",
        max: 5,
        cost: 14,
        cooldown: (lvl) => 55 - lvl * 5,
        activeCost: () => {
          return { mana: 65 };
        },
        active() {
          return [{ type: "heal", value: 0.6, int: 0.01 }];
        },
        activeType: "combat",
      },
      mana: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeMana", type: "base", value: (lvl) => lvl * 50 }],
      },
      intelligence: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeIntelligence", type: "base", value: (lvl) => lvl * 1.4 }],
      },
      barrier: {
        type: "active",
        color: "light-grey",
        icon: "mdi-circle-outline",
        max: 5,
        cost: 16,
        cooldown: () => 36,
        activeCost: () => {
          return { mana: 40 };
        },
        active(lvl) {
          return [{ type: "divisionShield", value: lvl * 3 + 1 }];
        },
        activeType: "combat",
      },
      earthquake: {
        type: "active",
        color: "brown",
        icon: "mdi-landslide",
        max: 5,
        cost: 16,
        cooldown: () => 30,
        activeCost: () => {
          return { mana: 48 };
        },
        active(lvl) {
          return [
            { type: "damageMagic", value: 3.75, int: 0.22 },
            { type: "stun", value: lvl + 3 },
          ];
        },
        activeType: "combat",
      },
      intelligence_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeIntelligence", type: "base", value: (lvl) => lvl * 1.4 }],
      },
      haste: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHaste", type: "base", value: (lvl) => lvl * 3 }],
      },
      health: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 70 }],
      },
      manasteal: {
        type: "passive",
        color: "teal",
        icon: "mdi-water-plus",
        max: 3,
        cost: 40,
        effect: [{ name: "hordeManasteal", type: "tag", value: (lvl) => [lvl * 5] }],
      },
      waterBolt: {
        type: "active",
        color: "light-blue",
        icon: "mdi-waves",
        max: 5,
        cost: 18,
        cooldown: () => 75,
        activeCost: () => {
          return { mana: 130 };
        },
        active(lvl) {
          return [
            { type: "damageMagic", value: lvl * 0.6 + 8, int: 0.36 },
            { type: "heal", value: lvl * 0.025 + 0.075, int: 0.006 },
          ];
        },
        activeType: "combat",
      },
      iceBlast: {
        type: "active",
        color: "cyan",
        icon: "mdi-snowflake-alert",
        max: 5,
        cost: 18,
        cooldown: (lvl) => 38 - lvl * 4,
        activeCost: () => {
          return { mana: 85 };
        },
        active(lvl) {
          return [
            { type: "stun", value: lvl * 2 + 6 },
            { type: "removeAttack", value: lvl * 0.02 + 0.1 },
          ];
        },
        activeType: "combat",
      },
      mana_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeMana", type: "base", value: (lvl) => lvl * 50 }],
      },
      haste_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHaste", type: "base", value: (lvl) => lvl * 3 }],
      },
      autocast_2: {
        type: "passive",
        color: "pink",
        icon: "mdi-cached",
        max: 1,
        cost: 50,
        effect: [{ name: "hordeAutocast", type: "base", value: (lvl) => lvl }],
      },
      mana_3: {
        type: "stat",
        max: 15,
        cost: 10,
        effect: [
          { name: "hordeMana", type: "base", value: (lvl) => lvl * 40 },
          { name: "hordeManaRegen", type: "base", value: (lvl) => lvl * 0.08 },
        ],
      },
      spellblade: {
        type: "stat",
        max: 15,
        cost: 10,
        effect: [{ name: "hordeSpellblade", type: "base", value: (lvl) => lvl * 0.2 }],
      },
      focus: {
        type: "active",
        color: "purple",
        icon: "mdi-crystal-ball",
        max: 5,
        cost: 20,
        cooldown: () => 180,
        activeCost: () => {
          return { mana: 125 };
        },
        active(lvl) {
          return [{ type: "buff", value: 60, effect: [{ type: "base", name: "hordeIntelligence", value: 8 * lvl }] }];
        },
        activeType: "combat",
      },
      smite: {
        type: "active",
        color: "red",
        icon: "mdi-nuke",
        max: 5,
        cost: 20,
        cooldown: (lvl) => 95 - lvl * 5,
        activeCost: () => {
          return { mana: 250 };
        },
        active(lvl) {
          return [{ type: "damageMagic", value: lvl * 4 + 18, int: 0.8 }];
        },
        activeType: "combat",
      },
      intelligence_3: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeIntelligence", type: "base", value: (lvl) => lvl * 1.4 }],
      },
      health_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 70 }],
      },
      autocast_3: {
        type: "passive",
        color: "pink",
        icon: "mdi-cached",
        max: 1,
        cost: 50,
        effect: [{ name: "hordeAutocast", type: "base", value: (lvl) => lvl }],
      },
      conjure: {
        type: "active",
        color: "red-pink",
        icon: "mdi-sack",
        max: 5,
        cost: 20,
        cooldown: () => 900,
        activeCost: () => {
          return {};
        },
        active(lvl) {
          return [{ type: "blood", value: lvl * 5 + 25 }];
        },
        activeType: "utility",
      },
      ascend: {
        type: "active",
        color: "amber",
        icon: "mdi-star-face",
        max: 5,
        cost: 20,
        cooldown: (lvl) => 8100 - lvl * 900,
        activeCost: () => {
          return { mana: 1000 };
        },
        active(lvl) {
          return [
            {
              type: "buff",
              value: 150,
              effect: [
                { type: "mult", name: "hordeAttack", value: lvl * 0.15 + 1.25 },
                { type: "mult", name: "hordeHealth", value: lvl * 0.15 + 1.25 },
                { type: "base", name: "hordeRecovery", value: lvl * 0.03 + 0.05 },
                { type: "base", name: "hordeManaRegen", value: lvl * 2 + 10 },
              ],
            },
          ];
        },
        activeType: "combat",
      },
      deepFocus: {
        type: "active",
        color: "blue",
        icon: "mdi-water",
        max: 5,
        cost: 20,
        cooldown: () => 22 * SECONDS_PER_HOUR,
        activeCost: () => {
          return {};
        },
        active(lvl) {
          return [{ type: "permanentStat", stat: "hordeMana_base", value: lvl * 10 + 10 }];
        },
        activeType: "utility",
      },
    },
    skillTree: [
      { isInnate: true, level: 0, items: ["manaRest", "autocast", "magicMissile"] },
      { level: 1, items: ["fireball", "shockBlast", "heal", "mana", "intelligence"] },
      { level: 10, items: ["barrier", "earthquake", "intelligence_2", "haste", "health"] },
      { level: 20, items: ["manasteal", "waterBolt", "iceBlast", "mana_2", "haste_2"] },
      { isChoice: true, level: 30, items: [["autocast_2"], ["mana_3"], ["spellblade"]] },
      { level: 40, items: ["focus", "smite", "intelligence_3", "health_2"] },
      { isChoice: true, level: 50, items: [["autocast_3"], ["conjure"], ["ascend"], ["deepFocus"]] },
    ],
    quests: {
      stat: [
        { stat: "hordeMana", type: "total", value: 1000 },
        { stat: "hordeHaste", type: "total", value: 60 },
        { stat: "hordeMana", type: "total", value: 2500 },
      ],
      zone: [
        { area: "warzone", zone: "7" },
        { area: "monkeyJungle", zone: "4" },
        { area: "monkeyJungle", zone: "11" },
        { area: "monkeyJungle", zone: "17" },
        { area: "loveIsland", zone: "5" },
        { area: "loveIsland", zone: "13" },
      ],
      level: [15, 30, 45, 60, 85, 110, 135, 160, 185],
      boss: [
        { boss: "ohilio", difficulty: 12 },
        { boss: "chriz2", difficulty: 3 },
        { boss: "mina", difficulty: 25 },
      ],
    },
  },
  "modules/horde/fighterClass/pirate": {
    unlock: "hordeClassPirate",
    icon: "mdi-pirate",
    baseStats: { attack: 3.3, health: 285, energy: 150, energyRegen: 1, mana: 100, manaRegen: 0.01 },
    exp: { base: 1800, increment: 1.4 },
    courageMult: 35,
    skills: {
      challenge: {
        type: "passive",
        color: "orange-red",
        icon: "mdi-ticket",
        max: 1,
        effect: [{ name: "currencyHordeLockpickGain", type: "base", value: (lvl) => lvl / buildNum(100, "K") }],
      },
      parrotAttack: {
        type: "active",
        color: "cyan",
        icon: "mdi-bird",
        max: 1,
        cooldown: () => 14,
        activeCost: () => {
          return { energy: 50 };
        },
        active() {
          return [
            { type: "maxdamageBio", value: 0.2, int: 0.001 },
            { type: "damagePhysic", value: 2.6, str: 0.5 },
          ];
        },
        activeType: "combat",
      },
      plunder: {
        type: "active",
        color: "light-green",
        icon: "mdi-sack",
        max: 1,
        cooldown: () => 60,
        activeCost: () => {
          return { mana: 20 };
        },
        active() {
          return [{ type: "blood", value: 10 }];
        },
        activeType: "utility",
      },
      bottleOBrew: {
        type: "active",
        color: "pink",
        icon: "mdi-bottle-tonic",
        max: 5,
        cost: 20,
        cooldown: () => 180,
        activeCost: () => {
          return { mana: 55 };
        },
        active(lvl) {
          return [
            {
              type: "buff",
              value: 30,
              effect: [
                { type: "mult", name: "hordeAttack", value: lvl * 0.25 + 1.75 },
                { type: "base", name: "hordeCritChance", value: 0.4 },
                { type: "base", name: "hordeCritMult", value: 1.5 },
                { type: "mult", name: "hordePhysicTaken", value: 1 / (lvl * 0.25 + 1.75) },
                { type: "mult", name: "hordeMagicTaken", value: 1 / (lvl * 0.25 + 1.75) },
                { type: "mult", name: "hordeBioTaken", value: 1 / (lvl * 0.25 + 1.75) },
                { type: "base", name: "hordeRecovery", value: 0.25 },
                { type: "base", name: "hordeDefense", value: 0.02 },
              ],
            },
          ];
        },
        activeType: "combat",
      },
      energy: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeEnergy", type: "base", value: (lvl) => lvl * 40 }],
      },
      mana: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeMana", type: "base", value: (lvl) => lvl * 25 }],
      },
      blood: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "currencyHordeBloodGain", type: "mult", value: (lvl) => getSequence(3, lvl) * 0.08 + 1 }],
      },
      courage: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "currencyHordeCourageGain", type: "mult", value: (lvl) => lvl * 0.08 + 1 }],
      },
      bombToss: {
        type: "active",
        color: "grey",
        icon: "mdi-bomb",
        max: 5,
        cost: 20,
        cooldown: () => 22,
        activeCost: () => {
          return { energy: 70 };
        },
        active(lvl) {
          return [{ type: "damageMagic", value: lvl + 6.5, int: 0.8 }];
        },
        activeType: "combat",
      },
      health: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 40 }],
      },
      blood_2: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "currencyHordeBloodGain", type: "mult", value: (lvl) => getSequence(3, lvl) * 0.08 + 1 }],
      },
      blood_3: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "currencyHordeBloodCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) * (lvl * 0.1 + 1) }],
      },
      lockpick: {
        type: "stat",
        max: 4,
        cost: 15,
        effect: [{ name: "currencyHordeLockpickGain", type: "base", value: (lvl) => lvl / buildNum(2, "M") }],
      },
      blood_4: {
        type: "stat",
        max: 20,
        cost: 10,
        effect: [
          { name: "currencyHordeBloodGain", type: "mult", value: (lvl) => getSequence(3, lvl) * 0.05 + 1 },
          { name: "currencyHordeBloodCap", type: "mult", value: (lvl) => getSequence(3, lvl) * 0.05 + 1 },
        ],
      },
      courage_2: {
        type: "stat",
        max: 20,
        cost: 10,
        effect: [{ name: "currencyHordeCourageGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
      },
      trinket: {
        type: "stat",
        max: 20,
        cost: 10,
        effect: [{ name: "hordeTrinketGain", type: "mult", value: (lvl) => lvl * 0.08 + 1 }],
      },
      invigoratingBottle: {
        type: "active",
        color: "amber",
        icon: "mdi-bottle-tonic",
        max: 5,
        cost: 20,
        cooldown: (lvl) => 210 - 30 * lvl,
        activeCost: (lvl) => {
          return { mana: 50 - 5 * lvl };
        },
        active() {
          return [{ type: "refillEnergy", value: 1 }];
        },
        activeType: "combat",
      },
      damage: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeAttack", type: "base", value: (lvl) => lvl * 0.1 }],
      },
      blood_5: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "currencyHordeBloodCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) * (lvl * 0.1 + 1) }],
      },
      courage_3: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "currencyHordeCourageGain", type: "mult", value: (lvl) => lvl * 0.08 + 1 }],
      },
      lockpick_2: {
        type: "stat",
        max: 4,
        cost: 15,
        effect: [{ name: "currencyHordeLockpickGain", type: "base", value: (lvl) => lvl / buildNum(2, "M") }],
      },
      treasureChest: {
        type: "active",
        color: "wooden",
        icon: "mdi-treasure-chest",
        max: 5,
        cost: 20,
        cooldown: () => 22 * SECONDS_PER_HOUR,
        activeCost: () => {
          return {};
        },
        active(lvl) {
          return [{ type: "permanentStat", stat: "currencyHordeBloodGain_mult", value: lvl * 0.07 + 0.07 }];
        },
        activeType: "utility",
      },
      blood_6: {
        type: "stat",
        max: 15,
        cost: 10,
        effect: [
          {
            name: "currencyHordeBloodCap",
            type: "mult",
            value: (lvl) => Math.pow(1.15, lvl) * (getSequence(3, lvl) * 0.1 + 1),
          },
        ],
      },
      bountyBoard: {
        type: "passive",
        color: "orange-red",
        icon: "mdi-screwdriver",
        max: 1,
        cost: 100,
        effect: [
          { name: "currencyHordeLockpickGain", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
          { name: "currencyHordeLockpickCap", type: "base", value: (lvl) => lvl * 21 },
        ],
      },
      lockpick_3: {
        type: "stat",
        max: 15,
        cost: 10,
        effect: [{ name: "currencyHordeLockpickGain", type: "base", value: (lvl) => lvl / buildNum(2.5, "M") }],
      },
      trinket_2: {
        type: "stat",
        max: 25,
        cost: 10,
        effect: [
          { name: "hordeTrinketGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.08 + 1) },
          { name: "hordeTrinketQuality", type: "base", value: (lvl) => lvl * -1 },
        ],
      },
      haste: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "hordeHaste", type: "base", value: (lvl) => lvl * 3 }],
      },
      blood_7: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "currencyHordeBloodGain", type: "mult", value: (lvl) => getSequence(3, lvl) * 0.08 + 1 }],
      },
      blood_8: {
        type: "stat",
        max: 10,
        cost: 10,
        effect: [{ name: "currencyHordeBloodCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) * (lvl * 0.1 + 1) }],
      },
    },
    skillTree: [
      { isInnate: true, level: 0, items: ["challenge", "parrotAttack", "plunder"] },
      { level: 1, items: ["bottleOBrew", "energy", "mana", "blood", "courage"] },
      { level: 10, items: ["bombToss", "health", "blood_2", "blood_3", "lockpick"] },
      { isChoice: true, level: 20, items: [["blood_4"], ["courage_2"], ["trinket"]] },
      { level: 30, items: ["invigoratingBottle", "damage", "blood_5", "courage_3", "lockpick_2"] },
      {
        isChoice: true,
        level: 40,
        items: [["treasureChest", "blood_6"], ["bountyBoard", "lockpick_3"], ["trinket_2"]],
      },
      { level: 50, items: ["haste", "blood_7", "blood_8"] },
    ],
    quests: {
      stat: [{ stat: "hordeHealth", type: "base", value: 1200 }],
      zone: [
        { area: "monkeyJungle", zone: "2" },
        { area: "monkeyJungle", zone: "8" },
        { area: "monkeyJungle", zone: "18" },
        { area: "loveIsland", zone: "4" },
        { area: "loveIsland", zone: "10" },
      ],
      level: [25, 40, 55, 75, 95, 120, 150, 180],
      boss: [
        { boss: "ohilio", difficulty: 30 },
        { boss: "chriz2", difficulty: 20 },
        { boss: "mina", difficulty: 5 },
      ],
    },
  },
  "modules/horde/fighterClass/scholar": {
    unlock: "hordeClassScholar",
    icon: "mdi-school",
    baseStats: { attack: 2, health: 250 },
    exp: { base: 18000, increment: 2.1 },
    skills: {},
    skillTree: [{ isInnate: true, level: 0, items: [] }],
    quests: { stat: [], zone: [], level: [], boss: [] },
  },
  "modules/horde/fighterClass/shaman": {
    unlock: "hordeClassShaman",
    icon: "mdi-tree",
    baseStats: { attack: 4.4, health: 575, mana: 150 },
    exp: { base: 4200, increment: 1.425 },
    skills: {},
    skillTree: [{ isInnate: true, level: 0, items: [] }],
    quests: { stat: [], zone: [], level: [], boss: [] },
  },
  "modules/horde/fighterClass/undead": {
    unlock: "hordeClassUndead",
    icon: "mdi-emoticon-dead",
    baseStats: { attack: 1.8, health: 60 },
    exp: { base: 8400, increment: 1.7 },
    skills: {},
    skillTree: [{ isInnate: true, level: 0, items: [] }],
    quests: { stat: [], zone: [], level: [], boss: [] },
  },
  "modules/horde/heirloom": {
    power: {
      color: "red",
      icon: "mdi-sword",
      effect: [{ name: "hordeAttack", type: "mult", value: (lvl) => lvl * 0.2 + 1 }],
    },
    fortitude: {
      color: "green",
      icon: "mdi-heart",
      effect: [{ name: "hordeHealth", type: "mult", value: (lvl) => lvl * 0.2 + 1 }],
    },
    wealth: {
      color: "amber",
      icon: "mdi-circle-multiple",
      effect: [
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => lvl * 0.15 + 1 },
        { name: "currencyHordeMonsterPartGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    spirit: {
      minZone: 40,
      color: "purple",
      icon: "mdi-ghost",
      effect: [{ name: "currencyHordeSoulCorruptedGain", type: "mult", value: (lvl) => lvl * 0.06 + 1 }],
    },
    sharpsight: {
      minZone: 50,
      color: "cyan",
      icon: "mdi-magnify",
      effect: [{ name: "hordeItemChance", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
    },
    reaping: {
      minZone: 60,
      color: "pink",
      icon: "mdi-skull",
      effect: [{ name: "currencyHordeCorruptedFleshGain", type: "base", value: (lvl) => lvl * 0.03 }],
    },
    remembrance: {
      minZone: 70,
      color: "deep-purple",
      icon: "mdi-grave-stone",
      effect: [{ name: "currencyHordeSoulCorruptedCap", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
    },
    holding: {
      minZone: 80,
      color: "brown",
      icon: "mdi-dresser",
      effect: [
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyHordeMonsterPartCap", type: "mult", value: (lvl) => lvl * 0.02 + 1 },
      ],
    },
    expertise: {
      minZone: 100,
      color: "light-blue",
      icon: "mdi-book-open-variant",
      effect: [{ name: "hordeItemMasteryGain", type: "mult", value: (lvl) => lvl * 0.01 + 1 }],
    },
    mystery: {
      minZone: 120,
      color: "teal",
      icon: "mdi-help-box",
      effect: [{ name: "hordeShardChance", type: "mult", value: (lvl) => lvl * 0.001 + 1 }],
    }, // Tower-exclusive heirlooms
    brick: {
      minZone: Infinity,
      color: "cherry",
      icon: "mdi-wall",
      effect: [
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "hordeCritMult", type: "base", value: (lvl) => (Math.pow(lvl / 10 + 1, 0.4) - 1) * 0.01 },
      ],
    },
    heat: {
      minZone: Infinity,
      color: "orange-red",
      icon: "mdi-fire",
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "hordeCritChance", type: "base", value: (lvl) => Math.log(lvl / 10 + 1) * 0.008 },
      ],
    },
    ice: {
      minZone: Infinity,
      color: "skyblue",
      icon: "mdi-snowflake-variant",
      effect: [
        { name: "hordeHealth", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "hordeRecovery", type: "base", value: (lvl) => Math.log(lvl / 10 + 1) * 0.003 },
      ],
    },
    crystal: {
      minZone: Infinity,
      color: "indigo",
      icon: "mdi-billiards-rack",
      effect: [
        { name: "hordeShardChance", type: "mult", value: (lvl) => lvl * 0.001 + 1 },
        { name: "currencyHordeMysticalShardCap", type: "base", value: (lvl) => Math.floor(Math.log(lvl + 2)) },
      ],
    },
    vitality: {
      minZone: Infinity,
      color: "light-green",
      icon: "mdi-heart-multiple",
      effect: [
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => lvl * 0.001 + 1 },
        { name: "hordeHealing", type: "mult", value: (lvl) => Math.log(lvl + 1) * 0.1 + 1 },
      ],
    },
  },
  "modules/horde/relic": {
    forgottenShield: {
      icon: "mdi-shield-sun",
      color: "pale-light-blue",
      effect: [
        { name: "horde_resilience", type: "keepUpgrade", value: true },
        { name: "horde_rest", type: "keepUpgrade", value: true },
      ],
    },
    burningSkull: {
      icon: "mdi-skull",
      color: "orange-red",
      effect: [
        { name: "horde_boneBag", type: "keepUpgrade", value: true },
        { name: "horde_anger", type: "keepUpgrade", value: true },
      ],
    },
    energyDrink: {
      icon: "mdi-bottle-soda",
      color: "yellow",
      effect: [
        { name: "currencyHordeMonsterPartGain", type: "base", value: 0.5 },
        { name: "horde_monsterSoup", type: "keepUpgrade", value: true },
      ],
    },
    luckyDice: {
      icon: "mdi-dice-6",
      color: "light-green",
      effect: [{ name: "horde_luckyStrike", type: "keepUpgrade", value: true }],
    },
    dumbbell: {
      icon: "mdi-dumbbell",
      color: "indigo",
      effect: [{ name: "horde_training", type: "keepUpgrade", value: true }],
    },
    bandage: {
      icon: "mdi-bandage",
      color: "pale-pink",
      effect: [{ name: "horde_thickSkin", type: "keepUpgrade", value: true }],
    },
    newBackpack: {
      icon: "mdi-bag-personal",
      color: "pale-orange",
      effect: [
        { name: "horde_hoarding", type: "keepUpgrade", value: true },
        { name: "horde_plunderSecret", type: "keepUpgrade", value: true },
      ],
    },
    ultimateGuide: {
      icon: "mdi-book-multiple",
      color: "brown",
      effect: [
        { name: "horde_stabbingGuide", type: "keepUpgrade", value: true },
        { name: "horde_dodgingGuide", type: "keepUpgrade", value: true },
      ],
    },
    crackedSafe: {
      icon: "mdi-safe-square",
      color: "darker-grey",
      effect: [{ name: "horde_looting", type: "keepUpgrade", value: true }],
    },
  },
  "modules/horde/sigil": {
    power: {
      icon: "mdi-dumbbell",
      color: "deep-orange",
      stats: (lvl) => {
        return { attack: { type: "mult", amount: Math.pow(1.4, lvl) } };
      },
    },
    health: {
      icon: "mdi-heart",
      color: "red",
      stats: (lvl) => {
        return { health: { type: "mult", amount: Math.pow(1.5, lvl) } };
      },
    },
    bashing: {
      minZone: 22,
      icon: "mdi-hammer",
      color: "pale-red",
      active: {
        effect(lvl) {
          return [{ type: "stun", value: lvl + 3 }];
        },
        cooldown: () => 5,
        startCooldown: () => 0,
        uses: (lvl, boss) => lvl * bossTimeMult(boss),
      },
    },
    recovery: {
      minZone: 24,
      icon: "mdi-medical-bag",
      color: "green",
      stats: (lvl) => {
        return { health: { type: "mult", amount: Math.pow(1.12, lvl) } };
      },
      active: {
        effect(lvl) {
          return [{ type: "heal", value: lvl * 0.05 + 0.3 }];
        },
        cooldown: () => 20,
        startCooldown: () => 10,
        uses: (lvl) => lvl,
      },
    },
    toughness: {
      minZone: 26,
      icon: "mdi-shield-sword",
      color: "cherry",
      stats: (lvl) => {
        return { physicTaken: { type: "mult", amount: Math.pow(0.4, lvl) } };
      },
      exclude: ["wisdom"],
    },
    strength: {
      minZone: 28,
      icon: "mdi-arm-flex",
      color: "red",
      stats: (lvl) => {
        return { physicAttack: { type: "mult", amount: Math.pow(1.2, lvl) } };
      },
      active: {
        effect(lvl) {
          return [{ type: "damagePhysic", value: lvl * 1.5 + 1.25 }];
        },
        cooldown: () => 8,
        startCooldown: () => 4,
        uses: () => null,
      },
    },
    magic: {
      minZone: 30,
      icon: "mdi-magic-staff",
      color: "deep-purple",
      stats: (lvl, boss) => {
        return {
          firstStrike: { type: "base", amount: 2.25 * lvl * bossTimeMult(boss) },
          magicConversion: { type: "base", amount: 1.5 * lvl },
        };
      },
    },
    magicBolt: {
      minZone: 32,
      icon: "mdi-motion",
      color: "indigo",
      stats: (lvl) => {
        return {
          magicAttack: { type: "mult", amount: Math.pow(1.2, lvl) },
          magicConversion: { type: "base", amount: 0.4 * lvl },
        };
      },
      active: {
        effect(lvl) {
          return [{ type: "damageMagic", value: lvl * 1.5 + 4 }];
        },
        cooldown: () => 13,
        startCooldown: () => 3,
        uses: (lvl, boss) => lvl * bossTimeMult(boss),
      },
    },
    fireball: {
      minZone: 34,
      icon: "mdi-fire-circle",
      color: "orange",
      stats: (lvl) => {
        return {
          magicAttack: { type: "mult", amount: Math.pow(1.2, lvl) },
          magicConversion: { type: "base", amount: 0.4 * lvl },
        };
      },
      active: {
        effect(lvl) {
          return [
            { type: "damageMagic", value: lvl * 1.75 + 3.5 },
            { type: "stun", value: 2 },
          ];
        },
        cooldown: () => 16,
        startCooldown: () => 5,
        uses: (lvl, boss) => lvl * bossTimeMult(boss),
      },
    },
    incorporeal: {
      minZone: 36,
      icon: "mdi-ghost",
      color: "pink",
      stats: (lvl) => {
        return { loot: { type: "mult", amount: Math.pow(0.25, lvl) } };
      },
    },
    focus: {
      minZone: 38,
      icon: "mdi-image-filter-center-focus",
      color: "red-pink",
      stats: (lvl) => {
        return { physicAttack: { type: "mult", amount: Math.pow(1.2, lvl) } };
      },
      active: {
        effect(lvl) {
          return [{ type: "damagePhysic", value: getSequence(3, lvl) * 10 }];
        },
        cooldown: (lvl, boss) => 28 * bossTimeMult(boss),
        startCooldown: (lvl, boss) => 28 * bossTimeMult(boss),
        uses: () => 1,
      },
    },
    wisdom: {
      minZone: 40,
      icon: "mdi-shield-star",
      color: "dark-blue",
      stats: (lvl) => {
        return { magicTaken: { type: "mult", amount: Math.pow(0.4, lvl) } };
      },
      exclude: ["resilience"],
    },
    sparks: {
      minZone: 42,
      icon: "mdi-flash",
      color: "yellow",
      stats: (lvl) => {
        return { magicConversion: { type: "base", amount: 0.3 * lvl } };
      },
      active: {
        effect(lvl) {
          return [{ type: "damageMagic", value: lvl * 0.9 + 1.7 }];
        },
        cooldown: () => 5,
        startCooldown: () => 2,
        uses: (lvl, boss) => lvl * 3 * bossTimeMult(boss),
      },
    },
    protection: {
      minZone: 44,
      icon: "mdi-shield",
      color: "blue",
      stats: (lvl, boss) => {
        return { divisionShield: { type: "base", amount: 5 * lvl * bossTimeMult(boss) } };
      },
    },
    shielding: {
      minZone: 46,
      icon: "mdi-circle-slice-8",
      color: "teal",
      stats: (lvl, boss) => {
        return { divisionShield: { type: "base", amount: 3 * lvl * bossTimeMult(boss) } };
      },
      active: {
        effect(lvl) {
          return [{ type: "divisionShield", value: lvl + 2 }];
        },
        cooldown: () => 11,
        startCooldown: () => 9,
        uses: (lvl, boss) => (lvl + 1) * bossTimeMult(boss),
      },
    },
    resistance: {
      minZone: 48,
      icon: "mdi-circle-half-full",
      color: "brown",
      stats: (lvl) => {
        return { stunResist: { type: "base", amount: lvl } };
      },
      active: {
        effect() {
          return [{ type: "removeStun", value: null }];
        },
        cooldown: () => 7,
        startCooldown: () => 2,
        uses: (lvl, boss) => lvl * bossTimeMult(boss),
      },
    },
    precision: {
      minZone: 50,
      icon: "mdi-bullseye-arrow",
      color: "orange",
      stats: (lvl) => {
        return { critChance: { type: "base", amount: 0.4 * lvl }, critMult: { type: "base", amount: 0.35 * lvl } };
      },
    },
    screaming: {
      minZone: 52,
      icon: "mdi-bullhorn",
      color: "cyan",
      active: {
        effect() {
          return [{ type: "silence", value: 6 }];
        },
        cooldown: () => 10,
        startCooldown: () => 0,
        uses: (lvl, boss) => lvl * bossTimeMult(boss),
      },
    },
    cure: {
      minZone: 54,
      icon: "mdi-tea",
      color: "lime",
      stats: (lvl) => {
        return { bioTaken: { type: "mult", amount: Math.pow(0.75, lvl) } };
      },
      active: {
        effect(lvl, boss) {
          return [
            { type: "heal", value: (lvl * 0.025 + 0.075) / bossTimeMult(boss) },
            { type: "antidote", value: 1 },
          ];
        },
        cooldown: () => 16,
        startCooldown: () => 12,
        uses: (lvl, boss) => lvl * bossTimeMult(boss),
      },
    },
    sharp: {
      minZone: 56,
      icon: "mdi-nail",
      color: "purple",
      stats: (lvl) => {
        return { cutting: { type: "base", amount: 0.002 * lvl }, bioConversion: { type: "base", amount: 1.5 * lvl } };
      },
      exclude: ["executing"],
    },
    spitting: {
      minZone: 56,
      icon: "mdi-water-opacity",
      color: "light-green",
      stats: (lvl) => {
        return {
          bioAttack: { type: "mult", amount: Math.pow(1.2, lvl) },
          bioConversion: { type: "base", amount: 0.4 * lvl },
        };
      },
      active: {
        effect(lvl) {
          return [{ type: "damageBio", value: lvl * 1.4 + 2 }];
        },
        cooldown: () => 15,
        startCooldown: () => 11,
        uses: () => null,
      },
    },
    burst: {
      minZone: 58,
      icon: "mdi-liquid-spot",
      color: "pale-green",
      stats: (lvl) => {
        return { bioConversion: { type: "base", amount: 0.3 * lvl } };
      },
      active: {
        effect(lvl) {
          return [
            { type: "damageBio", value: getSequence(2, lvl) * 1.5 + 4.5 },
            { type: "poison", value: lvl * 0.15 + 0.25 },
          ];
        },
        cooldown: () => 26,
        startCooldown: () => 18,
        uses: () => 2,
      },
    },
    resilience: {
      minZone: 60,
      icon: "mdi-shield-bug",
      color: "green",
      stats: (lvl) => {
        return { bioTaken: { type: "mult", amount: Math.pow(0.4, lvl) } };
      },
      exclude: ["toughness"],
    },
    growing: {
      minZone: 62,
      icon: "mdi-resize",
      color: "beige",
      stats: (lvl) => {
        return { health: { type: "mult", amount: Math.pow(1.3, lvl) } };
      },
      active: {
        effect(lvl) {
          return [{ type: "gainStat", stat: "attack_mult", value: lvl * 0.05 + 1.2 }];
        },
        cooldown: () => 15,
        startCooldown: () => 15,
        uses: (lvl) => lvl + 2,
      },
    },
    cold: {
      minZone: 64,
      icon: "mdi-snowflake",
      color: "dark-blue",
      stats: (lvl) => {
        return {
          health: { type: "mult", amount: Math.pow(1.2, lvl) },
          magicConversion: { type: "base", amount: 0.25 * lvl },
        };
      },
      active: {
        effect(lvl) {
          return [
            { type: "damageMagic", value: lvl * 2.5 + 2.75 },
            { type: "stun", value: lvl * 2 + 6 },
          ];
        },
        cooldown: () => 22,
        startCooldown: () => 14,
        uses: (lvl, boss) => lvl * bossTimeMult(boss),
      },
    },
    angelic: {
      minZone: 66,
      icon: "mdi-cross",
      color: "yellow",
      stats: (lvl) => {
        return { revive: { type: "base", amount: lvl }, health: { type: "mult", amount: 0.15 * lvl + 0.5 } };
      },
    },
    fury: {
      minZone: 68,
      icon: "mdi-emoticon-angry",
      color: "amber",
      stats: (lvl) => {
        return { critChance: { type: "base", amount: 0.55 * lvl } };
      },
      active: {
        effect(lvl) {
          return [
            { type: "damagePhysic", value: lvl * 0.6 + 1.55 },
            { type: "gainStat", stat: "attack_mult", value: 1.03 },
          ];
        },
        cooldown: () => 4,
        startCooldown: () => 2,
        uses: (lvl) => lvl * 4 + 2,
      },
    },
    toxic: {
      minZone: 70,
      icon: "mdi-bottle-tonic-skull",
      color: "light-green",
      stats: (lvl) => {
        return { toxic: { type: "base", amount: 0.01 * lvl }, bioConversion: { type: "base", amount: 1.5 * lvl } };
      },
    },
    foulBreath: {
      minZone: 80,
      icon: "mdi-cloud-alert",
      color: "green",
      stats: (lvl) => {
        return {
          bioAttack: { type: "mult", amount: Math.pow(1.2, lvl) },
          bioConversion: { type: "base", amount: 0.4 * lvl },
        };
      },
      active: {
        effect(lvl) {
          return [{ type: "poison", value: lvl * 0.02 + 0.02 }];
        },
        cooldown: () => 11,
        startCooldown: () => 3,
        uses: (lvl) => lvl + 1,
      },
    },
    nuke: {
      minZone: 90,
      icon: "mdi-nuke",
      color: "orange-red",
      cap: 5,
      active: {
        effect(lvl) {
          return [
            { type: "damagePhysic", value: Math.pow(2, lvl) * 250 },
            { type: "damageMagic", value: Math.pow(2, lvl) * 250 },
            { type: "damageBio", value: Math.pow(2, lvl) * 250 },
          ];
        },
        cooldown: (lvl, boss) => (75 - lvl * 5) * bossTimeMult(boss),
        startCooldown: (lvl, boss) => (75 - lvl * 5) * bossTimeMult(boss),
        uses: () => 1,
      },
    },
    rainbow: {
      minZone: 100,
      icon: "mdi-looks",
      color: "pink",
      cap: 1,
      stats: (lvl) => {
        return { magicConversion: { type: "base", amount: lvl }, bioConversion: { type: "base", amount: lvl } };
      },
    },
    drain: {
      minZone: 110,
      icon: "mdi-hvac",
      color: "lime",
      stats: (lvl, boss) => {
        return {
          health: { type: "mult", amount: Math.pow(1.1, lvl) },
          divisionShield: { type: "base", amount: 2 * lvl * bossTimeMult(boss) },
        };
      },
      active: {
        effect(lvl) {
          return [
            { type: "damageMagic", value: lvl * 0.2 + 0.85 },
            { type: "damageBio", value: lvl * 0.2 + 0.85 },
            { type: "heal", value: lvl * 0.01 + 0.05 },
          ];
        },
        cooldown: () => 14,
        startCooldown: () => 10,
        uses: (lvl, boss) => (lvl + 2) * bossTimeMult(boss),
      },
    },
    shocking: {
      minZone: 120,
      icon: "mdi-heart-flash",
      color: "yellow",
      stats: (lvl) => {
        return { attack: { type: "mult", amount: Math.pow(1.15, lvl) } };
      },
      active: {
        effect(lvl) {
          return [
            { type: "damageMagic", value: lvl * 1.3 + 2 },
            { type: "silence", value: lvl + 2 },
          ];
        },
        cooldown: () => 15,
        startCooldown: () => 9,
        uses: (lvl, boss) => lvl * bossTimeMult(boss),
      },
    },
    defense: {
      minZone: 225,
      icon: "mdi-shield",
      color: "dark-blue",
      stats: (lvl) => {
        return {
          health: { type: "mult", amount: Math.pow(1.15, lvl) },
          defense: { type: "base", amount: lvl * 0.001 },
        };
      },
    },
    executing: {
      minZone: 275,
      icon: "mdi-skull",
      color: "pale-red",
      stats: (lvl) => {
        return { attack: { type: "mult", amount: Math.pow(1.15, lvl) }, execute: { type: "base", amount: lvl * 0.05 } };
      },
      exclude: ["sharp"],
    }, // Tower-only sigils
    berserk: {
      minZone: Infinity,
      icon: "mdi-robot-angry",
      color: "deep-orange",
      stats: (lvl) => {
        return {
          attack: { type: "mult", amount: Math.pow(2, lvl) },
          health: { type: "mult", amount: Math.pow(0.75, lvl) },
        };
      },
      active: {
        effect(lvl) {
          return [
            { type: "damagePhysic", value: lvl * 0.1 + 0.55 },
            { type: "damageMagic", value: lvl * 0.3 + 1.15 },
          ];
        },
        cooldown: () => 7,
        startCooldown: () => 5,
        uses: () => null,
      },
    },
    iceGiant: {
      minZone: Infinity,
      icon: "mdi-human",
      color: "skyblue",
      stats: (lvl) => {
        return {
          attack: { type: "mult", amount: Math.pow(0.5, lvl) },
          health: { type: "mult", amount: Math.pow(3.5, lvl) },
        };
      },
      active: {
        effect(lvl) {
          return [{ type: "stun", value: lvl * 3 + 7 }];
        },
        cooldown: () => 25,
        startCooldown: () => 15,
        uses: () => null,
      },
    }, // Fallback sigil
    generic: {
      minZone: Infinity,
      icon: "mdi-heart-flash",
      color: "grey",
      stats: (lvl) => {
        return {
          attack: { type: "mult", amount: Mat},
        };
      },
    },
  },
  "modules/horde/inity,
      icon: "mdi-pistol",
      color: "blue",
      active: {
        effect() {
          return [{ type: "damagePhysic", value: 3.35 }];
        },
        cooldown: () => 4,
        startCooldown: () => 4,
        uses: (lvl) => lvl * 4,
      },
    },
    rifle_gun: {
      minZone: Infinity,
      icon: "mdi-pistol",
      color: "orange",
      active: {
        effect() {
          return [
            { type: "damagePhysic", value: 2 },
            { type: "damageMagic", value: 0.75 },
          ];
        },
        cooldown: () => 2,
        startCooldown: () => 2,
        uses: (lvl) => lvl * 6,
      },
    },
    shotgun_gun: {
      minZone: Infinity,
      icon: "mdi-pistol",
      color: "green",
      active: {
        effect() {
          return [
            { type: "damagePhysic", value: 2.6 },
            { type: "damageMagic", value: 2.6 },
            { type: "damageBio", value: 2.6 },
          ];
        },
        cooldown: () => 13,
        startCooldown: () => 13,
        uses: (lvl) => lvl * 2,
      },
    },
    sniper_gun: {
      minZone: Infinity,
      icon: "mdi-target",
      color: "purple",
      active: {
        effect() {
          return [{ type: "damagePhysic", value: 11.5, canCrit: 8 }];
        },
        cooldown: () => 25,
        startCooldown: () => 25,
        uses: (lvl) => lvl * 1,
      },
    },
    war_grenade: {
      minZone: Infinity,
      icon: "mdi-bomb",
      color: "pale-green",
      active: {
        effect() {
          return [
            { type: "damageMagic", value: 2.75 },
            { type: "stun", value: 2 },
            { type: "silence", value: 8 },
          ];
        },
        cooldown: () => 12,
        startCooldown: () => 6,
        uses: (lvl) => lvl,
      },
    },
    war_bandage: {
      minZone: Infinity,
      icon: "mdi-bandage",
      color: "pale-orange",
      active: {
        effect() {
          return [{ type: "heal", value: 0.4 }];
        },
        cooldown: () => 8,
        startCooldown: () => 4,
        uses: (lvl) => lvl,
      },
    },
    monkey_dart: {
      minZone: Infinity,
      icon: "mdi-arrow-projectile",
      color: "orange",
      active: {
        effect(lvl) {
          return [{ type: "damagePhysic", value: lvl * 0.5 + 2.25 }];
        },
        cooldown: () => 5,
        startCooldown: () => 3,
        uses: () => null,
      },
    },
    monkey_fire: {
      minZone: Infinity,
      icon: "mdi-fire",
      color: "orange",
      active: {
        effect() {
          return [{ type: "damageMagic", value: 4.5 }];
        },
        cooldown: () => 8,
        startCooldown: () => 4,
        uses: (lvl) => lvl * 4,
      },
    },
    monkey_ice: {
      minZone: Infinity,
      icon: "mdi-snowflake",
      color: "cyan",
      active: {
        effect() {
          return [
            { type: "damageMagic", value: 6.75 },
            { type: "stun", value: 3 },
          ];
        },
        cooldown: () => 14,
        startCooldown: () => 7,
        uses: (lvl) => lvl * 2,
      },
    },
    monkey_lightning: {
      minZone: Infinity,
      icon: "mdi-flash",
      color: "yellow",
      active: {
        effect() {
          return [
            { type: "damageMagic", value: 5.1 },
            { type: "silence", value: 3 },
          ];
        },
        cooldown: () => 10,
        startCooldown: () => 5,
        uses: (lvl) => lvl * 3,
      },
    },
    cute_ram: {
      minZone: Infinity,
      icon: "mdi-arrow-collapse-right",
      color: "red",
      active: {
        effect(lvl) {
          return [
            { type: "damageBio", value: lvl + 3.5 },
            { type: "stun", value: 3 },
            { type: "gainStat", stat: "bioAttack_mult", value: 1.2 },
          ];
        },
        cooldown: () => 12,
        startCooldown: () => 8,
        uses: (lvl) => lvl * 3,
      },
    },
    cute_eatCarrot: {
      minZone: Infinity,
      icon: "mdi-carrot",
      color: "orange",
      active: {
        effect(lvl) {
          return [
            { type: "heal", value: lvl * 0.05 + 0.4 },
            { type: "gainStat", stat: "attack_mult", value: 1.1 },
          ];
        },
        cooldown: () => 16,
        startCooldown: () => 12,
        uses: (lvl) => lvl * 2,
      },
    },
    cute_bark: {
      minZone: Infinity,
      icon: "mdi-volume-high",
      color: "cyan",
      active: {
        effect() {
          return [
            { type: "maxdamageBio", value: 0.06 },
            { type: "removeDivisionShield", value: 1 },
          ];
        },
        cooldown: () => 11,
        startCooldown: () => 6,
        uses: (lvl) => lvl,
      },
    },
    cute_bite: {
      minZone: Infinity,
      icon: "mdi-tooth",
      color: "brown",
      active: {
        effect(lvl) {
          return [{ type: "damageBio", value: lvl * 1.5 + 5 }];
        },
        cooldown: () => 22,
        startCooldown: () => 8,
        uses: () => null,
      },
    },
    cute_kick: {
      minZone: Infinity,
      icon: "mdi-seat-legroom-extra",
      color: "amber",
      active: {
        effect(lvl) {
          return [
            { type: "damageBio", value: lvl * 0.3 + 2.5 },
            { type: "silence", value: 2 },
          ];
        },
        cooldown: () => 6,
        startCooldown: () => 0,
        uses: (lvl) => lvl * 8,
      },
    },
    cute_claws: {
      minZone: Infinity,
      icon: "mdi-nail",
      color: "light-green",
      active: {
        effect(lvl) {
          return [
            { type: "maxdamageBio", value: 0.1 },
            { type: "damageBio", value: lvl * 1.3 + 4.5 },
          ];
        },
        cooldown: () => 15,
        startCooldown: () => 10,
        uses: (lvl) => lvl * 3,
      },
    }, // Boss actives
    ohilio_megagun: {
      minZone: Infinity,
      icon: "mdi-pistol",
      color: "orange-red",
      active: {
        effect() {
          return [
            { type: "damagePhysic", value: buildNum(1, "M") },
            { type: "damageMagic", value: buildNum(1, "M") },
            { type: "damageBio", value: buildNum(1, "M") },
          ];
        },
        cooldown: () => 5,
        startCooldown: () => 5,
        uses: () => null,
      },
    },
    chriz_magicMissile: {
      minZone: Infinity,
      icon: "mdi-motion",
      color: "indigo",
      active: {
        effect() {
          return [{ type: "damageMagic", value: 3 }];
        },
        cooldown: () => 6,
        startCooldown: () => 0,
        uses: () => 25,
      },
    },
    chriz_fireball: {
      minZone: Infinity,
      icon: "mdi-fire",
      color: "orange",
      active: {
        effect() {
          return [{ type: "damageMagic", value: 11.5 }];
        },
        cooldown: () => 22,
        startCooldown: () => 4,
        uses: () => null,
      },
    },
    chriz_iceBlast: {
      minZone: Infinity,
      icon: "mdi-snowflake",
      color: "cyan",
      active: {
        effect() {
          return [
            { type: "damageMagic", value: 6 },
            { type: "stun", value: 8 },
          ];
        },
        cooldown: () => 30,
        startCooldown: () => 10,
        uses: () => null,
      },
    },
    chriz_lightningStrike: {
      minZone: Infinity,
      icon: "mdi-flash",
      color: "yellow",
      active: {
        effect() {
          return [
            { type: "damageMagic", value: 7.25 },
            { type: "silence", value: 5 },
          ];
        },
        cooldown: () => 15,
        startCooldown: () => 15,
        uses: () => null,
      },
    },
    chriz_heal: {
      minZone: Infinity,
      icon: "mdi-medical-bag",
      color: "light-green",
      active: {
        effect() {
          return [{ type: "heal", value: 0.4 }];
        },
        cooldown: () => 45,
        startCooldown: () => 45,
        uses: () => 3,
      },
    },
    mina_charm: {
      minZone: Infinity,
      icon: "mdi-heart",
      color: "pink",
      active: {
        effect() {
          return [
            { type: "silence", value: 5 },
            { type: "gainStat", stat: "bioAttack_mult", value: 1.6 },
            { type: "gainStat", stat: "execute_base", value: 0.05 },
          ];
        },
        cooldown: () => 30,
        startCooldown: () => 15,
        uses: () => null,
      },
    },
  },
  "modules/horde/tower": {
    brick: {
      unlock: "hordeBrickTower",
      sigils: ["bashing", "toughness", "strength", "growing", "fury"],
      statBase: 140,
      statScaling: 0.25,
      crowns: 1,
      heirlooms: ["brick"],
      reward: {
        50: { type: "unlock", name: "hordeUpgradeRoyalArmor", value: true },
        100: { type: "mult", name: "hordeHealth", value: 1.5 },
        150: { type: "mult", name: "currencyHordeMonsterPartCap", value: 1.35 },
        200: { type: "base", name: "hordeNostalgia", value: 50 },
        300: { type: "unlock", name: "hordeUpgradeRoyalButcher", value: true },
        400: { type: "base", name: "hordeNostalgia", value: 50 },
        500: { type: "mult", name: "currencyHordeBoneCap", value: 1.5 },
      },
    },
    fire: {
      unlock: "hordeFireTower",
      sigils: ["magicBolt", "fireball", "sparks", "wisdom", "berserk"],
      statBase: 170,
      statScaling: 0.3,
      crowns: 2,
      heirlooms: ["heat"],
      reward: {
        50: { type: "unlock", name: "hordeUpgradeRoyalStorage", value: true },
        100: { type: "base", name: "hordeMaxItems", value: 1 },
        150: { type: "mult", name: "hordeAttack", value: 1.35 },
        200: { type: "base", name: "hordeCritMult", value: 0.2 },
        300: { type: "mult", name: "currencyHordeBoneCap", value: 1.5 },
        400: { type: "mult", name: "currencyHordeMonsterPartCap", value: 1.35 },
      },
    },
    ice: {
      unlock: "hordeIceTower",
      sigils: ["health", "resistance", "cold", "angelic", "iceGiant"],
      statBase: 200,
      statScaling: 0.35,
      crowns: 3,
      heirlooms: ["ice"],
      reward: {
        50: { type: "mult", name: "currencyHordeBoneGain", value: 1.5 },
        100: { type: "unlock", name: "hordeUpgradeRoyalCrypt", value: true },
        150: { type: "mult", name: "currencyHordeSoulCorruptedGain", value: 1.2 },
        200: { type: "base", name: "hordeMaxSacrifice", value: 1 },
        300: { type: "mult", name: "hordeHealth", value: 1.5 },
      },
    },
    danger: {
      unlock: "hordeDangerTower",
      sigils: ["executing", "focus", "nuke", "precision", "power"],
      statBase: 245,
      statScaling: 0.4,
      crowns: 5,
      heirlooms: ["crystal"],
      reward: {
        50: { type: "unlock", name: "hordeUpgradeRoyalSecret", value: true },
        100: { type: "mult", name: "hordeAttack", value: 1.5 },
        150: { type: "base", name: "currencyHordeMysticalShardCap", value: 5 },
        200: { type: "mult", name: "hordeAttack", value: 1.5 },
        300: { type: "base", name: "currencyHordeMysticalShardCap", value: 5 },
      },
    },
    toxic: {
      unlock: "hordeToxicTower",
      sigils: ["toxic", "foulBreath", "drain", "spitting", "sharp"],
      statBase: 290,
      statScaling: 0.45,
      crowns: 8,
      heirlooms: ["vitality"],
      reward: {
        50: { type: "base", name: "hordeMaxSacrifice", value: 1 },
        100: { type: "mult", name: "hordeHealth", value: 1.5 },
        150: { type: "mult", name: "hordeHealing", value: 1.2 },
        200: { type: "mult", name: "hordeAttack", value: 1.5 },
      },
    },
  },
  "modules/horde/trinket": {
    vitality: {
      color: "green",
      icon: "mdi-heart",
      effect: [{ name: "hordeHealth", type: "base", value: (lvl) => lvl * 70 + 30 }],
    },
    energy: {
      color: "amber",
      icon: "mdi-lightning-bolt",
      needsEnergy,
      effect: [{ name: "hordeEnergy", type: "base", value: (lvl) => lvl * 35 + 20 }],
    },
    magic: {
      color: "blue",
      icon: "mdi-water",
      needsMana,
      effect: [{ name: "hordeMana", type: "base", value: (lvl) => lvl * 25 + 15 }],
    },
    fists: {
      color: "orange-red",
      icon: "mdi-arm-flex",
      needsEnergy,
      cooldown: () => 15,
      activeCost: () => {
        return { energy: 25 };
      },
      active(lvl) {
        return [{ type: "damagePhysic", value: lvl * 0.4 + 3.1, str: 0.15 }];
      },
      activeType: "combat",
    },
    sparks: {
      color: "light-blue",
      icon: "mdi-shimmer",
      rarity: 10,
      needsMana,
      cooldown: () => 9,
      activeCost: () => {
        return { mana: 5 };
      },
      active(lvl) {
        return [{ type: "damageMagic", value: lvl * 0.55 + 3.65, int: 0.2 }];
      },
      activeType: "combat",
    },
    haste: {
      color: "pale-yellow",
      icon: "mdi-timer-sand",
      rarity: 20,
      effect: [{ name: "hordeHaste", type: "base", value: (lvl) => lvl * 4 + 8 }],
    },
    precision: {
      color: "orange",
      icon: "mdi-bullseye",
      rarity: 30,
      effect: [{ name: "hordeCritChance", type: "base", value: (lvl) => lvl * 0.03 + 0.07 }],
    },
    wrath: {
      color: "orange-red",
      icon: "mdi-emoticon-angry",
      rarity: 40,
      effect: [{ name: "hordeCritMult", type: "base", value: (lvl) => lvl * 0.08 + 0.3 }],
    },
    strength: {
      color: "red",
      icon: "mdi-arm-flex",
      rarity: 50,
      effect: [{ name: "hordeStrength", type: "base", value: (lvl) => lvl * 3 + 5 }],
    },
    toxins: {
      color: "light-green",
      icon: "mdi-clouds",
      rarity: 60,
      cooldown: () => 135,
      activeCost: () => {
        return {};
      },
      active(lvl) {
        return [
          { type: "maxdamageBio", value: lvl * 0.015 + 0.09 },
          { type: "removeAttack", value: lvl * 0.005 + 0.05 },
        ];
      },
      activeType: "combat",
    },
    wisdom: {
      color: "indigo",
      icon: "mdi-lightbulb-on",
      rarity: 70,
      effect: [{ name: "hordeIntelligence", type: "base", value: (lvl) => lvl * 3 + 5 }],
    },
    extraction: {
      color: "red",
      icon: "mdi-water",
      rarity: 80,
      effect: [{ name: "currencyHordeBloodGain", type: "mult", value: (lvl) => lvl * 0.04 + 1.16 }],
    },
    learning: {
      color: "deep-purple",
      icon: "mdi-school",
      rarity: 90,
      isTimeless: true,
      effect: [{ name: "hordeSkillPointsPerLevel", type: "base", value: () => 1 }],
    },
    preservation: {
      color: "red",
      icon: "mdi-iv-bag",
      rarity: 100,
      effect: [{ name: "currencyHordeBloodCap", type: "mult", value: (lvl) => lvl * 0.06 + 1.24 }],
    },
    energize: {
      color: "amber",
      icon: "mdi-battery",
      rarity: 110,
      isTimeless: true,
      needsEnergy,
      cooldown: () => 270,
      activeCost: () => {
        return {};
      },
      active() {
        return [{ type: "refillEnergy", value: 1 }];
      },
      activeType: "combat",
    },
    automation: {
      color: "dark-grey",
      icon: "mdi-cogs",
      rarity: 120,
      isTimeless: true,
      effect: [{ name: "hordeAutocast", type: "base", value: () => 1 }],
    },
    cure: {
      color: "teal",
      icon: "mdi-heart",
      rarity: 130,
      isTimeless: true,
      cooldown: () => 45,
      activeCost: () => {
        return {.05, int: 0.0005 },
          { type: "removeStun: "combat",
    }, // Boss-specific trinkets
    duality: {
      color: "purple",
      icon: "mdi-call-split",
      rarity: 75,
      uniqueToBoss: "chriz2",
      effect: [
        { name: "hordeStrength", type: "base", value: (lvl) => lvl * 2 + 4 },
        { name: "hordeIntelligence", type: "base", value: (lvl) => lvl * 2 + 4 },
      ],
    },
    love: {
      color: "babypink",
      icon: "mdi-heart-multiple",
      rarity: 120,
      uniqueToBoss: "mina",
      cooldown: () => 70,
      activeCost: () => {
        return {};
      },
      active(lvl) {
        return [
          { type: "damageBio", value: lvl * 0.9 + 8.7 },
          { type: "buff", value: lvl + 14, effect: [{ type: "mult", name: "hordeBioAttack", value: 1.35 }] },
        ];
      },
      activeType: "combat",
    },
  },
  "modules/horde/upgrade": {
    attack: {
      price(lvl) {
        return { horde_bone: Math.pow(lvl * 0.002 + 1.25, lvl) * 175 };
      },
      effect: [
        { name: "hordeAttack", type: "base", value: (lvl) => lvl },
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
      ],
    },
    health: {
      price(lvl) {
        return { horde_bone: Math.pow(lvl * 0.002 + 1.25, lvl) * 210 };
      },
      effect: [
        { name: "hordeHealth", type: "base", value: (lvl) => lvl * 150 },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.12, lvl) },
      ],
    },
    training: {
      cap: 100,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 3,
      price(lvl) {
        return { horde_bone: splicedPow(1.35, 2.8, 100, lvl) * 2500 };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => splicedPowLinear(1.1, 0.1, 100, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => splicedPowLinear(1.1, 0.1, 100, lvl) },
      ],
    },
    resilience: {
      cap: 1,
      requirementBase,
      requirementStat,
      requirementValue: 5,
      price() {
        return { horde_bone: buildNum(24, "K") };
      },
      effect: [
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
        { name: "hordeRevive", type: "bas     requirementStat,
      requirementValue: vl) * buildNum(52, "K") };
      },
      effect: [{ name: "currencyHordeBoneGain", type: "mult", value: (lvl) => Math.pow(1.22, lvl) }],
    },
    boneBag: {
      cap: 4,
      requirementBase,
      requirementStat,
      requirementValue: 7,
      price(lvl) {
        return { horde_bone: Math.pow(10, lvl) * buildNum(480, "K") };
      },
      effect: [
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(10, lvl) },
        { name: "hordeMaxItems", type: "base", value: (lvl) => Math.min(1, lvl) },
      ],
    },
    anger: {
      cap: 10,
      requirementBase,
      requirementStat,
      requirementValue: 9,
      price(lvl) {
        return { horde_bone: Math.pow(1.65, lvl) * buildNum(145, "K") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.18, lvl) },
        { name: "hordeCritChance", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    },
    rest: {
      cap: 2,
      requirementBase,
      requirementStat,
      requirementValue: 11,
      price(lvl) {
        return { horde_bone: Math.pow(75, lvl) * buildNum(2.6, "M") };
      },
      effect: [
        { name: "hordeHealth", type: "mult", value: (lvl) => lvl * 0.75 + 1 },
        { name: "hordeRecovery", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    },
    monsterSoup: {
      cap: 10,
      requirementBase,
      requirementStat,
      requirementValue: 13,
      price(lvl) {
        return { horde_monsterPart: Math.pow(1.1, lvl) * (lvl + 10) * 3 };
      },
      effect: [
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyHordeMonsterPartCap", type: "base", value: (lvl) => lvl * 5 },
      ],
    },
    monsterBag: {
      cap: 75,
      requirementBase,
      requirementStat,
      requirementValue: 17,
      price(lvl) {
        return { horde_monsterPart: Math.pow(lvl * 0.005 + 1.35, lvl) * 80 };
      },
      effect: [
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(1.6, lvl) },
        { name: "currencyHordeMonsterPartCap", type: "mult", value: (lvl) => Math.pow(1.3, lvl) },
        { name: "hordeMaxItems", type: "base", value: (lvl) => Math.min(1, lvl) },
      ],
    },
    luckyStrike: {
      cap: 15,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 21,
      price(lvl) {
        return { horde_bone: splicedPow(1.85, 4.6, 15, lvl) * buildNum(30, "B") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => splicedPowLinear(1.14, 0.07, 15, lvl) },
        { name: "hordeItemChance", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
      ],
    },
    hoarding: {
      cap: 20,
      requirementBase,
      requirementStat,
      requirementValue: 25,
      price(lvl) {
        return { horde_bone: Math.pow(2.1, lvl) * buildNum(1.1, "T") };
      },
      effect: [
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.08, lvl) },
      ],
    },
    thickSkin: {
      cap: 30,
      requirementBase,
      requirementStat,
      requirementValue: 30,
      price(lvl) {
        return { horde_bone: Math.pow(1.85, lvl) * buildNum(52.5, "T") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.08, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.17, lvl) },
        { name: "hordeMaxItems", type: "base", value: (lvl) => Math.min(1, lvl) },
      ],
    },
    purifier: {
      persistent: true,
      hasDescription: true,
      cap: 1,
      note: "horde_18",
      requirementBase,
      requirementStat,
      requirementValue: 42,
      price() {
        return { horde_bone: buildNum(10, "Qi") };
      },
      effect: [{ name: "hordeCorruptedFlesh", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    cleansingRitual: {
      requirement() {
        return store.state.unlock.hordeCorruptedFlesh.use;
      },
      price(lvl) {
        return { horde_corruptedFlesh: Math.pow(1.12, lvl) * 2000 };
      },
      effect: [{ name: "hordeCorruption", type: "bonus", value: (lvl) => -0.08 * lvl }],
    },
    stabbingGuide: {
      cap: 5,
      requirementBase,
      requirementStat,
      requirementValue: 48,
      price(lvl) {
        return { horde_bone: Math.pow(7, lvl) * buildNum(130, "Qi") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.46, lvl) },
        { name: "hordeCritChance", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    },
    plunderSecret: {
      cap: 1,
      requirementBase,
      requirementStat,
  25, "Sx") };
      },
      effect: [
        { name: null) },
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => (lvl >= 1 ? 100 : null) },
        { name: "hordeMaxItems", type: "base", value: (lvl) => Math.min(1, lvl) },
      ],
    },
    dodgingGuide: {
      cap: 15,
      requirementBase,
      requirementStat,
      requirementValue: 59,
      price(lvl) {
        return { horde_bone: Math.pow(2.1, lvl) * buildNum(980, "Sx") };
      },
      effect: [{ name: "hordeHealte: {
      cap: 25,
      capMult: true,
    e(lvl) {
        return { horde_bone: splicedPow(2.25, 4.75, 25, lvl) * buildNum(1.25, "O") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => splicedPowLinear(1.2, 0.1, 25, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => splicedPowLinear(1.15, 0.075, 25, lvl) },
      ],
    },
    looting: {
      cap: 25,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 69,
      price(lvl) {
        return { horde_bone: splicedPow(3.3, 8.7, 25, lvl) * buildNum(22, "O") };
      },
      effect: [
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => splicedPowLinear(2, 0.25, 25, lvl) },
        { name: "currencyHordeMonsterPartCap", type: "mult", value: (lvl) => splicedPowLinear(1.05, 0.05, 25, lvl) },
      ],
    },
    whitePaint: {
      cap: 25,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 80,
      price(lvl) {
        return { horde_bone: Math.pow(2.8, lvl) * buildNum(1.11, "UD") };
      },
      effect: [
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => splicedPowLinear(1.15, 0.075, 25, lvl) },
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.125, 25, lvl) },
      ],
    },
    targetDummy: {
      requirementBase,
      requirementStat,
      requirementValue: 92,
      price(lvl) {
        return { horde_bone: Math.pow(lvl * 0.005 + 1.7, lvl) * buildNum(250, "TD") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
      ],
    },
    grossBag: {
      cap: 1,
      requirementBase,
      requirementStat,
      requirementValue: 98,
      price() {
        return { horde_bone: buildNum(155, "QaD") };
      },
      effect: [
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(100, lvl) },
        { name: "currencyHordeMonsterPartGain", type: "mult", value: (lvl) => Math.pow(3, lvl) },
        { name: "hordeMaxItems", type: "base", value: (lvl) => Math.min(1, lvl) },
      ],
    },
    milestone: {
      requirementBase,
      requirementStat,
      requirementValue: 110,
      price(lvl) {
        return { horde_bone: Math.pow(buildNum(1, "M"), lvl) * buildNum(1, "SxD") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => Math.pow(4, lvl) },
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(1000, lvl) },
      ],
    },
    combatLesson: {
      cap: 15,
      (lvl) {
        return { horde_bone: Math      { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.22, lvl) },
      ],
    },
    carving: {
      cap: 5,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 125,
      price(lvl) {
        return { horde_bone: Math.pow(12, lvl) * buildNum(2, "ND") };
      },
      effect: [
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => splicedPowLinear(8, 0.25, 5, lvl) },
        { name: "currencyHordeCorruptedFleshGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
      ],
    },
    mysticalBag: {
      cap: 1,
      requirementBase,
      requirementStat,
      requirementValue: 135,
      price(lvl) {
        return { horde_mysticalShard: 25 * (lvl + 1) };
      },
      effect: [{ name: "hordeMaxItems", type: "base", value: (lvl) => lvl }],
      onBuy() {
        store.dispatch("horde/checkPlayerHealth");
      },
    },
    unlimitedAnger: {
      cap: 20,
      requirementBase,
      requirementStat,
      requirementValue: 145,
      price(lvl) {
        return { horde_bone: Math.pow(lvl * 0.1 + 4.7, lvl) * buildNum(4, "QaV") };
      },
      effect: [{ name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.2, lvl) }],
    },
    strangePower: {
      requirementBase,
      requirementStat,
      requirementValue: 155,
      price(lvl) {
        return { horde_mysticalShard: lvl * 4 + 28 };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.35, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.35, lvl) },
      ],
      onBuy() {
        store.dispatch("horde/checkPlayerHealth");
      },
    },
    collector: {
      requirementBase,
      requirementStat,
      requirementValue: 165,
      price(lvl) {
        return { horde_mysticalShard: lvl * 8 + 34 };
      },
      effect: [
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => Math.pow(1.65, lvl) },
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(1.85, lvl) },
      ],
      onBuy() {
        store.dispatch("horde/checkPlayerHealth");
      },
    },
    prepareTheSacrifice: {
      persistent: true,
      alwaysActive: true,
      cap: 4,
      requirementBase,
      requirementStat,
      requirementValue: 175,
      price(lvl) {
        return { horde_mysticalShard: lvl * 40 + 20 };
      },
      effect: [
        { name: "horde_mysticalBag", type: "keepUpgrade", value: (lvl) => lvl >= 1 },
        { name: "horde_strangePower", type: "keepUpgrade", value: (lvl) => lvl >= 2 },
        { name: "horde_collector", type: "keepUpgrade", value: (lvl) => lvl >= 3 },
        { name: "hordeSacrifice", type: "unlock", value: (lvl) => lvl >= 4 },
      ],
      onBuy() {
        store.dispatch("horde/checkPlayerHealth");
      },
    },
  },
  "modules/horde/upgrade2": {
    transfusion: {
      subfeature: 1,
      cap: 50,
      price(lvl) {
        return { horde_blood: Math.pow(1.3, lvl) * 300 };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => getSequence(5, lvl) * 0.02 + 1 },
        { name: "hordeHealth", type: "mult", value: (lvl) => getSequence(5, lvl) * 0.02 + 1 },
      ],
    },
    darkAttack: {
      subfeature: 1,
      requirementBase,
      requirementValue: 1,
      price(lvl) {
        return { horde_blood: Math.pow(lvl * 0.0025 + 1.325, lvl) * buildNum(24, "K") };
      },
      effect: [{ name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.18, lvl) }],
    },
    darkHealth: {
      subfeature: 1,
      requirementBase,
      requirementValue: 3,
      price(lvl) {
        return { horde_blood: Math.pow(lvl * 0.0025 + 1.325, lvl) * buildNum(110, "K") };
      },
      effect: [{ name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.19, lvl) }],
    },
    harvest: {
      subfeature: 1,
urn { horde_blood: Math.pow(lvl * 0.003 eBloodGain", type: "mult", value: (lvl) => Math.pow(1.11, lvl) }],
    },
    protectiveShell: {
      subfeature: 1,
      cap: 20,
      requirementBase,
      requirementValue: 14,
      price(lvl) {
        return { horde_blood: Math.pow(2.35, lvl) * buildNum(190, "M") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.07, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.14, lvl) },
      ],
    },
    bloodStorage: {
      subfeature: 1,
      cap: 20,
      requirementBase,
      requirementValue: 18,
      price(lvl) {
        return { horde_blood: Math.pow(lvl * 0.04 + 1.9, lvl) * buildNum(2.2, "B") };
      },
      effect: [
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyHordeBloodCap", type: "mult", value: (lvl) => Math.pow(1.175, lvl) },
      ],
    },
    darkMilestone: {
      subfeature: 1,
      requirementBase,
      requirementValue: 24,
      price(lvl) {
        return { horde_blood: Math.pow(1000, lvl) * buildNum(1, "T") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(3, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(3, lvl) },
        { name: "currencyHordeBloodCap", type: "mult", value: (lvl) => Math.pow(10, lvl) },
      ],
    },
    endlessAnger: {
      subfeature: 1,
      cap: 20,
      requirementBase,
      requirementValue: 31,
      price(lvl) {
        return { horde_blood: Math.pow(2.8, lvl) * buildNum(25, "Qi") };
      },
      effect: [{ name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.33, lvl) }],
    },
    fistFight: {
      subfeature: 1,
      cap: 30,
      requirementBase,
      requirementValue: 42,
      price(lvl) {
        return { horde_blood: Math.pow(2.45, lvl) * buildNum(400, "Sx") };
      },
      effect: [
        { name: "currencyHordeBloodGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.23, lvl) },
      ],
    },
    syringe: {
      subfeature: 1,
      cap: 30,
      requirementBase,
      requirementValue: 55,
      price(lvl) {
        return { horde_blood: Math.pow(lvl * 0.02 + 1.7, lvl) * buildNum(65, "Sp") };
      },
      effect: [
        { name: "currencyHordeBloodGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "currencyHordeBloodCap", type: "mult", value: (lvl) => Math.pow(1.18, lvl) },
      ],
    },
    bloodRitual: {
      subfeature: 1,
      requirementBase,
      requirementValue: 70,
      price(lvl) {
        return { horde_blood: Math.pow(10, lvl) * buildNum(1, "O") };
      },
      effect: [{ name: "hordeCorruption", type: "bonus", value: (lvl) => -0.07 * lvl }],
    },
  },
  "modules/horde/upgradePremium gem_ruby: [2, 3][lvl % 2] * Math.pow(2, ack", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.3 + 1 },
        { name: "hordeHealth", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.3 + 1 },
      ],
    },
    moreBones: {
      type: "premium",
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 75 };
      },
      effect: [
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => getSequence(1, lvl) + 1 },
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => getSequence(1, lvl) + 1 },
      ],
    },
    moreMonsterParts: {
      type: "premium",
      requirement() {
        return store.state.stat.horde_monsterPart.total > 0;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 90 };
      },
      effect: [{ name: "currencyHordeMonsterPartGain", type: "mult", value: (lvl) => lvl * 0.5 + 1 }],
    },
    moreSouls: {
      type: "premium",
      requirement() {
        return store.state.stat.horde_maxZone.total > 19;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 110 };
      },
      effect: [
        { name: "currencyHordeSoulCorruptedGain", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
        { name: "currencyHordeSoulCorruptedCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    moreMastery: {
      type: "premium",
      requirement() {
        return store.state.stat.horde_maxZone.total > 75;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 125 };
      },
      effect: [{ name: "hordeItemMasteryGain", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.25 + 1 }],
    },
    ancientPower: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.horde.heirloom.power.amount > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 300 };
      },
      effect: [{ name: "powerHeirloomEffect", type: "mult", value: (lvl) => getSequence(1, lvl + 1) }],
    },
    ancientFortitude: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.horde.heirloom.fortitude.amount > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 300 };
      },
      effect: [{ name: "fortitudeHeirloomEffect", type: "mult", value: (lvl) => getSequence(1, lvl + 1) }],
    },
    ancientWealth: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.horde.heirloom.wealth.amount > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 300 };
      },
      effect: [{ name: "wealthHeirloomEffect", type: "mult", value: (lvl) => getSequence(1, lvl + 1) }],
    },
    ancientSpirit: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.horde.heirloom.spirit.amount > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 450 };
      },
      effect: [{ name: "spiritHeirloomEffect", type: "mult", value: (lvl) => getSequence(1, lvl + 1) }],
    },
    ancientSharpsight: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.horde.heirloom.sharpsight.amount > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 600 };
      },
      effect: [{ name: "sharpsightHeirloomEffect", type: "mult", value: (lvl) => getSequence(1, lvl + 1) }],
    },
    ancientReaping: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.horde.heirloom.reaping.amount > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 750 };
      },
      effect: [{ name: "reapingHeirloomEffect", type: "mult", value: (lvl) => getSequence(1, lvl + 1) }],
    },
    ancientRemembrance: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.horde.heirloom.remembrance.amount > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 750 };
      },
      effect: [{ name: "remembranceHeirloomEffect", type: "mult", value: (lvl) => getSequence(1, lvl + 1) }],
    },
    ancientHolding: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.horde.heirloom.holding.amount > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 975 };
      },
      effect: [{ name: "holdingHeirloomEffect", type: "mult", value: (lvl) => getSequence(1, lvl + 1) }],
    },
    ancientExpertise: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.horde.heirloom.expertise.amount > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 1300 };
      },
      effect: [{ name: "expertiseHeirloomEffect", type: "mult", value: (lvl) => getSequence(1, lvl + 1) }],
    },
    ancientMystery: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.horde.heirloom.mystery.amount > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 1800 };
      },
      effect: [{ name: "mysteryHeirloomEffect", type: "mult", value: (lvl) => getSequence(1, lvl + 1) }],
    },
  },
  "modules/horde/upgradePrestige": {
    wrath: {
      type: "prestige",
      cap: 10,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.55, lvl) * 60 };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
        { name: "hordeCritChance", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    },
    peace: {
      type: "prestige",
      cap: 10,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.55, lvl) * 60 };
      },
      effect: [
        { name: "hordeHealth", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
        { name: "hordeRespawn", type: "base", value: (lvl) => lvl * -5 },
      ],
    },
    milk: {
      type: "prestige",
      cap: 45,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.65, lvl) * 80 };
      },
      effect: [
        { name: "currencyHordeBoneGain", type: "base", value: (lvl) => Math.pow(2, lvl) * 50 },
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
      ],
    },
    butcher: {
      type: "prestige",
      cap: 10,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.75, lvl) * 100 };
      },
      effect: [
        { name: "currencyHordeMonsterPartGain", type: "base", value: (lvl) => lvl * 0.05 },
        { name: "currencyHordeMonsterPartCap", type: "base", value: (lvl) => lvl * 30 },
      ],
    },
    beginnerLuck: {
      type: "prestige",
      cap: 120,
      requirementBase,
      requirementStat,
      requirementValue: 26,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.9, lvl) * 375 };
      },
      effect: [
        { name: "hordeItemChance", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyHordeSoulCorruptedGain", type: "mult", value: (lvl) => lvl * 0.08 + 1 },
      ],
    },
    balance: {
      type: "prestige",
      requirementBase,
      requirementStat,
      requirementValue: 31,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.55, lvl) * 1100 };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.12, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.12, lvl) },
      ],
    },
    advancedLuck: {
      type: "prestige",
      requirementBase,
      requirementStat,
      requirementValue: 36,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.9, lvl) * 4250 };
      },
      effect: [
        { name: "hordeHeirloomChance", type: "base", value: (lvl) => Math.min(lvl * 0.0025, 0.1) },
        { name: "hordeNostalgia", type: "base", value: (lvl) => lvl * 5 },
      ],
    },
    boneTrader: {
      type: "prestige",
      cap: 150,
      requirementBase,
      requirementStat,
      requirementValue: 41,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.65, lvl) * buildNum(18.5, "K") };
      },
      effect: [
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => Math.pow(1.3, lvl) },
        { name: "currencyHordeMonsterPartCap", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
      ],
    },
    soulCage: {
      type: "prestige",
      cap: 80,
      requirementBase,
      requirementStat,
      requirementValue: 46,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(2.35, lvl) * buildNum(65, "K") };
      },
      effect: [
        { name: "currencyHordeSoulCorruptedGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyHordeSoulCorruptedCap", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
      ],
    },
    offenseBook: {
      type: "prestige",
      cap: 50,
      requirementBase,
      requirementStat,
      requirementValue: 51,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.3, lvl) * buildNum(350, "K") };
      },
      effect: [{ name: "powerHeirloomEffect", type: "mult", value: (lvl) => Math.pow(1.1, lvl) * (lvl * 0.15 + 1) }],
    },
    defenseBook: {
      type: "prestige",
      cap: 50,
      requirementBase,
      requirementStat,
      requirementValue: 56,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.3, lvl) * buildNum(1.25, "M") };
      },
      effect: [
        { name: "fortitudeHeirloomEffect", type: "mult", value: (lvl) => Math.pow(1.1, lvl) * (lvl * 0.15 + 1) },
      ],
    },
    ashCircle: {
      type: "prestige",
      requirementBase,
      requirementStat,
      requirementValue: 61,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(lvl * 0.02 + 1.25, lvl) * buildNum(9, "M") };
      },
      effect: [{ name: "hordeCorruption", type: "base", value: (lvl) => lvl * -0.12 }],
    },
    lastWill: {
      type: "prestige",
      cap: 15,
      requirementBase,
      requirementStat,
      requirementValue: 66,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(lvl * 0.5 + 3, lvl) * buildNum(75, "M") };
      },
      effect: [{ name: "hordeHeirloomAmount", type: "base", value: (lvl) => lvl }],
    },
    candleCircle: {
      type: "prestige",
      requirementBase,
      requirementStat,
      requirementValue: 71,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(lvl * 0.002 + 1.3, lvl) * buildNum(1.7, "B") };
      },
      effect: [
        { name: "currencyHordeSoulCorruptedGain", type: "mult", value: (lvl) => Math.pow(1.03, lvl) },
        { name: "hordeRespawn", type: "base", value: (lvl) => lvl * -5 },
      ],
    },
    containmentChamber: {
      type: "prestige",
      cap: 100,
      requirementBase,
      requirementStat,
      requirementValue: 81,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.3 + lvl * 0.01, lvl) * buildNum(100, "B") };
      },
      effect: [
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "hordeHeirloomEffect", type: "mult", value: (lvl) => lvl * 0.03 + 1 },
      ],
    },
    mausoleum: {
      type: "prestige",
      cap: 80,
      requirementBase,
      requirementStat,
      requirementValue: 91,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(lvl * 0.005 + 1.4, lvl) * buildNum(2.4, "T") };
      },
      effect: [
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => Math.pow(1.3, lvl) },
        { name: "currencyHordeMonsterPartGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "currencyHordeSoulCorruptedGain", type: "mult", value: (lvl) => Math.pow(1.075, lvl) },
      ],
    },
    combatStudies: {
      type: "prestige",
      requirementBase,
      requirementStat,
      requirementValue: 111,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.45 + lvl * 0.025, lvl) * buildNum(85, "Qa") };
      },
      effect: [{ name: "hordeItemMasteryGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) * (lvl * 0.1 + 1) }],
    },
    boneChamber: {
      type: "prestige",
      requirementBase,
      requirementStat,
      requirementValue: 131,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(2.7 + lvl * 0.05, lvl) * buildNum(275, "Qi") };
      },
      effect: [{ name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    deepHatred: {
      type: "prestige",
      cap: 30,
      requirementBase,
      requirementStat,
      requirementValue: 151,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(lvl * 0.02 + 1.6, lvl) * buildNum(2.25, "Sx") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.06, lvl) * (lvl * 0.1 + 1) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.03, lvl) * (lvl * 0.05 + 1) },
      ],
    },
    spiritLure: {
      type: "prestige",
      cap: 50,
      requirementBase,
      requirementStat,
      requirementValue: 181,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(1.25, lvl) * buildNum(333, "Sp") };
      },
      effect: [{ name: "currencyHordeSoulCorruptedGain", type: "mult", value: (lvl) => lvl * 0.08 + 1 }],
    },
    mysticalCondenser: {
      type: "prestige",
      requirementBase,
      requirementStat,
      requirementValue: 211,
      price(lvl) {
        return { horde_soulEmpowered: Math.pow(lvl * 0.1 + 2, lvl) * buildNum(15, "N") };
      },
      effect: [{ name: "currencyHordeMysticalShardCap", type: "base", value: (lvl) => lvl }],
    }, // Royal upgrades
    royalSword: {
      type: "prestige",
      requirementBase,
      requirementStat,
      requirementValue: 140,
      price(lvl) {
        return { horde_crown: Math.round(Math.pow(1.08, lvl) * (lvl + 1) * 10) };
      },
      effect: [{ name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (0.1 * lvl + 1) }],
    },
    royalArmor: {
      type: "prestige",
      requirement() {
        return store.state.unlock.hordeUpgradeRoyalArmor.use;
      },
      price(lvl) {
        return { horde_crown: Math.round(Math.pow(1.08, lvl) * (lvl + 1) * 14) };
      },
      effect: [{ name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (0.1 * lvl + 1) }],
    },
    royalStorage: {
      type: "prestige",
      requirement() {
        return store.state.unlock.hordeUpgradeRoyalStorage.use;
      },
      price(lvl) {
        return { horde_crown: Math.round(Math.pow(1.08, lvl) * (lvl + 1) * 28) };
      },
      effect: [
        { name: "currencyHordeBoneGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (0.1 * lvl + 1) },
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (0.1 * lvl + 1) },
      ],
    },
    royalButcher: {
      type: "prestige",
      requirement() {
        return store.state.unlock.hordeUpgradeRoyalButcher.use;
      },
      price(lvl) {
        return { horde_crown: Math.round(Math.pow(1.08, lvl) * (lvl + 1) * 55) };
      },
      effect: [
        { name: "currencyHordeMonsterPartGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (0.05 * lvl + 1) },
      ],
    },
    royalCrypt: {
      type: "prestige",
      requirement() {
        return store.state.unlock.hordeUpgradeRoyalCrypt.use;
      },
      price(lvl) {
        return { horde_crown: Math.round(Math.pow(1.08, lvl) * (lvl + 1) * 111) };
      },
      effect: [
        { name: "currencyHordeSoulCorruptedGain", type: "mult", value: (lvl) => getSequence(5, lvl) * 0.01 + 1 },
        { name: "currencyHordeSoulCorruptedCap", type: "mult", value: (lvl) => getSequence(5, lvl) * 0.01 + 1 },
      ],
    },
    royalSecret: {
      type: "prestige",
      requirement() {
        return store.state.unlock.hordeUpgradeRoyalSecret.use;
      },
      price(lvl) {
        return { horde_crown: Math.round(Math.pow(1.08, lvl) * (lvl + 1) * 222) };
      },
      effect: [{ name: "currencyHordeMysticalShardCap", type: "base", value: (lvl) => lvl }],
    },
    precision: {
      type: "prestige",
      requirement() {
        return store.state.unlock.hordeClassesSubfeature.see;
      },
      price(lvl) {
        return { horde_courage: Math.pow(lvl * 0.01 + 1.55, lvl) * 1000 };
      },
      effect: [{ name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.15, lvl) }],
    },
    resolve: {
      type: "prestige",
      requirement() {
        return store.state.unlock.hordeClassesSubfeature.see;
      },
      price(lvl) {
        return { horde_courage: Math.pow(lvl * 0.01 + 1.55, lvl) * 1250 };
      },
      effect: [{ name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.15, lvl) }],
    },
    determination: {
      type: "prestige",
      requirementBase: requirementBase2,
      requirementValue: 7,
      price(lvl) {
        return { horde_courage: Math.pow(lvl * 0.02 + 2.35, lvl) * 6000 };
      },
      effect: [
        { name: "currencyHordeSoulCorruptedGain", type: "mult", value: (lvl) => Math.pow(1.08, lvl) },
        { name: "currencyHordeCourageGain", type: "mult", value: (lvl) => Math.pow(1.08, lvl) },
      ],
    },
    education: {
      type: "prestige",
      requirementBase: requirementBase2,
      requirementValue: 10,
      price(lvl) {
        return { horde_courage: Math.pow(lvl * 0.01 + 1.6, lvl) * buildNum(11, "K") };
      },
      effect: [{ name: "hordeExpBase", type: "mult", value: (lvl) => Math.pow(1 / 1.1, lvl) }],
    },
    bloodChamber: {
      type: "prestige",
      requirementBase: requirementBase2,
      requirementValue: 12,
      price(lvl) {
        return { horde_courage: Math.pow(lvl * 0.05 + 2.5, lvl) * buildNum(16, "K") };
      },
      effect: [
        { name: "currencyHordeBoneCap", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyHordeBloodCap", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
      ],
    },
    stoneSkin: {
      type: "prestige",
      requirementBase: requirementBase2,
      requirementValue: 16,
      price(lvl) {
        return { horde_courage: Math.pow(lvl + 5, lvl) * buildNum(70, "K") };
      },
      effect: [
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
        { name: "hordeHealing", type: "mult", value: (lvl) => Math.pow(1 / 1.2, lvl) },
      ],
    },
    university: {
      type: "prestige",
      requirementBase: requirementBase2,
      requirementValue: 20,
      price(lvl) {
        return { horde_courage: Math.pow(lvl * 0.01 + 1.85, lvl) * buildNum(250, "K") };
      },
      effect: [{ name: "hordeExpIncrement", type: "mult", value: (lvl) => Math.pow(1 / 1.1, lvl) }],
    },
    discovery: {
      type: "prestige",
      requirementBase: requirementBase2,
      requirementValue: 27,
      price(lvl) {
        return { horde_courage: Math.pow(lvl * 0.25 + 4, lvl) * buildNum(5, "M") };
      },
      effect: [
        { name: "hordeHeirloomAmount", type: "base", value: (lvl) => lvl },
        { name: "hordeTrinketGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    innerFocus: {
      type: "prestige",
      requirementBase: requirementBase2,
      requirementValue: 33,
      price(lvl) {
        return { horde_courage: Math.pow(lvl * 0.5 + 2, lvl) * buildNum(28, "M") };
      },
      effect: [{ name: "hordeHealing", type: "mult", value: (lvl) => Math.pow(1.1, lvl) }],
    },
    purge: {
      type: "prestige",
      requirementBase: requirementBase2,
      requirementValue: 45,
      price(lvl) {
        return { horde_courage: Math.pow(lvl * 0.015 + 1.25, lvl) * buildNum(150, "B") };
      },
      effect: [{ name: "hordeCorruption", type: "base", value: (lvl) => lvl * -0.09 }],
    },
    chaosCrate: {
      type: "prestige",
      cap: 10,
      requirementBase: requirementBase2,
      requirementValue: 65,
      price(lvl) {
        return { horde_courage: Math.pow(10, lvl) * buildNum(1, "Qa") };
      },
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.35, lvl) },
        {
          name: "hordeItemChance",
          type: "mult",
          value: (lvl) => (lvl >= 1 ? Math.floHeirloomAmount",
          type: "base",
     },
        {
          name: "hordeItemMasteryGain",
          type: "mult",
          value: (lvl) => (lvl >= 3 ? Math.floor((lvl + 2) / 5) * 0.5 + 1 : null),
        },
        {
          name: "currencyHordeMysticalShardCap",
          type: "base",
          value: (lvl) => (lvl >= 4 ? Math.floor((lvl + 1) / 5) * 10 : null),
        },
        { name: "hordeSkillPointsPerLevel", type: "base", value: (lvl) => (lvl >= 5 ? Math.floor(lvl / 5) : null) },
      ],
    },
  },
  "modules/horde": {
    name: "horde",
    tickspeed: 1,
    unlockNeeded: "hordeFeature",
    forceTick(seconds, oldTime, newTime) {
      // Get tower keys
      if (store.state.unlock.hordeBrickTower.see) {
        const dayDiff = Math.floor(newTime / (SECONDS_PER_DAY * 7)) - Math.floor(oldTime / (SECONDS_PER_DAY * 7));
        if (dayDiff > 0) {
          store.dispatch("currency/gain", { feature: "horde", name: "towerKey", amount: dayDiff }, { root: true });
        }
      }
    },
    tick(seconds) {
      store.commit("stat/add", { feature: "horde", name: "timeSpent", value: seconds });
      const subfeature = store.state.system.features.horde.currentSubfeature; // Gain mystical shards
      if (subfeature === 0) {
        let secondsLeft = seconds;
        let baseChance = store.getters["mult/get"]("hordeShardChance");
        let shards = 0;
        while (
          secondsLeft > 0 &&
          store.state.currency.horde_mysticalShard.value < store.state.currency.horde_mysticalShard.cap
        ) {
          if (baseChance * secondsLeft >= 1) {
            // guaranteed shard
            secondsLeft -= Math.ceil(1 / baseChance);
            baseChance /= HORDE_SHARD_CHANCE_REDUCTION;
            shards++;
          } else {
            if (chance(baseChance * secondsLeft)) {
              shards++;
            }
            secondsLeft = 0;
          }
        }
        if (shards > 0) {
          store.dispatch("currency/gain", { feature: "horde", name: "mysticalShard", amount: shards });
        }
      } // Gain corrupted flesh
      if (store.state.unlock.hordeCorruptedFlesh.use) {
        store.dispatch("currency/gain", {
          feature: "horde",
          name: "corruptedFlesh",
          amount: store.getters["mult/get"](`currencyHordeCorruptedFleshGain`) * seconds,
        });
      } // Level up player
      if (subfeature === 1) {
        const oldProgress = store.state.horde.expLevel;
        let progress = store.state.horde.expLevel;
        let secondsLeft = seconds;
        while (secondsLeft > 0) {
          const difficulty = store.getters["horde/expDifficulty"](Math.floor(progress));
          const timeUsed = Math.min((Math.floor(progress + 1) - progress) * difficulty, secondsLeft);
          progress += timeUsed / difficulty;
          secondsLeft -= timeUsed;
        }
        store.commit("horde/updateKey", { key: "expLevel", value: progress });
        const newLvl = Math.floor(progress);
        if (newLvl > Math.floor(oldProgress)) {
          store.commit("horde/updateKey", {
            key: "skillPoints",
            value:
              (newLvl - Math.floor(oldProgress)) * store.getters["mult/get"]("hordeSkillPointsPerLevel") +
              store.state.horde.skillPoints,
          });
          store.dispatch("horde/applyClassLevelEffects");
          const classObj = store.state.horde.fighterClass[store.state.horde.selectedClass];
          if (
            classObj.questsCompleted.level < classObj.quests.level.length &&
            newLvl >= classObj.quests.level[classObj.questsCompleted.level]
          ) {
            store.commit("horde/updateClassQuestKey", {
              name: store.state.horde.selectedClass,
              key: "level",
              value: classObj.quests.level.filter((el) => newLvl >= el).length,
            });
            store.dispatch("horde/applyBattlePassEffects");
          }
        } // Boss pass gain
        if (store.state.horde.selectedClass === "pirate") {
          store.dispatch("currency/gain", {
            feature: "horde",
            name: "lockpick",
            amount: store.getters["mult/get"](`currencyHordeLockpickGain`) * seconds,
          });
        }
      } // Prepare combat stats
      const playerStats = store.state.horde.cachePlayerStats;
      let simulation = { ...newSimulation };
      let secondsLeft = seconds;
      const attackAfterTime = store.getters["tag/values"]("hordeAttackAfterTime")[0];
      const strIntAfterTime = store.getters["tag/values"]("hordeStrIntAfterTime")[0]; // Run combat
      while (secondsLeft > 0) {
        let respawn = store.state.horde.respawn;
        let secondsSpent = 0;
        if (((simulation.dead >= 2 && simulation.killed >= 100) || simulation.dead >= 10) && !simulation.complete) {
          // Combat simulation: gain resources based on average
          const simTime = simulation.time + simulation.minibossTime + simulation.monsterPartTime;
          let cycles = Math.floor(secondsLeft / simTime) - 1;
          if (cycles > 0) {
            // Regular drops first
            if (simulation.bone > 0) {
              store.dispatch("currency/gain", {
                feature: "horde",
                name: "bone",
                gainMult: true,
                amount: cycles * simulation.bone,
              });
            }
            if (subfeature === 0 && simulation.monsterPartTime > 0) {
              store.dispatch("currency/gain", {
                feature: "horde",
                name: "monsterPart",
                gainMult: true,
                amount: cycles * simulation.monsterPartTime * store.getters["horde/currentMonsterPart"],
              });
            }
            if (simulation.blood > 0) {
              store.dispatch("currency/gain", {
                feature: "horde",
                name: "blood",
                gainMult: true,
                amount: cycles * simulation.blood,
              });
            }
            store.commit("stat/add", { feature: "horde", name: "totalDamage", value: cycles * simulation.damage });
            if (subfeature === 0) {
              store.dispatch("horde/findItems", cycles * simulation.killed); // Miniboss stuff after
              secondsSpent = simTime * cycles;
              const minibossTimer =
                secondsSpent / store.getters["mult/get"]("hordeMinibossTime") + store.state.horde.minibossTimer;
              const minibossesKilled = Math.floor(minibossTimer) - (store.state.horde.bossFight === 1 ? 1 : 0);
              store.commit("horde/updateKey", {
                key: "minibossTimer",
                value: Math.min(minibossTimer - minibossesKilled, 2),
              });
              store.dispatch("horde/getMinibossReward", minibossesKilled);
            }
            secondsLeft -= cycles * simTime;
            tickPlayerCooldowns(cycles * simTime);
          }
          simulation.complete = true;
        } else if (respawn > 0) {
          // Wait for the player to respawn
          secondsSpent = Math.min(respawn, secondsLeft);
          let newRespawn = respawn - secondsSpent;
          tickEnemyRespawn(secondsSpent);
          if (simulation.dead) {
            simulation.time += secondsSpent;
          }
          store.commit("horde/updateKey", { key: "respawn", value: newRespawn });
          if (newRespawn <= 0) {
            store.dispatch("horde/resetStats");
          }
        } else if (store.state.horde.enemy) {
          // Tick enemy cooldowns
          for (const [key, elem] of Object.entries(store.state.horde.enemy.active)) {
            if (elem.cooldown > 0) {
              store.commit("horde/updateEnemyActive", {
                name: key,
                key: "cooldown",
                value: Math.max(0, elem.cooldown - 1),
              });
            }
          }
          const enemyStats = store.state.horde.enemy;
          let enemyHealth = enemyStats.health;
          let killEnemy = false; // Apply poison damage
          if (enemyStats.poison > 0) {
            enemyHealth = Math.max(0, enemyHealth - enemyStats.poison);
          }
          if (store.state.horde.player.health > 0) {
            const isStunned = store.state.horde.player.stun > 0; // determine if the chosen attack can be used
            let usedAttack = null;
            let item = null;
            if (store.state.horde.player.silence > 0) {
              store.commit("horde/updatePlayerKey", {
                key: "silence",
                value: Math.max(0, store.state.horde.player.silence - 1),
              });
            } else if (store.state.horde.chosenActive) {
              if (subfeature === 0) {
                item = store.state.horde.items[store.state.horde.chosenActive];
              } else if (subfeature === 1) {
                const split = store.state.horde.chosenActive.split("_");
                if (split[0] === "skill") {
                  item = store.state.horde.fighterClass[store.state.horde.selectedClass].skills[split[1]];
                } else if (split[0] === "trinket") {
                  item = store.state.horde.trinket[split[1]];
                }
              }
              if (
                (!isStunned || item.usableInStun) &&
                (subfeature === 1
                  ? store.state.horde.skillActive[store.state.horde.chosenActive]
                  : item.cooldownLeft) <= 0
              ) {
                usedAttack = store.state.horde.chosenActive;
              }
            }
            if (isStunned) {
              store.commit("horde/updatePlayerKey", {
                key: "stun",
                value: Math.max(0, store.state.horde.player.stun - 1 - playerStats.stunResist),
              });
            }
            if (!isStunned || usedAttack) {
              // PLAYER ATTACK
              const divisionShieldMult = enemyStats.divisionShield + 1;
              let damage = 0;
              let hitShield = false;
              if (usedAttack && item) {
                const activeLevel =
                  subfeature === 1
                    ? usedAttack.split("_")[0] === "skill"
                      ? (store.state.horde.skillLevel[usedAttack.split("_")[1]] ?? 0)
                      : store.state.horde.trinket[usedAttack.split("_")[1]].level
                    : item.level;
                const activeCost = item.activeCost !== undefined ? item.activeCost(activeLevel) : {};
                if (
                  activeCost.energy === undefined ||
                  playerStats.energy >= activeCost.energy ||
                  activeCost.mana === undefined ||
                  playerStats.mana >= activeCost.mana
                ) {
                  item.active(activeLevel).forEach((elem) => {
                    let value = elem.value;
                    if (elem.str !== undefined) {
                      value += elem.str * playerStats.strength;
                    }
                    if (elem.int !== undefined) {
                      value += elem.int * playerStats.intelligence;
                    }
                    let critEffect = elem.canCrit ?? 0;
                    if (elem.type === "heal") {
                      critEffect = Math.max(critEffect, store.getters["tag/values"]("hordeActiveHealCrit")[0]);
                    } else if (elem.type.substring(0, 9) === "maxdamage" || elem.type.substring(0, 6) === "damage") {
                      critEffect = Math.max(critEffect, store.getters["tag/values"]("hordeActiveDamageCrit")[0]);
                    }
                    if (critEffect > 0) {
                      const crits = randomRound(playerStats.critChance);
                      if (crits > 0) {
                        value *= Math.pow((playerStats.critMult - 1) * critEffect + 1, crits);
                        applyCritEffects(crits);
                      }
                    }
                    if (elem.type === "heal") {
                      store.commit("horde/updatePlayerKey", {
                        key: "health",
                        value: Math.min(
                          playerStats.health,
                          store.state.horde.player.health + playerStats.health * playerStats.healing * value,
                        ),
                      });
                    } else if (elem.type === "refillEnergy") {
                      store.commit("horde/updatePlayerKey", {
                        key: "energy",
                        value: Math.min(
                          playerStats.energy,
                          store.state.horde.player.energy + playerStats.energy * value,
                        ),
                      });
                    } else if (elem.type === "refillMana") {
                      store.commit("horde/updatePlayerKey", {
                        key: "mana",
                        value: Math.min(playerStats.mana, store.state.horde.player.mana + playerStats.mana * value),
                      });
                    } else if (elem.type === "stun") {
                      store.commit("horde/updateEnemyKey", {
                        key: "stun",
                        value: store.state.horde.enemy.stun + Math.round(value),
                      });
                    } else if (elem.type === "silence") {
                      store.commit("horde/updateEnemyKey", {
                        key: "silence",
                        value: store.state.horde.enemy.silence + Math.round(value),
                      });
                    } else if (elem.type === "revive") {
                      store.commit("horde/updatePlayerKey", {
                        key: "revive",
                        value: Math.min(playerStats.revive, store.state.horde.player.revive + Math.round(value)),
                      });
                    } else if (elem.type === "reviveAll") {
                      store.commit("horde/updatePlayerKey", { key: "revive", value: playerStats.revive });
                    } else if (elem.type === "divisionShield") {
                      store.commit("horde/updatePlayerKey", {
                        key: "divisionShield",
                        value: store.state.horde.player.divisionShield + Math.round(value),
                      });
                    } else if (elem.type === "removeDivisionShield") {
                      store.commit("horde/updateEnemyKey", {
                        key: "divisionShield",
                        value: Math.ceil(store.state.horde.enemy.divisionShield * (1 - value)),
                      });
                    } else if (elem.type === "removeAttack") {
                      if (store.state.horde.fightRampage <= 0) {
                        store.commit("horde/updateEnemyKey", {
                          key: "attack",
                          value: Math.max(0, store.state.horde.enemy.attack * (1 - value)),
                        });
                      }
                    } else if (elem.type === "poison") {
                      const poisonDmg = Math.max(
                        0,
                        getDamage((value * playerStats.attack) / divisionShieldMult, "bio", playerStats, enemyStats) -
                          enemyStats.defense * enemyStats.maxHealth,
                      );
                      if (poisonDmg > 0) {
                        store.commit("horde/updateEnemyKey", {
                          key: "poison",
                          value: poisonDmg + store.state.horde.enemy.poison,
                        });
                        hitShield = true;
                      }
                    } else if (elem.type === "antidote") {
                      store.commit("horde/updatePlayerKey", {
                        key: "poison",
                        value: store.state.horde.player.poison * (1 - value),
                      });
                    } else if (elem.type === "removeStun") {
                      store.commit("horde/updatePlayerKey", { key: "stun", value: 0 });
                    } else if (elem.type === "buff") {
                      store.dispatch("horde/addBuff", {
                        name: `${subfeature === 0 ? "equipment_" : ""}${usedAttack}`,
                        time: Math.round(value),
                        positive: true,
                        effect: elem.effect,
                      });
                    } else if (elem.type.substring(0, 9) === "maxdamage") {
                      const maxdamage = Math.max(
                        0,
                        enemyStats.maxHealth * (enemyHealth / enemyStats.maxHealth - playerStats.execute),
                      );
                      damage += getDamage(
                        (value * maxdamage) / divisionShieldMult,
                        elem.type.substring(9).toLowerCase(),
                        playerStats,
                        enemyStats,
                      );
                    } else if (elem.type.substring(0, 6) === "damage") {
                      damage += getDamage(
                        (value * playerStats.attack) / divisionShieldMult,
                        elem.type.substring(6).toLowerCase(),
                        playerStats,
                        enemyStats,
                      );
                    }
                  });
                  damage = Math.max(0, damage - enemyStats.defense * enemyStats.maxHealth);
                  if (damage > 0) {
                    hitShield = true;
                  }
                  if (activeCost.health !== undefined) {
                    store.commit("horde/updatePlayerKey", {
                      key: "health",
                      value: store.state.horde.player.health * (1 - activeCost.health),
                    });
                  }
                  if (activeCost.energy !== undefined) {
                    store.dispatch("horde/updateEnergy", store.state.horde.player.energy - activeCost.energy);
                  }
                  if (activeCost.mana !== undefined) {
                    store.dispatch("horde/updateMana", store.state.horde.player.mana - activeCost.mana);
                  }
                  if (activeCost.mysticalShard !== undefined) {
                    store.dispatch("currency/spend", {
                      feature: "horde",
                      name: "mysticalShard",
                      amount: activeCost.mysticalShard,
                    });
                    store.dispatch("horde/checkPlayerHealth");
                  }
                  const cooldown = Math.ceil(
                    item.cooldown(activeLevel) / (subfeature === 0 && item.masteryLevel >= 4 ? 2 : 1),
                  );
                  if (subfeature === 0) {
                    store.commit("horde/updateItemKey", { name: usedAttack, key: "cooldownLeft", value: cooldown });
                  } else if (subfeature === 1) {
                    store.commit("horde/updateSubkey", { name: "skillActive", key: usedAttack, value: cooldown });
                  }
                  store.dispatch("horde/updateActiveTimer", 0); // Add stat for spellblade
                  store.commit("horde/updatePlayerKey", { key: "spells", value: store.state.horde.player.spells + 1 });
                }
                store.commit("horde/updateKey", { key: "chosenActive", value: null });
              } else {
                // Perform basic attack
                const crits = randomRound(playerStats.critChance);
                const baseDamage =
                  playerStats.attack *
                  (HORDE_DAMAGE_INCREASE_PER_STRENGTH * playerStats.strength + 1) *
                  Math.pow(playerStats.critMult, crits);onversion = playerStats[damagetype + "Con getDamage(
                      (baseDamage * conversion) / divisionShieldMult,
                      damagetype,
                      playerStats,
                      enemyStats,
                    );
                  }
                });
                damage -= enemyStats.defense * enemyStats.maxHealth; // Count damage stats (basic attacks only)
                store.commit("stat/increaseTo", { feature: "horde", name: "maxDamage", value: damage });
                store.commit("stat/add", { feature: "horde", name: "totalDamage", value: damage });
                if (simulation.dead && damage > 0) {
                  simulation.damage += damage;
                }
                if (playerStats.firstStrike > 0 && store.state.horde.player.hits <= 0) {
                  damage += getDamage(
                    (playerStats.attack * playerStats.firstStrike) / divisionShieldMult,
                    "magic",
                    playerStats,
                    enemyStats,
                  );
                }
                if (store.state.horde.player.spells > 0) {
                  if (playerStats.spellblade > 0) {
                    damage += getDamage(
                      (playerStats.attack * playerStats.spellblade) / divisionShieldMult,
                      "magic",
                      playerStats,
                      enemyStats,
                    );
                  }
                  store.commit("horde/updatePlayerKey", { key: "spells", value: store.state.horde.player.spells - 1 });
                }
                store.commit("horde/updatePlayerKey", { key: "hits", value: store.state.horde.player.hits + 1 });
                damage = Math.max(0, damage);
                if (damage > 0) {
                  if (enemyHealth > damage && playerStats.cutting > 0 && enemyHealth < Infinity) {
                    const maxdamage = Math.max(
                      0,
                      enemyStats.maxHealth * ((enemyHealth - damage) / enemyStats.maxHealth - playerStats.execute),
                    );
                    damage += getDamage(
                      (maxdamage * playerStats.cutting) / divisionShieldMult,
                      "bio",
                      playerStats,
                      enemyStats,
                    );
                  }
                  if (playerStats.toxic > 0) {
                    store.commit("horde/updateEnemyKey", {
                      key: "poison",
                      value:
                        getDamage(
                          (baseDamage * playerStats.toxic) / divisionShieldMult,
                          "bio",
                          playerStats,
                          enemyStats,
                        ) + store.state.horde.enemy.poison,
                    });
                  }
                  hitShield = true;
                }
                if (crits > 0) {
                  applyCritEffects(crits);
                }
              }
              enemyHealth = Math.max(0, enemyHealth - damage);
              if (enemyStats.divisionShield > 0 && hitShield) {
                store.commit("horde/updateEnemyKey", {
                  key: "divisionShield",
                  value: Math.max(enemyStats.divisionShield - 1 - playerStats.shieldbreak, 0),
                });
              }
            } // select autocast
            if (store.state.horde.chosenActive === null && store.state.horde.autocast.length > 0) {
              const sources = store.state.horde.autocast
                .map((name) => {
                  if (subfeature === 0) {
                    const item = store.state.horde.items[name];
                    return {
                      ready: item.cooldownLeft <= 0,
                      type: item.activeType,
                      effect: item.active(item.level),
                      cost: item.activeCost(item.level),
                      name,
                    };
                  } else if (subfeature === 1) {
                    const split = name.split("_");
                    if (split[0] === "skill") {
                      const skill = store.state.horde.fighterClass[store.state.horde.selectedClass].skills[split[1]];
                      return {
                        ready: store.state.horde.skillActive[name] <= 0,
                        type: skill.activeType,
                        effect: skill.active(skill.level),
                        cost: skill.activeCost(skill.level),
                        name,
                      };
                    } else if (split[0] === "trinket") {
                      const trinket = store.state.horde.trinket[split[1]];
                      return {
                        ready: store.state.horde.skillActive[name] <= 0,
                        type: trinket.activeType,
                        effect: trinket.active(trinket.level),
                        cost: trinket.activeCost(trinket.level),
                        name,
                      };
       })
                .filter(
       type === "combat" &&
                    (elem.cost.health === undefined ||
                      (store.state.horde.player.health >= elem.cost.health &&
                        store.state.horde.player.health / playerStats.health >= 0.5)) &&
                    (elem.cost.energy === undefined ||
                      (store.state.horde.player.energy >= elem.cost.energy &&
                        store.state.horde.player.energy / playerStats.energy >= 0.5)) &&
                    (elem.cost.mana === undefined ||
                      (store.state.horde.player.mana >= elem.cost.mana &&
                        store.state.horde.player.mana / playerStats.mana >= 0.5)) &&
                    (elem.cost.mysticalShard === undefined ||
                      (store.state.currency.horde_mysticalShard.value >= elem.cost.mysticalShard &&
                        store.state.currency.horde_mysticalShard.value >=
                          store.state.currency.horde_mysticalShard.cap)),
                );
              sources.forEach((elem) => {
                if (store.stat              let useNegative = false;
        ;
                    if (el.type === "heal") {
                      condition = store.state.horde.player.health / playerStats.health <= 1 - el.value;
                    } else if (el.type === "stun") {
                      condition = store.state.horde.enemy.stun <= 0;
                    } else if (el.type === "silence") {
                      condition = store.state.horde.enemy.silence <= 0;
                    } else if (el.type === "divisionShield") {
                      condition = store.state.horde.player.divisionShield <= 0;
                    } else if (el.type === "antidote") {
                      condition = store.state.horde.player.poison > 0;
                    } else if (el.type === "removeStun") {
                      condition = store.state.horde.player.stun > 0;
                    }
                    if (condition === true) {
                      usePositive = true;
                    } else if (condition === false) {
                      useNegative = true;
                    }
                    if (usePositive || !useNegative) {
                      store.commit("horde/updateKey", { key: "chosenActive", value: elem.name });
            }
          }
          if (enemyHealevive) {
              store.commit("horde/updateEnemyKey", { key: "health", value: enemyStats.maxHealth });
              store.commit("horde/updateEnemyKey", { key: "revive", value: enemyStats.revive - 1 });
            } else {
              if (simulation.dead) {
                simulation.killed++;
                if (subfeature === 0) {
                  simulation.bone += store.getters["horde/currentBone"] * store.state.horde.enemy.loot;
                } else if (subfeature === 1) {
                  simulation.blood += store.getters["horde/currentBlood"] * store.state.horde.enemy.loot;
                }
              }
              killEnemy = true;
            }
          } else {
            store.commit("horde/updateEnemyKey", { key: "health", value: enemyHealth });
          }
          let playerHealth = store.state.horde.player.health;
          if (store.state.horde.player.poison > 0) {
            playerHealth = Math.max(0, playerHealth - store.state.horde.player.poison);
          }
          const isEnemyStunned = enemyStats.stun > 0; // determine which attack to use (first one with cooldown ready)
          let usedAttack = null;
          if (enemyStats.silence > 0) {
            store.commit("horde/updateEnemyKey", { key: "silence", value: Math.max(0, enemyStats.silence - 1) });
          } else {
            for (const [key, elem] of Object.entries(enemyStats.active)) {
              if (elem.cooldown <= 0 && (elem.uses === null || elem.uses > 0)) {
                let usePositive = false;
                let useNegative = false;
                let usableInStun = false;
                store.state.horde.sigil[key].active
                  .effect(enemyStats.sigil[key], store.state.horde.bossFight)
                  .forEach((el) => {
                    let condition = null;
                    if (el.type === "heal") {
                      condition = enemyStats.health / enemyStats.maxHealth <= 1 - el.value;
                    } else if (el.type === "stun") {
                      condition = store.state.horde.player.stun <= 0;
                    } else if (el.type === "silence") {
                      condition = store.state.horde.player.silence <= 0;
                    } else if (el.type === "divisionShield") {
                      condition = enemyStats.divisionShield <= 0;
                    } else if (el.type === "antidote") {
                      condition = enemyStats.poison > 0;
                    } else if (el.type === "removeStun") {
                      usableInStun = true;
                      condition = enemyStats.stun > 0;
                    }
                    if (condition === true) {
                      usePositive = true;
                    } else if (condition === false) {
                      useNegative = true;
                    }
                  });
                if (((!isEnemyStunned || usableInStun) && usePositive) || !useNegative) {
                  usedAttack = key;
                  break;
                }
              }
            }
          }
          if (isEnemyStunned) {
            store.commit("horde/updateEnemyKey", {
              key: "stun",
              value: Math.max(0, enemyStats.stun - 1 - enemyStats.stunResist),
            });
          }
          if (!isEnemyStunned || usedAttack !== null) {
            // ENEMY ATTACK
            const enemyBaseDamage =
              enemyStats.attack * Math.pow(enemyStats.critMult + 1, randomRound(enemyStats.critChance));
            const divisionShieldMult = store.state.horde.player.divisionShield + 1;
            let enemyDamage = 0;
            let hitShield = false;
            if (usedAttack === null) {
              // Perform a basic attack with all additional effects
              const enemyConversionTotal =
                enemyStats.physicConversion + enemyStats.magicConversion + enemyStats.bioConversion;
              damageTypes.forEach((damagetype) => {
                const conversion = enemyStats[damagetype + "Conversion"] / enemyConversionTotal;
                if (conversion > 0) {
                  enemyDamage += getDamage(
                    (enemyBaseDamage * conversion) / divisionShieldMult,
                    damagetype,
                    enemyStats,
                    playerStats,
                  );
                }
              });
              if (enemyStats.firstStrike > 0 && enemyStats.hits <= 0) {
                enemyDamage += getDamage(
                  (enemyStats.attack * enemyStats.firstStrike) / divisionShieldMult,
                  "magic",
                  enemyStats,
                  playerStats,
                );
              }
              if (playerHealth > enemyDamage && enemyStats.cutting > 0) {
                enemyDamage += getDamage(
                  ((playerHealth - enemyDamage) * enemyStats.cutting) / divisionShieldMult,
                  "bio",
                  enemyStats,
                  playerStats,
                );
              }
              enemyDamage = Math.max(0, enemyDamage - playerStats.defense * playerStats.health);
              if (enemyDamage > 0) {
                if (enemyStats.toxic > 0) {
                  store.commit("horde/updatePlayerKey", {
                    key: "poison",
                    value:
                      getDamage(
                        (enemyBaseDamage * enemyStats.toxic) / divisionShieldMult,
                        "bio",
                        enemyStats,
                        playerStats,
                      ) + store.state.horde.player.poison,
                  });
                }
                store.commit("horde/updateEnemyKey", { key: "hits", value: enemyStats.hits + 1 });
                hitShield = true;
              }
            } else {
              // Perform an active attack
              const active = store.state.horde.sigil[usedAttack].active;
              active.effect(enemyStats.sigil[usedAttack], store.state.horde.bossFight).forEach((elem) => {
                if (elem.type === "heal") {
                  store.commit("horde/updateEnemyKey", {
                    key: "health",
                    value: Math.min(
                      enemyStats.maxHealth,
                      store.state.horde.enemy.health + enemyStats.maxHealth * elem.value,
            ) {
                  store.commit("horde/updae.state.horde.player.stun + elem.value,
                  });
                } else if (elem.type === "silence") {
                  store.commit("horde/updatePlayerKey", {
                    key: "silence",
                    value: store.state.horde.player.silence + elem.value,
                  });
                } else if (elem.type === "divisionShield") {
                  store.commit("horde/updateEnemyKey", {
                    key: "divisionShield",
                    value: store.state.horde.enemy.divisionShield + elem.value,
                  });
                } else if (elem.type === "removeDivisionShield") {
                  store.commit("horde/updatePlayerKey", {
                    key: "divisionShield",
                    value: Math.ceil(store.state.horde.player.divisionShield * (1 - elem.value)),
                  });
                } else if (elem.type === "gainStat") {
                  const split = elem.stat.split("_");
                  if (split[1] === "base") {
                    store.commit("horde/updateEnemyKey", {
                      key: split[0],
                      value: store.state.horde.enemy[split[0]] + elem.value,
                    });
                  } else if (split[1] === "mult") {
                    store.commit("horde/updateEnemyKey", {
                      key: split[0],
                      value: store.state.horde.enemy[split[0]] * elem.value,
                    });
                  }
                } else if (elem.type === "poison") {
                  const poisonDmg = Math.max(
                    0,
                    getDamage((elem.value * enemyStats.attack) / divisionShieldMult, "bio", enemyStats, playerStats) -
                      playerStats.defense * playerStats.health,
                  );
                  if (poisonDmg > 0) {
                    store.commit("horde/updatePlayerKey", {
                      key: "poison",
                      value: poisonDmg + store.state.horde.player.poison,
                    });
                    hitShield = true;
                  }
                } else if (elem.type === "antidote") {
                  store.commit("horde/updateEnemyKey", {
                    key: "poison",
                    value: store.state.horde.enemy.poison * (1 - elem.value),
                  });
                } else if (elem.type === "removeStun") {
                  store.commit("horde/updateEnemyKey", { key: "stun", value: 0 });
                } else if (elem.type.substring(0, 9) === "maxdamage") {
                  const maxdamage = Math.max(
                    0,
                    playerStats.health * (playerHealth / playerStats.health - enemyStats.execute),
                  );
                  enemyDamage += getDamage(
                    (elem.value * maxdamage) / divisionShieldMult,
                    elem.type.substring(9).toLowerCase(),
                    enemyStats,
                    playerStats,
                  );
                  enemyDamage = Math.max(0, enemyDamage - playerStats.defense * playerStats.health);
                  if (enemyDamage > 0) {
                    hitShield = true;
                  }
                } else if (elem.type.substring(0, 6) === "damage") {
                  enemyDamage += getDamage(
                    (elem.value * enemyStats.attack) / divisionShieldMult,
                    elem.type.substring(6).toLowerCase(),
                    enemyStats,
                    playerStats,
                  );
                  enemyDamage = Math.max(0, enemyDamage - playerStats.defense * playerStats.health);
                  if (enemyDamage > 0) {
                    hitShield = true;
                  }
                }
              }); // Count use and apply cooldown
              store.commit("horde/updateEnemyActive", {
                name: usedAttack,
                key: "cooldown",
                value: active.cooldown(enemyStats.sigil[usedAttack], store.state.horde.bossFight),
              });
              if (enemyStats.active[usedAttack].uses !== null) {
                store.commit("horde/updateEnemyActive", {
                  name: usedAttack,
                  key: "uses",
                  value: enemyStats.active[usedAttack].uses - 1,
                });
              }
            }
            playerHealth = Math.max(0, playerHe       if (store.state.horde.player.divisionShiel            key: "divisionShield",
                value: store.state.horde.player.divisionShield - 1,
              });
            }
          }
          if (simulation.dead) {
            if (store.state.horde.bossFight === 0) {
              simulation.time++;
            } else if (store.state.horde.bossFight === 1) {
              simulation.minibossTime++;
            }
          }
          if (playerHealth / playerStats.health <= enemyStats.execute) {
            if (playerDie()) {
              if (store.state.horde.bossFight === 1 && simulation.dead) {
                simulation.minibossDead++;
              } // Dying to a boss resets the simulation
              if (store.state.horde.bossFight === 2 && simulation.dead) {
                simulation = { ...newSimulation };
              }
              simulation.dead++;
            }
          } else {
            store.commit("horde/updatePlayerKey", { key: "health", value: playerHealth });
          } // Tick respawn timers
          tickEnemyRespawn(1);
          if (killEnemy && store.state.horde.enemy) {
      te.horde.bossFight === 1 && simulation.dead) {
    the simulation
            if (store.state.horde.bossFight === 2 && simulation.dead) {
              simulation = { ...newSimulation };
            }
            store.dispatch("horde/killEnemy");
            if (subfeature === 1 && !wasBoss && store.state.horde.combo === 0) {
              // Resetting enemy count counts as death for classes subfeature
              simulation.dead++;
            }
          }
          secondsSpent = 1; // Apply rampage
          store.commit("horde/updateKey", { key: "fightTime", value: store.state.horde.fightTime + secondsSpent }); // Apply after x time effects
          const fightMinutes = Math.floor(store.state.horde.fightTime / SECONDS_PER_MINUTE);
          if (fightMinutes > 0) {
            if (attackAfterTime > 0) {
              store.dispatch("system/applyEffect", {
                type: "mult",
                name: "hordeAttack",
                multKey: `hordeTime`,
                value: attackAfterTime * fightMinutes + 1,
              });
            }
            if (strIntAfterTime > 0) {
              store.dispatch("system/applyEffect", {
                type: "base",
                name: "hordeStrength",
                multKey: `hordeTime`,
                value: strIntAfterTime * fightMinutes,
              });
              store.dispatch("system/applyEffect", {
                type: "base",
                name: "hordeIntelligence",
                multKey: `hordeTime`,
                value: strIntAfterTime * fightMinutes,
              });
            }
          }
          const rampageTime = store.state.horde.bossFight > 0 ? HORDE_RAMPAGE_BOSS_TIME : HORDE_RAMPAGE_ENEMY_TIME;
          const newRampage = Math.floor(store.state.horde.fightTime / rampageTime);
          if (store.state.horde.enemy && newRampage > store.state.horde.fightRampage) {
            const rampageDiff = newRampage - store.state.horde.fightRampage;
            store.commit("horde/updateEnemyKey", {
              key: "attack",
              value: enemyStats.attack * Math.pow(HORDE_RAMPAGE_ATTACK, rampageDiff),
            });
            store.commit("horde/updateEnemyKey", {
              key: "critChance",
              value: enemyStats.critChance + HORDE_RAMPAGE_CRIT_CHANCE * rampageDiff,
            });
            store.commit("horde/updateEnemyKey", {
              key: "critMult",
              value: enemyStats.critMult + HORDE_RAMPAGE_CRIT_DAMAGE * rampageDiff,
            });
            store.commit("horde/updateEnemyKey", {
              key: "stunResist",
              value: enemyStats.stunResist + HORDE_RAMPAGE_STUN_RESIST * rampageDiff,
            });
            store.commit("horde/updateKey", { key: "fightRampage", value: newRampage });
          }
        } else if (subfeature === 1 && store.state.horde.selectedArea === null) {
          secondsLeft = 0;
        } else if (
          subfeature === 0 &&
          store.state.horde.taunt &&
          !store.state.horde.bossAvailable &&
          store.state.horde.zone === store.state.stat.horde_maxZone.value
        ) {
          store.dispatch("horde/updateEnemyStats");
        } else {
          secondsSpent = Math.max(Math.min(secondsLeft, HORDE_ENEMY_RESPAWN_TIME - store.state.horde.enemyTimer), 1);
          tickEnemyRespawn(secondsSpent);
          if (simulation.dead) {
            simulation.time += secondsSpent;
          }
          if (
            subfeature === 0 &&
            store.state.horde.zone >= HORDE_MONSTER_PART_MIN_ZONE &&
            store.state.horde.combo > 0
          ) {
            store.dispatch("currency/gain", {
              feature: "horde",
              name: "monsterPart",
              gainMult: true,
              amount: secondsSpent * store.getters["horde/currentMonsterPart"],
            });
            if (simulation.dead) {
              simulation.monsterPartTime += secondsSpent;
            }
          }
          store.dispatch("horde/updateEnemyStats");
        } // Apply recovery
        if (store.state.horde.player.health > 0) {
          const passiveRecovery =
            store.getters["tag/values"]("hordePassiveRecovery")[0] * playerStats.recovery * playerStats.healing;
          const missingHealth = playerStats.health - store.state.horde.player.health;
          if (passiveRecovery > 0 && missingHealth > 0) {
            store.commit("horde/updatePlayerKey", {
              key: "health",
              value: Math.min(playerStats.health, store.state.horde.player.health + missingHealth * passiveRecovery),
            });
          }
        } // Tick player buffs
        let newBuffs = {};
        let refreshCache = false;
        for (const [key, elem] of Object.entries(store.state.horde.playerBuff)) {
          const newTime = elem.time - secondsSpent;
          if (newTime > 0) {
            newBuffs[key] = { ...elem, time: newTime };
          } else {
            refreshCache = true;
          }
        }
        store.commit("horde/updateKey", { key: "playerBuff", value: newBuffs });
        if (refreshCache) {
          store.dispatch("horde/updatePlayerCache");
        }
        store.dispatch("horde/updateActiveTimer", store.state.horde.activeTimer + secondsSpent);
        tickPlayerCooldowns(secondsSpent); // Regen energy and mana
        if (playerStats.energyRegen > 0 && store.state.horde.player.energy < playerStats.energy) {
          store.dispatch(
            "horde/updateEnergy",
            Math.min(store.state.horde.player.energy + playerStats.energyRegen * secondsSpent, playerStats.energy),
          );
        }
        if (playerStats.manaRegen > 0 && store.state.horde.player.mana < playerStats.mana) {
          store.dispatch(
            "horde/updateMana",
            Math.min(store.state.horde.player.mana + playerStats.manaRegen * secondsSpent, playerStats.mana),
          );
        }
        secondsLeft -= secondsSpent;
      } // Show heirloom notification after all combat happened
      if (store.state.horde.heirloomsFound !== null) {
        if (store.state.system.settings.notification.items.heirloom.value) {
          store.commit("system/addNotification", {
            color: "success",
            timeout: 3000,
            message: { type: "heirloom", value: store.state.horde.heirloomsFound },
          });
        }
        store.commit("horde/updateKey", { key: "heirloomsFound", value: null });
      }
    },
    unlock: [
      "hordeFeature",
      "hordeItems",
      "hordeDamageTypes",
      "hordePrestige",
      "hordeHeirlooms",
      "hordeCorruptedFlesh",
      "hordeItemMastery",
      "hordeChessItems",
      "hordeBrickTower",
      "hordeFireTower",
      "hordeIceTower",
      "hordeDangerTower",
      "hordeToxicTower",
      ...["RoyalArmor", "RoyalStorage", "RoyalButcher", "RoyalCrypt", "RoyalSecret"].map(
        (elem) => "hordeUpgrade" + elem,
      ),
      "hordeClassesSubfeature",
      "hordeSacrifice",
      "hordeEndOfContent",
    ],
    stat: {
      maxZone: { value: 1, showInStatistics: true },
      maxDifficulty: { showInStatistics: true },
      totalDamage: { showInStatistics: true },
      maxDamage: { showInStatistics: true },
      timeSpent: { display: "time" },
      bestPrestige0: { showInStatistics: true },
      bestPrestige1: { showInStatistics: true },
      prestigeCount: { showInStatistics: true },
      maxZoneSpeedrun: { value: 1 },
      maxItems: {},
      maxCorruptionKill: { display: "percent", showInStatistics: true },
      maxMastery: {},
      totalMastery: {},
      unlucky: {},
    },
    mult: {
      // Base combat stats
      hordeAttack: {},
      hordeHealth: {},
      hordeRecovery: { display: "percent", min: 0, max: 1 },
      hordeCritChance: { display: "percent" },
      hordeCritMult: { display: "percent", baseValue: 0.5 },
      hordeRevive: { round: true, min: 0 },
      hordeToxic: { display: "percent" },
      hordeFirstStrike: { display: "percent" },
      hordeSpellblade: { display: "percent" },
      hordeCutting: { display: "percent", min: 0 },
      hordeDivisionShield: { round: true, min: 0 },
      hordeStunResist: { round: true, min: 0 },
      hordeShieldbreak: { round: true, min: 0 },
      hordeEnemyActiveStart: { display: "percent", min: 0, max: 1 },
      hordeDefense: { display: "percent", min: 0 },
      hordeExecute: { display: "percent", min: 0, max: 0.75 },
      hordeHealing: { display: "percent", baseValue: 1, min: 0 }, // Damage type specifics
      hordePhysicConversion: { display: "percent", baseValue: 1 },
      hordeMagicConversion: { display: "percent", baseValue: 0 },
      hordeBioConversion: { display: "percent", baseValue: 0 },
      hordePhysicAttack: { display: "percent", baseValue: 1 },
      hordeMagicAttack: { display: "percent", baseValue: 1 },
      hordeBioAttack: { display: "percent", baseValue: 1 },
      hordePhysicTaken: { display: "percent", baseValue: 1 },
      hordeMagicTaken: { display: "percent", baseValue: 1 },
      hordeBioTaken: { display: "percent", baseValue: 1 }, // Utility stats
      hordeMaxItems: { round: true, baseValue: 1 },
      hordeItemChance: { display: "percent" },
      hordeBossRequirement: { round: true, min: 1, max: 50 },
      hordeRespawn: { display: "time", round: true, min: 1, max: 300 },
      hordeMinibossTime: { display: "time", round: true, min: 60, baseValue: 300 },
      hordeHeirloomChance: { display: "percent", max: 1, roundNearZero: true },
      hordeHeirloomAmount: { baseValue: 1, round: true },
      hordeHeirloomEffect: {},
      hordeNostalgia: { baseValue: 25, round: true },
      hordeCorruption: { display: "percent", min: 0, roundNearZero: true },
      hordeItemMasteryGain: {},
      hordeShardChance: { display: "percent", baseValue: 0.001 },
      hordeTrinketGain: {},
      hordeTrinketQuality: { min: 0 },
      hordeMaxSacrifice: { round: true, baseValue: 1 }, // Classes stats
      hordeEnergy: { round: true },
      hordeEnergyRegen: { display: "perSecond" },
      hordeMana: { round: true },
      hordeManaRegen: { display: "perSecond" },
      hordeHaste: {},
      hordeStrength: {},
      hordeIntelligence: {},
      hordeExpBase: { display: "time" },
      hordeExpIncrement: { display: "mult", min: 0 },
      hordeMaxTrinkets: { baseValue: 1, round: true },
      hordeSkillPointsPerLevel: { baseValue: 10, round: true },
      hordeAutocast: { round: true },
      hordePrestigeIncome: {
        group: ["currencyHordeSoulCorruptedGain", "currencyHordeSoulCorruptedCap", "currencyHordeCourageGain"],
      },
    },
    multGroup: [{ mult: "hordeHeirloomEffect", name: "multType", type: "heirloomEffect" }],
    currency: {
      bone: {
        color: "lightest-grey",
        icon: "mdi-bone",
        gainMult: {},
        capMult: { baseValue: buildNum(5, "M") },
        gainTimerFunction() {
          return store.getters["mult/get"](
            "currencyHordeBoneGain",
            store.getters["horde/enemyBone"](store.state.horde.zone, 0) / HORDE_ENEMY_RESPAWN_TIME,
          );
        },
        timerIsEstimate: true,
      },
      monsterPart: {
        color: "cherry",
        icon: "mdi-stomach",
        gainMult: { display: "perSecond" },
        capMult: { baseValue: 100 },
        gainTimerFunction() {
          return store.getters["mult/get"](
            "currencyHordeMonsterPartGain",
            store.getters["horde/currentMonsterPart"] * 0.8,
          );
        },
        timerIsEstimate: true,
      },
      corruptedFlesh: {
        color: "deep-purple",
        icon: "mdi-food-steak",
        gainMult: { baseValue: 1, display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
      },
      mysticalShard: {
        color: "teal",
        icon: "mdi-billiards-rack",
        overcapMult: 0,
        capMult: { baseValue: 0 },
        currencyMult: {
          hordeAttack: { type: "mult", value: (val) => Math.pow(1.02, val) },
          hordeHealth: { type: "mult", value: (val) => Math.pow(1.02, val) },
          currencyHordeBoneGain: { type: "mult", value: (val) => Math.pow(1.02, val) },
          hordeShardChance: { type: "mult", value: (val) => Math.pow(1 / HORDE_SHARD_CHANCE_REDUCTION, val) },
        },
      },
      soulCorrupted: {
        color: "purple",
        icon: "mdi-ghost",
        overcapMult: 0.75,
        overcapScaling: 0.85,
        gainMult: {},
        capMult: { min: 200 },
        gainTimerFunction() {
          return (
            store.getters["mult/get"]("currencyHordeSoulCorruptedGain") / store.getters["mult/get"]("hordeMinibossTime")
          );
        },
        timerIsEstimate: true,
      },
      soulEmpowered: { type: "prestige", alwaysVisible: true, color: "pink", icon: "mdi-ghost" },
      courage: { type: "prestige", alwaysVisible: true, color: "orange", icon: "mdi-ghost", gainMult: {} },
      crown: { type: "prestige", color: "amber", icon: "mdi-crown-circle-outline" },
      towerKey: { type: "prestige", color: "light-grey", icon: "mdi-key-variant" },
      blood: { color: "red", icon: "mdi-iv-bag", gainMult: {}, capMult: { baseValue: 7500 } },
      lockpick: {
        color: "orange-red",
        icon: "mdi-screwdriver",
        overcapMult: 0.9,
        overcapScaling: 0.75,
        gainMult: {},
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 7 },
      },
    },
    upgrade: { ...upgrade, ...upgrade2, ...upgradePrestige, ...upgradePremium, ...bookHorde },
    tag: {
      hordeEnergyToStr: { params: ["number"], stacking: "add" },
      hordeEnergyToEnergyReg: { params: ["perSecond"], stacking: "add" },
      hordeEnergyOnCrit: { params: ["number"], stacking: "add" },
      hordeHealOnCrit: { params: ["percent"], stacking: "add" },
      hordeRestoreCooldownOnCrit: { params: ["time"], stacking: "add" },
      hordeBloodOnCrit: { params: ["percent"], stacking: "add" },
      hordeManaRest: { params: ["time", "perSecond"], stacking: "add" },
      hordeManasteal: { params: ["number"], stacking: "add" },
      hordePassiveRecovery: { params: ["percent"], stacking: "add" },
      hordeActiveDamageCrit: { params: ["percent"], stacking: "add" },
      hordeActiveHealCrit: { params: ["percent"], stacking: "add" },
      hordeAttackAfterTime: { params: ["mult"], stacking: "add" },
      hordeStrIntAfterTime: { params: ["number"], stacking: "add" },
    },
    relic,
    achievement,
    note: buildArray(3", color: "dark-blue", price: { gem_sapphire: 35 } }      store.commit("horde/initItem", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(heirloom)) {
        store.dispatch("horde/initHeirloom", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries({ ...sigil, ...sigil_boss })) {
        store.commit("horde/initSigil", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(tower)) {
        store.commit("horde/initTower", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries({
        adventurer,
        archer,
        mage,
        knight,
        assassin,
        shaman,
        pirate,
        undead,
        cultist,
        scholar,
      })) {
        if (elem.unlock) {
          store.commit("unlock/init", elem.unlock);
        }
        store.commit("horde/initFighterClass", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries({ warzone, monkeyJungle, loveIsland })) {
        if (elem.unlock) {
          store.commit("unlock/init", elem.unlock);
        }
        store.commit("horde/initArea", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(trinket)) {
        store.commit("horde/initTrinket", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(enemyType)) {
        store.commit("horde/initEnemyType", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(boss)) {
        store.commit("horde/initAreaBoss", { name: key, ...elem });
      }
      store.commit("horde/updateKey", { key: "battlePassEffect", value: battlePass });
      store.dispatch("horde/updatePlayerStats");
      store.dispatch("horde/updateEnemyStats");
      store.dispatch("mult/updateExternalCaches", "hordeNostalgia");
      store.dispatch("horde/updatePlayerCache");
    },
    saveGame() {
      let obj = {
        zone: store.state.horde.zone,
        combo: store.state.horde.combo,
        respawn: store.state.horde.respawn,
        maxRespawn: store.state.horde.maxRespawn,
        bossAvailable: store.state.horde.bossAvailable,
        bossFight: store.state.horde.bossFight,
        player: { ...store.state.horde.player },
        sigilZones: [...store.state.horde.sigilZones],
        enemyTimer: store.state.horde.enemyTimer,
      };
      if (Object.keys(store.state.horde.playerBuff).length > 0) {
        obj.playerBuff = store.state.horde.playerBuff;
      }
      if (store.state.horde.enemy) {
        obj.enemy = { ...store.state.horde.enemy };
      }
      if (store.state.unlock.hordeItems.see) {
        obj.items = {};
        for (const [key, elem] of Object.entries(store.state.horde.items)) {
          if (elem.known) {
            obj.items[key] = {
              found: elem.found,
              level: elem.level,
              equipped: elem.equipped,
              cooldownLeft: elem.cooldownLeft,
              collapse: elem.collapse,
            };
            if (elem.masteryPoint > 0) {
              obj.items[key].masteryPoint = elem.masteryPoint;
              obj.items[key].masteryLevel = elem.masteryLevel;
            }
            if (elem.passive) {
              obj.items[key].passive = true;
            }
          }
        }
      }
      if (store.state.horde.loadout.length > 0) {
        obj.loadout = store.state.horde.loadout.map((elem) => {

        });
      }
      for (const [key, elem{
          if (obj.heirloom === undefined) {
            obj.heirloom = {};
          }
          obj.heirloom[key] = elem.amount;
        }
      }
      if (store.state.horde.fightTime > 0) {
        obj.fightTime = store.state.horde.fightTime;
      }
      if (store.state.horde.fightRampage > 0) {
        obj.fightRampage = store.state.horde.fightRampage;
      }
      if (store.state.horde.minibossTimer > 0) {
        obj.minibossTimer = store.state.horde.minibossTimer;
      }
      if (store.state.horde.nostalgiaLost > 0) {
        obj.nostalgiaLost = store.state.horde.nostalgiaLost;
      }
      if (store.state.horde.chosenActive !== null) {
        obj.chosenActive = store.state.horde.chosenActive;
      }
      if (Object.keys(store.state.horde.itemStatMult).length > 0) {
        obj.itemStatMult = store.state.horde.itemStatMult;
      }
      if (store.state.horde.currentTower !== null) {
        obj.currentTower = store.state.horde.currentTower;
      }
      if (store.state.horde.towerFloor > 0) {
        obj.towerFloor = store.state.horde.towerFloor;
      }
      if (store.state.horde.taunt) {
        obj.taunt = true;
      }
      if (store.state.horde.selectedClass !== null) {
        obj.selectedClass = store.state.horde.selectedClass;
      }
      if (store.state.horde.selectedArea !== null) {
        obj.selectedArea = store.state.horde.selectedArea;
      }
      if (store.state.horde.expLevel > 0) {
        obj.expLevel = store.state.horde.expLevel;
      }
      if (store.state.horde.skillPoints > 0) {
        obj.skillPoints = store.state.horde.skillPoints;
      }
      if (store.state.horde.activeTimer > 0) {
        obj.activeTimer = store.state.horde.activeTimer;
      }
      if (store.state.horde.bossStage > 0) {
        obj.bossStage = store.state.horde.bossStage;
      }
      if (store.state.horde.trinketDrop !== null) {
        obj.trinketDrop = store.state.horde.trinketDrop;
      }
      if (store.stte.horde.bossBonusDifficulty;
      }
      if (store.state.      }
      if (store.state.horde.sacrificeLevel > 0) {
        obj.sacrificeLevel = store.state.horde.sacrificeLevel;
      }
      for (const [key, elem] of Object.entries(store.state.horde.tower)) {
        if (elem.highest > 0) {
          if (obj.tower === undefined) {
            obj.tower = {};
          }
          obj.tower[key] = elem.highest;
        }
      }
      for (const [key, elem] of Object.entries(store.state.horde.skillLevel)) {
        if (elem > 0) {
          if (obj.skillLevel === undefined) {
            obj.skillLevel = {};
          }
          obj.skillLevel[key] = elem;
        }
      }
      for (const [key, elem] of Object.entries(store.state.horde.fighterClass)) {
        for (const [qkey, qelem] of Object.entries(elem.questsCompleted)) {
          if (qelem > 0) {
            if (obj.classQuest === undefined) {
              obj.classQuest = {};
            }
            if (obj.classQuest[key] === undefined) {
              obj.classQuest[key] = {};
            }
            obj.classQuest[key][qkey] = qelem;
          }
        }
      }
      for (const [key, elem] of Object.entries(store.state.horde.area)) {
        for (const [qkey, qelem] of Object.entries(elem.zones)) {
          if (qelem.unlocked && qelem.unlockedBy !== null) {
            if (obj.areaUnlock === undefined) {
              obj.areaUnlock = {};
            }
            if (obj.areaUnlock[key] === undefined) {
              obj.areaUnlock[key] = [];
            }
            obj.areaUnlock[key].push(qkey);
          }
        }
      }
      for (const [key, elem] of Object.entries(store.state.horde.trinket)) {
        if (elem.amount > 0) {
          if (obj.trinket === undefined) {
            obj.trinket = {};
          }
          obj.trinket[key] = { amount: elem.amount, equipped: elem.equipped, isActive: elem.isActive };
        }
      }
      return obj;
    },
    loadGame(data) {
      [
        "zone",
        "combo",
     ,
        "fightTime",
        "fightRampage",
    giaLost",
        "chosenActive",
        "currentTower",
        "towerFloor",
        "taunt",
        "selectedClass",
        "selectedArea",
        "expLevel",
        "skillPoints",
        "bossStage",
        "trinketDrop",
        "bossBonusDifficulty",
        "autocast",
        "sacrificeLevel",
      ].forEach((elem) => {
        if (data[elem] !== undefined) {
          store.commit("horde/updateKey", { key: elem, value: data[elem] });
        }
      });
      if (data.sigilZones) {
        store.commit("horde/updateKey", {
          key: "sigilZones",
          value: data.sigilZones.map((zone) => zone.filter((item) => Object.keys(sigil).includes(item))),
        });
      }
      if (data.player) {
        for (const [key, elem] of Object.entries(data.player)) {
          store.commit("horde/updatePlayerKey", { key, value: elem });
        }
      }
      if (data.enemy) {
        store.commit("horde/updateKey", { key: "enemy", value: {} });
        for (const [key, elem] of Object.entries(data.enemy)) {
          store.commit("horde/updateEnemyKey", {
            key,
            value: key === sigil ? elem.filter((item) => Object.keys(sigil).includes(item)) : elem,
          });
        }
      }
      {
          if (store.state.horde.items[key]) {
    me: key, key: "found", value: true });
            }
            if (elem.passive) {
              store.commit("horde/updateItemKey", { name: key, key: "passive", value: true });
            }
            store.commit("horde/updateItemKey", { name: key, key: "known", value: true });
            store.commit("horde/updateItemKey", { name: key, key: "level", value: elem.level });
            store.commit("horde/updateItemKey", { name: key, key: "cooldownLeft", value: elem.cooldownLeft });
            store.commit("horde/updateItemKey", { name: key, key: "collapse", value: elem.collapse });
            if (elem.masteryPoint !== undefined) {
              store.commit("horde/updateItemKey", { name: key, key: "masteryPoint", value: elem.masteryPoint });
              store.commit("horde/updateItemKey", { name: key, key: "masteryLevel", value: elem.masteryLevel });
            }
            if (elem.equipped) {
              store.commit("horde/updateItemKey", { name: key, key: "equipped", value: true });
              store.dispatch("horde/applyItemEffects", key);
            }
          }
        }
      }
      if (data.loadout) {
        let nextId = 1;
        data.loadout.forEach((elem) => {
          store.commit("horde/addExistingLoadout", {
            id: nextId,
            name: decodeURIComponent(elem.name),
            content: elem.content,
          });
          nextId++;
        });
        store.commit("horde/updateKey", { key: "nextLoadoutId", value: nextId });
      }
      if (data.heirloom) {
        for (const [key, elem] of Object.entries(data.heirloom)) {
          if (store.state.horde.heirloom[key]) {
            store.commit("horde/updateHeirloomKey", { name: key, key: "amount", value: elem });
            store.dispatch("horde/applyHeirloomEffects", key);
          }
        }
      }
      if (data.itemStatMult) {
        for (const [key, elem] of Object.entries(data.itemStatMult)) {
          const split = key.split("_");
          store.commit("horde/updateSubkey", { name: "itemStatMult", key, value: elem });
          store.dispatch("system/applyEffect", {
            type: split[1],
            name: split[0],
            multKey: `hordeItemPermanent`,
            value: elem + (split[1] === "mult" ? 1 : 0),
          });
        }
      }
      if (data.tower) {
        for (const [key, elem] of Object.entries(data.tower)) {
          if (store.state.horde.tower[key]) {
            store.commit("horde/updateTowerKey", { name: key, key: "highest", value: elem });
          }
        }
      }
      if (data.skillLevel) {
        for (const [key, elem] of Object.entries(data.skillLevel)) {
          store.commit("horde/updateSubkey", { name: "skillLevel", key, value: elem });
          store.dispatch("horde/applySkillEffects", key);
        }
      }
      if (data.classQuest) {
        for (const [key, elem] of Object.entries(data.classQuest)) {
          for (const [qkey, qelem] of Object.entries(elem)) {
            store.commit("horde/updateClassQuestKey", { name: key, key: qkey, value: qelem });
          }
        }
      }
      if (data.areaUnlock) {
        for (zone) => {
            if (store.state.horde.area[ke key, zone, key: "unlocked", value: true });
            }
          });
        }
      }
      if (data.activeTimer !== undefined) {
        store.dispatch("horde/updateActiveTimer", data.activeTimer);
      }
      if (data.trinket) {
        for (const [name, value] of Object.entries(data.trinket)) {
          store.commit("horde/updateTrinketKey", { name, key: "amount", value: value.amount });
          store.commit("horde/updateTrinketKey", {
            name,
            key: "level",
            value: store.state.horde.trinketAmountNeeded.filter((el) => value.amount >= el).length,
          });
          store.commit("horde/updateTrinketKey", { name, key: "equipped", value: value.equipped });
          store.commit("horde/updateTrinketKey", { name, key: "isActive", value: value.isActive });
          if (value.isActive) {
            store.dispatch("horde/applyTrinketEffects", name);
          }
        }
      }
      store.dispatch("horde/checkZoneUnlocks");
      store.dispatch("mult/updateExternalCaches", "hordeNostalgia");
      store.dispatch("horde/updateNostalgia");
      store.dispatch("horde/applyTowerEffects");
      store.dispatch("horde/updatePlayerCache");
      store.dispatch("horde/applyClassEffects");
      store.dispatch("horde/applyClassLevelEffects");
      store.dispatch("horde/applyBattlePassEffects");
      store.dispatch("horde/updateSacrifice");
      store.dispatch("horde/updateEnergy");
      store.dispatch("horde/updateMana");
      store.dispatch("horde/updateMaxDifficulty");
      store.dispatch("horde/updateMysticalShardCap");
    },
  },
  "modules/meta": {
    name: "meta",
    tickspeed: 5,
    unlockNeeded: null,
    tick() {
      for (const [key, elem] of Object.entries(store.state.system.tutorial)) {
        if (
          !elem.active &&
          !elem.completed &&
          (elem.screen === null || elem.screen === store.state.system.screen) &&
          elem.enableCondition()
        ) {
          if (elem.currentDelay >= elem.delay) {
            store.commit("system/updateTutorialKey", { name: key, key: "active", value: true });
          } else {
            store.commit("system/updateTutorialKey", { name: key, key: "currentDelay", value: elem.currentDelay + 1 });
          }
        }
      }
    },
    unlock: ["debugFeature"],
    stat: { longestOfflineTime: { display: "time" } },
    achievement: {
      totalLevel: {
        value: () => store.getters["achievement/totalLevel"] - store.state.achievement.meta_totalLevel.level,
        milestones: (lvl) => getSequence(5, lvl + 1) * 10,
        relic: { 0: "excavator", 1: "redCard", 2: "briefcase", 3: "strangePlant", 4: "beneficialVirus" },
      },
      highestGrade: {
        value: () => store.state.stat.school_highestGrade.total,
        secret: true,
        display: "grade",
        cap: 5,
        milestones: (lvl) => (lvl + 1) * 3 - 2,
      },
      longestOfflineTime: {
        value: () => store.state.stat.meta_longestOfflineTime.total,
        secret: true,
        display: "time",
        cap: 3,
        milestones: (lvl) => [SECONDS_PER_DAY * 7, SECONDS_PER_DAY * 30, SECONDS_PER_DAY * 365][lvl],
      },
    },
    note: [...buildArray(6).map(() => "g"), ...buildArray(2).map(() => "system")],
    init() {
      for (const [key, elem] of Object.entries(themes)) {
        store.commit("system/initTheme", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries({
        "1.5.8": v1_5_8,
        "1.5.7": v1_5_7,
        "1.5.6": v1_5_6,
        "1.5.5": v1_5_5,
        "1.5.4": v1_5_4,
        "1.5.3": v1_5_3,
        "1.5.2": v1_5_2,
        "1.5.1": v1_5_1,
        "1.5.0": v1_5_0,
        "1.4.2": v1_4_2,
        "1.4.1": v1_4_1,
        "1.4.0": v1_4_0,
        "1.3.6": v1_3_6,
        "1.3.5": v1_3_5,
        "1.3.4": v1_3_4,
        "1.3.3": v1_3_3,
        "1.3.2": v1_3_2,
        "1.3.1": v1_3_1,
        "1.3.0": v1_3_0,
        "1.2.0": v1_2_0,
        "1.1.2": v1_1_2,
        "1.1.1": v1_1_1,
        "1.1.0": v1_1_0,
        "1.0.1": v1_0_1,
        "1.0.0": v1_0_0,
      })) {
        store.commit("system/initPatchnote", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries({
        miningDepth: {
          screen: "mining",
          delay: 3,
          cssDesktop: "top: 135px; left: calc(12.5% - 2px);",
          cssTablet: "top: 135px; left: calc(50% - 2px);",
          cssMobile: "top: 127px; left: calc(50% - 2px);",
        },
        miningUpgrade: {
          screen: "mining",
          enableCondition: () => store.state.stat.mining_maxDepth0.total >= 5,
          delay: 0,
          cssDesktop: "top: 296px; right: 12px;",
          cssTablet: "top: 92px; left: calc(75% - 36px);",
          cssMobile: "top: 84px; left: calc(83.3333% - 36px);",
        },
        viewFeature: {
          enableCondition: () => store.state.unlock.gemFeature.see,
          delay: 5,
          cssDesktop: "top: 30px; left: 100px; rotate: -30deg;",
          cssTablet: "top: 30px; left: 100px; rotate: -30deg;",
          cssMobile: "top: 26px; left: 12px; rotate: -30deg;",
        },
        villageJob: {
          screen: "village",
          delay: 3,
          cssDesktop: "top: 208px; left: calc(50% - 107px);",
          cssTablet: "top: 208px; right: 107px;",
          cssMobile: "top: 84px; left: calc(37.5% - 36px);",
        },
      })) {
        store.commit("system/initTutorial", { name: key, ...elem });
      }
    },
  },
  "modules/mining/achievement": {
    maxDepth0: { value: () => store.state.stat.mining_maxDepth0.total, default: 1, milestones: (lvl) => lvl * 25 + 25 },
    maxDepth1: { value: () => store.state.stat.mining_maxDepth1.total, default: 1, milestones: (lvl) => lvl * 10 + 10 },
    maxDepthSpeedrun: {
      value: () => store.state.stat.mining_maxDepthSpeedrun.total,
      default: 1,
      cap: 10,
      milestones: (lvl) => (lvl > 0 ? lvl * 10 + 10 : 15),
      relic: { 1: "radar", 2: "press", 3: "cupboard", 5: "bronzePickaxe", 9: "washingMachine" },
    },
    totalDamage: {
      value: () => store.state.stat.mining_totalDamage.total,
      milestones: (lvl) => Math.pow(buildNum(200, "K"), lvl) * buildNum(10, "M"),
      relic: { 6: "openedGift" },
    },
    maxDamage: {
      value: () => store.state.stat.mining_maxDamage.total,
      milestones: (lvl) => Math.pow(buildNum(200, "K"), lvl) * buildNum(10, "K"),
      relic: { 3: "bomb" },
    },
    scrap: {
      value: () => store.state.stat.mining_scrap.total,
      milestones: (lvl) => Math.pow(8000, lvl) * buildNum(5, "M"),
      relic: { 3: "jumprope", 4: "oreShelf" },
    },
    oreTotal: {
      value: () =>
        [
          store.state.stat.mining_oreAluminium.total,
          store.state.stat.mining_oreCopper.total,
          store.state.st   store.state.stat.mining_oreTitanium.total,
    ng_oreIridium.total,
          store.state.stat.mining_oreOsmium.total,
          store.state.stat.mining_oreLead.total,
        ].reduce((a, b) => a + b, 0),
      milestones: (lvl) => Math.pow(10, lvl) * 100,
      relic: { 2: "aluminiumBrick", 3: "copperBrick", 4: "aluminiumHeap", 5: "copperPickaxe", 6: "tinBucket" },
    },
    oreVariety: {
      value: () =>
        [
          store.state.stat.mining_oreAluminium.total,
          store.state.stat.mining_oreCopper.total,
          store.state.stat.mining_oreTin.total,
          store.state.stat.mining_oreIron.total,
          store.state.stat.mining_oreTitanium.total,
          store.state.stat.mining_orePlatinum.total,
          store.state.stat.mining_oreIridium.total,
          store.state.stat.mining_oreOsmium.total,
          store.state.stat.mining_oreLead.total,
        ].reduce((a, b) => a + (b > 0 ? 1 : 0), 0),
      milestones: (lvl) => lvl + 2,
      relic: { 1: "copperHeap", 2: "catalyst", 3: "magnet" },
    },
    depthDwellerCap0: {
      value: () => store.state.stat.mining_depthDwellerCap0.total,
      cap: 30,
      milestones: (lvl) => lvl * 10 + (lvl === 0 ? 5 : 0),
      relic: { 0: "hammer" },
    },
    depthDwellerCap1: {
      value: () => store.state.stat.mining_depthDwellerCap1.total,
      milestones: (lvl) => lvl * 10 + (lvl === 0 ? 5 : 0),
    },
    coal: {
      value: () => store.state.stat.mining_coal.total,
      milestones: (lvl) => Math.pow(2.5, lvl) * 100,
      relic: { 2: "coalBrick" },
    },
    resin: {
      value: () => store.state.stat.mining_resin.total,
      milestones: (lvl) => Math.pow(2, lvl) * 50,
      relic: { 3: "honeyPot" },
    },
    craftingWasted: {
      value: () => store.state.stat.mining_craftingWasted.total,
      secret: true,
      display: "boolean",
      cap: 1,
      milestones: () => 1,
    },
    dwellerCapHit: {
          display: "boolean",
      cap: 1,
      mil.mining_craftingLuck.total,
      default: 1,
      secret: true,
      cap: 1,
      milestones: () => buildNum(1, "M"),
    },
  },
  "modules/mining/beacon": {
    piercing: {
      color: "purple",
      ownedMult: "miningBeaconPiercing",
      effect: [{ name: "miningToughness", type: "mult", value: (lvl) => 1 / (lvl * 0.25 + 5) }],
    },
    rich: {
      color: "orange",
      ownedMult: "miningBeaconRich",
      effect: [{ name: "miningOreGain", type: "mult", value: (lvl) => lvl * 0.05 + 2 }],
    },
    wonder: {
      color: "blue",
      ownedMult: "miningBeaconWonder",
      effect: [{ name: "miningRareEarthGain", type: "mult", value: (lvl) => lvl * 0.04 + 1.6 }],
    },
    hope: {
      color: "green",
      ownedMult: "miningBeaconHope",
      range: 5,
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => lvl * 0.01 + 1.1 },
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => lvl * 0.015 + 1.2 },
      ],
    },
  },
  "modules/mining/card": {
    feature: {
      prefix: "MI",
      reward: [{ name: "miningDamage", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
      shinyReward: [{ name: "miningPrestigeIncome", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
      powerReward: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.08, lvl) },
        { name: "miningPrestigeIncome", type: "mult", value: (lvl) => Math.pow(1.05, lvl) },
      ],
      unlock: null,
    },
    collection: {
      minersAndEquipment: { reward: [{ name: "miningDamage", type: "mult", value: 1.35 }] },
      scrapLogistics: {
        reward: [
          { name: "miningCardCap", type: "base", value: 1 },
          { name: "currencyMiningScrapCap", type: "mult", value: 2 },
        ],
      },
      caveLocations: {
        reward: [
          { name: "villageCardCap", type: "base", value: 1 },
          { name: "currencyVillageStoneGain", type: "mult", value: 1.5 },
        ],
      },
      dangersInTheDark: {
        reward: [
          { name: "miningCardCap", type: "base", value: 1 },
          { name: "hordeCardCap", type: "base", value: 1 },
        ],
      },
    },
    pack: {
      intoDarkness: {
        amount: 3,
        price: 15,
        content: {
          "MI-0001": 2.75,
          "MI-0002": 0.3,
          "MI-0003": 0.58,
          "MI-0004": 1.1,
          "MI-0005": 1.22,
          "MI-0006": 0.9,
          "MI-0007": 0.65,
          "MI-0008": 1.11,
          "MI-0009": 1.56,
          "MI-0010": 0.28,
          "MI-0011": 0.73,
          "MI-0012": 0.86,
          "MI-0013": 1.05,
          "MI-0014": 1.45,
          "MI-0015": 0.49,
          "MI-0016": 0.55,
          "MI-0017": 0.52,
          "MI-0018": 1.16,
          "MI-0023": 0.18,
          "MI-0024": 0.05,
        },
      },
      drillsAndDepths: {
        unlock: "miningDepthDweller",
        amount: 4,
        price: 35,
        content: {
          "MI-0001": 1.8,
          "MI-0002": 0.4,
          "MI-0003": 0.65,
          "MI-0004": 1.1,
          "MI-0005": 1.22,
          "MI-0006": 0.9,
          "MI-0013": 1.05,
          "MI-0014": 1.45,
          "MI-0015": 0.69,
          "MI-0016": 0.55,
          "MI-0017": 0.52,
          "MI-0018": 1.16,
          "MI-0019": 1.55,
          "MI-0020": 2.3,
          "MI-0021": 1.91,
          "MI-0022": 2.12,
          "MI-0023": 0.36,
          "MI-0024": 0.12,
          "MI-0025": 0.46,
          "MI-0026": 0.62,
          "MI-0027": 1.35,
        },
      },
      hotStuff: {
        unlock: "miningSmeltery",
        amount: 5,
        price: 70,
        content: {
          "MI-0007": 1.3,
          "MI-0008": 1.77,
          "MI-0009": 1.56,
          "MI-0010": 0.28,
          "MI-0011": 0.58,
          "MI-0012": 0.51,
          "MI-0023": 0.72,
          "MI-0024": 0.24,
          "MI-0025": 0.46,
          "MI-0026": 0.62,
          "MI-0027": 1.35,
          "MI-0028": 0.8,
          "MI-0029": 0.66,
          "MI-0030": 2.8,
          "MI-0031": 1.35,
          "MI-0032": 0.5,
        },
      },
      dangerZone: {
        unlock: "miningResin",
        amount: 4,
        price: 105,
        content: {
          "MI-0032": 1.6,
          "MI-0033": 1.45,
          "MI-0034": 1.35,
          "MI-0035": 2.1,
          "MI-0036": 1.95,
          "MI-0037": 3.35,
          "MI-0038": 2.1,
        },
      },
    },
    card: cardList,
  },
  "modules/mining/enhancement": {
    barAluminium: {
      effect: [
        { name: "miningPickaxeCraftingQuality", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
        { name: "miningOreQuality", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    barBronze: {
      effect: [
        { name: "miningOreGain", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
        { name: "miningRareEarthGain", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    barSteel: {
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => lvl * 0.35 + 1 },
        { name: "miningToughness", type: "mult", value: (lvl) => Math.pow(1 / 1.5, lvl) },
      ],
    },
    barTitanium: {
      effect: [{ name: "currencyMiningScrapGain", type: "mult", value: (lvl) => getSequence(2, lvl) + 1 }],
    },
    barShiny: {
      effect: [
        { name: "miningDepthDwellerSpeed", type: "mult", value: (lvl) => Math.pow(1.35, lvl) },
        { name: "currencyMiningCrystalGreenGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
      ],
    },
    barIridium: { effect: [{ name: "currencyMiningEmberGain", type: "mult", value: (lvl) => lvl + 1 }] },
    barDarkIron: {
      effect: [{ name: "currencyMiningScrapCap", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.5 + 1 }],
    },
  },
  "modules/mining/ore": {
    oreAluminium: {
      power: 15,
      impurity: 1.5,
      minDepth: 15,
      maxDepth: 45,
      modulo: 3,
      baseAmount: 0.02,
      amountMult: 1.05,
    },
    oreCopper: { power: 50, impurity: 2, minDepth: 30, maxDepth: 68, modulo: 4, baseAmount: 0.004, amountMult: 1.05 },
    oreTin: { power: 240, impurity: 2.5, minDepth: 50, maxDepth: 100, modulo: 5, baseAmount: 0.0008, amountMult: 1.05 },
    oreIron: {
      power: 1300,
      impurity: 3,
      minDepth: 80,
      maxDepth: 140,
      modulo: 7,
      baseAmount: 0.00016,
      amountMult: 1.05,
    },
    oreTitanium: {
      power: 7000,
      impurity: 3.5,
      minDepth: 120,
      maxDepth: 200,
      modulo: 11,
      baseAmount: 0.000032,
      amountMult: 1.05,
    },
    orePlatinum: {
      power: buildNum(40, "K"),
      impurity: 4,
      minDepth: 175,
      maxDepth: 295,
      modulo: 13,
      baseAmount: 0.0000064,
      amountMult: 1.05,
   minDepth: 260,
      maxDepth: 420,
      modulo: {
      power: buildNum(1.75, "M"),
      impurity: 6,
      minDepth: 350,
      maxDepth: 525,
      modulo: 23,
      baseAmount: 0.000000256,
      amountMult: 1.05,
    },
    oreLead: {
      power: buildNum(12.5, "M"),
      impurity: 7.5,
      minDepth: 450,
      maxDepth: 650,
      modulo: 29,
      baseAmount: 0.0000000512,
      amountMult: 1.05,
    },
  },
  "modules/mining/relic": {
    friendlyBat: {
      icon: "mdi-bat",
      color: "dark-grey",
      effect: [{ name: "currencyMiningScrapGain", type: "mult", value: 1.25 }],
    },
    hammer: {
      icon: "mdi-hammer",
      color: "brown",
      effect: [{ name: "mining_craftingStation", type: "keepUpgrade", value: true }],
    },
    aluminiumBrick: {
      icon: "mdi-wall",
      color: "blue-grey",
      effect: [
        { name: "mining_aluminiumCache", type: "keepUpgrade", value: true },
        { name: "mining_aluminiumHardening", type: "keepUpgrade", value: true },
      ],
    },
    copperBrick: {
      icon: "mdi-wall",
      color: "orange",
      effect: [{ name: "mining_copperCache", type: "keepUpgrade", value: true }],
    },
    aluminiumHeap: {
      icon: "mdi-dots-triangle",
      color: "blgrade", value: true },
        { name: "mining_alumi  icon: "mdi-bomb",
      color: "red",
      effect: [{ name: "mining_hullbreaker", type: "keepUpgrade", value: true }],
    },
    copperHeap: {
      icon: "mdi-dots-triangle",
      color: "orange",
      effect: [{ name: "mining_copperTanks", type: "keepUpgrade", value: true }],
    },
    radar: {
      icon: "mdi-radar",
      color: "light-green",
      effect: [{ name: "mining_depthDweller", type: "keepUpgrade", value: true }],
    },
    press: {
      icon: "mdi-download",
      color: "deep-purple",
      effect: [{ name: "mining_compressor", type: "keepUpgrade", value: true }],
    },
    cupboard: {
      icon: "mdi-cupboard",
      color: "brown",
      effect: [{ name: "mining_oreSlots", type: "keepUpgrade", value: true }],
    },
    catalyst: {
      icon: "mdi-flask",
      color: "teal",
      effect: [{ name: "mining_refinery", type: "keepUpgrade", value: true }],
    },
    jumprope: {
      icon: "mdi-jump-rope",
      color: "brown",
      effect: [
        { name: "mining_aluminiumExpansion", type: "keepUpgrade", value: true },
        { name: "mining_copperExpansion", type: "keepUpgrade", value: true },
      ],
    },
    bronzePickaxe: {
      icon: "mdi-pickaxe",
      color: "amber",
      effect: [{ name: "mining_graniteHardening", type: "keepUpgrade", value: true }],
    },
    oreShelf: {
      icon: "mdi-window-closed",
      color: "brown",
      effect: [
        { name: "mining_oreShelf", type: "keepUpgrade", value: true },
        { name: "mining_tinCache", type: "keepUpgrade",olor: "dark-grey",
      effect: [{ name: "mining   icon: "mdi-washing-machine",
      color: "skyblue",
      effect: [{ name: "mining_oreWashing", type: "keepUpgrade", value: true }],
    },
    openedGift: {
      icon: "mdi-gift-open",
      color: "blue",
      effect: [
        { name: "mining_bronzeCache", type: "keepUpgrade", value: true },
        { name: "mining_ironCache", type: "keepUpgrade", value: true },
      ct: [
        { name: "mining_ironExpansion", type: "Upgrade", value: true },
        { name: "mining_ironFilter", type: "keepUpgrade", value: true },
      ],
    },
    copperPickaxe: {
      icon: "mdi-pickaxe",
      color: "orange",
      effect: [
        { name: "mining_magnet", type: "keepUpgrade", value: true },
        { name: "mining_warehouse", type: "keepUpgrade", value: true },
      ],
    },
    tinBucket: {
      icon: "mdi-pail",
      color: "grey",
      effect: [
        { name: "mining_titaniumExpansion", type: "keepUpgrade", value: true },
        { name: "mining_titaniumCache", type: "keepUpgrade", value: true },
      ],
    },
    honeyPot: { icon: "mdi-pot", color: "amber", effect: [{ name: "miningResinMax", type: "base", value: 1 }] },
  },
  "modules/mining/smeltery": {
    aluminium: {
      price: { mining_oreAluminium: { base: 1000, increment: 50 }, mining_granite: { base: 800, increment: 800 } },
      output: "mining_barAluminium",
      timeNeeded: 300,
      minTemperature: 100,
    },
    bronze: {
      price: {
        mining_oreCopper: { base: 900, increment: 45 },
        mining_oreTin: { base: 100, increment: 5 },
        mining_salt: { base: 150, increment: 50 },
      },
      output: "mining_barBronze",
      timeNeeded: SECONDS_PER_HOUR,
      minTemperature: 275,
    },
    steel: {
      price: { mining_oreIron: { base: 1000, increment: 50 }, mining_coal: { base: 2, increment: 0 } },
      output: "mining_barSteel",
      timeNeeded: 8 * SECONDS_PER_HOUR,
      minTemperature: 500,
    },
    titanium: {
      price: {
        mining_oreTitanium: { base: 1000, increment: 50 },
        mining_sulfur: { base: 200, increment: 10 },
        mining_niter: { base: 50, increment: 0 },
      },
      output: "mining_barTitanium",
      timeNeeded: 3 * SECONDS_PER_DAY,
      minTemperature: 800,
    },
    shiny: {
      price: {
        mining_orePlatinum: { base: 1000, increment: 50 },
        mining_obsidian: { base: buildNum(2, "M"), increment: buildNum(100, "K") },
      },
      output: "mining_barShiny",
      timeNeeded: 30 * SECONDS_PER_DAY,
      minTemperature: 1200,
    },
    iridium: {
      price: {
        mining_oreIridium: { base: 1000, increment: 50 },
        mining_helium: { base: buildNum(10, "K"), increment: 2500 },
      },
      output: "mining_barIridium",
      timeNeeded: 365 * SECONDS_PER_DAY,
      minTemperature: 1750,
    },
    darkIron: {
      price: {
        mining_oreIron: { base: buildNum(10, "M"), increment: buildNum(500, "K") },
        mining_oreOsmium: { base: 1000, increment: 50 },
        mining_deeprock: { base: buildNum(100, "M"), increment: buildNum(25, "M") },
        mining_neon: { base: buildNum(10, "K"), increment: 2500 },
      },
      output: "mining_barDarkIron",
      timeNeeded: 5000 * SECONDS_PER_DAY,
      minTemperature: 2500,
    },
  },
  "modules/mining/upgrade": {
    damageUp: {
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(lvl * 0.012 + 1.24, lvl) * 120) };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.12, lvl) * Math.pow(lvl * 0.2 + 1, 2) },
      ],
    },
    scrapGainUp: {
      requirementBase,
      requirementStat,
      requirementValue: 5,
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(lvl * 0.1 + 2.5, lvl) * 1250) };
      },
      effect: [{ name: "currencyMiningScrapGain", type: "mult", value: (lvl) => Math.pow(1.2, lvl) }],
    },
    scrapCapacityUp: {
      cap: 50,
      requirementBase,
      requirementStat,
      requirementValue: 10,
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(3.3, lvl) * 3000) };
      },
      effect: [{ name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(3, lvl) }],
    },
    aluminiumCache: {
      cap: 10,
      requirementBase,
      requirementStat,
      requirementValue: 15,
      price(lvl) {
        return { mining_oreAluminium: Math.round(3 * (lvl + 1)) };
      },
      effect: [
        { name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyMiningOreAluminiumCap", type: "base", value: (lvl) => 2 * lvl },
      ],
    },
    aluminiumHardening: {
      cap: 6,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 15,
      price(lvl) {
        return { mining_oreAluminium: Math.round(Math.pow(1.5, Math.max(0, lvl - 5)) * 4 * lvl + 2) };
      },
      effect: [{ name: "miningDamage", type: "mult", value: (lvl) => (lvl + 1) * Math.pow(1.5, Math.min(6, lvl)) }],
    },
    craftingStation: {
      cap: 1,
      hasDescription: true,
      requirementBase,
      requirementStat,
      requirementValue: 20,
      price() {
        return { mining_scrap: buildNum(1.8, "M") };
      },
      effect: [{ name: "miningPickaxeCrafting", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    forge: {
      requirement() {
        return store.state.unlock.miningPickaxeCrafting.use;
      },
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(1.35, lvl) * buildNum(2.5, "M")) };
      },
      effect: [{ name: "miningPickaxeCraftingPower", type: "mult", value: (lvl) => Math.pow(1.2, lvl) }],
    },
    oreSlots: {
      cap: 10,
      hideCap: true,
      requirementBase,
      requirementStat,
      requirementVth0.total >= [25, 25, 30, 50, 80, 120, 175, 260, 350, 450nium: 10 },
          { mining_oreAluminium: 30 },
          { mining_oreCopper: 20 },
          { mining_oreTin: 15 },
          { mining_oreIron: 12 },
          { mining_oreTitanium: 10 },
          { mining_orePlatinum: 8 },
          { mining_oreIridium: 6 },
          { mining_oreOsmium: 5 },
          { mining_oreLead: 4 },
        ][lvl];
      },
      effect: [{ name: "miningPickaxeCraftingSlots", type: "base", value: (lvl) => lvl }],
    },
    compressor: {
      cap: 9,
      hasDescription: true,
      hideCap: true,
      requirementBase,
      requirementStat,
      requirementValue: 25,
      requirement(lvl) {
        return store.state.stat.mining_maxDepth0.total >= [25, 35, 60, 95, 140, 200, 280, 375, 480][lvl];
      },
      price(lvl) {
        return [
          { mining_oreAluminium: 20 },
          { mining_oreAluminium: 80 },
          { mining_oreAluminium: buildNum(10, "K") },
          { mining_oreAluminium: buildNum(30, "K") },
          { mining_oreAluminium: buildNum(750, "K") },
          { mining_oreAluminium: buildNum(1, "B") },
          { mining_oreAluminium: buildNum(100, "T") },
          { mining_oreAluminium: buildNum(100, "Qi") },
          { mining_oreAluminium: buildNum(1, "O") },
        ][lvl];
      },
      effect: [
        { name: "miningCompressAluminium", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "miningCompressCopper", type: "unlock", value: (lvl) => lvl >= 2 },
        { name: "miningCompressTin", type: "unlock", value: (lvl) => lvl >= 3 },
        { name: "miningCompressIron", type: "unlock", value: (lvl) => lvl >= 4 },
        { name: "miningCompressTitassPlatinum", type: "unlock", value: (lvl) => lvl >= 6 >= 7 },
        { name: "miningCompressOsmium", type: "unlock", value: (lvl) => lvl >= 8 },
        { name: "miningCompressLead", type: "unlock", value: (lvl) => lvl >= 9 },
      ],
    },
    copperCache: {
      cap: 8,
      requirementBase,
      requirementStat,
      requirementValue: 30,
      price(lvl) {
        return { mining_oreCopper: Math.round(lvl + 3) };
      },
      effect: [
        { name: "currencyMiningOreAluminiumCap", type: "base", value: (lvl) => 2 * lvl },
        { name: "currencyMiningOreCopperCap", type: "base", value: (lvl) => lvl },
      ],
    },
    aluminiumTanks: {
      cap: 8,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 30,
      price(lvl) {
        return { mining_scrap: Math.pow(4.75, lvl) * buildNum(40, "M") };
      },
      effect: [
        {
          name: "currencyMiningOreAluminiumCap",
          type: "base",
          value: (lvl) => Math.round(Math.pow(lvl, 1.2) * Math.pow(1.1, Math.min(8, lvl)) * 5),
        },
      ],
    },
    aluminiumAnvil: {
      cap: 10,
      requirementBase,
      requirementStat,
      reh.ceil(Math.pow(1.1, lvl) * (lvl + 1) * 10) };
      },
=> Math.pow(1.15, lvl) }],
    },
    hullbreaker: {
      cap: 10,
      requirementBase,
      requirementStat,
      requirementValue: 35,
      price(lvl) {
        return { mining_scrap: Math.pow(1.8, lvl) * buildNum(550, "M") };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "miningToughness", type: "mult", value: (lvl) => Math.pow(1 / 1.3, lvl) },
      ],
    },
    copperTanks: {
      cap: 5,
      requirementBase,
      requirementStat,
      requirementValue: 40,
      price(lvl) {
        return { mining_scrap: Math.pow(2.3, lvl) * buildNum(3.5, "B") };
      },
      effect: [
        { name: "currencyMiningOreAluminiumCap", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
        { name: "currencyMiningOreCopperCap", type: "base", value: (lvl) => 4 * lvl },
      ],
    },
    depthDweller: {
      cap: 1,
      hasDescription: true,
      requirementBase,
      requirementStat,
      requirementValue: 40,
      price() {
        return { mining_oreCopper: 24 };
      },
      effect: [{ name: "miningDepthDweller", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    aluminiumExpansion: {
      cap: 5,
      requirementBase,
      requirementStat,
      requirementValue: 45,
      price(lvl) {
        return { mining_oreAluminium: Math.pow(2.25, lvl) * 150 };
      },
      effect: [

        { name: "currencyMiningOreAluminiumCap", typ
      cap: 5,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 45,
      price(lvl) {
        return { mining_oreCopper: 10 * lvl + 30 };
      },
      effect: [
        { name: "miningOreGain", type: "mult", value: (lvl) => splicedLinear(0.1, 0.05, 5, lvl) + 1 },
        { name: "currencyMiningOreCopperCap", type: "base", value: (lvl) => 12 * lvl },
      ],
    },
    copperExpansion: {
      cap: 3,
      requirementBase,
      requirementStat,
      requirementValue: 50,
      price(lvl) {
        return { mining_scrap: Math.pow(4.2, lvl) * buildNum(90, "B") };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyMiningOreCopperCap", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
      ],
    },
    drillFuel: {
      requirementBase,
      requirementStat,
      requirementValue: 50,
      price(lvl) {
        return { mining_scrap: Math.pow(lvl * 0.1 + 2.4, lvl) * buildNum(35, "B") };
      },
      effect: [
        { name: "miningDepthDwellerSpeed", type: "mult", value: (lvl) => Math.pow(1.02, lvl) * (lvl * 0.05 + 1) },
      ],
    },
    graniteHardening: {
      cap: 6,
      requirementBase,
      requirementStat,
      requirementValue: 55,
      price(lvl) {
        return { mining_granite: Math.pow(2.5, lvl) * 1600, mmult", value: (lvl) => Math.pow(1.3, lvl) }],
    },
        note: "mining_18",
      requirementBase,
      requirementStat,
      requirementValue: 60,
      price() {
        return { mining_granite: buildNum(50, "K") };
      },
      effect: [{ name: "miningSmeltery", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    oreShelf: {
      cap: 4,
      requirementBase,
      requirementStat,
      requirementValue: 60,
      price(lvl) {
        return { mining_oreCopper: Math.pow(1.5, lvl) * 160, mining_barAluminium: 5 };
      },
      effect: [{ name: "currencyMiningOreTinCap", type: "base", value: (lvl) => lvl }],
    },
    heatShield: {
      requirementBase,
      requirementStat,
      requirementValue: 62,
      price(lvl) {
        return { mining_granite: Math.pow(1.55, lvl) * buildNum(20, "K") };
      },
      effect: [{ name: "miningSmelteryTemperature", type: "base", value: (lvl) => lvl * 15 }],
    },
    tinCache: {
      cap: 4,
      requirementBase,
      requirementStat,
      requirementValue: 65,
      price(lvl) {
        return { mining_scrap: Math.pow(5.75, lvl) * buildNum(25, "T"), mining_oreTin: lvl * 2 + 1 };
      },
      effect: [
        { name: "currencyMiningOreCopperCap", type: "base", value: (lvl) => lvl * 24 },
        { name: "currencyMiningOreTinCap", type: "base", value: (lvl) => lvl },
      ],
    },
    furnace: {
      cap: 25,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 70,
      price(lvl) {
        let obj = {
          mining_scrap: Math.pow(1.3, lvl) * buildNum(70, "T"),
          mining_oreTin: Math.floor(lvl * 0.2 * Math.pow(1.15, lvl) + 2),
        };
        if (lvl >= 5) {
          obj.mining_salt = Math.pow(1.45, lvl - 5) * 60;
        }
        return obj;
      },
      effect: [
        { name: "miningPickaxeCraftingPower", type: "mult", value: (lvl) => splicedPowLinear(1.1, 0.05, 25, lvl) },
        { name: "miningOreGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    bronzeCache: {
      cap: 4,
      requirementBase,
      requirementStat,
      requirementValue: 75,
      price(lvl) {
        return { mining_salt: Math.pow(4, lvl) * 175, mining_barAluminium: 7 };
      },
      effect: [
        { name: "currencyMiningOreCopperCap", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
        { name: "currencyMiningOreTinCap", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
      ],
    },
    ironCache: {
      cap: 3,
      requirementBase,
      requirementStat,
      requirementValue: 80,
      price(lvl) {
        return { mining_scrap: Math.pow(8.5, lvl) * buildNum(12, "Qa"), mining_barAluminium: 12 };
      },
      effect: [{ name: "currencyMiningOreIronCap", type: "base", value: (lvl) => lvl }],
    },
    oreWashing: {
      cap: 15,
      requirementBasereturn { mining_scrap: Math.pow(1.35, lvl) * buildNum(16.5, type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "miningOreQuality", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    ironExpansion: {
      cap: 3,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 85,
      price(lvl) {
        return { mining_oreIron: Math.pow(1.3, Math.max(0, lvl - 2)) * lvl * 3 + 2, mining_barBronze: 4 };
      },
      effect: [
        { name: "currencyMiningOreTinCap", type: "mult", value: (lvl) => splicedPowLinear(1.5, 0.1, 3, lvl) },
        { name: "currencyMiningOreIronCap", type: "base", value: (lvl) => lvl },
      ],
    },
    ironHardening: {
      cap: 12,
      requirementBase,
      requirementStat,
      requirementValue: 90,
      price(lvl) {
        return { mining_oreIron: Math.floor(Math.pow(1.35, lvl) + 1) };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "currencyMiningOreTinCap", type: "base", value: (lvl) => lvl * 2 },
      ],
    },
    ironFilter: {
      cap: 8,
      requirementBase,
      requirementStat,
      requirementValue: 95,
      price(lvl) {
        return { mining_oreIron: Math.floor(Math.pow(1.85, lvl) * 5), mining_barBronze: 5 };
      },
      effect: [{ name: "currencyMiningOreAluminiumCap", type: "base", value: (lvl) => lvl * 36 }],
    },
    masterForge: {
      requirementBase,
      requirementStat,
      requirementValue: 98,
      price(lvl) {
        return { mining_coal: lvl * 20 + 80 };
      },
      effect: [{ name: "miningDamage", type: "mult", value: (lvl) => lvl * 0.15 + 1 }],
    },
    starForge: {
      requirementBase,
      requirementStat,
      requirementValue: 98,
      price(lvl) {
        return { mining_coal: lvl * 20 + 80 };
      },
      effect: [{ name: "currencyMiningCrystalGreenGain", type: "mult", value: (lvl) => lvl * 0.075 + 1 }],
    },
    magnet: {
      cap: 10,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 100,
      price(lvl) {
        return {
          mining_scrap: Math.pow(1.55, lvl) * buildNum(440, "Qa"),
          mining_oreIron: Math.pow(1.2, Math.max(0, lvl - 9)) * lvl * 5 + 10,
          mining_barBronze: 6,
        };
      },
      effect: [
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => splicedPowLinear(1.15, 0.15, 10, lvl) },
        { name: "miningOreGain", type: "mult", value: (lvl) => splicedLinear(0.1, 0.05, 10, lvl) + 1 },
      ],
    },
    enhancingStation: {
      cap: 1,
      hasDescription: true,
      persistent: true,
      note: "mining_25",
      requirementBase,
      requirementStat,
      requirementValue: 105,
      price() {
        return { mining_coal: 250 };
      },
      effect: [{ name: "miningEnhancement", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    warehouse: {
      cap: 12,
      requirementBase,
      requirementStat,
      requirementValue: 110,
      price(lvl) {
        return {
          mining_scrap: Math.pow(6, lvl) * buildNum(6.075, "Qi"),
          mining_barAluminium: lvl * 5: [
        { name: "currencyMiningOreAluminiumCap", gOreCopperCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOreTinCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOreIronCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    corrosiveFumes: {
      cap: 6,
      requirementBase,
      requirementStat,
      requirementValue: 112,
      price(lvl) {
        return { mining_sulfur: Math.pow(3.5, lvl) * 2000 };
      },
      effect: [{ name: "miningToughness", type: "mult", value: (lvl) => Math.pow(1 / 1.2, lvl) }],
    },
    smeltingSalt: {
      requirementBase,
      requirementStat,
      requirementValue: 115,
      price(lvl) {
        return { mining_salt: Math.pow(lvl * 0.01 + 1.4, lvl) * buildNum(10, "K") };
      },
      effect: [{ name: "miningPickaxeCraftingPower", type: "mult", value: (lvl) => Math.pow(1.11, lvl) }],
    },
    titaniumExpansion: {
      cap: 3,
      requirementBase,
      requirementStat,
      requirementValue: 120,
      price(lvl) {
        return {
          mining_oreCopper: Math.pow(2.75, lvl) * buildNum(250, "K"),
          mining_oreTin: Math.pow(2.1, lvl) * buildNum(40, "K"),
        };
      },
      effect: [
        { name: "currencyMiningOreIronCap", type: "base", value: (lvl) => lvl * 3 },
        { name: "currencyMiningOreIronCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyMiningOreTitaniumCap", type: "base", value: (lvl) => lvl },
      ],
    },
    emberForge: {
      hasDescription: true,
      requirementBase,
      requirementStat,
      requirementValue: 125,
      price(lvl) {
        return { mining_coal: lvl * 3 + 80 };
      },
      effect: [{ name: "currencyMiningEmberGain", type: "base", value: (lvl) => lvl * 0.03 }],
    },
    titaniumCache: {
      cap: 5,
      requirementBase,
      requirementStat,
      requirementValue: 130,
      price(lvl) {
        return {
          mining_scrap: Math.pow(7, lvl) * buildNum(80, "Sx"),
          mining_oreTitanium: Math.pow(2, lvl) * 4,
          mining_sulfur: Math.pow(2.2, lvl) * buildNum(45, "K"),
          mining_barSteel: 3,
        };
      },
      effect: [
        { name: "currencyMiningOreCopperCap", eTinCap", type: "base", value: (lvl) => lvl * 10l * 4 },
        { name: "currencyMiningOreTitaniumCap", type: "base", value: (lvl) => lvl * 2 },
      ],
    },
    giantForge: {
      persistent: true,
      alwaysActive: true,
      requirementBase,
      requirementStat,
      requirementValue: 132,
      price(lvl) {
        return { mining_coal: Math.round(Math.pow(1.25, lvl) * 1200) };
      },
      effect: [{ name: "currencyMiningEmberCap", type: "base", value: (lvl) => lvl * 50 }],
    },
    gunpowder: {
      requirementBase,
      requirementStat,
      requirementValue: 135,
      price(lvl) {
        return {
          mining_coal: Math.round(Math.pow(1.1, lvl) * (lvl * 20 + 100)),
          mining_sulfur: Math.pow(1.5, lvl) * buildNum(120, "K"),
          mining_niter: Math.round(Math.pow(1.1, lvl) * (lvl * 100 + 500)),
        };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "miningToughness", type: "mult", value: (lvl) => Math.pow(1 / 1.15, lvl) },
      ],
    },
    nitricAcid: {
irementValue: 138,
      price(lvl) {
        return { m    effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "miningEnhancementBarsIncrement", type: "mult", value: (lvl) => 1 / (lvl * 0.03 + 1) },
      ],
    },
    metalDetector: {
      cap: 12,
      capMult: true,
      requirementBase,
      requirementStat,
      requirementValue: 140,
      price(lvl) {
        return { mining_scrap: Math.pow(3.5, lvl) * buildNum(15, "Sp"), mining_barSteel: lvl + 11 };
      },
      effect: [
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => splicedPowLinear(1.1, 0.1, 12, lvl) },
        { name: "currencyMiningScrapCap", type: "mult", value: (lvl) => splicedPowLinear(1.3, 0.3, 12, lvl) },
        { name: "currencyMiningOreTitaniumCap", type: "base", value: (lvl) => lvl * 2 },
      ],
    },
    recycling: {
      persistent: true,
      requirementBase,
      requirementStat,
      requirementValue: 145,
      price(lvl) {
        return { mining_ember: Math.round(Math.pow(1.15, lvl) * 50) };
      },
      effect: [
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) * (lvl * 0.25 + 1) },
      ],
    },
    stickyJar: {
      cap: 1,
      hasDescription: true,
      persistent: true,
    mentValue: 150,
      price() {
        return { mining_scnlock", value: (lvl) => lvl >= 1 }],
    },
    scanning: {
      persistent: true,
      requirementBase,
      requirementStat,
      requirementValue: 155,
      price(lvl) {
        return { mining_obsidian: Math.pow(2, lvl) * buildNum(10, "K") };
      },
      effect: [{ name: "miningOreGain", type: "mult", value: (lvl) => Math.pow(1.18, lvl) }],
    },
    largerSurface: {
      cap: 5,
      requirementBase,
      requirementStat,
      requirementValue: 160,
      price(lvl) {
        return { mining_scrap: Math.pow(4000, lvl) * buildNum(6, "N") };
      },
      effect: [
        { name: "miningResinMax", type: "base", value: (lvl) => lvl },
        { name: "currencyMiningOreTitaniumCap", type: "base", value: (lvl) => lvl * 12 },
      ],
    },
    titaniumForge:Value: 170,
      price(lvl) {
        return {
         250 + 500,
          mining_barSteel: lvl * 5 + 35,
        };
      },
      effect: [
        { name: "miningPickaxeCraftingPower", type: "mult", value: (lvl) => Math.pow(1.17, lvl) },
        { name: "currencyMiningOreTitaniumCap", type: "mult", value: (lvl) => lvl + 1 },
      ],
    },
    platinumExpansion: {
      cap: 5,
      requirementBase,
      requirementStat,
      requirementValue: 180,
      price(lvl) {
        return { mining_oreCopper: Math.pow(1.75, lvl) * buildNum(150, "M"), mining_barTitanium: 4 };
      },
      effect: [
        { name: "currencyMiningOreTitaniumCap", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
        { name: "currencyMiningOrePlatinumCap", type: "base", value: (lvl) => getSequence(3, lvl) },
      ],
    },
    platinumCache: {
      cap: 6,
      requirementBase,
      requirementStat,
      requirementValue: 190,
      price(lvl) {
        return {
          mining_oreTitanium: Math.pow(2, lvl) * 450,
          mining_salt: Math.pow(1.85, lvl) * buildNum(60, "M"),
          mining_sulfur: Math.pow(2.2, lvl) * buildNum(800, "M"),
        };
      },
      effect: [
        { name: "currencyMiningScrapCap", type: "mult", value: (lvl) => lvl * 0.4 + 1 },
        { name: "currencyMiningOrePlatinumCap", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
      ],
    },
    colossalOreStorage: {
      cap: 1,
      requirementBase,
      requirementStat,
      requirementValue: 200,
      price() {
        return { mining_scrap: buildNum(10, "D") };
      },
      effect: [
        { name: "currencyMiningOreAluminiumCap", type: "mult", value: (lvl) => Math.pow(100, lvl) },
        { name: "currencyMiningOreCopperCap", type: "mult", value: (lvl) => Math.pow(100, lvl) },
        { name: "currencyMiningOreTinCap", type: "mult", value: (lvl) => Math.pow(100, lvl) },
        { name: "currencyMiningOreIronCap", type: "mult", value: (lvl) => Math.pow(100, lvl) },
        { name: "currencyMiningOreTitaniumCap", type: "mult", value: (lvl) => Math.pow(100, lvl) },
        { name: "currencyMiningOrePlatinumCap", type: "mult", value: (lvl) => Math.pow(100, lvl) },
      ],
    },
    titaniumBombs: {
      cap: 16,
      requirementBase,
      requirementStat,
      requirementValue: 220,
      price(lvl) {
        return { mining_barSteel: lvl * 8 + 20, mining_barTitanium: lvl * 4 + 4 };
      },
      effect: [{ name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.2, lvl) }],
    },
    undergroundRadar: {
      persistent: true,
      requirementBase,
      requirementStat,
      requirementValue: 240,
      price(lvl) {
        return { mining_barShiny: Math.round(Math.pow(1.15, lvl) * (lvl + 1) * 5) };
      },
      effect: [{ name: "miningRareEarthGain", type: "mult", value: (lvl) => Math.pow(1.13, lvl) }],
    },
    iridiumExpansion: {
      persistent: true,
      requirementBase,
      requirementStat,
      requirementValue: 260,
      price(lvl) {
        return { mining_barTitanium: Math.round(Math.pow(1.22, lvl) * (lvl + 3) * 2) };
      },
      effect: [
        { name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(1.11, lvl) },
        { name: "currencyMiningOreIridiumCap", type: "base", value: (lvl) => getSequence(1, lvl) },
      ],
    },
    iridiumCache: {
      cap: 4,
      requirementBase,
      requirementStat,
      requirementValue: 270,
      price(lvl) {
        return {
          mining_scrap: Math.pow(22.5, lvl) * buildNum(10, "DD"),
          mining_sulfur: Math.pow(2.45, lvl) * buildNum(13, "T"),
        };
      },
      effect: [
        { name: "currencyMiningOreTitaniumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
        { name: "currencyMiningOrePlatinumCap", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
        { name: "currencyMiningOreIridiumCap", type: "mult", value: (lvl) => lvl + 1 },
      ],
    },
    iridiumTreetap: {
      persistent: true,
      requirementBase,
 turn {
          mining_deeprock: Math.pow(lvl + 1, 2) * bulvl + 2)),
        };
      },
      effect: [
        { name: "currencyMiningResinCap", type: "base", value: (lvl) => lvl * 10 },
        { name: "miningResinMax", type: "base", value: (lvl) => lvl },
      ],
    },
    deepCuts: {
      requirementBase,
      requirementStat,
      requirementValue: 290,
      price(lvl) {
        return { mining_deeprock: Math.pow(lvl * 0.01 + 1.5, lvl) * buildNum(2.5, "B") };
      },
      effect: [{ name: "miningToughness", type: "mult", value: (lvl) => Math.pow(1 / 1.25, lvl) }],
    },
    iridiumBombs: {
      cap: 7,
      requirementBase,
      requirementStat,
      requirementValue: 310,
      price(lvl) {
        return { mining_barBronze: Math.round(Math.pow(1.4, lvl) * buildNum(30, "K")), mining_barIridium: lvl * 8 + 6 };
      },
      effect: [{ name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.23, lvl) }],
    },
    oreBag: {
      requirementBase,
      cap: 12,
      requirementStat,
      requirementValue: 330,
      price(lvl) {
        return {
          mining_deeprock: Math.pow(1.65, lvl) * buildNum(800, "B"),
          mining_sulfur: Math.pow(1.9, lvl) * buildNum(450, "T"),
        };
      },
      effect: [
        { name: "currencyMiningOreTinCap", type: "base", value: (lvl) => lvl * 12 },
        { name: "currencyMiningOreIronCap", type: "base", value: (lvl) => lvl * 10 },
        { name: "currencyMiningOreTitaniumCap", type: "base", value: (lvl) => lvl * 4 },
        { name: "currencyMiningOrePlatinumCap", type: "base", value: (lvl) => lvl * 4 },
      ],
    },
    osmiumExpansion: {
      requirementBase,
      cap: 9,
      requirementStat,
      requirementValue: 350,
      price(lvl) {
        return {
          mining_barShiny: Math.round(Math.pow(1.44, lvl) * (lvl + 3) * 25),
          mining_barIridium: Math.round(Math.pow(1.22, lvl) * (lvl + 3) * 8),
        };
      },
      effect: [
        { name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
        { name: "currencyMiningOreOsmiumCap", type: "base", value: (lvl) => lvl * 4 },
      ],
    },
    osmiumCache: {
      cap: 7,
      requirementBase,
      requirementStat,
      requirementValue: 355,
      price(lvl) {
        return {
          mining_scrap: Math.pow(6.75, lvl) * buildNum(900, "SxD"),
          mining_deeprock: Math.pow(2.1, lvl) * buildNum(42, "T"),
        };
      },
      effect: [
        { name: "currencyMiningOreOsmiumCap", type: "base", value: (lvl) => lvl * 2 },
        { name: "currencyMiningOreOsmiumCap", type: "mult", value: (lvl) => lvl + 1 },
      ],
    },
    darkBombs: {
      cap: 10,
      requirementBase,
      requirementStat,
      requirementValue: 375,
      price(lvl) {
        return { mining_barTitanium: Math.round(Math.pow(1.2, lvl) * 360), mining_barDarkIron: lvl * 6 + 2 };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.55, lvl) },
        { name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
      ],
    },
    colossalScrapStorage: {
      cap: 1,
      requirementBase,
      requirementStat,
      requirementValue: 400,
      price() {
        return { mining_scrap: buildNum(1, "V") };
      },
      effect: [{ name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(buildNum(1, "M"), lvl) }],
    },
    stoneDissolver: {
      cap: 50,
      requirementBase,
      requirementStat,
      requirementValue: 425,
      price(lvl) {
        return { mining_scrap: Math.pow(lvl * 0.02 + 1.8, lvl) * buildNum(1, "UV") };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "miningToughness", type: "mult", value: (lvl) => Math.pow(1 / 1.3, lvl) },
      ],
    },
    leadExpansion: {
      requirementBase,
      cap: 5,
      requirementStat,
      requirementValue: 450,
      price(lvl) {
        return { mining_barDarkIron: Math.round(Math.pow(1.4, lvl) * (lvl + 3) * 4) };
      },
      effect: [
        { name: "miningOreCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyMiningOreLeadCap", type: "base", value: (lvl) => lvl * 7 },
      ],
    },
  },
  "modules/mining/upgrade2": {
    fumes: {
      subfeature: 1,
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(lvl * 0.012 + 1.24, lvl) * buildNum(750, "K")) };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.12, lvl) * Math.pow(lvl * 0.2 + 1, 2) },
      ],
    },
    giantCrate: {
      subfeature: 1,
      requirementBase,
      requirementStat,
      requirementValue: 5,
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(lvl * 2 + 8, lvl) * buildNum(2.5, "M")) };
      },
      effect: [{ name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(7, lvl) }],
    },
    morePressure: {
      subfeature: 1,
      requirementBase,
      requirementStat,
      requirementValue: 10,
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(lvl * 0.025 + 1.75, lvl) * buildNum(400, "M")) };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    gasDweller: {
      subfeature: 1,
      cap: 1,
      persistent: true,
      requirementBase,
      requirementStat,
      requirementValue: 15,
      price() {
        return { mining_helium: 250 };
      },
      effect: [
        { name: "miningDepthDweller", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "miningDepthDwellerSpeed", type: "mult", value: (lvl) => Math.pow(3, lvl) },
      ],
    },
    piston: {
      subfeature: 1,
      requirementBase,
      requirementStat,
      requirementValue: 20,
      price(lvl) {
        return { mining_helium: Math.round(Math.pow(1.35, lvl) * 50) };
      },
      effect: [{ name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.2 + 1) }],
    },
    pollution: {
      subfeature: 1,
      cap: 1,
      persistent: true,
      requirementBase,
      requirementStat,
      requirementValue: 25,
      price() {
        return { mining_helium: 1000 };
      },
      effect: [{ name: "miningSmoke", type: "unlock", value: (lvl) => lvl >= 1 }],
    },
    particleFilter: {
      subfeature: 1,
      requirement() {
        return store.state.unlock.miningSmoke.use;
      },
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(1.4, lvl) * buildNum(1, "T")) };
      },
      effect: [{ name: "miningPickaxeCraftingPower", type: "mult", value: (lvl) => Math.pow(1.15, lvl) }],
    },
    hotAirBalloon: {
      subfeature: 1,
      cap: 8,
      requirementBase,
      requirementStat,
      requirementValue: 30,
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(3.75, lvl) * buildNum(2.2, "T")) };
      },
      effect: [
        { name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
        { name: "currencyMiningSmokeCap", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
      ],
    },
    vent: {
      subfeature: 1,
      cap: 20,
      requirementBase,
      requirementStat,
      requirementValue: 40,
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(1.65, lvl) * buildNum(40, "T")) };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.05, lvl) },
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => Math.pow(1.3, lvl) },
      ],
    },
    harvester: {
      subfeature: 1,
      requirementBase,
      requirementStat,
      requirementValue: 50,
      price(lvl) {
        return { mining_neon: Math.round(Math.pow(1.35, lvl) * 50) };
      },
      effect: [
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.3 + 1) },
      ],
    },
    graphiteRod: {
      subfeature: 1,
      cap: 40,
      requirementBase,
      requirementStat,
      requirementValue: 75,
      price(lvl) {
        return { mining_scrap: Math.ceil(Math.pow(1.85, lvl) * buildNum(1, "Qi")) };
      },
      effect: [
        { name: "miningPickaxeCraftingPower", type: "mult", value: (lvl) => Math.pow(1.12, lvl) },
        { name: "currencyMiningSmokeCap", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
      ],
    },
    enrichedCrystal: {
      subfeature: 1,
      requirementBase,
      requirementStat,
      requirementValue: 100,
      price(lvl) {
        return { mining_argon: Math.round(Math.pow(1.35, lvl) * 50) };
      },
      effect: [{ name: "currencyMiningCrystalYellowGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
    },
    smoker: {
      subfeature: 1,
      requirementBase,
      requirementStat,
      requirementValue: 160,
      price(lvl) {
        return { mining_krypton: Math.round(Math.pow(1.35, lvl) * 50) };
      },
      effect: [
        { name: "currencyMiningSmokeGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.2 + 1) },
      ],
    },
  },
  "modules/mining/upgradePremium": {
    moreDamage: {
      type: "premium",
      price(lvl) {
        return {
          gem_ruby: fallbackArray([15, 80], [2, 3][(lvl - 2) % 2] * Math.pow(2, Math.floor((lvl - 2) / 2)) * 75, lvl),
        };
      },
      effect: [
        {
          name: "miningDamage",
          type: "mult",
          value: (lvl) => fallbackArray([1, 1.25, 1.5], getSequence(3, lvl - 2) * 0.25 + 1, lvl),
        },
      ],
    },
    moreScrap: {
      type: "premium",
      price(lvl) {
        return {
          gem_ruby: fallbackArray([10, 40], [2, 3][(lvl - 2) % 2] * Math.pow(2, Math.floor((lvl - 2) / 2)) * 75, lvl),
        };
      },
      effect: [
        {
          name: "currencyMiningScrapGain",
          type: "mult",
          value: (lvl) => fallbackArray([1, 1.25, 1.5], getSequence(1, lvl - 2) + 1, lvl),
        },
        {
          name: "currencyMiningScrapCap",
          type: "mult",
          value: (lvl) => fallbackArray([1, 1.25, 1.5], getSequence(1, lvl - 2) + 1, lvl),
        },
      ],
    },
    moreGreenCrystal: {
      type: "premium",
      requirement() {
        return store.state.unlock.miningDepthDweller.see;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 75 };
      },
      effect: [{ name: "currencyMiningCrystalGreenGain", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    moreRareEarth: {
      type: "premium",
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 50;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 120 };
      },
      effect: [{ name: "miningRareEarthGain", type: "mult", value: (lvl) => getSequence(3, lvl) * 0.05 + 1 }],
    },
    fasterSmeltery: {
      type: "prem;
      },
      price(lvl) {
        return { gem_rubyect: [{ name: "miningSmelterySpeed", type: "mult", value: (lvl) => lvl + 1 }],
    },
    moreResin: {
      type: "premium",
      requirement() {
        return store.state.unlock.miningResin.see;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 150 };
      },
      effect: [
        { name: "currencyMiningResinGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyMiningResinCap", type: "base", value: (lvl) => lvl },
      ],
    },
    premiumCraftingSlots: {
      type: "premium",
      hasDescription: true,
      requirement() {
        return store.state.unlock.miningPickaxeCrafting.see;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 30 };
      },
      effect: [{ name: "miningPickaxePremiumCraftingSlots", type: "base", value: (lvl) => lvl }],
    },
    moreAluminium: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 15;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 300 };
      },
      effect: [
        { name: "currencyMiningOreAluminiumGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOreAluminiumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    moreCopper: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 30;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 450 };
      },
      effect: [
        { name: "currencyMiningOreCopperGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOreCopperCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    moreTin: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 50;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 600 };
      },
      effect: [
        { name: "currencyMiningOreTinGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOreTinCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    moreIron: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 80;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 900 };
      },
      effect: [
        { name: "currencyMiningOreIronGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOreIronCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    moreTitanium: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 120;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 1200 };
      },
      effect: [
        { name: "currencyMiningOreTitaniumGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOreTitaniumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    morePlatinum: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 175;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 1800 };
      },
      effect: [
        { name: "currencyMiningOrePlatinumGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOrePlatinumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    moreIridium: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 260;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 2500 };
      },
      effect: [
        { name: "currencyMiningOreIridiumGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOreIridiumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    moreOsmium: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 350;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 3500 };
      },
      effect: [
        { name: "currencyMiningOreOsmiumGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOreOsmiumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    moreLead: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 450;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 5000 };
      },
      effect: [
        { name: "currencyMiningOreLeadGain", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "currencyMiningOreLeadCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    moreHelium: {
      type: "premium",
      cap: 5,
      requirement() {
        return store.state.unlock.miningGasSubfeature.see;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 300 };
      },
      effect: [{ name: "currenceSmoke: {
      type: "premium",
      reprice(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 325 };
      },
      effect: [{ name: "currencyMiningSmokeCap", type: "mult", value: (lvl) => Math.pow(2, lvl) }],
    },
    moreNeon: {
      type: "premium",
      cap: 5,
      requirement() {
        return store.state.stat.mining_maxDepth1.total >= 40;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 525 };
      },
      effect: [{ name: "currencyMiningNeonGain", type: "base", value: (lvl) => lvl * 0.004 }],
    },
    moreArgon: {
      type: "premium",
      cap: 5,
      requirement() {
        return store.state.stat.mining_maxDepth1.total >= 90;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 800 };
      },
      effect: [{ name: "currencyMiningArgonGain", type: "base", value: (lvl) => lvl * 0.004 }],
    },
  },
  "modules/mining/upgradePrestige": {
    crystalBasics: {
      type: "prestige",
      cap: 10,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(2, lvl) * 5 };
      },
      effect: [
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
      ],
    },
    crystalTips: {
      type: "prestige",
      cap: 50,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.15, lvl) * 10 };
      },
      effect: [{ name: "miningDamage", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    crystalStorage: {
      type: "prestige",
      cap: 50,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.15, lvl) * 5 };
      },
      effect: [
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyMiningScrapCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
      ],
    },
    crystalLens: {
      type: "prestige",
      cap: 25,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.25, lvl) * 8 };
      },
      effect: [{ name: "miningOreGain", type: "mult", value: (lvl) => lvl * 0.15 + 1 }],
    },
    crystalAluminiumStorage: {
      type: "prestige",
      cap: 16,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * 10 };
      },
      effect: [{ name: "currencyMiningOreAluminiumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    crystalCopperStorage: {
      type: "prestige",
      cap: 16,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * 15 };
      },
      effect: [{ name: "currencyMiningOreCopperCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    crystalTinStorage: {
      type: "prestige",
epth0.total >= 50;
      },
      price(lvl) {
     t: [{ name: "currencyMiningOreTinCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    crystalIronStorage: {
      type: "prestige",
      cap: 16,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 80;
      },
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * 450 };
      },
      effect: [{ name: "currencyMiningOreIronCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    crystalTitaniumStorage: {
      type: "prestige",
      cap: 16,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 120;
      },
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * buildNum(12, "K") };
      },
      effect: [{ name: "currencyMiningOreTitaniumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    crystalPlatinumStorage: {
      type: "prestige",
      cap: 16,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 175;
      },
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * buildNum(5, "M") };
      },
      effect: [{ name: "currencyMiningOrePlatinumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    crystalIridiumStorage: {
      type: "prestige",
      cap: 16,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 260;
      },
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * buildNum(2.6, "T") };
      },
      effect: [{ name: "currencyMiningOreIridiumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    crystalOsmiumStorage: {
      type: "prestige",
      cap: 16,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 350;
      },
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * buildNum(2.6, "T") };
      },
      effect: [{ name: "currencyMiningOreOsmiumCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    crystalLeadStorage: {
      type: "prestige",
      cap: 16,
      requirement() {
        return store.state.stat.mining_maxDepth0.total >= 450;
      },
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * buildNum(2.6, "T") };
      },
      effect: [{ name: "currencyMiningOreLeadCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 }],
    },
    crystalDrill: {
      type: "prestige",
      cap: 90,
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 5,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(lvl * 0.01 + 1.5, lvl) * 30 };
      },
      effect: [{ name: "miningDepthDwellerMax", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
      onBuy() {
        store.dispatch("mining/updateDwellerStat");
      },
    },
    crystalDetector: {
      type: "prestige",
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 10,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * 40 };
      },
      effect: [{ name: "miningRareEarthGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    crystalPreservarium: {
      type: "prestige",
      cap: 3,
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 15,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(4, lvl) * 250 };
      },
      effect: [
        { name: "mining_scrapCapacityUp", type: "keepUpgrade", value: (lvl) => lvl >= 1 },
        { name: "mining_scrapGainUp", type: "keepUpgrade", value: (lvl) => lvl >= 2 },
        { name: "mining_damageUp", type: "keepUpgrade", value: (lvl) => lvl >= 3 },
      ],
    },
    crystalTools: {
      type: "prestige",
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 16,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(lvl * 0.02 + 1.4, lvl) * 120 };
      },
      effect: [
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => Math.pow(1.11, lvl) },
        { name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.08, lvl) },
      ],
    },
    crystalExplosives: {
      type: "prestige",
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 20,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.15, lvl) * 200 };
      },
      effect: [{ name: "miningToughness", type: "mult", value: (lvl) => Math.pow(1 / 1.2, lvl) }],
    },
    crystalRefinery: {
      type: "prestige",
      cap: 50,
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 25,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * 650 };
      },
      effect: [
        { name: "miningOreGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.1 + 1) },
        { name: "miningRareEarthGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) },
        { name: "miningOreQuality", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    crystalSmeltery: {
      type: "prestige",
      cap: 100,
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 30,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * 3300 };
      },
      effect: [
        { name: "miningSmelteryTemperature", type: "base", value: (lvl) => 10 * lvl },
        { name: "miningSmelterySpeed", type: "mult", value: (lvl) => Math.pow(1.02, lvl) * (lvl * 0.08 + 1) },
      ],
    },
    crystalEnhancer: {
      type: "prestige",
      cap: 25,
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 35,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * buildNum(20, "K") };
      },
      effect: [
        { name: "miningEnhancementBarsIncrement", type: "mult", value: (lvl) => Math.pow(1 / 1.01, lvl) },
        { name: "miningEnhancementFinalIncrement", type: "mult", value: (lvl) => Math.pow(1 / 1.05, lvl) },
      ],
    },
    crystalTreetap: {
      type: "prestige",
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 40,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * buildNum(75, "K") };
      },
      effect: [{ name: "currencyMiningResinGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    crystalSalt: {
      type: "prestige",
      cap: 50,
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 50,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * buildNum(1.1, "M") };
      },
      effect: [{ name: "currencyMiningSaltGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) * (lvl * 0.2 + 1) }],
    },
    crystalBottle: {
      type: "prestige",
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 60,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * buildNum(12.5, "M") };
      },
      effect: [{ name: "currencyMiningResinCap", type: "base", value: (lvl) => lvl }],
    },
    crystalEngine: {
      type: "prestige",
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 75,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.4, lvl) * buildNum(230, "M") };
      },
      effect: [{ name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.1, lvl) * (lvl * 0.25 + 1) }],
    },
    crystalCoal: {
      type: "prestige",
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 100,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(lvl * 0.02 + 1.4, lvl) * buildNum(27, "B") };
      },
      effect: [{ name: "currencyMiningCoalGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
    },
    crystalTruck: {
      type: "prestige",
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 125,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(10, lvl) * buildNum(1, "T") };
      },
      effect: [{ name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(1.5, lvl) * (lvl * 0.5 + 1) }],
    },
    crystalExpansion: {
      type: "prestige",
      cap: 9,
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 150,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(10, lvl) * Math.pow(1000, Math.max(0, lvl - 6)) * buildNum(25, "T") };
      },
      effect: [
        { name: "currencyMiningOreAluminiumCap", type: "mult", value: (lvl) => (lvl >= 1 ? 1000 : null) },
        { name: "currencyMiningOreCopperCap", type: "mult", value: (lvl) => (lvl >= 2 ? 1000 : null) },
        { name: "currencyMiningOreTinCap", type: "mult", value: (lvl) => (lvl >= 3 ? 1000 : null) },
        { name: "currencyMiningOreIronCap", type: "mult", value: (lvl) => (lvl >= 4 ? 1000 : null) },
        { name: "currencyMiningOreTitaniumCap", type: "mult", value: (lvl) => (lvl >= 5 ? 1000 : null) },
        { name: "currencyMiningOrePlatinumCap", type: "mult", value: (lvl) => (lvl >= 6 ? 1000 : null) },
        { name: "currencyMiningOreIridiumCap", type: "mult", value: (lvl) => (lvl >= 7 ? 1000 : null) },
        { name: "currencyMiningOreOsmiumCap", type: "mult", value: (lvl) => (lvl >= 8 ? 1000 : null) },
        { name: "currencyMiningOreLeadCap", type: "mult", value: (lvl) => (lvl >= 9 ? 1000 : null) },
      ],
    },
    crystalTnt: {
      cap: 25,
      type: "prestige",
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 175,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(10, lvl) * buildNum(6, "Qa") };
      },
      effect: [{ name: "miningToughness", type: "mult", value: (lvl) => Math.pow(0.5, lvl) }],
    },
    crystalBeacon: {
      type: "prestige",
      cap: 4,
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 200,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(buildNum(1, "M"), lvl) * buildNum(1, "Sx") };
      },
      effect: [
        { name: "miningBeaconPiercing", type: "base", value: (lvl) => (lvl >= 1 ? 1 : null) },
        { name: "miningBeaconRich", type: "base", value: (lvl) => (lvl >= 2 ? 1 : null) },
        { name: "miningBeaconWonder", type: "base", value: (lvl) => (lvl >= 3 ? 1 : null) },
        { name: "miningBeaconHope", type: "base", value: (lvl) => (lvl >= 4 ? 1 : null) },
      ],
    },
    crystalNiter: {
      type: "prestige",
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 225,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(lvl * 0.02 + 1.4, lvl) * buildNum(3, "Sx") };
      },
      effect: [{ name: "currencyMiningNiterGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
    },
    crystalBunker: {
      type: "prestige",
      cap: 20,
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 250,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(4.5, lvl) * buildNum(65, "Sx") };
      },
      effect: [
        { name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) * (lvl * 0.4 + 1) },
        { name: "miningOreCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
      ],
    },
    crystalOreBag: {
      type: "prestige",
      cap: 40,
      requirementBase: requirementBase0,
      requirementStat: requirementStat0,
      requirementValue: 300,
      price(lvl) {
        return { mining_crystalGreen: Math.pow(1.2, lvl) * buildNum(1, "Sp") };
      },
      effect: [{ name: "miningOreCap", type: "base", value: (lvl) => lvl }],
    },
    crystalSpikes: {
      type: "prestige",
      requirement() {
        return store.state.unlock.miningGasSubfeature.see;
      },
      price(lvl) {
        return { mining_crystalYellow: Math.pow(lvl * 0.025 + 1.3, lvl) * 5 };
      },
      effect: [{ name: "miningDamage", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.15 + 1) }],
    },
    crystalBooster: {
      type: "prestige",
      cap: 8,
      requirement() {
        return store.state.unlock.miningGasSubfeature.see;
      },
      price(lvl) {
        return { mining_crystalYellow: Math.pow(1.75, lvl) * 8 };
      },
      effect: [{ name: "miningDepthDwellerSpeed", type: "mult", value: (lvl) => lvl * 0.125 + 1 }],
    },
    heliumReserves: {
      type: "prestige",
      cap: 8,
      requirementBase: requirementBase1,
      requirementStat: requirementStat1,
      requirementValue: 5,
      price(lvl) {
        return { mining_crystalYellow: Math.pow(lvl * 0.5 + 2, lvl) * 100 };
      },
      effect: [{ name: "currencyMiningHeliumIncrement", type: "base", value: (lvl) => lvl * 0.01 }],
    },
    crystalSmoke: {
      type: "prestige",
      requirementBase: requirementBase1,
      requirementStat: requirementStat1,
      requirementValue: 10,
      price(lvl) {
        return { mining_crystalYellow: Math.pow(1.65, lvl) * 250 };
      },
      effect: [
        { name: "currencyMiningSmokeGain", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "currencyMiningSmokeCap", type: "mult", value: (lvl) => Math.pow(1.3, lvl) },
      ],
    },
    neonReserves: {
      type: "prestige",
      cap: 8,
      requirementBase: requirementBase1,
      requirementStat: requirementStat1,
      requirementValue: 15,
      price(lvl) {
        return { mining_crystalYellow: Math.pow(lvl * 0.5 + 2, lvl) * 1000 };
      },
      effect: [{ name: "currencyMiningNeonIncrement", type: "base", value: (lvl) => lvl * 0.005 }],
    },
    crystalFusion: {
      type: "prestige",
      requirementBase: requirementBase1,
      requirementStat: requirementStat1,
      requirementValue: 20,
      price(lvl) {
        return { mining_crystalYellow: Math.pow(1.75, lvl) * 2300 };
      },
      effect: [
        { name: "currencyMiningCrystalGreenGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "currencyMiningCrystalYellowGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) },
      ],
    },
    crystalRefuge: {
      type: "prestige",
      cap: 2,
      requirementBase: requirementBase1,
      requirementStat: requirementStat1,
      requirementValue: 30,
      price(lvl) {
        return { mining_crystalYellow: Math.pow(4, lvl) * buildNum(25, "K") };
      },
      effect: [
        { name: "mining_piston", type: "keepUpgrade", value: (lvl) => lvl >= 1 },
        { name: "mining_harvester", type: "keepUpgrade", value: (lvl) => lvl >= 2 },
      ],
    },
    argonReserves: {
      type: "prestige",
      cap: 8,
      requirementBase: requirementBase1,
      requirementStat: requirementStat1,
      requirementValue: 40,
      price(lvl) {
        return { mining_crystalYellow: Math.pow(lvl * 0.5 + 2, lvl) * buildNum(450, "K") };
      },
      effect: [{ name: "currencyMiningArgonIncrement", type: "base", value: (lvl) => lvl * 0.003 }],
    },
    crystalTunnel: {
      type: "prestige",
      requirementBase: requirementBase1,
      requirementStat: requirementStat1,
      requirementValue: 60,
      price(lvl) {
        return { mining_crystalYellow: Math.pow(1.65, lvl) * buildNum(8, "M") };
      },
      effect: [{ name: "currencyMiningScrapCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) * (lvl * 0.3 + 1) }],
    },
    crystalDust: {
      type: "prestige",
      requirementBase: requirementBase1,
      requirementStat: requirementStat1,
      requirementValue: 80,
      price(lvl) {
        return { mining_crystalYellow: Math.pow(1.65, lvl) * buildNum(120, "M") };
      },
      effect: [
        { name: "currencyMiningSmokeGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) * (lvl * 0.35 + 1) },
      ],
    },
    kryptonReserves: {
      type: "prestige",
      cap: 8,
      requirementBase: requirementBase1,
      requirementStat: requirementStat1,
      requirementValue: 100,
      price(lvl) {
        return { mining_crystalYellow: Math.pow(lvl * 0.5 + 2, lvl) * buildNum(3.3, "B") };
      },
      effect: [{ name: "currencyMiningKryptonIncrement", type: "base", value: (lvl) => lvl * 0.002 }],
    },
  },
  "modules/mining": {
    name: "mining",
    tickspeed: 1,
    unlockNeeded: null,
    tick: function (seconds) {
      const subfeature = store.state.system.features.mining.currentSubfeature;
      store.commit("stat/add", { feature: "mining", name: "timeSpent", value: seconds });
      if (store.state.mining.beaconCooldown > 0) {
        store.commit("mining/updateKey", {
          key: "beaconCool,
        });
      } // Smeltery
      for (const tored > 0) {
          let newProgress = elem.progress + seconds / store.getters["mining/smelteryTimeNeeded"](key);
          const bars = Math.min(elem.stored, Math.floor(newProgress));
          if (bars > 0) {
            store.commit("mining/updateSmelteryKey", { name: key, key: "stored", value: elem.stored - bars });
            const barSplit = elem.output.split("_");
            store.dispatch("currency/gain", { feature: barSplit[0], name: barSplit[1], amount: bars });
            if (elem.stored - bars <= 0) {
              newProgress = 0;
            } else {
              newProgress -= bars;
            }
          }
          store.commit("mining/updateSmelteryKey", { name: key, key: "progress", value: newProgress });
        }
      } // Resin
      if (store.state.unlock.miningResin.use && subfeature === 0) {
        store.dispatch("currency/gain", {
          feature: "mining",
          name: "resin",
          amount: seconds * store.getters["mult/get"]("currencyMiningResinGain"),
        });
      } // Mining
      if (store.getters["mining/currentDamage"] > 0) {
        let secondsLeft = seconds;
        while (secondsLeft > 0) {
          const maxDepth = store.state.stat[`mining_maxDepth${subfeature}`].value;
          let breaks = 0;
          let loots = 0;
          let preHits = Math.min(secondsLeft, store.getters["mining/currentHitsNeeded"]);
          if (store.state.mining.depth < maxDepth) {
            loots += preHits;
          }
          secondsLeft -= preHits;
          store.commit("stat/increaseTo", {
            feature: "mining",
            name: "maxDamage",
            value: store.getters["mining/currentDamage"],
          });
          store.commit("stat/add", {
            feature: "mining",
            name: "totalDamage",
            value: preHits * store.getters["mining/currentDamage"],
          });
          let newDurability = store.state.mining.durability - preHits * store.getters["mining/currentDamage"];
          if (newDurability <= 0) {
            breaks++;
            let isLatest = maxDepth === store.state.mining.depth;
            if (isLatest) {
              // Get gasses for the first time
              for (const [key, elem] of Object.entries(store.getters["mining/currentGas"])) {
                store.dispatch("currency/gain", { feature: "mining", name: key, amount: elem });
              } // also count the first break as loot
              loots++;
              store.commit("stat/increaseTo", {
                feature: "mining",
                name: "maxDepth" + subfeature,
                value: store.state.mining.depth + 1,
              });
              store.dispatch("meta/globalLevelPart", {
                key: "mining_" + subfeature,
                amount: store.state.stat[`mining_maxDepth${subfeature}`].total - 1,
              }); // Find notes based on depth
              if (subfeature === 0) {
                const note = notes[store.state.stat.mining_maxDepth0.total - 1];
                if (note !== undefined) {
                  store.dispatch("note/find", note);
                }
              } // Speedrun stat
              if (store.state.stat.mining_timeSpent.value <= 900 && subfeature === 0) {
                store.commit("stat/increaseTo", {
                  feature: "mining",
                  name: "maxDepthSpeedrun",
                  value: store.state.mining.depth + 1,
                });
              } // Update dweller stat
              store.dispatch("mining/updateDwellerStat");
            }
            if (
              isLatest &&
              store.getters["mining/depthHitsNeeded"](store.state.mining.depth + 1) <=
                (store.state.system.settings.automation.items.progressMining.value ?? 0)
            ) {
              awardLoot(breaks, loots, preHits);
              store.commit("mining/updateKey", { key: "depth", value: store.state.mining.depth + 1 });
              newDurability = store.getters["mining/currentDurability"];
              store.dispatch("mining/applyBeaconEffects");
            } else {
              store.commit("stat/add", {
                feature: "mining",
                name: "totalDamage",
                value: secondsLeft * store.getters["mining/currentDamage"],
              });
              breaks += Math.floor(secondsLeft / store.getters["mining/hitsNeeded"]);
              loots += secondsLeft;
              newDurability =
                store.getters["mining/currentDurability"] -
                store.getters["mining/currentDamage"] * (secondsLeft % store.getters["mining/hitsNeeded"]);
              awardLoot(breaks, loots, preHits + secondsLeft);
              secondsLeft = 0;
            }
          } else {
            awardLoot(breaks, loots, preHits);
          }
          store.commit("mining/updateKey", { key: "durability", value: newDurability });
        }
      } else {
        // Sulfur gain
        if (store.state.mining.depth >= MINING_SULFUR_DEPTH && store.getters["mining/currentBreaks"] === 0) {
          store.dispatch("currency/gain", {
            feature: "mining",
            name: "sulfur",
            amount: store.getters["mining/rareDropFinal"]("sulfur") * seconds,
          });
        }
      } // Depth dweller
      if (store.state.unlock.miningDepthDweller.use) {
        const dwellerLimit = store.getters["mining/dwellerLimit"];
        const dwellerSpeed = store.getters["mult/get"]("miningDepthDwellerSpeed") / dwellerLimit;
        let timeLeft = seconds;
        if (store.state.stat[`mining_depthDweller${subfeature}`].value < dwellerLimit) {
          // Regular dweller calculation
          const newDweller = Math.min(
            MINING_DWELLER_OVERFLOW +
              dwellerLimit -
              (MINING_DWELLER_OVERFLOW + dwellerLimit - store.state.stat[`mining_depthDweller${subfeature}`].value) *
                Math.pow(1 - dwellerSpeed, seconds),
            dwellerLimit,
          );
          if (newDweller >= dwellerLimit) {
            store.commit("stat/increaseTo", { feature: "mining", name: "dwellerCapHit", value: 1 });
            timeLeft -= Math.ceil(store.getters["mining/timeUntilNext"](dwellerLimit));
          } else {
            timeLeft = 0;
          }
          store.commit("stat/increaseTo", { feature: "mining", name: "depthDweller" + subfeature, value: newDweller });
          store.commit("stat/increaseTo", {
            feature: "mining",
            name: "depthDwellerCap" + subfeature,
            value: newDweller,
          });
        }
        if (timeLeft > 0 && dwellerLimit > 0) {
          // Dweller overcap
          let newDweller = store.state.stat[`mining_depthDweller${subfeature}`].value;
          let dwellerProgress = dwellerSpeed * MINING_DWELLER_OVERFLOW * timeLeft;
          while (dwellerProgress > 0) {
            const breakpointCount = Math.floor((10 * (newDweller + 0.000000000001)) / dwellerLimit) - 10;
            const targetAmount = ((breakpointCount + 1) / 10) * dwellerLimit;
            const progressMade = Math.min(
              dwellerProgress * Math.pow(MINING_DWELLER_OVERCAP_MULT, breakpointCount + 1),
              targetAmount,
            );
            newDweller += progressMade;
            dwellerProgress -= progressMade * Math.pow(1 / MINING_DWELLER_OVERCAP_MULT, breakpointCount + 1);
          }
          store.commit("stat/increaseTo", { feature: "mining", name: "depthDweller" + subfeature, value: newDweller });
        }
      }
    },
    unlock: [
      "miningPigEnhancement",
      "miningResin",
      " value: 1, showInStatistics: true },
      maxDepth1: { value: 1, showInStatistics: true },
      depthDweller0: {},
      depthDwellerCap0: { showInStatistics: true },
      depthDweller1: {},
      depthDwellerCap1: { showInStatistics: true },
      totalDamage: { showInStatistics: true },
      maxDamage: { showInStatistics: true },
      craftingCount: { showInStatistics: true },
      craftingLuck: { value: 1 },
      craftingWasted: {},
      dwellerCapHit: {},
      timeSpent: { display: "time" },
      bestPrestige0: { showInStatistics: true },
      bestPrestige1: { showInStatistics: true },
      prestigeCount: { showInStatistics: true },
      maxDepthSpeedrun: { value: 1 },
    },
    mult: {
      miningDamage: {},
      miningToughness: {},
      miningOreGain: {},
      miningOreCap: {},
      miningRareEarthGain: {},
      miningPickaxeCraftingSlots: { round: true, baseValue: 1 },
      miningPi,
      miningPickaxeCraftingQuality: {}eValue: 0.000065 },
      miningDepthDwellerMax: { display: "percent", baseValue: 0.1 },
      miningResinMax: { round: true, baseValue: 1 },
      currencyMiningHeliumIncrement: { display: "percent" },
      currencyMiningNeonIncrement: { display: "percent" },
      currencyMiningArgonIncrement: { display: "percent" },
      currencyMiningKryptonIncrement: { display: "percent" },
      currencyMiningXenonIncrement: { display: "percent" },
      currencyMiningRadonIncrement: { display: "percent" },
      miningSmelterySpeed: { baseValue: 1 },
      miningSmelteryTemperature: { display: "temperature", baseValue: 100 },
      miningEnhancementBarsIncrement: { display: "percent", baseValue: 0.75, min: 0 },
      miningEnhancementFinalIncrement: { display: "percent", baseValue: 3, min: 0 },
      miningPrestigeIncome: { group: ["currencyMiningCrystalGreenGain", "currencyMiningCrystalYellowGain"] },
    },
    multGroup: [
      { mult: "miningOreGain", name: "currencyGain", subtype: "ore" },
      { mult: "miningOreCap", name: "currencyCap", subtype: "ore" },
      { mult: "miningRareEarthGain", name: "currencyGain", subtype: "rareEarth" },
    ],
    currency: {
      scrap: {
        color: "brown",
        icon: "mdi-dots-triangle",
        gainMult: {},
        capMult: { baseValue: buildNum(10, "K") },
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          return hitsNeeded === Infinity
            ? null
            : ((hitsNeeded + MINING_SCRAP_BREAK) * store.getters["mining/currentScrap"]) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      oreAluminium: {
        subtype: "ore",
        color: "blue-grey",
        icon: "mdi-chart-bubble",
        gainMult: {},
        capMult: { baseValue: 12, round:s["mining/hitsNeeded"];
          const oreGty || !oreGain.oreAluminium
            ? null
            : ((hitsNeeded + MINING_ORE_BREAK) * oreGain.oreAluminium.amount) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      oreCopper: {
        subtype: "ore",
        color: "orange",
        icon: "mdi-chart-bubble",
        gainMult: {},
        capMult: { baseValue: 4, round: true },
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const oreGain = store.getters["mining/currentOre"];
          return hitsNeeded === Infinity || !oreGain.oreCopper
            ? null
            : ((hitsNeeded + MINING_ORE_BREAK) * oreGain.oreCopper.amount) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      oreTin: {
        subtype: "ore",
        color: "grey",
        icon: "mdi-chart-bubble",
        gainMult: {},
        capMult: { baseValue: 2, round: true },
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const oreGain = store.getters["mining/currentOre"];
          return hitsNeeded === Infinity || !oreGain.oreTin
            ? null
            : ((hitsNeeded + MINING_ORE_BREAK) * oreGain.oreTin.amount) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      oreIron: {
        subtype: "ore",
        color: "deep-orange",
        icon: "mdi-chart-bubble",
        gainMult: {},
        capMult: { baseValue: 1, round: true },
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const oreGain = store.getters["mining/currentOre"];
          return hitsNeeded === Infinity || !oreGain.oreIron
            ? null
            : ((hitsNeeded + MINING_ORE_BREAK) * oreGain.oreIron.amount) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      oreTitanium: {
        subtype: "ore",
        color: "pale-light-green",
        icon: "mdi-chart-bubble",
        gainMult: {},
        capMult: { baseValue: 1, round: true },
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const oreGain = store.getters["mining/currentOre"];
          return hitsNeeded === Infinity || !oreGain.oreTitanium
            ? null
            : ((hitsNeeded + MINING_ORE_BREAK) * oreGain.oreTitanium.amount) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      orePlatinum: {
        subtype: "ore",
        color: "skyblue",
        icon: "mdi-chart-bubble",
        gainMult: {},
        capMult: { baseValue: 1, round: true },
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const oreGain = store.getters["mining/currentOre"];
          return hitsNeeded === Infinity || !oreGain.orePlatinum
            ? null
            : ((hitsNeeded + MINING_ORE_BREAK) * oreGain.orePlatinum.amount) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      oreIridium: {
        subtype: "ore",
        color: "pale-purple",
        icon: "mdi-chart-bubble",
        gainMult: {},
        capMult: { baseValue: 1, round: true },
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const oreGain = store.getters["mining/currentOre"];
          return hitsNeeded === Infinity || !oreGain.oreIridium
            ? null
            : ((hitsNeeded + MINING_ORE_BREAK) * oreGain.oreIridium.amount) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      oreOsmium: {
        subtype: "ore",
        color: "pale-green",
        icon: "mdi-chart-bubble",
        gainMult: {},
        capMult: { baseValue: 1, round: true },
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const oreGain = store.getters["mining/currentOre"];
          return hitsNeeded === Infinity || !oreGain.oreOsmium
            ? null
            : ((hitsNeeded + MINING_ORE_BREAK) * oreGain.oreOsmium.amount) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      oreLead: {
        subtype: "ore",
        color: "pale-blue",
        icon: "mdi-chart-bubble",
        gainMult: {},
        capMult: { baseValue: 1, round: true },
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const oreGain = store.getters["mining/currentOre"];
          return hitsNeeded === Infinity || !oreGain.oreLead
            ? null
            : ((hitsNeeded + MINING_ORE_BREAK) * oreGain.oreLead.amount) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      barAluminium: { subtype: "bar", color: "blue-grey", icon: "mdi-gold" },
      barBronze: { subtype: "bar", color: "pale-orange", icon: "mdi-gold" },
      barSteel: { subtype: "bar", color: "grey", icon: "mdi-gold" },
      barTitanium: { subtype: "bar", color: "pale-green", icon: "mdi-gold" },
      barShiny: { subtype: "bar", color: "pale-blue", icon: "mdi-gold" },
      barIridium: { subtype: "bar", color: "pale-pink", icon: "mdi-gold" },
      barDarkIron: { subtype: "bar", color: "darker-grey", icon: "mdi-gold" },
      granite: {
        subtype: "rareEarth",
        color: "skyblue",
        icon: "mdi-cube",
        gainMult: {},
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const rareDropGain = store.getters["mining/rareDrops"];
          return hitsNeeded === Infinity || !rareDropGain.granite
            ? null
            : ((hitsNeeded + MINING_RARE_DROP_BREAK) * rareDropGain.granite) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      salt: {
        subtype: "rareEarth",
        color: "lighter-grey",
        icon: "mdi-shaker",
        gainMult: {},
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const rareDropGain = store.getters["mining/rareDrops"];
          return hitsNeeded === Infinity || !rareDropGain.salt
            ? null
            : ((hitsNeeded + MINING_RARE_DROP_BREAK) * rareDropGain.salt) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      coal: { color: "dark-grey", icon: "mdi-chart-bubble", gainMult: { round: true } },
      sulfur: {
        subtype: "rareEarth",
        color: "pale-yellow",
        icon: "mdi-fire-circle",
        gainMult: {},
        gainTimerFunction() {
          return store.getters["mining/rareDrops"].sulfur ?? null;
        },
        timerIsEstimate: true,
      },
      niter: { color: "pale-light-green", icon: "mdi-water-circle", gainMult: {} },
      obsidian: {
        subtype: "rareEarth",
        color: "deep-purple",
        icon: "mdi-cone",
        gainMult: {},
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const rareDropGain = store.getters["mining/rareDrops"];
          return hitsNeeded === Infinity || !rareDropGain.obsidian
            ? null
            : ((hitsNeeded + MINING_RARE_DROP_BREAK) * rareDropGain.obsidian) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      deeprock: {
        subtype: "rareEarth",
        color: "darker-grey",
        icon: "mdi-gamepad-circle",
        gainMult: {},
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const rareDropGain = store.getters["mining/rareDrops"];
          return hitsNeeded === Infinity || !rareDropGain.deeprock
            ? null
            : ((hitsNeeded + MINING_RARE_DROP_BREAK) * rareDropGain.deeprock) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      glowshard: {
        color: "cyan",
        icon: "mdi-lightbulb-fluorescent-tube",
        gainMult: {},
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          const rareDropGain = store.getters["mining/rareDrops"];
          return hitsNeeded === Infinity || !rareDropGain.glowshard
            ? null
            : ((hitsNeeded + MINING_RARE_DROP_BREAK) * rareDropGain.glowshard) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      smoke: {
        color: "grey",
        icon: "mdi-smoke",
        gainMult: {},
        capMult: { baseValue: 10 },
        overcapScaling: 0.25,
        gainTimerFunction() {
          const hitsNeeded = store.getters["mining/hitsNeeded"];
          return hitsNeeded === Infinity
            ? null
            : ((hitsNeeded + MINING_SMOKE_BREAK) * store.getters["mining/currentSmoke"]) / hitsNeeded;
        },
        timerIsEstimate: true,
      },
      ember: {
        type: "prestige",
        color: "orange-red",
        icon: "mdi-fire",
        overcapMult: 0,
        gainMult: { display: "percent" },
        capMult: { baseValue: 100 },
        currencyMult: { miningSmelterySpeed: { type: "mult", value: (val) => val * 0.02 + 1 } },
      },
      resin: {
        type: "prestige",
        color: "orange",
        icon: "mdi-water",
        gainMult: { baseValue: 0.0001, display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 5 },
      },
      crystalGreen: {
        type: "prestige",
        alwaysVisible: true,
        color: "light-green",
        icon: "mdi-star-three-points",
        gainMult: {},
      },
      helium: {
        type: "prestige",
        color: "pale-blue",
        icon: "mdi-gas-cylinder",
        gainMult: { display: "percent", baseValue: 0.01 },
        currencyMult: { currencyMiningScrapCap: { type: "mult", value: (val) => val * 0.01 + 1 } },
      },
      neon: {
        type: "prestige",
        color: "orange-red",
        icon: "mdi-gas-cylinder",
        gainMult: { display: "percent", baseValue: 0.01 },
        currencyMult: { miningPickaxeCraftingPower: { type: "mult", value: (val) => val * 0.01 + 1 } },
      },
      argon: {
        type: "prestige",
        color: "pink-purple",
        icon: "mdi-gas-cylinder",
        gainMult: { display: "percent", baseValue: 0.01 },
        currencyMult: { currencyMiningScrapGain: { type: "mult", value: (val) => val * 0.01 + 1 } },
      },
      krypton: {
        type: "prestige",
        color: "light-blue",
        icon: "mdi-gas-cylinder",
        gainMult: { display: "percent", baseValue: 0.01 },
      },
      xenon: {
        type: "prestige",
        color: "blue",
        icon: "mdi-gas-cylinder",
        gainMult: { display: "percent", baseValue: 0.01 },
      },
      radon: {
        type: "prestige",
        color: "light-green",
        icon: "mdi-gas-cylinder",
        gainMult: { display: "percent", baseValue: 0.01 },
      },
      crystalYellow: {
        type: "prestige",
        alwaysVisible: true,
        color: "yellow",
        icon: "mdi-star-four-points",
        gainMult: {},
      },
    },
    upgrade: { ...upgrade, ...upgrade2, ...upgradePrestige, ...upgradePremium, ...bookMining },
    relic,
    achievement,
    note: buildArray(34).map(() => "g"),
    consumable: { goldenHammer: { icon: "mdi-hammer", color: "amber", price: { gem_sapphire: 20 } } },
    init() {
      for (const [key, elem] of Object.entries(ore)) {
        store.commit("unlock/init", "miningCompress" + key.slice(3));
        store.commit("mining/initOre", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(smeltery)) {
        store.commit("mining/initSmeltery", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(enhancement)) {
        store.commit("mining/initEnhancement", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(beacon)) {
        store.commit("mining/initBeacon", { name: key, ...elem });
        store.commit("mult/init", { feature: "mining", name: elem.ownedMult, round: true });
      }
      store.commit("mining/updateKey", { key: "durability", value: store.getters["mining/currentDurability"] });
    },
    saveGame() {
      let obj = {
        depth: store.state.mining.depth,
        durability: store.state.mining.durability,
        pickaxePower: store.state.mining.pickaxePower,
      };
      if (store.state.mining.breaks.length > 0) {
        obj.breaks = store.state.mining.breaks;
      }
      if (store.state.unlock.miningPickaxeCrafting.see) {
        obj.ingredientList = store.state.mining.ingredientList;
      }
      if (store.state.mining.enhancementBars > 0) {
        obj.enhancementBars = store.state.mining.enhancementBars;
      }
      if (store.state.mining.enhancementIngredient !== null) {
        obj.enhancementIngredient = store.state.mining.enhancementIngredient;
      }
      if (store.state.mining.resin > 0) {
        obj.resin = store.state.mining.resin;
      }
      let smelteryData = {};
      for (const [key, elem] of Object.entries(store.state.mining.smeltery)) {
        if (elem.total > 0) {
          smelteryData[key] = [elem.progress, elem.stored, elem.total];
        }
      }
      if (Object.keys(smelteryData).length > 0) {
        obj.smeltery = smelteryData;
      }
      let enhancementData = {};
      for (const [key, elem] of Object.entries(store.state.mining.enhancement)) {
        if (elem.level > 0) {
          enhancementData[key] = elem.level;
        }
      }
      if (Object.keys(enhancementData).length > 0) {
        obj.enhancement = enhancementData;
      }
      if (Object.keys(store.state.mining.beaconPlaced).length > 0) {
        obj.beaconPlaced = store.state.mining.beaconPlaced;
      }
      if (store.state.mining.beaconCooldown > 0) {
        obj.beaconCooldown = store.state.mining.beaconCooldown;
      }
      return obj;
    },
    loadGame(data) {
      [
        "depth",
        "durability",
        "pickaxePower",
        "breaks",
        "ingredientList",
        "enhancementBars",
        "enhancementIngredient",
        "resin",
        "beaconPlaced",
        "beaconCooldown",
      ].forEach((elem) => {
        if (data[elem] !== undefined) {
          store.commit("mining/updateKey", { key: elem, value: data[elem] });
        }
      });
      if (data.smeltery !== undefined) {
        for (const [key, elem] of Object.entries(data.smeltery)) {
          if (store.state.mining.smeltery[key] !== undefined) {
            store.commit("mining/updateSmelteryKey", { name: key, key: "progress", value: elem[0] });
            store.commit("mining/updateSmelteryKey", { name: key, key: "stored", value: elem[1] });
            store.commit("mining/updateSmelteryKey", { name: key, key: "total", value: elem[2] });
          }
        }
      }
      if (data.enhancement !== undefined) {
        for (const [key, elem] of Object.entries(data.enhancement)) {
          if (store.state.mining.enhancement[key] !== undefined) {
            store.commit("mining/updateEnhancementKey", { name: key, key: "level", value: elem });
            store.dispatch("mining/applyEnhancement", { trigger: false, name: key });
          }
        }
      }
      store.dispatch("mining/applyBeaconEffects");
    },
  },
  "modules/patchnote/v1_0_0": {
    day: "2023-09-23",
    content: {
      mining: [{ type: "new", text: "addedFeature" }],
      note: [{ type: "new", text: "addedFeature" }],
      gem: [{ type: "new", text: "addedFeature" }],
      village: [{ type: "new", text: "addedFeature" }],
      achievement: [{ type: "new", text: "addedFeature" }],
      school: [{ type: "new", text: "addedFeature" }],
      relic: [{ type: "new", text: "addedFeature" }],
      horde: [{ type: "new", text: "addedFeature" }],
      card: [{ type: "new", text: "addedFeature" }],
      general: [{ type: "new", text: "addedFeature" }],
      farm: [{ type: "new", text: "addedFeature" }],
      event: [{ type: "new", text: "addedFeature" }],
      treasure: [{ type: "new", text: "addedFeature" }],
      cryolab: [{ type: "new", text: "addedFeature" }],
      gallery: [{ type: "new", text: "addedFeature" }],
      mining_1: [{ type: "new", text: "addedSubfeature" }],
    },
  },
  "modules/patchnote/v1_0_1": {
    day: "2023-09-26",
    content: {
      meta: [{ type: "qol", text: "6" }],
      mining: [
        { type: "balance", text: "0" },
        { type: "clarity", text: "1" },
        { unlock: "miningDepthDweller", type: "clarity", text: "8" },
      ],
      village: [
        { type: "clarity", text: "2" },
        { type: "clarity", text: "3" },
      ],
      achievement: [{ type: "clarity", text: "9" }],
      school: [
        { type: "qol", text: "4" },
        { type: "context", text: "10" },
        { type: "balance", text: "11", balance: "nerf", before: "100%", after: "10% - 100%" },
        { type: "balance", text: "12" },
        { unlock: "schoolLiteratureSubfeature", type: "bugfix", text: "13" },
      ],
      horde: [{ unlock: "hordePrestige", type: "clarity", text: "7" }],
      card: [{ type: "clarity", text: "5" }],
    },
  },
  "modules/patchnote/v1_1_0": {
    day: "2023-09-28",
    content: {
      meta: [{ type: "bugfix", text: "41" }],
      mining: [{ unlock: "miningDepthDweller", type: "clarity", text: "38" }],
      school: [
        { type: "context", text: "14" },
        { type: "remove", text: "15" },
        { type: "remove", text: "16" },
        { type: "new", text: "17" },
        { type: "remove", text: "18" },
        { type: "balance", text: "19", balance: "buff", before: "5/h", after: "10/h" },
        { type: "remove", text: "20" },
        { type: "new", text: "21" },
        { type: "balance", text: "22", balance: "buff", before: "30s", after: "40s" },
        { type: "change", text: "23" },
        { type: "new", text: "24" },
        { type: "new", text: "25" },
        { type: "new", text: "35" },
        { type: "new", text: "26" },
        { type: "new", text: "39" },
        { type: "change", text: "27" },
        { type: "info", text: "34" },
        { type: "balance", text: "28", balance: "nerf", before: "5", after: "6" },
        { type: "bugfix", text: "29" },
        { unlock: "schoolLiteratureSubfeature", type: "change", text: "31" },
        { unlock: "schoolLiteratureSubfeature", type: "balance", text: "30", balance: "buff", before: "5", after: "4" },
        { type: "balance", text: "32", balance: "buff", before: "10% - 100%", after: "25% - 100%" },
        { type: "balance", text: "33", balance: "buff", before: "250", after: "175" },
        { unlock: "schoolHistorySubfeature", type: "change", text: "36" },
      ],
      card: [{ type: "clarity", text: "37" }],
      event: [{ type: "new", text: "40" }],
    },
  },
  "modules/patchnote/v1_1_1": {
    day: "2023-09-29",
    content: {
      school: [
        { type: "balance", text: "42", balance: "buff", before: "+15%", after: "+35%" },
        { type: "bugfix", text: "43" },
        { type: "remove", text: "44" },
      ],
    },
  },
  "modules/patchnote/v1_1_2": {
    day: "2023-10-01",
    content: {
      meta: [
        { type: "bugfix", text: "45" },
        { type: "clarity", text: "46" },
        { type: "qol", text: "67" },
        { type: "qol", text: "71" },
      ],
      mining: [
        { unlock: "miningDepthDweller", type: "change", text: "56" },
        { unlock: "miningDepthDweller", type: "change", text: "57" },
        { unlock: "miningDepthDweller", type: "qol", text: "58" },
        { unlock: "miningDepthDweller", type: "balance", text: "59", balance: "buff", before: "1m", after: "0.5m" },
        { type: "clarity", text: "66" },
        { unlock: "achievementFeature", type: "new", text: "secretAchievement", params: [1] },
      ],
      note: [
        { type: "clarity", text: "47" },
        { type: "bugfix", text: "88" },
      ],
      gem: [
        { unlock: "miningPickaxeCrafting", type: "clarity", text: "70" },
        { type: "change", text: "77" },
      ],
      village: [{ type: "qol", text: "68" }],
      achievement: [{ type: "clarity", text: "83" }],
      school: [
        { unlock: "schoolLiteratureSubfeature", type: "qol", text: "61" },
        { unlock: "schoolLiteratureSubfeature", type: "change", text: "62" },
        { unlock: "schoolLiteratureSubfeature", type: "balance", text: "63" },
        { type: "clarity", text: "64" },
        { type: "clarity", text: "65" },
        { type: "new", text: "69" },
      ],
      horde: [
        { unlock: "hordeItems", type: "qol", text: "51" },
        { unlock: "hordeItems", type: "qol", text: "52" },
        { unlock: "hordeDamageTypes", type: "clarity", text: "53" },
        { unlock: "hordeItems", type: "qol", text: "54" },
        { type: "bugfix", text: "60" },
        { unlock: "hordeItems", type: "qol", text: "78" },
        { unlock: "hordeItems", type: "clarity", text: "79" },
        { unlock: "hordePrestige", type: "context", text: "89" },
        { type: "balance", text: "74", balance: "buff", before: "10", after: "1" },
        { unlock: "hordePrestige", type: "balance", text: "55" },
        { unlock: "hordePrestige", type: "balance", text: "85", balance: "nerf", before: "2", after: "1.5" },
        { unlock: "hordePrestige", type: "balance", text: "84", balance: "buff", before: "14%", after: "16%" },
        { unlock: "hordePrestige", type: "remove", text: "80" },
        { unlock: "hordePrestige", type: "balance", text: "76", balance: "buff", before: "35%", after: "60%" },
        { unlock: "hordePrestige", type: "balance", text: "75", balance: "nerf", before: "5%", after: "2.5%" },
        { unlock: "hordeHeirlooms", type: "balance", text: "86", balance: "nerf", before: "14% - 30%", after: "5%" },
        { unlock: "hordeHeirlooms", type: "balance", text: "87", balance: "buff", before: "-0.5%", after: "-0.1%" },
        { unlock: "hordeHeirlooms", type: "remove", text: "81" },
        { unlock: "hordeHeirlooms", type: "balance", text: "73" },
        { unlock: "hordeHeirlooms", type: "balance", text: "72", balance: "buff", before: "25%", after: "5%" },
        { unlock: "hordeHeirlooms", type: "remove", text: "82" },
      ],
      card: [{ type: "clarity", text: "49" }],
      general: [{ type: "clarity", text: "50" }],
      farm: [{ type: "qol", text: "48" }],
    },
  },
  "modules/patchnote/v1_2_0": {
    day: "2023-10-06",
    content: {
      meta: [
        { type: "clarity", text: "100" },
        { type: "clarity", text: "101" },
      ],
      mining: [
        { unlock: "miningDepthDweller", type: "bugfix", text: "97" },
        { unlock: "miningDepthDweller", type: "qol", text: "98" },
      ],
      village: [
        { type: "new", text: "addedBuilding", params: [30] },
        { unlock: "villageCoinUpgrades", type: "new", text: "addedUpgrade", params: [8] },
        { unlock: "villagePrestige", type: "new", text: "addedPrestigeUpgrade", params: [5] },
        { unlock: "achievementFeature", type: "new", text: "addedAchievement", params: [2] },
        { unlock: "achievementFeature", type: "new", text: "secretAchievement", params: [1] },
        { unlock: "villageBuildings5", type: "balance", text: "96" },
        { unlock: "villageCoinUpgrades", type: "qol", text: "99" },
      ],
      school: [{ unlock: "schoolHistorySubfeature", type: "accessibility", text: "103" }],
      horde: [
        { unlock: "hordeCorruptedFlesh", type: "bugfix", text: "90" },
        { unlock: "hordeItems", type: "bugfix", text: "91" },
        { type: "clarity", text: "93" },
        { unlock: "hordeItems", type: "bugfix", text: "94" },
      ],
      farm: [{ type: "qol", text: "102" }],
      event: [
        { unlock: "nightHuntEvent", type: "clarity", text: "104" },
        { unlock: "farmFertilizer", type: "clarity", text: "107" },
        { unlock: "nightHuntEvent", type: "bugfix", text: "108" },
      ],
      treasure: [
        { type: "bugfix", text: "92" },
        { type: "bugfix", text: "95" },
        { type: "appearance", text: "105" },
        { type: "clarity", text: "106" },
      ],
    },
  },
  "modules/patchnote/v1_3_0": {
    day: "2023-10-16",
    content: {
      meta: [{ type: "appearance", text: "137" }],
      mining: [{ unlock: "miningPickaxeCrafting", type: "clarity", text: "141" }],
      village: [{ unlock: "achievementFeature", type: "bugfix", text: "148" }],
      achievement: [{ unlock: "relicFeature", type: "qol", text: "154" }],
      horde: [
        { unlock: "hordeItems", type: "qol", text: "110" },
        { unlock: "hordePrestige", type: "qol", text: "111" },
        { unlock: "hordePrestige", type: "clarity", text: "134" },
        { type: "appearance", text: "112" },
        { type: "change", text: "118" },
        { type: "bugfix", text: "119" },
        { unlock: "hordeItems", type: "qol", text: "121" },
        { type: "accessibility", text: "133" },
        { unlock: "hordeItems", type: "new", text: "addedHordeItem", params: [16] },
        { unlock: "hordePrestige", type: "new", text: "addedHordeSigil", params: [24] },
        { unlock: "hordeHeirlooms", type: "new", text: "addedHordeHeirloom", params: [5] },
        { unlock: "hordeBrickTower", type: "new", text: "135" },
        { type: "info", text: "155" },
        { type: "new", text: "113" },
        { type: "balance", text: "142", balance: "buff", before: "30", after: "90" },
        { type: "balance", text: "143", balance: "nerf", before: "x2.5", after: "x1.6" },
        { type: "balance", text: "205", balance: "buff", before: "10.00K", after: "500.0K" },
        { type: "remove", text: "144" },
        { unlock: "hordeDamageTypes", type: "change", text: "114" },
        { unlock: "hordePrestige", type: "new", text: "115" },
        { unlock: "hordePrestige", type: "change", text: "116" },
        { type: "change", text: "145" },
        { unlock: "hordePrestige", type: "remove", text: "117" },
        { unlock: "hordePrestige", type: "remove", text: "120" },
        { unlock: "hordePrestige", type: "new", text: "138" },
        { unlock: "hordeHeirlooms", type: "balance", text: "86", balance: "nerf", before: "5%", after: "1%" },
        { unlock: "hordeHeirlooms", type: "balance", text: "87", balance: "buff", before: "-0.1%", after: "+0.1%" },
        { unlock: "hordePrestige", type: "new", text: "122" },
        { unlock: "hordeItems", type: "change", text: "123" },
        { unlock: "hordeItems", type: "new", text: "124" },
        { unlock: "hordeItems", type: "new", text: "125" },
        { unlock: "hordePrestige", type: "new", text: "126" },
        { type: "clarity", text: "127" },
        { type: "balance", text: "128", balance: "nerf", before: "+1", after: "+2" },
        { unlock: "hordePresti type: "new", text: "131" },
        { unlocklooms", type: "change", text: "136" },
        { type: "change", text: "139" },
        { unlock: "hordeBrickTower", type: "new", text: "140" },
        { type: "new", text: "146" },
        { type: "new", text: "147" },
        { unlock: "cardFeature", type: "change", text: "149" },
        { unlock: "hordeItems", type: "change", text: "153" },
        { type: "balance", text: "156" },
      ],
      general: [{ type: "accessibility", text: "109" }],
      cryolab: [
        { type: "change", text: "150" },
        { type: "clarity", text: "151" },
      ],
      event: [{ unlock: "nightHuntEvent", type: "qol", text: "152" }],
    },
  },
  "modules/patchnote/v1_3_1": { day: "2023-10-16", content: { treasure: [{ type: "bugfix", text: "157" }] } },
  "modules/patchnote/v1_3_2": {
    day: "2023-10-17",
    content: {
      meta: [{ type: "bugfix", text: "171" }],
      horde: [
        { unlock: "hordeItems", type: "clarity", text: "162" },
        { unlock: "hordePrestige", type: "qol", text: "163" },
        { unlock: "hordeHeirlooms", type: "balance", text: "165", balance: "nerf", before: "+1%", after: "+0.8%" },
        { type: "clarity", text: "167" },
        { unlock: "hordePrestige", type: "balance", text: "168", balance: "buff", before: "4x", after: "1.5x" },
        { unlock: "hordePrestige", type: "balance", text: "169", balance: "buff", before: "20%", after: "50%" },
        { unlock: "hordePrestige", type: "bugfix", text: "170" },
        { type: "qol", text: "166" },
      ],
      general: [
        { type: "bugfix", text: "159" },
        { type: "balance", text: "164" },
      ],
      event: [{ type: "info", text: "160" }],
      cryolab: [
        { type: "new", text: "158" },
        { type: "balance", text: "161" },
      ],
    },
  },
  "modules/patchnote/v1_3_3": {
    day: "2023-10-18",
    content: {
      village: [{ type: "clarity", text: "178" }],
      horde: [
        { type: "new", text: "172" },
        { unlock: "hordePrestige", type: "new", text: "173" },
        { unlock: "hordeItems", type: "bugfix", text: "174" },
        { unlock: "hordePrestige", type: "bugfix", text: "176" },
        { unlock: "hordePrestige", type: "qol", text: "177" },
      ],
      achievement: [{ type: "balance", text: "175" }],
    },
  },
  "modules/patchnote/v1_3_4": {
    day: "2023-10-23",
    content: {
      meta: [
        { type: "info", text: "179" },
        { type: "change", text: "180" },
        { type: "change", text: "183" },
        { type: "info", text: "184" },
        { type: "clarity", text: "185" },
        { type: "qol", text: "186" },
        { type: "bugfix", text: "187" },
        { type: "bugfix", text: "188" },
        { type: "change", text: "196" },
        { type: "qol", text: "200" },
        { type: "qol", text: "222" },
        { type: "new", text: "224" },
      ],
      mining: [
        { unlock: "miningPickaxeCrafting", type: "change", text: "181" },
        { type: "qol", text: "190" },
        { unlock: "miningPickaxeCrafting", type: "clarity", text: "225" },
      ],
      note: [
        { type: "change", text: "192" },
        { type: "new", text: "193" },
      ],
      village: [
        { unlock: "villageOffering1", type: "clarity", text: "195" },
        { unlock: "villageOffering1", type: "clarity", text: "221" },
      ],
      achievement: [
        { unlock: "hordeHeirlooms", type: "balance", text: "204", balance: "buff", before: "1000", after: "10.00K" },
      ],
      school: [
        { type: "qol", text: "197" },
        { unlock: "schoolArtSubfeature", type: "bugfix", text: "198" },
        { type: "balance", text: "199" },
      ],
      relic: [{ type: "clarity", text: "194" }],
      horde: [
        { unlock: "hordePrestige", type: "change", text: "182" },
        { unlock: "hordeItems", type: "new", text: "189" },
        { unlock: "hordeItems", type: "new", text: "addedHordeItem", params: [2] },
        { type: "qol", text: "191" },
        { unlock: "hordeHeirlooms", type: "balance", text: "165", balance: "nerf", before: "+0.8%", after: "+0.1%" },
        { unlock: "hordeHeirlooms", type: "balance", text: "201" },
        { unlock: "hordePrestige", type: "balance", text: "202" },
        { unlock: "hordePrestige", type: "balance", text: "203" },
        { type: "balance", text: "205", balance: "buff", before: "500.0K", after: "5.000M" },
        { unlock: "hordeHeirlooms", type: "balance", text: "206" },
        { unlock: "hordeHeirlooms", type: "balance", text: "207" },
        { type: "balance", text: "208", balance: "nerf", before: "x1.15", after: "x1.1" },
        { type: "bugfix", text: "209" },
        { unlock: "hordeItems", type: "bugfix", text: "214" },
      ],
      farm: [
        { type: "clarity", text: "211" },
        { type: "balance", text: "215", balance: "nerf", before: "1%", after: "0.4%" },
        { type: "balance", text: "216" },
        { unlock: "farmCropExp", type: "balance", text: "217", balance: "nerf", before: "x0.8", after: "x0.92" },
        { unlock: "farmCropExp", type: "balance", text: "218", balance: "buff", before: "x1.15", after: "x1.25" },
        { unlock: "farmCropExp", type: "balance", text: "219", balance: "buff", before: "x1.12", after: "x1.35" },
        { unlock: "farmCropExp", type: "balance", text: "220", balance: "buff", before: "x1.2", after: "x1.3" },
        { unlock: "farmCropExp", type: "balance", text: "223", balance: "nerf", before: "+0.5", after: "+0.35" },
      ],
      event: [
        { type: "bugfix", text: "212" },
        { type: "change", text: "213" },
      ],
      treasure: [{ type: "qol", text: "210" }],
    },
  },
  "modules/patchnote/v1_3_5": {
    day: "2023-10-23",
    content: {
      meta: [{ type: "bugfix", text: "227" }],
      horde: [{ unlock: "hordeItems", type: "bugfix", text: "226" }],
    },
  },
  "modules/patchnote/v1_3_6": {
    day: "2023-10-31",
    content: { meta: [{ type: "bugfix", text: "228" }], event: [{ type: "bugfix", text: "229" }] },
  },
  "modules/patchnote/v1_4_0": {
    day: "2023-11-11",
    content: {
      meta: [
        { type: "change", text: "247" },
        { type: "bugfix", text: "249" },
        { type: "new", text: "248" },
        { type: "new", text: "250" },
      ],
      mining: [
        { unlock: "miningEnhancement", type: "change", text: "244" },
        { unlock: "miningPickaxeCrafting", type: "new", text: "245" },
        { unlock: "miningDepthDweller", type: "new", text: "246" },
        {
          unlock: "miningDepthDweller",
          type: "balance",
          text: "257",
          balance: "nerf",
          before: "0.01%",
          after: "0.008%",
        },
        { unlock: "miningDepthDweller", type: "balance", text: "258", balance: "buff", before: "5", after: "7" },
        { unlock: "miningEnhancement", type: "balance", text: "259" },
        { unlock: "miningSmeltery", type: "balance", text: "260" },
        {
          unlock: "miningDepthDweller",
          type: "balance",
          text: "261",
          balance: "nerf",
          before: "x1.05",
          after: "x1.02",
        },
        { type: "new", text: "addedUpgrade", params: [10] },
        { type: "new", text: "addedPrestigeUpgrade", params: [8] },
        { unlock: "gemFeature", type: "new", text: "addedGemUpgrade", params: [2] },
      ],
      note: [{ type: "new", text: "274" }],
      village: [
        { type: "qol", text: "265" },
        { type: "balance", text: "266" },
        { type: "balance", text: "273" },
        { unlock: "villagePrestige", type: "balance", text: "267", balance: "buff", before: "1x", after: "4x" },
        { unlock: "villageCoinUpgrades", type: "balance", text: "268" },
      ],
      horde: [
        { unlock: "hordeHeirlooms", type: "balance", text: "255" },
        {
          unlock: "hordeCorruptedFlesh",
          type: "balance",
          text: "256",
          balance: "nerf",
          before: "+20%*",
          after: "x1.15",
        },
        { unlock: "hordeItemMastery", type: "clarity", text: "275" },
      ],
      farm: [
        { unlock: "farmCropExp", type: "change", text: "230" },
        { unlock: "farmCropExp", type: "change", text: "231" },
        { unlock: "farmCropExp", type: "new", text: "232" },
        { type: "balance", text: "233" },
        { type: "new", text: "234" },
        { unlock: "farmCropExp", type: "change", text: "235" },
        { type: "new", text: "236" },
        { unlock: "farmFertilizer", type: "balance", text: "237" },
        { unlock: "farmFertilizer", type: "balance", text: "238" },
        { unlock: "farmCropExp", type: "qol", text: "239" },
        { type: "info", text: "240" },
        { unlock: "farmFertilizer", type: "clarity", text: "241" },
        { type: "change", text: "242" },
        { unlock: "farmCropExp", type: "new", text: "243" },
        { type: "new", text: "addedUpgrade", params: [1] },
        { unlock: "farmCropExp", type: "balance", text: "253" },
        { unlock: "farmCropExp", type: "balance", text: "254" },
        { unlock: "farmCropExp", type: "change", text: "269" },
        { unlock: "farmFertilizer", type: "balance", text: "271", balance: "nerf", before: "+100%", after: "+10%" },
        { unlock: "farmFertilizer", type: "balance", text: "272" },
      ],
      treasure: [
        { unlock: "eventFeature", type: "balance", text: "263", balance: "nerf", before: "200%", after: "125%" },
        { type: "balance", text: "264", balance: "nerf", before: "+25%", after: "+10%" },
        { type: "bugfix", text: "270" },
      ],
      cryolab: [
        { unlock: "farmCropExp", type: "change", text: "251" },
        { unlock: "farmCropExp", type: "balance", text: "252", balance: "buff", before: "20/d", after: "500/d" },
      ],
      gallery: [{ type: "clarity", text: "276" }],
      mining_1: [
        { type: "balance", text: "262" },
        { type: "new", text: "addedUpgrade", params: [1] },
        { type: "new", text: "addedPrestigeUpgrade", params: [3] },
      ],
    },
  },
  "modules/patchnote/v1_4_1": {
    day: "2023-11-14",
    content: {
      mining: [
        { unlock: "miningDepthDweller", type: "context", text: "278" },
        {
          unlock: "miningDepthDweller",
          type: "balance",
          text: "257",
          balance: "nerf",
          before: "0.008%",
          after: "0.0065%",
        },
        { unlock: "miningDepthDweller", type: "balance", text: "277", balance: "buff", before: "0.1", after: "5" },
      ],
      village: [
        { type: "context", text: "279" },
        { type: "balance", text: "280" },
        { unlock: "villageCoinUpgrades", type: "balance", text: "281" },
        { unlock: "villageUpgradeBasics", type: "balance", text: "282", balance: "buff", before: "15", after: "20" },
        { unlock: "villageUpgradeBasics", type: "balance", text: "283" },
        { unlock: "villageOffering1", type: "change", text: "284" },
        { unlock: "villageOffering1", type: "new", text: "285" },
        { unlock: "villageOffering4", type: "balance", text: "297" },
        { unlock: "villageBuildings5", type: "balance", text: "286" },
        { unlock: "villageBuildings6", type: "balance", text: "287" },
        { unlock: "villageBuildings7", type: "balance", text: "288" },
        { unlock: "villageBuildings6", type: "balance", text: "289", balance: "nerf", before: "+50%", after: "+20%" },
        { type: "bugfix", text: "290" },
        { unlock: "villageCoinUpgrades", type: "bugfix", text: "291" },
        { type: "balance", text: "296", balance: "buff", before: "25%", after: "40%" },
        { unlock: "achievementFeature", type: "balance", text: "299" },
      ],
      achievement: [{ unlock: "relicFeature", type: "accessibility", text: "298" }],
      horde: [{ unlock: "hordeItemMastery", type: "balance", text: "295" }],
      farm: [
        { type: "balance", text: "292" },
        { unlock: "farmFertilizer", type: "balance", text: "271", balance: "buff", before: "+10%", after: "+50%" },
        { unlock: "farmFertilizer", type: "balance", text: "293", balance: "nerf", before: "+250%", after: "+150%" },
        { unlock: "farmFertilizer", type: "balance", text: "294" },
        {
          unlock: "farmDisableEarlyGame",
          type: "balance",
          text: "215",
          balance: "buff",
          before: "0.4%",
          after: "0.8%",
        },
      ],
    },
  },
  "modules/patchnote/v1_4_2": {
    day: "2024-06-09",
    content: {
      card: [{ type: "balance", text: "299_2" }],
      farm: [{ unlock: "farmCropExp", type: "balance", text: "299_4" }],
      event: [
        { unlock: "weatherChaosEvent", type: "bugfix", text: "299_1" },
        { unlock: "weatherChaosEvent", type: "balance", text: "299_3" },
      ],
    },
  },
  "modules/patchnote/v1_5_0": {
    day: "2024-09-27",
    content: {
      meta: [
        { type: "new", text: "300" },
        { type: "new", text: "311" },
        { type: "new", text: "312" },
        { type: "bugfix", text: "310" },
        { type: "accessibility", text: "313" },
        { type: "anticheat", text: "317" },
        { type: "anticheat", text: "318" },
        { unlock: "gemFeature", type: "appearance", text: "356" },
        { unlock: "miningDepthDweller", type: "clarity", text: "377" },
      ],
      mining: [
        { type: "new", text: "addedUpgrade", params: [8] },
        { unlock: "miningDepthDweller", type: "new", text: "addedPrestigeUpgrade", params: [7] },
        { unlock: "gemFeature", type: "new", text: "addedGemUpgrade", params: [2] },
        { unlock: "miningPickaxeCrafting", type: "new", text: "addedOre", params: [2] },
        { unlock: "miningDepthDweller", type: "new", text: "addedRareEarth", params: [1] },
        { unlock: "miningDepthDweller", type: "balance", text: "352" },
        { unlock: "miningEnhancement", type: "change", text: "309" },
        { unlock: "miningGasSubfeature", type: "qol", text: "348" },
      ],
      gem: [
        { type: "new", text: "357" },
        { unlock: "cardFeature", type: "new", text: "358" },
        { unlock: "eventFeature", type: "new", text: "359" },
        { unlock: "treasureFeature", type: "new", text: "360" },
      ],
      village: [
        { unlock: "villageLoot", type: "balance", text: "355" },
        { unlock: "villageOffering4", type: "balance", text: "362" },
      ],
      achievement: [
        { type: "balance", text: "328" },
        { type: "balance", text: "329" },
        { type: "balance", text: "347" },
      ],
      school: [{ type: "balance", text: "361" }],
      card: [
        { type: "context", text: "319" },
        { type: "new", text: "314" },
        { type: "new", text: "320" },
        { type: "change", text: "321" },
        { type: "balance", text: "322" },
        { type: "balance", text: "323" },
      ],
      horde: [
        { type: "new", text: "addedAchievement", params: [1] },
        { type: "new", text: "addedUpgrade", params: [4] },
        { unlock: "hordePrestige", type: "new", text: "addedPrestigeUpgrade", params: [4] },
        { unlock: "hordeItems", type: "new", text: "addedHordeItem", params: [14] },
        { unlock: "hordeBrickTower", type: "new", text: "addedTower", params: [2] },
        { unlock: "hordeHeirlooms", type: "new", text: "addedHordeHeirloom", params: [2] },
        { unlock: "hordePrestige", type: "new", text: "addedHordeSigil", params: [2] },
        { unlock: "hordePrestige", type: "balance", text: "352" },
        { unlock: "hordeItemMastery", type: "bugfix", text: "308" },
        { unlock: "hordeItemMastery", type: "bugfix", text: "315" },
        { unlock: "hordeBrickTower", type: "qol", text: "342" },
        { unlock: "hordeBrickTower", type: "balance", text: "343" },
        { unlock: "hordeBrickTower", type: "balance", text: "344", balance: "nerf", before: "x1.1", after: "x1.02" },
        { unlock: "hordeItems", type: "change", text: "345" },
        { unlock: "hordeItems", type: "balance", text: "346" },
        { unlock: "hordeDamageTypes", type: "balance", text: "369" },
        { unlock: "hordeCorruptedFlesh", type: "new", text: "370" },
        { unlock: "hordeBrickTower", type: "new", text: "371" },
        { unlock: "hordeBrickTower", type: "change", text: "376" },
        { unlock: "hordeBrickTower", type: "balance", text: "378", balance: "nerf", before: "100%", after: "50%" },
        {
          unlock: "hordeHeirlooms",
          type: "balance",
          text: "382",
          balance: "change",
          before: "+0.05x",
          after: "+0.25%",
        },
        { unlock: "hordeItems", type: "balance", text: "387" },
      ],
      farm: [
        { type: "qol", text: "380" },
        { type: "qol", text: "381" },
        { type: "change", text: "325" },
        { type: "change", text: "334" },
        { type: "qol", text: "335" },
        { unlock: "farmLuxuryCardPack", type: "balance", text: "336", balance: "buff", before: "5", after: "25" },
        { unlock: "farmDisableEarlyGame", type: "new", text: "addedRareDrop", params: [1] },
        { unlock: "farmCropExp", type: "new", text: "addedGene", params: [7] },
        { type: "new", text: "addedCrop", params: [5] },
        { unlock: "farmFertilizer", type: "new", text: "addedFertilizer", params: [4] },
        { type: "new", text: "addedUpgrade", params: [7] },
        { unlock: "farmDisableEarlyGame", type: "clarity", text: "324" },
        { unlock: "farmCropExp", type: "context", text: "301" },
        { unlock: "farmCropExp", type: "new", text: "302" },
        { unlock: "farmCropExp", type: "balance", text: "337" },
        { unlock: "farmCropExp", type: "new", text: "338" },
        { unlock: "farmCropExp", type: "balance", text: "339" },
        { unlock: "farmFertilizer", type: "balance", text: "340" },
        { unlock: "farmDisableEarlyGame", type: "balance", text: "379" },
        { unlock: "farmCropExp", type: "balance", text: "341" },
        { unlock: "farmFertilizer", type: "balance", text: "365", balance: "nerf", before: "10%", after: "4%" },
        { unlock: "farmFertilizer", type: "balance", text: "366" },
        { unlock: "farmFertilizer", type: "balance", text: "367" },
        { unlock: "farmFertilizer", type: "balance", text: "368", balance: "nerf", before: "20%", after: "5%" },
        {
          unlock: "farmAdvancedCardPack",
          type: "balance",
          text: "383",
          balance: "nerf",
          before: "+0.02%",
          after: "+0.01%",
        },
        {
          unlock: "farmAdvancedCardPack",
          type: "balance",
          text: "372",
          balance: "change",
          before: "+1%",
          after: "+0.015x",
        },
        { unlock: "farmCropExp", type: "balance", text: "373" },
        { unlock: "farmDisableEarlyGame", type: "balance", text: "374" },
      ],
      event: [
        { unlock: "farmFertilizer", type: "balance", text: "333", balance: "buff", before: "5", after: "20" },
        { unlock: "nightHuntEvent", type: "change", text: "384" },
        { unlock: "nightHuntEvent", type: "new", text: "385" },
        { unlock: "nightHuntEvent", type: "new", text: "386" },
      ],
      treasure: [
        { unlock: "eventFeature", type: "balance", text: "263", balance: "nerf", before: "125%", after: "100%" },
        { unlock: "eventFeature", type: "balance", text: "331" },
        { unlock: "eventFeature", type: "balance", text: "332", balance: "buff", before: "16", after: "32" },
        { unlock: "miningSmoke", type: "new", text: "353" },
        { type: "qol", text: "354" },
      ],
      gallery: [
        { type: "appearance", text: "304" },
        { type: "new", text: "addedAchievement", params: [4] },
        { type: "new", text: "addedGalleryIdea", params: [18] },
        { type: "new", text: "addedRelic", params: [15] },
        { type: "new", text: "addedUpgrade", params: [40] },
        { type: "new", text: "addedPrestigeUpgrade", params: [16] },
        { type: "new", text: "addedGemUpgrade", params: [5] },
        { unlock: "galleryCanvas", type: "new", text: "327" },
        { unlock: "galleryInspiration", type: "clarity", text: "306" },
        { type: "context", text: "303" },
        { unlock: "galleryConversion", type: "change", text: "305" },
        { unlock: "galleryConversion", type: "new", text: "326" },
        { unlock: "galleryShape", type: "new", text: "307" },
        { unlock: "galleryAuction", type: "balance", text: "316" },
        { unlock: "galleryAuction", type: "balance", text: "363" },
        { unlock: "galleryInspiration", type: "balance", text: "364" },
        { unlock: "galleryDrums", type: "balance", text: "375" },
      ],
      cryolab: [{ type: "balance", text: "330", balance: "nerf", before: "100%", after: "40%" }],
      mining_1: [
        { type: "balance", text: "349", balance: "nerf", before: "2", after: "0.1" },
        { type: "balance", text: "350", balance: "buff", before: "25M", after: "2.5M" },
        { type: "balance", text: "351", balance: "nerf", before: "x8", after: "x7" },
      ],
      village_1: [
        { type: "new", text: "addedSubfeature" type: "new", text: "addedUpgrade", params: [1 ],
      horde_1: [
        { type: "new", text: "addedSubfeature" },
        { type: "new", text: "addedUpgrade", params: [11] },
        { type: "new", text: "addedPrestigeUpgrade", params: [11] },
        { type: "new", text: "addedHordeClass", params: [5] },
        { unlock: "hordeAreaMonkeyJungle", type: "new", text: "addedTrinket", params: [19] },
      ],
    },
  },
  "modules/patchnote/v1_5_1": {
    day: "2024-09-28",
    content: {
      card: [{ type: "bugfix", text: "392" }],
      horde: [{ unlock: "hordeItems", type: "bugfix", text: "388" }],
      farm: [{ type: "bugfix", text: "389" }],
      gallery: [
        { unlock: "galleryConversion", type: "balance", text: "390", balance: "nerf", before: "4x", after: "16x" },
        { unlock: "galleryConversion", type: "new", text: "391" },
        { unlock: "galleryConversion", type: "clarity", text: "394" },
      ],
      horde_1: [{ type: "bugfix", text: "393" }],
    },
  },
  "modules/patchnote/v1_5_2": {
    day: "2024-09-29",
    content: {
      gallery: [
        { unlock: "galleryConversion", type: "balance", text: "395", balance: "buff", before: "1.5x", after: "1.9x" },
      ],
    },
  },
  "modules/patchnote/v1_5_3": {
    day: "2024-09-29",
    content: {
      village: [{ unlock: "villageOffering1", type: "bugfix", text: "396" }],
      event: [{ type: "bugfix", text: "397" }],
      village_1: [{ type: "bugfix", text: "398" }],
    },
  },
  "modules/patchnote/v1_5_4": {
    day: "2024-11-23",
    content: {
      horde: [{ unlock: "hordeBrickTower", type: "balance", text: "426" }],
      farm: [
        { type: "bugfix", text: "427" },
        { unlock: "farmCropExp", type: "balance", text: "412" },
        { unlock: "farmCropExp", type: "balance", text: "413" },
      ],
      event: [
        { unlock: "snowdownEvent", type: "new", text: "415" },
        { unlock: "snowdownEvent", type: "change", text: "416" },
        { unlock: "snowdownEvent", type: "new", text: "417" },
        { unlock: "snowdownEvent", type: "change", text: "418" },
        { unlock: "snowdownEvent", type: "balance", text: "419", balance: "nerf", before: "5", after: "8" },
        { unlock: "snowdownEvent", type: "balance", text: "420", balance: "buff", before: "50", after: "30" },
        { unlock: "snowdownEvent", type: "balance", text: "421", balance: "buove", text: "422" },
        { unlock: "sntype: "new", text: "424" },
        { unlock: "snowdownEvent", type: "clarity", text: "425" },
      ],
      gallery: [
        {
          unlock: "galleryInspiration",
          type: "balance",
          text: "402",
          balance: "change",
          before: "+0.75x",
          after: "+0.5x (+0.1x)",
        },
        { unlock: "galleryInspiration", type: "balance", text: "403" },
        {
          unlock: "galleryInspiration",
          type: "balance",
          text: "405",
          balance: "buff",
          before: "+0.1x",
          after: "+0.12x",
        },
        { unlock: "galleryDrums", type: "balance", text: "399", balance: "nerf", before: "+3 (+1)", after: "+2" },
        { unlock: "galleryCanvas", type: "balance", text: "400" },
        { unlock: "galleryDrums", type: "balance", text: "401", balance: "buff", before: "+0.25x", after: "+0.35x" },
        { unlock: "galleryCanvas", type: "balance", text: "404", balance: "buff", before: "+0.18x", after: "+0.25x" },
        { unlock: "galleryShape", type: "bugfix", text: "406" },
        { unlock: "galleryShape", type: "context", text: "411" },
        { unlock: "galleryShape", type: "balance", text: "408" },
        {
          unlock: "galleryShape",
          type: "balance",
          text: "409",
          balance: "nerf",
          before: "180s (+7s)",
          after: "30s (+3.7s)",
        },
        { unlock: "galleryShape", type: "balance", text: "410" },
        { unlock: "galleryCanvas", type: "balance", text: "407", balance: "nerf", before: "+25", after: "+10" },
      ],
      village_1: [{ unlock: "villageSpecialIngredient", type: "qol", text: "414" }],
    },
  },
  "modules/patchnote/v1_5_5": { day: "2024-11-23", content: { meta: [{ type: "bugfix", text: "428" }] } },
  "modules/patchnote/v1_5_6": {
    day: "2025-01-19",
    content: {
      meta: [{ type: "bugfix", text: "434" }],
      village: [
        { unlock: "villageOffering1", type: "remove", text: "429" },
        { unlock: "villageOffering1", type: "balance", text: "430" },
        {
          unlock: "villageOffering1",
          type: "balance",
          text: "431",
          balance: "buff",
          before: "0.01/h",
          after: "0.02/h",
        },
        { unlock: "villageOffering1", type: "change", text: "432" },
        { unlock: "villageOffering1", type: "change", text: "433" },
      ],
      horde: [{ unlock: "hordeSacrifice", type: "bugfix", text: "436" }],
      event: [
        { unlock: "cindersEvent", type: "bugfix", text: "437" },
        { unlock: "cindersEvent", type: "balance", text: "438", balance: "buff", before: "x1.01", after: "x1.015" },
        { unlock: "cindersEvent", type: "balance", text: "439" },
      ],
      gallery: [
        { unlock: "galleryDrums", type: "balance", text: "399", balance: "buff", before: "+2", after: "+3" },
        { unlock: "galleryDrums", type: "balance", text: "401", balance: "buff", before: "+0.35x", after: "+0.4x" },
      ],
      horde_1: [{ type: "bugfix", text: "435" }],
    },
  },
  "modules/patchnote/v1_5_7": {
    day: "2025-01-19",
    content: { village: [{ unlock: "villageOffering1", type: "bugfix", text: "440" }] },
  },
  "modules/patchnote/v1_5_8": {
    day: "2025-01-20",
    content: {
      meta: [{ type: "bugfix", text: "441" }],
      farm: [{ unlock: "farmFertilizer", type: "bugfix", text: "442" }],
    },
  },
  "modules/relic/glyph": {
    // mining
    dust: {
      icon: "mdi-weather-dust",
      color: "brown",
      effect: [
        { name: "currencyMiningScrapGain", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "currencyMiningScrapCap", type: "mult", val-ellipse",
      color: "pale-orange",
      eff.12, lvl) },
        { name: "miningRareEarthGain", type: "mult", value: (lvl) => Math.pow(1.16, lvl) },
      ],
    },
    fire: {
      icon: "mdi-fire",
      color: "orange-red",
      effect: [
        { name: "miningSmelterySpeed", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyMiningEmberCap", type: "base", value: (lvl) => lvl * 30 },
      ],
    }, // village
    wood: {
      icon: "mdi-tree",
      color: "wooden",
      effect: [
        { name: "villageWorker", type: "base", value: (lvl) => lvl * 12 },
        { name: "villageArtisan", type: "base", value: (lvl) => lvl },
      ],
    },
    flow: {
      icon: "mdi-waterfall",
      color: "light-blue",
      effect: [{ name: "villageMaterialGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) }],
    },
    stone: {
      icon: "mdi-chart-bubble",
      color: "dark-grey",
      effect: [{ name: "villageMaterialCap", type: "mult", value: (lvl) => Math.pow(1.09, lvl) }],
    }, // horde
    spike: {
      icon: "mdi-nail",
      color: "pale-red",
      effect: [
        { name: "hordeAttack", type: "mult", value: (lvl) => Math.pow(1.12, lvl) },
        { name: "hordeHealth", type: "mult", value: (lvl) => Math.pow(1.12, lvl) },
      ],
    },
    dream: {
      icon: "mdi-sleep",
      color: "pale-light-blue",
      effect: [
        { name: "hordeNostalgia", type: "base", value: (lvl) => lvl * 15 },
        { name: "horde: {
      icon: "mdi-clover",
      color: "ligh: (lvl) => Math.pow(1.1, lvl) },
        { name: "hordeItemMasteryGain", type: "mult", value: (lvl) => Math.pow(1.18, lvl) },
      ],
    }, // farm
    rain: {
      icon: "mdi-weather-pouring",
      color: "dark-blue",
      effect: [
        { name: "currencyFarmVegetableGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "currencyFarmGrassCap", type: "base", value: (lvl) => lvl * 100 },
      ],
    },
    sun: {
      icon: "mdi-white-balance-sunny",
      color: "yellow",
      effect: [
        { name: "currencyFarmBerryGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "farmGoldChance", type: "mult", value: (lvl) => lvl * 0.03 + 1 },
      ],
    },
    cloud: {
      icon: "mdi-clouds",
      color: "blue-grey",
      effect: [
        { name: "currencyFarmGrainGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "currencyFarmFlowerGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
      ],
    }, // gallery
    blossom: {
      icon: "mdi-image-filter-vintage",
      color: "purple",
      effect: [
        { name: "currencyGalleryBeautyGain", type: "mult", value: (lvl) => Math.pow(1.35, lvl) },
        { name: "currencyGalleryConverterGain", type: "mult", value: (lvl) => Math.pow(1.06, lvl) },
      ],
    },
    leaf: {
      icon: "mdi-leaf",
      color: "pale-green",
      effect: [
        { name: "galleryShapeGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
        { name: "currencyGalleryMotivationCap", type: "base", value: (lvl) => lvl * 5 },
      ],
    },
    paper: {
      icon: "mdi-note",
      color: "pale-yellow",
      effect: [
        { name: "galleryInspirationStart", type: "base", value: (lvl) => lvl },
        { name: "galleryCanvasSize", type: "base", value: (lvl) => lvl },
      ],
    }, // other
    book: {
      icon: "mdi-book",
      color: "beige",
      effect: [
        { name: "currencySchoolBookGain", type: "base", value: (lvl) => lvl * 5 },
        { name: "currencySchoolGoldenDustCap", type: "base", value: (lvl) => lvl * 2500 },
      ],
    },
    coin: {
      icon: "mdi-circle-multiple",
      color: "amber",
      effect: [
        { name: "currencyTreasureFragmentGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "treasureSlots", type: "base", value: (lvl) => lvl },
      ],
    },
  },
  "modules/relic": {
    name: "relic",
    unlockNeeded: "relicFeature",
    unlock: ["relicFeature", "relicMuseum"],
    note: buildArray(1).map(() => "g"),
    init() {
      for (const [key, elem] of Object.entries(glyph)) {
        store.commit("relic/initGlyph", { name: key, ...elem });
      }
    },
  },
  "modules/school/bookFarm": {
    bookSmallCrate: {
      type: "book",
      raiseOtherCap: "farm_smallCrate",
      requirement() {
        return store.state.upgrade.item.farm_smallCrate.highestLevel >= 7;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.25, lvl) * (lvl + 5) * 72) };
      },
      effect: [{ name: "upgradeFarmSmallCrateCap", type: "base", value: (lvl) => lvl }],
    },
    bookScarecrow: {
      type: "book",
      raiseOtherCap: "farm_scarecrow",
      requirement() {
        return store.state.upgrade.item.farm_scarecrow.highestLevel >= 10;
      },
      price(lvl) {
        },
      effect: [{ name: "upgradeFarmScarecr "book",
      raiseOtherCap: "farm_shed",
      requirement() {
        return store.state.upgrade.item.farm_shed.highestLevel >= 10;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.25, lvl) * (lvl + 5) * 144) };
      },
      effect: [{ name: "upgradeFarmShedCap", type: "base", value: (lvl) => lvl }],
    },
    bookMediumCrate: {
      type: "book",
      raiseOtherCap: "farm_mediumCrate",
      requirement() {
        return store.state.upgrade.item.farm_mediumCrate.highestLevel >= 8;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.25, lvl) * (lvl + 5) * 185) };
      },
      effect: [{ name: "upgradeFarmMediumCrateCap", type: "base", value: (lvl) => lvl }],
    },
    bookInsectParadise: {
      type: "book",
      raiseOtherCap: "farm_insectParadise",
      requirement() {
        return store.state.upgrade.item.farm_insectParadise.highestLevel >= 6;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.25, lvl) * (lvl + 5) * 330) };
      },
      effect: [{ name: "upgradeFarmInsectParadiseCap", type: "base", value: (lvl) => lvl }],
    },
    bookBigCrate: {
      type: "book",
      raiseOtherCap: "farm_bigCrate",
      requirement() {
        return store.state.upgrade.item.farm_bigCrate.highestLevel >= 10;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.25, lvl) * (lvl + 5) * 525) };
      },
      effect: [{ name: "upgradeFarmBigCrateCap", type: "base", value: (lvl) => lvl }],
    },
  },
  "modules/school/bookGallery": {
    bookRedPower: {
      type: "book",
      raiseOtherCap: "gallery_redPower",
      requirement() {
        return store.state.upgrade.item.gallery_redPower.highestLevel >= 15;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 60) };
      },
      effect: [{ name: "upgradeGalleryRedPowerCap", type: "base", value: (lvl) => lvl }],
    },
    bookOrangePower: {
      type: "book",
      raiseOtherCap: "gallery_orangePower",
      requirement() {
        return store.state.upgrade.item.gallery_orangePower.highestLevel >= 15;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 88) };
      },
      effect: [{ name: "upgradeGalleryOrangePowerCap", type: "base", value: (lvl) => lvl }],
    },
    bookYellowPower: {
      type: "book",
      raiseOtherCap: "gallery_yellowPower",
      requirement() {
        return store.state.upgrade.item.gallery_yellowPower.highestLevel >= 15;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 132) };
      },
      effect: [{ name: "upgradeGalleryYellowPowerCap", type: "base", value: (lvl) => lvl }],
    },
    bookGreenPower: {
      type: "book",
      raiseOtherCap: "gallery_greenPower",
      requirement() {
        return store.state.upgrade.item.gallery_greenPower.highestLevel >= 15;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 200) };
      },
      effect: [{ name: "upgradeGalleryGreenPowerCap", type: "base", value: (lvl) => lvl }],
    },
    bookBluePower: {
      type: "book",
      raiseOtherCap: "gallery_bluePower",
      requirement() {
        return store.state.upgrade.item.gallery_bluePower.highestLevel >= 15;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 275) };
      },
      effect: [{ name: "upgradeGalleryBluePowerCap", type: "base", value: (lvl) => lvl }],
    },
    bookPurplePower: {
      type: "book",
      raiseOtherCap: "gallery_purplePower",
      requirement() {
        return store.state.upgrade.item.gallery_purplePower.highestLevel >= 15;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 380) };
      },
      effect: [{ name: "upgradeGalleryPurplePowerCap", type: "base", value: (lvl) => lvl }],
    },
  },
  "modules/school/bookHorde": {
    bookTraining: {
      type: "book",
      raiseOtherCap: "horde_training",
      requirement() {
        return store.state.upgrade.item.horde_training.highestLevel >= 100;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 28) };
      },
      effect: [{ name: "upgradeHordeTrainingCap", type: "base", value: (lvl) => lvl }],
    },
    bookLuckyStrike: {
      type: "book",
      raiseOtherde.item.horde_luckyStrike.highestLevel >= 15;.15, lvl) * (lvl + 5) * 85) };
      },
      effect: [{ name: "upgradeHordeLuckyStrikeCap", type: "base", value: (lvl) => lvl }],
    },
    bookLooting: {
      type: "book",
      raiseOtherCap: "horde_looting",
      requirement() {
        return store.state.upgrade.item.horde_looting.highestLevel >= 25;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 140) };
      },
      effect: [{ name: "upgradeHordeLootingCap", type: "base", value: (lvl) => lvl }],
    },
    bookSurvivalGuide: {
      type: "book",
      raiseOtherCap: "horde_survivalGuide",
      requirement() {
        return store.state.upgrade.item.horde_survivalGuide.highestLevel >= 25;
      },
      price(lvl) {
        return    effect: [{ name: "upgradeHordeSurvivalGuide: "book",
      raiseOtherCap: "horde_carving",
      requirement() {
        return store.state.upgrade.item.horde_carving.highestLevel >= 5;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 310) };
      },
      effect: [{ name: "upgradeHordeCarvingCap", type: "base", value: (lvl) => lvl }],
    },
    bookWhitePaint: {
      type: "book",
      raiseOtherCap: "horde_whitePaint",
      requirement() {
        return store.state.upgrade.item.horde_whitePaint.highestLevel >= 25;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 475) };
      },
      effect: [{ name: "upgradeHordeWhitePaintCap", type: "base", value: (lvl) => lvl }],
    },
  },
  "modules/school/bookMining": {
    bookAluminiumHardening: {
      type: "book",
      raiseOtherCap: "mining_aluminiumHardening",
      requirement() {
        return store.state.upgrade.item.mining_aluminiumHardening.highestLevel >= 6;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 7) };
      },
      effect: [{ name: "upgradeMiningAluminiumHardeningCap", type: "base", value: (lvl) => lvl }],
    },
    bookAluminiumTanks: {
      type: "book",
      raiseOtherCap: "mining_aluminiumTanks",
      requirement() {
        return store.state.upgrade.item.mining_aluminiumTanks.highestLevel >= 8;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 5) };
      },
      effect: [{ name: "upgradeMiningAluminiumTanksCap", type: "base", value: (lvl) => lvl }],
    },
    bookRefinery: {
      type: "book",
      raiseOtherCap: "mining_refinery",
      requirement() {
        return store.state.upgrade.item.mining_refinery.highestLevel >= 5;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 40) };
      },
      effect: [{ name: "upgradeMiningRefineryCap", type: "base", value: (lvl) => lvl }],
    },
    bookFurnace: {
      type: "book",
      raiseOtherCap: "mining_furnace",
      requirement() {
        return store.state.upgrade.item.mining_furnace.highestLevel >= 25;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 60) };
      },
      effect: [{ name: "upgradeMiningFurnaceCap", type: "base", value: (lvl) => lvl }],
    },
    bookIronExpansion: {
      type: "book",
      raiseOtherCap: "mining_ironExpansion",
      requirement() {
        return store.state.upgrade.item.mining_ironExpansion.highestLevel >= 3;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 120) };
      },
      effect: [{ name: "upgradeMiningIronExpansionCap", type: "base", value: (lvl) => lvl }],
    },
    bookMagnet: {
      type: "book",
      raiseOtherCap: "mining_magnet",
      requirement() {
        return store.state.upgrade.item.mining_magnet.highestLevel >= 10;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 160) };
      },
      effect: [{ name: "upgradeMiningMagnetCap", type: "base", value: (lvl) => lvl }],
    },
    bookMetalDetector: {
      type: "book",
      raiseOtherCap: "mining_metalDetector",
      requirement() {
        return store.state.upgrade.item.mining_metalDetector.highestLevel >= 12;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 250) };
      },
      effect: [{ name: "upgradeMiningMetalDetectorCap", type: "base", value: (lvl) => lvl }],
    },
  },
  "modules/school/bookVillage": {
    bookWallet: {
      type: "book",
      raiseOtherCap: "village_wallet",
      requirement() {
        return store.state.upgrade.item.village_wallet.highestLevel >= 12;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 10) };
      },
      effect: [{ name: "upgradeVillageWalletCap", type: "base", value: (lvl) => lvl * 2 }],
    },
    bookResourceBag: {
      type: "book",
      raiseOtherCap: "village_resourceBag",
      requirement() {
        return store.state.upgrade.item.village_resourceBag.highestLevel >= 10;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 15) };
      },
      effect: [{ name: "upgradeVillageResourceBagCap", type: "base", value: (lvl) => lvl * 2 }],
    },
    bookMetalBag: {
      type: "book",
      raiseOtherCap: "village_metalBag",
      requirement() {
        return store.state.upgrade.item.village_metalBag.highestLevel >= 5;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 16) };
      },
      effect: [{ name: "upgradeVillageMetalBagCap", type: "base", value: (lvl) => lvl }],
    },
    bookTreasury: {
      type: "book",
      raiseOtherCap: "village_treasury",
      requirement() {
        return store.state.upgrade.item.village_treasury.highestLevel >= 10;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 30) };
      },
      effect: [{ name: "upgradeVillageTreasuryCap", type: "base", value: (lvl) => lvl }],
    },
    bookStorage: {
      type: "book",
      raiseOtherCap: "village_storage",
      requirement() {
        return store.state.upgrade.item.village_storage.highestLevel >= 20;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 90) };
      },
      effect: [{ name: "upgradeVillageStorageCap", type: "base", value: (lvl) => lvl }],
    },
    bookShed: {
      type: "book",
      raiseOtherCap: "village_shed",
      requirement() {
        return store.state.upgrade.item.village_shed.highestLevel >= 5;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 110) };
      },
      effect: [{ name: "upgradeVillageShedCap", type: "base", value: (lvl) => lvl }],
    },
    bookSchool: {
      type: "book",
      raiseOtherCap: "village_school",
      requirement() {
        return store.state.upgrade.item.village_school.highestLevel >= 5;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 180) };
      },
      effect: [{ name: "upgradeVillageSchoolCap", type: "base", value: (lvl) => lvl }],
    },
    bookBigStorage: {
      type: "book",
      raiseOtherCap: "village_bigStorage",
      requirement() {
        return store.state.upgrade.item.village_bigStorage.highestLevel >= 20;
      },
      price(lvl) {
        return { school_book: Math.round(Math.pow(1.15, lvl) * (lvl + 5) * 480) };
      },
      effect: [{ name: "upgradeVillageBigStorageCap", type: "base", value: (lvl) => lvl }],
    },
  },
  "modules/school/upgradePremium": {
    student: {
      type: "premium",
      price(lvl) {
        return {
          gem_ruby: fallbackArray([5, 20, 60, 125], [4, 5, 6, 7][lvl % 4] * Math.pow(2, Math.floor(lvl / 4)) * 25, lvl),
        };
      },
      effect: [{ name: "currencySchoolBookGain", type: "base", value: (lvl) => 5 * lvl }],
    },
  },
  "modules/school": {
    name: "school",
    tickspeed: 60,
    unlockNeeded: "schoolFeature",
    tick(minutes, oldTime, newTime) {
      store.dispatch("currency/gain", {
        feature: "school",
    SchoolBookGain", store.getters["school/subjectatch("note/find", "school_2");
      const dayDiff = Math.floor(newTime / SECONDS_PER_DAY) - Math.floor(oldTime / SECONDS_PER_DAY);
      if (dayDiff > 0) {
        store.dispatch("currency/gain", { feature: "school", name: "examPass", amount: dayDiff }, { root: true });
      }
    },
    unlock: ["schoolFeature", "schoolLiteratureSubfeature", "schoolHistorySubfeature", "schoolArtSubfeature"],
    stat: { highestGrade: { display: "grade" } },
    currency: {
      book: {
        color: "brown",
        icon: "mdi-book",
        gainMult: { display: "perHour" },
        showGainMult: true,
        gainTimerFunction() {
          return store.getters["mult/get"]("currencySchoolBookGain", store.getters["school/subjectsBookGain"]);
        },
      },
      goldenDust: { color: "amber", icon: "mdi-timer-sand", overcapMult: 0, capMult: { baseValue: buildNum(10, "K") } },
      examPass: { color: "pale-blue", icon: "mdi-ticket-account" },
    },
    upgrade: upgradePremium,
    note: buildArray(5).map(() => "g"),
    init() {
      for (const [key, elem] of Object.entries({
        math: { scoreGoal: 12 },
        literature: { unlock: "schoolLiteratureSubfeature", scoreGoal: 8 },
        history: { unlock: "schoolHistorySubfeature", scoreGoal: 5 },
        art: { unlock: "schoolArtSubfeature", scoreGoal: 10 },
      })) {
        store.commit("school/init", { name: key, ...elem });
      }
    },
    saveGame() {
      let obj = {};
      for (const [key, elem] of Object.entries(store.state.school)) {
        if (elem.grade > 0 || elem.progress > 0) {
          obj[key] = [elem.grade, elem.currentGrade, elem.progress];
        }
      }
      return obj;
    },
    loadGame(data) {
      for (const [key, elem] of Object.entries(data)) {
        if (store.state.school[key] !== undefined) {
          store.commit("school/updateKey", { name: key, key: "grade", value: elem[0] });
          store.commit("school/updateKey", { name: key, key: "currentGrade", value: elem[1] });
          store.commit("school/updateKey", { name: key, key: "progress", value: elem[2] });
        }
      }
    },
  },
  "modules/treasure/effect": {
    // Mining effects
    miningDamage: { feature: "mining", icon: "mdi-bomb", value: 0.25 },
    currencyMiningScrapGain: { feature: "mining", icon: "mdi-dots-triangle", value: 0.3 },
    miningOreGain: { feature: "mining", icon: "mdi-chart-bubble", value: 0.2 },
    miningSmelterySpeed: { feature: "mining", unlock: "miningSmeltery", icon: "mdi-fire", value: 0.2 },
    currencyMiningSmokeGain: { feature: "mining", unlock: "miningSmoke", icon: "mdi-smoke", value: 0.04 },
    currencyMiningCrystalGreenGain: {
      feature: "mining",
      type: "special",
      icon: "mdi-star-three-points",
      unique: true,
      value: 0.1,
    },
    currencyMiningCrystalYellowGain: {
      feature: "mining",
      unlock: "miningGasSubfeature",
      type: "special",
      icon: "mdi-star-four-points",
      unique: true,
      value: 0.05,
    }, // Village effects
    queueSpeedVillageBuilding: { feature: "village", icon: "mdi-hammer", value: 0.3 },
    villageMaterialGain: { feature: "village", icon: "mdi-tree", value: 0.1 },
    currencyVillageCoinGain: { feature: "village", icon: "mdi-circle-multiple", value: 0.25 },
    villageMentalGain: { feature: "village", icon: "mdi-brain", value: 0.1 },
    currencyVillageFaithGain: { feature: "village", type: "special", icon: "mdi-hands-pray", unique: true, value: 0.1 },
    currencyVillageSharesGain: {
      feature: "village",
      unlock: "villageCraftingSubfeature",
      type: "special",
      icon: "mdi-certificate",
      unique: true,
      value: 0.05,
    }, // Horde effects
    hordeAttack: { feature: "horde", icon: "mdi-sword", value: 0.2 },
    currencyHordeBoneGain: { feature: "horde", icon: "mdi-bone", value: 0.3 },
    currencyHordeMonsterPartGain: { feature: "horde", icon: "mdi-stomach", value: 0.15 },
    hordeItemMasteryGain: { feature: "horde", unlock: "hordeItemMastery", icon: "mdi-seal", value: 0.1 },
    currencyHordeSoulCorruptedGain: { feature: "horde", type: "special", icon: "mdi-ghost", unique: true, value: 0.1 }, // Farm effects
    currencyFarmVegetableGain: { feature: "farm", icon: "mdi-carrot", value: 0.35 },
    currencyFarmBerryGain: { feature: "farm", icon: "mdi-fruit-grapes", value: 0.35 },
    currencyFarmGrainGain: { feature: "farm", icon: "mdi-barley", value: 0.35 },
    currencyFarmFlowerGain: { feature: "farm", icon: "mdi-flower", value: 0.35 },
    farmExperience: {
      feature: "farm",
      unlock: "farmCropExp",
      type: "special",
      icon: "mdi-star",
      unique: true,
      value: 0.1,
    }, // Gallery effects
    currencyGalleryBeautyGain: { feature: "gallery", icon: "mdi-image-filter-vintage", value: 0.4 },
    currencyGalleryConverterGain: { feature: "gallery", unlock: "galleryConversion", icon: "mdi-recycle", value: 0.15 },
    currencyGalleryPackageGain: {
      feature: "gallery",
      unlock: "galleryDrums",
      icon: "mdi-package-variant",
      value: 0.15,
    },
    currencyGalleryCashGain: { feature: "gallery", type: "special", icon: "mdi-cash", unique: true, value: 0.1 },
  },
  "modules/treasure/upgradePremium": {
    moreSlots: {
      type: "premium",
      price(lvl) {
        return { gem_ruby: lvl * 10 + 50 };
      },
      effect: [{ name: "treasureSlots", type: "base", value: (lvl) => lvl }],
    },
    moreFragments: {
      type: "premium",
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 150 };
      },
      effect: [{ name: "currencyTreasureFragmentGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 }],
    },
  },
  "modules/treasure": {
    name: "treasure",
    unlockNeeded: "treasureFeature",
    unlock: ["treasureFeature", "treasureSpecialEffect", "treasureDual"],
    mult: { treasureSlots: { round: true, baseValue: 10 } },
    currency: { fragment: { color: "amber", icon: "mdi-shimmer", gainMult: {} } },
    upgrade: upgradePremium,
    rng: treasureRng,
    note: buildArray(3).map(() => "g"),
    init() {
      for (const [key, elem] of Object.entries(effect)) {
        store.commit("treasure/initEffect", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(treasureTypes)) {
        store.commit("treasure/initType", { name: key, ...elem });
      }
    },
    saveGame() {
      return {
        items: store.state.treasure.items.map((elem) => (elem ? filterItem(elem) : null)),
        newItem: store.state.treasure.newItem ? filterItem(store.state.treasure.newItem) : null,
      };
    },
    loadGame(data) {
      if (data.items) {
        store.commit("treasure/updateKey", {
          key: "items",
          value: data.items.map((elem) =>
            elem
              ? {
                  ...filterItem(elem),
                  valueCache: elem.effect
                    .map((el) => (store.state.treasure.effectToFeature[el] ? el : fallbackEffect))
                    .map((el, i) =>
                      store.getters["treasure/effectValue"](
                        store.state.treasure.effect[store.state.treasure.effectToFeature[el]][el].value *
                          store.state.treasure.type[elem.type].slots[i].power,
                        elem.tier,
                        elem.level,
                        elem.type,
                      ),
                    ),
                }
              : null,
          ),
        });
      }
      if (data.newItem) {
        store.commit("treasure/updateKey", {
          key: "newItem",
          value: {
            ...filterItem(data.newItem),
            valueCache: data.newItem.effect
              .map((el) => (store.state.treasure.effectToFeature[el] ? el : fallbackEffect))
              .map((el, i) =>
                store.getters["treasure/effectValue"](
                  store.state.treasure.effect[store.state.treasure.effectToFeature[el]][el].value *
                    store.state.treasure.type[data.ne   data.newItem.level,
                  data. }
      store.dispatch("treasure/updateEffectCache");
    },
  },
  "modules/village/achievement": {
    maxBuilding: {
      value: () => store.state.stat.village_maxBuilding.total,
      milestones: (lvl) => Math.round(lvl * 25 * Math.pow(1.2, lvl) + 35),
      relic: { 3: "mudBrick", 4: "keychain", 5: "goldenKey" },
    },
    basicResources: {
      value: () =>
        Math.max(
          store.state.stat.village_woodMax.total,
          store.state.stat.village_plantFiberMax.total,
          store.state.stat.village_stoneMax.total,
        ),
      milestones: (lvl) => Math.pow(10, lvl) * buildNum(10, "K"),
      relic: { 3: "sapling" },
    },
    metal: {
      value: () => store.state.stat.village_metalMax.total,
      milestones: (lvl) => Math.pow(10, lvl) * 5000,
      relic: { 3: "screwdriver" },
    },
    coin: {
      value: () => store.state.stat.village_coin.total,
      milestones: (lvl) => Math.pow(16, lvl) * 2000,
      relic: { 4: "treasureChest" },
    },
    water: {
      value: () => store.state.stat.village_waterMax.total,
      milestones: (lvl) => Math.pow(20, lvl) * 5000,
      relic: { 3: "rose" },
    },
    knowledge: {
      value: () => store.state.stat.village_knowledgeMax.total,
      milestones: (lvl) => Math.round(getSequence(2, lvl + 1) * Math.pow(1.2, Math.max(lvl - 10, 0)) * 250),
      relic: { 2: "globe" },
    },
    advancedResources: {
      value: () => Math.motal),
      milestones: (lvl) => Math.pow(6,  { value: () => store.state.stat.village_blessing.total, milestones: (lvl) => Math.pow(9, lvl) * 1000 },
    offering: {
      value: () => store.state.stat.village_offering.total,
      milestones: (lvl) => Math.round(Math.pow(2.5, lvl) * 500),
    },
    sacrifice: {
      value: () => store.getters["village/offeringCount"],
      milestones: (lvl) => getSequence(6, lvl + 1) * 5,
    },
    oil: {
      value: () => store.state.stat.village_oilMax.total,
      milestones: (lvl) => Math.pow(10, lvl) * buildNum(100, "K"),
    },
    highestPower: {
      value: () => store.state.stat.village_highestPower.total,
      milestones: (lvl) => getSequence(2, lvl + 1) * 10,
    },
    minHappiness: {
      value: () => store.state.stat.village_minHappiness.total,
      secret: true,
      display: "boolean",
      cap: 1,
      milestones: () => 1,
    },
  },
  "modules/village/building": {
    // Tier 0 buildings
    campfire: {
      cap: 1,
      persistent: true,
      icon: "mdi-campfire",
      note: "village_1",
      price() {
        return { village_wood: 5, village_stone: 5 };
      },
      timeNeeded() {
        return 5;
      },
      effect: [{ name: "viluildings
    hut: {
      cap: 25,
      capMu_2",
      requirement() {
        return store.state.unlock.villageBuildings1.use;
      },
      price(lvl) {
        return { village_plantFiber: Math.pow(1.35, lvl) * 15, village_wood: Math.pow(1.32, lvl) * 10 };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * 10);
      },
      effect: [{ name: "villageWorker", type: "base", value: (lvl) => lvl }],
    },
    farm: {
      cap: 10,
      capMult: true,
      persistent: true,
      subtype: "workstation",
      icon: "mdi-tractor",
      note: "village_3",
      requirement() {
        return store.state.unlock.villageBuildings1.use;
      },
      price(lvl) {
        return { village_wood: Math.pow(1.65, lvl) * 200, village_stone: Math.pow(1.65, lvl) * 400 };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * 40);
      },
      effect: [
        { name: "farmer", type: "villageJob", value: (lvl) => lvl },
        { name: "currencyVillagePlantFiberCap", type: "base", value: (lvl) => (lvl > 1 ? 250 * (lvl - 1) : null) },
      ],
    },
    plantation: {
      cap: 10,
      capMult: true,
      persistent: true,
      subtype: "workstation",
      icon: "mdi-forest",
      note: "village_4",
      requirement() {
        return store.state.unlock.villageBuildings1.use;
      },
      price(lvl) {
        return { village_plantFiber: Math.pow(1.65, lvl) * 750, village_stone: Math.pow(1.65, lvl) * 430 };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * 50);
      },
      effect: [
        { name: "harvester", type: "villageJob", value: (lvl) => lvl },
        { name: "currencyVillageWoodCap", type: "base", value: (lvl) => (lvl > 1 ? 250 * (lvl - 1) : null) },
      ],
    },
    mine: {
      cap: 10,
      capMult: true,
      persistent: true,
      subtype: "workstation",
      icon: "mdi-tunnel",
      note: "village_5",
      requirement() {
        return store.state.un_wood: Math.pow(1.65, lvl) * 1150 };
      },
  },
      effect: [
        { name: "miner", type: "villageJob", value: (lvl) => lvl },
        { name: "currencyVillageStoneCap", type: "base", value: (lvl) => (lvl > 1 ? 250 * (lvl - 1) : null) },
      ],
    },
    communityCenter: {
      cap: 1,
      prequirement() {
        return store.state.unl   },
      price() {
        return { village_wood: 1800, village_stone: 1650, village_metal: 100 };
      },
      effect: [{ name: "villageBuildings2", type: "unlock", value: (lvl) => lvl >= 1 }],
    }, // Tier 2 buildings
    smallHouse: {
      cap: 25,
      capMult: true,
      subtype: "housing",
      icon: "mdi-home-variant",
      note: "village_7",
      requirement() {
        return store.state.unlock.villageBuildings2.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(1.35, lvl) * 2750,
          village_metal: Math.pow(1.35, lvl) * 250,
          village_water: Math.pow(1.5, lvl) * 400,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * 210);
      },
      effect: [{ name: "villageWorker", type: "base", value: (lvl) => lvl }],
    },
    crane: {
      cap: 20,
      icon: "mdi-crane",
      note: "village_31",
      requirement() {
        return store.state.unlock.villageBuildings2.use;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.2, lvl) * 45);
      },
      price(lvl) {
        return { village_wood: Math.pow(1.5, lvl) * 580, village_metal: Math.pow(1.35, lvl) * 275 };
      },
      effect: [{ name: "queueSpeedVillageBuilding", type: "base", value: (lvl) => lvl }],
    },
    treasury: {
      cap: 10,
      hasDescription: true,
      capMult: true,
      icon: "mdi-treasure-chest",
      note: "village_9",
      requirement() {
        return store.state.unlock.villageBuildings2.use;
      },
      price(lvl) {
        let obj = { village_plantFiber: Math.pow(1.25, Math.max(0, lvl - 9)) * Math.pow(1.5, lvl) * 2600 };
        if (lvl <= 0) {
          obj.village_fruit = 325;
          obj.village_grain = 550;
        }
        return obj;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.4, lvl) * 240);
      },
      effect: [
        { name: "villageCoinUpgrades", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "villageTaxRate", type: "base", value: (lvl) => splicedLinear(0.025, 0.01, 10, lvl) },
      ],
    },
    storage: {
      cap: 20,
      capMult: true,
      icon: "mdi-database",
      note: "village_8",
      requirement() {
        return store.state.unlock.villageBuildings2.use;
      },
      price(lvl) {
        let obj = {
          village_plantFiber: Math.pow(lvl * 0.02 + 1.15, lvl) * 900,
          village_wood: Math.pow(lvl * 0.02 + 1.15, lvl) * 900,
          village_stone: Math.pow(lvl * 0.02 + 1.18, lvl) * 1400,
        };
        if (lvl <= 0) {
          obj.village_coin = 50;
        }
        return obj;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.15, lvl) * 225);
      },
      effect: [
        { name: "currencyVillageWoodCap", type: "mult", value: (lvl) => splicedPowLinear(1.2, 0.1, 20, lvl) },
        { name: "currencyVillagePlantFiberCap", type: "mult", value: (lvl) => splicedPowLinear(1.2, 0.1, 20, lvl) },
        { name: "currencyVillageStoneCap", type: "mult", value: (lvl) => splicedPowLinear(1.2, 0.1, 20, lvl) },
        {
          name: "currencyVillageMetalCap",
          t lvl - 5) : null),
        },
      ],
    },
   return store.state.unlock.villageBuildings2.use;
      },
      price(lvl) {
        return {
          village_stone: Math.pow(lvl * 0.02 + 1.25, lvl) * 2750,
          village_metal: Math.pow(lvl * 0.02 + 1.18, lvl) * 250,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * 180);
      },
      effect: [
        { name: "currencyVillageMetalGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageMetalCap", type: "base", value: (lvl) => lvl * 200 },
      ],
    },
    safe: {
      cap: 20,
      icon: "mdi-safe",
      note: "village_10",
      requirement() {
        return store.state.unlock.villageBuildings2.use;
      },
      price(lvl) {
        return {
          village_metal: Math.pow(lvl * 0.02 + 1.2, lvl) * 900,
          village_coin: Math.pow(lvl * 0.02 + 1.18, lvl) * 150,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * 270);
      },
      effect: [
        { name: "currencyVillageCoinCap", type: "base", value: (lvl) => lvl * 100 },
        { name: "currencyVillageCoinCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
      ],
    },
    well: {
      cap: 10,
      capMult: true,
      subtype: "workstation",
      icon: "mdi-water-well",
      note: "village_11",
      requirement() {
        return store.state.unlock.villageBuildings2.use;
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(1.65, lvl) * 6800,
          village_wood: Math.pow(1.65, lvl) * 4500,
          village_stone: Math.pow(1.65, lvl) * 5000,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * 300);
      },
      effect: [
        { name: "wellWorker", type: "villageJob", value: (lvl) => lvl },
        {
          name: "currencyVillageWaterCap",
          type: "base",
          value: (lvl) => (lvl > 1 ? 1000 * Math.min(lvl - 1, 9) : null),
        },
        {
          name: "currencyVillageWaterCap",
          type: "mult",
          value: (lvl) => (lvl > 1 ? Math.pow(1.5, Math.min(lvl - 1, 9)) : null),
        },
      ],
    },
    garden: {
      cap: 20,
      icon: "mdi-flower",
      note: "village_12",
      requirement() {
        return store.state.unlock.villageBuildings2.use;
      },
      price(lvl) {
        return { village_plantFiber: Math.pow(1.25, lvl) * 8750, village_water: Math.pow(1.33, lvl) * 500 };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * 480);
      },
      effect: [
        { name: "currencyVillagePlantFiberCap", type: "mult", value: (lvl) => lvl * 0.15 + 1 },
        { name: "currencyVillageCoinCap", type: "base", value: (lvl) => lvl * 50 },
      ],
    },
    townHall: {
      cap: 1,
      persistent: true,
      icon: "mdi-town-hall",
      note: "village_13",
      requirement() {
        return store.state.unlock.villageBuildings2.use;
      },
      timeNeeded() {
        return buildNum(14.4, "K");
      },
      price() {
        return {
 .5, "K"),
          village_metal: 3150,
     ldings3", type: "unlock", value: (lvl) => lvl >= 1 }],
    }, // Tier 3 buildings
    house: {
      cap: 25,
      capMult: true,
      subtype: "housing",
      icon: "mdi-home",
      note: "village_14",
      requirement() {
        return store.state.unlock.villageBuildings3.use;
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(1.35, lvl) * buildNum(17.8, "K"),
          village_wood: Math.pow(1.35, lvl) * buildNum(16, "K"),
          village_metal: Math.pow(1.35, lvl) * 2600,
          village_knowledge: lvl * 5 + 75,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * 900);
      },
      effect: [{ name: "villageWorker", type: "base", value: (lvl) => lvl }],
    },
    shed: {
      icon: "mdi-home-analytics",
      cap: 5,
      capMult: true,
      requirement() {
        return store.state.unlock.villageBuildings3.use;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.75, lvl) * 1600);
      },
      price(lvl) {
        return {
          village_w(2.05, lvl) * 9000,
          village_metal: currencyVillageWaterCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "villageUpgradeScythe", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "villageUpgradeHatchet", type: "unlock", value: (lvl) => lvl >= 2 },
        { name: "villageUpgradePickaxe", type: "unlock", value: (lvl) => lvl >= 3 },
        { name: "villageUpgradeWateringCan", type: "unlock", value: (lvl) => lvl >= 4 },
        { name: "villageUpgradeInvestment", type: "unlock", value: (lvl) => lvl >= 5 },
      ],
    },
    tunnel: {
      icon: "mdi-tunnel",
      cap: 15,
      requirement() {
        return store.state.unlock.villageBuildings3.use;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * 1350);
      },
      price(lvl) {
        return { village_plantFiber: Math.pow(1.35, lvl) * buildNum(12, "K"), village_water: Math.pow(1.5, lvl) * 850 };
      },
      effect: [
        { name: "currencyVillageStoneGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageStoneCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
      ],
    },
    sawmill: {
      icon: "mdi-saw-blade",
      cap: 15,
      requirement() {
        return store.state.unlock.villageBuildings3.use;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * 1500);
      },
      price(lvl) {
        return { village_metal: Math.pow(1.3, lvl) * 3200, village_water: Math.pow(1.5, lvl) * 1150 };
      },
      effect: [
        { name: "currencyVillageWoodGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageWoodCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
      ],
    },
    library: {
      cap: 10,
      capMult: true,
      subtype: "workstation",
      icon: "mdi-book",
      note: "village_15",
      requirement() {
        return store.state.unlock.villageBuildings3.use;
      },
      price(lvl) {
        return { village_wood: Math.pow(1.65, lvl) * buildNum(15, "K"), village_water: Math.pow(1.85, lvl) * 6100 };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * 2100);
      },
      effect: [
        { name: "librarian", type: "villageJob", value: (lvl) => lvl },
        { name: "currencyVillageKnowledgeCap", type: "base", value: (lvl) => (lvl > 1 ? 5 * (lvl - 1) : null) },
      ],
    },
    aquarium: {
      icon: "mdi-fishbowl",
      cap: 20,
      note: "village_16",
      requirement() {
        return store.state.unlock.villageBuildings3.use;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * 2400);
      },
      price(lvl) {
        return { village_water: Math.pow(1.5, lvl) * 4400, village_knowledge: lvl * 10 + 35 };
      },
      effect: [
        { name: "currencyVillageMetalCap", type: "mult", value: (lvl) => lvl * 0.15 + 1 },
        { name: "currencyVillageCoinCap", type: "mult", value: (lvl) => lvl * 0.15 + 1 },
      ],
    },
    glassBlowery: {
      cap: 10,
      capMult: true,
      subtype: "workstation",
      icon: "mdi-glass-wine",
      note: "village_17",
      requirement() {
        return store.state.unlock.villageBuildings3.use;
      },
      price(lvl) {
        return {
          village_metal: Math.pow(1.65, lvl) * buildNum(12, "K"),
          village_water: Math.pow(1.85, lvl) * buildNum(24, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * 3000);
      },
      effect: [
        { name: "glassblower", type: "villageJob", value: (lvl) => lvl },
        { name: "currencyVillageGlassCap", type: "base", value: (lvl) => (lvl > 1 ? 250 * (lvl - 1) : null) },
      ],
    },
    knowledgeTower: {
      cap: 50,
      icon: "mdi-wizard-hat",
      note: "village_19",
      requirement() {
        return store.state.unlock.villageBuildings3.use;
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(1.5, lvl) * buildNum(44, "K"),
          village_stone: Math.pow(1.5, lvl) * buildNum(35, "K"),
          village_glass: Math.pow(1.5, lvl) * 450,
          village_knowledge: Math.ceil(lvl *    return Math.ceil(Math.pow(1.24, lvl) * 330ase", value: (lvl) => lvl * 250 },
        { name: "currencyVillageWaterCap", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageKnowledgeCap", type: "base", value: (lvl) => lvl * 3 },
      ],
    },
    miniatureSmith: {
      cap: 25,
      capMult: true,
      subtype: "housing",
      icon: "mdi-fireplace",
      requirement() {
        return store.state.unlock.villageBuildings3.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(1.65, lvl) * buildNum(60, "K"),
          village_stone: Math.pow(1.65, lvl) * buildNum(35, "K"),
          village_glass: Math.pow(1.4, lvl) * 600,
        };
      },
      timeNeeded(lt: [
        { name: "currencyVillageMetalGain", type: "base", value: (lvl) => (lvl > 4 ? Math.floor(lvl / 5) : null) },
      ],
    },
    church: {
      cap: 25,
      hasDescription: true,
      icon: "mdi-church",
      note: "village_18",
      requirement() {
        return store.state.unlock.villageBuildings3.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(1.65, lvl) * buildNum(65, "K"),
          village_stone: Math.pow(1.65, lvl) * buildNum(85, "K"),
          village_glass: Math.pow(1.5, lvl) * 1700,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * 4800);
      },
      effect: [{ name: "currencyVillageFaithGain", type: "base", value: (lvl) => getSequence(1, lvl) * 0.02 }],
    },
    school: {
      icon: "mdi-school",
      cap: return store.state.unlock.villageBuildings3.usth.pow(2.25, lvl) * buildNum(400, "K"),
          village_metal: Math.pow(2.25, lvl) * buildNum(45, "K"),
          village_glass: Math.pow(2.1, lvl) * 4800,
          village_coin: Math.pow(1.85, lvl) * buildNum(70, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.6, lvl) * 3600);
      },
      effect: [
        { name: "currencyVillageKnowledgeCap", type: "banlock", value: (lvl) => lvl >= 1 },
        {       { name: "villageUpgradePump", type: "unlock", value: (lvl) => lvl >= 3 },
        { name: "villageUpgradeSand", type: "unlock", value: (lvl) => lvl >= 4 },
        { name: "villageUpgradeBook",: {
      cap: 1,
      note: "village_21"        return store.state.unlock.villageBuildings3.use;
      },
      timeNeeded() {
        return buildNum(240, "K");
      },
      price() {
        return {
          village_plantFiber: buildNum(1.02, "M"),
          village_wood: buildNum(975, "K"),
          village_glass: buildNum(16, "K"),
          village_coin: buildNum(280, "K"),
        };
      },
      effect: [{ name: "villageBuildings4", type: "unlock", value: (lvl) => lvl >= 1 }],
    }, // Tier 4 buildings
    apartment: {
      cap: 25,
      capMult: true,
      subtype: "housing",
      icon: "mdi-home-city",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(1.65, lvl) * buildNum(20, "M"),
          village_glass: Math.pow(1.65, lvl) * buildNum(29.5, "K"),
          village_hardwood: Math.pow(1.3, lvl) * 1500,
          village_gem: Math.pow(1.35, lvl) * 600,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * 7200);
      },
      effect: [{ name: "villageWorker", type: "base", value: (lvl) => lvl * 2 }],
    },
    temple: {
      cap: 30,
      icon: "mdi-temple-hindu",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      price(lvl) {
        return {
          village_glass: Math.pow(1.25, lvl) * 8000,
          village_water: Math.pow(1.5, lvl) * buildNum(2, "M"),
          village_coin: Math.pow(1.45, lvl) * buildNum(100, "K"),
          village_knowledge: 15 * lvl + 125,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(62.5, "K"));
      },
      effect: [{ name: "currencyVillageFaithCap", type: "mult", value: (lvl) => Math.pow(1.2, lvltower-fire",
      requirement() {
        return ston { village_coin: Math.pow(4.5, lvl) * buildNum(50, "K") };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.45, lvl) * buildNum(50, "K"));
      },
      effect: [
        { name: "currencyVillageCoinCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "villageMaterialCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
      ],
    },
    offeringPedestal: {
      cap: 4,
      hasDescription: true,
      note: "village_23",
      icon: "mdi-table-furniture",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(3, lvl) * buildNum(32.5, "K"));
      },
      price(lvl) {
        return [
          { village_plantFiber: buildNum(2, "M"), village_wood: buildNum(2, "M"), village_stone: buildNum(2, "M") },
          { village_coin: buildNum(10, "M"), village_metal: buildNum(3, "M"), village_water: buildNum(5, "M") },
          { village_glass: buildNum(120, "K"), village_hardwood: buildNum(40, "K"), village_gem: buildNum(40, "K") },
          { village_knowledge: 600, village_science: 200, village_joy: 750 },
        ][lvl];
      },
      effect: [
        { name: "villageOffering1", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "villageOffering2", type: "unlock", value: (lvl) => lvl >= 2 },
        { name: "villageOffering3", type: "unlock", value: (lvl) => lvl >= 3 },
        { name: "villageOffering4", type: "unlock", value: (lvl) => lvl >= 4 },
      ],
    },
    theater: {
      cap: 5,
      capMult: true,
      note: "village_24",
      subtype: "workstation",
      icon: "mdi-drama-masks",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      price(lvl) {
        let obj = {
          village_stone: Math.pow(2.15, lvl) * buildNum(3, "M"),
          village_glass: Math.pow(1.8, lvl) * buildNum(14.8, "K"),
        };
        if (lvl >= 1) {
          obj.village_hardwood = Math.pow(1.75, lvl - 1) * 2000;
        }
        if (lvl >= 2) {
          obj.village_gem = Math.pow(1.75, lvl - 2) * 2750;
        }
        return obj;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * buildNum(60, "K"));
      },
      effect: [{ name: "entertainer", type: "villageJob", value: (lvl) => lvl }],
    },
    lumberjackHut: {
      cap: 10,
      capMult: true,
      note: "village_25",
      subtype: "workstation",
      icon: "mdi-axe",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(1.85, lvl) * buildNum(7.7, "M"),
          village_metal: Math.pow(1.85, lvl) * buildNum(1.35, "M"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(10, "K"));
      },
      effect: [
        { name: "lumberjack", type: "villageJob", value: (lvl) => lvl },
        { name: "currencyVillageHardwoodCap", type: "base", value: (lvl) => (lvl > 1 ? 200 * (lvl - 1) : null) },
      ],
    },
    deepMine: {
      cap: 10,
      capMult: true,
      note: "village_26",
      subtype: "workstation",
      icon: "mdi-tunnel",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(1.85, lvl) * buildNum(13, "M"),
          village_knowledge: lvl * 10 + 165,
          village_hardwood: Math.pow(1.65, lvl) * 500,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * buildNum(12, "K"));
      },
      effect: [
        { name: "blastMiner", type: "villageJob", value: (lvl) => lvl },
        { name: "currencyVillageGemCap", type: "base", value: (lvl) => (lvl > 1 ? 200 * (lvl - 1) : null) },
      ],
    },
    bigStorage: {
      cap: 20,
      capMult: true,
      icon: "mdi-database-settings",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      price(lvl) {
        return {
          village_hardwood: Math.pow(lvl * 0.03 + 1.25, lvl) * 900,
          village_gem: Math.pow(lvl * 0.03 + 1.25, lvl) * 900,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.15, lvl) * buildNum(15, "K"));
      },
      effect: [
        { name: "currencyVillageWaterCap", type: "mult", value: (lvl) => splicedPowLinear(1.25, 0.2, 20, lvl) },
        { name: "currencyVillageHardwoodCap", type: "mult", value: (lvl) => splicedPowLinear(1.2, 0.1, 20, lvl) },
        { name: "currencyVillageGemCap", type: "mult", value: (lvl) => splicedPowLinear(1.2, 0.1, 20, lvl) },
      ],
    },
    luxuryHouse: {
      cap: 25,
      capMult: true,
      note: "village_27",
      subtype: "housing",
      icon: "mdi-bank",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      price(lvl) {
        return {
          village_metal: Math.pow(1.65, lvl) * buildNum(7, "M"),
          village_hardwood: Math.pow(1.35, lvl) * 4000,
          village_gem: Math.pow(1.3, lvl) * 9200,
          village_coin: Math.pow(2.15, lvl) * buildNum(25, "M"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * buildNum(18, "K"));
      },
      effect: [
        { name: "villageWorker", type: "base", value: (lvl) => lvl },
        { name: "villageHappiness", type: "base", value: (lvl) => lvl * 0.002 },
      ],
    },
    lake: {
      cap: 10,
      capMult: true,
      note: "village_28",
      subtype: "workstation",
      icon: "mdi-waves",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      price(lvl) {
        return {
          village_water: Math.pow(2.25, lvl) * buildNum(50, "M"),
          village_glass: Math.pow(1.65, lvl) * buildNum(60, "K"),
          village_gem: Math.pow(1.65, lvl) * buildNum(11, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * buildNum(20, "K"));
      },
      effect: [{ name: "fisherman", type: "villageJob", value: (lvl) => lvl }],
    },
    gemSawBlade: {
      icon: "mdi-saw-blade",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.15, lvl) * buildNum(30, "K"));
      },
      price(lvl) {
        return {
          village_stone: Math.pow(1.85, lvl) * buildNum(75, "M"),
          village_gem: Math.ceil(Math.pow(1.5, lvl) * buildNum(15, "K")),
        };
      },
      effect: [{ name: "queueSpeedVillageBuilding", type: "mult", value: (lvl) => Math.pow(1.2, lvl) }],
    },
    miniatureGlassblowery: {
      cap: 25,
      capMult: true,
      subtype: "housing",
      icon: "mdi-glass-tulip",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(1.5, lvl) * buildNum(125, "M"),
          village_water: Math.pow(1.85, lvl) * buildNum(120, "M"),
          village_hardwood: Math.pow(1.3, lvl) * buildNum(12.5, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * buildNum(14, "K"));
      },
      effect: [
        { name: "currencyVillageGlassGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "villageWorker", type: "base", value: (lvl) => (lvl > 4 ? Math.floor(lvl / 5) : null) },
      ],
    },
    lostPages: {
      icon: "mdi-script-text",
      cap: 10,
      note: "village_29",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.5, lvl) * buildNum(80, "K"));
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(1.85, lvl) * buildNum(185, "M"),
          village_wood: Math.pow(1.85, lvl) * buildNum(140, "M"),
          village_knowledge: lvl * 15 + 220,
          village_hardwood: Math.pow(1.65, lvl) * buildNum(22, "K"),
        };
      },
      effect: [
        { name: "currencyVillageKnowledgeCap", type: "base", value: (lvl) => lvl * 8 },
        { name: "currencyVillageFaithCap", type: "base", value: (lvl) => lvl * 20 },
        { name: "villageUpgradeAxe", type: "unlock", value: (lvl) => lvl >= 2 },
        { name: "villageUpgradeBomb", type: "unlock", value: (lvl) => lvl >= 4 },
        { name: "villageUpgradeToll", type: "unlock", value: (lvl) => lvl >= 6 },
        { name: "villageUpgradeFishingRod", type: "unlock", value: (lvl) => lvl >= 8 },
        { name: "villageUpgradeHolyBook", type: "unlock", value: (lvl) => lvl >= 10 },
      ],
    },
    playground: {
      cap: 5,
      note: "village_30",
      icon: "mdi-slide",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.15, lvl) * buildNum(140, "K"));
      },
      price(lvl) {
        return {
          village_water: Math.pow(4, lvl) * buildNum(250, "M"),
          village_coin: Math.pow(3, lvl) * buildNum(50, "M"),
        };
      },
      effect: [{ name: "villageHappiness", type: "base", value: (lvl) => lvl * 0.01 }],
    },
    government: {
      cap: 1,
      persistent: true,
      icon: "mdi-city",
      requirement() {
        return store.state.unlock.villageBuildings4.use;
      },
      timeNeeded() {
        return buildNum(1.5, "M");
      },
      price() {
        return {
          village_hardwood: buildNum(50, "K"),
          village_gem: buildNum(50, "K"),
          village_coin: buildNum(150, "M"),
          village_knowledge: 260,
        };
      },
      effect: [{ name: "villageBuildings5", type: "unlock", value: (lvl) => lvl >= 1 }],
    }, // Tier 5 buildings
    modernHouse: {
      cap: 25,
      capMult: true,
      subtype: "housing",
      icon: "mdi-home-modern",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(1.65, lvl) * buildNum(330, "M"),
          village_glass: Math.pow(1.65, lvl) * buildNum(240, "K"),
          village_hardwood: Math.pow(1.3, lvl) * buildNum(77.5, "K"),
          village_gem: Math.pow(1.35, lvl) * buildNum(18, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * buildNum(200, "K"));
      },
      effect: [{ name: "villageWorker", type: "base", value: (lvl) => lvl * 3 }],
    },
    fountain: {
      cap: 10,
      icon: "mdi-fountain",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(275, "K"));
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(1.65, lvl) * buildNum(1.7, "B"),
          village_stone: Math.pow(1.65, lvl) * buildNum(1.35, "B"),
          village_metal: Math.pow(1.65, lvl) * buildNum(290, "M"),
          village_coin: Math.pow(1.85, lvl) * buildNum(650, "M"),
        };
      },
      effect: [
        { name: "currencyVillageWaterGain", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
        { name: "currencyVillageWaterCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    laboratory: {
      cap: 10,
      capMult: true,
      subtype: "workstation",
      icon: "mdi-flask",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return {
          village_metal: Math.pow(1.85, lvl) * buildNum(70, "M"),
          village_glass: Math.pow(1.85, lvl) * buildNum(475, "K"),
          village_gem: Math.pow(1.85, lvl) * buildNum(140, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * buildNum(300, "K"));
      },
      effect: [
        { name: "scientist", type: "villageJob", value: (lvl) => lvl },
        { name: "currencyVillageScienceCap", type: "base", value: (lvl) => (lvl > 2 ? (lvl - 2) * 5 : null) },
        { name: "villageUpgradeBreakthrough", type: "unlock", value: (lvl) => lvl >= 2 },
      ],
    },
    court: {
      cap: 2,
      hasDescription: true,
      icon: "mdi-gavel",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return {
          village_hardwood: Math.pow(1.85, lvl) * buildNum(280, "K"),
          village_knowledge: Math.round(Math.pow(1.15, lvl) * 290),
          village_science: lvl * 20 + 30,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.5, lvl) * buildNum(480, "K"));
      },
      effect: [
        { name: "villagePolicyTaxes", type: "base", value: (lvl) => (lvl >= 1 ? 1 : null) },
        { name: "villagePolicyImmigration", type: "base", value: (lvl) => (lvl >= 2 ? 1 : null) },
      ],
    },
    greenhouse: {
      cap: 10,
      capMult: true,
      subtype: "workstation",
      icon: "mdi-greenhouse",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(1.85, lvl) * buildNum(1.15, "B"),
          village_glass: Math.pow(1.85, lvl) * buildNum(900, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * buildNum(550, "K"));
      },
      effect: [{ name: "gardener", type: "villageJob", value: (lvl) => lvl }],
    },
    fullBasket: {
      cap: 8,
      icon: "mdi-basket",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(2.4, lvl) * buildNum(2.4, "B"),
          village_joy: Math.ceil(Math.pow(1.35, lvl) * 70),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.75, lvl) * buildNum(1.5, "M"));
      },
      effect: [
        { name: "villageFoodGain", type: "mult", value: (lvl) => Math.pow(1.2, lvl) * (lvl * 0.25 + 1) },
        { name: "currencyVillageFaithCap", type: "base", value: (lvl) => lvl * 32 },
      ],
    },
    storageHall: {
      cap: 20,
      icon: "mdi-warehouse",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(1.85, lvl) * buildNum(4.5, "B"),
          village_metal: Math.pow(1.65, lvl) * buildNum(360, "M"),
          village_hardwood: Math.pow(1.5, lvl) * buildNum(575, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(700, "K"));
      },
      effect: [
        { name: "currencyVillageWoodCap", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
        { name: "currencyVillagePlantFiberCap", type: "mult", vtype: "mult", value: (lvl) => Math.pow(1.5, lvl) },
 8 },
      ],
    },
    bioLab: {
      cap: 5,
      icon: "mdi-dna",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return {
          village_metal: Math.pow(2.3, lvl) * buildNum(580, "M"),
          village_gem: Math.pow(1.85, lvl) * buildNum(695, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.75, lvl) * buildNum(1, "M"));
      },
      effect: [
        { name: "currencyVillageGlassCap", type: "mult", value: (lvl) => Math.pow(1.5, lvl) },
        { name: "villageUpgradeModifiedPlants", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "villageUpgradeDopamine", type: "unlock", value: (lvl) => lvl >= 3 },
        { name: "villageUpgradeAdrenaline", type: "unlock", value: (lvl) => lvl >= 5 },
      ],
    },
    taxOffice: {
      cap: 3,
      icon: "mdi-office-building",
      requirement() {
        return store.state.unlock.villageBuildings5.use && store.state.upgrade.item.village_court.level >= 1;
      },
      price(lvl) {
        return {
          village_stone: Math.pow(6, lvl) * buildNum(10.5, "B"),
          village_water: Math.pow(15, lvl) * buildNum(75, "B"),
          village_knowledge: lvl * 75 + 350,
          village_coin: Math.pow(3.5, lvl) * buildNum(6, "B"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(2.5, lvl) * buildNum(1.2, "M"));
      },
      effect: [{ name: "villagePolicyTaxes", type: "base", value: (lvl) => lvl }],
    },
    festival: {
      icon: "mdi-party-popper",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return { village_joy: Math.ceil(Math.pow(1.15, lvl) * 100) };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.35, lvl) * buildNum(750, "K"));
      },
      effect: [
        { name: "villageHappiness", type: "base", value: (lvl) => lvl * 0.003 },
        { name: "villageTaxRate", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    cemetery: {
      cap: 10,
      icon: "mdi-grave-stone",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(lvl * 0.1 + 1.85, lvl) * buildNum(20, "B"),
          village_stone: Math.pow(lvl * 0.1 + 1.85, lvl) * buildNum(27.5, "B"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(1.5, "M"));
      },
      effect: [
        { name: "villageOfferingPower", type: "mult", value: (lvl) => lvl * 0.5 + 1 },
        { name: "currencyVillageFaithCap", type: "base", value: (lvl) => lvl * 32 },
      ],
    },
    mosque: {
      cap: 25,
      icon: "mdi-mosque",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return {
          village_stone: Math.pow(2.12, lvl) * buildNum(155, "B"),
          village_glass: Math.pow(1.9, lvl) * buildNum(40, "M"),
          village_gem: Math.pow(1.55, lvl) * buildNum(17, "M"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(3.2, "M"));
      },
      effect: [{ name: "currencyVillageFaithGain", type: "base", value: (lvl) => getSequence(2, lvl) }],
    },
    waterTower: {
      cap: 12,
      icon: "mdi-tower-beach",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return { village_plantFiber: Math.pow(2.45, lvl) * buildNum(260, "B"), village_knowledge: lvl * 125 + 700 };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.65, lvl) * buildNum(8, "M"));
      },
      effect: [
        { name: "currencyVillageWaterGain", type: "mult", value: (lvl) => Math.pow(1.2, lvl) * (lvl * 0.5 + 1) },
      ],
    },
    outdoorPump: {
      cap: 5,
      icon: "mdi-water-pump",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return { village_water: Math.pow(3.3, lvl) * buildNum(1.6, "T"), village_joy: lvl * 180 + 720 };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.65, lvl) * buildNum(18.5, "M"));
      },
      effect: [{ name: "currencyVillagePlantFiberGain", type: "mult", value: (lvl) => lvl * 0.4 + 1 }],
    },
    bankVault: {
      cap: 12,
      icon: "mdi-safe-square",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      price(lvl) {
        return { village_metal: Math.pow(1.85, lvl) * buildNum(7.35, "B"), village_science: lvl * 45 + 270 };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.65, lvl) * buildNum(40, "M"));
      },
      effect: [{ name: "currencyVillageCoinCap", type: "mult", value: (lvl) => Math.pow(1.6, lvl) }],
    },
    steamEngine: {
      cap: 1,
      persistent: true,
      icon: "mdi-turbine",
      requirement() {
        return store.state.unlock.villageBuildings5.use;
      },
      timeNeeded() {
        return buildNum(600, "M");
      },
      price() {
        return {
          village_metal: buildNum(27.6, "B"),
          village_water: buildNum(45, "T"),
          village_hardwood: buildNum(175, "M"),
          village_coin: buildNum(3.5, "T"),
          village_science: 440,
          village_joy: 1500,
        };
      },
      effect: [{ name: "villageBuildings6", type: "unlock", value: (lvl) => lvl >= 1 }],
    }, // Tier 6 buildings
    mansion: {
      cap: 25,
      capMult: true,
      subtype: "housing",
      icon: "mdi-balcony",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return {
      ge_marble: Math.pow(1.35, lvl) * 600,
        };
 uildNum(140, "M"));
      },
      effect: [{ name: "villageWorker", type: "base", value: (lvl) => lvl * 4 }],
    },
    oilRig: {
      cap: 10,
      capMult: true,
      subtype: "workstation",
      icon: "mdi-tower-fire",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return {
          village_stone: Math.pow(2.35, lvl) * buildNum(1.32, "T"),
          village_water: Math.pow(4.1, lvl) * buildNum(90, "T"),
          village_knowledge: lvl * 500 + 1500,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * buildNum(320, "M"));
      },
      effect: [
        { name: "oilWorker", type: "villageJob", value: (lvl) => lvl },
        { name: "currencyVillageOilCap", type: "base", value: (lvl) => (lvl > 1 ? (lvl - 1) * 400 : null) },
      ],
    },
    generator: {
      hasDescription: true,
      icon: "mdi-engine",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(1.45, lvl) * buildNum(1.93, "T"),
          village_metal: Math.pow(1.2, lvl) * buildNum(84, "B"),
          village_oil: Math.pow(1.25, lvl) * 1400,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.2, lvl) * buildNum(550, "M"));
      },
      effect: [
        { name: "villagePower", type: "base", value: (lvl) => lvl * 3 },
        { name: "villagePollution", type: "base", value: (lvl) => lvl * 2 },
      ],
    },
    lighthouse: {
      cap: 25,
      icon: "mdi-lighthouse",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(lvl * 0.06 + 1.6, lvl) * buildNum(3.68, "T"),
          village_gem: Math.pow(lvl * 0.04 + 1.4, lvl) * buildNum(480, "M"),
          village_oil: Math.pow(lvl * 0.05 + 1.5, lvl) * 2800,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(650, "M"));
      },
      effect: [{ name: "currencyVillageFaithGain", type: "mult", value: (lvl) => Math.pow(1.225, lvl) }],
    },
    lobby: {
      icon: "mdi-account-group",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return { village_coin: Math.pow(lvl * 0.05 + 1.35, lvl) * buildNum(13.5, "T") };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(750, "M"));
      },
      effect: [{ name: "villagePollutionTolerance", type: "base", value: (lvl) => lvl }],
    },
    oilStorage: {
      cap: 20,
      icon: "mdi-barrel",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return {
          village_hardwood: Math.pow(1.55, lvl) * buildNum(1.05, "B"),
          village_glass: Math.pow(1.6, lvl) * buildNum(2.25, "B"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(1.1, "B"));
      },
      effect: [
        { name: "currencyVillageMetalGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "currencyVillageMetalCap", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
        { name: "currencyVillageOilCap", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
      ],
    },
    artGallery: {
      cap: 10,
      capMult: true,
      subtype: "workstation",
      icon: "mdi-palette-advanced",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return {
          village_plantFiber: Math.pow(2.9, lvl) * buildNum(198, "T"),
          village_oil: Math.pow(2.2, lvl) * buildNum(264, "K"),
          village_joy: lvl * 400 + 2200,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.33, lvl) * buildNum(1.6, "B"));
      },
      effect: [
        { name: "sculptor", type: "villageJob", value: (lvl) => lvl },
        { name: "currencyVillageMarbleCap", type: "base", value: (lvl) => (lvl > 1 ? (lvl - 1) * 100 : null) },
      ],
    },
    excavator: {
      icon: "mdi-excavator",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return {
          village_hardwood: Math.pow(1.35, lvl) * buildNum(5.28, "B"),
          village_oil: Math.pow(1.6, lvl) * buildNum(360, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(2.2, "B"));
      },
      effect: [
        { name: "currencyVillageWoodGain", type: "mult", value: (lvl) => Math.pow(1.25, lvl) * (0.25 * lvl + 1) },
        { name: "currencyVillagePlantFiberGain", type: "mult", value: (lvl) => Math.pow(1.25, lvl) * (0.25 * lvl + 1) },
        { name: "currencyVillageStoneGain", type: "mult", value: (lvl) => Math.pow(1.25, lvl) * (0.25 * lvl + 1) },
        { name: "villagePollution", type: "base", value: (lvl) => lvl },
      ],
    },
    oilTruck: {
      icon: "mdi-tanker-truck",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return { village_gem: Math.pow(1.45, lvl) * buildNum(7.8, "B") };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(3, "B"));
      },
      effect: [
        { name: "currencyVillageOilCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
        { name: "villagePollution", type: "base", value: (lvl) => lvl },
      ],
    },
    oldLibrary: {
      icon: "mdi-book-clock",
      cap: 2,
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(7.1, lvl) * buildNum(1.68, "Qa"),
          village_marble: Math.pow(4.5, lvl) * 7500,
          village_knowledge: lvl * 600 + 2800,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(10, lvl) * buildNum(4, "B"));
      },
      effect: [
        { name: "currencyVillageScienceCap", type: "base", value: (lvl) => lvl * 20 },
        { name: "villageUpgradeSprinkler", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "villageUpgradeGreed", type: "unlock", value: (lvl) => lvl >= 2 },
      ],
    },
    immigrationOffice: {
      cap: 3,
      icon: "mdi-office-building",
      requirement() {
        return store.state.unlock.villageBuildings6.use && store.state.upgrade.item.village_court.level >= 2;
      },
      price(lvl) {
        return {
          village_knowledge: lvl * 2000 + 4500,
          village_science: lvl * 750 + 1500,
          village_coin: Math.pow(10, lvl) * buildNum(1.5, "Qa"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(8, lvl) * buildNum(5, "B"));
      },
      effect: [{ name: "villagePolicyImmigration", type: "base", value: (lvl) => lvl }],
    },
    marbleStatue: {
      cap: 10,
      icon: "mdi-human-female-dance",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        return { village_marble: Math.pow(1.65, lvl) * 2250 };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.75, lvl) * buildNum(120, "B"));
      },
      effect: [
        { name: "villageHappiness", type: "base", value: (lvl) => lvl * 0.004 },
        { name: "currencyVillageMarbleCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "currencyVillageKnowledgeCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    darkCult: {
      cap: 4,
      hasDescription: true,
      icon: "mdi-pentagram",
      requirement() {
        return store.state.unlock.villageBuildings6.use && store.state.upgrade.item.village_court.level >= 2;
      },
      price(lvl) {
        return {
          village_gem: Math.pow(6.25, lvl) * buildNum(82, "B"),
          village_oil: Math.pow(5.5, lvl) * buildNum(55, "M"),
          village_marble: Math.pow(2.5, lvl) * buildNum(50, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(6, lvl) * buildNum(11, "B"));
      },
      effect: [{ name: "villagePolicyReligion", type: "base", value: (lvl) => lvl }],
    },
    slaughterhouse: {
      icon: "mdi-cow",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      price(lvl) {
        ret         village_wood: Math.pow(1.5, lvl) * b0, "B"),
          village_water: Math.pow(1.9, lvl) * buildNum(9.5, "Qi"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * buildNum(16, "B"));
      },
      effect: [
        { name: "currencyVillageMeatGain", type: "base", value: (lvl) => getSequence(4, lvl) * 100 },
        { name: "villagePollution", type: "base", value: (lvl) => lvl },
      ],
    },
    ecoCouncil: {
      cap: 1,
      persistent: true,
      icon: "mdi-earth",
      requirement() {
        return store.state.unlock.villageBuildings6.use;
      },
      timeNeeded() {
        return buildNum(250, "B");
      },
      price() {
        return {
          village_oil: buildNum(96, "M"),
          village_marble: buildNum(500, "K"),
          village_coin: buildNum(14, "Qa"),
          village_science: 2000,
          village_joy: 6000,
        };
      },
      effect: [{ name: "villageBuildings7", type: "unlock", value: (lvl) => lvl >= 1 }],
    }, // Tier 7 buildings
    treehouse: {
      cap: 25,
      capMult: true,
      subtype: "housing",
      icon: "mdi-tree-outline",
      requirement() {
        return store.state.unlock.villageBuildings7.use;
      },
      price(lvl) {
        return {
          village_hardwood: Math.pow(1.45, lvl) * buildNum(162.5, "B"),
          village_loot0: Math.ceil(Math.pow(1.2, lvl) * 5),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * buildNum(45, "B"));
      },
      effect: [{ name: "villageWorker", type: "base", value: (lvl) => lvl * 6 }],
    },
    rainforest: {
      icon: "mdi-forest",
      requirement() {
        return store.state.unlock.villageBuildings7.use;
      },
      price(lvl) {
        return {
          village_hardwood: Math.pow(1.35, lvl) * buildNum(185, "B"),
          village_water: Math.pow(1.9, lvl) * buildNum(12.5, "Qi"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * buildNum(250, "B"));
      },
      effect: [{ name: "villagePollution", type: "base", value: (lvl) => lvl * -1 }],
    },
    luxuryStorage: {
      cap: 20,
      icon: "mdi-warehouse",
      requirement() {
        return store.state.unlock.villageBuildings7.use;
      },
      price(lvl) {
        return {
          village_wood: Math.pow(1.85, lvl) * buildNum(121, "Qa"),
          village_stone: Math.pow(1.85, lvl) * buildNum(143, "Qa"),
          village_oil: Math.pow(1.6, lvl) * buildNum(234, "M"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.3, lvl) * buildNum(60, "B"));
      },
      effect: [
        { name: "currencyVillageMetalCap", type: "mult", value: (lvl) => Math.pow(1.3, lvl) },
        { name: "currencyVillageGlassCap", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
        { name: "currencyVillageHardwoodCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyVillageGemCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
        { name: "currencyVillageMarbleCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    pyramid: {
      cap: 10,
      hasDescription: true,
      capMult: true,
      subtype: "workstation",
      icon: "mdi-pyramid",
      requirement() {
        return store.state.unlock.villageBuildings7.use;
      },
      price(lvl) {
        return {
          village_stone: Math.pow(3.75, lvl) * buildNum(375, "Qa"),
          village_marble: Math.pow(2.45, lvl) * buildNum(2.85, "M"),
          village_joy: lvl * 4000 + buildNum(15.5, "K"),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.45, lvl) * buildNum(100, "B"));
      },
      effect: [
        { name: "explorer", type: "villageJob", value: (lvl) => lvl },
        { name: "villageLootQuality", type: "base", value: (lvl) => (lvl > 1 ? (lvl - 1) * 2 : null) },
      ],
    },
    trophyCase: {
      cap: 6,
      icon: "mdi-gradient-vertical",
      requirement() {
        return store.state.unlock.villageBuildings7.use;
      },
      price(lvl) {
        let obj = {};
        obj[`village_loot${lvl}`] = 1;
        return obj;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(2.5, lvl) * buildNum(150, "B"));
      },
      effect: [
        { name: "villageMaterialGain", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
        { name: "villageMaterialCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
      ],
    },
    antiquarian: {
      icon: "mdi-store",
      cap: 12,
      requirement() {
        return store.state.unlock.villageBuildings7.use;
      },
      price(lvl) {
        let obj = { village_coin: Math.pow(2.5, lvl) * buildNum(32.5, "Qa") };
        obj[`village_loot${Math.floor(lvl / 2)}`] = Math.pow(10, lvl % 2) * 10;
        return obj;
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(3, lvl) * buildNum(200, "B"));
      },
      effect: [
        { name: "currencyVillageCoinCap", type: "mult", value: (lvl) => Math.pow(1.3, lvl) },
        { name: "villageUpgradeAmbition", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "villageUpgradeUnderstanding", type: "unlock", value: (lvl) => lvl >= 2 },
        { name: "villageUpgradeCuriosity", type: "unlock", value: (lvl) => lvl >= 3 },
        { name: "villageUpgradeWorship", type: "unlock", value: (lvl) => lvl >= 4 },
        { name: "villageUpgradeBartering", type: "unlock", value: (lvl) => lvl >= 5 },
        { name: "villageUpgradeSparks", type: "unlock", value: (lvl) => lvl >= 6 },
      ],
    },
    windTurbine: {
      cap: 20,
      icon: "mdi-wind-turbine",
      requirement() {
        return store.state.unlock.villageBuildings7.use;
      },
      price(lvl) {
        return {
          village_metal: Math.pow(1.65, lvl) * buildNum(1.25, "Qa"),
          village_loot1: Math.ceil(Math.pow(1.15, lvl) * (3 + lvl)),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * buildNum(240, "B"));
      },
      effect: [
        { name: "villagePower", type: "base", value: (lvl) => lvl },
        { name: "villageLootGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    radar: {
      cap: 10,
      hasDescription: true,
      icon: "mdi-satellite-uplink",
      requirement() {
        return store.state.unlock.villageBuildings7.use && store.state.upgrade.item.village_court.level >= 2;
      },
      price(lvl) {
        return {
          village_metal: Math.pow(3.15, lvl) * buildNum(6.57, "Qa"),
          village_marble: Math.pow(2.4, lvl) * buildNum(41.5, "M"),
          village_science: lvl * 650 + 3500,
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(3, lvl) * buildNum(333, "B"));
      },
      effect: [{ name: "villagePolicyScanning", type: "base", value: (lvl) => lvl }],
    },
    waterTurbine: {
      cap: 20,
      icon: "mdi-hydro-power",
      requirement() {
        return store.state.unlock.villageBuildings7.use;
      },
      price(lvl) {
        return {
          village_water: Math.pow(2.2, lvl) * buildNum(200, "Qi"),
          village_glass: Math.pow(1.65, lvl) * buildNum(6.8, "T"),
          village_loot2: Math.ceil(Math.pow(1.14, lvl) * (2 + lvl)),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * buildNum(420, "B"));
      },
      effect: [
        { name: "villagePower", type: "base", value: (lvl) => lvl },
        { name: "currencyVillageWaterGain", type: "mult", value: (lvl) => Math.pow(1.15, lvl) },
      ],
    },
    solarPanel: {
      cap: 20,
      icon: "mdi-solar-panel",
      requirement() {
        return store.state.unlock.villageBuildings7.use;
      },
      price(lvl) {
        return {
          village_gem: Math.pow(1.55, lvl) * buildNum(9, "T"),
          village_oil: Math.pow(1.8, lvl) * buildNum(30.4, "B"),
          village_loot3: Math.ceil(Math.pow(1.13, lvl) * (1 + lvl)),
        };
      },
      timeNeeded(lvl) {
        return Math.ceil(Math.pow(1.25, lvl) * buildNum(550, "B"));
      },
      effect: [{ name: "villagePower", type: "base", value: (lvl) => lvl * 2 }],
    },
  },
  "modules/village/card": {
    feature: {
      prefix: "VI",
      reward: [{ name: "villageResourceGain", type: "mult", value: (lvl) => lvl * 0.03 + 1 }],
      shinyReward: [{ name: "villagePrestigeIncome", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
      powerReward: [
        { name: "villageMaterialGain", type: "mult", value: (lvl) => Math.pow(1.07, lvl) },
        { name: "villageMaterialCap", type: "mult", value: (lvl) => Math.pow(1.03, lvl) },
        { name: "villagePrestigeIncome", type: "mult", value: (lvl) => Math.pow(1.05, lvl) },
      ],
      unlock: "villageFeature",
    },
    collection: {
      neighborhood: { reward: [{ name: "villageWorker", type: "base", value: 8 }] },
      plantsInTheCity: { reward: [{ name: "currencyVillagePlantFiberGain", type: "mult", value: 1.5 }] },
      industrialRevolution: { reward: [{ name: "currencyVillageWoodGain", type: "mult", value: 1.5 }] },
      maintainingSafety: {
        reward: [
          { name: "villageCardCap", type: "base", value: 1 },
          { name: "hordeCardCap", type: "base", value: 1 },
        ],
      },
    },
    pack: {
      meetingNewPeople: {
        unlock: "villageBuildings3",
        amount: 3,
        price: 18,
        content: {
          "VI-0001": 1.11,
          "VI-0003": 0.9,
          "VI-0004": 1.04,
          "VI-0005": 1.11,
          "VI-0006": 2.4,
          "VI-0007": 0.63,
          "VI-0008": 2.8,
          "VI-0010": 2.55,
          "VI-0011": 1.85,
          "VI-0012": 1.6,
          "VI-0014": 0.7,
          "VI-0015": 0.1,
          "VI-0016": 1.11,
          "VI-0017": 0.35,
          "VI-0018": 0.1,
          "VI-0019": 1.44,
          "VI-0024": 0.97,
          "VI-0025": 1.03,
          "VI-0027": 0.7,
        },
      },
      darkCult: {
        unlock: "villageBuildings4",
        amount: 5,
        price: 65,
        content: {
          "VI-0002": 0.84,
          "VI-0009": 1.75,
          "VI-0015": 0.22,
          "VI-0017": 0.82,
          "VI-0018": 0.22,
          "VI-0019": 1.33,
          "VI-0020": 0.84,
          "VI-0021": 1.25,
          "VI-0022": 1.4,
          "VI-0024": 1.07,
          "VI-0025": 1.23,
          "VI-0026": 2.55,
          "VI-0027": 0.7,
          "VI-0028": 2.3,
          "VI-0029": 0.38,
          "VI-0030": 1.6,
          "VI-0031": 1.15,
        },
      },
      technologicalAdvancement: {
        unlock: "villageBuildings5",
        amount: 4,
        price: 115,
        content: {
          "VI-0013": 0.5,
          "VI-0023": 1.1,
          "VI-0030": 2.6,
          "VI-0031": 1.65,
          "VI-0032": 0.38,
          "VI-0033": 0.7,
          "VI-0034": 1.32,
          "VI-0035": 1.05,
          "VI-0036": 0.82,
          "VI-0037": 1.02,
          "VI-0038": 1.4,
          "VI-0039": 0.9,
        },
      },
    },
    card: cardList,
  },
  "modules/village/craftingRecipe": {
    // Base recipes
    rope: {
      icon: "mdi-lasso",
      color: "beige",
      price: { village_plantFiber: buildNum(100, "K") },
      value: 10,
      timeNeeded: 60,
      milestone: {
        100: { type: "villageCraft", name: "pouch", value: true },
        750: { type: "changeStat", name: "timeNeeded", value: 40 },
        4800: { type: "changeStat", name: "value", value: 14 },
        27000: { type: "changeStat", name: "timeNeeded", value: 30 },
      },
    },
    woodenPlanks: {
      icon: "mdi-view-dashboard-variant",
      color: "brown",
      price: { village_wood: buildNum(250, "K") },
      value: 22,
      timeNeeded: 120,
      milestone: {
        60: { type: "changeStat", name: "timeNeeded", value: 90 },
        450: { type: "villageCraft", name: "cupboard", value: true },
        3200: { type: "changeStat", name: "value", value: 30 },
        16500: { type: "changeStat", name: "timeNeeded", value: 75 },
      },
    },
    brick: {
      icon: "mdi-wall",
      color: "cherry",
      price: { village_stone: buildNum(600, "K") },
      value: 48,
      timeNeeded: 240,
      milestone: {
        40: { type: "changeStat", name: "value", value: 66 },
        300: { type: "changeStat", name: "timeNeeded", value: 180 },
        2000: { type: "villageCraft", name: "weight", value: true },
        12000: { type: "changeStat", name: "value", value: 84 },
      },
    },
    screws: {
      icon: "mdi-screw-flat-top",
      color: "light-grey",
      price: { village_metal: buildNum(800, "K") },
      value: 25,
      timeNeeded: 120,
      milestone: {
        100: { type: "changeStat", name: "value", value: 34 },
        550: { type: "changeStat", name: "timeNeeded", value: 100 },
        4400: { type: "villageCraft", name: "scissors", value: true },
        21000: { type: "changeStat", name: "value", value: 44 },
      },
    },
    waterBottle: {
      icon: "mdi-bottle-soda",
      color: "blue",
      price: { village_water: buildNum(1.5, "M") },
      value: 15,
      timeNeeded: 70,
      milestone: {
        300: { type: "changeStat", name: "timeNeeded", value: 50 },
        1700: { type: "changeStat", name: "timeNeeded", value: 35 },
        9250: { type: "villageCraft", name: "herbTea", value: true },
        53000: { type: "changeStat", name: "timeNeeded", value: 25 },
      },
    },
    cocktailGlass: {
      icon: "mdi-glass-cocktail",
      color: "light-blue",
      price: { village_glass: buildNum(2.5, "M") },
      value: 50,
      timeNeeded: 210,
      milestone: {
        45: { type: "changeStat", name: "value", value: 67 },
        360: { type: "changeStat", name: "timeNeeded", value: 180 },
        2500: { type: "villageCraft", name: "glasses", value: true },
        14500: { type: "changeStat", name: "value", value: 86 },
      },
    },
    boomerang: {
      icon: "mdi-boomerang",
      color: "cherry",
      price: { village_hardwood: buildNum(4, "M") },
      value: 38,
      timeNeeded: 140,
      milestone: {
        45: { type: "changeStat", name: "value", value: 51 },
        360: { type: "changeStat", name: "timeNeeded", value: 120 }, // 2500: {type: 'villageCraft', name: 'weight', value: true},
        14500: { type: "changeStat", name: "value", value: 65 },
      },
    },
    polishedGem: {
      icon: "mdi-diamond-stone",
      color: "cyan",
      price: { village_gem: buildNum(6.5, "M") },
      value: 36,
      timeNeeded: 160,
      milestone: {
        55: { type: "changeStat", name: "value", value: 47 },
        380: { type: "changeStat", name: "timeNeeded", value: 140 }, // 2475: {type: 'villageCraft', name: 'weight', value: true},
        13500: { type: "changeStat", name: "value", value: 60 },
      },
    },
    oilLamp: {
      icon: "mdi-oil-lamp",
      color: "pale-orange",
      price: { village_oil: buildNum(10, "M") },
      value: 51,
      timeNeeded: 270,
      milestone: {
        40: { type: "changeStat", name: "value", value: 65 },
        330: { type: "changeStat", name: "timeNeeded", value: 225 }, // 2100: {type: 'villageCraft', name: 'weight', value: true},
        12400:
      icon: "mdi-shower",
      color: "pale-  timeNeeded: 360,
      milestone: {
        40: { type: "changeStat", name: "timeNeeded", value: 300 },
        330: { type: "changeStat", name: "value", value: 90 }, // 2100: {type: 'villageCraft', name: 'weight', value: true},
        12400: { type: "changeStat", name: "timeNeeded", value: 250 },
      },
    }, // Advanced recipes
    pouch: {
      icon: "mdi-sack",
      color: "pale-orange",
      price: { village_plantFiber: buildNum(1, "M") },
      value: 18,
      timeNeeded: 90,
      milestone: {
        80: { type: "changeStat", name: "value", value: 26 },
        600: { type: "changeStat", name: "timeNeeded", value: 70 },
        4000: { type: "changeStat", name: "value", value: 35 },
        22000: { type: "changeStat", name: "timeNeeded", value: 60 },
      },
    },
    cupboard: {
      icon: "mdi-cupboard",
      color: "wooden",
      price: { village_wood: buildNum(3, "M") },
      value: 33,
      timeNeeded: 150,
      milestone: {
        50: { type: "changeStat", name: "value", value: 42 },
        400: { type: "changeStat", name: "timeNeeded", value: 125 },
        2800: { type: "changeStat", name: "value", value: 52 },
        15000: { type: "changeStat", name: "timeNeeded", value: 100 },
      },
    },
    weight: {
      icon: "mdi-weight",
      color: "dark-grey",
      price: { village_stone: buildNum(7, "M") },
      value: 65,
      timeNeeded: 300,
      milestone: {
        50: { type: "changeStat", name: "value", value: 87 },
        400: { type: "changeStat", name: "timeNeeded", value: 255 },
        2800: { type: "villageCraft", name: "handSaw", value: true },
        15000: { type: "changeStat", name: "timeNeeded", value: 210 },
      },
    },
    scissors: {
      icon: "mdi-content-cut",
      color: "light-grey",
      price: { village_metal: buildNum(8, "M"), village_wood: buildNum(3, "M") },
      value: 30,
      timeNeeded: 125,
      milestone: {
        55: { type: "changeStat", name: "timeNeeded", value: 110 },
        420: { type: "changeStat", name: "value", value: 40 },
        3100: { type: "changeStat", name: "timeNeeded", value: 100 },
        17000: { type: "changeStat", name: "value", value: 50 },
      },
    },
    herbTea: {
      icon: "mdi-tea",
      color: "green",
      price: { village_water: buildNum(12, "M"), village_plantFiber: buildNum(5, "M") },
      value: 54,
      timeNeeded: 200,
      milestone: {
        48: { type: "changeStat", name: "value", value: 78 },
        380: { type: "changeStat", name: "value", value: 106 },
        2600: { type: "changeStat", name: "timeNeeded", value: 170 },
        14000: { type: "changeStat", name: "value", value: 140 },
      },
    },
    glasses: {
      icon: "mdi-glasses",
      color: "red-pink",
      price: { village_glass: buildNum(14, "M"), village_metal: buildNum(11, "M") },
      value: 21,
      timeNeeded: 80,
      milestone: {
        100: { type: "changeStat", name: "timeNeeded", value: 65 },
        750: { type: "changeStat", name: "value", value: 28 },
        5400: { type: "changeStat", name: "timeNeeded", value: 55 },
        30000: { type: "changeStat", name: "timeNeeded", value: 45 },
      },
    }, // Book recipes
    arrows: {
      icon: "mdi-arrow-projectile-multiple",
      color: "wooden",
      price: { village_wood: buildNum(1.25, "M"), village_stone: buildNum(400, "K") },
      value: 21,
      timeNeeded: 100,
      milestone: {
        85: { type: "changeStat", name: "timeNeeded", value: 85 },
        400: { type: "changeStat", name: "timeNeeded", value: 70 }, // 2200: {type: 'villageCraft', name: 'weight', value: true},
        10000: { type: "changeStat", name: "timeNeeded", value: 60 }, // 47500: {type: 'villageCraft', name: 'weight', value: true},
      },
    },
    bowl: {
      icon: "mdi-bowl",
      color: "brown",
      price: { village_wood: buildNum(2.5, "M") },
      value: 25,
      timeNeeded: 130,
      milestone: {
        90: { type: "changeStat", name: "timeNeeded", value: 100 },
        675: { type: "villageCraft", name: "bush", value: true },
        4800: { type: "changeStat", name: "value", value: 34 },
        25000: { type: "changeStat", name: "timeNeeded", value: 80 },
      },
    },
    chain: {
      icon: "mdi-link-variant",
      color: "light-grey",
      price: { village_plantFiber: buildNum(3, "M"), village_metal: buildNum(1.35, "M") },
      value: 19,
      timeNeeded: 70,
      milestone: {
        140: { type: "changeStat", name: "timeNeeded", value: 60 },
        875: { type: "villageCraft", name: "garage", value: true },
        4300: { type: "changeStat", name: "value", value: 25 },
        23000: { type: "changeStat", name: "timeNeeded", value: 50 },
      },
    },
    spear: {
      icon: "mdi-spear",
      color: "dark-grey",
      price: { village_wood: buildNum(8, "M"), village_metal: buildNum(1.75, "M") },
      value: 26,
      timeNeeded: 120,
      milestone: {
        110: { type: "changeStat", name: "timeNeeded", value: 95 },
        800: { type: "changeStat", name: "value", value: 35 },
        5750: { type: "changeStat", name: "timeNeeded", value: 75 },
        28000: { type: "changeStat", name: "value", value: 45 },
      },
    },
    goldenRing: {
      icon: "mdi-circle-outline",
      color: "amber",
      price: { village_metal: buildNum(5, "M"), village_water: buildNum(750, "K") },
      value: 140,
      timeNeeded: 600,
      milestone: {
        30: { type: "changeStat", name: "value", value: 188 },
        225: { type: "changeStat", name: "value", value: 239 },
        1800: { type: "changeStat", name: "value", value: 295 },
      },
    }, // Special ingredient recipes
    poisonedArrows: {
      icon: "mdi-arrow-projectile-multiple",
      color: "light-green",
      price: { craft_arrows: 5, village_acidVial: 1 },
      prio: 1,
      value: 850,
      timeNeeded: 600,
      milestone: {
        120: { type: "changeStat", name: "value", value: 1100 },
        700: { type: "changeStat", name: "value", value: 1400 },
        5000: { type: "changeStat", name: "timeNeeded", value: 300 },
      },
    },
    frostSpear: {
      icon: "mdi-spear",
      color: "cyan",
      price: { craft_spear: 10, village_snowflake: 1 },
      prio: 1,
      value: 2200,
      timeNeeded: 1500,
      milestone: {
        55: { type: "changeStat", name: "value", value: 3000 },
        300: { type: "changeStat", name: "value", value: 3950 },
        2350: { type: "changeStat", name: "value", value: 5100 },
      },
    },
    spicySoup: {
      icon: "mdi-pot-steam",
      color: "orange-red",
      price: {
        craft_bowl: 15,
        village_plantFiber: buildNum(250, "M"),
        village_water: buildNum(35, "M"),
        village_chiliBundle: 1,
      },
      prio: 1,
      value: 2550,
      timeNeeded: 75,
      milestone: {
        40: { type: "changeStat", name: "value", value: 3400 },
        240: { type: "changeStat", name: "value", value: 4500 },
        1900: { type: "changeStat", name: "value", value: 5750 },
      },
    },
    stopwatch: {
      icon: "mdi-timer",
      color: "pale-blue",
      price: { craft_screws: 20, village_metal: buildNum(1.44, "B"), village_gears: 1 },
      prio: 1,
      value: 8600,
      timeNeeded: 3600,
      milestone: {
        65: { type: "changeStat", name: "timeNeeded", value: 1800 },
        335: { type: "changeStat", name: "value", value: buildNum(12.5, "K") },
      },
    }, // Random recipes
    // Special recipes
    smallChest: {
      icon: "mdi-treasure-chest",
      color: "pale-yellow",
      price: {
        craft_rope: (lvl) => Math.pow(2, lvl) * 60,
        craft_woodenPlanks: (lvl) => Math.pow(2, lvl) * 30,
        craft_brick: (lvl) => Math.pow(2, lvl) * 15,
        craft_screws: (lvl) => Math.pow(2, lvl) * 25,
      },
      prio: 1,
      isSpecial: true,
      effect: [{ name: "villageMaterialCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
      timeNeeded: 7200,
    },
    bush: {
      icon: "mdi-nature",
      color: "green",
      price: {
        village_water: (lvl) => Math.pow(1.25, lvl) * buildNum(500, "K"),
        craft_pouch: (lvl) => getSequence(5, lvl + 1) * 8,
        craft_bowl: (lvl) => getSequence(2, lvl + 1) * 10,
      },
      prio: 1,
      isSpecial: true,
      effect: [
        { name: "currencyVillagePlantFiberGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyVillagePlantFiberCap", type: "base", value: (lvl) => getSequence(2, lvl) * 500 },
      ],
      timeNeeded: 3600,
    },
    handSaw: {
      icon: "mdi-hand-saw",
      color: "light-grey",
      price: {
        village_metal: (lvl) => Math.pow(1.25, lvl) * buildNum(1.8, "M"),
        craft_weight: (lvl) => getSequence(3, lvl + 1) * 15,
      },
      prio: 1,
      isSpecial: true,
      effect: [
        { name: "currencyVillageWoodGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyVillageWoodCap", type: "base", value: (lvl) => getSequence(2, lvl) * 500 },
      ],
      timeNeeded: 3600,
    },
    garage: {
      icon: "mdi-garage-open-variant",
      color: "dark-grey",
      price: {
        village_wood: (lvl) => Math.pow(1.25, lvl) * buildNum(14, "M"),
        craft_chain: (lvl) => getSequence(3, lvl + 1) * 15,
      },
      prio: 1,
      isSpecial: true,
      effect: [
        { name: "currencyVillageStoneGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyVillageStoneCap", type: "base", value: (lvl) => getSequence(2, lvl) * 500 },
      ],
      timeNeeded: 3600,
    },
    diamondRing: {
      icon: "mdi-ring",
      color: "cyan",
      price: {
        village_metal: (lvl) => Math.pow(1.25, lvl) * buildNum(14, "M"),
        village_gem: (lvl) => Math.pow(1.25, lvl) * buildNum(2, "M"),
        craft_goldenRing: (lvl) => getSequence(2, lvl) * 5,
      },
      prio: 1,
      isSpecial: true,
      effect: [
        { name: "currencyVillageCoinGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageCopperCoinGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
      ],
      timeNeeded: 14400,
    },
  },
  "modules/village/job": {
    collector: {
      max: null,
      needed: 1,
      rewards: [
        { type: "base", name: "currencyVillagePlantFiberGain", amount: 0.3 },
        { type: "base", name: "currencyVillageWoodGain", amount: 0.3 },
        { type: "base", name: "currencyVillageStoneGain", amount: 0.3 },
      ],
    },
    farmer: {
      max: 0,
      needed: 2,
      rewards: [
        { type: "base", name: "currencyVillagePlantFiberGain", amount: 2 },
        { type: "base", name: "currencyVillageGrainGain", amount: 0.5 },
      ],
    },
    harvester: {
      max: 0,
      needed: 2,
      rewards: [
        { type: "base", name: "currencyVillageWoodGain", amount: 2 },
        { type: "base", name: "currencyVillageFruitGain", amount: 0.5 },
      ],
    },
    miner: {
      max: 0,
      needed: 2,
      rewards: [
        { type: "base", name: "currencyVillageStoneGain", amount: 2 },
        { type: "base", name: "currencyVillageMetalGain", amount: 0.5 },
      ],
    },
    wellWorker: { max: 0, needed: 3, rewards: [{ type: "base", name: "currencyVillageWaterGain", amount: 3 }] },
    librarian: { max: 0, needed: 4, rewards: [{ type: "base", name: "currencyVillageKnowledgeGain", amount: 0.02 }] },
    glassblower: { max: 0, needed: 4, rewards: [{ type: "base", name: "currencyVillageGlassGain", amount: 0.25 }] },
    entertainer: { max: 0, needed: 5, rewards: [{ type: "base", name: "villageHappiness", amount: 0.03 }] },
    lumberjack: {
      max: 0,
      needed: 6,
      rewards: [
        { type: "base", name: "currencyVillageWoodGain", amount: 12 },
        { type: "base", name: "currencyVillageHardwoodGain", amount: 0.25 },
      ],
    },
    blastMiner: {
      max: 0,
      needed: 6,
      rewards: [
        { type: "base", name: "currencyVillageStoneGain", amount: 12 },
        { type: "base", name: "currencyVillageGemGain", amount: 0.25 },
      ],
    },
    fisherman: { max: 0, needed: 7, rewards: [{ type: "base", name: "currencyVillageFishGain", amount: 30 }] },
    scientist: { max: 0, needed: 8, rewards: [{ type: "base", name: "currencyVillageScienceGain", amount: 0.008 }] },
    gardener: {
      max: 0,
      needed: 8,
      rewards: [
        { type: "base", name: "currencyVillagePlantFiberGain", amount: 20 },
        { type: "base", name: "currencyVillageVegetableGain", amount: 40 },
      ],
    },
    oilWorker: { max: 0, needed: 11, rewards: [{ type: "base", name: "currencyVillageOilGain", amount: 0.35 }] },
    sculptor: { max: 0, needed: 14, rewards: [{ type: "base", name: "currencyVillageMarbleGain", amount: 0.001 }] },
    explorer: { max: 0, needed: 600, rewards: [{ type: "base", name: "villageLootGain", amount: 0.5 }] },
  },
  "modules/village/offering": {
    plantFiber: { unlock: "villageOffering1", cost: (lvl) => Math.pow(1.5, lvl) * buildNum(1, "M"), effect: 200 },
    wood: { unlock: "villageOffering1", cost: (lvl) => Math.pow(1.5, lvl) * buildNum(1, "M"), effect: 200 },
    stone: { unlock: "villageOffering1", cost: (lvl) => Math.pow(1.5, lvl) * buildNum(1, "M"), effect: 200 },
    coin: {
      unlock: "villageOffering2",
      amount: 3,
      cost: (lvl) => Math.pow(1.75, lvl) * buildNum(10, "M"),
      effect: 200,
    },
    metal: { unlock: "villageOffering2", amount: 3, cost: (lvl) => Math.pow(1.5, lvl) * buildNum(3, "M"), effect: 200 },
    water: { unlock: "villageOffering2", amount: 3, cost: (lvl) => Math.pow(2, lvl) * buildNum(5, "M"), effect: 500 },
    glass: {
      unlock: "villageOffering3",
      amount: 8,
      cost: (lvl) => Math.pow(1.5, lvl) * buildNum(120, "K"),
      effect: 100,
    },
    hardwood: {
      unlock: "villageOffering3",
      amount: 8,
      cost: (lvl) => Math.pow(1.5, lvl) * buildNum(40, "K"),
      effect: 100,
    },
    gem: { unlock: "villageOffering3", amount: 8, cost: (lvl) => Math.pow(1.5, lvl) * buildNum(40, "K"), effect: 100 },
    knowledge: {
      unlock: "villageOffering4",
      amount: 20,
      increment: 1,
      cost: (lvl) => Math.pow(1.25, lvl) * 250,
      effect: 2,
    },
    science: {
      unlock: "villageOffering4",
      amount: 20,
      increment: 1,
      cost: (lvl) => Math.pow(1.25, lvl) * 100,
      effect: 1,
    },
    joy: { unlock: "villageOffect: 5 },
  },
  "modules/village/policy"r",
      effect: [
        { name: "villageTaxRate", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
        { name: "villageHappiness", type: "base", value: (lvl) => lvl * (lvl > 0 ? -0.05 : -0.03) },
      ],
    },
    immigration: {
      mult: "villagePolicyImmigration",
      icon: "mdi-account-group",
      effect: [
        { name: "villageWorker", type: "mult", value: (lvl) => lvl * 0.15 + 1 },
        { name: "villageHappiness", type: "base", value: (lvl) => lvl * (lvl > 0 ? -0.05 : -0.1) },
      ],
    },
    religion: {
      mult: "villagePolicyReligion",
      icon: "mdi-hands-pray",
      effect: [
        { name: "villageResourceGain", type: "mult", value: (lvl) => lvl * (lvl > 0 ? -0.25 : -0.1) + 1 },
        { name: "currencyVillageFaithGain", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    scanning: {
      mult: "villagePolicyScanning",
      icon: "mdi-magnify-scan",
      effect: [
        { name: "villageLootGain", type: "mult", value: (lvl) => 1 - lvl * (lvl > 0 ? 0.1 : 0.05) },
        { name: "villageLootQuality", type: "base", value: (lvl) => Math.max(lvl, 0) },
        { name: "villageLootQuality", type: "mult", value: (lvl) => Math.min(1 + lvl * 0.1, 1) },
      ],
    },
  },
  "modules/village/relic": {
    mudBrick: {
      icon: "mdi-wall",
      color: "brown",
      effect: [
        { name: "village_hut", type: "keepUpgrade", value: true },
        { name: "currencyVillageWaterGain", type: "mult", value: 1.5 },
      ],
    },
    sapling: {
      icon: "mdi-sprout",
      color: "light-green",
      effect: [
        { name: "village_shed", type: "keepUpgrade", value: true },
        { name: "currencyVillagePlantFiberGain", type: "mult", value: 1.5 },
      ],
    },
    keychain: {
      icon: "mdi-key-chain",
      color: "light-grey",
      effect: [
        { name: "village_smallHouse", type: "keepUpgrade", value: true },
        { name: "currencyVillageWoodGain", type: "mult", value: 1.5 },
      ],
    },
    treasureChest: {
      icon: "mdi-treasure-chest",
      color: "amber",
      effect: [
        { name: "village_treasury", type: "keepUpgrade", value: true },
        { name: "village_wallet", type: "keepUpgrade", value: true },
        { name: "village_resourceBag", type: "keepUpgrade", value: true },
        { name: "village_metalBag", type: "keepUpgrade", value: true },
      ],
    },
    screwdriver: {
      icon: "mdi-screwdriver",
      color: "indigo",
      effect: [
        { name: "village_crane", type: "keepUpgrade", value: true },
        { name: "currencyVillageStoneGain", type: "mult", value: 1.5 },
      ],
    },
    rose: {
      icon: "mdi-flower",
      color: "red",
      effect: [
        { name: "village_garden", type: "keepUpgrade", value: true },
        { name: "village_well", type: "keepUpgrade", value: true },
      ],
    },
    goldenKey: {
      icon: "mdi-key-chain",
      color: "amber",
      effect: [
        { name: "village_house", type: "keepUpgrade", value: true },
        { name: "village_miniatureSmith", type: "keepUpgrade", value: true },
      ],
    },
    supervisor: {
      icon: "mdi-account-tie",
      color: "indigo",
      effect: [
        { name: "village_sawmill", type: "keepUpgrade", value: true },
        { name: "village_tunnel", type: "keepUpgrade", value: true },
      ],
    },
    globe: {
      icon: "mdi-globe-model",
      color: "green",
      effect: [
        { name: "village_library", type: "keepUpgrade", value: true },
        { name: "village_glassBlowery", type: "keepUpgrade", value: true },
      ],
    },
  },
  "modules/village/upgrade": {
    wallet: {
      cap: 12,
      capMult: true,
      requirement() {
        return store.state.unlock.villageCoinUpgrades.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.3, lvl) * 200) };
      },
      effect: [{ name: "currencyVillageCoinCap", type: "base", value: (lvl) => lvl * 150 }],
    },
    resourceBag: {
      cap: 10,
      capMult: true,
      requirement() {
        return store.state.unlock.villageCoinUpgrades.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.4, lvl) * 200) };
      },
      effect: [
        { name: "currencyVillagePlantFiberCap", type: "base", value: (lvl) => lvl * 200 },
        { name: "currencyVillageWoodCap", type: "base", value: (lvl) => lvl * 200 },
        { name: "currencyVillageStoneCap", type: "base", value: (lvl) => lvl * 200 },
      ],
    },
    metalBag: {
      cap: 5,
      capMult: true,
      requirement() {
        return store.state.unlock.villageCoinUpgrades.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.7, lvl) * 300) };
      },
      effect: [{ name: "currencyVillageMetalCap", type: "base", value: (lvl) => lvl * 400 }],
    }, // Coin upgrades
    scythe: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradeScythe.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.55, lvl) * 2500) };
      },
      effect: [
        { name: "currencyVillagePlantFiberGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.05 + 1) },
        { name: "currencyVillageGrainGain", type: "mult", value: (lvl) => Math.pow(1.08, lvl) },
      ],
    },
    hatchet: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradeHatchet.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.55, lvl) * 5000) };
      },
      effect: [
        { name: "currencyVill1) },
        { name: "currencyVillageFruitGain",e: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradePickaxe.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.55, lvl) * 7500) };
      },
      effect: [
        { name: "currencyVillageStoneGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.05 + 1) },
        { name: "currencyVillageMetalGain", type: "mult", value: (lvl) => Math.pow(1.04, lvl) * (lvl * 0.04 + 1) },
      ],
    },
    wateringCan: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradeWateringCan.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.55, lvl) * buildNum(10, "K")) };
      },
      effect: [
        { name: "currencyVillageGrainGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) },
        { name: "currencyVillageFruitGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) },
        { name: "currencyVillageWaterGain", type: "mult", value: (lvl) => Math.pow(1.22, lvl) },
      ],
    },
    investment: {
      cap: 50,
      requirement() {
        return store.state.unlock.villageUpgradeInvestment.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.35, lvl) * buildNum(12.5, "K")) };
      },
      effect: [
        { name: "villageTaxRate", type: "mult", value: (lvl) => Math.pow(1.05, lvl) },
        { name: "currencyVillageCoinGain", type: "mult", value: (lvl) => Math.pow(1.11, lvl) },
      ],
    }, // Knowledge upgrades
    basics: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradeBasics.use;
      },
      price(lvl) {
        return { village_knowledge: 12 * lvl + 80 };
      },
      effect: [
        { name: "currencyVillagePlantFiberGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.15 + 1) },
        { name: "currencyVillageWoodGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.05 + 1) },
        { name: "currencyVillageStoneGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.05 + 1) },
      ],
    },
    processing: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradeProcessing.use;
      },
      price(lvl) {
        return { village_knowledge: 12 * lvl + 120 };
      },
      effect: [
        { name: "villageFoodGain", type: "mult", value: (lvl) => Math.pow(1.07, lvl) },
        { name: "currencyVillageMetalGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.05 + 1) },
      ],
    },
    pump: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradePump.use;
      },
      price(lvl) {
        return { village_knowledge: 12 * lvlype: "mult", value: (lvl) => Math.pow(1.2,uirement() {
        return store.state.unlock.villageUpgradeSand.use;
      },
      price(lvl) {
        return { village_knowledge: 12 * lvl + 200 };
      },
      effect: [
        { name: "currencyVillageGlassGain", type: "mult", value: (lvl) => Math.pow(1.08, lvl) * (lvl * 0.08 + 1) },
      ],
    },
    book: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradeBook.use;
      },
      price(lvl) {
        return { village_knowledge: 12 * lvl + 240 };
      },
      effect: [{ name: "currencyVillageKnowledgeGain", type: "mult", value: (lvl) => lvl * 0.04 + 1 }],
    }, // More coin upgrades
    axe: {
      cap: 40,
      requirement() {
        return store.state.unlock.villageUpgradeAxe.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.3, lvl) * buildNum(500, "K")) };
      },
      effect: [
        { name: "currencyVillageWoodGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyVillageHardwoodGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    bomb: {
      cap: 40,
      requirement() {
        return store.state.unlock.villageUpgradeBomb.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.3, lvl) * buildNum(1.5, "M")) };
      },
      effect: [
        { name: "currencyVillageStoneGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyVillageGemGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    toll: {
      cap: 40,
      requirement() {
        return store.state.unlock.villageUpgradeToll.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.3, lvl) * buildNum(4, "M")) };
      },
      effect: [{ name: "villageTaxRate", type: "mult", value: (lvl) => lvl * 0.05 + 1 }],
    },
    fishingRod: {
      cap: 40,
      requirement() {
        return store.state.unlock.villageUpgradeFishingRod.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.3, lvl) * buildNum(10, "M")) };
      },
      effect: [{ name: "currencyVillageFishGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    holyBook: {
      cap: 40,
      requirement() {
        return store.state.unlock.villageUpgradeHolyBook.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.45, lvl) * buildNum(22.5, "M")) };
      },
      effect: [{ name: "currencyVillageFaithCap", type: "base", value: (lvl) => lvl * 8 }],
    }, // Science upgrades
    breakthrough: {
      cap: 50,
      requirement() {
        return store.state.unlock.villageUpgradeBreakthrough.use;
      },
      price(lvl) {
        return { village_science: Math.round(Math.pow(1.05, Math.max(lvl - 25, 0)) * lvl * 10 + 20) };
      },
      effect: [
        { name: "currencyVillageKnowledgeCap", type: "base", value: (lvl) => lvl * 5 },
        { name: "currencyVillageScienceCap", type: "base", value: (lvl) => lvl * 2 },
      ],
    },
    modifiedPlants: {
      cap: 10,
      requirement() {
        return store.state.unlock.villageUpgradeModifiedPlants.use;
      },
      price(lvl) {
        return { village_science: lvl * 15 + 30 };
      },
      effect: [
        { name: "currencyVillagePlantFiberGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageGrainGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyVillageFruitGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyVillageVegetableGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    dopamine: {
      cap: 15,
      requirement() {
        return store.state.unlock.villageUpgradeDopamine.use;
      },
      price(lvl) {
        return { village_science: lvl * 15 + 40 };
      },
      effect: [
        { name: "villageHappiness", type: "base", value: (lvl) => lvl * 0.002 },
        { name: "currencyVillageJoyCap", type: "base", value: (lvl) => lvl * 50 },
      ],
    },
    adrenaline: {
      cap: 15,
      requirement() {
        return store.state.unlock.villageUpgradeAdrenaline.use;
      },
      price(lvl) {
        return { village_science: lvl * 15 + 50 };
      },
      effect: [
        { name: "currencyVillageHardwoodGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyVillageGemGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyVillageFishGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    }, // Old library upgrades
    sprinkler: {
      cap: 15,
      requirement() {
        return store.state.unlock.villageUpgradeSprinkler.use;
      },
      price(lvl) {
        return { village_coin: Math.ceil(Math.pow(1.65, lvl) * buildNum(2, "T")) };
      },
      effect: [
        { name: "currencyVillagePlantFiberGain", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
        { name: "currencyVillageGrainGain", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "currencyVillageFruitGain", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "currencyVillageVegetableGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
      ],
    },
    greed: {
      cap: 15,
      requirement() {
        return store.state.unlock.villageUpgradeGreed.use;
      },
      price(lvl) {
        return { village_knowledge: lvl * 160 + 2200, village_science: lvl * 45 + 500 };
      },
      effect: [
        { name: "villageTaxRate", type: "mult", value: (lvl) => Math.pow(1.4, lvl) },
        { name: "currencyVillageCoinGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) },
        { name: "villagePollution", type: "base", value: (lvl) => lvl },
      ],
    }, // Loot upgrades
    ambition: {
      requirement() {
        return store.state.unlock.villageUpgradeAmbition.use;
      },
      price(lvl) {
        return { village_loot0: Math.ceil(Math.pow(1.15, lvl) * (lvl * 2 + 6)) };
      },
      effect: [
        { name: "villageLootGain", type: "mult", value: (lvl) => lvl * 0.01 + 1 },
        { name: "villageLootQuality", type: "base", value: (lvl) => lvl * 3 },
      ],
    },
    understanding: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradeUnderstanding.use;
      },
      price(lvl) {
        return { village_loot0: Math.ceil(Math.pow(1.2, lvl) * 55) };
      },
      effect: [
        { name: "currencyVillageKnowledgeCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageScienceCap", type: "mult", value: (lvl) => lvl * 0.05 + 1 },
      ],
    },
    curiosity: {
      requirement() {
        return store.state.unlock.villageUpgradeCuriosity.use;
      },
      price(lvl) {
        return { village_loot1: Math.ceil(Math.pow(1.15, lvl) * (lvl + 4)) };
      },
      effect: [{ name: "villageLootGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 }],
    },
    worship: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradeWorship.use;
      },
      price(lvl) {
        return { village_loot1: Math.ceil(Math.pow(1.18, lvl) * 55) };
      },
      effect: [{ name: "currencyVillageFaithCap", type: "mult", value: (lvl) => getSequence(2, lvl) * 0.1 + 1 }],
    },
    bartering: {
      requirement() {
        return store.state.unlock.villageUpgradeBartering.use;
      },
      price(lvl) {
        return { village_loot2: Math.ceil(Math.pow(1.15, lvl) * (lvl + 2.5)) };
      },
      effect: [
        { name: "villageLootQuality", type: "base", value: (lvl) => lvl },
        { name: "currencyVillageCoinGain", type: "mult", value: (lvl) => Math.pow(1.08, lvl) },
      ],
    },
    sparks: {
      cap: 20,
      requirement() {
        return store.state.unlock.villageUpgradeSparks.use;
      },
      price(lvl) {
        return { village_loot2: Math.ceil(Math.pow(1.16, lvl) * 55) };
      },
      effect: [{ name: "villagePower", type: "base", value: (lvl) => lvl }],
    },
  },
  "modules/village/upgrade2": {
    cashRegister: {
      subfeature: 1,
      price(lvl) {
        return { village_copperCoin: Math.pow(lvl * 0.25 + 2, lvl) * 2000 };
      },
      effect: [
        { name: "villageCounter", type: "base", value: (lvl) => lvl },
        { name: "currencyVillageCopperCoinCap", type: "mult", value: (lvl) => Math.pow(2, lvl) },
      ],
    },
    decoration: {
      subfeature: 1,
      price(lvl) {
        return { village_copperCoin: Math.pow(1.75, lvl) * 900 };
      },
      effect: [{ name: "currencyVillageCopperCoinGain", type: "mult", value: (lvl) => Math.pow(1.175, lvl) }],
    },
    plantFiberBin: {
      subfeature: 1,
      price(lvl) {
        if (lvl === 0) {
          return {};
        }
        return { village_copperCoin: Math.pow(3, lvl) * 100 };
      },
      effect: [
        { name: "currencyVillagePlantFiberGain", type: "base", value: (lvl) => getSequence(1, lvl) * 0.1 },
        { name: "rope", type: "villageCraft", value: (lvl) => lvl >= 1 },
      ],
    },
    woodBin: {
      subfeature: 1,
      requirement() {
        return store.state.upgrade.itemturn { village_copperCoin: Math.pow(3, lvl)pe: "base", value: (lvl) => getSequence(1, lvl) * 0.1 },
        { name: "woodenPlanks", type: "villageCraft", value: (lvl) => lvl >= 1 },
      ],
    },
    stoneBin: {
      subfeature: 1,
      requirement() {
        return store.state.upgrade.item.village_woodBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_copperCoin: Math.pow(3, lvl) * 500 };
      },
      effect: [
        { name: "currencyVillageStoneGain", type: "base", value: (lvl) => getSequence(1, lvl) * 0.1 },
        { name: "brick", type: "villageCraft", value: (lvl) => lvl >= 1 },
      ],
    },
    metalBin: {
      subfeature: 1,
      requirement() {
        return store.state.upgrade.item.village_stoneBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_copperCoin: Math.pow(3, lvl) * buildNum(50, "K") };
      },
      effect: [
        { name: "currencyVillageMetalGain", type: "base", value: (lvl) => getSequence(1, lvl) * 0.075 },
        { name: "screws", type: "villageCraft", value: (lvl) => lvl >= 1 },
      ],
  tore.state.upgrade.item.village_metalBrCoin: Math.pow(3, lvl) * buildNum(600, "K") };
      },
      effect: [
        { name: "currencyVillageWaterGain", type: "base", value: (lvl) => getSequence(1, lvl) * 0.06 },
        { name: "waterBottle", type: "villageCraft", value: (lvl) => lvl >= 1 },
      ],
    },
    glassBin: {
      subfeature: 1,
      requirement() {
        return store.state.upgrade.item.village_waterBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_copperCoin: Math.pow(3,yVillageGlassGain", type: "base", value: (llageCraft", value: (lvl) => lvl >= 1 },
      ],
    },
    hardwoodBin: {
      subfeature: 1,
      requirement() {
        return store.state.upgrade.item.village_glassBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_copperCoin: Math.pow(3, lvl) * buildNum(900, "M") };
      },
      effect: [
        { name: "currencyVillageHardwoodGain", type: "base", value: (lvl) => getSequence(1, lvl) * 0.025 },
        { name: "boomerang", type: "villageCraft", value: (lvl) => lvl >= 1 },
      ],
    },
    gemBin: {
      subfeature: 1,
      requirement() {
        return store.state.upgrade.item.village_hardwoodBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_copperCoin: Math.pow(3, lvl) * buildNum(85, "B") };
      },
      effect: [
        { name: "currencyVillageGemGain", type: "base", value: (lvl) => getSequence(1, lvl) * 0.025 },
        { name: "polishedGem", type: "villageCraft", value: (lvl) => lvl >= 1 },
      ],
    },
    oilBin: {
      subfeature: 1,
      requirement() {
        return store.state.upgrade.item.village_gemBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_copperCoin: Math.pow(3, lvl) * buildNum(9.6, "T") };
      },
      effect: [
        { name: "currencyVillageOilGain", type: "base", value: (lvl) => getSequence(1, lvl) * 0.015 },
        { name: "oilLamp", type: "villageCraft", value: (lvl) => lvl >= 1 },
      ],
    },
    marbleBin: {
      subfeature: 1,
      requirement() {
        return store.state.upgrade.item.village_oilBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_copperCoin: Math.pow(3, lvl) * buildNum(1.44, "Qa") };
      },
      effect: [
        { name: "currencyVillageMarbleGain", type: "base", value: (lvl) => getSequence(1, lvl) * 0.01 },
        { name: "shower", type: "villageCraft", value: (lvl) => lvl >= 1 },
      ],
    },
  },
  "modules/village/upgradePremium": {
    overtime: {
      type: "premium",
      price(lvl) {
        return {
          gem_ruby: fallbackArray([70], [2, 3][(lvl - 1) % 2] * Math.pow(2, Math.floor((lvl - 1) / 2)) * 100, lvl),
        };
      },
      effect: [
        {
          name: "villageMaterialGain",
          type: "mult",
          value: (lvl) => fallbackArray([1, 1.1], Math.pow(1.25, lvl - 1), lvl),
        },
      ],
    },
    goldenThrone: {
      type: "premium",
      requirement() {
        return store.state.stat.village_coin.total > 0;
      },
      price(lvl) {
        return {
          gem_ruby: fallbackArray([30], [2, 3][(lvl - 1) % 2] * Math.pow(2, Math.floor((lvl - 1) / 2)) * 60, lvl),
        };
      },
      effect: [
        {
          name: "currencyVillageCoinGain",
          type: "mult",
          value: (lvl) => fallbackArray([1, 1.5], getSequence(2, lvl - 1) * 0.5 + 1, lvl),
        },
      ],
    },
    fasterBuilding: {
      type: "premium",
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 75 };
      },
      effect: [{ name: "queueSpeedVillageBuilding", type: "mult", value: (lvl) => lvl + 1 }],
    },
    moreFaith: {
      type: "premium",
      requirement() {
        return store.state.stat.village_faith.total > 0;
      },
      price(lvl) {
        return { gem_ruby: [2, 3][lvl % 2] * Math.pow(2, Math.floor(lvl / 2)) * 80 };
      },
      effect: [
        { name: "currencyVillageFaithGain", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
        { name: "currencyVillageFaithCap", type: "mult", value: (lvl) => lvl * 0.25 + 1 },
      ],
    },
    morePlantFiber: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.village_plantFiber.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 275 };
      },
      effect: [
        { name: "currencyVillagePlantFiberGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyVillagePlantFiberCap", type: "mult", value: (l     cap: 1,
      requirement() {
        ret return { gem_ruby: Math.pow(2, lvl) * 275 };
      },
      effect: [
        { name: "currencyVillageWoodGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyVillageWoodCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    moreStone: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.village_stone.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 275 };
      },
      effect: [
        { name: "currencyVillageStoneGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyVillageStoneCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    moreMetal: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.village_metal.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 375 };
      },
      effect: [
        { name: "currencyVillageMetalGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyVillageMetalCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    moreWater: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.village_water.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 450 };
      },
      effect: [
        { name: "currencyVillageWaterGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyVillageWaterCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    moreGlass: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.village_glass.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 600 };
      },
      effect: [
        { name: "currencyVillageGlassGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyVillageGlassCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
t() {
        return store.state.stat.vi Math.pow(2, lvl) * 900 };
      },
      effect: [
        { name: "currencyVillageHardwoodGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyVillageHardwoodCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    moreGem: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.village_gem.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 900 };
      },
      effect: [
        { name: "currencyVillageGemGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyVillageGemCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    moreKnowledge: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.village_knowledge.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 675 };
      },
      effect: [{ name: "currencyVillageKnowledgeGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) }],
    },
    moreScience: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.village_science.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 1300 };
      },
      effect: [{ name: "currencyVillageScienceGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) }],
    },
    moreOil: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.village_oil.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 1800 };
      },
      effect: [
        { name: "currencyVillageOilGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyVillageOilCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
    moreMarble: {
      type: "premium",
      cap: 1,
      requirement() {
        return store.state.stat.village_marble.total > 0;
      },
      price(lvl) {
        return { gem_ruby: Math.pow(2, lvl) * 2250 };
      },
      effect: [
        { name: "currencyVillageMarbleGain", type: "mult", value: (lvl) => Math.pow(1.75, lvl) },
        { name: "currencyVillageMarbleCap", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
      ],
    },
  },
  "modules/village/upgradePrestige": {
    arch: {
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(1.35, lvl) * 50 };
      },
      effect: [{ name: "villageWorker", type: "base", value: (lvl) => lvl * 2 }],
    },
    holyGrass: {
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(1.65, lvl) * 50 };
      },
      effect: [
        { name: "currencyVillagePlantFiberGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillagePlantFiberCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ]rn { village_blessing: Math.pow(1.65, lvl) * "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageWoodCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    holyRock: {
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(1.65, lvl) * 50 };
      },
      effect: [
        { name: "currencyVillageStoneGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageStoneCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    holyMetal: {
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(1.65, lvl) * 70 };
      },
      effect: [
        { name: "currencyVillageMetalGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageMetalCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    churchTax: {
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(1.85, lvl) * 80 };
      },
      effect: [{ name: "villageTaxRate", type: "mult", value: (lvl) => Math.pow(1.1, lvl) }],
    },
    holyWater: {
      name: "holyWater",
      feature: "village",
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(1.65, lvl) * 90 };
      },
      effect: [
        { name: "currencyVillageWaterGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageWaterCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    holyGlass: {
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(1.65, lvl) * 100 };
      },
      effect: [
        { name: "currencyVillageGlassGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageGlassCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    holyCrane: {
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(2.15, lvl) * 125 };
      },
      effect: [
        { name: "queueSpeedVillageBuilding", type: "base", value: (lvl) => lvl },
        { name: "queueSpeedVillageBuilding", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    monk: {
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(1.85, lvl) * 150 };
      },
      effect: [
        { name: "currencyVillageKnowledgeGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageKnowledgeCap", type: "base", value: (lvl) => lvl * 10 },
      ],
    },
    holyPiggyBank: {
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(2.3, lvl) * 200 };
      },
      effect: [{ name: "currencyVillageCoinCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) }],
    },
    deepWorship: {
      type: "prestige",
      price(lvl) {
        return { village_blessing: Math.pow(2.75, lvl) * 250 };
      },
      effect: [{ name: "currencyVillageFaithCap", type: "mult", value: (lvl) => Math.pow(1.5, lvl) }],
    },
    cityPlanning: {
      type: "prestige",
      cap: 5,
      requirement() {
        return store.state.unlock.villageBuildings4.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(3.2, lvl) * 1750 };
      },
      effect: [{ name: "villageHousingCap", type: "base", value: (lvl) => lvl * 5 }],
    },
    managers: {
      type: "prestige",
      cap: 5,
      requirement() {
        return store.state.unlock.villageBuildings4.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(3.2, lvl) * 2100 };
      },
      effect: [{ name: "villageWorkstationCap", type: "base", value: (lvl) => lvl * 2 }],
    },
    warehouse: {
      type: "prestige",
      cap: 6,
      requirement() {
        return store.state.unlock.villageBuildings4.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(3.3, lvl) * 1300 };
      },
      effect: [
        { name: "village_storage"e", type: "keepUpgrade", value: (lvl) => lvl >= 2 }},
        { name: "village_aquarium", type: "keepUpgrade", value: (lvl) => lvl >= 4 },
        { name: "village_knowledgeTower", type: "keepUpgrade", value: (lvl) => lvl >= 5 },
        { name: "village_bigStorage", type: "keepUpgrade", value: (lvl) => lvl >= 6 },
      ],
    },
    sandstone: {
      type: "prestige",
      raiseOtherCap: "village_obelisk",
      cap: 10,
      note: "village_22",
      requirement() {
        return store.state.unlock.villageBuildings4.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(2.25, lvl) * 1500 };
      },
      effect: [{ name: "upgradeVillageObeliskCap", type: "base", value: (lvl) => lvl }],
    },
    holyForest: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageBuildings4.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(1.65, lvl) * 1800 };
      },
      effect: [
        { name: "currencyVillageHardwoodGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageHardwoodCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    holyGem: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageBuildings4.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(1.65, lvl) * 1800 };
      },
      effect: [
        { name: "currencyVillageGemGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageGemCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    deeperWorship: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageBuildings5.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(lvl * 0.15 + 1.75, lvl) * buildNum(40, "K") };
      },
      effect: [
        { name: "currencyVillageFaithCap", type: "base", value: (lvl) => lvl * 20 },
        { name: "currencyVillageFaithCap", type: "mult", value: (lvl) => Math.pow(1.3, lvl) },
      ],
    },
    holyLab: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageBuildings5.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(1.85, lvl) * buildNum(70, "K") };
      },
      effect: [
        { name: "currencyVillageScienceGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageScienceCap", type: "base", value: (lvl) => lvl * 10 },
      ],
    },
    charity: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageBuildings5.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(2.35, lvl) * buildNum(120, "K") };
      },
      effect: [
        { name: "currencyVillageJoyGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "villageHappiness", type: "base", value: (lvl) => lvl * 0.01 },
      ],
    },
    holyOil: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageBuildings6.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(1.65, lvl) * buildNum(75, "M") };
      },
      effect: [
        { name: "currencyVillageOilGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageOilCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    holyMarble: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageBuildings6.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(1.65, lvl) * buildNum(110, "M") };
      },
      effect: [
        { name: "currencyVillageMarbleGain", type: "mult", value: (lvl) => lvl * 0.2 + 1 },
        { name: "currencyVillageMarbleCap", type: "mult", value: (lvl) => Math.pow(1.25, lvl) },
      ],
    },
    calmingSpeech: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageBuildings6.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(0.08 * lvl + 1.8, lvl) * buildNum(150, "M") };
      },
      effect: [{ name: "villagePollutionTolerance", type: "base", value: (lvl) => lvl }],
    },
    holyLoot: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageBuildings7.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(1.65, lvl) * buildNum(800, "M") };
      },
      effect: [{ name: "villageLootGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.1 + 1) }],
    },
    holyChisel: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageBuildings7.see;
      },
      price(lvl) {
        return { village_blessing: Math.pow(0.05 * lvl + 1.5, lvl) * buildNum(2.5, "B") };
      },
      effect: [{ name: "villageLootQuality", type: "base", value: (lvl) => lvl * 2 }],
    },
    hireArtisans: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageCraftingSubfeature.see;
      },
      price(lvl) {
        return { village_shares: Math.pow(10, getSequence(1, lvl)) * 10 };
      },
      effect: [{ name: "villageArtisan", type: "base", value: (lvl) => lvl }],
    },
    hireWorkers: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageCraftingSubfeature.see;
      },
      price(lvl) {
        return { village_shares: Math.pow(lvl * 0.02 + 1.65, lvl) * 5 };
      },
      effect: [{ name: "villageMaterialGain", type: "mult", value: (lvl) => Math.pow(1.05, lvl) * (lvl * 0.05 + 1) }],
    },
    hireAccountants: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageCraftingSubfeature.see;
      },
      price(lvl) {
        return { village_shares: Math.pow(1.9, lvl) * 8 };
      },
      effect: [{ name: "currencyVillageCopperCoinCap", type: "mult", value: (lvl) => Math.pow(1.75, lvl) }],
    },
    recipeBook: {
      type: "prestige",
      cap: 6,
      requirement() {
        return store.state.unlock.villageCraftingSubfeature.see;
      },
      price(lvl) {
        return { village_shares: Math.pow(2.5, lvl) * 60 };
      },
      effect: [
        { name: "arrows", type: "villageCraft", value: (lvl) => lvl >= 1 },
        { name: "bowl", type: "villageCraft", value: (lvl) => lvl >= 2 },
        { name: "smallChest", type: "villageCraft", value: (lvl) => lvl >= 3 },
        { name: "chain", type: "villageCraft", value: (lvl) => lvl >= 4 },
        { name: "spear", type: "villageCraft", value: (lvl) => lvl >= 5 },
        { name: "goldenRing", type: "villageCraft", value: (lvl) => lvl >= 6 },
      ],
    },
    adCampaign: {
      type: "prestige",
      requirement() {
        return store.state.unlock.villageCraftingSubfeature.see;
      },
      price(lvl) {
        return { village_shares: Math.pow(lvl * 0.05 + 1.9, lvl) * 80 };
      },
      effect: [
        { name: "currencyVillageCopperCoinGain", type: "mult", value: (lvl) => Math.pow(1.1, lvl) * (lvl * 0.2 + 1) },
      ],
    },
    hireExplorers: {
      type: "prestige",
      cap: 4,
      requirement() {
        return store.state.unlock.villageCraftingSubfeature.see;
      },
      price(lvl) {
        return { village_shares: Math.pow(15, getSequence(1, lvl)) * 575 };
      },
      effect: [
        { name: "villageSpecialIngredient", type: "unlock", value: (lvl) => lvl >= 1 },
        { name: "villageIngredientCount", type: "base", value: (lvl) => (lvl > 1 ? lvl - 1 : null) },
        { name: "villageIngredientBoxAmount", type: "base", value: (lvl) => (lvl > 1 ? 4 * (lvl - 1) : null) },
        { name: "poisonedArrows", type: "villageCraft", value: (lvl) => lvl >= 1 },
        { name: "frostSpear", type: "villageCraft", value: (lvl) => lvl >= 2 },
        { name: "spicySoup", type: "villageCraft", value: (lvl) => lvl >= 3 },
        { name: "stopwatch", type: "villageCraft", value: (lvl) => lvl >= 4 },
        { name: "villageIngredientBoxGet", type: "text", value: (lvl) => lvl },
      ],
      onBuy() {
        store.dispatch("consumable/gain", { name: "village_ingredientBox", amount: 3 });
      },
    },
    hireGardeners: {
      type: "prestige",
      requirement() {
        return store.state.upgrade.item.village_woodBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_shares: Math.pow(1.75, lvl) * 140 };
      },
      effect: [
        { name: "currencyVillagePlantFiberGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageWoodGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillagePlantFiberCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "currencyVillageWoodCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
      ],
    },
    hireMiners: {
      type: "prestige",
      requirement() {
        return store.state.upgrade.item.village_metalBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_shares: Math.pow(1.75, lvl) * 220 };
      },
      effect: [
        { name: "currencyVillageStoneGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageMetalGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageStoneCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "currencyVillageMetalCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
      ],
    },
    hireBartenders: {
      type: "prestige",
      requirement() {
        return store.state.upgrade.item.village_glassBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_shares: Math.pow(1.75, lvl) * 335 };
      },
      effect: [
        { name: "currencyVillageWaterGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageGlassGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageWaterCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "currencyVillageGlassCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
      ],
    },
    hireExperts: {
      type: "prestige",
      requirement() {
        return store.state.upgrade.item.village_gemBin.highestLevel >= 1;
      },
      price(lvl) {
        return { village_shares: Math.pow(1.75, lvl) * 520 };
      },
      effect: [
        { name: "currencyVillageHardwoodGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageGemGain", type: "mult", value: (lvl) => lvl * 0.1 + 1 },
        { name: "currencyVillageHardwoodCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
        { name: "currencyVillageGemCap", type: "mult", value: (lvl) => Math.pow(1.2, lvl) },
      ],
    },
  },
  "modules/village": {
    name: "village",
    tickspeed: 1,
    unlockNeeded: "villageFeature",
    forceTick(seconds, oldTime, newTime) {
      // Get free boxes
      if (store.state.unlock.villageSpecialIngredient.use) {
        const dayDiff = Math.floor(newTime / (SECONDS_PER_DAY * 7)) - Math.floor(oldTime / (SECONDS_PER_DAY * 7));
        if (dayDiff > 0) {
          store.dispatch("consumable/gain", { name: "village_ingredientBox", amount: dayDiff });
        }
      }
    },
    tick(seconds) {
      store.commit("stat/add", { feature: "village", name: "timeSpent", value: seconds });
      let diffs = {};
      store.getters["currency/list"]("village", "regular")
        .filter((elem) => !["village_coin", "village_joy"].includes(elem))
        .forEach((currency) => {
          const gain = store.getters["mult/get"](store.getters["currency/gainMultName"](...currency.split("_")));
          if (gain > 0) {
            if (diffs[currency] === undefined) {
              diffs[currency] = 0;
            }
            diffs[currency] += gain * seconds;
          }
        });
      if (store.state.system.features.village.currentSubfeature === 0) {
        store.dispatch("upgrade/tickQueue", {
          key: "village_building",
          seconds: seconds * store.getters["mult/get"]("queueSpeedVillageBuilding"),
        });
        const happiness = store.getters["mult/get"]("villageHappiness");
        if (store.state.stat.village_faith.total >= 50) {
          store.commit("unlock/unlock", "villagePrestige");
        } // Auto-gain 1% of offerings gained this run
        const offeringGain = store.getters["village/offeringPerSecond"];
        if (offeringGain > 0) {
          let newOffering = store.state.village.offeringGen + offeringGain * seconds;
          if (newOffering > 0) {
            store.dispatch("currency/gain", { feature: "village", name: "offering", amount: Math.floor(newOffering) });
            newOffering -= Math.floor(newOffering);
          }
          store.commit("village/updateKey", { key: "offeringGen", value: newOffering });
        }
        const joyGain = store.getters["village/joyGainBase"];
        if (joyGain > 0) {
          store.dispatch("currency/gain", {
            feature: "village",
            name: "joy",
            gainMult: true,
            amount: joyGain * seconds,
          });
        }
        if (happiness <= VILLAGE_MIN_HAPPINESS) {
          store.commit("stat/increaseTo", { feature: "village", name: "minHappiness", value: 1 });
        }
        const lootGain = store.getters["mult/get"]("villageLootGain");
        if (lootGain > 0) {
          let newLoot = store.state.village.explorerProgress + (seconds * lootGain) / SECONDS_PER_HOUR;
          if (newLoot >= 1) {
            const lootDrops = Math.floor(newLoot);
            store.dispatch("village/getLootDrops", lootDrops);
            newLoot -= lootDrops;
          }
          store.commit("village/updateKey", { key: "explorerProgress", value: newLoot });
          store.commit("unlock/unlock", "villageLoot");
        }
        store.commit("stat/increaseTo", {
          feature: "village",
          name: "highestPower",
          value: store.getters["mult/get"]("villagePower"),
        });
      } else if (store.state.system.features.village.currentSubfeature === 1) {
        for (let p = 0; p < 2; p++) {
          for (const [key, elem] of Object.entries(store.state.village.crafting)) {
            if (elem.isCrafting && elem.prio === p) {          const payments = Math.ceil(newProgress) t maxAfford = payments;
                for (const [currency, value] of Object.entries(elem.price)) {
                  const split = currency.split("_");
                  if (elem.isSpecial) {
                    let newMaxAfford = 0;
                    let accumulatedPrice = 0;
                    while (newMaxAfford < maxAfford) {
                      accumulatedPrice += value(elem.owned + newMaxAfford);
                      if (split[0] === "craft") {
                        if (store.state.village.crafting[split[1]].owned < accumulatedPrice) {
                          break;
                        }
                      } else {
                        // Can't afford any if cap is to small
                        if (
                          store.state.currency[currency].cap !== null &&
                          store.state.currency[currency].cap < value(elem.owned + newMaxAfford)
                        ) {
                          break;
                        }
                        if (store.state.currency[currency].value + (diffs[currency] ?? 0) < accumulatedPrice) {
                          break;
                        }
                      }
                      newMaxAfford++;
                    }
                    maxAfford = newMaxAfford;
                  } else {
                    if (split[0] === "craft") {
                      maxAfford = Math.min(Math.floor(store.state.village.crafting[split[1]].owned / value), maxAfford);
                    } else {
                      // Can't afford any if cap is to small
                      if (store.state.currency[currency].cap !== null && store.state.currency[currency].cap < value) {
                        maxAfford = 0;
                      }
                      maxAfford = Math.min(
                        Math.floor((store.state.currency[currency].value + (diffs[currency] ?? 0)) / value),
                        maxAfford,
                      );
                    }
                  }
                }
                if (maxAfford > 0) {
                  for (const [currency, value] of Object.entries(elem.price)) {
                    const split = currency.split("_");
                    let priceValue = 0;
                    if (elem.isSpecial) {
                      for (let i = 0; i < maxAfford; i++) {
                        priceValue += value(elem.owned + i);
                      }
                    } else {
                      priceValue = value * maxAfford;
                    }
                    if (split[0] === "craft") {
                      store.commit("village/updateSubkey", {
                        key: "crafting",
                        name: split[1],
                        subkey: "owned",
                        value: store.state.village.crafting[split[1]].owned - priceValue,
                      });
                    } else {
                      if (diffs[currency] === undefined) {
                        diffs[currency] = 0;
                      }
                      diffs[currency] -= priceValue;
                    }
                  }
                }
                if (maxAfford < payments) {
                  newProgress = maxAfford + Math.ceil(elem.progress);
                }
              }
              if (newProgress >= 1) {
                store.commit("village/updateSubkey", {
                  key: "crafting",
                  name: key,
                  subkey: "owned",
                  value: elem.owned + Math.floor(newProgress),
                });
                store.commit("village/updateSubkey", {
                  key: "crafting",
                  name: key,
                  subkey: "crafted",
                  value: elem.crafted + Math.floor(newProgress),
                });
                if (elem.isSpecial) {
                  store.dispatch("village/applySpecialCraftEffects", key);
                } else {
                  store.dispatch("village/applyMilestoneEffects", key);
                  store.dispatch("village/applyMilestoneGlobalLevel");
                }
                newProgress -= Math.floor(newProgress);
              }
              store.commit("village/updateSubkey", {
                key: "crafting",
                name: key,
                subkey: "progress",
                value: newProgress,
              });
            }
            if (elem.isSelling && elem.prio === p && elem.sellPrice > 0 && elem.owned > 0) {
              const sold = Math.min(randomRound(seconds * elem.cacheSellChance), elem.owned);
              if (sold > 0) {
                store.dispatch("currency/gain", {
                  feature: "village",
                  name: "copperCoin",
                  gainMult: true,
                  amount: sold * elem.sellPrice,
                });
                store.commit("village/updateSubkey", {
                  key: "crafting",
                  name: key,
                  subkey: "owned",
                  val   }
        }
      } // Apply currency diit = name.split("_");
        if (value > 0) {
          store.dispatch("currency/gain", { feature: split[0], name: split[1], amount: value });
        } else if (value < 0) {
          store.dispatch("currency/spend", { feature: split[0], name: split[1], amount: -value });
        }
      }
      if (store.state.system.features.village.currentSubfeature === 0) {
        const taxpayers = store.getters["mult/get"]("villageTaxRate") * store.getters["village/employed"];
        if (taxpayers > 0) {
          store.getters["currency/list"]("village", "regular", "food").forEach((foodName) => {
            const food = foodName.split("_")[1];
            const foodConsumed = Math.min(taxpayers * seconds, store.getters["currency/value"]("village_" + food));
            if (foodConsumed > 0) {
              store.dispatch("currency/spend", { feature: "village", name: food, amount: foodConsumed });
              store.dispatch("currency/gain", {
                feature: "village",
                name: "coin",
                gainMult: true,
                amount: foodConsumed * VILLAGE_COINS_PER_FOOD,
              });
            }
          });
        }
      }
    },
    unlock: [
      "villageFeature",
      "villageCoinUpgrades",
      "villagePrestige",
      ...buildArray(7).map((elem) => "villageBuildings" + (elem + 1)),
      ...[
        "Scythe",
        "Hatchet",
        "Pickaxe",
        "WateringCan",
        "Investment",
        "Basics",
        "Processing",
        "Pump",
        "Sand",
        "Book",
        "Axe",
        "Bomb",
        "Toll",
        "FishingRod",
        "HolyBook",
        "Breakthrough",
        "ModifiedPlants",
        "Dopamine",
        "Adrenaline",
        "Sprinkler",
        "Greed",
        "Ambition",
        "Understanding",
        "Curiosity",
        "Worship",
        "Bartering",
        "Sparks",
      ].map((elem) => "villageUpgrade" + elem),
      ...buildArray(4).map((elem) => "villageOffering" + (elem + 1)),
      "villageLoot",
      "villageCraftingSubfeature",
      "villageSpecialIngredient",
    ],
    stat: {
      maxBuilding: { showInStatistics: true },
      maxHousing: {},
      timeSpent: { display: "time" },
      bestPrestige0: { showInStatistics: true },
      bestPrestige1: { showInStatistics: true },
      prestigeCount: { showInStatistics: true },
      minHappiness: {},
      highestPower: { showInStatistics: true },
    },
    mult: {
      villageWorker: { baseValue: 1, round: true },
      villageArtisan: { baseValue: 1, round: true },
      villageCounter: { baseValue: 1, round: true },
      queueSpeedVillageBuilding: { baseValue: 1 },
      villageTaxRate: { display: "percent" },
      villageHappiness: { display: "percent", baseValue: 1, min: VILLAGE_MIN_HAPPINESS },
      villagePollution: { round: true },
      villagePollutionTolerance: { baseValue: 5, round: true },
      villagePower: { min: 0 },
      villageOfferingPower: {},
      villageIngredientCount: { baseValue: 1, round: true },
      villageIngredientBoxAmount: { baseValue: 12, round: true },
      villagePrestigeIncome: {
        group: ["currencyVillageFaithGain", "currencyVillageFaithCap", "currencyVillageSharesGain"],
      }, // Upgrade cap mults
      villageHousingCap: {},
      villageWorkstationCap: {}, // Gain mults
      villageResourceGain: {},
      villageMaterialGain: {},
      villageFoodGain: {},
      villageMentalGain: {}, // Cap mults
      villageMaterialCap: {}, // Policy limits
      villagePolicyTaxes: { round: true },
      villagePolicyImmigration: { round: true },
      villagePolicyReligion: { round: true },
      villagePolicyScanning: { round: true }, // Loot mults
      villageLootGain: { display: "perHour" },
      villageLootQuality: { round: true },
    },
    multGroup: [
      { mult: "villageHousingCap", name: "upgradeCap", subtype: "housing" },
      { mult: "villageWorkstationCap", name: "upgradeCap", subtype: "workstation" },
      { mult: "villageMaterialGain", name: "currencyGain", subtype: "material" },
      { mult: "villageMaterialCap", name: "currencyCap", subtype: "material" },
      { mult: "villageFoodGain", name: "currencyGain", subtype: "food" },
      { mult: "villageMentalGain", name: "currencyGain", subtype: "mental", blacklist: ["village_faith"] },
      { mult: "villageResourceGain", name: "currencyGain", subtype: "material" },
      { mult: "villageResourceGain", name: "currencyGain", subtype: "food" },
      { mult: "villageResourceGain", name: "currencyGain", subtype: "mental", blacklist: ["village_faith"] },
    ],
    relic,
    achievement,
    currency: {
      coin: {
        overcapMult: 0.5,
        color: "amber",
        icon: "mdi-circle-multiple",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        capMult: { baseValue: 500 },
        gainTimerFunction() {
          const taxpayers = store.getters["mult/get"]("villageTaxRate") * store.getters["village/employed"];
          if (taxpayers <= 0) {
            return 0;
          }
          return store.getters["mult/get"](
            "currencyVillageCoinGain",
            store.getters["currency/list"]("village", "regular", "food")
              .map((currencyName) => {
                const food = currencyName.split("_")[1];
                const nextAmount =
                  store.getters["currency/value"]("village_" + food) +
                  store.getters["mult/get"](store.getters["currency/gainMultName"]("village", food));
                return Math.min(taxpayers, nextAmount) * VILLAGE_COINS_PER_FOOD;
              })
              .reduce((a, b) => a + b, 0),
          );
        },
        timerIsEstimate: true,
      },
      copperCoin: {
        overcapMult: 0.5,
        color: "orange",
        icon: "mdi-circle-multiple",
        gainMult: {},
        capMult: { baseValue: 4000 },
      }, // Basic material
      plantFiber: {
        subtype: "material",
        overcapMult: 0.4,
        color: "green",
        icon: "mdi-leaf",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 2000 },
      },
      wood: {
        subtype: "material",
        overcapMult: 0.4,
        color: "wooden",
        icon: "mdi-tree",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 2000 },
      },
      stone: {
        subtype: "material",
        overcapMult: 0.4,
        color: "grey",
        icon: "mdi-chart-bubble",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 2000 },
      },
      metal: {
        subtype: "material",
        overcapMult: 0.4,
        color: "lighter-grey",
        icon: "mdi-gold",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 1000 },
      },
      water: {
        subtype: "material",
        overcapMult: 0.4,
        color: "blue",
        icon: "mdi-water",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 1000 },
      },
      glass: {
        subtype: "material",
        overcapMult: 0.4,
        color: "cyan",
        icon: "mdi-mirror",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 1000 },
      },
      hardwood: {
        subtype: "material",
        overcapMult: 0.4,
        color: "cherry",
        icon: "mdi-tree",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 1000 },
      },
      gem: {
        subtype: "material",
        overcapMult: 0.4,
        color: "pink",
        icon: "mdi-diamond",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 1000 },
      },
      oil: {
        subtype: "material",
        overcapMult: 0.4,
        color: "pale-green",
        icon: "mdi-oil",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 800 },
      },
      marble: {
        subtype: "material",
        overcapMult: 0.4,
        color: "pale-blue",
        icon: "mdi-mirror-rectangle",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 200 },
      }, // FOOD
      grain: {
        subtype: "food",
        color: "yellow",
        icon: "mdi-barley",
        gainMult: { display: "perSecond" },
        showGainMult: true,
      },
      fruit: {
        subtype: "food",
        color: "red",
        icon: "mdi-food-apple",
        gainMult: { display: "perSecond" },
        showGainMult: true,
      },
      fish: {
        subtype: "food",
        color: "blue-grey",
        icon: "mdi-fish",
        gainMult: { display: "perSecond" },
        showGainMult: true,
      },
      vegetable: {
        subtype: "food",
        color: "orange",
        icon: "mdi-carrot",
        gainMult: { display: "perSecond" },
        showGainMult: true,
      },
      meat: {
        subtype: "food",
        color: "brown",
        icon: "mdi-food-steak",
        gainMult: { display: "perSecond" },
        showGainMult: true,
      }, // Mental resources
      knowledge: {
        subtype: "mental",
        overcapScaling: 0.4,
        color: "lime",
        icon: "mdi-brain",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 100 },
      },
      faith: {
        subtype: "mental",
        overcapMult: 0.9,
        overcapScaling: 0.9,
        color: "amber",
        icon: "mdi-hands-pray",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 200 },
      },
      science: {
        subtype: "mental",
        overcapScaling: 0.4,
        color: "light-blue",
        icon: "mdi-flask",
        gainMult: { display: "perSecond" },
        showGainMult: true,
        showGainTimer: true,
        capMult: { baseValue: 40 },
      },
      joy: {
        subtype: "mental",
        overcapScaling: 0.4,
        color: "pink-purple",
        icon: "mdi-party-popper",
        gainMult: { display: "perSecond" },
        capMult: { baseValue: 250 },
        showGainMult: true,
        gainTimerFunction() {
          return store.getters["mult/get"]("currencyVillageJoyGain", store.getters["village/joyGainBase"]);
        },
      }, // Loot resources
      loot0: { subtype: "loot", color: "light-grey", icon: "mdi-trophy-variant" },
      loot1: { subtype: "loot", color: "green", icon: "mdi-trophy-variant" },
      loot2: { subtype: "loot", color: "indigo", icon: "mdi-trophy-variant" },
      loot3: { subtype: "loot", color: "purple", icon: "mdi-trophy-variant" },
      loot4: { subtype: "loot", color: "amber", icon: "mdi-trophy-variant" },
      loot5: { subtype: "loot", color: "red", icon: "mdi-trophy-variant" }, // Special crafting ingredients
      acidVial: { subtype: "specialIngredient", color: "lime", icon: "mdi-test-tube" },
      snowflake: { subtype: "specialIngredient", color: "cyan", icon: "mdi-snowflake-variant" },
      chiliBundle: { subtype: "specialIngredient", color: "red-orange", icon: "mdi-chili-hot" },
      gears: { subtype: "specialIngredient", color: "blue-grey", icon: "mdi-cogs" }, // Prestige currency
      blessing: { type: "prestige", alwaysVisible: true, color: "yue, color: "beige", icon: "mdi-certificate"ange-red",
        icon: "mdi-candle",
        gainMult: { display: "perHour" },
        showGainMult: true,
        gainTimerFunction() {
          return store.getters["village/offeringPerSecond"] * SECONDS_PER_HOUR;
        },
      },
    },
    upgrade: { ...upgradeBuilding, ...upgrade, ...upgrade2, ...upgradePrestige, ...upgradePremium, ...bookVillage },
    note: [...buildArray(31).map(() => "g"), "system"],
    consumable: { ingredientBox: { icon: "mdi-gift", color: "indigo", price: { gem_sapphire: 80 } } },
    init() {
      for (const [key, elem] of Object.entries(job)) {
        store.commit("village/initJob", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(offering)) {
        store.commit("village/initOffering", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(policy)) {
        store.commit("village/initPolicy", { name: key, ...elem });
      }
      for (const [key, elem] of Object.entries(craftingRecipe)) {
        store.commit("village/initCrafting", { name: key, ...elem });
      }
    },
    saveGame() {
      let obj = { job: {} };
      for (const [key, elem] of Object.entries(store.state.village.job)) {
        if (elem.amount > 0) {
          obj.job[key] = elem.amount;
        }
      }
      if (store.state.unlock.villageOffering1.see) {
        obj.offering = {};
        for (const [key, elem] of Object.entries(store.state.village.offering)) {
          if (elem.offeringBought > 0 || elem.upgradeBought > 0) {
            obj.offering[key] = [elem.offeringBought, elem.upgradeBought];
          }
        }
      }
      let policies = {};
      let hasPolicy = false;
      for (const [key, elem] of Object.entries(store.state.village.policy)) {
        if (elem.value !== 0) {
          policies[key] = elem.value;
          hasPolicy = true;
        }
      }
      if (hasPolicy) {
        obj.policy = policies;
      }
      if (store.state.village.explorerProgress > 0) {
        obj.explorerProgress = store.state.village.explorerProgress;
      }
      if (store.state.village.offeringGen > 0) {
        obj.offeringGen = store.state.village.offeringGen;
      } // Add crafting stuff
      let crafting = {};
      for (const [key, elem] of Object.entries(store.state.village.crafting)) {
        if (
          elem.crafted > 0 ||
          elem.isCrafting ||
          elem.isSelling ||
          elem.sellPrice !== elem.baseValue ||
          elem.progress > 0
        ) {
          crafting[key] = {
            isCrafting: elem.isCrafting,
            isSelling: elem.isSelling,
            sellPrice: elem.sellPrice,
            progress: elem.progress,
            owned: elem.owned,
            crafted: elem.crafted,
          };
        }
      }
      if (Object.keys(crafting).length > 0) {
        obj.crafting = crafting;
      }
      return obj;
    },
    loadGame(data) {
      if (data.job !== undefined) {
        for (const [key, elem] of Object.entries(data.job)) {
          if (store.state.village.job[key] !== undefined) {
            store.commit("village/updateJobKey", { name: key, key: "amount", value: elem });
          }
        }
      }
      if (data.offering !== undefined) {
        for (const [key, elem] of Object.entries(data.offering)) {
          if (store.state.village.offering[key] !== undefined) {
            store.commit("village/updateOfferingKey", { name: key, key: "offeringBought", value: elem[0] });
            store.commit("village/updateOfferingKey", { name: key, key: "upgradeBought", value: elem[1] });
          }
        }
      }
      if (data.policy !== undefined) {
        for (const [key, elem] of Object.entries(data.policy)) {
          if (store.state.village.policy[key] !== undefined) {
            store.commit("village/updatePolicyKey", { name: key, key: "value", value: elem });
            store.dispatch("village/applyPolicyEffect", key);
          }
        }
      }
      if (data.crafting !== undefined) {
        for (const [key, elem] of Object.entries(data.crafting)) {
          if (store.state.village.crafting[key] !== undefined) {
            store.commit("village/updateSubkey", {
              key: "crafting",
              name: key,
              subkey: "isCrafting",
              value: elem.isCrafting,
            });
            store.commit("village/updateSubkey", {
              key: "crafting",
              name: key,
              subkey: "isSelling",
              value: elem.isSelling,
            });
            store.commit("village/updateSubkey", {
              key: "crafting",
              name: key,
              subkey: "sellPrice",
              value: elem.            key: "crafting",
            s,
            });
            store.commit("village/updateSubkey", { key: "crafting", name: key, subkey: "owned", value: elem.owned });
            store.commit("village/updateSubkey", {
              key: "crafting",
              name: key,
              subkey: "crafted",
              value: elem.crafted,
            });
            if (store.state.village.crafting[key].isSpecial) {
              if (elem.owned > 0) {
                store.dispatch("village/applySpecialCraftEffects", key);
              }
            } else {
              store.dispatch("village/applyMilestoneEffects", key);
            }
          }
        }
      }
      if (data.explorerProgress !== undefined) {
        store.commit("village/updateKey", { key: "explorerProgress", value: data.explorerProgress });
      }
      if (data.offeringGen !== undefined) {
        store.commit("village/updateKey", { key: "offeringGen", value: data.offeringGen });
      }
      store.dispatch("village/applyAllJobs");
      store.dispatch("village/applyOfferingEffect");
    },
  },
  "theme/autumnForest": {
    hasParticles: true,
    particles: {
      icons: ["mdi-leaf", "mdi-leaf-maple"],
      colors: ["light-green", "yellow", "amber", "orange", "orange-red", "brown", "cherry"],
      opacity: [20, 70],
      size: [20, 80],
      time: [4, 12],
      amount: 4,
      rotate: true,
    },
    light: { primary: "#74401B", secondary: "#424242", accent: "#503D30" },
    dark: { primary: "#74401B", secondary: "#424242", accent: "#503D30" },
  },
  "theme/brown": {
    price: 1000,
    light: { primary: "#72400D", secondary: "#424242", accent: "#D2802D" },
    dark: { primary: "#72400D", secondary: "#424242", accent: "#D2802D" },
  },
  "theme/candlelight": { hasCustomBackground: true },
  "theme/cherry": {
    price: 6000,
    hasCustomBackground: true,
    light: { primary: "#E963D2", secondary: "#424242", accent: "#4D331A" },
    dark: { primary: "#EF8FDF", secondary: "#424242", accent: "#604020" },
  },
  "theme/colorful": {
    hasCustomColors: true,
    light: {
      primary: "#D94712",
      secondary: "#424242",
      accent: "#FFA182",
      error: filterColor(_default.light.error, colorFilter),
      info: filterColor(_default.light.info, colorFilter),
      success: filterColor(_default.light.success, colorFilter),
      warning: filterColor(_default.light.warning, colorFilter),
      ...filterColorObject(colors, colorFilter),
    },
    dark: {
      primary: "#D94712",
      secondary: "#424242",
      accent: "#FFA182",
      error: filterColor(_default.dark.error, colorFilter),
      info: filterColor(_default.dark.info, colorFilter),
      success: filterColor(_default.dark.success, colorFilter),
      warning: filterColor(_default.dark.warning, colorFilter),
      ...filterColorObject(colors, colorFilter),
    },
  },
  "theme/cyan": {
    price: 1000,
    light: { primary: "#19D2D2", secondary: "#424242", accent: "#82FFFF" },
    dark: { primary: "#19D2D2", secondary: "#424242", accent: "#82FFFF" },
  },
  "theme/default": {
    owned: true,
    light: {
      primary: "#1976D2",
      secondary: "#424242",
      accent: "#82B1FF",
      error: "#FF5252",
      info: "#2196F3",
      success: "#4CAF50",
      warning: "#FFC107",
      primary: "#1976D2",
      secondary: "#42424  success: "#4CAF50",
      warning: "#FFC107",
      contrast: "#FFFFFF",
      ...shades,
      ...colors,
    },
  },
  "theme/factory": {
    price: 4000,
    hasCustomBackground: true,
    light: { primary: "#5F6264", secondary: "#A85817", accent: "#82B1FF" },
    dark: { primary: "#8D9296", secondary: "#A85817", accent: "#82B1FF" },
  },
  "theme/forest": {
    price: 5000,
    hasCustomBackground: true,
    light: { primary: "#29C229", secondary: "#B76715", accent: "#92EF92" },
    dark: { primary: "#1C831C", secondary: "#72400D", accent: "#92EF92" },
  },
  "theme/frozen": {
    hasCustomColors: true,
    hasParticles: true,
    particles: {
      icons: ["mdi-snowflake", "mdi-snowflake-variant"],
      colors: ["white"],
      opacity: [10, 40],
      size: [10, 50],
      time: [5, 30],
      amount: 3,
      rotate: true,
    },
    light: {
      primary: filterColor(frozenBase, (color) => color.desaturate(0.6)),
      secondary: "#424242",
      accent: filterColor(frozenBase, (color) => color.desaturate(0.7).lighten(0.3)),
      error: filterColor(_default.light.error, frozenFilter),
      info: filterColor(_default.light.info, frozenFilter),
      success: filterColor(_default.light.success, frozenFilter),
      warning: filterColor(_default.light.warning, frozenFilter),
      ...filterColorObject(colors, frozenFilter),
    },
    dark: {
      primary: filterColor(frozenBase, (color) => color.desaturate(0.6)),
      secondary: "#424242",
      accent: filterColor(frozenBase, (color) => color.desaturate(0.7).lighten(0.3)),
      error: filterColor(_default.dark.error, frozenFilter),
      info: filterColor(_default.dark.info, frozenFilter),
      success: filterColor(_default.dark.success, frozenFilter),
      warning: filterColor(_default.dark.warning, frozenFilter),
      ...filterColorObject(colors, frozenFilter),
    },
  },
  "theme/green": {
    price: 1000,
    light: { primary: "#29C229", secondary: "#424242", accent: "#92EF92" },
    dark: { primary: "#29C229", secondary: "#424242", accent: "#92EF92" },
  },
  "theme/grey": {
    price: 1000,
    light: { primary: "#787878", secondary: "#424242", accent: "#C0C0C0" },
    dark: { primary: "#787878", secondary: "#424242", accent: "#C0C0C0" },
  },
  "theme/orange": {
    price: 1000,
    light: { primary: "#DF760C", secondary: "#424242", accent: "#FFC182" },
    dark: { primary: "#DF760C", secondary: "#424242", accent: "#FFC182" },
  },
  "theme/pink": {
    price: 1000,
    light: { primary: "#D219D2", secondary: "#424242", accent: "#FF82FF" },
    dark: { primary: "#D219D2", secondary: "#424242", accent: "#FF82FF" },
  },
  "theme/polar": {
    price: 8000,
    hasCustomBackground: true,
    light: { primary: "#267373", secondary: "#424242", accent: "#66CC66" },
    dark: { primary: "#66CCCC", secondary: "#424242", accent: "#267326" },
  },
  "theme/prismatic": {
    price: buildNum(50, "K"),
    hasCustomNavbar: true,
    hasCustomBackground: true,
    hasAnimations: true,
  },
  "theme/purple": {
    price: 1000,
    light: { primary: "#7619D2", secondary: "#424242", accent: "#C182FF" },
    dark: { primary: "#7619D2", secondary: "#424242", accent: "#C182FF" },
  },
  "theme/rain": {
    hasCustomNavbar: true,
    hasAnimations: true,
    hasParticles: true,
    particles: {
      icons: ["mdi-water"],
      colors: ["light-blue", "blue", "dark-blue", "indigo"],
      opacity: [10, 30],
      size: [15, 25],
      time: [2, 4],
      amount: 6,
      rotate: false,
    },
    light: { primary: "#2A53B3", secondary: "#424242", accent: "#275A39" },
    dark: { primary: "#2A53B3", secondary: "#424242", accent: "#275A39" },
  },
  "theme/red": {
    price: 1000,
    light: { primary: "#D21919", secondary: "#424242", accent: "#FF8282" },
    dark: { primary: "#D21919", secondary: "#424242", accent: "#FF8282" },
  },
  "theme/sepia": {
    price: 3000,
    hasCustomColors: true,
    light: {
      primary: filterColor(sepiaBase, (color) => color.desaturate(0.4)),
      secondary: "#424242",
      accent: filterColor(sepiaBase, (color) => color.desaturate(0.7).lighten(0.5)),
      error: filterColor(_default.light.error, sepiaFilter),
      info: filterColor(_default.light.info, sepiaFilter),
      success: filterColor(_default.light.success, sepiaFilter),
      warning: filterColor(_default.light.warning, sepiaFilter),
      ...filterColorObject(colors, sepiaFilter),
    },
    dark: {
      primary: filterColor(sepiaBase, (color) => color.desaturate(0.4)),
      secondary: "#424242",
      accent: filterColor(sepiaBase, (color) => color.desaturate(0.7).lighten(0.5)),
      error: filterColor(_default.dark.error, sepiaFilter),
      info: filterColor(_default.dark.info, sepiaFilter),
      success: filterColor(_default.dark.success, sepiaFilter),
      warning: filterColor(_default.dark.warning, sepiaFilter),
      ...filterColorObject(colors, sepiaFilter),
    },
  },
  "theme/shades": {
    black: "#000000",
    "darkest-grey": "#202020",
    "darker-grey": "#404040",
    "dark-grey": "#606060",
    grey: {
      base: "#9e9e9e",
      lighten5: "#fafafa",
      lighten4: "#f5f5f5",
      lighten3: "#eeeeee",
      lighten2: "#e0e0e0",
      lighten1: "#bdbdbd",
      darken1: "#757575",
      darken2: "#616161",
      darken3: "#424242",
      darken4: "#212121",
    },
    "lightest-grey": "#E0E0E0",
    "lighter-grey": "#C0C0C0",
    "light-grey": "#A0A0A0",
    white: "#FFFFFF",
  },
  "theme/sky": {
    price: buildNum(10, "K"),
    hasCustomNavbar: true,
    hasCustomBackground: true,
    light: { primary: "#E89820", secondary: "#A0A0A0", accent: "#D18147" },
    dark: { primary: "#E89820", secondary: "#A0A0A0", accent: "#D18147" },
  },
  "theme/themes": {
    default: defaultTheme,
    cyan,
    green,
    yellow,
    orange,
    brown,
    red,
    pink,
    purple,
    grey,
    sepia,
    factory,
    forest,
    cherry,
    polar,
    sky,
    prismatic,
    candlelight,
    colorful,
    rain,
    waves,
    autumnForest,
    frozen,
  },
  "theme/waves": { hasCustomBackground: true },
  "theme/yellow": {
    price: 1000,
    light: { primary: "#D2D219", secondary: "#424242", accent: "#FFFF82" },
    dark: { primary: "#D2D219", secondary: "#424242", accent: "#FFFF82" },
  },
};
