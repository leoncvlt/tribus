import {
  Vector3,
  IcosahedronGeometry,
  Mesh,
  MeshPhongMaterial,
  PlaneBufferGeometry,
  TorusKnotGeometry,
  Fog,
} from "three";

import ProgressiveShadows from "../../components/ProgressiveShadows";
import Example from "../Example";

export default class ProgressiveShadowsExample extends Example {
  start() {
    this.camera.position.set(6, 10, 16);
    this.controls.target.set(0, 2, 0);
    this.renderer.shadowMap.enabled = true;

    const torus = new Mesh(
      new TorusKnotGeometry(2, 0.75, 128, 24),
      new MeshPhongMaterial()
    );
    torus.position.set(2, 4, -2);
    torus.castShadow = true;
    torus.receiveShadow = true;
    this.scene.add(torus);

    const icos = new Mesh(new IcosahedronGeometry(2), new MeshPhongMaterial());
    icos.position.set(-2, 2, 2);
    icos.castShadow = true;
    icos.receiveShadow = true;
    this.scene.add(icos);

    const ground = new Mesh(
      new PlaneBufferGeometry(32, 32),
      new MeshPhongMaterial()
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    this.progressiveShadows = new ProgressiveShadows(this.renderer, {
      origin: new Vector3(5, 10, 5),
      target: new Vector3(0, 1, 0),
      center: new Vector3(0, 0, 0),
      shadowMapResolution: 512,
      lightMapResolution: 1024,
      lightsCount: 8,
      ambientWeight: 0.5,
      blendWindow: 200,
      lightRadius: 20,
    });

    this.progressiveShadows.add([ground, torus, icos]);

    this.scene.add(this.progressiveShadows.helpers);
  }

  update(delta, elapsed) {
    this.progressiveShadows.render(this.camera);
  }

  get parameters() {
    return {
      // opacity: {
      //   value: this.contactShadows.opacity,
      //   min: 0,
      //   max: 1,
      //   onChange: (value) => (this.contactShadows.opacity = value),
      // },
      // blur: {
      //   value: this.contactShadows.blur,
      //   min: 0,
      //   max: 16,
      //   onChange: (value) => (this.contactShadows.blur = value),
      // },
      // fast: {
      //   value: this.contactShadows.fast,
      //   onChange: (value) => (this.contactShadows.fast = value),
      // },
    };
  }
}
