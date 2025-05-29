const NodeImg2Ansi = require('../Lib/img2ansi.node');
const fs = require('fs');
const path = require('path');

const img2ansi = new NodeImg2Ansi({
    escChar: '\u001b',
    lineEnding: '\n',
    quality: 'medium'
});

/**
 * Creates animation from video frames directory
 * @param {string} framesDir - Directory containing frame images
 * @returns {Promise<void>}
 */
async function createAnimation(framesDir) {
    try {
        if (!fs.existsSync(framesDir)) {
            console.error(`Error: Frames directory not found: ${framesDir}`);
            console.log('Usage: node video-to-ansi.js [frames-directory]');
            console.log('\nTo extract frames from video using ffmpeg:');
            console.log('ffmpeg -i input.mp4 -vf "fps=10,scale=80:40" frame_%04d.png');
            return;
        }

        const files = fs.readdirSync(framesDir)
            .filter(file => /\.(png|jpg|jpeg|gif|bmp)$/i.test(file))
            .sort()
            .map(file => path.join(framesDir, file));

        if (files.length === 0) {
            console.error('No image files found in the frames directory');
            return;
        }

        console.log(`Found ${files.length} frame files`);
        console.log('Converting frames to ANSI...');

        const frames = await img2ansi.createTerminalAnimation(files, {
            width: 60,
            height: 30,
            quality: 'medium'
        });

        console.log('Playing animation (Press Ctrl+C to stop)...\n');

        const animation = img2ansi.playTerminalAnimation(frames, {
            frameRate: 10,
            loop: true,
            clearScreen: true
        });

        process.on('SIGINT', () => {
            animation.stop();
            console.log('\nAnimation stopped');
            process.exit(0);
        });

    } catch (err) {
        console.error('Error creating animation:', err);
    }
}

const framesDir = process.argv[2] || path.join(__dirname, 'frames');
createAnimation(framesDir);
