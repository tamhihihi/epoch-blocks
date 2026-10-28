
(function () {
// ==LOGIC-START==
const N = 8, COLORS = 4;
const FAMILIES = [
  { w: 1, s: ['#'] },
  { w: 3, s: ['##'] },
  { w: 3, s: ['###'] },
  { w: 2, s: ['####'] },
  { w: 1, s: ['#####'] },
  { w: 3, s: ['##', '##'] },
  { w: 1, s: ['###', '###', '###'] },
  { w: 2, s: ['###', '###'] },
  { w: 3, s: ['#.', '##'] },
  { w: 2, s: ['#..', '#..', '###'] },
  { w: 3, s: ['#.', '#.', '##'] },
  { w: 3, s: ['.#', '.#', '##'] },
  { w: 3, s: ['###', '.#.'] },
  { w: 2, s: ['.##', '##.'] },
  { w: 2, s: ['##.', '.##'] }
];

function rotate(m) {
  const R = m.length, C = m[0].length, o = [];
  for (let c = 0; c < C; c++) {
    const row = [];
    for (let r = R - 1; r >= 0; r--) row.push(m[r][c]);
    o.push(row);
  }
  return o;
}

const SHAPES = [];
for (const f of FAMILIES) {
  let m = f.s.map(r => [...r].map(ch => (ch === '#' ? 1 : 0)));
  const seen = new Set(), list = [];
  for (let i = 0; i < 4; i++) {
    const key = m.map(r => r.join('')).join('/');
    if (!seen.has(key)) { seen.add(key); list.push(m); }
    m = rotate(m);
  }
  for (const mm of list) {
    const cells = [];
    mm.forEach((row, r) => row.forEach((v, c) => { if (v) cells.push([r, c]); }));
    SHAPES.push({ idx: SHAPES.length, m: mm, h: mm.length, w: mm[0].length, cells, weight: f.w / list.length });
  }
}
const TOTAL_W = SHAPES.reduce((a, s) => a + s.weight, 0);

function emptyGrid() { return Array.from({ length: N }, () => Array(N).fill(0)); }

function canPlace(g, s, r, c) {
  if (r < 0 || c < 0 || r + s.h > N || c + s.w > N) return false;
  for (const [dr, dc] of s.cells) if (g[r + dr][c + dc]) return false;
  return true;
}
function anyFit(g, s) {
  for (let r = 0; r <= N - s.h; r++)
    for (let c = 0; c <= N - s.w; c++)
      if (canPlace(g, s, r, c)) return true;
  return false;
}
function placeShape(g, s, r, c, color) {
  const o = g.map(row => row.slice());
  for (const [dr, dc] of s.cells) o[r + dr][c + dc] = color + 1;
  return o;
}
function fullLines(g) {
  const rows = [], cols = [];
  for (let r = 0; r < N; r++) if (g[r].every(v => v)) rows.push(r);
  for (let c = 0; c < N; c++) if (g.every(row => row[c])) cols.push(c);
  return { rows, cols };
}
function clearLines(g, rows, cols) {
  const o = g.map(r => r.slice());
  rows.forEach(r => o[r].fill(0));
  cols.forEach(c => o.forEach(row => { row[c] = 0; }));
  return o;
}
function lineScore(n, combo) { return 10 * n * n * Math.max(1, combo); }

function solvable(g, shapes, budget) {
  let nodes = 0;
  const limit = budget || 3000;
  function dfs(grid, rest) {
    if (!rest.length) return true;
    for (let k = 0; k < rest.length; k++) {
      const s = rest[k];
      const others = rest.filter((_, j) => j !== k);
      for (let r = 0; r <= N - s.h; r++) {
        for (let c = 0; c <= N - s.w; c++) {
          if (!canPlace(grid, s, r, c)) continue;
          if (++nodes > limit) return false;
          let ng = placeShape(grid, s, r, c, 0);
          const L = fullLines(ng);
          if (L.rows.length || L.cols.length) ng = clearLines(ng, L.rows, L.cols);
          if (dfs(ng, others)) return true;
        }
      }
    }
    return false;
  }
  return dfs(g, shapes);
}

function pickShape() {
  let t = Math.random() * TOTAL_W;
  for (const s of SHAPES) { t -= s.weight; if (t <= 0) return s; }
  return SHAPES[0];
}
function withColors(shapes) {
  const pal = [0, 1, 2, 3];
  for (let i = pal.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pal[i], pal[j]] = [pal[j], pal[i]];
  }
  return shapes.map((s, i) => ({ s, color: pal[i], used: false }));
}
// Early on, every set can be fully placed. Later the guarantee fades, so games do end.
function genPieces(g, score) {
  for(let t=0;t<10;t++) {
    const candidate=[pickShape(),pickShape(),pickShape()];
    if(solvable(g,candidate,1400))return withColors(candidate);
  }
  // Construct an actual valid sequence instead of silently returning an impossible tray.
  let sim=g.map(r=>r.slice());const chosen=[];
  for(let k=0;k<3;k++){
    const pool=SHAPES.filter(s=>anyFit(sim,s));
    if(!pool.length)break;
    const s=pool[Math.floor(Math.random()*pool.length)];const positions=[];
    for(let r=0;r<=N-s.h;r++)for(let c=0;c<=N-s.w;c++)if(canPlace(sim,s,r,c))positions.push([r,c]);
    const [r,c]=positions[Math.floor(Math.random()*positions.length)];
    sim=placeShape(sim,s,r,c,0);const lines=fullLines(sim);sim=clearLines(sim,lines.rows,lines.cols);chosen.push(s);
  }
  while(chosen.length<3)chosen.push(SHAPES[0]);
  return withColors(chosen.sort(()=>Math.random()-.5));
}
// ==LOGIC-END==

const $ = id => document.getElementById(id);
const root = document.documentElement;
const boardEl = $('board'), trayEl = $('tray'), overEl = $('over'), wrapEl = $('wrap');
const slotEls = [...trayEl.children];
const cellEls = [];
for (let i = 0; i < N * N; i++) {
  const d = document.createElement('div');
  d.className = 'c';
  boardEl.appendChild(d);
  cellEls.push(d);
}

const PAD = 8, GAP = 3, TGAP = 10;
let CS = 40;
let grid = emptyGrid(), pieces = [], score = 0, best = 0, bestAtStart = 0, combo = 0;
let over = false, busy = false, gameId = 0, drag = null, newTimer = 0;

function fmt(n) { try { return n.toLocaleString('vi-VN'); } catch (e) { return String(n); } }
function loadBest() { try { return +localStorage.getItem('bumkhoi-best') || 0; } catch (e) { return 0; } }
function saveBest() { try { localStorage.setItem('bumkhoi-best', String(best)); } catch (e) {} }

function layout() {
  const st = getComputedStyle(document.body);
  const avail = document.body.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight);
  const h = window.visualViewport?.height || window.innerHeight;
  const byH = h > 560 ? h - (avail < 600 ? 335 : 365) : 9999;
  let bw = Math.min(avail, 440, byH);
  bw = Math.max(bw, Math.min(avail, 250));
  CS = Math.max(18, Math.floor((bw - 2 * PAD - (N - 1) * GAP) / N));
  const boardW = N * CS + (N - 1) * GAP + 2 * PAD;
  const slotW = (boardW - 2 * TGAP) / 3;
  const tc = Math.max(10, Math.floor(Math.min(CS * 0.63, (slotW - 10) / 5)));
  const slotH = 5 * tc + 4 * 2 + 20;
  const s = root.style;
  s.setProperty('--cs', CS + 'px');
  s.setProperty('--gap', GAP + 'px');
  s.setProperty('--pad', PAD + 'px');
  s.setProperty('--bw', boardW + 'px');
  s.setProperty('--tc', tc + 'px');
  s.setProperty('--slot-h', slotH + 'px');
}

