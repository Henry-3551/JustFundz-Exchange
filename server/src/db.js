const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params)
};
