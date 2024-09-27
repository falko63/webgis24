export function createLayerPanel(panel, layergroups) {
  //console.log("createLayerPanel");
  let div = document.getElementById(panel);

  let h1 = document.createElement("h1"); // <h1></h1>
  h1.innerHTML = "Layer"; // <h1>Layer</h1>
  div.appendChild(h1);

  for (let layergroup of layergroups) {
    let h2 = document.createElement("h2");
    h2.classList.add("layer-h2");
    h2.innerHTML = layergroup.get("title");
    div.appendChild(h2);

    let layers = layergroup.getLayers();
    let ul = document.createElement("ul");
    ul.classList.add("layer-ul");
    layers.forEach((layer, index, array) => {
      //console.log(layer);
      //console.log(index);
      //console.log(array);
      let type = "checkbox";
      if (layer.get("type") == "base") {
        type = "radio";
      }

      let li = document.createElement("li");

      let input = document.createElement("input");
      input.type = type;
      input.value = layer.get("id");
      input.id = input.value;
      input.name = layergroup.get("id");
      if (layer.get("visible")) {
        input.defaultChecked = true;
      }

      input.addEventListener("change", () => {
        if (layer.get("type") == "base") {
          layergroup.getLayers().forEach((layer, index, array) => {
            layer.setVisible(layer.get("id") === input.value);
          });
        } else {
          layergroup.getLayers().forEach((layer, index, array) => {
            if (layer.get("id") === input.value) {
              layer.setVisible(input.checked);
            }
          });
        }
      });

      let label = document.createElement("label");
      label.htmlFor = input.id;
      label.appendChild(input);
      let text = document.createTextNode(layer.get("title"));
      label.appendChild(text);

      li.appendChild(label);
      ul.appendChild(li);
    });

    div.appendChild(ul);
  }
}
