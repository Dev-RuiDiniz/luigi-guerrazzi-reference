(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  const header = document.querySelector('[data-header]');
  const updateHeader = () => header?.classList.toggle('is-solid', window.scrollY > 35);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const clock = document.querySelector('[data-clock]');
  const updateClock = () => {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
  };
  updateClock();
  window.setInterval(updateClock, 1000);
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const closeMenu = () => {
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Abrir menu');
    mobileNav?.classList.remove('is-open');
    mobileNav?.setAttribute('aria-hidden', 'true');
  };
  navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
    mobileNav?.classList.toggle('is-open', !isOpen);
    mobileNav?.setAttribute('aria-hidden', String(isOpen));
  });
  mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -35px' });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  const workSection = document.querySelector('[data-work-section]');
  const workViewport = workSection?.querySelector('[data-work-viewport]');
  const rail = workSection?.querySelector('[data-case-rail]');
  const workCards = rail ? [...rail.querySelectorAll('.case-card')] : [];
  const workReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let workTravel = 0;
  let workFrame = 0;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const getWorkProgress = () => {
    if (!workSection || !workTravel) return 0;
    return clamp(-workSection.getBoundingClientRect().top / workTravel, 0, 1);
  };
  const paintWork = () => {
    workFrame = 0;
    if (!workSection || !rail) return;
    const progress = getWorkProgress();
    rail.style.transform = workReduceMotion.matches ? 'none' : `translate3d(${-progress * workTravel}px, 0, 0)`;
    workSection.style.setProperty('--work-progress', `${progress * 100}%`);
    const activeIndex = Math.round(progress * Math.max(0, workCards.length - 1));
    workCards.forEach((card, index) => card.toggleAttribute('data-active', index === activeIndex));
  };
  const scheduleWork = () => {
    if (!workFrame) workFrame = window.requestAnimationFrame(paintWork);
  };
  const measureWork = () => {
    if (!workSection || !workViewport || !rail) return;
    const previousTransform = rail.style.transform;
    rail.style.transform = 'none';
    workTravel = Math.max(0, rail.getBoundingClientRect().width - workViewport.getBoundingClientRect().width);
    rail.style.transform = previousTransform;
    workSection.style.setProperty('--work-travel', `${workTravel}px`);
    workSection.style.height = `${window.innerHeight + workTravel}px`;
    paintWork();
  };
  const jumpWork = (direction) => {
    if (!workSection || !workTravel || workReduceMotion.matches) return;
    const progress = getWorkProgress();
    const step = 1 / Math.max(1, workCards.length - 1);
    const nextProgress = clamp(progress + direction * step, 0, 1);
    const sectionTop = window.scrollY - workSection.getBoundingClientRect().top;
    window.scrollTo({ top: sectionTop + nextProgress * workTravel, behavior: 'smooth' });
  };
  document.querySelector('[data-rail-next]')?.addEventListener('click', () => jumpWork(1));
  document.querySelector('[data-rail-prev]')?.addEventListener('click', () => jumpWork(-1));
  rail?.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    jumpWork(event.key === 'ArrowRight' ? 1 : -1);
  });
  measureWork();
  window.addEventListener('load', measureWork, { once: true });
  window.addEventListener('resize', measureWork);
  window.addEventListener('scroll', scheduleWork, { passive: true });
  workReduceMotion.addEventListener?.('change', measureWork);

  const slideshow = document.querySelector('[data-slideshow]');
  const slides = slideshow ? [...slideshow.querySelectorAll('.slideshow-slide')] : [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let slideIndex = 0;
  let slideshowTimer = null;
  const showSlide = (nextIndex) => {
    if (slides.length < 2) return;
    slides[slideIndex]?.classList.remove('is-active');
    slideIndex = (nextIndex + slides.length) % slides.length;
    slides[slideIndex]?.classList.add('is-active');
  };
  const stopSlideshow = () => {
    if (!slideshowTimer) return;
    window.clearInterval(slideshowTimer);
    slideshowTimer = null;
  };
  const startSlideshow = () => {
    stopSlideshow();
    if (slides.length < 2 || reduceMotion.matches || document.hidden) return;
    slideshowTimer = window.setInterval(() => showSlide(slideIndex + 1), 5600);
  };
  startSlideshow();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopSlideshow();
    else startSlideshow();
  });
  reduceMotion.addEventListener?.('change', startSlideshow);

  const coverVideos = document.querySelectorAll('[data-cover-src] .media-cover');
  const primeCover = (video) => {
    if (video.dataset.coverLoaded) return;
    video.dataset.coverLoaded = 'true';
    video.src = video.closest('[data-cover-src]')?.dataset.coverSrc || '';
    video.preload = 'metadata';
    video.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(video.duration) && video.duration > 0.8) video.currentTime = Math.min(0.8, video.duration / 2);
    }, { once: true });
    video.addEventListener('seeked', () => video.pause(), { once: true });
    video.load();
  };
  if ('IntersectionObserver' in window) {
    const coverObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          primeCover(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '300px 0px' });
    coverVideos.forEach((video) => coverObserver.observe(video));
  } else {
    coverVideos.forEach(primeCover);
  }
  const priorityCovers = rail ? [...rail.querySelectorAll('.media-cover')].slice(0, 4) : [];
  if ('IntersectionObserver' in window && workSection && priorityCovers.length) {
    const priorityObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      priorityCovers.forEach(primeCover);
      observer.disconnect();
    }, { rootMargin: '1000px 0px' });
    priorityObserver.observe(workSection);
  } else {
    priorityCovers.forEach(primeCover);
  }

  const timelineItems = document.querySelectorAll('.timeline-item');
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        timelineItems.forEach((item) => item.classList.toggle('is-active', item === entry.target));
      }
    });
  }, { threshold: .7 });
  timelineItems.forEach((item) => timelineObserver.observe(item));

  const modal = document.querySelector('[data-modal]');
  const stage = modal?.querySelector('[data-modal-stage]');
  const modalTitle = modal?.querySelector('#modal-title');
  let lastTrigger = null;
  const closeModal = () => {
    if (!modal?.open) return;
    const media = stage?.querySelector('video');
    if (media) media.pause();
    modal.close();
    if (stage) stage.replaceChildren();
    lastTrigger?.focus();
  };
  document.querySelectorAll('[data-video]').forEach((trigger) => trigger.addEventListener('click', () => {
    if (!modal || !stage) return;
    lastTrigger = trigger;
    if (modalTitle) modalTitle.textContent = trigger.dataset.title || 'Projeto em movimento';
    const video = document.createElement('video');
    video.src = trigger.dataset.video;
    video.preload = 'metadata';
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('aria-label', trigger.dataset.title || 'Vídeo do projeto');
    stage.replaceChildren(video);
    modal.showModal();
  }));
  modal?.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  modal?.addEventListener('cancel', (event) => { event.preventDefault(); closeModal(); });
  modal?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusables = modal.querySelectorAll('button, video, [href], input, textarea, select');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const form = document.querySelector('[data-contact-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    const status = form.querySelector('.form-status');
    if (!name || !email || !message) return;
    const text = `Olá, Luigi! Sou ${name}. Meu e-mail é ${email}.\n\n${message}`;
    window.open(`https://wa.me/5511994033005?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    if (status) status.textContent = 'Abrindo o WhatsApp para continuar a conversa.';
    form.reset();
  });
})();
