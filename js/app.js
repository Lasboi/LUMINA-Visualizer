// ==========================================
// 1. DOM ELEMENTS & VARIABLES
// ==========================================
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const container = document.getElementById('container');

// Top Navigation Elements
const backBtn = document.getElementById('backBtn');
const volumeControl = document.getElementById('volumeControl');
const volumeSlider = document.getElementById('volumeSlider');
const muteIcon = document.getElementById('muteIcon');

// Methods Elements
const radioSelect = document.getElementById('radioSelect');
const playRadioBtn = document.getElementById('playRadioBtn');
const audioUpload = document.getElementById('audioUpload');
const filePlaySection = document.getElementById('filePlaySection');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const playSelectedBtn = document.getElementById('playSelectedBtn');
const startBtn = document.getElementById('startBtn');

// Global Audio Engine Context 
// (Created immediately to allow global touch unlocking)
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const globalGainNode = audioContext.createGain();
globalGainNode.gain.value = 1; // Default Volume
globalGainNode.connect(audioContext.destination);
const analyser = audioContext.createAnalyser();
analyser.fftSize = 512;
analyser.connect(globalGainNode);

let sourceNode = null; 
let activeAudioElement = null;
let selectedFile = null;
let isMuted = false;
let previousVolume = 1; 
let time = 0;             
let figureRotation = 0;   
let animationId; 

// ==========================================
// THE GLOBAL TOUCH UNLOCKER (MOBILE FIX)
// ==========================================
// This instantly binds to ANY touch on the screen. 
// It guarantees the OS hardware wakes up before the user even hits play.
let isAudioUnlocked = false;
function unlockAudio() {
    if (isAudioUnlocked) return;
    
    // Force resume the context
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // Play a blank, 0-second buffer to initialize mobile speakers
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const unlockSource = audioContext.createBufferSource();
    unlockSource.buffer = buffer;
    unlockSource.connect(audioContext.destination);
    unlockSource.start(0);
    
    isAudioUnlocked = true;
    
    // Remove listeners once unlocked to save CPU
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('click', unlockAudio);
}
document.addEventListener('touchstart', unlockAudio, { passive: true });
document.addEventListener('click', unlockAudio, { passive: true });


// ==========================================
// 2. CANVAS SETUP
// ==========================================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); 

const focalLength = 900;
const camZ = -1400; 
function project(x, y, z) {
    const rz = z - camZ;
    if (rz <= 0) return null; 
    const scale = focalLength / rz;
    return { x: (canvas.width / 2) + (x * scale), y: (canvas.height / 2) + (y * scale), scale: scale };
}

// ==========================================
// 3. SHAPE GENERATION
// ==========================================
const TOTAL_POINTS = 2000;
const BASE_RADIUS = 350;
const shapes = [];
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

