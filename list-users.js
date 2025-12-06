const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
      azureId: true,
      createdAt: true,
    },
  });

  console.log('\n📋 Users in Database:\n');
  console.log('─'.repeat(80));

  if (users.length === 0) {
    console.log('⚠️  No users found in database');
  } else {
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || 'No Name'}`);
      console.log(`   Email:        ${user.email}`);
      console.log(`   Role:         ${user.role}`);
      console.log(`   Password:     ${user.password ? '✅ Set' : '❌ Not Set'}`);
      console.log(`   Azure AD:     ${user.azureId ? '✅ Linked' : '❌ Not Linked'}`);
      console.log(`   Created:      ${user.createdAt.toISOString()}`);
      console.log(`   User ID:      ${user.id}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`Total Users: ${users.length}\n`);
  }
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
