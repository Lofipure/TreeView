import { ReactNode } from 'react';
import Layout from './Layout';

declare global {
  interface IPosition {
    x: number;
    y: number;
  }
  interface IRenderOptions {
    layoutInstance: Layout;
    folderRender: ITreeViewProps['folderRender'];
    nodeRender: ITreeViewProps['nodeRender'];
  }
  interface ITreeViewProps {
    data: ITreeNode;
    nodeSize: [number, number];
    folderRender?: {
      render: (node: INode) => ReactNode;
      size: {
        width: number;
        height: number;
      };
    };
    nodeSpace?: IPosition;
    nodeRender?: (node: INode) => ReactNode;
  }

  interface ILayoutOptions {
    data: ITreeNode;
    nodeSize: [number, number];
    nodeSpace: IPosition;
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
