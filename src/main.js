import Vue from 'vue'
import App from './App.vue'
import ToggleButton from 'vue-js-toggle-button'
const electron = require('electron');
const fs = require('fs');

const homeDir =  (electron.app || electron.remote.app).getPath('home');
let applocaldata = ''

if (process.platform == 'darwin') {
  applocaldata = homeDir + '/Library/Preferences/Blizzard/Hearthstone/'
} else {
  applocaldata = homeDir + '\\AppData\\Local\\Blizzard\\Hearthstone\\'
}

let logConfigPath = applocaldata + 'log.config';
let logBuffer = new Buffer('[Power]\nLogLevel=1\nFilePrinting=True\nConsolePrinting=True\nScreenPrinting=False\nVerbose=True');

fs.open(logConfigPath, 'w', function(err, fd) {
  if (err) {
    throw 'could not open log.config: ' + err;
  }

  fs.write(fd, logBuffer, 0, logBuffer.length, null, function(err) {
    if (err) throw 'error writing log.config file: ' + err;
    fs.close(fd, function() {
      console.log('wrote log.config successfully');
    });
  });
});

Vue.config.productionTip = false
Vue.use(ToggleButton)

new Vue({
  render: h => h(App),
}).$mount('#app')