let sphere = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let phi = Math.acos(1 - 2 * t); let theta = Math.PI * (1 + Math.sqrt(5)) * i; sphere.push({ x: Math.sin(phi) * Math.cos(theta), y: Math.sin(phi) * Math.sin(theta), z: Math.cos(phi) }); } shapes.push(sphere);
let torus = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let theta = t * Math.PI * 2 * 40; let phi = t * Math.PI * 2; let R = 0.7, r = 0.3; torus.push({ x: (R + r * Math.cos(theta)) * Math.cos(phi), y: (R + r * Math.cos(theta)) * Math.sin(phi), z: r * Math.sin(theta) }); } shapes.push(torus);
let hourglass = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let theta = t * Math.PI * 2 * 50; let y = (t - 0.5) * 2; let r = 0.2 + (y * y); hourglass.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) }); } shapes.push(hourglass);
let dna = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let theta = t * Math.PI * 2 * 10; let y = (t - 0.5) * 2.5; let offset = (i % 2 === 0) ? 0 : Math.PI; dna.push({ x: 0.4 * Math.cos(theta + offset), y: y, z: 0.4 * Math.sin(theta + offset) }); } shapes.push(dna);
let infinity = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = (i / (TOTAL_POINTS - 1)) * Math.PI * 2; infinity.push({ x: (Math.sin(t) + 2 * Math.sin(2 * t)) * 0.3, y: (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.3, z: (-Math.sin(3 * t)) * 0.3 }); } shapes.push(infinity);
let lotus = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let theta = t * Math.PI * 2 * 45; let r = t * (1 + 0.4 * Math.sin(theta * 0.15)); let y = 1.2 - (t * 2.4); lotus.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) }); } shapes.push(lotus);
let torusKnot = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = (i / (TOTAL_POINTS - 1)) * Math.PI * 2; let r = 0.4 * (2 + Math.cos(3 * t)); torusKnot.push({ x: r * Math.cos(2 * t), y: r * Math.sin(2 * t), z: 0.4 * Math.sin(3 * t) }); } shapes.push(torusKnot);
let heart = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = (i / (TOTAL_POINTS - 1)) * Math.PI * 2; let x = 0.05 * 16 * Math.pow(Math.sin(t), 3); let y = -0.05 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); let z = Math.sin(t * 15) * 0.15; heart.push({ x: x, y: y, z: z }); } shapes.push(heart);
let mobius = []; for (let i = 0; i < TOTAL_POINTS; i++) { let u = ((i % 100) / 100) * Math.PI * 2; let v = (Math.floor(i / 100) / (TOTAL_POINTS / 100)) * 2 - 1; let scale = 0.6; let x = scale * (1 + 0.5 * v * Math.cos(u / 2)) * Math.cos(u); let y = scale * (1 + 0.5 * v * Math.cos(u / 2)) * Math.sin(u); let z = scale * 0.5 * v * Math.sin(u / 2); mobius.push({ x: x, y: y, z: z }); } shapes.push(mobius);
let crystal = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let phi = Math.acos(1 - 2 * t); let theta = Math.PI * (1 + Math.sqrt(5)) * i; let r = 0.6 + 0.4 * Math.sin(phi * 20) * Math.sin(theta * 20); crystal.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) }); } shapes.push(crystal);
let vortex = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let r = t; let theta = t * Math.PI * 30; let y = Math.sin(i * 1234.5) * 0.15 * t; vortex.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) }); } shapes.push(vortex);
let cylinder = []; let CYL_RINGS = 50; let PTS_PER_RING = TOTAL_POINTS / CYL_RINGS; for (let i = 0; i < TOTAL_POINTS; i++) { let u = ((i % PTS_PER_RING) / PTS_PER_RING) * Math.PI * 2; let v = (Math.floor(i / PTS_PER_RING) / CYL_RINGS) * 2 - 1; cylinder.push({ x: 0.6 * Math.cos(u), y: v, z: 0.6 * Math.sin(u) }); } shapes.push(cylinder);
let wave = []; for (let i = 0; i < TOTAL_POINTS; i++) { let u = ((i % 45) / 45) * 2 - 1; let v = ((Math.floor(i / 45)) / 45) * 2 - 1; let y = Math.sin(u * Math.PI * 3) * Math.cos(v * Math.PI * 3) * 0.2; wave.push({ x: u, y: y, z: v }); } shapes.push(wave);
let spinningTop = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); if (t < 0.15) { let stemT = t / 0.15; let y = -1.5 + stemT * 1.0; let r = 0.05; let theta = stemT * Math.PI * 20; spinningTop.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) }); } else { let bloomT = (t - 0.15) / 0.85; let theta = bloomT * Math.PI * 70; let envelope = Math.sin(bloomT * Math.PI); let petals = 1 + 0.35 * Math.sin(theta * 0.12); let r = envelope * petals * 1.3; let y = -0.5 + bloomT * 1.8 - (r * 0.3); spinningTop.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) }); } } shapes.push(spinningTop);
let trueRose = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let x = 0, y = 0, z = 0; if (t < 0.10) { let u = t / 0.10; let theta = u * Math.PI * 30; let r = 0.04; x = r * Math.cos(theta); z = r * Math.sin(theta); y = -1.5 + u * 1.0; } else if (t < 0.16) { let u = (t - 0.10) / 0.06; x = -0.8 * Math.sin(u * Math.PI); y = -0.8 + 0.5 * u + 0.2 * Math.sin(u * Math.PI); z = 0.25 * Math.sin(u * Math.PI * 2); } else if (t < 0.22) { let u = (t - 0.16) / 0.06; x = 0.8 * Math.sin(u * Math.PI); y = -0.5 + 0.5 * u + 0.2 * Math.sin(u * Math.PI); z = -0.25 * Math.sin(u * Math.PI * 2); } else if (t < 0.25) { let u = (t - 0.22) / 0.03; let theta = u * Math.PI * 10; let r = 0.04; x = r * Math.cos(theta); z = r * Math.sin(theta); y = -0.3 + u * 0.2; } else { let u = (t - 0.25) / 0.75; let turns = 14; let theta = u * Math.PI * 2 * turns; let baseR = 1.35 * Math.pow(1 - u, 0.7); let petalWave = Math.abs(Math.sin(theta * 2)); let r = baseR * (0.75 + 0.25 * petalWave); let bowl = Math.pow(u, 0.6); y = -0.1 + bowl * 1.2; y += 0.15 * petalWave * (1 - u); x = r * Math.cos(theta); z = r * Math.sin(theta); } trueRose.push({ x: x, y: y, z: z }); } shapes.push(trueRose);
let christmasTree = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let x = 0, y = 0, z = 0; if (t < 0.08) { let u = t / 0.08; let theta = u * Math.PI * 30; let r = 0.15; x = r * Math.cos(theta); z = r * Math.sin(theta); y = -1.3 + u * 0.5; } else if (t < 0.92) { let u = (t - 0.08) / 0.84; let tier = Math.floor(u * 3); if (tier > 2) tier = 2; let localU = (u * 3) - tier; let baseY = [-0.8, -0.25, 0.35][tier]; let endY = [-0.05, 0.5, 1.0][tier]; y = baseY + localU * (endY - baseY); let maxR = [1.3, 0.95, 0.6][tier]; let endR = [0.2, 0.1, 0.0][tier]; let r = maxR - localU * (maxR - endR); if (localU < 0.15) { let curve = Math.sin((localU / 0.15) * Math.PI); y -= curve * 0.15; r += curve * 0.10; } let theta = u * Math.PI * 150; let ornaments = Math.sin(theta * 4) * 0.02; r += ornaments; x = r * Math.cos(theta); z = r * Math.sin(theta); } else { let u = (t - 0.92) / 0.08; let theta = u * Math.PI * 2 * 10; let starR = 0.05 + 0.30 * Math.pow(Math.cos(2.5 * theta), 2); x = starR * Math.cos(theta); y = 1.25 + starR * Math.sin(theta); z = Math.sin(theta * 3) * 0.05; } christmasTree.push({ x: x, y: y, z: z }); } shapes.push(christmasTree);
let solarFlare = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let theta = t * Math.PI * 2 * 150; let scratchNoise = Math.sin(theta * 3.14) * 0.12 * Math.sin(t * Math.PI * 80); let phi = Math.acos(1 - 2 * t); let r = 0.9 + scratchNoise; solarFlare.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) }); } shapes.push(solarFlare);
let quantumCore = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let theta = t * Math.PI * 2 * 90; let phi = t * Math.PI * 2 * 6; let r = 0.65 + 0.35 * Math.sin(theta * 8) * Math.cos(phi * 5); quantumCore.push({ x: r * Math.cos(theta) * Math.sin(phi), y: r * Math.sin(theta) * Math.sin(phi), z: r * Math.cos(phi) }); } shapes.push(quantumCore);
let iris = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let theta = t * Math.PI * 2 * 60; let r = 0.95 * Math.abs(Math.sin(t * Math.PI * 250)); let z = 0.15 * Math.sin(t * Math.PI * 40); iris.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: z }); } shapes.push(iris);
let blackHole = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let theta = t * Math.PI * 2 * 120; let r = 1.6 * Math.pow(t, 1.2); let y = -0.8 / (r + 0.15) + 0.6; let wobble = Math.sin(theta * 3) * 0.05; blackHole.push({ x: (r + wobble) * Math.cos(theta), y: y, z: (r + wobble) * Math.sin(theta) }); } shapes.push(blackHole);
let hyperTorus = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let u = t * Math.PI * 2 * 45; let v = t * Math.PI * 2; let r = 0.8 + 0.4 * Math.cos(u); let x = r * Math.cos(v); let y = r * Math.sin(v); let z = 0.5 * Math.sin(u) + 0.3 * Math.sin(v * 2); hyperTorus.push({ x, y, z }); } shapes.push(hyperTorus);
let glitch = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let phi = Math.acos(1 - 2 * t); let theta = Math.PI * (1 + Math.sqrt(5)) * i; let isGlitch = (Math.sin(i * 137.5) > 0.85) ? 1.6 : 1.0; let r = 0.7 * isGlitch; glitch.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) }); } shapes.push(glitch);
let pulsar = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1); let phi = Math.acos(1 - 2 * t); let theta = Math.PI * (1 + Math.sqrt(5)) * i; let spikes = Math.abs(Math.sin(theta * 6) * Math.cos(phi * 6)); let r = 0.4 + 0.9 * Math.pow(spikes, 1.5); pulsar.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) }); } shapes.push(pulsar);
let atlas = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 60, v = t * Math.PI * 2 * 4; let r = 1.0 + 0.3 * Math.sin(u * 2) * Math.cos(v * 3); atlas.push({ x: r * Math.cos(u), y: 0.5 * Math.sin(v * 4), z: r * Math.sin(u) }); } shapes.push(atlas);
let bloodRune = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 40; let r = 0.8 * Math.sign(Math.cos(theta * 4)) * Math.sqrt(Math.abs(Math.cos(theta * 4))); let y = 0.8 * Math.sin(theta * 3) + 0.1 * Math.sin(t * 1000); bloodRune.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) }); } shapes.push(bloodRune);
let hellforge = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 80; let r = 0.5 + 0.7 * Math.abs(Math.sin(u * 2.5)); let twist = t * Math.PI * 4; hellforge.push({ x: r * Math.cos(u + twist), y: 1.5 * (t - 0.5) * Math.sin(u * 5), z: r * Math.sin(u + twist) }); } shapes.push(hellforge);
let collider = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 100; let x = Math.max(-0.7, Math.min(0.7, 1.2 * Math.cos(u))); let y = Math.max(-0.7, Math.min(0.7, 1.2 * Math.sin(u))); let z = 0.7 * Math.sin(t * Math.PI * 20); collider.push({ x, y, z }); } shapes.push(collider);
let tesseract = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 50; let r = 0.9 / (Math.abs(Math.cos(u)) + Math.abs(Math.sin(u))); let z = 0.9 * Math.sin(t * Math.PI * 15); tesseract.push({ x: r * Math.cos(u), y: r * Math.sin(u), z: z }); } shapes.push(tesseract);
let wormhole = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 150; let z = 2.0 * (t - 0.5); let r = 0.2 + 1.2 * Math.pow(Math.abs(z), 2); wormhole.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: z }); } shapes.push(wormhole);
let liquidMetal = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), phi = Math.acos(1 - 2 * t), theta = Math.PI * 100 * t; let r = 0.7 + 0.3 * Math.sin(phi * 4) * Math.cos(theta * 3); liquidMetal.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) }); } shapes.push(liquidMetal);
let crystalShard = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 40; let r = 0.6 / (Math.abs(Math.cos(u * 3)) + Math.abs(Math.sin(u * 3))); let y = 1.2 * (t - 0.5) * (2.0 - r); crystalShard.push({ x: r * Math.cos(u), y: y, z: r * Math.sin(u) }); } shapes.push(crystalShard);
let galaxy = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 20; let r = 1.5 * Math.pow(t, 0.5); let wobble = Math.sin(theta * 100) * 0.05; galaxy.push({ x: (r + wobble) * Math.cos(theta - r * 3), y: 0.2 * Math.sin(theta * 5) * (1-t), z: (r + wobble) * Math.sin(theta - r * 3) }); } shapes.push(galaxy);
let jellyfish = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 80; let isCap = (t < 0.3); let r = isCap ? 0.8 * Math.sin((t / 0.3) * Math.PI) : 0.6 * Math.cos(theta * 8) * (1 - t); let y = isCap ? -0.5 + Math.cos((t / 0.3) * Math.PI * 0.5) : -0.5 - 1.5 * ((t - 0.3) / 0.7); jellyfish.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) }); } shapes.push(jellyfish);
let magneticField = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 60, v = t * Math.PI * 2 * 2; let r = 0.9 * Math.cos(u); magneticField.push({ x: r * Math.cos(v), y: 1.2 * Math.sin(u), z: r * Math.sin(v) }); } shapes.push(magneticField);
let supernova = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), phi = Math.acos(1 - 2 * t), theta = Math.PI * 150 * t; let explode = 1.0 + 0.4 * Math.sin(theta * 10) * Math.sin(phi * 10); supernova.push({ x: explode * Math.sin(phi) * Math.cos(theta), y: explode * Math.sin(phi) * Math.sin(theta), z: explode * Math.cos(phi) }); } shapes.push(supernova);
let dnaMutation = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 30; let offset = (i % 2 === 0) ? 0 : Math.PI; let r = 0.5 + 0.2 * Math.sin(t * Math.PI * 10); dnaMutation.push({ x: r * Math.cos(theta + offset), y: 2.0 * (t - 0.5), z: r * Math.sin(theta + offset) }); } shapes.push(dnaMutation);
let holoCube = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 150; let x = 0.8 * Math.cos(u) * Math.pow(Math.abs(Math.cos(u)), 0.1); let z = 0.8 * Math.sin(u) * Math.pow(Math.abs(Math.sin(u)), 0.1); let y = 1.2 * (t - 0.5) * Math.sign(Math.sin(u * 5)); holoCube.push({ x, y, z }); } shapes.push(holoCube);
let sonicWave = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 50; let r = 0.7 + 0.3 * Math.sin(u * 12) * Math.cos(t * Math.PI * 20); sonicWave.push({ x: r * Math.cos(u), y: 1.5 * (t - 0.5), z: r * Math.sin(u) }); } shapes.push(sonicWave);
let infinityMirror = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 4; let x = Math.sin(3 * u + Math.PI / 4) * 1.2; let y = Math.sin(4 * u) * 1.0; let z = Math.cos(5 * u) * 0.8; infinityMirror.push({ x, y, z }); } shapes.push(infinityMirror);
let sacredHalo = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 100; let ringIndex = Math.floor(t * 3); let r = 0.6 + ringIndex * 0.3; let tilt = ringIndex * (Math.PI / 3); let x = r * Math.cos(u); let z = r * Math.sin(u) * Math.cos(tilt); let y = r * Math.sin(u) * Math.sin(tilt); sacredHalo.push({ x, y, z }); } shapes.push(sacredHalo);
let timeGlass = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 100; let y = 1.5 * (t - 0.5); let r = 0.1 + 1.2 * Math.pow(Math.abs(y), 1.5); timeGlass.push({ x: r * Math.cos(u), y: y, z: r * Math.sin(u) }); } shapes.push(timeGlass);
let atomCore = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 120; let orbit = Math.floor(t * 4); let x = Math.cos(u), y = Math.sin(u), z = 0; if (orbit === 1) { z = y; y = 0; } if (orbit === 2) { z = x; x = 0; } if (orbit === 3) { let temp = x; x = y * 0.7; y = temp * 0.7; z = Math.sin(u); } atomCore.push({ x, y, z }); } shapes.push(atomCore);
let cyberTornado = []; for (let i = 0; i < TOTAL_POINTS; i++) { let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 60; let r = 0.2 + 1.2 * t; let x = r * Math.cos(u) * Math.pow(Math.abs(Math.cos(u)), 0.1); let z = r * Math.sin(u) * Math.pow(Math.abs(Math.sin(u)), 0.1); cyberTornado.push({ x, y: 1.5 * (t - 0.5), z }); } shapes.push(cyberTornado);

