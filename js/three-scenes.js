/* =========================================================
   Maison Indigo — three.js scenes
   1) Interactive 3D living-room configurator (#roomCanvas)
   2) Floating sculptural objects behind the contact section (#ctaCanvas)
   ========================================================= */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function makeRenderer(canvas, alpha = false) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

/* Run a render loop only while the canvas is on screen */
function whenVisible(el, start, stop) {
  new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())), { rootMargin: "100px" }).observe(el);
}

/* ---------------------------------------------------------
   1) 3D ROOM CONFIGURATOR
   --------------------------------------------------------- */
function initRoom() {
  const canvas = document.getElementById("roomCanvas");
  if (!canvas) return;
  const stage = document.getElementById("roomStage");
  const loader = document.getElementById("roomLoader");

  const renderer = makeRenderer(canvas);
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#131B36");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(4.6, 2.5, 5.6);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.85, -0.6);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom = false;          // keep page scrolling natural
  controls.enablePan = false;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI / 2.15;
  controls.minAzimuthAngle = -0.35;
  controls.maxAzimuthAngle = 1.3;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.6;
  canvas.style.touchAction = "pan-y";   // allow vertical page scroll on phones

  /* ----- Materials (colour-switchable ones keep a target colour) ----- */
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...opts });
  const sofaMat = mat("#1B2550", { roughness: 0.92 });
  const wallMat = mat("#F7F8FC", { roughness: 0.95 });
  const rugMat = mat("#6E1229", { roughness: 1 });
  const floorMat = mat("#4A2C1D", { roughness: 0.42 });
  const targets = new Map([[sofaMat, new THREE.Color("#1B2550")], [wallMat, new THREE.Color("#F7F8FC")], [rugMat, new THREE.Color("#6E1229")], [floorMat, new THREE.Color("#4A2C1D")]]);

  const white = mat("#F4F6FB", { roughness: 0.85 });
  const black = mat("#0B0F1C", { roughness: 0.35, metalness: 0.6 });
  const marble = mat("#F3F5FB", { roughness: 0.15 });
  const wine = mat("#8E1B3A", { roughness: 0.4 });
  const navy = mat("#1B2550", { roughness: 0.6 });
  const cobalt = mat("#2541B2", { roughness: 0.3 });

  // Wood plank texture (drawn on a canvas, tinted by floorMat colour)
  const plank = document.createElement("canvas");
  plank.width = plank.height = 512;
  const g = plank.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) {
    const y = i * 64;
    g.fillStyle = `rgba(40,20,10,${0.04 + Math.random() * 0.08})`;
    g.fillRect(0, y, 512, 64);
    g.fillStyle = "rgba(20,10,5,.35)"; g.fillRect(0, y, 512, 2);
    const off = Math.random() * 512;
    g.fillRect(off, y, 2, 64);
    for (let k = 0; k < 14; k++) {
      g.strokeStyle = `rgba(30,15,8,${Math.random() * 0.12})`;
      g.beginPath(); g.moveTo(0, y + Math.random() * 64);
      g.bezierCurveTo(170, y + Math.random() * 64, 340, y + Math.random() * 64, 512, y + Math.random() * 64); g.stroke();
    }
  }
  const plankTex = new THREE.CanvasTexture(plank);
  plankTex.wrapS = plankTex.wrapT = THREE.RepeatWrapping;
  plankTex.repeat.set(3, 3);
  plankTex.colorSpace = THREE.SRGBColorSpace;
  floorMat.map = plankTex;

  // Abstract wall art texture
  const art = document.createElement("canvas");
  art.width = 512; art.height = 640;
  const a = art.getContext("2d");
  a.fillStyle = "#FFFFFF"; a.fillRect(0, 0, 512, 640);
  a.fillStyle = "#1B2550"; a.beginPath(); a.arc(220, 300, 150, 0, Math.PI * 2); a.fill();
  a.fillStyle = "#9E1E3C"; a.beginPath(); a.arc(330, 380, 110, Math.PI, Math.PI * 2.5); a.fill();
  a.strokeStyle = "#0B1020"; a.lineWidth = 6; a.beginPath(); a.moveTo(60, 560); a.bezierCurveTo(200, 470, 300, 620, 460, 520); a.stroke();
  const artTex = new THREE.CanvasTexture(art);
  artTex.colorSpace = THREE.SRGBColorSpace;

  const room = new THREE.Group();
  scene.add(room);
  const add = (geo, material, x, y, z, { cast = true, receive = true, rx = 0, ry = 0, rz = 0, parent = room } = {}) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.castShadow = cast; m.receiveShadow = receive;
    parent.add(m);
    return m;
  };
  const rbox = (w, h, d, r = 0.06) => new RoundedBoxGeometry(w, h, d, 4, r);

  /* ----- Shell ----- */
  add(new THREE.PlaneGeometry(9, 7), floorMat, 0, 0, 0, { rx: -Math.PI / 2, cast: false });
  add(new THREE.BoxGeometry(9, 3.4, 0.12), wallMat, 0, 1.7, -3.06, { cast: false });           // feature wall
  add(new THREE.BoxGeometry(0.12, 3.4, 7), white, -4.5, 1.7, 0.4, { cast: false });           // side wall
  add(new THREE.BoxGeometry(9, 0.1, 0.04), black, 0, 0.05, -2.98, { cast: false });           // skirting
  // vertical slat panelling behind sofa (follows wall colour)
  for (let i = -6; i <= 6; i++) add(new THREE.BoxGeometry(0.06, 2.6, 0.05), wallMat, i * 0.24, 1.3, -2.97);
  // window on side wall
  const sky = new THREE.MeshBasicMaterial({ color: "#E8EEFF" });
  add(new THREE.PlaneGeometry(2.4, 2), sky, -4.43, 1.7, -0.2, { ry: Math.PI / 2, cast: false, receive: false });
  [[0, 2.72, 2.5, 0.06], [0, 0.68, 2.5, 0.06]].forEach(([, y, w, h]) => add(new THREE.BoxGeometry(0.06, h, w), black, -4.41, y, -0.2));
  [-1.45, -0.2, 1.05].forEach((z) => add(new THREE.BoxGeometry(0.06, 2.1, 0.05), black, -4.41, 1.7, z));

  /* ----- Rug ----- */
  add(rbox(4, 0.03, 2.7, 0.012), rugMat, 0, 0.015, -0.5, { cast: false });

  /* ----- Sofa ----- */
  const sofa = new THREE.Group(); sofa.position.set(0, 0, -2.2); room.add(sofa);
  add(rbox(3, 0.36, 1.05, 0.08), sofaMat, 0, 0.3, 0, { parent: sofa });
  add(rbox(1.42, 0.2, 0.88, 0.08), sofaMat, -0.72, 0.58, 0.07, { parent: sofa });
  add(rbox(1.42, 0.2, 0.88, 0.08), sofaMat, 0.72, 0.58, 0.07, { parent: sofa });
  add(rbox(3, 0.62, 0.26, 0.1), sofaMat, 0, 0.78, -0.4, { parent: sofa });
  add(rbox(0.26, 0.6, 1.05, 0.1), sofaMat, -1.5, 0.42, 0, { parent: sofa });
  add(rbox(0.26, 0.6, 1.05, 0.1), sofaMat, 1.5, 0.42, 0, { parent: sofa });
  [[-1.4, 0.4], [1.4, 0.4], [-1.4, -0.4], [1.4, -0.4]].forEach(([x, z]) => add(new THREE.CylinderGeometry(0.03, 0.02, 0.12, 12), black, x, 0.06, z, { parent: sofa }));
  add(rbox(0.5, 0.48, 0.15, 0.07), white, -0.95, 0.88, -0.2, { rx: -0.25, rz: 0.12, parent: sofa });
  add(rbox(0.46, 0.44, 0.15, 0.07), wine, -0.5, 0.86, -0.18, { rx: -0.25, rz: -0.06, parent: sofa });
  add(rbox(0.5, 0.48, 0.15, 0.07), white, 0.95, 0.88, -0.2, { rx: -0.25, rz: -0.12, parent: sofa });

  /* ----- Coffee tables ----- */
  add(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 64), marble, 0.15, 0.42, -0.45);
  add(new THREE.CylinderGeometry(0.1, 0.16, 0.4, 32), black, 0.15, 0.2, -0.45);
  add(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 48), black, -0.65, 0.3, -0.05);
  add(new THREE.CylinderGeometry(0.06, 0.1, 0.28, 24), black, -0.65, 0.14, -0.05);
  // decor on table
  add(new THREE.CylinderGeometry(0.08, 0.12, 0.3, 32), wine, 0.35, 0.6, -0.55);
  add(new THREE.SphereGeometry(0.09, 32, 16), white, 0.05, 0.53, -0.35);
  add(rbox(0.36, 0.05, 0.26, 0.01), navy, -0.05, 0.47, -0.6, { ry: 0.3 });
  add(rbox(0.32, 0.04, 0.24, 0.01), white, -0.05, 0.515, -0.6, { ry: 0.45 });

  /* ----- Armchair ----- */
  const chair = new THREE.Group(); chair.position.set(2.1, 0, -0.2); chair.rotation.y = -0.9; room.add(chair);
  add(rbox(0.9, 0.4, 0.85, 0.12), white, 0, 0.32, 0, { parent: chair });
  add(rbox(0.9, 0.55, 0.2, 0.1), white, 0, 0.72, -0.34, { parent: chair });
  add(rbox(0.16, 0.45, 0.85, 0.08), white, -0.45, 0.48, 0, { parent: chair });
  add(rbox(0.16, 0.45, 0.85, 0.08), white, 0.45, 0.48, 0, { parent: chair });
  add(rbox(0.4, 0.38, 0.13, 0.06), cobalt, 0, 0.66, -0.2, { rx: -0.2, parent: chair });

  /* ----- Floor lamp ----- */
  add(new THREE.CylinderGeometry(0.18, 0.2, 0.03, 32), black, -2.15, 0.015, -2.3);
  add(new THREE.CylinderGeometry(0.015, 0.015, 1.65, 12), black, -2.15, 0.84, -2.3);
  const shade = add(new THREE.CylinderGeometry(0.18, 0.28, 0.32, 40, 1, true), new THREE.MeshStandardMaterial({ color: "#FFFFFF", emissive: "#FFFFFF", emissiveIntensity: 0.55, side: THREE.DoubleSide }), -2.15, 1.72, -2.3, { cast: false });
  const lampLight = new THREE.PointLight("#FFFFFF", 2.5, 5, 1.6);
  lampLight.position.set(-2.15, 1.6, -2.3);
  room.add(lampLight);

  /* ----- Pendant ----- */
  add(new THREE.CylinderGeometry(0.005, 0.005, 1.1, 6), black, 0.15, 2.85, -0.45, { cast: false });
  add(new THREE.SphereGeometry(0.2, 40, 20), new THREE.MeshStandardMaterial({ color: "#FFFFFF", emissive: "#FFFFFF", emissiveIntensity: 0.8 }), 0.15, 2.2, -0.45, { cast: false });

  /* ----- Wall art + shelves ----- */
  add(new THREE.BoxGeometry(1.1, 1.36, 0.04), black, 0, 2.05, -2.92, { cast: false });
  add(new THREE.PlaneGeometry(1.0, 1.26), new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.9 }), 0, 2.05, -2.895, { cast: false });
  [1.25, 1.85].forEach((y) => add(new THREE.BoxGeometry(1.1, 0.04, 0.3), black, 2.9, y, -2.85));
  add(new THREE.CylinderGeometry(0.07, 0.1, 0.26, 24), wine, 2.6, 1.4, -2.85);
  add(rbox(0.5, 0.08, 0.22, 0.01), navy, 3.1, 1.31, -2.85);
  add(rbox(0.45, 0.07, 0.2, 0.01), white, 3.1, 1.385, -2.85);
  add(new THREE.SphereGeometry(0.1, 32, 16), cobalt, 3.15, 1.97, -2.85);
  add(new THREE.TorusGeometry(0.11, 0.025, 16, 40), black, 2.7, 1.99, -2.85);

  /* ----- Side table + vase ----- */
  add(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 40), white, 1.95, 0.25, -2.35);
  add(new THREE.CylinderGeometry(0.06, 0.11, 0.4, 32), navy, 1.95, 0.7, -2.35);

  /* ----- Lighting ----- */
  scene.add(new THREE.HemisphereLight("#FFFFFF", "#1B2550", 0.45));
  const sun = new THREE.DirectionalLight("#FFFFFF", 1.7);
  sun.position.set(-6, 6, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
  sun.shadow.bias = -0.0005; sun.shadow.radius = 6;
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#DDE4FF", 0.6);
  fill.position.set(5, 3, 6);
  scene.add(fill);

  /* ----- UI: swatches ----- */
  const partMat = { sofa: sofaMat, wall: wallMat, rug: rugMat, floor: floorMat };
  document.querySelectorAll("#swatches .swatches__group").forEach((group) => {
    const m = partMat[group.dataset.part];
    group.querySelectorAll(".swatch").forEach((btn) =>
      btn.addEventListener("click", () => {
        group.querySelectorAll(".swatch").forEach((b) => b.classList.toggle("is-active", b === btn));
        targets.get(m).set(btn.dataset.color);
        // marble floor gets a smoother, less wood-grained finish
        if (m === floorMat) {
          const isMarble = btn.dataset.color.toUpperCase() === "#E9ECF5";
          floorMat.map = isMarble ? null : plankTex;
          floorMat.roughness = isMarble ? 0.12 : 0.42;
          floorMat.needsUpdate = true;
        }
        pulse = 1;
      })
    );
  });

  /* ----- UI: camera presets ----- */
  const views = {
    front: { pos: new THREE.Vector3(0.6, 2.1, 6.4), target: new THREE.Vector3(0, 0.85, -0.8) },
    corner: { pos: new THREE.Vector3(4.6, 2.5, 5.6), target: new THREE.Vector3(0, 0.85, -0.6) },
    top: { pos: new THREE.Vector3(1.2, 8.5, 2.6), target: new THREE.Vector3(0, 0, -0.6) },
  };
  let camTween = null;
  document.querySelectorAll(".studio3d__view button").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".studio3d__view button").forEach((x) => x.classList.toggle("is-active", x === b));
      const v = views[b.dataset.view];
      camTween = { fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toPos: v.pos, toTarget: v.target, t: 0 };
      controls.autoRotate = false;
    })
  );
  controls.addEventListener("start", () => { controls.autoRotate = false; camTween = null; });
  // Resume a gentle auto-rotate after 6s of inactivity
  let idleTimer;
  controls.addEventListener("end", () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => (controls.autoRotate = !reduceMotion), 6000); });

  /* ----- Resize ----- */
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 560 ? 50 : 38;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  /* ----- Loop ----- */
  const clock = new THREE.Clock();
  let running = false, pulse = 0;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const tick = () => {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    targets.forEach((target, m) => m.color.lerp(target, 1 - Math.pow(0.002, dt)));
    if (camTween) {
      camTween.t = Math.min(camTween.t + dt / 1.4, 1);
      const k = ease(camTween.t);
      camera.position.lerpVectors(camTween.fromPos, camTween.toPos, k);
      controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, k);
      if (camTween.t >= 1) camTween = null;
    }
    // bounce auto-rotation between the azimuth limits
    if (controls.autoRotate) {
      const az = controls.getAzimuthalAngle();
      if (az > controls.maxAzimuthAngle - 0.02) controls.autoRotateSpeed = Math.abs(controls.autoRotateSpeed);
      if (az < controls.minAzimuthAngle + 0.02) controls.autoRotateSpeed = -Math.abs(controls.autoRotateSpeed);
    }
    pulse *= 0.92;
    shade.material.emissiveIntensity = 0.55 + Math.sin(t * 2) * 0.03 + pulse * 0.4;
    lampLight.intensity = 2.5 + pulse * 3;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  whenVisible(stage, () => { if (!running) { running = true; clock.getDelta(); tick(); } }, () => (running = false));

  renderer.render(scene, camera);
  loader.classList.add("is-hidden");
}

