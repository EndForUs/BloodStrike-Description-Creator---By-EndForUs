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

// --- Core Logic ---

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

// --- Color Mode Functions ---

function generateColorModeString() {
    const blocks = document.querySelectorAll('.color-block');
    let result = '';
    blocks.forEach(block => {
        const color = block.querySelector('.block-color').value;
        const text = block.querySelector('.block-text').value;
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
        <button class="btn btn-remove">✕</button>
    `;

    block.querySelector('.btn-remove').addEventListener('click', () => {
        block.remove();

        // Hide remove button if only 1 left
        const remaining = document.querySelectorAll('.color-block');
        if (remaining.length === 1) {
            remaining[0].querySelector('.btn-remove').style.visibility = 'hidden';
        }

        updateOutput();
    });

    block.addEventListener('input', handleColorBlockInput);

    colorBlocksContainer.appendChild(block);

    // Show remove buttons if > 1
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.style.visibility = 'visible';
    });
}

btnAddBlock.addEventListener('click', createColorBlock);

// Attach listeners to initial block
document.querySelectorAll('.color-block').forEach(block => {
    block.addEventListener('input', handleColorBlockInput);
});

// --- Gradient Mode Functions ---

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

function generateGradientModeString() {
    const text = gradText.value;
    if (!text) return '';

    const c1 = hexToRgb(gradStart.value);
    const c2 = hexToRgb(gradEnd.value);

    let requestedSteps = parseInt(gradSteps.value) || 2;

    // Mathematically optimize steps
    const maxAllowedSteps = Math.floor((MAX_CHARS - text.length) / 7);

    let actualSteps = Math.min(requestedSteps, maxAllowedSteps);
    actualSteps = Math.min(actualSteps, text.length); // no more steps than chars
    actualSteps = Math.max(actualSteps, 1); // at least 1 color

    if (actualSteps * 7 + text.length > MAX_CHARS) {
        return '';
    }

    // Distribute text chunks
    let result = '';
    const chunkSize = text.length / actualSteps;

    for (let i = 0; i < actualSteps; i++) {
        const factor = actualSteps > 1 ? i / (actualSteps - 1) : 0;
        const interpolated = interpolateColor(c1, c2, factor);
        const hex = rgbToHex(interpolated.r, interpolated.g, interpolated.b);

        const startIdx = Math.round(i * chunkSize);
        const endIdx = Math.round((i + 1) * chunkSize);
        const chunkText = text.substring(startIdx, endIdx);

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

// --- Tabs ---
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

// --- Copy ---
btnCopy.addEventListener('click', () => {
    rawOutputEl.select();
    document.execCommand('copy');
    const originalText = btnCopy.textContent;
    btnCopy.textContent = 'Copied!';
    setTimeout(() => {
        btnCopy.textContent = originalText;
    }, 2000);
});

// Init
updateOutput();
