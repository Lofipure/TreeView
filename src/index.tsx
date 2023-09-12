import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import Layout from './Layout';
import Render from './Render';
import './index.less';
import { INode, ITreeViewHandler, ITreeViewProps } from './types';

const TreeView = forwardRef<ITreeViewHandler, ITreeViewProps>((props, ref) => {
  const { data, config, event } = props;
  const wrapRef = useRef<HTMLDivElement>(null);

  const { renderInstance, layoutInstance } = useMemo(
    () => ({
      layoutInstance: new Layout({
        tiny: Boolean(config?.tiny),
        nodeConfig: config.node,
      }),
      renderInstance: new Render({
        event,
        config,
      }),
    }),
    [],
  );

  const toggleNode = (node: INode) => {
    const updatedLayout = layoutInstance.toggleFold(node);
    renderInstance.toggleFold({
      layoutTreeNode: updatedLayout,
      toggleNode: node,
    });
  };

  const resetAsAutoFix = () => {
    const resetedLayoutNode = layoutInstance.reset();
    if (!resetedLayoutNode) return;
    renderInstance.reset(resetedLayoutNode);
  };

  const drawGraphForDataUpdate = () => {
    const wrap = wrapRef.current;
    if (!wrap || !data) return;

    const rootNode = layoutInstance.updateLayout(data);

    renderInstance.render({
      wrap,
      rootNode,
      onToggle: (node) => {
        toggleNode(node);
        event?.onToggle?.(node);
      },
    });
  };

  useEffect(drawGraphForDataUpdate, [JSON.stringify(data)]);

  useImperativeHandle(ref, () => ({
    toggleNode,
    resetAsAutoFix,
    zoomIn: (stripe) => renderInstance.zoom('zoomIn', stripe),
    zoomOut: (stripe) => renderInstance.zoom('zoomOut', stripe),
    centerAt: (node) => renderInstance.centerAt(node),
  }));

  return <div className="tree-view" ref={wrapRef} />;
});

export default TreeView;
