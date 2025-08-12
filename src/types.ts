export interface RequestBody {
  filePath: string;
}

export interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  depth: number;
  isRoot: boolean;
  filePath: string;
}

export interface Link extends d3.SimulationLinkDatum<Node> {
  sourceId: string;
  targetId: string;
}

export interface D3ForceTree {
  nodes: Node[];
  links: Link[];
}
