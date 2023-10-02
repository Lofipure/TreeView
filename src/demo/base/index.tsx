/**
 * compact: true
 */
import { Button, ButtonGroup, Tag } from '@douyinfe/semi-ui';
import TreeView from 'TreeView';
import { ITreeNode, ITreeViewHandler } from 'TreeView/types';
import React, { useRef, useState } from 'react';
import './index.less';

const createData = (): ITreeNode => ({
  label: 'root',
  children: [
    {
      label: 1,
      children: [
        {
          label: '1-1',
        },
        {
          label: '1-2',
        },
        {
          label: '1-3',
          children: [
            {
              label: '1-3-1',
            },
            {
              label: '1-3-2',
            },
            {
              label: '1-3-3',
            },
          ],
        },
      ],
    },
    {
      label: 2,
      children: [
        {
          label: '2-1',
          children: [
            {
              label: '2-1-1',
            },
            {
              label: '2-1-2',
            },
            {
              label: '2-1-3',
            },
            {
              label: '2-1-4',
            },
          ],
        },
        {
          label: '2-2',
          children: [
            {
              label: '2-2-1',
              children: [
                {
                  label: '2-2-1-1',
                },
                {
                  label: '2-2-1-2',
                },
                {
                  label: '2-2-1-3',
                  children: [
                    {
                      label: '222-1',
                    },
                    {
                      label: '222-2',
                    },
                    {
                      label: '222-3',
                    },
                    {
                      label: '222-4',
                    },
                  ],
                },
              ],
            },
            {
              label: '2-2-2',
            },
            {
              label: '2-2-3',
            },
          ],
        },
      ],
    },
  ],
});
const data = createData();

const DemoOne = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<ITreeViewHandler>(null);
  const [k, setK] = useState<number>(1);

  return (
    <div className="demo-one" ref={containerRef}>
      <div className="ctrl">
        <ButtonGroup>
          <Button onClick={() => ref.current?.zoomIn()}>+</Button>
          <Button onClick={() => ref.current?.zoomOut()}>-</Button>
        </ButtonGroup>
        <Button onClick={() => ref.current?.resetAsAutoFix()}>Reset</Button>
        <Tag size="large" style={{ height: 32, color: 'rgb(0,100,250)' }}>
          {((k ?? 0) * 100).toFixed(2)}%
        </Tag>
      </div>
      <TreeView
        ref={ref}
        event={{
          onTransformChange: (transform) => {
            setK(transform.k);
          },
          onToggle: (node) => {
            console.log(node);
          },
        }}
        config={{
          line: {
            style: {
              fill: 'none',
              fillOpacity: 0,
              stroke: 'red',
            },
          },
          toggle: {
            size: [28, 24.5],
            show: (node) =>
              Boolean(node?.children?.length || node?.__children?.length),
            render: (node) => (
              <div
                style={{
                  fontSize: 12,
                  background: 'red',
                  borderRadius: 4,
                  cursor: 'pointer',
                  color: 'white',
                  padding: '2px 4px',
                }}
              >
                {node?.isFold ? '展开' : '折叠'}
              </div>
            ),
          },
          node: {
            size: [0, 0],
            subTreeGap: 40,
            render: (node) => {
              return (
                <div className="node">
                  <div className="node__header">title</div>
                  <div
                    className="node__body"
                    onClick={() => {
                      ref.current?.centerAt(node);
                    }}
                  >
                    {node.label}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        ref.current?.addChildren(node, [
                          {
                            label: 'test1',
                          },
                          {
                            label: 'test2',
                          },
                        ]);
                      }}
                    >
                      新增 children
                    </Button>
                  </div>
                </div>
              );
            },
            space: {
              x: 20,
              y: 40,
            },
          },
          tiny: true,
          backgroundColor: '#f7f8fa',
          allowWheelZoom: true,
          autoFixInitial: true,
        }}
        data={data}
      />
    </div>
  );
};

export default DemoOne;
