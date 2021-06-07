import { Vector2 } from "three";

import { TempNode } from "three/examples/jsm/nodes/core/TempNode";
import { FunctionNode } from "three/examples/jsm/nodes/core/FunctionNode.js";
import { FloatNode } from "three/examples/jsm/nodes/inputs/FloatNode";
import { Vector2Node } from "three/examples/jsm/nodes/inputs/Vector2Node.js";
import { UVNode } from "three/examples/jsm/nodes/accessors/UVNode";

export class TwoPassBlurNode extends TempNode {
  constructor(value, uv, radius, size) {
    super("v4");

    this.value = value;
    this.uv = uv || new UVNode();
    this.radius = radius || new Vector2Node(1, 1);

    this.size = size;

    this.blurX = true;
    this.blurY = true;

    this.horizontal = new FloatNode(1 / 64);
    this.vertical = new FloatNode(1 / 64);
  }

  updateFrame(/* frame */) {
    if (this.size) {
      this.horizontal.value = this.radius.x / this.size.x;
      this.vertical.value = this.radius.y / this.size.y;
    } else if (this.value.value && this.value.value.image) {
      const image = this.value.value.image;

      this.horizontal.value = this.radius.x / image.width;
      this.vertical.value = this.radius.y / image.height;
    }
  }

  generate(builder, output) {
    if (builder.isShader("fragment")) {
      const blurCode = [];
      let code;

      const blurX = builder.include(TwoPassBlurNode.Nodes.blurX),
        blurY = builder.include(TwoPassBlurNode.Nodes.blurY);

      if (this.blurX) {
        blurCode.push(
          blurX +
            "( " +
            this.value.build(builder, "sampler2D") +
            ", " +
            this.uv.build(builder, "v2") +
            ", " +
            this.horizontal.build(builder, "f") +
            " )"
        );
      }

      if (this.blurY) {
        blurCode.push(
          blurY +
            "( " +
            this.value.build(builder, "sampler2D") +
            ", " +
            this.uv.build(builder, "v2") +
            ", " +
            this.vertical.build(builder, "f") +
            " )"
        );
      }

      if (blurCode.length == 2) code = "( " + blurCode.join(" + ") + " / 2.0 )";
      else if (blurCode.length) code = "( " + blurCode[0] + " )";
      else code = "vec4( 0.0 )";

      return builder.format(code, this.getType(builder), output);
    } else {
      console.warn("THREE.BlurNode is not compatible with " + builder.shader + " shader.");

      return builder.format("vec4( 0.0 )", this.getType(builder), output);
    }
  }

  copy(source) {
    super.copy(source);

    this.value = source.value;
    this.uv = source.uv;
    this.radius = source.radius;

    if (source.size !== undefined) this.size = new Vector2(source.size.x, source.size.y);

    this.blurX = source.blurX;
    this.blurY = source.blurY;

    return this;
  }

  toJSON(meta) {
    let data = this.getJSONNode(meta);

    if (!data) {
      data = this.createJSONNode(meta);

      data.value = this.value.toJSON(meta).uuid;
      data.uv = this.uv.toJSON(meta).uuid;
      data.radius = this.radius.toJSON(meta).uuid;

      if (this.size) data.size = { x: this.size.x, y: this.size.y };

      data.blurX = this.blurX;
      data.blurY = this.blurY;
    }

    return data;
  }
}

TwoPassBlurNode.Nodes = (function () {
  const erf = (x) => {
    // constants
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * Math.abs(x));
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return Math.sign(x) * y;
  };

  const def_int_gaussian = (x, mu, sigma) => {
    return 0.5 * erf((x - mu) / (Math.SQRT2 * sigma));
  };

  const gaussian_kernel = (kernel_size = 5, sigma = 1, mu = 0, step = 1) => {
    const end = 0.5 * kernel_size;
    const start = -end;
    const coeff = [];
    let sum = 0;
    let x = start;
    let last_int = def_int_gaussian(x, mu, sigma);
    let acc = 0;
    while (x < end) {
      x += step;
      const new_int = def_int_gaussian(x, mu, sigma);
      let c = new_int - last_int;
      coeff.push(c);
      sum += c;
      last_int = new_int;
    }

    //normalize
    sum = 1 / sum;
    for (let i = 0; i < coeff.length; i++) {
      coeff[i] *= sum;
    }
    return coeff;
  };

  // const kernels = [0.051, 0.0918, 0.12245, 0.1531, 0.1633, 0.1531, 0.12245, 0.0918, 0.051];
  const kernels = gaussian_kernel(21, 4.0)

  const blurCodeX = [`vec4 blurX( sampler2D tex, vec2 uv, float s ) {`, `vec4 sum = vec4( 0.0 );`]
    .concat(
      kernels.map((kernel, index, total) => {
        const iteration = index - (total.length - 1) / 2;
        const istr = `${iteration < 0 ? "-" : "+"} ${Math.abs(iteration).toFixed(1)}`;
        return index === (total.length - 1) / 2
          ? `sum += texture2D( tex, vec2( uv.x, uv.y ) ) * ${kernel};`
          : `sum += texture2D( tex, vec2( uv.x ${istr} * s, uv.y ) ) * ${kernel};`;
      })
    )
    .concat(["return sum * .667;", "}"])
    .join("\n");

  const blurCodeY = [`vec4 blurY( sampler2D tex, vec2 uv, float s ) {`, `vec4 sum = vec4( 0.0 );`]
    .concat(
      kernels.map((kernel, index, total) => {
        const iteration = index - (total.length - 1) / 2;
        const istr = `${iteration < 0 ? "-" : "+"} ${Math.abs(iteration).toFixed(1)}`;
        return index === (total.length - 1) / 2
          ? `sum += texture2D( tex, vec2( uv.x, uv.y ) ) * ${kernel};`
          : `sum += texture2D( tex, vec2( uv.x, uv.y ${istr} * s ) ) * ${kernel};`;
      })
    )
    .concat(["return sum * .667;", "}"])
    .join("\n");

  const blurX = new FunctionNode(blurCodeX);

  const blurY = new FunctionNode(blurCodeY);

  return {
    blurX: blurX,
    blurY: blurY,
  };
})();

TwoPassBlurNode.prototype.nodeType = "Blur";
TwoPassBlurNode.prototype.hashProperties = ["blurX", "blurY"];
