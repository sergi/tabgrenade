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

  sortedKeys.forEach(function(key) {
    key = key + '';
    var len = tabsByTime[key].length;
    var formattedTime = moment(parseInt(key)).format(timeFormat);
    var template = '<ul>\
      <h1 style="display: inline-block">' + len + ( len > 1 ? ' tabs' : ' tab') + '</h1>\
      <div style="display: inline-block; padding-left: 28px; vertical-align: middle;">\
        <div class="created_on">Created on ' + formattedTime + '</div>\
        <div class="restore_all">Open all</div>\
        <div class="delete_all">Remove all</div>\
        <div class="open_page" data-id="' + key + '">Share as web page</div>\
      </div>\
      {{#' + key + '}}\
      <li><a href="{{{url}}}">{{title}}</a></li>\
      {{/' + key + '}}\
    </ul>';

    document.getElementById("container").innerHTML +=
      Mustache.render(template, tabsByTime);
  });

  document.addEventListener('click', function(e) {
    var t = e.target;

    if (t.classList.contains('open_page')) {
      var group = new TabGroup();
      var obj = tabsByTime[t.getAttribute('data-id')]
      obj.time = null;
      group.set("tabs", obj);
      group.save(null, {
        success: function(obj) {
          console.log('yay!', obj)
        },
        error: function(model, error) {
          console.log(model, error.toSource())
        }
      });
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

