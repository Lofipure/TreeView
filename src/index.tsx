import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import Layout from './Layout';
import Render from './Render';
import { NODE_ID, NODE_SPACE } from './config';
import './index.less';

const TreeView = forwardRef<ITreeViewHandler, ITreeViewProps>((props, ref) => {
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
      folderRender,
      nodeRender,
    });
    return { layoutInstance, renderInstance };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    renderInstance.render({
      wrap,
      onToggle: (node) => {
        layoutInstance.toggleFold(node);
        renderInstance.toggleFold(node);
      },
      rootNode: layoutInstance.treeNode,
    });
  }, []);

  useImperativeHandle(ref, () => ({}));

  return <div className="tree-view" id={NODE_ID} ref={wrapRef}></div>;
});

export default TreeView;
