import TreeView from 'TreeView';
import React from 'react';

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
  return (
    <div>
      <TreeView data={data} nodeSize={[100, 40]} />
    </div>
  );
};

export default DemoOne;
