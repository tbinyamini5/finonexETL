const fs = require("fs").promises;
const path = require("path");
const { Pool } = require("pg");

const ADD_EVENT_NAME = "add_revenue";
const SUBSTRACT_EVENT_NAME = "subtract_revenue";

const dataFilePath = path.join(__dirname, "data.json");

// DB init
async function initDB() {
  try {
    const sqlFilePath = path.join(__dirname, "db.sql");
    const sqlFileContents = await fs.readFile(sqlFilePath, "utf8");

    await pool.query(sqlFileContents);

    console.log("SQL file executed successfully.");
  } catch (error) {
    console.error("Error executing SQL file:", error);
  }
}

const pool = new Pool({
  user: "user",
  host: "localhost",
  database: "db",
  password: "pass",
  port: 5432,
});

(async function () {
  try {
    await initDB();
    console.log("DB was initialized successfully");
  } catch (error) {
    console.error("Error initializing the DB: ", error);
  }
})();

// FS functions
async function readDataFile() {
  try {
    const dataFile = await fs.readFile(dataFilePath);
    const jsonDataFile = JSON.parse(dataFile);
    return jsonDataFile;
  } catch (error) {
    console.error("Error reading the file:", error);
  }
}

// DB functions
async function readRevenueByUserId(userId) {
  try {
    const res = await pool.query(
      `SELECT revenue
    FROM users_revenue
    WHERE user_id = $1`,
      [userId]
    );

    // Check if a row was found
    if (res.rowCount === 0) {
      return 0;
    }

    return res.rows[0];
  } catch (error) {
    console.error(
      `Error while reading revenue for user ${userId} from database: `,
      error
    );
    throw error;
  }
}

async function upsertUserRevenue(userId, revenue) {
  try {
    const { revenue: persistedRevenue } = await readRevenueByUserId(userId);
    const newRevenue = persistedRevenue + revenue;

    await pool.query(
      `INSERT INTO users_revenue (user_id, revenue) 
    VALUES ($1, $2) ON CONFLICT (user_id) 
    DO UPDATE SET revenue = $2;`,
      [userId, newRevenue]
    );
  } catch (error) {
    console.error(
      `Error while upserting revenue for user ${userId} in database: `,
      error
    );
    throw error;
  }
}

// Util functions
function calculateRevenuePerUser(data) {
  if (!data) {
    return;
  }
  
  return data.reduce((acc, item) => {
    const { userId, value, name } = item;
    const currentRevenue = acc.get(userId) || 0;
    const calculatedRevenue =
      name === ADD_EVENT_NAME
        ? currentRevenue + value
        : name === SUBSTRACT_EVENT_NAME
        ? currentRevenue - value
        : currentRevenue;
    acc.set(userId, calculatedRevenue);
    return acc;
  }, new Map());
}

function updateUsersRevenues(revenuePerUserMap) {
  for (const [userId, totalRevenue] of revenuePerUserMap) {
    upsertUserRevenue(userId, totalRevenue);
  }
}

// Execution
(async function () {
  try {
    const data = await readDataFile();
    const revenuePerUserMap = calculateRevenuePerUser(data);
    updateUsersRevenues(revenuePerUserMap);
  } catch (error) {
    console.error("Eror calculating the revenue", error);
  }
})();
