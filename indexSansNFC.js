let ytPlayer;
let nextStepAfterVideoGlobal = "";
let onVideoEndCallbackGlobal = null;

/**
 * Gère l'affichage des sections
 */
function showStep(stepId) {
    document.querySelectorAll('.step').forEach(div => div.style.display = 'none');
    document.getElementById(stepId).style.display = 'block';
}

/**
 * Logique YouTube (SPA)
 */
function playVideoSPA(videoId, nextStep, onEndCallback = null) {
    nextStepAfterVideoGlobal = nextStep;
    onVideoEndCallbackGlobal = onEndCallback;
    showStep('step-video');
    isVideoPlaying = true;

    console.log("Lecture vidéo : " + videoId);

    const onStateChange = (event) => {
        if (event.data === YT.PlayerState.ENDED) {
            console.log("Fin de vidéo détectée pour : " + videoId);
            isVideoPlaying = false;
            
            if (nextStepAfterVideoGlobal) {
                showStep(nextStepAfterVideoGlobal);
            }

            if (onVideoEndCallbackGlobal) {
                // On récupère le callback et on vide la globale avant l'appel 
                // pour éviter toute exécution multiple
                const callback = onVideoEndCallbackGlobal;
                onVideoEndCallbackGlobal = null;
                callback();
            }
        }
    };

    if (ytPlayer) {
        // Si le lecteur existe déjà, on change juste la vidéo. 
        // Le listener onStateChange initialisé à la création utilisera les 
        // valeurs à jour de nextStepAfterVideoGlobal et onVideoEndCallbackGlobal.
        ytPlayer.loadVideoById(videoId);
    } else {
        ytPlayer = new YT.Player('player', {
            height: '360',
            width: '100%',
            videoId: videoId,
            playerVars: { 'autoplay': 1, 'controls': 1, 'fs': 0, 'playsinline': 1 },
            events: {
                'onReady': (event) => {
                    event.target.playVideo();
                },
                'onStateChange': onStateChange
            }
        });
    }
}

/**
 * Gère une énigme générique (SPA)
 */
function showEnigmaSPA(title, prompt, correctCode, magicWord, videoId, nextStep, onEnd, imageUrl = null) {
    showStep('step-enigma');
    document.getElementById('enigma-title').textContent = "Énigme : " + title;
    document.getElementById('enigma-prompt').textContent = prompt;

    const enigmaImg = document.getElementById('enigma-image');
    if (enigmaImg) {
        if (imageUrl) {
            enigmaImg.src = imageUrl;
            enigmaImg.style.display = 'block';
        } else {
            enigmaImg.style.display = 'none';
        }
    }

    const input = document.getElementById('enigma-input');
    input.value = "";
    const btn = document.getElementById('btn-validate-enigma');
    
    // Clone the button to remove previous event listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', () => {
        if (input.value.trim().toLowerCase() === correctCode.toString().toLowerCase()) {
            alert("Bravo ! Le mot magique est : " + magicWord);
            if (videoId) {
                playVideoSPA(videoId, nextStep, onEnd);
            } else {
                // Passage direct à l'étape suivante si pas de vidéo (cas de Djouk)
                showStep(nextStep);
                if (onEnd) onEnd();
            }
        } else {
            alert("Code incorrect.");
        }
    });
}

/**
 * Machine à états de l'aventure (SPA)
 */
