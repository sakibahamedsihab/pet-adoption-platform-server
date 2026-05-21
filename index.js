require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.URI);
let petsCollection = client.db("petAdoption").collection("pets");

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.log(err);
  }
}
run();

app.get("/", async (req, res) => {
  res.send("server's main route");
});

app.listen(5000, () => console.log("server running on port: 5000"));
