require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.URI);
let petsCollection = client.db("petAdoption").collection("pets");

let adoptionRequestsCollection = client
  .db("petAdoption")
  .collection("adoptionRequests");

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

app.get("/pets/:id", async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await petsCollection.findOne(query);
  res.json(result);
});

app.put("/pets/:id", async (req, res) => {
  const updatedPet = req.body;
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await petsCollection.updateOne(query, { $set: updatedPet });
  res.json(result);
});

app.delete("/pets/:id", async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await petsCollection.deleteOne(query);
  res.json(result);
});

// adoption requiest

app.post("/adoption-requests", async (req, res) => {
  const newAdoptionReq = req.body;
  newAdoptionReq.status = "pending";
  const result = await adoptionRequestsCollection.insertOne(newAdoptionReq);
  res.json(result);
});

app.get("/adoption-requests", async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const result = await adoptionRequestsCollection.find(query).toArray();
  res.json(result);
});



app.listen(5000, () => console.log("server running on port: 5000"));




