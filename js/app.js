// Setup context for the canvas
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const micBtn = document.getElementById('micBtn'); // <-- Added mobile button
const container = document.getElementById('container');

// Audio and animation control variables
let audioContext, analyser, source;
let time = 0;             
let figureRotation = 0;   
let animationId; // Stores the animation frame ID to stop loops  

// Adjust canvas size to fill the browser window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); 

// Camera settings for 3D projection
const focalLength = 900;
const camZ = -1400; 

// Project 3D coordinates (x,y,z) to 2D screen coordinates
function project(x, y, z) {
    const rz = z - camZ;
    if (rz <= 0) return null; 
    const scale = focalLength / rz;
    return {
        x: (canvas.width / 2) + (x * scale),
        y: (canvas.height / 2) + (y * scale),
        scale: scale
    };
}

// --- GENERATING 43 UNIQUE 3D SHAPES ---
// We create each shape by plotting 2000 points in 3D space
const TOTAL_POINTS = 2000;
const BASE_RADIUS = 350;
const shapes = [];

// Smoothing function for seamless morphing transitions between shapes
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// 1. SPHERE
let sphere = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let phi = Math.acos(1 - 2 * t);
    let theta = Math.PI * (1 + Math.sqrt(5)) * i;
    sphere.push({ x: Math.sin(phi) * Math.cos(theta), y: Math.sin(phi) * Math.sin(theta), z: Math.cos(phi) });
}
shapes.push(sphere);

// 2. TORUS (Portal)
let torus = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 40; 
    let phi = t * Math.PI * 2;    
    let R = 0.7, r = 0.3;
    torus.push({ x: (R + r * Math.cos(theta)) * Math.cos(phi), y: (R + r * Math.cos(theta)) * Math.sin(phi), z: r * Math.sin(theta) });
}
shapes.push(torus);

// 3. HOURGLASS
let hourglass = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 50; 
    let y = (t - 0.5) * 2; 
    let r = 0.2 + (y * y); 
    hourglass.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
}
shapes.push(hourglass);

// 4. DNA SPIRAL
let dna = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 10; 
    let y = (t - 0.5) * 2.5; 
    let offset = (i % 2 === 0) ? 0 : Math.PI; 
    dna.push({ x: 0.4 * Math.cos(theta + offset), y: y, z: 0.4 * Math.sin(theta + offset) });
}
shapes.push(dna);

// 5. INFINITY KNOT
let infinity = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = (i / (TOTAL_POINTS - 1)) * Math.PI * 2;
    infinity.push({ x: (Math.sin(t) + 2 * Math.sin(2 * t)) * 0.3, y: (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.3, z: (-Math.sin(3 * t)) * 0.3 });
}
shapes.push(infinity);

// 6. LOTUS FLOWER
let lotus = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 45; 
    let r = t * (1 + 0.4 * Math.sin(theta * 0.15)); 
    let y = 1.2 - (t * 2.4); 
    lotus.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
}
shapes.push(lotus);

// 7. TORUS KNOT (Advanced 3D Knot)
let torusKnot = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = (i / (TOTAL_POINTS - 1)) * Math.PI * 2;
    let r = 0.4 * (2 + Math.cos(3 * t));
    torusKnot.push({ x: r * Math.cos(2 * t), y: r * Math.sin(2 * t), z: 0.4 * Math.sin(3 * t) });
}
shapes.push(torusKnot);

// 8. HEART
let heart = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = (i / (TOTAL_POINTS - 1)) * Math.PI * 2;
    let x = 0.05 * 16 * Math.pow(Math.sin(t), 3);
    let y = -0.05 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    let z = Math.sin(t * 15) * 0.15; // Adds depth/thickness
    heart.push({ x: x, y: y, z: z });
}
shapes.push(heart);

// 9. MÖBIUS STRIP
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

// 10. CRYSTAL / SEA URCHIN
let crystal = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let phi = Math.acos(1 - 2 * t);
    let theta = Math.PI * (1 + Math.sqrt(5)) * i;
    let r = 0.6 + 0.4 * Math.sin(phi * 20) * Math.sin(theta * 20); // Creates spikes
    crystal.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) });
}
shapes.push(crystal);

