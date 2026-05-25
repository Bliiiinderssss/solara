/* ── SOLARA — Shared App Logic v2 ── */

/* ═══════════════════════════════════════════════════
   NAV — Scroll effect (transparent → frosted)
   ═══════════════════════════════════════════════════ */
(function() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  /* Don't override if nav already has .scrolled (e.g. inner pages) */
  const alwaysScrolled = nav.classList.contains('scrolled');

  if (!alwaysScrolled) {
    function updateNav() {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }
})();

/* ═══════════════════════════════════════════════════
   ACTIVE NAV LINK
   ═══════════════════════════════════════════════════ */
(function() {
  const links = document.querySelectorAll('.nav-links a');
  const path = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
})();

/* ═══════════════════════════════════════════════════
   SCROLL-DRIVEN REVEAL ANIMATIONS
   IntersectionObserver triggers fade + translateY
   ═══════════════════════════════════════════════════ */
(function() {
  /* Respect prefers-reduced-motion */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  /* Observe all .reveal elements */
  function observeReveals() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      observer.observe(el);
    });
  }

  /* Initial pass */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeReveals);
  } else {
    observeReveals();
  }

  /* Re-observe after dynamic content loads (e.g. renderCards) */
  window._observeReveals = observeReveals;

  /* Also observe with MutationObserver for dynamically added elements */
  const mutObs = new MutationObserver((mutations) => {
    let hasNewReveals = false;
    mutations.forEach(m => {
      m.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
          if (n.classList && n.classList.contains('reveal') && !n.classList.contains('visible')) {
            hasNewReveals = true;
          }
          if (n.querySelectorAll) {
            const nested = n.querySelectorAll('.reveal:not(.visible)');
            if (nested.length) hasNewReveals = true;
          }
        }
      });
    });
    if (hasNewReveals) observeReveals();
  });
  mutObs.observe(document.body, { childList: true, subtree: true });
})();

/* ═══════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════ */
function showToast(msg, type) {
  type = type || 'success';
  var t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3500);
}

/* ═══════════════════════════════════════════════════
   MODAL HELPERS
   ═══════════════════════════════════════════════════ */
function openModal(id) {
  var m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id) {
  var m = document.getElementById(id);
  if (m) m.classList.remove('open');
}
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
  }
});

/* ═══════════════════════════════════════════════════
   PAGE ENTER ANIMATION
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  document.body.classList.add('page-enter');
});

/* ═══════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════ */

/* Format currency */
function formatEur(n) {
  return '€' + Number(n).toLocaleString('fr-FR');
}

/* Star rating renderer */
function renderStars(n) {
  return Array.from({length:5}, function(_, i) {
    return '<span class="star">' + (i < Math.round(n) ? '\u2605' : '\u2606') + '</span>';
  }).join('');
}

/* ═══════════════════════════════════════════════════
   CHART RENDERERS (Admin dashboard)
   ═══════════════════════════════════════════════════ */

/* Simple bar chart */
function drawBarChart(canvasId, labels, values, color) {
  color = color || '#C4724A';
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width = canvas.offsetWidth;
  var H = canvas.height = canvas.offsetHeight;
  ctx.clearRect(0,0,W,H);

  var max = Math.max.apply(null, values) * 1.15;
  var pad = { t:20, r:20, b:40, l:50 };
  var cW = W - pad.l - pad.r;
  var cH = H - pad.t - pad.b;
  var bW = (cW / labels.length) * 0.55;
  var gap = cW / labels.length;

  ctx.strokeStyle = '#EDE3D6';
  ctx.lineWidth = 1;
  for (var i=0; i<=4; i++) {
    var y = pad.t + (cH * i / 4);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W-pad.r, y); ctx.stroke();
    ctx.fillStyle = '#7A7065';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatEur(max*(1-i/4)), pad.l-6, y+4);
  }

  values.forEach(function(v, i) {
    var x = pad.l + gap*i + gap/2 - bW/2;
    var bH = (v/max)*cH;
    var by = pad.t + cH - bH;

    var grad = ctx.createLinearGradient(0,by,0,by+bH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '99');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, by, bW, bH, [4,4,0,0]);
    ctx.fill();

    ctx.fillStyle = '#4A4A4A';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], pad.l + gap*i + gap/2, H-pad.b+16);
  });
}

/* Line chart */
function drawLineChart(canvasId, labels, datasets) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width = canvas.offsetWidth;
  var H = canvas.height = canvas.offsetHeight;
  ctx.clearRect(0,0,W,H);

  var allVals = datasets.reduce(function(a,d){ return a.concat(d.values); }, []);
  var max = Math.max.apply(null, allVals)*1.15;
  var pad = {t:20,r:20,b:40,l:50};
  var cW = W-pad.l-pad.r;
  var cH = H-pad.t-pad.b;

  ctx.strokeStyle='#EDE3D6'; ctx.lineWidth=1;
  for(var i=0;i<=4;i++){
    var y=pad.t+(cH*i/4);
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    ctx.fillStyle='#7A7065';ctx.font='11px Inter,sans-serif';ctx.textAlign='right';
    ctx.fillText(formatEur(max*(1-i/4)),pad.l-6,y+4);
  }

  labels.forEach(function(l,i){
    ctx.fillStyle='#4A4A4A';ctx.font='11px Inter,sans-serif';ctx.textAlign='center';
    ctx.fillText(l,pad.l+cW*i/(labels.length-1),H-pad.b+16);
  });

  datasets.forEach(function(ds){
    ctx.strokeStyle=ds.color;ctx.lineWidth=2.5;ctx.lineJoin='round';
    ctx.beginPath();
    ds.values.forEach(function(v,i){
      var x=pad.l+cW*i/(ds.values.length-1);
      var y=pad.t+cH-(v/max)*cH;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();

    var grad=ctx.createLinearGradient(0,pad.t,0,pad.t+cH);
    grad.addColorStop(0,ds.color+'33');grad.addColorStop(1,ds.color+'00');
    ctx.fillStyle=grad;ctx.beginPath();
    ds.values.forEach(function(v,i){
      var x=pad.l+cW*i/(ds.values.length-1);
      var y=pad.t+cH-(v/max)*cH;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.lineTo(W-pad.r,pad.t+cH);ctx.lineTo(pad.l,pad.t+cH);ctx.closePath();ctx.fill();
  });
}

/* Donut chart */
function drawDonut(canvasId, segments) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var S = Math.min(canvas.offsetWidth, canvas.offsetHeight);
  canvas.width = S; canvas.height = S;
  var cx = S/2, cy = S/2, R = S*0.38, r = S*0.22;
  var start = -Math.PI/2;
  var total = segments.reduce(function(a,s){return a+s.value;},0);
  segments.forEach(function(s){
    var angle = (s.value/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,R,start,start+angle);
    ctx.closePath();
    ctx.fillStyle=s.color; ctx.fill();
    start+=angle;
  });
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fillStyle='#FFFFFF'; ctx.fill();
  ctx.fillStyle='#1D3557';
  ctx.font='500 '+S*0.1+'px Cormorant Garamond,serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(Math.round(segments[0].value/total*100)+'%',cx,cy);
}

/* ═══════════════════════════════════════════════════
   GLOBAL EXPORTS
   ═══════════════════════════════════════════════════ */
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.drawBarChart = drawBarChart;
window.drawLineChart = drawLineChart;
window.drawDonut = drawDonut;
window.formatEur = formatEur;
window.renderStars = renderStars;
