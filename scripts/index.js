const divider = document.getElementById("divider");
const tree = document.getElementById("tree");
const node = document.getElementById("node");

let isDragging = false;

divider.addEventListener("mousedown", (e) => {
  isDragging = true;
  document.body.style.cursor = "ew-resize";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  // Calculate new widths for `#tree` and `#node`
  const appRect = document.getElementById("app").getBoundingClientRect();
  const newTreeWidth = e.clientX - appRect.left;
  const newNodeWidth = appRect.right - e.clientX;

  // Set new widths
  tree.style.width = `${newTreeWidth}px`;
  node.style.width = `${newNodeWidth}px`;
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = "default";
  }
});