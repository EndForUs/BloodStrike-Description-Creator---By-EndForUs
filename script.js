const MAX_CHARS = 84;

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

        return ch;
    }).join('');
}

// ─────────────────────────────────────────────────
// CORE LOGIC
// ─────────────────────────────────────────────────

function updateOutput() {
    let finalString = '';

    if (currentMode === 'color-mode') {
        finalString = generateColorModeString();
    } else {
        finalString = generateGradientModeString();
    }

    const length = finalString.length;

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

    // Render Visualizer
    renderVisualizer(finalString);

    // Styling counter
    if (length > MAX_CHARS) {
        charCountEl.className = 'counter danger';
    } else if (length >= MAX_CHARS - 10) {
        charCountEl.className = 'counter warning';
    } else {
        charCountEl.className = 'counter';
    }
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
        if (currentStr.length > MAX_CHARS && (!e.inputType || !e.inputType.includes('delete'))) {
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
    if (generateColorModeString().length + 7 > MAX_CHARS) {
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
            <option value="monospace">𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎</option>
            <option value="fraktur">𝔉𝔯𝔞𝔨𝔱𝔲𝔯</option>
            <option value="scriptBold">𝓢𝓬𝓻𝓲𝓹𝓽 𝓑𝓸𝓵𝓭</option>
            <option value="wizard">Ⓦⓘⓩⓐⓡⓓ</option>
            <option value="fullWidth">Ｆｕｌｌ Ｗｉｄｔｈ</option>
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
    // Note: for character counting, use text.length (surrogate-pair aware via codePointAt is moot here;
    // the Unicode blocks used are all in BMP or handled via surrogate pairs counted as 2 JS chars).
    // We measure the raw string length for the 84-char budget.
    const textLen = text.length;
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
    if (text.length + 7 > MAX_CHARS && (!e.inputType || !e.inputType.includes('delete'))) {
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

// Init
updateOutput();
