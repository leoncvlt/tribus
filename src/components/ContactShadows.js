import {
  CameraHelper,
  Color,
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
export default class ContactShadows extends Group {
  set opacity(value) {
    this.planeMaterial.opacity = value;
  }
  get opacity() {
    return this.planeMaterial.opacity;
  }

  constructor({
    width = 10,
    height = 10,
    cameraHeight = 10,
    blur = 8,
    darkness = 1,
    opacity = 1,
    planeColor = new Color(0xffffff),
    planeOpacity = 1,
    debugCamera = false,
    fast = false,
  } = {}) {
    super();
    this.blur = blur;
    this.fast = fast;

    this.renderTarget = new WebGLRenderTarget(512, 512);
    this.renderTarget.texture.generateMipmaps = false;

    this.renderTargetBlur = new WebGLRenderTarget(512, 512);
    this.renderTargetBlur.texture.generateMipmaps = false;

    const planeGeometry = new PlaneGeometry(width, height).rotateX(Math.PI / 2);
    this.planeMaterial = new MeshBasicMaterial({
      map: this.renderTarget.texture,
      opacity,
      transparent: true,
      depthWrite: false,
    });
    const plane = new Mesh(planeGeometry, this.planeMaterial);
    plane.renderOrder = 1; // make sure it's rendered after the fillPlane
    plane.scale.y = -1; // the y from the texture is flipped!
    this.add(plane);

    this.blurPlane = new Mesh(planeGeometry);
    this.blurPlane.visible = false;
    this.add(this.blurPlane);

    const fillPlaneMaterial = new MeshBasicMaterial({
      color: planeColor,
      opacity: planeOpacity,
      transparent: planeOpacity < 1,
      depthWrite: false,
    });
    const fillPlane = new Mesh(planeGeometry, fillPlaneMaterial);
    fillPlane.rotateX(Math.PI);
    this.add(fillPlane);

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

    this.cameraHelper = new CameraHelper(this.shadowCamera);
    if (debugCamera) {
      this.add(this.cameraHelper);
    }

    this.depthMaterial = new MeshDepthMaterial();

    this.depthMaterial.onBeforeCompile = function (shader) {
      shader.uniforms.darkness = { value: darkness };
      shader.fragmentShader = /* glsl */ `
						uniform float darkness;
						${shader.fragmentShader.replace(
              "gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );",
              "gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );"
            )}
					`;
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
    this.horizontalBlurMaterial.uniforms.h.value = (blurAmount * 1) / 256;

    renderer.setRenderTarget(this.renderTargetBlur);
    renderer.render(this.blurPlane, this.shadowCamera);

    // blur vertically and draw in the main renderTarget
    this.blurPlane.material = this.verticalBlurMaterial;
    this.blurPlane.material.uniforms.tDiffuse.value = this.renderTargetBlur.texture;
    this.verticalBlurMaterial.uniforms.v.value = (blurAmount * 1) / 256;

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.blurPlane, this.shadowCamera);

    this.blurPlane.visible = false;
  }

  render(scene, renderer) {
    // remove the background
    const initialBackground = scene.background;
    scene.background = null;

    // force the depthMaterial to everything
    this.cameraHelper.visible = false;
    scene.overrideMaterial = this.depthMaterial;

    // render to the render target to get the depths
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(scene, this.shadowCamera);

    // and reset the override material
    scene.overrideMaterial = null;
    this.cameraHelper.visible = true;

    this.blurShadow(renderer, this.blur);

    // a second pass to reduce the artifacts
    // (0.4 is the minimum blur amout so that the artifacts are gone)
    if (!this.fast) {
      this.blurShadow(renderer, this.blur * 0.4);
    }

    // reset and render the normal scene
    renderer.setRenderTarget(null);
    scene.background = initialBackground;
  }
}
