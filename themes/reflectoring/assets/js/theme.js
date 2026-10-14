// reflectoring theme: colour theme, menu, copy buttons, the current section in the contents, cookie notice.
const root = document.documentElement;

const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
document.querySelector('.theme-toggle')?.addEventListener('click', () => {
  root.dataset.theme = isDark() ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { /* private mode: not remembered */ }
});

const menu = document.querySelector('.menu-toggle');
menu?.addEventListener('click', () => menu.setAttribute('aria-expanded', document.body.classList.toggle('menu-open')));

document.querySelectorAll('.code .copy').forEach((button) => button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(button.closest('.code').querySelector('code').innerText);
    button.textContent = 'Copied';
  } catch (e) {
    button.textContent = 'Press Ctrl+C';
  }
  setTimeout(() => { button.textContent = 'Copy'; }, 1500);
}));

// Mark the section being read in the table of contents.
const links = [...document.querySelectorAll('.toc-list a')];
const headings = [...document.querySelectorAll('.prose h2[id], .prose h3[id]')];
if (links.length && headings.length) {
  const update = () => {
    let current = null;
    for (const h of headings) {
      if (h.getBoundingClientRect().top < 140) current = h; else break;
    }
    links.forEach((a) => a.toggleAttribute('aria-current', !!current && decodeURIComponent(a.hash) === '#' + current.id));
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

// Cookie notice: shown until accepted, then hidden for the configured number of days.
const cookie = document.querySelector('.cookie');
if (cookie && !document.cookie.split('; ').some((c) => c.startsWith('cookie-box='))) {
  cookie.hidden = false;
  cookie.querySelector('.cookie-accept').addEventListener('click', () => {
    document.cookie = `cookie-box=true; max-age=${Number(cookie.dataset.days) * 86400}; path=/; SameSite=Lax`;
    cookie.hidden = true;
  });
}
