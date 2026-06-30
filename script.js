(() => {
    'use strict';

    // ── Supabase Setup ───────────────────────────────────────────
    const SUPABASE_URL = 'https://kpqyeymjcoggdnosihey.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcXlleW1qY29nZ2Rub3NpaGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Nzc1OTUsImV4cCI6MjA5ODM1MzU5NX0.NOIViDPPnrRDSk-4l2fr3SDs4o6rcBrQauhgL41RK4A';

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ── DOM refs ──────────────────────────────────────────────────
    const input = document.getElementById('productInput');
    const addBtn = document.getElementById('addBtn');
    const list = document.getElementById('productList');
    const emptyHint = document.getElementById('emptyHint');
    const listFooter = document.getElementById('listFooter');
    const itemCount = document.getElementById('itemCount');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // ── State ─────────────────────────────────────────────────────
    let items = [];

    // ── Init ──────────────────────────────────────────────────────
    loadItems();
    subscribeToChanges();

    // ── Events ────────────────────────────────────────────────────
    addBtn.addEventListener('click', addItem);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
    clearAllBtn.addEventListener('click', clearAll);

    // ── Daten laden ───────────────────────────────────────────────
    async function loadItems() {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Fehler beim Laden:', error);
            return;
        }

        items = data;
        render();
    }

    // ── Realtime-Abo: reagiert auf Änderungen von ALLEN Geräten ───
    function subscribeToChanges() {
        supabase
            .channel('items-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
                loadItems(); // bei jeder Änderung neu laden
            })
            .subscribe();
    }

    // ── Funktionen ────────────────────────────────────────────────
    async function addItem() {
        const name = input.value.trim();
        if (!name) {
            input.focus();
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 400);
            return;
        }

        const { error } = await supabase
            .from('items')
            .insert({ name, done: false });

        if (error) {
            console.error('Fehler beim Hinzufügen:', error);
            return;
        }

        input.value = '';
        input.focus();
        // Kein manuelles render() nötig — Realtime-Abo lädt automatisch neu
    }

    async function deleteItem(id) {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (error) console.error('Fehler beim Löschen:', error);
    }

    async function toggleDone(id) {
        const item = items.find(i => i.id === id);
        if (!item) return;

        const { error } = await supabase
            .from('items')
            .update({ done: !item.done })
            .eq('id', id);

        if (error) console.error('Fehler beim Aktualisieren:', error);
    }

    async function clearAll() {
        if (!items.length) return;
        if (!confirm('Alle Produkte löschen?')) return;

        const { error } = await supabase
            .from('items')
            .delete()
            .neq('id', 0); // löscht alle Zeilen

        if (error) console.error('Fehler beim Löschen aller Produkte:', error);
    }

    function render() {
        list.innerHTML = '';

        const hasItems = items.length > 0;
        emptyHint.hidden = hasItems;
        listFooter.hidden = !hasItems;

        if (!hasItems) return;

        items.forEach(item => {
            const li = document.createElement('li');
            if (item.done) li.classList.add('done');

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = item.done;
            cb.setAttribute('aria-label', `${item.name} erledigt`);
            cb.addEventListener('change', () => toggleDone(item.id));

            const span = document.createElement('span');
            span.className = 'item-name';
            span.textContent = item.name;

            const del = document.createElement('button');
            del.className = 'delete-btn';
            del.innerHTML = '&#x1F5D1;';
            del.setAttribute('aria-label', `${item.name} löschen`);
            del.addEventListener('click', () => deleteItem(item.id));

            li.append(cb, span, del);
            list.appendChild(li);
        });

        const done = items.filter(i => i.done).length;
        const total = items.length;
        itemCount.textContent = done
            ? `${done} von ${total} erledigt`
            : `${total} Produkt${total !== 1 ? 'e' : ''}`;
    }
})();