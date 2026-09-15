const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const clock = $('[data-clock]');
const tickClock = () => {
  if (!clock) return;
  clock.textContent = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
};
tickClock();
setInterval(tickClock, 30000);

const heroVideo = $('.hero__video');
const heroFallback = $('.hero__fallback');
if (heroVideo) {
  heroVideo.addEventListener('error', () => {
    heroVideo.style.display = 'none';
    if (heroFallback) heroFallback.style.display = 'block';
  });
  heroVideo.play().catch(() => {
    heroVideo.style.display = 'none';
    if (heroFallback) heroFallback.style.display = 'block';
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
$$('.reveal').forEach((element) => revealObserver.observe(element));

const modal = $('[data-modal]');
const modalStage = $('[data-modal-stage]');
const modalTitle = $('[data-modal-title]');

const closeModal = () => {
  if (!modal || !modalStage) return;
  modal.hidden = true;
  modalStage.innerHTML = '';
  document.body.style.overflow = '';
};

const openModal = (trigger) => {
  if (!modal || !modalStage) return;
  modalTitle.textContent = trigger.dataset.title || 'Luigi Guerrazzi';

  if (trigger.dataset.drive) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://drive.google.com/file/d/${trigger.dataset.drive}/preview`;
    iframe.title = modalTitle.textContent;
    iframe.allow = 'autoplay';
    iframe.allowFullscreen = true;
    modalStage.append(iframe);
  } else if (trigger.dataset.video) {
    const video = document.createElement('video');
    video.src = trigger.dataset.video;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    modalStage.append(video);
  }

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
};

$$('[data-video], [data-drive]').forEach((trigger) => {
  trigger.addEventListener('click', () => openModal(trigger));
});

$$('[data-modal-close]').forEach((button) => button.addEventListener('click', closeModal));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal && !modal.hidden) closeModal();
});

$$('.faq-item').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    $$('.faq-item').forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

const referenceForm = $('[data-reference-form]');
const formStatus = $('[data-form-status]');
if (referenceForm) {
  referenceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (formStatus) formStatus.textContent = 'Referência visual pronta. Para enviar, use o WhatsApp ou e-mail ao lado.';
  });
}
