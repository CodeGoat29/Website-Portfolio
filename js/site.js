(function () {
    function initDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        if (!toggle) return;
        const body = document.body;
        if (localStorage.getItem('darkMode') === 'enabled') {
            body.classList.add('dark-mode');
            toggle.checked = true;
        }
        toggle.addEventListener('change', () => {
            body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
        });
    }

    function initContactModal() {
        const modal = document.getElementById('contactModal');
        const closeBtn = document.getElementById('contactModalClose');
        if (!modal || !closeBtn) return;
        document.querySelectorAll('[data-contact-open]').forEach((btn) => {
            btn.addEventListener('click', () => modal.classList.add('show'));
        });
        closeBtn.addEventListener('click', () => modal.classList.remove('show'));
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'contactModal') {
                modal.classList.remove('show');
            }
        });
    }

    function initSmoothNav() {
        document.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (!targetId || !targetId.startsWith('#')) return;
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initDarkMode();
        initContactModal();
        initSmoothNav();
    });
})();
