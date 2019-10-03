<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/temp_logo.png" class="logo">

    <div class="el-toggle">
      <toggle-button @change="onChangeEventHandler"
                      :labels="{checked: 'Stop Tracking', unchecked: 'Start Tracking'}" 
                      :color="{checked: '#FF0000', unchecked: '#00FF00', disabled: '#CCCCCC'}"
                      :width=104 
                       />
    </div>

    <div class="players" v-if="this.player.name">
      <p>{{this.player}}</p>
      <h3>vs</h3>
      <p>{{this.opponent}}</p>
      <br>
      <p v-if="this.match.game">{{this.match}}</p>
    </div>

    <hr>
    <div class="tracking">
      <h3>Tracking logs:</h3>
      <input type="text" value="C:\Program Files (x86)\Hearthstone\Hearthstone_Data\output_log.txt">
    </div>

    <h4>Beta Software :)</h4>
  </div>
</template>

<script>
import * as fs from 'fs';
const chokidar = require('chokidar');
const splitLines = require('split-lines');
import {FSWatcher} from 'chokidar';

let _watcher = FSWatcher;
let player;
let opponent;
let entity;
let match;

export default {
  name: 'app',
  data: function() {
    return {
      lastFileSize: 0,
      player: {
        name: '',
        position: 0,
        entity: ''
      },
      opponent: {
        name: '',
        position: 0,
        entity: ''
      },
      match: {
        server: '',
        game: '',
        client: '',
        spectateKey: ''
      }
    };
  },
  methods: {
    onChangeEventHandler(value){
      if (value.value == true) {
        this.startLog()
      } else {
        this.stopLog()
      }
    },
    startLog() {
      const watcher = chokidar.watch("C:\\Program Files (x86)\\Hearthstone\\Hearthstone_Data\\output_log.txt", {
        persistent: true,
        disableGlobbing: true,
        usePolling: true
      });

      watcher.on('ready', () => {
      });

      // watcher.on('add', (filePath, stats) => {
      //   if (stats) {
      //     this.update(filePath, stats);
      //   }
      // });

      watcher.on('change', (filePath, stats) => {
        if (stats) {
          this.update(filePath, stats);
        }
      });

      this._watcher = watcher;
    },
    stopLog() {
      if (!this._watcher) {
        return
      }

      this._watcher.close()
      this._watcher = null
      this.lastFileSize = 0
      
      this.player = {
        name: '',
        position: 0
      }
      this.opponent = {
        name: '',
        position: 0
      }
      this.match = {
        server: '',
        game: '',
        client: '',
        spectateKey: ''
      }
    },
    update: function (filePath, stats) {
      const newFileSize = stats.size;
      let sizeDiff = newFileSize - this.lastFileSize;
      if (sizeDiff < 0) {
        sizeDiff = newFileSize;
      }
      
      const buffer = Buffer.alloc(sizeDiff);
      const fileDescriptor = fs.openSync(filePath, 'r');
      fs.readSync(fileDescriptor, buffer, 0, sizeDiff, this.lastFileSize);
      fs.closeSync(fileDescriptor);
      this.lastFileSize = newFileSize;

      this.parseBuffer(buffer);
    },
    parseBuffer: function(buffer) {

      splitLines(buffer.toString()).forEach(line => {
        // grab players name
        if (player = line.match(/\[Power\] GameState\.DebugPrintGame\(\) - PlayerID=(\d), PlayerName=(.*)$/)) {
          const index = player[1]
          const name = player[2]

          if (index == 1) {
            // check if name UNKNOWN
            if (name == 'UNKNOWN HUMAN PLAYER') {
              // opponent has position 1
              this.player.position = 2
              this.opponent.name = name
              this.opponent.position = 1
            } else {
              // player has position 1
              this.player.name = name
              this.player.position = 1
              this.opponent.position = 2
            }
          } else {
            if (name != 'UNKNOWN HUMAN PLAYER') {
              this.player.name = name
            } else {
              this.opponent.name = name
            }
          }
        }

        // grab the opponents name
        if (opponent = line.match(/\[Power\] GameState.DebugPrintEntitiesChosen\(\) - id=(\d) Player=([^\s]+) EntitiesCount/)) {
          const index = opponent[1]
          const name = opponent[2]

          if (this.opponent.position == index) {
            this.opponent.name = name
          }
        }

        // get player and opponent entity
        if (entity = line.match(/\[Power\] PowerTaskList\.DebugPrintPower\(\) -     FULL_ENTITY - Updating \[entityName=([^\s]+) id=([^\s]+) zone=PLAY zonePos=0 cardId=([^\s]+) player=(\d)/)) {
          const index = entity[4]
          const name = entity[1]

          if (index == this.player.position) {
            this.player.entity = name
          }

          if (index == this.opponent.position) {
            this.opponent.entity = name
          }
        }

        // get match data
        if (match = line.match(/\Network\.GotoGameServer -- address= ([^\s]+) game=([^\s]+) client=([^\s]+) spectateKey=([^\s]+)/)) {
          this.match = {
            server: match[1],
            game: match[2],
            client: match[3],
            spectateKey: match[4]
          }
        }

        // console.log(line)
      });
    },
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 14px;

  .logo {
    width: 84px;
  }

  .el-toggle {
    margin-top: 10px;
  }

  h1,
  h2,
  h3 {
    margin: 0px;
  }

  .players {
    margin: 14px 0px 18px 0px;

    h3 {
      margin: 11px 0px 6px 0px;
    }
  }

  .tracking {
    text-align: left;

    h3 {
      margin: 0px 0px 7px 0px;
    }

    input {
      width: 100%;
    }
  }
}
</style>
