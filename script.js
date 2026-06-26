let users = JSON.parse(localStorage.getItem("users") || "{}");
let currentUser = localStorage.getItem("currentUser") || null;
let items = [];

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

/* ---------------- LOGIN / REGISTER ---------------- */

function register() {
    let username = document.getElementById("username").value;
    let p1 = document.getElementById("pass1").value;
    let p2 = document.getElementById("pass2").value;

    if (!username || !p1 || p1 !== p2) {
        document.getElementById("error").innerText = "❌ Fehler bei Registrierung";
        return;
    }

    if (users[username]) {
        document.getElementById("error").innerText = "❌ Benutzername existiert bereits";
        return;
    }

    users[username] = {
        password: p1,
        items: [],
        settings: { theme: 'dark' }
    };

    localStorage.setItem("users", JSON.stringify(users));

    document.getElementById("error").innerText = "✔ Account erstellt! Du kannst dich jetzt einloggen.";
}

/* LOGIN */
function login() {
    let username = document.getElementById("username").value;
    let inputPass = document.getElementById("loginPass").value;

    if (!users[username] || users[username].password !== inputPass) {
        document.getElementById("error").innerText = "❌ Login fehlgeschlagen";
        return;
    }

    currentUser = username;
    localStorage.setItem('currentUser', currentUser);
    items = users[username].items || [];

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("app").style.display = "block";

    applyTheme();
    render();
}

/* ---------------- ADD ITEM ---------------- */

function addItem() {
    let name = document.getElementById("product").value.trim();
    let category = document.getElementById("category").value;
    let dateVal = document.getElementById("date").value;

    if (!name) return;

    let date = dateVal ? new Date(dateVal).toLocaleDateString() : new Date().toLocaleDateString();

    items.push({
        id: generateId(),
        name,
        category,
        count: 1,
        done: false,
        date
    });

    document.getElementById("product").value = "";
    document.getElementById("date").value = "";

    save();
    render();
}

/* ---------------- CHANGE COUNT ---------------- */

function findIndexById(id) {
    return items.findIndex(it => it.id === id);
}

function changeById(id, value) {
    let i = findIndexById(id);
    if (i === -1) return;
    items[i].count += value;
    if (items[i].count <= 0) {
        items.splice(i,1);
    }
    save(); render();
}

/* ---------------- TOGGLE DONE ---------------- */

function toggleDoneById(id) {
    let i = findIndexById(id);
    if (i === -1) return;
    items[i].done = !items[i].done;
    save(); render();
}

/* ---------------- DELETE ---------------- */

function removeItemById(id) {
    let i = findIndexById(id);
    if (i === -1) return;
    items.splice(i,1);
    save(); render();
}

/* ---------------- EDIT ---------------- */

function editItemById(id) {
    let i = findIndexById(id);
    if (i === -1) return;
    let it = items[i];
    let newName = prompt("Name:", it.name);
    if (newName === null) return;
    let newCat = prompt("Kategorie:", it.category) || it.category;
    let newCount = parseInt(prompt("Menge:", it.count), 10) || it.count;
    let newDate = prompt("Einkaufsdatum (YYYY-MM-DD):", new Date(it.date).toISOString().slice(0,10));

    it.name = newName.trim() || it.name;
    it.category = newCat;
    it.count = isNaN(newCount) ? it.count : newCount;
    if (newDate) {
        try { it.date = new Date(newDate).toLocaleDateString(); } catch(e){}
    }

    save(); render();
}

/* ---------------- SEARCH ---------------- */

function render() {
    document.getElementById('userDisplay').innerText = currentUser ? `Benutzer: ${currentUser}` : '';
    let list = document.getElementById("list");
    let search = document.getElementById("search")?.value.toLowerCase() || "";
    list.innerHTML = "";

    items
        .filter(item => item.name.toLowerCase().includes(search) || item.category.toLowerCase().includes(search))
        .forEach(item => {
        list.innerHTML += `
        <div class="item ${item.done ? "done" : ""}">
            <div>
                <b>${item.name}</b><br>
                <small>${item.category} | ${item.date} | x${item.count}</small>
            </div>

            <div class="controls">
                <button class="blue" onclick="changeById('${item.id}',1)">+</button>
                <button class="blue" onclick="changeById('${item.id}',-1)">-</button>
                <button class="green" onclick="toggleDoneById('${item.id}')">✔</button>
                <button class="gray" onclick="editItemById('${item.id}')">✏️</button>
                <button class="red" onclick="removeItemById('${item.id}')">🗑</button>
            </div>
        </div>`;
    });

    save();
}

