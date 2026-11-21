/* Overview hero: one square per county in the regression, drawn from the Stata counts in data.js.
   Filled = policy score present in the authors' file. Outlined = score missing and set to 0. */
(function(){
'use strict';
var D=window.DATA,c=document.getElementById('h_grid');if(!c||!D)return;
var ctx=c.getContext('2d'),mode='paper',reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var G=[{name:'rural counties',n:D.imp.rural[1],miss:D.imp.rural[0]},{name:'urban districts',n:D.imp.urban[1],miss:D.imp.urban[0]}];
var IDX={};D.specs.forEach(function(s){IDX[s.slice(0,6).join('|')]=s;});
var M={paper:{k:'ShannonBD|PI|f1|all|c1|county',say:'The paper compares all 2,344 counties at once. Its “no policy” group is mostly the '+G[1].miss+' urban districts whose scores were missing.'},
       like:{k:'ShannonBD|PI|f2|all|c1|county',say:'Urban districts are compared only with urban districts, and rural counties with rural counties. The effect falls by four-fifths and is no longer distinguishable from zero.'},
       real:{k:'ShannonBD|PI|f1|realpsi|c1|county',say:'Only the counties with a real policy score. The answer is the same: no detectable effect.'}};
function num(n){return n.toLocaleString('en-US');}
function fmt(x){return (x<0?'−':'+')+Math.abs(x).toFixed(4);}
var anim={sweep:reduce?1:0,fade:0,box:0},raf=null,L=null;
function layout(){
  var W=c.parentElement.clientWidth-44,dpr=Math.min(window.devicePixelRatio||1,2),side=W>=720,lab=26,blocks=[];
  if(W<200)W=c.parentElement.clientWidth;
  if(side){var R=22,cols=G.map(function(g){return Math.ceil(g.n/R);}),sep=3,pitch=W/(cols[0]+cols[1]+sep),x=0;
    G.forEach(function(g,i){blocks.push({g:g,x:x,y:lab,cols:cols[i],rows:R,pitch:pitch});x+=(cols[i]+sep)*pitch;});
    L={W:W,H:lab+R*pitch+4,blocks:blocks};}
  else{var pitch2=Math.max(6.5,W/46),cols2=Math.floor(W/pitch2),y=lab;
    G.forEach(function(g){var rows=Math.ceil(g.n/cols2);blocks.push({g:g,x:0,y:y,cols:cols2,rows:rows,pitch:pitch2,rowMajor:true});y+=rows*pitch2+lab+10;});
    L={W:W,H:y-lab-6,blocks:blocks};}
  c.width=Math.round(L.W*dpr);c.height=Math.round(L.H*dpr);c.style.height=L.H+'px';c.style.width=L.W+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
}
function draw(){
  if(!L)return;ctx.clearRect(0,0,L.W,L.H);
  var maxCol=0;L.blocks.forEach(function(b){maxCol=Math.max(maxCol,(b.x/b.pitch)+b.cols);});
  L.blocks.forEach(function(b){
    var s=b.pitch*0.76,real=b.g.n-b.g.miss;
    ctx.font='600 13.5px "IBM Plex Sans",system-ui,sans-serif';ctx.fillStyle='#eef2ff';ctx.textBaseline='alphabetic';
    var t1=num(b.g.n)+' '+b.g.name;ctx.fillText(t1,b.x,b.y-10);
    ctx.font='400 13.5px "IBM Plex Sans",system-ui,sans-serif';ctx.fillStyle='#a9b6d8';ctx.fillText('  '+num(b.g.miss)+' set to 0',b.x+ctx.measureText(t1).width+18,b.y-10);
    for(var i=0;i<b.g.n;i++){
      var col=b.rowMajor?i%b.cols:Math.floor(i/b.rows),row=b.rowMajor?Math.floor(i/b.cols):i%b.rows;
      var gx=b.x+col*b.pitch,gy=b.y+row*b.pitch,when=((b.x/b.pitch)+col)/maxCol;
      if(when>anim.sweep)continue;
      if(i<real){ctx.globalAlpha=1;ctx.fillStyle='#6f8dff';ctx.fillRect(gx,gy,s,s);}
      else{ctx.globalAlpha=1-0.86*anim.fade;ctx.strokeStyle='#f5c543';ctx.lineWidth=Math.max(1,s*0.17);ctx.strokeRect(gx+ctx.lineWidth/2,gy+ctx.lineWidth/2,s-ctx.lineWidth,s-ctx.lineWidth);}
    }
    ctx.globalAlpha=anim.box;
    if(anim.box>0){ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);
      var bw=(b.rowMajor?b.cols:Math.ceil(b.g.n/b.rows))*b.pitch,bh=(b.rowMajor?Math.ceil(b.g.n/b.cols):b.rows)*b.pitch;
      ctx.strokeRect(b.x-5,b.y-5,Math.min(bw+7,L.W-b.x+3),bh+7);ctx.setLineDash([]);}
    ctx.globalAlpha=1;
  });
}
function tween(to,ms){
  var from={sweep:anim.sweep,fade:anim.fade,box:anim.box},t0=null;cancelAnimationFrame(raf);
  if(reduce){anim.sweep=1;anim.fade=to.fade;anim.box=to.box;draw();return;}
  function step(ts){if(t0==null)t0=ts;var p=Math.min(1,(ts-t0)/ms),e=1-Math.pow(1-p,3);
    for(var k in to)anim[k]=from[k]+(to[k]-from[k])*e;draw();if(p<1)raf=requestAnimationFrame(step);}
  raf=requestAnimationFrame(step);
}
function setMode(m,first){
  mode=m;var s=IDX[M[m].k];
  document.getElementById('h_val').textContent=fmt(s[6]);
  document.getElementById('h_sub').innerHTML='SE '+s[7].toFixed(4)+', p '+(s[8]<0.001?'&lt; 0.001':'= '+s[8].toFixed(s[8]<0.01?3:2))+'. '+(s[8]<0.05?'<b>Significant</b>':'<b>Not significant</b>')+'. '+num(s[9])+' county-months.';
  document.getElementById('h_say').textContent=M[m].say;
  [].forEach.call(document.querySelectorAll('.seg button'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-mode')===m?'true':'false');});
  tween({sweep:1,fade:m==='real'?1:0,box:m==='like'?1:0},first?1100:320);
}
[].forEach.call(document.querySelectorAll('.seg button'),function(b){b.addEventListener('click',function(){setMode(b.getAttribute('data-mode'));});});
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){layout();draw();},120);});
function start(){layout();setMode('paper',true);}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(start);else start();
})();
