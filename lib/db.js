const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB Terhubung");
  } catch (error) {
    console.error("Gagal terhubung ke MongoDB:", error);
  }
};

module.exports = connectDB;

