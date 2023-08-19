import { select, zoom } from 'd3';
import React, { FC, useEffect, useMemo } from 'react';
import Layout from './Layout';
import { NODE_ID } from './config';
import './index.less';

const id = 'svg_id';
const groupId = 'svg_g_id';

const TreeView: FC<ITreeViewProps> = (props) => {
  const { data, nodeSize } = props;

  const { layoutInstance } = useMemo(() => {
    const layoutInstance = new Layout({
      data,
      nodeSize,
    });

    return { layoutInstance };
  }, []);

  useEffect(() => {
    const svg = document.getElementById(id) as unknown as SVGSVGElement;
    const svgG = document.getElementById(groupId) as unknown as SVGGElement;
    select(svg).call(
      zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
          select(svgG)
            .style('transition', 'all 0s')
            .attr(
              'transform',
              `translate(${Number(event.transform.x)}, ${Number(
                event.transform.y,
              )})`,
            );
        }),
    );
  }, []);

  return (
    <div className="tree-view" id={NODE_ID}>
      <svg width="100%" height={600} className="tree-view__svg" id={id}>
        <g id={groupId}>
          {layoutInstance.drawDepObj.nodeList.map((item, index) => (
            <foreignObject
              width={item.width}
              height={item.height}
              key={index}
              x={item.x}
              y={item.y}
              fillOpacity={0}
            >
              <div className="tree-view__node-wrap">{item.label}</div>
            </foreignObject>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default TreeView;
