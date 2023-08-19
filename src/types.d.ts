import { ReactNode } from 'react';
import Layout from './Layout';

declare global {
  interface IRenderOptions {
    layoutInstance: Layout;
    nodeRender: ITreeViewProps['nodeRender'];
    folderRender: ITreeViewProps['folderRender'];
  }
  interface ITreeViewProps {
    data: ITreeNode;
    nodeSize: [number, number];
    nodeRender?: (node: INode) => ReactNode;
    folderRender?: {
      render: (node: INode) => ReactNode;
      size: {
        width: number;
        height: number;
      };
    };
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
    originX: number;
    originY: number;
    path: string;
    width: number;
    structedWidth: number;
    height: number;
    parent?: ILayoutTreeNode;
    children?: Array<ILayoutTreeNode>;
    isFold?: boolean; // 是折叠状态吗？
    __children?: Array<ILayoutTreeNode>;
  }

  type INode = ILayoutTreeNode;
  type ILink = {
    target: INode;
    source: INode;
  };
}
