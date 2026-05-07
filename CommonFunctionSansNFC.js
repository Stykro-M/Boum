// Fichier de fonctions communes (Version SANS NFC)

var isVideoPlaying = false;

/**
 * Configure le bouton d'aide
 */
function setupHelp(message) {
    const btnHelp = document.getElementById('btn-help');
    if (btnHelp) {
        btnHelp.addEventListener('click', () => {
            const userInput = prompt("Rentrez le nom du personnage sur la planchette devant vous, ou tapez 'carte'");
            
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

    new YT.Player('player', {
        height: '360',
        width: '100%',
        videoId: videoId,
        playerVars: { 
            'autoplay': 1,
            'mute': 0,
            'rel': 0,
            'playsinline': 1, // Garde la vidéo dans la page (évite le mode paysage forcé)
            'fs': 0,          // Désactive le bouton plein écran
            'controls': 1
        },
        events: {
            'onReady': (event) => {
                event.target.playVideo();
            },
            'onStateChange': (event) => {
                if (event.data === YT.PlayerState.ENDED) {
                    window.location.href = nextUrl;
                }
            }
        }
    });
}

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