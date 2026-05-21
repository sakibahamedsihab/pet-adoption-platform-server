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

app.post("/pets", async (req, res) => {
  const newPet = req.body;
  const result = await petsCollection.insertOne(newPet);
  res.json(result);
});

app.get("/pets", async (req, res) => {
  const cursor = petsCollection.find();
  const result = await cursor.toArray();
  res.json(result);
});

app.listen(5000, () => console.log("server running on port: 5000"));
