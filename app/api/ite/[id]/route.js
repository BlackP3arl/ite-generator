import { NextResponse } from 'next/server';
import { getCurrentUser, canAccessResource } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { sanitizeFilename, validateFilePath, validateUploadedFile, verifyPDFFile } from '../../../../lib/fileUtils';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate ID parameter
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id < 1) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Fetch with authorization filter to prevent IDOR
        const ite = await prisma.iTE.findFirst({
            where: {
                id,
                OR: [
                    { userId: user.id },
                    { user: { role: 'admin' } }
                ]
            }
        });

        if (!ite) {
            // Same response for not found and forbidden to prevent enumeration
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

        // Validate ID parameter
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id < 1) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Fetch with authorization filter to prevent IDOR
        const existingITE = await prisma.iTE.findFirst({
            where: {
                id,
                OR: [
                    { userId: user.id },
                    { user: { role: 'admin' } }
                ]
            }
        });

        if (!existingITE) {
            // Same response for not found and forbidden to prevent enumeration
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
            // Validate file
            const validation = validateUploadedFile(itsFile);
            if (!validation.valid) {
                return NextResponse.json(
                    { error: `ITS file validation failed: ${validation.errors.join(', ')}` },
                    { status: 400 }
                );
            }

            const buffer = Buffer.from(await itsFile.arrayBuffer());

            // Verify PDF magic bytes
            if (!verifyPDFFile(buffer)) {
                return NextResponse.json(
                    { error: 'ITS file is not a valid PDF' },
                    { status: 400 }
                );
            }

            // Sanitize filename
            const sanitizedName = sanitizeFilename(itsFile.name);
            const fileName = 'ITS_' + sanitizedName;
            const filePath = path.join(uploadDir, fileName);

            // Validate path is within upload directory
            try {
                validateFilePath(filePath, uploadDir);
            } catch (error) {
                return NextResponse.json(
                    { error: 'Invalid file path' },
                    { status: 400 }
                );
            }

            fs.writeFileSync(filePath, buffer);
            itsFilePath = '/uploads/' + iteNumber.replace('/', '_') + '/' + fileName;
        }
        for (let i = 0; i < 4; i++) {
            const file = formData.get('supplierFile' + i);
            if (file && file instanceof Blob) {
                // Validate file
                const validation = validateUploadedFile(file);
                if (!validation.valid) {
                    return NextResponse.json(
                        { error: `Supplier file ${i} validation failed: ${validation.errors.join(', ')}` },
                        { status: 400 }
                    );
                }

                const buffer = Buffer.from(await file.arrayBuffer());

                // Verify PDF magic bytes
                if (!verifyPDFFile(buffer)) {
                    return NextResponse.json(
                        { error: `Supplier file ${i} is not a valid PDF` },
                        { status: 400 }
                    );
                }

                // Sanitize filename
                const sanitizedName = sanitizeFilename(file.name);
                const fileName = 'supplier_' + i + '_' + sanitizedName;
                const filePath = path.join(uploadDir, fileName);

                // Validate path is within upload directory
                try {
                    validateFilePath(filePath, uploadDir);
                } catch (error) {
                    return NextResponse.json(
                        { error: 'Invalid file path' },
                        { status: 400 }
                    );
                }

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

        // Validate ID parameter
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id < 1) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Fetch with authorization filter to prevent IDOR
        const ite = await prisma.iTE.findFirst({
            where: {
                id,
                OR: [
                    { userId: user.id },
                    { user: { role: 'admin' } }
                ]
            }
        });

        if (!ite) {
            // Same response for not found and forbidden to prevent enumeration
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