// 11. VORTEX / GALAXY
let vortex = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let r = t;
    let theta = t * Math.PI * 30;
    let y = Math.sin(i * 1234.5) * 0.15 * t; // Fixed pseudo-random scattering
    vortex.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
}
shapes.push(vortex);

// 12. CYLINDER / TOWER
let cylinder = [];
let CYL_RINGS = 50;
let PTS_PER_RING = TOTAL_POINTS / CYL_RINGS;
for (let i = 0; i < TOTAL_POINTS; i++) {
    let u = ((i % PTS_PER_RING) / PTS_PER_RING) * Math.PI * 2;
    let v = (Math.floor(i / PTS_PER_RING) / CYL_RINGS) * 2 - 1;
    cylinder.push({ x: 0.6 * Math.cos(u), y: v, z: 0.6 * Math.sin(u) });
}
shapes.push(cylinder);

// 13. THE WAVE (Matrix Grid)
let wave = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let u = ((i % 45) / 45) * 2 - 1;
    let v = ((Math.floor(i / 45)) / 45) * 2 - 1;
    let y = Math.sin(u * Math.PI * 3) * Math.cos(v * Math.PI * 3) * 0.2;
    wave.push({ x: u, y: y, z: v });
}
shapes.push(wave);

// 14. SPINNING TOP
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

// 15. THE TRUE ROSE (V3 - True 3D Flower with Petals)
let trueRose = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let x = 0, y = 0, z = 0;

    if (t < 0.10) { 
        // 1. Thick Stem (A very dense spiral forming a solid line)
        let u = t / 0.10;
        let theta = u * Math.PI * 30;
        let r = 0.04;
        x = r * Math.cos(theta);
        z = r * Math.sin(theta);
        y = -1.5 + u * 1.0; 
    } else if (t < 0.16) { 
        // 2. Left Leaf (Draws a 3D loop extending from the stem)
        let u = (t - 0.10) / 0.06;
        x = -0.8 * Math.sin(u * Math.PI);
        y = -0.8 + 0.5 * u + 0.2 * Math.sin(u * Math.PI); 
        z = 0.25 * Math.sin(u * Math.PI * 2); // Opens up in depth
    } else if (t < 0.22) { 
        // 3. Right Leaf
        let u = (t - 0.16) / 0.06;
        x = 0.8 * Math.sin(u * Math.PI);
        y = -0.5 + 0.5 * u + 0.2 * Math.sin(u * Math.PI); 
        z = -0.25 * Math.sin(u * Math.PI * 2); 
    } else if (t < 0.25) { 
        // 4. Stem continuation up to the flower head
        let u = (t - 0.22) / 0.03;
        let theta = u * Math.PI * 10;
        let r = 0.04;
        x = r * Math.cos(theta);
        z = r * Math.sin(theta);
        y = -0.3 + u * 0.2; 
    } else { 
        // 5. Flower Head
        let u = (t - 0.25) / 0.75; 
        let turns = 14; 
        let theta = u * Math.PI * 2 * turns; 
        
        // Radius tapers smoothly towards the center
        let baseR = 1.35 * Math.pow(1 - u, 0.7); 
        
        // Creates 4 petals per revolution (soft curves outward, sharp inward)
        let petalWave = Math.abs(Math.sin(theta * 2)); 
        
        let r = baseR * (0.75 + 0.25 * petalWave); 
        
        // Height (Y) forms the base of a bowl
        let bowl = Math.pow(u, 0.6); 
        y = -0.1 + bowl * 1.2; 
        
        // Tilts the edges of the petals slightly upward
        y += 0.15 * petalWave * (1 - u);
        
        x = r * Math.cos(theta);
        z = r * Math.sin(theta);
    }
    trueRose.push({ x: x, y: y, z: z });
}
shapes.push(trueRose);

