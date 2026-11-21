/* Shared behaviour: theme, navigation, search, source drawer, file viewer, lightbox, local PDF viewer */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var root=document.documentElement;
var REPO='https://github.com/sahiljangra12/China-SolarPolicy-Replication';
var PUB={main:'https://www.science.org/doi/10.1126/science.aee0747',sm:'https://www.science.org/doi/suppl/10.1126/science.aee0747/suppl_file/science.aee0747_sm.pdf'};
var DOCS={main:{name:'Article',pick:'article PDF',pages:[6,12]},sm:{name:'Supplementary Materials',pick:'Supplementary Materials PDF',pages:[58,58]},mdar:{name:'Reproducibility checklist',pick:'reproducibility checklist (MDAR) PDF',pages:[5,5]}};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
window.SB={esc:esc,REPO:REPO};

/* ---------- theme ---------- */
function setTheme(t){root.setAttribute('data-theme',t);var b=$('themeBtn');if(b)b.textContent=t==='dark'?'Light':'Dark';document.dispatchEvent(new Event('themechange'));}
var saved=null;try{saved=localStorage.getItem('theme');}catch(e){}
setTheme(saved||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
$('themeBtn').addEventListener('click',function(){var t=root.getAttribute('data-theme')==='dark'?'light':'dark';setTheme(t);try{localStorage.setItem('theme',t);}catch(e){}});

/* ---------- toast ---------- */
var toastEl=document.createElement('div');toastEl.className='toast';document.body.appendChild(toastEl);var toastT;
function toast(m){toastEl.textContent=m;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){toastEl.classList.remove('on');},1800);}
SB.toast=toast;
SB.copy=function(text,msg){function ok(){toast(msg||'Copied');}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(ok,function(){fallback();});}else fallback();
  function fallback(){var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok();}catch(e){}document.body.removeChild(ta);}};

/* ---------- side navigation built from the page's sections ---------- */
var side=$('side');
if(side){
  var secs=[].slice.call(document.querySelectorAll('main section[id]'));
  var html='<div class="h">On this page</div>';
  secs.forEach(function(s){var h=s.querySelector('h2,h1');if(!h)return;html+='<a href="#'+s.id+'">'+esc(s.getAttribute('data-nav')||h.textContent)+'</a>';});
  side.innerHTML=html;
  var links=[].slice.call(side.querySelectorAll('a')),map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.remove('on');});if(map[e.target.id])map[e.target.id].classList.add('on');}});},{rootMargin:'-12% 0px -72% 0px'});secs.forEach(function(s){io.observe(s);});}
}

/* ---------- command palette: search every page, report, log, table and code file ---------- */
var cmdk=$('cmdk'),cin=$('cmdin'),cres=$('cmdres'),cact=0,cout=[];
var PAGES=[['index.html','Overview','Summary, the evidence sorted, project record'],['lab.html','Live tools','Change the model, add a confounder, relax the instrument, compare event studies'],['evidence.html','Evidence','Main estimate, effort, solar area, sensitivity, IV, staggered DiD, dCDH'],['paper.html','Paper check','Claims tied to pages, reproduction check, checklist, index of the Supplementary Materials'],['library.html','Library','Reports, figures, tables, logs, code, data'],['qa.html','Q&A','Questions answered, glossary, references']];
function paintCmd(){
  var q=cin.value.trim().toLowerCase();cout=[];
  if(q.length<2){cout=PAGES.map(function(p){return {p:p[0],t:p[1],pg:'Page',snip:p[2]};});}
  else{var terms=q.split(/\s+/);(window.SEARCH||[]).forEach(function(it){var t=it.t.toLowerCase(),x=it.x.toLowerCase(),score=0;
      for(var i=0;i<terms.length;i++){var a=t.indexOf(terms[i])>-1,b=x.indexOf(terms[i])>-1;if(!a&&!b)return;score+=a?5:1;}
      var k=x.indexOf(terms[0]);cout.push({p:it.p,t:it.t,pg:it.pg,score:score,snip:k>-1?it.x.slice(Math.max(0,k-40),k+110):it.x.slice(0,130)});});
    cout.sort(function(a,b){return b.score-a.score;});cout=cout.slice(0,12);}
  cact=0;
  cres.innerHTML=cout.length?cout.map(function(o,i){return '<a href="'+esc(o.p)+'"'+(i===0?' class="act"':'')+'><b>'+esc(o.t)+'</b> <span>'+esc(o.pg)+': '+esc(o.snip)+'</span></a>';}).join(''):'<div class="empty">Nothing matches. Try a method, a table number or a file name.</div>';
}
function moveCmd(d){var as=cres.querySelectorAll('a');if(!as.length)return;as[cact].classList.remove('act');cact=(cact+d+as.length)%as.length;as[cact].classList.add('act');as[cact].scrollIntoView({block:'nearest'});}
function openCmd(){if(!cmdk.open)cmdk.showModal();cin.value='';paintCmd();cin.focus();}
function goCmd(h){cmdk.close();var here=location.pathname.split('/').pop()||'index.html';
  if(h.split('#')[0]===here&&h.indexOf('#')>-1){if(location.hash==='#'+h.split('#')[1])fromHash();else location.hash=h.split('#')[1];}else location.href=h;}
