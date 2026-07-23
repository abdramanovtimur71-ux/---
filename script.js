/* ============================================
   JAVASCRIPT - Интерактивность и Анимации
   ============================================ */

// Плавная прокрутка
function scrollToSection(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

function isUserAuthenticated() {
    const userLogged = sessionStorage.getItem('isLoggedIn') === 'true';
    const userName = sessionStorage.getItem('userName');
    return userLogged && Boolean(userName);
}

function handleHeroMatrixCTA() {
    if (isUserAuthenticated()) {
        window.location.href = 'dashboard.html#matrix';
        return;
    }
    openRegistrationModal();
}

function updateScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = percent.toFixed(2) + '%';
}

// Счетчик статистики
const animateCountUp = () => {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.animated) {
                const target = parseInt(entry.target.dataset.target);
                const increment = target / 100;
                let current = 0;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        entry.target.textContent = target;
                        clearInterval(timer);
                    } else {
                        entry.target.textContent = Math.floor(current);
                    }
                }, 10);
                
                entry.target.animated = true;
            }
        });
    });
    
    statNumbers.forEach(number => observer.observe(number));
};

// Ленивая загрузка анимаций при видимости
const observeElements = () => {
    const elements = document.querySelectorAll('.fade-in, .slide-in, .about-card, .service-item');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.animation = reduceMotion
                    ? 'none'
                    : (entry.target.classList.contains('fade-in')
                        ? 'fadeIn var(--anim-medium, 0.65s) ease-out forwards'
                        : 'slideUp var(--anim-medium, 0.65s) ease-out forwards');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
};

// Ленивая загрузка частиц только при необходимости
let particlesInitialized = false;
const lazyInitParticles = () => {
    if (particlesInitialized) return;
    particlesInitialized = true;
    initMysticParticles();
};

// Инициализировать частицы при видимости hero секции
document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                lazyInitParticles();
                observer.unobserve(heroSection);
            }
        }, { threshold: 0.1 });
        observer.observe(heroSection);
    }
});

// Активная навигация при прокрутке
const updateActiveNav = () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
};

// Обработка отправки формы
const handleFormSubmit = () => {
    const form = document.querySelector('.contact-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '⟳ Отправка...';

        const name = form.querySelector('[name="name"], #contact-name, input[placeholder*="имя"], input[placeholder*="Имя"]');
        const email = form.querySelector('[name="email"], #contact-email, input[type="email"]');
        const message = form.querySelector('[name="message"], #contact-message, textarea');

        try {
            const resp = await fetch(API_BASE + '/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name ? name.value : '',
                    email: email ? email.value : '',
                    message: message ? message.value : ''
                })
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.ok && data.ok !== false) {
                submitBtn.textContent = '✓ Сообщение отправлено!';
                submitBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                form.reset();
            } else {
                throw new Error(data.message || 'Ошибка');
            }
        } catch {
            showError('Не удалось отправить сообщение. Попробуйте позже.');
            submitBtn.textContent = 'Ошибка отправки';
        } finally {
            submitBtn.disabled = false;
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
            }, 3000);
        }
    });
};

// Параллакс эффект при движении мыши
const mouseParallax = () => {
    const shapes = document.querySelectorAll('.floating-shape');
    
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 10;
            shape.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
        });
    });
};

// Эффект появления навигации при прокрутке
const navbarScroll = () => {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    });
};

// Анимация при наведении на карточки услуг
const serviceCardHover = () => {
    const serviceItems = document.querySelectorAll('.service-item, .mediumship-card');
    
    serviceItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px) scale(1.01)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
};

// Волновая анимация удалена для оптимизации производительности
const waveAnimation = () => {};
const addWaveStyle = () => {};

// Прогрессивная загрузка изображений
const lazyLoad = () => {
    const images = document.querySelectorAll('img');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.style.opacity = '0';
                img.onload = () => {
                    img.style.transition = 'opacity 0.5s ease-out';
                    img.style.opacity = '1';
                };
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
};

/* ════════════════════════════════════════════════
   ✦ COSMIC DESIGN — SHOOTING STARS & SCROLL REVEAL
   ════════════════════════════════════════════════ */

/** Падающие звёзды — создаём N элементов и добавляем на страницу */
function initShootingStars() {
    const count = 6;
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'shooting-star';
        star.style.left  = (15 + Math.random() * 75) + 'vw';
        star.style.top   = (Math.random() * 50) + 'vh';
        star.style.setProperty('--ss-dur',   (2.2 + Math.random() * 2.8) + 's');
        star.style.setProperty('--ss-delay', (Math.random() * 14) + 's');
        document.body.appendChild(star);
    }
}

/** Scroll-reveal — добавляем класс .cosmic-reveal к карточкам и запускаем observer */
function initCosmicReveal() {
    const selectors = [
        '.mediumship-card', '.service-item', '.blog-card',
        '.credential-card', '.about-feat-card', '.about-stat',
        '.info-card', '.interactive-card', '.booking-info > *',
        '.portfolio-item', '.guest-item', '.public-item'
    ];

    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            el.classList.add('cosmic-reveal');
        });
    });

    // Добавляем stagger к grid-контейнерам
    const staggerParents = [
        '.mediumship-content', '.services-grid', '.blog-grid',
        '.credentials-grid', '.about-stats', '.about-card-stack',
        '.booking-info', '.portfolio-grid'
    ];
    staggerParents.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.classList.add('cosmic-stagger');
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.cosmic-reveal').forEach(el => observer.observe(el));
}

/** Кнопки — отслеживаем мышь для позиции ripple */
function initButtonRipple() {
    document.querySelectorAll('.btn-primary, .submit-btn, .cta-button, .plan-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            btn.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
            btn.style.setProperty('--my', ((e.clientY - rect.top)  / rect.height * 100) + '%');
        });
    });
}

