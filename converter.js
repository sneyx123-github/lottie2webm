#!/usr/bin/env node

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const admzip = require('adm-zip');
const cliprogress = require('cli-progress');
const commander = require('commander');
const puppeteer = require('puppeteer');

function parseint(value) { return parseInt(value, 10) };

commander.program.requiredOption('-i, --input <path>', 'Input');
commander.program.option('-o, --output <path>', 'Output', 'output.webm');
commander.program.option('-w, --width <number>', 'Width', parseint, 256);
commander.program.option('-h, --height <number>', 'Height', parseint, 256);
commander.program.option('-f, --fps <number>', 'FPS.', parseint);
commander.program.option('-b, --background <color>', 'Background', 'transparent');
commander.program.parse(process.argv);

const options = commander.program.opts();

(async () => {

    const browser = await puppeteer.launch({ args : ['--no-sandbox'] });
    const page = await browser.newPage();

    const buffer = fs.readFileSync(options.input);
    const extension = path.extname(options.input);

    let data;

    if (extension === '.lottie') {

        const zip = new admzip(buffer);
        const manifest = JSON.parse(zip.readAsText('manifest.json'));
        data = JSON.parse(zip.readAsText(`animations/${manifest.animations[0].id}.json`));
    
    }

    else {

        data = JSON.parse(buffer.toString('utf8'));

    }

    const start = data.ip || 0;
    const end = data.op;
    const fps = options.fps || data.fr || 30;

    const progress = new cliprogress.SingleBar({}, cliprogress.Presets.shades_classic);

    const html = `
        <html>
            <body style="margin:0; background: ${ options.background };">
                <div id="lottie" style="width:${ options.width }px; height:${ options.height }px;"></div>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
                <script>
                    window.animation = lottie.loadAnimation({
                        container : document.getElementById('lottie'),
                        renderer : 'svg',
                        loop : false,
                        autoplay : false,
                        animationData : ${ JSON.stringify(data) }
                    });
                </script>
            </body>
        </html>
    `;

    await page.setContent(html);

    await page.evaluate(() => {
        document.documentElement.style.background = 'transparent';
	document.body.style.background = 'transparent';
    });

    await page.setViewport({ width : options.width, height : options.height });
    await page.waitForFunction(() => typeof (window.animation !== 'undefined'));
    
    //const ffmpeg = child_process.spawn('ffmpeg', [
    //    '-y', '-f', 'image2pipe', '-vcodec', 'png', '-r', fps.toString(), '-i', '-',
    //    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0', options.output
    //]);

    const ffmpeg = child_process.spawn('ffmpeg', [
        '-y', 
        '-f', 'image2pipe', 
        '-vcodec', 'png', 
        '-r', fps.toString(), 
        '-i', '-',
        // Use QTRLE (QuickTime Animation) which supports Alpha natively
        '-c:v', 'qtrle', 
        '-pix_fmt', 'argb',
        options.output.replace('.webm', '.mov') // Change output to .mov
    ]);

    const promise = new Promise((resolve) => { ffmpeg.on('close', resolve); });

    progress.start(end, start);

    for (let i = start; i <= end; i++) {

        await page.evaluate((frame) => { window.animation.goToAndStop(frame, true); }, i);
        const screenshot = await page.screenshot({ type : 'png', omitBackground : (options.background === 'transparent') });
    	//const screenshot = await page.screenshot({ path: 'test_frame.png', type: 'png', omitBackground: true });
        ffmpeg.stdin.write(screenshot);

        progress.update(i)

    }

    ffmpeg.stdin.end();
    progress.stop();

    await promise;
    await browser.close();

})();
