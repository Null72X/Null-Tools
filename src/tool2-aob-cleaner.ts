/* ==========================================================================
   TOOL 2 — AOB CLEANER / MASKER STUDIO
   High-performance Array of Bytes cleaner, pattern generator & signature builder
   ========================================================================== */

const Tool2AobCleaner = (function () {
    'use strict';

    const state = {
        rawInput: '',
        preserveInput: '04 A0 E1',
        filterMode: 'keep', // 'keep' or 'mask'
        zeroPolicy: 'preserve', // 'preserve', 'mask', or 'follow'
        granularity: 'byte', // 'byte' or 'sequence'
        wildcardToken: '??',
        activeFormat: 'standard', // 'standard', 'ida', 'cpp-sig', 'byte-array', 'compact'
        letterCase: 'upper', // 'upper' or 'lower'
        bytesPerLine: 0,
        parsedBytes: []
    };

    let el: Record<string, any> = {};

    function init() {
        el = {
            rawAobInput: document.getElementById('rawAobInput'),
            preserveBytesInput: document.getElementById('preserveBytesInput'),
            dropZone: document.getElementById('cleanerDropZone'),
            fileUploader: document.getElementById('cleanerFileUploader'),
            btnPasteInput: document.getElementById('btnPasteCleanerInput'),
            btnLoadSample: document.getElementById('btnLoadSampleCleaner'),
            btnClearAll: document.getElementById('btnClearCleanerAll'),

            filterModeToggle: document.getElementById('filterModeToggle'),
            zeroPolicyRadios: document.querySelectorAll('input[name="cleaner-zero-policy"]'),
            matchGranularity: document.getElementById('cleanerMatchGranularity'),
            wildcardToken: document.getElementById('cleanerWildcardToken'),

            formatTabs: document.querySelectorAll('#cleanerFormatTabs .segmented-btn'),
            cleanedOutput: document.getElementById('cleanedAobOutput'),
            byteCountLabel: document.getElementById('cleanerByteCount'),
            charCountLabel: document.getElementById('cleanerCharCount'),

            caseUpperBtn: document.getElementById('btnCaseUpper'),
            caseLowerBtn: document.getElementById('btnCaseLower'),
            bytesPerLineSelect: document.getElementById('cleanerBytesPerLine'),

            codePreviewCard: document.getElementById('cleanerCodePreviewCard'),
            codePreviewTitle: document.getElementById('cleanerCodePreviewTitle'),
            codePreviewContent: document.getElementById('cleanerCodePreviewContent'),
            btnCopyCodePreview: document.getElementById('btnCopyCodePreview'),

            btnCopyOutput: document.getElementById('btnCopyCleanerOutput'),
            btnDownloadOutput: document.getElementById('btnDownloadCleanerOutput')
        };

        bindEvents();
        // Set default sample
        if (el.rawAobInput && !el.rawAobInput.value.trim()) {
            el.rawAobInput.value = SAMPLE_DATA.aobCleanerSample;
            state.rawInput = SAMPLE_DATA.aobCleanerSample;
            processAoB();
        }
    }

    function bindEvents() {
        if (el.rawAobInput) {
            el.rawAobInput.addEventListener('input', () => {
                state.rawInput = el.rawAobInput.value;
                processAoB();
            });
        }

        if (el.preserveBytesInput) {
            el.preserveBytesInput.addEventListener('input', () => {
                state.preserveInput = el.preserveBytesInput.value;
                processAoB();
            });
        }

        // Paste button
        if (el.btnPasteInput) {
            el.btnPasteInput.addEventListener('click', () => {
                navigator.clipboard.readText().then(text => {
                    if (el.rawAobInput) {
                        el.rawAobInput.value = text;
                        state.rawInput = text;
                        processAoB();
                        window.NullApp.showToast('Pasted raw AoB from clipboard!');
                    }
                }).catch(() => {
                    window.NullApp.showToast('Unable to read clipboard. Please paste manually.');
                });
            });
        }

        // Load Sample
        if (el.btnLoadSample) {
            el.btnLoadSample.addEventListener('click', () => {
                if (el.rawAobInput) el.rawAobInput.value = SAMPLE_DATA.aobCleanerSample;
                if (el.preserveBytesInput) el.preserveBytesInput.value = SAMPLE_DATA.aobCleanerPreserve;
                state.rawInput = SAMPLE_DATA.aobCleanerSample;
                state.preserveInput = SAMPLE_DATA.aobCleanerPreserve;
                processAoB();
                window.NullApp.showToast('Loaded sample AoB and preservation rules!');
            });
        }

        // Reset All
        if (el.btnClearAll) {
            el.btnClearAll.addEventListener('click', () => {
                if (el.rawAobInput) el.rawAobInput.value = '';
                state.rawInput = '';
                processAoB();
                window.NullApp.showToast('AoB Cleaner inputs cleared');
            });
        }

        // Filter Mode Toggle (Keep Listed vs Mask Listed)
        if (el.filterModeToggle) {
            el.filterModeToggle.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    el.filterModeToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    state.filterMode = btn.getAttribute('data-mode') || 'keep';
                    processAoB();
                });
            });
        }

        // Zero Policy Radios
        el.zeroPolicyRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    state.zeroPolicy = e.target.value;
                    processAoB();
                }
            });
        });

        // Granularity & Wildcard Token
        if (el.matchGranularity) {
            el.matchGranularity.addEventListener('change', (e) => {
                state.granularity = e.target.value;
                processAoB();
            });
        }

        if (el.wildcardToken) {
            el.wildcardToken.addEventListener('change', (e) => {
                state.wildcardToken = e.target.value;
                renderOutput();
            });
        }

        // Format Tabs
        el.formatTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                el.formatTabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.activeFormat = btn.getAttribute('data-format') || 'standard';
                renderOutput();
            });
        });

        // Case controls
        if (el.caseUpperBtn && el.caseLowerBtn) {
            el.caseUpperBtn.addEventListener('click', () => {
                el.caseUpperBtn.classList.add('active');
                el.caseLowerBtn.classList.remove('active');
                state.letterCase = 'upper';
                renderOutput();
            });
            el.caseLowerBtn.addEventListener('click', () => {
                el.caseLowerBtn.classList.add('active');
                el.caseUpperBtn.classList.remove('active');
                state.letterCase = 'lower';
                renderOutput();
            });
        }

        if (el.bytesPerLineSelect) {
            el.bytesPerLineSelect.addEventListener('change', (e) => {
                state.bytesPerLine = parseInt(e.target.value, 10) || 0;
                renderOutput();
            });
        }

        // Copy & Download
        if (el.btnCopyOutput) {
            el.btnCopyOutput.addEventListener('click', () => {
                const text = el.cleanedOutput ? el.cleanedOutput.value : '';
                window.NullApp.copyToClipboard(text, 'Cleaned AoB copied to clipboard!');
            });
        }

        if (el.btnDownloadOutput) {
            el.btnDownloadOutput.addEventListener('click', () => {
                const text = el.cleanedOutput ? el.cleanedOutput.value : '';
                if (!text) {
                    window.NullApp.showToast('No content to export!');
                    return;
                }
                window.NullApp.downloadTextFile(`aob_cleaned_${Date.now()}.txt`, text);
            });
        }

        if (el.btnCopyCodePreview) {
            el.btnCopyCodePreview.addEventListener('click', () => {
                const code = el.codePreviewContent ? el.codePreviewContent.textContent : '';
                window.NullApp.copyToClipboard(code, 'Code snippet copied to clipboard!');
            });
        }

        // File Drag & Drop
        if (el.dropZone && el.fileUploader) {
            setupFileDrop(el.dropZone, el.fileUploader, handleUploadedFile);
        }
    }

    function setupFileDrop(dropEl, fileInput, handler) {
        ['dragenter', 'dragover'].forEach(name => {
            dropEl.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropEl.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(name => {
            dropEl.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropEl.classList.remove('drag-over');
            });
        });

        dropEl.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) handler(files[0]);
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) handler(e.target.files[0]);
        });
    }

    function handleUploadedFile(file) {
        if (!file) return;
        const reader = new FileReader();

        if (file.name.endsWith('.bin') || file.name.endsWith('.dat')) {
            reader.onload = (e) => {
                const buffer = e.target?.result as ArrayBuffer;
                const u8 = new Uint8Array(buffer);
                const hexArray = [];
                for (let i = 0; i < u8.length; i++) {
                    hexArray.push(u8[i].toString(16).padStart(2, '0').toUpperCase());
                }
                const hexStr = hexArray.join(' ');
                if (el.rawAobInput) el.rawAobInput.value = hexStr;
                state.rawInput = hexStr;
                processAoB();
                window.NullApp.showToast(`Loaded ${u8.length} bytes from ${file.name}`);
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (e) => {
                if (el.rawAobInput) el.rawAobInput.value = e.target.result;
                state.rawInput = (e.target?.result as string) || "";
                processAoB();
                window.NullApp.showToast(`Loaded ${file.name}`);
            };
            reader.readAsText(file);
        }
    }

    function parseHexBytes(str) {
        if (!str || !str.trim()) return [];
        let cleaned = str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        cleaned = cleaned.replace(/0x|0X|,|;|\\x|\\X/g, ' ');
        const tokens = cleaned.match(/[0-9A-Fa-f]{1,2}/g) || [];
        return tokens.map(t => t.padStart(2, '0').toUpperCase());
    }

    function processAoB() {
        const rawTokens = parseHexBytes(state.rawInput);
        const preserveTokens = parseHexBytes(state.preserveInput);
        const preserveSet = new Set(preserveTokens);

        state.parsedBytes = [];

        // Pre-calculate sequence matches if sequence granularity is selected
        const sequenceMatches = new Set();
        if (state.granularity === 'sequence' && preserveTokens.length > 0) {
            const seqLen = preserveTokens.length;
            for (let i = 0; i <= rawTokens.length - seqLen; i++) {
                let match = true;
                for (let j = 0; j < seqLen; j++) {
                    if (rawTokens[i + j] !== preserveTokens[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    for (let j = 0; j < seqLen; j++) sequenceMatches.add(i + j);
                }
            }
        }

        rawTokens.forEach((hex, idx) => {
            const isZero = (hex === '00');
            let isRuleMatched = false;

            if (state.granularity === 'byte') {
                isRuleMatched = preserveSet.has(hex);
            } else {
                isRuleMatched = sequenceMatches.has(idx);
            }

            let keep = false;
            if (state.filterMode === 'keep') {
                keep = isRuleMatched;
            } else {
                keep = !isRuleMatched;
            }

            // Zero Byte Policy
            if (isZero) {
                if (state.zeroPolicy === 'preserve') keep = true;
                else if (state.zeroPolicy === 'mask') keep = false;
            }

            state.parsedBytes.push({
                index: idx,
                originalHex: hex,
                isZero,
                isPreserved: keep
            });
        });

        renderOutput();
    }

    function renderOutput() {
        if (!el.cleanedOutput) return;

        if (state.parsedBytes.length === 0) {
            el.cleanedOutput.value = '';
            if (el.byteCountLabel) el.byteCountLabel.textContent = '0 bytes';
            if (el.charCountLabel) el.charCountLabel.textContent = '0 chars';
            if (el.codePreviewCard) el.codePreviewCard.classList.remove('visible');
            return;
        }

        const wildcard = state.wildcardToken;
        const isUpper = state.letterCase === 'upper';

        const tokens = state.parsedBytes.map(b => {
            if (b.isPreserved) {
                return isUpper ? b.originalHex.toUpperCase() : b.originalHex.toLowerCase();
            } else {
                return wildcard;
            }
        });

        let formattedText = '';
        const bpl = state.bytesPerLine;

        switch (state.activeFormat) {
            case 'standard': {
                if (bpl > 0) {
                    const lines = [];
                    for (let i = 0; i < tokens.length; i += bpl) {
                        lines.push(tokens.slice(i, i + bpl).join(' '));
                    }
                    formattedText = lines.join('\n');
                } else {
                    formattedText = tokens.join(' ');
                }
                if (el.codePreviewCard) el.codePreviewCard.classList.remove('visible');
                break;
            }

            case 'ida': {
                const idaTokens = state.parsedBytes.map(b => {
                    return b.isPreserved ? (isUpper ? b.originalHex.toUpperCase() : b.originalHex.toLowerCase()) : '?';
                });
                if (bpl > 0) {
                    const lines = [];
                    for (let i = 0; i < idaTokens.length; i += bpl) {
                        lines.push(idaTokens.slice(i, i + bpl).join(' '));
                    }
                    formattedText = lines.join('\n');
                } else {
                    formattedText = idaTokens.join(' ');
                }
                if (el.codePreviewCard) el.codePreviewCard.classList.remove('visible');
                break;
            }

            case 'compact': {
                formattedText = tokens.join('');
                if (el.codePreviewCard) el.codePreviewCard.classList.remove('visible');
                break;
            }

            case 'cpp-sig': {
                formattedText = tokens.join(' ');
                let sigPattern = '';
                let maskStr = '';

                state.parsedBytes.forEach(b => {
                    if (b.isPreserved) {
                        const h = isUpper ? b.originalHex.toUpperCase() : b.originalHex.toLowerCase();
                        sigPattern += `\\x${h}`;
                        maskStr += 'x';
                    } else {
                        sigPattern += '\\x00';
                        maskStr += '?';
                    }
                });

                if (el.codePreviewTitle) el.codePreviewTitle.textContent = 'C / C++ Memory Scanner Signature & Mask';
                if (el.codePreviewContent) {
                    el.codePreviewContent.textContent =
`// C/C++ Signature & Mask Pattern
const char* pattern = "${sigPattern}";
const char* mask    = "${maskStr}";
const size_t length = ${state.parsedBytes.length};`;
                }
                if (el.codePreviewCard) el.codePreviewCard.classList.add('visible');
                break;
            }

            case 'byte-array': {
                formattedText = tokens.join(' ');
                const hexArr = state.parsedBytes.map(b => {
                    const h = isUpper ? b.originalHex.toUpperCase() : b.originalHex.toLowerCase();
                    return `0x${h}`;
                });
                const maskChars = state.parsedBytes.map(b => (b.isPreserved ? 'x' : '?')).join('');

                if (el.codePreviewTitle) el.codePreviewTitle.textContent = 'C# / C++ Byte Array & Mask';
                if (el.codePreviewContent) {
                    el.codePreviewContent.textContent =
`// C# Byte Array & Mask
byte[] pattern = new byte[] { ${hexArr.join(', ')} };
string mask = "${maskChars}";`;
                }
                if (el.codePreviewCard) el.codePreviewCard.classList.add('visible');
                break;
            }
        }

        el.cleanedOutput.value = formattedText;
        if (el.byteCountLabel) el.byteCountLabel.textContent = `${state.parsedBytes.length.toLocaleString()} bytes`;
        if (el.charCountLabel) el.charCountLabel.textContent = `${formattedText.length.toLocaleString()} chars`;
    }

    return {
        init,
        getState: () => state,
        processAoB,
        parseHexBytes
    };
})();

if (typeof window !== 'undefined') window.Tool2AobCleaner = Tool2AobCleaner;
if (typeof globalThis !== 'undefined') (globalThis as any).Tool2AobCleaner = Tool2AobCleaner;
if (typeof module !== 'undefined' && module.exports) module.exports = Tool2AobCleaner;

