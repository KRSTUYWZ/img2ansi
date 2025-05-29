const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const Img2Ansi = require('./img2ansi');

class NodeImg2Ansi extends Img2Ansi {
    /**
     * Creates a new NodeImg2Ansi instance
     * @param {Object} options - Configuration options
     * @param {string} options.escChar - Escape character to use in ANSI sequences
     * @param {string} options.lineEnding - Line ending character(s)
     * @param {string} options.quality - Default quality setting
     */
    constructor(options = {}) {
        super(options);
    }

    /**
     * Loads an image from a file path and converts it to ANSI
     * @param {string} filePath - Path to the image file
     * @param {Object} options - Conversion options
     * @returns {Promise<string>} Promise resolving to ANSI string
     */
    fromFilePath(filePath, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!fs.existsSync(filePath)) {
                    reject(new Error(`File not found: ${filePath}`));
                    return;
                }

                const image = await loadImage(filePath);
                const width = options.width || 80;
                const height = options.height;
                const quality = options.quality || this.defaultQuality;

                const targetAnsiWidth = this._calculateTargetWidth(
                    width, height, image.width, image.height, quality
                );

                const numAnsiRows = this._calculateTargetHeight(
                    width, height, image.width, image.height, quality
                );

                const canvasRenderWidth = targetAnsiWidth;
                const canvasRenderHeight = numAnsiRows * 2;

                const canvas = createCanvas(canvasRenderWidth, canvasRenderHeight);
                const ctx = canvas.getContext('2d', { alpha: false });

                ctx.imageSmoothingEnabled = (quality === 'low' || quality === 'medium');
                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvasRenderWidth, canvasRenderHeight);

                const imageData = ctx.getImageData(0, 0, canvasRenderWidth, canvasRenderHeight);

                const result = this._processImageData(
                    imageData.data,
                    targetAnsiWidth,
                    numAnsiRows,
                    quality,
                    options.escChar || this.escChar,
                    options.lineEnding || this.lineEnding
                );

                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Loads an image from a buffer and converts it to ANSI
     * @param {Buffer} buffer - Image buffer
     * @param {Object} options - Conversion options
     * @returns {Promise<string>} Promise resolving to ANSI string
     */
    fromBuffer(buffer, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                const image = await loadImage(buffer);
                const width = options.width || 80;
                const height = options.height;
                const quality = options.quality || this.defaultQuality;

                const targetAnsiWidth = this._calculateTargetWidth(
                    width, height, image.width, image.height, quality
                );

                const numAnsiRows = this._calculateTargetHeight(
                    width, height, image.width, image.height, quality
                );

                const canvasRenderWidth = targetAnsiWidth;
                const canvasRenderHeight = numAnsiRows * 2;

                const canvas = createCanvas(canvasRenderWidth, canvasRenderHeight);
                const ctx = canvas.getContext('2d', { alpha: false });

                ctx.imageSmoothingEnabled = (quality === 'low' || quality === 'medium');
                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvasRenderWidth, canvasRenderHeight);

                const imageData = ctx.getImageData(0, 0, canvasRenderWidth, canvasRenderHeight);

                const result = this._processImageData(
                    imageData.data,
                    targetAnsiWidth,
                    numAnsiRows,
                    quality,
                    options.escChar || this.escChar,
                    options.lineEnding || this.lineEnding
                );

                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Saves ANSI art to a file
     * @param {string} ansiString - ANSI string to save
     * @param {string} filePath - Path to save the file
     * @returns {Promise<void>} Promise resolving when file is saved
     */
    saveToFile(ansiString, filePath) {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, ansiString, 'utf8', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Prints ANSI art to the console
     * @param {string} ansiString - ANSI string to print
     */
    print(ansiString) {
        process.stdout.write(ansiString + '\n');
    }

    /**
     * Creates ANSI frames from multiple file paths
     * @param {string[]} filePaths - Array of image file paths
     * @param {Object} options - Conversion options
     * @returns {Promise<string[]>} Promise resolving to array of ANSI strings
     */
    fromMultipleFilePaths(filePaths, options = {}) {
        return Promise.all(filePaths.map(filePath => this.fromFilePath(filePath, options)));
    }

    /**
     * Creates ANSI frames from multiple buffers
     * @param {Buffer[]} buffers - Array of image buffers
     * @param {Object} options - Conversion options
     * @returns {Promise<string[]>} Promise resolving to array of ANSI strings
     */
    fromMultipleBuffers(buffers, options = {}) {
        return Promise.all(buffers.map(buffer => this.fromBuffer(buffer, options)));
    }

    /**
     * Creates terminal animation from frame paths (as shown in README)
     * @param {string[]} framePaths - Array of frame file paths
     * @param {Object} options - Animation options
     * @param {number} options.width - Frame width (default: 60)
     * @param {number} options.height - Frame height (default: 30)
     * @param {string} options.quality - Quality setting (default: 'medium')
     * @param {number} options.frameRate - Frames per second (default: 10)
     * @param {boolean} options.loop - Whether to loop animation (default: true)
     * @returns {Promise<string[]>} Promise resolving to array of ANSI frames
     */
    async createTerminalAnimation(framePaths, options = {}) {
        const frameOptions = {
            width: options.width || 60,
            height: options.height || 30,
            quality: options.quality || 'medium'
        };

        return await this.fromMultipleFilePaths(framePaths, frameOptions);
    }

    /**
     * Plays animation in terminal
     * @param {string[]} frames - Array of ANSI frame strings
     * @param {Object} options - Animation options
     * @param {number} options.frameRate - Frames per second (default: 10)
     * @param {boolean} options.loop - Whether to loop animation (default: true)
     * @param {boolean} options.clearScreen - Whether to clear screen between frames (default: true)
     * @returns {Object} Animation control object with stop() method
     */
    playTerminalAnimation(frames, options = {}) {
        if (!Array.isArray(frames) || frames.length === 0) {
            throw new Error('Frames must be a non-empty array');
        }

        const frameRate = options.frameRate || 10;
        const loop = options.loop !== false;
        const clearScreen = options.clearScreen !== false;
        const delay = 1000 / frameRate;

        let currentFrame = 0;
        let intervalId = null;
        let isPlaying = false;

        const playFrame = () => {
            if (clearScreen) {
                console.clear();
            }
            this.print(frames[currentFrame]);
            currentFrame = (currentFrame + 1) % frames.length;

            if (!loop && currentFrame === 0) {
                stop();
            }
        };

        const start = () => {
            if (!isPlaying) {
                isPlaying = true;
                playFrame();
                intervalId = setInterval(playFrame, delay);
            }
        };

        const stop = () => {
            if (isPlaying) {
                isPlaying = false;
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }
        };

        start();

        return {
            stop: stop,
            isPlaying: () => isPlaying,
            getCurrentFrame: () => currentFrame
        };
    }
}

module.exports = NodeImg2Ansi;