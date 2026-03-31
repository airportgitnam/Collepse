// script.js - Полностью улучшенная версия

// Preloader
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('hide');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 1000);
    }
});

// Custom Cursor
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursor-follower');

if (window.innerWidth > 768) {
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        setTimeout(() => {
            cursorFollower.style.left = e.clientX + 'px';
            cursorFollower.style.top = e.clientY + 'px';
        }, 100);
    });
    
    // Hover effect for clickable elements
    const hoverElements = document.querySelectorAll('a, button, .team-card, .service-card, .portfolio-item');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(2)';
            cursorFollower.style.transform = 'scale(1.5)';
            cursorFollower.style.borderColor = 'var(--neon-purple)';
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
            cursorFollower.style.transform = 'scale(1)';
            cursorFollower.style.borderColor = 'var(--neon-cyan)';
        });
    });
}

// Particle Background Animation
class ParticleCanvas {
    constructor() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.numberOfParticles = 100;
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.createParticles();
        this.animate();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        for (let i = 0; i < this.numberOfParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.3,
                color: `rgba(0, ${Math.random() * 100 + 155}, 255, ${Math.random() * 0.3 + 0.1})`
            });
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            
            p.x += p.speedX;
            p.y += p.speedY;
            
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
        });
        requestAnimationFrame(() => this.draw());
    }
    
    animate() {
        this.draw();
    }
}

// Initialize Particles
document.addEventListener('DOMContentLoaded', () => {
    new ParticleCanvas();
});

// Header Scroll Effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const nav = document.querySelector('.nav');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
        
        // Animate hamburger menu
        const spans = mobileMenuBtn.querySelectorAll('span');
        if (nav.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Smooth Scroll & Active Link Update
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Close mobile menu on link click
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.remove('active');
            const spans = mobileMenuBtn.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
});

// Mouse Glow Effect for Cards
document.querySelectorAll('.team-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
    });
});

