// Load header and footer
document.addEventListener('DOMContentLoaded', function() {
    // Load header
    fetch('/includes/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            initializeHeader();
        });
    
    // Load footer
    fetch('/includes/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        });
});

// Initialize header functionality after it's loaded
function initializeHeader() {
    // Age Counter Functions
    function calculateAge(birthDate) {
        const now = new Date();
        const birth = new Date(birthDate);
        
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        let days = now.getDate() - birth.getDate();
        
        if (days < 0) {
            months--;
            const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += lastMonth.getDate();
        }
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        return { years, months, days };
    }
    
    function updateAges() {
        const harperBirth = '2024-08-29';
        const sophiaBirth = '2025-09-18';
        
        const harperAge = calculateAge(harperBirth);
        const sophiaAge = calculateAge(sophiaBirth);
        
        document.getElementById('harperAge').textContent = 
            `${harperAge.years}y ${harperAge.months}m ${harperAge.days}d`;
        document.getElementById('sophiaAge').textContent = 
            `${sophiaAge.years}y ${sophiaAge.months}m ${sophiaAge.days}d`;
    }
    
    // Update ages immediately and then every hour
    updateAges();
    setInterval(updateAges, 3600000);
    
    // Counter Dropdown Toggle
    const counterButton = document.getElementById('counterButton');
    const counterContent = document.getElementById('counterContent');
    
    counterButton.addEventListener('click', (e) => {
        e.stopPropagation();
        counterContent.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!counterButton.contains(e.target) && !counterContent.contains(e.target)) {
            counterContent.classList.remove('show');
        }
    });

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Check for saved preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    darkModeToggle.addEventListener('change', () => {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
    });

    // Smooth scrolling for navigation
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Handle anchor links on the current page
            if (href.includes('#')) {
                const parts = href.split('#');
                const targetId = parts[1];
                
                // If it's a link to an anchor on the current page
                if (parts[0] === '' || parts[0] === window.location.pathname) {
                    e.preventDefault();
                    const targetSection = document.getElementById(targetId);
                    
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    });
}