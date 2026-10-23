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
        if (!toastEl || !toastMsg) return;

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
        } catch (err) {
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

    // Tab Switching & Navigation
    function switchTab(routeHash, updateHistory = true) {
        if (!ROUTES[routeHash]) {
            routeHash = DEFAULT_ROUTE;
        }

        currentTabId = routeHash;
        const targetViewId = ROUTES[routeHash];

        // Update Tab Links
        document.querySelectorAll('.tab-link').forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === routeHash);
        });

        // Update Tool View Panels
        document.querySelectorAll('.tool-view-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === targetViewId);
        });

        // Update URL hash without causing full page reload
        if (updateHistory && window.location.hash !== routeHash) {
            history.pushState(null, null, routeHash);
        }

        // Scroll active tab into view if needed (mobile horizontal scroll)
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

        // Back / Forward Browser History
        window.addEventListener('popstate', () => {
            const hash = window.location.hash || DEFAULT_ROUTE;
            switchTab(hash, false);
        });

        // Initial Route
        const initialHash = window.location.hash || DEFAULT_ROUTE;
        switchTab(initialHash, false);
    }

    // Initialize Everything on DOM Ready
    function init() {
        initRouting();

        // Initialize All 8 Tools
        if (typeof Tool1Bones !== 'undefined' && Tool1Bones.init) Tool1Bones.init();
        if (typeof Tool2AobCleaner !== 'undefined' && Tool2AobCleaner.init) Tool2AobCleaner.init();
        if (typeof Tool3AobMerger !== 'undefined' && Tool3AobMerger.init) Tool3AobMerger.init();
        if (typeof Tool4Collider !== 'undefined' && Tool4Collider.init) Tool4Collider.init();
        if (typeof Tool5OffsetsFinder !== 'undefined' && Tool5OffsetsFinder.init) Tool5OffsetsFinder.init();
        if (typeof Tool6OffsetsCalc !== 'undefined' && Tool6OffsetsCalc.init) Tool6OffsetsCalc.init();
        if (typeof Tool7ByteForge !== 'undefined' && Tool7ByteForge.init) Tool7ByteForge.init();
        if (typeof Tool8ExternalBones !== 'undefined' && Tool8ExternalBones.init) Tool8ExternalBones.init();

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

if (typeof window !== 'undefined') window.NullApp = NullApp;
if (typeof globalThis !== 'undefined') globalThis.NullApp = NullApp;
if (typeof module !== 'undefined' && module.exports) module.exports = NullApp;
