const express = require('express');
const { initializeDB } = require('./database/database');
const booksRouter = require('./routes/books');

const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Mount Book Management REST API routes
app.use('/books', booksRouter);

// Root route - Student Information & API Overview
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'BDF Lab 3: REST API, Query Parameters, Validation & Debugging',
    student: {
      name: 'M Dharmik Satya',
      registrationNumber: '252U1R5075',
      section: '106 AI/DE-1A',
      faculty: 'Joel Prashanth D',
    },
    status: 'Server and Database Active',
    supportedFeatures: [
      'Partial title search (search_q via SQL LIKE)',
      'Column sorting (order_by: title, author, price, id, pages)',
      'Sorting direction (order: ASC, DESC)',
      'Price range filtering (min_price, max_price via SQL BETWEEN / conditions)',
      'Pagination (limit, offset)',
      'Strict input validation (title, author, numeric price)',
      'Standard HTTP status codes (200, 201, 400, 404, 500)',
      'Consistent JSON responses',
    ],
    endpoints: [
      {
        method: 'GET',
        endpoint: '/books',
        description: 'Retrieve all books (supports search_q, min_price, max_price, order_by, order, limit, offset)',
      },
      {
        method: 'GET',
        endpoint: '/books/:id',
        description: 'Retrieve a specific book by ID',
      },
      {
        method: 'POST',
        endpoint: '/books',
        description: 'Create a new book with input validation',
      },
      {
        method: 'PUT',
        endpoint: '/books/:id',
        description: 'Update an existing book by ID',
      },
      {
        method: 'DELETE',
        endpoint: '/books/:id',
        description: 'Delete a book by ID',
      },
    ],
  });
});

// 404 Catch-All Handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global 500 Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
  });
});

const PORT = process.env.PORT || 3000;

// Initialize Database connection and launch server if executed directly
if (require.main === module) {
  (async () => {
    try {
      await initializeDB();
      app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}/`);
      });
    } catch (error) {
      console.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    }
  })();
}

module.exports = app;
