import TreeView from 'TreeView';
import { Button, Tooltip } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import './index.less';

const createData = (key: string): ITreeNode => ({
  label: 'root' + key,
  children: [
    {
      label: 1,
      //  Array(Math.floor(Math.random() * 4) + 3)
      children: Array(3)
        .fill(0)
        .map((_, index) => ({
          label: `1-${index + 1}`,
        })),
    },
    {
      label: 2,
      children: [
        {
          label: '2-1',
          children: [
            {
              label: '2-1--222-1',
            },
            {
              label: '2-1--222-2',
            },
            {
              label: '2-1--222-3',
            },
            {
              label: '2-1--222-4',
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
                  label: '111',
                },
                {
                  label: '222',
                },
                {
                  label: '333',
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

const DemoOne = () => {
  const ref = useRef<ITreeViewHandler>(null);
  const [cnt, setCnt] = useState<number>(0);

  const data = useMemo<ITreeNode>(() => createData(cnt.toString()), [cnt]);

  return (
    <div className="demo-one">
      <TreeView
        ref={ref}
        tiny
        config={{
          allowWheelZoom: true,
          // autoFixInitial: true,
        }}
        nodeRender={(node) => {
          return (
            <div className="node">
              <div className="node__header">
                <Tooltip
                  overlay={'123'}
                  getPopupContainer={() => ref.current?.wrapRef.current as any}
                >
                  title
                </Tooltip>
              </div>
              <div className="node__body">{node.label}</div>
            </div>
          );
        }}
        data={data}
        nodeSize={[208, 100]}
        folderRender={{
          render: (node) => (
            <div
              style={{
                width: 14,
                height: 14,
                display: 'flex',
                background: 'red',
                borderRadius: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                lineHeight: 14,
              }}
            >
              {node.isFold ? '+' : '-'}
            </div>
          ),
          size: {
            width: 14,
            height: 14,
          },
        }}
      />
      <Button
        onClick={() => {
          setCnt(cnt + 1);
        }}
      >
        Click
      </Button>
      <Button
        onClick={() => {
          ref.current?.fullScreen();
        }}
      >
        FullScreen
      </Button>
    </div>
  );
};

export default DemoOne;
