<h1 align="center">
  LUMINA - Immersive 3D Audio Visualizer
</h1>

<p align="center">
  A real-time, browser-based 3D audio visualizer built with Vanilla JS, HTML Canvas, and the Web Audio API. Watch music come alive through 43 unique, morphing mathematical shapes.
</p>

---

## ✨ Features

* **📱 Mobile-Ready Parallel Audio Engine:** Bypasses strict mobile OS (iOS/Android) autoplay and muting policies by isolating speaker output from mathematical audio analysis.
* **📻 Live Radio Integration:** Instantly stream and visualize internet radio stations (like SomaFM) utilizing integrated CORS-friendly routing.
* **🎵 Local File Processing:** Drag-and-drop support for local music files (`.mp3`, `.wav`, `.flac`, `.ogg`). The file stays on your device and is decoded locally.
* **🖥️ Desktop Screen Share:** Route audio from Spotify, YouTube, or any active browser tab via the native screen-sharing API (Desktop only).
* **🌌 Infinite Morphing Geometry:** 43 mathematically generated 3D structures (Tesseracts, Black Holes, DNA Spirals, etc.) that continuously cycle and transition.

## 🚀 How It Works

LUMINA extracts real-time frequency data from the active audio source. It isolates heavy low-end (bass) frequencies to drive sudden 3D camera shifts and starfield acceleration, while mid-to-high frequencies warp the individual vertices of the active 3D wireframe shape. 

The application utilizes a completely dependency-free **Canvas 2D projection matrix** to render 3D coordinates on a standard 2D plane, ensuring extremely high framerates across all devices.

## 🧠 Technical Highlights

* **No Frameworks:** 100% Vanilla JavaScript, CSS3, and HTML5. No React, Vue, or Three.js dependencies.
* **The "Parallel Track" Architecture:** Mobile browsers aggressively block web applications from piping audio directly into a `MediaElementSource` node. LUMINA solves this by playing standard `<audio>` to the OS speakers, while simultaneously streaming a muted, parallel buffer track exclusively to the Web Audio API's analyzer.
* **Dynamic Background:** The `requestAnimationFrame` loop starts on load, providing a gorgeous "idle" rotating 3D background behind the UI menu before any music is even selected.
* **Responsive Frost Glass UI:** A modern, non-intrusive UI overlaid on the canvas using CSS `backdrop-filter`.

## 🎮 Controls

* **Master Volume / Mute:** Available in the top-right corner during playback. Synchronizes the standard DOM audio element with the Web Audio API's `GainNode`.
* **Menu Navigation:** Instantly swap tracks or radio stations without refreshing the page using the "Menu" button. The engine safely disconnects and purges existing audio buffers from RAM to prevent memory leaks.

---
<p align="center">
  <i>Developed for the love of music and math by LasBoi</i>
</p>