function runStep(character) {
    isVideoPlaying = false;

    switch(character) {
        case 'boum':
            showStep('step-scan-boum');
            document.getElementById('btn-validate-boum').onclick = () => {
                if (document.getElementById('input-code-boum').value.trim() === "45315") {
                    playVideoSPA("UNRJzmxo31E", "step-scan-mira", () => runStep('mira1'));
                } else { alert("Code incorrect."); }
            };
            break;
        case 'mira1':
            showStep('step-scan-mira');
            document.getElementById('btn-validate-mira1').onclick = () => {
                if (document.getElementById('input-code-mira1').value.trim() === "23213") {
                    playVideoSPA("jETXbuLCvUw", "step-scan-mira2", () => runStep('mira2'));
                } else { alert("Code incorrect."); }
            };
            break;
        case 'mira2':
            showStep('step-scan-mira2');
            document.getElementById('btn-validate-mira2').onclick = () => {
                if (document.getElementById('input-code-mira2').value.trim() === "27501") {
                    playVideoSPA("FIDshKLqOtk", "step-enigma", () => runStep('enigma-mira'));
                } else { alert("Code incorrect."); }
            };
            break;
        case 'enigma-mira':
            showEnigmaSPA("Mira", "Entrez le code à 4 chiffres :", "6037", "Tempete", "K_hXVDmC0iQ", "step-scan-thae", () => runStep('thae'));
            break;
        case 'thae':
            showStep('step-scan-thae');
            document.getElementById('btn-validate-thae').onclick = () => {
                if (document.getElementById('input-code-thae').value.trim() === "60357") {
                    playVideoSPA("b1aJZJZ0cyQ", "step-enigma", () => runStep('enigma-thae'));
                } else { alert("Code incorrect."); }
            };
            break;
        case 'enigma-thae':
            showEnigmaSPA("Thae", "Entrez le code à 4 chiffres :", "3154", "Ruisseau", "eXhbMt9OK0o", "step-scan-laya", () => runStep('laya'));
            break;
        case 'laya':
            showStep('step-scan-laya');
            document.getElementById('btn-validate-laya').onclick = () => {
                if (document.getElementById('input-code-laya').value.trim() === "45423") {
                    playVideoSPA("ED_R54hO4Bw", "step-enigma", () => runStep('enigma-laya'));
                } else { alert("Code incorrect."); }
            };
            break;
        case 'enigma-laya':
            showEnigmaSPA("Laya", "Le code est le nom d'un peuple :", "elfes", "Elfes", "MAZU5vb8_IE", "step-scan-djouk", () => runStep('djouk'), "./Image/carte4.jpg");
            break;
        case 'djouk':
            showStep('step-scan-djouk');
            document.getElementById('btn-validate-djouk').onclick = () => {
                if (document.getElementById('input-code-djouk').value.trim() === "38215") {
                    playVideoSPA("BwC6KA3HL1E", "step-enigma", () => runStep('enigma-djouk'));
                } else { alert("Code incorrect."); }
            };
            break;
        case 'enigma-djouk':
            // Pas de vidéo après Djouk, on va directement vers le scan de Yoko
            showEnigmaSPA("Djouk", "Entrez le code à 4 chiffres :", "4951", "Soigneur", null, "step-scan-yoko", () => runStep('yoko'));
            break;
        case 'yoko':
            showStep('step-scan-yoko');
            document.getElementById('btn-validate-yoko').onclick = () => {
                if (document.getElementById('input-code-yoko').value.trim() === "15194") {
                    playVideoSPA("3Cnn2wKyKI4", "step-scan-grejean", () => runStep('grejean'));
                } else { alert("Code incorrect."); }
            };
            break;
        case 'grejean':
            showStep('step-scan-grejean');
            document.getElementById('btn-validate-grejean').onclick = () => {
                if (document.getElementById('input-code-grejean').value.trim() === "24273") {
                    playVideoSPA("CECEiuVXbgM", "step-enigma", () => runStep('enigma-grejean'));
                } else { alert("Code incorrect."); }
            };
            break;
        case 'enigma-grejean':
            showEnigmaSPA("Grejean", "Entrez le code à 4 chiffres :", "8729", "Orienter", "76vW3eUV1TI", "step-scan-tilly", () => runStep('tilly'));
            break;
        case 'tilly':
            showStep('step-scan-tilly');
            document.getElementById('btn-validate-tilly').onclick = () => {
                if (document.getElementById('input-code-tilly').value.trim() === "93131") {
                    playVideoSPA("EPNYwGswkMk", "step-tilly-instructions", () => setupTillyInstructions());
                } else { alert("Code incorrect."); }
            };
            break;
        case 'tilly-to-boum':
            showStep('step-scan-boum2');
            document.getElementById('btn-validate-boum2').onclick = () => {
                if (document.getElementById('input-code-boum2').value.trim() === "08303") {
                    // Le code "Ae0s9CjHMJc" correspond au tag Boum 2 et à sa vidéo finale
                    playVideoSPA("Ae0s9CjHMJc", "step-endgame", () => runStep('endgame'));
                } else { alert("Code incorrect."); }
            };
            break;
        case 'endgame':
            showStep('step-endgame');
            break;
    }
}

/**
 * Gère les consignes de Tilly
 */
function setupTillyInstructions() {
    const instructions = [
        "Il y aura 6 consignes, si vous n'êtes pas assez nombreux, la première personne se redéplacera...",
        "1: Quelqu'un s'assoit sur le deuxième cailloux en partant de ma droite.",
        "2: Le suivant s'assoit sur le 5ème cailloux à droite de la première personne.",
        "3: Le prochain s'assoit sur le 3ème cailloux en partant de la gauche du dernier assis.",
        "4: Le suivant s'assoit sur le 2ème cailloux en partant à droite du précédent.",
        "5: Puis quelqu'un se place sur le 5ème cailloux à gauche.",
        "6: Le dernier reste assis, les autres vont chercher la rose des vents sur sa gauche en directtion du Verdier."
    ];
    let current = 0;
    const text = document.getElementById('tilly-text');
    const update = () => text.textContent = instructions[current];
    document.getElementById('tilly-prev').onclick = () => { if(current > 0) { current--; update(); }};
    document.getElementById('tilly-next').onclick = () => { if(current < instructions.length-1) { current++; update(); }};
    update();
    
    const btnValidate = document.getElementById('tilly-validate');
    btnValidate.onclick = () => {
        if (document.getElementById('tilly-input').value.trim() === "2610") {
            alert("Bravo ! Le mot magique est : Rocher");
            // C'EST ICI QUE SE FAIT LE PASSAGE À L'ÉTAPE SUIVANTE
            playVideoSPA("zHVlkUr5GsY", "step-scan-boum2", () => runStep('tilly-to-boum'));
        } else { alert("Code incorrect."); }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialisation du bouton d'aide (défini dans CommonFunctionSansNFC.js)
    if (typeof setupHelpTest === 'function') setupHelpTest();

    // Démarrage direct à l'étape Boum
    runStep('boum');
});

// L'API YouTube appelle cette fonction quand elle est prête
function onYouTubeIframeAPIReady() {
    console.log("YouTube API Ready");
}