// Quantum Particle Lattice & Wavefunction Interference Engine
(function() {
  var canvas, ctx, animId;
  var particles = [];
  var mouse = { x: -1000, y: -1000, radius: 140 };
  var particleCount = 48;

  function initCanvas() {
    canvas = document.getElementById('quantum-bg-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    createParticles();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    animate();
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }

  function createParticles() {
    particles = [];
    var isDark = document.documentElement.classList.contains('dark');
    for (var i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 1.2,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.02 + 0.01,
        // Color variant: 0 = cyan, 1 = purple, 2 = blue
        type: Math.floor(Math.random() * 3)
      });
    }
  }

  function animate() {
    if (!ctx) return;
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    var isDark = document.documentElement.classList.contains('dark');
    var maxDistance = 125;

    // Update and draw particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.phase += p.phaseSpeed;

      // Wrap edges
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      // Mouse gentle repulsion (wave collapse effect)
      var dx = mouse.x - p.x;
      var dy = mouse.y - p.y;
      var distMouse = Math.sqrt(dx * dx + dy * dy);
      if (distMouse < mouse.radius && distMouse > 0) {
        var force = (mouse.radius - distMouse) / mouse.radius;
        p.x -= (dx / distMouse) * force * 1.5;
        p.y -= (dy / distMouse) * force * 1.5;
      }

      // Fluctuating brightness
      var pulse = 0.5 + 0.5 * Math.sin(p.phase);
      var alpha = (isDark ? 0.35 : 0.18) * pulse;

      var color;
      if (p.type === 0) {
        color = isDark ? 'rgba(6, 182, 212, ' + alpha + ')' : 'rgba(2, 132, 199, ' + (alpha * 0.7) + ')';
      } else if (p.type === 1) {
        color = isDark ? 'rgba(168, 85, 247, ' + alpha + ')' : 'rgba(147, 51, 234, ' + (alpha * 0.7) + ')';
      } else {
        color = isDark ? 'rgba(59, 130, 246, ' + alpha + ')' : 'rgba(37, 99, 235, ' + (alpha * 0.7) + ')';
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Connect entangled particle pairs
      for (var j = i + 1; j < particles.length; j++) {
        var p2 = particles[j];
        var dist = Math.sqrt((p.x - p2.x) * (p.x - p2.x) + (p.y - p2.y) * (p.y - p2.y));
        if (dist < maxDistance) {
          var lineAlpha = (1 - dist / maxDistance) * (isDark ? 0.18 : 0.08);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, ' + lineAlpha + ')' : 'rgba(14, 165, 233, ' + lineAlpha + ')';
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(animate);
  }

  document.addEventListener('DOMContentLoaded', initCanvas);
})();
