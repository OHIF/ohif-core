export const setToolActive = tool => ({
  type: 'SET_TOOL_ACTIVE',
  tool
});

export const setViewportActive = viewportIndex => ({
  type: 'SET_VIEWPORT_ACTIVE',
  viewportIndex
});

export const setLayout = layout => ({
  type: 'SET_LAYOUT',
  layout
});

const actions = {
  setToolActive,
  setViewportActive,
  setLayout
};

export default actions;