/** Параллакс hero-слоёв для глубины */
function initHeroLayerParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;

    const layers = [
        { el: hero.querySelector('.hero-orbit-tarot'), depth: 18 },
        { el: hero.querySelector('.hero-tarot-scene'), depth: 16 },
        { el: hero.querySelector('.hero-tarot'), depth: 11 },
        { el: hero.querySelector('.hero-candles'), depth: 9 },
        { el: hero.querySelector('.hero-side-candles'), depth: 7 },
        { el: hero.querySelector('.hero-stars'), depth: 5 },
    ].filter(item => item.el);

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const rx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ry = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        hero.style.setProperty('--hero-parallax-x', `${(rx * 18).toFixed(2)}px`);
        hero.style.setProperty('--hero-parallax-y', `${(ry * 14).toFixed(2)}px`);
        hero.style.setProperty('--hero-glow-x', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`);
        hero.style.setProperty('--hero-glow-y', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`);
        layers.forEach(({ el, depth }) => {
            const tx = rx * depth;
            const ty = ry * depth;
            el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        });
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
        hero.style.setProperty('--hero-parallax-x', '0px');
        hero.style.setProperty('--hero-parallax-y', '0px');
        hero.style.setProperty('--hero-glow-x', '50%');
        hero.style.setProperty('--hero-glow-y', '42%');
        layers.forEach(({ el }) => {
            el.style.transform = 'translate3d(0, 0, 0)';
        });
    });
}

// Инициализация всех функций при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
        // Анимации и эффекты
        waveAnimation();
        addWaveStyle();
        observeElements();
        animateCountUp();
        mouseParallax();
        lazyLoad();
        initMysticParticles();
        initCardAura();
        initUnifiedAuraTracking();
        initShootingStars();
        initCosmicReveal();
        initButtonRipple();
        initHeroLayerParallax();

        // Навигация и скролл
        updateActiveNav();
        navbarScroll();
        updateScrollProgress();

        // Интерактивность форм
        handleFormSubmit();
        formGlowEffect();
        formProtection();
        serviceCardHover();

        // Авторизация и профиль
        checkLoginStatus();
        setupProfileMenuInteractions();

        // UI
        initAtmosphereModes();
        initMotionModes();
        initNavPrefsPanel();
        initHeroNebulaCanvas();

        // Первая навигационная ссылка активна
        const firstNavLink = document.querySelector('.nav-link');
        if (firstNavLink) {
            firstNavLink.classList.add('active');
        }
    });
});

window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);

// Обработка клавиатуры для навигации
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
        window.scrollBy({ top: 100, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
        window.scrollBy({ top: -100, behavior: 'smooth' });
    }
});

// Случайная позиция фигур при загрузке
window.addEventListener('load', () => {
    const shapes = document.querySelectorAll('.floating-shape');
    shapes.forEach(shape => {
        const randomX = Math.random() * 200 - 100;
        const randomY = Math.random() * 200 - 100;
        shape.style.left = randomX + 'px';
        shape.style.top = randomY + 'px';
    });
});

// Защита от потери данных в форме + эффект свечения при фокусе
const formProtection = () => {
    const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
    let hasChanges = false;

    formInputs.forEach(input => {
        input.addEventListener('change', () => {
            hasChanges = true;
        });

        input.addEventListener('focus', function() {
            this.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 0 15px rgba(102, 126, 234, 0.3)';
        });

        input.addEventListener('blur', function() {
            this.style.boxShadow = 'none';
        });
    });

    window.addEventListener('beforeunload', (e) => {
        if (hasChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
};

const formGlowEffect = () => formProtection();

/* ============================================
   ВАЛИДАЦИЯ И ИНДИКАТОРЫ ЗАГРУЗКИ
   ============================================ */

const FormValidator = {
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^[\d\s\-\+\(\)]{6,}$/.test(value),
    name: (value) => value.trim().length >= 2,
    text: (value) => value.trim().length >= 3,
    password: (value) => value.length >= 6,
    strongPassword: (value) => value.length >= 8 && /[a-z]/.test(value) && /[0-9]/.test(value)
};

function showLoadingIndicator(element) {
    const btn = element.closest('form')?.querySelector('.submit-btn') || element;
    const originalText = btn.textContent;
    const originalDisabled = btn.disabled;

    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block;margin-right:8px;">⟳</span>Загрузка...';
    btn.style.opacity = '0.7';

    return () => {
        btn.textContent = originalText;
        btn.disabled = originalDisabled;
        btn.style.opacity = '1';
    };
}

function validateField(input, validator) {
    const isValid = validator(input.value);
    const errorSpan = input.parentElement?.querySelector('.form-error');

    if (!isValid) {
        input.style.borderColor = '#E74C3C';
        if (errorSpan) {
            errorSpan.textContent = `Некорректное значение`;
            errorSpan.style.display = 'block';
        }
    } else {
        input.style.borderColor = '';
        if (errorSpan) {
            errorSpan.style.display = 'none';
        }
    }

    return isValid;
}

function validateForm(form, rules) {
    let isValid = true;
    Object.entries(rules).forEach(([selector, validator]) => {
        const input = form.querySelector(selector);
        if (input && !validateField(input, validator)) {
            isValid = false;
        }
    });
    return isValid;
}

// Дебаунс функция для управления событиями
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Оптимизированная обработка скролла с debounce
window.addEventListener('scroll', debounce(() => {
    updateActiveNav();
    navbarScroll();
}, 100), { passive: true });

// Указание браузеру на предварительную загрузку ресурсов
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        // Предзагрузка изображений и других ресурсов
        const preloadLinks = document.querySelectorAll('link[rel="preload"]');
        preloadLinks.forEach(link => {
            link.rel = 'prefetch';
        });
    });
}

/* ============================================
   МИСТИЧЕСКИЕ ЭФФЕКТЫ — АТМОСФЕРА
   ============================================ */

