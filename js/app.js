// ==========================================
// 1. DOM ELEMENTS & VARIABLES
// ==========================================
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const container = document.getElementById('container');
const backBtn = document.getElementById('backBtn'); // Global Back Button

// Method 1: Radio Elements
const radioSelect = document.getElementById('radioSelect');
const playRadioBtn = document.getElementById('playRadioBtn');

// Method 2: Local File Elements
const audioUpload = document.getElementById('audioUpload');
const filePlaySection = document.getElementById('filePlaySection');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const playSelectedBtn = document.getElementById('playSelectedBtn');
let selectedFile = null;

// Method 3: Desktop Screen Share Element
const startBtn = document.getElementById('startBtn');

// Audio Engine Variables
let audioContext, analyser, source, audioElement;
let time = 0;             
let figureRotation = 0;   
let animationId; 

// ==========================================
// 2. CANVAS & 3D PROJECTION SETUP
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
    if (rz <= 0) return null; // Prevents division by zero if point is behind camera
    const scale = focalLength / rz;
    return {
        x: (canvas.width / 2) + (x * scale),
        y: (canvas.height / 2) + (y * scale),
        scale: scale
    };
}

// ==========================================
// 3. GENERATE 43 SHAPES (MATH LOGIC)
// ==========================================
const TOTAL_POINTS = 2000;
const BASE_RADIUS = 350;
const shapes = [];
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Shape 1: Sphere
let sphere = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let phi = Math.acos(1 - 2 * t);
    let theta = Math.PI * (1 + Math.sqrt(5)) * i;
    sphere.push({ x: Math.sin(phi) * Math.cos(theta), y: Math.sin(phi) * Math.sin(theta), z: Math.cos(phi) });
}
shapes.push(sphere);

// Shape 2: Torus
let torus = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 40; 
    let phi = t * Math.PI * 2;    
    let R = 0.7, r = 0.3;
    torus.push({ x: (R + r * Math.cos(theta)) * Math.cos(phi), y: (R + r * Math.cos(theta)) * Math.sin(phi), z: r * Math.sin(theta) });
}
shapes.push(torus);

// Shape 3: Hourglass
let hourglass = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 50; 
    let y = (t - 0.5) * 2; 
    let r = 0.2 + (y * y); 
    hourglass.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
}
shapes.push(hourglass);

// Shape 4: DNA Spiral
let dna = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 10; 
    let y = (t - 0.5) * 2.5; 
    let offset = (i % 2 === 0) ? 0 : Math.PI; 
    dna.push({ x: 0.4 * Math.cos(theta + offset), y: y, z: 0.4 * Math.sin(theta + offset) });
}
shapes.push(dna);

// Shape 5: Infinity Knot
let infinity = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = (i / (TOTAL_POINTS - 1)) * Math.PI * 2;
    infinity.push({ x: (Math.sin(t) + 2 * Math.sin(2 * t)) * 0.3, y: (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.3, z: (-Math.sin(3 * t)) * 0.3 });
}
shapes.push(infinity);

// Shape 6: Lotus Flower
let lotus = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 45; 
    let r = t * (1 + 0.4 * Math.sin(theta * 0.15)); 
    let y = 1.2 - (t * 2.4); 
    lotus.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
}
shapes.push(lotus);

// Shape 7: Torus Knot
let torusKnot = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = (i / (TOTAL_POINTS - 1)) * Math.PI * 2;
    let r = 0.4 * (2 + Math.cos(3 * t));
    torusKnot.push({ x: r * Math.cos(2 * t), y: r * Math.sin(2 * t), z: 0.4 * Math.sin(3 * t) });
}
shapes.push(torusKnot);

// Shape 8: Heart
let heart = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = (i / (TOTAL_POINTS - 1)) * Math.PI * 2;
    let x = 0.05 * 16 * Math.pow(Math.sin(t), 3);
    let y = -0.05 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    let z = Math.sin(t * 15) * 0.15; 
    heart.push({ x: x, y: y, z: z });
}
shapes.push(heart);

