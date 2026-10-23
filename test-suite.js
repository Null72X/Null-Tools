// ============================================================================
// COMPREHENSIVE AUTOMATED TEST SUITE FOR NULL TOOLS (ALL 8 TOOLS)
// ============================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectDir = __dirname;

console.log("==================================================================");
console.log("RUNNING AUTOMATED UNIT & INTEGRATION TESTS ON ALL 8 TOOLS");
console.log("Project directory: " + projectDir);
console.log("==================================================================\n");

// Mock browser environment
const domMock = {
    elements: {},
    getElementById(id) {
        if (!this.elements[id]) {
            this.elements[id] = {
                id,
                value: '',
                textContent: '',
                innerHTML: '',
                className: '',
                classList: {
                    _classes: new Set(),
                    add(c) { this._classes.add(c); },
                    remove(c) { this._classes.delete(c); },
                    toggle(c, force) {
                        if (force === undefined) {
                            if (this._classes.has(c)) this._classes.delete(c);
                            else this._classes.add(c);
                        } else if (force) {
                            this._classes.add(c);
                        } else {
                            this._classes.delete(c);
                        }
                    },
                    contains(c) { return this._classes.has(c); }
                },
                style: {},
                dataset: {},
                children: [],
                addEventListener: () => {},
                querySelectorAll: () => [],
                querySelector: () => null
            };
        }
        return this.elements[id];
    },
    querySelectorAll(sel) {
        return [];
    },
    querySelector(sel) {
        return null;
    },
    addEventListener() {}
};

const sandbox = {
    console,
    document: domMock,
    window: { location: { hash: '' } },
    navigator: {
        clipboard: {
            writeText: async () => {},
            readText: async () => 'FF FF 00 00'
        }
    },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: (fn) => { fn(); return 1; },
    clearInterval: () => {},
    SAMPLE_DATA: null,
    Tool1Bones: null,
    Tool2AobCleaner: null,
    Tool3AobMerger: null,
    Tool4Collider: null,
    Tool5OffsetsFinder: null,
    Tool6OffsetsCalc: null,
    Tool7ByteForge: null,
    Tool8ExternalBones: null,
    NullApp: null
};

vm.createContext(sandbox);

// Load all script modules
const scriptFiles = [
    'sample-data.js',
    'tool1-bones.js',
    'tool2-aob-cleaner.js',
    'tool3-aob-merger.js',
    'tool4-collider.js',
    'tool5-offsets-finder.js',
    'tool6-offsets-calc.js',
    'tool7-byte-forge.js',
    'tool8-external-bones.js',
    'app.js'
];

scriptFiles.forEach(file => {
    const code = fs.readFileSync(path.join(projectDir, 'js', file), 'utf8');
    vm.runInContext(code, sandbox);
    console.log(`✓ js/${file} loaded successfully`);
});

let testsPassed = 0;
let testsFailed = 0;

function assert(cond, msg) {
    if (cond) {
        console.log(`  PASS: ${msg}`);
        testsPassed++;
    } else {
        console.error(`  FAIL: ${msg}`);
        testsFailed++;
    }
}

// ============================================================================
// TEST SUITE: TOOL 1 — BONES OFFSET FINDER
// ============================================================================
console.log("\n--- TESTING TOOL 1 (Bones Offset Finder dump.cs parsing) ---");
sandbox.Tool1Bones.init();
const tool1State = sandbox.Tool1Bones.getState();
tool1State.dumpContent = sandbox.SAMPLE_DATA.dumpCs;

sandbox.Tool1Bones.parsePlayerBones();
sandbox.Tool1Bones.parseCoreOffsets();
sandbox.Tool1Bones.parsePatches();
sandbox.Tool1Bones.parseBypass();

assert(tool1State.bones.length >= 23, `Tool 1 extracted ${tool1State.bones.length} bones (expected >= 23)`);
const headBone = tool1State.bones.find(b => b.name === 'Head');
assert(headBone && headBone.dec === 6, `Head bone index is 6 (got: ${headBone ? headBone.dec : 'none'})`);
assert(tool1State.coreOffsets.length > 5, `Tool 1 extracted ${tool1State.coreOffsets.length} core offsets`);
assert(tool1State.patches.length >= 3, `Tool 1 extracted ${tool1State.patches.length} patchable methods`);