// Плавающие мистические частицы-орбы
function initMysticParticles() {
    const configs = [
        { size: 6,  color: 'rgba(138,109,192,VAR)', op: 0.50, dur: 12, delay: 0    },
        { size: 4,  color: 'rgba(212,174,92,VAR)',  op: 0.40, dur: 16, delay: 3.5  },
        { size: 8,  color: 'rgba(138,109,192,VAR)', op: 0.35, dur: 10, delay: 1.8  },
        { size: 3,  color: 'rgba(255,255,255,VAR)', op: 0.30, dur: 18, delay: 6    },
        { size: 5,  color: 'rgba(196,162,74,VAR)',  op: 0.38, dur: 14, delay: 2.2  },
        { size: 4,  color: 'rgba(138,109,192,VAR)', op: 0.45, dur: 9,  delay: 4.7  },
        { size: 3,  color: 'rgba(212,174,92,VAR)',  op: 0.32, dur: 20, delay: 8    },
        { size: 6,  color: 'rgba(170,142,222,VAR)', op: 0.42, dur: 11, delay: 0.9  },
        { size: 5,  color: 'rgba(138,109,192,VAR)', op: 0.28, dur: 15, delay: 5.3  },
        { size: 4,  color: 'rgba(196,162,74,VAR)',  op: 0.36, dur: 13, delay: 7.1  },
    ];

    configs.forEach((cfg, i) => {
        const el = document.createElement('div');
        el.className = 'mystic-particle';
        const x = 5 + Math.random() * 90;
        const y = 10 + Math.random() * 80;
        const dx  = (Math.random() - 0.5) * 60;
        const dy  = -(30 + Math.random() * 80);
        const dx2 = (Math.random() - 0.5) * 50;
        const dy2 = -(100 + Math.random() * 100);
        const color = cfg.color.replace('VAR', '1');
        Object.assign(el.style, {
            width:  cfg.size + 'px',
            height: cfg.size + 'px',
            left:   x + 'vw',
            top:    y + 'vh',
            background: `radial-gradient(circle, ${color} 0%, transparent 100%)`,
            boxShadow: `0 0 ${cfg.size * 3}px ${color}`,
            '--op':    cfg.op,
            '--dur':   cfg.dur + 's',
            '--delay': cfg.delay + 's',
            '--dx':    dx + 'px',
            '--dy':    dy + 'px',
            '--dx2':   dx2 + 'px',
            '--dy2':   dy2 + 'px',
        });
        document.body.appendChild(el);
    });
}

// Аура курсора внутри карточек
function initCardAura() {
    const cards = document.querySelectorAll('.mediumship-card, .service-item');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
            const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
            card.style.setProperty('--card-mx', x);
            card.style.setProperty('--card-my', y);
        });
    });
}

// Универсальный трекинг курсора для мягкой ауры карточек
function initUnifiedAuraTracking() {
    const cards = document.querySelectorAll(
        '.about-feat-card, .mediumship-card, .process-step, .credential-card, .testimonial-card, .blog-card, .faq-item, .info-card, .guest-item, .public-item, .shop-card'
    );
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
            const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
            card.style.setProperty('--mx', x);
            card.style.setProperty('--my', y);
        }, { passive: true });
    });
}

// Пароль проверяется только на backend — не хранится в клиентском коде
const API_BASE = (() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = (params.get('api') || '').trim().replace(/\/$/, '');
    if (/^https?:\/\//i.test(fromQuery)) {
        localStorage.setItem('apiBaseUrl', fromQuery);
        return fromQuery;
    }
    const isLocalHost = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
    if (isLocalHost) {
        return 'http://127.0.0.1:5000';
    }
    return (localStorage.getItem('apiBaseUrl') || 'https://roza-ogly-api.onrender.com').trim().replace(/\/$/, '');
})();

function getStorageArray(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
}

function setStorageArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function addAdminRecord(key, payload) {
    const items = getStorageArray(key);
    items.unshift({ id: Date.now(), createdAt: new Date().toISOString(), ...payload });
    setStorageArray(key, items.slice(0, 200));
}

async function openAdminAccess() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            <div class="modal-header">
                <h2>Вход администратора</h2>
                <p>Введите пароль доступа</p>
            </div>
            <form class="admin-login-form">
                <div class="form-group">
                    <label>Пароль</label>
                    <div class="password-field">
                        <input type="password" id="adminPassword" placeholder="Пароль" required>
                        <button type="button" class="show-password" onclick="this.parentElement.querySelector('input').type = this.parentElement.querySelector('input').type === 'password' ? 'text' : 'password'; this.textContent = this.parentElement.querySelector('input').type === 'password' ? '👁️' : '🙈'">👁️</button>
                    </div>
                </div>
                <button type="submit" class="submit-btn" style="width:100%">Войти</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    modal.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('adminPassword').value.trim();

        if (!code) {
            showError('Введите пароль');
            return;
        }

        const resetBtn = showLoadingIndicator(modal.querySelector('.submit-btn'));

        try {
            const response = await fetch(API_BASE + '/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: code })
            });
            const data = await response.json();
            if (!response.ok || !data.ok) {
                showError(data.message || 'Ошибка входа');
                resetBtn();
                return;
            }
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            sessionStorage.setItem('adminToken', data.token);
            showSuccess('✓ Вы вошли в админ-панель');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 500);
        } catch (error) {
            showError('Сервер авторизации недоступен. Попробуйте позже.');
            resetBtn();
            return;
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.parentElement) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });
}

