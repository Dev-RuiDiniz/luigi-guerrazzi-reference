(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
  root.classList.add('is-loading');

  const siteLoader = document.querySelector('[data-site-loader]');
  const loaderProgress = siteLoader?.querySelector('[data-loader-progress]');
  const loaderStatus = siteLoader?.querySelector('[data-loader-status]');
  const loaderStartedAt = performance.now();
  let loaderReleased = false;
  const releaseLoader = () => {
    if (loaderReleased) return;
    loaderReleased = true;
    const wait = Math.max(0, 520 - (performance.now() - loaderStartedAt));
    window.setTimeout(() => {
      loaderProgress?.classList.add('is-complete');
      if (loaderStatus) loaderStatus.textContent = 'sistema pronto';
      root.classList.remove('is-loading');
      root.classList.add('is-ready');
      siteLoader?.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => siteLoader?.remove(), 720);
    }, wait);
  };
  if (document.readyState === 'complete') releaseLoader();
  else window.addEventListener('load', releaseLoader, { once: true });
  window.setTimeout(releaseLoader, 1800);

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

  const heroVideo = document.querySelector('[data-hero-video]');
  const keepHeroPlaying = () => {
    if (!heroVideo) return;
    heroVideo.loop = true;
    heroVideo.muted = true;
    const playPromise = heroVideo.play();
    playPromise?.catch(() => {});
  };
  if (heroVideo) {
    heroVideo.setAttribute('loop', '');
    heroVideo.addEventListener('loadeddata', keepHeroPlaying, { once: true });
    heroVideo.addEventListener('canplay', keepHeroPlaying);
    heroVideo.addEventListener('pause', () => {
      if (document.visibilityState === 'visible') keepHeroPlaying();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') keepHeroPlaying();
    });
    keepHeroPlaying();
  }

  const signalSection = document.querySelector('[data-signal-section]');
  const signalVisual = signalSection?.querySelector('[data-signal-visual]');
  const signalSteps = signalSection ? [...signalSection.querySelectorAll('[data-signal-step]')] : [];
  const signalNote = signalSection?.querySelector('[data-signal-note]');
  const signalLive = signalSection?.querySelector('[data-signal-live]');
  const signalProgress = signalSection?.querySelector('[data-signal-progress]');
  const signalProgressLabel = signalSection?.querySelector('[data-signal-progress-label]');
  const signalDot = signalSection?.querySelector('[data-signal-dot]');
  const signalWaveLines = signalSection ? [...signalSection.querySelectorAll('.signal-wave-line')] : [];
  const signalMobile = window.matchMedia('(max-width: 850px)');
  const signalReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const signalStages = [
    {
      label: 'ESCUTAR',
      note: 'Uma boa entrega não começa no software. Começa na escuta: entender a intenção, reconhecer o público e construir a forma certa de dizer.',
      dot: [108, 98],
    },
    {
      label: 'ENCONTRAR',
      note: 'É aqui que a ideia encontra seu ritmo: referências, escolhas e cortes que dão forma ao que precisa ser sentido.',
      dot: [326, 115],
    },
    {
      label: 'CONSTRUIR',
      note: 'Imagem, som e movimento entram em cena para transformar intenção em uma peça clara, viva e pronta para circular.',
      dot: [548, 62],
    },
  ];
  let signalFrame = 0;
  let signalStage = 0;
  const setSignalStage = (nextStage) => {
    if (!signalStages.length) return;
    const next = Math.min(Math.max(Number(nextStage) || 0, 0), signalStages.length - 1);
    signalStage = next;
    const stage = signalStages[next];
    signalSteps.forEach((step, index) => {
      const isActive = index === next;
      step.classList.toggle('is-active', isActive);
      step.setAttribute('aria-pressed', String(isActive));
    });
    signalNote && (signalNote.textContent = stage.note);
    signalLive && (signalLive.textContent = `0${next + 1} — ${stage.label}`);
    signalProgressLabel && (signalProgressLabel.textContent = `0${next + 1} — 03`);
    signalProgress && (signalProgress.style.width = `${(next / Math.max(1, signalStages.length - 1)) * 100}%`);
    signalWaveLines.forEach((line, index) => line.classList.toggle('is-active', index === next));
    signalDot?.setAttribute('cx', String(stage.dot[0]));
    signalDot?.setAttribute('cy', String(stage.dot[1]));
    signalVisual?.setAttribute('data-signal-stage', String(next));
  };
  const paintSignal = () => {
    signalFrame = 0;
    if (!signalSection || !signalSteps.length || signalMobile.matches || signalReduceMotion.matches) return;
    const travel = Math.max(1, signalSection.offsetHeight - window.innerHeight);
    const progress = Math.min(Math.max(-signalSection.getBoundingClientRect().top / travel, 0), 1);
    setSignalStage(Math.round(progress * (signalStages.length - 1)));
  };
  const scheduleSignal = () => {
    if (!signalFrame) signalFrame = window.requestAnimationFrame(paintSignal);
  };
  if (signalSection && signalSteps.length) {
    setSignalStage(0);
    signalSteps.forEach((step) => step.addEventListener('click', () => {
      const targetStage = Number(step.dataset.signalStep);
      setSignalStage(targetStage);
      if (signalMobile.matches || signalReduceMotion.matches) return;
      const travel = Math.max(1, signalSection.offsetHeight - window.innerHeight);
      const targetTop = signalSection.offsetTop + (travel * targetStage) / Math.max(1, signalStages.length - 1);
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }));
    signalVisual?.addEventListener('pointermove', (event) => {
      const bounds = signalVisual.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
      signalVisual.style.setProperty('--signal-pointer-x', `${Math.min(Math.max(x, 0), 100)}%`);
      signalVisual.style.setProperty('--signal-pointer-y', `${Math.min(Math.max(y, 0), 100)}%`);
    });
    signalVisual?.addEventListener('pointerleave', () => {
      signalVisual.style.removeProperty('--signal-pointer-x');
      signalVisual.style.removeProperty('--signal-pointer-y');
    });
    window.addEventListener('scroll', scheduleSignal, { passive: true });
    window.addEventListener('resize', scheduleSignal);
    scheduleSignal();
  }

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

  const servicesSection = document.querySelector('[data-services-section]');
  const servicesSticky = servicesSection?.querySelector('[data-services-sticky]');
  const servicesCards = servicesSection ? [...servicesSection.querySelectorAll('[data-service-card]')] : [];
  const servicesCurrent = servicesSection?.querySelector('[data-services-current]');
  const servicesProgress = servicesSection?.querySelector('[data-services-progress]');
  const servicesReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const servicesMobile = window.matchMedia('(max-width: 850px)');
  let servicesTravel = 0;
  let servicesFrame = 0;
  const clampServices = (value, min, max) => Math.min(Math.max(value, min), max);
  const getServicesProgress = () => {
    if (!servicesSection || !servicesTravel) return 0;
    return clampServices(-servicesSection.getBoundingClientRect().top / servicesTravel, 0, 1);
  };
  const paintServices = () => {
    servicesFrame = 0;
    if (!servicesSection || !servicesCards.length) return;

    if (servicesMobile.matches || servicesReduceMotion.matches) {
      servicesCards.forEach((card) => {
        card.style.removeProperty('opacity');
        card.style.removeProperty('visibility');
        card.style.removeProperty('transform');
        card.style.removeProperty('z-index');
        card.style.removeProperty('pointer-events');
        card.dataset.serviceState = 'static';
        card.setAttribute('aria-hidden', 'false');
      });
      servicesCurrent && (servicesCurrent.textContent = '01');
      servicesProgress && (servicesProgress.style.width = '0%');
      return;
    }

    const progress = getServicesProgress();
    const position = progress * Math.max(0, servicesCards.length - 1);
    const activeIndex = Math.round(position);
    servicesCards.forEach((card, index) => {
      const distance = index - position;
      const absoluteDistance = Math.abs(distance);
      const visible = absoluteDistance < 1.25;
      const fade = visible ? 1 - Math.min(absoluteDistance, 1) * 0.76 : 0;
      const scale = 1 - Math.min(absoluteDistance, 1) * 0.055;
      card.style.opacity = String(Math.max(0, fade));
      card.style.visibility = visible ? 'visible' : 'hidden';
      card.style.transform = `translate3d(${distance * 4}%, ${distance * 48}px, 0) scale(${scale})`;
      card.style.zIndex = String(100 - Math.round(absoluteDistance * 10));
      card.style.pointerEvents = index === activeIndex ? 'auto' : 'none';
      card.dataset.serviceState = index === activeIndex ? 'active' : index < activeIndex ? 'past' : 'next';
      card.setAttribute('aria-hidden', String(index !== activeIndex));
    });
    servicesSection.style.setProperty('--services-progress', `${progress * 100}%`);
    servicesCurrent && (servicesCurrent.textContent = String(activeIndex + 1).padStart(2, '0'));
    servicesProgress && (servicesProgress.style.width = `${progress * 100}%`);
  };
  const scheduleServices = () => {
    if (!servicesFrame) servicesFrame = window.requestAnimationFrame(paintServices);
  };
  const measureServices = () => {
    if (!servicesSection || !servicesSticky || !servicesCards.length) return;
    if (servicesMobile.matches || servicesReduceMotion.matches) {
      servicesTravel = 0;
      servicesSection.style.removeProperty('height');
      paintServices();
      return;
    }
    servicesSection.style.height = `${window.innerHeight * servicesCards.length}px`;
    servicesTravel = Math.max(1, servicesSection.offsetHeight - window.innerHeight);
    paintServices();
  };
  measureServices();
  window.addEventListener('load', measureServices, { once: true });
  window.addEventListener('resize', measureServices);
  window.addEventListener('scroll', scheduleServices, { passive: true });
  servicesMobile.addEventListener?.('change', measureServices);
  servicesReduceMotion.addEventListener?.('change', measureServices);

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

  document.querySelectorAll('[data-poster] .media-cover').forEach((video) => {
    const poster = video.closest('[data-poster]')?.dataset.poster;
    if (poster) video.poster = poster;
  });
  const coverVideos = document.querySelectorAll('[data-cover-src] .media-cover:not([poster])');
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
  const priorityCovers = rail ? [...rail.querySelectorAll('.media-cover:not([poster])')].slice(0, 2) : [];
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

  const inlineVideoTriggers = document.querySelectorAll('[data-video]');
  const activateInlineVideo = (trigger, video) => {
    if (!trigger.dataset.video || trigger.classList.contains('is-playing')) return;
    trigger.classList.add('is-playing');
    trigger.setAttribute('aria-label', `Reproduzindo ${trigger.dataset.title || 'vídeo do projeto'}`);
    video.controls = true;
    video.autoplay = true;
    video.muted = false;
    video.loop = false;
    video.preload = 'auto';
    video.removeAttribute('aria-hidden');
    video.setAttribute('aria-label', trigger.dataset.title || 'Vídeo do projeto');
    video.src = trigger.dataset.video;

    const startPlayback = () => {
      const playback = video.play();
      if (playback?.catch) playback.catch(() => video.focus());
    };
    video.addEventListener('loadeddata', startPlayback, { once: true });
    video.load();
    if (video.readyState >= 2) startPlayback();
  };
  inlineVideoTriggers.forEach((trigger) => {
    const video = trigger.querySelector('video.media-cover');
    if (!video) return;
    trigger.addEventListener('click', (event) => {
      if (trigger.classList.contains('is-playing')) return;
      event.preventDefault();
      activateInlineVideo(trigger, video);
    });
    video.addEventListener('click', (event) => event.stopPropagation());
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
