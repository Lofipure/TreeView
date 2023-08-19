```typescript
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

export const createPath = (link: ILink) => {
  const { source, target } = link;

  return `M${source.x} ${source.y} L${target.x} ${target.y}`;
};

```
看一下这段代码，我的 createPath 返回了一个 path 可用的路径。
