/* ==========================================================================
   TOOL 8 — EXTERNAL BONES QUICK CALCULATOR
   Calculates 6 player bone offsets from a single chest offset
   ========================================================================== */

const Tool8ExternalBones = (function () {
    'use strict';

    let el: Record<string, any> = {};

    function init() {
        el = {
            chestInput: document.getElementById('quickChestInput'),
            calcBtn: document.getElementById('quickCalcBonesBtn'),
            bonesBody: document.getElementById('quickBonesBody'),
            bonesTable: document.getElementById('quickBonesTable'),
            bonesEmpty: document.getElementById('quickBonesEmpty'),
            btnSample: document.getElementById('quickBonesBtnSample')
        };

        bindEvents();
    }

    function parseHex(str) {
        if (!str) return null;
        const clean = str.trim().replace(/^0x/i, '').replace(/^#/, '');
        if (!/^[0-9A-Fa-f]+$/.test(clean)) return null;
        return parseInt(clean, 16);
    }

    function toHexStr(num) {
        return '0x' + num.toString(16).toUpperCase().padStart(2, '0');
    }

    function calculateBones() {
        if (!el.chestInput || !el.bonesTable || !el.bonesEmpty || !el.bonesBody) return;
        const raw = el.chestInput.value.trim();
        const chestVal = parseHex(raw);
        if (chestVal === null) {
            el.bonesTable.style.display = 'none';
            el.bonesEmpty.style.display = 'block';
            el.bonesEmpty.innerHTML = '<span>⚠️ Invalid hex value. Please enter a valid offset like <code>0xA6</code> or <code>A6</code>.</span>';
            window.NullApp.showToast('Invalid hex value');
            return;
        }

        const boneDefs = [
            { name: 'Head', delta: -0x4 },
            { name: 'Neck', delta: 0x4 },
            { name: 'Neck Left', delta: 0x34 },
            { name: 'Neck Right', delta: 0x30 },
            { name: 'Left Shoulder', delta: 0x40 },
            { name: 'Right Shoulder', delta: 0x44 },
        ];

        const rows = boneDefs.map(def => ({
            name: def.name,
            offsetStr: toHexStr(chestVal + def.delta)
        }));

        el.bonesBody.innerHTML = rows.map(row => `
            <tr>
                <td style="font-weight:600;color:var(--text-main);">${row.name}</td>
                <td>
                    <span class="chip-hex" style="color:var(--accent-red-hover);border-color:rgba(239,68,68,0.3);cursor:pointer;" onclick="window.NullApp.copyToClipboard('${row.offsetStr}', 'Copied ${row.name} offset!')">${row.offsetStr}</span>
                </td>
            </tr>
        `).join('');

        el.bonesEmpty.style.display = 'none';
        el.bonesTable.style.display = 'table';
        window.NullApp.showToast(`Calculated ${rows.length} bone offsets from ${toHexStr(chestVal)}`);
    }

    function bindEvents() {
        if (el.calcBtn) el.calcBtn.addEventListener('click', calculateBones);

        if (el.chestInput) {
            el.chestInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    calculateBones();
                }
            });
        }

        if (el.btnSample) {
            el.btnSample.addEventListener('click', function () {
                if (el.chestInput) el.chestInput.value = '0xA6';
                calculateBones();
            });
        }
    }

    return {
        init,
        calculateBones,
        parseHex,
        toHexStr
    };
})();

if (typeof window !== 'undefined') window.Tool8ExternalBones = Tool8ExternalBones;
if (typeof globalThis !== 'undefined') (globalThis as any).Tool8ExternalBones = Tool8ExternalBones;
if (typeof module !== 'undefined' && module.exports) module.exports = Tool8ExternalBones;
