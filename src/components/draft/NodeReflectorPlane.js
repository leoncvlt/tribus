import { Mesh, MeshBasicMaterial, PlaneBufferGeometry, Vector2 } from "three";

import {
  NodeFrame,
  ExpressionNode,
  PhongNodeMaterial,
  OperatorNode,
  BlurNode,
  FloatNode,
  ReflectorNode,
  TextureNode,
  JoinNode,
} from "three/examples/jsm/nodes/Nodes.js";

import { ReflectorRTT } from "three/examples/jsm/objects/ReflectorRTT.js";

export default class ReflectorPlane extends ReflectorRTT {
  constructor({
    width = 10,
    height = 10,
    blur = 1,
    clipBias = 0.003,
    resolution = 512,
    material = new MeshBasicMaterial({ color: 0xffffff }),
    mirror = 0.5,
  } = {}) {
    super(new PlaneBufferGeometry(width, height), {
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerWidth * window.devicePixelRatio,
      clipBias,
    });

    this.frame = new NodeFrame();

    const reflectorNode = new ReflectorNode(this);
    reflectorNode.offset = new FloatNode(0);

    const blurNode = new BlurNode(reflectorNode);
    blurNode.size = new Vector2(
      window.innerWidth * window.devicePixelRatio,
      window.innerHeight * window.devicePixelRatio
    );
    blurNode.uv = new ExpressionNode("projCoord.xyz / projCoord.q", "vec3");
    blurNode.uv.keywords["projCoord"] = new OperatorNode(
      reflectorNode.offset,
      reflectorNode.uv,
      OperatorNode.ADD
    );
    blurNode.radius.x = blurNode.radius.y = blur;

    this.mirrorMaterial = new PhongNodeMaterial();
    this.mirrorMaterial.environment = blurNode;

    // add all alternative mirror materials inside the ReflectorRTT to prevent:
    // glDrawElements: Source and destination textures of the draw are the same.
    const mirrorMesh = new Mesh(new PlaneBufferGeometry(width, height), this.mirrorMaterial);
    material.transparent = true;
    material.opacity = 1 - mirror;
    const groundMesh = new Mesh(new PlaneBufferGeometry(width, height), material);
    this.add(mirrorMesh);
    this.add(groundMesh);
  }

  update(delta) {
    this.frame.update(delta).updateNode(this.mirrorMaterial);
  }
}
