'use strict';

const queue = require('./queue');
const storage = require('./async_storage').asyncStorage;
const windows = require('sdk/windows').browserWindows;
const self = require('sdk/self');
const ui = require('sdk/ui');

const indexURL = self.data.url('index.html');

if (!storage.tabsSaved) {
  storage.tabsSaved = [];
}

function runScript(tab) {
  let worker = tab.attach({
    contentScriptFile: [
      self.data.url('parse-1.4.0.min.js'),
      self.data.url('script.js')
    ]
  });

  storage.length(function(err, count) {
    if (err) {
      return console.error(err);
    }

    let tabsByTime = {};
    function deferred(i, cb) {
      storage.key(i, function(queueErr, k) {
        if (queueErr) {
          return cb(queueErr);
        }

        storage.getItem(k, function(getItemErr, val) {
          tabsByTime[k] = val;
          cb(getItemErr);
        });
      });
    }

    let q = queue(3);
    for (let i = 0; i < count; i++) {
      q.defer(deferred, i);
    }

    q.awaitAll(function(awaitErr, results) {
      if (awaitErr) {
        console.error('ERROR', awaitErr);
      }
      worker.port.emit('allTabs', tabsByTime);
    });
  });

  worker.port.on('open_tab', function(tabData) {
    const tabs = windows.activeWindow.tabs;
    tabs.open({
      url: tabData.url,
      inBackground: true,
      onOpen: function onOpen(_tab) {
        if (tabData.pinned) {
          _tab.pin();
        }
      }
    });
  });

  worker.port.on('remove_link', function(data) {
    const time = parseInt(data.time, 10);
    const index = parseInt(data.index, 10);
    // Get Tab Group where this link belongs.
    storage.getItem(time, function(err, val) {
      // Get an array with the item with that particular index filtered out.
      let filteredLinks = val.filter(item => item.index !== index);

      if (filteredLinks.length > 0) {
        storage.setItem(time, filteredLinks, function() {});
      } else {
        storage.removeItem(time, function() {});
      }
    });
  });

  worker.port.on('remove_group', function(id) {
    storage.removeItem(parseInt(id), function(){});
  });
}

function isTGTab(tab) {
  return tab.url === indexURL;
}

function isTabExcluded(t) {
  return t.isPinned;
}

function grenade() {
  const tabs = windows.activeWindow.tabs;
  const time = Date.now();
  let tabsToClose = [];

  if (tabs.length === 1 && tabs[0].title === 'Tab Grenade') {
    tabs[0].reload();
    return;
  }

  for (let n in tabs) {
    let tab = tabs[n];
    if (!isTabExcluded(tab)) {
      tabsToClose.push(tab);
    }
  }

  const tabsToStore = tabsToClose.map((t, i) => {
    return {
      title: t.title,
      url: t.url,
      time: time,
      index: i,
      pinned: t.isPinned
    };
  });

  if (tabsToStore.length > 0) {
    storage.setItem(time, tabsToStore, function() {
      tabs.open({
        url: self.data.url('index.html'),
        onReady: runScript
      });
      tabsToClose.forEach(t => t.close());
    });
  }
}

require('sdk/ui/button/action').ActionButton({
    id: 'tab-grenade1',
    label: 'Tab Grenade',
    icon: self.data.url('grenade-32.png'),
    onClick: grenade
});

var { Hotkey } = require('sdk/hotkeys');
Hotkey({
  combo: 'control-alt-t',
  onPress: grenade
});

Hotkey({
  combo: 'meta-alt-t',
  onPress: grenade
});

function reloadTG(options) {
  var tabs = require('sdk/tabs');
  for (var i = tabs.length - 1; i >= 0; i--) {
    var tab = tabs[i];
    if (!isTGTab(tab)) {
      continue;
    }

    tab.on('ready', runScript);
    tab.on('activate', runScript);
    return true;
  }
  return false;
}

/**
 * In case of browser startup, we check if a tab grenade tab was loaded and
 * force it to reload and execute `runScript`. Otherwise it won't load the
 * necessary scripts.
 */
exports.main = function(options) {
  if (options.loadReason === 'startup') {
    if (!reloadTG()) {
      console.info('Didn\'t find a tab on first attempt; retrying.');
      require('sdk/timers').setTimeout(reloadTG, 5);
    }
  }
};

