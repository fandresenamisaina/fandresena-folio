// ============================================
// PORTFOLIO CYBERSÉCURITÉ L1 - SCRIPT COMPLET
// Fanaja Misaina Fandresena - 2024
// ============================================

// TEXTES ANIMATION MACHINE À ÉCRIRE
const texts = [
    "Étudiant en Informatique Licence 1",
    "Passionné de Cybersécurité",
    "INSI - 2025-2026"
];

let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingTimeout = null;

// ============================================
// ÉTAT GLOBAL
// ============================================
const appState = {
    isInitialized: false,
    observers: [],
    timeouts: {},
    fileManager: null
};

// ============================================
// INITIALISATION CENTRALE
// ============================================
document.addEventListener("DOMContentLoaded", function () {
    if (appState.isInitialized) return;
    appState.isInitialized = true;

    initAllFeatures();
    initThemeToggle();
    window.addEventListener('beforeunload', cleanupApp);

    setTimeout(() => initFileManager(), 1500);
});

// ============================================
// FONCTIONS PRINCIPALES
// ============================================
function initAllFeatures() {
    initNavigation();
    initTypingEffect();
    initScrollSmooth();
    initScrollAnimations();
    initScrollTop();
    initSkillBars();
    initMatrixEffect();
    initContactForm();
    initCVButton();
    initNavActiveScroll();
    initStatsCounter();
    initEcoleAnimations();
    initQualitesAnimations();
    initNavbarScrollEffect();
    initPassionsAnimations();
}

