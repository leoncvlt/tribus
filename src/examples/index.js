import "./styles.css";

import EnvironmentExample from "./scenes/Environment";
import ContactShadowsExample from "./scenes/ContactShadows";
import BlurredReflectorExample from "./scenes/BlurredReflector";
import ProgressiveShadowsExample from "./scenes/ProgressiveShadows";
import AssetLoaderExample from "./scenes/AssetLoader";

const examples = {
  BlurredReflectorExample,
  ContactShadowsExample,
  EnvironmentExample,
  ProgressiveShadowsExample,
  AssetLoaderExample,
};

const example = window.location.hash.replace("#", "");
const state = { example };
const gui = new Tweakpane.Pane();
const exampleInput = gui.addInput(state, "example", {
  label: "Example",
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
  const exampleParameters = gui.addFolder({
    title: "Parameters",
  });
  new examples[state.example]({ gui: exampleParameters });
}
