import "./styles.css";

import { Pane } from "tweakpane";

import EnvironmentExample from "./scenes/Environment";
import ContactShadowsExample from "./scenes/ContactShadows";
import ReflectorExample from "./scenes/Reflector";

const examples = {
  ContactShadowsExample,
  EnvironmentExample,
  ReflectorExample,
};

const example = window.location.hash.replace("#", "");
const state = { example };
const gui = new Pane();
const exampleInput = gui.addInput(state, "example", {
  options: Object.keys(examples).reduce((options, key) => {
    options[key] = key;
    return options;
  }, {}),
});

exampleInput.on("change", (e) => {
  window.location.hash = e.value;
  window.location.reload();
});

if (state.example) {
  document.getElementById("intro").remove();
  const exampleParameters = gui.addFolder({
    title: "example parameters",
  });
  new examples[state.example]({ gui: exampleParameters });
}
