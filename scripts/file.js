// Select necessary elements
const loadButton = document.getElementById("loadButton");
const fileInput = document.getElementById("filePathInput");
const treeContainer = document.getElementById("tree");

// Stub function for data handling
async function dataHandler(filePath) {
  // fetch data from http://localhost:3001/ with the filePath in the body
  const response = await fetch("http://localhost:3001/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filePath: filePath }),
    error: function (error) {
      document.getElementById("loading").style.display = "none";
    },
  });

  const responseData = await response.json();

  return responseData; // This is a placeholder; it could transform or filter data as needed
}

// Trigger file input on button click
loadButton.addEventListener("click", async () => {
  document.getElementById("loading").style.display = "flex";
  // value of the fileInput element
  const filePath = fileInput.value;
  // Call dataHandler with the filePath
  const data = await dataHandler(filePath);
  displayJsonTree(data);
});