// ============================================
// FILEMANAGER — SECTION HTML
// ============================================
function initFileManager() {
    if (appState.fileManager) return;

    // Supprime les anciennes sections filemanager du HTML
    ['fileManager', 'cyberFilesApp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    const fileSection = document.createElement('section');
    fileSection.id = 'cyberFilesApp';
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
                    <i class="fas fa-folder-open" style="font-size:5rem; color:rgba(255,255,255,0.1);"></i>
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
                        <i class="fas fa-cloud-upload-alt" style="font-size:4rem; color:#00ff88;"></i>
                        <h3>Glisser-déposer vos fichiers</h3>
                        <p>PDF • DOCX • TXT • Images • ZIP • <strong>PPTX</strong> (Max 10MB)</p>
                        <input type="file" id="fileSelector" multiple
                            accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.zip,.rar,.pptx,.ppt,.xlsx">
                    </div>
                </div>
                <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; margin-top:2rem;">
                    <button id="backupExport" class="btn btn-secondary">💾 Exporter</button>
                    <input type="file" id="backupImport" accept=".json" style="display:none;">
                    <label for="backupImport" class="btn btn-secondary">📁 Importer</label>
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

// ============================================
// CLASSE FILEMANAGER COMPLÈTE
// ============================================
class FileManager {
    constructor() {
        this.isOwner      = false;
        this.ownerKey     = 'fanaja31';
        this.files        = [];
        this.searchQuery  = '';
        this.currentFilter = 'all';
        this.db           = null;
        this.storage      = null;
        this.isFirebaseReady = false;

        // ─── CONFIG FIREBASE (déjà ton projet) ───
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

    // ──────────────────────────────────────────
    // INIT
    // ──────────────────────────────────────────
    async init() {
        this.initFirebase();
        await this.loadFiles();
        this.bindEvents();
        this.render();
        this.updateDashboard();
        this.createOwnerButton();
    }

    // ──────────────────────────────────────────
    // FIREBASE (SDK Compat — global firebase)
    // ──────────────────────────────────────────
    initFirebase() {
        if (typeof firebase === 'undefined') {
            console.warn("⚠️ Firebase SDK non chargé — mode localStorage activé");
            return;
        }
        try {
            // Réutilise l'app si déjà initialisée, sinon crée
            try { firebase.app(); }
            catch { firebase.initializeApp(this.firebaseConfig); }

            this.db      = firebase.firestore();
            this.storage = firebase.storage();
            this.isFirebaseReady = true;
            console.log("✅ Firebase Firestore + Storage prêts");
        } catch (e) {
            console.warn("⚠️ Firebase init failed :", e.message);
            this.isFirebaseReady = false;
        }
    }

    // ──────────────────────────────────────────
    // CHARGEMENT (Firebase puis localStorage)
    // ──────────────────────────────────────────
    async loadFiles() {
        if (this.isFirebaseReady) {
            try {
                const snap = await this.db.collection("cyberFiles")
                    .orderBy("date", "desc").get();
                this.files = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
                this._syncLocal();
                return;
            } catch (e) {
                console.warn("Firebase read error :", e.message);
            }
        }
        // Fallback localStorage
        try {
            const saved = localStorage.getItem('cyberFiles');
            this.files = saved ? JSON.parse(saved) : [];
        } catch { this.files = []; }
    }

    _syncLocal() {
        // Sauvegarde locale légère (sans base64 des fichiers cloud)
        const light = this.files.map(f => {
            const copy = { ...f };
            if (copy.downloadURL) delete copy.data; // ne stocke pas le base64 si cloud
            return copy;
        });
        try { localStorage.setItem('cyberFiles', JSON.stringify(light)); } catch {}
    }

    // ──────────────────────────────────────────
    // UPLOAD vers Firebase Storage + Firestore
    // ──────────────────────────────────────────
    async _uploadToCloud(fileObj) {
        if (!this.isFirebaseReady) return null;
        try {
            // 1. Upload binaire → Storage
            const path = `cyberFiles/${Date.now()}_${fileObj.name}`;
            const ref  = this.storage.ref(path);
            await ref.putString(fileObj.data, 'data_url');
            const downloadURL = await ref.getDownloadURL();

            // 2. Métadonnées → Firestore (sans base64)
            const meta = {
                name:        fileObj.name,
                size:        fileObj.size,
                date:        fileObj.date,
                category:    fileObj.category,
                storagePath: path,
                downloadURL
            };
            const doc = await this.db.collection("cyberFiles").add(meta);
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
            if (file.storagePath) {
                await this.storage.ref(file.storagePath).delete();
            }
        } catch (e) { console.warn("Delete cloud error :", e.message); }
    }

    async forceCloudSync() {
        if (!this.isFirebaseReady) {
            return showNotification("⚠️ Firebase non disponible", "error");
        }
        showNotification("🔄 Synchronisation en cours…");
        await this.loadFiles();
        this.render();
        this.updateDashboard();
        showNotification("✅ Sync terminée !", "success");
    }

    // ──────────────────────────────────────────
    // ✅ ANTI-DOUBLONS
    // ──────────────────────────────────────────
    isDuplicate(newFile) {
        return this.files.some(f =>
            f.name.toLowerCase() === newFile.name.toLowerCase() &&
            f.size === newFile.size
        );
    }

    // ──────────────────────────────────────────
    // GESTION UPLOAD FICHIERS
    // ──────────────────────────────────────────
    handleFiles(files) {
        if (!this.isOwner) return showNotification("🔒 Mode propriétaire requis", "warning");

        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                showNotification(`⚠️ ${file.name} dépasse 10 MB`, "warning");
                return;
            }

            const reader = new FileReader();
            reader.onload = async e => {
                const fileObj = {
                    name:     file.name,
                    size:     file.size,
                    date:     new Date().toISOString(),
                    data:     e.target.result,
                    category: this.getCategory(file.name)
                };

                // ── VÉRIFICATION DOUBLON ──────────────────
                if (this.isDuplicate(fileObj)) {
                    showNotification(`⚠️ Doublon ignoré : ${file.name}`, "warning");
                    return;
                }
                // ─────────────────────────────────────────

                // Essai cloud, sinon local
                const cloudResult = await this._uploadToCloud(fileObj);
                this.files.unshift(cloudResult || fileObj);
                this._syncLocal();
                this.render();
                this.updateDashboard();
                showNotification(
                    `✅ ${file.name} ajouté${cloudResult ? " ☁️" : " 💾"}`,
                    "success"
                );
            };
            reader.readAsDataURL(file);
        });
    }

    // ──────────────────────────────────────────
    // SUPPRESSION
    // ──────────────────────────────────────────
    async delete(index) {
        if (!confirm('Supprimer ce fichier définitivement ?')) return;
        const file = this.files[index];
        await this._deleteFromCloud(file);
        this.files.splice(index, 1);
        this._syncLocal();
        this.render();
        this.updateDashboard();
        showNotification("🗑️ Fichier supprimé", "success");
    }

    // ──────────────────────────────────────────
    // TÉLÉCHARGEMENT
    // ──────────────────────────────────────────
    download(index) {
        const file = this.files[index];
        // Si fichier cloud sans data local → ouvre l'URL directement
        if (!file.data && file.downloadURL) {
            window.open(file.downloadURL, '_blank');
            return;
        }
        const a = document.createElement('a');
        a.href     = file.data || file.downloadURL;
        a.download = file.name;
        a.click();
    }

    // ──────────────────────────────────────────
    // RENDU LISTE
    // ──────────────────────────────────────────
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

        if (!filtered.length) {
            container.innerHTML = `
                <div class="no-files">
                    <i class="fas fa-folder-open" style="font-size:5rem; color:rgba(255,255,255,0.1);"></i>
                    <h3>Aucun fichier trouvé</h3>
                    <p>Modifiez votre recherche ou filtre</p>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map((file, i) => `
            <div class="file-card">
                <div class="file-icon">
                    <i class="fas fa-${this.getIcon(file.name)}" style="font-size:3rem; color:${this.getIconColor(file.name)};"></i>
                </div>
                <div class="file-info">
                    <h4>${file.name}</h4>
                    <div class="file-meta">
                        <span class="file-size">${this.formatSize(file.size)}</span>
                        <span class="file-date">${new Date(file.date).toLocaleDateString('fr')}</span>
                        <span title="${file.downloadURL ? 'Stocké en ligne' : 'Local'}">${file.downloadURL ? '☁️' : '💾'}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="action-btn btn-preview"
                        onclick="appState.fileManager.download(${i})">
                        <i class="fas fa-download"></i> Télécharger
                    </button>
                    ${this.isOwner ? `
                    <button class="action-btn btn-delete"
                        onclick="appState.fileManager.delete(${i})">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
                </div>
            </div>
        `).join('');
    }

    // ──────────────────────────────────────────
    // DASHBOARD
    // ──────────────────────────────────────────
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
            <div class="stat-item"><span>${(size/1024/1024).toFixed(1)} MB</span><small>Stockage</small></div>
            <div class="stat-item"><span>${recent}</span><small>Récents</small></div>
            <div class="stat-item"><span>${onCloud} ☁️</span><small>En ligne</small></div>
        `;
    }

    // ──────────────────────────────────────────
    // EVENTS
    // ──────────────────────────────────────────
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

        const dropTarget = document.getElementById('dropTarget');
        if (dropTarget) {
            ['dragover', 'dragenter'].forEach(ev =>
                dropTarget.addEventListener(ev, e => e.preventDefault())
            );
            dropTarget.addEventListener('drop', e => {
                e.preventDefault();
                this.handleFiles(e.dataTransfer.files);
            });
            document.getElementById('fileSelector')?.addEventListener('change', e =>
                this.handleFiles(e.target.files)
            );
        }

        document.getElementById('backupExport')?.addEventListener('click', () => this.exportBackup());
        document.getElementById('backupImport')?.addEventListener('change', e =>
            this.importBackup(e.target.files[0])
        );
        document.getElementById('forceSync')?.addEventListener('click', () => this.forceCloudSync());
    }

    // ──────────────────────────────────────────
    // BOUTON PROPRIÉTAIRE
    // ──────────────────────────────────────────
    createOwnerButton() {
        // Évite les doublons de bouton
        document.querySelectorAll('.owner-btn-fixed').forEach(b => b.remove());

        const btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-lock"></i> Propriétaire';
        btn.className = 'btn btn-secondary owner-btn-fixed';
        btn.style.cssText = 'position:fixed; bottom:30px; right:30px; z-index:10000; box-shadow:0 4px 20px rgba(0,212,255,0.4);';
        btn.onclick = () => this.toggleOwnerMode();
        document.body.appendChild(btn);
    }

    toggleOwnerMode() {
        if (this.isOwner) {
            showNotification("👑 Vous êtes déjà propriétaire", "success");
            return;
        }
        const key = prompt('🔑 Clé propriétaire :');
        if (key === null) return;
        if (key === this.ownerKey) {
            this.isOwner = true;
            const si = document.getElementById('statusIndicator');
            if (si) { si.textContent = '👑 Propriétaire'; si.className = 'status-owner'; }
            document.getElementById('ownerPanel').style.display = 'block';
            showNotification('✅ Mode Propriétaire activé !', 'success');
            this.render();
        } else {
            showNotification('❌ Clé incorrecte', 'error');
        }
    }

    // ──────────────────────────────────────────
    // BACKUP
    // ──────────────────────────────────────────
    exportBackup() {
        const data = {
            files: this.files.map(f => ({
                name: f.name, size: f.size, date: f.date,
                category: f.category, data: f.data || null,
                downloadURL: f.downloadURL || null
            })),
            date: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = `cyber-backup-${new Date().toLocaleDateString('fr').replace(/\//g,'-')}.json`;
        a.click();
    }

    importBackup(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data   = JSON.parse(e.target.result);
                let added    = 0, dupes = 0;
                (data.files || []).forEach(f => {
                    if (this.isDuplicate(f)) { dupes++; }
                    else { this.files.unshift(f); added++; }
                });
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

    // ──────────────────────────────────────────
    // ✅ CATÉGORIES + POWERPOINT
    // ──────────────────────────────────────────
    getCategory(name) {
        const n = name.toLowerCase();
        if (n.endsWith('.pptx') || n.endsWith('.ppt')
            || n.includes('slides') || n.includes('presentation') || n.includes('cours'))
            return 'slides';
        if (n.includes('cyber') || n.includes('securite') || n.includes('hack') || n.includes('ctf'))
            return 'cyber';
        if (n.includes('reseau') || n.includes('network') || n.includes('cisco') || n.includes('ccna'))
            return 'reseau';
        if (n.includes('linux') || n.includes('bash') || n.includes('shell') || n.includes('unix'))
            return 'linux';
        return 'cyber'; // défaut
    }

    getIcon(name) {
        const ext = name.split('.').pop().toLowerCase();
        const map = {
            pdf:  'file-pdf',
            docx: 'file-word',
            doc:  'file-word',
            txt:  'file-alt',
            jpg:  'file-image',
            jpeg: 'file-image',
            png:  'file-image',
            zip:  'file-archive',
            rar:  'file-archive',
            pptx: 'file-powerpoint',
            ppt:  'file-powerpoint',
            xlsx: 'file-excel',
            xls:  'file-excel',
            mp4:  'file-video',
        };
        return map[ext] || 'file';
    }

    getIconColor(name) {
        const ext = name.split('.').pop().toLowerCase();
        const colors = {
            pdf:  '#ff4444',
            docx: '#2b579a', doc: '#2b579a',
            txt:  '#aaaaaa',
            jpg:  '#00b894',  jpeg: '#00b894', png: '#00b894',
            zip:  '#fdcb6e',  rar: '#fdcb6e',
            pptx: '#d04a02',  ppt: '#d04a02',
            xlsx: '#217346',  xls: '#217346',
        };
        return colors[ext] || '#00d4ff';
    }

    formatSize(bytes) {
        if (!bytes) return '—';
        if (bytes < 1024)        return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    }
}

// ============================================
// NAVIGATION MOBILE
// ============================================
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

// ============================================
// EFFET MACHINE À ÉCRIRE
// ============================================
function initTypingEffect() {
    const typedText = document.querySelector(".typed-text");
    const cursor    = document.querySelector(".cursor");
    if (!typedText || !cursor) return;

    function type() {
        const currentText = texts[textIndex];
        if (!isDeleting) {
            if (charIndex <= currentText.length) {
                typedText.textContent = currentText.substring(0, charIndex);
                charIndex++;
                typingTimeout = setTimeout(type, 100);
            } else {
                typingTimeout = setTimeout(() => { isDeleting = true; type(); }, 2000);
            }
        } else {
            if (charIndex >= 0) {
                typedText.textContent = currentText.substring(0, charIndex);
                charIndex--;
                typingTimeout = setTimeout(type, 50);
            } else {
                isDeleting = false;
                textIndex  = (textIndex + 1) % texts.length;
                typingTimeout = setTimeout(type, 500);
            }
        }
    }
    type();
}

// ============================================
// SCROLL & ANIMATIONS
// ============================================
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
                entry.target.style.opacity    = "1";
                entry.target.style.transform  = "translateY(0)";
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

// ============================================
// COMPTEURS
// ============================================
function initStatsCounter() {
    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-number').forEach(animateCounter);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    observer.observe(statsSection);
}

function animateCounter(el) {
    const target    = parseInt(el.getAttribute('data-target'));
    let current     = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) { el.textContent = target; clearInterval(timer); return; }
        el.textContent = Math.floor(current);
    }, 20);
}

