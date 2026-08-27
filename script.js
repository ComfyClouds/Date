/* ==========================================================================
   "Do You Love Me?" — interactive love card website
   Vanilla JS, organized into small focused systems. Edit CONFIG below to
   personalize every piece of copy on the site.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  CONFIG — the only place you need to touch to personalize the copy */
  /* ------------------------------------------------------------------ */
  const CONFIG = {
    cardHeader: '💌 A Special Message for You',
    question: 'Do you love me?',
    subQuestion: 'My heart has a secret question for you... 🌹',
    yesText: '❤️ Yes!',
    noText: 'Think again! ❤️',
    dodgeMessages: [
      'Are you sure? 🥺',
      'Think again! ❤️',
      'Really? 😭',
      'Nope 😂',
      'Try again!',
      "You can't escape love ❤️"
    ],
    syncText: 'Syncing our heartbeats...',
    revealTitle: 'I knew it! 😍',
    revealText: 'You just made my heart beat a million times faster! 💕✨',
    revealMessage: "You're my favorite person forever & always 🌹",
    fireworksButtonText: '🎆 Launch Heart Fireworks ❤️',
    cosmicTitle: 'Our Cosmic Night Sky 🌌',
    cosmicSubtitle: 'Tap anywhere in the sky to launch heart fireworks! ✨',
    backButtonText: '❤️ Back to Love Card'
  };

  /* ------------------------------------------------------------------ */
  /*  ResponsiveManager — device tier, reduced motion, visibility        */
  /* ------------------------------------------------------------------ */
  class ResponsiveManager {
    constructor() {
      this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = this.reducedMotionQuery.matches;
      this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      this.listeners = new Set();
      this._updateTier();

      window.addEventListener('resize', () => this._updateTier());

      const rmHandler = (e) => { this.reducedMotion = e.matches; this._notify({}); };
      if (this.reducedMotionQuery.addEventListener) this.reducedMotionQuery.addEventListener('change', rmHandler);

      document.addEventListener('visibilitychange', () => {
        this._notify({ visibilityChanged: true, hidden: document.hidden });
      });
    }
    _updateTier() {
      const w = window.innerWidth;
      this.tier = w <= 480 ? 'low' : w <= 900 ? 'medium' : 'high';
      this._notify({});
    }
    particleScale() {
      if (this.reducedMotion) return 0.18;
      return this.tier === 'low' ? 0.5 : this.tier === 'medium' ? 0.72 : 1;
    }
    onChange(fn) { this.listeners.add(fn); }
    _notify(payload) { this.listeners.forEach((fn) => fn(payload)); }
  }

  /* ------------------------------------------------------------------ */
  /*  HeartParticleSystem — canvas ambient floating hearts               */
  /* ------------------------------------------------------------------ */
  class HeartParticleSystem {
    constructor(canvas, responsive, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.responsive = responsive;
      this.baseCount = opts.count || 44;
      this.glyphs = opts.glyphs || ['❤', '♥', '♡'];
      this.colors = opts.colors || ['#ff6b93', '#ffb3c6', '#ffffff', '#ff3d7f'];
      this.running = false;
      this.particles = [];

      window.addEventListener('resize', () => this.resize());
      this.resize();

      this.responsive.onChange((p) => {
        if (p.visibilityChanged) { p.hidden ? this.pause() : this.resume(); }
      });
    }
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = this.canvas.clientWidth;
      this.h = this.canvas.clientHeight;
      this.canvas.width = this.w * dpr;
      this.canvas.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._populate();
    }
    _populate() {
      const count = Math.round(this.baseCount * this.responsive.particleScale());
      this.particles = Array.from({ length: count }, () => this._spawn(true));
    }
    _spawn(initial) {
      return {
        x: Math.random() * this.w,
        y: initial ? Math.random() * this.h : this.h + 40,
        size: 12 + Math.random() * 26,
        speedY: 0.22 + Math.random() * 0.65,
        driftFreq: 0.2 + Math.random() * 0.6,
        driftPhase: Math.random() * Math.PI * 2,
        opacity: 0.15 + Math.random() * 0.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        glyph: this.glyphs[Math.floor(Math.random() * this.glyphs.length)],
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        blur: Math.random() < 0.22 ? 1 + Math.random() * 2.5 : 0,
        glow: Math.random() < 0.35,
        t: Math.random() * 1000,
        isBurst: false
      };
    }
    pause() { this.running = false; }
    resume() {
      if (this.running) return;
      this.running = true;
      this._lastTs = performance.now();
      requestAnimationFrame(this._loop.bind(this));
    }
    start() { this.resume(); }
    stop() { this.pause(); }
    _loop(ts) {
      if (!this.running) return;
      const dt = Math.min(32, ts - (this._lastTs || ts));
      this._lastTs = ts;
      this._draw(dt);
      requestAnimationFrame(this._loop.bind(this));
    }
    _draw(dt) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.t += dt;
        if (p.isBurst) {
          p.vy = (p.vy !== undefined ? p.vy : p.speedY) + 0.015 * (dt / 16);
          p.x += p.vx * (dt / 16);
          p.y += p.vy * (dt / 16);
          p.opacity -= p.decay * (dt / 16);
          p.rot += p.rotSpeed * (dt / 16);
          if (p.opacity <= 0) { this.particles.splice(i, 1); continue; }
        } else {
          p.y -= p.speedY * (dt / 16);
          p.x += Math.sin(p.t * 0.002 * p.driftFreq * 10 + p.driftPhase) * 0.4;
          p.rot += p.rotSpeed * (dt / 16);
          if (p.y < -50) Object.assign(p, this._spawn(false));
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = p.size * 0.8; }
        if (p.blur) ctx.filter = `blur(${p.blur}px)`;
        ctx.fillStyle = p.color;
        ctx.fillText(p.glyph, 0, 0);
        ctx.restore();
      }
    }
    /** decorative one-off burst, e.g. when the Yes button is pressed */
    burst(x, y, count = 20) {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        this.particles.push({
          x, y,
          size: 10 + Math.random() * 20,
          speedY: Math.cos(ang) * -speed,
          vx: Math.sin(ang) * speed,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.05,
          opacity: 1,
          glyph: this.glyphs[Math.floor(Math.random() * this.glyphs.length)],
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          blur: 0, glow: true, t: 0,
          decay: 0.008 + Math.random() * 0.01,
          isBurst: true
        });
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  DodgingButton — the playful "Think again!" button                  */
  /* ------------------------------------------------------------------ */
  class DodgingButton {
    constructor(btn, config, liveRegion, responsive) {
      this.btn = btn;
      this.config = config;
      this.live = liveRegion;
      this.responsive = responsive;
      this.attempts = 0;
      this.roaming = false;
      this._lastDodge = 0;

      this.msgEl = document.createElement('span');
      this.msgEl.className = 'dodge-msg';
      this.btn.appendChild(this.msgEl);
      this._msgTimer = null;

      this.btn.addEventListener('mouseenter', () => this._dodge());
      this.btn.addEventListener('focus', () => this._dodge());
      this.btn.addEventListener('touchstart', (e) => { e.preventDefault(); this._dodge(); }, { passive: false });
      this.btn.addEventListener('click', (e) => { e.preventDefault(); this._dodge(); });

      window.addEventListener('resize', () => { if (this.roaming) this._reposition(); });
    }
    _pickMessage() {
      const msgs = this.config.dodgeMessages;
      return msgs[this.attempts % msgs.length];
    }
    _dodge() {
      const now = performance.now();
      if (now - this._lastDodge < 150) return;
      this._lastDodge = now;
      this.attempts++;

      if (this.responsive.reducedMotion) {
        this._showMessage();
        return;
      }
      if (!this.roaming) {
        const r = this.btn.getBoundingClientRect();
        this.btn.classList.add('is-roaming');
        this.btn.style.left = r.left + 'px';
        this.btn.style.top = r.top + 'px';
        requestAnimationFrame(() => { this.roaming = true; this._reposition(); });
      } else {
        this._reposition();
      }
      this._showMessage();
    }
    _reposition() {
      const w = this.btn.offsetWidth || 160;
      const h = this.btn.offsetHeight || 50;
      const margin = 16;
      const maxX = Math.max(margin, window.innerWidth - w - margin);
      const maxY = Math.max(margin, window.innerHeight - h - margin);
      const x = margin + Math.random() * (maxX - margin);
      const y = margin + Math.random() * (maxY - margin);

      const tier = this.attempts <= 1 ? 0 : this.attempts <= 3 ? 1 : 2;
      const rot = tier === 2 ? Math.random() * 40 - 20 : tier === 1 ? Math.random() * 16 - 8 : 0;
      const scale = tier === 2 ? 0.82 + Math.random() * 0.5 : 1;

      this.btn.style.left = x + 'px';
      this.btn.style.top = y + 'px';
      this.btn.style.transform = `rotate(${rot}deg) scale(${scale})`;
    }
    _showMessage() {
      const msg = this._pickMessage();
      this.msgEl.textContent = msg;
      this.msgEl.classList.add('show');
      this.live.textContent = msg;
      clearTimeout(this._msgTimer);
      this._msgTimer = setTimeout(() => this.msgEl.classList.remove('show'), 1200);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  LoveCard — idle float + pointer-driven 3D tilt                     */
  /* ------------------------------------------------------------------ */
  class LoveCard {
    constructor(el, responsive) {
      this.el = el;
      this.responsive = responsive;
      this.targetRotX = 0; this.targetRotY = 0;
      this.curRotX = 0; this.curRotY = 0;
      this.frozen = false;
      this.t0 = performance.now();

      if (!responsive.isTouch) {
        this.el.addEventListener('mousemove', (e) => this._onMove(e));
        this.el.addEventListener('mouseleave', () => { this.targetRotX = 0; this.targetRotY = 0; });
      }
      this.el.addEventListener('animationend', () => { this.el.style.animation = 'none'; }, { once: true });

      this._raf = requestAnimationFrame(this._loop.bind(this));
    }
    _onMove(e) {
      if (this.responsive.reducedMotion || this.frozen) return;
      const r = this.el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      this.targetRotY = px * 8;
      this.targetRotX = -py * 6;
    }
    _loop(ts) {
      if (!this.frozen) {
        this.curRotX += (this.targetRotX - this.curRotX) * 0.08;
        this.curRotY += (this.targetRotY - this.curRotY) * 0.08;
        const floatY = this.responsive.reducedMotion ? 0 : Math.sin((ts - this.t0) / 1800) * 8;
        this.el.style.transform =
          `translateY(${floatY.toFixed(2)}px) rotateX(${this.curRotX.toFixed(2)}deg) rotateY(${this.curRotY.toFixed(2)}deg)`;
      }
      this._raf = requestAnimationFrame(this._loop.bind(this));
    }
    freeze() {
      this.frozen = true;
      this.el.classList.add('card--frozen');
      this.el.style.pointerEvents = 'none';
    }
    unfreeze() {
      this.frozen = false;
      this.el.classList.remove('card--frozen');
      this.el.style.pointerEvents = '';
    }
    burstGlow() {
      this.el.style.boxShadow =
        '0 0 0 1px rgba(255,255,255,.3) inset, 0 40px 90px -20px rgba(30,0,15,.7), 0 0 170px 26px rgba(255,61,127,.9)';
    }
  }

  /* ------------------------------------------------------------------ */
  /*  TransitionManager — "Syncing our heartbeats..." overlay            */
  /* ------------------------------------------------------------------ */
  class TransitionManager {
    constructor(overlay, canvas, syncLabelEl, responsive) {
      this.overlay = overlay;
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.syncLabelEl = syncLabelEl;
      this.responsive = responsive;
      this._resize();
      window.addEventListener('resize', () => this._resize());
    }
    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = window.innerWidth; this.h = window.innerHeight;
      this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    play(duration, onMid, onEnd) {
      if (this.syncLabelEl) this.syncLabelEl.textContent = CONFIG.syncText;
      this.overlay.classList.add('show');
      this.overlay.setAttribute('aria-hidden', 'false');

      const count = this.responsive.reducedMotion ? 0 : (this.responsive.tier === 'low' ? 14 : 26);
      const cx = this.w / 2, cy = this.h / 2;
      const particles = Array.from({ length: count }, () => {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.max(this.w, this.h) * 0.6 * (0.4 + Math.random() * 0.6);
        const startX = cx + Math.cos(ang) * dist;
        const startY = cy + Math.sin(ang) * dist;
        return {
          startX, startY,
          size: 10 + Math.random() * 22,
          glyph: ['❤', '♥', '♡'][Math.floor(Math.random() * 3)],
          color: ['#ff6b93', '#ffb3c6', '#ffffff', '#ff3d7f'][Math.floor(Math.random() * 4)],
          delay: Math.random() * 0.3
        };
      });

      const start = performance.now();
      const durS = duration / 1000;
      const loop = (ts) => {
        const elapsed = (ts - start) / 1000;
        this.ctx.clearRect(0, 0, this.w, this.h);
        particles.forEach((p) => {
          const span = Math.max(0.05, durS - p.delay);
          let t = Math.max(0, Math.min(1, (elapsed - p.delay) / span));
          t = 1 - Math.pow(1 - t, 3);
          const x = p.startX + (cx - p.startX) * t;
          const y = p.startY + (cy - p.startY) * t;
          this.ctx.save();
          this.ctx.globalAlpha = 0.85 * (1 - t * 0.25);
          this.ctx.font = `${p.size}px sans-serif`;
          this.ctx.fillStyle = p.color;
          this.ctx.shadowColor = p.color;
          this.ctx.shadowBlur = 14;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(p.glyph, x, y);
          this.ctx.restore();
        });
        if (elapsed < durS) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

      if (onMid) setTimeout(onMid, duration * 0.55);
      setTimeout(() => {
        this.overlay.classList.remove('show');
        this.overlay.setAttribute('aria-hidden', 'true');
        if (onEnd) onEnd();
      }, duration);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  HeartFirework — one explosion, particles distributed on a heart    */
  /*  curve: x = 16 sin³(t), y = 13cos(t) − 5cos(2t) − 2cos(3t) − cos(4t) */
  /* ------------------------------------------------------------------ */
  class HeartFirework {
    constructor(x, y, palette, scaleFactor = 1) {
      this.x = x; this.y = y;
      this.particles = [];
      const count = Math.max(18, Math.round(90 * scaleFactor));
      for (let i = 0; i < count; i++) {
        const t = Math.random() * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const scale = (7 + Math.random() * 2.2) * Math.max(0.55, scaleFactor);
        this.particles.push({
          x: 0, y: 0,
          tx: hx * scale, ty: hy * scale,
          progress: 0,
          speed: 0.05 + Math.random() * 0.045,
          size: 2 + Math.random() * 2.6,
          color: palette[Math.floor(Math.random() * palette.length)],
          history: [],
          life: 1,
          decay: 0.006 + Math.random() * 0.007,
          twinkle: Math.random() * Math.PI * 2
        });
      }
      this.done = false;
    }
    update(dt) {
      let alive = false;
      for (const p of this.particles) {
        if (p.progress < 1) {
          p.progress = Math.min(1, p.progress + p.speed * (dt / 16));
          const ease = 1 - Math.pow(1 - p.progress, 3);
          p.x = p.tx * ease;
          p.y = p.ty * ease;
          alive = true;
        } else {
          p.y += 0.6 * (dt / 16);
          p.life -= p.decay * (dt / 16);
          if (p.life > 0) alive = true;
        }
        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > 4) p.history.shift();
        p.twinkle += 0.1 * (dt / 16);
      }
      this.done = !alive;
    }
    draw(ctx) {
      for (const p of this.particles) {
        const alpha = p.progress < 1 ? p.progress : Math.max(0, p.life);
        if (alpha <= 0) continue;
        for (let i = 0; i < p.history.length; i++) {
          const h = p.history[i];
          const trailAlpha = alpha * ((i + 1) / p.history.length) * 0.3;
          ctx.beginPath();
          ctx.globalAlpha = trailAlpha;
          ctx.fillStyle = p.color;
          ctx.arc(this.x + h.x, this.y + h.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        const tw = 0.75 + 0.25 * Math.sin(p.twinkle);
        ctx.beginPath();
        ctx.globalAlpha = alpha * tw;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.arc(this.x + p.x, this.y + p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  FireworksEngine — cosmic night sky: stars, shooting stars,         */
  /*  ambient hearts, launch + explosion orchestration                   */
  /* ------------------------------------------------------------------ */
  class FireworksEngine {
    constructor(canvas, responsive) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.responsive = responsive;
      this.running = false;
      this.stars = [];
      this.shootingStars = [];
      this.ambientHearts = [];
      this.projectiles = [];
      this.explosions = [];
      this.palette = [
        ['#ff6b93', '#ffe3ea', '#ff3d7f'],
        ['#ffd479', '#ffffff', '#ff8fab'],
        ['#c9a6ff', '#ffffff', '#ff6b93']
      ];
      this._autoTimer = null;

      this._resize();
      window.addEventListener('resize', () => this._resize());

      this.canvas.addEventListener('pointerdown', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.launchFrom(this.w / 2, this.h + 30, e.clientX - rect.left, e.clientY - rect.top, false);
      });

      this.responsive.onChange((p) => {
        if (p.visibilityChanged) { p.hidden ? this.stop() : (this.wasRunningBeforeHide && this.start()); }
      });
    }
    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = this.canvas.clientWidth;
      this.h = this.canvas.clientHeight;
      this.canvas.width = this.w * dpr;
      this.canvas.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._makeStars();
    }
    _makeStars() {
      const count = Math.round(140 * this.responsive.particleScale());
      this.stars = Array.from({ length: count }, () => ({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.9,
        r: 0.6 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.8
      }));
      const heartCount = Math.round(16 * this.responsive.particleScale());
      this.ambientHearts = Array.from({ length: heartCount }, () => this._spawnAmbientHeart(true));
    }
    _spawnAmbientHeart(initial) {
      return {
        x: Math.random() * this.w,
        y: initial ? Math.random() * this.h : this.h + 30,
        size: 8 + Math.random() * 14,
        speed: 0.15 + Math.random() * 0.35,
        drift: Math.random() * Math.PI * 2,
        opacity: 0.12 + Math.random() * 0.28,
        color: Math.random() < 0.5 ? '#ff8fab' : '#c9a6ff'
      };
    }
    start() {
      this.wasRunningBeforeHide = true;
      if (this.running) return;
      this.running = true;
      this._lastTs = performance.now();
      requestAnimationFrame(this._loop.bind(this));
      this._scheduleAuto();
      // greet the scene with one gentle firework near the center
      setTimeout(() => {
        if (this.running) this.launchFrom(this.w / 2, this.h + 30, this.w / 2, this.h * 0.32, false);
      }, 500);
    }
    stop() {
      this.wasRunningBeforeHide = false;
      this.running = false;
      clearTimeout(this._autoTimer);
    }
    _scheduleAuto() {
      if (this.responsive.reducedMotion) return;
      const delay = 4200 + Math.random() * 4600;
      this._autoTimer = setTimeout(() => {
        if (!this.running) return;
        const x = this.w * (0.18 + Math.random() * 0.64);
        const y = this.h * (0.16 + Math.random() * 0.4);
        this.launchFrom(this.w / 2, this.h + 20, x, y, true);
        this._scheduleAuto();
      }, delay);
    }
    launchFrom(sx, sy, tx, ty, small) {
      this.projectiles.push({
        sx, sy, tx, ty, progress: 0,
        speed: 0.026 + Math.random() * 0.012,
        color: small ? '#ffb3c6' : '#ff6b93',
        small: !!small
      });
    }
    _loop(ts) {
      if (!this.running) return;
      const dt = Math.min(32, ts - (this._lastTs || ts));
      this._lastTs = ts;
      this._update(dt);
      this._draw();
      requestAnimationFrame(this._loop.bind(this));
    }
    _update(dt) {
      if (!this.responsive.reducedMotion && Math.random() < 0.0022 * (dt / 16)) {
        this.shootingStars.push({
          x: Math.random() * this.w * 0.6, y: Math.random() * this.h * 0.3,
          vx: 6 + Math.random() * 4, vy: 2 + Math.random() * 2, life: 1
        });
      }
      this.shootingStars.forEach((s) => { s.x += s.vx * (dt / 16); s.y += s.vy * (dt / 16); s.life -= 0.02 * (dt / 16); });
      this.shootingStars = this.shootingStars.filter((s) => s.life > 0);

      this.ambientHearts.forEach((h) => {
        h.y -= h.speed * (dt / 16);
        h.drift += 0.01 * (dt / 16);
        h.x += Math.sin(h.drift) * 0.15;
        if (h.y < -20) Object.assign(h, this._spawnAmbientHeart(false));
      });

      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.progress += p.speed * (dt / 16);
        if (p.progress >= 1) {
          const palette = this.palette[Math.floor(Math.random() * this.palette.length)];
          const scale = (p.small ? 0.55 : 1) * Math.max(0.5, this.responsive.particleScale());
          this.explosions.push(new HeartFirework(p.tx, p.ty, palette, scale));
          this.projectiles.splice(i, 1);
        }
      }
      for (let i = this.explosions.length - 1; i >= 0; i--) {
        this.explosions[i].update(dt);
        if (this.explosions[i].done) this.explosions.splice(i, 1);
      }
    }
    _draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);

      const now = performance.now() * 0.001;
      for (const s of this.stars) {
        const tw = 0.5 + 0.5 * Math.sin(now * s.speed + s.phase);
        ctx.beginPath();
        ctx.globalAlpha = 0.3 + tw * 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      this.shootingStars.forEach((s) => {
        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.lineWidth = 2;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      this.ambientHearts.forEach((h) => {
        ctx.save();
        ctx.globalAlpha = h.opacity;
        ctx.fillStyle = h.color;
        ctx.font = `${h.size}px sans-serif`;
        ctx.fillText('❤', h.x, h.y);
        ctx.restore();
      });

      this.projectiles.forEach((p) => {
        const x = p.sx + (p.tx - p.sx) * p.progress;
        const y = p.sy + (p.ty - p.sy) * p.progress;
        const tailProg = Math.max(0, p.progress - 0.18);
        const tx0 = p.sx + (p.tx - p.sx) * tailProg;
        const ty0 = p.sy + (p.ty - p.sy) * tailProg;
        const grad = ctx.createLinearGradient(tx0, ty0, x, y);
        grad.addColorStop(0, 'rgba(255,107,147,0)');
        grad.addColorStop(1, p.color);
        ctx.strokeStyle = grad;
        ctx.lineWidth = p.small ? 2 : 3;
        ctx.beginPath();
        ctx.moveTo(tx0, ty0);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.arc(x, y, p.small ? 2.4 : 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      this.explosions.forEach((e) => e.draw(ctx));
    }
  }

  /* ------------------------------------------------------------------ */
  /*  AudioController — optional background music, no forced autoplay   */
  /* ------------------------------------------------------------------ */
  class AudioController {
    constructor(btn, iconEl, liveRegion) {
      this.btn = btn;
      this.icon = iconEl;
      this.live = liveRegion;
      this.enabled = false;
      this.available = true;
      this.audio = new Audio('assets/audio/bg-music.mp3');
      this.audio.loop = true;
      this.audio.volume = 0.35;
      this.audio.addEventListener('error', () => {
        this.available = false;
        this.btn.classList.add('is-muted');
      });
      this.btn.addEventListener('click', () => this.toggle());
    }
    toggle() {
      if (!this.available) {
        this.live.textContent = 'Background music is not available.';
        return;
      }
      if (this.enabled) {
        this.audio.pause();
        this.enabled = false;
        this.icon.textContent = '🎵';
        this.btn.classList.add('is-muted');
        this.btn.setAttribute('aria-pressed', 'false');
      } else {
        this.audio.play().then(() => {
          this.enabled = true;
          this.icon.textContent = '🔊';
          this.btn.classList.remove('is-muted');
          this.btn.setAttribute('aria-pressed', 'true');
        }).catch(() => {
          this.available = false;
          this.btn.classList.add('is-muted');
          this.live.textContent = 'Background music could not be played.';
        });
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  SceneManager — swap between the three scenes, manage focus         */
  /* ------------------------------------------------------------------ */
  class SceneManager {
    constructor() {
      this.scenes = {};
      document.querySelectorAll('.scene').forEach((s) => { this.scenes[s.id] = s; });
      this.hooks = {};
      this.current = 'scene-love-card';
    }
    register(id, hooks) { this.hooks[id] = hooks; }
    switchTo(id) {
      const prev = this.current;
      if (prev === id || !this.scenes[id]) return;
      if (this.hooks[prev] && this.hooks[prev].onExit) this.hooks[prev].onExit();
      Object.values(this.scenes).forEach((s) => s.classList.remove('scene--active'));
      this.scenes[id].classList.add('scene--active');
      this.current = id;
      if (this.hooks[id] && this.hooks[id].onEnter) this.hooks[id].onEnter();
      const heading = this.scenes[id].querySelector('h1,h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  App — wires every system together                                  */
  /* ------------------------------------------------------------------ */
  class App {
    constructor() {
      this.responsive = new ResponsiveManager();
      this.live = document.getElementById('live-region');
      this.sceneManager = new SceneManager();

      this.heartsBg1 = new HeartParticleSystem(document.getElementById('hearts-bg-canvas'), this.responsive, { count: 44 });
      this.heartsBg2 = new HeartParticleSystem(document.getElementById('hearts-bg-canvas-2'), this.responsive, { count: 32 });

      this.loveCard = new LoveCard(document.getElementById('love-card'), this.responsive);
      this.dodger = new DodgingButton(document.getElementById('no-btn'), CONFIG, this.live, this.responsive);

      this.transitionManager = new TransitionManager(
        document.getElementById('transition-overlay'),
        document.getElementById('transition-canvas'),
        document.querySelector('.sync-label'),
        this.responsive
      );

      this.fireworksEngine = new FireworksEngine(document.getElementById('cosmic-canvas'), this.responsive);

      this.audio = new AudioController(
        document.getElementById('music-toggle'),
        document.querySelector('.music-icon'),
        this.live
      );

      this._applyConfig();
      this._bindSceneHooks();
      this._bindButtons();

      this.heartsBg1.start();
      this._yesInFlight = false;
      this._launchInFlight = false;
    }

    _applyConfig() {
      const setText = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
      setText('.card-header.pill span', CONFIG.cardHeader);
      setText('.question', CONFIG.question);
      setText('.sub-question', CONFIG.subQuestion);
      setText('#yes-btn span', CONFIG.yesText);
      setText('#no-btn-label', CONFIG.noText);
      setText('#reveal-title', CONFIG.revealTitle);
      setText('#reveal-text', CONFIG.revealText);
      setText('#message-box-text', CONFIG.revealMessage);
      setText('#fireworks-btn span', CONFIG.fireworksButtonText);
      setText('.cosmic-title', CONFIG.cosmicTitle);
      setText('.cosmic-subtitle', CONFIG.cosmicSubtitle);
      setText('#back-btn', CONFIG.backButtonText);
    }

    _bindSceneHooks() {
      this.sceneManager.register('scene-love-card', {
        onEnter: () => this.heartsBg1.start(),
        onExit: () => this.heartsBg1.stop()
      });
      this.sceneManager.register('scene-reveal', {
        onEnter: () => this.heartsBg2.start(),
        onExit: () => this.heartsBg2.stop()
      });
      this.sceneManager.register('scene-cosmic', {
        onEnter: () => this.fireworksEngine.start(),
        onExit: () => this.fireworksEngine.stop()
      });
    }

    _bindButtons() {
      document.getElementById('yes-btn').addEventListener('click', () => this._handleYes());
      document.getElementById('fireworks-btn').addEventListener('click', () => this._handleLaunchFireworks());
      document.getElementById('back-btn').addEventListener('click', () => this.sceneManager.switchTo('scene-love-card'));
    }

    _handleYes() {
      if (this._yesInFlight) return;
      this._yesInFlight = true;

      const card = document.getElementById('love-card');
      const rect = card.getBoundingClientRect();

      this.loveCard.freeze();
      this.loveCard.burstGlow();
      this.heartsBg1.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, this.responsive.tier === 'low' ? 14 : 26);

      card.style.transition = 'transform .6s cubic-bezier(.65,0,.35,1), opacity .6s ease';
      setTimeout(() => {
        card.style.transform = (card.style.transform || '') + ' scale(1.06)';
        card.style.opacity = '0';
      }, 260);

      this.live.textContent = CONFIG.syncText;
      this.transitionManager.play(1500, null, () => {
        this.sceneManager.switchTo('scene-reveal');
        card.style.transform = '';
        card.style.opacity = '1';
        card.style.boxShadow = '';
        this.loveCard.unfreeze();
        this._yesInFlight = false;
      });
    }

    _handleLaunchFireworks() {
      if (this._launchInFlight) return;
      this._launchInFlight = true;
      this.transitionManager.play(1300, null, () => {
        this.sceneManager.switchTo('scene-cosmic');
        this._launchInFlight = false;
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
  });
})();
