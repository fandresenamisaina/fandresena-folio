// ============================================
// PORTFOLIO CYBERSÉCURITÉ L1 - SCRIPT CORRIGÉ
// Fanaja Misaina Fandresena - 2024
// ============================================
// CORRECTIONS APPLIQUÉES :
//  [C1] Clé propriétaire comparée via SHA-256 (hash côté client)
//  [C2] Noms de fichiers échappés avant injection HTML (XSS fix)
//  [C3] localStorage conserve le base64 pour les fichiers locaux
//       (sans URL Firebase), avec fallback si quota dépassé
//  [C4] Variables globales du typer encapsulées dans un objet
//  [C5] initAllFeatures() avec try/catch par feature
//  [C6] animateCounter unifié (plus de duplication)
//  [C7] render() utilise DocumentFragment pour meilleures perfs
//  [C8] throttle avec trailing call
//  [C9] isDuplicate renforcé avec hash SHA-256 du contenu
//  [C10] Rappel console : vérifier les règles Firestore/Storage
//  [FIX1] _syncLocal() garde le data base64 pour les fichiers locaux
//  [FIX2] loadFiles() fusionne Firebase + localStorage (ne perd plus
//         les fichiers locaux quand Firebase est vide/échoue)
//  [FIX3] render() utilise realIndex (indexOf) au lieu de l'index
//         du tableau filtré → download/delete sur le bon fichier
// ============================================

// ──────────────────────────────────────────────
// [C4] Typer encapsulé — plus de globals flottants
// ──────────────────────────────────────────────
const typerState = {
    texts: [
        "Étudiant en Informatique Licence 1",
        "Passionné de Cybersécurité",
        "INSI - 2025-2026"
    ],
    textIndex:  0,
    charIndex:  0,
    isDeleting: false,
    timeout:    null
};

// ──────────────────────────────────────────────
// ÉTAT GLOBAL
// ──────────────────────────────────────────────
const appState = {
    isInitialized: false,
    observers:     [],
    timeouts:      {},
    fileManager:   null
};

// ──────────────────────────────────────────────
// UTILITAIRES
// ──────────────────────────────────────────────

/** [C2] Échappe les caractères HTML pour éviter les injections XSS */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}

/** [C1] Hash SHA-256 d'une chaîne, retourne hex string */
async function sha256(message) {
    const msgBuffer  = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * [C9] Hash SHA-256 du contenu base64 d'un fichier.
 * Permet une détection de doublons fiable même si le nom change.
 */
async function hashFileContent(dataUrl) {
    const data = dataUrl ? dataUrl.split(',')[1] || dataUrl : '';
    return sha256(data);
}

/** [C8] Throttle avec trailing call (le dernier event n'est jamais perdu) */
const throttle = (func, limit) => {
    let inThrottle = false;
    let lastArgs   = null;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    func.apply(this, lastArgs);
                    lastArgs = null;
                }
            }, limit);
        } else {
            lastArgs = args;
        }
    };
};

// ──────────────────────────────────────────────
// INITIALISATION CENTRALE
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
    if (appState.isInitialized) return;
    appState.isInitialized = true;

    initAllFeatures();
    initThemeToggle();
    window.addEventListener('beforeunload', cleanupApp);
    setTimeout(() => initFileManager(), 1500);
});

// ──────────────────────────────────────────────
// [C5] initAllFeatures — try/catch par feature
// ──────────────────────────────────────────────
function initAllFeatures() {
    const features = [
        initNavigation,
        initTypingEffect,
        initScrollSmooth,
        initScrollAnimations,
        initScrollTop,
        initSkillBars,
        initMatrixEffect,
        initContactForm,
        initCVButton,
        initNavActiveScroll,
        initStatsCounter,
        initEcoleAnimations,
        initQualitesAnimations,
        initNavbarScrollEffect,
        initPassionsAnimations,
        initAge
    ];
    features.forEach(fn => {
        try {
            fn();
        } catch (e) {
            console.error(`[initAllFeatures] Erreur dans ${fn.name} :`, e);
        }
    });
}