function renderBoard(clearing, fresh) {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const i = r * N + c, v = grid[r][c], el = cellEls[i];
      let cls = 'c';
      if (v) cls += ' fill k' + (v - 1);
      if (fresh && fresh.has(i)) cls += ' nw';
      if (clearing && clearing.has(i)) { cls += ' clr'; el.style.setProperty('--k', r + c); }
      el.className = cls;
    }
  }
}

function renderTray() {
  slotEls.forEach((slot, i) => {
    const p = pieces[i];
    slot.innerHTML = '';
    slot.className = 'slot';
    if (!p || p.used) { slot.classList.add('empty'); return; }
    const piece = document.createElement('div');
    piece.className = 'piece k' + p.color;
    piece.style.gridTemplateColumns = 'repeat(' + p.s.w + ', var(--tc))';
    p.s.m.forEach(row => row.forEach(v => {
      const b = document.createElement('i');
      b.className = v ? 'b' : 'b e';
      piece.appendChild(b);
    }));
    slot.appendChild(piece);
    if (!anyFit(grid, p.s)) slot.classList.add('stuck');
  });
}

function updateHud(bumped) {
  refreshExtra(); if(bumped) sound(combo?440+Math.min(combo,10)*50:300);
  const sc = $('score');
  sc.textContent = fmt(score);
  if (bumped) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); }
  if (score > best) { best = score; saveBest(); }
  $('best').textContent = fmt(best);
  const cb = $('combo');
  if (combo >= 2) {
    const was = cb.hidden ? 0 : cb.dataset.n;
    cb.textContent = 'COMBO ×' + combo;
    if (String(was) !== String(combo)) { cb.style.animation = 'none'; void cb.offsetWidth; cb.style.animation = ''; }
    cb.dataset.n = combo;
    cb.hidden = false;
  } else { cb.hidden = true; }
}

function showPop(word, pts) {
  const el = document.createElement('div');
  el.className = 'pop';
  if (word) { const w = document.createElement('span'); w.className = 'w'; w.textContent = word; el.appendChild(w); }
  const p = document.createElement('span'); p.className = 'p'; p.textContent = pts; el.appendChild(p);
  wrapEl.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el.remove(), 1300);
}

