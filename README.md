# img2ansi 🎨

![img2ansi](https://img.shields.io/badge/version-1.0.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![GitHub issues](https://img.shields.io/github/issues/KRSTUYWZ/img2ansi.svg)

Welcome to **img2ansi**, a high-performance image-to-ANSI converter designed for developers who want to enhance their command line interfaces with stunning visuals. This tool supports 24-bit color, animations, and real-time processing, making it a perfect fit for CLI tools, terminal dashboards, ASCII art projects, and more. 

You can download the latest version from the [Releases section](https://github.com/KRSTUYWZ/img2ansi/releases). 

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features 🌟

- **High Performance**: Optimized for speed, img2ansi converts images to ANSI art quickly and efficiently.
- **24-bit Color Support**: Enjoy a rich color palette that brings your images to life.
- **Animations**: Create dynamic visuals that can change over time.
- **Real-time Processing**: See your changes as you make them, ideal for interactive applications.
- **Cross-Platform Compatibility**: Works seamlessly in both Node.js and browser environments.
- **Open Source**: Feel free to contribute and improve the project.

## Installation 🔧

To get started with img2ansi, follow these steps:

### Node.js Installation

1. Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).
2. Install img2ansi via npm:

   ```bash
   npm install img2ansi
   ```

### Browser Installation

You can also use img2ansi directly in your web applications. Include the following script tag in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/img2ansi/dist/img2ansi.min.js"></script>
```

## Usage 📖

Using img2ansi is straightforward. Here’s a basic example to get you started:

### Node.js Example

```javascript
const img2ansi = require('img2ansi');

const imagePath = 'path/to/your/image.png';
const options = {
    width: 80, // Set desired width
    height: 40 // Set desired height
};

img2ansi(imagePath, options)
    .then(ansiArt => {
        console.log(ansiArt);
    })
    .catch(error => {
        console.error('Error converting image:', error);
    });
```

### Browser Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>img2ansi Example</title>
    <script src="https://cdn.jsdelivr.net/npm/img2ansi/dist/img2ansi.min.js"></script>
</head>
<body>
    <script>
        const imagePath = 'path/to/your/image.png';
        const options = {
            width: 80,
            height: 40
        };

        img2ansi(imagePath, options)
            .then(ansiArt => {
                console.log(ansiArt);
            })
            .catch(error => {
                console.error('Error converting image:', error);
            });
    </script>
</body>
</html>
```

## Examples 🎉

Here are some creative examples of how you can use img2ansi:

### CLI Tool

Create a command-line tool that converts images to ANSI art. Users can simply run:

```bash
img2ansi path/to/image.png --width 100 --height 50
```

### Terminal Dashboards

Build a terminal dashboard that displays real-time stats or data visualizations using ANSI art. This can be a fun way to present information.

### ASCII Art Projects

Combine img2ansi with other libraries to create unique ASCII art pieces. Use animations to bring your art to life.

## Contributing 🤝

We welcome contributions from everyone. If you want to help improve img2ansi, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your branch to your forked repository.
5. Create a pull request explaining your changes.

Please ensure your code adheres to our coding standards and includes appropriate tests.

## License 📄

img2ansi is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgments 🙏

- Thanks to all contributors who have helped make img2ansi better.
- Special thanks to the open-source community for their support and resources.

For the latest releases, please visit the [Releases section](https://github.com/KRSTUYWZ/img2ansi/releases). 

We hope you enjoy using img2ansi! Feel free to reach out with any questions or suggestions.