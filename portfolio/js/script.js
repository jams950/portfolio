/* ==========================================================================
   SITE BEHAVIOR
   Links from config.js, navigation, skill filter, project detail pages,
   certificate preview, cover art and the contact form.
   ========================================================================== */

(function () {
  var config = window.SITE_CONFIG || {};

  /* Read a value like "social.github" from config.js */
  function getConfig(path) {
    return path.split('.').reduce(function (value, key) {
      return value ? value[key] : '';
    }, config) || '';
  }

  /* Show a link's address without "https://www." */
  function shortLabel(path, value) {
    if (path === 'email') return value;
    return value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  }

  /* Links --------------------------------------------------------------
     A filled-in value becomes a real link. An empty one stays a marked
     placeholder and never points anywhere. */
  function setupConfigLinks() {
    document.querySelectorAll('[data-config]').forEach(function (link) {
      var path = link.getAttribute('data-config');
      var value = getConfig(path);
      var name = link.getAttribute('data-name');
      var showsText = link.hasAttribute('data-text');

      if (value) {
        var isEmail = path === 'email';
        link.href = isEmail ? 'mailto:' + value : value;
        if (link.hasAttribute('data-download')) link.setAttribute('download', '');
        else if (!isEmail) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        if (!showsText) link.setAttribute('aria-label', name);
        if (link.hasAttribute('data-card')) link.querySelector('.contact-card__value').textContent = shortLabel(path, value);
        return;
      }

      link.classList.add('is-empty');
      link.setAttribute('aria-disabled', 'true');
      link.title = 'Add this link in js/config.js';
      if (!showsText) link.setAttribute('aria-label', name + ' link not added yet');
      link.addEventListener('click', function (event) { event.preventDefault(); });
    });
  }

  /* Scroll locking for menus and overlays ------------------------------ */
  var locks = 0;
  function lockScroll(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    document.documentElement.style.overflow = locks ? 'hidden' : '';
    if (locks) window.Motion.pause(); else window.Motion.resume();
  }

  /* Navigation --------------------------------------------------------- */
  function setupNavigation() {
    var nav = document.getElementById('nav');
    var menu = document.getElementById('mobile-menu');
    var menuButton = document.getElementById('menu-button');
    var allNavLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a, .menu a'));

    function setMenu(open) {
      if (open === !menu.hidden) return;
      menu.hidden = !open;
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-scrolled', open || window.scrollY > 20);
      lockScroll(open);
    }

    menuButton.addEventListener('click', function () { setMenu(menu.hidden); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !menu.hidden) { setMenu(false); menuButton.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) setMenu(false);
    });

    // Every in-page link uses the same smooth scroll.
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        var target = link.getAttribute('href');
        if (target.length < 2 || !document.querySelector(target)) return;
        event.preventDefault();
        setMenu(false);
        window.Motion.scrollTo(target);
      });
    });

    // Highlight the section in the middle of the screen.
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        allNavLinks.forEach(function (link) {
          var isCurrent = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('is-active', isCurrent);
          if (isCurrent) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (section) { observer.observe(section); });

    function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 20 || !menu.hidden); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Skill filter ---------------------------------------------------------- */
  function setupSkillFilter() {
    var buttons = document.querySelectorAll('.filter');
    var skills = document.querySelectorAll('.skill');

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var category = button.getAttribute('data-filter');
        buttons.forEach(function (b) {
          var active = b === button;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        window.Motion.filter(function () {
          skills.forEach(function (skill) {
            skill.hidden = category !== 'all' && skill.getAttribute('data-category') !== category;
          });
        });
      });
    });
  }

  /* Project detail pages -------------------------------------------------- */
  function setupProjectDetails() {
    var overlay = document.getElementById('detail');
    var opener = null;
    var openedWithHistory = false;

    function open(id, button) {
      var page = document.getElementById(id);
      if (!page) return;
      opener = button || null;
      overlay.querySelectorAll('.detail__page').forEach(function (p) { p.hidden = p !== page; });
      overlay.hidden = false;
      overlay.scrollTop = 0;
      lockScroll(true);
      window.Motion.reveal(page);
      overlay.querySelector('[data-close-detail]').focus({ preventScroll: true });
      try { history.pushState({ detail: id }, '', '#' + id); openedWithHistory = true; } catch (e) { openedWithHistory = false; }
    }

    function close(fromHistory) {
      if (overlay.hidden) return;
      overlay.hidden = true;
      lockScroll(false);
      if (opener) opener.focus({ preventScroll: true });
      if (!fromHistory && openedWithHistory) { openedWithHistory = false; history.back(); }
    }

    document.querySelectorAll('[data-open]').forEach(function (button) {
      button.addEventListener('click', function () { open(button.getAttribute('data-open'), button); });
    });
    overlay.querySelector('[data-close-detail]').addEventListener('click', function () { close(false); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !overlay.hidden && document.getElementById('lightbox').hidden) close(false);
    });
    // The phone's back button closes the detail page.
    window.addEventListener('popstate', function () { openedWithHistory = false; close(true); });

    // A shared link like yoursite.com/#detail-readsync opens that project.
    if (/^#detail-/.test(location.hash)) {
      var id = location.hash.slice(1);
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      open(id);
    }
  }

  /* Certificate preview -------------------------------------------------- */
  function setupLightbox() {
    var box = document.getElementById('lightbox');
    var img = box.querySelector('.lightbox__img');
    var opener = null;

    function close() {
      if (box.hidden) return;
      box.hidden = true;
      lockScroll(false);
      if (opener) opener.focus({ preventScroll: true });
    }

    document.querySelectorAll('[data-cert]').forEach(function (cert) {
      cert.addEventListener('click', function () {
        opener = cert;
        var thumb = cert.querySelector('img');
        img.src = thumb.src;
        img.alt = thumb.alt;
        box.querySelector('.lightbox__year').textContent = cert.querySelector('.cert__year').textContent.trim();
        box.querySelector('.lightbox__title').textContent = cert.querySelector('.cert__title').textContent;
        box.querySelector('.lightbox__issuer').textContent = cert.querySelector('.cert__issuer').textContent;
        box.hidden = false;
        lockScroll(true);
        window.Motion.reveal(box.querySelector('.lightbox__box'), true);
        box.querySelector('[data-close-lightbox]').focus({ preventScroll: true });
      });
    });

    box.querySelector('[data-close-lightbox]').addEventListener('click', close);
    box.addEventListener('click', function (event) { if (event.target === box) close(); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
      // Keep keyboard focus inside the preview
      if (event.key === 'Tab' && !box.hidden) { event.preventDefault(); box.querySelector('[data-close-lightbox]').focus(); }
    });
  }

  /* ReadSync cover: a voice waveform ------------------------------------ */
  function buildWaveforms() {
    document.querySelectorAll('[data-wave]').forEach(function (cover) {
      var wave = document.createElement('div');
      wave.className = 'wave';
      wave.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 56; i++) {
        var bar = document.createElement('span');
        var level = Math.abs(Math.sin(i * .55) * .55 + Math.sin(i * 1.7 + 1) * .3 + Math.sin(i * .13) * .25);
        bar.style.height = Math.max(5, Math.min(100, level * 100)) + '%';
        wave.appendChild(bar);
      }
      cover.prepend(wave);
    });
  }

  /* Contact form ---------------------------------------------------------
     Sends through Web3Forms because this site has no server of its own.
     The form only reports success after the service confirms it. */
  function setupContactForm() {
    var form = document.getElementById('contact-form');
    var status = document.getElementById('form-status');
    var button = form.querySelector('button[type="submit"]');
    var buttonLabel = button.querySelector('.btn__label');

    var rules = {
      name: function (value) { return value ? '' : 'Enter your name.'; },
      email: function (value) {
        if (!value) return 'Enter your email address.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address, like name@example.com.';
      },
      message: function (value) {
        if (!value) return 'Enter a message.';
        return value.length < 10 ? 'Add a little more detail (at least 10 characters).' : '';
      }
    };

    function checkField(name) {
      var field = form.elements[name];
      var error = rules[name](field.value.trim());
      var errorBox = document.getElementById(field.id + '-error');
      field.closest('.field').classList.toggle('has-error', !!error);
      field.setAttribute('aria-invalid', String(!!error));
      if (error) field.setAttribute('aria-describedby', errorBox.id);
      else field.removeAttribute('aria-describedby');
      errorBox.textContent = error;
      return !error;
    }

    function setStatus(type, message) {
      status.className = 'form__status' + (type ? ' is-' + type : '');
      status.textContent = message;
    }

    Object.keys(rules).forEach(function (name) {
      form.elements[name].addEventListener('blur', function () {
        if (form.elements[name].value) checkField(name);
      });
      form.elements[name].addEventListener('input', function () {
        if (form.elements[name].closest('.field').classList.contains('has-error')) checkField(name);
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      setStatus('', '');

      var names = Object.keys(rules);
      var results = names.map(checkField);
      var firstBad = results.indexOf(false);
      if (firstBad !== -1) { form.elements[names[firstBad]].focus(); return; }

      if (form.elements.botcheck.value) return;

      if (!config.formAccessKey) {
        setStatus('error', "Message not sent. This form isn't connected yet. Add the Web3Forms key in js/config.js.");
        return;
      }

      button.disabled = true;
      buttonLabel.textContent = 'Sending...';

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: config.formAccessKey,
          subject: 'New message from your portfolio',
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          message: form.elements.message.value.trim()
        })
      })
        .then(function (response) {
          return response.json().then(function (data) {
            if (!response.ok || !data.success) throw new Error(data.message || 'Service error');
          });
        })
        .then(function () {
          form.reset();
          setStatus('success', 'Message sent. Thank you for reaching out.');
        })
        .catch(function () {
          var email = config.email ? ' or email ' + config.email : '';
          setStatus('error', 'Message not sent. Check your connection and try again' + email + '.');
        })
        .finally(function () {
          button.disabled = false;
          buttonLabel.textContent = 'Send Message';
        });
    });
  }

  /* Start --------------------------------------------------------------- */
  document.getElementById('year').textContent = new Date().getFullYear();
  setupConfigLinks();
  buildWaveforms();
  if (window.lucide) window.lucide.createIcons();
  setupNavigation();
  setupSkillFilter();
  setupContactForm();
  window.Motion.init();
  setupProjectDetails();
  setupLightbox();
})();
