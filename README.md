# tribus
High-level imperative components for three.js to easily implement specific effects, workflows or patterns. Inspired by [pmndrs/drei](https://github.com/pmndrs/drei)

> 🚨 Note that this project is a still a heavy work in progress and the API / methods might be subject to changes between releases.

Effects                                     | Utils
---                                         | ---
[Contact Shadows ](#Contact-Shadows)        | [Asset Loader](#Asset-Loader)
[Reflector](#Reflector)                     
[Environment](#Environment)                 

## Effects 

### Environment

Set the scene's environment from a texture, or a neutral procedural studio environment.

```js
import { Environment } from "tribus";
const environment = new Environment(
  renderer, // the three.js renderer
  scene, // the scene to set the environment for
  {
    texture: null, // texture to use - omit for a neutral procedural studio environment
                  // pass a preloaded texture object or a path to a file, in the latter
                  // case the texture will be loaded and this method can be awaited
    equirectangular: true, // whether the texture is in equirectangular format
    cubemap: false // whether the texture is in cubemap format
    background: true, // set the texture as the scene's background as well
  }
);
// call `apply` to change environment after instantiation if you wish
environment.apply({ texture, equirectangular, cubemap, background });
```

### Reflector

Reflector with support for transparency and blurry reflections. Based on the native three.js reflector by [Slayvin](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/Reflector.js), with [pschroen](https://github.com/pschroen/alien.js/blob/master/src/utils/world/Reflector.js)'s approach for full-screen rendering.

```js
import { BlurredReflector } from "tribus";
const reflector = new BlurredReflector({
  geometry: null // the geometry to apply the reflection on
                 // omit to use a default ground plane
  width: 16, // width of the reflecting plane, if no geometry is defined
  height: 16, // height of the reflecting plane, if no geometry is defined
  textureWidth: 512 // width of the texture used to draw the reflections on
  textureHeight: 512 // height of the texture used to draw the reflections on
  opacity: 1 // reflections opacity
  blur: 0 // reflections blurriness
  color: 0xffffff // reflections tint color (multiplied)
  fastBlur: false // use faster, but lower-quality blur
  manualRender: false // if true, the reflection won't be rendered automatically
                      // call .render(scene, renderer) in your update loop to render 
});
scene.add(reflector);
```

### Contact Shadows

Contact shadows implementation by projecting the objects on a plane. Based on this three.js [example](https://github.com/mrdoob/three.js/blob/master/examples/webgl_shadow_contact.html).

```js
import { ContactShadows } from "tribus";
const contactShadows = new ContactShadows({
  width: 16, // width of the plane the shadows are projected on
  height: 16, // height of the plane the shadows are projected on
  textureWidth: 512// width of the texture used to draw the shadows on
  textureHeight: 512 // height of the texture used to draw the shadows on
  cameraHeight: 16, // height of the camera projecting the shadows on the geometry
  darkness: 1, // shadows intensity
  opacity: 1, // shadows opacity
  blur: 4, // shadows blurriness
  fastBlur: false, // use faster, but lower-quality blur
  manualRender: false // if true, the contact shadows won't be rendered automatically
                      // call .render(scene, renderer) in your update loop to render 
});
scene.add(this.contactShadows);
scene.add(this.contactShadows.helpers); // display helpers (optional)
```

## Utilities

### AssetLoader

Queues and preloads asset according to their type into a key-value pair store.

```js
// a deafult global instance of AssetLoader is exported from the file
// alternatively, import the named export and instantiate your own
import AssetLoader from "tribus/AssetLoader";
AssetLoader.queue(
  "path/to/file.gltf" // path of the file to load, either as a static file
                      // or as parsed from your bundler of choice
  "my-gltf", // key / ID of the asset, used to later fetch the asset with `get()`
             // if omitted defaults to the asset filename (without path)
  ssetLoader.TYPES.GTLF, // asset type, determines the loader used. 
                         // Valid types: File, Image, Texture, HDRI, GLTF
                         // if omitted defaults to File, returned as a blob URL
)
...
// callback to run after each asset has finished loading 
AssetLoader.addEventListener("progress", (current, total) => {})
// callback to run after all assets have finished loading 
AssetLoader.addEventListener("loaded", () => {})
...
await assetLoader.load();
...
const gltf = AssetLoader.get("my-gltf");
scene.add(gltf.scene);
``