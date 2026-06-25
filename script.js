let password = localStorage.getItem("password");
let items = JSON.parse(localStorage.getItem("items") || "[]");

/* REGISTER */
function register() {
    let p1 = document.getElementById("pass1").value;
    let p2 = document.getElementById("pass2").value;

    if (p1 === "" || p1 !== p2) {
        document.getElementById("error").innerText = "❌ Passwörter stimmen nicht!";
        return;
    }

    localStorage.setItem("password", p1);
    password = p1;
    document.getElementById("error").innerText = "✔ Passwort erstellt!";
}

/* LOGIN */
function login() {
    let input = document.getElementById("loginPass").value;

    if (input === password) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("app").style.display = "block";
        render();
    } else {
        document.getElementById("error").innerText = "❌ Falsches Passwort!";
    }
}

/* ADD ITEM */
function addItem() {
    let val = document.getElementById("product").value;
    if (val === "") return;

    items.push({ name: val, count: 1 });
    save();
    render();
}

/* + / - */
function change(index, value) {
    items[index].count += value;
    if (items[index].count <= 0) {
        items.splice(index, 1);
    }
    save();
    render();
}

/* SAVE */
function save() {
    localStorage.setItem("items", JSON.stringify(items));
}

/* RENDER */
function render() {
    let list = document.getElementById("list");
    list.innerHTML = "";

    items.forEach((item, i) => {
        list.innerHTML += `
        <div class="item">
            <div>${item.name} (x${item.count})</div>
            <div class="controls">
                <button class="blue" onclick="change(${i}, 1)">+</button>
                <button class="red" onclick="change(${i}, -1)">-</button>
            </div>
        </div>`;
    });
}