function showPreview(i, r, c) {
  renderBoard();
  if (r == null) return;
  const p = pieces[i];
  const g2 = placeShape(grid, p.s, r, c, p.color);
  const L = fullLines(g2);
  const hot = new Set();
  L.rows.forEach(rr => { for (let cc = 0; cc < N; cc++) hot.add(rr * N + cc); });
  L.cols.forEach(cc => { for (let rr = 0; rr < N; rr++) hot.add(rr * N + cc); });
  hot.forEach(idx => { if (grid[(idx / N) | 0][idx % N]) cellEls[idx].classList.add('hl'); });
  for (const [dr, dc] of p.s.cells) {
    const idx = (r + dr) * N + c + dc;
    cellEls[idx].className = 'c g k' + p.color + (hot.has(idx) ? ' hl' : '');
  }
}

function buildFloating(p) {
  const fl = document.createElement('div');
  fl.className = 'float k' + p.color;
  fl.style.gridTemplateColumns = 'repeat(' + p.s.w + ', var(--cs))';
  p.s.m.forEach(row => row.forEach(v => {
    const b = document.createElement('i');
    b.className = v ? 'b' : 'b e';
    fl.appendChild(b);
  }));
  document.body.appendChild(fl);
  return fl;
}

function onDown(e) {
  const slot = e.currentTarget;
  const i = +slot.dataset.i, p = pieces[i];
  if (!p || p.used || busy || over || drag) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  const fw = p.s.w * CS + (p.s.w - 1) * GAP;
  const fh = p.s.h * CS + (p.s.h - 1) * GAP;
  drag = { i, id: e.pointerId, fl: buildFloating(p), fw, fh, origin:cellEls[0].getBoundingClientRect(), touch: e.pointerType !== 'mouse', key: '', target: null };
  slot.classList.add('lift');
  try { slot.setPointerCapture(e.pointerId); } catch (err) {}
  document.body.style.cursor = 'grabbing';
  onMove(e);
}

function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const left = e.clientX - drag.fw / 2;
  const top = drag.touch ? e.clientY - drag.fh - CS * 0.7 : e.clientY - drag.fh / 2;
  drag.fl.style.transform = 'translate(' + left + 'px,' + top + 'px)';
  const o = drag.origin;
  const step = CS + GAP;
  const fx = (left - o.left) / step, fy = (top - o.top) / step;
  const s = pieces[drag.i].s;
  let best = null;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = Math.round(fy) + dr, cc = Math.round(fx) + dc;
      const d = Math.hypot(rr - fy, cc - fx);
      if (d <= 0.8 && canPlace(grid, s, rr, cc) && (!best || d < best.d)) best = { r: rr, c: cc, d };
    }
  }
  const key = best ? best.r + ',' + best.c : '';
  if (key !== drag.key) {
    drag.key = key;
    drag.target = best;
    showPreview(drag.i, best ? best.r : null, best ? best.c : null);
  }
}

function endDrag(e, cancel) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag;
  drag = null;
  d.fl.remove();
  document.body.style.cursor = '';
  slotEls[d.i].classList.remove('lift');
  renderBoard();
  if (d.target && !cancel) commitPlace(d.i, d.target.r, d.target.c);
}

function commitPlace(i, r, c) {
  if(busy||over||!pieces[i]||pieces[i].used||!canPlace(grid,pieces[i].s,r,c))return;
  moves++; hammerMode=false;
  const p = pieces[i];
  p.used = true;
  grid = placeShape(grid, p.s, r, c, p.color);
  let gain = p.s.cells.length;
  const fresh = new Set(p.s.cells.map(([dr, dc]) => (r + dr) * N + c + dc));
  const L = fullLines(grid);
  const n = L.rows.length + L.cols.length;
  if (n) {
    combo++; misses=0; clearedTotal+=n; meta.lines+=n;recordEvent(0,n);
    const pts = lineScore(n, combo);
    gain += pts;
    const clearing = new Set();
    L.rows.forEach(rr => { for (let cc = 0; cc < N; cc++) clearing.add(rr * N + cc); });
    L.cols.forEach(cc => { for (let rr = 0; rr < N; rr++) clearing.add(rr * N + cc); });
    score += gain; earn(gain);
    busy = true;
    renderTray();
    renderBoard(clearing, fresh);
    WorldFX.burst(clearing,boardEl,wrapEl,grid);
    updateHud(true);
    const word = n >= 4 ? 'Bùng nổ!' : n === 3 ? 'Siêu đỉnh!' : n === 2 ? 'Tuyệt vời!' : (combo >= 2 ? 'Liên hoàn!' : 'Tốt lắm!');
    showPop(word, '+' + fmt(pts));
    grid = clearLines(grid, L.rows, L.cols);
    const allClear=grid.every(row=>row.every(v=>!v));
    if(allClear){score+=100;earn(100);updateHud(true)}
    saveRound();
    const gid = gameId;
    setTimeout(() => {
      if (gid !== gameId) return;
      busy = false;
      if (allClear) {
        showPop('Sạch bảnh!', '+100');
        updateHud(true);
      }
      renderBoard();
      afterMove();
    }, 460);
  } else {
    misses++; if(misses>=3)combo=0;
    score += gain; earn(gain);
    renderBoard(null, fresh);
    updateHud(true);
    afterMove();
  }
}

