import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser, canAccessResource } from '../../../../lib/auth';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const id = parseInt(params.id);
        const ite = await prisma.iTE.findUnique({ where: { id } });
        if (!ite) {
            return NextResponse.json({ error: 'ITE not found' }, { status: 404 });
        }
        const hasAccess = await canAccessResource(ite.userId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json(ite);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch ITE' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const id = parseInt(params.id);
        const existingITE = await prisma.iTE.findUnique({ where: { id } });
        if (!existingITE) {
            return NextResponse.json({ error: 'ITE not found' }, { status: 404 });
        }
        const hasAccess = await canAccessResource(existingITE.userId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const formData = await request.formData();
        const comparisonData = JSON.parse(formData.get('comparisonData'));
        const recommendations = JSON.parse(formData.get('recommendations'));
        const acceptedCells = formData.get('acceptedCells') || '{}';
        const comments = formData.get('comments');
        const iteNumber = existingITE.iteNumber;
        let supplierFiles = existingITE.supplierFiles ? JSON.parse(existingITE.supplierFiles) : [null, null, null, null];
        let itsFilePath = existingITE.itsFilePath;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', iteNumber.replace('/', '_'));
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const itsFile = formData.get('itsFile');
        if (itsFile && itsFile instanceof Blob) {
            const buffer = Buffer.from(await itsFile.arrayBuffer());
            const fileName = 'ITS_' + itsFile.name;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            itsFilePath = '/uploads/' + iteNumber.replace('/', '_') + '/' + fileName;
        }
        for (let i = 0; i < 4; i++) {
            const file = formData.get('supplierFile' + i);
            if (file && file instanceof Blob) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const fileName = 'supplier_' + i + '_' + file.name;
                const filePath = path.join(uploadDir, fileName);
                fs.writeFileSync(filePath, buffer);
                supplierFiles[i] = '/uploads/' + iteNumber.replace('/', '_') + '/' + fileName;
            }
        }
        const updatedITE = await prisma.iTE.update({
            where: { id },
            data: {
                comparisonData: JSON.stringify(comparisonData),
                recommendations: JSON.stringify(recommendations),
                supplierFiles: JSON.stringify(supplierFiles),
                itsFilePath: itsFilePath,
                comments: comments,
                acceptedCells: acceptedCells,  // Save accepted cells
            },
        });
        return NextResponse.json(updatedITE);
    } catch (error) {
        console.error('Error updating ITE:', error);
        return NextResponse.json({ error: 'Failed to update ITE' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const id = parseInt(params.id);
        const ite = await prisma.iTE.findUnique({ where: { id } });
        if (!ite) {
            return NextResponse.json({ error: 'ITE not found' }, { status: 404 });
        }
        const hasAccess = await canAccessResource(ite.userId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', ite.iteNumber.replace('/', '_'));
        if (fs.existsSync(uploadDir)) {
            fs.rmSync(uploadDir, { recursive: true, force: true });
        }
        await prisma.iTE.delete({ where: { id } });
        return NextResponse.json({ success: true, message: 'ITE and files deleted successfully' });
    } catch (error) {
        console.error('Error deleting ITE:', error);
        return NextResponse.json({ error: 'Failed to delete ITE' }, { status: 500 });
    }
}