// Shape 9: Möbius Strip
let mobius = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let u = ((i % 100) / 100) * Math.PI * 2;
    let v = (Math.floor(i / 100) / (TOTAL_POINTS / 100)) * 2 - 1;
    let scale = 0.6;
    let x = scale * (1 + 0.5 * v * Math.cos(u / 2)) * Math.cos(u);
    let y = scale * (1 + 0.5 * v * Math.cos(u / 2)) * Math.sin(u);
    let z = scale * 0.5 * v * Math.sin(u / 2);
    mobius.push({ x: x, y: y, z: z });
}
shapes.push(mobius);

// Shape 10: Crystal
let crystal = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let phi = Math.acos(1 - 2 * t);
    let theta = Math.PI * (1 + Math.sqrt(5)) * i;
    let r = 0.6 + 0.4 * Math.sin(phi * 20) * Math.sin(theta * 20); 
    crystal.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) });
}
shapes.push(crystal);

// Shape 11: Vortex
let vortex = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let r = t;
    let theta = t * Math.PI * 30;
    let y = Math.sin(i * 1234.5) * 0.15 * t; 
    vortex.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
}
shapes.push(vortex);

// Shape 12: Cylinder
let cylinder = [];
let CYL_RINGS = 50;
let PTS_PER_RING = TOTAL_POINTS / CYL_RINGS;
for (let i = 0; i < TOTAL_POINTS; i++) {
    let u = ((i % PTS_PER_RING) / PTS_PER_RING) * Math.PI * 2;
    let v = (Math.floor(i / PTS_PER_RING) / CYL_RINGS) * 2 - 1;
    cylinder.push({ x: 0.6 * Math.cos(u), y: v, z: 0.6 * Math.sin(u) });
}
shapes.push(cylinder);

// Shape 13: Matrix Wave
let wave = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let u = ((i % 45) / 45) * 2 - 1;
    let v = ((Math.floor(i / 45)) / 45) * 2 - 1;
    let y = Math.sin(u * Math.PI * 3) * Math.cos(v * Math.PI * 3) * 0.2;
    wave.push({ x: u, y: y, z: v });
}
shapes.push(wave);

// Shape 14: Spinning Top
let spinningTop = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    if (t < 0.15) {
        let stemT = t / 0.15;
        let y = -1.5 + stemT * 1.0; 
        let r = 0.05; 
        let theta = stemT * Math.PI * 20;
        spinningTop.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
    } else {
        let bloomT = (t - 0.15) / 0.85;
        let theta = bloomT * Math.PI * 70; 
        let envelope = Math.sin(bloomT * Math.PI); 
        let petals = 1 + 0.35 * Math.sin(theta * 0.12); 
        let r = envelope * petals * 1.3;
        let y = -0.5 + bloomT * 1.8 - (r * 0.3); 
        spinningTop.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
    }
}
shapes.push(spinningTop);

// Shape 15: True Rose
let trueRose = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let x = 0, y = 0, z = 0;

    if (t < 0.10) { 
        let u = t / 0.10;
        let theta = u * Math.PI * 30;
        let r = 0.04;
        x = r * Math.cos(theta); z = r * Math.sin(theta); y = -1.5 + u * 1.0; 
    } else if (t < 0.16) { 
        let u = (t - 0.10) / 0.06;
        x = -0.8 * Math.sin(u * Math.PI); y = -0.8 + 0.5 * u + 0.2 * Math.sin(u * Math.PI); z = 0.25 * Math.sin(u * Math.PI * 2); 
    } else if (t < 0.22) { 
        let u = (t - 0.16) / 0.06;
        x = 0.8 * Math.sin(u * Math.PI); y = -0.5 + 0.5 * u + 0.2 * Math.sin(u * Math.PI); z = -0.25 * Math.sin(u * Math.PI * 2); 
    } else if (t < 0.25) { 
        let u = (t - 0.22) / 0.03;
        let theta = u * Math.PI * 10; let r = 0.04;
        x = r * Math.cos(theta); z = r * Math.sin(theta); y = -0.3 + u * 0.2; 
    } else { 
        let u = (t - 0.25) / 0.75; 
        let turns = 14; 
        let theta = u * Math.PI * 2 * turns; 
        let baseR = 1.35 * Math.pow(1 - u, 0.7); 
        let petalWave = Math.abs(Math.sin(theta * 2)); 
        let r = baseR * (0.75 + 0.25 * petalWave); 
        let bowl = Math.pow(u, 0.6); y = -0.1 + bowl * 1.2; y += 0.15 * petalWave * (1 - u);
        x = r * Math.cos(theta); z = r * Math.sin(theta);
    }
    trueRose.push({ x: x, y: y, z: z });
}
shapes.push(trueRose);

