let data = null;

// Seeded random function to ensure shared URLs stay consistent
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

fetch('data.json')
    .then(response => response.json())
    .then(json => {
        data = json;
        init();
    });

function init() {
    const spiceInput = document.getElementById('spice');
    const spiceVal = document.getElementById('spice-val');

    spiceInput.addEventListener('input', (e) => {
        spiceVal.innerText = e.target.value;
    });

    document.getElementById('generate-btn').addEventListener('click', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const seed = urlParams.get('seed');
        generateExcuse(seed ? parseInt(seed) : null);
    });

    document.getElementById('reroll-btn').addEventListener('click', () => {
        const newSeed = Math.floor(Math.random() * 1000000);
        const url = new URL(window.location.href);
        url.searchParams.set('seed', newSeed);
        window.history.pushState({}, '', url);
        generateExcuse(newSeed);
    });

    document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
    document.getElementById('save-btn').addEventListener('click', saveToTxt);
    document.getElementById('share-btn').addEventListener('click', shareExcuse);

    // Check if there's a seed in URL on load
    const urlParams = new URLSearchParams(window.location.search);
    const initialSeed = urlParams.get('seed');
    if (initialSeed) {
        generateExcuse(parseInt(initialSeed));
    }
}

function generateExcuse(seed) {
    if (!data) return;

    const spice = parseInt(document.getElementById('spice').value);
    
    // Logic to pick random items using seed
    const getWord = (bankKey, useAbsurd) => {
        const bank = data.wordBanks[bankKey];
        let pool = [];
        
        if (bankKey === 'reasons') {
            pool = data.wordBanks.reasons;
            if (useAbsurd) pool = pool.concat(data.wordBanks.absurd_reasons);
        } else {
            pool = bank;
        }

        // Use seeded random or standard random
        let index;
        if (seed !== null) {
            // Simple hash-based selection for seed consistency
            index = Math.floor(seededRandom(seed + (bankKey.length * 13)) * pool.length);
        } else {
            index = Math.floor(Math.random() * pool.length);
        }
        return pool[index];
    };

    const useAbsurd = spice > 50;

    const template = data.templates[seed !== null ? Math.floor(seededRandom(seed + 1) * data.templates.length) : Math.floor(Math.random() * data.templates.length)];
    const action = getWord('actions', false);
    const reason = getWord('reasons', useAbsurd);
    const mistake = getWord('mistakes', false);
    const obj = getWord('objects', false);
    const verb = getWord('verbs', false);
    const loc = getWord('locations', false);

    let result = template
        .replace('[ACTION]', action)
        .replace('[REASON]', reason)
        .replace('[MISTAKE]', mistake)
        .replace('[a/an_OBJECT]', obj)
        .replace('[VERB]', verb)
        .replace('[LOCATION]', loc);

    // Grammar fix
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    if (vowels.includes(obj.charAt(0).toLowerCase())) {
        result = result.replace(/a [aeiou]/i, 'an $1');
    }

    document.getElementById('excuse-display').innerText = result;

    // Update Meters
    updateMeter('meter-belief', 'stamp-belief', 100 - (spice * 0.8));
    updateMeter('meter-chaos', 'stamp-chaos', spice * 0.9);
    updateMeter('meter-risk', 'stamp-risk', (spice * 0.6) + (seed !== null ? 20 : Math.random() * 40));
}

function updateMeter(barId, stampId, value) {
    const bar = document.getElementById(barId);
    const stamp = document.getElementById(stampId);
    
    bar.style.width = '0%';
    stamp.style.opacity = '0';
    stamp.style.transform = 'rotate(-20deg) scale(1)';

    setTimeout(() => {
        bar.style.width = Math.min(100, Math.max(0, value)) + '%';
        stamp.style.opacity = '1';
        stamp.style.transform = 'rotate(-20deg) scale(1.2)';
    }, 50);
}

function copyToClipboard() {
    const text = document.getElementById('excuse-display').innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert("Excuse copied to clipboard!");
    });
}

function saveToTxt() {
    const text = document.getElementById('excuse-display').innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const anchor = document.createElement('a');
    anchor.download = 'my_deluxe_excuse.txt';
    anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
    anchor.click();
}

async function shareExcuse() {
    const text = document.getElementById('excuse-display').innerText;
    const shareData = {
        title: 'My Deluxe Excuse',
        text: text,
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Web Share not supported. Link copied to clipboard!");
        }
    } catch (err) {
        console.error(err);
    }
}
