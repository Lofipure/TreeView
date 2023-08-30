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
    tiny = false,
    event,
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
      }),
      renderInstance: new Render({
        folderRender,
        nodeRender,
        config,
        nodeSize,
        event,
      }),
    }),
    [],
  );

  const fullScreen = () => {
    wrapRef.current?.requestFullscreen();
  };

  const drawGraphForDataUpdate = () => {
    const wrap = wrapRef.current;
    if (!wrap || !data) return;

    const rootNode = layoutInstance.updateLayout(data);

    renderInstance.render({
      wrap,
      rootNode,
      onToggle: (node) => {
        const updatedLayout = layoutInstance.toggleFold(node);
        renderInstance.toggleFold({
          layoutTreeNode: updatedLayout,
          toggleNode: node,
        });
      },
    });
  };

  useEffect(drawGraphForDataUpdate, [data]);

  useImperativeHandle(ref, () => ({
    fullScreen,
    wrapRef,
    zoomIn: (stripe) => renderInstance.zoom('zoomIn', stripe),
    zoomOut: (stripe) => renderInstance.zoom('zoomOut', stripe),
    centerAt: (node) => renderInstance.centerAt(node),
    resetAsAutoFix: () => {
      const resetedLayoutNode = layoutInstance.reset();
      if (!resetedLayoutNode) return;
      renderInstance.reset(resetedLayoutNode);
    },
  }));

  return <div className="tree-view" ref={wrapRef} />;
});

export default TreeView;
