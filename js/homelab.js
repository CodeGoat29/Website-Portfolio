(async function () {
    'use strict';
    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    };
    const get = id => document.getElementById(id);
    function deviceMark() {
        const mark = el('span', 'device-mark');
        mark.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 4; i++) mark.append(el('span'));
        return mark;
    }
    function appendList(parent, items) {
        if (!items?.length) return;
        const list = el('ul', 'lab-detail-list');
        items.forEach(text => list.append(el('li', '', text)));
        parent.append(list);
    }
    async function loadPosts() {
        const target = get('lab-posts');
        try {
            const response = await fetch('/blog/');
            if (!response.ok) throw new Error('Blog unavailable');
            const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
            const posts = [...doc.querySelectorAll('.blog-card')].filter(card => {
                const terms = [card.querySelector('.blog-category')?.textContent || '', card.dataset.tags || ''];
                return terms.some(term => term.split(/[,\s]+/).some(tag => tag.toLowerCase() === 'homelab'));
            });
            target.replaceChildren();
            if (!posts.length) target.append(el('p', 'lab-muted', 'No Homelab posts yet. Notes will appear here as the lab develops.'));
            posts.forEach(card => {
                // Resolve relative links against the blog page before reusing its card.
                card.querySelectorAll('a[href]').forEach(a => a.href = new URL(a.getAttribute('href'), new URL('/blog/', location.origin)).href);
                target.append(document.importNode(card, true));
            });
        } catch {
            target.replaceChildren(el('p', 'lab-muted', 'Related posts could not be loaded. Visit the blog to browse all posts.'));
        }
    }
    loadPosts();
    try {
        const response = await fetch('/homelab/lab.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('Inventory unavailable');
        const data = await response.json();
        get('lab-overview').textContent = data.overview;
        get('lab-updated').dateTime = data.lastUpdated;
        get('lab-updated').textContent = new Date(data.lastUpdated + 'T12:00:00').toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});
        const topologyImage = get('lab-topology-image');
        topologyImage.src = data.topology.image;
        topologyImage.alt = data.topology.alt;
        get('lab-topology-caption').textContent = data.topology.caption;
        data.equipment.forEach((device, index) => {
            const card = el('article', 'hardware-card');
            card.id = 'hardware-' + device.id;
            const media = el('div', 'hardware-photo');
            if (device.photo) {
                const img = el('img');
                img.src = device.photo;
                img.alt = device.photoAlt || device.model;
                img.loading = 'lazy';
                img.addEventListener('error', () => { media.replaceChildren(deviceMark(), el('span', '', 'Device photo coming soon')); });
                media.append(img);
            } else {
                media.classList.add('photo-placeholder');
                media.append(deviceMark(), el('span', '', device.role));
            }
            const body = el('div', 'hardware-body');
            if (device.photoCaption && device.showPhoto !== false) body.append(el('p', 'photo-caption', device.photoCaption));
            body.append(el('p', 'lab-eyebrow', String(index + 1).padStart(2,'0') + ' / ' + device.manufacturer), el('h3', '', device.model), el('p', 'hardware-role', device.role), el('p', '', device.description), el('span', 'lab-badge', device.status));
            appendList(body, device.specifications);
            if (device.showPhoto !== false) card.append(media);
            card.append(body);
            get('lab-hardware').append(card);
        });
        if (data.configuration.length) {
            get('lab-configuration').replaceChildren();
            data.configuration.forEach(feature => {
                const item = el('div', 'lab-record');
                item.append(el('h3', '', feature.name), el('p', '', feature.details));
                appendList(item, feature.items);
                if (feature.vlans) {
                    const wrapper = el('div', 'lab-table-wrap');
                    wrapper.tabIndex = 0;
                    wrapper.setAttribute('role', 'region');
                    wrapper.setAttribute('aria-label', 'VLAN addressing; scroll horizontally on small screens');
                    const table = el('table', 'lab-vlan-table');
                    table.append(el('caption', '', 'Configured VLANs and subnet design'));
                    const head = el('thead');
                    const headings = el('tr');
                    ['VLAN', 'Purpose', 'Subnet'].forEach(label => {
                        const cell = el('th', '', label); cell.scope = 'col'; headings.append(cell);
                    });
                    head.append(headings); table.append(head);
                    const body = el('tbody');
                    feature.vlans.forEach(vlan => {
                        const row = el('tr');
                        [String(vlan.id), vlan.name, vlan.subnet].forEach(value => row.append(el('td', '', value)));
                        body.append(row);
                    });
                    table.append(body); wrapper.append(table); item.append(wrapper);
                }
                get('lab-configuration').append(item);
            });
        }
    } catch (error) {
        get('lab-error').hidden = false;
        get('lab-error').textContent = 'Lab details could not be loaded. Please try refreshing the page.';
        console.error(error);
    }
})();
