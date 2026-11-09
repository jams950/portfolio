/* ==========================================================================
   LANYARD ID CARD
   A small physics simulation (verlet rope) with the ID card hanging at the
   end. The card drops in, swings, and can be dragged and thrown.

   Settings you can tweak are in SETTINGS below.
   ========================================================================== */

window.Lanyard = (function () {
  var SETTINGS = {
    segments: 14,          // how many links the strap has
    gravity: 2400,         // pixels per second squared
    damping: .982,         // 1 = swings forever, lower = settles faster
    iterations: 18,        // constraint passes per frame (stiffer strap)
    maxSpeed: 9,           // pixels per physics step
    strapWidth: 20,
    strapText: 'JERMAINE  ✦  PORTFOLIO  ✦  ',
    strapColor: '#0F1B33',
    strapEdge: '#2563EB'
  };

  var root, canvas, ctx, card;
  var W = 0, H = 0, dpr = 1;
  var anchor = { x: 0, y: 0 };
  var points = [];            // strap points, then card top, then card bottom
  var segLength = 20, cardW = 0, cardH = 0;
  var dragging = false, grabOffset = { x: 0, y: 0 }, pointer = null;
  var running = false, calmFrames = 0, visible = true, started = false;
  var tiltY = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function point(x, y, invMass) { return { x: x, y: y, px: x, py: y, w: invMass }; }
  function cardTop() { return points[points.length - 2]; }
  function cardBottom() { return points[points.length - 1]; }

  /* Size everything to the hero ------------------------------------------ */
  function measure() {
    var box = root.getBoundingClientRect();
    var oldAnchorX = anchor.x;
    W = box.width; H = box.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var newCardH = card.offsetHeight;
    cardW = card.offsetWidth;
    anchor.x = W / 2;
    anchor.y = -10;

    // Where the top of the card rests: roughly centered in the hero.
    var restY = Math.max(110, (H - newCardH) / 2 + 30);
    var newSeg = restY / SETTINGS.segments;

    if (!points.length || Math.abs(newCardH - cardH) > 2 || Math.abs(newSeg - segLength) > 3) {
      cardH = newCardH; segLength = newSeg;
      if (points.length) restPose(); // breakpoint change: re-hang the card
    } else if (oldAnchorX) {
      var dx = anchor.x - oldAnchorX;
      points.forEach(function (p) { p.x += dx; p.px += dx; });
    }
  }

  /* Card hanging straight down */
  function restPose() {
    points = [];
    for (var i = 0; i <= SETTINGS.segments; i++) points.push(point(anchor.x, anchor.y + i * segLength, i === 0 ? 0 : 1));
    var top = points[points.length - 1];
    top.w = .5;
    points.push(point(anchor.x, top.y + cardH, .5));
  }

  /* Card held just above the page, so it drops into view */
  function dropPose() {
    points = [];
    var restTop = segLength * SETTINGS.segments;
    var startTop = -cardH * .55;
    for (var i = 0; i <= SETTINGS.segments; i++) {
      // Slack strap gathered above the card
      var t = i / SETTINGS.segments;
      points.push(point(anchor.x + Math.sin(t * Math.PI) * 26, i === 0 ? anchor.y : anchor.y + (startTop - anchor.y) * t, i === 0 ? 0 : 1));
    }
    var top = points[points.length - 1];
    top.w = .5;
    points.push(point(anchor.x + 18, top.y + cardH, .5)); // slightly off-center, so it sways as it lands
  }

  /* Physics step ------------------------------------------------------- */
  function step(dt) {
    var g = SETTINGS.gravity * dt * dt;
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (p.w === 0) continue;
      var vx = (p.x - p.px) * SETTINGS.damping;
      var vy = (p.y - p.py) * SETTINGS.damping;
      // Speed limit keeps throws and landings smooth
      var speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > SETTINGS.maxSpeed) { vx *= SETTINGS.maxSpeed / speed; vy *= SETTINGS.maxSpeed / speed; }
      p.px = p.x; p.py = p.y;
      p.x += vx; p.y += vy + g;
    }

    var top = cardTop(), bottom = cardBottom();
    if (dragging) {
      // The held point follows the pointer; its last move becomes the throw speed.
      top.px = top.x; top.py = top.y;
      top.x = pointer.x - grabOffset.x; top.y = pointer.y - grabOffset.y;
    }
    for (var k = 0; k < SETTINGS.iterations; k++) {
      // Strap links: a rope can go slack but never stretch
      for (var j = 0; j < points.length - 2; j++) satisfy(points[j], points[j + 1], segLength, true);
      // The card itself is rigid
      satisfy(top, bottom, cardH, false);
      if (dragging) { top.x = pointer.x - grabOffset.x; top.y = pointer.y - grabOffset.y; }
    }
  }

  function satisfy(a, b, length, ropeOnly) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || .0001;
    if (ropeOnly && dist <= length) return;
    var total = a.w + b.w;
    if (!total) return;
    var diff = (dist - length) / dist / total;
    a.x += dx * diff * a.w; a.y += dy * diff * a.w;
    b.x -= dx * diff * b.w; b.y -= dy * diff * b.w;
  }

  /* Drawing -------------------------------------------------------------- */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var chain = points.slice(0, points.length - 1); // anchor ... card top

    // Strap body
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    tracePath(chain);
    ctx.strokeStyle = SETTINGS.strapEdge; ctx.lineWidth = SETTINGS.strapWidth + 3; ctx.stroke();
    tracePath(chain);
    ctx.strokeStyle = SETTINGS.strapColor; ctx.lineWidth = SETTINGS.strapWidth; ctx.stroke();

    // Printed text along the strap
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.font = '700 9px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    var text = SETTINGS.strapText, charIndex = 0, carry = 0;
    for (var i = 0; i < chain.length - 1; i++) {
      var a = chain[i], b = chain[i + 1];
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
      if (len < .5) continue;
      var angle = Math.atan2(dy, dx);
      var t = carry;
      while (t < len) {
        var ch = text[charIndex % text.length];
        ctx.save();
        ctx.translate(a.x + dx * t / len, a.y + dy * t / len);
        ctx.rotate(angle);
        ctx.fillText(ch, -3, 0);
        ctx.restore();
        t += ch === ' ' ? 5 : 8;
        charIndex++;
      }
      carry = t - len;
    }

    // Card transform
    var top = cardTop(), bottom = cardBottom();
    var angleDeg = Math.atan2(-(bottom.x - top.x), bottom.y - top.y) * 180 / Math.PI;
    var vx = bottom.x - bottom.px;
    tiltY += (Math.max(-35, Math.min(35, vx * 2.2)) - tiltY) * .15;
    card.style.transform =
      'translate(' + (top.x - cardW / 2).toFixed(2) + 'px,' + top.y.toFixed(2) + 'px) ' +
      'perspective(900px) rotate(' + angleDeg.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg)';
  }

  function tracePath(chain) {
    ctx.beginPath();
    ctx.moveTo(chain[0].x, chain[0].y);
    for (var i = 1; i < chain.length - 1; i++) {
      var mx = (chain[i].x + chain[i + 1].x) / 2, my = (chain[i].y + chain[i + 1].y) / 2;
      ctx.quadraticCurveTo(chain[i].x, chain[i].y, mx, my);
    }
    var last = chain[chain.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  /* Loop: runs only while visible and moving ---------------------------- */
  var lastTime = 0, acc = 0, DT = 1 / 120;
  function frame(time) {
    if (!running) return;
    var delta = Math.min(.05, (time - (lastTime || time)) / 1000);
    lastTime = time;
    acc += delta;
    while (acc >= DT) { step(DT); acc -= DT; }
    draw();

    var b = cardBottom();
    var motion = Math.abs(b.x - b.px) + Math.abs(b.y - b.py);
    calmFrames = (!dragging && motion < .02) ? calmFrames + 1 : 0;
    if (calmFrames > 90 || !visible) { running = false; return; }
    requestAnimationFrame(frame);
  }

  function wake() {
    calmFrames = 0;
    if (running || !visible || !started) return;
    running = true; lastTime = 0; acc = 0;
    requestAnimationFrame(frame);
  }

  /* Dragging ------------------------------------------------------------- */
  function localPoint(event) {
    var box = root.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function onDown(event) {
    if (!started) return;
    event.preventDefault();
    card.setPointerCapture(event.pointerId);
    pointer = localPoint(event);
    var top = cardTop();
    grabOffset.x = pointer.x - top.x;
    grabOffset.y = pointer.y - top.y;
    top.w = 0;
    dragging = true;
    card.classList.add('is-dragging');
    wake();
  }
  function onMove(event) { if (dragging) pointer = localPoint(event); }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('is-dragging');
    var top = cardTop();
    top.w = .5;
    // Keep the throw from getting too wild
    var vx = top.x - top.px, vy = top.y - top.py, speed = Math.sqrt(vx * vx + vy * vy), max = 8;
    if (speed > max) { top.px = top.x - vx / speed * max; top.py = top.y - vy / speed * max; }
    wake();
  }

  /* Public ---------------------------------------------------------------- */
  function init() {
    root = document.getElementById('lanyard');
    if (!root) return;
    canvas = root.querySelector('canvas');
    ctx = canvas.getContext('2d');
    card = document.getElementById('id-card');

    measure();
    restPose();
    card.classList.add('is-live');
    if (reduced) { started = true; settle(); }
    else card.style.visibility = 'hidden'; // waits for drop()

    card.addEventListener('pointerdown', onDown);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerup', onUp);
    card.addEventListener('pointercancel', onUp);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { measure(); draw(); wake(); }, 100);
    });

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) wake();
    }).observe(root);

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (started) draw(); });
  }

  // Run the simulation instantly until the card is still (used for reduced motion).
  function settle() {
    for (var i = 0; i < 600; i++) step(DT);
    draw();
  }

  function drop() {
    if (!root || started) return;
    started = true;
    measure();
    dropPose();
    card.style.visibility = '';
    draw();
    wake();
  }

  return { init: init, drop: drop };
})();
