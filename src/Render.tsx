import { Selection, select, transition, zoom, zoomIdentity } from 'd3';
import { uniqueId } from 'lodash';
import React, { RefObject, createRef } from 'react';
import { Root, createRoot } from 'react-dom/client';
import {
  DEFAULT_DURATION,
  DEFAULT_SCALE_EXTENT,
  DEFAULT_STRIPE,
} from './config';
import { createLinkId, createTowerRadiusPath } from './utils';

export default class Render {
  private __nodeEleMap: Record<string, RefObject<SVGForeignObjectElement>>;
  private __linkEleMap: Record<string, RefObject<SVGPathElement>>;
  private __linkGEleMap: Record<string, RefObject<SVGGElement>>;
  private __linkMap: Record<string, ILink>;
  private __nodeMap: Record<string, INode>;
  private __toggleRootMap: Record<string, Root>;
  private __svgSelection?: Selection<SVGSVGElement, unknown, null, undefined>;
  private __svgGSelection?: Selection<SVGGElement, unknown, null, undefined>;
  private __root?: Root;
  private __rootNode?: ILayoutTreeNode;
  private __folderRender: IRenderOptions['folderRender'];
  private __config: IRenderOptions['config'];
  private __nodeWidth: number;
  private __nodeHeight: number;
  private __hiddenNodeList: RefObject<SVGForeignObjectElement>[];
  private __hiddenLinkGList: RefObject<SVGGElement>[];
  private __currentTransform: IZoomTransform;
  private __scaleExtent: [number, number];
  private __duration: number;
  private __transformChange?: (transform: ITransform) => void;
  private __nodeRender: IRenderOptions['nodeRender'];

  constructor(options: IRenderOptions) {
    const [width, height] = options.nodeSize;
    this.__nodeWidth = width;
    this.__nodeHeight = height;
    this.__nodeEleMap = {};
    this.__linkEleMap = {};
    this.__toggleRootMap = {};
    this.__linkMap = {};
    this.__nodeMap = {};
    this.__linkGEleMap = {};
    this.__folderRender = options.folderRender;
    this.__config = options.config;
    this.__hiddenNodeList = [];
    this.__hiddenLinkGList = [];
    this.__currentTransform = zoomIdentity;
    this.__scaleExtent = options.config?.scaleExtent ?? DEFAULT_SCALE_EXTENT;
    this.__duration = options.config?.duration ?? DEFAULT_DURATION;
    this.__nodeRender = options.nodeRender;
    this.__transformChange = options.event?.onTransformChange;
  }

  public render(params: {
    wrap: HTMLDivElement;
    rootNode: ILayoutTreeNode;
    onToggle: (node: ILayoutTreeNode) => void;
  }) {
    this.__nodeEleMap = {};
    this.__linkEleMap = {};
    this.__toggleRootMap = {};
    this.__linkMap = {};
    this.__nodeMap = {};
    this.__linkGEleMap = {};
    this.__rootNode = params.rootNode;

    if (!this.__svgGSelection || !this.__svgSelection) {
      this.__svgSelection = select(params.wrap).append('svg');
      this.__svgGSelection = this.__svgSelection.append('g');

      this.__svgSelection?.attr('class', 'tree-view__svg');
      this.__svgGSelection?.attr('class', 'tree-view__g');

      this.__bindZoom();

      this.__root = createRoot(this.__svgGSelection.node()!);
    }

    const { linkList, nodeList } = this.__getDrawDepObj(params.rootNode);

    this.__root?.render(
      <>
        {this.__getRenderLink(linkList)}
        {this.__getRenderNode({
          nodeList,
          onToggle: params.onToggle,
        })}
      </>,
    );

    if (this.__config?.autoFixInitial) {
      this.autoFixLayout();
    }
  }

