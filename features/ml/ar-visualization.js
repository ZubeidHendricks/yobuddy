class ARVisualizer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.models = {};
    this.initializeAR();
  }

  async initializeAR() {
    await this.setupThreeJS();
    await this.setupAREngine();
    this.setupControls();
  }

  async setupThreeJS() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.setupLighting();
  }

  async loadModel(productId) {
    const loader = new THREE.GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        `models/${productId}.gltf`,
        (gltf) => {
          this.models[productId] = gltf.scene;
          resolve(gltf.scene);
        },
        undefined,
        reject
      );
    });
  }

  visualizeProduct(productId) {
    if (!this.models[productId]) {
      this.loadModel(productId).then(model => {
        this.addModelToScene(model);
      });
    } else {
      this.addModelToScene(this.models[productId]);
    }
  }

  addModelToScene(model) {
    this.scene.add(model);
    this.updateScene();
  }
}