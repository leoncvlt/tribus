import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { WebGLRenderer } from "three";

export class RendererProxy {
  get webGL() {
    return this.renderer;
  }

  get css() {
    return this.cssRenderer;
  }

  constructor({ container, css, ...WebGLRendererOptions }) {
    this.renderer = new WebGLRenderer({ antialias: true, ...WebGLRendererOptions });
    this.renderer.domElement.style.width = this.renderer.domElement.style.height = "100%";
    if (container) {
      container.appendChild(this.renderer.domElement);
    }

    if (css) {
      this.cssRenderer = new CSS2DRenderer();
      this.cssRenderer.domElement.style.position = "absolute";
      this.cssRenderer.domElement.style.top = "0px";
      this.cssRenderer.domElement.style.pointerEvents = "none";
      if (container) {
        container.appendChild(this.cssRenderer.domElement);
      }
    }
  }

  needResize() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      this.renderer.setSize(width, height, false);
      this.cssRenderer && this.cssRenderer.setSize(width, height, false);
      this.composer && this.composer.setSize(width, height, false);
    }
    return needResize;
  }

  render(scene, camera, { ortographic = false } = {}) {
    if (this.needResize()) {
      const canvas = this.renderer.domElement;
      const aspect = canvas.clientWidth / canvas.clientHeight;
      camera.aspect = aspect;
      if (ortographic) {
        camera.left = -aspect / 2;
        camera.right = aspect / 2;
        camera.top = 1 / 2;
        camera.bottom = -1 / 2;
      }
      camera.updateProjectionMatrix();
    }

    this.renderer.render(scene, camera);
    if (this.cssRenderer) {
      this.cssRenderer.render(scene, camera);
    }
  }
}
