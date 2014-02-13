var timeFormat = 'MMMM Do YYYY, h:mm:ss a'
Parse.initialize("dibRma54UIQ0UYErXdDV0EPdk32AtUSEBQll0Lc7",
  "iwP0ckwxi7g8ZVWVaJwoel61ckdoUbPPuj2OPPXR");

var TabGroup = Parse.Object.extend("TabGroup");

self.port.on("allTabs", tabs => {
  var tabsByTime = tabs.reduce((prev, curr) => {
    prev[curr.time] || (prev[curr.time] = []);
    prev[curr.time].push(curr);
    return prev
  }, {});

  var sortedKeys = Object.keys(tabsByTime).map(x=>parseInt(x)).sort((a, b) => {
    return a - b;
  }).reverse();

  document.getElementById("container").innerHTML = sortedKeys.map(function(key) {
    key = key + '';
    var len = tabsByTime[key].length;
    var formattedTime = moment(parseInt(key)).format(timeFormat);
    return Mustache.render('<ul>\
      <h1 style="display: inline-block">' + len + ( len > 1 ? ' tabs' : ' tab') + '</h1>\
      <div style="display: inline-block; padding-left: 28px; vertical-align: middle;" data-id="' + key + '">\
        <div class="created_on">Created on ' + formattedTime + '</div>\
        <div class="restore_all">Open all</div>\
        <div class="delete_all">Remove all</div>\
        <div class="open_page">Share as web page</div>\
      </div>\
      {{#' + key + '}}\
      <li><a href="{{{url}}}">{{title}}</a></li>\
      {{/' + key + '}}\
    </ul>', tabsByTime);
  }).join('');

  document.addEventListener('click', function(e) {
    var t = e.target;

    if (t.classList.contains('open_page')) {
      var group = new TabGroup();
      var obj = tabsByTime[t.parentNode.getAttribute('data-id')]
      obj.time = null;
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
      var group = new TabGroup();
      var obj = tabsByTime[t.parentNode.getAttribute('data-id')]
      var tabs = obj.forEach(t => self.port.emit('open_tab', t.url));
    }
  });

  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  function guid() {
    return s4() + s4() + '' + s4() + '' + s4() + '' +
      s4() + '' + s4() + s4() + s4();
  }
});