// 16. CHRISTMAS TREE (Cartoon 3D style with 3 tiers and a star)
let christmasTree = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let x = 0, y = 0, z = 0;

    if (t < 0.08) {
        // 1. Tree Trunk (Dense spiral)
        let u = t / 0.08;
        let theta = u * Math.PI * 30; 
        let r = 0.15;
        x = r * Math.cos(theta);
        z = r * Math.sin(theta);
        y = -1.3 + u * 0.5; // Grows from bottom up
    } else if (t < 0.92) {
        // 2. The 3 tiers of branches
        let u = (t - 0.08) / 0.84; 
        let tier = Math.floor(u * 3); // Splits segment into 0, 1, and 2
        if (tier > 2) tier = 2; // Safety clamp
        let localU = (u * 3) - tier; // Value from 0 to 1 within the specific tier
        
        // Heights for each of the 3 tiers (creates a nice overlap)
        let baseY = [-0.8, -0.25, 0.35][tier];
        let endY = [-0.05, 0.5, 1.0][tier];
        y = baseY + localU * (endY - baseY);
        
        // Start and end radius for each tier
        let maxR = [1.3, 0.95, 0.6][tier];
        let endR = [0.2, 0.1, 0.0][tier];
        let r = maxR - localU * (maxR - endR);
        
        // The magical "cartoon curve" at the bottom of each tier
        if (localU < 0.15) {
            let curve = Math.sin((localU / 0.15) * Math.PI); 
            y -= curve * 0.15; // Pulls branch downwards
            r += curve * 0.10; // Pushes branch slightly outwards
        }
        
        let theta = u * Math.PI * 150; // Gives branches lots of dense lines
        
        // Add a wave on the surface (simulates glowing ornaments)
        let ornaments = Math.sin(theta * 4) * 0.02;
        r += ornaments;

        x = r * Math.cos(theta);
        z = r * Math.sin(theta);
    } else {
        // 3. The Star on top
        let u = (t - 0.92) / 0.08;
        let theta = u * Math.PI * 2 * 10; // Drawn over 10 revolutions to make it solid
        
        // Math for a sharp 5-pointed star
        let starR = 0.05 + 0.30 * Math.pow(Math.cos(2.5 * theta), 2); 

        x = starR * Math.cos(theta);
        y = 1.25 + starR * Math.sin(theta); // Elevated vertically above the tree
        z = Math.sin(theta * 3) * 0.05; // Gives the star some 3D thickness
    }
    christmasTree.push({ x: x, y: y, z: z });
}
shapes.push(christmasTree);

// 17. SOLAR FLARE (Massive, scratched sphere)
let solarFlare = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 150; // Extremely dense spiral (150 revolutions)
    
    // Generates the "scratched" texture on the surface using fast sine waves
    let scratchNoise = Math.sin(theta * 3.14) * 0.12 * Math.sin(t * Math.PI * 80);
    
    let phi = Math.acos(1 - 2 * t);
    let r = 0.9 + scratchNoise; // Near full size + scratches
    
    solarFlare.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
    });
}
shapes.push(solarFlare);

// 18. QUANTUM CORE (Optical illusion with internal waves / Moiré pattern)
let quantumCore = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 90;
    let phi = t * Math.PI * 2 * 6; // Forms overlapping rings
    
    // Creates the interference pattern (Moiré) in the core of the figure
    let r = 0.65 + 0.35 * Math.sin(theta * 8) * Math.cos(phi * 5);
    
    quantumCore.push({
        x: r * Math.cos(theta) * Math.sin(phi),
        y: r * Math.sin(theta) * Math.sin(phi),
        z: r * Math.cos(phi)
    });
}
shapes.push(quantumCore);

// 19. PULSATING IRIS (Dense center radiating outwards)
let iris = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 60; // Angle of the rays
    
    // Makes the thread zigzag violently in and out from the center
    let r = 0.95 * Math.abs(Math.sin(t * Math.PI * 250));
    
    // Curves the figure slightly so it's not just a flat 2D disc
    let z = 0.15 * Math.sin(t * Math.PI * 40);
    
    iris.push({
        x: r * Math.cos(theta),
        y: r * Math.sin(theta),
        z: z
    });
}
shapes.push(iris);

// 20. EVENT HORIZON (Black Hole)
let blackHole = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let theta = t * Math.PI * 2 * 120; // Massive rotation
    
    // The funnel becomes extremely wide at the top
    let r = 1.6 * Math.pow(t, 1.2); 
    
    // Dives asymptotically towards infinity in the center
    let y = -0.8 / (r + 0.15) + 0.6; 
    
    // A slight "wobble" on the event horizon
    let wobble = Math.sin(theta * 3) * 0.05;
    
    blackHole.push({ 
        x: (r + wobble) * Math.cos(theta), 
        y: y, 
        z: (r + wobble) * Math.sin(theta) 
    });
}
shapes.push(blackHole);

