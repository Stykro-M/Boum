// Fichier de fonctions communes

// Verrou pour éviter les doubles scans NFC ou les redirections multiples
var isNFCProcessing = false; 
var nfcAbortController = null;
var isVideoPlaying = false;

/**
 * Configure le bouton d'aide
 */
function setupHelp(message) {
    const btnHelp = document.getElementById('btn-help');
    if (btnHelp) {
        btnHelp.addEventListener('click', () => {
            const userInput = prompt("Rentrez le nom du personnage sur la planchette devant vous puis scannez la, ou tapez carte");
            
            if (userInput === null) return; // L'utilisateur a cliqué sur Annuler

            const text = userInput.trim().toLowerCase();

            // Détecte si on est dans la version SPA (test.html)
            const isSPA = typeof showStep === 'function';

            // Si on change d'étape via l'aide, on s'assure que le système ne croit pas qu'une vidéo joue
            if (isSPA) {
                isVideoPlaying = false;
            }

            switch (text) {
                case "mira":
                    window.location.href = 'BoumToMira.html';
                    if (isSPA) showStep('step-scan-mira');
                    else window.location.href = 'BoumToMira.html';
                    break;
                case "thae":
                case "tahe": // Gère l'erreur de frappe du code original
                    window.location.href = 'MiraToThae.html';
                    if (isSPA) alert("Étape Thae non encore créée dans le test SPA");
                    else window.location.href = 'MiraToThae.html';
                    break;
                case "laya":
                    window.location.href = 'ThaeToLaya.html';
                    if (!isSPA) window.location.href = 'ThaeToLaya.html';
                    break;
                case "djouk":
                    window.location.href = 'LayaToDjouk.html';
                    if (!isSPA) window.location.href = 'LayaToDjouk.html';
                    break;
                case "yoko":
                    window.location.href = 'DjoukToYoko.html';
                    if (!isSPA) window.location.href = 'DjoukToYoko.html';
                    break;
                case "grejean":
                    window.location.href = 'YokoToGrejean.html';
                    if (!isSPA) window.location.href = 'YokoToGrejean.html';
                    break;
                case "tilly":
                    window.location.href = 'GrejeanToTilly.html';
                    if (!isSPA) window.location.href = 'GrejeanToTilly.html';
                    break;
                case "boum":
                    window.location.href = 'TillyToBoum.html';
                    if (isSPA) showStep('step-scan-boum');
                    else window.location.href = 'TillyToBoum.html';
                    break;
                case "carte":
                    // Affiche l'image par-dessus la page actuelle sans la quitter
                    const overlay = document.createElement('div');
                    overlay.style.position = 'fixed';
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.width = '100%';
                    overlay.style.height = '100%';
                    overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
                    overlay.style.zIndex = '10000';
                    overlay.style.display = 'flex';
                    overlay.style.justifyContent = 'center';
                    overlay.style.alignItems = 'center';
                    overlay.style.cursor = 'zoom-out';
                    overlay.innerHTML = '<img src="./Image/carteall.jpg" style="max-width:95%; max-height:95%; border:3px solid #FFD700; border-radius:10px;">';
                    overlay.onclick = () => overlay.remove();
                    document.body.appendChild(overlay);
                    break;
                case "":
                    break; // Ne rien faire si vide
                default:
                    alert("Attention : Le choix de personnage n'est pas valide");
            }
        });
    }
}

/**
 * Initialise le lecteur YouTube avec plein écran et redirection
 */
function initGenericVideo(videoId, nextUrl) {
    isVideoPlaying = true;

    const triggerFullscreen = () => {
        const appContainer = document.getElementById('app');
        if (!appContainer) return;

        const requestFS = appContainer.requestFullscreen || 
                          appContainer.webkitRequestFullscreen || 
                          appContainer.mozRequestFullScreen || 
                          appContainer.msRequestFullscreen;
        if (requestFS) {
            requestFS.call(appContainer).catch(() => {});
        }
    };

    // 1. Tentative immédiate : fonctionne pour les énigmes (car appelé suite au clic "Valider")
    triggerFullscreen();

    // 2. Fallback : si la tentative immédiate échoue (cas du NFC avec redirection),
    // le plein écran s'activera au TOUT PREMIER toucher de l'utilisateur sur la page.
    const onFirstInteraction = () => {
        triggerFullscreen();
        document.removeEventListener('click', onFirstInteraction);
    };
    document.addEventListener('click', onFirstInteraction);

    new YT.Player('player', {
        height: '360',
        width: '100%',
        videoId: videoId,
        playerVars: { 
            'autoplay': 1,
            'mute': 0,
            'rel': 0,
            'playsinline': 0, // 0 = plein écran forcé sur iOS
            'fs': 1,          // Autorise le bouton plein écran
            'controls': 1
        },
        events: {
            'onReady': (event) => {
                event.target.playVideo();
                // On s'assure que l'iframe autorise le plein écran au niveau du navigateur
                const iframe = event.target.getIframe();
                if (iframe) {
                    iframe.setAttribute('allow', 'autoplay; fullscreen');
                }
            },
            'onStateChange': (event) => {
                if (event.data === YT.PlayerState.ENDED) {
                    const fsElem = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
                    if (fsElem) {
                        const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
                        if (exitFs) exitFs.call(document);
                    }
                    window.location.href = nextUrl;
                }
            }
        }
    });
}

/**
 * Active le scan NFC (doit être appelé dans un événement de clic)
 */