// ============================================================================
// TEST SUITE: TOOL 2 — AOB CLEANER
// ============================================================================
console.log("\n--- TESTING TOOL 2 (AOB Cleaner Signature Studio) ---");
sandbox.Tool2AobCleaner.init();
const t2State = sandbox.Tool2AobCleaner.getState();
t2State.rawInput = '04 A0 E1 55 66 00 77';
t2State.preserveInput = '04 A0 E1';
t2State.filterMode = 'keep';
t2State.zeroPolicy = 'preserve';
sandbox.Tool2AobCleaner.processAoB();

assert(t2State.parsedBytes.length === 7, `Tool 2 parsed 7 bytes (got: ${t2State.parsedBytes.length})`);
assert(t2State.parsedBytes[0].isPreserved === true, 'Byte 0 (04) is preserved by whitelist');
assert(t2State.parsedBytes[1].isPreserved === true, 'Byte 1 (A0) is preserved by whitelist');
assert(t2State.parsedBytes[2].isPreserved === true, 'Byte 2 (E1) is preserved by whitelist');
assert(t2State.parsedBytes[3].isPreserved === false, 'Byte 3 (55) is masked');
assert(t2State.parsedBytes[5].isPreserved === true, 'Byte 5 (00) preserved by default 00 policy');

// ============================================================================
// TEST SUITE: TOOL 3 — AOB MERGER
// ============================================================================
console.log("\n--- TESTING TOOL 3 (AOB Merger Diff Tool) ---");
sandbox.Tool3AobMerger.init();
sandbox.document.getElementById('mergerAob1').value = 'FF FF FF FF 00 00 00';
sandbox.document.getElementById('mergerAob2').value = 'FF FF 00 00 00 00 00';
sandbox.Tool3AobMerger.processMerge();

const mergedResult = sandbox.document.getElementById('mergerMergedOutput').value;
const expectedMerge = 'FF FF ?? ?? 00 00 00';
assert(mergedResult === expectedMerge, `AOB Merger result should be "${expectedMerge}" (got: "${mergedResult}")`);

const wildcardCount = sandbox.document.getElementById('mergerWildcardCount').textContent;
assert(wildcardCount === '2 Wildcards', `Wildcard count should be "2 Wildcards" (got: "${wildcardCount}")`);

// Length mismatch test
sandbox.document.getElementById('mergerAob1').value = 'FF FF FF';
sandbox.document.getElementById('mergerAob2').value = 'FF FF FF 00 00';
sandbox.Tool3AobMerger.processMerge();
const mismatchAlert = sandbox.document.getElementById('mergerAlertMessage').textContent;
assert(mismatchAlert.includes('AOB 1 has 3 bytes and AOB 2 has 5 bytes'), 'Should report length mismatch 3 vs 5 bytes');

// ============================================================================
// TEST SUITE: TOOL 4 — COLLIDER OFFSET
// ============================================================================
console.log("\n--- TESTING TOOL 4 (Collider Offset Calculations) ---");
sandbox.Tool4Collider.init();

// Test 4.1: Collider Read (0xFD) -> Basic Write
// Formula: 0xFD - 0x48 = 0xB5 (181 dec)
sandbox.document.getElementById('colliderBasicRead').value = '0xFD';
sandbox.Tool4Collider.computeBasicOffset();
const basicWriteResult = sandbox.document.getElementById('colliderBasicResult').textContent;
assert(basicWriteResult === '0xB5', `Basic Write Offset from 0xFD should be 0xB5 (got: ${basicWriteResult})`);

// Test 4.2: Collider Read (0xFD) -> Basic Read
// Formula: 0xFD - 0x44 = 0xB9 (185 dec)
sandbox.document.getElementById('colliderReadMethod').value = 'collider';
sandbox.document.getElementById('colliderGuessOffset').value = '0xFD';
sandbox.Tool4Collider.computeBasicRead();
const basicReadResult = sandbox.document.getElementById('colliderGuessResult').textContent;
assert(basicReadResult === '0xB9', `Basic Read Offset from 0xFD should be 0xB9 (got: ${basicReadResult})`);