cin.addEventListener('input',paintCmd);
cin.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();moveCmd(1);}else if(e.key==='ArrowUp'){e.preventDefault();moveCmd(-1);}
  else if(e.key==='Enter'){var as=cres.querySelectorAll('a');if(as[cact]){e.preventDefault();goCmd(as[cact].getAttribute('href'));}}});
cres.addEventListener('click',function(e){var a=e.target.closest('a');if(a){e.preventDefault();goCmd(a.getAttribute('href'));}});
cmdk.addEventListener('click',function(e){if(e.target===cmdk)cmdk.close();});
$('searchBtn').addEventListener('click',openCmd);
document.addEventListener('keydown',function(e){var typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if((e.key==='k'&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!typing)){e.preventDefault();openCmd();}});

/* ---------- reading progress ---------- */
var prog=$('progress');
function onScroll(){var h=document.documentElement,max=h.scrollHeight-h.clientHeight;prog.style.width=(max>0?Math.min(100,h.scrollTop/max*100):0)+'%';}
document.addEventListener('scroll',onScroll,{passive:true});onScroll();

/* ---------- lightbox ---------- */
var lb=$('lightbox');
document.addEventListener('click',function(e){var im=e.target.closest('figure img,img[data-zoom]');if(!im)return;
  lb.querySelector('img').src=im.currentSrc||im.src;var cap=im.closest('figure');lb.querySelector('p').textContent=cap&&cap.querySelector('figcaption')?cap.querySelector('figcaption').textContent:(im.alt||'');lb.showModal();});
lb.addEventListener('click',function(){lb.close();});

