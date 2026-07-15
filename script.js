const MAX_CHARS = 84;

// Typographic Compatibility Info
const FONT_COMPATIBILITY = {
    none: {
        name: "Normal",
        pc: 100,
        mobile: 100,
        status: "safe",
        desc: "Fully compatible on PC and mobile. No visibility risks."
    },
    monospace: {
        name: "Monospace",
        pc: 100,
        mobile: 100,
        status: "safe",
        desc: "Fully compatible on PC and mobile. Excellent visibility."
    },
    fraktur: {
        name: "Fraktur",
        pc: 100,
        mobile: 100,
        status: "safe",
        desc: "Fully compatible on PC and mobile. Great gothic style."
    },
    scriptBold: {
        name: "Script Bold",
        pc: 85,
        mobile: 100,
        status: "stable",
        desc: "<b>Compatible on PC (85%)</b>. PC players will see this typography stably. On mobile it's 100% visible."
    },
    wizard: {
        name: "Wizard",
        pc: 0,
        mobile: 100,
        status: "crit",
        desc: "<b>Incompatible on PC (0%)</b>. PC players will see empty rectangles or broken glyphs. On mobile it's 100% visible."
    },
    fullWidth: {
        name: "Full Width",
        pc: 100,
        mobile: 100,
        status: "safe",
        desc: "Fully compatible on PC and mobile. Uses standard full-width Unicode characters."
    },
    frakturBold: {
        name: "Fraktur Bold",
        pc: 100,
        mobile: 100,
        status: "safe",
        desc: "Fully compatible on PC and mobile. Bolder gothic variant."
    },
    bold: {
        name: "Bold",
        pc: 100,
        mobile: 100,
        status: "safe",
        desc: "Fully compatible on PC and mobile. Clean bold mathematical style."
    },
    doubleStruck: {
        name: "Double-Struck",
        pc: 100,
        mobile: 100,
        status: "safe",
        desc: "Fully compatible on PC and mobile. Unique blackboard bold style, popular in gaming."
    },
    sansSerifBold: {
        name: "Sans-Serif Bold",
        pc: 100,
        mobile: 100,
        status: "safe",
        desc: "Fully compatible on PC and mobile. Modern clean sans-serif bold style."
    },
    script: {
        name: "Script",
        pc: 85,
        mobile: 100,
        status: "stable",
        desc: "<b>Compatible on PC (85%)</b>. PC players will see this typography stably. On mobile it's 100% visible."
    }
};

// UI Elements
const tabs = document.querySelectorAll('.tab');
const modes = document.querySelectorAll('.mode-content');
const charCountEl = document.getElementById('char-count');
const visualizerEl = document.getElementById('visualizer');
const rawOutputEl = document.getElementById('raw-output');
const btnCopy = document.getElementById('btn-copy');

// Color Mode Elements
const colorBlocksContainer = document.getElementById('color-blocks-container');
const btnAddBlock = document.getElementById('btn-add-block');

// Gradient Mode Elements
const gradStart = document.getElementById('grad-start');
const gradEnd = document.getElementById('grad-end');
const gradSteps = document.getElementById('grad-steps');
const gradText = document.getElementById('grad-text');

let currentMode = 'color-mode';

// ─────────────────────────────────────────────────
// UNICODE CONVERSION ENGINE
// ─────────────────────────────────────────────────

