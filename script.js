
// ── [C4] Typer encapsulé ─────────────────────
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

// ── ÉTAT GLOBAL ───────────────────────────────
const appState = {
    isInitialized: false,
    observers:     [],
    timeouts:      {},
    fileManager:   null
};

// ── UTILITAIRES ───────────────────────────────

/** Échappe les caractères HTML (XSS fix) */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}

/** Hash SHA-256 d'une chaîne */
async function sha256(message) {
    const msgBuffer  = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/** Hash SHA-256 du contenu base64 d'un fichier */
async function hashFileContent(dataUrl) {
    const data = dataUrl ? dataUrl.split(',')[1] || dataUrl : '';
    return sha256(data);
}

/** Throttle avec trailing call */
const throttle = (func, limit) => {
    let inThrottle = false;
    let lastArgs   = null;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) { func.apply(this, lastArgs); lastArgs = null; }
            }, limit);
        } else {
            lastArgs = args;
        }
    };
};

// ── INITIALISATION ────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
    if (appState.isInitialized) return;
    appState.isInitialized = true;

    initAllFeatures();
    initThemeToggle();
    window.addEventListener('beforeunload', cleanupApp);
    // [FIX-B] On attend 500ms pour que le DOM soit prêt,
    // puis on initialise le FileManager UNE SEULE FOIS.
    setTimeout(() => initFileManager(), 500);
});

// ── [C5] initAllFeatures ──────────────────────
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
        try { fn(); }
        catch (e) { console.error(`[initAllFeatures] Erreur dans ${fn.name} :`, e); }
    });
}

// ── MATRIX / CANVAS ───────────────────────────
function initMatrixEffect() {
    const oldBg = document.querySelector('.matrix-bg');
    if (oldBg) oldBg.style.display = 'none';

    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    canvas.style.cssText = `
        position: fixed; top: 0; left: 0;
        width: 100vw; height: 100vh;
        z-index: -1; pointer-events: all;
        display: block; cursor: crosshair;`;
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    let W, H, dots, particles = [];
    const DOTS = 200, CONNECT_DIST = 150, MOUSE_DIST = 220, REPULSE_DIST = 110;
    let mouse = { x: -999, y: -999 };

    function init() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        dots = Array.from({ length: DOTS }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.7, vy: (Math.random() - 0.5) * 0.7,
            r: 1.2 + Math.random() * 2.5,
            color: Math.random() > 0.78 ? '#00d4ff' : Math.random() > 0.5 ? '#00ff88' : '#ffffff',
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.04,
            blink: Math.random(), blinkSpeed: 0.005 + Math.random() * 0.02
        }));
    }
    init();

    window.addEventListener('resize', init);
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('click', e => { mouse.x = e.clientX; mouse.y = e.clientY; explode(); });

    function explode() {
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            particles.push({
                x: mouse.x, y: mouse.y,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
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
            p.vx *= 0.95; p.vy *= 0.95; p.life *= 0.93;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fill(); ctx.globalAlpha = 1;
        });

        dots.forEach(d => {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > W) d.vx *= -1;
            if (d.y < 0 || d.y > H) d.vy *= -1;
            d.pulse += d.pulseSpeed; d.blink += d.blinkSpeed;
            const mdx = d.x - mouse.x, mdy = d.y - mouse.y;
            const md  = Math.sqrt(mdx * mdx + mdy * mdy);
            if (md < REPULSE_DIST && md > 0) {
                const force = (1 - md / REPULSE_DIST) * 2.8;
                d.x += (mdx / md) * force; d.y += (mdy / md) * force;
            }
        });

        for (let i = 0; i < DOTS; i++) {
            for (let j = i + 1; j < DOTS; j++) {
                const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECT_DIST) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0,220,120,${(1 - dist / CONNECT_DIST) * 0.55})`;
                    ctx.lineWidth = 0.6;
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.stroke();
                }
            }
            const mdx = dots[i].x - mouse.x, mdy = dots[i].y - mouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < MOUSE_DIST) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0,212,255,${(1 - mdist / MOUSE_DIST) * 0.9})`;
                ctx.lineWidth = 0.9;
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
                            : 'rgba(255,255,255,0.12)';
            const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, radius * 4);
            grad.addColorStop(0, haloColor); grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(d.x, d.y, radius * 4, 0, Math.PI * 2);
            ctx.fillStyle = grad; ctx.fill();
            ctx.beginPath(); ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = d.color; ctx.globalAlpha = blink * 0.95; ctx.fill(); ctx.globalAlpha = 1;
        });

        if (mouse.x > 0 && mouse.x < W) {
            ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
            ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0,212,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
        }
        requestAnimationFrame(draw);
    }
    draw();
}


// ── NAVIGATION MOBILE ─────────────────────────
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

