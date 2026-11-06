# Lab 3: REST API, Query Parameters, Validation & Debugging

**Backend Development Fundamentals (BDF) • Year II Term II**  
**Faculty:** Joel Prashanth D  
**Environment:** Node.js (v24.14.0) | Express.js (v5.3.0) | SQLite (v3.46.1) | Windows 11  

---

## 🌐 Live Deployment & GitHub Repository

- 🚀 **Live API Base URL:** [https://backend-development-3.onrender.com](https://backend-development-3.onrender.com)
- 📚 **GET All Books Endpoint:** [https://backend-development-3.onrender.com/books](https://backend-development-3.onrender.com/books)
- 🔍 **GET Search & Filter Sample:** [https://backend-development-3.onrender.com/books?search_q=java&order_by=price&order=ASC](https://backend-development-3.onrender.com/books?search_q=java&order_by=price&order=ASC)
- 📦 **GitHub Repository:** [https://github.com/mdharmiksatya/Backend-development-3](https://github.com/mdharmiksatya/Backend-development-3)

---

## 1. Student Information

| Field | Details |
| :--- | :--- |
| **Student Name** | M Dharmik Satya |
| **Registration Number** | 252U1R5075 |
| **Section** | 106 AI/DE-1A |
| **Course** | Backend Development Fundamentals |
| **Lab Assignment** | Lab 03 – REST API, Query Parameters, Validation & Debugging |

---

## 2. Project Overview & Objectives

In this lab, the initial CRUD service from Lab 2 is advanced into a production-ready **Book Management RESTful API**.

Key capabilities implemented:
1. **RESTful Resource Naming**: Proper plural noun URIs (`/books`, `/books/:id`) combined with standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
2. **Search, Sorting & Pagination**:
   - Partial title matching with parameterized SQL `LIKE`.
   - Dynamic sorting (`order_by`) guarded by a strict column allowlist (`title`, `author`, `price`, `id`, `pages`).
   - Sorting direction (`order`) validated against `['ASC', 'DESC']`.
   - Offset-based pagination with defaults (`limit=10`, `offset=0`) and a strict maximum limit of `100`.
3. **Price Range Filtering**: Dynamic price filtering supporting `min_price`, `max_price`, and combined bounds via parameterized SQL `BETWEEN`, with full support for floating-point prices (`REAL`).
4. **Strict Input Validation & Schema Handling**:
   - Rejection of missing/empty required fields and non-numeric price inputs with HTTP `400 Bad Request`.
   - Resolution of the `pages NOT NULL` database constraint by allowing optional pages in the request body with a default of `0`.
5. **Database Lifecycle Safety**:
   - Idempotent schema initialization: database records are seeded **only if the table is empty**.
   - Server reboots never reset or drop existing records.
6. **Cloud & Storage Architecture for Render**:
   - Dynamic path resolution supporting `DATABASE_PATH` environment variable for **Render Persistent Disks**.
   - Clear architectural understanding of Render's ephemeral filesystem.
7. **Reliable Postman & Newman Automation**:
   - 21 independent Postman tests featuring dynamic ID chaining (saving the created book ID from `POST` and reusing it in `PUT` and `DELETE`).
   - Automated CLI & JSON test reports generated via **Newman**.
8. **Hands-On Debugging**: Complete diagnosis and resolution documentation for 4 critical backend bugs (`EADDRINUSE`, Wrong Import Path, Table Name Typo, Missing `await`).

---

## 3. Technologies Used

- **Node.js** (v24.14.0): Server-side asynchronous JavaScript runtime.
- **Express.js** (v5.3.0): Minimalist web framework for routing, middleware, and HTTP response handling.
- **SQLite3** (v6.0.1): Embedded disk-based relational database engine.
- **sqlite** (v5.1.1): Promise-based wrapper around `sqlite3` enabling clean `async/await` syntax.
- **Newman** (v6.1.2): Command-line test runner for Postman collections providing automated test execution and reports.
- **Nodemon** (v3.1.14): Development monitor that restarts the server process on code changes.

---

## 4. Project Directory Structure

```text
bd lab-3/
│
├── database/
│   ├── books.db                    # SQLite persistent database file
│   ├── database.js                 # Database connection & idempotent schema initializer
│   └── init_db.sql                 # DDL schema definition and 10 seed book records
│
├── controllers/
│   └── booksController.js          # Business logic, query builders, validation & handlers
│
├── routes/
│   └── books.js                    # Express Router mapping /books REST endpoints
│
├── server.js                       # Application entrypoint, middleware, root and 404 routes
├── run_newman.js                   # Automated test script executing 21 Postman tests via Newman
├── postman_collection.json         # Complete 21-test Postman collection with pm.test assertions
├── newman-report.json              # Automated Newman test execution evidence report
├── package.json                    # Project manifest, dependencies, and npm scripts
├── .gitignore                      # Git exclusion rules for node_modules, logs, and env files
└── README.md                       # Comprehensive lab report and documentation
```

---

## 5. Database Design & Schema

The database file is located at `database/books.db` (or custom path via `process.env.DATABASE_PATH`) and contains the `book` table.

### Table Schema: `book`

```sql
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price REAL NOT NULL,
    pages INTEGER NOT NULL DEFAULT 0
);
```

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for each book |
| `title` | `TEXT` | `NOT NULL` | Title of the book |
| `author` | `TEXT` | `NOT NULL` | Author credit |
| `price` | `REAL` | `NOT NULL` | Book price in INR (supports decimal amounts e.g., ₹499.50) |
| `pages` | `INTEGER` | `NOT NULL DEFAULT 0` | Page count with default of `0` |

### Initial Seed Data (10 Books):
1. **Clean Code** by Robert C. Martin (₹650.0, 464 pages)
2. **The Pragmatic Programmer** by Andrew Hunt, David Thomas (₹720.0, 352 pages)
3. **Design Patterns** by Erich Gamma et al. (₹850.0, 395 pages)
4. **JavaScript: The Good Parts** by Douglas Crockford (₹420.0, 176 pages)
5. **You Don't Know JS Yet** by Kyle Simpson (₹499.0, 278 pages)
6. **Introduction to Algorithms** by Thomas H. Cormen (₹1250.0, 1312 pages)
7. **Structure and Interpretation of Computer Programs** by Harold Abelson, Gerald Jay Sussman (₹950.0, 657 pages)
8. **Refactoring** by Martin Fowler (₹780.0, 448 pages)
9. **Head First Design Patterns** by Eric Freeman, Elisabeth Robson (₹699.0, 694 pages)
10. **Designing Data-Intensive Applications** by Martin Kleppmann (₹890.0, 616 pages)

---

## 6. Detailed Implementation of the 7 Lab Tasks

### Task 1: RESTful Noun Endpoints & HTTP Methods
All routes adhere to strict REST conventions using resource nouns and standard HTTP methods:
- `GET /books`: Retrieve all books (with search, sort, filter, and pagination).
- `GET /books/:id`: Retrieve a specific book by ID.
- `POST /books`: Create a new book.
- `PUT /books/:id`: Update an existing book by ID.
- `DELETE /books/:id`: Delete a book by ID.
- No action verbs (e.g. `/addBook`, `/deleteBook`) are used in route paths.

### Task 2: Advanced Query Parameters on `GET /books`
The endpoint supports 5 query parameters with defaults, validation, and SQL injection protection:
- `search_q`: Partial title matching using parameterized `title LIKE ?` (`%term%`).
- `order_by`: Sort column (default: `title`). Strictly validated against an allowlist: `['title', 'author', 'price', 'id', 'pages']`. Invalid values return `400 Bad Request`.
- `order`: Sort direction (default: `ASC`). Validated against `['ASC', 'DESC']`. Invalid values return `400 Bad Request`.
- `limit`: Number of records returned (default: `10`). Must be an integer between `1` and `100`. Values `< 1` or `> 100` return `400 Bad Request`.
- `offset`: Number of records to skip (default: `0`). Must be a non-negative integer (`>= 0`). Values `< 0` return `400 Bad Request`.

### Task 3: Price-Range Filtering
Supports `min_price` and `max_price` parameters using `REAL` numeric types:
- Minimum price only: `price >= ?` (e.g., `/books?min_price=700`).
- Maximum price only: `price <= ?` (e.g., `/books?max_price=500`).
- Both bounds: `price BETWEEN ? AND ?` (e.g., `/books?min_price=500&max_price=800`).
- Validation: If `min_price > max_price`, the API returns `400 Bad Request` with:
  ```json
  { "message": "Invalid price range. min_price cannot be greater than max_price" }
  ```
- Non-numeric price query parameters return `400 Bad Request`.

### Task 4: POST Body Validation & `pages NOT NULL` Resolution
In `POST /books`:
- Required fields: `title`, `author`, `price`.
- Rejects missing, empty, or non-numeric values with HTTP `400 Bad Request`:
  ```json
  { "message": "Invalid input. Title, author and a numeric price are required." }
  ```
- **Resolving the `pages NOT NULL` Constraint**: In SQLite, the table has `pages INTEGER NOT NULL DEFAULT 0`. If the client submits `pages`, the API validates that it is a non-negative integer; if omitted from the body, it gracefully defaults `pages = 0`. This guarantees full compliance with the faculty's required fields (`title`, `author`, `price`) while maintaining relational integrity.

### Task 5: HTTP Status Codes
Every endpoint responds with semantically correct status codes:
- `200 OK`: Successful retrieval (`GET`), update (`PUT`), and deletion (`DELETE`).
- `201 Created`: Successful book creation (`POST`).
- `400 Bad Request`: Validation failure (malformed body, missing fields, invalid query parameters).
- `404 Not Found`: Target resource not found (nonexistent book ID or undefined endpoint).
- `500 Internal Server Error`: Unexpected server or database exception.

### Task 6: Consistent JSON Responses
Every response conforms to a predictable JSON envelope:
- **Collection Success**:
  ```json
  {
    "message": "Books retrieved successfully",
    "data": [ ... ]
  }
  ```
- **Single Item / Mutation Success**:
  ```json
  {
    "message": "Book created successfully",
    "data": { "id": 11, "title": "Introduction to Java", "author": "James Gosling", "price": 450.0, "pages": 0 }
  }
  ```
- **Error Responses**:
  ```json
  {
    "message": "Book not found"
  }
  ```

### Task 7: Debugging Exercise & Common Problem Fixes

#### 1. `EADDRINUSE` (Port Conflict)
- **Problem**: Running `node server.js` fails with `Error: listen EADDRINUSE: address already in use :::3000`.
- **Root Cause**: Another instance of Node.js or a different local service is already bound to port 3000.
- **Diagnostic Command (Windows)**:
  ```powershell
  netstat -ano | findstr :3000
  ```
- **Solution**:
  Kill the process occupying port 3000 using its PID:
  ```powershell
  taskkill /PID <PID> /F
  ```
  Additionally, write `server.js` to accept a dynamic port from the environment:
  ```javascript
  const PORT = process.env.PORT || 3000;
  ```

#### 2. Wrong Import Path
- **Problem**: Application crashes on startup with `Error: Cannot find module '../controllers/booksController'`.
- **Root Cause**: Typing error in file name or incorrect relative path structure in `require()`.
- **Diagnostic**: Verify directory structure and spelling of files.
- **Solution**:
  Correct the relative path in `routes/books.js`:
  ```javascript
  const booksController = require('../controllers/booksController');
  ```

#### 3. Table Name Typo
- **Problem**: SQLite throws `SQLITE_ERROR: no such table: books`.
- **Root Cause**: The query wrote `FROM books` (plural), but `init_db.sql` created the table named `book` (singular).
- **Diagnostic Command**:
  ```powershell
  sqlite3 database/books.db ".tables"
  ```
- **Solution**:
  Align all SQL queries in `controllers/booksController.js` with the actual schema table name `book`:
  ```javascript
  const sqlQuery = 'SELECT * FROM book WHERE ...';
  ```

#### 4. Missing `await`
- **Problem**: Asynchronous database calls return `Promise { <pending> }` instead of row data, causing routes to return empty objects or hang.
- **Root Cause**: Omitting the `await` keyword before async database operations (`db.all()`, `db.get()`, `db.run()`).
- **Diagnostic**: Logging the query result produces `[object Promise]` rather than the expected rows.
- **Solution**:
  Ensure all asynchronous SQLite calls are prefixed with `await`:
  ```javascript
  const books = await db.all(sqlQuery, queryParams);
  return res.status(200).json({ message: 'Books retrieved successfully', data: books });
  ```

---

## 7. Render Deployment & Storage Architecture

### Understanding SQLite Storage on Render
> [!IMPORTANT]
> **Ephemeral Container Filesystem on Render Free Tier**:  
> Web services hosted on Render's free tier operate within ephemeral Docker containers. Any changes written to the local file system (including `database/books.db`) are saved only within the active container. When the container restarts, sleeps after 15 minutes of inactivity, or redeploys after a git push, the container disk is wiped and rebuilt from the repository commit state.

### Production Solution: Render Persistent Disks
For permanent production persistence with SQLite on Render:
1. Attach a **Render Persistent Disk** in the Render Dashboard (e.g. mounted at `/var/data`).
2. Add an Environment Variable in Render:
   ```env
   DATABASE_PATH=/var/data/books.db
   ```
3. Our application's `database/database.js` dynamically reads `process.env.DATABASE_PATH`:
   ```javascript
   const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'books.db');
   ```
   If `DATABASE_PATH` points to `/var/data/books.db`, all book records, inserts, updates, and deletions permanently survive across all redeployments and container restarts.
4. If no `DATABASE_PATH` is specified, the application falls back safely to `./database/books.db`.

### Render Deployment Configuration & GLIBC Fix
- **Node.js Runtime Pinning**: The project includes a `.node-version` file specifying `22.22.0` and `package.json` `"engines": { "node": "22.22.0" }`. Render reads this to guarantee the runtime is Node.js 22.22.0.
- **GLIBC Compatibility (`GLIBC_2.38 not found`)**:
  Precompiled binaries of `sqlite3` for linux-x64 can be linked against GLIBC 2.38, which is newer than the GLIBC version installed in Render's container base image. To resolve this:
  - **Build Command in Render**: `npm install --build-from-source` (or `npm run build`)
  - **Automated Postinstall**: `package.json` includes a platform-aware rebuild step that compiles `sqlite3` directly from source on Linux environments using the host's native C++ compiler and local GLIBC.
- **Start Command**: `npm start`

### Idempotent Database Bootstrapping
On startup, `initializeDB()` checks:
```javascript
const countResult = await db.get('SELECT COUNT(*) AS count FROM book;');
if (countResult && countResult.count === 0) {
  // Only seed if table is completely empty
}
```
Existing database records are **never reset or overwritten** on server startup.

---

## 8. How to Run the Application & Tests

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
- **Standard Mode**:
  ```bash
  npm start
  ```
- **Development Mode (Auto-Reload)**:
  ```bash
  npm run dev
  ```
The terminal displays:
```text
Database ready. Existing records found: 10
Server is running at http://localhost:3000/
```

### 3. Run Automated Newman Test Suite
```bash
npm test
```
This executes `run_newman.js`, which launches the local test server, runs all 21 Postman test cases through Newman with full assertion verification, prints the terminal summary, generates `newman-report.json`, and shuts down cleanly.

---

## 9. Comprehensive Postman & Newman Test Results (21 Scenarios)

All 21 test scenarios executed via Newman and verified with 42 assertions passing (100% pass rate):

| # | Method | Endpoint & Parameters | Payload | Expected Status | Actual Status | Assertions Verified |
|---|---|---|---|---|---|---|
| **01** | `GET` | `/books` | *None* | `200 OK` | `200 OK` | Status 200, returns non-empty books array |
| **02** | `GET` | `/books?search_q=java` | *None* | `200 OK` | `200 OK` | Status 200, all returned books contain "java" |
| **03** | `GET` | `/books?order_by=price&order=ASC` | *None* | `200 OK` | `200 OK` | Status 200, prices sorted ascending |
| **04** | `GET` | `/books?order_by=price&order=DESC` | *None* | `200 OK` | `200 OK` | Status 200, prices sorted descending |
| **05** | `GET` | `/books?min_price=700` | *None* | `200 OK` | `200 OK` | Status 200, all returned prices >= 700 |
| **06** | `GET` | `/books?max_price=500` | *None* | `200 OK` | `200 OK` | Status 200, all returned prices <= 500 |
| **07** | `GET` | `/books?min_price=500&max_price=800` | *None* | `200 OK` | `200 OK` | Status 200, all prices between 500 and 800 |
| **08** | `GET` | `/books?limit=3&offset=2` | *None* | `200 OK` | `200 OK` | Status 200, exactly 3 records returned |
| **09** | `GET` | `/books/1` | *None* | `200 OK` | `200 OK` | Status 200, returns Clean Code record |
| **10** | `GET` | `/books/999` | *None* | `404 Not Found` | `404 Not Found` | Status 404, message is "Book not found" |
| **11** | `POST` | `/books` | `{"title":"Introduction to Java","author":"James Gosling","price":450}` | `201 Created` | `201 Created` | Status 201, returns created ID, dynamically sets `createdBookId` |
| **12** | `POST` | `/books` | `{"author":"James Gosling","price":450}` | `400 Bad Request` | `400 Bad Request` | Status 400, missing title validation error |
| **13** | `POST` | `/books` | `{"title":"Introduction to Java","price":450}` | `400 Bad Request` | `400 Bad Request` | Status 400, missing author validation error |
| **14** | `POST` | `/books` | `{"title":"Introduction to Java","author":"James Gosling"}` | `400 Bad Request` | `400 Bad Request` | Status 400, missing price validation error |
| **15** | `POST` | `/books` | `{"title":"Introduction to Java","author":"James Gosling","price":"abc"}` | `400 Bad Request` | `400 Bad Request` | Status 400, non-numeric price validation error |
| **16** | `PUT` | `/books/{{createdBookId}}` | `{"title":"Advanced Java Programming","author":"James Gosling","price":550}` | `200 OK` | `200 OK` | Status 200, updates created book dynamically |
| **17** | `PUT` | `/books/999` | `{"title":"Ghost Book","author":"Anonymous","price":300}` | `404 Not Found` | `404 Not Found` | Status 404, message is "Book not found" |
| **18** | `DELETE` | `/books/{{createdBookId}}` | *None* | `200 OK` | `200 OK` | Status 200, deletes created book dynamically |
| **19** | `DELETE` | `/books/999` | *None* | `404 Not Found` | `404 Not Found` | Status 404, message is "Book not found" |
| **20** | `GET` | `/books?min_price=800&max_price=200` | *None* | `400 Bad Request` | `400 Bad Request` | Status 400, min_price > max_price rejected |
| **21** | `GET` | `/invalid-endpoint` | *None* | `404 Not Found` | `404 Not Found` | Status 404, message is "Endpoint not found" |

### Newman Execution Summary
```text
┌─────────────────────────┬─────────────────┬─────────────────┐
│                         │        executed │          failed │
├─────────────────────────┼─────────────────┼─────────────────┤
│              iterations │               1 │               0 │
├─────────────────────────┼─────────────────┼─────────────────┤
│                requests │              21 │               0 │
├─────────────────────────┼─────────────────┼─────────────────┤
│            test-scripts │              21 │               0 │
├─────────────────────────┼─────────────────┼─────────────────┤
│      prerequest-scripts │               0 │               0 │
├─────────────────────────┼─────────────────┼─────────────────┤
│              assertions │              42 │               0 │
├─────────────────────────┴─────────────────┴─────────────────┤
│ total run duration: 1955ms                                  │
├─────────────────────────────────────────────────────────────┤
│ total data received: 5.97kB (approx)                        │
├─────────────────────────────────────────────────────────────┤
│ average response time: 5ms [min: 2ms, max: 27ms, s.d.: 6ms] │
└─────────────────────────────────────────────────────────────┘

✅ All 42 assertions passed across 21 test cases!
Automated Newman JSON report saved to: newman-report.json
```

---

## 10. Viva Voce Questions & Technical Answers

### Q1: Query parameter vs Path parameter?
> **Answer:**  
> - **Path Parameters** (e.g., `/books/:id`) are an essential component of the URL hierarchical path. They identify a specific, singular resource (e.g., `/books/1`). If a path parameter is changed, it points to a fundamentally different resource.
> - **Query Parameters** (e.g., `/books?search_q=java&order_by=price&limit=5`) are optional key-value pairs appended after the `?` delimiter. They are used to filter, sort, search, or paginate a collection of resources without changing the identity of the resource endpoint itself.

### Q2: What does stateless mean in REST?
> **Answer:**  
> In a **stateless** REST architecture, the server retains no client session context between requests. Every single request sent by a client must contain all the contextual information required for the server to process it (such as query parameters, authorization headers, or request payloads). Statelessness enhances scalability because any server instance can handle any incoming request without needing shared in-memory session states.

### Q3: Which status code for bad input vs a missing record?
> **Answer:**  
> - **HTTP 400 Bad Request**: Returned when the client provides malformed syntax, missing required fields (e.g., omitting `title` or `author` in `POST /books`), non-numeric data types where numbers are expected, or illogical query parameter combinations (e.g., `min_price > max_price`).
> - **HTTP 404 Not Found**: Returned when the request syntax is valid, but the target resource cannot be found on the server (e.g., attempting `GET`, `PUT`, or `DELETE` on `/books/999` where ID 999 is not present in the database, or requesting an undefined endpoint).

### Q4: How do parameterized queries prevent SQL injection?
> **Answer:**  
> In parameterized queries (using `?` placeholders), the SQL statement structure is pre-compiled by the database engine before user-supplied parameters are bound. The database engine strictly treats user values as literal data (string, integer, or float), never as executable SQL commands. Even if a user passes `' OR '1'='1`, the database treats it purely as a string value for comparison, completely neutralizing SQL injection vulnerabilities.

### Q5: Why must asynchronous database calls be awaited?
> **Answer:**  
> Relational disk operations in SQLite are asynchronous I/O tasks. If `await` is omitted, JavaScript's asynchronous event loop continues executing subsequent code immediately before the database driver finishes fetching or modifying the records. This leads to sending unresolved `Promise` objects or `undefined` data to the client. Using `await` ensures the route handler halts until the database query completes, returning the real result while keeping the Node.js event loop free to handle other concurrent requests.
