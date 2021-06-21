import { Color, Mesh, MeshStandardMaterial, TorusGeometry } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import Environment from "../../components/Environment";
import Example from "./Example";

import textureFile from "../assets/venice_sunset_1k.hdr?url";

export default class EnvironmentExample extends Example {
  async start() {
    this.camera.position.z = 10;

    this.torus = new Mesh(
      new TorusGeometry(1, 0.5, 16, 32),
      new MeshStandardMaterial({
        roughness: 0.4,
        metalness: 0.6,
      })
    );
    this.scene.add(this.torus);

    this.scene.background = this.defaultBackground = new Color(0.8, 0.8, 0.8);
    this.environment = new Environment(this.renderer, this.scene);
    new RGBELoader().loadAsync(textureFile).then((texture) => {
      this.texture = texture;
      this.environment.apply();
    });
  }

  update(delta, elapsed) {
    this.torus.rotation.set(elapsed / 2, elapsed / 2, elapsed / 2);
  }

  get parameters() {
    return {
      texture: {
        label: "Use texture",
        value: this.scene.environment === this.texture,
        onChange: (value) => {
          this.environment.apply({
            texture: value ? this.texture : null,
            equirectangular: value,
            background: !(this.scene.background instanceof Color),
          });
        },
      },
      background: {
        label: "Set background",
        value: !(this.scene.background instanceof Color),
        onChange: (value) =>
          (this.scene.background = value ? this.scene.environment : this.defaultBackground),
      },
    };
  }
}
