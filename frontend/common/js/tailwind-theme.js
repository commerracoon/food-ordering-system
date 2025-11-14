// tailwind-theme.js
// Reads APP_CONFIG.THEME (from config.js) and sets tailwind.config accordingly
(function(){
    try {
        // Ensure window.tailwind exists before accessing it
        window.tailwind = window.tailwind || {};
        
        if (typeof APP_CONFIG === 'undefined' || !APP_CONFIG.THEME) {
            console.warn('APP_CONFIG.THEME not found; tailwind-theme will use defaults');
            window.tailwind.config = window.tailwind.config || { theme: { extend: { colors: { primary: '#ff6b6b', secondary: '#4ecdc4', accent: '#ffe66d', dark: '#2d3436', light: '#f8f9fa' } } } };
            return;
        }

        const t = APP_CONFIG.THEME;
        window.tailwind.config = window.tailwind.config || {};
        window.tailwind.config.theme = window.tailwind.config.theme || {};
        window.tailwind.config.theme.extend = window.tailwind.config.theme.extend || {};
        window.tailwind.config.theme.extend.colors = Object.assign({}, window.tailwind.config.theme.extend.colors || {}, {
            primary: t.PRIMARY,
            secondary: t.SECONDARY,
            accent: t.ACCENT,
            dark: t.DARK,
            light: t.LIGHT
        });
    } catch (e) {
        console.error('Error applying tailwind theme from APP_CONFIG', e);
    }
})();
