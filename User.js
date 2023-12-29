const mongoose = require('mongoose');

const markerSchema = new mongoose.Schema({
    name: String,
    iconName: String,
    position: {
      lat: Number,
      lng: Number
    }
  });

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    avatarUrl: String,
    markers: [markerSchema]
  });

module.exports = mongoose.model('User', userSchema);
