export default class Layout {
  private __nodeSize: [number, number];
  private __layoutTreeNode?: ILayoutTreeNode;
  private __nodeMap: Record<string, ILayoutTreeNode>;
  private __nodeSpace: { x: number; y: number };

  constructor(options: ILayoutOptions) {
    const { nodeSize, nodeSpace } = options;
    this.__nodeSize = nodeSize;
    this.__nodeMap = {};
    this.__nodeSpace = nodeSpace;
  }

  public updateLayout(data?: ITreeNode) {
    this.__nodeMap = {};

    const layoutTreeNode = data as ILayoutTreeNode;

    this.__initialStructWidth(layoutTreeNode);

    this.__initialLayout(layoutTreeNode);

    this.__initialOffset(layoutTreeNode);

    this.__layoutTreeNode = layoutTreeNode;

    return this.__layoutTreeNode;
  }

  private __initialStructWidth(layoutTreeNode: ILayoutTreeNode) {
    const [width, height] = this.__nodeSize;

    layoutTreeNode.width = width;
    layoutTreeNode.height = height;
    layoutTreeNode.path = '0';
    layoutTreeNode.tower = 1;

    this.__nodeMap[layoutTreeNode.path] = layoutTreeNode;

    const getStructedWidth = (
      nodeList: ILayoutTreeNode[],
      parent: ILayoutTreeNode,
    ): number => {
      let result = 0;
      for (let i = 0; i < nodeList?.length; ++i) {
        const node = nodeList[i];
        node.width = width;
        node.parent = parent;
        node.path = parent.path + `-${i}`;
        node.height = height;
        node.tower = node.path.split('-').length;

        this.__nodeMap[node.path] = node;
        const structedWidth = node?.children?.length
          ? getStructedWidth(node.children, node)
          : width;
        node.structedWidth = structedWidth;

        result += structedWidth;
      }
      return result + (nodeList.length - 1) * this.__nodeSpace.x;
    };

    if (layoutTreeNode?.children) {
      const structedWidth = getStructedWidth(
        layoutTreeNode.children,
        layoutTreeNode,
      );
      layoutTreeNode.structedWidth = structedWidth;
    } else {
      layoutTreeNode.structedWidth = width;
    }

    layoutTreeNode.width = width;
  }

  private __initialLayout(layoutTreeNode: ILayoutTreeNode) {
    layoutTreeNode.x = 0;
    layoutTreeNode.originX = 0;
    layoutTreeNode.y = 0;
    layoutTreeNode.originY = 0;

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
            const prevX =
                benchX - this.__nodeSpace.x / 2 - prev.structedWidth / 2,
              nextX = benchX + this.__nodeSpace.x / 2 + next.structedWidth / 2;
            prev.x = prevX;
            next.x = nextX;

            prev.originX = prevX;
            next.originX = nextX;
          } else {
            const prevBench = node.children[i + 1],
              nextBench = node.children[j - 1];

            const prevX =
                prevBench.x -
                prevBench.structedWidth / 2 -
                this.__nodeSpace.x -
                prev.structedWidth / 2,
              nextX =
                nextBench.x +
                nextBench.structedWidth / 2 +
                this.__nodeSpace.x +
                next.structedWidth / 2;

            prev.x = prevX;
            next.x = nextX;

            prev.originX = prevX;
            next.originX = nextX;
          }

          const prevY =
              benchY +
              node.height / 2 +
              this.__nodeSpace.y +
              node.children[i].height,
            nextY =
              benchY +
              node.height / 2 +
              this.__nodeSpace.y +
              node.children[j].height;
          node.children[i].y = prevY;
          node.children[j].y = nextY;

          node.children[i].originY = prevY;
          node.children[j].originY = nextY;

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
            node.children[i].originX = benchX;
          } else {
            const prev = node.children[i],
              prevBench = node.children[i + 1];
            const next = node.children[j],
              nextBench = node.children[j - 1];

            const prevX =
                prevBench.x -
                prevBench.structedWidth / 2 -
                this.__nodeSpace.x -
                prev.structedWidth / 2,
              nextX =
                nextBench.x +
                nextBench.structedWidth / 2 +
                this.__nodeSpace.x +
                next.structedWidth / 2;

            prev.x = prevX;
            next.x = nextX;

            prev.originX = prevX;
            next.originX = nextX;
          }

          const prevY =
              benchY +
              node.height / 2 +
              this.__nodeSpace.y +
              node.children[i].height,
            nextY =
              benchY +
              node.height / 2 +
              this.__nodeSpace.y +
              node.children[j].height;
          node.children[i].y = prevY;
          node.children[j].y = nextY;

          node.children[i].originY = prevY;
          node.children[j].originY = nextY;

          dfs(node.children[i]);
          dfs(node.children[j]);
        }
      }
    };

    dfs(layoutTreeNode);
  }

  private __initialOffset(layoutTreeNode: ILayoutTreeNode) {
    const translateNodeX = (node: ILayoutTreeNode, offset: number) => {
      node.x += offset;
      node.originX += offset;
      node.children?.forEach((item) => translateNodeX(item, offset));
    };

    const dfs = (node: ILayoutTreeNode) => {
      const { left, right } = (node?.children ?? [])?.reduce<{
        left: number;
        right: number;
      }>(
        (offset, curNode) => {
          offset.left = Math.min(
            offset.left,
            curNode.x - curNode.structedWidth / 2,
          );
          offset.right = Math.max(
            offset.right,
            curNode.x + curNode.structedWidth / 2,
          );
          return offset;
        },
        {
          left: node.x - node.width / 2,
          right: node.x + node.width / 2,
        },
      );
      const offset = node.x - (left + right) / 2;

      node.offset = offset;
      if (offset !== 0) {
        translateNodeX(node, offset);
      }

      node.children?.forEach((item) => dfs(item));
    };

    layoutTreeNode.children?.forEach((item) => dfs(item));
  }

  public get treeNode() {
    return this.__layoutTreeNode;
  }

  public toggleFold(__node: ILayoutTreeNode) {
    const node = this.__nodeMap?.[__node.path];
    if (!node) return;

    if (node?.children?.length) {
      node.__children = node.children;
      node.children = [];
      node.isFold = true;
    } else {
      node.children = node.__children;
      node.__children = [];
      node.isFold = false;
    }
    this.updateLayout(this.__layoutTreeNode);

    return this.__layoutTreeNode;
  }
}