function initEcoleAnimations() {
    const ecoleSection = document.querySelector('.ecole');
    if (!ecoleSection) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-number-ecole').forEach(animateEcoleCounter);
                observer.unobserve(ecoleSection);
            }
        });
    }, { threshold: 0.2 });
    observer.observe(ecoleSection);
}

function animateEcoleCounter(el) {
    const target = parseInt(el.getAttribute('data-target'));
    let current  = 0;
    const timer  = setInterval(() => {
        current += target / 50;
        if (current >= target) { el.textContent = target; clearInterval(timer); return; }
        el.textContent = Math.floor(current);
    }, 30);
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
}

// ============================================
// SKILLS BARS
// ============================================
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
}

// ============================================
// EFFET MATRIX
// ============================================
function initMatrixEffect() {
    const matrixBg = document.querySelector(".matrix-bg");
    if (!matrixBg) return;
    for (let i = 0; i < 40; i++) {
        const p = document.createElement("div");
        Object.assign(p.style, {
            position: "absolute", width: "2px", height: "2px",
            background: "#00ff88",
            left: Math.random() * 100 + "%",
            top:  Math.random() * 100 + "%",
            opacity: Math.random() * 0.7 + 0.3,
            animation: `float ${Math.random() * 3 + 2}s infinite`
        });
        matrixBg.appendChild(p);
    }
}

