var timeFormat = 'MMMM Do YYYY, h:mm:ss a';
Parse.initialize("dibRma54UIQ0UYErXdDV0EPdk32AtUSEBQll0Lc7",
  "iwP0ckwxi7g8ZVWVaJwoel61ckdoUbPPuj2OPPXR");

var tabsByTime;
var TabGroup = Parse.Object.extend("TabGroup");

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

  var container = document.getElementById("container");
  var containerFragment = document.createDocumentFragment();

  sortedKeys.forEach(function(key) {
    var blockFragment = document.createDocumentFragment();
    var len = tabsByTime[key].length;
    var date = new Date(parseInt(key, 10));
    var formattedTime = date.toDateString() + ', ' + date.toTimeString();

    var ul = document.createElement('ul');
    var h1 = document.createElement('h1');
    var info = document.createElement('div');
    var createdOn = document.createElement('div');

    h1.textContent = len + ( len > 1 ? ' tabs' : ' tab');
    info.className = 'info_block';
    info.setAttribute('data-id', key);
    createdOn.className = 'created_on';
    createdOn.textContent = 'Created on ' + formattedTime;
    info.appendChild(createdOn);

    tabsByTime[key].forEach(function(item) {
      var li = document.createElement('li');
      var _a = document.createElement('a');
      _a.href = item.url;
      _a.target = '_blank';
      _a.textContent = item.title;
      li.style.listStyleImage = 'url(https://www.google.com/s2/favicons?domain=' + _a.hostname + ')';
      li.appendChild(_a);
      ul.appendChild(li);
    });

    blockFragment.appendChild(h1);
    blockFragment.appendChild(info);
    blockFragment.appendChild(ul);

    containerFragment.appendChild(blockFragment);
  });

  container.appendChild(containerFragment);
});

