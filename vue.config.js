module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        "appId": "com.innkeep.battles",
        "productName": "InnKeep Companion",
        "win": {
          "certificateFile": "../innkeep-elec.pfx",
          "certificatePassword": "",
          publish: [
            {
              provider: "github"
            }
          ],
          "target": [
            {
              "target": "nsis",
              "arch": [
                "x64",
                "ia32"
              ]
            }
          ]
        }
      }
    }
  }
}