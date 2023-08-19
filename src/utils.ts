import { NODE_SPACE } from './config';

export const createPath = (link: ILink) => {
  const { source, target } = link;

  const segments = [
    [source.x, source.y],
    [source.x, source.y + source.height + NODE_SPACE.y / 4],
    [target.x, source.y + source.height + NODE_SPACE.y / 4],
    [target.x, target.y],
  ];

  const pathSegments = segments
    .map((item, index) => {
      if (index !== 2) return item.join(' ');

      const lastX = segments[index - 1][0];
      const [x, y] = [...item];
      if (lastX === x) return item.join(' ');

      const [x1, y1] = [lastX < x ? x - 5 : x + 5, y],
        [x2, y2] = [x, y + 5];

      return `${x1} ${y1} Q ${x} ${y} ${x2} ${y2}`;
    })
    .join(' L ');

  return `M ${pathSegments}`;
};
