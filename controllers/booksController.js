const { getDB } = require('../database/database');

// Allowed sort columns for SQL safety (allowlist strictly prevents SQL injection)
const ALLOWED_ORDER_BY = ['title', 'author', 'price', 'id', 'pages'];
const ALLOWED_ORDER_DIR = ['ASC', 'DESC'];

/**
 * Task 1, 2, 3: GET /books
 * Supports search_q, min_price, max_price, order_by, order, limit (max 100), offset
 */
const getAllBooks = async (req, res) => {
  try {
    const db = getDB();
    const {
      search_q,
      order_by = 'title',
      order = 'ASC',
      limit = '10',
      offset = '0',
      min_price,
      max_price,
    } = req.query;

    // 1. Validate order_by against strict allowlist
    const normalizedOrderBy = String(order_by).toLowerCase();
    if (!ALLOWED_ORDER_BY.includes(normalizedOrderBy)) {
      return res.status(400).json({
        message: `Invalid order_by parameter. Allowed values: ${ALLOWED_ORDER_BY.join(', ')}`,
      });
    }

    // 2. Validate order direction against strict allowlist
    const normalizedOrderDir = String(order).toUpperCase();
    if (!ALLOWED_ORDER_DIR.includes(normalizedOrderDir)) {
      return res.status(400).json({
        message: 'Invalid order parameter. Allowed values: ASC, DESC',
      });
    }

    // 3. Validate pagination parameters with maximum limit of 100
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
      return res.status(400).json({
        message: 'Invalid limit parameter. Limit must be an integer between 1 and 100.',
      });
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: 'Invalid offset parameter. Offset must be a non-negative integer.',
      });
    }

    // 4. Validate price filters (supports REAL decimal numbers)
    let parsedMinPrice = null;
    let parsedMaxPrice = null;

    if (min_price !== undefined) {
      parsedMinPrice = parseFloat(min_price);
      if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
        return res.status(400).json({
          message: 'Invalid min_price parameter. min_price must be a non-negative number.',
        });
      }
    }

    if (max_price !== undefined) {
      parsedMaxPrice = parseFloat(max_price);
      if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
        return res.status(400).json({
          message: 'Invalid max_price parameter. max_price must be a non-negative number.',
        });
      }
    }

    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return res.status(400).json({
        message: 'Invalid price range. min_price cannot be greater than max_price',
      });
    }

    // 5. Construct parameterized SQL query
    const whereConditions = [];
    const queryParams = [];

    // Partial title match with SQL LIKE
    if (search_q && search_q.trim() !== '') {
      whereConditions.push('title LIKE ?');
      queryParams.push(`%${search_q.trim()}%`);
    }

    // Price range filters (REAL)
    if (parsedMinPrice !== null && parsedMaxPrice !== null) {
      whereConditions.push('price BETWEEN ? AND ?');
      queryParams.push(parsedMinPrice, parsedMaxPrice);
    } else if (parsedMinPrice !== null) {
      whereConditions.push('price >= ?');
      queryParams.push(parsedMinPrice);
    } else if (parsedMaxPrice !== null) {
      whereConditions.push('price <= ?');
      queryParams.push(parsedMaxPrice);
    }

    let sqlQuery = 'SELECT * FROM book';
    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Sorting (strictly allowlisted column and direction)
    sqlQuery += ` ORDER BY ${normalizedOrderBy} ${normalizedOrderDir}`;

    // Pagination (parameterized)
    sqlQuery += ' LIMIT ? OFFSET ?;';
    queryParams.push(parsedLimit, parsedOffset);

    const books = await db.all(sqlQuery, queryParams);

    return res.status(200).json({
      message: 'Books retrieved successfully',
      data: books,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error while retrieving books',
      error: error.message,
    });
  }
};

/**
 * Task 1, 5: GET /books/:id
 * Retrieve a specific book by ID
 */
const getBookById = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const bookId = parseInt(id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: 'Invalid book ID format. ID must be a positive integer.',
      });
    }

    const book = await db.get('SELECT * FROM book WHERE id = ?;', [bookId]);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    return res.status(200).json({
      message: 'Book retrieved successfully',
      data: book,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error while retrieving book',
      error: error.message,
    });
  }
};

