import * as d3 from "d3";
import type { D3ForceTree, Link, Node } from "./types";

// Define zoom at the module level so it can be used in both displayJsonTree and centerOnNode
let zoom: any;

function centerOnNode(nodeId: string, nodes: Node[], svg: any) {
  const node = nodes.find((d) => d.id === nodeId)!;

  if (node) {
    // Calculate the desired translation to center the view on the node's coordinates.
    const svgWidth = svg.node().clientWidth;
    const svgHeight = svg.node().clientHeight;

    const xTranslation = svgWidth / 2 - node.x!;
    const yTranslation = svgHeight / 2 - node.y!;

    // Apply the transform to the 'g' element containing the graph.
    // Use zoom.transform to update both the view and the zoom state
    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity.translate(xTranslation, yTranslation)
      )
      .on("end", () => {
        highlightNode(node);
      });
  }
}

function highlightNode(node: Node) {
  // Remove any existing ripple
  d3.select("#ripple-effect").remove();

  // Find the node's SVG element and get its current position
  const nodeElem = d3.select(`#node-${node.id}`);
  const cx = +nodeElem.attr("cx");
  const cy = +nodeElem.attr("cy");

  // Find the SVG group containing the nodes
  const svg = d3.select("svg");
  const g = svg.select("g");

  // Add a circle at the node's position for the ripple effect
  const ripple = g
    .append("circle")
    .attr("id", "ripple-effect")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", 10)
    .attr("fill", "none")
    .attr("stroke", "#ffcc00")
    .attr("stroke-width", 4)
    .attr("stroke-opacity", 0.7);

  // Animate the ripple: expand and fade out
  ripple
    .transition()
    .duration(700)
    .attr("r", 40)
    .attr("stroke-opacity", 0)
    .remove();
}

