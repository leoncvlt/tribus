import { BoxGeometry, Mesh, MeshNormalMaterial } from "three";

import Example from "../Example";

export default class BasicExample extends Example {
  start() {
    this.camera.position.z = 10;
    this.box = new Mesh(new BoxGeometry(), new MeshNormalMaterial());
    this.scene.add(this.box);
  }

  update(delta, elapsed) {
    this.box.rotation.set(elapsed / 2, elapsed / 2, elapsed / 2);
  }

  get parameters() {
    return {
      size: {
        min: 0,
        max: 5,
        value: 1,
        onChange: (value) => this.box.scale.set(value, value, value),
      },
    };
  }
}