// Функции для работы с модальными окнами входа

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openRegistrationModal() {
    closeLoginModal();
    const modal = document.getElementById('registrationModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openForgotPasswordModal() {
    const existingModal = document.getElementById('forgotPasswordModal');
    if (existingModal) {
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'forgotPasswordModal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal" type="button">×</button>
            <div class="modal-header">
                <h2>Восстановление пароля</h2>
                <p>Код придет в WhatsApp или SMS на номер, привязанный к аккаунту</p>
            </div>
            <form id="forgotPasswordRequestForm" class="login-form">
                <div class="form-group">
                    <label>Email адрес</label>
                    <input type="email" id="forgotEmail" placeholder="ваш@email.com" required>
                </div>
                <div class="form-group">
                    <label>Номер телефона</label>
                    <input type="tel" id="forgotPhone" placeholder="+7 777 123 45 67" required>
                </div>
                <div class="form-group">
                    <label>Канал отправки</label>
                    <select id="forgotChannel" required>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                    </select>
                </div>
                <button type="submit" class="submit-btn">Отправить код</button>
            </form>
            <form id="forgotPasswordResetForm" class="login-form" style="display:none">
                <div class="form-group">
                    <label>Шаг 2 · Код подтверждения</label>
                    <p class="modal-note">Введите 6-значный код, который пришёл в SMS или WhatsApp.</p>
                </div>
                <div class="form-group">
                    <label>Код из сообщения</label>
                    <input type="text" id="forgotCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\\d{6}" placeholder="6 цифр" required>
                </div>
                <div class="form-group">
                    <label>Новый пароль</label>
                    <input type="password" id="forgotNewPassword" placeholder="Минимум 8 символов" required>
                </div>
                <button type="submit" class="submit-btn">Сменить пароль</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    };

    modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    const requestForm = modal.querySelector('#forgotPasswordRequestForm');
    const resetForm = modal.querySelector('#forgotPasswordResetForm');
    const emailInput = modal.querySelector('#forgotEmail');
    const phoneInput = modal.querySelector('#forgotPhone');
    const channelInput = modal.querySelector('#forgotChannel');

    requestForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = (emailInput.value || '').trim();
        const phone = (phoneInput.value || '').trim();
        const channel = (channelInput.value || '').trim();

        if (!email || !phone || !channel) {
            showError('Заполните email, телефон и канал отправки');
            return;
        }

        const resetBtn = showLoadingIndicator(requestForm.querySelector('.submit-btn'));
        try {
            const response = await fetch(API_BASE + '/api/auth/password/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, phone, channel })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.ok) {
                showError(data.message || 'Не удалось отправить код');
                resetBtn();
                return;
            }
            requestForm.style.display = 'none';
            resetForm.style.display = 'block';
            const codeInput = modal.querySelector('#forgotCode');
            if (data.debugCode && codeInput) {
                codeInput.value = data.debugCode;
            }
            codeInput?.focus();
            showSuccess(data.debugCode ? `Код подтверждения: ${data.debugCode}` : 'Код подтверждения отправлен. Проверьте сообщения.');
            resetBtn();
        } catch {
            showError('Сервер восстановления пароля недоступен');
            resetBtn();
        }
    });

    resetForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = (emailInput.value || '').trim();
        const code = (modal.querySelector('#forgotCode').value || '').trim();
        const newPassword = modal.querySelector('#forgotNewPassword').value || '';

        if (!/^\d{6}$/.test(code)) {
            showError('Введите 6-значный код');
            return;
        }
        if (!FormValidator.strongPassword(newPassword)) {
            showError('Пароль должен быть от 8 символов, содержать буквы и цифры');
            return;
        }

        const resetBtn = showLoadingIndicator(resetForm.querySelector('.submit-btn'));
        try {
            const response = await fetch(API_BASE + '/api/auth/password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.ok) {
                showError(data.message || 'Не удалось сменить пароль');
                resetBtn();
                return;
            }

            showSuccess('Пароль обновлен. Вы вошли в кабинет.');
            resetBtn();
            closeModal();
        } catch {
            showError('Сервер восстановления пароля недоступен');
            resetBtn();
        }
    });
}

document.addEventListener('click', (event) => {
    const forgotLink = event.target.closest('.forgot-password');
    if (!forgotLink) {
        return;
    }
    event.preventDefault();
    openForgotPasswordModal();
});

// Закрытие модального окна при клике на фон
document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    const registrationModal = document.getElementById('registrationModal');
    
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            closeLoginModal();
        }
        if (event.target === registrationModal) {
            closeRegistrationModal();
        }
    });
    
    // Закрытие при нажатии Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeLoginModal();
            closeRegistrationModal();
        }
    });
});

// Переключение видимости пароля
function togglePassword(btn) {
    const passwordInput = document.getElementById('password');
    const button = btn || event.currentTarget;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (button) button.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        if (button) button.textContent = '👁️';
    }
}

function toggleRegistrationPassword(btn) {
    const passwordInput = document.getElementById('reg-password');
    const button = btn || event.currentTarget;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (button) button.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        if (button) button.textContent = '👁️';
    }
}

// Обработка формы входа
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginFormElement');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // Валидация
            if (!email || !password) {
                showError('Пожалуйста, заполните все поля');
                return;
            }
            
            if (password.length < 6) {
                showError('Пароль должен содержать не менее 6 символов');
                return;
            }
            
            // Храним только минимальную информацию сессии без email
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userName', email.split('@')[0]);
            
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            // Имитация входа
            simulateLogin(email);
        });
    }
});

// Обработка формы регистрации
document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationFormElement');
    
    if (registrationForm) {
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const agree = document.getElementById('agree').checked;
            
            // Валидация
            if (!name || !email || !password || !confirmPassword) {
                showError('Пожалуйста, заполните все поля');
                return;
            }
            
            if (password.length < 8) {
                showError('Пароль должен содержать не менее 8 символов');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('Пароли не совпадают');
                return;
            }
            
            if (!agree) {
                showError('Пожалуйста, согласитесь с условиями использования');
                return;
            }
            
            // Храним только минимальную информацию сессии без email
            sessionStorage.setItem('userName', name);
            sessionStorage.setItem('isLoggedIn', 'true');

            addAdminRecord('registrations', {
                name,
                email,
                source: 'index-registration'
            });
            
            // Имитация регистрации
            simulateLogin(name);
        });
    }
});

// Функция для имитации входа
function simulateLogin(userName) {
    const loginBtn = document.querySelector('.login-btn');
    const userProfile = document.getElementById('userProfile');
    const profileAvatar = document.querySelector('.profile-avatar');
    
    if (loginBtn) loginBtn.style.display = 'none';
    
    userProfile.classList.remove('hidden');
    
    // Устанавливаем аватар с первой буквой имени
    if (profileAvatar) {
        profileAvatar.textContent = userName.charAt(0).toUpperCase();
    }
    
    closeRegistrationModal();
    closeLoginModal();
    
    // Показываем сообщение об успехе
    showSuccess(`Добро пожаловать, ${userName}!`);
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 800);
}

// Функция проверки статуса входа при загрузке страницы
function checkLoginStatus() {
    const userLogged = sessionStorage.getItem('isLoggedIn');
    const userName = sessionStorage.getItem('userName');
    
    if (userLogged === 'true' && userName) {
        const loginBtn = document.querySelector('.login-btn');
        const userProfile = document.getElementById('userProfile');
        const profileAvatar = document.querySelector('.profile-avatar');
        
        if (loginBtn) loginBtn.style.display = 'none';
        userProfile.classList.remove('hidden');
        userProfile.classList.remove('open');
        
        if (profileAvatar) {
            profileAvatar.textContent = userName.charAt(0).toUpperCase();
        }
    }
}

function toggleProfileMenu(event) {
    event.stopPropagation();
    const userProfile = document.getElementById('userProfile');
    if (!userProfile || userProfile.classList.contains('hidden')) {
        return;
    }
    userProfile.classList.toggle('open');
}

