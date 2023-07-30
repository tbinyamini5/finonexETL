const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const { Pool } = require("pg");
const Queue = require("bull");

const app = express();
const port = 8000;
const dataFilePath = path.join(__dirname, "data.json");

const queue = new Queue("data-processing", {
  redis: {
    host: "localhost",
    port: 6379,
  },
});

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

// App middlewares
app.use(express.json());

function checkAuthorization(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || authorizationHeader !== "secret") {
    return res.status(401).json({
      message: "Unauthorized. Missing or invalid authorization header.",
    });
  }

  next();
}

// Logic
const appendDataToFile = async (jsonData) => {
  let fileData;
  try {
    try {
      fileData = await fs.readFile(dataFilePath);
      // If the file doesn't exist, create it with an empty array
    } catch (error) {
      console.error("Error reading the file:", error);
      if (error.code === "ENOENT") {
        try {
          fileData = "[]";
        } catch (error) {
          console.error("Error creating the file");
        }
      }
    }
    const jsonFileData = JSON.parse(fileData);
    jsonFileData.push(jsonData);
    let updatedJson = JSON.stringify(jsonFileData, null, 2);
    fs.writeFile(dataFilePath, updatedJson);
  } catch (error) {
    console.error("Error writing to the file:", error);
    return;
  }
};

// Queue processing
queue.process(async (job) => {
  try {
    const jsonData = job.data.requestData;
    console.log({ jsonData });
    await appendDataToFile(job.data.requestData);
  } catch (error) {
    console.error("Error updating data:", error);
  }
});

// App routes
app.post("/liveEvent", checkAuthorization, async (req, res) => {
  const jsonData = req.body;
  queue.add({ requestData: jsonData });
  console.log(jsonData);
  const x = await queue.getJobs();
  console.log(x);
  // appendDataToFile(jsonData);
  return res.status(200).json({ message: "OK" });
});

app.get("/userEvents/:userid", checkAuthorization, async (req, res) => {
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

  const result = await readRevenueByUserId(req.params.userid);
  return res.json(result);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
