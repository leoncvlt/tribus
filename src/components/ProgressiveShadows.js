import {
  ArrowHelper,
  Box3,
  Box3Helper,
  DirectionalLight,
  DirectionalLightHelper,
  Group,
  Vector3,
} from "three";
import { ProgressiveLightMap } from "three/examples/jsm/misc/ProgressiveLightMap";

export default class ProgressiveShadows {
  constructor(
    renderer,
    {
      origin = new Vector3(5, 5, 5),
      target = new Vector3(0, 1, 0),
      center = new Vector3(0, 0, 0),
      shadowMapResolution = 512,
      lightMapResolution = 1024,
      lightsCount = 8,
      ambientWeight = 0.5,
      blendWindow = 200,
      lightRadius = 50,
    } = {}
  ) {
    this.center = center;
    this.origin = origin;
    this.target = target;
    this.ambientWeight = ambientWeight;
    this.blendWindow = blendWindow;
    this.lightRadius = lightRadius;

    this.progressiveSurfacemap = new ProgressiveLightMap(renderer, lightMapResolution);

    this.lights = [];
    this.helpers = this.buildHelpers();

    for (let l = 0; l < lightsCount; l++) {
      const light = new DirectionalLight(0xffffff, 1.0 / lightsCount);
      light.name = "Dir. Light " + l;
      // light.position.set(200, 200, 200);
      light.castShadow = true;
      light.target.position.copy(target);
      // light.shadow.camera.near = 100;
      // light.shadow.camera.far = 5000;
      // light.shadow.camera.right = 150;
      // light.shadow.camera.left = -150;
      // light.shadow.camera.top = 150;
      // light.shadow.camera.bottom = -150;
      light.shadow.mapSize.width = shadowMapResolution;
      light.shadow.mapSize.height = shadowMapResolution;

      this.lights.push(light);
    }

    this.progressiveSurfacemap.addObjectsToLightMap(this.lights);
  }

  buildHelpers() {
    const helpers = new Group();
    helpers.add(
      new ArrowHelper(
        this.target.clone().sub(this.origin).normalize(),
        this.origin,
        this.target.clone().sub(this.origin).length(),
        0xffff00,
        0,
        0
      ),
      new Box3Helper(new Box3().setFromCenterAndSize(this.origin, new Vector3(1, 1, 1)), 0xffff00),
      new Box3Helper(
        new Box3().setFromCenterAndSize(this.target, new Vector3(0.5, 0.5, 0.5)),
        0xffff00
      )
    );
  }

  add(objects) {
    if (!Array.isArray(objects)) {
      object = [objects];
    }
    this.progressiveSurfacemap.addObjectsToLightMap(objects);
  }

  render(camera) {
    // Accumulate Surface Maps
    this.progressiveSurfacemap.update(camera, this.blendWindow, true);

    // Manually Update the Directional Lights
    for (let l = 0; l < this.lights.length; l++) {
      // Sometimes they will be sampled from the target direction
      // Sometimes they will be uniformly sampled from the upper hemisphere
      if (Math.random() > this.ambientWeight) {
        // console.log(this.origin.x + Math.random() * this.lightRadius,)
        this.lights[l].position.set(
          this.origin.x + Math.random() * this.lightRadius,
          this.origin.y + Math.random() * this.lightRadius,
          this.origin.z + Math.random() * this.lightRadius
        );
      } else {
        // Uniform Hemispherical Surface Distribution for Ambient Occlusion
        const lambda = Math.acos(2 * Math.random() - 1) - 3.14159 / 2.0;
        const phi = 2 * 3.14159 * Math.random();
        this.lights[l].position.set(
          Math.cos(lambda) * Math.cos(phi) * 300 + this.center.x,
          Math.abs(Math.cos(lambda) * Math.sin(phi) * 300) + this.center.y + 20,
          Math.sin(lambda) * 300 + this.center.z
        );
      }
    }
  }
}
