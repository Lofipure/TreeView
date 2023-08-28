import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import Layout from './Layout';
import Render from './Render';
import { NODE_SPACE } from './config';
import './index.less';

const TreeView = forwardRef<ITreeViewHandler, ITreeViewProps>((props, ref) => {
  const {
    data,
    nodeSize,
    folderRender,
    config,
    detailStartTower,
    tiny = false,
    nodeSpace = NODE_SPACE,
    nodeRender,
  } = props;
  const wrapRef = useRef<HTMLDivElement>(null);

  const { renderInstance, layoutInstance } = useMemo(
    () => ({
      layoutInstance: new Layout({
        nodeSize,
        nodeSpace,
        tiny,
        detailStartTower,
      }),
      renderInstance: new Render({
        folderRender,
        nodeRender,
        config,
        nodeSize,
      }),
    }),
    [],
  );

  const fullScreen = () => {
    wrapRef.current?.requestFullscreen();
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !data) return;

    const rootNode = layoutInstance.updateLayout(data);

    renderInstance.render({
      wrap,
      rootNode,
      onToggle: (node) => {
        const updatedLayout = layoutInstance.toggleFold(node);
        // TODO 探索 mobx的可能性，实现布局前后的精准打击
        renderInstance.toggleFold({
          layoutTreeNode: updatedLayout,
          toggleNode: node,
        });
      },
    });
  }, [data]);

  useImperativeHandle(ref, () => ({
    fullScreen,
    wrapRef,
  }));

  return <div className="tree-view" ref={wrapRef} />;
});

export default TreeView;
