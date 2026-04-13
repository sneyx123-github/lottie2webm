# lottie2webm

A CLI. tool to convert Lottie (.json) and dotLottie (.lottie) into WebM using [Puppeteer](https://pptr.dev/) and [FFmpeg](https://www.ffmpeg.org/).

## Usage

Ensure you have [Docker](https://www.docker.com/) installed. You can run the converter directly from Docker Hub.

```bash
docker run -it --rm -v "$(pwd):/data" mahhie393/lottie2webm -i input.json
```

The `-v "$(pwd):/data"` flag mounts your current directory to the container. Make sure you are in the same directory as your input file before running the command.

| Option | Shorthand | Description | Default |
| :--- | :--- | :--- | :--- |
| `--input` | `-i` | Path to input Lottie/dotLottie (Required) | - |
| `--output` | `-o` | Path to output WebM | `output.webm` |
| `--width` | `-w` | WebM width in pixels | `256` |
| `--height` | `-h` | WebM height in pixels | `256` |
| `--fps` | `-f` | WebM frames per second | Input default |
| `--background` | `-b` | WebM background colour (e.g.: `#ffffff`, `white`) | `transparent` |

## License

This project is licensed under ISC. License.
