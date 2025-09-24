const express = require('express');
const app = express();

require('dotenv').config();

//cors
const cors = require('cors');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://mcpitc.web.app'],
    credentials: true,
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

//form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//cookie
app.use(cookieParser())



//middlewares
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: "Unauthorized User" })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).send({ message: "Unauthorized Access" })
        }
        req.user = decoded;

        next()
    })
}




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iduz7rm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const usersCollection = client.db("mcpitc").collection("users")
        const eventsCollection = client.db("mcpitc").collection("events")
        const segmentsCollection = client.db("mcpitc").collection("segments")
        const blogsCollection = client.db("mcpitc").collection("blogs")
        const executiveFormCollection = client.db("mcpitc").collection("executive-form-collection")
        const recruitmentButton = client.db("mcpitc").collection("recruitment-btn")


        //verify admin middleware
        const verifyAdmin = async (req, res, next) => {
            const user = req.user;
            const query = { email: user?.email };
            const result = await usersCollection.findOne(query)
            if (!result || result?.role !== 'admin') {
                return res.status(401).send({ message: "Unauthorized Access" })
            }

            next();
        }

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        //get all users
        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result)
        })

        //get one user
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })

        //put email if user is not not in db
        // app.put('/user', async (req, res) => {
        //     const user = req.body;
        //     const query = { email: user?.email }

        //     if (user?.email == null) {
        //         return;
        //     }
        //     if (user?.name == null) {
        //         return
        //     }

        //     const isExisted = await usersCollection.findOne(query);
        //     if (isExisted) {
        //         return res.send(isExisted)
        //     }

        //     const options = { upsert: true }
        //     const updateDoc = {
        //         $set: {
        //             ...user,
        //             timestamp: Date.now()
        //         }
        //     }
        //     const result = await usersCollection.updateOne(query, updateDoc, options)
        //     res.send(result)
        // })

        app.put("/user", async (req, res) => {
            const user = req.body;
            const query = { email: user?.email }

            // if (user?.email == null) {
            //     return;
            // }

            if (user?.name != null || user?.image != null) {
                const updateDoc = {
                    $set: {
                        name: user?.name,
                        image: user?.image,
                    }
                }

                const options = { upsert: true }
                const result = await usersCollection.updateOne(query, updateDoc, options)
                return res.send(result)
            }
            else {
                const isExists = await usersCollection.findOne(query);
                if (isExists) return res.send(isExists)

                const updateDoc = {
                    $set: {
                        ...user,
                        timestamp: Date.now(),
                    }
                }

                const options = { upsert: true }
                const result = await usersCollection.updateOne(query, updateDoc, options)
                res.send(result)
            }
        })

        //make admin
        app.patch('/user/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const admin = req.body;
            const updateDoc = {
                $set: {
                    ...admin
                }
            }
            const result = await usersCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        //set designation
        app.patch("/user/designation/:email", verifyToken, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const designation = req.body;

            const updateDoc = {
                $set: {
                    ...designation
                }
            }

            const result = await usersCollection.updateOne(query, updateDoc)
            res.send(result)
        })


        //get all events
        app.get("/events", async (req, res) => {
            const result = await eventsCollection.find().sort({ "timestamp": -1 }).toArray();
            res.send(result)
        })

        //get one event
        app.get("/event/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await eventsCollection.findOne(query);
            res.send(result)
        })

        //post events
        app.post('/events', verifyToken, verifyAdmin, async (req, res) => {
            const event = req.body;
            const result = await eventsCollection.insertOne(event);
            res.send(result)
        })

        //delete a event
        app.delete('/event/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await eventsCollection.deleteOne(query);
            res.send(result)
        })


        //add event segment
        app.post('/event-segment', verifyToken, verifyAdmin, async (req, res) => {
            const segment = req.body;
            const result = await segmentsCollection.insertOne(segment);
            res.send(result)
        })

        //get one event by name
        app.get("/eventName/:name", async (req, res) => {
            const name = req.params.name
            const query = { name: name }
            const result = await eventsCollection.findOne(query);
            res.send(result)
        })


        //get all segments
        app.get('/segments', async (req, res) => {
            const result = await segmentsCollection.find().toArray();
            res.send(result)
        })

        //get one segment
        app.get('/segment-details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await segmentsCollection.findOne(query);
            res.send(result)
        })

        //update segment details
        app.put('/segment-details/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const segment = req.body;
            const updateDoc = {
                $set: {
                    ...segment
                }
            }
            const result = await segmentsCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        //get segments according to event name
        app.get('/segment/:event', async (req, res) => {
            const eventName = req.params.event;
            const query = { eventName: eventName };
            const result = await segmentsCollection.find(query).toArray();
            res.send(result)
        })

        //delete one segment
        app.delete('/segment/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await segmentsCollection.deleteOne(query);
            res.send(result)
        })


        //get all blogs
        app.get('/blogs', async (req, res) => {
            const result = await blogsCollection.find().sort({ "timestamp": -1 }).toArray();
            res.send(result)
        })

        //get a single blog
        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogsCollection.findOne(query);
            res.send(result)
        })

        //add blog
        app.post('/blogs', verifyToken, verifyAdmin, async (req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result)
        })

        //edit a blog
        app.put('/blog/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const blog = req.body;
            const updateDoc = {
                $set: {
                    ...blog
                }
            }
            const result = await blogsCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        //delete a blog
        app.delete('/blog/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogsCollection.deleteOne(query);
            res.send(result)
        })


        //apply for executive
        app.get("/executiveFormCollection", async (req, res) => {
            const result = await executiveFormCollection.find().sort({ 'timestamp': -1 }).toArray();
            res.send(result)
        })


        //get your own executive form
        app.get("/executiveFormCollection/myForms/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const myForms = await executiveFormCollection.findOne(query);
            res.send(myForms);
        })



        //get executive with single id
        app.get("/executiveFormCollection/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await executiveFormCollection.findOne(query);
            res.send(result)
        })


        // post for executive
        app.post("/executiveFormCollection", async (req, res) => {
            const formBody = req.body;

            const query = { email: formBody?.email }
            const res1 = await executiveFormCollection.findOne(query);
            if (res1) {
                return res.status(400).send(res1)
            }

            const result = await executiveFormCollection.insertOne(formBody)
            res.send(result)
        })


        // edit executive form
        app.put("/executiveFormCollection/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const formBody = req.body;

            const updateOne = {
                $set: {
                    ...formBody
                }
            }

            const result = await executiveFormCollection.updateOne(query, updateOne)
            res.send(result)
        })




        //delete executive form
        app.delete("/executiveFormCollection/:email", verifyToken, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await executiveFormCollection.deleteOne(query);
            res.send(result);
        })


        //count documents
        app.get("/admin-stats", async (req, res) => {
            const usersCount = await usersCollection.countDocuments();
            const eventsCount = await eventsCollection.countDocuments();
            const recruitFormCount = await executiveFormCollection.countDocuments();
            res.send({ usersCount, eventsCount, recruitFormCount })
        })


        //recruitment on off switch
        app.get("/recruitment-onOff", verifyToken, verifyAdmin, async (req, res) => {
            const result = await recruitmentButton.findOne({});
            if (!result) {
                const defaultState = { status: "off" };
                await recruitmentButton.insertOne(defaultState);
                return res.send(defaultState);
            }

            res.send(result);
        })

        app.put("/recruitment-onOff", verifyToken, verifyAdmin, async (req, res) => {
            const bodyRes = req.body;
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    ...bodyRes
                }
            }

            const result = await recruitmentButton.updateOne({}, updateDoc, options)
            res.send(result)
        })



        //jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '365d'
            })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            }).send({ success: true })
        })

        // app.get('/logout', async (req, res) => {
        //     try {
        //         res.clearCookie('token', {
        //             maxAge: 0,
        //             secure: process.env.NODE_ENV === 'production',
        //             sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        //         }).send({ success: true })
        //     } catch (error) {
        //         res.status(500).send(error)
        //     }
        // })
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res
                .clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true })
                .send({ success: true })
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send("Welcome to MCPITC Server")
})

module.exports = app;