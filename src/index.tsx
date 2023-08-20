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
    nodeSpace = NODE_SPACE,
    nodeRender,
  } = props;
  const wrapRef = useRef<HTMLDivElement>(null);

  const { renderInstance, layoutInstance } = useMemo(
    () => ({
      layoutInstance: new Layout({
        nodeSize,
        nodeSpace,
      }),
      renderInstance: new Render({
        folderRender,
        nodeRender,
      }),
    }),
    [],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !data) return;

    const rootNode = layoutInstance.updateLayout(data);

    renderInstance.render({
      wrap,
      rootNode,
      onToggle: (node) => {
        layoutInstance.toggleFold(node);
        renderInstance.toggleFold(node);
      },
    });
  }, [data]);

  useImperativeHandle(ref, () => ({}));

  return <div className="tree-view" ref={wrapRef} />;
});

export default TreeView;