function afterMove() {
  if(mode==='adventure' && clearedTotal>=targetLines()){finishAdventure();return;}
  if(mode==='adventure' && moves>=moveLimit()){endGame();saveRound();return;}
  if (pieces.every(p => p.used)) pieces = genPieces(grid, score);
  renderTray();
  if (!pieces.some(p => !p.used && anyFit(grid, p.s))) endGame();
  saveRound(); refreshExtra();
}

function endGame() {
  over = true;
  const isNew = score > bestAtStart && score > 0;
  $('finalScore').textContent = fmt(score);
  $('finalNote').textContent = (mode==='adventure'?'Chưa hoàn thành mục tiêu. ':isNew?'Kỷ lục mới! ':'')+'Đã kiếm '+fmt(roundCoins)+' ✦ vào ví.'; $('rescue').hidden=assists>=2 || (mode==='adventure'&&moves>=moveLimit());
  overEl.hidden = false;
  try { $('again').focus({ preventScroll: true }); } catch (e) {}
}

function loadGames() { try { return +localStorage.getItem('bumkhoi-games') || 0; } catch (e) { return 0; } }
function saveGames() { try { localStorage.setItem('bumkhoi-games', String(games)); } catch (e) {} }
let games = loadGames();

const lobbyEl = $('lobby'), gameEl = $('game');
const deco = $('deco');
for (let i = 0; i < 36; i++) {
  const d = document.createElement('div');
  if (Math.random() < 0.62) {
    d.className = 'dt fill k' + Math.floor(Math.random() * COLORS);
    d.style.setProperty('--dl', (Math.random() * 2.6).toFixed(2) + 's');
  } else d.className = 'dt';
  deco.appendChild(d);
}

function resumable() { return pieces.length === 3 && !over && score > 0; }
function showLobby() {
  $('hubScreen').hidden=true; refreshExtra();
  $('lBest').textContent = fmt(best);
  $('lGames').textContent = fmt(games);
  const res = resumable();
  $('resumeBtn').hidden = !res;
  $('playBtn').textContent = res ? 'Ván mới' : 'Vào chơi';
  $('playBtn').disabled = false;
  $('count').hidden = true;
  gameEl.hidden = true;
  lobbyEl.hidden = false;
}
function showGame() {
  $('hubScreen').hidden=true;
  lobbyEl.hidden = true;
  gameEl.hidden = false;
  layout();
}
function countdown(done) {
  const box = $('count'), num = $('countNum');
  const seq = ['3', '2', '1', 'Bắt đầu!'];
  let i = 0;
  box.hidden = false;
  (function tick() {
    num.textContent = seq[i];
    num.className = i === seq.length - 1 ? 'go' : '';
    num.style.animation = 'none'; void num.offsetWidth; num.style.animation = '';
    i++;
    if (i < seq.length) setTimeout(tick, 700);
    else setTimeout(() => { box.hidden = true; done(); }, 650);
  })();
}

function newGame() {
  cancelDrag(); selectedPiece=-1; boardEl.classList.remove('hammer-target');
  games++; saveGames();
  gameId++;
  grid = emptyGrid();
  score = 0; combo = 0; over = false; busy = false; misses=0; moves=0; clearedTotal=0; assists=0; roundCoins=0; hammerMode=false;
  if(mode==='adventure')seedAdventure();
  bestAtStart = best;
  pieces = genPieces(grid, 0);
  overEl.hidden = true;
  wrapEl.querySelectorAll('.pop').forEach(el => el.remove());
  renderBoard(); renderTray(); updateHud(false);saveRound();
}

function restore(d) {
  if (!d || !Array.isArray(d.grid) || d.grid.length !== N || !Array.isArray(d.pieces) || d.pieces.length !== 3) return false;
  if(d.pieces.some(q=>!q||!Number.isInteger(q.idx)||!Number.isInteger(q.color)||q.color<0||q.color>5))return false;
  const ps = d.pieces.map(q => ({ s: SHAPES[q.idx], color: q.color | 0, used: !!q.used }));
  if (ps.some(p => !p.s)) return false;
  if(d.grid.some(row=>!Array.isArray(row)||row.length!==8||row.some(v=>!Number.isInteger(v)||v<0||v>6)))return false;
  grid = d.grid.map(row => row.map(v => v | 0));
  mode=d.mode==='adventure'?'adventure':'classic';misses=d.misses||0;moves=d.moves||0;clearedTotal=d.clearedTotal||0;assists=d.assists||0;roundCoins=d.roundCoins||0;
  const L = fullLines(grid);
  if (L.rows.length || L.cols.length) grid = clearLines(grid, L.rows, L.cols);
  pieces = ps; if(pieces.every(p=>p.used))pieces=genPieces(grid,d.score||0); score = d.score | 0; combo = d.combo | 0; over = false; busy = false;
  bestAtStart = best;
  overEl.hidden = true;
  renderBoard(); renderTray(); updateHud(false);
  if (!pieces.some(p => !p.used && anyFit(grid, p.s))) endGame();
  return true;
}