// --- STARFIELD GENERATOR ---
const stars = [];
const NUM_STARS = 1500;
for (let i = 0; i < NUM_STARS; i++) {
    stars.push({ x: (Math.random() - 0.5) * 6000, y: (Math.random() - 0.5) * 6000, z: Math.random() * 6000 });
}

let lastCycle = -1;
let fromIndex = Math.floor(Math.random() * shapes.length);
let toIndex = Math.floor(Math.random() * shapes.length);
if (fromIndex === toIndex) toIndex = (toIndex + 1) % shapes.length;

// ==========================================
// 4. CORE AUDIO ENGINE & NAVIGATION
// ==========================================

function cleanup() {
    cancelAnimationFrame(animationId);
    
    if (sourceNode) {
        try { sourceNode.stop(); } catch(e) {}
        try { sourceNode.disconnect(); } catch(e) {}
        sourceNode = null;
    }
    
    if (activeAudioElement) {
        activeAudioElement.pause();
        activeAudioElement.removeAttribute('src'); 
        activeAudioElement.load();
        activeAudioElement = null;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function returnToMenu() {
    cleanup();
    container.style.display = 'block';
    backBtn.style.display = 'none';
    volumeControl.style.display = 'none'; 
    filePlaySection.style.display = 'none';
    
    playRadioBtn.innerText = "Play Radio & Visualize";
    playRadioBtn.disabled = false;
    playSelectedBtn.innerText = "Play File & Visualize";
    playSelectedBtn.disabled = false;
}
backBtn.addEventListener('click', returnToMenu);

// --- VOLUME SLIDER LOGIC ---
volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    
    if (globalGainNode) globalGainNode.gain.value = vol;
    if (activeAudioElement) activeAudioElement.volume = vol;
    
    muteIcon.className = vol === 0 ? 'fa-solid fa-volume-xmark' : 
                         vol < 0.5 ? 'fa-solid fa-volume-low' : 
                         'fa-solid fa-volume-high';
                         
    isMuted = vol === 0;
    if (!isMuted) previousVolume = vol; 
});

