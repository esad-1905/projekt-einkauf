(() => {
    'use strict';

    // ── Supabase Setup ───────────────────────────────────────────
    const SUPABASE_URL = 'https://kpqyeymjcoggdnosihey.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcXlleW1qY29nZ2Rub3NpaGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Nzc1OTUsImV4cCI6MjA5ODM1MzU5NX0.NOIViDPPnrRDSk-4l2fr3SDs4o6rcBrQauhgL41RK4A';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ── SHA-256 Hashing (Web Crypto API) ─────────────────────────
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ── DOM refs: Register / Login ───────────────────────────────
    const registerScreen = document.getElementById('registerScreen');
    const loginScreen = document.getElementById('loginScreen');
    const forgotScreen = document.getElementById('forgotScreen');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const forgotForm = document.getElementById('forgotForm');
    const regUsername = document.getElementById('regUsername');
    const regEmail = document.getElementById('regEmail');
    const regPassword = document.getElementById('regPassword');
    const registerError = document.getElementById('registerError');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    const forgotEmail = document.getElementById('forgotEmail');
    const forgotNewPassword = document.getElementById('forgotNewPassword');
    const forgotNewPasswordRepeat = document.getElementById('forgotNewPasswordRepeat');
    const forgotError = document.getElementById('forgotError');

    const goToLogin = document.getElementById('goToLogin');
    const goToRegister = document.getElementById('goToRegister');
    const goToForgot = document.getElementById('goToForgot');
    const backFromLogin = document.getElementById('backFromLogin');
    const backFromForgot = document.getElementById('backFromForgot');


    // ── DOM refs: Account Area ───────────────────────────────────
    const accountArea = document.getElementById('accountArea');
    const navAccount = document.getElementById('navAccount');
    const navLists = document.getElementById('navLists');
    const navLogout = document.getElementById('navLogout');
    const sectionAccount = document.getElementById('sectionAccount');
    const sectionLists = document.getElementById('sectionLists');
    const accountUsername = document.getElementById('accountUsername');
    const accountEmail = document.getElementById('accountEmail');
    const myListsUl = document.getElementById('myListsUl');
    const myListsEmpty = document.getElementById('myListsEmpty');
    const newListBtn = document.getElementById('newListBtn');

    // ── DOM refs: Choice / Join / Create ─────────────────────────
    const choiceScreen = document.getElementById('choiceScreen');
    const joinScreen = document.getElementById('joinScreen');
    const createScreen = document.getElementById('createScreen');
    const goToJoin = document.getElementById('goToJoin');
    const goToCreate = document.getElementById('goToCreate');
    const backFromChoice = document.getElementById('backFromChoice');
    const backFromJoin = document.getElementById('backFromJoin');
    const backFromCreate = document.getElementById('backFromCreate');
    const joinForm = document.getElementById('joinForm');
    const createForm = document.getElementById('createForm');
    const joinListName = document.getElementById('joinListName');
    const joinPassword = document.getElementById('joinPassword');
    const joinError = document.getElementById('joinError');
    const createListName = document.getElementById('createListName');
    const createPassword = document.getElementById('createPassword');
    const createError = document.getElementById('createError');

    // ── DOM refs: List Screen ────────────────────────────────────
    const listScreen = document.getElementById('listScreen');
    const backFromList = document.getElementById('backFromList');
    const currentListNameEl = document.getElementById('currentListName');
    const currentUserNameEl = document.getElementById('currentUserName');
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
    let currentUser = null;
    let currentList = null;
    let items = [];
    let myLists = [];
    let realtimeChannel = null;

    // ── Init ──────────────────────────────────────────────────────
    init();

    async function init() {
        const saved = loadUserSession();
        if (saved) {
            currentUser = saved;
            const urlParams = new URLSearchParams(window.location.search);
            const sharedListId = urlParams.get('list');
            if (sharedListId) {
                await openListById(sharedListId, false);
                return;
            }
            showAccountArea();
            return;
        }
        showScreen('register');
    }

    // ── History API ───────────────────────────────────────────────
    window.addEventListener('popstate', (e) => {
        const state = e.state;
        if (!state) { showAccountArea(); return; }
        if (state.screen === 'list' && state.listId) {
            openListById(state.listId, false);
        } else if (state.screen === 'account') {
            if (realtimeChannel) supabase.removeChannel(realtimeChannel);
            showAccountArea();
        } else if (state.screen === 'choice') {
            showScreen('choice');
        } else {
            showAccountArea();
        }
    });

    function pushHistory(state, url) {
        history.pushState(state, '', url || window.location.pathname);
    }

    // ── Passwort Auge-Toggle (gilt für alle pw-toggle Buttons) ───
    document.querySelectorAll('.pw-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const pwInput = document.getElementById(targetId);
            const isHidden = pwInput.type === 'password';
            pwInput.type = isHidden ? 'text' : 'password';
            btn.textContent = isHidden ? '🙈' : '👁';
        });
    });

    // ── Register / Login Navigation ───────────────────────────────
    goToLogin.addEventListener('click', (e) => { e.preventDefault(); showScreen('login'); });
    goToRegister.addEventListener('click', (e) => { e.preventDefault(); showScreen('register'); });
    goToForgot.addEventListener('click', (e) => {
        e.preventDefault();
        forgotForm.reset();
        hideError(forgotError);
        showScreen('forgot');
    });
    backFromLogin.addEventListener('click', () => showScreen('register'));
    backFromForgot.addEventListener('click', () => showScreen('login'));


    // ── Registrieren ──────────────────────────────────────────────
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(registerError);

        const username = regUsername.value.trim();
        const email = regEmail.value.trim().toLowerCase();
        const password = regPassword.value;

        if (!username || !email || !password) return;

        // Prüfen ob Username oder Email schon existiert
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${username},email.eq.${email}`)
            .maybeSingle();

        if (existing) {
            showError(registerError, 'Benutzername oder E-Mail bereits vergeben.');
            return;
        }

        // Passwort hashen (SHA-256)
        const hashedPassword = await hashPassword(password);

        const { data, error } = await supabase
            .from('users')
            .insert({ username, email, password: hashedPassword })
            .select()
            .single();

        if (error) {
            showError(registerError, 'Fehler: ' + error.message);
            return;
        }

        currentUser = data;
        saveUserSession(currentUser);
        sendWelcomeEmail(currentUser);
        showToast(`Willkommen, ${currentUser.username}! 🎉`);
        showAccountArea();
    });

    // ── Login ────────────────────────────────────────────────────
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(loginError);

        const email = loginEmail.value.trim().toLowerCase();
        const password = loginPassword.value;

        if (!email || !password) return;

        const hashedPassword = await hashPassword(password);

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', hashedPassword)
            .maybeSingle();

        if (error) { showError(loginError, 'Fehler: ' + error.message); return; }
        if (!data) { showError(loginError, 'E-Mail oder Passwort falsch.'); return; }

        currentUser = data;
        saveUserSession(currentUser);
        showToast(`Willkommen zurück, ${currentUser.username}!`);
        showAccountArea();
    });

    // ── Passwort vergessen ────────────────────────────────────────
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(forgotError);

        const email = forgotEmail.value.trim().toLowerCase();
        const newPw = forgotNewPassword.value;
        const newPwRepeat = forgotNewPasswordRepeat.value;

        if (!email || !newPw || !newPwRepeat) return;

        if (newPw !== newPwRepeat) {
            showError(forgotError, 'Die Passwörter stimmen nicht überein.');
            return;
        }

        // User per Email suchen
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('id, password')
            .eq('email', email)
            .maybeSingle();

        if (findError) { showError(forgotError, 'Fehler: ' + findError.message); return; }
        if (!user) { showError(forgotError, 'Keine Konto mit dieser E-Mail gefunden.'); return; }

        // Neues Passwort hashen
        const hashedNew = await hashPassword(newPw);

        // Neues Passwort darf nicht mit altem übereinstimmen
        if (hashedNew === user.password) {
            showError(forgotError, 'Das neue Passwort darf nicht mit dem alten übereinstimmen.');
            return;
        }

        // Passwort aktualisieren
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedNew })
            .eq('id', user.id);

        if (updateError) { showError(forgotError, 'Fehler: ' + updateError.message); return; }

        showToast("✅ Passwort erfolgreich geändert!");
        forgotForm.reset();
        setTimeout(() => showScreen("login"), 2000);




    });

    // ── Simulierte Willkommens-Mail ───────────────────────────────
    function sendWelcomeEmail(user) {
        console.log(`[Simulierte E-Mail an ${user.email}]`);
        console.log(`Betreff: Willkommen in deiner Einkaufsliste`);
        console.log(`Willkommen in deiner Einkaufsliste, ${user.username}!`);
    }

    // ── Account-Bereich anzeigen ──────────────────────────────────
    async function showAccountArea() {
        showScreen('account');
        accountUsername.textContent = currentUser.username;
        accountEmail.textContent = currentUser.email;
        pushHistory({ screen: 'account' });
        await loadMyLists();
    }

    // ── Navigation innerhalb Account-Bereich ──────────────────────
    navAccount.addEventListener('click', () => switchAccountTab('account'));
    navLists.addEventListener('click', () => switchAccountTab('lists'));
    navLogout.addEventListener('click', logout);

    function switchAccountTab(tab) {
        const isAccount = tab === 'account';
        navAccount.classList.toggle('active', isAccount);
        navLists.classList.toggle('active', !isAccount);
        sectionAccount.hidden = !isAccount;
        sectionLists.hidden = isAccount;
        if (!isAccount) loadMyLists();
    }

    function logout() {
        if (!confirm('Möchtest du dich wirklich abmelden?')) return;
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        clearUserSession();
        currentUser = null;
        currentList = null;
        items = [];
        myLists = [];
        registerForm.reset();
        loginForm.reset();
        pushHistory(null, window.location.pathname);
        showScreen('register');
        showToast('Du wurdest abgemeldet.');
    }

    // ── Meine Listen laden ────────────────────────────────────────
    async function loadMyLists() {
        const { data, error } = await supabase
            .from('list_members')
            .select('list_id, lists ( id, name )')
            .eq('user_id', currentUser.id);

        if (error) { console.error('Fehler beim Laden der Listen:', error); return; }

        myLists = (data || []).map(row => row.lists).filter(Boolean);
        renderMyLists();
    }

    function renderMyLists() {
        myListsUl.innerHTML = '';
        const hasLists = myLists.length > 0;
        myListsEmpty.hidden = hasLists;

        myLists.forEach(l => {
            const li = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.className = 'list-name';
            nameSpan.textContent = l.name;
            const arrow = document.createElement('span');
            arrow.className = 'list-arrow';
            arrow.textContent = '→';
            li.append(nameSpan, arrow);
            li.addEventListener('click', () => openList(l, true));
            myListsUl.appendChild(li);
        });
    }

    // ── New-Button ────────────────────────────────────────────────
    newListBtn.addEventListener('click', () => {
        showScreen('choice');
        pushHistory({ screen: 'choice' });
    });

    backFromChoice.addEventListener('click', () => showAccountArea());

    // ── Choice Navigation ─────────────────────────────────────────
    goToJoin.addEventListener('click', () => showScreen('join'));
    goToCreate.addEventListener('click', () => showScreen('create'));
    backFromJoin.addEventListener('click', () => showScreen('choice'));
    backFromCreate.addEventListener('click', () => showScreen('choice'));
    backFromList.addEventListener('click', () => {
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        showAccountArea();
    });

    // ── Liste BEITRETEN ──────────────────────────────────────────
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(joinError);

        const listNameVal = joinListName.value.trim();
        const password = joinPassword.value;

        if (!listNameVal || !password) return;

        // Listen-Passwort hashen
        const hashedPassword = await hashPassword(password);

        const { data, error } = await supabase
            .from('lists')
            .select('*')
            .eq('name', listNameVal)
            .eq('password', hashedPassword)
            .maybeSingle();

        if (error) { showError(joinError, 'Fehler: ' + error.message); return; }
        if (!data) { showError(joinError, 'Listenname oder Passwort falsch.'); return; }

        await ensureMembership(data.id);
        joinForm.reset();
        await openList(data, true);
    });

    // ── Liste ERSTELLEN ──────────────────────────────────────────
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(createError);

        const listNameVal = createListName.value.trim();
        const password = createPassword.value;

        if (!listNameVal || !password) return;

        const { data: existing } = await supabase
            .from('lists')
            .select('id')
            .eq('name', listNameVal)
            .maybeSingle();

        if (existing) {
            showError(createError, 'Dieser Listenname ist bereits vergeben.');
            return;
        }

        // Listen-Passwort hashen
        const hashedPassword = await hashPassword(password);

        const { data, error } = await supabase
            .from('lists')
            .insert({ name: listNameVal, password: hashedPassword })
            .select()
            .single();

        if (error) { showError(createError, 'Fehler: ' + error.message); return; }

        await ensureMembership(data.id);
        createForm.reset();
        await openList(data, true);
    });

    // ── Mitgliedschaft sicherstellen ──────────────────────────────
    async function ensureMembership(listId) {
        const { data: existing } = await supabase
            .from('list_members')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('list_id', listId)
            .maybeSingle();

        if (!existing) {
            await supabase
                .from('list_members')
                .insert({ user_id: currentUser.id, list_id: listId });
        }
    }

    // ── Liste öffnen ──────────────────────────────────────────────
    async function openList(listRow, addHistoryEntry) {
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        currentList = { id: listRow.id, name: listRow.name };

        if (addHistoryEntry) {
            pushHistory({ screen: 'list', listId: currentList.id }, `?list=${currentList.id}`);
        }

        showScreen('list');
        currentListNameEl.textContent = currentList.name;
        currentUserNameEl.textContent = `👤 ${currentUser.username}`;

        await loadItems();
        subscribeToChanges();
    }

    async function openListById(listId, addHistoryEntry) {
        const { data, error } = await supabase
            .from('lists')
            .select('*')
            .eq('id', listId)
            .maybeSingle();

        if (error || !data) {
            showToast('Diese Liste existiert nicht mehr.');
            showAccountArea();
            return;
        }

        await ensureMembership(data.id);
        await openList(data, addHistoryEntry);
    }

    // ── Benutzer-Dropdown ─────────────────────────────────────────
    const membersBtn = document.getElementById('membersBtn');
    const membersDropdown = document.getElementById('membersDropdown');
    const membersList = document.getElementById('membersList');

    membersBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const isOpen = !membersDropdown.hidden;
        membersDropdown.hidden = isOpen;
        if (!isOpen) await loadMembers();
    });

    document.addEventListener('click', () => {
        membersDropdown.hidden = true;
    });

    async function loadMembers() {
        membersList.innerHTML = '<li style="padding:.55rem 1rem;color:var(--muted);font-size:.85rem">Lädt…</li>';

        const { data, error } = await supabase
            .from('list_members')
            .select('user_id, users ( username )')
            .eq('list_id', currentList.id);

        if (error || !data) {
            membersList.innerHTML = '<li style="padding:.55rem 1rem;color:var(--danger);font-size:.85rem">Fehler beim Laden</li>';
            return;
        }

        membersList.innerHTML = '';
        data.forEach(row => {
            const username = row.users?.username || 'Unbekannt';
            const li = document.createElement('li');

            const avatar = document.createElement('div');
            avatar.className = 'member-avatar';
            avatar.textContent = username.charAt(0);

            const name = document.createElement('span');
            name.textContent = username;

            li.append(avatar, name);
            membersList.appendChild(li);
        });
    }

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

    // ── Daten laden ───────────────────────────────────────────────
    async function loadItems() {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('list_id', currentList.id)
            .order('created_at', { ascending: true });

        if (error) { console.error('Fehler beim Laden:', error); return; }
        items = data;
        render();
    }

    // ── Realtime-Abo ─────────────────────────────────────────────
    function subscribeToChanges() {
        realtimeChannel = supabase
            .channel(`items-list-${currentList.id}-${Date.now()}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${currentList.id}` },
                () => loadItems()
            )
            .subscribe();
    }

    // ── Produktliste ──────────────────────────────────────────────
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
            .insert({ name, done: false, list_id: currentList.id, added_by: currentUser.username });

        if (error) { console.error('Fehler beim Hinzufügen:', error); return; }
        input.value = '';
        input.focus();
    }

    async function deleteItem(id) {
        const previous = items;
        items = items.filter(i => i.id !== id);
        render();

        const { error } = await supabase.from('items').delete().eq('id', id);
        if (error) {
            console.error('Fehler beim Löschen:', error);
            items = previous;
            render();
        }
    }

    async function toggleDone(id) {
        const item = items.find(i => i.id === id);
        if (!item) return;
        item.done = !item.done;
        render();

        const { error } = await supabase.from('items').update({ done: item.done }).eq('id', id);
        if (error) {
            console.error('Fehler beim Aktualisieren:', error);
            item.done = !item.done;
            render();
        }
    }

    async function clearAll() {
        if (!items.length) return;
        if (!confirm('Alle Produkte dieser Liste löschen?')) return;

        const previous = items;
        items = [];
        render();

        const { error } = await supabase.from('items').delete().eq('list_id', currentList.id);
        if (error) {
            console.error('Fehler:', error);
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

    // ── Screens ───────────────────────────────────────────────────
    function showScreen(name) {
        registerScreen.hidden = name !== 'register';
        loginScreen.hidden = name !== 'login';
        forgotScreen.hidden = name !== 'forgot';
        accountArea.hidden = name !== 'account';
        choiceScreen.hidden = name !== 'choice';
        joinScreen.hidden = name !== 'join';
        createScreen.hidden = name !== 'create';
        listScreen.hidden = name !== 'list';
    }

    // ── Session ───────────────────────────────────────────────────
    function saveUserSession(user) {
        try { localStorage.setItem('shoppinglist_user', JSON.stringify(user)); } catch (_) { }
    }

    function loadUserSession() {
        try {
            const raw = localStorage.getItem('shoppinglist_user');
            return raw ? JSON.parse(raw) : null;
        } catch (_) { return null; }
    }

    function clearUserSession() {
        try { localStorage.removeItem('shoppinglist_user'); } catch (_) { }
    }

    // ── UI Helpers ────────────────────────────────────────────────
    function showError(el, msg) { el.textContent = msg; el.hidden = false; }
    function hideError(el) { el.hidden = true; }

    function showToast(msg) {
        toast.textContent = msg;
        toast.hidden = false;
        setTimeout(() => { toast.hidden = true; }, 2800);
    }
})();