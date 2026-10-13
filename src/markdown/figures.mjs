// A paragraph that holds only an image becomes a <figure>. The image title becomes the caption:
//   ![Alt text for screen readers](./chart.png "Caption the reader sees")

const isBlank = (node) => node.type === 'text' && !node.value.trim();

export const figures = {
  name: 'cetusbi-figures',
  element: {
    filter: ['p'],
    visit(node) {
      const content = node.children.filter((child) => !isBlank(child));
      const img = content[0];
      if (content.length !== 1 || img.type !== 'element' || img.tagName !== 'img') return;

      const { title, ...properties } = img.properties ?? {};
      const caption = typeof title === 'string' && title.trim() ? title.trim() : undefined;

      return {
        type: 'element',
        tagName: 'figure',
        properties: {},
        children: [
          { ...img, properties },
          ...(caption
            ? [{ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] }]
            : []),
        ],
      };
    },
  },
};
