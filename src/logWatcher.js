import Vuex from 'vuex'
import Vue from 'vue'

export const logWatcher = {
  created: function () {
    console.log('Printing from the Mixin')
  },
  methods: {
    start: function () {
      // console.log(this.$store.state)
      // const watcher = chokidar.watch("C:\\Program Files (x86)\\Hearthstone\\Hearthstone_Data\\output_log.txt", {
      //   persistent: true,
      //   disableGlobbing: true,
      //   usePolling: true
      // });

      // watcher.on('ready', () => {
      //   console.log('Initial scan complete. Ready for changes')
      // });

      // watcher.on('add', (filePath, stats) => {
      //   console.log('add')
      //   if (stats) {
      //     this.update(filePath, stats);
      //   }
      // });
  
      // watcher.on('change', (filePath, stats) => {
      //   console.log('change')
      //   if (stats) {
      //     this.update(filePath, stats);
      //   }
      // });

      // this._watcher = watcher;
    },
  }
}