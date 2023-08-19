interface ITreeViewProps {
  data: ITreeNode;
  nodeSize: [number, number];
}

interface ILayoutOptions {
  data: ITreeNode;
  nodeSize: [number, number];
}

interface ITreeNode<T = Record<string, any>> {
  label: string | number;
  children?: Array<ITreeNode>;
  extra?: T;
}

interface ILayoutTreeNode extends ITreeNode {
  x: number;
  y: number;
  width: number;
  structedWidth: number;
  height: number;
  parent?: ILayoutTreeNode;
  children?: Array<ILayoutTreeNode>;
}

type INode = ILayoutTreeNode;
type ILink = {
  target: INode;
  source: INode;
};
