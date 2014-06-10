'use strict';

var tabsByTime;

if (window.Parse) {
  Parse.initialize("dibRma54UIQ0UYErXdDV0EPdk32AtUSEBQll0Lc7",
                   "iwP0ckwxi7g8ZVWVaJwoel61ckdoUbPPuj2OPPXR");
}
document.addEventListener('click', function(e) {
  var obj;
  var t = e.target;

  if (!tabsByTime) {
    return;
  }

  if (t.classList.contains('open_page')) {
    if (!window.Parse) {
      alert('There was a problem generating the page online. Are you connected to the internet?');
      return;
    }

    var TabGroup = Parse.Object.extend("TabGroup");
    var group = new TabGroup();
    obj = tabsByTime[parseInt(t.dataset.id)];
    group.set('tabs', obj);
    group.save(null, {
      success: function(data) {
        self.port.emit('open_tab', {
          url: 'http://tabgrena.de/' + data.id
        });
      },
      error: function(model, error) {
        console.error(model, error.toSource());
      }
    });
  }

  if (t.classList.contains('restore_all')) {
    tabsByTime[parseInt(t.dataset.id)]
      .forEach(self.port.emit.bind(this, 'open_tab'));
  }

  if (t.classList.contains('closeBtn')) {
    var li = t.parentNode;
    li.parentNode.removeChild(li);

    //if (li.parentNode.querySelectorAll('li').length === 0) {
      // We should delete the whole block
    //}

    self.port.emit('remove_link', {
      time: t.dataset.time,
      index: t.dataset.index
    });
  }

  if (t.classList.contains('remove_group')) {
    var group = document.getElementById('group-' + t.dataset.id);
    if (window.confirm('Are you sure you want to remove the tab group?')) {
      group.parentNode.removeChild(group);
      self.port.emit('remove_group', t.dataset.id);
    }
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
    var group =  document.createElement('div');
    group.id = 'group-' + key;
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
    var removeAll = document.createElement('div');

    h1.textContent = len + ( len > 1 ? ' tabs' : ' tab');
    info.className = 'info_block';
    createdOn.className = 'created_on';
    createdOn.textContent = 'Created on ' + formattedTime;
    restoreAll.className = 'restore_all';
    restoreAll.dataset.id = key;
    restoreAll.textContent = 'Open all';
    shareAll.className = 'open_page';
    shareAll.dataset.id = key;
    shareAll.textContent = 'Share as web page';
    removeAll.className = 'remove_group';
    removeAll.dataset.id = key;
    removeAll.textContent = 'Remove all in this group';
    info.appendChild(createdOn);
    info.appendChild(restoreAll);
    info.appendChild(shareAll);
    info.appendChild(removeAll);

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

    group.appendChild(h1);
    group.appendChild(info);
    group.appendChild(ul);

    containerFragment.appendChild(group);
  });

  container.appendChild(containerFragment);
});
