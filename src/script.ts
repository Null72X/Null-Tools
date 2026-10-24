document.addEventListener('DOMContentLoaded', () => {
    // ── DOM refs ──
    const select = (document.getElementById as any)('conversionType');
    const input = (document.getElementById as any)('aobInput');
    const output = (document.getElementById as any)('aobOutput');
    const byteCountDisplay = (document.getElementById as any)('byteCountDisplay');
    const conversionLabel = (document.getElementById as any)('conversionLabel');
    const copyBtn = (document.getElementById as any)('copyBtn');
    const deleteBtn = (document.getElementById as any)('deleteBtn');
    const statusEl = (document.getElementById as any)('downloadStatus');
    const statusMsg = (document.getElementById as any)('statusMessage');

    // Bones refs
    const chestInput = (document.getElementById as any)('chestOffsetInput');
    const calcBtn = (document.getElementById as any)('calcBonesBtn');
    const bonesBody = (document.getElementById as any)('bonesBody');
    const bonesTable = (document.getElementById as any)('bonesTable');
    const bonesEmpty = (document.getElementById as any)('bonesEmpty');

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = {
        aob: (document.getElementById as any)('panel-aob'),
        bones: (document.getElementById as any)('panel-bones'),
    };

    let statusTimeout;

    function showStatus(message, icon = '⚡') {
        if (!statusEl) return;
        const iconSpan = statusEl.querySelector('span:first-child');
        if (iconSpan) iconSpan.textContent = icon;
        if (statusMsg) statusMsg.textContent = message;
        statusEl.classList.add('show');
        clearTimeout(statusTimeout);
        statusTimeout = setTimeout(() => {
            statusEl.classList.remove('show');
        }, 3000);
    }

    // ── Tab switching ──
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const tab = this.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            Object.keys(panels).forEach(key => {
                if (panels[key]) {
                    panels[key].classList.toggle('active', key === tab);
                }
            });
        });
    });

    // ── AOB conversion functions ──
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

    // ── Update AOB conversion ──
    function updateConversion() {
        if (!input || !output || !byteCountDisplay) return;
        const val = input.value.trim();
        if (!val) {
            output.textContent = '';
            byteCountDisplay.textContent = '0';
            return;
        }

        const bytes = val.split(/\s+/).filter(Boolean);
        byteCountDisplay.textContent = bytes.length;

        let result = '';
        const mode = select ? select.value : 'cs-cpp';
        switch (mode) {
            case 'cs-cpp':
                result = csToCpp(val);
                break;
            case 'cs-py':
                result = csToPython(val);
                break;
            case 'cpp-cs':
                result = cppToCs(val);
                break;
            case 'cpp-py':
                result = cppToPython(val);
                break;
            case 'py-cs':
                result = pyToCs(val);
                break;
            case 'py-cpp':
                result = pyToCpp(val);
                break;
            default:
                result = val;
        }
        output.textContent = result;
    }

    function updateLabel() {
        if (!select || !conversionLabel) return;
        const mode = select.value;
        const map = {
            'cs-cpp': 'C# → C++',
            'cs-py': 'C# → Python',
            'cpp-cs': 'C++ → C#',
            'cpp-py': 'C++ → Python',
            'py-cs': 'Python → C#',
            'py-cpp': 'Python → C++'
        };
        conversionLabel.textContent = map[mode] || 'C# → C++';
    }

    // ── Bones calculation ──
    function parseHex(str) {
        const clean = str.trim().replace(/^0x/i, '').replace(/^#/, '');
        if (!/^[0-9A-Fa-f]+$/.test(clean)) return null;
        return parseInt(clean, 16);
    }

    function toHexStr(num) {
        return '0x' + num.toString(16).toUpperCase().padStart(2, '0');
    }

    function calculateBones() {
        if (!chestInput || !bonesTable || !bonesEmpty || !bonesBody) return;
        const raw = chestInput.value.trim();
        const chestVal = parseHex(raw);
        if (chestVal === null) {
            bonesTable.style.display = 'none';
            bonesEmpty.style.display = 'block';
            bonesEmpty.innerHTML = '<span>⚠️ Invalid hex value. Please enter a valid offset like <code>0xA6</code> or <code>A6</code>.</span>';
            showStatus('Invalid hex value', '⚠️');
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

        bonesBody.innerHTML = rows.map(row => `
            <tr>
                <td class="bone-name">${row.name}</td>
                <td class="bone-offset">${row.offsetStr}</td>
            </tr>
        `).join('');

        bonesEmpty.style.display = 'none';
        bonesTable.style.display = 'table';
        showStatus(`Calculated ${rows.length} bone offsets from ${toHexStr(chestVal)}`, '🦴');
    }

    // ── Events: AOB ──
    if (input) input.addEventListener('input', updateConversion);

    if (select) {
        select.addEventListener('change', function () {
            updateLabel();
            updateConversion();
            showStatus('Switched to ' + this.options[this.selectedIndex].text, '🔄');
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            const text = output ? output.textContent : '';
            if (!text) {
                showStatus('Nothing to copy', '⚠️');
                return;
            }
            navigator.clipboard.writeText(text).then(() => {
                showStatus('Copied to clipboard!', '📋');
            }).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showStatus('Copied!', '📋');
            });
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
            if (input) input.value = '';
            if (output) output.textContent = '';
            if (byteCountDisplay) byteCountDisplay.textContent = '0';
            if (input) input.focus();
            showStatus('Cleared', '✕');
        });
    }

    // ── Events: Bones ──
    if (calcBtn) calcBtn.addEventListener('click', calculateBones);

    if (chestInput) {
        chestInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculateBones();
            }
        });
    }

    // ── Initialize Default State ──
    updateLabel();
    updateConversion();

    if (bonesEmpty && bonesTable) {
        bonesEmpty.style.display = 'block';
        bonesTable.style.display = 'none';
        bonesEmpty.innerHTML = '<span>Enter a chest offset and click calculate.</span>';
    }
});

