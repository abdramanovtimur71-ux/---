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

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.animation = entry.target.classList.contains('fade-in')
                    ? 'fadeIn 0.8s ease-out forwards'
                    : 'slideUp 0.8s ease-out forwards';
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
    const serviceItems = document.querySelectorAll('.service-item');
    
    serviceItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05) rotateY(5deg)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotateY(0deg)';
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

        // Темы и UI
        initializeTheme();

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

// Пароль проверяется только на backend — не хранится в клиентском коде
const REMOTE_API_BASE = 'https://roza-ogly-api.onrender.com';
const API_BASE = (() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = (params.get('api') || '').trim().replace(/\/$/, '');
    if (/^https?:\/\//i.test(fromQuery)) {
        localStorage.setItem('apiBaseUrl', fromQuery);
        return fromQuery;
    }
    const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    const storedBase = (localStorage.getItem('apiBaseUrl') || '').trim().replace(/\/$/, '');
    if (storedBase) {
        if (!isLocalHost) {
            return storedBase;
        }
        try {
            const storedUrl = new URL(storedBase);
            if (/^(localhost|127\.0\.0\.1)$/i.test(storedUrl.hostname)) {
                return storedBase;
            }
        } catch {
            // ignore malformed stored API URL
        }
    }
    if (isLocalHost) {
        return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    return REMOTE_API_BASE;
})();
window.API_BASE = API_BASE;

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

    const reviews = getGuestReviews();
    const voteState = getGuestReviewVoteState();

    list.innerHTML = reviews
        .slice(0, 12)
        .map((item) => {
            const stars = '★★★★★'.slice(0, Number(item.rating || 5)) + '☆☆☆☆☆'.slice(0, 5 - Number(item.rating || 5));
            const activeVote = voteState[item.id] || '';
            const safeName = escapeHtml(item.name);
            const safeText = escapeHtml(item.text);
            return `
                <article class="guest-item" data-review-id="${item.id}">
                    <div class="guest-item-head">
                        <span class="guest-item-name">${safeName}</span>
                        <span class="guest-item-stars">${stars}</span>
                    </div>
                    <p class="guest-item-text">${safeText}</p>
                    <div class="guest-item-actions">
                        <button type="button" class="guest-vote-btn ${activeVote === 'like' ? 'active' : ''}" data-review-id="${item.id}" data-vote="like" aria-label="Поставить лайк">
                            👍 <span class="guest-vote-count">${Number(item.likes || 0)}</span>
                        </button>
                        <button type="button" class="guest-vote-btn ${activeVote === 'dislike' ? 'active' : ''}" data-review-id="${item.id}" data-vote="dislike" aria-label="Поставить дизлайк">
                            👎 <span class="guest-vote-count">${Number(item.dislikes || 0)}</span>
                        </button>
                    </div>
                </article>
            `;
        })
        .join('');
}

const GUEST_REVIEWS_KEY = 'guestReviews';
const GUEST_REVIEW_VOTES_KEY = 'guestReviewVotes';
const guestReviewsChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('guest-reviews-sync') : null;
const guestReviewsRealtimeState = {
    usesBackend: false,
    longPollTimer: null,
    longPollRunning: false,
    lastUpdated: 0
};

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeReview(raw) {
    const name = String(raw?.name || '').trim();
    const text = String(raw?.text || '').trim();
    const normalizedRating = Number(raw?.rating || 5);
    const rating = Math.max(1, Math.min(5, Number.isFinite(normalizedRating) ? Math.round(normalizedRating) : 5));
    const createdAt = raw?.createdAt || new Date().toISOString();
    const baseId = String(raw?.id || '').trim() || `${Date.parse(createdAt) || Date.now()}-${name.toLowerCase()}-${text.toLowerCase()}`;
    const id = baseId.replace(/\s+/g, '-').slice(0, 120);
    return {
        id,
        name,
        text,
        rating,
        createdAt,
        likes: Math.max(0, Number(raw?.likes || 0) || 0),
        dislikes: Math.max(0, Number(raw?.dislikes || 0) || 0)
    };
}

