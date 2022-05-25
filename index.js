const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yhyer.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run () {
    try {
        await client.connect();
        console.log("database connected");
        const toolCollection = client.db('tools-manufacturer').collection('tools');
        const userCollection = client.db('tools-manufacturer').collection('users');
        const productCollection = client.db('tools-manufacturer').collection('products');
        const orderCollection = client.db('tools-manufacturer').collection('orders');
        const reviewCollection = client.db('tools-manufacturer').collection('reviews');

        // app.get('/user', async (req, res) => {
        //     const users = await userCollection.find().toArray();
        //     res.send(users);
        // });

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

        // Get requests 
        app.get('/tool', async (req, res) => {
            const tools = await toolCollection.find().toArray();
            res.send(tools);
        });
        app.get('/review', async (req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        });
        app.get("/purchase/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolCollection.findOne(query);
            res.send(tool);
        });


        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        // post request
        app.post("/review", async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            console.log("Review added");
            res.send({ success: 'product added' });
        });
        app.post('/product', async (req, res) => {
            const product = req.body;
            // const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            // const exists = await bookingCollection.findOne(query);
            // if (exists) {
            //   return res.send({ success: false, booking: exists })
            // }
            const result = await productCollection.insertOne(product);
            // console.log('sending email');
            // sendAppointmentEmail(booking);
            // return res.send({ success: true, result });
            res.send(result);
        });

        // Update requests
        // app.patch('/user/:email', async(req, res) =>{
        //     const email  = req.params.email;
        //     const updatedProfile = req.body;
        //     const filter = {email: email};
        //     const updatedDoc = {
        //       $set: {
        //         paid: true,
        //         transactionId: payment.transactionId
        //       }
        //     }

        //     const result = await paymentCollection.insertOne(payment);
        //     const updatedBooking = await bookingCollection.updateOne(filter, updatedDoc);
        //     res.send(updatedBooking);
        //   })

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