async function displayJsonTree(data: D3ForceTree) {
  const treeContainer = document.getElementById("tree")!;

  // Show the loading spinner
  document.getElementById("loading")!.style.display = "flex";

  // Function to dynamically set width and height based on #tree element
  function getTreeDimensions() {
    const { width, height } = treeContainer.getBoundingClientRect();
    return { width, height };
  }

  // Initialize SVG with dimensions of #tree container
  const { width, height } = getTreeDimensions();

  // Clear any previous SVG content in the #tree container
  d3.select("#tree").select("svg").remove();

  const svg = d3
    .select("#tree")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Add a group for all elements that will move during zoom or drag
  const g = svg.append("g");

  g.attr("id", "graph-background");

  // Create D3 force simulation
  const simulation = d3
    .forceSimulation(data.nodes)
    .force(
      "link",
      d3
        .forceLink(data.links)
        .id((d) => (d as Node).id)
        .distance(100)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  // Run the simulation for a fixed number of ticks to stabilize the positions
  for (let i = 0; i < 300; i++) {
    // Adjust the number of iterations as needed
    simulation.tick();
  }

  // Now that the simulation has stabilized, save the final positions
  const finalPositions = data.nodes.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
  }));

  // Draw links using pre-calculated positions
  g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(data.links)
    .enter()
    .append("line")
    .attr("id", (d) => `link-${d.sourceId}-${d.targetId}`)
    .attr("stroke", "#999")
    .attr("stroke-width", 1.5)
    .attr(
      "x1",
      (d) => finalPositions.find((pos) => pos.id === d.sourceId)?.x ?? null
    )
    .attr(
      "y1",
      (d) => finalPositions.find((pos) => pos.id === d.sourceId)?.y ?? null
    )
    .attr(
      "x2",
      (d) => finalPositions.find((pos) => pos.id === d.targetId)?.x ?? null
    )
    .attr(
      "y2",
      (d) => finalPositions.find((pos) => pos.id === d.targetId)?.y ?? null
    );

  // Draw nodes using pre-calculated positions
  const node = g
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(data.nodes)
    .enter()
    .append("circle")
    .attr("r", 10)
    .attr("id", (d) => `node-${d.id}`)
    .attr("fill", (d) => (d.isRoot ? "#ff4500" : "#69b3a2"))
    .attr("cx", (d) => finalPositions.find((pos) => pos.id === d.id)?.x ?? null)
    .attr("cy", (d) => finalPositions.find((pos) => pos.id === d.id)?.y ?? null)
    .call(drag(simulation));

  // Add labels, positioning them based on pre-calculated node positions
  g.append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(data.nodes)
    .enter()
    .append("text")
    .attr("dy", -12) // Position the label above the node
    .attr("text-anchor", "middle")
    .attr("class", (d) => `label-${d.id}`)
    .attr("fill", "white") // Set label text color to white
    .attr("x", (d) => finalPositions.find((pos) => pos.id === d.id)?.x ?? null)
    .attr("y", (d) => finalPositions.find((pos) => pos.id === d.id)?.y ?? null)
    .text((d) => d.name);

  // Zoom behavior
  // Track the current zoom transform
  let currentTransform = d3.zoomIdentity;
  zoom = d3.zoom().on("zoom", (event) => {
    currentTransform = event.transform;
    g.attr("transform", event.transform); // Apply zoom transform to the group
  });

  // when a link is clicked from the node list, we want to move this node into view inside the tree
  function listLinkClickHandler(event: any) {
    const nodeId = event.target.href.split("#node-")[1];
    const node: any = d3.select(`#node-${nodeId}`).data()[0];

    centerOnNode(node.id, data.nodes, svg);
  }

  // Handle node click event
  node.on("click", function (_event, clickedNode) {
    if (wasDragged) {
      wasDragged = false;
      return;
    }
    repaintNodeLinks(clickedNode, data.links); // Call function to repaint links
    displayNodeData(clickedNode, data.links, listLinkClickHandler); // Call function to display data in #node element
    highlightNode(clickedNode);
  });

  // Apply zoom behavior to SVG
  svg.call(zoom);

  // Resize handling
  const resizeObserver = new ResizeObserver(() => {
    const { width, height } = getTreeDimensions();
    svg.attr("width", width).attr("height", height);
    simulation.force("center", d3.forceCenter(width / 2, height / 2)).restart();
  });

  // Observe the #tree container for resizing
  resizeObserver.observe(treeContainer);

  // Hide the loading spinner once the visualization is rendered
  document.getElementById("loading")!.style.display = "none";

  function drag(simulation: d3.Simulation<Node, undefined>) {
    return d3
      .drag<SVGCircleElement, Node>()
      .on(
        "start",
        (event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          wasDragged = false;
          g.attr("transform", currentTransform.toString());
        }
      )
      .on(
        "drag",
        (event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) => {
          const [x, y] = currentTransform.invert([event.x, event.y]);
          d.fx = x;
          d.fy = y;
          wasDragged = true;
        }
      )
      .on(
        "end",
        (event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }
      );
  }

  // Function to display node data and link data in the #node element
  function displayNodeData(clickedNode: Node, links: Link[], handle: Function) {
    const nodeElement = document.getElementById("nodeInfo")!;

    // Clear any previous content
    nodeElement.innerHTML = "";
    const title = document.createElement("h3");
    title.innerHTML = "Current File";
    nodeElement.appendChild(title);

    const fileLink = document.createElement("a");
    fileLink.textContent = clickedNode.filePath;
    fileLink.href = "#";
    fileLink.onclick = (e) => {
      const vscodeUri = `vscode://file/${clickedNode.filePath.replace(
        /\\/g,
        "/"
      )}`;
      window.open(vscodeUri, "_blank");
      e.preventDefault();
    };
    nodeElement.appendChild(fileLink);

    // Create a simple JSON display of the node data
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(clickedNode, null, 2);
    nodeElement.appendChild(pre);

    // Create lists for links TO and FROM the clicked node
    const linksToNode = links.filter(
      (link) => link.targetId === clickedNode.id
    );
    const linksFromNode = links.filter(
      (link) => link.sourceId === clickedNode.id
    );

    const toAnchor = document.getElementById("toAnchor")!;
    const fromAnchor = document.getElementById("fromAnchor")!;

    createToLinks(linksToNode, "Links to this node", toAnchor, handle);
    createFromLinks(linksFromNode, "Links from this node", fromAnchor, handle);
  }
}

// Expose displayJsonTree to the global window object for use in non-module scripts
(window as any).displayJsonTree = displayJsonTree;

let lastClickedNode: Node | null = null;
let wasDragged = false;