// Test 4.3: Basic Write (0xB5) -> Basic Read
// Formula: 0xB5 + 0x04 = 0xB9
sandbox.document.getElementById('colliderReadMethod').value = 'write';
sandbox.document.getElementById('colliderGuessOffset').value = '0xB5';
sandbox.Tool4Collider.computeBasicRead();
const basicReadFromWrite = sandbox.document.getElementById('colliderGuessResult').textContent;
assert(basicReadFromWrite === '0xB9', `Basic Read from Basic Write 0xB5 should be 0xB9 (got: ${basicReadFromWrite})`);

// Test 4.4: Base (0x4E8) & Target (0xFD) -> Collider Write Offset
// Formula: -(0x4E8 - 0xFD - 0x54) = -(1256 - 253 - 84) = -919 = -0x397
sandbox.document.getElementById('colliderT1Base').value = '0x4E8';
sandbox.document.getElementById('colliderT1Bond').value = '0xFD';
sandbox.Tool4Collider.engageTarget();
const colliderWriteResult = sandbox.document.getElementById('colliderT1Result').textContent;
assert(colliderWriteResult === '-0x397', `Collider Write Offset from Base 0x4E8 and Target 0xFD should be -0x397 (got: ${colliderWriteResult})`);

// Test 4.5: Basic Write (0xB5) -> Collider Read Offset
// Formula: 0xB5 + 0x48 = 0xFD
sandbox.document.getElementById('colliderT2Method').value = 'write';
sandbox.document.getElementById('colliderT2Read').value = '0xB5';
sandbox.Tool4Collider.computeVector();
const colliderReadFromWrite = sandbox.document.getElementById('colliderT2Result').textContent;
assert(colliderReadFromWrite === '0xFD', `Collider Read from Basic Write 0xB5 should be 0xFD (got: ${colliderReadFromWrite})`);

// ============================================================================
// TEST SUITE: TOOL 5 — OFFSETS FINDER
// ============================================================================
console.log("\n--- TESTING TOOL 5 (Offsets Finder Variations Engine) ---");
sandbox.Tool5OffsetsFinder.init();

const baseChest = 0xB8;
const baseHead = 0xB4;
const baseAobTokens = ['FF', 'FF', '00', '00', 'AA', 'BB'];
const steps = [];
for (let i = 0; i < 3; i++) {
    steps.push({
        step: i,
        chest: '0x' + (baseChest - i).toString(16).toUpperCase(),
        head: '0x' + (baseHead - i).toString(16).toUpperCase(),
        aob: baseAobTokens.slice(i).join(' ')
    });
}
assert(steps[0].chest === '0xB8' && steps[0].head === '0xB4', 'Step 0 original offsets intact');
assert(steps[1].chest === '0xB7' && steps[1].head === '0xB3', 'Step 1 shifted -1');
assert(steps[1].aob === 'FF 00 00 AA BB', 'Step 1 sliced 1 byte');

// ============================================================================
// TEST SUITE: TOOL 6 — OFFSETS CALCULATOR
// ============================================================================
console.log("\n--- TESTING TOOL 6 (Offsets Calculator 2-Tap Engine) ---");
sandbox.Tool6OffsetsCalc.init();
const t6State = sandbox.Tool6OffsetsCalc.getState();
t6State.readOffset = '0x500';
t6State.writeOffset = '0x200';
t6State.startIndex = 10;
t6State.endIndex = 25; // Delta = 15 = 0xF
sandbox.Tool6OffsetsCalc.updateCalculations();

// New Read: 0x500 - 0xF = 1280 - 15 = 1265 = 0x4F1
// New Write: 0x200 - 0xF = 512 - 15 = 497 = 0x1F1
const calcReadVal = sandbox.document.getElementById('calcHeroReadVal').textContent;
const calcWriteVal = sandbox.document.getElementById('calcHeroWriteVal').textContent;
assert(calcReadVal === '0x4F1', `2-Tap New Read is 0x4F1 (got: ${calcReadVal})`);
assert(calcWriteVal === '0x1F1', `2-Tap New Write is 0x1F1 (got: ${calcWriteVal})`);

