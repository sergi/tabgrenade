var widgets = require("sdk/widget");
var storage = require("sdk/simple-storage").storage;
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
  worker.port.emit("allTabs", storage.tabsSaved);
  worker.port.on('open_tab', function(url) {
    tabs.open(url);
  });
}

var widget = widgets.Widget({
  id: 'tab-grenade',
  label: 'Tab Grenade',
  contentURL: self.data.url('grenade.png'),

  onClick: function() {
    var time = Date.now();

    var alreadyOpen;
    var tabsToClose = [];
    for each(tab in tabs) {
      if (tab.title === 'Tab Grenade') {
        alreadyOpen = tab;
        continue;
      }

      storage.tabsSaved.push({
        title: tab.title,
        url: tab.url,
        time: time
      });

      tabsToClose.push(tab);
    }

    if (alreadyOpen) {
      alreadyOpen.reload();
    } else {
      tabs.open({
        url: self.data.url('index.html'),
        onReady: runScript
      });
    }

    tabsToClose.forEach(t=>t.close());
  }
});
