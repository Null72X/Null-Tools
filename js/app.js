/* ==========================================================================
   NULL TOOLS — MASTER APPLICATION ORCHESTRATOR
   Routing, State Preservation, Shared Utilities & Tool Lifecycle Management
   ========================================================================== */
const NullApp = (function () {
    'use strict';
    // Route Definitions for All 8 Unified Tools
    const ROUTES = {
        '#bones-offset-finder': 'viewToolBones',
        '#aob-cleaner': 'viewToolCleaner',
        '#aob-merger': 'viewToolMerger',
        '#collider-offset': 'viewToolCollider',
        '#offsets-finder': 'viewToolFinder',
        '#offsets-calculator': 'viewToolCalculator',
        '#byte-forge': 'viewToolByteForge',
        '#external-bones': 'viewToolExternalBones'
    };
    const DEFAULT_ROUTE = '#bones-offset-finder';
    let currentTabId = DEFAULT_ROUTE;
    // Toast Timer
    let toastTimeout = null;
    // Shared Utilities
    function showToast(message, duration = 3000) {
        const toastEl = document.getElementById('globalToast');
        const toastMsg = document.getElementById('globalToastMessage');
        if (!toastEl || !toastMsg)
            return;
        toastMsg.textContent = message;
        toastEl.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, duration);
    }
    async function copyToClipboard(text, successMsg = 'Copied to clipboard!') {
        if (!text || !text.trim()) {
            showToast('Nothing to copy!');
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            showToast(successMsg);
        }
        catch (err) {
            // Fallback for non-secure contexts
            const temp = document.createElement('textarea');
            temp.value = text;
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            showToast(successMsg);
        }
    }
    function downloadTextFile(filename, content) {
        if (!content) {
            showToast('Nothing to download!');
            return;
        }
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Saved ${filename}`);
    }
    // Tab Switching & Navigation (Enhanced)
    function switchTab(routeHash, updateHistory = true) {
        if (!ROUTES[routeHash]) {
            routeHash = DEFAULT_ROUTE;
        }
        currentTabId = routeHash;
        const targetViewId = ROUTES[routeHash];
        // Update Tab Links (Classes, ARIA, and focusability)
        document.querySelectorAll('.tab-link').forEach(link => {
            const href = link.getAttribute('href');
            const isActive = (href === routeHash);
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-selected', isActive ? 'true' : 'false');
            link.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        // Update Tool View Panels
        document.querySelectorAll('.tool-view-panel').forEach(panel => {
            const isActive = (panel.id === targetViewId);
            panel.classList.toggle('active', isActive);
            if (isActive) {
                panel.setAttribute('tabindex', '-1');
            }
        });
        // Save preference in localStorage
        try {
            localStorage.setItem('null_active_tab', routeHash);
        }
        catch (e) { }
        // Update URL hash without causing full page reload
        if (updateHistory && window.location.hash !== routeHash) {
            history.pushState(null, null, routeHash);
        }
        // Scroll active tab into view if needed
        const activeLink = document.querySelector(`.tab-link[href="${routeHash}"]`);
        if (activeLink && activeLink.scrollIntoView) {
            activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
    function initRouting() {
        // Tab Click Listeners
        document.querySelectorAll('.tab-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('href');
                switchTab(route, true);
            });
        });
        // Keyboard Navigation (Shortcuts: 1-8, Alt+1-8, ArrowLeft/ArrowRight)
        if (typeof document !== 'undefined') {
            document.addEventListener('keydown', (e) => {
                const activeElem = document.activeElement;
                const tag = (activeElem && activeElem.tagName) ? activeElem.tagName.toLowerCase() : '';
                if (tag === 'input' || tag === 'textarea' || (activeElem && activeElem.isContentEditable)) {
                    return; // Ignore inside input fields
                }
                const tabs = Array.from(document.querySelectorAll('.tab-link'));
                if (!tabs.length)
                    return;
                // Numbers 1-8 (directly or with Alt)
                const num = parseInt(e.key, 10);
                if (!isNaN(num) && num >= 1 && num <= tabs.length && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    const targetTab = tabs[num - 1];
                    if (targetTab) {
                        const route = targetTab.getAttribute('href');
                        switchTab(route, true);
                        targetTab.focus();
                    }
                    return;
                }
                // Arrow keys Left & Right
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    const currentIdx = tabs.findIndex(t => t.getAttribute('href') === currentTabId);
                    if (currentIdx !== -1) {
                        e.preventDefault();
                        const nextIdx = (e.key === 'ArrowRight')
                            ? (currentIdx + 1) % tabs.length
                            : (currentIdx - 1 + tabs.length) % tabs.length;
                        const nextTab = tabs[nextIdx];
                        if (nextTab) {
                            switchTab(nextTab.getAttribute('href'), true);
                            nextTab.focus();
                        }
                    }
                }
            });
        }
        // Back / Forward Browser History
        window.addEventListener('popstate', () => {
            const hash = window.location.hash || DEFAULT_ROUTE;
            switchTab(hash, false);
        });
        // Initial Route: URL hash -> localStorage -> default
        let initialHash = window.location.hash;
        if (!initialHash || !ROUTES[initialHash]) {
            try {
                const saved = localStorage.getItem('null_active_tab');
                if (saved && ROUTES[saved]) {
                    initialHash = saved;
                }
            }
            catch (e) { }
        }
        if (!initialHash || !ROUTES[initialHash]) {
            initialHash = DEFAULT_ROUTE;
        }
        switchTab(initialHash, false);
    }
    // ------------------------------------------------------------------------
    // Command Palette & Keyboard Shortcuts System
    // ------------------------------------------------------------------------
    const TOOLS_LIST = [
        { id: '#bones-offset-finder', num: '1', title: 'Bones Offset Finder', tag: 'DUMP', desc: 'dump.cs & libil2cpp.so 21 canonical bones & dual AOB studio' },
        { id: '#aob-cleaner', num: '2', title: 'AOB Cleaner', tag: 'MASK', desc: 'Signature studio with 14 opcode whitelist & live hex masking' },
        { id: '#aob-merger', num: '3', title: 'AOB Merger', tag: 'DIFF', desc: 'Dual signature differ with auto wildcards and diff analysis' },
        { id: '#collider-offset', num: '4', title: 'Collider Offset', tag: 'MATH', desc: 'Basic read/write & collider relative delta calculator' },
        { id: '#offsets-finder', num: '5', title: 'Offsets Finder', tag: 'SHIFT', desc: 'Step-based opcode pattern variations & shift generator' },
        { id: '#offsets-calculator', num: '6', title: 'Offsets Calculator', tag: '2-TAP', desc: '2-tap runtime memory read/write offset projection engine' },
        { id: '#byte-forge', num: '7', title: 'Byte Forge', tag: 'CODE', desc: 'Multi-language byte format converter (C++, C#, Python, MASM)' },
        { id: '#external-bones', num: '8', title: 'External Bones', tag: 'ESP', desc: 'Chest reference bone delta calculator for ESP overlays' }
    ];
    function initCommandPalette() {
        if (typeof document === 'undefined')
            return;
        const paletteModal = document.getElementById('commandPaletteModal');
        const searchInput = document.getElementById('paletteSearchInput');
        const resultsContainer = document.getElementById('paletteResults');
        const btnOpen = document.getElementById('btnCommandPalette');
        const shortcutsModal = document.getElementById('shortcutsModal');
        const btnShortcuts = document.getElementById('btnShortcutsHelp');
        const btnCloseShortcuts = document.getElementById('closeShortcutsModal');
        if (!paletteModal || !resultsContainer)
            return;
        function renderResults(query = '') {
            if (!resultsContainer)
                return;
            const q = query.trim().toLowerCase();
            const filtered = TOOLS_LIST.filter(t => !q || t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.num === q);
            resultsContainer.innerHTML = '';
            filtered.forEach((t, idx) => {
                const item = document.createElement('div');
                item.className = 'palette-item' + (idx === 0 ? ' active' : '');
                item.innerHTML = '<div class="palette-item-left"><span class="palette-item-num">' + t.num + '</span><div><strong>' + t.title + '</strong><div style="font-size:0.75rem;color:var(--text-dim);">' + t.desc + '</div></div></div><span class="tab-badge-pill">' + t.tag + '</span>';
                item.addEventListener('click', () => {
                    switchTab(t.id, true);
                    closePalette();
                });
                resultsContainer.appendChild(item);
            });
        }
        function openPalette() {
            paletteModal.style.display = 'flex';
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            renderResults();
        }
        function closePalette() {
            paletteModal.style.display = 'none';
        }
        function openShortcuts() {
            if (shortcutsModal)
                shortcutsModal.style.display = 'flex';
        }
        function closeShortcuts() {
            if (shortcutsModal)
                shortcutsModal.style.display = 'none';
        }
        if (btnOpen)
            btnOpen.addEventListener('click', openPalette);
        if (btnShortcuts)
            btnShortcuts.addEventListener('click', openShortcuts);
        if (btnCloseShortcuts)
            btnCloseShortcuts.addEventListener('click', closeShortcuts);
        paletteModal.addEventListener('click', (e) => {
            if (e.target === paletteModal)
                closePalette();
        });
        if (shortcutsModal) {
            shortcutsModal.addEventListener('click', (e) => {
                if (e.target === shortcutsModal)
                    closeShortcuts();
            });
        }
        if (searchInput) {
            searchInput.addEventListener('input', () => renderResults(searchInput.value));
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const firstActive = resultsContainer.querySelector('.palette-item');
                    if (firstActive)
                        firstActive.click();
                }
            });
        }
        window.addEventListener('keydown', (e) => {
            const activeElem = document.activeElement;
            const tag = (activeElem && activeElem.tagName) ? activeElem.tagName.toLowerCase() : '';
            const isInput = tag === 'input' || tag === 'textarea' || (activeElem && activeElem.isContentEditable);
            if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && !isInput)) {
                e.preventDefault();
                openPalette();
                return;
            }
            if (e.key === '?' && !isInput) {
                e.preventDefault();
                openShortcuts();
                return;
            }
            if (e.key === 'Escape') {
                closePalette();
                closeShortcuts();
            }
        });
    }
    // ------------------------------------------------------------------------
    // High-Performance 60FPS Interactive Canvas Particle System
    // ------------------------------------------------------------------------
    function initCanvasParticles() {
        if (typeof window === 'undefined' || typeof document === 'undefined')
            return;
        const canvas = document.getElementById('particlesCanvas');
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);
        const mouse = { x: -1000, y: -1000, radius: 120 };
        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        const palette = [
            { color: '239, 68, 68', glow: 'rgba(239, 68, 68, 0.6)' },
            { color: '220, 38, 38', glow: 'rgba(220, 38, 38, 0.5)' },
            { color: '255, 255, 255', glow: 'rgba(255, 255, 255, 0.4)' },
            { color: '168, 85, 247', glow: 'rgba(168, 85, 247, 0.5)' },
            { color: '6, 182, 212', glow: 'rgba(6, 182, 212, 0.4)' }
        ];
        const particleCount = Math.min(55, Math.floor((width * height) / 22000));
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            const pColor = palette[Math.floor(Math.random() * palette.length)];
            const baseAlpha = Math.random() * 0.35 + 0.15;
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                color: pColor.color,
                glow: pColor.glow,
                baseAlpha,
                currentAlpha: baseAlpha
            });
        }
        function render() {
            if (!ctx)
                return;
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0)
                    p.x = width;
                else if (p.x > width)
                    p.x = 0;
                if (p.y < 0)
                    p.y = height;
                else if (p.y > height)
                    p.y = 0;
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (mouse.radius - dist) / mouse.radius;
                    p.x += Math.cos(angle) * force * 2;
                    p.y += Math.sin(angle) * force * 2;
                    p.currentAlpha = Math.min(0.9, p.baseAlpha + 0.35);
                }
                else {
                    p.currentAlpha += (p.baseAlpha - p.currentAlpha) * 0.05;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(" + p.color + ", " + p.currentAlpha + ")";
                ctx.shadowColor = p.glow;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist2 < 80) {
                        const alpha = (1 - dist2 / 80) * 0.12;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = "rgba(239, 68, 68, " + alpha + ")";
                        ctx.lineWidth = 0.7;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(render);
        }
        render();
    }
    function init() {
        initCanvasParticles();
        initCommandPalette();
        initRouting();
        // Initialize All 8 Tools
        if (typeof Tool1Bones !== 'undefined' && Tool1Bones.init)
            Tool1Bones.init();
        if (typeof Tool2AobCleaner !== 'undefined' && Tool2AobCleaner.init)
            Tool2AobCleaner.init();
        if (typeof Tool3AobMerger !== 'undefined' && Tool3AobMerger.init)
            Tool3AobMerger.init();
        if (typeof Tool4Collider !== 'undefined' && Tool4Collider.init)
            Tool4Collider.init();
        if (typeof Tool5OffsetsFinder !== 'undefined' && Tool5OffsetsFinder.init)
            Tool5OffsetsFinder.init();
        if (typeof Tool6OffsetsCalc !== 'undefined' && Tool6OffsetsCalc.init)
            Tool6OffsetsCalc.init();
        if (typeof Tool7ByteForge !== 'undefined' && Tool7ByteForge.init)
            Tool7ByteForge.init();
        if (typeof Tool8ExternalBones !== 'undefined' && Tool8ExternalBones.init)
            Tool8ExternalBones.init();
        console.log('[NULL TOOLS] All 8 tools merged and initialized successfully in unified workspace.');
    }
    document.addEventListener('DOMContentLoaded', init);
    return {
        showToast,
        copyToClipboard,
        downloadTextFile,
        switchTab,
        getCurrentTab: () => currentTabId
    };
})();
if (typeof window !== 'undefined')
    window.NullApp = NullApp;
if (typeof globalThis !== 'undefined')
    globalThis.NullApp = NullApp;
if (typeof module !== 'undefined' && module.exports)
    module.exports = NullApp;
//# sourceMappingURL=app.js.map