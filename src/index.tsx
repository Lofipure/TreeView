import React, { FC, useEffect, useMemo, useRef } from 'react';
import Layout from './Layout';
import Render from './Render';
import { NODE_ID, NODE_SPACE } from './config';
import './index.less';

const TreeView: FC<ITreeViewProps> = (props) => {
  const {
    data,
    nodeSize,
    nodeRender,
    folderRender,
    nodeSpace = NODE_SPACE,
  } = props;
  const wrapRef = useRef<HTMLDivElement>(null);

  const { renderInstance, layoutInstance } = useMemo(() => {
    const layoutInstance = new Layout({
      data,
      nodeSize,
      nodeSpace,
    });
    const renderInstance = new Render({
      layoutInstance,
      nodeRender,
      folderRender,
    });
    return { layoutInstance, renderInstance };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    renderInstance.render({
      wrap,
      onToggle: (node) => {
        renderInstance.toggleFold(node, () => {
          layoutInstance.toggleFold(node);
        });
      },
    });
  }, []);

  return <div className="tree-view" id={NODE_ID} ref={wrapRef}></div>;
};

TreeView.defaultProps = {
  nodeSpace: NODE_SPACE,
};

export default TreeView;