// ============================================
// FORMULAIRE CONTACT EMAILJS
// ============================================
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
        const name     = formData.get('from_name') || 'Anonyme';
        const email    = formData.get('from_email');
        const message  = formData.get('message')   || 'Bonjour !';

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

// ============================================
// BOUTON CV
// ============================================
function initCVButton() {
    const btn = document.getElementById("voirCV");
    if (!btn) return;
    btn.dataset.state = "preview";

    btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (this.dataset.state === "download") {
            const link = document.createElement("a");
            link.href      = "CV.pdf";
            link.download  = "CV_Fanaja_Misaina.pdf";
            link.click();
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

// ============================================
// NOTIFICATIONS TOAST
// ============================================
function showNotification(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    Object.assign(toast.style, {
        position: "fixed", top: "30px", right: "30px",
        padding: "16px 24px", borderRadius: "12px",
        color: "white", fontWeight: "600", zIndex: "10000",
        backdropFilter: "blur(15px)",
        transform: "translateX(400px)",
        transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
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

// ============================================
// THÈME DARK/LIGHT
// ============================================
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

// ============================================
// NETTOYAGE
// ============================================
function cleanupApp() {
    Object.values(appState.timeouts).forEach(clearTimeout);
    appState.observers.forEach(obs => obs.disconnect());
}

// ============================================
// UTILITAIRES
// ============================================
const throttle = (func, limit) => {
    let inThrottle;
    return function () {
        if (!inThrottle) {
            func.apply(this, arguments);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

console.log("🚀 Portfolio CYBERSÉCURITÉ L1 chargé avec succès !");