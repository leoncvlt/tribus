import {
  Color,
  DoubleSide,
  EventDispatcher,
  Float32BufferAttribute,
  LinearEncoding,
  MeshBasicMaterial,
  NoToneMapping,
  Scene,
  WebGLRenderTarget,
} from "three";

export class GPURaycaster extends EventDispatcher {
  constructor(camera, renderer) {
    super();
    this.camera = camera;
    this.renderer = renderer;

    this._pickingScene = new Scene();
    this._pickingScene.background = new Color(0);
    this._intersected = null;

    // create a 1x1 pixel render target
    this._pickingTexture = new WebGLRenderTarget(1, 1);
    this._pixelBuffer = new Uint8Array(4);

    this.onClick = this.click.bind(this);
    this.onTouch = this.touch.bind(this);
    this.onMove = this.move.bind(this);

    // register events to work both on desktop and mobile platforms
    this.renderer.domElement.addEventListener("mousedown", this.onClick, false);
    this.renderer.domElement.addEventListener(
      "touchstart",
      this.onTouch,
      false
    );
    this.renderer.domElement.addEventListener("mousemove", this.onMove);
    this.renderer.domElement.addEventListener("touchmove", this.onMove);
  }

  add(target, id) {
    const clone = target.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        const clippingPlanes = child.material.clippingPlanes;
        child.material = new MeshBasicMaterial({
          vertexColors: true,
          side: DoubleSide,
          clippingPlanes,
        });

        // apply vertex colors
        const position = child.geometry.attributes.position;
        const color = new Color().setHex(id);
        const colors = [];

        for (let i = 0; i < position.count; i++) {
          colors.push(color.r, color.g, color.b);
        }

        child.geometry.setAttribute(
          "color",
          new Float32BufferAttribute(colors, 3)
        );
      }
    });

    clone.userData.raycastId = id;
    this._pickingScene.add(clone);
  }

  remove(id) {
    const object = this._pickingScene.children.find(
      (child) => child.userData.raycastId === id
    );
    if (object) {
      this._pickingScene.remove(object);
    }
  }

  enable(ids) {
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    this._pickingScene.children
      .filter((child) => ids.includes(child.userData.raycastId))
      .forEach((child) => (child.visible = true));
  }

  disable(ids) {
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    this._pickingScene.children
      .filter((child) => ids.includes(child.userData.raycastId))
      .forEach((child) => {
        child.visible = false;
      });
  }

  move(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const position = {
      x:
        ((event.clientX - rect.left) * this.renderer.domElement.width) /
        rect.width,
      y:
        ((event.clientY - rect.top) * this.renderer.domElement.height) /
        rect.height,
    };
    this._pickingPosition = { x: position.x, y: position.y };

    this.raycast(position.x, position.y);
  }

  click(event) {
    if (this._intersected) {
      this.dispatchEvent({ type: "click", id: this._intersected });
    } else if (event.target instanceof HTMLCanvasElement) {
      // this means that "empty space was clicked"
      this.dispatchEvent({ type: "clear" });
    }
  }

  touch(event) {
    // tapping on a touchscreen counts as both moving and clicking at the same time
    this.move(event);
    this.click(event);
  }

  raycast(x, y) {
    // set the view offset to represent just a single pixel under the mouse
    const pixelRatio = this.renderer.getPixelRatio();
    this.camera.setViewOffset(
      this.renderer.domElement.width,
      this.renderer.domElement.height,
      (x * pixelRatio) | 0,
      (y * pixelRatio) | 0,
      1,
      1
    );

    this._toneMapping = this.renderer.toneMapping;
    this._outputEncoding = this.renderer.outputEncoding;
    this.renderer.toneMapping = NoToneMapping;
    this.renderer.outputEncoding = LinearEncoding;

    this.renderer.setRenderTarget(this._pickingTexture);
    this.renderer.render(this._pickingScene, this.camera);
    this.renderer.setRenderTarget(null);

    this.renderer.toneMapping = this._toneMapping;
    this.renderer.outputEncoding = this._outputEncoding;

    // clear the view offset so rendering returns to normal
    this.camera.clearViewOffset();

    //read the pixel
    this.renderer.readRenderTargetPixels(
      this._pickingTexture,
      0, // x
      0, // y
      1, // width
      1, // height
      this._pixelBuffer
    );

    const id =
      (this._pixelBuffer[0] << 16) |
      (this._pixelBuffer[1] << 8) |
      this._pixelBuffer[2];

    const _intersectedId = id;
    if (_intersectedId) {
      if (this._intersected !== _intersectedId) {
        if (this._intersected) {
          this.dispatchEvent({ type: "exit", id: this._intersected });
        }
        this._intersected = _intersectedId;
        this.dispatchEvent({ type: "enter", id: this._intersected });
      }
    } else if (this._intersected) {
      this.dispatchEvent({ type: "exit", id: this._intersected });
      this._intersected = null;
    }
  }
}
