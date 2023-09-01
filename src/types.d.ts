import { CSSProperties, ReactNode, SVGAttributes } from 'react';

declare global {
  type LineStyle = Pick<
    SVGAttributes<SVGPathElement>,
    'fill' | 'fillOpacity' | 'stroke' | 'strokeWidth' | 'strokeOpacity'
  >;
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
  interface IPosition {
    x: number;
    y: number;
  }
}

declare global {
  interface IRenderOptions {
    config: ITreeViewProps['config'];
    event: ITreeViewProps['event'];
  }

  interface ILayoutOptions {
    tiny: boolean;
    nodeConfig: ITreeViewProps['config']['node'];
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
}
declare global {
  interface ITreeNode<T = Record<string, any>> {
    label: string | number;
    children?: Array<ITreeNode>;
    extra?: T;
  }

  interface ITreeViewProps {
    data: ITreeNode;
    event?: {
      onTransformChange?: (transform: ITransform) => void;
      onToggle?: (node: INode) => void;
    };
    config: {
      node: {
        render?: (node: INode) => ReactNode;
        space?: IPosition;
        size: [number, number];
      };
      toggle?: {
        controlled?: boolean;
        show?: boolean | ((node: INode) => boolean);
        size: [number, number];
        render: (node: INode) => JSX.Element;
      };
      line?: {
        style?: Partial<LineStyle> | ((link: ILink) => Partial<LinkStyle>);
      };
      tiny?: boolean;
      allowWheelZoom?: boolean;
      allowDblClickZoom?: boolean;
      autoFixInitial?: boolean;
      scaleExtent?: [number, number];
      duration?: number;
      backgroundColor?: CSSProperties['backgroundColor'];
    };
  }

  interface ITreeViewHandler {
    zoomIn: (stripe?: number) => void;
    zoomOut: (stripe?: number) => void;
    centerAt: (node: INode) => void;
    resetAsAutoFix: () => void;
    toggleNode: (node: INode) => void;
    addChildren: (param: { node: INode; children: ITreeNode[] }) => void;
  }
}