muteIcon.addEventListener('click', () => {
    if (isMuted) {
        isMuted = false;
        volumeSlider.value = previousVolume > 0 ? previousVolume : 1;
        if (globalGainNode) globalGainNode.gain.value = volumeSlider.value;
        if (activeAudioElement) activeAudioElement.volume = volumeSlider.value;
        muteIcon.className = volumeSlider.value < 0.5 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
    } else {
        isMuted = true;
        previousVolume = volumeSlider.value;
        volumeSlider.value = 0;
        if (globalGainNode) globalGainNode.gain.value = 0;
        if (activeAudioElement) activeAudioElement.volume = 0;
        muteIcon.className = 'fa-solid fa-volume-xmark';
    }
});

function startVisuals() {
    container.style.display = 'none';
    backBtn.style.display = 'flex';
    volumeControl.style.display = 'flex';
    draw();
}

// ==========================================
// METHOD 1: LIVE RADIO
// ==========================================
playRadioBtn.addEventListener('click', () => {
    cleanup();
    
    // Resume context if needed
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const originalText = playRadioBtn.innerText;
    playRadioBtn.innerText = "Connecting...";
    playRadioBtn.disabled = true;

    activeAudioElement = new Audio();
    activeAudioElement.crossOrigin = "anonymous"; 
    activeAudioElement.src = radioSelect.value;
    activeAudioElement.volume = parseFloat(volumeSlider.value);
    
    sourceNode = audioContext.createMediaElementSource(activeAudioElement);
    sourceNode.connect(analyser);

    activeAudioElement.play().then(() => {
        startVisuals();
        playRadioBtn.innerText = originalText;
        playRadioBtn.disabled = false;
    }).catch(err => {
        alert("The browser blocked playback. CORS or mobile Autoplay policy.");
        playRadioBtn.innerText = "Play Radio & Visualize";
        playRadioBtn.disabled = false;
    });
});