function repaintNodeLinks(clickedNode: Node, links: Link[]) {
  if (lastClickedNode && lastClickedNode.id === clickedNode.id) {
    // Reset everything to normal
    d3.selectAll("line").attr("stroke-opacity", 1).attr("stroke", "#999");
    d3.selectAll("circle").attr("fill-opacity", 1);
    d3.selectAll("text").attr("fill-opacity", 1);
    lastClickedNode = null;
    return;
  }

  // all other links and nodes should have opacity set to 0.3
  d3.selectAll("line").attr("stroke-opacity", 0.3);
  d3.selectAll("circle").attr("fill-opacity", 0.3);
  d3.selectAll("text").attr("fill-opacity", 0.3);

  // Repaint all links to default color
  d3.selectAll("line").attr("stroke", "#999");

  const linksToNode = links.filter((link) => link.targetId === clickedNode.id);

  const linksFromNode = links.filter(
    (link) => link.sourceId === clickedNode.id
  );

  // Highlight linksTo associated with the clicked node
  linksToNode.forEach((link) => {
    if (link.sourceId === clickedNode.id || link.targetId === clickedNode.id) {
      d3.select(`#link-${link.sourceId}-${link.targetId}`)
        .attr("stroke", "#ff4500")
        .attr("stroke-opacity", 1);
      // the source and target nodes should have opacity set to 1
      d3.select(`#node-${link.sourceId}`).attr("fill-opacity", 1);
      d3.select(`#node-${link.targetId}`).attr("fill-opacity", 1);
      // the labels of the source and all targets should have opacity set to 1
      d3.select(`.label-${link.sourceId}`).attr("fill-opacity", 1);
      d3.select(`.label-${link.targetId}`).attr("fill-opacity", 1);
    }
  });
  // Highlight linksFrom associated with the clicked node
  linksFromNode.forEach((link) => {
    if (link.sourceId === clickedNode.id || link.targetId === clickedNode.id) {
      d3.select(`#link-${link.sourceId}-${link.targetId}`)
        .attr("stroke", "#ff66ff")
        .attr("stroke-opacity", 1);
      // the source and target nodes should have opacity set to 1
      d3.select(`#node-${link.sourceId}`).attr("fill-opacity", 1);
      d3.select(`#node-${link.targetId}`).attr("fill-opacity", 1);
      // the labels of the source and all targets should have opacity set to 1
      d3.select(`.label-${link.sourceId}`).attr("fill-opacity", 1);
      d3.select(`.label-${link.targetId}`).attr("fill-opacity", 1);
    }
  });

  lastClickedNode = clickedNode;
}

function createFromLinks(
  nodeLinks: Link[],
  title: string,
  rootNode: HTMLElement,
  handle: Function
) {
  rootNode.innerHTML = "";

  if (nodeLinks.length === 0) return;

  const container = document.createElement("div");
  const header = document.createElement("h3");
  header.textContent = title;
  container.appendChild(header);

  const list = document.createElement("ul");
  nodeLinks.forEach((link) => {
    const listItem = document.createElement("li");
    const linkElement = document.createElement("a");
    linkElement.href = `#node-${link.targetId}`;
    linkElement.textContent = `${link.sourceId} -> ${link.targetId}`;
    linkElement.addEventListener("click", (e) => handle(e));
    listItem.appendChild(linkElement);
    list.appendChild(listItem);
  });

  container.appendChild(list);
  rootNode.appendChild(container);
}

function createToLinks(
  nodeLinks: Link[],
  title: string,
  rootNode: HTMLElement,
  handle: Function
) {
  rootNode.innerHTML = "";

  if (nodeLinks.length === 0) return;

  const container = document.createElement("div");
  const header = document.createElement("h3");
  header.textContent = title;
  container.appendChild(header);

  const list = document.createElement("ul");
  nodeLinks.forEach((link) => {
    const listItem = document.createElement("li");
    const linkElement = document.createElement("a");
    linkElement.href = `#node-${link.sourceId}`;
    linkElement.textContent = `${link.sourceId} -> ${link.targetId}`;
    linkElement.addEventListener("click", (e) => handle(e));
    listItem.appendChild(linkElement);
    list.appendChild(listItem);
  });

  container.appendChild(list);
  rootNode.appendChild(container);
}
