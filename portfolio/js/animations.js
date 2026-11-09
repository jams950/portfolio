/* ==========================================================================
   ANIMATIONS (GSAP, ScrollTrigger, Flip and Lenis)
   Preloader bar, hero entrance with the ID card drop, fade-up reveals and
   the animated skill filter. If motion is reduced or a library fails to
   load, everything simply appears.
   ========================================================================== */

window.Motion = (function () {
  var lenis = null;
  var enabled = false;

  function startLanyard() { if (window.Lanyard) window.Lanyard.drop(); }

  function removePreloader() {
    var preloader = document.querySelector('.preloader');
    if (preloader) preloader.remove();
  }

  /* Smooth scrolling --------------------------------------------------- */
  function setupSmoothScroll() {
    if (!window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Preloader, then the hero ------------------------------------------- */
  function playIntro() {
    gsap.set('[data-hero]', { y: 28, autoAlpha: 0 });

    gsap.timeline()
      .to('.preloader__bar span', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' })
      .to('.preloader .logo, .preloader__bar', { y: -12, autoAlpha: 0, duration: .35, ease: 'power2.in' })
      .to('.preloader', { autoAlpha: 0, duration: .45, ease: 'power2.out', onComplete: removePreloader })
      .add(startLanyard, '-=.35')
      .to('[data-hero]', { y: 0, autoAlpha: 1, duration: .8, stagger: .09, ease: 'power3.out', clearProps: 'all' }, '-=.2');
  }

  /* Fade-up reveals ----------------------------------------------------- */
  function setupReveals() {
    // Items start faint rather than invisible, so nothing is ever missing.
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      once: true,
      onEnter: function (items) {
        gsap.fromTo(items, { y: 36, opacity: .15 }, { y: 0, opacity: 1, duration: .85, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity' });
      }
    });

    ScrollTrigger.batch('.skill', {
      start: 'top 92%',
      once: true,
      onEnter: function (items) {
        gsap.fromTo(items, { y: 24, scale: .96, opacity: .15 }, { y: 0, scale: 1, opacity: 1, duration: .6, stagger: .05, ease: 'power3.out', clearProps: 'transform,opacity' });
      }
    });

    // The timeline line draws as you scroll.
    gsap.fromTo('.timeline', { '--line': 0 }, {
      '--line': 1, ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'top 75%', end: 'bottom 60%', scrub: true }
    });
  }

  /* Waveform cover moves like live audio on hover ------------------------ */
  function setupWaves() {
    gsap.utils.toArray('.wave').forEach(function (wave) {
      var bars = wave.children;
      var live = gsap.to(bars, {
        scaleY: function () { return gsap.utils.random(.35, 1.1); },
        duration: .28, ease: 'sine.inOut', stagger: { each: .02, repeat: -1, yoyo: true },
        paused: true
      });
      var host = wave.closest('.project-card') || wave.closest('.cover');
      host.addEventListener('mouseenter', function () { live.play(); });
      host.addEventListener('mouseleave', function () { live.pause(); gsap.to(bars, { scaleY: 1, duration: .4 }); });
    });
  }

  function init() {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.Lanyard) window.Lanyard.init();

    if (reduced || !window.gsap || !window.ScrollTrigger) {
      removePreloader();
      startLanyard();
      return;
    }
    enabled = true;
    gsap.registerPlugin(ScrollTrigger);
    if (window.Flip) gsap.registerPlugin(Flip);

    setupSmoothScroll();
    setupReveals();
    setupWaves();
    playIntro();
  }

  return {
    init: init,

    // Animate skill cards between filter states (falls back to an instant switch).
    filter: function (change) {
      if (!enabled || !window.Flip) { change(); return; }
      var state = Flip.getState('.skill');
      change();
      Flip.from(state, {
        duration: .55, ease: 'power3.inOut', absolute: true, scale: true,
        onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .45, delay: .1 }); },
        onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: .85, duration: .3 }); }
      });
    },

    // Fade a panel in (detail page, certificate preview).
    reveal: function (el, fromScale) {
      if (!enabled) return;
      gsap.fromTo(el, { opacity: 0, y: fromScale ? 0 : 30, scale: fromScale ? .94 : 1 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'power3.out', clearProps: 'all' });
    },

    scrollTo: function (target) {
      // Re-measure first: images that loaded after start make the page taller.
      if (lenis) { lenis.resize(); lenis.scrollTo(target); }
      else document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
    },
    pause: function () { if (lenis) lenis.stop(); },
    resume: function () { if (lenis) lenis.start(); }
  };
})();