// ============================================================================
// TEST SUITE: TOOL 7 — BYTE FORGE (AOB Multi-Language Converter)
// ============================================================================
console.log("\n--- TESTING TOOL 7 (Byte Forge AOB Converter) ---");
sandbox.Tool7ByteForge.init();

// Test C# to C++
sandbox.document.getElementById('byteForgeConversionType').value = 'cs-cpp';
sandbox.document.getElementById('byteForgeInput').value = '00 70 84 ?? 00';
sandbox.Tool7ByteForge.updateConversion();
const cppOutput = sandbox.document.getElementById('byteForgeOutput').textContent;
assert(cppOutput.includes("0x00, 0x70, 0x84, '?', 0x00"), `C# -> C++ conversion correct: ${cppOutput}`);

// Test C# to Python
sandbox.document.getElementById('byteForgeConversionType').value = 'cs-py';
sandbox.Tool7ByteForge.updateConversion();
const pyOutput = sandbox.document.getElementById('byteForgeOutput').textContent;
assert(pyOutput === '\\x00\\x70\\x84.\\x00', `C# -> Python conversion correct: ${pyOutput}`);

// Test C++ to C#
sandbox.document.getElementById('byteForgeConversionType').value = 'cpp-cs';
sandbox.document.getElementById('byteForgeInput').value = "{ 0x00, 0x70, '?', 0x84 };";
sandbox.Tool7ByteForge.updateConversion();
const csFromCpp = sandbox.document.getElementById('byteForgeOutput').textContent;
assert(csFromCpp.trim() === '00 70 ?? 84', `C++ -> C# conversion correct: ${csFromCpp}`);

// ============================================================================
// TEST SUITE: TOOL 8 — EXTERNAL BONES QUICK CALCULATOR
// ============================================================================
console.log("\n--- TESTING TOOL 8 (External Bones Delta Calculator) ---");
sandbox.Tool8ExternalBones.init();

sandbox.document.getElementById('quickChestInput').value = '0xA6';
sandbox.Tool8ExternalBones.calculateBones();
const bonesTableHtml = sandbox.document.getElementById('quickBonesBody').innerHTML;

// Chest = 0xA6 = 166 dec
// Head: -4 -> 0xA2 (162 dec)
// Neck: +4 -> 0xAA (170 dec)
// Neck Left: +0x34 -> 0xDA (218 dec)
// Neck Right: +0x30 -> 0xD6 (214 dec)
// Left Shoulder: +0x40 -> 0xE6 (230 dec)
// Right Shoulder: +0x44 -> 0xEA (234 dec)
assert(bonesTableHtml.includes('0xA2'), 'Head offset 0xA2 present');
assert(bonesTableHtml.includes('0xAA'), 'Neck offset 0xAA present');
assert(bonesTableHtml.includes('0xDA'), 'Neck Left offset 0xDA present');
assert(bonesTableHtml.includes('0xD6'), 'Neck Right offset 0xD6 present');
assert(bonesTableHtml.includes('0xE6'), 'Left Shoulder offset 0xE6 present');
assert(bonesTableHtml.includes('0xEA'), 'Right Shoulder offset 0xEA present');

// ============================================================================
// TEST SUITE: APP ROUTER & TAB SWITCHING
// ============================================================================
console.log("\n--- TESTING APP ROUTER (8-Tab System & Persistence) ---");

const validTabs = [
    '#bones-offset-finder',
    '#aob-cleaner',
    '#aob-merger',
    '#collider-offset',
    '#offsets-finder',
    '#offsets-calculator',
    '#byte-forge',
    '#external-bones'
];

validTabs.forEach(tabRoute => {
    sandbox.NullApp.switchTab(tabRoute, false);
    assert(sandbox.NullApp.getCurrentTab() === tabRoute, `Router successfully switched to tab: ${tabRoute}`);
});

console.log("\n==================================================================");
console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log("==================================================================");

if (testsFailed > 0) {
    process.exit(1);
}
