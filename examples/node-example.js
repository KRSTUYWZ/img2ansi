const NodeImg2Ansi = require('../Lib/img2ansi.node');
const fs = require('fs');
const path = require('path');

const img2ansi = new NodeImg2Ansi({
    escChar: '\u001b',
    lineEnding: '\n',
    quality: 'high'
});

const imagePath = process.argv[2] || path.join(__dirname, 'example.jpg');

if (!fs.existsSync(imagePath)) {
    console.error(`Error: Image file not found at ${imagePath}`);
    console.log('Usage: node node-example.js [path/to/image]');
    process.exit(1);
}

async function convertImage() {
    try {
        console.log(`Converting image: ${imagePath}`);

        console.log('\n=== High Quality (80 columns) ===');
        const highQuality = await img2ansi.fromFilePath(imagePath, {
            width: 80,
            quality: 'high'
        });
        img2ansi.print(highQuality);

        console.log('\n=== Medium Quality (40 columns) ===');
        const mediumQuality = await img2ansi.fromFilePath(imagePath, {
            width: 40,
            quality: 'medium'
        });
        img2ansi.print(mediumQuality);

        console.log('\n=== Low Quality (20 columns) ===');
        const lowQuality = await img2ansi.fromFilePath(imagePath, {
            width: 20,
            quality: 'low'
        });
        img2ansi.print(lowQuality);

        const outputPath = path.join(__dirname, 'output.txt');
        await img2ansi.saveToFile(highQuality, outputPath);
        console.log(`\nSaved high quality output to: ${outputPath}`);

    } catch (err) {
        console.error('Error converting image:', err);
    }
}

convertImage();