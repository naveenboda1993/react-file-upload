const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create demo users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: 'user123',
        role: 'user'
      },
      {
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'manager123',
        role: 'user'
      }
    ];

    // Hash passwords and create users
    for (const userData of users) {
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
      
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.email}`);
    }

    console.log('Seed data created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed data creation failed:', error);
    process.exit(1);
  }
};

seedUsers();