function setupProfileMenuInteractions() {
    const userProfile = document.getElementById('userProfile');
    if (!userProfile) {
        return;
    }

    document.addEventListener('click', (event) => {
        if (!userProfile.classList.contains('hidden') && !userProfile.contains(event.target)) {
            userProfile.classList.remove('open');
        }
    });

    userProfile.querySelectorAll('.profile-link').forEach((link) => {
        link.addEventListener('click', () => {
            userProfile.classList.remove('open');
        });
    });
}

// Функция выхода
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('adminToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminOfflineAccess');
    
    const loginBtn = document.querySelector('.login-btn');
    const userProfile = document.getElementById('userProfile');
    
    if (loginBtn) loginBtn.style.display = 'block';
    userProfile.classList.add('hidden');
    
    showSuccess('Вы успешно вышли из сессии');
}

// Обработка формы записи на главной странице
document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingFormElement');
    if (!bookingForm) {
        return;
    }

    const dateField = bookingForm.querySelector('input[type="date"]');
    const timeField = bookingForm.querySelector('input[type="time"]');
    const serviceField = bookingForm.querySelector('select');
    const slotRoot = document.getElementById('mainBookingSlots');
    const insightText = document.getElementById('bookingInsightText');
    const insightDuration = document.getElementById('bookingInsightDuration');
    const insightPrice = document.getElementById('bookingInsightPrice');

    const serviceAdvice = {
        tarot: {
            duration: '40-60 мин',
            price: 'от 5 000 ₸',
            text: 'Идеально для выбора между вариантами и понимания ближайшего периода.'
        },
        spirits: {
            duration: '60-90 мин',
            price: 'от 10 000 ₸',
            text: 'Бережный глубокий формат. Лучше выбрать спокойное время без спешки.'
        },
        cleaning: {
            duration: '60 мин',
            price: 'от 7 500 ₸',
            text: 'Рекомендуется после эмоциональной перегрузки и ощущения утечки сил.'
        },
        astro: {
            duration: '60-90 мин',
            price: 'от 9 000 ₸',
            text: 'Подходит для планирования важных шагов на месяц/год вперед.'
        },
        reiki: {
            duration: '45 мин',
            price: 'от 6 000 ₸',
            text: 'Мягкая энергетическая настройка, хорошо сочетается с восстановлением сна.'
        },
        coaching: {
            duration: '90 мин',
            price: 'от 12 500 ₸',
            text: 'Долгий формат для системных изменений и индивидуальной стратегии.'
        }
    };

    function renderBookingInsight() {
        if (!serviceField || !insightText || !insightDuration || !insightPrice) return;
        const value = serviceField.value;
        const advice = serviceAdvice[value];
        if (!advice) {
            insightText.textContent = 'Выберите услугу, чтобы увидеть длительность, ориентир стоимости и подготовку к сеансу.';
            insightDuration.textContent = 'Длительность: —';
            insightPrice.textContent = 'Стоимость: —';
            return;
        }
        insightText.textContent = advice.text;
        insightDuration.textContent = 'Длительность: ' + advice.duration;
        insightPrice.textContent = 'Стоимость: ' + advice.price;
    }

    async function loadSlotHints() {
        if (!dateField || !slotRoot) return;
        const date = (dateField.value || '').trim();
        if (!date) {
            slotRoot.innerHTML = '';
            return;
        }
        const qs = new URLSearchParams({ date });
        if (timeField && timeField.value) {
            qs.set('time', timeField.value);
        }
        try {
            const response = await fetch(API_BASE + '/api/bookings/slots?' + qs.toString());
            const data = await response.json();
            if (!response.ok || !data.ok) {
                slotRoot.innerHTML = '<div class="slot-hint-empty">Не удалось загрузить свободные слоты</div>';
                return;
            }
            const list = (data.available || []).slice(0, 8);
            if (!list.length) {
                slotRoot.innerHTML = '<div class="slot-hint-empty">На эту дату нет свободных слотов</div>';
                return;
            }
            slotRoot.innerHTML = '<div class="slot-hint-title">Свободное время:</div>'
                + '<div class="slot-chip-row">'
                + list.map((t) => '<button type="button" class="slot-chip" data-time="' + t + '">' + t + '</button>').join('')
                + '</div>';
            slotRoot.querySelectorAll('.slot-chip').forEach((btn) => {
                btn.addEventListener('click', () => {
                    if (timeField) {
                        timeField.value = btn.getAttribute('data-time') || '';
                    }
                });
            });
        } catch {
            slotRoot.innerHTML = '<div class="slot-hint-empty">Сервер недоступен, подсказки времени временно отключены</div>';
        }
    }

    if (dateField) {
        dateField.addEventListener('change', loadSlotHints);
    }
    if (timeField) {
        timeField.addEventListener('change', loadSlotHints);
    }
    if (serviceField) {
        serviceField.addEventListener('change', renderBookingInsight);
    }

    renderBookingInsight();

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameField = bookingForm.querySelector('input[type="text"]');
        const phoneField = bookingForm.querySelector('input[type="tel"]');
        const emailField = bookingForm.querySelector('input[type="email"]');
        const noteField = bookingForm.querySelector('textarea');

        // Валидация
        if (!validateField(nameField, FormValidator.name) ||
            !validateField(phoneField, FormValidator.phone) ||
            !validateField(emailField, FormValidator.email)) {
            showError('Пожалуйста, заполните все поля корректно');
            return;
        }

        const resetBtn = showLoadingIndicator(bookingForm.querySelector('.submit-btn'));

        const payload = {
            name: nameField ? nameField.value.trim() : '',
            phone: phoneField ? phoneField.value.trim() : '',
            email: emailField ? emailField.value.trim() : '',
            service: serviceField ? serviceField.options[serviceField.selectedIndex].text : '',
            date: dateField ? dateField.value : '',
            time: timeField ? timeField.value : '',
            format: 'Запись через сайт',
            note: noteField ? noteField.value.trim() : ''
        };

        try {
            const response = await fetch(API_BASE + '/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                if (data && data.conflict) {
                    showError((data.message || 'Это время занято') + (data.suggestedTime ? (' Рекомендуем: ' + data.suggestedTime) : ''));
                    if (data.suggestedTime && timeField) {
                        timeField.value = data.suggestedTime;
                    }
                    await loadSlotHints();
                    resetBtn();
                    return;
                }
                showError(data.message || 'Не удалось записаться');
                resetBtn();
                return;
            }

            addAdminRecord('bookings', {
                name: payload.name || 'Не указано',
                email: payload.email || 'Не указано',
                service: payload.service || 'Не указано',
                date: payload.date,
                time: payload.time,
                source: 'index-booking-api'
            });

            bookingForm.reset();
            if (slotRoot) slotRoot.innerHTML = '';
            showSuccess('✓ Вы успешно записаны. Уведомления отправлены автоматически.');
            resetBtn();
        } catch (error) {
            showError('Сервер записи недоступен. Проверьте соединение и повторите попытку.');
            resetBtn();
        }
    });
});

