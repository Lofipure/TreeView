import { NODE_SPACE } from './config';

const BORDER_RADIUS = 10;

export const createPath = (link: ILink) => {
  const { source, target } = link;

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

export const createLinkId = (link: ILink) =>
  `${link.source.path}--${link.target.path}`;
