require("dotenv").config();

const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://pet-adoption-client-rho.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

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

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "10h" });

  res.send({ token });
});

app.post("/logout", async (req, res) => {
  res.send({ success: true });
});

app.get("/", async (req, res) => {
  res.send("server's main route");
});

// --- Pets Routes ---

app.post("/pets", verifyToken, async (req, res) => {
  const newPet = req.body;
  const result = await petsCollection.insertOne(newPet);
  res.json(result);
});

// Public: Get all pets (Search & Filter)
app.get("/pets", async (req, res) => {
  const { search, species, email } = req.query;
  let query = {};

  if (search) {
    query.petName = { $regex: search, $options: "i" };
  }

  if (species && species !== "All Species") {
    query.species = { $in: [species] };
  }

  if (email) {
    query.ownerEmail = email;
  }

  const cursor = petsCollection.find(query);
  const result = await cursor.toArray();
  res.json(result);
});

// Public: Get single pet details
app.get("/pets/:id", async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await petsCollection.findOne(query);
  res.json(result);
});

// Protected: Update a pet
app.put("/pets/:id", verifyToken, async (req, res) => {
  const updatedPet = req.body;
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await petsCollection.updateOne(query, { $set: updatedPet });
  res.json(result);
});

// Protected: Delete a pet
app.delete("/pets/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await petsCollection.deleteOne(query);
  res.json(result);
});

// --- Adoption Request Routes ---

// Protected: Submit adoption request
app.post("/adoption-requests", verifyToken, async (req, res) => {
  const newAdoptionReq = req.body;
  newAdoptionReq.status = "pending";
  const result = await adoptionRequestsCollection.insertOne(newAdoptionReq);
  res.json(result);
});

// Protected: Get requests (My requests)
app.get("/adoption-requests", verifyToken, async (req, res) => {
  const { email, petId } = req.query;
  let query = {};

  if (email) query.email = email;
  if (petId) query.petId = petId;

  const result = await adoptionRequestsCollection.find(query).toArray();
  res.json(result);
});

// Protected: Update request status (Approve/Reject)
app.patch("/adoption-requests/:id", verifyToken, async (req, res) => {
  const { status, petId } = req.body;
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };

  const result = await adoptionRequestsCollection.updateOne(query, {
    $set: { status: status },
  });

  if (status === "approved") {
    const petQuery = { _id: new ObjectId(petId) };
    await petsCollection.updateOne(petQuery, {
      $set: { adopted: true },
    });
  }
  res.json(result);
});

// Protected: Cancel a request
app.delete("/adoption-requests/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await adoptionRequestsCollection.deleteOne(query);
  res.json(result);
});

app.listen(5000, () => console.log("server running on port: 5000"));