function renderGuestReviews() {
    const list = document.getElementById('guestReviewsList');
    if (!list) {
        return;
    }

    const defaults = [
        { name: 'Айгерим', rating: 5, text: 'Очень спокойная и профессиональная консультация. После сеанса стало легче принимать решения.' },
        { name: 'Нурлан', rating: 5, text: 'Понравилась точность расклада и поддержка после встречи. Рекомендую.' },
        { name: 'Жанна', rating: 4, text: 'Уютная атмосфера и сильная энергетика. Спасибо за внимание к деталям.' }
    ];

    const stored = getStorageArray('guestReviews');
    const reviews = stored.length ? stored : defaults;

    list.innerHTML = reviews
        .slice(0, 12)
        .map((item) => {
            const stars = '★★★★★'.slice(0, Number(item.rating || 5)) + '☆☆☆☆☆'.slice(0, 5 - Number(item.rating || 5));
            return `
                <article class="guest-item">
                    <div class="guest-item-head">
                        <span class="guest-item-name">${item.name}</span>
                        <span class="guest-item-stars">${stars}</span>
                    </div>
                    <p class="guest-item-text">${item.text}</p>
                </article>
            `;
        })
        .join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('guestReviewForm');
    renderGuestReviews();

    if (!form) {
        return;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('guestName').value.trim();
        const rating = Number(document.getElementById('guestRating').value || 5);
        const text = document.getElementById('guestText').value.trim();

        // Валидация
        if (!validateField(form.querySelector('#guestName'), FormValidator.name) ||
            !validateField(form.querySelector('#guestText'), FormValidator.text)) {
            showError('Заполните имя и текст отзыва корректно');
            return;
        }

        if (!name || !text) {
            showError('Заполните имя и текст отзыва');
            return;
        }

        const resetBtn = showLoadingIndicator(form.querySelector('.submit-btn'));

        const items = getStorageArray('guestReviews');
        items.unshift({ name, rating, text, createdAt: new Date().toISOString() });
        setStorageArray('guestReviews', items.slice(0, 40));
        addAdminRecord('guestReviews', { name, rating, text, source: 'site-guest-review' });

        form.reset();
        renderGuestReviews();
        showSuccess('✓ Спасибо! Ваш отзыв опубликован.');
        resetBtn();
    });
});

async function renderPublicContent() {
    const root = document.getElementById('publicContentList');
    if (!root) {
        return;
    }

    root.innerHTML = '<div class="public-item"><p>⟳ Загрузка...</p></div>';

    try {
        const response = await fetch(API_BASE + '/api/content', {
            signal: AbortSignal.timeout(5000)
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            root.innerHTML = '<div class="public-item"><p>⚠ Материалы скоро появятся.</p></div>';
            return;
        }

        const names = {
            story: 'История',
            doc: 'Документ',
            photo: 'Фото',
            video: 'Видео'
        };

        const items = (data.items || []).slice(0, 20);
        if (!items.length) {
            root.innerHTML = '<div class="public-item"><p>Пока нет публикаций.</p></div>';
            return;
        }

        root.innerHTML = items.map((item) => {
            const kind = names[item.kind] || item.kind;
            const link = item.media_url ? '<a href="' + item.media_url + '" target="_blank" rel="noopener noreferrer">Открыть →</a>' : '';
            const body = item.body ? item.body : 'Без описания';
            return '<article class="public-item">'
                + '<div class="kind">' + kind + '</div>'
                + '<h3>' + (item.title || 'Без названия') + '</h3>'
                + '<p>' + body + '</p>'
                + link
                + '</article>';
        }).join('');
    } catch (error) {
        if (error.name === 'AbortError') {
            root.innerHTML = '<div class="public-item"><p>⚠ Загрузка заняла слишком много времени.</p></div>';
        } else {
            root.innerHTML = '<div class="public-item"><p>⚠ Не удалось загрузить публикации.</p></div>';
        }
    }
}

document.addEventListener('DOMContentLoaded', renderPublicContent);

// Показ сообщения об ошибке
function showError(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #E74C3C;
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideUp 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Показ сообщения об успехе
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27AE60;
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideUp 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/* ============================================
   ИНТЕРАКТИВНЫЕ ФУНКЦИИ
   ============================================ */

// Данные для гаданий
const tarotCards = [
    { name: "Маг", meaning: "Начало, инициатива, самоопределение" },
    { name: "Верховная Жрица", meaning: "Интуиция, миролюбивость, скрытые знания" },
    { name: "Императрица", meaning: "Плодородие, красота, природная власть" },
    { name: "Император", meaning: "Власть, лидерство, отцовство" },
    { name: "Иерофант", meaning: "Духовность, ритуал, традиция" },
    { name: "Влюбленные", meaning: "Любовь, гармония, ценности" },
    { name: "Колесница", meaning: "Контроль, воля, целеустремленность" },
    { name: "Отшельник", meaning: "Размышление, осторожность, поиск" },
    { name: "Колесо Судьбы", meaning: "Судьба, новые циклы, удача" },
    { name: "Справедливость", meaning: "Справедливость, равновесие, правда" }
];

const dailyAdvices = [
    "Сегодня - хороший день для новых начинаний. Не бойтесь делать первый шаг!",
    "Обратите внимание на свою интуицию. Она подскажет вам правильный путь.",
    "День благоприятен для медитации и размышлений. Найдите время для себя.",
    "Энергия сегодня поддерживает общение с любимыми людьми. Свяжитесь с ними!",
    "День требует действия. Не откладывайте важные дела на потом.",
    "Слушайте звёзды. Вселенная посылает вам положительные знак.",
    "Хороший день для творчества и самовыражения. Позвольте себе быть собой.",
    "День благоприятен для переговоров и компромиссов.",
    "Сегодня хороший день для исцеления и гармонии. Позаботьтесь о себе.",
    "Энергия дня поддерживает финансовые начинания. Рассмотрите возможности."
];

// Гадание с картами таро
function drawTarotCard() {
    const cardResult = document.getElementById('cardResult');
    const randomIndex = Math.floor(Math.random() * tarotCards.length);
    const card = tarotCards[randomIndex];
    
    cardResult.innerHTML = `
        <h4 style="color: var(--primary); margin-bottom: 10px;">Ваша Карта: ${card.name}</h4>
        <p style="margin: 0; font-size: 14px; line-height: 1.6;">
            <strong>Значение:</strong> ${card.meaning}
        </p>
    `;
    cardResult.classList.remove('hidden');
}

// Число удачи
function getLuckyNumber() {
    const numberResult = document.getElementById('numberResult');
    const luckyNumber = Math.floor(Math.random() * 100) + 1;
    const significance = {
        lucky: luckyNumber % 2 === 0 ? 'четное (стабильность)' : 'нечетное (динамика)',
        meaning: luckyNumber < 33 ? 'энергия новых начинаний' : luckyNumber < 67 ? 'баланс и гармония' : 'высокая вибрация и успех'
    };
    
    numberResult.innerHTML = `
        <h4 style="color: var(--primary); margin-bottom: 10px; font-size: 32px; font-weight: 700;">
            ✨ ${luckyNumber}
        </h4>
        <p style="margin: 0; font-size: 14px;">
            <strong>Тип:</strong> ${significance.lucky}<br>
            <strong>Значение:</strong> ${significance.meaning}
        </p>
    `;
    numberResult.classList.remove('hidden');
}

// Совет дня
function getDailyAdvice() {
    const adviceResult = document.getElementById('adviceResult');
    const randomIndex = Math.floor(Math.random() * dailyAdvices.length);
    const advice = dailyAdvices[randomIndex];
    
    adviceResult.innerHTML = `
        <p style="margin: 0; font-size: 16px; line-height: 1.8; font-style: italic;">
            "💫 ${advice}"
        </p>
    `;
    adviceResult.classList.remove('hidden');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', checkLoginStatus);
document.addEventListener('DOMContentLoaded', setupProfileMenuInteractions);

const MOTION_LEVELS = ['soft', 'normal', 'cinema'];

function applyAtmosphere(atmo) {
    const allowed = ['ritual', 'lunar', 'oracle'];
    const safe = allowed.includes(atmo) ? atmo : 'ritual';
    document.body.setAttribute('data-atmo', safe);
    localStorage.setItem('atmo', safe);
    document.querySelectorAll('.atmo-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.atmo === safe);
    });
}

function initAtmosphereModes() {
    const root = document.getElementById('atmoSwitcher');
    if (!root) return;
    root.querySelectorAll('.atmo-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            applyAtmosphere(btn.dataset.atmo || 'ritual');
        });
    });
    applyAtmosphere(localStorage.getItem('atmo') || 'ritual');
}

