var timeFormat = 'MMMM Do YYYY, h:mm:ss a'
var template = '<ul>\
    {{#tabs}}\
      <h1>{{title}}</h1>\
      <li><a href="{{url}}">{{title}}</a></li>\
    {{/tabs}}\
  </ul>'
var byTime = {}

self.port.on("allTabs", tabs => {
  var tabsByTime = tabs.reduce((prev, curr) => {
    curr.fmtTime = moment(curr.time).format(timeFormat)
    prev[curr.time] || (prev[curr.time] = [])
    prev[curr.time].push(curr)
    return prev
  }, byTime)
  console.log(tabsByTime.toSource())
//  document.getElementById("container").innerHTML =
//    Mustache.render(template, , {})
})
/*
 var ul = document.createElement("ul")
 tabs.forEach(function(tab) {
 if (!frags[tab.time]) {
 frags[tab.time] = document.createDocumentFragment();

 var title = document.createElement('h1');
 title.innerHTML = moment(tab.time).format('MMMM Do YYYY, h:mm:ss a');
 frags[tab.time].appendChild(title);
 }

 var link = document.createElement('a');
 link.innerHTML = tab.title;
 link.setAttribute('href', tab.url);

 var li = document.createElement('li');
 li.appendChild(link)

 frags[tab.time].appendChild(li);
 ul.appendChild(frags[tab.time]);
 });
 })
 ; */
