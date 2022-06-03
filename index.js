const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yhyer.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Varify Token
function verifyJWT (req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
}


async function run () {
    try {
        await client.connect();
        console.log("database connected");

        // database collections
        const toolCollection = client.db('tools-manufacturer').collection('tools');
        const userCollection = client.db('tools-manufacturer').collection('users');
        const orderCollection = client.db('tools-manufacturer').collection('orders');
        const reviewCollection = client.db('tools-manufacturer').collection('reviews');
        const paymentCollection = client.db('tools-manufacturer').collection('payments');

        // api for getting all users
        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        // api for making an user an admin
        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        // api for checking if an user is an admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        });

        // api for updating user
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ result, token });
        });

        // api for deleting an user
        app.delete('/user/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await userCollection.deleteOne(filter);
            res.send(result);
        });

        // api for getting all tools
        app.get('/tool', async (req, res) => {
            const tools = await toolCollection.find().toArray();
            res.send(tools);
        });

        // api for adding a tool
        app.post("/tool", async (req, res) => {
            const tool = req.body;
            const result = await toolCollection.insertOne(tool);
            res.send({ success: 'Tool added' });
        });

        // api for deleting a tool
        app.delete('/tool/:id', async (req, res) => {
            const toolId = req.params.id;
            const filter = { _id: ObjectId(toolId) };
            const result = await toolCollection.deleteOne(filter);
            res.send(result);
        });

        // api for getting all reviews
        app.get('/review', async (req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        });

        // api for adding a review
        app.post("/review", async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            console.log("Review added");
            res.send({ success: 'Tool added' });
        });


        // REST API for order
        app.get('/order', async (req, res) => {
            const customerEmail = req.query.customerEmail;
            // const decodedEmail = req.decoded.email;
            // if (patient === decodedEmail) {
            const query = { customerEmail: customerEmail };
            const orders = await orderCollection.find(query).toArray();
            return res.send(orders);
            // }
            // else {
            // return res.status(403).send({ message: 'forbidden access' });
            // }
        });
        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            };

            const result = await paymentCollection.insertOne(payment);
            const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
            res.send(updatedOrder);
        });

        app.delete('/order/:id', async (req, res) => {
            const orderId = req.params.id;
            const filter = { _id: ObjectId(orderId) };
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        });

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            return res.send({ success: true, result });
        });



        app.get('/allOrder', async (req, res) => {
            const orders = await orderCollection.find().toArray();
            return res.send(orders);
        });



        app.get("/purchase/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolCollection.findOne(query);
            res.send(tool);
        });
        app.get("/payment/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolCollection.findOne(query);
            res.send(tool);
        });


        // Stripe API
        // app.post('/create-payment-intent', async (req, res) => {
        //     const tool = req.body;
        //     const price = tool.price_per_unit;
        //     const amount = price * 100;
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount: amount,
        //         currency: 'usd',
        //         payment_method_types: ['card']
        //     });

        //     res.send({ clientSecret: paymentIntent.client_secret });
        // });

    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello From Tools Manufacturer');
});

app.listen(port, () => {
    console.log(`Tools Manufacturer listening on port ${port}`);
});