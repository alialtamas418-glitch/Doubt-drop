# ✦ DoubtDrop — Full-Stack Java College Project

**DoubtDrop** is a responsive, anonymous academic Q&A platform for college students and faculty. Students can ask doubts without fear of judgment, upvote common questions to highlight confusion, and track verified explanations from professors using unique 6-digit tracking codes.

---

## 🚀 Key Features

- **100% Anonymous Submissions**: No student names, emails, or roll numbers requested or recorded.
- **Unique Tracking Codes**: Instant code generation (`DD-XXXXXX`) with one-click clipboard copying.
- **Interactive Community Feed**: Live search with debounce, subject filtering (Java, DSA, DBMS, OS, Math, Web, etc.), status filtering, and trending sort.
- **Helpful Upvotes**: Upvote questions you share, with local browser persistence.
- **Instructor / Teacher Portal**:
  - Protected endpoints using Spring Security HTTP Basic authentication.
  - Interactive Teacher Login modal with one-click demo credentials autofill.
  - Inline response editor directly on doubt cards (no need to copy numeric IDs).
  - Status management (`PENDING`, `ANSWERED`, `RESOLVED`) and moderation/delete capability.
- **"My Doubts" Drawer**: Saves questions you asked or tracked in local storage for quick access.
- **Live Campus Stats Ribbon**: Real-time counter of total questions, resolved doubts, pending questions, and community upvotes.
- **Dark & Light Mode**: Seamless theme switching with system preference detection and local persistence.
- **Dual Database Architecture**:
  - **Embedded H2 (Default)**: Zero configuration required! Persists data automatically in `./data/doubtdrop_db`.
  - **H2 Web Console**: Inspect database tables and execute SQL at `http://localhost:8080/h2-console`.
  - **MySQL Support**: Switch effortlessly using the `mysql` Spring profile.
- **Demo Seed Data**: Preloaded on startup with 6 realistic college questions across key computer science subjects.

---

## 🛠️ Tech Stack & Requirements

- **Java**: JDK 21 (LTS)
- **Framework**: Spring Boot 3.5.0
- **Data & Persistence**: Spring Data JPA, Hibernate, H2 Database (File-based), MySQL Connector J
- **Security**: Spring Security (Role-based HTTP Basic)
- **Frontend**: Responsive HTML5, Modern CSS custom properties (light & dark mode), Vanilla JavaScript (ES6+)

---

## ⚡ How to Run Locally

### Option 1: Run with Maven (Recommended)
```bash
mvn spring-boot:run
```

### Option 2: Run pre-built JAR
```bash
java -jar target/doubtdrop-1.0.0.jar
```

Once started, open your web browser at:
👉 **`http://localhost:8080`**

---

## 👨‍🏫 Instructor / Admin Credentials

| Parameter | Value |
|---|---|
| **Username** | `teacher` |
| **Password** | `ChangeMe123!` |

Click **👨‍🏫 Teacher Portal** in the navigation bar and click **Fill Demo** to log in instantly. Once logged in, you can answer, change status, or delete questions directly from the feed.

---

## 🗄️ Database & H2 Console

The application creates and persists data in the `./data/` folder automatically.

To inspect the database in your browser:
1. Open **`http://localhost:8080/h2-console`**
2. Enter:
   - **JDBC URL**: `jdbc:h2:file:./data/doubtdrop_db`
   - **User Name**: `sa`
   - **Password**: *(leave blank)*
3. Click **Connect** to query tables (`DOUBTS`).

### Running with MySQL (Optional)
If you have MySQL running locally:
1. Ensure MySQL is running on port 3300 or 3306.
2. Run with the MySQL profile:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=mysql
   ```
   Or set environment variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/doubts` | List doubts (supports `?subject=`, `?status=`, `?q=`, `?sort=`) | Public |
| `GET` | `/api/doubts/stats` | Summary statistics (total, answered, votes, subject counts) | Public |
| `POST` | `/api/doubts` | Submit anonymous doubt `{ subject, title, details, topic }` | Public |
| `GET` | `/api/doubts/{code}` | Track doubt by code (e.g. `DD-482910`) | Public |
| `POST` | `/api/doubts/{id}/vote` | Increment helpful upvote count | Public |
| `POST` | `/api/admin/doubts/{id}/answer` | Post teacher answer `{ "answer": "..." }` | Instructor (`ADMIN`) |
| `PATCH` | `/api/admin/doubts/{id}/status?value=RESOLVED` | Update resolution status | Instructor (`ADMIN`) |
| `DELETE` | `/api/admin/doubts/{id}` | Delete inappropriate or spam doubt | Instructor (`ADMIN`) |
