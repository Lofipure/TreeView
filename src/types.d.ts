import { ReactNode, RefObject } from 'react';

declare global {
  interface IPosition {
    x: number;
    y: number;
  }
  interface IRenderOptions {
    nodeSize: [number, number];
    folderRender: ITreeViewProps['folderRender'];
    nodeRender: ITreeViewProps['nodeRender'];
    config: ITreeViewProps['config'];
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
    tiny?: boolean;
    nodeSpace?: IPosition;
    nodeRender?: (node: INode) => ReactNode;
    config?: {
      allowWheelZoom?: boolean;
      allowDblClickZoom?: boolean;
      autoFixInitial?: boolean;
    };
  }

  interface ITreeViewHandler {
    fullScreen: () => void;
    wrapRef: RefObject<HTMLDivElement>;
  }

  interface ILayoutOptions {
    tiny: boolean;
    detailStartTower: ITreeViewProps[detailStartTower];
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
    path: string;
    structedWidth: number;
    structedBottom: number;
    parent?: ILayoutTreeNode;
    children?: Array<ILayoutTreeNode>;
    isFold?: boolean; // 是折叠状态吗？
    offset?: number;
    height: number;
    depth: number;
    __children?: Array<ILayoutTreeNode>;
    boxBound: IBound;
  }

  type INode = ILayoutTreeNode;
  type ILink = {
    target: INode;
    source: INode;
  };

  interface IBound {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  interface ITransform {
    x: number;
    y: number;
    k: number;
  }
}
