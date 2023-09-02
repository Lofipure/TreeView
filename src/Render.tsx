import { select, Selection } from 'd3-selection';
import { transition } from 'd3-transition';
import { zoom, zoomIdentity } from 'd3-zoom';
import { uniqueId } from 'lodash';
import React, { createRef, ReactNode, RefObject } from 'react';
import ReactDOM from 'react-dom';
import {
  DEFAULT_BACKGROUND,
  DEFAULT_DURATION,
  DEFAULT_SCALE_EXTENT,
  DEFAULT_STRIPE,
} from './config';
import {
  IBound,
  ILayoutTreeNode,
  ILink,
  INode,
  IPosition,
  IRenderOptions,
  ITransform,
  IZoomTransform,
  LineStyle,
} from './types';
import { createLinkId, createTowerRadiusPath } from './utils';

export default class Render {
  private __nodeEleMap: Record<string, RefObject<SVGForeignObjectElement>>;
  private __linkEleMap: Record<string, RefObject<SVGPathElement>>;
  private __linkGEleMap: Record<string, RefObject<SVGGElement>>;
  private __toggleWrapMap: Record<string, RefObject<HTMLDivElement>>;
  private __linkMap: Record<string, ILink>;
  private __nodeMap: Record<string, INode>;
  private __hiddenNodeList: INode[];
  private __svgSelection?: Selection<SVGSVGElement, unknown, null, undefined>;
  private __svgGSelection?: Selection<SVGGElement, unknown, null, undefined>;
  private __root?: SVGGElement;
  private __rootNode?: ILayoutTreeNode;
  private __toggleConfig: IRenderOptions['config']['toggle'];
  private __config: IRenderOptions['config'];
  private __nodeWidth: number;
  private __nodeHeight: number;
  private __currentTransform: IZoomTransform;
  private __scaleExtent: [number, number];
  private __duration: number;
  private __nodeToggleCb?: (node: INode) => void;
  private __transformChange?: (transform: ITransform) => void;
  private __nodeRender?: (node: INode) => ReactNode;

  constructor(options: IRenderOptions) {
    const [width, height] = options.config.node.size;
    this.__nodeWidth = width;
    this.__nodeHeight = height;
    this.__nodeEleMap = {};
    this.__linkEleMap = {};
    this.__toggleWrapMap = {};
    this.__linkMap = {};
    this.__nodeMap = {};
    this.__linkGEleMap = {};
    this.__hiddenNodeList = [];
    this.__toggleConfig = options.config.toggle;
    this.__config = options.config;
    this.__currentTransform = zoomIdentity;
    this.__scaleExtent = options.config?.scaleExtent ?? DEFAULT_SCALE_EXTENT;
    this.__duration = options.config?.duration ?? DEFAULT_DURATION;
    this.__nodeRender = options.config.node?.render;
    this.__transformChange = options.event?.onTransformChange;
  }

  public render(params: {
    wrap: HTMLDivElement;
    rootNode: ILayoutTreeNode;
    onToggle: (node: INode) => void;
  }) {
    this.__nodeEleMap = {};
    this.__linkEleMap = {};
    this.__toggleWrapMap = {};
    this.__linkMap = {};
    this.__nodeMap = {};
    this.__linkGEleMap = {};
    this.__hiddenNodeList = [];
    this.__rootNode = params.rootNode;

    this.__nodeToggleCb = params.onToggle;

    if (!this.__svgGSelection || !this.__svgSelection) {
      params.wrap.childNodes.forEach((node) => node.remove());
      this.__svgSelection = select(params.wrap).append('svg');
      this.__svgGSelection = this.__svgSelection.append('g');

      this.__svgSelection?.attr('class', 'tree-view__svg');
      this.__svgGSelection?.attr('class', 'tree-view__g');

      this.__svgSelection?.style(
        'background-color',
        this.__config?.backgroundColor ?? DEFAULT_BACKGROUND,
      );
      this.__bindZoom();

      this.__root = this.__svgGSelection.node()!;
    }

    const { linkList, nodeList } = this.__getDrawDepObj(params.rootNode);

    if (this.__root) {
      ReactDOM.render(
        <>
          {linkList.reverse().map((link) => this.__getRenderLinkAtom(link))}
          {nodeList.reverse().map((node) => this.__getRenderNodeAtom(node))}
        </>,
        this.__root,
      );
    }

    if (this.__config?.autoFixInitial) {
      this.__autoFixLayout();
    }
  }

  public reset(node: ILayoutTreeNode) {
    this.__rootNode = node;
    const { nodeList, linkList } = this.__getDrawDepObj(node);

    nodeList.forEach((node) => {
      this.__translateNode(node);
    });

    linkList.forEach((link) => {
      this.__translateLink(link);
    });

    nodeList.forEach((node) => {
      this.__updateNodeToggle(node);
    });

    this.__hiddenNodeList = [];

    this.__autoFixLayout();
  }

