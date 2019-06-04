import log from '../../log';

const defaultButtons = [
  // {
  //   command: 'Pan',
  //   type: 'tool',
  //   text: 'Pan',
  //   svgUrl: '/icons.svg#icon-tools-pan',
  //   active: false
  // }
];

const tools = (state = { buttons: defaultButtons }, action) => {
  switch (action.type) {
    case 'SET_TOOL_ACTIVE':
      const item = state.buttons.find(button => button.command === action.tool);
      let buttons = [];

      if (item && item.type === 'tool') {
        buttons = state.buttons.map(button => {
          if (button.command === action.tool) {
            button.active = true;
          } else if (button.type === 'tool') {
            button.active = false;
          }

          return button;
        });
      } else {
        buttons = state.buttons;
        log.warn(`Tool ${action.tool} not found`);
      }

      return {
        buttons,
      };
    case 'SET_AVAILABLE_BUTTONS':
      return {
        buttons: action.buttons,
      };
    default:
      return state;
  }
};

export default tools;
