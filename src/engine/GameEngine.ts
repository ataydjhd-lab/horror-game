import * as THREE from 'three';

interface GameState {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  velocity: THREE.Vector3;
  isRunning: boolean;
  isSprinting: boolean;
  health: number;
  inventory: string[];
}

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private gameState: GameState;
  private clock: THREE.Clock;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 50, 500);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    this.clock = new THREE.Clock();

    this.gameState = {
      position: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 0, -1),
      velocity: new THREE.Vector3(0, 0, 0),
      isRunning: false,
      isSprinting: false,
      health: 100,
      inventory: []
    };

    this.setupScene();
    this.setupControls();
    this.setupEventListeners();
    this.animate();
  }

  private setupScene(): void {
    const ambientLight = new THREE.AmbientLight(0x333333);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.createRoadEnvironment();
  }

  private createRoadEnvironment(): void {
    const roadGeometry = new THREE.PlaneGeometry(30, 500);
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    road.receiveShadow = true;
    this.scene.add(road);

    this.createBrokenCar();

    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 200;
      const z = Math.random() * 300 - 50;
      this.createTree(x, z);
    }

    this.createAbandonedHouse();
  }

  private createBrokenCar(): void {
    const carGroup = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(2, 1.2, 4);
    const carMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    const body = new THREE.Mesh(bodyGeometry, carMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

    const wheelPositions = [
      [-0.8, 0.5, -1],
      [0.8, 0.5, -1],
      [-0.8, 0.5, 1],
      [0.8, 0.5, 1]
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(...(pos as [number, number, number]));
      wheel.castShadow = true;
      carGroup.add(wheel);
    });

    carGroup.position.set(0, 0, 10);
    this.scene.add(carGroup);
  }

  private createTree(x: number, z: number): void {
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 8, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 4, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    this.scene.add(trunk);

    const foliageGeometry = new THREE.SphereGeometry(4, 8, 8);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a1a });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, 10, z);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    this.scene.add(foliage);
  }

  private createAbandonedHouse(): void {
    const houseGroup = new THREE.Group();

    const wallGeometry = new THREE.BoxGeometry(20, 12, 25);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = 6;
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    const roofGeometry = new THREE.ConeGeometry(20, 8, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 18;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    const doorGeometry = new THREE.BoxGeometry(3, 5, 0.2);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 2.5, 12.6);
    houseGroup.add(door);

    for (let i = 0; i < 4; i++) {
      const windowGeometry = new THREE.BoxGeometry(2, 2, 0.1);
      const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-8 + i * 6, 7, 12.6);
      houseGroup.add(window);
    }

    houseGroup.position.set(0, 0, -200);
    this.scene.add(houseGroup);
  }

  private setupControls(): void {
    const keys: { [key: string]: boolean } = {};

    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;

      if (e.shiftKey) {
        this.gameState.isSprinting = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
      if (e.key === 'Shift') {
        this.gameState.isSprinting = false;
      }
    });

    let yaw = 0;
    let pitch = 0;

    window.addEventListener('mousemove', (e) => {
      const mouseX = e.movementX || 0;
      const mouseY = e.movementY || 0;

      yaw -= mouseX * 0.01;
      pitch -= mouseY * 0.01;

      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = yaw;
      this.camera.rotation.x = pitch;
    });

    document.addEventListener('click', () => {
      document.body.requestPointerLock();
    });

    const updateMovement = () => {
      const speed = this.gameState.isSprinting ? 0.5 : 0.3;
      const moveVector = new THREE.Vector3();

      if (keys['w']) moveVector.z -= speed;
      if (keys['s']) moveVector.z += speed;
      if (keys['a']) moveVector.x -= speed;
      if (keys['d']) moveVector.x += speed;

      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

      this.gameState.velocity.x = moveVector.x;
      this.gameState.velocity.z = moveVector.z;
    };

    setInterval(updateMovement, 16);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    this.camera.position.add(this.gameState.velocity);

    this.renderer.render(this.scene, this.camera);
  };
}