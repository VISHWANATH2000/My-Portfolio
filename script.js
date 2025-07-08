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

    // --- 2. Smooth Scrolling for Navigation Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

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

    // EmailJS integration for contact form
    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // EmailJS send
            emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', this, 'YOUR_USER_ID')
                .then(function() {
                    showModal('Message sent successfully!');
                    contactForm.reset();
                }, function(error) {
                    showModal('Failed to send message. Please try again later.');
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
});
