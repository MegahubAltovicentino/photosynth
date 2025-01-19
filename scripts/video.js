import * as THREE from 'three';
import { contain } from 'three/src/extras/TextureUtils.js';

const container = document.getElementById('three-container');

// SCENE SETUP --------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Alpha for transparency
renderer.setSize(container.offsetWidth, container.offsetHeight);
container.appendChild(renderer.domElement);

// VIDEO LOADING ------------------------------------------------------------
const video = document.createElement('video');
video.src = '/videos/Chrysaora_Fuscescens_Aquarium_Monterey.mp4'; 
video.loop = true;
video.muted = true;

let videoWidth = container.offsetWidght;
let videoHeight = container.offsetHeight;

document.addEventListener('click', () => {
    video.play().catch((error) => {
        console.error("Video playback failed:", error);
    });
});
const videoTexture = new THREE.VideoTexture(video);

// PLANE MESH ----------------------------------------------------------

const vertexShader = `
    varying vec2 vUv;
    void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform sampler2D videoTexture;
    uniform float distortionAmount;
    varying vec2 vUv;

    void main() {
    vec4 color = texture2D(videoTexture, vUv);

    // Apply color distortion
    color.r = mix(color.r, color.b, distortionAmount);
    color.g = mix(color.g, color.r, distortionAmount);
    color.b = mix(color.b, color.g, distortionAmount);

    gl_FragColor = color;
    }
`;

const material = new THREE.ShaderMaterial({
    uniforms: {
    videoTexture: { value: videoTexture },
    distortionAmount: { value: 0.0 }, // Start with no distortion
    },
    vertexShader,
    fragmentShader,
});

const geometry = new THREE.PlaneGeometry(videoWidth / 50, videoHeight / 100); 

const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Update plane geometry when video metadata is loaded
video.addEventListener('loadedmetadata', () => {
    const aspectRatio = video.videoWidth / video.videoHeight;
    plane.geometry = new THREE.PlaneGeometry(2 * aspectRatio, 2);
});

video.addEventListener('loadedmetadata', () => {
    videoHeight = container.offsetHeight; 
    videoWidth = container.offsetWidth;

    console.log('Video Dimensions:', videoWidth, videoHeight);

    // Update plane geometry with actual video dimensions
    const updatedGeometry = new THREE.PlaneGeometry(videoWidth / 100, videoHeight / 100);
    plane.geometry.dispose(); // Dispose of the old geometry
    plane.geometry = updatedGeometry; // Assign the new geometry
});

// Play the video
video.play();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// EVENT LISTENERS ----------------------------------------------------------
let isDistortionOn = false;
document.addEventListener('keydown', (event) => {
    if (event.key === 'd') { // Press 'D' to toggle distortion
        isDistortionOn = !isDistortionOn;
        plane.material.uniforms.distortionAmount.value = isDistortionOn ? 1.0 : 0.0;
    }
});

window.addEventListener('resize', () => {
    const aspect = container.offsetWidth / container.offsetHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
});