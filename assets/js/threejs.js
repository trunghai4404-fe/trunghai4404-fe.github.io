import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

const canvas = document.getElementById("bg");

if (!canvas) {
    throw new Error('Không tìm thấy <canvas id="bg"></canvas>');
}

const scene = new THREE.Scene();
const clock = new THREE.Clock();

const mouseTarget3D = new THREE.Vector3();
const mouseSmooth3D = new THREE.Vector3(9999, 9999, 0);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 60;

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

const particleCount = 1000;

const positions = new Float32Array(particleCount * 3);
const originalPositions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);

const floatOffsets = new Float32Array(particleCount);
const floatSpeeds = new Float32Array(particleCount);

const alphas = new Float32Array(particleCount);
const alphaOffsets = new Float32Array(particleCount);
const alphaSpeeds = new Float32Array(particleCount);

const spreadX = 170;
const spreadY = 130;

// PHÂN BỔ ĐỀU HƠN: grid + jitter nhẹ
function generateEvenPoints(count, width, height) {
    const pts = [];

    const aspect = width / height;
    const cols = Math.ceil(Math.sqrt(count * aspect));
    const rows = Math.ceil(count / cols);

    const cellW = (width * 2) / cols;
    const cellH = height / rows;

    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        let x = -width + col * cellW + cellW * 0.5;
        let y = -height / 2 + row * cellH + cellH * 0.5;

        // thêm nhiễu nhẹ để không quá cứng như lưới
        x += (Math.random() - 0.5) * cellW * 0.45;
        y += (Math.random() - 0.5) * cellH * 0.45;

        pts.push({ x, y });
    }

    return pts;
}

const distributedPoints = generateEvenPoints(
    particleCount,
    spreadX,
    spreadY
);

for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const p = distributedPoints[i];

    const x = p.x;
    const y = p.y;
    const z = (Math.random() - 0.5) * 20;

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    originalPositions[i3] = x;
    originalPositions[i3 + 1] = y;
    originalPositions[i3 + 2] = z;

    velocities[i3] = 0;
    velocities[i3 + 1] = 0;
    velocities[i3 + 2] = 0;

    floatOffsets[i] = Math.random() * Math.PI * 2;
    floatSpeeds[i] = 0.015 + Math.random() * 0.03;

    alphas[i] = 0.4 + Math.random() * 0.6;
    alphaOffsets[i] = Math.random() * Math.PI * 2;
    alphaSpeeds[i] = 0.8 + Math.random() * 1.8;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

const texture = new THREE.TextureLoader().load(
    "https://threejs.org/examples/textures/sprites/disc.png"
);

const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
        pointTexture: { value: texture },
    },
    vertexShader: `
    attribute float alpha;
    varying float vAlpha;

    void main() {
      vAlpha = alpha;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 4.2 * (60.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
    fragmentShader: `
    uniform sampler2D pointTexture;
    varying float vAlpha;

    void main() {
      vec4 texColor = texture2D(pointTexture, gl_PointCoord);
      gl_FragColor = vec4(1.0, 1.0, 1.0, texColor.a * vAlpha);
    }
  `,
});

const points = new THREE.Points(geometry, material);
scene.add(points);

const mouse = new THREE.Vector2(9999, 9999);
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("mouseleave", () => {
    mouse.x = 9999;
    mouse.y = 9999;
});

function updateMouse3D() {
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, mouseTarget3D);
    mouseSmooth3D.lerp(mouseTarget3D, 0.12);
}

function animate() {
    requestAnimationFrame(animate);

    updateMouse3D();

    const pos = geometry.attributes.position.array;
    const alphaAttr = geometry.attributes.alpha.array;
    const time = clock.getElapsedTime();

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        const px = pos[i3];
        const py = pos[i3 + 1];
        const pz = pos[i3 + 2];

        const ox = originalPositions[i3];
        const oy = originalPositions[i3 + 1];
        const oz = originalPositions[i3 + 2];

        let vx = velocities[i3];
        let vy = velocities[i3 + 1];
        let vz = velocities[i3 + 2];

        const speed = 0.8 + floatSpeeds[i] * 25;

        const floatX =
            Math.cos(time * speed + floatOffsets[i]) * 1.2 +
            Math.sin(time * speed * 0.55 + floatOffsets[i]) * 0.6;

        const floatY =
            Math.sin(time * speed * 0.85 + floatOffsets[i]) * 1.6 +
            Math.cos(time * speed * 0.45 + floatOffsets[i]) * 0.8;

        let targetX = ox + floatX;
        let targetY = oy + floatY;
        let targetZ = oz;

        const dx = mouseSmooth3D.x - px;
        const dy = mouseSmooth3D.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const influenceRadius = 34;
        const ringRadius = 10;
        const attractionStrength = 0.010;
        const followStrength = 0.020;
        const returnStrength = 0.014;
        const damping = 0.94;

        if (dist < influenceRadius) {
            const t = 1 - dist / influenceRadius;
            const smooth = t * t * (3 - 2 * t);

            const angle = floatOffsets[i] + time * 0.8;

            const ringX = mouseSmooth3D.x + Math.cos(angle) * ringRadius;
            const ringY = mouseSmooth3D.y + Math.sin(angle) * ringRadius;

            targetX = ox + floatX + (ringX - (ox + floatX)) * smooth;
            targetY = oy + floatY + (ringY - (oy + floatY)) * smooth;

            vx += (targetX - px) * attractionStrength;
            vy += (targetY - py) * attractionStrength;

            vx += (mouseSmooth3D.x - px) * followStrength * 0.08 * smooth;
            vy += (mouseSmooth3D.y - py) * followStrength * 0.08 * smooth;
        } else {
            vx += (targetX - px) * returnStrength;
            vy += (targetY - py) * returnStrength;
        }

        vz += (targetZ - pz) * returnStrength;

        vx *= damping;
        vy *= damping;
        vz *= damping;

        pos[i3] += vx;
        pos[i3 + 1] += vy;
        pos[i3 + 2] += vz;

        velocities[i3] = vx;
        velocities[i3 + 1] = vy;
        velocities[i3 + 2] = vz;

        alphaAttr[i] =
            0.18 +
            (Math.sin(time * alphaSpeeds[i] + alphaOffsets[i]) * 0.5 + 0.5) * 0.82;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.alpha.needsUpdate = true;

    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});