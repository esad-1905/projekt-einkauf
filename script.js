(() => {
    'use strict';

    // ── Supabase Setup ───────────────────────────────────────────
    const SUPABASE_URL = 'https://kpqyeymjcoggdnosihey.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcXlleW1qY29nZ2Rub3NpaGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Nzc1OTUsImV4cCI6MjA5ODM1MzU5NX0.NOIViDPPnrRDSk-4l2fr3SDs4o6rcBrQauhgL41RK4A';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ── DOM refs: Choice / Auth Screens ──────────────────────────
    const choiceScreen = document.getElementById('choiceScreen');
    const joinScreen = document.getElementById('joinScreen');
    const createScreen = document.getElementById('createScreen');
    const goToJoin = document.getElementById('goToJoin');
    const goToCreate = document.getElementById('goToCreate');
    const backFromJoin = document.getElementById('backFromJoin');
    const backFromCreate = document.getElementById('backFromCreate');

    const joinForm = document.getElementById('joinForm');
    const createForm = document.getElementById('createForm');
    const joinName = document.getElementById('joinName');
    const joinListName = document.getElementById('joinListName');
    const joinPassword = document.getElementById('joinPassword');
    const joinError = document.getElementById('joinError');
    const createName = document.getElementById('createName');
    const createListName = document.getElementById('createListName');
    const createPassword = document.getElementById('createPassword');
    const createError = document.getElementById('createError');

    // ── DOM refs: List Screen ────────────────────────────────────
    const listScreen = document.getElementById('listScreen');
    const currentListName = document.getElementById('currentListName');
    const currentUserName = document.getElementById('currentUserName');
    const newListBtn = document.getElementById('newListBtn');
    const shareBtn = document.getElementById('shareBtn');
    const input = document.getElementById('productInput');
    const addBtn = document.getElementById('addBtn');
    const list = document.getElementById('productList');
    const emptyHint = document.getElementById('emptyHint');
    const listFooter = document.getElementById('listFooter');
    const itemCount = document.getElementById('itemCount');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const toast = document.getElementById('toast');

    // ── State ─────────────────────────────────────────────────────
    let items = [];
    let currentList = null;   // { id, name }
    let userName = '';
    let realtimeChannel = null;

    // ── Init ──────────────────────────────────────────────────────
    init();

    async function init() {
        // 1. Prüfen ob über Share-Link aufgerufen (?list=ID)
        const urlParams = new URLSearchParams(window.location.search);
        const sharedListId = urlParams.get('list');

        if (sharedListId) {
            await enterListById(sharedListId, null, false);
            return;
        }

        // 2. Prüfen ob im Browser gespeicherte Session existiert
        const saved = loadSession();
        if (saved) {
            await enterListById(saved.listId, saved.userName, false);
            return;
        }

        // 3. Sonst: Auswahl-Screen zeigen
        showScreen('choice');
    }

    // ── History API: Browser-Zurück-Button unterstützen ──────────
    window.addEventListener('popstate', (e) => {
        const state = e.state;
        if (state && state.screen === 'list' && state.listId) {
            enterListById(state.listId, state.userName, false);
        } else if (state && state.screen === 'choice') {
            currentList = null;
            if (realtimeChannel) supabase.removeChannel(realtimeChannel);
            showScreen('choice');
        } else {
            // Fallback
            showScreen('choice');
        }
    });

    function pushHistory(screen) {
        if (screen === 'list' && currentList) {
            history.pushState({ screen: 'list', listId: currentList.id, userName }, '', `?list=${currentList.id}`);
        } else {
            history.pushState({ screen: 'choice' }, '', window.location.pathname);
        }
    }

    // ── Navigation zwischen Choice / Join / Create ────────────────
    goToJoin.addEventListener('click', () => showScreen('join'));
    goToCreate.addEventListener('click', () => showScreen('create'));
    backFromJoin.addEventListener('click', () => showScreen('choice'));
    backFromCreate.addEventListener('click', () => showScreen('choice'));

    function showScreen(name) {
        choiceScreen.hidden = name !== 'choice';
        joinScreen.hidden = name !== 'join';
        createScreen.hidden = name !== 'create';
        listScreen.hidden = name !== 'list';
    }

    // ── Liste BEITRETEN ──────────────────────────────────────────
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(joinError);

        const name = joinName.value.trim();
        const listNameVal = joinListName.value.trim();
        const password = joinPassword.value;

        if (!name || !listNameVal || !password) return;

        const { data, error } = await supabase
            .from('lists')
            .select('*')
            .eq('name', listNameVal)
            .eq('password', password)
            .maybeSingle();

        if (error) {
            showError(joinError, 'Fehler: ' + error.message);
            return;
        }

        if (!data) {
            showError(joinError, 'Listenname oder Passwort falsch.');
            return;
        }

        await enterList(data, name, true);
    });

    // ── Liste ERSTELLEN ──────────────────────────────────────────
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(createError);

        const name = createName.value.trim();
        const listNameVal = createListName.value.trim();
        const password = createPassword.value;

        if (!name || !listNameVal || !password) return;

        const { data: existing } = await supabase
            .from('lists')
            .select('id')
            .eq('name', listNameVal)
            .maybeSingle();

        if (existing) {
            showError(createError, 'Dieser Listenname ist bereits vergeben.');
            return;
        }

        const { data, error } = await supabase
            .from('lists')
            .insert({ name: listNameVal, password })
            .select()
            .single();

        if (error) {
            showError(createError, 'Fehler: ' + error.message);
            return;
        }

        await enterList(data, name, true);
    });

    // ── Liste betreten (per Objekt) ──────────────────────────────
    async function enterList(listRow, name, addHistoryEntry) {
        currentList = { id: listRow.id, name: listRow.name };
        userName = name;

        saveSession(currentList.id, userName);

        if (addHistoryEntry) pushHistory('list');

        showScreen('list');
        currentListName.textContent = currentList.name;
        currentUserName.textContent = `👤 ${userName}`;

        await loadItems();
        subscribeToChanges();
    }

    // ── Liste betreten per ID (Share-Link, gespeicherte Session, History) ─
    async function enterListById(listId, name, addHistoryEntry) {
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);

        const { data, error } = await supabase
            .from('lists')
            .select('*')
            .eq('id', listId)
            .maybeSingle();

        if (error || !data) {
            clearSession();
            showScreen('choice');
            return;
        }

        if (!name) {
            name = prompt(`Du trittst der Liste "${data.name}" bei. Wie ist dein Name?`);
            if (!name) {
                showScreen('choice');
                return;
            }
        }

        await enterList(data, name, addHistoryEntry);
    }

    // ── New-Button: zurück zur Auswahl für weitere Liste ──────────
    newListBtn.addEventListener('click', () => {
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        clearSession();
        currentList = null;
        items = [];
        joinForm.reset();
        createForm.reset();
        pushHistory('choice');
        showScreen('choice');
    });

    // ── Share-Button ──────────────────────────────────────────────
    shareBtn.addEventListener('click', async () => {
        const url = `${window.location.origin}${window.location.pathname}?list=${currentList.id}`;
        try {
            await navigator.clipboard.writeText(url);
            showToast('Link kopiert! Einfach teilen.');
        } catch {
            prompt('Link kopieren:', url);
        }
    });

    // ── Daten laden (nur Items der aktuellen Liste) ───────────────
    async function loadItems() {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('list_id', currentList.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Fehler beim Laden:', error);
            return;
        }

        items = data;
        render();
    }

    // ── Realtime-Abo: nur für die aktuelle Liste ──────────────────
    function subscribeToChanges() {
        realtimeChannel = supabase
            .channel(`items-list-${currentList.id}-${Date.now()}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${currentList.id}` },
                () => loadItems()
            )
            .subscribe();
    }

    // ── Events: Produktliste ──────────────────────────────────────
    addBtn.addEventListener('click', addItem);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
    clearAllBtn.addEventListener('click', clearAll);

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
            .insert({ name, done: false, list_id: currentList.id, added_by: userName });

        if (error) {
            console.error('Fehler beim Hinzufügen:', error);
            return;
        }

        input.value = '';
        input.focus();
    }

    // Optimistisches Löschen: UI sofort aktualisieren, dann erst Server
    async function deleteItem(id) {
        const previous = items;
        items = items.filter(i => i.id !== id);
        render();

        const { error } = await supabase.from('items').delete().eq('id', id);

        if (error) {
            console.error('Fehler beim Löschen:', error);
            items = previous; // Rückgängig machen falls fehlgeschlagen
            render();
        }
    }

    async function toggleDone(id) {
        const item = items.find(i => i.id === id);
        if (!item) return;

        // Optimistisches Update
        item.done = !item.done;
        render();

        const { error } = await supabase
            .from('items')
            .update({ done: item.done })
            .eq('id', id);

        if (error) {
            console.error('Fehler beim Aktualisieren:', error);
            item.done = !item.done; // Rückgängig machen
            render();
        }
    }

    async function clearAll() {
        if (!items.length) return;
        if (!confirm('Alle Produkte dieser Liste löschen?')) return;

        const previous = items;
        items = [];
        render();

        const { error } = await supabase
            .from('items')
            .delete()
            .eq('list_id', currentList.id);

        if (error) {
            console.error('Fehler beim Löschen aller Produkte:', error);
            items = previous;
            render();
        }
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

            const nameWrap = document.createElement('span');
            nameWrap.className = 'item-name';
            nameWrap.textContent = item.name;

            if (item.added_by) {
                const sub = document.createElement('span');
                sub.className = 'item-added-by';
                sub.textContent = `von ${item.added_by}`;
                nameWrap.appendChild(sub);
            }

            const del = document.createElement('button');
            del.className = 'delete-btn';
            del.innerHTML = '&#x1F5D1;';
            del.setAttribute('aria-label', `${item.name} löschen`);
            del.addEventListener('click', () => deleteItem(item.id));

            li.append(cb, nameWrap, del);
            list.appendChild(li);
        });

        const done = items.filter(i => i.done).length;
        const total = items.length;
        itemCount.textContent = done
            ? `${done} von ${total} erledigt`
            : `${total} Produkt${total !== 1 ? 'e' : ''}`;
    }

    // ── Session (localStorage) ───────────────────────────────────
    function saveSession(listId, name) {
        try {
            localStorage.setItem('shoppinglist_session', JSON.stringify({ listId, userName: name }));
        } catch (_) { }
    }

    function loadSession() {
        try {
            const raw = localStorage.getItem('shoppinglist_session');
            return raw ? JSON.parse(raw) : null;
        } catch (_) { return null; }
    }

    function clearSession() {
        try { localStorage.removeItem('shoppinglist_session'); } catch (_) { }
    }

    // ── UI Helpers ────────────────────────────────────────────────
    function showError(el, msg) {
        el.textContent = msg;
        el.hidden = false;
    }

    function hideError(el) {
        el.hidden = true;
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.hidden = false;
        setTimeout(() => { toast.hidden = true; }, 2500);
    }
})();