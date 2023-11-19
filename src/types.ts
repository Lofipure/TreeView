import { CSSProperties, RefObject, SVGAttributes } from 'react';
import { getElementSize } from './utils';

export type LineStyle = Pick<
  SVGAttributes<SVGPathElement>,
  'fill' | 'fillOpacity' | 'stroke' | 'strokeWidth' | 'strokeOpacity'
>;
export type INode = ILayoutTreeNode;

export type RenderedInfo = Awaited<ReturnType<typeof getElementSize>>;
export type Size = {
  width: number;
  height: number;
};

export type ILink = {
  target: INode;
  source: INode;
};
export interface IBound {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ITransform {
  x: number;
  y: number;
  k: number;
}

export interface IZoomTransform {
  k: number;
  x: number;
  y: number;
}
export interface IPosition {
  x: number;
  y: number;
}

export interface IRenderOptions {
  config: ITreeViewProps['config'];
  event: ITreeViewProps['event'];
  method: ITreeViewProps['method'];
}

export interface ILayoutOptions {
  tiny: boolean;
  nodeConfig: ITreeViewProps['config']['node'];
  wrapRef: RefObject<HTMLDivElement>;
}

export interface ILayoutTreeNode extends ITreeNode {
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
  size: Size;
}

export interface ITreeNode<T = Record<string, any>> {
  label: string | number;
  children?: Array<ITreeNode>;
  extra?: T;
}

export interface ITreeViewProps {
  data: ITreeNode;
  method?: {
    hideLink: (param: {
      source: Pick<INode, 'path'>;
      target: Pick<INode, 'path'>;
    }) => boolean;
  };
  event?: {
    onTransformChange?: (transform: ITransform) => void;
    onToggle?: (node: INode) => void;
  };
  config: {
    node: {
      render?: (node: INode) => JSX.Element;
      space?: IPosition;
      subTreeGap?: number;
      /**
       * @description {[number, number]} 如果传了 node.render 的话，这里就是 [minWidth, minHeight]，否则就是 [width, height]
       */
      size: [number, number];
    };
    toggle?: {
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

export interface ITreeViewHandler {
  zoomIn: (stripe?: number) => void;
  zoomOut: (stripe?: number) => void;
  centerAt: (node: INode) => void;
  resetAsAutoFix: () => void;
  toggleNode: (node: INode) => void;

  addChildren: (node: INode, children: ITreeNode[]) => Promise<void>;
}
