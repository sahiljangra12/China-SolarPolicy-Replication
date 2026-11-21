/* Live tools. A, C, D read Stata output from data.js; B applies the Cinelli-Hazlett formulas to Stata inputs. */
(function(){
'use strict';
var D=window.DATA,$=function(id){return document.getElementById(id);};
if(!$('s_y'))return;
var NS='http://www.w3.org/2000/svg';
function el(tag,a,text){var e=document.createElementNS(NS,tag);for(var k in a)e.setAttribute(k,a[k]);if(text!=null)e.textContent=text;return e;}
function clear(s){while(s.firstChild)s.removeChild(s.firstChild);}
function fmt(x,d){if(x==null||isNaN(x))return 'n/a';var s=Math.abs(x).toFixed(d==null?4:d);return (x<0?'−':(x>0?'+':''))+s;}
function fmtp(p){return p<0.001?'< 0.001':p.toFixed(3);}
function num(n){return n.toLocaleString('en-US');}
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim();}

/* ================= A. specification explorer ================= */
var L={
  y:{ShannonBD:'Shannon diversity (paper’s outcome)',Richness:'Species richness (number of species)',Evenness:'Evenness',lnBN:'ln(birdwatcher records): effort'},
  d:{PI:'Policy Stringency Index (PSI)',Area:'Solar-plant area (km²)'},
  fe:{f1:'County + year-month (paper)',f2:'County + urban × year-month',f3:'County + province × year-month'},
  smp:{all:'All counties (paper)',realpsi:'Counties with real PSI only',icfile:'Counties in the solar-capacity file',rural:'Rural counties only'},
  ctrl:{c0:'No controls',c1:'Paper’s 9 controls',c2:'9 controls + ln(birdwatcher records)'},
  cl:{county:'County (paper)',city:'City',prov:'Province'}
};
var S={y:'Shannon',d:'',fe:{f1:'county + month',f2:'urban × month',f3:'province × month'},smp:{all:'all',realpsi:'real PSI',icfile:'capacity file',rural:'rural'},ctrl:{c0:'none',c1:'9 controls',c2:'9 + records'}};
var KEYS=['y','d','fe','smp','ctrl','cl'],IDX={};
D.specs.forEach(function(s){IDX[s.slice(0,6).join('|')]=s;});
var ready=false;
var DEF={y:'ShannonBD',d:'PI',fe:'f1',smp:'all',ctrl:'c1',cl:'county'},sel=JSON.parse(JSON.stringify(DEF)),pins=[];
KEYS.forEach(function(k){var s=$('s_'+k);for(var v in L[k]){var o=document.createElement('option');o.value=v;o.textContent=L[k][v];s.appendChild(o);}
  s.addEventListener('change',function(){sel[k]=s.value;fixSel();drawSpec();});});
function fixSel(){if(sel.y==='lnBN'&&sel.ctrl==='c2')sel.ctrl='c1';$('s_ctrl').querySelector('option[value=c2]').disabled=(sel.y==='lnBN');KEYS.forEach(function(k){$('s_'+k).value=sel[k];});}
[].forEach.call(document.querySelectorAll('[data-preset]'),function(b){b.addEventListener('click',function(){var p=JSON.parse(b.getAttribute('data-preset'));sel=JSON.parse(JSON.stringify(DEF));for(var k in p)sel[k]=p[k];fixSel();drawSpec();});});
function key(){return KEYS.map(function(k){return sel[k];}).join('|');}
function cur(){return IDX[key()];}
function stataCmd(x){x=x||sel;
  var X={c0:'',c1:(x.y==='lnBN'?' $control_noD':' $control'),c2:' $control lnBN'}[x.ctrl];
  var cond={all:'',realpsi:' if in_PI_file==1',icfile:' if in_IC_file==1',rural:' if urban==0'}[x.smp];
  var abs={f1:'county year',f2:'county year#urban',f3:'county prov#year'}[x.fe];
  return 'reghdfe '+x.y+' '+x.d+X+cond+', absorb('+abs+') cluster('+x.cl+')';}
function drawSpec(){
  var s=cur();if(!s)return;
  var b=s[6],se=s[7],p=s[8],lo=b-1.96*se,hi=b+1.96*se,sig=p<0.05;
  var unit=sel.d==='PI'?'one more PSI point':'one more km² of solar plant';
  var out={ShannonBD:'the Shannon index',Richness:'the number of species recorded',Evenness:'evenness',lnBN:'ln(birdwatcher records)'}[sel.y];
  $('r_b').textContent=fmt(b);$('r_se').textContent=se.toFixed(4);$('r_ci').textContent='['+fmt(lo)+', '+fmt(hi)+']';$('r_p').textContent=fmtp(p);
  $('r_n').textContent=num(s[9])+' county-months, '+num(s[10])+' clusters';
  var tag=$('r_tag');tag.className='tag '+(sig?(b<0?'yes':'no'):'mid');tag.textContent=sig?(b<0?'Negative and significant':'Positive and significant'):'Not significant at 5%';
  var n=[];
  n.push('<b>Reading:</b> '+unit+' goes with a change of '+fmt(b)+' in '+out+(sel.y==='lnBN'?' (about '+(b*100).toFixed(1)+'%)':'')+'. '+(sig?'This is statistically distinguishable from zero.':'This cannot be distinguished from zero.'));
  if(sel.d==='PI'&&sel.smp==='all'&&sel.fe!=='f2')n.push('<b>Note:</b> this sample includes the 724 counties, almost all urban, whose missing PSI was set to 0.');
  if(sel.fe==='f2')n.push('<b>Note:</b> urban and rural counties get separate monthly shocks, so urban is compared with urban and rural with rural.');
  if(sel.ctrl==='c2')n.push('<b>Caution:</b> birdwatcher records may themselves respond to birds, so holding them fixed is a diagnostic, not a correction.');
  if(sel.y==='lnBN'&&sel.ctrl==='c1')n.push('<b>Note:</b> Duration is left out of the controls here because it is built from this outcome.');
  if(sel.cl==='prov')n.push('<b>Caution:</b> only '+s[10]+' province clusters, so these standard errors are unreliable.');
  if(sel.d==='Area'&&sel.smp!=='icfile')n.push('<b>Note:</b> solar area is set to 0 for 1,184 counties missing from the capacity file.');
  $('r_notes').innerHTML=n.map(function(x){return '<li>'+x+'</li>';}).join('');
  $('r_cmd').textContent=stataCmd();
  var base=IDX[[sel.y,sel.d,'f1','all','c1','county'].join('|')];
  $('r_base').textContent=base===s?'This is the paper’s specification for this outcome and treatment.':'Paper’s specification for the same outcome and treatment: '+fmt(base[6])+' (SE '+base[7].toFixed(4)+').';
  if(ready){try{history.replaceState(null,'','#spec='+key());}catch(e){}}
  drawCurve(s);
}
function drawCurve(s){
  var all=D.specs.filter(function(x){return x[0]===sel.y&&x[1]===sel.d;}).slice().sort(function(a,b){return a[6]-b[6];});
  var a=0,ns=0,c=0;all.forEach(function(x){if(x[8]<0.05){if(x[6]<0)a++;else c++;}else ns++;});
  $('curveSum').innerHTML='Of the <b>'+all.length+'</b> specifications: <b>'+a+'</b> negative and significant, <b>'+ns+'</b> not significant, <b>'+c+'</b> positive and significant.';
  var svg=$('curve');clear(svg);var W=900,H=300,m={l:62,r:14,t:14,b:30};
  var los=all.map(function(x){return x[6]-1.96*x[7];}).sort(function(p,q){return p-q;}),his=all.map(function(x){return x[6]+1.96*x[7];}).sort(function(p,q){return p-q;});
  var y0=Math.min(los[Math.floor(los.length*0.04)],0),y1=Math.max(his[Math.ceil(his.length*0.96)-1],0),pad=(y1-y0)*0.06;y0-=pad;y1+=pad;
  function X(i){return m.l+(i+0.5)*(W-m.l-m.r)/all.length;}function Y(v){return m.t+(y1-Math.max(y0,Math.min(y1,v)))*(H-m.t-m.b)/(y1-y0);}
  var ink=css('--muted'),line=css('--line');
  for(var t=0;t<=4;t++){var v=y0+(y1-y0)*t/4;svg.appendChild(el('line',{x1:m.l,x2:W-m.r,y1:Y(v),y2:Y(v),stroke:line}));svg.appendChild(el('text',{x:m.l-8,y:Y(v)+4,'text-anchor':'end','font-size':11,fill:ink},v.toFixed(Math.abs(y1-y0)<0.5?3:2)));}
  svg.appendChild(el('line',{x1:m.l,x2:W-m.r,y1:Y(0),y2:Y(0),stroke:css('--ink'),'stroke-width':1.2}));
  svg.appendChild(el('text',{x:m.l,y:H-8,'font-size':11,fill:ink},'Each dot is one specification, sorted by estimate. Bars are 95% intervals. Click a dot to load it.'));
  all.forEach(function(x,i){var col=x[8]<0.05?(x[6]<0?css('--neg'):css('--pos')):css('--muted'),isSel=(x===s);
    svg.appendChild(el('line',{x1:X(i),x2:X(i),y1:Y(x[6]-1.96*x[7]),y2:Y(x[6]+1.96*x[7]),stroke:col,'stroke-width':isSel?2.5:1,opacity:isSel?1:0.45}));
    var c=el('circle',{cx:X(i),cy:Y(x[6]),r:isSel?6.5:3,fill:col,stroke:isSel?css('--ink'):'none','stroke-width':2,style:'cursor:pointer'});
    c.appendChild(el('title',{},fmt(x[6])+' (p '+fmtp(x[8])+') | '+L.fe[x[2]]+' | '+L.smp[x[3]]+' | '+L.ctrl[x[4]]+' | cluster: '+x[5]));
    c.addEventListener('click',function(){KEYS.forEach(function(k,j){sel[k]=x[j];});fixSel();drawSpec();});svg.appendChild(c);});
}
$('b_copy').addEventListener('click',function(){SB.copy($('r_cmd').textContent,'Stata command copied');});
$('b_share').addEventListener('click',function(){SB.copy(location.href.split('#')[0]+'#spec='+key(),'Link copied');});
function drawPins(){
  $('pinwrap').style.display=pins.length?'':'none';
  $('pins').innerHTML='<tr><th>Outcome</th><th>Treatment</th><th>Fixed effects</th><th>Sample</th><th>Controls</th><th>Cluster</th><th class="n">Estimate</th><th class="n">SE</th><th class="n">p</th><th class="n">N</th><th></th></tr>'+pins.map(function(k,i){var s=IDX[k];
    return '<tr><td>'+s[0]+'</td><td>'+s[1]+'</td><td>'+S.fe[s[2]]+'</td><td>'+S.smp[s[3]]+'</td><td>'+S.ctrl[s[4]]+'</td><td>'+s[5]+'</td><td class="n"><b>'+fmt(s[6])+'</b></td><td class="n">'+s[7].toFixed(4)+'</td><td class="n">'+fmtp(s[8])+'</td><td class="n">'+num(s[9])+'</td><td><button data-unpin="'+i+'" title="Remove">×</button></td></tr>';}).join('');
}
$('b_pin').addEventListener('click',function(){var k=key();if(pins.indexOf(k)<0){pins.push(k);drawPins();SB.toast('Pinned');}});
$('pins').addEventListener('click',function(e){var b=e.target.closest('[data-unpin]');if(b){pins.splice(+b.getAttribute('data-unpin'),1);drawPins();}});

/* ================= B. sensitivity calculator ================= */
var sSpec=$('sens_spec'),sK=$('sens_k'),sD=$('sens_d'),sY=$('sens_y'),mode='k';
function SS(){return D.sens[sSpec.value];}
function bench(s,k){var r2d=s.tD_dur*s.tD_dur/(s.tD_dur*s.tD_dur+s.dfD),r2y=s.tY_dur*s.tY_dur/(s.tY_dur*s.tY_dur+s.dfY);
  var r2dz=k*r2d/(1-r2d),rz=k*r2d*r2d/((1-k*r2d)*(1-r2d));
  return [r2dz,Math.min(0.999,Math.pow((Math.sqrt(k)+Math.sqrt(rz))/Math.sqrt(1-rz),2)*r2y/(1-r2y))];}
function adj(s,r2dz,r2yz){var bias=Math.sqrt(r2yz*r2dz/(1-r2dz))*s.se*Math.sqrt(s.df);
  var est=s.b+(s.b<0?bias:-bias),se=s.se*Math.sqrt((1-r2yz)/(1-r2dz))*Math.sqrt(s.df/(s.df-1));return {est:est,se:se,t:est/se};}
function rv(s,q){var f2=Math.pow(s.b/s.se,2)/s.df;if(q){var f=Math.sqrt(f2)-1.96/Math.sqrt(s.df-1);if(f<=0)return 0;f2=f*f;}return 0.5*(Math.sqrt(f2*f2+4*f2)-f2);}
[].forEach.call(document.querySelectorAll('input[name=sens_mode]'),function(r){r.addEventListener('change',function(){mode=r.value;$('sens_kwrap').style.display=mode==='k'?'':'none';$('sens_fwrap').style.display=mode==='k'?'none':'';drawSens();});});
[sSpec,sK,sD,sY].forEach(function(x){x.addEventListener('input',drawSens);});
function drawSens(){
  var s=SS(),pt;
  if(mode==='k'){var k=+sK.value;$('sens_kv').textContent=k.toFixed(1)+'×';pt=k===0?[0,0]:bench(s,k);}
  else{pt=[+sD.value/100,+sY.value/100];$('sens_dv').textContent=(+sD.value).toFixed(2)+'%';$('sens_yv').textContent=(+sY.value).toFixed(1)+'%';}
  var a=adj(s,pt[0],pt[1]),sig=Math.abs(a.t)>1.96,flipped=(a.est>0)!==(s.b>0);
  $('sens_b0').textContent=fmt(s.b)+' (SE '+s.se.toFixed(4)+')';$('sens_rv').textContent=(rv(s,false)*100).toFixed(2)+'%';
  var rq=rv(s,true);$('sens_rva').textContent=rq>0?(rq*100).toFixed(2)+'%':'already not significant';
  $('sens_pt').textContent=(pt[0]*100).toFixed(3)+'% of PSI, '+(pt[1]*100).toFixed(2)+'% of Shannon';
  $('sens_est').textContent=fmt(a.est)+' (SE '+a.se.toFixed(4)+', t '+fmt(a.t,2)+')';
  var tag=$('sens_tag');tag.className='tag '+(flipped?'no':(sig?'yes':'mid'));tag.textContent=flipped?'Sign reversed':(sig?'Still negative and significant':'No longer significant');
  var svg=$('sensmap');clear(svg);var W=900,H=320,m={l:62,r:16,t:14,b:44},xm=0.012,ym=0.6;
  function X(v){return m.l+Math.min(v,xm)/xm*(W-m.l-m.r);}function Y(v){return H-m.b-Math.min(v,ym)/ym*(H-m.t-m.b);}
  var ink=css('--muted'),line=css('--line');
  for(var i=0;i<=4;i++){var xv=xm*i/4,yv=ym*i/4;svg.appendChild(el('line',{x1:X(xv),x2:X(xv),y1:m.t,y2:H-m.b,stroke:line}));svg.appendChild(el('line',{x1:m.l,x2:W-m.r,y1:Y(yv),y2:Y(yv),stroke:line}));
    svg.appendChild(el('text',{x:X(xv),y:H-m.b+15,'text-anchor':'middle','font-size':11,fill:ink},(xv*100).toFixed(1)+'%'));svg.appendChild(el('text',{x:m.l-8,y:Y(yv)+4,'text-anchor':'end','font-size':11,fill:ink},(yv*100).toFixed(0)+'%'));}
  svg.appendChild(el('text',{x:(W+m.l)/2,y:H-6,'text-anchor':'middle','font-size':12,fill:ink},'Share of leftover PSI variation the confounder explains'));
  svg.appendChild(el('text',{x:14,y:(H-m.b+m.t)/2,'text-anchor':'middle','font-size':12,fill:ink,transform:'rotate(-90 14 '+((H-m.b+m.t)/2)+')'},'Share of leftover Shannon variation'));
  function contour(test,color,dash){var d='',st=false;for(var j=1;j<=240;j++){var x=xm*j/240,lo=0,hi=0.999;if(!test(adj(s,x,hi)))continue;for(var it=0;it<40;it++){var mid=(lo+hi)/2;if(test(adj(s,x,mid)))hi=mid;else lo=mid;}if(hi>ym)continue;d+=(st?'L':'M')+X(x).toFixed(1)+' '+Y(hi).toFixed(1);st=true;}
    if(d)svg.appendChild(el('path',{d:d,fill:'none',stroke:color,'stroke-width':2.2,'stroke-dasharray':dash||''}));}
  if(Math.abs(s.b/s.se)>1.96)contour(function(a){return s.b<0?(a.est+1.96*a.se>0):(a.est-1.96*a.se<0);},css('--warn'),'6 4');
  contour(function(a){return (a.est>0)!==(s.b>0)||a.est===0;},css('--bad'));
  for(var k2=1;k2<=5;k2++){var bp=bench(s,k2);if(bp[0]<=xm&&bp[1]<=ym){svg.appendChild(el('rect',{x:X(bp[0])-4,y:Y(bp[1])-4,width:8,height:8,fill:css('--brand'),transform:'rotate(45 '+X(bp[0])+' '+Y(bp[1])+')'}));svg.appendChild(el('text',{x:X(bp[0])+9,y:Y(bp[1])+13,'font-size':11,fill:css('--brand')},k2+'× Duration'));}}
  svg.appendChild(el('circle',{cx:X(pt[0]),cy:Y(pt[1]),r:8,fill:css('--accent-fill'),stroke:css('--ink'),'stroke-width':2}));
  svg.appendChild(el('text',{x:W-m.r-4,y:m.t+14,'text-anchor':'end','font-size':11,fill:css('--bad')},'Solid line: estimate reaches zero'));
  svg.appendChild(el('text',{x:W-m.r-4,y:m.t+29,'text-anchor':'end','font-size':11,fill:css('--warn')},'Dashed line: estimate stops being significant'));
}

/* ================= C. IV exclusion slider ================= */
var ivCl=$('iv_cl'),ivG=$('iv_g');
function ivArr(){return D.iv[ivCl.value];}
function nearest(arr,g){var bi=0;arr.forEach(function(r,i){if(Math.abs(r[0]-g)<Math.abs(arr[bi][0]-g))bi=i;});return bi;}
ivG.max=ivArr().length-1;ivG.value=nearest(ivArr(),0);
ivCl.addEventListener('change',drawIV);ivG.addEventListener('input',drawIV);
[].forEach.call(document.querySelectorAll('[data-g]'),function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-g');ivG.value=nearest(ivArr(),v==='hat'?D.ghat:(v==='lo'?D.ghat-1.96*D.gse:0));drawIV();});});
function drawIV(){
  var arr=ivArr(),r=arr[+ivG.value],lo=r[1]-1.96*r[2],hi=r[1]+1.96*r[2],sig=lo>0||hi<0,F=D.iv['F_'+ivCl.value];
  $('iv_gv').textContent=r[0]===0?'0':fmt(r[0],5);$('iv_b').textContent=fmt(r[1]);$('iv_se').textContent=r[2].toFixed(4);$('iv_ci').textContent='['+fmt(lo)+', '+fmt(hi)+']';
  $('iv_f').textContent=F.toFixed(1)+(F>23.1?' (passes 23.1)':' (fails 23.1)');
  var tag=$('iv_tag');tag.className='tag '+(sig?(r[1]<0?'yes':'no'):'mid');tag.textContent=sig?(r[1]<0?'Negative and significant':'Positive and significant'):'Not significant at 5%';
  $('iv_share').textContent=r[0]===0?'This is the paper’s assumption: the instrument affects birds only through PSI.':'Assumes each unit of the instrument changes Shannon by '+fmt(r[0],5)+' directly, apart from PSI. The estimated direct effect is '+fmt(D.ghat,5)+' (95% interval '+fmt(D.ghat-1.96*D.gse,5)+' to '+fmt(D.ghat+1.96*D.gse,5)+').';
  var svg=$('ivchart');clear(svg);var W=900,H=300,m={l:62,r:16,t:14,b:44},x0=arr[0][0],x1=arr[arr.length-1][0];
  var y0=Math.min.apply(null,arr.map(function(a){return a[1]-1.96*a[2];})),y1=Math.max.apply(null,arr.map(function(a){return a[1]+1.96*a[2];}));
  function X(v){return m.l+(v-x0)/(x1-x0)*(W-m.l-m.r);}function Y(v){return m.t+(y1-v)/(y1-y0)*(H-m.t-m.b);}
  var ink=css('--muted'),line=css('--line');
  svg.appendChild(el('rect',{x:X(D.ghat-1.96*D.gse),y:m.t,width:X(D.ghat+1.96*D.gse)-X(D.ghat-1.96*D.gse),height:H-m.t-m.b,fill:css('--brand-soft')}));
  for(var i=0;i<=4;i++){var yv=y0+(y1-y0)*i/4;svg.appendChild(el('line',{x1:m.l,x2:W-m.r,y1:Y(yv),y2:Y(yv),stroke:line}));svg.appendChild(el('text',{x:m.l-8,y:Y(yv)+4,'text-anchor':'end','font-size':11,fill:ink},yv.toFixed(2)));}
  for(var g=-0.006;g<=0.0021;g+=0.002)svg.appendChild(el('text',{x:X(g),y:H-m.b+15,'text-anchor':'middle','font-size':11,fill:ink},g.toFixed(3)));
  svg.appendChild(el('text',{x:(W+m.l)/2,y:H-6,'text-anchor':'middle','font-size':12,fill:ink},'Assumed direct effect of the instrument on Shannon (shaded: 95% interval of the estimated direct effect)'));
  var up='',dn='';arr.forEach(function(a,i){up+=(i?'L':'M')+X(a[0])+' '+Y(a[1]+1.96*a[2]);});for(var j=arr.length-1;j>=0;j--)dn+='L'+X(arr[j][0])+' '+Y(arr[j][1]-1.96*arr[j][2]);
  svg.appendChild(el('path',{d:up+dn+'Z',fill:css('--muted'),opacity:0.18}));
  svg.appendChild(el('path',{d:arr.map(function(a,i){return (i?'L':'M')+X(a[0])+' '+Y(a[1]);}).join(''),fill:'none',stroke:css('--brand'),'stroke-width':2.2}));
  svg.appendChild(el('line',{x1:m.l,x2:W-m.r,y1:Y(0),y2:Y(0),stroke:css('--ink'),'stroke-width':1.2}));
  [[0,'paper'],[D.ghat,'estimated']].forEach(function(v){svg.appendChild(el('line',{x1:X(v[0]),x2:X(v[0]),y1:m.t,y2:H-m.b,stroke:ink,'stroke-dasharray':'4 4'}));svg.appendChild(el('text',{x:X(v[0])+4,y:m.t+12,'font-size':11,fill:ink},v[1]));});
  svg.appendChild(el('line',{x1:X(r[0]),x2:X(r[0]),y1:Y(lo),y2:Y(hi),stroke:css('--accent-fill'),'stroke-width':3}));
  svg.appendChild(el('circle',{cx:X(r[0]),cy:Y(r[1]),r:7,fill:css('--accent-fill'),stroke:css('--ink'),'stroke-width':2}));
}

/* ================= D. event-study viewer ================= */
var esE=$('es_est'),esS=$('es_smp');
D.es.forEach(function(e,i){var o=document.createElement('option');o.value=i;o.textContent=e.name;esE.appendChild(o);});
function fillSmp(){var e=D.es[+esE.value];esS.innerHTML='';e.series.forEach(function(s,i){var o=document.createElement('option');o.value=i;o.textContent=s.label;esS.appendChild(o);});}
esE.addEventListener('change',function(){fillSmp();drawES();});esS.addEventListener('change',drawES);
function drawES(){
  var e=D.es[+esE.value],s=e.series[+esS.value],pts=s.pts;
  var sig=s.att&&Math.abs(s.att[0]/s.att[1])>1.96;
  $('es_att').textContent=s.att?fmt(s.att[0],3)+' (SE '+s.att[1].toFixed(3)+')':'n/a';
  var tag=$('es_tag');tag.className='tag '+(s.att?(sig?(s.att[0]<0?'yes':'no'):'mid'):'mid');tag.textContent=s.att?(sig?(s.att[0]<0?'Negative and significant':'Positive and significant'):'Not significant at 5%'):'';
  var pre=pts.filter(function(p){return p[0]<0&&p[2]>0;}),bad=pre.filter(function(p){return Math.abs(p[1]/p[2])>1.96;});
  $('es_pre').textContent=pre.length?(bad.length?bad.length+' of '+pre.length+' pre-adoption years differ from zero (year '+bad.map(function(p){return p[0];}).join(', ')+'): a warning sign for parallel trends':'None of the '+pre.length+' pre-adoption years differs from zero'):'n/a';
  var svg=$('eschart');clear(svg);var W=900,H=300,m={l:62,r:16,t:14,b:44};
  var y0=Math.min(0,Math.min.apply(null,pts.map(function(p){return p[1]-1.96*p[2];}))),y1=Math.max(0,Math.max.apply(null,pts.map(function(p){return p[1]+1.96*p[2];}))),pad=(y1-y0)*0.08;y0-=pad;y1+=pad;
  function X(k){return m.l+(k+5.5)/11*(W-m.l-m.r);}function Y(v){return m.t+(y1-v)/(y1-y0)*(H-m.t-m.b);}
  var ink=css('--muted'),line=css('--line');
  svg.appendChild(el('rect',{x:X(-0.5),y:m.t,width:W-m.r-X(-0.5),height:H-m.t-m.b,fill:css('--brand-soft'),opacity:0.6}));
  for(var i=0;i<=4;i++){var yv=y0+(y1-y0)*i/4;svg.appendChild(el('line',{x1:m.l,x2:W-m.r,y1:Y(yv),y2:Y(yv),stroke:line}));svg.appendChild(el('text',{x:m.l-8,y:Y(yv)+4,'text-anchor':'end','font-size':11,fill:ink},yv.toFixed(2)));}
  for(var k=-5;k<=5;k++)svg.appendChild(el('text',{x:X(k),y:H-m.b+15,'text-anchor':'middle','font-size':11,fill:ink},k));
  svg.appendChild(el('text',{x:(W+m.l)/2,y:H-6,'text-anchor':'middle','font-size':12,fill:ink},'Years relative to first solar policy (shaded: after adoption)'));
  svg.appendChild(el('line',{x1:m.l,x2:W-m.r,y1:Y(0),y2:Y(0),stroke:css('--ink'),'stroke-width':1.2}));
  var sorted=pts.slice().sort(function(a,b){return a[0]-b[0];});
  svg.appendChild(el('path',{d:sorted.map(function(p,i){return (i?'L':'M')+X(p[0])+' '+Y(p[1]);}).join(''),fill:'none',stroke:css('--brand'),'stroke-width':1.6,opacity:0.6}));
  sorted.forEach(function(p){var isSig=p[2]>0&&Math.abs(p[1]/p[2])>1.96,col=isSig?css('--accent-fill'):css('--brand');
    if(p[2]>0)svg.appendChild(el('line',{x1:X(p[0]),x2:X(p[0]),y1:Y(p[1]-1.96*p[2]),y2:Y(p[1]+1.96*p[2]),stroke:col,'stroke-width':2}));
    var c=el('circle',{cx:X(p[0]),cy:Y(p[1]),r:5,fill:p[2]>0?col:css('--panel'),stroke:col,'stroke-width':2});c.appendChild(el('title',{},'Year '+p[0]+': '+fmt(p[1],3)+(p[2]>0?' (SE '+p[2].toFixed(3)+')':' (reference year)')));svg.appendChild(c);});
}

/* ---------- start ---------- */
function fromHash(){var m=/spec=([^&]+)/.exec(decodeURIComponent(location.hash));if(m&&IDX[m[1]]){var v=m[1].split('|');KEYS.forEach(function(k,j){sel[k]=v[j];});return true;}return false;}
var had=fromHash();
function drawAll(){fixSel();drawSpec();drawSens();drawIV();drawES();}
fillSmp();drawAll();ready=true;
if(had)$('lab-spec').scrollIntoView();
document.addEventListener('themechange',function(){drawCurve(cur());drawSens();drawIV();drawES();});
window.addEventListener('hashchange',function(){if(fromHash()){fixSel();drawSpec();}});
})();
