import { Clock, Color, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class Stats {
  constructor() {
    if (import.meta.env.DEV) {
      import("stats.js").then((module) => {
        this.stats = new module.default();
        this.stats.showPanel(0);
        this.stats.dom.style.top = null;
        this.stats.dom.style.bottom = 0;
        document.body.appendChild(this.stats.dom);
      });
    }
  }

  begin() {
    if (import.meta.env.DEV) {
      this.stats?.begin();
    }
  }

  end() {
    if (import.meta.env.DEV) {
      this.stats?.end();
    }
  }
}

export default class Example {
  get parameters() {
    return {};
  }

  constructor({ gui }) {
    this.renderer = new WebGLRenderer({
      canvas: document.querySelector("canvas"),
      antialias: true,
    });
    this.clock = new Clock();
    this.scene = new Scene();
    this.scene.background = new Color(0xffffff);
    this.camera = new PerspectiveCamera();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.stats = new Stats();

    this._start();

    this.gui = gui;
  }

  async _start() {
    if (this.start) {
      await this.start();
    }

    this._params = {};
    const parameterEntries = Object.entries(this.parameters);
    if (parameterEntries.length) {
      parameterEntries.forEach(([name, { value, onChange, ...args }]) => {
        this._params[name] = value;
        const input = this.gui.addInput(this._params, name, args);
        input.on("change", ({ value }) => onChange(value));
      });
    } else {
      this.gui.dispose();
    }

    if (this.controls) {
      this.renderer.domElement.classList.add("controls");
    }

    this._update();
  }

  _update() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.stats.begin();
    if (this.update) {
      this.update(delta, elapsed);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();

    requestAnimationFrame(this._update.bind(this));
  }
}
