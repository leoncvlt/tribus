import {
  CameraHelper,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  OrthographicCamera,
  PlaneGeometry,
  ShaderMaterial,
  WebGLRenderTarget,
} from "three";

import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader";

//from https://github.com/mrdoob/three.js/blob/master/examples/webgl_shadow_contact.html
export default class ContactShadows extends Mesh {
  set opacity(value) {
    this.planeMaterial.opacity = value;
  }
  get opacity() {
    return this.planeMaterial.opacity;
  }

  set darkness(value) {
    this._depthShader.uniforms.darkness.value = value;
  }
  get darkness() {
    return this._depthShader?.uniforms.darkness.value || 1;
  }

  constructor({
    width = 16,
    height = 16,
    textureWidth = 512,
    textureHeight = 512,
    cameraHeight = 16,
    darkness = 1,
    opacity = 1,
    blur = 4,
    fastBlur = false,
    manualRender = false,
  } = {}) {
    super();

    this.textureWidth = textureWidth;
    this.textureHeight = textureHeight;
    this.blur = blur;
    this.fastBlur = fastBlur;
    this.manualRender = manualRender;

    this.renderTarget = new WebGLRenderTarget(textureWidth, textureHeight);
    this.renderTarget.texture.generateMipmaps = false;

    this.renderTargetBlur = new WebGLRenderTarget(textureWidth, textureHeight);
    this.renderTargetBlur.texture.generateMipmaps = false;

    const planeGeometry = new PlaneGeometry(width, height).rotateX(Math.PI / 2);
    this.planeMaterial = new MeshBasicMaterial({
      map: this.renderTarget.texture,
      opacity,
      transparent: true,
      depthWrite: false,
    });
    const plane = new Mesh(planeGeometry, this.planeMaterial);
    plane.renderOrder = 1; // make sure it's rendered after other geo
    plane.scale.y = -1; // the y from the texture is flipped!
    this.add(plane);

    this.blurPlane = new Mesh(planeGeometry);
    this.blurPlane.visible = false;
    this.add(this.blurPlane);

    this.shadowCamera = new OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0,
      cameraHeight
    );
    this.shadowCamera.rotation.x = Math.PI / 2; // get the camera to look up
    this.add(this.shadowCamera);

    this.helpers = new Group();
    const cameraHelper = new CameraHelper(this.shadowCamera);
    this.helpers.add(cameraHelper);

    this.depthMaterial = new MeshDepthMaterial();

    this.depthMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.darkness = { value: darkness };
      shader.fragmentShader = /* glsl */ `
						uniform float darkness;
						${shader.fragmentShader.replace(
              "gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );",
              "gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );"
            )}
					`;
      this._depthShader = shader;
    };

    this.depthMaterial.depthTest = false;
    this.depthMaterial.depthWrite = false;

    this.horizontalBlurMaterial = new ShaderMaterial(HorizontalBlurShader);
    this.horizontalBlurMaterial.depthTest = false;

    this.verticalBlurMaterial = new ShaderMaterial(VerticalBlurShader);
    this.verticalBlurMaterial.depthTest = false;
  }

  blurShadow(renderer, blurAmount) {
    this.blurPlane.visible = true;

    // blur horizontally and draw in the renderTargetBlur
    this.blurPlane.material = this.horizontalBlurMaterial;
    this.blurPlane.material.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.horizontalBlurMaterial.uniforms.h.value = (blurAmount * 1) / this.textureWidth;

    renderer.setRenderTarget(this.renderTargetBlur);
    renderer.render(this.blurPlane, this.shadowCamera);

    // blur vertically and draw in the main renderTarget
    this.blurPlane.material = this.verticalBlurMaterial;
    this.blurPlane.material.uniforms.tDiffuse.value = this.renderTargetBlur.texture;
    this.verticalBlurMaterial.uniforms.v.value = (blurAmount * 1) / this.textureHeight;

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.blurPlane, this.shadowCamera);

    this.blurPlane.visible = false;
  }

  onBeforeRender(renderer, scene, camera) {
    if (!this.manualRender) {
      this.render(renderer, scene);
    }
  }

  render(renderer, scene) {
    // remove the background
    const initialBackground = scene.background;
    scene.background = null;

    // force the depthMaterial to everything
    this.helpers.visible = false;
    scene.overrideMaterial = this.depthMaterial;

    // render to the render target to get the depths
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(scene, this.shadowCamera);

    // and reset the override material
    scene.overrideMaterial = null;
    this.helpers.visible = true;

    this.blurShadow(renderer, this.blur);

    // a second pass to reduce the artifacts
    // (0.4 is the minimum blur amout so that the artifacts are gone)
    if (!this.fastBlur) {
      this.blurShadow(renderer, this.blur * 0.4);
    }

    // reset and render the normal scene
    renderer.setRenderTarget(null);
    scene.background = initialBackground;
  }
}
