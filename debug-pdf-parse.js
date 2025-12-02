
const fs = require('fs');

async function checkExports() {
    try {
        const { PDFParse } = await import('pdf-parse');

        console.log('Testing with Buffer...');
        const buffer = Buffer.from('%PDF-1.4\n%...');

        try {
            const parser = new PDFParse(buffer);
            // We expect this might fail if we actually tried to load it, but the constructor might pass.
            // The error happens at .load() which is called by .getText() usually, or internally.
            // Let's try to call getText() to trigger the load.
            // Since it's a dummy PDF, it will fail with InvalidPDFException probably, but we want to see if it fails with "rather than Buffer".
            await parser.getText();
        } catch (e) {
            console.log('Buffer Error:', e.message);
        }

        console.log('Testing with Uint8Array...');
        const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        try {
            const parser2 = new PDFParse(uint8Array);
            await parser2.getText();
        } catch (e) {
            console.log('Uint8Array Error:', e.message);
        }

    } catch (error) {
        console.error('General Error:', error);
    }
}

checkExports();
