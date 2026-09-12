
const fine = matchMedia('(pointer:fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(min-width:821px)').matches;

const topbar = document.getElementById('topbar');
addEventListener('scroll', () => topbar.classList.toggle('solid', scrollY > 40), {passive:true});

// ---------- 窄屏目录菜单 ----------
const menu = document.getElementById('menu'), menuBtn = document.getElementById('menuBtn');
function openMenu(){ menu.hidden = false; document.body.classList.add('lock'); menuBtn.setAttribute('aria-expanded','true'); }
function closeMenu(){ menu.hidden = true; document.body.classList.remove('lock'); menuBtn.setAttribute('aria-expanded','false'); }
menuBtn.addEventListener('click', openMenu);
document.getElementById('menuX').addEventListener('click', closeMenu);
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

// ---------- 首屏视频:桌面端才加载,手机只留封面 ----------
const heroVideo = document.querySelector('.hero-video');
if (heroVideo && desktop && !reduced) { heroVideo.src = heroVideo.dataset.src; heroVideo.preload = 'auto'; heroVideo.play().catch(()=>{}); }

// ---------- 光标 ----------
const cursor = document.getElementById('cursor'), cursorTxt = document.getElementById('cursorTxt');
if (fine && !reduced) {
  // 直接跟手,不做缓动(2026-09-12 Fendi:缓动跟随感觉滞后)
  addEventListener('mousemove', e => { cursor.style.transform = `translate(${e.clientX-6}px,${e.clientY-6}px)`; }, {passive:true});
  document.querySelectorAll('.cell:not(.more-tile), .sheet').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.classList.add('big'); cursorTxt.textContent = '查看'; });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('big'); cursorTxt.textContent = ''; });
  });
  document.querySelectorAll('.vcard').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.classList.add('big'); cursorTxt.textContent = 'PLAY'; });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('big'); cursorTxt.textContent = ''; });
  });
  document.querySelectorAll('a,button,.foot-big').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('link'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('link'));
  });
} else { cursor.remove(); }

// ---------- 目录悬停浮图 ----------
const tf = document.getElementById('tocFloat');
if (fine && !reduced) {
  let tx = 0, ty = 0, fx = 0, fy = 0;
  addEventListener('mousemove', e => { tx = e.clientX + 28; ty = e.clientY - 90; }, {passive:true});
  (function fl(){ fx += (tx-fx)*.35; fy += (ty-fy)*.35; tf.style.left = fx+'px'; tf.style.top = fy+'px'; requestAnimationFrame(fl); })();
  document.querySelectorAll('.toc-row').forEach(row => {
    row.addEventListener('mouseenter', () => { tf.src = row.dataset.img; tf.classList.add('on'); });
    row.addEventListener('mouseleave', () => { tf.classList.remove('on'); });
  });
}

// ---------- 进场 ----------
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), {rootMargin:'0px 0px -6% 0px'});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---------- 画廊展开 ----------
document.querySelectorAll('[data-expand]').forEach(btn => btn.addEventListener('click', () => {
  const g = btn.closest('.gallery');
  g.querySelectorAll('.cell[hidden]').forEach(c => { c.hidden = false; c.classList.add('in'); });
  btn.remove();
}));

// ---------- 章节视频:进入视口静音自动播放 ----------
const vids = [...document.querySelectorAll('.vcard video')];
function setPlayLabel(v, playing) {
  const card = v.closest('.vcard'), btn = card.querySelector('.play');
  card.classList.toggle('playing', playing);
  btn.innerHTML = playing ? '<b>SOUND ON</b><i>CLICK</i>' : '<b>PLAY</b><i>SOUND</i>';
}
const vIO = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) {
    if (!v.src) { v.src = v.dataset.src; v.preload = 'auto'; }
    v.play().then(() => setPlayLabel(v, true)).catch(()=>{});
  } else { v.pause(); setPlayLabel(v, false); }
}), {threshold:.25});
vids.forEach(v => vIO.observe(v));

