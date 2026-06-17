if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then(reg => console.log('[PWA] SW registrado:', reg.scope))
            .catch(err => console.warn('[PWA] Falha ao registrar SW:', err));
    });
}
