/* ==========================================================================
   TOOL 6 — OFFSETS CALCULATOR
   2-Tap Interactive AOB Byte Distance & Offset Recalculator
   Ultra-high performance DOM class toggling (zero lag on 1000+ bytes)
   ========================================================================== */
const Tool6OffsetsCalc = (function () {
    'use strict';
    const appState = {
        rawAob: '',
        tokens: [],
        startIndex: 0,
        endIndex: 632,
        nextTarget: 'start', // 'start' -> 'end' -> 'start'...
        readOffset: '0x6EC',
        writeOffset: '0x258'
    };
    let cachedByteElements = [];
    let el = {};
    function init() {
        el = {
            aobTextarea: document.getElementById('calcAobTextarea'),
            totalBytesLabel: document.getElementById('calcTotalBytesLabel'),
            readInput: document.getElementById('calcReadOffset'),
            writeInput: document.getElementById('calcWriteOffset'),
            heroDeltaHex: document.getElementById('calcHeroDeltaHex'),
            heroDeltaDec: document.getElementById('calcHeroDeltaDec'),
            heroReadVal: document.getElementById('calcHeroReadVal'),
            heroReadSub: document.getElementById('calcHeroReadSub'),
            heroWriteVal: document.getElementById('calcHeroWriteVal'),
            heroWriteSub: document.getElementById('calcHeroWriteSub'),
            bytesGrid: document.getElementById('calcBytesGrid'),
            btnCopyResult: document.getElementById('calcBtnCopyResult'),
            btnResetSample: document.getElementById('calcBtnResetSample')
        };
        // Initialize state
        appState.rawAob = SAMPLE_DATA.calcAob;
        appState.readOffset = SAMPLE_DATA.calcReadBase;
        appState.writeOffset = SAMPLE_DATA.calcWriteBase;
        if (el.aobTextarea)
            el.aobTextarea.value = appState.rawAob;
        if (el.readInput)
            el.readInput.value = appState.readOffset;
        if (el.writeInput)
            el.writeInput.value = appState.writeOffset;
        bindEvents();
        buildByteGrid();
    }
    function bindEvents() {
        // Tap byte in grid
        if (el.bytesGrid) {
            el.bytesGrid.addEventListener('click', (e) => {
                const byteBtn = e.target.closest('.byte-btn');
                if (!byteBtn)
                    return;
                const idx = parseInt(byteBtn.dataset.index, 10);
                const val = byteBtn.dataset.val;
                if (appState.nextTarget === 'start') {
                    appState.startIndex = idx;
                    appState.nextTarget = 'end';
                    window.NullApp.showToast(`🟢 Start set to ${val} (0x${idx.toString(16).toUpperCase()}) — now tap End byte`);
                }
                else {
                    appState.endIndex = idx;
                    appState.nextTarget = 'start';
                    window.NullApp.showToast(`🔵 End set to ${val} (0x${idx.toString(16).toUpperCase()}) — offset calculated!`);
                }
                updateCalculations();
                updateGridHighlights();
            });
        }
        // AOB Textarea Change (Debounced)
        if (el.aobTextarea) {
            let debounceTimer = null;
            el.aobTextarea.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    appState.rawAob = e.target.value;
                    const tokens = parseAOBTokens(e.target.value);
                    appState.startIndex = 0;
                    const firstFF = tokens.indexOf('FF');
                    appState.endIndex = firstFF !== -1 ? firstFF : Math.max(0, tokens.length - 1);
                    appState.nextTarget = 'start';
                    buildByteGrid();
                }, 120);
            });
        }
        // Read / Write Offset inputs
        if (el.readInput) {
            el.readInput.addEventListener('input', (e) => {
                appState.readOffset = e.target.value;
                updateCalculations();
            });
        }
        if (el.writeInput) {
            el.writeInput.addEventListener('input', (e) => {
                appState.writeOffset = e.target.value;
                updateCalculations();
            });
        }
        // Reset Sample
        if (el.btnResetSample) {
            el.btnResetSample.addEventListener('click', () => {
                appState.rawAob = SAMPLE_DATA.calcAob;
                appState.readOffset = SAMPLE_DATA.calcReadBase;
                appState.writeOffset = SAMPLE_DATA.calcWriteBase;
                if (el.aobTextarea)
                    el.aobTextarea.value = appState.rawAob;
                if (el.readInput)
                    el.readInput.value = appState.readOffset;
                if (el.writeInput)
                    el.writeInput.value = appState.writeOffset;
                appState.startIndex = 0;
                appState.endIndex = 632;
                appState.nextTarget = 'start';
                buildByteGrid();
                window.NullApp.showToast('Reset Offsets Calculator to standard reference sample!');
            });
        }
        // Copy Result
        if (el.btnCopyResult) {
            el.btnCopyResult.addEventListener('click', () => {
                const delta = appState.endIndex - appState.startIndex;
                const origRead = parseOffset(appState.readOffset);
                const origWrite = parseOffset(appState.writeOffset);
                const newRead = origRead - delta;
                const newWrite = origWrite - delta;
                const text = `Distance: ${formatHex(delta)} (${delta} bytes)\nNew Read: ${formatHexClean(newRead)}\nNew Write: ${formatHexClean(newWrite)}`;
                window.NullApp.copyToClipboard(text, 'Copied recalculated offsets to clipboard!');
            });
        }
    }
    function parseOffset(val) {
        if (!val)
            return 0;
        let s = String(val).trim();
        const isNeg = s.startsWith('-');
        if (isNeg || s.startsWith('+'))
            s = s.substring(1).trim();
        if (s.startsWith('0x') || s.startsWith('0X'))
            s = s.substring(2);
        const num = parseInt(s, 16) || 0;
        return isNeg ? -num : num;
    }
    function formatHex(n) {
        if (isNaN(n))
            return '0x0';
        if (n < 0)
            return `-0x${Math.abs(n).toString(16).toUpperCase()}`;
        return `+0x${n.toString(16).toUpperCase()}`;
    }
    function formatHexClean(n) {
        if (isNaN(n))
            return '0x0';
        if (n < 0)
            return `-0x${Math.abs(n).toString(16).toUpperCase()}`;
        return `0x${n.toString(16).toUpperCase()}`;
    }
    function parseAOBTokens(text) {
        if (!text)
            return [];
        const cleaned = text
            .replace(/\\x/gi, ' ')
            .replace(/0x/gi, ' ')
            .replace(/[,;|\n\r\t]/g, ' ')
            .trim();
        if (!cleaned)
            return [];
        const raw = cleaned.split(/\s+/);
        const out = [];
        for (let i = 0; i < raw.length; i++) {
            const part = raw[i];
            if (!part)
                continue;
            const token = part.toUpperCase();
            if (token === '?' || token === '??') {
                out.push('??');
            }
            else if (token.length === 2 && /^[0-9A-F?]{2}$/.test(token)) {
                out.push(token);
            }
            else if (token.length > 2 && /^[0-9A-F?]+$/.test(token)) {
                for (let j = 0; j < token.length; j += 2) {
                    let chunk = token.slice(j, j + 2);
                    if (chunk.length === 1)
                        chunk = '0' + chunk;
                    out.push(chunk);
                }
            }
            else {
                out.push(token.padStart(2, '0'));
            }
        }
        return out;
    }
    function buildByteGrid() {
        if (!el.bytesGrid)
            return;
        appState.tokens = parseAOBTokens(appState.rawAob);
        const total = appState.tokens.length;
        if (appState.startIndex < 0)
            appState.startIndex = 0;
        if (appState.startIndex >= total)
            appState.startIndex = Math.max(0, total - 1);
        if (appState.endIndex < 0)
            appState.endIndex = 0;
        if (appState.endIndex >= total)
            appState.endIndex = Math.max(0, total - 1);
        if (el.totalBytesLabel) {
            el.totalBytesLabel.textContent = `${total} bytes (0x${total.toString(16).toUpperCase()})`;
        }
        let html = '';
        for (let i = 0; i < total; i++) {
            const val = appState.tokens[i];
            let typeClass = '';
            if (val === '00')
                typeClass = ' null-byte';
            else if (val === '??' || val.includes('?'))
                typeClass = ' wildcard-byte';
            else if (val === 'FF')
                typeClass = ' ff-byte';
            html += `<div class="byte-btn${typeClass}" data-index="${i}" data-val="${val}"><span>${val}</span><span class="byte-sub">0x${i.toString(16).toUpperCase()}</span></div>`;
        }
        el.bytesGrid.innerHTML = html;
        cachedByteElements = Array.from(el.bytesGrid.children);
        updateCalculations();
        updateGridHighlights();
    }
    function updateCalculations() {
        const total = appState.tokens.length;
        if (total === 0)
            return;
        const delta = appState.endIndex - appState.startIndex;
        const deltaHexStr = formatHex(delta);
        const deltaDecStr = `${delta >= 0 ? '+' : ''}${delta} bytes`;
        const startByte = appState.tokens[appState.startIndex] || '??';
        const endByte = appState.tokens[appState.endIndex] || '??';
        if (el.heroDeltaHex)
            el.heroDeltaHex.textContent = deltaHexStr;
        if (el.heroDeltaDec) {
            el.heroDeltaDec.textContent = `${deltaDecStr} (${startByte} @ 0x${appState.startIndex.toString(16).toUpperCase()} ➔ ${endByte} @ 0x${appState.endIndex.toString(16).toUpperCase()})`;
        }
        const origRead = parseOffset(appState.readOffset);
        const origWrite = parseOffset(appState.writeOffset);
        const newRead = origRead - delta;
        const newWrite = origWrite - delta;
        if (el.heroReadVal)
            el.heroReadVal.textContent = formatHexClean(newRead);
        if (el.heroReadSub) {
            el.heroReadSub.textContent = `0x${origRead.toString(16).toUpperCase()} - 0x${Math.abs(delta).toString(16).toUpperCase()} (${newRead >= 0 ? '+' : ''}${newRead} dec)`;
        }
        if (el.heroWriteVal)
            el.heroWriteVal.textContent = formatHexClean(newWrite);
        if (el.heroWriteSub) {
            el.heroWriteSub.textContent = `0x${origWrite.toString(16).toUpperCase()} - 0x${Math.abs(delta).toString(16).toUpperCase()} (${newWrite >= 0 ? '+' : ''}${newWrite} dec)`;
        }
    }
    function updateGridHighlights() {
        const count = cachedByteElements.length;
        if (count === 0)
            return;
        const sIdx = appState.startIndex;
        const eIdx = appState.endIndex;
        const min = Math.min(sIdx, eIdx);
        const max = Math.max(sIdx, eIdx);
        for (let i = 0; i < count; i++) {
            const btn = cachedByteElements[i];
            const isStart = i === sIdx;
            const isEnd = i === eIdx;
            const inRange = i > min && i < max;
            if (isStart)
                btn.classList.add('is-start');
            else
                btn.classList.remove('is-start');
            if (isEnd)
                btn.classList.add('is-end');
            else
                btn.classList.remove('is-end');
            if (inRange)
                btn.classList.add('in-range');
            else
                btn.classList.remove('in-range');
        }
    }
    return {
        init,
        updateCalculations,
        parseOffset,
        parseAOBTokens,
        getState: () => appState
    };
})();
if (typeof window !== 'undefined')
    window.Tool6OffsetsCalc = Tool6OffsetsCalc;
if (typeof globalThis !== 'undefined')
    globalThis.Tool6OffsetsCalc = Tool6OffsetsCalc;
if (typeof module !== 'undefined' && module.exports)
    module.exports = Tool6OffsetsCalc;
//# sourceMappingURL=tool6-offsets-calc.js.map