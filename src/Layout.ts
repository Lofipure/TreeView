import { cloneDeep } from 'lodash';
import { NODE_SPACE } from './config';

export default class Layout {
  private __data: ITreeNode;
  private __nodeSize: [number, number];
  private __layoutTreeNode: ILayoutTreeNode;

  constructor(options: ILayoutOptions) {
    const { data, nodeSize } = options;
    this.__data = data;
    this.__nodeSize = nodeSize;
    this.__layoutTreeNode = this.__initial();
  }

  private __initial() {
    const layoutTreeNode = cloneDeep(this.__data) as ILayoutTreeNode;

    this.__initialStructWidth(layoutTreeNode);

    this.__initialLayout(layoutTreeNode);

    return layoutTreeNode;
  }

  private __initialStructWidth(layoutTreeNode: ILayoutTreeNode) {
    const [width, height] = this.__nodeSize;

    layoutTreeNode.width = width;
    layoutTreeNode.height = height;

    const dfs = (
      nodeList: ILayoutTreeNode[],
      parent: ILayoutTreeNode,
    ): number => {
      let result = 0;
      for (let i = 0; i < nodeList?.length; ++i) {
        const node = nodeList[i];
        node.width = width;
        node.parent = parent;
        const structedWidth = node?.children?.length
          ? dfs(node.children, node)
          : width;
        node.structedWidth = structedWidth;
        node.width = width;
        node.height = height;

        result += structedWidth;
      }
      return result + (nodeList.length - 1) * NODE_SPACE.x;
    };

    if (layoutTreeNode?.children) {
      const structedWidth = dfs(layoutTreeNode.children, layoutTreeNode);
      layoutTreeNode.structedWidth = structedWidth;
    } else {
      layoutTreeNode.structedWidth = width;
    }

    layoutTreeNode.width = width;
  }

  private __initialLayout(layoutTreeNode: ILayoutTreeNode) {
    layoutTreeNode.x = 0;
    layoutTreeNode.y = 0;

    const dfs = (node: ILayoutTreeNode) => {
      if (!node?.children) return;
      const [benchX, benchY] = [node.x, node.y];

      if (node.children.length % 2 === 0) {
        for (
          let i = node.children.length / 2 - 1, j = node.children.length / 2;
          i >= 0 && j < node.children.length;
          --i, ++j
        ) {
          const prev = node.children[i],
            next = node.children[j];
          if (
            i === node.children.length / 2 - 1 &&
            j === node.children.length / 2
          ) {
            prev.x = benchX - NODE_SPACE.x / 2 - prev.structedWidth / 2;
            next.x = benchX + NODE_SPACE.x / 2 + next.structedWidth / 2;
          } else {
            const prevBench = node.children[i + 1],
              nextBench = node.children[j - 1];

            prev.x =
              prevBench.x -
              prevBench.structedWidth / 2 -
              NODE_SPACE.x -
              prev.structedWidth / 2;
            next.x =
              nextBench.x +
              nextBench.structedWidth / 2 +
              NODE_SPACE.x +
              next.structedWidth / 2;
          }

          node.children[i].y =
            benchY + node.height / 2 + NODE_SPACE.y + node.children[i].height;
          node.children[j].y =
            benchY + node.height / 2 + NODE_SPACE.y + node.children[j].height;

          dfs(prev);
          dfs(next);
        }
      } else {
        for (
          let i = Math.floor(node.children.length / 2),
            j = Math.floor(node.children.length / 2);
          i >= 0 && j < node.children.length;
          --i, ++j
        ) {
          if (i === j) {
            node.children[i].x = benchX;
          } else {
            const prev = node.children[i],
              prevBench = node.children[i + 1];
            const next = node.children[j],
              nextBench = node.children[j - 1];

            prev.x =
              prevBench.x -
              prevBench.structedWidth / 2 -
              NODE_SPACE.x -
              prev.structedWidth / 2;
            next.x =
              nextBench.x +
              nextBench.structedWidth / 2 +
              NODE_SPACE.x +
              next.structedWidth / 2;
          }

          node.children[i].y =
            benchY + node.height / 2 + NODE_SPACE.y + node.children[i].height;
          node.children[j].y =
            benchY + node.height / 2 + NODE_SPACE.y + node.children[j].height;

          dfs(node.children[i]);
          dfs(node.children[j]);
        }
      }
    };

    dfs(layoutTreeNode);
  }

  public get treeNode() {
    return this.__layoutTreeNode;
  }

  public get drawDepObj() {
    const nodeList: INode[] = [],
      linkList: ILink[] = [];

    const dfs = (node: ILayoutTreeNode) => {
      nodeList.push(node);
      if (node?.children) {
        for (let i = 0; i < node.children.length; ++i) {
          linkList.push({
            source: node,
            target: node.children[i],
          });
          dfs(node.children[i]);
        }
      }
    };

    dfs(this.__layoutTreeNode);

    return { nodeList, linkList };
  }
}