// Shape 16: Christmas Tree
let christmasTree = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let x = 0, y = 0, z = 0;

    if (t < 0.08) {
        let u = t / 0.08; let theta = u * Math.PI * 30; let r = 0.15;
        x = r * Math.cos(theta); z = r * Math.sin(theta); y = -1.3 + u * 0.5; 
    } else if (t < 0.92) {
        let u = (t - 0.08) / 0.84; 
        let tier = Math.floor(u * 3); 
        if (tier > 2) tier = 2; 
        let localU = (u * 3) - tier; 
        let baseY = [-0.8, -0.25, 0.35][tier]; let endY = [-0.05, 0.5, 1.0][tier];
        y = baseY + localU * (endY - baseY);
        let maxR = [1.3, 0.95, 0.6][tier]; let endR = [0.2, 0.1, 0.0][tier];
        let r = maxR - localU * (maxR - endR);
        if (localU < 0.15) { let curve = Math.sin((localU / 0.15) * Math.PI); y -= curve * 0.15; r += curve * 0.10; }
        let theta = u * Math.PI * 150; 
        let ornaments = Math.sin(theta * 4) * 0.02; r += ornaments;
        x = r * Math.cos(theta); z = r * Math.sin(theta);
    } else {
        let u = (t - 0.92) / 0.08; let theta = u * Math.PI * 2 * 10; 
        let starR = 0.05 + 0.30 * Math.pow(Math.cos(2.5 * theta), 2); 
        x = starR * Math.cos(theta); y = 1.25 + starR * Math.sin(theta); z = Math.sin(theta * 3) * 0.05; 
    }
    christmasTree.push({ x: x, y: y, z: z });
}
shapes.push(christmasTree);

// Shape 17: Solar Flare
let solarFlare = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 150; 
    let scratchNoise = Math.sin(theta * 3.14) * 0.12 * Math.sin(t * Math.PI * 80);
    let phi = Math.acos(1 - 2 * t);
    let r = 0.9 + scratchNoise; 
    solarFlare.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) });
}
shapes.push(solarFlare);

// Shape 18: Quantum Core
let quantumCore = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 90; let phi = t * Math.PI * 2 * 6; 
    let r = 0.65 + 0.35 * Math.sin(theta * 8) * Math.cos(phi * 5);
    quantumCore.push({ x: r * Math.cos(theta) * Math.sin(phi), y: r * Math.sin(theta) * Math.sin(phi), z: r * Math.cos(phi) });
}
shapes.push(quantumCore);

// Shape 19: Pulsating Iris
let iris = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 60; 
    let r = 0.95 * Math.abs(Math.sin(t * Math.PI * 250));
    let z = 0.15 * Math.sin(t * Math.PI * 40);
    iris.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: z });
}
shapes.push(iris);

// Shape 20: Event Horizon
let blackHole = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 120; 
    let r = 1.6 * Math.pow(t, 1.2); 
    let y = -0.8 / (r + 0.15) + 0.6; 
    let wobble = Math.sin(theta * 3) * 0.05;
    blackHole.push({ x: (r + wobble) * Math.cos(theta), y: y, z: (r + wobble) * Math.sin(theta) });
}
shapes.push(blackHole);

