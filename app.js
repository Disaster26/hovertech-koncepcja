(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* menu mobilne */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu-mob');
  function zamknij() { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); }
  burger.addEventListener('click', function () {
    var otw = menu.hidden;
    menu.hidden = !otw;
    burger.setAttribute('aria-expanded', String(otw));
    burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { zamknij(); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1100 && !menu.hidden) zamknij(); });

  /* hero: pokaz zdjęć (auto + przesuwanie) */
  var hero = document.querySelector('[data-slider]');
  if (hero) {
    var wszystkie = hero.querySelectorAll('.slide'), wszDots = hero.querySelectorAll('.hero-kropki button');
    var slides, dots;
    function zestaw() {
      var mob = window.innerWidth <= 760;
      slides = [].filter.call(wszystkie, function (s) { return mob || !s.classList.contains('tylko-mob'); });
      dots = [].filter.call(wszDots, function (d) { return mob || !d.classList.contains('tylko-mob'); });
    }
    zestaw();
    var cur = 0, timer = null;
    function laduj(i) {
      var src = slides[i].querySelector('source');
      if (src && src.dataset.srcset) { src.srcset = src.dataset.srcset; delete src.dataset.srcset; }
      var img = slides[i].querySelector('img');
      if (img.dataset.src) { img.srcset = img.dataset.srcset; img.src = img.dataset.src; delete img.dataset.src; }
    }
    function pokaz(i) {
      i = (i + slides.length) % slides.length;
      if (cur >= slides.length) cur = 0;
      laduj(i); laduj((i + 1) % slides.length);
      slides[cur].classList.remove('on'); dots[cur].classList.remove('on');
      cur = i;
      slides[cur].classList.add('on'); dots[cur].classList.add('on');
    }
    function start() { if (reduce) return; stop(); timer = setInterval(function () { pokaz(cur + 1); }, 6000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    [].forEach.call(wszDots, function (d) { d.addEventListener('click', function () { pokaz(dots.indexOf(d)); start(); }); });
    window.addEventListener('resize', function () {
      var przed = slides.length; zestaw();
      if (slides.length !== przed) { [].forEach.call(wszystkie, function (s) { s.classList.remove('on'); }); [].forEach.call(wszDots, function (d) { d.classList.remove('on'); }); cur = 0; slides[0].classList.add('on'); dots[0].classList.add('on'); }
    });
    var sx = null, sy = 0;
    hero.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; });
    hero.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { pokaz(cur + (dx < 0 ? 1 : -1)); start(); }
    });
    hero.addEventListener('pointercancel', function () { sx = null; });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    window.addEventListener('load', function () { laduj(1); start(); });
  }

  /* karuzele w kartach: palec, mysz, strzałki, licznik */
  var strz = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  document.querySelectorAll('[data-car]').forEach(function (car) {
    var tor = car.querySelector('.car-tor');
    var el = tor.children;
    var n = el.length;
    if (n < 2) return;
    tor.setAttribute('tabindex', '0');
    tor.setAttribute('aria-label', 'Zdjęcia - przewiń w bok');
    var nr = document.createElement('span'); nr.className = 'car-nr'; car.appendChild(nr);
    var l = document.createElement('button'); l.type = 'button'; l.className = 'car-btn l'; l.innerHTML = strz; l.setAttribute('aria-label', 'Poprzednie zdjęcie');
    var p = document.createElement('button'); p.type = 'button'; p.className = 'car-btn p'; p.innerHTML = strz.replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7'); p.setAttribute('aria-label', 'Następne zdjęcie');
    car.appendChild(l); car.appendChild(p);
    function krok() { return el[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(el[0]).marginRight) || 0); }
    function idx() { return Math.round(tor.scrollLeft / krok()); }
    function odswiez() {
      var i = idx();
      nr.textContent = (Math.min(i, n - 1) + 1) + ' / ' + n;
      l.disabled = tor.scrollLeft < 4;
      p.disabled = tor.scrollLeft > tor.scrollWidth - tor.clientWidth - 4;
    }
    function idz(d) { tor.scrollBy({ left: d * krok(), behavior: reduce ? 'auto' : 'smooth' }); }
    l.addEventListener('click', function () { idz(-1); });
    p.addEventListener('click', function () { idz(1); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(odswiez); }, { passive: true });
    tor.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); } });
    /* przeciąganie myszą */
    var start = null, sl = 0, ruch = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      start = e.clientX; sl = tor.scrollLeft; ruch = false;
      tor.setPointerCapture(e.pointerId);
    });
    tor.addEventListener('pointermove', function (e) {
      if (start === null) return;
      var dx = e.clientX - start;
      if (Math.abs(dx) > 4) { ruch = true; car.classList.add('ciag'); }
      if (ruch) tor.scrollLeft = sl - dx;
    });
    function koniec() {
      if (start === null) return;
      start = null;
      if (ruch) {
        var k = krok(), cel = Math.round(tor.scrollLeft / k) * k;
        car.classList.remove('ciag');
        tor.scrollTo({ left: cel, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    tor.addEventListener('pointerup', koniec);
    tor.addEventListener('pointercancel', koniec);
    tor.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); ruch = false; } }, true);
    window.addEventListener('resize', odswiez);
    odswiez();
  });

  /* wybór wersji z karty -> formularz */
  var sel = document.getElementById('wersja');
  document.querySelectorAll('[data-wersja]').forEach(function (a) {
    a.addEventListener('click', function () { sel.value = a.dataset.wersja; });
  });

  /* filmy: YouTube dopiero po kliknięciu */
  document.querySelectorAll('.film').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + b.dataset.yt + '?autoplay=1&rel=0';
      f.title = b.getAttribute('aria-label');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      var w = document.createElement('div'); w.className = 'film'; w.appendChild(f);
      b.replaceWith(w);
    });
  });

  /* formularz (wizualizacja - bez wysyłki) */
  var form = document.getElementById('form');
  var info = document.getElementById('form-info');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nazwa = form.nazwa.value.trim(), tel = form.tel.value.trim(), mail = form.email.value.trim();
    if (!nazwa || (!tel && !mail)) {
      info.className = 'form-info blad';
      info.textContent = 'Podaj imię lub nazwę jednostki oraz telefon albo e-mail.';
      return;
    }
    info.className = 'form-info ok';
    info.textContent = 'Dziękujemy. W docelowej stronie zapytanie trafi od razu na biuro@hovertech.com.pl.';
    form.reset();
  });

  /* dolny pasek na telefonie: dopiero po przewinięciu za przycisk w hero */
  var pasek = document.getElementById('mob-pasek');
  var cta = document.getElementById('hero-cta');
  var kontakt = document.getElementById('kontakt');
  if ('IntersectionObserver' in window && pasek && cta) {
    var zaCta = false, wKontakcie = false;
    function ustaw() {
      var w = zaCta && !wKontakcie;
      pasek.classList.toggle('widac', w);
      pasek.setAttribute('aria-hidden', String(!w));
      pasek.querySelectorAll('a').forEach(function (a) { a.tabIndex = w ? 0 : -1; });
    }
    new IntersectionObserver(function (en) { zaCta = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; ustaw(); }).observe(cta);
    new IntersectionObserver(function (en) { wKontakcie = en[0].isIntersecting; ustaw(); }, { threshold: 0.15 }).observe(kontakt);
  }
})();
