const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateNotePDF(note, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);
        
        doc.pipe(stream);

        // Title
        doc.fontSize(20).text(note.title, { align: 'center' });
        doc.moveDown();

        // Metadata
        doc.fontSize(12).fillColor('gray');
        doc.text(`Created: ${new Date(note.createdAt).toLocaleDateString()}`);
        doc.text(`Updated: ${new Date(note.updatedAt).toLocaleDateString()}`);
        if (note.category) {
            doc.text(`Category: ${note.category}`);
        }
        doc.moveDown();

        // Content
        doc.fillColor('black').fontSize(12);
        const content = note.content.replace(/\n/g, '\n');
        doc.text(content);

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
    });
}

module.exports = {
    generateNotePDF
};

