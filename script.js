let users = JSON.parse(localStorage.getItem("users") || "{}");
let currentUser = null;
let items = [];
let password = null;

/* ---------------- LOGIN / REGISTER ---------------- */

function register() {
    let username = document.getElementById("username").value;
    let p1 = document.getElementById("pass1").value;
    let p2 = document.getElementById("pass2").value;

    if (!username || !p1 || p1 !== p2) {
        document.getElementById("error").innerText = "❌ Fehler bei Registrierung";
        return;
    }

    users[username] = {
        password: p1,
        items: []
    };

    localStorage.setItem("users", JSON.stringify(users));

    document.getElementById("error").innerText = "✔ Account erstellt!";
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
    items = users[username].items;

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("app").style.display = "block";

    render();
}

/* ---------------- ADD ITEM ---------------- */

function addItem() {
    let name = document.getElementById("product").value;
    let category = document.getElementById("category").value;

    if (!name) return;

    items.push({
        name,
        category,
        count: 1,
        done: false,
        date: new Date().toLocaleDateString()
    });

    save();
    render();
}

/* ---------------- CHANGE COUNT ---------------- */

function change(i, value) {
    items[i].count += value;

    if (items[i].count <= 0) {
        items.splice(i, 1);
    }

    save();
    render();
}

/* ---------------- TOGGLE DONE ---------------- */

function toggleDone(i) {
    items[i].done = !items[i].done;
    save();
    render();
}

/* ---------------- DELETE ---------------- */

function removeItem(i) {
    items.splice(i, 1);
    save();
    render();
}

/* ---------------- EDIT ---------------- */

function editItem(i) {
    let newName = prompt("Neuer Name:", items[i].name);
    if (newName) {
        items[i].name = newName;
    }
    save();
    render();
}

/* ---------------- SEARCH ---------------- */

function render() {
    let list = document.getElementById("list");
    let search = document.getElementById("search")?.value.toLowerCase() || "";

    list.innerHTML = "";

    items
        .filter(item => item.name.toLowerCase().includes(search))
        .forEach((item, i) => {

        list.innerHTML += `
        <div class="item ${item.done ? "done" : ""}">
            <div>
                <b>${item.name}</b><br>
                <small>${item.category} | ${item.date} | x${item.count}</small>
            </div>

            <div class="controls">
                <button class="blue" onclick="change(${i},1)">+</button>
                <button class="blue" onclick="change(${i},-1)">-</button>
                <button class="green" onclick="toggleDone(${i})">✔</button>
                <button class="gray" onclick="editItem(${i})">✏️</button>
                <button class="red" onclick="removeItem(${i})">🗑</button>
            </div>
        </div>`;
    });

    save();
}

/* ---------------- SAVE ---------------- */

function save() {
    users[currentUser].items = items;
    localStorage.setItem("users", JSON.stringify(users));
}

/* ---------------- THEME ---------------- */

function toggleTheme() {
    document.body.classList.toggle("light");

    if (document.body.classList.contains("light")) {
        document.body.style.background = "#e5e7eb";
        document.body.style.color = "#111";
    } else {
        document.body.style.background = "linear-gradient(135deg, #0f172a, #1e293b)";
        document.body.style.color = "white";
    }
}

/* ---------------- EXPORT JSON ---------------- */

function exportJSON() {
    let data = JSON.stringify(items);
    let blob = new Blob([data], {type: "application/json"});
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "einkaufsliste.json";
    a.click();
}

/* ---------------- IMPORT JSON ---------------- */

function importJSON() {
    let input = document.createElement("input");
    input.type = "file";

    input.onchange = e => {
        let file = e.target.files[0];
        let reader = new FileReader();

        reader.onload = function(event) {
            items = JSON.parse(event.target.result);
            save();
            render();
        };

        reader.readAsText(file);
    };

    input.click();
}

/* ---------------- PDF EXPORT ---------------- */

function exportPDF() {
    let text = items.map(i =>
        `${i.name} (${i.category}) x${i.count}`
    ).join("\n");

    let blob = new Blob([text], {type: "application/pdf"});
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "einkaufsliste.pdf";
    a.click();
}