const UNICODE_MAPS = {
    monospace: {
        lower: 0x1D68A,  // 𝚊 = a
        upper: 0x1D670,  // 𝙰 = A
        digits: 0x1D7F6  // 𝟶 = 0
    },
    fraktur: {
        // Fraktur has exceptions; use direct char map for safety
        charMap: {
            a:'𝔞',b:'𝔟',c:'𝔠',d:'𝔡',e:'𝔢',f:'𝔣',g:'𝔤',h:'𝔥',i:'𝔦',j:'𝔧',k:'𝔨',l:'𝔩',m:'𝔪',
            n:'𝔫',o:'𝔬',p:'𝔭',q:'𝔮',r:'𝔯',s:'𝔰',t:'𝔱',u:'𝔲',v:'𝔳',w:'𝔴',x:'𝔵',y:'𝔶',z:'𝔷',
            A:'𝔄',B:'𝔅',C:'ℭ',D:'𝔇',E:'𝔈',F:'𝔉',G:'𝔊',H:'ℌ',I:'ℑ',J:'𝔍',K:'𝔎',L:'𝔏',M:'𝔐',
            N:'𝔑',O:'𝔒',P:'𝔓',Q:'𝔔',R:'ℜ',S:'𝔖',T:'𝔗',U:'𝔘',V:'𝔙',W:'𝔚',X:'𝔛',Y:'𝔜',Z:'ℨ'
        }
    },
    scriptBold: {
        lower: 0x1D4EA,  // 𝓪 = a
        upper: 0x1D4D0   // 𝓐 = A
    },
    wizard: {
        // Enclosed alphanumeric circles
        lower: 0x24D0,   // ⓐ = a
        upper: 0x24B6,   // Ⓐ = A
        digitMap: { '0':'⓪','1':'①','2':'②','3':'③','4':'④','5':'⑤','6':'⑥','7':'⑦','8':'⑧','9':'⑨' }
    },
    fullWidth: {
        lower: 0xFF41,   // ａ = a
        upper: 0xFF21,   // Ａ = A
        digits: 0xFF10   // ０ = 0
    },
    frakturBold: {
        lower: 0x1D586,  // 𝖆 = a
        upper: 0x1D56C   // 𝕬 = A
    },
    bold: {
        lower: 0x1D41A,  // 𝐚 = a
        upper: 0x1D400,  // 𝐀 = A
        digits: 0x1D7CE  // 𝟎 = 0
    },
    doubleStruck: {
        lower: 0x1D552,  // 𝕒 = a
        upper: 0x1D538,  // 𝔸 = A
        digits: 0x1D7D8, // 𝟘 = 0
        charMap: {
            'C': '\u2102', 'H': '\u210D', 'N': '\u2115', 'P': '\u2119',
            'Q': '\u211A', 'R': '\u211D', 'Z': '\u2124'
        }
    },
    sansSerifBold: {
        lower: 0x1D5EE,  // 𝗮 = a
        upper: 0x1D5D4,  // 𝗔 = A
        digits: 0x1D7EC  // 𝟬 = 0
    },
    script: {
        lower: 0x1D4B6,  // 𝒶 = a
        upper: 0x1D49C,  // 𝒜 = A
        charMap: {
            'B': '\u212C', 'E': '\u2130', 'F': '\u2131', 'H': '\u210B',
            'I': '\u2110', 'L': '\u2112', 'M': '\u2133', 'R': '\u211B',
            'e': '\u212F', 'g': '\u210A', 'o': '\u2134'
        }
    }
};

/**
 * Converts a code point to a JS string, handling surrogate pairs.
 * @param {number} cp - Unicode code point
 * @returns {string}
 */
function fromCodePoint(cp) {
    return String.fromCodePoint(cp);
}

/**
 * Convert a plain text string to a specified Unicode typographic style.
 * Uses Array.from() to correctly handle multi-byte Unicode chars.
 * @param {string} text - Input text
 * @param {string} style - Style key: 'none'|'monospace'|'fraktur'|'scriptBold'|'wizard'|'fullWidth'|'frakturBold'
 * @returns {string}
 */
