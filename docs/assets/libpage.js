/* Library page: reports, figures, tables, logs, code, data. Lists come from library.js (built from the repository). */
(function(){
'use strict';
var LIB=window.LIB,$=function(id){return document.getElementById(id);};
if(!$('lib'))return;
var esc=SB.esc;
function kb(n){return n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';}
function grouped(items,render){var g={},order=[];items.forEach(function(it){if(!g[it.group]){g[it.group]=[];order.push(it.group);}g[it.group].push(it);});
  return order.map(function(k){return '<div class="grp">'+esc(k)+'</div>'+g[k].map(render).join('');}).join('');}
$('p_reports').innerHTML='<div class="grid">'+LIB.reports.map(function(r){return '<div class="doc"><b>'+esc(r.title)+'</b><span>'+esc(r.desc)+'</span><div class="meta">'+r.pages+' pages &middot; '+esc(r.when)+'</div><div><a class="btn sm" href="'+r.file+'">Open PDF</a> '+(r.tex?'<a class="btn sm alt" href="'+SB.REPO+'/blob/main/'+r.tex+'" target="_blank" rel="noopener">LaTeX source</a>':'')+'</div></div>';}).join('')+'</div>';
$('p_figures').innerHTML='<div class="gal">'+LIB.figures.map(function(f){return '<figure><img loading="lazy" src="'+f.file+'" alt="'+esc(f.cap)+'"><figcaption><b>'+esc(f.name)+'</b><br>'+esc(f.cap)+'</figcaption></figure>';}).join('')+'</div>';
function flist(id,items,filterId){
  function paint(q){var its=items.filter(function(it){return !q||(it.name+' '+it.desc+' '+it.group).toLowerCase().indexOf(q)>-1;});
    $(id).innerHTML=its.length?grouped(its,function(it){return '<a data-file="'+esc(it.file)+'"><code>'+esc(it.name)+'</code><span>'+esc(it.desc)+(it.size?' &middot; '+kb(it.size):'')+'</span></a>';}):'<div class="grp">No match</div>';}
  paint('');if(filterId)$(filterId).addEventListener('input',function(){paint($(filterId).value.trim().toLowerCase());});
}
flist('l_tables',LIB.tables,'f_tables');flist('l_logs',LIB.logs,'f_logs');flist('l_code',LIB.code,'f_code');
$('t_data').innerHTML='<tr><th>File</th><th>What it holds</th><th>Group</th><th class="n">Size</th></tr>'+LIB.data.map(function(d){return '<tr><td><a href="'+SB.REPO+'/blob/main/'+d.path+'" target="_blank" rel="noopener"><code>'+esc(d.name)+'</code></a></td><td>'+esc(d.desc)+'</td><td>'+esc(d.group)+'</td><td class="n">'+kb(d.size)+'</td></tr>';}).join('');
function dict(q){var its=LIB.dict.filter(function(v){return !q||(v[0]+' '+v[1]+' '+v[2]).toLowerCase().indexOf(q)>-1;});
  $('t_dict').innerHTML='<tr><th>Variable</th><th>Meaning</th><th>Label in the file</th></tr>'+its.map(function(v){return '<tr><td><code>'+esc(v[0])+'</code></td><td>'+esc(v[1])+'</td><td>'+esc(v[2])+'</td></tr>';}).join('');}
dict('');$('f_dict').addEventListener('input',function(){dict($('f_dict').value.trim().toLowerCase());});
var tabs=[].slice.call(document.querySelectorAll('.subtabs button'));
function show(name){tabs.forEach(function(b){b.classList.toggle('on',b.getAttribute('data-pane')===name);});[].forEach.call(document.querySelectorAll('.pane'),function(p){p.classList.toggle('on',p.id==='pane_'+name);});}
tabs.forEach(function(b){b.addEventListener('click',function(){show(b.getAttribute('data-pane'));try{history.replaceState(null,'','#'+b.getAttribute('data-pane'));}catch(e){}});});
var h=location.hash.slice(1);if(h&&$('pane_'+h))show(h);
[].forEach.call(document.querySelectorAll('[data-count]'),function(e){var k=e.getAttribute('data-count');e.textContent=LIB[k].length;});
})();
