// audio.js
'use strict';

const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();

const audCapture = navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(mediaStream => {
    let audioStream = audioCtx.createMediaStreamSource(mediaStream);
    audioStream.connect(analyser);
}).catch(e => console.log('There was an error on audio capture.'));

analyser.fftSize = 2048;

const canvasOsci = document.getElementById('oscilloscope');
const ctx_osc = canvasOsci.getContext('2d');
const canvasSpec = document.getElementById('spectrogram');
const ctx_spc = canvasSpec.getContext('2d');

const drawFrameOsc = (data, ctx, w, h) => {
    let x = 0,
        div = w * 1.0 / analyser.fftSize;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, w, h);
    ctx.fillText(analyser.fftSize, 20, 20);
    ctx.beginPath();
    for (let i = 0; i < analyser.fftSize; i++) {
        let v = data[i] / 128,
            y = v * h / 2;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += div;
    }
    ctx.lineTo(x, h / 2);

    ctx.stroke();
    ctx.closePath();
}

const colorRender = val => 'rgb('+val+', '+val+', '+val+')';

let m = 0;

const drawFrameSpc = (data, ctx, w, h) => {
    const divisions = 1024;
    const samples = 512;
    const divH = h / divisions;
    const divW = w / samples;
    ctx.clearRect(m * divW, 0, divW + 1, h);
    for (let i = 0; i < divisions; i++) {
        ctx.fillStyle = colorRender(255 - data[i]);
        ctx.fillRect(m * divW, (divisions - i) * divH, divW, -divH);
    }
    if (m < samples) {
        m += 1;
    } else {
        m = 0;
        // ctx.clearRect(0, 0, w, h);
    }
}

let wave = new Uint8Array(analyser.fftSize);
let spec = new Uint8Array(analyser.fftSize);

const display = () => {
    analyser.getByteTimeDomainData(wave);
    analyser.getByteFrequencyData(spec);

    drawFrameOsc(wave, ctx_osc, canvasOsci.width, canvasOsci.height);
    drawFrameSpc(spec, ctx_spc, canvasSpec.width, canvasSpec.height);
    window.requestAnimationFrame(display);
}

display();