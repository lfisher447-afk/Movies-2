// Advanced Ad Blocker & DOM Sanitizer Module

const adBlocker = {
    // Network-level blocked domains
    blockedDomains:[
        'popads.net', 'adsterra.com', 'exoclick.com', 'propellerads.com',
        'bet365.com', '1xbet.com', 'adcash.com', 'onclickalgo.com',
        'doubleclick.net', 'google-analytics.com', 'track.com'
    ],

    // Client-side payload injected into the streaming iframe
    getInjectionScript: function () {
        return `
        <script>
            (function() {
                console.log('%c[Omega AdBlocker] Initiated inside Sandbox', 'color: #E50914; font-weight: bold; font-size: 14px;');

                // 1. NEUTRALIZE POPUPS & REDIRECTS
                window.open = function(url, name, features) {
                    console.warn('[Omega AdBlocker] Blocked malicious popup attempt:', url);
                    return null;
                };
                
                // Block location changes from scripts
                Object.defineProperty(window, 'onbeforeunload', { value: null, writable: false });

                // 2. INTERCEPT AND DESTROY MALICIOUS NETWORK REQUESTS
                const originalFetch = window.fetch;
                window.fetch = async function() {
                    const url = arguments[0];
                    const blocked = ${JSON.stringify(this.blockedDomains)};
                    if (typeof url === 'string' && blocked.some(domain => url.includes(domain))) {
                        console.warn('[Omega AdBlocker] Blocked ad payload via fetch:', url);
                        return new Response(null, { status: 204 }); // Fake empty response
                    }
                    return originalFetch.apply(this, arguments);
                };

                const originalXHR = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url) {
                    const blocked = ${JSON.stringify(this.blockedDomains)};
                    if (typeof url === 'string' && blocked.some(domain => url.includes(domain))) {
                        console.warn('[Omega AdBlocker] Blocked ad payload via XHR:', url);
                        return originalXHR.apply(this,[method, 'javascript:void(0)']); // Nullify
                    }
                    return originalXHR.apply(this, arguments);
                };

                // 3. MUTATION OBSERVER TO DESTROY AD OVERLAYS INSTANTLY
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.tagName === 'IFRAME' || node.tagName === 'DIV' || node.tagName === 'A') {
                                const classes = (node.className || '').toString().toLowerCase();
                                const id = (node.id || '').toString().toLowerCase();
                                if (
                                    classes.includes('ad') || classes.includes('popup') || classes.includes('overlay') ||
                                    id.includes('ad') || id.includes('banner') || node.style.zIndex > 9999
                                ) {
                                    node.remove();
                                    console.log('[Omega AdBlocker] Disintegrated intrusive DOM node.');
                                }
                            }
                        });
                    });
                });

                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, { childList: true, subtree: true });
                });
            })();
        </script>
        `;
    },

    isAdUrl: function(url) {
        return this.blockedDomains.some(domain => url.includes(domain));
    }
};

module.exports = adBlocker;
