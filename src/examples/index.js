import "./styles.css";

const scenes = import.meta.glob("./scenes/*.js", { eager: true });
const examples = Object.fromEntries(
  Object.entries(scenes).map(([path, example]) => [
    path.split("/").pop().replace(".js", ""),
    example.default,
  ])
);

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

if (state.example && state.example in examples) {
  const exampleParameters = gui.addFolder({
    title: "Parameters",
  });
  new examples[state.example]({ gui: exampleParameters });
}
