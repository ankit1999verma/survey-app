const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const password = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: password,
      role: 'admin',
      name: 'Administrator'
    });
    console.log('Admin user created successfully.');
  } catch (err) {
    console.error('Error creating admin:', err);
  }
}
createAdmin();
