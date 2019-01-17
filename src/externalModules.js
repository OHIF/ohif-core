let cornerstone = window.cornerstone;
let cornerstoneTools = window.cornerstoneTools;
let cornerstoneWADOImageLoader = window.cornerstoneWADOImageLoader;
let cornerstoneMath = window.cornerstoneMath;

const external = {
  set cornerstone(cs) {
    cornerstone = cs;
  },
  get cornerstone() {
    return cornerstone;
  },
  set cornerstoneTools(tools) {
    cornerstoneTools = tools;
  },
  get cornerstoneTools() {
    return cornerstoneTools;
  },
  set cornerstoneWADOImageLoader(wado) {
    cornerstoneWADOImageLoader = wado;
  },
  get cornerstoneWADOImageLoader() {
    return cornerstoneWADOImageLoader;
  },
  set cornerstoneMath(math) {
    cornerstoneMath = math;
  },
  get cornerstoneMath() {
    return cornerstoneMath;
  }
};

export default external;