// Contact Button Handler
function openContact(phone, telegram) {
    const modal = document.createElement('div');
    modal.className = 'contact-modal';
    modal.innerHTML = `
        <div class="contact-modal-content">
            <h3>Связаться с разработчиком</h3>
            <div class="contact-options">
                <button onclick="window.location.href='tel:${phone}'" class="modal-btn phone-btn">
                    <i class="fas fa-phone-alt"></i> Позвонить
                </button>
                <button onclick="window.open('https://t.me/${telegram}', '_blank')" class="modal-btn telegram-btn">
                    <i class="fab fa-telegram"></i> Telegram
                </button>
            </div>
            <button class="modal-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Make openContact global
window.openContact = openContact;

// Initialize all card contact buttons
document.querySelectorAll('.btn-card-contact').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const phone = btn.getAttribute('data-phone');
        const telegram = btn.getAttribute('data-telegram');
        openContact(phone, telegram);
    });
});

// Form Submission Handler
class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.formStatus = document.getElementById('formStatus');
        this.init();
    }
    
    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            telegram: document.getElementById('telegramContact').value.trim(),
            message: document.getElementById('message')?.value.trim() || ''
        };
        
        if (!formData.name || !formData.phone || !formData.telegram) {
            this.showStatus('Пожалуйста, заполните имя, номер телефона и ник в Telegram', 'error');
            return;
        }
        
        const phoneRegex = /^(\+998|998)?\s?(90|91|93|94|95|97|98|99|33|88|50|77)[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
        if (!phoneRegex.test(formData.phone)) {
            this.showStatus('Пожалуйста, введите корректный номер телефона', 'error');
            return;
        }
        
        const agreement = document.getElementById('agreement');
        if (agreement && !agreement.checked) {
            this.showStatus('Пожалуйста, согласитесь с политикой конфиденциальности', 'error');
            return;
        }
        
        await this.sendData(formData);
    }
    
    async sendData(data) {
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showStatus(result.message || '✅ Заявка успешно отправлена! Мы свяжемся с вами.', 'success');
                this.form.reset();
            } else {
                this.showStatus(result.error || 'Ошибка при отправке. Попробуйте позже.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showStatus('❌ Ошибка соединения. Проверьте интернет.', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    showStatus(message, type) {
        if (this.formStatus) {
            this.formStatus.textContent = message;
            this.formStatus.className = `form-status ${type}`;
            this.formStatus.style.display = 'block';
            
            setTimeout(() => {
                this.formStatus.style.display = 'none';
            }, 5000);
        }
    }
    
    setLoading(loading) {
        if (!this.submitBtn) return;
        
        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoader = this.submitBtn.querySelector('.btn-loader');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';
            this.submitBtn.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            this.submitBtn.disabled = false;
        }
    }
}

// Phone Input Mask
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let matrix = "+998 ## ### ## ##";
        let i = 0;
        let def = matrix.replace(/\D/g, "");
        let val = e.target.value.replace(/\D/g, "");
        
        if (def.length >= val.length) val = def;
        
        e.target.value = matrix.replace(/./g, function(a) {
            return /[#\d]/.test(a) && i < val.length ? val.charAt(i++) : i >= val.length ? "" : a;
        });
    });
}

// Number Counter Animation
const counters = document.querySelectorAll('.stat-number');
const speed = 200;

const animateCounter = (counter) => {
    const target = parseInt(counter.getAttribute('data-count'));
    let count = 0;
    const increment = target / speed;
    
    const updateCount = () => {
        if (count < target) {
            count += increment;
            counter.innerText = Math.ceil(count);
            requestAnimationFrame(updateCount);
        } else {
            counter.innerText = target;
        }
    };
    
    updateCount();
};

const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

counters.forEach(counter => {
    counterObserver.observe(counter);
});

// Portfolio Filter
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        portfolioItems.forEach(item => {
            if (filter === 'all' || item.getAttribute('data-category') === filter) {
                item.style.display = 'block';
                item.style.animation = 'fadeInUp 0.5s ease forwards';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// Back to Top Button
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Theme Toggle
let isDarkMode = true;


// Newsletter Form
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input').value;
        
        // Here you can add API call to save email
        alert('Спасибо за подписку!');
        newsletterForm.reset();
    });
}

// Watch Demo Button
const watchDemoBtn = document.getElementById('watchDemoBtn');
if (watchDemoBtn) {
    watchDemoBtn.addEventListener('click', () => {
        // You can add video modal here
        alert('Демо видео будет доступно скоро!');
    });
}

// Initialize AOS
AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// Initialize Contact Form
new ContactFormHandler();

// Console flair
console.log('%c🔥 Collepse Official | Building The Future 🔥', 'color: #00f0ff; font-size: 16px; font-weight: bold;');
console.log('%cNeon protocols activated. Full-stack system online.', 'color: #b700ff;');
console.log('%cTelegram bot connected. Ready to receive applications.', 'color: #00ff88;');

// Add animation keyframes to document
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .contact-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .contact-modal-content {
        background: linear-gradient(145deg, var(--bg-secondary), var(--bg-primary));
        border: 1px solid var(--neon-cyan);
        border-radius: 24px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        position: relative;
        box-shadow: var(--shadow-glow);
    }
    
    .contact-modal-content h3 {
        margin-bottom: 24px;
        color: var(--neon-cyan);
    }
    
    .contact-options {
        display: flex;
        gap: 16px;
        justify-content: center;
    }
    
    .modal-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: var(--transition-base);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .phone-btn {
        background: var(--gradient-cyan);
        color: var(--bg-primary);
    }
    
    .telegram-btn {
        background: var(--gradient-purple);
        color: white;
    }
    
    .modal-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--glow-cyan);
    }
    
    .modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-muted);
        transition: var(--transition-base);
    }
    
    .modal-close:hover {
        color: var(--neon-cyan);
        transform: rotate(90deg);
    }
`;
document.head.appendChild(style);