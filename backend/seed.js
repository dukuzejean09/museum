import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';
import Guide from './models/Guide.js';

dotenv.config();
connectDB();

const importData = async () => {
  try {
    console.log('\n🗑  Clearing existing users & guides...');
    await Promise.all([Admin.deleteMany(), Guide.deleteMany()]);

    console.log('\n👤 Creating user accounts...');

    const adminUser = await Admin.create({
      username: 'deliceadmin',
      email: 'alphamugemadelice@gmail.com',
      password: 'Admin@2026!',
      role: 'admin',
      isProtected: true,
      profile: { firstName: 'Delice', lastName: 'Alphamugema' },
    });

    const guideUser = await Admin.create({
      username: 'jcdukuze',
      email: 'jcdukuze@gmail.com',
      password: 'Guide@2026!',
      role: 'guide',
      profile: { firstName: 'JC', lastName: 'Dukuze' },
    });

    await Guide.create({
      name: 'JC Dukuze',
      email: 'jcdukuze@gmail.com',
      userId: guideUser._id,
      languages: ['English', 'French', 'Kinyarwanda'],
      specializations: ['Colonial History', 'Natural History', 'Kigali Heritage'],
      isActive: true,
    });

    console.log('\n✅ Users seeded successfully!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('  Admin: alphamugemadelice@gmail.com / Admin@2026!  🔒 protected');
    console.log('  Guide: jcdukuze@gmail.com / Guide@2026!');
    console.log('═══════════════════════════════════════════════════\n');
    process.exit();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

importData();
