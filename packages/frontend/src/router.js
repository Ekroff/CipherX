/* =============================================
   CipherX SPA Router (Hash-based)
   ============================================= */

const routes = {};
let currentCleanup = null;

export function registerRoute(path, handler) {
    routes[path] = handler;
}

export function navigate(path) {
    window.location.hash = path;
}

export function getCurrentRoute() {
    return window.location.hash.slice(1) || '/';
}

export function initRouter(appElement) {
    async function handleRoute() {
        const hash = window.location.hash.slice(1) || '/';

        // If the hash is a section anchor (doesn't start with '/'),
        // scroll to the element instead of doing a route change
        if (hash && !hash.startsWith('/')) {
            const target = document.getElementById(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            // If element not found, fall through to route handling
        }

        const path = hash;

        // cleanup previous page
        if (currentCleanup && typeof currentCleanup === 'function') {
            currentCleanup();
            currentCleanup = null;
        }

        // find matching route
        let handler = routes[path];

        // try prefix matching for dynamic routes
        if (!handler) {
            const routeKeys = Object.keys(routes).sort((a, b) => b.length - a.length);
            for (const key of routeKeys) {
                if (path.startsWith(key.replace(':id', '')) && key.includes(':id')) {
                    handler = routes[key];
                    break;
                }
            }
        }

        if (handler) {
            const result = await handler(appElement, path);
            if (typeof result === 'function') {
                currentCleanup = result;
            }
        } else {
            // Default to landing
            const landingHandler = routes['/'];
            if (landingHandler) {
                const result = await landingHandler(appElement, path);
                if (typeof result === 'function') {
                    currentCleanup = result;
                }
            }
        }

        // scroll to top on route change
        window.scrollTo(0, 0);
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}
