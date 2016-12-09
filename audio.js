// audio.js
'use strict';

const gainCtl = document.getElementById('gain');
const fftSCtl = document.getElementById('fftSize');
const specX = document.getElementById('spectrumX');
const specY = document.getElementById('spectrumY');
const freqData = document.getElementById('freqData');

const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
const gain = audioCtx.createGain();

let sX = 512, sY = 256; // used for user spectrum size control
const updateFreqData = () => freqData.innerHTML = 'range: 0 - ' + sY * (audioCtx.sampleRate / analyser.fftSize) + ' Hz';

updateFreqData();
// user-controlled gain
gainCtl.addEventListener('input', e => {
    gain.gain.value = e.target.value;
}, false);

// user-controlled fft size
let wave = new Uint8Array(analyser.fftSize);
let spec = new Uint8Array(analyser.fftSize);
fftSCtl.addEventListener('input', e => {
    analyser.fftSize = 1 << fftSCtl.value;
    if (sY > analyser.fftSize) {
        sY = analyser.fftSize;
        specY.value = sY;
    }
    wave = new Uint8Array(analyser.fftSize);
    spec = new Uint8Array(analyser.fftSize);
    updateFreqData();
}, false);

// user-controlled spectrum size

specX.addEventListener('change', e => {
    let num = Number(e.target.value)
    if (num !== NaN && num > 0) {
        sX = num;
    } else {
        sX = 1;
    }
}, false);

specY.addEventListener('change', e => {
    let num = Number(e.target.value)
    if (num > 0 && num <= analyser.fftSize && num !== NaN) {
        sY = num;
    
    } else if (num < 1 && num !== NaN) {
        sY = 1;
    } else {
        sY = analyser.fftSize;
    }
    updateFreqData();
}, false); 

const audCapture = navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(mediaStream => {
    let audioStream = audioCtx.createMediaStreamSource(mediaStream);
    audioStream.connect(gain);
    gain.connect(analyser);
}).catch(e => console.log('There was an error on audio capture.'));

analyser.fftSize = 1 << fftSCtl.value;

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
    const divisions = sY;
    const samples = sX;
    const divH = h / divisions;
    const divW = w / samples;
    ctx.clearRect(m * divW, 0, Math.ceil(divW), h);
    for (let i = 0; i < divisions; i++) {
        ctx.fillStyle = colorRender(data[i]);
        ctx.fillRect(Math.floor(m * divW), (divisions - i) * divH, Math.ceil(divW) + 1, -divH);
    }
    if (m < samples) {
        m += 1;
    } else {
        m = 0;
        // ctx.clearRect(0, 0, w, h);
    }
}

const display = () => {
    analyser.getByteTimeDomainData(wave);
    analyser.getByteFrequencyData(spec);

    drawFrameOsc(wave, ctx_osc, canvasOsci.width, canvasOsci.height);
    ctx_osc.fillText('samples: ' + analyser.fftSize, 5, 10);
    ctx_osc.fillText(audioCtx.sampleRate + ' Hz', 5, canvasOsci.height - 5);
    drawFrameSpc(spec, ctx_spc, canvasSpec.width, canvasSpec.height);
    window.requestAnimationFrame(display);
}

display();