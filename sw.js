/* ═══════════════════════════════════════════════════════════════
   KORE — sw.js  (Service Worker)
   Cache-first para assets estáticos, network-first para API
   ═══════════════════════════════════════════════════════════════ */

const CACHE_NAME    = 'kore-v1';
const API_ORIGIN    = 'https://sistema-gestao-atividades-complementares.onrender.com';

const STATIC_ASSETS = [
    /* ── raiz ── */
    '/',
    '/index.html',

    /* ── admin pages ── */
    '/admin/src/pages/dashboard.html',
    '/admin/src/pages/atividades.html',
    '/admin/src/pages/alunos.html',
    '/admin/src/pages/cursos.html',
    '/admin/src/pages/categorias.html',
    '/admin/src/pages/coordenacao.html',
    '/admin/src/pages/auditoria.html',
    '/admin/src/pages/regras.html',

    /* ── CSS ── */
    '/shared/css/global.css',
    '/admin/src/css/dashboard.css',
    '/admin/src/css/atividades.css',
    '/admin/src/css/alunos.css',
    '/admin/src/css/cursos.css',

    /* ── JS compartilhado ── */
    '/shared/js/api.js',
    '/shared/js/auth.js',
    '/shared/js/components.js',

    /* ── JS admin ── */
    '/admin/src/js/dashboard.js',
    '/admin/src/js/atividades.js',
    '/admin/src/js/alunos.js',
    '/admin/src/js/cursos.js',
    '/admin/src/js/categorias.js',
    '/admin/src/js/coordenacao.js',
    '/admin/src/js/auditoria.js',
    '/admin/src/js/regras.js',

    '/assets/imagens/k-logo1.png',
    '/assets/imagens/logo.png',

    'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap'
];


self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.allSettled(
                STATIC_ASSETS.map(url =>
                    cache.add(url).catch(() => {
                        console.warn('[SW] Não foi possível cachear:', url);
                    })
                )
            );
        }).then(() => self.skipWaiting())
    );
});


self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Removendo cache antigo:', key);
                        return caches.delete(key);
                    })
            )
        ).then(() => self.clients.claim())
    );
});


self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);


    if (request.method !== 'GET') return;
    if (url.protocol === 'chrome-extension:') return;


    if (url.origin === API_ORIGIN) {
        event.respondWith(networkFirst(request));
        return;
    }


    if (url.origin === 'https://fonts.googleapis.com' ||
        url.origin === 'https://fonts.gstatic.com') {
        event.respondWith(cacheFirst(request));
        return;
    }

    event.respondWith(cacheFirst(request));
});


async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline — recurso não disponível no cache.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}


async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ message: 'Sem conexão com o servidor.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}