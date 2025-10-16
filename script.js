// JavaScript for Portfolio Website

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Audio Context for Sound Effects ---
    // Initialize AudioContext only when needed, after a user gesture
    let audioContext = null;

    // Function to play a simple click sound
    async function playClickSound() {
        // Create or resume AudioContext on first interaction
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine'; // A clean sine wave for a subtle click
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Volume

        // Fade out quickly
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    // Attach sound to navigation links and buttons
    document.querySelectorAll('.nav-link-sound, .btn-sound').forEach(element => {
        element.addEventListener('click', playClickSound);
    });

    // --- 1. Navigation Bar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- 2. Smooth Scrolling for Navigation Links with Navbar Offset & Active Highlight ---
    const navLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
    function getNavbarHeight() {
        const nb = document.querySelector('.navbar');
        return nb ? nb.offsetHeight : 0;
    }
    function smoothScrollTo(target) {
        const el = document.querySelector(target);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const offset = window.pageYOffset + rect.top - getNavbarHeight();
        window.scrollTo({ top: Math.max(offset, 0), behavior: 'smooth' });
    }
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            e.preventDefault();
            smoothScrollTo(href);
        });
    });

    // Active section highlighting
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const linkById = new Map(
        navLinks
            .filter(a => a.getAttribute('href') && a.getAttribute('href').startsWith('#'))
            .map(a => [a.getAttribute('href').slice(1), a])
    );
    function updateActiveLink() {
        const navHeight = getNavbarHeight() + 10;
        let currentId = null;
        sections.forEach(sec => {
            const top = sec.offsetTop - navHeight;
            if (window.pageYOffset >= top) currentId = sec.id;
        });
        linkById.forEach((link, id) => {
            if (id === currentId) {
                link.classList.add('text-orange-primary');
            } else {
                link.classList.remove('text-orange-primary');
            }
        });
    }
    window.addEventListener('scroll', updateActiveLink);
    window.addEventListener('load', updateActiveLink);

    // --- 3. Hero Section Interactive 3D (Three.js) ---
    const canvas = document.getElementById('hero-canvas');
    let scene, camera, renderer, dodecahedron, particles = [];
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let windowHalfX, windowHalfY; // Declared here, initialized in onWindowResize
    let spaceships = []; // Array to hold spaceship objects

    // Function to initialize Three.js components
    function initThreeJS() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050510); // Very dark blue/black for space

        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 10; // Move camera back to see more of the scene

        // Renderer
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false }); // alpha: false for solid background
        renderer.setPixelRatio(window.devicePixelRatio);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3); // Dimmer directional light
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        // Dodecahedron (main object)
        const dodecahedronGeometry = new THREE.DodecahedronGeometry(1.5, 0);
        const dodecahedronMaterial = new THREE.MeshPhongMaterial({
            color: 0xF47216, // Orange primary color
            emissive: 0x220000,
            specular: 0xcccccc,
            shininess: 50,
            flatShading: true
        });
        dodecahedron = new THREE.Mesh(dodecahedronGeometry, dodecahedronMaterial);
        scene.add(dodecahedron);

        // Starfield
        const starCount = 5000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        for (let i = 0; i < starCount; i++) {
            const x = (Math.random() * 2 - 1) * 100;
            const y = (Math.random() * 2 - 1) * 100;
            const z = (Math.random() * 2 - 1) * 100;
            starPositions.push(x, y, z);
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // Spaceships
        const spaceshipCount = 5;
        const spaceshipBodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const spaceshipWingGeometry = new THREE.BoxGeometry(0.2, 0.1, 1);
        const spaceshipMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, specular: 0xaaaaaa, shininess: 30 });
        const engineLightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF4500 }); // Orange-red for engine glow

        for (let i = 0; i < spaceshipCount; i++) {
            const spaceship = new THREE.Group();

            // Body
            const body = new THREE.Mesh(spaceshipBodyGeometry, spaceshipMaterial);
            body.rotation.x = Math.PI / 2; // Point cone along Z-axis
            spaceship.add(body);

            // Wings
            const wing1 = new THREE.Mesh(spaceshipWingGeometry, spaceshipMaterial);
            wing1.position.set(0.6, 0, 0);
            wing1.rotation.z = Math.PI / 2;
            spaceship.add(wing1);

            const wing2 = new THREE.Mesh(spaceshipWingGeometry, spaceshipMaterial);
            wing2.position.set(-0.6, 0, 0);
            wing2.rotation.z = Math.PI / 2;
            spaceship.add(wing2);

            // Engine Glow (PointLight for subtle illumination)
            const engineLight = new THREE.PointLight(0xFF4500, 1, 10); // Color, intensity, distance
            engineLight.position.set(0, 0, -1.5); // Behind the spaceship
            spaceship.add(engineLight);

            // Engine visual (small glowing sphere)
            const engineSphere = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), engineLightMaterial);
            engineSphere.position.set(0, 0, -1.5);
            spaceship.add(engineSphere);

            // Random initial position
            spaceship.position.set(
                (Math.random() * 2 - 1) * 50,
                (Math.random() * 2 - 1) * 50,
                (Math.random() * 2 - 1) * 50
            );

            // Random initial rotation
            spaceship.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Store speed and direction for animation
            spaceship.userData.speed = Math.random() * 0.1 + 0.05; // Random speed
            spaceship.userData.oscillation = Math.random() * 0.02 + 0.01; // For subtle up/down movement
            spaceship.userData.oscillationOffset = Math.random() * Math.PI * 2; // Starting point for oscillation

            scene.add(spaceship);
            spaceships.push(spaceship);
        }

        // Event Listeners for mouse interaction
        document.addEventListener('mousemove', onDocumentMouseMove);
        window.addEventListener('resize', onWindowResize);
        onWindowResize(); // Initial size setup
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) * 0.005;
        mouseY = (event.clientY - windowHalfY) * 0.005;
    }

    function onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        windowHalfX = width / 2;
        windowHalfY = height / 2;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function animateThreeJS() {
        requestAnimationFrame(animateThreeJS);
        if (!scene || !camera || !renderer || !dodecahedron || !spaceships) return;
        // Smoothly move camera towards target
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (-targetY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
        // Rotate dodecahedron
        dodecahedron.rotation.x += 0.002;
        dodecahedron.rotation.y += 0.003;
        // Animate spaceships
        spaceships.forEach((ship, index) => {
            ship.translateZ(ship.userData.speed);
            ship.position.y += Math.sin(Date.now() * 0.001 + ship.userData.oscillationOffset) * ship.userData.oscillation;
            if (ship.position.z > camera.position.z + 50) {
                ship.position.z = camera.position.z - 100;
                ship.position.x = (Math.random() * 2 - 1) * 50;
                ship.position.y = (Math.random() * 2 - 1) * 50;
            } else if (ship.position.z < camera.position.z - 100) {
                ship.position.z = camera.position.z + 50;
                ship.position.x = (Math.random() * 2 - 1) * 50;
                ship.position.y = (Math.random() * 2 - 1) * 50;
            }
        });
        renderer.render(scene, camera);
    }

    // Initialize and animate Three.js only after window is loaded
    // This ensures the canvas and its context are ready.
    window.onload = function() {
        initThreeJS();
        animateThreeJS();
    };


    // --- 4. Section Fade-in on Scroll ---
    const faders = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.2, // Trigger when 20% of the element is visible
        rootMargin: "0px 0px -50px 0px" // Shrink the viewport by 50px from bottom
    };

    const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                appearOnScroll.unobserve(entry.target); // Stop observing once it's active
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // --- 5. Image Carousel Functionality ---
    const carousels = {}; // Store current slide index for each carousel

    document.querySelectorAll('.carousel-container').forEach(container => {
        const projectId = container.dataset.project;
        carousels[projectId] = {
            currentIndex: 0,
            imagesContainer: container.querySelector('.carousel-images'),
            images: Array.from(container.querySelectorAll('.carousel-images img'))
        };
        // Add skeleton class until loaded
        carousels[projectId].images.forEach(img => {
            img.classList.add('skeleton');
            img.addEventListener('load', () => img.classList.remove('skeleton'));
            img.addEventListener('error', () => img.classList.remove('skeleton'));
        });
        updateCarousel(projectId); // Initialize carousel display
    });

    // Function to update carousel display
    function updateCarousel(projectId) {
        const carousel = carousels[projectId];
        if (!carousel) return;

        const offset = -carousel.currentIndex * 100;
        carousel.imagesContainer.style.transform = `translateX(${offset}%)`;
    }

    // Global functions for carousel navigation (called from onclick in HTML)
    window.prevSlide = function(projectId) {
        const carousel = carousels[projectId];
        if (!carousel) return;

        carousel.currentIndex = (carousel.currentIndex - 1 + carousel.images.length) % carousel.images.length;
        updateCarousel(projectId);
    };

    window.nextSlide = function(projectId) {
        const carousel = carousels[projectId];
        if (!carousel) return;

        carousel.currentIndex = (carousel.currentIndex + 1) % carousel.images.length;
        updateCarousel(projectId);
    };

    // --- 6. Mobile Menu Toggle ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMobileMenuButton = document.getElementById('close-mobile-menu');

    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.remove('hidden');
    });

    closeMobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });

    // --- 7. D3.js Skill Visualization ---
    function createSkillCharts() {
        document.querySelectorAll('.skill-card').forEach(skillCard => {
            const skillListItems = skillCard.querySelectorAll('ul li');
            const chartContainer = skillCard.querySelector('.skill-chart');

            // Clear previous chart if any
            d3.select(chartContainer).selectAll('*').remove();

            const data = Array.from(skillListItems).map(li => ({
                name: li.textContent.trim(),
                level: parseInt(li.dataset.skillLevel || 0)
            }));

            const margin = { top: 5, right: 5, bottom: 5, left: 5 };
            const width = chartContainer.clientWidth - margin.left - margin.right;
            const height = chartContainer.clientHeight - margin.top - margin.bottom;

            const svg = d3.select(chartContainer)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleLinear()
                .domain([0, 100]) // Skill levels from 0 to 100
                .range([0, width]);

            // Create a single bar for the overall skill level in the category
            // For simplicity, we'll average the levels or just take the highest.
            // Let's take the average for a more representative bar.
            const averageLevel = data.reduce((sum, d) => sum + d.level, 0) / data.length;

            svg.append("rect")
                .attr("class", "skill-bar")
                .attr("x", 0)
                .attr("y", 0)
                .attr("height", height)
                .attr("width", 0) // Start at 0 width for animation
                .transition()
                .duration(800)
                .delay(200)
                .attr("width", x(averageLevel)); // Animate to full width
        });
    }

    // Observe skill section for chart animation
    const skillSection = document.getElementById('skills');
    const skillObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                createSkillCharts();
                observer.unobserve(entry.target); // Run once
            }
        });
    }, { threshold: 0.3 }); // Trigger when 30% of skill section is visible

    skillObserver.observe(skillSection);


    // --- 8. Custom Modal Functionality (for conceptual features and form) ---
    const customModal = document.getElementById('custom-modal');
    const closeModalButton = document.getElementById('close-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalOkButton = document.getElementById('modal-ok-button');

    function showModal(message) {
        modalMessage.textContent = message;
        customModal.classList.remove('hidden');
        // Add a slight delay for fade-in effect
        setTimeout(() => customModal.style.opacity = '1', 10);
    }

    function hideModal() {
        customModal.style.opacity = '0';
        setTimeout(() => customModal.classList.add('hidden'), 300); // Match transition duration
    }

    closeModalButton.addEventListener('click', hideModal);
    modalOkButton.addEventListener('click', hideModal);
    customModal.addEventListener('click', (e) => {
        if (e.target === customModal) { // Close if clicked outside the content box
            hideModal();
        }
    });

    // Conceptual Voice UI Button
    const voiceUiButton = document.getElementById('voice-ui-button');
    if (voiceUiButton) {
        voiceUiButton.addEventListener('click', () => {
            showModal("Voice Assistant functionality is under development. Stay tuned for an interactive experience!");
        });
    }

    // Conceptual AI Chatbot Button
    const chatbotButton = document.getElementById('chatbot-button');
    if (chatbotButton) {
        chatbotButton.addEventListener('click', () => {
            showModal("My AI Chatbot is currently training! It will soon be available to answer your questions about my projects and skills.");
        });
    }

    // Conceptual AR Button
    const arButton = document.getElementById('ar-button');
    if (arButton) {
        arButton.addEventListener('click', () => {
            showModal("Augmented Reality experience is a future enhancement. Imagine viewing 3D models of my projects right in your space!");
        });
    }

    // EmailJS integration for contact form + basic validation + UI feedback
    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const submitButton = contactForm.querySelector('button[type="submit"]');

        function setFieldError(input, isError) {
            if (isError) {
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }
        }

        function isValidEmail(value) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }

        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Client-side validation
            let hasError = false;
            if (!nameInput.value.trim()) { setFieldError(nameInput, true); hasError = true; } else { setFieldError(nameInput, false); }
            if (!isValidEmail(emailInput.value.trim())) { setFieldError(emailInput, true); hasError = true; } else { setFieldError(emailInput, false); }
            if (!messageInput.value.trim()) { setFieldError(messageInput, true); hasError = true; } else { setFieldError(messageInput, false); }
            if (hasError) { showModal('Please fill out all fields correctly.'); return; }

            // Disable button and show sending state
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', this, 'YOUR_USER_ID')
                .then(function() {
                    showModal('Message sent successfully!');
                    contactForm.reset();
                }, function(error) {
                    showModal('Failed to send message. Please try again later.');
                })
                .finally(function() {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                });
        });
    }

    // Dark/Light mode toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            // Optionally, store preference
            if (document.documentElement.classList.contains('dark')) {
                localStorage.setItem('theme', 'dark');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                localStorage.setItem('theme', 'light');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        });
        // On load, set theme from localStorage
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // Animated skill bars
    function animateSkillBars() {
        document.querySelectorAll('.skill-bar').forEach(bar => {
            const level = bar.getAttribute('data-skill');
            bar.style.width = '0%';
            bar.style.height = '8px';
            bar.style.background = 'linear-gradient(90deg, #F47216, #FF9800)';
            bar.style.borderRadius = '4px';
            bar.style.transition = 'width 1.2s cubic-bezier(0.4,0,0.2,1)';
            setTimeout(() => {
                bar.style.width = level + '%';
            }, 300);
        });
    }

    // Animate on scroll into view
    function isInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top < window.innerHeight && rect.bottom > 0
        );
    }

    function handleSkillBarScroll() {
        const skillSection = document.getElementById('skills');
        if (skillSection && isInViewport(skillSection)) {
            animateSkillBars();
            window.removeEventListener('scroll', handleSkillBarScroll);
        }
    }

    window.addEventListener('scroll', handleSkillBarScroll);
    window.addEventListener('DOMContentLoaded', handleSkillBarScroll);

    // Timeline animation
    function animateTimeline() {
        document.querySelectorAll('.timeline-item').forEach(item => {
            if (isInViewport(item)) {
                item.classList.add('timeline-visible');
            }
        });
    }

    window.addEventListener('scroll', animateTimeline);
    window.addEventListener('DOMContentLoaded', animateTimeline);

    // Scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const animation = element.getAttribute('data-animate');
                if (animation) {
                    element.classList.add(animation);
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }
            }
        });
    }, observerOptions);

    // Observe all elements with data-animate attribute
    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // --- 9. Project Filters ---
    const projectFilters = document.querySelectorAll('.project-filter');
    const projectsGrid = document.getElementById('projects-grid');
    function applyProjectFilter(tag) {
        if (!projectsGrid) return;
        const cards = projectsGrid.querySelectorAll('.project-card');
        cards.forEach(card => {
            const tags = (card.getAttribute('data-tags') || '').split(/\s+/);
            const show = tag === 'all' || tags.includes(tag);
            card.style.display = show ? '' : 'none';
        });
    }
    projectFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-filter');
            applyProjectFilter(tag);
            projectFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            try { localStorage.setItem('projectFilter', tag); } catch(e) {}
        });
    });
    // Apply persisted filter on load
    try {
        const saved = localStorage.getItem('projectFilter');
        if (saved) {
            applyProjectFilter(saved);
            projectFilters.forEach(b => {
                if (b.getAttribute('data-filter') === saved) b.classList.add('active');
                else b.classList.remove('active');
            });
        } else {
            // default to all
            const allBtn = Array.from(projectFilters).find(b => b.getAttribute('data-filter') === 'all');
            if (allBtn) allBtn.classList.add('active');
        }
    } catch(e) {}

    // --- 10. Back to Top Button ---
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) backToTop.classList.remove('hidden');
            else backToTop.classList.add('hidden');
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 11. Dynamic Footer Year ---
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    // --- 12. Copy Email ---
    const copyEmailBtn = document.getElementById('copy-email');
    const emailLink = document.getElementById('email-link');
    if (copyEmailBtn && emailLink) {
        copyEmailBtn.addEventListener('click', async () => {
            const email = (emailLink.getAttribute('href') || '').replace('mailto:', '');
            try {
                await navigator.clipboard.writeText(email);
                showModal('Email copied to clipboard.');
            } catch (e) {
                showModal('Could not copy email.');
            }
        });
    }

    // --- 13. Lightbox for images ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    function openLightbox(src, alt) {
        if (!lightbox || !lightboxImg) return;
        lightboxImg.src = src;
        lightboxImg.alt = alt || 'Preview';
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
    }
    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.add('hidden');
        lightbox.classList.remove('flex');
        if (lightboxImg) lightboxImg.src = '';
    }
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }
    document.querySelectorAll('.lightbox-trigger').forEach(img => {
        img.addEventListener('click', () => openLightbox(img.src, img.alt));
    });

    // --- 18. Upgrade images to WebP when available ---
    function upgradeToWebP(img) {
        const src = img.getAttribute('src');
        if (!src || src.endsWith('.webp')) return;
        const webp = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        if (webp === src) return;
        fetch(webp, { method: 'HEAD' })
            .then(res => { if (res.ok) img.src = webp; })
            .catch(() => {});
    }
    document.querySelectorAll('img').forEach(upgradeToWebP);

    // --- 14. Command Palette (Global Search) ---
    const palette = document.createElement('div');
    palette.id = 'command-palette';
    palette.className = 'hidden fixed inset-0 z-[1003] items-start justify-center bg-black bg-opacity-50 pt-24';
    palette.innerHTML = `
        <div class="w-11/12 md:w-2/3 lg:w-1/2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
            <input id="cp-input" type="text" placeholder="Search sections, projects..." class="w-full px-4 py-3 bg-[#121212] text-white outline-none border-b border-[#2a2a2a]" />
            <ul id="cp-list" class="max-h-80 overflow-auto"></ul>
        </div>`;
    document.body.appendChild(palette);
    const cpInput = palette.querySelector('#cp-input');
    const cpList = palette.querySelector('#cp-list');
    function openPalette() {
        palette.classList.remove('hidden');
        palette.classList.add('flex');
        cpInput.value = '';
        renderPalette('');
        setTimeout(() => cpInput.focus(), 0);
    }
    function closePalette() {
        palette.classList.add('hidden');
        palette.classList.remove('flex');
    }
    function renderPalette(q) {
        const items = [];
        // Sections
        document.querySelectorAll('main section[id]').forEach(sec => {
            const name = sec.querySelector('h2') ? sec.querySelector('h2').textContent.trim() : sec.id;
            items.push({ label: `Section: ${name}`, action: () => smoothScrollTo('#' + sec.id) });
        });
        // Projects
        document.querySelectorAll('.project-card h3').forEach(h3 => {
            const projectName = h3.textContent.trim();
            items.push({ label: `Project: ${projectName}`, action: () => smoothScrollTo('#projects') });
        });
        const ql = q.toLowerCase();
        const filtered = items.filter(it => it.label.toLowerCase().includes(ql));
        cpList.innerHTML = '';
        filtered.forEach((it, idx) => {
            const li = document.createElement('li');
            li.className = 'px-4 py-3 hover:bg-[#222] cursor-pointer text-[#ddd]';
            li.textContent = it.label;
            li.addEventListener('click', () => { it.action(); closePalette(); });
            cpList.appendChild(li);
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            openPalette();
        } else if (e.key === 'Escape') {
            closePalette();
        }
    });
    cpInput && cpInput.addEventListener('input', (e) => renderPalette(e.target.value));

    // (Removed) Case Study Modals and buttons per user request

    // --- 16. Floating Contact Button ---
    const floatingBtn = document.createElement('button');
    floatingBtn.id = 'floating-contact';
    floatingBtn.className = 'fixed bottom-6 left-6 btn-primary btn-sound';
    floatingBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Contact';
    document.body.appendChild(floatingBtn);
    floatingBtn.addEventListener('click', () => smoothScrollTo('#contact'));

    // --- 17. Reduced Motion Support ---
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReduced.matches) {
        // Disable certain animations
        window.removeEventListener('scroll', animateTimeline);
        animatedElements.forEach(el => {
            el.style.transition = 'none';
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }

    // Resume download graceful handling
    const resumeLink = document.getElementById('resume-download');
    if (resumeLink) {
        resumeLink.addEventListener('click', async (e) => {
            try {
                const res = await fetch(resumeLink.getAttribute('href'), { method: 'HEAD' });
                if (!res.ok) {
                    e.preventDefault();
                    showModal('Resume not found. Please add resume.pdf to the project root.');
                }
            } catch (err) {
                e.preventDefault();
                showModal('Unable to access resume right now. Please try again later.');
            }
        });
    }
});
