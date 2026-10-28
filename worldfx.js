/* Lightweight transient effects. No perpetual JS render loop. */
const WorldFX=(()=>{
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const palette=['#91dc31','#a9efff','#ffcc43','#ff7336','#8ae0cc','#bba5ff'];
 function burst(cells,board,wrap,grid){
  const layer=document.createElement('div');layer.className='blast-layer';layer.setAttribute('aria-hidden','true');wrap.appendChild(layer);
  const base=wrap.getBoundingClientRect(),quiet=reduced(),positions=[...cells].map(index=>({index,r:board.children[index].getBoundingClientRect()}));
  for(const {index,r} of positions){const x=r.left-base.left+r.width/2,y=r.top-base.top+r.height/2,color=palette[(grid[Math.floor(index/8)][index%8]-1)%6];
   const flash=document.createElement('i');flash.className='blast-ring';flash.style.cssText=`left:${x}px;top:${y}px;--spark:${color};`;layer.appendChild(flash);
   if(quiet)continue;
   for(let j=0;j<Math.min(5,Math.floor(96/cells.size));j++){const p=document.createElement('i');p.className='blast-chip';const angle=(j/6)*Math.PI*2+Math.random()*.5,dist=25+Math.random()*65;p.style.cssText=`left:${x}px;top:${y}px;--spark:${color};--dx:${Math.cos(angle)*dist}px;--dy:${Math.sin(angle)*dist+35}px;--spin:${Math.random()*600-300}deg;--delay:${Math.random()*90}ms;`;layer.appendChild(p)}
  }
  if(!quiet){board.classList.remove('board-impact');void board.offsetWidth;board.classList.add('board-impact')}
  setTimeout(()=>{layer.remove();board.classList.remove('board-impact')},1150);
 }
 function theme(e){document.documentElement.dataset.era=e;}
 return{burst,theme};
})();
