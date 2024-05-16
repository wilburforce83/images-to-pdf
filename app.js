const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');

const inputFolder = './book_images';
const outputFolder = './pdf_output';
const outputFilePath = path.join(outputFolder, 'book.pdf');

// Ensure output folder exists
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
}

// Get list of image files in input folder
fs.readdir(inputFolder, (err, files) => {
    if (err) {
        console.error('Error reading input folder:', err);
        return;
    }

    // Filter out non-image files
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

    // Sort the image files based on their numerical values
    imageFiles.sort((a, b) => {
        const numA = parseInt(path.parse(a).name, 10);
        const numB = parseInt(path.parse(b).name, 10);
        return numA - numB;
    });

    // Create new PDF document
    const doc = new PDFDocument({ autoFirstPage: false });

    // Pipe PDF document to a writable stream
    const stream = fs.createWriteStream(outputFilePath);
    doc.pipe(stream);

    // Set PDF document size to A4
    doc.addPage({ size: 'a4' });

    // Define function to add image to PDF document
    const addImageToPDF = (imagePath) => {
        return new Promise((resolve, reject) => {
            sharp(imagePath)
                .resize({ width: 595 }) // A4 width in pixels
                .toBuffer()
                .then(buffer => {
                    doc.image(buffer, 0, 0, { width: 595 }); // A4 width in points
                    doc.addPage({ size: 'a4' });
                    resolve();
                })
                .catch(reject);
        });
    };

    // Loop through each image file and add it to PDF sequentially
    const addImagesSequentially = async () => {
        for (const file of imageFiles) {
            await addImageToPDF(path.join(inputFolder, file));
        }
        doc.end(); // Finalize PDF document
        console.log('PDF generated successfully.');
    };

    // Start adding images sequentially
    addImagesSequentially().catch(err => {
        console.error('Error generating PDF:', err);
    });
});
