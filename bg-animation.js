(() => {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  // ── Palette ──────────────────────────────────────────────────────────────
  const PALETTE = {
    bg:      '#fdf0f3',
    dot:     'rgba(210, 110, 145, 0.55)',
    line:    'rgba(210, 110, 145, 0.12)',
    numText: 'rgba(185,  80, 120, 0.40)',
    tag:     'rgba(185,  80, 120, 0.28)',
    pulse:   'rgba(230, 150, 175, 0.18)',
  };

  // ── Config ────────────────────────────────────────────────────────────────
  const CFG = {
    nodeCount:    38,
    connectDist:  160,
    dotMinR:      1,
    dotMaxR:      2,
    speedScale:   0.28,
    labelChance:  0.45,
    pulseChance:  0.18,
  };

  const DATA_LABELS = [
    '3.7M','ETL','99.2%','JOIN','SQL','0xFF',
    'AVG','NULL','INDEX','Δ+12','PIPE','BLOB',
    '∑','JSON','API','ROW','COL','DIM','FACT',
    '1024','NaN','TRUE','→','⟨x⟩','p<.05',
    'LOAD','SORT','HASH','MERGE','CAST','TRUNC',
  ];

  let W, H, dpr, nodes = [], animId;

  // ── Node class ────────────────────────────────────────────────────────────
  class Node {
    constructor() { this.reset(true); }

    reset(init = false) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : (Math.random() < 0.5 ? -10 : H + 10);
      this.r  = CFG.dotMinR + Math.random() * (CFG.dotMaxR - CFG.dotMinR);
      const spd = CFG.speedScale * (0.4 + Math.random() * 0.6);
      const ang = Math.random() * Math.PI * 2;
      this.vx = Math.cos(ang) * spd;
      this.vy = Math.sin(ang) * spd;
      this.label    = Math.random() < CFG.labelChance
                        ? DATA_LABELS[Math.floor(Math.random() * DATA_LABELS.length)]
                        : null;
      this.fontSize  = 9 + Math.random() * 4;
      this.pulse     = Math.random() < CFG.pulseChance;
      this.pulseT    = Math.random() * Math.PI * 2;
      this.pulseSpd  = 0.018 + Math.random() * 0.014;
      this.opacity   = 0.5 + Math.random() * 0.5;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.pulse) this.pulseT += this.pulseSpd;

      // Soft wrap
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.y = H + 20;
      if (this.y > H + 20) this.y = -20;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;

      if (this.pulse) {
        const s  = 1 + 0.35 * Math.sin(this.pulseT);
        const pr = this.r * s * 3.5;
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, pr);
        grad.addColorStop(0, PALETTE.pulse);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(this.x, this.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.dot;
      ctx.fill();

      if (this.label) {
        ctx.font = `${this.fontSize}px 'Courier New', monospace`;
        ctx.fillStyle = PALETTE.numText;
        ctx.fillText(this.label, this.x + this.r + 3, this.y + this.fontSize * 0.35);
      }

      ctx.restore();
    }
  }

  // ── Draw connections ──────────────────────────────────────────────────────
  function drawEdges() {
    const d2 = CFG.connectDist * CFG.connectDist;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < d2) {
          const alpha = (1 - dist2 / d2) * 0.55;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = PALETTE.line;
          ctx.lineWidth   = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const area  = W * H;
    const count = Math.round(CFG.nodeCount * Math.min(area / (1440 * 900), 1));
    nodes = Array.from({ length: Math.max(count, 18) }, () => new Node());
  }

  // ── Main loop ─────────────────────────────────────────────────────────────
  let lastTime = 0;
  function loop(ts) {
    if (ts - lastTime < 25) { animId = requestAnimationFrame(loop); return; }
    lastTime = ts;

    ctx.clearRect(0, 0, W, H);
    drawEdges();
    nodes.forEach(n => { n.update(); n.draw(); });

    animId = requestAnimationFrame(loop);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  resize();
  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    resize();
    animId = requestAnimationFrame(loop);
  }, { passive: true });

  animId = requestAnimationFrame(loop);
})();
