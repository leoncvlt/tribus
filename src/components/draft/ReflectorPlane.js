import { Mesh, MeshBasicMaterial, Object3D, PlaneBufferGeometry } from "three";

import BlurredReflector from "../BlurredReflector";

export default class ReflectorPlane extends Object3D {
  set mirror(value) {
    this.reflector.opacity = value;
  }

  get mirror() {
    return this.reflector.opacity;
  }

  set blur(value) {
    this.reflector.blur = value;
  }

  get blur() {
    return this.reflector.blur;
  }

  constructor({
    width = 10,
    height = 10,
    blur = 1,
    clipBias = 0.003,
    resolution = 512,
    material = new MeshBasicMaterial({ color: 0xffffff }),
    mirror = 0.6,
    excluded = [],
  } = {}) {
    super();

    const planeGeometry = new PlaneBufferGeometry(width, height);
    // this.planeMaterial = material;

    // const plane = new Mesh(planeGeometry, this.planeMaterial);
    // this.planeMaterial.transparent = true;
    // this.planeMaterial.opacity = 1 - mirror;
    // plane.position.z = -0.1;

    this.reflector = new BlurredReflector(planeGeometry, {
      textureWidth: 1024 * window.devicePixelRatio,
      textureHeight: 1024 * window.devicePixelRatio,
      excluded: [...excluded, plane],
      opacity: mirror,
      color: 0xababab,
      blur,
    });

    this.add(this.reflector);
    // this.add(plane);
  }
}
