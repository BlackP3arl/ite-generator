const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Set Ahmed Salam as system admin
  const adminEmail = 'ahmed.salam@mtcc.com.mv';

  console.log(`\n📧 Looking for user: ${adminEmail}`);

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    // Update existing user to ADMIN role
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Updated user to ADMIN role:`);
    console.log(`   - Name: ${updatedUser.name || 'N/A'}`);
    console.log(`   - Email: ${updatedUser.email}`);
    console.log(`   - Role: ${updatedUser.role}`);
    console.log(`   - Auth Method: ${updatedUser.azureId ? 'Azure AD' : 'Email/Password'}`);
  } else {
    // Create new user with ADMIN role
    console.log(`⚠️  User not found. Creating new admin user...`);

    const newUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Ahmed Salam',
        role: 'ADMIN',
      },
    });

    console.log(`✅ Created new ADMIN user:`);
    console.log(`   - Name: ${newUser.name}`);
    console.log(`   - Email: ${newUser.email}`);
    console.log(`   - Role: ${newUser.role}`);
    console.log(`\n   ℹ️  This user will be auto-linked when they first sign in with Azure AD.`);
  }

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
