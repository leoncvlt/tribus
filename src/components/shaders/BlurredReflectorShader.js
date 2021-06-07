export default {
  uniforms: {
    color: {
      value: null,
    },
    tint: {
      value: null,
    },
    tDiffuse: {
      value: null,
    },
    opacity: {
      value: 1.0,
    },
    textureMatrix: {
      value: null,
    },
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    void main() {
      vUv = textureMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform vec3 tint;
    uniform sampler2D tDiffuse;
    uniform float opacity;
    varying vec4 vUv;

    float blendOverlay( float base, float blend ) {
      return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );
    }
    vec3 blendOverlay( vec3 base, vec3 blend ) {
      return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );
    }
    void main() {
      vec4 base = texture2DProj( tDiffuse, vUv );
      // gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );
      vec3 tintColor = blendOverlay( base.rgb, tint );
      gl_FragColor = vec4( mix( tintColor, color, 1.0 - opacity ), 1.0 );
    }
  `,
};
