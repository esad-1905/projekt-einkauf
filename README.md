# Einkaufsliste Pro

## Kurzanleitung

- Öffne `projekt1.html` im Browser.
- Erstelle einen Account (Benutzername + Passwort) oder melde dich an.
- Nach dem Login kannst du Produkte hinzufügen und Kategorie sowie Einkaufsdatum auswählen.

## Features

- Mehrere Benutzer, jeweils eigene Liste (gespeichert in `localStorage`)
- Produkte: hinzufügen, bearbeiten, löschen, Menge ändern, als gekauft markieren
- Suche nach Name oder Kategorie
- Kategorien: Obst, Gemüse, Getränke, Fleisch, Haushalt, Sonstiges
- Hell-/Dunkelmodus (pro Benutzer gespeichert)
- Import/Export der Liste als JSON (benutzerspezifisch)
- Backup aller Nutzer als `users_backup.json`
- Export als PDF über den Druckdialog

## Dateien

- `projekt1.html` – UI
- `script.js` – Logik, speichert Daten in `localStorage`

## Git

```powershell
cd projekt-einkauf
git add .
git commit -m "Add multi-user features, import/export, PDF, theme, date, categories"
```

## Hinweis


Das Projekt ist rein clientseitig und speichert Daten im Browser (`localStorage`).