// Shape 21: Hyper-Torus
let hyperTorus = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let u = t * Math.PI * 2 * 45; let v = t * Math.PI * 2;      
    let r = 0.8 + 0.4 * Math.cos(u);
    let x = r * Math.cos(v); let y = r * Math.sin(v);
    let z = 0.5 * Math.sin(u) + 0.3 * Math.sin(v * 2); 
    hyperTorus.push({ x, y, z });
}
shapes.push(hyperTorus);

// Shape 22: Cryptographic Glitch
let glitch = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let phi = Math.acos(1 - 2 * t);
    let theta = Math.PI * (1 + Math.sqrt(5)) * i;
    let isGlitch = (Math.sin(i * 137.5) > 0.85) ? 1.6 : 1.0;
    let r = 0.7 * isGlitch;
    glitch.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) });
}
shapes.push(glitch);

// Shape 23: Quantum Pulsar
let pulsar = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let phi = Math.acos(1 - 2 * t);
    let theta = Math.PI * (1 + Math.sqrt(5)) * i;
    let spikes = Math.abs(Math.sin(theta * 6) * Math.cos(phi * 6));
    let r = 0.4 + 0.9 * Math.pow(spikes, 1.5);
    pulsar.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) });
}
shapes.push(pulsar);

// Shape 24: Atlas Map
let atlas = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 60, v = t * Math.PI * 2 * 4;
    let r = 1.0 + 0.3 * Math.sin(u * 2) * Math.cos(v * 3);
    atlas.push({ x: r * Math.cos(u), y: 0.5 * Math.sin(v * 4), z: r * Math.sin(u) });
}
shapes.push(atlas);

// Shape 25: Blood Rune
let bloodRune = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 40;
    let r = 0.8 * Math.sign(Math.cos(theta * 4)) * Math.sqrt(Math.abs(Math.cos(theta * 4)));
    let y = 0.8 * Math.sin(theta * 3) + 0.1 * Math.sin(t * 1000); 
    bloodRune.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
}
shapes.push(bloodRune);

// Shape 26: Hellforge
let hellforge = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 80;
    let r = 0.5 + 0.7 * Math.abs(Math.sin(u * 2.5));
    let twist = t * Math.PI * 4;
    hellforge.push({ x: r * Math.cos(u + twist), y: 1.5 * (t - 0.5) * Math.sin(u * 5), z: r * Math.sin(u + twist) });
}
shapes.push(hellforge);

// Shape 27: Physics Collider
let collider = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 100;
    let x = Math.max(-0.7, Math.min(0.7, 1.2 * Math.cos(u)));
    let y = Math.max(-0.7, Math.min(0.7, 1.2 * Math.sin(u)));
    let z = 0.7 * Math.sin(t * Math.PI * 20); 
    collider.push({ x, y, z });
}
shapes.push(collider);

// Shape 28: Tesseract
let tesseract = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 50;
    let r = 0.9 / (Math.abs(Math.cos(u)) + Math.abs(Math.sin(u)));
    let z = 0.9 * Math.sin(t * Math.PI * 15);
    tesseract.push({ x: r * Math.cos(u), y: r * Math.sin(u), z: z });
}
shapes.push(tesseract);

// Shape 29: Wormhole
let wormhole = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 150;
    let z = 2.0 * (t - 0.5); 
    let r = 0.2 + 1.2 * Math.pow(Math.abs(z), 2); 
    wormhole.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: z });
}
shapes.push(wormhole);

// Shape 30: Liquid Metal
let liquidMetal = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), phi = Math.acos(1 - 2 * t), theta = Math.PI * 100 * t;
    let r = 0.7 + 0.3 * Math.sin(phi * 4) * Math.cos(theta * 3);
    liquidMetal.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) });
}
shapes.push(liquidMetal);

