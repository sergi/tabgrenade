var queue = require("./queue");
var storage = require("./async_storage").asyncStorage;
var windows = require("sdk/windows").browserWindows;
var self = require("sdk/self");

if (!storage.tabsSaved) {
  storage.tabsSaved = [];
}

function runScript(tab) {
  var worker = tab.attach({
    contentScriptFile: [
      self.data.url("parse-1.2.17.js"),
      self.data.url("script.js")]
  });

  storage.length(function(err, count) {
    if (err) {
      return console.error(err);
    }

    var q = queue(3);
    for (var i = 0; i < count; i++) {
      q.defer(function(i, cb) {
        storage.key(i, function(err, k) {
          if (err) {
            return cb(err);
          }
          storage.getItem(k, function(err, val) {
            cb(err, [k, val]);
          });
        });
      }, i);
    }

    q.awaitAll(function(err, results) {
      if (err) console.error("ERROR", err);
      worker.port.emit("allTabs", results || []);
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
}

function grenade() {
  var tabs = windows.activeWindow.tabs;
  var time = Date.now();
  var tabsToClose = [];

  if (tabs.length === 1 && tabs[0].title === 'Tab Grenade') {
    tabs[0].reload();
    return;
  }

  for each(tab in tabs) {
    tabsToClose.push(tab);
  }

  var tabsToStore = tabsToClose
    .filter(t => t.title !== 'Tab Grenade')
    .map(t => {
      return {
        title: t.title,
        url: t.url,
        time: time,
        pinned: t.isPinned
      }
    });

  if (tabsToStore.length > 0) {
    storage.setItem(time, tabsToStore, function() {
      tabs.open({
        url: self.data.url('index.html'),
        onReady: runScript
      });

      var tabQueue = queue(2);
      tabsToClose.forEach(t=> {
        tabQueue.defer(function(cb) {
          require('sdk/timers').setTimeout(function() {
            t.close()
            cb(null, t.title);
          });
        });
      });
      tabQueue.awaitAll(function(err, res) {});
    })
  }
}

require("toolbarwidget").ToolbarWidget({
  toolbarID: "nav-bar", // <-- Place widget on Navigation bar
  id: "tab-grenade1",
  label: "Tab Grenade",
  contentURL: self.data.url('grenade-32.png'),
  onClick: grenade
});

/**
 * In case of browser startup, we check if a tab grenade tab was loaded and
 * force it to reload and execute `runScript`. Otherwise it won't load the
 * necessary scripts.
 */
exports.main = function(options) {
  var tabs = require("sdk/tabs");
  if (options.loadReason === 'startup') {
    for (var i = tabs.length - 1; i >= 0; i--) {
      var tab = tabs[i];
      if (tab.url !== self.data.url('index.html')) {
        continue;
      }
      tab.on('ready', runScript.bind(null, tab));
      tab.reload();
    }
  }
};

