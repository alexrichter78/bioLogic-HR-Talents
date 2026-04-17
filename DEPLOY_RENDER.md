# Deploy auf Render — bioLogic

Diese Anleitung beschreibt, wie du die App bei Render hostest und unter `www.mybiologic.de` erreichbar machst.

## 1. Code zu GitHub bringen

Render zieht den Code aus einem Git-Repository. Push den aktuellen Stand in ein GitHub-Repo (z. B. `mybiologic/biologic-app`).

## 2. Blueprint bei Render anlegen

1. Bei [Render](https://dashboard.render.com) anmelden.
2. **New → Blueprint** auswählen.
3. Das GitHub-Repo verbinden.
4. Render erkennt automatisch die Datei `render.yaml` und schlägt vor:
   - 1× Web Service `biologic` (Node, Region Frankfurt)
   - 1× PostgreSQL `biologic-db` (Plan basic-256mb)
5. **Apply** klicken.

## 3. Geheime Werte (Secrets) setzen

Während des Blueprint-Deploys fragt Render dich nach den Werten, die in `render.yaml` als `sync: false` markiert sind. Trage sie ein:

| Variable | Wert |
|---|---|
| `ADMIN_PASSWORD` | Passwort für den Admin-Login (mind. 12 Zeichen) |
| `ANTHROPIC_API_KEY` | Dein Claude-Key (Louis-KI) |
| `OPENAI_API_KEY` | Dein OpenAI-Key (Bilder, Audio, Fallback) |
| `RESEND_API_KEY` | (Optional) für Versand von E-Mails |
| `ZAPIER_WEBHOOK_ENROLL` | (Optional) für Kursanmeldung-Webhook |

Andere Werte (`DATABASE_URL`, `SESSION_SECRET`, `APP_URL`, `NODE_ENV`) setzt Render automatisch.

## 4. Erstes Deployment abwarten

Render baut jetzt:
1. `npm ci` — Pakete installieren
2. `npm run build` — Frontend (Vite) + Server (esbuild) bauen
3. `npm run db:push -- --force` — Datenbank-Tabellen anlegen (inkl. `pinned`-Spalte)
4. `npm start` — Server starten auf Port 10000

Beim ersten Start legt `seedAdmin()` automatisch den Admin-User an und seedet die Knowledge-Dokumente, Golden Answers und Coach-Topics.

Wenn `/health` auf grün steht, ist der Service live unter `https://biologic.onrender.com`.

## 5. Custom Domain `www.mybiologic.de`

1. Im Render-Dashboard: Service `biologic` → **Settings → Custom Domains → Add Custom Domain**.
2. `www.mybiologic.de` eintragen → Render zeigt dir einen CNAME-Wert (z. B. `biologic.onrender.com`).
3. Bei deinem Domain-Provider (z. B. IONOS, Strato, Cloudflare) einen DNS-Eintrag setzen:
   - **Typ:** CNAME
   - **Host/Name:** `www`
   - **Wert/Ziel:** der von Render angezeigte Hostname
4. Optional zusätzlich für die nackte Domain:
   - Bei Render auch `mybiologic.de` als Custom Domain hinzufügen
   - DNS-Eintrag: A-Record auf die von Render gezeigte IP, oder ALIAS/ANAME falls dein Provider das unterstützt.
5. Render holt automatisch ein Let's-Encrypt-Zertifikat. Sobald die DNS-Propagation durch ist (meist 5–30 Min), ist die Seite unter HTTPS erreichbar.

## 6. Erster Login

- URL: `https://www.mybiologic.de/login`
- Benutzername: `admin`
- Passwort: das in Schritt 3 gesetzte `ADMIN_PASSWORD`

## Updates später

`autoDeploy: true` ist gesetzt. Jeder Push auf den `main`-Branch triggert automatisch einen neuen Build + Deploy.
