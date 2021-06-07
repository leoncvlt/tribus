import { Color, IcosahedronGeometry, Mesh, MeshNormalMaterial, TorusKnotGeometry } from "three";
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

    this.contactShadows = new ContactShadows({
      width: 12,
      height: 12,
      cameraHeight: 12,
      blur: 8,
      darkness: 1,
      opacity: 1,
      planeColor: new Color(0xffffff),
      planeOpacity: 1,
      debugCamera: true,
      fast: false,
    });
    this.scene.add(this.contactShadows);
  }

  update(delta, elapsed) {
    this.contactShadows.render(this.scene, this.renderer);

    this.icos.rotation.set(elapsed / 2, elapsed / 2, elapsed / 2);
    this.icos.position.y = Math.sin(elapsed) + 4;
    this.torus.rotation.set(elapsed / 2, elapsed / 2, elapsed / 2);
    this.torus.position.y = Math.sin(Math.PI + elapsed) + 4;
  }

  get parameters() {
    return {
      opacity: {
        value: this.contactShadows.opacity,
        min: 0,
        max: 1,
        onChange: (value) => (this.contactShadows.opacity = value),
      },
      blur: {
        value: this.contactShadows.blur,
        min: 0,
        max: 16,
        onChange: (value) => (this.contactShadows.blur = value),
      },
      fast: {
        value: this.contactShadows.fast,
        onChange: (value) => (this.contactShadows.fast = value),
      },
    };
  }
}