/**
 * Task 1, 4, 5: POST /books
 * Create a new book with input validation and default handling for pages NOT NULL
 */
const createBook = async (req, res) => {
  try {
    const db = getDB();
    const { title, author, price, pages } = req.body;

    // Body Validation
    const isTitleValid = typeof title === 'string' && title.trim().length > 0;
    const isAuthorValid = typeof author === 'string' && author.trim().length > 0;
    const isPriceNumeric =
      price !== undefined &&
      price !== null &&
      price !== '' &&
      !isNaN(Number(price)) &&
      Number(price) >= 0;

    if (!isTitleValid || !isAuthorValid || !isPriceNumeric) {
      return res.status(400).json({
        message: 'Invalid input. Title, author and a numeric price are required.',
      });
    }

    // Resolve pages NOT NULL: require valid integer if provided, otherwise default to 0
    let parsedPages = 0;
    if (pages !== undefined && pages !== null && pages !== '') {
      parsedPages = parseInt(pages, 10);
      if (isNaN(parsedPages) || parsedPages < 0) {
        return res.status(400).json({
          message: 'Invalid pages parameter. Pages must be a non-negative integer.',
        });
      }
    }

    const numericPrice = parseFloat(price);

    const insertQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    const result = await db.run(insertQuery, [
      title.trim(),
      author.trim(),
      numericPrice,
      parsedPages,
    ]);

    const createdBook = {
      id: result.lastID,
      title: title.trim(),
      author: author.trim(),
      price: numericPrice,
      pages: parsedPages,
    };

    return res.status(201).json({
      message: 'Book created successfully',
      data: createdBook,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error while creating book',
      error: error.message,
    });
  }
};

/**
 * Task 1, 5: PUT /books/:id
 * Update an existing book with input validation
 */
const updateBook = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const bookId = parseInt(id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: 'Invalid book ID format. ID must be a positive integer.',
      });
    }

    // Check if book exists
    const existingBook = await db.get('SELECT * FROM book WHERE id = ?;', [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    const { title, author, price, pages } = req.body;

    // Validation
    const isTitleValid = typeof title === 'string' && title.trim().length > 0;
    const isAuthorValid = typeof author === 'string' && author.trim().length > 0;
    const isPriceNumeric =
      price !== undefined &&
      price !== null &&
      price !== '' &&
      !isNaN(Number(price)) &&
      Number(price) >= 0;

    if (!isTitleValid || !isAuthorValid || !isPriceNumeric) {
      return res.status(400).json({
        message: 'Invalid input. Title, author and a numeric price are required.',
      });
    }

    let parsedPages = existingBook.pages;
    if (pages !== undefined && pages !== null && pages !== '') {
      parsedPages = parseInt(pages, 10);
      if (isNaN(parsedPages) || parsedPages < 0) {
        return res.status(400).json({
          message: 'Invalid pages parameter. Pages must be a non-negative integer.',
        });
      }
    }

    const numericPrice = parseFloat(price);

    const updateQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;

    await db.run(updateQuery, [
      title.trim(),
      author.trim(),
      numericPrice,
      parsedPages,
      bookId,
    ]);

    const updatedBook = {
      id: bookId,
      title: title.trim(),
      author: author.trim(),
      price: numericPrice,
      pages: parsedPages,
    };

    return res.status(200).json({
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error while updating book',
      error: error.message,
    });
  }
};

/**
 * Task 1, 5: DELETE /books/:id
 * Delete an existing book
 */
const deleteBook = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const bookId = parseInt(id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: 'Invalid book ID format. ID must be a positive integer.',
      });
    }

    // Check if book exists
    const existingBook = await db.get('SELECT * FROM book WHERE id = ?;', [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    await db.run('DELETE FROM book WHERE id = ?;', [bookId]);

    return res.status(200).json({
      message: 'Book deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error while deleting book',
      error: error.message,
    });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