// ──────────────────────────────────────────────
// MATRIX / CANVAS EFFECT
// ──────────────────────────────────────────────
function initMatrixEffect() {
    const oldBg = document.querySelector('.matrix-bg');
    if (oldBg) oldBg.style.display = 'none';

    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        z-index: -1;
        pointer-events: all;
        display: block;
        cursor: crosshair;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    let W, H, dots, particles = [];

    const DOTS         = 200;
    const CONNECT_DIST = 150;
    const MOUSE_DIST   = 220;
    const REPULSE_DIST = 110;

    let mouse = { x: -999, y: -999 };

    function init() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        dots = Array.from({ length: DOTS }, () => ({
            x:          Math.random() * W,
            y:          Math.random() * H,
            vx:         (Math.random() - 0.5) * 0.7,
            vy:         (Math.random() - 0.5) * 0.7,
            r:          1.2 + Math.random() * 2.5,
            color:      Math.random() > 0.78 ? '#00d4ff'
                      : Math.random() > 0.5  ? '#00ff88'
                      : '#ffffff',
            pulse:      Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.04,
            blink:      Math.random(),
            blinkSpeed: 0.005 + Math.random() * 0.02
        }));
    }
    init();

    window.addEventListener('resize', init);
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('click',     e => { mouse.x = e.clientX; mouse.y = e.clientY; explode(); });

    function explode() {
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            particles.push({
                x: mouse.x, y: mouse.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: Math.random() > 0.5 ? '#00ff88' : '#00d4ff',
                r: 1 + Math.random() * 2.5
            });
        }
    }

    function draw() {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, 0, W, H);

        particles = particles.filter(p => p.life > 0.02);
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.95; p.vy *= 0.95;
            p.life *= 0.93;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
            ctx.fillStyle   = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        dots.forEach(d => {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > W) d.vx *= -1;
            if (d.y < 0 || d.y > H) d.vy *= -1;
            d.pulse += d.pulseSpeed;
            d.blink += d.blinkSpeed;

            const mdx = d.x - mouse.x, mdy = d.y - mouse.y;
            const md  = Math.sqrt(mdx * mdx + mdy * mdy);
            if (md < REPULSE_DIST && md > 0) {
                const force = (1 - md / REPULSE_DIST) * 2.8;
                d.x += (mdx / md) * force;
                d.y += (mdy / md) * force;
            }
        });

        for (let i = 0; i < DOTS; i++) {
            for (let j = i + 1; j < DOTS; j++) {
                const dx   = dots[i].x - dots[j].x;
                const dy   = dots[i].y - dots[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECT_DIST) {
                    const alpha = (1 - dist / CONNECT_DIST) * 0.55;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0,220,120,${alpha})`;
                    ctx.lineWidth   = 0.6;
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.stroke();
                }
            }

            const mdx   = dots[i].x - mouse.x;
            const mdy   = dots[i].y - mouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < MOUSE_DIST) {
                const alpha = (1 - mdist / MOUSE_DIST) * 0.9;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
                ctx.lineWidth   = 0.9;
                ctx.moveTo(dots[i].x, dots[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }

        dots.forEach(d => {
            const pulse  = 0.55 + 0.45 * Math.sin(d.pulse);
            const blink  = 0.4  + 0.6  * Math.abs(Math.sin(d.blink));
            const radius = d.r * pulse;

            const haloColor = d.color === '#00ff88' ? 'rgba(0,255,136,0.18)'
                            : d.color === '#00d4ff' ? 'rgba(0,212,255,0.15)'
                            :                         'rgba(255,255,255,0.12)';
            const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, radius * 4);
            grad.addColorStop(0, haloColor);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(d.x, d.y, radius * 4, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
            ctx.fillStyle   = d.color;
            ctx.globalAlpha = blink * 0.95;
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        if (mouse.x > 0 && mouse.x < W) {
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
            ctx.fillStyle   = '#fff';
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0,212,255,0.5)';
            ctx.lineWidth   = 1;
            ctx.stroke();
        }

        requestAnimationFrame(draw);
    }

    draw();
}

// ──────────────────────────────────────────────
// FILEMANAGER — SECTION HTML
// ──────────────────────────────────────────────
function initFileManager() {
    if (appState.fileManager) return;

    ['fileManager', 'cyberFilesApp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    const fileSection = document.createElement('section');
    fileSection.id        = 'cyberFilesApp';
    fileSection.className = 'section-cyber';
    fileSection.innerHTML = `
        <div class="container cyber-container">
            <div style="text-align:center; margin-bottom:3rem;">
                <h2 class="cyber-title">📂 Leçons Cybersécurité L1</h2>
                <p class="cyber-subtitle" style="max-width:700px; margin:0 auto;">
                    Gestionnaire de fichiers sécurisé • Sync Cloud Firebase • Mode Consultant/Propriétaire
                </p>
            </div>

            <div class="cyber-header">
                <h3>📁 Mes Documents <span style="color:#00ff88;">☁️ Cloud Sync</span></h3>
                <div class="status-display">
                    <span id="statusIndicator" class="status-consultant">👤 Mode Consultant</span>
                </div>
            </div>

            <div id="dashboardStats" class="dashboard-stats">
                <div class="stat-item"><span>0</span><small>Fichiers</small></div>
                <div class="stat-item"><span>0 MB</span><small>Stockage</small></div>
                <div class="stat-item"><span>0</span><small>Récents</small></div>
                <div class="stat-item"><span>0 ☁️</span><small>En ligne</small></div>
            </div>

            <div class="controls-panel">
                <input type="text" id="fileSearch" placeholder="🔍 Recherche...">
                <div class="filter-buttons">
                    <button class="filter-btn active" data-filter="all">📋 Tous</button>
                    <button class="filter-btn" data-filter="cyber">🛡️ Cyber</button>
                    <button class="filter-btn" data-filter="reseau">🌐 Réseau</button>
                    <button class="filter-btn" data-filter="linux">🐧 Linux</button>
                    <button class="filter-btn" data-filter="slides">📊 Slides</button>
                </div>
            </div>

            <div id="filesContainer" class="files-container">
                <div class="no-files">
                    <i class="fas fa-folder-open" style="font-size:5rem; color:rgba(255,255,255,0.1); display:block; margin-bottom:1rem;"></i>
                    <h3>Aucun fichier</h3>
                    <p>Activez le mode propriétaire pour gérer vos leçons</p>
                </div>
            </div>

            <div id="ownerPanel" style="display:none;">
                <div style="text-align:center; padding:2rem; background:rgba(0,255,136,0.1); border-radius:20px; border:2px solid #00ff88; margin:2rem 0;">
                    <h3 style="color:#00ff88;">🔓 MODE PROPRIÉTAIRE ACTIVÉ</h3>
                    <p style="color:#aaa;">☁️ Firebase Sync • 📱 Multi-appareils</p>
                </div>
                <div class="upload-area">
                    <div id="dropTarget" class="drop-target">
                        <i class="fas fa-cloud-upload-alt" style="font-size:4rem; color:#00ff88; display:block; margin-bottom:1rem;"></i>
                        <h3>Glisser-déposer vos fichiers</h3>
                        <p>PDF • DOCX • TXT • Images • ZIP • <strong>PPTX</strong> (Max 10MB)</p>
                        <p style="color:#00d4ff; margin-top:0.5rem; font-size:0.9rem;">ou cliquez ici pour parcourir</p>
                    </div>
                    <input type="file" id="fileSelector" multiple
                        accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.zip,.rar,.pptx,.ppt,.xlsx"
                        style="display:none;">
                </div>
                <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; margin-top:2rem;">
                    <button id="forceSync" class="btn btn-primary">🔄 Sync Cloud</button>
                </div>
            </div>
        </div>
    `;

    const skillsSection = document.getElementById('skills');
    if (skillsSection?.parentNode) {
        skillsSection.parentNode.insertBefore(fileSection, skillsSection.nextSibling);
    } else {
        document.body.appendChild(fileSection);
    }

    appState.fileManager = new FileManager();
    appState.fileManager.init();
}

// ──────────────────────────────────────────────
// CLASSE FILEMANAGER — VERSION CORRIGÉE
// ──────────────────────────────────────────────
class FileManager {
    constructor() {
        this.isOwner       = false;
        // [C1] On stocke le hash SHA-256 de la clé, jamais la clé en clair
        this.ownerKeyHash  = '0fa97cbc695ea93f3c89a07134589529c875ad10f246a961a9212aea9ef9635e';
        this.files         = [];
        this.searchQuery   = '';
        this.currentFilter = 'all';
        this.db            = null;
        this.storage       = null;
        this.isFirebaseReady = false;

        // [C10] Vérifiez vos règles Firestore/Storage sur la console Firebase
        this.firebaseConfig = {
            apiKey:            "AIzaSyCnr5KkxtiIpr3zMDqLwuDPVRCYMMcjPnQ",
            authDomain:        "portfolio-fandresena.firebaseapp.com",
            projectId:         "portfolio-fandresena",
            storageBucket:     "portfolio-fandresena.firebasestorage.app",
            messagingSenderId: "728975164169",
            appId:             "1:728975164169:web:fddf705f7fb6a0b1db49d8",
            measurementId:     "G-R4PLX3607G"
        };
    }

    async init() {
        this.initFirebase();
        await this.loadFiles();
        this.bindEvents();
        this.render();
        this.updateDashboard();
        this.createOwnerButton();
    }

    // ── Firebase ────────────────────────────────
    initFirebase() {
        if (typeof firebase === 'undefined') {
            console.warn("⚠️ Firebase SDK non chargé — mode localStorage activé");
            return;
        }
        try {
            try { firebase.app(); }
            catch { firebase.initializeApp(this.firebaseConfig); }
            this.db              = firebase.firestore();
            this.storage         = firebase.storage();
            this.isFirebaseReady = true;
            console.log("✅ Firebase Firestore + Storage prêts");
        } catch (e) {
            console.warn("⚠️ Firebase init failed :", e.message);
            this.isFirebaseReady = false;
        }
    }

    // ── [FIX2] Chargement — fusion Firebase + localStorage ──
    async loadFiles() {
        // Toujours charger localStorage d'abord (contient les fichiers
        // locaux avec leur data base64 si présent)
        let localFiles = [];
        try {
            const saved = localStorage.getItem('cyberFiles');
            localFiles  = saved ? JSON.parse(saved) : [];
        } catch { localFiles = []; }

        if (this.isFirebaseReady) {
            try {
                const snap = await this.db.collection("cyberFiles")
                    .orderBy("date", "desc").get();

                // [C3] On ne stocke JAMAIS le champ 'data' depuis Firebase
                const firebaseFiles = snap.docs.map(d => {
                    const { data: _omit, ...meta } = d.data();
                    return { _id: d.id, ...meta };
                });

                // [FIX2] Fusionner : fichiers Firebase + fichiers locaux
                // non encore synchronisés (pas d'_id Firebase)
                const fbIds     = new Set(firebaseFiles.map(f => f._id).filter(Boolean));
                const localOnly = localFiles.filter(f => !f._id || !fbIds.has(f._id));

                this.files = [...firebaseFiles, ...localOnly];
                this._syncLocal();
                return;
            } catch (e) {
                console.warn("Firebase read error, fallback localStorage :", e.message);
            }
        }

        // Fallback complet : localStorage uniquement
        this.files = localFiles;
    }

    // ── [FIX1] _syncLocal — conserve le base64 pour les fichiers locaux ──
    _syncLocal() {
        const toSave = this.files.map(f => {
            const obj = {
                _id:         f._id         || null,
                name:        f.name,
                size:        f.size,
                date:        f.date,
                category:    f.category,
                downloadURL: f.downloadURL || null,
                storagePath: f.storagePath || null,
                contentHash: f.contentHash || null
            };
            // [FIX1] Pour les fichiers locaux sans URL Firebase,
            // on garde le base64 afin qu'ils puissent s'afficher
            // et être téléchargés même après rechargement de la page.
            if (!f.downloadURL && f.data) {
                obj.data = f.data;
            }
            return obj;
        });

        try {
            localStorage.setItem('cyberFiles', JSON.stringify(toSave));
        } catch (e) {
            // localStorage saturé → on réessaie sans les données binaires
            console.warn("localStorage plein, sauvegarde sans base64 :", e.message);
            const metaOnly = this.files.map(f => ({
                _id:         f._id         || null,
                name:        f.name,
                size:        f.size,
                date:        f.date,
                category:    f.category,
                downloadURL: f.downloadURL || null,
                storagePath: f.storagePath || null,
                contentHash: f.contentHash || null
            }));
            try { localStorage.setItem('cyberFiles', JSON.stringify(metaOnly)); } catch {}
        }
    }

    // ── Upload Cloud ────────────────────────────
    async _uploadToCloud(fileObj) {
        if (!this.isFirebaseReady) return null;
        try {
            const path = `cyberFiles/${Date.now()}_${fileObj.name}`;
            const ref  = this.storage.ref(path);
            await ref.putString(fileObj.data, 'data_url');
            const downloadURL = await ref.getDownloadURL();
            // [C3] On ne pousse PAS le champ 'data' dans Firestore
            const meta = {
                name:        fileObj.name,
                size:        fileObj.size,
                date:        fileObj.date,
                category:    fileObj.category,
                contentHash: fileObj.contentHash || null,
                storagePath: path,
                downloadURL
            };
            const doc = await this.db.collection("cyberFiles").add(meta);
            // On garde 'data' uniquement en mémoire pour le téléchargement immédiat
            return { _id: doc.id, ...meta, data: fileObj.data };
        } catch (e) {
            console.error("Upload cloud échoué :", e.message);
            return null;
        }
    }

    async _deleteFromCloud(file) {
        if (!this.isFirebaseReady || !file._id) return;
        try {
            await this.db.collection("cyberFiles").doc(file._id).delete();
            if (file.storagePath) await this.storage.ref(file.storagePath).delete();
        } catch (e) { console.warn("Delete cloud error :", e.message); }
    }

    async forceCloudSync() {
        if (!this.isFirebaseReady) return showNotification("⚠️ Firebase non disponible", "error");
        showNotification("🔄 Synchronisation en cours…");
        await this.loadFiles();
        this.render();
        this.updateDashboard();
        showNotification("✅ Sync terminée !", "success");
    }

    // [C9] isDuplicate basé sur hash SHA-256 du contenu + fallback nom+taille
    async isDuplicateAsync(newFile) {
        if (newFile.contentHash) {
            return this.files.some(f => f.contentHash && f.contentHash === newFile.contentHash);
        }
        return this.files.some(f =>
            f.name.toLowerCase() === newFile.name.toLowerCase() && f.size === newFile.size
        );
    }

    // ── Gestion fichiers ────────────────────────
    handleFiles(files) {
        if (!this.isOwner) return showNotification("🔒 Mode propriétaire requis", "warning");
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                showNotification(`⚠️ ${escapeHtml(file.name)} dépasse 10 MB`, "warning");
                return;
            }
            const reader = new FileReader();
            reader.onload = async e => {
                const dataUrl     = e.target.result;
                const contentHash = await hashFileContent(dataUrl);
                const fileObj = {
                    name:        file.name,
                    size:        file.size,
                    date:        new Date().toISOString(),
                    data:        dataUrl,
                    category:    this.getCategory(file.name),
                    contentHash
                };
                // [C9] Vérification par hash avant ajout
                if (await this.isDuplicateAsync(fileObj)) {
                    showNotification(`⚠️ Doublon ignoré : ${escapeHtml(file.name)}`, "warning");
                    return;
                }
                const cloudResult = await this._uploadToCloud(fileObj);
                // cloudResult contient le fichier avec downloadURL si Firebase OK,
                // sinon on garde fileObj (avec data en mémoire ET dans localStorage)
                this.files.unshift(cloudResult || fileObj);
                this._syncLocal(); // [FIX1] sauvegarde avec base64 pour les fichiers locaux
                this.render();
                this.updateDashboard();
                showNotification(
                    `✅ ${escapeHtml(file.name)} ajouté${cloudResult ? " ☁️" : " 💾"}`,
                    "success"
                );
            };
            reader.onerror = () =>
                showNotification(`❌ Erreur lecture : ${escapeHtml(file.name)}`, "error");
            reader.readAsDataURL(file);
        });
    }

    async delete(index) {
        if (!confirm('Supprimer ce fichier définitivement ?')) return;
        const file = this.files[index];
        if (!file) return;
        await this._deleteFromCloud(file);
        this.files.splice(index, 1);
        this._syncLocal();
        this.render();
        this.updateDashboard();
        showNotification("🗑️ Fichier supprimé", "success");
    }

    download(index) {
        const file = this.files[index];
        if (!file) return;
        if (file.downloadURL) {
            window.open(file.downloadURL, '_blank');
            return;
        }
        if (!file.data) {
            showNotification("⚠️ Données indisponibles — rechargez la page", "warning");
            return;
        }
        const a = document.createElement('a');
        a.href     = file.data;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // ── [C7] [FIX3] Rendu avec DocumentFragment + realIndex ────
    render() {
        const container = document.getElementById('filesContainer');
        if (!container) return;

        const filtered = this.files.filter(f => {
            const matchSearch = !this.searchQuery ||
                f.name.toLowerCase().includes(this.searchQuery);
            const matchFilter = this.currentFilter === 'all' ||
                f.category === this.currentFilter;
            return matchSearch && matchFilter;
        });

        container.innerHTML = '';

        if (!filtered.length) {
            const empty = document.createElement('div');
            empty.className = 'no-files';
            empty.innerHTML = `
                <i class="fas fa-folder-open" style="font-size:5rem; color:rgba(255,255,255,0.1); display:block; margin-bottom:1rem;"></i>
                <h3>Aucun fichier trouvé</h3>
                <p>Modifiez votre recherche ou filtre</p>`;
            container.appendChild(empty);
            return;
        }

        const grid     = document.createElement('div');
        grid.className = 'files-grid';

        const fragment = document.createDocumentFragment();

        filtered.forEach(file => {
            // [FIX3] Index réel dans this.files, pas dans filtered
            const realIndex = this.files.indexOf(file);

            const card = document.createElement('div');
            card.className = 'file-card';

            // [C2] Nom du fichier échappé — pas d'injection HTML possible
            const safeName   = escapeHtml(file.name);
            const safeSize   = escapeHtml(this.formatSize(file.size));
            const safeDate   = escapeHtml(new Date(file.date).toLocaleDateString('fr'));
            const icon       = escapeHtml(this.getIcon(file.name));
            const iconColor  = escapeHtml(this.getIconColor(file.name));
            const cloudBadge = file.downloadURL ? '☁️' : (file.data ? '💾' : '⚠️');
            const cloudTitle = file.downloadURL ? 'En ligne (Firebase)'
                             : file.data        ? 'Local (stocké)'
                             :                    'Données manquantes';

            card.innerHTML = `
                <div class="file-icon">
                    <i class="fas fa-${icon}" style="font-size:3rem; color:${iconColor};"></i>
                </div>
                <div class="file-info">
                    <h4>${safeName}</h4>
                    <div class="file-meta">
                        <span class="file-size">${safeSize}</span>
                        <span class="file-date">${safeDate}</span>
                        <span title="${cloudTitle}">${cloudBadge}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="action-btn btn-preview" data-index="${realIndex}">
                        <i class="fas fa-download"></i> Télécharger
                    </button>
                    ${this.isOwner ? `
                    <button class="action-btn btn-delete" data-index="${realIndex}">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
                </div>`;

            // Listeners directs — pas d'onclick inline (pas d'injection possible)
            card.querySelector('.btn-preview')?.addEventListener('click', () => {
                this.download(realIndex);
            });
            card.querySelector('.btn-delete')?.addEventListener('click', () => {
                this.delete(realIndex);
            });

            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
        container.appendChild(grid);
    }

    // ── Dashboard ────────────────────────────────
    updateDashboard() {
        const el = document.getElementById('dashboardStats');
        if (!el) return;
        const total   = this.files.length;
        const size    = this.files.reduce((s, f) => s + (f.size || 0), 0);
        const recent  = this.files.filter(f =>
            new Date(f.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length;
        const onCloud = this.files.filter(f => f.downloadURL).length;
        el.innerHTML = `
            <div class="stat-item"><span>${total}</span><small>Fichiers</small></div>
            <div class="stat-item"><span>${(size / 1024 / 1024).toFixed(1)} MB</span><small>Stockage</small></div>
            <div class="stat-item"><span>${recent}</span><small>Récents</small></div>
            <div class="stat-item"><span>${onCloud} ☁️</span><small>En ligne</small></div>
        `;
    }

    // ── Events ───────────────────────────────────
    bindEvents() {
        document.getElementById('fileSearch')?.addEventListener('input',
            throttle(e => {
                this.searchQuery = e.target.value.toLowerCase();
                this.render();
            }, 300)
        );

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        const fileSelector = document.getElementById('fileSelector');
        const dropTarget   = document.getElementById('dropTarget');

        if (dropTarget && fileSelector) {
            dropTarget.addEventListener('click', e => {
                e.stopPropagation();
                fileSelector.value = '';
                fileSelector.click();
            });
            dropTarget.addEventListener('dragover', e => {
                e.preventDefault();
                dropTarget.classList.add('dragover');
            });
            dropTarget.addEventListener('dragleave', () =>
                dropTarget.classList.remove('dragover')
            );
            dropTarget.addEventListener('drop', e => {
                e.preventDefault();
                dropTarget.classList.remove('dragover');
                this.handleFiles(e.dataTransfer.files);
            });
            fileSelector.addEventListener('change', e => {
                if (e.target.files.length > 0) this.handleFiles(e.target.files);
                e.target.value = '';
            });
        }

        document.getElementById('backupExport')?.addEventListener('click',   () => this.exportBackup());
        document.getElementById('forceSync')?.addEventListener('click',      () => this.forceCloudSync());

        const importInput   = document.getElementById('backupImport');
        const triggerImport = document.getElementById('triggerImport');
        if (triggerImport && importInput) {
            triggerImport.addEventListener('click', () => { importInput.value = ''; importInput.click(); });
            importInput.addEventListener('change',  e => {
                if (e.target.files[0]) this.importBackup(e.target.files[0]);
            });
        }
    }

    // ── [C1] Bouton propriétaire — hash SHA-256 ──
    createOwnerButton() {
        document.querySelectorAll('.owner-btn-fixed').forEach(b => b.remove());
        const btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-lock"></i> Propriétaire';
        btn.className = 'btn btn-secondary owner-btn-fixed';
        btn.style.cssText = 'position:fixed; bottom:30px; right:110px; z-index:10000; box-shadow:0 4px 20px rgba(0,212,255,0.4);';
        btn.onclick = () => this.toggleOwnerMode();
        document.body.appendChild(btn);
    }

    async toggleOwnerMode() {
        if (this.isOwner) {
            showNotification("👑 Vous êtes déjà propriétaire", "success");
            return;
        }
        const key = prompt('🔑 Clé propriétaire :');
        if (key === null) return;

        // [C1] Comparaison par hash — jamais la clé en clair
        const inputHash = await sha256(key);
        if (inputHash === this.ownerKeyHash) {
            this.isOwner = true;
            const si = document.getElementById('statusIndicator');
            if (si) { si.textContent = '👑 Propriétaire'; si.className = 'status-owner'; }
            const panel = document.getElementById('ownerPanel');
            if (panel) panel.style.display = 'block';
            showNotification('✅ Mode Propriétaire activé !', 'success');
            this.render();
        } else {
            showNotification('❌ Clé incorrecte', 'error');
        }
    }

    // ── Backup ───────────────────────────────────
    exportBackup() {
        // Export des métadonnées + data locale (sans base64 Firebase, inutile ici)
        const data = {
            files: this.files.map(f => ({
                name:        f.name,
                size:        f.size,
                date:        f.date,
                category:    f.category,
                contentHash: f.contentHash  || null,
                downloadURL: f.downloadURL  || null,
                // On exporte le data local pour pouvoir le ré-importer
                data:        f.downloadURL  ? null : (f.data || null)
            })),
            date: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = `cyber-backup-${new Date().toLocaleDateString('fr').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    importBackup(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const data   = JSON.parse(e.target.result);
                let added = 0, dupes = 0;
                for (const f of (data.files || [])) {
                    if (await this.isDuplicateAsync(f)) { dupes++; }
                    else { this.files.unshift(f); added++; }
                }
                this._syncLocal();
                this.render();
                this.updateDashboard();
                showNotification(
                    `✅ ${added} importé(s)${dupes ? `, ${dupes} doublon(s) ignoré(s)` : ''}`,
                    'success'
                );
            } catch { showNotification('❌ Fichier JSON invalide', 'error'); }
        };
        reader.readAsText(file);
    }

    // ── Catégories & icônes ──────────────────────
    getCategory(name) {
        const n = name.toLowerCase();
        if (n.endsWith('.pptx') || n.endsWith('.ppt') || n.includes('slides') || n.includes('cours'))
            return 'slides';
        if (n.includes('cyber') || n.includes('securite') || n.includes('hack') || n.includes('ctf'))
            return 'cyber';
        if (n.includes('reseau') || n.includes('network') || n.includes('cisco') || n.includes('ccna'))
            return 'reseau';
        if (n.includes('linux') || n.includes('bash') || n.includes('shell') || n.includes('unix'))
            return 'linux';
        return 'cyber';
    }

    getIcon(name) {
        const ext = name.split('.').pop().toLowerCase();
        return {
            pdf: 'file-pdf', docx: 'file-word', doc: 'file-word', txt: 'file-alt',
            jpg: 'file-image', jpeg: 'file-image', png: 'file-image',
            zip: 'file-archive', rar: 'file-archive',
            pptx: 'file-powerpoint', ppt: 'file-powerpoint',
            xlsx: 'file-excel', xls: 'file-excel', mp4: 'file-video'
        }[ext] || 'file';
    }

    getIconColor(name) {
        const ext = name.split('.').pop().toLowerCase();
        return {
            pdf: '#ff4444', docx: '#2b579a', doc: '#2b579a', txt: '#aaaaaa',
            jpg: '#00b894', jpeg: '#00b894', png: '#00b894',
            zip: '#fdcb6e', rar: '#fdcb6e',
            pptx: '#d04a02', ppt: '#d04a02',
            xlsx: '#217346', xls: '#217346'
        }[ext] || '#00d4ff';
    }

    formatSize(bytes) {
        if (!bytes) return '—';
        if (bytes < 1024)        return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    }
}

// ──────────────────────────────────────────────
// NAVIGATION MOBILE
// ──────────────────────────────────────────────
function initNavigation() {
    const hamburger = document.querySelector(".hamburger");
    hamburger?.addEventListener("click", toggleMobileMenu);
    document.querySelectorAll(".nav-link").forEach(link =>
        link.addEventListener("click", closeMobileMenu)
    );
}

function toggleMobileMenu() {
    document.querySelector(".hamburger").classList.toggle("active");
    document.querySelector(".nav-menu").classList.toggle("active");
}

function closeMobileMenu() {
    document.querySelector(".hamburger")?.classList.remove("active");
    document.querySelector(".nav-menu")?.classList.remove("active");
}

// ──────────────────────────────────────────────
// [C4] EFFET MACHINE À ÉCRIRE — état encapsulé
// ──────────────────────────────────────────────
function initTypingEffect() {
    const typedText = document.querySelector(".typed-text");
    const cursor    = document.querySelector(".cursor");
    if (!typedText || !cursor) return;

    function type() {
        const currentText = typerState.texts[typerState.textIndex];
        if (!typerState.isDeleting) {
            if (typerState.charIndex <= currentText.length) {
                typedText.textContent = currentText.substring(0, typerState.charIndex);
                typerState.charIndex++;
                typerState.timeout = setTimeout(type, 100);
            } else {
                typerState.timeout = setTimeout(() => {
                    typerState.isDeleting = true;
                    type();
                }, 2000);
            }
        } else {
            if (typerState.charIndex >= 0) {
                typedText.textContent = currentText.substring(0, typerState.charIndex);
                typerState.charIndex--;
                typerState.timeout = setTimeout(type, 50);
            } else {
                typerState.isDeleting = false;
                typerState.textIndex  = (typerState.textIndex + 1) % typerState.texts.length;
                typerState.timeout    = setTimeout(type, 500);
            }
        }
    }
    type();
}

// ──────────────────────────────────────────────
// SCROLL & ANIMATIONS
// ──────────────────────────────────────────────
function initScrollSmooth() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            target?.scrollIntoView({ behavior: "smooth", block: "start" });
            closeMobileMenu();
        });
    });
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity   = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll("[data-aos]").forEach(el => {
        el.style.opacity    = "0";
        el.style.transform  = "translateY(30px)";
        el.style.transition = "0.6s ease";
        observer.observe(el);
    });
    appState.observers.push(observer);
}

function initScrollTop() {
    const btn = document.getElementById("scrollTop");
    if (!btn) return;
    window.addEventListener("scroll", throttle(() => {
        btn.classList.toggle("show", window.scrollY > 500);
    }, 16));
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initNavActiveScroll() {
    window.addEventListener("scroll", throttle(() => {
        let current = "";
        const scrollY = window.scrollY + 200;
        document.querySelectorAll("section[id]").forEach(section => {
            if (scrollY >= section.offsetTop) current = section.id;
        });
        document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${current}`) link.classList.add("active");
        });
    }, 16));
}