/* ---------------------------------------------------------
   2) CONTACT SECTION — floating sculptural objects
   --------------------------------------------------------- */
function initCta() {
  const canvas = document.getElementById("ctaCanvas");
  if (!canvas) return;
  const section = canvas.parentElement;
  const renderer = makeRenderer(canvas, true);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  const phys = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08, ...extra });
  const objects = [];
  const addObj = (geo, material, pos, speed, rotSpeed) => {
    const m = new THREE.Mesh(geo, material);
    m.position.copy(pos);
    m.userData = { base: pos.clone(), speed, rotSpeed, phase: Math.random() * Math.PI * 2 };
    scene.add(m); objects.push(m);
    return m;
  };
  // Objects sit in the margins/padding around the content so they never cover text
  addObj(new THREE.TorusGeometry(1.3, 0.4, 48, 120), phys("#7A1530"), new THREE.Vector3(-12.6, 5.4, -8), 0.6, new THREE.Vector3(0.2, 0.35, 0));
  addObj(new THREE.SphereGeometry(1, 64, 32), phys("#FFFFFF", { roughness: 0.05 }), new THREE.Vector3(-12.4, -5.6, -6), 0.8, new THREE.Vector3(0, 0.2, 0));
  addObj(new RoundedBoxGeometry(1.7, 1.7, 1.7, 6, 0.3), phys("#2541B2"), new THREE.Vector3(12.9, -5.4, -8), 0.5, new THREE.Vector3(0.3, 0.25, 0.1));
  addObj(new THREE.TorusKnotGeometry(0.95, 0.26, 200, 24), phys("#F4F6FB"), new THREE.Vector3(12.7, 5.2, -8), 0.7, new THREE.Vector3(0.15, 0.3, 0.05));
  addObj(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 64), phys("#7A1530"), new THREE.Vector3(0.1, 6.4, -8), 0.9, new THREE.Vector3(0.6, 0.2, 0.3));
  addObj(new THREE.IcosahedronGeometry(0.7, 0), phys("#FFFFFF", { flatShading: true }), new THREE.Vector3(0.2, -6.5, -8), 1.1, new THREE.Vector3(0.4, 0.5, 0));
  addObj(new THREE.SphereGeometry(0.4, 48, 24), phys("#2541B2"), new THREE.Vector3(-6, 6.8, -10), 1.2, new THREE.Vector3(0, 0, 0));

  scene.add(new THREE.AmbientLight("#FFFFFF", 0.4));
  const key = new THREE.DirectionalLight("#FFFFFF", 2.2); key.position.set(5, 8, 10); scene.add(key);
  const rim = new THREE.PointLight("#AFC0FF", 25, 40); rim.position.set(-8, -4, 2); scene.add(rim);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  section.addEventListener("mousemove", (e) => {
    const r = section.getBoundingClientRect();
    mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });

  const resize = () => {
    const w = section.clientWidth, h = section.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 760 ? 22 : 14;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(section);
  resize();

  const clock = new THREE.Clock();
  let running = false, scrollY = 0;
  window.addEventListener("scroll", () => (scrollY = window.scrollY), { passive: true });
  const tick = () => {
    if (!running) return;
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    objects.forEach((o) => {
      const { base, speed, rotSpeed, phase } = o.userData;
      const motion = reduceMotion ? 0 : 1;
      o.position.x = base.x + Math.cos(t * speed * 0.5 + phase) * 0.25 * motion + mouse.x * 0.5;
      o.position.y = base.y + Math.sin(t * speed + phase) * 0.35 * motion - mouse.y * 0.4 + Math.sin(scrollY * 0.002 + phase) * 0.15;
      o.rotation.x += rotSpeed.x * 0.01 * motion;
      o.rotation.y += rotSpeed.y * 0.01 * motion;
      o.rotation.z += rotSpeed.z * 0.01 * motion;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  whenVisible(section, () => { if (!running) { running = true; tick(); } }, () => (running = false));
}

try { initRoom(); } catch (e) { console.warn("3D room unavailable:", e); const l = document.getElementById("roomLoader"); if (l) l.textContent = "3D preview needs WebGL"; }
try { initCta(); } catch (e) { console.warn("3D background unavailable:", e); }