// ---------- 章节指示器 + 顶栏高亮 ----------
const pager = document.getElementById('pager'), pgNum = document.getElementById('pgNum'), pgName = document.getElementById('pgName');
const navLinks = [...document.querySelectorAll('.topbar nav a')];
const chIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    pager.hidden = false;
    pgNum.textContent = e.target.dataset.num + ' / 12';
    pgName.textContent = e.target.dataset.name;
    navLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }
}), {rootMargin:'-40% 0px -55% 0px'});
document.querySelectorAll('.chapter').forEach(el => chIO.observe(el));
addEventListener('scroll', () => { if (scrollY < innerHeight*.5) { pager.hidden = true; navLinks.forEach(a => a.classList.remove('on')); } }, {passive:true});

// ---------- 联系邮箱(拼接防爬) ----------
const ml = document.getElementById('mailLink');
if (ml) { const addr = ml.dataset.u + '@' + ml.dataset.d; ml.href = 'mailto:' + addr; ml.title = addr; }

// ---------- 图片灯箱:章节内计数 + 键盘 + 手机滑动 ----------
const lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg'), lbCap = document.getElementById('lbCap'), lbCnt = document.getElementById('lbCnt');
let list = [], cur = -1;
function show(i) {
  cur = (i + list.length) % list.length;
  const img = list[cur], sec = img.closest('section');
  lbImg.src = img.dataset.large;
  lbCap.textContent = sec.dataset.zh || sec.dataset.name || '';
  lbCnt.textContent = String(cur+1).padStart(2,'0') + ' / ' + list.length;
  lb.hidden = false; document.body.classList.add('lock');
  [cur+1, cur-1].forEach(j => { const p = new Image(); p.src = list[(j+list.length)%list.length].dataset.large; });
}
function hide() { lb.hidden = true; lbImg.src = ''; document.body.classList.remove('lock'); }
document.querySelectorAll('.cell img, .sheet-img').forEach(img => img.parentElement.addEventListener('click', () => {
  const sec = img.closest('section');
  list = [...sec.querySelectorAll('.cell img, .sheet-img')];
  show(list.indexOf(img));
}));
document.getElementById('lbX').onclick = hide;
document.getElementById('lbP').onclick = e => { e.stopPropagation(); show(cur-1); };
document.getElementById('lbN').onclick = e => { e.stopPropagation(); show(cur+1); };
lb.addEventListener('click', e => { if (e.target === lb) hide(); });
let sx = 0, sy = 0;
lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive:true});
lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? cur+1 : cur-1); }, {passive:true});

// ---------- 视频灯箱(有声) ----------
const vlb = document.getElementById('vlb'), vv = document.getElementById('vlbVideo'), vcap = document.getElementById('vlbCap');
function openVideo(card) {
  vids.forEach(v => v.pause()); if (heroVideo) heroVideo.pause();
  vv.src = card.dataset.video; vv.muted = false; vv.currentTime = 0;
  vcap.textContent = card.dataset.title || '';
  vlb.hidden = false; document.body.classList.add('lock'); document.body.classList.add('vlb-open');
  vv.play().catch(()=>{});
}
function closeVideo() { vv.pause(); vv.removeAttribute('src'); vv.load(); vlb.hidden = true; document.body.classList.remove('lock'); document.body.classList.remove('vlb-open');
  if (heroVideo && heroVideo.src && scrollY < innerHeight) heroVideo.play().catch(()=>{}); }
document.querySelectorAll('[data-video]').forEach(c => c.addEventListener('click', () => openVideo(c)));
document.getElementById('vlbX').onclick = closeVideo;
vlb.addEventListener('click', e => { if (e.target === vlb) closeVideo(); });

addEventListener('keydown', e => {
  if (!menu.hidden && e.key === 'Escape') { closeMenu(); return; }
  if (!vlb.hidden) { if (e.key === 'Escape') closeVideo(); return; }
  if (lb.hidden) return;
  if (e.key === 'Escape') hide();
  if (e.key === 'ArrowLeft') show(cur-1);
  if (e.key === 'ArrowRight') show(cur+1);
});
