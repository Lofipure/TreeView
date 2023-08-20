import TreeView from 'TreeView';
import React, { useRef } from 'react';
import './index.less';

const data: ITreeNode = {
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
      ],
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
};

const DemoOne = () => {
  const ref = useRef<ITreeViewHandler>(null);

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
    </div>
  );
};

export default DemoOne;
