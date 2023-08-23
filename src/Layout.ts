export default class Layout {
  private __nodeSize: [number, number];
  private __layoutTreeNode?: ILayoutTreeNode;
  private __nodeMap: Record<string, ILayoutTreeNode>;
  private __nodeSpace: { x: number; y: number };
  private __detailStartTower: number;

  constructor(options: ILayoutOptions) {
    const { nodeSize, nodeSpace } = options;
    this.__nodeSize = nodeSize;
    this.__nodeMap = {};
    this.__nodeSpace = nodeSpace;
    // this.__detailStartTower = Number.MAX_SAFE_INTEGER;
    this.__detailStartTower = 3;
  }

  public updateLayout(data?: ITreeNode) {
    this.__nodeMap = {};

    const layoutTreeNode = data as ILayoutTreeNode;

    this.__updateChildTowerCnt(layoutTreeNode);

    this.__initialStructWidth(layoutTreeNode);

    this.__initialLayout(layoutTreeNode);

    this.__initialOffset(layoutTreeNode);

    this.__layoutTreeNode = layoutTreeNode;

    return this.__layoutTreeNode;
  }

  private __updateChildTowerCnt(node: ILayoutTreeNode) {
    if (node?.children) {
      let childTowerCnt = 0;
      for (const child of node.children) {
        this.__updateChildTowerCnt(child);
        childTowerCnt = Math.max(childTowerCnt, child.childTowerCnt + 1);
      }
      node.childTowerCnt = childTowerCnt;
    } else {
      node.childTowerCnt = 0;
    }
  }

  private __initialStructWidth(layoutTreeNode: ILayoutTreeNode) {
    const [width, height] = this.__nodeSize;

    layoutTreeNode.width = width;
    layoutTreeNode.height = height;
    layoutTreeNode.path = '0';
    layoutTreeNode.tower = 1;
    layoutTreeNode.isDetailNode =
      layoutTreeNode.tower > this.__detailStartTower;

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
        node.isDetailNode = node.tower > this.__detailStartTower;

        this.__nodeMap[node.path] = node;
        const structedWidth = node?.children?.length
          ? getStructedWidth(node.children, node)
          : width;
        node.structedWidth = structedWidth;

        result += structedWidth;
      }
      if (parent.tower >= this.__detailStartTower) {
        return parent.width + (parent.childTowerCnt * parent.width) / 4;
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
    layoutTreeNode.y = 0;
    layoutTreeNode.structedBottom = layoutTreeNode.height / 2;

    const dfs = (node: ILayoutTreeNode) => {
      if (!node?.children) return;
      const [benchX, benchY] = [node.x, node.y];

      if (node.tower >= this.__detailStartTower) {
        for (let i = 0; i < node.children?.length; ++i) {
          const child = node.children[i];
          child.x = node.x + child.width / 4;

          if (i === 0) {
            child.y =
              node.structedBottom + this.__nodeSpace.y + child.height / 2;
          } else {
            child.y =
              node.children[i - 1].structedBottom +
              this.__nodeSpace.y +
              child.height / 2;
          }
          child.structedBottom = child.y + child.height / 2;

          for (let j = 0; j < (child?.children?.length ?? 0); ++j) {
            if (!child?.children) continue;
            const curChild = child.children[j];
            curChild.x = child.x + curChild.width / 4;
            if (j === 0) {
              curChild.y =
                child.structedBottom + this.__nodeSpace.y + curChild.height / 2;
            } else {
              curChild.y =
                child.children[j - 1].structedBottom +
                this.__nodeSpace.y +
                curChild.height / 2;
            }
            curChild.structedBottom = curChild.y + curChild.height / 2;
          }
          dfs(child);

          node.structedBottom = Math.max(
            node.structedBottom,
            child.structedBottom,
          );
        }

        return;
      }

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

          node.children[i].structedBottom = prevY + node.children[i].height / 2;
          node.children[j].structedBottom = nextY + node.children[j].height / 2;

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

          node.children[i].structedBottom = prevY + node.children[i].height / 2;
          node.children[j].structedBottom = nextY + node.children[j].height / 2;

          dfs(node.children[i]);
          dfs(node.children[j]);
        }
      }
    };

    dfs(layoutTreeNode);
  }

  private __initialOffset(layoutTreeNode: ILayoutTreeNode) {
    const translateNodeX = (node: ILayoutTreeNode, offset: number) => {
      if (node?.tower >= this.__detailStartTower) {
        return;
      }
      node.x += offset;
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
