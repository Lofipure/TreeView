import { Selection, select, transition, zoom } from 'd3';
import React, { RefObject, createRef } from 'react';
import { Root, createRoot } from 'react-dom/client';
import Layout from './Layout';
import { createLinkId, createPath } from './utils';

export default class Render {
  private __layout: Layout;
  private __nodeEleMap: Record<string, RefObject<SVGForeignObjectElement>>;
  private __linkEleMap: Record<string, RefObject<SVGPathElement>>;
  private __toggleRootMap: Record<string, Root>;
  private __svgSelection?: Selection<SVGSVGElement, unknown, null, undefined>;
  private __svgGSelection?: Selection<SVGGElement, unknown, null, undefined>;
  private __nodeRender: IRenderOptions['nodeRender'];
  private __folderRender: IRenderOptions['folderRender'];
  constructor(options: IRenderOptions) {
    this.__layout = options.layoutInstance;
    this.__nodeEleMap = {};
    this.__linkEleMap = {};
    this.__toggleRootMap = {};
    this.__nodeRender = options.nodeRender;
    this.__folderRender = options.folderRender;
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

  private __renderNode(param: { onToggle?: (node: ILayoutTreeNode) => void }) {
    createRef<SVGForeignObjectElement>();
    return (
      <>
        {this.__layout.drawDepObj.nodeList.reverse().map((node) => {
          const ref = createRef<SVGForeignObjectElement>();

          this.__nodeEleMap[node.path] = ref;

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

  private __renderLink() {
    return (
      <>
        {this.__layout.drawDepObj.linkList.reverse().map((link) => {
          const ref = createRef<SVGPathElement>();
          const linkId = createLinkId(link);
          this.__linkEleMap[linkId] = ref;
          return (
            <path
              ref={ref}
              key={`${link.source.path}--${link.target.path}`}
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

  public collapse(node: INode, cb: () => void) {
    const fold = node.children?.length;

    const transformNode = (
      node: INode,
      position: {
        x: number;
        y: number;
      },
    ) => {
      const foreignNode = this.__nodeEleMap?.[node.path]?.current;
      if (foreignNode) {
        select(foreignNode)
          .transition()
          .duration(500)
          .attr('x', position.x)
          .attr('y', position.y);
      }
      node.__children?.forEach((item) => transformNode(item, position));

      if (!node.isFold && fold) {
        node.children?.forEach((item) => transformNode(item, position));
      }
    };

    if (fold) {
      const [targetX, targetY] = [node.x, node.y];
      const [targetWidth, targetHeight] = [node.width, node.height];

      const dfs = (movedNode: INode) => {
        movedNode.children?.forEach(dfs);

        transformNode(movedNode, {
          x: targetX - targetWidth / 2,
          y: targetY - targetHeight / 2,
        });
      };

      node.children?.forEach(dfs);
    } else {
      const dfs = (movedNode: INode) => {
        movedNode.children?.forEach(dfs);

        transformNode(movedNode, {
          x: movedNode.originX - movedNode.width / 2,
          y: movedNode.originY - movedNode.height / 2,
        });
      };

      node.__children?.forEach(dfs);
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
        {this.__renderLink()}
        {this.__renderNode({
          onToggle: params.onToggle,
        })}
      </>,
    );
  }
}
