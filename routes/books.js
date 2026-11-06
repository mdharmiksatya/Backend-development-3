const express = require('express');
const router = express.Router();
const booksController = require('../controllers/booksController');

// GET /books - Retrieve all books (supports query parameters)
router.get('/', booksController.getAllBooks);

// GET /books/:id - Retrieve a particular book by ID
router.get('/:id', booksController.getBookById);

// POST /books - Add a new book (with body validation)
router.post('/', booksController.createBook);

// PUT /books/:id - Update an existing book (with body validation)
router.put('/:id', booksController.updateBook);

// DELETE /books/:id - Delete a book by ID
router.delete('/:id', booksController.deleteBook);

module.exports = router;
