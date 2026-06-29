(() => {
    'use strict';

    // ── DOM refs ──────────────────────────────────────────────────
    const input = document.getElementById('productInput');
    const addBtn = document.getElementById('addBtn');
    const list = document.getElementById('productList');
    const emptyHint = document.getElementById('emptyHint');
    const listFooter = document.getElementById('listFooter');
    const itemCount = document.getElementById('itemCount');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // ── State ─────────────────────────────────────────────────────
    let items = loadFromStorage();

    // ── Init ──────────────────────────────────────────────────────
    render();

    // ── Events ────────────────────────────────────────────────────
    addBtn.addEventListener('click', addItem);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
    clearAllBtn.addEventListener('click', clearAll);

    // ── Functions ─────────────────────────────────────────────────
    function addItem() {
        const name = input.value.trim();
        if (!name) {
            input.focus();
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 400);
            return;
        }

        items.push({ id: Date.now(), name, done: false });
        input.value = '';
        input.focus();
        saveToStorage();
        render();
    }

    function deleteItem(id) {
        items = items.filter(i => i.id !== id);
        saveToStorage();
        render();
    }

    function toggleDone(id) {
        const item = items.find(i => i.id === id);
        if (item) item.done = !item.done;
        saveToStorage();
        render();
    }

    function clearAll() {
        if (!items.length) return;
        if (confirm('Alle Produkte löschen?')) {
            items = [];
            saveToStorage();
            render();
        }
    }

    function render() {
        // Clear list
        list.innerHTML = '';

        const hasItems = items.length > 0;
        emptyHint.hidden = hasItems;
        listFooter.hidden = !hasItems;

        if (!hasItems) return;

        items.forEach(item => {
            const li = document.createElement('li');
            if (item.done) li.classList.add('done');

            // Checkbox
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = item.done;
            cb.setAttribute('aria-label', `${item.name} erledigt`);
            cb.addEventListener('change', () => toggleDone(item.id));

            // Name
            const span = document.createElement('span');
            span.className = 'item-name';
            span.textContent = item.name;

            // Delete button
            const del = document.createElement('button');
            del.className = 'delete-btn';
            del.innerHTML = '&#x1F5D1;'; // 🗑
            del.setAttribute('aria-label', `${item.name} löschen`);
            del.addEventListener('click', () => deleteItem(item.id));

            li.append(cb, span, del);
            list.appendChild(li);
        });

        // Footer count
        const done = items.filter(i => i.done).length;
        const total = items.length;
        itemCount.textContent = done
            ? `${done} von ${total} erledigt`
            : `${total} Produkt${total !== 1 ? 'e' : ''}`;
    }

    // ── LocalStorage ──────────────────────────────────────────────
    function saveToStorage() {
        try { localStorage.setItem('einkaufsliste', JSON.stringify(items)); }
        catch (_) { }
    }

    function loadFromStorage() {
        try {
            const raw = localStorage.getItem('einkaufsliste');
            return raw ? JSON.parse(raw) : [];
        } catch (_) { return []; }
    }
})();