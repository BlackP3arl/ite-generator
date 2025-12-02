
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    console.log('Testing Prisma Connection...');

    // Try default instantiation
    try {
        console.log('Attempt 1: Default instantiation');
        const prisma1 = new PrismaClient();
        await prisma1.$connect();
        console.log('Success 1');
        await prisma1.$disconnect();
    } catch (e) {
        console.log('Error 1:', e.message);
    }

    // Try passing datasources
    try {
        console.log('Attempt 2: Explicit datasources');
        const prisma2 = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        });
        await prisma2.$connect();
        console.log('Success 2');
        await prisma2.$disconnect();
    } catch (e) {
        console.log('Error 2:', e.message);
    }
}

// Mock process.env since we are running with node directly and .env might not be loaded automatically
// But wait, the app uses nextjs which loads .env. 
// For this script, I'll manually load it or just hardcode for testing if needed.
// I'll try to read it from .env file.
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const dbUrlLine = envFile.split('\n').find(line => line.startsWith('DATABASE_URL='));
if (dbUrlLine) {
    const url = dbUrlLine.split('=')[1].replace(/"/g, '');
    process.env.DATABASE_URL = url;
    console.log('Loaded DATABASE_URL:', url);
}

testConnection();
