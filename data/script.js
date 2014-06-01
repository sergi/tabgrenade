'use strict';

Parse.initialize("dibRma54UIQ0UYErXdDV0EPdk32AtUSEBQll0Lc7",
  "iwP0ckwxi7g8ZVWVaJwoel61ckdoUbPPuj2OPPXR");

var tabsByTime;
var TabGroup = Parse.Object.extend("TabGroup");

document.addEventListener('click', function(e) {
  var obj;
  var t = e.target;
  var id = parseInt(t.parentNode.getAttribute('data-id'), 10);

  if (!tabsByTime) {
    return;
  }

  if (t.classList.contains('open_page')) {
    var group = new TabGroup();
    obj = tabsByTime[id];
    group.set('tabs', obj);
    group.save(null, {
      success: function(data) {
        self.port.emit('open_tab', {
          url: 'http://tabgrena.de/' + data.id
        });
      },
      error: function(model, error) {
        console.log(model, error.toSource());
      }
    });
  }

  if (t.classList.contains('restore_all')) {
    tabsByTime[id].forEach(self.port.emit.bind(this, 'open_tab'));
  }

  if (t.classList.contains('closeBtn')) {
    var li = t.parentNode;
    li.parentNode.removeChild(li);

    //if (li.parentNode.querySelectorAll('li').length === 0) {
      // We should delete the whole block
    //}
console.log(li);
    self.port.emit('remove_link', {
      time: t.dataset.time,
      index: t.dataset.index
    });
  }

  if (t.classList.contains('remove_all')) {
  }
});

self.port.on('allTabs', _tabsByTime => {
  tabsByTime = _tabsByTime;
  var sortedKeys = Object.keys(tabsByTime).sort((a, b) => {
    return a - b;
  }).reverse();

  var container = document.getElementById('container');
  var containerFragment = document.createDocumentFragment();

  sortedKeys.forEach(function(key) {
    var blockFragment = document.createDocumentFragment();
    var len = tabsByTime[key].length;

    // If there are no links in this group, don't show it.
    if (len === 0) {
      return;
    }

    var date = new Date(parseInt(key, 10));
    var formattedTime = date.toDateString() + ', ' + date.toTimeString();

    var ul = document.createElement('ul');
    var h1 = document.createElement('h1');
    var info = document.createElement('div');
    var createdOn = document.createElement('div');
    var restoreAll = document.createElement('div');
    var shareAll = document.createElement('div');

    h1.textContent = len + ( len > 1 ? ' tabs' : ' tab');
    info.className = 'info_block';
    info.setAttribute('data-id', key);
    createdOn.className = 'created_on';
    createdOn.textContent = 'Created on ' + formattedTime;
    restoreAll.className = 'restore_all';
    restoreAll.textContent = 'Open all';
    shareAll.className = 'open_page';
    shareAll.textContent = 'Share as web page';
    info.appendChild(createdOn);
    info.appendChild(restoreAll);
    info.appendChild(shareAll);

    tabsByTime[key].forEach(function(item) {
      var _a = document.createElement('a');
      _a.href = item.url;
      _a.target = '_blank';
      _a.textContent = item.title;

      var li = document.createElement('li');

      if (item.index > -1) {
        var deleteBtn = document.createElement('span');
        deleteBtn.classList.add('closeBtn');
        deleteBtn.dataset.index = item.index;
        deleteBtn.dataset.time = item.time;
        li.appendChild(deleteBtn);
      }

      var icon = document.createElement('img');
      icon.src = 'https://www.google.com/s2/favicons?domain=' + _a.hostname;
      li.appendChild(icon);

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