async function startNFCScan(targetCode, nextUrl) {
    // 1. Détection stricte de la page vidéo pour couper le NFC
    const isVideoPage = window.location.pathname.toLowerCase().includes('video') || !!document.getElementById('player');
    const nfcLock = sessionStorage.getItem('nfc_lock');

    // Cooldown réduit à 2 secondes (suffisant pour éloigner le tel)
    const isCooldown = nfcLock && (Date.now() - parseInt(nfcLock) < 2000);

    if (isNFCProcessing || isVideoPlaying || isVideoPage || isCooldown) {
        // Si on est en cooldown ou sur une vidéo, on s'assure que le scan est coupé
        if (nfcAbortController) {
            nfcAbortController.abort();
            nfcAbortController = null;
        }
        return;
    }

    // DÉCLENCHEMENT IMMÉDIAT DU PLEIN ÉCRAN
    // Comme startNFCScan est appelé par un click, on profite du geste utilisateur ICI
    const appContainer = document.getElementById('app');
    const requestFS = appContainer?.requestFullscreen || appContainer?.webkitRequestFullscreen;

    if (requestFS) {
        requestFS.call(appContainer).catch(() => {});
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
    }

    if (!('NDEFReader' in window)) {
        alert("NFC non supporté sur ce navigateur.");
        return;
    }

    try {
        // Annule un scan précédent s'il existe
        if (nfcAbortController) nfcAbortController.abort();
        nfcAbortController = new AbortController();

        const ndef = new NDEFReader();
        await ndef.scan({ signal: nfcAbortController.signal });
        
        ndef.onreading = (event) => {
            if (isNFCProcessing) return; 

            const decoder = new TextDecoder();
            for (const record of event.message.records) {
                const codeNFC = decoder.decode(record.data).trim();
                
                if (codeNFC === targetCode) {
                    isNFCProcessing = true;
                    sessionStorage.setItem('nfc_lock', Date.now().toString());
                    
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
                    
                    document.body.style.pointerEvents = "none";

                    // On coupe le scan immédiatement après avoir trouvé le bon tag
                    if (nfcAbortController) nfcAbortController.abort();
                    nfcAbortController = null;

                    setTimeout(() => {
                        window.location.href = nextUrl;
                    }, 800);
                    break; // Sort de la boucle des enregistrements
                }
            }
        };
    } catch (error) {
        isNFCProcessing = false; // Permet de réessayer si le scan a échoué à démarrer
        alert("Erreur NFC : " + error);
    }
}

// Sécurité ultime : On arrête tout scan NFC dès que l'utilisateur quitte la page actuelle
window.addEventListener('pagehide', () => {
    if (nfcAbortController) nfcAbortController.abort();
});

/**
 * Version de l'aide spécifique pour la page de test (SPA)
 */
function setupHelpTest() {
    const btnHelp = document.getElementById('btn-help');
    if (!btnHelp) return;

    btnHelp.addEventListener('click', () => {
        const userInput = prompt("AIDE TEST : Tapez 'boum', 'mira' ou 'carte'");
        if (userInput === null) return;

        const text = userInput.trim().toLowerCase();

        // En mode SPA, on réinitialise l'état pour permettre de reprendre le contrôle
        isVideoPlaying = false;
        
        switch (text) {
            case "depart":
                if (typeof runStep === 'function') runStep('boum');
                break;
            case "boum":
                if (typeof runStep === 'function') runStep('tilly-to-boum');
                break;
            case "mira":
                if (typeof runStep === 'function') runStep('mira1');
                break;
            case "thae":
                if (typeof runStep === 'function') runStep('thae');
                break;
            case "laya":
                if (typeof runStep === 'function') runStep('laya');
                break;
            case "djouk":
                if (typeof runStep === 'function') runStep('djouk');
                break;
            case "yoko":
                if (typeof runStep === 'function') runStep('yoko');
                break;
            case "grejean":
                if (typeof runStep === 'function') runStep('grejean');
                break;
            case "tilly":
                if (typeof runStep === 'function') runStep('tilly');
                break;
            case "fin":
                if (typeof runStep === 'function') runStep('endgame');
                break;
            case "carte":
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
                overlay.style.zIndex = '10000';
                overlay.style.display = 'flex';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';
                overlay.style.cursor = 'zoom-out';
                overlay.innerHTML = '<img src="./Image/carteall.jpg" style="max-width:95%; max-height:95%; border:3px solid #FFD700; border-radius:10px;">';
                overlay.onclick = () => overlay.remove();
                document.body.appendChild(overlay);
                break;
            default:
                alert("Nom non reconnu. Essayez 'boum', 'mira' ou 'carte'.");
        }
    });
}
/**
 * Gère une énigme avec code, mot magique et vidéo finale
 */
function setupEnigmaLogic(correctCode, magicWord, videoId, nextUrl) {
    const btn = document.getElementById('btn-validate');
    const input = document.getElementById('code-input');
    const enigmaArea = document.getElementById('enigma-area');
    const videoArea = document.getElementById('video-area');

    if (!btn || !input) return;

    btn.addEventListener('click', () => {
        // Comparaison insensible à la casse pour les énigmes textuelles
        if (input.value.trim().toLowerCase() === correctCode.toString().toLowerCase()) {
            alert("Bravo ! Le mot magique est : " + magicWord);
            if (videoId) {
                if (enigmaArea) enigmaArea.style.display = 'none';
                if (videoArea) videoArea.style.display = 'block';
                initGenericVideo(videoId, nextUrl);
            } else {
                // Si pas de vidéo (ex: Djouk), on redirige directement
                window.location.href = nextUrl;
            }
        } else {
            alert("Code incorrect.");
        }
    });
}