var timeFormat = 'MMMM Do YYYY, h:mm:ss a';
Parse.initialize("dibRma54UIQ0UYErXdDV0EPdk32AtUSEBQll0Lc7",
  "iwP0ckwxi7g8ZVWVaJwoel61ckdoUbPPuj2OPPXR");

var tabsByTime;
var TabGroup = Parse.Object.extend("TabGroup");
var tpl = document.getElementById('link_template').innerHTML;

document.addEventListener('click', function(e) {
  var obj;
  var t = e.target;
  var id = parseInt(t.parentNode.getAttribute('data-id'));

  if (!tabsByTime) {
    return;
  }

  if (t.classList.contains('open_page')) {
    var group = new TabGroup();
    obj = tabsByTime[id];
    group.set("tabs", obj);
    group.save(null, {
      success: function(data) {
        self.port.emit('open_tab', 'http://tabgrena.de/' + data.id);
      },
      error: function(model, error) {
        console.log(model, error.toSource())
      }
    });
  }

  if (t.classList.contains('restore_all')) {
    tabsByTime[id].forEach(self.port.emit.bind(this, 'open_tab'));
  }
});

self.port.on("allTabs", tabs => {
  tabsByTime = tabs.reduce((prev, curr) => {
    prev[curr[0]] = curr[1];
    return prev;
  }, {});

  var sortedKeys = Object.keys(tabsByTime).sort((a, b) => {
    return a - b;
  }).reverse();

  document.getElementById("container").innerHTML = sortedKeys.map(function(key) {
    var len = tabsByTime[key].length;
    var formattedTime = moment(parseInt(key)).format(timeFormat);
    var a = document.createElement('a');
    tabsByTime[key] = tabsByTime[key].map(t => {
      a.href = t.url;
      t.domain = a.hostname;
      return t;
    });

    return Mustache.render(tpl, {
      key: key,
      content: tabsByTime[key],
      formattedTime: formattedTime,
      tabLen: len + ( len > 1 ? ' tabs' : ' tab')
    });
  }).join('');
});