function initHeroNebulaCanvas() {
    if (window.matchMedia('(max-width: 900px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.getElementById('heroNebulaCanvas');
    const hero = document.querySelector('.hero');
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let mx = 0;
    let my = 0;
    const blobs = Array.from({ length: 8 }, (_, i) => ({
        x: Math.random(),
        y: Math.random(),
        r: 120 + Math.random() * 210,
        dx: (Math.random() - 0.5) * 0.0006,
        dy: (Math.random() - 0.5) * 0.0006,
        hue: i % 3 === 0 ? 42 : (i % 3 === 1 ? 218 : 258),
        a: 0.08 + Math.random() * 0.07
    }));

    const resize = () => {
        const rect = hero.getBoundingClientRect();
        w = Math.max(1, Math.floor(rect.width));
        h = Math.max(1, Math.floor(rect.height));
        canvas.width = w;
        canvas.height = h;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
        mx = 0;
        my = 0;
    });

    const motionScaleMap = { soft: 0.65, normal: 1, cinema: 1.45 };
    const draw = (t = 0) => {
        ctx.clearRect(0, 0, w, h);
        const motionLevel = document.body.getAttribute('data-motion') || 'normal';
        const motionScale = motionScaleMap[motionLevel] || 1;
        blobs.forEach((b, i) => {
            b.x += b.dx * motionScale;
            b.y += b.dy * motionScale;
            if (b.x < 0 || b.x > 1) b.dx *= -1;
            if (b.y < 0 || b.y > 1) b.dy *= -1;

            const wave = Math.sin(t * 0.00045 + i * 0.85);
            const radius = b.r * (0.9 + wave * 0.1);
            const gx = b.x * w + mx * (14 + i * 1.5) * motionScale;
            const gy = b.y * h + my * (11 + i * 1.3) * motionScale;
            const alpha = b.a * (0.86 + wave * 0.16);

            const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
            g.addColorStop(0, `hsla(${b.hue}, 85%, 65%, ${alpha.toFixed(3)})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(gx, gy, radius, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
}

function applyMotionLevel(level) {
    const safe = MOTION_LEVELS.includes(level) ? level : 'normal';
    document.body.setAttribute('data-motion', safe);
    localStorage.setItem('motionLevel', safe);
    document.querySelectorAll('.motion-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.motion === safe);
    });
}

function initMotionModes() {
    const root = document.getElementById('motionSwitcher');
    const preferred = localStorage.getItem('motionLevel') || 'cinema';
    if (!root) {
        applyMotionLevel(preferred);
        return;
    }
    root.querySelectorAll('.motion-btn').forEach((btn) => {
        btn.addEventListener('click', () => applyMotionLevel(btn.dataset.motion || 'normal'));
    });
    applyMotionLevel(preferred);
}

function initNavPrefsPanel() {
    const navPrefs = document.querySelector('.nav-prefs');
    const toggle = document.getElementById('navPrefsToggle');
    const panel = document.getElementById('navPrefsPanel');
    if (!navPrefs || !toggle || !panel) return;

    const closePanel = () => {
        navPrefs.classList.remove('open');
        panel.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
    };

    const openPanel = () => {
        navPrefs.classList.add('open');
        panel.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        if (panel.hidden) {
            openPanel();
        } else {
            closePanel();
        }
    });

    document.addEventListener('click', (event) => {
        if (!navPrefs.contains(event.target)) closePanel();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closePanel();
    });
}

/* ============================================
   МОБИЛЬНОЕ МЕНЮ
   ============================================ */

function toggleMobileMenu() {
    const drawer  = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const btn     = document.getElementById('navHamburger');
    if (!drawer) return;

    const isOpen = drawer.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active', isOpen);
    if (btn) {
        btn.classList.toggle('open', isOpen);
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        btn.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    }
    drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

document.addEventListener('DOMContentLoaded', () => {
    // Escape закрывает drawer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const drawer = document.getElementById('mobileDrawer');
            if (drawer && drawer.classList.contains('active')) toggleMobileMenu();
        }
    });
});

/* ============================================
   КНОПКА "НАВЕРХ"
   ============================================ */

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTopBtn');
    if (btn) btn.classList.toggle('visible', window.scrollY > 400);
});

/* ============================================
   FAQ АККОРДЕОН
   ============================================ */

function toggleFaq(questionEl) {
    const item = questionEl.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-answer').style.maxHeight = null;
    });
    if (!isOpen) {
        item.classList.add('open');
        const inner = item.querySelector('.faq-answer-inner');
        item.querySelector('.faq-answer').style.maxHeight = inner.scrollHeight + 'px';
    }
}

/* ============================================
   ЭКСПРЕСС-ПЛАН СЕАНСА
   ============================================ */

function calculateSessionPlan() {
    const goal = document.getElementById('plannerGoal')?.value;
    const format = document.getElementById('plannerFormat')?.value;
    const urgency = document.getElementById('plannerUrgency')?.value;

    if (!goal || !format || !urgency) {
        return;
    }

    const plans = {
        clarity: {
            title: 'Таро чтение с фокусом на решение',
            description: 'Определяем 2-3 сценария развития, риски и лучший шаг на текущий период.',
            duration: '40-60 мин',
            price: 'от 5 000 ₸'
        },
        energy: {
            title: 'Энергетическая диагностика и мягкая чистка',
            description: 'Выявляем энергетические утечки, даем практики восстановления и стабилизации.',
            duration: '60 мин',
            price: 'от 7 500 ₸'
        },
        contact: {
            title: 'Контакт с тонким миром',
            description: 'Деликатный сеанс связи с ушедшим близким с бережным сопровождением.',
            duration: '60-90 мин',
            price: 'от 10 000 ₸'
        },
        love: {
            title: 'Консультация по отношениям',
            description: 'Разбираем динамику пары, точки напряжения и шаги для гармонизации.',
            duration: '45-60 мин',
            price: 'от 6 500 ₸'
        }
    };

    const selectedPlan = plans[goal];
    const priceAdjust = format === 'offline' ? 1500 : 0;
    const slotText = urgency === 'fast' ? 'сегодня/завтра' : 'в течение 1-3 дней';

    document.getElementById('plannerTitle').textContent = selectedPlan.title;
    document.getElementById('plannerDescription').textContent = selectedPlan.description + (format === 'offline' ? ' Формат: личная встреча.' : ' Формат: онлайн-сеанс.');
    document.getElementById('plannerDuration').textContent = selectedPlan.duration;
    document.getElementById('plannerPrice').textContent = priceAdjust ? selectedPlan.price + ' + формат' : selectedPlan.price;
    document.getElementById('plannerSlot').textContent = slotText;

    const empty = document.getElementById('plannerEmptyState');
    const result = document.getElementById('plannerResult');
    if (empty) {
        empty.classList.add('hidden');
    }
    if (result) {
        result.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const plannerFields = ['plannerGoal', 'plannerFormat', 'plannerUrgency'];
    plannerFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.addEventListener('change', calculateSessionPlan);
        }
    });
});

/* ============================================
   ПРЕЛОАДЕР
   ============================================ */

window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => preloader.classList.add('hidden'), 1400);
    }
});

/* ============================================
   SECTION TITLE UNDERLINE — IN-VIEW TRIGGER
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const titles = document.querySelectorAll('.section-title');
    if (!titles.length) return;

    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                titleObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    titles.forEach(t => titleObserver.observe(t));
});

/* ============================================
   STAGGER CARD ANIMATIONS — SLIDE-IN ON SCROLL
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.slide-in');
    if (!cards.length) return;

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    cards.forEach(c => cardObserver.observe(c));
});

/* ============================================
   SCROLL-TO-TOP BUTTON VISIBILITY
   ============================================ */
window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');

    /* Обновляем активный пункт в нижнем мобильном меню */
    const mbnItems = document.querySelectorAll('.mbn-item');
    if (mbnItems.length) {
        const sections = ['home','about','mediumship','testimonials','contact'];
        let current = 'home';
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el && window.scrollY >= el.offsetTop - 100) current = id;
        });
        mbnItems.forEach(item => {
            const href = item.getAttribute('href');
            item.classList.toggle('active', href === '#' + current);
        });
    }
}, { passive: true });

/* ============================================
   COSMIC INTERACTION LAYER — global polish
   ============================================ */
function initCosmicInteractionLayer() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const updateScrollRatio = () => {
        const root = document.documentElement;
        const max = Math.max(1, root.scrollHeight - window.innerHeight);
        const ratio = Math.min(1, Math.max(0, window.scrollY / max));
        document.body.style.setProperty('--scroll-ratio', ratio.toFixed(4));
    };
    updateScrollRatio();
    window.addEventListener('scroll', updateScrollRatio, { passive: true });

    const sections = document.querySelectorAll('section');
    if (sections.length && 'IntersectionObserver' in window) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('cosmic-inview');
                }
            });
        }, { threshold: 0.22 });
        sections.forEach((section) => sectionObserver.observe(section));
    }

    const interactive = document.querySelectorAll(
        '.mediumship-card, .info-card, .testimonial-card, .credential-card, .blog-card, .faq-item, .process-step, .shop-card, .btn-primary, .btn-secondary, .submit-btn, .cta-button'
    );
    interactive.forEach((el) => {
        el.addEventListener('mousemove', (e) => {
            const r = el.getBoundingClientRect();
            const x = ((e.clientX - r.left) / r.width) * 100;
            const y = ((e.clientY - r.top) / r.height) * 100;
            el.style.setProperty('--mx', `${x.toFixed(2)}%`);
            el.style.setProperty('--my', `${y.toFixed(2)}%`);
        });
    });
}

document.addEventListener('DOMContentLoaded', initCosmicInteractionLayer);
