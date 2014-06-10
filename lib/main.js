/* global require */
'use strict';

var queue = require('./queue');
var storage = require('./async_storage').asyncStorage;
var windows = require('sdk/windows').browserWindows;
var self = require('sdk/self');

if (!storage.tabsSaved) {
  storage.tabsSaved = [];
}

function runScript(tab) {
  var worker = tab.attach({
    contentScriptFile: [
      self.data.url('parse-1.2.17.js'),
      self.data.url('script.js')]
  });

  storage.length(function(err, count) {
    if (err) {
      return console.error(err);
    }

    var tabsByTime = {};
    var q = queue(3);
    for (var i = 0; i < count; i++) {
      q.defer(function(i, cb) {
        storage.key(i, function(err, k) {
          if (err) {
            return cb(err);
          }

          storage.getItem(k, function(err, val) {
            tabsByTime[k] = val;
            cb(err);
          });
        });
      }, i);
    }

    q.awaitAll(function(err, results) {
      if (err) {
        console.error('ERROR', err);
      }
      worker.port.emit('allTabs', tabsByTime);
    });
  });

  worker.port.on('open_tab', function(tabData) {
    var tabs = windows.activeWindow.tabs;
    tabs.open({
      url: tabData.url,
      inBackground: true,
      onOpen: function onOpen(tab) {
        if (tabData.pinned) {
          tab.pin();
        }
      }
    });
  });

  worker.port.on('remove_link', function(data) {
    var time = parseInt(data.time, 10);
    var index = parseInt(data.index, 10);
    // Get Tab Group where this link belongs.
    storage.getItem(time, function(err, val) {
      // Get an array with the item with that particular index filtered out.
      var filteredLinks = val.filter(function(item) {
        return item.index !== index;
      });

      if (filteredLinks.length > 0) {
        storage.setItem(time, filteredLinks, function(){});
      } else {
        storage.removeItem(time, function(){});
      }
    });
  });

  worker.port.on('remove_group', function(id) {
    storage.removeItem(parseInt(id), function(){});
  });
}

function isTabExcluded(t) {
  return t.title === 'Tab Grenade' || t.isPinned;
}

function grenade() {
  var tabs = windows.activeWindow.tabs;
  var time = Date.now();
  var tabsToClose = [];

  if (tabs.length === 1 && tabs[0].title === 'Tab Grenade') {
    tabs[0].reload();
    return;
  }

  for each(var tab in tabs) {
    if (!isTabExcluded(tab)) {
      tabsToClose.push(tab);
    }
  }

  var tabsToStore = tabsToClose.map((t, i) => {
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

var ui = require('sdk/ui');
var grenadeButton = ui.ActionButton({
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

/**
 * In case of browser startup, we check if a tab grenade tab was loaded and
 * force it to reload and execute `runScript`. Otherwise it won't load the
 * necessary scripts.
 */
exports.main = function(options) {
  var tabs = require('sdk/tabs');
  if (options.loadReason === 'startup') {
    for (var i = tabs.length - 1; i >= 0; i--) {
      var tab = tabs[i];
      if (tab.url !== self.data.url('index.html')) {
        continue;
      }
      tab.once('ready', runScript.bind(null, tab));
      tab.reload();
    }
  }
};

