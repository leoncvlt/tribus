# tribus
High-level imperative components for three.js to easily implement certain effects, workflows or patterns.

Note that this project is a still a work in progress and the API / methods might be subject to changes between releases.

Effects                                     | Utils
---                                         | ---
[Contact Shadows ](#Contact-Shadows)        | [Asset Loader](#Asset-Loader)
[Reflector](#Reflector)                     
[Environment](#Environment)                 

## Effects 

### Environment

Set the scene's environment from a texture, or a neutral procedural studio environment.

```js
const environment = new Environment(renderer, scene);

environment.apply({
  texture: null, // texture to use - omit for a neutral procedural studio environment
                 // pass a preloaded texture object or a path to a file, in the latter
                 // case the texture will be loaded and this method can be awaited
  equirectangular: true, // whether the texture is in equirectangular format
  cubemap: false // whether the texture is in cubemap format
  background: true, // set the texture as the scene's background as well
});
```

### Reflector

Reflector with support for transparency and blurry reflections. Based on the native three.js reflector by [Slayvin](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/Reflector.js), with [pschroen](https://github.com/pschroen/alien.js/blob/master/src/utils/world/Reflector.js)'s approach for full-screen rendering.

```js
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

Contact shadows implementation by projecting the objects on a plane. Based on  three.js [example](https://github.com/mrdoob/three.js/blob/master/examples/webgl_shadow_contact.html)

```js
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
const assetLoader = new AssetLoader();
assetLoader.queue({
  url: "path/to/file.gltf" // path of the file to load, either as a static file
                           // or as parsed from your bundler of choice
  key: "my-gltf", // asset key, used to later fetch the asset with `get()`
  type: AssetLoader.TYPES.GTLF, // asset type, determines the loader used. 
                                // Valid types: File, Image, Texture, HDRI, GLTF
})
...
// callback to run after each asset has finished loading 
assetLoader.addEventListener("progress", (current, total) => {})
...
await assetLoader.load();
...
const gltf = assetStore.get("my-gltf");
scene.add(gltf.scene);
``