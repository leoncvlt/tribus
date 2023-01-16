import { BoxGeometry, Color, Mesh, MeshBasicMaterial } from "three";
import { GPURaycaster } from "../../components/GPURaycaster";

import Example from "../Example";

const rnd = (min, max) => Math.random() * (max - min) + min;

export default class GPURaycasterExample extends Example {
  start() {
    this.camera.position.z = 10;
    this.boxes = [];

    const raycaster = new GPURaycaster(this.camera, this.renderer);

    for (let i = 0; i < 100; i++) {
      const box = new Mesh(
        new BoxGeometry(),
        new MeshBasicMaterial({
          color: new Color().setHSL(Math.random(), 1, 0.5),
        })
      );
      box.scale.set(rnd(0.5, 1), rnd(0.5, 1), rnd(0.5, 1));
      box.position.set(rnd(-5, 5), rnd(-5, 5), rnd(-5, 5));
      box.rotation.set(
        rnd(0, Math.PI * 2),
        rnd(0, Math.PI * 2),
        rnd(0, Math.PI * 2)
      );
      this.boxes.push(box);
      raycaster.add(box, i);
    }

    this.scene.add(...this.boxes);

    raycaster.addEventListener("click", ({ id }) => {
      this.boxes[id].material.color = new Color().setHSL(Math.random(), 1, 0.5);
    });

    raycaster.addEventListener("enter", () => {
      this.renderer.domElement.style.cursor = "pointer";
    });

    raycaster.addEventListener("exit", () => {
      this.renderer.domElement.style.cursor = null;
    });
  }
}
