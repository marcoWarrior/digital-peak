// ─────────────────────────────────────────────────────────────────────────
//  surf-game.js — Digital Peak · Versione D "Peak Run"
//  Proiezione 3D->2D sincronizzata con la camera WebGL:
//  - Tavola energetica / Flusso luminoso che surfa fisicamente sulle onde
//  - Scia liquida neon, particelle spray e scia inerziale del cursore
//  - Meccanica giocabile "PEAK RUN": raccolta Data Nodes (ICP, AI, SQL, CRO),
//    portali di boost e schivata degli ostacoli di mercato (Silos, Friction)
//  - Fallback 2D synthwave completo se WebGL2 non è disponibile
// ─────────────────────────────────────────────────────────────────────────
(function (global) {
  'use strict';

  const NODE_LABELS = ['ICP SIGNAL', 'SQL +1', 'AI AGENT', 'CRO +34%', 'CRM SYNC', 'ABM DEAL', 'REV OPS', 'INTENT +'];
  const OBSTACLE_LABELS = ['DATA SILOS', 'AD WASTE', 'UX FRICTION', 'MANUAL OPS', 'LEAD DECAY'];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  class SurfEngine {
    constructor(canvas, pathMath, callbacks) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.pathMath = pathMath;
      this.cb = callbacks || {};

      this.width = 1;
      this.height = 1;
      this.dpr = 1;

      // Stato tavola energetica
      this.steerTarget = 0;   // [-1..1]
      this.steerX = 0;        // offset laterale in metri [-7.5..7.5]
      this.steerVel = 0;
      this.bank = 0;
      this.wake = [];
      this.particles = [];
      this.callouts = [];
      this.cursorTrail = [];

      // Stato gioco Peak Run
      this.gameActive = false;
      this.gameCompleted = false;
      this.score = 0;
      this.combo = 1;
      this.maxCombo = 1;
      this.nodesCollected = 0;
      this.obstaclesDodged = 0;
      this.hits = 0;
      this.runStartZ = 60;
      this.runEndZ = 2480;

      this.entities = [];
      this.buildEntities();
    }

    buildEntities() {
      this.entities.length = 0;
      // Popola il canale da Z=45 fino a Z=2450 con Data Nodes, Boost Gates e Ostacoli
      let idx = 0;
      for (let z = 55; z <= 2440; z += 22) {
        const seed = Math.sin(z * 0.173 + idx * 1.91) * 43758.5453;
        const r1 = seed - Math.floor(seed);
        const r2 = (seed * 1.73) - Math.floor(seed * 1.73);

        const isRunZone = z >= 1880 && z <= 2420;
        let kind = 'node';
        if (idx % 9 === 4) {
          kind = 'boost';
        } else if ((isRunZone && idx % 3 === 2) || (!isRunZone && idx % 5 === 3)) {
          kind = 'obstacle';
        }

        const laneSpan = isRunZone ? 6.4 : 5.4;
        const offset = (r1 * 2 - 1) * laneSpan;
        const label = kind === 'obstacle'
          ? OBSTACLE_LABELS[idx % OBSTACLE_LABELS.length]
          : (kind === 'boost' ? 'HYPER STREAM' : NODE_LABELS[idx % NODE_LABELS.length]);

        this.entities.push({
          id: idx,
          z,
          offset,
          kind,
          label,
          state: 'active', // 'active' | 'collected' | 'hit' | 'passed'
          anim: 0,
          phase: r2 * Math.PI * 2
        });

        // Nella zona The Run aggiungiamo coppie slalom più dense
        if (isRunZone && idx % 2 === 0) {
          const oppOffset = clamp(-offset * 0.85, -6.2, 6.2);
          this.entities.push({
            id: idx + 1000,
            z: z + 11,
            offset: oppOffset,
            kind: kind === 'obstacle' ? 'node' : 'obstacle',
            label: kind === 'obstacle'
              ? NODE_LABELS[(idx + 3) % NODE_LABELS.length]
              : OBSTACLE_LABELS[(idx + 2) % OBSTACLE_LABELS.length],
            state: 'active',
            anim: 0,
            phase: r1 * Math.PI * 2
          });
        }
        idx++;
      }
    }

    resetRun(startZ) {
      this.gameActive = true;
      this.gameCompleted = false;
      this.score = 0;
      this.combo = 1;
      this.maxCombo = 1;
      this.nodesCollected = 0;
      this.obstaclesDodged = 0;
      this.hits = 0;
      this.runStartZ = typeof startZ === 'number' ? startZ : 60;
      this.entities.forEach((e) => {
        e.state = 'active';
        e.anim = 0;
      });
    }

    stopRun() {
      this.gameActive = false;
    }

    resize() {
      const dpr = Math.min(global.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(this.canvas.clientWidth || global.innerWidth));
      const h = Math.max(1, Math.floor(this.canvas.clientHeight || global.innerHeight));
      this.dpr = dpr;
      this.width = w;
      this.height = h;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
    }

    setSteer(normX) {
      this.steerTarget = clamp(normX, -1, 1);
    }

    addCursorPoint(x, y) {
      this.cursorTrail.push({ x, y, life: 1 });
      if (this.cursorTrail.length > 26) this.cursorTrail.shift();
    }

    spawnBurst(wx, wy, wz, color, count) {
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const spd = 2.5 + Math.random() * 7.5;
        this.particles.push({
          x: wx,
          y: wy,
          z: wz,
          vx: Math.cos(ang) * spd,
          vy: 1.8 + Math.random() * 5.2,
          vz: Math.sin(ang) * spd + 4,
          life: 1,
          color,
          size: 2.2 + Math.random() * 2.8
        });
      }
    }

    spawnCallout(wx, wy, wz, text, color) {
      this.callouts.push({ x: wx, y: wy + 1.2, z: wz, text, color, life: 1 });
      if (this.callouts.length > 10) this.callouts.shift();
    }

    project(wx, wy, wz, cam) {
      const dx = wx - cam.pos[0];
      const dy = wy - cam.pos[1];
      const dz = wz - cam.pos[2];

      const cz = dx * cam.fwd[0] + dy * cam.fwd[1] + dz * cam.fwd[2];
      if (cz <= 0.35) return null;

      const cx = dx * cam.right[0] + dy * cam.right[1] + dz * cam.right[2];
      const cy = dx * cam.up[0] + dy * cam.up[1] + dz * cam.up[2];

      const aspect = this.width / Math.max(1, this.height);
      const ndcX = cx / (cz * cam.tanHalf * aspect);
      const ndcY = cy / (cz * cam.tanHalf);

      return {
        x: (ndcX * 0.5 + 0.5) * this.width,
        y: (0.5 - ndcY * 0.5) * this.height,
        depth: cz,
        scale: this.height / (cz * cam.tanHalf * 2)
      };
    }

    updateAndRender(dt, state) {
      const ctx = this.ctx;
      if (!ctx) return;

      ctx.save();
      ctx.scale(this.dpr, this.dpr);
      ctx.clearRect(0, 0, this.width, this.height);

      // Se WebGL2 non è attivo, disegna l'oceano synthwave 2D di fallback
      if (state.useFallback2D) {
        this.renderFallbackOcean(ctx, state);
      }

      const cam = state.cam;
      const time = state.time;

      // 1. Fisica laterale della tavola energetica
      const maxOffset = this.gameActive ? 7.2 : 5.8;
      const desiredX = this.steerTarget * maxOffset;
      const spring = this.gameActive ? 15.0 : 10.5;
      const damp = this.gameActive ? 6.8 : 5.8;
      const force = (desiredX - this.steerX) * spring - this.steerVel * damp;
      this.steerVel += force * dt;
      this.steerX = clamp(this.steerX + this.steerVel * dt, -7.6, 7.6);
      this.bank = lerp(this.bank, clamp(-this.steerVel * 0.11, -0.58, 0.58), Math.min(1, dt * 12));

      const boardZ = cam.pos[2] + 11.5;
      const centerLineX = this.pathMath.pathX(boardZ);
      const boardX = centerLineX + this.steerX;
      const boardY = this.pathMath.swell(boardX, boardZ, time) + 0.26;

      // Aggiungi punto alla scia d'onda
      this.wake.push({
        x: boardX,
        y: boardY - 0.1,
        z: boardZ - 0.8,
        bank: this.bank,
        life: 1
      });
      if (this.wake.length > 42) this.wake.shift();

      // Spruzzo laterale quando la tavola curva rapidamente
      if (Math.abs(this.steerVel) > 3.5 && Math.random() < 0.75) {
        this.particles.push({
          x: boardX + (this.steerVel > 0 ? -0.55 : 0.55),
          y: boardY,
          z: boardZ - 0.3,
          vx: -this.steerVel * 0.35 + (Math.random() - 0.5) * 2,
          vy: 1.5 + Math.random() * 2.4,
          vz: -2 - Math.random() * 3,
          life: 0.75,
          color: '#00F0FF',
          size: 2.0
        });
      }

      // 2. Collisioni e raccolta lungo il canale
      for (let i = 0; i < this.entities.length; i++) {
        const e = this.entities[i];
        const dz = e.z - boardZ;

        // Rigenera entità molto dietro la camera se non siamo in modalità sfida completata
        if (dz < -40 && !this.gameActive && e.state !== 'active') {
          e.state = 'active';
          e.anim = 0;
        }

        if (e.state !== 'active') {
          e.anim = Math.min(1, e.anim + dt * 3.2);
          continue;
        }

        if (Math.abs(dz) < 2.35) {
          const ex = this.pathMath.pathX(e.z) + e.offset;
          const dx = Math.abs(ex - boardX);
          const ey = this.pathMath.swell(ex, e.z, time) + 0.8;

          if (e.kind === 'node' && dx < 2.15) {
            e.state = 'collected';
            this.nodesCollected++;
            const pts = 150 * this.combo;
            this.score += pts;
            this.combo = Math.min(8, this.combo + 1);
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.spawnBurst(ex, ey, e.z, '#00F0FF', 16);
            this.spawnCallout(ex, ey, e.z, `${e.label} +${pts}`, '#00F0FF');
            if (this.cb.onCollect) this.cb.onCollect(this.combo, pts, e.label);
          } else if (e.kind === 'boost' && dx < 3.1) {
            e.state = 'collected';
            const pts = 250 * this.combo;
            this.score += pts;
            this.combo = Math.min(8, this.combo + 1);
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.spawnBurst(ex, ey, e.z, '#FFB800', 22);
            this.spawnCallout(ex, ey, e.z, `WARP STREAM +${pts}`, '#FFB800');
            if (this.cb.onBoost) this.cb.onBoost(this.combo, pts);
          } else if (e.kind === 'obstacle') {
            if (dx < 1.65) {
              e.state = 'hit';
              this.hits++;
              this.combo = 1;
              this.score = Math.max(0, this.score - 100);
              this.spawnBurst(ex, ey, e.z, '#FF2A85', 20);
              this.spawnCallout(ex, ey, e.z, `${e.label} · GLITCH`, '#FF2A85');
              if (this.cb.onHit) this.cb.onHit(e.label);
            } else if (dx < 2.95 && dz < 0) {
              e.state = 'passed';
              this.obstaclesDodged++;
              const pts = 90 * this.combo;
              this.score += pts;
              this.spawnCallout(ex, ey, e.z, `NEAR MISS +${pts}`, '#9B5CFF');
              if (this.cb.onNearMiss) this.cb.onNearMiss(pts);
            }
          }
        } else if (dz < -2.6 && e.kind === 'obstacle' && e.state === 'active') {
          e.state = 'passed';
          this.obstaclesDodged++;
        }
      }

      // Controllo traguardo Peak Run
      if (this.gameActive && !this.gameCompleted && cam.pos[2] >= this.runEndZ - 25) {
        this.gameCompleted = true;
        this.gameActive = false;
        if (this.cb.onFinishRun) {
          this.cb.onFinishRun({
            score: this.score,
            maxCombo: this.maxCombo,
            nodes: this.nodesCollected,
            dodged: this.obstaclesDodged,
            hits: this.hits
          });
        }
      }

      // 3. Disegno entità 3D nel canale (ordinate da lontano a vicino)
      const visible = [];
      for (let i = 0; i < this.entities.length; i++) {
        const e = this.entities[i];
        const dz = e.z - cam.pos[2];
        if (dz < 2.5 || dz > 210) continue;
        if (e.state !== 'active' && e.anim >= 1) continue;
        visible.push(e);
      }
      visible.sort((a, b) => b.z - a.z);

      for (let i = 0; i < visible.length; i++) {
        const e = visible[i];
        const wx = this.pathMath.pathX(e.z) + e.offset;
        const wy = this.pathMath.swell(wx, e.z, time) + 0.72 + Math.sin(time * 2.6 + e.phase) * 0.18;
        const p = this.project(wx, wy, e.z, cam);
        if (!p) continue;
        const fade = clamp(1 - p.depth / 205, 0, 1) * (1 - e.anim);
        if (fade <= 0.02) continue;
        this.drawEntity(ctx, e, p, time, fade);
      }

      // 4. Disegno scia liquida e tavola energetica
      this.drawWake(ctx, cam, time);
      this.drawBoard(ctx, boardX, boardY, boardZ, cam, time);

      // 5. Particelle 3D e Callout
      this.drawParticles(ctx, dt, cam);
      this.drawCallouts(ctx, dt, cam);
      this.drawCursorTrail(ctx, dt);

      ctx.restore();
    }

    drawEntity(ctx, e, p, time, alpha) {
      const r = clamp(p.scale * 0.9, 4, 42) * (1 + e.anim * 0.8);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = alpha;

      if (e.kind === 'node') {
        // Data Node ottaedrico ciano/oro
        const pulse = 0.85 + 0.15 * Math.sin(time * 4 + e.phase);
        const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.7);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.35, 'rgba(0, 240, 255, 0.75)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.7 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(time * 1.2 + e.phase);
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = Math.max(1.2, r * 0.11);
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.78, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.78, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.rotate(-time * 1.2 - e.phase);
        if (p.depth < 95 && r > 10) {
          ctx.font = `600 ${Math.round(clamp(r * 0.52, 9, 12))}px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(230, 252, 255, 0.92)';
          ctx.fillText(e.label, 0, -r * 1.35);
        }
      } else if (e.kind === 'boost') {
        // Portale Hyper Stream
        const w = r * 2.2;
        const h = r * 1.25;
        ctx.strokeStyle = '#FFB800';
        ctx.lineWidth = Math.max(1.5, r * 0.14);
        ctx.beginPath();
        ctx.ellipse(0, 0, w, h, 0, Math.PI, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = Math.max(1, r * 0.08);
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.82, h * 0.78, 0, Math.PI, Math.PI * 2);
        ctx.stroke();

        if (p.depth < 110 && r > 11) {
          ctx.font = `700 ${Math.round(clamp(r * 0.5, 9, 12))}px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FFB800';
          ctx.fillText('⚡ ' + e.label, 0, -h - 6);
        }
      } else {
        // Ostacolo di mercato (Silos / Friction)
        const pulse = 0.9 + 0.1 * Math.sin(time * 7 + e.phase);
        const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.5);
        grad.addColorStop(0, 'rgba(255, 42, 133, 0.85)');
        grad.addColorStop(0.6, 'rgba(255, 42, 133, 0.25)');
        grad.addColorStop(1, 'rgba(255, 42, 133, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FF2A85';
        ctx.lineWidth = Math.max(1.4, r * 0.13);
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.95);
        ctx.lineTo(r * 0.95, r * 0.75);
        ctx.lineTo(-r * 0.95, r * 0.75);
        ctx.closePath();
        ctx.stroke();

        if (p.depth < 95 && r > 10) {
          ctx.font = `600 ${Math.round(clamp(r * 0.48, 9, 11))}px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FF70A6';
          ctx.fillText('▲ ' + e.label, 0, -r * 1.25);
        }
      }
      ctx.restore();
    }

    drawWake(ctx, cam, time) {
      if (this.wake.length < 2) return;
      ctx.save();
      for (let i = 0; i < this.wake.length; i++) {
        this.wake[i].life -= 0.022;
      }
      while (this.wake.length && this.wake[0].life <= 0) this.wake.shift();

      const leftPts = [];
      const rightPts = [];
      for (let i = 0; i < this.wake.length; i++) {
        const w = this.wake[i];
        const spread = 0.42 + (1 - w.life) * 1.65;
        const pL = this.project(w.x - spread, w.y, w.z - (1 - w.life) * 5.5, cam);
        const pR = this.project(w.x + spread, w.y, w.z - (1 - w.life) * 5.5, cam);
        if (pL && pR) {
          leftPts.push({ p: pL, life: w.life });
          rightPts.push({ p: pR, life: w.life });
        }
      }

      const drawRibbon = (pts, color) => {
        if (pts.length < 2) return;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1];
          const b = pts[i];
          ctx.strokeStyle = color;
          ctx.globalAlpha = Math.max(0, b.life * 0.75);
          ctx.lineWidth = Math.max(1, b.life * 3.5);
          ctx.beginPath();
          ctx.moveTo(a.p.x, a.p.y);
          ctx.lineTo(b.p.x, b.p.y);
          ctx.stroke();
        }
      };

      drawRibbon(leftPts, '#00F0FF');
      drawRibbon(rightPts, '#FF2A85');
      ctx.restore();
    }

    drawBoard(ctx, bx, by, bz, cam, time) {
      const nose = this.project(bx + Math.sin(-this.bank) * 0.3, by + 0.08, bz + 1.9, cam);
      const tail = this.project(bx, by, bz - 1.1, cam);
      const left = this.project(bx - 0.85 * Math.cos(this.bank), by + Math.sin(this.bank) * 0.45, bz - 0.15, cam);
      const right = this.project(bx + 0.85 * Math.cos(this.bank), by - Math.sin(this.bank) * 0.45, bz - 0.15, cam);
      if (!nose || !tail || !left || !right) return;

      ctx.save();
      // Alone energetico sotto la tavola
      const glow = ctx.createRadialGradient(tail.x, tail.y, 2, tail.x, tail.y, 58);
      glow.addColorStop(0, 'rgba(0, 240, 255, 0.55)');
      glow.addColorStop(0.5, 'rgba(255, 42, 133, 0.22)');
      glow.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(tail.x, tail.y, 58, 0, Math.PI * 2);
      ctx.fill();

      // Corpo tavola hydro-foil futuristica
      ctx.fillStyle = 'rgba(10, 14, 30, 0.9)';
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(nose.x, nose.y);
      ctx.lineTo(right.x, right.y);
      ctx.lineTo(tail.x, tail.y);
      ctx.lineTo(left.x, left.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Spina dorsale plasma
      ctx.strokeStyle = '#FF2A85';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(nose.x, nose.y);
      ctx.lineTo(tail.x, tail.y);
      ctx.stroke();

      // Propulsore posteriore
      const pulse = 5 + Math.sin(time * 18) * 2;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(tail.x, tail.y, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawParticles(ctx, dt, cam) {
      ctx.save();
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.z += pt.vz * dt;
        pt.vy -= 7.5 * dt;
        pt.life -= dt * 1.45;
        if (pt.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        const proj = this.project(pt.x, pt.y, pt.z, cam);
        if (!proj) continue;
        ctx.globalAlpha = clamp(pt.life, 0, 1);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, pt.size * clamp(proj.scale * 0.08, 0.6, 2.4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawCallouts(ctx, dt, cam) {
      ctx.save();
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      for (let i = this.callouts.length - 1; i >= 0; i--) {
        const c = this.callouts[i];
        c.y += dt * 1.8;
        c.life -= dt * 0.95;
        if (c.life <= 0) {
          this.callouts.splice(i, 1);
          continue;
        }
        const proj = this.project(c.x, c.y, c.z, cam);
        if (!proj) continue;
        ctx.globalAlpha = clamp(c.life, 0, 1);
        ctx.fillStyle = c.color;
        ctx.fillText(c.text, proj.x, proj.y);
      }
      ctx.restore();
    }

    drawCursorTrail(ctx, dt) {
      if (this.cursorTrail.length < 2) return;
      ctx.save();
      for (let i = this.cursorTrail.length - 1; i >= 0; i--) {
        this.cursorTrail[i].life -= dt * 2.8;
        if (this.cursorTrail[i].life <= 0) this.cursorTrail.splice(i, 1);
      }
      for (let i = 1; i < this.cursorTrail.length; i++) {
        const a = this.cursorTrail[i - 1];
        const b = this.cursorTrail[i];
        ctx.strokeStyle = 'rgba(0, 240, 255, ' + (b.life * 0.45).toFixed(2) + ')';
        ctx.lineWidth = b.life * 3;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    renderFallbackOcean(ctx, state) {
      const w = this.width;
      const h = this.height;
      const horizonY = h * 0.48;

      const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
      sky.addColorStop(0, '#070312');
      sky.addColorStop(0.55, '#2A0B3F');
      sky.addColorStop(1, '#FF2A85');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, horizonY);

      // Sole synthwave
      const sunR = Math.min(w, h) * 0.13;
      const sunGrad = ctx.createLinearGradient(0, horizonY - sunR * 1.8, 0, horizonY);
      sunGrad.addColorStop(0, '#FFB800');
      sunGrad.addColorStop(1, '#FF2A85');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, horizonY - sunR * 0.35, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Oceano
      const sea = ctx.createLinearGradient(0, horizonY, 0, h);
      sea.addColorStop(0, '#19082C');
      sea.addColorStop(1, '#04030A');
      ctx.fillStyle = sea;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // Griglia prospettica
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
      ctx.lineWidth = 1;
      for (let i = -12; i <= 12; i++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5 + i * 18, horizonY);
        ctx.lineTo(w * 0.5 + i * 140, h);
        ctx.stroke();
      }
      const offset = (state.cam.pos[2] * 0.12) % 1;
      for (let j = 1; j <= 14; j++) {
        const t = Math.pow((j + offset) / 15, 2.2);
        const y = horizonY + t * (h - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
  }

  global.DPSurf = { SurfEngine };
})(window);
