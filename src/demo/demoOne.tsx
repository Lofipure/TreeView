import TreeView from 'TreeView';
import { Button, Switch, Tooltip } from 'antd';
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

const DemoOne = () => {
  const ref = useRef<ITreeViewHandler>(null);
  const [tiny, setTiny] = useState<boolean>(true);

  return (
    <div className="demo-one">
      <TreeView
        ref={ref}
        tiny={tiny}
        config={{
          lineStyle: {
            fill: 'none',
            fillOpacity: 0,
            stroke: 'red',
          },
          duration: 500,
          allowWheelZoom: true,
          autoFixInitial: true,
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
              <div
                className="node__body"
                onClick={() => {
                  ref.current?.centerAt(node);
                }}
              >
                {node.label}
              </div>
            </div>
          );
        }}
        data={createData()}
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
      <Switch checked={tiny} onChange={setTiny} />
      <Button
        onClick={() => {
          ref.current?.fullScreen();
        }}
      >
        FullScreen
      </Button>
      <Button.Group>
        <Button onClick={() => ref.current?.zoomIn()}>+</Button>
        <Button onClick={() => ref.current?.zoomOut()}>-</Button>
      </Button.Group>
      <Button onClick={() => ref.current?.resetAsAutoFix()}>Reset</Button>
    </div>
  );
};

export default DemoOne;