  public toggleFold(param: {
    layoutTreeNode?: ILayoutTreeNode;
    toggleNode: INode;
  }) {
    const { layoutTreeNode, toggleNode } = param;
    if (!layoutTreeNode) return;

    const { nodeList, linkList } = this.__getDrawDepObj(layoutTreeNode);

    this.__hiddenNodeList = [];

    nodeList.forEach((node) => {
      this.__translateNode(node);
      if (node?.__children?.length) {
        this.__hiddenChildren(node, { x: node.x, y: node.y });
      }
    });

    linkList.forEach((link) => {
      this.__translateLink(link);
    });

    transition().on('end', () => {
      this.__updateNodeToggle(toggleNode);
      this.__hiddenNodeList.forEach((node) => {
        select(this.__nodeEleMap[node.path].current).style('display', 'none');
      });
    });
  }

  public zoom(type: 'zoomIn' | 'zoomOut', __stripe?: number) {
    const stripe = __stripe ?? DEFAULT_STRIPE;
    const k = this.__currentTransform.k + stripe * (type === 'zoomIn' ? 1 : -1);

    if (k < this.__scaleExtent[0] || k > this.__scaleExtent[1]) return;

    this.__svgGSelection
      ?.transition()
      .duration(this.__duration)
      .attr(
        'transform',
        `translate(${this.__currentTransform.x}, ${this.__currentTransform.y}) scale(${k})`,
      );

    this.__currentTransform.k = k;
    this.__transformChange?.(this.__currentTransform);
  }

  public centerAt(node: INode) {
    if (!this.__svgSelection) return;

    const { width = 0, height = 0 } =
      this.__svgSelection.node()?.getBoundingClientRect() || {};

    const { x, y } = node;
    const [targetX, targetY] = [
      width / 2 - x * this.__currentTransform.k,
      height / 2 - y * this.__currentTransform.k,
    ];

    this.__svgGSelection
      ?.transition()
      .duration(this.__duration)
      .attr(
        'transform',
        `translate(${targetX}, ${targetY}) scale(${this.__currentTransform.k})`,
      );

    this.__currentTransform.x = targetX;
    this.__currentTransform.y = targetY;
    this.__transformChange?.(this.__currentTransform);
  }

  private __autoFixLayout() {
    if (!this.__rootNode || !this.__svgGSelection || !this.__svgSelection)
      return;

    const nodeList = Object.keys(this.__nodeMap)
      .map((key) => this.__nodeMap[key])
      .filter((node) => !this.__hiddenNodeList.includes(node));

    const gBound = nodeList.reduce<IBound>(
      (bound, node) => {
        bound.top = Math.min(bound.top, node.y - this.__nodeHeight / 2);
        bound.bottom = Math.max(bound.bottom, node.y + this.__nodeHeight / 2);
        bound.left = Math.min(bound.left, node.x - this.__nodeWidth / 2);
        bound.right = Math.max(bound.right, node.x + this.__nodeWidth / 2);
        return bound;
      },
      {
        left: this.__rootNode.x - this.__nodeWidth / 2,
        right: this.__rootNode.x + this.__nodeWidth / 2,
        top: this.__rootNode.y - this.__nodeHeight / 2,
        bottom: this.__rootNode.y + this.__nodeHeight / 2,
      },
    );
    const [gWidth, gHeight] = [
      gBound.right - gBound.left,
      gBound.bottom - gBound.top,
    ];

    const { width = 0, height = 0 } =
      this.__svgSelection.node()?.getBoundingClientRect() || {};

    const k = Math.min(width / gWidth, height / gHeight);

    const transform: ITransform = {
      x: -gBound.left * k + (width - gWidth * k) / 2,
      y: -gBound.top * k + (height - gHeight * k) / 2,
      k,
    };

    this.__currentTransform.x = transform.x;
    this.__currentTransform.y = transform.y;
    this.__currentTransform.k = transform.k;

    this.__transformChange?.(this.__currentTransform);
    this.__svgGSelection
      .transition()
      .duration(this.__duration)
      .attr(
        'transform',
        `translate(${transform.x}, ${transform.y}) scale(${transform.k})`,
      );
  }

  private __bindZoom() {
    if (!this.__svgGSelection || !this.__svgSelection) return;

    this.__svgSelection.on('.zoom', null);
    this.__svgSelection.call(
      zoom<SVGSVGElement, unknown>()
        .scaleExtent(this.__scaleExtent)
        .on('zoom', (event) => {
          this.__currentTransform = event.transform;
          this.__transformChange?.(this.__currentTransform);
          this.__svgGSelection?.attr(
            'transform',
            `translate(${Number(event.transform.x)}, ${Number(
              event.transform.y,
            )}) scale(${event.transform.k})`,
          );
        }),
    );

    if (!this.__config?.allowWheelZoom) {
      this.__svgSelection.on('wheel.zoom', null);
    }
    if (!this.__config?.allowDblClickZoom) {
      this.__svgSelection.on('dblclick.zoom', null);
    }
  }

