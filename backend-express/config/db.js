const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not defined in environment');
    process.exit(1);
  }

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: process.env.NODE_ENV !== 'production',
    retryWrites: true,
  };

  const maxRetries = 5;
  const retryDelay = 2000; // ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(mongoUri, options);
      console.log('? Connected to MongoDB');
      break;
    } catch (err) {
      console.error(MongoDB connection attempt  failed: );
      if (attempt === maxRetries) {
        console.error('?? Exhausted all MongoDB connection attempts. Exiting.');
        process.exit(1);
      }
      console.log(? Retrying in ms...);
      await new Promise(res => setTimeout(res, retryDelay));
    }
  }

  // Global connection event listeners
  mongoose.connection.on('connected', () => console.log('Mongoose connected'));
  mongoose.connection.on('error', err => console.error('Mongoose error:', err));
  mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));
};

module.exports = connectDB;