// Shape 31: Crystal Shard
let crystalShard = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 40;
    let r = 0.6 / (Math.abs(Math.cos(u * 3)) + Math.abs(Math.sin(u * 3))); 
    let y = 1.2 * (t - 0.5) * (2.0 - r); 
    crystalShard.push({ x: r * Math.cos(u), y: y, z: r * Math.sin(u) });
}
shapes.push(crystalShard);

// Shape 32: Milky Way
let galaxy = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 20;
    let r = 1.5 * Math.pow(t, 0.5);
    let wobble = Math.sin(theta * 100) * 0.05; 
    galaxy.push({ x: (r + wobble) * Math.cos(theta - r * 3), y: 0.2 * Math.sin(theta * 5) * (1-t), z: (r + wobble) * Math.sin(theta - r * 3) });
}
shapes.push(galaxy);

// Shape 33: Deep Sea Jellyfish
let jellyfish = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 80;
    let isCap = (t < 0.3);
    let r = isCap ? 0.8 * Math.sin((t / 0.3) * Math.PI) : 0.6 * Math.cos(theta * 8) * (1 - t);
    let y = isCap ? -0.5 + Math.cos((t / 0.3) * Math.PI * 0.5) : -0.5 - 1.5 * ((t - 0.3) / 0.7);
    jellyfish.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
}
shapes.push(jellyfish);

// Shape 34: Magnetic Field
let magneticField = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 60, v = t * Math.PI * 2 * 2;
    let r = 0.9 * Math.cos(u);
    magneticField.push({ x: r * Math.cos(v), y: 1.2 * Math.sin(u), z: r * Math.sin(v) });
}
shapes.push(magneticField);

// Shape 35: Supernova
let supernova = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), phi = Math.acos(1 - 2 * t), theta = Math.PI * 150 * t;
    let explode = 1.0 + 0.4 * Math.sin(theta * 10) * Math.sin(phi * 10);
    supernova.push({ x: explode * Math.sin(phi) * Math.cos(theta), y: explode * Math.sin(phi) * Math.sin(theta), z: explode * Math.cos(phi) });
}
shapes.push(supernova);

// Shape 36: DNA Mutation
let dnaMutation = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 30;
    let offset = (i % 2 === 0) ? 0 : Math.PI;
    let r = 0.5 + 0.2 * Math.sin(t * Math.PI * 10); 
    dnaMutation.push({ x: r * Math.cos(theta + offset), y: 2.0 * (t - 0.5), z: r * Math.sin(theta + offset) });
}
shapes.push(dnaMutation);

// Shape 37: Holographic Cube
let holoCube = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 150;
    let x = 0.8 * Math.cos(u) * Math.pow(Math.abs(Math.cos(u)), 0.1);
    let z = 0.8 * Math.sin(u) * Math.pow(Math.abs(Math.sin(u)), 0.1);
    let y = 1.2 * (t - 0.5) * Math.sign(Math.sin(u * 5)); 
    holoCube.push({ x, y, z });
}
shapes.push(holoCube);

// Shape 38: Sonic Wave
let sonicWave = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 50;
    let r = 0.7 + 0.3 * Math.sin(u * 12) * Math.cos(t * Math.PI * 20);
    sonicWave.push({ x: r * Math.cos(u), y: 1.5 * (t - 0.5), z: r * Math.sin(u) });
}
shapes.push(sonicWave);

// Shape 39: Infinity Mirror
let infinityMirror = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 4;
    let x = Math.sin(3 * u + Math.PI / 4) * 1.2;
    let y = Math.sin(4 * u) * 1.0;
    let z = Math.cos(5 * u) * 0.8;
    infinityMirror.push({ x, y, z });
}
shapes.push(infinityMirror);

// Shape 40: Sacred Halo
let sacredHalo = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 100;
    let ringIndex = Math.floor(t * 3);
    let r = 0.6 + ringIndex * 0.3;
    let tilt = ringIndex * (Math.PI / 3);
    let x = r * Math.cos(u);
    let z = r * Math.sin(u) * Math.cos(tilt);
    let y = r * Math.sin(u) * Math.sin(tilt);
    sacredHalo.push({ x, y, z });
}
shapes.push(sacredHalo);