function getReviewSignature(review) {
    return `${review.name.toLowerCase()}|${review.rating}|${review.text.toLowerCase()}`;
}

function dedupeGuestReviews(items) {
    const unique = [];
    const seen = new Set();
    items.forEach((item) => {
        const normalized = normalizeReview(item);
        if (!normalized.name || !normalized.text) {
            return;
        }
        const signature = getReviewSignature(normalized);
        if (seen.has(signature)) {
            return;
        }
        seen.add(signature);
        unique.push(normalized);
    });
    return unique;
}

function getDefaultGuestReviews() {
    return dedupeGuestReviews([
        { id: 'guest-default-aigerim', name: 'Айгерим', rating: 5, text: 'Очень спокойная и профессиональная консультация. После сеанса стало легче принимать решения.', likes: 6, dislikes: 0, createdAt: '2026-01-01T10:00:00.000Z' },
        { id: 'guest-default-nurlan', name: 'Нурлан', rating: 5, text: 'Понравилась точность расклада и поддержка после встречи. Рекомендую.', likes: 5, dislikes: 0, createdAt: '2026-01-02T10:00:00.000Z' },
        { id: 'guest-default-zhanna', name: 'Жанна', rating: 4, text: 'Уютная атмосфера и сильная энергетика. Спасибо за внимание к деталям.', likes: 4, dislikes: 0, createdAt: '2026-01-03T10:00:00.000Z' }
    ]);
}