  public toggleFold(param: {
    layoutTreeNode?: ILayoutTreeNode;
    toggleNode: INode;
  }) {
    const { layoutTreeNode, toggleNode } = param;
    if (!layoutTreeNode) return;

    const { nodeList, linkList } = this.__getDrawDepObj(layoutTreeNode);

    this.__hiddenLinkGList = [];
    this.__hiddenNodeList = [];

    nodeList.forEach((node) => {
      select(this.__nodeEleMap[node.path].current)
        .transition()
        .duration(this.__duration)
        .attr('x', node.x - this.__nodeWidth / 2)
        .attr('y', node.y - this.__nodeHeight / 2);

      if (node?.__children?.length) {
        this.__hiddenChildren(node, { x: node.x, y: node.y });
      }
    });

    linkList.forEach((link) => {
      const linkId = createLinkId(link);
      select(this.__linkEleMap[linkId].current)
        .transition()
        .duration(this.__duration)
        .attr('d', createTowerRadiusPath(link, this.__nodeHeight));
      select(this.__linkGEleMap[linkId].current)
        .transition()
        .duration(this.__duration)
        .attr('transform', '');
    });

    transition().on('end', () => {
      this.__updateNodeToggle(toggleNode);
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

  public autoFixLayout() {
    if (!this.__rootNode || !this.__svgGSelection || !this.__svgSelection)
      return;
    const nodeList = Object.keys(this.__nodeMap).map(
      (key) => this.__nodeMap[key],
    );
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

  private __getRenderNode(param: {
    nodeList: INode[];
    onToggle?: (node: ILayoutTreeNode) => void;
  }) {
    return (
      <>
        {param.nodeList.reverse().map((node) => {
          const ref = createRef<SVGForeignObjectElement>();

          this.__nodeEleMap[node.path] = ref;
          this.__nodeMap[node.path] = node;

          const renderToggleBtn = () => (
            <div
              onClick={() => {
                param.onToggle?.(node);
              }}
              className="tree-view__toggle"
              style={{
                position: 'absolute',
                bottom: `calc(-${this.__folderRender?.size.height}px / 2)`,
                left: `calc(50% - ${this.__folderRender?.size.width}px / 2)`,
              }}
            >
              {this.__folderRender?.render(node)}
            </div>
          );

          return (
            <foreignObject
              ref={ref}
              className="tree-view__foreign-obj"
              width={this.__nodeWidth}
              height={this.__nodeHeight}
              key={uniqueId()}
              x={node.x - this.__nodeWidth / 2}
              y={node.y - this.__nodeHeight / 2}
              fillOpacity={0}
            >
              <div
                className="tree-view__node-wrap"
                data-x={node.x}
                data-y={node.y}
              >
                {this.__nodeRender?.(node) ?? node.label}
              </div>
              {(node?.children || node?.__children) && this.__folderRender
                ? renderToggleBtn()
                : null}
            </foreignObject>
          );
        })}
      </>
    );
  }

  private __getRenderLink(linkList: ILink[]) {
    const lineStyle: LineStyle = {
      stroke: 'none',
      strokeOpacity: 1,
      fill: 'none',
      fillOpacity: 1,
      ...(this.__config?.lineStyle ?? {}),
    };
    return (
      <>
        {linkList.reverse().map((link) => {
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
        })}
      </>
    );
  }

  private __updateNodeToggle(node: INode) {
    const nodeForeign = this.__nodeEleMap[node.path].current;
    if (!nodeForeign || !this.__folderRender) return;
    const toggleWrap = select(nodeForeign)
      .selectChild(`.tree-view__toggle`)
      .node() as HTMLDivElement;
    if (!toggleWrap) return;
    const toggleRoot =
      this.__toggleRootMap?.[node.path] ?? createRoot(toggleWrap);

    this.__toggleRootMap[node.path] = toggleRoot;

    toggleRoot.render(this.__folderRender?.render(node));
  }

  private __translateNode(node: INode, position: IPosition) {
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
    }
  }

  private __translateLink(targetNode: INode, position: IPosition) {
    if (targetNode.parent) {
      const linkId = createLinkId({
        source: { path: targetNode.parent.path },
        target: { path: targetNode.path },
      });

      select(this.__linkGEleMap[linkId].current)
        .transition()
        .duration(this.__duration)
        .attr('transform', `translate(${position.x}, ${position.y}) scale(0)`);
    }
  }

  private __getDrawDepObj(layoutTreeNode: ILayoutTreeNode) {
    const nodeList: INode[] = [],
      linkList: ILink[] = [];

    const dfs = (node: ILayoutTreeNode) => {
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

  private __hiddenChildren(node: ILayoutTreeNode, target: IPosition) {
    const children = node?.__children?.length
      ? node.__children
      : node?.children;
    if (!children?.length) return;

    for (let i = 0; i < children.length; ++i) {
      const child = children[i];
      this.__translateNode(child, target);
      this.__translateLink(child, target);

      this.__hiddenNodeList.push(this.__nodeEleMap[child.path]);
      this.__hiddenLinkGList.push(
        this.__linkGEleMap[
          createLinkId({
            source: child.parent!,
            target: child,
          })
        ],
      );

      this.__hiddenChildren(child, target);
    }
  }
}