// 21. HYPER-TORUS (4D Folding illusion)
let hyperTorus = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let u = t * Math.PI * 2 * 45; // Inner loops
    let v = t * Math.PI * 2;      // Outer rotation
    
    // The figure folds into itself like a Möbius strip in 3D
    let r = 0.8 + 0.4 * Math.cos(u);
    let x = r * Math.cos(v);
    let y = r * Math.sin(v);
    
    // The Z-axis shifts twice to create the fold
    let z = 0.5 * Math.sin(u) + 0.3 * Math.sin(v * 2); 
    
    hyperTorus.push({ x, y, z });
}
shapes.push(hyperTorus);

// 22. CRYPTOGRAPHIC GLITCH (Corrupted digital sphere)
let glitch = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let phi = Math.acos(1 - 2 * t);
    let theta = Math.PI * (1 + Math.sqrt(5)) * i;

    // Pseudo-random algorithm that lets certain points "glitch" violently outwards
    let isGlitch = (Math.sin(i * 137.5) > 0.85) ? 1.6 : 1.0;
    let r = 0.7 * isGlitch;

    glitch.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
    });
}
shapes.push(glitch);

// 23. QUANTUM PULSAR (Geometric Reactor)
let pulsar = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1);
    let phi = Math.acos(1 - 2 * t);
    let theta = Math.PI * (1 + Math.sqrt(5)) * i;

    // Creates extremely sharp "star spikes" that interlace
    let spikes = Math.abs(Math.sin(theta * 6) * Math.cos(phi * 6));
    let r = 0.4 + 0.9 * Math.pow(spikes, 1.5);

    pulsar.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
    });
}
shapes.push(pulsar);

// 24. ATLAS MAP (Interwoven cosmic paths and nodes)
let atlas = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 60, v = t * Math.PI * 2 * 4;
    let r = 1.0 + 0.3 * Math.sin(u * 2) * Math.cos(v * 3);
    atlas.push({ x: r * Math.cos(u), y: 0.5 * Math.sin(v * 4), z: r * Math.sin(u) });
}
shapes.push(atlas);

// 25. BLOOD RUNE (Sharp, monolithic stone geometry with scratched edges)
let bloodRune = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 40;
    let r = 0.8 * Math.sign(Math.cos(theta * 4)) * Math.sqrt(Math.abs(Math.cos(theta * 4)));
    let y = 0.8 * Math.sin(theta * 3) + 0.1 * Math.sin(t * 1000); // Scratched effect
    bloodRune.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
}
shapes.push(bloodRune);

// 26. HELLFORGE (Demonic, twisted spikes rotating upon themselves)
let hellforge = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 80;
    let r = 0.5 + 0.7 * Math.abs(Math.sin(u * 2.5));
    let twist = t * Math.PI * 4;
    hellforge.push({ 
        x: r * Math.cos(u + twist), 
        y: 1.5 * (t - 0.5) * Math.sin(u * 5), 
        z: r * Math.sin(u + twist) 
    });
}
shapes.push(hellforge);

// 27. PHYSICS COLLIDER (Tight 3D grid network)
let collider = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 100;
    let x = Math.max(-0.7, Math.min(0.7, 1.2 * Math.cos(u)));
    let y = Math.max(-0.7, Math.min(0.7, 1.2 * Math.sin(u)));
    let z = 0.7 * Math.sin(t * Math.PI * 20); // Travels up and down in layers
    collider.push({ x, y, z });
}
shapes.push(collider);

// 28. TESSERACT (Hypercube with solid corners and dense scanlines)
let tesseract = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 50;
    let r = 0.9 / (Math.abs(Math.cos(u)) + Math.abs(Math.sin(u)));
    let z = 0.9 * Math.sin(t * Math.PI * 15);
    tesseract.push({ x: r * Math.cos(u), y: r * Math.sin(u), z: z });
}
shapes.push(tesseract);

// 29. WORMHOLE (Deep space tunnel warping in depth)
let wormhole = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 150;
    let z = 2.0 * (t - 0.5); // Goes very deep
    let r = 0.2 + 1.2 * Math.pow(Math.abs(z), 2); // Becomes massive at the ends
    wormhole.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: z });
}
shapes.push(wormhole);

