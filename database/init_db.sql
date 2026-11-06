-- Database Schema and Seed Script for Book Management API
-- BDF Lab 03 - Faculty: Joel Prashanth D
-- Student: M Dharmik Satya (252U1R5075)

-- Create 'book' table if it does not already exist
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price REAL NOT NULL,
    pages INTEGER NOT NULL DEFAULT 0
);

-- Seed with the 10 standard computer science books from Lab 2
INSERT INTO book (title, author, price, pages) VALUES ('Clean Code', 'Robert C. Martin', 650.0, 464);
INSERT INTO book (title, author, price, pages) VALUES ('The Pragmatic Programmer', 'Andrew Hunt, David Thomas', 720.0, 352);
INSERT INTO book (title, author, price, pages) VALUES ('Design Patterns', 'Erich Gamma et al.', 850.0, 395);
INSERT INTO book (title, author, price, pages) VALUES ('JavaScript: The Good Parts', 'Douglas Crockford', 420.0, 176);
INSERT INTO book (title, author, price, pages) VALUES ('You Don''t Know JS Yet', 'Kyle Simpson', 499.0, 278);
INSERT INTO book (title, author, price, pages) VALUES ('Introduction to Algorithms', 'Thomas H. Cormen', 1250.0, 1312);
INSERT INTO book (title, author, price, pages) VALUES ('Structure and Interpretation of Computer Programs', 'Harold Abelson, Gerald Jay Sussman', 950.0, 657);
INSERT INTO book (title, author, price, pages) VALUES ('Refactoring', 'Martin Fowler', 780.0, 448);
INSERT INTO book (title, author, price, pages) VALUES ('Head First Design Patterns', 'Eric Freeman, Elisabeth Robson', 699.0, 694);
INSERT INTO book (title, author, price, pages) VALUES ('Designing Data-Intensive Applications', 'Martin Kleppmann', 890.0, 616);