function getGuestReviewVoteState() {
    const raw = localStorage.getItem(GUEST_REVIEW_VOTES_KEY);
    if (!raw) {
        return {};
    }
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function setGuestReviewVoteState(voteMap) {
    localStorage.setItem(GUEST_REVIEW_VOTES_KEY, JSON.stringify(voteMap));
}

function setGuestReviews(reviews, sync = true) {
    const normalized = dedupeGuestReviews(reviews).slice(0, 40);
    setStorageArray(GUEST_REVIEWS_KEY, normalized);
    if (sync && guestReviewsChannel) {
        guestReviewsChannel.postMessage({ type: 'reviews-updated' });
    }
}

function getGuestReviews() {
    const stored = getStorageArray(GUEST_REVIEWS_KEY);
    if (!stored.length) {
        const defaults = getDefaultGuestReviews();
        setGuestReviews(defaults, false);
        return defaults;
    }
    const normalized = dedupeGuestReviews(stored).slice(0, 40);
    if (normalized.length !== stored.length) {
        setGuestReviews(normalized, false);
    }
    return normalized;
}

function mergeReviewItem(item) {
    const normalized = normalizeReview(item);
    const current = getGuestReviews();
    const idx = current.findIndex((review) => review.id === normalized.id);
    if (idx >= 0) {
        current[idx] = { ...current[idx], ...normalized };
    } else {
        current.unshift(normalized);
    }
    setGuestReviews(current);
}

function getNextVoteState(reviewId, voteType) {
    const voteState = getGuestReviewVoteState();
    const prevVote = voteState[reviewId] || '';
    const nextVote = prevVote === voteType ? '' : voteType;
    return { voteState, prevVote, nextVote };
}

async function loadGuestReviewsFromBackend() {
    const response = await fetch(API_BASE + '/api/guest-reviews', {
        signal: AbortSignal.timeout(7000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось загрузить отзывы');
    }
    const items = Array.isArray(data.items) ? data.items : [];
    setGuestReviews(items, false);
    if (Number.isFinite(Number(data.lastUpdated))) {
        guestReviewsRealtimeState.lastUpdated = Number(data.lastUpdated);
    }
}

async function submitGuestReviewToBackend(name, rating, text) {
    const response = await fetch(API_BASE + '/api/guest-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, text }),
        signal: AbortSignal.timeout(9000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось сохранить отзыв');
    }
    if (data.item) {
        mergeReviewItem(data.item);
    }
    if (Number.isFinite(Number(data.lastUpdated))) {
        guestReviewsRealtimeState.lastUpdated = Number(data.lastUpdated);
    }
}

async function sendGuestVoteToBackend(reviewId, voteType) {
    const parsedReviewId = Number.parseInt(String(reviewId), 10);
    if (!Number.isFinite(parsedReviewId) || parsedReviewId <= 0) {
        throw new Error('Некорректный идентификатор отзыва');
    }
    const safeReviewId = String(parsedReviewId);

    const { voteState, prevVote, nextVote } = getNextVoteState(safeReviewId, voteType);
    const response = await fetch(API_BASE + `/api/guest-reviews/${encodeURIComponent(safeReviewId)}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: nextVote, prevVote }),
        signal: AbortSignal.timeout(8000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось отправить голос');
    }

    voteState[safeReviewId] = nextVote;
    if (!nextVote) {
        delete voteState[safeReviewId];
    }
    setGuestReviewVoteState(voteState);

    if (data.item) {
        mergeReviewItem(data.item);
    }
    if (Number.isFinite(Number(data.lastUpdated))) {
        guestReviewsRealtimeState.lastUpdated = Number(data.lastUpdated);
    }
}

function scheduleGuestReviewsLongPoll() {
    if (!guestReviewsRealtimeState.usesBackend || guestReviewsRealtimeState.longPollRunning) {
        return;
    }
    guestReviewsRealtimeState.longPollRunning = true;

    const since = Number.isFinite(guestReviewsRealtimeState.lastUpdated)
        ? guestReviewsRealtimeState.lastUpdated
        : 0;
    const url = `${API_BASE}/api/guest-reviews/updates?since=${encodeURIComponent(String(since))}&timeout=25`;

    fetch(url, { signal: AbortSignal.timeout(30000) })
        .then((response) => response.json().catch(() => ({})))
        .then(async (data) => {
            if (data && data.ok && Number.isFinite(Number(data.lastUpdated))) {
                guestReviewsRealtimeState.lastUpdated = Number(data.lastUpdated);
                if (data.changed) {
                    await loadGuestReviewsFromBackend();
                    renderGuestReviews();
                }
            }
        })
        .catch(() => {})
        .finally(() => {
            guestReviewsRealtimeState.longPollRunning = false;
            if (!guestReviewsRealtimeState.usesBackend) {
                return;
            }
            clearTimeout(guestReviewsRealtimeState.longPollTimer);
            guestReviewsRealtimeState.longPollTimer = setTimeout(scheduleGuestReviewsLongPoll, 250);
        });
}

async function enableGuestReviewsBackendSync() {
    try {
        await loadGuestReviewsFromBackend();
        guestReviewsRealtimeState.usesBackend = true;
        renderGuestReviews();
        scheduleGuestReviewsLongPoll();
    } catch {
        guestReviewsRealtimeState.usesBackend = false;
    }
}

function upsertGuestVoteLocal(reviewId, voteType) {
    const reviews = getGuestReviews();
    const { voteState, prevVote, nextVote } = getNextVoteState(reviewId, voteType);
    const updated = reviews.map((review) => {
        if (review.id !== reviewId) {
            return review;
        }
        const nextReview = { ...review };
        if (prevVote === 'like') {
            nextReview.likes = Math.max(0, nextReview.likes - 1);
        }
        if (prevVote === 'dislike') {
            nextReview.dislikes = Math.max(0, nextReview.dislikes - 1);
        }
        if (nextVote === 'like') {
            nextReview.likes += 1;
        }
        if (nextVote === 'dislike') {
            nextReview.dislikes += 1;
        }
        return nextReview;
    });

    voteState[reviewId] = nextVote;
    if (!nextVote) {
        delete voteState[reviewId];
    }
    setGuestReviewVoteState(voteState);
    setGuestReviews(updated);
    renderGuestReviews();
}

function initGuestReviews() {
    if (window.__guestReviewsInited) {
        return;
    }
    window.__guestReviewsInited = true;

    const form = document.getElementById('guestReviewForm');
    const list = document.getElementById('guestReviewsList');
    renderGuestReviews();

    if (list) {
        list.addEventListener('click', (event) => {
            const btn = event.target.closest('.guest-vote-btn');
            if (!btn) {
                return;
            }
            const reviewId = String(btn.dataset.reviewId || '').trim();
            const voteType = btn.dataset.vote === 'dislike' ? 'dislike' : 'like';
            if (!reviewId) {
                return;
            }
            const parsedReviewId = Number.parseInt(reviewId, 10);
            if (!Number.isFinite(parsedReviewId) || parsedReviewId <= 0) {
                showError('Некорректный идентификатор отзыва');
                return;
            }
            const safeReviewId = String(parsedReviewId);

            if (guestReviewsRealtimeState.usesBackend) {
                sendGuestVoteToBackend(safeReviewId, voteType)
                    .then(() => {
                        renderGuestReviews();
                    })
                    .catch((error) => {
                        showError(error.message || 'Не удалось поставить голос');
                    });
                return;
            }
            upsertGuestVoteLocal(safeReviewId, voteType);
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('guestName').value.trim();
            const rating = Number(document.getElementById('guestRating').value || 5);
            const text = document.getElementById('guestText').value.trim();

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
            const current = getGuestReviews();
            const newReview = normalizeReview({
                id: `guest-${Date.now()}`,
                name,
                rating,
                text,
                createdAt: new Date().toISOString(),
                likes: 0,
                dislikes: 0
            });
            const signature = getReviewSignature(newReview);
            const hasDuplicate = current.some((item) => getReviewSignature(item) === signature);
            if (hasDuplicate) {
                resetBtn();
                showError('Такой отзыв уже есть. Измените текст или оценку.');
                return;
            }

            const savePromise = guestReviewsRealtimeState.usesBackend
                ? submitGuestReviewToBackend(name, newReview.rating, text)
                : Promise.resolve().then(() => {
                    setGuestReviews([newReview, ...current]);
                });

            savePromise
                .then(() => {
                    addAdminRecord('guestReviews', { name, rating: newReview.rating, text, source: 'site-guest-review' });
                    form.reset();
                    renderGuestReviews();
                    showSuccess('✓ Спасибо! Ваш отзыв опубликован.');
                    resetBtn();
                })
                .catch((error) => {
                    resetBtn();
                    showError(error.message || 'Не удалось опубликовать отзыв');
                });
        });
    }

    window.addEventListener('storage', (event) => {
        if (event.key === GUEST_REVIEWS_KEY || event.key === GUEST_REVIEW_VOTES_KEY) {
            renderGuestReviews();
        }
    });

    if (guestReviewsChannel) {
        guestReviewsChannel.addEventListener('message', (event) => {
            if (event.data?.type === 'reviews-updated') {
                renderGuestReviews();
            }
        });
    }

    enableGuestReviewsBackendSync();
}

document.addEventListener('DOMContentLoaded', () => {
    initGuestReviews();
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

/* ============================================
   ПЕРЕКЛЮЧЕНИЕ ТЕМ
   ============================================ */

// Переключение между светлой и темной темой
const THEMES = ['ritual', 'oracle'];

function applyTheme(theme) {
    const html = document.documentElement;
    const safeTheme = THEMES.includes(theme) ? theme : 'ritual';

    html.setAttribute('data-theme', safeTheme);
    localStorage.setItem('theme', safeTheme);
    updateThemeIcon(safeTheme);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'ritual';
    const currentIndex = THEMES.indexOf(currentTheme);
    const newTheme = THEMES[(currentIndex + 1) % THEMES.length];

    applyTheme(newTheme);
}

// Обновление иконки переключателя
function updateThemeIcon(theme) {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        const themeState = {
            ritual: {
                icon: '☾',
                title: 'Переключить тему: Crystal Oracle'
            },
            oracle: {
                icon: '🔮',
                title: 'Переключить тему: Ritual Night'
            }
        };

        const current = themeState[theme] || themeState.ritual;
        toggle.textContent = current.icon;
        toggle.title = current.title;
        toggle.setAttribute('aria-label', current.title);
    }
}

// Инициализация темы при загрузке
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme && THEMES.includes(savedTheme)) {
        applyTheme(savedTheme);
        return;
    }

    applyTheme('ritual');
}

// Инициализация темы при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
});

// Отслеживание изменений системной темы
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'ritual');
        }
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
