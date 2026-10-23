# NULL TOOLS — All-In-One Reverse Engineering Suite

<div align="center">
  <h3>⚡ Professional Multi-Tab Reverse Engineering & Memory Analysis Toolkit ⚡</h3>
  <p>Unified, zero-dependency browser-based suite combining 8 specialized reverse-engineering tools in one cyberpunk-styled dashboard.</p>
</div>

---

## 🚀 Overview

**NULL TOOLS** consolidates memory pattern scanning, Il2CppDumper symbol extraction, signature mask synthesis, AOB diffing, coordinate offset calculus, and multi-language byte formatting into a single cohesive SPA (Single Page Application).

Built with vanilla modern JavaScript (ES6+), semantic HTML5, and high-performance CSS3 adhering strictly to the **NULL™ Cyberpunk Design System** (pitch dark canvas `#070709`, neon crimson `#ef4444`, cyber cyan `#06b6d4`, electric violet `#8b5cf6`, and emerald `#10b981`).

---

## 🛠️ The 8 Integrated Tools

| Tab | Tool Name | Reference / Foundation | Key Capabilities |
|:---:|:---|:---|:---|
| **1** | **Bones Offset Finder** | *FireHawk Panels Bones Offset Finder* | Parses Il2Cpp `dump.cs` & `.so` binaries. Extracts 35+ player skeleton bones, field offsets, RVA methods, and generates ARM64/ARMv7 patch signatures. |
| **2** | **AOB Cleaner** | *AOB Cleaner (Signature Studio)* | Hex signature cleaner and sanitizer. Whitelists/masks opcodes, handles zero bytes (`00`), custom wildcards (`??`), and exports to IDA, C++, C# and Compact formats. |
| **3** | **AOB Merger** | *AOB Merger (Diff Tool)* | Compares two memory byte sequences byte-by-byte. Generates wildcard diffs (`??`) for divergent opcodes, detects length mismatches, and features one-click "Make It Same" auto-trim. |
| **4** | **Collider Offset** | *Collider Offset Converter* | Dual-mode memory calculator. Basic mode converts Read $\to$ Write ($0x48$) and Write $\to$ Read ($0x44$). Collider mode calculates target write offsets: $-(\text{Base} - \text{Target} - 0x54)$. |
| **5** | **Offsets Finder** | *Offsets Finder & Variations Engine* | Generates decremental memory step variations from Base Chest & Head offsets alongside byte sequence sliding windows. |
| **6** | **Offsets Calculator** | *Offsets Calculator (2-Tap Engine)* | Interactive memory stream visualizer. Calculates distance ($\Delta = \text{End} - \text{Start}$) and dynamically recalculates Read & Write anchors in real-time. |
| **7** | **Byte Forge** | *Null-Tools Original* | Bidirectional multi-language byte formatter. Converts patterns between C# array (`00 70 84 ??`), C++ header format (`0x00, 0x70, '?'`), and Python regex (`\x00\x70\x84.`). |
| **8** | **External Bones** | *Null-Tools Original* | Quick player bone delta generator. Computes 6 core skeleton offsets (Head $-0x4$, Neck $+0x4$, Neck Left $+0x34$, Neck Right $+0x30$, Left Shoulder $+0x40$, Right Shoulder $+0x44$) from a single Chest anchor. |

---

## 🌐 Architecture & Features

- **Single Page Application (SPA)**: Tab-based navigation preserving input state across tab switches without full page reloads.
- **Hash-Based Routing**: Direct URL deep links support browser back/forward buttons (e.g., `#bones-offset-finder`, `#aob-cleaner`, `#collider-offset`, `#byte-forge`).
- **Responsive Layout**: Designed for 4K desktop down to 360px mobile screens with horizontal smooth scrolling navigation tabs.
- **Sample Data Pre-loaded**: Each tool includes "⚡ Load Sample" buttons for instant evaluation and demonstration.
- **Zero External Dependencies**: Pure vanilla client-side execution with no npm build steps or server runtimes required.
- **Safe Clipboard & File Exports**: Copy directly to clipboard or export results to `.txt`, `.cs`, or `.cpp` files with single-click actions.

---

## 📁 Project Structure

```text
Null-Tools/
├── index.html                   # Master unified 8-tab HTML5 interface
├── manifest.json                # PWA web app manifest
├── README.md                    # Project documentation
├── test-suite.js                # 40-assertion automated unit/integration test runner
├── test-server.js               # Static HTTP asset health test runner
├── css/
│   └── style.css                # Unified NULL™ dark cyberpunk stylesheet
├── js/
│   ├── app.js                   # Master orchestrator & hash router
│   ├── sample-data.js           # Built-in sample dumps, AOB signatures, and test streams
│   ├── tool1-bones.js           # Tool 1: Bones Offset Finder logic
│   ├── tool2-aob-cleaner.js     # Tool 2: AOB Cleaner logic
│   ├── tool3-aob-merger.js      # Tool 3: AOB Merger logic
│   ├── tool4-collider.js        # Tool 4: Collider Offset calculator
│   ├── tool5-offsets-finder.js  # Tool 5: Offsets variations generator
│   ├── tool6-offsets-calc.js    # Tool 6: 2-Tap Offsets Calculator
│   ├── tool7-byte-forge.js      # Tool 7: Multi-language Byte Forge
│   └── tool8-external-bones.js  # Tool 8: External Bones Delta Calculator
└── icons/
    ├── icon-192.svg             # Application vector icon (192x192)
    └── icon-512.svg             # Application vector icon (512x512)
```

---

## 🧪 Testing & Verification

Automated test suites verify every calculation formula, parser, and HTTP asset:

### 1. Unit & Integration Test Suite
Executes 40 assertions verifying mathematical exactness and UI logic across all 8 tools:
```bash
node test-suite.js
```
*Output: `TEST SUMMARY: 40 PASSED, 0 FAILED`*

### 2. HTTP Server & Asset Health Check
Spins up a lightweight local server and checks status codes and byte sizes for all 16 assets:
```bash
node test-server.js
```
*Output: `ALL ASSETS VERIFIED: 100% HEALTHY HTTP 200`*

---

## 💻 Running the Application

### Option A: Direct Browser Launch
Double click `index.html` or open it directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.

### Option B: Local Web Server
```bash
# Using Node.js
npx serve .

# Or using Python
python -m http.server 8080
```
Navigate to `http://localhost:8080` in your web browser.

---

## 🔒 License & Integrity

- **Original Project Protection**: `Null-File-Downloader` was left completely untouched and intact during development.
- **Copyright**: © 2026 NULL™ ALL RIGHTS RESERVED.
