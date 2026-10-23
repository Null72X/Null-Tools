/* ==========================================================================
   TOOL 4 — COLLIDER OFFSET (AIMBOT AI OFFSET FINDER)
   Bidirectional Transformations: Collider Read <-> Basic Write & Basic Read
   ========================================================================== */

const Tool4Collider = (function () {
    'use strict';

    let el = {};

    function init() {
        el = {
            tabBasicBtn: document.getElementById('colliderTabBasic'),
            tabColliderBtn: document.getElementById('colliderTabCollider'),
            viewBasic: document.getElementById('colliderViewBasic'),
            viewCollider: document.getElementById('colliderViewCollider'),

            // Mode 1: Basic
            basicReadInput: document.getElementById('colliderBasicRead'),
            basicResult: document.getElementById('colliderBasicResult'),
            btnCopyBasic: document.getElementById('btnCopyBasicOffset'),

            readMethodSelect: document.getElementById('colliderReadMethod'),
            readMethodLabel: document.getElementById('colliderReadMethodLabel'),
            guessOffsetInput: document.getElementById('colliderGuessOffset'),
            guessResult: document.getElementById('colliderGuessResult'),
            btnCopyGuess: document.getElementById('btnCopyGuessResult'),

            // Mode 2: Collider
            t1BaseInput: document.getElementById('colliderT1Base'),
            t1BondInput: document.getElementById('colliderT1Bond'),
            t1Result: document.getElementById('colliderT1Result'),
            btnCopyT1: document.getElementById('btnCopyT1Result'),

            t2MethodSelect: document.getElementById('colliderT2Method'),
            t2InputLabel: document.getElementById('colliderT2InputLabel'),
            t2ReadInput: document.getElementById('colliderT2Read'),
            t2Result: document.getElementById('colliderT2Result'),
            btnCopyT2: document.getElementById('btnCopyT2Result'),

            btnLoadSample: document.getElementById('btnLoadColliderSample')
        };

        bindEvents();
        // Initial calculations
        computeBasicOffset();
        computeBasicRead();
        engageTarget();
        computeVector();
    }

    function bindEvents() {
        // Mode switching tabs
        if (el.tabBasicBtn) {
            el.tabBasicBtn.addEventListener('click', () => switchMode('basic'));
        }
        if (el.tabColliderBtn) {
            el.tabColliderBtn.addEventListener('click', () => switchMode('collider'));
        }

        // Mode 1 Handlers
        if (el.basicReadInput) {
            el.basicReadInput.addEventListener('input', () => {
                cleanInputVal(el.basicReadInput);
                computeBasicOffset();
            });
        }

        if (el.readMethodSelect) {
            el.readMethodSelect.addEventListener('change', updateReadMethod);
        }

        if (el.guessOffsetInput) {
            el.guessOffsetInput.addEventListener('input', () => {
                cleanInputVal(el.guessOffsetInput);
                computeBasicRead();
            });
        }

        // Mode 2 Handlers
        if (el.t1BaseInput) {
            el.t1BaseInput.addEventListener('input', () => {
                cleanInputVal(el.t1BaseInput);
                engageTarget();
            });
        }

        if (el.t1BondInput) {
            el.t1BondInput.addEventListener('input', () => {
                cleanInputVal(el.t1BondInput);
                engageTarget();
            });
        }

        if (el.t2MethodSelect) {
            el.t2MethodSelect.addEventListener('change', updateColliderReadMethod);
        }

        if (el.t2ReadInput) {
            el.t2ReadInput.addEventListener('input', () => {
                cleanInputVal(el.t2ReadInput);
                computeVector();
            });
        }

        // Copy buttons
        if (el.btnCopyBasic) {
            el.btnCopyBasic.addEventListener('click', () => copyVal(el.basicResult));
        }
        if (el.btnCopyGuess) {
            el.btnCopyGuess.addEventListener('click', () => copyVal(el.guessResult));
        }
        if (el.btnCopyT1) {
            el.btnCopyT1.addEventListener('click', () => copyVal(el.t1Result));
        }
        if (el.btnCopyT2) {
            el.btnCopyT2.addEventListener('click', () => copyVal(el.t2Result));
        }

        // Sample preset
        if (el.btnLoadSample) {
            el.btnLoadSample.addEventListener('click', loadSample);
        }
    }

    function switchMode(mode) {
        if (!el.tabBasicBtn || !el.tabColliderBtn) return;
        if (mode === 'basic') {
            el.tabBasicBtn.classList.add('active');
            el.tabColliderBtn.classList.remove('active');
            if (el.viewBasic) el.viewBasic.style.display = 'block';
            if (el.viewCollider) el.viewCollider.style.display = 'none';
        } else {
            el.tabColliderBtn.classList.add('active');
            el.tabBasicBtn.classList.remove('active');
            if (el.viewBasic) el.viewBasic.style.display = 'none';
            if (el.viewCollider) el.viewCollider.style.display = 'block';
        }
    }

    function cleanInputVal(inputEl) {
        if (!inputEl) return;
        let val = inputEl.value;
        if (!val.toLowerCase().startsWith('0x')) {
            val = val.replace(/[^0-9a-fA-F]/g, '');
            inputEl.value = '0x' + val;
        }
    }

    function parseHex(str) {
        if (!str) return NaN;
        str = str.trim().toLowerCase();
        if (str.startsWith('0x')) str = str.substring(2);
        if (str === '') return NaN;
        return parseInt(str, 16);
    }

    function formatHexOutput(val, length = 2, forceNegative = false) {
        if (isNaN(val)) return forceNegative ? "-0x---" : "0x---";
        let isNeg = val < 0 || forceNegative;
        let absVal = Math.abs(val);
        let hexStr = absVal.toString(16).toUpperCase();
        while (hexStr.length < length) hexStr = "0" + hexStr;
        return (isNeg ? "-0x" : "0x") + hexStr;
    }

    // ------------------------------------------------------------------------
    // Mode 1: Collider to Basic Computations
    // ------------------------------------------------------------------------
    function computeBasicOffset() {
        if (!el.basicReadInput || !el.basicResult) return;
        const readVal = parseHex(el.basicReadInput.value);

        if (isNaN(readVal)) {
            el.basicResult.textContent = "0x---";
            return;
        }

        // Formula: readVal - 0x48 (e.g. 0xFD -> 0xB5, 0x4E8 -> 0x4A0)
        let res = readVal - 0x48;
        if (res < 0 && readVal <= 0xFF) {
            res = (res + 0x100) % 0x100;
        }
        el.basicResult.textContent = formatHexOutput(res, 2);
    }

    function updateReadMethod() {
        if (!el.readMethodSelect || !el.readMethodLabel || !el.guessOffsetInput) return;
        const method = el.readMethodSelect.value;
        if (method === 'collider') {
            el.readMethodLabel.textContent = 'Collider Read Offset';
            el.guessOffsetInput.placeholder = '0xFD';
        } else {
            el.readMethodLabel.textContent = 'Basic Write Offset';
            el.guessOffsetInput.placeholder = '0xB5';
        }
        computeBasicRead();
    }

    function computeBasicRead() {
        if (!el.guessOffsetInput || !el.guessResult || !el.readMethodSelect) return;
        const val = parseHex(el.guessOffsetInput.value);
        const method = el.readMethodSelect.value;

        if (isNaN(val)) {
            el.guessResult.textContent = "0x---";
            return;
        }

        let res;
        if (method === 'collider') {
            // Basic Read = Collider Read - 0x44 (e.g. 0xFD -> 0xB9, 0x4E8 -> 0x4A4)
            res = val - 0x44;
            if (res < 0 && val <= 0xFF) {
                res = (res + 0x100) % 0x100;
            }
        } else {
            // Basic Read = Basic Write + 0x04 (e.g. 0xB5 -> 0xB9, 0x4A0 -> 0x4A4)
            res = val + 0x04;
        }
        el.guessResult.textContent = formatHexOutput(res, 2);
    }

    // ------------------------------------------------------------------------
    // Mode 2: Basic to Collider Computations
    // ------------------------------------------------------------------------
    function engageTarget() {
        if (!el.t1BaseInput || !el.t1BondInput || !el.t1Result) return;
        const base = parseHex(el.t1BaseInput.value);
        const bond = parseHex(el.t1BondInput.value);

        if (isNaN(base) || isNaN(bond)) {
            el.t1Result.textContent = "-0x---";
            return;
        }

        // Collider Write Offset is always negative: -(base - bond - 0x54)
        let diff = base - bond - 0x54;
        el.t1Result.textContent = formatHexOutput(diff, 2, true);
    }

    function updateColliderReadMethod() {
        if (!el.t2MethodSelect || !el.t2InputLabel || !el.t2ReadInput) return;
        const method = el.t2MethodSelect.value;
        if (method === 'write') {
            el.t2InputLabel.textContent = 'Basic Write Value';
            el.t2ReadInput.placeholder = '0xB5';
        } else {
            el.t2InputLabel.textContent = 'Basic Read Value';
            el.t2ReadInput.placeholder = '0xB9';
        }
        computeVector();
    }

    function computeVector() {
        if (!el.t2ReadInput || !el.t2Result || !el.t2MethodSelect) return;
        const readVal = parseHex(el.t2ReadInput.value);
        const method = el.t2MethodSelect.value;

        if (isNaN(readVal)) {
            el.t2Result.textContent = "0x---";
            return;
        }

        let res;
        if (method === 'write') {
            // Collider Read = Basic Write + 0x48 (e.g. 0xB5 -> 0xFD, 0x4A0 -> 0x4E8)
            res = readVal + 0x48;
        } else {
            // Collider Read = Basic Read + 0x44 (e.g. 0xB9 -> 0xFD, 0x4A4 -> 0x4E8)
            res = readVal + 0x44;
        }
        el.t2Result.textContent = formatHexOutput(res, 2);
    }

    function copyVal(resultEl) {
        if (!resultEl) return;
        const val = resultEl.textContent;
        if (val === '0x---' || val === '-0x---') return;
        window.NullApp.copyToClipboard(val, `Copied ${val} to clipboard!`);
    }

    function loadSample() {
        if (el.basicReadInput) el.basicReadInput.value = SAMPLE_DATA.colliderReadSample;
        if (el.guessOffsetInput) el.guessOffsetInput.value = SAMPLE_DATA.colliderReadSample;
        if (el.t1BaseInput) el.t1BaseInput.value = SAMPLE_DATA.colliderBaseSample;
        if (el.t1BondInput) el.t1BondInput.value = SAMPLE_DATA.colliderReadSample;
        if (el.t2ReadInput) el.t2ReadInput.value = SAMPLE_DATA.basicWriteSample;

        computeBasicOffset();
        computeBasicRead();
        engageTarget();
        computeVector();

        window.NullApp.showToast('Loaded representative sample values into Collider Offset!');
    }

    return {
        init,
        computeBasicOffset,
        computeBasicRead,
        engageTarget,
        computeVector,
        parseHex,
        formatHexOutput
    };
})();

if (typeof window !== 'undefined') window.Tool4Collider = Tool4Collider;
if (typeof globalThis !== 'undefined') globalThis.Tool4Collider = Tool4Collider;
if (typeof module !== 'undefined' && module.exports) module.exports = Tool4Collider;
