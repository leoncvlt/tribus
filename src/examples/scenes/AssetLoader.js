import { Fog, Mesh, MeshStandardMaterial, PlaneBufferGeometry, sRGBEncoding } from "three";

import AssetLoader from "../../components/AssetLoader";
import Environment from "../../components/Environment";
import Example from "./Example";

import Loewe_C_url from "../assets/Loewe_C.glb?url";
import Pferdestatue_C_url from "../assets/Pferdestatue_C.glb?url";
import Engel_C from "../assets/Engel_C.glb?url";

import envmap from "../assets/venice_sunset_1k.hdr?url";

AssetLoader.queue(Loewe_C_url, "Loewe_C", AssetLoader.TYPES.GLTF);
AssetLoader.queue(Pferdestatue_C_url, "Pferdestatue_C", AssetLoader.TYPES.GLTF);
AssetLoader.queue(Engel_C, "Engel_C", AssetLoader.TYPES.GLTF);
AssetLoader.queue(envmap, "envmap", AssetLoader.TYPES.HDRI);

export default class AssetLoaderExample extends Example {
  async start() {
    this.renderer.outputEncoding = sRGBEncoding;

    this.camera.position.set(-20, 5, 0);
    this.controls.target.set(0, 5, 0);

    const ground = new Mesh(new PlaneBufferGeometry(128, 128), new MeshStandardMaterial());
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    this.scene.fog = new Fog(0xffffff, 32, 64);

    // create a makeshift loading screen to show the loading process
    const loadingScreen = document.createElement("div");
    Object.assign(loadingScreen.style, {
      position: "absolute",
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "black",
      color: "white",
      fontFamily: "monospace",
      fontSize: "xx-large",
      textAlign: "center",
      transition: "opacity 500ms ease",
      pointerEvents: "none",
    });
    const loadingText = document.createElement("p");
    loadingScreen.append(loadingText);
    document.body.prepend(loadingScreen);

    AssetLoader.addEventListener("progress", ({ current, total }) => {
      const percentage = ((current / total) * 100).toFixed(0).padStart(3, "0");
      loadingText.innerHTML = `${percentage}<br>(${current}/${total})`;
    });

    AssetLoader.addEventListener("loaded", async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      loadingScreen.style.opacity = 0;
    });

    await AssetLoader.load();

    const envmap = AssetLoader.get("envmap");
    new Environment(this.renderer, this.scene, {
      texture: envmap,
      equirectangular: true,
      background: false,
    });

    const statueA = AssetLoader.get("Loewe_C");
    this.scene.add(statueA.scene);

    const statueB = AssetLoader.get("Pferdestatue_C");
    statueB.scene.position.set(0, 0, 8);
    this.scene.add(statueB.scene);

    const statueEngel_C = AssetLoader.get("Engel_C");
    statueEngel_C.scene.position.set(0, 0, -8);
    this.scene.add(statueEngel_C.scene);
  }
}