// ── [C4] TYPER ───────────────────────────────
function initTypingEffect() {
    const typedText = document.querySelector(".typed-text");
    const cursor    = document.querySelector(".cursor");
    if (!typedText || !cursor) return;

    function type() {
        const currentText = typerState.texts[typerState.textIndex];
        if (!typerState.isDeleting) {
            if (typerState.charIndex <= currentText.length) {
                typedText.textContent = currentText.substring(0, typerState.charIndex++);
                typerState.timeout = setTimeout(type, 100);
            } else {
                typerState.timeout = setTimeout(() => { typerState.isDeleting = true; type(); }, 2000);
            }
        } else {
            if (typerState.charIndex >= 0) {
                typedText.textContent = currentText.substring(0, typerState.charIndex--);
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

// ── SCROLL & ANIMATIONS ───────────────────────
function initScrollSmooth() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute("href"))?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        el.style.opacity = "0"; el.style.transform = "translateY(30px)"; el.style.transition = "0.6s ease";
        observer.observe(el);
    });
    appState.observers.push(observer);
}

function initScrollTop() {
    const btn = document.getElementById("scrollTop");
    if (!btn) return;
    window.addEventListener("scroll", throttle(() => btn.classList.toggle("show", window.scrollY > 500), 16));
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
    window.addEventListener('scroll', throttle(() =>
        navbar.classList.toggle('scrolled', window.scrollY > 100), 16
    ));
}

// ── [C6] COMPTEURS UNIFIÉS ────────────────────
function animateCounter(el, steps = 100, interval = 20) {
    const target    = parseInt(el.getAttribute('data-target'), 10);
    let current     = 0;
    const increment = target / steps;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) { el.textContent = target; clearInterval(timer); return; }
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
                document.querySelectorAll('.stat-number-ecole').forEach(el => animateCounter(el, 50, 30));
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

// ── SKILL BARS ───────────────────────────────
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

// ── FORMULAIRE CONTACT ────────────────────────
function initContactForm() {
    const form = document.querySelector(".contact-form");
    if (!form || typeof emailjs === "undefined") { console.warn("EmailJS non chargé"); return; }
    emailjs.init("PCqGyE1CPI0Ao6DZO");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const name    = formData.get('from_name')  || 'Anonyme';
        const email   = formData.get('from_email');
        const message = formData.get('message')    || 'Bonjour !';

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            showNotification("❌ Email invalide", "error"); return;
        }
        const btn = form.querySelector("button[type='submit']");
        const original = btn.innerHTML;
        btn.disabled  = true; btn.innerHTML = "📤 Envoi...";

        try {
            await emailjs.send("service_zdtq7he", "template_vg944li", { from_name: name, from_email: email, message });
            showNotification("🎉 Message envoyé !", "success");
            form.reset();
        } catch (error) {
            console.error("EmailJS error:", error);
            showNotification("❌ Erreur envoi", "error");
        } finally {
            btn.disabled = false; btn.innerHTML = original;
        }
    });
}

// ── BOUTON CV ────────────────────────────────
function initCVButton() {
    const btn = document.getElementById("voirCV");
    if (!btn) return;
    btn.dataset.state = "preview";
    btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (this.dataset.state === "download") {
            const link = Object.assign(document.createElement("a"), { href: "Fandresena_CV.pdf", download: "CV_Fanaja_Misaina.pdf" });
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            showNotification("✅ CV téléchargé !", "success");
        } else {
            const eye = this.querySelector(".eye-icon");
            if (eye) eye.style.animation = "eyeBlink 0.6s";
            setTimeout(() => {
                window.open("CV.pdf", "CVPreview", "width=900,height=700");
                this.innerHTML = '<i class="fas fa-download"></i> Télécharger CV';
                this.dataset.state = "download";
            }, 400);
        }
    });
}

// ── NOTIFICATIONS TOAST ───────────────────────
function showNotification(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message; // textContent = pas d'injection XSS

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

// ── THÈME ─────────────────────────────────────
function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'dark') document.body.classList.add('dark-mode');
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
}

// ── ÂGE ──────────────────────────────────────
function initAge() {
    const el = document.getElementById('age-display');
    if (!el) return;
    const birth = new Date(2008, 9, 31);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    el.textContent = `(${age} ans)`;
}

// ── NETTOYAGE ─────────────────────────────────
function cleanupApp() {
    if (typerState.timeout) clearTimeout(typerState.timeout);
    Object.values(appState.timeouts).forEach(id => { clearTimeout(id); clearInterval(id); });
    appState.observers.forEach(obs => obs.disconnect());
}

// ── AIDE : GÉNÉRER VOTRE HASH ────────────────
// Dans la console du navigateur, exécutez UNE FOIS :
//   sha256('votre_mot_de_passe').then(h => console.log('ownerKeyHash =', h));
// Puis collez le résultat dans this.ownerKeyHash ci-dessus.

console.log("🚀 Portfolio CYBERSÉCURITÉ L1 — version débogée v2 !");