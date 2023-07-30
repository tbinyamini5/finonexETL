const fs = require("fs");
const readline = require("readline");
const path = require("path");
const axios = require("axios");

const filePath = path.join(__dirname, "events.jsonl");
const apiBaseUrl = "http://localhost:8000";

const readStream = fs.createReadStream(filePath);

const rl = readline.createInterface({
  input: readStream,
  crlfDelay: Infinity,
});

async function sendEvent(event) {
  try {
    const headers = {
      Authorization: `secret`,
    };
    const response = await axios.post(`${apiBaseUrl}/liveEvent`, event, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error making API call:", error);
  }
}

// Function to process each line of JSON data
async function processLineAndPost(line) {
  try {
    const event = JSON.parse(line);
    await sendEvent(event);
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
}

rl.on("line", processLineAndPost);

rl.on("close", () => {
  console.log("Finished reading the file.");
});
