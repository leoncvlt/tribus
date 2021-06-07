import { SphereBufferGeometry, Mesh, MeshBasicMaterial, Group } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class PanoramaControls extends OrbitControls {
  constructor(camera, domElement) {
    super(camera, domElement);
    this.enableDamping = true;
    this.enablePan = false;
    this.rotateSpeed = -1;
  }

  // set rotateSpeed(value) {
  //   return value * -1;
  // }
}

export default class Panorama extends Group {
  constructor({
    radius = 500,
    phiStart = 0,
    phiLength = Math.PI * 2,
    offset = { h: -Math.PI / 2, v: 0 },
    material = new MeshBasicMaterial(),
    texture = null
  } = {}) {
    super();
    const geometry = new SphereBufferGeometry(
      radius,
      60,
      40,
      phiStart,
      phiLength
    );

    geometry.scale(-1, 1, 1);
    geometry.rotateY(offset.h);

    this.mesh = new Mesh(geometry, material);

    if (texture) {
      this.setTexture(texture);
    }
  }

  setTexture(texture) {
    this.mesh.material.map = texture;
    this.mesh.material.needsUpdate = true;
  }
}