// ==========================================
// METHOD 2: LOCAL AUDIO FILE (FileReader Decoder)
// ==========================================
// We use FileReader instead of objectURL to guarantee Android compatibility
audioUpload.addEventListener('change', function() {
    selectedFile = this.files[0];
    if (!selectedFile) return;

    fileNameDisplay.innerText = "File Ready: " + selectedFile.name;
    filePlaySection.style.display = 'block';
});

playSelectedBtn.addEventListener('click', () => {
    if (!selectedFile) return;

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    cleanup();

    const originalBtnText = playSelectedBtn.innerText;
    playSelectedBtn.innerText = "Decoding audio...";
    playSelectedBtn.disabled = true;

    // Use FileReader to read the file entirely in memory before decoding.
    // This removes any dependencies on HTML5 Audio elements, eliminating mobile muting.
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const audioData = e.target.result;
            const decodedBuffer = await audioContext.decodeAudioData(audioData);
            
            sourceNode = audioContext.createBufferSource();
            sourceNode.buffer = decodedBuffer;
            sourceNode.connect(analyser);
            sourceNode.start(0);

            startVisuals();
            
            sourceNode.onended = () => {
                returnToMenu();
            };
        } catch (err) {
            alert("Could not decode audio. The format might be unsupported.");
            playSelectedBtn.innerText = "Play File & Visualize";
            playSelectedBtn.disabled = false;
        }
    };
    
    reader.onerror = function() {
        alert("Error reading file.");
        playSelectedBtn.innerText = "Play File & Visualize";
        playSelectedBtn.disabled = false;
    };

    reader.readAsArrayBuffer(selectedFile);
});


