import { ReactNode, RefObject, SVGAttributes } from 'react';

declare global {
  type LineStyle = Pick<
    SVGAttributes<SVGPathElement>,
    'fill' | 'fillOpacity' | 'stroke' | 'strokeWidth' | 'strokeOpacity'
  >;
  interface IPosition {
    x: number;
    y: number;
  }
  interface IRenderOptions {
    nodeSize: [number, number];
    folderRender: ITreeViewProps['folderRender'];
    nodeRender: ITreeViewProps['nodeRender'];
    config: ITreeViewProps['config'];
    event?: ITreeViewProps['event'];
  }
  interface ITreeViewProps {
    data: ITreeNode;
    nodeSize: [number, number];
    folderRender?: {
      render: (node: INode) => JSX.Element;
      size: {
        width: number;
        height: number;
      };
    };
    tiny?: boolean;
    nodeSpace?: IPosition;
    nodeRender?: (node: INode) => ReactNode;
    event?: {
      onTransformChange?: (transform: ITransform) => void;
    };
    config?: {
      allowWheelZoom?: boolean;
      allowDblClickZoom?: boolean;
      autoFixInitial?: boolean;
      lineStyle?: Partial<LineStyle>;
      scaleExtent?: [number, number];
      duration?: number;
    };
  }

  interface ITreeViewHandler {
    wrapRef: RefObject<HTMLDivElement>;
    fullScreen: () => void;
    zoomIn: (stripe?: number) => void;
    zoomOut: (stripe?: number) => void;
    centerAt: (node: INode) => void;
    resetAsAutoFix: () => void;
  }

  interface ILayoutOptions {
    tiny: boolean;
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
    parent?: ILayoutTreeNode;
    __width: number;
    children?: Array<ILayoutTreeNode>;
    __children?: Array<ILayoutTreeNode>;
    isFold?: boolean; // 是折叠状态吗？
    offset?: number;
    height: number;
    depth: number;
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

  interface IZoomTransform {
    k: number;
    x: number;
    y: number;
  }
}
