import { Selection, ZoomTransform, select, transition, zoom } from 'd3';
import { uniqueId } from 'lodash';
import React, { RefObject, createRef } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { createLinkId, createRadiusPath } from './utils';

const DURATION = 300;

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
  private __nodeRender: IRenderOptions['nodeRender'];

  constructor(options: IRenderOptions) {
    this.__nodeEleMap = {};
    this.__linkEleMap = {};
    this.__toggleRootMap = {};
    this.__linkMap = {};
    this.__nodeMap = {};
    this.__linkGEleMap = {};
    this.__folderRender = options.folderRender;
    this.__config = options.config;
    this.__nodeRender = options.nodeRender;
  }

  private __bindZoom(initialTransform?: ITransform) {
    if (!this.__svgGSelection || !this.__svgSelection) return;

    let initial: ZoomTransform | undefined = undefined;
    if (initialTransform) {
      initial = new ZoomTransform(
        initialTransform.k,
        initialTransform.x,
        initialTransform.y,
      );
    }

    this.__svgSelection.on('.zoom', null);
    this.__svgSelection.call(
      zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
          if (initial) {
            this.__svgGSelection?.attr(
              'transform',
              `translate(${Number(event.transform.x + initial.x)}, ${Number(
                event.transform.y + initial.y,
              )}) scale(${event.transform.k * initial.k})`,
            );
            return;
          }
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
              width={node.width}
              height={node.height}
              key={uniqueId()}
              x={node.x - node.width / 2}
              y={node.y - node.height / 2}
              fillOpacity={0}
            >
              <div className="tree-view__node-wrap">
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
                d={createRadiusPath(link)}
                fill="none"
                fillOpacity={0}
                stroke="#DFE0E2"
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
        position.x - node.width / 2,
        position.y - node.height / 2,
      ];
      select(foreignNode)
        .transition()
        .duration(DURATION)
        .attr('x', x)
        .attr('y', y);
    }
  }

  private __translateLink(
    targetNode: INode,
    param: {
      path?: string;
      position?: IPosition;
    },
  ) {
    if (targetNode.parent) {
      const linkId = createLinkId({
        source: { path: targetNode.parent.path },
        target: { path: targetNode.path },
      });

      if (param?.path) {
        select(this.__linkEleMap[linkId].current)
          .transition()
          .duration(DURATION)
          .attr('d', param.path);
      } else if (param?.position) {
        select(this.__linkGEleMap[linkId].current)
          .transition()
          .duration(DURATION)
          .attr(
            'transform',
            `translate(${param.position.x}, ${param.position.y}) scale(0)`,
          );
      } else {
        select(this.__linkGEleMap[linkId].current)
          .transition()
          .duration(DURATION)
          .attr('transform', '');
      }
    }
  }

  private __collapse(node: INode) {
    const target = {
      x: node.x,
      y: node.y,
    };
    this.__translateNode(node, target);
    if (node?.parent)
      this.__translateLink(node, {
        path: createRadiusPath({
          source: node.parent,
          target: {
            ...node,
            ...target,
          },
        }),
      });
    const dfs = (operatedNode: INode) => {
      this.__translateNode(operatedNode, {
        x: node.x,
        y: node.y,
      });
      this.__translateLink(operatedNode, {
        position: target,
      });

      operatedNode.children?.forEach(dfs);
      operatedNode.__children?.forEach(dfs);
    };

    node.children?.forEach(dfs);
    node.__children?.forEach(dfs);
  }

  private __expand(node: INode) {
    const target = {
      x: node.x,
      y: node.y,
    };
    this.__translateNode(node, target);
    if (node?.parent)
      this.__translateLink(node, {
        path: createRadiusPath({
          source: node.parent,
          target: {
            ...node,
            ...target,
          },
        }),
      });

    const dfs = (operatedNode: INode, fixedPosition?: IPosition) => {
      if (operatedNode === node) {
        // 展开这个节点的隐藏节点
        operatedNode.children?.forEach((child) => {
          this.__translateNode(child, {
            x: child.originX,
            y: child.originY,
          });
          this.__translateLink(child, {});

          dfs(child);
        });
      } else {
        if (fixedPosition) {
          // 如果有固定的参数，就固定
          [
            ...(operatedNode.children ?? []),
            ...(operatedNode.__children ?? []),
          ].forEach((child) => {
            this.__translateNode(child, {
              x: fixedPosition.x,
              y: fixedPosition.y,
            });
            this.__translateLink(child, {
              position: {
                x: fixedPosition.x,
                y: fixedPosition.y,
              },
            });
            dfs(child, fixedPosition);
          });
        } else {
          // 对于隐藏的子节点，他的子节点&隐藏子节点都应该和他保持一致。
          operatedNode.__children?.forEach((child) => {
            this.__translateNode(child, {
              x: operatedNode.x,
              y: operatedNode.y,
            });
            this.__translateLink(child, {
              position: {
                x: operatedNode.x,
                y: operatedNode.y,
              },
            });

            dfs(child, {
              x: operatedNode.x,
              y: operatedNode.y,
            });
          });
          // 对于子节点，正常渲染
          operatedNode.children?.forEach((child) => {
            this.__translateNode(child, {
              x: child.originX,
              y: child.originY,
            });
            if (child?.parent) this.__translateLink(child, {});

            dfs(child);
          });
        }
      }
    };

    dfs(node);
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

  private __autoFixLayout() {
    if (!this.__rootNode || !this.__svgGSelection || !this.__svgSelection)
      return;
    const nodeList = Object.keys(this.__nodeMap).map(
      (key) => this.__nodeMap[key],
    );
    const gBound = nodeList.reduce<IBound>(
      (bound, node) => {
        bound.top = Math.min(bound.top, node.y - node.height / 2);
        bound.bottom = Math.max(bound.bottom, node.y + node.height / 2);
        bound.left = Math.min(bound.left, node.x - node.width / 2);
        bound.right = Math.max(bound.right, node.x + node.width / 2);
        return bound;
      },
      {
        left: this.__rootNode.x - this.__rootNode.width / 2,
        right: this.__rootNode.x + this.__rootNode.width / 2,
        top: this.__rootNode.y - this.__rootNode.height / 2,
        bottom: this.__rootNode.y + this.__rootNode.height / 2,
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

    this.__svgGSelection
      .transition()
      .duration(DURATION)
      .attr(
        'transform',
        `translate(${transform.x}, ${transform.y}) scale(${transform.k})`,
      );

    this.__bindZoom(transform);
  }

  public toggleFold(node: INode) {
    const fold = node.isFold;

    if (fold) {
      this.__collapse(node);
    } else {
      this.__expand(node);
    }

    transition().on('end', () => {
      this.__updateNodeToggle(node);
    });
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
      this.__autoFixLayout();
    }
  }
}