// Shape 41: Time Glass
let timeGlass = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 100;
    let y = 1.5 * (t - 0.5);
    let r = 0.1 + 1.2 * Math.pow(Math.abs(y), 1.5);
    timeGlass.push({ x: r * Math.cos(u), y: y, z: r * Math.sin(u) });
}
shapes.push(timeGlass);

// Shape 42: Atom Core
let atomCore = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 120;
    let orbit = Math.floor(t * 4);
    let x = Math.cos(u), y = Math.sin(u), z = 0;
    if (orbit === 1) { z = y; y = 0; }
    if (orbit === 2) { z = x; x = 0; }
    if (orbit === 3) { let temp = x; x = y * 0.7; y = temp * 0.7; z = Math.sin(u); }
    atomCore.push({ x, y, z });
}
shapes.push(atomCore);

// Shape 43: Cyber Tornado
let cyberTornado = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 60;
    let r = 0.2 + 1.2 * t;
    let x = r * Math.cos(u) * Math.pow(Math.abs(Math.cos(u)), 0.1);
    let z = r * Math.sin(u) * Math.pow(Math.abs(Math.sin(u)), 0.1);
    cyberTornado.push({ x, y: 1.5 * (t - 0.5), z });
}
shapes.push(cyberTornado);

// --- STARFIELD GENERATOR ---
const stars = [];
const NUM_STARS = 1500;
for (let i = 0; i < NUM_STARS; i++) {
    stars.push({ x: (Math.random() - 0.5) * 6000, y: (Math.random() - 0.5) * 6000, z: Math.random() * 6000 });
}

// State Machine Initialization
let lastCycle = -1;
let fromIndex = Math.floor(Math.random() * shapes.length);
let toIndex = Math.floor(Math.random() * shapes.length);
if (fromIndex === toIndex) toIndex = (toIndex + 1) % shapes.length;


// ==========================================
// 4. SHARED AUDIO CONTEXT & NAVIGATION LOGIC
// ==========================================

// Global logic to return to the main menu
function returnToMenu() {
    cancelAnimationFrame(animationId);
    cleanupSource();
    container.style.display = 'block';
    backBtn.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset all buttons in case they were left disabled
    playRadioBtn.innerText = "Play Radio & Visualize";
    playRadioBtn.disabled = false;
    playSelectedBtn.innerText = "Play File & Visualize";
    playSelectedBtn.disabled = false;
}
backBtn.addEventListener('click', returnToMenu);

async function initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
}

// Cleans up the previous source completely to prevent overlapping audio/memory leaks
function cleanupSource() {
    if (source) {
        try { source.disconnect(); } catch(e){}
        try { source.stop(); } catch(e){} // Used if it's an AudioBufferSourceNode
        source = null;
    }
    if (audioElement) {
        audioElement.pause();
        audioElement.removeAttribute('src'); 
        audioElement.load();
        audioElement = null;
    }
}


// ==========================================
// METHOD 1: LIVE RADIO STREAM
// ==========================================
playRadioBtn.addEventListener('click', async () => {
    try {
        const originalText = playRadioBtn.innerText;
        playRadioBtn.innerText = "Connecting to Radio...";
        playRadioBtn.disabled = true;

        await initAudioContext();
        cleanupSource();

        const targetStreamUrl = radioSelect.value;

        audioElement = new Audio();
        audioElement.crossOrigin = "anonymous"; 
        audioElement.src = targetStreamUrl;
        
        audioElement.addEventListener('canplay', async () => {
            try {
                source = audioContext.createMediaElementSource(audioElement);
                if (!analyser) {
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 512;
                }
                source.connect(analyser);
                analyser.connect(audioContext.destination);

                await audioElement.play();
                
                // Show Back Button, Hide Menu, Start Visuals
                container.style.display = 'none';
                backBtn.style.display = 'flex';
                draw();

                playRadioBtn.innerText = originalText;
                playRadioBtn.disabled = false;
            } catch (playError) {
                console.error("Playback error:", playError);
                alert("The browser blocked playback. Please interact with the page first.");
                playRadioBtn.innerText = "Play Radio & Visualize";
                playRadioBtn.disabled = false;
            }
        }, { once: true });

        audioElement.addEventListener('error', (e) => {
            console.error("Audio Element Error:", e);
            alert("Stream failed to load. The radio station server blocked access (CORS) or the stream is currently offline.");
            playRadioBtn.innerText = "Play Radio & Visualize";
            playRadioBtn.disabled = false;
        });

        audioElement.load();

    } catch (err) {
        alert("Failed to initialize the audio engine.");
        playRadioBtn.innerText = "Play Radio & Visualize";
        playRadioBtn.disabled = false;
        console.error("Radio Error:", err);
    }
});


