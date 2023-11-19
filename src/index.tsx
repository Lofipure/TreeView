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
  const { data, config, event, method } = props;
  const wrapRef = useRef<HTMLDivElement>(null);

  const { renderInstance, layoutInstance } = useMemo(
    () => ({
      layoutInstance: new Layout({
        tiny: Boolean(config?.tiny),
        nodeConfig: config.node,
        wrapRef,
      }),
      renderInstance: new Render({
        event,
        config,
        method,
      }),
    }),
    [],
  );

  const toggleNode = async (node: INode) => {
    const toggleInfo = await layoutInstance.toggleFold(node);
    if (!toggleInfo) return;
    renderInstance.toggleFold({
      layout: toggleInfo.layout,
      toggleNode: node,
    });
  };

  const resetAsAutoFix = async () => {
    const resetInfo = await layoutInstance.reset();
    if (!resetInfo) return;
    renderInstance.reset(resetInfo.layout);
  };

  const drawGraphForDataUpdate = async () => {
    const wrap = wrapRef.current;
    if (!wrap || !data) return;

    const { layout, renderedMap } = await layoutInstance.updateLayout(data);

    renderInstance.render({
      wrap,
      layout,
      renderedMap,
      onToggle: (node) => {
        toggleNode(node);
        event?.onToggle?.(node);
      },
    });
  };

  useEffect(() => {
    drawGraphForDataUpdate();
  }, [data]);

  useEffect(() => {
    renderInstance.setWheelZoom(Boolean(config?.allowWheelZoom));
  }, [config.allowWheelZoom]);

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
