import { Raycaster, Vector2, EventDispatcher } from "three";

/** A proxy class to implement CPU-based raycasting */
export class RaycasterProxy extends EventDispatcher {
  /**
   * @param {THREE.Camera} camera - the camera to shoot the ray from
   * @param {HTMLElement} element - the element to listen to mouse / touch events
   */
  constructor(camera, element) {
    super();
    this.camera = camera;
    this.element = element;
    this.raycaster = new Raycaster();
    this.enabled = true;

    this._mouse = new Vector2();
    this._targets = [];
    this._intersected = null;

    this.onClick = this.click.bind(this);
    this.onTouch = this.touch.bind(this);
    this.onMove = this.move.bind(this);

    // register events to work both on desktop and mobile platforms
    this.element.addEventListener("mousedown", this.onClick, false);
    this.element.addEventListener("touchstart", this.onTouch, {
      passive: true,
    });
    this.element.addEventListener("mousemove", this.onMove);
    this.element.addEventListener("touchmove", this.onMove, { passive: true });
  }

  /**
   * Add one or more THREE objects to the list of objects that respond to raycasting events
   * @param {THREE.Object} objects -
   */
  add(objects) {
    if (!Array.isArray(objects)) {
      objects = [objects];
    }
    this._targets = this._targets.concat(objects);
  }

  dispose() {
    this.element.removeEventListener("mousedown", this.onClick, false);
    this.element.removeEventListener("touchstart", this.onTouch, {
      passive: true,
    });
    this.element.removeEventListener("mousemove", this.onMove);
    this.element.removeEventListener("touchmove", this.onMove, {
      passive: true,
    });
    this.raycaster = null;
    this.camera = null;
    this._targets = [];
  }

  move(event) {
    // on mouse move, refresh the list of objects intersecting
    // with the raycast emitted from the mouse posiition
    let x, y;

    if (event.changedTouches) {
      x = event.changedTouches[0].clientX;
      y = event.changedTouches[0].clientY;
    } else {
      x = event.clientX;
      y = event.clientY;
    }

    const rect = this.element.getBoundingClientRect();

    this._mouse.x = ((x - rect.left) / (rect.right - rect.left)) * 2 - 1;
    this._mouse.y = -((y - rect.top) / (rect.bottom - rect.top)) * 2 + 1;
    this.raycaster.setFromCamera(this._mouse, this.camera);

    let intersects = this.raycaster.intersectObjects(this._targets, true);

    if (intersects.length > 0) {
      if (this._intersected !== intersects[0].object) {
        if (this._intersected && this.enabled) {
          this.dispatchEvent({ type: "exit", object: this._intersected });
        }
        this._intersected = intersects[0].object;
        if (this.enabled) {
          this.dispatchEvent({ type: "enter", object: this._intersected });
        }
      }
    } else {
      if (this._intersected && this.enabled) {
        this.dispatchEvent({ type: "exit", object: this._intersected });
      }
      this._intersected = null;
    }
  }

  click(event) {
    if (this._intersected) {
      if (this.enabled) {
        this.dispatchEvent({ type: "click", object: this._intersected });
      }
    } else if (event.target instanceof HTMLCanvasElement) {
      // this means that "empty spaceE was clicked
      this.dispatchEvent({ type: "clear" });
    }
  }

  touch(event) {
    // tapping on a touchscreen counts as both moving and clicking
    this.move(event);
    this.click(event);
  }
}