  private __getRenderNodeAtom(node: INode) {
    const nodeEleRef = createRef<SVGForeignObjectElement>();
    const toggleWrapRef = createRef<HTMLDivElement>();
    const isShowToggle =
      typeof this.__toggleConfig?.show === 'function'
        ? this.__toggleConfig.show(node)
        : Boolean(this.__toggleConfig?.show);

    this.__nodeMap[node.path] = node;
    this.__nodeEleMap[node.path] = nodeEleRef;
    this.__toggleWrapMap[node.path] = toggleWrapRef;

    return (
      <foreignObject
        ref={nodeEleRef}
        className="tree-view__foreign-obj"
        width={this.__nodeWidth}
        height={this.__nodeHeight}
        key={uniqueId()}
        x={node.x - this.__nodeWidth / 2}
        y={node.y - this.__nodeHeight / 2}
        fillOpacity={0}
      >
        <div className="tree-view__node-wrap" data-x={node.x} data-y={node.y}>
          {this.__nodeRender?.(node) ?? node.label}
        </div>
        {isShowToggle ? (
          <div
            ref={toggleWrapRef}
            onClick={() => this.__nodeToggleCb?.(node)}
            data-path={node.path}
            className="tree-view__toggle"
            style={{
              position: 'absolute',
              bottom: `calc(-${this.__toggleConfig?.size[1]}px / 2)`,
              left: `calc(50% - ${this.__toggleConfig?.size[0]}px / 2)`,
            }}
          >
            {this.__toggleConfig?.render(node)}
          </div>
        ) : null}
      </foreignObject>
    );
  }

  private __getRenderLinkAtom(link: ILink) {
    const lineStyle: LineStyle = {
      stroke: 'none',
      strokeOpacity: 1,
      fill: 'none',
      fillOpacity: 1,
      ...(this.__config?.line?.style === undefined
        ? {}
        : typeof this.__config?.line?.style === 'object'
        ? this.__config.line?.style
        : this.__config.line?.style(link)),
    };
    const ref = createRef<SVGPathElement>();
    const gRef = createRef<SVGGElement>();
    const linkId = createLinkId(link);
    this.__linkMap[linkId] = link;
    this.__linkEleMap[linkId] = ref;
    this.__linkGEleMap[linkId] = gRef;
    return (
      <g ref={gRef} key={uniqueId()}>
        <path
          ref={ref}
          d={createTowerRadiusPath(link, this.__nodeHeight)}
          {...lineStyle}
        />
      </g>
    );
  }

  private __updateNodeToggle(node: INode) {
    const toggleWrap = this.__toggleWrapMap[node.path].current;
    if (!toggleWrap || !this.__toggleConfig) return;

    ReactDOM.render(this.__toggleConfig.render(node), toggleWrap);
  }

  private __translateNode(node: INode, __position?: IPosition) {
    const position = __position ?? { x: node.x, y: node.y };
    const foreignNode = this.__nodeEleMap[node.path].current;
    if (foreignNode) {
      const [x, y] = [
        position.x - this.__nodeWidth / 2,
        position.y - this.__nodeHeight / 2,
      ];

      select(foreignNode)
        .transition()
        .duration(this.__duration)
        .attr('x', x)
        .attr('y', y);

      select(foreignNode).style('display', 'unset');
    }
  }

  private __translateLink(link: ILink, position?: IPosition) {
    const linkId = createLinkId(link);

    select(this.__linkEleMap[linkId].current)
      .transition()
      .duration(this.__duration)
      .attr('d', createTowerRadiusPath(link, this.__nodeHeight));

    select(this.__linkGEleMap[linkId]?.current)
      .transition()
      .duration(this.__duration)
      .attr(
        'transform',
        position ? `translate(${position.x}, ${position.y}) scale(0)` : '',
      );
  }

  private __getDrawDepObj(layoutTreeNode: ILayoutTreeNode) {
    const nodeList: INode[] = [],
      linkList: ILink[] = [];

    const dfs = (node: INode) => {
      nodeList.push(node);
      if (node?.children) {
        for (let i = 0; i < node.children.length; ++i) {
          linkList.push({
            source: node,
            target: node.children[i],
          });
          dfs(node.children[i]);
        }
      }
    };

    dfs(layoutTreeNode);

    return { nodeList, linkList };
  }

  private __hiddenChildren(node: INode, target: IPosition) {
    const children = node?.__children?.length
      ? node.__children
      : node?.children;
    if (!children?.length) return;

    for (let i = 0; i < children.length; ++i) {
      const child = children[i];
      this.__hiddenNodeList.push(child);
      this.__translateNode(child, target);
      if (child.parent) {
        this.__translateLink(
          {
            source: child.parent,
            target: child,
          },
          target,
        );
      }

      this.__hiddenChildren(child, target);
    }
  }
}
