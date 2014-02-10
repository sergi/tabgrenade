var timeFormat = 'MMMM Do YYYY, h:mm:ss a'

self.port.on("allTabs", tabs => {
  var tabsByTime = tabs.reduce((prev, curr) => {
    prev[curr.time] || (prev[curr.time] = []);
    prev[curr.time].push(curr);
    return prev
  }, {});

  for (var key in tabsByTime) {
    var len = tabsByTime[key].length;
    var formattedTime = moment(parseInt(key)).format(timeFormat);
    var template = '<ul>\
      <h1 style="display: inline-block">' + len + ( len > 1 ? ' tabs' : ' tab') + '</h1>\
      <div style="display: inline-block; padding-left: 28px; vertical-align: middle;">\
        <div class="created_on">Created on ' + formattedTime + '</div>\
        <div class="restore_all">Restore all</div>\
        <div class="delete_all">Delete all</div>\
        <div class="open_page">Share as web page</div>\
      </div>\
      {{#' + key + '}}\
      <li><a href="{{{url}}}">{{title}}</a></li>\
      {{/' + key + '}}\
    </ul>';

    document.getElementById("container").innerHTML +=
      Mustache.render(template, tabsByTime);
  }
});


document.addEventListener('click', function(e) {
  var t = e.target;

  if (t.classList.contains('open_page')) {
    alert(t.getAttribute('data-id'))
  }
});