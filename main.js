/* ═══════════════════════════════════════════
   Weightless to Grounded — main.js
   Smooth scroll + GSAP ScrollTrigger
   ═══════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════
   1. SMOOTH SCROLL (Lerp-based)
   Intercepts native scroll and interpolates
   it for a buttery-smooth experience.
   ══════════════════════════════════════════ */
(function smoothScroll() {
    let current = 0;          // Where we actually are
    let target = 0;           // Where the user wants to go
    const ease = 0.08;        // Lower = smoother & slower
    const scrollContainer = document.querySelector('.scroll-container');
    const body = document.body;

    function setBodyHeight() {
        body.style.height = scrollContainer.scrollHeight + 'px';
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function update() {
        target = window.scrollY;
        current = lerp(current, target, ease);

        // Snap if close enough (avoid infinite micro-updates)
        if (Math.abs(current - target) < 0.5) current = target;

        scrollContainer.style.transform = `translateY(${-current}px)`;

        // Keep ScrollTrigger in sync with our virtual scroll
        ScrollTrigger.update();

        requestAnimationFrame(update);
    }

    // Lock scroll-container to the viewport and translate it ourselves
    scrollContainer.style.position = 'fixed';
    scrollContainer.style.top = '0';
    scrollContainer.style.left = '0';
    scrollContainer.style.width = '100%';
    scrollContainer.style.willChange = 'transform';

    setBodyHeight();
    window.addEventListener('resize', setBodyHeight);
    requestAnimationFrame(update);

    // Tell ScrollTrigger about our proxy scroll
    ScrollTrigger.scrollerProxy(document.body, {
        scrollTop(value) {
            if (arguments.length) {
                target = value;
                current = value;
            }
            return current;
        },
        getBoundingClientRect() {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
    });

    ScrollTrigger.defaults({ scroller: document.body });
    ScrollTrigger.addEventListener('refresh', setBodyHeight);
})();

/* ══════════════════════════════════════════
   2. SCROLL-DOWN INDICATOR (Scene 1)
   Animated bouncing arrow
   ══════════════════════════════════════════ */
const indicator = document.getElementById('scroll-indicator');
if (indicator) {
    // Bounce animation
    gsap.to(indicator, {
        y: 12,
        repeat: -1,
        yoyo: true,
        duration: 0.8,
        ease: 'power1.inOut',
    });

    // Fade out when user starts scrolling
    gsap.to(indicator, {
        opacity: 0,
        scrollTrigger: {
            trigger: '#scene-1',
            start: 'top top',
            end: '+=200',
            scrub: true,
        },
    });
}

/* ══════════════════════════════════════════
   3. TEXT SECTION ANIMATIONS
   ══════════════════════════════════════════ */
document.querySelectorAll('.scene-text').forEach((el) => {
    // Fade in
    gsap.fromTo(el,
        { opacity: 0, y: 60 },
        {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: el.closest('.scene'),
                start: 'top 75%',
                end: 'top 25%',
                scrub: 1,
            },
        }
    );

    // Fade out
    gsap.to(el, {
        opacity: 0,
        y: -40,
        ease: 'power2.in',
        scrollTrigger: {
            trigger: el.closest('.scene'),
            start: 'bottom 65%',
            end: 'bottom 25%',
            scrub: 1,
        },
    });
});

/* ══════════════════════════════════════════
   4. TRUCE BUTTON ANIMATION
   ══════════════════════════════════════════ */
const truceBtn = document.getElementById('truce-btn');

gsap.fromTo(truceBtn,
    { opacity: 0, scale: 0.8 },
    {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: 'back.out(1.4)',
        scrollTrigger: {
            trigger: '#scene-4',
            start: 'top 60%',
            end: 'top 30%',
            scrub: 1,
        },
    }
);

/* ── Button click action ───────────────── */
truceBtn.addEventListener('click', () => {
    window.location.href = 'https://wa.me/?text=Truce%20%F0%9F%A4%8D';
});
