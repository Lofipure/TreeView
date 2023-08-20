import TreeView from 'TreeView';
import { Button } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import './index.less';

const createData = (key: string): ITreeNode => ({
  label: 'root' + key,
  children: [
    {
      label: 1,
      children: Array(Math.floor(Math.random() * 4) + 3)
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
        },
        {
          label: '2-2',
          children: [
            {
              label: '2-2-1',
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
        nodeRender={(node) => {
          return (
            <div className="node">
              <div className="node__header">title</div>
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
    </div>
  );
};

export default DemoOne;
