import {
  Color,
  Fog,
  IcosahedronGeometry,
  Mesh,
  MeshNormalMaterial,
  MeshStandardMaterial,
  PlaneBufferGeometry,
  TorusKnotGeometry,
} from "three";

import BlurredReflector from "../../components/BlurredReflector";

import Example from "./Example";

export default class ReflectorExample extends Example {
  start() {
    this.camera.position.set(10, 8, 10);

    this.torus = new Mesh(new TorusKnotGeometry(), new MeshNormalMaterial());
    this.torus.position.set(2, 3, -2);
    this.scene.add(this.torus);

    this.icos = new Mesh(new IcosahedronGeometry(2), new MeshNormalMaterial());
    this.icos.position.set(-2, 3, 2);
    this.scene.add(this.icos);

    const reflectorGeometry = new PlaneBufferGeometry(32, 32);
    this.reflector = new BlurredReflector(reflectorGeometry, {
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      opacity: 1,
      blur: 1,
    });
    this.reflector.rotateX(-Math.PI / 2);
    this.scene.add(this.reflector);
  }

  update(delta, elapsed) {
    this.icos.rotation.set(elapsed / 2, elapsed / 2, elapsed / 2);
    this.torus.rotation.set(elapsed / 2, elapsed / 2, elapsed / 2);
  }

  get parameters() {
    return {
      opacity: {
        value: this.reflector.opacity,
        min: 0,
        max: 1,
        onChange: (value) => (this.reflector.opacity = value),
      },
      blur: {
        value: this.reflector.blur,
        min: 0,
        max: 16,
        onChange: (value) => (this.reflector.blur = value),
      },
      fast: {
        value: this.reflector.fastBlur,
        onChange: (value) => (this.reflector.fastBlur = value),
      },
    };
  }
}
