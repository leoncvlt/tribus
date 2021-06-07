import { Mesh, MeshStandardMaterial, TorusGeometry } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import Example from "../../Example";
import textureFile from "../assets/venice_sunset_1k.hdr?url";
import Panorama, { PanoramaControls } from "../components/Panorama";

export default class PanoramaExample extends Example {
  start() {
    this.camera.position.z = 10;

    console.log(this.controls);
    this.controls = new PanoramaControls(this.camera, this.renderer.domElement);
    // this.controls.enablePan = false;
    // this.controls.rotateSpeed = -1 * 0.5;

    new RGBELoader().loadAsync(textureFile).then((texture) => {
      const panorama = new Panorama({ texture });
      this.scene.add(panorama.mesh);
    });
  }
}
