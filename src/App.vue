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

    <div class="players" v-if="this.players[0]">
      <p>{{this.players[0]}}</p>
      <h3>vs</h3>
      <p>{{this.players[1]}}</p>
      <p v-if="this.match.game">match id: {{this.match.game}}</p>
      <p v-if="this.over[0]">{{this.over}}</p>
    </div>

    <hr>
    <div class="tracking">
      <h4>Tracking logs:</h4>
      <input type="text" v-model="logPath">
      <button v-on:click="changeLogPath">Change log path</button>
    </div>
    <br>
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
let match;
let game;

export default {
  name: 'app',
  data: function() {
    return {
      logPath: 'C:\\Program Files (x86)\\Hearthstone\\Hearthstone_Data\\output_log.txt',
      lastFileSize: 0,
      players: [],
      match: {
        server: '',
        game: '',
        client: '',
        spectateKey: ''
      },
      over: []
    };
  },
  methods: {
    changeLogPath() {
      this.stopLog()
    },
    onChangeEventHandler(value) {
      if (value.value == true) {
        this.startLog()
      } else {
        this.stopLog()
      }
    },
    startLog() {
      const watcher = chokidar.watch(this.logPath, {
        persistent: true,
        disableGlobbing: true,
        usePolling: true
      });

      watcher.on('ready', () => {
      });

      watcher.on('add', (filePath, stats) => {
        if (stats) {
          this.update(filePath, stats);
        }
      });

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
      
      this.reset()
    },
    reset() {
      this.players = []
      // this.match = {
      //   server: '',
      //   game: '',
      //   client: '',
      //   spectateKey: ''
      // }
      this.over = []
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
        // starting new game
        if (line.match(/\[Power\] GameState\.DebugPrintPower\(\) -\s*CREATE_GAME/)) {
          this.reset()
        }

        // grab players
        if (player = line.match(/\[Power\] GameState\.DebugPrintGame\(\) - PlayerID=(\d), PlayerName=(.*)$/)) {
          const position = player[1]
          const name = player[2]

          this.players.push({
            name: name,
            position: position
          })
        }

        // backup name grab
        if (player = line.match(/\[Power\] GameState.DebugPrintEntitiesChosen\(\) - id=(\d) Player=([^\s]+) EntitiesCount/)) {
          const position = player[1]
          const name = player[2]

          if (position == 1 && this.players[0].name.includes('UNKNOWN')) {
             this.players[0].name = name
          }

          if (position == 2 && this.players[1].name.includes('UNKNOWN')) {
             this.players[1].name = name
          }
        }

        // get match data
        if (match = line.match(/\Network\.GotoGameServer -- address= ([^\s]+) game=([^\s]+) client=([^\s]+) spectateKey=([^\s]+)/)) {
          // console.log(match)
          this.match = {
            server: match[1].replace(',', ''),
            game: match[2].replace(',', ''),
            client: match[3].replace(',', ''),
            spectateKey: match[4]
          }
        }

        // game over
        if (game = line.match(/\[Power\] PowerTaskList\.DebugPrintPower\(\) -\s+TAG_CHANGE Entity=(.*) tag=PLAYSTATE value=(LOST|WON|TIED)/)) {
          
          this.over.push({
            player: game[1],
            status: game[2]
          })

          // send match data to server
          console.log({
            match: this.match,
            players: this.players,
            over: this.over
          })
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
  h3,
  h4 {
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

    button {
      margin-top: 7px;
      cursor: pointer;
    }

    h4 {
      margin: 0px 0px 7px 0px;
    }

    input {
      width: 100%;
    }
  }
}
</style>
