import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());
const client = new MongoClient(process.env.MONGO_DB_URI);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();

const db = mongoClient.db("wanderlust");
const destinationCollection = db.collection("destination");
const bookingCollection = db.collection("bookings-destination");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  try {
    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
    );
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (err) {
    return res.status(401).send({ message: "Invalid token" });
  }
};

app.get("/", (req, res) => {
  res.send({ message: "Server is running display" });
});

app.get("/destinations", async (req, res) => {
  const result = await destinationCollection.find().toArray();
  res.send(result);
});

app.get("/feture-destinations", async (req, res) => {
  const result = await destinationCollection.find().limit(5).toArray();
  res.send(result);
});

app.get("/destination/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await destinationCollection.findOne(query);
  res.send(result);
});

app.post("/add-destination", verifyToken, async (req, res) => {
  const data = req.body;
  const result = await destinationCollection.insertOne(data);
  res.send(result);
});

app.patch("/destination/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const data = req.body;
  const updateDoc = {
    $set: data,
  };
  const result = await destinationCollection.updateOne(filter, updateDoc);
  res.json(result);
});

app.delete("/destination/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await destinationCollection.deleteOne(query);
  res.json(result);
});

app.get("/booking/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const result = await bookingCollection.find(query).toArray();
  res.send(result);
});

app.post("/booking", verifyToken, async (req, res) => {
  const data = req.body;
  const result = await bookingCollection.insertOne(data);
  res.send(result);
});

app.delete("/booking/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: id };
  const result = await bookingCollection.deleteOne(query);
  res.send(result);
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

export default app;
