import { first, last } from 'lodash';
import { postOrderTraverse, preOrderTraverse } from './utils';
export default class Layout {
  private __nodeWidth: number;
  private __nodeHeight: number;
  private __layoutTreeNode?: ILayoutTreeNode;
  private __nodeMap: Record<string, ILayoutTreeNode>;
  private __nodeSpace: { x: number; y: number };
  private __detailStartTower: number;
  private __tiny: boolean;

  constructor(options: ILayoutOptions) {
    const { nodeSize, nodeSpace, detailStartTower, tiny } = options;
    const [width, height] = nodeSize;
    this.__tiny = tiny;
    this.__nodeWidth = width;
    this.__nodeHeight = height;
    this.__nodeMap = {};
    this.__nodeSpace = nodeSpace;
    this.__detailStartTower = detailStartTower || Number.MAX_SAFE_INTEGER;
  }

  public updateLayout(data?: ITreeNode) {
    this.__nodeMap = {};

    const layoutTreeNode = data as ILayoutTreeNode;

    this.__calcDepthAndHeight(layoutTreeNode);
    this.__initialStructWidth(layoutTreeNode);

    if (this.__tiny) {
      this.__calcTinyLayout(layoutTreeNode);
    } else {
      this.__calcNativeLayout(layoutTreeNode);
    }

    this.__layoutTreeNode = layoutTreeNode;

    return this.__layoutTreeNode;
  }

  private __calcDepthAndHeight(node: ILayoutTreeNode) {
    const calcChildAttr = (node: ILayoutTreeNode, parentDepth: number) => {
      node.depth = parentDepth + 1;

      if (node?.children) {
        let height = 0;
        for (let i = 0; i < node.children.length; ++i) {
          const child = node.children[i];
          child.path = node.path + `-`;
          calcChildAttr(child, node.depth);
          height = Math.max(height, child.height + 1);
        }
        node.height = height;
      } else {
        node.height = 0;
      }
    };

    calcChildAttr(node, -1);
  }

  private __calcTinyLayout(node: ILayoutTreeNode) {
    const towerPrevNode: Record<number, INode[]> = {};

    postOrderTraverse(node, (node) => {
      node.y = node.depth * (this.__nodeHeight + this.__nodeSpace.y);
      if (!towerPrevNode[node.depth]?.length) {
        towerPrevNode[node.depth] = [];
      }
      const curTowerPrevNode = towerPrevNode[node.depth];

      const prevNode = last(curTowerPrevNode);

      curTowerPrevNode.push(node);

      if (prevNode) {
        node.x = prevNode.x - this.__nodeWidth - this.__nodeSpace.x;
      } else {
        node.x = 0;
      }

      if (node?.children?.length) {
        // 为了不覆盖已经遍历好的节点，这里不能无脑设center，需要判断一下：
        // 1. 如果 centerX > node.x 的话，就可以无脑设 center
        // 2. 否则就需要计算偏移量 offset = node.x - centerX; 然后把 node下面所有的子节点整体偏移 offset
        const centerX =
          node.children.reduce<number>((acc, child) => acc + child.x, 0) /
          node.children.length;

        if (node.x >= centerX) {
          node.x += centerX - node.x;
        } else {
          preOrderTraverse(node, (child) => {
            if (child.path !== node.path) {
              child.x += node.x - centerX;
            }
          });
        }
      }
    });
  }

  private __calcNativeLayout(node: ILayoutTreeNode) {
    const layoutChildren = (node: INode, offsetX: number) => {
      node.y = node.depth * (this.__nodeHeight + this.__nodeSpace.y);
      if (!node?.children?.length) {
        node.x = offsetX;
      } else {
        let totalOffset = offsetX;
        node.children?.forEach((child, index) => {
          layoutChildren(child, totalOffset);
          totalOffset +=
            child.structedWidth +
            this.__nodeSpace.x *
              (index === (node?.children?.length ?? 0) - 1 ? 0 : 1);
        });

        node.x = (first(node.children)!.x + last(node.children)!.x) / 2;
      }
    };

    layoutChildren(node, 0);
  }

  private __initialStructWidth(layoutTreeNode: ILayoutTreeNode) {
    layoutTreeNode.path = '0';

    this.__nodeMap[layoutTreeNode.path] = layoutTreeNode;

    const getStructedWidth = (
      nodeList: ILayoutTreeNode[],
      parent: ILayoutTreeNode,
    ): number => {
      let result = 0;
      for (let i = 0; i < nodeList?.length; ++i) {
        const node = nodeList[i];
        node.parent = parent;
        node.path = parent.path + `-${i}`;

        this.__nodeMap[node.path] = node;
        const structedWidth = node?.children?.length
          ? getStructedWidth(node.children, node)
          : this.__nodeWidth;
        node.structedWidth = structedWidth;

        result += structedWidth;
      }
      if (parent.depth >= this.__detailStartTower) {
        return this.__nodeWidth + (parent.height * this.__nodeWidth) / 4;
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
      layoutTreeNode.structedWidth = this.__nodeWidth;
    }
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
