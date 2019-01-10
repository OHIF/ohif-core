import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import dicomParser from 'dicom-parser';
import cornerstoneMath from 'cornerstone-math';

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function getBoundingBox(context, textLines, x, y, options) {
  if (Object.prototype.toString.call(textLines) !== '[object Array]') {
    textLines = [textLines];
  }

  var padding = 5;
  var font = cornerstoneTools.textStyle.getFont();
  var fontSize = cornerstoneTools.textStyle.getFontSize();
  context.save();
  context.font = font;
  context.textBaseline = 'top'; // Find the longest text width in the array of text data

  var maxWidth = 0;
  textLines.forEach(function (text) {
    // Get the text width in the current font
    var width = context.measureText(text).width; // Find the maximum with for all the text rows;

    maxWidth = Math.max(maxWidth, width);
  }); // Calculate the bounding box for this text box

  var boundingBox = {
    width: maxWidth + padding * 2,
    height: padding + textLines.length * (fontSize + padding)
  };

  if (options && options.centering && options.centering.x === true) {
    x -= boundingBox.width / 2;
  }

  if (options && options.centering && options.centering.y === true) {
    y -= boundingBox.height / 2;
  }

  boundingBox.left = x;
  boundingBox.top = y;
  context.restore(); // Return the bounding box so it can be used for pointNearHandle

  return boundingBox;
}

function pixelToPage(element, position) {
  var enabledElement = cornerstone.getEnabledElement(element);
  var result = {
    x: 0,
    y: 0
  }; // Stop here if the cornerstone element is not enabled or position is not an object

  if (!enabledElement || _typeof(position) !== 'object') {
    return result;
  }

  var canvas = enabledElement.canvas;
  var canvasOffset = $(canvas).offset();
  result.x += canvasOffset.left;
  result.y += canvasOffset.top;
  var canvasPosition = cornerstone.pixelToCanvas(element, position);
  result.x += canvasPosition.x;
  result.y += canvasPosition.y;
  return result;
}

function repositionTextBox(eventData, measurementData, config) {
  // Stop here if it's not a measurement creating
  if (!measurementData.isCreating) {
    return;
  }

  var element = eventData.element;
  var enabledElement = cornerstone.getEnabledElement(element);
  var image = enabledElement.image;
  var allowedBorders = OHIF.uiSettings.autoPositionMeasurementsTextCallOuts;
  var allow = {
    T: !allowedBorders || allowedBorders.includes('T'),
    R: !allowedBorders || allowedBorders.includes('R'),
    B: !allowedBorders || allowedBorders.includes('B'),
    L: !allowedBorders || allowedBorders.includes('L')
  };

  var getAvailableBlankAreas = function getAvailableBlankAreas(enabledElement, labelWidth, labelHeight) {
    var element = enabledElement.element,
        canvas = enabledElement.canvas,
        image = enabledElement.image;
    var topLeft = cornerstone.pixelToCanvas(element, {
      x: 0,
      y: 0
    });
    var bottomRight = cornerstone.pixelToCanvas(element, {
      x: image.width,
      y: image.height
    });
    var $canvas = $(canvas);
    var canvasWidth = $canvas.outerWidth();
    var canvasHeight = $canvas.outerHeight();
    var result = {};
    result['x-1'] = allow.L && topLeft.x > labelWidth;
    result['y-1'] = allow.T && topLeft.y > labelHeight;
    result.x1 = allow.R && canvasWidth - bottomRight.x > labelWidth;
    result.y1 = allow.B && canvasHeight - bottomRight.y > labelHeight;
    return result;
  };

  var getRenderingInformation = function getRenderingInformation(limits, tool) {
    var mid = {};
    mid.x = limits.x / 2;
    mid.y = limits.y / 2;
    var directions = {};
    directions.x = tool.x < mid.x ? -1 : 1;
    directions.y = tool.y < mid.y ? -1 : 1;
    var diffX = directions.x < 0 ? tool.x : limits.x - tool.x;
    var diffY = directions.y < 0 ? tool.y : limits.y - tool.y;
    var cornerAxis = diffY < diffX ? 'y' : 'x';
    var map = {
      'x-1': 'L',
      'y-1': 'T',
      x1: 'R',
      y1: 'B'
    };
    var current = 0;

    while (current < 4 && !allow[map[cornerAxis + directions[cornerAxis]]]) {
      // Invert the direction for the next iteration
      directions[cornerAxis] *= -1; // Invert the tempCornerAxis

      cornerAxis = cornerAxis === 'x' ? 'y' : 'x';
      current++;
    }

    return {
      directions: directions,
      cornerAxis: cornerAxis
    };
  };

  var calculateAxisCenter = function calculateAxisCenter(axis, start, end) {
    var a = start[axis];
    var b = end[axis];
    var lowest = Math.min(a, b);
    var highest = Math.max(a, b);
    return lowest + (highest - lowest) / 2;
  };

  var getTextBoxSizeInPixels = function getTextBoxSizeInPixels(element, bounds) {
    var topLeft = cornerstone.pageToPixel(element, 0, 0);
    var bottomRight = cornerstone.pageToPixel(element, bounds.x, bounds.y);
    return {
      x: bottomRight.x - topLeft.x,
      y: bottomRight.y - topLeft.y
    };
  };

  function getTextBoxOffset(config, cornerAxis, toolAxis, boxSize) {
    config = config || {};
    var centering = config.centering || {};
    var centerX = !!centering.x;
    var centerY = !!centering.y;
    var halfBoxSizeX = boxSize.x / 2;
    var halfBoxSizeY = boxSize.y / 2;
    var offset = {
      x: [],
      y: []
    };

    if (cornerAxis === 'x') {
      var offsetY = centerY ? 0 : halfBoxSizeY;
      offset.x[-1] = centerX ? halfBoxSizeX : 0;
      offset.x[1] = centerX ? -halfBoxSizeX : -boxSize.x;
      offset.y[-1] = offsetY;
      offset.y[1] = offsetY;
    } else {
      var offsetX = centerX ? 0 : halfBoxSizeX;
      offset.x[-1] = offsetX;
      offset.x[1] = offsetX;
      offset.y[-1] = centerY ? halfBoxSizeY : 0;
      offset.y[1] = centerY ? -halfBoxSizeY : -boxSize.y;
    }

    return offset;
  }

  var handles = measurementData.handles;
  var textBox = handles.textBox;
  var $canvas = $(enabledElement.canvas);
  var canvasWidth = $canvas.outerWidth();
  var canvasHeight = $canvas.outerHeight();
  var offset = $canvas.offset();
  var canvasDimensions = {
    x: canvasWidth,
    y: canvasHeight
  };
  var bounds = {};
  bounds.x = textBox.boundingBox.width;
  bounds.y = textBox.boundingBox.height;

  var getHandlePosition = function getHandlePosition(key) {
    var _handles$key = handles[key],
        x = _handles$key.x,
        y = _handles$key.y;
    return {
      x: x,
      y: y
    };
  };

  var start = getHandlePosition('start');
  var end = getHandlePosition('end');
  var tool = {};
  tool.x = calculateAxisCenter('x', start, end);
  tool.y = calculateAxisCenter('y', start, end);
  var limits = {};
  limits.x = image.width;
  limits.y = image.height;

  var _getRenderingInformat = getRenderingInformation(limits, tool),
      directions = _getRenderingInformat.directions,
      cornerAxis = _getRenderingInformat.cornerAxis;

  var availableAreas = getAvailableBlankAreas(enabledElement, bounds.x, bounds.y);
  var tempDirections = Object.assign({}, directions);
  var tempCornerAxis = cornerAxis;
  var foundPlace = false;
  var current = 0;

  while (current < 4) {
    if (availableAreas[tempCornerAxis + tempDirections[tempCornerAxis]]) {
      foundPlace = true;
      break;
    } // Invert the direction for the next iteration


    tempDirections[tempCornerAxis] *= -1; // Invert the tempCornerAxis

    tempCornerAxis = tempCornerAxis === 'x' ? 'y' : 'x';
    current++;
  }

  var cornerAxisPosition;

  if (foundPlace) {
    directions = Object.assign({}, directions, tempDirections);
    cornerAxis = tempCornerAxis;
    cornerAxisPosition = directions[cornerAxis] < 0 ? 0 : limits[cornerAxis];
  } else {
    limits = Object.assign({}, limits, canvasDimensions);
    var toolPositionOnCanvas = cornerstone.pixelToCanvas(element, tool);
    var renderingInformation = getRenderingInformation(limits, toolPositionOnCanvas);
    directions = renderingInformation.directions;
    cornerAxis = renderingInformation.cornerAxis;
    var position = {
      x: directions.x < 0 ? offset.left : offset.left + canvasWidth,
      y: directions.y < 0 ? offset.top : offset.top + canvasHeight
    };
    var pixelPosition = cornerstone.pageToPixel(element, position.x, position.y);
    cornerAxisPosition = pixelPosition[cornerAxis];
  }

  var toolAxis = cornerAxis === 'x' ? 'y' : 'x';
  var boxSize = getTextBoxSizeInPixels(element, bounds);
  textBox[cornerAxis] = cornerAxisPosition;
  textBox[toolAxis] = tool[toolAxis]; // Adjust the text box position reducing its size from the corner axis

  var textBoxOffset = getTextBoxOffset(config, cornerAxis, toolAxis, boxSize);
  textBox[cornerAxis] += textBoxOffset[cornerAxis][directions[cornerAxis]]; // Preventing the text box from partially going outside the canvas area

  var topLeft = cornerstone.pixelToCanvas(element, textBox);
  var bottomRight = {
    x: topLeft.x + bounds.x,
    y: topLeft.y + bounds.y
  };
  var canvasBorders = {
    x0: offset.left,
    y0: offset.top,
    x1: offset.left + canvasWidth,
    y1: offset.top + canvasHeight
  };

  if (topLeft[toolAxis] < 0) {
    var x = canvasBorders.x0;
    var y = canvasBorders.y0;

    var _pixelPosition = cornerstone.pageToPixel(element, x, y);

    textBox[toolAxis] = _pixelPosition[toolAxis];
  } else if (bottomRight[toolAxis] > canvasDimensions[toolAxis]) {
    var _x = canvasBorders.x1 - bounds.x;

    var _y = canvasBorders.y1 - bounds.y;

    var _pixelPosition2 = cornerstone.pageToPixel(element, _x, _y);

    textBox[toolAxis] = _pixelPosition2[toolAxis];
  }
}

// TODO: Deprecate since we have the same thing in dcmjs?
var NUMBER = 'number';
var STRING = 'string';
var REGEX_TAG = /^x[0-9a-fx]{8}$/;
var DICOMTagDescriptions = Object.create(Object.prototype, {
  _descriptions: {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Object.create(null)
  },
  tagNumberToString: {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function tagNumberToString(tag) {
      var string; // by default, undefined is returned...

      if (this.isValidTagNumber(tag)) {
        // if it's a number, build its hexadecimal representation...
        string = 'x' + ('00000000' + tag.toString(16)).substr(-8);
      }

      return string;
    }
  },
  isValidTagNumber: {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function isValidTagNumber(tag) {
      return _typeof(tag) === NUMBER && tag >= 0 && tag <= 0xffffffff;
    }
  },
  isValidTag: {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function isValidTag(tag) {
      return _typeof(tag) === STRING ? REGEX_TAG.test(tag) : this.isValidTagNumber(tag);
    }
  },
  find: {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function find(name) {
      var description; // by default, undefined is returned...

      if (_typeof(name) !== STRING) {
        // if it's a number, a tag string will be returned...
        name = this.tagNumberToString(name);
      }

      if (_typeof(name) === STRING) {
        description = this._descriptions[name];
      }

      return description;
    }
  },
  init: {
    configurable: false,
    enumerable: true,
    writable: false,
    value: function init(descriptionMap) {
      var _hasOwn = Object.prototype.hasOwnProperty;
      var _descriptions = this._descriptions;

      for (var tag in descriptionMap) {
        if (_hasOwn.call(descriptionMap, tag)) {
          if (!this.isValidTag(tag)) {
            // Skip in case tag is not valid...
            console.info("DICOMTagDescriptions: Invalid tag \"".concat(tag, "\"..."));
            continue;
          }

          if (tag in _descriptions) {
            // Skip in case the tag is duplicated...
            console.info("DICOMTagDescriptions: Duplicated tag \"".concat(tag, "\"..."));
            continue;
          } // Save keyword...


          var keyword = descriptionMap[tag]; // Create a description entry and freeze it...

          var entry = Object.create(null);
          entry.tag = tag;
          entry.keyword = keyword;
          Object.freeze(entry); // Add tag references to entry...

          _descriptions[tag] = entry; // Add keyword references to entry (if not present already)...

          if (keyword in _descriptions) {
            var currentEntry = _descriptions[keyword];
            console.info("DICOMTagDescriptions: Using <".concat(currentEntry.tag, ",").concat(currentEntry.keyword, "> instead of <").concat(entry.tag, ",").concat(entry.keyword, "> for keyword \"").concat(keyword, "\"..."));
          } else {
            _descriptions[keyword] = entry;
          }
        }
      } // Freeze internal description map...


      Object.freeze(_descriptions); // Freeze itself...

      Object.freeze(this);
    }
  }
});
/**
 * Map with DICOM Tag Descriptions
 */

var initialTagDescriptionMap = {
  x00020000: 'FileMetaInfoGroupLength',
  x00020001: 'FileMetaInfoVersion',
  x00020002: 'MediaStorageSOPClassUID',
  x00020003: 'MediaStorageSOPInstanceUID',
  x00020010: 'TransferSyntaxUID',
  x00020012: 'ImplementationClassUID',
  x00020013: 'ImplementationVersionName',
  x00020016: 'SourceApplicationEntityTitle',
  x00020100: 'PrivateInformationCreatorUID',
  x00020102: 'PrivateInformation',
  x00041130: 'FileSetID',
  x00041141: 'FileSetDescriptorFileID',
  x00041142: 'SpecificCharacterSetOfFile',
  x00041200: 'FirstDirectoryRecordOffset',
  x00041202: 'LastDirectoryRecordOffset',
  x00041212: 'FileSetConsistencyFlag',
  x00041220: 'DirectoryRecordSequence',
  x00041400: 'OffsetOfNextDirectoryRecord',
  x00041410: 'RecordInUseFlag',
  x00041420: 'LowerLevelDirectoryEntityOffset',
  x00041430: 'DirectoryRecordType',
  x00041432: 'PrivateRecordUID',
  x00041500: 'ReferencedFileID',
  x00041504: 'MRDRDirectoryRecordOffset',
  x00041510: 'ReferencedSOPClassUIDInFile',
  x00041511: 'ReferencedSOPInstanceUIDInFile',
  x00041512: 'ReferencedTransferSyntaxUIDInFile',
  x0004151a: 'ReferencedRelatedSOPClassUIDInFile',
  x00041600: 'NumberOfReferences',
  x00080000: 'IdentifyingGroupLength',
  x00080001: 'LengthToEnd',
  x00080005: 'SpecificCharacterSet',
  x00080006: 'LanguageCodeSequence',
  x00080008: 'ImageType',
  x00080010: 'RecognitionCode',
  x00080012: 'InstanceCreationDate',
  x00080013: 'InstanceCreationTime',
  x00080014: 'InstanceCreatorUID',
  x00080016: 'SOPClassUID',
  x00080018: 'SOPInstanceUID',
  x0008001a: 'RelatedGeneralSOPClassUID',
  x0008001b: 'OriginalSpecializedSOPClassUID',
  x00080020: 'StudyDate',
  x00080021: 'SeriesDate',
  x00080022: 'AcquisitionDate',
  x00080023: 'ContentDate',
  x00080024: 'OverlayDate',
  x00080025: 'CurveDate',
  x0008002a: 'AcquisitionDateTime',
  x00080030: 'StudyTime',
  x00080031: 'SeriesTime',
  x00080032: 'AcquisitionTime',
  x00080033: 'ContentTime',
  x00080034: 'OverlayTime',
  x00080035: 'CurveTime',
  x00080040: 'DataSetType',
  x00080041: 'DataSetSubtype',
  x00080042: 'NuclearMedicineSeriesType',
  x00080050: 'AccessionNumber',
  x00080052: 'QueryRetrieveLevel',
  x00080054: 'RetrieveAETitle',
  x00080056: 'InstanceAvailability',
  x00080058: 'FailedSOPInstanceUIDList',
  x00080060: 'Modality',
  x00080061: 'ModalitiesInStudy',
  x00080062: 'SOPClassesInStudy',
  x00080064: 'ConversionType',
  x00080068: 'PresentationIntentType',
  x00080070: 'Manufacturer',
  x00080080: 'InstitutionName',
  x00080081: 'InstitutionAddress',
  x00080082: 'InstitutionCodeSequence',
  x00080090: 'ReferringPhysicianName',
  x00080092: 'ReferringPhysicianAddress',
  x00080094: 'ReferringPhysicianTelephoneNumber',
  x00080096: 'ReferringPhysicianIDSequence',
  x00080100: 'CodeValue',
  x00080102: 'CodingSchemeDesignator',
  x00080103: 'CodingSchemeVersion',
  x00080104: 'CodeMeaning',
  x00080105: 'MappingResource',
  x00080106: 'ContextGroupVersion',
  x00080107: 'ContextGroupLocalVersion',
  x0008010b: 'ContextGroupExtensionFlag',
  x0008010c: 'CodingSchemeUID',
  x0008010d: 'ContextGroupExtensionCreatorUID',
  x0008010f: 'ContextIdentifier',
  x00080110: 'CodingSchemeIDSequence',
  x00080112: 'CodingSchemeRegistry',
  x00080114: 'CodingSchemeExternalID',
  x00080115: 'CodingSchemeName',
  x00080116: 'CodingSchemeResponsibleOrganization',
  x00080117: 'ContextUID',
  x00080201: 'TimezoneOffsetFromUTC',
  x00081000: 'NetworkID',
  x00081010: 'StationName',
  x00081030: 'StudyDescription',
  x00081032: 'ProcedureCodeSequence',
  x0008103e: 'SeriesDescription',
  x00081040: 'InstitutionalDepartmentName',
  x00081048: 'PhysiciansOfRecord',
  x00081049: 'PhysiciansOfRecordIDSequence',
  x00081050: 'PerformingPhysicianName',
  x00081052: 'PerformingPhysicianIDSequence',
  x00081060: 'NameOfPhysicianReadingStudy',
  x00081062: 'PhysicianReadingStudyIDSequence',
  x00081070: 'OperatorsName',
  x00081072: 'OperatorIDSequence',
  x00081080: 'AdmittingDiagnosesDescription',
  x00081084: 'AdmittingDiagnosesCodeSequence',
  x00081090: 'ManufacturersModelName',
  x00081100: 'ReferencedResultsSequence',
  x00081110: 'ReferencedStudySequence',
  x00081111: 'ReferencedPerformedProcedureStepSequence',
  x00081115: 'ReferencedSeriesSequence',
  x00081120: 'ReferencedPatientSequence',
  x00081125: 'ReferencedVisitSequence',
  x00081130: 'ReferencedOverlaySequence',
  x0008113a: 'ReferencedWaveformSequence',
  x00081140: 'ReferencedImageSequence',
  x00081145: 'ReferencedCurveSequence',
  x0008114a: 'ReferencedInstanceSequence',
  x00081150: 'ReferencedSOPClassUID',
  x00081155: 'ReferencedSOPInstanceUID',
  x0008115a: 'SOPClassesSupported',
  x00081160: 'ReferencedFrameNumber',
  x00081161: 'SimpleFrameList',
  x00081162: 'CalculatedFrameList',
  x00081163: 'TimeRange',
  x00081164: 'FrameExtractionSequence',
  x00081195: 'TransactionUID',
  x00081197: 'FailureReason',
  x00081198: 'FailedSOPSequence',
  x00081199: 'ReferencedSOPSequence',
  x00081200: 'OtherReferencedStudiesSequence',
  x00081250: 'RelatedSeriesSequence',
  x00082110: 'LossyImageCompressionRetired',
  x00082111: 'DerivationDescription',
  x00082112: 'SourceImageSequence',
  x00082120: 'StageName',
  x00082122: 'StageNumber',
  x00082124: 'NumberOfStages',
  x00082127: 'ViewName',
  x00082128: 'ViewNumber',
  x00082129: 'NumberOfEventTimers',
  x0008212a: 'NumberOfViewsInStage',
  x00082130: 'EventElapsedTimes',
  x00082132: 'EventTimerNames',
  x00082133: 'EventTimerSequence',
  x00082134: 'EventTimeOffset',
  x00082135: 'EventCodeSequence',
  x00082142: 'StartTrim',
  x00082143: 'StopTrim',
  x00082144: 'RecommendedDisplayFrameRate',
  x00082200: 'TransducerPosition',
  x00082204: 'TransducerOrientation',
  x00082208: 'AnatomicStructure',
  x00082218: 'AnatomicRegionSequence',
  x00082220: 'AnatomicRegionModifierSequence',
  x00082228: 'PrimaryAnatomicStructureSequence',
  x00082229: 'AnatomicStructureOrRegionSequence',
  x00082230: 'AnatomicStructureModifierSequence',
  x00082240: 'TransducerPositionSequence',
  x00082242: 'TransducerPositionModifierSequence',
  x00082244: 'TransducerOrientationSequence',
  x00082246: 'TransducerOrientationModifierSeq',
  x00082253: 'AnatomicEntrancePortalCodeSeqTrial',
  x00082255: 'AnatomicApproachDirCodeSeqTrial',
  x00082256: 'AnatomicPerspectiveDescrTrial',
  x00082257: 'AnatomicPerspectiveCodeSeqTrial',
  x00083001: 'AlternateRepresentationSequence',
  x00083010: 'IrradiationEventUID',
  x00084000: 'IdentifyingComments',
  x00089007: 'FrameType',
  x00089092: 'ReferencedImageEvidenceSequence',
  x00089121: 'ReferencedRawDataSequence',
  x00089123: 'CreatorVersionUID',
  x00089124: 'DerivationImageSequence',
  x00089154: 'SourceImageEvidenceSequence',
  x00089205: 'PixelPresentation',
  x00089206: 'VolumetricProperties',
  x00089207: 'VolumeBasedCalculationTechnique',
  x00089208: 'ComplexImageComponent',
  x00089209: 'AcquisitionContrast',
  x00089215: 'DerivationCodeSequence',
  x00089237: 'GrayscalePresentationStateSequence',
  x00089410: 'ReferencedOtherPlaneSequence',
  x00089458: 'FrameDisplaySequence',
  x00089459: 'RecommendedDisplayFrameRateInFloat',
  x00089460: 'SkipFrameRangeFlag',
  // x00091001: 'FullFidelity',
  // x00091002: 'SuiteID',
  // x00091004: 'ProductID',
  // x00091027: 'ImageActualDate',
  // x00091030: 'ServiceID',
  // x00091031: 'MobileLocationNumber',
  // x000910e3: 'EquipmentUID',
  // x000910e6: 'GenesisVersionNow',
  // x000910e7: 'ExamRecordChecksum',
  // x000910e9: 'ActualSeriesDataTimeStamp',
  x00100000: 'PatientGroupLength',
  x00100010: 'PatientName',
  x00100020: 'PatientID',
  x00100021: 'IssuerOfPatientID',
  x00100022: 'TypeOfPatientID',
  x00100030: 'PatientBirthDate',
  x00100032: 'PatientBirthTime',
  x00100040: 'PatientSex',
  x00100050: 'PatientInsurancePlanCodeSequence',
  x00100101: 'PatientPrimaryLanguageCodeSeq',
  x00100102: 'PatientPrimaryLanguageCodeModSeq',
  x00101000: 'OtherPatientIDs',
  x00101001: 'OtherPatientNames',
  x00101002: 'OtherPatientIDsSequence',
  x00101005: 'PatientBirthName',
  x00101010: 'PatientAge',
  x00101020: 'PatientSize',
  x00101030: 'PatientWeight',
  x00101040: 'PatientAddress',
  x00101050: 'InsurancePlanIdentification',
  x00101060: 'PatientMotherBirthName',
  x00101080: 'MilitaryRank',
  x00101081: 'BranchOfService',
  x00101090: 'MedicalRecordLocator',
  x00102000: 'MedicalAlerts',
  x00102110: 'Allergies',
  x00102150: 'CountryOfResidence',
  x00102152: 'RegionOfResidence',
  x00102154: 'PatientTelephoneNumbers',
  x00102160: 'EthnicGroup',
  x00102180: 'Occupation',
  x001021a0: 'SmokingStatus',
  x001021b0: 'AdditionalPatientHistory',
  x001021c0: 'PregnancyStatus',
  x001021d0: 'LastMenstrualDate',
  x001021f0: 'PatientReligiousPreference',
  x00102201: 'PatientSpeciesDescription',
  x00102202: 'PatientSpeciesCodeSequence',
  x00102203: 'PatientSexNeutered',
  x00102210: 'AnatomicalOrientationType',
  x00102292: 'PatientBreedDescription',
  x00102293: 'PatientBreedCodeSequence',
  x00102294: 'BreedRegistrationSequence',
  x00102295: 'BreedRegistrationNumber',
  x00102296: 'BreedRegistryCodeSequence',
  x00102297: 'ResponsiblePerson',
  x00102298: 'ResponsiblePersonRole',
  x00102299: 'ResponsibleOrganization',
  x00104000: 'PatientComments',
  x00109431: 'ExaminedBodyThickness',
  x00111010: 'PatientStatus',
  x00120010: 'ClinicalTrialSponsorName',
  x00120020: 'ClinicalTrialProtocolID',
  x00120021: 'ClinicalTrialProtocolName',
  x00120030: 'ClinicalTrialSiteID',
  x00120031: 'ClinicalTrialSiteName',
  x00120040: 'ClinicalTrialSubjectID',
  x00120042: 'ClinicalTrialSubjectReadingID',
  x00120050: 'ClinicalTrialTimePointID',
  x00120051: 'ClinicalTrialTimePointDescription',
  x00120060: 'ClinicalTrialCoordinatingCenter',
  x00120062: 'PatientIdentityRemoved',
  x00120063: 'DeidentificationMethod',
  x00120064: 'DeidentificationMethodCodeSequence',
  x00120071: 'ClinicalTrialSeriesID',
  x00120072: 'ClinicalTrialSeriesDescription',
  x00120084: 'DistributionType',
  x00120085: 'ConsentForDistributionFlag',
  x00180000: 'AcquisitionGroupLength',
  x00180010: 'ContrastBolusAgent',
  x00180012: 'ContrastBolusAgentSequence',
  x00180014: 'ContrastBolusAdministrationRoute',
  x00180015: 'BodyPartExamined',
  x00180020: 'ScanningSequence',
  x00180021: 'SequenceVariant',
  x00180022: 'ScanOptions',
  x00180023: 'MRAcquisitionType',
  x00180024: 'SequenceName',
  x00180025: 'AngioFlag',
  x00180026: 'InterventionDrugInformationSeq',
  x00180027: 'InterventionDrugStopTime',
  x00180028: 'InterventionDrugDose',
  x00180029: 'InterventionDrugSequence',
  x0018002a: 'AdditionalDrugSequence',
  x00180030: 'Radionuclide',
  x00180031: 'Radiopharmaceutical',
  x00180032: 'EnergyWindowCenterline',
  x00180033: 'EnergyWindowTotalWidth',
  x00180034: 'InterventionDrugName',
  x00180035: 'InterventionDrugStartTime',
  x00180036: 'InterventionSequence',
  x00180037: 'TherapyType',
  x00180038: 'InterventionStatus',
  x00180039: 'TherapyDescription',
  x0018003a: 'InterventionDescription',
  x00180040: 'CineRate',
  x00180042: 'InitialCineRunState',
  x00180050: 'SliceThickness',
  x00180060: 'KVP',
  x00180070: 'CountsAccumulated',
  x00180071: 'AcquisitionTerminationCondition',
  x00180072: 'EffectiveDuration',
  x00180073: 'AcquisitionStartCondition',
  x00180074: 'AcquisitionStartConditionData',
  x00180075: 'AcquisitionEndConditionData',
  x00180080: 'RepetitionTime',
  x00180081: 'EchoTime',
  x00180082: 'InversionTime',
  x00180083: 'NumberOfAverages',
  x00180084: 'ImagingFrequency',
  x00180085: 'ImagedNucleus',
  x00180086: 'EchoNumber',
  x00180087: 'MagneticFieldStrength',
  x00180088: 'SpacingBetweenSlices',
  x00180089: 'NumberOfPhaseEncodingSteps',
  x00180090: 'DataCollectionDiameter',
  x00180091: 'EchoTrainLength',
  x00180093: 'PercentSampling',
  x00180094: 'PercentPhaseFieldOfView',
  x00180095: 'PixelBandwidth',
  x00181000: 'DeviceSerialNumber',
  x00181002: 'DeviceUID',
  x00181003: 'DeviceID',
  x00181004: 'PlateID',
  x00181005: 'GeneratorID',
  x00181006: 'GridID',
  x00181007: 'CassetteID',
  x00181008: 'GantryID',
  x00181010: 'SecondaryCaptureDeviceID',
  x00181011: 'HardcopyCreationDeviceID',
  x00181012: 'DateOfSecondaryCapture',
  x00181014: 'TimeOfSecondaryCapture',
  x00181016: 'SecondaryCaptureDeviceManufacturer',
  x00181017: 'HardcopyDeviceManufacturer',
  x00181018: 'SecondaryCaptureDeviceModelName',
  x00181019: 'SecondaryCaptureDeviceSoftwareVers',
  x0018101a: 'HardcopyDeviceSoftwareVersion',
  x0018101b: 'HardcopyDeviceModelName',
  x00181020: 'SoftwareVersion',
  x00181022: 'VideoImageFormatAcquired',
  x00181023: 'DigitalImageFormatAcquired',
  x00181030: 'ProtocolName',
  x00181040: 'ContrastBolusRoute',
  x00181041: 'ContrastBolusVolume',
  x00181042: 'ContrastBolusStartTime',
  x00181043: 'ContrastBolusStopTime',
  x00181044: 'ContrastBolusTotalDose',
  x00181045: 'SyringeCounts',
  x00181046: 'ContrastFlowRate',
  x00181047: 'ContrastFlowDuration',
  x00181048: 'ContrastBolusIngredient',
  x00181049: 'ContrastBolusConcentration',
  x00181050: 'SpatialResolution',
  x00181060: 'TriggerTime',
  x00181061: 'TriggerSourceOrType',
  x00181062: 'NominalInterval',
  x00181063: 'FrameTime',
  x00181064: 'CardiacFramingType',
  x00181065: 'FrameTimeVector',
  x00181066: 'FrameDelay',
  x00181067: 'ImageTriggerDelay',
  x00181068: 'MultiplexGroupTimeOffset',
  x00181069: 'TriggerTimeOffset',
  x0018106a: 'SynchronizationTrigger',
  x0018106c: 'SynchronizationChannel',
  x0018106e: 'TriggerSamplePosition',
  x00181070: 'RadiopharmaceuticalRoute',
  x00181071: 'RadiopharmaceuticalVolume',
  x00181072: 'RadiopharmaceuticalStartTime',
  x00181073: 'RadiopharmaceuticalStopTime',
  x00181074: 'RadionuclideTotalDose',
  x00181075: 'RadionuclideHalfLife',
  x00181076: 'RadionuclidePositronFraction',
  x00181077: 'RadiopharmaceuticalSpecActivity',
  x00181078: 'RadiopharmaceuticalStartDateTime',
  x00181079: 'RadiopharmaceuticalStopDateTime',
  x00181080: 'BeatRejectionFlag',
  x00181081: 'LowRRValue',
  x00181082: 'HighRRValue',
  x00181083: 'IntervalsAcquired',
  x00181084: 'IntervalsRejected',
  x00181085: 'PVCRejection',
  x00181086: 'SkipBeats',
  x00181088: 'HeartRate',
  x00181090: 'CardiacNumberOfImages',
  x00181094: 'TriggerWindow',
  x00181100: 'ReconstructionDiameter',
  x00181110: 'DistanceSourceToDetector',
  x00181111: 'DistanceSourceToPatient',
  x00181114: 'EstimatedRadiographicMagnification',
  x00181120: 'GantryDetectorTilt',
  x00181121: 'GantryDetectorSlew',
  x00181130: 'TableHeight',
  x00181131: 'TableTraverse',
  x00181134: 'TableMotion',
  x00181135: 'TableVerticalIncrement',
  x00181136: 'TableLateralIncrement',
  x00181137: 'TableLongitudinalIncrement',
  x00181138: 'TableAngle',
  x0018113a: 'TableType',
  x00181140: 'RotationDirection',
  x00181141: 'AngularPosition',
  x00181142: 'RadialPosition',
  x00181143: 'ScanArc',
  x00181144: 'AngularStep',
  x00181145: 'CenterOfRotationOffset',
  x00181146: 'RotationOffset',
  x00181147: 'FieldOfViewShape',
  x00181149: 'FieldOfViewDimensions',
  x00181150: 'ExposureTime',
  x00181151: 'XRayTubeCurrent',
  x00181152: 'Exposure',
  x00181153: 'ExposureInMicroAmpSec',
  x00181154: 'AveragePulseWidth',
  x00181155: 'RadiationSetting',
  x00181156: 'RectificationType',
  x0018115a: 'RadiationMode',
  x0018115e: 'ImageAreaDoseProduct',
  x00181160: 'FilterType',
  x00181161: 'TypeOfFilters',
  x00181162: 'IntensifierSize',
  x00181164: 'ImagerPixelSpacing',
  x00181166: 'Grid',
  x00181170: 'GeneratorPower',
  x00181180: 'CollimatorGridName',
  x00181181: 'CollimatorType',
  x00181182: 'FocalDistance',
  x00181183: 'XFocusCenter',
  x00181184: 'YFocusCenter',
  x00181190: 'FocalSpots',
  x00181191: 'AnodeTargetMaterial',
  x001811a0: 'BodyPartThickness',
  x001811a2: 'CompressionForce',
  x00181200: 'DateOfLastCalibration',
  x00181201: 'TimeOfLastCalibration',
  x00181210: 'ConvolutionKernel',
  x00181240: 'UpperLowerPixelValues',
  x00181242: 'ActualFrameDuration',
  x00181243: 'CountRate',
  x00181244: 'PreferredPlaybackSequencing',
  x00181250: 'ReceiveCoilName',
  x00181251: 'TransmitCoilName',
  x00181260: 'PlateType',
  x00181261: 'PhosphorType',
  x00181300: 'ScanVelocity',
  x00181301: 'WholeBodyTechnique',
  x00181302: 'ScanLength',
  x00181310: 'AcquisitionMatrix',
  x00181312: 'InPlanePhaseEncodingDirection',
  x00181314: 'FlipAngle',
  x00181315: 'VariableFlipAngleFlag',
  x00181316: 'SAR',
  x00181318: 'DB-Dt',
  x00181400: 'AcquisitionDeviceProcessingDescr',
  x00181401: 'AcquisitionDeviceProcessingCode',
  x00181402: 'CassetteOrientation',
  x00181403: 'CassetteSize',
  x00181404: 'ExposuresOnPlate',
  x00181405: 'RelativeXRayExposure',
  x00181450: 'ColumnAngulation',
  x00181460: 'TomoLayerHeight',
  x00181470: 'TomoAngle',
  x00181480: 'TomoTime',
  x00181490: 'TomoType',
  x00181491: 'TomoClass',
  x00181495: 'NumberOfTomosynthesisSourceImages',
  x00181500: 'PositionerMotion',
  x00181508: 'PositionerType',
  x00181510: 'PositionerPrimaryAngle',
  x00181511: 'PositionerSecondaryAngle',
  x00181520: 'PositionerPrimaryAngleIncrement',
  x00181521: 'PositionerSecondaryAngleIncrement',
  x00181530: 'DetectorPrimaryAngle',
  x00181531: 'DetectorSecondaryAngle',
  x00181600: 'ShutterShape',
  x00181602: 'ShutterLeftVerticalEdge',
  x00181604: 'ShutterRightVerticalEdge',
  x00181606: 'ShutterUpperHorizontalEdge',
  x00181608: 'ShutterLowerHorizontalEdge',
  x00181610: 'CenterOfCircularShutter',
  x00181612: 'RadiusOfCircularShutter',
  x00181620: 'VerticesOfPolygonalShutter',
  x00181622: 'ShutterPresentationValue',
  x00181623: 'ShutterOverlayGroup',
  x00181624: 'ShutterPresentationColorCIELabVal',
  x00181700: 'CollimatorShape',
  x00181702: 'CollimatorLeftVerticalEdge',
  x00181704: 'CollimatorRightVerticalEdge',
  x00181706: 'CollimatorUpperHorizontalEdge',
  x00181708: 'CollimatorLowerHorizontalEdge',
  x00181710: 'CenterOfCircularCollimator',
  x00181712: 'RadiusOfCircularCollimator',
  x00181720: 'VerticesOfPolygonalCollimator',
  x00181800: 'AcquisitionTimeSynchronized',
  x00181801: 'TimeSource',
  x00181802: 'TimeDistributionProtocol',
  x00181803: 'NTPSourceAddress',
  x00182001: 'PageNumberVector',
  x00182002: 'FrameLabelVector',
  x00182003: 'FramePrimaryAngleVector',
  x00182004: 'FrameSecondaryAngleVector',
  x00182005: 'SliceLocationVector',
  x00182006: 'DisplayWindowLabelVector',
  x00182010: 'NominalScannedPixelSpacing',
  x00182020: 'DigitizingDeviceTransportDirection',
  x00182030: 'RotationOfScannedFilm',
  x00183100: 'IVUSAcquisition',
  x00183101: 'IVUSPullbackRate',
  x00183102: 'IVUSGatedRate',
  x00183103: 'IVUSPullbackStartFrameNumber',
  x00183104: 'IVUSPullbackStopFrameNumber',
  x00183105: 'LesionNumber',
  x00184000: 'AcquisitionComments',
  x00185000: 'OutputPower',
  x00185010: 'TransducerData',
  x00185012: 'FocusDepth',
  x00185020: 'ProcessingFunction',
  x00185021: 'PostprocessingFunction',
  x00185022: 'MechanicalIndex',
  x00185024: 'BoneThermalIndex',
  x00185026: 'CranialThermalIndex',
  x00185027: 'SoftTissueThermalIndex',
  x00185028: 'SoftTissueFocusThermalIndex',
  x00185029: 'SoftTissueSurfaceThermalIndex',
  x00185030: 'DynamicRange',
  x00185040: 'TotalGain',
  x00185050: 'DepthOfScanField',
  x00185100: 'PatientPosition',
  x00185101: 'ViewPosition',
  x00185104: 'ProjectionEponymousNameCodeSeq',
  x00185210: 'ImageTransformationMatrix',
  x00185212: 'ImageTranslationVector',
  x00186000: 'Sensitivity',
  x00186011: 'SequenceOfUltrasoundRegions',
  x00186012: 'RegionSpatialFormat',
  x00186014: 'RegionDataType',
  x00186016: 'RegionFlags',
  x00186018: 'RegionLocationMinX0',
  x0018601a: 'RegionLocationMinY0',
  x0018601c: 'RegionLocationMaxX1',
  x0018601e: 'RegionLocationMaxY1',
  x00186020: 'ReferencePixelX0',
  x00186022: 'ReferencePixelY0',
  x00186024: 'PhysicalUnitsXDirection',
  x00186026: 'PhysicalUnitsYDirection',
  x00186028: 'ReferencePixelPhysicalValueX',
  x0018602a: 'ReferencePixelPhysicalValueY',
  x0018602c: 'PhysicalDeltaX',
  x0018602e: 'PhysicalDeltaY',
  x00186030: 'TransducerFrequency',
  x00186031: 'TransducerType',
  x00186032: 'PulseRepetitionFrequency',
  x00186034: 'DopplerCorrectionAngle',
  x00186036: 'SteeringAngle',
  x00186038: 'DopplerSampleVolumeXPosRetired',
  x00186039: 'DopplerSampleVolumeXPosition',
  x0018603a: 'DopplerSampleVolumeYPosRetired',
  x0018603b: 'DopplerSampleVolumeYPosition',
  x0018603c: 'TMLinePositionX0Retired',
  x0018603d: 'TMLinePositionX0',
  x0018603e: 'TMLinePositionY0Retired',
  x0018603f: 'TMLinePositionY0',
  x00186040: 'TMLinePositionX1Retired',
  x00186041: 'TMLinePositionX1',
  x00186042: 'TMLinePositionY1Retired',
  x00186043: 'TMLinePositionY1',
  x00186044: 'PixelComponentOrganization',
  x00186046: 'PixelComponentMask',
  x00186048: 'PixelComponentRangeStart',
  x0018604a: 'PixelComponentRangeStop',
  x0018604c: 'PixelComponentPhysicalUnits',
  x0018604e: 'PixelComponentDataType',
  x00186050: 'NumberOfTableBreakPoints',
  x00186052: 'TableOfXBreakPoints',
  x00186054: 'TableOfYBreakPoints',
  x00186056: 'NumberOfTableEntries',
  x00186058: 'TableOfPixelValues',
  x0018605a: 'TableOfParameterValues',
  x00186060: 'RWaveTimeVector',
  x00187000: 'DetectorConditionsNominalFlag',
  x00187001: 'DetectorTemperature',
  x00187004: 'DetectorType',
  x00187005: 'DetectorConfiguration',
  x00187006: 'DetectorDescription',
  x00187008: 'DetectorMode',
  x0018700a: 'DetectorID',
  x0018700c: 'DateOfLastDetectorCalibration',
  x0018700e: 'TimeOfLastDetectorCalibration',
  x00187010: 'DetectorExposuresSinceCalibration',
  x00187011: 'DetectorExposuresSinceManufactured',
  x00187012: 'DetectorTimeSinceLastExposure',
  x00187014: 'DetectorActiveTime',
  x00187016: 'DetectorActiveOffsetFromExposure',
  x0018701a: 'DetectorBinning',
  x00187020: 'DetectorElementPhysicalSize',
  x00187022: 'DetectorElementSpacing',
  x00187024: 'DetectorActiveShape',
  x00187026: 'DetectorActiveDimensions',
  x00187028: 'DetectorActiveOrigin',
  x0018702a: 'DetectorManufacturerName',
  x0018702b: 'DetectorManufacturersModelName',
  x00187030: 'FieldOfViewOrigin',
  x00187032: 'FieldOfViewRotation',
  x00187034: 'FieldOfViewHorizontalFlip',
  x00187040: 'GridAbsorbingMaterial',
  x00187041: 'GridSpacingMaterial',
  x00187042: 'GridThickness',
  x00187044: 'GridPitch',
  x00187046: 'GridAspectRatio',
  x00187048: 'GridPeriod',
  x0018704c: 'GridFocalDistance',
  x00187050: 'FilterMaterial',
  x00187052: 'FilterThicknessMinimum',
  x00187054: 'FilterThicknessMaximum',
  x00187060: 'ExposureControlMode',
  x00187062: 'ExposureControlModeDescription',
  x00187064: 'ExposureStatus',
  x00187065: 'PhototimerSetting',
  x00188150: 'ExposureTimeInMicroSec',
  x00188151: 'XRayTubeCurrentInMicroAmps',
  x00189004: 'ContentQualification',
  x00189005: 'PulseSequenceName',
  x00189006: 'MRImagingModifierSequence',
  x00189008: 'EchoPulseSequence',
  x00189009: 'InversionRecovery',
  x00189010: 'FlowCompensation',
  x00189011: 'MultipleSpinEcho',
  x00189012: 'MultiPlanarExcitation',
  x00189014: 'PhaseContrast',
  x00189015: 'TimeOfFlightContrast',
  x00189016: 'Spoiling',
  x00189017: 'SteadyStatePulseSequence',
  x00189018: 'EchoPlanarPulseSequence',
  x00189019: 'TagAngleFirstAxis',
  x00189020: 'MagnetizationTransfer',
  x00189021: 'T2Preparation',
  x00189022: 'BloodSignalNulling',
  x00189024: 'SaturationRecovery',
  x00189025: 'SpectrallySelectedSuppression',
  x00189026: 'SpectrallySelectedExcitation',
  x00189027: 'SpatialPresaturation',
  x00189028: 'Tagging',
  x00189029: 'OversamplingPhase',
  x00189030: 'TagSpacingFirstDimension',
  x00189032: 'GeometryOfKSpaceTraversal',
  x00189033: 'SegmentedKSpaceTraversal',
  x00189034: 'RectilinearPhaseEncodeReordering',
  x00189035: 'TagThickness',
  x00189036: 'PartialFourierDirection',
  x00189037: 'CardiacSynchronizationTechnique',
  x00189041: 'ReceiveCoilManufacturerName',
  x00189042: 'MRReceiveCoilSequence',
  x00189043: 'ReceiveCoilType',
  x00189044: 'QuadratureReceiveCoil',
  x00189045: 'MultiCoilDefinitionSequence',
  x00189046: 'MultiCoilConfiguration',
  x00189047: 'MultiCoilElementName',
  x00189048: 'MultiCoilElementUsed',
  x00189049: 'MRTransmitCoilSequence',
  x00189050: 'TransmitCoilManufacturerName',
  x00189051: 'TransmitCoilType',
  x00189052: 'SpectralWidth',
  x00189053: 'ChemicalShiftReference',
  x00189054: 'VolumeLocalizationTechnique',
  x00189058: 'MRAcquisitionFrequencyEncodeSteps',
  x00189059: 'Decoupling',
  x00189060: 'DecoupledNucleus',
  x00189061: 'DecouplingFrequency',
  x00189062: 'DecouplingMethod',
  x00189063: 'DecouplingChemicalShiftReference',
  x00189064: 'KSpaceFiltering',
  x00189065: 'TimeDomainFiltering',
  x00189066: 'NumberOfZeroFills',
  x00189067: 'BaselineCorrection',
  x00189069: 'ParallelReductionFactorInPlane',
  x00189070: 'CardiacRRIntervalSpecified',
  x00189073: 'AcquisitionDuration',
  x00189074: 'FrameAcquisitionDateTime',
  x00189075: 'DiffusionDirectionality',
  x00189076: 'DiffusionGradientDirectionSequence',
  x00189077: 'ParallelAcquisition',
  x00189078: 'ParallelAcquisitionTechnique',
  x00189079: 'InversionTimes',
  x00189080: 'MetaboliteMapDescription',
  x00189081: 'PartialFourier',
  x00189082: 'EffectiveEchoTime',
  x00189083: 'MetaboliteMapCodeSequence',
  x00189084: 'ChemicalShiftSequence',
  x00189085: 'CardiacSignalSource',
  x00189087: 'DiffusionBValue',
  x00189089: 'DiffusionGradientOrientation',
  x00189090: 'VelocityEncodingDirection',
  x00189091: 'VelocityEncodingMinimumValue',
  x00189093: 'NumberOfKSpaceTrajectories',
  x00189094: 'CoverageOfKSpace',
  x00189095: 'SpectroscopyAcquisitionPhaseRows',
  x00189096: 'ParallelReductFactorInPlaneRetired',
  x00189098: 'TransmitterFrequency',
  x00189100: 'ResonantNucleus',
  x00189101: 'FrequencyCorrection',
  x00189103: 'MRSpectroscopyFOV-GeometrySequence',
  x00189104: 'SlabThickness',
  x00189105: 'SlabOrientation',
  x00189106: 'MidSlabPosition',
  x00189107: 'MRSpatialSaturationSequence',
  x00189112: 'MRTimingAndRelatedParametersSeq',
  x00189114: 'MREchoSequence',
  x00189115: 'MRModifierSequence',
  x00189117: 'MRDiffusionSequence',
  x00189118: 'CardiacTriggerSequence',
  x00189119: 'MRAveragesSequence',
  x00189125: 'MRFOV-GeometrySequence',
  x00189126: 'VolumeLocalizationSequence',
  x00189127: 'SpectroscopyAcquisitionDataColumns',
  x00189147: 'DiffusionAnisotropyType',
  x00189151: 'FrameReferenceDateTime',
  x00189152: 'MRMetaboliteMapSequence',
  x00189155: 'ParallelReductionFactorOutOfPlane',
  x00189159: 'SpectroscopyOutOfPlanePhaseSteps',
  x00189166: 'BulkMotionStatus',
  x00189168: 'ParallelReductionFactSecondInPlane',
  x00189169: 'CardiacBeatRejectionTechnique',
  x00189170: 'RespiratoryMotionCompTechnique',
  x00189171: 'RespiratorySignalSource',
  x00189172: 'BulkMotionCompensationTechnique',
  x00189173: 'BulkMotionSignalSource',
  x00189174: 'ApplicableSafetyStandardAgency',
  x00189175: 'ApplicableSafetyStandardDescr',
  x00189176: 'OperatingModeSequence',
  x00189177: 'OperatingModeType',
  x00189178: 'OperatingMode',
  x00189179: 'SpecificAbsorptionRateDefinition',
  x00189180: 'GradientOutputType',
  x00189181: 'SpecificAbsorptionRateValue',
  x00189182: 'GradientOutput',
  x00189183: 'FlowCompensationDirection',
  x00189184: 'TaggingDelay',
  x00189185: 'RespiratoryMotionCompTechDescr',
  x00189186: 'RespiratorySignalSourceID',
  x00189195: 'ChemicalShiftsMinIntegrateLimitHz',
  x00189196: 'ChemicalShiftsMaxIntegrateLimitHz',
  x00189197: 'MRVelocityEncodingSequence',
  x00189198: 'FirstOrderPhaseCorrection',
  x00189199: 'WaterReferencedPhaseCorrection',
  x00189200: 'MRSpectroscopyAcquisitionType',
  x00189214: 'RespiratoryCyclePosition',
  x00189217: 'VelocityEncodingMaximumValue',
  x00189218: 'TagSpacingSecondDimension',
  x00189219: 'TagAngleSecondAxis',
  x00189220: 'FrameAcquisitionDuration',
  x00189226: 'MRImageFrameTypeSequence',
  x00189227: 'MRSpectroscopyFrameTypeSequence',
  x00189231: 'MRAcqPhaseEncodingStepsInPlane',
  x00189232: 'MRAcqPhaseEncodingStepsOutOfPlane',
  x00189234: 'SpectroscopyAcqPhaseColumns',
  x00189236: 'CardiacCyclePosition',
  x00189239: 'SpecificAbsorptionRateSequence',
  x00189240: 'RFEchoTrainLength',
  x00189241: 'GradientEchoTrainLength',
  x00189295: 'ChemicalShiftsMinIntegrateLimitPPM',
  x00189296: 'ChemicalShiftsMaxIntegrateLimitPPM',
  x00189301: 'CTAcquisitionTypeSequence',
  x00189302: 'AcquisitionType',
  x00189303: 'TubeAngle',
  x00189304: 'CTAcquisitionDetailsSequence',
  x00189305: 'RevolutionTime',
  x00189306: 'SingleCollimationWidth',
  x00189307: 'TotalCollimationWidth',
  x00189308: 'CTTableDynamicsSequence',
  x00189309: 'TableSpeed',
  x00189310: 'TableFeedPerRotation',
  x00189311: 'SpiralPitchFactor',
  x00189312: 'CTGeometrySequence',
  x00189313: 'DataCollectionCenterPatient',
  x00189314: 'CTReconstructionSequence',
  x00189315: 'ReconstructionAlgorithm',
  x00189316: 'ConvolutionKernelGroup',
  x00189317: 'ReconstructionFieldOfView',
  x00189318: 'ReconstructionTargetCenterPatient',
  x00189319: 'ReconstructionAngle',
  x00189320: 'ImageFilter',
  x00189321: 'CTExposureSequence',
  x00189322: 'ReconstructionPixelSpacing',
  x00189323: 'ExposureModulationType',
  x00189324: 'EstimatedDoseSaving',
  x00189325: 'CTXRayDetailsSequence',
  x00189326: 'CTPositionSequence',
  x00189327: 'TablePosition',
  x00189328: 'ExposureTimeInMilliSec',
  x00189329: 'CTImageFrameTypeSequence',
  x00189330: 'XRayTubeCurrentInMilliAmps',
  x00189332: 'ExposureInMilliAmpSec',
  x00189333: 'ConstantVolumeFlag',
  x00189334: 'FluoroscopyFlag',
  x00189335: 'SourceToDataCollectionCenterDist',
  x00189337: 'ContrastBolusAgentNumber',
  x00189338: 'ContrastBolusIngredientCodeSeq',
  x00189340: 'ContrastAdministrationProfileSeq',
  x00189341: 'ContrastBolusUsageSequence',
  x00189342: 'ContrastBolusAgentAdministered',
  x00189343: 'ContrastBolusAgentDetected',
  x00189344: 'ContrastBolusAgentPhase',
  x00189345: 'CTDIvol',
  x00189346: 'CTDIPhantomTypeCodeSequence',
  x00189351: 'CalciumScoringMassFactorPatient',
  x00189352: 'CalciumScoringMassFactorDevice',
  x00189353: 'EnergyWeightingFactor',
  x00189360: 'CTAdditionalXRaySourceSequence',
  x00189401: 'ProjectionPixelCalibrationSequence',
  x00189402: 'DistanceSourceToIsocenter',
  x00189403: 'DistanceObjectToTableTop',
  x00189404: 'ObjectPixelSpacingInCenterOfBeam',
  x00189405: 'PositionerPositionSequence',
  x00189406: 'TablePositionSequence',
  x00189407: 'CollimatorShapeSequence',
  x00189412: 'XA-XRFFrameCharacteristicsSequence',
  x00189417: 'FrameAcquisitionSequence',
  x00189420: 'XRayReceptorType',
  x00189423: 'AcquisitionProtocolName',
  x00189424: 'AcquisitionProtocolDescription',
  x00189425: 'ContrastBolusIngredientOpaque',
  x00189426: 'DistanceReceptorPlaneToDetHousing',
  x00189427: 'IntensifierActiveShape',
  x00189428: 'IntensifierActiveDimensions',
  x00189429: 'PhysicalDetectorSize',
  x00189430: 'PositionOfIsocenterProjection',
  x00189432: 'FieldOfViewSequence',
  x00189433: 'FieldOfViewDescription',
  x00189434: 'ExposureControlSensingRegionsSeq',
  x00189435: 'ExposureControlSensingRegionShape',
  x00189436: 'ExposureControlSensRegionLeftEdge',
  x00189437: 'ExposureControlSensRegionRightEdge',
  x00189440: 'CenterOfCircExposControlSensRegion',
  x00189441: 'RadiusOfCircExposControlSensRegion',
  x00189447: 'ColumnAngulationPatient',
  x00189449: 'BeamAngle',
  x00189451: 'FrameDetectorParametersSequence',
  x00189452: 'CalculatedAnatomyThickness',
  x00189455: 'CalibrationSequence',
  x00189456: 'ObjectThicknessSequence',
  x00189457: 'PlaneIdentification',
  x00189461: 'FieldOfViewDimensionsInFloat',
  x00189462: 'IsocenterReferenceSystemSequence',
  x00189463: 'PositionerIsocenterPrimaryAngle',
  x00189464: 'PositionerIsocenterSecondaryAngle',
  x00189465: 'PositionerIsocenterDetRotAngle',
  x00189466: 'TableXPositionToIsocenter',
  x00189467: 'TableYPositionToIsocenter',
  x00189468: 'TableZPositionToIsocenter',
  x00189469: 'TableHorizontalRotationAngle',
  x00189470: 'TableHeadTiltAngle',
  x00189471: 'TableCradleTiltAngle',
  x00189472: 'FrameDisplayShutterSequence',
  x00189473: 'AcquiredImageAreaDoseProduct',
  x00189474: 'CArmPositionerTabletopRelationship',
  x00189476: 'XRayGeometrySequence',
  x00189477: 'IrradiationEventIDSequence',
  x00189504: 'XRay3DFrameTypeSequence',
  x00189506: 'ContributingSourcesSequence',
  x00189507: 'XRay3DAcquisitionSequence',
  x00189508: 'PrimaryPositionerScanArc',
  x00189509: 'SecondaryPositionerScanArc',
  x00189510: 'PrimaryPositionerScanStartAngle',
  x00189511: 'SecondaryPositionerScanStartAngle',
  x00189514: 'PrimaryPositionerIncrement',
  x00189515: 'SecondaryPositionerIncrement',
  x00189516: 'StartAcquisitionDateTime',
  x00189517: 'EndAcquisitionDateTime',
  x00189524: 'ApplicationName',
  x00189525: 'ApplicationVersion',
  x00189526: 'ApplicationManufacturer',
  x00189527: 'AlgorithmType',
  x00189528: 'AlgorithmDescription',
  x00189530: 'XRay3DReconstructionSequence',
  x00189531: 'ReconstructionDescription',
  x00189538: 'PerProjectionAcquisitionSequence',
  x00189601: 'DiffusionBMatrixSequence',
  x00189602: 'DiffusionBValueXX',
  x00189603: 'DiffusionBValueXY',
  x00189604: 'DiffusionBValueXZ',
  x00189605: 'DiffusionBValueYY',
  x00189606: 'DiffusionBValueYZ',
  x00189607: 'DiffusionBValueZZ',
  x00189701: 'DecayCorrectionDateTime',
  x00189715: 'StartDensityThreshold',
  x00189722: 'TerminationTimeThreshold',
  x00189725: 'DetectorGeometry',
  x00189727: 'AxialDetectorDimension',
  x00189735: 'PETPositionSequence',
  x00189739: 'NumberOfIterations',
  x00189740: 'NumberOfSubsets',
  x00189751: 'PETFrameTypeSequence',
  x00189756: 'ReconstructionType',
  x00189758: 'DecayCorrected',
  x00189759: 'AttenuationCorrected',
  x00189760: 'ScatterCorrected',
  x00189761: 'DeadTimeCorrected',
  x00189762: 'GantryMotionCorrected',
  x00189763: 'PatientMotionCorrected',
  x00189765: 'RandomsCorrected',
  x00189767: 'SensitivityCalibrated',
  x00189801: 'DepthsOfFocus',
  x00189804: 'ExclusionStartDatetime',
  x00189805: 'ExclusionDuration',
  x00189807: 'ImageDataTypeSequence',
  x00189808: 'DataType',
  x0018980b: 'AliasedDataType',
  x0018a001: 'ContributingEquipmentSequence',
  x0018a002: 'ContributionDateTime',
  x0018a003: 'ContributionDescription',
  // x00191002: 'NumberOfCellsIInDetector',
  // x00191003: 'CellNumberAtTheta',
  // x00191004: 'CellSpacing',
  // x0019100f: 'HorizFrameOfRef',
  // x00191011: 'SeriesContrast',
  // x00191012: 'LastPseq',
  // x00191013: 'StartNumberForBaseline',
  // x00191014: 'EndNumberForBaseline',
  // x00191015: 'StartNumberForEnhancedScans',
  // x00191016: 'EndNumberForEnhancedScans',
  // x00191017: 'SeriesPlane',
  // x00191018: 'FirstScanRas',
  // x00191019: 'FirstScanLocation',
  // x0019101a: 'LastScanRas',
  // x0019101b: 'LastScanLoc',
  // x0019101e: 'DisplayFieldOfView',
  // x00191023: 'TableSpeed',
  // x00191024: 'MidScanTime',
  // x00191025: 'MidScanFlag',
  // x00191026: 'DegreesOfAzimuth',
  // x00191027: 'GantryPeriod',
  // x0019102a: 'XRayOnPosition',
  // x0019102b: 'XRayOffPosition',
  // x0019102c: 'NumberOfTriggers',
  // x0019102e: 'AngleOfFirstView',
  // x0019102f: 'TriggerFrequency',
  // x00191039: 'ScanFOVType',
  // x00191040: 'StatReconFlag',
  // x00191041: 'ComputeType',
  // x00191042: 'SegmentNumber',
  // x00191043: 'TotalSegmentsRequested',
  // x00191044: 'InterscanDelay',
  // x00191047: 'ViewCompressionFactor',
  // x0019104a: 'TotalNoOfRefChannels',
  // x0019104b: 'DataSizeForScanData',
  // x00191052: 'ReconPostProcflag',
  // x00191057: 'CTWaterNumber',
  // x00191058: 'CTBoneNumber',
  // x0019105a: 'AcquisitionDuration',
  // x0019105e: 'NumberOfChannels',
  // x0019105f: 'IncrementBetweenChannels',
  // x00191060: 'StartingView',
  // x00191061: 'NumberOfViews',
  // x00191062: 'IncrementBetweenViews',
  // x0019106a: 'DependantOnNoViewsProcessed',
  // x0019106b: 'FieldOfViewInDetectorCells',
  // x00191070: 'ValueOfBackProjectionButton',
  // x00191071: 'SetIfFatqEstimatesWereUsed',
  // x00191072: 'ZChanAvgOverViews',
  // x00191073: 'AvgOfLeftRefChansOverViews',
  // x00191074: 'MaxLeftChanOverViews',
  // x00191075: 'AvgOfRightRefChansOverViews',
  // x00191076: 'MaxRightChanOverViews',
  // x0019107d: 'SecondEcho',
  // x0019107e: 'NumberOfEchoes',
  // x0019107f: 'TableDelta',
  // x00191081: 'Contiguous',
  // x00191084: 'PeakSAR',
  // x00191085: 'MonitorSAR',
  // x00191087: 'CardiacRepetitionTime',
  // x00191088: 'ImagesPerCardiacCycle',
  // x0019108a: 'ActualReceiveGainAnalog',
  // x0019108b: 'ActualReceiveGainDigital',
  // x0019108d: 'DelayAfterTrigger',
  // x0019108f: 'Swappf',
  // x00191090: 'PauseInterval',
  // x00191091: 'PulseTime',
  // x00191092: 'SliceOffsetOnFreqAxis',
  // x00191093: 'CenterFrequency',
  // x00191094: 'TransmitGain',
  // x00191095: 'AnalogReceiverGain',
  // x00191096: 'DigitalReceiverGain',
  // x00191097: 'BitmapDefiningCVs',
  // x00191098: 'CenterFreqMethod',
  // x0019109b: 'PulseSeqMode',
  // x0019109c: 'PulseSeqName',
  // x0019109d: 'PulseSeqDate',
  // x0019109e: 'InternalPulseSeqName',
  // x0019109f: 'TransmittingCoil',
  // x001910a0: 'SurfaceCoilType',
  // x001910a1: 'ExtremityCoilFlag',
  // x001910a2: 'RawDataRunNumber',
  // x001910a3: 'CalibratedFieldStrength',
  // x001910a4: 'SATFatWaterBone',
  // x001910a5: 'ReceiveBandwidth',
  // x001910a7: 'UserData01',
  // x001910a8: 'UserData02',
  // x001910a9: 'UserData03',
  // x001910aa: 'UserData04',
  // x001910ab: 'UserData05',
  // x001910ac: 'UserData06',
  // x001910ad: 'UserData07',
  // x001910ae: 'UserData08',
  // x001910af: 'UserData09',
  // x001910b0: 'UserData10',
  // x001910b1: 'UserData11',
  // x001910b2: 'UserData12',
  // x001910b3: 'UserData13',
  // x001910b4: 'UserData14',
  // x001910b5: 'UserData15',
  // x001910b6: 'UserData16',
  // x001910b7: 'UserData17',
  // x001910b8: 'UserData18',
  // x001910b9: 'UserData19',
  // x001910ba: 'UserData20',
  // x001910bb: 'UserData21',
  // x001910bc: 'UserData22',
  // x001910bd: 'UserData23',
  // x001910be: 'ProjectionAngle',
  // x001910c0: 'SaturationPlanes',
  // x001910c1: 'SurfaceCoilIntensity',
  // x001910c2: 'SATLocationR',
  // x001910c3: 'SATLocationL',
  // x001910c4: 'SATLocationA',
  // x001910c5: 'SATLocationP',
  // x001910c6: 'SATLocationH',
  // x001910c7: 'SATLocationF',
  // x001910c8: 'SATThicknessR-L',
  // x001910c9: 'SATThicknessA-P',
  // x001910ca: 'SATThicknessH-F',
  // x001910cb: 'PrescribedFlowAxis',
  // x001910cc: 'VelocityEncoding',
  // x001910cd: 'ThicknessDisclaimer',
  // x001910ce: 'PrescanType',
  // x001910cf: 'PrescanStatus',
  // x001910d0: 'RawDataType',
  // x001910d2: 'ProjectionAlgorithm',
  // x001910d3: 'ProjectionAlgorithm',
  // x001910d5: 'FractionalEcho',
  // x001910d6: 'PrepPulse',
  // x001910d7: 'CardiacPhases',
  // x001910d8: 'VariableEchoflag',
  // x001910d9: 'ConcatenatedSAT',
  // x001910da: 'ReferenceChannelUsed',
  // x001910db: 'BackProjectorCoefficient',
  // x001910dc: 'PrimarySpeedCorrectionUsed',
  // x001910dd: 'OverrangeCorrectionUsed',
  // x001910de: 'DynamicZAlphaValue',
  // x001910df: 'UserData',
  // x001910e0: 'UserData',
  // x001910e2: 'VelocityEncodeScale',
  // x001910f2: 'FastPhases',
  // x001910f9: 'TransmissionGain',
  x00200000: 'RelationshipGroupLength',
  x0020000d: 'StudyInstanceUID',
  x0020000e: 'SeriesInstanceUID',
  x00200010: 'StudyID',
  x00200011: 'SeriesNumber',
  x00200012: 'AcquisitionNumber',
  x00200013: 'InstanceNumber',
  x00200014: 'IsotopeNumber',
  x00200015: 'PhaseNumber',
  x00200016: 'IntervalNumber',
  x00200017: 'TimeSlotNumber',
  x00200018: 'AngleNumber',
  x00200019: 'ItemNumber',
  x00200020: 'PatientOrientation',
  x00200022: 'OverlayNumber',
  x00200024: 'CurveNumber',
  x00200026: 'LookupTableNumber',
  x00200030: 'ImagePosition',
  x00200032: 'ImagePositionPatient',
  x00200035: 'ImageOrientation',
  x00200037: 'ImageOrientationPatient',
  x00200050: 'Location',
  x00200052: 'FrameOfReferenceUID',
  x00200060: 'Laterality',
  x00200062: 'ImageLaterality',
  x00200070: 'ImageGeometryType',
  x00200080: 'MaskingImage',
  x00200100: 'TemporalPositionIdentifier',
  x00200105: 'NumberOfTemporalPositions',
  x00200110: 'TemporalResolution',
  x00200200: 'SynchronizationFrameOfReferenceUID',
  x00201000: 'SeriesInStudy',
  x00201001: 'AcquisitionsInSeries',
  x00201002: 'ImagesInAcquisition',
  x00201003: 'ImagesInSeries',
  x00201004: 'AcquisitionsInStudy',
  x00201005: 'ImagesInStudy',
  x00201020: 'Reference',
  x00201040: 'PositionReferenceIndicator',
  x00201041: 'SliceLocation',
  x00201070: 'OtherStudyNumbers',
  x00201200: 'NumberOfPatientRelatedStudies',
  x00201202: 'NumberOfPatientRelatedSeries',
  x00201204: 'NumberOfPatientRelatedInstances',
  x00201206: 'NumberOfStudyRelatedSeries',
  x00201208: 'NumberOfStudyRelatedInstances',
  x00201209: 'NumberOfSeriesRelatedInstances',
  x002031xx: 'SourceImageIDs',
  x00203401: 'ModifyingDeviceID',
  x00203402: 'ModifiedImageID',
  x00203403: 'ModifiedImageDate',
  x00203404: 'ModifyingDeviceManufacturer',
  x00203405: 'ModifiedImageTime',
  x00203406: 'ModifiedImageDescription',
  x00204000: 'ImageComments',
  x00205000: 'OriginalImageIdentification',
  x00205002: 'OriginalImageIdentNomenclature',
  x00209056: 'StackID',
  x00209057: 'InStackPositionNumber',
  x00209071: 'FrameAnatomySequence',
  x00209072: 'FrameLaterality',
  x00209111: 'FrameContentSequence',
  x00209113: 'PlanePositionSequence',
  x00209116: 'PlaneOrientationSequence',
  x00209128: 'TemporalPositionIndex',
  x00209153: 'TriggerDelayTime',
  x00209156: 'FrameAcquisitionNumber',
  x00209157: 'DimensionIndexValues',
  x00209158: 'FrameComments',
  x00209161: 'ConcatenationUID',
  x00209162: 'InConcatenationNumber',
  x00209163: 'InConcatenationTotalNumber',
  x00209164: 'DimensionOrganizationUID',
  x00209165: 'DimensionIndexPointer',
  x00209167: 'FunctionalGroupPointer',
  x00209213: 'DimensionIndexPrivateCreator',
  x00209221: 'DimensionOrganizationSequence',
  x00209222: 'DimensionIndexSequence',
  x00209228: 'ConcatenationFrameOffsetNumber',
  x00209238: 'FunctionalGroupPrivateCreator',
  x00209241: 'NominalPercentageOfCardiacPhase',
  x00209245: 'NominalPercentOfRespiratoryPhase',
  x00209246: 'StartingRespiratoryAmplitude',
  x00209247: 'StartingRespiratoryPhase',
  x00209248: 'EndingRespiratoryAmplitude',
  x00209249: 'EndingRespiratoryPhase',
  x00209250: 'RespiratoryTriggerType',
  x00209251: 'RRIntervalTimeNominal',
  x00209252: 'ActualCardiacTriggerDelayTime',
  x00209253: 'RespiratorySynchronizationSequence',
  x00209254: 'RespiratoryIntervalTime',
  x00209255: 'NominalRespiratoryTriggerDelayTime',
  x00209256: 'RespiratoryTriggerDelayThreshold',
  x00209257: 'ActualRespiratoryTriggerDelayTime',
  x00209301: 'ImagePositionVolume',
  x00209302: 'ImageOrientationVolume',
  x00209308: 'ApexPosition',
  x00209421: 'DimensionDescriptionLabel',
  x00209450: 'PatientOrientationInFrameSequence',
  x00209453: 'FrameLabel',
  x00209518: 'AcquisitionIndex',
  x00209529: 'ContributingSOPInstancesRefSeq',
  x00209536: 'ReconstructionIndex',
  // x00211003: 'SeriesFromWhichPrescribed',
  // x00211005: 'GenesisVersionNow',
  // x00211007: 'SeriesRecordChecksum',
  // x00211018: 'GenesisVersionNow',
  // x00211019: 'AcqreconRecordChecksum',
  // x00211020: 'TableStartLocation',
  // x00211035: 'SeriesFromWhichPrescribed',
  // x00211036: 'ImageFromWhichPrescribed',
  // x00211037: 'ScreenFormat',
  // x0021104a: 'AnatomicalReferenceForScout',
  // x0021104f: 'LocationsInAcquisition',
  // x00211050: 'GraphicallyPrescribed',
  // x00211051: 'RotationFromSourceXRot',
  // x00211052: 'RotationFromSourceYRot',
  // x00211053: 'RotationFromSourceZRot',
  // x00211054: 'ImagePosition',
  // x00211055: 'ImageOrientation',
  // x00211056: 'IntegerSlop',
  // x00211057: 'IntegerSlop',
  // x00211058: 'IntegerSlop',
  // x00211059: 'IntegerSlop',
  // x0021105a: 'IntegerSlop',
  // x0021105b: 'FloatSlop',
  // x0021105c: 'FloatSlop',
  // x0021105d: 'FloatSlop',
  // x0021105e: 'FloatSlop',
  // x0021105f: 'FloatSlop',
  // x00211081: 'AutoWindowLevelAlpha',
  // x00211082: 'AutoWindowLevelBeta',
  // x00211083: 'AutoWindowLevelWindow',
  // x00211084: 'ToWindowLevelLevel',
  // x00211090: 'TubeFocalSpotPosition',
  // x00211091: 'BiopsyPosition',
  // x00211092: 'BiopsyTLocation',
  // x00211093: 'BiopsyRefLocation',
  x00220001: 'LightPathFilterPassThroughWavelen',
  x00220002: 'LightPathFilterPassBand',
  x00220003: 'ImagePathFilterPassThroughWavelen',
  x00220004: 'ImagePathFilterPassBand',
  x00220005: 'PatientEyeMovementCommanded',
  x00220006: 'PatientEyeMovementCommandCodeSeq',
  x00220007: 'SphericalLensPower',
  x00220008: 'CylinderLensPower',
  x00220009: 'CylinderAxis',
  x0022000a: 'EmmetropicMagnification',
  x0022000b: 'IntraOcularPressure',
  x0022000c: 'HorizontalFieldOfView',
  x0022000d: 'PupilDilated',
  x0022000e: 'DegreeOfDilation',
  x00220010: 'StereoBaselineAngle',
  x00220011: 'StereoBaselineDisplacement',
  x00220012: 'StereoHorizontalPixelOffset',
  x00220013: 'StereoVerticalPixelOffset',
  x00220014: 'StereoRotation',
  x00220015: 'AcquisitionDeviceTypeCodeSequence',
  x00220016: 'IlluminationTypeCodeSequence',
  x00220017: 'LightPathFilterTypeStackCodeSeq',
  x00220018: 'ImagePathFilterTypeStackCodeSeq',
  x00220019: 'LensesCodeSequence',
  x0022001a: 'ChannelDescriptionCodeSequence',
  x0022001b: 'RefractiveStateSequence',
  x0022001c: 'MydriaticAgentCodeSequence',
  x0022001d: 'RelativeImagePositionCodeSequence',
  x00220020: 'StereoPairsSequence',
  x00220021: 'LeftImageSequence',
  x00220022: 'RightImageSequence',
  x00220030: 'AxialLengthOfTheEye',
  x00220031: 'OphthalmicFrameLocationSequence',
  x00220032: 'ReferenceCoordinates',
  x00220035: 'DepthSpatialResolution',
  x00220036: 'MaximumDepthDistortion',
  x00220037: 'AlongScanSpatialResolution',
  x00220038: 'MaximumAlongScanDistortion',
  x00220039: 'OphthalmicImageOrientation',
  x00220041: 'DepthOfTransverseImage',
  x00220042: 'MydriaticAgentConcUnitsSeq',
  x00220048: 'AcrossScanSpatialResolution',
  x00220049: 'MaximumAcrossScanDistortion',
  x0022004e: 'MydriaticAgentConcentration',
  x00220055: 'IlluminationWaveLength',
  x00220056: 'IlluminationPower',
  x00220057: 'IlluminationBandwidth',
  x00220058: 'MydriaticAgentSequence',
  // x00231001: 'NumberOfSeriesInStudy',
  // x00231002: 'NumberOfUnarchivedSeries',
  // x00231010: 'ReferenceImageField',
  // x00231050: 'SummaryImage',
  // x00231070: 'StartTimeSecsInFirstAxial',
  // x00231074: 'NoofUpdatesToHeader',
  // x0023107d: 'IndicatesIfTheStudyHasCompleteInfo',
  // x00251006: 'LastPulseSequenceUsed',
  // x00251007: 'ImagesInSeries',
  // x00251010: 'LandmarkCounter',
  // x00251011: 'NumberOfAcquisitions',
  // x00251014: 'IndicatesNoofUpdatesToHeader',
  // x00251017: 'SeriesCompleteFlag',
  // x00251018: 'NumberOfImagesArchived',
  // x00251019: 'LastImageNumberUsed',
  // x0025101a: 'PrimaryReceiverSuiteAndHost',
  // x00271006: 'ImageArchiveFlag',
  // x00271010: 'ScoutType',
  // x0027101c: 'VmaMamp',
  // x0027101d: 'VmaPhase',
  // x0027101e: 'VmaMod',
  // x0027101f: 'VmaClip',
  // x00271020: 'SmartScanOnOffFlag',
  // x00271030: 'ForeignImageRevision',
  // x00271031: 'ImagingMode',
  // x00271032: 'PulseSequence',
  // x00271033: 'ImagingOptions',
  // x00271035: 'PlaneType',
  // x00271036: 'ObliquePlane',
  // x00271040: 'RASLetterOfImageLocation',
  // x00271041: 'ImageLocation',
  // x00271042: 'CenterRCoordOfPlaneImage',
  // x00271043: 'CenterACoordOfPlaneImage',
  // x00271044: 'CenterSCoordOfPlaneImage',
  // x00271045: 'NormalRCoord',
  // x00271046: 'NormalACoord',
  // x00271047: 'NormalSCoord',
  // x00271048: 'RCoordOfTopRightCorner',
  // x00271049: 'ACoordOfTopRightCorner',
  // x0027104a: 'SCoordOfTopRightCorner',
  // x0027104b: 'RCoordOfBottomRightCorner',
  // x0027104c: 'ACoordOfBottomRightCorner',
  // x0027104d: 'SCoordOfBottomRightCorner',
  // x00271050: 'TableStartLocation',
  // x00271051: 'TableEndLocation',
  // x00271052: 'RASLetterForSideOfImage',
  // x00271053: 'RASLetterForAnteriorPosterior',
  // x00271054: 'RASLetterForScoutStartLoc',
  // x00271055: 'RASLetterForScoutEndLoc',
  // x00271060: 'ImageDimensionX',
  // x00271061: 'ImageDimensionY',
  // x00271062: 'NumberOfExcitations',
  x00280000: 'ImagePresentationGroupLength',
  x00280002: 'SamplesPerPixel',
  x00280003: 'SamplesPerPixelUsed',
  x00280004: 'PhotometricInterpretation',
  x00280005: 'ImageDimensions',
  x00280006: 'PlanarConfiguration',
  x00280008: 'NumberOfFrames',
  x00280009: 'FrameIncrementPointer',
  x0028000a: 'FrameDimensionPointer',
  x00280010: 'Rows',
  x00280011: 'Columns',
  x00280012: 'Planes',
  x00280014: 'UltrasoundColorDataPresent',
  x00280030: 'PixelSpacing',
  x00280031: 'ZoomFactor',
  x00280032: 'ZoomCenter',
  x00280034: 'PixelAspectRatio',
  x00280040: 'ImageFormat',
  x00280050: 'ManipulatedImage',
  x00280051: 'CorrectedImage',
  x0028005f: 'CompressionRecognitionCode',
  x00280060: 'CompressionCode',
  x00280061: 'CompressionOriginator',
  x00280062: 'CompressionLabel',
  x00280063: 'CompressionDescription',
  x00280065: 'CompressionSequence',
  x00280066: 'CompressionStepPointers',
  x00280068: 'RepeatInterval',
  x00280069: 'BitsGrouped',
  x00280070: 'PerimeterTable',
  x00280071: 'PerimeterValue',
  x00280080: 'PredictorRows',
  x00280081: 'PredictorColumns',
  x00280082: 'PredictorConstants',
  x00280090: 'BlockedPixels',
  x00280091: 'BlockRows',
  x00280092: 'BlockColumns',
  x00280093: 'RowOverlap',
  x00280094: 'ColumnOverlap',
  x00280100: 'BitsAllocated',
  x00280101: 'BitsStored',
  x00280102: 'HighBit',
  x00280103: 'PixelRepresentation',
  x00280104: 'SmallestValidPixelValue',
  x00280105: 'LargestValidPixelValue',
  x00280106: 'SmallestImagePixelValue',
  x00280107: 'LargestImagePixelValue',
  x00280108: 'SmallestPixelValueInSeries',
  x00280109: 'LargestPixelValueInSeries',
  x00280110: 'SmallestImagePixelValueInPlane',
  x00280111: 'LargestImagePixelValueInPlane',
  x00280120: 'PixelPaddingValue',
  x00280121: 'PixelPaddingRangeLimit',
  x00280200: 'ImageLocation',
  x00280300: 'QualityControlImage',
  x00280301: 'BurnedInAnnotation',
  x00280400: 'TransformLabel',
  x00280401: 'TransformVersionNumber',
  x00280402: 'NumberOfTransformSteps',
  x00280403: 'SequenceOfCompressedData',
  x00280404: 'DetailsOfCoefficients',
  x002804x2: 'CoefficientCoding',
  x002804x3: 'CoefficientCodingPointers',
  x00280700: 'DCTLabel',
  x00280701: 'DataBlockDescription',
  x00280702: 'DataBlock',
  x00280710: 'NormalizationFactorFormat',
  x00280720: 'ZonalMapNumberFormat',
  x00280721: 'ZonalMapLocation',
  x00280722: 'ZonalMapFormat',
  x00280730: 'AdaptiveMapFormat',
  x00280740: 'CodeNumberFormat',
  x002808x0: 'CodeLabel',
  x002808x2: 'NumberOfTables',
  x002808x3: 'CodeTableLocation',
  x002808x4: 'BitsForCodeWord',
  x002808x8: 'ImageDataLocation',
  x00280a02: 'PixelSpacingCalibrationType',
  x00280a04: 'PixelSpacingCalibrationDescription',
  x00281040: 'PixelIntensityRelationship',
  x00281041: 'PixelIntensityRelationshipSign',
  x00281050: 'WindowCenter',
  x00281051: 'WindowWidth',
  x00281052: 'RescaleIntercept',
  x00281053: 'RescaleSlope',
  x00281054: 'RescaleType',
  x00281055: 'WindowCenterAndWidthExplanation',
  x00281056: 'VOI_LUTFunction',
  x00281080: 'GrayScale',
  x00281090: 'RecommendedViewingMode',
  x00281100: 'GrayLookupTableDescriptor',
  x00281101: 'RedPaletteColorTableDescriptor',
  x00281102: 'GreenPaletteColorTableDescriptor',
  x00281103: 'BluePaletteColorTableDescriptor',
  x00281111: 'LargeRedPaletteColorTableDescr',
  x00281112: 'LargeGreenPaletteColorTableDescr',
  x00281113: 'LargeBluePaletteColorTableDescr',
  x00281199: 'PaletteColorTableUID',
  x00281200: 'GrayLookupTableData',
  x00281201: 'RedPaletteColorTableData',
  x00281202: 'GreenPaletteColorTableData',
  x00281203: 'BluePaletteColorTableData',
  x00281211: 'LargeRedPaletteColorTableData',
  x00281212: 'LargeGreenPaletteColorTableData',
  x00281213: 'LargeBluePaletteColorTableData',
  x00281214: 'LargePaletteColorLookupTableUID',
  x00281221: 'SegmentedRedColorTableData',
  x00281222: 'SegmentedGreenColorTableData',
  x00281223: 'SegmentedBlueColorTableData',
  x00281300: 'BreastImplantPresent',
  x00281350: 'PartialView',
  x00281351: 'PartialViewDescription',
  x00281352: 'PartialViewCodeSequence',
  x0028135a: 'SpatialLocationsPreserved',
  x00281402: 'DataPathAssignment',
  x00281404: 'BlendingLUT1Sequence',
  x00281406: 'BlendingWeightConstant',
  x00281408: 'BlendingLookupTableData',
  x0028140c: 'BlendingLUT2Sequence',
  x0028140e: 'DataPathID',
  x0028140f: 'RGBLUTTransferFunction',
  x00281410: 'AlphaLUTTransferFunction',
  x00282000: 'ICCProfile',
  x00282110: 'LossyImageCompression',
  x00282112: 'LossyImageCompressionRatio',
  x00282114: 'LossyImageCompressionMethod',
  x00283000: 'ModalityLUTSequence',
  x00283002: 'LUTDescriptor',
  x00283003: 'LUTExplanation',
  x00283004: 'ModalityLUTType',
  x00283006: 'LUTData',
  x00283010: 'VOILUTSequence',
  x00283110: 'SoftcopyVOILUTSequence',
  x00284000: 'ImagePresentationComments',
  x00285000: 'BiPlaneAcquisitionSequence',
  x00286010: 'RepresentativeFrameNumber',
  x00286020: 'FrameNumbersOfInterest',
  x00286022: 'FrameOfInterestDescription',
  x00286023: 'FrameOfInterestType',
  x00286030: 'MaskPointers',
  x00286040: 'RWavePointer',
  x00286100: 'MaskSubtractionSequence',
  x00286101: 'MaskOperation',
  x00286102: 'ApplicableFrameRange',
  x00286110: 'MaskFrameNumbers',
  x00286112: 'ContrastFrameAveraging',
  x00286114: 'MaskSubPixelShift',
  x00286120: 'TIDOffset',
  x00286190: 'MaskOperationExplanation',
  x00287fe0: 'PixelDataProviderURL',
  x00289001: 'DataPointRows',
  x00289002: 'DataPointColumns',
  x00289003: 'SignalDomainColumns',
  x00289099: 'LargestMonochromePixelValue',
  x00289108: 'DataRepresentation',
  x00289110: 'PixelMeasuresSequence',
  x00289132: 'FrameVOILUTSequence',
  x00289145: 'PixelValueTransformationSequence',
  x00289235: 'SignalDomainRows',
  x00289411: 'DisplayFilterPercentage',
  x00289415: 'FramePixelShiftSequence',
  x00289416: 'SubtractionItemID',
  x00289422: 'PixelIntensityRelationshipLUTSeq',
  x00289443: 'FramePixelDataPropertiesSequence',
  x00289444: 'GeometricalProperties',
  x00289445: 'GeometricMaximumDistortion',
  x00289446: 'ImageProcessingApplied',
  x00289454: 'MaskSelectionMode',
  x00289474: 'LUTFunction',
  x00289478: 'MaskVisibilityPercentage',
  x00289501: 'PixelShiftSequence',
  x00289502: 'RegionPixelShiftSequence',
  x00289503: 'VerticesOfTheRegion',
  x00289506: 'PixelShiftFrameRange',
  x00289507: 'LUTFrameRange',
  x00289520: 'ImageToEquipmentMappingMatrix',
  x00289537: 'EquipmentCoordinateSystemID',
  // x00291004: 'LowerRangeOfPixels1a',
  // x00291005: 'LowerRangeOfPixels1b',
  // x00291006: 'LowerRangeOfPixels1c',
  // x00291007: 'LowerRangeOfPixels1d',
  // x00291008: 'LowerRangeOfPixels1e',
  // x00291009: 'LowerRangeOfPixels1f',
  // x0029100a: 'LowerRangeOfPixels1g',
  // x00291015: 'LowerRangeOfPixels1h',
  // x00291016: 'LowerRangeOfPixels1i',
  // x00291017: 'LowerRangeOfPixels2',
  // x00291018: 'UpperRangeOfPixels2',
  // x0029101a: 'LenOfTotHdrInBytes',
  // x00291026: 'VersionOfTheHdrStruct',
  // x00291034: 'AdvantageCompOverflow',
  // x00291035: 'AdvantageCompUnderflow',
  x00320000: 'StudyGroupLength',
  x0032000a: 'StudyStatusID',
  x0032000c: 'StudyPriorityID',
  x00320012: 'StudyIDIssuer',
  x00320032: 'StudyVerifiedDate',
  x00320033: 'StudyVerifiedTime',
  x00320034: 'StudyReadDate',
  x00320035: 'StudyReadTime',
  x00321000: 'ScheduledStudyStartDate',
  x00321001: 'ScheduledStudyStartTime',
  x00321010: 'ScheduledStudyStopDate',
  x00321011: 'ScheduledStudyStopTime',
  x00321020: 'ScheduledStudyLocation',
  x00321021: 'ScheduledStudyLocationAETitle',
  x00321030: 'ReasonForStudy',
  x00321031: 'RequestingPhysicianIDSequence',
  x00321032: 'RequestingPhysician',
  x00321033: 'RequestingService',
  x00321040: 'StudyArrivalDate',
  x00321041: 'StudyArrivalTime',
  x00321050: 'StudyCompletionDate',
  x00321051: 'StudyCompletionTime',
  x00321055: 'StudyComponentStatusID',
  x00321060: 'RequestedProcedureDescription',
  x00321064: 'RequestedProcedureCodeSequence',
  x00321070: 'RequestedContrastAgent',
  x00324000: 'StudyComments',
  x00380004: 'ReferencedPatientAliasSequence',
  x00380008: 'VisitStatusID',
  x00380010: 'AdmissionID',
  x00380011: 'IssuerOfAdmissionID',
  x00380016: 'RouteOfAdmissions',
  x0038001a: 'ScheduledAdmissionDate',
  x0038001b: 'ScheduledAdmissionTime',
  x0038001c: 'ScheduledDischargeDate',
  x0038001d: 'ScheduledDischargeTime',
  x0038001e: 'ScheduledPatientInstitResidence',
  x00380020: 'AdmittingDate',
  x00380021: 'AdmittingTime',
  x00380030: 'DischargeDate',
  x00380032: 'DischargeTime',
  x00380040: 'DischargeDiagnosisDescription',
  x00380044: 'DischargeDiagnosisCodeSequence',
  x00380050: 'SpecialNeeds',
  x00380060: 'ServiceEpisodeID',
  x00380061: 'IssuerOfServiceEpisodeID',
  x00380062: 'ServiceEpisodeDescription',
  x00380100: 'PertinentDocumentsSequence',
  x00380300: 'CurrentPatientLocation',
  x00380400: 'PatientInstitutionResidence',
  x00380500: 'PatientState',
  x00380502: 'PatientClinicalTrialParticipSeq',
  x00384000: 'VisitComments',
  x003a0004: 'WaveformOriginality',
  x003a0005: 'NumberOfWaveformChannels',
  x003a0010: 'NumberOfWaveformSamples',
  x003a001a: 'SamplingFrequency',
  x003a0020: 'MultiplexGroupLabel',
  x003a0200: 'ChannelDefinitionSequence',
  x003a0202: 'WaveformChannelNumber',
  x003a0203: 'ChannelLabel',
  x003a0205: 'ChannelStatus',
  x003a0208: 'ChannelSourceSequence',
  x003a0209: 'ChannelSourceModifiersSequence',
  x003a020a: 'SourceWaveformSequence',
  x003a020c: 'ChannelDerivationDescription',
  x003a0210: 'ChannelSensitivity',
  x003a0211: 'ChannelSensitivityUnitsSequence',
  x003a0212: 'ChannelSensitivityCorrectionFactor',
  x003a0213: 'ChannelBaseline',
  x003a0214: 'ChannelTimeSkew',
  x003a0215: 'ChannelSampleSkew',
  x003a0218: 'ChannelOffset',
  x003a021a: 'WaveformBitsStored',
  x003a0220: 'FilterLowFrequency',
  x003a0221: 'FilterHighFrequency',
  x003a0222: 'NotchFilterFrequency',
  x003a0223: 'NotchFilterBandwidth',
  x003a0230: 'WaveformDataDisplayScale',
  x003a0231: 'WaveformDisplayBkgCIELabValue',
  x003a0240: 'WaveformPresentationGroupSequence',
  x003a0241: 'PresentationGroupNumber',
  x003a0242: 'ChannelDisplaySequence',
  x003a0244: 'ChannelRecommendDisplayCIELabValue',
  x003a0245: 'ChannelPosition',
  x003a0246: 'DisplayShadingFlag',
  x003a0247: 'FractionalChannelDisplayScale',
  x003a0248: 'AbsoluteChannelDisplayScale',
  x003a0300: 'MultiplexAudioChannelsDescrCodeSeq',
  x003a0301: 'ChannelIdentificationCode',
  x003a0302: 'ChannelMode',
  x00400001: 'ScheduledStationAETitle',
  x00400002: 'ScheduledProcedureStepStartDate',
  x00400003: 'ScheduledProcedureStepStartTime',
  x00400004: 'ScheduledProcedureStepEndDate',
  x00400005: 'ScheduledProcedureStepEndTime',
  x00400006: 'ScheduledPerformingPhysiciansName',
  x00400007: 'ScheduledProcedureStepDescription',
  x00400008: 'ScheduledProtocolCodeSequence',
  x00400009: 'ScheduledProcedureStepID',
  x0040000a: 'StageCodeSequence',
  x0040000b: 'ScheduledPerformingPhysicianIDSeq',
  x00400010: 'ScheduledStationName',
  x00400011: 'ScheduledProcedureStepLocation',
  x00400012: 'PreMedication',
  x00400020: 'ScheduledProcedureStepStatus',
  x00400031: 'LocalNamespaceEntityID',
  x00400032: 'UniversalEntityID',
  x00400033: 'UniversalEntityIDType',
  x00400035: 'IdentifierTypeCode',
  x00400036: 'AssigningFacilitySequence',
  x00400100: 'ScheduledProcedureStepSequence',
  x00400220: 'ReferencedNonImageCompositeSOPSeq',
  x00400241: 'PerformedStationAETitle',
  x00400242: 'PerformedStationName',
  x00400243: 'PerformedLocation',
  x00400244: 'PerformedProcedureStepStartDate',
  x00400245: 'PerformedProcedureStepStartTime',
  x00400250: 'PerformedProcedureStepEndDate',
  x00400251: 'PerformedProcedureStepEndTime',
  x00400252: 'PerformedProcedureStepStatus',
  x00400253: 'PerformedProcedureStepID',
  x00400254: 'PerformedProcedureStepDescription',
  x00400255: 'PerformedProcedureTypeDescription',
  x00400260: 'PerformedProtocolCodeSequence',
  x00400261: 'PerformedProtocolType',
  x00400270: 'ScheduledStepAttributesSequence',
  x00400275: 'RequestAttributesSequence',
  x00400280: 'CommentsOnPerformedProcedureStep',
  x00400281: 'ProcStepDiscontinueReasonCodeSeq',
  x00400293: 'QuantitySequence',
  x00400294: 'Quantity',
  x00400295: 'MeasuringUnitsSequence',
  x00400296: 'BillingItemSequence',
  x00400300: 'TotalTimeOfFluoroscopy',
  x00400301: 'TotalNumberOfExposures',
  x00400302: 'EntranceDose',
  x00400303: 'ExposedArea',
  x00400306: 'DistanceSourceToEntrance',
  x00400307: 'DistanceSourceToSupport',
  x0040030e: 'ExposureDoseSequence',
  x00400310: 'CommentsOnRadiationDose',
  x00400312: 'XRayOutput',
  x00400314: 'HalfValueLayer',
  x00400316: 'OrganDose',
  x00400318: 'OrganExposed',
  x00400320: 'BillingProcedureStepSequence',
  x00400321: 'FilmConsumptionSequence',
  x00400324: 'BillingSuppliesAndDevicesSequence',
  x00400330: 'ReferencedProcedureStepSequence',
  x00400340: 'PerformedSeriesSequence',
  x00400400: 'CommentsOnScheduledProcedureStep',
  x00400440: 'ProtocolContextSequence',
  x00400441: 'ContentItemModifierSequence',
  x0040050a: 'SpecimenAccessionNumber',
  x00400512: 'ContainerIdentifier',
  x0040051a: 'ContainerDescription',
  x00400550: 'SpecimenSequence',
  x00400551: 'SpecimenIdentifier',
  x00400552: 'SpecimenDescriptionSequenceTrial',
  x00400553: 'SpecimenDescriptionTrial',
  x00400554: 'SpecimenUID',
  x00400555: 'AcquisitionContextSequence',
  x00400556: 'AcquisitionContextDescription',
  x0040059a: 'SpecimenTypeCodeSequence',
  x00400600: 'SpecimenShortDescription',
  x004006fa: 'SlideIdentifier',
  x0040071a: 'ImageCenterPointCoordinatesSeq',
  x0040072a: 'XOffsetInSlideCoordinateSystem',
  x0040073a: 'YOffsetInSlideCoordinateSystem',
  x0040074a: 'ZOffsetInSlideCoordinateSystem',
  x004008d8: 'PixelSpacingSequence',
  x004008da: 'CoordinateSystemAxisCodeSequence',
  x004008ea: 'MeasurementUnitsCodeSequence',
  x004009f8: 'VitalStainCodeSequenceTrial',
  x00401001: 'RequestedProcedureID',
  x00401002: 'ReasonForRequestedProcedure',
  x00401003: 'RequestedProcedurePriority',
  x00401004: 'PatientTransportArrangements',
  x00401005: 'RequestedProcedureLocation',
  x00401006: 'PlacerOrderNumber-Procedure',
  x00401007: 'FillerOrderNumber-Procedure',
  x00401008: 'ConfidentialityCode',
  x00401009: 'ReportingPriority',
  x0040100a: 'ReasonForRequestedProcedureCodeSeq',
  x00401010: 'NamesOfIntendedRecipientsOfResults',
  x00401011: 'IntendedRecipientsOfResultsIDSeq',
  x00401101: 'PersonIdentificationCodeSequence',
  x00401102: 'PersonAddress',
  x00401103: 'PersonTelephoneNumbers',
  x00401400: 'RequestedProcedureComments',
  x00402001: 'ReasonForImagingServiceRequest',
  x00402004: 'IssueDateOfImagingServiceRequest',
  x00402005: 'IssueTimeOfImagingServiceRequest',
  x00402006: 'PlacerOrderNumberImagingServiceRequestRetired',
  x00402007: 'FillerOrderNumberImagingServiceRequestRetired',
  x00402008: 'OrderEnteredBy',
  x00402009: 'OrderEntererLocation',
  x00402010: 'OrderCallbackPhoneNumber',
  x00402016: 'PlacerOrderNum-ImagingServiceReq',
  x00402017: 'FillerOrderNum-ImagingServiceReq',
  x00402400: 'ImagingServiceRequestComments',
  x00403001: 'ConfidentialityOnPatientDataDescr',
  x00404001: 'GenPurposeScheduledProcStepStatus',
  x00404002: 'GenPurposePerformedProcStepStatus',
  x00404003: 'GenPurposeSchedProcStepPriority',
  x00404004: 'SchedProcessingApplicationsCodeSeq',
  x00404005: 'SchedProcedureStepStartDateAndTime',
  x00404006: 'MultipleCopiesFlag',
  x00404007: 'PerformedProcessingAppsCodeSeq',
  x00404009: 'HumanPerformerCodeSequence',
  x00404010: 'SchedProcStepModificationDateTime',
  x00404011: 'ExpectedCompletionDateAndTime',
  x00404015: 'ResultingGenPurposePerfProcStepSeq',
  x00404016: 'RefGenPurposeSchedProcStepSeq',
  x00404018: 'ScheduledWorkitemCodeSequence',
  x00404019: 'PerformedWorkitemCodeSequence',
  x00404020: 'InputAvailabilityFlag',
  x00404021: 'InputInformationSequence',
  x00404022: 'RelevantInformationSequence',
  x00404023: 'RefGenPurSchedProcStepTransUID',
  x00404025: 'ScheduledStationNameCodeSequence',
  x00404026: 'ScheduledStationClassCodeSequence',
  x00404027: 'SchedStationGeographicLocCodeSeq',
  x00404028: 'PerformedStationNameCodeSequence',
  x00404029: 'PerformedStationClassCodeSequence',
  x00404030: 'PerformedStationGeogLocCodeSeq',
  x00404031: 'RequestedSubsequentWorkItemCodeSeq',
  x00404032: 'NonDICOMOutputCodeSequence',
  x00404033: 'OutputInformationSequence',
  x00404034: 'ScheduledHumanPerformersSequence',
  x00404035: 'ActualHumanPerformersSequence',
  x00404036: 'HumanPerformersOrganization',
  x00404037: 'HumanPerformerName',
  x00404040: 'RawDataHandling',
  x00408302: 'EntranceDoseInMilliGy',
  x00409094: 'RefImageRealWorldValueMappingSeq',
  x00409096: 'RealWorldValueMappingSequence',
  x00409098: 'PixelValueMappingCodeSequence',
  x00409210: 'LUTLabel',
  x00409211: 'RealWorldValueLastValueMapped',
  x00409212: 'RealWorldValueLUTData',
  x00409216: 'RealWorldValueFirstValueMapped',
  x00409224: 'RealWorldValueIntercept',
  x00409225: 'RealWorldValueSlope',
  x0040a010: 'RelationshipType',
  x0040a027: 'VerifyingOrganization',
  x0040a030: 'VerificationDateTime',
  x0040a032: 'ObservationDateTime',
  x0040a040: 'ValueType',
  x0040a043: 'ConceptNameCodeSequence',
  x0040a050: 'ContinuityOfContent',
  x0040a073: 'VerifyingObserverSequence',
  x0040a075: 'VerifyingObserverName',
  x0040a078: 'AuthorObserverSequence',
  x0040a07a: 'ParticipantSequence',
  x0040a07c: 'CustodialOrganizationSequence',
  x0040a080: 'ParticipationType',
  x0040a082: 'ParticipationDateTime',
  x0040a084: 'ObserverType',
  x0040a088: 'VerifyingObserverIdentCodeSequence',
  x0040a090: 'EquivalentCDADocumentSequence',
  x0040a0b0: 'ReferencedWaveformChannels',
  x0040a120: 'DateTime',
  x0040a121: 'Date',
  x0040a122: 'Time',
  x0040a123: 'PersonName',
  x0040a124: 'UID',
  x0040a130: 'TemporalRangeType',
  x0040a132: 'ReferencedSamplePositions',
  x0040a136: 'ReferencedFrameNumbers',
  x0040a138: 'ReferencedTimeOffsets',
  x0040a13a: 'ReferencedDateTime',
  x0040a160: 'TextValue',
  x0040a168: 'ConceptCodeSequence',
  x0040a170: 'PurposeOfReferenceCodeSequence',
  x0040a180: 'AnnotationGroupNumber',
  x0040a195: 'ModifierCodeSequence',
  x0040a300: 'MeasuredValueSequence',
  x0040a301: 'NumericValueQualifierCodeSequence',
  x0040a30a: 'NumericValue',
  x0040a353: 'AddressTrial',
  x0040a354: 'TelephoneNumberTrial',
  x0040a360: 'PredecessorDocumentsSequence',
  x0040a370: 'ReferencedRequestSequence',
  x0040a372: 'PerformedProcedureCodeSequence',
  x0040a375: 'CurrentRequestedProcEvidenceSeq',
  x0040a385: 'PertinentOtherEvidenceSequence',
  x0040a390: 'HL7StructuredDocumentRefSeq',
  x0040a491: 'CompletionFlag',
  x0040a492: 'CompletionFlagDescription',
  x0040a493: 'VerificationFlag',
  x0040a494: 'ArchiveRequested',
  x0040a496: 'PreliminaryFlag',
  x0040a504: 'ContentTemplateSequence',
  x0040a525: 'IdenticalDocumentsSequence',
  x0040a730: 'ContentSequence',
  x0040b020: 'AnnotationSequence',
  x0040db00: 'TemplateIdentifier',
  x0040db06: 'TemplateVersion',
  x0040db07: 'TemplateLocalVersion',
  x0040db0b: 'TemplateExtensionFlag',
  x0040db0c: 'TemplateExtensionOrganizationUID',
  x0040db0d: 'TemplateExtensionCreatorUID',
  x0040db73: 'ReferencedContentItemIdentifier',
  x0040e001: 'HL7InstanceIdentifier',
  x0040e004: 'HL7DocumentEffectiveTime',
  x0040e006: 'HL7DocumentTypeCodeSequence',
  x0040e010: 'RetrieveURI',
  x0040e011: 'RetrieveLocationUID',
  x00420010: 'DocumentTitle',
  x00420011: 'EncapsulatedDocument',
  x00420012: 'MIMETypeOfEncapsulatedDocument',
  x00420013: 'SourceInstanceSequence',
  x00420014: 'ListOfMIMETypes',
  // x00431001: 'BitmapOfPrescanOptions',
  // x00431002: 'GradientOffsetInX',
  // x00431003: 'GradientOffsetInY',
  // x00431004: 'GradientOffsetInZ',
  // x00431005: 'ImgIsOriginalOrUnoriginal',
  // x00431006: 'NumberOfEPIShots',
  // x00431007: 'ViewsPerSegment',
  // x00431008: 'RespiratoryRateBpm',
  // x00431009: 'RespiratoryTriggerPoint',
  // x0043100a: 'TypeOfReceiverUsed',
  // x0043100b: 'PeakRateOfChangeOfGradientField',
  // x0043100c: 'LimitsInUnitsOfPercent',
  // x0043100d: 'PSDEstimatedLimit',
  // x0043100e: 'PSDEstimatedLimitInTeslaPerSecond',
  // x0043100f: 'Saravghead',
  // x00431010: 'WindowValue',
  // x00431011: 'TotalInputViews',
  // x00431012: 'X-RayChain',
  // x00431013: 'DeconKernelParameters',
  // x00431014: 'CalibrationParameters',
  // x00431015: 'TotalOutputViews',
  // x00431016: 'NumberOfOverranges',
  // x00431017: 'IBHImageScaleFactors',
  // x00431018: 'BBHCoefficients',
  // x00431019: 'NumberOfBBHChainsToBlend',
  // x0043101a: 'StartingChannelNumber',
  // x0043101b: 'PpscanParameters',
  // x0043101c: 'GEImageIntegrity',
  // x0043101d: 'LevelValue',
  // x0043101e: 'DeltaStartTime',
  // x0043101f: 'MaxOverrangesInAView',
  // x00431020: 'AvgOverrangesAllViews',
  // x00431021: 'CorrectedAfterGlowTerms',
  // x00431025: 'ReferenceChannels',
  // x00431026: 'NoViewsRefChansBlocked',
  // x00431027: 'ScanPitchRatio',
  // x00431028: 'UniqueImageIden',
  // x00431029: 'HistogramTables',
  // x0043102a: 'UserDefinedData',
  // x0043102b: 'PrivateScanOptions',
  // x0043102c: 'EffectiveEchoSpacing',
  // x0043102d: 'StringSlopField1',
  // x0043102e: 'StringSlopField2',
  // x0043102f: 'RawDataType',
  // x00431030: 'RawDataType',
  // x00431031: 'RACordOfTargetReconCenter',
  // x00431032: 'RawDataType',
  // x00431033: 'NegScanspacing',
  // x00431034: 'OffsetFrequency',
  // x00431035: 'UserUsageTag',
  // x00431036: 'UserFillMapMSW',
  // x00431037: 'UserFillMapLSW',
  // x00431038: 'User25-48',
  // x00431039: 'SlopInt6-9',
  // x00431040: 'TriggerOnPosition',
  // x00431041: 'DegreeOfRotation',
  // x00431042: 'DASTriggerSource',
  // x00431043: 'DASFpaGain',
  // x00431044: 'DASOutputSource',
  // x00431045: 'DASAdInput',
  // x00431046: 'DASCalMode',
  // x00431047: 'DASCalFrequency',
  // x00431048: 'DASRegXm',
  // x00431049: 'DASAutoZero',
  // x0043104a: 'StartingChannelOfView',
  // x0043104b: 'DASXmPattern',
  // x0043104c: 'TGGCTriggerMode',
  // x0043104d: 'StartScanToXrayOnDelay',
  // x0043104e: 'DurationOfXrayOn',
  // x00431060: 'SlopInt10-17',
  // x00431061: 'ScannerStudyEntityUID',
  // x00431062: 'ScannerStudyID',
  // x0043106f: 'ScannerTableEntry',
  x00440001: 'ProductPackageIdentifier',
  x00440002: 'SubstanceAdministrationApproval',
  x00440003: 'ApprovalStatusFurtherDescription',
  x00440004: 'ApprovalStatusDateTime',
  x00440007: 'ProductTypeCodeSequence',
  x00440008: 'ProductName',
  x00440009: 'ProductDescription',
  x0044000a: 'ProductLotIdentifier',
  x0044000b: 'ProductExpirationDateTime',
  x00440010: 'SubstanceAdministrationDateTime',
  x00440011: 'SubstanceAdministrationNotes',
  x00440012: 'SubstanceAdministrationDeviceID',
  x00440013: 'ProductParameterSequence',
  x00440019: 'SubstanceAdminParameterSeq',
  // x00451001: 'NumberOfMacroRowsInDetector',
  // x00451002: 'MacroWidthAtISOCenter',
  // x00451003: 'DASType',
  // x00451004: 'DASGain',
  // x00451005: 'DASTemperature',
  // x00451006: 'TableDirectionInOrOut',
  // x00451007: 'ZSmoothingFactor',
  // x00451008: 'ViewWeightingMode',
  // x00451009: 'SigmaRowNumberWhichRowsWereUsed',
  // x0045100a: 'MinimumDasValueFoundInTheScanData',
  // x0045100b: 'MaximumOffsetShiftValueUsed',
  // x0045100c: 'NumberOfViewsShifted',
  // x0045100d: 'ZTrackingFlag',
  // x0045100e: 'MeanZError',
  // x0045100f: 'ZTrackingMaximumError',
  // x00451010: 'StartingViewForRow2a',
  // x00451011: 'NumberOfViewsInRow2a',
  // x00451012: 'StartingViewForRow1a',
  // x00451013: 'SigmaMode',
  // x00451014: 'NumberOfViewsInRow1a',
  // x00451015: 'StartingViewForRow2b',
  // x00451016: 'NumberOfViewsInRow2b',
  // x00451017: 'StartingViewForRow1b',
  // x00451018: 'NumberOfViewsInRow1b',
  // x00451019: 'AirFilterCalibrationDate',
  // x0045101a: 'AirFilterCalibrationTime',
  // x0045101b: 'PhantomCalibrationDate',
  // x0045101c: 'PhantomCalibrationTime',
  // x0045101d: 'ZSlopeCalibrationDate',
  // x0045101e: 'ZSlopeCalibrationTime',
  // x0045101f: 'CrosstalkCalibrationDate',
  // x00451020: 'CrosstalkCalibrationTime',
  // x00451021: 'IterboneOptionFlag',
  // x00451022: 'PeristalticFlagOption',
  x00460012: 'LensDescription',
  x00460014: 'RightLensSequence',
  x00460015: 'LeftLensSequence',
  x00460018: 'CylinderSequence',
  x00460028: 'PrismSequence',
  x00460030: 'HorizontalPrismPower',
  x00460032: 'HorizontalPrismBase',
  x00460034: 'VerticalPrismPower',
  x00460036: 'VerticalPrismBase',
  x00460038: 'LensSegmentType',
  x00460040: 'OpticalTransmittance',
  x00460042: 'ChannelWidth',
  x00460044: 'PupilSize',
  x00460046: 'CornealSize',
  x00460060: 'DistancePupillaryDistance',
  x00460062: 'NearPupillaryDistance',
  x00460064: 'OtherPupillaryDistance',
  x00460075: 'RadiusOfCurvature',
  x00460076: 'KeratometricPower',
  x00460077: 'KeratometricAxis',
  x00460092: 'BackgroundColor',
  x00460094: 'Optotype',
  x00460095: 'OptotypePresentation',
  x00460100: 'AddNearSequence',
  x00460101: 'AddIntermediateSequence',
  x00460102: 'AddOtherSequence',
  x00460104: 'AddPower',
  x00460106: 'ViewingDistance',
  x00460125: 'ViewingDistanceType',
  x00460135: 'VisualAcuityModifiers',
  x00460137: 'DecimalVisualAcuity',
  x00460139: 'OptotypeDetailedDefinition',
  x00460146: 'SpherePower',
  x00460147: 'CylinderPower',
  x00500004: 'CalibrationImage',
  x00500010: 'DeviceSequence',
  x00500014: 'DeviceLength',
  x00500015: 'ContainerComponentWidth',
  x00500016: 'DeviceDiameter',
  x00500017: 'DeviceDiameterUnits',
  x00500018: 'DeviceVolume',
  x00500019: 'InterMarkerDistance',
  x0050001b: 'ContainerComponentID',
  x00500020: 'DeviceDescription',
  x00540010: 'EnergyWindowVector',
  x00540011: 'NumberOfEnergyWindows',
  x00540012: 'EnergyWindowInformationSequence',
  x00540013: 'EnergyWindowRangeSequence',
  x00540014: 'EnergyWindowLowerLimit',
  x00540015: 'EnergyWindowUpperLimit',
  x00540016: 'RadiopharmaceuticalInformationSeq',
  x00540017: 'ResidualSyringeCounts',
  x00540018: 'EnergyWindowName',
  x00540020: 'DetectorVector',
  x00540021: 'NumberOfDetectors',
  x00540022: 'DetectorInformationSequence',
  x00540030: 'PhaseVector',
  x00540031: 'NumberOfPhases',
  x00540032: 'PhaseInformationSequence',
  x00540033: 'NumberOfFramesInPhase',
  x00540036: 'PhaseDelay',
  x00540038: 'PauseBetweenFrames',
  x00540039: 'PhaseDescription',
  x00540050: 'RotationVector',
  x00540051: 'NumberOfRotations',
  x00540052: 'RotationInformationSequence',
  x00540053: 'NumberOfFramesInRotation',
  x00540060: 'RRIntervalVector',
  x00540061: 'NumberOfRRIntervals',
  x00540062: 'GatedInformationSequence',
  x00540063: 'DataInformationSequence',
  x00540070: 'TimeSlotVector',
  x00540071: 'NumberOfTimeSlots',
  x00540072: 'TimeSlotInformationSequence',
  x00540073: 'TimeSlotTime',
  x00540080: 'SliceVector',
  x00540081: 'NumberOfSlices',
  x00540090: 'AngularViewVector',
  x00540100: 'TimeSliceVector',
  x00540101: 'NumberOfTimeSlices',
  x00540200: 'StartAngle',
  x00540202: 'TypeOfDetectorMotion',
  x00540210: 'TriggerVector',
  x00540211: 'NumberOfTriggersInPhase',
  x00540220: 'ViewCodeSequence',
  x00540222: 'ViewModifierCodeSequence',
  x00540300: 'RadionuclideCodeSequence',
  x00540302: 'AdministrationRouteCodeSequence',
  x00540304: 'RadiopharmaceuticalCodeSequence',
  x00540306: 'CalibrationDataSequence',
  x00540308: 'EnergyWindowNumber',
  x00540400: 'ImageID',
  x00540410: 'PatientOrientationCodeSequence',
  x00540412: 'PatientOrientationModifierCodeSeq',
  x00540414: 'PatientGantryRelationshipCodeSeq',
  x00540500: 'SliceProgressionDirection',
  x00541000: 'SeriesType',
  x00541001: 'Units',
  x00541002: 'CountsSource',
  x00541004: 'ReprojectionMethod',
  x00541100: 'RandomsCorrectionMethod',
  x00541101: 'AttenuationCorrectionMethod',
  x00541102: 'DecayCorrection',
  x00541103: 'ReconstructionMethod',
  x00541104: 'DetectorLinesOfResponseUsed',
  x00541105: 'ScatterCorrectionMethod',
  x00541200: 'AxialAcceptance',
  x00541201: 'AxialMash',
  x00541202: 'TransverseMash',
  x00541203: 'DetectorElementSize',
  x00541210: 'CoincidenceWindowWidth',
  x00541220: 'SecondaryCountsType',
  x00541300: 'FrameReferenceTime',
  x00541310: 'PrimaryCountsAccumulated',
  x00541311: 'SecondaryCountsAccumulated',
  x00541320: 'SliceSensitivityFactor',
  x00541321: 'DecayFactor',
  x00541322: 'DoseCalibrationFactor',
  x00541323: 'ScatterFractionFactor',
  x00541324: 'DeadTimeFactor',
  x00541330: 'ImageIndex',
  x00541400: 'CountsIncluded',
  x00541401: 'DeadTimeCorrectionFlag',
  x00603000: 'HistogramSequence',
  x00603002: 'HistogramNumberOfBins',
  x00603004: 'HistogramFirstBinValue',
  x00603006: 'HistogramLastBinValue',
  x00603008: 'HistogramBinWidth',
  x00603010: 'HistogramExplanation',
  x00603020: 'HistogramData',
  x00620001: 'SegmentationType',
  x00620002: 'SegmentSequence',
  x00620003: 'SegmentedPropertyCategoryCodeSeq',
  x00620004: 'SegmentNumber',
  x00620005: 'SegmentLabel',
  x00620006: 'SegmentDescription',
  x00620008: 'SegmentAlgorithmType',
  x00620009: 'SegmentAlgorithmName',
  x0062000a: 'SegmentIdentificationSequence',
  x0062000b: 'ReferencedSegmentNumber',
  x0062000c: 'RecommendedDisplayGrayscaleValue',
  x0062000d: 'RecommendedDisplayCIELabValue',
  x0062000e: 'MaximumFractionalValue',
  x0062000f: 'SegmentedPropertyTypeCodeSequence',
  x00620010: 'SegmentationFractionalType',
  x00640002: 'DeformableRegistrationSequence',
  x00640003: 'SourceFrameOfReferenceUID',
  x00640005: 'DeformableRegistrationGridSequence',
  x00640007: 'GridDimensions',
  x00640008: 'GridResolution',
  x00640009: 'VectorGridData',
  x0064000f: 'PreDeformationMatrixRegistSeq',
  x00640010: 'PostDeformationMatrixRegistSeq',
  x00660001: 'NumberOfSurfaces',
  x00660002: 'SurfaceSequence',
  x00660003: 'SurfaceNumber',
  x00660004: 'SurfaceComments',
  x00660009: 'SurfaceProcessing',
  x0066000a: 'SurfaceProcessingRatio',
  x0066000e: 'FiniteVolume',
  x00660010: 'Manifold',
  x00660011: 'SurfacePointsSequence',
  x00660015: 'NumberOfSurfacePoints',
  x00660016: 'PointCoordinatesData',
  x00660017: 'PointPositionAccuracy',
  x00660018: 'MeanPointDistance',
  x00660019: 'MaximumPointDistance',
  x0066001b: 'AxisOfRotation',
  x0066001c: 'CenterOfRotation',
  x0066001e: 'NumberOfVectors',
  x0066001f: 'VectorDimensionality',
  x00660020: 'VectorAccuracy',
  x00660021: 'VectorCoordinateData',
  x00660023: 'TrianglePointIndexList',
  x00660024: 'EdgePointIndexList',
  x00660025: 'VertexPointIndexList',
  x00660026: 'TriangleStripSequence',
  x00660027: 'TriangleFanSequence',
  x00660028: 'LineSequence',
  x00660029: 'PrimitivePointIndexList',
  x0066002a: 'SurfaceCount',
  x0066002f: 'AlgorithmFamilyCodeSequ',
  x00660031: 'AlgorithmVersion',
  x00660032: 'AlgorithmParameters',
  x00660034: 'FacetSequence',
  x00660036: 'AlgorithmName',
  x00700001: 'GraphicAnnotationSequence',
  x00700002: 'GraphicLayer',
  x00700003: 'BoundingBoxAnnotationUnits',
  x00700004: 'AnchorPointAnnotationUnits',
  x00700005: 'GraphicAnnotationUnits',
  x00700006: 'UnformattedTextValue',
  x00700008: 'TextObjectSequence',
  x00700009: 'GraphicObjectSequence',
  x00700010: 'BoundingBoxTopLeftHandCorner',
  x00700011: 'BoundingBoxBottomRightHandCorner',
  x00700012: 'BoundingBoxTextHorizJustification',
  x00700014: 'AnchorPoint',
  x00700015: 'AnchorPointVisibility',
  x00700020: 'GraphicDimensions',
  x00700021: 'NumberOfGraphicPoints',
  x00700022: 'GraphicData',
  x00700023: 'GraphicType',
  x00700024: 'GraphicFilled',
  x00700040: 'ImageRotationRetired',
  x00700041: 'ImageHorizontalFlip',
  x00700042: 'ImageRotation',
  x00700050: 'DisplayedAreaTopLeftTrial',
  x00700051: 'DisplayedAreaBottomRightTrial',
  x00700052: 'DisplayedAreaTopLeft',
  x00700053: 'DisplayedAreaBottomRight',
  x0070005a: 'DisplayedAreaSelectionSequence',
  x00700060: 'GraphicLayerSequence',
  x00700062: 'GraphicLayerOrder',
  x00700066: 'GraphicLayerRecDisplayGraysclValue',
  x00700067: 'GraphicLayerRecDisplayRGBValue',
  x00700068: 'GraphicLayerDescription',
  x00700080: 'ContentLabel',
  x00700081: 'ContentDescription',
  x00700082: 'PresentationCreationDate',
  x00700083: 'PresentationCreationTime',
  x00700084: 'ContentCreatorName',
  x00700086: 'ContentCreatorIDCodeSequence',
  x00700100: 'PresentationSizeMode',
  x00700101: 'PresentationPixelSpacing',
  x00700102: 'PresentationPixelAspectRatio',
  x00700103: 'PresentationPixelMagRatio',
  x00700306: 'ShapeType',
  x00700308: 'RegistrationSequence',
  x00700309: 'MatrixRegistrationSequence',
  x0070030a: 'MatrixSequence',
  x0070030c: 'FrameOfRefTransformationMatrixType',
  x0070030d: 'RegistrationTypeCodeSequence',
  x0070030f: 'FiducialDescription',
  x00700310: 'FiducialIdentifier',
  x00700311: 'FiducialIdentifierCodeSequence',
  x00700312: 'ContourUncertaintyRadius',
  x00700314: 'UsedFiducialsSequence',
  x00700318: 'GraphicCoordinatesDataSequence',
  x0070031a: 'FiducialUID',
  x0070031c: 'FiducialSetSequence',
  x0070031e: 'FiducialSequence',
  x00700401: 'GraphicLayerRecomDisplayCIELabVal',
  x00700402: 'BlendingSequence',
  x00700403: 'RelativeOpacity',
  x00700404: 'ReferencedSpatialRegistrationSeq',
  x00700405: 'BlendingPosition',
  x00720002: 'HangingProtocolName',
  x00720004: 'HangingProtocolDescription',
  x00720006: 'HangingProtocolLevel',
  x00720008: 'HangingProtocolCreator',
  x0072000a: 'HangingProtocolCreationDateTime',
  x0072000c: 'HangingProtocolDefinitionSequence',
  x0072000e: 'HangingProtocolUserIDCodeSequence',
  x00720010: 'HangingProtocolUserGroupName',
  x00720012: 'SourceHangingProtocolSequence',
  x00720014: 'NumberOfPriorsReferenced',
  x00720020: 'ImageSetsSequence',
  x00720022: 'ImageSetSelectorSequence',
  x00720024: 'ImageSetSelectorUsageFlag',
  x00720026: 'SelectorAttribute',
  x00720028: 'SelectorValueNumber',
  x00720030: 'TimeBasedImageSetsSequence',
  x00720032: 'ImageSetNumber',
  x00720034: 'ImageSetSelectorCategory',
  x00720038: 'RelativeTime',
  x0072003a: 'RelativeTimeUnits',
  x0072003c: 'AbstractPriorValue',
  x0072003e: 'AbstractPriorCodeSequence',
  x00720040: 'ImageSetLabel',
  x00720050: 'SelectorAttributeVR',
  x00720052: 'SelectorSequencePointer',
  x00720054: 'SelectorSeqPointerPrivateCreator',
  x00720056: 'SelectorAttributePrivateCreator',
  x00720060: 'SelectorATValue',
  x00720062: 'SelectorCSValue',
  x00720064: 'SelectorISValue',
  x00720066: 'SelectorLOValue',
  x00720068: 'SelectorLTValue',
  x0072006a: 'SelectorPNValue',
  x0072006c: 'SelectorSHValue',
  x0072006e: 'SelectorSTValue',
  x00720070: 'SelectorUTValue',
  x00720072: 'SelectorDSValue',
  x00720074: 'SelectorFDValue',
  x00720076: 'SelectorFLValue',
  x00720078: 'SelectorULValue',
  x0072007a: 'SelectorUSValue',
  x0072007c: 'SelectorSLValue',
  x0072007e: 'SelectorSSValue',
  x00720080: 'SelectorCodeSequenceValue',
  x00720100: 'NumberOfScreens',
  x00720102: 'NominalScreenDefinitionSequence',
  x00720104: 'NumberOfVerticalPixels',
  x00720106: 'NumberOfHorizontalPixels',
  x00720108: 'DisplayEnvironmentSpatialPosition',
  x0072010a: 'ScreenMinimumGrayscaleBitDepth',
  x0072010c: 'ScreenMinimumColorBitDepth',
  x0072010e: 'ApplicationMaximumRepaintTime',
  x00720200: 'DisplaySetsSequence',
  x00720202: 'DisplaySetNumber',
  x00720203: 'DisplaySetLabel',
  x00720204: 'DisplaySetPresentationGroup',
  x00720206: 'DisplaySetPresentationGroupDescr',
  x00720208: 'PartialDataDisplayHandling',
  x00720210: 'SynchronizedScrollingSequence',
  x00720212: 'DisplaySetScrollingGroup',
  x00720214: 'NavigationIndicatorSequence',
  x00720216: 'NavigationDisplaySet',
  x00720218: 'ReferenceDisplaySets',
  x00720300: 'ImageBoxesSequence',
  x00720302: 'ImageBoxNumber',
  x00720304: 'ImageBoxLayoutType',
  x00720306: 'ImageBoxTileHorizontalDimension',
  x00720308: 'ImageBoxTileVerticalDimension',
  x00720310: 'ImageBoxScrollDirection',
  x00720312: 'ImageBoxSmallScrollType',
  x00720314: 'ImageBoxSmallScrollAmount',
  x00720316: 'ImageBoxLargeScrollType',
  x00720318: 'ImageBoxLargeScrollAmount',
  x00720320: 'ImageBoxOverlapPriority',
  x00720330: 'CineRelativeToRealTime',
  x00720400: 'FilterOperationsSequence',
  x00720402: 'FilterByCategory',
  x00720404: 'FilterByAttributePresence',
  x00720406: 'FilterByOperator',
  x00720432: 'SynchronizedImageBoxList',
  x00720434: 'TypeOfSynchronization',
  x00720500: 'BlendingOperationType',
  x00720510: 'ReformattingOperationType',
  x00720512: 'ReformattingThickness',
  x00720514: 'ReformattingInterval',
  x00720516: 'ReformattingOpInitialViewDir',
  x00720520: 'RenderingType3D',
  x00720600: 'SortingOperationsSequence',
  x00720602: 'SortByCategory',
  x00720604: 'SortingDirection',
  x00720700: 'DisplaySetPatientOrientation',
  x00720702: 'VOIType',
  x00720704: 'PseudoColorType',
  x00720706: 'ShowGrayscaleInverted',
  x00720710: 'ShowImageTrueSizeFlag',
  x00720712: 'ShowGraphicAnnotationFlag',
  x00720714: 'ShowPatientDemographicsFlag',
  x00720716: 'ShowAcquisitionTechniquesFlag',
  x00720717: 'DisplaySetHorizontalJustification',
  x00720718: 'DisplaySetVerticalJustification',
  x00741000: 'UnifiedProcedureStepState',
  x00741002: 'UPSProgressInformationSequence',
  x00741004: 'UnifiedProcedureStepProgress',
  x00741006: 'UnifiedProcedureStepProgressDescr',
  x00741008: 'UnifiedProcedureStepComURISeq',
  x0074100a: 'ContactURI',
  x0074100c: 'ContactDisplayName',
  x00741020: 'BeamTaskSequence',
  x00741022: 'BeamTaskType',
  x00741024: 'BeamOrderIndex',
  x00741030: 'DeliveryVerificationImageSequence',
  x00741032: 'VerificationImageTiming',
  x00741034: 'DoubleExposureFlag',
  x00741036: 'DoubleExposureOrdering',
  x00741038: 'DoubleExposureMeterset',
  x0074103a: 'DoubleExposureFieldDelta',
  x00741040: 'RelatedReferenceRTImageSequence',
  x00741042: 'GeneralMachineVerificationSequence',
  x00741044: 'ConventionalMachineVerificationSeq',
  x00741046: 'IonMachineVerificationSequence',
  x00741048: 'FailedAttributesSequence',
  x0074104a: 'OverriddenAttributesSequence',
  x0074104c: 'ConventionalControlPointVerifySeq',
  x0074104e: 'IonControlPointVerificationSeq',
  x00741050: 'AttributeOccurrenceSequence',
  x00741052: 'AttributeOccurrencePointer',
  x00741054: 'AttributeItemSelector',
  x00741056: 'AttributeOccurrencePrivateCreator',
  x00741200: 'ScheduledProcedureStepPriority',
  x00741202: 'StudyListLabel',
  x00741204: 'ProcedureStepLabel',
  x00741210: 'ScheduledProcessingParametersSeq',
  x00741212: 'PerformedProcessingParametersSeq',
  x00741216: 'UPSPerformedProcedureSequence',
  x00741220: 'RelatedProcedureStepSequence',
  x00741222: 'ProcedureStepRelationshipType',
  x00741230: 'DeletionLock',
  x00741234: 'ReceivingAE',
  x00741236: 'RequestingAE',
  x00741238: 'ReasonForCancellation',
  x00741242: 'SCPStatus',
  x00741244: 'SubscriptionListStatus',
  x00741246: 'UPSListStatus',
  x00880130: 'StorageMediaFileSetID',
  x00880140: 'StorageMediaFileSetUID',
  x00880200: 'IconImageSequence',
  x00880904: 'TopicTitle',
  x00880906: 'TopicSubject',
  x00880910: 'TopicAuthor',
  x00880912: 'TopicKeywords',
  x01000410: 'SOPInstanceStatus',
  x01000420: 'SOPAuthorizationDateAndTime',
  x01000424: 'SOPAuthorizationComment',
  x01000426: 'AuthorizationEquipmentCertNumber',
  x04000005: 'MACIDNumber',
  x04000010: 'MACCalculationTransferSyntaxUID',
  x04000015: 'MACAlgorithm',
  x04000020: 'DataElementsSigned',
  x04000100: 'DigitalSignatureUID',
  x04000105: 'DigitalSignatureDateTime',
  x04000110: 'CertificateType',
  x04000115: 'CertificateOfSigner',
  x04000120: 'Signature',
  x04000305: 'CertifiedTimestampType',
  x04000310: 'CertifiedTimestamp',
  x04000401: 'DigitalSignaturePurposeCodeSeq',
  x04000402: 'ReferencedDigitalSignatureSeq',
  x04000403: 'ReferencedSOPInstanceMACSeq',
  x04000404: 'MAC',
  x04000500: 'EncryptedAttributesSequence',
  x04000510: 'EncryptedContentTransferSyntaxUID',
  x04000520: 'EncryptedContent',
  x04000550: 'ModifiedAttributesSequence',
  x04000561: 'OriginalAttributesSequence',
  x04000562: 'AttributeModificationDateTime',
  x04000563: 'ModifyingSystem',
  x04000564: 'SourceOfPreviousValues',
  x04000565: 'ReasonForTheAttributeModification',
  x1000xxx0: 'EscapeTriplet',
  x1000xxx1: 'RunLengthTriplet',
  x1000xxx2: 'HuffmanTableSize',
  x1000xxx3: 'HuffmanTableTriplet',
  x1000xxx4: 'ShiftTableSize',
  x1000xxx5: 'ShiftTableTriplet',
  x1010xxxx: 'ZonalMap',
  x20000010: 'NumberOfCopies',
  x2000001e: 'PrinterConfigurationSequence',
  x20000020: 'PrintPriority',
  x20000030: 'MediumType',
  x20000040: 'FilmDestination',
  x20000050: 'FilmSessionLabel',
  x20000060: 'MemoryAllocation',
  x20000061: 'MaximumMemoryAllocation',
  x20000062: 'ColorImagePrintingFlag',
  x20000063: 'CollationFlag',
  x20000065: 'AnnotationFlag',
  x20000067: 'ImageOverlayFlag',
  x20000069: 'PresentationLUTFlag',
  x2000006a: 'ImageBoxPresentationLUTFlag',
  x200000a0: 'MemoryBitDepth',
  x200000a1: 'PrintingBitDepth',
  x200000a2: 'MediaInstalledSequence',
  x200000a4: 'OtherMediaAvailableSequence',
  x200000a8: 'SupportedImageDisplayFormatSeq',
  x20000500: 'ReferencedFilmBoxSequence',
  x20000510: 'ReferencedStoredPrintSequence',
  x20100010: 'ImageDisplayFormat',
  x20100030: 'AnnotationDisplayFormatID',
  x20100040: 'FilmOrientation',
  x20100050: 'FilmSizeID',
  x20100052: 'PrinterResolutionID',
  x20100054: 'DefaultPrinterResolutionID',
  x20100060: 'MagnificationType',
  x20100080: 'SmoothingType',
  x201000a6: 'DefaultMagnificationType',
  x201000a7: 'OtherMagnificationTypesAvailable',
  x201000a8: 'DefaultSmoothingType',
  x201000a9: 'OtherSmoothingTypesAvailable',
  x20100100: 'BorderDensity',
  x20100110: 'EmptyImageDensity',
  x20100120: 'MinDensity',
  x20100130: 'MaxDensity',
  x20100140: 'Trim',
  x20100150: 'ConfigurationInformation',
  x20100152: 'ConfigurationInformationDescr',
  x20100154: 'MaximumCollatedFilms',
  x2010015e: 'Illumination',
  x20100160: 'ReflectedAmbientLight',
  x20100376: 'PrinterPixelSpacing',
  x20100500: 'ReferencedFilmSessionSequence',
  x20100510: 'ReferencedImageBoxSequence',
  x20100520: 'ReferencedBasicAnnotationBoxSeq',
  x20200010: 'ImageBoxPosition',
  x20200020: 'Polarity',
  x20200030: 'RequestedImageSize',
  x20200040: 'RequestedDecimate-CropBehavior',
  x20200050: 'RequestedResolutionID',
  x202000a0: 'RequestedImageSizeFlag',
  x202000a2: 'DecimateCropResult',
  x20200110: 'BasicGrayscaleImageSequence',
  x20200111: 'BasicColorImageSequence',
  x20200130: 'ReferencedImageOverlayBoxSequence',
  x20200140: 'ReferencedVOILUTBoxSequence',
  x20300010: 'AnnotationPosition',
  x20300020: 'TextString',
  x20400010: 'ReferencedOverlayPlaneSequence',
  x20400011: 'ReferencedOverlayPlaneGroups',
  x20400020: 'OverlayPixelDataSequence',
  x20400060: 'OverlayMagnificationType',
  x20400070: 'OverlaySmoothingType',
  x20400072: 'OverlayOrImageMagnification',
  x20400074: 'MagnifyToNumberOfColumns',
  x20400080: 'OverlayForegroundDensity',
  x20400082: 'OverlayBackgroundDensity',
  x20400090: 'OverlayMode',
  x20400100: 'ThresholdDensity',
  x20400500: 'ReferencedImageBoxSequenceRetired',
  x20500010: 'PresentationLUTSequence',
  x20500020: 'PresentationLUTShape',
  x20500500: 'ReferencedPresentationLUTSequence',
  x21000010: 'PrintJobID',
  x21000020: 'ExecutionStatus',
  x21000030: 'ExecutionStatusInfo',
  x21000040: 'CreationDate',
  x21000050: 'CreationTime',
  x21000070: 'Originator',
  x21000140: 'DestinationAE',
  x21000160: 'OwnerID',
  x21000170: 'NumberOfFilms',
  x21000500: 'ReferencedPrintJobSequencePullStoredPrint',
  x21100010: 'PrinterStatus',
  x21100020: 'PrinterStatusInfo',
  x21100030: 'PrinterName',
  x21100099: 'PrintQueueID',
  x21200010: 'QueueStatus',
  x21200050: 'PrintJobDescriptionSequence',
  x21200070: 'ReferencedPrintJobSequence',
  x21300010: 'PrintManagementCapabilitiesSeq',
  x21300015: 'PrinterCharacteristicsSequence',
  x21300030: 'FilmBoxContentSequence',
  x21300040: 'ImageBoxContentSequence',
  x21300050: 'AnnotationContentSequence',
  x21300060: 'ImageOverlayBoxContentSequence',
  x21300080: 'PresentationLUTContentSequence',
  x213000a0: 'ProposedStudySequence',
  x213000c0: 'OriginalImageSequence',
  x22000001: 'LabelFromInfoExtractedFromInstance',
  x22000002: 'LabelText',
  x22000003: 'LabelStyleSelection',
  x22000004: 'MediaDisposition',
  x22000005: 'BarcodeValue',
  x22000006: 'BarcodeSymbology',
  x22000007: 'AllowMediaSplitting',
  x22000008: 'IncludeNonDICOMObjects',
  x22000009: 'IncludeDisplayApplication',
  x2200000a: 'SaveCompInstancesAfterMediaCreate',
  x2200000b: 'TotalNumberMediaPiecesCreated',
  x2200000c: 'RequestedMediaApplicationProfile',
  x2200000d: 'ReferencedStorageMediaSequence',
  x2200000e: 'FailureAttributes',
  x2200000f: 'AllowLossyCompression',
  x22000020: 'RequestPriority',
  x30020002: 'RTImageLabel',
  x30020003: 'RTImageName',
  x30020004: 'RTImageDescription',
  x3002000a: 'ReportedValuesOrigin',
  x3002000c: 'RTImagePlane',
  x3002000d: 'XRayImageReceptorTranslation',
  x3002000e: 'XRayImageReceptorAngle',
  x30020010: 'RTImageOrientation',
  x30020011: 'ImagePlanePixelSpacing',
  x30020012: 'RTImagePosition',
  x30020020: 'RadiationMachineName',
  x30020022: 'RadiationMachineSAD',
  x30020024: 'RadiationMachineSSD',
  x30020026: 'RTImageSID',
  x30020028: 'SourceToReferenceObjectDistance',
  x30020029: 'FractionNumber',
  x30020030: 'ExposureSequence',
  x30020032: 'MetersetExposure',
  x30020034: 'DiaphragmPosition',
  x30020040: 'FluenceMapSequence',
  x30020041: 'FluenceDataSource',
  x30020042: 'FluenceDataScale',
  x30020051: 'FluenceMode',
  x30020052: 'FluenceModeID',
  x30040001: 'DVHType',
  x30040002: 'DoseUnits',
  x30040004: 'DoseType',
  x30040006: 'DoseComment',
  x30040008: 'NormalizationPoint',
  x3004000a: 'DoseSummationType',
  x3004000c: 'GridFrameOffsetVector',
  x3004000e: 'DoseGridScaling',
  x30040010: 'RTDoseROISequence',
  x30040012: 'DoseValue',
  x30040014: 'TissueHeterogeneityCorrection',
  x30040040: 'DVHNormalizationPoint',
  x30040042: 'DVHNormalizationDoseValue',
  x30040050: 'DVHSequence',
  x30040052: 'DVHDoseScaling',
  x30040054: 'DVHVolumeUnits',
  x30040056: 'DVHNumberOfBins',
  x30040058: 'DVHData',
  x30040060: 'DVHReferencedROISequence',
  x30040062: 'DVHROIContributionType',
  x30040070: 'DVHMinimumDose',
  x30040072: 'DVHMaximumDose',
  x30040074: 'DVHMeanDose',
  x30060002: 'StructureSetLabel',
  x30060004: 'StructureSetName',
  x30060006: 'StructureSetDescription',
  x30060008: 'StructureSetDate',
  x30060009: 'StructureSetTime',
  x30060010: 'ReferencedFrameOfReferenceSequence',
  x30060012: 'RTReferencedStudySequence',
  x30060014: 'RTReferencedSeriesSequence',
  x30060016: 'ContourImageSequence',
  x30060020: 'StructureSetROISequence',
  x30060022: 'ROINumber',
  x30060024: 'ReferencedFrameOfReferenceUID',
  x30060026: 'ROIName',
  x30060028: 'ROIDescription',
  x3006002a: 'ROIDisplayColor',
  x3006002c: 'ROIVolume',
  x30060030: 'RTRelatedROISequence',
  x30060033: 'RTROIRelationship',
  x30060036: 'ROIGenerationAlgorithm',
  x30060038: 'ROIGenerationDescription',
  x30060039: 'ROIContourSequence',
  x30060040: 'ContourSequence',
  x30060042: 'ContourGeometricType',
  x30060044: 'ContourSlabThickness',
  x30060045: 'ContourOffsetVector',
  x30060046: 'NumberOfContourPoints',
  x30060048: 'ContourNumber',
  x30060049: 'AttachedContours',
  x30060050: 'ContourData',
  x30060080: 'RTROIObservationsSequence',
  x30060082: 'ObservationNumber',
  x30060084: 'ReferencedROINumber',
  x30060085: 'ROIObservationLabel',
  x30060086: 'RTROIIdentificationCodeSequence',
  x30060088: 'ROIObservationDescription',
  x300600a0: 'RelatedRTROIObservationsSequence',
  x300600a4: 'RTROIInterpretedType',
  x300600a6: 'ROIInterpreter',
  x300600b0: 'ROIPhysicalPropertiesSequence',
  x300600b2: 'ROIPhysicalProperty',
  x300600b4: 'ROIPhysicalPropertyValue',
  x300600b6: 'ROIElementalCompositionSequence',
  x300600b7: 'ROIElementalCompAtomicNumber',
  x300600b8: 'ROIElementalCompAtomicMassFraction',
  x300600c0: 'FrameOfReferenceRelationshipSeq',
  x300600c2: 'RelatedFrameOfReferenceUID',
  x300600c4: 'FrameOfReferenceTransformType',
  x300600c6: 'FrameOfReferenceTransformMatrix',
  x300600c8: 'FrameOfReferenceTransformComment',
  x30080010: 'MeasuredDoseReferenceSequence',
  x30080012: 'MeasuredDoseDescription',
  x30080014: 'MeasuredDoseType',
  x30080016: 'MeasuredDoseValue',
  x30080020: 'TreatmentSessionBeamSequence',
  x30080021: 'TreatmentSessionIonBeamSequence',
  x30080022: 'CurrentFractionNumber',
  x30080024: 'TreatmentControlPointDate',
  x30080025: 'TreatmentControlPointTime',
  x3008002a: 'TreatmentTerminationStatus',
  x3008002b: 'TreatmentTerminationCode',
  x3008002c: 'TreatmentVerificationStatus',
  x30080030: 'ReferencedTreatmentRecordSequence',
  x30080032: 'SpecifiedPrimaryMeterset',
  x30080033: 'SpecifiedSecondaryMeterset',
  x30080036: 'DeliveredPrimaryMeterset',
  x30080037: 'DeliveredSecondaryMeterset',
  x3008003a: 'SpecifiedTreatmentTime',
  x3008003b: 'DeliveredTreatmentTime',
  x30080040: 'ControlPointDeliverySequence',
  x30080041: 'IonControlPointDeliverySequence',
  x30080042: 'SpecifiedMeterset',
  x30080044: 'DeliveredMeterset',
  x30080045: 'MetersetRateSet',
  x30080046: 'MetersetRateDelivered',
  x30080047: 'ScanSpotMetersetsDelivered',
  x30080048: 'DoseRateDelivered',
  x30080050: 'TreatmentSummaryCalcDoseRefSeq',
  x30080052: 'CumulativeDoseToDoseReference',
  x30080054: 'FirstTreatmentDate',
  x30080056: 'MostRecentTreatmentDate',
  x3008005a: 'NumberOfFractionsDelivered',
  x30080060: 'OverrideSequence',
  x30080061: 'ParameterSequencePointer',
  x30080062: 'OverrideParameterPointer',
  x30080063: 'ParameterItemIndex',
  x30080064: 'MeasuredDoseReferenceNumber',
  x30080065: 'ParameterPointer',
  x30080066: 'OverrideReason',
  x30080068: 'CorrectedParameterSequence',
  x3008006a: 'CorrectionValue',
  x30080070: 'CalculatedDoseReferenceSequence',
  x30080072: 'CalculatedDoseReferenceNumber',
  x30080074: 'CalculatedDoseReferenceDescription',
  x30080076: 'CalculatedDoseReferenceDoseValue',
  x30080078: 'StartMeterset',
  x3008007a: 'EndMeterset',
  x30080080: 'ReferencedMeasuredDoseReferenceSeq',
  x30080082: 'ReferencedMeasuredDoseReferenceNum',
  x30080090: 'ReferencedCalculatedDoseRefSeq',
  x30080092: 'ReferencedCalculatedDoseRefNumber',
  x300800a0: 'BeamLimitingDeviceLeafPairsSeq',
  x300800b0: 'RecordedWedgeSequence',
  x300800c0: 'RecordedCompensatorSequence',
  x300800d0: 'RecordedBlockSequence',
  x300800e0: 'TreatmentSummaryMeasuredDoseRefSeq',
  x300800f0: 'RecordedSnoutSequence',
  x300800f2: 'RecordedRangeShifterSequence',
  x300800f4: 'RecordedLateralSpreadingDeviceSeq',
  x300800f6: 'RecordedRangeModulatorSequence',
  x30080100: 'RecordedSourceSequence',
  x30080105: 'SourceSerialNumber',
  x30080110: 'TreatmentSessionAppSetupSeq',
  x30080116: 'ApplicationSetupCheck',
  x30080120: 'RecordedBrachyAccessoryDeviceSeq',
  x30080122: 'ReferencedBrachyAccessoryDeviceNum',
  x30080130: 'RecordedChannelSequence',
  x30080132: 'SpecifiedChannelTotalTime',
  x30080134: 'DeliveredChannelTotalTime',
  x30080136: 'SpecifiedNumberOfPulses',
  x30080138: 'DeliveredNumberOfPulses',
  x3008013a: 'SpecifiedPulseRepetitionInterval',
  x3008013c: 'DeliveredPulseRepetitionInterval',
  x30080140: 'RecordedSourceApplicatorSequence',
  x30080142: 'ReferencedSourceApplicatorNumber',
  x30080150: 'RecordedChannelShieldSequence',
  x30080152: 'ReferencedChannelShieldNumber',
  x30080160: 'BrachyControlPointDeliveredSeq',
  x30080162: 'SafePositionExitDate',
  x30080164: 'SafePositionExitTime',
  x30080166: 'SafePositionReturnDate',
  x30080168: 'SafePositionReturnTime',
  x30080200: 'CurrentTreatmentStatus',
  x30080202: 'TreatmentStatusComment',
  x30080220: 'FractionGroupSummarySequence',
  x30080223: 'ReferencedFractionNumber',
  x30080224: 'FractionGroupType',
  x30080230: 'BeamStopperPosition',
  x30080240: 'FractionStatusSummarySequence',
  x30080250: 'TreatmentDate',
  x30080251: 'TreatmentTime',
  x300a0002: 'RTPlanLabel',
  x300a0003: 'RTPlanName',
  x300a0004: 'RTPlanDescription',
  x300a0006: 'RTPlanDate',
  x300a0007: 'RTPlanTime',
  x300a0009: 'TreatmentProtocols',
  x300a000a: 'PlanIntent',
  x300a000b: 'TreatmentSites',
  x300a000c: 'RTPlanGeometry',
  x300a000e: 'PrescriptionDescription',
  x300a0010: 'DoseReferenceSequence',
  x300a0012: 'DoseReferenceNumber',
  x300a0013: 'DoseReferenceUID',
  x300a0014: 'DoseReferenceStructureType',
  x300a0015: 'NominalBeamEnergyUnit',
  x300a0016: 'DoseReferenceDescription',
  x300a0018: 'DoseReferencePointCoordinates',
  x300a001a: 'NominalPriorDose',
  x300a0020: 'DoseReferenceType',
  x300a0021: 'ConstraintWeight',
  x300a0022: 'DeliveryWarningDose',
  x300a0023: 'DeliveryMaximumDose',
  x300a0025: 'TargetMinimumDose',
  x300a0026: 'TargetPrescriptionDose',
  x300a0027: 'TargetMaximumDose',
  x300a0028: 'TargetUnderdoseVolumeFraction',
  x300a002a: 'OrganAtRiskFullVolumeDose',
  x300a002b: 'OrganAtRiskLimitDose',
  x300a002c: 'OrganAtRiskMaximumDose',
  x300a002d: 'OrganAtRiskOverdoseVolumeFraction',
  x300a0040: 'ToleranceTableSequence',
  x300a0042: 'ToleranceTableNumber',
  x300a0043: 'ToleranceTableLabel',
  x300a0044: 'GantryAngleTolerance',
  x300a0046: 'BeamLimitingDeviceAngleTolerance',
  x300a0048: 'BeamLimitingDeviceToleranceSeq',
  x300a004a: 'BeamLimitingDevicePositionTol',
  x300a004b: 'SnoutPositionTolerance',
  x300a004c: 'PatientSupportAngleTolerance',
  x300a004e: 'TableTopEccentricAngleTolerance',
  x300a004f: 'TableTopPitchAngleTolerance',
  x300a0050: 'TableTopRollAngleTolerance',
  x300a0051: 'TableTopVerticalPositionTolerance',
  x300a0052: 'TableTopLongitudinalPositionTol',
  x300a0053: 'TableTopLateralPositionTolerance',
  x300a0055: 'RTPlanRelationship',
  x300a0070: 'FractionGroupSequence',
  x300a0071: 'FractionGroupNumber',
  x300a0072: 'FractionGroupDescription',
  x300a0078: 'NumberOfFractionsPlanned',
  x300a0079: 'NumberFractionPatternDigitsPerDay',
  x300a007a: 'RepeatFractionCycleLength',
  x300a007b: 'FractionPattern',
  x300a0080: 'NumberOfBeams',
  x300a0082: 'BeamDoseSpecificationPoint',
  x300a0084: 'BeamDose',
  x300a0086: 'BeamMeterset',
  x300a0088: 'BeamDosePointDepth',
  x300a0089: 'BeamDosePointEquivalentDepth',
  x300a008a: 'BeamDosePointSSD',
  x300a00a0: 'NumberOfBrachyApplicationSetups',
  x300a00a2: 'BrachyAppSetupDoseSpecPoint',
  x300a00a4: 'BrachyApplicationSetupDose',
  x300a00b0: 'BeamSequence',
  x300a00b2: 'TreatmentMachineName',
  x300a00b3: 'PrimaryDosimeterUnit',
  x300a00b4: 'SourceAxisDistance',
  x300a00b6: 'BeamLimitingDeviceSequence',
  x300a00b8: 'RTBeamLimitingDeviceType',
  x300a00ba: 'SourceToBeamLimitingDeviceDistance',
  x300a00bb: 'IsocenterToBeamLimitingDeviceDist',
  x300a00bc: 'NumberOfLeafJawPairs',
  x300a00be: 'LeafPositionBoundaries',
  x300a00c0: 'BeamNumber',
  x300a00c2: 'BeamName',
  x300a00c3: 'BeamDescription',
  x300a00c4: 'BeamType',
  x300a00c6: 'RadiationType',
  x300a00c7: 'HighDoseTechniqueType',
  x300a00c8: 'ReferenceImageNumber',
  x300a00ca: 'PlannedVerificationImageSequence',
  x300a00cc: 'ImagingDeviceSpecificAcqParams',
  x300a00ce: 'TreatmentDeliveryType',
  x300a00d0: 'NumberOfWedges',
  x300a00d1: 'WedgeSequence',
  x300a00d2: 'WedgeNumber',
  x300a00d3: 'WedgeType',
  x300a00d4: 'WedgeID',
  x300a00d5: 'WedgeAngle',
  x300a00d6: 'WedgeFactor',
  x300a00d7: 'TotalWedgeTrayWaterEquivThickness',
  x300a00d8: 'WedgeOrientation',
  x300a00d9: 'IsocenterToWedgeTrayDistance',
  x300a00da: 'SourceToWedgeTrayDistance',
  x300a00db: 'WedgeThinEdgePosition',
  x300a00dc: 'BolusID',
  x300a00dd: 'BolusDescription',
  x300a00e0: 'NumberOfCompensators',
  x300a00e1: 'MaterialID',
  x300a00e2: 'TotalCompensatorTrayFactor',
  x300a00e3: 'CompensatorSequence',
  x300a00e4: 'CompensatorNumber',
  x300a00e5: 'CompensatorID',
  x300a00e6: 'SourceToCompensatorTrayDistance',
  x300a00e7: 'CompensatorRows',
  x300a00e8: 'CompensatorColumns',
  x300a00e9: 'CompensatorPixelSpacing',
  x300a00ea: 'CompensatorPosition',
  x300a00eb: 'CompensatorTransmissionData',
  x300a00ec: 'CompensatorThicknessData',
  x300a00ed: 'NumberOfBoli',
  x300a00ee: 'CompensatorType',
  x300a00f0: 'NumberOfBlocks',
  x300a00f2: 'TotalBlockTrayFactor',
  x300a00f3: 'TotalBlockTrayWaterEquivThickness',
  x300a00f4: 'BlockSequence',
  x300a00f5: 'BlockTrayID',
  x300a00f6: 'SourceToBlockTrayDistance',
  x300a00f7: 'IsocenterToBlockTrayDistance',
  x300a00f8: 'BlockType',
  x300a00f9: 'AccessoryCode',
  x300a00fa: 'BlockDivergence',
  x300a00fb: 'BlockMountingPosition',
  x300a00fc: 'BlockNumber',
  x300a00fe: 'BlockName',
  x300a0100: 'BlockThickness',
  x300a0102: 'BlockTransmission',
  x300a0104: 'BlockNumberOfPoints',
  x300a0106: 'BlockData',
  x300a0107: 'ApplicatorSequence',
  x300a0108: 'ApplicatorID',
  x300a0109: 'ApplicatorType',
  x300a010a: 'ApplicatorDescription',
  x300a010c: 'CumulativeDoseReferenceCoefficient',
  x300a010e: 'FinalCumulativeMetersetWeight',
  x300a0110: 'NumberOfControlPoints',
  x300a0111: 'ControlPointSequence',
  x300a0112: 'ControlPointIndex',
  x300a0114: 'NominalBeamEnergy',
  x300a0115: 'DoseRateSet',
  x300a0116: 'WedgePositionSequence',
  x300a0118: 'WedgePosition',
  x300a011a: 'BeamLimitingDevicePositionSequence',
  x300a011c: 'LeafJawPositions',
  x300a011e: 'GantryAngle',
  x300a011f: 'GantryRotationDirection',
  x300a0120: 'BeamLimitingDeviceAngle',
  x300a0121: 'BeamLimitingDeviceRotateDirection',
  x300a0122: 'PatientSupportAngle',
  x300a0123: 'PatientSupportRotationDirection',
  x300a0124: 'TableTopEccentricAxisDistance',
  x300a0125: 'TableTopEccentricAngle',
  x300a0126: 'TableTopEccentricRotateDirection',
  x300a0128: 'TableTopVerticalPosition',
  x300a0129: 'TableTopLongitudinalPosition',
  x300a012a: 'TableTopLateralPosition',
  x300a012c: 'IsocenterPosition',
  x300a012e: 'SurfaceEntryPoint',
  x300a0130: 'SourceToSurfaceDistance',
  x300a0134: 'CumulativeMetersetWeight',
  x300a0140: 'TableTopPitchAngle',
  x300a0142: 'TableTopPitchRotationDirection',
  x300a0144: 'TableTopRollAngle',
  x300a0146: 'TableTopRollRotationDirection',
  x300a0148: 'HeadFixationAngle',
  x300a014a: 'GantryPitchAngle',
  x300a014c: 'GantryPitchRotationDirection',
  x300a014e: 'GantryPitchAngleTolerance',
  x300a0180: 'PatientSetupSequence',
  x300a0182: 'PatientSetupNumber',
  x300a0183: 'PatientSetupLabel',
  x300a0184: 'PatientAdditionalPosition',
  x300a0190: 'FixationDeviceSequence',
  x300a0192: 'FixationDeviceType',
  x300a0194: 'FixationDeviceLabel',
  x300a0196: 'FixationDeviceDescription',
  x300a0198: 'FixationDevicePosition',
  x300a0199: 'FixationDevicePitchAngle',
  x300a019a: 'FixationDeviceRollAngle',
  x300a01a0: 'ShieldingDeviceSequence',
  x300a01a2: 'ShieldingDeviceType',
  x300a01a4: 'ShieldingDeviceLabel',
  x300a01a6: 'ShieldingDeviceDescription',
  x300a01a8: 'ShieldingDevicePosition',
  x300a01b0: 'SetupTechnique',
  x300a01b2: 'SetupTechniqueDescription',
  x300a01b4: 'SetupDeviceSequence',
  x300a01b6: 'SetupDeviceType',
  x300a01b8: 'SetupDeviceLabel',
  x300a01ba: 'SetupDeviceDescription',
  x300a01bc: 'SetupDeviceParameter',
  x300a01d0: 'SetupReferenceDescription',
  x300a01d2: 'TableTopVerticalSetupDisplacement',
  x300a01d4: 'TableTopLongitudinalSetupDisplace',
  x300a01d6: 'TableTopLateralSetupDisplacement',
  x300a0200: 'BrachyTreatmentTechnique',
  x300a0202: 'BrachyTreatmentType',
  x300a0206: 'TreatmentMachineSequence',
  x300a0210: 'SourceSequence',
  x300a0212: 'SourceNumber',
  x300a0214: 'SourceType',
  x300a0216: 'SourceManufacturer',
  x300a0218: 'ActiveSourceDiameter',
  x300a021a: 'ActiveSourceLength',
  x300a0222: 'SourceEncapsulationNomThickness',
  x300a0224: 'SourceEncapsulationNomTransmission',
  x300a0226: 'SourceIsotopeName',
  x300a0228: 'SourceIsotopeHalfLife',
  x300a0229: 'SourceStrengthUnits',
  x300a022a: 'ReferenceAirKermaRate',
  x300a022b: 'SourceStrength',
  x300a022c: 'SourceStrengthReferenceDate',
  x300a022e: 'SourceStrengthReferenceTime',
  x300a0230: 'ApplicationSetupSequence',
  x300a0232: 'ApplicationSetupType',
  x300a0234: 'ApplicationSetupNumber',
  x300a0236: 'ApplicationSetupName',
  x300a0238: 'ApplicationSetupManufacturer',
  x300a0240: 'TemplateNumber',
  x300a0242: 'TemplateType',
  x300a0244: 'TemplateName',
  x300a0250: 'TotalReferenceAirKerma',
  x300a0260: 'BrachyAccessoryDeviceSequence',
  x300a0262: 'BrachyAccessoryDeviceNumber',
  x300a0263: 'BrachyAccessoryDeviceID',
  x300a0264: 'BrachyAccessoryDeviceType',
  x300a0266: 'BrachyAccessoryDeviceName',
  x300a026a: 'BrachyAccessoryDeviceNomThickness',
  x300a026c: 'BrachyAccessoryDevNomTransmission',
  x300a0280: 'ChannelSequence',
  x300a0282: 'ChannelNumber',
  x300a0284: 'ChannelLength',
  x300a0286: 'ChannelTotalTime',
  x300a0288: 'SourceMovementType',
  x300a028a: 'NumberOfPulses',
  x300a028c: 'PulseRepetitionInterval',
  x300a0290: 'SourceApplicatorNumber',
  x300a0291: 'SourceApplicatorID',
  x300a0292: 'SourceApplicatorType',
  x300a0294: 'SourceApplicatorName',
  x300a0296: 'SourceApplicatorLength',
  x300a0298: 'SourceApplicatorManufacturer',
  x300a029c: 'SourceApplicatorWallNomThickness',
  x300a029e: 'SourceApplicatorWallNomTrans',
  x300a02a0: 'SourceApplicatorStepSize',
  x300a02a2: 'TransferTubeNumber',
  x300a02a4: 'TransferTubeLength',
  x300a02b0: 'ChannelShieldSequence',
  x300a02b2: 'ChannelShieldNumber',
  x300a02b3: 'ChannelShieldID',
  x300a02b4: 'ChannelShieldName',
  x300a02b8: 'ChannelShieldNominalThickness',
  x300a02ba: 'ChannelShieldNominalTransmission',
  x300a02c8: 'FinalCumulativeTimeWeight',
  x300a02d0: 'BrachyControlPointSequence',
  x300a02d2: 'ControlPointRelativePosition',
  x300a02d4: 'ControlPoint3DPosition',
  x300a02d6: 'CumulativeTimeWeight',
  x300a02e0: 'CompensatorDivergence',
  x300a02e1: 'CompensatorMountingPosition',
  x300a02e2: 'SourceToCompensatorDistance',
  x300a02e3: 'TotalCompTrayWaterEquivThickness',
  x300a02e4: 'IsocenterToCompensatorTrayDistance',
  x300a02e5: 'CompensatorColumnOffset',
  x300a02e6: 'IsocenterToCompensatorDistances',
  x300a02e7: 'CompensatorRelStoppingPowerRatio',
  x300a02e8: 'CompensatorMillingToolDiameter',
  x300a02ea: 'IonRangeCompensatorSequence',
  x300a02eb: 'CompensatorDescription',
  x300a0302: 'RadiationMassNumber',
  x300a0304: 'RadiationAtomicNumber',
  x300a0306: 'RadiationChargeState',
  x300a0308: 'ScanMode',
  x300a030a: 'VirtualSourceAxisDistances',
  x300a030c: 'SnoutSequence',
  x300a030d: 'SnoutPosition',
  x300a030f: 'SnoutID',
  x300a0312: 'NumberOfRangeShifters',
  x300a0314: 'RangeShifterSequence',
  x300a0316: 'RangeShifterNumber',
  x300a0318: 'RangeShifterID',
  x300a0320: 'RangeShifterType',
  x300a0322: 'RangeShifterDescription',
  x300a0330: 'NumberOfLateralSpreadingDevices',
  x300a0332: 'LateralSpreadingDeviceSequence',
  x300a0334: 'LateralSpreadingDeviceNumber',
  x300a0336: 'LateralSpreadingDeviceID',
  x300a0338: 'LateralSpreadingDeviceType',
  x300a033a: 'LateralSpreadingDeviceDescription',
  x300a033c: 'LateralSpreadingDevWaterEquivThick',
  x300a0340: 'NumberOfRangeModulators',
  x300a0342: 'RangeModulatorSequence',
  x300a0344: 'RangeModulatorNumber',
  x300a0346: 'RangeModulatorID',
  x300a0348: 'RangeModulatorType',
  x300a034a: 'RangeModulatorDescription',
  x300a034c: 'BeamCurrentModulationID',
  x300a0350: 'PatientSupportType',
  x300a0352: 'PatientSupportID',
  x300a0354: 'PatientSupportAccessoryCode',
  x300a0356: 'FixationLightAzimuthalAngle',
  x300a0358: 'FixationLightPolarAngle',
  x300a035a: 'MetersetRate',
  x300a0360: 'RangeShifterSettingsSequence',
  x300a0362: 'RangeShifterSetting',
  x300a0364: 'IsocenterToRangeShifterDistance',
  x300a0366: 'RangeShifterWaterEquivThickness',
  x300a0370: 'LateralSpreadingDeviceSettingsSeq',
  x300a0372: 'LateralSpreadingDeviceSetting',
  x300a0374: 'IsocenterToLateralSpreadingDevDist',
  x300a0380: 'RangeModulatorSettingsSequence',
  x300a0382: 'RangeModulatorGatingStartValue',
  x300a0384: 'RangeModulatorGatingStopValue',
  x300a038a: 'IsocenterToRangeModulatorDistance',
  x300a0390: 'ScanSpotTuneID',
  x300a0392: 'NumberOfScanSpotPositions',
  x300a0394: 'ScanSpotPositionMap',
  x300a0396: 'ScanSpotMetersetWeights',
  x300a0398: 'ScanningSpotSize',
  x300a039a: 'NumberOfPaintings',
  x300a03a0: 'IonToleranceTableSequence',
  x300a03a2: 'IonBeamSequence',
  x300a03a4: 'IonBeamLimitingDeviceSequence',
  x300a03a6: 'IonBlockSequence',
  x300a03a8: 'IonControlPointSequence',
  x300a03aa: 'IonWedgeSequence',
  x300a03ac: 'IonWedgePositionSequence',
  x300a0401: 'ReferencedSetupImageSequence',
  x300a0402: 'SetupImageComment',
  x300a0410: 'MotionSynchronizationSequence',
  x300a0412: 'ControlPointOrientation',
  x300a0420: 'GeneralAccessorySequence',
  x300a0421: 'GeneralAccessoryID',
  x300a0422: 'GeneralAccessoryDescription',
  x300a0423: 'GeneralAccessoryType',
  x300a0424: 'GeneralAccessoryNumber',
  x300c0002: 'ReferencedRTPlanSequence',
  x300c0004: 'ReferencedBeamSequence',
  x300c0006: 'ReferencedBeamNumber',
  x300c0007: 'ReferencedReferenceImageNumber',
  x300c0008: 'StartCumulativeMetersetWeight',
  x300c0009: 'EndCumulativeMetersetWeight',
  x300c000a: 'ReferencedBrachyAppSetupSeq',
  x300c000c: 'ReferencedBrachyAppSetupNumber',
  x300c000e: 'ReferencedSourceNumber',
  x300c0020: 'ReferencedFractionGroupSequence',
  x300c0022: 'ReferencedFractionGroupNumber',
  x300c0040: 'ReferencedVerificationImageSeq',
  x300c0042: 'ReferencedReferenceImageSequence',
  x300c0050: 'ReferencedDoseReferenceSequence',
  x300c0051: 'ReferencedDoseReferenceNumber',
  x300c0055: 'BrachyReferencedDoseReferenceSeq',
  x300c0060: 'ReferencedStructureSetSequence',
  x300c006a: 'ReferencedPatientSetupNumber',
  x300c0080: 'ReferencedDoseSequence',
  x300c00a0: 'ReferencedToleranceTableNumber',
  x300c00b0: 'ReferencedBolusSequence',
  x300c00c0: 'ReferencedWedgeNumber',
  x300c00d0: 'ReferencedCompensatorNumber',
  x300c00e0: 'ReferencedBlockNumber',
  x300c00f0: 'ReferencedControlPointIndex',
  x300c00f2: 'ReferencedControlPointSequence',
  x300c00f4: 'ReferencedStartControlPointIndex',
  x300c00f6: 'ReferencedStopControlPointIndex',
  x300c0100: 'ReferencedRangeShifterNumber',
  x300c0102: 'ReferencedLateralSpreadingDevNum',
  x300c0104: 'ReferencedRangeModulatorNumber',
  x300e0002: 'ApprovalStatus',
  x300e0004: 'ReviewDate',
  x300e0005: 'ReviewTime',
  x300e0008: 'ReviewerName',
  x40000000: 'TextGroupLength',
  x40000010: 'Arbitrary',
  x40004000: 'TextComments',
  x40080040: 'ResultsID',
  x40080042: 'ResultsIDIssuer',
  x40080050: 'ReferencedInterpretationSequence',
  x40080100: 'InterpretationRecordedDate',
  x40080101: 'InterpretationRecordedTime',
  x40080102: 'InterpretationRecorder',
  x40080103: 'ReferenceToRecordedSound',
  x40080108: 'InterpretationTranscriptionDate',
  x40080109: 'InterpretationTranscriptionTime',
  x4008010a: 'InterpretationTranscriber',
  x4008010b: 'InterpretationText',
  x4008010c: 'InterpretationAuthor',
  x40080111: 'InterpretationApproverSequence',
  x40080112: 'InterpretationApprovalDate',
  x40080113: 'InterpretationApprovalTime',
  x40080114: 'PhysicianApprovingInterpretation',
  x40080115: 'InterpretationDiagnosisDescription',
  x40080117: 'InterpretationDiagnosisCodeSeq',
  x40080118: 'ResultsDistributionListSequence',
  x40080119: 'DistributionName',
  x4008011a: 'DistributionAddress',
  x40080200: 'InterpretationID',
  x40080202: 'InterpretationIDIssuer',
  x40080210: 'InterpretationTypeID',
  x40080212: 'InterpretationStatusID',
  x40080300: 'Impressions',
  x40084000: 'ResultsComments',
  x4ffe0001: 'MACParametersSequence',
  x50xx0005: 'CurveDimensions',
  x50xx0010: 'NumberOfPoints',
  x50xx0020: 'TypeOfData',
  x50xx0022: 'CurveDescription',
  x50xx0030: 'AxisUnits',
  x50xx0040: 'AxisLabels',
  x50xx0103: 'DataValueRepresentation',
  x50xx0104: 'MinimumCoordinateValue',
  x50xx0105: 'MaximumCoordinateValue',
  x50xx0106: 'CurveRange',
  x50xx0110: 'CurveDataDescriptor',
  x50xx0112: 'CoordinateStartValue',
  x50xx0114: 'CoordinateStepValue',
  x50xx1001: 'CurveActivationLayer',
  x50xx2000: 'AudioType',
  x50xx2002: 'AudioSampleFormat',
  x50xx2004: 'NumberOfChannels',
  x50xx2006: 'NumberOfSamples',
  x50xx2008: 'SampleRate',
  x50xx200a: 'TotalTime',
  x50xx200c: 'AudioSampleData',
  x50xx200e: 'AudioComments',
  x50xx2500: 'CurveLabel',
  x50xx2600: 'CurveReferencedOverlaySequence',
  x50xx2610: 'ReferencedOverlayGroup',
  x50xx3000: 'CurveData',
  x52009229: 'SharedFunctionalGroupsSequence',
  x52009230: 'PerFrameFunctionalGroupsSequence',
  x54000100: 'WaveformSequence',
  x54000110: 'ChannelMinimumValue',
  x54000112: 'ChannelMaximumValue',
  x54001004: 'WaveformBitsAllocated',
  x54001006: 'WaveformSampleInterpretation',
  x5400100a: 'WaveformPaddingValue',
  x54001010: 'WaveformData',
  x56000010: 'FirstOrderPhaseCorrectionAngle',
  x56000020: 'SpectroscopyData',
  x60000000: 'OverlayGroupLength',
  x60xx0010: 'OverlayRows',
  x60xx0011: 'OverlayColumns',
  x60xx0012: 'OverlayPlanes',
  x60xx0015: 'NumberOfFramesInOverlay',
  x60xx0022: 'OverlayDescription',
  x60xx0040: 'OverlayType',
  x60xx0045: 'OverlaySubtype',
  x60xx0050: 'OverlayOrigin',
  x60xx0051: 'ImageFrameOrigin',
  x60xx0052: 'OverlayPlaneOrigin',
  x60xx0060: 'OverlayCompressionCode',
  x60xx0061: 'OverlayCompressionOriginator',
  x60xx0062: 'OverlayCompressionLabel',
  x60xx0063: 'OverlayCompressionDescription',
  x60xx0066: 'OverlayCompressionStepPointers',
  x60xx0068: 'OverlayRepeatInterval',
  x60xx0069: 'OverlayBitsGrouped',
  x60xx0100: 'OverlayBitsAllocated',
  x60xx0102: 'OverlayBitPosition',
  x60xx0110: 'OverlayFormat',
  x60xx0200: 'OverlayLocation',
  x60xx0800: 'OverlayCodeLabel',
  x60xx0802: 'OverlayNumberOfTables',
  x60xx0803: 'OverlayCodeTableLocation',
  x60xx0804: 'OverlayBitsForCodeWord',
  x60xx1001: 'OverlayActivationLayer',
  x60xx1100: 'OverlayDescriptorGray',
  x60xx1101: 'OverlayDescriptorRed',
  x60xx1102: 'OverlayDescriptorGreen',
  x60xx1103: 'OverlayDescriptorBlue',
  x60xx1200: 'OverlaysGray',
  x60xx1201: 'OverlaysRed',
  x60xx1202: 'OverlaysGreen',
  x60xx1203: 'OverlaysBlue',
  x60xx1301: 'ROIArea',
  x60xx1302: 'ROIMean',
  x60xx1303: 'ROIStandardDeviation',
  x60xx1500: 'OverlayLabel',
  x60xx3000: 'OverlayData',
  x60xx4000: 'OverlayComments',
  x7fxx0000: 'PixelDataGroupLength',
  x7fxx0010: 'PixelData',
  x7fxx0011: 'VariableNextDataGroup',
  x7fxx0020: 'VariableCoefficientsSDVN',
  x7fxx0030: 'VariableCoefficientsSDHN',
  x7fxx0040: 'VariableCoefficientsSDDN',
  xfffafffa: 'DigitalSignaturesSequence',
  xfffcfffc: 'DataSetTrailingPadding',
  xfffee000: 'StartOfItem',
  xfffee00d: 'EndOfItems',
  xfffee0dd: 'EndOfSequence'
};
DICOMTagDescriptions.init(initialTagDescriptionMap); // Discard original map...

initialTagDescriptionMap = null;

/**
 * A small set of utilities to help parsing DICOM element values.
 * In the future the functionality provided by this library might
 * be incorporated into dicomParser library.
 */

var parsingUtils = {
  /**
   * Check if supplied argument is a valid instance of the dicomParser.DataSet class.
   * @param data {Object} An instance of the dicomParser.DataSet class.
   * @returns {Boolean} Returns true if data is a valid instance of the dicomParser.DataSet class.
   */
  isValidDataSet: function isValidDataSet(data) {
    return data instanceof dicomParser.DataSet;
  },

  /**
   * Parses an element tag according to the 'AT' VR definition.
   * @param data {Object} An instance of the dicomParser.DataSet class.
   * @param tag {String} A DICOM tag with in the format xGGGGEEEE.
   * @returns {String} A string representation of a data element tag or null if the field is not present or data is not long enough.
   */
  attributeTag: function attributeTag(data, tag) {
    if (this.isValidDataSet(data) && tag in data.elements) {
      var element = data.elements[tag];

      if (element && element.length === 4) {
        var parser = data.byteArrayParser.readUint16,
            bytes = data.byteArray,
            offset = element.dataOffset;
        return 'x' + ('00000000' + (parser(bytes, offset) * 256 * 256 + parser(bytes, offset + 2)).toString(16)).substr(-8);
      }
    }

    return null;
  },

  /**
   * Parses the string representation of a multi-valued element into an array of strings. If the parser
   * parameter is passed and is a function, it will be applied to each element of the resulting array.
   * @param data {Object} An instance of the dicomParser.DataSet class.
   * @param tag {String} A DICOM tag with in the format xGGGGEEEE.
   * @param parser {Function} An optional parser function that can be applied to each element of the array.
   * @returns {Array} An array of floating point numbers or null if the field is not present or data is not long enough.
   */
  multiValue: function multiValue(data, tag, parser) {
    if (this.isValidDataSet(data) && tag in data.elements) {
      var element = data.elements[tag];

      if (element && element.length > 0) {
        var string = dicomParser.readFixedString(data.byteArray, element.dataOffset, element.length);

        if (typeof string === 'string' && string.length > 0) {
          if (typeof parser !== 'function') {
            parser = null;
          }

          return string.split('\\').map(function (value) {
            value = value.trim();
            return parser !== null ? parser(value) : value;
          });
        }
      }
    }

    return null;
  },

  /**
   * Parses a string to an array of floats for a multi-valued element.
   * @param data {Object} An instance of the dicomParser.DataSet class.
   * @param tag {String} A DICOM tag with in the format xGGGGEEEE.
   * @returns {Array} An array of floating point numbers or null if the field is not present or data is not long enough.
   */
  floatArray: function floatArray(data, tag) {
    return this.multiValue(data, tag, parseFloat);
  }
};

/**
 * Returns the specified element as a dicom attribute group/element.
 *
 * @param element - The group/element of the element (e.g. '00280009')
 * @param [defaultValue] - The value to return if the element is not present
 * @returns {*}
 */
function getAttribute(element, defaultValue) {
  if (!element) {
    return defaultValue;
  } // Value is not present if the attribute has a zero length value


  if (!element.Value) {
    return defaultValue;
  } // Sanity check to make sure we have at least one entry in the array.


  if (!element.Value.length) {
    return defaultValue;
  }

  return convertToInt(element.Value);
}

function convertToInt(input) {
  function padFour(input) {
    var l = input.length;
    if (l == 0) return '0000';
    if (l == 1) return '000' + input;
    if (l == 2) return '00' + input;
    if (l == 3) return '0' + input;
    return input;
  }

  var output = '';

  for (var i = 0; i < input.length; i++) {
    for (var j = 0; j < input[i].length; j++) {
      output += padFour(input[i].charCodeAt(j).toString(16));
    }
  }

  return parseInt(output, 16);
}

var btoa = function btoa(val) {
  return new Buffer(val).toString('base64');
};

// These should be overridden by the implementation
var user = {
  userLoggedIn: function userLoggedIn() {
    return false;
  },
  getUserId: function getUserId() {
    return null;
  },
  getName: function getName() {
    return null;
  },
  getAccessToken: function getAccessToken() {
    return null;
  },
  login: function login() {
    return new Promise(function (resolve, reject) {
      return reject();
    });
  },
  logout: function logout() {
    return new Promise(function (resolve, reject) {
      return reject();
    });
  },
  getData: function getData(key) {
    return null;
  },
  setData: function setData(key, value) {
    return null;
  }
};

/**
 * Returns the Authorization header as part of an Object.
 *
 * @returns {Object}
 */

function getAuthorizationHeader(server) {
  var headers = {}; // Check for OHIF.user since this can also be run on the server

  var accessToken = user && user.getAccessToken && user.getAccessToken();

  if (server && server.requestOptions && server.requestOptions.auth) {
    // HTTP Basic Auth (user:password)
    headers.Authorization = "Basic ".concat(btoa(server.requestOptions.auth));
  } else if (accessToken) {
    headers.Authorization = "Bearer ".concat(accessToken);
  }

  return headers;
}

function getModalities(modality, modalitiesInStudy) {
  var modalities = {};

  if (modality) {
    modalities = modality;
  }

  if (modalitiesInStudy) {
    // Find vr in modalities
    if (modalities.vr && modalities.vr === modalitiesInStudy.vr) {
      for (var i = 0; i < modalitiesInStudy.Value.length; i++) {
        var value = modalitiesInStudy.Value[i];

        if (modalities.Value.indexOf(value) === -1) {
          modalities.Value.push(value);
        }
      }
    } else {
      modalities = modalitiesInStudy;
    }
  }

  return modalities;
}

/**
 * Returns the Alphabetic version of a PN
 *
 * @param element - The group/element of the element (e.g. '00200013')
 * @param [defaultValue] - The default value to return if the element is not found
 * @returns {*}
 */
function getName(element, defaultValue) {
  if (!element) {
    return defaultValue;
  } // Value is not present if the attribute has a zero length value


  if (!element.Value) {
    return defaultValue;
  } // Sanity check to make sure we have at least one entry in the array.


  if (!element.Value.length) {
    return defaultValue;
  } // Return the Alphabetic component group


  if (element.Value[0].Alphabetic) {
    return element.Value[0].Alphabetic;
  } // Orthanc does not return PN properly so this is a temporary workaround


  return element.Value[0];
}

/**
 * Returns the first string value as a Javascript Number
 * @param element - The group/element of the element (e.g. '00200013')
 * @param [defaultValue] - The default value to return if the element does not exist
 * @returns {*}
 */
function getNumber(element, defaultValue) {
  if (!element) {
    return defaultValue;
  } // Value is not present if the attribute has a zero length value


  if (!element.Value) {
    return defaultValue;
  } // Sanity check to make sure we have at least one entry in the array.


  if (!element.Value.length) {
    return defaultValue;
  }

  return parseFloat(element.Value[0]);
}

/**
 * Returns the specified element as a string.  Multi-valued elements will be separated by a backslash
 *
 * @param element - The group/element of the element (e.g. '00200013')
 * @param [defaultValue] - The value to return if the element is not present
 * @returns {*}
 */
function getString(element, defaultValue) {
  if (!element) {
    return defaultValue;
  } // Value is not present if the attribute has a zero length value


  if (!element.Value) {
    return defaultValue;
  } // Sanity check to make sure we have at least one entry in the array.


  if (!element.Value.length) {
    return defaultValue;
  } // Join the array together separated by backslash
  // NOTE: Orthanc does not correctly split values into an array so the join is a no-op


  return element.Value.join('\\');
}

var DICOMWeb = {
  getAttribute: getAttribute,
  getAuthorizationHeader: getAuthorizationHeader,
  getModalities: getModalities,
  getName: getName,
  getNumber: getNumber,
  getString: getString
};

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var dicomwebClient = createCommonjsModule(function (module, exports) {
(function (global, factory) {
  factory(exports);
})(commonjsGlobal, function (exports) {
  /**
   * Converts a Uint8Array to a String.
   * @param {Uint8Array} array that should be converted
   * @param {Number} offset array offset in case only subset of array items should be extracted (default: 0)
   * @param {Number} limit maximum number of array items that should be extracted (defaults to length of array)
   * @returns {String}
   */

  function uint8ArrayToString(arr, offset, limit) {
    offset = offset || 0;
    limit = limit || arr.length - offset;
    let str = '';

    for (let i = offset; i < offset + limit; i++) {
      str += String.fromCharCode(arr[i]);
    }

    return str;
  }
  /**
   * Converts a String to a Uint8Array.
   * @param {String} str string that should be converted
   * @returns {Uint8Array}
   */


  function stringToUint8Array(str) {
    const arr = new Uint8Array(str.length);

    for (let i = 0, j = str.length; i < j; i++) {
      arr[i] = str.charCodeAt(i);
    }

    return arr;
  }
  /**
   * Identifies the boundary in a multipart/related message header.
   * @param {String} header message header
   * @returns {String} boundary
   */


  function identifyBoundary(header) {
    const parts = header.split('\r\n');

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].substr(0, 2) === '--') {
        return parts[i];
      }
    }
  }
  /**
   * Checks whether a given token is contained by a message at a given offset.
   * @param {Uint8Array} message message content
   * @param {Uint8Array} token substring that should be present
   * @param {String} offset offset in message content from where search should start
   * @returns {Boolean} whether message contains token at offset
   */


  function containsToken(message, token, offset = 0) {
    if (message + token.length > message.length) {
      return false;
    }

    let index = offset;

    for (let i = 0; i < token.length; i++) {
      if (token[i] !== message[index++]) {
        return false;
      }
    }

    return true;
  }
  /**
   * Finds a given token in a message at a given offset.
   * @param {Uint8Array} message message content
   * @param {Uint8Array} token substring that should be found
   * @param {String} offset message body offset from where search should start
   * @returns {Boolean} whether message has a part at given offset or not
   */


  function findToken(message, token, offset = 0) {
    const messageLength = message.length;

    for (let i = offset; i < messageLength; i++) {
      // If the first value of the message matches
      // the first value of the token, check if
      // this is the full token.
      if (message[i] === token[0]) {
        if (containsToken(message, token, i)) {
          return i;
        }
      }
    }

    return -1;
  }
  /**
   * @typedef {Object} MultipartEncodedData
   * @property {ArrayBuffer} data The encoded Multipart Data
   * @property {String} boundary The boundary used to divide pieces of the encoded data
   */

  /**
   * Encode one or more DICOM datasets into a single body so it can be
   * sent using the Multipart Content-Type.
   *
   * @param {ArrayBuffer[]} datasets Array containing each file to be encoded in the multipart body, passed as ArrayBuffers.
   * @param {String} [boundary] Optional string to define a boundary between each part of the multipart body. If this is not specified, a random GUID will be generated.
   * @return {MultipartEncodedData} The Multipart encoded data returned as an Object. This contains both the data itself, and the boundary string used to divide it.
   */


  function multipartEncode(datasets, boundary = guid(), contentType = 'application/dicom') {
    const contentTypeString = `Content-Type: ${contentType}`;
    const header = `\r\n--${boundary}\r\n${contentTypeString}\r\n\r\n`;
    const footer = `\r\n--${boundary}--`;
    const headerArray = stringToUint8Array(header);
    const footerArray = stringToUint8Array(footer);
    const headerLength = headerArray.length;
    const footerLength = footerArray.length;
    let length = 0; // Calculate the total length for the final array

    const contentArrays = datasets.map(datasetBuffer => {
      const contentArray = new Uint8Array(datasetBuffer);
      const contentLength = contentArray.length;
      length += headerLength + contentLength + footerLength;
      return contentArray;
    }); // Allocate the array

    const multipartArray = new Uint8Array(length); // Set the initial header

    multipartArray.set(headerArray, 0); // Write each dataset into the multipart array

    let position = 0;
    contentArrays.forEach(contentArray => {
      const contentLength = contentArray.length;
      multipartArray.set(headerArray, position);
      multipartArray.set(contentArray, position + headerLength);
      position += headerLength + contentArray.length;
    });
    multipartArray.set(footerArray, position);
    return {
      data: multipartArray.buffer,
      boundary
    };
  }
  /**
   * Decode a Multipart encoded ArrayBuffer and return the components as an Array.
   *
   * @param {ArrayBuffer} response Data encoded as a 'multipart/related' message
   * @returns {Array} The content
   */


  function multipartDecode(response) {
    const message = new Uint8Array(response); // First look for the multipart mime header

    const separator = stringToUint8Array('\r\n\r\n');
    const headerIndex = findToken(message, separator);

    if (headerIndex === -1) {
      throw new Error('Response message has no multipart mime header');
    }

    const header = uint8ArrayToString(message, 0, headerIndex);
    const boundaryString = identifyBoundary(header);

    if (!boundaryString) {
      throw new Error('Header of response message does not specify boundary');
    }

    const boundary = stringToUint8Array(boundaryString);
    const boundaryLength = boundary.length;
    const components = [];
    let offset = headerIndex + separator.length; // Loop until we cannot find any more boundaries

    let boundaryIndex;

    while (boundaryIndex !== -1) {
      // Search for the next boundary in the message, starting
      // from the current offset position
      boundaryIndex = findToken(message, boundary, offset); // If no further boundaries are found, stop here.

      if (boundaryIndex === -1) {
        break;
      } // Extract data from response message, excluding "\r\n"


      const spacingLength = 2;
      const length = boundaryIndex - offset - spacingLength;
      const data = response.slice(offset, offset + length); // Add the data to the array of results

      components.push(data); // Move the offset to the end of the current section,
      // plus the identified boundary

      offset += length + spacingLength + boundaryLength;
    }

    return components;
  }
  /**
   * Create a random GUID
   *
   * @return {string}
   */


  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  const getFirstResult = result => result[0];

  const MIMETYPES = {
    DICOM: 'application/dicom',
    DICOM_JSON: 'application/dicom+json',
    OCTET_STREAM: 'application/octet-stream'
  };
  /**
  * Class for interacting with DICOMweb RESTful services.
  */

  class DICOMwebClient {
    /**
    * @constructor
    * @param {Object} options (choices: "url", "username", "password", "headers")
    */
    constructor(options) {
      this.baseURL = options.url;

      if (!this.baseURL) {
        console.error('DICOMweb base url provided - calls will fail');
      }

      if ('username' in options) {
        this.username = options.username;

        if (!('password' in options)) {
          console.error('no password provided to authenticate with DICOMweb service');
        }

        this.password = options.password;
      }

      this.headers = options.headers || {};
    }

    static _parseQueryParameters(params = {}) {
      let queryString = '?';
      Object.keys(params).forEach(function (key, index) {
        if (index !== 0) {
          queryString += '&';
        }

        queryString += key + '=' + encodeURIComponent(params[key]);
      });
      return queryString;
    }

    _httpRequest(url, method, headers, options = {}) {
      return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open(method, url, true);

        if ('responseType' in options) {
          request.responseType = options.responseType;
        }

        if (typeof headers === 'object') {
          Object.keys(headers).forEach(function (key) {
            request.setRequestHeader(key, headers[key]);
          });
        } // now add custom headers from the user
        // (e.g. access tokens)


        const userHeaders = this.headers;
        Object.keys(userHeaders).forEach(function (key) {
          request.setRequestHeader(key, userHeaders[key]);
        }); // Event triggered when upload starts

        request.onloadstart = function (event) {//console.log('upload started: ', url)
        }; // Event triggered when upload ends


        request.onloadend = function (event) {//console.log('upload finished')
        }; // Handle response message


        request.onreadystatechange = function (event) {
          if (request.readyState === 4) {
            if (request.status === 200) {
              resolve(request.response);
            } else if (request.status === 202) {
              console.warn('some resources already existed: ', request);
              resolve(request.response);
            } else if (request.status === 204) {
              console.warn('empty response for request: ', request);
              resolve([]);
            } else {
              console.error('request failed: ', request);
              const error = new Error('request failed');
              error.request = request;
              error.response = request.response;
              error.status = request.status;
              console.error(error);
              console.error(error.response);
              reject(error);
            }
          }
        }; // Event triggered while download progresses


        if ('progressCallback' in options) {
          if (typeof options.progressCallback === 'function') {
            request.onprogress = options.progressCallback;
          }
        } // request.onprogress = function (event) {
        //   const loaded = progress.loaded;
        //   let total;
        //   let percentComplete;
        //   if (progress.lengthComputable) {
        //     total = progress.total;
        //     percentComplete = Math.round((loaded / total) * 100);
        //   j
        //   // console.log('download progress: ', percentComplete, ' %');
        //   return(percentComplete);
        // };


        if ('data' in options) {
          request.send(options.data);
        } else {
          request.send();
        }
      });
    }

    _httpGet(url, headers, responseType, progressCallback) {
      return this._httpRequest(url, 'get', headers, {
        responseType,
        progressCallback
      });
    }

    _httpGetApplicationJson(url, params = {}, progressCallback) {
      if (typeof params === 'object') {
        if (!isEmptyObject(params)) {
          url += DICOMwebClient._parseQueryParameters(params);
        }
      }

      const headers = {
        'Accept': MIMETYPES.DICOM_JSON
      };
      const responseType = 'json';
      return this._httpGet(url, headers, responseType, progressCallback);
    }

    _httpGetByMimeType(url, mimeType, params, responseType = 'arraybuffer', progressCallback) {
      if (typeof params === 'object') {
        if (!isEmptyObject(params)) {
          url += DICOMwebClient._parseQueryParameters(params);
        }
      }

      const headers = {
        'Accept': `multipart/related; type="${mimeType}"`
      };
      return this._httpGet(url, headers, responseType, progressCallback);
    }

    _httpPost(url, headers, data, progressCallback) {
      return this._httpRequest(url, 'post', headers, {
        data,
        progressCallback
      });
    }

    _httpPostApplicationJson(url, data, progressCallback) {
      const headers = {
        'Content-Type': MIMETYPES.DICOM_JSON
      };
      return this._httpPost(url, headers, data, progressCallback);
    }
    /**
     * Searches for DICOM studies.
     * @param {Object} options options object - "queryParams" optional query parameters (choices: "fuzzymatching", "offset", "limit" or any valid DICOM attribute identifier)
     * @return {Array} study representations (http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.7.html#table_6.7.1-2)
     */


    searchForStudies(options = {}) {
      console.log('search for studies');
      let url = this.baseURL + '/studies';

      if ('queryParams' in options) {
        url += DICOMwebClient._parseQueryParameters(options.queryParams);
      }

      return this._httpGetApplicationJson(url);
    }
    /**
     * Retrieves metadata for a DICOM study.
     * @param {String} studyInstanceUID Study Instance UID
     * @returns {Array} metadata elements in DICOM JSON format for each instance belonging to the study
     */


    retrieveStudyMetadata(options) {
      if (!('studyInstanceUID' in options)) {
        throw new Error('Study Instance UID is required for retrieval of study metadata');
      }

      console.log(`retrieve metadata of study ${options.studyInstanceUID}`);
      const url = this.baseURL + '/studies/' + options.studyInstanceUID + '/metadata';
      return this._httpGetApplicationJson(url);
    }
    /**
     * Searches for DICOM series.
     * @param {Object} options optional DICOM identifiers (choices: "studyInstanceUID")
     * @param {Object} queryParams optional query parameters (choices: "fuzzymatching", "offset", "limit" or any valid DICOM attribute identifier)
     * @returns {Array} series representations (http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.7.html#table_6.7.1-2a)
     */


    searchForSeries(options = {}) {
      let url = this.baseURL;

      if ('studyInstanceUID' in options) {
        console.log(`search series of study ${options.studyInstanceUID}`);
        url += '/studies/' + options.studyInstanceUID;
      }

      url += '/series';

      if ('queryParams' in options) {
        url += DICOMwebClient._parseQueryParameters(options.queryParams);
      }

      return this._httpGetApplicationJson(url);
    }
    /**
     * Retrieves metadata for a DICOM series.
     * @param {String} studyInstanceUID Study Instance UID
     * @param {String} seriesInstanceUID Series Instance UID
     * @returns {Array} metadata elements in DICOM JSON format for each instance belonging to the series
     */


    retrieveSeriesMetadata(options) {
      if (!('studyInstanceUID' in options)) {
        throw new Error('Study Instance UID is required for retrieval of series metadata');
      }

      if (!('seriesInstanceUID' in options)) {
        throw new Error('Series Instance UID is required for retrieval of series metadata');
      }

      console.log(`retrieve metadata of series ${options.seriesInstanceUID}`);
      const url = this.baseURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID + '/metadata';
      return this._httpGetApplicationJson(url);
    }
    /**
     * Searches for DICOM instances.
     * @param {Object} options optional DICOM identifiers (choices: "studyInstanceUID", "seriesInstanceUID")
     * @param {Object} queryParams optional query parameters (choices: "fuzzymatching", "offset", "limit" or any valid DICOM attribute identifier)
     * @returns {Array} instance representations (http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.7.html#table_6.7.1-2b)
     */


    searchForInstances(options = {}) {
      let url = this.baseURL;

      if ('studyInstanceUID' in options) {
        url += '/studies/' + options.studyInstanceUID;

        if ('seriesInstanceUID' in options) {
          console.log(`search for instances of series ${options.seriesInstanceUID}`);
          url += '/series/' + options.seriesInstanceUID;
        } else {
          console.log(`search for instances of study ${options.studyInstanceUID}`);
        }
      } else {
        console.log('search for instances');
      }

      url += '/instances';

      if ('queryParams' in options) {
        url += DICOMwebClient._parseQueryParameters(options.queryParams);
      }

      return this._httpGetApplicationJson(url);
    }
    /** Returns a WADO-URI URL for an instance
     *
     * @param {Object} options
     * @returns {String} WADO-URI URL
     */


    buildInstanceWadoURIUrl(options) {
      if (!('studyInstanceUID' in options)) {
        throw new Error('Study Instance UID is required.');
      }

      if (!('seriesInstanceUID' in options)) {
        throw new Error('Series Instance UID is required.');
      }

      if (!('sopInstanceUID' in options)) {
        throw new Error('SOP Instance UID is required.');
      }

      const contentType = options.contentType || MIMETYPES.DICOM;
      const transferSyntax = options.transferSyntax || '*';
      const params = [];
      params.push('requestType=WADO');
      params.push(`studyUID=${options.studyInstanceUID}`);
      params.push(`seriesUID=${options.seriesInstanceUID}`);
      params.push(`objectUID=${options.sopInstanceUID}`);
      params.push(`contentType=${contentType}`);
      params.push(`transferSyntax=${transferSyntax}`);
      const paramString = params.join('&');
      return `${this.baseURL}?${paramString}`;
    }
    /**
     * Retrieves metadata for a DICOM instance.
     * @param {String} studyInstanceUID Study Instance UID
     * @param {String} seriesInstanceUID Series Instance UID
     * @param {String} sopInstanceUID SOP Instance UID
     * @returns {Object} metadata elements in DICOM JSON format
     */


    retrieveInstanceMetadata(options) {
      if (!('studyInstanceUID' in options)) {
        throw new Error('Study Instance UID is required for retrieval of instance metadata');
      }

      if (!('seriesInstanceUID' in options)) {
        throw new Error('Series Instance UID is required for retrieval of instance metadata');
      }

      if (!('sopInstanceUID' in options)) {
        throw new Error('SOP Instance UID is required for retrieval of instance metadata');
      }

      console.log(`retrieve metadata of instance ${options.sopInstanceUID}`);
      const url = this.baseURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID + '/instances/' + options.sopInstanceUID + '/metadata';
      return this._httpGetApplicationJson(url);
    }
    /**
     * Retrieves frames for a DICOM instance.
     * @param {String} studyInstanceUID Study Instance UID
     * @param {String} seriesInstanceUID Series Instance UID
     * @param {String} sopInstanceUID SOP Instance UID
     * @param {Array} frameNumbers one-based index of frames
     * @param {Object} options optional parameters (key "imageSubtype" to specify MIME image subtypes)
     * @returns {Array} frame items as byte arrays of the pixel data element
     */


    retrieveInstanceFrames(options) {
      if (!('studyInstanceUID' in options)) {
        throw new Error('Study Instance UID is required for retrieval of instance metadata');
      }

      if (!('seriesInstanceUID' in options)) {
        throw new Error('Series Instance UID is required for retrieval of instance metadata');
      }

      if (!('sopInstanceUID' in options)) {
        throw new Error('SOP Instance UID is required for retrieval of instance metadata');
      }

      if (!('frameNumbers' in options)) {
        throw new Error('frame numbers are required for retrieval of instance frames');
      }

      console.log(`retrieve frames ${options.frameNumbers.toString()} of instance ${options.sopInstanceUID}`);
      const url = this.baseURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID + '/instances/' + options.sopInstanceUID + '/frames/' + options.frameNumbers.toString(); // TODO: Easier if user just provided mimetype directly? What is the benefit of adding 'image/'?

      const mimeType = options.imageSubType ? `image/${options.imageSubType}` : MIMETYPES.OCTET_STREAM;
      return this._httpGetByMimeType(url, mimeType).then(multipartDecode);
    }
    /**
     * Retrieves a DICOM instance.
     *
     * @param {String} studyInstanceUID Study Instance UID
     * @param {String} seriesInstanceUID Series Instance UID
     * @param {String} sopInstanceUID SOP Instance UID
     * @returns {Arraybuffer} DICOM Part 10 file as Arraybuffer
     */


    retrieveInstance(options) {
      if (!('studyInstanceUID' in options)) {
        throw new Error('Study Instance UID is required');
      }

      if (!('seriesInstanceUID' in options)) {
        throw new Error('Series Instance UID is required');
      }

      if (!('sopInstanceUID' in options)) {
        throw new Error('SOP Instance UID is required');
      }

      const url = this.baseURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID + '/instances/' + options.sopInstanceUID;
      return this._httpGetByMimeType(url, MIMETYPES.DICOM).then(multipartDecode).then(getFirstResult);
    }
    /**
     * Retrieves a set of DICOM instance for a series.
     *
     * @param {String} studyInstanceUID Study Instance UID
     * @param {String} seriesInstanceUID Series Instance UID
     * @returns {Arraybuffer[]} Array of DICOM Part 10 files as Arraybuffers
     */


    retrieveSeries(options) {
      if (!('studyInstanceUID' in options)) {
        throw new Error('Study Instance UID is required');
      }

      if (!('seriesInstanceUID' in options)) {
        throw new Error('Series Instance UID is required');
      }

      const url = this.baseURL + '/studies/' + options.studyInstanceUID + '/series/' + options.seriesInstanceUID;
      return this._httpGetByMimeType(url, MIMETYPES.DICOM).then(multipartDecode);
    }
    /**
     * Retrieves a set of DICOM instance for a study.
     *
     * @param {String} studyInstanceUID Study Instance UID
     * @returns {Arraybuffer[]} Array of DICOM Part 10 files as Arraybuffers
     */


    retrieveStudy(options) {
      if (!('studyInstanceUID' in options)) {
        throw new Error('Study Instance UID is required');
      }

      const url = this.baseURL + '/studies/' + options.studyInstanceUID;
      return this._httpGetByMimeType(url, MIMETYPES.DICOM).then(multipartDecode);
    }
    /**
     * Retrieve and parse BulkData from a BulkDataURI location.
     * Decodes the multipart encoded data and returns the resulting data
     * as an ArrayBuffer.
     *
     * See http://dicom.nema.org/medical/dicom/current/output/chtml/part18/sect_6.5.5.html
     *
     * @param {Object} options
     * @return {Promise}
     */


    retrieveBulkData(options) {
      if (!('BulkDataURI' in options)) {
        throw new Error('BulkDataURI is required.');
      }

      return this._httpGetByMimeType(options.BulkDataURI, MIMETYPES.OCTET_STREAM).then(multipartDecode).then(getFirstResult);
    }
    /**
     * Stores DICOM instances.
     * @param {Array} datasets DICOM datasets of instances that should be stored in DICOM JSON format
     * @param {Object} options optional parameters (key "studyInstanceUID" to only store instances of a given study)
     */


    storeInstances(options) {
      if (!('datasets' in options)) {
        throw new Error('datasets are required for storing');
      }

      let url = `${this.baseURL}/studies`;

      if ('studyInstanceUID' in options) {
        url += `/${options.studyInstanceUID}`;
      }

      const {
        data,
        boundary
      } = multipartEncode(options.datasets);
      const headers = {
        'Content-Type': `multipart/related; type=application/dicom; boundary=${boundary}`
      };
      return this._httpPost(url, headers, data, options.progressCallback);
    }

  }

  function findSubstring(str, before, after) {
    const beforeIndex = str.lastIndexOf(before) + before.length;

    if (beforeIndex < before.length) {
      return null;
    }

    if (after !== undefined) {
      const afterIndex = str.lastIndexOf(after);

      if (afterIndex < 0) {
        return null;
      } else {
        return str.substring(beforeIndex, afterIndex);
      }
    }

    return str.substring(beforeIndex);
  }

  function getStudyInstanceUIDFromUri(uri) {
    var uid = findSubstring(uri, "studies/", "/series");

    if (!uid) {
      var uid = findSubstring(uri, "studies/");
    }

    if (!uid) {
      console.debug('Study Instance UID could not be dertermined from URI "' + uri + '"');
    }

    return uid;
  }

  function getSeriesInstanceUIDFromUri(uri) {
    var uid = findSubstring(uri, "series/", "/instances");

    if (!uid) {
      var uid = findSubstring(uri, "series/");
    }

    if (!uid) {
      console.debug('Series Instance UID could not be dertermined from URI "' + uri + '"');
    }

    return uid;
  }

  function getSOPInstanceUIDFromUri(uri) {
    var uid = findSubstring(uri, "/instances/", "/frames");

    if (!uid) {
      var uid = findSubstring(uri, "/instances/", "/metadata");
    }

    if (!uid) {
      var uid = findSubstring(uri, "/instances/");
    }

    if (!uid) {
      console.debug('SOP Instance UID could not be dertermined from URI"' + uri + '"');
    }

    return uid;
  }

  function getFrameNumbersFromUri(uri) {
    let numbers = findSubstring(uri, "/frames/");

    if (numbers === undefined) {
      console.debug('Frames Numbers could not be dertermined from URI"' + uri + '"');
    }

    return numbers.split(',');
  }

  let api = {
    DICOMwebClient
  };
  let utils = {
    getStudyInstanceUIDFromUri,
    getSeriesInstanceUIDFromUri,
    getSOPInstanceUIDFromUri,
    getFrameNumbersFromUri
  };
  exports.api = api;
  exports.utils = utils;
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
});
});

var DICOMwebClient = unwrapExports(dicomwebClient);

/**
 * Parses data returned from a QIDO search and transforms it into
 * an array of series that are present in the study
 *
 * @param server The DICOM server
 * @param studyInstanceUid
 * @param resultData
 * @returns {Array} Series List
 */

function resultDataToStudyMetadata(server, studyInstanceUid, resultData) {
  var seriesMap = {};
  var seriesList = [];
  resultData.forEach(function (instance) {
    // Use seriesMap to cache series data
    // If the series instance UID has already been used to
    // process series data, continue using that series
    var seriesInstanceUid = DICOMWeb.getString(instance['0020000E']);
    var series = seriesMap[seriesInstanceUid]; // If no series data exists in the seriesMap cache variable,
    // process any available series data

    if (!series) {
      series = {
        seriesInstanceUid: seriesInstanceUid,
        seriesNumber: DICOMWeb.getString(instance['00200011']),
        instances: []
      }; // Save this data in the seriesMap cache variable

      seriesMap[seriesInstanceUid] = series;
      seriesList.push(series);
    } // The uri for the dicomweb
    // NOTE: DCM4CHEE seems to return the data zipped
    // NOTE: Orthanc returns the data with multi-part mime which cornerstoneWADOImageLoader doesn't
    //       know how to parse yet
    //var uri = DICOMWeb.getString(instance['00081190']);
    //uri = uri.replace('wado-rs', 'dicom-web');
    // manually create a WADO-URI from the UIDs
    // NOTE: Haven't been able to get Orthanc's WADO-URI to work yet - maybe its not configured?


    var sopInstanceUid = DICOMWeb.getString(instance['00080018']);
    var uri = server.wadoUriRoot + '?requestType=WADO&studyUID=' + studyInstanceUid + '&seriesUID=' + seriesInstanceUid + '&objectUID=' + sopInstanceUid + '&contentType=application%2Fdicom'; // Add this instance to the current series

    series.instances.push({
      sopClassUid: DICOMWeb.getString(instance['00080016']),
      sopInstanceUid: sopInstanceUid,
      uri: uri,
      instanceNumber: DICOMWeb.getString(instance['00200013'])
    });
  });
  return seriesList;
}
/**
 * Retrieve a set of instances using a QIDO call
 * @param server
 * @param studyInstanceUid
 * @throws ECONNREFUSED
 * @returns {{wadoUriRoot: String, studyInstanceUid: String, seriesList: Array}}
 */


function Instances(server, studyInstanceUid) {
  // TODO: Are we using this function anywhere?? Can we remove it?
  var config = {
    url: server.qidoRoot,
    headers: DICOMWeb.getAuthorizationHeader(server)
  };
  var dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
  var queryParams = getQIDOQueryParams(filter, server.qidoSupportsIncludeField);
  var options = {
    studyInstanceUID: studyInstanceUid
  };
  return dicomWeb.searchForInstances(options).then(function (result) {
    return {
      wadoUriRoot: server.wadoUriRoot,
      studyInstanceUid: studyInstanceUid,
      seriesList: resultDataToStudyMetadata(server, studyInstanceUid, result.data)
    };
  });
}

/**
 * Creates a QIDO date string for a date range query
 * Assumes the year is positive, at most 4 digits long.
 *
 * @param date The Date object to be formatted
 * @returns {string} The formatted date string
 */

function dateToString(date) {
  if (!date) return '';
  var year = date.getFullYear().toString();
  var month = (date.getMonth() + 1).toString();
  var day = date.getDate().toString();
  year = '0'.repeat(4 - year.length).concat(year);
  month = '0'.repeat(2 - month.length).concat(month);
  day = '0'.repeat(2 - day.length).concat(day);
  return ''.concat(year, month, day);
}
/**
 * Produces a QIDO URL given server details and a set of specified search filter
 * items
 *
 * @param filter
 * @param serverSupportsQIDOIncludeField
 * @returns {string} The URL with encoded filter query data
 */


function getQIDOQueryParams$1(filter, serverSupportsQIDOIncludeField) {
  var commaSeparatedFields = ['00081030', // Study Description
  '00080060' //Modality
  // Add more fields here if you want them in the result
  ].join(',');
  var parameters = {
    PatientName: filter.patientName,
    PatientID: filter.patientId,
    AccessionNumber: filter.accessionNumber,
    StudyDescription: filter.studyDescription,
    ModalitiesInStudy: filter.modalitiesInStudy,
    limit: filter.limit,
    offset: filter.offset,
    includefield: serverSupportsQIDOIncludeField ? commaSeparatedFields : 'all'
  }; // build the StudyDate range parameter

  if (filter.studyDateFrom || filter.studyDateTo) {
    var dateFrom = dateToString(new Date(filter.studyDateFrom));
    var dateTo = dateToString(new Date(filter.studyDateTo));
    parameters.StudyDate = "".concat(dateFrom, "-").concat(dateTo);
  } // Build the StudyInstanceUID parameter


  if (filter.studyInstanceUid) {
    var studyUids = filter.studyInstanceUid;
    studyUids = Array.isArray(studyUids) ? studyUids.join() : studyUids;
    studyUids = studyUids.replace(/[^0-9.]+/g, '\\');
    parameters.StudyInstanceUID = studyUids;
  } // Clean query params of undefined values.


  var params = {};
  Object.keys(parameters).forEach(function (key) {
    if (parameters[key] !== undefined && parameters[key] !== "") {
      params[key] = parameters[key];
    }
  });
  return params;
}
/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param resultData
 * @returns {Array} An array of Study MetaData objects
 */


function resultDataToStudies(resultData) {
  var studies = [];
  if (!resultData || !resultData.length) return;
  resultData.forEach(function (study) {
    return studies.push({
      studyInstanceUid: DICOMWeb.getString(study['0020000D']),
      // 00080005 = SpecificCharacterSet
      studyDate: DICOMWeb.getString(study['00080020']),
      studyTime: DICOMWeb.getString(study['00080030']),
      accessionNumber: DICOMWeb.getString(study['00080050']),
      referringPhysicianName: DICOMWeb.getString(study['00080090']),
      // 00081190 = URL
      patientName: DICOMWeb.getName(study['00100010']),
      patientId: DICOMWeb.getString(study['00100020']),
      patientBirthdate: DICOMWeb.getString(study['00100030']),
      patientSex: DICOMWeb.getString(study['00100040']),
      studyId: DICOMWeb.getString(study['00200010']),
      numberOfStudyRelatedSeries: DICOMWeb.getString(study['00201206']),
      numberOfStudyRelatedInstances: DICOMWeb.getString(study['00201208']),
      studyDescription: DICOMWeb.getString(study['00081030']),
      // modality: DICOMWeb.getString(study['00080060']),
      // modalitiesInStudy: DICOMWeb.getString(study['00080061']),
      modalities: DICOMWeb.getString(DICOMWeb.getModalities(study['00080060'], study['00080061']))
    });
  });
  return studies;
}

function Studies(server, filter) {
  var config = {
    url: server.qidoRoot,
    headers: DICOMWeb.getAuthorizationHeader(server)
  };
  var dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
  var queryParams = getQIDOQueryParams$1(filter, server.qidoSupportsIncludeField);
  var options = {
    queryParams: queryParams
  };
  return dicomWeb.searchForStudies(options).then(resultDataToStudies);
}

var WADOProxy = {
  convertURL: function convertURL(url, server) {
    // TODO: Remove all WADOProxy stuff from this file
    return url;
  }
};

function parseFloatArray(obj) {
  var result = [];

  if (!obj) {
    return result;
  }

  var objs = obj.split('\\');

  for (var i = 0; i < objs.length; i++) {
    result.push(parseFloat(objs[i]));
  }

  return result;
}
/**
 * Simple cache schema for retrieved color palettes.
 */


var paletteColorCache = {
  count: 0,
  maxAge: 24 * 60 * 60 * 1000,
  // 24h cache?
  entries: {},
  isValidUID: function isValidUID(paletteUID) {
    return typeof paletteUID === 'string' && paletteUID.length > 0;
  },
  get: function get(paletteUID) {
    var entry = null;

    if (this.entries.hasOwnProperty(paletteUID)) {
      entry = this.entries[paletteUID]; // check how the entry is...

      if (Date.now() - entry.time > this.maxAge) {
        // entry is too old... remove entry.
        delete this.entries[paletteUID];
        this.count--;
        entry = null;
      }
    }

    return entry;
  },
  add: function add(entry) {
    if (this.isValidUID(entry.uid)) {
      var paletteUID = entry.uid;

      if (this.entries.hasOwnProperty(paletteUID) !== true) {
        this.count++; // increment cache entry count...
      }

      entry.time = Date.now();
      this.entries[paletteUID] = entry; // @TODO: Add logic to get rid of old entries and reduce memory usage...
    }
  }
};
/** Returns a WADO url for an instance
 *
 * @param studyInstanceUid
 * @param seriesInstanceUid
 * @param sopInstanceUid
 * @returns  {string}
 */

function buildInstanceWadoUrl(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid) {
  // TODO: This can be removed, since DICOMWebClient has the same function. Not urgent, though
  var params = [];
  params.push('requestType=WADO');
  params.push("studyUID=".concat(studyInstanceUid));
  params.push("seriesUID=".concat(seriesInstanceUid));
  params.push("objectUID=".concat(sopInstanceUid));
  params.push('contentType=application/dicom');
  params.push('transferSyntax=*');
  var paramString = params.join('&');
  return "".concat(server.wadoUriRoot, "?").concat(paramString);
}

function buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid) {
  return "".concat(server.wadoRoot, "/studies/").concat(studyInstanceUid, "/series/").concat(seriesInstanceUid, "/instances/").concat(sopInstanceUid);
}

function buildInstanceFrameWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid, frame) {
  var baseWadoRsUri = buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
  frame = frame != null || 1;
  return "".concat(baseWadoRsUri, "/frames/").concat(frame);
}
/**
 * Parses the SourceImageSequence, if it exists, in order
 * to return a ReferenceSOPInstanceUID. The ReferenceSOPInstanceUID
 * is used to refer to this image in any accompanying DICOM-SR documents.
 *
 * @param instance
 * @returns {String} The ReferenceSOPInstanceUID
 */


function getSourceImageInstanceUid(instance) {
  // TODO= Parse the whole Source Image Sequence
  // This is a really poor workaround for now.
  // Later we should probably parse the whole sequence.
  var SourceImageSequence = instance['00082112'];

  if (SourceImageSequence && SourceImageSequence.Value && SourceImageSequence.Value.length) {
    return SourceImageSequence.Value[0]['00081155'].Value[0];
  }
}

function getPaletteColor(server, instance, tag, lutDescriptor) {
  var numLutEntries = lutDescriptor[0];
  var bits = lutDescriptor[2];
  var uri = WADOProxy.convertURL(instance[tag].BulkDataURI, server); // TODO: Workaround for dcm4chee behind SSL-terminating proxy returning
  // incorrect bulk data URIs

  if (server.wadoRoot.indexOf('https') === 0 && !uri.includes('https')) {
    uri = uri.replace('http', 'https');
  }

  var config = {
    url: server.wadoRoot,
    //BulkDataURI is absolute, so this isn't used
    headers: DICOMWeb.getAuthorizationHeader(server)
  };
  var dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
  var options = {
    BulkDataURI: uri
  };

  var readUInt16 = function readUInt16(byteArray, position) {
    return byteArray[position] + byteArray[position + 1] * 256;
  };

  var arrayBufferToPaletteColorLUT = function arrayBufferToPaletteColorLUT(arraybuffer) {
    var byteArray = new Uint8Array(arraybuffer);
    var lut = [];

    for (var i = 0; i < numLutEntries; i++) {
      if (bits === 16) {
        lut[i] = readUInt16(byteArray, i * 2);
      } else {
        lut[i] = byteArray[i];
      }
    }

    return lut;
  };

  return dicomWeb.retrieveBulkData(options).then(arrayBufferToPaletteColorLUT);
}
/**
 * Fetch palette colors for instances with "PALETTE COLOR" photometricInterpretation.
 *
 * @param server {Object} Current server;
 * @param instance {Object} The retrieved instance metadata;
 * @returns {String} The ReferenceSOPInstanceUID
 */


function getPaletteColors(_x, _x2, _x3) {
  return _getPaletteColors.apply(this, arguments);
}

function _getPaletteColors() {
  _getPaletteColors = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(server, instance, lutDescriptor) {
    var paletteUID;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            paletteUID = DICOMWeb.getString(instance['00281199']);
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              if (paletteColorCache.isValidUID(paletteUID)) {
                var _entry = paletteColorCache.get(paletteUID);

                if (_entry) {
                  return resolve(_entry);
                }
              } // no entry in cache... Fetch remote data.


              var r = getPaletteColor(server, instance, '00281201', lutDescriptor);
              var g = getPaletteColor(server, instance, '00281202', lutDescriptor);
              var b = getPaletteColor(server, instance, '00281203', lutDescriptor);
              var promises = [r, g, b];
              Promise.all(promises).then(function (args) {
                entry = {
                  red: args[0],
                  green: args[1],
                  blue: args[2]
                }; // when paletteUID is present, the entry can be cached...

                entry.uid = paletteUID;
                paletteColorCache.add(entry);
                resolve(entry);
              });
            }));

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _getPaletteColors.apply(this, arguments);
}

function getFrameIncrementPointer(element) {
  var frameIncrementPointerNames = {
    '00181065': 'frameTimeVector',
    '00181063': 'frameTime'
  };

  if (!element || !element.Value || !element.Value.length) {
    return;
  }

  var value = element.Value[0];
  return frameIncrementPointerNames[value];
}

function getRadiopharmaceuticalInfo(instance) {
  var modality = DICOMWeb.getString(instance['00080060']);

  if (modality !== 'PT') {
    return;
  }

  var radiopharmaceuticalInfo = instance['00540016'];

  if (radiopharmaceuticalInfo === undefined || !radiopharmaceuticalInfo.Value || !radiopharmaceuticalInfo.Value.length) {
    return;
  }

  var firstPetRadiopharmaceuticalInfo = radiopharmaceuticalInfo.Value[0];
  return {
    radiopharmaceuticalStartTime: DICOMWeb.getString(firstPetRadiopharmaceuticalInfo['00181072']),
    radionuclideTotalDose: DICOMWeb.getNumber(firstPetRadiopharmaceuticalInfo['00181074']),
    radionuclideHalfLife: DICOMWeb.getNumber(firstPetRadiopharmaceuticalInfo['00181075'])
  };
}
/**
 * Parses result data from a WADO search into Study MetaData
 * Returns an object populated with study metadata, including the
 * series list.
 *
 * @param server
 * @param studyInstanceUid
 * @param resultData
 * @returns {{seriesList: Array, patientName: *, patientId: *, accessionNumber: *, studyDate: *, modalities: *, studyDescription: *, imageCount: *, studyInstanceUid: *}}
 */


function resultDataToStudyMetadata$1(_x4, _x5, _x6) {
  return _resultDataToStudyMetadata.apply(this, arguments);
}
/**
 * Retrieve Study MetaData from a DICOM server using a WADO call
 *
 * @param server
 * @param studyInstanceUid
 * @returns {Promise}
 */


function _resultDataToStudyMetadata() {
  _resultDataToStudyMetadata = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(server, studyInstanceUid, resultData) {
    var _studyData;

    var anInstance, studyData, seriesMap;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (resultData.length) {
              _context3.next = 2;
              break;
            }

            return _context3.abrupt("return");

          case 2:
            anInstance = resultData[0];

            if (anInstance) {
              _context3.next = 5;
              break;
            }

            return _context3.abrupt("return");

          case 5:
            studyData = (_studyData = {
              seriesList: [],
              studyInstanceUid: studyInstanceUid,
              wadoUriRoot: server.wadoUriRoot,
              patientName: DICOMWeb.getName(anInstance['00100010']),
              patientId: DICOMWeb.getString(anInstance['00100020']),
              patientAge: DICOMWeb.getNumber(anInstance['00101010']),
              patientSize: DICOMWeb.getNumber(anInstance['00101020']),
              patientWeight: DICOMWeb.getNumber(anInstance['00101030']),
              accessionNumber: DICOMWeb.getString(anInstance['00080050']),
              studyDate: DICOMWeb.getString(anInstance['00080020']),
              modalities: DICOMWeb.getString(anInstance['00080061']),
              studyDescription: DICOMWeb.getString(anInstance['00081030']),
              imageCount: DICOMWeb.getString(anInstance['00201208'])
            }, _defineProperty(_studyData, "studyInstanceUid", DICOMWeb.getString(anInstance['0020000D'])), _defineProperty(_studyData, "institutionName", DICOMWeb.getString(anInstance['00080080'])), _studyData);
            seriesMap = {};
            _context3.next = 9;
            return Promise.all(resultData.map(
            /*#__PURE__*/
            function () {
              var _ref = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee2(instance) {
                var seriesInstanceUid, series, sopInstanceUid, wadouri, baseWadoRsUri, wadorsuri, instanceSummary, redPaletteColorLookupTableDescriptor, greenPaletteColorLookupTableDescriptor, bluePaletteColorLookupTableDescriptor, palettes;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        seriesInstanceUid = DICOMWeb.getString(instance['0020000E']);
                        series = seriesMap[seriesInstanceUid];

                        if (!series) {
                          series = {
                            seriesDescription: DICOMWeb.getString(instance['0008103E']),
                            modality: DICOMWeb.getString(instance['00080060']),
                            seriesInstanceUid: seriesInstanceUid,
                            seriesNumber: DICOMWeb.getNumber(instance['00200011']),
                            seriesDate: DICOMWeb.getString(instance['00080021']),
                            seriesTime: DICOMWeb.getString(instance['00080031']),
                            instances: []
                          };
                          seriesMap[seriesInstanceUid] = series;
                          studyData.seriesList.push(series);
                        }

                        sopInstanceUid = DICOMWeb.getString(instance['00080018']);
                        wadouri = buildInstanceWadoUrl(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
                        baseWadoRsUri = buildInstanceWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
                        wadorsuri = buildInstanceFrameWadoRsUri(server, studyInstanceUid, seriesInstanceUid, sopInstanceUid);
                        instanceSummary = {
                          imageType: DICOMWeb.getString(instance['00080008']),
                          sopClassUid: DICOMWeb.getString(instance['00080016']),
                          modality: DICOMWeb.getString(instance['00080060']),
                          sopInstanceUid: sopInstanceUid,
                          instanceNumber: DICOMWeb.getNumber(instance['00200013']),
                          imagePositionPatient: DICOMWeb.getString(instance['00200032']),
                          imageOrientationPatient: DICOMWeb.getString(instance['00200037']),
                          frameOfReferenceUID: DICOMWeb.getString(instance['00200052']),
                          sliceLocation: DICOMWeb.getNumber(instance['00201041']),
                          samplesPerPixel: DICOMWeb.getNumber(instance['00280002']),
                          photometricInterpretation: DICOMWeb.getString(instance['00280004']),
                          planarConfiguration: DICOMWeb.getNumber(instance['00280006']),
                          rows: DICOMWeb.getNumber(instance['00280010']),
                          columns: DICOMWeb.getNumber(instance['00280011']),
                          pixelSpacing: DICOMWeb.getString(instance['00280030']),
                          pixelAspectRatio: DICOMWeb.getString(instance['00280034']),
                          bitsAllocated: DICOMWeb.getNumber(instance['00280100']),
                          bitsStored: DICOMWeb.getNumber(instance['00280101']),
                          highBit: DICOMWeb.getNumber(instance['00280102']),
                          pixelRepresentation: DICOMWeb.getNumber(instance['00280103']),
                          smallestPixelValue: DICOMWeb.getNumber(instance['00280106']),
                          largestPixelValue: DICOMWeb.getNumber(instance['00280107']),
                          windowCenter: DICOMWeb.getString(instance['00281050']),
                          windowWidth: DICOMWeb.getString(instance['00281051']),
                          rescaleIntercept: DICOMWeb.getNumber(instance['00281052']),
                          rescaleSlope: DICOMWeb.getNumber(instance['00281053']),
                          rescaleType: DICOMWeb.getNumber(instance['00281054']),
                          sourceImageInstanceUid: getSourceImageInstanceUid(instance),
                          laterality: DICOMWeb.getString(instance['00200062']),
                          viewPosition: DICOMWeb.getString(instance['00185101']),
                          acquisitionDateTime: DICOMWeb.getString(instance['0008002A']),
                          numberOfFrames: DICOMWeb.getNumber(instance['00280008']),
                          frameIncrementPointer: getFrameIncrementPointer(instance['00280009']),
                          frameTime: DICOMWeb.getNumber(instance['00181063']),
                          frameTimeVector: parseFloatArray(DICOMWeb.getString(instance['00181065'])),
                          sliceThickness: DICOMWeb.getNumber(instance['00180050']),
                          lossyImageCompression: DICOMWeb.getString(instance['00282110']),
                          derivationDescription: DICOMWeb.getString(instance['00282111']),
                          lossyImageCompressionRatio: DICOMWeb.getString(instance['00282112']),
                          lossyImageCompressionMethod: DICOMWeb.getString(instance['00282114']),
                          echoNumber: DICOMWeb.getString(instance['00180086']),
                          contrastBolusAgent: DICOMWeb.getString(instance['00180010']),
                          radiopharmaceuticalInfo: getRadiopharmaceuticalInfo(instance),
                          baseWadoRsUri: baseWadoRsUri,
                          wadouri: WADOProxy.convertURL(wadouri, server),
                          wadorsuri: WADOProxy.convertURL(wadorsuri, server),
                          imageRendering: server.imageRendering,
                          thumbnailRendering: server.thumbnailRendering
                        }; // Get additional information if the instance uses "PALETTE COLOR" photometric interpretation

                        if (!(instanceSummary.photometricInterpretation === 'PALETTE COLOR')) {
                          _context2.next = 16;
                          break;
                        }

                        redPaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281101']));
                        greenPaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281102']));
                        bluePaletteColorLookupTableDescriptor = parseFloatArray(DICOMWeb.getString(instance['00281103']));
                        _context2.next = 14;
                        return getPaletteColors(server, instance, redPaletteColorLookupTableDescriptor);

                      case 14:
                        palettes = _context2.sent;

                        if (palettes) {
                          if (palettes.uid) {
                            instanceSummary.paletteColorLookupTableUID = palettes.uid;
                          }

                          instanceSummary.redPaletteColorLookupTableData = palettes.red;
                          instanceSummary.greenPaletteColorLookupTableData = palettes.green;
                          instanceSummary.bluePaletteColorLookupTableData = palettes.blue;
                          instanceSummary.redPaletteColorLookupTableDescriptor = redPaletteColorLookupTableDescriptor;
                          instanceSummary.greenPaletteColorLookupTableDescriptor = greenPaletteColorLookupTableDescriptor;
                          instanceSummary.bluePaletteColorLookupTableDescriptor = bluePaletteColorLookupTableDescriptor;
                        }

                      case 16:
                        series.instances.push(instanceSummary);

                      case 17:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, this);
              }));

              return function (_x9) {
                return _ref.apply(this, arguments);
              };
            }()));

          case 9:
            return _context3.abrupt("return", studyData);

          case 10:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _resultDataToStudyMetadata.apply(this, arguments);
}

function RetrieveMetadata(_x7, _x8) {
  return _RetrieveMetadata.apply(this, arguments);
}

function _RetrieveMetadata() {
  _RetrieveMetadata = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4(server, studyInstanceUid) {
    var config, dicomWeb, options;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            config = {
              url: server.wadoRoot,
              headers: DICOMWeb.getAuthorizationHeader(server)
            };
            dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
            options = {
              studyInstanceUID: studyInstanceUid
            };
            return _context4.abrupt("return", dicomWeb.retrieveStudyMetadata(options).then(function (result) {
              return resultDataToStudyMetadata$1(server, studyInstanceUid, result);
            }));

          case 4:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));
  return _RetrieveMetadata.apply(this, arguments);
}

// DICOMWeb instance, study, and metadata retrieval
var WADO = {
  RetrieveMetadata: RetrieveMetadata
};
var QIDO = {
  Studies: Studies,
  Instances: Instances
};

var log$1 = {
  error: console.error,
  warn: console.warn,
  info: console.log,
  debug: console.debug,
  time: console.time,
  timeEnd: console.timeEnd
};

// promises and prevent unnecessary subsequent calls to the server

var StudyMetaDataPromises = new Map();
/**
 * Delete the cached study metadata retrieval promise to ensure that the browser will
 * re-retrieve the study metadata when it is next requested
 *
 * @param {String} studyInstanceUid The UID of the Study to be removed from cache
 *
 */

function deleteStudyMetadataPromise(studyInstanceUid) {
  if (StudyMetaDataPromises.has(studyInstanceUid)) {
    StudyMetaDataPromises.delete(studyInstanceUid);
  }
}
/**
 * Retrieves study metadata using a server call
 *
 * @param {String} studyInstanceUid The UID of the Study to be retrieved
 * @returns {Promise} that will be resolved with the metadata or rejected with the error
 */

function retrieveStudyMetadata(server, studyInstanceUid, seriesInstanceUids) {
  // @TODO: Whenever a study metadata request has failed, its related promise will be rejected once and for all
  // and further requests for that metadata will always fail. On failure, we probably need to remove the
  // corresponding promise from the "StudyMetaDataPromises" map...
  // If the StudyMetaDataPromises cache already has a pending or resolved promise related to the
  // given studyInstanceUid, then that promise is returned
  if (StudyMetaDataPromises.has(studyInstanceUid)) {
    return StudyMetaDataPromises.get(studyInstanceUid);
  }

  var seriesKeys = Array.isArray(seriesInstanceUids) ? '|' + seriesInstanceUids.join('|') : '';
  var timingKey = "retrieveStudyMetadata[".concat(studyInstanceUid).concat(seriesKeys, "]");
  log$1.time(timingKey); // Create a promise to handle the data retrieval

  var promise = new Promise(function (resolve, reject) {
    // If no study metadata is in the cache variable, we need to retrieve it from
    // the server with a call.
    if (server.type === 'dicomWeb' && server.requestOptions.requestFromBrowser === true) {
      RetrieveMetadata(server, studyInstanceUid).then(function (data) {
        resolve(data);
      }, reject);
    }
  }); // Store the promise in cache

  StudyMetaDataPromises.set(studyInstanceUid, promise);
  return promise;
}

/**
 * Constants
 */
var STRING$1 = 'string';
var NUMBER$1 = 'number';
var FUNCTION = 'function';
var OBJECT = 'object';
/**
 * Class Definition
 */

var Metadata =
/*#__PURE__*/
function () {
  /**
   * Constructor and Instance Methods
   */
  function Metadata(data, uid) {
    _classCallCheck(this, Metadata);

    // Define the main "_data" private property as an immutable property.
    // IMPORTANT: This property can only be set during instance construction.
    Object.defineProperty(this, '_data', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: data
    }); // Define the main "_uid" private property as an immutable property.
    // IMPORTANT: This property can only be set during instance construction.

    Object.defineProperty(this, '_uid', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: uid
    }); // Define "_custom" properties as an immutable property.
    // IMPORTANT: This property can only be set during instance construction.

    Object.defineProperty(this, '_custom', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: Object.create(null)
    });
  }

  _createClass(Metadata, [{
    key: "getData",
    value: function getData() {
      return this._data;
    }
  }, {
    key: "getDataProperty",
    value: function getDataProperty(propertyName) {
      var propertyValue;
      var _data = this._data;

      if (_data instanceof Object || _typeof(_data) === OBJECT && _data !== null) {
        propertyValue = _data[propertyName];
      }

      return propertyValue;
    }
    /**
     * Get unique object ID
     */

  }, {
    key: "getObjectID",
    value: function getObjectID() {
      return this._uid;
    }
    /**
     * Set custom attribute value
     * @param {String} attribute Custom attribute name
     * @param {Any} value     Custom attribute value
     */

  }, {
    key: "setCustomAttribute",
    value: function setCustomAttribute(attribute, value) {
      this._custom[attribute] = value;
    }
    /**
     * Get custom attribute value
     * @param  {String} attribute Custom attribute name
     * @return {Any}              Custom attribute value
     */

  }, {
    key: "getCustomAttribute",
    value: function getCustomAttribute(attribute) {
      return this._custom[attribute];
    }
    /**
     * Check if a custom attribute exists
     * @param  {String} attribute Custom attribute name
     * @return {Boolean}          True if custom attribute exists or false if not
     */

  }, {
    key: "customAttributeExists",
    value: function customAttributeExists(attribute) {
      return attribute in this._custom;
    }
    /**
     * Set custom attributes in batch mode.
     * @param {Object} attributeMap An object whose own properties will be used as custom attributes.
     */

  }, {
    key: "setCustomAttributes",
    value: function setCustomAttributes(attributeMap) {
      var _hasOwn = Object.prototype.hasOwnProperty;
      var _custom = this._custom;

      for (var attribute in attributeMap) {
        if (_hasOwn.call(attributeMap, attribute)) {
          _custom[attribute] = attributeMap[attribute];
        }
      }
    }
    /**
     * Static Methods
     */

  }], [{
    key: "isValidUID",
    value: function isValidUID(uid) {
      return _typeof(uid) === STRING$1 && uid.length > 0;
    }
  }, {
    key: "isValidIndex",
    value: function isValidIndex(index) {
      return _typeof(index) === NUMBER$1 && index >= 0 && (index | 0) === index;
    }
  }, {
    key: "isValidCallback",
    value: function isValidCallback(callback) {
      return _typeof(callback) === FUNCTION;
    }
  }]);

  return Metadata;
}();

// @TODO: improve this object

/**
 * Objects to be used to throw errors
 */
var OHIFError =
/*#__PURE__*/
function (_Error) {
  _inherits(OHIFError, _Error);

  function OHIFError(message) {
    var _this;

    _classCallCheck(this, OHIFError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(OHIFError).call(this));
    _this.message = message;
    _this.stack = new Error().stack;
    _this.name = _this.constructor.name;
    return _this;
  }

  return OHIFError;
}(_wrapNativeSuper(Error));

/**
 * ATTENTION! This class should never depend on StudyMetadata or SeriesMetadata classes as this could
 * possibly cause circular dependency issues.
 */

var UNDEFINED = 'undefined';
var STRING$2 = 'string';
var STUDY_INSTANCE_UID = 'x0020000d';
var SERIES_INSTANCE_UID = 'x0020000e';
var InstanceMetadata =
/*#__PURE__*/
function (_Metadata) {
  _inherits(InstanceMetadata, _Metadata);

  function InstanceMetadata(data, uid) {
    var _this;

    _classCallCheck(this, InstanceMetadata);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InstanceMetadata).call(this, data, uid)); // Initialize Private Properties

    Object.defineProperties(_assertThisInitialized(_assertThisInitialized(_this)), {
      _sopInstanceUID: {
        configurable: true,
        // configurable so that it can be redefined in sub-classes...
        enumerable: false,
        writable: true,
        value: null
      },
      _imageId: {
        configurable: true,
        // configurable so that it can be redefined in sub-classes...
        enumerable: false,
        writable: true,
        value: null
      }
    }); // Initialize Public Properties

    _this._definePublicProperties();

    return _this;
  }
  /**
   * Private Methods
   */

  /**
   * Define Public Properties
   * This method should only be called during initialization (inside the class constructor)
   */


  _createClass(InstanceMetadata, [{
    key: "_definePublicProperties",
    value: function _definePublicProperties() {
      /**
       * Property: this.sopInstanceUID
       * Same as this.getSOPInstanceUID()
       * It's specially useful in contexts where a method call is not suitable like in search criteria. For example:
       * sopInstanceCollection.findBy({
       *   sopInstanceUID: '1.2.3.4.5.6.77777.8888888.99999999999.0'
       * });
       */
      Object.defineProperty(this, 'sopInstanceUID', {
        configurable: false,
        enumerable: false,
        get: function get() {
          return this.getSOPInstanceUID();
        }
      });
    }
    /**
     * Public Methods
     */

    /**
     * Returns the StudyInstanceUID of the current instance. This method is basically a shorthand the full "getTagValue" method call.
     */

  }, {
    key: "getStudyInstanceUID",
    value: function getStudyInstanceUID() {
      return this.getTagValue(STUDY_INSTANCE_UID, null);
    }
    /**
     * Returns the SeriesInstanceUID of the current instance. This method is basically a shorthand the full "getTagValue" method call.
     */

  }, {
    key: "getSeriesInstanceUID",
    value: function getSeriesInstanceUID() {
      return this.getTagValue(SERIES_INSTANCE_UID, null);
    }
    /**
     * Returns the SOPInstanceUID of the current instance.
     */

  }, {
    key: "getSOPInstanceUID",
    value: function getSOPInstanceUID() {
      return this._sopInstanceUID;
    } // @TODO: Improve this... (E.g.: blob data)

  }, {
    key: "getStringValue",
    value: function getStringValue(tagOrProperty, index, defaultValue) {
      var value = this.getTagValue(tagOrProperty, defaultValue);

      if (_typeof(value) !== STRING$2 && _typeof(value) !== UNDEFINED) {
        value = value.toString();
      }

      return InstanceMetadata.getIndexedValue(value, index, defaultValue);
    } // @TODO: Improve this... (E.g.: blob data)

  }, {
    key: "getFloatValue",
    value: function getFloatValue(tagOrProperty, index, defaultValue) {
      var value = this.getTagValue(tagOrProperty, defaultValue);
      value = InstanceMetadata.getIndexedValue(value, index, defaultValue);

      if (value instanceof Array) {
        value.forEach(function (val, idx) {
          value[idx] = parseFloat(val);
        });
        return value;
      }

      return _typeof(value) === STRING$2 ? parseFloat(value) : value;
    } // @TODO: Improve this... (E.g.: blob data)

  }, {
    key: "getIntValue",
    value: function getIntValue(tagOrProperty, index, defaultValue) {
      var value = this.getTagValue(tagOrProperty, defaultValue);
      value = InstanceMetadata.getIndexedValue(value, index, defaultValue);

      if (value instanceof Array) {
        value.forEach(function (val, idx) {
          value[idx] = parseFloat(val);
        });
        return value;
      }

      return _typeof(value) === STRING$2 ? parseInt(value) : value;
    }
    /**
     * @deprecated Please use getTagValue instead.
     */

  }, {
    key: "getRawValue",
    value: function getRawValue(tagOrProperty, defaultValue) {
      return this.getTagValue(tagOrProperty, defaultValue);
    }
    /**
     * This function should be overriden by specialized classes in order to allow client libraries or viewers to take advantage of the Study Metadata API.
     */

  }, {
    key: "getTagValue",
    value: function getTagValue(tagOrProperty, defaultValue) {
      /**
       * Please override this method on a specialized class.
       */
      throw new OHIFError('InstanceMetadata::getTagValue is not overriden. Please, override it in a specialized class. See OHIFInstanceMetadata for example');
    }
    /**
     * Compares the current instance with another one.
     * @param {InstanceMetadata} instance An instance of the InstanceMetadata class.
     * @returns {boolean} Returns true if both instances refer to the same instance.
     */

  }, {
    key: "equals",
    value: function equals(instance) {
      var self = this;
      return instance === self || instance instanceof InstanceMetadata && instance.getSOPInstanceUID() === self.getSOPInstanceUID();
    }
    /**
     * Check if the tagOrProperty exists
     * @param  {String} tagOrProperty tag or property be checked
     * @return {Boolean}   True if the tag or property exists or false if doesn't
     */

  }, {
    key: "tagExists",
    value: function tagExists(tagOrProperty) {
      /**
       * Please override this method
       */
      throw new OHIFError('InstanceMetadata::tagExists is not overriden. Please, override it in a specialized class. See OHIFInstanceMetadata for example');
    }
    /**
     * Get custom image id of a sop instance
     * @return {Any}          sop instance image id
     */

  }, {
    key: "getImageId",
    value: function getImageId(frame) {
      /**
       * Please override this method
       */
      throw new OHIFError('InstanceMetadata::getImageId is not overriden. Please, override it in a specialized class. See OHIFInstanceMetadata for example');
    }
    /**
     * Static Methods
     */

    /**
     * Get an value based that can be index based. This function is called by all getters. See above functions.
     *     - If value is a String and has indexes:
     *         - If undefined index: returns an array of the split values.
     *         - If defined index:
     *             - If invalid: returns defaultValue
     *             - If valid: returns the indexed value
     *      - If value is not a String, returns default value.
     */

  }], [{
    key: "getIndexedValue",
    value: function getIndexedValue(value, index, defaultValue) {
      var result = defaultValue;

      if (_typeof(value) === STRING$2) {
        var hasIndexValues = value.indexOf('\\') !== -1;
        result = value;

        if (hasIndexValues) {
          var splitValues = value.split('\\');

          if (Metadata.isValidIndex(index)) {
            var indexedValue = splitValues[index];
            result = _typeof(indexedValue) !== STRING$2 ? defaultValue : indexedValue;
          } else {
            result = splitValues;
          }
        }
      }

      return result;
    }
  }]);

  return InstanceMetadata;
}(Metadata);

var SeriesMetadata =
/*#__PURE__*/
function (_Metadata) {
  _inherits(SeriesMetadata, _Metadata);

  function SeriesMetadata(data, uid) {
    var _this;

    _classCallCheck(this, SeriesMetadata);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SeriesMetadata).call(this, data, uid)); // Initialize Private Properties

    Object.defineProperties(_assertThisInitialized(_assertThisInitialized(_this)), {
      _seriesInstanceUID: {
        configurable: true,
        // configurable so that it can be redefined in sub-classes...
        enumerable: false,
        writable: true,
        value: null
      },
      _instances: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: []
      },
      _firstInstance: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: null
      }
    }); // Initialize Public Properties

    _this._definePublicProperties();

    return _this;
  }
  /**
   * Private Methods
   */

  /**
   * Define Public Properties
   * This method should only be called during initialization (inside the class constructor)
   */


  _createClass(SeriesMetadata, [{
    key: "_definePublicProperties",
    value: function _definePublicProperties() {
      /**
       * Property: this.seriesInstanceUID
       * Same as this.getSeriesInstanceUID()
       * It's specially useful in contexts where a method call is not suitable like in search criteria. For example:
       * seriesCollection.findBy({
       *   seriesInstanceUID: '1.2.3.4.5.6.77777.8888888.99999999999.0'
       * });
       */
      Object.defineProperty(this, 'seriesInstanceUID', {
        configurable: false,
        enumerable: false,
        get: function get() {
          return this.getSeriesInstanceUID();
        }
      });
    }
    /**
     * Public Methods
     */

    /**
     * Returns the SeriesInstanceUID of the current series.
     */

  }, {
    key: "getSeriesInstanceUID",
    value: function getSeriesInstanceUID() {
      return this._seriesInstanceUID;
    }
    /**
     * Append an instance to the current series.
     * @param {InstanceMetadata} instance The instance to be added to the current series.
     * @returns {boolean} Returns true on success, false otherwise.
     */

  }, {
    key: "addInstance",
    value: function addInstance(instance) {
      var result = false;

      if (instance instanceof InstanceMetadata && this.getInstanceByUID(instance.getSOPInstanceUID()) === void 0) {
        this._instances.push(instance);

        result = true;
      }

      return result;
    }
    /**
     * Get the first instance of the current series retaining a consistent result across multiple calls.
     * @return {InstanceMetadata} An instance of the InstanceMetadata class or null if it does not exist.
     */

  }, {
    key: "getFirstInstance",
    value: function getFirstInstance() {
      var instance = this._firstInstance;

      if (!(instance instanceof InstanceMetadata)) {
        instance = null;
        var found = this.getInstanceByIndex(0);

        if (found instanceof InstanceMetadata) {
          this._firstInstance = found;
          instance = found;
        }
      }

      return instance;
    }
    /**
     * Find an instance by index.
     * @param {number} index An integer representing a list index.
     * @returns {InstanceMetadata} Returns a InstanceMetadata instance when found or undefined otherwise.
     */

  }, {
    key: "getInstanceByIndex",
    value: function getInstanceByIndex(index) {
      var found; // undefined by default...

      if (Metadata.isValidIndex(index)) {
        found = this._instances[index];
      }

      return found;
    }
    /**
     * Find an instance by SOPInstanceUID.
     * @param {string} uid An UID string.
     * @returns {InstanceMetadata} Returns a InstanceMetadata instance when found or undefined otherwise.
     */

  }, {
    key: "getInstanceByUID",
    value: function getInstanceByUID(uid) {
      var found; // undefined by default...

      if (Metadata.isValidUID(uid)) {
        found = this._instances.find(function (instance) {
          return instance.getSOPInstanceUID() === uid;
        });
      }

      return found;
    }
    /**
     * Retrieve the number of instances within the current series.
     * @returns {number} The number of instances in the current series.
     */

  }, {
    key: "getInstanceCount",
    value: function getInstanceCount() {
      return this._instances.length;
    }
    /**
     * Invokes the supplied callback for each instance in the current series passing
     * two arguments: instance (an InstanceMetadata instance) and index (the integer
     * index of the instance within the current series)
     * @param {function} callback The callback function which will be invoked for each instance in the series.
     * @returns {undefined} Nothing is returned.
     */

  }, {
    key: "forEachInstance",
    value: function forEachInstance(callback) {
      if (Metadata.isValidCallback(callback)) {
        this._instances.forEach(function (instance, index) {
          callback.call(null, instance, index);
        });
      }
    }
    /**
     * Find the index of an instance inside the series.
     * @param {InstanceMetadata} instance An instance of the SeriesMetadata class.
     * @returns {number} The index of the instance inside the series or -1 if not found.
     */

  }, {
    key: "indexOfInstance",
    value: function indexOfInstance(instance) {
      return this._instances.indexOf(instance);
    }
    /**
     * Search the associated instances using the supplied callback as criteria. The callback is passed
     * two arguments: instance (a InstanceMetadata instance) and index (the integer
     * index of the instance within its series)
     * @param {function} callback The callback function which will be invoked for each instance.
     * @returns {InstanceMetadata|undefined} If an instance is found based on callback criteria it
     *                                     returns a InstanceMetadata. "undefined" is returned otherwise
     */

  }, {
    key: "findInstance",
    value: function findInstance(callback) {
      if (Metadata.isValidCallback(callback)) {
        return this._instances.find(function (instance, index) {
          return callback.call(null, instance, index);
        });
      }
    }
    /**
     * Compares the current series with another one.
     * @param {SeriesMetadata} series An instance of the SeriesMetadata class.
     * @returns {boolean} Returns true if both instances refer to the same series.
     */

  }, {
    key: "equals",
    value: function equals(series) {
      var self = this;
      return series === self || series instanceof SeriesMetadata && series.getSeriesInstanceUID() === self.getSeriesInstanceUID();
    }
  }]);

  return SeriesMetadata;
}(Metadata);

/**
 * Create a random GUID
 *
 * @return {string}
 */
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

var OBJECT$1 = 'object';
/**
 * This class defines an ImageSet object which will be used across the viewer. This object represents
 * a list of images that are associated by any arbitrary criteria being thus content agnostic. Besides the
 * main attributes (images and uid) it allows additional attributes to be appended to it (currently
 * indiscriminately, but this should be changed).
 */

var ImageSet =
/*#__PURE__*/
function () {
  function ImageSet(images) {
    _classCallCheck(this, ImageSet);

    if (Array.isArray(images) !== true) {
      throw new OHIFError('ImageSet expects an array of images');
    } // @property "images"


    Object.defineProperty(this, 'images', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: images
    }); // @property "uid"

    Object.defineProperty(this, 'uid', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: guid() // Unique ID of the instance

    });
  }

  _createClass(ImageSet, [{
    key: "getUID",
    value: function getUID() {
      return this.uid;
    }
  }, {
    key: "setAttribute",
    value: function setAttribute(attribute, value) {
      this[attribute] = value;
    }
  }, {
    key: "getAttribute",
    value: function getAttribute(attribute) {
      return this[attribute];
    }
  }, {
    key: "setAttributes",
    value: function setAttributes(attributes) {
      if (_typeof(attributes) === OBJECT$1 && attributes !== null) {
        var imageSet = this,
            hasOwn = Object.prototype.hasOwnProperty;

        for (var attribute in attributes) {
          if (hasOwn.call(attributes, attribute)) {
            imageSet[attribute] = attributes[attribute];
          }
        }
      }
    }
  }, {
    key: "getImage",
    value: function getImage(index) {
      return this.images[index];
    }
  }, {
    key: "sortBy",
    value: function sortBy(sortingCallback) {
      return this.images.sort(sortingCallback);
    }
  }]);

  return ImageSet;
}();

var StudyMetadata =
/*#__PURE__*/
function (_Metadata) {
  _inherits(StudyMetadata, _Metadata);

  function StudyMetadata(data, uid) {
    var _this;

    _classCallCheck(this, StudyMetadata);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(StudyMetadata).call(this, data, uid)); // Initialize Private Properties

    Object.defineProperties(_assertThisInitialized(_assertThisInitialized(_this)), {
      _studyInstanceUID: {
        configurable: true,
        // configurable so that it can be redefined in sub-classes...
        enumerable: false,
        writable: true,
        value: null
      },
      _series: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: []
      },
      _displaySets: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: []
      },
      _firstSeries: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: null
      },
      _firstInstance: {
        configurable: false,
        enumerable: false,
        writable: true,
        value: null
      }
    }); // Initialize Public Properties

    _this._definePublicProperties();

    return _this;
  }
  /**
   * Private Methods
   */

  /**
   * Define Public Properties
   * This method should only be called during initialization (inside the class constructor)
   */


  _createClass(StudyMetadata, [{
    key: "_definePublicProperties",
    value: function _definePublicProperties() {
      /**
       * Property: this.studyInstanceUID
       * Same as this.getStudyInstanceUID()
       * It's specially useful in contexts where a method call is not suitable like in search criteria. For example:
       * studyCollection.findBy({
       *   studyInstanceUID: '1.2.3.4.5.6.77777.8888888.99999999999.0'
       * });
       */
      Object.defineProperty(this, 'studyInstanceUID', {
        configurable: false,
        enumerable: false,
        get: function get() {
          return this.getStudyInstanceUID();
        }
      });
    }
    /**
     * Public Methods
     */

    /**
     * Getter for displaySets
     * @return {Array} Array of display set object
     */

  }, {
    key: "getDisplaySets",
    value: function getDisplaySets() {
      return this._displaySets.slice();
    }
    /**
     * Set display sets
     * @param {Array} displaySets Array of display sets (ImageSet[])
     */

  }, {
    key: "setDisplaySets",
    value: function setDisplaySets(displaySets) {
      var _this2 = this;

      displaySets.forEach(function (displaySet) {
        return _this2.addDisplaySet(displaySet);
      });
    }
    /**
     * Add a single display set to the list
     * @param {Object} displaySet Display set object
     * @returns {boolean} True on success, false on failure.
     */

  }, {
    key: "addDisplaySet",
    value: function addDisplaySet(displaySet) {
      if (displaySet instanceof ImageSet) {
        this._displaySets.push(displaySet);

        return true;
      }

      return false;
    }
    /**
     * Invokes the supplied callback for each display set in the current study passing
     * two arguments: display set (a ImageSet instance) and index (the integer
     * index of the display set within the current study)
     * @param {function} callback The callback function which will be invoked for each display set instance.
     * @returns {undefined} Nothing is returned.
     */

  }, {
    key: "forEachDisplaySet",
    value: function forEachDisplaySet(callback) {
      if (Metadata.isValidCallback(callback)) {
        this._displaySets.forEach(function (displaySet, index) {
          callback.call(null, displaySet, index);
        });
      }
    }
    /**
     * Search the associated display sets using the supplied callback as criteria. The callback is passed
     * two arguments: display set (a ImageSet instance) and index (the integer
     * index of the display set within the current study)
     * @param {function} callback The callback function which will be invoked for each display set instance.
     * @returns {undefined} Nothing is returned.
     */

  }, {
    key: "findDisplaySet",
    value: function findDisplaySet(callback) {
      if (Metadata.isValidCallback(callback)) {
        return this._displaySets.find(function (displaySet, index) {
          return callback.call(null, displaySet, index);
        });
      }
    }
    /**
     * Retrieve the number of display sets within the current study.
     * @returns {number} The number of display sets in the current study.
     */

  }, {
    key: "getDisplaySetCount",
    value: function getDisplaySetCount() {
      return this._displaySets.length;
    }
    /**
     * Returns the StudyInstanceUID of the current study.
     */

  }, {
    key: "getStudyInstanceUID",
    value: function getStudyInstanceUID() {
      return this._studyInstanceUID;
    }
    /**
     * Getter for series
     * @return {Array} Array of SeriesMetadata object
     */

  }, {
    key: "getSeries",
    value: function getSeries() {
      return this._series.slice();
    }
    /**
     * Append a series to the current study.
     * @param {SeriesMetadata} series The series to be added to the current study.
     * @returns {boolean} Returns true on success, false otherwise.
     */

  }, {
    key: "addSeries",
    value: function addSeries(series) {
      var result = false;

      if (series instanceof SeriesMetadata && this.getSeriesByUID(series.getSeriesInstanceUID()) === void 0) {
        this._series.push(series);

        result = true;
      }

      return result;
    }
    /**
     * Find a series by index.
     * @param {number} index An integer representing a list index.
     * @returns {SeriesMetadata} Returns a SeriesMetadata instance when found or undefined otherwise.
     */

  }, {
    key: "getSeriesByIndex",
    value: function getSeriesByIndex(index) {
      var found; // undefined by default...

      if (Metadata.isValidIndex(index)) {
        found = this._series[index];
      }

      return found;
    }
    /**
     * Find a series by SeriesInstanceUID.
     * @param {string} uid An UID string.
     * @returns {SeriesMetadata} Returns a SeriesMetadata instance when found or undefined otherwise.
     */

  }, {
    key: "getSeriesByUID",
    value: function getSeriesByUID(uid) {
      var found; // undefined by default...

      if (Metadata.isValidUID(uid)) {
        found = this._series.find(function (series) {
          return series.getSeriesInstanceUID() === uid;
        });
      }

      return found;
    }
    /**
     * Retrieve the number of series within the current study.
     * @returns {number} The number of series in the current study.
     */

  }, {
    key: "getSeriesCount",
    value: function getSeriesCount() {
      return this._series.length;
    }
    /**
     * Retrieve the number of instances within the current study.
     * @returns {number} The number of instances in the current study.
     */

  }, {
    key: "getInstanceCount",
    value: function getInstanceCount() {
      return this._series.reduce(function (sum, series) {
        return sum + series.getInstanceCount();
      }, 0);
    }
    /**
     * Invokes the supplied callback for each series in the current study passing
     * two arguments: series (a SeriesMetadata instance) and index (the integer
     * index of the series within the current study)
     * @param {function} callback The callback function which will be invoked for each series instance.
     * @returns {undefined} Nothing is returned.
     */

  }, {
    key: "forEachSeries",
    value: function forEachSeries(callback) {
      if (Metadata.isValidCallback(callback)) {
        this._series.forEach(function (series, index) {
          callback.call(null, series, index);
        });
      }
    }
    /**
     * Find the index of a series inside the study.
     * @param {SeriesMetadata} series An instance of the SeriesMetadata class.
     * @returns {number} The index of the series inside the study or -1 if not found.
     */

  }, {
    key: "indexOfSeries",
    value: function indexOfSeries(series) {
      return this._series.indexOf(series);
    }
    /**
     * It sorts the series based on display sets order. Each series must be an instance
     * of SeriesMetadata and each display sets must be an instance of ImageSet.
     * Useful example of usage:
     *     Study data provided by backend does not sort series at all and client-side
     *     needs series sorted by the same criteria used for sorting display sets.
     */

  }, {
    key: "sortSeriesByDisplaySets",
    value: function sortSeriesByDisplaySets() {
      var _this3 = this;

      // Object for mapping display sets' index by seriesInstanceUid
      var displaySetsMapping = {}; // Loop through each display set to create the mapping

      this.forEachDisplaySet(function (displaySet, index) {
        if (!(displaySet instanceof ImageSet)) {
          throw new OHIFError("StudyMetadata::sortSeriesByDisplaySets display set at index ".concat(index, " is not an instance of ImageSet"));
        } // In case of multiframe studies, just get the first index occurence


        if (displaySetsMapping[displaySet.seriesInstanceUid] === void 0) {
          displaySetsMapping[displaySet.seriesInstanceUid] = index;
        }
      }); // Clone of actual series

      var actualSeries = this.getSeries();
      actualSeries.forEach(function (series, index) {
        if (!(series instanceof SeriesMetadata)) {
          throw new OHIFError("StudyMetadata::sortSeriesByDisplaySets series at index ".concat(index, " is not an instance of SeriesMetadata"));
        } // Get the new series index


        var seriesIndex = displaySetsMapping[series.getSeriesInstanceUID()]; // Update the series object with the new series position

        _this3._series[seriesIndex] = series;
      });
    }
    /**
     * Compares the current study instance with another one.
     * @param {StudyMetadata} study An instance of the StudyMetadata class.
     * @returns {boolean} Returns true if both instances refer to the same study.
     */

  }, {
    key: "equals",
    value: function equals(study) {
      var self = this;
      return study === self || study instanceof StudyMetadata && study.getStudyInstanceUID() === self.getStudyInstanceUID();
    }
    /**
     * Get the first series of the current study retaining a consistent result across multiple calls.
     * @return {SeriesMetadata} An instance of the SeriesMetadata class or null if it does not exist.
     */

  }, {
    key: "getFirstSeries",
    value: function getFirstSeries() {
      var series = this._firstSeries;

      if (!(series instanceof SeriesMetadata)) {
        series = null;
        var found = this.getSeriesByIndex(0);

        if (found instanceof SeriesMetadata) {
          this._firstSeries = found;
          series = found;
        }
      }

      return series;
    }
    /**
     * Get the first instance of the current study retaining a consistent result across multiple calls.
     * @return {InstanceMetadata} An instance of the InstanceMetadata class or null if it does not exist.
     */

  }, {
    key: "getFirstInstance",
    value: function getFirstInstance() {
      var instance = this._firstInstance;

      if (!(instance instanceof InstanceMetadata)) {
        instance = null;
        var firstSeries = this.getFirstSeries();

        if (firstSeries instanceof SeriesMetadata) {
          var found = firstSeries.getFirstInstance();

          if (found instanceof InstanceMetadata) {
            this._firstInstance = found;
            instance = found;
          }
        }
      }

      return instance;
    }
    /**
     * Search the associated series to find an specific instance using the supplied callback as criteria.
     * The callback is passed two arguments: instance (a InstanceMetadata instance) and index (the integer
     * index of the instance within the current series)
     * @param {function} callback The callback function which will be invoked for each instance instance.
     * @returns {Object} Result object containing series (SeriesMetadata) and instance (InstanceMetadata)
     *                   objects or an empty object if not found.
     */

  }, {
    key: "findSeriesAndInstanceByInstance",
    value: function findSeriesAndInstanceByInstance(callback) {
      var result;

      if (Metadata.isValidCallback(callback)) {
        var instance;

        var series = this._series.find(function (series) {
          instance = series.findInstance(callback);
          return instance instanceof InstanceMetadata;
        }); // No series found


        if (series instanceof SeriesMetadata) {
          result = {
            series: series,
            instance: instance
          };
        }
      }

      return result || {};
    }
    /**
     * Find series by instance using the supplied callback as criteria. The callback is passed
     * two arguments: instance (a InstanceMetadata instance) and index (the integer index of
     * the instance within its series)
     * @param {function} callback The callback function which will be invoked for each instance.
     * @returns {SeriesMetadata|undefined} If a series is found based on callback criteria it
     *                                     returns a SeriesMetadata. "undefined" is returned otherwise
     */

  }, {
    key: "findSeriesByInstance",
    value: function findSeriesByInstance(callback) {
      var result = this.findSeriesAndInstanceByInstance(callback);
      return result.series;
    }
    /**
     * Find an instance using the supplied callback as criteria. The callback is passed
     * two arguments: instance (a InstanceMetadata instance) and index (the integer index of
     * the instance within its series)
     * @param {function} callback The callback function which will be invoked for each instance.
     * @returns {InstanceMetadata|undefined} If an instance is found based on callback criteria it
     *                                     returns a InstanceMetadata. "undefined" is returned otherwise
     */

  }, {
    key: "findInstance",
    value: function findInstance(callback) {
      var result = this.findSeriesAndInstanceByInstance(callback);
      return result.instance;
    }
  }]);

  return StudyMetadata;
}(Metadata);

var WadoRsMetaDataBuilder =
/*#__PURE__*/
function () {
  function WadoRsMetaDataBuilder() {
    _classCallCheck(this, WadoRsMetaDataBuilder);

    this.tags = {};
  }

  _createClass(WadoRsMetaDataBuilder, [{
    key: "addTag",
    value: function addTag(tag, value, multi) {
      this.tags[tag] = {
        tag: tag,
        value: value,
        multi: multi
      };
      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var _this = this;

      var json = {};
      var keys = Object.keys(this.tags);
      keys.forEach(function (key) {
        if (!_this.tags.hasOwnProperty(key)) {
          return;
        }

        var tag = _this.tags[key];
        var multi = !!tag.multi;
        var value = tag.value;

        if (value == null || value.length === 1 && value[0] == null) {
          return;
        }

        if (typeof value === 'string' && multi) {
          value = value.split('\\');
        }

        if (!Array.isArray(value)) {
          value = [value];
        }

        json[key] = {
          Value: value
        };
      });
      return json;
    }
  }]);

  return WadoRsMetaDataBuilder;
}();

function getWADORSImageUrl(instance, frame) {
  var wadorsuri = instance.wadorsuri;

  if (!wadorsuri) {
    return;
  } // We need to sum 1 because WADO-RS frame number is 1-based


  frame = (frame || 0) + 1; // Replaces /frame/1 by /frame/{frame}

  wadorsuri = wadorsuri.replace(/(%2Fframes%2F)(\d+)/, "$1".concat(frame));
  return wadorsuri;
}
/**
 * Obtain an imageId for Cornerstone based on the WADO-RS scheme
 *
 * @param {object} instanceMetada metadata object (InstanceMetadata)
 * @returns {string} The imageId to be used by Cornerstone
 */


function getWADORSImageId(instance, frame) {
  var uri = getWADORSImageUrl(instance, frame);

  if (!uri) {
    return;
  }

  return "wadors:".concat(uri);
}

var cornerstone$1 = window.cornerstone;
var cornerstoneTools$1 = window.cornerstoneTools;
var cornerstoneWADOImageLoader = window.cornerstoneWADOImageLoader;
var external = {
  set cornerstone(cs) {
    cornerstone$1 = cs;
  },

  get cornerstone() {
    return cornerstone$1;
  },

  set cornerstoneTools(tools) {
    cornerstoneTools$1 = tools;
  },

  get cornerstoneTools() {
    return cornerstoneTools$1;
  },

  set cornerstoneWADOImageLoader(wado) {
    cornerstoneWADOImageLoader = wado;
  },

  get cornerstoneWADOImageLoader() {
    return cornerstoneWADOImageLoader;
  }

};

function getRadiopharmaceuticalInfoMetaData(instance) {
  var radiopharmaceuticalInfo = instance.radiopharmaceuticalInfo;

  if (instance.modality !== 'PT' || !radiopharmaceuticalInfo) {
    return;
  }

  return new WadoRsMetaDataBuilder().addTag('00181072', radiopharmaceuticalInfo.radiopharmaceuticalStartTime).addTag('00181074', radiopharmaceuticalInfo.radionuclideTotalDose).addTag('00181075', radiopharmaceuticalInfo.radionuclideHalfLife).toJSON();
}

var getWadoRsInstanceMetaData = function getWadoRsInstanceMetaData(study, series, instance) {
  return new WadoRsMetaDataBuilder().addTag('00080016', instance.sopClassUid).addTag('00080018', instance.sopInstanceUid).addTag('00080021', series.seriesDate).addTag('00080031', series.seriesTime).addTag('00080060', instance.modality).addTag('00101010', study.patientAge).addTag('00101020', study.patientSize).addTag('00101030', study.patientWeight).addTag('00180050', instance.sliceThickness).addTag('0020000e', series.seriesInstanceUid).addTag('00200011', series.seriesNumber).addTag('0020000d', study.studyInstanceUid).addTag('00200013', instance.instanceNumber).addTag('00200032', instance.imagePositionPatient, true).addTag('00200037', instance.imageOrientationPatient, true).addTag('00200052', instance.frameOfReferenceUID).addTag('00201041', instance.sliceLocation).addTag('00280002', instance.samplesPerPixel).addTag('00280004', instance.photometricInterpretation).addTag('00280006', instance.planarConfiguration).addTag('00280010', instance.rows).addTag('00280011', instance.columns).addTag('00280030', instance.pixelSpacing, true).addTag('00280034', instance.pixelAspectRatio, true).addTag('00280100', instance.bitsAllocated).addTag('00280101', instance.bitsStored).addTag('00280102', instance.highBit).addTag('00280103', instance.pixelRepresentation).addTag('00280106', instance.smallestPixelValue).addTag('00280107', instance.largestPixelValue).addTag('00281050', instance.windowCenter, true).addTag('00281051', instance.windowWidth, true).addTag('00281052', instance.rescaleIntercept).addTag('00281053', instance.rescaleSlope).addTag('00281054', instance.rescaleType).addTag('00281101', instance.redPaletteColorLookupTableDescriptor).addTag('00281102', instance.greenPaletteColorLookupTableDescriptor).addTag('00281103', instance.bluePaletteColorLookupTableDescriptor).addTag('00281201', instance.redPaletteColorLookupTableData).addTag('00281202', instance.greenPaletteColorLookupTableData).addTag('00281203', instance.bluePaletteColorLookupTableData).addTag('00540016', getRadiopharmaceuticalInfoMetaData(instance)).toJSON();
};

function updateMetaDataManager(study) {
  study.seriesList.forEach(function (series) {
    series.instances.forEach(function (instance) {
      // Cache just images that are going to be loaded via WADO-RS
      if (instance.imageRendering !== 'wadors' && instance.thumbnailRendering !== 'wadors') {
        return;
      }

      var metaData = getWadoRsInstanceMetaData(study, series, instance);
      var numberOfFrames = instance.numberOfFrames || 1; // We can share the same metaData with all frames because it doesn't have
      // any frame specific data, such as frameNumber, pixelData, offset, etc.
      // WADO-RS frame number is 1-based

      for (var frameNumber = 0; frameNumber < numberOfFrames; frameNumber++) {
        var imageId = getWADORSImageId(instance, frameNumber); // TODO Drop dependency on this

        external.cornerstoneWADOImageLoader.wadors.metaDataManager.add(imageId, metaData);
      }
    });
  });
}

/**
 * Retrieves metaData for multiple studies at once.
 *
 * This function calls retrieveStudyMetadata several times, asynchronously,
 * and waits for all of the results to be returned.
 *
 * @param studyInstanceUids The UIDs of the Studies to be retrieved
 * @return Promise
 */

function retrieveStudiesMetadata(server, studyInstanceUids, seriesInstanceUids) {
  // Create an empty array to store the Promises for each metaData retrieval call
  var promises = []; // Loop through the array of studyInstanceUids

  studyInstanceUids.forEach(function (studyInstanceUid) {
    // Send the call and resolve or reject the related promise based on its outcome
    var promise = retrieveStudyMetadata(server, studyInstanceUid, seriesInstanceUids); // Add the current promise to the array of promises

    promises.push(promise);
  }); // When all of the promises are complete, this callback runs

  var promise = Promise.all(promises); // Warn the error on console if some retrieval failed

  promise.catch(function (error) {
    return log$1.warn(error);
  });
  return promise;
}

/**
 * Overridable namespace to allow getting study boxes data externally.
 *
 * The function must handle the first parameter as a studyInformation object containing at least the
 * studyInstanceUid attribute.
 *
 * Shall return a promise that will be resolved with an object containing those attributes:
 * - studyInstanceUid {String}: copy of studyInformation.studyInstanceUid
 * - modalities {String}: 2 uppercase letters for each modality split by any non-alphabetical char(s)
 * - studyDate {String}: date formatted as YYYYMMDD
 * - studyDescription {String}: study description string
 */
// TODO: What is this for?
var getStudyBoxData = false;

/**
 * Creates a QIDO date string for a date range query
 * Assumes the year is positive, at most 4 digits long.
 *
 * @param date The Date object to be formatted
 * @returns {string} The formatted date string
 */

function dateToString$1(date) {
  if (!date) return '';
  var year = date.getFullYear().toString();
  var month = (date.getMonth() + 1).toString();
  var day = date.getDate().toString();
  year = '0'.repeat(4 - year.length).concat(year);
  month = '0'.repeat(2 - month.length).concat(month);
  day = '0'.repeat(2 - day.length).concat(day);
  return ''.concat(year, month, day);
}
/**
 * Produces a QIDO URL given server details and a set of specified search filter
 * items
 *
 * @param filter
 * @param serverSupportsQIDOIncludeField
 * @returns {string} The URL with encoded filter query data
 */


function getQIDOQueryParams$2(filter, serverSupportsQIDOIncludeField) {
  var commaSeparatedFields = ['00081030', // Study Description
  '00080060' //Modality
  // Add more fields here if you want them in the result
  ].join(',');
  var parameters = {
    PatientName: filter.patientName,
    PatientID: filter.patientId,
    AccessionNumber: filter.accessionNumber,
    StudyDescription: filter.studyDescription,
    ModalitiesInStudy: filter.modalitiesInStudy,
    limit: filter.limit,
    offset: filter.offset,
    includefield: serverSupportsQIDOIncludeField ? commaSeparatedFields : 'all'
  }; // build the StudyDate range parameter

  if (filter.studyDateFrom || filter.studyDateTo) {
    var dateFrom = dateToString$1(new Date(filter.studyDateFrom));
    var dateTo = dateToString$1(new Date(filter.studyDateTo));
    parameters.StudyDate = "".concat(dateFrom, "-").concat(dateTo);
  } // Build the StudyInstanceUID parameter


  if (filter.studyInstanceUid) {
    var studyUids = filter.studyInstanceUid;
    studyUids = Array.isArray(studyUids) ? studyUids.join() : studyUids;
    studyUids = studyUids.replace(/[^0-9.]+/g, '\\');
    parameters.StudyInstanceUID = studyUids;
  } // Clean query params of undefined values.


  var params = {};
  Object.keys(parameters).forEach(function (key) {
    if (parameters[key] !== undefined && parameters[key] !== "") {
      params[key] = parameters[key];
    }
  });
  return params;
}
/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param resultData
 * @returns {Array} An array of Study MetaData objects
 */


function resultDataToStudies$1(resultData) {
  var studies = [];
  if (!resultData || !resultData.length) return;
  resultData.forEach(function (study) {
    return studies.push({
      studyInstanceUid: DICOMWeb.getString(study['0020000D']),
      // 00080005 = SpecificCharacterSet
      studyDate: DICOMWeb.getString(study['00080020']),
      studyTime: DICOMWeb.getString(study['00080030']),
      accessionNumber: DICOMWeb.getString(study['00080050']),
      referringPhysicianName: DICOMWeb.getString(study['00080090']),
      // 00081190 = URL
      patientName: DICOMWeb.getName(study['00100010']),
      patientId: DICOMWeb.getString(study['00100020']),
      patientBirthdate: DICOMWeb.getString(study['00100030']),
      patientSex: DICOMWeb.getString(study['00100040']),
      studyId: DICOMWeb.getString(study['00200010']),
      numberOfStudyRelatedSeries: DICOMWeb.getString(study['00201206']),
      numberOfStudyRelatedInstances: DICOMWeb.getString(study['00201208']),
      studyDescription: DICOMWeb.getString(study['00081030']),
      // modality: DICOMWeb.getString(study['00080060']),
      // modalitiesInStudy: DICOMWeb.getString(study['00080061']),
      modalities: DICOMWeb.getString(DICOMWeb.getModalities(study['00080060'], study['00080061']))
    });
  });
  return studies;
}

function Studies$1(server, filter) {
  var config = {
    url: server.qidoRoot,
    headers: DICOMWeb.getAuthorizationHeader(server)
  };
  var dicomWeb = new DICOMwebClient.api.DICOMwebClient(config);
  var queryParams = getQIDOQueryParams$2(filter, server.qidoSupportsIncludeField);
  var options = {
    queryParams: queryParams
  };
  return dicomWeb.searchForStudies(options).then(resultDataToStudies$1);
}

var studySearchPromises = new Map();
/**
 * Search for studies information by the given filter
 *
 * @param {Object} filter Filter that will be used on search
 * @returns {Promise} resolved with an array of studies information or rejected with an error
 */

function searchStudies(server, filter) {
  var promiseKey = JSON.stringify(filter);

  if (studySearchPromises.has(promiseKey)) {
    return studySearchPromises.get(promiseKey);
  } else {
    var promise = Studies$1(server, filter);
    studySearchPromises.set(promiseKey, promise);
    return promise;
  }
}

var studies = {
  services: {
    QIDO: QIDO,
    WADO: WADO
  },
  loadingDict: {},
  retrieveStudyMetadata: retrieveStudyMetadata,
  deleteStudyMetadataPromise: deleteStudyMetadataPromise,
  retrieveStudiesMetadata: retrieveStudiesMetadata,
  getStudyBoxData: getStudyBoxData,
  searchStudies: searchStudies
};

function isFunction(subject) {
  return typeof subject === 'function';
}

var CommandsManager =
/*#__PURE__*/
function () {
  function CommandsManager() {
    _classCallCheck(this, CommandsManager);

    this.contexts = {}; // Enable reactivity by storing the last executed command
    //this.last = new ReactiveVar('');
  }

  _createClass(CommandsManager, [{
    key: "getContext",
    value: function getContext(contextName) {
      var context = this.contexts[contextName];

      if (!context) {
        return log$1.warn("No context found with name \"".concat(contextName, "\""));
      }

      return context;
    }
  }, {
    key: "getCurrentContext",
    value: function getCurrentContext() {
      var contextName = OHIF.context.get();

      if (!contextName) {
        return log$1.warn('There is no selected context');
      }

      return this.getContext(contextName);
    }
  }, {
    key: "createContext",
    value: function createContext(contextName) {
      if (!contextName) return;

      if (this.contexts[contextName]) {
        return this.clear(contextName);
      }

      this.contexts[contextName] = {};
    }
  }, {
    key: "set",
    value: function set(contextName, definitions) {
      var extend = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      if (_typeof(definitions) !== 'object') return;
      var context = this.getContext(contextName);
      if (!context) return;

      if (!extend) {
        this.clear(contextName);
      }

      Object.keys(definitions).forEach(function (command) {
        return context[command] = definitions[command];
      });
    }
  }, {
    key: "register",
    value: function register(contextName, command, definition) {
      if (_typeof(definition) !== 'object') return;
      var context = this.getContext(contextName);
      if (!context) return;
      context[command] = definition;
    }
  }, {
    key: "setDisabledFunction",
    value: function setDisabledFunction(contextName, command, func) {
      if (!command || typeof func !== 'function') return;
      var context = this.getContext(contextName);
      if (!context) return;
      var definition = context[command];

      if (!definition) {
        return log$1.warn("Trying to set a disabled function to a command \"".concat(command, "\" that was not yet defined"));
      }

      definition.disabled = func;
    }
  }, {
    key: "clear",
    value: function clear(contextName) {
      if (!contextName) return;
      this.contexts[contextName] = {};
    }
  }, {
    key: "getDefinition",
    value: function getDefinition(command) {
      var context = this.getCurrentContext();
      if (!context) return;
      return context[command];
    }
  }, {
    key: "isDisabled",
    value: function isDisabled(command) {
      var definition = this.getDefinition(command);
      if (!definition) return false;
      var disabled = definition.disabled;
      if (isFunction(disabled) && disabled()) return true;
      if (!isFunction(disabled) && disabled) return true;
      return false;
    }
  }, {
    key: "run",
    value: function run(command) {
      var definition = this.getDefinition(command);

      if (!definition) {
        return log$1.warn("Command \"".concat(command, "\" not found in current context"));
      }

      var action = definition.action,
          params = definition.params;
      if (this.isDisabled(command)) return;

      if (typeof action !== 'function') {
        return log$1.warn("No action was defined for command \"".concat(command, "\""));
      } else {
        var result = action(params);
        /*if (this.last.get() === command) {
          this.last.dep.changed();
        } else {
          this.last.set(command);
        }*/

        return result;
      }
    }
  }]);

  return CommandsManager;
}();

var commands = new CommandsManager(); // Export relevant objects

var HotkeysContext =
/*#__PURE__*/
function () {
  function HotkeysContext(name, definitions, enabled) {
    _classCallCheck(this, HotkeysContext);

    this.name = name;
    this.definitions = Object.assign({}, definitions);
    this.enabled = enabled;
  }

  _createClass(HotkeysContext, [{
    key: "extend",
    value: function extend() {
      var _this = this;

      var definitions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      if (_typeof(definitions) !== 'object') return;
      this.definitions = Object.assign({}, definitions);
      Object.keys(definitions).forEach(function (command) {
        var hotkey = definitions[command];

        _this.unregister(command);

        if (hotkey) {
          _this.register(command, hotkey);
        }

        _this.definitions[command] = hotkey;
      });
    }
  }, {
    key: "register",
    value: function register(command, hotkey) {
      var _this2 = this;

      if (!hotkey) {
        return;
      }

      if (!command) {
        return log$1.warn("No command was defined for hotkey \"".concat(hotkey, "\""));
      }

      var bindingKey = "keydown.hotkey.".concat(this.name, ".").concat(command);

      var bind = function bind(hotkey) {
        return $(document).bind(bindingKey, hotkey, function (event) {
          if (!_this2.enabled.get()) return;
          OHIF.commands.run(command);
          event.preventDefault();
        });
      };

      if (hotkey instanceof Array) {
        hotkey.forEach(function (hotkey) {
          return bind(hotkey);
        });
      } else {
        bind(hotkey);
      }
    }
  }, {
    key: "unregister",
    value: function unregister(command) {
      var bindingKey = "keydown.hotkey.".concat(this.name, ".").concat(command);

      if (this.definitions[command]) {
        $(document).unbind(bindingKey);
        delete this.definitions[command];
      }
    }
  }, {
    key: "initialize",
    value: function initialize() {
      var _this3 = this;

      Object.keys(this.definitions).forEach(function (command) {
        var hotkey = _this3.definitions[command];

        _this3.register(command, hotkey);
      });
    }
  }, {
    key: "destroy",
    value: function destroy() {
      $(document).unbind("keydown.hotkey.".concat(this.name));
    }
  }]);

  return HotkeysContext;
}();

var HotkeysManager =
/*#__PURE__*/
function () {
  function HotkeysManager() {
    _classCallCheck(this, HotkeysManager);

    this.contexts = {};
    this.defaults = {};
    this.currentContextName = null;
    this.enabled = true;
    this.retrieveFunction = null;
    this.storeFunction = null;
  }

  _createClass(HotkeysManager, [{
    key: "setRetrieveFunction",
    value: function setRetrieveFunction(retrieveFunction) {
      this.retrieveFunction = retrieveFunction;
    }
  }, {
    key: "setStoreFunction",
    value: function setStoreFunction(storeFunction) {
      this.storeFunction = storeFunction;
    }
  }, {
    key: "store",
    value: function store(contextName, definitions) {
      var _this = this;

      var storageKey = "hotkeysDefinitions.".concat(contextName);
      return new Promise(function (resolve, reject) {
        if (_this.storeFunction) {
          _this.storeFunction.call(_this, storageKey, definitions).then(resolve).catch(reject); //} else if (OHIF.user.userLoggedIn()) {
          //    OHIF.user.setData(storageKey, definitions).then(resolve).catch(reject);

        } else {
          var definitionsJSON = JSON.stringify(definitions);
          localStorage.setItem(storageKey, definitionsJSON);
          resolve();
        }
      });
    }
  }, {
    key: "retrieve",
    value: function retrieve(contextName) {
      var _this2 = this;

      var storageKey = "hotkeysDefinitions.".concat(contextName);
      return new Promise(function (resolve, reject) {
        if (_this2.retrieveFunction) {
          _this2.retrieveFunction(contextName).then(resolve).catch(reject);
        } else if (OHIF.user.userLoggedIn()) {
          try {
            resolve(OHIF.user.getData(storageKey));
          } catch (error) {
            reject(error);
          }
        } else {
          var definitionsJSON = localStorage.getItem(storageKey) || '';
          var definitions = JSON.parse(definitionsJSON) || undefined;
          resolve(definitions);
        }
      });
    }
  }, {
    key: "disable",
    value: function disable() {
      this.enabled.set(false);
    }
  }, {
    key: "enable",
    value: function enable() {
      this.enabled.set(true);
    }
  }, {
    key: "getContext",
    value: function getContext(contextName) {
      return this.contexts[contextName];
    }
  }, {
    key: "getCurrentContext",
    value: function getCurrentContext() {
      return this.getContext(this.currentContextName);
    }
  }, {
    key: "load",
    value: function load(contextName) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var context = _this3.getContext(contextName);

        if (!context) return reject();

        _this3.retrieve(contextName).then(function (defs) {
          var definitions = defs || _this3.defaults[contextName];

          if (!definitions) {
            _this3.changeObserver.changed();

            return reject();
          }

          context.destroy();
          context.definitions = definitions;
          context.initialize();

          _this3.changeObserver.changed();

          resolve(definitions);
        }).catch(reject);
      });
    }
  }, {
    key: "set",
    value: function set(contextName, contextDefinitions) {
      var isDefaultDefinitions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var enabled = this.enabled;
      var context = new HotkeysContext(contextName, contextDefinitions, enabled);
      var currentContext = this.getCurrentContext();

      if (currentContext && currentContext.name === contextName) {
        currentContext.destroy();
        context.initialize();
      }

      this.contexts[contextName] = context;

      if (isDefaultDefinitions) {
        this.defaults[contextName] = contextDefinitions;
      }
    }
  }, {
    key: "register",
    value: function register(contextName, command, hotkey) {
      if (!command || !hotkey) return;
      var context = this.getContext(contextName);

      if (!context) {
        this.set(contextName, {});
      }

      context.register(command, hotkey);
    }
  }, {
    key: "unsetContext",
    value: function unsetContext(contextName) {
      if (contextName === this.currentContextName) {
        this.getCurrentContext().destroy();
      }

      delete this.contexts[contextName];
      delete this.defaults[contextName];
    }
  }, {
    key: "resetDefaults",
    value: function resetDefaults(contextName) {
      var context = this.getContext(contextName);
      var definitions = this.defaults[contextName];
      if (!context || !definitions) return;
      context.extend(definitions);
      return this.store(contextName, definitions);
    }
  }, {
    key: "switchToContext",
    value: function switchToContext(contextName) {
      var currentContext = this.getCurrentContext();

      if (currentContext) {
        currentContext.destroy();
      }

      var newContext = this.contexts[contextName];
      if (!newContext) return;
      this.currentContextName = contextName;
      newContext.initialize();
      this.load(contextName).catch(function () {});
    }
  }]);

  return HotkeysManager;
}();

//import 'jquery.hotkeys';
// Create hotkeys namespace using a HotkeysManager class instance

var hotkeys = new HotkeysManager(); // Export relevant objects

var FUNCTION$1 = 'function';
var STRING$3 = 'string';
var WILDCARD = '*'; // "*" is a special name which means "all children".

var SEPARATOR = '.';
/**
 * Main Namespace Component Class
 */

var Node =
/*#__PURE__*/
function () {
  function Node() {
    _classCallCheck(this, Node);

    this.value = 0;
    this.children = {};
    this.handlers = {};
  }

  _createClass(Node, [{
    key: "getPathComponents",
    value: function getPathComponents(path) {
      return _typeof(path) === STRING$3 ? path.split(SEPARATOR) : null;
    }
  }, {
    key: "getNodeUpToIndex",
    value: function getNodeUpToIndex(path, index) {
      var node = this;

      for (var i = 0; i < index; ++i) {
        var item = path[i];

        if (node.children.hasOwnProperty(item)) {
          node = node.children[item];
        } else {
          node = null;
          break;
        }
      }

      return node;
    }
  }, {
    key: "append",
    value: function append(name, value) {
      var children = this.children;
      var node = null;

      if (children.hasOwnProperty(name)) {
        node = children[name];
      } else if (_typeof(name) === STRING$3 && name !== WILDCARD) {
        node = new Node();
        children[name] = node;
      }

      if (node !== null) {
        node.value += value > 0 ? parseInt(value) : 0;
      }

      return node;
    }
  }, {
    key: "probe",
    value: function probe(recursively) {
      var value = this.value; // Calculate entire tree value recursively?

      if (recursively === true) {
        var children = this.children;

        for (var item in children) {
          if (children.hasOwnProperty(item)) {
            value += children[item].probe(recursively);
          }
        }
      }

      return value;
    }
  }, {
    key: "clear",
    value: function clear(recursively) {
      this.value = 0; // Clear entire tree recursively?

      if (recursively === true) {
        var children = this.children;

        for (var item in children) {
          if (children.hasOwnProperty(item)) {
            children[item].clear(recursively);
          }
        }
      }
    }
  }, {
    key: "appendPath",
    value: function appendPath(path, value) {
      path = this.getPathComponents(path);

      if (path !== null) {
        var last = path.length - 1;
        var node = this;

        for (var i = 0; i < last; ++i) {
          node = node.append(path[i], 0);

          if (node === null) {
            return false;
          }
        }

        return node.append(path[last], value) !== null;
      }

      return false;
    }
  }, {
    key: "clearPath",
    value: function clearPath(path, recursively) {
      path = this.getPathComponents(path);

      if (path !== null) {
        var last = path.length - 1;
        var node = this.getNodeUpToIndex(path, last);

        if (node !== null) {
          var item = path[last];

          if (item !== WILDCARD) {
            if (node.children.hasOwnProperty(item)) {
              node.children[item].clear(recursively);
              return true;
            }
          } else {
            var children = node.children;

            for (item in children) {
              if (children.hasOwnProperty(item)) {
                children[item].clear(recursively);
              }
            }

            return true;
          }
        }
      }

      return false;
    }
  }, {
    key: "probePath",
    value: function probePath(path, recursively) {
      path = this.getPathComponents(path);

      if (path !== null) {
        var last = path.length - 1;
        var node = this.getNodeUpToIndex(path, last);

        if (node !== null) {
          var item = path[last];

          if (item !== WILDCARD) {
            if (node.children.hasOwnProperty(item)) {
              return node.children[item].probe(recursively);
            }
          } else {
            var children = node.children;
            var value = 0;

            for (item in children) {
              if (children.hasOwnProperty(item)) {
                value += children[item].probe(recursively);
              }
            }

            return value;
          }
        }
      }

      return 0;
    }
  }, {
    key: "attachHandler",
    value: function attachHandler(type, handler) {
      var result = false;

      if (_typeof(type) === STRING$3 && _typeof(handler) === FUNCTION$1) {
        var handlers = this.handlers;
        var list = handlers.hasOwnProperty(type) ? handlers[type] : handlers[type] = [];
        var length = list.length;
        var notFound = true;

        for (var i = 0; i < length; ++i) {
          if (handler === list[i]) {
            notFound = false;
            break;
          }
        }

        if (notFound) {
          list[length] = handler;
          result = true;
        }
      }

      return result;
    }
  }, {
    key: "removeHandler",
    value: function removeHandler(type, handler) {
      var result = false;

      if (_typeof(type) === STRING$3 && _typeof(handler) === FUNCTION$1) {
        var handlers = this.handlers;

        if (handlers.hasOwnProperty(type)) {
          var list = handlers[type];
          var length = list.length;

          for (var i = 0; i < length; ++i) {
            if (handler === list[i]) {
              list.splice(i, 1);
              result = true;
              break;
            }
          }
        }
      }

      return result;
    }
  }, {
    key: "trigger",
    value: function trigger(type, nonRecursively) {
      if (_typeof(type) === STRING$3) {
        var handlers = this.handlers;

        if (handlers.hasOwnProperty(type)) {
          var list = handlers[type];
          var length = list.length;

          for (var i = 0; i < length; ++i) {
            list[i].call(null);
          }
        }

        if (nonRecursively !== true) {
          var children = this.children;

          for (var item in children) {
            if (children.hasOwnProperty(item)) {
              children[item].trigger(type);
            }
          }
        }
      }
    }
  }, {
    key: "attachHandlerForPath",
    value: function attachHandlerForPath(path, type, handler) {
      path = this.getPathComponents(path);

      if (path !== null) {
        var node = this.getNodeUpToIndex(path, path.length);

        if (node !== null) {
          return node.attachHandler(type, handler);
        }
      }

      return false;
    }
  }, {
    key: "removeHandlerForPath",
    value: function removeHandlerForPath(path, type, handler) {
      path = this.getPathComponents(path);

      if (path !== null) {
        var node = this.getNodeUpToIndex(path, path.length);

        if (node !== null) {
          return node.removeHandler(type, handler);
        }
      }

      return false;
    }
  }, {
    key: "triggerHandlersForPath",
    value: function triggerHandlersForPath(path, type, nonRecursively) {
      path = this.getPathComponents(path);

      if (path !== null) {
        var node = this.getNodeUpToIndex(path, path.length);

        if (node !== null) {
          node.trigger(type, nonRecursively);
        }
      }
    }
  }]);

  return Node;
}();
/**
 * Root Namespace Node and API
 */


var rootNode = new Node();

function handleError(error) {
  var title = error.title,
      message = error.message;

  if (!title) {
    if (error instanceof Error) {
      title = error.name;
    }
  }

  if (!message) {
    if (error instanceof Error) {
      message = error.message;
    }
  }

  var data = Object.assign({
    title: title,
    message: message,
    class: 'themed',
    hideConfirm: true,
    cancelLabel: 'Dismiss',
    cancelClass: 'btn-secondary'
  }, error || {});
  log$1.error(error); // TODO: Find a better way to handle errors instead of displaying a dialog for all of them.
  // OHIF.ui.showDialog('dialogForm', data);
}

/**
 * Check if the pressed key combination will result in a character input
 * Got from https://stackoverflow.com/questions/4179708/how-to-detect-if-the-pressed-key-will-produce-a-character-inside-an-input-text
 *
 * @returns {Boolean} Whether the pressed key combination will input a character or not
 */
function isCharacterKeyPress(event) {
  if (typeof event.which === 'undefined') {
    // This is IE, which only fires keypress events for printable keys
    return true;
  } else if (typeof event.which === 'number' && event.which > 0) {
    // In other browsers except old versions of WebKit, event.which is
    // only greater than zero if the keypress is a printable key.
    // We need to filter out backspace and ctrl/alt/meta key combinations
    return !event.ctrlKey && !event.metaKey && !event.altKey && event.which !== 8;
  }

  return false;
}

/**
 * Get the offset for the given element
 *
 * @param {Object} element DOM element which will have the offser calculated
 * @returns {Object} Object containing the top and left offset
 */
function getOffset(element) {
  var top = 0;
  var left = 0;

  if (element.offsetParent) {
    do {
      left += element.offsetLeft;
      top += element.offsetTop;
    } while (element = element.offsetParent);
  }

  return {
    left: left,
    top: top
  };
}

/**
 * Get the vertical and horizontal scrollbar sizes
 * Got from https://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes
 *
 * @returns {Array} Array containing the scrollbar horizontal and vertical sizes
 */
function getScrollbarSize() {
  var inner = document.createElement('p');
  inner.style.width = '100%';
  inner.style.height = '100%';
  var outer = document.createElement('div');
  outer.style.position = 'absolute';
  outer.style.top = '0px';
  outer.style.left = '0px';
  outer.style.visibility = 'hidden';
  outer.style.width = '100px';
  outer.style.height = '100px';
  outer.style.overflow = 'hidden';
  outer.appendChild(inner);
  document.body.appendChild(outer);
  var w1 = inner.offsetWidth;
  var h1 = inner.offsetHeight;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  var h2 = inner.offsetHeight;

  if (w1 === w2) {
    w2 = outer.clientWidth;
  }

  if (h1 === h2) {
    h2 = outer.clientHeight;
  }

  document.body.removeChild(outer);
  return [w1 - w2, h1 - h2];
}

var ui = {
  getScrollbarSize: getScrollbarSize,
  getOffset: getOffset,
  isCharacterKeyPress: isCharacterKeyPress,
  handleError: handleError
};

//import Dropdown from './ui/dropdown/class.js';

/*
 * Defines the base OHIF header object
 */
//const dropdown = new OHIF.ui.Dropdown();
var header = {};

var ObjectPath =
/*#__PURE__*/
function () {
  function ObjectPath() {
    _classCallCheck(this, ObjectPath);
  }

  _createClass(ObjectPath, null, [{
    key: "set",

    /**
     * Set an object property based on "path" (namespace) supplied creating
     * ... intermediary objects if they do not exist.
     * @param object {Object} An object where the properties specified on path should be set.
     * @param path {String} A string representing the property to be set, e.g. "user.study.series.timepoint".
     * @param value {Any} The value of the property that will be set.
     * @return {Boolean} Returns "true" on success, "false" if any intermediate component of the supplied path
     * ... is not a valid Object, in which case the property cannot be set. No excpetions are thrown.
     */
    value: function set(object, path, value) {
      var components = ObjectPath.getPathComponents(path),
          length = components !== null ? components.length : 0,
          result = false;

      if (length > 0 && ObjectPath.isValidObject(object)) {
        var i = 0,
            last = length - 1,
            currentObject = object;

        while (i < last) {
          var field = components[i];

          if (field in currentObject) {
            if (!ObjectPath.isValidObject(currentObject[field])) {
              break;
            }
          } else {
            currentObject[field] = {};
          }

          currentObject = currentObject[field];
          i++;
        }

        if (i === last) {
          currentObject[components[last]] = value;
          result = true;
        }
      }

      return result;
    }
    /**
     * Get an object property based on "path" (namespace) supplied traversing the object
     * ... tree as necessary.
     * @param object {Object} An object where the properties specified might exist.
     * @param path {String} A string representing the property to be searched for, e.g. "user.study.series.timepoint".
     * @return {Any} The value of the property if found. By default, returns the special type "undefined".
     */

  }, {
    key: "get",
    value: function get(object, path) {
      var found,
          // undefined by default
      components = ObjectPath.getPathComponents(path),
          length = components !== null ? components.length : 0;

      if (length > 0 && ObjectPath.isValidObject(object)) {
        var i = 0,
            last = length - 1,
            currentObject = object;

        while (i < last) {
          var field = components[i];
          var isValid = ObjectPath.isValidObject(currentObject[field]);

          if (field in currentObject && isValid) {
            currentObject = currentObject[field];
            i++;
          } else {
            break;
          }
        }

        if (i === last && components[last] in currentObject) {
          found = currentObject[components[last]];
        }
      }

      return found;
    }
    /**
     * Check if the supplied argument is a real JavaScript Object instance.
     * @param object {Any} The subject to be tested.
     * @return {Boolean} Returns "true" if the object is a real Object instance and "false" otherwise.
     */

  }, {
    key: "isValidObject",
    value: function isValidObject(object) {
      return _typeof(object) === 'object' && object !== null && object instanceof Object;
    }
  }, {
    key: "getPathComponents",
    value: function getPathComponents(path) {
      return typeof path === 'string' ? path.split('.') : null;
    }
  }]);

  return ObjectPath;
}();

function absoluteUrl(path) {
  var absolutePath = '/'; // TODO: Find another way to get root url

  var absoluteUrl = window.location.origin;
  var absoluteUrlParts = absoluteUrl.split('/');

  if (absoluteUrlParts.length > 4) {
    var rootUrlPrefixIndex = absoluteUrl.indexOf(absoluteUrlParts[3]);
    absolutePath += absoluteUrl.substring(rootUrlPrefixIndex) + path;
  } else {
    absolutePath += path;
  }

  return absolutePath.replace(/\/\/+/g, '/');
}

// TODO: figure out where else to put this function
function addServers(servers, store) {
  Object.keys(servers).forEach(function (serverType) {
    var endpoints = servers[serverType];
    endpoints.forEach(function (endpoint) {
      var server = Object.assign({}, endpoint);
      server.type = serverType;
      store.dispatch({
        type: 'ADD_SERVER',
        server: server
      });
    });
  });
}

// Return the array sorting function for its object's properties
function sortBy() {
  var fields = [].slice.call(arguments),
      n_fields = fields.length;
  return function (A, B) {
    var a, b, field, key, reverse, result, i;

    for (i = 0; i < n_fields; i++) {
      result = 0;
      field = fields[i];
      key = typeof field === 'string' ? field : field.name;
      a = A[key];
      b = B[key];

      if (typeof field.primer !== 'undefined') {
        a = field.primer(a);
        b = field.primer(b);
      }

      reverse = field.reverse ? -1 : 1;

      if (a < b) {
        result = reverse * -1;
      }

      if (a > b) {
        result = reverse * 1;
      }

      if (result !== 0) {
        break;
      }
    }

    return result;
  };
}

/* jshint -W060 */
function writeScript(fileName, callback) {
  var script = document.createElement('script');
  script.src = absoluteUrl(fileName);

  script.onload = function () {
    if (typeof callback === 'function') {
      callback(script);
    }
  };

  document.body.appendChild(script);
}

function updateQueryStringParameter(uri, key, value) {
  var regex = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
  var separator = uri.indexOf('?') !== -1 ? '&' : '?';

  if (uri.match(regex)) {
    return uri.replace(regex, '$1' + key + '=' + value + '$2');
  } else {
    return uri + separator + key + '=' + value;
  }
}
/**
 * Obtain an imageId for Cornerstone from an image instance
 *
 * @param instance
 * @param frame
 * @param thumbnail
 * @returns {string} The imageId to be used by Cornerstone
 */


function getImageId(instance, frame) {
  var thumbnail = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if (!instance) {
    return;
  }

  if (typeof instance.getImageId === 'function') {
    return instance.getImageId();
  }

  if (instance.url) {
    if (frame !== undefined) {
      instance.url = updateQueryStringParameter(instance.url, 'frame', frame);
    }

    return instance.url;
  }

  var renderingAttr = thumbnail ? 'thumbnailRendering' : 'imageRendering';

  if (!instance[renderingAttr] || instance[renderingAttr] === 'wadouri' || !instance.wadorsuri) {
    var imageId = 'dicomweb:' + instance.wadouri;

    if (frame !== undefined) {
      imageId += '&frame=' + frame;
    }

    return imageId;
  } else {
    return getWADORSImageId(instance, frame, thumbnail); // WADO-RS Retrieve Frame
  }
}

var stackMap = {};
var configuration = {};
var stackManagerMetaDataProvider;
var stackUpdatedCallbacks = [];
/**
 * Loop through the current series and add metadata to the
 * Cornerstone meta data provider. This will be used to fill information
 * into the viewport overlays, and to calculate reference lines and orientation markers
 * @param  {Object} stackMap              stackMap object
 * @param  {Object} study                 Study object
 * @param  {Object} displaySet            The set of images to make the stack from
 * @return {Array}                        Array with image IDs
 */

function createAndAddStack(stackMap, study, displaySet, stackUpdatedCallbacks, metadataProvider) {
  var numImages = displaySet.images.length;
  var imageIds = [];
  var imageId;
  displaySet.images.forEach(function (instance, imageIndex) {
    var image = instance.getData();
    var metaData = {
      instance: image,
      // in this context, instance will be the data of the InstanceMetadata object...
      series: displaySet,
      // TODO: Check this
      study: study,
      numImages: numImages,
      imageIndex: imageIndex + 1
    };
    var numberOfFrames = image.numberOfFrames;

    if (numberOfFrames > 1) {
      OHIF.log.info('Multiframe image detected');

      for (var i = 0; i < numberOfFrames; i++) {
        metaData.frameNumber = i;
        imageId = getImageId(image, i);
        imageIds.push(imageId);
        metadataProvider.addMetadata(imageId, metaData);
      }
    } else {
      metaData.frameNumber = 1;
      imageId = getImageId(image);
      imageIds.push(imageId);
      metadataProvider.addMetadata(imageId, metaData);
    }
  });
  var stack = {
    displaySetInstanceUid: displaySet.displaySetInstanceUid,
    imageIds: imageIds,
    frameRate: displaySet.frameRate,
    isClip: displaySet.isClip
  };
  stackMap[displaySet.displaySetInstanceUid] = stack;
  return stack;
}

configuration = {
  createAndAddStack: createAndAddStack
};
/**
 * This object contains all the functions needed for interacting with the stack manager.
 * Generally, findStack is the only function used. If you want to know when new stacks
 * come in, you can register a callback with addStackUpdatedCallback.
 */

var StackManager = {
  setMetadataProvider: function setMetadataProvider(provider) {
    stackManagerMetaDataProvider = provider;
  },

  /**
   * Removes all current stacks
   */
  clearStacks: function clearStacks() {
    stackMap = {};
  },

  /**
   * Create a stack from an image set, as well as add in the metadata on a per image bases.
   * @param study The study who's metadata will be added
   * @param displaySet The set of images to make the stack from
   * @return {Array} Array with image IDs
   */
  makeAndAddStack: function makeAndAddStack(study, displaySet) {
    if (!stackManagerMetaDataProvider) {
      throw new Error('Please call StackManager.setMetadataProvider(provider) first.');
    }

    return configuration.createAndAddStack(stackMap, study, displaySet, stackUpdatedCallbacks, stackManagerMetaDataProvider);
  },

  /**
   * Find a stack from the currently created stacks.
   * @param displaySetInstanceUid The UID of the stack to find.
   * @returns {*} undefined if not found, otherwise the stack object is returned.
   */
  findStack: function findStack(displaySetInstanceUid) {
    return stackMap[displaySetInstanceUid];
  },

  /**
   * Find a stack or reate one if it has not been created yet
   * @param study The study who's metadata will be added
   * @param displaySet The set of images to make the stack from
   * @return {Array} Array with image IDs
   */
  findOrCreateStack: function findOrCreateStack(study, displaySet) {
    var stack = this.findStack(displaySet.displaySetInstanceUid);

    if (!stack || !stack.imageIds) {
      stack = this.makeAndAddStack(study, displaySet);
    }

    return stack;
  },

  /**
   * Gets the underlying map of displaySetInstanceUid to stack object.
   * WARNING: Do not change this object. It directly affects the manager.
   * @returns {{}} map of displaySetInstanceUid -> stack.
   */
  getAllStacks: function getAllStacks() {
    return stackMap;
  },

  /**
   * Adds in a callback to be called on a stack being added / updated.
   * @param callback must accept at minimum one argument,
   * which is the stack that was added / updated.
   */
  addStackUpdatedCallback: function addStackUpdatedCallback(callback) {
    if (typeof callback !== 'function') {
      throw new OHIFError('callback must be provided as a function');
    }

    stackUpdatedCallbacks.push(callback);
  },

  /**
   * Return configuration
   */
  getConfiguration: function getConfiguration() {
    return configuration;
  },

  /**
   * Set configuration, in order to provide compatibility
   * with other systems by overriding this functions
   * @param {Object} config object with functions to be overrided
   *
   * For now, only makeAndAddStack can be overrided
   */
  setConfiguration: function setConfiguration(config) {
    configuration = config;
  }
};

// TODO: Deprecate since we have the same thing in dcmjs?
var sopClassDictionary = {
  ComputedRadiographyImageStorage: '1.2.840.10008.5.1.4.1.1.1',
  DigitalXRayImageStorageForPresentation: '1.2.840.10008.5.1.4.1.1.1.1',
  DigitalXRayImageStorageForProcessing: '1.2.840.10008.5.1.4.1.1.1.1.1',
  DigitalMammographyXRayImageStorageForPresentation: '1.2.840.10008.5.1.4.1.1.1.2',
  DigitalMammographyXRayImageStorageForProcessing: '1.2.840.10008.5.1.4.1.1.1.2.1',
  DigitalIntraOralXRayImageStorageForPresentation: '1.2.840.10008.5.1.4.1.1.1.3',
  DigitalIntraOralXRayImageStorageForProcessing: '1.2.840.10008.5.1.4.1.1.1.3.1',
  CTImageStorage: '1.2.840.10008.5.1.4.1.1.2',
  EnhancedCTImageStorage: '1.2.840.10008.5.1.4.1.1.2.1',
  LegacyConvertedEnhancedCTImageStorage: '1.2.840.10008.5.1.4.1.1.2.2',
  UltrasoundMultiframeImageStorage: '1.2.840.10008.5.1.4.1.1.3.1',
  MRImageStorage: '1.2.840.10008.5.1.4.1.1.4',
  EnhancedMRImageStorage: '1.2.840.10008.5.1.4.1.1.4.1',
  MRSpectroscopyStorage: '1.2.840.10008.5.1.4.1.1.4.2',
  EnhancedMRColorImageStorage: '1.2.840.10008.5.1.4.1.1.4.3',
  LegacyConvertedEnhancedMRImageStorage: '1.2.840.10008.5.1.4.1.1.4.4',
  UltrasoundImageStorage: '1.2.840.10008.5.1.4.1.1.6.1',
  EnhancedUSVolumeStorage: '1.2.840.10008.5.1.4.1.1.6.2',
  SecondaryCaptureImageStorage: '1.2.840.10008.5.1.4.1.1.7',
  MultiframeSingleBitSecondaryCaptureImageStorage: '1.2.840.10008.5.1.4.1.1.7.1',
  MultiframeGrayscaleByteSecondaryCaptureImageStorage: '1.2.840.10008.5.1.4.1.1.7.2',
  MultiframeGrayscaleWordSecondaryCaptureImageStorage: '1.2.840.10008.5.1.4.1.1.7.3',
  MultiframeTrueColorSecondaryCaptureImageStorage: '1.2.840.10008.5.1.4.1.1.7.4',
  Sop12LeadECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.1',
  GeneralECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.2',
  AmbulatoryECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.3',
  HemodynamicWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.2.1',
  CardiacElectrophysiologyWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.3.1',
  BasicVoiceAudioWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.4.1',
  GeneralAudioWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.4.2',
  ArterialPulseWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.5.1',
  RespiratoryWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.6.1',
  GrayscaleSoftcopyPresentationStateStorage: '1.2.840.10008.5.1.4.1.1.11.1',
  ColorSoftcopyPresentationStateStorage: '1.2.840.10008.5.1.4.1.1.11.2',
  PseudoColorSoftcopyPresentationStateStorage: '1.2.840.10008.5.1.4.1.1.11.3',
  BlendingSoftcopyPresentationStateStorage: '1.2.840.10008.5.1.4.1.1.11.4',
  XAXRFGrayscaleSoftcopyPresentationStateStorage: '1.2.840.10008.5.1.4.1.1.11.5',
  XRayAngiographicImageStorage: '1.2.840.10008.5.1.4.1.1.12.1',
  EnhancedXAImageStorage: '1.2.840.10008.5.1.4.1.1.12.1.1',
  XRayRadiofluoroscopicImageStorage: '1.2.840.10008.5.1.4.1.1.12.2',
  EnhancedXRFImageStorage: '1.2.840.10008.5.1.4.1.1.12.2.1',
  XRay3DAngiographicImageStorage: '1.2.840.10008.5.1.4.1.1.13.1.1',
  XRay3DCraniofacialImageStorage: '1.2.840.10008.5.1.4.1.1.13.1.2',
  BreastTomosynthesisImageStorage: '1.2.840.10008.5.1.4.1.1.13.1.3',
  BreastProjectionXRayImageStorageForPresentation: '1.2.840.10008.5.1.4.1.1.13.1.4',
  BreastProjectionXRayImageStorageForProcessing: '1.2.840.10008.5.1.4.1.1.13.1.5',
  IntravascularOpticalCoherenceTomographyImageStorageForPresentation: '1.2.840.10008.5.1.4.1.1.14.1',
  IntravascularOpticalCoherenceTomographyImageStorageForProcessing: '1.2.840.10008.5.1.4.1.1.14.2',
  NuclearMedicineImageStorage: '1.2.840.10008.5.1.4.1.1.20',
  RawDataStorage: '1.2.840.10008.5.1.4.1.1.66',
  SpatialRegistrationStorage: '1.2.840.10008.5.1.4.1.1.66.1',
  SpatialFiducialsStorage: '1.2.840.10008.5.1.4.1.1.66.2',
  DeformableSpatialRegistrationStorage: '1.2.840.10008.5.1.4.1.1.66.3',
  SegmentationStorage: '1.2.840.10008.5.1.4.1.1.66.4',
  SurfaceSegmentationStorage: '1.2.840.10008.5.1.4.1.1.66.5',
  RealWorldValueMappingStorage: '1.2.840.10008.5.1.4.1.1.67',
  SurfaceScanMeshStorage: '1.2.840.10008.5.1.4.1.1.68.1',
  SurfaceScanPointCloudStorage: '1.2.840.10008.5.1.4.1.1.68.2',
  VLEndoscopicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.1',
  VideoEndoscopicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.1.1',
  VLMicroscopicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.2',
  VideoMicroscopicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.2.1',
  VLSlideCoordinatesMicroscopicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.3',
  VLPhotographicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.4',
  VideoPhotographicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.4.1',
  OphthalmicPhotography8BitImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.5.1',
  OphthalmicPhotography16BitImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.5.2',
  StereometricRelationshipStorage: '1.2.840.10008.5.1.4.1.1.77.1.5.3',
  OphthalmicTomographyImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.5.4',
  VLWholeSlideMicroscopyImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.6',
  LensometryMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.1',
  AutorefractionMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.2',
  KeratometryMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.3',
  SubjectiveRefractionMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.4',
  VisualAcuityMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.5',
  SpectaclePrescriptionReportStorage: '1.2.840.10008.5.1.4.1.1.78.6',
  OphthalmicAxialMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.7',
  IntraocularLensCalculationsStorage: '1.2.840.10008.5.1.4.1.1.78.8',
  MacularGridThicknessandVolumeReport: '1.2.840.10008.5.1.4.1.1.79.1',
  OphthalmicVisualFieldStaticPerimetryMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.80.1',
  OphthalmicThicknessMapStorage: '1.2.840.10008.5.1.4.1.1.81.1',
  CornealTopographyMapStorage: '1.2.840.10008.5.1.4.1.1.82.1',
  BasicTextSR: '1.2.840.10008.5.1.4.1.1.88.11',
  EnhancedSR: '1.2.840.10008.5.1.4.1.1.88.22',
  ComprehensiveSR: '1.2.840.10008.5.1.4.1.1.88.33',
  Comprehensive3DSR: '1.2.840.10008.5.1.4.1.1.88.34',
  ProcedureLog: '1.2.840.10008.5.1.4.1.1.88.40',
  MammographyCADSR: '1.2.840.10008.5.1.4.1.1.88.50',
  KeyObjectSelection: '1.2.840.10008.5.1.4.1.1.88.59',
  ChestCADSR: '1.2.840.10008.5.1.4.1.1.88.65',
  XRayRadiationDoseSR: '1.2.840.10008.5.1.4.1.1.88.67',
  RadiopharmaceuticalRadiationDoseSR: '1.2.840.10008.5.1.4.1.1.88.68',
  ColonCADSR: '1.2.840.10008.5.1.4.1.1.88.69',
  ImplantationPlanSRDocumentStorage: '1.2.840.10008.5.1.4.1.1.88.70',
  EncapsulatedPDFStorage: '1.2.840.10008.5.1.4.1.1.104.1',
  EncapsulatedCDAStorage: '1.2.840.10008.5.1.4.1.1.104.2',
  PositronEmissionTomographyImageStorage: '1.2.840.10008.5.1.4.1.1.128',
  EnhancedPETImageStorage: '1.2.840.10008.5.1.4.1.1.130',
  LegacyConvertedEnhancedPETImageStorage: '1.2.840.10008.5.1.4.1.1.128.1',
  BasicStructuredDisplayStorage: '1.2.840.10008.5.1.4.1.1.131',
  RTImageStorage: '1.2.840.10008.5.1.4.1.1.481.1',
  RTDoseStorage: '1.2.840.10008.5.1.4.1.1.481.2',
  RTStructureSetStorage: '1.2.840.10008.5.1.4.1.1.481.3',
  RTBeamsTreatmentRecordStorage: '1.2.840.10008.5.1.4.1.1.481.4',
  RTPlanStorage: '1.2.840.10008.5.1.4.1.1.481.5',
  RTBrachyTreatmentRecordStorage: '1.2.840.10008.5.1.4.1.1.481.6',
  RTTreatmentSummaryRecordStorage: '1.2.840.10008.5.1.4.1.1.481.7',
  RTIonPlanStorage: '1.2.840.10008.5.1.4.1.1.481.8',
  RTIonBeamsTreatmentRecordStorage: '1.2.840.10008.5.1.4.1.1.481.9',
  RTBeamsDeliveryInstructionStorage: '1.2.840.10008.5.1.4.34.7',
  GenericImplantTemplateStorage: '1.2.840.10008.5.1.4.43.1',
  ImplantAssemblyTemplateStorage: '1.2.840.10008.5.1.4.44.1',
  ImplantTemplateGroupStorage: '1.2.840.10008.5.1.4.45.1'
};

/**
 * Checks whether dicom files with specified SOP Class UID have image data
 * @param {string} sopClassUid - SOP Class UID to be checked
 * @returns {boolean} - true if it has image data
 */

function isImage(sopClassUid) {
  if (sopClassUid === sopClassDictionary.ComputedRadiographyImageStorage || sopClassUid === sopClassDictionary.DigitalXRayImageStorageForPresentation || sopClassUid === sopClassDictionary.DigitalXRayImageStorageForProcessing || sopClassUid === sopClassDictionary.DigitalMammographyXRayImageStorageForPresentation || sopClassUid === sopClassDictionary.DigitalMammographyXRayImageStorageForProcessing || sopClassUid === sopClassDictionary.DigitalIntraOralXRayImageStorageForPresentation || sopClassUid === sopClassDictionary.DigitalIntraOralXRayImageStorageForProcessing || sopClassUid === sopClassDictionary.CTImageStorage || sopClassUid === sopClassDictionary.EnhancedCTImageStorage || sopClassUid === sopClassDictionary.LegacyConvertedEnhancedCTImageStorage || sopClassUid === sopClassDictionary.UltrasoundMultiframeImageStorage || sopClassUid === sopClassDictionary.MRImageStorage || sopClassUid === sopClassDictionary.EnhancedMRImageStorage || sopClassUid === sopClassDictionary.EnhancedMRColorImageStorage || sopClassUid === sopClassDictionary.LegacyConvertedEnhancedMRImageStorage || sopClassUid === sopClassDictionary.UltrasoundImageStorage || sopClassUid === sopClassDictionary.SecondaryCaptureImageStorage || sopClassUid === sopClassDictionary.MultiframeSingleBitSecondaryCaptureImageStorage || sopClassUid === sopClassDictionary.MultiframeGrayscaleByteSecondaryCaptureImageStorage || sopClassUid === sopClassDictionary.MultiframeGrayscaleWordSecondaryCaptureImageStorage || sopClassUid === sopClassDictionary.MultiframeTrueColorSecondaryCaptureImageStorage || sopClassUid === sopClassDictionary.XRayAngiographicImageStorage || sopClassUid === sopClassDictionary.EnhancedXAImageStorage || sopClassUid === sopClassDictionary.XRayRadiofluoroscopicImageStorage || sopClassUid === sopClassDictionary.EnhancedXRFImageStorage || sopClassUid === sopClassDictionary.XRay3DAngiographicImageStorage || sopClassUid === sopClassDictionary.XRay3DCraniofacialImageStorage || sopClassUid === sopClassDictionary.BreastTomosynthesisImageStorage || sopClassUid === sopClassDictionary.BreastProjectionXRayImageStorageForPresentation || sopClassUid === sopClassDictionary.BreastProjectionXRayImageStorageForProcessing || sopClassUid === sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForPresentation || sopClassUid === sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForProcessing || sopClassUid === sopClassDictionary.NuclearMedicineImageStorage || sopClassUid === sopClassDictionary.VLEndoscopicImageStorage || sopClassUid === sopClassDictionary.VideoEndoscopicImageStorage || sopClassUid === sopClassDictionary.VLMicroscopicImageStorage || sopClassUid === sopClassDictionary.VideoMicroscopicImageStorage || sopClassUid === sopClassDictionary.VLSlideCoordinatesMicroscopicImageStorage || sopClassUid === sopClassDictionary.VLPhotographicImageStorage || sopClassUid === sopClassDictionary.VideoPhotographicImageStorage || sopClassUid === sopClassDictionary.OphthalmicPhotography8BitImageStorage || sopClassUid === sopClassDictionary.OphthalmicPhotography16BitImageStorage || sopClassUid === sopClassDictionary.OphthalmicTomographyImageStorage || sopClassUid === sopClassDictionary.VLWholeSlideMicroscopyImageStorage || sopClassUid === sopClassDictionary.PositronEmissionTomographyImageStorage || sopClassUid === sopClassDictionary.EnhancedPETImageStorage || sopClassUid === sopClassDictionary.LegacyConvertedEnhancedPETImageStorage || sopClassUid === sopClassDictionary.RTImageStorage) {
    return true;
  }

  return false;
}

var isMultiFrame = function isMultiFrame(instance) {
  // NumberOfFrames (0028,0008)
  return instance.getRawValue('x00280008') > 1;
};

var makeDisplaySet = function makeDisplaySet(series, instances) {
  var instance = instances[0];
  var imageSet = new ImageSet(instances);
  var seriesData = series.getData(); // set appropriate attributes to image set...

  imageSet.setAttributes({
    displaySetInstanceUid: imageSet.uid,
    // create a local alias for the imageSet UID
    seriesDate: seriesData.seriesDate,
    seriesTime: seriesData.seriesTime,
    seriesInstanceUid: series.getSeriesInstanceUID(),
    seriesNumber: instance.getRawValue('x00200011'),
    seriesDescription: instance.getRawValue('x0008103e'),
    numImageFrames: instances.length,
    frameRate: instance.getRawValue('x00181063'),
    modality: instance.getRawValue('x00080060'),
    isMultiFrame: isMultiFrame(instance)
  }); // Sort the images in this series if needed

  {
    imageSet.sortBy(function (a, b) {
      // Sort by InstanceNumber (0020,0013)
      return (parseInt(a.getRawValue('x00200013', 0)) || 0) - (parseInt(b.getRawValue('x00200013', 0)) || 0);
    });
  } // Include the first image instance number (after sorted)


  imageSet.setAttribute('instanceNumber', imageSet.getImage(0).getRawValue('x00200013'));
  return imageSet;
};

var isSingleImageModality = function isSingleImageModality(modality) {
  return modality === 'CR' || modality === 'MG' || modality === 'DX';
};
/**
 * Creates a set of series to be placed in the Study Metadata
 * The series that appear in the Study Metadata must represent
 * imaging modalities.
 *
 * Furthermore, for drag/drop functionality,
 * it is easiest if the stack objects also contain information about
 * which study they are linked to.
 *
 * @param study The study instance metadata to be used
 * @returns {Array} An array of series to be placed in the Study Metadata
 */


function createStacks(study) {
  // Define an empty array of display sets
  var displaySets = [];

  if (!study || !study.getSeriesCount()) {
    return displaySets;
  } // Loop through the series (SeriesMetadata)


  study.forEachSeries(function (series) {
    // If the series has no instances, skip it
    if (!series.getInstanceCount()) {
      return;
    } // Search through the instances (InstanceMedatada object) of this series
    // Split Multi-frame instances and Single-image modalities
    // into their own specific display sets. Place the rest of each
    // series into another display set.


    var stackableInstances = [];
    series.forEachInstance(function (instance) {
      // All imaging modalities must have a valid value for sopClassUid (x00080016) or rows (x00280010)
      if (!isImage(instance.getRawValue('x00080016')) && !instance.getRawValue('x00280010')) {
        return;
      }

      var displaySet;

      if (isMultiFrame(instance)) {
        displaySet = makeDisplaySet(series, [instance]);
        displaySet.setAttributes({
          isClip: true,
          studyInstanceUid: study.getStudyInstanceUID(),
          // Include the study instance Uid for drag/drop purposes
          numImageFrames: instance.getRawValue('x00280008'),
          // Override the default value of instances.length
          instanceNumber: instance.getRawValue('x00200013'),
          // Include the instance number
          acquisitionDatetime: instance.getRawValue('x0008002a') // Include the acquisition datetime

        });
        displaySets.push(displaySet);
      } else if (isSingleImageModality(instance.modality)) {
        displaySet = makeDisplaySet(series, [instance]);
        displaySet.setAttributes({
          studyInstanceUid: study.getStudyInstanceUID(),
          // Include the study instance Uid
          instanceNumber: instance.getRawValue('x00200013'),
          // Include the instance number
          acquisitionDatetime: instance.getRawValue('x0008002a') // Include the acquisition datetime

        });
        displaySets.push(displaySet);
      } else {
        stackableInstances.push(instance);
      }
    });

    if (stackableInstances.length) {
      var displaySet = makeDisplaySet(series, stackableInstances);
      displaySet.setAttribute('studyInstanceUid', study.getStudyInstanceUID());
      displaySets.push(displaySet);
    }
  });
  return displaySets;
}

var OHIFInstanceMetadata =
/*#__PURE__*/
function (_InstanceMetadata) {
  _inherits(OHIFInstanceMetadata, _InstanceMetadata);

  /**
   * @param {Object} Instance object.
   */
  function OHIFInstanceMetadata(data, series, study, uid) {
    var _this;

    _classCallCheck(this, OHIFInstanceMetadata);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(OHIFInstanceMetadata).call(this, data, uid));

    _this.init(series, study);

    return _this;
  }

  _createClass(OHIFInstanceMetadata, [{
    key: "init",
    value: function init(series, study) {
      var instance = this.getData(); // Initialize Private Properties

      Object.defineProperties(this, {
        _sopInstanceUID: {
          configurable: false,
          enumerable: false,
          writable: false,
          value: instance.sopInstanceUid
        },
        _study: {
          configurable: false,
          enumerable: false,
          writable: false,
          value: study
        },
        _series: {
          configurable: false,
          enumerable: false,
          writable: false,
          value: series
        },
        _instance: {
          configurable: false,
          enumerable: false,
          writable: false,
          value: instance
        },
        _cache: {
          configurable: false,
          enumerable: false,
          writable: false,
          value: Object.create(null)
        }
      });
    } // Override

  }, {
    key: "getTagValue",
    value: function getTagValue(tagOrProperty, defaultValue, bypassCache) {
      // check if this property has been cached...
      if (tagOrProperty in this._cache && bypassCache !== true) {
        return this._cache[tagOrProperty];
      }

      var propertyName = OHIFInstanceMetadata.getPropertyName(tagOrProperty); // Search property value in the whole study metadata chain...

      var rawValue;

      if (propertyName in this._instance) {
        rawValue = this._instance[propertyName];
      } else if (propertyName in this._series) {
        rawValue = this._series[propertyName];
      } else if (propertyName in this._study) {
        rawValue = this._study[propertyName];
      }

      if (rawValue !== void 0) {
        // if rawValue value is not undefined, cache result...
        this._cache[tagOrProperty] = rawValue;
        return rawValue;
      }

      return defaultValue;
    } // Override

  }, {
    key: "tagExists",
    value: function tagExists(tagOrProperty) {
      var propertyName = OHIFInstanceMetadata.getPropertyName(tagOrProperty);
      return propertyName in this._instance || propertyName in this._series || propertyName in this._study;
    } // Override

  }, {
    key: "getImageId",
    value: function getImageId$$1(frame, thumbnail) {
      // If _imageID is not cached, create it
      if (this._imageId === null) {
        this._imageId = getImageId(this.getData(), frame, thumbnail);
      }

      return this._imageId;
    }
    /**
     * Static methods
     */
    // @TODO: The current mapping of standard DICOM property names to local property names is not optimal.
    // The inconsistency in property naming makes this function increasingly complex.
    // A possible solution to improve this would be adapt retriveMetadata names to use DICOM standard names as in dicomTagDescriptions.js

  }], [{
    key: "getPropertyName",
    value: function getPropertyName(tagOrProperty) {
      var propertyName;
      var tagInfo = DICOMTagDescriptions.find(tagOrProperty);

      if (tagInfo !== void 0) {
        // This function tries to translate standard DICOM property names into local naming convention.
        propertyName = tagInfo.keyword.replace(/^SOP/, 'sop').replace(/UID$/, 'Uid').replace(/ID$/, 'Id');
        propertyName = propertyName.charAt(0).toLowerCase() + propertyName.substr(1);
      }

      return propertyName;
    }
  }]);

  return OHIFInstanceMetadata;
}(InstanceMetadata);

var OHIFSeriesMetadata =
/*#__PURE__*/
function (_SeriesMetadata) {
  _inherits(OHIFSeriesMetadata, _SeriesMetadata);

  /**
   * @param {Object} Series object.
   */
  function OHIFSeriesMetadata(data, study, uid) {
    var _this;

    _classCallCheck(this, OHIFSeriesMetadata);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(OHIFSeriesMetadata).call(this, data, uid));

    _this.init(study);

    return _this;
  }

  _createClass(OHIFSeriesMetadata, [{
    key: "init",
    value: function init(study) {
      var _this2 = this;

      var series = this.getData(); // define "_seriesInstanceUID" protected property...

      Object.defineProperty(this, '_seriesInstanceUID', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: series.seriesInstanceUid
      }); // populate internal list of instances...

      series.instances.forEach(function (instance) {
        _this2.addInstance(new OHIFInstanceMetadata(instance, series, study));
      });
    }
  }]);

  return OHIFSeriesMetadata;
}(SeriesMetadata);

var OHIFStudyMetadata =
/*#__PURE__*/
function (_StudyMetadata) {
  _inherits(OHIFStudyMetadata, _StudyMetadata);

  /**
   * @param {Object} Study object.
   */
  function OHIFStudyMetadata(data, uid) {
    var _this;

    _classCallCheck(this, OHIFStudyMetadata);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(OHIFStudyMetadata).call(this, data, uid));

    _this.init();

    return _this;
  }

  _createClass(OHIFStudyMetadata, [{
    key: "init",
    value: function init() {
      var _this2 = this;

      var study = this.getData(); // define "_studyInstanceUID" protected property

      Object.defineProperty(this, '_studyInstanceUID', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: study.studyInstanceUid
      }); // populate internal list of series

      study.seriesList.forEach(function (series) {
        _this2.addSeries(new OHIFSeriesMetadata(series, study));
      });
    }
  }]);

  return OHIFStudyMetadata;
}(StudyMetadata);

var getDisplaySets = function getDisplaySets(studyMetadata, seriesNumber, iteratorFunction) {
  var iteratorFn = typeof iteratorFunction !== 'function' ? createStacks : iteratorFunction;
  return iteratorFn(studyMetadata, seriesNumber);
};

var sortingManager = {
  getDisplaySets: getDisplaySets
};

function createDisplaySets(studies) {
  // Define the OHIF.viewer.data global object
  // TODO: Save all data that is currently in OHIF.viewer in redux instead
  //OHIF.viewer.data = OHIF.viewer.data || {};
  // @TypeSafeStudies
  // Clears OHIF.viewer.Studies collection
  //OHIF.viewer.Studies.removeAll();
  // @TypeSafeStudies
  // Clears OHIF.viewer.StudyMetadataList collection
  //OHIF.viewer.StudyMetadataList.removeAll();
  //OHIF.viewer.data.studyInstanceUids = [];
  var updatedStudies = studies.map(function (study) {
    var studyMetadata = new OHIFStudyMetadata(study, study.studyInstanceUid);
    var displaySets = study.displaySets;

    if (!study.displaySets) {
      displaySets = sortingManager.getDisplaySets(studyMetadata);
      study.displaySets = displaySets;
    }

    studyMetadata.setDisplaySets(displaySets);
    study.selected = true; //OHIF.viewer.Studies.insert(study);
    //OHIF.viewer.StudyMetadataList.insert(studyMetadata);
    //OHIF.viewer.data.studyInstanceUids.push(study.studyInstanceUid);
    // Updates WADO-RS metaDataManager

    updateMetaDataManager(study);
    return study;
  });
  return updatedStudies;
}

var utils = {
  guid: guid,
  ObjectPath: ObjectPath,
  absoluteUrl: absoluteUrl,
  addServers: addServers,
  sortBy: sortBy,
  writeScript: writeScript,
  StackManager: StackManager,
  createStacks: createStacks,
  createDisplaySets: createDisplaySets
};

var metadata = {
  Metadata: Metadata,
  WadoRsMetaDataBuilder: WadoRsMetaDataBuilder,
  StudyMetadata: StudyMetadata,
  SeriesMetadata: SeriesMetadata,
  InstanceMetadata: InstanceMetadata,
  OHIFStudyMetadata: OHIFStudyMetadata,
  OHIFSeriesMetadata: OHIFSeriesMetadata,
  OHIFInstanceMetadata: OHIFInstanceMetadata
};

var FUNCTION$2 = 'function';

var MetadataProvider =
/*#__PURE__*/
function () {
  function MetadataProvider() {
    _classCallCheck(this, MetadataProvider);

    // Define the main "metadataLookup" private property as an immutable property.
    Object.defineProperty(this, 'metadataLookup', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: new Map()
    }); // Local reference to provider function bound to current instance.

    Object.defineProperty(this, '_provider', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: null
    });
  }
  /**
   * Cornerstone Metadata provider to store image meta data
   * Data from instances, series, and studies are associated with
   * imageIds to facilitate usage of this information by Cornerstone's Tools
   *
   * e.g. the imagePlane metadata object contains instance information about
   * row/column pixel spacing, patient position, and patient orientation. It
   * is used in CornerstoneTools to position reference lines and orientation markers.
   *
   * @param {String} imageId The Cornerstone ImageId
   * @param {Object} data An object containing instance, series, and study metadata
   */


  _createClass(MetadataProvider, [{
    key: "addMetadata",
    value: function addMetadata(imageId, data) {
      var instanceMetadata = data.instance;
      var seriesMetadata = data.series;
      var studyMetadata = data.study;
      var numImages = data.numImages;
      var metadata = {};
      metadata.frameNumber = data.frameNumber;
      metadata.study = {
        accessionNumber: studyMetadata.accessionNumber,
        patientId: studyMetadata.patientId,
        studyInstanceUid: studyMetadata.studyInstanceUid,
        studyDate: studyMetadata.studyDate,
        studyTime: studyMetadata.studyTime,
        studyDescription: studyMetadata.studyDescription,
        institutionName: studyMetadata.institutionName,
        patientHistory: studyMetadata.patientHistory
      };
      metadata.series = {
        seriesDescription: seriesMetadata.seriesDescription,
        seriesNumber: seriesMetadata.seriesNumber,
        seriesDate: seriesMetadata.seriesDate,
        seriesTime: seriesMetadata.seriesTime,
        modality: seriesMetadata.modality,
        seriesInstanceUid: seriesMetadata.seriesInstanceUid,
        numImages: numImages
      };
      metadata.instance = instanceMetadata;
      metadata.patient = {
        name: studyMetadata.patientName,
        id: studyMetadata.patientId,
        birthDate: studyMetadata.patientBirthDate,
        sex: studyMetadata.patientSex,
        age: studyMetadata.patientAge
      }; // If there is sufficient information, populate
      // the imagePlane object for easier use in the Viewer

      metadata.imagePlane = this.getImagePlane(instanceMetadata); // Add the metadata to the imageId lookup object

      this.metadataLookup.set(imageId, metadata);
    }
    /**
     * Return the metadata for the given imageId
     * @param {String} imageId The Cornerstone ImageId
     * @returns image metadata
     */

  }, {
    key: "getMetadata",
    value: function getMetadata(imageId) {
      return this.metadataLookup.get(imageId);
    }
    /**
     * Adds a set of metadata to the Cornerstone metadata provider given a specific
     * imageId, type, and dataset
     *
     * @param imageId
     * @param type (e.g. series, instance, tagDisplay)
     * @param data
     */

  }, {
    key: "addSpecificMetadata",
    value: function addSpecificMetadata(imageId, type, data) {
      var metadata = {};
      metadata[type] = data;
      var oldMetadata = this.metadataLookup.get(imageId);
      this.metadataLookup.set(imageId, Object.assign(oldMetadata, metadata));
    }
  }, {
    key: "getFromImage",
    value: function getFromImage(image, type, tag, attrName, defaultValue) {
      var value;

      if (image.data) {
        value = this.getFromDataSet(image.data, type, tag);
      } else {
        value = image.instance[attrName];
      }

      return value === null ? defaultValue : value;
    }
  }, {
    key: "getFromDataSet",
    value: function getFromDataSet(dataSet, type, tag) {
      if (!dataSet) {
        return;
      }

      var fn = dataSet[type];

      if (!fn) {
        return;
      }

      return fn.call(dataSet, tag);
    }
  }, {
    key: "getFrameIncrementPointer",
    value: function getFrameIncrementPointer(image) {
      var dataSet = image.data;
      var frameInstancePointer = '';

      if (parsingUtils.isValidDataSet(dataSet)) {
        var frameInstancePointerNames = {
          x00181063: 'frameTime',
          x00181065: 'frameTimeVector'
        }; // (0028,0009) = Frame Increment Pointer

        var frameInstancePointerTag = parsingUtils.attributeTag(dataSet, 'x00280009');
        frameInstancePointer = frameInstancePointerNames[frameInstancePointerTag];
      } else {
        frameInstancePointer = image.instance.frameIncrementPointer;
      }

      return frameInstancePointer || '';
    }
  }, {
    key: "getFrameTimeVector",
    value: function getFrameTimeVector(image) {
      var dataSet = image.data;

      if (parsingUtils.isValidDataSet(dataSet)) {
        // Frame Increment Pointer points to Frame Time Vector (0018,1065) field
        return parsingUtils.floatArray(dataSet, 'x00181065');
      }

      return image.instance.frameTimeVector;
    }
  }, {
    key: "getFrameTime",
    value: function getFrameTime(image) {
      var dataSet = image.data;

      if (parsingUtils.isValidDataSet(dataSet)) {
        // Frame Increment Pointer points to Frame Time (0018,1063) field or is not defined (for addtional flexibility).
        // Yet another value is possible for this field (5200,9230 for Multi-frame Functional Groups)
        // but that case is currently not supported.
        return dataSet.floatString('x00181063', -1);
      }

      return image.instance.frameTime;
    }
    /**
     * Updates the related metadata for missing fields given a specified image
     *
     * @param image
     */

  }, {
    key: "updateMetadata",
    value: function updateMetadata(image) {
      var imageMetadata = this.metadataLookup.get(image.imageId);

      if (!imageMetadata) {
        return;
      }

      imageMetadata.patient.age = imageMetadata.patient.age || this.getFromDataSet(image.data, 'string', 'x00101010');
      imageMetadata.instance.rows = imageMetadata.instance.rows || image.rows;
      imageMetadata.instance.columns = imageMetadata.instance.columns || image.columns;
      imageMetadata.instance.sopClassUid = imageMetadata.instance.sopClassUid || this.getFromDataSet(image.data, 'string', 'x00080016');
      imageMetadata.instance.sopInstanceUid = imageMetadata.instance.sopInstanceUid || this.getFromDataSet(image.data, 'string', 'x00080018');
      imageMetadata.instance.pixelSpacing = imageMetadata.instance.pixelSpacing || this.getFromDataSet(image.data, 'string', 'x00280030');
      imageMetadata.instance.frameOfReferenceUID = imageMetadata.instance.frameOfReferenceUID || this.getFromDataSet(image.data, 'string', 'x00200052');
      imageMetadata.instance.imageOrientationPatient = imageMetadata.instance.imageOrientationPatient || this.getFromDataSet(image.data, 'string', 'x00200037');
      imageMetadata.instance.imagePositionPatient = imageMetadata.instance.imagePositionPatient || this.getFromDataSet(image.data, 'string', 'x00200032');
      imageMetadata.instance.sliceThickness = imageMetadata.instance.sliceThickness || this.getFromDataSet(image.data, 'string', 'x00180050');
      imageMetadata.instance.sliceLocation = imageMetadata.instance.sliceLocation || this.getFromDataSet(image.data, 'string', 'x00201041');
      imageMetadata.instance.tablePosition = imageMetadata.instance.tablePosition || this.getFromDataSet(image.data, 'string', 'x00189327');
      imageMetadata.instance.spacingBetweenSlices = imageMetadata.instance.spacingBetweenSlices || this.getFromDataSet(image.data, 'string', 'x00180088');
      imageMetadata.instance.lossyImageCompression = imageMetadata.instance.lossyImageCompression || this.getFromDataSet(image.data, 'string', 'x00282110');
      imageMetadata.instance.lossyImageCompressionRatio = imageMetadata.instance.lossyImageCompressionRatio || this.getFromDataSet(image.data, 'string', 'x00282112');
      imageMetadata.instance.frameIncrementPointer = imageMetadata.instance.frameIncrementPointer || this.getFromDataSet(image.data, 'string', 'x00280009');
      imageMetadata.instance.frameTime = imageMetadata.instance.frameTime || this.getFromDataSet(image.data, 'string', 'x00181063');
      imageMetadata.instance.frameTimeVector = imageMetadata.instance.frameTimeVector || this.getFromDataSet(image.data, 'string', 'x00181065');

      if ((image.data || image.instance) && !imageMetadata.instance.multiframeMetadata) {
        imageMetadata.instance.multiframeMetadata = this.getMultiframeModuleMetadata(image);
      }

      imageMetadata.imagePlane = imageMetadata.imagePlane || this.getImagePlane(imageMetadata.instance);
    }
    /**
     * Constructs and returns the imagePlane given the metadata instance
     *
     * @param metadataInstance The metadata instance (InstanceMetadata class) containing information to construct imagePlane
     * @returns imagePlane The constructed imagePlane to be used in viewer easily
     */

  }, {
    key: "getImagePlane",
    value: function getImagePlane(instance) {
      if (!instance.rows || !instance.columns || !instance.pixelSpacing || !instance.frameOfReferenceUID || !instance.imageOrientationPatient || !instance.imagePositionPatient) {
        return;
      }

      var imageOrientation = instance.imageOrientationPatient.split('\\');
      var imagePosition = instance.imagePositionPatient.split('\\');
      var columnPixelSpacing = 1.0;
      var rowPixelSpacing = 1.0;

      if (instance.pixelSpacing) {
        var split = instance.pixelSpacing.split('\\');
        rowPixelSpacing = parseFloat(split[0]);
        columnPixelSpacing = parseFloat(split[1]);
      }

      return {
        frameOfReferenceUID: instance.frameOfReferenceUID,
        rows: instance.rows,
        columns: instance.columns,
        rowCosines: new cornerstoneMath.Vector3(parseFloat(imageOrientation[0]), parseFloat(imageOrientation[1]), parseFloat(imageOrientation[2])),
        columnCosines: new cornerstoneMath.Vector3(parseFloat(imageOrientation[3]), parseFloat(imageOrientation[4]), parseFloat(imageOrientation[5])),
        imagePositionPatient: new cornerstoneMath.Vector3(parseFloat(imagePosition[0]), parseFloat(imagePosition[1]), parseFloat(imagePosition[2])),
        rowPixelSpacing: rowPixelSpacing,
        columnPixelSpacing: columnPixelSpacing
      };
    }
    /**
     * This function extracts miltiframe information from a dicomParser.DataSet object.
     *
     * @param dataSet {Object} An instance of dicomParser.DataSet object where multiframe information can be found.
     * @return {Object} An object containing multiframe image metadata (frameIncrementPointer, frameTime, frameTimeVector, etc).
     */

  }, {
    key: "getMultiframeModuleMetadata",
    value: function getMultiframeModuleMetadata(image) {
      var imageInfo = {
        isMultiframeImage: false,
        frameIncrementPointer: null,
        numberOfFrames: 0,
        frameTime: 0,
        frameTimeVector: null,
        averageFrameRate: 0 // backwards compatibility only... it might be useless in the future

      };
      var frameTime;
      var numberOfFrames = this.getFromImage(image, 'intString', 'x00280008', 'numberOfFrames', -1);

      if (numberOfFrames > 0) {
        // set multi-frame image indicator
        imageInfo.isMultiframeImage = true;
        imageInfo.numberOfFrames = numberOfFrames; // (0028,0009) = Frame Increment Pointer

        var frameIncrementPointer = this.getFrameIncrementPointer(image);

        if (frameIncrementPointer === 'frameTimeVector') {
          // Frame Increment Pointer points to Frame Time Vector (0018,1065) field
          var frameTimeVector = this.getFrameTimeVector(image);

          if (frameTimeVector instanceof Array && frameTimeVector.length > 0) {
            imageInfo.frameIncrementPointer = frameIncrementPointer;
            imageInfo.frameTimeVector = frameTimeVector;
            frameTime = frameTimeVector.reduce(function (a, b) {
              return a + b;
            }) / frameTimeVector.length;
            imageInfo.averageFrameRate = 1000 / frameTime;
          }
        } else if (frameIncrementPointer === 'frameTime' || frameIncrementPointer === '') {
          frameTime = this.getFrameTime(image);

          if (frameTime > 0) {
            imageInfo.frameIncrementPointer = frameIncrementPointer;
            imageInfo.frameTime = frameTime;
            imageInfo.averageFrameRate = 1000 / frameTime;
          }
        }
      }

      return imageInfo;
    }
    /**
     * Get a bound reference to the provider function.
     */

  }, {
    key: "getProvider",
    value: function getProvider() {
      var provider = this._provider;

      if (_typeof(this._provider) !== FUNCTION$2) {
        provider = this.provider.bind(this);
        this._provider = provider;
      }

      return provider;
    }
    /**
     * Looks up metadata for Cornerstone Tools given a specified type and imageId
     * A type may be, e.g. 'study', or 'patient', or 'imagePlane'. These types
     * are keys in the stored metadata objects.
     *
     * @param type
     * @param imageId
     * @returns {Object} Relevant metadata of the specified type
     */

  }, {
    key: "provider",
    value: function provider(type, imageId) {
      // TODO: Cornerstone Tools use 'imagePlaneModule', but OHIF use 'imagePlane'. It must be consistent.
      if (type === 'imagePlaneModule') {
        type = 'imagePlane';
      }

      var imageMetadata = this.metadataLookup.get(imageId);

      if (!imageMetadata) {
        return;
      }

      if (imageMetadata.hasOwnProperty(type)) {
        return imageMetadata[type];
      }
    }
  }]);

  return MetadataProvider;
}();

var cornerstone$2 = {
  MetadataProvider: MetadataProvider,
  getBoundingBox: getBoundingBox,
  pixelToPage: pixelToPage,
  repositionTextBox: repositionTextBox
};

var StudyPrefetcher =
/*#__PURE__*/
function () {
  function StudyPrefetcher(studies) {
    var _this = this;

    _classCallCheck(this, StudyPrefetcher);

    _defineProperty(this, "cacheFullHandler", function () {
      log$1.warn('Cache full');

      _this.stopPrefetching();
    });

    this.studies = studies || [];
    this.prefetchDisplaySetsTimeout = 300;
    this.lastActiveViewportElement = null;
    external.cornerstone.events.addEventListener('cornerstoneimagecachefull.StudyPrefetcher', this.cacheFullHandler);
  }

  _createClass(StudyPrefetcher, [{
    key: "destroy",
    value: function destroy() {
      this.stopPrefetching();
      external.cornerstone.events.removeEventListener('cornerstoneimagecachefull.StudyPrefetcher', this.cacheFullHandler);
    }
  }, {
    key: "setStudies",
    value: function setStudies(studies) {
      this.stopPrefetching();
      this.studies = studies;
    }
  }, {
    key: "prefetch",
    value: function prefetch() {
      if (!this.studies || !this.studies.length) {
        return;
      }

      this.stopPrefetching();
      this.prefetchDisplaySets();
    }
  }, {
    key: "stopPrefetching",
    value: function stopPrefetching() {
      external.cornerstoneTools.requestPoolManager.clearRequestStack('prefetch');
    }
  }, {
    key: "prefetchDisplaySetsAsync",
    value: function prefetchDisplaySetsAsync(timeout) {
      var _this2 = this;

      timeout = timeout || this.prefetchDisplaySetsTimeout;
      clearTimeout(this.prefetchDisplaySetsHandler);
      this.prefetchDisplaySetsHandler = setTimeout(function () {
        _this2.prefetchDisplaySets();
      }, timeout);
    }
  }, {
    key: "prefetchDisplaySets",
    value: function prefetchDisplaySets() {
      // TODO: Allow passing in config
      var config = {
        order: 'closest',
        displaySetCount: 1
      };
      var displaySetsToPrefetch = this.getDisplaySetsToPrefetch(config);
      var imageIds = this.getImageIdsFromDisplaySets(displaySetsToPrefetch);
      this.prefetchImageIds(imageIds);
    }
  }, {
    key: "prefetchImageIds",
    value: function prefetchImageIds(imageIds) {
      var nonCachedImageIds = this.filterCachedImageIds(imageIds);
      var requestPoolManager = external.cornerstoneTools.requestPoolManager;
      var requestType = 'prefetch';
      var preventCache = false;

      var noop = function noop() {};

      nonCachedImageIds.forEach(function (imageId) {
        requestPoolManager.addRequest({}, imageId, requestType, preventCache, noop, noop);
      });
      requestPoolManager.startGrabbing();
    }
  }, {
    key: "getStudy",
    value: function getStudy(image) {
      var studyMetadata = external.cornerstone.metaData.get('study', image.imageId);
      return OHIF.viewer.Studies.find(function (study) {
        return study.studyInstanceUid === studyMetadata.studyInstanceUid;
      });
    }
  }, {
    key: "getSeries",
    value: function getSeries(study, image) {
      var seriesMetadata = external.cornerstone.metaData.get('series', image.imageId);
      var studyMetadata = OHIF.viewerbase.getStudyMetadata(study);
      return studyMetadata.getSeriesByUID(seriesMetadata.seriesInstanceUid);
    }
  }, {
    key: "getInstance",
    value: function getInstance(series, image) {
      var instanceMetadata = external.cornerstone.metaData.get('instance', image.imageId);
      return series.getInstanceByUID(instanceMetadata.sopInstanceUid);
    }
  }, {
    key: "getActiveDisplaySet",
    value: function getActiveDisplaySet(displaySets, instance) {
      return displaySets.find(function (displaySet) {
        return displaySet.images.some(function (displaySetImage) {
          return displaySetImage.sopInstanceUid === instance.sopInstanceUid;
        });
      });
    }
  }, {
    key: "getDisplaySetsToPrefetch",
    value: function getDisplaySetsToPrefetch(config) {
      var image = this.getActiveViewportImage();

      if (!image || !config || !config.displaySetCount) {
        return [];
      }
      /*const study = this.getStudy(image);
      const series = this.getSeries(study, image);
      const instance = this.getInstance(series, image);*/


      var displaySets = study.displaySets;
      var activeDisplaySet = null; //this.getActiveDisplaySet(displaySets, instance);

      var prefetchMethodMap = {
        topdown: 'getFirstDisplaySets',
        downward: 'getNextDisplaySets',
        closest: 'getClosestDisplaySets'
      };
      var prefetchOrder = config.order;
      var methodName = prefetchMethodMap[prefetchOrder];
      var getDisplaySets = this[methodName];

      if (!getDisplaySets) {
        if (prefetchOrder) {
          log$1.warn("Invalid prefetch order configuration (".concat(prefetchOrder, ")"));
        }

        return [];
      }

      return getDisplaySets.call(this, displaySets, activeDisplaySet, config.displaySetCount);
    }
  }, {
    key: "getFirstDisplaySets",
    value: function getFirstDisplaySets(displaySets, activeDisplaySet, displaySetCount) {
      var length = displaySets.length;
      var selectedDisplaySets = [];

      for (var i = 0; i < length && displaySetCount; i++) {
        var displaySet = displaySets[i];

        if (displaySet !== activeDisplaySet) {
          selectedDisplaySets.push(displaySet);
          displaySetCount--;
        }
      }

      return selectedDisplaySets;
    }
  }, {
    key: "getNextDisplaySets",
    value: function getNextDisplaySets(displaySets, activeDisplaySet, displaySetCount) {
      var activeDisplaySetIndex = displaySets.indexOf(activeDisplaySet);
      var begin = activeDisplaySetIndex + 1;
      var end = Math.min(begin + displaySetCount, displaySets.length);
      return displaySets.slice(begin, end);
    }
  }, {
    key: "getClosestDisplaySets",
    value: function getClosestDisplaySets(displaySets, activeDisplaySet, displaySetCount) {
      var activeDisplaySetIndex = displaySets.indexOf(activeDisplaySet);
      var length = displaySets.length;
      var selectedDisplaySets = [];
      var left = activeDisplaySetIndex - 1;
      var right = activeDisplaySetIndex + 1;

      while ((left >= 0 || right < length) && displaySetCount) {
        if (left >= 0) {
          selectedDisplaySets.push(displaySets[left]);
          displaySetCount--;
          left--;
        }

        if (right < length && displaySetCount) {
          selectedDisplaySets.push(displaySets[right]);
          displaySetCount--;
          right++;
        }
      }

      return selectedDisplaySets;
    }
  }, {
    key: "getImageIdsFromDisplaySets",
    value: function getImageIdsFromDisplaySets(displaySets) {
      var _this3 = this;

      var imageIds = [];
      displaySets.forEach(function (displaySet) {
        imageIds = imageIds.concat(_this3.getImageIdsFromDisplaySet(displaySet));
      });
      return imageIds;
    }
  }, {
    key: "getImageIdsFromDisplaySet",
    value: function getImageIdsFromDisplaySet(displaySet) {
      var imageIds = []; // TODO: This duplicates work done by the stack manager

      displaySet.images.forEach(function (image) {
        var numFrames = image.numFrames;

        if (numFrames > 1) {
          for (var i = 0; i < numFrames; i++) {
            var imageId = getImageId(image, i);
            imageIds.push(imageId);
          }
        } else {
          var _imageId = getImageId(image);

          imageIds.push(_imageId);
        }
      });
      return imageIds;
    }
  }, {
    key: "filterCachedImageIds",
    value: function filterCachedImageIds(imageIds) {
      var _this4 = this;

      return imageIds.filter(function (imageId) {
        return !_this4.isImageCached(imageId);
      });
    }
  }, {
    key: "isImageCached",
    value: function isImageCached(imageId) {
      var image = external.cornerstone.imageCache.imageCache[imageId];
      return image && image.sizeInBytes;
    }
  }], [{
    key: "getInstance",
    value: function getInstance() {
      if (!StudyPrefetcher.instance) {
        StudyPrefetcher.instance = new StudyPrefetcher([]);
      }

      return StudyPrefetcher.instance;
    }
  }]);

  return StudyPrefetcher;
}();

var setToolActive = function setToolActive(tool) {
  return {
    type: 'SET_TOOL_ACTIVE',
    tool: tool
  };
};
var setViewportActive = function setViewportActive(viewportIndex) {
  return {
    type: 'SET_VIEWPORT_ACTIVE',
    viewportIndex: viewportIndex
  };
};
var setLayout = function setLayout(layout) {
  return {
    type: 'SET_LAYOUT',
    layout: layout
  };
};
var setStudyLoadingProgress = function setStudyLoadingProgress(progressId, progressData) {
  return {
    type: 'SET_STUDY_LOADING_PROGRESS',
    progressId: progressId,
    progressData: progressData
  };
};
var clearStudyLoadingProgress = function clearStudyLoadingProgress(progressId) {
  return {
    type: 'CLEAR_STUDY_LOADING_PROGRESS',
    progressId: progressId
  };
};
var setUserPreferences = function setUserPreferences(state) {
  return {
    type: 'SET_USER_PREFERENCES',
    state: state
  };
};
var actions = {
  setToolActive: setToolActive,
  setViewportActive: setViewportActive,
  setLayout: setLayout,
  setStudyLoadingProgress: setStudyLoadingProgress,
  clearStudyLoadingProgress: clearStudyLoadingProgress,
  setUserPreferences: setUserPreferences
};

var BaseLoadingListener =
/*#__PURE__*/
function () {
  function BaseLoadingListener(stack, options) {
    _classCallCheck(this, BaseLoadingListener);

    options = options || {};
    this.id = BaseLoadingListener.getNewId();
    this.stack = stack;
    this.startListening();
    this.statsItemsLimit = options.statsItemsLimit || 2;
    this.stats = {
      items: [],
      total: 0,
      elapsedTime: 0,
      speed: 0
    }; // Register the start point to make it possible to calculate
    // bytes/s or frames/s when the first byte or frame is received

    this._addStatsData(0); // Update the progress before starting the download
    // to make it possible to update the UI


    this._updateProgress();
  }

  _createClass(BaseLoadingListener, [{
    key: "_addStatsData",
    value: function _addStatsData(value) {
      var date = new Date();
      var stats = this.stats;
      var items = stats.items;
      var newItem = {
        value: value,
        date: date
      };
      items.push(newItem);
      stats.total += newItem.value; // Remove items until it gets below the limit

      while (items.length > this.statsItemsLimit) {
        var item = items.shift();
        stats.total -= item.value;
      } // Update the elapsedTime (seconds) based on first and last
      // elements and recalculate the speed (bytes/s or frames/s)


      if (items.length > 1) {
        var oldestItem = items[0];
        stats.elapsedTime = (newItem.date.getTime() - oldestItem.date.getTime()) / 1000;
        stats.speed = (stats.total - oldestItem.value) / stats.elapsedTime;
      }
    }
  }, {
    key: "_getProgressId",
    value: function _getProgressId() {
      var displaySetInstanceUid = this.stack.displaySetInstanceUid;
      return 'StackProgress:' + displaySetInstanceUid;
    }
  }, {
    key: "_clearProgress",
    value: function _clearProgress() {
      var progressId = this._getProgressId();

      this._clearProgressById(progressId);
    }
  }, {
    key: "startListening",
    value: function startListening() {
      throw new Error('`startListening` must be implemented by child clases');
    }
  }, {
    key: "stopListening",
    value: function stopListening() {
      throw new Error('`stopListening` must be implemented by child clases');
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.stopListening();

      this._clearProgress();
    }
  }], [{
    key: "getNewId",
    value: function getNewId() {
      var timeSlice = new Date().getTime().toString().slice(-8);
      var randomNumber = parseInt(Math.random() * 1000000000);
      return timeSlice.toString() + randomNumber.toString();
    }
  }]);

  return BaseLoadingListener;
}();

var DICOMFileLoadingListener =
/*#__PURE__*/
function (_BaseLoadingListener) {
  _inherits(DICOMFileLoadingListener, _BaseLoadingListener);

  function DICOMFileLoadingListener(stack) {
    var _this;

    _classCallCheck(this, DICOMFileLoadingListener);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(DICOMFileLoadingListener).call(this, stack, null));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "imageLoadProgressEventHandle", function (e) {
      var eventData = e.detail;

      var dataSetUrl = _this._convertImageIdToDataSetUrl(eventData.imageId);

      var bytesDiff = eventData.loaded - _this._lastLoaded;

      if (!_this._dataSetUrl === dataSetUrl) {
        return;
      } // Add the bytes downloaded to the stats


      _this._addStatsData(bytesDiff); // Update the download progress


      _this._updateProgress(eventData); // Cache the last eventData.loaded value


      _this._lastLoaded = eventData.loaded;
    });

    _this._dataSetUrl = _this._getDataSetUrl(stack);
    _this._lastLoaded = 0; // Check how many instances has already been download (cached)

    _this._checkCachedData();

    return _this;
  }

  _createClass(DICOMFileLoadingListener, [{
    key: "_checkCachedData",
    value: function _checkCachedData() {
      var dataSet = external.cornerstoneWADOImageLoader.wadouri.dataSetCacheManager.get(this._dataSetUrl);

      if (dataSet) {
        var dataSetLength = dataSet.byteArray.length;

        this._updateProgress({
          percentComplete: 100,
          loaded: dataSetLength,
          total: dataSetLength
        });
      }
    }
  }, {
    key: "_getImageLoadProgressEventName",
    value: function _getImageLoadProgressEventName() {
      return 'cornerstoneimageloadprogress.' + this.id;
    }
  }, {
    key: "startListening",
    value: function startListening() {
      var imageLoadProgressEventName = this._getImageLoadProgressEventName();

      this.stopListening();
      external.cornerstone.events.addEventListener(imageLoadProgressEventName, this.imageLoadProgressEventHandle);
    }
  }, {
    key: "stopListening",
    value: function stopListening() {
      var imageLoadProgressEventName = this._getImageLoadProgressEventName();

      external.cornerstone.events.removeEventListener(imageLoadProgressEventName);
    }
  }, {
    key: "_updateProgress",
    value: function _updateProgress(eventData) {
      var progressId = this._getProgressId();

      eventData = eventData || {};
      var progressData = {
        multiFrame: false,
        percentComplete: eventData.percentComplete,
        bytesLoaded: eventData.loaded,
        bytesTotal: eventData.total,
        bytesPerSecond: this.stats.speed
      };

      this._setProgressData(progressId, progressData);
    }
  }, {
    key: "_convertImageIdToDataSetUrl",
    value: function _convertImageIdToDataSetUrl(imageId) {
      // Remove the prefix ("dicomweb:" or "wadouri:"")
      imageId = imageId.replace(/^(dicomweb:|wadouri:)/i, ''); // Remove "frame=999&" from the imageId

      imageId = imageId.replace(/frame=\d+&?/i, ''); // Remove the last "&" like in "http://...?foo=1&bar=2&"

      imageId = imageId.replace(/&$/, '');
      return imageId;
    }
  }, {
    key: "_getDataSetUrl",
    value: function _getDataSetUrl(stack) {
      var imageId = stack.imageIds[0];
      return this._convertImageIdToDataSetUrl(imageId);
    }
  }]);

  return DICOMFileLoadingListener;
}(BaseLoadingListener);

var StackLoadingListener =
/*#__PURE__*/
function (_BaseLoadingListener2) {
  _inherits(StackLoadingListener, _BaseLoadingListener2);

  function StackLoadingListener(stack) {
    var _this2;

    _classCallCheck(this, StackLoadingListener);

    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(StackLoadingListener).call(this, stack, {
      statsItemsLimit: 20
    }));
    _this2.imageDataMap = _this2._convertImageIdsArrayToMap(stack.imageIds);
    _this2.framesStatus = _this2._createArray(stack.imageIds.length, false);
    _this2.loadedCount = 0; // Check how many instances has already been download (cached)

    _this2._checkCachedData();

    return _this2;
  }

  _createClass(StackLoadingListener, [{
    key: "_convertImageIdsArrayToMap",
    value: function _convertImageIdsArrayToMap(imageIds) {
      var imageIdsMap = new Map();

      for (var i = 0; i < imageIds.length; i++) {
        imageIdsMap.set(imageIds[i], {
          index: i,
          loaded: false
        });
      }

      return imageIdsMap;
    }
  }, {
    key: "_createArray",
    value: function _createArray(length, defaultValue) {
      // `new Array(length)` is an anti-pattern in javascript because its
      // funny API. Otherwise I would go for `new Array(length).fill(false)`
      var array = [];

      for (var i = 0; i < length; i++) {
        array[i] = defaultValue;
      }

      return array;
    }
  }, {
    key: "_checkCachedData",
    value: function _checkCachedData() {// const imageIds = this.stack.imageIds;
      // TODO: No way to check status of Promise.

      /*for(let i = 0; i < imageIds.length; i++) {
              const imageId = imageIds[i];
               const imagePromise = cornerstone.imageCache.getImageLoadObject(imageId).promise;
               if (imagePromise && (imagePromise.state() === 'resolved')) {
                  this._updateFrameStatus(imageId, true);
              }
          }*/
    }
  }, {
    key: "_getImageLoadedEventName",
    value: function _getImageLoadedEventName() {
      return 'cornerstoneimageloaded.' + this.id;
    }
  }, {
    key: "_getImageCachePromiseRemoveEventName",
    value: function _getImageCachePromiseRemoveEventName() {
      return 'cornerstoneimagecachepromiseremoved.' + this.id;
    }
  }, {
    key: "_imageLoadedEventHandle",
    value: function _imageLoadedEventHandle(e) {
      this._updateFrameStatus(e.detail.image.imageId, true);
    }
  }, {
    key: "_imageCachePromiseRemovedEventHandle",
    value: function _imageCachePromiseRemovedEventHandle(e) {
      this._updateFrameStatus(e.detail.imageId, false);
    }
  }, {
    key: "startListening",
    value: function startListening() {
      var imageLoadedEventName = this._getImageLoadedEventName();

      var imageCachePromiseRemovedEventName = this._getImageCachePromiseRemoveEventName();

      this.imageLoadedEventHandle = this._imageLoadedEventHandle.bind(this);
      this.imageCachePromiseRemovedEventHandle = this._imageCachePromiseRemovedEventHandle.bind(this);
      this.stopListening();
      external.cornerstone.events.addEventListener(imageLoadedEventName, this.imageLoadedEventHandle);
      external.cornerstone.events.addEventListener(imageCachePromiseRemovedEventName, this.imageCachePromiseRemovedEventHandle);
    }
  }, {
    key: "stopListening",
    value: function stopListening() {
      var imageLoadedEventName = this._getImageLoadedEventName();

      var imageCachePromiseRemovedEventName = this._getImageCachePromiseRemoveEventName();

      external.cornerstone.events.removeEventListener(imageLoadedEventName, this.imageLoadedEventHandle);
      external.cornerstone.events.removeEventListener(imageCachePromiseRemovedEventName, this.imageCachePromiseRemovedEventHandle);
    }
  }, {
    key: "_updateFrameStatus",
    value: function _updateFrameStatus(imageId, loaded) {
      var imageData = this.imageDataMap.get(imageId);

      if (!imageData || imageData.loaded === loaded) {
        return;
      } // Add one more frame to the stats


      if (loaded) {
        this._addStatsData(1);
      }

      imageData.loaded = loaded;
      this.framesStatus[imageData.index] = loaded;
      this.loadedCount += loaded ? 1 : -1;

      this._updateProgress();
    }
  }, {
    key: "_setProgressData",
    value: function _setProgressData(progressId, progressData) {
      window.store.dispatch(setStudyLoadingProgress(progressId, progressData));
    }
  }, {
    key: "_clearProgressById",
    value: function _clearProgressById(progressId) {
      window.store.dispatch(clearStudyLoadingProgress(progressId));
    }
  }, {
    key: "_updateProgress",
    value: function _updateProgress() {
      var totalFramesCount = this.stack.imageIds.length;
      var loadedFramesCount = this.loadedCount;
      var loadingFramesCount = totalFramesCount - loadedFramesCount;
      var percentComplete = Math.round(loadedFramesCount / totalFramesCount * 100);

      var progressId = this._getProgressId();

      var progressData = {
        multiFrame: true,
        totalFramesCount: totalFramesCount,
        loadedFramesCount: loadedFramesCount,
        loadingFramesCount: loadingFramesCount,
        percentComplete: percentComplete,
        framesPerSecond: this.stats.speed,
        framesStatus: this.framesStatus
      };

      this._setProgressData(progressId, progressData);
    }
  }, {
    key: "_logProgress",
    value: function _logProgress() {
      var totalFramesCount = this.stack.imageIds.length;
      var displaySetInstanceUid = this.stack.displaySetInstanceUid;
      var progressBar = '[';

      for (var i = 0; i < totalFramesCount; i++) {
        var ch = this.framesStatus[i] ? '|' : '.';
        progressBar += "".concat(ch);
      }

      progressBar += ']';
      log.info("".concat(displaySetInstanceUid, ": ").concat(progressBar));
    }
  }]);

  return StackLoadingListener;
}(BaseLoadingListener);

var StudyLoadingListener =
/*#__PURE__*/
function () {
  function StudyLoadingListener() {
    _classCallCheck(this, StudyLoadingListener);

    this.listeners = {};
  }

  _createClass(StudyLoadingListener, [{
    key: "addStack",
    value: function addStack(stack, stackMetaData) {
      var displaySetInstanceUid = stack.displaySetInstanceUid;

      if (!this.listeners[displaySetInstanceUid]) {
        var listener = this._createListener(stack, stackMetaData);

        if (listener) {
          this.listeners[displaySetInstanceUid] = listener;
        }
      }
    }
  }, {
    key: "addStudy",
    value: function addStudy(study) {
      var _this3 = this;

      study.displaySets.forEach(function (displaySet) {
        var stack = StackManager.findOrCreateStack(study, displaySet);

        _this3.addStack(stack, {
          isMultiFrame: displaySet.isMultiFrame
        });
      });
    }
  }, {
    key: "addStudies",
    value: function addStudies(studies) {
      var _this4 = this;

      if (!studies || !studies.length) {
        return;
      }

      studies.forEach(function (study) {
        return _this4.addStudy(study);
      });
    }
  }, {
    key: "clear",
    value: function clear() {
      var displaySetInstanceUids = Object.keys(this.listeners);
      var length = displaySetInstanceUids.length;

      for (var i = 0; i < length; i++) {
        var displaySetInstanceUid = displaySetInstanceUids[i];
        var displaySet = this.listeners[displaySetInstanceUid];
        displaySet.destroy();
      }

      this.listeners = {};
    }
  }, {
    key: "_createListener",
    value: function _createListener(stack, stackMetaData) {
      var schema = this._getSchema(stack); // A StackLoadingListener can be created if it's wadors or not a multiframe
      // wadouri instance (single file) that means "N" files will have to be
      // downloaded where "N" is the number of frames. DICOMFileLoadingListener
      // is created only if it's a single DICOM file and there's no way to know
      // how many frames has already been loaded (bytes/s instead of frames/s).


      if (schema === 'wadors' || !stackMetaData.isMultiFrame) {
        return new StackLoadingListener(stack);
      } else {
        return new DICOMFileLoadingListener(stack);
      }
    }
  }, {
    key: "_getSchema",
    value: function _getSchema(stack) {
      var imageId = stack.imageIds[0];
      var colonIndex = imageId.indexOf(':');
      return imageId.substring(0, colonIndex);
    } // Singleton

  }], [{
    key: "getInstance",
    value: function getInstance() {
      if (!StudyLoadingListener._instance) {
        StudyLoadingListener._instance = new StudyLoadingListener();
      }

      return StudyLoadingListener._instance;
    }
  }]);

  return StudyLoadingListener;
}();

/**
 * Constants
 */
var PROPERTY_SEPARATOR = '.';
var ORDER_ASC = 'asc';
var ORDER_DESC = 'desc';
var MIN_COUNT = 0x00000000;
var MAX_COUNT = 0x7fffffff;
/**
 * Class Definition
 */

var TypeSafeCollection =
/*#__PURE__*/
function () {
  function TypeSafeCollection() {
    _classCallCheck(this, TypeSafeCollection);

    this._operationCount = MIN_COUNT;
    this._elementList = [];
    this._handlers = Object.create(null);
  }
  /**
   * Private Methods
   */


  _createClass(TypeSafeCollection, [{
    key: "_invalidate",
    value: function _invalidate() {
      var count = this._operationCount;
      this._operationCount = count < MAX_COUNT ? count + 1 : MIN_COUNT;
    }
  }, {
    key: "_elements",
    value: function _elements(silent) {
      silent === true || this._operationCount;
      return this._elementList;
    }
  }, {
    key: "_elementWithPayload",
    value: function _elementWithPayload(payload, silent) {
      return this._elements(silent).find(function (item) {
        return item.payload === payload;
      });
    }
  }, {
    key: "_elementWithId",
    value: function _elementWithId(id, silent) {
      return this._elements(silent).find(function (item) {
        return item.id === id;
      });
    }
  }, {
    key: "_trigger",
    value: function _trigger(event, data) {
      var handlers = this._handlers;

      if (event in handlers) {
        handlers = handlers[event];

        if (!(handlers instanceof Array)) {
          return;
        }

        for (var i = 0, limit = handlers.length; i < limit; ++i) {
          var handler = handlers[i];

          if (_isFunction(handler)) {
            handler.call(null, data);
          }
        }
      }
    }
    /**
     * Public Methods
     */

  }, {
    key: "onInsert",
    value: function onInsert(callback) {
      if (_isFunction(callback)) {
        var handlers = this._handlers.insert;

        if (!(handlers instanceof Array)) {
          handlers = [];
          this._handlers.insert = handlers;
        }

        handlers.push(callback);
      }
    }
    /**
     * Update the payload associated with the given ID to be the new supplied payload.
     * @param {string} id The ID of the entry that will be updated.
     * @param {any} payload The element that will replace the previous payload.
     * @returns {boolean} Returns true if the given ID is present in the collection, false otherwise.
     */

  }, {
    key: "updateById",
    value: function updateById(id, payload) {
      var result = false,
          found = this._elementWithPayload(payload, true);

      if (found) {
        // nothing to do since the element is already in the collection...
        if (found.id === id) {
          // set result to true since the ids match...
          result = true;

          this._invalidate();
        }
      } else {
        found = this._elementWithId(id, true);

        if (found) {
          found.payload = payload;
          result = true;

          this._invalidate();
        }
      }

      return result;
    }
    /**
     * Signal that the given element has been changed by notifying reactive data-source observers.
     * This method is basically a means to invalidate the inernal reactive data-source.
     * @param {any} payload The element that has been altered.
     * @returns {boolean} Returns true if the element is present in the collection, false otherwise.
     */

  }, {
    key: "update",
    value: function update(payload) {
      var result = false,
          found = this._elementWithPayload(payload, true);

      if (found) {
        // nothing to do since the element is already in the collection...
        result = true;

        this._invalidate();
      }

      return result;
    }
    /**
     * Insert an element in the collection. On success, the element ID (a unique string) is returned. On failure, returns null.
     * A failure scenario only happens when the given payload is already present in the collection. Note that NO exceptions are thrown!
     * @param {any} payload The element to be stored.
     * @returns {string} The ID of the inserted element or null if the element already exists...
     */

  }, {
    key: "insert",
    value: function insert(payload) {
      var id = null,
          found = this._elementWithPayload(payload, true);

      if (!found) {
        id = OHIF.utils.guid();

        this._elements(true).push({
          id: id,
          payload: payload
        });

        this._invalidate();

        this._trigger('insert', {
          id: id,
          data: payload
        });
      }

      return id;
    }
    /**
     * Remove all elements from the collection.
     * @returns {void} No meaningful value is returned.
     */

  }, {
    key: "removeAll",
    value: function removeAll() {
      var all = this._elements(true),
          length = all.length;

      for (var i = length - 1; i >= 0; i--) {
        var item = all[i];
        delete item.id;
        delete item.payload;
        all[i] = null;
      }

      all.splice(0, length);

      this._invalidate();
    }
    /**
     * Remove elements from the collection that match the criteria given in the property map.
     * @param {Object} propertyMap A property map that will be macthed against all collection elements.
     * @returns {Array} A list with all removed elements.
     */

  }, {
    key: "remove",
    value: function remove(propertyMap) {
      var found = this.findAllEntriesBy(propertyMap),
          foundCount = found.length,
          removed = [];

      if (foundCount > 0) {
        var all = this._elements(true);

        for (var i = foundCount - 1; i >= 0; i--) {
          var item = found[i];
          all.splice(item[2], 1);
          removed.push(item[0]);
        }

        this._invalidate();
      }

      return removed;
    }
    /**
     * Provides the ID of the given element inside the collection.
     * @param {any} payload The element being searched for.
     * @returns {string} The ID of the given element or undefined if the element is not present.
     */

  }, {
    key: "getElementId",
    value: function getElementId(payload) {
      var found = this._elementWithPayload(payload);

      return found && found.id;
    }
    /**
     * Provides the position of the given element in the internal list returning -1 if the element is not present.
     * @param {any} payload The element being searched for.
     * @returns {number} The position of the given element in the internal list. If the element is not present -1 is returned.
     */

  }, {
    key: "findById",
    value: function findById(id) {
      var found = this._elementWithId(id);

      return found && found.payload;
    }
    /**
     * Provides the position of the given element in the internal list returning -1 if the element is not present.
     * @param {any} payload The element being searched for.
     * @returns {number} The position of the given element in the internal list. If the element is not present -1 is returned.
     */

  }, {
    key: "indexOfElement",
    value: function indexOfElement(payload) {
      return this._elements().indexOf(this._elementWithPayload(payload, true));
    }
    /**
     * Provides the position of the element associated with the given ID in the internal list returning -1 if the element is not present.
     * @param {string} id The index of the element.
     * @returns {number} The position of the element associated with the given ID in the internal list. If the element is not present -1 is returned.
     */

  }, {
    key: "indexOfId",
    value: function indexOfId(id) {
      return this._elements().indexOf(this._elementWithId(id, true));
    }
    /**
     * Provides a list-like approach to the collection returning an element by index.
     * @param {number} index The index of the element.
     * @returns {any} If out of bounds, undefined is returned. Otherwise the element in the given position is returned.
     */

  }, {
    key: "getElementByIndex",
    value: function getElementByIndex(index) {
      var found = this._elements()[index >= 0 ? index : -1];

      return found && found.payload;
    }
    /**
     * Find an element by a criteria defined by the given callback function.
     * Attention!!! The reactive source will not be notified if no valid callback is supplied...
     * @param {function} callback A callback function which will define the search criteria. The callback
     * function will be passed the collection element, its ID and its index in this very order. The callback
     * shall return true when its criterea has been fulfilled.
     * @returns {any} The matched element or undefined if not match was found.
     */

  }, {
    key: "find",
    value: function find(callback) {
      var _this = this;

      var found;

      if (_isFunction(callback)) {
        found = this._elements().find(function (item, index) {
          return callback.call(_this, item.payload, item.id, index);
        });
      }

      return found && found.payload;
    }
    /**
     * Find the first element that strictly matches the specified property map.
     * @param {Object} propertyMap A property map that will be macthed against all collection elements.
     * @param {Object} options A set of options. Currently only "options.sort" option is supported.
     * @param {Object.SortingSpecifier} options.sort An optional sorting specifier. If a sorting specifier is supplied
     * but is not valid, an exception will be thrown.
     * @returns {Any} The matched element or undefined if not match was found.
     */

  }, {
    key: "findBy",
    value: function findBy(propertyMap, options) {
      var found;

      if (_isObject(options)) {
        // if the "options" argument is provided and is a valid object,
        // it must be applied to the dataset before search...
        var all = this.all(options);

        if (all.length > 0) {
          if (_isObject(propertyMap)) {
            found = all.find(function (item) {
              return _compareToPropertyMapStrict(propertyMap, item);
            });
          } else {
            found = all[0]; // simply extract the first element...
          }
        }
      } else if (_isObject(propertyMap)) {
        found = this._elements().find(function (item) {
          return _compareToPropertyMapStrict(propertyMap, item.payload);
        });

        if (found) {
          found = found.payload;
        }
      }

      return found;
    }
    /**
     * Find all elements that strictly match the specified property map.
     * Attention!!! The reactive source will not be notified if no valid property map is supplied...
     * @param {Object} propertyMap A property map that will be macthed against all collection elements.
     * @returns {Array} An array of entries of all elements that match the given criteria. Each set in
     * in the array has the following format: [ elementData, elementId, elementIndex ].
     */

  }, {
    key: "findAllEntriesBy",
    value: function findAllEntriesBy(propertyMap) {
      var found = [];

      if (_isObject(propertyMap)) {
        this._elements().forEach(function (item, index) {
          if (_compareToPropertyMapStrict(propertyMap, item.payload)) {
            // Match! Add it to the found list...
            found.push([item.payload, item.id, index]);
          }
        });
      }

      return found;
    }
    /**
     * Find all elements that match a specified property map.
     * Attention!!! The reactive source will not be notified if no valid property map is supplied...
     * @param {Object} propertyMap A property map that will be macthed against all collection elements.
     * @param {Object} options A set of options. Currently only "options.sort" option is supported.
     * @param {Object.SortingSpecifier} options.sort An optional sorting specifier. If a sorting specifier is supplied
     * but is not valid, an exception will be thrown.
     * @returns {Array} An array with all elements that match the given criteria and sorted in the specified sorting order.
     */

  }, {
    key: "findAllBy",
    value: function findAllBy(propertyMap, options) {
      var found = this.findAllEntriesBy(propertyMap).map(function (item) {
        return item[0];
      }); // Only payload is relevant...

      if (_isObject(options)) {
        if ('sort' in options) {
          _sortListBy(found, options.sort);
        }
      }

      return found;
    }
    /**
     * Executes the supplied callback function for each element of the collection.
     * Attention!!! The reactive source will not be notified if no valid property map is supplied...
     * @param {function} callback The callback function to be executed. The callback is passed the element,
     * its ID and its index in this very order.
     * @returns {void} Nothing is returned.
     */

  }, {
    key: "forEach",
    value: function forEach(callback) {
      var _this2 = this;

      if (_isFunction(callback)) {
        this._elements().forEach(function (item, index) {
          callback.call(_this2, item.payload, item.id, index);
        });
      }
    }
    /**
     * Count the number of elements currently in the collection.
     * @returns {number} The current number of elements in the collection.
     */

  }, {
    key: "count",
    value: function count() {
      return this._elements().length;
    }
    /**
     * Returns a list with all elements of the collection optionally sorted by a sorting specifier criteria.
     * @param {Object} options A set of options. Currently only "options.sort" option is supported.
     * @param {Object.SortingSpecifier} options.sort An optional sorting specifier. If a sorting specifier is supplied
     * but is not valid, an exception will be thrown.
     * @returns {Array} An array with all elements stored in the collection.
     */

  }, {
    key: "all",
    value: function all(options) {
      var list = this._elements().map(function (item) {
        return item.payload;
      });

      if (_isObject(options)) {
        if ('sort' in options) {
          _sortListBy(list, options.sort);
        }
      }

      return list;
    }
  }]);

  return TypeSafeCollection;
}();
/**
 * Utility Functions
 */

/**
 * Test if supplied argument is a valid object for current class purposes.
 * Atention! The underscore version of this function should not be used for performance reasons.
 */

function _isObject(subject) {
  return subject instanceof Object || _typeof(subject) === 'object' && subject !== null;
}
/**
 * Test if supplied argument is a valid string for current class purposes.
 * Atention! The underscore version of this function should not be used for performance reasons.
 */


function _isString(subject) {
  return typeof subject === 'string';
}
/**
 * Test if supplied argument is a valid function for current class purposes.
 * Atention! The underscore version of this function should not be used for performance reasons.
 */


function _isFunction(subject) {
  return typeof subject === 'function';
}
/**
 * Shortcut for Object's prototype "hasOwnProperty" method.
 */


var _hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * Retrieve an object's property value by name. Composite property names (e.g., 'address.country.name') are accepted.
 * @param {Object} targetObject The object we want read the property from...
 * @param {String} propertyName The property to be read (e.g., 'address.street.name' or 'address.street.number'
 * to read object.address.street.name or object.address.street.number, respectively);
 * @returns {Any} Returns whatever the property holds or undefined if the property cannot be read or reached.
 */

function _getPropertyValue(targetObject, propertyName) {
  var propertyValue; // undefined (the default return value)

  if (_isObject(targetObject) && _isString(propertyName)) {
    var fragments = propertyName.split(PROPERTY_SEPARATOR);
    var fragmentCount = fragments.length;

    if (fragmentCount > 0) {
      var firstFragment = fragments[0];
      var remainingFragments = fragmentCount > 1 ? fragments.slice(1).join(PROPERTY_SEPARATOR) : null;
      propertyValue = targetObject[firstFragment];

      if (remainingFragments !== null) {
        propertyValue = _getPropertyValue(propertyValue, remainingFragments);
      }
    }
  }

  return propertyValue;
}
/**
 * Compare a property map with a target object using strict comparison.
 * @param {Object} propertyMap The property map whose properties will be used for comparison. Composite
 * property names (e.g., 'address.country.name') will be tested against the "resolved" properties from the target object.
 * @param {Object} targetObject The target object whose properties will be tested.
 * @returns {boolean} Returns true if the properties match, false otherwise.
 */


function _compareToPropertyMapStrict(propertyMap, targetObject) {
  var result = false; // "for in" loops do not thown exceptions for invalid data types...

  for (var propertyName in propertyMap) {
    if (_hasOwnProperty.call(propertyMap, propertyName)) {
      if (propertyMap[propertyName] !== _getPropertyValue(targetObject, propertyName)) {
        result = false;
        break;
      } else if (result !== true) {
        result = true;
      }
    }
  }

  return result;
}
/**
 * Checks if a sorting specifier is valid.
 * A valid sorting specifier consists of an array of arrays being each subarray a pair
 * in the format ["property name", "sorting order"].
 * The following exemple can be used to sort studies by "date"" and use "time" to break ties in descending order.
 * [ [ 'study.date', 'desc' ], [ 'study.time', 'desc' ] ]
 * @param {Array} specifiers The sorting specifier to be tested.
 * @returns {boolean} Returns true if the specifiers are valid, false otherwise.
 */


function _isValidSortingSpecifier(specifiers) {
  var result = true;

  if (specifiers instanceof Array && specifiers.length > 0) {
    for (var i = specifiers.length - 1; i >= 0; i--) {
      var item = specifiers[i];

      if (item instanceof Array) {
        var property = item[0];
        var order = item[1];

        if (_isString(property) && (order === ORDER_ASC || order === ORDER_DESC)) {
          continue;
        }
      }

      result = false;
      break;
    }
  }

  return result;
}
/**
 * Sorts an array based on sorting specifier options.
 * @param {Array} list The that needs to be sorted.
 * @param {Array} specifiers An array of specifiers. Please read isValidSortingSpecifier method definition for further details.
 * @returns {void} No value is returned. The array is sorted in place.
 */


function _sortListBy(list, specifiers) {
  if (list instanceof Array && _isValidSortingSpecifier(specifiers)) {
    var specifierCount = specifiers.length;
    list.sort(function _sortListByCallback(a, b) {
      // callback name for stack traces...
      var index = 0;

      while (index < specifierCount) {
        var specifier = specifiers[index];
        var property = specifier[0];
        var order = specifier[1] === ORDER_DESC ? -1 : 1;

        var aValue = _getPropertyValue(a, property);

        var bValue = _getPropertyValue(b, property); // @TODO: should we check for the types being compared, like:
        // ~~ if (typeof aValue !== typeof bValue) continue;
        // Not sure because dates, for example, can be correctly compared to numbers...


        if (aValue < bValue) {
          return order * -1;
        }

        if (aValue > bValue) {
          return order * 1;
        }

        if (++index >= specifierCount) {
          return 0;
        }
      }
    });
  } else {
    throw new Error('Invalid Arguments');
  }
}

/**
 * Abstract class to fetch study metadata.
 */

var StudyMetadataSource =
/*#__PURE__*/
function () {
  function StudyMetadataSource() {
    _classCallCheck(this, StudyMetadataSource);
  }

  _createClass(StudyMetadataSource, [{
    key: "getByInstanceUID",

    /**
     * Get study metadata for a study with given study InstanceUID.
     * @param {String} studyInstanceUID Study InstanceUID.
     */
    value: function getByInstanceUID(studyInstanceUID) {
      /**
       * Please override this method on a specialized class.
       */
      throw new OHIFError('StudyMetadataSource::getByInstanceUID is not overriden. Please, override it in a specialized class. See OHIFStudyMetadataSource for example');
    }
    /**
     * Load study info and study metadata for a given study into the viewer.
     * @param {StudySummary|StudyMetadata} study of StudySummary or StudyMetadata object.
     */

  }, {
    key: "loadStudy",
    value: function loadStudy(study) {
      /**
       * Please override this method on a specialized class.
       */
      throw new OHIFError('StudyMetadataSource::loadStudy is not overriden. Please, override it in a specialized class. See OHIFStudyMetadataSource for example');
    }
  }]);

  return StudyMetadataSource;
}();

var classes = {
  MetadataProvider: MetadataProvider,
  CommandsManager: CommandsManager,
  HotkeysContext: HotkeysContext,
  HotkeysManager: HotkeysManager,
  ImageSet: ImageSet,
  StudyPrefetcher: StudyPrefetcher,
  StudyLoadingListener: StudyLoadingListener,
  StackLoadingListener: StackLoadingListener,
  DICOMFileLoadingListener: DICOMFileLoadingListener,
  StudyMetadata: StudyMetadata,
  SeriesMetadata: SeriesMetadata,
  InstanceMetadata: InstanceMetadata,
  //StudySummary,
  TypeSafeCollection: TypeSafeCollection,
  OHIFError: OHIFError,
  StudyMetadataSource: StudyMetadataSource
};

var defaultButtons = [{
  command: 'Pan',
  type: 'tool',
  text: 'Pan',
  svgUrl: '/icons.svg#icon-tools-pan',
  active: false
}, {
  command: 'Zoom',
  type: 'tool',
  text: 'Zoom',
  svgUrl: '/icons.svg#icon-tools-zoom',
  active: false
}, {
  command: 'Bidirectional',
  type: 'tool',
  text: 'Bidirectional',
  svgUrl: '/icons.svg#icon-tools-measure-target',
  active: false
}, {
  command: 'StackScroll',
  type: 'tool',
  text: 'Stack Scroll',
  svgUrl: '/icons.svg#icon-tools-stack-scroll',
  active: false
}, {
  command: 'reset',
  type: 'command',
  text: 'Reset',
  svgUrl: '/icons.svg#icon-tools-reset',
  active: false
}, {
  command: 'Wwwc',
  type: 'tool',
  text: 'Manual',
  svgUrl: '/icons.svg#icon-tools-levels',
  active: true
}, {
  command: 'setWLPresetSoftTissue',
  type: 'command',
  text: 'Soft Tissue',
  svgUrl: '/icons.svg#icon-wl-soft-tissue',
  active: false
}, {
  command: 'setWLPresetLung',
  type: 'command',
  text: 'Lung',
  svgUrl: '/icons.svg#icon-wl-lung',
  active: false
}, {
  command: 'setWLPresetLiver',
  type: 'command',
  text: 'Liver',
  svgUrl: '/icons.svg#icon-wl-liver',
  active: false
}, {
  command: 'setWLPresetBrain',
  type: 'command',
  text: 'Brain',
  svgUrl: '/icons.svg#icon-wl-brain',
  active: false
}];

var tools = function tools() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    buttons: defaultButtons
  };
  var action = arguments.length > 1 ? arguments[1] : undefined;

  switch (action.type) {
    case 'SET_TOOL_ACTIVE':
      var item = state.buttons.find(function (button) {
        return button.command === action.tool;
      });
      var buttons = [];

      if (item.type === 'tool') {
        buttons = state.buttons.map(function (button) {
          if (button.command === action.tool) {
            button.active = true;
          } else if (button.type === 'tool') {
            button.active = false;
          }

          return button;
        });
      }

      return {
        buttons: buttons
      };

    case 'SET_AVAILABLE_BUTTONS':
      return {
        buttons: action.buttons
      };

    default:
      return state;
  }
};

var defaultState = {
  activeViewportIndex: 0,
  layout: {
    viewports: [{
      height: '100%',
      width: '100%'
    }]
  }
};

var viewports = function viewports() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState;
  var action = arguments.length > 1 ? arguments[1] : undefined;

  switch (action.type) {
    case 'SET_VIEWPORT_ACTIVE':
      return Object.assign({}, state, {
        activeViewportIndex: action.viewportIndex
      });

    case 'SET_LAYOUT':
      return Object.assign({}, state, {
        layout: action.layout
      });

    default:
      return state;
  }
};

var defaultState$1 = {
  servers: []
};

var servers = function servers() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState$1;
  var action = arguments.length > 1 ? arguments[1] : undefined;

  switch (action.type) {
    case 'ADD_SERVER':
      var _servers = state.servers;

      var alreadyExists = _servers.find(function (server) {
        return server.id === action.server.id;
      });

      if (alreadyExists) {
        return state;
      }

      _servers.push(action.server);

      if (_servers.length === 1) {
        _servers[0].active = true;
      }

      return Object.assign({}, state, {
        servers: _servers
      });

    default:
      return state;
  }
};

var defaultState$2 = {
  progress: {},
  lastUpdated: null
};

var loading = function loading() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState$2;
  var action = arguments.length > 1 ? arguments[1] : undefined;

  switch (action.type) {
    case 'SET_STUDY_LOADING_PROGRESS':
      var progress = state.progress;
      progress[action.progressId] = action.progressData; // This is a workaround so we can easily identify changes
      // to the progress object without doing deep comparison.
      // See FlexboxLayout

      var date = new Date();
      var lastUpdated = date.getTime();
      return Object.assign({}, state, {
        progress: progress,
        lastUpdated: lastUpdated
      });

    case 'CLEAR_STUDY_LOADING_PROGRESS':
      var updatedState = Object.assign({}, state);
      delete updatedState.progress[action.progressId];
      return updatedState;

    default:
      return state;
  }
};

var lodash_clonedeep = createCommonjsModule(function (module, exports) {
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
cloneableTags[boolTag] = cloneableTags[dateTag] =
cloneableTags[float32Tag] = cloneableTags[float64Tag] =
cloneableTags[int8Tag] = cloneableTags[int16Tag] =
cloneableTags[int32Tag] = cloneableTags[mapTag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[setTag] =
cloneableTags[stringTag] = cloneableTags[symbolTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[weakMapTag] = false;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Detect free variable `exports`. */
var freeExports = exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/**
 * Adds the key-value `pair` to `map`.
 *
 * @private
 * @param {Object} map The map to modify.
 * @param {Array} pair The key-value pair to add.
 * @returns {Object} Returns `map`.
 */
function addMapEntry(map, pair) {
  // Don't return `map.set` because it's not chainable in IE 11.
  map.set(pair[0], pair[1]);
  return map;
}

/**
 * Adds `value` to `set`.
 *
 * @private
 * @param {Object} set The set to modify.
 * @param {*} value The value to add.
 * @returns {Object} Returns `set`.
 */
function addSetEntry(set, value) {
  // Don't return `set.add` because it's not chainable in IE 11.
  set.add(value);
  return set;
}

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array ? array.length : 0;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    getPrototype = overArg(Object.getPrototypeOf, Object),
    objectCreate = Object.create,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols,
    nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
    nativeKeys = overArg(Object.keys, Object);

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView'),
    Map = getNative(root, 'Map'),
    Promise = getNative(root, 'Promise'),
    Set = getNative(root, 'Set'),
    WeakMap = getNative(root, 'WeakMap'),
    nativeCreate = getNative(Object, 'create');

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  this.__data__ = new ListCache(entries);
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  return this.__data__['delete'](key);
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var cache = this.__data__;
  if (cache instanceof ListCache) {
    var pairs = cache.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      return this;
    }
    cache = this.__data__ = new MapCache(pairs);
  }
  cache.set(key, value);
  return this;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = (isArray(value) || isArguments(value))
    ? baseTimes(value.length, String)
    : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    object[key] = value;
  }
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object);
}

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {boolean} [isFull] Specify a clone including symbols.
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
  var result;
  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag(value),
        isFunc = tag == funcTag || tag == genTag;

    if (isBuffer(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      if (isHostObject(value)) {
        return object ? value : {};
      }
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, baseClone, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (!isArr) {
    var props = isFull ? getAllKeys(value) : keys(value);
  }
  arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    assignValue(result, key, baseClone(subValue, isDeep, isFull, customizer, key, value, stack));
  });
  return result;
}

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} prototype The object to inherit from.
 * @returns {Object} Returns the new object.
 */
function baseCreate(proto) {
  return isObject(proto) ? objectCreate(proto) : {};
}

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

/**
 * The base implementation of `getTag`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  return objectToString.call(value);
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var result = new buffer.constructor(buffer.length);
  buffer.copy(result);
  return result;
}

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

/**
 * Creates a clone of `map`.
 *
 * @private
 * @param {Object} map The map to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned map.
 */
function cloneMap(map, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
  return arrayReduce(array, addMapEntry, new map.constructor);
}

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

/**
 * Creates a clone of `set`.
 *
 * @private
 * @param {Object} set The set to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned set.
 */
function cloneSet(set, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(setToArray(set), true) : setToArray(set);
  return arrayReduce(array, addSetEntry, new set.constructor);
}

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    assignValue(object, key, newValue === undefined ? source[key] : newValue);
  }
  return object;
}

/**
 * Copies own symbol properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return copyObject(source, getSymbols(source), object);
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Creates an array of the own enumerable symbol properties of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = nativeGetSymbols ? overArg(nativeGetSymbols, Object) : stubArray;

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11,
// for data views in Edge < 14, and promises in Node.js.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = objectToString.call(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : undefined;

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, cloneFunc, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return cloneArrayBuffer(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case dataViewTag:
      return cloneDataView(object, isDeep);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      return cloneTypedArray(object, isDeep);

    case mapTag:
      return cloneMap(object, isDeep, cloneFunc);

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      return cloneRegExp(object);

    case setTag:
      return cloneSet(object, isDeep, cloneFunc);

    case symbolTag:
      return cloneSymbol(object);
  }
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep(value) {
  return baseClone(value, true, true);
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = cloneDeep;
});

var defaultState$3 = {
  hotKeysData: {
    defaultTool: {
      label: 'Default Tool',
      command: 'ESC',
      column: 0
    },
    zoom: {
      label: 'Zoom',
      command: 'Z',
      column: 0
    },
    wwwc: {
      label: 'W/L',
      command: 'W',
      column: 0
    },
    pan: {
      label: 'Pan',
      command: 'P',
      column: 0
    },
    angle: {
      label: 'Angle measurement',
      command: 'A',
      column: 0
    },
    stackScroll: {
      label: 'Scroll stack',
      command: 'S',
      column: 0
    },
    magnify: {
      label: 'Magnify',
      command: 'M',
      column: 0
    },
    length: {
      label: 'Length measurement',
      command: '',
      column: 0
    },
    annotate: {
      label: 'Annotate',
      command: '',
      column: 0
    },
    dragProbe: {
      label: 'Pixel probe',
      command: '',
      column: 0
    },
    ellipticalRoi: {
      label: 'Elliptical ROI',
      command: '',
      column: 0
    },
    rectangleRoi: {
      label: 'Rectangle ROI',
      command: '',
      column: 0
    },
    // Viewport hotkeys
    flipH: {
      label: 'Flip Horizontally',
      command: 'H',
      column: 0
    },
    flipV: {
      label: 'Flip Vertically',
      command: 'V',
      column: 0
    },
    rotateR: {
      label: 'Rotate Right',
      command: 'R',
      column: 0
    },
    rotateL: {
      label: 'Rotate Left',
      command: 'L',
      column: 0
    },
    invert: {
      label: 'Invert',
      command: 'I',
      column: 0
    },
    zoomIn: {
      label: 'Zoom In',
      command: '',
      column: 0
    },
    zoomOut: {
      label: 'Zoom Out',
      command: '',
      column: 0
    },
    zoomToFit: {
      label: 'Zoom to Fit',
      command: '',
      column: 0
    },
    resetViewport: {
      label: 'Reset',
      command: '',
      column: 0
    },
    clearTools: {
      label: 'Clear Tools',
      command: '',
      column: 0
    },
    // 2nd column
    // Viewport navigation hotkeys
    scrollDown: {
      label: 'Scroll Down',
      command: 'DOWN',
      column: 1
    },
    scrollUp: {
      label: 'Scroll Up',
      command: 'UP',
      column: 1
    },
    scrollLastImage: {
      label: 'Scroll to Last Image',
      command: 'END',
      column: 1
    },
    scrollFirstImage: {
      label: 'Scroll to First Image',
      command: 'HOME',
      column: 1
    },
    previousDisplaySet: {
      label: 'Previous Series',
      command: 'PAGEUP',
      column: 1
    },
    nextDisplaySet: {
      label: 'Next Series',
      command: 'PAGEDOWN',
      column: 1
    },
    nextPanel: {
      label: 'Next Image Viewport',
      command: 'RIGHT',
      column: 1
    },
    previousPanel: {
      label: 'Previous Image Viewport',
      command: 'LEFT',
      column: 1
    },
    // Miscellaneous hotkeys
    toggleOverlayTags: {
      label: 'Toggle Image Info Overlay',
      command: 'O',
      column: 1
    },
    toggleCinePlay: {
      label: 'Play/Pause Cine',
      command: 'SPACE',
      column: 1
    },
    toggleCineDialog: {
      label: 'Show/Hide Cine Controls',
      command: '',
      column: 1
    },
    toggleDownloadDialog: {
      label: 'Show/Hide Download Dialog',
      command: '',
      column: 1
    },
    // Preset hotkeys
    WLPreset0: {
      label: 'W/L Preset 0  (Soft Tissue)',
      command: '1',
      column: 1
    },
    WLPreset1: {
      label: 'W/L Preset 1 (Lung)',
      command: '2',
      column: 1
    },
    WLPreset2: {
      label: 'W/L Preset 2 (Liver)',
      command: '3',
      column: 1
    },
    WLPreset3: {
      label: 'W/L Preset 3 (Bone)',
      command: '4',
      column: 1
    },
    WLPreset4: {
      label: 'W/L Preset 4 (Brain)',
      command: '5',
      column: 1
    },
    WLPreset5: {
      label: 'W/L Preset 5',
      command: '6',
      column: 1
    },
    WLPreset6: {
      label: 'W/L Preset 6',
      command: '7',
      column: 1
    },
    WLPreset7: {
      label: 'W/L Preset 7',
      command: '8',
      column: 1
    },
    WLPreset8: {
      label: 'W/L Preset 8',
      command: '9',
      column: 1
    },
    WLPreset9: {
      label: 'W/L Preset 0',
      command: '0',
      column: 1
    }
  },
  windowLevelData: {
    0: {
      description: 'Soft tissue',
      window: 400,
      level: 40
    },
    1: {
      description: 'Lung',
      window: 1500,
      level: -600
    },
    2: {
      description: 'Liver',
      window: 150,
      level: 90
    },
    3: {
      description: 'Bone',
      window: 2500,
      level: 480
    },
    4: {
      description: 'Brain',
      window: 80,
      level: 40
    },
    5: {
      description: '',
      window: '',
      level: ''
    },
    6: {
      description: '',
      window: '',
      level: ''
    },
    7: {
      description: '',
      window: '',
      level: ''
    },
    8: {
      description: '',
      window: '',
      level: ''
    },
    9: {
      description: '',
      window: '',
      level: ''
    },
    10: {
      description: '',
      window: '',
      level: ''
    }
  }
};

var preferences = function preferences(state, action) {
  switch (action.type) {
    case 'SET_USER_PREFERENCES':
      var newState = action.state; // If no value is provided, reset to defaults

      if (!action.state) {
        newState = lodash_clonedeep(defaultState$3);
      }

      return Object.assign({}, state, newState);

    default:
      return lodash_clonedeep(defaultState$3);
  }
};

var reducers = {
  tools: tools,
  viewports: viewports,
  servers: servers,
  loading: loading,
  preferences: preferences
};

var redux = {
  reducers: reducers,
  actions: actions
};

// TODO: This is duplicated in TypeSafeCollection
function isObject(subject) {
  return subject instanceof Object || _typeof(subject) === 'object' && subject !== null;
} // TODO: This is duplicated in TypeSafeCollection


function isString(subject) {
  return typeof subject === 'string';
} // Search for some string inside any object or array


function search(object, query) {
  var property = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var result = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
  // Create the search pattern
  var pattern = new RegExp(query.trim(), 'i');
  Object.keys(object).forEach(function (key) {
    var item = object[key]; // Stop here if item is empty

    if (!item) {
      return;
    } // Get the value to be compared


    var value = isString(property) ? item[property] : item; // Check if the value match the pattern

    if (isString(value) && pattern.test(value)) {
      // Add the current item to the result
      result.push(item);
    }

    if (isObject(item)) {
      // Search recursively the item if the current item is an object
      search(item, query, property, result);
    }
  }); // Return the found items

  return result;
} // Encode any string into a safe format for HTML id attribute


function encodeId(input) {
  var string = input && input.toString ? input.toString() : input; // Return an underscore if the given string is empty or if it's not a string

  if (string === '' || typeof string !== 'string') {
    return '_';
  } // Create a converter to replace non accepted chars


  var converter = function converter(match) {
    return '_' + match[0].charCodeAt(0).toString(16) + '_';
  }; // Encode the given string and return it


  return string.replace(/[^a-zA-Z0-9-]/g, converter);
}

var string = {
  search: search,
  encodeId: encodeId
};

// Transforms a shallow object with keys separated by "." into a nested object
function getNestedObject(shallowObject) {
  var nestedObject = {};

  for (var key in shallowObject) {
    if (!shallowObject.hasOwnProperty(key)) continue;
    var value = shallowObject[key];
    var propertyArray = key.split('.');
    var currentObject = nestedObject;

    while (propertyArray.length) {
      var currentProperty = propertyArray.shift();

      if (!propertyArray.length) {
        currentObject[currentProperty] = value;
      } else {
        if (!currentObject[currentProperty]) {
          currentObject[currentProperty] = {};
        }

        currentObject = currentObject[currentProperty];
      }
    }
  }

  return nestedObject;
}

function getShallowObject(nestedObject) {
  var shallowObject = {};

  var putValues = function putValues(baseKey, nestedObject, resultObject) {
    for (var key in nestedObject) {
      if (!nestedObject.hasOwnProperty(key)) continue;
      var currentKey = baseKey ? "".concat(baseKey, ".").concat(key) : key;
      var currentValue = nestedObject[key];

      if (_typeof(currentValue) === 'object') {
        if (currentValue instanceof Array) {
          currentKey += '[]';
        }

        putValues(currentKey, currentValue, resultObject);
      } else {
        resultObject[currentKey] = currentValue;
      }
    }
  };

  putValues('', nestedObject, shallowObject);
  return shallowObject;
}
var object = {
  getNestedObject: getNestedObject,
  getShallowObject: getShallowObject
};

var viewer = {};
var OHIF$1 = {
  viewer: viewer,
  utils: utils,
  studies: studies,
  redux: redux,
  classes: classes,
  metadata: metadata,
  hotkeys: hotkeys,
  header: header,
  cornerstone: cornerstone$2,
  string: string,
  ui: ui,
  user: user,
  object: object,
  commands: commands,
  log: log$1,
  external: external,
  DICOMWeb: DICOMWeb
};

export default OHIF$1;
export { viewer, utils, studies, redux, classes, metadata, hotkeys, header, cornerstone$2 as cornerstone, string, ui, user, object, commands, log$1 as log, DICOMWeb, OHIF$1 as OHIF };
//# sourceMappingURL=index.es.js.map