// ==========================================
// METHOD 2: LOCAL FILE (Universal Decoder)
// ==========================================
audioUpload.addEventListener('change', function() {
    selectedFile = this.files[0];
    if (!selectedFile) return;

    fileNameDisplay.innerText = "File Ready: " + selectedFile.name;
    filePlaySection.style.display = 'block';
});

playSelectedBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    try {
        const originalBtnText = playSelectedBtn.innerText;
        playSelectedBtn.innerText = "Processing audio data...";
        playSelectedBtn.disabled = true;

        await initAudioContext();
        cleanupSource();

        // We decode raw binary data to bypass all mobile DRM/Autoplay bugs
        const arrayBuffer = await selectedFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        if (!analyser) {
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
        }
        
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        source.start(0);

        // Show Back Button, Hide Menu, Start Visuals
        container.style.display = 'none';
        backBtn.style.display = 'flex';
        draw();

        // When the song ends naturally, return to menu
        source.onended = () => {
            returnToMenu();
        };

    } catch (err) {
        alert("Could not decode the file. Ensure it is a standard music file (MP3/WAV/FLAC) without DRM copy-protection.");
        playSelectedBtn.innerText = "Play File & Visualize";
        playSelectedBtn.disabled = false;
        console.error("Decode Error:", err);
    }
});


// ==========================================
// METHOD 3: SCREEN SHARE (Desktop Only)
// ==========================================
startBtn.addEventListener('click', async () => {
    try {
        await initAudioContext();
        cleanupSource();

        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        // Listen for the user clicking the browser's native "Stop Sharing" button
        stream.getVideoTracks()[0].onended = () => {
            returnToMenu();
        };

        source = audioContext.createMediaStreamSource(stream);
        if (!analyser) {
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
        }
        source.connect(analyser);
        
        // Show Back Button, Hide Menu, Start Visuals
        container.style.display = 'none';
        backBtn.style.display = 'flex';
        draw();
    } catch (err) {
        alert("Audio stream not found. Please click 'Connect Audio' again and remember to toggle 'Share tab audio'.");
        console.error("Screen Share Error:", err);
    }
});


// ==========================================
// 5. MAIN ANIMATION DRAW LOOP
// ==========================================
function draw() {
    animationId = requestAnimationFrame(draw);
    time += 0.015; 
    
    // Extract frequency data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calculate heavy bass punch using the lowest frequency bins
    let bassSum = 0;
    for (let i = 1; i <= 5; i++) bassSum += dataArray[i];
    let bassPunch = Math.pow((bassSum / 5) / 255, 3);

    figureRotation += 0.002 + (bassPunch * 0.015);

    // Timeline control for random shape transitions
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

    // Background trail effect
    ctx.fillStyle = 'rgba(5, 5, 12, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    // Draw interactive starfield
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

    // Render the interpolated 3D shape
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

        // Apply 3D rotation
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
            
            // Highlight highly reactive vertices
            if (pointAudio > 0.7) {
                ctx.fillStyle = `hsla(${hue}, 100%, 85%, 0.9)`;
                ctx.fillRect(proj.x - 1, proj.y - 1, 2, 2);
            }
        }
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
}