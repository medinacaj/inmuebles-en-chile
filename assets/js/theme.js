/* Una misma preferencia de apariencia para todas las páginas del portal. */
(() => {
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let saved = null;
  let current = 'light';
  const read = () => {
    try {
      const value = localStorage.getItem('iech_theme');
      return value === 'dark' || value === 'light' ? value : null;
    } catch { return null; }
  };
  const apply = () => {
    current = saved || (system.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = current;
    document.body?.classList.toggle('dark', current === 'dark');
    const control = document.getElementById('theme');
    control?.setAttribute('aria-pressed', String(current === 'dark'));
    control?.setAttribute('aria-label', current === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', current === 'dark' ? '#211c1c' : '#fff9f5');
  };
  saved = read();
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.getElementById('theme')?.addEventListener('click', () => {
      saved = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('iech_theme', saved); } catch { /* Preferencia para esta página. */ }
      apply();
    });
  });
  system.addEventListener('change', () => { if (!saved) apply(); });
  window.addEventListener('storage', event => {
    if (event.key === 'iech_theme' || event.key === null) { saved = read(); apply(); }
  });
})();
