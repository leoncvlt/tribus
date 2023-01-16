import {
  IcosahedronGeometry,
  Mesh,
  MeshNormalMaterial,
  PlaneBufferGeometry,
  TorusKnotGeometry,
} from "three";

import BlurredReflector from "../../components/BlurredReflector";
import Example from "../Example";

export default class BlurredReflectorExample extends Example {
  start() {
    this.camera.position.set(10, 8, 10);

    this.torus = new Mesh(new TorusKnotGeometry(), new MeshNormalMaterial());
    this.torus.position.set(2, 3, -2);
    this.scene.add(this.torus);

    this.icos = new Mesh(new IcosahedronGeometry(2), new MeshNormalMaterial());
    this.icos.position.set(-2, 3, 2);
    this.scene.add(this.icos);

    const groundGeometry = new PlaneBufferGeometry(32, 32);

    const floor = new Mesh(
      groundGeometry,
      new MeshNormalMaterial({ depthWrite: false })
    );
    floor.rotateX(-Math.PI / 2);
    this.scene.add(floor);

    this.reflector = new BlurredReflector({
      opacity: 1,
      blur: 2,
    });
    this.scene.add(this.reflector);
  }

  update(delta, elapsed) {
    this.icos.rotation.set(elapsed / 2, elapsed / 2, elapsed / 2);
    this.torus.rotation.set(elapsed / 2, elapsed / 2, elapsed / 2);
  }

  get parameters() {
    return {
      opacity: {
        label: "Opacity",
        value: this.reflector.opacity,
        min: 0,
        max: 1,
        onChange: (value) => (this.reflector.opacity = value),
      },
      blur: {
        label: "Blur",
        value: this.reflector.blur,
        min: 0,
        max: 8,
        onChange: (value) => (this.reflector.blur = value),
      },
      fast: {
        label: "Use fast blur",
        value: this.reflector.fastBlur,
        onChange: (value) => (this.reflector.fastBlur = value),
      },
    };
  }
}