/* ---------------- SAVE ---------------- */

function save() {
    if (currentUser) {
        users[currentUser].items = items;
    }
    localStorage.setItem("users", JSON.stringify(users));
}

/* ---------------- THEME ---------------- */

function toggleTheme() {
    if (!currentUser) {
        document.body.classList.toggle('light');
        return;
    }

    let s = users[currentUser].settings || { theme: 'dark' };
    s.theme = s.theme === 'light' ? 'dark' : 'light';
    users[currentUser].settings = s;
    localStorage.setItem('users', JSON.stringify(users));
    applyTheme();
}

function applyTheme() {
    if (!currentUser) return;
    let theme = users[currentUser]?.settings?.theme || 'dark';
    if (theme === 'light') {
        document.body.classList.add('light');
        document.body.style.background = '#e5e7eb';
        document.body.style.color = '#111';
    } else {
        document.body.classList.remove('light');
        document.body.style.background = 'linear-gradient(135deg, #0f172a, #1e293b)';
        document.body.style.color = 'white';
    }
}

/* ---------------- EXPORT JSON ---------------- */

function exportJSON() {
    if (!currentUser) return alert('Bitte einloggen');
    let data = JSON.stringify(items, null, 2);
    let blob = new Blob([data], {type: "application/json"});
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = `${currentUser}_einkaufsliste.json`;
    a.click();
}

/* ---------------- IMPORT JSON ---------------- */

function importJSON() {
    if (!currentUser) return alert('Bitte einloggen');
    // handled by hidden file input triggerImport()
}

function triggerImport() {
    if (!currentUser) return alert('Bitte einloggen');
    let f = document.getElementById('importFile');
    f.value = null;
    f.click();
}

document.getElementById('importFile')?.addEventListener('change', function(e){
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function(ev){
        try {
            let parsed = JSON.parse(ev.target.result);
            // ensure items have ids
            parsed = parsed.map(it => ({ id: it.id || generateId(), name: it.name||'', category: it.category||'Sonstiges', count: it.count||1, done: !!it.done, date: it.date||new Date().toLocaleDateString() }));
            items = parsed;
            save(); render();
            alert('Import erfolgreich');
        } catch(err){ alert('Fehler beim Import'); }
    };
    reader.readAsText(file);
});

/* ---------------- PDF EXPORT ---------------- */

function exportPDF() {
    if (!currentUser) return alert('Bitte einloggen');
    let w = window.open('', '_blank');
    let html = `<!doctype html><html><head><meta charset="utf-8"><title>Einkaufsliste</title>
    <style>body{font-family:Arial;padding:20px;} h1{font-size:20px;} .item{margin:6px 0;}</style>
    </head><body>`;
    html += `<h1>${currentUser} - Einkaufsliste</h1><ul>`;
    items.forEach(i => {
        html += `<li class="item">${i.name} (${i.category}) x${i.count} - ${i.date} ${i.done? '✅':''}</li>`;
    });
    html += `</ul></body></html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
}

function exportAllUsersJSON() {
    let data = JSON.stringify(users, null, 2);
    let blob = new Blob([data], {type: 'application/json'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url; a.download = 'users_backup.json'; a.click();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginBox').style.display = 'block';
    document.getElementById('error').innerText = '';
}

// initialize on load
window.addEventListener('load', ()=>{
    if (currentUser && users[currentUser]) {
        items = users[currentUser].items || [];
        document.getElementById('loginBox').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        applyTheme();
        render();
    }

    // default date input to today
    let d = new Date();
    let iso = d.toISOString().slice(0,10);
    let dateInput = document.getElementById('date');
    if (dateInput) dateInput.value = iso;
});