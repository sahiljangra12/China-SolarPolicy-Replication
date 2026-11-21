/* Small charts and tables on the Evidence, Paper check and Library pages, drawn from Stata output in data.js */
(function(){
'use strict';
var D=window.DATA,$=function(id){return document.getElementById(id);};
var NS='http://www.w3.org/2000/svg';
function el(tag,a,text){var e=document.createElementNS(NS,tag);for(var k in a)e.setAttribute(k,a[k]);if(text!=null)e.textContent=text;return e;}
function clear(s){while(s.firstChild)s.removeChild(s.firstChild);}
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim();}
function num(n){return Number(n).toLocaleString('en-US');}
function hbars(svg,rows,opt){ /* rows: [label, value, note] */
  clear(svg);var W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height,lw=opt.lw||210,max=Math.max.apply(null,rows.map(function(r){return r[1];})),bh=(H-8)/rows.length;
  rows.forEach(function(r,i){var y=4+i*bh,w=Math.max(2,(W-lw-110)*r[1]/max);
    svg.appendChild(el('text',{x:lw-8,y:y+bh/2+4,'text-anchor':'end','font-size':12,fill:css('--ink')},r[0]));
    svg.appendChild(el('rect',{x:lw,y:y+bh*0.18,width:w,height:bh*0.64,rx:3,fill:i===(opt.hi==null?-1:opt.hi)?css('--accent'):css('--brand')}));
    svg.appendChild(el('text',{x:lw+w+6,y:y+bh/2+4,'font-size':12,fill:css('--muted')},r[2]||num(r[1])));});
}
function vbars(svg,rows,opt){ /* rows: [label, value] */
  clear(svg);var W=+svg.viewBox.baseVal.width,H=+svg.viewBox.baseVal.height,m={l:8,r:8,t:18,b:26},max=Math.max.apply(null,rows.map(function(r){return r[1];})),bw=(W-m.l-m.r)/rows.length;
  rows.forEach(function(r,i){var h=(H-m.t-m.b)*r[1]/max,x=m.l+i*bw;
    svg.appendChild(el('rect',{x:x+bw*0.15,y:H-m.b-h,width:bw*0.7,height:h,rx:3,fill:(opt&&opt.color)||css('--brand')}));
    svg.appendChild(el('text',{x:x+bw/2,y:H-m.b-h-4,'text-anchor':'middle','font-size':11,fill:css('--muted')},num(r[1])));
    svg.appendChild(el('text',{x:x+bw/2,y:H-8,'text-anchor':'middle','font-size':11,fill:css('--ink')},r[0]));});
}
function draw(){
  if($('c_flow'))hbars($('c_flow'),D.flow.map(function(r){return [r[0],r[1],num(r[1])+' rows, '+num(r[2])+' counties'];}),{lw:190,hi:3});
  if($('c_years'))vbars($('c_years'),D.years);
  if($('c_coh'))vbars($('c_coh'),D.cohorts.map(function(r){return [r[0],r[1]];}));
  if($('c_imp')){var svg=$('c_imp');clear(svg);var W=900,lw=150,bw=W-lw-20;
    [['Urban districts',D.imp.urban,0],['Rural counties',D.imp.rural,1]].forEach(function(g,i){var y=14+i*62,f=g[1][0]/g[1][1];
      svg.appendChild(el('text',{x:lw-10,y:y+24,'text-anchor':'end','font-size':13,fill:css('--ink'),'font-weight':600},g[0]));
      svg.appendChild(el('rect',{x:lw,y:y,width:bw,height:36,rx:4,fill:css('--brand-soft')}));
      svg.appendChild(el('rect',{x:lw,y:y,width:Math.max(3,bw*f),height:36,rx:4,fill:css('--accent')}));
      svg.appendChild(el('text',{x:lw+Math.max(3,bw*f)+8,y:y+23,'font-size':13,fill:f>0.6?'#fff':css('--ink')},''));
      svg.appendChild(el('text',{x:f>0.5?lw+12:lw+bw*f+10,y:y+23,'font-size':13,fill:f>0.5?'#fff':css('--ink'),'font-weight':600},num(g[1][0])+' of '+num(g[1][1])+' counties have PSI filled in as 0 ('+(f*100).toFixed(0)+'%)'));});
    svg.appendChild(el('text',{x:lw,y:142,'font-size':11,fill:css('--muted')},'Counties in the regression sample. Orange: PSI missing from the policy file and set to 0.'));}
}
draw();document.addEventListener('themechange',draw);

/* reproduction check table */
var t=$('t_repro');
if(t){t.innerHTML='<tr><th>Result</th><th class="n">Paper</th><th class="n">Ours</th><th class="n">Paper SE</th><th class="n">Our SE</th><th class="n">N</th><th>Match</th></tr>'+D.repro.map(function(r){
  return '<tr><td>'+SB.esc(r[0])+'</td><td class="n">'+r[1]+'</td><td class="n">'+(+r[3]).toFixed(4)+'</td><td class="n">'+r[2]+'</td><td class="n">'+(+r[4]).toFixed(4)+'</td><td class="n">'+num(r[5])+'</td><td>'+(r[6]==1?'<span class="tag no">✓ exact</span>':'<span class="tag yes">differs</span>')+'</td></tr>';}).join('');}
})();
