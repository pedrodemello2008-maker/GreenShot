/*
 * GreenShot — Ecossistema 3D
 * Cena animada em Three.js que evolui de terra árida até um paraíso grego
 * (Monte Parnaso), de acordo com o progresso cumulativo do usuário (0-100).
 * Modelos low-poly simples, no espírito de "Cell to Singularity": formas
 * geométricas básicas, cores vibrantes, e bastante animação.
 */
(function (global) {
  "use strict";

  const STAGES = [
    {
      id: 0,
      name: "Terra Árida",
      min: 0,
      groundColor: 0xb5793f,
      groundColorAlt: 0x8f5f30,
      fogColor: 0xc68a52,
      ambient: 0xffcf99,
      ambientIntensity: 0.9,
      sunColor: 0xffdca8,
      sunIntensity: 0.9,
      treeCount: 2,
      treeType: "dead",
      hasTemple: false,
      columnCount: 0,
      hasWater: false,
      hasMountain: false,
      hasFireflies: false,
      animals: ["vulture"],
      flowers: 0,
    },
    {
      id: 1,
      name: "Brotando",
      min: 20,
      groundColor: 0x8fae5b,
      groundColorAlt: 0x7a9a4d,
      fogColor: 0x9db98f,
      ambient: 0xdfefff,
      ambientIntensity: 1.0,
      sunColor: 0xfff3d6,
      sunIntensity: 1.0,
      treeCount: 5,
      treeType: "sapling",
      hasTemple: false,
      columnCount: 0,
      hasWater: false,
      hasMountain: false,
      hasFireflies: false,
      animals: ["butterfly", "butterfly"],
      flowers: 6,
    },
    {
      id: 2,
      name: "Jardim Grego",
      min: 40,
      groundColor: 0x6fae52,
      groundColorAlt: 0x5f9a45,
      fogColor: 0xa9c98f,
      ambient: 0xeaf6ff,
      ambientIntensity: 1.05,
      sunColor: 0xfff6e0,
      sunIntensity: 1.1,
      treeCount: 8,
      treeType: "olive",
      hasTemple: false,
      columnCount: 4,
      hasWater: true,
      hasMountain: true,
      hasFireflies: false,
      animals: ["butterfly", "goat", "dove"],
      flowers: 14,
    },
    {
      id: 3,
      name: "Bosque Sagrado",
      min: 60,
      groundColor: 0x4f9a55,
      groundColorAlt: 0x3f8a48,
      fogColor: 0x7fbf9e,
      ambient: 0xfff0d8,
      ambientIntensity: 1.1,
      sunColor: 0xffe9c2,
      sunIntensity: 1.2,
      treeCount: 12,
      treeType: "cypress",
      hasTemple: true,
      columnCount: 6,
      hasWater: true,
      hasMountain: true,
      hasFireflies: false,
      animals: ["dove", "dove", "deer", "butterfly"],
      flowers: 22,
    },
    {
      id: 4,
      name: "Monte Parnaso",
      min: 80,
      groundColor: 0x3f9a5f,
      groundColorAlt: 0x2f8a52,
      fogColor: 0xf0a95e,
      ambient: 0xffd9a0,
      ambientIntensity: 1.15,
      sunColor: 0xffdca0,
      sunIntensity: 1.35,
      treeCount: 14,
      treeType: "cypress",
      hasTemple: true,
      columnCount: 8,
      hasWater: true,
      hasMountain: true,
      hasFireflies: true,
      animals: ["dove", "dove", "deer", "peacock", "butterfly"],
      flowers: 30,
    },
  ];

  function getStageForProgress(progress) {
    let stage = STAGES[0];
    for (const s of STAGES) if (progress >= s.min) stage = s;
    return stage;
  }

  function lerpColor(hexA, hexB, t) {
    const a = new THREE.Color(hexA);
    const b = new THREE.Color(hexB);
    return a.lerp(b, t);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  class GreenShotEcosystem3D {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.progress = opts.initialProgress ?? 30;
      this.stage = getStageForProgress(this.progress);
      this.clock = new THREE.Clock();
      this.animatables = []; // { tick(dt, elapsed) }
      this.dragging = false;
      this.azimuth = 0.55; // ângulo horizontal da câmera (radianos)
      this.polar = 0.34; // inclinação vertical
      this.targetAzimuth = this.azimuth;
      this.userInteracted = false;

      this._initRenderer();
      this._initScene();
      this._buildStage(this.stage, true);
      this._bindInteraction();
      this._onResize();
      window.addEventListener("resize", () => this._onResize());
      this._animate();
    }

    _initRenderer() {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = false;
    }

    _initScene() {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

      this.hemi = new THREE.HemisphereLight(0xffffff, 0x223322, 1);
      this.scene.add(this.hemi);

      this.sun = new THREE.DirectionalLight(0xffffff, 1);
      this.sun.position.set(4, 6, 3);
      this.scene.add(this.sun);

      this.world = new THREE.Group();
      this.scene.add(this.world);

      this.scene.fog = new THREE.Fog(0x9db98f, 9, 20);
    }

    _bindInteraction() {
      let lastX = 0;
      const start = (x) => {
        this.dragging = true;
        lastX = x;
        this.userInteracted = true;
      };
      const move = (x) => {
        if (!this.dragging) return;
        const dx = x - lastX;
        lastX = x;
        this.targetAzimuth += dx * 0.008;
      };
      const end = () => {
        this.dragging = false;
      };

      this.canvas.addEventListener("pointerdown", (e) => start(e.clientX));
      window.addEventListener("pointermove", (e) => move(e.clientX));
      window.addEventListener("pointerup", end);
      this.canvas.addEventListener(
        "touchstart",
        (e) => start(e.touches[0].clientX),
        { passive: true },
      );
      window.addEventListener(
        "touchmove",
        (e) => {
          if (this.dragging) move(e.touches[0].clientX);
        },
        { passive: true },
      );
      window.addEventListener("touchend", end);
    }

    _onResize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }

    setProgress(progress) {
      this.progress = Math.max(0, Math.min(100, progress));
      const nextStage = getStageForProgress(this.progress);
      if (nextStage.id !== this.stage.id) {
        this.stage = nextStage;
        this._buildStage(this.stage, false);
      }
    }

    getStage() {
      return this.stage;
    }

    /* ---------------- construção da cena por estágio ---------------- */
    _buildStage(stage, immediate) {
      // limpa mundo anterior
      while (this.world.children.length) {
        const obj = this.world.children.pop();
        this._disposeObject(obj);
      }
      this.animatables = [];

      this._buildGround(stage);
      if (stage.hasMountain) this._buildMountain(stage);
      this._buildTrees(stage);
      this._buildFlowers(stage);
      if (stage.hasTemple) this._buildTemple(stage);
      else if (stage.columnCount > 0) this._buildRuins(stage);
      if (stage.hasWater) this._buildWater(stage);
      stage.animals.forEach((type, i) => this._buildAnimal(type, i, stage));
      if (stage.hasFireflies) this._buildFireflies(stage);

      // luz/fog fazem uma transição suave
      this._tweenEnvironment(stage, immediate);

      // "nasce" com um leve crescimento (fade/scale in)
      this.world.scale.setScalar(immediate ? 1 : 0.85);
      this._popIn = immediate ? 0 : 1;
    }

    _tweenEnvironment(stage, immediate) {
      const dur = immediate ? 0 : 1.4;
      const fromFog = this.scene.fog.color.clone();
      const fromAmbient = this.hemi.color.clone();
      const fromSun = this.sun.color.clone();
      const fromSunI = this.sun.intensity;
      const fromAmbI = this.hemi.intensity;
      const toFog = new THREE.Color(stage.fogColor);
      const toAmbient = new THREE.Color(stage.ambient);
      const toSun = new THREE.Color(stage.sunColor);
      const start = performance.now();
      const step = () => {
        const t =
          dur === 0
            ? 1
            : Math.min(1, (performance.now() - start) / (dur * 1000));
        const eased = 1 - Math.pow(1 - t, 3);
        this.scene.fog.color.copy(fromFog).lerp(toFog, eased);
        this.hemi.color.copy(fromAmbient).lerp(toAmbient, eased);
        this.hemi.intensity =
          fromAmbI + (stage.ambientIntensity - fromAmbI) * eased;
        this.sun.color.copy(fromSun).lerp(toSun, eased);
        this.sun.intensity = fromSunI + (stage.sunIntensity - fromSunI) * eased;
        if (t < 1) requestAnimationFrame(step);
      };
      step();
    }

    _disposeObject(obj) {
      obj.traverse?.((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material))
            child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    }

    _buildGround(stage) {
      const geo = new THREE.CircleGeometry(7.5, 48);
      // leve deslocamento vertical aleatório para dar textura de terreno
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i),
          y = pos.getY(i);
        const d = Math.sqrt(x * x + y * y);
        pos.setZ(i, Math.sin(x * 1.3) * Math.cos(y * 1.1) * 0.05 * (d / 7.5));
      }
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: stage.groundColor,
        roughness: 1,
        flatShading: true,
      });
      const ground = new THREE.Mesh(geo, mat);
      ground.rotation.x = -Math.PI / 2;
      this.world.add(ground);

      // anel externo mais escuro (transição de terreno)
      const ringGeo = new THREE.RingGeometry(7.4, 9, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: stage.groundColorAlt,
        roughness: 1,
        flatShading: true,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.02;
      this.world.add(ring);
    }

    _buildMountain(stage) {
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x7f8fa6,
        flatShading: true,
        roughness: 1,
      });
      const snowMat = new THREE.MeshStandardMaterial({
        color: 0xf5f7fb,
        flatShading: true,
        roughness: 0.8,
      });

      const peaks = [
        { x: -2.6, z: -6.5, h: 3.6, r: 2.1 },
        { x: 0.2, z: -7.2, h: 4.6, r: 2.6 },
        { x: 2.8, z: -6.2, h: 3.2, r: 2.0 },
      ];
      peaks.forEach((p) => {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(p.r, p.h, 6),
          bodyMat,
        );
        cone.position.set(p.x, p.h / 2, p.z);
        group.add(cone);
        if (this.stage.id >= 4) {
          const cap = new THREE.Mesh(
            new THREE.ConeGeometry(p.r * 0.4, p.h * 0.28, 6),
            snowMat,
          );
          cap.position.set(p.x, p.h - p.h * 0.14 + 0.02, p.z);
          group.add(cap);
        }
      });
      this.world.add(group);
    }

    _buildTrees(stage) {
      const count = stage.treeCount;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
        const radius = rand(2.6, 6.4);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const tree = this._makeTree(stage.treeType);
        tree.position.set(x, 0, z);
        tree.rotation.y = rand(0, Math.PI * 2);
        const s = rand(0.8, 1.15);
        tree.scale.setScalar(s);
        this.world.add(tree);

        // leve balanço com o vento
        const sway = rand(0.6, 1.1);
        const phase = rand(0, Math.PI * 2);
        this.animatables.push({
          tick: (dt, elapsed) => {
            tree.rotation.z = Math.sin(elapsed * sway + phase) * 0.035;
          },
        });
      }
    }

    _makeTree(type) {
      const group = new THREE.Group();
      if (type === "dead") {
        const trunkMat = new THREE.MeshStandardMaterial({
          color: 0x5a3d28,
          flatShading: true,
        });
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.09, 1.3, 5),
          trunkMat,
        );
        trunk.position.y = 0.65;
        group.add(trunk);
        for (let i = 0; i < 3; i++) {
          const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.04, 0.6, 4),
            trunkMat,
          );
          branch.position.set(
            rand(-0.15, 0.15),
            1.1 + i * 0.15,
            rand(-0.15, 0.15),
          );
          branch.rotation.z = rand(-0.9, 0.9);
          branch.rotation.x = rand(-0.4, 0.4);
          group.add(branch);
        }
        return group;
      }
      if (type === "sapling") {
        const trunkMat = new THREE.MeshStandardMaterial({
          color: 0x6b4a2f,
          flatShading: true,
        });
        const leafMat = new THREE.MeshStandardMaterial({
          color: 0x8fd45a,
          flatShading: true,
        });
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.05, 0.5, 5),
          trunkMat,
        );
        trunk.position.y = 0.25;
        group.add(trunk);
        const leaf = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.28, 0),
          leafMat,
        );
        leaf.position.y = 0.62;
        group.add(leaf);
        return group;
      }
      if (type === "olive") {
        const trunkMat = new THREE.MeshStandardMaterial({
          color: 0x8a7355,
          flatShading: true,
        });
        const leafMat = new THREE.MeshStandardMaterial({
          color: 0x9db35a,
          flatShading: true,
        });
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.1, 0.9, 6),
          trunkMat,
        );
        trunk.position.y = 0.45;
        group.add(trunk);
        for (let i = 0; i < 3; i++) {
          const clump = new THREE.Mesh(
            new THREE.IcosahedronGeometry(rand(0.28, 0.36), 0),
            leafMat,
          );
          clump.position.set(
            rand(-0.22, 0.22),
            0.95 + i * 0.18,
            rand(-0.22, 0.22),
          );
          group.add(clump);
        }
        return group;
      }
      // cypress (padrão para estágios avançados)
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x4a3524,
        flatShading: true,
      });
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x2f6b45,
        flatShading: true,
      });
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.08, 0.4, 5),
        trunkMat,
      );
      trunk.position.y = 0.2;
      group.add(trunk);
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 1.7, 7),
        leafMat,
      );
      spire.position.y = 1.2;
      group.add(spire);
      return group;
    }

    _buildFlowers(stage) {
      const colors = [0xff6f91, 0xffd166, 0xef476f, 0xf7f7f2, 0xa78bfa];
      for (let i = 0; i < stage.flowers; i++) {
        const angle = rand(0, Math.PI * 2);
        const radius = rand(1.2, 6.8);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const color = colors[i % colors.length];
        const stemMat = new THREE.MeshStandardMaterial({
          color: 0x3f7a3f,
          flatShading: true,
        });
        const petalMat = new THREE.MeshStandardMaterial({
          color,
          flatShading: true,
        });
        const flower = new THREE.Group();
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.015, 0.16, 4),
          stemMat,
        );
        stem.position.y = 0.08;
        flower.add(stem);
        const bloom = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.045, 0),
          petalMat,
        );
        bloom.position.y = 0.17;
        flower.add(bloom);
        flower.position.set(x, 0, z);
        this.world.add(flower);
        const phase = rand(0, Math.PI * 2);
        this.animatables.push({
          tick: (dt, e) => {
            flower.rotation.z = Math.sin(e * 1.4 + phase) * 0.12;
          },
        });
      }
    }

    _buildRuins(stage) {
      const marble = new THREE.MeshStandardMaterial({
        color: 0xece6da,
        flatShading: true,
        roughness: 0.9,
      });
      const group = new THREE.Group();
      for (let i = 0; i < stage.columnCount; i++) {
        const angle = (i / stage.columnCount) * Math.PI * 2;
        const radius = 3.6;
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.16, rand(0.8, 1.3), 8),
          marble,
        );
        col.position.set(
          Math.cos(angle) * radius,
          col.geometry.parameters.height / 2,
          Math.sin(angle) * radius - 2,
        );
        col.rotation.z = rand(-0.15, 0.15);
        group.add(col);
      }
      this.world.add(group);
    }

    _buildTemple(stage) {
      const marble = new THREE.MeshStandardMaterial({
        color: 0xf3efe3,
        flatShading: true,
        roughness: 0.85,
      });
      const roofMat = new THREE.MeshStandardMaterial({
        color: 0xd6a15c,
        flatShading: true,
        roughness: 0.8,
      });
      const group = new THREE.Group();

      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 0.24, 2.8),
        marble,
      );
      platform.position.set(0, 0.12, -3.2);
      group.add(platform);

      const colCount = stage.columnCount;
      const colHeight = 1.5;
      const colGroup = new THREE.Group();
      for (let i = 0; i < colCount; i++) {
        const t = i / (colCount - 1);
        const x = -2.0 + t * 4.0;
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.13, 0.15, colHeight, 8),
          marble,
        );
        col.position.set(x, colHeight / 2 + 0.24, -4.3);
        colGroup.add(col);
      }
      group.add(colGroup);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.9, 0.9, 3), roofMat);
      roof.rotation.y = Math.PI / 6;
      roof.rotation.z = Math.PI;
      roof.scale.set(1, 0.55, 1.05);
      roof.position.set(0, colHeight + 0.24 + 0.42, -4.3);
      group.add(roof);

      // colunas "crescem" do chão até a altura final quando o estágio muda
      colGroup.children.forEach((col, i) => {
        col.scale.y = 0.001;
        const targetY = col.position.y;
        col.position.y = 0.24;
        const delay = i * 90;
        const start = performance.now() + delay;
        const grow = () => {
          const t = Math.max(0, Math.min(1, (performance.now() - start) / 700));
          const eased = 1 - Math.pow(1 - t, 3);
          col.scale.y = Math.max(0.001, eased);
          col.position.y = 0.24 + (targetY - 0.24) * eased;
          if (t < 1) requestAnimationFrame(grow);
        };
        requestAnimationFrame(grow);
      });

      this.world.add(group);

      // brilho suave dourado no estágio final
      if (stage.id >= 4) {
        const glow = new THREE.PointLight(0xffd68a, 1.1, 8);
        glow.position.set(0, 2.2, -4.3);
        group.add(glow);
      }
    }

    _buildWater(stage) {
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x4fb8c9,
        transparent: true,
        opacity: 0.85,
        roughness: 0.2,
        metalness: 0.1,
      });
      const basin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.95, 0.18, 24),
        new THREE.MeshStandardMaterial({ color: 0xd8d2c4, flatShading: true }),
      );
      basin.position.set(2.6, 0.09, 1.6);
      this.world.add(basin);
      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(0.78, 0.78, 0.05, 24),
        waterMat,
      );
      water.position.set(2.6, 0.19, 1.6);
      this.world.add(water);

      // jato de fonte: pequenas esferas que sobem e caem
      const dropMat = new THREE.MeshStandardMaterial({
        color: 0xdff6f8,
        transparent: true,
        opacity: 0.9,
      });
      const drops = [];
      for (let i = 0; i < 6; i++) {
        const drop = new THREE.Mesh(
          new THREE.SphereGeometry(0.035, 6, 6),
          dropMat,
        );
        drop.position.set(2.6, 0.2, 1.6);
        this.world.add(drop);
        drops.push({ mesh: drop, phase: (i / 6) * Math.PI * 2 });
      }
      this.animatables.push({
        tick: (dt, e) => {
          drops.forEach((d) => {
            const t = (e * 1.4 + d.phase) % (Math.PI * 2);
            const h = Math.sin(t) * 0.55;
            d.mesh.position.y = 0.2 + Math.max(0, h);
            d.mesh.position.x = 2.6 + Math.cos(t * 0.6) * 0.05;
            d.mesh.visible = h > -0.3;
          });
          water.position.y = 0.19 + Math.sin(e * 2) * 0.005;
        },
      });
    }

    _buildFireflies(stage) {
      const geo = new THREE.SphereGeometry(0.03, 6, 6);
      for (let i = 0; i < 14; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: 0xfff2b0,
          emissive: 0xffe066,
          emissiveIntensity: 1.4,
        });
        const fly = new THREE.Mesh(geo, mat);
        const baseX = rand(-4, 4),
          baseZ = rand(-4, 4);
        fly.position.set(baseX, rand(0.4, 1.6), baseZ);
        this.world.add(fly);
        const phase = rand(0, Math.PI * 2);
        const speed = rand(0.5, 1.2);
        this.animatables.push({
          tick: (dt, e) => {
            fly.position.x = baseX + Math.sin(e * speed + phase) * 0.5;
            fly.position.z = baseZ + Math.cos(e * speed * 0.8 + phase) * 0.5;
            fly.position.y = 0.6 + Math.sin(e * speed * 1.6 + phase) * 0.35;
            mat.emissiveIntensity = 1 + Math.sin(e * 6 + phase) * 0.6;
          },
        });
      }
    }

    /* ---------------- animais ---------------- */
    _buildAnimal(type, index, stage) {
      const builders = {
        vulture: () => this._makeBird(0x4a4a4a, 0x2e2e2e),
        dove: () => this._makeBird(0xf5f2ea, 0xd8d2c4),
        butterfly: () => this._makeButterfly(),
        goat: () => this._makeQuadruped(0xe8e0cf, 0x3a3a3a, "goat"),
        deer: () => this._makeQuadruped(0xb5763f, 0x5a3d28, "deer"),
        peacock: () => this._makePeacock(),
      };
      const builder = builders[type] || builders.dove;
      const animal = builder();
      const radius = rand(2.2, 5.4);
      const height =
        type === "vulture"
          ? rand(2.6, 3.4)
          : type === "dove"
            ? rand(1.6, 2.4)
            : 0;
      const speed = rand(0.15, 0.35);
      const phase = rand(0, Math.PI * 2);
      const isFlyer =
        type === "vulture" || type === "dove" || type === "butterfly";

      this.world.add(animal);

      if (isFlyer) {
        this.animatables.push({
          tick: (dt, e) => {
            const t = e * speed + phase;
            animal.position.set(
              Math.cos(t) * radius,
              height + Math.sin(t * 2) * 0.15,
              Math.sin(t) * radius,
            );
            animal.rotation.y = -t + Math.PI / 2;
            if (animal.userData.wingL) {
              const flap =
                Math.sin(e * (type === "butterfly" ? 9 : 5) + phase) *
                (type === "butterfly" ? 0.9 : 0.5);
              animal.userData.wingL.rotation.z = flap;
              animal.userData.wingR.rotation.z = -flap;
            }
          },
        });
      } else {
        const baseAngle = rand(0, Math.PI * 2);
        const baseX = Math.cos(baseAngle) * radius;
        const baseZ = Math.sin(baseAngle) * radius;
        const walkRange = rand(0.6, 1.1);
        this.animatables.push({
          tick: (dt, e) => {
            const t = e * speed * 1.6 + phase;
            animal.position.set(
              baseX + Math.sin(t) * walkRange,
              Math.abs(Math.sin(t * 4)) * 0.03,
              baseZ + Math.cos(t * 0.7) * walkRange * 0.4,
            );
            animal.rotation.y = -t + Math.PI / 2;
          },
        });
      }
    }

    _makeBird(bodyColor, wingColor) {
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        flatShading: true,
      });
      const wingMat = new THREE.MeshStandardMaterial({
        color: wingColor,
        flatShading: true,
        side: THREE.DoubleSide,
      });
      const body = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.22, 6),
        bodyMat,
      );
      body.rotation.z = Math.PI / 2;
      group.add(body);
      const wingGeo = new THREE.PlaneGeometry(0.22, 0.09);
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(0, 0, 0.02);
      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.set(0, 0, -0.02);
      group.add(wingL, wingR);
      group.userData.wingL = wingL;
      group.userData.wingR = wingR;
      group.scale.setScalar(1.1);
      return group;
    }

    _makeButterfly() {
      const group = new THREE.Group();
      const colors = [0xffb703, 0xef476f, 0x8ecae6, 0xa78bfa];
      const color = colors[Math.floor(rand(0, colors.length))];
      const wingMat = new THREE.MeshStandardMaterial({
        color,
        flatShading: true,
        side: THREE.DoubleSide,
      });
      const wingGeo = new THREE.CircleGeometry(0.07, 8);
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.x = 0.05;
      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.position.x = -0.05;
      group.add(wingL, wingR);
      group.userData.wingL = wingL;
      group.userData.wingR = wingR;
      group.scale.setScalar(0.9);
      return group;
    }

    _makeQuadruped(bodyColor, hornColor, kind) {
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        flatShading: true,
      });
      const hornMat = new THREE.MeshStandardMaterial({
        color: hornColor,
        flatShading: true,
      });

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.22, 0.2),
        bodyMat,
      );
      body.position.y = 0.32;
      group.add(body);

      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.16, 0.15),
        bodyMat,
      );
      head.position.set(0.28, 0.4, 0);
      group.add(head);

      const legGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.28, 5);
      [
        [-0.15, -0.07],
        [-0.15, 0.07],
        [0.15, -0.07],
        [0.15, 0.07],
      ].forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeo, hornMat);
        leg.position.set(x, 0.14, z);
        group.add(leg);
      });

      if (kind === "goat") {
        const hornGeo = new THREE.ConeGeometry(0.02, 0.14, 4);
        const hL = new THREE.Mesh(hornGeo, hornMat);
        hL.position.set(0.3, 0.5, 0.05);
        hL.rotation.z = -0.4;
        const hR = new THREE.Mesh(hornGeo, hornMat);
        hR.position.set(0.3, 0.5, -0.05);
        hR.rotation.z = -0.4;
        group.add(hL, hR);
      } else {
        const antlerGeo = new THREE.ConeGeometry(0.015, 0.2, 4);
        for (let i = 0; i < 2; i++) {
          const side = i === 0 ? 1 : -1;
          const antler = new THREE.Mesh(antlerGeo, hornMat);
          antler.position.set(0.28, 0.55, side * 0.05);
          antler.rotation.z = -0.5;
          antler.rotation.x = side * 0.3;
          group.add(antler);
        }
      }

      const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.1, 4),
        bodyMat,
      );
      tail.position.set(-0.24, 0.36, 0);
      tail.rotation.z = Math.PI / 2;
      group.add(tail);

      group.scale.setScalar(1.05);
      return group;
    }

    _makePeacock() {
      const group = this._makeQuadruped(0x2f6fa0, 0x1f4f80, "goat"); // corpo reaproveitado como base ave (estilizado)
      group.scale.setScalar(0.7);
      const tailMat = new THREE.MeshStandardMaterial({
        color: 0x2f9e8f,
        flatShading: true,
        side: THREE.DoubleSide,
      });
      for (let i = -2; i <= 2; i++) {
        const feather = new THREE.Mesh(
          new THREE.CircleGeometry(0.12, 8),
          tailMat,
        );
        feather.position.set(-0.32, 0.4 + Math.abs(i) * 0.02, i * 0.09);
        feather.rotation.y = Math.PI / 2;
        feather.rotation.z = i * 0.15;
        group.add(feather);
      }
      return group;
    }

    /* ---------------- loop de animação ---------------- */
    _animate() {
      requestAnimationFrame(() => this._animate());
      const dt = Math.min(0.05, this.clock.getDelta());
      const elapsed = this.clock.elapsedTime;

      if (!this.dragging) this.targetAzimuth += dt * 0.06; // auto-rotação suave
      this.azimuth += (this.targetAzimuth - this.azimuth) * 0.08;

      const camRadius = 9.2;
      this.camera.position.set(
        Math.cos(this.azimuth) * camRadius,
        2.4 + Math.sin(this.polar) * 2,
        Math.sin(this.azimuth) * camRadius,
      );
      this.camera.lookAt(0, 0.6, -0.6);

      if (this._popIn) {
        this._popIn = Math.max(0, this._popIn - dt * 2.2);
        const s = 1 - this._popIn * 0.15;
        this.world.scale.setScalar(s);
      }

      this.animatables.forEach((a) => a.tick(dt, elapsed));

      this.renderer.render(this.scene, this.camera);
    }
  }

  global.GreenShotEcosystem3D = GreenShotEcosystem3D;
  global.GREENSHOT_ECO_STAGES = STAGES;
})(window);
