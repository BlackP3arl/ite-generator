import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admins see all ITEs, users see only their own
        const where = user.role === 'admin' ? {} : { userId: user.id };

        const ites = await prisma.iTE.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(ites);
    } catch (error) {
        console.error('Error fetching ITEs:', error);
        return NextResponse.json({ error: 'Failed to fetch ITEs' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const metadata = JSON.parse(formData.get('metadata'));
        const itsFields = JSON.parse(formData.get('itsFields'));
        const comparisonData = JSON.parse(formData.get('comparisonData'));
        const recommendations = JSON.parse(formData.get('recommendations'));
        const acceptedCells = formData.get('acceptedCells') || '{}';
        const comments = formData.get('comments');

        const currentYear = new Date().getFullYear();

        // Find the latest ITE for the current year to determine the running number
        const latestITE = await prisma.iTE.findFirst({
            where: { year: currentYear },
            orderBy: { runningNumber: 'desc' },
        });

        const runningNumber = (latestITE?.runningNumber || 0) + 1;
        const runningNumberStr = String(runningNumber).padStart(3, '0');
        const iteNumber = `ITE-${currentYear}-${runningNumberStr}`;

        // Handle file uploads
        const supplierFiles = [];
        let itsFilePath = null;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', iteNumber.replace('/', '_'));

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Handle ITS File
        const itsFile = formData.get('itsFile');
        if (itsFile && itsFile instanceof Blob) {
            const buffer = Buffer.from(await itsFile.arrayBuffer());
            const fileName = `ITS_${itsFile.name}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            itsFilePath = `/uploads/${iteNumber.replace('/', '_')}/${fileName}`;
        }

        // Iterate through possible supplier files (0 to 3)
        for (let i = 0; i < 4; i++) {
            const file = formData.get(`supplierFile${i}`);
            if (file && file instanceof Blob) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const fileName = `supplier_${i}_${file.name}`;
                const filePath = path.join(uploadDir, fileName);
                fs.writeFileSync(filePath, buffer);
                supplierFiles.push(`/uploads/${iteNumber.replace('/', '_')}/${fileName}`);
            } else {
                supplierFiles.push(null); // Keep index alignment
            }
        }

        const newITE = await prisma.iTE.create({
            data: {
                iteNumber,
                year: currentYear,
                runningNumber,
                metadata: JSON.stringify(metadata),
                itsFields: JSON.stringify(itsFields),
                comparisonData: JSON.stringify(comparisonData),
                recommendations: JSON.stringify(recommendations),
                supplierFiles: JSON.stringify(supplierFiles),
                itsFilePath: itsFilePath,
                comments: comments || '',
                acceptedCells: acceptedCells,  // Save accepted cells
                userId: user.id, // Link ITE to user
            },
        });

        return NextResponse.json(newITE);
    } catch (error) {
        console.error('Error creating ITE:', error);
        return NextResponse.json({ error: 'Failed to create ITE' }, { status: 500 });
    }
}