function convertToUnicode(text, style) {
    if (!style || style === 'none') return text;

    const map = UNICODE_MAPS[style];
    if (!map) return text;

    // Iterate over characters properly (handles surrogate pairs)
    return Array.from(text).map(ch => {
        const code = ch.codePointAt(0);

        // Fraktur uses a pre-built char map because of exceptions (C, H, I, R, Z)
        if (style === 'fraktur') {
            return map.charMap[ch] || ch;
        }

        // Wizard uses a digit map and offset for letters
        if (style === 'wizard') {
            if (ch >= 'a' && ch <= 'z') return fromCodePoint(map.lower + (code - 0x61));
            if (ch >= 'A' && ch <= 'Z') return fromCodePoint(map.upper + (code - 0x41));
            if (map.digitMap[ch] !== undefined) return map.digitMap[ch];
            return ch;
        }

        // Styles with letter offsets only (no digit conversion)
        if (style === 'scriptBold') {
            if (ch >= 'a' && ch <= 'z') return fromCodePoint(map.lower + (code - 0x61));
            if (ch >= 'A' && ch <= 'Z') return fromCodePoint(map.upper + (code - 0x41));
            return ch;
        }

        // Styles with letters + digits (monospace, fullWidth)
        if (style === 'monospace' || style === 'fullWidth') {
            if (ch >= 'a' && ch <= 'z') return fromCodePoint(map.lower + (code - 0x61));
            if (ch >= 'A' && ch <= 'Z') return fromCodePoint(map.upper + (code - 0x41));
            if (ch >= '0' && ch <= '9') return fromCodePoint(map.digits + (code - 0x30));
            return ch;
        }

        // Fraktur Bold — letters only, no digit map defined
        if (style === 'frakturBold') {
            if (ch >= 'a' && ch <= 'z') return fromCodePoint(map.lower + (code - 0x61));
            if (ch >= 'A' && ch <= 'Z') return fromCodePoint(map.upper + (code - 0x41));
            return ch;
        }

        // Bold — letters + digits
        if (style === 'bold' || style === 'sansSerifBold') {
            if (ch >= 'a' && ch <= 'z') return fromCodePoint(map.lower + (code - 0x61));
            if (ch >= 'A' && ch <= 'Z') return fromCodePoint(map.upper + (code - 0x41));
            if (ch >= '0' && ch <= '9') return fromCodePoint(map.digits + (code - 0x30));
            return ch;
        }

        // Double-Struck — letters + digits, uppercase has exceptions
        if (style === 'doubleStruck') {
            if (ch >= 'a' && ch <= 'z') return fromCodePoint(map.lower + (code - 0x61));
            if (ch >= 'A' && ch <= 'Z') {
                if (map.charMap[ch]) return map.charMap[ch];
                return fromCodePoint(map.upper + (code - 0x41));
            }
            if (ch >= '0' && ch <= '9') return fromCodePoint(map.digits + (code - 0x30));
            return ch;
        }

        // Script — letters only (no digits), has upper + lower exceptions
        if (style === 'script') {
            if (map.charMap[ch]) return map.charMap[ch];
            if (ch >= 'a' && ch <= 'z') return fromCodePoint(map.lower + (code - 0x61));
            if (ch >= 'A' && ch <= 'Z') return fromCodePoint(map.upper + (code - 0x41));
            return ch;
        }

        return ch;
    }).join('');
}

// ─────────────────────────────────────────────────
// CORE LOGIC
// ─────────────────────────────────────────────────

/**
 * Checks whether any Unicode typography font is currently active.
 * @returns {boolean}
 */
function hasUnicodeFontActive() {
    if (currentMode === 'color-mode') {
        const blocks = document.querySelectorAll('.color-block');
        return Array.from(blocks).some(block => block.querySelector('.block-font').value !== 'none');
    } else {
        return getSelectedGradFont() !== 'none';
    }
}