// 30. LIQUID METAL (Organic Metaball, constantly undulating)
let liquidMetal = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), phi = Math.acos(1 - 2 * t), theta = Math.PI * 100 * t;
    let r = 0.7 + 0.3 * Math.sin(phi * 4) * Math.cos(theta * 3);
    liquidMetal.push({ x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.sin(phi) * Math.sin(theta), z: r * Math.cos(phi) });
}
shapes.push(liquidMetal);

// 31. CRYSTAL SHARD (Cut diamond edges)
let crystalShard = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 40;
    let r = 0.6 / (Math.abs(Math.cos(u * 3)) + Math.abs(Math.sin(u * 3))); // Triangular base
    let y = 1.2 * (t - 0.5) * (2.0 - r); // Tapers at top and bottom
    crystalShard.push({ x: r * Math.cos(u), y: y, z: r * Math.sin(u) });
}
shapes.push(crystalShard);

// 32. MILKY WAY (Spiral galaxy with a condensed core)
let galaxy = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 20;
    let r = 1.5 * Math.pow(t, 0.5);
    let wobble = Math.sin(theta * 100) * 0.05; // Adds the stardust effect
    galaxy.push({ x: (r + wobble) * Math.cos(theta - r * 3), y: 0.2 * Math.sin(theta * 5) * (1-t), z: (r + wobble) * Math.sin(theta - r * 3) });
}
shapes.push(galaxy);

// 33. DEEP SEA JELLYFISH (Bell-shaped with tentacles)
let jellyfish = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 80;
    let isCap = (t < 0.3);
    let r = isCap ? 0.8 * Math.sin((t / 0.3) * Math.PI) : 0.6 * Math.cos(theta * 8) * (1 - t);
    let y = isCap ? -0.5 + Math.cos((t / 0.3) * Math.PI * 0.5) : -0.5 - 1.5 * ((t - 0.3) / 0.7);
    jellyfish.push({ x: r * Math.cos(theta), y: y, z: r * Math.sin(theta) });
}
shapes.push(jellyfish);

// 34. MAGNETIC FIELD (Toroidal energy lines flipping poles)
let magneticField = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 60, v = t * Math.PI * 2 * 2;
    let r = 0.9 * Math.cos(u);
    magneticField.push({ x: r * Math.cos(v), y: 1.2 * Math.sin(u), z: r * Math.sin(v) });
}
shapes.push(magneticField);

// 35. SUPERNOVA (A sphere exploding outwards in rings)
let supernova = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), phi = Math.acos(1 - 2 * t), theta = Math.PI * 150 * t;
    let explode = 1.0 + 0.4 * Math.sin(theta * 10) * Math.sin(phi * 10);
    supernova.push({ x: explode * Math.sin(phi) * Math.cos(theta), y: explode * Math.sin(phi) * Math.sin(theta), z: explode * Math.cos(phi) });
}
shapes.push(supernova);

// 36. DNA MUTATION (Double helix twisting upon itself in 3D)
let dnaMutation = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), theta = t * Math.PI * 2 * 30;
    let offset = (i % 2 === 0) ? 0 : Math.PI;
    let r = 0.5 + 0.2 * Math.sin(t * Math.PI * 10); // The mutation (thickens and shrinks)
    dnaMutation.push({ x: r * Math.cos(theta + offset), y: 2.0 * (t - 0.5), z: r * Math.sin(theta + offset) });
}
shapes.push(dnaMutation);

// 37. HOLOGRAPHIC CUBE (Rotating box made of interference lines)
let holoCube = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 150;
    let x = 0.8 * Math.cos(u) * Math.pow(Math.abs(Math.cos(u)), 0.1);
    let z = 0.8 * Math.sin(u) * Math.pow(Math.abs(Math.sin(u)), 0.1);
    let y = 1.2 * (t - 0.5) * Math.sign(Math.sin(u * 5)); // Glitchy scanlines
    holoCube.push({ x, y, z });
}
shapes.push(holoCube);

// 38. SONIC WAVE (Cylindrical waveform torn apart by frequencies)
let sonicWave = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 50;
    let r = 0.7 + 0.3 * Math.sin(u * 12) * Math.cos(t * Math.PI * 20);
    sonicWave.push({ x: r * Math.cos(u), y: 1.5 * (t - 0.5), z: r * Math.sin(u) });
}
shapes.push(sonicWave);

