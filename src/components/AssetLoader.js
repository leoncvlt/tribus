import { EventDispatcher, FileLoader, TextureLoader } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export class AssetLoader extends EventDispatcher {
  constructor() {
    super();
    this._queue = [];
    this._store = {};
    this._renderer = null;
  }

  get TYPES() {
    return {
      File: "File",
      Image: "Image",
      Texture: "Texture",
      HDRI: "HDRI",
      GLTF: "GLTF",
    };
  }

  get LOADERS() {
    return {
      [this.TYPES.File]: new FileLoader(),
      [this.TYPES.Texture]: new TextureLoader(),
      [this.TYPES.HDRI]: new RGBELoader(),
      [this.TYPES.GLTF]: new GLTFLoader(),
    };
  }

  setRenderer(renderer) {
    this._renderer = renderer;
  }

  queue(url, key, type) {
    this._queue.push({
      url: url,
      key: key || url.split("\\").pop().split("/").pop().split(".").pop(),
      type: type || this.TYPES.File,
    });
  }

  async process({ url, key, type }) {
    if (this.has(key)) {
      return;
    }
    const loader = this.LOADERS[type];
    switch (type) {
      case this.TYPES.File:
        loader.responseType = "blob";
        await new Promise((resolve) =>
          loader.load(url, (blob) => {
            this._store[key] = URL.createObjectURL(blob);
            resolve();
          })
        );
        break;

      case this.TYPES.Image:
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = url;
        });
        this._store[key] = img;
        break;

      case this.TYPES.Texture:
      case this.TYPES.HDRI:
        const texture = await loader.loadAsync(url);
        if (this._renderer) {
          this._renderer.initTexture(texture);
        } else {
          console.warn(
            "AssetStore.process(): A texture is being processed but no renderer is set",
            "call setRenderer() to allow the AssetLoader instance to decode the texture",
            "on the GPU during the loading process and avoid first-render lags"
          );
        }
        this._store[key] = texture;
        break;

      case this.TYPES.GLTF:
        const asset = await loader.loadAsync(url);
        this._store[key] = asset;
        break;

      default:
        break;
    }
    return this._store[key];
  }

  async load() {
    await Promise.all(
      this._queue.map(async (asset) => {
        await this.process(asset);
        console.debug("AssetStore.load(): " + asset.key);
        this.dispatchEvent({
          type: "progress",
          current: Object.keys(this._store).length,
          total: this._queue.length,
        });
      })
    );
    this.dispatchEvent({ type: "loaded" });
    this._queue = [];
  }

  get(key) {
    if (this.has(key)) {
      return this._store[key];
    } else {
      throw(`AssetStore.get() : asset with key ${key} not found in loaded assets`);
    }
  }

  has(key) {
    return key in this._store;
  }
}

// export a default AssetLoader object in the global scope
export default new AssetLoader();
