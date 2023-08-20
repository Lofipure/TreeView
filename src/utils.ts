import { BORDER_RADIUS, NODE_SPACE } from './config';

export const createRadiusPath = (link: {
  source: Pick<INode, 'x' | 'y' | 'height'>;
  target: Pick<INode, 'x' | 'y' | 'height'>;
}) => {
  const { source, target } = link;
  if (source.x === target.x || source.y === target.y)
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;

  const segments = [
    [source.x, source.y],
    [source.x, source.y + source.height / 2 + NODE_SPACE.y],
    [target.x, source.y + source.height / 2 + NODE_SPACE.y],
    [target.x, target.y],
  ];

  const pathSegments = segments
    .map((item, index) => {
      if (index !== 2) return item.join(' ');

      const lastX = segments[index - 1][0];
      const [x, y] = [...item];
      if (lastX === x) return item.join(' ');

      const [x1, y1] = [lastX < x ? x - BORDER_RADIUS : x + BORDER_RADIUS, y],
        [x2, y2] = [x, y + BORDER_RADIUS];

      return `${x1} ${y1} Q ${x} ${y} ${x2} ${y2}`;
    })
    .join(' L ');

  return `M ${pathSegments}`;
};

export const createLinkId = (link: {
  source: { path: string };
  target: {
    path: string;
  };
}) => `${link.source.path}--${link.target.path}`;
