import {
  AmbientLight,
  BoxGeometry,
  DirectionalLight,
  Fog,
  Mesh,
  MeshNormalMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  PlaneBufferGeometry,
  sRGBEncoding,
} from "three";

import AssetLoader from "../../components/AssetLoader";
import Environment from "../../components/Environment";
import Example from "./Example";

// import tvUrl from "../assets/1980_tv/scene.gltf?url";
import loeweUrl from "../assets/Loewe_C.glb?url";
import Pferdestatue_C_url from "../assets/Pferdestatue_C.glb?url";
import Engel_C from "../assets/Engel_C.glb?url";
import textureFile from "../assets/venice_sunset_1k.hdr?url";
import { ContactShadows } from "../../components";

const assetLoader = new AssetLoader();
assetLoader.queue({ url: loeweUrl, key: "tv-model", type: assetLoader.TYPES.GLTF });
assetLoader.queue({ url: Pferdestatue_C_url, key: "statueB", type: assetLoader.TYPES.GLTF });
assetLoader.queue({ url: Engel_C, key: "Engel_C", type: assetLoader.TYPES.GLTF });
assetLoader.queue({ url: textureFile, key: "envmap", type: assetLoader.TYPES.HDRI });

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

    assetLoader.addEventListener("progress", ({ current, total }) => {
      const percentage = ((current / total) * 100).toFixed(0).padStart(3, "0");
      loadingText.innerHTML = `${percentage}<br>(${current}/${total})`;
    });

    await assetLoader.load();
    await new Promise((resolve) => setTimeout(resolve, 200));

    loadingScreen.style.opacity = 0;

    const envmap = assetLoader.get("envmap");
    const environment = new Environment(this.renderer, this.scene);
    environment.apply({ texture: envmap, equirectangular: true, background: false });

    const tv = assetLoader.get("tv-model");
    this.scene.add(tv.scene);

    const statueB = assetLoader.get("statueB");
    statueB.scene.position.set(0, 0, 8);
    this.scene.add(statueB.scene);

    const statueEngel_C = assetLoader.get("Engel_C");
    statueEngel_C.scene.position.set(0, 0, -8);
    this.scene.add(statueEngel_C.scene);

    // const contactShadows = new ContactShadows({
    //   width: 16,
    //   height: 32,
    //   blur: 4,
    // });
    // contactShadows.position.y = 0.01;
    // this.scene.add(contactShadows)
  }
}