/* ---------- file viewer (logs, code, tables) ---------- */
var viewer=$('viewer'),vtext=$('vtext'),vhtml=$('vhtml'),vfind=$('vfind'),vlines=[],vcur=-1,vhits=[];
function renderCsv(text){
  var rows=[],row=[],cur='',q=false;for(var i=0;i<text.length;i++){var c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=c;}
    else if(c==='"')q=true;else if(c===','){row.push(cur);cur='';}else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur='';}else if(c!=='\r')cur+=c;}
  if(cur||row.length){row.push(cur);rows.push(row);}
  var big=rows.length>400,show=big?rows.slice(0,400):rows;
  function cell(v){var n=Number(v);return v!==''&&isFinite(n)&&/[.eE]/.test(v)&&v.length>9?n.toPrecision(6).replace(/\.?0+$/,''):v;}
  return (big?'<p class="small">Showing the first 400 of '+rows.length+' rows. Download the file for all of them.</p>':'')+'<div class="tablewrap"><table><tr>'+show[0].map(function(h){return '<th>'+esc(h)+'</th>';}).join('')+'</tr>'+show.slice(1).map(function(r){return '<tr>'+r.map(function(v){return '<td'+(isFinite(Number(v))&&v!==''?' class="n"':'')+'>'+esc(cell(v))+'</td>';}).join('')+'</tr>';}).join('')+'</table></div>';
}
function doFind(term,jump){
  vhits=[];vcur=-1;var t=(term||'').toLowerCase();
  [].forEach.call(vtext.children,function(el,i){el.classList.remove('hit','cur');if(t&&vlines[i].toLowerCase().indexOf(t)>-1){el.classList.add('hit');vhits.push(i);}});
  $('vcount').textContent=t?(vhits.length+' match'+(vhits.length===1?'':'es')):'';
  if(vhits.length&&jump!==false)go(0);
}
function go(k){if(!vhits.length)return;if(vcur>-1)vtext.children[vhits[vcur]].classList.remove('cur');vcur=(k+vhits.length)%vhits.length;var el=vtext.children[vhits[vcur]];el.classList.add('cur');vtext.scrollTop=Math.max(0,el.offsetTop-vtext.clientHeight/3);}
vfind.addEventListener('input',function(){doFind(vfind.value);});
vfind.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go(vcur+(e.shiftKey?-1:1));}});
SB.view=function(file,find){
  $('vname').textContent=file.replace(/^files\//,'');$('vraw').href=file;
  var gh=file.replace(/^files\//,'').replace(/\.rtf\.txt$/,'.rtf');$('vgh').href=REPO+'/blob/main/'+gh;
  vtext.innerHTML='';vhtml.innerHTML='';vfind.value=find||'';$('vcount').textContent='Loading…';
  if(!viewer.open)viewer.showModal();
  fetch(file).then(function(r){if(!r.ok)throw new Error(r.status);return r.text();}).then(function(text){
    var isCsv=/\.csv$/.test(file);
    vtext.style.display=isCsv?'none':'';vhtml.style.display=isCsv?'':'none';vfind.style.display=isCsv?'none':'';
    if(isCsv){vhtml.innerHTML=renderCsv(text);$('vcount').textContent='';return;}
    vlines=text.replace(/\r/g,'').split('\n');
    var frag=document.createDocumentFragment();vlines.forEach(function(l,i){var s=document.createElement('span');s.className='ln';var n=document.createElement('i');n.textContent=i+1;s.appendChild(n);s.appendChild(document.createTextNode(l||' '));frag.appendChild(s);});
    vtext.appendChild(frag);doFind(find||'');if(!find)vtext.scrollTop=0;
  }).catch(function(){$('vcount').textContent='';vtext.style.display='';vtext.textContent='This file could not be loaded here. Use the GitHub link above.';});
};
document.addEventListener('click',function(e){var a=e.target.closest('a.src,[data-file]');if(!a||!a.getAttribute('data-file'))return;e.preventDefault();SB.view(a.getAttribute('data-file'),a.getAttribute('data-find')||'');});

/* ---------- source drawer: what the paper says at a cited place ---------- */
var drawer=$('drawer');
SB.ref=function(id){
  var s=(window.SOURCES||{})[id];if(!s)return;
  var docName=DOCS[s.doc].name;
  var h='<div class="loc">'+esc(docName)+', '+esc(s.loc)+'</div><h3>'+esc(s.title)+'</h3>';
  h+='<div class="blk"><h4>What the paper reports here</h4>'+s.says+'</div>';
  if(s.found)h+='<div class="blk"><h4>What we find</h4>'+s.found+'</div>';
  if(s.links&&s.links.length)h+='<div class="blk"><h4>Check it</h4>'+s.links.map(function(l){return l.file?'<a class="src" data-file="'+esc(l.file)+'" data-find="'+esc(l.find||'')+'">'+esc(l.label)+'</a>':'<a href="'+esc(l.href)+'">'+esc(l.label)+'</a>';}).join(' ')+'</div>';
  h+='<p><button class="btn" id="dOpen">Open this page in my copy of the PDF</button> <a class="btn alt" target="_blank" rel="noopener" href="'+(s.doc==='sm'?PUB.sm+'#page='+s.page:PUB.main)+'">Open at the publisher</a></p>';
  h+='<p class="small">The paper is under copyright, so this site does not host it. Choose your own copy once and it stays in this browser; every reference then opens at the exact page.</p>';
  $('dbody').innerHTML=h;$('dtitle').textContent=s.loc;
  $('dOpen').addEventListener('click',function(){SB.pdf(s.doc,s.page);});
  if(!drawer.open)drawer.showModal();
};
document.addEventListener('click',function(e){var a=e.target.closest('a.ref');if(!a)return;e.preventDefault();SB.ref(a.getAttribute('data-s'));});
document.addEventListener('click',function(e){var a=e.target.closest('a.pg');if(!a)return;e.preventDefault();SB.pdf(a.getAttribute('data-doc'),+a.getAttribute('data-p'));});
[].forEach.call(document.querySelectorAll('dialog [data-close]'),function(b){b.addEventListener('click',function(){b.closest('dialog').close();});});
[drawer,viewer,$('pdfv')].forEach(function(d){d.addEventListener('click',function(e){if(e.target===d)d.close();});});

/* ---------- local PDF viewer: the reader's own copy, kept in this browser only ---------- */
var PDFJS='assets/pdfjs/'; /* pdf.js 3.11.174 (Mozilla, Apache-2.0), shipped with the site */
var pdfv=$('pdfv'),pdfDocs={},pdfState={doc:null,key:null,page:1,scale:1.4,first:1};
function idb(){return new Promise(function(res,rej){try{var r=indexedDB.open('paper-copies',1);r.onupgradeneeded=function(){r.result.createObjectStore('f');};r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};}catch(e){rej(e);}});}
function idbGet(k){return idb().then(function(db){return new Promise(function(res){var q=db.transaction('f').objectStore('f').get(k);q.onsuccess=function(){res(q.result||null);};q.onerror=function(){res(null);};});}).catch(function(){return null;});}
function idbSet(k,v){return idb().then(function(db){return new Promise(function(res){var t=db.transaction('f','readwrite');t.objectStore('f').put(v,k);t.oncomplete=res;t.onerror=res;});}).catch(function(){});}
function idbDel(k){return idb().then(function(db){return new Promise(function(res){var t=db.transaction('f','readwrite');t.objectStore('f').delete(k);t.oncomplete=res;t.onerror=res;});}).catch(function(){});}
function loadLib(){return new Promise(function(res,rej){if(window.pdfjsLib)return res();var s=document.createElement('script');s.src=PDFJS+'pdf.min.js';s.onload=function(){window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS+'pdf.worker.min.js';res();};s.onerror=rej;document.head.appendChild(s);});}
function pageText(doc,n){return doc.getPage(n).then(function(p){return p.getTextContent();}).then(function(tc){return tc.items.map(function(i){return i.str;}).join(' ');});}
function openBuffer(key,buf){
  return loadLib().then(function(){return window.pdfjsLib.getDocument({data:buf.slice(0)}).promise;}).then(function(doc){
    return pageText(doc,1).then(function(t1){
      var info={doc:doc,first:1,warn:''};
      var ex=DOCS[key].pages;
      if(key==='main')info.first=/editor.?s note/i.test(t1)?2:1;
      if(doc.numPages<ex[0]||doc.numPages>ex[1])info.warn='This file has '+doc.numPages+' pages. The '+DOCS[key].name.toLowerCase()+' should have '+(ex[0]===ex[1]?ex[0]:'about 7')+', so page positions may be off.';
      pdfDocs[key]=info;return info;});});
}
function target(key,page){var info=pdfDocs[key];var n=key==='main'?(page-831+info.first):page;return Math.max(1,Math.min(info.doc.numPages,n));}
function renderPdf(){
  var info=pdfDocs[pdfState.key];if(!info)return;
  $('pdfpage').textContent='Page '+pdfState.page+' of '+info.doc.numPages+(pdfState.key==='main'?' (journal p. '+(pdfState.page-info.first+831)+')':'');
  info.doc.getPage(pdfState.page).then(function(p){
    var dpr=Math.min(window.devicePixelRatio||1,2),vp=p.getViewport({scale:pdfState.scale*dpr}),c=$('pdfcanvas');
    c.width=vp.width;c.height=vp.height;c.style.width=(vp.width/dpr)+'px';
    return p.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;}).then(function(){$('pdfbody').scrollTop=0;});
}
function askFile(key,page,msg){
  $('pdfask').style.display='';$('pdfcanvas').style.display='none';
  $('pdfmsg').innerHTML=(msg?'<b>'+esc(msg)+'</b><br>':'')+'Choose your copy of the <b>'+DOCS[key].pick+'</b> (Zhang et al. 2026). It is read on this device only and is never uploaded.';
  var inp=$('pdffile');inp.value='';inp.onchange=function(){var f=inp.files[0];if(!f)return;f.arrayBuffer().then(function(buf){
      return openBuffer(key,buf).then(function(){idbSet(key,buf);show(key,page);});}).catch(function(){askFile(key,page,'That file could not be read as a PDF.');});};
}
function show(key,page){
  var info=pdfDocs[key];pdfState.key=key;pdfState.page=target(key,page);
  $('pdfask').style.display='none';$('pdfcanvas').style.display='';
  $('pdftitle').textContent=DOCS[key].name+(info.warn?'. '+info.warn:'');
  renderPdf();
}
SB.pdf=function(key,page){
  if(!pdfv.open)pdfv.showModal();$('pdftitle').textContent='Opening…';
  if(pdfDocs[key])return show(key,page);
  idbGet(key).then(function(buf){if(!buf)return askFile(key,page);openBuffer(key,buf).then(function(){show(key,page);}).catch(function(){askFile(key,page);});});
};
$('pdfprev').addEventListener('click',function(){if(pdfState.page>1){pdfState.page--;renderPdf();}});
$('pdfnext').addEventListener('click',function(){var i=pdfDocs[pdfState.key];if(i&&pdfState.page<i.doc.numPages){pdfState.page++;renderPdf();}});
$('pdfin').addEventListener('click',function(){pdfState.scale=Math.min(3,pdfState.scale+0.2);renderPdf();});
$('pdfout').addEventListener('click',function(){pdfState.scale=Math.max(0.6,pdfState.scale-0.2);renderPdf();});
$('pdfswap').addEventListener('click',function(){var k=pdfState.key;if(!k)return;delete pdfDocs[k];idbDel(k).then(function(){askFile(k,pdfState.page);});});

/* ---------- deep links: #view=<file>&find=<text> and #ref=<id> ---------- */
function fromHash(){var h=location.hash.slice(1);if(!h)return;var m=/(?:^|&)view=([^&]+)/.exec(h),f=/(?:^|&)find=([^&]*)/.exec(h),r=/(?:^|&)ref=([^&]+)/.exec(h);
  if(m)SB.view(decodeURIComponent(m[1]),f?decodeURIComponent(f[1]):'');else if(r)SB.ref(decodeURIComponent(r[1]));}
window.addEventListener('hashchange',fromHash);fromHash();
})();
