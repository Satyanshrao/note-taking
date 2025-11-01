// Simple script to view MongoDB data
const mongoose = require('mongoose');
const userModel = require('./models/user');
const noteModel = require('./models/note');

async function viewData() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/authtestapp');
        console.log('\n=== Connected to MongoDB ===\n');

        // View Users
        const users = await userModel.find({});
        console.log('📊 USERS COLLECTION:');
        console.log(`Total Users: ${users.length}\n`);
        
        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log(`  ID: ${user._id}`);
            console.log(`  Username: ${user.username}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Age: ${user.age}`);
            console.log(`  Password: ${user.password.substring(0, 20)}... (hashed)\n`);
        });

        // View Notes
        const notes = await noteModel.find({});
        console.log('📝 NOTES COLLECTION:');
        console.log(`Total Notes: ${notes.length}\n`);
        
        notes.forEach((note, index) => {
            console.log(`Note ${index + 1}:`);
            console.log(`  ID: ${note._id}`);
            console.log(`  Title: ${note.title}`);
            console.log(`  Content: ${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}`);
            console.log(`  User ID: ${note.userId}`);
            console.log(`  Created: ${note.createdAt}`);
            console.log(`  Updated: ${note.updatedAt}\n`);
        });

        await mongoose.disconnect();
        console.log('\n=== Disconnected from MongoDB ===\n');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

viewData();

