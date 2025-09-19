{
  "src/js/modules/achievement.js": {
    "name": "achievement",
    "tickspeed": 1,
    "relic": {
      "excavator": {
        "icon": "mdi-excavator",
        "effect": [
          {
            "name": "currencyMiningScrapGain",
            "type": "mult",
            "value": 2
          }
        ]
      }
    },
    "saveGame": {
      "_type": "formula",
      "code": "saveGame() { let obj = {}; ... return obj; }"
    }
  },
  "src/lang/zh/card.js": {
    "cardPack": "卡包",
    "cardsSuffix": "卡片"
  }
}