function initNavbarScrollEffect() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', throttle(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 100);
    }, 16));
}

// ──────────────────────────────────────────────
// [C6] COMPTEURS UNIFIÉS
// ──────────────────────────────────────────────
function animateCounter(el, steps = 100, interval = 20) {
    const target    = parseInt(el.getAttribute('data-target'), 10);
    let current     = 0;
    const increment = target / steps;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            el.textContent = target;
            clearInterval(timer);
            return;
        }
        el.textContent = Math.floor(current);
    }, interval);
}

function initStatsCounter() {
    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-number').forEach(el => animateCounter(el));
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    observer.observe(statsSection);
    appState.observers.push(observer);
}

function initEcoleAnimations() {
    const ecoleSection = document.querySelector('.ecole');
    if (!ecoleSection) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // [C6] Même fonction, paramètres différents
                document.querySelectorAll('.stat-number-ecole').forEach(el =>
                    animateCounter(el, 50, 30)
                );
                observer.unobserve(ecoleSection);
            }
        });
    }, { threshold: 0.2 });
    observer.observe(ecoleSection);
    appState.observers.push(observer);
}

function initQualitesAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.qualite-progress').forEach(bar => {
                    bar.style.width = bar.getAttribute('data-width');
                });
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.qualite-item').forEach(item => observer.observe(item));
    appState.observers.push(observer);
}

function initPassionsAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.passion-card').forEach((card, i) => {
                    setTimeout(() => card.style.opacity = '1', i * 100);
                });
            }
        });
    });
    document.querySelectorAll('.passions-grid').forEach(grid => observer.observe(grid));
    appState.observers.push(observer);
}

// ──────────────────────────────────────────────
// SKILLS BARS
// ──────────────────────────────────────────────
function initSkillBars() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll(".skill-progress").forEach(bar => {
                    bar.style.width = bar.getAttribute("data-width");
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    document.querySelectorAll('.skills').forEach(section => observer.observe(section));
    appState.observers.push(observer);
}

// ──────────────────────────────────────────────
// FORMULAIRE CONTACT EMAILJS
// ──────────────────────────────────────────────
function initContactForm() {
    const form = document.querySelector(".contact-form");
    if (!form || typeof emailjs === "undefined") {
        console.warn("EmailJS non chargé");
        return;
    }
    emailjs.init("PCqGyE1CPI0Ao6DZO");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const name    = formData.get('from_name')  || 'Anonyme';
        const email   = formData.get('from_email');
        const message = formData.get('message')    || 'Bonjour !';

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            showNotification("❌ Email invalide", "error");
            return;
        }

        const btn      = form.querySelector("button[type='submit']");
        const original = btn.innerHTML;
        btn.disabled   = true;
        btn.innerHTML  = "📤 Envoi...";

        try {
            await emailjs.send("service_zdtq7he", "template_vg944li",
                { from_name: name, from_email: email, message }
            );
            showNotification("🎉 Message envoyé !", "success");
            form.reset();
        } catch (error) {
            console.error("EmailJS error:", error);
            showNotification("❌ Erreur envoi", "error");
        } finally {
            btn.disabled  = false;
            btn.innerHTML = original;
        }
    });
}

