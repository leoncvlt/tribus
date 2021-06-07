import {
  BufferAttribute,
  BufferGeometry,
  Color,
  LinearFilter,
  MathUtils,
  Matrix4,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  RGBFormat,
  Scene,
  ShaderMaterial,
  UniformsUtils,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from "three";

import BlurredReflectorShader from "./shaders/BlurredReflectorShader";

import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader";

export default class BlurredReflector extends Mesh {
  set opacity(value) {
    this.material.transparent = value < 1;
    this.material.uniforms["opacity"].value = value;
  }

  get opacity() {
    return this.material.uniforms["opacity"].value;
  }

  constructor(
    geometry,
    {
      color = 0xffffff,
      tint = 0x7f7f7f,
      textureWidth = 512,
      textureHeight = 512,
      clipBias = 0,
      opacity = 1.0,
      blur = 0.0,
      fastBlur = false,
      excluded = [],
    } = {}
  ) {
    super(geometry);

    this.type = "Reflector";
    this.excluded = excluded;
    this.blur = blur;
    this.fastBlur = fastBlur;

    color = new Color(color);
    tint = new Color(tint);
    this.clipBias = clipBias || 0;

    this.reflectorPlane = new Plane();
    this.normal = new Vector3();
    this.reflectorWorldPosition = new Vector3();
    this.cameraWorldPosition = new Vector3();
    this.rotationMatrix = new Matrix4();
    this.lookAtPosition = new Vector3(0, 0, -1);
    this.clipPlane = new Vector4();

    this.view = new Vector3();
    this.target = new Vector3();
    this.q = new Vector4();

    this.textureMatrix = new Matrix4();
    this.virtualCamera = new PerspectiveCamera();

    this.renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBFormat,
    });

    if (!MathUtils.isPowerOfTwo(textureWidth) || !MathUtils.isPowerOfTwo(textureHeight)) {
      this.renderTarget.texture.generateMipmaps = false;
    }

    this.renderTargetBlur = this.renderTarget.clone();
    this.renderTargetBlur.texture.generateMipmaps = false;

    // reflector materil
    const shader = BlurredReflectorShader;
    const material = new ShaderMaterial({
      uniforms: UniformsUtils.clone(shader.uniforms),
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
    });
    this.material = material;

    this.material.uniforms["tDiffuse"].value = this.renderTarget.texture;
    this.material.uniforms["color"].value = color;
    this.material.uniforms["tint"].value = tint;
    this.material.uniforms["textureMatrix"].value = this.textureMatrix;
    this.material.uniforms["opacity"].value = opacity;
    this.material.transparent = opacity < 1;

    // blur materials
    this.horizontalBlurMaterial = new ShaderMaterial(HorizontalBlurShader);
    this.verticalBlurMaterial = new ShaderMaterial(VerticalBlurShader);

    // screen scene
    this.screenScene = new Scene();
    this.screenCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.screenGeometry = new BufferGeometry();
    const vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);
    this.screenGeometry.setAttribute("position", new BufferAttribute(vertices, 2));
    this.screenGeometry.setAttribute("uv", new BufferAttribute(uvs, 2));

    this.screen = new Mesh(this.screenGeometry);
    this.screen.frustumCulled = false;
    this.screenScene.add(this.screen);
  }

  onBeforeRender(renderer, scene, camera) {
    this.reflectorWorldPosition.setFromMatrixPosition(this.matrixWorld);
    this.cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

    this.rotationMatrix.extractRotation(this.matrixWorld);

    this.normal.set(0, 0, 1);
    this.normal.applyMatrix4(this.rotationMatrix);

    this.view.subVectors(this.reflectorWorldPosition, this.cameraWorldPosition);

    // Avoid rendering when reflector is facing away
    if (this.view.dot(this.normal) > 0) {
      return;
    }

    this.view.reflect(this.normal).negate();
    this.view.add(this.reflectorWorldPosition);

    this.rotationMatrix.extractRotation(camera.matrixWorld);

    this.lookAtPosition.set(0, 0, -1);
    this.lookAtPosition.applyMatrix4(this.rotationMatrix);
    this.lookAtPosition.add(this.cameraWorldPosition);

    this.target.subVectors(this.reflectorWorldPosition, this.lookAtPosition);
    this.target.reflect(this.normal).negate();
    this.target.add(this.reflectorWorldPosition);

    this.virtualCamera.position.copy(this.view);
    this.virtualCamera.up.set(0, 1, 0);
    this.virtualCamera.up.applyMatrix4(this.rotationMatrix);
    this.virtualCamera.up.reflect(this.normal);
    this.virtualCamera.lookAt(this.target);

    this.virtualCamera.far = camera.far; // Used in WebGLBackground

    this.virtualCamera.updateMatrixWorld();
    this.virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

    // Update the texture matrix
    this.textureMatrix.set(
      0.5,
      0.0,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.0,
      0.5,
      0.5,
      0.0,
      0.0,
      0.0,
      1.0
    );
    this.textureMatrix.multiply(this.virtualCamera.projectionMatrix);
    this.textureMatrix.multiply(this.virtualCamera.matrixWorldInverse);
    this.textureMatrix.multiply(this.matrixWorld);

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    this.reflectorPlane.setFromNormalAndCoplanarPoint(this.normal, this.reflectorWorldPosition);
    this.reflectorPlane.applyMatrix4(this.virtualCamera.matrixWorldInverse);

    this.clipPlane.set(
      this.reflectorPlane.normal.x,
      this.reflectorPlane.normal.y,
      this.reflectorPlane.normal.z,
      this.reflectorPlane.constant
    );

    const projectionMatrix = this.virtualCamera.projectionMatrix;

    this.q.x =
      (Math.sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
    this.q.y =
      (Math.sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
    this.q.z = -1.0;
    this.q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

    // Calculate the scaled plane vector
    this.clipPlane.multiplyScalar(2.0 / this.clipPlane.dot(this.q));

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = this.clipPlane.x;
    projectionMatrix.elements[6] = this.clipPlane.y;
    projectionMatrix.elements[10] = this.clipPlane.z + 1.0 - this.clipBias;
    projectionMatrix.elements[14] = this.clipPlane.w;

    // Render
    this.visible = false;
    this.excluded.forEach((object) => (object.visible = false));

    const currentRenderTarget = renderer.getRenderTarget();
    const currentXrEnabled = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

    renderer.xr.enabled = false; // Avoid camera modification
    renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    renderer.setRenderTarget(this.renderTarget);

    // make sure the depth buffer is writable so it can be properly cleared, see #18897
    renderer.state.buffers.depth.setMask(true);

    if (renderer.autoClear === false) {
      renderer.clear();
    }

    renderer.render(scene, this.virtualCamera);

    if (this.blur > 0) {
      this.blurReflector(renderer, this.blur);
      if (!this.fastBlur) {
        this.blurReflector(renderer, this.blur * 0.4);
      }
    }

    renderer.xr.enabled = currentXrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

    renderer.setRenderTarget(currentRenderTarget);

    // Restore viewport
    // const viewport = camera.viewport;

    // if (viewport !== undefined) {
    //   renderer.state.viewport(viewport);
    // }

    this.excluded.forEach((object) => (object.visible = true));
    this.visible = true;
  }

  blurReflector(renderer, blurAmount) {
    this.horizontalBlurMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.horizontalBlurMaterial.uniforms.h.value = (blurAmount * 1) / 256;
    this.screen.material = this.horizontalBlurMaterial;

    renderer.setRenderTarget(this.renderTargetBlur);

    if (renderer.autoClear === false) {
      renderer.clear();
    }

    renderer.render(this.screenScene, this.screenCamera);

    this.verticalBlurMaterial.uniforms.tDiffuse.value = this.renderTargetBlur.texture;
    this.verticalBlurMaterial.uniforms.v.value = (blurAmount * 1) / 256;
    this.screen.material = this.verticalBlurMaterial;

    renderer.setRenderTarget(this.renderTarget);

    if (renderer.autoClear === false) {
      renderer.clear();
    }

    renderer.render(this.screenScene, this.screenCamera);
  }
}

BlurredReflector.prototype.isReflector = true;
