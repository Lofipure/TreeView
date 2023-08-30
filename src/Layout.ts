import { first, last } from 'lodash';
import { postOrderTraverse, preOrderTraverse } from './utils';

export default class Layout {
  private __nodeWidth: number;
  private __nodeHeight: number;
  private __layoutTreeNode?: ILayoutTreeNode;
  private __nodeMap: Record<string, INode>;
  private __nodeSpace: { x: number; y: number };
  private __tiny: boolean;

  constructor(options: ILayoutOptions) {
    const { nodeSize, nodeSpace, tiny } = options;
    const [width, height] = nodeSize;
    this.__tiny = tiny;
    this.__nodeWidth = width;
    this.__nodeHeight = height;
    this.__nodeMap = {};
    this.__nodeSpace = nodeSpace;
  }

  public updateLayout(data?: ITreeNode) {
    this.__nodeMap = {};

    const layoutTreeNode = data as ILayoutTreeNode;

    this.__calcTreeNodeAttr(layoutTreeNode);

    if (this.__tiny) {
      this.__calcTinyLayout(layoutTreeNode);
    } else {
      this.__calcNativeLayout(layoutTreeNode);
    }

    this.__offsetCenterAtRoot(layoutTreeNode);

    this.__layoutTreeNode = layoutTreeNode;

    return this.__layoutTreeNode;
  }

  public toggleFold(__node: INode) {
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

  public reset() {
    if (!this.__layoutTreeNode) return;

    preOrderTraverse(this.__layoutTreeNode, (node) => {
      if (node?.__children?.length) {
        node.children = node.__children;
        node.__children = [];
        node.isFold = false;
      }
    });

    this.updateLayout(this.__layoutTreeNode);

    return this.__layoutTreeNode;
  }

  private __calcTreeNodeAttr(node: INode) {
    const calcChildAttr = (node: INode, parent?: INode) => {
      if (parent) {
        node.parent = parent;
        node.depth = parent.depth + 1;
      } else {
        node.path = '0';
        node.depth = 0;
        this.__nodeMap[node.path] = node;
      }

      if (node?.children) {
        let height = 0;
        for (let i = 0; i < node.children.length; ++i) {
          const child = node.children[i];
          child.path = node.path + `-` + `${i}`;

          this.__nodeMap[child.path] = child;
          calcChildAttr(child, node);
          height = Math.max(height, child.height + 1);
        }
        node.height = height;
      } else {
        node.height = 0;
      }
    };
    calcChildAttr(node);

    if (!this.__tiny)
      postOrderTraverse(node, (node) => {
        node.__width = node?.children?.length
          ? node.children.reduce<number>(
              (acc, child) => acc + child.__width + this.__nodeSpace.x,
              -this.__nodeSpace.x,
            )
          : this.__nodeWidth;
      });
  }

  private __calcTinyLayout(node: ILayoutTreeNode) {
    const towerPrevNode: Record<number, INode[]> = {};

    postOrderTraverse(node, (node) => {
      node.y = node.depth * (this.__nodeHeight + this.__nodeSpace.y);
      if (!towerPrevNode[node.depth]?.length) {
        towerPrevNode[node.depth] = [];
      }
      const curTowerPrevNodes = towerPrevNode[node.depth];

      const prevNode = last(curTowerPrevNodes);

      curTowerPrevNodes.push(node);

      if (prevNode) {
        node.x = prevNode.x - this.__nodeWidth - this.__nodeSpace.x;
      } else {
        node.x = 0;
      }

      if (node?.children?.length) {
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
            child.__width +
            this.__nodeSpace.x *
              (index === (node?.children?.length ?? 0) - 1 ? 0 : 1);
        });

        node.x = (first(node.children)!.x + last(node.children)!.x) / 2;
      }
    };

    layoutChildren(node, 0);
  }

  private __offsetCenterAtRoot(layoutTreeNode: ILayoutTreeNode) {
    preOrderTraverse(layoutTreeNode, (node) => {
      if (node?.parent) {
        const [offsetX, offsetY] = [layoutTreeNode.x, layoutTreeNode.y];

        preOrderTraverse(layoutTreeNode, (node) => {
          if (node?.parent) {
            node.x -= offsetX;
            node.y -= offsetY;
          } else {
            node.x = 0;
            node.y = 0;
          }
        });
      }
    });
  }
}