// 39. INFINITY MIRROR (Advanced 3D Lissajous knot)
let infinityMirror = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 4;
    let x = Math.sin(3 * u + Math.PI / 4) * 1.2;
    let y = Math.sin(4 * u) * 1.0;
    let z = Math.cos(5 * u) * 0.8;
    infinityMirror.push({ x, y, z });
}
shapes.push(infinityMirror);

// 40. SACRED HALO (Floating, overlapping holy rings)
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

// 41. TIME GLASS (Sand falling through a tight core)
let timeGlass = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 100;
    let y = 1.5 * (t - 0.5);
    let r = 0.1 + 1.2 * Math.pow(Math.abs(y), 1.5);
    timeGlass.push({ x: r * Math.cos(u), y: y, z: r * Math.sin(u) });
}
shapes.push(timeGlass);

// 42. ATOM CORE (Electrons in fast orbit)
let atomCore = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 120;
    let orbit = Math.floor(t * 4);
    let x = Math.cos(u), y = Math.sin(u), z = 0;
    // Rotates each orbit axis
    if (orbit === 1) { z = y; y = 0; }
    if (orbit === 2) { z = x; x = 0; }
    if (orbit === 3) { let temp = x; x = y * 0.7; y = temp * 0.7; z = Math.sin(u); }
    atomCore.push({ x, y, z });
}
shapes.push(atomCore);

// 43. CYBER TORNADO (Square, digital vortex)
let cyberTornado = [];
for (let i = 0; i < TOTAL_POINTS; i++) {
    let t = i / (TOTAL_POINTS - 1), u = t * Math.PI * 2 * 60;
    let r = 0.2 + 1.2 * t;
    // Forces the spiral to snap in sharp 90-degree angles
    let x = r * Math.cos(u) * Math.pow(Math.abs(Math.cos(u)), 0.1);
    let z = r * Math.sin(u) * Math.pow(Math.abs(Math.sin(u)), 0.1);
    cyberTornado.push({ x, y: 1.5 * (t - 0.5), z });
}
shapes.push(cyberTornado);


// --- STARFIELD ---
const stars = [];
const NUM_STARS = 1500;
for (let i = 0; i < NUM_STARS; i++) {
    stars.push({ x: (Math.random() - 0.5) * 6000, y: (Math.random() - 0.5) * 6000, z: Math.random() * 6000 });
}


// --- RANDOM STATE MACHINE LOGIC ---
let lastCycle = -1;
let fromIndex = Math.floor(Math.random() * shapes.length);
let toIndex = Math.floor(Math.random() * shapes.length);
if (fromIndex === toIndex) toIndex = (toIndex + 1) % shapes.length;


// --- DESKTOP: INITIALIZE AUDIO SYSTEM VIA SCREEN SHARE ---
startBtn.addEventListener('click', async () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioContext) {
            audioContext = new AudioContext();
        }
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // Prompt user for screen/audio sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        // --- LISTEN FOR "STOP SHARING" BUTTON ---
        stream.getVideoTracks()[0].onended = () => {
            // Stop the animation loop to give CPU/GPU a break
            cancelAnimationFrame(animationId);
            
            // Safely close the audio connection
            if (audioContext) {
                audioContext.close();
                audioContext = null; // Nulstil, så den kan genstartes
            }
            
            // Bring the landing page (container) back
            container.style.display = 'block';
            
            // Clear canvas so the last frame doesn't freeze on screen
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        
        // Hide UI and start drawing
        container.style.display = 'none';
        draw();
    } catch (err) {
        // Precise English error message alerting them of the missing toggle
        alert("Audio stream not found. Please click 'Connect Audio' again and remember to toggle 'Also share tab audio' or 'Share system audio' in the popup window before sharing.");
    }
});


// --- MOBILE: INITIALIZE AUDIO SYSTEM VIA MICROPHONE ---
micBtn.addEventListener('click', async () => {
    try {
        // 1. Opret AudioContext direkte på klikket, så vi ikke mister rettigheden
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioContext) {
            audioContext = new AudioContext();
        }
        
        // 2. Tving motoren til at vågne op fra dvale
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // 3. Tvinger telefonens hardware-filtre til at slukke!
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                echoCancellation: false, 
                noiseSuppression: false, 
                autoGainControl: false 
            }, 
            video: false 
        });
        
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        
        // Hide UI and start drawing
        container.style.display = 'none';
        draw();
    } catch (err) {
        // Precise English error message for mobile users
        alert("Microphone access denied. Please allow microphone permissions in your browser settings to use the visualizer on mobile.");
    }
});


