import React from 'react';
import ReactDOM from 'react-dom';
import { BORDER_RADIUS, NODE_SPACE } from './config';
import { INode, Size } from './types';

export const createTowerRadiusPath = (
  link: {
    source: Pick<INode, 'x' | 'y'>;
    target: Pick<INode, 'x' | 'y'>;
  },
  nodeHeight: number,
) => {
  const { source, target } = link;
  if (Math.abs(Number(source.x) - Number(target.x)) < BORDER_RADIUS) {
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }

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
  [nodeWidth, nodeHeight]: [number, number],
) => {
  const { source, target } = link;

  return `M ${source.x} ${source.y}  L ${
    source.x - nodeWidth / 2 + nodeWidth / 8
  } ${source.y + nodeHeight / 2} L ${
    source.x - nodeWidth / 2 + nodeWidth / 8
  } ${target.y - BORDER_RADIUS} Q ${source.x - nodeWidth / 2 + nodeWidth / 8} ${
    target.y
  } ${source.x - nodeWidth / 2 + nodeWidth / 8 + BORDER_RADIUS} ${target.y} L ${
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
  if (!node) {
    return;
  }

  cb(node);

  if (node?.children?.length) {
    for (let i = 0; i < node.children.length; ++i) {
      preOrderTraverse(node.children[i], cb);
    }
  }
};

export const postOrderTraverse = (node: INode, cb: (node: INode) => void) => {
  if (!node) {
    return;
  }

  if (node?.children?.length) {
    for (let i = node.children.length - 1; i >= 0; --i) {
      postOrderTraverse(node.children[i], cb);
    }
  }

  cb(node);
};

export const getElementSize = (
  element: JSX.Element,
  virtualWrap?: HTMLDivElement | null,
): Promise<
  Size & {
    rendered: Node | null | undefined;
  }
> =>
  new Promise((resolve) => {
    if (!virtualWrap) {
      resolve({
        width: 0,
        height: 0,
        rendered: undefined,
      });
      return;
    }
    const wrapEle = document.createElement('div');
    wrapEle.style.display = 'inline-flex';

    virtualWrap?.appendChild(wrapEle);

    ReactDOM.render(element, wrapEle, () => {
      const { width, height } = wrapEle.getBoundingClientRect();
      resolve({
        width,
        height,
        rendered: wrapEle,
      });

      virtualWrap?.removeChild(wrapEle);

      wrapEle.style.display = 'flex';
    });
  });

export const foreignJsx2Element = (
  jsxElement: JSX.Element,
): Promise<SVGForeignObjectElement | null> => {
  return new Promise<SVGForeignObjectElement | null>((resolve) => {
    const wrap = document.createElement('div');

    ReactDOM.render(
      <svg>
        <g>{jsxElement}</g>
      </svg>,
      wrap,
      () => {
        const foreignEle = wrap.firstChild?.firstChild?.firstChild;
        if (foreignEle) {
          resolve(foreignEle as SVGForeignObjectElement);
        } else {
          resolve(null);
        }
      },
    );
  });
};
