/* ==========================================================================
   TOOL 5 — OFFSETS FINDER (NECK AIMBOT OFFSET & AOB VARIATION GENERATOR)
   Byte-by-byte shifting, parallel decrementing offset pairs, multi-view export
   ========================================================================== */

const Tool5OffsetsFinder = (function () {
    'use strict';

    let currentView = 'grid'; // 'grid', 'raw', 'code'
    let el = {};

    function init() {
        el = {
            aobInput: document.getElementById('finderAobInput'),
            chestInput: document.getElementById('finderChestInput'),
            headInput: document.getElementById('finderHeadInput'),

            aobDetectedFormat: document.getElementById('finderAobDetectedFormat'),
            chestDetectedFormat: document.getElementById('finderChestDetectedFormat'),
            headDetectedFormat: document.getElementById('finderHeadDetectedFormat'),

            countSlider: document.getElementById('finderCountSlider'),
            countNumInput: document.getElementById('finderCountNumInput'),
            sliderValDisplay: document.getElementById('finderSliderValDisplay'),

            lowercaseToggle: document.getElementById('finderLowercaseToggle'),
            prefixToggle: document.getElementById('finderPrefixToggle'),

            tabGridBtn: document.getElementById('finderTabGrid'),
            tabRawBtn: document.getElementById('finderTabRaw'),
            tabCodeBtn: document.getElementById('finderTabCode'),

            resultsContainer: document.getElementById('finderResultsContainer'),

            btnPresetSample: document.getElementById('finderBtnPresetSample'),
            btnFormatAob: document.getElementById('finderBtnFormatAob'),
            btnClearInputs: document.getElementById('finderBtnClearInputs'),

            btnCopyAobsOnly: document.getElementById('finderBtnCopyAobsOnly'),
            btnCopyAllData: document.getElementById('finderBtnCopyAllData'),
            btnDownloadTxt: document.getElementById('finderBtnDownloadTxt')
        };

        bindEvents();
        updateCalculations();
    }

    function bindEvents() {
        if (el.aobInput) el.aobInput.addEventListener('input', updateCalculations);
        if (el.chestInput) el.chestInput.addEventListener('input', updateCalculations);
        if (el.headInput) el.headInput.addEventListener('input', updateCalculations);

        if (el.countSlider && el.countNumInput && el.sliderValDisplay) {
            el.countSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10) || 1;
                el.countNumInput.value = val;
                el.sliderValDisplay.textContent = val;
                updateCalculations();
            });

            el.countNumInput.addEventListener('input', (e) => {
                let val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) val = 1;
                if (val > 500) val = 500;
                el.countSlider.value = Math.min(val, 100);
                el.sliderValDisplay.textContent = val;
                updateCalculations();
            });
        }

        if (el.lowercaseToggle) el.lowercaseToggle.addEventListener('change', updateCalculations);
        if (el.prefixToggle) el.prefixToggle.addEventListener('change', updateCalculations);

        // View Tabs
        if (el.tabGridBtn) el.tabGridBtn.addEventListener('click', () => switchView('grid'));
        if (el.tabRawBtn) el.tabRawBtn.addEventListener('click', () => switchView('raw'));
        if (el.tabCodeBtn) el.tabCodeBtn.addEventListener('click', () => switchView('code'));

        // Presets
        if (el.btnPresetSample) {
            el.btnPresetSample.addEventListener('click', () => {
                if (el.aobInput) el.aobInput.value = SAMPLE_DATA.offsetsFinderAob;
                if (el.chestInput) el.chestInput.value = SAMPLE_DATA.offsetsFinderChest;
                if (el.headInput) el.headInput.value = SAMPLE_DATA.offsetsFinderHead;
                updateCalculations();
                window.NullApp.showToast('Loaded sample AOB signature & offsets (b8 / b4)!');
            });
        }

        if (el.btnFormatAob) {
            el.btnFormatAob.addEventListener('click', () => {
                const parsed = parseAOBInput(el.aobInput ? el.aobInput.value : '');
                if (!parsed.valid) {
                    window.NullApp.showToast('Invalid AOB input to format!');
                    return;
                }
                const isLower = el.lowercaseToggle ? el.lowercaseToggle.checked : false;
                const formatted = parsed.tokens.map(t => isLower ? t.toLowerCase() : t.toUpperCase()).join(' ');
                if (el.aobInput) el.aobInput.value = formatted;
                updateCalculations();
                window.NullApp.showToast(`Formatted ${parsed.count} AOB bytes!`);
            });
        }

        if (el.btnClearInputs) {
            el.btnClearInputs.addEventListener('click', () => {
                if (el.aobInput) el.aobInput.value = '';
                if (el.chestInput) el.chestInput.value = '';
                if (el.headInput) el.headInput.value = '';
                updateCalculations();
                window.NullApp.showToast('Cleared Offsets Finder inputs');
            });
        }

        // Action buttons
        if (el.btnCopyAobsOnly) {
            el.btnCopyAobsOnly.addEventListener('click', () => {
                const items = getCalculatedItems();
                if (!items.length) {
                    window.NullApp.showToast('No variations to copy!');
                    return;
                }
                const text = items.map(i => i.aob).join('\n');
                window.NullApp.copyToClipboard(text, `Copied ${items.length} AOB variations!`);
            });
        }

        if (el.btnCopyAllData) {
            el.btnCopyAllData.addEventListener('click', () => {
                const items = getCalculatedItems();
                if (!items.length) {
                    window.NullApp.showToast('No data to copy!');
                    return;
                }
                const text = generateRawText(items);
                window.NullApp.copyToClipboard(text, `Copied all ${items.length} offset variations!`);
            });
        }

        if (el.btnDownloadTxt) {
            el.btnDownloadTxt.addEventListener('click', () => {
                const items = getCalculatedItems();
                if (!items.length) {
                    window.NullApp.showToast('No data to save!');
                    return;
                }
                const text = generateRawText(items);
                window.NullApp.downloadTextFile('aob_offsets_variations.txt', text);
            });
        }
    }

    function switchView(view) {
        currentView = view;
        [el.tabGridBtn, el.tabRawBtn, el.tabCodeBtn].forEach(b => {
            if (b) b.classList.remove('active');
        });
        if (view === 'grid' && el.tabGridBtn) el.tabGridBtn.classList.add('active');
        if (view === 'raw' && el.tabRawBtn) el.tabRawBtn.classList.add('active');
        if (view === 'code' && el.tabCodeBtn) el.tabCodeBtn.classList.add('active');
        updateCalculations();
    }

    function parseAOBInput(str) {
        if (!str || !str.trim()) return { valid: false, tokens: [], count: 0 };
        const trimmed = str.trim();
        let rawTokens = trimmed.split(/[\s,]+/);

        // Continuous hex string fallback
        if (rawTokens.length === 1 && rawTokens[0].length > 4 && rawTokens[0].length % 2 === 0) {
            const m = rawTokens[0].match(/.{1,2}/g);
            if (m) rawTokens = m;
        }

        const cleanTokens = rawTokens.filter(t => t.length > 0);
        if (cleanTokens.length === 0) return { valid: false, tokens: [], count: 0 };

        return {
            valid: true,
            tokens: cleanTokens,
            count: cleanTokens.length
        };
    }

    function parseOffsetInput(str) {
        if (!str) return { valid: false };
        const clean = str.trim();
        if (!clean) return { valid: false };

        let val = NaN;
        if (/^0x/i.test(clean) || /[a-f]/i.test(clean)) {
            val = parseInt(clean.replace(/^0x/i, ''), 16);
        } else {
            val = parseInt(clean, 16); // Default treats numeric as hex or check
        }

        if (isNaN(val) || val < 0) return { valid: false };
        return { valid: true, value: val };
    }

    function getCalculatedItems() {
        const aobRaw = el.aobInput ? el.aobInput.value : '';
        const chestRaw = el.chestInput ? el.chestInput.value : '';
        const headRaw = el.headInput ? el.headInput.value : '';

        const aobParsed = parseAOBInput(aobRaw);
        const chestParsed = parseOffsetInput(chestRaw);
        const headParsed = parseOffsetInput(headRaw);

        if (!aobParsed.valid || !chestParsed.valid || !headParsed.valid) return [];

        const count = parseInt(el.countNumInput ? el.countNumInput.value : 20, 10) || 20;
        const isLower = el.lowercaseToggle ? el.lowercaseToggle.checked : false;
        const usePrefix = el.prefixToggle ? el.prefixToggle.checked : false;

        const items = [];
        for (let i = 0; i < count; i++) {
            const chestVal = chestParsed.value - i;
            const headVal = headParsed.value - i;
            if (chestVal < 0 || headVal < 0) break;

            const remainingTokens = aobParsed.tokens.slice(i);
            if (remainingTokens.length === 0) break;

            let chestHex = chestVal.toString(16);
            let headHex = headVal.toString(16);

            if (!isLower) {
                chestHex = chestHex.toUpperCase();
                headHex = headHex.toUpperCase();
            }
            if (usePrefix) {
                chestHex = '0x' + chestHex;
                headHex = '0x' + headHex;
            }

            const aobStr = remainingTokens.map(t => isLower ? t.toLowerCase() : t.toUpperCase()).join(' ');

            items.push({
                index: i,
                chestHex,
                headHex,
                chestDec: chestVal,
                headDec: headVal,
                aob: aobStr,
                byteCount: remainingTokens.length
            });
        }
        return items;
    }

    function updateCalculations() {
        const aobRaw = el.aobInput ? el.aobInput.value : '';
        const chestRaw = el.chestInput ? el.chestInput.value : '';
        const headRaw = el.headInput ? el.headInput.value : '';

        const aobParsed = parseAOBInput(aobRaw);
        const chestParsed = parseOffsetInput(chestRaw);
        const headParsed = parseOffsetInput(headRaw);

        if (el.aobDetectedFormat) {
            if (aobParsed.valid) {
                el.aobDetectedFormat.textContent = `${aobParsed.count} Bytes`;
                el.aobDetectedFormat.className = 'badge badge-emerald';
            } else {
                el.aobDetectedFormat.textContent = 'Invalid / Empty';
                el.aobDetectedFormat.className = 'badge badge-red';
            }
        }

        if (el.chestDetectedFormat) {
            if (chestParsed.valid) {
                el.chestDetectedFormat.textContent = `0x${chestParsed.value.toString(16).toUpperCase()} (${chestParsed.value})`;
                el.chestDetectedFormat.className = 'badge badge-cyan';
            } else {
                el.chestDetectedFormat.textContent = 'Invalid';
                el.chestDetectedFormat.className = 'badge badge-red';
            }
        }

        if (el.headDetectedFormat) {
            if (headParsed.valid) {
                el.headDetectedFormat.textContent = `0x${headParsed.value.toString(16).toUpperCase()} (${headParsed.value})`;
                el.headDetectedFormat.className = 'badge badge-purple';
            } else {
                el.headDetectedFormat.textContent = 'Invalid';
                el.headDetectedFormat.className = 'badge badge-red';
            }
        }

        const items = getCalculatedItems();
        if (!el.resultsContainer) return;

        if (items.length === 0) {
            el.resultsContainer.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-muted);border:1px dashed var(--border);border-radius:var(--radius-md);">
                    <div style="font-size:1.8rem;margin-bottom:8px;">🎯</div>
                    <p>Enter a valid AOB sequence and Chest &amp; Head offsets above to generate variations.</p>
                </div>
            `;
            return;
        }

        if (currentView === 'grid') renderGrid(items);
        else if (currentView === 'raw') renderRaw(items);
        else if (currentView === 'code') renderCode(items);
    }

    function renderGrid(items) {
        let html = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:65px">Step</th>
                            <th style="width:130px">Chest Offset</th>
                            <th style="width:130px">Head Offset</th>
                            <th>AOB Signature Variations (-1 Byte / Step)</th>
                            <th style="width:140px;text-align:right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        items.forEach(item => {
            html += `
                <tr>
                    <td><span class="badge badge-purple">+${item.index}</span></td>
                    <td><span class="chip-hex" style="color:#38bdf8;border-color:rgba(56,189,248,0.3);">${esc(item.chestHex)}</span> <span style="font-size:0.75rem;color:var(--text-dim);font-family:var(--font-mono);">(${item.chestDec})</span></td>
                    <td><span class="chip-hex" style="color:#f43f5e;border-color:rgba(244,63,94,0.3);">${esc(item.headHex)}</span> <span style="font-size:0.75rem;color:var(--text-dim);font-family:var(--font-mono);">(${item.headDec})</span></td>
                    <td>
                        <span class="badge badge-emerald" style="margin-right:6px;">${item.byteCount} B</span>
                        <span class="chip-aob" style="max-width:320px;" title="${esc(item.aob)}">${esc(item.aob)}</span>
                    </td>
                    <td style="text-align:right">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="window.NullApp.copyToClipboard('${esc(item.aob)}', 'Copied AOB variation +${item.index}!')">AOB</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="window.NullApp.copyToClipboard('Chest: ${esc(item.chestHex)} | Head: ${esc(item.headHex)} | AOB: ${esc(item.aob)}')">Full</button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        el.resultsContainer.innerHTML = html;
    }

    function renderRaw(items) {
        const text = generateRawText(items);
        el.resultsContainer.innerHTML = `
            <textarea class="form-textarea" style="min-height:360px;" readonly spellcheck="false">${esc(text)}</textarea>
        `;
    }

    function renderCode(items) {
        let code = `// C# Structure Array for AOB Offset Variations\npublic class OffsetVariation\n{\n    public int Step;\n    public int ChestOffset;\n    public int HeadOffset;\n    public string AobPattern;\n}\n\npublic static readonly OffsetVariation[] Variations = new OffsetVariation[]\n{\n`;

        items.forEach(i => {
            code += `    new OffsetVariation { Step = ${i.index}, ChestOffset = 0x${i.chestDec.toString(16).toUpperCase()}, HeadOffset = 0x${i.headDec.toString(16).toUpperCase()}, AobPattern = "${i.aob}" },\n`;
        });

        code += `};\n`;
        el.resultsContainer.innerHTML = `
            <textarea class="form-textarea" style="min-height:360px;" readonly spellcheck="false">${esc(code)}</textarea>
        `;
    }

    function generateRawText(items) {
        return items.map(i => `Step +${i.index} | Chest: ${i.chestHex} | Head: ${i.headHex} | AOB (${i.byteCount}B): ${i.aob}`).join('\n');
    }

    function esc(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    return {
        init,
        updateCalculations,
        parseAOBInput,
        parseOffsetInput,
        getCalculatedItems
    };
})();

if (typeof window !== 'undefined') window.Tool5OffsetsFinder = Tool5OffsetsFinder;
if (typeof globalThis !== 'undefined') globalThis.Tool5OffsetsFinder = Tool5OffsetsFinder;
if (typeof module !== 'undefined' && module.exports) module.exports = Tool5OffsetsFinder;
