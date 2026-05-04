let ytPlayer;
let nextStepAfterVideo = "";
let currentTargetCode = null;
let currentTargetCallback = null;
let nfcReader = null;
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

    // On "oublie" le code cible pendant la vidéo pour l'ignorer logiciellement
    currentTargetCode = null;
    currentTargetCallback = null;

    console.log("Lecture vidéo : " + videoId);

    if (ytPlayer) {
        ytPlayer.loadVideoById(videoId);
    } else {
        ytPlayer = new YT.Player('player', {
            height: '360',
            width: '100%',
            videoId: videoId,
            playerVars: { 'autoplay': 1, 'controls': 1, 'fs': 1, 'playsinline': 0 },
            events: {
                'onReady': (event) => {
                    event.target.playVideo();
                },
                'onStateChange': (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        isVideoPlaying = false;
                        showStep(nextStepAfterVideoGlobal);

                        if (onVideoEndCallbackGlobal) {
                            onVideoEndCallbackGlobal();
                        }
                    }
                }
            }
        });
    }
}

/**
 * Logique NFC (SPA)
 */
async function activateNFC(targetCode, callback) {
    if (!('NDEFReader' in window)) {
        alert("NFC non supporté.");
        return;
    }

    // On s'assure d'être en plein écran paysage AVANT de lancer le scan
    // car le changement d'orientation peut interrompre la session NFC
    await enterImmersiveMode();
    await new Promise(resolve => setTimeout(resolve, 300));

    currentTargetCode = targetCode;
    currentTargetCallback = callback;
    console.log("Recherche logicielle activée pour : " + targetCode);

    try {
        if (!nfcReader) {
            nfcReader = new NDEFReader();
        }
        
        // On tente de lancer le scan. 
        // Si déjà actif, on attrape l'erreur sans bloquer.
        try {
            await nfcReader.scan();
        } catch (scanError) {
            if (scanError.name !== 'InvalidStateError') throw scanError;
        }
        
        nfcReader.onreading = (event) => {
            // RÈGLE D'OR : Si vidéo en cours ou pas de cible, on ignore TOUT
            if (isVideoPlaying || !currentTargetCode) {
                return;
            }

            const decoder = new TextDecoder();
            for (const record of event.message.records) {
                const codeNFC = decoder.decode(record.data).trim();
                
                if (codeNFC === currentTargetCode) {
                    console.log("Tag valide détecté : " + codeNFC);
                    
                    // On "consomme" le tag : on vide la cible pour ignorer les lectures suivantes
                    currentTargetCode = null;
                    
                    if (navigator.vibrate) navigator.vibrate(200);
                    if (currentTargetCallback) currentTargetCallback();
                    break;
                }
            }
        };

        nfcReader.onreadingerror = () => {
            console.error("Erreur de lecture NFC.");
        };

    } catch (error) {
        alert("Erreur NFC : " + error);
    }
}

/**
 * Active le plein écran et force le mode paysage
 */