// ==========================================
// METHOD 3: SCREEN SHARE (Desktop Only)
// ==========================================
startBtn.addEventListener('click', async () => {
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        cleanup();

        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        stream.getVideoTracks()[0].onended = () => {
            returnToMenu();
        };

        sourceNode = audioContext.createMediaStreamSource(stream);
        sourceNode.connect(analyser);
        
        startVisuals();
    } catch (err) {
        alert("Audio stream not found. Please click 'Connect Audio' again and remember to toggle 'Share tab audio'.");
    }
});


// ==========================================
// 5. MAIN ANIMATION DRAW LOOP
// ==========================================
function draw() {
    animationId = requestAnimationFrame(draw);
    time += 0.015; 
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let bassSum = 0;
    for (let i = 1; i <= 5; i++) bassSum += dataArray[i];
    let bassPunch = Math.pow((bassSum / 5) / 255, 3);

    figureRotation += 0.002 + (bassPunch * 0.015);

    const CYCLE_LENGTH = 10;
    const HOLD_LENGTH = 6;
    let currentCycle = Math.floor(time / CYCLE_LENGTH);
    let cycleTime = time % CYCLE_LENGTH;
    
    if (currentCycle !== lastCycle) {
        if (lastCycle !== -1) { 
            fromIndex = toIndex;
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * shapes.length);
            } while (nextIndex === fromIndex);
            toIndex = nextIndex;
        }
        lastCycle = currentCycle;
    }

    let morphWeight = 0;
    if (cycleTime > HOLD_LENGTH) {
        let rawWeight = (cycleTime - HOLD_LENGTH) / (CYCLE_LENGTH - HOLD_LENGTH);
        morphWeight = easeInOutCubic(rawWeight);
    }

    const fromShape = shapes[fromIndex];
    const toShape = shapes[toIndex];

    ctx.fillStyle = 'rgba(5, 5, 12, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    ctx.fillStyle = `rgba(200, 220, 255, 0.8)`;
    ctx.beginPath();
    stars.forEach(star => {
        let speed = 2 + (bassPunch * 60);
        star.z -= speed;
        
        if (star.z <= 0) {
            star.z = 6000;
            star.x = (Math.random() - 0.5) * 6000;
            star.y = (Math.random() - 0.5) * 6000;
        }
        
        let proj = project(star.x, star.y, star.z);
        if (proj) {
            let radius = Math.max(0.1, (0.5 + bassPunch * 2) * proj.scale);
            ctx.moveTo(proj.x, proj.y);
            ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
        }
    });
    ctx.fill();

    let rotX = figureRotation * 0.15;
    let rotY = figureRotation * 0.25;
    let hue = (time * 15 + (currentCycle * 60)) % 360;
    
    ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${0.5 + bassPunch * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < TOTAL_POINTS; i++) {
        let targetX = fromShape[i].x + (toShape[i].x - fromShape[i].x) * morphWeight;
        let targetY = fromShape[i].y + (toShape[i].y - fromShape[i].y) * morphWeight;
        let targetZ = fromShape[i].z + (toShape[i].z - fromShape[i].z) * morphWeight;

        let freqIndex = i % Math.floor(bufferLength / 2);
        let pointAudio = dataArray[freqIndex] / 255;
        let dynamicRadius = BASE_RADIUS + (pointAudio * 80) + (Math.sin(i + time * 10) * 15 * bassPunch);
        
        let x = targetX * dynamicRadius;
        let y = targetY * dynamicRadius;
        let z = targetZ * dynamicRadius;

        let rotX_y = y * Math.cos(rotX) - z * Math.sin(rotX);
        let rotX_z = y * Math.sin(rotX) + z * Math.cos(rotX);
        let finalX = x * Math.cos(rotY) + rotX_z * Math.sin(rotY);
        let finalZ = -x * Math.sin(rotY) + rotX_z * Math.cos(rotY);

        let proj = project(finalX, rotX_y, finalZ);
        
        if (proj) {
            if (i === 0) {
                ctx.moveTo(proj.x, proj.y);
            } else {
                ctx.lineTo(proj.x, proj.y);
            }
            
            if (pointAudio > 0.7) {
                ctx.fillStyle = `hsla(${hue}, 100%, 85%, 0.9)`;
                ctx.fillRect(proj.x - 1, proj.y - 1, 2, 2);
            }
        }
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
}