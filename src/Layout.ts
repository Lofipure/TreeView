import { first, last } from 'lodash';
import { RefObject } from 'react';
import { NODE_SPACE } from './config';
import {
  ILayoutOptions,
  ILayoutTreeNode,
  INode,
  ITreeNode,
  RenderedInfo,
} from './types';
import { getElementSize, postOrderTraverse, preOrderTraverse } from './utils';

export default class Layout {
  private __nodeWidth: number;
  private __nodeHeight: number;
  private __layoutTreeNode?: ILayoutTreeNode;
  private __nodeMap: Record<string, INode>;
  private __renderNodeMap: Record<string, RenderedInfo>;
  private __nodeSpace: { x: number; y: number };
  private __tiny: boolean;
  private __subTreeGap: number;
  private __nodeRender?: (node: INode) => JSX.Element;
  private __wrapRef: RefObject<HTMLDivElement>;

  constructor(options: ILayoutOptions) {
    const { nodeConfig, tiny, wrapRef } = options;
    const [width, height] = nodeConfig?.size;
    this.__tiny = tiny;
    this.__nodeWidth = width;
    this.__nodeHeight = height;
    this.__nodeMap = {};
    this.__renderNodeMap = {};
    this.__nodeSpace = nodeConfig?.space ?? NODE_SPACE;
    this.__subTreeGap = nodeConfig?.subTreeGap ?? 1;
    this.__wrapRef = wrapRef;
    this.__nodeRender = nodeConfig?.render;
  }

  public async updateLayout(data?: ITreeNode) {
    this.__nodeMap = {};

    const layoutTreeNode = data as ILayoutTreeNode;

    const renderedMap = await this.__calcTreeNodeAttr(layoutTreeNode);

    if (this.__tiny) {
      this.__calcTinyLayout(layoutTreeNode);
    } else {
      this.__calcNativeLayout(layoutTreeNode);
    }

    this.__offsetCenterAtRoot(layoutTreeNode);

    this.__layoutTreeNode = layoutTreeNode;

    return {
      layout: this.__layoutTreeNode,
      renderedMap,
    };
  }

  public async toggleFold(__node: INode) {
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

    const { renderedMap } = await this.updateLayout(this.__layoutTreeNode);

    return {
      layout: this.__layoutTreeNode,
      renderedMap,
    };
  }

  public async reset() {
    if (!this.__layoutTreeNode) return;

    preOrderTraverse(this.__layoutTreeNode, (node) => {
      if (node?.__children?.length) {
        node.children = node.__children;
        node.__children = [];
        node.isFold = false;
      }
    });

    const { renderedMap } = await this.updateLayout(this.__layoutTreeNode);

    return {
      layout: this.__layoutTreeNode,
      renderedMap,
    };
  }
  private async __calcTreeNodeAttr(node: INode) {
    const calcChildAttr = async (node: INode, parent?: INode) => {
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
          child.path = `${node.path}-` + `${i}`;

          this.__nodeMap[child.path] = child;
          calcChildAttr(child, node);
          height = Math.max(height, child.height + 1);
        }
        node.height = height;
      } else {
        node.height = 0;
      }

      if (this.__renderNodeMap?.[node.path]) return;

      if (this.__nodeRender) {
        const { width, height, rendered } = await getElementSize(
          this.__nodeRender(node),
          this.__wrapRef?.current,
        );

        if (rendered) {
          this.__renderNodeMap[node.path] = {
            width,
            height,
            rendered,
          };
        }

        node.size = {
          width: Math.max(width, this.__nodeWidth),
          height: Math.max(height, this.__nodeHeight),
        };
      } else {
        node.size = {
          height: this.__nodeHeight,
          width: this.__nodeWidth,
        };
      }
    };

    await calcChildAttr(node);

    if (!this.__tiny) {
      postOrderTraverse(node, (node) => {
        node.__width = node?.children?.length
          ? node.children.reduce<number>(
              (acc, child) => acc + child.__width + this.__nodeSpace.x,
              -this.__nodeSpace.x,
            )
          : node.size.width;
      });
    }

    return this.__renderNodeMap;
  }

  private __calcTinyLayout(node: ILayoutTreeNode) {
    const towerPrevNode: Record<number, INode[]> = {};

    postOrderTraverse(node, (node) => {
      node.y = node.depth * (node.size.height + this.__nodeSpace.y);
      if (!towerPrevNode[node.depth]?.length) {
        towerPrevNode[node.depth] = [];
      }
      const curTowerPrevNodes = towerPrevNode[node.depth];

      const prevNode = last(curTowerPrevNodes);
      const prevDepNode = curTowerPrevNodes[curTowerPrevNodes?.length - 2];

      curTowerPrevNodes.push(node);

      if (prevNode) {
        node.x =
          prevNode.x -
          prevNode.size.width / 2 -
          node.size.width / 2 -
          this.__nodeSpace.x;
      } else {
        node.x = 0;
      }

      if (prevNode?.parent !== node.parent && prevNode) {
        node.x -= this.__subTreeGap;
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

      if (
        prevDepNode &&
        !prevNode?.children &&
        prevNode &&
        prevDepNode?.children &&
        node?.children
      ) {
        prevNode.x = (prevDepNode.x + node.x) / 2;
      }
    });
  }

  private __calcNativeLayout(node: ILayoutTreeNode) {
    const layoutChildren = (node: INode, offsetX: number) => {
      node.y = node.depth * (node.size.height + this.__nodeSpace.y);
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