async function enterImmersiveMode() {
    try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            await elem.webkitRequestFullscreen();
        }
        // Verrouille l'orientation en paysage si l'API est supportée
        if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape').catch(err => console.log("Orientation lock failed:", err));
        }
    } catch (err) {
        console.log("Immersion refusée :", err);
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
    currentTargetCode = null;
    currentTargetCallback = null;
    isVideoPlaying = false;

    switch(character) {
        case 'boum':
            // Le scan Boum démarre automatiquement après la validation du code du jour
            showStep('step-scan-boum');
            document.getElementById('title-scan-boum').textContent = "Scan en cours...";
            activateNFC("UNRJzmxo31E", () => {
                playVideoSPA("UNRJzmxo31E", "step-scan-mira", () => runStep('mira1'));
            });
            break;
        case 'mira1':
            showStep('step-scan-mira');
            activateNFC("jETXbuLCvUw", () => playVideoSPA("jETXbuLCvUw", "step-scan-mira2", () => runStep('mira2')));
            break;
        case 'mira2':
            showStep('step-scan-mira2');
            activateNFC("FIDshKLqOtk", () => playVideoSPA("FIDshKLqOtk", "step-enigma", () => runStep('enigma-mira')));
            break;
        case 'enigma-mira':
            showEnigmaSPA("Mira", "Entrez le code à 4 chiffres :", "6037", "Tempete", "K_hXVDmC0iQ", "step-scan-thae", () => runStep('thae'));
            break;
        case 'thae':
            showStep('step-scan-thae');
            activateNFC("b1aJZJZ0cyQ", () => playVideoSPA("b1aJZJZ0cyQ", "step-enigma", () => runStep('enigma-thae')));
            break;
        case 'enigma-thae':
            showEnigmaSPA("Thae", "Entrez le code à 4 chiffres :", "3154", "Ruisseau", "eXhbMt9OK0o", "step-scan-laya", () => runStep('laya'));
            break;
        case 'laya':
            showStep('step-scan-laya');
            activateNFC("ED_R54hO4Bw", () => playVideoSPA("ED_R54hO4Bw", "step-enigma", () => runStep('enigma-laya')));
            break;
        case 'enigma-laya':
            showEnigmaSPA("Laya", "Le code est le nom d'un peuple :", "elfes", "Elfes", "MAZU5vb8_IE", "step-scan-djouk", () => runStep('djouk'), "./Image/carte4.jpg");
            break;
        case 'djouk':
            showStep('step-scan-djouk');
            activateNFC("BwC6KA3HL1E", () => playVideoSPA("BwC6KA3HL1E", "step-enigma", () => runStep('enigma-djouk')));
            break;
        case 'enigma-djouk':
            // Pas de vidéo après Djouk, on va directement vers le scan de Yoko
            showEnigmaSPA("Djouk", "Entrez le code à 4 chiffres :", "4951", "Soigneur", null, "step-scan-yoko", () => runStep('yoko'));
            break;
        case 'yoko':
            showStep('step-scan-yoko');
            activateNFC("3Cnn2wKyKI4", () => playVideoSPA("3Cnn2wKyKI4", "step-scan-grejean", () => runStep('grejean')));
            break;
        case 'grejean':
            showStep('step-scan-grejean');
            activateNFC("CECEiuVXbgM", () => playVideoSPA("CECEiuVXbgM", "step-enigma", () => runStep('enigma-grejean')));
            break;
        case 'enigma-grejean':
            showEnigmaSPA("Grejean", "Entrez le code à 4 chiffres :", "8729", "Orienter", "76vW3eUV1TI", "step-scan-tilly", () => runStep('tilly'));
            break;
        case 'tilly':
            showStep('step-scan-tilly');
            activateNFC("EPNYwGswkMk", () => playVideoSPA("EPNYwGswkMk", "step-tilly-instructions", () => setupTillyInstructions()));
            break;
        case 'tilly-to-boum':
            showStep('step-scan-boum2');
            // Le code "Ae0s9CjHMJc" correspond au tag Boum 2 et à sa vidéo finale
            activateNFC("Ae0s9CjHMJc", () => playVideoSPA("Ae0s9CjHMJc", "step-endgame", () => runStep('endgame')));
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
    // Initialisation du bouton d'aide (défini dans CommonFunction.js)
    if (typeof setupHelpTest === 'function') setupHelpTest();

    // --- ÉTAPE 0 : Activation NFC ---
    const btnActivate = document.getElementById('btn-activate-adventure');
    if (btnActivate) {
        btnActivate.addEventListener('click', async () => {
            await enterImmersiveMode(); // On attend que le mode paysage soit stable
            activateNFC("CrEoDgReIrC", () => {
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                showStep('step-start');
            });
            btnActivate.textContent = "Recherche du tag...";
        }, { once: true });
    }

    // --- ÉTAPE 1 : Code de départ ---
    const btnValidateCode = document.getElementById('btn-validate-code');
    btnValidateCode.addEventListener('click', () => {
        const input = document.getElementById('code-input').value;
        
        // Calcul du code dynamique (idem StartGame.js)
        const maintenant = new Date();
        const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
        const jour = String(maintenant.getDate()).padStart(2, '0');
        const codeCorrect = (parseInt("2" + mois + jour) * 2).toString();

        if (input === codeCorrect || input === "1234") { // 1234 pour test rapide
            runStep('boum');
        } else {
            alert("Code incorrect.");
        }
    });

    // --- ÉTAPE 2 : Scan Boum ---
});

// L'API YouTube appelle cette fonction quand elle est prête
function onYouTubeIframeAPIReady() {
    console.log("YouTube API Ready");
}