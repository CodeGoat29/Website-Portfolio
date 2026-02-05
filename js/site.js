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

    function initHeroCli() {
        const cli = document.querySelector('[data-cli]');
        if (!cli) return;
        const output = cli.querySelector('[data-cli-output]');
        const input = cli.querySelector('[data-cli-input]');
        if (!output || !input) return;

        const systemProfile = {
            computerName: 'DDPLab',
            hostName: 'goat',
            userName: 'ddp',
            homePath: '~'
        };

        const files = {
            'DDP_Secret.txt': 'Got ya! ;)',
            'home.html': [
                '<h1>Welcome to My Digital Workshop</h1>',
                '<h2>Notes, labs, and automation.</h2>',
                '<p>Where I build, break, document, and refine technical projects. This site serves as a central hub for hands-on labs, experiments, and notes across systems engineering, networking, Linux, VoIP, cloud, security, and automation.</p>'
            ]
        };

        const commands = {
            help: () => 'Try: help, hostname, whoami, pwd, ls, cat, neofetch, clear',
            hostname: () => systemProfile.hostName,
            whoami: () => systemProfile.userName,
            pwd: () => `/home/${systemProfile.userName}`,
            ls: () => Object.keys(files).join('  ') || '',
            neofetch: () => ([
                '      /\\_/\\\\',
                '     ( o.o )   ddp@goat',
                '      > ^ <    --------',
                '               OS: DDPLab',
                '               Host: goat',
                '               Shell: bash',
                '               Uptime: 12 days'
            ]),
            clear: () => null
        };

        function buildPrompt() {
            return `<span class="prompt-user">${systemProfile.userName}</span>` +
                `<span class="prompt-sep">@</span>` +
                `<span class="prompt-host">${systemProfile.hostName}</span>` +
                `<span class="prompt-path">:${systemProfile.homePath}</span>` +
                `<span class="prompt-char">$</span>`;
        }

        function printLine(text, className, allowHtml = false) {
            const line = document.createElement('p');
            if (className) line.classList.add(className);
            if (allowHtml) {
                line.innerHTML = text;
            } else {
                line.textContent = text;
            }
            output.appendChild(line);
        }

        function runCommand(raw) {
            const trimmed = raw.trim();
            printLine(`${buildPrompt()} ${trimmed}`, 'prompt-line', true);

            if (!trimmed) return;
            const parts = trimmed.split(' ');
            const cmd = parts[0].toLowerCase();

            if (cmd === 'cat') {
                const target = parts.slice(1).join(' ').trim();
                if (!target) {
                    printLine('cat: missing file operand', 'output');
                    return;
                }
                if (files[target]) {
                    const content = files[target];
                    const lines = Array.isArray(content) ? content : String(content).split('\n');
                    lines.forEach((line) => {
                        if (target === 'home.html') {
                            const match = line.match(/^<([a-z0-9]+)>(.*)<\/\1>$/i);
                            if (match) {
                                const tag = match[1];
                                const text = match[2];
                                const html = `<span class="html-tag">&lt;${tag}&gt;</span>` +
                                    `<span class="html-text">${text}</span>` +
                                    `<span class="html-tag">&lt;/${tag}&gt;</span>`;
                                printLine(html, 'output', true);
                                return;
                            }
                        }
                        printLine(line, 'output');
                    });
                } else {
                    printLine(`cat: ${target}: No such file`, 'output');
                }
                return;
            }

            if (commands[cmd]) {
                const result = commands[cmd]();
                if (result === null) {
                    output.innerHTML = '';
                    return;
                }
                if (result) {
                    if (Array.isArray(result)) {
                        result.forEach((line) => printLine(line, 'output'));
                    } else {
                        printLine(result, 'output');
                    }
                }
                return;
            }

            printLine(`${cmd}: command not found`, 'output');
        }

        input.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const value = input.value;
            input.value = '';
            runCommand(value);
            cli.scrollTop = cli.scrollHeight;
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initDarkMode();
        initContactModal();
        initSmoothNav();
        initHeroCli();
    });
})();
