const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;
const jwt = require('jsonwebtoken');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/MiniMap', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// User model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

app.use(express.json());

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);


async function dropAllDatabases() {
    // Replace with your MongoDB connection string
    const uri = 'mongodb://localhost:27017/MiniMap';
  
    // Connect to MongoDB
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  
    // Get the native MongoDB driver connection
    const mongoClient = mongoose.connection.getClient();
  
    // List all databases
    const databasesList = await mongoClient.db().admin().listDatabases();
  
    // Iterate over each database and drop it, except system databases
    for (let dbInfo of databasesList.databases) {
      if (!['admin', 'local', 'config'].includes(dbInfo.name)) {
        console.log(`Dropping database: ${dbInfo.name}`);
        await mongoClient.db(dbInfo.name).dropDatabase();
      }
    }
  
    // Close the Mongoose connection
    await mongoose.disconnect();
  }
  

// Middleware to parse JSON
app.use(express.json());

// Registration endpoint
app.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const existingUser = await User.findOne({ username });
  
      if (existingUser) {
        return res.status(400).send({ message: "Username already exists" });
      }
  
      let user = new User({ username, password });
      await user.save();
  
      // Generate a token
      const token = jwt.sign({ userId: user._id }, 'yourSecretKey', { expiresIn: '24h' });
  
      res.status(201).send({ token, message: "User registered successfully" });
    } catch (error) {
      res.status(500).send(error);
    }
  });
  
  app.post('/drop', async (req, res) => {
    dropAllDatabases().catch(console.error);
  });

  // Login endpoint
// Login endpoint
app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(401).send({ message: "Invalid username or password" });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).send({ message: "Invalid username or password" });
      }
  
      // Generate a token
      const token = jwt.sign({ userId: user._id }, 'yourSecretKey', { expiresIn: '24h' });
  
      res.status(200).send({ username, token, message: "Login successful" });
    } catch (error) {
      res.status(500).send(error);
    }
  });
  

  const authenticateUser = (req, res, next) => {
    try {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, 'yourSecretKey');
      req.userId = decoded.userId;
      next();
    } catch (error) {
      res.status(401).send({ message: 'Please authenticate.' });
    }
  };
  
  // Profile endpoint
  app.get('/profile', authenticateUser, async (req, res) => {
    try {
      const user = await User.findById(req.userId, '-password'); // Exclude password from the result
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }
      res.send(user);
    } catch (error) {
      res.status(500).send(error);
    }
  });

  app.delete('/user/markers/:markerId', authenticateUser, async (req, res) => {
    try {
      const { markerId } = req.params;
      const user = await User.findById(req.userId);
      user.markers = user.markers.filter(marker => marker._id.toString() !== markerId);
  
      await user.save();
      res.send({ message: 'Marker deleted successfully' });
    } catch (error) {
      res.status(500).send(error);
    }
  });

  app.put('/user/markers/:markerId', authenticateUser, async (req, res) => {
    try {
      const { markerId } = req.params;
      const user = await User.findById(req.userId);
      const markerIndex = user.markers.findIndex(marker => marker._id.toString() === markerId);
  
      if (markerIndex === -1) {
        return res.status(404).send({ message: 'Marker not found' });
      }
  
      user.markers[markerIndex] = {...user.markers[markerIndex].toObject(), ...req.body};
      await user.save();
      res.send(user.markers[markerIndex]);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  

  app.get('/user/markers', authenticateUser, async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      // Temporarily return the entire user object to inspect it
      return res.send(user.markers);
    } catch (error) {
      res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  });
  

  app.post('/user/markers', authenticateUser, async (req, res) => {
    try {
      const user = await User.findById(req.userId);
  
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      if (!user.markers) {
        user.markers = [];
      }
  
      const newMarker = req.body;
      user.markers.push(newMarker);
      await user.save();
      console.log("Updated user with new marker:", user);
        
  
      // Send back the added marker
      // Assuming the new marker is the last one in the array
      const addedMarker = user.markers[user.markers.length - 1];
      res.status(201).send(addedMarker);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