slotEls.forEach(s => {
  s.addEventListener('pointerdown', onDown);
  s.addEventListener('lostpointercapture',e=>{if(drag&&drag.id===e.pointerId)endDrag(e,true)});
  s.addEventListener('contextmenu', e => e.preventDefault());
});
window.addEventListener('pointermove', onMove);
window.addEventListener('pointerup', e => endDrag(e, false));
window.addEventListener('pointercancel', e => endDrag(e, true));
window.addEventListener('resize', () => { if(!drag)layout(); });
window.addEventListener('orientationchange',()=>{cancelDrag();setTimeout(layout,150)});

$('again').addEventListener('click', newGame);
$('lobbyBtn').addEventListener('click', () => { if (!drag&&!busy) showLobby(); });
$('resumeBtn').addEventListener('click', showGame);
$('playBtn').addEventListener('click', () => {
  $('playBtn').disabled = true;
  countdown(() => { newGame(); showGame(); });
});
$('newBtn').addEventListener('click', () => {
  const btn = $('newBtn');
  if (over || score === 0) { newGame(); return; }
  if (newTimer) { clearTimeout(newTimer); newTimer = 0; btn.textContent = 'Ván mới'; newGame(); return; }
  btn.textContent = 'Bấm lần nữa';
  newTimer = setTimeout(() => { newTimer = 0; btn.textContent = 'Ván mới'; }, 2500);
});