// ──────────────────────────────────────────────
// BOUTON CV
// ──────────────────────────────────────────────
function initCVButton() {
    const btn = document.getElementById("voirCV");
    if (!btn) return;
    btn.dataset.state = "preview";

    btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (this.dataset.state === "download") {
            const link = document.createElement("a");
            link.href     = "CV.pdf";
            link.download = "CV_Fanaja_Misaina.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification("✅ CV téléchargé !", "success");
        } else {
            const eye = this.querySelector(".eye-icon");
            if (eye) eye.style.animation = "eyeBlink 0.6s";
            setTimeout(() => {
                window.open("CV.pdf", "CVPreview", "width=900,height=700");
                this.innerHTML    = '<i class="fas fa-download"></i> Télécharger CV';
                this.dataset.state = "download";
            }, 400);
        }
    });
}

// ──────────────────────────────────────────────
// NOTIFICATIONS TOAST
// ──────────────────────────────────────────────
function showNotification(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    // [C2] textContent pour les toasts — jamais innerHTML avec message externe
    toast.textContent = message;

    Object.assign(toast.style, {
        position:       "fixed",
        top:            "30px",
        right:          "30px",
        padding:        "16px 24px",
        borderRadius:   "12px",
        color:          "white",
        fontWeight:     "600",
        zIndex:         "10000",
        backdropFilter: "blur(15px)",
        transform:      "translateX(400px)",
        transition:     "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    });

    const colors = {
        success: "linear-gradient(135deg, #00ff88, #00cc66)",
        error:   "linear-gradient(135deg, #ff6b6b, #ee5a52)",
        warning: "linear-gradient(135deg, #fdcb6e, #e17055)",
        info:    "linear-gradient(135deg, #00d4ff, #0099cc)"
    };
    toast.style.background = colors[type] || colors.success;

    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.style.transform = "translateX(0)");
    setTimeout(() => {
        toast.style.transform = "translateX(400px)";
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ──────────────────────────────────────────────
// THÈME DARK/LIGHT
// ──────────────────────────────────────────────
function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'dark') document.body.classList.add('dark-mode');
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme',
            document.body.classList.contains('dark-mode') ? 'dark' : 'light'
        );
    });
}

// ──────────────────────────────────────────────
// ÂGE
// ──────────────────────────────────────────────
function initAge() {
    const el = document.getElementById('age-display');
    if (!el) return;
    const birth = new Date(2008, 9, 31); // octobre = mois 9
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    el.textContent = `(${age} ans)`;
}

// ──────────────────────────────────────────────
// NETTOYAGE
// ──────────────────────────────────────────────
function cleanupApp() {
    if (typerState.timeout) clearTimeout(typerState.timeout);
    Object.values(appState.timeouts).forEach(id => {
        clearTimeout(id);
        clearInterval(id);
    });
    appState.observers.forEach(obs => obs.disconnect());
}

// ──────────────────────────────────────────────
// UTILITAIRE : générer votre hash propriétaire
// ──────────────────────────────────────────────
// Exécutez UNE FOIS dans la console du navigateur :
//   sha256('votre_mot_de_passe').then(h => console.log('ownerKeyHash =', h));
// Puis copiez le résultat dans this.ownerKeyHash ci-dessus.

console.log("🚀 Portfolio CYBERSÉCURITÉ L1 chargé — version sécurisée !");