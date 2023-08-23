import { ReactNode, RefObject } from 'react';

declare global {
  interface IPosition {
    x: number;
    y: number;
  }
  interface IRenderOptions {
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
    nodeSpace?: IPosition;
    nodeRender?: (node: INode) => ReactNode;
    config?: {
      allowWheelZoom?: boolean;
      allowDblClickZoom?: boolean;
      autoFixInitial?: boolean;
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ITreeViewHandler {
    fullScreen: () => void;
    wrapRef: RefObject<HTMLDivElement>;
  }

  interface ILayoutOptions {
    // data: ITreeNode;
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
    // originX: number;
    // originY: number;
    path: string;
    width: number;
    isDetailNode?: boolean;
    structedWidth: number;
    structedBottom: number;
    height: number;
    parent?: ILayoutTreeNode;
    children?: Array<ILayoutTreeNode>;
    isFold?: boolean; // 是折叠状态吗？
    __children?: Array<ILayoutTreeNode>;
    tower: number;
    offset?: number;
    childTowerCnt: number;
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
