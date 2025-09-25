const express = require('express');
const mariadb = require('mariadb');
const bodyParser = require('body-parser');
const { body, param, validationResult } = require('express-validator');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Database connection pool
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'sample',
  port: 3306,
  connectionLimit: 5
});

// Helper function to query DB
async function queryDB(sql) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(sql);
    return rows;
  } finally {
    if (conn) conn.release();
  }
}
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Sample MariaDB API",
      version: "1.0.0",
      description: "REST-like API with CRUD and Swagger"
    },
    servers: [
      { url: `http://157.245.223.9:${port}` } 
    ]
  },
  apis: ["./server.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of orders
 */
app.get('/orders', async (req, res) => {
  try {
    const rows = await queryDB('SELECT * FROM orders;');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Order created
 */
app.post('/orders',
  body('name').trim().isLength({ min: 1 }).escape(),
  body('quantity').isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, quantity } = req.body;
    try {
      const result = await queryDB('INSERT INTO orders(name, quantity) VALUES (?, ?)', [name, quantity]);
      res.status(201).json({ id: result.insertId, name, quantity });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});
/**
 * @swagger
 * /orders/{id}:
 *   patch:
 *     summary: Update order partially
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Order updated
 */
app.patch('/orders/:id',
  param('id').isInt(),
  body('name').optional().trim().escape(),
  body('quantity').optional().isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, quantity } = req.body;
    const id = req.params.id;
    let updates = [];
    let values = [];
    if (name) { updates.push('name=?'); values.push(name); }
    if (quantity) { updates.push('quantity=?'); values.push(quantity); }
    values.push(id);

    try {
      const result = await queryDB(`UPDATE orders SET ${updates.join(', ')} WHERE id=?`, values);
      res.json({ msg: 'Order updated', affectedRows: result.affectedRows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Replace an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Order replaced
 */
app.put('/orders/:id',
  param('id').isInt(),
  body('name').trim().isLength({ min: 1 }).escape(),
  body('quantity').isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, quantity } = req.body;
    const id = req.params.id;

    try {
      const result = await queryDB('UPDATE orders SET name=?, quantity=? WHERE id=?', [name, quantity, id]);
      res.json({ msg: 'Order replaced', affectedRows: result.affectedRows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted
 */
app.delete('/orders/:id',
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = req.params.id;
    try {
      const result = await queryDB('DELETE FROM orders WHERE id=?', [id]);
      res.json({ msg: 'Order deleted', affectedRows: result.affectedRows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});


app.get('/student', async (req, res) => {
  try {
    const rows = await queryDB('SELECT * FROM student;');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/foods', async (req, res) => {
  try {
    const rows = await queryDB('SELECT * FROM foods;');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Hello from Express + MariaDB API');
});

// Start server
app.listen(port, () => {
  console.log(`Example app listening at http://remoteserver:${port}`);
});
