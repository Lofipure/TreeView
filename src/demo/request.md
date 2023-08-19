请你看一下我下面这段代码，他的功能是传入一个树形的数据结构和树中每个节点的尺寸，然后对树进行布局。
**initialStructWidth 计算了每个节点的 structedWidth，所谓 structedWidth 就是节点的所有子节点宽度的总和。
**initialLayout 则对节点进行了 X 轴方向的布局，这个是依赖 structedWidth 进行布局的。

现在有一个问题，我的**initialStructWidth 和**initialLayout 都会对树进行深度优先搜索，能不能把这两个操作放到一次深度优先搜索中处理，以节约一些性能消耗。

```typescript
import { cloneDeep } from 'lodash';
import { NODE_SPACE } from './config';

interface ITreeNode<T = Record<string, any>> {
  label: string | number;
  children?: Array<ITreeNode>;
  extra?: T;
}

interface ILayoutOptions {
  data: ITreeNode;
  nodeSize: [number, number];
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

export default class Layout {
  private __data: ITreeNode;
  private __nodeSize: [number, number];

  constructor(options: ILayoutOptions) {
    const { data, nodeSize } = options;
    this.__data = data;
    this.__nodeSize = nodeSize;

    const layoutTreeNode = this.__initial();

    console.log('[🔧 Debug 🔧]', 'layout tree node', layoutTreeNode);
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
}
```