// --- MAIN ANIMATION LOOP ---
function draw() {
    animationId = requestAnimationFrame(draw);
    time += 0.015; 
    
    // Process audio data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calculate heavy bass impact
    let bassSum = 0;
    for (let i = 1; i <= 5; i++) bassSum += dataArray[i];
    let bassPunch = Math.pow((bassSum / 5) / 255, 3);

    // Base rotation is slow, bass impact provides a soft push
    figureRotation += 0.002 + (bassPunch * 0.015);

    // --- RANDOMIZER TIMELINE LOGIC ---
    const CYCLE_LENGTH = 10;
    const HOLD_LENGTH = 6;
    let currentCycle = Math.floor(time / CYCLE_LENGTH);
    let cycleTime = time % CYCLE_LENGTH;
    
    // Check if we hit a new 10-second period
    if (currentCycle !== lastCycle) {
        if (lastCycle !== -1) { 
            fromIndex = toIndex;
            // Pick a new random shape that IS NOT the same as the current one
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * shapes.length);
            } while (nextIndex === fromIndex);
            toIndex = nextIndex;
        }
        lastCycle = currentCycle;
    }

    // Calculate smooth morphing weight (0 to 1)
    let morphWeight = 0;
    if (cycleTime > HOLD_LENGTH) {
        let rawWeight = (cycleTime - HOLD_LENGTH) / (CYCLE_LENGTH - HOLD_LENGTH);
        morphWeight = easeInOutCubic(rawWeight);
    }

    const fromShape = shapes[fromIndex];
    const toShape = shapes[toIndex];

    // Clear background with slight motion blur trail
    ctx.fillStyle = 'rgba(5, 5, 12, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    // Draw Stars
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

    // Slow down the axis swing
    let rotX = figureRotation * 0.15;
    let rotY = figureRotation * 0.25;
    
    // Color rotates over time and shifts entirely upon new cycle
    let hue = (time * 15 + (currentCycle * 60)) % 360;
    ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${0.5 + bassPunch * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    // Draw the active 3D shape line by line
    for (let i = 0; i < TOTAL_POINTS; i++) {
        let targetX = fromShape[i].x + (toShape[i].x - fromShape[i].x) * morphWeight;
        let targetY = fromShape[i].y + (toShape[i].y - fromShape[i].y) * morphWeight;
        let targetZ = fromShape[i].z + (toShape[i].z - fromShape[i].z) * morphWeight;

        // Sync specific points to specific audio frequencies
        let freqIndex = i % Math.floor(bufferLength / 2);
        let pointAudio = dataArray[freqIndex] / 255;
        
        let dynamicRadius = BASE_RADIUS + (pointAudio * 80) + (Math.sin(i + time * 10) * 15 * bassPunch);
        
        let x = targetX * dynamicRadius;
        let y = targetY * dynamicRadius;
        let z = targetZ * dynamicRadius;

        // Apply 3D rotation transformations
        let rotX_y = y * Math.cos(rotX) - z * Math.sin(rotX);
        let rotX_z = y * Math.sin(rotX) + z * Math.cos(rotX);
        let finalX = x * Math.cos(rotY) + rotX_z * Math.sin(rotY);
        let finalZ = -x * Math.sin(rotY) + rotX_z * Math.cos(rotY);

        // Project 3D onto 2D canvas
        let proj = project(finalX, rotX_y, finalZ);
        
        if (proj) {
            if (i === 0) {
                ctx.moveTo(proj.x, proj.y);
            } else {
                ctx.lineTo(proj.x, proj.y);
            }
            
            // Draw tiny glowing dots on points reacting heavily to music
            if (pointAudio > 0.7) {
                ctx.fillStyle = `hsla(${hue}, 100%, 85%, 0.9)`;
                ctx.fillRect(proj.x - 1, proj.y - 1, 2, 2);
            }
        }
    }
    ctx.stroke();
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
}