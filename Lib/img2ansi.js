(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Img2Ansi = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {

    const DEFAULT_WIDTH = 80;
    const DEFAULT_QUALITY = 'high';
    const DEFAULT_LINE_ENDING = '\n';
    const DEFAULT_ESC_CHAR = '\u001b';
    const PRINTF_ESC = '\\e';
    const DEFAULT_FRAME_RATE = 10;

    class Img2Ansi {
        /**
         * Creates a new Img2Ansi instance
         * @param {Object} options - Configuration options
         * @param {string} options.escChar - Escape character to use in ANSI sequences
         * @param {string} options.lineEnding - Line ending character(s)
         * @param {string} options.quality - Default quality setting
         */
        constructor(options = {}) {
            this.escChar = options.escChar || DEFAULT_ESC_CHAR;
            this.lineEnding = options.lineEnding || DEFAULT_LINE_ENDING;
            this.defaultQuality = options.quality || DEFAULT_QUALITY;
        }

        /**
         * Quantizes a color component based on quality level
         * @param {number} value - The color component value (0-255)
         * @param {string} quality - Quality level ('low', 'medium', 'high', 'perfect')
         * @returns {number} The quantized value
         */
        quantizeComponent(value, quality) {
            if (quality === 'low') {
                return Math.min(255, Math.round(value / 85) * 85);
            } else if (quality === 'medium') {
                return Math.min(255, Math.round(value / 36) * 36);
            }
            return value;
        }

        /**
         * Converts an image to ANSI art
         * @param {Object} params - Conversion parameters
         * @param {HTMLImageElement|ImageData|Uint8ClampedArray} params.img - Image source
         * @param {number} params.width - Target width in characters
         * @param {number} params.height - Target height in rows
         * @param {string} params.quality - Quality level ('low', 'medium', 'high', 'perfect')
         * @param {string} params.lineEnding - Line ending to use
         * @param {string} params.escChar - Escape character
         * @returns {string} ANSI art string
         */
        convertToAnsi(params) {
            const img = params.img;
            const width = params.width || DEFAULT_WIDTH;
            const height = params.height;
            const quality = params.quality || this.defaultQuality;
            const lineEnding = params.lineEnding || this.lineEnding;
            const escChar = params.escChar || this.escChar;

            let originalWidth, originalHeight, imageData;

            if (img instanceof HTMLImageElement) {
                originalWidth = img.naturalWidth;
                originalHeight = img.naturalHeight;

                if (originalWidth === 0 || originalHeight === 0) {
                    throw new Error("Image has invalid dimensions.");
                }

                const canvas = document.createElement('canvas');
                const targetAnsiWidth = this._calculateTargetWidth(width, height, originalWidth, originalHeight, quality);
                const numAnsiRows = this._calculateTargetHeight(width, height, originalWidth, originalHeight, quality);

                const canvasRenderWidth = targetAnsiWidth;
                const canvasRenderHeight = numAnsiRows * 2;

                canvas.width = canvasRenderWidth;
                canvas.height = canvasRenderHeight;

                const ctx = canvas.getContext('2d', { alpha: false });
                ctx.imageSmoothingEnabled = (quality === 'low' || quality === 'medium');
                ctx.drawImage(img, 0, 0, originalWidth, originalHeight, 0, 0, canvasRenderWidth, canvasRenderHeight);

                try {
                    imageData = ctx.getImageData(0, 0, canvasRenderWidth, canvasRenderHeight);
                } catch (e) {
                    throw new Error("Could not process image data. Check CORS if using external images.");
                }

                return this._processImageData(
                    imageData.data,
                    targetAnsiWidth,
                    numAnsiRows,
                    quality,
                    escChar,
                    lineEnding
                );
            } else if (img.data && img.width && img.height) {
                return this._processImageData(
                    img.data,
                    width,
                    height || Math.floor(width * (img.height / img.width)),
                    quality,
                    escChar,
                    lineEnding
                );
            } else if (img instanceof Uint8ClampedArray && params.imgWidth && params.imgHeight) {
                return this._processImageData(
                    img,
                    width,
                    height || Math.floor(width * (params.imgHeight / params.imgWidth)),
                    quality,
                    escChar,
                    lineEnding
                );
            } else {
                throw new Error("Unsupported image source format");
            }
        }

        /**
         * Calculates the target width based on input parameters
         * @param {number} width - Requested width
         * @param {number} height - Requested height
         * @param {number} originalWidth - Original image width
         * @param {number} originalHeight - Original image height
         * @param {string} quality - Quality setting
         * @returns {number} Calculated target width
         */
        _calculateTargetWidth(width, height, originalWidth, originalHeight, quality) {
            if (quality === 'perfect' && width && height) {
                return width;
            } else if (width && !height) {
                return width;
            } else if (!width && height) {
                return Math.max(1, Math.round(height * (originalWidth / originalHeight)));
            } else if (width && height) {
                return width;
            } else {
                return DEFAULT_WIDTH;
            }
        }

        /**
         * Calculates the target height based on input parameters
         * @param {number} width - Requested width
         * @param {number} height - Requested height
         * @param {number} originalWidth - Original image width
         * @param {number} originalHeight - Original image height
         * @param {string} quality - Quality setting
         * @returns {number} Calculated target height
         */
        _calculateTargetHeight(width, height, originalWidth, originalHeight, quality) {
            if (quality === 'perfect' && width && height) {
                return height;
            } else if (width && !height) {
                return Math.max(1, Math.round(width * (originalHeight / originalWidth)));
            } else if (!width && height) {
                return height;
            } else if (width && height) {
                return Math.max(1, Math.round(width * (originalHeight / originalWidth)));
            } else {
                throw new Error("Output dimensions are not properly specified.");
            }
        }

        /**
         * Processes image data to generate ANSI art
         * @param {Uint8ClampedArray} data - Raw pixel data
         * @param {number} targetAnsiWidth - Target width in characters
         * @param {number} numAnsiRows - Target height in rows
         * @param {string} quality - Quality level
         * @param {string} escChar - Escape character
         * @param {string} lineEnding - Line ending character(s)
         * @returns {string} ANSI art string
         */
        _processImageData(data, targetAnsiWidth, numAnsiRows, quality, escChar, lineEnding) {
            const canvasRenderWidth = targetAnsiWidth;
            const lines = [];

            for (let yChar = 0; yChar < numAnsiRows; yChar++) {
                let currentLineAnsi = '';
                const yPxUpper = yChar * 2;
                const yPxLower = yChar * 2 + 1;

                for (let xPx = 0; xPx < canvasRenderWidth; xPx++) {
                    const upperOffset = (yPxUpper * canvasRenderWidth + xPx) * 4;
                    let rUpper = data[upperOffset];
                    let gUpper = data[upperOffset + 1];
                    let bUpper = data[upperOffset + 2];

                    const lowerOffset = (yPxLower * canvasRenderWidth + xPx) * 4;
                    let rLower = data[lowerOffset];
                    let gLower = data[lowerOffset + 1];
                    let bLower = data[lowerOffset + 2];

                    if (quality === 'low' || quality === 'medium') {
                        rUpper = this.quantizeComponent(rUpper, quality);
                        gUpper = this.quantizeComponent(gUpper, quality);
                        bUpper = this.quantizeComponent(bUpper, quality);
                        rLower = this.quantizeComponent(rLower, quality);
                        gLower = this.quantizeComponent(gLower, quality);
                        bLower = this.quantizeComponent(bLower, quality);
                    }

                    currentLineAnsi += `${escChar}[48;2;${rUpper};${gUpper};${bUpper}m${escChar}[38;2;${rLower};${gLower};${bLower}m▄`;
                }

                currentLineAnsi += `${escChar}[0m`;
                lines.push(currentLineAnsi);
            }

            return lines.join(lineEnding);
        }

        /**
         * Renders ANSI string to HTML
         * @param {string} ansiString - ANSI string to render
         * @param {HTMLElement} targetElement - Target DOM element
         * @param {Object} options - Rendering options
         * @param {string} options.defaultFg - Default foreground color
         * @param {string} options.defaultBg - Default background color
         */
        renderToHtml(ansiString, targetElement, options = {}) {
            const defaultFg = options.defaultFg || 'rgb(229, 231, 235)';
            const defaultBg = options.defaultBg || 'transparent';
            const escChar = this.escChar;

            targetElement.innerHTML = '';

            let currentFg = defaultFg;
            let currentBg = defaultBg;

            const lines = ansiString.split('\n');
            lines.forEach(line => {
                const lineDiv = document.createElement('div');
                const parts = line.split(new RegExp(`(${escChar.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\[[0-9;]*m)`, 'g'));
                let buffer = '';

                parts.forEach(part => {
                    if (part.startsWith(escChar + '[')) {
                        if (buffer.length > 0) {
                            const span = document.createElement('span');
                            span.style.color = currentFg;
                            span.style.backgroundColor = currentBg;
                            span.textContent = buffer;
                            lineDiv.appendChild(span);
                            buffer = '';
                        }

                        const code = part.slice(escChar.length + 1, -1);
                        const params = code.split(';').map(Number);

                        if (code === '0' || code === '') {
                            currentFg = defaultFg;
                            currentBg = defaultBg;
                        } else {
                            let i = 0;
                            while (i < params.length) {
                                const param = params[i];
                                if (param === 38 && params[i + 1] === 2) {
                                    currentFg = `rgb(${params[i + 2]}, ${params[i + 3]}, ${params[i + 4]})`;
                                    i += 4;
                                } else if (param === 48 && params[i + 1] === 2) {
                                    currentBg = `rgb(${params[i + 2]}, ${params[i + 3]}, ${params[i + 4]})`;
                                    i += 4;
                                }
                                i++;
                            }
                        }
                    } else if (part.length > 0) {
                        buffer += part;
                    }
                });

                if (buffer.length > 0) {
                    const span = document.createElement('span');
                    span.style.color = currentFg;
                    span.style.backgroundColor = currentBg;
                    span.textContent = buffer;
                    lineDiv.appendChild(span);
                }

                targetElement.appendChild(lineDiv);
            });
        }

        /**
         * Converts ANSI string to a printf-compatible command
         * @param {string} ansiString - ANSI string to convert
         * @param {string} escChar - Source escape character
         * @param {string} printfEsc - Target printf escape character
         * @returns {string} Printf-compatible command string
         */
        toPrintfCommand(ansiString, escChar = this.escChar, printfEsc = PRINTF_ESC) {
            const stringForPrintfContent = ansiString
                .replace(new RegExp(escChar, 'g'), printfEsc)
                .replace(/'/g, "'\\''");

            return `printf '${stringForPrintfContent}'`;
        }

        /**
         * Creates an image from a URL and converts it to ANSI
         * @param {string} url - Image URL
         * @param {Object} options - Conversion options
         * @returns {Promise<string>} Promise resolving to ANSI string
         */
        fromUrl(url, options = {}) {
            return new Promise((resolve, reject) => {
                const img = new Image();

                img.onload = () => {
                    try {
                        const result = this.convertToAnsi({
                            img: img,
                            width: options.width || DEFAULT_WIDTH,
                            height: options.height,
                            quality: options.quality || this.defaultQuality,
                            lineEnding: options.lineEnding || this.lineEnding,
                            escChar: options.escChar || this.escChar
                        });
                        resolve(result);
                    } catch (err) {
                        reject(err);
                    }
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image from URL'));
                };

                img.src = url;
            });
        }

        /**
         * Creates an image from a File object and converts it to ANSI
         * @param {File} file - Image file
         * @param {Object} options - Conversion options
         * @returns {Promise<string>} Promise resolving to ANSI string
         */
        fromFile(file, options = {}) {
            return new Promise((resolve, reject) => {
                if (!file || !file.type.startsWith('image/')) {
                    reject(new Error('Invalid file or not an image'));
                    return;
                }

                const reader = new FileReader();

                reader.onload = (e) => {
                    const img = new Image();

                    img.onload = () => {
                        try {
                            const result = this.convertToAnsi({
                                img: img,
                                width: options.width || DEFAULT_WIDTH,
                                height: options.height,
                                quality: options.quality || this.defaultQuality,
                                lineEnding: options.lineEnding || this.lineEnding,
                                escChar: options.escChar || this.escChar
                            });
                            resolve(result);
                        } catch (err) {
                            reject(err);
                        }
                    };

                    img.onerror = () => {
                        reject(new Error('Failed to load image from file'));
                    };

                    img.src = e.target.result;
                };

                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };

                reader.readAsDataURL(file);
            });
        }

        /**
         * Creates ANSI frames from multiple URLs
         * @param {string[]} urls - Array of image URLs
         * @param {Object} options - Conversion options
         * @returns {Promise<string[]>} Promise resolving to array of ANSI strings
         */
        fromMultipleUrls(urls, options = {}) {
            return Promise.all(urls.map(url => this.fromUrl(url, options)));
        }

        /**
         * Creates ANSI frames from multiple File objects
         * @param {File[]} files - Array of image files
         * @param {Object} options - Conversion options
         * @returns {Promise<string[]>} Promise resolving to array of ANSI strings
         */
        fromMultipleFiles(files, options = {}) {
            return Promise.all(files.map(file => this.fromFile(file, options)));
        }

        /**
         * Creates animation frames from various sources
         * @param {string[]|File[]} sources - Array of URLs or File objects
         * @param {Object} options - Conversion options
         * @returns {Promise<string[]>} Promise resolving to array of ANSI strings
         */
        createAnimationFrames(sources, options = {}) {
            if (!Array.isArray(sources) || sources.length === 0) {
                throw new Error('Sources must be a non-empty array');
            }

            if (typeof sources[0] === 'string') {
                return this.fromMultipleUrls(sources, options);
            } else if (sources[0] instanceof File) {
                return this.fromMultipleFiles(sources, options);
            } else {
                throw new Error('Sources must be an array of URLs or File objects');
            }
        }

        /**
         * Plays animation in HTML element
         * @param {string[]} frames - Array of ANSI frame strings
         * @param {HTMLElement} targetElement - Target DOM element
         * @param {Object} options - Animation options
         * @param {number} options.frameRate - Frames per second (default: 10)
         * @param {boolean} options.loop - Whether to loop animation (default: true)
         * @param {Object} options.renderOptions - Options for renderToHtml
         * @returns {Object} Animation control object with stop() method
         */
        playAnimation(frames, targetElement, options = {}) {
            if (!Array.isArray(frames) || frames.length === 0) {
                throw new Error('Frames must be a non-empty array');
            }

            const frameRate = options.frameRate || DEFAULT_FRAME_RATE;
            const loop = options.loop !== false;
            const renderOptions = options.renderOptions || {};
            const delay = 1000 / frameRate;

            let currentFrame = 0;
            let intervalId = null;
            let isPlaying = false;

            const playFrame = () => {
                this.renderToHtml(frames[currentFrame], targetElement, renderOptions);
                currentFrame = (currentFrame + 1) % frames.length;

                if (!loop && currentFrame === 0) {
                    this.stop();
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

    return Img2Ansi;
}));