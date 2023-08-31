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
  const { data, config, event } = props;
  const wrapRef = useRef<HTMLDivElement>(null);

  const { renderInstance, layoutInstance } = useMemo(
    () => ({
      layoutInstance: new Layout({
        tiny: Boolean(config?.tiny),
        nodeSize: config.node.size,
        nodeSpace: config.node?.space ?? NODE_SPACE,
      }),
      renderInstance: new Render({
        event,
        config,
      }),
    }),
    [],
  );

  const fullScreen = () => {
    wrapRef.current?.requestFullscreen();
  };

  const toggleNode = (node: INode) => {
    const updatedLayout = layoutInstance.toggleFold(node);
    renderInstance.toggleFold({
      layoutTreeNode: updatedLayout,
      toggleNode: node,
    });
  };

  const drawGraphForDataUpdate = () => {
    const wrap = wrapRef.current;
    if (!wrap || !data) return;

    const rootNode = layoutInstance.updateLayout(data);

    renderInstance.render({
      wrap,
      rootNode,
      onToggle: (node) => {
        if (!config?.toggleControlled) {
          toggleNode(node);
        }
        event?.onToggle?.(node);
      },
    });
  };

  useEffect(drawGraphForDataUpdate, [JSON.stringify(data)]);

  useImperativeHandle(ref, () => ({
    wrapRef,
    fullScreen,
    toggleNode,
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