const META='epoch-city-v1',ROUND='epoch-blocks-round-v3';
let meta={wallet:120,levels:[0,0,0,0],lines:0,quest:0,adventureLevel:1,sound:false},mode='classic',misses=0,moves=0,clearedTotal=0,assists=0,roundCoins=0,hammerMode=false,ctx,timer;
try{const old=JSON.parse(localStorage.getItem(META));if(old&&Array.isArray(old.levels)&&old.levels.length===4)meta={...meta,...old}}catch{}
const era=()=>0;
function persistMeta(){try{localStorage.setItem(META,JSON.stringify(meta))}catch{$('saveNote').textContent='Không thể lưu trên trình duyệt này'}}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.remove('show'),2600)}
function sound(f=400){if(!meta.sound)return;try{ctx ||= new(window.AudioContext||window.webkitAudioContext)();ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=f;g.gain.setValueAtTime(.07,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.15);o.start();o.stop(ctx.currentTime+.15)}catch{}}
function earn(n){const coins=n;recordEvent(n,0,false);meta.wallet+=coins;roundCoins+=coins;persistMeta()}
function saveRound(){if(!pieces.length)return;try{localStorage.setItem(ROUND,JSON.stringify({grid,score,combo,over,mode,misses,moves,clearedTotal,assists,roundCoins,pieces:pieces.map(p=>({idx:p.s.idx,color:p.color,used:p.used}))}))}catch{$('saveNote').textContent='Không thể lưu ván trên trình duyệt này'}}
function targetLines(){return 2+Math.floor((meta.adventureLevel-1)/2)+era()}
function moveLimit(){return 24+Math.min(12,meta.adventureLevel)}
function seedAdventure(){const level=meta.adventureLevel;for(let r=5;r<8;r++)for(let c=0;c<8;c++)if((c+r+level)%4!==0 && (r+c)%3!==0)grid[r][c]=(r+c)%6+1}
function finishAdventure(){over=true;const reward=150+meta.adventureLevel*35;meta.wallet+=reward;meta.adventureLevel++;persistMeta();$('finalScore').textContent=fmt(score);$('finalNote').textContent='Hoàn thành màn! +'+reward+' ✦. Màn tiếp theo đã mở.';$('rescue').hidden=true;overEl.hidden=false;saveRound();refreshExtra()}
function refreshExtra(){
  applyTheme();
  $('walletGame').textContent='✦ '+fmt(meta.wallet)+' xu';$('assistCount').textContent='Hỗ trợ '+assists+'/2';
  $('hudCoins').textContent=fmt(meta.wallet);$('hudBest').textContent=fmt(Math.max(score,best));$('hudLines').textContent=fmt(meta.lines);
  $('sound').textContent=meta.sound?'♫ Bật':'♫ Tắt'; $('hammer').innerHTML='✧ Phá ô <small>×'+(meta.inventory.hammer||0)+'</small>'; $('shuffle').innerHTML='⤨ Đổi bộ <small>×'+(meta.inventory.shuffle||0)+'</small>'; $('rescue').textContent='Dùng ngọc cứu ván · ×'+(meta.inventory.shuffle||0);
  $('comboLife').textContent=combo?`COMBO ${combo} · ${'●'.repeat(Math.max(0,3-misses))}${'○'.repeat(Math.min(3,misses))} · Xóa hàng để giữ chuỗi`: 'Xếp khối • Xóa hàng • Phá kỷ lục';
  $('objective').hidden=mode!=='adventure';$('objective').textContent=`Màn ${meta.adventureLevel} · Xóa ${clearedTotal}/${targetLines()} hàng/cột · Còn ${Math.max(0,moveLimit()-moves)} nước`;
  $('modeLabel').textContent=mode==='classic'?'CỔ ĐIỂN · KHÔNG GIỚI HẠN':'HÀNH TRÌNH · MÀN '+meta.adventureLevel;
  $('modeInfo').textContent=mode==='classic'?'Bàn trống · Không thời gian · Chơi đến hết nước':'Mục tiêu xóa hàng trong số nước giới hạn · Màn '+meta.adventureLevel;
  $('classicMode').classList.toggle('chosen',mode==='classic');$('adventureMode').classList.toggle('chosen',mode==='adventure');
  $('hammer').disabled=busy||over||assists>=2;$('shuffle').disabled=busy||over||assists>=2;
}
function openDialog(html){$('dialogContent').innerHTML=html;if(!$('dialog').open)$('dialog').showModal()}
function spend(n){if(meta.wallet<n){toast('Cần thêm '+(n-meta.wallet)+' điểm.');return false}meta.wallet-=n;persistMeta();return true}
function itemCost(n){return n}
function buyShuffle(){if(busy||assists>=2||!pieces.length)return;if(mode==='adventure'&&moves>=moveLimit())return;if(!consumeItem('shuffle'))return;pieces=genPieces(grid,score);assists++;over=false;overEl.hidden=true;renderTray();afterMove();toast('Đã đổi bộ khối · '+assists+'/2 hỗ trợ')}
function cancelDrag(){if(drag)endDrag({pointerId:drag.id},true)}
const THEMES=[
 {id:'jungle',name:'Rừng ngọc',desc:'Lá xanh · ánh sáng dịu',cost:0,cell:6,era:0},
 {id:'winter',name:'Băng tinh',desc:'Sương lạnh · xanh pha lê',cost:600,cell:13,era:4},
 {id:'desert',name:'Cát vàng',desc:'Hoàng hôn · cát ấm',cost:650,cell:1,era:1},
 {id:'lava',name:'Lõi dung nham',desc:'Đá đen · lửa hổ phách',cost:800,cell:8,era:3},
 {id:'moon',name:'Trạm mặt trăng',desc:'Không gian · ánh tím',cost:1000,cell:17,era:4},
 {id:'farm',name:'Nông trại bình yên',desc:'Đồng cỏ · mái ngói đỏ',cost:850,cell:-1,era:0}
];
const ITEMS={hammer:{name:'Tinh thể phá ô',desc:'Phá 1 ô đang có khối. Chọn vật phẩm rồi chạm ô cần phá.',price:70,col:0,row:0},shuffle:{name:'Ngọc chuyển vận',desc:'Đổi cả bộ 3 khối đang có. Có thể dùng để cứu ván.',price:100,col:7,row:1}};
meta.inventory=meta.inventory&&typeof meta.inventory==='object'?meta.inventory:{hammer:2,shuffle:1};meta.ownedThemes=Array.isArray(meta.ownedThemes)?meta.ownedThemes:['jungle'];if(!meta.ownedThemes.includes('jungle'))meta.ownedThemes.push('jungle');meta.activeTheme=THEMES.some(t=>t.id===meta.activeTheme)&&meta.ownedThemes.includes(meta.activeTheme)?meta.activeTheme:'jungle';
let hubTab='items',hubOrigin='lobby';
function itemArt(key){const a=ITEMS[key],x=a.col*73.6+3,y=a.row*134+8;return `<svg class="item-art" viewBox="${x} ${y} 67 77" role="img" aria-label="${a.name}"><defs><clipPath id="item-${key}"><rect x="${x}" y="${y}" width="67" height="77"/></clipPath></defs><image href="assets/item-collection.png" width="736" height="1104" clip-path="url(#item-${key})"/></svg>`}
function themeArt(t){if(t.id==='farm')return '<img src="assets/farm-theme.png" alt="Nền nông trại">';const x=(t.cell%3)*440+85,y=Math.floor(t.cell/3)*400+155;return `<svg viewBox="${x} ${y} 365 310" role="img" aria-label="${t.name}"><defs><clipPath id="theme-${t.id}"><rect x="${x}" y="${y}" width="365" height="310"/></clipPath></defs><image href="assets/world-collection.png" width="1400" height="2590" clip-path="url(#theme-${t.id})"/></svg>`}
function eventState(){const d=new Date(),day=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');if(meta.daily?.day!==day)meta.daily={day,points:0,lines:0,bestCombo:0,claimed:[]};return meta.daily}
function recordEvent(points,lines=0,save=true){const d=eventState();d.points+=points;d.lines+=lines;d.bestCombo=Math.max(d.bestCombo,combo);if(save)persistMeta()}
function missions(){const d=eventState();return [{id:'lines',title:'Thợ săn tinh thể',text:'Xóa 5 hàng hoặc cột hôm nay',value:d.lines,target:5,reward:150,item:'hammer'},{id:'points',title:'Chuyến thám hiểm đầu tiên',text:'Kiếm 500 điểm hôm nay',value:d.points,target:500,reward:200,item:'shuffle'},{id:'combo',title:'Nhịp bùng nổ',text:'Đạt combo 4 trong hôm nay',value:d.bestCombo,target:4,reward:250,item:'hammer'}]}
function claimEvent(id){const m=missions().find(m=>m.id===id),d=eventState();if(!m||d.claimed.includes(id)||m.value<m.target)return;d.claimed.push(id);meta.wallet+=m.reward;meta.inventory[m.item]=(meta.inventory[m.item]||0)+1;persistMeta();refreshExtra();renderHub();toast(`+${m.reward} xu và 1 ${ITEMS[m.item].name}`)}
function consumeItem(key){if((meta.inventory[key]||0)<1){toast('Vật phẩm đã hết. Ghé cửa hàng để bổ sung.');showHub('items');return false}meta.inventory[key]--;persistMeta();return true}
let appliedTheme='';
function applyTheme(){if(appliedTheme===meta.activeTheme)return;appliedTheme=meta.activeTheme;const t=THEMES.find(t=>t.id===meta.activeTheme)||THEMES[0];WorldFX.theme(t.era);document.documentElement.dataset.skin=t.id;const decor=$('themeDecor');if(decor)decor.innerHTML=themeArt(t)}
function showHub(tab='items'){if(busy){toast('Đợi hiệu ứng xóa khối hoàn tất.');return}cancelDrag();hammerMode=false;boardEl.classList.remove('hammer-target');hubOrigin=gameEl.hidden?'lobby':'game';hubTab=tab;gameEl.hidden=true;lobbyEl.hidden=true;$('hubScreen').hidden=false;renderHub();window.scrollTo(0,0)}
function renderHub(){applyTheme();$('hubCoins').textContent=fmt(meta.wallet);document.querySelectorAll('[data-hub-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.hubTab===hubTab));
 if(hubTab==='items')$('hubContent').innerHTML=`<div class="section-kicker">VẬT PHẨM HỖ TRỢ</div><h2>Một nước cứu nguy.</h2><p class="hub-sub">Mua bằng xu kiếm được khi chơi. Tối đa 2 lần hỗ trợ mỗi ván.</p><div class="item-grid">${Object.entries(ITEMS).map(([key,a])=>`<article class="shop-item"><div class="item-window">${itemArt(key)}<span>×${meta.inventory[key]||0}</span></div><h3>${a.name}</h3><p>${a.desc}</p><button data-buy-item="${key}" ${meta.wallet<a.price?'disabled':''}>✦ ${a.price} <span>${meta.wallet<a.price?'Thiếu '+(a.price-meta.wallet)+' xu':'Mua 1'}</span></button></article>`).join('')}</div><div class="inventory-note">TÚI ĐỒ CỦA BẠN <b>${meta.inventory.hammer||0} tinh thể · ${meta.inventory.shuffle||0} ngọc</b></div>`;
 else if(hubTab==='themes')$('hubContent').innerHTML=`<div class="section-kicker">BỘ SƯU TẬP KHUNG CẢNH</div><h2>Đổi một chút không khí.</h2><p class="hub-sub">Mở khóa một lần, sử dụng bất cứ lúc nào.</p><div class="theme-grid">${THEMES.map(t=>{const owned=meta.ownedThemes.includes(t.id),active=t.id===meta.activeTheme;return `<article class="theme-card ${active?'equipped':''}"><div class="theme-preview">${themeArt(t)}</div><h3>${t.name}</h3><p>${t.desc}</p><button data-theme="${t.id}" ${active||(!owned&&meta.wallet<t.cost)?'disabled':''}>${active?'✓ Đang dùng':owned?'Sử dụng':'✦ '+t.cost+' · Mở khóa'}</button></article>`}).join('')}</div>`;
 else {$('hubContent').innerHTML=`<div class="event-hero"><span class="section-kicker">THÁM HIỂM MỖI NGÀY</span><h2>Hành trình tinh thể</h2><p>Chơi, hoàn thành mục tiêu và nhận vật phẩm.</p><span class="event-date">${eventState().day} · Làm mới lúc 00:00 theo thiết bị</span></div><div class="mission-list">${missions().map(m=>{const claimed=eventState().claimed.includes(m.id),ready=m.value>=m.target;return `<article class="mission"><div class="mission-icon">${itemArt(m.item)}</div><div><h3>${m.title}</h3><p>${m.text}</p><div class="mission-meter"><i style="width:${Math.min(100,m.value/m.target*100)}%"></i></div><small>${Math.min(m.target,m.value)} / ${m.target} · ${m.reward} xu + 1 vật phẩm</small></div><button data-claim-event="${m.id}" ${claimed||!ready?'disabled':''}>${claimed?'Đã nhận':ready?'Nhận':'Đang làm'}</button></article>`}).join('')}</div><button class="btn big" id="eventPlay">Chơi ngay →</button>`;const play=$('eventPlay');if(play)play.onclick=returnPlay;}
}
function returnPlay(){if(!pieces.length||over)newGame();showGame();window.scrollTo(0,0)}
document.querySelectorAll('.shop-open').forEach(b=>b.onclick=()=>showHub('items'));document.querySelectorAll('.events-open').forEach(b=>b.onclick=()=>showHub('events'));$('hubBack').onclick=()=>{if(hubOrigin==='lobby'){$('hubScreen').hidden=true;showLobby()}else{$('hubScreen').hidden=true;showGame()}window.scrollTo(0,0)};
document.querySelectorAll('[data-hub-tab]').forEach(b=>b.onclick=()=>{hubTab=b.dataset.hubTab;renderHub()});
$('hubContent').onclick=e=>{const item=e.target.closest('[data-buy-item]'),theme=e.target.closest('[data-theme]'),claim=e.target.closest('[data-claim-event]');if(item){const key=item.dataset.buyItem,a=ITEMS[key];if(!a||!spend(a.price))return;meta.inventory[key]=(meta.inventory[key]||0)+1;persistMeta();renderHub();refreshExtra();toast('Đã thêm '+a.name+' vào túi đồ')}else if(theme){const t=THEMES.find(t=>t.id===theme.dataset.theme);if(!t)return;if(!meta.ownedThemes.includes(t.id)){if(!spend(t.cost))return;meta.ownedThemes.push(t.id)}meta.activeTheme=t.id;persistMeta();renderHub();refreshExtra();toast('Đã áp dụng nền '+t.name)}else if(claim)claimEvent(claim.dataset.claimEvent)};
$('closeDialog').onclick=()=>$('dialog').close();

$('help').onclick=()=>openDialog('<h2>Cách chơi</h2><ol><li>Kéo một trong 3 khối vào bàn 8×8. Có thể bấm khối rồi bấm ô để đặt; hỗ trợ bàn phím.</li><li>Khối không rơi và không xoay. Dùng hết 3 khối để nhận bộ mới.</li><li>Lấp đầy hàng hoặc cột để xóa, xóa nhiều hàng cùng lúc nhận thưởng cao hơn.</li><li>Mỗi ô đặt được 1 điểm. Xóa n hàng/cột nhận 10 × n² × combo. Xóa sạch bàn thêm 100 điểm.</li><li>Combo giữ qua 2 nước không xóa; nước thứ 3 không xóa sẽ ngắt chuỗi.</li><li>Cổ điển không giới hạn thời gian, kết thúc khi không khối nào còn đặt được.</li><li>Hành trình yêu cầu xóa đủ hàng/cột trong số nước cho phép.</li><li>Điểm tự cộng thành xu. Mua tinh thể phá ô và ngọc đổi bộ trong cửa hàng. Dùng tối đa 2 vật phẩm mỗi ván, kể cả cứu ván.</li></ol><p>Đây là bản xếp khối riêng của EPOCH. Thuật toán phát khối, điểm và Hành trình do bản này quy định.</p>');
$('sound').onclick=()=>{meta.sound=!meta.sound;persistMeta();refreshExtra();sound(500)};
$('shuffle').onclick=buyShuffle;$('rescue').onclick=buyShuffle;
$('hammer').onclick=()=>{if(busy||over||assists>=2)return;hammerMode=!hammerMode;boardEl.classList.toggle('hammer-target',hammerMode);$('playHint').textContent=hammerMode?'Chạm ô cần phá · Dùng 1 tinh thể':'Kéo khối vào bàn · Lấp đầy hàng hoặc cột để xóa'};
// Accessible click/keyboard fallback complements the original pointer-drag behavior.
let selectedPiece=-1;
slotEls.forEach((s,i)=>{s.tabIndex=0;s.setAttribute('role','button');s.setAttribute('aria-label','Chọn khối '+(i+1));s.addEventListener('click',()=>{if(!over&&!busy&&pieces[i]&&!pieces[i].used){selectedPiece=i;toast('Đã chọn khối '+(i+1)+'. Chọn ô góc trên trái.')}});s.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();s.click()}})});
cellEls.forEach((cell,i)=>{cell.tabIndex=0;cell.setAttribute('role','button');cell.setAttribute('aria-label',`Hàng ${Math.floor(i/8)+1}, cột ${i%8+1}`);cell.onclick=()=>{if(busy||over)return;if(hammerMode){const r=Math.floor(i/8),c=i%8;if(!grid[r][c])return;if(!consumeItem('hammer'))return;grid[r][c]=0;assists++;hammerMode=false;boardEl.classList.remove('hammer-target');renderBoard();afterMove();$('playHint').textContent='Kéo khối vào bàn · Lấp đầy hàng hoặc cột để xóa';return}if(selectedPiece>=0){commitPlace(selectedPiece,Math.floor(i/8),i%8);selectedPiece=-1}};cell.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();cell.click()}const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};if(offsets[e.key]){e.preventDefault();cellEls[Math.max(0,Math.min(63,i+offsets[e.key]))].focus()}}});
function selectMode(m){if(m===mode)return;const apply=()=>{mode=m;newGame();showGame();$('dialog').close()};if(resumable()){openDialog('<h2>Đổi chế độ?</h2><p>Bàn đang chơi sẽ được thay mới. Xu và vật phẩm vẫn được giữ.</p><button class="btn" id="confirmMode">Bắt đầu chế độ mới</button>');$('confirmMode').onclick=apply}else apply()}
$('classicMode').onclick=()=>selectMode('classic');$('adventureMode').onclick=()=>selectMode('adventure');
window.addEventListener('blur',cancelDrag);document.addEventListener('visibilitychange',()=>{cancelDrag();if(!busy)saveRound()});
best=Math.max(loadBest(),meta.best||0);layout();
let stored;try{stored=JSON.parse(localStorage.getItem(ROUND))}catch{}
if(stored&&stored.over){showLobby()}else if(restore(stored)){showGame()}else showLobby();
refreshExtra();persistMeta();

})();
