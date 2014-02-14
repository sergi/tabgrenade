var widgets = require("sdk/widget");
var queue = require("./queue");
var storage = require("./async_storage").asyncStorage;
var tabs = require("sdk/tabs");
var self = require("sdk/self");

if (!storage.tabsSaved) {
  storage.tabsSaved = [];
}

function runScript(tab) {
  var worker = tab.attach({
    contentScriptFile: [
      self.data.url("mustache.js"),
      self.data.url("moment.min.js"),
      self.data.url("parse-1.2.16.min.js"),
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

  worker.port.on('open_tab', function(url) {
    tabs.open({
      url: url,
      inBackground: true
    });
  });
}

var widget = widgets.Widget({
  id: 'tab-grenade',
  label: 'Tab Grenade',
  contentURL: self.data.url('grenade.png'),

  onClick: function() {
    var time = Date.now();
    var tabsToClose = [];

    for each(tab in tabs) { tabsToClose.push(tab); }

    storage.setItem(time, tabsToClose.map(t => {
      return {
        title: t.title,
        url: t.url
      }
    }), function() {
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
      })
      tabQueue.awaitAll(function(err, res) {});
    })
  }
});