function updateOutput() {
    let finalString = '';

    if (currentMode === 'color-mode') {
        finalString = generateColorModeString();
    } else {
        finalString = generateGradientModeString();
    }

    const unicodeActive = hasUnicodeFontActive();

    // Recalculate length taking into account Unicode fonts count as 2 characters (except spaces)
    const length = calculatePreservedLength(finalString, unicodeActive);

    // Count breakdown
    const hashCount = (finalString.match(/#/g) || []).length;
    const colorChars = hashCount * 7;
    const textChars = length - colorChars;

    // Update UI
    rawOutputEl.value = finalString;
    charCountEl.textContent = length;

    const colorCountEl = document.getElementById('color-count');
    const textCountEl = document.getElementById('text-count');
    if (colorCountEl) colorCountEl.textContent = colorChars;
    if (textCountEl) textCountEl.textContent = textChars;

    // Update Unicode multiplier badge
    const unicodeMultiplierEl = document.getElementById('unicode-multiplier');
    const unicodeBadge = document.getElementById('unicode-badge');
    if (unicodeMultiplierEl && unicodeBadge) {
        if (unicodeActive) {
            unicodeMultiplierEl.textContent = '×2';
            unicodeBadge.style.display = 'inline-flex';
        } else {
            unicodeMultiplierEl.textContent = '×1';
            unicodeBadge.style.display = 'none';
        }
    }

    // Render Visualizer
    renderVisualizer(finalString);

    // Render Compatibility Warnings
    renderCompatibilityWarnings();

    // Render Unicode Notices
    renderUnicodeNotices();

    // Styling counter
    if (length > MAX_CHARS) {
        charCountEl.className = 'counter danger';
    } else if (length >= MAX_CHARS - 10) {
        charCountEl.className = 'counter warning';
    } else {
        charCountEl.className = 'counter';
    }
}

/**
 * Calculates the character count as the game sees it.
 * When unicode fonts are active, each text character counts as 2 (except spaces).
 * Hex color codes always count as 1 per character.
 * @param {string} rawString - The generated string (with hex codes like #ffffff)
 * @param {boolean} unicodeActive - Whether unicode fonts are active
 * @returns {number}
 */
function calculatePreservedLength(rawString, unicodeActive) {
    if (!rawString) return 0;
    if (!unicodeActive) return rawString.length;

    // Split by hex codes so we can treat hex and text portions separately
    const regex = /(#[0-9A-Fa-f]{6})/g;
    const parts = rawString.split(regex);
    let totalLength = 0;

    parts.forEach(part => {
        if (part.match(regex)) {
            totalLength += 7; // # + 6 hex chars = 7, each counts as 1
        } else {
            // Text portion: each char counts as 2, spaces count as 1
            for (const char of part) {
                totalLength += (char === ' ' || char === '\t' || char === '\n') ? 1 : 2;
            }
        }
    });

    return totalLength;
}

/**
 * Renders the compatibility alerts dynamically below the configurations.
 */
function renderCompatibilityWarnings() {
    const colorContainer = document.getElementById('color-compatibility-container');
    const gradientContainer = document.getElementById('gradient-compatibility-container');
    
    if (currentMode === 'color-mode') {
        gradientContainer.innerHTML = '';
        
        // Find all selected fonts in color blocks
        const blocks = document.querySelectorAll('.color-block');
        const selectedFonts = new Set();
        blocks.forEach(block => {
            const font = block.querySelector('.block-font').value;
            if (font !== 'none') {
                selectedFonts.add(font);
            }
        });
        
        if (selectedFonts.size === 0) {
            colorContainer.innerHTML = '';
            return;
        }
        
        let html = '';
        selectedFonts.forEach(fontKey => {
            const info = FONT_COMPATIBILITY[fontKey];
            if (info) {
                const badgeClass = info.status === 'crit' ? 'crit' : (info.status === 'warn' ? 'warn' : (info.status === 'stable' ? 'stable' : ''));
                const tagClass = info.status === 'crit' ? 'tag-crit' : (info.status === 'warn' ? 'tag-warn' : (info.status === 'stable' ? 'tag-stable' : 'tag-safe'));
                const tagLabel = info.status === 'crit' ? 'Incompatible' : (info.status === 'warn' ? 'Warning' : (info.status === 'stable' ? 'Stable' : 'Compatible'));
                
                html += `
                    <div class="comp-alert ${badgeClass}">
                        <div class="comp-title">
                            <span>Font: ${info.name} (PC: ${info.pc}% | Mobile: ${info.mobile}%)</span>
                            <span class="comp-tag ${tagClass}">${tagLabel}</span>
                        </div>
                        <div class="comp-desc">${info.desc}</div>
                    </div>
                `;
            }
        });
        colorContainer.innerHTML = html;
        
    } else {
        colorContainer.innerHTML = '';
        
        const fontKey = getSelectedGradFont();
        if (fontKey === 'none') {
            gradientContainer.innerHTML = '';
            return;
        }
        
        const info = FONT_COMPATIBILITY[fontKey];
        if (info) {
            const badgeClass = info.status === 'crit' ? 'crit' : (info.status === 'warn' ? 'warn' : (info.status === 'stable' ? 'stable' : ''));
            const tagClass = info.status === 'crit' ? 'tag-crit' : (info.status === 'warn' ? 'tag-warn' : (info.status === 'stable' ? 'tag-stable' : 'tag-safe'));
            const tagLabel = info.status === 'crit' ? 'Incompatible' : (info.status === 'warn' ? 'Warning' : (info.status === 'stable' ? 'Stable' : 'Compatible'));
            
            gradientContainer.innerHTML = `
                <div class="comp-alert ${badgeClass}">
                    <div class="comp-title">
                        <span>Font: ${info.name} (PC: ${info.pc}% | Mobile: ${info.mobile}%)</span>
                        <span class="comp-tag ${tagClass}">${tagLabel}</span>
                    </div>
                    <div class="comp-desc">${info.desc}</div>
                </div>
            `;
        }
    }
}

/**
 * Renders the Unicode x2 weight notices separately from compatibility.
 */
function renderUnicodeNotices() {
    const colorNotice = document.getElementById('unicode-notice-color');
    const gradientNotice = document.getElementById('unicode-notice-gradient');
    if (!colorNotice || !gradientNotice) return;

    const unicodeActive = hasUnicodeFontActive();
    const container = currentMode === 'color-mode' ? colorNotice : gradientNotice;
    const otherContainer = currentMode === 'color-mode' ? gradientNotice : colorNotice;
    otherContainer.innerHTML = '';

    if (!unicodeActive) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="comp-alert unicode">
            <div class="comp-title">
                <span>Unicode Typography</span>
                <span class="comp-tag tag-unicode">×2 WEIGHT</span>
            </div>
            <div class="comp-desc">
                All characters using Unicode typography count as <b>2 characters each</b> in the game description (spaces count as 1). Plan your text to stay within the 84-character limit.
            </div>
        </div>
    `;
}

function renderVisualizer(rawString) {
    visualizerEl.innerHTML = '';
    if (!rawString) return;

    // Regex to find #RRGGBB
    const regex = /(#[0-9A-Fa-f]{6})/g;
    const parts = rawString.split(regex);

    let currentColor = '#ffffff'; // default

    parts.forEach(part => {
        if (part.match(regex)) {
            currentColor = part;
        } else if (part.length > 0) {
            const span = document.createElement('span');
            span.style.color = currentColor;
            span.textContent = part;
            visualizerEl.appendChild(span);
        }
    });
}

// ─────────────────────────────────────────────────
// COLOR MODE
// ─────────────────────────────────────────────────

function generateColorModeString() {
    const blocks = document.querySelectorAll('.color-block');
    let result = '';
    blocks.forEach(block => {
        const color = block.querySelector('.block-color').value;
        const rawText = block.querySelector('.block-text').value;
        const fontStyle = block.querySelector('.block-font').value;
        const text = convertToUnicode(rawText, fontStyle);
        if (text) {
            result += color.toLowerCase() + text;
        }
    });
    return result;
}

function handleColorBlockInput(e) {
    // Check length preemptively if typing text
    if (e.target.classList.contains('block-text')) {
        const currentStr = generateColorModeString();
        const calculatedLen = calculatePreservedLength(currentStr, hasUnicodeFontActive());
        if (calculatedLen > MAX_CHARS && (!e.inputType || !e.inputType.includes('delete'))) {
            e.target.value = e.target.value.slice(0, -1);
        }
    }
    updateOutput();
}

/**
 * Refreshes all remove button states:
 * - Index 0: always locked (grey, −, disabled)
 * - Index 1+: always active (red, ✕, enabled)
 */
function refreshRemoveButtons() {
    const blocks = document.querySelectorAll('.color-block');
    blocks.forEach((block, i) => {
        const btn = block.querySelector('.btn-remove');
        if (i === 0) {
            btn.textContent = '−';
            btn.classList.add('locked');
            btn.disabled = true;
        } else {
            btn.textContent = '✕';
            btn.classList.remove('locked');
            btn.disabled = false;
        }
    });
}

function createColorBlock() {
    if (calculatePreservedLength(generateColorModeString(), hasUnicodeFontActive()) + 7 > MAX_CHARS) {
        alert("Not enough characters left for a new color block!");
        return;
    }

    const block = document.createElement('div');
    block.className = 'input-group color-block';
    block.innerHTML = `
        <input type="color" value="#ffffff" class="block-color">
        <input type="text" placeholder="Type text..." class="block-text">
        <select class="block-font font-select">
            <option value="none">— Normal —</option>
            <option value="bold">𝐁𝐨𝐥𝐝</option>
            <option value="monospace">𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎</option>
            <option value="fraktur">𝔉𝔯𝔞𝔨𝔱𝔲𝔯</option>
            <option value="doubleStruck">𝔻𝕠𝕦𝕓𝕝𝕖-𝕊𝕥𝕣𝕦𝕔𝕜</option>
            <option value="sansSerifBold">𝗦𝗮𝗻𝘀-𝗦𝗲𝗿𝗶𝗳 𝗕𝗼𝗹𝗱</option>
            <option value="script">𝒮𝒸𝓇𝒾𝓅𝓉</option>
            <option value="scriptBold">𝓢𝓬𝓻𝓲𝓹𝓽 𝓑𝓸𝓵𝓭</option>
            <option value="wizard">Ⓦⓘⓩⓐⓡⓓ</option>
            <option value="fullWidth">Ｆｗ／Ｗｉｄｔｈ</option>
            <option value="frakturBold">𝕱𝖗𝖆𝖐𝖙𝖚𝖗 𝕭𝖔𝖑𝖉</option>
        </select>
        <button class="btn btn-remove">✕</button>
    `;

    block.querySelector('.btn-remove').addEventListener('click', () => {
        block.remove();
        refreshRemoveButtons();
        updateOutput();
    });

    block.addEventListener('input', handleColorBlockInput);
    block.addEventListener('change', handleColorBlockInput);

    colorBlocksContainer.appendChild(block);
    refreshRemoveButtons();
}

btnAddBlock.addEventListener('click', createColorBlock);

// Attach listeners to initial block
document.querySelectorAll('.color-block').forEach(block => {
    block.addEventListener('input', handleColorBlockInput);
    block.addEventListener('change', handleColorBlockInput);
});

// ─────────────────────────────────────────────────
// GRADIENT MODE
// ─────────────────────────────────────────────────

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toLowerCase();
}

function interpolateColor(color1, color2, factor) {
    const result = {
        r: Math.round(color1.r + factor * (color2.r - color1.r)),
        g: Math.round(color1.g + factor * (color2.g - color1.g)),
        b: Math.round(color1.b + factor * (color2.b - color1.b))
    };
    return result;
}

function getSelectedGradFont() {
    const selected = document.querySelector('input[name="grad-font"]:checked');
    return selected ? selected.value : 'none';
}

function generateGradientModeString() {
    const rawText = gradText.value;
    if (!rawText) return '';

    // Step 1: Convert to Unicode typography
    const fontStyle = getSelectedGradFont();
    const text = convertToUnicode(rawText, fontStyle);

    const c1 = hexToRgb(gradStart.value);
    const c2 = hexToRgb(gradEnd.value);

    let requestedSteps = parseInt(gradSteps.value) || 2;

    // Mathematically optimize steps
    // We measure the preserved string length for the 84-char budget.
    const textLen = calculatePreservedLength(text, fontStyle !== 'none');
    const maxAllowedSteps = Math.floor((MAX_CHARS - textLen) / 7);

    let actualSteps = Math.min(requestedSteps, maxAllowedSteps);
    // Count actual Unicode chars for steps limit
    const actualCharCount = Array.from(text).length;
    actualSteps = Math.min(actualSteps, actualCharCount); // no more steps than chars
    actualSteps = Math.max(actualSteps, 1); // at least 1 color

    if (actualSteps * 7 + textLen > MAX_CHARS) {
        return '';
    }

    // Step 2: Distribute text chunks and apply gradient colors
    let result = '';
    // Use Array.from to get proper Unicode chars (handles surrogate pairs)
    const chars = Array.from(text);
    const chunkSize = chars.length / actualSteps;

    for (let i = 0; i < actualSteps; i++) {
        const factor = actualSteps > 1 ? i / (actualSteps - 1) : 0;
        const interpolated = interpolateColor(c1, c2, factor);
        const hex = rgbToHex(interpolated.r, interpolated.g, interpolated.b);

        const startIdx = Math.round(i * chunkSize);
        const endIdx = Math.round((i + 1) * chunkSize);
        const chunkText = chars.slice(startIdx, endIdx).join('');

        if (chunkText) {
            result += hex + chunkText;
        }
    }

    return result;
}

function handleGradientInput(e) {
    const text = gradText.value;
    const fontStyle = getSelectedGradFont();
    const convertedText = convertToUnicode(text, fontStyle);
    const calculatedLen = calculatePreservedLength(convertedText, fontStyle !== 'none') + 7; // minimum 1 color code
    if (calculatedLen > MAX_CHARS && (!e.inputType || !e.inputType.includes('delete'))) {
        gradText.value = text.slice(0, -1);
    }
    updateOutput();
}

[gradStart, gradEnd, gradSteps, gradText].forEach(el => {
    el.addEventListener('input', handleGradientInput);
});

// Listen for font radio changes in gradient mode
document.querySelectorAll('input[name="grad-font"]').forEach(radio => {
    radio.addEventListener('change', updateOutput);
});

// ─────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        modes.forEach(m => m.classList.remove('active'));

        tab.classList.add('active');
        currentMode = tab.dataset.target;
        document.getElementById(currentMode).classList.add('active');

        updateOutput();
    });
});

// ─────────────────────────────────────────────────
// COPY
// ─────────────────────────────────────────────────
btnCopy.addEventListener('click', () => {
    const textToCopy = rawOutputEl.value;

    // Use modern Clipboard API with fallback
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            flashCopyButton();
        }).catch(() => {
            legacyCopy();
        });
    } else {
        legacyCopy();
    }
});

function legacyCopy() {
    rawOutputEl.select();
    document.execCommand('copy');
    flashCopyButton();
}

function flashCopyButton() {
    const originalText = btnCopy.textContent;
    btnCopy.textContent = 'Copied! ✓';
    btnCopy.style.background = '#10b981';
    setTimeout(() => {
        btnCopy.textContent = originalText;
        btnCopy.style.background = '';
    }, 2000);
}

// ─────────────────────────────────────────────────
// ADAPTIVE VIEWPORT SCALE
// On very narrow phones (< 400px logical width) we shrink
// the viewport scale so the card always fits on screen.
// This is done by rewriting the <meta name="viewport"> tag,
// which is the professional / standards-compliant approach.
// ─────────────────────────────────────────────────
(function applyAdaptiveScale() {
    const BASE_WIDTH = 400;   // design reference width (px)
    const MIN_SCALE  = 0.72;  // never shrink below 72%

    function updateViewportScale() {
        const screenW = window.screen.width;
        // Only adjust on "phone" class devices
        if (screenW >= BASE_WIDTH) {
            setViewport('width=device-width, initial-scale=1.0');
            return;
        }
        const scale = Math.max(MIN_SCALE, screenW / BASE_WIDTH);
        const rounded = Math.round(scale * 100) / 100;
        setViewport(`width=device-width, initial-scale=${rounded}`);
    }

    function setViewport(content) {
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    // Run once on load
    updateViewportScale();

    // Re-run if orientation changes (landscape ↔ portrait)
    window.addEventListener('orientationchange', () => {
        // Small delay so screen.width updates after rotation
        setTimeout(updateViewportScale, 150);
    });
})();

// Init
updateOutput();
