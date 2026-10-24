/* ==========================================================================
   TOOL 3 — AOB MERGER
   Compare two Array of Bytes (AOB) sequences & auto-generate wildcard patterns (??)
   ========================================================================== */
const Tool3AobMerger = (function () {
    'use strict';
    let el = {};
    function init() {
        el = {
            aob1Input: document.getElementById('mergerAob1'),
            aob2Input: document.getElementById('mergerAob2'),
            mergedOutput: document.getElementById('mergerMergedOutput'),
            aob1Count: document.getElementById('mergerAob1Count'),
            aob2Count: document.getElementById('mergerAob2Count'),
            mergedCount: document.getElementById('mergerMergedCount'),
            wildcardCount: document.getElementById('mergerWildcardCount'),
            alertBanner: document.getElementById('mergerAlertBanner'),
            alertMessage: document.getElementById('mergerAlertMessage'),
            btnMakeSame: document.getElementById('mergerBtnMakeSame'),
            btnDemo: document.getElementById('mergerBtnDemo'),
            btnFormat: document.getElementById('mergerBtnFormat'),
            btnClear: document.getElementById('mergerBtnClear'),
            btnCopy: document.getElementById('mergerBtnCopy'),
            btnDownload: document.getElementById('mergerBtnDownload'),
            pasteAob1: document.getElementById('mergerPasteAob1'),
            pasteAob2: document.getElementById('mergerPasteAob2')
        };
        bindEvents();
    }
    function bindEvents() {
        if (el.aob1Input)
            el.aob1Input.addEventListener('input', processMerge);
        if (el.aob2Input)
            el.aob2Input.addEventListener('input', processMerge);
        // Paste buttons
        if (el.pasteAob1) {
            el.pasteAob1.addEventListener('click', () => {
                navigator.clipboard.readText().then(text => {
                    if (el.aob1Input) {
                        el.aob1Input.value = text;
                        processMerge();
                        window.NullApp.showToast('Pasted into AOB 1');
                    }
                });
            });
        }
        if (el.pasteAob2) {
            el.pasteAob2.addEventListener('click', () => {
                navigator.clipboard.readText().then(text => {
                    if (el.aob2Input) {
                        el.aob2Input.value = text;
                        processMerge();
                        window.NullApp.showToast('Pasted into AOB 2');
                    }
                });
            });
        }
        // Demo preset
        if (el.btnDemo) {
            el.btnDemo.addEventListener('click', () => {
                if (el.aob1Input)
                    el.aob1Input.value = SAMPLE_DATA.aobMerger1;
                if (el.aob2Input)
                    el.aob2Input.value = SAMPLE_DATA.aobMerger2;
                processMerge();
                window.NullApp.showToast('Loaded demo AOB patterns!');
            });
        }
        // Format spacing
        if (el.btnFormat) {
            el.btnFormat.addEventListener('click', () => {
                const b1 = parseTokens(el.aob1Input ? el.aob1Input.value : '');
                const b2 = parseTokens(el.aob2Input ? el.aob2Input.value : '');
                if (el.aob1Input && b1.length)
                    el.aob1Input.value = b1.join(' ');
                if (el.aob2Input && b2.length)
                    el.aob2Input.value = b2.join(' ');
                processMerge();
                window.NullApp.showToast('Cleaned byte spacing');
            });
        }
        // Clear All
        if (el.btnClear) {
            el.btnClear.addEventListener('click', () => {
                if (el.aob1Input)
                    el.aob1Input.value = '';
                if (el.aob2Input)
                    el.aob2Input.value = '';
                processMerge();
                window.NullApp.showToast('AOB Merger cleared');
            });
        }
        // Make it same button
        if (el.btnMakeSame) {
            el.btnMakeSame.addEventListener('click', () => {
                const b1 = parseTokens(el.aob1Input ? el.aob1Input.value : '');
                const b2 = parseTokens(el.aob2Input ? el.aob2Input.value : '');
                if (!b1.length || !b2.length)
                    return;
                const targetLen = Math.min(b1.length, b2.length);
                const trimmed1 = b1.slice(0, targetLen);
                const trimmed2 = b2.slice(0, targetLen);
                if (el.aob1Input)
                    el.aob1Input.value = trimmed1.join(' ');
                if (el.aob2Input)
                    el.aob2Input.value = trimmed2.join(' ');
                processMerge();
                window.NullApp.showToast(`Trimmed both patterns to ${targetLen} bytes!`);
            });
        }
        // Copy
        if (el.btnCopy) {
            el.btnCopy.addEventListener('click', () => {
                const text = el.mergedOutput ? el.mergedOutput.value : '';
                window.NullApp.copyToClipboard(text, 'Merged AOB copied to clipboard!');
            });
        }
        // Download
        if (el.btnDownload) {
            el.btnDownload.addEventListener('click', () => {
                const text = el.mergedOutput ? el.mergedOutput.value : '';
                if (!text) {
                    window.NullApp.showToast('Nothing to download — merge first!');
                    return;
                }
                window.NullApp.downloadTextFile('merged_aob.txt', text);
            });
        }
    }
    function parseTokens(raw) {
        if (!raw || !raw.trim())
            return [];
        const cleaned = raw.trim().toUpperCase().replace(/[\s,]+/g, ' ');
        return cleaned.split(' ').filter(b => b.length > 0);
    }
    function isValidByte(token) {
        if (token === '??' || token === '?')
            return true;
        return /^[0-9A-FA-F]{2}$/.test(token);
    }
    function validateTokens(tokens) {
        for (let i = 0; i < tokens.length; i++) {
            if (!isValidByte(tokens[i]))
                return false;
        }
        return true;
    }
    function processMerge() {
        const raw1 = el.aob1Input ? el.aob1Input.value : '';
        const raw2 = el.aob2Input ? el.aob2Input.value : '';
        const bytes1 = parseTokens(raw1);
        const bytes2 = parseTokens(raw2);
        if (el.aob1Count)
            el.aob1Count.textContent = `${bytes1.length} ${bytes1.length === 1 ? 'Byte' : 'Bytes'}`;
        if (el.aob2Count)
            el.aob2Count.textContent = `${bytes2.length} ${bytes2.length === 1 ? 'Byte' : 'Bytes'}`;
        // If both empty
        if (bytes1.length === 0 && bytes2.length === 0) {
            if (el.mergedOutput)
                el.mergedOutput.value = '';
            if (el.mergedCount)
                el.mergedCount.textContent = '0 Bytes';
            if (el.wildcardCount)
                el.wildcardCount.textContent = '0 Wildcards';
            hideAlert();
            return;
        }
        // Validate bytes
        if (bytes1.length > 0 && !validateTokens(bytes1)) {
            showAlert('Invalid Byte Input', 'AOB 1 contains invalid byte values. Each byte must be 2-digit hex (00-FF) or wildcard (??).', false);
            clearOutput();
            return;
        }
        if (bytes2.length > 0 && !validateTokens(bytes2)) {
            showAlert('Invalid Byte Input', 'AOB 2 contains invalid byte values. Each byte must be 2-digit hex (00-FF) or wildcard (??).', false);
            clearOutput();
            return;
        }
        // If only one input present
        if (bytes1.length === 0 || bytes2.length === 0) {
            clearOutput();
            hideAlert();
            return;
        }
        // Check byte count match
        if (bytes1.length !== bytes2.length) {
            const shorter = Math.min(bytes1.length, bytes2.length);
            showAlert('Byte Count Mismatch', `AOB 1 has ${bytes1.length} bytes and AOB 2 has ${bytes2.length} bytes. Click "Make it Same" to trim both to ${shorter} bytes.`, true);
            clearOutput();
            return;
        }
        // Success: lengths match!
        hideAlert();
        let wildcards = 0;
        const merged = [];
        for (let i = 0; i < bytes1.length; i++) {
            const b1 = bytes1[i];
            const b2 = bytes2[i];
            if (b1 === '??' || b1 === '?' || b2 === '??' || b2 === '?') {
                merged.push('??');
                wildcards++;
            }
            else if (b1 === b2) {
                merged.push(b1);
            }
            else {
                merged.push('??');
                wildcards++;
            }
        }
        const mergedStr = merged.join(' ');
        if (el.mergedOutput)
            el.mergedOutput.value = mergedStr;
        if (el.mergedCount)
            el.mergedCount.textContent = `${bytes1.length} Bytes`;
        if (el.wildcardCount)
            el.wildcardCount.textContent = `${wildcards} ${wildcards === 1 ? 'Wildcard' : 'Wildcards'}`;
    }
    function clearOutput() {
        if (el.mergedOutput)
            el.mergedOutput.value = '';
        if (el.mergedCount)
            el.mergedCount.textContent = '0 Bytes';
        if (el.wildcardCount)
            el.wildcardCount.textContent = '0 Wildcards';
    }
    function showAlert(title, msg, showMakeSame) {
        if (!el.alertBanner)
            return;
        const titleEl = el.alertBanner.querySelector('.alert-title');
        if (titleEl)
            titleEl.textContent = title;
        if (el.alertMessage)
            el.alertMessage.textContent = msg;
        el.alertBanner.classList.remove('hidden');
        if (el.btnMakeSame) {
            el.btnMakeSame.style.display = showMakeSame ? 'inline-flex' : 'none';
        }
    }
    function hideAlert() {
        if (el.alertBanner)
            el.alertBanner.classList.add('hidden');
    }
    return {
        init,
        processMerge,
        parseTokens,
        isValidByte,
        validateTokens
    };
})();
if (typeof window !== 'undefined')
    window.Tool3AobMerger = Tool3AobMerger;
if (typeof globalThis !== 'undefined')
    globalThis.Tool3AobMerger = Tool3AobMerger;
if (typeof module !== 'undefined' && module.exports)
    module.exports = Tool3AobMerger;
//# sourceMappingURL=tool3-aob-merger.js.map