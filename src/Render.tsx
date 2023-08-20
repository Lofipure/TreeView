import { Selection, select, transition, zoom } from 'd3';
import React, { RefObject, createRef } from 'react';
import { Root, createRoot } from 'react-dom/client';
import Layout from './Layout';
import { createLinkId, createPath } from './utils';

const DURATION = 500;

export default class Render {
  private __layout: Layout;
  private __nodeEleMap: Record<string, RefObject<SVGForeignObjectElement>>;
  private __linkEleMap: Record<string, RefObject<SVGPathElement>>;
  private __linkMap: Record<string, ILink>;
  private __nodeMap: Record<string, INode>;
  private __toggleRootMap: Record<string, Root>;
  private __svgSelection?: Selection<SVGSVGElement, unknown, null, undefined>;
  private __svgGSelection?: Selection<SVGGElement, unknown, null, undefined>;
  private __folderRender: IRenderOptions['folderRender'];
  private __nodeRender: IRenderOptions['nodeRender'];

  constructor(options: IRenderOptions) {
    this.__layout = options.layoutInstance;
    this.__nodeEleMap = {};
    this.__linkEleMap = {};
    this.__toggleRootMap = {};
    this.__linkMap = {};
    this.__nodeMap = {};
    this.__folderRender = options.folderRender;
    this.__nodeRender = options.nodeRender;
  }

  private __bindZoom() {
    if (!this.__svgGSelection || !this.__svgSelection) return;

    this.__svgSelection.call(
      zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
          this.__svgGSelection
            ?.style('transition', 'all 0s')
            .attr(
              'transform',
              `translate(${Number(event.transform.x)}, ${Number(
                event.transform.y,
              )}) scale(${event.transform.k})`,
            );
        }),
    );
  }

  private __getRenderNode(param: {
    onToggle?: (node: ILayoutTreeNode) => void;
  }) {
    return (
      <>
        {this.__layout.drawDepObj.nodeList.reverse().map((node) => {
          const ref = createRef<SVGForeignObjectElement>();

          this.__nodeEleMap[node.path] = ref;
          this.__nodeMap[node.path] = node;

          const toggleBtn = (
            <div
              onClick={() => param.onToggle?.(node)}
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
              key={node.path}
              x={node.x - node.width / 2}
              y={node.y - node.height / 2}
              fillOpacity={0}
            >
              <div className="tree-view__node-wrap">
                {this.__nodeRender?.(node) ?? node.label}
              </div>
              {(node?.children || node?.__children) && this.__folderRender
                ? toggleBtn
                : null}
            </foreignObject>
          );
        })}
      </>
    );
  }

  private __getRenderLink() {
    return (
      <>
        {this.__layout.drawDepObj.linkList.reverse().map((link) => {
          const ref = createRef<SVGPathElement>();
          const linkId = createLinkId(link);
          this.__linkMap[linkId] = link;
          this.__linkEleMap[linkId] = ref;
          return (
            <path
              ref={ref}
              key={createLinkId(link)}
              d={createPath(link)}
              fill="none"
              fillOpacity={0}
              stroke="#DFE0E2"
            />
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

  private __collapse(node: INode) {
    const dfs = (operatedNode: INode) => {
      this.__translateNode(operatedNode, {
        x: node.x,
        y: node.y,
      });
      operatedNode.children?.forEach(dfs);
      operatedNode.__children?.forEach(dfs);
    };

    node.children?.forEach(dfs);
    node.__children?.forEach(dfs);
  }

  private __expand(node: INode) {
    const dfs = (operatedNode: INode, fixedPosition?: IPosition) => {
      if (operatedNode === node) {
        // 展开这个节点的隐藏节点
        operatedNode.__children?.forEach((child) => {
          this.__translateNode(child, {
            x: child.originX,
            y: child.originY,
          });

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
            dfs(child, fixedPosition);
          });
        } else {
          // 对于隐藏的子节点，他的子节点&隐藏子节点都应该和他保持一致。
          operatedNode.__children?.forEach((child) => {
            this.__translateNode(child, {
              x: operatedNode.x,
              y: operatedNode.y,
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

            dfs(child);
          });
        }
      }
    };
    dfs(node);
  }

  public toggleFold(node: INode, cb: () => void) {
    const fold = Boolean(node.children?.length);

    if (fold) {
      this.__collapse(node);
    } else {
      this.__expand(node);
    }

    transition().on('end', () => {
      cb?.();
      this.__updateNodeToggle(node);
    });
  }

  public render(params: {
    wrap: HTMLDivElement;
    onToggle: (node: ILayoutTreeNode) => void;
  }) {
    this.__svgSelection = select(params.wrap).append('svg');
    this.__svgGSelection = this.__svgSelection.append('g');

    this.__svgSelection?.attr('class', 'tree-view__svg');
    this.__svgGSelection?.attr('class', 'tree-view__g');

    this.__bindZoom();

    createRoot(this.__svgGSelection.node()!).render(
      <>
        {this.__getRenderLink()}
        {this.__getRenderNode({
          onToggle: params.onToggle,
        })}
      </>,
    );
  }
}
