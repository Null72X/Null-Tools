/* ==========================================================================
   TOOL 7 — BYTE FORGE (AOB CONVERTER)
   Multi-language AOB transformation between C#, C++, and Python
   ========================================================================== */

const Tool7ByteForge = (function () {
    'use strict';

    let el: Record<string, any> = {};

    function init() {
        el = {
            select: document.getElementById('byteForgeConversionType'),
            input: document.getElementById('byteForgeInput'),
            output: document.getElementById('byteForgeOutput'),
            byteCountDisplay: document.getElementById('byteForgeCountDisplay'),
            conversionLabel: document.getElementById('byteForgeConversionLabel'),
            copyBtn: document.getElementById('byteForgeCopyBtn'),
            deleteBtn: document.getElementById('byteForgeDeleteBtn'),
            btnSample: document.getElementById('byteForgeBtnSample')
        };

        bindEvents();
        updateLabel();
        updateConversion();
    }

    function aobToCpp(aob) {
        return aob.trim().split(/\s+/).map(p => p === '??' ? "'?'" : '0x' + p.toUpperCase()).join(', ');
    }

    function aobToPython(aob) {
        return aob.trim().split(/\s+/).map(p => p === '??' ? '.' : '\\x' + p.toUpperCase()).join('');
    }

    function cppToCs(aob) {
        return aob.replace(/[{};]/g, '').split(/,|\s+/).filter(Boolean).map(p => {
            p = p.replace(/0x/gi, '').trim();
            return p === '??' || p === "'?'" ? '??' : p.toUpperCase();
        }).join(' ');
    }

    function cppToPython(aob) {
        return aob.replace(/[{};]/g, '').split(/,|\s+/).filter(Boolean).map(p => {
            p = p.trim();
            if (p === '??' || p === "'?'") return '.';
            return '\\x' + p.replace(/0x/gi, '').toUpperCase();
        }).join('');
    }

    function csToCpp(aob) { return ' ' + aobToCpp(aob) + ' '; }
    function csToPython(aob) { return aobToPython(aob); }

    function pyToCs(aob) {
        return ' ' + aob.replace(/'/g, '').split(/\\x|(?=\.)/).filter(Boolean).map(p =>
            p === '.' ? '??' : p.toUpperCase()
        ).join(' ') + ' ';
    }

    function pyToCpp(aob) {
        return ' ' + aob.replace(/'/g, '').split(/\\x|(?=\.)/).filter(Boolean).map(p =>
            p === '.' ? "'?'" : '0x' + p.toUpperCase()
        ).join(', ') + ' ';
    }

    function updateConversion() {
        if (!el.input || !el.output || !el.byteCountDisplay) return;
        const val = el.input.value.trim();
        if (!val) {
            el.output.textContent = '';
            el.byteCountDisplay.textContent = '0';
            return;
        }

        const bytes = val.split(/\s+/).filter(Boolean);
        el.byteCountDisplay.textContent = bytes.length;

        let result = '';
        const mode = el.select ? el.select.value : 'cs-cpp';
        switch (mode) {
            case 'cs-cpp': result = csToCpp(val); break;
            case 'cs-py': result = csToPython(val); break;
            case 'cpp-cs': result = cppToCs(val); break;
            case 'cpp-py': result = cppToPython(val); break;
            case 'py-cs': result = pyToCs(val); break;
            case 'py-cpp': result = pyToCpp(val); break;
            default: result = val;
        }
        el.output.textContent = result;
    }

    function updateLabel() {
        if (!el.select || !el.conversionLabel) return;
        const mode = el.select.value;
        const map = {
            'cs-cpp': 'C# → C++',
            'cs-py': 'C# → Python',
            'cpp-cs': 'C++ → C#',
            'cpp-py': 'C++ → Python',
            'py-cs': 'Python → C#',
            'py-cpp': 'Python → C++'
        };
        el.conversionLabel.textContent = map[mode] || 'C# → C++';
    }

    function bindEvents() {
        if (el.input) el.input.addEventListener('input', updateConversion);

        if (el.select) {
            el.select.addEventListener('change', function () {
                updateLabel();
                updateConversion();
                window.NullApp.showToast('Switched to ' + this.options[this.selectedIndex].text);
            });
        }

        if (el.copyBtn) {
            el.copyBtn.addEventListener('click', function () {
                const text = el.output ? el.output.textContent : '';
                window.NullApp.copyToClipboard(text, 'Converted AOB copied to clipboard!');
            });
        }

        if (el.deleteBtn) {
            el.deleteBtn.addEventListener('click', function () {
                if (el.input) el.input.value = '';
                if (el.output) el.output.textContent = '';
                if (el.byteCountDisplay) el.byteCountDisplay.textContent = '0';
                if (el.input) el.input.focus();
                window.NullApp.showToast('Cleared input');
            });
        }

        if (el.btnSample) {
            el.btnSample.addEventListener('click', function () {
                if (el.input) el.input.value = '90 90 ?? AB 00 12 FF';
                updateConversion();
                window.NullApp.showToast('Loaded sample AOB bytes');
            });
        }
    }

    return {
        init,
        updateConversion,
        csToCpp,
        csToPython,
        cppToCs,
        cppToPython,
        pyToCs,
        pyToCpp
    };
})();

if (typeof window !== 'undefined') window.Tool7ByteForge = Tool7ByteForge;
if (typeof globalThis !== 'undefined') (globalThis as any).Tool7ByteForge = Tool7ByteForge;
if (typeof module !== 'undefined' && module.exports) module.exports = Tool7ByteForge;
