export default {
  uniforms: {
    color: {
      value: null
    },
    map: {
      value: null
    },
    opacity: {
      value: 1.0
    },
    textureMatrix: {
      value: null
    }
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
    uniform sampler2D map;
    uniform float opacity;
    varying vec4 vUv;
    void main() {
      vec4 base = texture2DProj( map, vUv );
      gl_FragColor = vec4(base.rgb * color, base.a * opacity );
      gl_FragColor.rgb *= opacity;
    }
  `
};
