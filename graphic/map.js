(function(){
'use strict';
const schools=window.SCHOOL_DATA, byCode=new Map(schools.map(s=>[s.code,s]));
const svg=document.getElementById('school-map'), area=document.getElementById('map-area'), tip=document.getElementById('tooltip');
const groups=[...document.querySelectorAll('.school')], layer=d3.select('#map-layer');
const number=new Intl.NumberFormat('bg-BG',{minimumFractionDigits:2,maximumFractionDigits:2});
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const place=value=>value.replace(/^ГР\./,'гр. ').replace(/^С\./,'с. ');
let active=null,pinned=null,transform=d3.zoomIdentity;
function positionTip(){if(!active||tip.hidden)return;const dot=active.querySelector('.school-dot').getBoundingClientRect(),box=area.getBoundingClientRect();const x=dot.left+dot.width/2-box.left,y=dot.top+dot.height/2-box.top;const width=tip.offsetWidth,height=tip.offsetHeight;let left=x+14,top=y-height-12;if(left+width>box.width-8)left=x-width-14;if(top<8)top=y+14;tip.style.left=Math.max(8,Math.min(left,box.width-width-8))+'px';tip.style.top=Math.max(8,Math.min(top,box.height-height-8))+'px';}
function show(group,pin=false){const school=byCode.get(group.dataset.code);active?.classList.remove('active');active=group;group.classList.add('active');pinned=pin?school.code:null;tip.dataset.code=school.code;tip.innerHTML='<h2>'+escape(school.name)+'</h2><p>'+escape(place(school.place))+'</p><p>'+escape(school.address)+'</p><p class="grade-label">Среден успех на ДЗИ по БЕЛ през 2026 г.</p><p class="grade">'+number.format(school.scores[2])+'</p>';tip.hidden=false;positionTip();}
function hide(){tip.hidden=true;active?.classList.remove('active');active=null;pinned=null;}
function resizeMarkers(){const rect=svg.getBoundingClientRect(),scale=Math.min(rect.width/1200,rect.height/730)*transform.k;if(!scale)return;for(const group of groups){group.querySelector('.school-dot').setAttribute('r',3.6/scale);group.querySelector('.school-hit').setAttribute('r',12/scale);}positionTip();}
for(const group of groups){const hit=group.querySelector('.school-hit');hit.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'&&!pinned)show(group)});hit.addEventListener('pointerleave',()=>{if(!pinned)hide()});hit.addEventListener('focus',()=>show(group));hit.addEventListener('blur',()=>{if(!pinned)hide()});hit.addEventListener('click',e=>{e.stopPropagation();show(group,true)});hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(group,true)}else if(e.key==='Escape'){hide();hit.blur()}});}
svg.addEventListener('click',e=>{if(!e.target.classList.contains('school-hit'))hide()});document.addEventListener('keydown',e=>{if(e.key==='Escape')hide()});
const zoom=d3.zoom().extent([[0,0],[1200,730]]).scaleExtent([1,64]).translateExtent([[0,0],[1200,730]]).filter(e=>e.type==='wheel'?e.ctrlKey:!e.button).on('zoom',e=>{transform=e.transform;layer.attr('transform',transform);resizeMarkers()});
d3.select(svg).call(zoom);svg.addEventListener('keydown',e=>{if(e.target!==svg)return;if(e.key==='+'||e.key==='='){e.preventDefault();d3.select(svg).call(zoom.scaleBy,1.6)}else if(e.key==='-'){e.preventDefault();d3.select(svg).call(zoom.scaleBy,1/1.6)}else if(e.key==='0'){e.preventDefault();d3.select(svg).call(zoom.transform,d3.zoomIdentity)}});new ResizeObserver(resizeMarkers).observe(area);resizeMarkers();
})();
