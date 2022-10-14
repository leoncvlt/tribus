import {
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  PlaneBufferGeometry,
  TorusKnotGeometry,
} from "three";

import ContactShadows from "../../components/ContactShadows";
import Example from "./Example";

export default class ContactShadowsExample extends Example {
  start() {
    this.camera.position.set(10, 10, 10);
    this.controls.target.set(0, 2, 0);

    this.torus = new Mesh(new TorusKnotGeometry(), new MeshNormalMaterial());
    this.torus.position.set(2, 4, -2);
    this.scene.add(this.torus);

    this.icos = new Mesh(new IcosahedronGeometry(2), new MeshNormalMaterial());
    this.icos.position.set(-2, 4, 2);
    this.scene.add(this.icos);

    const ground = new Mesh(new PlaneBufferGeometry(32, 32), new MeshBasicMaterial());
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    this.contactShadows = new ContactShadows({});
    this.contactShadows.position.y = 0.01; // avoid intersection with ground
    this.scene.add(this.contactShadows.helpers);
    this.scene.add(this.contactShadows);
  }

  update(delta, elapsed) {
    this.icos.rotation.set(elapsed / 2, elapsed / 2, elapsed / 2);
    this.icos.position.y = Math.sin(elapsed) + 4;
    this.torus.rotation.set(elapsed / 2, elapsed / 2, elapsed / 2);
    this.torus.position.y = Math.sin(Math.PI + elapsed) + 4;
  }

  get parameters() {
    return {
      darkness: {
        label: "Darkness",
        value: this.contactShadows.darkness,
        min: 0.5,
        max: 1.5,
        onChange: (value) => (this.contactShadows.darkness = value),
      },
      opacity: {
        label: "Opacity",
        value: this.contactShadows.opacity,
        min: 0,
        max: 1,
        onChange: (value) => (this.contactShadows.opacity = value),
      },
      blur: {
        label: "Blur",
        value: this.contactShadows.blur,
        min: 0,
        max: 16,
        onChange: (value) => (this.contactShadows.blur = value),
      },
      fastBlur: {
        label: "Use fast blur",
        value: this.contactShadows.fastBlur,
        onChange: (value) => (this.contactShadows.fastBlur = value),
      },
      helpers: {
        label: "Show helpers",
        value: this.contactShadows.helpers.parent === this.scene,
        onChange: (value) => {
          if (value) {
            this.scene.add(this.contactShadows.helpers);
          } else {
            this.scene.remove(this.contactShadows.helpers);
          }
        },
      },
    };
  }
}
