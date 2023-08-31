import { BORDER_RADIUS, NODE_SPACE } from './config';

export const createTowerRadiusPath = (
  link: {
    source: Pick<INode, 'x' | 'y'>;
    target: Pick<INode, 'x' | 'y'>;
  },
  nodeHeight: number,
) => {
  const { source, target } = link;
  if (source.x === target.x || source.y === target.y)
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;

  return `M ${source.x} ${source.y} L ${source.x} ${
    source.y + nodeHeight / 2 + NODE_SPACE.y / 2
  } L ${
    source.x < target.x ? target.x - BORDER_RADIUS : target.x + BORDER_RADIUS
  } ${source.y + nodeHeight / 2 + NODE_SPACE.y / 2} Q ${target.x} ${
    source.y + nodeHeight / 2 + NODE_SPACE.y / 2
  } ${target.x} ${
    source.y + nodeHeight / 2 + NODE_SPACE.y / 2 + BORDER_RADIUS
  } L ${target.x} ${target.y}`;
};

export const createDetailTowerPath = (
  link: {
    source: Pick<INode, 'x' | 'y'>;
    target: Pick<INode, 'x' | 'y'>;
  },
  [nodeWidht, nodeHeight]: [number, number],
) => {
  const { source, target } = link;

  return `M ${source.x} ${source.y}  L ${
    source.x - nodeWidht / 2 + nodeWidht / 8
  } ${source.y + nodeHeight / 2} L ${
    source.x - nodeWidht / 2 + nodeWidht / 8
  } ${target.y - BORDER_RADIUS} Q ${source.x - nodeWidht / 2 + nodeWidht / 8} ${
    target.y
  } ${source.x - nodeWidht / 2 + nodeWidht / 8 + BORDER_RADIUS} ${target.y} L ${
    target.x
  } ${target.y}`;
};

export const createLinkId = (link: {
  source: { path: string };
  target: {
    path: string;
  };
}) => `${link.source.path}--${link.target.path}`;

export const preOrderTraverse = (node: INode, cb: (node: INode) => void) => {
  if (!node) return;

  cb(node);

  if (node?.children?.length) {
    for (let i = 0; i < node.children.length; ++i) {
      preOrderTraverse(node.children[i], cb);
    }
  }
};

export const postOrderTraverse = (node: INode, cb: (node: INode) => void) => {
  if (!node) return;

  if (node?.children?.length) {
    for (let i = node.children.length - 1; i >= 0; --i) {
      postOrderTraverse(node.children[i], cb);
    }
  }

  cb(node);
};
