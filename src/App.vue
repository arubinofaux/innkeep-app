<template>
  <div id="app">

    <div class="container-fuid">
      <div class="row">
        <div class="col-6">
          <img src="./assets/temp_logo.png" class="logo">
        </div>

        <div class="col-6 toggle">
          <toggle-button @change="onChangeEventHandler"
                          :labels="{checked: 'Stop Tracking', unchecked: 'Start Tracking'}" 
                          :color="{checked: '#FF0000', unchecked: '#00FF00', disabled: '#CCCCCC'}"
                          :width=100 />
        </div>
      </div>

      <hr>

      <div class="row">
        <div class="col-12" v-if="this.players[0]">
          <h1>{{this.players[0].name}}</h1>
          <h3>vs</h3>
          <h1>{{this.players[1].name}}</h1>
        </div>
      </div>

      <hr>

      <div class="row">
        <div class="col-12 log-location">
          <div class="form-group">
            <label>Log File Location</label>
            <input type="text" class="form-control" v-model="logPath">
          </div>
          <button class="btn btn-primary btn-sm" v-on:click="changeLogPath">Change log path</button>
        </div>
      </div>
    </div>

    <br>
    <h3>Beta Software :)</h3>
  </div>
</template>

<script>
const electron = require('electron');
import * as fs from 'fs';
const chokidar = require('chokidar');
const splitLines = require('split-lines');
const axios = require('axios');
import {FSWatcher} from 'chokidar';

let _watcher;
let player;
let match;
let game;

export default {
  name: 'app',
  data: function() {
    return {
      logPath: '',
      lastFileSize: 0,
      players: [],
      match: {
        server: '',
        game: '',
        client: '',
        spectateKey: ''
      },
      apiHost: ''
    };
  },
  created: function () {
    console.log(process.env.NODE_ENV)

    if (process.env.NODE_ENV == 'production') {
      this.apiHost = 'https://innkeepbattles.com/api/ping/hearthstone/matches.json'
    } else {
      this.apiHost = 'http://localhost:3000/api/ping/hearthstone/matches.json'
    }


    const homeDir =  (electron.app || electron.remote.app).getPath('home');
    if (process.platform == 'darwin') {
      this.logPath = homeDir + '/Library/Preferences/Blizzard/Hearthstone/'
    } else {
      this.logPath = homeDir + '\\AppData\\LocalLow\\Blizzard Entertainment\\Hearthstone\\output_log.txt'
    }
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
      if (!this._watcher.value) {
        return
      }

      this._watcher.close()
      this._watcher = null
      this.lastFileSize = 0
      
      this.reset()
    },
    reset() {
      this.players = []
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
        if (player = line.match(/\[Power\] GameState\.DebugPrintEntitiesChosen\(\) - id=(\d) Player=([^\s]+) EntitiesCount/)) {
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
          
          if (this.players[0].name == game[1]) {
            this.players[0].status = game[2]
          }

          if (this.players[1].name == game[1]) {
            this.players[1].status = game[2]
          }

          // send match data to server
          axios.post(this.apiHost, {
            match: {
              match: this.match,
              players: this.players
            }
          })
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
          
          // console.log({
          //   match: this.match,
          //   players: this.players
          // })
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

  .row {
    margin-right: 0px;
    margin-left: 0px;
  }

  h1,
  h2,
  h3,
  h4 {
    margin: 0px;
  }

  .logo {
    width: 84px;
  }

  .toggle {
    padding-top: 27px;
  }

  h1 {
    font-size: 17px;
    font-weight: bold;
  }

  h3 {
    font-size: 19px;
    margin: 6px 0px 11px 0px;
  }

  .players {
    margin: 14px 0px 18px 0px;

    h3 {
      margin: 11px 0px 6px 0px;
    }
  }

  .log-location {
    text-align: left;
  }
}
</style>
